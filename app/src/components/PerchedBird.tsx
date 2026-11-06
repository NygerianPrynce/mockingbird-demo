// Idle scene: the Mockingbird logo bird resting on a short navy branch. Every few seconds it flaps and lifts a little, then settles.
const WING_B = 'M254 190 C214 140 158 94 92 62 Q84.1 88.8 101.2 98.7 Q95.8 124.2 115.3 132.9 Q112.5 157.1 134.5 164.5 Q134.1 187.4 158.7 193.6 Q160.8 215.2 187.8 220.1 Q192.5 240.4 222.0 244.0 Z'
const WING_F = 'M246 194 C262 150 300 116 356 82 Q353.2 100.2 337.5 108.8 Q334.6 126.6 318.9 134.8 Q315.9 152.2 300.1 160.0 Q297.0 177.0 281.1 184.4 Q278.0 201.0 262.0 208.0 Z'
const BODY = 'M332 178 L313 169 C305 153 283 147 265 157 C247 167 233 184 223 203 C207 228 172 262 132 292 L60 322 L86 331 L78 342 C124 326 192 296 226 272 C254 262 290 238 306 205 C312 193 321 184 332 178Z'

export function PerchedBird() {
  return (
    <svg className="perch" viewBox="20 40 400 340" role="img" aria-label="The Mockingbird bird resting on a branch" preserveAspectRatio="xMidYMid meet">
      <g fill="none" stroke="#002D65" strokeLinecap="round">
        <path d="M96 290 C170 280 280 288 380 270" strokeWidth="12" />
        <path d="M310 282 C328 304 350 314 376 314" strokeWidth="5" />
        <path d="M170 285 C160 308 142 318 120 320" strokeWidth="4" />
      </g>
      <g className="bird">
        {/* far wing */}
        <g transform="translate(250 192)"><g className="wing wf"><g transform="translate(-250 -192)">
          <path d={WING_F} fill="#002D65" />
          <g stroke="#fff" strokeWidth="3.6" strokeLinecap="round"><path d="M291.0 162.3 L325.9 122.2" /><path d="M284.8 173.9 L310.3 144.6" /><path d="M278.4 185.2 L294.7 166.3" /></g>
        </g></g></g>
        <path d={BODY} fill="#fff" stroke="#fff" strokeWidth="9" strokeLinejoin="round" />
        <path d={BODY} fill="#002D65" />
        {/* near wing */}
        <g transform="translate(254 190)"><g className="wing wb"><g transform="translate(-254 -190)">
          <path d={WING_B} fill="#fff" stroke="#fff" strokeWidth="9" strokeLinejoin="round" />
          <path d={WING_B} fill="#002D65" />
          <g stroke="#fff" strokeWidth="4.2" strokeLinecap="round"><path d="M179.4 165.6 L110.6 106.8" /><path d="M185.3 179.9 L123.8 138.6" /><path d="M193.4 193.2 L141.6 168.0" /><path d="M203.5 205.4 L164.1 195.0" /><path d="M215.8 216.5 L191.2 219.6" /></g>
        </g></g></g>
        <path d="M196 282 L100 326" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" />
        <circle cx="299" cy="171" r="3.8" fill="#fff" />
      </g>
    </svg>
  )
}
