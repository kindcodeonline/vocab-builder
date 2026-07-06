# Vocabulary Builder Game PWA

A no-sign-up iPhone-friendly vocabulary game. It starts at medium difficulty, then adapts word difficulty based on whether the previous word was known.

## Game rules

- Choose a 5, 10, or 20 word game.
- The first word starts at difficulty 3.
- If you knew the word, the next word gets harder.
- If you did not know the word, the next word gets easier.
- Harder words are worth more points.
- Scores are saved locally in separate 5, 10, and 20 word high-score lists.

## Points

- Difficulty 1: 10 points
- Difficulty 2: 20 points
- Difficulty 3: 40 points
- Difficulty 4: 70 points
- Difficulty 5: 110 points

## APIs

- Random words: https://random-word-api.herokuapp.com/
- Definitions: https://dictionaryapi.dev/

## GitHub Pages

Upload these files to the root of your GitHub repository, then enable GitHub Pages from Settings → Pages → Deploy from a branch → main → /root.
