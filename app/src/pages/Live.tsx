import { useEffect, useState } from 'react'
import { CallPanel } from '../components/ConversationPanel'
import { useConversation } from '../lib/conversation'
import type { Step } from '../lib/conversation'
import { usePhoneCall } from '../lib/useCall'
import { setDemo } from '../store'
import { identity } from '../data/identity'
import icon from '../assets/mockingbird-icon.svg'

// BEAT 3 + 4 (SCRIPTED BY INTENT). The caller can say anything; the AI's questions and the form values follow the script.
const STEPS: Step[] = [
  { ask: 'Mockingbird hotline. Are you in immediate danger?', cue: 'No, we\u2019re safe.', expect: 'no', danger: 'Hang up and call 911 now. Stay safe.', onAsk: ['caller'] },
  { ask: 'Do you know your Mockingbird ID?', cue: 'No, I don\u2019t remember it.', onAsk: ['verifying'] },
  { ask: 'No problem. Enter your date of birth on the keypad.', cue: '(Tap your date of birth on the keypad)',
    keypad: { length: 8, label: 'Date of birth: MM DD YYYY', verify: (d) => d === identity.dob, fail: 'That doesn\u2019t match. Try again.', demo: () => identity.dob }, fills: ['dobOk'] },
  { ask: 'And your ZIP code.', cue: '(Tap your ZIP code on the keypad)',
    keypad: { length: 5, label: 'Home ZIP code', verify: (d) => d === identity.zip, fail: 'That doesn\u2019t match. Try again.', demo: () => identity.zip }, fills: ['verified'] },
  { ask: 'Verified. What\u2019s going on, James?', cue: 'The ice storm closed my warehouse, and I\u2019m still out of work.', onAsk: ['verified'], fills: ['situation'] },
  { ask: 'I\u2019m so sorry to hear that, James. You\u2019re likely eligible for Tennessee Disaster Unemployment Assistance, which is open now. Want to start that form?',
    cue: 'Yes, let\u2019s do it.', expect: 'yes', retry: 'Say yes to continue.', onAsk: ['eligibility'], fills: ['profileFields'] },
  { ask: 'What was your last day of work, and what do you usually earn in a week?', cue: 'Friday the twenty-third, about seven hundred a week.', fills: ['lastWorked', 'disasterInfo', 'earnings'] },
  { ask: 'Have you filed for regular unemployment yet?', cue: 'Yes, I have.', fills: ['filed', 'duaStatus'] },
  { ask: 'To confirm: laid off by the storm, last worked January 23rd, about seven hundred a week, already filed. Correct?',
    cue: 'Yes, that\u2019s right.', expect: 'yes', retry: 'What should I fix?', onAsk: ['readback'], fills: ['confirmed'] },
  { ask: 'Your application is ready for you to review and submit. Within 21 days, you\u2019ll need your Social Security number, a paystub, and proof of employment. Anything else you need right now?',
    cue: 'We\u2019re behind on rent.', onAsk: ['docs'], fills: ['rentNeed'] },
  { ask: 'Got it. I\u2019ve flagged rent help for Davidson County, and I\u2019ll text you the next steps. Take care, James.', cue: '', expect: 'none', onAsk: ['reminder'] },
]

type Row = { key: string; label: string; value: string; src: 'profile' | 'call' }
const DUA: { sec: string; rows: Row[] }[] = [
  { sec: 'A. Applicant', rows: [
    { key: 'profileFields', label: 'Full name', value: 'James Carter', src: 'profile' },
    { key: 'profileFields', label: 'Phone', value: '(615) 555-0142', src: 'profile' },
    { key: 'profileFields', label: 'Home address', value: '412 Example St, Nashville', src: 'profile' },
    { key: 'profileFields', label: 'County of residence', value: 'Davidson', src: 'profile' },
    { key: 'profileFields', label: 'Household size', value: '3', src: 'profile' },
  ] },
  { sec: 'B. Work', rows: [
    { key: 'profileFields', label: 'Employment type', value: 'Employee, paid hourly', src: 'profile' },
    { key: 'profileFields', label: 'Employer', value: 'Cumberland Distribution', src: 'profile' },
    { key: 'profileFields', label: 'Job', value: 'Warehouse associate', src: 'profile' },
    { key: 'lastWorked', label: 'Date last worked', value: 'January 23, 2026', src: 'call' },
    { key: 'earnings', label: 'Typical weekly earnings', value: 'About $700 (as stated)', src: 'call' },
  ] },
  { sec: 'C. Disaster', rows: [
    { key: 'disasterInfo', label: 'Disaster', value: 'Tennessee Severe Winter Storms beginning Jan 22, 2026 (DR-4898)', src: 'call' },
    { key: 'disasterInfo', label: 'How it stopped work', value: 'Employer closed after storm and power outage', src: 'call' },
    { key: 'disasterInfo', label: 'Date work stopped', value: 'January 24, 2026', src: 'call' },
  ] },
  { sec: 'D. Filing status', rows: [
    { key: 'filed', label: 'Filed state unemployment', value: 'Yes', src: 'call' },
    { key: 'duaStatus', label: 'DUA status', value: 'Open for Davidson. Application prepared.', src: 'call' },
  ] },
]
const SCAN: { name: string; out: string; hit?: boolean }[] = [
  { name: 'Disaster Unemployment Assistance', out: 'Eligible. Start here', hit: true },
  { name: 'FEMA Individual Assistance', out: 'Eligible, next' },
  { name: 'SBA disaster loan', out: 'Eligible, later' },
  { name: 'SNAP food assistance', out: 'Checked' },
  { name: 'Utility and rent help', out: 'Checked' },
  { name: 'Local recovery services', out: 'Checked' },
]
const SAVED: [string, string][] = [['Name', 'James Carter'], ['County', 'Davidson'], ['Household', '3'], ['Work', 'Warehouse associate, hourly'], ['Rent or own', 'Rent']]

