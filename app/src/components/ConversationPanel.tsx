import { useEffect, useRef } from 'react'
import type { Engine } from '../lib/conversation'
import { Dots } from './Keypad'
import { Orb } from './Orb'

const STATUS: Record<string, string> = { idle: 'Waiting for a call', speaking: 'Mockingbird', listening: 'Listening', done: 'Call ended' }

// The call, as the audience sees it: the Mockingbird orb warbles as the AI speaks, with the words beneath it.
export function CallPanel({ e, userLabel, number = '(615) 555-0100', size = 230 }: { e: Engine; userLabel: string; number?: string; size?: number }) {
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => { if (box.current) box.current.scrollTop = box.current.scrollHeight }, [e.lines.length, e.interim])
  return (
    <section className="callpanel" aria-label="Call with Mockingbird">
      <div className="orbwrap"><Orb phase={e.phase} size={size} /></div>
      <p className="orb-status">{STATUS[e.phase]}</p>
      {e.phase === 'idle' && <p className="orb-num">{number}</p>}
      <div className="transcript dark" ref={box} aria-live="polite">
        {e.lines.map((l) => (
          <div key={l.id} className={'tline ' + (l.who === 'AI' ? 'ai' : 'you')}><span className="who">{l.who === 'AI' ? 'Mockingbird' : userLabel}</span><span>{l.text}</span></div>
        ))}
        {e.interim && <div className="tline you interim"><span className="who">{userLabel}</span><span>{e.interim}</span></div>}
      </div>
      {e.awaiting && e.phase === 'listening' && (
        <div className="kp-wait"><p>{e.awaiting.label}</p><Dots dark n={e.keyCount} of={e.awaiting.length} /></div>
      )}
    </section>
  )
}
