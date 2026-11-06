import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import counties from '../data/tn-counties.json'
import { JAMES_CALL, NEEDS, STATUS_LABEL, DECLARED, DUA_DEADLINE, FEMA_DEADLINE, centroids, dayToDate, eligibility, fmt, fmtShort, seedCallers } from '../data/tn'
import type { Caller, Need, Status } from '../data/tn'
import { useDemo } from '../store'

const RAMP = ['#E8EEF7', '#B9CBE3', '#7C9CC7', '#3A64A0', '#002D65']
const STATUS_RING: Record<Status, string> = { new: '#002D65', prepared: '#1E7B3A', referred: '#B25E00', resolved: '#9AA3AF' }
const SIM_OUTAGES: [string, number][] = [['Davidson', 14000], ['Rutherford', 9000], ['Shelby', 11000], ['Sumner', 8000]]
const SIM_CENTERS: [string, number, number][] = [['Davidson', 36.17, -86.78], ['Shelby', 35.15, -90.05], ['Rutherford', 35.85, -86.39], ['Madison', 35.61, -88.81]]
const SEED = seedCallers()

type Filters = { county: string; need: string; program: string; status: string; noDua: boolean }
const NO_F: Filters = { county: '', need: '', program: '', status: '', noDua: false }

export default function Responder() {
  const demo = useDemo()
  const mapEl = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const countyLayer = useRef<L.GeoJSON | null>(null)
  const pinLayer = useRef<L.LayerGroup | null>(null)
  const extraLayer = useRef<L.LayerGroup | null>(null)
  const tiles = useRef<L.LayerGroup | null>(null)

  const [james, setJames] = useState(false)
  const [noticeSent, setNoticeSent] = useState(false)
  const [day, setDay] = useState(4)
  const [f, setF] = useState<Filters>(NO_F)
  const [view, setView] = useState<'responder' | 'public'>('responder')
  const [layers, setLayers] = useState({ pins: true, heat: false, outage: false, centers: false, streets: true })
  const [selCaller, setSelCaller] = useState<number | null>(null)
  const [selCounty, setSelCounty] = useState<string | null>(null)
  const [fresh, setFresh] = useState(false)

  const all = useMemo(() => (james ? [...SEED, JAMES_CALL] : SEED), [james])
  const visible = useMemo(() => all.filter((c) =>
    c.day <= day &&
    (!f.county || c.county === f.county) &&
    (!f.need || c.needs.includes(f.need as Need)) &&
    (!f.status || c.status === f.status) &&
    (!f.program || eligibility(c).some((p) => p.key === f.program)) &&
    (!f.noDua || (c.needs.includes('income') && !c.duaFiled))
  ), [all, day, f])

  // AI signal: many callers reporting the same need in one county within 3 days
  const signal = useMemo(() => {
    const m: Record<string, number> = {}
    all.filter((c) => c.day <= day && c.day >= day - 3 && c.needs.includes('food')).forEach((c) => { m[c.county] = (m[c.county] || 0) + 1 })
    const top = Object.entries(m).sort((a, b) => b[1] - a[1])[0]
    return top && top[1] >= 5 ? { county: top[0], n: top[1] } : null
  }, [all, day])

  const countByCounty = useMemo(() => {
    const m: Record<string, number> = {}
    visible.forEach((c) => { m[c.county] = (m[c.county] || 0) + 1 })
    return m
  }, [visible])
  const showHeat = layers.heat || view === 'public'
  const showPins = layers.pins && view === 'responder'
  const date = dayToDate(day)

  // map init (no tile layer: fully offline, Tennessee is the subject)
  useEffect(() => {
    const m = L.map(mapEl.current!, { zoomSnap: 0.25, zoomControl: false, attributionControl: false, minZoom: 6, maxZoom: 11 })
    L.control.zoom({ position: 'bottomright' }).addTo(m)
    L.control.attribution({ position: 'bottomright', prefix: false }).addTo(m).addAttribution('Boundaries: US Census Bureau')
    m.on('zoomend', () => m.getContainer().classList.toggle('zoomed', m.getZoom() >= 9))
    // Felt-like light gray basemap: Esri Light Gray Canvas (keyless, needs Esri attribution). If offline, tiles just fail and the county map still works.
    tiles.current = L.layerGroup([L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', { maxZoom: 13, attribution: 'Tiles &copy; Esri' }), L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}', { maxZoom: 13 })]).addTo(m)
    m.createPane('outage').style.zIndex = '410'
    m.createPane('pins').style.zIndex = '450'
    m.createPane('centers').style.zIndex = '460'
    m.fitBounds([[34.9, -90.4], [36.7, -81.7]], { padding: [10, 10] })
    countyLayer.current = L.geoJSON(counties as never, {
      style: { weight: 1, color: '#9AA6B5', fillColor: '#002D65', fillOpacity: 0 },
      onEachFeature: (ft, layer) => {
        const n = (ft.properties as { name: string }).name
        layer.bindTooltip(n + (DECLARED.includes(n) ? '' : ' (not in declaration)'), { sticky: true, className: 'county-label', direction: 'top' })
        layer.on('click', () => { setSelCounty(n); setSelCaller(null) })
      },
    }).addTo(m)
    pinLayer.current = L.layerGroup().addTo(m)
    extraLayer.current = L.layerGroup().addTo(m)
    map.current = m
    const fit = () => { m.invalidateSize(); m.fitBounds([[34.9, -90.4], [36.7, -81.7]], { padding: [10, 10], animate: false }) }
    const t = setTimeout(fit, 80)
    const ro = new ResizeObserver(() => m.invalidateSize())
    ro.observe(mapEl.current!)
    return () => { clearTimeout(t); ro.disconnect(); m.remove(); map.current = null }
  }, [])

  // county styling: choropleth + selection + declared tint
  useEffect(() => {
    const max = Math.max(1, ...Object.values(countByCounty))
    countyLayer.current?.eachLayer((l) => {
      const p = l as L.Path & { feature: { properties: { name: string } } }
      const n = p.feature.properties.name
      const sel = n === selCounty
      const sig = n === signal?.county
      const cnt = countByCounty[n] || 0
      const fill = showHeat && cnt ? RAMP[Math.min(4, Math.ceil((cnt / max) * 5) - 1)] : '#002D65'
      const op = showHeat ? (cnt ? 0.72 : 0) : DECLARED.includes(n) ? 0.05 : 0
      p.setStyle({ fillColor: fill, fillOpacity: op, color: sel ? '#002D65' : sig ? '#CC0000' : '#8C98A8', weight: sel || sig ? 2.5 : 1, dashArray: sig && !sel ? '6 4' : undefined })
      if (sel) p.bringToFront()
    })
  }, [countByCounty, showHeat, selCounty, signal])

  // pins
  useEffect(() => {
    const g = pinLayer.current
    g?.clearLayers()
    if (!g || !showPins) return
    visible.forEach((c) => {
      const isNew = c.id === JAMES_CALL.id
      L.circleMarker([c.lat, c.lng], { pane: 'pins', radius: 12, fill: false, color: STATUS_RING[c.status], weight: 1.5, interactive: false, opacity: c.status === 'resolved' ? 0.6 : 1 }).addTo(g)
      if (isNew && fresh) L.circleMarker([c.lat, c.lng], { pane: 'pins', radius: 12, fill: false, color: '#002D65', weight: 2, interactive: false, className: 'pulse' }).addTo(g)
      L.circleMarker([c.lat, c.lng], { pane: 'pins', radius: 7, fillColor: NEEDS[c.needs[0]].color, fillOpacity: c.status === 'resolved' ? 0.55 : 1, color: '#fff', weight: 2 })
        .on('click', () => { setSelCaller(c.id); setSelCounty(c.county) }).addTo(g)
    })
  }, [visible, showPins, fresh])

  useEffect(() => {
    const m = map.current, t = tiles.current
    if (!m || !t) return
    if (layers.streets) t.addTo(m); else m.removeLayer(t)
  }, [layers.streets])

  // simulated layers
  useEffect(() => {
    const g = extraLayer.current
    g?.clearLayers()
    if (!g) return
    if (layers.outage) SIM_OUTAGES.forEach(([n, r]) => L.circle(centroids[n], { pane: 'outage', radius: r * (day < 15 ? 3 : 0.5), color: '#B25E00', weight: 1, dashArray: '4 4', fillColor: '#B25E00', fillOpacity: 0.12, interactive: false }).addTo(g))
    if (layers.centers) SIM_CENTERS.forEach(([n, la, ln]) => L.marker([la, ln], { pane: 'centers', icon: L.divIcon({ className: '', html: '<div style="width:12px;height:12px;background:#fff;border:3px solid #1E7B3A"></div>', iconSize: [12, 12] }) }).bindTooltip(`Recovery center, ${n} (simulated)`).addTo(g))
  }, [layers.outage, layers.centers, day])

  const dropJames = () => {
    setJames(true); setFresh(true); setSelCaller(null)
    map.current?.flyTo([JAMES_CALL.lat, JAMES_CALL.lng], 8.5, { duration: 1.2 })
    setTimeout(() => setFresh(false), 4500)
  }

  // stats
  const prog = (k: string) => visible.filter((c) => eligibility(c).some((p) => p.key === k)).length
  const needTally: Record<string, number> = {}
  visible.forEach((c) => c.needs.forEach((n) => { needTally[n] = (needTally[n] || 0) + 1 }))
  const top = Object.entries(needTally).sort((a, b) => b[1] - a[1])[0]
  const caller = all.find((c) => c.id === selCaller)
  const feed = [...visible].sort((a, b) => b.day - a.day || b.id - a.id).slice(0, 14)

  return (
    <div className="resp">
      <div className="stats">
        <div className="stat"><b>{visible.length}</b><span>Calls shown</span></div>
        <div className="stat"><b>{Object.keys(countByCounty).length}</b><span>Counties affected</span></div>
        <div className="stat"><b style={{ fontSize: '1.1rem', lineHeight: '1.7rem' }}>{top ? NEEDS[top[0] as Need].label : 'None'}</b><span>Top need</span></div>
        <div className="stat"><b>{prog('DUA')}</b><span>Likely DUA</span></div>
        <div className="stat"><b>{prog('FEMA')}</b><span>Likely FEMA IA</span></div>
        <div className="stat"><b>{prog('SBA')}</b><span>Possibly SBA</span></div>
        <div className="stat"><b>{visible.filter((c) => c.status === 'prepared').length}</b><span>Forms prepared</span></div>
        <div className="stat warn"><b>{signal ? 1 : 0}</b><span>Open signals</span></div>
        <div style={{ marginLeft: 'auto', padding: '10px 22px', alignSelf: 'center' }}><span className="tag grey">Seeded data is simulated</span></div>
      </div>
      <div className="filters">
        <label>County<select value={f.county} onChange={(e) => setF({ ...f, county: e.target.value })}><option value="">All</option>{DECLARED.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label>Need<select value={f.need} onChange={(e) => setF({ ...f, need: e.target.value })}><option value="">All</option>{Object.entries(NEEDS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></label>
        <label>Program<select value={f.program} onChange={(e) => setF({ ...f, program: e.target.value })}><option value="">All</option><option value="DUA">Tennessee DUA</option><option value="FEMA">FEMA IA</option><option value="SBA">SBA loan</option></select></label>
        <label>Status<select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option value="">All</option>{Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        <label style={{ flexDirection: 'row', alignItems: 'center', gap: 6, textTransform: 'none', letterSpacing: 0, fontSize: '.85rem' }}>
          <input type="checkbox" checked={f.noDua} onChange={(e) => setF({ ...f, noDua: e.target.checked })} /> Income loss, no DUA filed yet</label>
        <button className="btn sm secondary" onClick={() => setF(NO_F)}>Clear filters</button>
        <span style={{ marginLeft: 'auto' }} />
        <div className="seg" role="group" aria-label="View">
          <button aria-pressed={view === 'public'} onClick={() => setView('public')}>Public aggregate</button>
          <button aria-pressed={view === 'responder'} onClick={() => setView('responder')}>Responder view</button>
        </div>
        <button className="btn sm" onClick={dropJames} disabled={james}>{james ? 'James’s call received' : demo.jamesCalled ? 'Drop James’s call on the map' : 'Simulate incoming call'}</button>
      </div>
      <div className="mapwrap">
        <div id="map" ref={mapEl} role="application" aria-label="Map of Tennessee showing calls by county" />
        <div className="layerbox" role="group" aria-label="Layers">
          <b style={{ fontSize: '.7rem', textTransform: 'uppercase', color: 'var(--ink-secondary)' }}>Layers</b>
          <label><input type="checkbox" checked={layers.streets} onChange={(e) => setLayers({ ...layers, streets: e.target.checked })} /> Streets (needs internet)</label>
          <label><input type="checkbox" checked={layers.pins} onChange={(e) => setLayers({ ...layers, pins: e.target.checked })} /> Pins</label>
          <label><input type="checkbox" checked={showHeat} disabled={view === 'public'} onChange={(e) => setLayers({ ...layers, heat: e.target.checked })} /> County heat map</label>
          <label><input type="checkbox" checked={layers.outage} onChange={(e) => setLayers({ ...layers, outage: e.target.checked })} /> Power outage (simulated)</label>
          <label><input type="checkbox" checked={layers.centers} onChange={(e) => setLayers({ ...layers, centers: e.target.checked })} /> Recovery centers (simulated)</label>
        </div>
        <div className="legend">
          {showPins && Object.entries(NEEDS).map(([k, v]) => <div key={k}><span className="sw" style={{ background: v.color }} />{v.label}</div>)}
          {showPins && <div className="caption" style={{ marginTop: 4 }}>Ring: New, Prepared, Referred, Resolved</div>}
          {showHeat && <><div style={{ marginTop: 6 }}>Calls per county</div><div className="ramp">{RAMP.map((c) => <i key={c} style={{ background: c }} />)}</div><div className="caption" style={{ display: 'flex', justifyContent: 'space-between' }}><span>Fewer</span><span>More</span></div></>}
        </div>
        <aside className="side" aria-label="Details">
          {caller ? <CallerPanel c={caller} view={view} onClose={() => setSelCaller(null)} />
            : selCounty ? <CountyPanel name={selCounty} calls={visible.filter((c) => c.county === selCounty)} onClose={() => setSelCounty(null)} />
            : (
              <>
                {signal && (
                  <div className="pad slide" style={{ borderBottom: '1px solid var(--border)', background: '#FFF8F8' }}>
                    <span className="tag" style={{ color: 'var(--tn-red)', borderColor: 'var(--tn-red)', background: '#fff' }}>Signal</span>
                    <h3 style={{ marginTop: 8 }}>Food access, {signal.county} County</h3>
                    <p style={{ fontSize: '.92rem' }}>{signal.n} callers in the last 3 days say they cannot get food. Recommend rerouting hot meals and food distribution to this area.</p>
                    {!noticeSent
                      ? <button className="btn sm" onClick={() => { setNoticeSent(true); setF({ ...NO_F, need: 'food' }); setLayers((l) => ({ ...l, heat: true })) }}>Send area notice (demo)</button>
                      : <div className="inset" style={{ margin: 0, fontSize: '.88rem' }}><b>Notice drafted (demo)</b><br />To {signal.county} County emergency management: {signal.n} callers report no food access since Day {day - 3}. Recommend hot meal distribution. Simulated data.</div>}
                  </div>
                )}
                <div className="pad"><h3>Live feed</h3><p className="hint">Click a pin or a county for details. Public view shows counts only.</p></div>
                {feed.map((c) => (
                  <div key={c.id} className={'feed-item' + (c.id === JAMES_CALL.id && fresh ? ' new' : '')} onClick={() => { setSelCaller(c.id); setSelCounty(c.county) }} style={{ cursor: 'pointer' }}>
                    <b>{c.id === JAMES_CALL.id ? 'New call' : 'Call'}, {c.county} County</b><br />
                    <span className="hint">{c.needs.map((n) => NEEDS[n].label.toLowerCase()).join(', ')} &bull; {fmtShort(dayToDate(c.day))}{c.simulated ? ' \u2022 simulated' : ''}</span>
                  </div>
                ))}
              </>
            )}
        </aside>
      </div>
      <div className="slider">
        <b>Day {day}</b><span>{fmt(date)}</span>
        <input type="range" min={1} max={88} value={day} onChange={(e) => setDay(+e.target.value)} aria-label="Days since storm" />
        <button className="btn sm secondary" onClick={() => { setDay(1); let d = 1; const id = setInterval(() => { d += 2; if (d >= 88) { d = 88; clearInterval(id) } setDay(d) }, 70) }}>Replay storm to Day 88</button>
      </div>
    </div>
  )
}

function CallerPanel({ c, view, onClose }: { c: Caller; view: string; onClose: () => void }) {
  const progs = eligibility(c)
  const isJames = c.id === JAMES_CALL.id
  return (
    <div className="pad slide">
      <button className="btn sm secondary" onClick={onClose}>Back</button>
      <h2 style={{ marginTop: 12 }}>Caller {c.id}</h2>
      <p className="hint">{c.county} County &bull; {fmt(dayToDate(c.day))} &bull; {STATUS_LABEL[c.status]}{c.simulated ? ' \u2022 simulated' : ''}</p>
      <p><b>Needs:</b> {c.needs.map((n) => NEEDS[n].label).join(', ')}<br /><b>Household:</b> {c.household}<br /><b>Work:</b> {c.employment}<br /><b>DUA filed:</b> {c.duaFiled ? 'Yes' : 'No'}</p>
      {view === 'responder' && c.consent
        ? <p className="inset" style={{ margin: '0 0 16px' }}><b>Opted in to share details</b><br />{isJames ? 'James Carter (fictional), (615) 555-0142' : 'Contact details held in responder system'}</p>
        : <p className="hint">Name and phone are not shown. Caller did not opt in, or this is the public view.</p>}
      <h3>Programs likely eligible for</h3>
      {progs.map((p) => (
        <div className="chip" key={p.key}><b>{p.name}</b>{p.label}{p.deadline ? <div className="dl">Deadline {fmt(p.deadline)}</div> : null}<div className="hint">{p.detail}</div></div>
      ))}
      <p className="caption">Demo rules, not an official determination.</p>
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
      <p className="hint">{DECLARED.includes(name) ? 'In the declaration (DR-4898)' : 'Not in the individual assistance declaration'} &bull; simulated calls</p>
      <p><b>{calls.length}</b> calls<br /><b>Top needs:</b> {ranked.length ? ranked.map(([k, v]) => `${NEEDS[k as Need].label} (${v})`).join(', ') : 'None'}</p>
      <h3>Likely eligible</h3>
      <div className="chip"><b>Tennessee DUA: {n('DUA')}</b><span className="dl">Deadline {fmt(DUA_DEADLINE)}</span></div>
      <div className="chip"><b>FEMA Individual Assistance: {n('FEMA')}</b><span className="dl">Deadline {fmt(FEMA_DEADLINE)}</span></div>
      <div className="chip"><b>SBA disaster loan (possible): {n('SBA')}</b></div>
      <div className="warning" style={{ fontSize: '.9rem' }}><span className="bang" aria-hidden="true">!</span><span>Gap: {gap} {gap === 1 ? 'caller has' : 'callers have'} not filed for DUA yet (simulated).</span></div>
    </div>
  )
}
