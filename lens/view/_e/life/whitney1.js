// Whitney Rose RV Park life layer (whitney1, 16-11-2026, built by Sonnet). The Wagon Box and Tyler pattern (life1 underneath: Sunset switch, the backdrop,
// tap a thing to open its card, Find your site; the border ribbon; ground grain) with this park's own pieces:
// - the white container building opens like a doll's house: on the office card the lid lifts away to show the office, two shower rooms and the laundry
// - the hookup pedestals glow one by one down the rows on the power card; the 61 pads frame in light on the sites card
// - SUNSET (website photo 6, the owners' own favourite picture): porch lights come on along all three rows in a wave out from the office, the
//   pedestals glow, the container's lights and the lamp by it come on
// - residents walk the loop and the centre strip, two dogs run the dog park
// - the joke, "Coffee on the roof": at dawn a resident in a hi-vis vest comes out of his trailer carrying a coffee, sets it on the roof of his pickup,
//   climbs in and drives round the gravel loop with the cup still riding on the roof. It never falls. At the gate he stops, reaches out of the window,
//   takes the cup down, has a sip and turns onto the road. Later the pickup comes home. No card, no tour stop and no camera move point at it.
// - Room to grow (the film's idea): the 8 built sites still to lease take a rig each, GROWING UP OUT OF THE GROUND (never flying in), the first one
//   first, each on a pool of white light that warms. Nothing new is built: the broker's upside is the sites already there.
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
  const flash = (t, a, d, decay = 2.2) => t <= a ? 0 : t < a + d ? (t - a) / d : Math.exp(-(t - a - d) * decay);
  const FX = Object.assign({}, base.fx);
  const root = new THREE.Group(); root.name = 'whitney_life'; model.add(root);
  const groundY = base.groundY || X.groundY;
  const dusk = () => (base.dusk ? base.dusk() : 0);
  let clock = 0;
  const lightM = (k, o = {}) => new THREE.MeshBasicMaterial(Object.assign({ color: new THREE.Color('#fff4dc').multiplyScalar(k), toneMapped: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }, o));
  const kidGeo = (name) => { const out = []; if (!part[name]) return out; part[name].traverse(o => { if (o.isMesh) { const g = o.geometry.clone(); o.updateMatrix(); g.applyMatrix4(o.matrix); g.translate(0, -PY, 0); out.push([g, o.material]); } }); return out; };
  const instOf = (name, n, parent = root) => { const G = kidGeo(name); if (!G.length || !n) return null; const ims = G.map(([g, m]) => { const im = new THREE.InstancedMesh(g, m, n); im.castShadow = true; im.frustumCulled = false; parent.add(im); return im; });
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0), pv = new THREE.Vector3(), sv = new THREE.Vector3();
    return { set(i, x, y, z, ry = 0, s = 1) { q.setFromAxisAngle(Y, ry); m4.compose(pv.set(x, y, z), q, sv.setScalar(Math.max(1e-4, s))); ims.forEach(im => im.setMatrixAt(i, m4)); },
      hide(i) { this.set(i, 0, PY, 0, 0, 1e-4); }, done() { ims.forEach(im => { im.instanceMatrix.needsUpdate = true; }); } }; };
  const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const sprite = (col, size, op = 0) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: new THREE.Color(col), toneMapped: false, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending })); s.scale.setScalar(size); s.renderOrder = 7; root.add(s); return s; };

  // ---------- the land for sale: a ribbon of the broker's sky blue round the county parcel, always on, stronger at sunset ----------
  const ribU = { uK: { value: 1 }, uT: { value: 0 } }, HG = HERO.clone();
  try { if (part.border) { const bm = new THREE.MeshBasicMaterial({ color: HG.clone().multiplyScalar(2.4), toneMapped: false }); part.border.traverse(o => { if (o.isMesh) { o.material = bm; o.castShadow = false; } }); }
    const BP = INFO.border || []; if (BP.length > 4) { const W2 = 7, pos = [], uv = [], idx = [];
      for (let i = 0; i < BP.length; i++) { const a = BP[Math.max(0, i - 1)], b = BP[Math.min(BP.length - 1, i + 1)], p = BP[i]; let dx = b[0] - a[0], dz = b[2] - a[2]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
        pos.push(p[0] - dz * W2, p[1] + 0.15, p[2] + dx * W2, p[0] + dz * W2, p[1] + 0.15, p[2] - dx * W2); uv.push(0, i, 1, i); if (i) { const k = (i - 1) * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
      const m = new THREE.ShaderMaterial({ uniforms: Object.assign(ribU, { uC: { value: new THREE.Vector3(HG.r, HG.g, HG.b) } }), transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
        vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: 'uniform float uK, uT; uniform vec3 uC; varying vec2 vU; void main(){ float d = abs(vU.x - 0.5) * 2.0; float a = exp(-d * d * 5.0) * 0.5 + exp(-d * d * 40.0) * 0.6; float run = 0.85 + 0.15 * sin(vU.y * 0.25 - uT * 2.0); gl_FragColor = vec4(mix(uC * 0.9, mix(uC, vec3(1.0), 0.4), exp(-d * d * 60.0)), clamp(a * uK * run, 0.0, 0.9)); }' });
      const rib = new THREE.Mesh(g, m); rib.name = 'borderGlow'; rib.renderOrder = 6; rib.frustumCulled = false; model.add(rib); } } catch (err) { console.warn('border', err); }

  // ---------- a fine grain on the ground ----------
  try { if (part.ground) { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), id = x.createImageData(256, 256);
      const H = new Float32Array(256 * 256); let s = 7; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
      for (let o = 0; o < 6; o++) { const f = 2 ** (o + 2), amp = 1 / (o + 1.2), G = []; for (let i = 0; i < f * f; i++) G.push(r());
        for (let j = 0; j < 256; j++) for (let i = 0; i < 256; i++) { const u = i / 256 * f, w = j / 256 * f, i0 = Math.floor(u), j0 = Math.floor(w), a = u - i0, b = w - j0, Pq = (p, q) => G[(q % f) * f + (p % f)];
          const aa = a * a * (3 - 2 * a), bb = b * b * (3 - 2 * b); H[j * 256 + i] += amp * ((Pq(i0, j0) * (1 - aa) + Pq(i0 + 1, j0) * aa) * (1 - bb) + (Pq(i0, j0 + 1) * (1 - aa) + Pq(i0 + 1, j0 + 1) * aa) * bb); } }
      for (let j = 0; j < 256; j++) for (let i = 0; i < 256; i++) { const k = (j * 256 + i) * 4, dx = H[j * 256 + (i + 1) % 256] - H[j * 256 + (i + 255) % 256], dz = H[((j + 1) % 256) * 256 + i] - H[((j + 255) % 256) * 256 + i];
        const nn = new THREE.Vector3(-dx * 3, -dz * 3, 1).normalize(); id.data[k] = (nn.x * 0.5 + 0.5) * 255; id.data[k + 1] = (nn.y * 0.5 + 0.5) * 255; id.data[k + 2] = (nn.z * 0.5 + 0.5) * 255; id.data[k + 3] = 255; }
      x.putImageData(id, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(80, 80); t.anisotropy = 4;
      part.ground.traverse(o => { if (o.isMesh && o.material && o.material.map) { o.material.normalMap = t; o.material.normalScale = new THREE.Vector2(0.3, 0.3); o.material.roughness = 1; o.material.metalness = 0; o.material.envMapIntensity = Math.min(o.material.envMapIntensity ?? 1, 0.35); o.material.needsUpdate = true; } }); } } catch (err) { console.warn('grain', err); }

  // ---------- the container building opens: the lid lifts straight up and slides back off the rooms on the office card ----------
  const CT = INFO.container || null; let rC = 0;
  const away = CT ? [-Math.sin(CT.f), -Math.cos(CT.f)] : [0, -1];     // the building's local -z: away from the deck
  function tickLid(dt, sel) { if (!CT || !part.container_roof) return; const on = sel && sel.id === 'office' ? 1 : 0; rC += (on - rC) * Math.min(1, (on ? 1.5 : 3) * dt);
    const g = sm(rC), bob = !reduced ? Math.sin(clock * 1.3) * 0.1 : 0;
    part.container_roof.position.set(away[0] * 7 * g, 9 * Math.sin(Math.PI * 0.5 * Math.min(1, g * 1.3)) + (g > 0.99 ? bob : 0), away[1] * 7 * g); part.container_roof.traverse(m => { if (m.isMesh) m.castShadow = g < 0.05; }); }

  // ---------- card effects: the 61 pads frame in light (sites), the pedestals glow one by one (power) ----------
  const sitePads = INFO.sitePads || [], siteRot = INFO.siteRot || [], siteLen = INFO.siteLen || [], vacantP = INFO.padVacant || [];
  const ent = INFO.lanes && INFO.lanes.entry ? INFO.lanes.entry[0] : [0, 0];
  FX.wrpads = (c) => { const g = new THREE.Group(), n = sitePads.length, m = lightM(c.k ?? 2.2), sides = [];
    const bar = new THREE.BoxGeometry(1, 0.12, 1); for (let s = 0; s < 4; s++) { const im = new THREE.InstancedMesh(bar, m, n); im.frustumCulled = false; im.renderOrder = 5; for (let i = 0; i < n; i++) im.setColorAt(i, new THREE.Color(0, 0, 0)); g.add(im); sides.push(im); }
    const order = sitePads.map(p => Math.hypot(p[0] - ent[0], p[2] - ent[1])), dmax = Math.max(...order);
    const pv = new THREE.Vector3(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), col = new THREE.Color(), m4 = new THREE.Matrix4();
    sitePads.forEach((p, i) => { const L = siteLen[i] || 15, W = 4.8; q.setFromAxisAngle(up, siteRot[i] || 0);
      const ux = new THREE.Vector3(1, 0, 0).applyQuaternion(q), uz = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
      [[ux, W / 2, 0.24, L], [ux, -W / 2, 0.24, L], [uz, L / 2, W, 0.24], [uz, -L / 2, W, 0.24]].forEach(([u, o, sx, sz], s) => { pv.set(p[0], p[1] + 0.3, p[2]).addScaledVector(u, o); m4.compose(pv, q, new THREE.Vector3(sx, 1, sz)); sides[s].setMatrixAt(i, m4); }); });
    return { obj: g, mat: m, tick: (t, k) => { sitePads.forEach((p, i) => { const a = 0.3 + order[i] / dmax * 2.0, b = flash(t, a, 0.25, 1.6) * 0.9 + (t > a ? (vacantP[i] ? 0.15 : 0.4) : 0); col.setScalar(b * k); sides.forEach(s => s.setColorAt(i, col)); });
      sides.forEach(s => { s.instanceColor.needsUpdate = true; }); } }; };
  const PED = (INFO.bulbs && INFO.bulbs.pedestals) || [];
  FX.wrped = (c) => { const g = new THREE.Group(), n = PED.length, m = lightM(c.k ?? 2.4, { color: new THREE.Color('#bfe2ff').multiplyScalar(c.k ?? 2.4) });
    const im = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.5, 0.5, 1.6, 10), m, Math.max(1, n)); im.frustumCulled = false; im.renderOrder = 5; for (let i = 0; i < n; i++) im.setColorAt(i, new THREE.Color(0, 0, 0)); g.add(im);
    const m4 = new THREE.Matrix4(), pv = new THREE.Vector3(), col = new THREE.Color(), q = new THREE.Quaternion();
    // one by one down each row, row A then B then C, no counting number
    const rowIdx = (INFO.padId || []).map((id, i) => ({ i, r: id ? id[0] : 'A', n: +(id || 'A0').slice(1) })).sort((a, b) => (a.r + String(100 + a.n)).localeCompare(b.r + String(100 + b.n))); const rank = []; rowIdx.forEach((o, k) => { rank[o.i] = k; });
    PED.forEach((p, i) => { m4.compose(pv.set(p[0], p[1], p[2]), q, new THREE.Vector3(1, 1, 1)); im.setMatrixAt(i, m4); });
    return { obj: g, mat: m, tick: (t, k) => { PED.forEach((p, i) => { const a = 0.4 + (rank[i] || 0) * 0.05, b = flash(t, a, 0.3, 1.3) * 1.0 + (t > a ? 0.55 : 0); col.setScalar(b * k); im.setColorAt(i, col); }); im.instanceColor.needsUpdate = true; } }; };

  // ---------- residents walking the loop and the centre strip, two dogs running the dog park ----------
  const WK = (INFO.people && INFO.people.walkers) || [], frames = [], STRIDE = 1.4, NW = WK.length;
  for (let k = 0; k < 8; k++) frames.push(instOf('proto_person_w' + k, NW + 1));
  const standI = instOf('proto_person', NW + 1), vestI = instOf('proto_vest', 1);
  const walkers = WK.map((w, i) => { const P = w.pts, cum = [0]; for (let k = 1; k < P.length; k++) cum.push(cum[k - 1] + Math.hypot(P[k][0] - P[k - 1][0], P[k][1] - P[k - 1][1]));
    return { i, P, cum, len: cum[cum.length - 1] || 1, d: (w.t0 || 0) * (cum[cum.length - 1] || 1), dir: 1, sp: w.speed || 1, wait: 0, walked: Math.random() * 3, f: -2, h: null, face: w.face }; });
  const hideW = (w) => { if (w.f >= 0 && frames[w.f]) frames[w.f].hide(w.i); else if (w.f === -1 && standI) standI.hide(w.i); w.f = -2; };
  function tickWalk(dt) { const TS = (SC.life || {}).speed ?? 1.5;
    for (const w of walkers) {
      if (!reduced) { if (w.wait > 0) w.wait -= dt; else { const st = w.sp * dt * TS * 0.7; w.d += w.dir * st; w.walked += st; if (w.d > w.len) { w.d = w.len; w.dir = -1; w.wait = w.face ? 5 : 3; } else if (w.d < 0) { w.d = 0; w.dir = 1; w.wait = w.face ? 5 : 3; } } }
      let k = 1; while (k < w.cum.length - 1 && w.cum[k] < w.d) k++; const a = w.P[k - 1], b = w.P[k], u = cl((w.d - w.cum[k - 1]) / ((w.cum[k] - w.cum[k - 1]) || 1)), x = a[0] + (b[0] - a[0]) * u, z = a[1] + (b[1] - a[1]) * u;
      let want = Math.atan2((b[0] - a[0]) * w.dir, (b[1] - a[1]) * w.dir); if (w.wait > 0 && w.face) want = Math.atan2(w.face[0] - x, w.face[1] - z);
      w.h = w.h == null || reduced ? want : w.h + Math.atan2(Math.sin(want - w.h), Math.cos(want - w.h)) * Math.min(1, 4 * dt);
      const f = reduced || w.wait > 0 ? -1 : Math.floor((w.walked / STRIDE) * 8) % 8; if (f !== w.f) { if (w.f >= 0 && frames[w.f]) frames[w.f].hide(w.i); else if (w.f === -1 && standI) standI.hide(w.i); w.f = f; }
      const I = f >= 0 ? frames[f] : standI; if (I) I.set(w.i, x, groundY(x, z) + 0.02, z, w.h); } }
  const DP = INFO.dogPark || [], dogI = instOf('proto_dog', 2);
  function tickDogs(t) { if (!dogI || DP.length < 4) return; const cx = (DP[0][0] + DP[2][0]) / 2, cz = (DP[0][1] + DP[2][1]) / 2, ax = (DP[1][0] - DP[0][0]) / 2, az = (DP[1][1] - DP[0][1]) / 2, bx = (DP[3][0] - DP[0][0]) / 2, bz = (DP[3][1] - DP[0][1]) / 2;
    for (let i = 0; i < 2; i++) { const a = (reduced ? 0.6 : t) * (0.5 + 0.12 * i) + i * 2.6, u = Math.cos(a) * 0.62, w = Math.sin(a * 1.3 + i) * 0.55, x = cx + ax * u + bx * w, z = cz + az * u + bz * w, dx = -Math.sin(a) * 0.62 * 0.5, dw = Math.cos(a * 1.3 + i) * 0.55 * 1.3 * 0.5;
      const hx = ax * dx + bx * dw, hz = az * dx + bz * dw; dogI.set(i, x, groundY(x, z) + (reduced ? 0 : Math.abs(Math.sin(t * 7 + i * 1.7)) * 0.12), z, Math.atan2(hx, hz), 1); } dogI.done(); }

  // ---------- "Coffee on the roof": a loop of about 2 minutes ----------
  const J = INFO.joke || null, jT = part.joke_truck, jC = part.joke_cup;
  let jokeT = 0, jHead = null;
  const path = J ? J.path.map(([x, z]) => [x, z]) : [], cum = [0]; for (let k = 1; k < path.length; k++) cum.push(cum[k - 1] + Math.hypot(path[k][0] - path[k - 1][0], path[k][1] - path[k - 1][1]));
  const LALL = cum[cum.length - 1] || 1;
  let LGATE = 0; if (J) { let bd = 1e9; for (let k = 0; k < path.length; k++) { const d = Math.hypot(path[k][0] - J.gatePt[0], path[k][1] - J.gatePt[1]); if (d < bd) { bd = d; LGATE = cum[k]; } } }
  const V1 = 4.2, V2 = 11, TW = 7.0, TSTART = 9.0, TSTOP = TSTART + LGATE / V1, TLEAVE = TSTOP + 6.5, TEND = TLEAVE + (LALL - LGATE) / V2, TRET = TEND + 6, TBACK = TRET + LALL / V2, CYC = TBACK + 14;
  const posAt = (d) => { d = cl(d, 0, LALL); let k = 1; while (k < cum.length - 1 && cum[k] < d) k++; const a = path[k - 1], b = path[k], u = cl((d - cum[k - 1]) / ((cum[k] - cum[k - 1]) || 1)); return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, Math.atan2(b[0] - a[0], b[1] - a[1])]; };
  const tr0 = J ? J.truck : [0, 0, 0, 0], cup0 = J ? J.cupAt : [0, 0, 0];
  const resP = J ? J.res : [[0, 0], [1, 1]], resL = Math.hypot(resP[1][0] - resP[0][0], resP[1][1] - resP[0][1]) || 1, resH = Math.atan2(resP[1][0] - resP[0][0], resP[1][1] - resP[0][1]);
  const mt = new THREE.Matrix4(), mr = new THREE.Matrix4(), ms = new THREE.Matrix4(), mo = new THREE.Matrix4();
  const truckM = (x, z, h) => { mt.makeTranslation(x, groundY(x, z) - tr0[1] + 0.0, z).multiply(mr.makeRotationY(h - tr0[3])).multiply(ms.makeTranslation(-tr0[0], 0, -tr0[2])); return mt; };
  function tickJoke(dt) { if (!J || !jT) return; jokeT = reduced ? 3.5 : (jokeT + dt) % CYC; const t = jokeT;
    // where the truck is, and how it is heading
    let x = tr0[0], z = tr0[2], h = tr0[3], vis = true, cupVis = true, cupMode = 'roof';
    if (t < TSTART) { /* parked */ } else if (t < TSTOP) { const [px, pz, ph] = posAt((t - TSTART) * V1 * (0.4 + 0.6 * sm((t - TSTART) / 3))); x = px; z = pz; h = ph; }
    else if (t < TLEAVE) { const [px, pz, ph] = posAt(LGATE); x = px; z = pz; h = ph; cupMode = 'down'; }
    else if (t < TEND) { const [px, pz, ph] = posAt(LGATE + (t - TLEAVE) * V2 * sm((t - TLEAVE) / 2)); x = px; z = pz; h = ph; cupVis = false; }
    else if (t < TRET) { vis = false; cupVis = false; }
    else if (t < TBACK) { const d = LALL - (t - TRET) * V2; const [px, pz, ph] = posAt(d); x = px; z = pz; h = ph + Math.PI; cupVis = false; }
    else { cupVis = false; }
    if (t >= TBACK) { x = tr0[0]; z = tr0[2]; h = tr0[3]; }
    // heading smoothing so corners turn rather than snap
    if (jHead == null || reduced || t < TSTART || t >= TBACK) jHead = h; else jHead += Math.atan2(Math.sin(h - jHead), Math.cos(h - jHead)) * Math.min(1, 6 * dt);
    jT.visible = vis; jT.matrixAutoUpdate = false; truckM(x, z, jHead); jT.matrix.copy(mt); jT.matrixWorldNeedsUpdate = true;
    if (jC) { jC.matrixAutoUpdate = false;
      if (t < 5.4) { cupVis = !reduced || true; /* in his hand while he walks to the truck */ const u = cl(t / TW * 1.1), px = J.res[0][0] + (J.res[1][0] - J.res[0][0]) * u, pz = J.res[0][1] + (J.res[1][1] - J.res[0][1]) * u;
        jC.matrix.makeTranslation(px + Math.sin(resH) * 0.3 - cup0[0], groundY(px, pz) + 1.05 - cup0[1], pz + Math.cos(resH) * 0.3 - cup0[2]); }
      else if (t < 6.0) { const k = sm((t - 5.4) / 0.6), px = J.res[1][0], pz = J.res[1][1]; jC.matrix.makeTranslation((px + Math.sin(resH) * 0.3 - cup0[0]) * (1 - k), (groundY(px, pz) + 1.05 - cup0[1]) * (1 - k), (pz + Math.cos(resH) * 0.3 - cup0[2]) * (1 - k)); }
      else { jC.matrix.copy(mt);
        if (cupMode === 'down') { const k = t - TSTOP, ry = tr0[3], dx = (tr0[0] + 0.95 * Math.cos(ry) + 0.3 * Math.sin(ry)) - cup0[0], dz = (tr0[2] - 0.95 * Math.sin(ry) + 0.3 * Math.cos(ry)) - cup0[2], dy = (tr0[1] + 1.38) - cup0[1];
          const a = sm((k - 0.6) / 1.2), sip = k > 2.6 && k < 4.2 ? Math.sin((k - 2.6) / 1.6 * Math.PI) * 0.12 : 0, gone = k > 5.0;
          jC.matrix.multiply(mo.makeTranslation(dx * a, dy * a + sip * a, dz * a)); if (gone) cupVis = false; } }
      jC.visible = cupVis && !(t >= TEND && t < TBACK + 14); jC.matrixWorldNeedsUpdate = true; }
    // the resident: out of his trailer, to the truck, in
    const RI = NW; const res = t < TW + 0.6;
    if (frames[0]) { if (res) { const u = cl(t / TW * 1.1), px = J.res[0][0] + (J.res[1][0] - J.res[0][0]) * u, pz = J.res[0][1] + (J.res[1][1] - J.res[0][1]) * u, walking = u < 1 && !reduced, f = walking ? Math.floor((t * 1.15 / STRIDE * 1.4) * 8) % 8 : -1;
        frames.forEach((I) => I && I.hide(RI)); if (standI) standI.hide(RI); const I = f >= 0 ? frames[f] : standI; if (I) I.set(RI, px, groundY(px, pz) + 0.02, pz, resH);
        if (vestI) vestI.set(0, px, groundY(px, pz) + 0.02, pz, resH); }
      else { frames.forEach((I) => I && I.hide(RI)); if (standI) standI.hide(RI); if (vestI) vestI.hide(0); } frames.forEach(f => f && f.done()); if (standI) standI.done(); if (vestI) vestI.done(); } }
  if (!walkers.length) frames.forEach(f => { if (f) { f.hide(0); f.done(); } });

  // ---------- lights for Sunset: the container, the lamp, a porch light at every rig in a wave out from the office, the pedestals ----------
  const BL = INFO.bulbs || {}, ALL = [], offAt = CT ? CT.at : [0, 0, 0];
  const order = { office: 0, rooms: 0.04, lamp: 0.06, porches: 0.12, pedestals: 0.3 };
  for (const [k, L] of Object.entries(BL)) (L || []).forEach((p) => ALL.push({ p, k, d: (order[k] ?? 0.3) + (k === 'porches' || k === 'pedestals' ? 0.6 * Math.min(1, Math.hypot(p[0] - offAt[0], p[2] - offAt[2]) / 230) : 0) }));
  const col = { office: [1.0, 0.8, 0.5], rooms: [1.0, 0.86, 0.6], lamp: [1.0, 0.85, 0.55], porches: [1.0, 0.68, 0.38], pedestals: [0.6, 0.85, 1.0] };
  const ptsG = new THREE.BufferGeometry(); { const a = []; ALL.forEach(b => a.push(b.p[0], b.p[1], b.p[2])); ptsG.setAttribute('position', new THREE.Float32BufferAttribute(a, 3)); ptsG.setAttribute('color', new THREE.BufferAttribute(new Float32Array(a.length), 3)); }
  const ptsM = new THREE.PointsMaterial({ size: 5, sizeAttenuation: false, opacity: 0.6, map: glowTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const bulbPts = new THREE.Points(ptsG, ptsM); bulbPts.frustumCulled = false; bulbPts.renderOrder = 7; root.add(bulbPts);
  let lastLit = -1;
  function tickBulbs(t) { const dk = dusk(), wave = cl((dk - 0.3) / 0.6) * 1.25, key = Math.round(wave * 80) + Math.round(t * 4) * 1e4; if (key === lastLit) return; lastLit = key;
    const cA = ptsG.attributes.color.array; ALL.forEach((b, i) => { const vv = sm((wave - b.d) / 0.2), tw = reduced ? 1 : 0.9 + 0.1 * Math.sin(t * 3 + i * 1.7), c = col[b.k] || col.porches; cA[i * 3] = vv * tw * c[0]; cA[i * 3 + 1] = vv * tw * c[1]; cA[i * 3 + 2] = vv * tw * c[2]; });
    ptsG.attributes.color.needsUpdate = true; bulbPts.visible = dk > 0.02; }

  // ---------- Room to grow: the 8 vacant sites take a rig each, growing up out of the ground, the first one first ----------
  const GR = INFO.grow || {}, GU = GR.units || [];
  const names = Object.keys(part).filter(n => n.startsWith('grow_')); names.forEach(n => { part[n].visible = false; });
  const pools = GU.map(u => { const s = sprite('#ffffff', 14); s.position.set(u.at[0], u.at[1] + 1.0, u.at[2]); s.visible = false; return s; });
  const tagSet = (txt) => { if (X.GROW && X.GROW.tag) X.GROW.tag.text = txt; };
  const TAG1 = (SC.life && SC.life.growTag1) || 'Idea: the 8 built sites ready to lease', TAG2 = (SC.life && SC.life.growTag2) || 'Room to raise rents';
  let growT = 0, wasGrow = false;
  function tickGrow(dt, on) { if (on && !wasGrow) growT = 0; wasGrow = on;
    if (!on) { names.forEach(n => { part[n].visible = false; }); pools.forEach(p => { p.visible = false; }); return; }
    growT += reduced ? 99 : dt; const t = growT;
    GU.forEach((u, i) => { const pt = part[u.part]; if (!pt) return; const a = t - 0.3 - u.t, k = cl(a / 1.7); pt.visible = k > 0; pt.position.y = -(u.h + 0.3) * (1 - back(k));
      const p = pools[i]; p.visible = a > -0.4 && a < 4; p.material.opacity = 0.5 * sm((a + 0.4) / 0.4) * (1 - sm((a - 1.7) / 2.2)); });
    tagSet(t < 6 ? TAG1 : TAG2); }

  // ---------- every frame ----------
  function tick(dt, state = {}) { base.tick(dt, state); clock += dt;
    tickLid(dt, state.sel); tickDogs(clock); tickJoke(dt); tickWalk(dt); tickBulbs(clock); tickGrow(dt, !!state.growOn);
    ribU.uT.value = clock; ribU.uK.value = 1.0 + 0.6 * dusk(); }
  window.__wr = { part, root, FX, truck0: tr0, joke: (c) => { jokeT = c; }, look: (v) => X.goView(v, 0.01), cyc: () => ({ CYC, TSTART, TSTOP, TLEAVE, TEND, TRET, TBACK, LALL, LGATE }) };
  return { fx: FX, tick, dusk: base.dusk };
}
