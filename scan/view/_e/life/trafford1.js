// Lake Trafford Marina life layer (trafford1, 12-11-2026). Built on life1 (Sunset, lamps, moving water, pickups on Lake Trafford Road)
// and people1 (library people who really walk: on the boardwalk, round the store, down the RV lane with a dog, standing on the deck).
// Always on: an airboat tour backs out of its slip, runs down the canal to Lake Trafford, loops the lake and comes home; a second airboat
// works the far side of the lake; gulls over the water; a soft ribbon of blue light round the land for sale.
// The funny touch: the alligator on the canal bank by the docks. It lies there, then now and then slides into the water, has a little swim,
// climbs back out and turns round to face the canal again, as if nothing happened.
// Room to grow (fx type tmBuild, the film's grow scene, layout illustrative): the spare land outlines in light, 16 cabins build west to east,
// a waterfront restaurant rises with its deck, a new boardwalk with finger docks rises from the canal and boats glide into the new slips,
// then a nature education center. Every piece is labelled an idea. It moves in the web viewer only: the AR file stays a still model.
import { initPeople } from './people1.js?v=2';
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
  (X.MATS || []).forEach(m => { if (m.name === 'ground' && m.color) { m.color.setScalar(CFG.groundK ?? 0.84); if (m.userData.c0) m.userData.c0.copy(m.color); return; }   // the white sand strip in the aerial photo blooms too
    if (!m.color || /^(glass|sign|ground|lake|plinth|band|border)/.test(m.name || '')) return;
    // 12-11-2026 (Adam: "a glitchy block outside the front of the building"): the metal roofs and boat seats were mirrors, so the sun flashed them into a white slab. Matt everywhere.
    if (m.metalness > 0.15 || m.roughness < 0.6) { m.roughness = Math.max(m.roughness ?? 1, 0.85); m.metalness = Math.min(m.metalness ?? 0, 0.08); }
    const a = (m.color.r + m.color.g + m.color.b) / 3, cap = m.map ? 0.8 : 0.62;
    if (a > cap) { m.color.multiplyScalar(cap / a); if (m.userData.c0) m.userData.c0.copy(m.color); m.userData.lum = Math.min(m.userData.lum ?? 1, 0.55); } });
  // 12-11-2026: the aerial photo has parked cars baked into it, which show as red and blue smudges on the gravel by the store. Strong red or blue on bright ground fades to grey.
  if (part.ground) part.ground.traverse(o => { const m = o.isMesh && o.material; if (!m || !m.map || m.userData.noCars) return; m.userData.noCars = 1; const old = m.onBeforeCompile, key = m.customProgramCacheKey ? m.customProgramCacheKey() : '';
    const CUT = `{ vec3 c0 = diffuseColor.rgb; float lum = dot(c0, vec3(0.3333));
      float red = smoothstep(0.05, 0.14, (c0.r - c0.g) / max(c0.r, 0.001)) * (1.0 - smoothstep(0.07, 0.16, (c0.g - c0.b) / max(c0.g, 0.001)));   // pink and red, but not brown dirt (dirt has far more green than blue)
      float blu = smoothstep(0.05, 0.14, (c0.b - max(c0.r, c0.g)) / max(c0.b, 0.001)), cyn = smoothstep(0.07, 0.16, (min(c0.g, c0.b) - c0.r) / max(min(c0.g, c0.b), 0.001));
      diffuseColor.rgb = mix(c0, vec3(lum) * vec3(1.0, 0.98, 0.94), max(red, max(blu, cyn)) * smoothstep(0.05, 0.11, lum)); }`;   // colours here are linear, so 'bright ground' starts low
    m.onBeforeCompile = (sh, r) => { if (old) old(sh, r); sh.fragmentShader = sh.fragmentShader.includes('vec3 pc = diffuseColor.rgb;') ? sh.fragmentShader.replace('{ vec3 pc = diffuseColor.rgb;', CUT + '\n{ vec3 pc = diffuseColor.rgb;') : sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n' + CUT); };
    m.customProgramCacheKey = () => key + '-nocars3'; m.needsUpdate = true; });
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
  const GA = TM.gator, gator = GA ? kid('proto_gator') : null, GP = 46; let gT = 9; if (gator) gator.scale.setScalar(GA.s || 1.7);
  // 12-11-2026 (Adam: "I can't see an alligator anywhere"): a lighter olive hide and a bigger animal, so it reads against dark grass and water on a desk-sized model
  if (part.proto_gator) { const seen = new Set(); part.proto_gator.traverse(m => { if (m.isMesh && m.material && !seen.has(m.material)) { seen.add(m.material); const c = m.material.color; if (c && c.r + c.g + c.b < 1.2) { c.set(c.g >= c.r ? '#5f8038' : '#8a7a4a'); if (m.material.userData.c0) m.material.userData.c0.copy(c); } m.material.roughness = 0.9; } }); }
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
  // more alligators (Adam, 12-11-2026: "a few roaming around just in the trees, in the landscape"): model_info tm.gators = [{ pts, speed, swim, t0 }].
  // On land they amble along their path, stop for a long rest at each end and amble back; a swimmer cruises its loop with only its back showing.
  const ROAM = (TM.gators || []).map((G, i) => { const g = kid('proto_gator'); if (!g) return null; g.scale.setScalar(G.s || 1.6); const p = path(G.swim ? [...G.pts, G.pts[0]] : G.pts);
    return { g, p, swim: !!G.swim, d: (G.t0 || 0) * p.len, dir: 1, sp: G.speed || 0.45, wait: G.swim ? 0 : 3 + i * 4, h: null }; }).filter(Boolean);
  function moveRoam(dt, t) { for (const r of ROAM) { let moving = false;
      if (r.swim) { if (!reduced) r.d = (r.d + r.sp * dt * TS) % r.p.len; moving = !reduced; }
      else if (!reduced) { if (r.wait > 0) r.wait -= dt; else { r.d += r.dir * r.sp * dt * TS; moving = true; if (r.d >= r.p.len) { r.d = r.p.len; r.dir = -1; r.wait = 14; } else if (r.d <= 0) { r.d = 0; r.dir = 1; r.wait = 10; } } }
      r.p.at(r.d, o); const want = Math.atan2(o.dx * r.dir, o.dz * r.dir); r.h = r.h == null || reduced ? want : angTo(r.h, want, Math.min(1, 1.2 * dt));
      r.g.position.set(o.x, r.swim ? WY - 0.1 : bankY, o.z); r.g.rotation.set(0, r.h + (moving ? Math.sin(t * (r.swim ? 3.2 : 4.2) + r.p.len) * (r.swim ? 0.16 : 0.09) : 0), 0, 'YXZ'); } }
  // yoga on the end of the pier (Adam, 12-11-2026: "It'd be funny if they were doing yoga"): tree pose on a mat, a slow sway, and a wobble now and then
  const YG = TM.yoga, yogi = YG ? (() => { const g = new THREE.Group(), M = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9 });
    const skin = M('#d9a47f'), top = M(YG.shirt || '#ff7aa0'), legs = M('#22262e'), hair = M('#3a2a1e'), mat = M(YG.mat || '#6b4fd0'), up = new THREE.Vector3(0, 1, 0), body = new THREE.Group();
    const limb = (a, b, r, m) => { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), dv = B.clone().sub(A), L = dv.length(); const k = new THREE.Mesh(new THREE.CapsuleGeometry(r, L, 3, 8), m);
      k.position.copy(A).addScaledVector(dv, 0.5); k.quaternion.setFromUnitVectors(up, dv.normalize()); k.castShadow = true; body.add(k); };
    const ball = (at, r, m) => { const k = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), m); k.position.set(...at); k.castShadow = true; body.add(k); };
    limb([0.07, 0.08, 0], [0.07, 0.86, 0], 0.07, legs); limb([-0.07, 0.86, 0], [-0.4, 0.66, 0.05], 0.07, legs); limb([-0.4, 0.66, 0.05], [0.0, 0.56, 0.04], 0.06, legs);   // standing leg, bent thigh, shin with the foot on the knee
    limb([0, 0.95, 0], [0, 1.36, 0], 0.13, top); ball([0, 1.6, 0], 0.11, skin); ball([0, 1.7, -0.07], 0.06, hair);
    for (const sx of [-1, 1]) { limb([0.17 * sx, 1.4, 0], [0.24 * sx, 1.74, 0], 0.045, skin); limb([0.24 * sx, 1.74, 0], [0.02 * sx, 2.02, 0], 0.04, skin); }   // arms up, palms together overhead
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.03, 1.8), mat); m.position.y = 0.015; m.receiveShadow = true; g.add(m, body); g.userData.body = body;
    g.position.set(YG.at[0], YG.y ?? LAND + 0.81, YG.at[1]); g.rotation.y = YG.ry || 0; root.add(g); return g; })() : null;
  function moveYogi(t) { if (!yogi || reduced) return; const c = t % 19, wob = c > 15 && c < 17.2 ? Math.sin((c - 15) * 9) * 0.13 * Math.sin((c - 15) / 2.2 * Math.PI) : 0;
    yogi.userData.body.rotation.z = Math.sin(t * 0.8) * 0.025 + wob; yogi.userData.body.rotation.x = Math.sin(t * 0.55) * 0.012; }

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

  // 12-11-2026 (Adam, twice: "the glitchy block is still there"): the store sign is taller than the gap under the little porch gable, so its teal top corners
  // poked out through the gable roof on both sides. The sign hangs lower now, clear of the roof. model_info tm.signDy.
  if (part.store) part.store.traverse(o => { if (o.isMesh && o.material && o.material.name === 'sign' && !o.userData.dropped) { o.userData.dropped = 1; o.position.y += TM.signDy ?? -0.7; } });
  // 12-11-2026 (Adam, with a picture: "right in the middle of the road, outside the front"): the gravel entry lane runs out over the tarmac at the same height,
  // so the two fought for the same pixels and the lane broke into flickering stripes. The tarmac and its yellow lines now always win where they overlap.
  if (part.yard) part.yard.traverse(o => { const m = o.isMesh && o.material; if (!m) return; const k = m.name === 'site_asphalt' ? 1 : m.name === 'site_yellow' ? 2 : 0;
    if (k) { m.polygonOffset = true; m.polygonOffsetFactor = -3 * k; m.polygonOffsetUnits = -6 * k; m.needsUpdate = true; } });
  // the angler at the end of the boardwalk (a library piece, one copy): model_info tm.angler = { dy, s } lifts or resizes him without a new model
  const ANG = (() => { let m = null; model.traverse(o => { if (o.isInstancedMesh && /^lib_angler/.test(o.name || '')) m = o; }); return m; })(), ANG0 = ANG ? ANG.instanceMatrix.array.slice() : null;
  const setAngler = (dy = 0, sc = 1) => { if (!ANG) return; const M = new THREE.Matrix4().fromArray(ANG0), p = new THREE.Vector3(), q = new THREE.Quaternion(), k = new THREE.Vector3(); M.decompose(p, q, k);
    p.y += dy; k.multiplyScalar(sc); ANG.setMatrixAt(0, M.compose(p, q, k)); ANG.instanceMatrix.needsUpdate = true; };
  if (TM.angler && TM.angler.hide) { if (ANG) ANG.visible = false; } else if (TM.angler) setAngler(TM.angler.dy || 0, TM.angler.s || 1); window.__angler = setAngler;
  // the library angler is a wading model with no legs below the knee, so on a dock he always looks sunk in the planks. tm.rod = { at, y, ry } puts a rod and line
  // in the hands of a standing library person (people.still) instead.
  if (TM.rod) { const g = new THREE.Group(), dark = new THREE.MeshStandardMaterial({ color: '#2a2a2a', roughness: 0.8 }), rod = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.03, 3.0, 6).translate(0, 1.5, 0), dark);
    rod.rotation.x = 0.95; rod.position.set(0.18, 1.05, 0.2); rod.castShadow = true; g.add(rod);
    const tipY = 1.05 + Math.cos(0.95) * 3.0, tipZ = 0.2 + Math.sin(0.95) * 3.0, drop = tipY + (TM.rod.y - WY);
    const line = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, drop, 4).translate(0, -drop / 2, 0), new THREE.MeshBasicMaterial({ color: '#e8eef2' })); line.position.set(0.18, tipY, tipZ); g.add(line);
    const flo = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), new THREE.MeshStandardMaterial({ color: '#e63a2a', roughness: 0.6 })); flo.position.set(0.18, tipY - drop + 0.05, tipZ); g.add(flo);
    g.position.set(TM.rod.at[0], TM.rod.y, TM.rod.at[1]); g.rotation.y = TM.rod.ry || 0; root.add(g); }

  // ---------- each frame ----------
  let clock = 0, gSel = false;
  function tick(dt, state = {}) { base.tick(dt, state); clock += dt;
    PEOPLE.tick(dt, clock); moveTour(tour, dt, clock, false); moveTour(loop2, dt, clock, true); // the Watch out card: the alligator by the docks slides in a moment after the camera gets there
    if (state.sel && state.sel.id === 'gators') { if (!gSel) { gSel = true; gT = 17; } } else gSel = false;
    moveGator(dt, clock); moveRoam(dt, clock); moveYogi(clock); moveGulls(clock);
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
  window.__trafford = { part, get clock() { return clock; }, tour, gator, ROAM, yogi };
  return { fx: FX, tick, dusk: base.dusk };
}
