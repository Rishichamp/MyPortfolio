/* ============================================================
   SCENE.JS — the hero's WebGL card.
   A sheet with a handwritten name lies on a scanner glass, hidden
   under a same-colour scribble. Scroll progress (0 → 1) runs the
   "restoration": the scribble dissolves from left to right behind a
   glowing red front, like a model pass, while the card turns flat
   and then lifts away. The pointer tilts the card slightly.
   ============================================================ */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.min.js';
import { makeWordImages, INKS } from './ink.js';

const damp = (a, b, lambda, dt) => a + (b - a) * (1 - Math.exp(-lambda * dt));
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const fit = (v, a, b) => clamp01((v - a) / (b - a));
const easeInOut = (t) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const VERT = /* glsl */`
  uniform float uBend;
  uniform float uTime;
  varying vec2 vUv;
  varying float vShade;
  void main(){
    vUv = uv;
    vec3 p = position;
    // gentle paper curl: lifted at both short edges, a soft wave along the length
    float curl = pow(abs(uv.x - .5) * 2., 2.2) * .16 * uBend;
    float wave = sin(uv.x * 3.14159 * 1.0 + uTime * .6) * .025 * uBend;
    p.z += curl + wave;
    // fake light from the top left: surfaces facing it read brighter
    float slope = (uv.x - .5) * 2. * .16 * uBend * 2.2;
    vShade = .94 + .06 * (1. - uv.y) - slope * .35;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
  }
`;

const FRAG = /* glsl */`
  precision highp float;
  uniform sampler2D uClean;
  uniform sampler2D uMask;
  uniform float uProgress;
  uniform float uFade;
  uniform vec3 uInk;
  uniform vec3 uAccent;
  varying vec2 vUv;
  varying float vShade;

  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3. - 2. * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p){
    float v = 0., a = .5;
    for(int i = 0; i < 4; i++){ v += a * noise(p); p *= 2.03; a *= .5; }
    return v;
  }

  void main(){
    vec3 col = texture2D(uClean, vUv).rgb;
    float m = texture2D(uMask, vUv).r;

    // the restoration front: mostly left → right, with a ragged noisy edge
    float n = fbm(vUv * vec2(7., 3.5));
    float sweep = vUv.x * .62 + n * .38;
    float front = uProgress * 1.18 - .09;
    float keep = smoothstep(front - .035, front + .035, sweep);   // 1 = scribble still there
    float band = 1. - smoothstep(0., .05, abs(sweep - front));     // the glowing edge

    col = mix(col, uInk, m * keep);
    col = mix(col, uAccent, m * band * .9);                         // scribble burns off in red
    col += uAccent * band * .05;                                    // faint scan light on the paper

    col *= vShade;
    gl_FragColor = vec4(col, uFade);
  }
`;

function shadowTexture(){
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(128, 128, 10, 128, 128, 128);
  grd.addColorStop(0, 'rgba(0,0,0,0.55)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * @returns {object|null} controller, or null when WebGL is not available
 */
export function createHeroScene(canvas, { word = 'Rishi Singh', onFrame } = {}){
  let renderer;
  try{
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  }catch(e){
    return null;
  }
  if(!renderer.getContext()) return null;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, .1, 100);
  camera.position.set(0, 0, 11);

  const imgs = makeWordImages(word, { width: 1600, height: 760, ink: INKS.black, seed: 23, density: 1.15 });
  const toTex = (cnv) => {
    const t = new THREE.CanvasTexture(cnv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  };
  const maskTex = new THREE.CanvasTexture(imgs.mask);

  const uniforms = {
    uClean: { value: toTex(imgs.clean) },
    uMask: { value: maskTex },
    uProgress: { value: 0 },
    uFade: { value: 1 },
    uBend: { value: 1 },
    uTime: { value: 0 },
    uInk: { value: new THREE.Color(INKS.black) },
    uAccent: { value: new THREE.Color('#e0391c') },
  };

  const W = 4.2, H = W * (imgs.clean.height / imgs.clean.width);
  const card = new THREE.Mesh(
    new THREE.PlaneGeometry(W, H, 80, 40),
    new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms, transparent: true })
  );
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(W * 1.5, H * 1.9),
    new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false, opacity: .8 })
  );
  shadow.position.z = -.35;

  const rig = new THREE.Group();
  rig.add(shadow, card);
  scene.add(rig);

  const state = {
    target: 0, p: 0,
    mx: 0, my: 0, tmx: 0, tmy: 0,
    visible: true, mobile: false,
    last: performance.now(), raf: 0,
  };

  function resize(){
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    state.mobile = w < 768;
  }
  resize();
  window.addEventListener('resize', resize);

  window.addEventListener('pointermove', (e) => {
    state.tmx = (e.clientX / window.innerWidth) * 2 - 1;
    state.tmy = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  const corners = [
    new THREE.Vector3(-W / 2, H / 2, 0), new THREE.Vector3(W / 2, H / 2, 0),
    new THREE.Vector3(W / 2, -H / 2, 0), new THREE.Vector3(-W / 2, -H / 2, 0),
  ];
  const v = new THREE.Vector3();

  function frame(now){
    state.raf = requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - state.last) / 1000);
    state.last = now;
    state.p = damp(state.p, state.target, 6, dt);
    if(!state.visible) return;

    state.mx = damp(state.mx, state.tmx, 4, dt);
    state.my = damp(state.my, state.tmy, 4, dt);

    const p = state.p;
    const restore = easeInOut(fit(p, .08, .72));   // scribble removal
    const flatten = easeInOut(fit(p, 0, .6));      // card turns to face the viewer
    const leave = easeInOut(fit(p, .78, 1));       // card lifts away

    uniforms.uProgress.value = restore;
    uniforms.uTime.value = now / 1000;
    uniforms.uBend.value = 1 - flatten * .6;
    uniforms.uFade.value = 1 - leave;
    shadow.material.opacity = .8 * (1 - leave);

    // keep the card in the right-hand part of the screen, clear of the copy on the left
    const visH = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const visW = visH * camera.aspect;
    const baseX = state.mobile ? 0 : visW * .2;
    const baseY = state.mobile ? visH * .06 : -visH * .06;
    // never wider than 86% of the screen, never taller than 28% (keeps the name and buttons clear on short screens)
    const scale = state.mobile ? Math.min((visW * .86) / W, (visH * .28) / H) : Math.min(1, (visW * .42) / W, (visH * .42) / H);
    rig.scale.setScalar(scale * (1 - leave * .25));
    rig.position.set(baseX * (1 - flatten * .35), baseY + leave * 2.6 + Math.sin(now / 1400) * .03, 0);
    rig.rotation.set(
      -.62 * (1 - flatten) - .1 + state.my * .1,
      state.mx * .16 - .12 * (1 - flatten),
      .09 * (1 - flatten) - state.mx * .02
    );

    renderer.render(scene, camera);

    if(onFrame){
      card.updateMatrixWorld();
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for(const c of corners){
        v.copy(c).applyMatrix4(card.matrixWorld).project(camera);
        const sx = (v.x * .5 + .5) * window.innerWidth;
        const sy = (-v.y * .5 + .5) * window.innerHeight;
        x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
      }
      onFrame({ x0, y0, x1, y1, restore, leave });
    }
  }
  state.raf = requestAnimationFrame(frame);

  return {
    setProgress(p){ state.target = clamp01(p); },
    jumpTo(p){ state.target = state.p = clamp01(p); },
    setVisible(on){ state.visible = on; canvas.style.visibility = on ? 'visible' : 'hidden'; },
    images: imgs,
  };
}
