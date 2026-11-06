import counties from './tn-counties.json'

// Official list of 29 counties: TEMA via WKRN, Apr 2026 (FEMA IA amendment, DR-4898). DUA opened for the same 29 on Apr 22, 2026.
export const DECLARED = [
  'Benton','Carroll','Cheatham','Chester','Clay','Davidson','Decatur','Dickson','Dyer','Fayette','Hardeman','Hardin',
  'Henderson','Hickman','Lewis','Macon','Madison','Maury','McNairy','Montgomery','Perry','Robertson','Rutherford',
  'Shelby','Sumner','Trousdale','Wayne','Williamson','Wilson',
]
export const STORM_DAY0 = new Date(2026, 0, 24) // Jan 24, 2026 = Day 0
export const DUA_OPEN_DAY = 88 // Apr 22, 2026
export const DUA_DEADLINE = new Date(2026, 5, 9)
export const FEMA_DEADLINE = new Date(2026, 5, 10)

export function dayToDate(day: number) {
  const d = new Date(STORM_DAY0)
  d.setDate(d.getDate() + day)
  return d
}
export const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
export const fmtShort = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

export type Need = 'income' | 'housing' | 'utilities' | 'medical' | 'debris' | 'food'
export type Status = 'new' | 'prepared' | 'referred' | 'resolved'
export type Employment = 'self-employed' | 'hourly' | 'employee' | 'retired'

export const NEEDS: Record<Need, { label: string; color: string }> = {
  income: { label: 'Income loss', color: '#002D65' },
  housing: { label: 'Housing or shelter', color: '#0B7285' },
  utilities: { label: 'Utilities', color: '#B25E00' },
  medical: { label: 'Medical', color: '#CC0000' },
  debris: { label: 'Debris or cleanup', color: '#5B6573' },
  food: { label: 'Food', color: '#7A4B1F' },
}
export const STATUS_LABEL: Record<Status, string> = {
  new: 'New', prepared: 'Form prepared', referred: 'Referred', resolved: 'Resolved',
}

export type Caller = {
  id: number
  county: string
  lat: number
  lng: number
  day: number
  needs: Need[]
  household: number
  employment: Employment
  status: Status
  duaFiled: boolean
  consent: boolean
  uninsuredLoss: boolean
  simulated: boolean
}

export type Program = {
  key: 'DUA' | 'FEMA' | 'SBA' | 'LOCAL'
  name: string
  label: string
  deadline?: Date
  detail: string
}

// Demo rules, not an official determination. LLM extracts facts; this module decides labels.
export function eligibility(c: Pick<Caller, 'county' | 'needs' | 'employment' | 'uninsuredLoss'>): Program[] {
  const declared = DECLARED.includes(c.county)
  const out: Program[] = []
  if (declared && c.needs.includes('income') && c.employment !== 'retired') {
    out.push({ key: 'DUA', name: 'Tennessee Disaster Unemployment Assistance', label: 'Eligible', deadline: DUA_DEADLINE, detail: 'Lost work or self-employment income and county is in the declaration.' })
  }
  if (declared && (c.uninsuredLoss || c.needs.includes('housing') || c.needs.includes('debris'))) {
    out.push({ key: 'FEMA', name: 'FEMA Individual Assistance', label: 'Eligible', deadline: FEMA_DEADLINE, detail: 'County is in the declaration and there is uninsured damage or loss.' })
  }
  if (declared && (c.uninsuredLoss || c.needs.includes('housing'))) {
    out.push({ key: 'SBA', name: 'SBA disaster loan', label: 'Eligible', detail: 'Check current SBA deadline and terms.' })
  }
  out.push({ key: 'LOCAL', name: 'Local resources', label: 'Available', detail: 'Recovery centers, local emergency management, Community Compass.' })
  return out
}

