// 3D-модели часов каталога MASDELLA: общий набор форм для одинаковых кадров каталога.
// Размеры в миллиметрах. Циферблат смотрит в +Z, «12 часов» — в +Y, головка — в +X.
// Марок на циферблатах нет — это визуализация формы и цвета, не копия логотипов.
import * as THREE from './three.module.js';

const D = THREE.MathUtils.degToRad;
const TAU = Math.PI * 2;

/* ---------- формы ---------- */
export function rr(w, h, r) {
  const s = new THREE.Shape(); const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r); s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h); s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}
function circleShape(r, seg = 96) { const s = new THREE.Shape(); s.absarc(0, 0, r, 0, TAU, false); return s; }
function circlePath(r) { const p = new THREE.Path(); p.absarc(0, 0, r, 0, TAU, true); return p; }
function polyShape(pts) { const s = new THREE.Shape(); s.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach((p) => s.lineTo(p[0], p[1])); s.closePath(); return s; }
function toPath(shape, n = 64) { const p = new THREE.Path(); const pts = shape.getPoints(n); p.setFromPoints(pts.reverse()); return p; }
/* восьмиугольник со скруглёнными углами (Royal Oak) */
function octShape(R, r) {
  const pts = []; for (let i = 0; i < 8; i++) { const a = D(22.5) + i * TAU / 8; pts.push([Math.cos(a) * R, Math.sin(a) * R]); }
  return roundPoly(pts, r);
}
function roundPoly(pts, r) {
  const s = new THREE.Shape(); const n = pts.length;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p = pts[i], p1 = pts[(i + 1) % n];
    const v0 = new THREE.Vector2(p0[0] - p[0], p0[1] - p[1]).normalize(), v1 = new THREE.Vector2(p1[0] - p[0], p1[1] - p[1]).normalize();
    const a = [p[0] + v0.x * r, p[1] + v0.y * r], b = [p[0] + v1.x * r, p[1] + v1.y * r];
    if (i === 0) s.moveTo(a[0], a[1]); else s.lineTo(a[0], a[1]);
    s.quadraticCurveTo(p[0], p[1], b[0], b[1]);
  }
  s.closePath(); return s;
}
/* «подушка» Nautilus: восьмиугольник с длинными боками и мягкими углами */
function cushionShape(w, h, c, r) {
  return roundPoly([[-w / 2 + c, -h / 2], [w / 2 - c, -h / 2], [w / 2, -h / 2 + c], [w / 2, h / 2 - c], [w / 2 - c, h / 2], [-w / 2 + c, h / 2], [-w / 2, h / 2 - c], [-w / 2, -h / 2 + c]], r);
}
/* бочка (тонно): бока выгнуты, верх и низ — дуги */
function barrelShape(w, h, bulge) {
  const s = new THREE.Shape(), hw = w / 2, hh = h / 2;
  s.moveTo(-hw * 0.86, -hh); s.quadraticCurveTo(0, -hh - 1.2, hw * 0.86, -hh);
  s.bezierCurveTo(hw + bulge, -hh * 0.5, hw + bulge, hh * 0.5, hw * 0.86, hh);
  s.quadraticCurveTo(0, hh + 1.2, -hw * 0.86, hh);
  s.bezierCurveTo(-hw - bulge, hh * 0.5, -hw - bulge, -hh * 0.5, -hw * 0.86, -hh);
  return s;
}
function ext(shape, depth, bevel, opts = {}) {
  const g = new THREE.ExtrudeGeometry(shape, Object.assign({ depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * 0.9, bevelSegments: 6, curveSegments: 48 }, opts));
  return g;
}
/* UV по габаритам формы — для текстуры циферблата */
function planarUV(g, w, h) {
  const uv = g.attributes.uv, pos = g.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5);
  return g;
}

