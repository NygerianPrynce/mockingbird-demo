import { useEffect, useRef, useState } from 'react'
import { createListener, speechSupported } from '../lib/speech'
import { relaySend, useRelay } from '../lib/relay'
import icon from '../assets/mockingbird-icon.svg'
import { Keypad } from '../components/Keypad'
import { Orb } from '../components/Orb'

// The "handset". Open this page on a phone. It looks like a call, but speech goes to the presenter screen over the web.
type St = 'idle' | 'ringing' | 'connected' | 'ended'
const NUMBER = '(615) 555-0100'

export default function Phone() {
  const [st, setSt] = useState<St>('idle')
  const [secs, setSecs] = useState(0)
  const [heard, setHeard] = useState('')
  const [err, setErr] = useState('')
  const [kp, setKp] = useState<{ length: number; label: string } | null>(null)
  const phase = useRef('idle')
  const [ph, setPh] = useState('idle')
  const stRef = useRef<St>('idle')
  stRef.current = st
  const kpRef = useRef<typeof kp>(null)
  kpRef.current = kp
  const listener = useRef<ReturnType<typeof createListener> | null>(null)

  const sync = () => {
    if (!listener.current) listener.current = createListener({
      onInterim: (t) => setHeard(t),
      onFinal: (t) => { setHeard(t); relaySend({ from: 'phone', type: 'final', text: t }) },
      onError: (m) => setErr(m),
    }, { quietMs: 850 })
    if (stRef.current === 'connected' && phase.current === 'listening' && !kpRef.current) listener.current.start(); else listener.current.stop()
  }
  useRelay((m) => {
    if (m.from !== 'screen') return
    if (m.type === 'connected') { setSt('connected'); setSecs(0) }
    if (m.type === 'phase') {
      phase.current = m.phase ?? 'idle'; setPh(m.phase ?? 'idle')
      setKp(m.kp ?? null); kpRef.current = m.kp ?? null
      if (m.phase === 'done') setTimeout(() => { setSt('ended'); listener.current?.stop() }, 2500)
      sync()
    }
  })
  useEffect(() => { if (st !== 'connected') return; const id = setInterval(() => setSecs((x) => x + 1), 1000); return () => clearInterval(id) }, [st])
  useEffect(() => () => listener.current?.stop(), [])

  const dial = async () => {
    setErr('')
    try { const s = await navigator.mediaDevices.getUserMedia({ audio: true }); s.getTracks().forEach((t) => t.stop()) } catch { setErr('Allow the microphone to talk to Mockingbird.') }
    setSt('ringing')
    relaySend({ from: 'phone', type: 'dial' })
    setTimeout(() => { if (stRef.current === 'ringing') setErr('Nobody picked up. Is the demo screen open?') }, 12000)
  }
  const hang = () => { listener.current?.stop(); relaySend({ from: 'phone', type: 'hangup' }); setSt('ended') }
  const mmss = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`

  return (
    <div className="handset">
      <div className="hs-status"><span>9:41</span><span>5G</span></div>
      {st === 'idle' && (
        <div className="hs-body">
          <img src={icon} width={96} height={96} alt="" className="hs-logo" />
          <h1>Mockingbird Hotline</h1>
          <p className="hs-num">{NUMBER}</p>
          <p className="hs-sub">Help is one call away.</p>
          <button className="hs-call" onClick={dial} aria-label="Call Mockingbird">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.6 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.3.2 2.5.6 3.6a1 1 0 0 1-.25 1z" /></svg>
          </button>
          {!speechSupported() && <p className="hs-err">This browser cannot hear you. Use Chrome (Android) or Safari (iPhone), or use the box below.</p>}
        </div>
      )}
      {(st === 'ringing' || st === 'connected') && (
        <div className="hs-body">
          {st === 'connected' ? <div className="hs-orb"><Orb phase={ph} size={210} synthetic /></div> : <img src={icon} width={96} height={96} alt="" className="hs-logo" />}
          <h1>Mockingbird Hotline</h1>
          <p className="hs-num">{st === 'ringing' ? 'Calling...' : mmss}</p>
          {st === 'connected' && <p className="hs-heard" aria-live="polite">{phase.current === 'listening' ? (heard || 'Go ahead, I’m listening') : ' '}</p>}
          {kp && st === 'connected'
            ? <div style={{ marginTop: 14 }}><Keypad dark length={kp.length} label={kp.label} onCount={(n) => relaySend({ from: 'phone', type: 'keycount', text: String(n) })} onDone={(d) => relaySend({ from: 'phone', type: 'digits', text: d })} /></div>
            : <div className="hs-grid" aria-hidden="true">{['mute', 'keypad', 'speaker'].map((b) => <span key={b}>{b}</span>)}</div>}
          <button className="hs-end" onClick={hang} aria-label="End call"><svg width="30" height="30" viewBox="0 0 24 24" fill="#fff" aria-hidden="true" style={{ transform: 'rotate(135deg)' }}><path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.6 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.3.2 2.5.6 3.6a1 1 0 0 1-.25 1z" /></svg></button>
        </div>
      )}
      {st === 'ended' && (
        <div className="hs-body"><img src={icon} width={72} height={72} alt="" className="hs-logo" /><h1>Call ended</h1><p className="hs-num">{mmss}</p>
          <button className="hs-redial" onClick={() => setSt('idle')}>Call again</button></div>
      )}
      {err && <p className="hs-err">{err}</p>}
    </div>
  )
}
