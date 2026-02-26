  // ── TOURNAMENT ──
  socket.on('tournament:create', () => {
    const key = socketUser.get(socket.id);
    if (!key) return socket.emit('error', 'Not authenticated');
    leaveCurrentRoom(socket);

    const code = generateRoomCode(tournaments);
    const t = {
      code,
      players: [{ socketId: socket.id, key, name: users[key].displayName }],
      matches: [],
      status: 'waiting'
    };
    tournaments.set(code, t);
    socketRoom.set(socket.id, code);

    socket.join(code);
    socket.emit('tournament:created', { code });
    socket.emit('tournament:update', { players: t.players, status: t.status });
  });

  socket.on('tournament:join', ({ code }) => {
    const key = socketUser.get(socket.id);
    if (!key) return socket.emit('error', 'Not authenticated');

    const tCode = code.toUpperCase().trim();
    const t = tournaments.get(tCode);
    if (!t) return socket.emit('error', 'Tournament not found');
    if (t.status !== 'waiting') return socket.emit('error', 'Tournament started');
    if (t.players.length >= 4) return socket.emit('error', 'Tournament full');

    leaveCurrentRoom(socket);

    t.players.push({ socketId: socket.id, key, name: users[key].displayName });
    socketRoom.set(socket.id, tCode);
    socket.join(tCode);

    io.to(tCode).emit('tournament:update', { players: t.players, status: t.status });

    if (t.players.length === 4) {
      startTournament(t);
    }
  });