/* ---------- текстуры ---------- */
function canvasTex(S, draw, srgb = true) {
  const cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d');
  draw(g, S);
  const t = new THREE.CanvasTexture(cv); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16; return t;
}
let _brush = null;
function brushTex() {
  if (_brush) return _brush;
  _brush = canvasTex(512, (g, S) => {
    g.fillStyle = '#b4b4b4'; g.fillRect(0, 0, S, S);
    let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 5200; i++) {
      const x = rnd() * S, y = rnd() * S, len = 30 + rnd() * 220, v = rnd() > 0.5 ? 255 : 0;
      g.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',' + (0.04 + rnd() * 0.1).toFixed(3) + ')'; g.fillRect(x, y, 1, len);
    }
  }, false);
  _brush.wrapS = _brush.wrapT = THREE.RepeatWrapping; _brush.repeat.set(0.09, 0.09);
  return _brush;
}
/* «камни»: паве из мелких страз */
let _pave = null;
function paveTex() {
  if (_pave) return _pave;
  _pave = canvasTex(1024, (g, S) => {
    g.fillStyle = '#6d7076'; g.fillRect(0, 0, S, S);
    const step = 32; let seed = 5; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let y = 0; y < S + step; y += step * 0.87) {
      const off = (Math.round(y / (step * 0.87)) % 2) * step / 2;
      for (let x = -step; x < S + step; x += step) {
        const cx = x + off, cy = y, r = step * 0.46;
        const gr = g.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.05, cx, cy, r);
        const k = 0.75 + rnd() * 0.25;
        gr.addColorStop(0, 'rgba(255,255,255,' + k + ')'); gr.addColorStop(0.45, 'rgba(225,232,245,' + (k * 0.85) + ')'); gr.addColorStop(1, 'rgba(70,74,84,1)');
        g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill();
        g.strokeStyle = 'rgba(40,42,48,.8)'; g.lineWidth = 1.5; g.stroke();
        if (rnd() > 0.55) { g.fillStyle = 'rgba(255,255,255,.95)'; g.fillRect(cx - 1, cy - r * 0.7, 2, r * 1.4); g.fillRect(cx - r * 0.7, cy - 1, r * 1.4, 2); }
      }
    }
  });
  _pave.wrapS = _pave.wrapT = THREE.RepeatWrapping; _pave.repeat.set(0.028, 0.028);
  return _pave;
}
function grooveTex(n) {
  const t = canvasTex(256, (g, S) => {
    g.fillStyle = '#808080'; g.fillRect(0, 0, S, S);
    for (let i = 0; i < n; i++) { const y = (i + 0.5) * S / n; g.fillStyle = '#2a2a2a'; g.fillRect(0, y - S / n * 0.18, S, S / n * 0.36); }
  }, false);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

/* ---------- материалы ---------- */
const METAL = {
  steel: { c: 0xcdd0d5 }, polish: { c: 0xeceef1 }, black: { c: 0x2a2c30 }, gold: { c: 0xe2bd72 }, rose: { c: 0xe0a585 },
  graphite: { c: 0x6a6460 }, bronze: { c: 0x8a6f5c },
};
function metal(name, brushed, rough) {
  const c = (METAL[name] || METAL.steel).c;
  if (brushed) { const bt = brushTex(); return new THREE.MeshStandardMaterial({ color: c, metalness: 1, roughness: rough ?? 0.4, roughnessMap: bt, bumpMap: bt, bumpScale: 0.3 }); }
  return new THREE.MeshStandardMaterial({ color: c, metalness: 1, roughness: rough ?? 0.13 });
}
function iced() { const t = paveTex(); return new THREE.MeshStandardMaterial({ color: 0xffffff, map: t, metalness: 0.92, roughness: 0.08, bumpMap: t, bumpScale: 0.9, emissive: 0x3a3c42, emissiveMap: t }); }
function ceramic(color) { return new THREE.MeshPhysicalMaterial({ color, metalness: 0, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.25 }); }
function rubber(color, grooves) {
  const m = new THREE.MeshStandardMaterial({ color, metalness: 0, roughness: 0.62 });
  if (grooves) { const t = grooveTex(grooves); t.repeat.set(1, 10); m.bumpMap = t; m.bumpScale = 0.5; }
  return m;
}
function clearCase(color) { return new THREE.MeshPhysicalMaterial({ color, metalness: 0, roughness: 0.12, transmission: 0.55, thickness: 4, ior: 1.45, transparent: true, opacity: 0.92, clearcoat: 1 }); }
function matOf(spec) {
  if (spec === 'iced') return iced();
  if (typeof spec === 'object' && spec.ceramic) return ceramic(spec.ceramic);
  if (typeof spec === 'object' && spec.clear) return clearCase(spec.clear);
  if (typeof spec === 'object' && spec.color) return new THREE.MeshStandardMaterial({ color: spec.color, metalness: spec.metal ?? 0.6, roughness: spec.rough ?? 0.35 });
  const [name, kind] = String(spec || 'steel').split(':');
  return metal(name, kind !== 'polish', kind === 'polish' ? 0.13 : undefined);
}

/* ---------- циферблат ---------- */
// d: { bg:[a,b], style, ink, accent, hands, sun, date, sub:[цвета субциферблатов], text, stripes, lume }
function inShape(kind, a, th) {
  // расстояние от центра до края формы под углом th (0 — вверх)
  if (kind === 'square' || kind === 'squareR') return a / Math.max(Math.abs(Math.cos(th)), Math.abs(Math.sin(th)));
  if (kind === 'barrel') { const ex = a * 0.86, ey = a * 1.05; return 1 / Math.sqrt((Math.sin(th) / ex) ** 2 + (Math.cos(th) / ey) ** 2); }
  if (kind === 'cushion' || kind === 'oct') { const k = a / Math.max(Math.abs(Math.cos(th)), Math.abs(Math.sin(th))); return Math.min(k, a * 1.12); }
  return a;
}
export function dialTex(d, kind) {
  return canvasTex(2048, (g, S) => {
    const m = S / 2;
    const grad = g.createRadialGradient(m, m * 0.88, S * 0.04, m, m, S * 0.74);
    grad.addColorStop(0, d.bg[0]); grad.addColorStop(1, d.bg[1] || d.bg[0]);
    g.fillStyle = grad; g.fillRect(0, 0, S, S);
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    g.save(); g.translate(m, m);
    if (d.sun !== false && d.style !== 'skeleton' && !d.stripes) {
      for (let i = 0; i < 720; i++) {
        const a0 = (i / 720) * TAU, a1 = a0 + Math.PI / 360 * (1 + rnd() * 2);
        g.fillStyle = (rnd() > 0.5 ? 'rgba(255,255,255,' : 'rgba(0,0,0,') + (rnd() * 0.06).toFixed(3) + ')';
        g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a0) * S, Math.sin(a0) * S); g.lineTo(Math.cos(a1) * S, Math.sin(a1) * S); g.fill();
      }
    }
    if (d.stripes) {
      // горизонтальные выпуклые полосы (Nautilus)
      for (let y = -m; y < m; y += S * 0.018) {
        const gr = g.createLinearGradient(0, y, 0, y + S * 0.018);
        gr.addColorStop(0, 'rgba(255,255,255,.10)'); gr.addColorStop(0.5, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.28)');
        g.fillStyle = gr; g.fillRect(-m, y, S, S * 0.018);
      }
    }
    if (d.style === 'skeleton') drawSkeleton(g, S, d, rnd);
    const ink = d.ink || '#f2f2f2', acc = d.accent || ink;
    const A = S * 0.43; // край области цифр
    // минутная дорожка
    g.strokeStyle = ink; g.globalAlpha = 0.85;
    for (let i = 0; i < 60; i++) {
      const th = (i / 60) * TAU, r1 = inShape(kind, A, th), r2 = r1 - S * (i % 5 ? 0.018 : 0.03);
      g.lineWidth = i % 5 ? S * 0.003 : S * 0.006;
      g.beginPath(); g.moveTo(Math.sin(th) * r1, -Math.cos(th) * r1); g.lineTo(Math.sin(th) * r2, -Math.cos(th) * r2); g.stroke();
    }
    g.globalAlpha = 1;
    const st = d.style;
    if (st === 'roman' || d.overlay === 'roman') drawRoman(g, S, ink, kind);
    if ((st === 'baton' || st === 'chrono' || st === 'stripes' || st === 'skeleton') && d.overlay !== 'roman') drawBatons(g, S, d, kind, ink, st === 'skeleton' ? 0.75 : 1);
    if (st === 'diver') drawDiver(g, S, d, ink);
    if (st === 'digital') drawDigital(g, S, d);
    if (st === 'arabic') drawArabic(g, S, d, ink, kind);
    if (d.sub) drawSubs(g, S, d, ink, acc);
    if (d.date) {
      const x = S * 0.25, w = S * 0.085, h = S * 0.07;
      g.fillStyle = '#f4f4f2'; g.fillRect(x - w / 2, -h / 2, w, h);
      g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = S * 0.004; g.strokeRect(x - w / 2, -h / 2, w, h);
      g.fillStyle = '#111'; g.font = '600 ' + Math.round(S * 0.05) + 'px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('13', x, S * 0.003);
    }
    if (d.text) {
      g.fillStyle = ink; g.globalAlpha = 0.85; g.font = '500 ' + Math.round(S * 0.026) + 'px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
      const t = d.text.split('').join(String.fromCharCode(8202)); g.fillText(t, 0, d.textY ?? S * 0.2); g.globalAlpha = 1;
    }
    g.restore();
  });
}
function drawRoman(g, S, ink, kind) {
  const N = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  g.fillStyle = ink; g.textAlign = 'center'; g.textBaseline = 'middle';
  N.forEach((t, i) => {
    const th = (i / 12) * TAU, corner = i % 3 !== 0;
    const d = Math.min(inShape(kind, S * 0.34, th), S * 0.4);
    g.save(); g.rotate(th); g.translate(0, -d); g.scale(corner ? 0.74 : 0.8, corner ? 1.45 : 1.25);
    g.font = '700 ' + Math.round(S * 0.1) + 'px "Times New Roman", Georgia, serif'; g.fillText(t, 0, 0); g.restore();
  });
}
function batonIndex(g, x, y, w, h, ink, lume) {
  const gr = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  gr.addColorStop(0, '#7d8087'); gr.addColorStop(0.5, '#ffffff'); gr.addColorStop(1, '#8a8d93');
  g.fillStyle = ink === 'gold' ? '#e7c682' : (ink === 'dark' ? '#33363c' : gr); g.fillRect(x - w / 2, y - h / 2, w, h);
  if (lume) { g.fillStyle = lume; g.fillRect(x - w * 0.22, y - h * 0.4, w * 0.44, h * 0.8); }
  g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 2; g.strokeRect(x - w / 2, y - h / 2, w, h);
}
function drawBatons(g, S, d, kind, ink, alpha) {
  g.globalAlpha = alpha;
  for (let i = 0; i < 12; i++) {
    const th = (i / 12) * TAU;
    if (d.sub && (i === 3 || i === 6 || i === 9) && d.subPos !== 'v') continue;
    if (d.date && i === 3) continue;
    const r = inShape(kind, S * 0.355, th);
    g.save(); g.rotate(th);
    const w = S * (i === 0 ? 0.028 : 0.022), h = S * (i % 3 === 0 ? 0.11 : 0.085);
    if (i === 0) { batonIndex(g, -w * 0.75, -r, w, h, d.indexInk, d.lume); batonIndex(g, w * 0.75, -r, w, h, d.indexInk, d.lume); }
    else batonIndex(g, 0, -r, w, h, d.indexInk, d.lume);
    g.restore();
  }
  g.globalAlpha = 1;
}
function drawDiver(g, S, d, ink) {
  const lume = d.lume || '#f2f0e6';
  for (let i = 0; i < 12; i++) {
    const th = (i / 12) * TAU, r = S * 0.34;
    if (d.date && i === 3) continue;
    g.save(); g.rotate(th); g.translate(0, -r);
    g.fillStyle = '#d8dade'; g.strokeStyle = '#d8dade'; g.lineWidth = S * 0.006;
    if (i === 0) { g.beginPath(); g.moveTo(-S * 0.045, -S * 0.04); g.lineTo(S * 0.045, -S * 0.04); g.lineTo(0, S * 0.05); g.closePath(); g.fill(); g.fillStyle = lume; g.beginPath(); g.moveTo(-S * 0.034, -S * 0.032); g.lineTo(S * 0.034, -S * 0.032); g.lineTo(0, S * 0.037); g.closePath(); g.fill(); }
    else if (i % 3 === 0) { g.fillRect(-S * 0.022, -S * 0.055, S * 0.044, S * 0.11); g.fillStyle = lume; g.fillRect(-S * 0.016, -S * 0.049, S * 0.032, S * 0.098); }
    else { g.beginPath(); g.arc(0, 0, S * 0.03, 0, TAU); g.fill(); g.fillStyle = lume; g.beginPath(); g.arc(0, 0, S * 0.024, 0, TAU); g.fill(); }
    g.restore();
  }
}
function drawDigital(g, S, d) {
  // экран: крупное время сегментами и мелкие данные
  g.fillStyle = d.screen || '#1b1d1f'; g.beginPath(); g.arc(0, 0, S * 0.36, 0, TAU); g.fill();
  if (d.rings) d.rings.forEach((c, i) => { g.strokeStyle = c; g.lineWidth = S * 0.022; g.beginPath(); g.arc(0, 0, S * (0.33 - i * 0.03), -Math.PI * 0.85 + i * 0.4, -Math.PI * 0.15 + i * 0.5); g.stroke(); });
  g.fillStyle = d.lcd || '#e9ecef'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '600 ' + Math.round(S * 0.2) + 'px Arial, sans-serif'; g.fillText('10:09', 0, S * 0.02);
  g.font = '600 ' + Math.round(S * 0.06) + 'px Arial'; g.fillText(d.top || 'ПТ 13', 0, -S * 0.17);
  g.globalAlpha = 0.8; g.font = '500 ' + Math.round(S * 0.05) + 'px Arial'; g.fillText(d.bottom || '1 024 м', 0, S * 0.2); g.globalAlpha = 1;
}
function drawArabic(g, S, d, ink, kind) {
  g.fillStyle = ink; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '700 ' + Math.round(S * 0.085) + 'px Arial';
  [12, 3, 6, 9].forEach((n, k) => {
    if (d.sub && k > 0) return;
    const th = k * TAU / 4, r = inShape(kind, S * 0.33, th);
    g.fillText(String(n), Math.sin(th) * r, -Math.cos(th) * r);
  });
  drawBatons(g, S, Object.assign({}, d, { sub: true }), kind, ink, 1);
}
function drawSubs(g, S, d, ink, acc) {
  const pos = d.subPos === 'v' ? [[0, -0.2], [0, 0.2]] : [[-0.2, 0.02], [0, 0.21], [0.2, 0.02]];
  pos.forEach((p, k) => {
    const x = p[0] * S, y = p[1] * S, r = S * 0.085, col = (d.sub[k] || d.sub[0]);
    const gr = g.createRadialGradient(x, y, r * 0.1, x, y, r);
    gr.addColorStop(0, col); gr.addColorStop(1, shade(col, -0.35));
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    // кольцевая «азурировка»
    g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 1;
    for (let q = r * 0.2; q < r; q += S * 0.006) { g.beginPath(); g.arc(x, y, q, 0, TAU); g.stroke(); }
    g.strokeStyle = acc; g.lineWidth = S * 0.005; g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke();
    g.strokeStyle = ink;
    for (let i = 0; i < 12; i++) { const th = i / 12 * TAU; g.lineWidth = S * 0.003; g.beginPath(); g.moveTo(x + Math.sin(th) * r * 0.78, y - Math.cos(th) * r * 0.78); g.lineTo(x + Math.sin(th) * r * 0.95, y - Math.cos(th) * r * 0.95); g.stroke(); }
    g.save(); g.translate(x, y); g.rotate((k * 2.1 + 0.6)); g.fillStyle = d.subHand || acc; g.fillRect(-S * 0.003, -r * 0.82, S * 0.006, r * 0.95); g.beginPath(); g.arc(0, 0, S * 0.009, 0, TAU); g.fill(); g.restore();
  });
}
function drawSkeleton(g, S, d, rnd) {
  // механизм: мосты, колёса с зубцами, камни
  const metalCol = d.mech || '#9a9da3';
  g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(-S / 2, -S / 2, S, S);
  const gears = [[-0.17, -0.12, 0.15], [0.16, -0.16, 0.11], [0.1, 0.17, 0.13], [-0.16, 0.18, 0.09], [0.02, 0.0, 0.08], [0.27, 0.05, 0.07], [-0.3, 0.02, 0.06]];
  gears.forEach(([x, y, r]) => gear(g, x * S, y * S, r * S, metalCol, rnd));
  // мосты
  g.strokeStyle = shade(metalCol, 0.15); g.lineWidth = S * 0.035; g.lineCap = 'round';
  [[-0.3, -0.3, 0.05, 0.08], [0.3, -0.28, -0.02, 0.1], [-0.25, 0.32, 0.2, 0.25]].forEach(([a, b, c, e]) => { g.beginPath(); g.moveTo(a * S, b * S); g.lineTo(c * S, e * S); g.stroke(); });
  // рубины
  [[-0.17, -0.12], [0.16, -0.16], [0.1, 0.17], [0.02, 0]].forEach(([x, y]) => { g.fillStyle = '#b3123a'; g.beginPath(); g.arc(x * S, y * S, S * 0.012, 0, TAU); g.fill(); });
  // кольцо с цифрами
  g.strokeStyle = d.ring || 'rgba(230,232,236,.9)'; g.lineWidth = S * 0.05; g.beginPath(); g.arc(0, 0, S * 0.4, 0, TAU); g.stroke();
}
function gear(g, x, y, r, col, rnd) {
  g.save(); g.translate(x, y); g.rotate(rnd() * TAU);
  const teeth = Math.round(r / 6);
  g.beginPath();
  for (let i = 0; i < teeth * 2; i++) { const a = i / (teeth * 2) * TAU, q = i % 2 ? r : r * 0.9; g.lineTo(Math.cos(a) * q, Math.sin(a) * q); }
  g.closePath();
  const gr = g.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
  gr.addColorStop(0, shade(col, 0.35)); gr.addColorStop(1, shade(col, -0.25));
  g.fillStyle = gr; g.fill();
  g.globalCompositeOperation = 'destination-out';
  for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; g.beginPath(); g.ellipse(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, r * 0.2, r * 0.13, a, 0, TAU); g.fill(); }
  g.globalCompositeOperation = 'source-over';
  g.fillStyle = shade(col, 0.3); g.beginPath(); g.arc(0, 0, r * 0.14, 0, TAU); g.fill();
  g.restore();
}
function shade(hex, k) {
  const c = new THREE.Color(hex); const hsl = {}; c.getHSL(hsl); c.setHSL(hsl.h, hsl.s, Math.min(1, Math.max(0, hsl.l + k))); return '#' + c.getHexString();
}
/* кольцо безеля с цифрами (дайвер, GMT, тахиметр) */
function bezelTex(b) {
  return canvasTex(2048, (g, S) => {
    const m = S / 2; g.save(); g.translate(m, m);
    const col = b.colors || [b.color || '#111'];
    if (col.length === 2) {
      g.fillStyle = col[0]; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, m, -Math.PI / 2, Math.PI / 2, false); g.fill();
      g.fillStyle = col[1]; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, m, Math.PI / 2, Math.PI * 1.5, false); g.fill();
    } else { g.fillStyle = col[0]; g.fillRect(-m, -m, S, S); }
    g.fillStyle = b.ink || '#e9e6dc'; g.strokeStyle = b.ink || '#e9e6dc'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const R = m * 0.83;
    if (b.kind === 'tachy') {
      g.font = '600 ' + Math.round(S * 0.042) + 'px Arial';
      [500, 400, 300, 250, 200, 170, 150, 130, 120, 110, 100, 90, 80, 70].forEach((n, i) => { const th = i / 14 * TAU * 0.92 + 0.15; g.save(); g.rotate(th); g.translate(0, -R); g.fillText(String(n), 0, 0); g.restore(); });
    } else {
      for (let i = 0; i < 60; i++) {
        const th = i / 60 * TAU; g.save(); g.rotate(th);
        if (i === 0) { g.beginPath(); g.moveTo(-S * 0.03, -R - S * 0.035); g.lineTo(S * 0.03, -R - S * 0.035); g.lineTo(0, -R + S * 0.03); g.closePath(); g.fill(); }
        else if (i % 10 === 0) { g.font = '600 ' + Math.round(S * 0.075) + 'px Arial'; g.fillText(b.kind === 'gmt' ? String(i / 60 * 24 | 0) : String(i), 0, -R); }
        else if (i % 5 === 0) { g.fillRect(-S * 0.008, -R - S * 0.03, S * 0.016, S * 0.06); }
        else if (i < 15 && b.kind !== 'gmt') { g.fillRect(-S * 0.003, -R - S * 0.02, S * 0.006, S * 0.04); }
        g.restore();
      }
    }
    g.restore();
  });
}

