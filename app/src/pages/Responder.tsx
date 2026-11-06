import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import counties from '../data/tn-counties.json'
import { JAMES_CALL, NEEDS, STATUS_LABEL, DECLARED, DUA_DEADLINE, FEMA_DEADLINE, dayToDate, eligibility, fmt, fmtShort, seedCallers } from '../data/tn'
import type { Caller, Need } from '../data/tn'

const RAMP = ['#E8EEF7', '#B9CBE3', '#7C9CC7', '#3A64A0', '#002D65']
const SEED = seedCallers()
const DAYS_PER_SEC = 2.6 // steady: Day 1 to Day 88 in about 33 seconds
const BOUNDS: L.LatLngBoundsLiteral = [[34.9, -90.4], [36.7, -81.7]]

export default function Responder() {
  const mapEl = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const countyLayer = useRef<L.GeoJSON | null>(null)
  const pinLayer = useRef<L.LayerGroup | null>(null)

  const [noticeSent, setNoticeSent] = useState(false)
  const [t, setT] = useState(1)
  const [playing, setPlaying] = useState(false)
  const [selCaller, setSelCaller] = useState<number | null>(null)
  const [selCounty, setSelCounty] = useState<string | null>(null)
  const focusRef = useRef<(n: string, id?: number | null) => void>(() => {})
  const [sigOpen, setSigOpen] = useState(false)
  const [actions, setActions] = useState<Record<string, boolean>>({})
  const [latched, setLatched] = useState<{ county: string; n: number } | null>(null)
  const day = Math.floor(t)

  const all = useMemo(() => [...SEED, JAMES_CALL], [])
  const visible = useMemo(() => all.filter((c) => c.day <= day), [all, day])

  // AI signal: many callers reporting the same need in one county within 3 days. Stays up once raised, until the notice goes out.
  const signal = useMemo(() => {
    const m: Record<string, number> = {}
    all.filter((c) => c.day <= day && c.day >= day - 3 && c.needs.includes('food')).forEach((c) => { m[c.county] = (m[c.county] || 0) + 1 })
    const top = Object.entries(m).sort((a, b) => b[1] - a[1])[0]
    return top && top[1] >= 5 ? { county: top[0], n: top[1] } : null
  }, [all, day])
  useEffect(() => { if (signal && !latched && !noticeSent) setLatched(signal) }, [signal, latched, noticeSent])
  const sig = noticeSent ? null : latched

  const countByCounty = useMemo(() => {
    const m: Record<string, number> = {}
    visible.forEach((c) => { m[c.county] = (m[c.county] || 0) + 1 })
    return m
  }, [visible])

  // autoplay the storm from day 1 to day 88 at one steady speed, driven by the frame clock so the scrubber moves smoothly
  useEffect(() => { const id = setTimeout(() => setPlaying(true), 1500); return () => clearTimeout(id) }, [])
  useEffect(() => {
    if (!playing) return
    let raf = 0, last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000); last = now
      let done = false
      setT((x) => { const n = x + dt * DAYS_PER_SEC; if (n >= 88) { done = true; return 88 } return n })
      if (done) setPlaying(false); else raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing])

  useEffect(() => {
    const m = L.map(mapEl.current!, { zoomSnap: 0, zoomDelta: 0.75, wheelPxPerZoomLevel: 45, zoomControl: false, attributionControl: false, minZoom: 6, maxZoom: 15 })
    L.control.zoom({ position: 'bottomright' }).addTo(m)
    L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(m).addAttribution('Boundaries: US Census Bureau. Tiles &copy; Esri')
    m.on('zoomend', () => m.getContainer().classList.toggle('zoomed', m.getZoom() >= 9))
    // Felt-like light gray streets (Esri Light Gray Canvas, keyless). If offline the county map still works.
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', { maxNativeZoom: 13, maxZoom: 15 }).addTo(m)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}', { maxNativeZoom: 13, maxZoom: 15 }).addTo(m)
    m.createPane('pins').style.zIndex = '450'
    m.fitBounds(BOUNDS, { padding: [10, 10] })
    countyLayer.current = L.geoJSON(counties as never, {
      style: { weight: 1, color: '#9AA6B5', fillColor: '#002D65', fillOpacity: 0 },
      onEachFeature: (ft, layer) => {
        const n = (ft.properties as { name: string }).name
        layer.bindTooltip(n, { sticky: true, className: 'county-label', direction: 'top' })
        layer.on('click', () => focusRef.current(n, null))
      },
    }).addTo(m)
    pinLayer.current = L.layerGroup().addTo(m)
    map.current = m
    const fit = () => { m.invalidateSize(); m.fitBounds(BOUNDS, { padding: [10, 10], animate: false }) }
    const tm = setTimeout(fit, 80)
    const ro = new ResizeObserver(() => m.invalidateSize())
    ro.observe(mapEl.current!)
    return () => { clearTimeout(tm); ro.disconnect(); m.remove(); map.current = null }
  }, [])

  // county heat map
  useEffect(() => {
    const max = Math.max(1, ...Object.values(countByCounty))
    countyLayer.current?.eachLayer((l) => {
      const p = l as L.Path & { feature: { properties: { name: string } } }
      const n = p.feature.properties.name
      const sel = n === selCounty, hot = n === sig?.county, cnt = countByCounty[n] || 0
      p.setStyle({ fillColor: cnt ? RAMP[Math.min(4, Math.ceil((cnt / max) * 5) - 1)] : '#002D65', fillOpacity: cnt ? 0.62 : 0, color: sel ? '#002D65' : hot ? '#CC0000' : '#8C98A8', weight: sel || hot ? 2.5 : 1, dashArray: hot && !sel ? '6 4' : undefined })
      if (sel) p.bringToFront()
    })
  }, [countByCounty, selCounty, sig])

  useEffect(() => {
    const g = pinLayer.current
    g?.clearLayers()
    if (!g) return
    visible.forEach((c) => {
      L.circleMarker([c.lat, c.lng], { pane: 'pins', radius: c.id === JAMES_CALL.id ? 8 : 6, fillColor: NEEDS[c.needs[0]].color, fillOpacity: 1, color: '#fff', weight: 2 })
        .on('click', () => focusRef.current(c.county, c.id)).addTo(g)
    })
  }, [visible])

  const topNeeds = (() => {
    const tally: Record<string, number> = {}
    visible.forEach((c) => c.needs.forEach((n) => { tally[n] = (tally[n] || 0) + 1 }))
    return Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 3)
  })()
  const focusCounty = (name: string, callerId: number | null = null) => {
    setSelCounty(name); setSelCaller(callerId)
    countyLayer.current?.eachLayer((l) => {
      const p = l as L.Polygon & { feature: { properties: { name: string } } }
      if (p.feature.properties.name === name) map.current?.flyToBounds(p.getBounds(), { padding: [60, 60], maxZoom: 10, duration: 1.1 })
    })
  }
  const zoomOut = () => {
    setSelCaller(null); setSelCounty(null)
    map.current?.flyToBounds(BOUNDS, { padding: [10, 10], duration: 1.1 })
  }
  focusRef.current = focusCounty
  const caller = all.find((c) => c.id === selCaller)
  const date = dayToDate(day)
  const act = (id: number, what: string) => setActions((a) => ({ ...a, [`${id}:${what}`]: true }))
  const feed = [...visible].sort((a, b) => b.day - a.day || b.id - a.id).slice(0, 12)

  return (
    <div className="resp">
      <div className="mapwrap">
        <div id="map" ref={mapEl} role="application" aria-label="Map of Tennessee showing calls by county" />
        <div className="mapstats" aria-label="Summary">
          <div><b>{visible.length}</b><span>Calls</span></div>
          <div><b>{Object.keys(countByCounty).length}</b><span>Counties</span></div>
          <div className="tn"><span>Top needs</span><ul>{topNeeds.map(([k]) => <li key={k}>{NEEDS[k as Need].label}</li>)}</ul></div>
        </div>
        <div className="legend">
          {Object.entries(NEEDS).map(([k, v]) => <div key={k}><span className="sw" style={{ background: v.color }} />{v.label}</div>)}
        </div>
        <aside className="side" aria-label="Details">
          {(sig || noticeSent) && (
            <div className={'sigdrop' + (sigOpen ? ' open' : '')}>
              <button className="sigbtn" onClick={() => setSigOpen((o) => !o)} aria-expanded={sigOpen}>
                <span className="sigdot" aria-hidden="true" />
                <span>Signal: Food access, {(sig ?? latched)!.county}</span>
                <span className="chev" aria-hidden="true">{sigOpen ? '\u25B2' : '\u25BC'}</span>
              </button>
              {sigOpen && (
                <div className="sigbody slide">
                  <p>{(sig ?? latched)!.n} callers in the last 3 days cannot get food. Recommend rerouting hot meals to this area.</p>
                  {noticeSent
                    ? <p className="ok"><b>Notice sent</b> to {(sig ?? latched)!.county} County emergency management.</p>
                    : <div className="btnrow"><button className="btn sm" onClick={() => { setNoticeSent(true); focusCounty(latched!.county) }}>Send area notice</button><button className="btn sm secondary" onClick={() => focusCounty(latched!.county)}>Show on map</button></div>}
                </div>
              )}
            </div>
          )}
          <div className="sidescroll">
            {caller ? <CallerPanel c={caller} done={actions} act={act} onClose={zoomOut} />
              : selCounty ? <CountyPanel name={selCounty} calls={visible.filter((c) => c.county === selCounty)} onClose={zoomOut} />
              : (
                <>
                  <div className="pad"><h3>Live feed</h3></div>
                  {feed.map((c) => (
                    <div key={c.id} className="feed-item" onClick={() => focusCounty(c.county, c.id)}>
                      <div><b>{c.id === JAMES_CALL.id ? 'New call' : 'Call'}, {c.county} County</b><br /><span className="hint">{c.needs.map((n) => NEEDS[n].label.toLowerCase()).join(', ')} &bull; {fmtShort(dayToDate(c.day))}</span></div>
                      <button className="btn sm secondary" disabled={!!actions[`${c.id}:call`]} onClick={(ev) => { ev.stopPropagation(); act(c.id, 'call') }}>{actions[`${c.id}:call`] ? 'Calling' : 'Call'}</button>
                    </div>
                  ))}
                </>
              )}
          </div>
        </aside>
      </div>
      <div className="slider">
        <button className="btn sm secondary" onClick={() => { if (t >= 88) setT(1); setPlaying((p) => !p) }} aria-label={playing ? 'Pause' : 'Play'}>{playing ? 'Pause' : t >= 88 ? 'Replay' : 'Play'}</button>
        <b>Day {day}</b><span>{fmt(date)}</span>
        <input type="range" min={1} max={88} step={0.01} value={t} onChange={(e) => { setPlaying(false); setT(+e.target.value) }} aria-label="Days since storm" />
      </div>
    </div>
  )
}

