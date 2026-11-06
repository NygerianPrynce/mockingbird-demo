import { useEffect, useRef } from 'react'

// Phone <-> presenter screen, over public ntfy servers (plain HTTPS, no account, no server of ours).
// Both pages only make outbound HTTPS calls, so it works on school Wi-Fi and on cellular. The room is the topic name.
// Redundant: every message goes to the two big community servers (17,280 messages per 12h per IP). ntfy.sh (250 per 12h) is the last resort.
// Receivers listen on all of them and drop duplicates, so any one server being down or rate limited does not stop the demo.
export const HOSTS = ['https://ntfy.envs.net', 'https://ntfy.adminforge.de', 'https://ntfy.sh']
const PRIMARY = HOSTS.slice(0, 2)
export const ROOM = new URLSearchParams(location.search).get('room') || 'mockingbird-1776-k3q9x7demo'

export type RelayMsg = { from: 'phone' | 'screen'; type: string; text?: string; phase?: string; kp?: { length: number; label: string } | null; id?: string }
const post = (host: string, body: string) => fetch(`${host}/${ROOM}`, { method: 'POST', body }).then((r) => { if (!r.ok) throw new Error(String(r.status)) })
export function relaySend(m: RelayMsg) {
  const body = JSON.stringify({ ...m, id: Math.random().toString(36).slice(2) + Date.now().toString(36) })
  Promise.allSettled(PRIMARY.map((h) => post(h, body))).then((r) => {
    if (r.every((x) => x.status === 'rejected')) post(HOSTS[HOSTS.length - 1], body).catch(() => {})
  })
}
export function openRelay(onMsg: (m: RelayMsg) => void, onState?: (open: boolean) => void) {
  const seen = new Set<string>()
  const up = new Set<string>()
  const sources = HOSTS.map((h) => {
    const es = new EventSource(`${h}/${ROOM}/sse`)
    es.onopen = () => { up.add(h); onState?.(true) }
    es.onerror = () => { up.delete(h); onState?.(up.size > 0) }
    es.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data)
        if (d.event !== 'message' || !d.message) return
        const m = JSON.parse(d.message) as RelayMsg
        if (m.id) { if (seen.has(m.id)) return; seen.add(m.id); if (seen.size > 500) seen.clear() }
        onMsg(m)
      } catch { /* ignore */ }
    }
    return es
  })
  return () => sources.forEach((es) => es.close())
}
export function useRelay(onMsg: (m: RelayMsg) => void) {
  const ref = useRef(onMsg)
  ref.current = onMsg
  useEffect(() => openRelay((m) => ref.current(m)), [])
}
