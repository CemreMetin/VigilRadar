"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The alarm tone: two short, low, quiet beeps (a soft terminal warning, not a siren), made with the Web Audio
 * API so no audio file is needed. Browsers keep audio locked until the page has had a click or key press, so the
 * first interaction unlocks it; until then the bar tells the user to click.
 */

const MUTE_KEY = "monitoring.alarm.muted.v1";
const REPEAT_MS = 30_000;
const MAX_REPEATS = 5;

function beeps(ctx: AudioContext) {
  const t0 = ctx.currentTime;
  for (const offset of [0, 0.35]) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = 220;
    gain.gain.setValueAtTime(0, t0 + offset);
    gain.gain.linearRampToValueAtTime(0.06, t0 + offset + 0.03);
    gain.gain.linearRampToValueAtTime(0, t0 + offset + 0.25);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0 + offset);
    osc.stop(t0 + offset + 0.27);
  }
}

/** Plays the tone when `active` turns on, then every 30 s (at most 5 more times) until it turns off. */
export function useAlarmSound(active: boolean) {
  const [muted, setMutedState] = useState(false);
  const [locked, setLocked] = useState(false); // sound wanted but the browser has not allowed it yet
  const ctxRef = useRef<AudioContext | null>(null);
  const mutedRef = useRef(false);

  useEffect(() => {
    try {
      const m = window.localStorage.getItem(MUTE_KEY) === "1";
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMutedState(m);
      mutedRef.current = m;
    } catch {
      /* default: sound on */
    }
  }, []);

  const setMuted = (m: boolean) => {
    mutedRef.current = m;
    setMutedState(m);
    try {
      window.localStorage.setItem(MUTE_KEY, m ? "1" : "0");
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (!active) return;
    const play = () => {
      if (mutedRef.current) return;
      try {
        ctxRef.current ??= new AudioContext();
        const ctx = ctxRef.current;
        if (ctx.state === "suspended") ctx.resume().catch(() => {});
        if (ctx.state !== "running") {
          setLocked(true);
          return;
        }
        setLocked(false);
        beeps(ctx);
      } catch {
        /* no audio support: the visual alarm still works */
      }
    };
    const unlock = () => {
      if (ctxRef.current?.state === "suspended") ctxRef.current.resume().then(play).catch(() => {});
      else if (!ctxRef.current) play();
    };
    play();
    let n = 0;
    const timer = setInterval(() => {
      if (++n > MAX_REPEATS) clearInterval(timer);
      else play();
    }, REPEAT_MS);
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      clearInterval(timer);
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [active]);

  return { muted, setMuted, locked: locked && !muted };
}
