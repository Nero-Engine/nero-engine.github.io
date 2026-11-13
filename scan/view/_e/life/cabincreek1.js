// Cabin Creek Landing life layer (cabincreek1, 13-11-2026). Copied from the tincup1 pattern (life1 underneath: cars on the public roads following
// the ground, lamps, sunset; library people who walk; the border ribbon; ground grain; drives drawn in front of the land; tap a thing to open
// its card) with this place's own pieces:
// - the joke: "Moose have right of way". A plane comes in to land, a moose wanders onto the runway and stops on the centre line; the plane
//   pulls up and flies the circuit over the lodge, the moose strolls off, the plane lands, taxis up to the hangar and parks. Built from shapes.
// - the hangar roof lifts on the hangar card: the red and white plane inside, the recliners, the log table, the side by sides
// - the fire pit flickers
// - card effects: ccrunway (edge lights sweep on), cctaxi (a line of light from the runway to the hangar door), ccsun (the solar roof glows,
//   power runs to the lodge), ccgrow (Room to grow: a trail draws in through the pines, six guest cabins rise). No halo rings.
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
  const root = new THREE.Group(); root.name = 'cabincreek_life'; model.add(root);
  const kid = (name, parent = root) => { if (!part[name]) return null; const g = new THREE.Group(), inner = part[name].clone(true); inner.visible = true; inner.position.set(0, -PY, 0); g.add(inner);
    g.traverse(o => { if (o.isMesh) o.castShadow = true; }); parent.add(g); return g; };
  const lightM = (k, o = {}) => new THREE.MeshBasicMaterial(Object.assign({ color: new THREE.Color('#fff4dc').multiplyScalar(k), toneMapped: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }, o));

  const groundY = base.groundY || X.groundY;   // life1's height grid, built once (a raycast per point froze the page for seconds, 13-11-2026)

  // RV roofs and white sides: the sun sheen down 20% (as Tin Cup)
  MATS.forEach(m => { if (m.userData.p !== 'rvs') return; const l = (m.color.r + m.color.g + m.color.b) / 3; if (l < 0.6 && !m.map) return;
    m.color.multiplyScalar(0.84); if (m.userData.c0) m.userData.c0.copy(m.color); m.roughness = Math.max(m.roughness, 0.45); m.envMapIntensity = (m.envMapIntensity ?? 1) * 0.8; if (m.userData.lum) m.userData.lum *= 0.84; });

  const PEOPLE = initPeople(X, root);

  // ---------- the land for sale: a strong ribbon of light about 10 m wide round the land, always on, stronger at sunset (Adam, 13-11-2026) ----------
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


  // ---------- the hangar roof lifts on the hangar card: up and away to the north east, off the lawn side, a gentle float while open ----------
  const HG0 = INFO.office || null, roofCard = (SC.life && SC.life.roofCard) || 'hangar'; let roofE = 0, clock = 0;
  const away = HG0 ? [-Math.sin(HG0.f), -Math.cos(HG0.f)] : [0, -1];
  function tickRoof(dt, sel) { if (!HG0 || !part.hangar_roof) return; const want = sel && sel.id === roofCard ? 1 : 0;
    roofE += (want - roofE) * Math.min(1, (want ? 1.6 : 3) * dt); const e = sm(roofE);
    const up = 11 * Math.sin(Math.PI * 0.5 * Math.min(1, e * 1.3)) + (e > 0.99 && !reduced ? Math.sin(clock * 1.4) * 0.25 : 0);
    part.hangar_roof.position.set(away[0] * 9 * e, up, away[1] * 9 * e);
    part.hangar_roof.traverse(m => { if (m.isMesh) m.castShadow = e < 0.05; }); }

  // ---------- the lodge opens (Adam 13-11-2026): on the lodge card the roof lifts away behind it to show the eight bedrooms upstairs;
  // on the great room card the upper floor lifts and slides out to the side as well, to show the great room, the kitchen and the dining table ----------
  const LG0 = INFO.lodge || null; let lodR = 0, lodU = 0;
  const lBack = LG0 ? [-Math.cos(LG0.f), Math.sin(LG0.f)] : [-1, 0];
  const lSide = LG0 ? [Math.sin(LG0.f), Math.cos(LG0.f)] : [0, 1];   // along the front, away from the hot tub end
  function tickLodge(dt, sel) { if (!LG0 || !part.lodge_roof) return; const id = sel && sel.id, wR = id === 'lodge' || id === 'inside' ? 1 : 0, wU = id === 'inside' ? 1 : 0;
    lodR += (wR - lodR) * Math.min(1, (wR ? 1.5 : 3) * dt); lodU += (wU - lodU) * Math.min(1, (wU ? 1.3 : 3) * dt); const r = sm(lodR), u = sm(lodU);
    const bob = !reduced ? Math.sin(clock * 1.3) * 0.2 : 0;
    part.lodge_roof.position.set(lBack[0] * 17 * r, 13 * Math.sin(Math.PI * 0.5 * Math.min(1, r * 1.3)) + (r > 0.99 ? bob : 0), lBack[1] * 17 * r);
    part.lodge_roof.traverse(m => { if (m.isMesh) m.castShadow = r < 0.05; });
    if (part.lodge_upper) { part.lodge_upper.position.set(lSide[0] * 30 * u, 4 * Math.sin(Math.PI * 0.5 * Math.min(1, u * 1.3)) + (u > 0.99 ? -bob * 0.6 : 0), lSide[1] * 30 * u);
      part.lodge_upper.traverse(m => { if (m.isMesh) m.castShadow = u < 0.05; }); } }

  // ---------- the runway lights are always on, as at a real airfield (Adam 13-11-2026): white edge lights that breathe, green at the landing end,
  // red at the far end, and a running strobe that flashes up the approach to the threshold over and over ----------
  let rwTick = () => {};
  try { const J0 = INFO.joke; if (J0 && J0.rw) { const a = J0.rw.a, d = J0.rw.d, L = [d[1], -d[0]], t0 = J0.rw.t0, t1 = J0.rw.t1, w = J0.rw.w, N = Math.floor((t1 - t0) / 12);
      const geo = new THREE.SphereGeometry(0.42, 8, 6), mE = lightM(1), im = new THREE.InstancedMesh(geo, mE, N * 2 + 16); im.frustumCulled = false; im.renderOrder = 6;
      const m4 = new THREE.Matrix4(), col = new THREE.Color(), kinds = []; let n = 0;
      const at = (t, off, k) => { const x = a[0] + d[0] * t + L[0] * off, z = a[1] + d[1] * t + L[1] * off; m4.makeTranslation(x, groundY(x, z) + 0.45, z); im.setMatrixAt(n, m4); kinds.push(k); n++; };
      for (let i = 0; i < N; i++) for (const sg of [-1, 1]) at(t0 + 6 + i * 12, sg * (w / 2 + 0.9), { c: '#fff2d6', i });
      for (const sg of [-1, -0.5, 0, 0.5, 1]) at(t0 + 1, sg * (w / 2 - 0.5), { c: '#3cff7a' });
      for (const sg of [-1, -0.5, 0, 0.5, 1]) at(t1 - 1, sg * (w / 2 - 0.5), { c: '#ff3a2a' });
      const RAB = 6; for (let i = 0; i < RAB; i++) at(t0 - 6 - i * 9, 0, { c: '#ffffff', r: RAB - 1 - i });
      im.count = n; model.add(im);
      rwTick = (t) => { const dk = base.dusk ? base.dusk() : 0, glow = 0.75 + 0.6 * dk;
        kinds.forEach((k, j) => { let v;
          if (k.r !== undefined) { const ph = ((reduced ? 0.5 : t) * 2.2) % 1.6, on = Math.abs(ph - k.r * 0.14) < 0.06; v = on ? 3.2 : 0.08; }
          else if (k.i !== undefined) v = glow * (reduced ? 1 : 0.85 + 0.15 * Math.sin(t * 2.4 + k.i * 0.5));
          else v = glow * 1.3;
          im.setColorAt(j, col.set(k.c).multiplyScalar(v)); });
        im.instanceColor.needsUpdate = true; };
      rwTick(0); } } catch (err) { console.warn('runway lights', err); }

  // ---------- the fire pit flickers; brighter at sunset ----------
  const fireM = MATS.filter(m => m.name === 'fire'), fire0 = fireM.map(m => m.emissiveIntensity);
  function tickFire(t) { const dk = base.dusk ? base.dusk() : 0, f = reduced ? 1 : 1 + 0.22 * Math.sin(t * 9.1) + 0.14 * Math.sin(t * 15.7 + 1.3); fireM.forEach((m, i) => { m.emissiveIntensity = fire0[i] * f * (1 + dk * 0.8); }); }

  // ---------- the joke: "Moose have right of way" ----------
  // A plane comes in to land; a moose wanders onto the runway and stops on the centre line; the plane pulls up, flies the circuit over the lodge;
  // the moose strolls off the other side; second time the plane lands, rolls out, taxis up to the hangar and parks; then it all starts again.
  const J = INFO.joke || null, JK = { c: 0, on: false };
  if (J && part.proto_plane && part.proto_moose) try {
    const a = J.rw.a, d = J.rw.d, L = [d[1], -d[0]], q = (t, off = 0) => [a[0] + d[0] * t + L[0] * off, a[1] + d[1] * t + L[1] * off];
    const ys = J.y, rwY = (t) => { if (t <= ys[0][0]) return ys[0][1]; for (let i = 1; i < ys.length; i++) if (t <= ys[i][0]) { const u = (t - ys[i - 1][0]) / (ys[i][0] - ys[i - 1][0]); return ys[i - 1][1] * (1 - u) + ys[i][1] * u; } return ys[ys.length - 1][1]; };
    const tS = J.rw.t0 + 6, tM = 105, tT = 100, tJ = 186, R1 = 55, Y0 = rwY(tM);
    const V = (t, off, h) => { const p = q(t, off); return new THREE.Vector3(p[0], Y0 + h, p[1]); };
    const pts = [V(tS, 0, 24), V(60, 0, 10), V(tM - 18, 0, 4.5), V(tM, 0, 8.5), V(tM + 35, 0, 21), V(tJ + 10, 0, 30)];
    for (let k = 1; k <= 7; k++) { const f = k / 8 * Math.PI, c = q(tJ + 10, R1); pts.push(new THREE.Vector3(c[0] + R1 * Math.sin(f) * d[0] - R1 * Math.cos(f) * L[0], Y0 + 32, c[1] + R1 * Math.sin(f) * d[1] - R1 * Math.cos(f) * L[1])); }
    pts.push(V(tJ + 10, 2 * R1, 34), V(120, 2 * R1, 35), V(45, 2 * R1, 33));
    for (let k = 1; k <= 7; k++) { const f = k / 8 * Math.PI, c = q(45, R1); pts.push(new THREE.Vector3(c[0] - R1 * Math.sin(f) * d[0] + R1 * Math.cos(f) * L[0], Y0 + 30 - k * 0.6, c[1] - R1 * Math.sin(f) * d[1] + R1 * Math.cos(f) * L[1])); }
    pts.push(V(45, 0, 24), V(72, 0, 10), V(tT, 0, 0.6));
    const fly = new THREE.CatmullRomCurve3(pts, false, 'centripetal'); fly.arcLengthDivisions = 600;
    const W3 = (p, y = 0) => new THREE.Vector3(p[0], y, p[1]);
    const taxi = [W3(q(tJ)), ...J.taxi.slice().reverse().map(p => new THREE.Vector3(...p)), new THREE.Vector3(...J.stop)]; taxi[0].y = rwY(tJ);
    const taxiC = new THREE.CatmullRomCurve3(taxi, false, 'centripetal', 0.3);
    const mooseAt = W3(q(tM)); mooseAt.y = rwY(tM);
    let uPass = 0, best = 1e9; for (let i = 0; i <= 300; i++) { const u = i / 300 * 0.35, p = fly.getPointAt(u), dd = Math.hypot(p.x - mooseAt.x, p.z - mooseAt.z); if (dd < best) { best = dd; uPass = u; } }
    const uA = Math.min(0.5, uPass + 0.06), FA = 8, FB = 18, F0 = 1.2, FLY = FA + FB, ROLL = 4.2, TAXI = 7.5, PARK = 4, PERIOD = F0 + FLY + ROLL + TAXI + PARK + 1.2, tPass = F0 + FA * uPass / uA;
    const uOf = (c) => c < F0 + FA ? uA * (c - F0) / FA : uA + (1 - uA) * (c - F0 - FA) / FB;   // slow on the approach so the moose reads, quicker round the circuit
    // the plane: the hidden model, the propeller spinning on its nose
    const planeG = kid('proto_plane'), prop = kid('proto_prop', planeG); if (prop) prop.position.set(0, 1.3, 3.85);
    const mooseG = kid('proto_moose');
    const m0 = W3(q(tM, 17)), m2 = W3(q(tM, -19)); m0.y = groundY(m0.x, m0.z); m2.y = groundY(m2.x, m2.z);
    const tmp = new THREE.Vector3(), tan = new THREE.Vector3(); let lastYaw = 0;
    const orient = (g, tg, roll = 0) => { const yaw = Math.atan2(tg.x, tg.z), pitch = -Math.asin(cl(tg.y / (tg.length() || 1), -1, 1)); g.rotation.set(pitch, yaw, roll, 'YXZ'); return yaw; };
    JK.view = () => ({ at: [mooseAt.x, mooseAt.y + 1, mooseAt.z], dist: innerWidth < 760 ? 150 : 110, el: 0.38, az: 0.62 });
    JK.on = true; JK.set = (c) => { JK.c = c; };
    JK.tick = (dt) => { JK.c = (JK.c + dt) % PERIOD; const c = JK.c;
      // the plane
      let vis = true, s = 1;
      if (c < F0) vis = false;
      else if (c < F0 + FLY) { const u = cl(uOf(c)); fly.getPointAt(u, tmp); fly.getTangentAt(u, tan); planeG.position.copy(tmp);
        const yaw = Math.atan2(tan.x, tan.z); let dy = yaw - lastYaw; while (dy > Math.PI) dy -= 2 * Math.PI; while (dy < -Math.PI) dy += 2 * Math.PI; lastYaw = yaw;
        orient(planeG, tan, cl(-dy / Math.max(dt, 1e-3) * 0.5, -0.6, 0.6)); s = cl((c - F0) / 0.6); }
      else if (c < F0 + FLY + ROLL) { const u = 1 - (1 - cl((c - F0 - FLY) / ROLL)) ** 2, t = tT + (tJ - tT) * u; const p = q(t); planeG.position.set(p[0], rwY(t) + 0.02, p[1]); orient(planeG, tan.set(d[0], 0, d[1])); lastYaw = Math.atan2(d[0], d[1]); }
      else if (c < F0 + FLY + ROLL + TAXI) { const u = sm(cl((c - F0 - FLY - ROLL) / TAXI)); taxiC.getPointAt(u, tmp); taxiC.getTangentAt(u, tan); tan.y = 0; planeG.position.set(tmp.x, tmp.y + 0.02, tmp.z); orient(planeG, tan); }
      else if (c < PERIOD - 1.2) { taxiC.getPointAt(1, tmp); planeG.position.set(tmp.x, tmp.y + 0.02, tmp.z); }
      else { s = 1 - cl((c - (PERIOD - 1.2)) / 0.6); }
      if (planeG) { planeG.visible = vis && s > 0.01; planeG.scale.setScalar(Math.max(1e-3, s) * 1.3); }
      if (prop) prop.rotation.z = (c < PERIOD - 1.2 - PARK + 1.5) ? clock * 42 : prop.rotation.z;
      // the moose: walks out, stands on the centre line, rears its head back as the plane roars over, strolls off the far side, chewing
      let mv = true, mp = m0.clone(), my = Math.atan2(mooseAt.x - m0.x, mooseAt.z - m0.z), mx = 0;
      const w0 = tPass - 6.5, w1 = tPass - 3.2, o0 = tPass + 3.2, o1 = tPass + 11;
      if (c < w0 - 0.5) mv = false;
      else if (c < w1) { const u = sm(cl((c - w0) / (w1 - w0))); mp.lerpVectors(m0, mooseAt, u); mp.y += Math.abs(Math.sin(c * 5.5)) * 0.06 * (u < 1 ? 1 : 0); }
      else if (c < o0) { mp.copy(mooseAt); const k = flash(c, tPass - 0.8, 0.5, 1.4); mx = -0.32 * k; my += Math.sin(c * 1.3) * 0.25 * (1 - k); }
      else if (c < o1) { const u = sm(cl((c - o0) / (o1 - o0))); mp.lerpVectors(mooseAt, m2, u); mp.y += Math.abs(Math.sin(c * 4)) * 0.05; my = Math.atan2(m2.x - mooseAt.x, m2.z - mooseAt.z); }
      else if (c < o1 + 0.8) { mp.copy(m2); my = Math.atan2(m2.x - mooseAt.x, m2.z - mooseAt.z); }
      else mv = false;
      if (mooseG) { mooseG.visible = mv; mooseG.position.copy(mp); mooseG.rotation.set(mx, my, 0, 'YXZ'); mooseG.scale.setScalar(1.6); }
    };
    JK.tick(0);
  } catch (err) { console.warn('cabin creek joke', err); }
  let tourSel = null;
  function tourTick(dt, state) { const id = state.sel && state.sel.id; if (id !== tourSel) { tourSel = id; if (id === 'locals' && JK.on) JK.set(0.2); } }
  window.__cc = { get c() { return JK.c; }, set: (c) => JK.set && JK.set(c), look: (v) => X.goView(v || (JK.view && JK.view()), 0.01), part, root, FX };

  // ---------- card effects (no halo rings) ----------
  const tube = (P, r, m, lift = 0.5) => { const pts = P.map(p => new THREE.Vector3(p[0], (p.length > 2 ? p[1] : groundY(p[0], p[1])) + lift, p.length > 2 ? p[2] : p[1]));
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.2), Math.max(8, pts.length * 10), r, 6, false), m); mesh.renderOrder = 7; return mesh; };
  const flowM = (hex, k) => new THREE.ShaderMaterial({ uniforms: { uC: { value: new THREE.Color(hex).multiplyScalar(k) }, uK: { value: 0 }, uT: { value: 0 }, uR: { value: 30 } }, transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform vec3 uC; uniform float uT, uK, uR; varying vec2 vU; void main(){ float d = 0.45 + 0.55 * smoothstep(0.32, 0.0, abs(fract(vU.x * uR - uT * 1.2) - 0.5)); float reveal = step(vU.x, uK); gl_FragColor = vec4(uC * d, reveal * d); }' });
  // the runway: edge lights come on in a sweep from the south west, the way a pilot sees them at night
  FX.ccrunway = (c) => { const g = new THREE.Group(); if (!J) return { obj: g, mat: lightM(1), tick: () => {} };
    const a = J.rw.a, d = J.rw.d, L = [d[1], -d[0]], N = Math.floor((J.rw.t1 - J.rw.t0) / 8), m = lightM(c.k ?? 2.6), im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.9, 0.5, 0.9), m, N * 2); im.frustumCulled = false; im.renderOrder = 6;
    const m4 = new THREE.Matrix4(), col = new THREE.Color(), pos = [];
    for (let i = 0; i < N; i++) for (const s of [-1, 1]) { const t = J.rw.t0 + 4 + i * 8, x = a[0] + d[0] * t + L[0] * s * (J.rw.w / 2 + 0.8), z = a[1] + d[1] * t + L[1] * s * (J.rw.w / 2 + 0.8); pos.push(i); m4.makeTranslation(x, groundY(x, z) + 0.6, z); im.setMatrixAt(pos.length - 1, m4); im.setColorAt(pos.length - 1, col.setScalar(0)); }
    g.add(im); return { obj: g, mat: m, tick: (t, k) => { pos.forEach((i, j) => { const at = 0.3 + i * 0.06; im.setColorAt(j, col.setScalar((flash(t, at, 0.15, 2) * 1.2 + (t > at ? 0.55 : 0)) * k)); }); im.instanceColor.needsUpdate = true; } }; };
  // taxi to the door: a moving line of light from the runway up the taxiway, across the apron, into the open hangar
  FX.cctaxi = (c) => { const g = new THREE.Group(); if (!J) return { obj: g, mat: lightM(1), tick: () => {} };
    const P = [[...(() => { const t = 186; return [J.rw.a[0] + J.rw.d[0] * t, J.rw.a[1] + J.rw.d[1] * t]; })()], ...J.taxi.slice().reverse().map(p => [p[0], p[2]]), [J.stop[0], J.stop[2]]];
    const HF = INFO.office; if (HF) P.push([HF.at[0] + Math.cos(HF.f) * 6, HF.at[2] - Math.sin(HF.f) * 6]);
    const m = flowM('#ffd27a', c.k ?? 2.2); g.add(tube(P, 0.75, m, 0.55));
    return { obj: g, mat: m, tick: (t, k) => { m.uniforms.uT.value = t; m.uniforms.uK.value = cl(t * 0.6) * (k > 0.02 ? 1 : 0); m.uniforms.uC.value.set('#ffd27a').multiplyScalar((c.k ?? 2.2) * k); } }; };
  // off grid ready: the solar panels glow, power runs from the hangar roof along the drive to the lodge
  FX.ccsun = (c) => { const g = new THREE.Group(), HF = INFO.office, LG = INFO.lodge, solar = MATS.filter(m => m.name === 'solar'), s0 = solar.map(m => m.emissive.clone());
    if (!HF || !LG) return { obj: g, mat: lightM(1), tick: () => {} };
    const P = [[HF.at[0], HF.at[1] + 7.5, HF.at[2]], [HF.at[0] - 14, HF.at[1] + 4, HF.at[2] + 10], [LG.at[0] + 12, LG.at[1] + 4, LG.at[2] - 8], [LG.at[0], LG.at[1] + 6.5, LG.at[2]]];
    const m = flowM('#7fe3ff', c.k ?? 2.4); m.uniforms.uR.value = 10; g.add(tube(P, 0.45, m, 0));
    return { obj: g, mat: m, tick: (t, k) => { m.uniforms.uT.value = t; m.uniforms.uK.value = cl(t * 0.7) * (k > 0.02 ? 1 : 0); m.uniforms.uC.value.set('#7fe3ff').multiplyScalar((c.k ?? 2.4) * k);
      solar.forEach((sm_, i) => { sm_.emissive.copy(s0[i]).lerp(new THREE.Color('#3f7cff'), 0.7 * k * (0.75 + 0.25 * Math.sin(t * 3))); sm_.emissiveIntensity = 1; }); },
      off: () => solar.forEach((sm_, i) => sm_.emissive.copy(s0[i])) }; };
  // Room to grow: a walking trail draws in through the pines, six small guest cabins rise one by one in the clearings
  FX.ccgrow = (c) => { const g = new THREE.Group(), all = INFO.grow || [], rots = INFO.growRot || [], N = Math.min(all.length, c.n ?? 6);
    const trailM = new THREE.MeshStandardMaterial({ color: '#cfc4ae', roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -6 });
    const trails = (INFO.growTrail || []).map(P => { const pts = P.map(([x, z]) => new THREE.Vector3(x, groundY(x, z) + 0.12, z)), curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.3); return { curve, n: pts.length }; });
    const trailMeshes = trails.map(() => { const m = new THREE.Mesh(new THREE.BufferGeometry(), trailM); m.receiveShadow = true; g.add(m); return m; }); let lastF = -1;
    const cabGeo = []; if (part.proto_cabin) part.proto_cabin.traverse(o => { if (o.isMesh) { const gg = o.geometry.clone(); o.updateMatrix(); gg.applyMatrix4(o.matrix); gg.translate(0, -PY, 0); cabGeo.push([gg, o.material]); } });
    const cabI = cabGeo.map(([gg, mm]) => { const im = new THREE.InstancedMesh(gg, mm, N); im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false; g.add(im); return im; });
    const ghostM = lightM(c.k ?? 1.5), ghost = new THREE.InstancedMesh(new THREE.BoxGeometry(4.2, 4.4, 8.0), ghostM, N); ghost.frustumCulled = false; ghost.renderOrder = 5; for (let i = 0; i < N; i++) ghost.setColorAt(i, new THREE.Color(0, 0, 0)); g.add(ghost);
    const m4 = new THREE.Matrix4(), qq = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), pv = new THREE.Vector3(), sv = new THREE.Vector3(), col = new THREE.Color();
    return { obj: g, mat: ghostM, tick: (t) => {
      const f = Math.round(sm(cl((t - 0.2) / 1.6)) * 40) / 40; if (f !== lastF) { lastF = f; trails.forEach((tr, i) => { trailMeshes[i].visible = f > 0.02; if (f > 0.02) { const pts = tr.curve.getSpacedPoints(Math.max(4, tr.n * 6)).slice(0, Math.max(2, Math.round(tr.n * 6 * f)));
        trailMeshes[i].geometry.dispose(); trailMeshes[i].geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.max(4, pts.length), 1.1, 5, false); trailMeshes[i].scale.set(1, 0.12, 1); trailMeshes[i].position.y = 0; } }); }
      for (let i = 0; i < N; i++) { const p = all[i], a = 1.4 + i * 0.35, u = cl((t - a) / 0.7), b = back(u); qq.setFromAxisAngle(up, rots[i] || 0);
        m4.compose(pv.set(p[0], p[1] - 4 + 4 * b, p[2]), qq, sv.setScalar(u > 0 ? 1 : 1e-4)); cabI.forEach(im => im.setMatrixAt(i, m4));
        const gb = flash(t, a, 0.35, 1.3); m4.compose(pv.set(p[0], p[1] + 2.2, p[2]), qq, sv.setScalar(gb > 0.004 ? 1 : 1e-4)); ghost.setMatrixAt(i, m4); ghost.setColorAt(i, col.setScalar(gb)); }
      cabI.forEach(im => { im.instanceMatrix.needsUpdate = true; }); ghost.instanceMatrix.needsUpdate = true; ghost.instanceColor.needsUpdate = true; } }; };

  // ---------- every frame ----------
  function tick(dt, state = {}) { base.tick(dt, state); clock += dt;
    if (JK.tick) JK.tick(dt); tourTick(dt, state); tickRoof(dt, state.sel); tickLodge(dt, state.sel); rwTick(clock); tickFire(clock);
    PEOPLE.tick(dt, clock);
    ribU.uT.value = clock; ribU.uK.value = 1.1 + 0.6 * (base.dusk ? base.dusk() : 0); }
  return { fx: FX, tick, dusk: base.dusk };
}
