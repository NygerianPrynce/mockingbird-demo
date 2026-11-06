type St = 'To do' | 'In progress' | 'Waiting' | 'Done'
type T = { when: string; title: string; program: string; st: St; eligible?: boolean; note: string; bring: string; action: string; href: string; due?: string }
// A timeline: what to do, in order, with the dates that matter. Every step links to where you do it.
const STEPS: T[] = [
  { when: 'Done', title: 'Regular state unemployment filed', program: 'Jobs4TN', st: 'Done', note: 'You told us you already filed. Keep your claim number handy, DUA depends on it.', bring: 'Your claim number', action: 'Check my claim', href: 'https://www.jobs4tn.gov' },
  { when: 'This week', title: 'Review and submit your DUA application', program: 'Tennessee DUA', st: 'In progress', eligible: true, note: 'Prepared on your call from your profile. Check every answer, then submit it yourself.', bring: 'Your prepared application', action: 'Go to Jobs4TN', href: 'https://www.jobs4tn.gov' },
  { when: '21 days after filing', title: 'Send your DUA documents', program: 'Tennessee DUA', st: 'Waiting', note: 'Upload within 21 days of filing or the application can be closed.', bring: 'Paystub or tax return, proof of employment', action: 'Upload documents', href: 'https://www.jobs4tn.gov' },
  { when: 'June 9', title: 'DUA applications close', program: 'Tennessee DUA', st: 'To do', due: 'Deadline', note: 'Last day to submit. Questions: 877-813-0950, weekdays 8 to 4:30 CT.', bring: 'Confirmation number from your filing', action: 'Check my claim', href: 'https://www.jobs4tn.gov' },
  { when: 'June 10', title: 'Apply for FEMA Individual Assistance', program: 'FEMA, DR-4898', st: 'To do', eligible: true, due: 'Deadline', note: 'Covers uninsured damage, temporary housing and essential needs. You can also apply at 800-621-3362.', bring: 'Damage photos, receipts, lease, ID', action: 'Apply on DisasterAssistance.gov', href: 'https://www.disasterassistance.gov' },
  { when: 'Next', title: 'Rebuild with local help', program: 'SBA loan, recovery center', st: 'To do', eligible: true, note: 'Low-interest SBA disaster loans, plus Davidson County rent and utility help.', bring: 'Income records, insurance status', action: 'See SBA and local help', href: 'https://disasterloanassistance.sba.gov' },
]
const cls: Record<St, string> = { 'In progress': 'blue', 'To do': 'grey', 'Waiting': 'amber', 'Done': 'green' }

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
              <div className="prog">{s.program}{s.eligible ? <> &bull; <b>Eligible</b></> : null} <span className={'tag ' + cls[s.st]}>{s.due ?? s.st}</span></div>
              <p className="note">{s.note}</p>
              <p className="bring"><b>Bring:</b> {s.bring}</p>
              <a className="btn sm" href={s.href} target="_blank" rel="noreferrer">{s.action}</a>
            </div>
            <span className="node" aria-hidden="true" />
          </li>
        ))}
      </ol>
    </div></div>
  )
}
