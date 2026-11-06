import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { relaySend, useRelay } from '../lib/relay'
import { ConversationPanel, ConvoControls } from '../components/ConversationPanel'
import { useConversation } from '../lib/conversation'
import type { Step } from '../lib/conversation'
import { dayToDate, fmt } from '../data/tn'
import { setDemo } from '../store'
import { identity } from '../data/identity'

// BEAT 3 + 4 (SCRIPTED BY INTENT). The caller can say anything; the AI's questions and the form values follow the script.
const STEPS: Step[] = [
  { ask: 'Welcome to the Mockingbird hotline. If you are in immediate danger, hang up and call 911. Are you in immediate danger?', cue: 'No, we\u2019re safe.', expect: 'no', danger: 'Hang up and call 911 now. Stay safe.', onAsk: ['caller'] },
  { ask: 'Do you know your Mockingbird ID?', cue: 'No, I don\u2019t remember it.', onAsk: ['verifying'] },
  { ask: 'No problem. Enter your date of birth on the keypad. Don\u2019t say it out loud.', cue: '(Tap your date of birth on the keypad)',
    keypad: { length: 8, label: 'Date of birth: MM DD YYYY', verify: (d) => d === identity.dob, fail: 'That doesn\u2019t match. Try again.', demo: () => identity.dob }, fills: ['dobOk'] },
  { ask: 'Now your ZIP code.', cue: '(Tap your ZIP code on the keypad)',
    keypad: { length: 5, label: 'Home ZIP code', verify: (d) => d === identity.zip, fail: 'That doesn\u2019t match. Try again.', demo: () => identity.zip }, fills: ['verified'] },
  { ask: 'Verified. What happened, James?', cue: 'The ice storm knocked out power and my warehouse closed. They said we\u2019re out of work for now.', onAsk: ['verified'], fills: ['situation'] },
  { ask: 'Your warehouse closed from the storm, so you\u2019re likely eligible for Tennessee Disaster Unemployment Assistance. I can prepare the application for you to review and submit. Want me to?',
    cue: 'Yes, let\u2019s do it.', expect: 'yes', retry: 'Say yes to continue.', onAsk: ['eligibility'], fills: ['profileFields'] },
  { ask: 'I have your name, address, household, and employer. What was your last day of work, and what do you earn in a week?', cue: 'Friday the twenty-third, about seven hundred a week.', fills: ['lastWorked', 'disasterInfo', 'earnings'] },
  { ask: 'Have you filed for regular unemployment yet?', cue: 'No, I haven\u2019t.', fills: ['filed'] },
  { ask: 'File regular unemployment first: Lack of Work, then Disaster related closure. Then apply for DUA, a separate federal benefit, for extra weeks. Do it now, even before DUA opens. Got it?',
    cue: 'Yes, that makes sense.', expect: 'yes', retry: 'Say yes, or ask me to repeat.', onAsk: ['trap'], fills: ['duaStatus'] },
  { ask: 'Let me confirm. Hourly warehouse worker, Davidson County. Warehouse closed from the ice storm. Last worked January 23rd. About seven hundred a week. Not filed yet. Correct?',
    cue: 'Yes, that\u2019s right.', expect: 'yes', retry: 'What should I fix?', onAsk: ['readback'], fills: ['confirmed'] },
  { ask: 'Your application is ready. You review and submit it. Within 21 days of filing you need three documents: your SSN, typed securely; a paystub or tax return; and proof of employment. I\u2019ll text reminders. Anything else you need right now?',
    cue: 'We\u2019re running low on food, actually.', onAsk: ['docs'], fills: ['foodNeed'] },
  { ask: 'Got it, food. I\u2019ve sent that to responders in Davidson County and will text you meal sites. You\u2019re all set.', cue: '', expect: 'none', onAsk: ['reminder'] },
]