function CallerPanel({ c, done, act, onClose }: { c: Caller; done: Record<string, boolean>; act: (id: number, w: string) => void; onClose: () => void }) {
  const progs = eligibility(c)
  const isJames = c.id === JAMES_CALL.id
  const btn = (what: string, label: string, after: string, primary = false) => (
    <button className={'btn sm' + (primary ? ' primary-wide' : ' secondary')} disabled={!!done[`${c.id}:${what}`]} onClick={() => act(c.id, what)}>{done[`${c.id}:${what}`] ? after : label}</button>
  )
  return (
    <div className="pad slide">
      <button className="btn sm secondary" onClick={onClose}>Back</button>
      <h2 style={{ marginTop: 12 }}>{isJames ? 'James Carter' : `Caller ${c.id}`}</h2>
      <p className="hint">{c.county} County &bull; {fmt(dayToDate(c.day))} &bull; {STATUS_LABEL[c.status]}</p>
      <b>Needs</b><ul className="needlist">{c.needs.map((n) => <li key={n}>{NEEDS[n].label}</li>)}</ul>
      <p><b>Household:</b> {c.household}<br /><b>Work:</b> {c.employment}<br /><b>DUA filed:</b> {c.duaFiled ? 'Yes' : 'No'}</p>
      {isJames && <p className="inset" style={{ margin: '0 0 12px' }}>(615) 555-0142</p>}
      <div className="btnrow stack" style={{ marginBottom: 16 }}>
        {btn('call', 'Have Mockingbird call', 'Calling now', true)}
        {btn('text', c.needs.includes('food') ? 'Text meal sites' : 'Text resources', 'Text sent')}
        {btn('resolve', 'Mark resolved', 'Resolved')}
      </div>
      <h3>Eligible for</h3>
      {progs.map((p) => (
        <div className="chip" key={p.key}><b>{p.name}</b>{p.label}{p.deadline ? <div className="dl">Deadline {fmt(p.deadline)}</div> : null}<div className="hint">{p.detail}</div></div>
      ))}
    </div>
  )
}

