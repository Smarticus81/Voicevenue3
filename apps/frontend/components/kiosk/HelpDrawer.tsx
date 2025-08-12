"use client";
import { useState } from "react";

export default function HelpDrawer() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={()=>setOpen(!open)}
        className="fixed right-4 bottom-4 z-[900] px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-sm"
      >
        Help
      </button>
      {open && (
        <div className="fixed inset-0 z-[901] bg-black/60" onClick={()=>setOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-black/80 border-l border-white/15 p-6" onClick={(e)=>e.stopPropagation()}>
            <div className="text-lg font-semibold mb-2">How to use</div>
            <ol className="list-decimal list-inside space-y-2 text-white/80 text-sm">
              <li>Press <b>Start</b>, then say <b>“Hey Bev”</b>.</li>
              <li>Speak your command: <i>“Add two margaritas to Alex’s tab.”</i></li>
              <li>Bev will speak back and show a checkmark.</li>
            </ol>
            <div className="mt-4 text-sm text-white/60">
              If you see <b>Offline</b>, wait a moment—Bev reconnects automatically.
            </div>
            <div className="mt-2 text-sm text-white/60">
              Staff only. If prompted, enter your <b>PIN</b>.
            </div>
          </div>
        </div>
      )}
    </>
  );
}



