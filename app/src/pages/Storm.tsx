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
  return {
    ctx, master,
    fadeIn() { master.gain.linearRampToValueAtTime(0.7, ctx.currentTime + 3) },
    stop() { clearInterval(cid); try { wind.stop(); lfo.stop() } catch { /* ignore */ } if (ctx.state !== 'closed') ctx.close() },
  }
}

const NEXT = '#/live'

// Presenter narrates over drone footage of the storm. Put the clip at app/public/storm.mp4.
// With no clip, falls back to falling snow and synthesized wind. The situation plays out for real: no staged blackout.
export default function Storm() {
  const cv = useRef<HTMLCanvasElement>(null)
  const au = useRef<ReturnType<typeof makeAudio> | null>(null)
  const vid = useRef<HTMLVideoElement>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'none'>('loading')

  // no clip? fall back to snow and synthesized wind
  useEffect(() => {
    if (state !== 'none') return
    au.current = makeAudio(); au.current.ctx.resume(); au.current.fadeIn()
    return () => au.current?.stop()
  }, [state])

  // play the clip with its own sound; if the browser blocks sound, play it muted rather than not at all
  useEffect(() => {
    const v = vid.current
    if (!v) return
    v.muted = false
    v.play().catch(() => { v.muted = true; v.play().catch(() => {}) })
  }, [])

  // The phone can dial while this screen is up: jump to the call screen and let it pick up. S does the same without a phone.
  const dial = () => { setDemo({ pendingDial: true }); location.hash = NEXT }
  useRelay((m) => { if (m.from === 'phone' && m.type === 'dial') dial() })
  useEffect(() => {
    const k = (ev: KeyboardEvent) => { if (ev.key === 's' || ev.key === 'S') dial() }
    addEventListener('keydown', k)
    return () => removeEventListener('keydown', k)
  }, [])

  useEffect(() => {
    if (state !== 'none') return
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
  }, [state])

  return (
    <div className="storm">
      {state !== 'none' && <video ref={vid} className={'storm-video' + (state === 'ready' ? ' ready' : '')} src={`${import.meta.env.BASE_URL}storm.mp4`} autoPlay loop playsInline preload="auto" onCanPlay={() => setState('ready')} onError={() => setState('none')} />}
      {state === 'none' && <><div className="storm-frost" aria-hidden="true" /><canvas ref={cv} className="storm-snow" aria-hidden="true" /></>}
      <div className="storm-center">
        <p className="storm-date big">January 24, 2026</p>
        <p className="storm-place big">Nashville, Tennessee</p>
        <ul className="storm-bullets">
          <li style={{ animationDelay: '4.2s' }}>FEMA Individual Assistance added for 29 counties more than two months after the storm</li>
          <li style={{ animationDelay: '6.4s' }}>Disaster unemployment opened 88 days after the storm</li>
        </ul>
        <p className="storm-later">Two months later, James calls.</p>
      </div>
    </div>
  )
}
