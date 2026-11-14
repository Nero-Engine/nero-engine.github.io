// Wilderness RV Park life layer (wilderness1, 14-11-2026). life1 underneath (Sunset switch, moving water on the ponds and the pool, the backdrop,
// tap a thing to open its card, the height grid for the ground), with this park's own pieces:
// - the broker's border as a ribbon of green light, always on, stronger at Sunset
// - the clubhouse roof lifts on the clubhouse card (the office on the left, the rec hall on the right)
// - a pair of ducks paddles on Muscogie Lake; people walk the foot path, one with a dog; the heron stands at Big Cat Pond
// - Sunset: the windows light, the pool glows turquoise, the hookup pedestals light up site by site, and the pavilion fills for the pot luck
//   (people and dishes at the tables; no card says where the pot luck happens)
// - the joke "Big Cat": the angler on the Big Cat Pond bank; his folding chair is taken by a big ginger cat asleep in it. Every 20 s he turns,
//   looks at the cat, and goes to fish from beside his cooler instead. No card, no tour stop and no camera move point at it.
// - card effects: wrpads (frames of light round the sites, row by row, no number shown)
// - Room to grow (matches the film): white columns rise from the pedestals and every site frame lights, in a wave from the E row
//   ("More 50 amp sites"), then a bright green fill and rising green columns over the woods inside the border ("Woods inside the border").
//   No new pads drawn.
// It moves in the web viewer only. The AR file stays a still model.
let THREE;

