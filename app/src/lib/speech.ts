// Browser voice helpers. Mic: Web Speech API (Chrome/Edge, needs internet). AI voice: speechSynthesis (works offline).
/* eslint-disable @typescript-eslint/no-explicit-any */
const w = window as any
export const speechSupported = () => !!(w.SpeechRecognition || w.webkitSpeechRecognition)

// quietMs: send the transcript as final once the words stop changing this long, instead of waiting for the browser's own (slower) end-of-speech call.
export function createListener(h: { onInterim: (s: string) => void; onFinal: (s: string) => void; onError: (m: string) => void }, opts: { quietMs?: number } = {}) {
  let rec: any = null
  let active = false
  let quiet: ReturnType<typeof setTimeout> | null = null
  let last = ''
  let sent = false
  const clearQuiet = () => { if (quiet) { clearTimeout(quiet); quiet = null } }
  const spawn = () => {
    const C = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!C) { h.onError('Speech recognition is not supported here. Use Chrome, or type instead.'); active = false; return }
    rec = new C()
    rec.lang = 'en-US'
    rec.interimResults = true
    rec.continuous = false
    last = ''; sent = false; clearQuiet()
    const mine = rec
    rec.onresult = (e: any) => {
      if (sent || rec !== mine) return
      let interim = '', fin = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) fin += r[0].transcript; else interim += r[0].transcript
      }
      if (interim) {
        h.onInterim(interim.trim())
        last = interim.trim()
        if (opts.quietMs) {
          clearQuiet()
          quiet = setTimeout(() => { quiet = null; if (!sent && last && rec === mine) { sent = true; const t = last; try { mine.abort() } catch { /* ignore */ } h.onFinal(t) } }, opts.quietMs)
        }
      }
      if (fin.trim()) { clearQuiet(); sent = true; h.onFinal(fin.trim()) }
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
    stop() { active = false; clearQuiet(); try { rec?.abort() } catch { /* ignore */ } rec = null },
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
// Live output level (0..1) for the Mockingbird orb. Read from an analyser on the ElevenLabs audio.
let actx: AudioContext | null = null
let analyser: AnalyserNode | null = null
let buf: Uint8Array<ArrayBuffer> | null = null
// Presenter talk-over: lower the AI's volume without touching the conversation. The orb keeps its full level.
let duckGain: GainNode | null = null
let duckLevel = 1
const DUCK = 0.16
export function setDuck(on: boolean) {
  duckLevel = on ? DUCK : 1
  if (duckGain && actx) duckGain.gain.setTargetAtTime(duckLevel, actx.currentTime, 0.2)
  else if (current) current.audio.volume = duckLevel
}
export const isDucked = () => duckLevel < 1
function hookAnalyser(audio: HTMLAudioElement) {
  try {
    if (!actx) { actx = new AudioContext(); analyser = actx.createAnalyser(); analyser.fftSize = 512; analyser.smoothingTimeConstant = 0.6; duckGain = actx.createGain(); duckGain.gain.value = duckLevel; analyser.connect(duckGain); duckGain.connect(actx.destination); buf = new Uint8Array(analyser.fftSize) }
    if (actx.state === 'suspended') void actx.resume()
    actx.createMediaElementSource(audio).connect(analyser!)
  } catch { /* level stays 0, orb falls back to a synthetic pulse */ }
}
export function getLevel(): number {
  if (!analyser || !buf) return 0
  analyser.getByteTimeDomainData(buf)
  let sum = 0
  for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v }
  return Math.min(1, Math.sqrt(sum / buf.length) * 3.2)
}
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
      const cached = await fetch(`${import.meta.env.BASE_URL}voice/${h}.mp3`)
      if (cached.ok && (cached.headers.get('content-type') ?? '').startsWith('audio')) return URL.createObjectURL(await cached.blob())
    }
    for (let attempt = 0; attempt < 2; attempt++) {
      const r = await slot(() => fetch('/api/tts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text }) }))
      if (r.ok) return URL.createObjectURL(await r.blob())
      if (r.status === 404 || r.status === 405) break // hosted build: no generator, cached lines only
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

// Presenter takes over: fade the AI voice out and stop it.
export function fadeOutSpeech(ms = 1200) {
  const cur = current
  if (!cur) { cancelSpeech(); return }
  const a = cur.audio, start = a.volume, t0 = performance.now()
  const step = () => {
    const k = Math.min(1, (performance.now() - t0) / ms)
    a.volume = Math.max(0, start * (1 - k))
    if (k < 1) requestAnimationFrame(step); else { a.pause(); cur.done(); if (current === cur) current = null }
  }
  step()
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
      u.volume = duckLevel
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
      hookAnalyser(audio)
      audio.volume = duckGain ? 1 : duckLevel
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
