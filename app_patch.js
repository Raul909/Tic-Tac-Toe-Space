      this.socket.on('game:opponent-left', () => {
        this.gameActive = false;
        this.lobbyError = 'Opponent left the game';
        setTimeout(() => {
          if (this.mode === 'tournament') {
            this.exitTournament();
          } else {
            this.setScreen('lobby');
          }
          this.lobbyError = '';
        }, 2000);
      });

      this.socket.on('tournament:created', ({ code }) => {
        console.log('Tournament created:', code);
        this.tournamentCode = code;
        this.setScreen('tournament-lobby');
      });

      this.socket.on('tournament:update', ({ players, matches, status }) => {
        if (players) this.tournamentPlayers = players;
        if (matches) this.tournamentMatches = matches;
        if (status) this.tournamentStatus = status;
        if (this.screen === 'tournament-lobby' && status === 'semifinals') {
          this.setScreen('tournament-bracket');
        }
      });

      this.socket.on('tournament:start', ({ matches }) => {
        this.tournamentMatches = matches;
        this.tournamentStatus = 'semifinals';
        this.setScreen('tournament-bracket');
        if (window.SoundManager) window.SoundManager.play('start');
      });

      this.socket.on('tournament:champion', ({ champion }) => {
        this.tournamentChampion = champion;
        if (window.SoundManager) window.SoundManager.play('win');
      });
