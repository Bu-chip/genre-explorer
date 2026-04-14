# Random Genre Explorer

React + Vite app for exploring 5,453 music genres from EveryNoise at Once.

## Stack
- React + Vite, deploy target GitHub Pages
- framer-motion for animations
- Last.fm API for genre descriptions (key in .env as VITE_LASTFM_API_KEY)

## Design system
- Design tokens in src/styles/tokens.css - use these for ALL colors, spacing, fonts
- Never use hardcoded hex values or pixel sizes in components
- Grey scale: --gray-900 to --gray-50
- Spacing: --space-1 to --space-9
- Fonts: --font-display, --font-body, --font-mono

## Key files
- src/App.jsx - main component
- src/hooks/useGenres.js - loads genre JSON
- src/utils/nearest.js - euclidean distance for nearby genres
- public/data/genres_index.json - 5,453 genres (name, slug, x, y, color)

## Conventions
- No border-radius, no box-shadow, no generic card styles
- Dark background, light text
- Editorial aesthetic, not tech/SaaS
- Mobile-first responsive
