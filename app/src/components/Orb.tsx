import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { getLevel } from '../lib/speech'

// The Mockingbird voice indicator: a 3D glass-like sphere whose surface ripples with the AI's voice.
// It calms while listening and breathes when idle. The phone has no audio, so it uses a synthetic pulse.
const NOISE = `
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.); const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.; vec4 s1=floor(b1)*2.+1.; vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.); m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`
const COMMON = `varying vec3 vN; varying vec3 vV; varying vec3 vP;`
const SHELL_V = `
uniform float uTime; uniform float uAmp;
${COMMON}
${NOISE}
void main(){
  float n = snoise(normal*1.5 + vec3(0., uTime*0.6, uTime*0.35));
  float n2 = snoise(normal*3.2 - vec3(uTime*0.9, 0., uTime*0.5));
  float d = (n*0.65 + n2*0.35) * (0.035 + uAmp*0.30);
  vec3 p = position + normal*d;
  vP = p;
  vec4 mv = modelViewMatrix*vec4(p,1.);
  vN = normalize(normalMatrix*normal);
  vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix*mv;
}`
const SHELL_F = `
uniform float uGlow;
${COMMON}
void main(){
  float f = 1. - max(dot(normalize(vN), normalize(vV)), 0.);
  float rim = pow(f, 1.1);
  vec3 col = mix(vec3(0.90,0.94,1.0), vec3(1.0), rim);
  col -= vec3(0.05,0.03,0.0) * pow(f, 4.);       // thin darker edge like frosted glass
  gl_FragColor = vec4(col, 0.10 + rim*0.9);
}`
const CORE_V = `
${COMMON}
void main(){
  vP = position;
  vec4 mv = modelViewMatrix*vec4(position,1.);
  vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix*mv;
}`
const CORE_F = `
uniform float uTime; uniform float uAmp;
${COMMON}
${NOISE}
void main(){
  float sp = uTime*(0.35 + uAmp*2.2);
  vec3 q = vP*0.95;
  float c = cos(sp*0.6), s = sin(sp*0.6);
  q.xz = mat2(c,-s,s,c)*q.xz;
  float n = snoise(q + vec3(0., sp*0.5, 0.));
  n += 0.55*snoise(q*1.9 - vec3(sp*0.7, 0., sp*0.3));
  n = n*0.5 + 0.5;
  vec3 black = vec3(0.0, 0.0, 0.06);
  vec3 blue = vec3(0.02, 0.05, 0.85);
  vec3 cyan = vec3(0.0, 0.88, 1.0);
  vec3 col = mix(black, blue, smoothstep(0.2, 0.48, n));
  col = mix(col, cyan, smoothstep(0.5, 0.82, n));
  float lines = smoothstep(0.88, 1.0, sin(n*60. + sp*3.)) * 0.18;   // fine engraved lines
  col -= lines;
  float edge = pow(1. - max(dot(normalize(vN), normalize(vV)), 0.), 3.);
  col += edge*0.25;
  gl_FragColor = vec4(col, 1.);
}`
const PART_V = `
uniform float uTime; uniform float uAmp;
attribute float aSeed;
void main(){
  vec3 p = position * (1. + uAmp*0.9*aSeed + 0.02*sin(uTime*1.3 + aSeed*20.));
  vec4 mv = modelViewMatrix*vec4(p,1.);
  gl_PointSize = 1.6 + aSeed*1.4 + uAmp*2.;
  gl_Position = projectionMatrix*mv;
}`
const PART_F = `
void main(){
  vec2 c = gl_PointCoord - .5;
  if (dot(c,c) > .25) discard;
  gl_FragColor = vec4(0.35, 0.62, 0.95, 0.65);
}`

