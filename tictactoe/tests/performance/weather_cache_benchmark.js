
const { performance } = require('perf_hooks');

// Mock localStorage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: function(key) {
      return store[key] || null;
    },
    setItem: function(key, value) {
      store[key] = value.toString();
    },
    clear: function() {
      store = {};
    }
  };
})();

// Mock fetch with delay
const fetchMock = (url) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        json: () => Promise.resolve({
          current: { weather_code: 0 }
        })
      });
    }, 200); // 200ms simulated network delay
  });
};

async function benchmark() {
  console.log('--- Weather Fetch Benchmark ---');

  // Baseline: Without caching (simulated)
  const startBaseline = performance.now();
  const res1 = await fetchMock('https://api.open-meteo.com/v1/forecast...');
  const data1 = await res1.json();
  const endBaseline = performance.now();
  const baselineTime = endBaseline - startBaseline;
  console.log(`Baseline (Network Fetch): ${baselineTime.toFixed(2)}ms`);

  // Simulated Cache Hit
  const lat = 40.7;
  const lon = -74.0;
  const cacheKey = `weather_cache_${lat}_${lon}`;
  const mockCacheData = JSON.stringify({
    weather_code: 0,
    timestamp: Date.now()
  });
  localStorageMock.setItem(cacheKey, mockCacheData);

  const startCache = performance.now();
  const cachedData = localStorageMock.getItem(cacheKey);
  let weatherCode;
  if (cachedData) {
    const parsed = JSON.parse(cachedData);
    if (Date.now() - parsed.timestamp < 30 * 60 * 1000) {
      weatherCode = parsed.weather_code;
    }
  }
  const endCache = performance.now();
  const cacheTime = endCache - startCache;
  console.log(`Cache Hit: ${cacheTime.toFixed(2)}ms`);

  const improvement = ((baselineTime - cacheTime) / baselineTime * 100).toFixed(2);
  console.log(`Potential Improvement: ${improvement}%`);
  console.log('-------------------------------');
}

benchmark();
