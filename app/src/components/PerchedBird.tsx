// Idle scene: a mockingbird perched on a branch. Now and then it hops, flies a short loop, and comes back down.
export function PerchedBird() {
  return (
    <svg className="perch" viewBox="0 0 800 420" role="img" aria-label="A mockingbird resting on a branch" preserveAspectRatio="xMidYMid meet">
      <g className="branch" fill="none" stroke="#B9CBE3" strokeLinecap="round">
        <path d="M-10 330 C140 318 260 340 400 332 C540 324 660 306 810 318" strokeWidth="14" />
        <path d="M120 326 C150 296 170 280 205 272" strokeWidth="6" />
        <path d="M560 316 C590 296 640 288 690 292" strokeWidth="6" />
        <path d="M470 330 C480 352 500 366 530 372" strokeWidth="5" />
      </g>
      <g fill="#6F8FBF" opacity=".75">
        <path className="leaf l1" d="M205 272 q18 -22 40 -14 q-8 22 -40 14z" />
        <path className="leaf l2" d="M690 292 q20 -20 42 -10 q-10 22 -42 10z" />
        <path className="leaf l3" d="M530 372 q22 4 30 24 q-24 4 -30 -24z" />
      </g>
      <g className="bird">
        <g className="tail"><path d="M338 244 L250 290 L258 302 L344 266Z" fill="#fff" /></g>
        <ellipse cx="380" cy="248" rx="58" ry="36" transform="rotate(-8 380 248)" fill="#fff" />
        <circle cx="436" cy="214" r="24" fill="#fff" />
        <path d="M456 208 L488 216 L456 224Z" fill="#B9CBE3" />
        <circle cx="444" cy="210" r="3.6" fill="#002D65" />
        <g className="wing"><path d="M404 236 C374 224 330 238 304 262 C340 270 384 268 410 252Z" fill="#B9CBE3" /><path d="M392 244 L328 258 M398 252 L340 266" stroke="#fff" strokeWidth="3" strokeLinecap="round" /></g>
        <path d="M372 282 L372 322 M392 282 L394 322" stroke="#B9CBE3" strokeWidth="4" strokeLinecap="round" />
      </g>
    </svg>
  )
}
