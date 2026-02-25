// Three.js 3D Space Background with Realistic Planets and Stars
(function() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ 
    canvas: document.getElementById('three-canvas'),
    alpha: true,
    antialias: true
  });
  
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  camera.position.z = 50;
  
  // Realistic Starfield
  const starGeometry = new THREE.BufferGeometry();
  const starVertices = [];
  for (let i = 0; i < 10000; i++) {
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 2000;
    const z = (Math.random() - 0.5) * 2000;
    starVertices.push(x, y, z);
  }
  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
  const starMaterial = new THREE.PointsMaterial({ 
    color: 0xffffff, 
    size: 0.7,
    transparent: true,
    opacity: 0.8
  });
  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);
  
  // Realistic Planets
  const planets = [];
  
  // Sun
  const sunGeometry = new THREE.SphereGeometry(8, 32, 32);
  const sunMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xFDB813,
    emissive: 0xFDB813,
    emissiveIntensity: 0.5
  });
  const sun = new THREE.Mesh(sunGeometry, sunMaterial);
  sun.position.set(-80, 20, -100);
  scene.add(sun);
  
  // Add glow to sun
  const sunGlow = new THREE.Mesh(
    new THREE.SphereGeometry(10, 32, 32),
    new THREE.MeshBasicMaterial({
      color: 0xFDB813,
      transparent: true,
      opacity: 0.3
    })
  );
  sunGlow.position.copy(sun.position);
  scene.add(sunGlow);
  
  // Earth
  const earthGeometry = new THREE.SphereGeometry(3, 32, 32);
  const earthMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x4A90E2,
    emissive: 0x112244,
    shininess: 10
  });
  const earth = new THREE.Mesh(earthGeometry, earthMaterial);
  earth.position.set(30, -10, -50);
  scene.add(earth);
  planets.push({ mesh: earth, speed: 0.001, radius: 40, angle: 0 });
  
  // Mars
  const marsGeometry = new THREE.SphereGeometry(2.5, 32, 32);
  const marsMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xE27B58,
    emissive: 0x331100
  });
  const mars = new THREE.Mesh(marsGeometry, marsMaterial);
  mars.position.set(-40, 15, -60);
  scene.add(mars);
  planets.push({ mesh: mars, speed: 0.0007, radius: 50, angle: Math.PI });
  
  // Jupiter
  const jupiterGeometry = new THREE.SphereGeometry(5, 32, 32);
  const jupiterMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xC88B3A,
    emissive: 0x221100
  });
  const jupiter = new THREE.Mesh(jupiterGeometry, jupiterMaterial);
  jupiter.position.set(60, 25, -80);
  scene.add(jupiter);
  planets.push({ mesh: jupiter, speed: 0.0003, radius: 70, angle: Math.PI / 2 });
  
  // Saturn with rings
  const saturnGeometry = new THREE.SphereGeometry(4.5, 32, 32);
  const saturnMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xFAD5A5,
    emissive: 0x221100
  });
  const saturn = new THREE.Mesh(saturnGeometry, saturnMaterial);
  saturn.position.set(-50, -20, -70);
  scene.add(saturn);
  
  // Saturn's rings
  const ringGeometry = new THREE.RingGeometry(6, 9, 32);
  const ringMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xFAD5A5,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.6
  });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.rotation.x = Math.PI / 2;
  saturn.add(ring);
  planets.push({ mesh: saturn, speed: 0.0002, radius: 60, angle: Math.PI * 1.5 });
  
  // Ambient light
  const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
  scene.add(ambientLight);
  
  // Point light from sun
  const pointLight = new THREE.PointLight(0xFDB813, 1, 200);
  pointLight.position.copy(sun.position);
  scene.add(pointLight);
  
  // Animation
  function animate() {
    requestAnimationFrame(animate);
    
    // Rotate stars slowly
    stars.rotation.y += 0.0001;
    stars.rotation.x += 0.00005;
    
    // Rotate sun
    sun.rotation.y += 0.001;
    sunGlow.rotation.y -= 0.001;
    
    // Orbit planets
    planets.forEach(planet => {
      planet.angle += planet.speed;
      const centerX = sun.position.x;
      const centerZ = sun.position.z;
      planet.mesh.position.x = centerX + Math.cos(planet.angle) * planet.radius;
      planet.mesh.position.z = centerZ + Math.sin(planet.angle) * planet.radius;
      planet.mesh.rotation.y += 0.01;
    });
    
    // Gentle camera movement
    camera.position.x = Math.sin(Date.now() * 0.0001) * 5;
    camera.position.y = Math.cos(Date.now() * 0.00015) * 3;
    camera.lookAt(scene.position);
    
    renderer.render(scene, camera);
  }
  
  animate();
  
  // Handle resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();
