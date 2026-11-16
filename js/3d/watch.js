// 3D-модель квадратных стальных часов для рендеров MASDELLA. Размеры в миллиметрах.
// Циферблат смотрит в +Z, «12 часов» — в +Y.
import * as THREE from './three.module.js';

export const COLORS = {
  blue: { a: '#24408f', b: '#0a1436', num: '#eef1f6', hand: 0xe4e7ec, handRough: 0.18 },
  green: { a: '#1f6a45', b: '#082315', num: '#eef1f6', hand: 0xe4e7ec, handRough: 0.18 },
  white: { a: '#f6f3ec', b: '#d6d2c8', num: '#14161b', hand: 0x2447b8, handRough: 0.25 },
};

function rr(w, h, r) {
  const s = new THREE.Shape(); const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r); s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h); s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}
function rrPath(w, h, r) { const p = new THREE.Path(); p.setFromPoints(rr(w, h, r).getPoints(12)); return p; }

/* расстояние от центра до стороны квадрата с полустороной a под углом th (0 — вверх) */
function sq(a, th) { return a / Math.max(Math.abs(Math.cos(th)), Math.abs(Math.sin(th))); }

export function dialTexture(c) {
  const S = 2048, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const g = cv.getContext('2d'), m = S / 2;
  const grad = g.createRadialGradient(m, m * 0.9, S * 0.05, m, m, S * 0.72);
  grad.addColorStop(0, c.a); grad.addColorStop(1, c.b);
  g.fillStyle = grad; g.fillRect(0, 0, S, S);
  // солнечная сатинировка
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  g.save(); g.translate(m, m);
  for (let i = 0; i < 720; i++) {
    const a0 = (i / 720) * Math.PI * 2, a1 = a0 + Math.PI / 360 * (1 + rnd() * 2);
    g.fillStyle = (rnd() > 0.5 ? 'rgba(255,255,255,' : 'rgba(0,0,0,') + (rnd() * 0.07).toFixed(3) + ')';
    g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a0) * S, Math.sin(a0) * S); g.lineTo(Math.cos(a1) * S, Math.sin(a1) * S); g.fill();
  }
  // минутная «железная дорога» — квадрат внутри цифр
  const a1 = S * 0.205, a2 = S * 0.232;
  g.strokeStyle = c.num; g.lineWidth = S * 0.0035;
  [a1, a2].forEach((a) => { g.strokeRect(-a, -a, a * 2, a * 2); });
  for (let i = 0; i < 60; i++) {
    const th = (i / 60) * Math.PI * 2, d1 = sq(a1, th), d2 = sq(a2, th);
    g.lineWidth = i % 5 === 0 ? S * 0.009 : S * 0.0035;
    g.beginPath(); g.moveTo(Math.sin(th) * d1, -Math.cos(th) * d1); g.lineTo(Math.sin(th) * d2, -Math.cos(th) * d2); g.stroke();
  }
  // римские цифры, основанием к центру
  const N = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  g.fillStyle = c.num; g.textAlign = 'center'; g.textBaseline = 'middle';
  N.forEach((t, i) => {
    const th = (i / 12) * Math.PI * 2, corner = i % 3 !== 0;
    const d = Math.min(sq(S * 0.345, th), S * 0.405);
    g.save(); g.rotate(th); g.translate(0, -d);
    g.scale(corner ? 0.74 : 0.8, corner ? 1.5 : 1.28);
    g.font = '700 ' + Math.round(S * 0.105) + 'px "Times New Roman", Georgia, serif';
    g.fillText(t, 0, 0); g.restore();
  });
  g.font = '500 ' + Math.round(S * 0.021) + 'px Arial, sans-serif';
  const word = 'AUTOMATIC'; let x = -(word.length - 1) * S * 0.0125;
  for (const ch of word) { g.fillText(ch, x, S * 0.115); x += S * 0.025; }
  g.restore();
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16;
  return t;
}

function brushTexture() {
  const S = 512, cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d');
  g.fillStyle = '#b4b4b4'; g.fillRect(0, 0, S, S);
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 5200; i++) {
    const x = rnd() * S, y = rnd() * S, len = 30 + rnd() * 220, v = rnd() > 0.5 ? 255 : 0;
    g.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',' + (0.04 + rnd() * 0.1).toFixed(3) + ')'; g.fillRect(x, y, 1, len);
  }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(0.09, 0.09); return t;
}

