// 3D Cinematic Space Gallery with Three.js
(function() {
  // 3D Pseudo-random noise for textures and gas clouds
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

  const fbm3D = (x, y, z, octaves = 4) => {
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

  const TextureGenerator = {
    generate(name, type = 'albedo') {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;

      const key = `${name.toLowerCase()}-${type.toLowerCase()}`;

      switch (key) {
        case 'sun-albedo':
          this.drawSunAlbedo(ctx, w, h);
          break;
        case 'mercury-albedo':
          this.drawMercuryAlbedo(ctx, w, h);
          break;
        case 'mercury-bump':
          this.drawMercuryBump(ctx, w, h);
          break;
        case 'venus-albedo':
          this.drawVenusAlbedo(ctx, w, h);
          break;
        case 'earth-albedo':
          this.drawEarthAlbedo(ctx, w, h);
          break;
        case 'earth-bump':
          this.drawEarthBump(ctx, w, h);
          break;
        case 'earth-roughness':
          this.drawEarthRoughness(ctx, w, h);
          break;
        case 'earth-clouds-albedo':
          this.drawEarthClouds(ctx, w, h);
          break;
        case 'mars-albedo':
          this.drawMarsAlbedo(ctx, w, h);
          break;
        case 'mars-bump':
          this.drawMarsBump(ctx, w, h);
          break;
        case 'jupiter-albedo':
          this.drawJupiterAlbedo(ctx, w, h);
          break;
        case 'saturn-albedo':
          this.drawSaturnAlbedo(ctx, w, h);
          break;
        case 'saturn-rings-albedo':
          return this.drawSaturnRings();
        case 'uranus-albedo':
          this.drawUranusAlbedo(ctx, w, h);
          break;
        case 'neptune-albedo':
          this.drawNeptuneAlbedo(ctx, w, h);
          break;
        case 'star-glow-albedo':
          return this.drawStarGlow();
        case 'nebula-gas-albedo':
          return this.drawNebulaGas();
        default:
          if (type === 'bump') {
            ctx.fillStyle = '#808080';
            ctx.fillRect(0, 0, w, h);
          } else if (type === 'roughness') {
            ctx.fillStyle = '#b0b0b0';
            ctx.fillRect(0, 0, w, h);
          } else {
            this.drawDefault(ctx, w, h);
          }
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      return texture;
    },

    drawSunAlbedo(ctx, w, h) {
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
          
          const val = fbm3D(px * 8, py * 8, pz * 8, 4);
          const idx = (y * w + x) * 4;
          
          data[idx] = Math.floor(239 + val * 16);
          data[idx+1] = Math.floor(68 + val * 172);
          data[idx+2] = Math.floor(68 + val * 40);
          data[idx+3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);
    },

    drawMercuryAlbedo(ctx, w, h) {
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
          
          const val = fbm3D(px * 12, py * 12, pz * 12, 4);
          const idx = (y * w + x) * 4;
          
          const col = Math.floor(51 + val * 80);
          data[idx] = col;
          data[idx+1] = col;
          data[idx+2] = col;
          data[idx+3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);
      this.drawCraters(ctx, w, h, 'rgba(55,65,81,0.65)', 'rgba(107,114,128,0.65)');
    },

    drawMercuryBump(ctx, w, h) {
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, w, h);
      
      for (let i = 0; i < 45; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const r = 3 + Math.random() * 12;
        
        ctx.fillStyle = 'rgba(60,60,60,0.85)';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(175,175,175,0.85)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    },

    drawVenusAlbedo(ctx, w, h) {
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
          
          const warp = fbm3D(px * 3.5, py * 3.5, pz * 3.5, 3);
          const val = fbm3D(px * 7 + warp * 2.2, py * 3, pz * 7, 4);
          
          const idx = (y * w + x) * 4;
          data[idx] = Math.floor(202 + val * 53);
          data[idx+1] = Math.floor(160 + val * 70);
          data[idx+2] = Math.floor(40 + val * 50);
          data[idx+3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);
    },

    drawEarthAlbedo(ctx, w, h) {
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
          
          const height = fbm3D(px * 4.5, py * 4.5, pz * 4.5, 6);
          const idx = (y * w + x) * 4;
          const absLat = Math.abs(lat);
          
          if (height > 0.465) {
            if (absLat > 1.25 || (absLat > 1.1 && height > 0.52)) {
              data[idx] = 245;
              data[idx+1] = 248;
              data[idx+2] = 250;
            } else {
              const grad = (height - 0.465) / 0.2;
              data[idx] = Math.floor(21 + grad * 120);
              data[idx+1] = Math.floor(128 - grad * 30);
              data[idx+2] = Math.floor(61 - grad * 30);
            }
          } else {
            if (absLat > 1.35) {
              data[idx] = 230;
              data[idx+1] = 240;
              data[idx+2] = 250;
            } else {
              const depth = height / 0.465;
              data[idx] = Math.floor(10 + depth * 20);
              data[idx+1] = Math.floor(50 + depth * 60);
              data[idx+2] = Math.floor(120 + depth * 110);
            }
          }
          data[idx+3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);
    },

    drawEarthBump(ctx, w, h) {
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
          
          const height = fbm3D(px * 4.5, py * 4.5, pz * 4.5, 6);
          const idx = (y * w + x) * 4;
          
          let bump = 128;
          if (height > 0.465) {
            bump = 128 + Math.floor((height - 0.465) * 420);
            bump = Math.min(255, bump);
          }
          data[idx] = bump;
          data[idx+1] = bump;
          data[idx+2] = bump;
          data[idx+3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);
    },

    drawEarthRoughness(ctx, w, h) {
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
          
          const height = fbm3D(px * 4.5, py * 4.5, pz * 4.5, 6);
          const idx = (y * w + x) * 4;
          
          let roughness = 30;
          if (height > 0.465) {
            roughness = 220;
          }
          data[idx] = roughness;
          data[idx+1] = roughness;
          data[idx+2] = roughness;
          data[idx+3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);
    },

    drawEarthClouds(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      const imgData = ctx.getImageData(0, 0, w, h);
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
          
          const cloudVal = fbm3D(px * 5.5, py * 5.5, pz * 5.5, 5);
          const idx = (y * w + x) * 4;
          
          let alpha = 0;
          if (cloudVal > 0.48) {
            alpha = Math.floor((cloudVal - 0.48) * 400);
            alpha = Math.min(180, alpha);
          }
          
          data[idx] = 255;
          data[idx+1] = 255;
          data[idx+2] = 255;
          data[idx+3] = alpha;
        }
      }
      ctx.putImageData(imgData, 0, 0);
    },

    drawMarsAlbedo(ctx, w, h) {
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
          
          const height = fbm3D(px * 4.2, py * 4.2, pz * 4.2, 5);
          const idx = (y * w + x) * 4;
          const absLat = Math.abs(lat);
          
          if (absLat > 1.34 || (absLat > 1.25 && height > 0.48)) {
            data[idx] = 255;
            data[idx+1] = 255;
            data[idx+2] = 255;
          } else {
            const ratio = Math.max(0, Math.min(1, (height - 0.3) / 0.4));
            data[idx] = Math.floor(180 - ratio * 100);
            data[idx+1] = Math.floor(65 - ratio * 40);
            data[idx+2] = Math.floor(20 - ratio * 15);
          }
          data[idx+3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);
    },

    drawMarsBump(ctx, w, h) {
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
          
          const height = fbm3D(px * 5, py * 5, pz * 5, 5);
          const idx = (y * w + x) * 4;
          
          const bump = Math.floor(128 + (height - 0.5) * 160);
          data[idx] = Math.max(0, Math.min(255, bump));
          data[idx+1] = data[idx];
          data[idx+2] = data[idx];
          data[idx+3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);
    },

    drawJupiterAlbedo(ctx, w, h) {
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
          
          const turb = fbm3D(px * 10, py * 22, pz * 10, 4) * 0.12;
          const latT = lat + turb;
          
          let r, g, b;
          const sVal = Math.sin(latT * 10) * 0.5 + 0.5;
          const fVal = fbm3D(px * 6, py * 4, pz * 6, 2) * 0.25;
          const mix = sVal + fVal;
          
          if (mix < 0.35) {
            r = 143; g = 110; b = 87;
          } else if (mix < 0.65) {
            r = 238; g = 218; b = 197;
          } else {
            r = 181; g = 124; b = 87;
          }
          
          const grsX = Math.cos(-0.38) * Math.cos(4.0);
          const grsY = Math.sin(-0.38);
          const grsZ = Math.cos(-0.38) * Math.sin(4.0);
          
          const distToGrs = Math.sqrt((px-grsX)*(px-grsX)*2.0 + (py-grsY)*(py-grsY)*5.0 + (pz-grsZ)*(pz-grsZ)*2.0);
          if (distToGrs < 0.16) {
            const intensity = (0.16 - distToGrs) / 0.16;
            const angle = Math.atan2(py - grsY, px - grsX);
            const spiral = Math.sin(angle * 3.0 + distToGrs * 30.0);
            
            r = Math.floor(190 * intensity + r * (1 - intensity));
            g = Math.floor((45 + spiral * 20) * intensity + g * (1 - intensity));
            b = Math.floor((15 + spiral * 10) * intensity + b * (1 - intensity));
          }
          
          const idx = (y * w + x) * 4;
          data[idx] = r;
          data[idx+1] = g;
          data[idx+2] = b;
          data[idx+3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);
    },

    drawSaturnAlbedo(ctx, w, h) {
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
          
          const turb = fbm3D(px * 8, py * 12, pz * 8, 3) * 0.05;
          const latT = lat + turb;
          
          const sVal = Math.sin(latT * 6) * 0.5 + 0.5;
          const r = Math.floor(215 - sVal * 45);
          const g = Math.floor(195 - sVal * 40);
          const b = Math.floor(155 - sVal * 45);
          
          const idx = (y * w + x) * 4;
          data[idx] = r;
          data[idx+1] = g;
          data[idx+2] = b;
          data[idx+3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);
    },

    drawSaturnRings() {
      const canvas = document.createElement('canvas');
      canvas.width = 2048; // Extremely high resolution!
      canvas.height = 128; // Large height for butter-smooth oblique mipmap filtering
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      
      const imgData = ctx.createImageData(w, h);
      const data = imgData.data;
      
      for (let x = 0; x < w; x++) {
        const rRatio = x / w;
        let alpha = 0.0;
        let r = 225, g = 205, b = 175; // beautiful realistic creamy color
        
        if (rRatio > 0.1 && rRatio < 0.95) {
          alpha = 0.85;
          if (rRatio > 0.65 && rRatio < 0.70) {
            // Cassini Division
            alpha = 0.02;
          } else if (rRatio > 0.82 && rRatio < 0.84) {
            // Encke Gap
            alpha = 0.1;
          } else {
            // Organic, realistic high-frequency ring bands using composite sine waves
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
        
        // Fill all vertical rows identically
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
      texture.minFilter = THREE.LinearMipmapLinearFilter; // Butter-smooth trilinear filtering
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = true;
      return texture;
    },

    drawUranusAlbedo(ctx, w, h) {
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
          
          const noiseVal = fbm3D(px * 4, py * 8, pz * 4, 3) * 0.15;
          const idx = (y * w + x) * 4;
          
          data[idx] = Math.floor(30 + noiseVal * 60);
          data[idx+1] = Math.floor(140 + noiseVal * 80);
          data[idx+2] = Math.floor(180 + noiseVal * 60);
          data[idx+3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);
    },

    drawNeptuneAlbedo(ctx, w, h) {
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
          
          const noiseVal = fbm3D(px * 5, py * 10, pz * 5, 4) * 0.2;
          const idx = (y * w + x) * 4;
          
          let r = Math.floor(25 + noiseVal * 40);
          let g = Math.floor(60 + noiseVal * 70);
          let b = Math.floor(160 + noiseVal * 80);
          
          const spotX = Math.cos(-0.35) * Math.cos(3.0);
          const spotY = Math.sin(-0.35);
          const spotZ = Math.cos(-0.35) * Math.sin(3.0);
          const distToSpot = Math.sqrt((px-spotX)*(px-spotX) + (py-spotY)*(py-spotY)*2.0 + (pz-spotZ)*(pz-spotZ));
          if (distToSpot < 0.18) {
            const factor = (0.18 - distToSpot) / 0.18;
            r = Math.floor(r * (1 - factor * 0.5));
            g = Math.floor(g * (1 - factor * 0.5));
            b = Math.floor(b * (1 - factor * 0.4));
          }
          
          data[idx] = r;
          data[idx+1] = g;
          data[idx+2] = b;
          data[idx+3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);
    },

    drawCraters(ctx, w, h, darkColor, lightColor) {
      for (let i = 0; i < 45; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const r = 3 + Math.random() * 11;
        ctx.fillStyle = darkColor;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = lightColor;
        ctx.beginPath();
        ctx.arc(x + r*0.2, y + r*0.2, r * 0.9, 0, Math.PI * 2);
        ctx.fill();
      }
    },

    drawStarGlow() {
      const canvas = document.createElement('canvas');
      canvas.width = 256; // High performance, gorgeous feathered volumetric rays
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      const cx = 128;
      const cy = 128;
      
      // 1. Soft radial base glow
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
      grad.addColorStop(0.12, 'rgba(255, 245, 220, 0.95)');
      grad.addColorStop(0.35, 'rgba(255, 175, 45, 0.45)');
      grad.addColorStop(0.65, 'rgba(255, 80, 10, 0.12)');
      grad.addColorStop(1, 'rgba(255, 50, 0, 0.0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
      
      // Set a soft blur filter to make rays look cinematic and atmospheric
      ctx.filter = 'blur(6px)';
      
      // 2. Volumetric Solar Rays (shafts of light extending dynamically)
      const numRays = 24;
      ctx.save();
      ctx.translate(cx, cy);
      
      for (let i = 0; i < numRays; i++) {
        const angle = (i / numRays) * Math.PI * 2 + Math.sin(i * 3.7) * 0.1;
        const length = 45 + Math.abs(Math.sin(i * 12.3)) * 40;
        const width = 0.15 + Math.abs(Math.cos(i * 7.4)) * 0.10; // feathered, wider sectors
        
        const rayGrad = ctx.createLinearGradient(0, 0, 0, length);
        rayGrad.addColorStop(0, 'rgba(255, 255, 255, 0.40)');
        rayGrad.addColorStop(0.2, 'rgba(255, 215, 100, 0.25)');
        rayGrad.addColorStop(0.6, 'rgba(255, 100, 20, 0.08)');
        rayGrad.addColorStop(1, 'rgba(255, 50, 0, 0.0)');
        
        ctx.fillStyle = rayGrad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        const xLeft = Math.cos(angle - width) * length;
        const yLeft = Math.sin(angle - width) * length;
        const xRight = Math.cos(angle + width) * length;
        const yRight = Math.sin(angle + width) * length;
        ctx.lineTo(xLeft, yLeft);
        ctx.lineTo(xRight, yRight);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      
      const texture = new THREE.CanvasTexture(canvas);
      return texture;
    },

    drawNebulaGas() {
      const canvas = document.createElement('canvas');
      canvas.width = 256; // Increase resolution to 256 for smooth wispy gas clouds without blocky artifacts
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      const halfW = w / 2;
      
      const imgData = ctx.createImageData(w, h);
      const data = imgData.data;
      for (let y = 0; y < h; y++) {
        const dy = y - halfW;
        for (let x = 0; x < w; x++) {
          const dx = x - halfW;
          const dist = Math.sqrt(dx*dx + dy*dy) / halfW;
          const idx = (y * w + x) * 4;
          
          if (dist >= 1.0) {
            data[idx] = 255;
            data[idx+1] = 255;
            data[idx+2] = 255;
            data[idx+3] = 0;
          } else {
            let alpha = Math.pow(1.0 - dist, 1.8);
            
            const angle = Math.atan2(dy, dx);
            const noiseVal = fbm3D(dx * 0.03, dy * 0.03, Math.sin(angle) * 3.5, 3);
            alpha *= (0.3 + noiseVal * 0.9);
            alpha = Math.max(0, Math.min(1.0, alpha));
            
            data[idx] = 255;
            data[idx+1] = 255;
            data[idx+2] = 255;
            data[idx+3] = Math.floor(alpha * 255);
          }
        }
      }
      ctx.putImageData(imgData, 0, 0);
      const texture = new THREE.CanvasTexture(canvas);
      return texture;
    },

    drawDefault(ctx, w, h) {
      ctx.fillStyle = '#374151';
      ctx.fillRect(0, 0, w, h);
    }
  };

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
    cameraTargetPos: new THREE.Vector3(0, 100, 300),
    controlsTargetPos: new THREE.Vector3(0, 0, 0),
    isGliding: false,
    
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

    constellations: [
      { name: 'Orion', stars: [[0,50,0], [30,80,20], [-30,80,-20], [0,20,10], [40,30,30], [-40,30,-30], [0,-20,0]], color: 0x00d4ff, brightest: 'Rigel' },
      { name: 'Ursa Major', stars: [[60,60,40], [80,70,50], [100,60,40], [110,50,30], [100,40,20], [80,35,15], [70,45,25]], color: 0xffd700, brightest: 'Alioth' },
      { name: 'Cassiopeia', stars: [[-60,80,60], [-40,90,70], [-20,85,65], [0,90,70], [20,80,60]], color: 0xff6b9d, brightest: 'Schedar' },
      { name: 'Scorpius', stars: [[50,-40,30], [40,-50,20], [30,-60,10], [20,-70,0], [10,-75,-10], [0,-70,-20], [-10,-60,-25]], color: 0xe27b58, brightest: 'Antares' },
      { name: 'Cygnus', stars: [[0,70,80], [20,60,90], [0,50,100], [-20,60,90], [0,40,110]], color: 0x4a90e2, brightest: 'Deneb' },
      { name: 'Leo', stars: [[-50,40,50], [-30,50,60], [-10,45,55], [10,40,50], [20,30,40], [10,20,30]], color: 0xffc649, brightest: 'Regulus' }
    ],
    
    init() {
      const container = document.getElementById('space-gallery-3d');
      if (!container) return;
      
      // Scene
      this.scene = new THREE.Scene();
      this.scene.fog = new THREE.FogExp2(0x000208, 0.0003);
      
      // Weather system
      this.weatherParticles = null;
      this.currentWeather = 'clear'; // clear, rain, snow, cloudy
      this.userLocation = null;
      this.getUserLocationAndWeather();
      
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
      this.renderer.toneMappingExposure = 2.5;
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(this.renderer.domElement);
      
      // Orbit Controls for 3D rotation
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.minDistance = 50;
      this.controls.maxDistance = 800;
      this.controls.autoRotate = true;
      this.controls.autoRotateSpeed = 0.5;
      
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
      this.addReferencePoint();
      this.addGridHelper();
      
      if (tab === 'solar') {
        this.createSolarSystem();
      } else if (tab === 'stars') {
        this.createStars();
      } else if (tab === 'constellations') {
        this.createConstellations();
      } else {
        this.createNebulae();
      }
      
      this.updateObjectsList();
      this.updateHUD();
    },

    addGridHelper() {
      const gridHelper = new THREE.GridHelper(1000, 50, 0x00d4ff, 0x002244);
      gridHelper.position.y = -50;
      gridHelper.material.opacity = 0.25;
      gridHelper.material.transparent = true;
      gridHelper.material.depthWrite = false;
      this.scene.add(gridHelper);
    },
    
    getUserLocationAndWeather() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            this.userLocation = {
              lat: position.coords.latitude,
              lon: position.coords.longitude
            };
            this.fetchWeather();
          },
          (error) => {
            this.setDefaultWeather();
          }
        );
      } else {
        this.setDefaultWeather();
      }
    },
    
    async fetchWeather() {
      try {
        const lat = Math.round(this.userLocation.lat * 10) / 10;
        const lon = Math.round(this.userLocation.lon * 10) / 10;
        const cacheKey = `weather_cache_${lat}_${lon}`;
        const cachedData = localStorage.getItem(cacheKey);

        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          const now = Date.now();
          // Cache valid for 30 minutes
          if (now - parsed.timestamp < 30 * 60 * 1000) {
            console.log('Using cached weather data');
            this.applyWeatherCode(parsed.weather_code);
            return;
          }
        }

        // Using Open-Meteo API (free, no API key needed)
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${this.userLocation.lat}&longitude=${this.userLocation.lon}&current=temperature_2m,weather_code&timezone=auto`;
        const response = await fetch(url);
        const data = await response.json();
        
        // Weather codes: 0=clear, 1-3=cloudy, 45-48=fog, 51-67=rain, 71-77=snow, 80-99=rain/thunderstorm
        const code = data.current.weather_code;
        
        // Cache the result
        localStorage.setItem(cacheKey, JSON.stringify({
          weather_code: code,
          timestamp: Date.now()
        }));

        this.applyWeatherCode(code);
      } catch (error) {
        console.error('Weather fetch failed:', error);
        this.setDefaultWeather();
      }
    },

    applyWeatherCode(code) {
      if (code === 0) {
        this.currentWeather = 'clear';
      } else if (code >= 1 && code <= 3) {
        this.currentWeather = 'cloudy';
      } else if (code >= 51 && code <= 67 || code >= 80 && code <= 99) {
        this.currentWeather = 'rain';
      } else if (code >= 71 && code <= 77) {
        this.currentWeather = 'snow';
      } else {
        this.currentWeather = 'cloudy';
      }

      this.addWeatherEffect();
    },
    
    setDefaultWeather() {
      const hour = new Date().getHours();
      if (hour >= 6 && hour < 18) {
        this.currentWeather = 'clear';
      } else {
        this.currentWeather = Math.random() > 0.5 ? 'rain' : 'snow';
      }
      this.addWeatherEffect();
    },
    
    checkWeather() {
      // Simple weather detection based on time
      const hour = new Date().getHours();
      if (hour >= 6 && hour < 18) {
        this.currentWeather = 'clear';
      } else if (Math.random() > 0.5) {
        this.currentWeather = 'rain';
      } else {
        this.currentWeather = 'snow';
      }
      this.addWeatherEffect();
    },
    
    addWeatherEffect() {
      if (this.weatherParticles) {
        this.scene.remove(this.weatherParticles);
        this.weatherParticles.geometry.dispose();
        this.weatherParticles.material.dispose();
        this.weatherParticles = null;
      }
      
      if (this.currentWeather === 'clear') {
        this.updateWeatherUI();
        return;
      }
      
      const particleCount = this.currentWeather === 'cloudy' ? 500 : 1000;
      const geometry = new THREE.BufferGeometry();
      const positions = [];
      
      for (let i = 0; i < particleCount; i++) {
        positions.push(
          (Math.random() - 0.5) * 1000,
          Math.random() * 500,
          (Math.random() - 0.5) * 1000
        );
      }
      
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      
      let vy = -0.75;
      if (this.currentWeather === 'cloudy') vy = -0.15;
      else if (this.currentWeather === 'rain') vy = -3.0;

      const material = new THREE.PointsMaterial({
        size: this.currentWeather === 'rain' ? 1.5 : this.currentWeather === 'cloudy' ? 6 : 4,
        color: this.currentWeather === 'rain' ? 0x4A90E2 : this.currentWeather === 'cloudy' ? 0x666666 : 0xFFFFFF,
        transparent: true,
        opacity: this.currentWeather === 'rain' ? 0.6 : this.currentWeather === 'cloudy' ? 0.25 : 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      
      material.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = { value: 0 };
        shader.uniforms.uSpeed = { value: vy };
        shader.uniforms.uRangeY = { value: 550.0 };
        shader.uniforms.uStartY = { value: 500.0 };

        material.userData.shader = shader;

        shader.vertexShader = 'uniform float uTime;\nuniform float uSpeed;\nuniform float uRangeY;\nuniform float uStartY;\n' + shader.vertexShader;

        shader.vertexShader = shader.vertexShader.replace(
          '#include <begin_vertex>',
          `
          vec3 transformed = vec3( position );
          float traveled = uSpeed * uTime;
          float newY = position.y + traveled;

          float distFromTop = uStartY - newY;
          float lap = floor(distFromTop / uRangeY);

          transformed.y = uStartY - mod(distFromTop, uRangeY);

          if (lap > 0.0) {
            vec2 seed = position.xz + vec2(lap * 17.3, lap * 9.1);
            float randX = fract(sin(dot(seed, vec2(12.9898, 78.233))) * 43758.5453);
            float randZ = fract(sin(dot(seed, vec2(39.7867, 27.345))) * 23456.7891);
            transformed.x = (randX - 0.5) * 1000.0;
            transformed.z = (randZ - 0.5) * 1000.0;
          }
          `
        );
      };
      
      this.weatherParticles = new THREE.Points(geometry, material);
      this.scene.add(this.weatherParticles);
      
      this.updateWeatherUI();
    },
    
    updateWeatherUI() {
      const indicator = document.getElementById('weather-indicator');
      if (indicator) {
        const icons = { 
          clear: '☀️ Clear', 
          rain: '🌧️ Rain', 
          snow: '❄️ Snow',
          cloudy: '☁️ Cloudy'
        };
        indicator.textContent = icons[this.currentWeather];
        
        if (this.userLocation) {
          indicator.title = `Weather at ${this.userLocation.lat.toFixed(2)}°, ${this.userLocation.lon.toFixed(2)}°`;
        }
      }
    },
    
    addReferencePoint() {
      // Add Earth as reference point (Your Location) with highly realistic procedural textures
      const earthGeometry = new THREE.SphereGeometry(8, 32, 32);
      const earthTexture = TextureGenerator.generate('earth', 'albedo');
      const earthBump = TextureGenerator.generate('earth', 'bump');
      const earthRoughness = TextureGenerator.generate('earth', 'roughness');
      
      const earthMaterial = new THREE.MeshStandardMaterial({
        map: earthTexture,
        bumpMap: earthBump,
        bumpScale: 0.85,
        roughnessMap: earthRoughness,
        metalness: 0.12,
        roughness: 0.8,
        emissive: 0x4A90E2,
        emissiveIntensity: 0.05
      });
      const earth = new THREE.Mesh(earthGeometry, earthMaterial);
      earth.position.set(0, 0, 0);
      earth.castShadow = true;
      earth.receiveShadow = true;
      
      // Clouds Layer
      const cloudGeo = new THREE.SphereGeometry(8.2, 32, 32);
      const cloudTex = TextureGenerator.generate('earth-clouds', 'albedo');
      const cloudMat = new THREE.MeshStandardMaterial({
        map: cloudTex,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        blending: THREE.NormalBlending
      });
      const clouds = new THREE.Mesh(cloudGeo, cloudMat);
      earth.add(clouds);
      earth.userData.clouds = clouds; // Reference to rotate in render loop
      
      // Brighter atmosphere glow
      const glowGeometry = new THREE.SphereGeometry(10.2, 24, 24);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x00d4ff,
        transparent: true,
        opacity: 0.45,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      earth.add(glow);
      
      // Larger, brighter label
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      
      // Background for better visibility
      ctx.fillStyle = 'rgba(0, 5, 16, 0.85)';
      ctx.fillRect(0, 0, 512, 128);
      
      // Border
      ctx.strokeStyle = '#00d4ff';
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, 508, 124);
      
      // Text
      ctx.fillStyle = '#00d4ff';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🌍 YOUR LOCATION', 256, 80);
      
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ 
        map: texture, 
        transparent: true,
        depthTest: false
      });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.set(0, 20, 0);
      sprite.scale.set(60, 15, 1);
      earth.add(sprite);
      
      earth.userData = {
        id: 'your-location',
        name: 'Your Location',
        type: 'Earth Reference',
        radius: 8,
        temp: '15°C',
        mass: '5.97e24 kg',
        moons: 1,
        distance: 0,
        description: 'Your actual location on Earth, synchronized with your browser telemetry.'
      };
      
      this.scene.add(earth);
      this.referenceEarth = earth;
      this.objects.push(earth);
    },
    
    clearScene() {
      const disposeObject = (obj) => {
        while (obj.children.length > 0) {
          const child = obj.children[0];
          obj.remove(child);
          disposeObject(child);
        }
        if (obj.geometry) {
          obj.geometry.dispose();
        }
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => {
              if (m.map) m.map.dispose();
              m.dispose();
            });
          } else {
            if (obj.material.map) obj.material.map.dispose();
            obj.material.dispose();
          }
        }
      };

      while (this.scene.children.length > 0) {
        const obj = this.scene.children[0];
        this.scene.remove(obj);
        disposeObject(obj);
      }
      
      this.objects = [];
      this.referenceEarth = null;
      this.selectedObj = null;
      const alpineEl = document.body;
      if (alpineEl && alpineEl.__x__ && alpineEl.__x__.$data) {
        alpineEl.__x__.$data.selectedObject = null;
      }
    },
    
    setupLighting() {
      // Very bright ambient light
      const ambient = new THREE.AmbientLight(0xffffff, 1.5);
      this.scene.add(ambient);
      
      if (this.currentTab === 'solar') {
        // Bright sun light
        const sunLight = new THREE.PointLight(0xFFD700, 4, 800);
        sunLight.position.set(0, 0, 0);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 1024;
        sunLight.shadow.mapSize.height = 1024;
        this.scene.add(sunLight);
      } else {
        // Very bright three-point lighting
        const keyLight = new THREE.DirectionalLight(0xffffff, 3);
        keyLight.position.set(100, 100, 100);
        keyLight.castShadow = true;
        this.scene.add(keyLight);
        
        const fillLight = new THREE.DirectionalLight(0xffffff, 2);
        fillLight.position.set(-80, 40, 60);
        this.scene.add(fillLight);
        
        const rimLight = new THREE.DirectionalLight(0xffffff, 1.5);
        rimLight.position.set(60, -30, -80);
        this.scene.add(rimLight);
      }
    },
    
    createSolarSystem() {
      this.solarSystem.forEach((data, i) => {
        if (data.name === 'Sun') {
          const geometry = new THREE.SphereGeometry(data.radius, 48, 48);
          const texture = TextureGenerator.generate('sun', 'albedo');
          const material = new THREE.MeshBasicMaterial({ 
            map: texture
          });
          const sun = new THREE.Mesh(geometry, material);
          sun.userData = { ...data, id: i };
          this.scene.add(sun);
          this.objects.push(sun);
          
          const glowTexture = TextureGenerator.generate('star-glow', 'albedo');
          const glowMaterial = new THREE.SpriteMaterial({
            map: glowTexture,
            color: data.color,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
          });
          const glow = new THREE.Sprite(glowMaterial);
          glow.scale.set(data.radius * 2.2, data.radius * 2.2, 1);
          glow.name = 'sunCoronaRay';
          sun.add(glow);
        } else {
          const geometry = new THREE.SphereGeometry(data.radius, 48, 48);
          const texture = TextureGenerator.generate(data.name, 'albedo');
          
          const matParams = {
            map: texture,
            emissive: data.color,
            emissiveIntensity: 0.02
          };

          if (data.name === 'Earth' || data.name === 'Mars' || data.name === 'Mercury') {
            matParams.bumpMap = TextureGenerator.generate(data.name, 'bump');
            matParams.bumpScale = data.name === 'Earth' ? 0.85 : data.name === 'Mars' ? 0.45 : 0.35;
          }

          if (data.name === 'Earth') {
            matParams.roughnessMap = TextureGenerator.generate(data.name, 'roughness');
            matParams.metalness = 0.12;
          } else {
            matParams.roughness = (data.name === 'Venus' || data.name === 'Jupiter' || data.name === 'Saturn') ? 0.95 : 0.8;
            matParams.metalness = 0.0;
          }

          const material = new THREE.MeshStandardMaterial(matParams);
          const planet = new THREE.Mesh(geometry, material);
          planet.castShadow = true;
          planet.receiveShadow = true;
          
          const angle = Math.random() * Math.PI * 2;
          planet.position.x = Math.cos(angle) * data.distance;
          planet.position.z = Math.sin(angle) * data.distance;
          planet.userData = { ...data, id: i, angle };
          
          if (data.name === 'Earth') {
            const cloudGeo = new THREE.SphereGeometry(data.radius + 0.2, 48, 48);
            const cloudTex = TextureGenerator.generate('earth-clouds', 'albedo');
            const cloudMat = new THREE.MeshStandardMaterial({
              map: cloudTex,
              transparent: true,
              opacity: 0.5,
              depthWrite: false,
              blending: THREE.NormalBlending
            });
            const clouds = new THREE.Mesh(cloudGeo, cloudMat);
            planet.add(clouds);
            planet.userData.clouds = clouds;
          }
          
          this.scene.add(planet);
          this.objects.push(planet);
          
          if (data.rings) {
            const ringGeometry = new THREE.RingGeometry(data.radius * 1.4, data.radius * 2.4, 64);
            const posAttr = ringGeometry.attributes.position;
            const uvAttr = ringGeometry.attributes.uv;
            const innerR = data.radius * 1.4;
            const outerR = data.radius * 2.4;
            
            for (let j = 0; j < posAttr.count; j++) {
              const x = posAttr.getX(j);
              const y = posAttr.getY(j);
              const r = Math.sqrt(x*x + y*y);
              const u = (r - innerR) / (outerR - innerR);
              uvAttr.setXY(j, u, 0.5);
            }
            uvAttr.needsUpdate = true;
 
            const ringTex = TextureGenerator.generate('saturn-rings', 'albedo');
            const ringMaterial = new THREE.MeshStandardMaterial({
              map: ringTex,
              transparent: true,
              opacity: 0.85,
              side: THREE.DoubleSide,
              roughness: 0.6,
              metalness: 0.1
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = Math.PI / 2.2;
            planet.add(ring);
          }
          
          const orbitGeometry = new THREE.RingGeometry(data.distance - 0.5, data.distance + 0.5, 128);
          const orbitMaterial = new THREE.MeshBasicMaterial({
            color: 0x00d4ff,
            transparent: true,
            opacity: 0.15,
            side: THREE.DoubleSide
          });
          const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
          orbit.rotation.x = Math.PI / 2;
          this.scene.add(orbit);
        }
      });
    },
    
    createStars() {
      const glowTexture = TextureGenerator.generate('star-glow');
      this.nearbyStars.forEach((data, i) => {
        const geometry = new THREE.SphereGeometry(data.radius, 32, 32);
        const material = new THREE.MeshBasicMaterial({ 
          color: data.color
        });
        const star = new THREE.Mesh(geometry, material);
        star.castShadow = true;
        
        const angle = Math.random() * Math.PI * 2;
        const height = (Math.random() - 0.5) * 200;
        const distance = 100 + Math.random() * 200;
        star.position.set(
          Math.cos(angle) * distance,
          height,
          Math.sin(angle) * distance
        );
        star.userData = { ...data, id: i };
        
        const glowMaterial = new THREE.SpriteMaterial({
          map: glowTexture,
          color: data.color,
          transparent: true,
          opacity: 0.8,
          blending: THREE.AdditiveBlending
        });
        const glow = new THREE.Sprite(glowMaterial);
        glow.scale.set(data.radius * 4.5, data.radius * 4.5, 1);
        star.add(glow);
        
        if (data.radius > 10) {
          const light = new THREE.PointLight(data.color, 0.5, 100);
          star.add(light);
        }
        
        this.scene.add(star);
        this.objects.push(star);
      });
    },

    generateNebulaGeometry(name, radius, colorHex) {
      const positions = [];
      const colors = [];
      const particleCount = 5000;
      const color = new THREE.Color(colorHex);
      
      switch(name.toLowerCase()) {
        case 'ring nebula': {
          const colorInner = new THREE.Color(0x00ffcc);
          const colorOuter = new THREE.Color(0xff2255);
          for (let j = 0; j < particleCount; j++) {
            const u = Math.random() * Math.PI * 2;
            const v = Math.random() * Math.PI * 2;
            const rRing = radius * 0.7;
            const rTube = radius * 0.3 * (0.6 + Math.random() * 0.4);
            
            let x = (rRing + rTube * Math.cos(v)) * Math.cos(u);
            let z = (rRing + rTube * Math.cos(v)) * Math.sin(u);
            let y = rTube * Math.sin(v);
            
            const ox = (fbm3D(x * 0.1, y * 0.1, z * 0.1, 3) - 0.5) * (radius * 0.3);
            const oy = (fbm3D(y * 0.1, z * 0.1, x * 0.1, 3) - 0.5) * (radius * 0.3);
            const oz = (fbm3D(z * 0.1, x * 0.1, y * 0.1, 3) - 0.5) * (radius * 0.3);
            
            x += ox;
            y += oy;
            z += oz;
            
            positions.push(x, y, z);
            const dist = Math.sqrt(x*x + z*z);
            const ratio = Math.min(1.0, Math.max(0.0, (dist - (rRing - rTube)) / (rTube * 2.5)));
            const pColor = new THREE.Color().lerpColors(colorInner, colorOuter, ratio);
            colors.push(pColor.r, pColor.g, pColor.b);
          }
          break;
        }
        case 'eagle nebula': {
          const baseColor = new THREE.Color(0xd97706);
          const tipColor = new THREE.Color(0xec4899);
          for (let j = 0; j < particleCount; j++) {
            const pillar = Math.floor(Math.random() * 3);
            let px = 0, py = 0, pz = 0;
            let height = 0;
            let maxH = 0;
            if (pillar === 0) {
              px = -14 + (Math.random() - 0.5) * 8;
              maxH = radius * 1.3;
              height = (Math.random() - 0.35) * maxH;
              py = height;
              pz = (Math.random() - 0.5) * 8;
            } else if (pillar === 1) {
              px = 0 + (Math.random() - 0.5) * 7;
              maxH = radius * 0.85;
              height = (Math.random() - 0.45) * maxH;
              py = height - radius * 0.15;
              pz = (Math.random() - 0.5) * 7;
            } else {
              px = 14 + (Math.random() - 0.5) * 6;
              maxH = radius * 0.55;
              height = (Math.random() - 0.55) * maxH;
              py = height - radius * 0.35;
              pz = (Math.random() - 0.5) * 6;
            }
            
            const taper = 1.0 - (height / maxH);
            const thick = radius * 0.18 * taper + 2.0;
            
            const ox = (fbm3D(px * 0.12, py * 0.12, pz * 0.12, 3) - 0.5) * thick;
            const oy = (fbm3D(py * 0.12, pz * 0.12, px * 0.12, 3) - 0.5) * thick;
            const oz = (fbm3D(pz * 0.12, px * 0.12, py * 0.12, 3) - 0.5) * thick;
            
            px += ox;
            py += oy;
            pz += oz;
            
            positions.push(px, py, pz);
            const ratio = Math.min(1.0, Math.max(0.0, height / maxH));
            const pColor = new THREE.Color().lerpColors(baseColor, tipColor, ratio);
            colors.push(pColor.r, pColor.g, pColor.b);
          }
          break;
        }
        case 'crab nebula': {
          const innerColor = new THREE.Color(0x00f3ff);
          const outerColor = new THREE.Color(0xff4500);
          for (let j = 0; j < particleCount; j++) {
            let x = 0, y = 0, z = 0;
            let ratio = 0;
            
            if (Math.random() < 0.22) {
              const theta = Math.random() * Math.PI * 2;
              const phi = Math.random() * Math.PI;
              const length = radius * (0.2 + Math.random() * 0.95);
              x = length * Math.sin(phi) * Math.cos(theta);
              z = length * Math.sin(phi) * Math.sin(theta);
              y = length * Math.cos(phi) * 1.35;
              
              const ox = (fbm3D(x * 0.25, y * 0.25, z * 0.25, 4) - 0.5) * 5;
              const oy = (fbm3D(y * 0.25, z * 0.25, x * 0.25, 4) - 0.5) * 5;
              const oz = (fbm3D(z * 0.25, x * 0.25, y * 0.25, 4) - 0.5) * 5;
              x += ox;
              y += oy;
              z += oz;
              ratio = length / (radius * 1.35);
            } else {
              const theta = Math.random() * Math.PI * 2;
              const phi = Math.random() * Math.PI;
              const deformation = 1.0 + 0.3 * Math.sin(12 * theta) * Math.cos(8 * phi);
              const r = radius * 0.7 * deformation * (0.75 + Math.random() * 0.25);
              x = r * Math.sin(phi) * Math.cos(theta);
              z = r * Math.sin(phi) * Math.sin(theta);
              y = r * Math.cos(phi) * 1.25;
              ratio = r / (radius * 1.3);
            }
            
            positions.push(x, y, z);
            const pColor = new THREE.Color().lerpColors(innerColor, outerColor, ratio);
            colors.push(pColor.r, pColor.g, pColor.b);
          }
          break;
        }
        case 'orion nebula': {
          const magenta = new THREE.Color(0xff00aa);
          const cyan = new THREE.Color(0x00ffff);
          for (let j = 0; j < particleCount; j++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const lobe = 0.3 + 0.7 * Math.pow(Math.abs(Math.sin(theta) * Math.sin(phi)), 1.5);
            
            const rBase = radius * lobe;
            const noiseFactor = fbm3D(Math.sin(phi)*Math.cos(theta)*3.5, Math.cos(phi)*3.5, Math.sin(phi)*Math.sin(theta)*3.5, 3);
            const r = rBase * (0.35 + noiseFactor * 1.2);
            
            let x = r * Math.sin(phi) * Math.cos(theta) * 1.6;
            let z = r * Math.sin(phi) * Math.sin(theta);
            let y = r * Math.cos(phi);
            
            const ox = (fbm3D(x * 0.08, y * 0.08, z * 0.08, 3) - 0.5) * (radius * 0.3);
            const oy = (fbm3D(y * 0.08, z * 0.08, x * 0.08, 3) - 0.5) * (radius * 0.3);
            const oz = (fbm3D(z * 0.08, x * 0.08, y * 0.08, 3) - 0.5) * (radius * 0.3);
            
            x += ox;
            y += oy;
            z += oz;
            
            positions.push(x, y, z);
            const pColor = (Math.sin(theta * 2) > 0) ? magenta.clone() : cyan.clone();
            pColor.r += (Math.random() - 0.5) * 0.12;
            pColor.g += (Math.random() - 0.5) * 0.12;
            pColor.b += (Math.random() - 0.5) * 0.12;
            colors.push(pColor.r, pColor.g, pColor.b);
          }
          break;
        }
        case 'helix nebula': {
          const colorInner = new THREE.Color(0x00ffcc);
          const colorOuter = new THREE.Color(0x9030ff);
          for (let j = 0; j < particleCount; j++) {
            const angle = Math.random() * Math.PI * 2;
            const isRadialKnot = Math.random() < 0.25;
            let x = 0, y = 0, z = 0;
            let ringSelect = Math.random() > 0.5 ? 0 : 1;
            
            if (isRadialKnot) {
              const r = radius * (0.35 + Math.random() * 0.9);
              x = Math.cos(angle) * r;
              z = Math.sin(angle) * r;
              y = (Math.random() - 0.5) * 4 + (ringSelect === 0 ? -2.5 : 2.5) * Math.sin(angle);
              
              const ox = (fbm3D(x * 0.15, y * 0.15, z * 0.15, 3) - 0.5) * 2;
              const oy = (fbm3D(y * 0.15, z * 0.15, x * 0.15, 3) - 0.5) * 2;
              const oz = (fbm3D(z * 0.15, x * 0.15, y * 0.15, 3) - 0.5) * 2;
              x += ox; y += oy; z += oz;
            } else {
              const r = radius * (0.65 + 0.32 * ringSelect) + (Math.random() - 0.5) * 3;
              x = Math.cos(angle) * r;
              z = Math.sin(angle) * r;
              y = (Math.random() - 0.5) * 5 + (ringSelect === 0 ? -2 : 2) * Math.sin(angle);
            }
            
            positions.push(x, y, z);
            const pColor = new THREE.Color().lerpColors(colorInner, colorOuter, ringSelect);
            colors.push(pColor.r, pColor.g, pColor.b);
          }
          break;
        }
        case 'horsehead nebula': {
          const pink = new THREE.Color(0xff4b9f);
          for (let j = 0; j < particleCount; j++) {
            const isBackground = Math.random() > 0.4;
            if (isBackground) {
              const x = (Math.random() - 0.5) * radius * 2.8;
              const y = (Math.random() - 0.5) * radius * 2.2;
              const z = -16.0 + (Math.random() - 0.5) * 4.0;
              
              const intensity = fbm3D(x * 0.08, y * 0.08, z * 0.08, 4);
              positions.push(x, y, z);
              colors.push(
                pink.r * (0.55 + intensity * 0.45),
                pink.g * (0.35 + intensity * 0.65),
                pink.b * (0.55 + intensity * 0.45)
              );
            } else {
              let px = (Math.random() - 0.5) * radius * 1.5;
              let py = (Math.random() - 0.5) * radius * 1.5;
              let pz = -4.0 + (Math.random() - 0.5) * 3.5;
              
              const ny = py / (radius * 0.65);
              let minX = -999, maxX = -999;
              
              if (ny > 0.6) {
                minX = -13;
                maxX = -1 + (1.0 - ny) * 12;
              } else if (ny > 0.15) {
                minX = -17 + (ny - 0.15) * 10;
                maxX = 3 + (ny - 0.15) * 6;
              } else if (ny > -0.45) {
                minX = -14 - (ny + 0.45) * 5;
                maxX = 5 + (ny + 0.45) * 5;
              } else {
                minX = -20 + (ny + 1.0) * 12;
                maxX = 10 + (ny + 1.0) * 12;
              }
              
              const edgeNoise = (fbm3D(px * 0.25, py * 0.25, pz * 0.25, 3) - 0.5) * 3.0;
              if (px >= minX + edgeNoise && px <= maxX + edgeNoise) {
                positions.push(px, py, pz);
                colors.push(0.04, 0.035, 0.045);
              } else {
                positions.push(px, py, -16.0);
                colors.push(pink.r * 0.6, pink.g * 0.4, pink.b * 0.6);
              }
            }
          }
          break;
        }
        default: {
          for (let j = 0; j < particleCount; j++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const r = Math.random() * radius;
            positions.push(
              r * Math.sin(phi) * Math.cos(theta),
              r * Math.sin(phi) * Math.sin(theta),
              r * Math.cos(phi)
            );
            colors.push(color.r, color.g, color.b);
          }
        }
      }
      
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      return geometry;
    },

    createNebulae() {
      this.nebulae.forEach((data, i) => {
        const geometry = this.generateNebulaGeometry(data.name, data.radius, data.color);
        const particleTexture = TextureGenerator.generate('nebula-gas', 'albedo');
        const isHorsehead = data.name.toLowerCase() === 'horsehead nebula';
        
        const material = new THREE.PointsMaterial({
          size: data.radius * 0.26,
          map: particleTexture,
          vertexColors: true,
          transparent: true,
          opacity: isHorsehead ? 0.95 : 0.65,
          blending: isHorsehead ? THREE.NormalBlending : THREE.AdditiveBlending,
          depthWrite: false
        });
        
        const nebula = new THREE.Points(geometry, material);
        
        const angle = Math.random() * Math.PI * 2;
        const height = (Math.random() - 0.5) * 150;
        const distance = 150 + Math.random() * 200;
        nebula.position.set(
          Math.cos(angle) * distance,
          height,
          Math.sin(angle) * distance
        );
        nebula.userData = { ...data, id: i };
        
        const coreGeometry = new THREE.SphereGeometry(data.radius * 0.15, 24, 24);
        const coreMaterial = new THREE.MeshStandardMaterial({
          color: data.color,
          emissive: data.color,
          emissiveIntensity: 0.5,
          transparent: true,
          opacity: 0.8,
          roughness: 0.5
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        nebula.add(core);
        
        this.scene.add(nebula);
        this.objects.push(nebula);
      });
    },

    createConstellations() {
      const glowTexture = TextureGenerator.generate('star-glow');
      this.constellations.forEach((data, i) => {
        const group = new THREE.Group();
        
        // Calculate geometric center of the constellation stars
        let sumX = 0, sumY = 0, sumZ = 0;
        data.stars.forEach(pos => {
          sumX += pos[0];
          sumY += pos[1];
          sumZ += pos[2];
        });
        const count = data.stars.length;
        const centerX = sumX / count;
        const centerY = sumY / count;
        const centerZ = sumZ / count;
        
        // Calculate bounding radius relative to this center
        let maxDistSq = 0;
        data.stars.forEach(pos => {
          const dx = pos[0] - centerX;
          const dy = pos[1] - centerY;
          const dz = pos[2] - centerZ;
          const distSq = dx*dx + dy*dy + dz*dz;
          if (distSq > maxDistSq) {
            maxDistSq = distSq;
          }
        });
        const computedRadius = Math.sqrt(maxDistSq);

        const angle = Math.random() * Math.PI * 2;
        const height = (Math.random() - 0.5) * 100;
        const distance = 150 + Math.random() * 150;
        
        // Position group at the world coordinates + the calculated geometric center offset
        group.position.set(
          Math.cos(angle) * distance + centerX,
          height + centerY,
          Math.sin(angle) * distance + centerZ
        );
        
        data.stars.forEach((pos, j) => {
          const localX = pos[0] - centerX;
          const localY = pos[1] - centerY;
          const localZ = pos[2] - centerZ;

          const isBrightest = j === 0;
          const starRadius = isBrightest ? 5 : 2 + Math.random() * 1.5;
          const starGeo = new THREE.SphereGeometry(starRadius, 16, 16);
          
          let starColor = data.color;
          if (isBrightest) {
            if (data.name === 'Orion') starColor = 0xffa500;
            else if (data.name === 'Scorpius') starColor = 0xff4500;
            else starColor = 0xe0f2fe;
          }
          
          const starMat = new THREE.MeshBasicMaterial({
            color: starColor
          });
          const star = new THREE.Mesh(starGeo, starMat);
          star.position.set(localX, localY, localZ);
          
          const glowMaterial = new THREE.SpriteMaterial({
            map: glowTexture,
            color: starColor,
            transparent: true,
            opacity: isBrightest ? 0.95 : 0.5,
            blending: THREE.AdditiveBlending
          });
          const glow = new THREE.Sprite(glowMaterial);
          glow.scale.set(starRadius * (isBrightest ? 5.5 : 4.0), starRadius * (isBrightest ? 5.5 : 4.0), 1);
          star.add(glow);
          
          group.add(star);
          
          if (j < data.stars.length - 1) {
            const nextLocalX = data.stars[j+1][0] - centerX;
            const nextLocalY = data.stars[j+1][1] - centerY;
            const nextLocalZ = data.stars[j+1][2] - centerZ;

            const lineGeo = new THREE.BufferGeometry().setFromPoints([
              new THREE.Vector3(localX, localY, localZ),
              new THREE.Vector3(nextLocalX, nextLocalY, nextLocalZ)
            ]);
            const lineMat = new THREE.LineBasicMaterial({
              color: data.color,
              transparent: true,
              opacity: 0.45
            });
            const line = new THREE.Line(lineGeo, lineMat);
            group.add(line);
          }
        });
        
        group.userData = { 
          ...data, 
          type: 'Constellation', 
          id: i,
          radius: computedRadius
        };
        this.scene.add(group);
        this.objects.push(group);
      });
    },

    updateHUD() {
      requestAnimationFrame(() => {
        const camPos = this.camera.position;
        const hudCam = document.getElementById('hud-camera');
        const hudTarget = document.getElementById('hud-target');
        const hudZoom = document.getElementById('hud-zoom');
        
        if (hudCam) hudCam.textContent = `CAM: ${camPos.x.toFixed(0)}, ${camPos.y.toFixed(0)}, ${camPos.z.toFixed(0)}`;
        if (hudTarget) hudTarget.textContent = `TGT: ${this.selectedObj ? this.selectedObj.userData.name : 'None'}`;
        if (hudZoom) hudZoom.textContent = `ZOOM: ${(1 / (this.camera.position.length() / 300)).toFixed(1)}x`;
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
      
      document.querySelectorAll('.space-object-item').forEach((el) => {
        const elId = el.getAttribute('data-id');
        el.classList.toggle('active', elId === String(id));
      });
      
      this.showDetails(this.selectedObj?.userData);

      // Sync selection with Alpine.js application layer so Details panel is visible
      const alpineEl = document.body;
      if (alpineEl && alpineEl.__x__ && alpineEl.__x__.$data) {
        alpineEl.__x__.$data.selectedObject = this.selectedObj?.userData || null;
      }

      if (this.selectedObj) {
        const radius = this.selectedObj.userData.radius || 10;
        const targetPos = new THREE.Vector3();
        this.selectedObj.getWorldPosition(targetPos);
        
        this.controlsTargetPos.copy(targetPos);
        
        // Highly accurate, custom camera angle locks for specific objects
        if (this.selectedObj.userData.id === 'your-location') {
          // Earth Reference (Your Location) Focus
          this.cameraTargetPos.copy(targetPos).add(new THREE.Vector3(0, radius * 2.8, radius * 4.0));
        } else if (this.selectedObj.userData.type === 'Constellation') {
          const name = this.selectedObj.userData.name;
          let offset;
          if (name === 'Orion') {
            // Orion: LOW-ANGLE lock looking up slightly to emphasize the grand celestial scale of the stars and belt
            offset = new THREE.Vector3(0, radius * 1.15, radius * 2.25);
          } else if (name === 'Ursa Major') {
            // Ursa Major: HIGH-ANGLE lock looking down from overhead to capture the distinct Big Dipper ladle cleanly
            offset = new THREE.Vector3(radius * 0.4, radius * 1.8, radius * 1.8);
          } else if (name === 'Cassiopeia') {
            // Cassiopeia: SHARP SIDE-ANGLE lock to reveal the distinct zig-zag 'W' profile in all its glory
            offset = new THREE.Vector3(radius * 1.25, radius * 1.0, radius * 1.95);
          } else {
            // Standard constellation framing
            offset = new THREE.Vector3(0, radius * 1.5, radius * 2.5);
          }
          this.cameraTargetPos.copy(targetPos).add(offset);
        } else {
          // Standard planet / star focus camera lock
          this.cameraTargetPos.copy(targetPos).add(new THREE.Vector3(0, radius * 3.5, radius * 5));
        }
        
        this.isGliding = true;
        
        if (this.controls) {
          this.controls.autoRotate = false;
        }
      }
    },
    
    showDetails(data) {
      const details = document.getElementById('space-object-details');
      if (!details) return;
      details.replaceChildren();

      if (!data) return;

      const nameDiv = document.createElement('div');
      nameDiv.className = 'font-bold text-nasa mb-2';
      nameDiv.textContent = data.name;
      details.appendChild(nameDiv);
      
      const typeDiv = document.createElement('div');
      typeDiv.className = 'text-xs text-gray-400 mb-2';
      typeDiv.textContent = data.type || 'Constellation';
      details.appendChild(typeDiv);
      
      const addDetail = (label, value) => {
        const div = document.createElement('div');
        div.textContent = `${label}: ${value}`;
        details.appendChild(div);
      };

      if (data.temp) addDetail('Temp', data.temp);
      if (data.mass) addDetail('Mass', data.mass);
      if (data.distance !== undefined && this.currentTab === 'solar') {
        addDetail('Distance', `${data.distance}M km`);
      }
      if (data.distance && this.currentTab !== 'solar' && this.currentTab !== 'constellations') {
        addDetail('Distance', `${data.distance} ly`);
      }
      if (data.orbit) addDetail('Orbit', `${data.orbit} years`);
      if (data.moons !== undefined) addDetail('Moons', data.moons);
      if (data.size) addDetail('Size', `${data.size} ly`);
      if (data.constellation) addDetail('In', data.constellation);
      if (data.brightest) addDetail('Brightest', data.brightest);
      if (data.stars) addDetail('Stars', data.stars.length);
      if (data.description) {
        const descDiv = document.createElement('div');
        descDiv.className = 'text-xs text-gray-300 mt-2 italic border-t border-nasa/20 pt-2';
        descDiv.textContent = data.description;
        details.appendChild(descDiv);
      }
    },
    
    updateObjectsList() {
      const list = document.getElementById('space-objects-list');
      if (!list) return;
      list.replaceChildren();

      const data = this.currentTab === 'solar' ? this.solarSystem : 
                   this.currentTab === 'stars' ? this.nearbyStars : 
                   this.currentTab === 'constellations' ? this.constellations : this.nebulae;
      
      // Inject "Your Location" (referenceEarth) at the top of the list for all tabs
      const userLocationItem = document.createElement('div');
      userLocationItem.className = 'space-object-item';
      userLocationItem.setAttribute('data-id', 'your-location');
      userLocationItem.addEventListener('click', () => this.selectObject('your-location'));

      const locName = document.createElement('div');
      locName.className = 'font-bold text-nasa';
      locName.textContent = '🌍 Your Location';
      userLocationItem.appendChild(locName);

      const locType = document.createElement('div');
      locType.className = 'text-xs text-gray-400';
      locType.textContent = 'Earth Reference';
      userLocationItem.appendChild(locType);

      list.appendChild(userLocationItem);
      
      // Populate standard items
      data.forEach((o, i) => {
        const item = document.createElement('div');
        item.className = 'space-object-item';
        item.setAttribute('data-id', String(i));
        item.addEventListener('click', () => this.selectObject(i));

        const nameDiv = document.createElement('div');
        nameDiv.className = 'font-bold';
        nameDiv.textContent = o.name;
        item.appendChild(nameDiv);

        const typeDiv = document.createElement('div');
        typeDiv.className = 'text-xs text-gray-400';
        typeDiv.textContent = o.type || (this.currentTab === 'constellations' ? 'Constellation' : '');
        item.appendChild(typeDiv);

        list.appendChild(item);
      });
    },
    
    animate() {
      requestAnimationFrame(() => this.animate());
      
      const container = document.getElementById('space-gallery-3d');
      if (!container || container.offsetParent === null) {
        return;
      }
      
      // Update controls for smooth damping
      if (this.controls) {
        this.controls.update();
      }
      
      // Update HUD in real-time
      this.updateHUD();
      
      // Update weather particles shader uniform
      if (this.weatherParticles && this.weatherParticles.material.userData.shader) {
        this.weatherParticles.material.userData.shader.uniforms.uTime.value = performance.now() * 0.05;
      }
      
      // Smooth camera focus glide
      if (this.isGliding) {
        const lerpFactor = 0.05; // smooth speed
        this.camera.position.lerp(this.cameraTargetPos, lerpFactor);
        if (this.controls) {
          this.controls.target.lerp(this.controlsTargetPos, lerpFactor);
        }
        
        // If very close, stop gliding
        if (this.camera.position.distanceTo(this.cameraTargetPos) < 1.0 &&
            (!this.controls || this.controls.target.distanceTo(this.controlsTargetPos) < 1.0)) {
          this.isGliding = false;
        }
      }
      
      // Rotate reference Earth (Your Location) and its clouds dynamically
      if (this.referenceEarth) {
        this.referenceEarth.rotation.y += 0.003;
        if (this.referenceEarth.userData.clouds) {
          this.referenceEarth.userData.clouds.rotation.y += 0.005;
        }
      }
      
      // Rotate objects
      this.objects.forEach(obj => {
        if (obj.userData.angle !== undefined && this.currentTab === 'solar') {
          // Orbit planets
          obj.userData.angle += 0.001 * (obj.userData.orbit || 1);
          obj.position.x = Math.cos(obj.userData.angle) * obj.userData.distance;
          obj.position.z = Math.sin(obj.userData.angle) * obj.userData.distance;
        }
        
        // Skip double-rotating the reference Earth as it is animated separately
        if (obj !== this.referenceEarth) {
          obj.rotation.y += 0.005;
          if (obj.userData.clouds) {
            obj.userData.clouds.rotation.y += 0.007;
          }
        }

        // Animate space explorer Sun's corona organically matching the backdrop
        if (obj.userData.name === 'Sun') {
          const sunCoronaRay = obj.getObjectByName('sunCoronaRay');
          if (sunCoronaRay) {
            const currentTime = performance.now();
            const rayPulse = 1.0 + Math.sin(currentTime * 0.0015) * 0.05;
            sunCoronaRay.scale.set(obj.userData.radius * 2.2 * rayPulse, obj.userData.radius * 2.2 * rayPulse, 1);
            sunCoronaRay.material.rotation = Math.sin(currentTime * 0.0002) * 0.08;
            sunCoronaRay.material.opacity = 0.8 + Math.cos(currentTime * 0.0007) * 0.12;
          }
        }
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
      this.cameraTargetPos.set(0, 100, 300);
      this.controlsTargetPos.set(0, 0, 0);
      this.isGliding = true;
      if (this.controls) {
        this.controls.autoRotate = true;
      }
      this.selectedObj = null;
      const details = document.getElementById('space-object-details');
      if (details) details.replaceChildren();
      document.querySelectorAll('.space-object-item').forEach(el => el.classList.remove('active'));
      
      const alpineEl = document.body;
      if (alpineEl && alpineEl.__x__ && alpineEl.__x__.$data) {
        alpineEl.__x__.$data.selectedObject = null;
      }
    }
  };
})();
