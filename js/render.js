// render.js: canvas drawing. Reads game state, never mutates it.
// The context is scaled so all drawing is in cell units (1 unit = 1 grid cell).

import { GROWING, WALL } from './engine.js';

/** Size the canvas to the viewport and return the board geometry. */
export function fitBoard(canvas, cols) {
  const cell = Math.floor((Math.min(innerWidth, 460) - 16) / cols);
  const rows = Math.max(14, Math.floor((innerHeight - 215) / cell));
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = cols * cell * dpr; canvas.height = rows * cell * dpr;
  canvas.style.width = `${cols * cell}px`; canvas.style.height = `${rows * cell}px`;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr * cell, 0, 0, dpr * cell, 0, 0);
  return { cell, rows, ctx };
}

export function draw(ctx, game, theme, style) {
  const { grid, cols, rows } = game;
  ctx.fillStyle = theme.field;
  ctx.fillRect(0, 0, cols, rows);
  for (let i = 0; i < grid.length; i++) {
    if (!grid[i]) continue;
    ctx.fillStyle = grid[i] === WALL ? theme.wall : theme.grow;
    ctx.fillRect(i % cols, (i / cols) | 0, 1.03, 1.03);  // 1.03 hides sub-pixel seams
  }
  for (const b of game.balls) drawBall(ctx, b, theme, style);
}

// Text is drawn at 40px then scaled by 1/40 so font sizes stay crisp in cell units.
const PX = 1 / 40;

function drawBall(ctx, b, theme, style) {
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(b.x * 0.9 + b.y * 0.5);  // spin follows position: free, stateless "rolling"
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

  if (style === 'football') {
    ctx.scale(PX, PX); ctx.font = '38px serif'; ctx.fillText('🏈', 0, 2);
    return ctx.restore();
  }

  ctx.beginPath(); ctx.arc(0, 0, 0.45, 0, Math.PI * 2);
  ctx.fillStyle = { n: '#0a3cc8', ram: '#2b2f36' }[style] ?? theme.ball;
  ctx.fill();

  if (style === 'n') {            // Hyundai N: performance blue, chequered band, "N"
    ctx.save(); ctx.clip(); ctx.fillStyle = '#fff';
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++)
      if ((i + j) % 2 === 0) ctx.fillRect(-0.45 + i * 0.225, 0.12 + j * 0.17, 0.225, 0.17);
    ctx.restore();
    ctx.scale(PX, PX); ctx.font = 'italic 900 26px Arial'; ctx.fillText('N', 0, -5);
  } else if (style === 'ram') {   // Ram Rebel: gunmetal with red trim and a ram
    ctx.lineWidth = 0.1; ctx.strokeStyle = '#d6001c'; ctx.stroke();
    ctx.scale(PX, PX); ctx.font = '22px serif'; ctx.fillText('🐏', 0, 1);
  } else {                        // classic: glossy highlight
    ctx.fillStyle = '#ffffff66'; ctx.beginPath(); ctx.arc(-0.15, -0.15, 0.12, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
