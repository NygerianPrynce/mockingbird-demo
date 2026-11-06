import { useEffect, useRef } from 'react'
import type { Engine } from './conversation'
import { relaySend, useRelay } from './relay'
import { keyTone } from './dtmf'
import { getDemo, setDemo } from '../store'

// One ring, like a phone picking up. Silent if the browser blocks audio until a click.
export function ring(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const ctx = new AudioContext(); const t = ctx.currentTime
      ;[0, 0.45].forEach((d) => {
        for (const f of [440, 480]) {
          const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = f; o.connect(g); g.connect(ctx.destination)
          g.gain.setValueAtTime(0.0001, t + d); g.gain.linearRampToValueAtTime(0.12, t + d + 0.02); g.gain.setValueAtTime(0.12, t + d + 0.35); g.gain.linearRampToValueAtTime(0.0001, t + d + 0.4)
          o.start(t + d); o.stop(t + d + 0.42)
        }
      })
      setTimeout(() => { if (ctx.state !== 'closed') ctx.close(); resolve() }, 1500)
    } catch { setTimeout(resolve, 800) }
  })
}

// The phone is the only way in. The presenter screen just shows what the call is doing.
// A dial from the phone starts the conversation on whichever screen is showing. Hotkey S starts it without a phone (testing).
export function usePhoneCall(e: Engine) {
  const eRef = useRef(e); eRef.current = e
  const busy = useRef(false)
  const answer = () => {
    const x = eRef.current
    if (busy.current) return
    busy.current = true
    x.reset(); x.setRemote(true)
    ring().then(() => { relaySend({ from: 'screen', type: 'connected' }); x.start(); busy.current = false })
  }
  useRelay((m) => {
    if (m.from !== 'phone') return
    const x = eRef.current
    if (m.type === 'dial') answer()
    if (m.type === 'hangup') x.wrap()
    if (m.type === 'interim' && x.getPhase() === 'listening') x.hear(m.text ?? '')
    if (m.type === 'final' && x.getPhase() === 'listening' && m.text) x.submit(m.text)
    if (m.type === 'key' && m.text && x.getPhase() === 'listening') { keyTone(m.text); x.setKeyCount((n) => (m.text === '*' ? Math.max(0, n - 1) : n + 1)) }
    if (m.type === 'digits' && m.text) x.enterDigits(m.text)
  })
  useEffect(() => { x_sync() }, [e.phase, e.awaiting])
  function x_sync() { relaySend({ from: 'screen', type: 'phase', phase: eRef.current.phase, kp: eRef.current.awaiting ? { length: eRef.current.awaiting.length, label: eRef.current.awaiting.label } : null }) }
  useEffect(() => {
    e.setRemote(true); e.warm()
    if (getDemo().pendingDial) { setDemo({ pendingDial: false }); answer() }
    // testing without a phone: S start, K answer with the suggested line, R reset
    const k = (ev: KeyboardEvent) => {
      const t = ev.target as HTMLElement
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return
      if (ev.key === 's' || ev.key === 'S') answer()
      if (ev.key === 'k' || ev.key === 'K') eRef.current.skip()
      if (ev.key === 'r' || ev.key === 'R') eRef.current.reset()
    }
    addEventListener('keydown', k)
    return () => removeEventListener('keydown', k)
  }, [])
}
