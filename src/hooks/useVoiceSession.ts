"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { VoiceSession } from "@/lib/voice";
import { levenshteinDistance } from "@/lib/levenshtein";

export function useVoiceSession() {
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const sessionRef = useRef<VoiceSession | null>(null);
  const recognitionRef = useRef<any>(null);
  const wakeWordWorkerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Initialize wake word worker
    if (typeof window !== "undefined" && "Worker" in window) {
      wakeWordWorkerRef.current = new Worker("/wakeword.worker.js");
      wakeWordWorkerRef.current.onmessage = (e) => {
        if (e.data.type === "wakeword" && !isActive) {
          startSession({
            agentId: "default",
            instructions: "You are a helpful assistant",
            voice: "alloy",
            temperature: 0.7,
            wakeWord: "Hey Venue",
          });
        }
      };
    }

    return () => {
      wakeWordWorkerRef.current?.terminate();
    };
  }, [isActive]);

  const startSession = useCallback(async (config: {
    agentId: string;
    instructions: string;
    voice: string;
    temperature: number;
    wakeWord: string;
  }) => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    sessionRef.current = new VoiceSession(sessionId);
    
    try {
      await sessionRef.current.start({
        instructions: config.instructions,
        voice: config.voice,
        temperature: config.temperature,
        tools: [],
      });

      setIsActive(true);
      setIsListening(true);

      // Start wake word detection
      if (wakeWordWorkerRef.current) {
        wakeWordWorkerRef.current.postMessage({
          type: "config",
          wakeWord: config.wakeWord,
          threshold: 2,
        });
      }

      // Setup speech recognition for commands
      if ("webkitSpeechRecognition" in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event: any) => {
          const last = event.results.length - 1;
          const text = event.results[last][0].transcript;
          setTranscript(text);

          if (event.results[last].isFinal) {
            // Check for wake word
            if (wakeWordWorkerRef.current) {
              wakeWordWorkerRef.current.postMessage({
                type: "check",
                text: text.toLowerCase(),
              });
            }
          }
        };

        recognitionRef.current.start();
      }
    } catch (error) {
      console.error("Failed to start voice session:", error);
      setIsActive(false);
    }
  }, []);

  const stopSession = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.stop();
      sessionRef.current = null;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    setIsActive(false);
    setIsListening(false);
    setTranscript("");
  }, []);

  const toggleListening = useCallback(() => {
    if (!isActive) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else if (!isListening && recognitionRef.current) {
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isActive, isListening]);

  return {
    isActive,
    isListening,
    transcript,
    startSession,
    stopSession,
    toggleListening,
  };
}
