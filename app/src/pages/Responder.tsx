import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import counties from '../data/tn-counties.json'
import { JAMES_CALL, NEEDS, STATUS_LABEL, DECLARED, DUA_DEADLINE, FEMA_DEADLINE, dayToDate, eligibility, fmt, seedCallers } from '../data/tn'
import type { Caller, Need } from '../data/tn'

const RAMP = ['#E8EEF7', '#B9CBE3', '#7C9CC7', '#3A64A0', '#002D65']
const SEED = seedCallers()
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

  // autoplay the storm from day 1 to day 88; slow at the start where the early calls come in
  useEffect(() => { const id = setTimeout(() => setPlaying(true), 1500); return () => clearTimeout(id) }, [])
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => setT((x) => { const n = x + (x < 10 ? 0.15 : 0.4); if (n >= 88) { setPlaying(false); return 88 } return n }), 100)
    return () => clearInterval(id)
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
        layer.on('click', () => { setSelCounty(n); setSelCaller(null) })
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
      if (c.id === JAMES_CALL.id) L.circleMarker([c.lat, c.lng], { pane: 'pins', radius: 13, fill: false, color: '#002D65', weight: 2, interactive: false, className: 'pulse' }).addTo(g)
      L.circleMarker([c.lat, c.lng], { pane: 'pins', radius: 6, fillColor: NEEDS[c.needs[0]].color, fillOpacity: 1, color: '#fff', weight: 2 })
        .on('click', () => { setSelCaller(c.id); setSelCounty(c.county) }).addTo(g)
    })
  }, [visible])

  const top = (() => {
    const tally: Record<string, number> = {}
    visible.forEach((c) => c.needs.forEach((n) => { tally[n] = (tally[n] || 0) + 1 }))
    return Object.entries(tally).sort((a, b) => b[1] - a[1])[0]
  })()
  const caller = all.find((c) => c.id === selCaller)
  const date = dayToDate(day)

  return (
    <div className="resp">
      <div className="mapwrap">
        <div id="map" ref={mapEl} role="application" aria-label="Map of Tennessee showing calls by county" />
        <div className="mapstats" aria-label="Summary">
          <div><b>{visible.length}</b><span>Calls</span></div>
          <div><b>{Object.keys(countByCounty).length}</b><span>Counties</span></div>
          <div><b>{top ? NEEDS[top[0] as Need].label : 'None'}</b><span>Top need</span></div>
        </div>
        {sig && (
          <div className="signalcard slide">
            <span className="tag" style={{ color: 'var(--tn-red)', borderColor: 'var(--tn-red)', background: '#fff' }}>Signal</span>
            <h3 style={{ marginTop: 8 }}>Food access, {sig.county} County</h3>
            <p>{sig.n} callers in the last 3 days cannot get food. Recommend rerouting hot meals to this area.</p>
            <button className="btn sm" onClick={() => { setNoticeSent(true); setSelCounty(sig.county) }}>Send area notice (demo)</button>
          </div>
        )}
        {noticeSent && latched && (
          <div className="signalcard slide"><b>Notice sent (demo)</b><p style={{ margin: '6px 0 0' }}>To {latched.county} County emergency management: {latched.n} callers report no food access. Recommend hot meal distribution.</p></div>
        )}
        {(caller || selCounty) && (
          <aside className="side" aria-label="Details">
            {caller ? <CallerPanel c={caller} onClose={() => setSelCaller(null)} /> : <CountyPanel name={selCounty!} calls={visible.filter((c) => c.county === selCounty)} onClose={() => setSelCounty(null)} />}
          </aside>
        )}
        <div className="legend">
          {Object.entries(NEEDS).map(([k, v]) => <div key={k}><span className="sw" style={{ background: v.color }} />{v.label}</div>)}
        </div>
      </div>
      <div className="slider">
        <button className="btn sm secondary" onClick={() => { if (t >= 88) setT(1); setPlaying((p) => !p) }} aria-label={playing ? 'Pause' : 'Play'}>{playing ? 'Pause' : t >= 88 ? 'Replay' : 'Play'}</button>
        <b>Day {day}</b><span>{fmt(date)}</span>
        <input type="range" min={1} max={88} value={day} onChange={(e) => { setPlaying(false); setT(+e.target.value) }} aria-label="Days since storm" />
      </div>
    </div>
  )
}

function CallerPanel({ c, onClose }: { c: Caller; onClose: () => void }) {
  const progs = eligibility(c)
  const isJames = c.id === JAMES_CALL.id
  return (
    <div className="pad slide">
      <button className="btn sm secondary" onClick={onClose}>Back</button>
      <h2 style={{ marginTop: 12 }}>Caller {c.id}</h2>
      <p className="hint">{c.county} County &bull; {fmt(dayToDate(c.day))} &bull; {STATUS_LABEL[c.status]}{c.simulated ? ' \u2022 simulated' : ''}</p>
      <p><b>Needs:</b> {c.needs.map((n) => NEEDS[n].label).join(', ')}<br /><b>Household:</b> {c.household}<br /><b>Work:</b> {c.employment}<br /><b>DUA filed:</b> {c.duaFiled ? 'Yes' : 'No'}</p>
      {c.consent
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
