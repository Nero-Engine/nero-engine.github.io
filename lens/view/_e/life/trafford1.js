// Lake Trafford Marina life layer (trafford1, 12-11-2026). Built on life1 (Sunset, lamps, moving water, pickups on Lake Trafford Road)
// and people1 (library people who really walk: on the boardwalk, round the store, down the RV lane with a dog, standing on the deck).
// Always on: an airboat tour backs out of its slip, runs down the canal to Lake Trafford, loops the lake and comes home; a second airboat
// works the far side of the lake; gulls over the water; a soft ribbon of blue light round the land for sale.
// The funny touch: the alligator on the canal bank by the docks. It lies there, then now and then slides into the water, has a little swim,
// climbs back out and turns round to face the canal again, as if nothing happened.
// Room to grow (fx type tmBuild, the film's grow scene, layout illustrative): the spare land outlines in light, 16 cabins build west to east,
// a waterfront restaurant rises with its deck, a new boardwalk with finger docks rises from the canal and boats glide into the new slips,
// then a nature education center. Every piece is labelled an idea. It moves in the web viewer only: the AR file stays a still model.
import { initPeople } from './people1.js?v=1';
let THREE;

export async function init(X) {
  THREE = X.THREE;
  const v = new URL(import.meta.url).searchParams.get('l1');
  const base = await (await import('./life1.js' + (v ? '?v=' + v : ''))).init(X);
  const { model, part, INFO, SC, GROW, NV, camera, HERO } = X; const GM = X.GLOWMATS || [];
  const reduced = !!NV.reduced, CFG = SC.life || {}, TS = CFG.speed ?? 1.5, LAND = INFO.land ?? 0.6, WY = INFO.waterY ?? 0, PY = (INFO.protoAt || [0, -8, 0])[1];
  const TM = INFO.tm || {}, GR = TM.grow || {};
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), ease = (k) => { k = clamp(k); return k * k * (3 - 2 * k); };
  const back = (k) => { if (k <= 0) return 0; if (k >= 1) return 1; const c = 1.7, x = k - 1; return 1 + (c + 1) * x * x * x + c * x * x; };
  const root = new THREE.Group(); root.name = 'trafford_life'; model.add(root);
  // the Florida sun makes white roofs, gravel, airboat seats, RVs and gulls bloom into white blobs: a calmer white everywhere
  (X.MATS || []).forEach(m => { if (m.name === 'ground' && m.color) { m.color.setScalar(0.84); if (m.userData.c0) m.userData.c0.copy(m.color); return; }   // the white sand strip in the aerial photo blooms too
    if (!m.color || /^(glass|sign|ground|lake|plinth|band|border)/.test(m.name || '')) return;
    const a = (m.color.r + m.color.g + m.color.b) / 3, cap = m.map ? 0.8 : 0.62;
    if (a > cap) { m.color.multiplyScalar(cap / a); if (m.userData.c0) m.userData.c0.copy(m.color); m.userData.lum = Math.min(m.userData.lum ?? 1, 0.55); } });
  const PEOPLE = initPeople(X, root);

  // ---------- instanced copies of a hidden piece, and plain copies (same idea as walnut2) ----------
  function inst(name, n, parent) {
    const p = part[name]; if (!p || !n) return null; const meshes = []; p.traverse(o => { if (o.isMesh) meshes.push(o); });
    const ims = meshes.map(o => { o.updateMatrix(); const g = o.geometry.clone(); g.applyMatrix4(o.matrix); g.translate(0, -PY, 0);
      const im = new THREE.InstancedMesh(g, o.material, n); im.castShadow = true; im.frustumCulled = false; (parent || root).add(im); return im; });
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(0, 0, 0, 'YXZ'), pv = new THREE.Vector3(), sv = new THREE.Vector3();
    const I = { ims, set(i, x, y, z, ry = 0, s = 1, rz = 0, rx = 0, sy = null) { e.set(rx, ry, rz); q.setFromEuler(e); const ss = Math.max(s, 1e-4); m4.compose(pv.set(x, y, z), q, sv.set(ss, sy == null ? ss : Math.max(sy, 1e-4), ss)); for (const im of ims) im.setMatrixAt(i, m4); },
      done() { for (const im of ims) im.instanceMatrix.needsUpdate = true; } };
    for (let i = 0; i < n; i++) I.set(i, 0, PY, 0, 0, 1e-4); I.done(); return I;
  }
  const kid = (name, parent) => { if (!part[name]) return null; const g = new THREE.Group(), inner = part[name].clone(true); inner.visible = true; inner.position.set(0, -PY, 0); g.add(inner);
    g.traverse(o => { if (o.isMesh) o.castShadow = true; }); (parent || root).add(g); return g; };
  function path(pts) { const P = pts.map(p => ({ x: p[0], z: p[1] })), cum = [0]; for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i].x - P[i - 1].x, P[i].z - P[i - 1].z));
    const len = cum[cum.length - 1] || 1;
    return { len, at(d, o) { d = clamp(d, 0, len); let i = 1; while (i < cum.length - 1 && cum[i] < d) i++; const a = P[i - 1], b = P[i], t = clamp((d - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1));
      o.x = a.x + (b.x - a.x) * t; o.z = a.z + (b.z - a.z) * t; const l = Math.hypot(b.x - a.x, b.z - a.z) || 1; o.dx = (b.x - a.x) / l; o.dz = (b.z - a.z) / l; return o; } }; }
  const angTo = (a, b, k) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return a + d * k; };

  // ---------- a soft V wake behind each moving boat ----------
  const WAKE = (() => { const W = 64, H = 128, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d'), im = x.createImageData(W, H);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const v = j / (H - 1), u = Math.abs(i / (W - 1) - 0.5) * 2, edge = Math.exp(-Math.pow((u - v * 0.95) / 0.07, 2)), mid = Math.exp(-Math.pow(u / 0.12, 2)) * 0.5,
      a = (edge + mid) * Math.pow(1 - v, 1.3) * Math.min(1, v * 12), k = (j * W + i) * 4; im.data[k] = im.data[k + 1] = im.data[k + 2] = 255; im.data[k + 3] = Math.round(255 * Math.min(1, a)); }
    x.putImageData(im, 0, 0); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const wakeGeo = new THREE.PlaneGeometry(7, 22).rotateX(-Math.PI / 2).translate(0, 0, -11);
  const mkWake = (parent) => { const m = new THREE.MeshBasicMaterial({ map: WAKE, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
    const w = new THREE.Mesh(wakeGeo, m); w.renderOrder = 3; w.frustumCulled = false; (parent || root).add(w); return w; };

  // ---------- the airboat tour: out of its slip, down the canal, a loop on the lake, home, a rest at the dock ----------
  const o = {};
  const tour = TM.tour && TM.tour.length > 3 ? { p: path(TM.tour), I: inst('proto_airboat', 1), wake: mkWake(), h: null, d: 0, wait: 6, sp: 9 } : null;
  const loop2 = TM.lakeLoop && TM.lakeLoop.length > 3 ? { p: path([...TM.lakeLoop, TM.lakeLoop[0]]), I: inst('proto_airboat2', 1), wake: mkWake(), h: null, d: 0, sp: 8 } : null;
  function moveTour(b, dt, t, loop) {
    if (!b) return; let moving = true;
    if (!loop) { if (b.wait > 0) { b.wait -= reduced ? 0 : dt; moving = false; } else { b.d += (reduced ? 0 : 1) * b.sp * dt * TS;
        // ease the speed near both ends (backing out and tying up)
        if (b.d >= b.p.len) { b.d = 0; b.wait = 12; moving = false; } } }
    else { if (!reduced) b.d += b.sp * dt * TS; b.d = b.d % b.p.len; }
    b.p.at(b.d, o); const want = Math.atan2(o.dx, o.dz), near = loop ? 1 : clamp(Math.min(b.d, b.p.len - b.d) / 14);
    // backing out of the slip: the bow stays pointing at the dock for the first few metres
    const face = !loop && b.d < 5 ? Math.atan2(-o.dx, -o.dz) : want;
    b.h = b.h == null || reduced ? face : angTo(b.h, face, Math.min(1, 2.2 * dt));
    const bob = reduced ? 0 : Math.sin(t * 1.6) * 0.03, roll = reduced || !moving ? 0 : Math.sin(t * 1.1) * 0.02;
    // airboats plane: the bow lifts a little at speed
    b.I.set(0, o.x, WY + 0.02 + bob, o.z, b.h, 1, roll, moving ? -0.05 * near : 0); b.I.done();
    b.wake.position.set(o.x, WY + 0.05, o.z); b.wake.rotation.y = b.h; b.wake.material.opacity = moving ? 0.45 * near * (0.85 + 0.15 * Math.sin(t * 2)) : 0; b.x = o.x; b.z = o.z;
  }
  window.__airboat = (d, dist = 60) => { if (tour) { tour.wait = 0; tour.d = d ?? tour.d; moveTour(tour, 0.001, 0); if (X.goView) X.goView({ at: [tour.x, 0, tour.z], dist, el: 0.5, az: SC.az ?? 0.6 }, 0.01); } };

  // ---------- the alligator: lies on the bank, slides in, a little swim, climbs out, turns to face the canal again ----------
  const GA = TM.gator, gator = GA ? kid('proto_gator') : null, GP = 46; let gT = 9; if (gator) gator.scale.setScalar(1.15);
  const swim = GA && GA.swim ? path(GA.swim) : null;
  const AT = GA ? { x: GA.at[0], z: GA.at[1] } : null, bankY = LAND - 0.03, swimY = WY - 0.22;
  function moveGator(dt, t) { if (!gator || !swim) return; gT += reduced ? 0 : dt; const c = reduced ? 2 : gT % GP;
    const s0 = swim.at(0, {}), s1 = swim.at(swim.len, {}), toWater = Math.atan2(s0.x - AT.x, s0.z - AT.z);
    let x = AT.x, z = AT.z, y = bankY, h = toWater, tail = Math.sin(t * 0.7) * 0.03;
    if (c < 22) { /* basking, the odd lazy tail flick */ tail = c > 14 && c < 15.5 ? Math.sin((c - 14) * 8) * 0.25 : 0; }
    else if (c < 25) { const k = ease((c - 22) / 3); x = AT.x + (s0.x - AT.x) * k; z = AT.z + (s0.z - AT.z) * k; y = bankY + (swimY - bankY) * k; tail = Math.sin(c * 6) * 0.2 * k; }
    else if (c < 38) { const k = (c - 25) / 13; swim.at(k * swim.len, o); x = o.x; z = o.z; y = swimY; h = Math.atan2(o.dx, o.dz); tail = Math.sin(c * 4.5) * 0.3; }
    else if (c < 41) { const k = ease((c - 38) / 3); x = s1.x + (AT.x - s1.x) * k; z = s1.z + (AT.z - s1.z) * k; y = swimY + (bankY - swimY) * k; h = Math.atan2(AT.x - s1.x, AT.z - s1.z); tail = Math.sin(c * 6) * 0.2 * (1 - k); }
    else { const k = ease((c - 41) / 2.5); h = angTo(Math.atan2(AT.x - s1.x, AT.z - s1.z), toWater, k); }
    gator.position.set(x, y, z); gator.rotation.set(0, (gator.userData.h = gator.userData.h == null ? h : angTo(gator.userData.h, h, Math.min(1, 3 * dt))) + tail, 0, 'YXZ'); }
  window.__gator = { set: (c) => { gT = c; }, at: () => AT, get g() { return gator; } };

  // gulls wheeling over the lake
  const GU = INFO.gulls, gulls = GU ? inst('proto_gull', GU.n || 3) : null;
  function moveGulls(t) { if (!gulls) return; for (let i = 0; i < (GU.n || 3); i++) { const r = GU.r * (0.6 + 0.25 * i), w = (reduced ? 0 : t) * (9 + i) / r * (i % 2 ? -1 : 1) + i * 2.1, cx = GU.c[0] + Math.sin(i * 1.7) * 30, cz = GU.c[1] + Math.cos(i * 2.3) * 30;
      const x = cx + Math.cos(w) * r, z = cz + Math.sin(w) * r, dir = i % 2 ? -1 : 1, h = Math.atan2(-Math.sin(w) * dir, Math.cos(w) * dir);
      gulls.set(i, x, GU.y + i * 5 + Math.sin(t * 0.5 + i) * 2, z, h, 2.2, -0.35 * dir); } gulls.done(); }

  // ---------- the land for sale: a soft ribbon of light round the border, Coldwell Banker blue, always on ----------
  const ribU = { uK: { value: 1 }, uT: { value: 0 } }, HG = (HERO || new THREE.Color('#4d8bff')).clone();
  try { if (part.border) { const bm = new THREE.MeshBasicMaterial({ color: HG.clone().multiplyScalar(1.5), toneMapped: false }); part.border.traverse(m => { if (m.isMesh && m.material && m.material.name === 'border') { m.material = bm; m.castShadow = false; } }); }
    const BP = INFO.border || []; if (BP.length > 4) { const W2 = 3, pos = [], uv = [], idx = [];
      for (let i = 0; i < BP.length; i++) { const a = BP[Math.max(0, i - 1)], b = BP[Math.min(BP.length - 1, i + 1)], p = BP[i]; let dx = b[0] - a[0], dz = b[2] - a[2]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
        pos.push(p[0] - dz * W2, p[1] + 0.15, p[2] + dx * W2, p[0] + dz * W2, p[1] + 0.15, p[2] - dx * W2); uv.push(0, i, 1, i); if (i) { const k = (i - 1) * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
      const m = new THREE.ShaderMaterial({ uniforms: Object.assign(ribU, { uC: { value: new THREE.Vector3(HG.r, HG.g, HG.b) } }), transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
        vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: 'uniform float uK, uT; uniform vec3 uC; varying vec2 vU; void main(){ float d = abs(vU.x - 0.5) * 2.0; float a = exp(-d * d * 6.0) * 0.4 + exp(-d * d * 60.0) * 0.4; float run = 0.85 + 0.15 * sin(vU.y * 0.3 - uT * 2.0); gl_FragColor = vec4(mix(uC * 0.9, mix(uC, vec3(1.0), 0.45), exp(-d * d * 60.0)), clamp(a * uK * run, 0.0, 0.85)); }' });
      const rib = new THREE.Mesh(g, m); rib.name = 'borderGlow'; rib.renderOrder = 6; rib.frustumCulled = false; model.add(rib); } } catch (err) { console.warn('border', err); }

  // ---------- Room to grow: tmBuild ----------
  const LIGHT = new THREE.Color(CFG.light || '#cfdcff');
  const lightM = (k, extra) => { const m = new THREE.MeshBasicMaterial(Object.assign({ color: LIGHT.clone().multiplyScalar(k), toneMapped: false, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }, extra)); m.userData.gc = m.color.clone(); GM.push(m); return m; };
  const tv = new THREE.Vector3();
  const mkTag = () => { const el = document.createElement('div'); el.className = 'tag'; el.style.zIndex = 3; el.style.display = 'none'; (document.getElementById('tags') || document.body).appendChild(el); return el; };
  function tagTo(el, x, y, z, text) { tv.set(x, y, z); model.localToWorld(tv); tv.project(camera); if (tv.z > 1) { el.style.display = 'none'; return; }
    if (el.textContent !== text) el.textContent = text; el.style.display = 'block'; const hw = el.offsetWidth / 2 + 8, sx = Math.min(innerWidth - hw, Math.max(hw, (tv.x * 0.5 + 0.5) * innerWidth));
    el.style.transform = `translate(${sx}px, ${Math.max(120, (-tv.y * 0.5 + 0.5) * innerHeight - 8)}px) translate(-50%, -100%)`; }
  const growTags = [];
  const FX = Object.assign({}, base.fx);
  const T = { ol: [0.2, 1.0], cab0: 0.9, cabGap: 0.17, cabRun: 0.7, rest: [3.9, 5.4], bw: [5.0, 6.4], boats: [6.2, 9.6], nat: [7.6, 9.0] };
  FX.tmBuild = (c) => {
    const g = new THREE.Group();
    // 1. the spare land's edge in light
    const ol = (GR.spare || []).map(([x, z]) => new THREE.Vector3(x, LAND + 0.5, z)), olM = lightM(2.2);
    const olMesh = ol.length > 2 ? new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ol, true, 'catmullrom', 0), 200, 0.55, 5, true), olM) : null; if (olMesh) g.add(olMesh);
    // 2. the cabins: a box of light rises on each plot, then the cabin grows up inside it, west to east
    const CB = GR.cabins || [], n = CB.length, cab = inst('proto_cabin', n, g), ghostM = lightM(1.0);
    const ghost = new THREE.InstancedMesh(new THREE.BoxGeometry(5.6, 4.6, 6.6).translate(0, 2.3, 0), ghostM, Math.max(1, n)); ghost.renderOrder = 4; ghost.frustumCulled = false; ghostM.opacity = 1; g.add(ghost);
    const c0 = new THREE.Color(0, 0, 0); for (let i = 0; i < n; i++) ghost.setColorAt(i, c0);
    // 3. the restaurant and the nature center: plain copies of the hidden pieces, built up from the ground
    const mkB = (name, at) => { if (!at || !part[name]) return null; const k = kid(name, g); k.position.set(at.at[0], LAND - 0.1, at.at[1]); k.rotation.y = at.ry || 0; k.visible = false;
      const b = new THREE.Box3().setFromObject(k); const s = b.getSize(new THREE.Vector3()), cc = b.getCenter(new THREE.Vector3()).sub(k.position);
      const gh = new THREE.Mesh(new THREE.BoxGeometry(s.x * 1.04, s.y * 1.04, s.z * 1.04).translate(cc.x, s.y / 2, cc.z), lightM(1.2)); gh.renderOrder = 4; k.add(gh); k.userData.gh = gh; return k; };
    const rest = mkB('proto_restaurant', GR.rest), nat = mkB('proto_nature', GR.nature);
    // 4. the new boardwalk and its 12 finger docks: planks rise out of the canal one after another
    const wood = new THREE.MeshStandardMaterial({ color: '#b9a383', roughness: 0.85 }), bwG = new THREE.Group(); g.add(bwG); const bwLight = lightM(1.6), planks = [];
    const BW = GR.bw || []; for (let i = 1; i < BW.length; i++) { const [ax, az] = BW[i - 1], [bx, bz] = BW[i], L = Math.hypot(bx - ax, bz - az);
      const m = new THREE.Mesh(new THREE.BoxGeometry(L + 0.1, 0.3, 2.4), wood); m.position.set((ax + bx) / 2, 0, (az + bz) / 2); m.rotation.y = -Math.atan2(bz - az, bx - ax); planks.push({ m, k: i / BW.length }); }
    (GR.fingers || []).forEach(([fx, fz, fl], j) => { const m = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.28, fl), wood); m.position.set(fx, 0, fz + fl / 2); planks.push({ m, k: 1 - j / 12 }); });
    planks.forEach(p => { bwG.add(p.m); const gl = new THREE.Mesh(p.m.geometry, bwLight); gl.scale.set(1.03, 2.0, 1.03); gl.rotation.y = p.m.rotation.y; gl.position.copy(p.m.position); gl.renderOrder = 4; p.gl = gl; bwG.add(gl); });
    const BWY = GR.bwY ?? LAND + 0.2;
    // 5. boats glide in from the lake end of the canal and tie up in the new slips
    const SL = GR.slips || [], kinds = { airboat: 'proto_airboat', airboat2: 'proto_airboat2', pontoon: 'proto_pontoon', fishing: 'proto_fishing' };
    const counts = {}; SL.forEach(s => { counts[s.kind] = (counts[s.kind] || 0) + 1; });
    const BI = {}; for (const k in counts) BI[k] = inst(kinds[k], counts[k], g);
    const used = {}, boats = SL.map((s, i) => { const j = used[s.kind] = (used[s.kind] ?? -1) + 1; const w = mkWake(g); return { I: BI[s.kind], j, p: path(s.path), w, t0: T.boats[0] + i * 0.28 }; });
    if (!growTags.length) growTags.push(mkTag(), mkTag(), mkTag());
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), pv = new THREE.Vector3(), sv = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), col = new THREE.Color(), ob = {};
    const cabEnd = T.cab0 + (n - 1) * T.cabGap + T.cabRun, fmt = c.tag || (GROW && GROW.tag && GROW.tag.text) || '', total = c.count ?? n;
    const build = (k, t, t0, dur) => { if (!k) return; const f = ease((t - t0) / dur), fw = ease((t - t0 - dur) / 0.8); k.visible = f > 0; k.scale.set(1, Math.max(1e-4, back(f)), 1);
      k.userData.gh.material.opacity = 0.45 * (f > 0 ? 1 - fw : 0); k.userData.gh.visible = fw < 1; };
    return { obj: g, mat: olM, tick(t0, k, pulse) {
      const t = reduced ? 99 : t0;
      if (olMesh) olM.opacity = clamp((t - T.ol[0]) / (T.ol[1] - T.ol[0])) * (t < cabEnd + 0.5 ? 0.9 : 0.35 + 0.2 * pulse);
      for (let i = 0; i < n; i++) { const C = CB[i], f = clamp((t - T.cab0 - i * T.cabGap) / T.cabRun), gr = ease((t - T.cab0 - i * T.cabGap - 0.25) / 0.6);
        q.setFromAxisAngle(up, C.ry || 0); m4.compose(pv.set(C.at[0], LAND, C.at[1]), q, sv.set(1, f > 0 ? Math.max(1e-4, ease(f)) : 1e-4, 1)); ghost.setMatrixAt(i, m4);
        ghost.setColorAt(i, col.setScalar(f > 0 ? 0.75 * (1 - ease((t - T.cab0 - i * T.cabGap - 0.6) / 0.6)) : 0));
        if (cab) cab.set(i, C.at[0], LAND, C.at[1], C.ry || 0, gr > 0 ? 1 : 1e-4, 0, 0, gr > 0 ? back(gr) : 1e-4); }
      ghost.instanceMatrix.needsUpdate = true; ghost.instanceColor.needsUpdate = true; ghost.visible = t < cabEnd + 1; if (cab) cab.done();
      build(rest, t, T.rest[0], 1.3); build(nat, t, T.nat[0], 1.1);
      const fb = clamp((t - T.bw[0]) / (T.bw[1] - T.bw[0])); bwG.visible = t > T.bw[0];
      planks.forEach(p => { const fj = ease((t - T.bw[0] - p.k * 1.0) / 0.6); p.m.position.y = BWY - 1.4 + 1.4 * fj; p.gl.position.y = p.m.position.y; p.gl.visible = fj > 0 && fj < 1; p.m.visible = fj > 0; });
      bwLight.opacity = 0.4 * Math.sin(Math.PI * fb);
      for (const b of boats) { if (!b.I) continue; const f = clamp((t - b.t0) / (T.boats[1] - T.boats[0] - 1.0)), e = 1 - Math.pow(1 - f, 2.4); b.p.at(e * b.p.len, ob);
        const yaw = Math.atan2(ob.dx, ob.dz); b.I.set(b.j, ob.x, WY + 0.0, ob.z, yaw, f > 0 ? clamp(f * 10) : 1e-4);
        b.w.position.set(ob.x, WY + 0.05, ob.z); b.w.rotation.y = yaw; b.w.material.opacity = f > 0 && f < 1 ? 0.45 * (1 - e) : 0; }
      for (const k in BI) BI[k] && BI[k].done();
      if (GROW && GROW.tag && fmt) { const nn = Math.round(total * clamp((t - T.cab0) / (cabEnd - T.cab0))); GROW.tag.text = fmt.replace(/\d+/, String(nn)); }
      g.userData.t = t;
    } };
  };

  // ---------- each frame ----------
  let clock = 0;
  function tick(dt, state = {}) { base.tick(dt, state); clock += dt;
    PEOPLE.tick(dt, clock); moveTour(tour, dt, clock, false); moveTour(loop2, dt, clock, true); moveGator(dt, clock); moveGulls(clock);
    ribU.uT.value = clock; ribU.uK.value = 0.85 + 0.6 * (base.dusk ? base.dusk() : 0);
    // the idea labels show only while Room to grow plays, once each piece is there
    if (state.growOn && growTags.length) {
      const gt = (() => { for (const ch of model.children) if (ch.userData && ch.userData.t != null && ch.visible) return ch.userData.t; return 0; })();
      if (GR.rest && gt > T.rest[0] + 1.4) tagTo(growTags[0], GR.rest.at[0] + 4, 20, GR.rest.at[1] + 10, 'Idea: a waterfront restaurant'); else growTags[0].style.display = 'none';
      const bm = GR.bw && GR.bw.length ? GR.bw[Math.floor(GR.bw.length * 0.85)] : null;
      if (bm && gt > T.boats[1]) tagTo(growTags[1], bm[0], 5, bm[1] + 9, 'Idea: 23 boat slips in all'); else growTags[1].style.display = 'none';
      if (GR.nature && gt > T.nat[0] + 1.2) tagTo(growTags[2], GR.nature.at[0] - 16, 6, GR.nature.at[1] - 4, 'Idea: a nature education center'); else growTags[2].style.display = 'none'; }
    else growTags.forEach(el => el.style.display = 'none');
  }
  window.__trafford = { part, get clock() { return clock; }, tour, gator };
  return { fx: FX, tick, dusk: base.dusk };
}
