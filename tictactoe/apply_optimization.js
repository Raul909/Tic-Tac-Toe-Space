const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'server.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add Index
// Look for the end of UserSchema definition
const schemaEnd = 'createdAt: { type: Date, default: Date.now }\n});';
if (!content.includes('UserSchema.index({ wins: -1 });')) {
  content = content.replace(schemaEnd, schemaEnd + '\n\nUserSchema.index({ wins: -1 });');
  console.log('Added UserSchema index.');
} else {
  console.log('UserSchema index already exists.');
}

// 2. Update Leaderboard Endpoint
const oldEndpoint = `app.get('/api/leaderboard', apiLimiter, (req, res) => {
  const now = Date.now();
  if (cachedLeaderboard && (now - lastLeaderboardUpdate < LEADERBOARD_CACHE_TTL)) {
    return res.json(cachedLeaderboard);
  }

  const board = Object.values(users)
    .map(u => ({ name: u.displayName, wins: u.wins, losses: u.losses, draws: u.draws }))
    .sort((a, b) => b.wins - a.wins)
    .slice(0, 10);

  cachedLeaderboard = board;
  lastLeaderboardUpdate = now;
  res.json(board);
});`;

const newEndpoint = `app.get('/api/leaderboard', apiLimiter, async (req, res) => {
  const now = Date.now();
  if (cachedLeaderboard && (now - lastLeaderboardUpdate < LEADERBOARD_CACHE_TTL)) {
    return res.json(cachedLeaderboard);
  }

  let board;
  if (useDB()) {
    try {
      const topUsers = await User.find({}, 'displayName wins losses draws').sort({ wins: -1 }).limit(10).lean();
      board = topUsers.map(u => ({ name: u.displayName, wins: u.wins, losses: u.losses, draws: u.draws }));
    } catch (err) {
      console.error('Leaderboard DB error:', err);
      // Fallback
      board = Object.values(users)
        .map(u => ({ name: u.displayName, wins: u.wins, losses: u.losses, draws: u.draws }))
        .sort((a, b) => b.wins - a.wins)
        .slice(0, 10);
    }
  } else {
    // In-memory fallback
    board = Object.values(users)
      .map(u => ({ name: u.displayName, wins: u.wins, losses: u.losses, draws: u.draws }))
      .sort((a, b) => b.wins - a.wins)
      .slice(0, 10);
  }

  cachedLeaderboard = board;
  lastLeaderboardUpdate = now;
  res.json(board);
});`;

if (content.includes("app.get('/api/leaderboard', apiLimiter, (req, res) => {")) {
  // We use a more flexible replacement strategy or direct string replace if exact match
  // Since we have the exact file content from previous read, exact replace should work
  // IF the indentation matches exactly.

  // Let's try to match the body more loosely if exact string fails,
  // but for now, let's try exact replace as the `read_file` output should match.
  // Note: formatting in `oldEndpoint` string above must match `read_file` output exactly.

  if (content.indexOf(oldEndpoint) !== -1) {
      content = content.replace(oldEndpoint, newEndpoint);
      console.log('Updated leaderboard endpoint.');
  } else {
      console.log('Could not find exact match for leaderboard endpoint. Attempting regex replacement...');
      // Regex fallback
      const regex = /app\.get\('\/api\/leaderboard', apiLimiter, \(req, res\) => \{[\s\S]*?res\.json\(board\);\n\}\);/m;
      if (regex.test(content)) {
          content = content.replace(regex, newEndpoint);
          console.log('Updated leaderboard endpoint via regex.');
      } else {
          console.error('Failed to find leaderboard endpoint code block.');
      }
  }
} else {
  console.log('Leaderboard endpoint start not found or already modified.');
}

fs.writeFileSync(filePath, content);
console.log('Done.');
