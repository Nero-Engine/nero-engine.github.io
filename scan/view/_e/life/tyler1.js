// We RV Champions Of Tyler life layer (tyler1, 13-11-2026). Copied from the tincup1 pattern (life1 underneath: carts on the gravel loop, cars
// on Highway 64 following the ground, lamps, sunset, Find your site; library people who walk; the border ribbon; ground grain; lanes and pads
// drawn in front of the land; tap a thing to open its card) with this park's own pieces:
// - the joke, the park's own name: "Champions". A kid runs along the pool deck and does a huge cannonball. The splash soaks a dad dozing on
//   a sun lounger. He sits up, dripping, shakes himself... and holds up a scorecard: 10. The Locals stop flies to the pool.
// - the office roof lifts on the office card: the turquoise camp store, the counter, the guest room
// - the pool shimmers, and lights up turquoise at sunset
// - card effects: typads (the 50 pads light in a wave from the entrance, the two pull-throughs stay brightest), tyutil (water and sewer
//   lines flow under the lanes), tygrow (Room to grow: a new lane draws in, ghost pads rise on the open lawn, RVs back in). No halo rings.
// It moves in the web viewer only. The AR file stays a still model.
import { initPeople } from './people1.js?v=1';
let THREE;

export async function init(X) {
  THREE = X.THREE;
  const v = new URL(import.meta.url).searchParams.get('l1');
  const SC = X.SC, INFO = X.INFO;
  const base = await (await import('./life1.js' + (v ? '?v=' + v : ''))).init(X);
  const { model, part, MATS, D, NV } = X;
  const reduced = !!NV.reduced, HERO = new THREE.Color(D.theme.hero), PY = (INFO.protoAt || [0, -8, 0])[1];
  const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), sm = (x) => { x = cl(x); return x * x * (3 - 2 * x); };
  const back = (k) => { if (k <= 0) return 0; if (k >= 1) return 1; const c = 1.7, x = k - 1; return 1 + (c + 1) * x * x * x + c * x * x; };
  const flash = (t, a, d, decay = 2.2) => t <= a ? 0 : t < a + d ? (t - a) / d : Math.exp(-(t - a - d) * decay);
  const FX = Object.assign({}, base.fx);
  const root = new THREE.Group(); root.name = 'tyler_life'; model.add(root);
  const kid = (name, parent = root) => { if (!part[name]) return null; const g = new THREE.Group(), inner = part[name].clone(true); inner.visible = true; inner.position.set(0, -PY, 0); g.add(inner);
    g.traverse(o => { if (o.isMesh) o.castShadow = true; }); parent.add(g); return g; };
  const lightM = (k, o = {}) => new THREE.MeshBasicMaterial(Object.assign({ color: new THREE.Color('#fff4dc').multiplyScalar(k), toneMapped: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }, o));

  const groundY = base.groundY || X.groundY;   // life1's height grid, built once (a raycast per point froze the page for seconds, 13-11-2026)

  // RV roofs and white sides: the sun sheen down 20% (as Tin Cup)
  MATS.forEach(m => { if (m.userData.p !== 'rvs') return; const l = (m.color.r + m.color.g + m.color.b) / 3; if (l < 0.6 && !m.map) return;
    m.color.multiplyScalar(0.84); if (m.userData.c0) m.userData.c0.copy(m.color); m.roughness = Math.max(m.roughness, 0.45); m.envMapIntensity = (m.envMapIntensity ?? 1) * 0.8; if (m.userData.lum) m.userData.lum *= 0.84; });

  const PEOPLE = initPeople(X, root);

  // ---------- the land for sale: a strong ribbon of light about 10 m wide round the 10.51 acres, always on, stronger at sunset (Adam, 13-11-2026) ----------
  const ribU = { uK: { value: 1 }, uT: { value: 0 } }, HG = HERO.clone();
  try { if (part.border) { const bm = new THREE.MeshBasicMaterial({ color: HG.clone().multiplyScalar(2.8), toneMapped: false }); part.border.traverse(o => { if (o.isMesh) { o.material = bm; o.castShadow = false; } }); }
    const BP = INFO.border || []; if (BP.length > 4) { const W2 = 10, pos = [], uv = [], idx = [];
      for (let i = 0; i < BP.length; i++) { const a = BP[Math.max(0, i - 1)], b = BP[Math.min(BP.length - 1, i + 1)], p = BP[i]; let dx = b[0] - a[0], dz = b[2] - a[2]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
        pos.push(p[0] - dz * W2, p[1] + 0.15, p[2] + dx * W2, p[0] + dz * W2, p[1] + 0.15, p[2] - dx * W2); uv.push(0, i, 1, i); if (i) { const k = (i - 1) * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
      const m = new THREE.ShaderMaterial({ uniforms: Object.assign(ribU, { uC: { value: new THREE.Vector3(HG.r, HG.g, HG.b) } }), transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
        vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: 'uniform float uK, uT; uniform vec3 uC; varying vec2 vU; void main(){ float d = abs(vU.x - 0.5) * 2.0; float a = exp(-d * d * 5.0) * 0.6 + exp(-d * d * 40.0) * 0.65; float run = 0.85 + 0.15 * sin(vU.y * 0.25 - uT * 2.0); gl_FragColor = vec4(mix(uC * 0.9, mix(uC, vec3(1.0), 0.45), exp(-d * d * 60.0)), clamp(a * uK * run, 0.0, 0.95)); }' });
      const rib = new THREE.Mesh(g, m); rib.name = 'borderGlow'; rib.renderOrder = 6; rib.frustumCulled = false; model.add(rib); } } catch (err) { console.warn('border', err); }

  // ---------- a fine grain on the ground ----------
  try { if (part.ground) { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), id = x.createImageData(256, 256);
      const H = new Float32Array(256 * 256); let s = 7; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
      for (let o = 0; o < 6; o++) { const f = 2 ** (o + 2), amp = 1 / (o + 1.2), G = []; for (let i = 0; i < f * f; i++) G.push(r());
        for (let j = 0; j < 256; j++) for (let i = 0; i < 256; i++) { const u = i / 256 * f, w = j / 256 * f, i0 = Math.floor(u), j0 = Math.floor(w), a = u - i0, b = w - j0, Pq = (p, q) => G[(q % f) * f + (p % f)];
          const aa = a * a * (3 - 2 * a), bb = b * b * (3 - 2 * b); H[j * 256 + i] += amp * ((Pq(i0, j0) * (1 - aa) + Pq(i0 + 1, j0) * aa) * (1 - bb) + (Pq(i0, j0 + 1) * (1 - aa) + Pq(i0 + 1, j0 + 1) * aa) * bb); } }
      for (let j = 0; j < 256; j++) for (let i = 0; i < 256; i++) { const k = (j * 256 + i) * 4, dx = H[j * 256 + (i + 1) % 256] - H[j * 256 + (i + 255) % 256], dz = H[((j + 1) % 256) * 256 + i] - H[((j + 255) % 256) * 256 + i];
        const nn = new THREE.Vector3(-dx * 3, -dz * 3, 1).normalize(); id.data[k] = (nn.x * 0.5 + 0.5) * 255; id.data[k + 1] = (nn.y * 0.5 + 0.5) * 255; id.data[k + 2] = (nn.z * 0.5 + 0.5) * 255; id.data[k + 3] = 255; }
      x.putImageData(id, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(150, 150); t.anisotropy = 4;
      part.ground.traverse(o => { if (o.isMesh && o.material && o.material.map) { o.material.normalMap = t; o.material.normalScale = new THREE.Vector2(0.35, 0.35); o.material.roughness = 1; o.material.metalness = 0; o.material.envMapIntensity = Math.min(o.material.envMapIntensity ?? 1, 0.35); o.material.needsUpdate = true; } }); } } catch (err) { console.warn('grain', err); }

  // gravel lanes drawn in front of the ground, and tap a thing to open its card: in life1.js since 13-11-2026 (scene.life.front, scene.life.tap)

  // ---------- the office roof lifts on the office card: up and to the west, away from the porch, a gentle float while open ----------
  const OF = INFO.office || null, roofCard = (SC.life && SC.life.roofCard) || 'office'; let roofE = 0, clock = 0;
  function tickRoof(dt, sel) { if (!OF || !part.office_roof) return; const want = sel && sel.id === roofCard ? 1 : 0;
    roofE += (want - roofE) * Math.min(1, (want ? 1.6 : 3) * dt); const e = sm(roofE);
    const up = 8 * Math.sin(Math.PI * 0.5 * Math.min(1, e * 1.3)) + (e > 0.99 && !reduced ? Math.sin(clock * 1.4) * 0.2 : 0);
    part.office_roof.position.set(-7 * e, up, 0);
    part.office_roof.traverse(m => { if (m.isMesh) m.castShadow = e < 0.05; }); }

  // ---------- the pool: a soft shimmer by day, turquoise light at sunset ----------
  const poolM = MATS.filter(m => m.name === 'pool_water'), poolC0 = poolM.map(m => m.emissiveIntensity);
  function tickPool(t) { const dk = base.dusk ? base.dusk() : 0; poolM.forEach((m, i) => { m.emissiveIntensity = poolC0[i] * (1 + 0.18 * Math.sin(t * 1.7) * (reduced ? 0 : 1)) + dk * 1.6; }); }

  // ---------- the joke: Champions ----------
  const J = INFO.joke || null, JK = { c: 0, on: false };
  if (J && part.proto_kid && part.proto_dad) try {
    const run0 = new THREE.Vector3(...J.run0), run1 = new THREE.Vector3(...J.run1), spl = new THREE.Vector3(...J.splash), dadP = new THREE.Vector3(...J.dad);
    const runRy = Math.atan2(run1.x - run0.x, run1.z - run0.z), jumpRy = Math.atan2(spl.x - run1.x, spl.z - run1.z);
    const kidG = kid('proto_kid'), dadPivot = new THREE.Group(); dadPivot.position.copy(dadP); dadPivot.rotation.y = J.dadRy; root.add(dadPivot);
    const dad = kid('proto_dad', dadPivot); dad.position.set(0, -0.36, 0);
    // the scorecard: a white card with a big 10, on a little handle, printed both sides
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 180; const cx = cv.getContext('2d'); cx.fillStyle = '#ffffff'; cx.fillRect(0, 0, 256, 180);
    cx.strokeStyle = '#f07a1e'; cx.lineWidth = 10; cx.strokeRect(6, 6, 244, 168); cx.fillStyle = '#17324d'; cx.font = 'bold 130px Arial'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('10', 128, 98);
    const ct = new THREE.CanvasTexture(cv); ct.colorSpace = THREE.SRGBColorSpace; ct.anisotropy = 4;
    const cardG = new THREE.Group(), cm = new THREE.MeshBasicMaterial({ map: ct, toneMapped: false });
    const f1 = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.44), cm), f2 = f1.clone(); f2.rotation.y = Math.PI; f1.position.z = 0.006; f2.position.z = -0.006; cardG.add(f1, f2);
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.35, 5), new THREE.MeshStandardMaterial({ color: '#b08d5a' })); stick.position.y = -0.38; cardG.add(stick); dadPivot.add(cardG);
    // the splash: white water drops thrown out in arcs (some reach the dad), a burst of foam on the water
    const NDR = reduced ? 0 : 46, dropM = new THREE.MeshStandardMaterial({ color: '#e9fbff', roughness: 0.1, transparent: true, opacity: 0.9 }), drops = new THREE.InstancedMesh(new THREE.SphereGeometry(0.11, 6, 4), dropM, Math.max(1, NDR));
    drops.frustumCulled = false; root.add(drops); const DR = []; let ss = 11; const rr = () => ((ss = (ss * 16807) % 2147483647) / 2147483647);
    const toDad = Math.atan2(dadP.x - spl.x, dadP.z - spl.z), dDad = Math.hypot(dadP.x - spl.x, dadP.z - spl.z);
    for (let i = 0; i < NDR; i++) { const atDad = i < 14, a = atDad ? toDad + (rr() - 0.5) * 0.5 : rr() * Math.PI * 2, d = atDad ? dDad * (0.85 + rr() * 0.3) : 1 + rr() * 3.2; DR.push({ a, d, h: 1.6 + rr() * 2.2 + (atDad ? 0.8 : 0), dl: rr() * 0.12 }); }
    const foam = new THREE.Mesh(new THREE.CircleGeometry(1, 24), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false })); foam.rotation.x = -Math.PI / 2; foam.position.copy(spl).add(new THREE.Vector3(0, 0.03, 0)); root.add(foam);
    const m4 = new THREE.Matrix4(), q0 = new THREE.Quaternion(), sv = new THREE.Vector3(), pv = new THREE.Vector3();
    // one loop, seconds: stand, run, jump (tucked, a half turn), SPLASH, the water lands on the dad, he sits up and shakes, the card goes up; the kid bobs, climbs out, walks back
    const RUN = 1.0, JUMP = 3.0, HIT = 3.85, SOAK = 4.7, UP = 5.2, CARD = 6.6, DOWN = 11.6, OUT = 11.0, BACK = 12.4, PERIOD = 18;
    JK.view = () => ({ at: [(run0.x + dadP.x) / 2, J.deckY + 1, (run0.z + spl.z) / 2 + 1.5], dist: innerWidth < 760 ? 44 : 32, el: 0.62, az: Math.PI * 0.92 });
    JK.close = () => ({ at: [dadP.x, dadP.y + 0.8, dadP.z], dist: 7.5, el: 0.3, az: Math.PI * 0.15 });
    JK.on = true; JK.set = (c) => { JK.c = c; };
    JK.tick = (dt) => { JK.c = (JK.c + dt) % PERIOD; const c = reduced ? CARD + 1 : JK.c;
      // the kid
      let kp = run0.clone(), ky = runRy, kx = 0, ks = 1, kv = true;
      if (c < RUN) { kp.copy(run0); }
      else if (c < JUMP) { const u = sm((c - RUN) / (JUMP - RUN)); kp.lerpVectors(run0, run1, u); kp.y += Math.abs(Math.sin(c * 11)) * 0.12; }
      else if (c < HIT) { const u = (c - JUMP) / (HIT - JUMP); kp.lerpVectors(run1, spl, u); kp.y += 2.2 * 4 * u * (1 - u) - u * 0.9; ky = jumpRy; kx = -u * Math.PI * 0.9; ks = 1 - 0.3 * Math.sin(u * Math.PI); }
      else if (c < 6.0) { kv = false; }
      else if (c < OUT) { kp.copy(spl).add(new THREE.Vector3(Math.sin(c * 0.6) * 0.6, -0.95 + Math.sin(c * 3) * 0.05, 0)); ky = jumpRy + Math.PI; }
      else if (c < BACK) { const u = sm((c - OUT) / (BACK - OUT)); kp.lerpVectors(spl.clone().add(new THREE.Vector3(0, -0.95, 0)), run1, u); kp.y = J.deckY - 0.95 * (1 - u); ky = jumpRy + Math.PI; }
      else if (c < PERIOD - 0.6) { const u = sm((c - BACK) / (PERIOD - 0.6 - BACK)); kp.lerpVectors(run1, run0, u); kp.y += Math.abs(Math.sin(c * 7)) * 0.05; ky = runRy + Math.PI; }
      else { kp.copy(run0); ky = runRy; }
      kidG.visible = kv; kidG.position.copy(kp); kidG.rotation.set(kx, ky, 0, 'YXZ'); kidG.scale.set(1, ks, 1);
      // the splash
      const sp = (c - HIT) / 1.1; drops.visible = sp > 0 && sp < 1.15;
      DR.forEach((o, i) => { const u = cl((sp - o.dl) / 0.95); pv.set(spl.x + Math.sin(o.a) * o.d * u, spl.y + o.h * 4 * u * (1 - u) + (u >= 1 ? -5 : 0), spl.z + Math.cos(o.a) * o.d * u);
        m4.compose(pv, q0, sv.setScalar(u > 0 && u < 1 ? 1 - u * 0.4 : 1e-4)); drops.setMatrixAt(i, m4); }); drops.instanceMatrix.needsUpdate = true;
      const fu = (c - HIT) / 2.2; foam.visible = fu > 0 && fu < 1; foam.scale.setScalar(0.6 + 2.6 * sm(fu)); foam.material.opacity = 0.85 * (1 - fu);
      // the dad: lying back dozing, the water lands, he jolts up, shakes, holds up the 10, lies back
      let lie = -1.05, wig = 0, card = 0;
      if (c > SOAK && c < UP) lie = -1.05 + 1.05 * sm((c - SOAK) / (UP - SOAK));
      else if (c >= UP && c < DOWN + 1.2) { lie = 0; if (c < CARD - 0.4) wig = Math.sin((c - UP) * 26) * 0.12 * (1 - (c - UP) / (CARD - 0.4 - UP)); }
      if (c >= DOWN + 1.2 && c < DOWN + 2.6) lie = -1.05 * sm((c - DOWN - 1.2) / 1.4);
      if (c > CARD && c < DOWN) card = back(cl((c - CARD) / 0.6)); else if (c >= DOWN && c < DOWN + 0.8) card = 1 - sm((c - DOWN) / 0.8);
      dad.rotation.set(lie, 0, wig, 'YXZ');
      cardG.visible = card > 0.01; cardG.position.set(0.25, 0.75 + 1.05 * card, 0.25); cardG.rotation.set(0, Math.PI + Math.sin(c * 2) * 0.06 * card, 0);
      if (JK.follow && c > HIT + 0.4 && c < HIT + 0.6 && JK.goneClose !== JK.selN) { JK.goneClose = JK.selN; X.goView(JK.close(), 1.5); }
    };
  } catch (err) { console.warn('tyler joke', err); }
  let tourSel = null;
  function tourTick(dt, state) { const id = state.sel && state.sel.id; if (id !== tourSel) { tourSel = id; JK.follow = id === 'locals' && JK.on; if (JK.follow) { JK.selN = (JK.selN || 0) + 1; JK.set(0.2); } } }
  window.__tyler = { get c() { return JK.c; }, set: (c) => JK.set && JK.set(c), look: () => JK.view && X.goView(JK.view(), 0.01), close: () => JK.close && X.goView(JK.close(), 0.01), part, root, FX };

  // ---------- card effects ----------
  const sitePads = INFO.sitePads || [], siteRot = INFO.siteRot || [], siteLen = INFO.siteLen || [], siteKind = INFO.siteKind || [];
  // a frame of light round each pad, at its own height; the 50 light in a wave from the entrance, the two pull-throughs stay brightest
  FX.typads = (c) => { const g = new THREE.Group(), n = sitePads.length, m = lightM(c.k ?? 2.2), sides = [];
    const bar = new THREE.BoxGeometry(1, 0.12, 1); for (let s = 0; s < 4; s++) { const im = new THREE.InstancedMesh(bar, m, n); im.frustumCulled = false; im.renderOrder = 5; for (let i = 0; i < n; i++) im.setColorAt(i, new THREE.Color(0, 0, 0)); g.add(im); sides.push(im); }
    const ent = INFO.lanes && INFO.lanes.entry ? INFO.lanes.entry[0] : [10, -196], order = sitePads.map(p => Math.hypot(p[0] - ent[0], p[2] - ent[1])), dmax = Math.max(...order);
    const pv = new THREE.Vector3(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), col = new THREE.Color(), m4 = new THREE.Matrix4();
    sitePads.forEach((p, i) => { const L = siteLen[i] || 15, W = 4.8; q.setFromAxisAngle(up, siteRot[i] || 0);
      const ux = new THREE.Vector3(1, 0, 0).applyQuaternion(q), uz = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
      [[ux, W / 2, 0.24, L], [ux, -W / 2, 0.24, L], [uz, L / 2, W, 0.24], [uz, -L / 2, W, 0.24]].forEach(([u, o, sx, sz], s) => { pv.set(p[0], p[1] + 0.3, p[2]).addScaledVector(u, o); m4.compose(pv, q, new THREE.Vector3(sx, 1, sz)); sides[s].setMatrixAt(i, m4); }); });
    return { obj: g, mat: m, tick: (t, k) => { sitePads.forEach((p, i) => { const a = 0.3 + order[i] / dmax * 2.0, pull = siteKind[i] === 'pull', b = flash(t, a, 0.25, 1.6) * 0.9 + (t > a ? (pull ? 0.95 : 0.35) : 0); col.setScalar(b * k); sides.forEach(s => s.setColorAt(i, col)); });
      sides.forEach(s => { s.instanceColor.needsUpdate = true; }); } }; };
  // water (blue) and sewer (green) flowing along under every lane of the loop
  const flowU = { uT: { value: 0 } };
  FX.tyutil = (c) => { const g = new THREE.Group(), lanes = Object.entries(INFO.lanes || {}).filter(([k]) => k !== 'amen').map(([, L]) => L);
    const mk = (hex) => new THREE.ShaderMaterial({ uniforms: Object.assign({ uC: { value: new THREE.Color(hex).multiplyScalar(c.k ?? 2.4) }, uK: { value: 0 } }, flowU), transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending,
      vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform vec3 uC; uniform float uT, uK; varying vec2 vU; void main(){ float d = 0.55 + 0.45 * smoothstep(0.35, 0.0, abs(fract(vU.x * 40.0 - uT * 0.9) - 0.5)); gl_FragColor = vec4(uC * d, uK * d); }' });
    const mW = mk('#39a8ff'), mS = mk('#45e07a');
    lanes.forEach(L => { if (!L || L.length < 2) return; [[mW, 1.5], [mS, -1.5]].forEach(([m, off]) => { const pts = [];
      for (let i = 0; i < L.length; i++) { const a = L[Math.max(0, i - 1)], b = L[Math.min(L.length - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, x = L[i][0] - dz / l * off, z = L[i][1] + dx / l * off; pts.push(new THREE.Vector3(x, groundY(x, z) + 0.55, z)); }
      const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.1), mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(8, pts.length * 8), 0.6, 6, false), m); mesh.renderOrder = 7; g.add(mesh); }); });
    return { obj: g, mat: mW, tick: (t, k) => { mW.uniforms.uK.value = k * cl(t * 1.5); mS.uniforms.uK.value = k * cl(t * 1.5 - 0.6); } }; };
  // Room to grow: the new gravel lane draws in across the lawn, ghost pads rise one by one in white light, RVs back in on every other pad
  FX.tygrow = (c) => { const g = new THREE.Group(), all = INFO.grow || [], rots = INFO.growRot || [], N = Math.min(all.length, c.n ?? 12), pads = all.slice(0, N);
    const lanes = ((INFO.life || {}).growLanes || []).map(l => { const a = l[0], b = l[l.length - 1], y = groundY((a[0] + b[0]) / 2, (a[1] + b[1]) / 2); return { a, b, y }; });
    const grav = new THREE.MeshStandardMaterial({ color: '#cfcac0', roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -6 }), laneMs = lanes.map(l => { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 0.3, 5.5), grav); m.receiveShadow = true; g.add(m); return m; });
    const padGeo = []; if (part.proto_pad) part.proto_pad.traverse(o => { if (o.isMesh) { const gg = o.geometry.clone(); o.updateMatrix(); gg.applyMatrix4(o.matrix); gg.translate(0, -PY, 0); padGeo.push([gg, o.material]); } });
    const padI = padGeo.map(([gg, mm]) => { const im = new THREE.InstancedMesh(gg, mm, N); im.receiveShadow = true; im.frustumCulled = false; g.add(im); return im; });
    const rvGeo = []; if (part.proto_rv) part.proto_rv.traverse(o => { if (o.isMesh) { const gg = o.geometry.clone(); o.updateMatrix(); gg.applyMatrix4(o.matrix); gg.translate(0, -PY, 0); rvGeo.push([gg, o.material]); } });
    const RVN = Math.ceil(N / 2), rvI = rvGeo.map(([gg, mm]) => { const im = new THREE.InstancedMesh(gg, mm, RVN); im.castShadow = true; im.frustumCulled = false; g.add(im); return im; });
    const ghostM = lightM(c.k ?? 1.6), ghost = new THREE.InstancedMesh(new THREE.BoxGeometry(5.1, 0.5, 15.4), ghostM, N); ghost.frustumCulled = false; ghost.renderOrder = 5; for (let i = 0; i < N; i++) ghost.setColorAt(i, new THREE.Color(0, 0, 0)); g.add(ghost);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), pv = new THREE.Vector3(), sv = new THREE.Vector3(), col = new THREE.Color();
    const T = { lane: [0.2, 1.4], pad0: 1.2, padGap: 0.16, padDur: 0.5, rv0: 4.0, rvGap: 0.22, rvDur: 0.8 };
    return { obj: g, mat: ghostM, tick: (t) => {
      lanes.forEach((l, i) => { const f = sm((t - T.lane[0]) / (T.lane[1] - T.lane[0])), len = Math.hypot(l.b[0] - l.a[0], l.b[1] - l.a[1]) * f, ang = Math.atan2(l.b[1] - l.a[1], l.b[0] - l.a[0]);
        const m = laneMs[i]; m.visible = f > 0; m.scale.x = Math.max(len, 1e-3); m.rotation.y = -ang; m.position.set(l.a[0] + Math.cos(ang) * len / 2, l.y + 0.12, l.a[1] + Math.sin(ang) * len / 2); });
      pads.forEach((p, i) => { const a = T.pad0 + i * T.padGap, f = cl((t - a) / T.padDur), b = back(f); q.setFromAxisAngle(up, rots[i] || 0);
        m4.compose(pv.set(p[0], p[1] - 0.5 + 0.55 * b, p[2]), q, sv.setScalar(f > 0 ? 1 : 1e-4)); padI.forEach(im => im.setMatrixAt(i, m4));
        const gb = flash(t, a, 0.3, 1.4) * 1.0 + (t > a ? 0.05 : 0); m4.compose(pv.set(p[0], p[1] + 0.25, p[2]), q, sv.setScalar(gb > 0.004 ? 1 : 1e-4)); ghost.setMatrixAt(i, m4); ghost.setColorAt(i, col.setScalar(gb)); });
      padI.forEach(im => { im.instanceMatrix.needsUpdate = true; }); ghost.instanceMatrix.needsUpdate = true; ghost.instanceColor.needsUpdate = true;
      for (let j = 0; j < RVN; j++) { const i = j * 2, p = pads[i]; if (!p) continue; const a = T.rv0 + j * T.rvGap, f = cl((t - a) / T.rvDur), r = rots[i] || 0, fwd = new THREE.Vector3(Math.sin(r), 0, Math.cos(r));
        const off = (1 - sm(f)) * 14, at = -3.2; m4.compose(pv.set(p[0] + fwd.x * (off + at), p[1] + 0.15, p[2] + fwd.z * (off + at)), q.setFromAxisAngle(up, r), sv.setScalar(f > 0 ? 1 : 1e-4)); rvI.forEach(im => im.setMatrixAt(j, m4)); }
      rvI.forEach(im => { im.instanceMatrix.needsUpdate = true; }); } }; };

  // ---------- every frame ----------
  function tick(dt, state = {}) { base.tick(dt, state); clock += dt; flowU.uT.value = clock;
    if (JK.tick) JK.tick(dt); tourTick(dt, state); tickRoof(dt, state.sel); tickPool(clock);
    PEOPLE.tick(dt, clock);
    ribU.uT.value = clock; ribU.uK.value = 1.1 + 0.6 * (base.dusk ? base.dusk() : 0); }
  return { fx: FX, tick, dusk: base.dusk };
}
