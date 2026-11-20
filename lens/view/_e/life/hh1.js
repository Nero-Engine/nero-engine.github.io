// Hurstbourne Heights Apartments life layer (hh1, 20-11-2026). Made from uh1 (the All Seasons pattern, life1 underneath: Sunset switch, the backdrop,
// tap a thing to open its card, residents walking the building fronts) with this place's own pieces:
// - the land for sale: a ribbon of the broker's orange round the parcel (traced by eye from the broker site plan), always on, stronger at sunset
// - SUNSET is the film's dusk: a light by every balcony door comes on in a wave from the office, the lamp posts, the picnic area
// - the gimmick (the same as the film): a white-tailed deer grazes at the forest edge behind building 3. Life size, no card, no tour stop points at it.
// - Room to grow (the listing's own site plan): the 12 unit building rises out of the ground on its 0.34 acre parcel, then the clubhouse on the
//   0.56 acre parcel, then a covered pavilion at the gathering lawn, whose lamp lights (Adam 16-11-2026: grow up, never fly in).
// It moves in the web viewer only. The AR file stays a still model.
let THREE;

export async function init(X) {
  THREE = X.THREE;
  const v = new URL(import.meta.url).searchParams.get('l1');
  const SC = X.SC, INFO = X.INFO;
  const base = await (await import('./life1.js' + (v ? '?v=' + v : ''))).init(X);
  const { model, part, MATS, D, NV } = X;
  const reduced = !!NV.reduced, HERO = new THREE.Color(D.theme.hero);
  const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), sm = (x) => { x = cl(x); return x * x * (3 - 2 * x); };
  const back = (k) => { if (k <= 0) return 0; if (k >= 1) return 1; const c = 1.2, x = k - 1; return 1 + (c + 1) * x * x * x + c * x * x; };
  const FX = Object.assign({}, base.fx);
  const root = new THREE.Group(); root.name = 'hh_life'; model.add(root);
  const dusk = () => (base.dusk ? base.dusk() : 0);
  let clock = 0;
  const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const sprite = (col, size, op = 0) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: new THREE.Color(col), toneMapped: false, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending })); s.scale.setScalar(size); s.renderOrder = 7; root.add(s); return s; };
  const ribbon = (BP, W2, closed, uniforms) => { const pos = [], uv = [], idx = []; const n = BP.length;
    for (let i = 0; i < n; i++) { const a = BP[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], b = BP[closed ? (i + 1) % n : Math.min(n - 1, i + 1)], p = BP[i]; let dx = b[0] - a[0], dz = b[2] - a[2]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
      pos.push(p[0] - dz * W2, p[1] + 0.15, p[2] + dx * W2, p[0] + dz * W2, p[1] + 0.15, p[2] - dx * W2); uv.push(0, i, 1, i); if (i) { const k = (i - 1) * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
    if (closed) { const k = (n - 1) * 2; idx.push(k, k + 1, 0, k + 1, 1, 0); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    const m = new THREE.ShaderMaterial({ uniforms, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
      vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform float uK, uT; uniform vec3 uC; varying vec2 vU; void main(){ float d = abs(vU.x - 0.5) * 2.0; float a = exp(-d * d * 5.0) * 0.5 + exp(-d * d * 40.0) * 0.6; float run = 0.85 + 0.15 * sin(vU.y * 0.25 - uT * 2.0); gl_FragColor = vec4(mix(uC * 0.9, mix(uC, vec3(1.0), 0.4), exp(-d * d * 60.0)), clamp(a * uK * run, 0.0, 0.9)); }' });
    const mesh = new THREE.Mesh(g, m); mesh.renderOrder = 6; mesh.frustumCulled = false; return mesh; };

  // ---------- the land for sale: a ribbon of the broker's orange round the parcel ----------
  const HG = HERO.clone(), ribU = { uK: { value: 1 }, uT: { value: 0 }, uC: { value: new THREE.Vector3(HG.r, HG.g, HG.b) } };
  try { if (part.border) { const bm = new THREE.MeshBasicMaterial({ color: HG.clone().multiplyScalar(2.2), toneMapped: false }); part.border.traverse(o => { if (o.isMesh) { o.material = bm; o.castShadow = false; } }); }
    const BP = INFO.border || []; if (BP.length > 4) { const rib = ribbon(BP, 5, true, ribU); rib.name = 'borderGlow'; model.add(rib); } } catch (err) { console.warn('border', err); }

  // ---------- the lights come on: a wave along the suite doors from the office, the lamp posts, the barbecue area ----------
  const BL = INFO.bulbs || {}, ALL = [], OA = (INFO.office && INFO.office.at) || [0, 0, 0];
  const order = { lamps: 0.0, bbq: 0.05, doors: 0.1 };
  for (const [k, L] of Object.entries(BL)) (L || []).forEach((p) => { const far = Math.hypot(p[0] - OA[0], p[2] - OA[2]); ALL.push({ p, k, d: (order[k] ?? 0.3) + (k === 'doors' ? 0.35 * Math.min(1, far / 140) : 0) }); });
  const col = { doors: [1.0, 0.86, 0.6], lamps: [1.0, 0.95, 0.85], bbq: [1.0, 0.7, 0.4] };
  const ptsG = new THREE.BufferGeometry(); { const a = []; ALL.forEach(b => a.push(b.p[0], b.p[1], b.p[2])); ptsG.setAttribute('position', new THREE.Float32BufferAttribute(a, 3)); ptsG.setAttribute('color', new THREE.BufferAttribute(new Float32Array(a.length), 3)); }
  const ptsM = new THREE.PointsMaterial({ size: 6, sizeAttenuation: false, opacity: 0.65, map: glowTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const bulbPts = new THREE.Points(ptsG, ptsM); bulbPts.frustumCulled = false; bulbPts.renderOrder = 7; root.add(bulbPts);
  let lastLit = -1;
  function tickBulbs() { const dk = dusk(), wave = cl((dk - 0.3) / 0.6) * 1.25, key = Math.round(wave * 80); if (key === lastLit) return; lastLit = key;
    const cA = ptsG.attributes.color.array; ALL.forEach((b, i) => { const vv = sm((wave - b.d) / 0.2), c = col[b.k] || col.doors; cA[i * 3] = vv * c[0]; cA[i * 3 + 1] = vv * c[1]; cA[i * 3 + 2] = vv * c[2]; });
    ptsG.attributes.color.needsUpdate = true; bulbPts.visible = dk > 0.02; }

  // ---------- the deer (the film's gimmick): it grazes, the head dipping now and then. No card points at it. ----------
  const horse = part.joke_horse; const h0 = horse ? horse.rotation.y : 0;
  function tickHorse() { if (!horse || reduced) return; horse.rotation.y = h0 + 0.05 * Math.sin(clock * 0.21); }

  // ---------- Room to grow: the 12 units, then the clubhouse, then the pavilion grow up out of the ground; the pavilion lamp lights ----------
  const GR = INFO.grow || {}, GU = GR.units || [];
  const names = Object.keys(part).filter(n => n.startsWith('grow_')); names.forEach(n => { part[n].visible = false; });
  const pools = GU.map(u => { const s = sprite('#ffc46e', u.kind === 'clubhouse' || u.kind === '12 more units' ? 46 : 26); s.position.set(u.at[0], u.at[1] + 1.2, u.at[2]); s.visible = false; return s; });
  const warm = GU.map(u => { const s = sprite('#ffc890', u.kind === 'clubhouse' || u.kind === '12 more units' ? 30 : 22); s.position.set(u.at[0], u.at[1] + 2, u.at[2]); return s; });
  const fireS = GR.pit ? sprite('#ffd9a0', 9) : null; if (fireS) fireS.position.set(GR.pit[0], GR.pit[1] + 0.6, GR.pit[2]);
  const fireC = GR.pit ? sprite('#fff0d0', 3.5) : null; if (fireC) fireC.position.set(GR.pit[0], GR.pit[1] + 0.4, GR.pit[2]);
  const tagSet = (txt) => { if (X.GROW && X.GROW.tag) X.GROW.tag.text = txt; };
  const TAGS = (SC.life && SC.life.growTags) || ['12 more units on the 0.34 acre parcel', 'A clubhouse on the 0.56 acre parcel', 'A covered pavilion at the gathering lawn'];
  let growT = 0, wasGrow = false;
  function tickGrow(dt, on) { if (on && !wasGrow) growT = 0; wasGrow = on;
    if (!on) { names.forEach(n => { part[n].visible = false; }); pools.forEach(p => { p.visible = false; }); warm.forEach(s => { s.material.opacity = 0; }); if (fireS) { fireS.material.opacity = 0; fireC.material.opacity = 0; } return; }
    growT += reduced ? 99 : dt; const t = growT;
    GU.forEach((u, i) => { const pt = part[u.part]; if (!pt) return; const a = t - 1.6 - u.t, k = cl(a / 1.8); pt.visible = k > 0; pt.position.y = -(u.h + 0.3) * (1 - back(k));
      const p = pools[i]; p.visible = a > -0.4 && a < 4.5; p.material.opacity = 0.5 * sm((a + 0.4) / 0.4) * (1 - sm((a - 1.8) / 2.2)); warm[i].material.opacity = 0.22 * sm((a - 1.8) / 1.5); });
    const pitU = GU.find(u => u.kind === 'covered pavilion'), tf = pitU ? t - 1.6 - pitU.t - 1.9 : -1, fl = reduced ? 1 : 0.85 + 0.15 * Math.sin(clock * 9.0) * Math.sin(clock * 2.3);
    if (fireS) { fireS.material.opacity = 0.75 * sm(tf / 0.6) * fl; fireC.material.opacity = 0.9 * sm(tf / 0.6) * fl; }
    const i = t < 1.6 + 1.6 ? 0 : t < 1.6 + 3.2 ? 1 : 2; tagSet(TAGS[i]); }

  // ---------- every frame ----------
  function tick(dt, state = {}) { base.tick(dt, state); clock += dt;
    tickBulbs(); tickHorse(); tickGrow(dt, !!state.growOn);
    ribU.uT.value = clock; ribU.uK.value = 1.0 + 0.6 * dusk(); }
  window.__hh = { part, root, FX, look: (vv) => X.goView(vv, 0.01) };
  return { fx: FX, tick, dusk: base.dusk };
}
