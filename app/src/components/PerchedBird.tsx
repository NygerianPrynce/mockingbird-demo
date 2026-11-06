// Idle scene: a side-view Mockingbird (redrawn for animation, same navy and white as the logo) on a short branch.
// The wing is a fan of separate feathers, so it bends and trails like a real wing. Every few seconds the bird
// crouches, hops, flaps, and lands. Squash and stretch, blinks, a tail flick, and a shadow that follows the height.
const LENS = [76, 88, 98, 106, 102, 90, 74]
const feather = (L: number) => `M0 0 C${L * 0.25} -10 ${L * 0.78} -10 ${L} 0 C${L * 0.78} 10 ${L * 0.25} 10 0 0Z`

export function PerchedBird() {
  return (
    <svg className="perch" viewBox="20 40 380 300" role="img" aria-label="The Mockingbird bird resting on a branch" preserveAspectRatio="xMidYMid meet">
      <path d="M70 312 C150 304 280 310 370 298" fill="none" stroke="#002D65" strokeWidth="12" strokeLinecap="round" />
      <path d="M300 306 C318 322 340 328 362 326" fill="none" stroke="#002D65" strokeWidth="5" strokeLinecap="round" />
      <ellipse className="shadow" cx="200" cy="322" rx="66" ry="7" fill="#002D65" opacity=".14" />
      <g transform="translate(200 304)"><g className="bird-all"><g transform="translate(-200 -304)">
        {/* legs */}
        <path d="M204 276 L202 306 M228 270 L230 306" stroke="#002D65" strokeWidth="4" strokeLinecap="round" />
        {/* tail */}
        <g transform="translate(142 258)"><g className="tail">
          <path d="M0 -7 L-142 36 L-130 51 L8 13Z" fill="#002D65" stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
          <path d="M-14 16 L-104 42" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
        </g></g>
        {/* body */}
        <path d="M118 262 C138 226 190 196 240 192 C270 190 288 204 288 222 C288 246 262 270 224 282 C186 294 144 290 118 262Z" fill="#002D65" />
        <path d="M176 284 C206 288 240 278 262 256" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".9" />
        {/* head */}
        <g transform="translate(272 194)"><g className="head">
          <circle cx="0" cy="-6" r="24" fill="#002D65" />
          <path d="M20 -10 L62 -2 L20 4Z" fill="#002D65" />
          <g transform="translate(10 -12)"><g className="eye"><circle r="6.5" fill="#fff" /><circle cx="1.6" r="3.3" fill="#002D65" /></g></g>
        </g></g>
        {/* wing: seven feathers in a fan; the whole fan swings from the shoulder */}
        <g transform="translate(214 224)"><g className="wing">
          {LENS.map((L, i) => (
            <g key={i} className="fan" style={{ ['--i' as string]: i }}>
              <g className="feather" style={{ ['--i' as string]: i }}>
                <path d={feather(L)} fill="#002D65" stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
                <path d={`M${L * 0.18} 0 L${L * 0.62} 0`} stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
              </g>
            </g>
          ))}
        </g></g>
      </g></g></g>
    </svg>
  )
}
