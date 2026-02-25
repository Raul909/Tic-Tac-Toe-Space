// NASA-style Solar System Animation
const SolarSystem = {
  canvas: null,
  ctx: null,
  planets: [],
  stars: [],
  
  init(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    this.createStars();
    this.createPlanets();
    this.animate();
    window.addEventListener('resize', () => this.resize());
  },
  
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  },
  
  createStars() {
    this.stars = Array.from({ length: 300 }, () => ({
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      r: Math.random() * 1.2 + 0.3,
      op: Math.random() * 0.7 + 0.3,
      twinkle: Math.random() * Math.PI * 2
    }));
  },
  
  createPlanets() {
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    
    this.planets = [
      { name: 'Sun', r: 25, dist: 0, speed: 0, color: '#FDB813', angle: 0 },
      { name: 'Mercury', r: 4, dist: 70, speed: 0.04, color: '#8C7853', angle: 0 },
      { name: 'Venus', r: 7, dist: 100, speed: 0.03, color: '#FFC649', angle: Math.PI / 3 },
      { name: 'Earth', r: 8, dist: 130, speed: 0.02, color: '#4A90E2', angle: Math.PI },
      { name: 'Mars', r: 5, dist: 160, speed: 0.018, color: '#E27B58', angle: Math.PI * 1.5 }
    ];
  },
  
  animate() {
    const ctx = this.ctx;
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    
    // Deep space background
    ctx.fillStyle = '#000510';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Stars
    this.stars.forEach(s => {
      s.twinkle += 0.02;
      const alpha = s.op * (0.5 + 0.5 * Math.sin(s.twinkle));
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Subtle nebula
    const nebGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 300);
    nebGrad.addColorStop(0, 'rgba(0, 212, 255, 0.03)');
    nebGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = nebGrad;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Orbits
    this.planets.forEach(p => {
      if (p.dist > 0) {
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, p.dist, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
    
    // Planets
    this.planets.forEach(p => {
      if (p.speed > 0) p.angle += p.speed;
      
      const x = cx + Math.cos(p.angle) * p.dist;
      const y = cy + Math.sin(p.angle) * p.dist;
      
      // Planet glow
      const glow = ctx.createRadialGradient(x, y, 0, x, y, p.r * 2);
      glow.addColorStop(0, p.color);
      glow.addColorStop(0.5, p.color + '44');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, p.r * 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Planet body
      const grad = ctx.createRadialGradient(x - p.r * 0.3, y - p.r * 0.3, 0, x, y, p.r);
      grad.addColorStop(0, p.color);
      grad.addColorStop(1, p.color + '88');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    
    requestAnimationFrame(() => this.animate());
  }
};
