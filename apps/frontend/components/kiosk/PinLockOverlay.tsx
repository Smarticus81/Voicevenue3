"use client";
import { useEffect, useRef, useState } from "react";

export default function PinLockOverlay({
  venueId = "demo-venue",
  onUnlocked,
  relockMs = 5 * 60 * 1000,
}: {
  venueId?: string;
  onUnlocked: () => void;
  relockMs?: number;
}) {
  const [locked, setLocked] = useState(true);
  const [err, setErr] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pinRequired, setPinRequired] = useState<boolean | null>(null);

  const armRelock = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setLocked(true), relockMs);
  };

  const unlock = async (pin: string) => {
    const r = await fetch("/api/settings/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ venueId, verifyPin: pin }),
    });
    const d = await r.json().catch(() => ({}));
    if (d?.ok) {
      setErr("");
      setLocked(false);
      sessionStorage.setItem("bev_kiosk_unlocked", String(Date.now()));
      onUnlocked?.();
      armRelock();
    } else {
      setErr(d?.error || "Incorrect PIN");
    }
  };

  useEffect(() => {
    // Check if a PIN exists; if not, disable lock for friendlier kiosk UX
    (async () => {
      try {
        const r = await fetch(`/api/settings/vendor?venueId=${venueId}`);
        const d = await r.json();
        const hasPin = Boolean(d?.kioskPinHash);
        setPinRequired(hasPin);
        if (!hasPin) {
          setLocked(false);
        }
      } catch {
        setPinRequired(true); // safe default
      }
    })();

    const last = Number(sessionStorage.getItem("bev_kiosk_unlocked") || 0);
    if (Date.now() - last < relockMs) {
      setLocked(false);
      armRelock();
    }
    const reset = () => armRelock();
    window.addEventListener("mousemove", reset);
    window.addEventListener("keydown", reset);
    window.addEventListener("click", reset);
    return () => {
      window.removeEventListener("mousemove", reset);
      window.removeEventListener("keydown", reset);
      window.removeEventListener("click", reset);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [relockMs]);

  if (!locked || pinRequired === false) return null;
  if (pinRequired === null) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur flex items-center justify-center">
      <div className="w-full max-w-xs p-6 rounded-2xl bg-white/10 border border-white/20">
        <div className="text-lg font-semibold mb-2">Staff PIN Required</div>
        <p className="text-sm text-white/70 mb-4">This kiosk is staff-only.</p>
        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          pattern="\d*"
          maxLength={8}
          placeholder="Enter PIN"
          className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/20"
          onKeyDown={(e) => {
            if (e.key === "Enter") unlock((e.target as HTMLInputElement).value);
          }}
        />
        {err && <div className="text-xs text-red-300 mt-2">{err}</div>}
        <div className="mt-4 flex gap-2">
          <button
            className="flex-1 px-3 py-2 rounded-xl bg-emerald-500 text-black font-semibold"
            onClick={() => unlock(inputRef.current?.value || "")}
          >
            Unlock
          </button>
        </div>
      </div>
    </div>
  );
}



