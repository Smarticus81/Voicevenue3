// Levenshtein distance calculation
function levenshteinDistance(a, b) {
  const matrix = [];

  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

let wakeWord = "hey venue";
let threshold = 2;
let lastDetection = 0;
const DETECTION_WINDOW = 1200; // 1.2 seconds

self.onmessage = function(e) {
  if (e.data.type === "config") {
    wakeWord = e.data.wakeWord.toLowerCase();
    threshold = e.data.threshold || 2;
  } else if (e.data.type === "check") {
    const text = e.data.text.toLowerCase();
    const words = text.split(" ");
    const wakeWords = wakeWord.split(" ");
    
    // Check for wake word in sliding window
    for (let i = 0; i <= words.length - wakeWords.length; i++) {
      const phrase = words.slice(i, i + wakeWords.length).join(" ");
      const distance = levenshteinDistance(phrase, wakeWord);
      
      if (distance <= threshold) {
        const now = Date.now();
        if (now - lastDetection > DETECTION_WINDOW) {
          lastDetection = now;
          self.postMessage({ 
            type: "wakeword", 
            detected: true,
            phrase: phrase,
            distance: distance
          });
        }
        break;
      }
    }
  }
};
