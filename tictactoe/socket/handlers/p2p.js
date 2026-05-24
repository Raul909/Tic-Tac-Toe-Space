const p2pPlayers = new Map(); // socket.id -> { username, ip, socket }

function getClientIp(socket) {
  const forwarded = socket.handshake.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return socket.handshake.address;
}

function notifyNearby(ip, io) {
  const nearby = [];
  p2pPlayers.forEach((player, id) => {
    if (player.ip === ip) {
      nearby.push({
        socketId: id,
        username: player.username
      });
    }
  });

  p2pPlayers.forEach((player, id) => {
    if (player.ip === ip) {
      player.socket.emit('p2p:nearby', nearby.filter(n => n.socketId !== id));
    }
  });
}

module.exports = (socket, context) => {
  const { io } = context;

  socket.on('p2p:discover', (data) => {
    const ip = getClientIp(socket);
    p2pPlayers.set(socket.id, {
      username: data.username || 'Anonymous Astronaut',
      ip: ip,
      socket: socket
    });

    notifyNearby(ip, io);
  });

  socket.on('p2p:invite', (data) => {
    const targetSocketId = data.targetSocketId;
    const target = p2pPlayers.get(targetSocketId);
    const self = p2pPlayers.get(socket.id);
    
    if (target && self) {
      target.socket.emit('p2p:invite-received', {
        fromSocketId: socket.id,
        fromUsername: self.username
      });
    }
  });

  socket.on('p2p:accept', (data) => {
    const targetSocketId = data.targetSocketId;
    const target = p2pPlayers.get(targetSocketId);
    
    if (target) {
      target.socket.emit('p2p:accepted', {
        targetSocketId: socket.id
      });
    }
  });

  socket.on('p2p:signal', (data) => {
    const { targetSocketId, signal } = data;
    const target = p2pPlayers.get(targetSocketId);
    
    if (target) {
      target.socket.emit('p2p:signal', {
        fromSocketId: socket.id,
        signal: signal
      });
    }
  });

  socket.on('p2p:cancel', () => {
    const player = p2pPlayers.get(socket.id);
    if (player) {
      const ip = player.ip;
      p2pPlayers.delete(socket.id);
      notifyNearby(ip, io);
    }
  });

  socket.on('disconnect', () => {
    const player = p2pPlayers.get(socket.id);
    if (player) {
      const ip = player.ip;
      p2pPlayers.delete(socket.id);
      notifyNearby(ip, io);
    }
  });
};
