/**
 * Benchmark for DOM queries in drawWinningLine and animateWinningLine
 */

// Mock DOM
global.document = {
  elements: {},
  getElementById(id) {
    return this.elements[id] || null;
  },
  querySelector(selector) {
    // Basic support for [data-cell-index="i"]
    const match = selector.match(/\[data-cell-index="(\d+)"\]/);
    if (match) {
      return this.elements[`cell-${match[1]}`] || null;
    }
    return null;
  },
  querySelectorAll(selector) {
     if (selector === '.winning-cell') {
       return Object.values(this.elements).filter(el => el.classList.contains('winning-cell'));
     }
     return [];
  }
};

function createMockElement(id, isCell = false, index = null) {
  return {
    id,
    classList: {
      classes: new Set(),
      add(c) { this.classes.add(c); },
      remove(c) { this.classes.delete(c); },
      contains(c) { return this.classes.has(c); }
    },
    style: {},
    getBoundingClientRect() {
      return { left: 100, top: 100, width: 100, height: 100 };
    },
    setAttribute() {},
    dataset: isCell ? { cellIndex: index } : {}
  };
}

// Setup elements
document.elements['game-board'] = createMockElement('game-board');
document.elements['winning-line'] = createMockElement('winning-line');
document.elements['win-line'] = createMockElement('win-line');
for (let i = 0; i < 9; i++) {
  document.elements[`cell-${i}`] = createMockElement(`cell-${i}`, true, i);
}

// Current Implementation Logic (Simplified for query part)
function currentDrawWinningLine(line) {
  const board = document.getElementById('game-board');
  const svg = document.getElementById('winning-line');
  const svgLine = document.getElementById('win-line');
  if (!board || !svg || !svgLine) return;

  const cells = line.map(i => document.querySelector(`[data-cell-index="${i}"]`));
  if (!cells[0] || !cells[2]) return;

  board.getBoundingClientRect();
  cells[0].getBoundingClientRect();
  cells[2].getBoundingClientRect();
}

function currentAnimateWinningLine(line) {
  line.forEach((index, i) => {
    const cell = document.querySelector(`[data-cell-index="${index}"]`);
    if (cell) {
      cell.classList.add('winning-cell');
      cell.style.animation = 'winPulse 0.6s ease-in-out';
    }
  });
}

// Optimized Implementation Logic
const domCache = {
  elements: {},
  cells: {}
};

function _getEl(id) {
  if (!domCache.elements[id]) {
    domCache.elements[id] = document.getElementById(id);
  }
  return domCache.elements[id];
}

function _getCell(index) {
  if (!domCache.cells[index]) {
    domCache.cells[index] = document.querySelector(`[data-cell-index="${index}"]`);
  }
  return domCache.cells[index];
}

function optimizedDrawWinningLine(line) {
  const board = _getEl('game-board');
  const svg = _getEl('winning-line');
  const svgLine = _getEl('win-line');
  if (!board || !svg || !svgLine) return;

  const cells = line.map(i => _getCell(i));
  if (!cells[0] || !cells[2]) return;

  board.getBoundingClientRect();
  cells[0].getBoundingClientRect();
  cells[2].getBoundingClientRect();
}

function optimizedAnimateWinningLine(line) {
  line.forEach((index, i) => {
    const cell = _getCell(index);
    if (cell) {
      cell.classList.add('winning-cell');
      cell.style.animation = 'winPulse 0.6s ease-in-out';
    }
  });
}

const iterations = 100000;
const line = [0, 1, 2];

console.log(`Running benchmark with ${iterations} iterations...`);

// Warm up
for(let i=0; i<1000; i++) {
    currentDrawWinningLine(line);
    currentAnimateWinningLine(line);
    optimizedDrawWinningLine(line);
    optimizedAnimateWinningLine(line);
}

// Benchmark Current
let start = Date.now();
for (let i = 0; i < iterations; i++) {
  currentAnimateWinningLine(line);
  currentDrawWinningLine(line);
}
let currentDuration = Date.now() - start;
console.log(`Current implementation: ${currentDuration}ms`);

// Benchmark Optimized
start = Date.now();
for (let i = 0; i < iterations; i++) {
  optimizedAnimateWinningLine(line);
  optimizedDrawWinningLine(line);
}
let optimizedDuration = Date.now() - start;
console.log(`Optimized implementation: ${optimizedDuration}ms`);

const improvement = ((currentDuration - optimizedDuration) / currentDuration * 100).toFixed(2);
console.log(`Improvement: ${improvement}%`);
