import { useEffect, useRef, useState } from 'react'
import type { Engine, Step } from '../lib/conversation'
import { useDemo } from '../store'
import { voiceStatus } from '../lib/speech'
import { Dots, Keypad } from './Keypad'

const mmss = (t: number) => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(Math.floor(t % 60)).padStart(2, '0')}`

export function ConversationPanel({ e, steps, title, sub, userLabel, startLabel, intro }: { e: Engine; steps: Step[]; title: string; sub: string; userLabel: string; startLabel: string; intro: string }) {
  const [text, setText] = useState('')
  const box = useRef<HTMLDivElement>(null)
  const { showCue } = useDemo()
  useEffect(() => { if (box.current) box.current.scrollTop = box.current.scrollHeight }, [e.lines.length, e.interim])
  const status = e.phase === 'speaking' ? 'Mockingbird is speaking' : e.phase === 'listening' ? (e.remote ? 'Listening on the phone' : e.canListen ? 'Listening' : 'Type your answer') : e.phase === 'done' ? 'Done' : 'Ready'
  return (
    <section className="panel" aria-label={title}>
      <header><h3>{title}</h3><span className="caption">{sub}</span></header>
      <div className="body transcript" ref={box} aria-live="polite">
        {e.phase === 'idle' && <p className="hint">{intro}</p>}
        {e.lines.map((l) => (
          <div key={l.id} className={'line ' + (l.who === 'AI' ? 'ai' : '')}>
            <span className="ts">{mmss(l.ts)}</span><span className="who">{l.who === 'AI' ? 'Mockingbird' : userLabel}</span><span>{l.text}</span>
          </div>
        ))}
        {e.interim && <div className="line interim"><span className="ts" /><span className="who">{userLabel}</span><span>{e.interim}</span></div>}
      </div>
      <div className="composer">
        {e.awaiting && e.phase === 'listening' ? (
          <div>
            <div className="status"><span className="dot listening" aria-hidden="true" />Waiting for keypad entry. Nothing is spoken.</div>
            {e.remote
              ? <div style={{ marginTop: 10, textAlign: 'center' }}><p className="kp-label">{e.awaiting.label} on the phone keypad</p><Dots n={e.keyCount} of={e.awaiting.length} /></div>
              : <div style={{ marginTop: 10 }}><Keypad length={e.awaiting.length} label={e.awaiting.label} onDone={e.enterDigits} /></div>}
            <button className="btn sm secondary" type="button" onClick={e.skip} style={{ marginTop: 8 }}>Next</button>
          </div>
        ) : e.phase === 'idle' ? (
          <button className="btn" onClick={e.start}>{startLabel}</button>
        ) : (
          <>
            <div className="status"><span className={'dot ' + e.phase} aria-hidden="true" />{status}</div>
            <form onSubmit={(ev) => { ev.preventDefault(); if (text.trim()) { e.submit(text.trim()); setText('') } }}>
              <input value={text} onChange={(ev) => setText(ev.target.value)} placeholder="Or type an answer" aria-label="Type an answer" disabled={e.phase === 'done'} />
              <button className="btn sm secondary" type="button" onClick={e.skip} disabled={e.phase === 'done'} title="Answer with the suggested line">Next</button>
            </form>
          </>
        )}
        {e.error && <p className="hint" style={{ color: 'var(--tn-red)', margin: '8px 0 0' }}>{e.error}</p>}
        {showCue && e.phase !== 'idle' && e.phase !== 'done' && (
          <div className="cue"><b>Say something like:</b> {steps[e.idx]?.cue}</div>
        )}
      </div>
    </section>
  )
}

export function ConvoControls({ e }: { e: Engine }) {
  const [warming, setWarming] = useState('')
  return (
    <div className="controls">
      <button className="btn sm secondary" onClick={e.reset}>Reset</button>
      <label className="hint" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input type="checkbox" checked={e.voice} onChange={(ev) => e.setVoice(ev.target.checked)} /> AI voice
      </label>
      <button className="btn sm secondary" disabled={warming === '...'} onClick={async () => { setWarming('...'); await e.warm(); setWarming('Voice lines ready') }}>{warming || 'Prepare voice'}</button>
      <span className="caption">Voice: {voiceStatus.source === 'elevenlabs' ? 'ElevenLabs' : voiceStatus.source === 'browser' ? 'browser fallback' : 'ElevenLabs (browser if unavailable)'}</span>
      <span className="caption">{e.canListen ? 'Mic: Chrome speech recognition (needs internet)' : 'Mic not supported in this browser. Typing and Next still work.'}</span>
      <span style={{ marginLeft: 'auto' }} className="caption">P: show cue &bull; H: hide controls</span>
    </div>
  )
}
