// The Lost Resort at Lake Ozette life layer (lostresort1, 16-11-2026, built by Opus 5.5 in the same session as the film). The Wagon Box and Whitney
// pattern (life1 underneath: Sunset switch, the backdrop, tap a thing to open its card) with this resort's own pieces:
// - the middle camping cabin opens like a doll's house: on the cabins card its roof and gables lift away to show the room from the floor plan and
//   broker photo 33 (double bed, bunk bed, the lamp, the sea stack picture, table and chairs, the heater, packs and boots)
// - the 20 tent sites light one by one out from the store on the tent sites card; the store's porch lights come on on the store card
// - SUNSET is the campfire hour: a fire catches in every wheel rim ring, one at a time out from the store, the store's porch and windows glow,
//   the three cabin porch lights come on and the lamp and heater glow inside the open cabin
// - campers walk the loop and the lawn, hikers come and go on the road toward the lake
// - the joke, "Signal": a hiker walks slow circles on the lawn by the store holding a phone up high, now and then stepping up on a picnic bench to
//   hold it higher still; three metres away a woman chats away on the store's old blue pay phone. No card, no tour stop and no camera move point at it.
// - Room to grow (the film's idea, the broker's conceptual plan): the trees over the plan sink away, 30 gravel pads paint into the forest floor and
//   a hookup post GROWS UP OUT OF THE GROUND at every pad, with rigs on some of them (never flying in), each on a pool of white light that warms.
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
  // life1 always makes one street lamp and its ground pool even when the listing has no lamps (INFO.lamps empty): it sat at the plate centre
  // at ground level and its pool z-fought the ground at sunset (Adam 16-11-2026: "one very glitchy light"). This model has no lamps: draw none.
  if (!(INFO.lamps || []).length) { const lg = model.getObjectByName('life'); if (lg) lg.children.forEach((o) => { const p = o.geometry && o.geometry.parameters;
    if (o.isInstancedMesh && p && ((o.geometry.type === 'SphereGeometry' && Math.abs(p.radius - 0.42) < 1e-6) || (o.geometry.type === 'PlaneGeometry' && p.width === 9 && p.height === 9))) o.count = 0; }); }
  const root = new THREE.Group(); root.name = 'lostresort_life'; model.add(root);
  const groundY = base.groundY || X.groundY || (() => 0);
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

  // ---------- the land for sale: a ribbon of the broker's teal round the two county parcels, always on, stronger at sunset ----------
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


  // ---------- the middle cabin opens: roof and gables lift straight up and slide back off the room on the cabins card ----------
  const CB = INFO.cabin || null; let rC = 0;
  const away = CB ? [-Math.sin(CB.f), -Math.cos(CB.f)] : [0, -1];     // the cabin's local -z: away from the porch
  function tickRoof(dt, sel) { if (!CB || !part.cabin_roof) return; const on = sel && sel.id === 'cabins' ? 1 : 0; rC += (on - rC) * Math.min(1, (on ? 1.5 : 3) * dt);
    const g = sm(rC), bob = !reduced ? Math.sin(clock * 1.3) * 0.06 : 0;
    part.cabin_roof.position.set(away[0] * 5.5 * g, 6 * Math.sin(Math.PI * 0.5 * Math.min(1, g * 1.3)) + (g > 0.99 ? bob : 0), away[1] * 5.5 * g); part.cabin_roof.traverse(m => { if (m.isMesh) m.castShadow = g < 0.05; }); }

  // ---------- card effects: the 20 tent sites light one by one out from the store; the store's porch lights ----------
  const SP = INFO.sitePads || [], ST = (INFO.store && INFO.store.at) || [0, 0];
  FX.lrsites = (c) => { const g = new THREE.Group(), n = SP.length, m = lightM(c.k ?? 2.0, { color: new THREE.Color('#ffd9a0').multiplyScalar(c.k ?? 2.0) });
    const ringG = new THREE.RingGeometry(3.2, 3.9, 40); ringG.rotateX(-Math.PI / 2);
    const im = new THREE.InstancedMesh(ringG, m, Math.max(1, n)); im.frustumCulled = false; im.renderOrder = 5; for (let i = 0; i < n; i++) im.setColorAt(i, new THREE.Color(0, 0, 0)); g.add(im);
    const order = SP.map(p => Math.hypot(p[0] - ST[0], p[2] - ST[1])), dmax = Math.max(1, ...order), m4 = new THREE.Matrix4(), pv = new THREE.Vector3(), q = new THREE.Quaternion(), col = new THREE.Color();
    SP.forEach((p, i) => { m4.compose(pv.set(p[0], p[1] + 0.25, p[2]), q, new THREE.Vector3(1, 1, 1)); im.setMatrixAt(i, m4); });
    return { obj: g, mat: m, tick: (t, k) => { SP.forEach((p, i) => { const a = 0.3 + order[i] / dmax * 2.2, b = flash(t, a, 0.25, 1.6) * 0.9 + (t > a ? 0.45 : 0); col.setScalar(b * k); im.setColorAt(i, col); }); im.instanceColor.needsUpdate = true; } }; };
  const SB = (INFO.bulbs && INFO.bulbs.store) || [];
  FX.lrstore = (c) => { const g = new THREE.Group(), ss = SB.map((p) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: new THREE.Color('#ffcf8a'), toneMapped: false, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); s.position.set(p[0], p[1], p[2]); s.scale.setScalar(7); g.add(s); return s; });
    return { obj: g, mat: null, tick: (t, k) => { ss.forEach((s, i) => { s.material.opacity = 0.8 * k * sm((t - 0.3 - i * 0.15) / 0.4); }); } }; };

  // ---------- campers walking the loop and the lawn, hikers on the road toward the lake ----------
  const WK = (INFO.people && INFO.people.walkers) || [], frames = [], STRIDE = 1.4, NW = WK.length;
  for (let k = 0; k < 8; k++) frames.push(instOf('proto_person_w' + k, NW));
  const standI = instOf('proto_person', NW);
  const walkers = WK.map((w, i) => { const P = w.pts, cum = [0]; for (let k = 1; k < P.length; k++) cum.push(cum[k - 1] + Math.hypot(P[k][0] - P[k - 1][0], P[k][1] - P[k - 1][1]));
    return { i, P, cum, len: cum[cum.length - 1] || 1, d: (w.t0 || 0) * (cum[cum.length - 1] || 1), dir: 1, sp: w.speed || 1, wait: 0, walked: Math.random() * 3, f: -2, h: null }; });
  function tickWalk(dt) { const TS = (SC.life || {}).speed ?? 1.5;
    for (const w of walkers) { if (w.P.length < 2) continue;
      if (!reduced) { if (w.wait > 0) w.wait -= dt; else { const st = w.sp * dt * TS * 0.7; w.d += w.dir * st; w.walked += st; if (w.d > w.len) { w.d = w.len; w.dir = -1; w.wait = 3; } else if (w.d < 0) { w.d = 0; w.dir = 1; w.wait = 3; } } }
      let k = 1; while (k < w.cum.length - 1 && w.cum[k] < w.d) k++; const a = w.P[k - 1], b = w.P[k], u = cl((w.d - w.cum[k - 1]) / ((w.cum[k] - w.cum[k - 1]) || 1)), x = a[0] + (b[0] - a[0]) * u, z = a[1] + (b[1] - a[1]) * u;
      const want = Math.atan2((b[0] - a[0]) * w.dir, (b[1] - a[1]) * w.dir);
      w.h = w.h == null || reduced ? want : w.h + Math.atan2(Math.sin(want - w.h), Math.cos(want - w.h)) * Math.min(1, 4 * dt);
      const f = reduced || w.wait > 0 ? -1 : Math.floor((w.walked / STRIDE) * 8) % 8; if (f !== w.f) { if (w.f >= 0 && frames[w.f]) frames[w.f].hide(w.i); else if (w.f === -1 && standI) standI.hide(w.i); w.f = f; }
      const I = f >= 0 ? frames[f] : standI; if (I) I.set(w.i, x, groundY(x, z) + 0.02, z, w.h); }
    frames.forEach(f => f && f.done()); if (standI) standI.done(); }

  // ---------- "Signal": a loop of about 26 seconds ----------
  const J = INFO.joke || null, hikerI = instOf('proto_hiker', 1), phoneI = instOf('proto_phone', 1);
  const JA = J ? Math.atan2(J.bench[1] - J.centre[1], J.bench[0] - J.centre[0]) : 0;   // the bench sits on the circle at this angle
  let jt = 0;
  function tickJoke(dt) { if (!J || !hikerI) return; jt = reduced ? 4 : (jt + dt) % 26; const t = jt;
    // 0 to 16 s: one slow lap holding the phone up; 16 to 17: step up on the bench; 17 to 21: phone higher, turning a little; 21 to 22: step down; 22 to 26: stand, look at the phone
    let a, up = 0, lift = 0;
    if (t < 16) a = JA + (t / 16) * Math.PI * 2; else a = JA;
    if (t >= 16 && t < 22) { up = J.benchH * sm((t - 16) / 0.8) * (1 - sm((t - 21) / 0.8)); lift = 0.3 * sm((t - 16.5) / 0.8) * (1 - sm((t - 20.6) / 0.6)); }
    const r = t < 16 ? J.r : J.r + 0.6 * sm((t - 15.2) / 0.8) * (1 - sm((t - 21.5) / 0.6));
    const x = J.centre[0] + Math.cos(a) * r, z = J.centre[1] + Math.sin(a) * r;
    const face = t < 16 ? -a : (t < 22 ? -a + 0.35 * Math.sin((t - 16) * 1.3) : Math.atan2(J.caller[0] - x, J.caller[1] - z));
    hikerI.set(0, x, groundY(x, z) + up, z, face); hikerI.done();
    if (phoneI) { const hy = 2.0 + up + lift + (reduced ? 0 : 0.03 * Math.sin(clock * 3)); phoneI.set(0, x + Math.sin(face) * 0.12, groundY(x, z) + hy, z + Math.cos(face) * 0.12, face); phoneI.done(); } }

  // ---------- Sunset is the campfire hour: fires out from the store, the store, the cabin porches, the lamp and heater in the open cabin ----------
  const BL = INFO.bulbs || {}, ALL = [];
  const order = { store: 0, rooms: 0.05, porches: 0.1, fires: 0.15 };
  for (const [k, Lb] of Object.entries(BL)) (Lb || []).forEach((p) => ALL.push({ p, k, d: (order[k] ?? 0.3) + (k === 'fires' || k === 'porches' ? 0.6 * Math.min(1, Math.hypot(p[0] - ST[0], p[2] - ST[1]) / 110) : 0) }));
  const col = { store: [1.0, 0.8, 0.5], rooms: [1.0, 0.82, 0.55], porches: [1.0, 0.75, 0.45], fires: [1.0, 0.5, 0.16] };
  const ptsG = new THREE.BufferGeometry(); { const a = []; ALL.forEach(b => a.push(b.p[0], b.p[1], b.p[2])); ptsG.setAttribute('position', new THREE.Float32BufferAttribute(a, 3)); ptsG.setAttribute('color', new THREE.BufferAttribute(new Float32Array(a.length), 3)); }
  const ptsM = new THREE.PointsMaterial({ size: 6, sizeAttenuation: false, opacity: 0.7, map: glowTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const bulbPts = new THREE.Points(ptsG, ptsM); bulbPts.frustumCulled = false; bulbPts.renderOrder = 7; root.add(bulbPts);
  const fireS = (BL.fires || []).map((p) => { const s = sprite('#ff8a3a', 4.5); s.position.set(p[0], p[1] + 0.3, p[2]); return s; });
  function tickBulbs(t) { const dk = dusk(), wave = cl((dk - 0.3) / 0.6) * 1.25;
    const cA = ptsG.attributes.color.array; ALL.forEach((b, i) => { const vv = sm((wave - b.d) / 0.2), tw = reduced ? 1 : b.k === 'fires' ? 0.75 + 0.25 * Math.sin(t * 9 + i * 1.7) * Math.sin(t * 5.3 + i) : 0.92 + 0.08 * Math.sin(t * 3 + i * 1.7), c = col[b.k] || col.porches; cA[i * 3] = vv * tw * c[0]; cA[i * 3 + 1] = vv * tw * c[1]; cA[i * 3 + 2] = vv * tw * c[2]; });
    ptsG.attributes.color.needsUpdate = true; bulbPts.visible = dk > 0.02;
    let fi = 0; ALL.forEach((b) => { if (b.k !== 'fires') return; const s = fireS[fi++]; if (!s) return; const vv = sm((wave - b.d) / 0.2), fl = reduced ? 1 : 0.8 + 0.2 * Math.sin(t * 11 + fi) * Math.sin(t * 6.7 + fi * 2); s.material.opacity = 0.7 * vv * fl; s.scale.setScalar(4.5 * (0.9 + 0.12 * fl)); }); }

  // ---------- Room to grow: the trees over the plan sink, the pads paint in, posts and rigs grow up out of the ground ----------
  const GR = INFO.grow || {}, GU = GR.units || [];
  const names = Object.keys(part).filter(n => n.startsWith('grow_')); names.forEach(n => { part[n].visible = false; });
  const covers = []; if (part.cover) part.cover.traverse((o) => { if (o.isMesh) covers.push({ o, y: o.position.y, sy: o.scale.y, sx: o.scale.x, d: Math.hypot(o.position.x - 0, o.position.z + 64.5) }); });
  const padMats = []; if (part.grow_pads) part.grow_pads.traverse((o) => { if (o.isMesh) { o.material.transparent = true; padMats.push(o.material); } });
  const pools = GU.map(u => { const s = sprite('#ffffff', 10); s.position.set(u.at[0], u.at[1] + 1.0, u.at[2]); s.visible = false; return s; });
  const porchS = GU.map(u => { if (!u.porch) return null; const s = sprite('#ffbf78', 3.5); s.position.set(u.porch[0], 2.2, u.porch[1]); s.visible = false; return s; });
  const tagSet = (txt) => { if (X.GROW && X.GROW.tag) X.GROW.tag.text = txt; };
  const TAG1 = (SC.life && SC.life.growTag1) || 'Idea: 30 full hookup RV sites', TAG2 = (SC.life && SC.life.growTag2) || 'Subject to approvals';
  let growT = 0, wasGrow = false;
  function tickGrow(dt, on) { if (on && !wasGrow) growT = 0; wasGrow = on;
    if (!on) { names.forEach(n => { part[n].visible = false; }); pools.forEach(p => { p.visible = false; }); porchS.forEach(p => p && (p.visible = false)); covers.forEach(c => { c.o.visible = true; c.o.position.y = c.y; c.o.scale.y = c.sy; c.o.scale.x = c.o.scale.z = c.sx; }); return; }
    growT += reduced ? 99 : dt; const t = growT;
    covers.forEach(c => { const k = sm((t - 0.2 - c.d / 40) / 0.9); c.o.visible = k < 0.999; c.o.scale.y = c.sy * Math.max(1e-3, 1 - k); c.o.scale.x = c.o.scale.z = c.sx * (1 - 0.6 * k); c.o.position.y = c.y - 2 * k; });
    if (part.grow_pads) { part.grow_pads.visible = true; const k = sm((t - 0.6) / 1.4); padMats.forEach(m => { m.opacity = k; }); }
    GU.forEach((u, i) => { const pt = part[u.part]; if (!pt) return; const a = t - 0.6 - u.t * 0.5, k = cl(a / 1.4); pt.visible = k > 0; pt.position.y = -(u.h + 0.3) * (1 - back(k));
      const p = pools[i]; p.visible = a > -0.4 && a < 4; p.material.opacity = 0.5 * sm((a + 0.4) / 0.4) * (1 - sm((a - 1.4) / 2.2));
      const ps = porchS[i]; if (ps) { ps.visible = a > 1.5; ps.material.opacity = 0.7 * sm((a - 1.6) / 0.6) * (0.35 + 0.65 * dusk()); } });
    tagSet(t < 6 ? TAG1 : TAG2); }

  // ---------- every frame ----------
  function tick(dt, state = {}) { base.tick(dt, state); clock += dt;
    tickRoof(dt, state.sel); tickJoke(dt); tickWalk(dt); tickBulbs(clock); tickGrow(dt, !!state.growOn);
    ribU.uT.value = clock; ribU.uK.value = 1.0 + 0.6 * dusk(); }
  window.__lr = { part, root, FX, joke: (c) => { jt = c; }, look: (v) => X.goView(v, 0.01) };
  return { fx: FX, tick, dusk: base.dusk };
}
