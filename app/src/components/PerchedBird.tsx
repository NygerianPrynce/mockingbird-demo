import { useEffect, useRef } from 'react'

// Idle scene: the Mockingbird bird on a short navy branch, animated frame by frame from the illustrated pose sheet.
// Flap frames are aligned on the eye so the head stays steady; ground frames are aligned on the feet.
// Loop (9s): rests, looks up, crouches, launches, three wingbeats of 8 frames, lands, settles.
const N = 14
const CYCLE = [1, 2, 3, 4, 5, 6, 7, 8]
type Seg = [number, number, number] // frame, start, end (fractions of the loop)
function timeline(): Seg[] {
  const segs: Seg[] = [[9, 0, 0.3], [10, 0.3, 0.36], [9, 0.36, 0.52], [11, 0.52, 0.57], [12, 0.57, 0.6]]
  const flapStart = 0.6, flapEnd = 0.86, count = CYCLE.length * 3
  for (let i = 0; i < count; i++) segs.push([CYCLE[i % CYCLE.length], flapStart + ((flapEnd - flapStart) * i) / count, flapStart + ((flapEnd - flapStart) * (i + 1)) / count])
  segs.push([13, 0.86, 0.9], [14, 0.9, 0.94], [9, 0.94, 1.0001])
  return segs
}
const SEGS = timeline()
// vertical lift as a fraction of the stage height
const HOP: [number, number][] = [[0, 0], [0.52, 0], [0.57, -0.012], [0.6, -0.05], [0.66, -0.1], [0.8, -0.12], [0.86, -0.06], [0.9, 0], [1, 0]]
const hopAt = (t: number) => {
  for (let i = 1; i < HOP.length; i++) if (t <= HOP[i][0]) { const [t0, y0] = HOP[i - 1], [t1, y1] = HOP[i]; const k = (t - t0) / (t1 - t0); return y0 + (y1 - y0) * (k * k * (3 - 2 * k)) }
  return 0
}

export function PerchedBird() {
  const imgs = useRef<(HTMLImageElement | null)[]>([])
  const bird = useRef<HTMLDivElement>(null)
  const shadow = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { if (imgs.current[9]) imgs.current[9]!.style.opacity = '1'; return }
    let raf = 0, cur = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const t = ((now - t0) % 9000) / 9000
      const seg = SEGS.find((s) => t >= s[1] && t < s[2]) ?? SEGS[0]
      if (seg[0] !== cur) { if (cur) imgs.current[cur]!.style.opacity = '0'; imgs.current[seg[0]]!.style.opacity = '1'; cur = seg[0] }
      const y = hopAt(t)
      if (bird.current) bird.current.style.transform = `translateY(${y * 100}%)`
      if (shadow.current) shadow.current.style.transform = `scaleX(${1 + y * 3.5})`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <div className="perch" role="img" aria-label="The Mockingbird bird resting on a branch">
      <div className="perch-stage">
        <div className="perch-shadow" ref={shadow} />
        <div className="perch-bird" ref={bird}>
          {Array.from({ length: N }, (_, i) => <img key={i} ref={(el) => { imgs.current[i + 1] = el }} src={`/bird3/f${i + 1}.png`} alt="" draggable={false} style={{ opacity: i + 1 === 9 ? 1 : 0 }} />)}
        </div>
        <div className="perch-branch" />
      </div>
    </div>
  )
}
