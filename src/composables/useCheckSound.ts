// Soft two-note "ding" played when an item is being checked. Generated via
// Web Audio so we don't ship a binary asset and stay friendly to the PWA
// budget. Lazy-creates the AudioContext on first call (must be inside a
// user gesture to satisfy iOS Safari's autoplay policy).

let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (ctx) return ctx
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  try {
    ctx = new Ctor()
  } catch {
    return null
  }
  return ctx
}

function tone(c: AudioContext, start: number, freq: number, duration: number, peak = 0.16) {
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  // Quick attack, exponential decay — feels like a soft glass tap.
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(gain).connect(c.destination)
  osc.start(start)
  osc.stop(start + duration + 0.02)
}

export function playCheckSound(): void {
  const c = getCtx()
  if (!c) return
  if (c.state === 'suspended') {
    c.resume().catch(() => undefined)
  }
  const now = c.currentTime
  // E5 → A5 ascending — small, warm, definitely "completed".
  tone(c, now, 659.25, 0.14)
  tone(c, now + 0.05, 880.0, 0.18)
}
