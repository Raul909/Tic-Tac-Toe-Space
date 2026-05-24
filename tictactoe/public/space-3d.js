// Three.js 3D Space Background with Cinematic Lighting and Warp Effects
(function() {
  function isWebGLAvailable() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  if (!isWebGLAvailable()) {
    console.warn("WebGL not supported on this device. Falling back to high-fidelity CSS background.");
    const canvas = document.getElementById('three-canvas');
    if (canvas) canvas.style.display = 'none';
    window.CinematicSpace = {
      paused: false,
      baseSpeed: 1,
      cameraDrift: { x: 0, y: 0, z: 0 },
      triggerWarp: () => {},
      applyWeatherPreset: () => {},
      renderFrame: () => {}
    };
    return;
  }

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000208, 0.0003);
  
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 4000);
  const renderer = new THREE.WebGLRenderer({ 
    canvas: document.getElementById('three-canvas'),
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
    stencil: false,
    depth: true
  });
  
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // cap at 1.5 — saves ~44% GPU fill on Retina
  renderer.shadowMap.enabled = false; // Disable shadows for performance
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputEncoding = THREE.sRGBEncoding;
  camera.position.set(0, 25, 90);
  
  // Bright round star particle texture — solid glowing core with smooth radial falloff
  function createCircleTexture() {
    const S = 32;
    const canvas = document.createElement('canvas');
    canvas.width = S;
    canvas.height = S;
    const ctx = canvas.getContext('2d');
    const cx = S / 2;
    const gradient = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
    gradient.addColorStop(0,    'rgba(255,255,255,1)');
    gradient.addColorStop(0.35, 'rgba(255,255,255,0.9)');
    gradient.addColorStop(0.65, 'rgba(255,255,255,0.35)');
    gradient.addColorStop(0.85, 'rgba(255,255,255,0.08)');
    gradient.addColorStop(1,    'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, S, S);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  // Soft Gaussian glow — ultra-smooth fall-off for accretion gas particles
  // Overlapping soft discs blend into misty volumetric haze instead of hard pinpoints
  function createSoftGlowTexture() {
    const S = 64;
    const canvas = document.createElement('canvas');
    canvas.width = S;
    canvas.height = S;
    const ctx = canvas.getContext('2d');
    const cx = S / 2;
    const g = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
    g.addColorStop(0,    'rgba(255,255,255,0.95)');
    g.addColorStop(0.12, 'rgba(255,230,180,0.75)');
    g.addColorStop(0.30, 'rgba(255,140,60,0.40)');
    g.addColorStop(0.55, 'rgba(255,80,20,0.15)');
    g.addColorStop(0.80, 'rgba(200,40,5,0.04)');
    g.addColorStop(1,    'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  // ─── Reusable Stellar Shader Factory ─────────────────────────────────────────
  // Creates a live WebGL granulation + limb-darkening shader for any star type.
  // darkColor  : deep plasma / convection cell troughs
  // midColor   : photosphere mid-tone
  // hotColor   : solar granule peak brightness
  // edgeColor  : chromosphere / corona edge glow
  function createStellarShaderMaterial(darkColor, midColor, hotColor, edgeColor) {
    return new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPos = modelViewMatrix * vec4(position, 1.0);
          vViewDir = normalize(-worldPos.xyz);
          gl_Position = projectionMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewDir;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }
        float noise(vec2 p) {
          vec2 ip = floor(p);
          vec2 fp = fract(p);
          fp = fp * fp * (3.0 - 2.0 * fp);
          return mix(mix(hash(ip), hash(ip+vec2(1,0)), fp.x),
                     mix(hash(ip+vec2(0,1)), hash(ip+vec2(1,1)), fp.x), fp.y);
        }
        float fbm(vec2 p) {
          float v = 0.0, a = 0.5;
          for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.1; a *= 0.48; }
          return v;
        }
        void main() {
          vec2 uv = vUv * 8.0;
          float spd = time * 0.12;
          float n1 = fbm(uv + vec2(spd*0.7, spd*0.3));
          float n2 = fbm(uv*1.3 - vec2(spd*0.2, spd*0.8) + vec2(n1*2.0));
          float n3 = fbm(uv*0.7 + vec2(n2*1.5, spd*0.15));
          float combined = n1*0.4 + n2*0.4 + n3*0.2;
          float granules = fbm(uv*3.5 + vec2(spd*0.05));
          float spots = smoothstep(0.55, 0.70, granules) * 0.35;
          vec3 dark = vec3(${darkColor[0]}, ${darkColor[1]}, ${darkColor[2]});
          vec3 mid  = vec3(${midColor[0]},  ${midColor[1]},  ${midColor[2]});
          vec3 hot  = vec3(${hotColor[0]},  ${hotColor[1]},  ${hotColor[2]});
          vec3 edge = vec3(${edgeColor[0]}, ${edgeColor[1]}, ${edgeColor[2]});
          vec3 col = mix(dark, mid, combined);
          col = mix(col, hot, smoothstep(0.55, 0.85, combined));
          col -= spots;
          float NdV = dot(vNormal, vViewDir);
          float limb = 1.0 - pow(1.0 - max(0.0, NdV), 0.6);
          col *= (0.35 + 0.65 * limb);
          float edgeFactor = pow(1.0 - max(0.0, NdV), 4.0);
          col += edge * edgeFactor * 1.2;
          gl_FragColor = vec4(col, 1.0);
        }
      `
    });
  }

  // ─── Animated Accretion Disk Shader ──────────────────────────────────────────
  // Full WebGL FBM polar-coordinate plasma shader with live Doppler beaming.
  // Runs 100% on GPU — zero CPU data overhead per frame.
  function createAccretionDiskShaderMaterial(innerR, outerR) {
    return new THREE.ShaderMaterial({
      uniforms: {
        time:   { value: 0 },
        innerR: { value: innerR },
        outerR: { value: outerR }
      },
      vertexShader: `
        varying vec2 vPos;
        void main() {
          vPos = position.xy;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float innerR;
        uniform float outerR;
        varying vec2 vPos;

        float hash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
        float noise(vec2 p) {
          vec2 i=floor(p), f=fract(p);
          f=f*f*(3.0-2.0*f);
          return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),
                     mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
        }
        float fbm(vec2 p) {
          float v=0.0, a=0.5;
          for(int i=0;i<5;i++){v+=a*noise(p);p*=2.1;a*=0.48;}
          return v;
        }

        void main() {
          float r = length(vPos);
          if (r < innerR * 0.96 || r > outerR * 1.04) { discard; }

          float t = (r - innerR) / (outerR - innerR); // 0=inner hot, 1=outer cool
          float theta = atan(vPos.y, vPos.x);          // polar angle -PI..PI

          // Gas advection: spiral outward over time
          float speed = time * 0.35;
          float spiralUv = theta / (2.0 * 3.14159) + t * 2.8 - speed * (1.0 - t * 0.6);
          vec2 pUv = vec2(spiralUv * 6.0, t * 4.0);

          float plasma = fbm(pUv + vec2(speed * 0.4, 0.0));
          float plasma2 = fbm(pUv * 1.7 - vec2(0.0, speed * 0.6) + plasma * 0.9);
          float intensity = plasma * 0.55 + plasma2 * 0.45;

          // Relativistic Doppler beaming: left side (approaching) is brighter/bluer
          float doppler = (cos(theta) < 0.0)
            ? (1.5 + abs(cos(theta)) * 1.2)   // approaching — white-gold blaze
            : (0.55 - cos(theta) * 0.15);      // receding   — dim red

          // Radial soft fade: sharp photon ring at inner edge, smooth fade to outer
          float innerFade = smoothstep(0.0, 0.07, t);
          float outerFade = 1.0 - smoothstep(0.65, 1.0, t);
          float radialMask = innerFade * outerFade;

          // Photosphere color ramp
          vec3 photonRing = vec3(1.0, 1.0, 0.9);          // white photon ring
          vec3 hotGold    = vec3(1.0, 0.75, 0.15);         // ultra-hot inner gas
          vec3 midOrange  = vec3(1.0, 0.38, 0.04);         // mid plasma
          vec3 coolRed    = vec3(0.55, 0.06, 0.0);         // cool outer edge

          vec3 baseColor = mix(photonRing, hotGold, smoothstep(0.0, 0.15, t));
          baseColor = mix(baseColor, midOrange, smoothstep(0.15, 0.55, t));
          baseColor = mix(baseColor, coolRed,   smoothstep(0.55, 1.0, t));

          // Turbulence brightening
          vec3 turbColor = mix(midOrange, photonRing, clamp(intensity * 1.2 - 0.3, 0.0, 1.0));
          baseColor = mix(baseColor, turbColor, 0.45);

          float alpha = radialMask * doppler * clamp(intensity * 1.4, 0.5, 1.0) * 0.94;
          gl_FragColor = vec4(baseColor, alpha);
        }
      `,
      side: THREE.DoubleSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  }

  // Volumetric cloud-puff texture for nebulae — fast canvas multi-puff (no CPU FBM)
  function createNebulaTexture() {
    const S = 128;
    const canvas = document.createElement('canvas');
    canvas.width = S;
    canvas.height = S;
    const ctx = canvas.getContext('2d');
    const cx = S / 2, cy = S / 2;

    // Layer 1: 14 overlapping radial sub-puffs at random offsets → organic cloud shape
    for (let i = 0; i < 14; i++) {
      const ox = (Math.random() - 0.5) * S * 0.5;
      const oy = (Math.random() - 0.5) * S * 0.5;
      const r  = S * (0.2 + Math.random() * 0.35);
      const g  = ctx.createRadialGradient(cx + ox, cy + oy, 0, cx + ox, cy + oy, r);
      g.addColorStop(0,   'rgba(255,255,255,0.18)');
      g.addColorStop(0.4, 'rgba(255,255,255,0.10)');
      g.addColorStop(0.7, 'rgba(255,255,255,0.04)');
      g.addColorStop(1,   'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, S, S);
    }

    // Layer 2: 5 stretched elliptical streaks for wispy tendrils
    ctx.save();
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI;
      const sx = S * (0.15 + Math.random() * 0.2);
      const sy = S * (0.05 + Math.random() * 0.08);
      ctx.save();
      ctx.translate(cx + (Math.random() - 0.5) * S * 0.3, cy + (Math.random() - 0.5) * S * 0.3);
      ctx.rotate(angle);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, sx);
      g.addColorStop(0,   'rgba(255,255,255,0.12)');
      g.addColorStop(0.5, 'rgba(255,255,255,0.05)');
      g.addColorStop(1,   'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.scale(1, sy / sx);
      ctx.fillRect(-sx, -sx, sx * 2, sx * 2);
      ctx.restore();
    }
    ctx.restore();

    // Soft outer vignette to blend edges
    const vg = ctx.createRadialGradient(cx, cy, S * 0.25, cx, cy, S * 0.5);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, S, S);
    ctx.globalCompositeOperation = 'source-over';

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  // Cinematic multi-layer DSLR bokeh disc texture
  function createWeatherSphereTexture() {
    const S = 32;
    const canvas = document.createElement('canvas');
    canvas.width = S;
    canvas.height = S;
    const ctx = canvas.getContext('2d');
    const cx = S / 2, cy = S / 2, r = S / 2;

    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, 'rgba(255, 255, 255, 1)');
    g.addColorStop(0.2, 'rgba(255, 255, 255, 0.85)');
    g.addColorStop(0.5, 'rgba(255, 255, 255, 0.35)');
    g.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  // Relativistic Doppler-beaming Accretion Disk generator for Sagittarius A*
  function createSagittariusATexture() {
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const cx = size / 2;
    const cy = size / 2;
    
    ctx.clearRect(0, 0, size, size);
    
    // 1. Soft background plasma glow
    const grad = ctx.createRadialGradient(cx, cy, size * 0.05, cx, cy, size * 0.48);
    grad.addColorStop(0, 'rgba(0,0,0,1)'); // Core event horizon shadow
    grad.addColorStop(0.08, 'rgba(255, 255, 255, 1.0)'); // Photon Ring
    grad.addColorStop(0.12, 'rgba(255, 200, 50, 0.95)'); // Ultra-hot gold gas
    grad.addColorStop(0.25, 'rgba(230, 80, 10, 0.7)'); // Orbiting orange plasma
    grad.addColorStop(0.45, 'rgba(150, 20, 220, 0.25)'); // Volumetric violet outskirts
    grad.addColorStop(1.0, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    
    // 2. High-fidelity swirling turbulent plasma filaments
    for (let r = size * 0.08; r < size * 0.45; r += 2) {
      ctx.beginPath();
      const percent = (r - size * 0.08) / (size * 0.37);
      
      for (let a = 0; a < Math.PI * 2; a += 0.02) {
        const cosA = Math.cos(a);
        const sinA = Math.sin(a);
        
        const leftHemisphere = cosA < 0;
        const beamingFactor = leftHemisphere ? (1.8 + Math.abs(cosA) * 1.5) : (0.45 - cosA * 0.2);
        
        // Turbulence/magnetic clumping using multiple frequencies
        const noise1 = Math.sin(a * 8 + r * 0.12) * 4.0;
        const noise2 = Math.cos(a * 24 - r * 0.05) * 1.5;
        const noise3 = Math.sin(a * 4 - r * 0.2) * 2.0;
        const distortion = noise1 + noise2 + noise3;
        
        const distR = r + distortion * (1.0 - percent * 0.5);
        const x = cx + cosA * distR;
        const y = cy + sinA * distR;
        
        let colorR = 255;
        let colorG = leftHemisphere ? 190 + Math.floor(Math.abs(cosA) * 65) : 80 + Math.floor(Math.abs(cosA) * 70);
        let colorB = leftHemisphere ? 30 + Math.floor(Math.abs(cosA) * 120) : 10;
        
        const baseOpacity = 0.08 * (1.0 - percent * 0.7);
        const opacity = baseOpacity * beamingFactor;
        
        ctx.strokeStyle = `rgba(${colorR}, ${colorG}, ${colorB}, ${opacity})`;
        ctx.lineWidth = 1.6 + (1.0 - percent) * 1.2;
        
        if (a === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }
    
    // 3. Orbiting "clumpy" plasma hotspots
    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = size * 0.10 + Math.random() * size * 0.28;
      const percent = (r - size * 0.1) / (size * 0.28);
      const cosA = Math.cos(angle);
      const leftHemisphere = cosA < 0;
      
      const x = cx + cosA * r;
      const y = cy + Math.sin(angle) * r;
      
      const sizeRadius = (4 + Math.random() * 12) * (1.0 - percent * 0.5);
      const spotGrad = ctx.createRadialGradient(x, y, 0, x, y, sizeRadius);
      
      const beaming = leftHemisphere ? 2.5 : 0.45;
      const alpha = (0.15 + Math.random() * 0.25) * (1.0 - percent) * beaming;
      
      const colorR = 255;
      const colorG = leftHemisphere ? 210 : 100;
      const colorB = leftHemisphere ? 120 : 20;
      
      spotGrad.addColorStop(0, `rgba(${colorR}, ${colorG}, ${colorB}, ${alpha})`);
      spotGrad.addColorStop(0.5, `rgba(${colorR}, ${colorG - 30}, ${colorB}, ${alpha * 0.5})`);
      spotGrad.addColorStop(1, `rgba(0, 0, 0, 0)`);
      
      ctx.fillStyle = spotGrad;
      ctx.beginPath();
      ctx.arc(x, y, sizeRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  // Hyper-detailed Spiral Galaxy generator for Andromeda (starburst hubs & dust lanes)
  function createAndromedaTexture() {
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const cx = size / 2;
    const cy = size / 2;
    
    ctx.clearRect(0, 0, size, size);
    
    // 1. Galactic bulge core glow (yellow-white aging stars cluster)
    const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.22);
    coreGrad.addColorStop(0, 'rgba(255, 255, 245, 1.0)');
    coreGrad.addColorStop(0.15, 'rgba(255, 235, 180, 0.95)');
    coreGrad.addColorStop(0.40, 'rgba(255, 175, 80, 0.65)');
    coreGrad.addColorStop(0.70, 'rgba(240, 110, 40, 0.25)');
    coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.22, 0, Math.PI * 2);
    ctx.fill();
    
    // 2. High-density star forming spiral arms (cyan giants & pink starbursts)
    const numArms = 2;
    const maxR = size * 0.46;
    
    for (let arm = 0; arm < numArms; arm++) {
      const armOffset = (arm * Math.PI * 2) / numArms;
      for (let i = 0; i < 1500; i++) {
        const percent = i / 1500;
        const r = percent * maxR;
        const theta = percent * Math.PI * 4.2 + armOffset;
        
        const spread = (percent * 42) + 2.0;
        const dx = (Math.random() - 0.5) * spread;
        const dy = (Math.random() - 0.5) * spread;
        
        const x = cx + Math.cos(theta) * r + dx;
        const y = cy + Math.sin(theta) * r + dy;
        
        let color;
        const starSize = Math.random() * 2.5 + 0.5;
        
        if (percent < 0.15) {
          color = `rgba(255, 210, 150, ${0.35 * (1 - percent)})`;
        } else if (percent < 0.65) {
          const rand = Math.random();
          if (rand > 0.6) {
            color = `rgba(0, 220, 255, ${0.55 * (1 - percent)})`;
          } else if (rand > 0.35) {
            color = `rgba(255, 110, 210, ${0.45 * (1 - percent)})`;
          } else {
            color = `rgba(255, 255, 255, ${0.60 * (1 - percent)})`;
          }
        } else {
          color = `rgba(80, 150, 255, ${0.70 * (1 - percent)})`;
        }
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, starSize, 0, Math.PI * 2);
        ctx.fill();
        
        if (Math.random() > 0.97) {
          ctx.fillStyle = `rgba(255, 255, 255, ${0.95 * (1 - percent)})`;
          ctx.beginPath();
          ctx.arc(x, y, 0.85, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    
    // 3. Dense obscuring gas lanes / dark dust bands
    for (let arm = 0; arm < numArms; arm++) {
      const armOffset = (arm * Math.PI * 2) / numArms + 0.22;
      for (let i = 100; i < 900; i += 3) {
        const percent = i / 1000;
        const r = percent * maxR;
        const theta = percent * Math.PI * 4.2 + armOffset;
        const spread = percent * 18 + 2;
        const x = cx + Math.cos(theta) * r + (Math.random() - 0.5) * spread;
        const y = cy + Math.sin(theta) * r + (Math.random() - 0.5) * spread;
        
        ctx.fillStyle = `rgba(20, 6, 2, ${0.28 * (1 - percent)})`;
        ctx.beginPath();
        ctx.arc(x, y, Math.random() * 8 + 3.0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }
  
  // Weather Preset System
  let currentPreset = { fog: 0.0003, starDensity: 1, planetGlow: 1 };
  
  // Cinematic Controller
  const cinematic = {
    paused: false,
    warpFactor: 0,
    targetWarp: 0,
    baseSpeed: 1,
    cameraDrift: { x: 0, y: 0, z: 0 },
    triggerWarp: (duration = 1000) => {
      cinematic.targetWarp = 1;
      setTimeout(() => { cinematic.targetWarp = 0; }, duration);
    },
    applyWeatherPreset: (preset) => {
      currentPreset = preset;
      scene.fog.density = preset.fog;
      
      // Update star visibility
      if (stars) {
        stars.material.opacity = 0.6 * preset.starDensity;
      }
      
      // Update planet glows
      planets.forEach(p => {
        if (p.children[0]) {
          p.children[0].material.opacity = 0.12 * preset.planetGlow;
        }
      });
      
      // Apply color tints
      if (preset.name === 'storm') {
        scene.fog.color.setHex(0x000510);
        renderer.toneMappingExposure = 1.0;
      } else if (preset.name === 'frozen') {
        scene.fog.color.setHex(0x000820);
        renderer.toneMappingExposure = 1.0;
      } else if (preset.name === 'misty') {
        scene.fog.color.setHex(0x000308);
        renderer.toneMappingExposure = 1.1;
      } else {
        scene.fog.color.setHex(0x000208);
        renderer.toneMappingExposure = 1.0;
      }
    }
  };
  window.CinematicSpace = cinematic;
  cinematic.renderFrame = () => {
    renderer.render(scene, camera);
  };
  
  cinematic.setGraphicsMode = (mode) => {
    // Reconfigure star fields dynamically without memory alloc / garbage collection
    starLayers.forEach((stars, i) => {
      const geo = stars.geometry;
      const posAttr = geo.attributes.position;
      const count = posAttr.count;
      
      let activeCount = count;
      if (mode === 'SD') {
        if (i === 0) activeCount = Math.floor(count * 0.15); // cap core background stars
        else if (i === 2) activeCount = Math.floor(count * 0.1); // cap grey space dust particles
        else if (i === 4) activeCount = Math.floor(count * 0.1); // cap colored star clusters
      }
      geo.setDrawRange(0, activeCount);
    });
    
    // Toggle lensed secondary accretion disk visibility
    if (lensedAccretionDisk) {
      lensedAccretionDisk.visible = (mode === 'HD');
    }
    
    // Toggle nebula gas density
    if (nebula) {
      nebula.material.opacity = (mode === 'HD') ? 0.025 : 0.008;
    }
    if (coreNebula) {
      coreNebula.material.opacity = (mode === 'HD') ? 0.035 : 0.012;
    }
  };

  // Interactive Mouse & Mobile Parallax Effects
  const mouse = { x: 0, y: 0 };
  const mouseInfluence = { x: 0, y: 0 };
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  document.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    
    // Adjust floating retro HUD selector location
    const hud = document.getElementById('space-explorer-hud');
    if (hud) {
      hud.style.left = (e.clientX + 15) + 'px';
      hud.style.top = (e.clientY + 15) + 'px';
    }
  });

  // Orbital zoom mapping for free flight space observation
  window.addEventListener('wheel', (e) => {
    if (window.appInstance && window.appInstance.spaceExplorerFreeFlight) {
      camera.position.z += e.deltaY * 0.25;
      camera.position.z = Math.max(50, Math.min(450, camera.position.z));
    }
  });
  
  // Mobile device orientation parallax
  if (isMobile && window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', (e) => {
      if (e.beta !== null && e.gamma !== null) {
        mouse.x = Math.max(-1, Math.min(1, e.gamma / 45));
        mouse.y = Math.max(-1, Math.min(1, (e.beta - 45) / 45));
      }
    });
  }
  
  function updateMouseInfluence(dt) {
    const smooth = 1.0 - Math.pow(0.05, dt);
    const multiplier = isMobile ? 3 : 5;
    mouseInfluence.x += (mouse.x - mouseInfluence.x) * smooth * multiplier;
    mouseInfluence.y += (mouse.y - mouseInfluence.y) * smooth * multiplier;
  }
  
  // Weather system
  let bgWeatherParticles = null;
  let currentBgWeather = 'clear';
  
  // Custom Space Background Objects
  let andromedaGalaxy = null;
  let eventHorizon = null;
  let accretionDisk = null;
  let sgrParticles = null;
  let andromedaDust = null;
  let lensedAccretionDisk = null;
  let sgrPartData = [];
  const sgrPartCount = 400;
  let androDustData = [];
  const androDustCount = 350;
  let proximaCentauri = null;
  let alphaCentauriA = null;
  let alphaCentauriB = null;
  
  function syncBackgroundWeather() {
    let weather = 'clear';
    if (window.SpaceGallery3D && window.SpaceGallery3D.currentWeather) {
      weather = window.SpaceGallery3D.currentWeather;
    } else if (window.appInstance && window.appInstance.weather) {
      weather = window.appInstance.weather;
    }
    
    if (weather !== currentBgWeather) {
      currentBgWeather = weather;
      updateBackgroundWeather();
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
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    
    // Determine vertical speed based on weather
    let vy = -0.3;
    if (currentBgWeather === 'cloudy') vy = -0.05;
    else if (currentBgWeather === 'rain') vy = -1.5;

    const material = new THREE.PointsMaterial({
      size: currentBgWeather === 'rain' ? 0.55 : currentBgWeather === 'cloudy' ? 5.5 : 3.0,
      color: currentBgWeather === 'rain' ? 0x7ac1ff : currentBgWeather === 'cloudy' ? 0xb5d3ff : 0xffffff,
      transparent: true,
      opacity: currentBgWeather === 'rain' ? 0.35 : currentBgWeather === 'cloudy' ? 0.12 : 0.16,
      blending: THREE.AdditiveBlending, 
      depthWrite: false,
      map: createWeatherSphereTexture(),
      alphaTest: 0.001
    });

    // Optimization: Shader-based movement to offload CPU
    material.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = { value: 0 };
        shader.uniforms.uSpeed = { value: vy };
        shader.uniforms.uRangeY = { value: 350.0 }; // 300 - (-50)
        shader.uniforms.uStartY = { value: 300.0 };

        // Save reference to update it later
        material.userData.shader = shader;

        shader.vertexShader = 'uniform float uTime;\nuniform float uSpeed;\nuniform float uRangeY;\nuniform float uStartY;\nvarying float vDist;\n' + shader.vertexShader;

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

        // Inject vDist calculation after view-space position assignment
        shader.vertexShader = shader.vertexShader.replace(
            '#include <project_vertex>',
            `
            #include <project_vertex>
            vDist = length( mvPosition.xyz );
            `
        );

        // Inject vDist in fragment shader
        shader.fragmentShader = 'varying float vDist;\n' + shader.fragmentShader;
        
        // Inject smoothstep near-camera fade in fragment shader
        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <color_fragment>',
            `
            #include <color_fragment>
            // Smoothly fade out particles closer than 110 units down to 60 units from camera
            diffuseColor.a *= smoothstep(60.0, 110.0, vDist);
            `
        );
    };
    
    bgWeatherParticles = new THREE.Points(geometry, material);
    scene.add(bgWeatherParticles);
  }
  setInterval(syncBackgroundWeather, 2000);
  
  // Starfield Layers (mobile-optimized)
  function createStarLayer(count, size, range, colorFn, useTexture = true) {
    const actualCount = isMobile ? Math.floor(count * 0.5) : count;
    const geo = new THREE.BufferGeometry();
    const pos = [];
    const col = [];
    for (let i = 0; i < actualCount; i++) {
      let x, y, z;
      // Exclude lens-proximity zone around camera (0, 25, 90) to prevent giant blurry or blocky particles
      do {
        x = (Math.random() - 0.5) * range;
        y = (Math.random() - 0.5) * range;
        z = (Math.random() - 0.5) * range;
      } while (Math.sqrt(x*x + (y-25)*(y-25) + (z-90)*(z-90)) < 350);

      pos.push(x, y, z);
      const c = colorFn();
      col.push(c.r, c.g, c.b);
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({
      size: isMobile ? size * 1.5 : size, 
      vertexColors: true, 
      transparent: true, 
      opacity: 0.95, 
      sizeAttenuation: true, 
      blending: THREE.AdditiveBlending, 
      depthWrite: false,
      map: useTexture ? createCircleTexture() : null, // Add circular texture only if requested
      alphaTest: 0.01
    });
    const mesh = new THREE.Points(geo, mat);
    scene.add(mesh);
    return mesh;
  }
  
  const starLayers = [
    createStarLayer(75000, 1.0, 3000, () => Math.random() < 0.15 ? new THREE.Color(0x88ccff) : new THREE.Color(0xffffff), true),
    createStarLayer(8000,  1.6, 3000, () => new THREE.Color(0xffffff), true),
    createStarLayer(90000, 0.6, 4500, () => new THREE.Color(0x445566), true),
    createStarLayer(4000,  2.4, 2500, () => {
      const r = Math.random();
      if (r < 0.25) return new THREE.Color(0xff9977); // Orange/Red giants
      if (r < 0.50) return new THREE.Color(0x88ddff); // Blue supergiants
      if (r < 0.75) return new THREE.Color(0xffe484); // Yellow dwarfs
      return new THREE.Color(0xffb7ff); // Purple stars
    }, true),
    // 5th Deep-Space star layer
    createStarLayer(105000, 0.35, 5000, () => new THREE.Color().setHSL(0.58 + Math.random()*0.05, 0.45, 0.25 + Math.random()*0.15), true)
  ];
  const stars = starLayers[0]; // Reference for weather presets
  
  // Nebula - Optimized with circular texture
  const nebulaGeo = new THREE.BufferGeometry();
  const nebPos = [], nebCol = [];
  const nebulaCount = isMobile ? 2000 : 5000; // Even denser, gorgeous volumetric gas!
  for (let i = 0; i < nebulaCount; i++) {
    const theta = Math.random() * Math.PI * 2, phi = Math.random() * Math.PI, r = 700 + Math.random() * 600;
    nebPos.push(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi));
    
    // Rich nebula colors (Cyan, Gold, Purple, Emerald)
    const rand = Math.random();
    let c;
    if (rand < 0.3) {
      c = new THREE.Color(0x00d4ff); // Cyan
    } else if (rand < 0.55) {
      c = new THREE.Color(0xff6b35); // Gold/Orange
    } else if (rand < 0.8) {
      c = new THREE.Color(0xa855f7); // Cosmic purple
    } else {
      c = new THREE.Color(0x4dffdb); // Earth teal/emerald
    }
    nebCol.push(c.r, c.g, c.b);
  }
  nebulaGeo.setAttribute('position', new THREE.Float32BufferAttribute(nebPos, 3));
  nebulaGeo.setAttribute('color', new THREE.Float32BufferAttribute(nebCol, 3));
  const _nebulaCloudTex = createNebulaTexture(); // single shared cloud puff — reuse for both layers
  const nebula = new THREE.Points(nebulaGeo, new THREE.PointsMaterial({ 
    size: 70, // large overlapping puffs for volumetric cloud merging
    vertexColors: true, 
    transparent: true, 
    opacity: 0.02, 
    blending: THREE.AdditiveBlending, 
    depthWrite: false,
    map: _nebulaCloudTex,
    alphaTest: 0.001
  }));
  scene.add(nebula);

  // Central Glowing Core Nebula (Pink/Gold)
  const coreNebGeo = new THREE.BufferGeometry();
  const coreNebPos = [], coreNebCol = [];
  const coreNebCount = isMobile ? 1500 : 3500;
  for (let i = 0; i < coreNebCount; i++) {
    const theta = Math.random() * Math.PI * 2, phi = Math.random() * Math.PI, r = 200 + Math.random() * 450;
    coreNebPos.push(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta) * 0.4, r * Math.cos(phi));
    
    const c = Math.random() < 0.5 ? new THREE.Color(0xff55b3) : new THREE.Color(0xff9d3b);
    coreNebCol.push(c.r, c.g, c.b);
  }
  coreNebGeo.setAttribute('position', new THREE.Float32BufferAttribute(coreNebPos, 3));
  coreNebGeo.setAttribute('color', new THREE.Float32BufferAttribute(coreNebCol, 3));
  const coreNebula = new THREE.Points(coreNebGeo, new THREE.PointsMaterial({
    size: 90, // even larger core puffs for dense volumetric glow
    vertexColors: true,
    transparent: true,
    opacity: 0.015,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    map: _nebulaCloudTex,
    alphaTest: 0.001
  }));
  scene.add(coreNebula);
  
  // 3D Pseudo-random noise for background planet textures
  const noise3D = (x, y, z) => {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;
    const fx = x - Math.floor(x);
    const fy = y - Math.floor(y);
    const fz = z - Math.floor(z);
    const u = fx * fx * (3 - 2 * fx);
    const v = fy * fy * (3 - 2 * fy);
    const w = fz * fz * (3 - 2 * fz);
    
    const hash = (p1, p2, p3) => {
      let h = Math.sin(p1 * 12.9898 + p2 * 78.233 + p3 * 37.719) * 43758.5453123;
      return h - Math.floor(h);
    };
    
    const r000 = hash(X, Y, Z);
    const r100 = hash(X + 1, Y, Z);
    const r010 = hash(X, Y + 1, Z);
    const r110 = hash(X + 1, Y + 1, Z);
    const r001 = hash(X, Y, Z + 1);
    const r101 = hash(X + 1, Y, Z + 1);
    const r011 = hash(X, Y + 1, Z + 1);
    const r111 = hash(X + 1, Y + 1, Z + 1);
    
    return (
      r000 * (1 - u) * (1 - v) * (1 - w) +
      r100 * u * (1 - v) * (1 - w) +
      r010 * (1 - u) * v * (1 - w) +
      r110 * u * v * (1 - w) +
      r001 * (1 - u) * (1 - v) * w +
      r101 * u * (1 - v) * w +
      r011 * (1 - u) * v * w +
      r111 * u * v * w
    );
  };

  const fbm3D = (x, y, z, octaves = 3) => {
    let value = 0;
    let amplitude = 0.5;
    let frequency = 1.0;
    for (let i = 0; i < octaves; i++) {
      value += amplitude * noise3D(x * frequency, y * frequency, z * frequency);
      frequency *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  };

  function generatePlanetTexture(name) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    
    const imgData = ctx.createImageData(w, h);
    const data = imgData.data;
    
    for (let y = 0; y < h; y++) {
      const lat = (y / h) * Math.PI - Math.PI / 2;
      const sinLat = Math.sin(lat);
      const cosLat = Math.cos(lat);
      for (let x = 0; x < w; x++) {
        const lon = (x / w) * Math.PI * 2;
        const px = cosLat * Math.cos(lon);
        const py = sinLat;
        const pz = cosLat * Math.sin(lon);
        
        const val = fbm3D(px * 6.0, py * 6.0, pz * 6.0, 3);
        const idx = (y * w + x) * 4;
        
        let r = 128, g = 128, b = 128;
        
        switch (name.toLowerCase()) {
          case 'mercury':
            r = g = b = Math.floor(70 + val * 100);
            break;
          case 'venus':
            r = Math.floor(210 + val * 45);
            g = Math.floor(165 + val * 60);
            b = Math.floor(50 + val * 40);
            break;
          case 'earth':
            const height = fbm3D(px * 4.0, py * 4.0, pz * 4.0, 3);
            if (height > 0.47) {
              if (Math.abs(lat) > 1.25) {
                r = 240; g = 245; b = 250;
              } else {
                r = Math.floor(30 + (height - 0.47) * 150);
                g = Math.floor(120 - (height - 0.47) * 40);
                b = Math.floor(50 - (height - 0.47) * 30);
              }
            } else {
              r = 15; g = 55; b = Math.floor(110 + height * 80);
            }
            break;
          case 'mars':
            const mRatio = Math.max(0, Math.min(1, (val - 0.3) / 0.4));
            r = Math.floor(180 - mRatio * 80);
            g = Math.floor(65 - mRatio * 30);
            b = Math.floor(20 - mRatio * 10);
            if (Math.abs(lat) > 1.35) {
              r = 255; g = 255; b = 255;
            }
            break;
          case 'jupiter':
            const jTurb = fbm3D(px * 5, py * 10, pz * 5, 2) * 0.1;
            const jLat = lat + jTurb;
            const jMix = Math.sin(jLat * 12) * 0.5 + 0.5 + val * 0.15;
            if (jMix < 0.4) {
              r = 145; g = 110; b = 85;
            } else if (jMix < 0.7) {
              r = 225; g = 205; b = 185;
            } else {
              r = 175; g = 120; b = 80;
            }
            break;
          case 'saturn':
            const sTurb = fbm3D(px * 4, py * 8, pz * 4, 2) * 0.05;
            const sLat = lat + sTurb;
            const sMix = Math.sin(sLat * 8) * 0.5 + 0.5;
            r = Math.floor(210 - sMix * 30);
            g = Math.floor(190 - sMix * 25);
            b = Math.floor(150 - sMix * 30);
            break;
          case 'uranus':
            r = Math.floor(40 + val * 40);
            g = Math.floor(160 + val * 40);
            b = Math.floor(190 + val * 30);
            break;
          case 'neptune':
            r = Math.floor(20 + val * 30);
            g = Math.floor(60 + val * 50);
            b = Math.floor(160 + val * 60);
            break;
          default:
            r = g = b = Math.floor(val * 255);
        }
        
        data[idx] = r;
        data[idx+1] = g;
        data[idx+2] = b;
        data[idx+3] = 255;
      }
    }
    
    ctx.putImageData(imgData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  function generatePlanetBumpMap(name) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    
    const imgData = ctx.createImageData(w, h);
    const data = imgData.data;
    
    for (let y = 0; y < h; y++) {
      const lat = (y / h) * Math.PI - Math.PI / 2;
      const sinLat = Math.sin(lat);
      const cosLat = Math.cos(lat);
      for (let x = 0; x < w; x++) {
        const lon = (x / w) * Math.PI * 2;
        const px = cosLat * Math.cos(lon);
        const py = sinLat;
        const pz = cosLat * Math.sin(lon);
        
        const idx = (y * w + x) * 4;
        let bumpVal = 128;
        
        switch (name.toLowerCase()) {
          case 'mercury': {
            const val = fbm3D(px * 16.0, py * 16.0, pz * 16.0, 4);
            bumpVal = Math.floor(100 + val * 55);
            break;
          }
          case 'earth': {
            const height = fbm3D(px * 6.0, py * 6.0, pz * 6.0, 4);
            bumpVal = height > 0.47 ? Math.floor(128 + (height - 0.47) * 127) : 100;
            break;
          }
          case 'mars': {
            const val = fbm3D(px * 12.0, py * 12.0, pz * 12.0, 4);
            bumpVal = Math.floor(80 + val * 90);
            break;
          }
          default:
            bumpVal = 128; // flat
        }
        
        data[idx] = bumpVal;
        data[idx+1] = bumpVal;
        data[idx+2] = bumpVal;
        data[idx+3] = 255;
      }
    }
    
    ctx.putImageData(imgData, 0, 0);
    // Draw occasional craters on Mercury bump map for extra realistic textures!
    if (name.toLowerCase() === 'mercury') {
      for (let i = 0; i < 30; i++) {
        const cx = Math.random() * w;
        const cy = Math.random() * h;
        const r = 4 + Math.random() * 15;
        
        ctx.fillStyle = 'rgba(60,60,60,0.8)';
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(200,200,200,0.8)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  function generatePlanetRoughnessMap(name) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    
    const imgData = ctx.createImageData(w, h);
    const data = imgData.data;
    
    for (let y = 0; y < h; y++) {
      const lat = (y / h) * Math.PI - Math.PI / 2;
      const sinLat = Math.sin(lat);
      const cosLat = Math.cos(lat);
      for (let x = 0; x < w; x++) {
        const lon = (x / w) * Math.PI * 2;
        const px = cosLat * Math.cos(lon);
        const py = sinLat;
        const pz = cosLat * Math.sin(lon);
        
        const idx = (y * w + x) * 4;
        let rVal = 200; // rough default
        
        if (name.toLowerCase() === 'earth') {
          const height = fbm3D(px * 6.0, py * 6.0, pz * 6.0, 4);
          rVal = height > 0.47 ? 220 : 40; // land is rough, water is extremely shiny (smooth)
        } else if (name.toLowerCase() === 'venus') {
          rVal = 240; // highly diffuse clouds
        }
        
        data[idx] = rVal;
        data[idx+1] = rVal;
        data[idx+2] = rVal;
        data[idx+3] = 255;
      }
    }
    
    ctx.putImageData(imgData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  function generateRingTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048; // Extremely high resolution!
    canvas.height = 128; // Large height for perfect oblique rendering
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    
    const imgData = ctx.createImageData(w, h);
    const data = imgData.data;
    for (let x = 0; x < w; x++) {
      const rRatio = x / w;
      let alpha = 0.0;
      let r = 225, g = 205, b = 175;
      
      if (rRatio > 0.1 && rRatio < 0.95) {
        alpha = 0.85;
        if (rRatio > 0.65 && rRatio < 0.70) {
          // Cassini Division
          alpha = 0.02;
        } else if (rRatio > 0.82 && rRatio < 0.84) {
          // Encke Gap
          alpha = 0.1;
        } else {
          // Realistic high-frequency ring lines
          const ringLines = Math.sin(rRatio * 400) * 0.12 + Math.sin(rRatio * 1000) * 0.06 + Math.sin(rRatio * 150) * 0.08;
          alpha += ringLines;
          alpha = Math.max(0.12, Math.min(1.0, alpha));
          r += Math.floor(ringLines * 30);
          g += Math.floor(ringLines * 20);
          b += Math.floor(ringLines * 10);
        }
      }
      
      if (rRatio <= 0.1) alpha *= (rRatio / 0.1);
      if (rRatio >= 0.95) alpha *= ((1.0 - rRatio) / 0.05);
      
      for (let y = 0; y < h; y++) {
        const idx = (y * w + x) * 4;
        data[idx] = r;
        data[idx+1] = g;
        data[idx+2] = b;
        data[idx+3] = Math.floor(alpha * 255);
      }
    }
    ctx.putImageData(imgData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    return texture;
  }

  // Planets - Optimized geometry
  const planets = [];
  function createPlanet(name, radius, color, pos, hasRings = false, hasAtmos = false, atmosColor = null) {
    const segments = radius > 5 ? 64 : 48;
    const texture = generatePlanetTexture(name);
    
    const matParams = {
      map: texture,
      flatShading: false
    };

    if (name.toLowerCase() === 'earth' || name.toLowerCase() === 'mars' || name.toLowerCase() === 'mercury') {
      matParams.bumpMap = generatePlanetBumpMap(name);
      matParams.bumpScale = name.toLowerCase() === 'earth' ? 0.25 : name.toLowerCase() === 'mars' ? 0.15 : 0.08;
    }

    matParams.roughnessMap = generatePlanetRoughnessMap(name);
    matParams.metalness = name.toLowerCase() === 'earth' ? 0.15 : 0.02;

    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius, segments, segments), 
      new THREE.MeshStandardMaterial(matParams)
    );
    mesh.position.set(pos.x, pos.y, pos.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { name: name.toUpperCase() }; // Store name for hover HUD
    scene.add(mesh);
    
    if (hasAtmos) {
      const glow = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.15, 24, 24), new THREE.ShaderMaterial({
        uniforms: { c: { value: 0.3 }, p: { value: 4.5 }, glowColor: { value: new THREE.Color(atmosColor || color) } },
        vertexShader: `varying vec3 vNormal; void main() { vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `uniform vec3 glowColor; uniform float c; uniform float p; varying vec3 vNormal; void main() { float intensity = pow(c - dot(vNormal, vec3(0.0, 0.0, 1.0)), p); gl_FragColor = vec4(glowColor, 1.0) * intensity; }`,
        side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false
      }));
      mesh.add(glow);
    }
    if (hasRings) {
      const ringGeometry = new THREE.RingGeometry(radius * 1.4, radius * 2.3, 64);
      
      const posAttr = ringGeometry.attributes.position;
      const uvAttr = ringGeometry.attributes.uv;
      const innerR = radius * 1.4;
      const outerR = radius * 2.3;
      for (let j = 0; j < posAttr.count; j++) {
        const rx = posAttr.getX(j);
        const ry = posAttr.getY(j);
        const rDist = Math.sqrt(rx*rx + ry*ry);
        const u = (rDist - innerR) / (outerR - innerR);
        uvAttr.setXY(j, u, 0.5);
      }
      uvAttr.needsUpdate = true;
      
      const ringMaterial = new THREE.MeshStandardMaterial({ 
        map: generateRingTexture(), 
        transparent: true, 
        opacity: 0.85, 
        side: THREE.DoubleSide 
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2.2; 
      ring.castShadow = true; 
      ring.receiveShadow = true;
      mesh.add(ring);
    }
    return mesh;
  }
  
  // Realistic Sun with high-quality procedural surface
  const sunCore = new THREE.Mesh(
    new THREE.SphereGeometry(12, 64, 64),
    new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPos = modelViewMatrix * vec4(position, 1.0);
          vViewDir = normalize(-worldPos.xyz);
          gl_Position = projectionMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }
        
        float noise(vec2 p) {
          vec2 ip = floor(p);
          vec2 fp = fract(p);
          fp = fp * fp * (3.0 - 2.0 * fp);
          float n00 = hash(ip);
          float n10 = hash(ip + vec2(1.0, 0.0));
          float n01 = hash(ip + vec2(0.0, 1.0));
          float n11 = hash(ip + vec2(1.0, 1.0));
          return mix(mix(n00, n10, fp.x), mix(n01, n11, fp.x), fp.y);
        }
        
        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 4; i++) { // 4 octaves — visually identical, ~33% faster
            v += a * noise(p);
            p *= 2.1;
            a *= 0.48;
          }
          return v;
        }
        
        void main() {
          vec2 uv = vUv * 8.0;
          float speed = time * 0.12;
          
          // Multi-layered turbulent plasma surface
          float n1 = fbm(uv + vec2(speed * 0.7, speed * 0.3));
          float n2 = fbm(uv * 1.3 - vec2(speed * 0.2, speed * 0.8) + vec2(n1 * 2.0));
          float n3 = fbm(uv * 0.7 + vec2(n2 * 1.5, speed * 0.15));
          float combined = n1 * 0.4 + n2 * 0.4 + n3 * 0.2;
          
          // Solar granulation spots
          float granules = fbm(uv * 3.5 + vec2(speed * 0.05));
          float spots = smoothstep(0.55, 0.7, granules) * 0.35;
          
          // Photosphere color palette — deep reds to bright yellows
          vec3 darkSpot = vec3(0.75, 0.15, 0.0);
          vec3 midTone  = vec3(1.0, 0.55, 0.05);
          vec3 hotSpot  = vec3(1.0, 0.92, 0.35);
          vec3 baseColor = mix(darkSpot, midTone, combined);
          baseColor = mix(baseColor, hotSpot, smoothstep(0.55, 0.85, combined));
          baseColor -= spots;
          
          // Limb darkening — realistic solar physics effect
          float NdV = dot(vNormal, vViewDir);
          float limb = 1.0 - pow(1.0 - max(0.0, NdV), 0.6);
          baseColor *= (0.35 + 0.65 * limb);
          
          // Bright edge corona glow
          float edge = pow(1.0 - max(0.0, NdV), 4.0);
          vec3 edgeGlow = vec3(1.0, 0.45, 0.0) * edge * 1.2;
          
          gl_FragColor = vec4(baseColor + edgeGlow, 1.0);
        }
      `
    })
  );
  sunCore.position.set(-100, 30, -150);
  scene.add(sunCore);

  // Clean radial corona glow — single additive sprite, no holographic rings
  function generateCoronaTexture() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const cx = size / 2;
    const cy = size / 2;
    
    // Pure smooth radial gradient — like a real solar corona photograph
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cx);
    grad.addColorStop(0,    'rgba(255, 255, 240, 1.0)');
    grad.addColorStop(0.08, 'rgba(255, 230, 180, 0.85)');
    grad.addColorStop(0.15, 'rgba(255, 180, 80, 0.5)');
    grad.addColorStop(0.25, 'rgba(255, 120, 30, 0.22)');
    grad.addColorStop(0.40, 'rgba(255, 70, 10, 0.08)');
    grad.addColorStop(0.60, 'rgba(200, 40, 5, 0.025)');
    grad.addColorStop(1,    'rgba(100, 20, 0, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  // Colored corona for non-solar stars — accepts RGB 0-255 for star-specific chromosphere tints
  function generateCoronaTextureColored(r, g, b) {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const cx = size / 2;
    const grad = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
    grad.addColorStop(0,    `rgba(255, 255, 255, 1.0)`);
    grad.addColorStop(0.05, `rgba(${r}, ${Math.min(255,g+40)}, ${Math.min(255,b+40)}, 0.95)`);
    grad.addColorStop(0.12, `rgba(${r}, ${g}, ${b}, 0.70)`);
    grad.addColorStop(0.25, `rgba(${r}, ${Math.max(0,g-30)}, ${Math.max(0,b-20)}, 0.30)`);
    grad.addColorStop(0.45, `rgba(${Math.max(0,r-30)}, ${Math.max(0,g-50)}, 0, 0.10)`);
    grad.addColorStop(0.70, `rgba(${Math.max(0,r-80)}, 0, 0, 0.025)`);
    grad.addColorStop(1,    `rgba(0, 0, 0, 0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }
  
  const coronaTexture = generateCoronaTexture();
  const coronaMaterial = new THREE.SpriteMaterial({
    map: coronaTexture,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const coronaSprite = new THREE.Sprite(coronaMaterial);
  coronaSprite.scale.set(55, 55, 1);
  sunCore.add(coronaSprite);

  const sun = sunCore; // Keep reference
  
  const mercury = createPlanet('mercury', 2.5, 0x8C7853, {x:-80, y:5, z:-40});
  planets.push({ mesh: mercury, speed: 0.0015, radius: 30, angle: 0, rotationSpeed: 0.004 });
  const venus = createPlanet('venus', 3.8, 0xFFC649, {x:25, y:10, z:-50}, false, true, 0xFFE4B5);
  planets.push({ mesh: venus, speed: 0.001, radius: 40, angle: Math.PI/4, rotationSpeed: 0.005 });
  const earth = createPlanet('earth', 4.5, 0x2E5F8C, {x:40, y:-15, z:-60}, false, true, 0x4A90E2);
  planets.push({ mesh: earth, speed: 0.0008, radius: 50, angle: 0, rotationSpeed: 0.01 });
  const moon = new THREE.Mesh(new THREE.SphereGeometry(1.2, 32, 32), new THREE.MeshStandardMaterial({ color: 0xCCCCCC }));
  moon.castShadow = true; earth.add(moon); moon.position.set(8,0,0);
  const mars = createPlanet('mars', 3.2, 0xCD5C5C, {x:-50, y:20, z:-70});
  planets.push({ mesh: mars, speed: 0.0005, radius: 65, angle: Math.PI, rotationSpeed: 0.008 });
  
  // Dwarf Planet Ceres (Asteroid Belt Anchor)
  const ceres = createPlanet('ceres', 1.2, 0x8D847B, {x:-75, y:2, z:-75});
  planets.push({ mesh: ceres, speed: 0.0003, radius: 75, angle: Math.PI * 0.4, rotationSpeed: 0.005 });

  const jupiter = createPlanet('jupiter', 8.5, 0xC88B3A, {x:80, y:35, z:-100});
  planets.push({ mesh: jupiter, speed: 0.0002, radius: 90, angle: Math.PI/2, rotationSpeed: 0.015 });
  const saturn = createPlanet('saturn', 7.5, 0xE8D4A0, {x:-70, y:-25, z:-90}, true);
  planets.push({ mesh: saturn, speed: 0.00015, radius: 80, angle: Math.PI*1.5, rotationSpeed: 0.012 });
  const uranus = createPlanet('uranus', 5.5, 0x4FD0E7, {x:95, y:-30, z:-120}, true);
  planets.push({ mesh: uranus, speed: 0.0001, radius: 110, angle: Math.PI/3, rotationSpeed: 0.009 });
  const neptune = createPlanet('neptune', 5.2, 0x4169E1, {x:-85, y:15, z:-130});
  planets.push({ mesh: neptune, speed: 0.00008, radius: 125, angle: Math.PI*1.7, rotationSpeed: 0.01 });

  // Dwarf Planet Pluto
  const pluto = createPlanet('pluto', 1.8, 0xC0A98B, {x:-145, y:-10, z:-150});
  planets.push({ mesh: pluto, speed: 0.00004, radius: 145, angle: Math.PI * 0.8, rotationSpeed: 0.006 });

  // Dwarf Planet Eris
  const eris = createPlanet('eris', 1.6, 0xD3C2B0, {x:160, y:25, z:-170});
  planets.push({ mesh: eris, speed: 0.00002, radius: 160, angle: Math.PI * 1.3, rotationSpeed: 0.007 });

  // ── Closest Star Systems — Photorealistic WebGL Stellar Shaders ──
  // Proxima Centauri — M-type red dwarf: deep crimson core, scarlet mid, warm orange edge
  proximaCentauri = new THREE.Mesh(
    new THREE.SphereGeometry(3.5, 48, 48),
    createStellarShaderMaterial(
      [0.55, 0.04, 0.0],   // dark: deep crimson convection troughs
      [0.95, 0.22, 0.03],  // mid: burning scarlet photosphere
      [1.0,  0.55, 0.12],  // hot: bright orange-white granule peaks
      [1.0,  0.35, 0.0]    // edge: flaring orange-red chromosphere
    )
  );
  proximaCentauri.position.set(160, 80, -220);
  proximaCentauri.userData = { name: "PROXIMA CENTAURI STAR" };
  // Soft red corona sprite
  const proxCoronaMat = new THREE.SpriteMaterial({
    map: generateCoronaTextureColored(255, 60, 10),
    transparent: true, opacity: 0.80,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const proxCorona = new THREE.Sprite(proxCoronaMat);
  proxCorona.scale.set(22, 22, 1);
  proximaCentauri.add(proxCorona);
  scene.add(proximaCentauri);

  // Alpha Centauri A — G-type solar analog: bright yellow-white photosphere
  alphaCentauriA = new THREE.Mesh(
    new THREE.SphereGeometry(5.2, 48, 48),
    createStellarShaderMaterial(
      [0.72, 0.32, 0.02],  // dark: deep amber convection troughs
      [1.0,  0.72, 0.12],  // mid: golden-yellow photosphere
      [1.0,  0.95, 0.55],  // hot: bright yellow-white granule peaks
      [1.0,  0.80, 0.30]   // edge: warm golden chromosphere
    )
  );
  alphaCentauriA.position.set(-240, 90, -180);
  alphaCentauriA.userData = { name: "ALPHA CENTAURI A STAR" };
  const alphaACoronaMat = new THREE.SpriteMaterial({
    map: generateCoronaTextureColored(255, 220, 130),
    transparent: true, opacity: 0.75,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const alphaACorona = new THREE.Sprite(alphaACoronaMat);
  alphaACorona.scale.set(30, 30, 1);
  alphaCentauriA.add(alphaACorona);
  scene.add(alphaCentauriA);

  // Alpha Centauri B — K-type orange dwarf: rich warm peach-orange photosphere
  alphaCentauriB = new THREE.Mesh(
    new THREE.SphereGeometry(4.2, 48, 48),
    createStellarShaderMaterial(
      [0.60, 0.18, 0.0],   // dark: deep burnt-orange convection troughs
      [0.98, 0.50, 0.08],  // mid: rich peach-orange photosphere
      [1.0,  0.78, 0.35],  // hot: warm cream-orange granule peaks
      [1.0,  0.60, 0.15]   // edge: orange-amber chromosphere
    )
  );
  alphaCentauriB.position.set(18, 5, -15);
  alphaCentauriB.userData = { name: "ALPHA CENTAURI B STAR" };
  const alphaBCoronaMat = new THREE.SpriteMaterial({
    map: generateCoronaTextureColored(255, 160, 60),
    transparent: true, opacity: 0.75,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const alphaBCorona = new THREE.Sprite(alphaBCoronaMat);
  alphaBCorona.scale.set(26, 26, 1);
  alphaCentauriB.add(alphaBCorona);
  alphaCentauriA.add(alphaCentauriB);

  // Lighting
  scene.add(new THREE.AmbientLight(0x1a1a3a, 0.6));
  const sunL = new THREE.PointLight(0xFFD700, 4.0, 500); sunL.position.copy(sun.position); sunL.castShadow = true; scene.add(sunL);
  const fillL = new THREE.DirectionalLight(0x4A90E2, 0.6); fillL.position.set(-80, 40, 60); scene.add(fillL);
  const rimL = new THREE.DirectionalLight(0x8A2BE2, 0.8); rimL.position.set(60, -30, -80); scene.add(rimL);
  
  // Asteroids — InstancedMesh: 150 meshes → 1 draw call
  const AST_COUNT = 150;
  const asteroids = [];
  const astGeo = new THREE.DodecahedronGeometry(0.5, 0);
  const astMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9, flatShading: true });
  const astInstanced = new THREE.InstancedMesh(astGeo, astMat, AST_COUNT);
  astInstanced.castShadow = false; // shadows off for performance
  scene.add(astInstanced);
  const _astMatrix = new THREE.Matrix4();
  const _astScale  = new THREE.Vector3();
  const _astQuat   = new THREE.Quaternion();
  const _astPos    = new THREE.Vector3();
  for (let i = 0; i < AST_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2, dist = 72 + Math.random() * 12; // Between Mars (65) and Jupiter (90)
    const sc = 0.2 + Math.random() * 0.5;
    const yPos = (Math.random()-0.5)*4.5;
    asteroids.push({ rot: (Math.random()-0.5)*0.02, orb: 0.0003+Math.random()*0.0004, angle, dist, rotX: 0, rotY: 0, sc, y: yPos });
    _astScale.setScalar(sc);
    _astPos.set(Math.cos(angle)*dist, yPos, Math.sin(angle)*dist);
    _astMatrix.compose(_astPos, _astQuat, _astScale);
    astInstanced.setMatrixAt(i, _astMatrix);
  }
  astInstanced.instanceMatrix.needsUpdate = true;

  // ── Andromeda Galaxy Mesh Setup ──
  const andromedaTexture = createAndromedaTexture();
  const andromedaGeo = new THREE.PlaneGeometry(90, 90);
  const andromedaMaterial = new THREE.MeshBasicMaterial({
    map: andromedaTexture,
    transparent: true,
    blending: THREE.AdditiveBlending,
    opacity: 0.88,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  andromedaGalaxy = new THREE.Mesh(andromedaGeo, andromedaMaterial);
  andromedaGalaxy.position.set(230, 45, -340); // Distant background balance
  andromedaGalaxy.rotation.set(Math.PI / 4.5, -Math.PI / 5, Math.PI / 7);
  scene.add(andromedaGalaxy);

  // ── Sagittarius A* Black Hole — Clean Interstellar-style design ──
  // Pure black event horizon sphere with a thin elegant accretion disk and a photon ring.
  // No orbiting gas particle clouds — just a clean, cinematic silhouette.
  
  // Event Horizon — perfectly absorbing black sphere
  const eventHorizonGeo = new THREE.SphereGeometry(6.0, 64, 64);
  const eventHorizonMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  eventHorizon = new THREE.Mesh(eventHorizonGeo, eventHorizonMat);
  eventHorizon.position.set(-190, 38, -290);
  scene.add(eventHorizon);

  // Thin photon-ring glow rim — sharp Fresnel edge, NOT a fat orange ball
  const photonRimGeo = new THREE.SphereGeometry(6.35, 64, 64);
  const photonRimMat = new THREE.ShaderMaterial({
    uniforms: {
      glowColor: { value: new THREE.Color(0xffaa44) }
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform vec3 glowColor;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        float rim = pow(1.0 - abs(dot(vNormal, vView)), 8.0); // Very sharp edge-only glow
        gl_FragColor = vec4(glowColor, rim * 0.65);
      }
    `,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false
  });
  eventHorizon.add(new THREE.Mesh(photonRimGeo, photonRimMat));

  // ── Thin Elegant Accretion Disk (Interstellar-style) ──
  // Narrow ring with animated FBM plasma — inner bright white, outer dim orange-red
  const accretionDiskMat = createAccretionDiskShaderMaterial(6.8, 18);
  accretionDisk = new THREE.Mesh(new THREE.RingGeometry(6.8, 18, 128, 1), accretionDiskMat);
  accretionDisk.rotation.set(Math.PI / 2.15, Math.PI / 14, 0);
  eventHorizon.add(accretionDisk);

  // ── Gravitational Lensing Ring (HD only) — thin photon ring perpendicular to disk ──
  // In Interstellar, light bends around the BH, creating a second ring visible above/below
  const lensedAccretionDiskMat = createAccretionDiskShaderMaterial(6.2, 10);
  lensedAccretionDisk = new THREE.Mesh(new THREE.RingGeometry(6.2, 10, 128, 1), lensedAccretionDiskMat);
  lensedAccretionDisk.lookAt(camera.position);
  lensedAccretionDisk.visible = (localStorage.getItem('graphicsMode') || 'HD') === 'HD';
  eventHorizon.add(lensedAccretionDisk);

  // ─── Shooting Stars ─────────────────────────────────────────────────────────
  // Rare, solitary cinematic meteors with smooth 28-point gradient trails.
  // One fires every 8–22 s. Direction mirrors real shower meteors (upper-right → lower-left).
  const SS_TRAIL = 28; // trail segment count (head → tail)
  const MAX_SS   = 2;  // max simultaneously active meteors
  const shootingStars = [];

  // Real meteor chemical composition tints
  const meteorTints = [
    new THREE.Color(0xffffff), // iron-nickel  → pure white
    new THREE.Color(0xc8e8ff), // sodium       → electric blue-white
    new THREE.Color(0xfff5c0), // calcium      → warm golden
    new THREE.Color(0xffe8f5), // magnesium    → soft violet-pink
  ];

  /** Build one reusable shooting-star object with its own multi-point geometry */
  function createShootingStarObject() {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SS_TRAIL * 3), 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(new Float32Array(SS_TRAIL * 3), 3));
    const mat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const line = new THREE.Line(geo, mat);
    line.frustumCulled = false; // always drawn; it lives deep in the background
    scene.add(line);
    return {
      mesh:      line,
      active:    false,
      t:         0,
      speed:     0.18,
      travel:    280,
      direction: new THREE.Vector3(),
      start:     new THREE.Vector3(),
      tint:      meteorTints[0],
      trail:     [], // ring buffer of THREE.Vector3
    };
  }

  for (let i = 0; i < MAX_SS; i++) shootingStars.push(createShootingStarObject());

  function spawnShootingStar() {
    const star = shootingStars.find(s => !s.active);
    if (!star) return;

    star.active = true;
    star.t      = 0;
    star.tint   = meteorTints[Math.floor(Math.random() * meteorTints.length)];

    // 50% chance for a deep-space meteor, 50% chance for a close screen-space meteor dropping down
    const isClose = Math.random() < 0.5;

    if (isClose) {
      // Screen-space close meteor: spawns close to camera, passes directly in front of the viewport/landing page
      const zDepth = -90 - Math.random() * 70; // zDepth is between -160 and -90 (camera is at z=90)
      const dist = 90 - zDepth; // distance from camera: 180 to 250 units
      
      // Spawn in the upper-right screen quadrant
      const startX = dist * (0.25 + Math.random() * 0.35);
      const startY = 25 + dist * (0.20 + Math.random() * 0.15);
      
      star.start.set(startX, startY, zDepth);

      // Travel diagonally downwards and leftwards across the display
      star.direction.set(
        -(0.75 + Math.random() * 0.20), // strongly leftward
        -(0.45 + Math.random() * 0.20), // downward
        -(0.05 + Math.random() * 0.10)  // very minor depth variation
      ).normalize();

      star.travel = dist * (0.9 + Math.random() * 0.5); // travels a good portion of the screen width
      star.speed  = 0.22 + Math.random() * 0.18; // flies faster to match eye proximity
    } else {
      // Majestically slow, deep background meteor
      const zDepth = -480 - Math.random() * 650;
      star.start.set(
        120 + Math.random() * 280,  // right portion of sky
         80 + Math.random() * 120,  // high altitude
        zDepth
      );

      star.direction.set(
        -(0.55 + Math.random() * 0.40), // leftward
        -(0.28 + Math.random() * 0.22), // downward
         (Math.random() - 0.5) * 0.12   // minor depth variation
      ).normalize();

      star.travel = 200 + Math.random() * 210;
      star.speed  = 0.11 + Math.random() * 0.15; // majestic, slow deep-space motion
    }

    // Pre-fill trail ring buffer with the start position
    star.trail = [];
    for (let i = 0; i < SS_TRAIL; i++) star.trail.push(star.start.clone());

    star.mesh.material.opacity = 0;
    star.mesh.visible = true;
  }

  // Timer: one solitary meteor every 8–22 seconds
  let _ssElapsed = 0;
  let _ssDelay   = 5 + Math.random() * 8; // first one appears within 5–13 s

  // ── Performance: pause when tab is hidden ───────────────────────────────────
  let _tabVisible = true;
  document.addEventListener('visibilitychange', () => { _tabVisible = !document.hidden; });

  // ── Adaptive throttle: drop to 30fps if sustained FPS < 35 ─────────────────
  let _fpsFrames = 0, _fpsTime = 0, _currentFps = 60, _skipFrame = false;

  // Animation Loop - Optimised for 60fps
  const _v1 = new THREE.Vector3();
  const _v2 = new THREE.Vector3();
  const _astEuler  = new THREE.Euler();
  const _astQuatTmp = new THREE.Quaternion();
  let lastTime = 0;
  let frameCount = 0;
  let lastFpsUpdate = 0;
  
  function animate(currentTime) {
    requestAnimationFrame(animate);

    // Pause render when tab is hidden or scene is paused externally — zero GPU cost
    if (!_tabVisible || cinematic.paused) return;

    const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
    lastTime = currentTime;
    const scale = dt * 60;

    // Adaptive FPS throttle: if sustained < 35fps, skip every other frame
    _fpsFrames++;
    _fpsTime += dt;
    if (_fpsTime >= 1.0) {
      _currentFps = _fpsFrames / _fpsTime;
      _fpsFrames = 0;
      _fpsTime   = 0;
    }
    _skipFrame = !_skipFrame;
    if (_currentFps < 35 && _skipFrame) return; // render at ~30fps under load
    
    // Warp
    cinematic.warpFactor += (cinematic.targetWarp - cinematic.warpFactor) * dt * 2;
    const warpSpeed = 1 + cinematic.warpFactor * 50;
    
    // Stars — rotation every frame; twinkling only every 3rd frame (invisible difference)
    const baseRotation = 0.000012 * scale * warpSpeed;
    const doTwinkle = (frameCount % 3 === 0);
    frameCount++;
    starLayers.forEach((stars, i) => {
      stars.rotation.y += baseRotation * (i + 1);

      if (doTwinkle) {
        if (i === 1) {
          stars.material.opacity = 0.5 + Math.sin(currentTime * 0.0028) * 0.22;
        } else if (i === 3) {
          stars.material.opacity = 0.6 + Math.cos(currentTime * 0.0013 + 1.5) * 0.25;
        } else if (i === 4) {
          stars.material.opacity = 0.35 + Math.sin(currentTime * 0.0045 + 3.0) * 0.18;
        }
      }

      if (cinematic.warpFactor > 0.01) {
        const warpScale = 1 + cinematic.warpFactor * 20;
        stars.scale.z = warpScale;
        stars.rotation.z += 0.001 * scale;
      } else if (stars.scale.z !== 1) {
        stars.scale.z += (1 - stars.scale.z) * dt * 2;
      }
    });
    
    nebula.rotation.y -= 0.00005 * scale;
    if (coreNebula) {
      coreNebula.rotation.y += 0.00003 * scale;
    }
    
    // Animate sun shader
    if (sun.material.uniforms) {
      sun.material.uniforms.time.value = currentTime * 0.0001;
    }
    sun.rotation.y += 0.001 * scale;
    
    // Subtle corona breathing
    if (typeof coronaSprite !== 'undefined' && coronaSprite) {
      const coronaPulse = 1.0 + Math.sin(currentTime * 0.0008) * 0.03;
      coronaSprite.scale.set(55 * coronaPulse, 55 * coronaPulse, 1);
      coronaSprite.material.rotation = Math.sin(currentTime * 0.00015) * 0.04;
      coronaSprite.material.opacity = 0.70 + Math.cos(currentTime * 0.0005) * 0.08;
    }

    // Binary star and nearby star systems — tick stellar shader time + corona pulse
    if (alphaCentauriA) {
      alphaCentauriA.rotation.y += 0.002 * scale;
      if (alphaCentauriA.material && alphaCentauriA.material.uniforms)
        alphaCentauriA.material.uniforms.time.value = currentTime * 0.0001;
      const alphaACoronaPulse = 1.0 + Math.sin(currentTime * 0.0006) * 0.02;
      const ray = alphaCentauriA.children[0];
      if (ray && ray.material) {
        ray.scale.set(30 * alphaACoronaPulse, 30 * alphaACoronaPulse, 1);
        ray.material.rotation = Math.sin(currentTime * 0.0002) * 0.03;
      }
    }
    if (alphaCentauriB) {
      alphaCentauriB.rotation.y -= 0.003 * scale;
      if (alphaCentauriB.material && alphaCentauriB.material.uniforms)
        alphaCentauriB.material.uniforms.time.value = currentTime * 0.0001;
      if (!alphaCentauriB.orbAng) alphaCentauriB.orbAng = 0;
      alphaCentauriB.orbAng += 0.001 * scale;
      alphaCentauriB.position.set(Math.cos(alphaCentauriB.orbAng) * 20, 2, Math.sin(alphaCentauriB.orbAng) * 20);
      const alphaBCoronaPulse = 1.0 + Math.cos(currentTime * 0.0007) * 0.025;
      const ray = alphaCentauriB.children[0];
      if (ray && ray.material) {
        ray.scale.set(26 * alphaBCoronaPulse, 26 * alphaBCoronaPulse, 1);
        ray.material.rotation = -Math.sin(currentTime * 0.00025) * 0.035;
      }
    }
    if (proximaCentauri) {
      proximaCentauri.rotation.y += 0.001 * scale;
      if (proximaCentauri.material && proximaCentauri.material.uniforms)
        proximaCentauri.material.uniforms.time.value = currentTime * 0.0001;
      const proxPulse = 1.0 + Math.sin(currentTime * 0.0009) * 0.03;
      const ray = proximaCentauri.children[0];
      if (ray && ray.material) {
        ray.scale.set(22 * proxPulse, 22 * proxPulse, 1);
        ray.material.rotation = Math.sin(currentTime * 0.0001) * 0.05;
      }
    }
    
    // Planets - Batch update
    const cx = sun.position.x, cz = sun.position.z;
    planets.forEach(p => {
      p.angle += p.speed * scale;
      const cosAngle = Math.cos(p.angle);
      const sinAngle = Math.sin(p.angle);
      p.mesh.position.x = cx + cosAngle * p.radius;
      p.mesh.position.z = cz + sinAngle * p.radius;
      p.mesh.rotation.y += p.rotationSpeed * scale;
    });
    
    // ── Accretion Disk: tick animated shader time + orbital rotation ──
    if (accretionDisk) {
      accretionDisk.rotation.z += 0.004 * scale;
      if (accretionDisk.material && accretionDisk.material.uniforms)
        accretionDisk.material.uniforms.time.value = currentTime * 0.001;
    }
    if (lensedAccretionDisk) {
      lensedAccretionDisk.lookAt(camera.position);
      lensedAccretionDisk.rotation.z -= 0.003 * scale;
      if (lensedAccretionDisk.material && lensedAccretionDisk.material.uniforms)
        lensedAccretionDisk.material.uniforms.time.value = currentTime * 0.001;
    }
    if (eventHorizon) {
      eventHorizon.rotation.y += 0.0003 * scale;
      eventHorizon.rotation.x = Math.sin(currentTime * 0.0004) * 0.02;
    }
    if (andromedaGalaxy) {
      andromedaGalaxy.rotation.z += 0.00012 * scale;
    }
    
    if (moon) {
      moon.rotation.y += 0.02 * scale;
      if (!moon.orbAng) moon.orbAng = 0;
      moon.orbAng += 0.03 * scale;
      const moonCos = Math.cos(moon.orbAng) * 8;
      const moonSin = Math.sin(moon.orbAng) * 8;
      moon.position.set(moonCos, 0, moonSin);
    }
    
    // Asteroids — InstancedMesh: update matrices in batch (1 draw call)
    for (let i = 0; i < asteroids.length; i++) {
      const a = asteroids[i];
      a.angle += a.orb * scale;
      a.rotX  += a.rot * scale;
      a.rotY  += a.rot * scale;
      _astPos.set(cx + Math.cos(a.angle) * a.dist, a.y, cz + Math.sin(a.angle) * a.dist);
      _astEuler.set(a.rotX, a.rotY, 0);
      _astQuatTmp.setFromEuler(_astEuler);
      _astScale.setScalar(a.sc);
      _astMatrix.compose(_astPos, _astQuatTmp, _astScale);
      astInstanced.setMatrixAt(i, _astMatrix);
    }
    astInstanced.instanceMatrix.needsUpdate = true;
    
    // ─── Shooting Stars Update ────────────────────────────────────────────────
    _ssElapsed += dt;
    if (_ssElapsed >= _ssDelay) {
      _ssElapsed = 0;
      _ssDelay   = 8 + Math.random() * 14; // next meteor in 8–22 s
      spawnShootingStar();
    }

    for (let i = 0; i < shootingStars.length; i++) {
      const s = shootingStars[i];
      if (!s.active) continue;

      s.t += dt * s.speed;

      // Fade in 0→0.18t, full 0.18→0.72t, fade out 0.72→1.3t
      const fadeIn  = Math.min(s.t / 0.18, 1.0);
      const fadeOut = s.t > 0.72 ? Math.max(0, 1 - (s.t - 0.72) / 0.58) : 1.0;
      const brightness = fadeIn * fadeOut;

      if (s.t > 1.3 || brightness <= 0.001) {
        s.active = false;
        s.mesh.material.opacity = 0;
        s.mesh.visible = false;
        continue;
      }

      // Advance head along direction
      _v1.copy(s.start).addScaledVector(s.direction, s.t * s.travel);

      // O(1) ring-buffer: overwrite oldest slot, advance head index
      if (!s.trailHead) s.trailHead = 0;
      s.trail[s.trailHead] = _v1.clone();
      s.trailHead = (s.trailHead + 1) % SS_TRAIL;

      // Write positions + vertex colors using ring-buffer order (head → tail)
      const pos = s.mesh.geometry.attributes.position;
      const col = s.mesh.geometry.attributes.color;
      const head = s.trailHead || 0;
      for (let p = 0; p < SS_TRAIL; p++) {
        // Read from ring buffer newest-first: head-1, head-2, ...
        const idx = (head - 1 - p + SS_TRAIL) % SS_TRAIL;
        const pt  = s.trail[idx];
        pos.setXYZ(p, pt.x, pt.y, pt.z);
        const falloff = Math.pow(1 - p / (SS_TRAIL - 1), 2.4);
        col.setXYZ(p,
          s.tint.r * falloff * brightness,
          s.tint.g * falloff * brightness,
          s.tint.b * falloff * brightness
        );
      }
      pos.needsUpdate = true;
      col.needsUpdate = true;
      s.mesh.material.opacity = brightness;
    }
    
    // Background weather particles
    if (bgWeatherParticles && bgWeatherParticles.material.userData.shader) {
      bgWeatherParticles.material.userData.shader.uniforms.uTime.value = currentTime * 0.001;
    }
    
    // ── Interactive Hover HUD Raycaster ──
    const hud = document.getElementById('space-explorer-hud');
    const hudText = document.getElementById('space-explorer-text');
    if (hud && hudText && typeof THREE !== 'undefined' && camera && scene) {
      if (!window.spaceRaycaster) {
        window.spaceRaycaster = new THREE.Raycaster();
      }
      window.spaceRaycaster.setFromCamera(mouse, camera);
      
      const targets = [];
      if (andromedaGalaxy) targets.push(andromedaGalaxy);
      if (eventHorizon) targets.push(eventHorizon);
      if (typeof sun !== 'undefined' && sun) targets.push(sun);
      
      planets.forEach(p => {
        if (p.mesh) {
          targets.push(p.mesh);
          p.mesh.children.forEach(c => {
            if (c instanceof THREE.Mesh && c.name !== 'saturnRings') {
              targets.push(c);
            }
          });
        }
      });
      
      if (proximaCentauri) targets.push(proximaCentauri);
      if (alphaCentauriA) {
        targets.push(alphaCentauriA);
        targets.push(alphaCentauriB);
      }
      
      const intersects = window.spaceRaycaster.intersectObjects(targets);
      if (intersects.length > 0) {
        const obj = intersects[0].object;
        let nameText = "";
        
        if (obj === andromedaGalaxy) {
          nameText = "ANDROMEDA GALAXY";
        } else if (obj === eventHorizon) {
          nameText = "SAGITTARIUS A* BLACK HOLE";
        } else if (typeof sun !== 'undefined' && obj === sun) {
          nameText = "THE SUN (STAR)";
        } else if (obj.userData && obj.userData.name) {
          nameText = obj.userData.name.toUpperCase();
        } else if (obj.parent && obj.parent.userData && obj.parent.userData.name) {
          nameText = obj.parent.userData.name.toUpperCase();
        }
        
        if (nameText) {
          if (nameText === 'EARTH') {
            hudText.textContent = "[HOME PLANET: EARTH]";
          } else {
            hudText.textContent = `[ANOMALY IDENTIFIED: ${nameText}]`;
          }
          hud.style.opacity = '1';
        } else {
          hud.style.opacity = '0';
        }
      } else {
        hud.style.opacity = '0';
      }
    }

    // Cinematic Camera Drift - Smooth interpolation
    updateMouseInfluence(dt);
    const time = currentTime * 0.00005;
    const driftX = Math.sin(time) * 10 + Math.cos(time * 0.3) * 5;
    const driftY = Math.cos(time * 0.7) * 5 + Math.sin(time * 0.2) * 3;
    const shake = cinematic.warpFactor * (Math.random() - 0.5) * 0.5;
    
    if (window.appInstance && window.appInstance.spaceExplorerFreeFlight) {
      // Extended free-flight pan boundaries based on cursor tracking
      const targetX = mouseInfluence.x * 160;
      const targetY = 25 + mouseInfluence.y * 100;
      camera.position.x += (targetX - camera.position.x) * 0.08 * scale;
      camera.position.y += (targetY - camera.position.y) * 0.08 * scale;
      camera.lookAt(0, 10, -150);
    } else {
      // Default gameplay coordinates
      camera.position.x = driftX + mouseInfluence.x * 10 + shake;
      camera.position.y = 25 + driftY + mouseInfluence.y * 10 + shake;
      if (camera.position.z !== 90) {
        camera.position.z += (90 - camera.position.z) * 0.05 * scale;
      }
      camera.lookAt(0, 0, -50);
    }
    
    renderer.render(scene, camera);
  }
  
  // Set initial graphics quality mode from localStorage
  const startupGraphicsMode = localStorage.getItem('graphicsMode') || 'HD';
  if (cinematic.setGraphicsMode) {
    cinematic.setGraphicsMode(startupGraphicsMode);
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
