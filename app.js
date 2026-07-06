const RANDOM_WORD_ENDPOINT = "https://random-word-api.herokuapp.com/word?number=5&diff=5";
const DICTIONARY_ENDPOINT = word => `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;

const STORAGE_KEYS = {
  known: "vocabBuilder.knownCount",
  learned: "vocabBuilder.learnedCount"
};

const FALLBACK_WORDS = [
  {
    word: "perspicacious",
    phonetic: "/ˌpɜːspɪˈkeɪʃəs/",
    partOfSpeech: "adjective",
    definition: "Having a ready and accurate understanding of things; mentally sharp.",
    example: "Her perspicacious comments made the problem much easier to diagnose."
  },
  {
    word: "obdurate",
    phonetic: "/ˈɒbdjʊrət/",
    partOfSpeech: "adjective",
    definition: "Stubbornly refusing to change an opinion or course of action.",
    example: "The committee remained obdurate despite several reasonable objections."
  },
  {
    word: "pellucid",
    phonetic: "/pəˈluːsɪd/",
    partOfSpeech: "adjective",
    definition: "Translucently clear, or easy to understand.",
    example: "The speaker gave a pellucid explanation of a difficult concept."
  },
  {
    word: "recalcitrant",
    phonetic: "/rɪˈkælsɪtrənt/",
    partOfSpeech: "adjective",
    definition: "Resistant to authority, control, or instruction.",
    example: "The recalcitrant system ignored the usual reset commands."
  },
  {
    word: "sesquipedalian",
    phonetic: "/ˌsɛskwɪpɪˈdeɪlɪən/",
    partOfSpeech: "adjective",
    definition: "Characterised by long words; polysyllabic.",
    example: "His sesquipedalian style was impressive but not always clear."
  }
];

const els = {
  knownCount: document.querySelector("#knownCount"),
  learnedCount: document.querySelector("#learnedCount"),
  sourceBadge: document.querySelector("#sourceBadge"),
  skipButton: document.querySelector("#skipButton"),
  wordDisplay: document.querySelector("#wordDisplay"),
  phoneticDisplay: document.querySelector("#phoneticDisplay"),
  showMeaningButton: document.querySelector("#showMeaningButton"),
  meaningPanel: document.querySelector("#meaningPanel"),
  partOfSpeech: document.querySelector("#partOfSpeech"),
  definitionDisplay: document.querySelector("#definitionDisplay"),
  exampleDisplay: document.querySelector("#exampleDisplay"),
  answerButtons: document.querySelector("#answerButtons"),
  knownButton: document.querySelector("#knownButton"),
  learnedButton: document.querySelector("#learnedButton"),
  nextWordButton: document.querySelector("#nextWordButton"),
  statusMessage: document.querySelector("#statusMessage"),
  resetButton: document.querySelector("#resetButton")
};

let currentEntry = null;
let currentWordScored = false;

function getCount(key) {
  return Number.parseInt(localStorage.getItem(key) || "0", 10);
}

function setCount(key, value) {
  localStorage.setItem(key, String(value));
}

function updateCounters() {
  els.knownCount.textContent = getCount(STORAGE_KEYS.known);
  els.learnedCount.textContent = getCount(STORAGE_KEYS.learned);
}

function setStatus(message) {
  els.statusMessage.textContent = message;
}

function setLoading(isLoading) {
  els.showMeaningButton.disabled = isLoading || !currentEntry;
  els.skipButton.disabled = isLoading;
  els.nextWordButton.disabled = isLoading;
}

function resetWordView() {
  currentEntry = null;
  currentWordScored = false;
  els.wordDisplay.textContent = "Loading…";
  els.phoneticDisplay.hidden = true;
  els.phoneticDisplay.textContent = "";
  els.meaningPanel.hidden = true;
  els.partOfSpeech.textContent = "";
  els.definitionDisplay.textContent = "";
  els.exampleDisplay.hidden = true;
  els.exampleDisplay.textContent = "";
  els.answerButtons.hidden = true;
  els.nextWordButton.hidden = true;
  els.showMeaningButton.hidden = false;
  els.showMeaningButton.disabled = true;
}

async function fetchJson(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal, cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function cleanCandidateWord(word) {
  return String(word || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z\-']/g, "");
}

async function fetchCandidateWords() {
  const words = await fetchJson(RANDOM_WORD_ENDPOINT);
  if (!Array.isArray(words)) {
    return [];
  }

  return [...new Set(words.map(cleanCandidateWord).filter(Boolean))];
}

function pickBestDefinition(dictionaryData) {
  if (!Array.isArray(dictionaryData) || !dictionaryData.length) {
    return null;
  }

  for (const entry of dictionaryData) {
    for (const meaning of entry.meanings || []) {
      for (const definition of meaning.definitions || []) {
        if (definition.definition) {
          return {
            word: entry.word,
            phonetic: entry.phonetic || (entry.phonetics || []).find(item => item.text)?.text || "",
            partOfSpeech: meaning.partOfSpeech || "",
            definition: definition.definition,
            example: definition.example || "",
            source: "API word"
          };
        }
      }
    }
  }

  return null;
}

async function fetchDefinition(word) {
  const dictionaryData = await fetchJson(DICTIONARY_ENDPOINT(word));
  return pickBestDefinition(dictionaryData);
}

async function getApiEntry() {
  const maxBatches = 4;

  for (let batch = 0; batch < maxBatches; batch += 1) {
    const candidates = await fetchCandidateWords();

    for (const word of candidates) {
      try {
        const entry = await fetchDefinition(word);
        if (entry) {
          return entry;
        }
      } catch (error) {
        console.warn(`No usable definition for ${word}`, error);
      }
    }
  }

  throw new Error("Could not find a random word with a usable definition.");
}

function getFallbackEntry() {
  const index = Math.floor(Math.random() * FALLBACK_WORDS.length);
  return {
    ...FALLBACK_WORDS[index],
    source: "Offline backup"
  };
}

function renderEntry(entry) {
  currentEntry = entry;
  currentWordScored = false;

  els.wordDisplay.textContent = entry.word;
  els.sourceBadge.textContent = entry.source || "API word";

  if (entry.phonetic) {
    els.phoneticDisplay.textContent = entry.phonetic;
    els.phoneticDisplay.hidden = false;
  } else {
    els.phoneticDisplay.hidden = true;
  }

  els.partOfSpeech.textContent = entry.partOfSpeech || "definition";
  els.definitionDisplay.textContent = entry.definition;

  if (entry.example) {
    els.exampleDisplay.textContent = `Example: ${entry.example}`;
    els.exampleDisplay.hidden = false;
  } else {
    els.exampleDisplay.hidden = true;
  }

  els.meaningPanel.hidden = true;
  els.answerButtons.hidden = true;
  els.nextWordButton.hidden = true;
  els.showMeaningButton.hidden = false;
  els.showMeaningButton.disabled = false;
}

async function loadNewWord() {
  resetWordView();
  setLoading(true);
  setStatus("Fetching a hard random word…");

  try {
    const entry = await getApiEntry();
    renderEntry(entry);
    setStatus("Word ready. Reveal the meaning when you are ready.");
  } catch (error) {
    console.warn(error);
    renderEntry(getFallbackEntry());
    setStatus("Using an offline backup word because the API did not return a usable result.");
  } finally {
    setLoading(false);
  }
}

function showMeaning() {
  if (!currentEntry) return;

  els.meaningPanel.hidden = false;
  els.answerButtons.hidden = false;
  els.showMeaningButton.hidden = true;
  setStatus("Mark whether this word was already known or newly learned.");
}

function scoreCurrentWord(type) {
  if (!currentEntry || currentWordScored) return;

  const key = type === "known" ? STORAGE_KEYS.known : STORAGE_KEYS.learned;
  setCount(key, getCount(key) + 1);
  currentWordScored = true;
  updateCounters();

  els.answerButtons.hidden = true;
  els.nextWordButton.hidden = false;

  const resultText = type === "known" ? "already known" : "newly learned";
  setStatus(`Marked “${currentEntry.word}” as ${resultText}.`);
}

function resetCounters() {
  const shouldReset = window.confirm("Reset both counters back to zero?");
  if (!shouldReset) return;

  setCount(STORAGE_KEYS.known, 0);
  setCount(STORAGE_KEYS.learned, 0);
  updateCounters();
  setStatus("Counters reset.");
}

els.showMeaningButton.addEventListener("click", showMeaning);
els.knownButton.addEventListener("click", () => scoreCurrentWord("known"));
els.learnedButton.addEventListener("click", () => scoreCurrentWord("learned"));
els.nextWordButton.addEventListener("click", loadNewWord);
els.skipButton.addEventListener("click", loadNewWord);
els.resetButton.addEventListener("click", resetCounters);

updateCounters();
loadNewWord();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(error => {
      console.warn("Service worker registration failed", error);
    });
  });
}
