# Vocab Builder Game PWA

A free no-sign-up Progressive Web App for iPhone. It fetches advanced English words, reveals definitions, adapts difficulty based on whether the word was known, and saves high scores locally.

## Features

- 5 / 10 / 20 word game lengths
- Starts at medium difficulty
- Known word = next word harder
- Unknown word = next word easier
- Harder words are worth more points
- End-of-game name entry
- Separate high score lists for 5 / 10 / 20 word games
- Multiple dictionary definitions shown in a scrollable definition panel
- Local storage only; no account required
- Installable on iPhone Home Screen

## Main files

- `index.html` — app structure
- `styles.css` — visual styling
- `app.js` — game logic and API calls
- `manifest.json` — PWA metadata
- `service-worker.js` — offline app-shell caching
