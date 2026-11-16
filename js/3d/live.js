// Живое 3D на странице: часы крутятся от прокрутки (spin) и пальцем (drag).
// Модели — те же, что в кадрах каталога. Грузится только когда блок рядом с экраном.
import * as THREE from './three.module.js';
import { buildEnv } from './watch.js';
import { buildModel } from './models.js';
import { SPECS } from './catalog-specs.js';
import { GLTFLoader } from './jsm/loaders/GLTFLoader.js';

const D = THREE.MathUtils.degToRad, lerp = THREE.MathUtils.lerp;

function stage(canvas) {
  const box = { w: 1, h: 1 };
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 1);
  const scene = new THREE.Scene(); scene.environment = buildEnv(renderer);
  const cam = new THREE.PerspectiveCamera(20, 1, 10, 2000);
  const mk = (c, i, x, y, z) => { const l = new THREE.PointLight(c, i, 0, 0); l.position.set(x, y, z); scene.add(l); };
  mk(0xffffff, 2.6, -45, 70, 95); mk(0xfff0dc, 1.6, 70, -10, 60); mk(0xdfe8ff, 1.2, -70, -50, 40);
  let model = null, dist = 238;
  function setModel(id) {
    if (model) { scene.remove(model); model.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); }
    model = buildModel(SPECS[id]); scene.add(model); return model;
  }
  function size() {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1; box.w = w; box.h = h;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    // часы целиком помещаются и в узкий, и в широкий кадр
    cam.fov = w / h < 1 ? 2 * Math.atan(Math.tan(D(10)) / (w / h)) * 180 / Math.PI : 20;
    cam.updateProjectionMatrix();
  }
  function render() { renderer.render(scene, cam); }
  function pose(rx, ry, rz, d, y) {
    if (!model) return;
    model.rotation.set(D(rx), D(ry), D(rz), 'XZY');
    cam.position.set(0, y || 0, d || dist); cam.lookAt(0, y || 0, 0);
  }
  return { renderer, scene, cam, setModel, size, render, pose, box, get model() { return model; } };
}

/* Идея 1: часы поворачиваются, пока листаешь. progress 0..1 задаёт страница. */
export function mountSpin(canvas, id) {
  const st = stage(canvas); st.setModel(id); st.size();
  // ключевые позы: сбоку → прямо → браслет снизу → вполоборота
  const K = [
    { p: 0, r: [4, -78, 0], d: 250 },
    { p: 0.34, r: [6, -12, 0], d: 230 },
    { p: 0.67, r: [-38, 8, 0], d: 214 },
    { p: 1, r: [10, 34, -6], d: 200 },
  ];
  const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  let last = -1;
  function draw(p) {
    p = Math.max(0, Math.min(1, p));
    if (Math.abs(p - last) < 0.0005) return; last = p;
    let i = 0; while (i < K.length - 2 && p > K[i + 1].p) i++;
    const a = K[i], b = K[i + 1], t = ease((p - a.p) / (b.p - a.p));
    st.pose(lerp(a.r[0], b.r[0], t), lerp(a.r[1], b.r[1], t), lerp(a.r[2], b.r[2], t), lerp(a.d, b.d, t));
    st.render();
  }
  const ro = new ResizeObserver(() => { st.size(); last = -1; });
  ro.observe(canvas);
  return { draw };
}

/* Идея 5: Santos можно крутить пальцем или мышью, с инерцией */
export function mountDrag(canvas, id) {
  const st = stage(canvas); st.setModel(id); st.size();
  let rx = 6, ry = -16, vx = 0, vy = 0, drag = false, px = 0, py = 0, raf = 0, alive = true;
  const clampX = (v) => Math.max(-60, Math.min(60, v));
  function frame() {
    raf = 0; if (!alive) return;
    if (!drag) { ry += vy; rx = clampX(rx + vx); vy *= 0.93; vx *= 0.9; }
    st.pose(rx, ry, 0, 215); st.render();
    if (drag || Math.abs(vx) > 0.01 || Math.abs(vy) > 0.01) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }
  canvas.addEventListener('pointerdown', (e) => { drag = true; px = e.clientX; py = e.clientY; vx = vy = 0; canvas.setPointerCapture(e.pointerId); kick(); });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - px, dy = e.clientY - py; px = e.clientX; py = e.clientY;
    vy = dx * 0.45; vx = dy * 0.3; ry += vy; rx = clampX(rx + vx); kick();
  });
  const up = () => { drag = false; kick(); };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  // с клавиатуры — стрелками
  canvas.addEventListener('keydown', (e) => {
    const k = { ArrowLeft: [0, -12], ArrowRight: [0, 12], ArrowUp: [-8, 0], ArrowDown: [8, 0] }[e.key];
    if (!k) return; e.preventDefault(); rx = clampX(rx + k[0]); ry += k[1]; kick();
  });
  const ro = new ResizeObserver(() => { st.size(); kick(); });
  ro.observe(canvas);
  kick();
  return {
    setModel(nid) { st.setModel(nid); kick(); },
    destroy() { alive = false; ro.disconnect(); st.renderer.dispose(); },
  };
}

