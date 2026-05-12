// Nawa Sound Notification System — WebAudio API
// Plays synthesized tones — no external files needed

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx || audioCtx.state === "closed") {
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

function resumeCtx(ctx: AudioContext): Promise<void> {
  if (ctx.state === "suspended") return ctx.resume();
  return Promise.resolve();
}

// Generic tone player
function playTone(
  frequencies: number[],
  durations: number[],
  type: OscillatorType = "sine",
  gainLevel = 0.3
): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  resumeCtx(ctx).then(() => {
    let time = ctx.currentTime;
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(gainLevel, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + durations[i]);
      osc.start(time);
      osc.stop(time + durations[i]);
      time += durations[i];
    });
  }).catch(() => {});
}

// 🔔 New message — soft double ping
export function playNewMessage(): void {
  playTone([880, 1100], [0.12, 0.12], "sine", 0.25);
}

// 📧 New email — ascending chime
export function playNewEmail(): void {
  playTone([523, 659, 784], [0.1, 0.1, 0.2], "sine", 0.2);
}

// 💬 New chat message — subtle pop
export function playChatMessage(): void {
  playTone([1046], [0.08], "sine", 0.15);
}

// ✅ Success — pleasant ding
export function playSuccess(): void {
  playTone([523, 784, 1046], [0.08, 0.08, 0.15], "triangle", 0.2);
}

// ⚠️ Alert — urgent tone
export function playAlert(): void {
  playTone([440, 440, 440], [0.1, 0.1, 0.25], "square", 0.15);
}

// 🔕 Notification sound toggle
let soundEnabled = true;
try {
  soundEnabled = localStorage.getItem("nawa_sound") !== "false";
} catch {}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

export function setSoundEnabled(val: boolean): void {
  soundEnabled = val;
  try { localStorage.setItem("nawa_sound", String(val)); } catch {}
}

export function toggleSound(): boolean {
  soundEnabled = !soundEnabled;
  try { localStorage.setItem("nawa_sound", String(soundEnabled)); } catch {}
  return soundEnabled;
}

// Safe wrappers that respect user preference
export function notifyNewMessage(): void {
  if (soundEnabled) playNewMessage();
}
export function notifyNewEmail(): void {
  if (soundEnabled) playNewEmail();
}
export function notifyChatMessage(): void {
  if (soundEnabled) playChatMessage();
}
export function notifySuccess(): void {
  if (soundEnabled) playSuccess();
}
export function notifyAlert(): void {
  if (soundEnabled) playAlert();
}
