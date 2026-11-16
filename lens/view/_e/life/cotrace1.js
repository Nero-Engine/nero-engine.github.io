// Cabins Off The Trace life layer (cotrace1, 16-11-2026). The Wagon Box pattern (life1 underneath: Sunset switch, the backdrop, tap a thing to
// open its card; the border ribbon in the broker's gold; ground grain) with this place's own pieces:
// - one cabin opens: on the "inside" card its roof lifts away to show the room from the broker photos (kitchenette, king bed, desk, TV, barn door)
// - BLUE HOUR at Sunset (the owners' own photos 0 to 18): the low path lights along the gravel come on in a wave round the loop, then the two
//   soffit downlights on every porch, the small blue keyless light by every door, the lamps inside the open cabin; the fire pit flickers
// - guests strolling the gravel loop and walking up the drive
// - the gimmick (the same as the film): now and then a black bear ambles along the outside of the gravel loop, past two porches, and back into
//   the trees. No card, no tour stop and no camera move point at it.
// - Room to grow (the film's idea): the 24 x 30 ft building GROWS UP OUT OF THE GROUND on its prepared site in the middle of the loop (Adam
//   16-11-2026: never flies in), on a pool of white light that warms.
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
  const root = new THREE.Group(); root.name = 'cotrace_life'; model.add(root);
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

  // ---------- the land for sale: a ribbon of the broker's gold round the county parcel, always on, stronger at sunset ----------
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

  // ---------- a fine leaf litter grain on the ground ----------
  try { if (part.ground) { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), id = x.createImageData(256, 256);
      const H = new Float32Array(256 * 256); let s = 7; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
      for (let o = 0; o < 6; o++) { const f = 2 ** (o + 2), amp = 1 / (o + 1.2), G = []; for (let i = 0; i < f * f; i++) G.push(r());
        for (let j = 0; j < 256; j++) for (let i = 0; i < 256; i++) { const u = i / 256 * f, w = j / 256 * f, i0 = Math.floor(u), j0 = Math.floor(w), a = u - i0, b = w - j0, Pq = (p, q) => G[(q % f) * f + (p % f)];
          const aa = a * a * (3 - 2 * a), bb = b * b * (3 - 2 * b); H[j * 256 + i] += amp * ((Pq(i0, j0) * (1 - aa) + Pq(i0 + 1, j0) * aa) * (1 - bb) + (Pq(i0, j0 + 1) * (1 - aa) + Pq(i0 + 1, j0 + 1) * aa) * bb); } }
      for (let j = 0; j < 256; j++) for (let i = 0; i < 256; i++) { const k = (j * 256 + i) * 4, dx = H[j * 256 + (i + 1) % 256] - H[j * 256 + (i + 255) % 256], dz = H[((j + 1) % 256) * 256 + i] - H[((j + 255) % 256) * 256 + i];
        const nn = new THREE.Vector3(-dx * 3, -dz * 3, 1).normalize(); id.data[k] = (nn.x * 0.5 + 0.5) * 255; id.data[k + 1] = (nn.y * 0.5 + 0.5) * 255; id.data[k + 2] = (nn.z * 0.5 + 0.5) * 255; id.data[k + 3] = 255; }
      x.putImageData(id, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(80, 80); t.anisotropy = 4;
      part.ground.traverse(o => { if (o.isMesh && o.material && o.material.map) { o.material.normalMap = t; o.material.normalScale = new THREE.Vector2(0.3, 0.3); o.material.roughness = 1; o.material.metalness = 0; o.material.envMapIntensity = Math.min(o.material.envMapIntensity ?? 1, 0.35); o.material.needsUpdate = true; } }); } } catch (err) { console.warn('grain', err); }

  // ---------- the cabin opens: its roof lifts and slides back on the inside card ----------
  const CA = INFO.cabin || null; let rO = 0;
  const behind = CA ? [-CA.front[0], -CA.front[1]] : [0, -1];
  function tickCabin(dt, sel) { if (!CA || !part.cabin_roof) return; const w = sel && sel.id === 'inside' ? 1 : 0;
    rO += (w - rO) * Math.min(1, (w ? 1.5 : 3) * dt); const g = sm(rO), bob = !reduced && g > 0.99 ? Math.sin(clock * 1.3) * 0.08 : 0;
    part.cabin_roof.position.set(behind[0] * 6.5 * g, 6 * Math.sin(Math.PI * 0.5 * Math.min(1, g * 1.3)) + bob, behind[1] * 6.5 * g);
    part.cabin_roof.traverse(m => { if (m.isMesh) m.castShadow = g < 0.05; }); }

  // ---------- the fire flickers; the lamps inside warm at dusk ----------
  const fireM = MATS.filter(m => m.name === 'fire'), fire0 = fireM.map(m => m.emissiveIntensity);
  const lantM = MATS.filter(m => m.name === 'lantern'), lant0 = lantM.map(m => m.emissiveIntensity);
  function tickFire(t) { const dk = dusk(), f = reduced ? 1 : 1 + 0.25 * Math.sin(t * 9.1) + 0.15 * Math.sin(t * 15.7 + 1.3); fireM.forEach((m, i) => { m.emissiveIntensity = fire0[i] * f * (1 + dk * 0.8); });
    const k = sm((dk - 0.3) / 0.25); lantM.forEach((m, i) => { m.emissiveIntensity = lant0[i] + 2.5 * k; }); }

  // ---------- guests walking, following the ground (library person, eight steps of the walk) ----------
  const WK = (INFO.people && INFO.people.walkers) || [], frames = [], STRIDE = 1.4;
  for (let k = 0; k < 8; k++) frames.push(instOf('proto_person_w' + k, Math.max(1, WK.length)));
  const standI = instOf('proto_person', Math.max(1, WK.length));
  const walkers = WK.map((w, i) => { const P = w.pts, cum = [0]; for (let k = 1; k < P.length; k++) cum.push(cum[k - 1] + Math.hypot(P[k][0] - P[k - 1][0], P[k][1] - P[k - 1][1]));
    return { i, P, cum, len: cum[cum.length - 1] || 1, d: (w.t0 || 0) * (cum[cum.length - 1] || 1), dir: 1, sp: w.speed || 1, wait: 0, walked: Math.random() * 3, f: -2, h: null }; });
  function tickWalk(dt) { const TS = (SC.life || {}).speed ?? 1.5;
    for (const w of walkers) {
      if (!reduced) { if (w.wait > 0) w.wait -= dt; else { const st = w.sp * dt * TS * 0.7; w.d += w.dir * st; w.walked += st; if (w.d > w.len) { w.d = w.len; w.dir = -1; w.wait = 3; } else if (w.d < 0) { w.d = 0; w.dir = 1; w.wait = 3; } } }
      let k = 1; while (k < w.cum.length - 1 && w.cum[k] < w.d) k++; const a = w.P[k - 1], b = w.P[k], u = cl((w.d - w.cum[k - 1]) / ((w.cum[k] - w.cum[k - 1]) || 1)), x = a[0] + (b[0] - a[0]) * u, z = a[1] + (b[1] - a[1]) * u;
      const want = Math.atan2((b[0] - a[0]) * w.dir, (b[1] - a[1]) * w.dir);
      w.h = w.h == null || reduced ? want : w.h + Math.atan2(Math.sin(want - w.h), Math.cos(want - w.h)) * Math.min(1, 4 * dt);
      const f = reduced || w.wait > 0 ? -1 : Math.floor((w.walked / STRIDE) * 8) % 8; if (f !== w.f) { if (w.f >= 0 && frames[w.f]) frames[w.f].hide(w.i); else if (w.f === -1 && standI) standI.hide(w.i); w.f = f; }
      const y = groundY(x, z) + 0.02, I = f >= 0 ? frames[f] : standI; if (I) I.set(w.i, x, y, z, w.h); }
    frames.forEach(f => f && f.done()); if (standI) standI.done(); }
  if (!walkers.length) frames.forEach(f => { if (f) { f.hide(0); f.done(); } });

  // ---------- the bear (the film's gimmick): a 90 s loop. 0 to about 40 s it ambles along the outside of the loop from the east woods past two
  // porches into the trees at 0.9 m/s; it stays out of sight; then it comes back the other way. Life size, a slow rolling walk. ----------
  const BR = INFO.bear || [], bearI = instOf('proto_bear', 1);
  const bc = [0]; for (let k = 1; k < BR.length; k++) bc.push(bc[k - 1] + Math.hypot(BR[k][0] - BR[k - 1][0], BR[k][2] - BR[k - 1][2])); const bLen = bc[bc.length - 1] || 1;
  let bearT = 6, bH = null;
  const bearAt = (d) => { let k = 1; while (k < bc.length - 1 && bc[k] < d) k++; const a = BR[k - 1], b = BR[k], u = cl((d - bc[k - 1]) / ((bc[k] - bc[k - 1]) || 1)); return [a[0] + (b[0] - a[0]) * u, a[2] + (b[2] - a[2]) * u, Math.atan2(b[0] - a[0], b[2] - a[2])]; };
  function tickBear(dt) { if (!bearI || BR.length < 2) return; const walkT = bLen / 0.9, T = 2 * walkT + 30; bearT = reduced ? walkT * 0.45 : (bearT + dt) % T; const t = bearT;
    let d, rev = false; if (t < walkT) d = t * 0.9; else if (t < walkT + 15) { bearI.hide(0); bearI.done(); return; } else if (t < 2 * walkT + 15) { d = bLen - (t - walkT - 15) * 0.9; rev = true; } else { bearI.hide(0); bearI.done(); return; }
    const [x, z, h0] = bearAt(d), want = rev ? h0 + Math.PI : h0; bH = bH == null ? want : bH + Math.atan2(Math.sin(want - bH), Math.cos(want - bH)) * Math.min(1, 3 * dt);
    const edge = sm(Math.min(d, bLen - d) / 4), bob = reduced ? 0 : Math.abs(Math.sin(t * 3.6)) * 0.04;
    bearI.set(0, x, groundY(x, z) + bob, z, bH + (reduced ? 0 : Math.sin(t * 1.8) * 0.05), Math.max(1e-4, edge)); bearI.done(); }

  // ---------- blue hour: path lights in a wave round the loop, then the porches, the keyless lights, the lamps inside, the fire ----------
  const BL = INFO.bulbs || {}, ALL = [], LC = (INFO.loop && INFO.loop.c) || [0, 0, 0];
  const order = { path: 0, porches: 0.25, keyless: 0.4, inside: 0.3, fire: 0.05 };
  for (const [k, L] of Object.entries(BL)) (L || []).forEach((p) => { const ang = (Math.atan2(p[2] - LC[2], p[0] - LC[0]) / (Math.PI * 2) + 1) % 1, far = Math.hypot(p[0] - LC[0], p[2] - LC[2]);
    ALL.push({ p, k, d: (order[k] ?? 0.3) + (k === 'path' ? (far > 60 ? 0.15 + 0.2 * Math.min(1, (far - 60) / 120) : 0.25 * ang) : k === 'porches' || k === 'keyless' ? 0.25 * ang : 0) }); });
  const col = { path: [1.0, 0.82, 0.55], porches: [1.0, 0.9, 0.7], keyless: [0.25, 0.55, 1.0], inside: [1.0, 0.7, 0.4], fire: [1.0, 0.5, 0.18] };
  const ptsG = new THREE.BufferGeometry(); { const a = []; ALL.forEach(b => a.push(b.p[0], b.p[1], b.p[2])); ptsG.setAttribute('position', new THREE.Float32BufferAttribute(a, 3)); ptsG.setAttribute('color', new THREE.BufferAttribute(new Float32Array(a.length), 3)); }
  const ptsM = new THREE.PointsMaterial({ size: 5, sizeAttenuation: false, opacity: 0.6, map: glowTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const bulbPts = new THREE.Points(ptsG, ptsM); bulbPts.frustumCulled = false; bulbPts.renderOrder = 7; root.add(bulbPts);
  let lastLit = -1;
  function tickBulbs(t) { const dk = dusk(), wave = cl((dk - 0.3) / 0.6) * 1.25, key = Math.round(wave * 80) + Math.round(t * 4) * 1e4; if (key === lastLit) return; lastLit = key;
    const cA = ptsG.attributes.color.array; ALL.forEach((b, i) => { const v = sm((wave - b.d) / 0.2), tw = reduced || b.k !== 'fire' ? 1 : 0.8 + 0.2 * Math.sin(t * 9 + i), c = col[b.k] || col.path; cA[i * 3] = v * tw * c[0]; cA[i * 3 + 1] = v * tw * c[1]; cA[i * 3 + 2] = v * tw * c[2]; });
    ptsG.attributes.color.needsUpdate = true; bulbPts.visible = dk > 0.02; }

  // ---------- Room to grow: the 24 x 30 ft building grows up out of the ground on its prepared site ----------
  const GR = INFO.grow || {}, GU = GR.units || [];
  const names = Object.keys(part).filter(n => n.startsWith('grow_')); names.forEach(n => { part[n].visible = false; });
  const pools = GU.map(u => { const s = sprite('#ffffff', 22); s.position.set(u.at[0], u.at[1] + 1.2, u.at[2]); s.visible = false; return s; });
  const warmG = GU.length ? sprite('#ffc890', 26) : null; if (warmG) warmG.position.set(GU[0].at[0], GU[0].at[1] + 3, GU[0].at[2]);
  const tagSet = (txt) => { if (X.GROW && X.GROW.tag) X.GROW.tag.text = txt; };
  const TAG1 = (SC.life && SC.life.growTag1) || 'Idea: a 24 × 30 ft building', TAG2 = (SC.life && SC.life.growTag2) || 'Yoga studio, meeting room, retreats';
  let growT = 0, wasGrow = false;
  function tickGrow(dt, on) { if (on && !wasGrow) growT = 0; wasGrow = on;
    if (!on) { names.forEach(n => { part[n].visible = false; }); pools.forEach(p => { p.visible = false; }); if (warmG) warmG.material.opacity = 0; return; }
    growT += reduced ? 99 : dt; const t = growT;
    GU.forEach((u, i) => { const pt = part[u.part]; if (!pt) return; const a = t - 0.3 - u.t, k = cl(a / 2.2); pt.visible = k > 0; pt.position.y = -(u.h + 0.3) * (1 - back(k));
      const p = pools[i]; p.visible = a > -0.4 && a < 4.5; p.material.opacity = 0.55 * sm((a + 0.4) / 0.4) * (1 - sm((a - 2.2) / 2.2)); });
    if (warmG) warmG.material.opacity = 0.3 * sm((t - 3.5) / 1.5);
    tagSet(t < 4.5 ? TAG1 : TAG2); }

  // ---------- every frame ----------
  function tick(dt, state = {}) { base.tick(dt, state); clock += dt;
    tickCabin(dt, state.sel); tickFire(clock); tickWalk(dt); tickBear(dt); tickBulbs(clock); tickGrow(dt, !!state.growOn);
    ribU.uT.value = clock; ribU.uK.value = 1.0 + 0.6 * dusk(); }
  window.__cot = { part, root, FX, bear: (c) => { bearT = c; }, look: (v) => X.goView(v, 0.01) };
  return { fx: FX, tick, dusk: base.dusk };
}
