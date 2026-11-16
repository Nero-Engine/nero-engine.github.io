// All Seasons Mobile Home & RV Park and Motel life layer (allseasons1, 16-11-2026). The Cabins Off The Trace pattern (life1 underneath: Sunset switch,
// the backdrop, tap a thing to open its card, highway cars, walkers and a dog) with this place's own pieces:
// - the office opens: on the "office" card its roof lifts away to show the front desk, the two carved eagles, the flag and the morning coffee
// - SUNSET is the motel's own night (creative brief, wow pick): the neon VACANCY and OFFICE come on, the four tile sign and the USED CARS board glow,
//   a light by every motel door in a wave down the wing, the porch lights over the homes' red steps, the triple globe lamp post, the office lamps
// - the gimmick (the same as the film): now and then a tumbleweed rolls in off the plain and bounces along the frontage past the sign.
//   Life size, no card, no tour stop and no camera move point at it.
// - Room to grow (the film's idea): a plane of light settles at 45 ft over the land, then retail and office, a restaurant and an automotive center
//   GROW UP OUT OF THE GROUND (Adam 16-11-2026: never fly in) on pools of white light that warm; the lot next door glows on its own.
// It moves in the web viewer only. The AR file stays a still model.
let THREE;

export async function init(X) {
  THREE = X.THREE;
  const v = new URL(import.meta.url).searchParams.get('l1');
  const SC = X.SC, INFO = X.INFO;
  const base = await (await import('./life1.js' + (v ? '?v=' + v : ''))).init(X);
  const { model, part, MATS, D, NV } = X;
  const reduced = !!NV.reduced, HERO = new THREE.Color(D.theme.hero), PY = (INFO.protoAt || [0, -8, 0])[1];
  const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), sm = (x) => { x = cl(x); return x * x * (3 - 2 * x); };
  const back = (k) => { if (k <= 0) return 0; if (k >= 1) return 1; const c = 1.2, x = k - 1; return 1 + (c + 1) * x * x * x + c * x * x; };
  const FX = Object.assign({}, base.fx);
  const root = new THREE.Group(); root.name = 'allseasons_life'; model.add(root);
  const groundY = base.groundY || X.groundY;
  const dusk = () => (base.dusk ? base.dusk() : 0);
  let clock = 0;
  const kidGeo = (name) => { const out = []; if (!part[name]) return out; part[name].traverse(o => { if (o.isMesh) { const g = o.geometry.clone(); o.updateMatrix(); g.applyMatrix4(o.matrix); g.translate(0, -PY, 0); out.push([g, o.material]); } }); return out; };
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

  // ---------- the land for sale: a ribbon of NAI Black red round the parcel, always on, stronger at sunset ----------
  const HG = HERO.clone(), ribU = { uK: { value: 1 }, uT: { value: 0 }, uC: { value: new THREE.Vector3(HG.r, HG.g, HG.b) } };
  try { if (part.border) { const bm = new THREE.MeshBasicMaterial({ color: HG.clone().multiplyScalar(2.2), toneMapped: false }); part.border.traverse(o => { if (o.isMesh) { o.material = bm; o.castShadow = false; } }); }
    const BP = INFO.border || []; if (BP.length > 4) { const rib = ribbon(BP, 6, true, ribU); rib.name = 'borderGlow'; model.add(rib); } } catch (err) { console.warn('border', err); }

  // ---------- the office opens: its roof lifts and slides back on the office card ----------
  let rO = 0;
  function tickOffice(dt, sel) { if (!part.office_roof) return; const w = sel && sel.id === 'office' ? 1 : 0;
    rO += (w - rO) * Math.min(1, (w ? 1.5 : 3) * dt); const g = sm(rO), bob = !reduced && g > 0.99 ? Math.sin(clock * 1.3) * 0.08 : 0;
    part.office_roof.position.set(-9 * g, 7 * Math.sin(Math.PI * 0.5 * Math.min(1, g * 1.3)) + bob, 0);
    part.office_roof.traverse(m => { if (m.isMesh) m.castShadow = g < 0.05; }); }

  // ---------- the motel's own night: neon, the four tile sign, the USED CARS board, the office lamps ----------
  const byName = (n) => MATS.filter(m => m.name === n);
  const neonV = byName('neon_vacancy'), neonO = byName('neon_office'), signP = byName('sign_panel'), signB = byName('sign_board'), lantM = byName('lantern');
  const ei0 = new Map(); [...neonV, ...neonO, ...signP, ...signB, ...lantM].forEach(m => ei0.set(m, m.emissiveIntensity ?? 1));
  function tickNight(t) { const dk = dusk(), k = sm((dk - 0.2) / 0.4), fl = reduced ? 1 : 0.93 + 0.07 * Math.sin(t * 23.0) * Math.sin(t * 3.1);
    neonV.forEach(m => { m.emissiveIntensity = ei0.get(m) * (1 + 2.6 * k * fl); }); neonO.forEach(m => { m.emissiveIntensity = ei0.get(m) * (1 + 2.6 * k); });
    signP.forEach(m => { m.emissiveIntensity = ei0.get(m) + 0.9 * k; }); signB.forEach(m => { m.emissiveIntensity = ei0.get(m) + 1.1 * k; });
    lantM.forEach(m => { m.emissiveIntensity = ei0.get(m) + 2.5 * k; }); }

  // ---------- the lights come on: a wave down the motel doors from the office, the homes' porch lights, the lamp post, the office lamps ----------
  const BL = INFO.bulbs || {}, ALL = [], OA = (INFO.office && INFO.office.at) || [0, 0, 0];
  const order = { lamp: 0.0, inside: 0.05, doors: 0.1, homes: 0.35 };
  for (const [k, L] of Object.entries(BL)) (L || []).forEach((p) => { const far = Math.hypot(p[0] - OA[0], p[2] - OA[2]); ALL.push({ p, k, d: (order[k] ?? 0.3) + (k === 'doors' || k === 'homes' ? 0.3 * Math.min(1, far / 150) : 0) }); });
  const col = { doors: [1.0, 0.86, 0.6], homes: [1.0, 0.9, 0.7], lamp: [1.0, 0.95, 0.85], inside: [1.0, 0.7, 0.4] };
  const ptsG = new THREE.BufferGeometry(); { const a = []; ALL.forEach(b => a.push(b.p[0], b.p[1], b.p[2])); ptsG.setAttribute('position', new THREE.Float32BufferAttribute(a, 3)); ptsG.setAttribute('color', new THREE.BufferAttribute(new Float32Array(a.length), 3)); }
  const ptsM = new THREE.PointsMaterial({ size: 6, sizeAttenuation: false, opacity: 0.65, map: glowTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const bulbPts = new THREE.Points(ptsG, ptsM); bulbPts.frustumCulled = false; bulbPts.renderOrder = 7; root.add(bulbPts);
  let lastLit = -1;
  function tickBulbs() { const dk = dusk(), wave = cl((dk - 0.3) / 0.6) * 1.25, key = Math.round(wave * 80); if (key === lastLit) return; lastLit = key;
    const cA = ptsG.attributes.color.array; ALL.forEach((b, i) => { const v = sm((wave - b.d) / 0.2), c = col[b.k] || col.doors; cA[i * 3] = v * c[0]; cA[i * 3 + 1] = v * c[1]; cA[i * 3 + 2] = v * c[2]; });
    ptsG.attributes.color.needsUpdate = true; bulbPts.visible = dk > 0.02; }

  // ---------- the tumbleweed (the film's gimmick): a 70 s loop. It rolls in off the plain from the east, bounces along the frontage between the
  // highway and the used car lot at a breeze's pace (about 4 m/s), past the sign, and out over the west edge; then the plain is quiet a while. ----------
  const TP = INFO.tumble || [], TG = kidGeo('proto_tumble'), tw = new THREE.Group(); root.add(tw);
  TG.forEach(([g, m]) => { g.computeBoundingBox(); const c = g.boundingBox.getCenter(new THREE.Vector3()); g.translate(-c.x, -c.y, -c.z); const o = new THREE.Mesh(g, m); o.castShadow = true; tw.add(o); });
  const RAD = 0.55; const tc = [0]; for (let k = 1; k < TP.length; k++) tc.push(tc[k - 1] + Math.hypot(TP[k][0] - TP[k - 1][0], TP[k][2] - TP[k - 1][2])); const tLen = tc[tc.length - 1] || 1;
  let tT = 3, spin = 0; tw.visible = false;
  function tickTumble(dt) { if (!TP.length || !TG.length) return; const SP = 4.0, runT = tLen / SP, LOOP = runT + 25; tT = reduced ? runT * 0.55 : (tT + dt) % LOOP;
    if (tT > runT) { tw.visible = false; return; } tw.visible = true; const gust = 1 + 0.35 * Math.sin(tT * 0.9), d = Math.min(tLen, tT * SP * (reduced ? 1 : gust * 0.9));
    let k = 1; while (k < tc.length - 1 && tc[k] < d) k++; const a = TP[k - 1], b = TP[k], u = cl((d - tc[k - 1]) / ((tc[k] - tc[k - 1]) || 1)), x = a[0] + (b[0] - a[0]) * u, z = a[2] + (b[2] - a[2]) * u;
    const hop = reduced ? 0 : Math.abs(Math.sin(tT * 3.1)) * 0.5 * (0.6 + 0.4 * Math.sin(tT * 1.3)), edge = sm(Math.min(d, tLen - d) / 6);
    if (!reduced) spin += dt * SP * gust / RAD; tw.position.set(x, groundY(x, z) + RAD + hop, z); tw.rotation.set(0, Math.atan2(b[0] - a[0], b[2] - a[2]), 0); tw.children.forEach(o => { o.rotation.x = spin; });
    tw.scale.setScalar(Math.max(1e-3, edge)); }

  // ---------- Room to grow: the 45 ft plane of light, then the three ideas grow up out of the ground; the lot next door glows on its own ----------
  const GR = INFO.grow || {}, GU = GR.units || [];
  const names = Object.keys(part).filter(n => n.startsWith('grow_')); names.forEach(n => { part[n].visible = false; });
  const pools = GU.map(u => { const s = sprite('#ffffff', 26); s.position.set(u.at[0], u.at[1] + 1.2, u.at[2]); s.visible = false; return s; });
  const warm = GU.map(u => { const s = sprite('#ffc890', 30); s.position.set(u.at[0], u.at[1] + 3, u.at[2]); return s; });
  let plane = null; const planeU = { o: { value: 0 } };
  if (GR.plane) { const Pq = GR.plane, w = Pq.x1 - Pq.x0, d = Pq.z1 - Pq.z0; const g = new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2);
    plane = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: planeU, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
      vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform float o; varying vec2 vU; void main(){ float e = min(min(vU.x, 1.0 - vU.x), min(vU.y, 1.0 - vU.y)); float a = 0.06 + 0.7 * exp(-e / 0.012); gl_FragColor = vec4(vec3(1.0, 0.97, 0.92), a * o); }' }));
    plane.position.set((Pq.x0 + Pq.x1) / 2, Pq.y, (Pq.z0 + Pq.z1) / 2); plane.renderOrder = 8; plane.visible = false; root.add(plane); }
  const notchU = { uK: { value: 0 }, uT: { value: 0 }, uC: { value: new THREE.Vector3(1.0, 0.85, 0.6) } };
  let notch = null; if ((GR.notch || []).length > 2) { const N = GR.notch, pts = []; for (let i = 0; i < N.length; i++) { const a = N[i], b = N[(i + 1) % N.length], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[2] - a[2]) / 3)); for (let k = 0; k < n; k++) pts.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n, a[2] + (b[2] - a[2]) * k / n]); }
    notch = ribbon(pts, 3.5, true, notchU); notch.visible = false; root.add(notch); }
  const tagSet = (txt) => { if (X.GROW && X.GROW.tag) X.GROW.tag.text = txt; };
  const TAGS = (SC.life && SC.life.growTags) || ['45 ft maximum height, zoned C1-A', 'Retail and office on the Highway 2 frontage', 'A restaurant', 'An automotive center beside the used car lot', 'Lot next door: available separately'];
  let growT = 0, wasGrow = false;
  function tickGrow(dt, on) { if (on && !wasGrow) growT = 0; wasGrow = on;
    if (part.lotcars) part.lotcars.visible = !on;
    if (!on) { names.forEach(n => { part[n].visible = false; }); pools.forEach(p => { p.visible = false; }); warm.forEach(s => { s.material.opacity = 0; }); if (plane) plane.visible = false; if (notch) notch.visible = false; return; }
    growT += reduced ? 99 : dt; const t = growT;
    if (plane) { plane.visible = true; const k = reduced ? 1 : sm(t / 1.6); plane.position.y = GR.plane.y + 18 * (1 - k); planeU.o.value = Math.min(1, t / 0.6) * (1 - 0.55 * sm((t - 2.4) / 1.5)); }
    GU.forEach((u, i) => { const pt = part[u.part]; if (!pt) return; const a = t - 1.8 - u.t, k = cl(a / 2.2); pt.visible = k > 0; pt.position.y = -(u.h + 0.3) * (1 - back(k));
      const p = pools[i]; p.visible = a > -0.4 && a < 4.5; p.material.opacity = 0.55 * sm((a + 0.4) / 0.4) * (1 - sm((a - 2.2) / 2.2)); warm[i].material.opacity = 0.28 * sm((a - 2.0) / 1.5); });
    const tn = t - 6.8; if (notch) { notch.visible = tn > 0; notchU.uK.value = sm(tn / 0.8); notchU.uT.value = clock; }
    const i = t < 1.8 ? 0 : t < 3.2 ? 1 : t < 4.6 ? 2 : t < 6.8 ? 3 : 4; tagSet(TAGS[i]); }

  // ---------- every frame ----------
  function tick(dt, state = {}) { base.tick(dt, state); clock += dt;
    tickOffice(dt, state.sel); tickNight(clock); tickBulbs(); tickTumble(dt); tickGrow(dt, !!state.growOn);
    ribU.uT.value = clock; ribU.uK.value = 1.0 + 0.6 * dusk(); }
  window.__as = { part, root, FX, tumble: (c) => { tT = c; }, look: (v) => X.goView(v, 0.01) };
  return { fx: FX, tick, dusk: base.dusk };
}
