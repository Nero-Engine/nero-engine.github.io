// Lazy L Lake Campground life layer (lazyl1, 13-11-2026). Built on life1 (cars on the public roads, following the ground with
// scene.life.carsGround, lamps, the Sunset switch) and the Tin Cup and Cotton Country pieces (the 10 m border ribbon, ground grain, library people,
// the shared life1 pieces switched on in listing.json: scene.life.front and scene.life.tap), and:
// - the Beach House roof lifts on its card (upstairs: two king beds, the pool table, the arcade games)
// - the water park floats and bobs; kayaks paddle off the ramp; a pontoon cruises the lake; two dogs run in the dog park; people on the beach
// - the joke ("Lazy L"): a kid jumps off the launch tower onto the big blob, Dad on the far end is launched sky high, arms and legs going, and lands
//   with a big splash right beside a man asleep on a yellow lounger. The wave rocks him. He does not wake up: he turns over and keeps snoozing.
// - new Room to grow pads keep a soft glow (plainly the idea, not what is there)
// - its own card effects: lzpads (the 92 sites light row by row, A to F, a counter counts to 92), lzutil (new water and electric lines glow along
//   every road and out to every site), lzgrow (Room to grow: new pads rise on the lawn with RVs arriving, new huts rise out of the water)
// Adam 13-11-2026: the joke is a quiet hidden touch, never a card or tour stop; it plays about once every 45 s with a small launch.
// No halo rings anywhere. It moves in the web viewer only. The AR file stays a still model.
import { initPeople } from './people1.js?v=1';
let THREE;

