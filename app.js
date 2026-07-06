const RANDOM_WORD_API = "https://random-word-api.herokuapp.com/word";
const DICTIONARY_API = word => `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;

const STORAGE_KEYS = {
  highScores: "vocabGameHighScoresV1",
  lastName: "vocabGameLastNameV1"
};

const POINTS_BY_DIFFICULTY = {
  1: 10,
  2: 20,
  3: 40,
  4: 70,
  5: 110
};

const FALLBACK_WORDS = {
  1: [
    { word: "ample", partOfSpeech: "adjective", definition: "More than enough; plentiful.", example: "There was ample time to finish." },
    { word: "vivid", partOfSpeech: "adjective", definition: "Producing clear, strong images or feelings.", example: "She gave a vivid description." }
  ],
  2: [
    { word: "lucid", partOfSpeech: "adjective", definition: "Clear and easy to understand.", example: "His explanation was lucid." },
    { word: "novel", partOfSpeech: "adjective", definition: "New, unusual, or original.", example: "They proposed a novel solution." }
  ],
  3: [
    { word: "ephemeral", partOfSpeech: "adjective", definition: "Lasting for a very short time.", example: "The trend proved ephemeral." },
    { word: "obfuscate", partOfSpeech: "verb", definition: "To make something unclear or difficult to understand.", example: "The jargon obfuscated the message." }
  ],
  4: [
    { word: "perspicacious", partOfSpeech: "adjective", definition: "Having keen insight or good judgement.", example: "Her perspicacious question changed the discussion." },
    { word: "sagacious", partOfSpeech: "adjective", definition: "Wise, shrewd, and able to make good decisions.", example: "The sagacious leader waited." }
  ],
  5: [
    { word: "sesquipedalian", partOfSpeech: "adjective", definition: "Using or characterised by very long words.", example: "His sesquipedalian style was hard to follow." },
    { word: "ineffable", partOfSpeech: "adjective", definition: "Too great or extreme to be expressed in words.", example: "The view had an ineffable beauty." }
  ]
};

const els = {
  setupScreen: document.getElementById("setupScreen"),
  gameScreen: document.getElementById("gameScreen"),
  resultScreen: document.getElementById("resultScreen"),
  lengthButtons: document.querySelectorAll(".length-button"),
  scoreDisplay: document.getElementById("scoreDisplay"),
  progressDisplay: document.getElementById("progressDisplay"),
  difficultyDisplay: document.getElementById("difficultyDisplay"),
  sourceBadge: document.getElementById("sourceBadge"),
  pointsBadge: document.getElementById("pointsBadge"),
  wordDisplay: document.getElementById("wordDisplay"),
  phoneticDisplay: document.getElementById("phoneticDisplay"),
  showMeaningButton: document.getElementById("showMeaningButton"),
  meaningPanel: document.getElementById("meaningPanel"),
  partOfSpeech: document.getElementById("partOfSpeech"),
  definitionDisplay: document.getElementById("definitionDisplay"),
  exampleDisplay: document.getElementById("exampleDisplay"),
  answerButtons: document.getElementById("answerButtons"),
  knownButton: document.getElementById("knownButton"),
  notKnownButton: document.getElementById("notKnownButton"),
  statusMessage: document.getElementById("statusMessage"),
  quitButton: document.getElementById("quitButton"),
  finalScoreDisplay: document.getElementById("finalScoreDisplay"),
  resultSummary: document.getElementById("resultSummary"),
  playerNameInput: document.getElementById("playerNameInput"),
  saveScoreButton: document.getElementById("saveScoreButton"),
  playAgainButton: document.getElementById("playAgainButton"),
  clearScoresButton: document.getElementById("clearScoresButton"),
  tabButtons: document.querySelectorAll(".tab-button"),
  leaderboardList: document.getElementById("leaderboardList")
};

let game = null;
let currentWord = null;
let activeBoard = 5;

function blankGame(length) {
  return {
    length,
    score: 0,
    difficulty: 3,
    wordNumber: 1,
    knownCount: 0,
    unknownCount: 0,
    answeredWords: []
  };
}

function clampDifficulty(value) {
  return Math.max(1, Math.min(5, value));
}

function getHighScores() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.highScores));
    return saved || { 5: [], 10: [], 20: [] };
  } catch {
    return { 5: [], 10: [], 20: [] };
  }
}

function saveHighScores(scores) {
  localStorage.setItem(STORAGE_KEYS.highScores, JSON.stringify(scores));
}

function renderLeaderboard() {
  const scores = getHighScores();
  const board = scores[activeBoard] || [];
  els.leaderboardList.innerHTML = "";

  if (!board.length) {
    const empty = document.createElement("li");
    empty.innerHTML = `<span>—</span><span>No scores yet</span><span></span>`;
    els.leaderboardList.appendChild(empty);
    return;
  }

  board.forEach((entry, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>#${index + 1}</span>
      <span>
        <strong>${escapeHtml(entry.name)}</strong><br>
        <span class="score-meta">${entry.known} known · ${entry.unknown} unknown</span>
      </span>
      <strong>${entry.score}</strong>
    `;
    els.leaderboardList.appendChild(li);
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;"
  }[char]));
}

