import { useEffect, useRef } from 'react'

// Idle scene: the Mockingbird bird on a short navy branch, animated frame by frame from the illustrated pose sheet.
// Flap frames are aligned on the eye so the head stays steady; ground frames are aligned on the feet.
// Loop (5.2s): rests ~2s, looks up, crouches, launches, four wingbeats of 8 frames, lands, settles.
const N = 14
const CYCLE = [1, 2, 3, 4, 5, 6, 7, 8]
type Seg = [number, number, number] // frame, start, end (seconds into the loop)
const LOOP = 5.2
function timeline(): Seg[] {
  const segs: Seg[] = [[9, 0, 0.5], [10, 0.5, 0.8], [9, 0.8, 1.3], [11, 1.3, 1.57], [12, 1.57, 1.77]]
  const flapStart = 1.77, flapEnd = 3.73, count = CYCLE.length * 4
  for (let i = 0; i < count; i++) segs.push([CYCLE[i % CYCLE.length], flapStart + ((flapEnd - flapStart) * i) / count, flapStart + ((flapEnd - flapStart) * (i + 1)) / count])
  segs.push([13, 3.73, 3.955], [14, 3.955, 4.36], [9, 4.36, LOOP + 0.001])
  return segs
}
const SEGS = timeline()
// vertical lift as a fraction of the stage height
const HOP: [number, number][] = [[0, 0], [1.3, 0], [1.57, -0.012], [1.77, -0.05], [2.3, -0.1], [3.1, -0.12], [3.73, -0.06], [4.1, 0], [LOOP, 0]]
const SIT = 0.016 // settle the feet onto the limb
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
    let raf = 0
    const t0 = performance.now()
    const BLEND = 0.12 // seconds: the next ground pose fades in over the previous one, which stays solid underneath (no see-through dip)
    const ground = (f: number) => f >= 9
    const tick = (now: number) => {
      const t = ((now - t0) / 1000) % LOOP
      let i = SEGS.findIndex((x) => t >= x[1] && t < x[2]); if (i < 0) i = 0
      const seg = SEGS[i], next = SEGS[(i + 1) % SEGS.length]
      const op: Record<number, number> = { [seg[0]]: 1 }
      let top = seg[0]
      const left = seg[2] - t
      if (next[0] !== seg[0] && (ground(seg[0]) || ground(next[0])) && left < BLEND) { op[next[0]] = 1 - left / BLEND; top = next[0] }
      for (let f = 1; f <= N; f++) { const el = imgs.current[f]; if (el) { const v = String(op[f] ?? 0); if (el.style.opacity !== v) el.style.opacity = v; const z = f === top ? '2' : '1'; if (el.style.zIndex !== z) el.style.zIndex = z } }
      const y = hopAt(t) + SIT
      if (bird.current) bird.current.style.transform = `translateY(${y * 100}%)`
      if (shadow.current) shadow.current.style.transform = `scaleX(${1 + (y - SIT) * 3.5})`
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
          {Array.from({ length: N }, (_, i) => <img key={i} ref={(el) => { imgs.current[i + 1] = el }} src={`${import.meta.env.BASE_URL}bird3/f${i + 1}.svg`} alt="" draggable={false} style={{ opacity: i + 1 === 9 ? 1 : 0 }} />)}
        </div>
        <svg className="perch-branch" viewBox="0 0 980 820" aria-hidden="true">
          {/* limb */}
          <path d="M250 624 C340 606 470 602 600 604 C720 604 810 590 900 560 L906 574 C820 612 730 630 610 630 C480 632 350 640 250 644 Z" fill="#002D65" />
          <path d="M300 618 C400 610 520 610 640 610 C740 610 820 596 890 574" fill="none" stroke="#1F4F92" strokeWidth="3" strokeLinecap="round" opacity=".8" />
          <path d="M320 634 C420 628 520 626 640 622 M420 622 l22 -3 M560 618 l26 -2 M700 612 l24 -4" fill="none" stroke="#0A2347" strokeWidth="2.4" strokeLinecap="round" opacity=".9" />
          <ellipse cx="450" cy="624" rx="13" ry="7" fill="#0A2347" />
          <ellipse cx="740" cy="606" rx="9" ry="5" fill="#0A2347" />
          {/* twigs */}
          <path d="M770 602 C800 570 830 548 870 534" fill="none" stroke="#002D65" strokeWidth="7" strokeLinecap="round" />
          <path d="M830 556 C846 540 856 518 860 496" fill="none" stroke="#002D65" strokeWidth="4" strokeLinecap="round" />
          <path d="M380 638 C360 660 340 672 310 680" fill="none" stroke="#002D65" strokeWidth="6" strokeLinecap="round" />
          {/* leaves */}
          <g fill="#2F6FB8">
            <path d="M870 534 c22 -20 46 -14 54 4 c-20 14 -40 14 -54 -4z" />
            <path d="M860 496 c-4 -24 12 -40 30 -38 c2 22 -8 36 -30 38z" />
            <path d="M846 540 c-10 -22 -26 -28 -42 -22 c4 18 20 28 42 22z" />
            <path d="M310 680 c-22 8 -42 0 -48 -16 c20 -6 38 -2 48 16z" />
            <path d="M338 668 c-6 -22 -22 -30 -38 -26 c2 18 14 30 38 26z" />
          </g>
          <g fill="none" stroke="#7FA8DB" strokeWidth="1.6" strokeLinecap="round"><path d="M872 534 c16 -10 34 -10 46 -2" /><path d="M862 494 c8 -12 18 -22 26 -32" /></g>
        </svg>
      </div>
    </div>
  )
}
