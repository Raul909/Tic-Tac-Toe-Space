// Optimized Space Background - Ultra Realistic
// Reduces lag, improves visuals, maintains 60fps

const OptimizedSpace = {
  canvas: null,
  ctx: null,
  stars: [],
  shooters: [],
  planets: [],
  nebulae: [],
  offscreenCanvas: null,
  offscreenCtx: null,
  lastFrame: 0,
  fps: 60,
  
  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCtx = this.offscreenCanvas.getContext('2d');
    this.resize();
    this.createStars();
    this.createPlanets();
    this.createNebulae();
    this.renderStaticElements();
    this.animate();
  },
  
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.offscreenCanvas.width = this.canvas.width;
    this.offscreenCanvas.height = this.canvas.height;
  },
  
  createStars() {
    // Reduced from 400 to 200 for performance
    this.stars = Array.from({ length: 200 }, () => ({
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      r: Math.random() * 1.5 + 0.3,
      brightness: Math.random(),
      twinkleSpeed: 0.005 + Math.random() * 0.01,
      twinklePhase: Math.random() * Math.PI * 2,
      // Realistic star colors based on temperature
      temp: 3000 + Math.random() * 20000,
      layer: Math.random()
    })).map(s => ({
      ...s,
      color: this.getStarColor(s.temp)
    }));
  },
  
  getStarColor(temp) {
    if (temp < 3700) return '#ff8866'; // Red dwarf
    if (temp < 5200) return '#ffcc99'; // Orange
    if (temp < 6000) return '#fff4e8'; // Yellow
    if (temp < 7500) return '#ffffff'; // White
    if (temp < 10000) return '#e8f4ff'; // Blue-white
    return '#aaccff'; // Blue giant
  },
  
  createPlanets() {
    this.planets = Array.from({ length: 2 }, () => {
      const type = Math.random();
      return {
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height * 0.7,
        r: 30 + Math.random() * 50,
        type: type < 0.3 ? 'rocky' : type < 0.6 ? 'gas' : 'ice',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: 0.0001 + Math.random() * 0.0002
      };
    });
  },
  
  createNebulae() {
    this.nebulae = Array.from({ length: 4 }, () => ({
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      r: 200 + Math.random() * 300,
      hue: 200 + Math.random() * 60,
      drift: Math.random() * 0.02
    }));
  },
  
  renderStaticElements() {
    // Render nebulae and planets to offscreen canvas (only once)
    this.offscreenCtx.fillStyle = '#05060e';
    this.offscreenCtx.fillRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
    
    // Nebulae
    this.nebulae.forEach(n => {
      const g = this.offscreenCtx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
      g.addColorStop(0, `hsla(${n.hue}, 60%, 25%, 0.08)`);
      g.addColorStop(0.5, `hsla(${n.hue}, 50%, 20%, 0.04)`);
      g.addColorStop(1, 'transparent');
      this.offscreenCtx.fillStyle = g;
      this.offscreenCtx.fillRect(n.x - n.r, n.y - n.r, n.r * 2, n.r * 2);
    });
  },
  
  animate(timestamp = 0) {
    const delta = timestamp - this.lastFrame;
    this.lastFrame = timestamp;
    
    // Draw static background
    this.ctx.drawImage(this.offscreenCanvas, 0, 0);
    
    // Fade overlay for trails
    this.ctx.fillStyle = 'rgba(5, 6, 14, 0.15)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Render dynamic elements
    this.renderPlanets();
    this.renderStars(timestamp);
    this.renderShootingStars();
    
    requestAnimationFrame((t) => this.animate(t));
  },
  
  renderPlanets() {
    this.planets.forEach(p => {
      p.rotation += p.rotationSpeed;
      
      const ctx = this.ctx;
      const { x, y, r, type } = p;
      
      // Planet colors based on type
      let baseHue, baseSat, baseLit;
      if (type === 'rocky') {
        baseHue = 20 + Math.random() * 40;
        baseSat = 30;
        baseLit = 40;
      } else if (type === 'gas') {
        baseHue = 30 + Math.random() * 60;
        baseSat = 50;
        baseLit = 50;
      } else {
        baseHue = 180 + Math.random() * 60;
        baseSat = 40;
        baseLit = 60;
      }
      
      // Realistic 3D shading
      const lightAngle = Math.PI * 0.75;
      const lightX = x + Math.cos(lightAngle) * r * 0.4;
      const lightY = y + Math.sin(lightAngle) * r * 0.4;
      
      const g = ctx.createRadialGradient(lightX, lightY, r * 0.1, x, y, r);
      g.addColorStop(0, `hsl(${baseHue}, ${baseSat}%, ${baseLit + 25}%)`);
      g.addColorStop(0.4, `hsl(${baseHue}, ${baseSat}%, ${baseLit}%)`);
      g.addColorStop(0.8, `hsl(${baseHue}, ${baseSat}%, ${baseLit - 25}%)`);
      g.addColorStop(1, `hsl(${baseHue}, ${baseSat}%, ${baseLit - 35}%)`);
      
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      
      // Shadow overlay
      const shadowG = ctx.createRadialGradient(x + r * 0.3, y + r * 0.3, 0, x, y, r);
      shadowG.addColorStop(0, 'rgba(0, 0, 0, 0)');
      shadowG.addColorStop(0.7, 'rgba(0, 0, 0, 0.5)');
      shadowG.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
      ctx.fillStyle = shadowG;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    });
  },
  
  renderStars(timestamp) {
    this.stars.forEach(s => {
      s.twinklePhase += s.twinkleSpeed;
      const twinkle = 0.5 + 0.5 * Math.sin(s.twinklePhase);
      const alpha = s.brightness * twinkle;
      
      // Star with glow
      const g = this.ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 3);
      g.addColorStop(0, s.color);
      g.addColorStop(0.3, s.color.replace(')', `, ${alpha * 0.6})`));
      g.addColorStop(1, 'transparent');
      
      this.ctx.fillStyle = g;
      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Core
      this.ctx.fillStyle = s.color;
      this.ctx.globalAlpha = alpha;
      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.globalAlpha = 1;
    });
  },
  
  renderShootingStars() {
    // Spawn new shooting stars
    if (Math.random() < 0.01) {
      this.shooters.push({
        x: Math.random() * this.canvas.width * 0.8,
        y: Math.random() * this.canvas.height * 0.4,
        vx: 6 + Math.random() * 10,
        vy: 4 + Math.random() * 6,
        life: 1,
        len: 100 + Math.random() * 150
      });
    }
    
    // Render and update
    this.shooters = this.shooters.filter(s => s.life > 0);
    this.shooters.forEach(s => {
      const g = this.ctx.createLinearGradient(
        s.x, s.y,
        s.x - s.vx * s.len / 4, s.y - s.vy * s.len / 4
      );
      g.addColorStop(0, `rgba(255, 255, 255, ${s.life})`);
      g.addColorStop(0.5, `rgba(200, 220, 255, ${s.life * 0.5})`);
      g.addColorStop(1, 'transparent');
      
      this.ctx.strokeStyle = g;
      this.ctx.lineWidth = 2.5;
      this.ctx.lineCap = 'round';
      this.ctx.beginPath();
      this.ctx.moveTo(s.x, s.y);
      this.ctx.lineTo(s.x - s.vx * s.len / 4, s.y - s.vy * s.len / 4);
      this.ctx.stroke();
      
      // Bright head
      this.ctx.fillStyle = `rgba(255, 255, 255, ${s.life})`;
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = '#fff';
      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
      
      s.x += s.vx;
      s.y += s.vy;
      s.life -= 0.015;
    });
  }
};

// Export for use
if (typeof module !== 'undefined') module.exports = OptimizedSpace;