/* «Покрутить в 3D»: готовая 3D-модель часов (glb), пальцем или мышью, с инерцией.
   Модель приводим к виду «циферблат на камеру, 12 часов вверх» и к высоте 100 единиц. */
export function mountDragGlb(canvas, url, area) {
  const el = area || canvas;
  const st = stage(canvas); st.size();
  const outer = new THREE.Group(), fix = new THREE.Group(); outer.add(fix); fix.rotation.y = D(-37);
  let alive = true, loaded = false;
  const ready = new GLTFLoader().loadAsync(url).then((g) => {
    if (!alive) return;
    const m = g.scene, box = new THREE.Box3().setFromObject(m), c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
    const k = 100 / Math.max(sz.x, sz.y, sz.z); m.scale.setScalar(k); m.position.copy(c).multiplyScalar(-k);
    fix.add(m); st.scene.add(outer); loaded = true; kick();
  });
  let rx = 4, ry = -12, vx = 0, vy = 0, drag = false, px = 0, py = 0, raf = 0;
  const clampX = (v) => Math.max(-60, Math.min(60, v));
  function frame() {
    raf = 0; if (!alive) return;
    if (!drag) { ry += vy; rx = clampX(rx + vx); vy *= 0.93; vx *= 0.9; }
    outer.rotation.set(D(rx), D(ry), 0, 'XZY');
    st.cam.position.set(0, 0, 300); st.cam.lookAt(0, 0, 0); st.render();
    if (drag || Math.abs(vx) > 0.01 || Math.abs(vy) > 0.01) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && loaded) raf = requestAnimationFrame(frame); }
  const onDown = (e) => {
    if (e.button > 0 || e.target.closest('button, a')) return;   // кнопки и ссылки в окне — не для поворота
    drag = true; px = e.clientX; py = e.clientY; vx = vy = 0; try { el.setPointerCapture(e.pointerId); } catch (er) {} kick();
  };
  el.addEventListener('pointerdown', onDown);
  el.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - px, dy = e.clientY - py; px = e.clientX; py = e.clientY;
    vy = dx * 0.45; vx = dy * 0.3; ry += vy; rx = clampX(rx + vx); kick();
  });
  const up = () => { drag = false; kick(); };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  canvas.addEventListener('keydown', (e) => {
    const k = { ArrowLeft: [0, -12], ArrowRight: [0, 12], ArrowUp: [-8, 0], ArrowDown: [8, 0] }[e.key];
    if (!k) return; e.preventDefault(); rx = clampX(rx + k[0]); ry += k[1]; kick();
  });
  const ro = new ResizeObserver(() => { st.size(); kick(); });
  ro.observe(canvas);
  return {
    ready,
    setModel() {},
    destroy() { alive = false; ro.disconnect(); el.removeEventListener('pointerdown', onDown); drag = false; st.renderer.dispose(); },
  };
}

/* Браслет плавно темнеет за корпусом и уходит в темноту, как ремешок у Apple: от z = a (ярко) до z = b (чёрный)
   в осях часов «циферблат на камеру». rootInv — обратная матрица группы, которая крутит часы. */
function fadeBehind(model, a, b) {
  const U = { uFadeZ: { value: new THREE.Vector2(a, b) }, uRootInv: { value: new THREE.Matrix4() } };
  model.traverse((o) => {
    if (!o.isMesh) return;
    (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
      m.onBeforeCompile = (sh) => {
        sh.uniforms.uFadeZ = U.uFadeZ; sh.uniforms.uRootInv = U.uRootInv;
        sh.vertexShader = sh.vertexShader.replace('void main() {', 'varying vec3 vFadeW;\nvoid main() {')
          .replace('#include <project_vertex>', '#include <project_vertex>\n  vFadeW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
        sh.fragmentShader = sh.fragmentShader.replace('void main() {', 'uniform vec2 uFadeZ;\nuniform mat4 uRootInv;\nvarying vec3 vFadeW;\nvoid main() {')
          .replace('#include <dithering_fragment>', '#include <dithering_fragment>\n  float fz = (uRootInv * vec4(vFadeW, 1.0)).z;\n  float ff = clamp((fz - uFadeZ.y) / (uFadeZ.x - uFadeZ.y), 0.0, 1.0);\n  gl_FragColor.rgb *= ff * ff * (3.0 - 2.0 * ff);');
      };
      m.customProgramCacheKey = () => 'fade'; m.needsUpdate = true;
    });
  });
  return U;
}

