import { useState } from 'react'
import { keyTone } from '../lib/dtmf'

const SUB: Record<string, string> = { '2': 'ABC', '3': 'DEF', '4': 'GHI', '5': 'JKL', '6': 'MNO', '7': 'PQRS', '8': 'TUV', '9': 'WXYZ' }
export function Dots({ n, of, dark }: { n: number; of: number; dark?: boolean }) {
  return <div className={'kp-dots' + (dark ? ' dark' : '')} aria-label={`${n} of ${of} digits entered`}>{Array.from({ length: of }, (_, i) => <span key={i} className={i < n ? 'on' : ''} />)}</div>
}
// Digits are masked. A tone plays on every key, like a phone. * deletes, # submits early (only when complete).
export function Keypad({ length, label, onDone, onCount, dark }: { length: number; label: string; onDone: (d: string) => void; onCount?: (n: number) => void; dark?: boolean }) {
  const [d, setD] = useState('')
  const press = (k: string) => {
    keyTone(k)
    if (k === '*') { const n = d.slice(0, -1); setD(n); onCount?.(n.length); return }
    if (k === '#') return
    if (d.length >= length) return
    const n = d + k
    setD(n); onCount?.(n.length)
    if (n.length === length) setTimeout(() => { onDone(n); setD(''); onCount?.(0) }, 250)
  }
  return (
    <div className={'keypad' + (dark ? ' dark' : '')}>
      <p className="kp-label">{label}</p>
      <Dots n={d.length} of={length} />
      <div className="kp-grid">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((k) => (
          <button key={k} type="button" onClick={() => press(k)} aria-label={k === '*' ? 'Delete' : k}>
            <span className="kp-n">{k}</span><span className="kp-s">{SUB[k] ?? (k === '*' ? 'del' : '')}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