export async function init(X) {
  THREE = X.THREE;
  const v = new URL(import.meta.url).searchParams.get('l1');
  const SC = X.SC, INFO = X.INFO;
  // the joke group is a named part before life1 starts, so the shared tap code (scene.life.tap.joke) opens its card
  const jokeG = new THREE.Group(); jokeG.name = 'joke'; X.part.joke = jokeG;
  const base = await (await import('./life1.js' + (v ? '?v=' + v : ''))).init(X);
  const { model, part, MATS, D, NV } = X;
  const reduced = !!NV.reduced, HERO = new THREE.Color(D.theme.hero), PY = (INFO.protoAt || [0, -8, 0])[1];
  const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), sm = (x) => { x = cl(x); return x * x * (3 - 2 * x); };
  const back = (k) => { if (k <= 0) return 0; if (k >= 1) return 1; const c = 1.7, x = k - 1; return 1 + (c + 1) * x * x * x + c * x * x; };
  const flash = (t, a, d, decay = 2.2) => t <= a ? 0 : t < a + d ? (t - a) / d : Math.exp(-(t - a - d) * decay);
  const FX = Object.assign({}, base.fx);
  const root = new THREE.Group(); root.name = 'lazyl_life'; model.add(root);
  const kid = (name, parent = root) => { if (!part[name]) return null; const g = new THREE.Group(), inner = part[name].clone(true); inner.visible = true; inner.position.set(0, -PY, 0); g.add(inner);
    g.traverse(o => { if (o.isMesh) o.castShadow = true; }); parent.add(g); return g; };
  const lightM = (k, o = {}) => new THREE.MeshBasicMaterial(Object.assign({ color: new THREE.Color('#fff4dc').multiplyScalar(k), toneMapped: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }, o));
  function inst(name, n) { const p = part[name]; if (!p || !n) return null; const meshes = []; p.traverse(o => { if (o.isMesh) meshes.push(o); });
    const ims = meshes.map(o => { o.updateMatrix(); const g = o.geometry.clone(); g.applyMatrix4(o.matrix); g.translate(0, -PY, 0); const im = new THREE.InstancedMesh(g, o.material, n); im.castShadow = true; im.frustumCulled = false; root.add(im); return im; });
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(0, 0, 0, 'YXZ'), pv = new THREE.Vector3(), sv = new THREE.Vector3();
    const I = { ims, set(i, x, y, z, ry = 0, s = 1, rx = 0, rz = 0) { e.set(rx, ry, rz); q.setFromEuler(e); m4.compose(pv.set(x, y, z), q, sv.setScalar(Math.max(s, 1e-4))); for (const im of ims) im.setMatrixAt(i, m4); },
      hide(i) { I.set(i, 0, PY, 0, 0, 1e-4); }, done() { for (const im of ims) im.instanceMatrix.needsUpdate = true; } };
    for (let i = 0; i < n; i++) I.hide(i); I.done(); return I; }
  // ground height from life1's height grid (one pass, then four reads a lookup); the old raycast per point froze the page for seconds (Adam 13-11-2026)
  const groundY = base.groundY || X.groundY;
  const WY = INFO.waterY ?? -0.86;

  // RV roofs and white sides: the sun sheen down 20% (as Riverbend and Tin Cup)
  MATS.forEach(m => { if (m.userData.p !== 'rvs') return; const l = (m.color.r + m.color.g + m.color.b) / 3; if (l < 0.6 && !m.map) return;
    m.color.multiplyScalar(0.86); if (m.userData.c0) m.userData.c0.copy(m.color); m.roughness = Math.max(m.roughness, 0.45); m.envMapIntensity = (m.envMapIntensity ?? 1) * 0.8; });

  const PEOPLE = initPeople(X, root);

  // ---------- the camp outline: a 10 m ribbon of light, always on, stronger at sunset (Adam 13-11-2026: thicker, brighter) ----------
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

  // ---------- a fine grain on the ground ----------
  try { if (part.ground) { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), id = x.createImageData(256, 256);
      const H = new Float32Array(256 * 256); let s = 7; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
      for (let o = 0; o < 6; o++) { const f = 2 ** (o + 2), amp = 1 / (o + 1.2), G = []; for (let i = 0; i < f * f; i++) G.push(r());
        for (let j = 0; j < 256; j++) for (let i = 0; i < 256; i++) { const u = i / 256 * f, w = j / 256 * f, i0 = Math.floor(u), j0 = Math.floor(w), a = u - i0, b = w - j0, Pq = (p, q) => G[(q % f) * f + (p % f)];
          const aa = a * a * (3 - 2 * a), bb = b * b * (3 - 2 * b); H[j * 256 + i] += amp * ((Pq(i0, j0) * (1 - aa) + Pq(i0 + 1, j0) * aa) * (1 - bb) + (Pq(i0, j0 + 1) * (1 - aa) + Pq(i0 + 1, j0 + 1) * aa) * bb); } }
      for (let j = 0; j < 256; j++) for (let i = 0; i < 256; i++) { const k = (j * 256 + i) * 4, dx = H[j * 256 + (i + 1) % 256] - H[j * 256 + (i + 255) % 256], dz = H[((j + 1) % 256) * 256 + i] - H[((j + 255) % 256) * 256 + i];
        const nn = new THREE.Vector3(-dx * 3, -dz * 3, 1).normalize(); id.data[k] = (nn.x * 0.5 + 0.5) * 255; id.data[k + 1] = (nn.y * 0.5 + 0.5) * 255; id.data[k + 2] = (nn.z * 0.5 + 0.5) * 255; id.data[k + 3] = 255; }
      x.putImageData(id, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(150, 150); t.anisotropy = 4;
      part.ground.traverse(o => { if (o.isMesh && o.material && o.material.map) { o.material.normalMap = t; o.material.normalScale = new THREE.Vector2(0.3, 0.3); o.material.roughness = 1; o.material.metalness = 0; o.material.envMapIntensity = Math.min(o.material.envMapIntensity ?? 1, 0.35); o.material.needsUpdate = true; } }); } } catch (err) { console.warn('grain', err); }

  // ---------- the Beach House roof lifts on its card and floats; tap the house again to let go ----------
  const BH = INFO.beachHouse || null, ROOFS = [], roofCards = (SC.life && SC.life.roofCards) || {};
  if (BH && part.beach_house_roof) ROOFS.push({ p: part.beach_house_roof, cards: roofCards.beachhouse || ['beachhouse'], up: 9, slide: 7, f: BH.f + Math.PI, ph: 0.4, e: 0 });
  function tickRoofs(dt, sel) { const id = sel && sel.id;
    for (const R of ROOFS) { const want = id && R.cards.includes(id) ? 1 : 0; R.e += (want - R.e) * Math.min(1, (want ? 1.3 : 3) * dt); const e = sm(R.e);
      const sx = Math.cos(R.f), sz = -Math.sin(R.f), up = R.up * Math.sin(Math.PI * 0.5 * Math.min(1, e * 1.25)) + (e > 0.99 && !reduced ? Math.sin(clock * 1.1 + R.ph) * 0.3 : 0);
      R.p.position.set(sx * R.slide * e, up, sz * R.slide * e); R.p.traverse(m => { if (m.isMesh) m.castShadow = e < 0.05; }); } }

  // ---------- the water park floats: a slow bob and roll on the swell ----------
  const WP = INFO.waterPark || null; const wpG = part.waterpark || null;
  function tickWP() { if (!wpG || reduced) return; wpG.position.y = Math.sin(clock * 0.9) * 0.05; }

  // ---------- kayaks off the ramp, the pontoon on the lake, dogs in the dog park ----------
  const RPI = INFO.ramp, kay = inst('proto_kayak', 3), pad3 = inst('proto_person_sit', 4), pont = inst('proto_pontoon', 1), dogs = inst('proto_dog', 2);
  const KAY = []; if (RPI && kay) { const dx = Math.sin(RPI.f), dz = Math.cos(RPI.f), c = [RPI.at[0] + dx * 48, RPI.at[2] + dz * 48];
    for (let j = 0; j < 3; j++) KAY.push({ c, rx: 22 - j * 4, rz: 11 + j * 2, ph: j * 2.1, w: 0.05 + j * 0.008, ax: Math.atan2(dx, dz) }); }
  const BOAT = INFO.boat ? { c: [INFO.boat[0] - 20, INFO.boat[2] + 10], r: 34, w: 0.035 } : null;
  const DP = INFO.dogPark;
  function tickCritters() {
    KAY.forEach((K, j) => { const t = clock * K.w * (reduced ? 0 : 1) + K.ph, ca = Math.cos(K.ax), sa = Math.sin(K.ax), lx = Math.cos(t) * K.rz, lz = Math.sin(t) * K.rx;
      const x = K.c[0] + lx * ca + lz * sa, z = K.c[1] - lx * sa + lz * ca, tx = -Math.sin(t) * K.rz, tz = Math.cos(t) * K.rx, hx = tx * ca + tz * sa, hz = -tx * sa + tz * ca, h = Math.atan2(hx, hz);
      kay.set(j, x, WY + 0.02 + Math.sin(clock * 2 + j) * 0.03, z, h + Math.PI / 2); if (pad3) pad3.set(j, x, WY - 0.35, z, h + Math.PI / 2, 0.9); });
    if (kay) kay.done();
    if (BOAT && pont) { const t = clock * BOAT.w * (reduced ? 0 : 1); const x = BOAT.c[0] + Math.cos(t) * BOAT.r, z = BOAT.c[1] + Math.sin(t) * BOAT.r * 0.7; pont.set(0, x, WY - 0.1 + Math.sin(clock * 1.3) * 0.04, z, Math.atan2(-Math.sin(t), Math.cos(t) * 0.7)); pont.done();
      if (pad3) { pad3.set(3, x, WY + 0.35, z, Math.atan2(-Math.sin(t), Math.cos(t) * 0.7) + Math.PI / 2); } }
    if (pad3) pad3.done();
    if (DP && dogs) { for (let j = 0; j < 2; j++) { const t = clock * (0.9 + j * 0.35) * (reduced ? 0 : 1) + j * 2.6, lx = Math.cos(t) * (6 - j * 2), lz = Math.sin(t * (1 + j * 0.5)) * (4 - j);
      const ca = Math.cos(DP.f), sa = Math.sin(DP.f), x = DP.at[0] + lx * ca + lz * sa, z = DP.at[2] - lx * sa + lz * ca; const t2 = t + 0.05, lx2 = Math.cos(t2) * (6 - j * 2), lz2 = Math.sin(t2 * (1 + j * 0.5)) * (4 - j);
      const x2 = DP.at[0] + lx2 * ca + lz2 * sa, z2 = DP.at[2] - lx2 * sa + lz2 * ca; dogs.set(j, x, DP.at[1] + Math.abs(Math.sin(clock * 9 + j)) * 0.12, z, Math.atan2(x2 - x, z2 - z)); } dogs.done(); } }

  // ---------- the joke: the blob launch ----------
  const J = INFO.joke || null, JK = { c: 0, on: false }; root.add(jokeG);
  const zzz = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d'); x.font = '700 92px Georgia, serif'; x.fillStyle = '#ffffff'; x.strokeStyle = 'rgba(20,30,40,0.6)'; x.lineWidth = 8;
    x.strokeText('z z z', 18, 96); x.fillText('z z z', 18, 96); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, toneMapped: false })); s.scale.set(1.9, 0.95, 1); s.renderOrder = 9; return s; })();
  if (J && part.proto_kid && part.proto_dad && part.proto_sleeper && part.proto_lounger) {
    const V = (p) => new THREE.Vector3(p[0], p[1], p[2]);
    const tower = V(J.tower), A = V(J.blobA), C = V(J.blobC), L = V(J.land), Sl = V(J.sleeper), TOP = INFO.towerTop ?? (A.y + 3), F = INFO.jokeF ?? 0;
    const kidG = kid('proto_kid', jokeG), dadG = kid('proto_dad', jokeG), slG = new THREE.Group(), lounger = kid('proto_lounger', slG), sleeper = kid('proto_sleeper', slG), splash = kid('proto_splash', jokeG);
    jokeG.add(slG); slG.add(zzz); zzz.position.set(0.6, 1.9, -0.6);
    sleeper.position.set(0, 0.08, -0.15); sleeper.rotation.set(-1.15, 0, 0); if (lounger) lounger.position.set(0, 0, 0);
    if (splash) { splash.visible = false; splash.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; o.castShadow = false; } }); }
    const PER = 45, JUMP = 2.0, BOUNCE = 2.7, FLY = 1.9, LAND = BOUNCE + FLY, SWIM = 7.5;
    JK.on = true; JK.T = { JUMP, BOUNCE, LAND, PER }; JK.set = (c) => { JK.c = c; };
    const arc = (a, b, h, k, o) => o.set(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k + 4 * h * k * (1 - k), a.z + (b.z - a.z) * k);
    const tmp = new THREE.Vector3(), out = new THREE.Vector3(Math.sin(F), 0, Math.cos(F));
    JK.view = () => { const mid = A.clone().lerp(Sl, 0.5); return { at: [mid.x, WY + 3, mid.z], dist: innerWidth < 760 ? 84 : 64, el: 0.3, az: F + Math.PI / 2 + 0.55 }; };
    JK.close = () => ({ at: [Sl.x, WY + 0.6, Sl.z], dist: 14, el: 0.32, az: F + Math.PI / 2 + 0.9 });
    JK.tick = (dt) => { JK.c = (JK.c + dt) % PER; const c = reduced ? 12 : JK.c;
      // the kid: stands on the tower top, jumps at JUMP onto the near end of the blob, sits there after, back on the tower next round
      if (kidG) { if (c < JUMP) { kidG.position.set(tower.x, TOP, tower.z); kidG.rotation.set(0, F, 0); kidG.scale.setScalar(1); }
        else if (c < BOUNCE) { const k = (c - JUMP) / (BOUNCE - JUMP); arc(new THREE.Vector3(tower.x, TOP, tower.z), new THREE.Vector3(A.x, A.y + 0.7, A.z), 1.4, k, tmp); kidG.position.copy(tmp); kidG.rotation.set(-0.3 * Math.sin(k * Math.PI), F, 0); }
        else { const k = cl((c - BOUNCE) / 0.5); kidG.position.set(A.x, A.y + 0.7 + Math.sin(k * Math.PI) * 0.5, A.z); kidG.rotation.set(0, F, 0); } }
      // Dad: sits on the far end, launched at BOUNCE in a big arc, spinning, splashes down at LAND, bobs up, then swims back
      if (dadG) { if (c < BOUNCE) { dadG.position.set(C.x, C.y + 0.55, C.z); dadG.rotation.set(0, F + Math.PI, 0); }
        else if (c < LAND) { const k = (c - BOUNCE) / FLY; arc(new THREE.Vector3(C.x, C.y + 0.55, C.z), new THREE.Vector3(L.x, WY - 0.4, L.z), 5.0, k, tmp); dadG.position.copy(tmp); dadG.rotation.set(-k * Math.PI * 1.0, F + Math.PI, Math.sin(k * 20) * 0.4); }
        else if (c < LAND + 1.2) { const k = (c - LAND) / 1.2; dadG.position.set(L.x, WY - 1.4 + k * 0.6, L.z); dadG.rotation.set(0, F + Math.PI, 0); }
        else { const k = sm((c - LAND - 1.2) / SWIM); tmp.copy(L).lerp(C, k); dadG.position.set(tmp.x, WY - 0.75 + Math.sin(c * 3) * 0.05, tmp.z); dadG.rotation.set(0, F + Math.PI, 0); } }
      // the splash: a ring that spreads and a white spray that rises and falls
      if (splash) { const k = (c - LAND) / 1.3; splash.visible = k > 0 && k < 1; if (splash.visible) { splash.position.set(L.x, WY + 0.05, L.z); const r = 0.6 + k * 4.2; splash.scale.set(r, Math.sin(Math.min(1, k * 1.6) * Math.PI) * 1.8 + 0.01, r);
        splash.traverse(o => { if (o.isMesh) o.material.opacity = 1 - k; }); } }
      // the sleeper: bobbing on his lounger; the wave reaches him just after the splash and rocks him; he rolls over a little and sleeps on
      { const w = c - LAND - 0.35, rock = w > 0 && w < 3 ? Math.sin(w * 6) * Math.exp(-w * 1.2) : 0, turned = sm((c - LAND - 2.2) / 1.2);
        slG.position.set(Sl.x, WY + 0.02 + Math.sin(clock * 1.3) * 0.04 + rock * 0.35, Sl.z); slG.rotation.set(rock * 0.18, F + 1.2, rock * 0.3);
        if (sleeper) sleeper.rotation.set(-1.15, 0, turned * 0.5);
        const zt = (clock * 0.6) % 1; zzz.position.set(0.6 + zt * 0.6, 1.7 + zt * 1.2, -0.6); zzz.material.opacity = (c > LAND && c < LAND + 1.0) ? 0 : Math.sin(zt * Math.PI) * 0.95; }
      if (JK.follow && c > LAND + 0.2 && c < LAND + 0.6 && JK.goneClose !== JK.selN) { JK.goneClose = JK.selN; X.goView(JK.close(), 2.0); } };
    JK.c = 0.5;
  }
  let tourSel = null;
  function tourTick(dt, state) { const id = state.sel && state.sel.id;
    if (id !== tourSel) { tourSel = id; JK.follow = id === 'locals' && JK.on; if (JK.follow) { JK.selN = (JK.selN || 0) + 1; JK.set(-1.5); setTimeout(() => { if (JK.follow) X.goView(JK.view(), 1.6); }, 60); } } }
  window.__lazyl = { get c() { return JK.c; }, T: () => JK.T, set: (c) => JK.set && JK.set(c), look: () => JK.view && X.goView(JK.view(), 0.01), close: () => JK.close && X.goView(JK.close(), 0.01), part, root, FX,
    go: (vv) => X.goView(vv, 0.01) };

  // ---------- card effects ----------
  const pads = INFO.pads || [], padRot = INFO.padRot || [], PW = INFO.padW || 4.6, PL = INFO.padL || [], ROW = INFO.padRow || [];
  const textSprite = (txt, sub, w = 30) => { const c = document.createElement('canvas'); c.width = 512; c.height = 256; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, toneMapped: false }), s = new THREE.Sprite(m); s.scale.set(w, w / 2, 1); s.renderOrder = 9;
    s.userData.draw = (a, b) => { const x = c.getContext('2d'); x.clearRect(0, 0, 512, 256); x.fillStyle = 'rgba(10,14,18,0.62)'; x.beginPath(); x.roundRect(16, 40, 480, 176, 40); x.fill();
      x.fillStyle = '#ffffff'; x.textAlign = 'center'; x.font = '700 ' + (b ? 104 : 72) + 'px Arial, sans-serif'; x.fillText(a, 256, b ? 150 : 152); if (b) { x.font = '600 36px Arial, sans-serif'; x.fillStyle = '#' + HERO.getHexString(); x.fillText(b, 256, 198); } t.needsUpdate = true; };
    s.userData.draw(txt, sub); return s; };
  // the 92 sites light up row by row, A to F (a frame of light round each pad), a counter counts to 92
  FX.lzpads = (c) => { const g = new THREE.Group(), n = pads.length, m = lightM(c.k ?? 2.4), sides = [];
    const bar = new THREE.BoxGeometry(1, 0.14, 1); for (let s = 0; s < 4; s++) { const im = new THREE.InstancedMesh(bar, m, n); im.frustumCulled = false; im.renderOrder = 5; for (let i = 0; i < n; i++) im.setColorAt(i, new THREE.Color(0, 0, 0)); g.add(im); sides.push(im); }
    const pv = new THREE.Vector3(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), col = new THREE.Color(), m4 = new THREE.Matrix4();
    pads.forEach((p, i) => { const PD = PL[i] || 15; q.setFromAxisAngle(up, padRot[i] || 0); const ux = new THREE.Vector3(1, 0, 0).applyQuaternion(q), uz = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
      [[uz, PD / 2, PW, 0.25], [uz, -PD / 2, PW, 0.25], [ux, PW / 2, 0.25, PD], [ux, -PW / 2, 0.25, PD]].forEach(([u, o, sx, sz], s) => { pv.set(p[0], p[1] + 0.1, p[2]).addScaledVector(u, o); m4.compose(pv, q, new THREE.Vector3(sx, 1, sz)); sides[s].setMatrixAt(i, m4); }); });
    const ctr = n ? pads.reduce((a, p) => [a[0] + p[0] / n, a[1] + p[1] / n, a[2] + p[2] / n], [0, 0, 0]) : [0, 0, 0];
    const counter = textSprite('0', 'RV sites', 58); counter.position.set(ctr[0], ctr[1] + 60, ctr[2]); g.add(counter); let shownN = -1;
    const tA = pads.map((p, i) => 0.9 + (ROW[i] ?? 0) * 0.32 + i * 0.03);
    return { obj: g, mat: m, tick: (t, k) => { let lit = 0; pads.forEach((p, i) => { const a = tA[i], b = flash(t, a, 0.2, 1.6) * 0.9 + (t > a ? 0.4 : 0); if (t > a) lit++; col.setScalar(b * k); sides.forEach(s => s.setColorAt(i, col)); });
      sides.forEach(s => { s.instanceColor.needsUpdate = true; }); if (lit !== shownN) { shownN = lit; counter.userData.draw(String(lit), 'RV sites'); } counter.material.opacity = k; } }; };
  // new water (blue) and electric (yellow) lines along every camp road and out to every site
  const flowU = { uT: { value: 0 } };
  FX.lzutil = (c) => { const g = new THREE.Group();
    const mk = (hex) => new THREE.ShaderMaterial({ uniforms: Object.assign({ uC: { value: new THREE.Color(hex).multiplyScalar(c.k ?? 2.4) }, uK: { value: 0 } }, flowU), transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending,
      vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform vec3 uC; uniform float uT, uK; varying vec2 vU; void main(){ float d = 0.55 + 0.45 * smoothstep(0.35, 0.0, abs(fract(vU.x * 30.0 - uT * 0.9) - 0.5)); gl_FragColor = vec4(uC * d, uK * d); }' });
    const mW = mk('#39a8ff'), mE = mk('#ffd23a');
    const tube = (pts3, m, r = 0.45) => { if (pts3.length < 2) return; const curve = new THREE.CatmullRomCurve3(pts3.map(p => new THREE.Vector3(...p)), false, 'catmullrom', 0.05); const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(8, pts3.length * 6), r, 6, false), m); mesh.renderOrder = 7; g.add(mesh); };
    const lanes = Object.values(INFO.lanes || {});
    const off = (L, d) => L.map((p, i) => { const a = L[Math.max(0, i - 1)], b = L[Math.min(L.length - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [p[0] - dz / l * d, p[1] + dx / l * d]; });
    lanes.forEach(L => { tube(off(L, 1.6).map(([x, z]) => [x, groundY(x, z) + 0.5, z]), mW); tube(off(L, -1.6).map(([x, z]) => [x, groundY(x, z) + 0.5, z]), mE); });
    // a short branch to each site's hookup (from the pad's road end)
    pads.forEach((p, i) => { const f = padRot[i] || 0, PD = PL[i] || 15, ex = p[0] - Math.sin(f) * (PD / 2 + 1.5), ez = p[2] - Math.cos(f) * (PD / 2 + 1.5), hx = p[0] - Math.sin(f) * (PD / 2 - 2.2) + Math.cos(f) * (PW / 2 + 0.7), hz = p[2] - Math.cos(f) * (PD / 2 - 2.2) - Math.sin(f) * (PW / 2 + 0.7);
      tube([[ex, groundY(ex, ez) + 0.45, ez], [hx, groundY(hx, hz) + 0.45, hz]], i % 2 ? mE : mW, 0.3); });
    return { obj: g, mat: mW, tick: (t, k) => { mW.uniforms.uK.value = k * cl(t * 1.2); mE.uniforms.uK.value = k * cl(t * 1.2 - 0.6); } }; };
  // Room to grow: new pads rise on the open lawn (RVs back in on one in two), new huts rise out of the water along the empty shore
  FX.lzgrow = (c) => { const g = new THREE.Group(), all = INFO.grow || [], N = all.length, GL = INFO.growL || 13, huts = INFO.ghostHuts || [];
    const geoOf = (name) => { const out = []; if (part[name]) part[name].traverse(o => { if (o.isMesh) { const gg = o.geometry.clone(); o.updateMatrix(); gg.applyMatrix4(o.matrix); gg.translate(0, -PY, 0); out.push([gg, o.material]); } }); return out; };
    const padI = geoOf('proto_pad').map(([gg, mm]) => { const im = new THREE.InstancedMesh(gg, mm, Math.max(1, N)); im.receiveShadow = true; im.frustumCulled = false; g.add(im); return im; });
    const RVN = Math.ceil(N / 2), rvI = geoOf('proto_rv').map(([gg, mm]) => { const im = new THREE.InstancedMesh(gg, mm, Math.max(1, RVN)); im.castShadow = true; im.frustumCulled = false; g.add(im); return im; });
    const hutI = geoOf('proto_hut').map(([gg, mm]) => { const im = new THREE.InstancedMesh(gg, mm, Math.max(1, huts.length)); im.castShadow = true; im.frustumCulled = false; g.add(im); return im; });
    const ghostM = lightM(c.k ?? 1.6), ghost = new THREE.InstancedMesh(new THREE.BoxGeometry(PW + 0.4, 0.5, GL + 0.4), ghostM, Math.max(1, N)); ghost.frustumCulled = false; ghost.renderOrder = 5; for (let i = 0; i < N; i++) ghost.setColorAt(i, new THREE.Color(0, 0, 0)); g.add(ghost);
    const tA = all.map((p, i) => 1.0 + (i / Math.max(1, N)) * 3.2), hA = huts.map((h, j) => 4.4 + j * 0.45);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), pv = new THREE.Vector3(), sv = new THREE.Vector3(), col = new THREE.Color();
    return { obj: g, mat: ghostM, tick: (t) => {
      all.forEach((p, i) => { const a = tA[i], f = cl((t - a) / 0.5), b = back(f); q.setFromAxisAngle(up, p[3] || 0);
        m4.compose(pv.set(p[0], p[1] - 0.5 + 0.72 * b, p[2]), q, sv.setScalar(f > 0 ? 1 : 1e-4)); padI.forEach(im => im.setMatrixAt(i, m4));
        const gb = flash(t, a, 0.3, 1.4) + (t > a ? 0.16 : 0); m4.compose(pv.set(p[0], p[1] + 0.25, p[2]), q, sv.setScalar(gb > 0.004 ? 1 : 1e-4)); ghost.setMatrixAt(i, m4); ghost.setColorAt(i, col.setScalar(gb)); });
      padI.forEach(im => { im.instanceMatrix.needsUpdate = true; }); ghost.instanceMatrix.needsUpdate = true; ghost.instanceColor.needsUpdate = true;
      for (let j = 0; j < RVN; j++) { const i = j * 2, p = all[i]; if (!p) continue; const a = tA[i] + 2.2 + (j % 5) * 0.12, f = cl((t - a) / 0.8), r = (p[3] || 0) + Math.PI, fwd = new THREE.Vector3(Math.sin(r), 0, Math.cos(r));
        const offd = (1 - sm(f)) * 14, cx = p[0] - Math.sin(p[3] || 0) * 1.5, cz = p[2] - Math.cos(p[3] || 0) * 1.5; m4.compose(pv.set(cx + fwd.x * offd, p[1] + 0.12, cz + fwd.z * offd), q.setFromAxisAngle(up, r), sv.setScalar(f > 0 ? 1 : 1e-4)); rvI.forEach(im => im.setMatrixAt(j, m4)); }
      rvI.forEach(im => { im.instanceMatrix.needsUpdate = true; });
      huts.forEach((h, j) => { const f = cl((t - hA[j]) / 0.9), b = back(f); q.setFromAxisAngle(up, h[3] || 0); m4.compose(pv.set(h[0], h[1] - 4 + 4 * b, h[2]), q, sv.setScalar(f > 0 ? 1 : 1e-4)); hutI.forEach(im => im.setMatrixAt(j, m4)); });
      hutI.forEach(im => { im.instanceMatrix.needsUpdate = true; }); } }; };

  // ---------- every frame ----------
  let clock = 0;
  function tick(dt, state = {}) { dt = Math.max(0, Math.min(0.1, dt || 0)); base.tick(dt, state); clock += dt; flowU.uT.value = clock;
    if (JK.tick) JK.tick(dt); tourTick(dt, state); tickRoofs(dt, state.sel); tickWP(); tickCritters(); PEOPLE.tick(dt, clock);
    ribU.uT.value = clock; ribU.uK.value = 1.1 + 0.6 * (base.dusk ? base.dusk() : 0); }
  return { fx: FX, tick, dusk: base.dusk };
}
