# JezzBall: N-Ram Edition

[![Test and deploy](../../actions/workflows/pages.yml/badge.svg)](../../actions/workflows/pages.yml)

A mobile-first remake of the classic **JezzBall**. Split the field, trap the balls, and survive the NFL jokes.
No frameworks, no build step, no dependencies. It installs to your home screen and works offline.

**[▶ Play it](https://markfourman.github.io/Jezzball-N-Ram/)** (works best on a phone)

## What's new vs. the original

- **Pick your ball:** Classic, **N** (performance blue, chequered band), **Ram Rebel** (gunmetal and red), or Football.
- **Themes:** Classic, Family Guy, Cleveland Show.
- **One-thumb controls:** tap to build a wall, one **Flip** button to switch direction (the PC original needed a right click).
- **Streak reward:** clear 5 levels in a row without a game over and the TOUCHDOWN party starts.
- **Shareable:** Web Share API button, social preview card, installable PWA.
- Difficulty chooser, sound toggle, how-to guide, credits, and NFL jokes between levels.

## How to play

1. Tap the field to shoot a wall. It grows in both directions.
2. Tap **Flip** (or press Space) to switch between horizontal and vertical walls.
3. A ball hitting a *growing* wall breaks it and costs a life.
4. Areas with no balls get filled. Claim **75%** to clear the level.

## Architecture

```
index.html  ── shell, social meta tags
css/style.css
js/
  engine.js   pure rules: grid, balls, walls, flood fill, events   (no DOM, unit-tested)
  render.js   canvas drawing, ball sprites                         (reads state only)
  ui.js       screens as HTML strings, confetti, toast
  audio.js    WebAudio synth, no asset files
  config.js   themes, difficulty, jokes, credits
  main.js     input, game loop, HUD, settings; connects everything
sw.js         offline cache (network-first)
tests/        node:test suite for the engine
```

### Design decisions

- **Engine is separate from the browser.** `engine.js` has no DOM, timers or audio. It queues events (`wallDone`, `lifeLost`, `levelClear`, ...) that the UI drains each frame. That is what makes it testable and lets the RNG be seeded for a future daily challenge.
- **Grid walls, continuous balls.** Walls live on a cell grid, which makes the "claim every cell no ball can reach" rule a simple flood fill from the balls. Balls move in float space and resolve each axis independently.
- **Delta-time clamp.** Frame time is capped at 50 ms so a backgrounded tab can't tunnel balls through walls; the game also auto-pauses when the tab is hidden.
- **Zero dependencies.** ES modules and Canvas 2D only. Deploys as static files.
- **Social preview card.** Open Graph tags with absolute URLs, which LinkedIn needs to show the preview image.

## Run it locally

```bash
python3 -m http.server 8080    # ES modules need http://, not file://
npm test                       # engine tests (Node 20+)
```

## Deploy (GitHub Pages)

1. Push this repo to GitHub as `Jezzball-N-Ram` on branch `main`.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. The workflow runs the tests, then publishes to `https://markfourman.github.io/Jezzball-N-Ram/`.

## Roadmap

- Daily challenge: same seeded level for everyone, shareable result grid.
- More ball styles and haptic feedback on bounces.
- Optional leaderboard (needs a small backend).

## About this project

Concept, product decisions, and testing by **Mark Fourmanovskis** ([LinkedIn](https://www.linkedin.com/in/mark-fourmanovskis/) · [GitHub](https://github.com/markfourman)). Implementation was pair-built with
**Claude** (Anthropic). Yes, the in-game credits list "Claude code" for every role; that's the joke.

## Disclaimer

Unofficial fan project, not affiliated with or endorsed by Hyundai, Stellantis/Ram, the NFL, Microsoft,
or the producers of Family Guy and The Cleveland Show. All trademarks belong to their owners.
JezzBall is inspired by the original Microsoft game.

## License

[MIT](LICENSE)
