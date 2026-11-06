// Idle scene: the Mockingbird bird on a short navy branch. Frame-by-frame from the illustrated pose set,
// aligned on the eye so the head stays steady while the wings move. It crouches, launches, flaps three times, lands.
const FRAMES = ['perch', 'crouch', 'launch', 'up', 'level', 'down'] as const

export function PerchedBird() {
  return (
    <div className="perch" role="img" aria-label="The Mockingbird bird resting on a branch">
      <div className="perch-stage">
        <div className="perch-shadow" />
        <div className="perch-bird">
          {FRAMES.map((f) => <img key={f} className={'f-' + f} src={`/bird2/${f}.png`} alt="" draggable={false} />)}
        </div>
        <div className="perch-branch" />
      </div>
    </div>
  )
}
