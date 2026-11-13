// Cotton Country RV Guest Ranch life layer (cotton1, 13-11-2026). Built on life1 (cars on US 287 and the county road, following the ground with
// scene.life.carsGround, lamps, the Sunset switch) and the Tin Cup pieces (the 10 m border ribbon, ground grain, library people, gravel in front
// of the land and tap to open, now switched on in listing.json through the shared life1: scene.life.front and scene.life.tap), and:
// - a BNSF freight train (two orange locomotives and 32 hoppers and boxcars) running the railway beside the ranch, semis on US 287
// - the quiet touch (Adam 13-11-2026: subtle and hidden, never pointed out): now and then a life-size roadrunner walks along the west barn wall,
//   stops at the door, looks round and goes on into the grass. No card, no tour stop, no camera move, no dust.
// - both barn roofs lift off together and float on the pads, hookups, services cards; the office roof lifts on the office card
// - a dog asleep on its mat in the west barn, workers in hi-vis walking the aisles
// - its own card effects: ccpads (the 48 pads light one by one, a counter counts 1 to 48), ccutil (new water lines and septic, a meter glows at
//   every pad), ccgrow (Room to grow, built the first time it opens: lanes draw in, 452 pads sweep across the north field, RVs arrive, then a
//   small restaurant, a public laundry and a fenced dog park rise in, all marked concept)
// Load (13-11-2026): ground heights come from life1's height grid, never a raycast per point (that froze the page for 30 s).
// No halo rings anywhere. It moves in the web viewer only. The AR file stays a still model.
import { initPeople } from './people1.js?v=1';
let THREE;

