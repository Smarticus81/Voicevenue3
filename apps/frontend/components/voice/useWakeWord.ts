"use client";
import { useEffect, useRef, useState } from "react";
import { levenshtein } from "./levenshtein";

type WakeConfig = {
  phrase: string;
  maxDistance: number;
};

export function useWakeWord(config: WakeConfig, onWake: () => void) {
  const [supported, setSupported] = useState(true);
  const recRef = useRef<any>(null);

  useEffect(() => {
    const SR: any = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    const rec = new SR();
    recRef.current = rec;
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (e: any) => {
      const chunk = Array.from(e.results)
        .map((r: any) => r[0]?.transcript || "")
        .join(" ")
        .toLowerCase();
      if (!chunk.trim()) return;
      const words = chunk.split(/\s+/).filter(Boolean);
      for (let i = 0; i < words.length; i++) {
        for (let j = i + 1; j <= Math.min(words.length, i + 4); j++) {
          const windowPhrase = words.slice(i, j).join(" ");
          const dist = levenshtein(windowPhrase, config.phrase);
          if (dist <= config.maxDistance) {
            onWake();
            rec.stop();
            setTimeout(() => {
              try {
                rec.start();
              } catch {}
            }, 500);
            return;
          }
        }
      }
    };

    rec.onerror = () => {};
    try {
      rec.start();
    } catch {}
    return () => {
      try {
        rec.stop();
      } catch {}
    };
  }, [config.phrase, config.maxDistance, onWake]);

  return { supported };
}