type Row = { key: string; label: string; value: string; src: 'profile' | 'call' }
const DUA: { sec: string; rows: Row[] }[] = [
  { sec: 'A. Applicant', rows: [
    { key: 'profileFields', label: 'Full name', value: 'James Carter (fictional)', src: 'profile' },
    { key: 'profileFields', label: 'Phone', value: '(615) 555-0142', src: 'profile' },
    { key: 'profileFields', label: 'Home address', value: '412 Example St, Nashville, TN (fictional)', src: 'profile' },
    { key: 'profileFields', label: 'County of residence', value: 'Davidson', src: 'profile' },
    { key: 'profileFields', label: 'Household size', value: '3', src: 'profile' },
  ] },
  { sec: 'B. Work', rows: [
    { key: 'profileFields', label: 'Employment type', value: 'Employee, paid hourly', src: 'profile' },
    { key: 'profileFields', label: 'Employer', value: 'Cumberland Distribution (fictional)', src: 'profile' },
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
    { key: 'filed', label: 'Filed state unemployment', value: 'No', src: 'call' },
    { key: 'duaStatus', label: 'First step', value: 'File regular claim: “Lack of Work,” then “Disaster related closure”', src: 'call' },
    { key: 'duaStatus', label: 'DUA status', value: 'Not open yet for Davidson. We will tell you the moment it opens.', src: 'call' },
  ] },
]
const CHECK: [string, string, string][] = [
  ['Name', 'James Carter', 'profileFields'], ['Work', 'Hourly warehouse associate', 'profileFields'], ['County', 'Davidson', 'profileFields'],
  ['Last day worked', 'January 23, 2026', 'lastWorked'], ['Weekly earnings', 'About $700', 'earnings'], ['Filed state unemployment', 'No', 'filed'],
]

function ring(): Promise<void> {
  return new Promise((resolve) => {
    const ctx = new AudioContext(); const t = ctx.currentTime
    ;[0, 0.45, 2.0, 2.45].forEach((d) => {
      for (const f of [440, 480]) {
        const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = f; o.connect(g); g.connect(ctx.destination)
        g.gain.setValueAtTime(0.0001, t + d); g.gain.linearRampToValueAtTime(0.12, t + d + 0.02); g.gain.setValueAtTime(0.12, t + d + 0.35); g.gain.linearRampToValueAtTime(0.0001, t + d + 0.4)
        o.start(t + d); o.stop(t + d + 0.42)
      }
    })
    setTimeout(() => { ctx.close(); resolve() }, 3600)
  })
}

