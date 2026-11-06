type St = 'To do' | 'In progress' | 'Waiting'
type T = { title: string; program: string; due?: string; st: St; label?: string; note: string }
const COLS: { h: string; sub: string; items: T[] }[] = [
  { h: 'File now', sub: 'Unemployment', items: [
    { title: 'File regular state unemployment', program: 'Jobs4TN', st: 'To do', note: 'Choose \u201cLack of Work,\u201d then \u201cDisaster related closure.\u201d' },
    { title: 'Review and submit your DUA application', program: 'Tennessee DUA', due: 'June 9, 2026', st: 'In progress', label: 'Likely eligible', note: 'Prepared on your call. You review and submit it.' },
    { title: 'Send DUA documents', program: 'Tennessee DUA', due: '21 days after filing', st: 'Waiting', note: 'SSN, paystub or tax return, proof of employment.' },
  ] },
  { h: 'Apply for aid', sub: 'Federal help', items: [
    { title: 'Apply for FEMA Individual Assistance', program: 'FEMA, DR-4898', due: 'June 10, 2026', st: 'To do', label: 'Likely eligible', note: 'No renters insurance on file. DisasterAssistance.gov or 800-621-3362.' },
    { title: 'Look at an SBA disaster loan', program: 'SBA', st: 'To do', label: 'Possibly eligible', note: 'Check SBA\u2019s current deadline and terms.' },
    { title: 'Upload damage photos and receipts', program: 'FEMA', st: 'To do', note: 'Food, repairs, and anything lost.' },
  ] },
  { h: 'Rebuild', sub: 'Local help', items: [
    { title: 'Visit a local recovery center', program: 'Local resources', st: 'To do', note: 'Ask Davidson County emergency management and Community Compass about help near you.' },
    { title: 'Get food support', program: 'Second Harvest', st: 'In progress', note: 'Your need was sent to responders. We text pantry locations.' },
    { title: 'Catch up on rent and utilities', program: 'Local assistance', st: 'To do', note: 'Ask your landlord and utility about hardship plans.' },
  ] },
]
const cls: Record<St, string> = { 'In progress': 'blue', 'To do': 'grey', 'Waiting': 'amber' }

export default function Plan() {
  return (
    <div className="page planpage"><div className="wide">
      <div className="plan-head">
        <h1>James&rsquo;s recovery plan</h1>
        <div className="banner" role="region" aria-label="Notification">
          <header>Important &bull; Day 88: April 22, 2026</header>
          <div><b>Disaster Unemployment Assistance is now open for Davidson County.</b> Applications close June 9. Your application is ready. Review and submit it.</div>
        </div>
      </div>
      <div className="plan-grid">
        {COLS.map((c) => (
          <section className="plan-col" key={c.h}>
            <h2>{c.h}<small>{c.sub}</small></h2>
            {c.items.map((i) => (
              <div className="task" key={i.title}>
                <div className="t">{i.title}<span className={'tag ' + cls[i.st]}>{i.st}</span></div>
                <div className="meta">
                  {i.program}{i.label ? <> &bull; <b>{i.label}</b></> : null}{i.due ? <> &bull; <span className="due">Due {i.due}</span></> : null}
                  <br />{i.note}
                </div>
              </div>
            ))}
          </section>
        ))}
      </div>
      <p className="hint" style={{ margin: '10px 0 0' }}>&ldquo;Likely eligible,&rdquo; not approved. Demo rules, not an official determination.</p>
    </div></div>
  )
}