function glowTexture() {
  const S = 512, cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d');
  const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  gr.addColorStop(0, 'rgba(240,206,130,1)'); gr.addColorStop(0.3, 'rgba(206,179,113,.45)'); gr.addColorStop(1, 'rgba(206,179,113,0)');
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function buildEnv(renderer) {
  const s = new THREE.Scene(); s.background = new THREE.Color(0x000000);
  const box = (w, h, pos, color, k) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(0, 0, 0); s.add(m);
  };
  box(16, 7, [0, 10, 2], 0xffffff, 7);       // верхний софтбокс
  box(2.4, 16, [-10, 1, 5], 0xfff0d8, 9);    // левая тёплая полоса
  box(2.4, 16, [10, 2, 3], 0xdde8ff, 6);     // правая холодная полоса
  box(12, 3, [0, -9, 6], 0xffffff, 1.2);     // нижняя подсветка
  box(13, 12, [2, 4, 12], 0xffffff, 1.7);      // фронтальная заливка
  box(2, 10, [-5, -2, 10], 0xffffff, 1.6);   // фронтальная полоса — блик на стекле
  const pm = new THREE.PMREMGenerator(renderer);
  return pm.fromScene(s, 0.02).texture;
}

export function buildWatch(colorName) {
  const c = COLORS[colorName] || COLORS.blue;
  const root = new THREE.Group();
  const bt = brushTexture();
  const brushed = new THREE.MeshStandardMaterial({ color: 0xcdd0d5, metalness: 1, roughness: 0.42, roughnessMap: bt, bumpMap: bt, bumpScale: 0.35 });
  const polished = new THREE.MeshStandardMaterial({ color: 0xeceef1, metalness: 1, roughness: 0.13 });
  const screwM = new THREE.MeshStandardMaterial({ color: 0xf2f3f5, metalness: 1, roughness: 0.22 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x202226, metalness: 1, roughness: 0.5 });

  // корпус с ушками
  const cs = new THREE.Shape();
  cs.moveTo(-16.2, -11); cs.bezierCurveTo(-16.2, -17, -14.8, -20.2, -11.8, -20.7); cs.lineTo(11.8, -20.7);
  cs.bezierCurveTo(14.8, -20.2, 16.2, -17, 16.2, -11); cs.lineTo(16.2, 11);
  cs.bezierCurveTo(16.2, 17, 14.8, 20.2, 11.8, 20.7); cs.lineTo(-11.8, 20.7);
  cs.bezierCurveTo(-14.8, 20.2, -16.2, 17, -16.2, 11); cs.closePath();
  const caseG = new THREE.ExtrudeGeometry(cs, { depth: 6.2, bevelEnabled: true, bevelThickness: 1.4, bevelSize: 1.3, bevelSegments: 8, curveSegments: 32 });
  caseG.translate(0, 0, -3.1);
  root.add(new THREE.Mesh(caseG, brushed));

  // безель
  const bs = rr(32.4, 32.4, 6.2); bs.holes.push(rrPath(25.2, 25.2, 3.6));
  const bezG = new THREE.ExtrudeGeometry(bs, { depth: 1.1, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.5, bevelSegments: 5, curveSegments: 24 });
  const bez = new THREE.Mesh(bezG, polished); bez.position.z = 4.6; root.add(bez);
  const screwG = new THREE.CylinderGeometry(0.95, 0.95, 0.4, 24); screwG.rotateX(Math.PI / 2);
  const slotG = new THREE.BoxGeometry(1.7, 0.26, 0.2);
  const screw = (x, y, z, parent, rot) => {
    const g = new THREE.Group(); g.add(new THREE.Mesh(screwG, screwM));
    const s = new THREE.Mesh(slotG, dark); s.position.z = 0.16; g.add(s);
    g.position.set(x, y, z); g.rotation.z = rot; parent.add(g);
  };
  const k = 14.45, o = 7.3;
  [[-o, k], [o, k], [-o, -k], [o, -k], [k, o], [k, -o], [-k, o], [-k, -o]].forEach((p, i) => screw(p[0], p[1], 6.2, root, 0.5 + i * 1.3));

  // циферблат
  const dg = new THREE.ShapeGeometry(rr(25.8, 25.8, 3.8), 16);
  const uv = dg.attributes.uv, pos = dg.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / 25.8 + 0.5, pos.getY(i) / 25.8 + 0.5);
  const dial = new THREE.Mesh(dg, new THREE.MeshStandardMaterial({ map: dialTexture(c), metalness: 0.55, roughness: 0.42 }));
  dial.position.z = 4.75; root.add(dial);

  // стрелки — 10:09, как на витрине
  const handM = new THREE.MeshStandardMaterial({ color: c.hand, metalness: 1, roughness: c.handRough });
  const hand = (len, w, ang, z) => {
    const s = new THREE.Shape(); s.moveTo(0, -1.6); s.lineTo(w / 2, len * 0.22); s.lineTo(0, len); s.lineTo(-w / 2, len * 0.22); s.closePath();
    const m = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.18, bevelEnabled: false }), handM);
    m.position.z = z; m.rotation.z = -ang; root.add(m);
  };
  hand(6.4, 1.5, (10 + 9 / 60) / 12 * Math.PI * 2, 5.0);
  hand(9.6, 1.15, 9 / 60 * Math.PI * 2, 5.25);
  const sec = new THREE.Mesh(new THREE.BoxGeometry(0.16, 13, 0.1), handM); sec.geometry.translate(0, 3.6, 0);
  sec.position.z = 5.5; sec.rotation.z = -Math.PI * 2 * (34 / 60); root.add(sec);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.5, 24), handM); cap.rotation.x = Math.PI / 2; cap.position.z = 5.5; root.add(cap);

  // стекло
  const glass = new THREE.Mesh(new THREE.ShapeGeometry(rr(25.2, 25.2, 3.6), 16),
    new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0, transparent: true, opacity: 0.1, envMapIntensity: 1.6, depthWrite: false }));
  glass.position.z = 6.0; root.add(glass);

  // заводная головка с синим кабошоном
  const crown = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 2, 16), polished); stem.rotation.z = Math.PI / 2; stem.position.x = 18;
  const cg = new THREE.CylinderGeometry(2.7, 2.5, 3.1, 8); cg.rotateZ(Math.PI / 2);
  const cr = new THREE.Mesh(cg, new THREE.MeshStandardMaterial({ color: 0xe6e8ec, metalness: 1, roughness: 0.1, flatShading: true })); cr.position.x = 20.4;
  const cab = new THREE.Mesh(new THREE.SphereGeometry(1.6, 24, 16), new THREE.MeshPhysicalMaterial({ color: 0x1a3fb0, roughness: 0.12, clearcoat: 1, metalness: 0.1 }));
  cab.scale.x = 0.75; cab.position.x = 22.1;
  crown.add(stem, cr, cab);
  [4.6, -4.6].forEach((y) => { const gd = new THREE.Mesh(new THREE.ExtrudeGeometry(rr(2.6, 2.4, 0.9), { depth: 3.2, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.4, bevelSegments: 3 }), brushed); gd.position.set(17.9, y, -1.6); crown.add(gd); });
  root.add(crown);

  // браслет
  const link = (w) => {
    const g = new THREE.ExtrudeGeometry(rr(w - 1.4, 5.2, 1.2), { depth: 1.2, bevelEnabled: true, bevelThickness: 0.9, bevelSize: 0.7, bevelSegments: 6, curveSegments: 10 });
    g.translate(0, 0, -0.6); const grp = new THREE.Group(); grp.add(new THREE.Mesh(g, brushed));
    screw(-(w / 2 - 3), 0, 1.36, grp, 0.4); screw(w / 2 - 3, 0, 1.36, grp, 2.1);
    return grp;
  };
  [1, -1].forEach((sgn) => {
    let th = THREE.MathUtils.degToRad(20); const p = new THREE.Vector3(0, sgn * 22.1, -1.3);
    for (let i = 0; i < 12; i++) {
      th += THREE.MathUtils.degToRad(i === 0 ? 0 : 7.5);
      const w = 22.6 - Math.min(i, 5) * 0.7, L = 6.6;
      const dir = new THREE.Vector3(0, sgn * Math.cos(th), -Math.sin(th));
      const l = link(w); l.position.copy(p).addScaledVector(dir, L / 2); l.rotation.x = -sgn * th;
      root.add(l); p.addScaledVector(dir, L + 0.05);
    }
  });

  // золотое свечение позади (для сцены «свет»)
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTexture(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
  glow.position.z = -30; glow.scale.setScalar(150);
  return { root, glow };
}
