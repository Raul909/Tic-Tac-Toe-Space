// Three.js 3D Space Background with Cinematic Lighting
(function() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000208, 0.0012);
  
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
  const renderer = new THREE.WebGLRenderer({ 
    canvas: document.getElementById('three-canvas'),
    alpha: true,
    antialias: window.devicePixelRatio < 2,
    powerPreference: 'high-performance',
    stencil: false,
    depth: true
  });
  
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.outputEncoding = THREE.sRGBEncoding;
  camera.position.set(0, 25, 90);
  
  // Optimized Starfield with Instancing
  const starGeometry = new THREE.BufferGeometry();
  const starVertices = [];
  const starColors = [];
  const starSizes = [];
  
  for (let i = 0; i < 12000; i++) {
    const x = (Math.random() - 0.5) * 2500;
    const y = (Math.random() - 0.5) * 2500;
    const z = (Math.random() - 0.5) * 2500;
    starVertices.push(x, y, z);
    
    // Realistic star colors based on temperature
    const temp = Math.random();
    if (temp < 0.05) {
      starColors.push(0.7, 0.85, 1.0); // Blue giants
    } else if (temp < 0.3) {
      starColors.push(1.0, 1.0, 1.0); // White
    } else if (temp < 0.6) {
      starColors.push(1.0, 0.98, 0.85); // Yellow
    } else if (temp < 0.85) {
      starColors.push(1.0, 0.85, 0.65); // Orange
    } else {
      starColors.push(1.0, 0.7, 0.6); // Red dwarfs
    }
    
    starSizes.push(Math.random() * 1.8 + 0.4);
  }
  
  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
  starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
  starGeometry.setAttribute('size', new THREE.Float32BufferAttribute(starSizes, 1));
  
  const starMaterial = new THREE.PointsMaterial({ 
    size: 1.2,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  
  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);
  
  // Nebula with better performance
  const nebulaGeometry = new THREE.BufferGeometry();
  const nebulaVertices = [];
  const nebulaColors = [];
  
  for (let i = 0; i < 2000; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const r = 700 + Math.random() * 500;
    
    nebulaVertices.push(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    );
    
    // Purple/cyan nebula
    const intensity = Math.random() * 0.4;
    nebulaColors.push(
      0.2 + intensity * 0.8,
      0.15 + intensity * 0.6,
      0.7 + intensity
    );
  }
  
  nebulaGeometry.setAttribute('position', new THREE.Float32BufferAttribute(nebulaVertices, 3));
  nebulaGeometry.setAttribute('color', new THREE.Float32BufferAttribute(nebulaColors, 3));
  
  const nebulaMaterial = new THREE.PointsMaterial({
    size: 10,
    vertexColors: true,
    transparent: true,
    opacity: 0.18,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  
  const nebula = new THREE.Points(nebulaGeometry, nebulaMaterial);
  scene.add(nebula);
  
  // Realistic Planets with PBR materials
  const planets = [];
  
  function createPlanet(radius, color, roughness, metalness, position, hasRings = false, hasAtmosphere = false, atmosphereColor = null) {
    const geometry = new THREE.SphereGeometry(radius, 48, 48);
    const material = new THREE.MeshStandardMaterial({ 
      color: color,
      roughness: roughness,
      metalness: metalness,
      emissive: color,
      emissiveIntensity: 0.05
    });
    
    const planet = new THREE.Mesh(geometry, material);
    planet.position.set(position.x, position.y, position.z);
    planet.castShadow = true;
    planet.receiveShadow = true;
    scene.add(planet);
    
    // Atmospheric glow
    if (hasAtmosphere) {
      const glowGeometry = new THREE.SphereGeometry(radius * 1.12, 32, 32);
      const glowMaterial = new THREE.ShaderMaterial({
        uniforms: {
          c: { value: 0.4 },
          p: { value: 3.5 },
          glowColor: { value: new THREE.Color(atmosphereColor || color) }
        },
        vertexShader: `
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 glowColor;
          uniform float c;
          uniform float p;
          varying vec3 vNormal;
          void main() {
            float intensity = pow(c - dot(vNormal, vec3(0.0, 0.0, 1.0)), p);
            gl_FragColor = vec4(glowColor, 1.0) * intensity;
          }
        `,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      planet.add(glow);
    }
    
    // Rings with realistic shadows
    if (hasRings) {
      const ringGeometry = new THREE.RingGeometry(radius * 1.4, radius * 2.3, 64);
      const ringMaterial = new THREE.MeshStandardMaterial({
        color: color,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
        roughness: 0.8,
        metalness: 0.1
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2.2;
      ring.castShadow = true;
      ring.receiveShadow = true;
      planet.add(ring);
    }
    
    return planet;
  }
  
  // Sun with volumetric glow
  const sunGeometry = new THREE.SphereGeometry(12, 48, 48);
  const sunMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xFFD700,
    emissive: 0xFFD700,
    emissiveIntensity: 1.5
  });
  const sun = new THREE.Mesh(sunGeometry, sunMaterial);
  sun.position.set(-100, 30, -150);
  scene.add(sun);
  
  // Volumetric sun glow layers
  const sunGlow = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const glowGeometry = new THREE.SphereGeometry(14 + i * 3, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: i === 0 ? 0xFFAA00 : 0xFF8800,
      transparent: true,
      opacity: 0.15 - i * 0.04,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    sunGlow.add(glow);
  }
  sun.add(sunGlow);
  
  // Earth - blue marble with atmosphere
  const earth = createPlanet(4.5, 0x2E5F8C, 0.7, 0.1, { x: 40, y: -15, z: -60 }, false, true, 0x4A90E2);
  planets.push({ mesh: earth, speed: 0.0008, radius: 50, angle: 0, rotationSpeed: 0.01 });
  
  // Mars - red planet
  const mars = createPlanet(3.2, 0xCD5C5C, 0.9, 0.05, { x: -50, y: 20, z: -70 }, false, false);
  planets.push({ mesh: mars, speed: 0.0005, radius: 65, angle: Math.PI, rotationSpeed: 0.008 });
  
  // Jupiter - gas giant with bands
  const jupiter = createPlanet(8.5, 0xC88B3A, 0.6, 0.2, { x: 80, y: 35, z: -100 }, false, false);
  planets.push({ mesh: jupiter, speed: 0.0002, radius: 90, angle: Math.PI / 2, rotationSpeed: 0.015 });
  
  // Saturn - with majestic rings
  const saturn = createPlanet(7.5, 0xE8D4A0, 0.7, 0.15, { x: -70, y: -25, z: -90 }, true, false);
  planets.push({ mesh: saturn, speed: 0.00015, radius: 80, angle: Math.PI * 1.5, rotationSpeed: 0.012 });
  
  // Venus - bright morning star
  const venus = createPlanet(3.8, 0xFFC649, 0.5, 0.1, { x: 25, y: 10, z: -50 }, false, true, 0xFFE4B5);
  planets.push({ mesh: venus, speed: 0.001, radius: 40, angle: Math.PI / 4, rotationSpeed: 0.005 });
  
  // Cinematic Three-Point Lighting System
  const ambientLight = new THREE.AmbientLight(0x1a1a2e, 0.4);
  scene.add(ambientLight);
  
  // Key Light - Sun (warm, bright)
  const sunLight = new THREE.PointLight(0xFFD700, 3.5, 400);
  sunLight.position.copy(sun.position);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 10;
  sunLight.shadow.camera.far = 400;
  sunLight.shadow.bias = -0.0001;
  scene.add(sunLight);
  
  // Fill Light - soft blue (simulates scattered light)
  const fillLight = new THREE.DirectionalLight(0x4A90E2, 0.4);
  fillLight.position.set(-80, 40, 60);
  scene.add(fillLight);
  
  // Rim/Back Light - purple/cyan (edge definition)
  const rimLight = new THREE.DirectionalLight(0x8A2BE2, 0.6);
  rimLight.position.set(60, -30, -80);
  scene.add(rimLight);
  
  // Accent Light - cyan (depth and atmosphere)
  const accentLight = new THREE.PointLight(0x00CED1, 0.8, 200);
  accentLight.position.set(0, 80, 50);
  scene.add(accentLight);
  
  // Optimized Shooting Stars
  const shootingStars = [];
  
  function createShootingStar() {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    
    for (let i = 0; i < 15; i++) {
      positions.push(0, 0, 0);
      const intensity = 1 - (i / 15);
      colors.push(1, 0.95, 0.8 + intensity * 0.2);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    const line = new THREE.Line(geometry, material);
    
    const angle = Math.random() * Math.PI * 2;
    const distance = 150 + Math.random() * 250;
    line.position.set(
      Math.cos(angle) * distance,
      40 + Math.random() * 80,
      Math.sin(angle) * distance
    );
    
    const speed = 2.5 + Math.random() * 2;
    const direction = new THREE.Vector3(
      (Math.random() - 0.5) * 1.5,
      -1.2 - Math.random() * 0.5,
      (Math.random() - 0.5) * 1.5
    ).normalize();
    
    scene.add(line);
    
    return {
      line: line,
      velocity: direction.multiplyScalar(speed),
      life: 1,
      positions: positions
    };
  }
  
  setInterval(() => {
    if (Math.random() < 0.25 && shootingStars.length < 3) {
      shootingStars.push(createShootingStar());
    }
  }, 3000);
  
  // Optimized Asteroid Belt
  const asteroidGeometry = new THREE.DodecahedronGeometry(0.5, 0);
  const asteroids = [];
  
  for (let i = 0; i < 60; i++) {
    const material = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.95,
      metalness: 0.2,
      flatShading: true
    });
    const asteroid = new THREE.Mesh(asteroidGeometry, material);
    
    const angle = Math.random() * Math.PI * 2;
    const distance = 105 + Math.random() * 25;
    asteroid.position.set(
      Math.cos(angle) * distance,
      (Math.random() - 0.5) * 8,
      Math.sin(angle) * distance
    );
    
    asteroid.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    
    const scale = 0.4 + Math.random() * 0.6;
    asteroid.scale.set(scale, scale, scale);
    asteroid.castShadow = true;
    
    scene.add(asteroid);
    asteroids.push({
      mesh: asteroid,
      rotationSpeed: (Math.random() - 0.5) * 0.015,
      orbitSpeed: 0.00012 + Math.random() * 0.00015,
      angle: angle,
      distance: distance
    });
  }
  
  // Performance-optimized Animation Loop
  let lastTime = 0;
  const targetFPS = 60;
  const frameTime = 1000 / targetFPS;
  
  function animate(currentTime) {
    requestAnimationFrame(animate);
    
    const deltaTime = currentTime - lastTime;
    if (deltaTime < frameTime) return;
    lastTime = currentTime - (deltaTime % frameTime);
    
    // Subtle star rotation
    stars.rotation.y += 0.00008;
    nebula.rotation.y -= 0.00005;
    
    // Sun rotation with glow
    sun.rotation.y += 0.001;
    sunGlow.rotation.y -= 0.0015;
    sunGlow.rotation.z += 0.0008;
    
    // Planet orbits and rotation
    const centerX = sun.position.x;
    const centerZ = sun.position.z;
    
    planets.forEach(planet => {
      planet.angle += planet.speed;
      planet.mesh.position.x = centerX + Math.cos(planet.angle) * planet.radius;
      planet.mesh.position.z = centerZ + Math.sin(planet.angle) * planet.radius;
      planet.mesh.rotation.y += planet.rotationSpeed;
    });
    
    // Asteroid belt animation
    asteroids.forEach(asteroid => {
      asteroid.angle += asteroid.orbitSpeed;
      asteroid.mesh.position.x = centerX + Math.cos(asteroid.angle) * asteroid.distance;
      asteroid.mesh.position.z = centerZ + Math.sin(asteroid.angle) * asteroid.distance;
      asteroid.mesh.rotation.x += asteroid.rotationSpeed;
      asteroid.mesh.rotation.y += asteroid.rotationSpeed * 0.7;
    });
    
    // Shooting stars
    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const star = shootingStars[i];
      star.line.position.add(star.velocity);
      star.life -= 0.015;
      star.line.material.opacity = star.life * 0.9;
      
      if (star.life <= 0) {
        scene.remove(star.line);
        star.line.geometry.dispose();
        star.line.material.dispose();
        shootingStars.splice(i, 1);
      }
    }
    
    // Cinematic camera movement
    const time = currentTime * 0.0001;
    camera.position.x = Math.sin(time) * 4;
    camera.position.y = 25 + Math.cos(time * 0.7) * 2;
    camera.lookAt(0, 0, -50);
    
    renderer.render(scene, camera);
  }
  
  animate(0);
  
  // Responsive resize with debouncing
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }, 100);
  });
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    scene.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(mat => mat.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    renderer.dispose();
  });
})();
