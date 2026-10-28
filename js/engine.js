// engine.js: pure game rules for JezzBall.
// No DOM, no timers, no audio: state in, state out. That keeps it deterministic
// (seedable RNG) and unit-testable in plain Node. The UI only reads state and drains events.

export const OPEN = 0, WALL = 1, GROWING = 2;
export const WALL_SPEED = 16;  // cells per second a wall extends
export const TARGET = 75;      // % of the field to claim to clear a level
const BALL_RADIUS = 0.4;       // in cells

/** Tiny seedable PRNG: replayable levels in tests, and a future "daily challenge". */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Game {
  /**
   * @param {object} o
   * @param {number} o.cols, o.rows  board size in cells (border included)
   * @param {number} [o.level]       drives ball count and speed
   * @param {number} [o.speedMul]    difficulty multiplier for ball speed
   * @param {number} [o.bonusLives]  extra lives on top of one per ball
   * @param {() => number} [o.rng]   random source in [0,1)
   * @param {object[]} [o.balls]     explicit balls (tests); otherwise spawned from level
   */
  constructor({ cols, rows, level = 1, speedMul = 1, bonusLives = 1, rng = Math.random, balls = null }) {
    this.cols = cols; this.rows = rows; this.level = level; this.rng = rng;
    this.grid = new Uint8Array(cols * rows);
    for (let i = 0; i < this.grid.length; i++) {
      const x = i % cols, y = (i / cols) | 0;
      if (x === 0 || y === 0 || x === cols - 1 || y === rows - 1) this.grid[i] = WALL;
    }
    this.borderCells = 2 * cols + 2 * rows - 4;
    this.balls = balls ?? this.#spawn(Math.min(level + 1, 9), speedMul);
    this.lives = this.balls.length + bonusLives;
    this.wall = null;
    this.percent = 0;
    this.status = 'playing';   // 'playing' | 'cleared' | 'over'
    this.events = [];          // 'wallStart' | 'wallDone' | 'lifeLost' | 'levelClear' | 'gameOver'
  }

  /** Returns and clears queued events so the UI can react (sound, HUD, screens). */
  drain() { const e = this.events; this.events = []; return e; }

  /** Start a wall at a cell. Returns false if the tap is not allowed. */
  tap(cx, cy, vertical = false) {
    if (cx < 0 || cy < 0 || cx >= this.cols || cy >= this.rows) return false;
    const i = cy * this.cols + cx;
    if (this.status !== 'playing' || this.wall || this.grid[i] !== OPEN) return false;
    this.grid[i] = GROWING;
    const dirs = vertical ? [[0, -1], [0, 1]] : [[-1, 0], [1, 0]];
    this.wall = {
      origin: i,
      parts: dirs.map(([dx, dy]) => ({ x: cx, y: cy, dx, dy, cells: [], acc: 0, state: 'growing' })),
    };
    this.events.push('wallStart');
    return true;
  }

  /** Advance the simulation by dt seconds. */
  step(dt) {
    if (this.status !== 'playing') return;
    for (const b of this.balls) this.#move(b, dt);
    if (this.wall && this.status === 'playing') this.#grow(dt);
  }

  #spawn(n, speedMul) {
    const speed = Math.min(4.5 + this.level * 0.35, 9) * speedMul;
    const axis = () => speed * (this.rng() < 0.5 ? -1 : 1) * (0.6 + this.rng() * 0.4);
    return Array.from({ length: n }, () => ({
      x: 2 + this.rng() * (this.cols - 4), y: 2 + this.rng() * (this.rows - 4), vx: axis(), vy: axis(),
    }));
  }

  // Is the point inside a solid cell? Touching a growing wall breaks it (and costs a life).
  #solid(x, y) {
    const i = (y | 0) * this.cols + (x | 0), v = this.grid[i];
    if (v === GROWING) this.#breakAt(i);
    return v !== OPEN;
  }

  // Axes are resolved independently: simple, stable, and cheap enough for ~10 balls.
  #move(b, dt) {
    const nx = b.x + b.vx * dt;
    if (this.#solid(nx + Math.sign(b.vx) * BALL_RADIUS, b.y)) b.vx = -b.vx; else b.x = nx;
    const ny = b.y + b.vy * dt;
    if (this.#solid(b.x, ny + Math.sign(b.vy) * BALL_RADIUS)) b.vy = -b.vy; else b.y = ny;
  }

  #breakAt(i) {
    for (const p of this.wall?.parts ?? []) if (p.state === 'growing' && p.cells.includes(i)) return this.#lose(p);
  }

  #lose(part) {
    part.state = 'broken';
    part.cells.forEach((c) => (this.grid[c] = OPEN));
    this.lives--;
    this.events.push('lifeLost');
    if (this.lives < 1) { this.status = 'over'; this.wall = null; this.events.push('gameOver'); }
  }

  // Each wall has two halves growing in opposite directions. A half either reaches
  // an existing wall (success) or is hit by a ball (broken). Once both resolve, the
  // wall is finalised and unreachable space is claimed.
  #grow(dt) {
    const w = this.wall;
    for (const p of w.parts) {
      if (p.state !== 'growing') continue;
      p.acc += dt * WALL_SPEED;
      while (p.acc >= 1 && p.state === 'growing') {
        p.acc -= 1;
        const nx = p.x + p.dx, ny = p.y + p.dy, i = ny * this.cols + nx;
        if (this.grid[i] === WALL) { p.state = 'done'; p.cells.forEach((c) => (this.grid[c] = WALL)); }
        else if (this.balls.some((b) => (b.x | 0) === nx && (b.y | 0) === ny)) this.#lose(p);
        else { this.grid[i] = GROWING; p.cells.push(i); p.x = nx; p.y = ny; }
      }
    }
    if (this.status !== 'playing' || w.parts.some((p) => p.state === 'growing')) return;
    const ok = w.parts.some((p) => p.state === 'done');
    this.grid[w.origin] = ok ? WALL : OPEN;
    this.wall = null;
    if (ok) { this.events.push('wallDone'); this.#fill(); }
  }

  // Flood-fill from every ball. Open cells no ball can reach are claimed as wall.
  #fill() {
    const { grid, cols } = this, reach = new Uint8Array(grid.length), stack = [];
    for (const b of this.balls) {
      const i = (b.y | 0) * cols + (b.x | 0);
      if (!reach[i]) { reach[i] = 1; stack.push(i); }
    }
    while (stack.length) {
      const i = stack.pop();
      for (const j of [i + 1, i - 1, i + cols, i - cols])
        if (!reach[j] && grid[j] === OPEN) { reach[j] = 1; stack.push(j); }
    }
    let filled = 0;
    for (let i = 0; i < grid.length; i++) {
      if (grid[i] === OPEN && !reach[i]) grid[i] = WALL;
      if (grid[i] === WALL) filled++;
    }
    this.percent = Math.round((100 * (filled - this.borderCells)) / ((cols - 2) * (this.rows - 2)));
    if (this.percent >= TARGET) { this.status = 'cleared'; this.events.push('levelClear'); }
  }
}
