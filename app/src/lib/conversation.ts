import { useEffect, useMemo, useRef, useState } from 'react'
import { cancelSpeech, createListener, speak, speechSupported, warmVoice } from './speech'

// A scripted conversation driven by what the speaker means, not their exact words.
// The AI asks step.ask. Whatever the person says (voice or typed) counts as the answer, then step.fills are revealed.
export type Step = {
  ask: string
  cue: string // suggested line for the person on the call (press P to show)
  expect?: 'any' | 'yes' | 'no' | 'none' // 'yes' re-asks until a yes-like answer, 'none' = AI line only
  retry?: string
  danger?: string // if the answer to this step means immediate danger, say this and end the call
  onAsk?: string[] // UI keys revealed when the AI asks
  fills?: string[] // UI keys revealed once the person answers
  // Keypad step: the person enters digits on a keypad (never spoken). Tones play on each key.
  keypad?: { length: number; label: string; verify: (digits: string) => boolean; fail: string; demo: () => string }
}
export type Line = { id: number; who: 'AI' | 'USER'; text: string; ts: number }
export type Phase = 'idle' | 'speaking' | 'listening' | 'done'
const IS_YES = /\b(yes|yeah|yep|yup|sure|ok|okay|go ahead|proceed|please|do it|correct|right|sounds good|that works|let's|lets)\b/i

export function useConversation(steps: Step[]) {
  const [lines, setLines] = useState<Line[]>([])
  const [revealed, setRevealed] = useState<Set<string>>(new Set())
  const [phase, setPhase] = useState<Phase>('idle')
  const [idx, setIdx] = useState(0)
  const [interim, setInterim] = useState('')
  const [voice, setVoiceState] = useState(true)
  const [error, setError] = useState('')
  const [remote, setRemoteState] = useState(false)
  const [awaiting, setAwaiting] = useState<Step['keypad'] | null>(null)
  const [keyCount, setKeyCount] = useState(0)
  const stepsRef = useRef(steps)
  stepsRef.current = steps
  const r = useRef({ run: 0, idx: 0, t0: 0, id: 0, voice: true, phase: 'idle' as Phase, listener: null as ReturnType<typeof createListener> | null, remote: false })

  const api = useMemo(() => {
    const s = r.current
    const setPh = (p: Phase) => { s.phase = p; setPhase(p) }
    const addLine = (who: 'AI' | 'USER', text: string) => { s.id++; const id = s.id; setLines((l) => [...l, { id, who, text, ts: (Date.now() - s.t0) / 1000 }]) }
    const reveal = (keys?: string[]) => { if (keys?.length) setRevealed((x) => new Set([...x, ...keys])) }
    const finish = () => { s.listener?.stop(); setPh('done') }
    const aiSay = async (text: string, run: number) => {
      addLine('AI', text); setPh('speaking'); s.listener?.stop()
      await speak(text, s.voice)
      return run === s.run
    }
    const listen = () => {
      setPh('listening')
      const kp = stepsRef.current[s.idx].keypad
      setAwaiting(kp ?? null)
      if (kp) return // no speech recognition during keypad entry
      if (s.remote) return // a phone handset supplies the speech
      if (!s.listener) s.listener = createListener({
        onInterim: (t) => setInterim(t),
        onFinal: (t) => submit(t),
        onError: (m) => setError(m),
      })
      s.listener.start()
    }
    async function ask(i: number) {
      const run = s.run
      const step = stepsRef.current[i]
      s.idx = i; setIdx(i); reveal(step.onAsk)
      if (!(await aiSay(step.ask, run))) return
      if (step.expect === 'none') {
        reveal(step.fills)
        if (i + 1 < stepsRef.current.length) ask(i + 1); else finish()
        return
      }
      listen()
    }
    function submit(text: string) {
      if (s.phase !== 'listening' && s.phase !== 'speaking') return
      if (stepsRef.current[s.idx].expect === 'none' || stepsRef.current[s.idx].keypad) return
      const run = ++s.run
      cancelSpeech(); s.listener?.stop(); setInterim('')
      addLine('USER', text)
      const step = stepsRef.current[s.idx]
      if (step.danger && /\b(yes|yeah|yep|danger|help)\b/i.test(text) && !/\b(no|nope|not|safe)\b/i.test(text)) {
        reveal(['danger'])
        ;(async () => { await aiSay(step.danger!, run); finish() })()
        return
      }
      if (step.expect === 'yes' && !IS_YES.test(text)) {
        ;(async () => { if (await aiSay(step.retry ?? 'Just say yes when you are ready.', run)) listen() })()
        return
      }
      reveal(step.fills)
      const n = s.idx + 1
      if (n < stepsRef.current.length) ask(n); else finish()
    }
    function enterDigits(d: string) {
      if (s.phase !== 'listening') return
      const step = stepsRef.current[s.idx]
      if (!step.keypad) return
      const run = ++s.run
      setKeyCount(0); setAwaiting(null)
      addLine('USER', '\u2022'.repeat(d.length) + '  (entered on keypad)')
      if (step.keypad.verify(d)) {
        reveal(step.fills)
        const n = s.idx + 1
        if (n < stepsRef.current.length) ask(n); else finish()
      } else {
        ;(async () => { if (await aiSay(step.keypad!.fail, run)) listen() })()
      }
    }
    return {
      enterDigits,
      warm() { const t = stepsRef.current.flatMap((x) => [x.ask, x.retry ?? '', x.danger ?? '', x.keypad?.fail ?? '']); return warmVoice(t) },
      start() { warmVoice(stepsRef.current.map((x) => x.ask)); s.run++; s.t0 = Date.now(); s.id = 0; setLines([]); setRevealed(new Set()); setError(''); setInterim(''); ask(0) },
      reset() { s.run++; setAwaiting(null); setKeyCount(0); cancelSpeech(); s.listener?.stop(); setLines([]); setRevealed(new Set()); setInterim(''); setError(''); setIdx(0); setPh('idle') },
      submit,
      hear: (t: string) => setInterim(t),
      skip() { const k = stepsRef.current[s.idx].keypad; if (k) enterDigits(k.demo()); else submit(stepsRef.current[s.idx].cue) },
    }
  }, [])

  useEffect(() => () => { r.current.run++; r.current.listener?.stop(); cancelSpeech() }, [])

  return {
    lines, revealed, phase, idx, interim, error, voice, remote, awaiting, keyCount, setKeyCount,
    setRemote: (v: boolean) => { r.current.remote = v; setRemoteState(v) },
    getPhase: () => r.current.phase, canListen: speechSupported(),
    setVoice: (v: boolean) => { r.current.voice = v; setVoiceState(v); if (!v) cancelSpeech() },
    ...api,
  }
}
export type Engine = ReturnType<typeof useConversation>