function setActiveBoard(board) {
  activeBoard = Number(board);
  els.tabButtons.forEach(button => button.classList.toggle("active", Number(button.dataset.board) === activeBoard));
  renderLeaderboard();
}

function showScreen(screenName) {
  els.setupScreen.hidden = screenName !== "setup";
  els.gameScreen.hidden = screenName !== "game";
  els.resultScreen.hidden = screenName !== "result";
}

function updateGameStats() {
  if (!game) return;
  els.scoreDisplay.textContent = game.score;
  els.progressDisplay.textContent = `${game.wordNumber}/${game.length}`;
  els.difficultyDisplay.textContent = game.difficulty;
  els.pointsBadge.textContent = `${POINTS_BY_DIFFICULTY[game.difficulty]} pts`;
}

function resetWordUI() {
  els.wordDisplay.textContent = "Loading…";
  els.phoneticDisplay.hidden = true;
  els.phoneticDisplay.textContent = "";
  els.meaningPanel.hidden = true;
  els.partOfSpeech.textContent = "";
  els.definitionDisplay.textContent = "";
  els.exampleDisplay.hidden = true;
  els.exampleDisplay.textContent = "";
  els.answerButtons.hidden = true;
  els.showMeaningButton.hidden = false;
  els.showMeaningButton.disabled = true;
}

async function startGame(length) {
  game = blankGame(length);
  currentWord = null;
  showScreen("game");
  updateGameStats();
  await loadWord();
}

async function loadWord() {
  resetWordUI();
  updateGameStats();
  els.statusMessage.textContent = `Fetching a difficulty ${game.difficulty} word…`;

  try {
    currentWord = await fetchValidWord(game.difficulty);
  } catch {
    currentWord = getFallbackWord(game.difficulty);
  }

  els.wordDisplay.textContent = currentWord.word;
  els.sourceBadge.textContent = currentWord.source || "API word";

  if (currentWord.phonetic) {
    els.phoneticDisplay.textContent = currentWord.phonetic;
    els.phoneticDisplay.hidden = false;
  }

  els.showMeaningButton.disabled = false;
  els.statusMessage.textContent = "Reveal the meaning, then choose honestly.";
}

async function fetchValidWord(difficulty) {
  const seenThisGame = new Set(game.answeredWords.map(item => item.word.toLowerCase()));

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const word = await fetchRandomWord(difficulty);
    if (!word || seenThisGame.has(word.toLowerCase())) continue;

    const definition = await fetchDefinition(word);
    if (definition) {
      return { ...definition, source: `Difficulty ${difficulty}` };
    }
  }

  throw new Error("No valid word found");
}

