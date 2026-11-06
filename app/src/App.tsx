import { useEffect, useState } from 'react'
import { Logo } from './components/Logo'
import { getDemo, setDemo } from './store'
import Profile from './pages/Profile'
import Live from './pages/Live'
import Storm from './pages/Storm'
import Phone from './pages/Phone'
import Plan from './pages/Plan'
import Responder from './pages/Responder'

const ROUTES = [
  { path: '/profile', label: '1 Profile', el: <Profile /> },
  { path: '/storm', label: '2 Storm', el: <Storm /> },
  { path: '/live', label: '3 Call', el: <Live /> },
  { path: '/plan', label: '4 Plan', el: <Plan /> },
  { path: '/responder', label: '5 Map', el: <Responder /> },
]

export default function App() {
  const [path, setPath] = useState(location.hash.slice(1) || '/profile')
  useEffect(() => {
    const f = () => setPath(location.hash.slice(1) || '/profile')
    addEventListener('hashchange', f)
    return () => removeEventListener('hashchange', f)
  }, [])
  useEffect(() => {
    const k = (ev: KeyboardEvent) => {
      const t = ev.target as HTMLElement
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return
      if (ev.key === 'h' || ev.key === 'H') document.body.classList.toggle('rec')
      if (ev.key === 'p' || ev.key === 'P') setDemo({ showCue: !getDemo().showCue })
    }
    addEventListener('keydown', k)
    return () => removeEventListener('keydown', k)
  }, [])
  if (path === '/phone') return <Phone />
  const route = ROUTES.find((r) => r.path === path) ?? ROUTES[0]
  return (
    <>
      <div className="stripe" aria-hidden="true" />
      <header className="topbar">
        <Logo />
        <nav className="nav" aria-label="Main">
          {ROUTES.map((r) => (
            <a key={r.path} href={'#' + r.path} aria-current={r.path === route.path ? 'page' : undefined}>{r.label}</a>
          ))}
        </nav>
        <span className="badge-demo">Demo, fictional data</span>
      </header>
      <main key={route.path}>{route.el}</main>
    </>
  )
}
