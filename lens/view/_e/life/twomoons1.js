// The Lodge at Two Moons life layer (twomoons1, 14-11-2026). The Cabin Creek pattern (life1 underneath: Sunset switch, moving water, the backdrop,
// tap a thing to open its card; the border ribbon; ground grain) with this place's own pieces:
// - THE TWO MOONS: two real spheres fixed high over the east side of the model (pale by day, glowing with halos at Sunset), stars and a
//   eastern ridge, large and luminous with soft halos, stars, a moon path glinting on the Evergreen pond and the west pond, a thin cool rim of
//   moonlight on the treetops. The Sunset button turns the camera to face them.
// - string lights on posts along the paths, over Aurora Point, along the hall eaves and round Heartwood Forest: off by day, on at Sunset in a
//   wave from the lodge outwards
// - the roof of Moonfall Lodge lifts on the lodge card (the seven bedrooms under the eaves); on the dining card the upper floor slides out too
//   (the long dining room, the fireplace lit, the kitchen)
// - the waterfall runs, ducks paddle on both ponds, the fire flickers
// - guests walk the yard, the pond path and Aurora Point, following the ground
// - the joke, "the fourth bear": the real black bear at the end of the carved bears keeps the pose and now and then scratches its ear. No card,
//   no tour stop and no camera move point at it.
// - Room to grow: the film's U shaped timber lodge rises in its clearing (one floor, 60,000 sq ft, then the second floor option, about
//   120,000 sq ft), six log cabins in the glade, the wellness deck; the trees in the clearing go.
// It moves in the web viewer only. The AR file stays a still model.
let THREE;

