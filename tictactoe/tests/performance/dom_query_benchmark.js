
const { performance } = require('perf_hooks');

// Mock DOM
global.document = {
    querySelector: (selector) => {
        // Simulate some work for querySelector
        let sum = 0;
        for (let i = 0; i < 1000; i++) sum += i;
        return {
            classList: { add: () => {} },
            style: {},
            getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 })
        };
    },
    getElementById: (id) => {
        let sum = 0;
        for (let i = 0; i < 1000; i++) sum += i;
        return {
            getBoundingClientRect: () => ({ left: 0, top: 0, width: 300, height: 300 }),
            classList: { add: () => {}, remove: () => {} }
        };
    },
    querySelectorAll: (selector) => []
};

const domCache = {};
function _getCellCached(index) {
    if (!domCache[index]) {
        domCache[index] = document.querySelector(`[data-cell-index="${index}"]`);
    }
    return domCache[index];
}

function _getCellUncached(index) {
    return document.querySelector(`[data-cell-index="${index}"]`);
}

const ITERATIONS = 10000;
const line = [0, 1, 2];

console.log(`Running benchmark with ${ITERATIONS} iterations...`);

// Baseline: Uncached
const startUncached = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
    const cells = line.map(idx => _getCellUncached(idx));
}
const endUncached = performance.now();
const timeUncached = endUncached - startUncached;
console.log(`Uncached time: ${timeUncached.toFixed(2)}ms`);

// Optimized: Cached
const startCached = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
    const cells = line.map(idx => _getCellCached(idx));
}
const endCached = performance.now();
const timeCached = endCached - startCached;
console.log(`Cached time: ${timeCached.toFixed(2)}ms`);

const improvement = ((timeUncached - timeCached) / timeUncached * 100).toFixed(2);
console.log(`Improvement: ${improvement}%`);
