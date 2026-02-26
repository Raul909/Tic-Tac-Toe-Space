
// ── TOURNAMENT HELPERS ────────────────────────────────────────────────
function startTournament(t) {
  t.status = 'semifinals';
  // Shuffle players
  t.players.sort(() => Math.random() - 0.5);

  // Define Matches: 0 vs 1, 2 vs 3
  t.matches = [
    { id: 1, p1: 0, p2: 1, winner: null },
    { id: 2, p1: 2, p2: 3, winner: null },
    { id: 3, p1: null, p2: null, winner: null } // Final
  ];

  // Notify Start
  io.to(t.code).emit('tournament:start', { matches: t.matches, players: t.players.map(p => p.name) });

  // Create Rooms for Semifinals
  createMatchRoom(t, 0); // Match 1
  createMatchRoom(t, 1); // Match 2
}

function createMatchRoom(t, matchIndex) {
  const match = t.matches[matchIndex];
  if (match.p1 === null || match.p2 === null) return;

  const p1 = t.players[match.p1];
  const p2 = t.players[match.p2];

  const code = `${t.code}-${match.id}`;
  const room = {
    code,
    players: [
      { socketId: p1.socketId, key: p1.key, name: p1.name, symbol: 'X' },
      { socketId: p2.socketId, key: p2.key, name: p2.name, symbol: 'O' }
    ],
    board: Array(9).fill(null),
    currentTurn: 'X',
    status: 'playing',
    scores: { X: 0, O: 0, D: 0 },
    tournamentId: t.code,
    matchId: match.id
  };

  rooms.set(code, room);

  // Force sockets to join room
  const s1 = io.sockets.sockets.get(p1.socketId);
  const s2 = io.sockets.sockets.get(p2.socketId);

  if (s1) {
    s1.leave(t.code); // Leave lobby channel? No, keep for updates.
    s1.join(code);
    socketRoom.set(p1.socketId, code);
    s1.emit('room:joined', { code, symbol: 'X' });
  }
  if (s2) {
    s2.join(code);
    socketRoom.set(p2.socketId, code);
    s2.emit('room:joined', { code, symbol: 'O' });
  }

  io.to(code).emit('game:start', {
    board: room.board,
    currentTurn: room.currentTurn,
    players: room.players.map(p => ({ name: p.name, symbol: p.symbol })),
    scores: room.scores
  });
}

function handleTournamentResult(room, result) {
  if (!room.tournamentId) return;
  const t = tournaments.get(room.tournamentId);
  if (!t) return;

  const match = t.matches.find(m => m.id === room.matchId);
  if (!match || match.winner !== null) return;

  let winnerIndex = -1;
  if (result.winner) {
    const winnerPlayer = room.players.find(p => p.symbol === result.winner);
    winnerIndex = t.players.findIndex(p => p.key === winnerPlayer.key);
  } else {
    // Draw -> Random
    const coin = Math.random() > 0.5 ? 'X' : 'O';
    const winnerPlayer = room.players.find(p => p.symbol === coin);
    winnerIndex = t.players.findIndex(p => p.key === winnerPlayer.key);
    io.to(room.code).emit('chat:msg', { from: 'SYSTEM', text: 'Draw! Coin flip winner: ' + winnerPlayer.name, ts: Date.now() });
  }

  match.winner = winnerIndex;

  // Return players to lobby channel for updates
  const mP1 = t.players[match.p1];
  const mP2 = t.players[match.p2];
  // Note: They are already in t.code channel.

  updateBracket(t);
}

function updateBracket(t) {
  io.to(t.code).emit('tournament:update', { matches: t.matches, status: t.status });

  const m1 = t.matches[0];
  const m2 = t.matches[1];
  const final = t.matches[2];

  if (m1.winner !== null && m2.winner !== null && final.p1 === null) {
    // Both semis done, start final
    final.p1 = m1.winner;
    final.p2 = m2.winner;
    t.status = 'final';

    io.to(t.code).emit('tournament:update', { matches: t.matches, status: t.status });

    setTimeout(() => {
      createMatchRoom(t, 2); // Match 3 (Final)
    }, 2000);

  } else if (final.winner !== null && t.status !== 'completed') {
    t.status = 'completed';
    const champion = t.players[final.winner];
    io.to(t.code).emit('tournament:champion', { champion: champion.name });
  }
}