async function fetchRandomWord(difficulty) {
  const response = await fetch(`${RANDOM_WORD_API}?number=1&diff=${difficulty}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Random word fetch failed");
  const data = await response.json();
  return Array.isArray(data) ? data[0] : null;
}

async function fetchDefinition(word) {
  const response = await fetch(DICTIONARY_API(word));
  if (!response.ok) return null;
  const data = await response.json();
  const firstEntry = data?.[0];
  if (!firstEntry?.meanings?.length) return null;

  const definitions = [];
  const seenDefinitions = new Set();

  firstEntry.meanings.forEach(meaning => {
    const partOfSpeech = meaning.partOfSpeech || "definition";

    meaning.definitions?.forEach(item => {
      if (!item.definition) return;

      const normalised = item.definition.trim().toLowerCase();
      if (seenDefinitions.has(normalised)) return;
      seenDefinitions.add(normalised);

      definitions.push({
        partOfSpeech,
        definition: item.definition,
        example: item.example || ""
      });
    });
  });

  if (!definitions.length) return null;

  return {
    word: firstEntry.word || word,
    phonetic: firstEntry.phonetic || firstEntry.phonetics?.find(item => item.text)?.text || "",
    definitions,
    partOfSpeech: definitions[0].partOfSpeech,
    definition: definitions[0].definition,
    example: definitions[0].example
  };
}

function getFallbackWord(difficulty) {
  const list = FALLBACK_WORDS[difficulty] || FALLBACK_WORDS[3];
  const pick = list[Math.floor(Math.random() * list.length)];
  return {
    ...pick,
    definitions: [{
      partOfSpeech: pick.partOfSpeech || "definition",
      definition: pick.definition,
      example: pick.example || ""
    }],
    source: "Offline fallback"
  };
}

function revealMeaning() {
  if (!currentWord) return;

  const definitions = currentWord.definitions?.length
    ? currentWord.definitions
    : [{
      partOfSpeech: currentWord.partOfSpeech || "definition",
      definition: currentWord.definition,
      example: currentWord.example || ""
    }];

  els.partOfSpeech.textContent = `${definitions.length} ${definitions.length === 1 ? "definition" : "definitions"}`;
  els.definitionDisplay.innerHTML = "";

  definitions.forEach((item, index) => {
    const article = document.createElement("article");
    article.className = "definition-item";

    const heading = document.createElement("p");
    heading.className = "definition-heading";
    heading.textContent = `${index + 1}. ${item.partOfSpeech || "definition"}`;

    const definition = document.createElement("p");
    definition.className = "definition-text";
    definition.textContent = item.definition;

    article.append(heading, definition);

    if (item.example) {
      const example = document.createElement("p");
      example.className = "example";
      example.textContent = `Example: ${item.example}`;
      article.appendChild(example);
    }

    els.definitionDisplay.appendChild(article);
  });

  els.exampleDisplay.hidden = true;
  els.exampleDisplay.textContent = "";

  els.meaningPanel.hidden = false;
  els.answerButtons.hidden = false;
  els.showMeaningButton.hidden = true;
  els.statusMessage.textContent = "Scroll the definitions if needed, then choose honestly.";
}

async function answerWord(wasKnown) {
  if (!game || !currentWord) return;

  const points = wasKnown ? POINTS_BY_DIFFICULTY[game.difficulty] : 0;
  game.score += points;
  game.knownCount += wasKnown ? 1 : 0;
  game.unknownCount += wasKnown ? 0 : 1;
  game.answeredWords.push({
    word: currentWord.word,
    difficulty: game.difficulty,
    points,
    known: wasKnown
  });

  if (game.wordNumber >= game.length) {
    finishGame();
    return;
  }

  game.difficulty = clampDifficulty(game.difficulty + (wasKnown ? 1 : -1));
  game.wordNumber += 1;
  await loadWord();
}

function finishGame() {
  els.finalScoreDisplay.textContent = `${game.score} points`;
  els.resultSummary.textContent = `${game.length}-word game · ${game.knownCount} known · ${game.unknownCount} not known`;
  els.playerNameInput.value = localStorage.getItem(STORAGE_KEYS.lastName) || "";
  els.saveScoreButton.disabled = false;
  showScreen("result");
  setActiveBoard(game.length);
  els.playerNameInput.focus();
}

function saveCurrentScore() {
  if (!game) return;

  const name = (els.playerNameInput.value || "Player").trim().slice(0, 18) || "Player";
  localStorage.setItem(STORAGE_KEYS.lastName, name);

  const scores = getHighScores();
  const board = scores[game.length] || [];
  board.push({
    name,
    score: game.score,
    known: game.knownCount,
    unknown: game.unknownCount,
    date: new Date().toISOString()
  });

  scores[game.length] = board
    .sort((a, b) => b.score - a.score || b.known - a.known || new Date(a.date) - new Date(b.date))
    .slice(0, 10);

  saveHighScores(scores);
  els.saveScoreButton.disabled = true;
  renderLeaderboard();
  els.statusMessage.textContent = "Score saved.";
}

function clearScores() {
  const confirmed = confirm(`Clear the ${activeBoard}-word high score list?`);
  if (!confirmed) return;
  const scores = getHighScores();
  scores[activeBoard] = [];
  saveHighScores(scores);
  renderLeaderboard();
}

function attachEvents() {
  els.lengthButtons.forEach(button => {
    button.addEventListener("click", () => startGame(Number(button.dataset.length)));
  });

  els.showMeaningButton.addEventListener("click", revealMeaning);
  els.knownButton.addEventListener("click", () => answerWord(true));
  els.notKnownButton.addEventListener("click", () => answerWord(false));
  els.quitButton.addEventListener("click", () => {
    if (confirm("End this game without saving the score?")) {
      game = null;
      showScreen("setup");
    }
  });

  els.saveScoreButton.addEventListener("click", saveCurrentScore);
  els.playAgainButton.addEventListener("click", () => showScreen("setup"));
  els.clearScoresButton.addEventListener("click", clearScores);

  els.tabButtons.forEach(button => {
    button.addEventListener("click", () => setActiveBoard(button.dataset.board));
  });
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  }
}

attachEvents();
renderLeaderboard();
registerServiceWorker();
