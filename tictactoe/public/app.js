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
    
    // Space Gallery
    spaceTab: 'solar',
    spaceZoom: 1,
    spaceSpeed: 1,
    selectedObject: null,
    
    init() {
      const token = localStorage.getItem('token');
      if (token) {
        this.connectSocket(token);
      }
      this.initSpaceGallery();
    },
    
    connectSocket(token) {
      this.socket = io({ autoConnect: true, reconnectionAttempts: 5, withCredentials: true });
      
      this.socket.on('connect', () => {
        this.socket.emit('auth', { token });
      });
      
      this.socket.on('auth:ok', (data) => {
        this.user = { username: data.username, stats: data.stats };
        this.screen = 'lobby';
      });
      
      this.socket.on('auth:error', () => {
        localStorage.removeItem('token');
        this.screen = 'auth';
      });
      
      this.socket.on('room:created', ({ code, symbol }) => {
        this.roomCode = code;
        this.mySymbol = symbol;
        this.screen = 'waiting';
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
        this.screen = 'game';
        this.updateGameStatus();
      });
      
      this.socket.on('game:move', ({ index, symbol }) => {
        this.board[index] = symbol;
      });
      
      this.socket.on('game:turn', ({ currentTurn }) => {
        this.currentTurn = currentTurn;
        this.updateGameStatus();
      });
      
      this.socket.on('game:over', ({ winner, draw, scores }) => {
        this.scores = scores;
        this.gameActive = false;
        this.showGameOver(winner, draw);
        if (winner) {
          const color = winner === 'X' ? '#ff6b35' : '#4dffdb';
          if (window.FW) window.FW.launch(color, color);
        }
      });
    },
    
    async login() {
      this.loginError = '';
      if (!this.loginForm.username || !this.loginForm.password) {
        this.loginError = 'Please fill all fields';
        return;
      }
      
      this.loginLoading = true;
      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(this.loginForm)
        });
        const data = await res.json();
        
        if (data.ok) {
          localStorage.setItem('token', data.token);
          this.user = { username: data.username, stats: data.stats };
          this.connectSocket(data.token);
        } else {
          this.loginError = data.error;
        }
      } catch (e) {
        this.loginError = 'Connection error';
      }
      this.loginLoading = false;
    },
    
    async register() {
      this.registerError = '';
      if (!this.registerForm.username || !this.registerForm.password) {
        this.registerError = 'Please fill all fields';
        return;
      }
      
      this.registerLoading = true;
      try {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(this.registerForm)
        });
        const data = await res.json();
        
        if (data.ok) {
          localStorage.setItem('token', data.token);
          this.user = { username: data.username, stats: data.stats };
          this.connectSocket(data.token);
        } else {
          this.registerError = data.error;
        }
      } catch (e) {
        this.registerError = 'Connection error';
      }
      this.registerLoading = false;
    },
    
    logout() {
      localStorage.removeItem('token');
      if (this.socket) this.socket.disconnect();
      this.screen = 'auth';
      this.user = { username: '', stats: { wins: 0, draws: 0, losses: 0 } };
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
      this.screen = 'lobby';
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
      this.screen = 'game';
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
        if (this.checkWin('X')) {
          this.scores.X++;
          this.showGameOver('X', false);
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
        if (this.checkWin('O')) {
          this.scores.O++;
          this.showGameOver('O', false);
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
      const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
      return wins.some(line => line.every(i => this.board[i] === player));
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
      this.screen = 'lobby';
      this.board = Array(9).fill(null);
      this.gameActive = false;
    },
    
    openSpaceGallery() {
      this.screen = 'space';
      setTimeout(() => this.loadSpaceTab(this.spaceTab), 100);
    },
    
    closeSpaceGallery() {
      this.screen = 'lobby';
    },
    
    initSpaceGallery() {
      // Initialize space gallery canvas
      window.SpaceGallery = {
        canvas: null,
        ctx: null,
        objects: [],
        currentTab: 'solar',
        zoom: 1,
        speed: 1,
        rotation: 0,
        offset: { x: 0, y: 0 },
        dragStart: null,
        hoveredObj: null,
        selectedObj: null,
        
        solarSystem: [
          { name: 'Sun', type: 'Star', radius: 20, distance: 0, color: '#FDB813', temp: '5778K', mass: '1.989×10³⁰ kg' },
          { name: 'Mercury', type: 'Planet', radius: 4, distance: 80, color: '#8C7853', orbit: 0.24, temp: '167°C', moons: 0 },
          { name: 'Venus', type: 'Planet', radius: 9, distance: 120, color: '#FFC649', orbit: 0.62, temp: '464°C', moons: 0 },
          { name: 'Earth', type: 'Planet', radius: 10, distance: 170, color: '#4A90E2', orbit: 1, temp: '15°C', moons: 1 },
          { name: 'Mars', type: 'Planet', radius: 5, distance: 220, color: '#E27B58', orbit: 1.88, temp: '-65°C', moons: 2 },
          { name: 'Jupiter', type: 'Planet', radius: 18, distance: 300, color: '#C88B3A', orbit: 11.86, temp: '-110°C', moons: 79 },
          { name: 'Saturn', type: 'Planet', radius: 16, distance: 380, color: '#FAD5A5', orbit: 29.46, temp: '-140°C', moons: 82, rings: true },
          { name: 'Uranus', type: 'Planet', radius: 12, distance: 450, color: '#4FD0E7', orbit: 84.01, temp: '-195°C', moons: 27 },
          { name: 'Neptune', type: 'Planet', radius: 12, distance: 510, color: '#4166F5', orbit: 164.79, temp: '-200°C', moons: 14 }
        ],
        
        nearbyStars: [
          { name: 'Proxima Centauri', type: 'Red Dwarf', distance: 4.24, color: '#FF6B6B', temp: '3042K', mass: '0.12 M☉' },
          { name: 'Alpha Centauri A', type: 'G-type Star', distance: 4.37, color: '#FFF4E6', temp: '5790K', mass: '1.1 M☉' },
          { name: 'Alpha Centauri B', type: 'K-type Star', distance: 4.37, color: '#FFE4B5', temp: '5260K', mass: '0.9 M☉' },
          { name: "Barnard's Star", type: 'Red Dwarf', distance: 5.96, color: '#FF8C8C', temp: '3134K', mass: '0.14 M☉' },
          { name: 'Wolf 359', type: 'Red Dwarf', distance: 7.86, color: '#FF7777', temp: '2800K', mass: '0.09 M☉' },
          { name: 'Sirius A', type: 'A-type Star', distance: 8.6, color: '#E8F4FF', temp: '9940K', mass: '2.02 M☉' },
          { name: 'Sirius B', type: 'White Dwarf', distance: 8.6, color: '#FFFFFF', temp: '25200K', mass: '1.02 M☉' },
          { name: 'Luyten 726-8', type: 'Red Dwarf', distance: 8.73, color: '#FF9999', temp: '2670K', mass: '0.1 M☉' }
        ],
        
        nebulae: [
          { name: 'Orion Nebula', type: 'Emission Nebula', distance: 1344, color: '#FF6B9D', size: 24, constellation: 'Orion' },
          { name: 'Crab Nebula', type: 'Supernova Remnant', distance: 6500, color: '#4ECDC4', size: 11, constellation: 'Taurus' },
          { name: 'Ring Nebula', type: 'Planetary Nebula', distance: 2300, color: '#95E1D3', size: 1.4, constellation: 'Lyra' },
          { name: 'Eagle Nebula', type: 'Emission Nebula', distance: 7000, color: '#F38181', size: 70, constellation: 'Serpens' },
          { name: 'Helix Nebula', type: 'Planetary Nebula', distance: 650, color: '#AA96DA', size: 2.5, constellation: 'Aquarius' },
          { name: 'Horsehead Nebula', type: 'Dark Nebula', distance: 1500, color: '#5D5D5D', size: 3.5, constellation: 'Orion' }
        ],
        
        init() {
          this.canvas = document.getElementById('space-gallery-canvas');
          if (!this.canvas) return;
          this.ctx = this.canvas.getContext('2d');
          this.resize();
          this.setupEvents();
          this.animate();
        },
        
        resize() {
          const rect = this.canvas.parentElement.getBoundingClientRect();
          this.canvas.width = rect.width;
          this.canvas.height = 500;
        },
        
        setupEvents() {
          this.canvas.addEventListener('mousedown', (e) => {
            this.dragStart = { x: e.clientX - this.offset.x, y: e.clientY - this.offset.y };
          });
          
          this.canvas.addEventListener('mousemove', (e) => {
            if (this.dragStart) {
              this.offset.x = e.clientX - this.dragStart.x;
              this.offset.y = e.clientY - this.dragStart.y;
            }
            this.checkHover(e);
          });
          
          this.canvas.addEventListener('mouseup', () => {
            this.dragStart = null;
          });
          
          this.canvas.addEventListener('click', (e) => {
            if (this.hoveredObj) {
              this.selectObject(this.hoveredObj.id);
            }
          });
        },
        
        loadTab(tab) {
          this.currentTab = tab;
          this.selectedObj = null;
          this.offset = { x: 0, y: 0 };
          this.rotation = 0;
          
          if (tab === 'solar') {
            this.objects = this.solarSystem.map((o, i) => ({ ...o, angle: Math.random() * Math.PI * 2, id: i }));
          } else if (tab === 'stars') {
            this.objects = this.nearbyStars.map((o, i) => ({ ...o, x: Math.random() * 400 - 200, y: Math.random() * 400 - 200, z: Math.random() * 200 - 100, id: i }));
          } else {
            this.objects = this.nebulae.map((o, i) => ({ ...o, x: Math.random() * 500 - 250, y: Math.random() * 500 - 250, z: Math.random() * 150 - 75, id: i }));
          }
          
          this.updateObjectsList();
        },
        
        updateObjectsList() {
          const list = document.getElementById('space-objects-list');
          list.innerHTML = this.objects.map(o => 
            `<div class="space-object-item" onclick="window.SpaceGallery.selectObject(${o.id})">
              <div class="font-bold">${o.name}</div>
              <div class="text-xs text-gray-400">${o.type}</div>
            </div>`
          ).join('');
        },
        
        selectObject(id) {
          this.selectedObj = this.objects.find(o => o.id === id);
          document.querySelectorAll('.space-object-item').forEach((el, i) => {
            el.classList.toggle('active', i === id);
          });
          this.showDetails(this.selectedObj);
        },
        
        showDetails(obj) {
          const details = document.getElementById('space-object-details');
          if (!obj) {
            details.innerHTML = '';
            return;
          }
          
          let html = `<div class="font-bold text-nasa mb-2">${obj.name}</div>`;
          html += `<div class="text-xs text-gray-400 mb-2">${obj.type}</div>`;
          if (obj.temp) html += `<div>Temp: ${obj.temp}</div>`;
          if (obj.mass) html += `<div>Mass: ${obj.mass}</div>`;
          if (obj.distance !== undefined && this.currentTab === 'solar') html += `<div>Distance: ${obj.distance}M km</div>`;
          if (obj.distance && this.currentTab !== 'solar') html += `<div>Distance: ${obj.distance} ly</div>`;
          if (obj.orbit) html += `<div>Orbit: ${obj.orbit} years</div>`;
          if (obj.moons !== undefined) html += `<div>Moons: ${obj.moons}</div>`;
          if (obj.size) html += `<div>Size: ${obj.size} ly</div>`;
          if (obj.constellation) html += `<div>Constellation: ${obj.constellation}</div>`;
          
          details.innerHTML = html;
        },
        
        checkHover(e) {
          const rect = this.canvas.getBoundingClientRect();
          const mx = e.clientX - rect.left;
          const my = e.clientY - rect.top;
          this.hoveredObj = null;
          
          for (const obj of this.objects) {
            const pos = this.getScreenPos(obj);
            const dist = Math.sqrt((mx - pos.x) ** 2 + (my - pos.y) ** 2);
            if (dist < (obj.radius || 15) * this.zoom) {
              this.hoveredObj = obj;
              this.canvas.style.cursor = 'pointer';
              return;
            }
          }
          this.canvas.style.cursor = this.dragStart ? 'grabbing' : 'grab';
        },
        
        getScreenPos(obj) {
          const cx = this.canvas.width / 2 + this.offset.x;
          const cy = this.canvas.height / 2 + this.offset.y;
          
          if (this.currentTab === 'solar') {
            const angle = obj.angle + (obj.orbit ? this.rotation * obj.orbit : 0);
            return {
              x: cx + Math.cos(angle) * obj.distance * this.zoom,
              y: cy + Math.sin(angle) * obj.distance * this.zoom
            };
          } else {
            const rotX = obj.x * Math.cos(this.rotation) - obj.z * Math.sin(this.rotation);
            const rotZ = obj.x * Math.sin(this.rotation) + obj.z * Math.cos(this.rotation);
            return {
              x: cx + rotX * this.zoom,
              y: cy + obj.y * this.zoom,
              z: rotZ
            };
          }
        },
        
        animate() {
          this.ctx.fillStyle = 'rgba(0, 5, 16, 0.9)';
          this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
          
          this.rotation += 0.001 * this.speed;
          
          const sorted = [...this.objects].sort((a, b) => {
            const pa = this.getScreenPos(a);
            const pb = this.getScreenPos(b);
            return (pb.z || 0) - (pa.z || 0);
          });
          
          sorted.forEach(obj => {
            const pos = this.getScreenPos(obj);
            const r = (obj.radius || 15) * this.zoom;
            const isHovered = this.hoveredObj === obj;
            const isSelected = this.selectedObj === obj;
            
            // Draw orbit
            if (this.currentTab === 'solar' && obj.distance > 0) {
              this.ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)';
              this.ctx.lineWidth = 1;
              this.ctx.beginPath();
              this.ctx.arc(this.canvas.width / 2 + this.offset.x, this.canvas.height / 2 + this.offset.y, obj.distance * this.zoom, 0, Math.PI * 2);
              this.ctx.stroke();
            }
            
            // Highlight
            if (isHovered || isSelected) {
              const g = this.ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, r * 2);
              g.addColorStop(0, obj.color + '44');
              g.addColorStop(1, 'transparent');
              this.ctx.fillStyle = g;
              this.ctx.fillRect(pos.x - r * 2, pos.y - r * 2, r * 4, r * 4);
            }
            
            // Planet/star
            const g = this.ctx.createRadialGradient(pos.x - r * 0.3, pos.y - r * 0.3, 0, pos.x, pos.y, r);
            g.addColorStop(0, obj.color);
            g.addColorStop(1, obj.color + '88');
            this.ctx.fillStyle = g;
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Rings
            if (obj.rings) {
              this.ctx.strokeStyle = obj.color + '66';
              this.ctx.lineWidth = r * 0.4;
              this.ctx.beginPath();
              this.ctx.ellipse(pos.x, pos.y, r * 2, r * 0.5, 0, 0, Math.PI * 2);
              this.ctx.stroke();
            }
            
            // Label
            if (isHovered) {
              this.ctx.fillStyle = '#fff';
              this.ctx.font = '12px "Exo 2"';
              this.ctx.textAlign = 'center';
              this.ctx.fillText(obj.name, pos.x, pos.y - r - 10);
            }
          });
          
          requestAnimationFrame(() => this.animate());
        }
      };
    },
    
    loadSpaceTab(tab) {
      this.spaceTab = tab;
      if (window.SpaceGallery) {
        if (!window.SpaceGallery.canvas) {
          window.SpaceGallery.init();
        }
        window.SpaceGallery.loadTab(tab);
        window.SpaceGallery.zoom = this.spaceZoom;
        window.SpaceGallery.speed = this.spaceSpeed;
      }
    },
    
    resetSpaceView() {
      this.spaceZoom = 1;
      this.spaceSpeed = 1;
      this.selectedObject = null;
      if (window.SpaceGallery) {
        window.SpaceGallery.offset = { x: 0, y: 0 };
        window.SpaceGallery.zoom = 1;
        window.SpaceGallery.speed = 1;
        window.SpaceGallery.rotation = 0;
        window.SpaceGallery.selectedObj = null;
        document.getElementById('space-object-details').innerHTML = '';
        document.querySelectorAll('.space-object-item').forEach(el => el.classList.remove('active'));
      }
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
