// Crisis tools (VIGIL.md 9.2): the whistle and the screen wake lock. No camera, no permission prompts.

/** SOS pattern in 100 ms units, alternating sound and silence: 3 short, 3 long, 3 short, then a longer pause before the loop. */
export const SOS_UNITS: number[] = [
  1, 1, 1, 1, 1, 3, // S
  3, 1, 3, 1, 3, 3, // O
  1, 1, 1, 1, 1, 7, // S, then the pause
];

/** A 3200 Hz square wave switched on and off in the SOS pattern, looped. Returns a stop function. */
export function startWhistle(): () => void {
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.value = 3200;
  gain.gain.value = 0;
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  let stopped = false;
  let i = 0;
  let timer = 0;
  const step = () => {
    if (stopped) return;
    gain.gain.value = i % 2 === 0 ? 0.6 : 0; // even steps sound, odd steps are silent
    timer = window.setTimeout(step, SOS_UNITS[i % SOS_UNITS.length] * 100);
    i++;
  };
  void ctx.resume();
  step();
  return () => { stopped = true; window.clearTimeout(timer); try { osc.stop(); void ctx.close(); } catch { /* already closed */ } };
}

/** Keeps the screen on while the flashlight is shown; silently does nothing where the API is missing. Returns a release function. */
export async function keepAwake(): Promise<() => void> {
  try {
    const nav = navigator as unknown as { wakeLock?: { request(t: "screen"): Promise<{ release(): Promise<void> }> } };
    const lock = await nav.wakeLock?.request("screen");
    return () => { void lock?.release().catch(() => {}); };
  } catch { return () => {}; }
}
