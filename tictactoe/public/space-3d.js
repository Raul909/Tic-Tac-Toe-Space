// Three.js 3D Space Background with Cinematic Lighting and Warp Effects
(function() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000208, 0.0012);
  
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 4000);
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
  renderer.toneMappingExposure = 1.3;
  renderer.outputEncoding = THREE.sRGBEncoding;
  camera.position.set(0, 25, 90);
  
  // Cinematic Controller
  const cinematic = {
    warpFactor: 0,
    targetWarp: 0,
    baseSpeed: 1,
    cameraDrift: { x: 0, y: 0, z: 0 },
    triggerWarp: (duration = 1000) => {
      cinematic.targetWarp = 1;
      setTimeout(() => { cinematic.targetWarp = 0; }, duration);
    }
  };
  window.CinematicSpace = cinematic;

  // Interactive Mouse Effects
  const mouse = { x: 0, y: 0 };
  const mouseInfluence = { x: 0, y: 0 };
  document.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });
  
  function updateMouseInfluence(dt) {
    const smooth = 1.0 - Math.pow(0.05, dt);
    mouseInfluence.x += (mouse.x - mouseInfluence.x) * smooth * 5;
    mouseInfluence.y += (mouse.y - mouseInfluence.y) * smooth * 5;
  }
  
  // Weather system
  let bgWeatherParticles = null;
  let currentBgWeather = 'clear';
  
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
    
    for (let i = 0; i < particleCount; i++) {
      positions.push(
        (Math.random() - 0.5) * 500,
        Math.random() * 300,
        (Math.random() - 0.5) * 500
      );
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('velocity', new THREE.Float32BufferAttribute(vel, 3));
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    
    // Determine vertical speed based on weather
    let vy = -0.3;
    if (currentBgWeather === 'cloudy') vy = -0.05;
    else if (currentBgWeather === 'rain') vy = -1.5;

    const material = new THREE.PointsMaterial({
      size: currentBgWeather === 'rain' ? 0.5 : currentBgWeather === 'cloudy' ? 3 : 2,
      color: currentBgWeather === 'rain' ? 0x4A90E2 : currentBgWeather === 'cloudy' ? 0x666666 : 0xFFFFFF,
      transparent: true,
      opacity: currentBgWeather === 'rain' ? 0.4 : 0.2,
      blending: THREE.AdditiveBlending, depthWrite: false
    });

    // Optimization: Shader-based movement to offload CPU
    material.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = { value: 0 };
        shader.uniforms.uSpeed = { value: vy };
        shader.uniforms.uRangeY = { value: 350.0 }; // 300 - (-50)
        shader.uniforms.uStartY = { value: 300.0 };

        // Save reference to update it later
        material.userData.shader = shader;

        shader.vertexShader = 'uniform float uTime;\nuniform float uSpeed;\nuniform float uRangeY;\nuniform float uStartY;\n' + shader.vertexShader;

        // Inject logic before projection
        shader.vertexShader = shader.vertexShader.replace(
            '#include <begin_vertex>',
            `
            vec3 transformed = vec3( position );

            float traveled = uSpeed * uTime;
            float newY = position.y + traveled;

            // Calculate lap number (how many times it has wrapped)
            float distFromTop = uStartY - newY;
            float lap = floor(distFromTop / uRangeY);

            // Wrap Y
            transformed.y = uStartY - mod(distFromTop, uRangeY);

            // Randomize X and Z on respawn (lap > 0)
            if (lap > 0.0) {
                // Use original position and lap as seed for stable randomness
                vec2 seed = position.xz + vec2(lap * 13.0, lap * 7.0);
                float randX = fract(sin(dot(seed, vec2(12.9898,78.233))) * 43758.5453);
                float randZ = fract(sin(dot(seed, vec2(39.7867,27.345))) * 23456.7891);

                transformed.x = (randX - 0.5) * 500.0;
                transformed.z = (randZ - 0.5) * 500.0;
            }
            `
        );
    };
    
    bgWeatherParticles = new THREE.Points(geometry, material);
    scene.add(bgWeatherParticles);
  }
  setInterval(syncBackgroundWeather, 2000);
  
  // Starfield Layers
  function createStarLayer(count, size, range, colorFn) {
    const geo = new THREE.BufferGeometry();
    const pos = [];
    const col = [];
    for (let i = 0; i < count; i++) {
      pos.push((Math.random() - 0.5) * range, (Math.random() - 0.5) * range, (Math.random() - 0.5) * range);
      const c = colorFn();
      col.push(c.r, c.g, c.b);
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({
      size: size, vertexColors: true, transparent: true, opacity: 0.9, sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false
    });
    const mesh = new THREE.Points(geo, mat);
    scene.add(mesh);
    return mesh;
  }
  
  const starLayers = [
    createStarLayer(15000, 1.2, 3000, () => Math.random() < 0.1 ? new THREE.Color(0x88ccff) : new THREE.Color(0xffffff)),
    createStarLayer(5000, 2.5, 3000, () => new THREE.Color(0xffffff)),
    createStarLayer(20000, 0.8, 4000, () => new THREE.Color(0x445566))
  ];
  
  // Nebula
  const nebulaGeo = new THREE.BufferGeometry();
  const nebPos = [], nebCol = [];
  for (let i = 0; i < 4000; i++) {
    const theta = Math.random() * Math.PI * 2, phi = Math.random() * Math.PI, r = 700 + Math.random() * 600;
    nebPos.push(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi));
    const c = new THREE.Color().setHSL(Math.random() < 0.5 ? 0.6 : 0.9, 0.8, 0.2 + Math.random()*0.3);
    nebCol.push(c.r, c.g, c.b);
  }
  nebulaGeo.setAttribute('position', new THREE.Float32BufferAttribute(nebPos, 3));
  nebulaGeo.setAttribute('color', new THREE.Float32BufferAttribute(nebCol, 3));
  const nebula = new THREE.Points(nebulaGeo, new THREE.PointsMaterial({ size: 15, vertexColors: true, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(nebula);
  
  // Planets
  const planets = [];
  function createPlanet(radius, color, pos, hasRings = false, hasAtmos = false, atmosColor = null) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 64, 64), new THREE.MeshStandardMaterial({ color: color, roughness: 0.7, metalness: 0.2 }));
    mesh.position.set(pos.x, pos.y, pos.z);
    mesh.castShadow = true; mesh.receiveShadow = true;
    scene.add(mesh);
    
    if (hasAtmos) {
      const glow = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.15, 32, 32), new THREE.ShaderMaterial({
        uniforms: { c: { value: 0.3 }, p: { value: 4.5 }, glowColor: { value: new THREE.Color(atmosColor || color) } },
        vertexShader: `varying vec3 vNormal; void main() { vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `uniform vec3 glowColor; uniform float c; uniform float p; varying vec3 vNormal; void main() { float intensity = pow(c - dot(vNormal, vec3(0.0, 0.0, 1.0)), p); gl_FragColor = vec4(glowColor, 1.0) * intensity; }`,
        side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false
      }));
      mesh.add(glow);
    }
    if (hasRings) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(radius * 1.4, radius * 2.3, 64), new THREE.MeshStandardMaterial({ color: color, transparent: true, opacity: 0.7, side: THREE.DoubleSide }));
      ring.rotation.x = Math.PI / 2.2; ring.castShadow = true; ring.receiveShadow = true;
      mesh.add(ring);
    }
    return mesh;
  }
  
  const sun = new THREE.Mesh(new THREE.SphereGeometry(12, 48, 48), new THREE.MeshBasicMaterial({ color: 0xFFD700 }));
  sun.position.set(-100, 30, -150);
  scene.add(sun);
  const sunGlow = new THREE.Group();
  for(let i=0; i<3; i++) sunGlow.add(new THREE.Mesh(new THREE.SphereGeometry(14+i*4, 32, 32), new THREE.MeshBasicMaterial({ color: i===0?0xFFAA00:0xFF8800, transparent: true, opacity: 0.12-i*0.03, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false })));
  sun.add(sunGlow);
  
  const mercury = createPlanet(2.5, 0x8C7853, {x:-80, y:5, z:-40});
  planets.push({ mesh: mercury, speed: 0.0015, radius: 30, angle: 0, rotationSpeed: 0.004 });
  const venus = createPlanet(3.8, 0xFFC649, {x:25, y:10, z:-50}, false, true, 0xFFE4B5);
  planets.push({ mesh: venus, speed: 0.001, radius: 40, angle: Math.PI/4, rotationSpeed: 0.005 });
  const earth = createPlanet(4.5, 0x2E5F8C, {x:40, y:-15, z:-60}, false, true, 0x4A90E2);
  planets.push({ mesh: earth, speed: 0.0008, radius: 50, angle: 0, rotationSpeed: 0.01 });
  const moon = new THREE.Mesh(new THREE.SphereGeometry(1.2, 32, 32), new THREE.MeshStandardMaterial({ color: 0xCCCCCC }));
  moon.castShadow = true; earth.add(moon); moon.position.set(8,0,0);
  const mars = createPlanet(3.2, 0xCD5C5C, {x:-50, y:20, z:-70});
  planets.push({ mesh: mars, speed: 0.0005, radius: 65, angle: Math.PI, rotationSpeed: 0.008 });
  const jupiter = createPlanet(8.5, 0xC88B3A, {x:80, y:35, z:-100});
  planets.push({ mesh: jupiter, speed: 0.0002, radius: 90, angle: Math.PI/2, rotationSpeed: 0.015 });
  const saturn = createPlanet(7.5, 0xE8D4A0, {x:-70, y:-25, z:-90}, true);
  planets.push({ mesh: saturn, speed: 0.00015, radius: 80, angle: Math.PI*1.5, rotationSpeed: 0.012 });
  const uranus = createPlanet(5.5, 0x4FD0E7, {x:95, y:-30, z:-120}, true);
  planets.push({ mesh: uranus, speed: 0.0001, radius: 110, angle: Math.PI/3, rotationSpeed: 0.009 });
  const neptune = createPlanet(5.2, 0x4169E1, {x:-85, y:15, z:-130});
  planets.push({ mesh: neptune, speed: 0.00008, radius: 125, angle: Math.PI*1.7, rotationSpeed: 0.01 });
  
  // Lighting
  scene.add(new THREE.AmbientLight(0x1a1a3a, 0.6));
  const sunL = new THREE.PointLight(0xFFD700, 4.0, 500); sunL.position.copy(sun.position); sunL.castShadow = true; scene.add(sunL);
  const fillL = new THREE.DirectionalLight(0x4A90E2, 0.6); fillL.position.set(-80, 40, 60); scene.add(fillL);
  const rimL = new THREE.DirectionalLight(0x8A2BE2, 0.8); rimL.position.set(60, -30, -80); scene.add(rimL);
  
  // Asteroids
  const asteroids = [];
  const astGeo = new THREE.DodecahedronGeometry(0.5, 0);
  const astMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9, flatShading: true });
  for (let i = 0; i < 150; i++) {
    const ast = new THREE.Mesh(astGeo, astMat);
    const angle = Math.random() * Math.PI * 2, dist = 105 + Math.random() * 30;
    ast.position.set(Math.cos(angle)*dist, (Math.random()-0.5)*15, Math.sin(angle)*dist);
    ast.scale.setScalar(0.3 + Math.random()*0.8);
    ast.castShadow = true; scene.add(ast);
    asteroids.push({ mesh: ast, rot: (Math.random()-0.5)*0.02, orb: 0.0001+Math.random()*0.0002, angle: angle, dist: dist });
  }

  // Shooting Stars (Optimized Pool)
  const shootingStars = [];
  const ssGeo = new THREE.BufferGeometry();
  ssGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(6), 3)); // 2 points
  const ssMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
  
  // Create pool of 5 reuseable lines
  for(let i=0; i<5; i++) {
    const line = new THREE.Line(ssGeo.clone(), ssMat.clone());
    scene.add(line);
    shootingStars.push({ mesh: line, active: false, t: 0, start: new THREE.Vector3(), end: new THREE.Vector3() });
  }
  
  function spawnShootingStar() {
    const star = shootingStars.find(s => !s.active);
    if(!star) return;
    
    star.active = true;
    star.t = 0;
    const angle = Math.random() * Math.PI * 2;
    const dist = 300 + Math.random() * 200;
    star.start.set(Math.cos(angle)*dist, 100+Math.random()*50, Math.sin(angle)*dist);
    const dir = new THREE.Vector3((Math.random()-0.5)*2, -1-Math.random(), (Math.random()-0.5)*2).normalize();
    star.end.copy(star.start).add(dir.multiplyScalar(200)); // Length of travel
    
    star.mesh.material.opacity = 1;
    star.mesh.geometry.attributes.position.setXYZ(0, star.start.x, star.start.y, star.start.z);
    star.mesh.geometry.attributes.position.setXYZ(1, star.start.x, star.start.y, star.start.z);
    star.mesh.geometry.attributes.position.needsUpdate = true;
  }
  setInterval(() => { if(Math.random()<0.3) spawnShootingStar(); }, 2000);

  // Animation Loop
  let lastTime = 0;
  function animate(currentTime) {
    requestAnimationFrame(animate);
    const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;
    const scale = dt * 60;
    
    // Warp
    cinematic.warpFactor += (cinematic.targetWarp - cinematic.warpFactor) * dt * 2;
    const warpSpeed = 1 + cinematic.warpFactor * 50;
    
    // Stars
    starLayers.forEach((stars, i) => {
      stars.rotation.y += 0.00005 * (i + 1) * scale * warpSpeed;
      if (cinematic.warpFactor > 0.01) {
         stars.scale.z = 1 + cinematic.warpFactor * 20;
         stars.rotation.z += 0.001 * scale;
      } else {
         stars.scale.z += (1 - stars.scale.z) * dt * 2;
      }
    });
    
    nebula.rotation.y -= 0.00005 * scale;
    sun.rotation.y += 0.001 * scale;
    sunGlow.rotation.y -= 0.0015 * scale;
    sunGlow.rotation.z += 0.0008 * scale;
    
    // Planets
    const cx = sun.position.x, cz = sun.position.z;
    planets.forEach(p => {
      p.angle += p.speed * scale;
      p.mesh.position.set(cx + Math.cos(p.angle)*p.radius, p.mesh.position.y, cz + Math.sin(p.angle)*p.radius);
      p.mesh.rotation.y += p.rotationSpeed * scale;
    });
    
    if (moon) {
      moon.rotation.y += 0.02 * scale;
      if (!moon.orbAng) moon.orbAng = 0;
      moon.orbAng += 0.03 * scale;
      moon.position.set(Math.cos(moon.orbAng)*8, 0, Math.sin(moon.orbAng)*8);
    }
    
    asteroids.forEach(a => {
      a.angle += a.orb * scale;
      a.mesh.position.set(cx + Math.cos(a.angle)*a.dist, a.mesh.position.y, cz + Math.sin(a.angle)*a.dist);
      a.mesh.rotation.x += a.rot * scale;
      a.mesh.rotation.y += a.rot * scale;
    });
    
    // Shooting Stars Update
    shootingStars.forEach(s => {
      if(!s.active) return;
      s.t += dt * 1.5; // Speed
      if(s.t > 1) { s.active = false; s.mesh.material.opacity = 0; return; }
      
      const p1 = new THREE.Vector3().lerpVectors(s.start, s.end, s.t);
      // Trail length 0.2
      const p2 = new THREE.Vector3().lerpVectors(s.start, s.end, Math.max(0, s.t - 0.1));
      
      s.mesh.geometry.attributes.position.setXYZ(0, p1.x, p1.y, p1.z);
      s.mesh.geometry.attributes.position.setXYZ(1, p2.x, p2.y, p2.z);
      s.mesh.geometry.attributes.position.needsUpdate = true;
      // Fade out
      s.mesh.material.opacity = Math.sin(s.t * Math.PI) * 0.8;
    });
    
    // Background weather particles
    if (bgWeatherParticles && bgWeatherParticles.material.userData.shader) {
      // Update shader time uniform instead of CPU loop
      bgWeatherParticles.material.userData.shader.uniforms.uTime.value = currentTime * 0.001;
    }
    
    // Cinematic Camera Drift
    updateMouseInfluence(dt);
    const time = currentTime * 0.00005;
    const driftX = Math.sin(time) * 10 + Math.cos(time * 0.3) * 5;
    const driftY = Math.cos(time * 0.7) * 5 + Math.sin(time * 0.2) * 3;
    const shake = cinematic.warpFactor * (Math.random() - 0.5) * 0.5;
    
    camera.position.x = driftX + mouseInfluence.x * 10 + shake;
    camera.position.y = 25 + driftY + mouseInfluence.y * 10 + shake;
    camera.lookAt(0, 0, -50);
    
    renderer.render(scene, camera);
  }
  animate(0);
  
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }, 100);
  });
})();
