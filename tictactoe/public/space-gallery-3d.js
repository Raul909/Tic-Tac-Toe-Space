// 3D Cinematic Space Gallery with Three.js
(function() {
  window.SpaceGallery3D = {
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    objects: [],
    currentTab: 'solar',
    selectedObj: null,
    raycaster: null,
    mouse: null,
    
    solarSystem: [
      { name: 'Sun', type: 'Star', radius: 20, distance: 0, color: 0xFDB813, temp: '5778K', mass: '1.989×10³⁰ kg' },
      { name: 'Mercury', type: 'Planet', radius: 4, distance: 80, color: 0x8C7853, orbit: 0.24, temp: '167°C', moons: 0 },
      { name: 'Venus', type: 'Planet', radius: 9, distance: 120, color: 0xFFC649, orbit: 0.62, temp: '464°C', moons: 0 },
      { name: 'Earth', type: 'Planet', radius: 10, distance: 170, color: 0x4A90E2, orbit: 1, temp: '15°C', moons: 1 },
      { name: 'Mars', type: 'Planet', radius: 5, distance: 220, color: 0xE27B58, orbit: 1.88, temp: '-65°C', moons: 2 },
      { name: 'Jupiter', type: 'Planet', radius: 18, distance: 300, color: 0xC88B3A, orbit: 11.86, temp: '-110°C', moons: 79 },
      { name: 'Saturn', type: 'Planet', radius: 16, distance: 380, color: 0xFAD5A5, orbit: 29.46, temp: '-140°C', moons: 82, rings: true },
      { name: 'Uranus', type: 'Planet', radius: 12, distance: 450, color: 0x4FD0E7, orbit: 84.01, temp: '-195°C', moons: 27 },
      { name: 'Neptune', type: 'Planet', radius: 12, distance: 510, color: 0x4166F5, orbit: 164.79, temp: '-200°C', moons: 14 }
    ],
    
    nearbyStars: [
      { name: 'Proxima Centauri', type: 'Red Dwarf', distance: 4.24, color: 0xFF6B6B, temp: '3042K', mass: '0.12 M☉', radius: 8 },
      { name: 'Alpha Centauri A', type: 'G-type Star', distance: 4.37, color: 0xFFF4E6, temp: '5790K', mass: '1.1 M☉', radius: 12 },
      { name: 'Alpha Centauri B', type: 'K-type Star', distance: 4.37, color: 0xFFE4B5, temp: '5260K', mass: '0.9 M☉', radius: 10 },
      { name: "Barnard's Star", type: 'Red Dwarf', distance: 5.96, color: 0xFF8C8C, temp: '3134K', mass: '0.14 M☉', radius: 7 },
      { name: 'Wolf 359', type: 'Red Dwarf', distance: 7.86, color: 0xFF7777, temp: '2800K', mass: '0.09 M☉', radius: 6 },
      { name: 'Sirius A', type: 'A-type Star', distance: 8.6, color: 0xE8F4FF, temp: '9940K', mass: '2.02 M☉', radius: 15 },
      { name: 'Sirius B', type: 'White Dwarf', distance: 8.6, color: 0xFFFFFF, temp: '25200K', mass: '1.02 M☉', radius: 5 },
      { name: 'Luyten 726-8', type: 'Red Dwarf', distance: 8.73, color: 0xFF9999, temp: '2670K', mass: '0.1 M☉', radius: 6 }
    ],
    
    nebulae: [
      { name: 'Orion Nebula', type: 'Emission Nebula', distance: 1344, color: 0xFF6B9D, size: 24, constellation: 'Orion', radius: 30 },
      { name: 'Crab Nebula', type: 'Supernova Remnant', distance: 6500, color: 0x4ECDC4, size: 11, constellation: 'Taurus', radius: 20 },
      { name: 'Ring Nebula', type: 'Planetary Nebula', distance: 2300, color: 0x95E1D3, size: 1.4, constellation: 'Lyra', radius: 15 },
      { name: 'Eagle Nebula', type: 'Emission Nebula', distance: 7000, color: 0xF38181, size: 70, constellation: 'Serpens', radius: 35 },
      { name: 'Helix Nebula', type: 'Planetary Nebula', distance: 650, color: 0xAA96DA, size: 2.5, constellation: 'Aquarius', radius: 18 },
      { name: 'Horsehead Nebula', type: 'Dark Nebula', distance: 1500, color: 0x5D5D5D, size: 3.5, constellation: 'Orion', radius: 22 }
    ],
    
    init() {
      const container = document.getElementById('space-gallery-3d');
      if (!container) return;
      
      // Scene
      this.scene = new THREE.Scene();
      this.scene.fog = new THREE.FogExp2(0x000208, 0.0008);
      
      // Camera
      this.camera = new THREE.PerspectiveCamera(60, container.clientWidth / 500, 0.1, 5000);
      this.camera.position.set(0, 100, 300);
      
      // Renderer
      this.renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(container.clientWidth, 500);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.2;
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(this.renderer.domElement);
      
      // Raycaster for clicking
      this.raycaster = new THREE.Raycaster();
      this.mouse = new THREE.Vector2();
      
      // Events
      this.renderer.domElement.addEventListener('click', (e) => this.onClick(e));
      this.renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
      window.addEventListener('resize', () => this.onResize());
      
      // Load initial tab
      this.loadTab('solar');
      this.animate();
    },
    
    loadTab(tab) {
      this.currentTab = tab;
      this.clearScene();
      this.setupLighting();
      
      if (tab === 'solar') {
        this.createSolarSystem();
      } else if (tab === 'stars') {
        this.createStars();
      } else {
        this.createNebulae();
      }
      
      this.updateObjectsList();
    },
    
    clearScene() {
      while(this.scene.children.length > 0) { 
        const obj = this.scene.children[0];
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
        this.scene.remove(obj);
      }
      this.objects = [];
    },
    
    setupLighting() {
      // Ambient light
      const ambient = new THREE.AmbientLight(0x1a1a2e, 0.4);
      this.scene.add(ambient);
      
      if (this.currentTab === 'solar') {
        // Sun as key light
        const sunLight = new THREE.PointLight(0xFFD700, 2, 800);
        sunLight.position.set(0, 0, 0);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 1024;
        sunLight.shadow.mapSize.height = 1024;
        this.scene.add(sunLight);
      } else {
        // Cinematic three-point lighting
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
        keyLight.position.set(100, 100, 100);
        keyLight.castShadow = true;
        this.scene.add(keyLight);
        
        const fillLight = new THREE.DirectionalLight(0x4A90E2, 0.5);
        fillLight.position.set(-80, 40, 60);
        this.scene.add(fillLight);
        
        const rimLight = new THREE.DirectionalLight(0x8A2BE2, 0.6);
        rimLight.position.set(60, -30, -80);
        this.scene.add(rimLight);
      }
    },
    
    createSolarSystem() {
      this.solarSystem.forEach((data, i) => {
        if (data.name === 'Sun') {
          // Sun with glow
          const geometry = new THREE.SphereGeometry(data.radius, 48, 48);
          const material = new THREE.MeshBasicMaterial({ 
            color: data.color,
            emissive: data.color,
            emissiveIntensity: 1
          });
          const sun = new THREE.Mesh(geometry, material);
          sun.userData = { ...data, id: i };
          this.scene.add(sun);
          this.objects.push(sun);
          
          // Sun glow
          const glowGeometry = new THREE.SphereGeometry(data.radius * 1.3, 32, 32);
          const glowMaterial = new THREE.MeshBasicMaterial({
            color: data.color,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
          });
          const glow = new THREE.Mesh(glowGeometry, glowMaterial);
          sun.add(glow);
        } else {
          // Planet
          const geometry = new THREE.SphereGeometry(data.radius, 48, 48);
          const material = new THREE.MeshStandardMaterial({ 
            color: data.color,
            roughness: 0.7,
            metalness: 0.1,
            emissive: data.color,
            emissiveIntensity: 0.05
          });
          const planet = new THREE.Mesh(geometry, material);
          planet.castShadow = true;
          planet.receiveShadow = true;
          
          const angle = Math.random() * Math.PI * 2;
          planet.position.x = Math.cos(angle) * data.distance;
          planet.position.z = Math.sin(angle) * data.distance;
          planet.userData = { ...data, id: i, angle };
          
          this.scene.add(planet);
          this.objects.push(planet);
          
          // Rings for Saturn
          if (data.rings) {
            const ringGeometry = new THREE.RingGeometry(data.radius * 1.5, data.radius * 2.2, 64);
            const ringMaterial = new THREE.MeshStandardMaterial({
              color: data.color,
              transparent: true,
              opacity: 0.7,
              side: THREE.DoubleSide,
              roughness: 0.8
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = Math.PI / 2.2;
            planet.add(ring);
          }
          
          // Orbit line
          const orbitGeometry = new THREE.RingGeometry(data.distance - 0.5, data.distance + 0.5, 128);
          const orbitMaterial = new THREE.MeshBasicMaterial({
            color: 0x00d4ff,
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide
          });
          const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
          orbit.rotation.x = Math.PI / 2;
          this.scene.add(orbit);
        }
      });
    },
    
    createStars() {
      this.nearbyStars.forEach((data, i) => {
        const geometry = new THREE.SphereGeometry(data.radius, 32, 32);
        const material = new THREE.MeshStandardMaterial({ 
          color: data.color,
          emissive: data.color,
          emissiveIntensity: 0.8,
          roughness: 0.3,
          metalness: 0.5
        });
        const star = new THREE.Mesh(geometry, material);
        star.castShadow = true;
        
        // Random 3D positioning
        const angle = Math.random() * Math.PI * 2;
        const height = (Math.random() - 0.5) * 200;
        const distance = 100 + Math.random() * 200;
        star.position.set(
          Math.cos(angle) * distance,
          height,
          Math.sin(angle) * distance
        );
        star.userData = { ...data, id: i };
        
        // Star glow
        const glowGeometry = new THREE.SphereGeometry(data.radius * 1.5, 24, 24);
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: data.color,
          transparent: true,
          opacity: 0.4,
          side: THREE.BackSide,
          blending: THREE.AdditiveBlending
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        star.add(glow);
        
        // Point light for bright stars
        if (data.radius > 10) {
          const light = new THREE.PointLight(data.color, 0.5, 100);
          star.add(light);
        }
        
        this.scene.add(star);
        this.objects.push(star);
      });
    },
    
    createNebulae() {
      this.nebulae.forEach((data, i) => {
        // Nebula cloud using particles
        const particleCount = 500;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        
        for (let j = 0; j < particleCount; j++) {
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI;
          const r = Math.random() * data.radius;
          
          positions.push(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi)
          );
          
          const color = new THREE.Color(data.color);
          colors.push(color.r, color.g, color.b);
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
          size: 2,
          vertexColors: true,
          transparent: true,
          opacity: 0.6,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        
        const nebula = new THREE.Points(geometry, material);
        
        // Random positioning
        const angle = Math.random() * Math.PI * 2;
        const height = (Math.random() - 0.5) * 150;
        const distance = 150 + Math.random() * 200;
        nebula.position.set(
          Math.cos(angle) * distance,
          height,
          Math.sin(angle) * distance
        );
        nebula.userData = { ...data, id: i };
        
        // Core sphere for clicking
        const coreGeometry = new THREE.SphereGeometry(data.radius * 0.3, 24, 24);
        const coreMaterial = new THREE.MeshStandardMaterial({
          color: data.color,
          emissive: data.color,
          emissiveIntensity: 0.5,
          transparent: true,
          opacity: 0.7,
          roughness: 0.5
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        nebula.add(core);
        
        this.scene.add(nebula);
        this.objects.push(nebula);
      });
    },
    
    onClick(event) {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.objects, true);
      
      if (intersects.length > 0) {
        let obj = intersects[0].object;
        while (obj.parent && !obj.userData.id && obj.userData.id !== 0) {
          obj = obj.parent;
        }
        if (obj.userData.id !== undefined) {
          this.selectObject(obj.userData.id);
        }
      }
    },
    
    onMouseMove(event) {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.objects, true);
      
      this.renderer.domElement.style.cursor = intersects.length > 0 ? 'pointer' : 'grab';
    },
    
    selectObject(id) {
      this.selectedObj = this.objects.find(o => o.userData.id === id);
      document.querySelectorAll('.space-object-item').forEach((el, i) => {
        el.classList.toggle('active', i === id);
      });
      this.showDetails(this.selectedObj?.userData);
    },
    
    showDetails(data) {
      const details = document.getElementById('space-object-details');
      if (!data) {
        details.innerHTML = '';
        return;
      }
      
      let html = `<div class="font-bold text-nasa mb-2">${data.name}</div>`;
      html += `<div class="text-xs text-gray-400 mb-2">${data.type}</div>`;
      if (data.temp) html += `<div>Temp: ${data.temp}</div>`;
      if (data.mass) html += `<div>Mass: ${data.mass}</div>`;
      if (data.distance !== undefined && this.currentTab === 'solar') html += `<div>Distance: ${data.distance}M km</div>`;
      if (data.distance && this.currentTab !== 'solar') html += `<div>Distance: ${data.distance} ly</div>`;
      if (data.orbit) html += `<div>Orbit: ${data.orbit} years</div>`;
      if (data.moons !== undefined) html += `<div>Moons: ${data.moons}</div>`;
      if (data.size) html += `<div>Size: ${data.size} ly</div>`;
      if (data.constellation) html += `<div>Constellation: ${data.constellation}</div>`;
      
      details.innerHTML = html;
    },
    
    updateObjectsList() {
      const list = document.getElementById('space-objects-list');
      const data = this.currentTab === 'solar' ? this.solarSystem : 
                   this.currentTab === 'stars' ? this.nearbyStars : this.nebulae;
      
      list.innerHTML = data.map((o, i) => 
        `<div class="space-object-item" onclick="window.SpaceGallery3D.selectObject(${i})">
          <div class="font-bold">${o.name}</div>
          <div class="text-xs text-gray-400">${o.type}</div>
        </div>`
      ).join('');
    },
    
    animate() {
      requestAnimationFrame(() => this.animate());
      
      // Rotate camera around scene
      const time = Date.now() * 0.0001;
      this.camera.position.x = Math.sin(time) * 300;
      this.camera.position.z = Math.cos(time) * 300;
      this.camera.lookAt(0, 0, 0);
      
      // Rotate objects
      this.objects.forEach(obj => {
        if (obj.userData.angle !== undefined && this.currentTab === 'solar') {
          // Orbit planets
          obj.userData.angle += 0.001 * (obj.userData.orbit || 1);
          obj.position.x = Math.cos(obj.userData.angle) * obj.userData.distance;
          obj.position.z = Math.sin(obj.userData.angle) * obj.userData.distance;
        }
        obj.rotation.y += 0.005;
      });
      
      this.renderer.render(this.scene, this.camera);
    },
    
    onResize() {
      const container = document.getElementById('space-gallery-3d');
      if (!container) return;
      
      this.camera.aspect = container.clientWidth / 500;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(container.clientWidth, 500);
    },
    
    reset() {
      this.camera.position.set(0, 100, 300);
      this.selectedObj = null;
      document.getElementById('space-object-details').innerHTML = '';
      document.querySelectorAll('.space-object-item').forEach(el => el.classList.remove('active'));
    }
  };
})();
