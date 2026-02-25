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
  
  // Interactive Mouse Effects - Elements react to cursor
  const mouse = { x: 0, y: 0 };
  const mouseInfluence = { x: 0, y: 0 };
  
  document.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });
  
  // Smooth mouse influence
  function updateMouseInfluence() {
    mouseInfluence.x += (mouse.x - mouseInfluence.x) * 0.05;
    mouseInfluence.y += (mouse.y - mouseInfluence.y) * 0.05;
  }
  
  // Weather system for background
  let bgWeatherParticles = null;
  let currentBgWeather = 'clear';
  
  // Sync with Space Gallery weather
  function syncBackgroundWeather() {
    if (window.SpaceGallery3D && window.SpaceGallery3D.currentWeather) {
      const weather = window.SpaceGallery3D.currentWeather;
      if (weather !== currentBgWeather) {
        currentBgWeather = weather;
        updateBackgroundWeather();
      }
    }
  }
  
  function updateBackgroundWeather() {
    if (bgWeatherParticles) {
      scene.remove(bgWeatherParticles);
      bgWeatherParticles.geometry.dispose();
      bgWeatherParticles.material.dispose();
      bgWeatherParticles = null;
    }
    
    if (currentBgWeather === 'clear') return;
    
    const particleCount = currentBgWeather === 'cloudy' ? 300 : 600;
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const velocities = [];
    
    for (let i = 0; i < particleCount; i++) {
      positions.push(
        (Math.random() - 0.5) * 500,
        Math.random() * 300,
        (Math.random() - 0.5) * 500
      );
      
      if (currentBgWeather === 'cloudy') {
        velocities.push(0, -0.05, 0);
      } else if (currentBgWeather === 'rain') {
        velocities.push(0, -1.5, 0);
      } else {
        velocities.push(0, -0.3, 0);
      }
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 3));
    
    const material = new THREE.PointsMaterial({
      size: currentBgWeather === 'rain' ? 0.5 : currentBgWeather === 'cloudy' ? 3 : 2,
      color: currentBgWeather === 'rain' ? 0x4A90E2 : currentBgWeather === 'cloudy' ? 0x666666 : 0xFFFFFF,
      transparent: true,
      opacity: currentBgWeather === 'rain' ? 0.4 : currentBgWeather === 'cloudy' ? 0.2 : 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    bgWeatherParticles = new THREE.Points(geometry, material);
    scene.add(bgWeatherParticles);
  }
  
  // Check for weather sync every 2 seconds
  setInterval(syncBackgroundWeather, 2000);
  
  // Highly Detailed Starfield
  const starGeometry = new THREE.BufferGeometry();
  const starVertices = [];
  const starColors = [];
  const starSizes = [];
  
  for (let i = 0; i < 20000; i++) {
    const x = (Math.random() - 0.5) * 3000;
    const y = (Math.random() - 0.5) * 3000;
    const z = (Math.random() - 0.5) * 3000;
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
    
    starSizes.push(Math.random() * 2.2 + 0.3);
  }
  
  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
  starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
  starGeometry.setAttribute('size', new THREE.Float32BufferAttribute(starSizes, 1));
  
  const starMaterial = new THREE.PointsMaterial({ 
    size: 1.4,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  
  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);
  
  // Enhanced Nebula with more particles
  const nebulaGeometry = new THREE.BufferGeometry();
  const nebulaVertices = [];
  const nebulaColors = [];
  
  for (let i = 0; i < 4000; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const r = 700 + Math.random() * 600;
    
    nebulaVertices.push(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    );
    
    // Purple/cyan/pink nebula mix
    const intensity = Math.random() * 0.5;
    const colorType = Math.random();
    if (colorType < 0.4) {
      nebulaColors.push(0.2 + intensity * 0.8, 0.15 + intensity * 0.6, 0.7 + intensity); // Purple
    } else if (colorType < 0.7) {
      nebulaColors.push(0.1 + intensity * 0.5, 0.6 + intensity, 0.8 + intensity * 0.2); // Cyan
    } else {
      nebulaColors.push(0.8 + intensity * 0.2, 0.2 + intensity * 0.5, 0.6 + intensity); // Pink
    }
  }
  
  nebulaGeometry.setAttribute('position', new THREE.Float32BufferAttribute(nebulaVertices, 3));
  nebulaGeometry.setAttribute('color', new THREE.Float32BufferAttribute(nebulaColors, 3));
  
  const nebulaMaterial = new THREE.PointsMaterial({
    size: 12,
    vertexColors: true,
    transparent: true,
    opacity: 0.2,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  
  const nebula = new THREE.Points(nebulaGeometry, nebulaMaterial);
  scene.add(nebula);
  
  // Distant Galaxies
  const galaxyGeometry = new THREE.BufferGeometry();
  const galaxyVertices = [];
  const galaxyColors = [];
  
  for (let i = 0; i < 1500; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 1200 + Math.random() * 400;
    const height = (Math.random() - 0.5) * 200;
    
    galaxyVertices.push(
      Math.cos(angle) * radius,
      height,
      Math.sin(angle) * radius
    );
    
    const brightness = Math.random() * 0.3 + 0.1;
    galaxyColors.push(0.9 + brightness, 0.8 + brightness, 0.6 + brightness);
  }
  
  galaxyGeometry.setAttribute('position', new THREE.Float32BufferAttribute(galaxyVertices, 3));
  galaxyGeometry.setAttribute('color', new THREE.Float32BufferAttribute(galaxyColors, 3));
  
  const galaxyMaterial = new THREE.PointsMaterial({
    size: 15,
    vertexColors: true,
    transparent: true,
    opacity: 0.12,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  
  const galaxy = new THREE.Points(galaxyGeometry, galaxyMaterial);
  scene.add(galaxy);
  
  // Realistic Planets with PBR materials
  const planets = [];
  
  function createPlanet(radius, color, roughness, metalness, position, hasRings = false, hasAtmosphere = false, atmosphereColor = null) {
    const geometry = new THREE.SphereGeometry(radius, 64, 64);
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
  
  // Complete Solar System with All Planets
  // Mercury - closest to sun
  const mercury = createPlanet(2.5, 0x8C7853, 0.95, 0.1, { x: -80, y: 5, z: -40 }, false, false);
  planets.push({ mesh: mercury, speed: 0.0015, radius: 30, angle: 0, rotationSpeed: 0.004 });
  
  // Venus - bright morning star
  const venus = createPlanet(3.8, 0xFFC649, 0.5, 0.1, { x: 25, y: 10, z: -50 }, false, true, 0xFFE4B5);
  planets.push({ mesh: venus, speed: 0.001, radius: 40, angle: Math.PI / 4, rotationSpeed: 0.005 });
  
  // Earth - blue marble with atmosphere
  const earth = createPlanet(4.5, 0x2E5F8C, 0.7, 0.1, { x: 40, y: -15, z: -60 }, false, true, 0x4A90E2);
  planets.push({ mesh: earth, speed: 0.0008, radius: 50, angle: 0, rotationSpeed: 0.01 });
  
  // Moon - orbiting Earth
  const moonGeometry = new THREE.SphereGeometry(1.2, 32, 32);
  const moonMaterial = new THREE.MeshStandardMaterial({
    color: 0xCCCCCC,
    roughness: 0.9,
    metalness: 0.05
  });
  const moon = new THREE.Mesh(moonGeometry, moonMaterial);
  moon.castShadow = true;
  moon.receiveShadow = true;
  earth.add(moon);
  moon.position.set(8, 0, 0);
  
  // Mars - red planet
  const mars = createPlanet(3.2, 0xCD5C5C, 0.9, 0.05, { x: -50, y: 20, z: -70 }, false, false);
  planets.push({ mesh: mars, speed: 0.0005, radius: 65, angle: Math.PI, rotationSpeed: 0.008 });
  
  // Jupiter - gas giant with bands
  const jupiter = createPlanet(8.5, 0xC88B3A, 0.6, 0.2, { x: 80, y: 35, z: -100 }, false, false);
  planets.push({ mesh: jupiter, speed: 0.0002, radius: 90, angle: Math.PI / 2, rotationSpeed: 0.015 });
  
  // Saturn - with majestic rings
  const saturn = createPlanet(7.5, 0xE8D4A0, 0.7, 0.15, { x: -70, y: -25, z: -90 }, true, false);
  planets.push({ mesh: saturn, speed: 0.00015, radius: 80, angle: Math.PI * 1.5, rotationSpeed: 0.012 });
  
  // Uranus - ice giant with tilt
  const uranus = createPlanet(5.5, 0x4FD0E7, 0.6, 0.3, { x: 95, y: -30, z: -120 }, true, false);
  uranus.rotation.z = Math.PI / 4; // Tilted rotation
  planets.push({ mesh: uranus, speed: 0.0001, radius: 110, angle: Math.PI / 3, rotationSpeed: 0.009 });
  
  // Neptune - deep blue ice giant
  const neptune = createPlanet(5.2, 0x4169E1, 0.65, 0.25, { x: -85, y: 15, z: -130 }, false, false);
  planets.push({ mesh: neptune, speed: 0.00008, radius: 125, angle: Math.PI * 1.7, rotationSpeed: 0.01 });
  
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
  
  // Enhanced Realistic Shooting Stars
  const shootingStars = [];
  
  function createShootingStar() {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    
    // Longer trail for more realistic look
    for (let i = 0; i < 25; i++) {
      positions.push(0, 0, 0);
      const intensity = 1 - (i / 25);
      // Bright white-blue core fading to orange tail
      if (i < 5) {
        colors.push(1, 1, 1); // Bright white core
      } else if (i < 15) {
        colors.push(1, 0.95, 0.7 + intensity * 0.3); // Yellow-white
      } else {
        colors.push(1, 0.6 + intensity * 0.4, 0.3); // Orange tail
      }
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      linewidth: 2
    });
    
    const line = new THREE.Line(geometry, material);
    
    // Random starting position (higher up and further out)
    const angle = Math.random() * Math.PI * 2;
    const distance = 200 + Math.random() * 400;
    line.position.set(
      Math.cos(angle) * distance,
      80 + Math.random() * 120,
      Math.sin(angle) * distance
    );
    
    // Faster speed for more dramatic effect
    const speed = 3.5 + Math.random() * 2.5;
    const direction = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      -1.5 - Math.random() * 0.8,
      (Math.random() - 0.5) * 2
    ).normalize();
    
    scene.add(line);
    
    return {
      line: line,
      velocity: direction.multiplyScalar(speed),
      life: 1,
      positions: positions,
      trailLength: 0
    };
  }
  
  // More frequent shooting stars
  setInterval(() => {
    if (Math.random() < 0.4 && shootingStars.length < 5) {
      shootingStars.push(createShootingStar());
    }
  }, 2000);
  
  // Detailed Asteroid Belt
  const asteroidGeometry = new THREE.DodecahedronGeometry(0.5, 0);
  const asteroids = [];
  
  for (let i = 0; i < 120; i++) {
    const material = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.95,
      metalness: 0.2,
      flatShading: true
    });
    const asteroid = new THREE.Mesh(asteroidGeometry, material);
    
    const angle = Math.random() * Math.PI * 2;
    const distance = 105 + Math.random() * 30;
    asteroid.position.set(
      Math.cos(angle) * distance,
      (Math.random() - 0.5) * 12,
      Math.sin(angle) * distance
    );
    
    asteroid.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    
    const scale = 0.3 + Math.random() * 0.8;
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
    galaxy.rotation.y += 0.00003;
    
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
    
    // Moon orbits Earth
    if (moon) {
      moon.rotation.y += 0.02;
      const moonOrbitAngle = currentTime * 0.0005;
      moon.position.x = Math.cos(moonOrbitAngle) * 8;
      moon.position.z = Math.sin(moonOrbitAngle) * 8;
    }
    
    // Asteroid belt animation
    asteroids.forEach(asteroid => {
      asteroid.angle += asteroid.orbitSpeed;
      asteroid.mesh.position.x = centerX + Math.cos(asteroid.angle) * asteroid.distance;
      asteroid.mesh.position.z = centerZ + Math.sin(asteroid.angle) * asteroid.distance;
      asteroid.mesh.rotation.x += asteroid.rotationSpeed;
      asteroid.mesh.rotation.y += asteroid.rotationSpeed * 0.7;
    });
    
    // Shooting stars with realistic trail
    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const star = shootingStars[i];
      
      // Update trail positions
      const positions = star.line.geometry.attributes.position.array;
      for (let j = positions.length - 3; j >= 3; j -= 3) {
        positions[j] = positions[j - 3];
        positions[j + 1] = positions[j - 2];
        positions[j + 2] = positions[j - 1];
      }
      
      // Update head position
      positions[0] = star.line.position.x;
      positions[1] = star.line.position.y;
      positions[2] = star.line.position.z;
      star.line.geometry.attributes.position.needsUpdate = true;
      
      // Move shooting star
      star.line.position.add(star.velocity);
      star.life -= 0.012;
      star.line.material.opacity = star.life;
      
      // Add slight gravity curve
      star.velocity.y -= 0.02;
      
      if (star.life <= 0 || star.line.position.y < -50) {
        scene.remove(star.line);
        star.line.geometry.dispose();
        star.line.material.dispose();
        shootingStars.splice(i, 1);
      }
    }
    
    // Background weather particles
    if (bgWeatherParticles) {
      const positions = bgWeatherParticles.geometry.attributes.position.array;
      const velocities = bgWeatherParticles.geometry.attributes.velocity.array;
      
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += velocities[i + 1];
        
        if (positions[i + 1] < -50) {
          positions[i + 1] = 300;
          positions[i] = (Math.random() - 0.5) * 500;
          positions[i + 2] = (Math.random() - 0.5) * 500;
        }
      }
      
      bgWeatherParticles.geometry.attributes.position.needsUpdate = true;
    }
    
    // Cinematic camera movement with mouse influence
    const time = currentTime * 0.0001;
    updateMouseInfluence();
    
    camera.position.x = Math.sin(time) * 4 + mouseInfluence.x * 10;
    camera.position.y = 25 + Math.cos(time * 0.7) * 2 + mouseInfluence.y * 10;
    camera.lookAt(0, 0, -50);
    
    // Make planets react to mouse
    planets.forEach(planet => {
      const dx = planet.mesh.position.x - (mouseInfluence.x * 50);
      const dy = planet.mesh.position.y - (mouseInfluence.y * 50);
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 100) {
        const force = (100 - distance) / 100;
        planet.mesh.position.x += dx * force * 0.02;
        planet.mesh.position.y += dy * force * 0.02;
      }
    });
    
    // Make asteroids react to mouse
    asteroids.forEach(asteroid => {
      const dx = asteroid.mesh.position.x - (mouseInfluence.x * 50);
      const dy = asteroid.mesh.position.y - (mouseInfluence.y * 50);
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 80) {
        const force = (80 - distance) / 80;
        asteroid.mesh.position.x += dx * force * 0.03;
        asteroid.mesh.position.y += dy * force * 0.03;
      }
    });
    
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