export default function Live() {
  const e = useConversation(STEPS)
  usePhoneCall(e)
  const has = (k: string) => e.revealed.has(k)
  const confirmed = has('confirmed')
  useEffect(() => { if (e.phase === 'done') setDemo({ jamesCalled: true }) }, [e.phase])

  // the right side follows the call: loading profile, scanning programs, the DUA form, then saved to the profile
  const stage = has('docs') ? 'saved' : has('profileFields') ? 'form' : has('situation') ? 'scan' : has('verified') ? 'loading' : 'idle'
  const [scanN, setScanN] = useState(0)
  const [tuck, setTuck] = useState(false)
  useEffect(() => {
    if (stage !== 'scan') { if (stage === 'idle') setScanN(0); return }
    const id = setInterval(() => setScanN((n) => Math.min(SCAN.length, n + 1)), 650)
    return () => clearInterval(id)
  }, [stage])
  useEffect(() => {
    if (stage === 'saved') { setTuck(false); const id = setTimeout(() => setTuck(true), 2600); return () => clearTimeout(id) }
    setTuck(false)
  }, [stage])

  return (
    <div className="page"><div className="wide">
      <div className={'live callgrid morph' + (e.phase !== 'idle' ? ' active' : '')}>
        <div className="leftcol">
          <CallPanel e={e} userLabel="James" size={220} />
          {has('caller') && (
            <div className="idcard">
              {has('danger') ? <div className="warning" style={{ margin: 0 }}><span className="bang" aria-hidden="true">!</span><div>Immediate danger reported. Caller told to call 911.</div></div> : (
                <>
                  <b>Number recognized</b>
                  <span className="hint">(615) 555-0142 &bull; Davidson County</span>
                  {!has('verified') && <span className="tag amber">{has('verifying') ? 'Verifying' : 'Not verified yet'}</span>}
                  {has('verified') && <span className="tag green">Identity verified</span>}
                  {has('eligibility') && <span className="tag blue">Eligible: DUA</span>}
                  {has('rentNeed') && <span className="tag amber">Need: rent help</span>}
                </>
              )}
            </div>
          )}
        </div>
        <section className="panel appl" aria-label="Application">
          {stage === 'idle' && <div className="stagebox"><p className="muted">Verifying caller</p></div>}
          {stage === 'loading' && (
            <div className="stagebox slide">
              <img src={icon} width={56} height={56} alt="" className="bob" />
              <h2>Loading James&rsquo;s profile</h2>
              <div className="bar"><i /></div>
              <p className="muted">Davidson County &bull; household of 3 &bull; hourly warehouse work</p>
            </div>
          )}
          {stage === 'scan' && (
            <div className="stagebox slide">
              <h2>Checking programs that could help</h2>
              <ul className="scan">
                {SCAN.map((r, i) => {
                  const done = i < scanN
                  return (
                    <li key={r.name} className={(done ? 'done ' : '') + (done && r.hit ? 'hit' : '')}>
                      <span className="dotspin" aria-hidden="true">{done ? '\u2713' : ''}</span><span className="nm">{r.name}</span>
                      <span className="res">{done ? r.out : i === scanN ? 'Checking' : ''}</span>
                    </li>
                  )
                })}
              </ul>
              {scanN >= 1 && <div className="suggest slide"><b>Suggested: Disaster Unemployment Assistance.</b> Your warehouse closed because of the storm.</div>}
            </div>
          )}
          {stage === 'form' && (
            <>
              <header><h3>Disaster Unemployment Assistance</h3><span className="tag grey">Prepared for James to review and submit</span></header>
              <div className="body">
                <div className="dua-grid">
                  {DUA.map((sec) => (
                    <div key={sec.sec}>
                      <div className="sec-title">{sec.sec}</div>
                      {sec.rows.map((r) => {
                        const on = has(r.key)
                        const green = on && r.src === 'call' && confirmed
                        return (
                          <div key={r.label} className={'field ' + (!on ? 'pending' : r.src === 'profile' ? '' : green ? 'green' : 'amber')}>
                            <span className="k">{r.label}</span><span className="v">{on ? r.value : '...'}</span>
                            <span>{on ? (r.src === 'profile' ? <span className="tag profile">From profile</span> : <span className="caption">{green ? 'Confirmed' : 'Confirm'}</span>) : ''}</span>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          {stage === 'saved' && (
            <div className="savedwrap">
              <div className={'formcard' + (tuck ? ' tuck' : '')}>
                <div className="stagebox"><span className="tag green">Form saved</span><h2>Disaster Unemployment Assistance</h2><p className="muted">Eligible &bull; ready for James to review and submit</p></div>
              </div>
              <div className={'profilecard' + (tuck ? ' show' : '')}>
                <h2>James&rsquo;s profile</h2>
                <dl className="summary">
                  {SAVED.map(([k, v]) => <div className="row" key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
                  <div className="row newrow"><dt>Applications</dt><dd><b>Disaster Unemployment Assistance</b><br /><span className="hint">Saved just now. Ready to submit.</span></dd></div>
                </dl>
                <div className="docrow"><span>Within 21 days of filing: Social Security number <i>typed securely</i></span><span>Paystub or tax return</span><span>Proof of employment</span></div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div></div>
  )
}
