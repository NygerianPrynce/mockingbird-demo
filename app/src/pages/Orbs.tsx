import { Orb } from '../components/Orb'
import { OrbWire } from '../components/OrbWire'

// Comparison page for the two orb options (#/orbs). Not part of the demo flow.
export default function Orbs() {
  return (
    <div className="page"><div className="wide" style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
      <div style={{ background: '#E6E9ED', padding: 20, borderRadius: 6, textAlign: 'center' }}><b>A. Glass orb (from your video)</b><br /><Orb phase="speaking" size={380} synthetic /></div>
      <div style={{ background: '#002D65', color: '#fff', padding: 20, borderRadius: 6, textAlign: 'center' }}><b>B. Navy wireframe</b><br /><OrbWire phase="speaking" size={380} synthetic /></div>
    </div></div>
  )
}
