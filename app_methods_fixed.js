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

    createTournament() {
      if (window.SoundManager) window.SoundManager.play('click');
      this.socket.emit('tournament:create');
    },

    joinTournament() {
      if (window.SoundManager) window.SoundManager.play('click');
      if (!this.joinCode) return;
      this.socket.emit('tournament:join', { code: this.joinCode });
    },

    viewBracket() {
      this.setScreen('tournament-bracket');
    },

    exitTournament() {
      if (window.SoundManager) window.SoundManager.play('click');
      this.tournamentCode = '';
      this.tournamentPlayers = [];
      this.tournamentMatches = [];
      this.tournamentStatus = '';
      this.tournamentChampion = '';
      this.setScreen('lobby');
    },