// ---- geometry helpers ----
type Ring = number[][]
type Feat = { properties: { name: string; fips: string }; geometry: { type: string; coordinates: unknown } }
export const COUNTY_FEATURES = (counties as unknown as { features: Feat[] }).features
export const centroids: Record<string, [number, number]> = {}
for (const f of COUNTY_FEATURES) {
  const polys = (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates) as Ring[][]
  let best: Ring = polys[0][0]
  for (const p of polys) if (p[0].length > best.length) best = p[0]
  const xs = best.map((p) => p[0]), ys = best.map((p) => p[1])
  centroids[f.properties.name] = [(Math.min(...ys) + Math.max(...ys)) / 2, (Math.min(...xs) + Math.max(...xs)) / 2]
}

// ---- seeded callers (simulated) ----
function rng(seed: number) {
  let s = seed
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296)
}
const WEIGHTS: Record<string, number> = Object.fromEntries(DECLARED.map((c) => [c, 2])) // spread across the whole declaration
for (const f of COUNTY_FEATURES) if (!(f.properties.name in WEIGHTS)) WEIGHTS[f.properties.name] = 1 // calls come from across the whole state
WEIGHTS.Davidson = 7; WEIGHTS.Shelby = 5; WEIGHTS.Rutherford = 4; WEIGHTS.Williamson = 3; WEIGHTS.Wilson = 3; WEIGHTS.Sumner = 3
export function seedCallers(): Caller[] {
  const r = rng(1776)
  const pool: string[] = []
  for (const [k, w] of Object.entries(WEIGHTS)) for (let i = 0; i < w; i++) pool.push(k)
  const needSets: Need[][] = [['income'], ['income', 'housing'], ['utilities'], ['housing'], ['debris'], ['medical', 'utilities'], ['income', 'utilities'], ['debris', 'housing'], ['food', 'income'], ['food']]
  const emps: Employment[] = ['self-employed', 'hourly', 'employee', 'retired']
  const statuses: Status[] = ['new', 'new', 'prepared', 'referred', 'resolved']
  const list: Caller[] = []
  for (let i = 0; i < 130; i++) {
    const county = pool[Math.floor(r() * pool.length)]
    const [la, ln] = centroids[county]
    const needs = needSets[Math.floor(r() * needSets.length)]
    list.push({
      id: 2001 + i,
      county,
      lat: la + (r() - 0.5) * 0.32,
      lng: ln + (r() - 0.5) * 0.4,
      day: r() < 0.5 ? Math.floor(r() * 10) : 10 + Math.floor(r() * 78),
      needs,
      household: 1 + Math.floor(r() * 5),
      employment: emps[Math.floor(r() * emps.length)],
      status: statuses[Math.floor(r() * statuses.length)],
      duaFiled: r() > 0.55,
      consent: r() > 0.5,
      uninsuredLoss: r() > 0.45,
      simulated: true,
    })
  }
  // Food signal: a cluster of recent food calls in West Tennessee (simulated)
  const food: [string, number][] = [['Shelby', 6], ['Fayette', 2], ['Hardeman', 2]]
  let id = 3001
  for (const [county, n] of food) for (let i = 0; i < n; i++) {
    const [la, ln] = centroids[county]
    list.push({ id: id++, county, lat: la + (r() - 0.5) * 0.12, lng: ln + (r() - 0.5) * 0.16, day: 2 + Math.floor(r() * 3), needs: ['food', 'utilities'], household: 1 + Math.floor(r() * 5), employment: 'hourly', status: 'new', duaFiled: false, consent: false, uninsuredLoss: true, simulated: true })
  }
  list.sort((a, b) => a.day - b.day)
  return list
}

export const JAMES_CALL: Caller = {
  id: 2041, county: 'Davidson', lat: 36.12, lng: -86.72, day: 4, needs: ['income', 'housing'],
  household: 3, employment: 'hourly', status: 'prepared', duaFiled: false, consent: true, uninsuredLoss: true, simulated: false,
}
