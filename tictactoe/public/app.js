// Main Alpine.js Application
function app() {
  return {
    screen: 'auth',
    authTab: 'login',
    socket: null,
    user: { username: '', stats: { wins: 0, draws: 0, losses: 0 } },
    
    // Auth
    loginForm: { username: '', password: '' },
    registerForm: { username: '', password: '' },
    loginError: '',
    registerError: '',
    loginLoading: false,
    registerLoading: false,
    
    // Lobby
    joinCode: '',
    lobbyError: '',
    
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
    
    // Space Gallery
    spaceTab: 'solar',
    spaceZoom: 1,
    spaceSpeed: 1,
    selectedObject: null,
    
    // Cinematic Helper
    setScreen(screenName) {
      if (this.screen === screenName) return;
      if (window.CinematicSpace && typeof window.CinematicSpace.triggerWarp === 'function') {
        window.CinematicSpace.triggerWarp();
      }
      this.screen = screenName;
    },

    init() {
      const token = localStorage.getItem('token');
      if (token) {
        this.connectSocket(token);
      }
      this.initSpaceGallery();
      this.initGoogleSignIn();
      
      // Watch for zoom and speed changes
      this.$watch('spaceZoom', value => {
        if (window.SpaceGallery) window.SpaceGallery.zoom = parseFloat(value);
      });
      this.$watch('spaceSpeed', value => {
        if (window.SpaceGallery) window.SpaceGallery.speed = parseFloat(value);
      });
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
        this.user = { username: data.username, stats: data.stats };
        this.setScreen('lobby');
      });
      
      this.socket.on('auth:error', () => {
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
        this.board = data.board;
        this.currentTurn = data.currentTurn;
        this.scores = data.scores;
        this.gameActive = true;
        this.mode = 'online';
        this.setScreen('game');
        this.updateGameStatus();
      });
      
      this.socket.on('game:move', ({ index, symbol }) => {
        this.board[index] = symbol;
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
          this.setScreen('lobby');
          this.lobbyError = '';
        }, 2000);
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
      this.setScreen('lobby');
    },
    
    copyRoomCode() {
      navigator.clipboard.writeText(this.roomCode);
    },
    
    startAI() {
      this.mode = 'ai';
      this.mySymbol = 'X';
      this.board = Array(9).fill(null);
      this.currentTurn = 'X';
      this.gameActive = true;
      this.scores = { X: 0, O: 0, D: 0 };
      this.setScreen('game');
      this.updateGameStatus();
    },
    
    canMove(index) {
      return this.gameActive && !this.board[index] && 
             (this.mode === 'ai' ? this.currentTurn === 'X' : this.currentTurn === this.mySymbol);
    },
    
    makeMove(index) {
      if (!this.canMove(index)) return;
      
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
      const move = this.getBestMove();
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
    
    getBestMove() {
      for (let i = 0; i < 9; i++) {
        if (!this.board[i]) return i;
      }
      return -1;
    },
    
    checkWin(player) {
      return GameLogic.checkWin(this.board, player);
    },
    
    animateWinningLine(line) {
      // Add winning class to cells
      line.forEach((index, i) => {
        setTimeout(() => {
          const cell = document.querySelector(`[data-cell-index="${index}"]`);
          if (cell) {
            cell.classList.add('winning-cell');
            cell.style.animation = 'winPulse 0.6s ease-in-out';
          }
        }, i * 100);
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
      
      if (draw) {
        this.gameOverEmoji = '🤝';
        this.gameOverTitle = 'STANDOFF';
        this.gameOverSubtitle = 'MISSION DRAW';
      } else if (winner === this.mySymbol || (this.mode === 'ai' && winner === 'X')) {
        this.gameOverEmoji = '🏆';
        this.gameOverTitle = 'MISSION COMPLETE';
        this.gameOverSubtitle = 'VICTORY ACHIEVED';
      } else {
        this.gameOverEmoji = '❌';
        this.gameOverTitle = 'MISSION FAILED';
        this.gameOverSubtitle = this.mode === 'ai' ? 'AI VICTORY' : 'DEFEAT';
      }
    },
    
    rematch() {
      this.gameOver = false;
      if (this.mode === 'ai') {
        this.board = Array(9).fill(null);
        this.currentTurn = 'X';
        this.gameActive = true;
        this.updateGameStatus();
      } else {
        this.socket.emit('game:rematch', { code: this.roomCode });
      }
    },
    
    leaveGame() {
      this.gameOver = false;
      if (this.mode === 'online' && this.roomCode) {
        this.socket.emit('room:leave', { code: this.roomCode });
      }
      this.setScreen('lobby');
      this.board = Array(9).fill(null);
      this.gameActive = false;
    },
    
    openSpaceGallery() {
      this.setScreen('space');
      setTimeout(() => this.loadSpaceTab(this.spaceTab), 100);
    },
    
    closeSpaceGallery() {
      this.setScreen('lobby');
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