/* ---------- стрелки ---------- */
function hands(root, z, h) {
  if (h.len === 0) return;
  const col = h.color ?? 0xe8eaee;
  const mat = new THREE.MeshStandardMaterial({ color: col, metalness: 1, roughness: 0.18 });
  const lume = new THREE.MeshStandardMaterial({ color: h.lume ?? 0xf3f1e8, metalness: 0, roughness: 0.6, emissive: 0x222018 });
  const L = h.len || 10;
  const make = (len, w, ang, zz, style) => {
    const grp = new THREE.Group();
    let s;
    if (style === 'baton') { s = rr(w, len + 1.6, w * 0.35); }
    else { s = new THREE.Shape(); s.moveTo(0, -1.6); s.lineTo(w / 2, len * 0.22); s.lineTo(0, len); s.lineTo(-w / 2, len * 0.22); s.closePath(); }
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.2, bevelEnabled: false });
    if (style === 'baton') g.translate(0, (len + 1.6) / 2 - 1.6, 0);
    grp.add(new THREE.Mesh(g, mat));
    if (h.lumeOn) {
      const ls = style === 'baton' ? rr(w * 0.45, len * 0.62, w * 0.2) : (() => { const q = new THREE.Shape(); q.moveTo(0, len * 0.3); q.lineTo(w * 0.22, len * 0.42); q.lineTo(0, len * 0.9); q.lineTo(-w * 0.22, len * 0.42); q.closePath(); return q; })();
      const lg = new THREE.ExtrudeGeometry(ls, { depth: 0.08, bevelEnabled: false });
      if (style === 'baton') lg.translate(0, len * 0.55, 0);
      const lm = new THREE.Mesh(lg, lume); lm.position.z = 0.2; grp.add(lm);
    }
    if (style === 'mercedes') {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(w * 0.85, w * 0.18, 8, 32), mat); ring.position.y = len * 0.68; grp.add(ring);
    }
    grp.position.z = zz; grp.rotation.z = -ang; root.add(grp);
  };
  make(L * 0.62, (h.w || 1.5), (10 + 9 / 60) / 12 * TAU, z, h.style === 'mercedes' ? 'mercedes' : h.style);
  make(L * 0.95, (h.w || 1.5) * 0.78, 9 / 60 * TAU, z + 0.25, h.style === 'mercedes' ? 'sword' : h.style);
  const secMat = new THREE.MeshStandardMaterial({ color: h.sec ?? col, metalness: 0.6, roughness: 0.3 });
  const sec = new THREE.Mesh(new THREE.BoxGeometry(0.18, L * 1.25, 0.1), secMat); sec.geometry.translate(0, L * 0.38, 0);
  sec.position.z = z + 0.5; sec.rotation.z = -TAU * (34 / 60); root.add(sec);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.5, 24), mat); cap.rotation.x = Math.PI / 2; cap.position.z = z + 0.5; root.add(cap);
}