/* Идея 1 + 2: готовая модель Rolex поворачивается от прокрутки; anchor(i) — где на экране безель, головка, браслет */
export function mountSpinGlb(canvas, url) {
  const st = stage(canvas); st.size();
  const outer = new THREE.Group(), off = new THREE.Group(), fix = new THREE.Group();
  outer.add(off); off.add(fix); fix.rotation.y = D(-37);
  const pts = []; let loaded = false, U = null;
  const clip = new THREE.Plane(), clipLocal = new THREE.Plane(new THREE.Vector3(0, 0, 1), 33);
  const ready = new GLTFLoader().loadAsync(url).then((g) => {
    const m = g.scene, box = new THREE.Box3().setFromObject(m), c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
    const k = 100 / Math.max(sz.x, sz.y, sz.z); m.scale.setScalar(k); m.position.copy(c).multiplyScalar(-k);
    fix.add(m); st.scene.add(outer); outer.updateMatrixWorld(true);
    const bb = (o) => new THREE.Box3().setFromObject(o, true);
    // крутим вокруг корпуса, а не вокруг середины браслета
    off.position.copy(bb(m.getObjectByName('case_rolex')).getCenter(new THREE.Vector3())).multiplyScalar(-1); outer.updateMatrixWorld(true);
    const gb = bb(m.getObjectByName('glass')), gc = gb.getCenter(new THREE.Vector3()), gr = (gb.max.x - gb.min.x) / 2, cb = bb(m.getObjectByName('case_rolex'));
    pts[0] = new THREE.Vector3(gc.x - gr * 0.8, gc.y + gr * 0.8, gb.max.z - 1.5);          // безель, вверху слева
    pts[1] = new THREE.Vector3(cb.max.x - 1, gc.y, (cb.min.z + cb.max.z) / 2 + 2);          // заводная головка на 3 часах
    let low = null, lowY = Infinity;                                                          // звено браслета под корпусом
    m.traverse((o) => { if (/^strap/.test(o.name)) { const b = bb(o), y = b.getCenter(new THREE.Vector3()).y; if (y < lowY && b.max.z > -4) { low = b; lowY = y; } } });
    pts[2] = low ? new THREE.Vector3((low.min.x + low.max.x) / 2 + 6, Math.max(low.min.y, -34), low.max.z - 1) : new THREE.Vector3(6, -30, 4);
    U = fadeBehind(m, -2, -30);
    st.renderer.clippingPlanes = [clip];
    return st.renderer.compileAsync(st.scene, st.cam).catch(() => {});
  }).then(() => { loaded = true; last = -1; draw(0); });   // первый кадр сразу: текстуры и браслет уходят в видеокарту заранее, а не посреди прокрутки
  // ключевые позы: вполоборота слева → прямо (безель) → вполоборота с головкой → наклон (браслет)
  const K = [
    { p: 0, r: [4, 34, 0], d: 270 },
    { p: 0.3, r: [6, -6, 0], d: 235 },
    { p: 0.62, r: [8, -40, 0], d: 215 },
    { p: 1, r: [-30, -12, 0], d: 230 },
  ];
  const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  let last = -1;
  function draw(p) {
    if (!loaded) return;
    p = Math.max(0, Math.min(1, p));
    if (Math.abs(p - last) < 0.0005) return; last = p;
    let i = 0; while (i < K.length - 2 && p > K[i + 1].p) i++;
    const a = K[i], b = K[i + 1], t = ease((p - a.p) / (b.p - a.p));
    outer.rotation.set(D(lerp(a.r[0], b.r[0], t)), D(lerp(a.r[1], b.r[1], t)), D(lerp(a.r[2], b.r[2], t)), 'XZY');
    outer.updateMatrixWorld(true);
    U.uRootInv.value.copy(outer.matrixWorld).invert(); clip.copy(clipLocal).applyMatrix4(outer.matrixWorld);
    /* на узком экране часы мельче — по бокам остаётся место для подписей выносок */
    const zoom = st.box.w < 600 ? 1.42 : 1;
    st.cam.position.set(0, 0, lerp(a.d, b.d, t) * zoom); st.cam.lookAt(0, 0, 0); st.render();
  }
  const v = new THREE.Vector3();
  function project(p3) {
    v.copy(p3).applyMatrix4(outer.matrixWorld).project(st.cam);
    return { x: (v.x + 1) / 2 * st.box.w, y: (1 - v.y) / 2 * st.box.h };
  }
  function anchor(i) {
    if (!loaded || !pts[i]) return null;
    const a = project(pts[i]), c = project(new THREE.Vector3(0, 0, 0)), cr = project(pts[1]);
    a.cx = c.x; a.cy = c.y; a.r = Math.max(Math.abs(cr.x - c.x), st.box.h * 0.12); a.w = st.box.w; a.h = st.box.h; return a;
  }
  const ro = new ResizeObserver(() => { st.size(); last = -1; });
  ro.observe(canvas);
  return { ready, draw, anchor };
}
