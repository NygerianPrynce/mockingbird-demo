import { useEffect, useState } from 'react'
import { CallPanel } from '../components/ConversationPanel'
import { usePhoneCall } from '../lib/useCall'
import { useConversation } from '../lib/conversation'
import type { Step } from '../lib/conversation'
import { identity } from '../data/identity'
import { setDuck } from '../lib/speech'

// BEAT 1 (SCRIPTED BY INTENT). Whatever the speaker says counts as the answer; the profile fills with the script's values.
const STEPS: Step[] = [
  { ask: 'Hi, this is Mockingbird. Are you in immediate danger?', cue: 'No, we\u2019re safe.', expect: 'no', danger: 'Hang up and call 911 now. Stay safe.' },
  { ask: 'Do you know your Mockingbird ID?', cue: 'No, I don\u2019t have a profile yet.' },
  { ask: 'No problem, let\u2019s make one. What\u2019s your name and address?', cue: 'James Carter, 412 Example Street, Nashville.', fills: ['name', 'address', 'county'] },
  { ask: 'Enter your date of birth on the keypad.', cue: '(Tap a date of birth on the keypad)', keypad: { length: 8, label: 'Date of birth: MM DD YYYY', verify: (d) => { identity.dob = d; return true }, fail: '', demo: () => '03141991' }, fills: ['dob'] },
  { ask: 'Who lives with you, and what do you do for work?', cue: 'My wife and our little boy. I work at a warehouse, paid hourly.', fills: ['household', 'job'] },
  { ask: 'Do you rent or own? Any insurance?', cue: 'I rent, and no, I don\u2019t have renters insurance.', fills: ['tenure', 'insurance'] },
  { ask: 'Done. Your Mockingbird ID is M B, 2 0 4 1.', cue: '', expect: 'none', onAsk: ['mbid'] },
]
const FIELDS: [string, string, string][] = [
  ['phone', 'Phone', '(615) 555-0142'],
  ['name', 'Name', 'James Carter'],
  ['address', 'Home address', '412 Example St, Nashville, TN 37210'],
  ['county', 'County', 'Davidson'],
  ['dob', 'Date of birth', '••/••/••••  (keypad)'],
  ['household', 'Household', '3: James, his wife, one child'],
  ['job', 'Work', 'Warehouse associate, paid hourly'],
  ['tenure', 'Rent or own', 'Rent'],
  ['insurance', 'Insurance', 'None'],
  ['mbid', 'Mockingbird ID', identity.mbid],
]

export default function Profile() {
  const e = useConversation(STEPS)
  const done = e.phase === 'done'
  const have = (k: string) => k === 'phone' || e.revealed.has(k)
  // Presenter signal: press W to talk over the call. Only the AI's volume drops; the call carries on. Press W again, or move on, to bring it back.
  const [ducked, setDucked] = useState(false)
  useEffect(() => { setDuck(ducked) }, [ducked])
  useEffect(() => () => setDuck(false), [])
  useEffect(() => {
    const k = (ev: KeyboardEvent) => {
      const t = ev.target as HTMLElement
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return
      if (ev.key === 'w' || ev.key === 'W') setDucked((d) => !d)
    }
    addEventListener('keydown', k)
    return () => removeEventListener('keydown', k)
  }, [])
  usePhoneCall(e)
  const active = e.phase !== 'idle'
  return (
    <div className="page"><div className="wide">
      {active && <h1 className="slide">Building your Mockingbird profile</h1>}
      <div className={'live morph' + (active ? ' active' : '')}>
        <CallPanel e={e} userLabel="James" />
        <section className="panel profpanel" aria-label="Profile">
          <header><h3>James&rsquo;s profile</h3><span className={'tag ' + (done ? 'green' : 'amber')}>{done ? 'Saved' : 'Building'}</span></header>
          <div className="body">
            <dl className="summary">
              {FIELDS.map(([k, l, v]) => {
                const on = have(k)
                return (
                  <div key={k} className={'row ' + (on ? 'confirmed' : '')} style={{ opacity: on ? 1 : 0.35 }}>
                    <dt>{l}</dt><dd>{on ? v : 'Waiting...'}</dd>
                  </div>
                )
              })}
            </dl>
          </div>
        </section>
      </div>
    </div></div>
  )
}
