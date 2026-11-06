import { useEffect, useRef } from 'react'

export type RelayMsg = { from: 'phone' | 'screen'; type: string; text?: string; phase?: string; kp?: { length: number; label: string } | null }
export function relaySend(m: RelayMsg) {
  fetch('/api/relay/send', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(m) }).catch(() => {})
}
export function useRelay(onMsg: (m: RelayMsg) => void) {
  const ref = useRef(onMsg)
  ref.current = onMsg
  useEffect(() => {
    const es = new EventSource('/api/relay')
    es.onmessage = (e) => { try { ref.current(JSON.parse(e.data)) } catch { /* ignore */ } }
    return () => es.close()
  }, [])
}
