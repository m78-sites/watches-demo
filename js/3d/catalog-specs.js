// Описание каждой модели каталога для 3D. Цвета сняты с фото магазина.
const blackRubber = { mat: { color: 0x141518, rough: 0.6, metal: 0 } };
const W = '#f2f2ef';
const santos = (bg, ink, extra) => Object.assign({ family: 'square', metal: 'steel', dial: { bg, style: 'roman', ink, text: 'AUTOMATIC', textY: 230 } }, extra || {});
const hub = (metal, bg, style, extra) => Object.assign({ family: 'hublot', metal, pushers: style === 'chrono', dial: Object.assign({ bg, style, ink: W, date: true, text: 'AUTOMATIC', textY: 300 }, style === 'chrono' ? { sub: [shadeHex(bg[0], -0.08)], date: false, text: '' } : {}) }, extra || {});
function shadeHex(h, k) { const n = parseInt(h.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255; const f = (x) => Math.max(0, Math.min(255, Math.round(x * (1 + k)))); return '#' + ((1 << 24) + (f(r) << 16) + (f(g) << 8) + f(b)).toString(16).slice(1); }

export const SPECS = {
  t05b: santos(['#24408f', '#0a1436'], '#eef1f6'),
  t05a: santos(['#1f6a45', '#082315'], '#eef1f6'),
  t09: santos(['#f6f3ec', '#d6d2c8'], '#14161b', { hands: { color: 0x2447b8 } }),
  t08: santos(['#1a2858', '#050a1e'], '#eef1f6'),
  t07: { family: 'square', metal: 'iced', cab: 0x1a3fb0, dial: { bg: ['#d7dade', '#8f9399'], style: 'skeleton', overlay: 'roman', ink: '#f7f8fa', mech: '#c4c8ce' }, hands: { color: 0x2447b8 } },
  t24: { family: 'square', metal: 'iced', cab: 0x8a8d93, dial: { bg: ['#2a2c31', '#0d0e11'], style: 'skeleton', overlay: 'roman', ink: '#f7f8fa', mech: '#9da1a8' }, hands: { color: 0xeef0f3 } },

  t03a: hub('steel', ['#9b9b97', '#5d5e5b'], 'chrono', { strapSpec: blackRubber }),
  t03b: hub('steel', ['#b8b1a0', '#7b7668'], 'baton', { strapSpec: blackRubber }),
  t03c: hub('black', ['#22398a', '#0b163f'], 'baton', { strapSpec: blackRubber }),
  t04a: hub('bronze', ['#5b4537', '#24180f'], 'chrono', { band: 'bracelet' }),
  t04b: Object.assign(hub('steel', ['#aeb1b6', '#6f7379'], 'chrono', { band: 'bracelet' }), {}),
  t04c: hub('steel', ['#24408f', '#0b1640'], 'chrono', { band: 'bracelet' }),

  t14: { family: 'round', metal: 'steel', r: 20, lugW: 20, guards: true, bezel: { kind: 'diver', color: '#0c0d0f', width: 4.2 }, dial: { bg: ['#141518', '#050506'], style: 'diver', date: true, ink: '#e9e9e4', sun: false }, hands: { style: 'mercedes', lumeOn: true, w: 1.9 }, braceletSpec: { style: 'oyster' } },
  t15: { family: 'round', metal: 'steel', r: 20, lugW: 20, guards: true, bezel: { kind: 'gmt', colors: ['#3b2116', '#0d0d0e'], ink: '#e7c682', width: 4.2 }, dial: { bg: ['#16191a', '#060707'], style: 'diver', date: true, ink: '#e7c682', sun: false, lume: '#efe6c8' }, hands: { style: 'mercedes', lumeOn: true, color: 0xe2bd72, w: 1.9, sec: 0xc8a050 }, braceletSpec: { style: 'oyster', centerMat: 'gold' } },
  t16: { family: 'cushion', metal: 'steel', dial: { bg: ['#1c2a52', '#080f26'], style: 'baton', stripes: true, date: true, ink: '#e9ecf2', sun: false } },
  t11: { pair: [
    { family: 'cushion', metal: 'steel', dial: { bg: ['#6e4024', '#2b1408'], style: 'baton', stripes: true, date: true, ink: '#f0e6d8', sun: false } },
    { family: 'cushion', metal: 'steel', dial: { bg: ['#1c2a52', '#080f26'], style: 'baton', stripes: true, date: true, ink: '#e9ecf2', sun: false } },
  ] },
  t17: { family: 'oct', metal: 'steel', dial: { bg: ['#c6c9ce', '#80848a'], style: 'skeleton', ink: '#f6f7f9', mech: '#c2c6cc', ring: 'rgba(225,228,233,.95)' } },
  t13: { family: 'round', metal: { ceramic: 0xe8e0cd }, r: 21, lugW: 20, pushers: true, bezel: { kind: 'tachy', color: '#a8161f', ink: '#f4eee2', width: 4.4 }, dial: { bg: ['#f1e9d8', '#d8cdb6'], style: 'chrono', ink: '#2c2c2c', accent: '#a8161f', sub: ['#a8161f'], subHand: '#f4eee2', sun: false }, hands: { color: 0xf2f2f2, w: 1.5, lumeOn: true, sec: 0xa8161f }, band: 'strap', strapSpec: { mat: { color: 0xa8161f, rough: 0.7, metal: 0 }, w: 19.6 } },

  t19a: { family: 'squareChrono', metal: 'rose', screw: 'rose', bezelMat: { color: 0x1d3c8f, metal: 0.25, rough: 0.28 }, dial: { bg: ['#284a9e', '#0d1f4f'], style: 'chrono', ink: '#f3f3f3', accent: '#e0a585', sub: ['#1a3478'], indexInk: 'gold' }, hands: { color: 0xe0a585 }, strapSpec: { mat: { color: 0x1d3c8f, rough: 0.6, metal: 0 } } },
  t19b: { family: 'squareChrono', metal: 'steel', screw: 'steel', bezelMat: { color: 0x1f5a3c, metal: 0.25, rough: 0.28 }, dial: { bg: ['#2f7a51', '#0f3020'], style: 'chrono', ink: '#f3f3f3', accent: '#d9dbe0', sub: ['#205a3b'] }, strapSpec: { mat: { color: 0x1f5a3c, rough: 0.6, metal: 0 } } },
  t23: { family: 'squareChrono', metal: 'black', screw: 'steel', bezelMat: { color: 0x16171a, metal: 0.6, rough: 0.3 }, dial: { bg: ['#2a2c30', '#0c0d10'], style: 'skeleton', ink: '#f3f3f3', mech: '#9ca0a7', sub: ['#202226'] }, strapSpec: blackRubber },

  t20: { family: 'barrel', metal: 'steel', caseMat: { color: 0x1b2f7c, metal: 0.25, rough: 0.3 }, pushers: true, dial: { bg: ['#25366e', '#0a1230'], style: 'chrono', ink: '#f1f3f8', sub: ['#141f45'], accent: '#c8d2ee' }, strapSpec: { mat: { color: 0x1b2f7c, rough: 0.6, metal: 0 } } },
  t21: { family: 'barrel', metal: 'steel', caseMat: { clear: 0xff6d12 }, pushers: true, dial: { bg: ['#2b2d33', '#0b0c0f'], style: 'chrono', ink: '#f1f3f8', sub: ['#1a1b20'], accent: '#ff7a1a', subHand: '#ff7a1a' }, strapSpec: { mat: { color: 0xff6d12, rough: 0.55, metal: 0 } } },

  t02a: { family: 'round', metal: 'steel', r: 20.5, lugW: 21, pushers: true, bezel: { kind: 'tachy', color: '#101114', width: 3.6 }, dial: { bg: ['#203a7c', '#0a1638'], style: 'chrono', ink: '#f1f1f1', sub: ['#152a5c'], date: false }, braceletSpec: { style: 'oyster', center: 'polish' } },
  t02b: { family: 'round', metal: 'steel', r: 20.5, lugW: 21, pushers: true, bezel: { kind: 'tachy', color: '#101114', width: 3.6 }, dial: { bg: ['#25272b', '#0b0c0e'], style: 'chrono', ink: '#f1f1f1', sub: ['#1a1b1e'], date: false }, braceletSpec: { style: 'oyster', center: 'polish' } },
  t01: { family: 'round', metal: 'steel', r: 21, lugW: 22, pushers: true, bezel: { kind: 'tachy', color: '#172f78', width: 3.8 }, dial: { bg: ['#1f3a8a', '#0a1640'], style: 'chrono', ink: '#f1f1f1', accent: '#f2c230', sub: ['#122a66'], subHand: '#f2c230' }, hands: { sec: 0xf2c230, lumeOn: true }, band: 'strap', strapSpec: { mat: { color: 0x1a3584, rough: 0.6, metal: 0 }, w: 21.6 } },
  t28: { family: 'round', metal: 'steel', r: 19, lugW: 18, bezel: { kind: 'polish', width: 1.6 }, dial: { bg: ['#d9dce0', '#9ea3aa'], style: 'baton', date: true, ink: '#2c2e33', indexInk: 'dark' }, hands: { color: 0xdfe2e6 }, braceletSpec: { style: 'plain' } },
  t29: { pair: [
    { family: 'round', metal: 'steel', r: 19, lugW: 18, bezel: { kind: 'polish', width: 1.6 }, dial: { bg: ['#c5dcec', '#7ea3c0'], style: 'baton', date: true, ink: '#24313d', indexInk: 'dark' }, braceletSpec: { style: 'plain' } },
    { family: 'round', metal: 'steel', r: 15.5, lugW: 14, bezel: { kind: 'polish', width: 1.4 }, dial: { bg: ['#c5dcec', '#7ea3c0'], style: 'baton', ink: '#24313d', indexInk: 'dark' }, braceletSpec: { style: 'plain' } },
  ] },
  // часы, у которых раньше было только фото
  t35: { family: 'round', metal: 'steel', r: 20, lugW: 24, bezel: { kind: 'polish', width: 2.6 }, dial: { bg: ['#1c1d20', '#08090a'], style: 'baton', date: true, ink: '#eef0f2', text: 'AUTOMATIC', textY: 300 }, hands: { style: 'baton', lumeOn: true }, braceletSpec: { style: 'integrated', w: 24 } },
  t30: { pair: [
    { family: 'round', metal: 'steel', r: 20, lugW: 20, bezel: { kind: 'polish', width: 1.8 }, dial: { bg: ['#e4e5e7', '#a9acb1'], style: 'baton', date: true, ink: '#2c2e33', indexInk: 'dark' }, braceletSpec: { style: 'oyster', center: 'polish' } },
    { family: 'round', metal: 'steel', r: 16, lugW: 15, bezel: { kind: 'polish', width: 1.4 }, dial: { bg: ['#e4e5e7', '#a9acb1'], style: 'baton', ink: '#2c2e33', indexInk: 'dark' }, braceletSpec: { style: 'oyster', center: 'polish' } },
  ] },
  t25: { family: 'barrel', metal: 'steel', caseMat: { clear: 0xdfe8ef }, pushers: true, dial: { bg: ['#d8dde2', '#8e959d'], style: 'skeleton', ink: '#ffffff', mech: '#b9bec5' }, strapSpec: { mat: { color: 0xe9ecef, rough: 0.5, metal: 0 } } },
  t26: { family: 'barrel', metal: 'steel', caseMat: { color: 0x17181b, metal: 0.4, rough: 0.35 }, pushers: true, dial: { bg: ['#2a2c30', '#0b0c0e'], style: 'chrono', ink: '#f1f3f8', sub: ['#1a1b1f'], accent: '#e23b2e', subHand: '#e23b2e' }, strapSpec: { mat: { color: 0xc9271f, rough: 0.6, metal: 0 } } },
  t27: { family: 'round', metal: 'black', r: 23, lugW: 24, pushers: true, bezel: { kind: 'tachy', color: '#1a1b1e', ink: '#c9ccd2', width: 4.6 }, dial: { bg: ['#2b2e31', '#141617'], style: 'digital', screen: '#c9ceca', lcd: '#1a1c1e', top: 'ПТ 13', bottom: '1 024 м', sun: false }, hands: { len: 0 }, band: 'strap', strapSpec: { mat: { color: 0x1a1b1d, rough: 0.6, metal: 0 }, w: 23 } },
  t31: { family: 'round', metal: 'black', r: 22, lugW: 22, bezel: { kind: 'tachy', color: '#2a2c30', ink: '#e7e9ec', width: 3.6 }, dial: { bg: ['#0c0d0f', '#050506'], style: 'digital', screen: '#0d0f12', lcd: '#f2f4f6', rings: ['#ff7a1a', '#3fb3ff', '#7ed957'], top: 'ПТ 13', bottom: '8 412 шагов', sun: false }, hands: { len: 0 }, band: 'strap', strapSpec: { mat: { color: 0xff6d12, rough: 0.6, metal: 0 }, w: 21.6 } },

};