export default function Live() {
  const e = useConversation(STEPS)
  const [line, setLine] = useState(false)
  const [urls, setUrls] = useState<string[]>([])
  const [qr, setQr] = useState('')
  const eRef = useRef(e); eRef.current = e
  const lineRef = useRef(false); lineRef.current = line
  const dialing = useRef(false)
  useRelay((m) => {
    if (m.from !== 'phone' || !lineRef.current) return
    const x = eRef.current
    if (m.type === 'dial' && !dialing.current) {
      dialing.current = true
      x.reset(); x.setRemote(true)
      ring().then(() => { relaySend({ from: 'screen', type: 'connected' }); x.start(); dialing.current = false })
    }
    if (m.type === 'interim' && x.getPhase() === 'listening') x.hear(m.text ?? '')
    if (m.type === 'final' && x.getPhase() === 'listening' && m.text) x.submit(m.text)
    if (m.type === 'keycount') x.setKeyCount(Number(m.text) || 0)
    if (m.type === 'digits' && m.text) x.enterDigits(m.text)
  })
  useEffect(() => { if (line) relaySend({ from: 'screen', type: 'phase', phase: e.phase, kp: e.awaiting ? { length: e.awaiting.length, label: e.awaiting.label } : null }) }, [e.phase, e.awaiting, line])
  const openLine = async () => {
    e.setRemote(true); setLine(true)
    const info = await fetch('/api/info').then((r) => r.json()).catch(() => null) as { ips: string[]; port: string; https: boolean } | null
    const proto = info?.https ? 'https' : 'http'
    const list = (info?.ips ?? []).map((ip) => `${proto}://${ip}:${info?.port}/#/phone`)
    setUrls(list)
    if (list[0]) setQr(await QRCode.toDataURL(list[0], { margin: 1, width: 150, color: { dark: '#002D65' } }))
  }
  const closeLine = () => { setLine(false); e.setRemote(false); setQr(''); setUrls([]) }
  const [ssn, setSsn] = useState('')
  const [manual, setManual] = useState<'heard' | 'check' | 'dua' | null>(null)
  const has = (k: string) => e.revealed.has(k)
  const confirmed = has('confirmed')
  const auto = has('readback') && !confirmed ? 'check' : has('profileFields') ? 'dua' : 'heard'
  useEffect(() => setManual(null), [auto])
  useEffect(() => { if (e.phase === 'done') setDemo({ jamesCalled: true }) }, [e.phase])
  const tab = manual ?? auto
  const day4 = dayToDate(4)

  return (
    <div className="page"><div className="wide">
      <ConvoControls e={e} />
      <div className="lineBox">
        {!line ? (<><b>Phone line</b><span className="hint">Use a real phone as the handset. Speech travels over the web, no phone company needed.</span><button className="btn sm" onClick={openLine}>Open the phone line</button></>)
          : (<>
            {qr && <img src={qr} width={110} height={110} alt="QR code to open the handset page" />}
            <div><b>Line open. Waiting for a call.</b><br /><span className="hint">On the phone, open:</span><br />
              {urls.length ? urls.map((u) => <code key={u} style={{ display: 'block' }}>{u}</code>) : <code>Open /#/phone on a device on the same Wi-Fi</code>}
              <span className="hint">Use <code>npm run dev:phone</code> so the phone&rsquo;s mic is allowed (https).</span></div>
            <button className="btn sm secondary" style={{ marginLeft: 'auto' }} onClick={closeLine}>Close line</button></>)}
      </div>
      <p className="hint" style={{ marginBottom: 4 }}>Step 3 of 5 &bull; Day 4: {fmt(day4)}. Power still out.</p>
      <h1>The call</h1>
      <div className="live">
        <ConversationPanel e={e} steps={STEPS} title="Live transcript" sub="Davidson County, from (615) 555-0142" userLabel="James" startLabel="Start the call"
          intro="Press Start the call. Speak naturally. What you say appears here as you say it. Mockingbird answers and fills the application on the right." />
        <section className="panel" aria-label="Structured data">
          <div className="tabs" role="tablist">
            {([['heard', 'What we heard'], ['dua', 'Prepared DUA application'], ['check', 'Check your answers']] as ['heard' | 'dua' | 'check', string][]).map(([k, l]) => (
              <button key={k} role="tab" aria-selected={tab === k} onClick={() => setManual(k)}>{l}</button>
            ))}
          </div>
          <div className="body">
            {tab === 'heard' && (
              <>
                {has('danger') && <div className="warning"><span className="bang" aria-hidden="true">!</span><div>Immediate danger reported. Caller told to hang up and call 911.</div></div>}
                {has('caller') && (
                  <div className="inset slide" style={{ marginTop: 0 }}>
                    <b>Number recognized, profile found</b><br />(615) 555-0142 &bull; Davidson County<br />
                    {!has('verifying') && <span className="tag amber">Not verified yet</span>}
                    {has('verifying') && !has('verified') && <><span className="tag amber">Verifying</span><div className="hint" style={{ marginTop: 6 }}>Date of birth: {has('dobOk') ? <b style={{ color: 'var(--success)' }}>matches &#10003;</b> : 'waiting for keypad'}<br />ZIP code: {has('dobOk') ? 'waiting for keypad' : '...'}</div></>}
                    {has('verified') && <><span className="tag green">Identity verified</span><div className="hint" style={{ marginTop: 6 }}>Caller ID, date of birth, and ZIP code. Numbers were typed on the keypad and never spoken or shown.</div></>}
                  </div>
                )}
                {has('situation') && (<>
                  <div className="sec-title">Heard on the call</div>
                  <div className="field amber"><span className="k">Situation</span><span className="v">Ice storm, power out since Jan 24</span><span className="caption">Heard</span></div>
                  <div className="field amber"><span className="k">Work status</span><span className="v">Warehouse closed. Out of work.</span><span className="caption">Heard</span></div>
                </>)}
                {has('eligibility') && (
                  <div className="panel slide" style={{ marginTop: 18 }}><div className="body">
                    <span className="tag blue">Likely eligible</span>
                    <h3 style={{ marginTop: 8 }}>Tennessee Disaster Unemployment Assistance</h3>
                    <ul style={{ margin: '0 0 8px', paddingLeft: 20, fontSize: '.95rem' }}>
                      <li>Lost work because of a declared disaster (DR-4898)</li><li>Davidson County is in the declaration</li><li>Hourly employee whose employer closed</li>
                    </ul>
                    <p className="hint" style={{ margin: 0 }}>Not open yet for Davidson County. We prepare now and tell you the moment it opens. Demo rules, not an official determination.</p>
                  </div></div>
                )}
                {has('foodNeed') && <div className="field amber slide" style={{ marginTop: 14 }}><span className="k">Need right now</span><span className="v">Food</span><span className="caption">Sent to responders</span></div>}
              </>
            )}
            {tab === 'dua' && (
              <>
                <p className="hint"><b>Demo only.</b> Prepared for James to review and submit himself. This is not the Jobs4TN site.</p>
                {DUA.map((s) => (
                  <div key={s.sec}>
                    <div className="sec-title">{s.sec}</div>
                    {s.rows.map((r) => {
                      const on = has(r.key)
                      const green = on && r.src === 'call' && confirmed
                      return (
                        <div key={r.label} className={'field ' + (!on ? 'pending' : r.src === 'profile' ? '' : green ? 'green' : 'amber')}>
                          <span className="k">{r.label}</span><span className="v">{on ? r.value : '...'}</span>
                          <span>{on ? (r.src === 'profile' ? <span className="tag profile">From profile</span> : <span className="caption">{green ? 'Confirmed' : 'Please confirm'}</span>) : ''}</span>
                        </div>
                      )
                    })}
                  </div>
                ))}
                {has('trap') && (
                  <div className="inset slide">
                    <h3>The Tennessee trap, in plain words</h3>
                    <ol style={{ margin: 0, paddingLeft: 22 }}>
                      <li>File for regular state unemployment first. Pick &ldquo;Lack of Work,&rdquo; then &ldquo;Disaster related closure.&rdquo;</li>
                      <li>DUA is a separate federal benefit run by the state. Apply for it too, to get the extra federal weeks.</li>
                      <li>TDLWD says apply for state unemployment right away, even before the federal government approves DUA for your county.</li>
                    </ol>
                  </div>
                )}
                {has('docs') && (
                  <>
                    <div className="sec-title">E. Documents</div>
                    <div className="warning slide"><span className="bang" aria-hidden="true">!</span>
                      <div>You have 21 days after you file to send your documents.
                        <div className="countdown" style={{ marginTop: 6 }}>21 days <span className="hint" style={{ fontSize: '.85rem', fontWeight: 400 }}>starts the day you file</span></div></div>
                    </div>
                    <div className="doc"><div><b>Social Security number</b><br /><span className="hint">Typed on your phone. Never spoken.</span><br />
                      <input className="ssn" type="password" inputMode="numeric" aria-label="Social Security number (use fake data)" placeholder="&bull;&bull;&bull;-&bull;&bull;-&bull;&bull;&bull;&bull;" value={ssn} onChange={(ev) => setSsn(ev.target.value.slice(0, 11))} style={{ marginTop: 6 }} /></div>
                      <span className={'tag ' + (ssn ? 'green' : 'amber')}>{ssn ? 'Uploaded' : 'Needed'}</span></div>
                    <div className="doc"><div><b>Recent paystub or federal tax return</b></div><span className="tag amber">Needed</span></div>
                    <div className="doc"><div><b>Proof you worked at the warehouse when the storm hit</b></div><span className="tag amber">Needed</span></div>
                  </>
                )}
                {has('reminder') && <div className="sms slide"><b>Text reminders queued</b><br />&ldquo;Mockingbird: James, your DUA documents are due 21 days after you file. We&rsquo;ll text you when DUA opens in Davidson County.&rdquo;</div>}
              </>
            )}
            {tab === 'check' && (
              <>
                <h2>Check your answers</h2>
                <p className="hint">Mockingbird reads these back by voice. Nothing is locked in until you say yes.</p>
                <dl className="summary">
                  {CHECK.map(([k, v, key]) => (
                    <div key={k} className={'row ' + (has(key) ? (confirmed ? 'confirmed' : 'unconfirmed') : '')} style={{ opacity: has(key) ? 1 : 0.35 }}><dt>{k}</dt><dd>{has(key) ? v : '...'}</dd><a href="#/live" onClick={(ev) => ev.preventDefault()}>Change</a></div>
                  ))}
                </dl>
              </>
            )}
          </div>
        </section>
      </div>
      {e.phase === 'done' && <p style={{ marginTop: 24 }}><a className="btn" href="#/plan">Next: the recovery plan</a></p>}
    </div></div>
  )
}
