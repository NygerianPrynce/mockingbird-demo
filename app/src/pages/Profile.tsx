import { useEffect } from 'react'
import { ConversationPanel, ConvoControls } from '../components/ConversationPanel'
import { useConversation } from '../lib/conversation'
import type { Step } from '../lib/conversation'
import { identity } from '../data/identity'

// BEAT 1 (SCRIPTED BY INTENT). Whatever the speaker says counts as the answer; the profile fills with the script's values.
const STEPS: Step[] = [
  { ask: 'Hi, I\u2019m Mockingbird. Let\u2019s set up your recovery profile before anything happens, just by talking. What\u2019s your name and home address?', cue: 'James Carter, 412 Example Street, Nashville.', fills: ['name', 'address', 'county'] },
  { ask: 'Enter your date of birth on the keypad. Don\u2019t say it out loud.', cue: '(Tap a date of birth on the keypad)', keypad: { length: 8, label: 'Date of birth: MM DD YYYY', verify: (d) => { identity.dob = d; return true }, fail: '', demo: () => '03141991' }, fills: ['dob'] },
  { ask: 'Who lives with you, and what do you do for work?', cue: 'My wife and our little boy. I work at a warehouse, paid hourly.', fills: ['household', 'job'] },
  { ask: 'Do you rent or own? Any insurance on it?', cue: 'I rent, and no, I don\u2019t have renters insurance.', fills: ['tenure', 'insurance'] },
  { ask: 'Done. Your profile is saved. Your Mockingbird ID is M B, 2 0 4 1. I\u2019ll ask the rest by text later. Here\u2019s what this can start for you.', cue: '', expect: 'none', onAsk: ['programs', 'mbid'] },
]
const FIELDS: [string, string, string][] = [
  ['phone', 'Phone number (your account)', '(615) 555-0142'],
  ['name', 'Name', 'James Carter (fictional)'],
  ['address', 'Home address', '412 Example St, Nashville, TN 37210 (fictional)'],
  ['county', 'County', 'Davidson (found from your address)'],
  ['dob', 'Date of birth', '••/••/••••  entered on the keypad, never spoken'],
  ['household', 'Household', '3: James, his wife, one child'],
  ['job', 'Work', 'Warehouse associate, Cumberland Distribution (fictional), paid hourly'],
  ['tenure', 'Rent or own', 'Rent'],
  ['insurance', 'Renters insurance', 'None'],
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
  const answered = FIELDS.filter(([k]) => have(k)).length - 1
  return (
    <div className="page"><div className="wide">
      <ConvoControls e={e} />
      <p className="hint" style={{ marginBottom: 4 }}>Step 1 of 5 &bull; Before anything happens</p>
      <h1>Build your profile by talking</h1>
      <div className="live">
        <ConversationPanel e={e} steps={STEPS} title="Profile conversation" sub="No forms, just questions" userLabel="James" startLabel="Start the conversation"
          intro="Press Start, then answer out loud. Mockingbird asks the questions and fills in the profile as you talk. James is a fictional person." />
        <section className="panel" aria-label="Profile">
          <header><h3>James&rsquo;s profile</h3><span className={'tag ' + (done ? 'green' : 'amber')}>{done ? 'Saved' : 'Building'}</span><span className="caption" style={{ marginLeft: 'auto' }}>{answered} of {FIELDS.length - 1} filled</span></header>
          <div className="body">
            <dl className="summary" style={{ marginBottom: 0 }}>
              {FIELDS.map(([k, l, v]) => {
                const on = have(k)
                return (
                  <div key={k} className={'row ' + (on ? 'confirmed' : '')} style={{ opacity: on ? 1 : 0.35 }}>
                    <dt>{l}</dt><dd>{on ? v : 'Waiting...'}</dd><span className="caption">{on && k !== 'phone' ? 'Change' : ''}</span>
                  </div>
                )
              })}
            </dl>
            {e.revealed.has('programs') && (
              <div className="inset slide" style={{ marginBottom: 0 }}>
                <h3>Ready to pre-fill</h3>
                <p className="hint" style={{ marginBottom: 6 }}>Examples of applications this one conversation can start. We prepare them, you review and submit.</p>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: '.95rem' }}>{PROGRAMS.map((p) => <li key={p}>{p}</li>)}</ul>
              </div>
            )}
          </div>
        </section>
      </div>
      {done && <div className="inset slide"><b>Saved.</b> Mockingbird picks up the rest by text later, like contact preferences and an emergency contact.</div>}
      {done && <p style={{ marginTop: 24 }}><a className="btn" href="#/storm">Next: the storm hits</a></p>}
    </div></div>
  )
}
