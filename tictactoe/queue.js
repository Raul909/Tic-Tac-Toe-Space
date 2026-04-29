/**
 * Async stat-write queue.
 *
 * Uses RabbitMQ when RABBITMQ_URL is set, otherwise an in-process
 * async queue so the game loop is never blocked by DB writes.
 *
 * Message shape: { type: 'stat', key, wins, losses, draws }
 */

const QUEUE_NAME = 'stat_writes';

// ── In-process fallback ───────────────────────────────────────────────
class InProcessQueue {
  constructor() {
    this._q = [];
    this._running = false;
  }

  async publish(msg) {
    this._q.push(msg);
    if (!this._running) this._drain();
  }

  async _drain() {
    this._running = true;
    while (this._q.length) {
      const msg = this._q.shift();
      try { await this._handler(msg); } catch (e) { console.error('Queue handler error:', e.message); }
    }
    this._running = false;
  }

  consume(handler) { this._handler = handler; }
}

const fallback = new InProcessQueue();
let channel = null;

async function connect(handler) {
  if (!process.env.RABBITMQ_URL) {
    fallback.consume(handler);
    console.log('ℹ️  No RABBITMQ_URL — using in-process stat queue');
    return;
  }
  try {
    const amqp = require('amqplib');
    const conn = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await conn.createChannel();
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    channel.prefetch(1);
    channel.consume(QUEUE_NAME, async (msg) => {
      if (!msg) return;
      try {
        await handler(JSON.parse(msg.content.toString()));
        channel.ack(msg);
      } catch (e) {
        console.error('Queue consume error:', e.message);
        channel.nack(msg, false, true); // requeue
      }
    });
    console.log('✅ Connected to RabbitMQ');
  } catch (e) {
    console.error('❌ RabbitMQ connection failed:', e.message, '— using in-process queue');
    fallback.consume(handler);
  }
}

async function publish(msg) {
  if (channel) {
    channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(msg)), { persistent: true });
  } else {
    await fallback.publish(msg);
  }
}

module.exports = { connect, publish };
