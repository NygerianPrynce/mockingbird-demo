import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

// Pre-demo setup only (#/setup). Link the handset once, then leave it.
export default function Setup() {
  const [urls, setUrls] = useState<string[]>([])
  const [qr, setQr] = useState('')
  useEffect(() => {
    fetch('/api/info').then((r) => r.json()).then(async (info: { ips: string[]; port: string; https: boolean }) => {
      const list = info.ips.map((ip) => `${info.https ? 'https' : 'http'}://${ip}:${info.port}/#/phone`)
      setUrls(list)
      if (list[0]) setQr(await QRCode.toDataURL(list[0], { margin: 1, width: 220, color: { dark: '#002D65' } }))
    }).catch(() => {})
  }, [])
  return (
    <div className="page"><div className="col">
      <h1>Link the phone</h1>
      <p>Scan with the phone, allow the microphone, and leave the page open. Then run the demo from <code>#/profile</code>.</p>
      {qr && <img src={qr} width={220} height={220} alt="QR code for the handset page" />}
      {urls.map((u) => <code key={u} style={{ display: 'block' }}>{u}</code>)}
      <p className="hint">Use <code>npm run dev:phone</code> so the phone mic is allowed (https).</p>
    </div></div>
  )
}
