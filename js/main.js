// main.js: wires the pure engine to the browser (input, game loop, HUD, screens, settings).

import { COLS, DEFAULTS, DIFFICULTY, JOKES, THEMES } from './config.js';
import { Game } from './engine.js';
import { draw, fitBoard } from './render.js';
import { beep, jingle, setMuted } from './audio.js';
import * as ui from './ui.js';

const $ = (sel) => document.querySelector(sel);
const canvas = $('#board'), overlay = $('#overlay');

const stored = () => { try { return JSON.parse(localStorage.getItem('jezzball') || '{}'); } catch { return {}; } };
const persist = () => { try { localStorage.setItem('jezzball', JSON.stringify(settings)); } catch { /* private mode */ } };
const settings = { ...DEFAULTS, ...stored(), language: 'en' };

// Repo link shown in the menu; set in index.html.
const repoUrl = $('meta[name="repo-url"]').content;
const repoLink = repoUrl.startsWith('http') ? repoUrl : '';

let game = null, board = null, level = 1, streak = 0, vertical = false;
let running = false, raf = 0, last = 0;

const randomJoke = () => JOKES[Math.floor(Math.random() * JOKES.length)];
const theme = () => THEMES[settings.theme];

// ---- loop ----------------------------------------------------------------
function resume() {
  if (running) return;
  running = true; last = performance.now();
  raf = requestAnimationFrame(frame);
}
function pause() { running = false; cancelAnimationFrame(raf); }

function frame(ts) {
  if (!running) return;
  game.step(Math.min((ts - last) / 1000, 0.05));  // clamp so a stalled tab can't tunnel balls through walls
  last = ts;
  handle(game.drain());
  draw(board.ctx, game, theme(), settings.ball);
  if (running) raf = requestAnimationFrame(frame);
}

const SOUNDS = { wallStart: [600, 0.05], wallDone: [880, 0.08], lifeLost: [120, 0.25, 'sawtooth'] };

function handle(events) {
  if (!events.length) return;
  for (const e of events) if (SOUNDS[e]) beep(...SOUNDS[e]);
  updateHud();
  if (events.includes('gameOver')) return gameOver();
  if (events.includes('levelClear')) levelCleared();
}

// ---- game flow -----------------------------------------------------------
function startLevel() {
  board = fitBoard(canvas, COLS);
  const d = DIFFICULTY[settings.difficulty];
  game = new Game({ cols: COLS, rows: board.rows, level, speedMul: d.speedMul, bonusLives: d.bonusLives });
  overlay.classList.remove('open');
  updateHud(); draw(board.ctx, game, theme(), settings.ball); resume();
}

function levelCleared() {
  pause(); streak++; level++;
  jingle([523, 659, 784, 1046]);
  const party = streak % 5 === 0;
  showScreen(ui.cardHTML(party ? `🏆 ${streak} in a row!` : `Level ${level - 1} cleared!`,
    `${theme().cheer}<br><br>🏈 ${randomJoke()}`, 'Next level ▶'));
  if (party) ui.celebrate();
}

function gameOver() {
  pause(); level = 1; streak = 0;
  beep(90, 0.5, 'sawtooth');
  showScreen(ui.cardHTML('Game over 💥', `🏈 ${randomJoke()}`, 'Try again'));
  updateHud();
}

function exitGame() {   // Language > None. Browsers often block close(), so fall back to a goodbye screen.
  pause();
  try { window.close(); } catch { /* blocked */ }
  document.body.innerHTML = '<p style="margin:auto;text-align:center;font:20px system-ui">Game closed 👋<br><small>Refresh to reopen</small></p>';
}

async function share() {
  const data = { title: 'JezzBall: N-Ram Edition', text: 'Beat my JezzBall streak 🏈🔵🐏', url: location.href };
  try {
    if (navigator.share) return await navigator.share(data);
    await navigator.clipboard.writeText(data.url); ui.toast('Link copied!');
  } catch { /* share sheet cancelled */ }
}

// ---- view ----------------------------------------------------------------
function showScreen(html) { pause(); overlay.innerHTML = html; overlay.classList.add('open'); }
const showMenu = () => showScreen(ui.menuHTML({ resumable: game?.status === 'playing', level, repoUrl: repoLink }));

function updateHud() {
  $('#lvl').textContent = `Lv ${level}`;
  $('#lives').textContent = `❤ ${game?.lives ?? 0}`;
  $('#pct').textContent = `${game?.percent ?? 0}%`;
  $('#streak').textContent = `🔥${streak}`;
}

function applyTheme() {
  const t = theme(), root = document.documentElement.style;
  root.setProperty('--bg', t.bg); root.setProperty('--ac', t.accent); root.setProperty('--fg', t.fg);
  setMuted(settings.sound === 'off');
}

function flip() {
  vertical = !vertical;
  $('#flip').textContent = vertical ? '↕ Vertical' : '↔ Horizontal';
  beep(400, 0.03);
}

// ---- input ---------------------------------------------------------------
const actions = {
  play: () => (game?.status === 'playing' ? (overlay.classList.remove('open'), resume()) : startLevel()),
  newGame: () => { level = 1; streak = 0; startLevel(); },
  next: startLevel,
  menu: showMenu,
  howto: () => showScreen(ui.howtoHTML()),
  credits: () => showScreen(ui.creditsHTML()),
  settings: () => showScreen(ui.settingsHTML(settings)),
  share,
  flip,
  set: ({ key, val }) => {
    if (key === 'language' && val === 'none') return exitGame();  // never persisted
    settings[key] = val; persist(); applyTheme();
    showScreen(ui.settingsHTML(settings));
  },
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (el) actions[el.dataset.act]?.(el.dataset);
});

canvas.addEventListener('pointerdown', (e) => {
  if (!running) return;
  const r = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - r.left - canvas.clientLeft) / board.cell);
  const y = Math.floor((e.clientY - r.top - canvas.clientTop) / board.cell);
  game.tap(x, y, vertical);
});

addEventListener('keydown', (e) => { if (e.code === 'Space') { e.preventDefault(); flip(); } });
document.addEventListener('visibilitychange', () => { if (document.hidden && running) showMenu(); });  // auto-pause

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});

applyTheme(); updateHud(); showMenu();
