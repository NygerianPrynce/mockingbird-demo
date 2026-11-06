type St = 'To do' | 'In progress' | 'Waiting'
type T = { when: string; title: string; program: string; st: St; eligible?: boolean; note: string; due?: string }
// A timeline: what to do, in order, with the dates that matter.
const STEPS: T[] = [
  { when: 'This week', title: 'File regular state unemployment', program: 'Jobs4TN', st: 'To do', note: 'Choose “Lack of Work,” then “Disaster related closure.”' },
  { when: 'This week', title: 'Review and submit your DUA application', program: 'Tennessee DUA', st: 'In progress', eligible: true, note: 'Prepared on your call. You review and submit it.' },
  { when: '21 days after filing', title: 'Send DUA documents', program: 'Tennessee DUA', st: 'Waiting', note: 'SSN, paystub or tax return, proof of employment.' },
  { when: 'June 9', title: 'DUA applications close', program: 'Tennessee DUA', st: 'To do', due: 'Deadline', note: 'Submit before this date.' },
  { when: 'June 10', title: 'Apply for FEMA Individual Assistance', program: 'FEMA, DR-4898', st: 'To do', eligible: true, due: 'Deadline', note: 'DisasterAssistance.gov. Bring damage photos and receipts.' },
  { when: 'Next', title: 'Rebuild with local help', program: 'SBA, recovery center', st: 'To do', eligible: true, note: 'Check SBA’s terms. Ask Davidson County emergency management about help near you.' },
]
const cls: Record<St, string> = { 'In progress': 'blue', 'To do': 'grey', 'Waiting': 'amber' }

export default function Plan() {
  return (
    <div className="page planpage"><div className="wide">
      <div className="plan-head">
        <h1>James&rsquo;s recovery plan</h1>
        <div className="banner" role="region" aria-label="Notification">
          <header>Important</header>
          <div><b>Disaster Unemployment Assistance is now open for Davidson County.</b> Applications close June 9. Your application is ready. Review and submit it.</div>
        </div>
      </div>
      <ol className="timeline">
        {STEPS.map((s, i) => (
          <li key={s.title} className={i % 2 ? 'down' : 'up'}>
            <div className="tcard">
              <div className="when">{s.when}</div>
              <div className="tt">{s.title}</div>
              <div className="meta">{s.program}{s.eligible ? <> &bull; <b>Eligible</b></> : null}<br />{s.note}</div>
              <span className={'tag ' + cls[s.st]}>{s.due ?? s.st}</span>
            </div>
            <span className="node" aria-hidden="true" />
          </li>
        ))}
      </ol>
    </div></div>
  )
}
