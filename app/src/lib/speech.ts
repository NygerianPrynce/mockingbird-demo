// Browser voice helpers. Mic: Web Speech API (Chrome/Edge, needs internet). AI voice: speechSynthesis (works offline).
/* eslint-disable @typescript-eslint/no-explicit-any */
const w = window as any
export const speechSupported = () => !!(w.SpeechRecognition || w.webkitSpeechRecognition)

export function createListener(h: { onInterim: (s: string) => void; onFinal: (s: string) => void; onError: (m: string) => void }) {
  let rec: any = null
  let active = false
  const spawn = () => {
    const C = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!C) { h.onError('Speech recognition is not supported here. Use Chrome, or type instead.'); active = false; return }
    rec = new C()
    rec.lang = 'en-US'
    rec.interimResults = true
    rec.continuous = false
    rec.onresult = (e: any) => {
      let interim = '', fin = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) fin += r[0].transcript; else interim += r[0].transcript
      }
      if (interim) h.onInterim(interim.trim())
      if (fin.trim()) h.onFinal(fin.trim())
    }
    rec.onerror = (e: any) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { active = false; h.onError('Microphone blocked. Allow it in the browser, or type instead.') }
      else if (e.error === 'network') { active = false; h.onError('Speech recognition needs internet. Type instead, or use the Next button.') }
    }
    rec.onend = () => { if (active) setTimeout(() => { if (active) { try { spawn() } catch { /* ignore */ } } }, 150) }
    try { rec.start() } catch { /* already started */ }
  }
  return {
    start() { if (active) return; active = true; spawn() },
    stop() { active = false; try { rec?.abort() } catch { /* ignore */ } rec = null },
  }
}

function pickVoice(): SpeechSynthesisVoice | undefined {
  const vs = speechSynthesis.getVoices().filter((v) => v.lang.startsWith('en'))
  const prefer = ['Samantha', 'Google US English', 'Ava', 'Allison', 'Karen', 'Daniel']
  for (const p of prefer) { const v = vs.find((x) => x.name.includes(p)); if (v) return v }
  return vs.find((v) => v.lang === 'en-US') ?? vs[0]
}


// ---- AI voice: ElevenLabs first (cached on disk by the dev server), browser voice as fallback ----
const blobs = new Map<string, Promise<string | null>>()
let current: { audio: HTMLAudioElement; done: () => void } | null = null
// Conversational pace: play ElevenLabs audio faster (pitch preserved).
export const VOICE_RATE = 1.1
export const voiceStatus = { source: 'none' as 'none' | 'elevenlabs' | 'browser' }

async function sha1(text: string) {
  if (!crypto?.subtle) return null
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
// ElevenLabs limits concurrent requests, so generate at most 2 at a time and retry once.
let active = 0
const waiting: (() => void)[] = []
async function slot<T>(fn: () => Promise<T>): Promise<T> {
  if (active >= 2) await new Promise<void>((r) => waiting.push(r))
  active++
  try { return await fn() } finally { active--; waiting.shift()?.() }
}
async function fetchAudio(text: string): Promise<string | null> {
  try {
    const h = await sha1(text)
    if (h) {
      const cached = await fetch(`/voice/${h}.mp3`)
      if (cached.ok && (cached.headers.get('content-type') ?? '').startsWith('audio')) return URL.createObjectURL(await cached.blob())
    }
    for (let attempt = 0; attempt < 2; attempt++) {
      const r = await slot(() => fetch('/api/tts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text }) }))
      if (r.ok) return URL.createObjectURL(await r.blob())
      await new Promise((x) => setTimeout(x, 1200))
    }
  } catch { /* fall through to browser voice */ }
  return null
}
export function loadAudio(text: string) {
  let p = blobs.get(text)
  if (!p) { p = fetchAudio(text); blobs.set(text, p); p.then((u) => { if (!u) blobs.delete(text) }) }
  return p
}
export function warmVoice(texts: string[]) { return Promise.all(texts.filter(Boolean).map(loadAudio)) }

export function cancelSpeech() {
  if (current) { current.audio.pause(); current.done(); current = null }
  if ('speechSynthesis' in window) speechSynthesis.cancel()
}

function speakBrowser(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) { setTimeout(resolve, Math.min(5000, 700 + text.length * 22)); return }
    setTimeout(resolve, 3000 + text.length * 95) // safety: never hang if the browser never fires onend
    speechSynthesis.cancel()
    const parts = text.split(/(?<=[.?!])\s+/).filter(Boolean)
    const voice = pickVoice()
    parts.forEach((p, i) => {
      const u = new SpeechSynthesisUtterance(p)
      if (voice) u.voice = voice
      u.lang = 'en-US'
      u.rate = 0.95
      if (i === parts.length - 1) { u.onend = () => resolve(); u.onerror = () => resolve() }
      speechSynthesis.speak(u)
    })
  })
}

export async function speak(text: string, enabled: boolean): Promise<void> {
  if (!enabled) return new Promise((r) => setTimeout(r, Math.min(5000, 700 + text.length * 22)))
  const url = await loadAudio(text)
  if (url) {
    voiceStatus.source = 'elevenlabs'
    return new Promise<void>((resolve) => {
      const audio = new Audio(url)
      audio.playbackRate = VOICE_RATE
      const done = () => { if (current?.audio === audio) current = null; resolve() }
      current = { audio, done }
      audio.onended = done
      audio.onerror = done
      audio.play().catch(done)
    })
  }
  voiceStatus.source = 'browser'
  return speakBrowser(text)
}
