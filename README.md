# Tetris

Classic Tetris web game built with React, TypeScript, Vite, and Canvas API.

## Features

- 7 tetrominoes (I, O, T, S, Z, J, L) with bag randomizer
- 60 FPS smooth gameplay, soft drop on Down arrow
- Controls: Arrow keys (move, rotate, soft drop), Space (hard drop), P (pause), R (restart)
- Line clear animation, particles on hard drop and Game Over
- Level speed increase every 10 lines cleared
- Stats: score, level, lines, high score, next piece
- 3 themes: Classic, Neon, Retro
- Localization: EN / RU
- Sound: synthesized SFX (or add .mp3/.ogg in `public/sounds/`)
- LocalStorage: high score, top 5, theme, locale, sound toggle
- PWA-ready (manifest.json; add icon-192.png and icon-512.png for install prompt)

## Setup

```bash
cd tetris
npm install
npm run dev
```

Then open http://localhost:5173

## Build

```bash
npm run build
npm run preview
```

## Controls

| Key | Action |
|-----|--------|
| ← → | Move left/right |
| ↓ | Soft drop (hold to speed up) |
| ↑ | Rotate clockwise |
| Space | Hard drop |
| P | Pause |
| R | Restart |

Touch: swipe left/right to move, swipe down for soft drop, swipe up to rotate.  
Gamepad: D-pad or left stick for move/rotate, A for hard drop, Start for pause.
