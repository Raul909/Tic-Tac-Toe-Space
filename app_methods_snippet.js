
    async fetchLeaderboard() {
      try {
        const res = await fetch('/api/leaderboard');
        this.leaderboard = await res.json();
      } catch (e) {
        console.error('Failed to fetch leaderboard', e);
      }
    },

    openLeaderboard() {
      if (window.SoundManager) window.SoundManager.play('click');
      this.fetchLeaderboard();
      this.setScreen('leaderboard');
    },

    closeLeaderboard() {
      if (window.SoundManager) window.SoundManager.play('click');
      this.setScreen('lobby');
    },