/* ---------- детали корпуса ---------- */
function crown(root, x, y, z, r, len, mat, opts = {}) {
  const g = new THREE.Group();
  const cg = new THREE.CylinderGeometry(r, r, len, opts.facets || 28); cg.rotateZ(Math.PI / 2);
  const c = new THREE.Mesh(cg, Object.assign(mat.clone(), { flatShading: !!opts.facets })); c.position.x = len / 2; g.add(c);
  if (opts.cab) { const cab = new THREE.Mesh(new THREE.SphereGeometry(r * 0.6, 24, 16), new THREE.MeshPhysicalMaterial({ color: opts.cab, roughness: 0.12, clearcoat: 1 })); cab.scale.x = 0.7; cab.position.x = len + r * 0.25; g.add(cab); }
  g.position.set(x, y, z); root.add(g); return g;
}
function pusher(root, x, y, z, ang, mat) {
  const g = new THREE.CylinderGeometry(1.1, 1.1, 3.2, 20); g.rotateZ(Math.PI / 2);
  const m = new THREE.Mesh(g, mat); m.position.set(x + Math.cos(ang) * 1.4, y + Math.sin(ang) * 1.4, z); m.rotation.z = ang; root.add(m);
}
function screwHead(root, x, y, z, r, mat, kind = 'slot', rot = 0) {
  const grp = new THREE.Group();
  const sides = kind === 'hex' ? 6 : 24;
  const g = new THREE.CylinderGeometry(r, r, 0.45, sides); g.rotateX(Math.PI / 2);
  grp.add(new THREE.Mesh(g, mat));
  const dark = new THREE.MeshStandardMaterial({ color: 0x1b1c1f, metalness: 1, roughness: 0.5 });
  if (kind === 'slot' || kind === 'h') { const s = new THREE.Mesh(new THREE.BoxGeometry(r * 1.7, r * 0.26, 0.2), dark); s.position.z = 0.18; grp.add(s); }
  if (kind === 'h') { const s = new THREE.Mesh(new THREE.BoxGeometry(r * 0.26, r * 1.2, 0.2), dark); s.position.z = 0.18; [-1, 1].forEach((k) => { const q = s.clone(); q.position.x = k * r * 0.55; grp.add(q); }); }
  grp.position.set(x, y, z); grp.rotation.z = rot; root.add(grp);
}
function glass(root, shape, w, h, z) {
  const g = new THREE.Mesh(new THREE.ShapeGeometry(shape, 24), new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0, transparent: true, opacity: 0.08, envMapIntensity: 1.6, depthWrite: false }));
  g.position.z = z; root.add(g);
}
function dial(root, shape, w, h, z, d, kind) {
  const g = planarUV(new THREE.ShapeGeometry(shape, 32), w, h);
  const mat = new THREE.MeshStandardMaterial({ map: dialTex(d, kind), metalness: d.metal ?? 0.5, roughness: 0.42 });
  const m = new THREE.Mesh(g, mat); m.position.z = z; root.add(m); return m;
}

