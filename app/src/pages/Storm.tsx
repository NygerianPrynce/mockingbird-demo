import { useEffect, useRef, useState } from 'react'
import { setDemo } from '../store'
import { useRelay } from '../lib/relay'

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
    stop() { clearInterval(cid); try { wind.stop(); lfo.stop(); hum.stop() } catch { /* ignore */ } if (ctx.state !== 'closed') ctx.close() },
  }
}

const NEXT = '#/live'

// Presenter-driven ambience. The presenter narrates over it. B = transformer blows and the power cuts. N = next screen.
// Optional real footage: drop a clip at app/public/storm.mp4 and it plays behind the snow.
export default function Storm() {
  const cv = useRef<HTMLCanvasElement>(null)
  const au = useRef<ReturnType<typeof makeAudio> | null>(null)
  const [out, setOut] = useState(false)
  const [needsClick, setNeedsClick] = useState(false)
  const [video, setVideo] = useState(false)
  const outRef = useRef(false)
  outRef.current = out

  const startSound = () => { au.current?.stop(); au.current = makeAudio(); au.current.ctx.resume(); au.current.fadeIn(); setNeedsClick(false) }
  const blackout = () => { if (outRef.current) return; setOut(true); au.current?.pop() }

  useEffect(() => {
    startSound()
    const id = setTimeout(() => { if (au.current?.ctx.state !== 'running') setNeedsClick(true) }, 400)
    fetch('/storm.mp4', { method: 'HEAD' }).then((r) => setVideo(r.ok && (r.headers.get('content-type') ?? '').startsWith('video'))).catch(() => {})
    const k = (e: KeyboardEvent) => { if (e.key === 'b' || e.key === 'B') blackout() }
    addEventListener('keydown', k)
    return () => { clearTimeout(id); removeEventListener('keydown', k); au.current?.stop() }
  }, [])

  // The phone can dial while this screen is up: jump to the call screen and let it pick up.
  useRelay((m) => { if (m.from === 'phone' && m.type === 'dial') { setDemo({ pendingDial: true }); location.hash = NEXT } })

  // snowfall
  useEffect(() => {
    const c = cv.current!, g = c.getContext('2d')!
    let w = 0, h = 0, raf = 0
    const flakes = Array.from({ length: 220 }, () => ({ x: Math.random(), y: Math.random(), r: 0.8 + Math.random() * 2.8, v: 0.4 + Math.random() * 1.2, d: Math.random() * Math.PI * 2 }))
    const size = () => { w = c.width = c.clientWidth; h = c.height = c.clientHeight }
    size(); addEventListener('resize', size)
    const tick = () => {
      g.clearRect(0, 0, w, h)
      for (const f of flakes) {
        f.y += (f.v * f.r * 0.9) / h * 2.2; f.d += 0.01; f.x += (Math.sin(f.d) * 0.4 + 0.9) / w * 1.2
        if (f.y > 1) { f.y = -0.02; f.x = Math.random() }
        if (f.x > 1.02) f.x = -0.02
        g.beginPath(); g.fillStyle = `rgba(255,255,255,${0.35 + f.r / 5})`; g.arc(f.x * w, f.y * h, f.r, 0, Math.PI * 2); g.fill()
      }
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', size) }
  }, [])

  return (
    <div className={'storm' + (out ? ' dark' : '')}>
      {video && <video className="storm-video" src="/storm.mp4" autoPlay muted loop playsInline />}
      <div className="storm-frost" aria-hidden="true" />
      <canvas ref={cv} className="storm-snow" aria-hidden="true" />
      <div className="storm-cap">
        <p className="storm-date">January 24, 2026</p>
        <p className="storm-place">Nashville, Tennessee</p>
        {out && <p className="storm-out slide">Power out.</p>}
      </div>
      {needsClick && <button className="btn light" style={{ position: 'absolute' }} onClick={startSound}>Start sound</button>}
      <div className="storm-hint controls">
        <button className="btn sm light" onClick={blackout} disabled={out}>Transformer blows (B)</button>
        <a className="btn sm light" href={NEXT}>Next: the call (N)</a>
      </div>
    </div>
  )
}