export async function init(X) {
  THREE = X.THREE;
  const v = new URL(import.meta.url).searchParams.get('l1');
  const SC = X.SC, INFO = X.INFO;
  const base = await (await import('./life1.js' + (v ? '?v=' + v : ''))).init(X);
  const { model, part, MATS, D, NV, camera, scene } = X;
  const reduced = !!NV.reduced, HERO = new THREE.Color(D.theme.hero), PY = (INFO.protoAt || [0, -8, 0])[1], S = INFO.scale || 1;
  const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), sm = (x) => { x = cl(x); return x * x * (3 - 2 * x); };
  const back = (k) => { if (k <= 0) return 0; if (k >= 1) return 1; const c = 1.4, x = k - 1; return 1 + (c + 1) * x * x * x + c * x * x; };
  const FX = Object.assign({}, base.fx);
  const root = new THREE.Group(); root.name = 'twomoons_life'; model.add(root);
  const groundY = base.groundY || X.groundY;
  const dusk = () => (base.dusk ? base.dusk() : 0);
  let clock = 0;
  const kidGeo = (name) => { const out = []; if (!part[name]) return out; part[name].traverse(o => { if (o.isMesh) { const g = o.geometry.clone(); o.updateMatrix(); g.applyMatrix4(o.matrix); g.translate(0, -PY, 0); out.push([g, o.material]); } }); return out; };
  const instOf = (name, n, parent = root) => { const G = kidGeo(name); if (!G.length || !n) return null; const ims = G.map(([g, m]) => { const im = new THREE.InstancedMesh(g, m, n); im.castShadow = true; im.frustumCulled = false; parent.add(im); return im; });
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0), pv = new THREE.Vector3(), sv = new THREE.Vector3();
    return { set(i, x, y, z, ry = 0, s = 1) { q.setFromAxisAngle(Y, ry); m4.compose(pv.set(x, y, z), q, sv.setScalar(Math.max(1e-4, s))); ims.forEach(im => im.setMatrixAt(i, m4)); },
      hide(i) { this.set(i, 0, PY, 0, 0, 1e-4); }, done() { ims.forEach(im => { im.instanceMatrix.needsUpdate = true; }); } }; };
  const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();

  // ---------- the land for sale: a ribbon of gold light round the 100 acres, always on, stronger at sunset ----------
  const ribU = { uK: { value: 1 }, uT: { value: 0 } }, HG = HERO.clone();
  try { if (part.border) { const bm = new THREE.MeshBasicMaterial({ color: HG.clone().multiplyScalar(2.6), toneMapped: false }); part.border.traverse(o => { if (o.isMesh) { o.material = bm; o.castShadow = false; } }); }
    const BP = INFO.border || []; if (BP.length > 4) { const W2 = 9, pos = [], uv = [], idx = [];
      for (let i = 0; i < BP.length; i++) { const a = BP[Math.max(0, i - 1)], b = BP[Math.min(BP.length - 1, i + 1)], p = BP[i]; let dx = b[0] - a[0], dz = b[2] - a[2]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
        pos.push(p[0] - dz * W2, p[1] + 0.15, p[2] + dx * W2, p[0] + dz * W2, p[1] + 0.15, p[2] - dx * W2); uv.push(0, i, 1, i); if (i) { const k = (i - 1) * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
      const m = new THREE.ShaderMaterial({ uniforms: Object.assign(ribU, { uC: { value: new THREE.Vector3(HG.r, HG.g, HG.b) } }), transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
        vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: 'uniform float uK, uT; uniform vec3 uC; varying vec2 vU; void main(){ float d = abs(vU.x - 0.5) * 2.0; float a = exp(-d * d * 5.0) * 0.55 + exp(-d * d * 40.0) * 0.65; float run = 0.85 + 0.15 * sin(vU.y * 0.25 - uT * 2.0); gl_FragColor = vec4(mix(uC * 0.9, mix(uC, vec3(1.0), 0.45), exp(-d * d * 60.0)), clamp(a * uK * run, 0.0, 0.95)); }' });
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

  // ---------- Moonfall Lodge opens: on the lodge card the roof and dormers lift up and away over the pond side to show the seven bedrooms;
  // on the dining card the upper floor slides out past the kitchen gable as well, to show the dining room, the fireplace and the kitchen ----------
  const LG0 = INFO.lodge || null; let lodR = 0, lodU = 0;
  const lBack = LG0 ? [-Math.sin(LG0.f), -Math.cos(LG0.f)] : [0, -1];   // the lodge's local -z: the dormer and pond side
  const lYard = LG0 ? [-Math.cos(LG0.f), Math.sin(LG0.f)] : [-1, 0];   // the lodge's local -x: out past the kitchen gable, clear of the camera
  function tickLodge(dt, sel) { if (!LG0 || !part.lodge_roof) return; const id = sel && sel.id, wR = id === 'lodge' || id === 'inside' ? 1 : 0, wU = id === 'inside' ? 1 : 0;
    lodR += (wR - lodR) * Math.min(1, (wR ? 1.5 : 3) * dt); lodU += (wU - lodU) * Math.min(1, (wU ? 1.3 : 3) * dt); const r = sm(lodR), u = sm(lodU);
    const bob = !reduced ? Math.sin(clock * 1.3) * 0.15 : 0;
    part.lodge_roof.position.set(lBack[0] * 13 * r, 12 * Math.sin(Math.PI * 0.5 * Math.min(1, r * 1.3)) + (r > 0.99 ? bob : 0), lBack[1] * 13 * r);
    part.lodge_roof.traverse(m => { if (m.isMesh) m.castShadow = r < 0.05; });
    if (part.lodge_upper) { part.lodge_upper.position.set(lYard[0] * 25 * u, 3.5 * Math.sin(Math.PI * 0.5 * Math.min(1, u * 1.3)) + (u > 0.99 ? -bob * 0.6 : 0), lYard[1] * 25 * u);
      part.lodge_upper.traverse(m => { if (m.isMesh) m.castShadow = u < 0.05; }); } }

  // ---------- the fire flickers; the waterfall runs; the windows glow (life1 lights 'glass' at sunset) ----------
  const fireM = MATS.filter(m => m.name === 'fire'), fire0 = fireM.map(m => m.emissiveIntensity);
  const fallM = MATS.filter(m => m.name === 'fall' && m.map); fallM.forEach(m => { m.map.wrapS = m.map.wrapT = THREE.RepeatWrapping; m.depthWrite = false; });
  if (part.fall) part.fall.traverse(o => { if (o.isMesh) { o.renderOrder = 3; o.castShadow = false; } });
  function tickFire(t, dt) { const dk = dusk(), f = reduced ? 1 : 1 + 0.25 * Math.sin(t * 9.1) + 0.15 * Math.sin(t * 15.7 + 1.3); fireM.forEach((m, i) => { m.emissiveIntensity = fire0[i] * f * (1 + dk * 0.8); });
    if (!reduced) fallM.forEach(m => { m.map.offset.y -= dt * 0.9; }); }

  // ---------- ducks on both ponds: a pair on the Evergreen pond, one on the west pond, paddling slow loops ----------
  const PD = INFO.ponds || {}, ducks = instOf('proto_duck', 3), duckP = [];
  if (ducks) { if (PD.evergreen) { duckP.push({ c: PD.evergreen, r: 4.2, sp: 0.09, ph: 0 }, { c: PD.evergreen, r: 4.2, sp: 0.09, ph: 0.35 }); } if (PD.west) duckP.push({ c: PD.west, r: 5.5, sp: -0.07, ph: 2 }); }
  function tickDucks(t) { if (!ducks) return; duckP.forEach((d, i) => { const a = (reduced ? 0 : t) * d.sp + d.ph + (i === 1 ? 0.18 : 0), rr = d.r + (i === 1 ? 0.9 : 0);
    ducks.set(i, d.c[0] + Math.cos(a) * rr, d.c[1] + 0.02 + Math.sin(t * 1.7 + i) * 0.01, d.c[2] + Math.sin(a) * rr, -a + (d.sp > 0 ? Math.PI : 0), 1); }); ducks.done(); }

  // ---------- guests walking, following the ground (library person, eight steps of the walk) ----------
  const WK = (INFO.people && INFO.people.walkers) || [], frames = [], STRIDE = 1.4;
  for (let k = 0; k < 8; k++) frames.push(instOf('proto_person_w' + k, Math.max(1, WK.length)));
  const standI = instOf('proto_person', Math.max(1, WK.length));
  const tintAll = (I, name, i, c) => { if (!I) return; };
  const walkers = WK.map((w, i) => { const P = w.pts, cum = [0]; for (let k = 1; k < P.length; k++) cum.push(cum[k - 1] + Math.hypot(P[k][0] - P[k - 1][0], P[k][1] - P[k - 1][1]));
    return { i, P, cum, len: cum[cum.length - 1] || 1, d: (w.t0 || 0) * (cum[cum.length - 1] || 1), dir: 1, sp: w.speed || 1, wait: 0, walked: Math.random() * 3, f: -2, h: null }; });
  function tickWalk(dt) { const TS = (SC.life || {}).speed ?? 1.5;
    for (const w of walkers) { if (!reduced) { if (w.wait > 0) w.wait -= dt; else { const st = w.sp * dt * TS * 0.7; w.d += w.dir * st; w.walked += st; if (w.d > w.len) { w.d = w.len; w.dir = -1; w.wait = 3; } else if (w.d < 0) { w.d = 0; w.dir = 1; w.wait = 3; } } }
      let k = 1; while (k < w.cum.length - 1 && w.cum[k] < w.d) k++; const a = w.P[k - 1], b = w.P[k], u = cl((w.d - w.cum[k - 1]) / ((w.cum[k] - w.cum[k - 1]) || 1)), x = a[0] + (b[0] - a[0]) * u, z = a[1] + (b[1] - a[1]) * u;
      const want = Math.atan2((b[0] - a[0]) * w.dir, (b[1] - a[1]) * w.dir); w.h = w.h == null ? want : w.h + Math.atan2(Math.sin(want - w.h), Math.cos(want - w.h)) * Math.min(1, 5 * dt);
      const f = reduced || w.wait > 0 ? -1 : Math.floor((w.walked / STRIDE) * 8) % 8; if (f !== w.f) { if (w.f >= 0 && frames[w.f]) frames[w.f].hide(w.i); else if (w.f === -1 && standI) standI.hide(w.i); w.f = f; }
      const I = f >= 0 ? frames[f] : standI; if (I) I.set(w.i, x, groundY(x, z) + 0.02, z, w.h); }
    frames.forEach(f => f && f.done()); if (standI) standI.done(); }
  if (!walkers.length) frames.forEach(f => { if (f) { f.hide(0); f.done(); } });

  // ---------- the fourth bear: it holds the carved bears' pose; every 11 s or so it lifts a paw and scratches behind its ear, then freezes ----------
  const BR = INFO.bear || null, bA = part.bear_arm, bH = part.bear_head;
  const piv = (o, p, axis, ang) => { o.matrixAutoUpdate = false; const m = new THREE.Matrix4().makeTranslation(p[0], p[1], p[2]).multiply(new THREE.Matrix4().makeRotationAxis(axis, ang)).multiply(new THREE.Matrix4().makeTranslation(-p[0], -p[1], -p[2])); o.matrix.copy(m); o.matrixWorldNeedsUpdate = true; };
  let bearT = 4;
  const bearAx = BR ? { side: new THREE.Vector3(Math.cos(BR.ry), 0, -Math.sin(BR.ry)), face: new THREE.Vector3(Math.sin(BR.ry), 0, Math.cos(BR.ry)) } : null;
  function tickBear(dt) { if (!BR || !bA || !bH) return; bearT += reduced ? 0 : dt; const P = 11.5, c = bearT % P;
    // 0 to 8.3 s: still. 8.3 to 8.9: the paw comes up. 8.9 to 10.4: scratch, the head tips into it. 10.4 to 11: back to the pose, frozen.
    const up = c < 8.3 ? 0 : c < 8.9 ? sm((c - 8.3) / 0.6) : c < 10.4 ? 1 : c < 11 ? 1 - sm((c - 10.4) / 0.6) : 0;
    const scr = c > 8.9 && c < 10.4 ? Math.sin((c - 8.9) * 26) * 0.16 : 0;
    piv(bA, BR.arm, bearAx.side, -(2.35 * up + scr * up));
    piv(bH, BR.neck, bearAx.face, 0.3 * up + scr * 0.4 * up); }
  window.__tmbear = (c) => { bearT = c; };

  // ---------- string lights: small warm bulbs on wires between the posts; off by day, on at sunset in a wave from the lodge outwards ----------
  const BL = INFO.bulbs || {}, ALL = [];
  for (const [k, L] of Object.entries(BL)) (L || []).forEach((p, i) => ALL.push({ p, k, run: L }));
  const lodgeAt = LG0 ? LG0.at : [0, 0, 0], growLan = ((INFO.grow || {}).lanterns || []);
  const bulbM = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffc983').multiplyScalar(3), toneMapped: false, transparent: true, opacity: 0, depthWrite: false });
  const bulbI = new THREE.InstancedMesh(new THREE.SphereGeometry(0.16, 6, 4), bulbM, Math.max(1, ALL.length + growLan.length)); bulbI.frustumCulled = false; bulbI.renderOrder = 6;
  const bulbD = [], m4 = new THREE.Matrix4(), col = new THREE.Color();
  ALL.forEach((b, i) => { bulbI.setMatrixAt(i, m4.makeTranslation(b.p[0], b.p[1], b.p[2])); bulbD.push(Math.hypot(b.p[0] - lodgeAt[0], b.p[2] - lodgeAt[2])); bulbI.setColorAt(i, col.setScalar(0)); });
  growLan.forEach((p, j) => { const i = ALL.length + j; bulbI.setMatrixAt(i, m4.makeTranslation(p[0], p[1], p[2])); bulbD.push(-1); bulbI.setColorAt(i, col.setScalar(0)); });
  root.add(bulbI);
  // from far away a bulb is smaller than a pixel: a soft glow point keeps each one reading on the desk
  const ptsG = new THREE.BufferGeometry(); { const a = []; ALL.forEach(b => a.push(b.p[0], b.p[1], b.p[2])); growLan.forEach(p => a.push(p[0], p[1], p[2])); ptsG.setAttribute('position', new THREE.Float32BufferAttribute(a, 3));
    const c = new Float32Array(a.length).fill(0); ptsG.setAttribute('color', new THREE.BufferAttribute(c, 3)); }
  const ptsM = new THREE.PointsMaterial({ size: 4, sizeAttenuation: false, opacity: 0.55, map: glowTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const bulbPts = new THREE.Points(ptsG, ptsM); bulbPts.frustumCulled = false; bulbPts.renderOrder = 7; root.add(bulbPts);
  // the wires: thin dark lines bulb to bulb where they belong to one run
  { const a = []; for (const L of Object.values(BL)) for (let i = 1; i < (L || []).length; i++) { const p = L[i - 1], q = L[i]; if (Math.hypot(q[0] - p[0], q[2] - p[2]) < 3.2) a.push(p[0], p[1] + 0.12, p[2], q[0], q[1] + 0.12, q[2]); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(a, 3)); const w = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#2a2622', transparent: true, opacity: 0.8 })); w.frustumCulled = false; root.add(w); }
  const maxD = Math.max(1, ...bulbD); let lastLit = -1, growK = 0;
  function tickBulbs(t) { const dk = dusk(), wave = cl((dk - 0.3) / 0.7) * 1.25; const key = Math.round(wave * 60) + (growK > 0.5 ? 1000 : 0) + Math.round(t * 4) * 1e4;
    if (key === lastLit) return; lastLit = key; const cA = ptsG.attributes.color.array;
    for (let i = 0; i < bulbD.length; i++) { let v; if (bulbD[i] < 0) v = growK > 0.5 ? cl((dk - 0.3) / 0.4) : 0; else v = sm((wave - bulbD[i] / maxD) / 0.2);
      const tw = reduced ? 1 : 0.9 + 0.1 * Math.sin(t * 3 + i * 1.7); bulbI.setColorAt(i, col.setScalar(v * tw)); cA[i * 3] = v * tw * 1.0; cA[i * 3 + 1] = v * tw * 0.72; cA[i * 3 + 2] = v * tw * 0.42; }
    bulbI.instanceColor.needsUpdate = true; ptsG.attributes.color.needsUpdate = true; bulbM.opacity = dk > 0.05 ? 1 : 0; bulbI.visible = bulbPts.visible = dk > 0.02; }

  // ---------- THE TWO MOONS (Adam, 14-11-2026: "two floating moons above the model in the sky, quite high up, that just stay where they are ...
  // just like everything else"): two real spheres in the model's own world, high over the eastern side, a full moon and a smaller warmer companion.
  // Pale by day; bright, with soft halos, at Sunset. They turn and zoom with the model like any building.
  const MOONS = (SC.life && SC.life.moons3d) || [{ at: [330, 390, -60], r: 50, warm: false, col: '#f4f6ff' }, { at: [470, 345, 60], r: 33, warm: true, col: '#fff0dc' }];
  const mdir = (az, el) => { const a = az * Math.PI / 180, e = el * Math.PI / 180; return new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)); };
  const moonTex = (warm) => { const W = 512, Hh = 256, c = document.createElement('canvas'); c.width = W; c.height = Hh; const x = c.getContext('2d');
    x.fillStyle = warm ? '#efe0c8' : '#e3e6ee'; x.fillRect(0, 0, W, Hh); let s = warm ? 91 : 37; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 9; i++) { const cx = r() * W, cy = 50 + r() * 150, rr = 30 + r() * 70; const g = x.createRadialGradient(cx, cy, 0, cx, cy, rr); g.addColorStop(0, warm ? 'rgba(150,130,110,0.45)' : 'rgba(120,126,142,0.45)'); g.addColorStop(1, 'rgba(120,126,142,0)'); x.fillStyle = g; x.fillRect(cx - rr, cy - rr, rr * 2, rr * 2); }
    for (let i = 0; i < 70; i++) { const cx = r() * W, cy = r() * Hh, rr = 2 + r() * 11; x.fillStyle = `rgba(90,94,110,${0.12 + r() * 0.2})`; x.beginPath(); x.ellipse(cx, cy, rr, rr * 0.9, 0, 0, Math.PI * 2); x.fill(); x.strokeStyle = 'rgba(255,255,255,0.25)'; x.lineWidth = 1; x.beginPath(); x.arc(cx - 1, cy - 1, rr, 3.6, 5.6); x.stroke(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; return t; };
  const moons = MOONS.map((M, i) => { const mat = new THREE.MeshBasicMaterial({ map: moonTex(M.warm), color: new THREE.Color(0.92, 0.92, 0.92), toneMapped: false, fog: false });
    const m = new THREE.Mesh(new THREE.SphereGeometry(M.r, 48, 32), mat); m.position.set(...M.at); m.rotation.y = i * 2.1; m.name = 'moon' + i; m.renderOrder = 1; model.add(m);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: new THREE.Color(M.col), toneMapped: false, transparent: true, opacity: 0.1, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    halo.scale.setScalar(M.r * 5.5); halo.position.set(...M.at); halo.renderOrder = 0; model.add(halo); return { M, m, mat, halo }; });
  const sky = new THREE.Group(); sky.name = 'twomoons_stars'; scene.add(sky);

  // stars: a dome of small points round the camera, the eastern sky a little brighter
  const stars = (() => { const a = [], c = []; let s = 11; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 1400; i++) { const az = r() * Math.PI * 2, el = Math.asin(0.02 + r() * 0.98), d = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)); a.push(d.x, d.y, d.z); const b = 0.35 + r() * 0.65; c.push(b, b, b * 1.05); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(a, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3));
    const p = new THREE.Points(g, new THREE.PointsMaterial({ size: 1.8, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0, depthWrite: false, toneMapped: false, fog: false })); p.renderOrder = -12; p.frustumCulled = false; sky.add(p); return p; })();
  // a cool rim of moonlight from the east on the treetops and roofs (thin, never frosty)
  const moonL = new THREE.DirectionalLight(new THREE.Color(0.55, 0.68, 1.0), 0); { const d = mdir(110, 32); moonL.position.copy(d); moonL.target.position.set(0, 0, 0); } model.add(moonL, moonL.target);
  // moon path: a glinting streak on each pond, running from the near shore toward the moons
  const pathTex = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 256; const x = c.getContext('2d'); let s = 5; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 420; i++) { const v = r(), w = (1 - Math.abs(v - 0.5) * 2) ** 2, px = 32 + (r() - 0.5) * 50 * (0.25 + 0.75 * v); x.fillStyle = `rgba(255,255,255,${0.15 + 0.6 * r() * w})`; x.fillRect(px, v * 256, 2 + r() * 6, 1 + r() * 2); }
    const t = new THREE.CanvasTexture(c); t.wrapT = THREE.RepeatWrapping; return t; })();
  const moonPaths = [];
  for (const [k, c] of Object.entries(PD)) { const len = k === 'west' ? 22 : 16, wid = k === 'west' ? 5 : 4, m = new THREE.MeshBasicMaterial({ map: pathTex.clone(), color: new THREE.Color('#dfe6ff').multiplyScalar(1.6), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    m.map.needsUpdate = true; m.map.wrapT = THREE.RepeatWrapping; const g = new THREE.PlaneGeometry(wid, len); g.rotateX(-Math.PI / 2); const mesh = new THREE.Mesh(g, m); mesh.position.set(c[0], c[1] + 0.06, c[2]); { const mm = MOONS[0].at; mesh.rotation.y = Math.atan2(mm[0] - c[0], mm[2] - c[2]); } mesh.renderOrder = 5; root.add(mesh); moonPaths.push(mesh); }
  function tickMoons(t) { const dk = dusk(), k = sm((dk - 0.25) / 0.75); sky.visible = k > 0.003; moonL.intensity = 0.55 * k;
    moons.forEach((o, i) => { const b = 0.92 + 0.5 * k; o.mat.color.setRGB(b, b, b); o.halo.material.opacity = 0.1 + 0.42 * k * (1 + 0.04 * Math.sin(t * 0.7 + i)); o.halo.scale.setScalar(o.M.r * (5.5 + 1.5 * k)); });
    if (sky.visible) { stars.position.copy(camera.position); stars.scale.setScalar(30 * 1.2); stars.material.opacity = 0.85 * k; }
    moonPaths.forEach((m, i) => { m.material.opacity = 0.55 * k * (reduced ? 1 : 0.8 + 0.2 * Math.sin(t * 1.3 + i)); if (!reduced) m.material.map.offset.y = t * 0.05; }); }

  // ---------- Room to grow: the new lodge rises out of light in its clearing, first one floor (60,000 sq ft), then the second floor option
  // (about 120,000 sq ft); six log cabins rise in the glade one by one; the wellness deck; the trees in the clearing go ----------
  const GR = INFO.grow || {}, GP = GR.pieces || [], GC = GR.cabins || [];
  const names = Object.keys(part).filter(n => n.startsWith('grow_'));
  names.forEach(n => { part[n].visible = false; });
  const tagSet = (txt) => { if (X.GROW && X.GROW.tag) X.GROW.tag.text = txt; };
  const TAG1 = (SC.life && SC.life.growTag1) || 'Idea: 60,000 sq ft lodge', TAG2 = (SC.life && SC.life.growTag2) || 'Second floor option: about 120,000 sq ft';
  let growT = 0, wasGrow = false;
  function tickGrow(dt, on) { if (on && !wasGrow) growT = 0; wasGrow = on; growK += ((on ? 1 : 0) - growK) * Math.min(1, 4 * dt); if (part.growtrees) part.growtrees.visible = !on;
    if (!on) { names.forEach(n => { part[n].visible = false; }); return; }
    growT += reduced ? 99 : dt; const t = growT;
    GP.forEach((p, i) => { const a = 0.3 + i * 0.12, u = cl((t - a) / 0.9), b = back(u), up2 = cl((t - 4.2 - i * 0.08) / 1.1), b2 = back(up2), STORY = 4;
      const bp = part[p.base], upp = part[p.up], rf = part[p.roof];
      if (bp) { bp.visible = u > 0; bp.position.y = -6 * (1 - b); }
      if (upp) { upp.visible = up2 > 0; upp.position.y = -STORY * (1 - b2) - 6 * (1 - b); upp.scale.y = Math.max(1e-3, b2); upp.position.y += (p.f + p.e1) * (1 - Math.max(1e-3, b2)); }
      if (rf) { rf.visible = u > 0; rf.position.y = -STORY * (1 - b2) - 6 * (1 - b); } });
    GC.forEach((c, i) => { const pt = part[c.part]; if (!pt) return; const u = cl((t - 1.6 - i * 0.3) / 0.7); pt.visible = u > 0; pt.position.y = -5 * (1 - back(u)); });
    ['grow_deck', 'grow_lanterns'].forEach((n, j) => { const pt = part[n]; if (!pt) return; const u = cl((t - 2.8 - j * 0.4) / 0.7); pt.visible = u > 0; pt.position.y = -3 * (1 - back(u)); });
    tagSet(t < 4.2 ? TAG1 : TAG2); }

  // the stars card works best at night: choosing it turns Sunset on (once per choice)
  let lastSel = null; function tickStars(sel) { const id = sel && sel.id; if (id !== lastSel) { lastSel = id; if (id === 'stars' && window.__sunset && dusk() < 0.5) window.__sunset(true); } }

  // ---------- every frame ----------
  function tick(dt, state = {}) { base.tick(dt, state); clock += dt;
    tickLodge(dt, state.sel); tickFire(clock, dt); tickDucks(clock); tickWalk(dt); tickBear(dt); tickGrow(dt, !!state.growOn); tickBulbs(clock); tickMoons(clock); tickStars(state.sel);
    ribU.uT.value = clock; ribU.uK.value = 1.05 + 0.6 * dusk(); }
  window.__tm = { part, root, FX, moons, sky, look: (v) => X.goView(v, 0.01) };
  return { fx: FX, tick, dusk: base.dusk };
}
