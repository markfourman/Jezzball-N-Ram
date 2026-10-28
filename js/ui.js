// ui.js: screens as HTML strings plus two small effects (confetti party, toast).
// Buttons carry data-act attributes; main.js handles them with one delegated listener.

import { BALLS, CREDITS, DIFFICULTY, THEMES } from './config.js';

const labels = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v.label]));

const group = (label, key, options, current) => `
  <div class="r"><b>${label}</b><div>${Object.entries(options).map(([id, name]) =>
    `<button class="${id === current ? 'on' : ''}" data-act="set" data-key="${key}" data-val="${id}">${name}</button>`).join('')}</div></div>`;

export const menuHTML = ({ resumable, level, repoUrl }) => `
  <h1>JezzBall<small>N-Ram Edition</small></h1>
  <button class="on" data-act="play">${resumable ? 'Resume' : level > 1 ? 'Continue' : 'Play'}</button>
  ${resumable || level > 1 ? '<button data-act="newGame">New game</button>' : ''}
  <button data-act="howto">How to play</button>
  <button data-act="settings">Settings</button>
  <button data-act="credits">Credits</button>
  <button data-act="share">Share with friends</button>
  ${repoUrl ? `<a class="src" href="${repoUrl}" target="_blank" rel="noopener">★ Source on GitHub</a>` : ''}`;

export const settingsHTML = (s) => `<h2>Settings</h2>
  ${group('Ball style', 'ball', BALLS, s.ball)}
  ${group('Theme', 'theme', labels(THEMES), s.theme)}
  ${group('Difficulty', 'difficulty', labels(DIFFICULTY), s.difficulty)}
  ${group('Sound', 'sound', { on: 'On 🔊', off: 'Off 🔇' }, s.sound)}
  ${group('Language', 'language', { en: 'English', none: 'None' }, s.language)}
  <button data-act="menu">Back</button>`;

export const howtoHTML = () => `<h2>How to play</h2>
  <ol>
    <li>Tap the field to shoot a wall. It grows both ways from your tap.</li>
    <li>Tap <b>Flip</b> (or press Space) to switch between ↔ and ↕ walls.</li>
    <li>A ball that hits a <i>growing</i> wall breaks it and costs a ❤.</li>
    <li>Any area with no balls gets filled in. Fill 75% to clear the level.</li>
    <li>Clear 5 levels in a row without a game over for a victory party 🏆</li>
  </ol>
  <b>Controls</b>
  <ul><li>Tap the field: build a wall</li><li>Flip button: change wall direction</li><li>☰ Menu: pause</li></ul>
  <button data-act="menu">Back</button>`;

export const creditsHTML = () => `<h2>Credits</h2>
  <ul class="plain">${CREDITS.map((r) => `<li>${r}: <b>Claude code</b></li>`).join('')}</ul>
  <button data-act="menu">Back</button>`;

export const cardHTML = (title, body, button) => `<h1>${title}</h1>
  <p class="card">${body}</p>
  <button class="on" data-act="next">${button}</button>
  <button data-act="menu">Menu</button>`;

export function toast(message) {
  const el = document.querySelector('#toast');
  el.textContent = message; el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 2200);
}

/** Streak reward: falling emoji, a zooming TOUCHDOWN banner, and a truck driving through. */
export function celebrate() {
  const emoji = ['🏈', '🏆', '🔵', '🐏', '🎉', '🚚'];
  const el = document.createElement('div');
  el.className = 'party';
  el.innerHTML = '<b>TOUCHDOWN!</b><i>🛻💨</i>' + Array.from({ length: 44 }, () =>
    `<span style="left:${Math.random() * 100}%;animation-delay:${Math.random() * 2}s;font-size:${20 + Math.random() * 22}px">${emoji[Math.floor(Math.random() * emoji.length)]}</span>`).join('');
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 5500);
}
