// Main Alpine.js Application
function app() {
  return {
    screen: 'home',
    spaceExplorerFreeFlight: false,
    graphicsMode: localStorage.getItem('graphicsMode') || 'HD',
    authTab: 'login',
    socket: null,
    view3D: true,
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
    
    // DOM Cache
    domCache: {},
    _getEl(id) {
      if (!this.domCache[id]) {
        this.domCache[id] = document.getElementById(id);
      }
      return this.domCache[id];
    },
    _getCell(index) {
      const key = `cell-${index}`;
      if (!this.domCache[key]) {
        this.domCache[key] = document.querySelector(`[data-cell-index="${index}"]`);
      }
      return this.domCache[key];
    },
    clearDomCache() {
      this.domCache = {};
    },

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
    rematchRequested: false,
    rematchFrom: '',
    muted: false,
    toggleMute() { this.muted = window.SoundManager.toggleMute(); },
    isFullscreen: false,
    
    // Custom Background Music State
    customMusicPlaying: false,
    customMusicName: '',
    musicLoading: false,
    showRetroGame: false,
    musicAnalysisStatus: '',
    retroGameScore: 0,
    retroGameHighScore: 0,
    retroGameLives: 3,
    retroGameStatus: 'playing',
    retroGame: null,
    
    // P2P Multiplayer State
    p2pMethod: 'wifi', 
    p2pRole: '', 
    p2pTargetId: '',
    p2pNearbyList: [],
    p2pInviteFrom: null,
    p2pManualOfferText: '',
    p2pManualAnswerText: '',
    p2pManualCopiedOffer: false,
    p2pManualCopiedAnswer: false,
    p2pConnectionStatus: 'idle',
    peerConnection: null,
    dataChannel: null,
    
    // Space Explorer Tab loading transition state
    spaceTabLoading: false,
    
    triggerMusicUpload() {
      const fileInput = document.getElementById('bg-music-input');
      if (fileInput) {
        fileInput.click();
      }
    },
    handleMusicUpload(event) {
      const file = event.target.files[0];
      if (file) {
        window.SoundManager.playCustomMusic(file);
        this.customMusicPlaying = true;
        this.customMusicName = file.name;
      }
    },
    toggleCustomMusic() {
      if (window.SoundManager.bgAudio) {
        this.customMusicPlaying = window.SoundManager.toggleBgMusic();
      } else {
        this.triggerMusicUpload();
      }
    },
    clearCustomMusic() {
      window.SoundManager.stopCustomMusic();
      this.customMusicPlaying = false;
      this.customMusicName = '';
      const fileInput = document.getElementById('bg-music-input');
      if (fileInput) {
        fileInput.value = '';
      }
    },
    
    startRetroGame() {
      this.retroGameScore = 0;
      this.retroGameLives = 3;
      this.retroGameStatus = 'playing';
      this.retroGameHighScore = parseInt(localStorage.getItem('retroHighScore') || '0', 10);
      
      const canvas = document.getElementById('retro-game-canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      canvas.width = 400;
      canvas.height = 300;
      
      this.retroGame = {
        running: true,
        spaceship: { x: 188, y: 250, w: 24, h: 24, speed: 6 },
        lasers: [],
        aliens: [],
        particles: [],
        stars: [],
        keys: {},
        lastSpawn: 0,
        lastShoot: 0,
        animationFrameId: null
      };
      
      // Generate stars
      for (let i = 0; i < 30; i++) {
        this.retroGame.stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2,
          speed: Math.random() * 2 + 1
        });
      }
      
      // Controls helper
      const handleKeyDown = (e) => {
        if (!this.retroGame) return;
        if (['ArrowLeft', 'ArrowRight', 'a', 'd', 'A', 'D'].includes(e.key)) {
          this.retroGame.keys[e.key] = true;
        }
      };
      const handleKeyUp = (e) => {
        if (!this.retroGame) return;
        if (['ArrowLeft', 'ArrowRight', 'a', 'd', 'A', 'D'].includes(e.key)) {
          this.retroGame.keys[e.key] = false;
        }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      
      this.retroGame._handleKeyDown = handleKeyDown;
      this.retroGame._handleKeyUp = handleKeyUp;
      
      // Mouse tracking
      const handleMouseMove = (e) => {
        if (!this.retroGame) return;
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const scaleX = canvas.width / rect.width;
        this.retroGame.spaceship.x = Math.max(0, Math.min(canvas.width - this.retroGame.spaceship.w, mouseX * scaleX - this.retroGame.spaceship.w / 2));
      };
      canvas.addEventListener('mousemove', handleMouseMove);
      this.retroGame._handleMouseMove = handleMouseMove;

      // Touch tracking (mobile/tablet drag)
      const handleTouchMove = (e) => {
        if (!this.retroGame || e.touches.length === 0) return;
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touchX = e.touches[0].clientX - rect.left;
        const scaleX = canvas.width / rect.width;
        this.retroGame.spaceship.x = Math.max(0, Math.min(canvas.width - this.retroGame.spaceship.w, touchX * scaleX - this.retroGame.spaceship.w / 2));
      };
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
      this.retroGame._handleTouchMove = handleTouchMove;
      
      // Click on canvas to restart if game over
      const handleCanvasClick = () => {
        if (this.retroGameStatus === 'gameover') {
          this.startRetroGame();
        }
      };
      canvas.addEventListener('click', handleCanvasClick);
      this.retroGame._handleCanvasClick = handleCanvasClick;

      // Explosion creator
      const createExplosion = (x, y, color) => {
        for (let i = 0; i < 8; i++) {
          this.retroGame.particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            size: Math.random() * 3 + 1,
            color: color,
            alpha: 1.0
          });
        }
      };
      
      // Game loop
      const updateAndDraw = () => {
        if (!this.retroGame || !this.retroGame.running) return;
        
        const ship = this.retroGame.spaceship;
        const keys = this.retroGame.keys;
        
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
          ship.x = Math.max(0, ship.x - ship.speed);
        }
        if (keys['ArrowRight'] || keys['d'] || keys['D']) {
          ship.x = Math.min(canvas.width - ship.w, ship.x + ship.speed);
        }
        
        // Retrieve volume data from AnalyserNode
        let volumePulse = 0;
        let freqData = null;
        if (window.SoundManager && window.SoundManager.analyser && window.SoundManager.bgPlaying) {
          const bufferLength = window.SoundManager.analyser.frequencyBinCount;
          freqData = new Uint8Array(bufferLength);
          window.SoundManager.analyser.getByteFrequencyData(freqData);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += freqData[i];
          }
          volumePulse = sum / bufferLength / 255; // 0.0 to 1.0
        }

        // Draw background grid that pulses to the music volume
        ctx.fillStyle = '#050510';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.save();
        ctx.strokeStyle = `rgba(0, 212, 255, ${0.03 + volumePulse * 0.12})`;
        ctx.lineWidth = 1;
        const gridSize = 32;
        const gridOffset = (Date.now() * 0.05) % gridSize;
        // Horizontal lines
        for (let y = gridOffset; y < canvas.height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
        // Vertical lines with 3D perspective warp
        for (let x = 0; x <= canvas.width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, canvas.height);
          ctx.lineTo(canvas.width / 2 + (x - canvas.width / 2) * 0.6, 0);
          ctx.stroke();
        }
        ctx.restore();
        
        // Stars
        ctx.fillStyle = '#ffffff';
        this.retroGame.stars.forEach(star => {
          const speedMultiplier = 1.0 + volumePulse * 3.0;
          star.y += star.speed * speedMultiplier;
          if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
          }
          ctx.fillRect(star.x, star.y, star.size, star.size);
        });
        
        // Engine fire (pulses with music beat)
        const flameHeight = (8 + Math.random() * 8) * (1.0 + volumePulse * 1.5);
        ctx.fillStyle = '#ff5500';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff3300';
        ctx.beginPath();
        ctx.moveTo(ship.x + ship.w / 2 - 4, ship.y + ship.h);
        ctx.lineTo(ship.x + ship.w / 2 + 4, ship.y + ship.h);
        ctx.lineTo(ship.x + ship.w / 2, ship.y + ship.h + flameHeight);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Spaceship (neon blue rocket with glow)
        ctx.fillStyle = '#00d4ff';
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00ffff';
        ctx.beginPath();
        ctx.moveTo(ship.x + ship.w / 2, ship.y);
        ctx.lineTo(ship.x, ship.y + ship.h);
        ctx.lineTo(ship.x + ship.w / 2, ship.y + ship.h - 4);
        ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Lasers (neon magenta with glow)
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#ff00ff';
        for (let l = this.retroGame.lasers.length - 1; l >= 0; l--) {
          const laser = this.retroGame.lasers[l];
          laser.y += laser.vy;
          ctx.beginPath();
          ctx.moveTo(laser.x, laser.y);
          ctx.lineTo(laser.x, laser.y - 8);
          ctx.stroke();
          
          if (laser.y < 0) {
            this.retroGame.lasers.splice(l, 1);
          }
        }
        ctx.shadowBlur = 0;
        
        // Auto-shoot
        const now = Date.now();
        if (now - this.retroGame.lastShoot > 220) {
          this.retroGame.lasers.push({
            x: ship.x + ship.w / 2,
            y: ship.y,
            vy: -7
          });
          this.retroGame.lastShoot = now;
          if (window.SoundManager) {
            window.SoundManager.playTone(1200, 'sine', 0.05, 0, 0.02);
          }
        }
        
        // Spawn aliens
        if (now - this.retroGame.lastSpawn > 1000) {
          const size = 20;
          this.retroGame.aliens.push({
            x: Math.random() * (canvas.width - size),
            y: -size,
            w: size,
            h: size,
            speed: Math.random() * 1.5 + 1.2,
            color: ['#39ff14', '#ff007f', '#ffff00'][Math.floor(Math.random() * 3)],
            type: Math.floor(Math.random() * 2)
          });
          this.retroGame.lastSpawn = now;
        }
        
        // Aliens
        for (let a = this.retroGame.aliens.length - 1; a >= 0; a--) {
          const alien = this.retroGame.aliens[a];
          alien.y += alien.speed;
          
          ctx.fillStyle = alien.color;
          ctx.shadowBlur = 10;
          ctx.shadowColor = alien.color;
          
          if (alien.type === 0) {
            ctx.beginPath();
            ctx.ellipse(alien.x + alien.w / 2, alien.y + alien.h / 2, alien.w / 2, alien.h / 4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(alien.x + alien.w / 2, alien.y + alien.h / 2 - 2, alien.w / 4, Math.PI, 0);
            ctx.fill();
          } else {
            ctx.fillRect(alien.x + 4, alien.y, alien.w - 8, alien.h - 4);
            ctx.fillRect(alien.x, alien.y, 2, 6);
            ctx.fillRect(alien.x + alien.w - 2, alien.y, 2, 6);
          }
          ctx.shadowBlur = 0;
          
          // Collision spaceship
          if (alien.x < ship.x + ship.w &&
              alien.x + alien.w > ship.x &&
              alien.y < ship.y + ship.h &&
              alien.y + alien.h > ship.y) {
            
            this.retroGame.aliens.splice(a, 1);
            this.retroGameLives--;
            createExplosion(alien.x + alien.w / 2, alien.y + alien.h / 2, '#ff5500');
            
            if (window.SoundManager) {
              window.SoundManager.playTone(180, 'sawtooth', 0.25, 0, 0.12);
            }
            
            if (this.retroGameLives <= 0) {
              this.retroGame.running = false;
              this.retroGameStatus = 'gameover';
              
              ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              
              ctx.fillStyle = '#ff007f';
              ctx.font = '18px Courier, monospace';
              ctx.textAlign = 'center';
              ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 10);
              
              ctx.fillStyle = '#ffffff';
              ctx.font = '10px Courier, monospace';
              ctx.fillText(`Score: ${this.retroGameScore}`, canvas.width / 2, canvas.height / 2 + 20);
              ctx.fillText('Click Game Area to Restart', canvas.width / 2, canvas.height / 2 + 40);
              break;
            }
            continue;
          }
          
          // Collision lasers
          let hit = false;
          for (let l = this.retroGame.lasers.length - 1; l >= 0; l--) {
            const laser = this.retroGame.lasers[l];
            if (laser.x > alien.x && laser.x < alien.x + alien.w &&
                laser.y < alien.y + alien.h && laser.y > alien.y) {
              
              this.retroGame.aliens.splice(a, 1);
              this.retroGame.lasers.splice(l, 1);
              hit = true;
              
              this.retroGameScore += 10;
              if (this.retroGameScore > this.retroGameHighScore) {
                this.retroGameHighScore = this.retroGameScore;
                localStorage.setItem('retroHighScore', this.retroGameHighScore);
              }
              
              createExplosion(alien.x + alien.w / 2, alien.y + alien.h / 2, alien.color);
              
              if (window.SoundManager) {
                window.SoundManager.playTone(350, 'square', 0.08, 0, 0.04);
              }
              break;
            }
          }
          
          if (hit) continue;
          
          if (alien.y > canvas.height) {
            this.retroGame.aliens.splice(a, 1);
          }
        }
        
        // Particles
        for (let p = this.retroGame.particles.length - 1; p >= 0; p--) {
          const part = this.retroGame.particles[p];
          part.x += part.vx;
          part.y += part.vy;
          part.alpha -= 0.03;
          
          ctx.fillStyle = part.color;
          ctx.globalAlpha = Math.max(0, part.alpha);
          ctx.fillRect(part.x, part.y, part.size, part.size);
          ctx.globalAlpha = 1.0;
          
          if (part.alpha <= 0) {
            this.retroGame.particles.splice(p, 1);
          }
        }
        
        // Draw real-time glowing stereo bar visualizer
        if (freqData) {
          ctx.save();
          ctx.globalAlpha = 0.35;
          const barCount = 16;
          const barWidth = canvas.width / barCount;
          ctx.shadowBlur = 8;
          
          for (let i = 0; i < barCount; i++) {
            const fIdx = Math.floor((i / barCount) * (freqData.length / 2));
            const val = freqData[fIdx];
            const percent = val / 255;
            const height = percent * 75; // up to 75px tall
            
            const x = i * barWidth;
            const y = canvas.height - height;
            
            const hue = 180 + (i / barCount) * 120; // cyan to magenta
            ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.65)`;
            ctx.shadowColor = `hsla(${hue}, 100%, 50%, 0.8)`;
            
            ctx.fillRect(x + 2, y, barWidth - 4, height);
          }
          ctx.restore();
        }
        
        this.retroGame.animationFrameId = requestAnimationFrame(updateAndDraw);
      };
      
      this.retroGame.animationFrameId = requestAnimationFrame(updateAndDraw);
    },
    
    stopRetroGame() {
      if (this.retroGame) {
        this.retroGame.running = false;
        if (this.retroGame.animationFrameId) {
          cancelAnimationFrame(this.retroGame.animationFrameId);
        }
        window.removeEventListener('keydown', this.retroGame._handleKeyDown);
        window.removeEventListener('keyup', this.retroGame._handleKeyUp);
        
        const canvas = document.getElementById('retro-game-canvas');
        if (canvas) {
          canvas.removeEventListener('mousemove', this.retroGame._handleMouseMove);
          canvas.removeEventListener('touchmove', this.retroGame._handleTouchMove);
          canvas.removeEventListener('click', this.retroGame._handleCanvasClick);
        }
        this.retroGame = null;
      }
    },
    
    openP2PLobby() {
      if (window.SoundManager) window.SoundManager.play('click');
      this.p2pMethod = 'wifi';
      this.p2pRole = '';
      this.p2pNearbyList = [];
      this.p2pInviteFrom = null;
      this.p2pManualOfferText = '';
      this.p2pManualAnswerText = '';
      this.p2pManualCopiedOffer = false;
      this.p2pManualCopiedAnswer = false;
      this.p2pConnectionStatus = 'idle';
      this.setScreen('p2p');
      
      const token = localStorage.getItem('token');
      if (token && !this.socket) {
        this.connectSocket(token);
      }
    },
    
    closeP2PLobby() {
      if (window.SoundManager) window.SoundManager.play('click');
      this.stopP2PDiscovery();
      this.leaveGame();
      this.setScreen('lobby');
    },

    startP2PDiscovery() {
      if (window.SoundManager) window.SoundManager.play('click');
      if (!this.socket || !this.socket.connected) {
        this.lobbyError = 'Cannot scan. Offline from server connection.';
        setTimeout(() => this.lobbyError = '', 3000);
        return;
      }
      this.p2pConnectionStatus = 'discovering';
      this.socket.emit('p2p:discover', { username: this.user.username || 'Anonymous Astronaut' });
    },

    stopP2PDiscovery() {
      if (this.socket && this.p2pConnectionStatus === 'discovering') {
        this.socket.emit('p2p:cancel');
      }
      this.p2pConnectionStatus = 'idle';
      this.p2pNearbyList = [];
    },

    inviteP2PPeer(socketId) {
      if (window.SoundManager) window.SoundManager.play('click');
      if (this.socket) {
        this.p2pTargetId = socketId;
        this.p2pConnectionStatus = 'host-waiting';
        this.socket.emit('p2p:invite', { targetSocketId: socketId });
      }
    },

    acceptP2PInvite() {
      if (window.SoundManager) window.SoundManager.play('click');
      if (this.socket && this.p2pInviteFrom) {
        const hostId = this.p2pInviteFrom.socketId;
        this.p2pTargetId = hostId;
        this.p2pRole = 'joiner';
        this.mySymbol = 'O';
        this.p2pConnectionStatus = 'join-waiting';
        this.socket.emit('p2p:accept', { targetSocketId: hostId });
        
        this.p2pInviteFrom = null;
        this.initP2PConnection();
      }
    },

    rejectP2PInvite() {
      if (window.SoundManager) window.SoundManager.play('click');
      this.p2pInviteFrom = null;
    },

    initP2PConnection() {
      this.iceCandidatesQueue = [];
      const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
      this.peerConnection = new RTCPeerConnection(configuration);
      
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate && this.p2pMethod === 'wifi' && this.socket) {
          this.socket.emit('p2p:signal', {
            targetSocketId: this.p2pTargetId,
            signal: { candidate: event.candidate }
          });
        }
      };

      this.peerConnection.onconnectionstatechange = () => {
        if (this.peerConnection) {
          console.log("P2P State Change:", this.peerConnection.connectionState);
          if (this.peerConnection.connectionState === 'failed' || this.peerConnection.connectionState === 'closed') {
            this.leaveGame();
            this.lobbyError = 'P2P Link disconnected.';
            setTimeout(() => this.lobbyError = '', 3000);
          }
        }
      };

      if (this.p2pRole === 'host') {
        this.dataChannel = this.peerConnection.createDataChannel('tictactoe-p2p', { ordered: true });
        this.bindDataChannelEvents();
        
        this.peerConnection.createOffer()
          .then(offer => this.peerConnection.setLocalDescription(offer))
          .then(() => {
            if (this.p2pMethod === 'wifi' && this.socket) {
              this.socket.emit('p2p:signal', {
                targetSocketId: this.p2pTargetId,
                signal: { sdp: this.peerConnection.localDescription }
              });
            }
          });
      } else {
        this.peerConnection.ondatachannel = (event) => {
          this.dataChannel = event.channel;
          this.bindDataChannelEvents();
        };
      }
    },

    bindDataChannelEvents() {
      if (!this.dataChannel) return;
      
      this.dataChannel.onopen = () => {
        console.log("Data channel opened");
        this.mode = 'p2p';
        this.p2pConnectionStatus = 'connected';
        
        if (this.p2pRole === 'host') {
          this.clearWinningCells();
          this.stopBlitzTimer();
          this.gameOver = false;
          
          const size = this.boardSize * this.boardSize;
          this.board = Array(size).fill(null);
          this.currentTurn = 'X';
          this.gameActive = true;
          this.gameStartTime = Date.now();
          this.scores = { X: 0, O: 0, D: 0 };
          
          this.dataChannel.send(JSON.stringify({
            type: 'game:start',
            boardSize: this.boardSize,
            gameMode: this.gameMode
          }));
          
          this.setScreen('game');
          this.updateGameStatus();
          
          if (window.SoundManager) window.SoundManager.play('start');
        }
      };
      
      this.dataChannel.onclose = () => {
        console.log("Data channel closed");
        this.leaveGame();
        this.lobbyError = 'P2P partner disconnected.';
        setTimeout(() => this.lobbyError = '', 3000);
      };
      
      this.dataChannel.onerror = (err) => {
        console.error("Data channel error:", err);
        this.leaveGame();
        this.lobbyError = 'P2P Connection error.';
        setTimeout(() => this.lobbyError = '', 3000);
      };
      
      this.dataChannel.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("P2P Msg Recv:", data);
          
          if (data.type === 'game:start') {
            this.clearWinningCells();
            this.stopBlitzTimer();
            this.gameOver = false;
            
            this.boardSize = data.boardSize || 3;
            this.gameMode = data.gameMode || 'classic';
            this.mode = 'p2p';
            this.p2pConnectionStatus = 'connected';
            
            const size = this.boardSize * this.boardSize;
            this.board = Array(size).fill(null);
            this.currentTurn = 'X';
            this.gameActive = true;
            this.gameStartTime = Date.now();
            this.scores = { X: 0, O: 0, D: 0 };
            
            this.setScreen('game');
            this.updateGameStatus();
            
            if (window.SoundManager) window.SoundManager.play('start');
          } else if (data.type === 'game:move') {
            const index = data.index;
            const opponentSymbol = this.mySymbol === 'X' ? 'O' : 'X';
            
            this.board[index] = opponentSymbol;
            
            if (window.SoundManager) window.SoundManager.play('click');
            
            const winLine = this.checkWin(opponentSymbol);
            if (winLine) {
              this.scores[opponentSymbol]++;
              this.animateWinningLine(winLine);
              setTimeout(() => this.showGameOver(opponentSymbol, false), 500);
              return;
            }
            if (this.board.every(c => c)) {
              this.scores.D++;
              this.showGameOver(null, true);
              return;
            }
            this.currentTurn = this.mySymbol;
            this.updateGameStatus();
          } else if (data.type === 'game:rematch-request') {
            this.rematchRequested = true;
            this.rematchFrom = 'Opponent';
          } else if (data.type === 'game:rematch-accept') {
            if (this.p2pRole === 'host') {
              this.clearWinningCells();
              this.stopBlitzTimer();
              this.gameOver = false;
              
              const size = this.boardSize * this.boardSize;
              this.board = Array(size).fill(null);
              this.currentTurn = 'X';
              this.gameActive = true;
              this.gameStartTime = Date.now();
              
              this.dataChannel.send(JSON.stringify({
                type: 'game:start',
                boardSize: this.boardSize,
                gameMode: this.gameMode
              }));
              
              this.updateGameStatus();
              if (window.SoundManager) window.SoundManager.play('start');
            }
          }
        } catch (e) {
          console.error("Failed to parse data channel message:", e);
        }
      };
    },

    handleP2PSignal(signal) {
      if (!this.peerConnection) return;
      if (signal.sdp) {
        this.peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            if (this.iceCandidatesQueue) {
              while (this.iceCandidatesQueue.length > 0) {
                const cand = this.iceCandidatesQueue.shift();
                this.peerConnection.addIceCandidate(new RTCIceCandidate(cand))
                  .catch(err => console.error("Failed to add P2P ICE candidate:", err));
              }
            }
            if (this.p2pRole === 'joiner') {
              return this.peerConnection.createAnswer()
                .then(answer => this.peerConnection.setLocalDescription(answer))
                .then(() => {
                  if (this.socket) {
                    this.socket.emit('p2p:signal', {
                      targetSocketId: this.p2pTargetId,
                      signal: { sdp: this.peerConnection.localDescription }
                    });
                  }
                });
            }
          })
          .catch(err => console.error("Failed to handle P2P SDP signal:", err));
      } else if (signal.candidate) {
        if (this.peerConnection.remoteDescription && this.peerConnection.remoteDescription.type) {
          this.peerConnection.addIceCandidate(new RTCIceCandidate(signal.candidate))
            .catch(err => console.error("Failed to add P2P ICE candidate:", err));
        } else {
          if (!this.iceCandidatesQueue) this.iceCandidatesQueue = [];
          this.iceCandidatesQueue.push(signal.candidate);
        }
      }
    },

    startManualP2P(isHost) {
      if (window.SoundManager) window.SoundManager.play('click');
      this.stopP2PDiscovery();
      
      if (this.peerConnection) this.peerConnection.close();
      
      this.p2pRole = isHost ? 'host' : 'joiner';
      this.p2pMethod = 'manual';
      this.p2pManualOfferText = '';
      this.p2pManualAnswerText = '';
      this.p2pManualCopiedOffer = false;
      this.p2pManualCopiedAnswer = false;
      
      const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
      this.peerConnection = new RTCPeerConnection(configuration);
      
      this.peerConnection.onicecandidate = (event) => {
        if (!event.candidate) {
          const code = btoa(JSON.stringify({ sdp: this.peerConnection.localDescription }));
          if (this.p2pRole === 'host') {
            this.p2pManualOfferText = code;
            this.p2pConnectionStatus = 'ready: copy code';
          } else {
            this.p2pManualAnswerText = code;
            this.p2pConnectionStatus = 'ready: copy response';
          }
        }
      };

      this.peerConnection.onconnectionstatechange = () => {
        if (this.peerConnection) {
          if (this.peerConnection.connectionState === 'failed' || this.peerConnection.connectionState === 'closed') {
            this.leaveGame();
          }
        }
      };

      if (isHost) {
        this.p2pConnectionStatus = 'gathering ice...';
        this.dataChannel = this.peerConnection.createDataChannel('tictactoe-p2p', { ordered: true });
        this.bindDataChannelEvents();
        
        this.peerConnection.createOffer()
          .then(offer => this.peerConnection.setLocalDescription(offer));
      } else {
        this.p2pConnectionStatus = 'waiting for host code...';
        this.peerConnection.ondatachannel = (event) => {
          this.dataChannel = event.channel;
          this.bindDataChannelEvents();
        };
      }
    },

    generateManualAnswer() {
      if (!this.p2pManualOfferText) return;
      try {
        const data = JSON.parse(atob(this.p2pManualOfferText.trim()));
        if (data.sdp) {
          this.p2pConnectionStatus = 'setting host sdp...';
          this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp))
            .then(() => this.peerConnection.createAnswer())
            .then(answer => this.peerConnection.setLocalDescription(answer))
            .then(() => {
              this.p2pConnectionStatus = 'generating response...';
            });
        }
      } catch (e) {
        this.p2pConnectionStatus = 'invalid connection code';
      }
    },

    connectManualP2P() {
      if (window.SoundManager) window.SoundManager.play('click');
      if (!this.p2pManualAnswerText) return;
      try {
        const data = JSON.parse(atob(this.p2pManualAnswerText.trim()));
        if (data.sdp) {
          this.p2pConnectionStatus = 'setting joiner sdp...';
          this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
        }
      } catch (e) {
        this.p2pConnectionStatus = 'invalid response code';
      }
    },

    copyOfferCode() {
      if (window.SoundManager) window.SoundManager.play('click');
      navigator.clipboard.writeText(this.p2pManualOfferText);
      this.p2pManualCopiedOffer = true;
      setTimeout(() => this.p2pManualCopiedOffer = false, 2000);
    },

    copyAnswerCode() {
      if (window.SoundManager) window.SoundManager.play('click');
      navigator.clipboard.writeText(this.p2pManualAnswerText);
      this.p2pManualCopiedAnswer = true;
      setTimeout(() => this.p2pManualCopiedAnswer = false, 2000);
    },
    
    // Space Gallery
    spaceTab: 'solar',
    spaceZoom: 1,
    spaceSpeed: 1,
    selectedObject: null,
    spacePOVTarget: 'Sun',
    
    // Weather & UI Presets
    weather: 'clear',
    weatherPreset: 'default',
    
    // Cinematic Helper
    setScreen(screenName) {
      if (this.screen === screenName) return; 
      this.screen = screenName;
      
      // Auto-login if going to auth screen and token exists
      if (screenName === 'auth') {
        const token = localStorage.getItem('token');
        if (token && !this.socket) {
          this.connectSocket(token);
        }
      }
      
      // Muffle background audio (cinematic blur effect) when on space gallery screen
      if (window.SoundManager) {
        window.SoundManager.setFilterActive(screenName === 'space');
      }

      // Toggle space-3d rendering and apply cinematic blur & drift transition on pause
      if (window.CinematicSpace) {
        const shouldPause = (screenName === 'space');
        window.CinematicSpace.paused = shouldPause;
        
        const canvas = document.getElementById('three-canvas');
        if (canvas) {
          if (shouldPause) {
            // Render exactly one frame to keep visual background, then blur and drift
            if (typeof window.CinematicSpace.renderFrame === 'function') {
              window.CinematicSpace.renderFrame();
            }
            canvas.classList.add('canvas-cinematic-paused');
          } else {
            canvas.classList.remove('canvas-cinematic-paused');
          }

          // Apply blur and low-resolution performance mode while actively playing the game
          if (screenName === 'game') {
            canvas.classList.add('canvas-game-blur');
            document.dispatchEvent(new CustomEvent('space-low-perf-mode', { detail: { active: true } }));
          } else {
            canvas.classList.remove('canvas-game-blur');
            document.dispatchEvent(new CustomEvent('space-low-perf-mode', { detail: { active: false } }));
          }
        }
      }
      
      if (window.CinematicSpace && typeof window.CinematicSpace.triggerWarp === 'function') {
        window.CinematicSpace.triggerWarp();
      }
    },

    toggleFullscreen() {
      if (window.SoundManager) window.SoundManager.play('click');
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    },

    init() {
      window.appInstance = this;
      
      const updateFullscreen = () => {
        this.isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
      };
      updateFullscreen();
      document.addEventListener('fullscreenchange', updateFullscreen);
      document.addEventListener('webkitfullscreenchange', updateFullscreen);
      document.addEventListener('mozfullscreenchange', updateFullscreen);
      document.addEventListener('MSFullscreenChange', updateFullscreen);

      // Keyboard shortcuts: F key toggles fullscreen only
      document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
          return;
        }
        if (e.key.toLowerCase() === 'f') {
          e.preventDefault();
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
              console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
          } else {
            if (document.exitFullscreen) {
              document.exitFullscreen();
            }
          }
        }
      });

      // Don't auto-connect - let user see landing page first
      this.initSpaceGallery();
      this.initGoogleSignIn();
      this.initWeatherSync();
      this.initGyroscope();
      
      // Load saved stats and achievements
      this.loadStats();
      
      // Load accessibility settings
      this.loadAccessibilitySettings();
      
      // Fetch space facts from API
      this.fetchSpaceFacts();
      
      // Watch for zoom and speed changes
      this.$watch('spaceZoom', value => {
        if (window.SpaceGallery) window.SpaceGallery.zoom = parseFloat(value);
      });
      this.$watch('spaceSpeed', value => {
        if (window.SpaceGallery) window.SpaceGallery.speed = parseFloat(value);
      });
      
      // Watch for retro game visibility to start/stop
      this.$watch('showRetroGame', value => {
        if (value) {
          setTimeout(() => this.startRetroGame(), 80);
        } else {
          this.stopRetroGame();
        }
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

    async initWeatherSync() {
      try {
        // Silent IP geolocation to completely avoid intrusive browser location popups
        const ipRes = await fetch('https://freeipapi.com/api/json');
        if (!ipRes.ok) throw new Error('IP geolocation failed');
        const ipData = await ipRes.json();
        
        if (ipData && typeof ipData.latitude === 'number' && typeof ipData.longitude === 'number') {
          console.log(`Silent IP geolocation: ${ipData.cityName || 'Unknown City'}, ${ipData.countryName || 'Unknown Country'} (${ipData.latitude}, ${ipData.longitude})`);
          await this.fetchWeather(ipData.latitude, ipData.longitude);
          return;
        }
      } catch (err) {
        console.warn('Silent IP weather lookup failed, falling back to time-of-day defaults:', err);
      }
      
      // Fallback: simple weather based on time of day
      const hour = new Date().getHours();
      let defaultWeather = 'clear';
      if (hour < 6 || hour >= 18) {
        defaultWeather = Math.random() > 0.5 ? 'rain' : 'snow';
      }
      this.applyWeatherPreset(defaultWeather);
    },

    initGyroscope() {
      if (!window.DeviceOrientationEvent) return;

      let hasInitialized = false;

      const setupListeners = () => {
        if (hasInitialized) return;
        hasInitialized = true;

        const handleOrientation = (event) => {
          if (this.screen !== 'game' || !this.view3D) return;
          
          let beta = event.beta;
          let gamma = event.gamma;
          
          if (beta === null || gamma === null) return;
          
          // Account for screen orientation if possible
          let x = gamma;
          let y = beta;
          const orientation = window.orientation || (window.screen && window.screen.orientation && window.screen.orientation.angle) || 0;
          if (orientation === 90) {
            let tmp = x;
            x = -y;
            y = tmp;
          } else if (orientation === -90) {
            let tmp = x;
            x = y;
            y = -tmp;
          } else if (orientation === 180) {
            x = -x;
            y = -y;
          }
          
          // Clamp and offset values to comfortable portrait holding angles
          // Phone tilted forward/backward (pitch, beta) - target holds around 60 deg
          const pitchDiff = y - 60;
          
          // Map to maximum 25 deg tilt limits
          const tiltX = Math.max(-25, Math.min(25, x * 0.8));
          const tiltY = Math.max(-25, Math.min(25, -pitchDiff * 0.8));
          
          const boardEl = document.getElementById('game-board');
          if (boardEl) {
            boardEl.style.setProperty('--tilt-x', `${tiltX.toFixed(1)}deg`);
            boardEl.style.setProperty('--tilt-y', `${tiltY.toFixed(1)}deg`);
          }
        };

        window.addEventListener('deviceorientation', handleOrientation, true);
        window.addEventListener('deviceorientationabsolute', handleOrientation, true);
      };

      // iOS 13+ requires requestPermission
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        const triggerPermission = () => {
          DeviceOrientationEvent.requestPermission()
            .then(permissionState => {
              if (permissionState === 'granted') {
                setupListeners();
              }
            })
            .catch(err => {
              console.error('DeviceOrientation permission request failed:', err);
            });
        };
        document.addEventListener('click', triggerPermission, { once: true });
        document.addEventListener('touchstart', triggerPermission, { once: true });
      } else {
        // Android and older iOS: setup directly, but also on click/touch
        // to handle modern Chrome gesture lockouts.
        setupListeners();
        document.addEventListener('click', setupListeners, { once: true });
        document.addEventListener('touchstart', setupListeners, { once: true });
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
      if (this.socket) { this.socket.disconnect(); this.socket = null; }
      this.socket = io(window.BACKEND_URL || '', {
        autoConnect: true,
        reconnectionAttempts: 10,   // up to ~35s of retries — covers 30s server grace period
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        withCredentials: true
      });
      
      this.socket.on('connect', () => {
        this.socket.emit('auth', { token });
      });
      
      this.socket.on('auth:ok', (data) => {
        window.SoundManager.play('start');
        this.user = { 
          ...this.user, 
          username: data.username, 
          stats: data.stats || this.user.stats,
          elo: data.elo !== undefined ? data.elo : this.user.elo,
          rank: data.rank || this.user.rank,
          profile: data.profile || this.user.profile,
          friends: data.friends || this.user.friends
        };
        if (data.rejoining) return; // game:rejoin will handle navigation
        if (this.mode === 'tournament') {
          this.exitTournament();
        } else {
          this.setScreen('lobby');
        }
      });
      
      this.socket.on('game:rejoin', (data) => { this.roomCode = data.code; this.board = data.board; this.currentTurn = data.currentTurn; this.scores = data.scores; this.mySymbol = data.mySymbol; this.gameActive = true; this.mode = (data.room && data.room.tournamentId) ? 'tournament' : 'online'; this.setScreen('game'); this.updateGameStatus(); this.clearWinningCells(); if (window.SoundManager) window.SoundManager.play('start'); this.lobbyError = ''; }); this.socket.on('game:opponent-disconnected', ({ name }) => { this.lobbyError = `${name || 'Opponent'} disconnected. Waiting for reconnection...`; }); this.socket.on('game:opponent-reconnected', ({ name }) => { this.lobbyError = ''; if (window.SoundManager) window.SoundManager.play('start'); }); this.socket.on('auth:error', () => {
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
        if (window.SoundManager) window.SoundManager.play('start');
        this.board = data.board;
        this.currentTurn = data.currentTurn;
        this.scores = data.scores;
        this.gameActive = true;
        this.gameOver = false;
        this.rematchRequested = false;
        this.rematchFrom = '';
        this.mode = data.tournamentMatch ? 'tournament' : 'online';
        if (data.players) {
          const self = data.players.find(p => p.name === this.user.username);
          if (self) {
            this.mySymbol = self.symbol;
          }
        }
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
        this.rematchRequested = true;
        this.rematchFrom = from || 'Opponent';
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

      // P2P WiFi Discovery & Signaling Listeners
      this.socket.on('p2p:nearby', (nearby) => {
        this.p2pNearbyList = nearby;
      });

      this.socket.on('p2p:invite-received', ({ fromSocketId, fromUsername }) => {
        this.p2pInviteFrom = { socketId: fromSocketId, username: fromUsername };
      });

      this.socket.on('p2p:accepted', ({ targetSocketId }) => {
        this.p2pTargetId = targetSocketId;
        this.p2pRole = 'host';
        this.mySymbol = 'X';
        this.p2pConnectionStatus = 'connecting';
        this.initP2PConnection();
      });

      this.socket.on('p2p:signal', ({ fromSocketId, signal }) => {
        this.p2pTargetId = fromSocketId;
        this.handleP2PSignal(signal);
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
      this.user = { 
        ...this.user, 
        username: data.username, 
        stats: data.stats || this.user.stats,
        elo: data.elo !== undefined ? data.elo : this.user.elo,
        rank: data.rank || this.user.rank,
        profile: data.profile || this.user.profile,
        friends: data.friends || this.user.friends
      };
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
        const res = await fetch((window.BACKEND_URL || '') + endpoint, {
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
        // Generate guest ID like PUBG/CODM: Guest_XXXX (4 digits)
        const guestId = 'Guest_' + Math.floor(1000 + Math.random() * 9000);
        const guestPassword = Math.random().toString(36).substring(2, 15);
        
        // Auto-register guest account
        const res = await fetch((window.BACKEND_URL || '') + '/api/register', {
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
      this.user = {
        username: '',
        stats: { wins: 0, draws: 0, losses: 0, gamesPlayed: 0, winStreak: 0, bestStreak: 0 },
        achievements: [],
        profile: { avatar: 'astronaut', symbol: 'default', theme: 'space', banner: 'nebula', soundPack: 'scifi' },
        elo: 1000,
        rank: 'Cadet',
        friends: []
      };
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
        const res = await fetch((window.BACKEND_URL || '') + '/api/auth/google', {
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
        const res = await fetch((window.BACKEND_URL || '') + '/api/auth/facebook', {
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

    startOffline() {
      this.clearWinningCells();
      this.stopBlitzTimer();
      this.mode = 'offline';
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
      if (!this.gameActive || this.board[index]) return false;
      if (this.mode === 'offline') return true;
      return (this.mode === 'ai' ? this.currentTurn === 'X' : this.currentTurn === this.mySymbol);
    },
    
    makeMove(index) {
      if (!this.canMove(index)) return;
      window.SoundManager.play('click');
      
      if (this.mode === 'offline') {
        const symbol = this.currentTurn;
        this.board[index] = symbol;
        const winLine = this.checkWin(symbol);
        if (winLine) {
          this.scores[symbol]++;
          this.animateWinningLine(winLine);
          setTimeout(() => this.showGameOver(symbol, false), 500);
          return;
        }
        if (this.board.every(c => c)) {
          this.scores.D++;
          this.showGameOver(null, true);
          return;
        }
        this.currentTurn = symbol === 'X' ? 'O' : 'X';
        this.updateGameStatus();
      } else if (this.mode === 'ai') {
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
      } else if (this.mode === 'p2p') {
        const symbol = this.mySymbol;
        this.board[index] = symbol;
        
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
          this.dataChannel.send(JSON.stringify({
            type: 'game:move',
            index: index
          }));
        }
        
        const winLine = this.checkWin(symbol);
        if (winLine) {
          this.scores[symbol]++;
          this.animateWinningLine(winLine);
          setTimeout(() => this.showGameOver(symbol, false), 500);
          return;
        }
        if (this.board.every(c => c)) {
          this.scores.D++;
          this.showGameOver(null, true);
          return;
        }
        this.currentTurn = symbol === 'X' ? 'O' : 'X';
        this.updateGameStatus();
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
      const svg = this._getEl('winning-line');
      if (svg) {
        svg.classList.remove('active');
        const line = this._getEl('win-line');
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
          const cell = this._getCell(index);
          if (cell) {
            cell.classList.add('winning-cell');
            cell.style.animation = 'winPulse 0.6s ease-in-out';
          }
        }, i * 100);
      });

      setTimeout(() => this.drawWinningLine(line), 300);
    },

    drawWinningLine(line) {
      const board = this._getEl('game-board');
      const svg = this._getEl('winning-line');
      const svgLine = this._getEl('win-line');
      if (!board || !svg || !svgLine) return;

      const cells = line.map(i => this._getCell(i));
      if (!cells[0] || !cells[2]) return;

      const boardRect = board.getBoundingClientRect();
      const firstRect = cells[0].getBoundingClientRect();
      const lastRect = cells[2].getBoundingClientRect();

      const x1 = firstRect.left + firstRect.width / 2 - boardRect.left;
      const y1 = firstRect.top + firstRect.height / 2 - boardRect.top;
      const x2 = lastRect.left + lastRect.width / 2 - boardRect.left;
      const y2 = lastRect.top + lastRect.height / 2 - boardRect.top;

      const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

      // Dynamic styling and visual transitions matching each sound pack profile
      const soundPack = (this.user && this.user.profile && this.user.profile.soundPack) || 'scifi';
      let colors = { start: '#00d4ff', mid: '#00ffff', end: '#00d4ff' };
      let durationStr = '0.45s';
      let easingStr = 'ease-out';

      if (soundPack === 'retro') {
        colors = { start: '#ff003c', mid: '#ffbb00', end: '#ff003c' }; // retro pixel red/orange
        durationStr = '0.38s';
        easingStr = 'steps(12, end)'; // blocky arcade sweep
      } else if (soundPack === 'realistic') {
        colors = { start: '#ff9000', mid: '#ffd700', end: '#ff9000' }; // physical golden solar ray
        durationStr = '0.52s';
        easingStr = 'cubic-bezier(0.25, 0.8, 0.25, 1)';
      } else if (soundPack === 'minimal') {
        colors = { start: '#ffffff', mid: '#d1d5db', end: '#ffffff' }; // sleek silver-white strip
        durationStr = '0.22s';
        easingStr = 'cubic-bezier(0.1, 0.9, 0.2, 1)'; // ultra-fast snap
      }

      // Update neonGradient colors in-place
      const stop0 = svg.querySelector('#neonGradient stop:first-child');
      const stop1 = svg.querySelector('#neonGradient stop:nth-child(2)');
      const stop2 = svg.querySelector('#neonGradient stop:last-child');
      if (stop0 && stop1 && stop2) {
        stop0.style.stopColor = colors.start;
        stop1.style.stopColor = colors.mid;
        stop2.style.stopColor = colors.end;
      }

      // Dynamic color for drop-shadow resolving (currentColor)
      svgLine.style.color = colors.mid;

      // ── Glowing Tip Setup ──────────────────────────────────────────────────
      let winTip = svg.querySelector('#win-tip');
      if (!winTip) {
        winTip = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        winTip.id = 'win-tip';
        winTip.setAttribute('r', '7');
        winTip.setAttribute('fill', '#ffffff');
        winTip.style.filter = 'drop-shadow(0 0 10px currentColor)';
        svg.appendChild(winTip);
      }
      winTip.style.color = colors.mid;
      winTip.setAttribute('cx', x1);
      winTip.setAttribute('cy', y1);
      winTip.style.opacity = '1';
      winTip.style.transition = 'none';

      // ── Line Initial State Setup ──────────────────────────────────────────
      svgLine.setAttribute('x1', x1);
      svgLine.setAttribute('y1', y1);
      svgLine.setAttribute('x2', x2);
      svgLine.setAttribute('y2', y2);
      svgLine.style.strokeDasharray = length;
      svgLine.style.strokeDashoffset = length;
      svgLine.style.transition = 'none';

      svg.classList.add('active');

      // Play the custom zipping sound!
      if (window.SoundManager) {
        window.SoundManager.play('zip');
      }

      // Double requestAnimationFrame ensures initial layout styles are registered by browser
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          svgLine.style.transition = `stroke-dashoffset ${durationStr} ${easingStr}`;
          svgLine.style.strokeDashoffset = '0';

          winTip.style.transition = `cx ${durationStr} ${easingStr}, cy ${durationStr} ${easingStr}, opacity 0.15s`;
          winTip.setAttribute('cx', x2);
          winTip.setAttribute('cy', y2);
        });
      });

      // ── Sparkle Burst at the Finish Point ──────────────────────────────────
      setTimeout(() => {
        winTip.style.opacity = '0';

        const sparkCount = 15;
        for (let i = 0; i < sparkCount; i++) {
          const spark = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          spark.setAttribute('cx', x2);
          spark.setAttribute('cy', y2);
          spark.setAttribute('r', 2.5 + Math.random() * 3);
          spark.setAttribute('fill', Math.random() < 0.5 ? colors.mid : colors.start);
          spark.style.filter = 'drop-shadow(0 0 5px currentColor)';
          spark.style.color = colors.mid;
          spark.style.opacity = '1';
          spark.style.transition = 'all 0.65s cubic-bezier(0.1, 0.8, 0.2, 1)';
          svg.appendChild(spark);

          // Random blast angles and velocities
          const angle = Math.random() * Math.PI * 2;
          const speed = 25 + Math.random() * 45;
          const targetX = x2 + Math.cos(angle) * speed;
          const targetY = y2 + Math.sin(angle) * speed;

          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              spark.setAttribute('cx', targetX);
              spark.setAttribute('cy', targetY);
              spark.setAttribute('r', '0.1');
              spark.style.opacity = '0';
            });
          });

          // Garbage-collect spark circle element
          setTimeout(() => spark.remove(), 750);
        }
      }, parseFloat(durationStr) * 1000);
    },
    
    updateGameStatus() {
      if (this.mode === 'offline') {
        this.gameStatus = `PLAYER ${this.currentTurn}'S TURN`;
      } else if (this.mode === 'ai') {
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
      } else if (this.mode === 'offline') {
        window.SoundManager.play('win'); this.gameOverEmoji = '🏆';
        this.gameOverTitle = `PLAYER ${winner} WINS`;
        this.gameOverSubtitle = 'VICTORY ACHIEVED';
        this.user.stats.wins++;
        
        // Celebratory win warp speed animation
        if (window.CinematicSpace && typeof window.CinematicSpace.triggerWarp === 'function') {
          window.CinematicSpace.triggerWarp(5000);
        }
      } else if (winner === this.mySymbol || (this.mode === 'ai' && winner === 'X')) {
        window.SoundManager.play('win'); this.gameOverEmoji = '🏆';
        this.gameOverTitle = 'MISSION COMPLETE';
        this.gameOverSubtitle = 'VICTORY ACHIEVED';
        this.user.stats.wins++;
        this.user.stats.winStreak++;
        this.user.stats.bestStreak = Math.max(this.user.stats.bestStreak, this.user.stats.winStreak);
        this.checkAchievements(winner, draw);
        
        // Celebratory win warp speed animation
        if (window.CinematicSpace && typeof window.CinematicSpace.triggerWarp === 'function') {
          window.CinematicSpace.triggerWarp(5000);
        }
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
        space: 'background: radial-gradient(circle, rgba(0,0,0,0.95) 0%, rgba(0,2,8,0.99) 100%);',
        mars: 'background: radial-gradient(circle, rgba(50,10,3,0.5) 0%, rgba(0,0,0,0.98) 100%);',
        moon: 'background: radial-gradient(circle, rgba(25,25,25,0.6) 0%, rgba(0,0,0,0.99) 100%);',
        jupiter: 'background: radial-gradient(circle, rgba(40,25,5,0.5) 0%, rgba(0,0,0,0.98) 100%);',
        nebula: 'background: radial-gradient(circle, rgba(30,5,40,0.5) 0%, rgba(0,0,0,0.98) 100%);'
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
      } catch (error) {
        // Could not fetch NASA facts, fallback to defaults
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
    
    changeGraphicsMode(mode) {
      if (window.SoundManager) window.SoundManager.play('click');
      this.graphicsMode = mode;
      localStorage.setItem('graphicsMode', mode);
      if (window.CinematicSpace && window.CinematicSpace.setGraphicsMode) {
        window.CinematicSpace.setGraphicsMode(mode);
      }
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
      if (pack === 'custom') {
        const name = window.SoundManager ? window.SoundManager.customMusicName : '';
        const vibe = window.customMusicVibe ? ` [${window.customMusicVibe}]` : '';
        return `Beat-sliced: ${name || 'Uploaded Track'}${vibe}`;
      }
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
      this.rematchRequested = false;
      this.rematchFrom = '';
      if (this.mode === 'ai' || this.mode === 'offline') {
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
      } else if (this.mode === 'p2p') {
        if (this.rematchRequested) {
          this.rematchRequested = false;
          this.rematchFrom = '';
          if (this.p2pRole === 'host') {
            this.clearWinningCells();
            this.stopBlitzTimer();
            this.gameOver = false;
            
            const size = this.boardSize * this.boardSize;
            this.board = Array(size).fill(null);
            this.currentTurn = 'X';
            this.gameActive = true;
            this.gameStartTime = Date.now();
            
            if (this.dataChannel && this.dataChannel.readyState === 'open') {
              this.dataChannel.send(JSON.stringify({
                type: 'game:start',
                boardSize: this.boardSize,
                gameMode: this.gameMode
              }));
            }
            this.updateGameStatus();
            if (window.SoundManager) window.SoundManager.play('start');
          } else {
            if (this.dataChannel && this.dataChannel.readyState === 'open') {
              this.dataChannel.send(JSON.stringify({
                type: 'game:rematch-accept'
              }));
            }
            this.lobbyError = 'Rematch accepted! Waiting for host...';
            setTimeout(() => this.lobbyError = '', 3000);
          }
        } else {
          if (this.dataChannel && this.dataChannel.readyState === 'open') {
            this.dataChannel.send(JSON.stringify({
              type: 'game:rematch-request'
            }));
          }
          this.lobbyError = 'Rematch request sent to opponent...';
          setTimeout(() => this.lobbyError = '', 3000);
        }
      } else {
        this.socket.emit('game:rematch', { code: this.roomCode });
      }
    },
    
    leaveGame() {
      this.clearWinningCells();
      this.stopBlitzTimer();
      this.gameOver = false;
      
      if (this.peerConnection) {
        try { this.peerConnection.close(); } catch(e){}
        this.peerConnection = null;
      }
      if (this.dataChannel) {
        try { this.dataChannel.close(); } catch(e){}
        this.dataChannel = null;
      }
      
      if (this.mode === 'online' && this.roomCode) {
        this.socket.emit('room:leave', { code: this.roomCode });
      }
      if (this.mode === 'tournament') {
        this.exitTournament();
      } else {
        this.setScreen('lobby');
      }
      this.board = Array(this.boardSize * this.boardSize).fill(null);
      this.gameActive = false;
    },
    
    async fetchLeaderboard() {
      try {
        const res = await fetch((window.BACKEND_URL || '') + '/api/leaderboard');
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
      if (this.spaceTab === tab && window.SpaceGallery3D && window.SpaceGallery3D.scene) return;
      
      const isFirstLoad = !window.SpaceGallery3D || !window.SpaceGallery3D.scene;
      
      if (isFirstLoad) {
        this.spaceTabLoading = true;
        this.spaceTab = tab;
        
        // Defer loading slightly to let the loading transition screen render and animate smoothly first
        setTimeout(() => {
          if (window.SpaceGallery3D) {
            if (!window.SpaceGallery3D.scene) {
              window.SpaceGallery3D.init();
            }
            window.SpaceGallery3D.loadTab(tab);
          }
          // Small delay before fading out to hide initial 3D frame block
          setTimeout(() => {
            this.spaceTabLoading = false;
          }, 150);
        }, 250);
      } else {
        // Fast transition
        this.spaceTab = tab;
        if (window.SpaceGallery3D) {
          window.SpaceGallery3D.loadTab(tab);
        }
      }
    },
    
     resetSpaceView() {
      this.selectedObject = null;
      this.spacePOVTarget = 'Sun';
      if (window.SpaceGallery3D) {
        window.SpaceGallery3D.reset();
      }
    },
    
    changeSpacePOV(target) {
      this.spacePOVTarget = target;
      if (window.SpaceGallery3D) {
        window.SpaceGallery3D.setPOVTarget(target);
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
        r: 1.5 + Math.random() * 1.5,
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
      ctx.beginPath();
      ctx.arc(r.x, r.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
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
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
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
