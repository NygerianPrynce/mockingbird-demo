import react from '@vitejs/plugin-react'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import os from 'node:os'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { defineConfig, loadEnv } from 'vite'
import type { Plugin } from 'vite'

// Server-side ElevenLabs proxy so the API key never reaches the browser.
// Every generated line is cached to public/voice/<sha1>.mp3, so after one run-through the demo works offline.
function elevenLabs(env: Record<string, string>): Plugin {
  const handler = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (req.url !== '/api/tts' || req.method !== 'POST') return next()
    try {
      let body = ''
      for await (const c of req) body += c
      const { text } = JSON.parse(body || '{}') as { text?: string }
      if (!text || text.length > 2000) { res.statusCode = 400; return res.end('bad request') }
      const hash = createHash('sha1').update(text).digest('hex')
      const dir = path.resolve('public/voice')
      const file = path.join(dir, hash + '.mp3')
      if (!fs.existsSync(file)) {
        if (!env.ELEVENLABS_API_KEY || !env.ELEVENLABS_VOICE_ID) { res.statusCode = 501; return res.end('ElevenLabs not configured') }
        const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${env.ELEVENLABS_VOICE_ID}?output_format=mp3_44100_128`, {
          method: 'POST',
          headers: { 'xi-api-key': env.ELEVENLABS_API_KEY, 'content-type': 'application/json' },
          body: JSON.stringify({ text, model_id: env.ELEVENLABS_MODEL || 'eleven_multilingual_v2' }),
        })
        if (!r.ok) { res.statusCode = 502; return res.end(await r.text()) }
        fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()))
      }
      res.setHeader('content-type', 'audio/mpeg')
      res.end(fs.readFileSync(file))
    } catch (e) {
      res.statusCode = 500
      res.end(String(e))
    }
  }
  return {
    name: 'elevenlabs-tts',
    configureServer(s) { s.middlewares.use(handler) },
    configurePreviewServer(s) { s.middlewares.use(handler) },
  }
}

// Phone relay: the "handset" page (/#/phone) sends speech to the presenter screen over server-sent events.
function phoneRelay(): Plugin {
  const clients = new Set<ServerResponse>()
  const handler = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (req.url === '/api/relay' && req.method === 'GET') {
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' })
      res.write(':ok\n\n')
      clients.add(res)
      const hb = setInterval(() => res.write(':hb\n\n'), 15000)
      req.on('close', () => { clearInterval(hb); clients.delete(res) })
      return
    }
    if (req.url === '/api/relay/send' && req.method === 'POST') {
      let body = ''
      for await (const c of req) body += c
      for (const c of clients) c.write(`data: ${body}\n\n`)
      res.end('ok')
      return
    }
    if (req.url === '/api/info') {
      const ips = Object.values(os.networkInterfaces()).flat().filter((i) => i && i.family === 'IPv4' && !i.internal).map((i) => i!.address)
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify({ ips, port: (req.headers.host ?? '').split(':')[1] ?? '', https: !!(req.socket as unknown as { encrypted?: boolean }).encrypted }))
      return
    }
    next()
  }
  return { name: 'phone-relay', configureServer(s) { s.middlewares.use(handler) }, configurePreviewServer(s) { s.middlewares.use(handler) } }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), elevenLabs(loadEnv(mode, process.cwd(), '')), phoneRelay(), ...(process.env.HTTPS ? [basicSsl()] : [])],
  server: { host: true },
}))
