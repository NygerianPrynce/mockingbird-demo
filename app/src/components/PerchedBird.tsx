// Idle scene: the Mockingbird bird on a short navy branch. Frame-by-frame from the illustrated pose set
// (idle, blink, ready, wings up), with squash and stretch on the hop and a shadow that follows the height.
const FRAMES = ['idle', 'half', 'blink', 'ready', 'up'] as const

export function PerchedBird() {
  return (
    <div className="perch" role="img" aria-label="The Mockingbird bird resting on a branch">
      <div className="perch-stage">
        <div className="perch-shadow" />
        <div className="perch-bird">
          {FRAMES.map((f) => <img key={f} className={'f-' + f} src={`/bird/${f}.png`} alt="" draggable={false} />)}
        </div>
        <div className="perch-branch" />
      </div>
    </div>
  )
}