function CountyPanel({ name, calls, onClose }: { name: string; calls: Caller[]; onClose: () => void }) {
  const tally: Record<string, number> = {}
  calls.forEach((c) => c.needs.forEach((n) => { tally[n] = (tally[n] || 0) + 1 }))
  const ranked = Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 3)
  const n = (k: string) => calls.filter((c) => eligibility(c).some((p) => p.key === k)).length
  const gap = calls.filter((c) => c.needs.includes('income') && !c.duaFiled).length
  return (
    <div className="pad slide">
      <button className="btn sm secondary" onClick={onClose}>Back</button>
      <h2 style={{ marginTop: 12 }}>{name} County</h2>
      <p className="hint">{DECLARED.includes(name) ? 'In the declaration (DR-4898)' : 'Not in the individual assistance declaration'}</p>
      <p><b>{calls.length}</b> calls</p>
      {ranked.length > 0 && <><b>Top needs</b><ul style={{ margin: '4px 0 14px', paddingLeft: 20 }}>{ranked.map(([k, v]) => <li key={k}>{NEEDS[k as Need].label} ({v})</li>)}</ul></>}
      <h3>Eligible</h3>
      <div className="chip"><b>Tennessee DUA: {n('DUA')}</b><span className="dl">Deadline {fmt(DUA_DEADLINE)}</span></div>
      <div className="chip"><b>FEMA Individual Assistance: {n('FEMA')}</b><span className="dl">Deadline {fmt(FEMA_DEADLINE)}</span></div>
      <div className="chip"><b>SBA disaster loan: {n('SBA')}</b></div>
      <div className="warning" style={{ fontSize: '.9rem' }}><span className="bang" aria-hidden="true">!</span><span>{gap} {gap === 1 ? 'caller has' : 'callers have'} not filed for DUA yet.</span></div>
    </div>
  )
}
