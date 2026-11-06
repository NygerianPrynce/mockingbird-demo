import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { HOSTS, openRelay, relaySend, ROOM } from '../lib/relay'

// Pre-demo setup only (#/setup). Checks the relay on this network, then links the phone.
export default function Setup() {
  const url = `${location.origin}${location.pathname}${location.search}#/phone`
  const [qr, setQr] = useState('')
  const [relay, setRelay] = useState<'checking' | 'ok' | 'bad'>('checking')
  const [quota, setQuota] = useState<{ left: number; max: number; reset: Date } | null>(null)
  // The main relay allows 17,280 messages per 12 hours per IP. One full run uses about 80.
  useEffect(() => { fetch(`${HOSTS[0]}/v1/account`).then((r) => r.json()).then((a) => setQuota({ left: a.stats.messages_remaining, max: a.limits.messages, reset: new Date(a.stats.reset_at * 1000) })).catch(() => {}) }, [])
  useEffect(() => { QRCode.toDataURL(url, { margin: 1, width: 220, color: { dark: '#002D65' } }).then(setQr) }, [url])
  useEffect(() => {
    const id = String(Math.random())
    let t = 0
    const close = openRelay((m) => { if (m.type === 'ping' && m.text === id) { clearTimeout(t); setRelay('ok') } }, (open) => { if (open) relaySend({ from: 'screen', type: 'ping', text: id }) })
    t = window.setTimeout(() => setRelay((r) => (r === 'ok' ? r : 'bad')), 8000)
    return () => { clearTimeout(t); close() }
  }, [])
  return (
    <div className="page"><div className="col">
      <h1>Link the phone</h1>
      <p className={relay === 'bad' ? 'hs-err' : ''}>
        {relay === 'checking' && 'Checking the phone relay...'}
        {relay === 'ok' && 'Relay connected on this network.'}
        {relay === 'bad' && 'Cannot reach the relay from this network. Try a hotspot.'}
      </p>
      {quota && <p className={quota.left < 120 ? 'hs-err' : ''}>Messages left on this network: {quota.left} of {quota.max}. A full run uses about 80.{quota.left < 120 && ` Low. Switch networks (hotspot), or wait until ${quota.reset.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.`}</p>}
      <p>Scan with the phone (Wi-Fi or cellular both work), allow the microphone, and leave the page open. Then run the demo from <code>#/profile</code>.</p>
      {qr && <img src={qr} width={220} height={220} alt="QR code for the handset page" />}
      <code style={{ display: 'block' }}>{url}</code>
      <p className="hint">Room: <code>{ROOM}</code>. Only one rehearsal at a time per room.</p>
    </div></div>
  )
}
