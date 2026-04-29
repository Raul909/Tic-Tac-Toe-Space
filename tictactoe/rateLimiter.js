// Rate Limiter for Socket.IO events

// Fixed event index map — avoids object key lookup and GC from {} resets
const EVENT_INDEX = {
  'room:create': 0,
  'chat:msg':    1,
  'game:move':   2,
  'room:join':   3,
};
const SPECIFIC_LIMITS = [1, 5, 5, 2]; // indexed by EVENT_INDEX
const SLOT_COUNT = SPECIFIC_LIMITS.length;

class RateLimiter {
  constructor() {
    this.clientLimits = new Map();
    this.WINDOW_MS    = 1000;
    this.GLOBAL_LIMIT = 10;
  }

  check(socketId, eventName) {
    const now = Date.now();
    let client = this.clientLimits.get(socketId);

    if (!client) {
      client = { windowStart: now, count: 0, specific: new Int8Array(SLOT_COUNT) };
      this.clientLimits.set(socketId, client);
    }

    if (now - client.windowStart > this.WINDOW_MS) {
      client.windowStart = now;
      client.count = 0;
      client.specific.fill(0); // O(SLOT_COUNT=4), no GC
    }

    if (client.count >= this.GLOBAL_LIMIT) return false;

    const slot = EVENT_INDEX[eventName];
    if (slot !== undefined) {
      if (client.specific[slot] >= SPECIFIC_LIMITS[slot]) return false;
      client.specific[slot]++;
    }

    client.count++;
    return true;
  }

  cleanup(socketId) {
    this.clientLimits.delete(socketId);
  }
}

const instance = new RateLimiter();
instance.RateLimiter = RateLimiter;
module.exports = instance;