/* ---------- браслеты и ремешки ---------- */
// дуга, уходящая от ушка вниз и назад; звенья ставятся вдоль неё
function arcSteps(sgn, y0, z0, n, L, th0, dth) {
  const out = []; let th = th0; const p = new THREE.Vector3(0, sgn * y0, z0);
  for (let i = 0; i < n; i++) {
    if (i) th += dth;
    const dir = new THREE.Vector3(0, sgn * Math.cos(th), -Math.sin(th));
    out.push({ pos: p.clone().addScaledVector(dir, L / 2), rot: -sgn * th });
    p.addScaledVector(dir, L + 0.06);
  }
  return out;
}
function linkBlock(w, len, t, mat, r = 1) {
  const g = new THREE.ExtrudeGeometry(rr(w, len, Math.min(r, w / 2 - 0.01, len / 2 - 0.01)), { depth: t, bevelEnabled: true, bevelThickness: 0.6, bevelSize: 0.5, bevelSegments: 4, curveSegments: 8 });
  g.translate(0, 0, -t / 2); return new THREE.Mesh(g, mat);
}
function bracelet(root, b, y0, z0, mats) {
  [1, -1].forEach((sgn) => {
    const steps = arcSteps(sgn, y0, z0, b.n || 11, b.L || 6.2, D(b.th0 ?? 18), D(b.dth ?? 7.5));
    steps.forEach((s, i) => {
      const w = b.w - Math.min(i, 6) * (b.taper ?? 0.5);
      const grp = new THREE.Group();
      if (b.style === 'oyster') {
        const at = (m, x, z) => { m.position.set(x, 0, z); return m; };
        grp.add(at(linkBlock(w * 0.3, b.L - 0.3, 1.3, mats.brushed, 0.6), -w * 0.35, 0));
        grp.add(at(linkBlock(w * 0.36, b.L - 0.3, 1.5, b.center === 'polish' ? mats.polish : mats.brushed, 0.6), 0, 0.1));
        grp.add(at(linkBlock(w * 0.3, b.L - 0.3, 1.3, mats.brushed, 0.6), w * 0.35, 0));
        if (b.centerMat) grp.children[1].material = b._cm || (b._cm = matOf(b.centerMat));
      } else if (b.style === 'integrated') {
        // H-звено: широкое матовое + узкое полированное в центре
        grp.add(linkBlock(w * 0.86, b.L * 0.62, 1.4, mats.brushed, 0.9));
        const c = linkBlock(w * 0.3, b.L * 0.5, 1.6, mats.polish, 0.5); c.position.y = sgn * b.L * 0.42; grp.add(c);
        [-1, 1].forEach((k) => { const e = linkBlock(w * 0.22, b.L * 0.5, 1.3, mats.brushed, 0.5); e.position.set(k * w * 0.33, sgn * b.L * 0.42, 0); grp.add(e); });
      } else if (b.style === 'santos') {
        grp.add(linkBlock(w - 1.4, b.L - 1.2, 1.2, mats.brushed, 1.2));
        screwHead(grp, -(w / 2 - 3), 0, 1.4, 0.9, mats.polish, 'slot', 0.4); screwHead(grp, w / 2 - 3, 0, 1.4, 0.9, mats.polish, 'slot', 2.1);
      } else {
        grp.add(linkBlock(w, b.L - 0.25, 1.4, mats.brushed, 0.8));
      }
      grp.position.copy(s.pos); grp.rotation.x = s.rot; root.add(grp);
    });
  });
}
function sweep(pts, w, t, r) {
  // сечение — скруглённый прямоугольник: u — поперёк ремешка (X), v — толщина (в плоскости YZ)
  const sec = rr(w, t, Math.min(r, t / 2 - 0.05)).getPoints(6);
  const n = sec.length, pos = [], idx = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const T = new THREE.Vector3().subVectors(b, a).normalize();
    const N = new THREE.Vector3(0, -T.z, T.y).normalize();
    sec.forEach((q) => { pos.push(pts[i].x + q.x, pts[i].y + N.y * q.y, pts[i].z + N.z * q.y); });
  }
  for (let i = 0; i < pts.length - 1; i++) for (let j = 0; j < n; j++) {
    const a = i * n + j, b = i * n + (j + 1) % n, c = (i + 1) * n + j, d = (i + 1) * n + (j + 1) % n;
    idx.push(a, c, b, b, c, d);
  }
  // торцы
  [0, pts.length - 1].forEach((i, e) => { const base = i * n; for (let j = 1; j < n - 1; j++) e ? idx.push(base, base + j, base + j + 1) : idx.push(base, base + j + 1, base + j); });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
