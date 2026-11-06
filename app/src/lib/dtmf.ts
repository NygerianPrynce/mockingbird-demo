// Phone keypad tones (standard DTMF dual tones).
const ROWS = [697, 770, 852, 941], COLS = [1209, 1336, 1477]
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#']
let ctx: AudioContext | null = null
export function keyTone(key: string) {
  const i = KEYS.indexOf(key)
  if (i < 0) return
  ctx = ctx ?? new AudioContext()
  if (ctx.state === 'suspended') ctx.resume()
  const t = ctx.currentTime
  for (const f of [ROWS[Math.floor(i / 3)], COLS[i % 3]]) {
    const o = ctx.createOscillator(), g = ctx.createGain()
    o.frequency.value = f; o.connect(g); g.connect(ctx.destination)
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.14, t + 0.01); g.gain.setValueAtTime(0.14, t + 0.11); g.gain.linearRampToValueAtTime(0.0001, t + 0.14)
    o.start(t); o.stop(t + 0.15)
  }
  if (navigator.vibrate) navigator.vibrate(12)
}
