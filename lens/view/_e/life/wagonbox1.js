// Wagon Box Inn & Resort life layer (wagonbox1, 16-11-2026). The Two Moons pattern (life1 underneath: Sunset switch, moving water, the backdrop,
// tap a thing to open its card; the border ribbon; ground grain) with this place's own pieces:
// - building 23 opens like a doll's house: on the hall card the green gambrel roof lifts away to show the upstairs hall (band stage, bar,
//   pine floor, wagon wheel chandeliers); on the restaurant card the long low roof lifts to show the tavern (fireplace, pool tables, booths, piano)
// - THE WHEELS LIGHT at Sunset: every wagon wheel chandelier in the hall and the tavern lights first, then the deck heaters, a porch light at
//   each unit in a wave out from the inn, and a string of small lights along the sign's wagon; the fire flickers; deer come out on the lawns
// - ducks on the pond, guests walking the lawns and the drive
// - the joke, "Ready when you are": now and then a guest climbs up onto the old lawn wagon's seat while a friend holds up a phone, and a horse
//   wanders over and stands quietly where it would be harnessed; when the guest climbs down the horse wanders back. No card, no tour stop and no
//   camera move point at it.
// - Room to grow (the film's idea): ONE wall tent, then cabins and wall tents GROW UP OUT OF THE GROUND on the open lawns (Adam 16-11-2026: they
//   never fly in), each on a pool of white light that warms; the trees on those spots go; the restaurant building's windows light.
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
  const root = new THREE.Group(); root.name = 'wagonbox_life'; model.add(root);
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
  const sprite = (col, size, op = 0) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: new THREE.Color(col), toneMapped: false, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending })); s.scale.setScalar(size); s.renderOrder = 7; root.add(s); return s; };

  // ---------- the land for sale: a ribbon of the broker's red round the traced outline, always on, stronger at sunset ----------
  const ribU = { uK: { value: 1 }, uT: { value: 0 } }, HG = HERO.clone();
  try { if (part.border) { const bm = new THREE.MeshBasicMaterial({ color: HG.clone().multiplyScalar(2.2), toneMapped: false }); part.border.traverse(o => { if (o.isMesh) { o.material = bm; o.castShadow = false; } }); }
    const BP = INFO.border || []; if (BP.length > 4) { const W2 = 6, pos = [], uv = [], idx = [];
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

  // ---------- building 23 opens: the gambrel lifts off the hall (hall card), the low roof lifts off the tavern (restaurant card) ----------
  const IN = INFO.inn || null; let rG = 0, rL = 0;
  const nrth = IN ? [-Math.sin(IN.f), -Math.cos(IN.f)] : [0, -1];   // the inn's local -z: away from the car park, behind the hall
  const sth = IN ? [Math.sin(IN.f), Math.cos(IN.f)] : [0, 1];      // local +z: out over the car park side
  function tickInn(dt, sel) { if (!IN) return; const id = sel && sel.id, wG = id === 'hall' ? 1 : 0, wL = id === 'restaurant' ? 1 : 0;
    rG += (wG - rG) * Math.min(1, (wG ? 1.5 : 3) * dt); rL += (wL - rL) * Math.min(1, (wL ? 1.5 : 3) * dt); const g = sm(rG), l = sm(rL), bob = !reduced ? Math.sin(clock * 1.3) * 0.12 : 0;
    if (part.inn_roof) { part.inn_roof.position.set(nrth[0] * 14 * g, 11 * Math.sin(Math.PI * 0.5 * Math.min(1, g * 1.3)) + (g > 0.99 ? bob : 0), nrth[1] * 14 * g); part.inn_roof.traverse(m => { if (m.isMesh) m.castShadow = g < 0.05; }); }
    if (part.inn_lowroof) { part.inn_lowroof.position.set(sth[0] * 15 * l, 9 * Math.sin(Math.PI * 0.5 * Math.min(1, l * 1.3)) + (l > 0.99 ? -bob : 0), sth[1] * 15 * l); part.inn_lowroof.traverse(m => { if (m.isMesh) m.castShadow = l < 0.05; }); } }

  // ---------- the fire flickers; the lanterns on the wheels ----------
  const fireM = MATS.filter(m => m.name === 'fire'), fire0 = fireM.map(m => m.emissiveIntensity);
  const lantM = MATS.filter(m => m.name === 'lantern'), lant0 = lantM.map(m => m.emissiveIntensity);
  function tickFire(t) { const dk = dusk(), f = reduced ? 1 : 1 + 0.25 * Math.sin(t * 9.1) + 0.15 * Math.sin(t * 15.7 + 1.3); fireM.forEach((m, i) => { m.emissiveIntensity = fire0[i] * f * (1 + dk * 0.8); });
    const k = sm((dk - 0.3) / 0.25); lantM.forEach((m, i) => { m.emissiveIntensity = lant0[i] + 3.2 * k; }); }

  // ---------- ducks on the pond ----------
  const PD = INFO.pond, ducks = instOf('proto_duck', 2);
  function tickDucks(t) { if (!ducks || !PD) return; for (let i = 0; i < 2; i++) { const a = (reduced ? 0 : t) * 0.08 + i * 0.35, rr = 5 + i * 0.9; ducks.set(i, PD[0] + Math.cos(a) * rr, PD[1] + 0.27 + Math.sin(t * 1.7 + i) * 0.01, PD[2] + Math.sin(a) * rr, -a + Math.PI, 1); } ducks.done(); }

  // ---------- deer come out on the lawns at dusk (Hipcamp: deer roam freely) ----------
  const DE = INFO.deer || [], deer = instOf('proto_deer', Math.max(1, DE.length));
  function tickDeer(t) { if (!deer) return; const k = sm((dusk() - 0.35) / 0.3); DE.forEach((p, i) => { if (k < 0.02) { deer.hide(i); return; } const dx = reduced ? 0 : Math.sin(t * 0.05 + i) * 1.5; deer.set(i, p[0] + dx, groundY(p[0] + dx, p[2]), p[2], i * 2.1 + 0.4, k); }); deer.done(); }

  // ---------- guests walking, following the ground (library person, eight steps of the walk) ----------
  const WK = (INFO.people && INFO.people.walkers) || [], frames = [], STRIDE = 1.4;
  for (let k = 0; k < 8; k++) frames.push(instOf('proto_person_w' + k, Math.max(1, WK.length)));
  const standI = instOf('proto_person', Math.max(1, WK.length));
  const walkers = WK.map((w, i) => { const P = w.pts, cum = [0]; for (let k = 1; k < P.length; k++) cum.push(cum[k - 1] + Math.hypot(P[k][0] - P[k - 1][0], P[k][1] - P[k - 1][1]));
    return { i, P, cum, len: cum[cum.length - 1] || 1, d: (w.t0 || 0) * (cum[cum.length - 1] || 1), dir: 1, sp: w.speed || 1, wait: 0, walked: Math.random() * 3, f: -2, h: null, y: w.y, face: w.face, joke: w.joke }; });
  // standing people are always these animated walkers (Adam 16-11-2026): y = a floor inside the inn, face = what they turn to when they stop,
  // joke = 'friend' (paces round the wagon framing the photo) or 'guest' (climbs down at 26.5 s and walks off toward the inn)
  const hideW = (w) => { if (w.f >= 0 && frames[w.f]) frames[w.f].hide(w.i); else if (w.f === -1 && standI) standI.hide(w.i); w.f = -2; };
  function tickWalk(dt) { const TS = (SC.life || {}).speed ?? 1.5, jt = jokeT;
    for (const w of walkers) {
      if (w.joke === 'friend' && !(jt < 40 || jt > 58)) { hideW(w); continue; }
      if (w.joke === 'guest') { const on = jt > 26.5 && jt < 40, before = jt > 58 || jt < 2.5; if (!on && !before) { hideW(w); continue; }
        if (before) { w.d = 0; w.wait = 1; } else { const nd = Math.min(w.len, (jt - 26.8) * 1.1); w.walked += Math.max(0, nd - w.d); w.wait = nd >= w.len || nd <= 0 ? 1 : 0; w.d = Math.max(0, nd); w.dir = 1; } }
      else if (!reduced) { if (w.wait > 0) w.wait -= dt; else { const st = w.sp * dt * TS * 0.7; w.d += w.dir * st; w.walked += st; if (w.d > w.len) { w.d = w.len; w.dir = -1; w.wait = w.face ? 5 : 3; } else if (w.d < 0) { w.d = 0; w.dir = 1; w.wait = w.face ? 5 : 3; } } }
      let k = 1; while (k < w.cum.length - 1 && w.cum[k] < w.d) k++; const a = w.P[k - 1], b = w.P[k], u = cl((w.d - w.cum[k - 1]) / ((w.cum[k] - w.cum[k - 1]) || 1)), x = a[0] + (b[0] - a[0]) * u, z = a[1] + (b[1] - a[1]) * u;
      let want = Math.atan2((b[0] - a[0]) * w.dir, (b[1] - a[1]) * w.dir); if (w.wait > 0 && w.face) want = Math.atan2(w.face[0] - x, w.face[1] - z);
      w.h = w.h == null || reduced ? want : w.h + Math.atan2(Math.sin(want - w.h), Math.cos(want - w.h)) * Math.min(1, 4 * dt);
      const f = reduced || w.wait > 0 ? -1 : Math.floor((w.walked / STRIDE) * 8) % 8; if (f !== w.f) { if (w.f >= 0 && frames[w.f]) frames[w.f].hide(w.i); else if (w.f === -1 && standI) standI.hide(w.i); w.f = f; }
      const y = w.y != null ? w.y : groundY(x, z) + 0.02, I = f >= 0 ? frames[f] : standI; if (I) I.set(w.i, x, y, z, w.h);
      if (w.joke === 'friend') w.at = [x, y, z, w.h]; }
    frames.forEach(f => f && f.done()); if (standI) standI.done(); }
  if (!walkers.length) frames.forEach(f => { if (f) { f.hide(0); f.done(); } });

  // ---------- "Ready when you are": a 60 s loop. 0 to 2.5 the guest and the friend at the wagon; 2.5 the guest climbs up, the phone comes up;
  // 4 to 16 the horse wanders over from the edge of the lawn; 16 to 26 it waits where it would be harnessed; 26.5 the guest climbs down;
  // 27 to 39 the horse wanders back; 40 to 58 the wagon stands empty. ----------
  const J = INFO.joke || null, jH = part.joke_horse, jG = part.joke_guest, jD = part.joke_guest_down, jF = part.joke_friend, jP = part.joke_phone;
  let jokeT = 20, hHead = null;
  function tickJoke(dt) { if (!J || !jH) return; jokeT = reduced ? 20 : (jokeT + dt) % 60; const t = jokeT;
    const H = J.horse.at, A = J.away, hh = J.horse.ry;
    const toH = Math.atan2(H[0] - A[0], H[2] - A[2]), toA = toH + Math.PI;
    let u, want; if (t < 4) { u = 0; want = toH; } else if (t < 16) { u = sm((t - 4) / 12); want = toH; } else if (t < 27) { u = 1; want = hh; } else if (t < 39) { u = 1 - sm((t - 27) / 12); want = toA; } else { u = 0; want = toA; }
    if (t >= 16 && t < 27) want = hh;
    if (hHead == null || reduced) hHead = want; else hHead += Math.atan2(Math.sin(want - hHead), Math.cos(want - hHead)) * Math.min(1, 2.5 * dt);
    const walking = (t > 4 && t < 16) || (t > 27 && t < 39), x = A[0] + (H[0] - A[0]) * u, z = A[2] + (H[2] - A[2]) * u, y = (u > 0.98 ? H[1] : groundY(x, z)) + (walking ? Math.abs(Math.sin(t * 5.5)) * 0.05 : 0);
    jH.matrixAutoUpdate = false; jH.matrix.makeTranslation(x, y, z).multiply(new THREE.Matrix4().makeRotationY(hHead - hh)).multiply(new THREE.Matrix4().makeTranslation(-H[0], -H[1], -H[2])); jH.matrixWorldNeedsUpdate = true;
    const seated = t > 2.5 && t < 26.5, people = t < 40 || t > 58;
    if (jG) jG.visible = seated; if (jD) jD.visible = people && !seated; if (jF) jF.visible = people;
    const fr = walkers.find(w => w.joke === 'friend'), P0 = AN.joke_phone && AN.joke_phone.ctr;
    if (jP) { jP.visible = seated && t > 3 && !!(fr && fr.at); if (jP.visible && P0) { const [x, y, z, h] = fr.at; jP.matrixAutoUpdate = false; jP.matrix.makeTranslation(x + Math.sin(h) * 0.42 - P0[0], y + 1.48 - P0[1], z + Math.cos(h) * 0.42 - P0[2]); jP.matrixWorldNeedsUpdate = true; } } }
  const AN = INFO.anchors || {}, angP = part.angler, AC = AN.angler && AN.angler.ctr;
  function tickAngler(t) { if (!angP || !AC || reduced) return; const a = Math.sin(t * 0.45) * 0.4 + Math.sin(t * 1.3) * 0.06;
    angP.matrixAutoUpdate = false; angP.matrix.makeTranslation(AC[0], 0, AC[2]).multiply(new THREE.Matrix4().makeRotationY(a)).multiply(new THREE.Matrix4().makeTranslation(-AC[0], 0, -AC[2])); angP.matrixWorldNeedsUpdate = true; }

  // ---------- lights for Sunset: the wheels (hall, then tavern), the deck heaters, a porch light at every unit in a wave out from the inn, the sign ----------
  const BL = INFO.bulbs || {}, ALL = [], innAt = IN ? IN.at : [0, 0, 0];
  const order = { hall: 0, tavern: 0.08, heaters: 0.15, sign: 0.2, porches: 0.25 };
  for (const [k, L] of Object.entries(BL)) (L || []).forEach((p) => ALL.push({ p, k, d: (order[k] ?? 0.3) + (k === 'porches' ? 0.6 * Math.min(1, Math.hypot(p[0] - innAt[0], p[2] - innAt[2]) / 220) : 0) }));
  const col = { hall: [1.0, 0.72, 0.42], tavern: [1.0, 0.72, 0.42], heaters: [1.0, 0.5, 0.2], sign: [1.0, 0.85, 0.6], porches: [1.0, 0.68, 0.38] };
  const ptsG = new THREE.BufferGeometry(); { const a = []; ALL.forEach(b => a.push(b.p[0], b.p[1], b.p[2])); ptsG.setAttribute('position', new THREE.Float32BufferAttribute(a, 3)); ptsG.setAttribute('color', new THREE.BufferAttribute(new Float32Array(a.length), 3)); }
  const ptsM = new THREE.PointsMaterial({ size: 5, sizeAttenuation: false, opacity: 0.6, map: glowTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const bulbPts = new THREE.Points(ptsG, ptsM); bulbPts.frustumCulled = false; bulbPts.renderOrder = 7; root.add(bulbPts);
  let lastLit = -1;
  function tickBulbs(t) { const dk = dusk(), wave = cl((dk - 0.3) / 0.6) * 1.25, key = Math.round(wave * 80) + Math.round(t * 4) * 1e4; if (key === lastLit) return; lastLit = key;
    const cA = ptsG.attributes.color.array; ALL.forEach((b, i) => { const v = sm((wave - b.d) / 0.2), tw = reduced ? 1 : 0.9 + 0.1 * Math.sin(t * 3 + i * 1.7), c = col[b.k] || col.porches; cA[i * 3] = v * tw * c[0]; cA[i * 3 + 1] = v * tw * c[1]; cA[i * 3 + 2] = v * tw * c[2]; });
    ptsG.attributes.color.needsUpdate = true; bulbPts.visible = dk > 0.02; }

  // ---------- Room to grow: cabins and wall tents grow up out of the ground, the first wall tent first; the restaurant's windows light ----------
  const GR = INFO.grow || {}, GU = GR.units || [];
  const names = Object.keys(part).filter(n => n.startsWith('grow_')); names.forEach(n => { part[n].visible = false; });
  const pools = GU.map(u => { const s = sprite('#ffffff', 16); s.position.set(u.at[0], u.at[1] + 1.2, u.at[2]); s.visible = false; return s; });
  const innGlow = IN ? sprite('#ffc890', 40) : null; if (innGlow) innGlow.position.set(IN.at[0], IN.at[1] + 5, IN.at[2]);
  const tagSet = (txt) => { if (X.GROW && X.GROW.tag) X.GROW.tag.text = txt; };
  const TAG1 = (SC.life && SC.life.growTag1) || 'Idea: more cabins and tents', TAG2 = (SC.life && SC.life.growTag2) || 'The restaurant: ready to lease';
  let growT = 0, wasGrow = false;
  function tickGrow(dt, on) { if (on && !wasGrow) growT = 0; wasGrow = on; if (part.growtrees) part.growtrees.visible = !on;
    if (!on) { names.forEach(n => { part[n].visible = false; }); pools.forEach(p => { p.visible = false; }); if (innGlow) innGlow.material.opacity = 0; return; }
    growT += reduced ? 99 : dt; const t = growT;
    GU.forEach((u, i) => { const pt = part[u.part]; if (!pt) return; const a = t - 0.3 - u.t, k = cl(a / 1.6); pt.visible = k > 0; pt.position.y = -(u.h + 0.3) * (1 - back(k));
      const p = pools[i]; p.visible = a > -0.4 && a < 4; p.material.opacity = 0.5 * sm((a + 0.4) / 0.4) * (1 - sm((a - 1.6) / 2.2)); });
    if (innGlow) innGlow.material.opacity = 0.32 * sm((t - 5.5) / 1.5);
    tagSet(t < 5.5 ? TAG1 : TAG2); }

  // ---------- every frame ----------
  function tick(dt, state = {}) { base.tick(dt, state); clock += dt;
    tickInn(dt, state.sel); tickFire(clock); tickDucks(clock); tickDeer(clock); tickJoke(dt); tickWalk(dt); tickAngler(clock); tickBulbs(clock); tickGrow(dt, !!state.growOn);
    ribU.uT.value = clock; ribU.uK.value = 1.0 + 0.6 * dusk(); }
  window.__wb = { part, root, FX, joke: (c) => { jokeT = c; }, look: (v) => X.goView(v, 0.01) };
  return { fx: FX, tick, dusk: base.dusk };
}
