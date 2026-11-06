import { useEffect } from 'react'
import { CallPanel } from '../components/ConversationPanel'
import { usePhoneCall } from '../lib/useCall'
import { useConversation } from '../lib/conversation'
import type { Step } from '../lib/conversation'
import { identity } from '../data/identity'

// BEAT 1 (SCRIPTED BY INTENT). Whatever the speaker says counts as the answer; the profile fills with the script's values.
const STEPS: Step[] = [
  { ask: 'Hi, I\u2019m Mockingbird. Let\u2019s set up your recovery profile. What\u2019s your name and home address?', cue: 'James Carter, 412 Example Street, Nashville.', fills: ['name', 'address', 'county'] },
  { ask: 'Enter your date of birth on the keypad.', cue: '(Tap a date of birth on the keypad)', keypad: { length: 8, label: 'Date of birth: MM DD YYYY', verify: (d) => { identity.dob = d; return true }, fail: '', demo: () => '03141991' }, fills: ['dob'] },
  { ask: 'Who lives with you, and what do you do for work?', cue: 'My wife and our little boy. I work at a warehouse, paid hourly.', fills: ['household', 'job'] },
  { ask: 'Do you rent or own? Any insurance on it?', cue: 'I rent, and no, I don\u2019t have renters insurance.', fills: ['tenure', 'insurance'] },
  { ask: 'Done. Your profile is saved. Your Mockingbird ID is M B, 2 0 4 1. I\u2019ll ask the rest by text later. Here\u2019s what this can start for you.', cue: '', expect: 'none', onAsk: ['programs', 'mbid'] },
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
const PROGRAMS = ['Disaster Unemployment Assistance', 'FEMA Individual Assistance', 'SBA disaster loan', 'SNAP food assistance', 'Utility and rent help', 'Local recovery services']

export default function Profile() {
  const e = useConversation(STEPS)
  const done = e.phase === 'done'
  const have = (k: string) => k === 'phone' || e.revealed.has(k)
  // Presenter signal: press W to take over. The AI fades out, stops asking, and the profile is saved as is.
  useEffect(() => {
    const k = (ev: KeyboardEvent) => {
      const t = ev.target as HTMLElement
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return
      if (ev.key === 'w' || ev.key === 'W') e.wrap(['programs', 'mbid'])
    }
    addEventListener('keydown', k)
    return () => removeEventListener('keydown', k)
  }, [e])
  usePhoneCall(e)
  return (
    <div className="page"><div className="wide">
      <h1>Your recovery profile</h1>
      <div className="live">
        <CallPanel e={e} userLabel="James" />
        <section className="panel" aria-label="Profile">
          <header><h3>James&rsquo;s profile</h3><span className={'tag ' + (done ? 'green' : 'amber')}>{done ? 'Saved' : 'Building'}</span></header>
          <div className="body">
            <dl className="summary" style={{ marginBottom: 0 }}>
              {FIELDS.map(([k, l, v]) => {
                const on = have(k)
                return (
                  <div key={k} className={'row ' + (on ? 'confirmed' : '')} style={{ opacity: on ? 1 : 0.35 }}>
                    <dt>{l}</dt><dd>{on ? v : 'Waiting...'}</dd>
                  </div>
                )
              })}
            </dl>
            {e.revealed.has('programs') && (
              <div className="inset slide" style={{ marginBottom: 0 }}>
                <h3 style={{ marginBottom: 2 }}>Can start for you</h3>
                <p className="hint" style={{ marginBottom: 6 }}>We prepare these. You review and submit.</p>
                <div className="chips">{PROGRAMS.map((p) => <span key={p}>{p}</span>)}</div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div></div>
  )
}
