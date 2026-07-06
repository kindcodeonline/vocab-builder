# Vocabulary Builder PWA

A free, no-sign-up Progressive Web App for iPhone and desktop browsers.

It fetches random rare English words from Random Word API and definitions from Dictionary API. It hides the meaning until the user presses **Show meaning**, then lets the user record whether the word was already known or newly learned.

## Files

- `index.html` — app structure
- `styles.css` — visual design
- `app.js` — random word fetching, definition lookup, counters, and app logic
- `manifest.json` — PWA install metadata
- `service-worker.js` — caches the app shell for offline launching
- `icons/` — app icons

## Notes

- The API requires internet access to fetch new words.
- If the API is unavailable, the app falls back to a small offline backup list.
- Counters are stored locally in the browser using `localStorage`.
