// config.js: static content and tuning knobs. No logic lives here.

export const COLS = 18;

export const DIFFICULTY = {
  easy:   { label: 'Easy',   speedMul: 0.75, bonusLives: 3 },
  normal: { label: 'Normal', speedMul: 1,    bonusLives: 1 },
  hard:   { label: 'Hard',   speedMul: 1.35, bonusLives: 0 },
};

export const BALLS = {
  classic: '⚪ Classic',
  n: '🏁 N',
  ram: '🐏 Ram Rebel',
  football: '🏈 Football',
};

export const THEMES = {
  classic:   { label: 'Classic',        bg: '#0b1630', field: '#101e44', wall: '#5a8dee', grow: '#ffd23f', accent: '#4f8cff', fg: '#eaf0ff', ball: '#ff4d6d', cheer: 'Nice work 👏' },
  familyguy: { label: 'Family Guy',     bg: '#14446b', field: '#9fd8f0', wall: '#2e8b57', grow: '#f6c744', accent: '#f08a24', fg: '#ffffff', ball: '#e0301e', cheer: 'Quahog is proud 🍺' },
  cleveland: { label: 'Cleveland Show', bg: '#3a2616', field: '#f2dcae', wall: '#8a5526', grow: '#ff7a45', accent: '#d9822b', fg: '#fff4e0', ball: '#1d6fa5', cheer: 'Stoolbottom salutes you 🐻' },
};

export const JOKES = [
  'Why did the quarterback ace JezzBall? He’s used to walls closing in fast.',
  'A kicker’s favorite ball in JezzBall? The one that goes wide left.',
  'Offensive linemen are great at this game. They’ve been walls their whole lives.',
  'Browns fans love JezzBall: finally, a game where you can win at 75%.',
  'The punter’s JezzBall strategy: kick the balls and don’t look back.',
  'Ref: “Illegal wall formation, 5 yards.” Ball: “I was just bouncing.”',
  'Fantasy managers don’t fear bouncing balls. They fear Sunday injuries.',
  'Why was the tight end bad at JezzBall? He kept trying to catch the balls.',
];

export const CREDITS = ['Director', 'Programmer', 'Game design', 'Artist', 'N ball designer', 'Ram ball designer',
  'Sound engineer', 'NFL joke writer', 'Physics', 'Quality testing', 'Snacks'];

export const DEFAULTS = { ball: 'classic', theme: 'classic', difficulty: 'normal', sound: 'on', language: 'en' };