export function Orb({ phase, size = 320, synthetic = false }: { phase: string; size?: number; synthetic?: boolean }) {
  const host = useRef<HTMLDivElement>(null)
  const ph = useRef(phase); ph.current = phase
  useEffect(() => {
    const el = host.current!
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
    renderer.setSize(size, size)
    el.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    const cam = new THREE.PerspectiveCamera(35, 1, 0.1, 50); cam.position.z = 5.0
    const uniforms = { uTime: { value: 0 }, uAmp: { value: 0 }, uGlow: { value: 0 } }
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.84, 32), new THREE.ShaderMaterial({ uniforms, vertexShader: CORE_V, fragmentShader: CORE_F }))
    core.renderOrder = 1
    const shellMat = new THREE.ShaderMaterial({ uniforms, vertexShader: SHELL_V, fragmentShader: SHELL_F, transparent: true, depthWrite: false })
    const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 48), shellMat)
    shell.renderOrder = 2
    // speckle around the silhouette
    const N = 900, pos = new Float32Array(N * 3), seed = new Float32Array(N)
    for (let i = 0; i < N; i++) {
      const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, r = 1.02 + Math.random() * 0.22 * Math.random()
      const k = Math.sqrt(1 - u * u)
      pos.set([r * k * Math.cos(th), r * u, r * k * Math.sin(th)], i * 3); seed[i] = Math.random()
    }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); pg.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    const pts = new THREE.Points(pg, new THREE.ShaderMaterial({ uniforms, vertexShader: PART_V, fragmentShader: PART_F, transparent: true, depthWrite: false }))
    const body = new THREE.Group(); body.add(core, shell, pts)
    // thin cyan arcs and faint rings, always facing the viewer
    const halo = new THREE.Group()
    const arcs: THREE.Line[] = []
    const mk = (r: number, a0: number, len: number, col: number, op: number) => {
      const P: THREE.Vector3[] = []
      for (let i = 0; i <= 48; i++) { const a = a0 + (len * i) / 48; P.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0)) }
      const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(P), new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: op })); halo.add(l); return l
    }
    ;[[1.75, 0.3, 1.0], [2.0, 2.6, 0.7], [1.6, 4.4, 0.8]].forEach(([r, a0, len]) => arcs.push(mk(r, a0, len, 0x1fc8e8, 0.9)))
    ;[1.5, 1.95, 2.4].forEach((r) => mk(r, 0, Math.PI * 2, 0x9aa7b8, 0.18))
    scene.add(body, halo)
    let raf = 0, t = 0, amp = 0, glow = 0
    const draw = () => {
      t += 0.016
      const p = ph.current, speaking = p === 'speaking', listening = p === 'listening'
      let lv = speaking ? (synthetic ? 0.3 + 0.3 * Math.abs(Math.sin(t * 7.3) * Math.sin(t * 2.1)) : getLevel()) : 0
      if (speaking && !synthetic && lv < 0.02) lv = 0.08 + 0.08 * Math.abs(Math.sin(t * 5))
      const target = speaking ? lv : listening ? 0.05 + 0.03 * Math.sin(t * 2.4) : 0.02 + 0.015 * Math.sin(t * 1.2)
      amp += (target - amp) * (target > amp ? 0.35 : 0.12)
      glow += ((speaking ? 1 : listening ? 0.5 : 0.2) - glow) * 0.06
      uniforms.uTime.value = t; uniforms.uAmp.value = amp; uniforms.uGlow.value = glow
      body.rotation.y = t * 0.22; body.rotation.x = Math.sin(t * 0.3) * 0.18
      body.scale.setScalar(1 + amp * 0.12)
      arcs.forEach((l, i) => { l.rotation.z = t * (0.5 + i * 0.25) * (i % 2 ? -1 : 1); l.scale.setScalar(1 + amp * (0.25 + i * 0.1)); (l.material as THREE.LineBasicMaterial).opacity = 0.35 + glow * 0.6 })
      renderer.render(scene, cam)
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); renderer.dispose(); renderer.forceContextLoss(); core.geometry.dispose(); shell.geometry.dispose(); shellMat.dispose(); pg.dispose(); renderer.domElement.remove() }
  }, [size, synthetic])
  return <div ref={host} style={{ width: size, height: size }} aria-hidden="true" />
}
