import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { getLevel } from '../lib/speech'

// The Mockingbird voice indicator: a navy wireframe sphere with a red core. The surface warbles with the AI's voice.
// The phone has no audio, so it uses a synthetic pulse.
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
const VERT = `
uniform float uTime; uniform float uAmp;
varying vec3 vN; varying vec3 vV; varying float vD;
${NOISE}
void main(){
  float n = snoise(normal*1.6 + vec3(0., uTime*0.7, uTime*0.4));
  float n2 = snoise(normal*3.4 - vec3(uTime*1.1, 0., uTime*0.6));
  float d = (n*0.6 + n2*0.4) * (0.06 + uAmp*0.85);
  vD = d;
  vec4 mv = modelViewMatrix*vec4(position + normal*d,1.);
  vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix*mv;
}`
const FRAG = `
uniform float uAmp; uniform float uGlow;
varying vec3 vN; varying vec3 vV; varying float vD;
void main(){
  float f = pow(1. - max(dot(normalize(vN), normalize(vV)), 0.), 2.2);
  vec3 col = mix(vec3(0.0,0.10,0.27), vec3(0.72,0.82,1.0), f*(0.7+uGlow*0.5)) + vec3(1.)*max(vD,0.)*(1.2+uAmp*3.);
  col = mix(col, vec3(0.88,0.12,0.14), clamp(smoothstep(0.015, 0.11, vD) * 0.4 + f * smoothstep(0.0, 0.08, vD) * 0.25, 0., 0.5));
  gl_FragColor = vec4(col, 0.55 + f*0.45);
}`
export function Orb({ phase, size = 320, synthetic = false }: { phase: string; size?: number; synthetic?: boolean }) {
  const host = useRef<HTMLDivElement>(null)
  const ph = useRef(phase); ph.current = phase
  useEffect(() => {
    const el = host.current!
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); renderer.setSize(size, size); el.appendChild(renderer.domElement)
    const scene = new THREE.Scene(); const cam = new THREE.PerspectiveCamera(35, 1, 0.1, 50); cam.position.z = 5.2
    const uniforms = { uTime: { value: 0 }, uAmp: { value: 0 }, uGlow: { value: 0 } }
    const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false })
    const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 48), mat)
    const wire = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 5), new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG, wireframe: true, transparent: true, opacity: 0.25 }))
    wire.scale.setScalar(1.18)
    const coreMat = new THREE.ShaderMaterial({
      uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
      fragmentShader: 'uniform float uAmp; uniform float uGlow; varying vec3 vN; varying vec3 vV; void main(){ float f = max(dot(normalize(vN), normalize(vV)), 0.); float g = pow(f, 1.6); gl_FragColor = vec4(vec3(1.0, 0.10, 0.08) * g * (0.14 + uAmp*0.9), g * 0.5); }',
    })
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.34, 32, 32), coreMat)
    const group = new THREE.Group(); group.add(ball, wire, core); scene.add(group)
    let raf = 0, t = 0, amp = 0, glow = 0
    const draw = () => {
      t += 0.016
      const p = ph.current, speaking = p === 'speaking', listening = p === 'listening'
      let lv = speaking ? (synthetic ? 0.3 + 0.3 * Math.abs(Math.sin(t * 7.3) * Math.sin(t * 2.1)) : getLevel()) : 0
      if (speaking && !synthetic && lv < 0.02) lv = 0.08 + 0.08 * Math.abs(Math.sin(t * 5))
      const target = speaking ? lv : listening ? 0.05 + 0.03 * Math.sin(t * 2.4) : 0.02 + 0.015 * Math.sin(t * 1.2)
      amp += (target - amp) * (target > amp ? 0.35 : 0.12); glow += ((speaking ? 1 : listening ? 0.5 : 0.2) - glow) * 0.06
      uniforms.uTime.value = t; uniforms.uAmp.value = amp; uniforms.uGlow.value = glow
      group.rotation.y = t * 0.25; group.rotation.x = Math.sin(t * 0.3) * 0.2; wire.rotation.y = -t * 0.18
      ball.scale.setScalar(1 + amp * 0.22)
      core.scale.setScalar(1 + amp * 1.6 + 0.06 * Math.sin(t * 2.2))
      renderer.render(scene, cam); raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); renderer.dispose(); renderer.forceContextLoss(); ball.geometry.dispose(); wire.geometry.dispose(); mat.dispose(); coreMat.dispose(); core.geometry.dispose(); renderer.domElement.remove() }
  }, [size, synthetic])
  return <div ref={host} style={{ width: size, height: size }} aria-hidden="true" />
}
