import { useEffect, useRef } from 'react'

// Phone <-> presenter screen, over the public ntfy.sh pub/sub service (plain HTTPS, no account, no server of ours).
// Both pages only make outbound HTTPS calls, so it works on school Wi-Fi and on cellular. The room is the topic name.
// Anonymous limits apply (about 60 message burst, 250 a day per IP), so interim speech is NOT relayed.
const HOST = 'https://ntfy.sh'
export const ROOM = new URLSearchParams(location.search).get('room') || 'mockingbird-1776-k3q9x7demo'

export type RelayMsg = { from: 'phone' | 'screen'; type: string; text?: string; phase?: string; kp?: { length: number; label: string } | null }
export function relaySend(m: RelayMsg) {
  fetch(`${HOST}/${ROOM}`, { method: 'POST', body: JSON.stringify(m) }).catch(() => {})
}
export function openRelay(onMsg: (m: RelayMsg) => void, onState?: (open: boolean) => void) {
  const es = new EventSource(`${HOST}/${ROOM}/sse`)
  es.onopen = () => onState?.(true)
  es.onerror = () => onState?.(false)
  es.onmessage = (e) => {
    try { const d = JSON.parse(e.data); if (d.event === 'message' && d.message) onMsg(JSON.parse(d.message)) } catch { /* ignore */ }
  }
  return () => es.close()
}
export function useRelay(onMsg: (m: RelayMsg) => void) {
  const ref = useRef(onMsg)
  ref.current = onMsg
  useEffect(() => openRelay((m) => ref.current(m)), [])
}
