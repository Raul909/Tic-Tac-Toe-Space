// Main Alpine.js Application
function app() {
  return {
    screen: 'home',
    authTab: 'login',
    socket: null,
    user: { 
      username: '', 
      stats: { wins: 0, draws: 0, losses: 0, gamesPlayed: 0, winStreak: 0, bestStreak: 0 },
      achievements: [],
      profile: { avatar: 'astronaut', symbol: 'default', theme: 'space', banner: 'nebula', soundPack: 'scifi' },
      elo: 1000,
      rank: 'Cadet',
      friends: []
    },
    aiDifficulty: 'normal',
    
    // Profile & Customization
    showProfile: false,
    showAchievements: false,
    showStats: false,
    showFriends: false,
    showSettings: false,
    avatars: ['astronaut', 'alien', 'robot', 'satellite', 'comet'],
    symbols: ['default', 'star', 'planet', 'rocket', 'galaxy'],
    themes: ['space', 'mars', 'moon', 'jupiter', 'nebula'],
    banners: ['nebula', 'galaxy', 'aurora', 'supernova', 'blackhole'],
    soundPacks: ['scifi', 'retro', 'realistic', 'minimal'],
    
    // Social Features
    friendRequest: '',
    onlinePlayers: [],
    chatMessages: [],
    chatInput: '',
    emotes: ['👍', '😄', '🚀', '⭐', '🔥', '💯', '🎯', '👏'],
    
    // Accessibility
    highContrast: false,
    colorblindMode: false,
    keyboardNav: false,
    
    // Achievements
    achievements: [
      { id: 'first_orbit', name: 'First Orbit', desc: 'Win your first game', icon: '🛸', unlocked: false },
      { id: 'constellation_master', name: 'Constellation Master', desc: 'Win 10 games', icon: '✨', unlocked: false, progress: 0, target: 10 },
      { id: 'black_hole', name: 'Black Hole', desc: 'Win without opponent scoring', icon: '🕳️', unlocked: false },
      { id: 'supernova', name: 'Supernova', desc: 'Win 5 games in a row', icon: '💥', unlocked: false, progress: 0, target: 5 },
      { id: 'speed_demon', name: 'Speed Demon', desc: 'Win a blitz match under 30s', icon: '⚡', unlocked: false },
      { id: 'explorer', name: 'Space Explorer', desc: 'Visit all space environments', icon: '🌌', unlocked: false, progress: 0, target: 5 },
      { id: 'social_butterfly', name: 'Social Butterfly', desc: 'Add 5 friends', icon: '🦋', unlocked: false, progress: 0, target: 5 },
      { id: 'ranked_warrior', name: 'Ranked Warrior', desc: 'Reach 1500 ELO', icon: '⚔️', unlocked: false }
    ],
    
    // Game Modes
    gameMode: 'classic', // classic, blitz, ranked, educational
    boardSize: 3, // 3, 4, 5
    boardTheme: 'space',
    timeLimit: 0,
    seriesMode: false,
    seriesScore: { player: 0, opponent: 0, target: 3 },
    
    // Statistics
    cellHeatmap: Array(9).fill(0),
    gameHistory: [],
    avgGameDuration: 0,
    
    // Educational Mode
    educationalMode: false,
    spaceQuiz: null,
    quizScore: 0,
    explorerRank: 'Cadet',
    spaceFact: '',
    spaceFacts: [
      "The Sun accounts for 99.86% of the mass in our solar system!",
      "A day on Venus is longer than its year - it takes 243 Earth days to rotate once!",
      "Jupiter's Great Red Spot is a storm that has been raging for over 400 years.",
      "Saturn's rings are made of billions of pieces of ice and rock.",
      "Mars has the largest volcano in the solar system - Olympus Mons, 3x taller than Mt. Everest!",
      "Neptune has winds that blow at over 1,200 mph - the fastest in the solar system!",
      "There are more stars in the universe than grains of sand on all Earth's beaches.",
      "A neutron star is so dense that a teaspoon of it would weigh 6 billion tons!",
      "The Milky Way galaxy is on a collision course with Andromeda galaxy.",
      "Light from the Sun takes 8 minutes and 20 seconds to reach Earth.",
      "The footprints on the Moon will last for millions of years due to no wind or water.",
      "One million Earths could fit inside the Sun.",
      "Venus rotates backwards compared to other planets.",
      "A year on Mercury is just 88 Earth days.",
      "The coldest place in the universe is the Boomerang Nebula at -272°C.",
      "Black holes can spin at nearly the speed of light.",
      "The universe is expanding faster than the speed of light.",
      "There are more than 100 billion galaxies in the observable universe.",
      "Neutron stars can spin 600 times per second.",
      "The largest known star is UY Scuti, 1,700 times larger than the Sun."
    ],
    spaceFactsAPI: [],
    spaceFactLastFetch: null,
    
    // Blitz Mode
    timeRemaining: 60,
    timerInterval: null,
    
    // Auth
    loginForm: { username: '', password: '' },
    registerForm: { username: '', password: '' },
    loginError: '',
    registerError: '',
    loginLoading: false,
    registerLoading: false,
    guestLoading: false,
    
    // Lobby
    joinCode: '',
    lobbyError: '',
    leaderboard: [],
    tournamentCode: '',
    tournamentPlayers: [],
    tournamentMatches: [],
    tournamentStatus: '',
    tournamentChampion: '',
    
    // Game
    roomCode: '',
    mySymbol: '',
    board: Array(9).fill(null),
    currentTurn: 'X',
    gameActive: false,
    scores: { X: 0, O: 0, D: 0 },
    gameStatus: '',
    gameOver: false,
    gameOverTitle: '',
    gameOverSubtitle: '',
    gameOverEmoji: '',
    mode: '',
    shareCopied: false,
    muted: false,
    toggleMute() { this.muted = window.SoundManager.toggleMute(); },
    
    // Space Gallery
    spaceTab: 'solar',
    spaceZoom: 1,
    spaceSpeed: 1,
    selectedObject: null,
    
    // Weather & UI Presets
    weather: 'clear',
    weatherPreset: 'default',
    
    // Cinematic Helper
    setScreen(screenName) {
      console.log('📺 setScreen called:', screenName, 'current:', this.screen);
      if (this.screen === screenName) return; 
      this.screen = screenName;
      console.log('✅ Screen changed to:', this.screen);
      
      // Auto-login if going to auth screen and token exists
      if (screenName === 'auth') {
        const token = localStorage.getItem('token');
        console.log('🔑 Token check:', token ? 'Found' : 'Not found');
        if (token && !this.socket) {
          console.log('🔌 Auto-connecting with token...');
          this.connectSocket(token);
        }
      }
      
      if (window.CinematicSpace && typeof window.CinematicSpace.triggerWarp === 'function') {
        window.CinematicSpace.triggerWarp();
      }
    },

    init() {
      console.log('🚀 App initializing... screen:', this.screen);
      // Don't auto-connect - let user see landing page first
      this.initSpaceGallery();
      this.initGoogleSignIn();
      this.initWeatherSync();
      
      // Load saved stats and achievements
      this.loadStats();
      
      // Load accessibility settings
      this.loadAccessibilitySettings();
      
      // Fetch space facts from API
      this.fetchSpaceFacts();
      
      console.log('✅ Init complete, screen:', this.screen);
      
      // Watch for zoom and speed changes
      this.$watch('spaceZoom', value => {
        if (window.SpaceGallery) window.SpaceGallery.zoom = parseFloat(value);
      });
      this.$watch('spaceSpeed', value => {
        if (window.SpaceGallery) window.SpaceGallery.speed = parseFloat(value);
      });
      
      // Watch for accessibility changes
      this.$watch('highContrast', value => {
        document.body.classList.toggle('high-contrast', value);
        localStorage.setItem('highContrast', value);
      });
      this.$watch('colorblindMode', value => {
        document.body.classList.toggle('colorblind', value);
        localStorage.setItem('colorblindMode', value);
      });
      this.$watch('keyboardNav', value => {
        if (value) this.enableKeyboardNav();
      });
    },

    initWeatherSync() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            this.fetchWeather(pos.coords.latitude, pos.coords.longitude);
          },
          () => this.applyWeatherPreset('clear')
        );
      } else {
        this.applyWeatherPreset('clear');
      }
    },

    async fetchWeather(lat, lon) {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`;
        const res = await fetch(url);
        const data = await res.json();
        const code = data.current.weather_code;
        
        let weather = 'clear';
        if (code >= 71 && code <= 77) weather = 'snow';
        else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 99)) weather = 'rain';
        else if (code >= 1 && code <= 48) weather = 'cloudy';
        
        this.applyWeatherPreset(weather);
      } catch (e) {
        this.applyWeatherPreset('clear');
      }
    },

    applyWeatherPreset(weather) {
      this.weather = weather;
      const presets = {
        clear: { name: 'default', fog: 0.0003, starDensity: 1, planetGlow: 1 },
        cloudy: { name: 'misty', fog: 0.0008, starDensity: 0.6, planetGlow: 0.7 },
        rain: { name: 'storm', fog: 0.0012, starDensity: 0.4, planetGlow: 0.5 },
        snow: { name: 'frozen', fog: 0.0006, starDensity: 0.8, planetGlow: 0.9 }
      };
      
      this.weatherPreset = presets[weather].name;
      if (window.CinematicSpace) {
        window.CinematicSpace.applyWeatherPreset(presets[weather]);
      }
    },
    
    initGoogleSignIn() {
      // Load Google Sign-In script
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      
      // Load Facebook SDK
      window.fbAsyncInit = function() {
        FB.init({
          appId: window.FACEBOOK_APP_ID || 'YOUR_FACEBOOK_APP_ID',
          cookie: true,
          xfbml: true,
          version: 'v18.0'
        });
      };
      
      const fbScript = document.createElement('script');
      fbScript.src = 'https://connect.facebook.net/en_US/sdk.js';
      fbScript.async = true;
      fbScript.defer = true;
      document.head.appendChild(fbScript);
    },
    
    connectSocket(token) {
      this.socket = io({ autoConnect: true, reconnectionAttempts: 5, withCredentials: true });
      
      this.socket.on('connect', () => {
        this.socket.emit('auth', { token });
      });
      
      this.socket.on('auth:ok', (data) => {
        window.SoundManager.play('start');
        this.user = { username: data.username, stats: data.stats };
      if (this.mode === 'tournament') {
        this.exitTournament();
      } else {
        this.setScreen('lobby');
      }
      });
      
      this.socket.on('game:rejoin', (data) => { this.roomCode = data.code; this.board = data.board; this.currentTurn = data.currentTurn; this.scores = data.scores; this.mySymbol = data.mySymbol; this.gameActive = true; this.mode = (data.room && data.room.tournamentId) ? 'tournament' : 'online'; this.setScreen('game'); this.updateGameStatus(); this.clearWinningCells(); if (window.SoundManager) window.SoundManager.play('start'); this.lobbyError = ''; }); this.socket.on('game:opponent-disconnected', ({ key }) => { this.lobbyError = 'Opponent disconnected. Waiting for reconnection...'; }); this.socket.on('game:opponent-reconnected', ({ name }) => { this.lobbyError = ''; if (window.SoundManager) window.SoundManager.play('start'); }); this.socket.on('auth:error', () => {
        localStorage.removeItem('token');
        this.setScreen('auth');
      });
      
      this.socket.on('room:created', ({ code, symbol }) => {
        this.roomCode = code;
        this.mySymbol = symbol;
        this.setScreen('waiting');
      });
      
      this.socket.on('room:joined', ({ code, symbol }) => {
        this.roomCode = code;
        this.mySymbol = symbol;
      });
      
      this.socket.on('room:error', (msg) => {
        this.lobbyError = msg;
        setTimeout(() => this.lobbyError = '', 3000);
      });
      
      this.socket.on('game:start', (data) => {
        this.clearWinningCells();
        window.SoundManager.play('start');
        this.board = data.board;
        this.currentTurn = data.currentTurn;
        this.scores = data.scores;
        this.gameActive = true;
        this.mode = data.tournamentMatch ? 'tournament' : 'online';
        this.setScreen('game');
        this.updateGameStatus();
      });
      
      this.socket.on('game:move', ({ index, symbol }) => {
        this.board[index] = symbol;
        window.SoundManager.play('move');
      });
      
      this.socket.on('game:turn', ({ currentTurn }) => {
        this.currentTurn = currentTurn;
        this.updateGameStatus();
      });
      
      this.socket.on('game:over', ({ winner, draw, scores, line }) => {
        this.scores = scores;
        this.gameActive = false;
        
        if (line) {
          this.animateWinningLine(line);
          setTimeout(() => {
            this.showGameOver(winner, draw);
            if (winner) {
              const color = winner === 'X' ? '#ff6b35' : '#4dffdb';
              if (window.FW) window.FW.launch(color, color);
            }
          }, 500);
        } else {
          this.showGameOver(winner, draw);
        }
      });
      
      this.socket.on('game:rematch-request', ({ from }) => {
        console.log(`${from} wants a rematch`);
      });
      
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
    },
    handleAuthSuccess(data) {
      localStorage.setItem('token', data.token);
      this.user = { username: data.username, stats: data.stats };
      this.connectSocket(data.token);
    },

    async performAuth(type) {
      const isLogin = type === 'login';
      const form = isLogin ? this.loginForm : this.registerForm;
      const errorProp = isLogin ? 'loginError' : 'registerError';
      const loadingProp = isLogin ? 'loginLoading' : 'registerLoading';
      const endpoint = isLogin ? '/api/login' : '/api/register';

      this[errorProp] = '';
      if (!form.username || !form.password) {
        this[errorProp] = 'Please fill all fields';
        return;
      }
      
      this[loadingProp] = true;
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(form)
        });
        const data = await res.json();
        
        if (data.ok) {
          this.handleAuthSuccess(data);
        } else {
          this[errorProp] = data.error;
        }
      } catch (e) {
        this[errorProp] = 'Connection error';
      }
      this[loadingProp] = false;
    },

    async login() {
      await this.performAuth('login');
    },
    
    async register() {
      await this.performAuth('register');
    },
    
    async guestLogin() {
      this.guestLoading = true;
      try {
        // Generate guest ID like PUBG/CODM: Guest_XXXX
        const guestId = 'Guest_' + Math.random().toString(36).substring(2, 6).toUpperCase();
        const guestPassword = Math.random().toString(36).substring(2, 15);
        
        // Auto-register guest account
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ 
            username: guestId, 
            password: guestPassword,
            isGuest: true 
          })
        });
        const data = await res.json();
        
        if (data.ok) {
          // Store guest credentials for this session
          localStorage.setItem('guestId', guestId);
          localStorage.setItem('guestPassword', guestPassword);
          this.handleAuthSuccess(data);
        } else {
          // If guest ID exists, try another one
          if (data.error.includes('exists')) {
            this.guestLogin(); // Retry with new ID
          } else {
            alert('Guest login failed. Please try again.');
          }
        }
      } catch (e) {
        alert('Connection error. Please try again.');
      }
      this.guestLoading = false;
    },
    
    logout() {
      localStorage.removeItem('token');
      if (this.socket) this.socket.disconnect();
      this.setScreen('auth');
      this.user = { username: '', stats: { wins: 0, draws: 0, losses: 0 } };
    },
    
    loginWithGoogle() {
      // Initialize Google Sign-In
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: window.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
          callback: (response) => this.handleGoogleCallback(response)
        });
        
        window.google.accounts.id.prompt();
      } else {
        alert('Google Sign-In is loading... Please try again in a moment.');
      }
    },
    
    async handleGoogleCallback(response) {
      try {
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ credential: response.credential })
        });
        
        const data = await res.json();
        
        if (data.ok) {
          this.handleAuthSuccess(data);
        } else {
          this.loginError = data.error || 'Google sign-in failed';
        }
      } catch (e) {
        this.loginError = 'Connection error';
      }
    },
    
    loginWithFacebook() {
      if (!window.FB) {
        alert('Facebook SDK is loading... Please try again in a moment.');
        return;
      }
      
      FB.login((response) => {
        if (response.authResponse) {
          this.handleFacebookCallback(response.authResponse);
        } else {
          this.loginError = 'Facebook login cancelled';
        }
      }, { scope: 'public_profile,email' });
    },
    
    async handleFacebookCallback(authResponse) {
      try {
        const res = await fetch('/api/auth/facebook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ 
            accessToken: authResponse.accessToken,
            userID: authResponse.userID
          })
        });
        
        const data = await res.json();
        
        if (data.ok) {
          this.handleAuthSuccess(data);
        } else {
          this.loginError = data.error || 'Facebook sign-in failed';
        }
      } catch (e) {
        this.loginError = 'Connection error';
      }
    },
    
    createRoom() {
      this.lobbyError = '';
      this.socket.emit('room:create');
    },
    
    joinRoom() {
      const code = this.joinCode.trim().toUpperCase();
      if (code.length !== 4) {
        this.lobbyError = 'Code must be 4 characters';
        return;
      }
      this.lobbyError = '';
      this.socket.emit('room:join', { code });
    },
    
    cancelWaiting() {
      if (this.roomCode) {
        this.socket.emit('room:leave', { code: this.roomCode });
      }
      if (this.mode === 'tournament') {
        this.exitTournament();
      } else {
        this.setScreen('lobby');
      }
    },
    
    copyRoomCode() {
      navigator.clipboard.writeText(this.roomCode);
    },
    
    setDifficulty(level) {
      this.aiDifficulty = level;
      if (window.SoundManager) window.SoundManager.play('click');
    },

    startAI() {
      this.clearWinningCells();
      this.stopBlitzTimer();
      this.mode = 'ai';
      this.mySymbol = 'X';
      const size = this.boardSize * this.boardSize;
      this.board = Array(size).fill(null);
      this.currentTurn = 'X';
      this.gameActive = true;
      this.gameStartTime = Date.now();
      this.scores = { X: 0, O: 0, D: 0 };
      
      if (this.gameMode === 'blitz') {
        this.startBlitzTimer();
      }
      
      if (this.gameMode === 'educational') {
        this.showRandomSpaceFact();
      }
      
      this.setScreen('game');
      this.updateGameStatus();
    },
    
    canMove(index) {
      return this.gameActive && !this.board[index] && 
             (this.mode === 'ai' ? this.currentTurn === 'X' : this.currentTurn === this.mySymbol);
    },
    
    makeMove(index) {
      if (!this.canMove(index)) return;
      window.SoundManager.play('click');
      
      if (this.mode === 'ai') {
        this.board[index] = 'X';
        const winLine = this.checkWin('X');
        if (winLine) {
          this.scores.X++;
          this.animateWinningLine(winLine);
          setTimeout(() => this.showGameOver('X', false), 500);
          return;
        }
        if (this.board.every(c => c)) {
          this.scores.D++;
          this.showGameOver(null, true);
          return;
        }
        this.currentTurn = 'O';
        setTimeout(() => this.aiMove(), 500);
      } else {
        this.socket.emit('game:move', { code: this.roomCode, index });
      }
    },
    
    aiMove() {
      const move = GameLogic.getBestMove(this.board, this.aiDifficulty);
      if (move !== -1) {
        this.board[move] = 'O';
        const winLine = this.checkWin('O');
        if (winLine) {
          this.scores.O++;
          this.animateWinningLine(winLine);
          setTimeout(() => this.showGameOver('O', false), 500);
          return;
        }
        if (this.board.every(c => c)) {
          this.scores.D++;
          this.showGameOver(null, true);
          return;
        }
        this.currentTurn = 'X';
      }
    },
    
    checkWin(player) {
      return GameLogic.checkWin(this.board, player);
    },
    
    clearWinningCells() {
      document.querySelectorAll('.winning-cell').forEach(cell => {
        cell.classList.remove('winning-cell');
        cell.style.animation = '';
      });
      const svg = document.getElementById('winning-line');
      if (svg) {
        svg.classList.remove('active');
        const line = document.getElementById('win-line');
        if (line) {
          line.setAttribute('x1', '0');
          line.setAttribute('y1', '0');
          line.setAttribute('x2', '0');
          line.setAttribute('y2', '0');
        }
      }
    },

    animateWinningLine(line) {
      line.forEach((index, i) => {
        setTimeout(() => {
          const cell = document.querySelector(`[data-cell-index="${index}"]`);
          if (cell) {
            cell.classList.add('winning-cell');
            cell.style.animation = 'winPulse 0.6s ease-in-out';
          }
        }, i * 100);
      });

      setTimeout(() => this.drawWinningLine(line), 300);
    },

    drawWinningLine(line) {
      const board = document.getElementById('game-board');
      const svg = document.getElementById('winning-line');
      const svgLine = document.getElementById('win-line');
      if (!board || !svg || !svgLine) return;

      const cells = line.map(i => document.querySelector(`[data-cell-index="${i}"]`));
      if (!cells[0] || !cells[2]) return;

      const boardRect = board.getBoundingClientRect();
      const firstRect = cells[0].getBoundingClientRect();
      const lastRect = cells[2].getBoundingClientRect();

      const x1 = firstRect.left + firstRect.width / 2 - boardRect.left;
      const y1 = firstRect.top + firstRect.height / 2 - boardRect.top;
      const x2 = lastRect.left + lastRect.width / 2 - boardRect.left;
      const y2 = lastRect.top + lastRect.height / 2 - boardRect.top;

      const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

      svgLine.setAttribute('x1', x1);
      svgLine.setAttribute('y1', y1);
      svgLine.setAttribute('x2', x1);
      svgLine.setAttribute('y2', y1);
      svgLine.style.strokeDasharray = length;
      svgLine.style.strokeDashoffset = length;

      svg.classList.add('active');

      requestAnimationFrame(() => {
        svgLine.setAttribute('x2', x2);
        svgLine.setAttribute('y2', y2);
        svgLine.style.transition = 'stroke-dashoffset 0.6s ease-out';
        svgLine.style.strokeDashoffset = '0';
      });
    },
    
    updateGameStatus() {
      if (this.mode === 'ai') {
        this.gameStatus = this.currentTurn === 'X' ? 'YOUR TURN' : 'AI THINKING...';
      } else {
        this.gameStatus = this.currentTurn === this.mySymbol ? 'YOUR TURN' : 'OPPONENT TURN';
      }
    },
    
    showGameOver(winner, draw) {
      this.gameActive = false;
      this.gameOver = true;
      
      // Show random space fact
      this.showRandomSpaceFact();
      
      // Track statistics
      this.user.stats.gamesPlayed++;
      const gameEndTime = Date.now();
      const gameDuration = (gameEndTime - (this.gameStartTime || gameEndTime)) / 1000;
      this.gameHistory.push({ winner, draw, duration: gameDuration, board: [...this.board], timestamp: gameEndTime });
      
      if (draw) {
        window.SoundManager.play('draw'); this.gameOverEmoji = '🤝';
        this.gameOverTitle = 'STANDOFF';
        this.gameOverSubtitle = 'MISSION DRAW';
        this.user.stats.draws++;
        this.user.stats.winStreak = 0;
      } else if (winner === this.mySymbol || (this.mode === 'ai' && winner === 'X')) {
        window.SoundManager.play('win'); this.gameOverEmoji = '🏆';
        this.gameOverTitle = 'MISSION COMPLETE';
        this.gameOverSubtitle = 'VICTORY ACHIEVED';
        this.user.stats.wins++;
        this.user.stats.winStreak++;
        this.user.stats.bestStreak = Math.max(this.user.stats.bestStreak, this.user.stats.winStreak);
        this.checkAchievements(winner, draw);
      } else {
        window.SoundManager.play('lose'); this.gameOverEmoji = '❌';
        this.gameOverTitle = 'MISSION FAILED';
        this.gameOverSubtitle = this.mode === 'ai' ? 'AI VICTORY' : 'DEFEAT';
        this.user.stats.losses++;
        this.user.stats.winStreak = 0;
      }
      
      this.updateRank();
      this.saveStats();
    },

    checkAchievements(winner, draw) {
      const newAchievements = [];
      
      // First Orbit
      if (this.user.stats.wins === 1 && !this.achievements[0].unlocked) {
        this.achievements[0].unlocked = true;
        newAchievements.push(this.achievements[0]);
      }
      
      // Constellation Master
      if (this.user.stats.wins >= 10 && !this.achievements[1].unlocked) {
        this.achievements[1].unlocked = true;
        this.achievements[1].progress = this.user.stats.wins;
        newAchievements.push(this.achievements[1]);
      } else if (this.user.stats.wins < 10) {
        this.achievements[1].progress = this.user.stats.wins;
      }
      
      // Black Hole (opponent didn't score)
      const opponentSymbol = this.mySymbol === 'X' ? 'O' : 'X';
      if (!this.board.includes(opponentSymbol) && !this.achievements[2].unlocked) {
        this.achievements[2].unlocked = true;
        newAchievements.push(this.achievements[2]);
      }
      
      // Supernova
      if (this.user.stats.winStreak >= 5 && !this.achievements[3].unlocked) {
        this.achievements[3].unlocked = true;
        newAchievements.push(this.achievements[3]);
      } else {
        this.achievements[3].progress = this.user.stats.winStreak;
      }
      
      // Show achievement notifications
      if (newAchievements.length > 0) {
        this.showAchievementNotification(newAchievements);
      }
    },

    showAchievementNotification(achievements) {
      achievements.forEach((ach, i) => {
        setTimeout(() => {
          const notif = document.createElement('div');
          notif.className = 'fixed top-20 right-4 glass nasa-bracket rounded-lg p-4 z-50 animate-bounce';
          notif.innerHTML = `
            <div class="text-nasa font-bold mb-1">🏆 ACHIEVEMENT UNLOCKED!</div>
            <div class="flex items-center gap-3">
              <div class="text-4xl">${ach.icon}</div>
              <div>
                <div class="font-bold">${ach.name}</div>
                <div class="text-xs text-gray-400">${ach.desc}</div>
              </div>
            </div>
          `;
          document.body.appendChild(notif);
          setTimeout(() => notif.remove(), 4000);
        }, i * 500);
      });
    },

    updateRank() {
      const wins = this.user.stats.wins;
      if (wins >= 100) this.explorerRank = 'Galactic Commander';
      else if (wins >= 50) this.explorerRank = 'Star Captain';
      else if (wins >= 25) this.explorerRank = 'Space Pilot';
      else if (wins >= 10) this.explorerRank = 'Navigator';
      else if (wins >= 5) this.explorerRank = 'Astronaut';
      else this.explorerRank = 'Cadet';
      
      this.user.rank = this.explorerRank;
    },

    saveStats() {
      localStorage.setItem('userStats', JSON.stringify({
        stats: this.user.stats,
        achievements: this.achievements,
        profile: this.user.profile,
        rank: this.user.rank,
        gameHistory: this.gameHistory.slice(-50) // Keep last 50 games
      }));
    },

    loadStats() {
      const saved = localStorage.getItem('userStats');
      if (saved) {
        const data = JSON.parse(saved);
        this.user.stats = data.stats || this.user.stats;
        this.achievements = data.achievements || this.achievements;
        this.user.profile = data.profile || this.user.profile;
        this.user.rank = data.rank || this.user.rank;
        this.gameHistory = data.gameHistory || [];
        this.explorerRank = this.user.rank;
      }
    },

    updateProfile(field, value) {
      this.user.profile[field] = value;
      this.saveStats();
    },

    getThemeStyle() {
      const themes = {
        space: 'background: radial-gradient(circle, rgba(0,5,16,0.9) 0%, rgba(0,20,40,0.95) 100%);',
        mars: 'background: radial-gradient(circle, rgba(139,69,19,0.3) 0%, rgba(205,92,92,0.2) 100%);',
        moon: 'background: radial-gradient(circle, rgba(200,200,200,0.2) 0%, rgba(150,150,150,0.1) 100%);',
        jupiter: 'background: radial-gradient(circle, rgba(200,143,58,0.3) 0%, rgba(139,90,43,0.2) 100%);',
        nebula: 'background: radial-gradient(circle, rgba(138,43,226,0.3) 0%, rgba(75,0,130,0.2) 100%);'
      };
      return themes[this.boardTheme] || themes.space;
    },

    startBlitzTimer() {
      this.timeRemaining = 60;
      this.timerInterval = setInterval(() => {
        this.timeRemaining--;
        if (this.timeRemaining <= 0) {
          clearInterval(this.timerInterval);
          this.showGameOver(this.currentTurn === 'X' ? 'O' : 'X', false);
        }
      }, 1000);
    },

    stopBlitzTimer() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
    },

    async fetchSpaceFacts() {
      // Check if we fetched today
      const today = new Date().toDateString();
      const lastFetch = localStorage.getItem('spaceFactsDate');
      
      if (lastFetch === today) {
        // Load from localStorage
        const cached = localStorage.getItem('spaceFactsAPI');
        if (cached) {
          this.spaceFactsAPI = JSON.parse(cached);
          console.log('✅ Loaded', this.spaceFactsAPI.length, 'space facts from cache');
          return;
        }
      }
      
      // Fetch new facts from NASA API
      try {
        const response = await fetch('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY&count=15');
        const data = await response.json();
        
        // Extract explanations as facts
        this.spaceFactsAPI = data
          .filter(item => item.explanation)
          .map(item => {
            // Get first 2-3 sentences
            const sentences = item.explanation.match(/[^.!?]+[.!?]+/g) || [];
            return sentences.slice(0, 2).join(' ').trim();
          })
          .filter(fact => fact.length > 50 && fact.length < 300);
        
        // Save to localStorage
        localStorage.setItem('spaceFactsAPI', JSON.stringify(this.spaceFactsAPI));
        localStorage.setItem('spaceFactsDate', today);
        
        console.log('✅ Fetched', this.spaceFactsAPI.length, 'new space facts from NASA');
      } catch (error) {
        console.log('⚠️ Could not fetch NASA facts, using defaults');
      }
    },
    
    showRandomSpaceFact() {
      // Combine default facts with API facts
      const allFacts = [...this.spaceFacts, ...this.spaceFactsAPI];
      this.spaceFact = allFacts[Math.floor(Math.random() * allFacts.length)];
    },

    // Social Features
    addFriend() {
      if (!this.friendRequest.trim()) return;
      if (this.user.friends.includes(this.friendRequest)) {
        alert('Already friends!');
        return;
      }
      this.user.friends.push(this.friendRequest);
      this.friendRequest = '';
      
      // Check social butterfly achievement
      if (this.user.friends.length >= 5 && !this.achievements[6].unlocked) {
        this.achievements[6].unlocked = true;
        this.showAchievementNotification([this.achievements[6]]);
      } else {
        this.achievements[6].progress = this.user.friends.length;
      }
      
      this.saveStats();
    },

    removeFriend(friend) {
      this.user.friends = this.user.friends.filter(f => f !== friend);
      this.achievements[6].progress = this.user.friends.length;
      this.saveStats();
    },

    challengeFriend(friend) {
      alert(`Challenge sent to ${friend}! (Feature coming soon)`);
    },

    sendChat() {
      if (!this.chatInput.trim()) return;
      this.chatMessages.push({
        user: this.user.username,
        message: this.chatInput,
        timestamp: Date.now()
      });
      this.chatInput = '';
      
      // Keep only last 50 messages
      if (this.chatMessages.length > 50) {
        this.chatMessages = this.chatMessages.slice(-50);
      }
    },

    sendEmote(emote) {
      this.chatMessages.push({
        user: this.user.username,
        message: emote,
        isEmote: true,
        timestamp: Date.now()
      });
    },

    // ELO System
    updateELO(won, opponentELO = 1000) {
      const K = 32; // K-factor
      const expectedScore = 1 / (1 + Math.pow(10, (opponentELO - this.user.elo) / 400));
      const actualScore = won ? 1 : 0;
      const eloChange = Math.round(K * (actualScore - expectedScore));
      
      this.user.elo += eloChange;
      
      // Check ranked warrior achievement
      if (this.user.elo >= 1500 && !this.achievements[7].unlocked) {
        this.achievements[7].unlocked = true;
        this.showAchievementNotification([this.achievements[7]]);
      }
      
      return eloChange;
    },

    getELORank() {
      if (this.user.elo >= 2000) return '👑 Grandmaster';
      if (this.user.elo >= 1800) return '💎 Master';
      if (this.user.elo >= 1600) return '🥇 Diamond';
      if (this.user.elo >= 1400) return '🥈 Platinum';
      if (this.user.elo >= 1200) return '🥉 Gold';
      if (this.user.elo >= 1000) return '🔰 Silver';
      return '🌱 Bronze';
    },

    // Accessibility
    loadAccessibilitySettings() {
      // Load high contrast
      const highContrast = localStorage.getItem('highContrast');
      if (highContrast === 'true') {
        this.highContrast = true;
        document.body.classList.add('high-contrast');
      }
      
      // Load colorblind mode
      const colorblindMode = localStorage.getItem('colorblindMode');
      if (colorblindMode === 'true') {
        this.colorblindMode = true;
        document.body.classList.add('colorblind');
      }
      
      // Load sound pack
      if (this.user.profile.soundPack && window.SoundManager) {
        window.SoundManager.changePack(this.user.profile.soundPack);
      }
    },
    
    toggleHighContrast() {
      document.body.classList.toggle('high-contrast', this.highContrast);
      localStorage.setItem('highContrast', this.highContrast);
    },

    toggleColorblindMode() {
      document.body.classList.toggle('colorblind', this.colorblindMode);
      localStorage.setItem('colorblindMode', this.colorblindMode);
    },

    enableKeyboardNav() {
      if (!this.keyboardNav) return;
      localStorage.setItem('keyboardNav', 'true');
      document.addEventListener('keydown', (e) => {
        if (!this.gameActive) return;
        const key = parseInt(e.key);
        if (key >= 1 && key <= 9) {
          this.makeMove(key - 1);
        }
      });
    },

    changeSoundPack(pack) {
      this.user.profile.soundPack = pack;
      if (window.SoundManager) {
        window.SoundManager.changePack(pack);
      }
      this.saveStats();
    },
    
    previewSound(pack) {
      if (window.SoundManager) {
        const currentPack = window.SoundManager.currentPack;
        window.SoundManager.changePack(pack);
        window.SoundManager.play('move');
        setTimeout(() => window.SoundManager.play('win'), 300);
        // Restore current pack after preview
        setTimeout(() => window.SoundManager.changePack(currentPack), 2000);
      }
    },
    
    getSoundPackDescription(pack) {
      const descriptions = {
        scifi: 'Futuristic electronic sounds',
        retro: 'Classic 8-bit chiptune',
        realistic: 'Natural subtle tones',
        minimal: 'Ultra-quiet sounds'
      };
      return descriptions[pack] || '';
    },
    
    rematch() {
      this.clearWinningCells();
      this.stopBlitzTimer();
      this.gameOver = false;
      if (this.mode === 'ai') {
        const size = this.boardSize * this.boardSize;
        this.board = Array(size).fill(null);
        this.currentTurn = 'X';
        this.gameActive = true;
        this.gameStartTime = Date.now();
        
        if (this.gameMode === 'blitz') {
          this.startBlitzTimer();
        }
        if (this.gameMode === 'educational') {
          this.showRandomSpaceFact();
        }
        
        this.updateGameStatus();
      } else {
        this.socket.emit('game:rematch', { code: this.roomCode });
      }
    },
    
    leaveGame() {
      this.clearWinningCells();
      this.stopBlitzTimer();
      this.gameOver = false;
      if (this.mode === 'online' && this.roomCode) {
        this.socket.emit('room:leave', { code: this.roomCode });
      }
      if (this.mode === 'tournament') {
        this.exitTournament();
      } else {
        this.setScreen('lobby');
      }
      this.board = Array(9).fill(null);
      this.gameActive = false;
    },
    
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
    openSpaceGallery() {
      this.setScreen('space');
      setTimeout(() => this.loadSpaceTab(this.spaceTab), 100);
    },
    
    closeSpaceGallery() {
      if (this.mode === 'tournament') {
        this.exitTournament();
      } else {
        this.setScreen('lobby');
      }
    },
    
    initSpaceGallery() {
      // 3D gallery will be initialized when space screen opens
    },
    
    loadSpaceTab(tab) {
      this.spaceTab = tab;
      if (window.SpaceGallery3D) {
        if (!window.SpaceGallery3D.scene) {
          window.SpaceGallery3D.init();
        }
        window.SpaceGallery3D.loadTab(tab);
      }
    },
    
    resetSpaceView() {
      this.selectedObject = null;
      if (window.SpaceGallery3D) {
        window.SpaceGallery3D.reset();
      }
    },
    
    // Social Sharing Functions
    shareTwitter() {
      const text = `🎮 I just won at Tic Tac Toe Mission Control! 🏆\n\nFinal Score: X ${this.scores.X} - D ${this.scores.D} - O ${this.scores.O}\n\nThink you can beat me? 🚀`;
      const url = window.location.origin;
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
      window.open(twitterUrl, '_blank', 'width=550,height=420');
    },
    
    shareFacebook() {
      const url = window.location.origin;
      const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
      window.open(facebookUrl, '_blank', 'width=550,height=420');
    },
    
    shareWhatsApp() {
      const text = `🎮 I just won at Tic Tac Toe Mission Control! 🏆\n\nFinal Score: X ${this.scores.X} - D ${this.scores.D} - O ${this.scores.O}\n\nPlay here: ${window.location.origin}`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(whatsappUrl, '_blank');
    },
    
    downloadScreenshot() {
      // Create a canvas to draw the victory screen
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      
      // Background
      ctx.fillStyle = '#000510';
      ctx.fillRect(0, 0, 800, 600);
      
      // Stars
      for (let i = 0; i < 100; i++) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(Math.random() * 800, Math.random() * 600, 2, 2);
      }
      
      // Title
      ctx.fillStyle = '#00d4ff';
      ctx.font = 'bold 24px "Exo 2"';
      ctx.textAlign = 'center';
      ctx.fillText('TIC TAC TOE - MISSION CONTROL', 400, 80);
      
      // Victory emoji
      ctx.font = '80px Arial';
      ctx.fillText(this.gameOverEmoji, 400, 180);
      
      // Victory text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px "Exo 2"';
      ctx.fillText(this.gameOverTitle, 400, 260);
      
      ctx.fillStyle = '#00d4ff';
      ctx.font = '20px "Space Mono"';
      ctx.fillText(this.gameOverSubtitle, 400, 300);
      
      // Score
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px "Space Mono"';
      ctx.fillText(`X ${this.scores.X}  —  D ${this.scores.D}  —  O ${this.scores.O}`, 400, 380);
      
      // Player name
      ctx.fillStyle = '#4dffdb';
      ctx.font = '24px "Exo 2"';
      ctx.fillText(`Player: ${this.user.username}`, 400, 440);
      
      // URL
      ctx.fillStyle = '#666';
      ctx.font = '18px "Space Mono"';
      ctx.fillText(window.location.origin, 400, 520);
      
      // Border
      ctx.strokeStyle = '#00d4ff';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, 760, 560);
      
      // Download
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tictactoe-victory-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
      });
    },
    
    copyShareLink() {
      const shareText = `🎮 I just won at Tic Tac Toe Mission Control! 🏆\n\nFinal Score: X ${this.scores.X} - D ${this.scores.D} - O ${this.scores.O}\n\nPlay here: ${window.location.origin}`;
      
      if (!navigator.clipboard) {
        console.error('Clipboard API not supported');
        return;
      }

      navigator.clipboard.writeText(shareText).then(() => {
        this.shareCopied = true;
        setTimeout(() => this.shareCopied = false, 3000);
      }).catch((err) => {
        console.error('Failed to copy text: ', err);
      });
    }
  }
}

// Fireworks for game over
window.FW = (function() {
  const cv = document.getElementById('fw-canvas');
  const ctx = cv.getContext('2d');
  let particles = [], rockets = [], active = false;
  
  function resize() {
    cv.width = window.innerWidth;
    cv.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);
  
  function explode(x, y, color) {
    for (let i = 0; i < 50; i++) {
      const angle = (Math.PI * 2 / 50) * i;
      const speed = 2 + Math.random() * 4;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color
      });
    }
  }
  
  function animate() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    
    rockets.forEach((r, i) => {
      r.y -= 5;
      ctx.fillStyle = r.color;
      ctx.fillRect(r.x, r.y, 3, 10);
      if (r.y < cv.height * 0.3) {
        explode(r.x, r.y, r.color);
        rockets.splice(i, 1);
      }
    });
    
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      p.life -= 0.02;
      
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 3, 3);
    });
    ctx.globalAlpha = 1;
    
    if (active || rockets.length || particles.length) {
      requestAnimationFrame(animate);
    }
  }
  
  return {
    launch(color) {
      active = true;
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          rockets.push({
            x: Math.random() * cv.width,
            y: cv.height,
            color
          });
        }, i * 200);
      }
      animate();
      setTimeout(() => active = false, 2000);
    }
  };
})();
