/**
 * Handles user authentication/creation and session management.
 * @param {Object} params - The parameters for authentication.
 * @param {Object} params.res - The Express response object.
 * @param {Object} params.userData - User data { displayName, email, providerId, key, providerName }.
 * @param {Object} params.userStore - { User, users, saveUsers, useDB }.
 * @param {Object} params.sessionStore - { sessions, uuidv4 }.
 */
async function handleAuthUser({
  res,
  userData: { displayName, email, providerId, key, providerName },
  userStore: { User, users, saveUsers, useDB },
  sessionStore: { sessions, uuidv4 }
}) {
  try {
    let user;

    if (useDB()) {
      user = await User.findOne({ username: key });
      if (!user) {
        // Create new user in DB
        const newUser = {
          username: key,
          displayName,
          hash: '',
          email,
          wins: 0,
          losses: 0,
          draws: 0
        };

        // Add provider-specific ID field
        if (providerName === 'google') newUser.googleId = providerId;
        if (providerName === 'facebook') newUser.facebookId = providerId;

        user = await User.create(newUser);
      }

      // Update in-memory cache
      users[key] = {
        displayName: user.displayName,
        hash: '',
        wins: user.wins || 0,
        losses: user.losses || 0,
        draws: user.draws || 0,
        email: email
      };

      // Add provider ID to cache
      if (providerName === 'google') users[key].googleId = providerId;
      if (providerName === 'facebook') users[key].facebookId = providerId;

    } else {
      // File-based storage fallback
      if (!users[key]) {
        users[key] = {
          displayName,
          hash: '',
          wins: 0,
          losses: 0,
          draws: 0,
          email,
          createdAt: Date.now()
        };

        // Add provider ID
        if (providerName === 'google') users[key].googleId = providerId;
        if (providerName === 'facebook') users[key].facebookId = providerId;

        saveUsers();
      }
      user = users[key];
    }

    // Create session
    const token = uuidv4();
    sessions.set(token, { key, createdAt: Date.now() });

    res.cookie('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      ok: true,
      token,
      username: user.displayName || displayName,
      stats: {
        wins: user.wins || 0,
        losses: user.losses || 0,
        draws: user.draws || 0
      }
    });

  } catch (e) {
    console.error(`${providerName} auth handling error:`, e);
    res.json({ ok: false, error: 'Authentication processing failed' });
  }
}

module.exports = { handleAuthUser };
