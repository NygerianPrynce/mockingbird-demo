import { useEffect, useState } from 'react'
import { Logo } from './components/Logo'
import { setDemo, useDemo } from './store'
import Profile from './pages/Profile'
import Live from './pages/Live'
import Storm from './pages/Storm'
import Phone from './pages/Phone'
import Setup from './pages/Setup'
import Plan from './pages/Plan'
import Responder from './pages/Responder'

const ROUTES = [
  { path: '/profile', label: 'Profile', el: <Profile /> },
  { path: '/storm', label: 'Storm', el: <Storm /> },
  { path: '/live', label: 'Call', el: <Live /> },
  { path: '/plan', label: 'Plan', el: <Plan /> },
  { path: '/responder', label: 'Map', el: <Responder /> },
]

function Stopwatch() {
  const { startedAt } = useDemo()
  const [, tick] = useState(0)
  useEffect(() => { const id = setInterval(() => tick((x) => x + 1), 500); return () => clearInterval(id) }, [])
  const s = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0
  return <span className="badge-demo" title="Demo timer. Starts on the first Start. T resets.">{Math.floor(s / 60)}:{String(s % 60).padStart(2, '0')}</span>
}

export default function App() {
  const [path, setPath] = useState(location.hash.slice(1) || '/profile')
  useEffect(() => {
    const f = () => setPath(location.hash.slice(1) || '/profile')
    addEventListener('hashchange', f)
    return () => removeEventListener('hashchange', f)
  }, [])
  useEffect(() => { document.body.classList.add('rec') }, [])
  const [needsClick, setNeedsClick] = useState(!navigator.userActivation?.hasBeenActive)
  useEffect(() => {
    if (!needsClick) return
    const f = () => setNeedsClick(false)
    addEventListener('pointerdown', f); addEventListener('keydown', f)
    return () => { removeEventListener('pointerdown', f); removeEventListener('keydown', f) }
  }, [needsClick])
  useEffect(() => {
    const k = (ev: KeyboardEvent) => {
      const t = ev.target as HTMLElement
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return
      if (ev.key === 'h' || ev.key === 'H') document.body.classList.toggle('rec')
      const i = ROUTES.findIndex((r) => r.path === (location.hash.slice(1) || '/profile'))
      if ((ev.key === 'n' || ev.key === 'N' || ev.key === 'ArrowRight') && i >= 0 && i < ROUTES.length - 1) location.hash = ROUTES[i + 1].path
      if ((ev.key === 'ArrowLeft') && i > 0) location.hash = ROUTES[i - 1].path
      if (ev.key === 't' || ev.key === 'T') setDemo({ startedAt: null })
    }
    addEventListener('keydown', k)
    return () => removeEventListener('keydown', k)
  }, [])
  if (path === '/phone') return <Phone />
  if (path === '/setup') return <Setup />
  const route = ROUTES.find((r) => r.path === path) ?? ROUTES[0]
  return (
    <>
      <div className="stripe" aria-hidden="true" />
      <header className="topbar">
        <Logo />
        <nav className="nav" aria-label="Main">
          {['Services', 'Unemployment', 'Disaster relief', 'Housing and food', 'Health', 'Contact'].map((l) => (
            <a key={l} className="fake" href="#" onClick={(e) => e.preventDefault()}>{l}</a>
          ))}
        </nav>
        <Stopwatch />
      </header>
      {needsClick && <div className="arm">Click once to enable sound</div>}
      <main key={route.path}>{route.el}</main>
    </>
  )
}