export async function init(X) {
  THREE = X.THREE;
  const v = new URL(import.meta.url).searchParams.get('l1');
  const SC = X.SC, INFO = X.INFO;
  const base = await (await import('./life1.js' + (v ? '?v=' + v : ''))).init(X);
  const { model, part, MATS, D, NV, camera } = X;
  const reduced = !!NV.reduced, HERO = new THREE.Color(D.theme.hero), PY = (INFO.protoAt || [0, -8, 0])[1];
  const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), sm = (x) => { x = cl(x); return x * x * (3 - 2 * x); };
  const flash = (t, a, d, decay = 2.2) => t <= a ? 0 : t < a + d ? (t - a) / d : Math.exp(-(t - a - d) * decay);
  const lightM = (k, o = {}) => new THREE.MeshBasicMaterial(Object.assign({ color: new THREE.Color('#fff4dc').multiplyScalar(k), toneMapped: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }, o));
  const FX = Object.assign({}, base.fx);
  const root = new THREE.Group(); root.name = 'wilderness_life'; model.add(root);
  const groundY = base.groundY || X.groundY || (() => 0);
  const dusk = () => (base.dusk ? base.dusk() : 0);
  let clock = 0;
  const kidGeo = (name) => { const out = []; if (!part[name]) return out; part[name].traverse(o => { if (o.isMesh) { const g = o.geometry.clone(); o.updateMatrixWorld(); const m = new THREE.Matrix4().copy(part[name].matrixWorld).invert().multiply(o.matrixWorld); g.applyMatrix4(m); g.translate(0, -PY, 0); out.push([g, o.material]); } }); return out; };
  const instOf = (name, n, parent = root) => { const G = kidGeo(name); if (!G.length || !n) return null; const ims = G.map(([g, m]) => { const im = new THREE.InstancedMesh(g, m, n); im.castShadow = true; im.frustumCulled = false; parent.add(im); return im; });
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0), pv = new THREE.Vector3(), sv = new THREE.Vector3();
    const I = { set(i, x, y, z, ry = 0, s = 1) { q.setFromAxisAngle(Y, ry); m4.compose(pv.set(x, y, z), q, sv.setScalar(Math.max(1e-4, s))); ims.forEach(im => im.setMatrixAt(i, m4)); },
      hide(i) { this.set(i, 0, PY, 0, 0, 1e-4); }, done() { ims.forEach(im => { im.instanceMatrix.needsUpdate = true; }); } };
    for (let i = 0; i < n; i++) I.hide(i); I.done(); return I; };
  const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();

  // ---------- the land for sale: a ribbon of green light round the broker's box, always on, stronger at sunset ----------
  const ribU = { uK: { value: 1 }, uT: { value: 0 } };
  try { if (part.border) { const bm = new THREE.MeshBasicMaterial({ color: HERO.clone().multiplyScalar(2.4), toneMapped: false }); part.border.traverse(o => { if (o.isMesh) { o.material = bm; o.castShadow = false; } }); }
    const BP = INFO.border || []; if (BP.length > 4) { const W2 = 3, pos = [], uv = [], idx = []; const P2 = BP.concat([BP[0]]);
      for (let i = 0; i < P2.length; i++) { const a = P2[Math.max(0, i - 1)], b = P2[Math.min(P2.length - 1, i + 1)], p = P2[i]; let dx = b[0] - a[0], dz = b[2] - a[2]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
        pos.push(p[0] - dz * W2, p[1] + 0.15, p[2] + dx * W2, p[0] + dz * W2, p[1] + 0.15, p[2] - dx * W2); uv.push(0, i, 1, i); if (i) { const k = (i - 1) * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
      const m = new THREE.ShaderMaterial({ uniforms: Object.assign(ribU, { uC: { value: new THREE.Vector3(HERO.r, HERO.g, HERO.b) } }), transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
        vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: 'uniform float uK, uT; uniform vec3 uC; varying vec2 vU; void main(){ float d = abs(vU.x - 0.5) * 2.0; float a = exp(-d * d * 5.0) * 0.5 + exp(-d * d * 40.0) * 0.6; float run = 0.85 + 0.15 * sin(vU.y * 0.25 - uT * 2.0); gl_FragColor = vec4(mix(uC * 0.9, mix(uC, vec3(1.0), 0.45), exp(-d * d * 60.0)), clamp(a * uK * run, 0.0, 0.95)); }' });
      const rib = new THREE.Mesh(g, m); rib.name = 'borderGlow'; rib.renderOrder = 6; rib.frustumCulled = false; model.add(rib); } } catch (err) { console.warn('border', err); }

  // ---------- the clubhouse opens: on its card the roof lifts up and back, over the far side from the lawn ----------
  const CH = INFO.clubhouse || null; let roofK = 0;
  const cBack = CH ? [-Math.sin(CH.f), -Math.cos(CH.f)] : [0, -1];
  function tickRoof(dt, sel) { if (!CH || !part.clubhouse_roof) return; const want = sel && sel.id === 'club' ? 1 : 0; roofK += (want - roofK) * Math.min(1, (want ? 1.4 : 3) * dt); const r = sm(roofK);
    const bob = !reduced && r > 0.99 ? Math.sin(clock * 1.3) * 0.08 : 0;
    part.clubhouse_roof.position.set(cBack[0] * 7 * r, 6 * Math.sin(Math.PI * 0.5 * Math.min(1, r * 1.3)) + bob, cBack[1] * 7 * r);
    part.clubhouse_roof.traverse(m => { if (m.isMesh) m.castShadow = r < 0.05; }); }

  // ---------- ducks on Muscogie Lake: a pair paddling slow loops ----------
  const PD = INFO.ponds || {}, ducks = instOf('proto_duck', 2), duckP = PD.muscogie ? [{ c: PD.muscogie, r: 7, sp: 0.07, ph: 0 }, { c: PD.muscogie, r: 7.8, sp: 0.07, ph: 0.22 }] : [];
  function tickDucks(t) { if (!ducks) return; duckP.forEach((d, i) => { const a = (reduced ? 0 : t) * d.sp + d.ph;
    ducks.set(i, d.c[0] + Math.cos(a) * d.r, d.c[1] + 0.06 + 0.02 + Math.sin(t * 1.7 + i) * 0.01, d.c[2] + Math.sin(a) * d.r * 0.7, -a + Math.PI, 1); }); ducks.done(); }

  // ---------- people walking the foot path and the lanes, following the ground; the first walks a dog ----------
  const WK = INFO.walkers || [], frames = [], STRIDE = 1.4;
  for (let k = 0; k < 8; k++) frames.push(instOf('proto_person_w' + k, Math.max(1, WK.length)));
  const standI = instOf('proto_person', Math.max(1, WK.length)), dogI = instOf('proto_dog', 1);
  const walkers = WK.map((w, i) => { const P = w.pts, cum = [0]; for (let k = 1; k < P.length; k++) cum.push(cum[k - 1] + Math.hypot(P[k][0] - P[k - 1][0], P[k][1] - P[k - 1][1]));
    return { i, P, cum, len: cum[cum.length - 1] || 1, d: (w.t0 || 0) * (cum[cum.length - 1] || 1), dir: 1, sp: w.speed || 1, wait: 0, walked: i * 0.7, f: -2, h: null, dog: !!w.dog }; });
  function tickWalk(dt) { const TS = (SC.life || {}).speed ?? 1.5;
    for (const w of walkers) { if (!reduced) { if (w.wait > 0) w.wait -= dt; else { const st = w.sp * dt * TS * 0.7; w.d += w.dir * st; w.walked += st; if (w.d > w.len) { w.d = w.len; w.dir = -1; w.wait = 4; } else if (w.d < 0) { w.d = 0; w.dir = 1; w.wait = 4; } } }
      let k = 1; while (k < w.cum.length - 1 && w.cum[k] < w.d) k++; const a = w.P[k - 1], b = w.P[k], u = cl((w.d - w.cum[k - 1]) / ((w.cum[k] - w.cum[k - 1]) || 1)), x = a[0] + (b[0] - a[0]) * u, z = a[1] + (b[1] - a[1]) * u;
      const want = Math.atan2((b[0] - a[0]) * w.dir, (b[1] - a[1]) * w.dir); w.h = w.h == null ? want : w.h + Math.atan2(Math.sin(want - w.h), Math.cos(want - w.h)) * Math.min(1, 5 * dt);
      const f = reduced || w.wait > 0 ? -1 : Math.floor((w.walked / STRIDE) * 8) % 8; if (f !== w.f) { if (w.f >= 0 && frames[w.f]) frames[w.f].hide(w.i); else if (w.f === -1 && standI) standI.hide(w.i); w.f = f; }
      const I = f >= 0 ? frames[f] : standI; if (I) I.set(w.i, x, groundY(x, z) + 0.02, z, w.h);
      if (w.dog && dogI) { const ox = x + Math.sin(w.h) * 1.3 + Math.cos(w.h) * 0.5, oz = z + Math.cos(w.h) * 1.3 - Math.sin(w.h) * 0.5; dogI.set(0, ox, groundY(ox, oz) + 0.02, oz, w.h); dogI.done(); } }
    frames.forEach(f => f && f.done()); if (standI) standI.done(); }

  // ---------- Big Cat: the angler on the bank, one model all through (Adam 14-11-2026: never swap to a second figure). 0 to 9 s fishing; 9 to 10.5
  // turns round to his chair; 10.5 to 12.5 looks at the cat asleep in it; 12.5 to 14 steps across beside his cooler; 14 to 20 fishes from there.
  // At 20 he steps back to the chair spot. The cat never wakes. Feet on the ground grid (groundY), never the export's own height. ----------
  const JK = INFO.joke || null, angI = instOf('proto_angler', 1);
  let jT = 3;
  const jw = (lx, lz) => { const c = Math.cos(JK.ry), s = Math.sin(JK.ry); return [JK.at[0] + lx * c + lz * s, JK.at[2] - lx * s + lz * c]; };
  function tickJoke(dt) { if (!JK || !angI) return; jT += reduced ? 0 : dt; const c = jT % 20, F = JK.ry;
    const turn = c < 9 ? 0 : c < 10.5 ? sm((c - 9) / 1.5) : c < 12.5 ? 1 : c < 14 ? 1 - sm((c - 12.5) / 1.5) : 0;
    const look = c > 10.5 && c < 12.5 ? Math.sin((c - 10.5) * 5) * 0.08 : 0, chairDir = Math.atan2(JK.chair[0], JK.chair[1]);
    // beside the cooler: on the water side of it, half a metre along
    const side = [JK.cooler[0] + 0.15, JK.cooler[1] + 0.75], k = c < 12.5 ? 0 : c < 14 ? sm((c - 12.5) / 1.5) : c < 19 ? 1 : 1 - sm((c - 19) / 1.0);
    const [x, z] = jw(side[0] * k, side[1] * k); angI.set(0, x, groundY(x, z) + 0.01, z, F + chairDir * turn + look); angI.done(); }

  // ---------- Sunset: hookup pedestals light site by site (a soft warm cap on each post) ----------
  const SITES = INFO.sites || [], peds = SITES.map(s => s.ped).filter(Boolean);
  const pedM = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd49a').multiplyScalar(2.6), toneMapped: false, transparent: true, depthWrite: false });
  const pedI = new THREE.InstancedMesh(new THREE.SphereGeometry(0.18, 8, 6), pedM, Math.max(1, peds.length)); pedI.frustumCulled = false; pedI.renderOrder = 6; root.add(pedI);
  const pedPtsG = new THREE.BufferGeometry(); pedPtsG.setAttribute('position', new THREE.Float32BufferAttribute(peds.flatMap(p => [p[0], p[1] + 0.1, p[2]]), 3)); pedPtsG.setAttribute('color', new THREE.BufferAttribute(new Float32Array(peds.length * 3), 3));
  const pedPts = new THREE.Points(pedPtsG, new THREE.PointsMaterial({ size: 5, sizeAttenuation: false, map: glowTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); pedPts.frustumCulled = false; pedPts.renderOrder = 7; root.add(pedPts);
  const gFrom = (INFO.grow || {}).from || [0, 0, 120], pedD = peds.map(p => Math.hypot(p[0] - gFrom[0], p[2] - gFrom[2])), m4 = new THREE.Matrix4(), col = new THREE.Color();
  const entrance = SITES.length ? [-150, 0, -40] : [0, 0, 0], pedE = peds.map(p => Math.hypot(p[0] - entrance[0], p[2] - entrance[2])), maxE = Math.max(1, ...pedE);
  peds.forEach((p, i) => { pedI.setMatrixAt(i, m4.makeTranslation(p[0], p[1] + 0.1, p[2])); pedI.setColorAt(i, col.setScalar(0)); });
  let growT = 0, wasGrow = false, growOnK = 0;
  function tickPeds() { const dk = dusk(), wave = cl((dk - 0.3) / 0.7) * 1.25, cA = pedPtsG.attributes.color.array; let any = false;
    for (let i = 0; i < peds.length; i++) { const warm = sm((wave - pedE[i] / maxE) / 0.2);
      // Room to grow: the 50 amp wave, white, from the E row outwards at 26 m/s
      const g = growOnK > 0 ? sm((growT - 0.4 - pedD[i] / 26) / 0.35) * growOnK : 0;
      const r = warm * 1.0 * (1 - g) + g, gg = warm * 0.78 * (1 - g) + g, b = warm * 0.5 * (1 - g) + g; const v = Math.max(warm, g); if (v > 0.01) any = true;
      pedI.setColorAt(i, col.setRGB(r, gg, b)); cA[i * 3] = r * 0.9; cA[i * 3 + 1] = gg * 0.9; cA[i * 3 + 2] = b * 0.9; }
    pedI.instanceColor.needsUpdate = true; pedPtsG.attributes.color.needsUpdate = true; pedI.visible = pedPts.visible = any; }

  // ---------- Sunset: the pavilion fills for the pot luck (people and dishes are in the model, shown only as the light goes) ----------
  if (part.potluck) part.potluck.visible = false;
  function tickPotluck() { if (!part.potluck) return; const k = sm((dusk() - 0.45) / 0.4); part.potluck.visible = k > 0.02; part.potluck.position.y = -0.0 - 2.5 * (1 - k); }

  // ---------- Room to grow (Adam 14-11-2026: "make each idea glow strongly and obviously"): 1) more 50 amp sites: a white column of light rises
  // from every pedestal in a wave from the E row and a white frame lights round every site; 2) the woods inside the border: a bright green fill
  // over the woods land and green columns rising through the trees. No new pads drawn. ----------
  const WD = INFO.woods || [], gp = new THREE.Group(); gp.visible = false; root.add(gp);
  const beamG = new THREE.CylinderGeometry(0.35, 0.6, 1, 8, 1, true).translate(0, 0.5, 0);
  const beamM = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffffff').multiplyScalar(2.2), toneMapped: false, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const beams = new THREE.InstancedMesh(beamG, beamM, Math.max(1, peds.length)); beams.frustumCulled = false; beams.renderOrder = 7; gp.add(beams);
  const frameM = lightM(2.4), frames2 = [], bar = new THREE.BoxGeometry(1, 0.14, 1);
  for (let k = 0; k < 4; k++) { const im = new THREE.InstancedMesh(bar, frameM, Math.max(1, SITES.length)); im.frustumCulled = false; im.renderOrder = 6; gp.add(im); frames2.push(im); }
  { const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), pv = new THREE.Vector3(), mm = new THREE.Matrix4();
    SITES.forEach((p, i) => { const Ld = p.d || 15, W = p.w || 4.2; q.setFromAxisAngle(up, p.ry || 0); const ux = new THREE.Vector3(1, 0, 0).applyQuaternion(q), uz = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
      [[ux, W / 2, 0.3, Ld], [ux, -W / 2, 0.3, Ld], [uz, Ld / 2, W, 0.3], [uz, -Ld / 2, W, 0.3]].forEach(([u, o, sx, sz], k) => { pv.set(p.at[0], p.at[1] + 0.3, p.at[2]).addScaledVector(u, o); mm.compose(pv, q, new THREE.Vector3(sx, 1, sz)); frames2[k].setMatrixAt(i, mm); }); }); }
  const siteD = SITES.map(p => Math.hypot(p.at[0] - gFrom[0], p.at[2] - gFrom[2]));
  // the woods fill: one 5 m square of light per woods point (they sit on a 5 m grid), so the area reads as one glowing patch
  const fillG = (() => { const pos = [], idx = []; WD.forEach((p, i) => { const h = 2.7, y = p[1] + 0.25; pos.push(p[0] - h, y, p[2] - h, p[0] + h, y, p[2] - h, p[0] + h, y, p[2] + h, p[0] - h, y, p[2] + h); const k = i * 4; idx.push(k, k + 2, k + 1, k, k + 3, k + 2); });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g; })();
  const fillM = new THREE.MeshBasicMaterial({ color: HERO.clone().lerp(new THREE.Color('#ffffff'), 0.15).multiplyScalar(1.6), toneMapped: false, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const fill = new THREE.Mesh(fillG, fillM); fill.renderOrder = 5; fill.frustumCulled = false; gp.add(fill);
  const colP = WD.filter((p, i) => i % 9 === 0), colM = new THREE.MeshBasicMaterial({ color: HERO.clone().lerp(new THREE.Color('#ffffff'), 0.3).multiplyScalar(2.4), toneMapped: false, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const cols = new THREE.InstancedMesh(beamG, colM, Math.max(1, colP.length)); cols.frustumCulled = false; cols.renderOrder = 7; gp.add(cols);
  const wMid = WD.length ? [WD.reduce((a, p) => a + p[0], 0) / WD.length, WD.reduce((a, p) => a + p[2], 0) / WD.length] : [0, 0], colD = colP.map(p => Math.hypot(p[0] - wMid[0], p[2] - wMid[1])), colMax = Math.max(1, ...colD);
  const tagSet = (txt) => { if (X.GROW && X.GROW.tag) X.GROW.tag.text = txt; };
  const TAG1 = (SC.life && SC.life.growTag1) || 'More 50 amp sites', TAG2 = (SC.life && SC.life.growTag2) || 'Woods inside the border';
  const gm4 = new THREE.Matrix4(), gq = new THREE.Quaternion(), gpv = new THREE.Vector3(), gsv = new THREE.Vector3(), gc = new THREE.Color();
  function tickGrow(dt, on) { if (on && !wasGrow) growT = 0; wasGrow = on; growOnK += ((on ? 1 : 0) - growOnK) * Math.min(1, 4 * dt);
    if (on) growT += reduced ? 99 : dt; const t = growT; gp.visible = growOnK > 0.01; if (!gp.visible) return;
    const pulse = reduced ? 1 : 0.85 + 0.15 * Math.sin(clock * 2.4);
    // 1) the 50 amp wave: columns rise 9 m from each pedestal, frames light white; they stay lit (a little lower) while the woods show
    peds.forEach((p, i) => { const u = sm((t - 0.4 - pedD[i] / 26) / 0.6), h = 9 * u * growOnK; gsv.set(1, Math.max(1e-3, h), 1); gm4.compose(gpv.set(p[0], p[1] - 0.6, p[2]), gq, gsv); beams.setMatrixAt(i, gm4); });
    beams.instanceMatrix.needsUpdate = true; beamM.opacity = 0.7 * growOnK * (t > 3.4 ? 0.7 : 1) * pulse;
    SITES.forEach((p, i) => { const b = sm((t - 0.4 - siteD[i] / 26) / 0.4) * growOnK; gc.setScalar(b * (t > 3.4 ? 0.6 : 1)); frames2.forEach(f => f.setColorAt(i, gc)); });
    frames2.forEach(f => { f.instanceColor.needsUpdate = true; });
    // 2) the woods: the fill comes up, then green columns rise through the trees from the middle outwards
    const wk = growOnK * sm((t - 3.4) / 0.8); fillM.opacity = 0.55 * wk * pulse;
    colP.forEach((p, i) => { const u = sm((t - 3.6 - colD[i] / colMax * 1.2) / 0.7) * growOnK, h = 16 * u; gsv.set(1.0, Math.max(1e-3, h), 1.6); gm4.compose(gpv.set(p[0], p[1] - 0.5, p[2]), gq, gsv); cols.setMatrixAt(i, gm4); });
    cols.instanceMatrix.needsUpdate = true; colM.opacity = 0.32 * wk * pulse;
    if (on) tagSet(t < 3.4 ? TAG1 : TAG2); }

  // ---------- card effects ----------
  // wrpads: a thin frame of light round each site of the chosen rows, lit one after another along the rows; no number anywhere
  FX.wrpads = (c) => { const g = new THREE.Group(), rows = c.rows || null, L = SITES.filter(s => !rows || rows.includes(s.row)), n = Math.max(1, L.length), m = lightM(c.k ?? 2.2, { vertexColors: false }), sides = [];
    const bar = new THREE.BoxGeometry(1, 0.12, 1); for (let s = 0; s < 4; s++) { const im = new THREE.InstancedMesh(bar, m, n); im.frustumCulled = false; im.renderOrder = 5; for (let i = 0; i < n; i++) im.setColorAt(i, new THREE.Color(0, 0, 0)); g.add(im); sides.push(im); }
    const pv = new THREE.Vector3(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), cc = new THREE.Color(), mm = new THREE.Matrix4(), gap = c.gap ?? Math.min(0.09, 3.2 / n);
    L.forEach((p, i) => { const Ld = p.d || 15, W = p.w || 4.2; q.setFromAxisAngle(up, p.ry || 0);
      const ux = new THREE.Vector3(1, 0, 0).applyQuaternion(q), uz = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
      [[ux, W / 2, 0.22, Ld], [ux, -W / 2, 0.22, Ld], [uz, Ld / 2, W, 0.22], [uz, -Ld / 2, W, 0.22]].forEach(([u, o, sx, sz], s) => { pv.set(p.at[0], p.at[1] + 0.28, p.at[2]).addScaledVector(u, o); mm.compose(pv, q, new THREE.Vector3(sx, 1, sz)); sides[s].setMatrixAt(i, mm); }); });
    return { obj: g, mat: m, tick: (t, k) => { L.forEach((p, i) => { const a = 0.3 + i * gap, b = flash(t, a, 0.25, 1.6) * 0.9 + (t > a ? 0.35 : 0); cc.setScalar(b * k); sides.forEach(s => s.setColorAt(i, cc)); });
      sides.forEach(s => { s.instanceColor.needsUpdate = true; }); } }; };

  // ---------- every frame ----------
  function tick(dt, state = {}) { base.tick(dt, state); clock += dt;
    tickRoof(dt, state.sel); tickDucks(clock); tickWalk(dt); tickJoke(dt); tickGrow(dt, !!state.growOn); tickPeds(); tickPotluck();
    ribU.uT.value = clock; ribU.uK.value = 1.0 + 0.6 * dusk(); }
  window.__wild = { part, root, FX, joke: (c) => { jT = c; }, look: (v) => X.goView(v, 0.01),
    screen: (p) => { const q = model.localToWorld(new THREE.Vector3(...p)).project(camera), r = X.renderer.domElement.getBoundingClientRect(); return [r.left + (q.x + 1) / 2 * r.width, r.top + (1 - q.y) / 2 * r.height]; } };
  return { fx: FX, tick, dusk: base.dusk };
}
