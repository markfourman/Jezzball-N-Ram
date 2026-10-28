import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, mulberry32 } from '../js/engine.js';

const still = (x, y) => ({ x, y, vx: 0, vy: 0 });
const settle = (g) => { for (let i = 0; i < 600 && g.wall; i++) g.step(1 / 60); };

test('border is solid and the interior starts open', () => {
  const g = new Game({ cols: 10, rows: 10, balls: [] });
  assert.equal(g.grid[0], 1);
  assert.equal(g.grid[5 * 10 + 5], 0);
  assert.equal(g.percent, 0);
});

test('cannot start a wall on the border or off the board', () => {
  const g = new Game({ cols: 10, rows: 10, balls: [still(2.5, 2.5)] });
  assert.equal(g.tap(0, 0), false);
  assert.equal(g.tap(-1, 4), false);
  assert.equal(g.tap(5, 5), true);
  assert.equal(g.tap(3, 3), false, 'only one wall at a time');
});

test('a wall that splits the field claims the side with no balls', () => {
  const g = new Game({ cols: 10, rows: 10, balls: [still(2.5, 2.5)] });
  g.tap(6, 5, true);
  settle(g);
  assert.equal(g.percent, 38);          // 8 wall cells + 16 claimed cells of 64
  assert.equal(g.status, 'playing');
  assert.ok(g.drain().includes('wallDone'));
});

test('a ball touching a growing wall breaks it and costs a life', () => {
  const g = new Game({ cols: 10, rows: 10, balls: [still(6.5, 2.5)] });
  const lives = g.lives;
  g.tap(6, 5, true);
  settle(g);
  assert.equal(g.lives, lives - 1);
  assert.ok(g.drain().includes('lifeLost'));
});

test('running out of lives ends the game', () => {
  const g = new Game({ cols: 10, rows: 10, bonusLives: 0, balls: [still(6.5, 2.5)] });
  g.tap(6, 5, true);
  settle(g);
  assert.equal(g.status, 'over');
  assert.ok(g.drain().includes('gameOver'));
});

test('claiming 75% clears the level', () => {
  const g = new Game({ cols: 10, rows: 10, balls: [] });  // no balls: everything is claimable
  g.tap(5, 5);
  settle(g);
  assert.equal(g.status, 'cleared');
  assert.equal(g.percent, 100);
});

test('seeded RNG makes levels reproducible', () => {
  const a = new Game({ cols: 18, rows: 26, level: 4, rng: mulberry32(42) });
  const b = new Game({ cols: 18, rows: 26, level: 4, rng: mulberry32(42) });
  assert.deepEqual(a.balls, b.balls);
  assert.equal(a.balls.length, 5);
});
