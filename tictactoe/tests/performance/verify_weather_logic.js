
const fs = require('fs');
const assert = require('assert');

// Mock browser globals
global.window = {
  SpaceGallery3D: {}
};
global.navigator = {
  geolocation: {
    getCurrentPosition: (success, error) => {
      success({ coords: { latitude: 40.7128, longitude: -74.0060 } });
    }
  }
};

const store = {};
global.localStorage = {
  getItem: (key) => store[key] || null,
  setItem: (key, value) => { store[key] = value.toString(); },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); }
};

global.THREE = {
  Scene: class {},
  FogExp2: class {},
  PerspectiveCamera: class {},
  WebGLRenderer: class {
    setSize() {}
    setPixelRatio() {}
    domElement = { appendChild: () => {}, addEventListener: () => {} };
  },
  OrbitControls: class {
    reset() {}
  },
  Raycaster: class {},
  Vector2: class {},
  AmbientLight: class {},
  PointLight: class {},
  DirectionalLight: class {},
  SphereGeometry: class { dispose() {} },
  MeshStandardMaterial: class { dispose() {} },
  MeshBasicMaterial: class { dispose() {} },
  Mesh: class { add() {} },
  CanvasTexture: class {},
  SpriteMaterial: class {},
  Sprite: class {},
  Group: class { add() {} },
  RingGeometry: class { dispose() {} },
  BufferGeometry: class { setFromPoints() { return this; } dispose() {} setAttribute() {} },
  PointsMaterial: class { dispose() {} },
  Points: class {},
  Color: class {},
  Float32BufferAttribute: class {},
  LineBasicMaterial: class { dispose() {} },
  Line: class {},
  BackSide: 1,
  AdditiveBlending: 2,
  ACESFilmicToneMapping: 3,
  PCFSoftShadowMap: 4,
  DoubleSide: 5
};

global.document = {
  getElementById: (id) => {
    if (id === 'space-gallery-3d') return { clientWidth: 800, appendChild: () => {} };
    if (id === 'weather-indicator') return { textContent: '', title: '' };
    return null;
  },
  createElement: () => ({
    getContext: () => ({
      fillStyle: '',
      fillRect: () => {},
      strokeStyle: '',
      lineWidth: 0,
      strokeRect: () => {},
      font: '',
      textAlign: '',
      fillText: () => {}
    }),
    width: 0,
    height: 0
  }),
  querySelectorAll: () => []
};

// Load the script
const scriptContent = fs.readFileSync('tictactoe/public/space-gallery-3d.js', 'utf8');
eval(scriptContent);

const SpaceGallery3D = global.window.SpaceGallery3D;

async function runTests() {
  console.log('Running Verification Tests...');

  // Mock addWeatherEffect
  SpaceGallery3D.addWeatherEffect = () => {
    // console.log('addWeatherEffect called, currentWeather:', SpaceGallery3D.currentWeather);
  };

  // Test Case 1: Fresh Fetch (No Cache)
  console.log('Test 1: Fresh Fetch (No Cache)');
  localStorage.clear();
  SpaceGallery3D.userLocation = { lat: 40.7128, lon: -74.0060 };

  global.fetch = async () => ({
    json: async () => ({ current: { weather_code: 0 } }) // Clear
  });

  await SpaceGallery3D.fetchWeather();
  assert.strictEqual(SpaceGallery3D.currentWeather, 'clear', 'Should be clear after fetch');

  const lat = Math.round(40.7128 * 10) / 10;
  const lon = Math.round(-74.0060 * 10) / 10;
  const cacheKey = `weather_cache_${lat}_${lon}`;
  const cached = JSON.parse(localStorage.getItem(cacheKey));
  assert.strictEqual(cached.weather_code, 0, 'Should store code 0 in cache');
  assert.ok(cached.timestamp <= Date.now(), 'Should have current timestamp');

  // Test Case 2: Cache Hit
  console.log('Test 2: Cache Hit');
  SpaceGallery3D.currentWeather = 'unknown';
  let fetchCalled = false;
  global.fetch = async () => {
    fetchCalled = true;
    return { json: async () => ({ current: { weather_code: 71 } }) }; // Snow
  };

  await SpaceGallery3D.fetchWeather();
  assert.strictEqual(SpaceGallery3D.currentWeather, 'clear', 'Should use cached "clear"');
  assert.strictEqual(fetchCalled, false, 'Fetch should NOT be called on cache hit');

  // Test Case 3: Expired Cache
  console.log('Test 3: Expired Cache');
  const expiredTimestamp = Date.now() - (31 * 60 * 1000);
  localStorage.setItem(cacheKey, JSON.stringify({
    weather_code: 0,
    timestamp: expiredTimestamp
  }));

  fetchCalled = false;
  global.fetch = async () => {
    fetchCalled = true;
    return { json: async () => ({ current: { weather_code: 71 } }) }; // Snow
  };

  await SpaceGallery3D.fetchWeather();
  assert.strictEqual(SpaceGallery3D.currentWeather, 'snow', 'Should be snow after expired cache triggers fetch');
  assert.strictEqual(fetchCalled, true, 'Fetch SHOULD be called on expired cache');

  // Test Case 4: Network Failure (Fallthrough to Default)
  console.log('Test 4: Network Failure');
  localStorage.clear();
  global.fetch = async () => {
    throw new Error('Network Error');
  };

  let setDefaultWeatherCalled = false;
  const originalSetDefaultWeather = SpaceGallery3D.setDefaultWeather;
  SpaceGallery3D.setDefaultWeather = () => {
    setDefaultWeatherCalled = true;
    SpaceGallery3D.currentWeather = 'fallback';
  };

  await SpaceGallery3D.fetchWeather();
  assert.strictEqual(setDefaultWeatherCalled, true, 'Should call setDefaultWeather on fetch error');
  assert.strictEqual(SpaceGallery3D.currentWeather, 'fallback', 'Should use fallback weather');

  console.log('All Verification Tests Passed!');
}

runTests().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
