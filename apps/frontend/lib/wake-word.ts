import levenshtein from "fast-levenshtein";

// Default wake word
let customWakeWord = "hey bev";
let maxDistance = 2; // Levenshtein distance threshold

export const setWakeWord = (word: string, distance = 2) => {
  customWakeWord = String(word || "hey bev").toLowerCase();
  maxDistance = Math.max(0, Math.min(5, Number(distance)));
};

export const isWakeWord = (text: string) => {
  const input = String(text || "").toLowerCase().trim();
  if (!input) return false;
  return levenshtein.get(input, customWakeWord) <= maxDistance;
};