function strap(root, st, y0, z0) {
  const mat = st.mat && st.mat.isMaterial ? st.mat : matOf(st.mat || { color: 0x141518, rough: 0.6, metal: 0 });
  [1, -1].forEach((sgn) => {
    const steps = arcSteps(sgn, y0, z0, 30, 1.6, D(st.th0 ?? 14), D(st.dth ?? 1.9));
    const pts = [new THREE.Vector3(0, sgn * (y0 - 2.5), z0 + 0.2)].concat(steps.map((q) => q.pos));
    const m = new THREE.Mesh(sweep(pts, st.w, st.t || 3.4, 1.2), mat); root.add(m);
    if (st.keeper) { const k = linkBlock(st.w + 1.2, 4, (st.t || 3.4) + 1, mat, 1); const q = steps[10]; k.position.copy(q.pos); k.rotation.x = q.rot; root.add(k); }
  });
}

/* ---------- семейства ---------- */
function mats3(spec) {
  const brushed = matOf(spec.metal || 'steel');
  const polish = (spec.metal === 'iced' || typeof spec.metal === 'object') ? brushed : matOf((String(spec.metal || 'steel').split(':')[0]) + ':polish');
  return { brushed, polish };
}

// квадрат (Santos)
function fSquare(root, s) {
  const M = mats3(s);
  const cs = new THREE.Shape();
  cs.moveTo(-16.2, -11); cs.bezierCurveTo(-16.2, -17, -14.8, -20.2, -11.8, -20.7); cs.lineTo(11.8, -20.7);
  cs.bezierCurveTo(14.8, -20.2, 16.2, -17, 16.2, -11); cs.lineTo(16.2, 11);
  cs.bezierCurveTo(16.2, 17, 14.8, 20.2, 11.8, 20.7); cs.lineTo(-11.8, 20.7);
  cs.bezierCurveTo(-14.8, 20.2, -16.2, 17, -16.2, 11); cs.closePath();
  const caseG = ext(cs, 6.2, 1.4); caseG.translate(0, 0, -3.1); root.add(new THREE.Mesh(caseG, M.brushed));
  const bs = rr(32.4, 32.4, 6.2); bs.holes.push(toPath(rr(25.2, 25.2, 3.6)));
  const bez = new THREE.Mesh(ext(bs, 1.1, 0.5), M.polish); bez.position.z = 4.6; root.add(bez);
  const k = 14.45, o = 7.3;
  if (s.metal !== 'iced') [[-o, k], [o, k], [-o, -k], [o, -k], [k, o], [k, -o], [-k, o], [-k, -o]].forEach((p, i) => screwHead(root, p[0], p[1], 6.2, 0.95, matOf('steel:polish'), 'slot', 0.5 + i * 1.3));
  dial(root, rr(25.8, 25.8, 3.8), 25.8, 25.8, 4.75, s.dial, 'square');
  hands(root, 5.0, Object.assign({ len: 10, w: 1.5, style: 'sword' }, s.hands));
  glass(root, rr(25.2, 25.2, 3.6), 25.2, 25.2, 6.6);
  crown(root, 16.8, 0, 0, 2.6, 3.2, matOf('steel:polish'), { facets: 8, cab: s.cab ?? 0x1a3fb0 });
  [4.6, -4.6].forEach((y) => { const gd = new THREE.Mesh(ext(rr(2.6, 2.4, 0.9), 3.2, 0.4), M.brushed); gd.position.set(17.9, y, -1.6); root.add(gd); });
  if (s.band === 'strap') strap(root, Object.assign({ w: 20, t: 3.2 }, s.strapSpec), 20.4, -1.3);
  else bracelet(root, Object.assign({ style: s.metal === 'iced' ? 'plain' : 'santos', w: 22.6, n: 11, L: 6.6, taper: 0.7, th0: 20 }, s.braceletSpec), 21.2, -1.3, M);
  return { head: 41 };
}
// круглый классический/дайвер/хронограф
function fRound(root, s) {
  const M = mats3(s); const R = s.r || 20;
  const prof = [[0, -5.2], [R - 2, -5.2], [R - 0.6, -4.4], [R + 0.2, -2.6], [R + 0.3, 1.8], [R - 0.2, 3.4], [R - 1.2, 3.8], [0, 3.8]].map((p) => new THREE.Vector2(p[0], p[1]));
  const lathe = new THREE.LatheGeometry(prof, 96); lathe.rotateX(Math.PI / 2);
  root.add(new THREE.Mesh(lathe, M.brushed));
  // ушки
  const lugW = s.lugW || 20;
  [1, -1].forEach((sy) => [1, -1].forEach((sx) => {
    const ls = new THREE.Shape(); ls.moveTo(-1.6, 0); ls.lineTo(1.6, 0); ls.lineTo(1.3, 8); ls.quadraticCurveTo(0, 9.2, -1.3, 8); ls.closePath();
    const lg = ext(ls, 3.4, 0.8); lg.translate(0, 0, -1.7);
    const l = new THREE.Mesh(lg, M.brushed); l.position.set(sx * (lugW / 2 + 0.6), sy * (R - 4.5), -1.4); l.rotation.z = sy > 0 ? 0 : Math.PI; l.rotation.x = sy * D(-6); root.add(l);
  }));
  // безель
  const bz = s.bezel || { kind: 'polish' };
  const bw = bz.width || (bz.kind === 'polish' ? 2 : 3.8);
  const ring = new THREE.Shape(); ring.absarc(0, 0, R + 0.2, 0, TAU, false); ring.holes.push(circlePath(R - bw));
  const bg = ext(ring, 1.5, 0.45, { curveSegments: 96 });
  const bezMat = bz.kind === 'polish' || bz.kind === 'fluted' ? M.polish : M.brushed;
  const bez = new THREE.Mesh(bg, bezMat); bez.position.z = 3.6; root.add(bez);
  if (bz.kind === 'diver' || bz.kind === 'gmt' || bz.kind === 'tachy') {
    const ig = new THREE.RingGeometry(R - bw + 0.5, R - 0.5, 128); const uv = ig.attributes.uv, pos = ig.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / (2 * R) + 0.5, pos.getY(i) / (2 * R) + 0.5);
    const insert = new THREE.Mesh(ig, new THREE.MeshPhysicalMaterial({ map: bezelTex(bz), metalness: 0.2, roughness: 0.25, clearcoat: 1 }));
    insert.position.z = 5.6; root.add(insert);
  }
  if (bz.screws) for (let i = 0; i < bz.screws; i++) { const a = i / bz.screws * TAU + TAU / 12; screwHead(root, Math.cos(a) * (R - bw / 2), Math.sin(a) * (R - bw / 2), 5.7, 1.05, matOf('steel:polish'), 'h', a); }
  const dr = R - bw - 0.2;
  dial(root, circleShape(dr), dr * 2, dr * 2, 4.0, s.dial, 'round');
  hands(root, 4.3, Object.assign({ len: dr * 0.82, w: 1.6, style: 'sword' }, s.hands));
  glass(root, circleShape(dr + 0.3), dr * 2, dr * 2, 5.8);
  const cr = crown(root, R + 0.1, 0, 0.2, s.crownR || 2.8, 3.4, M.polish, {});
  if (s.guards) [3.4, -3.4].forEach((y) => { const gd = new THREE.Mesh(ext(rr(2.4, 2.8, 1), 3.4, 0.5), M.brushed); gd.position.set(R + 0.4, y, -1.7); root.add(gd); });
  if (s.pushers) { pusher(root, (R - 0.4) * Math.cos(D(42)), (R - 0.4) * Math.sin(D(42)), 0.2, D(42), M.polish); pusher(root, (R - 0.4) * Math.cos(D(-42)), (R - 0.4) * Math.sin(D(-42)), 0.2, D(-42), M.polish); }
  if (s.band === 'strap') strap(root, Object.assign({ w: lugW - 0.4, t: 3.4 }, s.strapSpec), R + 3.2, -1.6);
  else bracelet(root, Object.assign({ style: 'oyster', w: lugW, n: 11, L: 5.6, taper: 0.45, th0: 16, dth: 7 }, s.braceletSpec), R + 3.4, -1.4, M);
  return { head: R * 2 + 2 };
}
// Hublot: толстый круглый безель на шести винтах, широкие «ушки» под ремешок
function fHublot(root, s) {
  const M = mats3(s); const R = 21;
  const body = new THREE.Shape(); body.moveTo(-12, -R - 3); body.lineTo(12, -R - 3); body.quadraticCurveTo(R + 2, -R + 3, R + 1, 0); body.quadraticCurveTo(R + 2, R - 3, 12, R + 3); body.lineTo(-12, R + 3); body.quadraticCurveTo(-R - 2, R - 3, -R - 1, 0); body.quadraticCurveTo(-R - 2, -R + 3, -12, -R - 3);
  const bg = ext(body, 7.4, 1.2); bg.translate(0, 0, -4.4); root.add(new THREE.Mesh(bg, M.brushed));
  // композитная вставка сбоку (тёмная)
  const comp = new THREE.MeshStandardMaterial({ color: 0x15161a, metalness: 0.2, roughness: 0.6 });
  [1, -1].forEach((sx) => { const c = new THREE.Mesh(new THREE.BoxGeometry(3, 14, 2.4), comp); c.position.set(sx * (R + 0.6), 0, -1.6); root.add(c); });
  const ring = new THREE.Shape(); ring.absarc(0, 0, R, 0, TAU, false); ring.holes.push(circlePath(R - 4.6));
  const bez = new THREE.Mesh(ext(ring, 2, 0.7, { curveSegments: 96 }), M.polish); bez.position.z = 3; root.add(bez);
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + TAU / 12; screwHead(root, Math.cos(a) * (R - 2.3), Math.sin(a) * (R - 2.3), 5.75, 1.15, matOf('steel:polish'), 'h', a + Math.PI / 2); }
  const dr = R - 4.8;
  dial(root, circleShape(dr), dr * 2, dr * 2, 4.4, s.dial, 'round');
  hands(root, 4.7, Object.assign({ len: dr * 0.86, w: 1.5, style: 'baton' }, s.hands));
  glass(root, circleShape(dr + 0.3), dr * 2, dr * 2, 6.0);
  crown(root, R + 1.4, 0, -0.6, 2.6, 2.6, M.polish, {});
  if (s.pushers) { pusher(root, (R - 0.4) * Math.cos(D(45)), (R - 0.4) * Math.sin(D(45)), -0.6, D(45), M.polish); pusher(root, (R - 0.4) * Math.cos(D(-45)), (R - 0.4) * Math.sin(D(-45)), -0.6, D(-45), M.polish); }
  if (s.band === 'bracelet') bracelet(root, Object.assign({ style: 'integrated', w: 24, n: 11, L: 6, taper: 0.4, th0: 18, dth: 7 }, s.braceletSpec), R + 3.4, -1.6, M);
  else strap(root, Object.assign({ w: 22.5, t: 4 }, s.strapSpec), R + 3.4, -1.8);
  return { head: 45 };
}
// Royal Oak: восьмиугольный безель на восьми шестигранных винтах
function fOct(root, s) {
  const M = mats3(s); const R = 20.5;
  const body = new THREE.Shape(); body.moveTo(-13, -R - 2.5); body.lineTo(13, -R - 2.5); body.quadraticCurveTo(R + 1.5, -R + 2, R + 1, 0); body.quadraticCurveTo(R + 1.5, R - 2, 13, R + 2.5); body.lineTo(-13, R + 2.5); body.quadraticCurveTo(-R - 1.5, R - 2, -R - 1, 0); body.quadraticCurveTo(-R - 1.5, -R + 2, -13, -R - 2.5);
  const bg = ext(body, 6.2, 1); bg.translate(0, 0, -3.8); root.add(new THREE.Mesh(bg, M.brushed));
  const os = octShape(R + 0.4, 3.2); os.holes.push(circlePath(R - 5));
  const bez = new THREE.Mesh(ext(os, 1.6, 0.6), M.polish); bez.position.z = 2.8; root.add(bez);
  for (let i = 0; i < 8; i++) { const a = D(22.5) + i * TAU / 8; screwHead(root, Math.cos(a) * (R - 2.2), Math.sin(a) * (R - 2.2), 5.3, 1.0, matOf('steel:polish'), 'hex', a); }
  const dr = R - 5.2;
  dial(root, circleShape(dr), dr * 2, dr * 2, 3.6, s.dial, 'round');
  hands(root, 3.9, Object.assign({ len: dr * 0.85, w: 1.5, style: 'baton', lumeOn: true }, s.hands));
  glass(root, circleShape(dr + 0.3), dr * 2, dr * 2, 5.4);
  crown(root, R + 1.3, 0, -0.6, 2.4, 2.8, M.polish, { facets: 6 });
  bracelet(root, Object.assign({ style: 'integrated', w: 26, n: 11, L: 6, taper: 0.55, th0: 18, dth: 7 }, s.braceletSpec), R + 3, -1.4, M);
  return { head: 44 };
}
// Nautilus: «подушка» с ушками по бокам, полосатый циферблат
function fCushion(root, s) {
  const M = mats3(s); const W = 40, H = 37;
  const body = cushionShape(W + 1.5, H + 4, 7, 3);
  const bg = ext(body, 6, 1); bg.translate(0, 0, -3.6); root.add(new THREE.Mesh(bg, M.brushed));
  [1, -1].forEach((sx) => { const e = new THREE.Mesh(ext(rr(3.4, 9, 1.6), 4, 0.8), M.polish); e.position.set(sx * (W / 2 + 1.6), 0, -2.6); root.add(e); });
  const bs = cushionShape(W, H, 7, 3.5); bs.holes.push(toPath(cushionShape(W - 6.4, H - 6.4, 5.5, 3)));
  const bez = new THREE.Mesh(ext(bs, 1.4, 0.6), M.polish); bez.position.z = 2.6; root.add(bez);
  dial(root, cushionShape(W - 6.6, H - 6.6, 5.5, 3), W - 6.6, H - 6.6, 3.6, s.dial, 'cushion');
  hands(root, 3.9, Object.assign({ len: 14, w: 1.6, style: 'baton', lumeOn: true }, s.hands));
  glass(root, cushionShape(W - 6.4, H - 6.4, 5.5, 3), W, H, 5.0);
  crown(root, W / 2 + 3.3, 0, -0.6, 2.4, 2.4, M.polish, {});
  bracelet(root, Object.assign({ style: 'integrated', w: 24, n: 11, L: 6, taper: 0.4, th0: 18, dth: 7 }, s.braceletSpec), H / 2 + 2.6, -1.4, M);
  return { head: 43 };
}
// квадратный хронограф (Reward): мягкий квадрат, винты на безеле, каучук
function fSquareChrono(root, s) {
  const M = mats3(s); const W = 42, H = 44;
  const body = rr(W, H, 9);
  const bg = ext(body, 7, 1.4); bg.translate(0, 0, -4.2); root.add(new THREE.Mesh(bg, M.brushed));
  const bs = rr(W - 1, H - 1, 8.6); bs.holes.push(toPath(rr(W - 9, H - 9, 6)));
  const bezMat = s.bezelMat ? matOf(s.bezelMat) : M.polish;
  const bez = new THREE.Mesh(ext(bs, 1.6, 0.7), bezMat); bez.position.z = 2.8; root.add(bez);
  [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([x, y], i) => screwHead(root, x * (W / 2 - 3.6), y * (H / 2 - 3.6), 5.45, 1.0, matOf((s.screw || 'steel') + ':polish'), 'hex', i));
  dial(root, rr(W - 9.4, H - 9.4, 5.8), W - 9.4, H - 9.4, 4.4, s.dial, 'squareR');
  hands(root, 4.7, Object.assign({ len: 14, w: 1.7, style: 'baton', lumeOn: true }, s.hands));
  glass(root, rr(W - 9, H - 9, 6), W, H, 5.6);
  crown(root, W / 2 - 0.3, 0, -0.6, 2.8, 3, matOf((s.screw || 'steel') + ':polish'), {});
  pusher(root, W / 2 - 1.8, 9, -0.6, 0, matOf((s.screw || 'steel') + ':polish')); pusher(root, W / 2 - 1.8, -9, -0.6, 0, matOf((s.screw || 'steel') + ':polish'));
  strap(root, Object.assign({ w: 26, t: 4 }, s.strapSpec), H / 2 + 0.6, -1.8);
  return { head: 45 };
}
// бочка (Naviforce, Onola, «бочки»): тонно в стиле спортивных скелетонов
function fBarrel(root, s) {
  const M = mats3(s); const W = 40, H = 48;
  const caseMat = s.caseMat ? matOf(s.caseMat) : M.brushed;
  const body = barrelShape(W, H, 2.4);
  const bg = ext(body, 8, 1.6); bg.translate(0, 0, -4.8); root.add(new THREE.Mesh(bg, caseMat));
  const bs = barrelShape(W - 1.4, H - 1.4, 2.2); bs.holes.push(toPath(barrelShape(W - 9, H - 10, 1.6)));
  const bez = new THREE.Mesh(ext(bs, 1.6, 0.7), s.bezelMat ? matOf(s.bezelMat) : caseMat); bez.position.z = 3.2; root.add(bez);
  [[-1, 1], [1, 1], [-1, -1], [1, -1], [-1, 0], [1, 0]].forEach(([x, y], i) => screwHead(root, x * (W / 2 - 3.2) * (y === 0 ? 1.08 : 0.86), y * (H / 2 - 4), 5.95, 0.95, matOf('steel:polish'), 'hex', i));
  dial(root, barrelShape(W - 9.4, H - 10.4, 1.6), W - 9.4, H - 10.4, 5.0, s.dial, 'barrel');
  hands(root, 5.3, Object.assign({ len: 15, w: 1.6, style: 'baton', lumeOn: true }, s.hands));
  glass(root, barrelShape(W - 9, H - 10, 1.6), W, H, 6.2);
  crown(root, W / 2 + 0.8, 0, -0.8, 2.8, 2.8, M.polish, { facets: 10 });
  if (s.pushers) { pusher(root, W / 2 - 0.2, 8, -0.8, 0, M.polish); pusher(root, W / 2 - 0.2, -8, -0.8, 0, M.polish); }
  strap(root, Object.assign({ w: 26, t: 4.2 }, s.strapSpec), H / 2 - 0.6, -2.2);
  return { head: 48 };
}

const FAMILY = { square: fSquare, round: fRound, hublot: fHublot, oct: fOct, cushion: fCushion, squareChrono: fSquareChrono, barrel: fBarrel };

export function buildModel(spec) {
  const outer = new THREE.Group();
  const make = (sp, dx) => {
    const g = new THREE.Group(); const info = FAMILY[sp.family](g, sp);
    const k = (sp.scale || 1) * 44 / info.head; g.scale.setScalar(k); g.position.x = dx || 0; outer.add(g);
  };
  if (spec.pair) { make(spec.pair[0], -14); make(spec.pair[1], 14); outer.children.forEach((c, i) => { c.scale.multiplyScalar(0.66); c.rotation.y = D(i ? -10 : 10); c.position.z = i ? -4 : 0; }); }
  else make(spec, 0);
  return outer;
}