export async function init(X) {
  THREE = X.THREE;
  const v = new URL(import.meta.url).searchParams.get('l1');
  const SC = X.SC, INFO = X.INFO;
  // the train group is a named part before life1 starts, so the shared tap code (scene.life.tap.train) opens its card
  const trainG = new THREE.Group(); trainG.name = 'train'; X.part.train = trainG;
  const base = await (await import('./life1.js' + (v ? '?v=' + v : ''))).init(X);
  const { model, part, MATS, D, NV } = X;
  const reduced = !!NV.reduced, HERO = new THREE.Color(D.theme.hero), PY = (INFO.protoAt || [0, -8, 0])[1];
  const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), sm = (x) => { x = cl(x); return x * x * (3 - 2 * x); };
  const back = (k) => { if (k <= 0) return 0; if (k >= 1) return 1; const c = 1.7, x = k - 1; return 1 + (c + 1) * x * x * x + c * x * x; };
  const flash = (t, a, d, decay = 2.2) => t <= a ? 0 : t < a + d ? (t - a) / d : Math.exp(-(t - a - d) * decay);
  const angTo = (a, b, k) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return a + d * k; };
  const FX = Object.assign({}, base.fx);
  const root = new THREE.Group(); root.name = 'cotton_life'; model.add(root);
  const kid = (name, parent = root) => { if (!part[name]) return null; const g = new THREE.Group(), inner = part[name].clone(true); inner.visible = true; inner.position.set(0, -PY, 0); g.add(inner);
    g.traverse(o => { if (o.isMesh) o.castShadow = true; }); parent.add(g); return g; };
  const lightM = (k, o = {}) => new THREE.MeshBasicMaterial(Object.assign({ color: new THREE.Color('#fff4dc').multiplyScalar(k), toneMapped: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }, o));
  // instanced copies of a hidden proto piece
  function inst(name, n) { const p = part[name]; if (!p || !n) return null; const meshes = []; p.traverse(o => { if (o.isMesh) meshes.push(o); });
    const ims = meshes.map(o => { o.updateMatrix(); const g = o.geometry.clone(); g.applyMatrix4(o.matrix); g.translate(0, -PY, 0); const im = new THREE.InstancedMesh(g, o.material, n); im.castShadow = true; im.frustumCulled = false; root.add(im); return im; });
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(0, 0, 0, 'YXZ'), pv = new THREE.Vector3(), sv = new THREE.Vector3();
    const I = { ims, set(i, x, y, z, ry = 0, s = 1, rx = 0) { e.set(rx, ry, 0); q.setFromEuler(e); m4.compose(pv.set(x, y, z), q, sv.setScalar(Math.max(s, 1e-4))); for (const im of ims) im.setMatrixAt(i, m4); },
      hide(i) { I.set(i, 0, PY, 0, 0, 1e-4); }, done() { for (const im of ims) im.instanceMatrix.needsUpdate = true; } };
    for (let i = 0; i < n; i++) I.hide(i); I.done(); return I; }
  // a path with distance along it: at(s) -> { x, y, z, dx, dz }
  function path(pts) { const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][2] - pts[i - 1][2]));
    const len = cum[cum.length - 1] || 1;
    return { len, at(s, o = {}) { s = cl(s, 0, len); let lo = 1, hi = cum.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (cum[m] < s) lo = m + 1; else hi = m; }
      const i = lo, a = pts[i - 1], b = pts[i], t = cl((s - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1)), l = Math.hypot(b[0] - a[0], b[2] - a[2]) || 1;
      o.x = a[0] + (b[0] - a[0]) * t; o.y = a[1] + (b[1] - a[1]) * t; o.z = a[2] + (b[2] - a[2]) * t; o.dx = (b[0] - a[0]) / l; o.dz = (b[2] - a[2]) / l; return o; } }; }

  // ground height under a point (raycast once)
  // (life1's height grid since 13-11-2026: a raycast per point froze the page for 30 s)
  const groundY = (x, z, fall = INFO.land ?? 0.5) => base.groundY(x, z, fall);

  // RV roofs and white sides: the sun sheen down 20% (as Riverbend and Tin Cup)
  MATS.forEach(m => { if (!/^barn_in/.test(m.userData.p || '')) return; const l = (m.color.r + m.color.g + m.color.b) / 3; if (l < 0.6 && !m.map) return;
    m.color.multiplyScalar(0.86); if (m.userData.c0) m.userData.c0.copy(m.color); m.roughness = Math.max(m.roughness, 0.45); m.envMapIntensity = (m.envMapIntensity ?? 1) * 0.8; });

  const PEOPLE = initPeople(X, root);

  // ---------- the land for sale: a 10 m ribbon of light round the 55 acres, always on, stronger at sunset (Adam 13-11-2026: thicker, brighter) ----------
  const ribU = { uK: { value: 1 }, uT: { value: 0 } }, HG = HERO.clone();
  try { if (part.border) { const bm = new THREE.MeshBasicMaterial({ color: HG.clone().multiplyScalar(2.6), toneMapped: false }); part.border.traverse(o => { if (o.isMesh) { o.material = bm; o.castShadow = false; } }); }
    const BP = INFO.border || []; if (BP.length > 4) { const W2 = 10, pos = [], uv = [], idx = [];
      for (let i = 0; i < BP.length; i++) { const a = BP[Math.max(0, i - 1)], b = BP[Math.min(BP.length - 1, i + 1)], p = BP[i]; let dx = b[0] - a[0], dz = b[2] - a[2]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
        pos.push(p[0] - dz * W2, p[1] + 0.15, p[2] + dx * W2, p[0] + dz * W2, p[1] + 0.15, p[2] - dx * W2); uv.push(0, i, 1, i); if (i) { const k = (i - 1) * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
      const m = new THREE.ShaderMaterial({ uniforms: Object.assign(ribU, { uC: { value: new THREE.Vector3(HG.r, HG.g, HG.b) } }), transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
        vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: 'uniform float uK, uT; uniform vec3 uC; varying vec2 vU; void main(){ float d = abs(vU.x - 0.5) * 2.0; float a = exp(-d * d * 5.0) * 0.6 + exp(-d * d * 40.0) * 0.65; float run = 0.85 + 0.15 * sin(vU.y * 0.25 - uT * 2.0); gl_FragColor = vec4(mix(uC * 0.9, mix(uC, vec3(1.0), 0.45), exp(-d * d * 60.0)), clamp(a * uK * run, 0.0, 0.95)); }' });
      const rib = new THREE.Mesh(g, m); rib.name = 'borderGlow'; rib.renderOrder = 6; rib.frustumCulled = false; model.add(rib); } } catch (err) { console.warn('border', err); }

  // ---------- a fine grain on the ground: the low sun catches the grass ----------
  try { if (part.ground) { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), id = x.createImageData(256, 256);
      const H = new Float32Array(256 * 256); let s = 7; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
      for (let o = 0; o < 6; o++) { const f = 2 ** (o + 2), amp = 1 / (o + 1.2), G = []; for (let i = 0; i < f * f; i++) G.push(r());
        for (let j = 0; j < 256; j++) for (let i = 0; i < 256; i++) { const u = i / 256 * f, w = j / 256 * f, i0 = Math.floor(u), j0 = Math.floor(w), a = u - i0, b = w - j0, Pq = (p, q) => G[(q % f) * f + (p % f)];
          const aa = a * a * (3 - 2 * a), bb = b * b * (3 - 2 * b); H[j * 256 + i] += amp * ((Pq(i0, j0) * (1 - aa) + Pq(i0 + 1, j0) * aa) * (1 - bb) + (Pq(i0, j0 + 1) * (1 - aa) + Pq(i0 + 1, j0 + 1) * aa) * bb); } }
      for (let j = 0; j < 256; j++) for (let i = 0; i < 256; i++) { const k = (j * 256 + i) * 4, dx = H[j * 256 + (i + 1) % 256] - H[j * 256 + (i + 255) % 256], dz = H[((j + 1) % 256) * 256 + i] - H[((j + 255) % 256) * 256 + i];
        const nn = new THREE.Vector3(-dx * 3, -dz * 3, 1).normalize(); id.data[k] = (nn.x * 0.5 + 0.5) * 255; id.data[k + 1] = (nn.y * 0.5 + 0.5) * 255; id.data[k + 2] = (nn.z * 0.5 + 0.5) * 255; id.data[k + 3] = 255; }
      x.putImageData(id, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(150, 150); t.anisotropy = 4;
      part.ground.traverse(o => { if (o.isMesh && o.material && o.material.map) { o.material.normalMap = t; o.material.normalScale = new THREE.Vector2(0.35, 0.35); o.material.roughness = 1; o.material.metalness = 0; o.material.envMapIntensity = Math.min(o.material.envMapIntensity ?? 1, 0.35); o.material.needsUpdate = true; } }); } } catch (err) { console.warn('grain', err); }

  // ---------- the roofs: both barn roofs lift off together and float (pads, hookups, services cards); the office roof on its card ----------
  const BI = INFO.barns || {}, ROOFS = [];
  const roofCards = (SC.life && SC.life.roofCards) || {};
  for (const [id, b] of Object.entries(BI)) if (part['barn_roof_' + id]) ROOFS.push({ p: part['barn_roof_' + id], cards: roofCards.barn || ['pads', 'hookups', 'util'], up: 24, slide: 14 * (id === 'w' ? -1 : 1), f: b.f, ph: id === 'w' ? 0 : 1.7, e: 0 });
  if (part.office_roof) ROOFS.push({ p: part.office_roof, cards: roofCards.office || ['office'], up: 7, slide: 6, f: Math.PI / 2, ph: 0.6, e: 0 });
  function tickRoofs(dt, sel) { const id = sel && sel.id;
    for (const R of ROOFS) { const want = id && R.cards.includes(id) ? 1 : 0; R.e += (want - R.e) * Math.min(1, (want ? 1.3 : 3) * dt); const e = sm(R.e);
      const sx = Math.cos(R.f), sz = -Math.sin(R.f), up = R.up * Math.sin(Math.PI * 0.5 * Math.min(1, e * 1.25)) + (e > 0.99 && !reduced ? Math.sin(clock * 1.1 + R.ph) * 0.5 : 0);
      R.p.position.set(sx * R.slide * e, up, sz * R.slide * e); R.p.traverse(m => { if (m.isMesh) m.castShadow = e < 0.05; }); } }

  // ---------- the dog asleep on its mat in the west barn: lying on its side, breathing ----------
  let dog = null; if (BI.w && BI.w.mat && part.proto_dog) { dog = kid('proto_dog'); if (dog) { dog.position.set(BI.w.mat[0], BI.w.at[1] + 0.3, BI.w.mat[1]); dog.rotation.set(0, BI.w.f + 0.6, 1.45, 'YXZ'); } }

  // ---------- the freight train on the railway (east track), and semis on US 287 ----------
  const RP = path(INFO.rail || []), HWY = (INFO.highway || []);
  const KINDS = ['loco', 'loco']; for (let i = 0; i < 32; i++) KINDS.push(i % 5 === 3 ? 'box' : 'hopper');
  const LEN = { loco: 22, hopper: 17.5, box: 17.5 }, GAP = 1.2;
  root.add(trainG);
  const TI = { loco: inst('proto_loco', 2), hopper: inst('proto_hopper', KINDS.filter(k => k === 'hopper').length), box: inst('proto_box', KINDS.filter(k => k === 'box').length) };
  Object.values(TI).forEach(I => I && I.ims.forEach(im => { root.remove(im); trainG.add(im); }));
  const CARS = []; { let off = 0; const n = { loco: 0, hopper: 0, box: 0 }; KINDS.forEach(k => { CARS.push({ k, i: n[k]++, off: off + LEN[k] / 2, L: LEN[k] }); off += LEN[k] + GAP; }); }
  const TRAIN_LEN = CARS[CARS.length - 1].off + 9, VT = 15;
  const pa = {}, pb = {};
  function placeTrain(head) { for (const c of CARS) { const I = TI[c.k]; if (!I) continue; const s = head - c.off;
      if (s - c.L / 2 < 0 || s + c.L / 2 > RP.len) { I.hide(c.i); continue; }
      RP.at(s + c.L * 0.32, pa); RP.at(s - c.L * 0.32, pb); I.set(c.i, (pa.x + pb.x) / 2, (pa.y + pb.y) / 2, (pa.z + pb.z) / 2, Math.atan2(pa.x - pb.x, pa.z - pb.z), 1, -Math.atan2(pa.y - pb.y, c.L * 0.64)); }
    Object.values(TI).forEach(I => I && I.done()); }
  // semis: three each way in the outer lanes
  const semis = inst('proto_semi', 6), SEMI = [];
  if (semis && HWY.length > 2) { const fwdP = path(HWY), revP = path([...HWY].reverse());
    for (let j = 0; j < 6; j++) SEMI.push({ P: j < 3 ? fwdP : revP, s: (j % 3) / 3 * fwdP.len + j * 37, v: 19 + (j % 3) * 2, side: 3.6 }); }
  const so = {};
  function tickSemis(dt) { if (!semis) return; SEMI.forEach((T, j) => { if (!reduced) T.s = (T.s + T.v * dt) % T.P.len; T.P.at(T.s, so); const x = so.x - so.dz * T.side, z = so.z + so.dx * T.side;
    const edge = Math.min(T.s, T.P.len - T.s); if (edge < 12) { semis.hide(j); return; } semis.set(j, x, groundY(x, z) + 0.08, z, Math.atan2(so.dx, so.dz)); }); semis.done(); }

  // ---------- the quiet touch: now and then a life-size roadrunner (the bird of the Texas plains) walks along the west barn wall, stops at the door,
  // looks round and goes on into the grass. No card, no tour stop, no camera move: it is there for whoever spots it (Adam 13-11-2026). ----------
  const J = INFO.joke || null; let rrTick = () => {}; const RR = { t: 0 };
  if (J && part.proto_rr_body) try {
    const g = new THREE.Group(), RRS = 1 / 3;   // the proto is drawn 3x life size: this brings it to life size (about 55 cm nose to tail)
    const body = kid('proto_rr_body', g), legL = kid('proto_rr_legl', g), legR = kid('proto_rr_legr', g); g.scale.setScalar(RRS); root.add(g);
    const HIP = 0.27 * 3; if (legL) legL.position.set(-0.05 * 3, HIP, 0); if (legR) legR.position.set(0.05 * 3, HIP, 0);
    const door = new THREE.Vector3(...J.door), u = new THREE.Vector3(Math.sin(J.inward + Math.PI), 0, Math.cos(J.inward + Math.PI)), w = new THREE.Vector3(u.z, 0, -u.x);
    // it walks on whatever is on top: the concrete apron and drives (small meshes, raycast) or the ground (height grid)
    const slabM = []; ['drive', 'site'].forEach(n => part[n] && part[n].traverse(o => { if (o.isMesh) slabM.push(o); })); const ray = new THREE.Raycaster(), dn = new THREE.Vector3(0, -1, 0);
    const surf = (x, z) => { let y = groundY(x, z); if (slabM.length) { ray.set(model.localToWorld(new THREE.Vector3(x, 60, z)), dn); const h = ray.intersectObjects(slabM, false)[0]; if (h) y = Math.max(y, model.worldToLocal(h.point.clone()).y); } return y + 0.01; };
    const SY = new Map(), surfC = (x, z) => { const k = Math.round(x * 2) + ',' + Math.round(z * 2); if (!SY.has(k)) SY.set(k, surf(Math.round(x * 2) / 2, Math.round(z * 2) / 2)); return SY.get(k); };
    const P = (a, b) => { const q = door.clone().addScaledVector(u, a).addScaledVector(w, b); q.y = surfC(q.x, q.z); return q; };
    const A0 = P(5, -16), A1 = P(2.2, -2.5), A2 = P(2.6, 2.5), A3 = P(7, 17);
    // walk in, pause and look, a few steps, pause, walk off; then gone for half a minute
    const SEG = [['w', A0, A1, 6], ['p', A1, A1, 3.2], ['w', A1, A2, 3.4], ['p', A2, A2, 2.2], ['w', A2, A3, 7], ['h', A3, A3, 32]];
    const PER = SEG.reduce((s, x) => s + x[3], 0); RR.t = 2; RR.PER = PER; RR.at = () => [g.position.x, g.position.y, g.position.z]; RR.door = J.door;
    const tmp = new THREE.Vector3(), last = new THREE.Vector3(); let phase = 0, head = Math.atan2(A1.x - A0.x, A1.z - A0.z);
    rrTick = (dt) => { RR.t = reduced ? 9.5 : (RR.t + dt) % PER; let c = RR.t, sg = SEG[0]; for (const x of SEG) { sg = x; if (c < x[3]) break; c -= x[3]; }
      const [kind, a, b, d] = sg, k = c / d; g.visible = kind !== 'h'; if (!g.visible) return;
      let look = 0, walking = kind === 'w';
      if (walking) { tmp.lerpVectors(a, b, k); tmp.y = surfC(tmp.x, tmp.z); head = angTo(head, Math.atan2(b.x - a.x, b.z - a.z), Math.min(1, 5 * dt)); }
      else { tmp.copy(a); look = Math.sin(k * Math.PI * 2.2) * 0.6 * Math.sin(k * Math.PI); }
      g.position.copy(tmp); g.rotation.y = head;
      const step = tmp.distanceTo(last); last.copy(tmp); if (step < 1) phase += step / 0.09 * Math.PI;
      const sw = walking ? 0.5 : 0; if (legL) legL.rotation.x = Math.sin(phase) * sw; if (legR) legR.rotation.x = -Math.sin(phase) * sw;
      if (body) { body.rotation.set(walking ? 0.06 + Math.abs(Math.sin(phase)) * 0.05 : 0, look, 0); body.position.y = walking ? Math.abs(Math.sin(phase)) * 0.03 : 0; } };
  } catch (err) { console.warn('cotton roadrunner', err); }
  // the freight train runs on its own clock, starting with the locomotives already beside the ranch
  const TPER = (RP.len + TRAIN_LEN + 60) / VT, TR = { t: Math.min(TPER * 0.5, (RP.len * 0.45 + TRAIN_LEN * 0.3) / VT) };
  const trainTick = (dt) => { if (!reduced) TR.t = (TR.t + dt) % TPER; placeTrain(VT * TR.t); };
  window.__cotton = { RR, TR, part, root, FX, go: (vv) => X.goView(vv, 0.01),
    screen: (p) => { const vv = model.localToWorld(new THREE.Vector3(...p)).project(X.camera), r = X.renderer.domElement.getBoundingClientRect(); return [r.left + (vv.x + 1) / 2 * r.width, r.top + (1 - vv.y) / 2 * r.height]; } };

  // ---------- card effects ----------
  const pads = INFO.pads || [], padRot = INFO.padRot || [], PW = INFO.padW || 7.4, PD = INFO.padD || 15.2;
  const textSprite = (txt, sub, w = 30) => { const c = document.createElement('canvas'); c.width = 512; c.height = 256; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, toneMapped: false }), s = new THREE.Sprite(m); s.scale.set(w, w / 2, 1); s.renderOrder = 9;
    s.userData.draw = (a, b) => { const x = c.getContext('2d'); x.clearRect(0, 0, 512, 256); x.fillStyle = 'rgba(10,8,6,0.62)'; x.beginPath(); x.roundRect(16, 40, 480, 176, 40); x.fill();
      x.fillStyle = '#ffffff'; x.textAlign = 'center'; let fs = b ? 104 : 72; x.font = '700 ' + fs + 'px Arial, sans-serif'; const tw = x.measureText(a).width; if (tw > 440) { fs = Math.floor(fs * 440 / tw); x.font = '700 ' + fs + 'px Arial, sans-serif'; } x.fillText(a, 256, b ? 150 : 152); if (b) { x.font = '600 36px Arial, sans-serif'; x.fillStyle = '#' + HERO.getHexString(); x.fillText(b, 256, 198); } t.needsUpdate = true; };
    s.userData.draw(txt, sub); return s; };
  // the 48 pads light one by one (a frame of light round each, at floor height), a counter above the barns counts 1 to 48
  FX.ccpads = (c) => { const g = new THREE.Group(), n = pads.length, m = lightM(c.k ?? 2.4), sides = [];
    const bar = new THREE.BoxGeometry(1, 0.14, 1); for (let s = 0; s < 4; s++) { const im = new THREE.InstancedMesh(bar, m, n); im.frustumCulled = false; im.renderOrder = 5; for (let i = 0; i < n; i++) im.setColorAt(i, new THREE.Color(0, 0, 0)); g.add(im); sides.push(im); }
    const pv = new THREE.Vector3(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), col = new THREE.Color(), m4 = new THREE.Matrix4();
    pads.forEach((p, i) => { q.setFromAxisAngle(up, padRot[i] || 0); const ux = new THREE.Vector3(1, 0, 0).applyQuaternion(q), uz = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
      [[ux, PD / 2, 0.25, PW], [ux, -PD / 2, 0.25, PW], [uz, PW / 2, PD, 0.25], [uz, -PW / 2, PD, 0.25]].forEach(([u, o, sx, sz], s) => { pv.set(p[0], p[1] + 0.2, p[2]).addScaledVector(u, o); m4.compose(pv, q, new THREE.Vector3(sx, 1, sz)); sides[s].setMatrixAt(i, m4); }); });
    const ctr = pads.length ? pads.reduce((a, p) => [a[0] + p[0] / n, a[1] + p[1] / n, a[2] + p[2] / n], [0, 0, 0]) : [0, 0, 0];
    const counter = textSprite('0', 'indoor RV pads', 46); counter.position.set(ctr[0], ctr[1] + 46, ctr[2]); g.add(counter); let shownN = -1;
    return { obj: g, mat: m, tick: (t, k) => { let lit = 0; pads.forEach((p, i) => { const a = 1.0 + i * 0.075, b = flash(t, a, 0.2, 1.6) * 0.9 + (t > a ? 0.4 : 0); if (t > a) lit = i + 1; col.setScalar(b * k); sides.forEach(s => s.setColorAt(i, col)); });
      sides.forEach(s => { s.instanceColor.needsUpdate = true; }); if (lit !== shownN) { shownN = lit; counter.userData.draw(String(lit), 'indoor RV pads'); } counter.material.opacity = k; } }; };
  // new water lines (blue) out to every pad, new septic (green) to two drain fields, and a meter glowing at every pad (individually metered)
  const flowU = { uT: { value: 0 } };
  FX.ccutil = (c) => { const g = new THREE.Group(), lines = [];
    const mk = (hex) => new THREE.ShaderMaterial({ uniforms: Object.assign({ uC: { value: new THREE.Color(hex).multiplyScalar(c.k ?? 2.4) }, uK: { value: 0 } }, flowU), transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending,
      vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform vec3 uC; uniform float uT, uK; varying vec2 vU; void main(){ float d = 0.55 + 0.45 * smoothstep(0.35, 0.0, abs(fract(vU.x * 30.0 - uT * 0.9) - 0.5)); gl_FragColor = vec4(uC * d, uK * d); }' });
    const mW = mk('#39a8ff'), mS = mk('#45e07a');
    const tube = (pts3, m, r = 0.55) => { if (pts3.length < 2) return; const curve = new THREE.CatmullRomCurve3(pts3.map(p => new THREE.Vector3(...p)), false, 'catmullrom', 0.05); const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(8, pts3.length * 8), r, 6, false), m); mesh.renderOrder = 7; g.add(mesh); };
    const gp = (pts) => pts.map(([x, z]) => [x, groundY(x, z) + 0.5, z]);
    const lw = (b, lx, lz) => [b.at[0] + lx * Math.cos(b.f) + lz * Math.sin(b.f), b.at[2] - lx * Math.sin(b.f) + lz * Math.cos(b.f)];
    const DR = INFO.drives || {}; if (DR.office) tube(gp(DR.office), mW); if (DR.gap) tube(gp(DR.gap), mW);
    for (const b of Object.values(BI)) { const y = b.at[1] + 0.3;
      for (const sx of [-1, 1]) { const x0 = sx * (b.w / 2 - 1.5); tube([lw(b, x0, -b.l / 2 + 1), lw(b, x0, b.l / 2 - 1)].map(([x, z]) => [x, y, z]), mW, 0.45); }
      tube([lw(b, -(b.w / 2 - 1.5), b.l / 2 - 1), lw(b, b.w / 2 - 1.5, b.l / 2 - 1)].map(([x, z]) => [x, y, z]), mW, 0.45);
      tube([lw(b, -(b.w / 2 - 1.5), -b.l / 2 + 1), lw(b, b.w / 2 - 1.5, -b.l / 2 + 1)].map(([x, z]) => [x, y, z]), mW, 0.45);
      // septic: from the north wall out to a drain field 30 m beyond the north door, five lateral lines
      const t0 = lw(b, 0, -b.l / 2 + 1), t1 = lw(b, 0, -b.l / 2 - 26); tube([[t0[0], y - 0.1, t0[1]], ...gp([lw(b, 0, -b.l / 2 - 6), t1])], mS);
      for (let k = -2; k <= 2; k++) tube(gp([lw(b, k * 4 - 12, -b.l / 2 - 26 - 6), lw(b, k * 4 - 12, -b.l / 2 - 26 - 30)]), mS, 0.45);
      tube(gp([lw(b, -20, -b.l / 2 - 26 - 6), lw(b, -4, -b.l / 2 - 26 - 6)]), mS, 0.45); tube(gp([t1, lw(b, -12, -b.l / 2 - 32)]), mS, 0.45); }
    const meters = INFO.meters || [], cap = new THREE.BoxGeometry(0.9, 0.9, 0.9), mOn = new THREE.MeshBasicMaterial({ color: new THREE.Color('#3dff7a').multiplyScalar(3), toneMapped: false, transparent: true });
    const im = new THREE.InstancedMesh(cap, mOn, Math.max(1, meters.length)); im.frustumCulled = false; const m4 = new THREE.Matrix4(); meters.forEach((p, i) => im.setMatrixAt(i, m4.makeTranslation(p[0], p[1] + 0.6, p[2]))); g.add(im); im.count = 0;
    return { obj: g, mat: mW, tick: (t, k, pulse) => { mW.uniforms.uK.value = k * cl(t * 1.2); mS.uniforms.uK.value = k * cl(t * 1.2 - 0.8); im.count = Math.min(meters.length, Math.max(0, Math.floor((t - 1.8) * 24))); mOn.opacity = k * (0.75 + 0.25 * (pulse ?? 1)); } }; };
  // Room to grow: six new lanes draw in, 452 ghost pads sweep north across the field, RVs arrive on one pad in three, then the restaurant, the public
  // laundry and a fenced dog park rise in as small real buildings beside the new rows (all concept, from the listing's own words).
  // Built the first time the card opens, not at load (13-11-2026). Lanes follow the ground every 4 m and sit above the roads, pads and the ghost light
  // stand clear of each other, so nothing flickers.
  FX.ccgrow = (c) => { const g = new THREE.Group(); let real = null;
    return { obj: g, mat: null, tick: (t, k, pulse) => { if (!real) real = buildGrow(c, g); real(t, k, pulse); } }; };
  function buildGrow(c, g) { const all = INFO.grow || [], rots = INFO.growRot || [], N = all.length, GK = c.k ?? 1.44;
    const off = (m, f = -4, u = -16) => Object.assign(m, { polygonOffset: true, polygonOffsetFactor: f, polygonOffsetUnits: u });
    // lanes: gravel ribbons 9 m wide, 0.3 m over the ground at every 4 m, drawn in from the barn end
    const grav = off(new THREE.MeshStandardMaterial({ color: '#d9c6a6', roughness: 0.95 }));
    const lanes = ((INFO.life || {}).growLanes || []).map(l => { const a = l[0], b = l[l.length - 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(2, Math.ceil(L / 4) + 1);
      const dx = (b[0] - a[0]) / L, dz = (b[1] - a[1]) / L, pos = [], idx = [];
      for (let i = 0; i < n; i++) { const f = i / (n - 1), x = a[0] + (b[0] - a[0]) * f, z = a[1] + (b[1] - a[1]) * f;
        for (const sg of [-1, 1]) { const px = x - dz * 4.5 * sg, pz = z + dx * 4.5 * sg; pos.push(px, groundY(px, pz) + 0.3, pz); }
        if (i) { const q = (i - 1) * 2; idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); } }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, grav); m.receiveShadow = true; m.renderOrder = 3; m.frustumCulled = false; g.add(m); return { m, n: idx.length }; });
    // pads (own polygon-offset copy of the pad material, so a pad end on a slope never fights the ground) and the ghost light just above each
    const padGeo = []; if (part.proto_pad) part.proto_pad.traverse(o => { if (o.isMesh) { const gg = o.geometry.clone(); o.updateMatrix(); gg.applyMatrix4(o.matrix); gg.translate(0, -PY, 0); padGeo.push([gg, off(o.material.clone(), -3, -10)]); } });
    let padTop = 0.2; padGeo.forEach(([gg]) => { gg.computeBoundingBox(); padTop = Math.max(padTop, gg.boundingBox.max.y); });
    const padI = padGeo.map(([gg, mm]) => { const im = new THREE.InstancedMesh(gg, mm, N); im.receiveShadow = true; im.frustumCulled = false; im.renderOrder = 4; g.add(im); return im; });
    const rvGeo = []; if (part.proto_rv) part.proto_rv.traverse(o => { if (o.isMesh) { const gg = o.geometry.clone(); o.updateMatrix(); gg.applyMatrix4(o.matrix); gg.translate(0, -PY, 0); rvGeo.push([gg, o.material]); } });
    const RVN = Math.ceil(N / 3), rvI = rvGeo.map(([gg, mm]) => { const im = new THREE.InstancedMesh(gg, mm, RVN); im.castShadow = true; im.frustumCulled = false; g.add(im); return im; });
    const ghostM = lightM(GK), gGeo = new THREE.BoxGeometry(8.9, 0.3, 14.9); gGeo.translate(0, 0.15, 0);
    const ghost = new THREE.InstancedMesh(gGeo, ghostM, N); ghost.frustumCulled = false; ghost.renderOrder = 6; for (let i = 0; i < N; i++) ghost.setColorAt(i, new THREE.Color(0, 0, 0)); g.add(ghost);
    const GY = 0.05 + padTop + 0.12;   // ghost floor: 12 cm over the top of the finished pad
    // the amenities: small real buildings and a fenced dog park, each rising out of the ground with a soft outline that marks it as concept
    const AM = INFO.amen || {}, amen = [], edgeM = new THREE.LineBasicMaterial({ color: new THREE.Color('#ffffff').multiplyScalar(1.98), toneMapped: false, transparent: true, opacity: 0 });
    const std = (hex, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: hex, roughness: 0.85 }, o));
    const M = { wall: std('#e8dcc6'), wall2: std('#c9b18e'), roof: std('#7a4a30', { roughness: 0.7 }), flat: std('#8e8a82'), trim: std('#4a3a2e'), slab: std('#bfb5a4'),
      glass: std('#2a2a2a', { emissive: new THREE.Color('#ffcf8a'), emissiveIntensity: 0.55, roughness: 0.3 }), hero: std('#' + HERO.getHexString()), wood: std('#8a6a48'),
      turf: off(std('#6f8f3c'), -2, -8), fence: std('#5e5244', { metalness: 0.2, roughness: 0.6 }) };
    const box = (grp, m, w, h, d, x = 0, y = 0, z = 0, ry = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y + h / 2, z); o.rotation.y = ry; o.castShadow = o.receiveShadow = true; grp.add(o); return o; };
    const gable = (w, d, rise) => { const v = [[-w / 2, 0, -d / 2], [w / 2, 0, -d / 2], [w / 2, 0, d / 2], [-w / 2, 0, d / 2], [-w / 2, rise, 0], [w / 2, rise, 0]], f = [[0, 4, 5], [0, 5, 1], [3, 2, 5], [3, 5, 4], [0, 3, 4], [1, 5, 2]], pos = [];
      f.forEach(tr => tr.forEach(i => pos.push(...v[i]))); const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.computeVertexNormals(); return geo; };
    const outline = (grp, w, h, d, y = 0) => { const e = new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)); e.translate(0, y + h / 2, 0); const l = new THREE.LineSegments(e, edgeM); l.renderOrder = 7; grp.add(l); };
    const building = (grp, w, d, h, kind) => { box(grp, M.slab, w + 2, 1.4, d + 2, 0, -1.1); box(grp, kind === 'r' ? M.wall : M.wall2, w, h, d);
      if (kind === 'r') { const r = new THREE.Mesh(gable(w + 1.4, d + 1.4, 3.2), M.roof); r.position.y = h; r.castShadow = true; grp.add(r); }
      else { box(grp, M.flat, w + 0.4, 0.4, d + 0.4, 0, h); box(grp, M.hero, w * 0.55, 0.9, 0.2, 0, h - 1.4, d / 2 + 0.12); }
      for (const sz of [-1, 1]) box(grp, M.glass, w * 0.7, 1.5, 0.2, 0, h * 0.42, sz * (d / 2 + 0.06));
      box(grp, M.trim, 2.2, 2.6, 0.25, w * 0.3, 0, d / 2 + 0.08);
      outline(grp, w + 0.2, h + (kind === 'r' ? 3.2 : 0.4), d + 0.2); };
    const parts = [['restaurant', 'Restaurant', 'r'], ['laundry', 'Public laundry', 'l'], ['dogpark', 'Dog park', 'd']];
    parts.forEach(([key, label, kind], j) => { const p = AM[key]; if (!p) return; const grp = new THREE.Group(), y0 = groundY(p[0], p[2], p[1]); grp.position.set(p[0], y0, p[2]);
      let top = 6;
      if (kind === 'r') { building(grp, 24, 15, 5.2, 'r'); top = 8.4;
        box(grp, M.slab, 16, 0.3, 7, -2, 0, 11.2); box(grp, M.wood, 16, 0.3, 6, -2, 3.4, 11); for (const x of [-9.6, -2, 5.6]) box(grp, M.wood, 0.3, 3.4, 0.3, x, 0, 13.8);
        for (const x of [-7, -2, 3]) { box(grp, M.wood, 2.4, 0.12, 1.1, x, 0.75, 11.4); for (const dz of [-0.9, 0.9]) box(grp, M.wood, 2.4, 0.1, 0.35, x, 0.45, 11.4 + dz); } }
      else if (kind === 'l') { building(grp, 15, 10, 4.2, 'l'); top = 4.6; }
      else { const W = 34, D = 26; box(grp, M.turf, W, 0.18, D, 0, 0.02);
        const posts = [], rails = [], gate = 3;
        const side = (x0, z0, x1, z1, gap) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(L / 2.5), ry = Math.atan2(x1 - x0, z1 - z0);
          for (let i = 0; i <= n; i++) { const f = i / n, x = x0 + (x1 - x0) * f, z = z0 + (z1 - z0) * f; if (gap && Math.abs(f - 0.5) * L < gate / 2) continue; posts.push([x, z]); }
          const segs = gap ? [[0, 0.5 - gate / 2 / L], [0.5 + gate / 2 / L, 1]] : [[0, 1]];
          for (const [a, b] of segs) { const xm = x0 + (x1 - x0) * (a + b) / 2, zm = z0 + (z1 - z0) * (a + b) / 2; for (const y of [0.45, 1.0]) rails.push([xm, y, zm, (b - a) * L, ry]); } };
        side(-W / 2, -D / 2, W / 2, -D / 2); side(W / 2, -D / 2, W / 2, D / 2); side(W / 2, D / 2, -W / 2, D / 2, true); side(-W / 2, D / 2, -W / 2, -D / 2);
        const pm = new THREE.InstancedMesh(new THREE.BoxGeometry(0.24, 1.3, 0.24), M.fence, posts.length), m4 = new THREE.Matrix4(); posts.forEach(([x, z], i) => pm.setMatrixAt(i, m4.makeTranslation(x, 0.62, z))); pm.castShadow = true; grp.add(pm);
        rails.forEach(([x, y, z, L, ry]) => { const r = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, L), M.fence); r.position.set(x, y, z); r.rotation.y = ry; grp.add(r); });
        box(grp, M.wood, 4, 0.12, 1.4, -6, 0.6, -2, 0.4); box(grp, M.wood, 0.25, 0.9, 0.25, -6, 0, -2); box(grp, M.wood, 3.2, 0.25, 1.2, 7, 0.45, 5, 0); box(grp, M.wood, 1.6, 0.8, 1.2, 7, 0, 5);
        for (const [x, z] of [[-12, 8], [-14, 8]]) box(grp, M.wood, 1.8, 0.1, 0.5, x, 0.45, z);
        box(grp, M.wood, 5, 0.25, 4, 11, 2.6, -7); for (const [x, z] of [[9, -8.8], [13, -8.8], [9, -5.2], [13, -5.2]]) box(grp, M.wood, 0.2, 2.6, 0.2, x, 0, z);
        const dogs = []; for (let i = 0; i < 2; i++) { const d0 = kid('proto_dog', grp); if (d0) dogs.push(d0); }
        grp.userData.dogs = dogs; outline(grp, W, 1.3, D); top = 1.4; }
      const s = textSprite(label, 'concept', 18); s.position.set(0, top + 8, 0); s.material.opacity = 0; grp.add(s); grp.visible = false; g.add(grp);
      amen.push({ grp, s, kind, t0: 6.2 + j * 0.6 }); });
    // sweep order: the rows south to north, a little east to west in each row
    const tA = all.map((p, i) => 1.3 + (i / N) * 4.2 + ((p[0] + 300) / 600) * 0.6);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), pv = new THREE.Vector3(), sv = new THREE.Vector3(), col = new THREE.Color();
    return (t) => {
      lanes.forEach((l, i) => { const f = sm((t - 0.2 - i * 0.25) / 1.2); l.m.visible = f > 0; l.m.geometry.setDrawRange(0, Math.floor(l.n * f / 6) * 6); });
      for (let i = 0; i < N; i++) { const p = all[i], a = tA[i], f = cl((t - a) / 0.5), b = back(f); q.setFromAxisAngle(up, rots[i] || 0);
        m4.compose(pv.set(p[0], p[1] - 0.5 + 0.55 * b, p[2]), q, sv.setScalar(f > 0 ? 1 : 1e-4)); padI.forEach(im => im.setMatrixAt(i, m4));
        const gb = flash(t, a, 0.3, 1.4) * 0.9 + (t > a ? 0.045 : 0); m4.compose(pv.set(p[0], p[1] + GY, p[2]), q, sv.setScalar(gb > 0.004 ? 1 : 1e-4)); ghost.setMatrixAt(i, m4); ghost.setColorAt(i, col.setScalar(gb)); }
      padI.forEach(im => { im.instanceMatrix.needsUpdate = true; }); ghost.instanceMatrix.needsUpdate = true; ghost.instanceColor.needsUpdate = true;
      for (let j = 0; j < RVN; j++) { const i = j * 3, p = all[i]; if (!p) continue; const a = tA[i] + 2.6 + (j % 7) * 0.12, f = cl((t - a) / 0.8), r = rots[i] || 0, fwd = pv.set(Math.sin(r), 0, Math.cos(r));
        const o = (1 - sm(f)) * 16, fx = fwd.x, fz = fwd.z; m4.compose(pv.set(p[0] + fx * o, p[1] + 0.12, p[2] + fz * o), q.setFromAxisAngle(up, r), sv.setScalar(f > 0 ? 1 : 1e-4)); rvI.forEach(im => im.setMatrixAt(j, m4)); }
      rvI.forEach(im => { im.instanceMatrix.needsUpdate = true; });
      let eo = 0; amen.forEach(A2 => { const f = cl((t - A2.t0) / 1.4), e = back(f); A2.grp.visible = f > 0; A2.grp.scale.set(1, Math.max(e, 1e-3), 1); A2.s.material.opacity = sm((t - A2.t0 - 0.8) / 0.6);
        eo = Math.max(eo, f > 0 ? 0.3 + 0.6 * flash(t, A2.t0, 1.4, 1.2) : 0);
        const dg = A2.grp.userData.dogs; if (dg && f >= 1) dg.forEach((d0, n) => { const a = clock * (n ? 0.55 : 0.4) + n * 2.5, rr = n ? 6 : 9; d0.position.set(Math.cos(a) * rr, 0, Math.sin(a) * rr * 0.7);
          d0.rotation.set(0, Math.atan2(-Math.sin(a), 0.7 * Math.cos(a)), 0); }); });
      edgeM.opacity = eo; }; }

  // ---------- every frame ----------
  let clock = 0;
  function tick(dt, state = {}) { dt = Math.max(0, Math.min(0.1, dt || 0)); base.tick(dt, state); clock += dt; flowU.uT.value = clock;
    trainTick(dt); rrTick(dt); tickRoofs(dt, state.sel); tickSemis(dt); PEOPLE.tick(dt, clock);
    if (dog && !reduced) dog.scale.set(1, 1 + Math.sin(clock * 1.6) * 0.03, 1);
    ribU.uT.value = clock; ribU.uK.value = 1.1 + 0.6 * (base.dusk ? base.dusk() : 0); }
  // compile every shader now, off the main thread where the browser allows it (KHR_parallel_shader_compile), so the first frame does not freeze
  try { if (X.renderer.compileAsync) await Promise.race([X.renderer.compileAsync(X.scene, X.camera), new Promise(r => setTimeout(r, 6000))]); } catch (err) { console.warn('compile', err); }
  return { fx: FX, tick, dusk: base.dusk };
}
