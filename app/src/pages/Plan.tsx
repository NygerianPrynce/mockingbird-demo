type St = 'Not started' | 'In progress' | 'Completed' | 'Cannot start yet'
type T = { title: string; program: string; due?: string; docs?: string; st: St; note?: string; label?: string }
const OFFLINE = [
  'Your call was saved.',
  'Your Disaster Unemployment application was prepared. It is waiting for you to review.',
  'Your need for food was sent to local responders.',
  'Document reminders are queued to text you when you have signal.',
]
const GROUPS: { h: string; items: T[] }[] = [
  { h: 'First 72 hours', items: [
    { title: 'Get somewhere safe and warm', program: 'Safety', st: 'Completed', note: 'Staying safe at home' },
    { title: 'Get meals for your family', program: 'Local resources', st: 'In progress', note: 'Reported to responders. We will text meal sites when confirmed.' },
    { title: 'Photograph damage and keep receipts', program: 'FEMA Individual Assistance', st: 'Not started', docs: 'Photos, receipts for food, hotel, repairs' },
  ] },
  { h: 'First 2 weeks', items: [
    { title: 'File regular state unemployment on Jobs4TN', program: 'Tennessee unemployment', st: 'In progress', note: 'Choose “Lack of Work,” then “Disaster related closure.”', docs: 'Social Security number' },
    { title: 'Review and submit your Disaster Unemployment application', program: 'Tennessee DUA', due: 'June 9, 2026', st: 'In progress', label: 'Likely eligible', note: 'Prepared by Mockingbird during your call. You review and submit it.' },
    { title: 'Send DUA documents', program: 'Tennessee DUA', due: '21 days after you file', st: 'Cannot start yet', note: 'Starts after you file.', docs: 'SSN, paystub or tax return, proof of employment' },
  ] },
  { h: 'First 3 months', items: [
    { title: 'Apply for FEMA Individual Assistance', program: 'FEMA, DR-4898', due: 'June 10, 2026', st: 'Not started', label: 'Likely eligible', note: 'Next step. No renters insurance on file. DisasterAssistance.gov or 800-621-3362.', docs: 'Photos, lease, proof of income loss' },
    { title: 'Look at an SBA disaster loan', program: 'SBA', st: 'Not started', label: 'Possibly eligible', note: 'Check SBA’s current deadline and terms.' },
    { title: 'Visit a local recovery center', program: 'Local resources', st: 'Not started', note: 'Ask local emergency management and Community Compass about help near you. Locations vary.' },
  ] },
]
const cls: Record<St, string> = { 'Completed': 'green', 'In progress': 'blue', 'Not started': 'grey', 'Cannot start yet': 'amber' }

export default function Plan() {
  return (
    <div className="page"><div className="col">
      <p className="hint">Step 4 of 5 &bull; When the lights come back</p>
      <h1>James&rsquo;s recovery plan</h1>
      <div className="inset" style={{ marginTop: 0 }}>
        <h3>You&rsquo;re back online. Here&rsquo;s what happened while you were offline.</h3>
        <ul style={{ margin: 0, paddingLeft: 20 }}>{OFFLINE.map((o) => <li key={o}>{o}</li>)}</ul>
      </div>
      <div className="banner" role="region" aria-label="Notification">
        <header>Important &bull; Day 88: April 22, 2026</header>
        <div><b>Disaster Unemployment Assistance is now open for Davidson County.</b> Applications close June 9, 2026. Your application is ready. Review and submit it.</div>
      </div>
      <p>Labels say &ldquo;likely eligible,&rdquo; not approved. Demo rules, not an official determination.</p>
      {GROUPS.map((g) => (
        <section className="task-group" key={g.h}>
          <h2>{g.h}</h2>
          {g.items.map((i) => (
            <div className="task" key={i.title}>
              <div><span className="t">{i.title}</span></div>
              <span className={'tag ' + cls[i.st]}>{i.st}</span>
              <div className="meta">
                {i.program}{i.label ? <> &bull; <b>{i.label}</b></> : null}
                {i.due ? <> &bull; <span style={{ color: 'var(--tn-red)', fontWeight: 700 }}>Due {i.due}</span></> : null}
                {i.note ? <><br />{i.note}</> : null}
                {i.docs ? <><br />Bring: {i.docs}</> : null}
              </div>
            </div>
          ))}
        </section>
      ))}
      <div className="inset"><p><b>Why this matters.</b> FEMA Individual Assistance was added more than two months after the storm. People waited months not knowing what they qualified for. Mockingbird watches for declarations and tells you the moment something opens.</p></div>
      <a className="btn" href="#/responder">Next: what responders see</a>
    </div></div>
  )
}
