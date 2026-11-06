import { useEffect, useRef, useState } from 'react'
import { dayToDate, fmt } from '../data/tn'

// BEAT 2: interlude with synthesized ice-storm sound (WebAudio, no files). Ice storm matches the real Jan 24, 2026 event.
function makeAudio() {
  const ctx = new AudioContext()
  const master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination)
  const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  const noise = () => { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; return s }
  // wind
  const wind = noise(), wf = ctx.createBiquadFilter(); wf.type = 'bandpass'; wf.frequency.value = 500; wf.Q.value = 0.8
  const wg = ctx.createGain(); wg.gain.value = 0.55
  const lfo = ctx.createOscillator(); lfo.frequency.value = 0.18
  const lg = ctx.createGain(); lg.gain.value = 260
  lfo.connect(lg); lg.connect(wf.frequency); wind.connect(wf); wf.connect(wg); wg.connect(master)
  wind.start(); lfo.start()
  // ice crackle
  const crackle = () => {
    const s = noise(), f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 3500
    const g = ctx.createGain(); const t = ctx.currentTime
    g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05)
    s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + 0.06)
  }
  const cid = setInterval(() => { if (Math.random() < 0.7) crackle() }, 160)
  const hum = ctx.createOscillator(); hum.frequency.value = 60
  const hg = ctx.createGain(); hg.gain.value = 0.0; hum.connect(hg); hg.connect(master); hum.start()
  return {
    ctx, master, hg,
    fadeIn() { master.gain.linearRampToValueAtTime(0.7, ctx.currentTime + 3) },
    pop() { // transformer blows: loud burst + low thump, then everything cuts
      const t = ctx.currentTime
      const s = noise(), g = ctx.createGain(); g.gain.setValueAtTime(1, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.5)
      s.connect(g); g.connect(ctx.destination); s.start(t); s.stop(t + 0.5)
      const o = ctx.createOscillator(); o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(30, t + 0.6)
      const og = ctx.createGain(); og.gain.setValueAtTime(1, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.7)
      o.connect(og); og.connect(ctx.destination); o.start(t); o.stop(t + 0.8)
      hg.gain.setValueAtTime(0.25, t); hg.gain.exponentialRampToValueAtTime(0.0001, t + 1.2)
      master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t); master.gain.linearRampToValueAtTime(0.0, t + 0.9)
    },
    stop() { clearInterval(cid); try { wind.stop(); lfo.stop(); hum.stop() } catch { /* ignore */ } ctx.close() },
  }
}

const BEATS: [number, string][] = [
  [0.3, fmt(dayToDate(0))],
  [1.2, 'An ice storm hits Middle Tennessee.'],
  [3, 'Ice builds on the power lines.'],
  [5, 'A transformer blows.'],
  [7, 'Power is out across Nashville.'],
  [8.8, 'James\u2019s warehouse closes. No work. No paycheck.'],
  [10.8, 'Day 4. Still no power. James calls Mockingbird.'],
]
const POP_T = 5

export default function Storm() {
  const [t, setT] = useState(-1)
  const au = useRef<ReturnType<typeof makeAudio> | null>(null)
  useEffect(() => {
    if (t < 0) return
    const id = setInterval(() => setT((x) => x + 0.1), 100)
    return () => clearInterval(id)
  }, [t < 0])
  useEffect(() => { if (t >= POP_T && t < POP_T + 0.12) au.current?.pop() }, [t])
  useEffect(() => () => au.current?.stop(), [])
  const play = () => { au.current?.stop(); au.current = makeAudio(); au.current.ctx.resume(); au.current.fadeIn(); setT(0) }
  const shown = BEATS.filter(([s]) => t >= s)
  const blackout = t >= POP_T + 0.4
  const flash = t >= POP_T && t < POP_T + 0.4
  const done = t >= 12
  return (
    <div className={'storm' + (blackout ? ' dark' : '') + (flash ? ' flash' : '')}>
      {t < 0 ? (
        <div className="storm-card">
          <p className="hint" style={{ color: '#B9CBE3' }}>Step 2 of 5</p>
          <h1 style={{ color: '#fff' }}>The storm</h1>
          <p>Turn your sound up. Press play.</p>
          <button className="btn light" onClick={play}>Play</button>
        </div>
      ) : (
        <div className="storm-card">
          {shown.map(([s, text], i) => (
            <p key={s} className={'storm-line' + (i === 0 ? ' date' : '')} style={{ opacity: i === shown.length - 1 || i < shown.length ? 1 : 0 }}>{text}</p>
          ))}
          {done && <a className="btn light slide" href="#/live" style={{ marginTop: 24 }}>Next: the call</a>}
        </div>
      )}
      {t >= 0 && <button className="storm-skip" onClick={() => { au.current?.stop(); au.current = null; setT(12) }}>Skip</button>}
    </div>
  )
}
