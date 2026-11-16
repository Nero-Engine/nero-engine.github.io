// Good Times Ranch life layer (gtr1, 16-11-2026). The Wagon Box pattern (life1 underneath: Sunset switch, moving water, the backdrop,
// tap a thing to open its card; the border ribbon; ground grain) with this place's own pieces:
// - the gimmick, the same as the film: the ranch dog afloat on a paddleboard, drifting slowly round the middle of the pond with a faint wake
//   (V2, 16-11-2026). No card, no tour stop and no camera move point at it.
// - at Sunset the windows of both homes warm, a lamp glows under every oak and pergola and along the drive
// - a few people of light walking the compound, following the ground
// - Room to grow (the film's idea exactly): an RV on every one of the 15 hookups, then longhorns in a pasture, GROW UP OUT OF THE GROUND
//   (Adam 16-11-2026: they never fly in), each on a pool of white light.
// It moves in the web viewer only. The AR file stays a still model.
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
  const root = new THREE.Group(); root.name = 'gtr_life'; model.add(root);
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


  // ---------- the gimmick: the dog on the paddleboard, bobbing on the pond ----------
  // V2 (Adam, 16-11-2026: the board flew through the grass "like a spaceship" and the dog could not be found): the part's geometry sits in the
  // model frame, so turning the part turned it round the MODEL's centre. Now it turns round its own spot and drifts slowly round the pond's
  // middle (always on the water), with a faint wake behind it, so the eye finds it without anything pointing at it.
  const JB = (INFO.joke && INFO.joke.board) || null, board = part.joke_dog || null, b0 = board ? board.position.clone() : null;
  const PC = INFO.pond || null, BR = JB && PC ? Math.min(9, Math.hypot(JB[0] - PC[0], JB[2] - PC[2])) : 0, PH0 = JB && PC ? Math.atan2(JB[2] - PC[2], JB[0] - PC[0]) : 0;
  const wake = JB ? [0, 1, 2, 3, 4].map(() => sprite('#ffffff', 1.6, 0)) : [];
  const at = (t) => { const f = PH0 + t * 0.07; return [PC[0] + Math.cos(f) * BR, PC[2] + Math.sin(f) * BR, f]; };
  function tickBoard(t) { if (!board || !JB || !PC) return; const tt = reduced ? 0 : t, [qx, qz, f] = at(tt), th = -(f - PH0);
    const c = Math.cos(th), s_ = Math.sin(th), px = JB[0], pz = JB[2];
    board.rotation.set(0, th, 0); board.position.set(qx - (px * c + pz * s_), b0.y + (reduced ? 0 : Math.sin(t * 1.4) * 0.05), qz - (-px * s_ + pz * c));
    wake.forEach((w, k) => { const [wx, wz] = at(tt - 0.9 * (k + 1)); w.position.set(wx, JB[1] + 0.02, wz); w.material.opacity = reduced ? 0 : 0.28 * (1 - k / 5); w.scale.setScalar(1.2 + 0.5 * k); }); }

  // ---------- Sunset: windows warm, lamps under the oaks and pergolas and along the drive ----------
  const winM = MATS.filter(m => /window|pane|glass_lit|win/i.test(m.name || '') && m.emissive);
  const win0 = winM.map(m => m.emissiveIntensity), warm = new THREE.Color('#ffb870');
  const LM = INFO.lamps || [], lamps = LM.map((p, i) => { const s = sprite('#ffc888', 7 + (i % 3)); s.position.set(p[0], p[1], p[2]); return s; });
  function tickLights(t) { const k = sm((dusk() - 0.3) / 0.3);
    winM.forEach((m, i) => { m.emissive.copy(warm); m.emissiveIntensity = win0[i] + 1.6 * k; });
    lamps.forEach((s, i) => { s.visible = k > 0.01; s.material.opacity = 0.55 * k * (reduced ? 1 : 0.92 + 0.08 * Math.sin(t * 2.3 + i)); }); }

  // ---------- people walking the compound, following the ground (library person, eight steps of the walk) ----------
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
      const I = f >= 0 ? frames[f] : standI; if (I) I.set(w.i, x, groundY(x, z) + 0.02, z, w.h); }
    frames.forEach(f => f && f.done()); if (standI) standI.done(); }
  if (!walkers.length) frames.forEach(f => { if (f) { f.hide(0); f.done(); } });

  // ---------- Room to grow: RVs on the hookups, then longhorns in the pasture, grow up out of the ground ----------
  const GR = INFO.grow || {}, GU = GR.units || [];
  const names = Object.keys(part).filter(n => n.startsWith('grow_')); names.forEach(n => { part[n].visible = false; });
  const pools = GU.map(u => { const s = sprite('#ffffff', u.kind === 'cow' ? 8 : 14); s.position.set(u.at[0], u.at[1] + 1.0, u.at[2]); s.visible = false; return s; });
  const tagSet = (txt) => { if (X.GROW && X.GROW.tag) X.GROW.tag.text = txt; };
  const TAG1 = (SC.life && SC.life.growTag1) || 'Idea: RVs on the empty hookups', TAG2 = (SC.life && SC.life.growTag2) || 'Idea: cattle and horses on the land';
  let growT = 0, wasGrow = false;
  function tickGrow(dt, on) { if (on && !wasGrow) growT = 0; wasGrow = on;
    if (!on) { names.forEach(n => { part[n].visible = false; }); pools.forEach(p => { p.visible = false; }); return; }
    growT += reduced ? 99 : dt; const t = growT;
    GU.forEach((u, i) => { const pt = part[u.part]; if (!pt) return; const a = t - 0.3 - u.t, k = cl(a / 1.6); pt.visible = k > 0; pt.position.y = -(u.h + 0.3) * (1 - back(k));
      const p = pools[i]; p.visible = a > -0.4 && a < 4; p.material.opacity = 0.5 * sm((a + 0.4) / 0.4) * (1 - sm((a - 1.6) / 2.2)); });
    tagSet(t < 4.6 ? TAG1 : TAG2); }

  // ---------- V3 (Adam, 16-11-2026): water and power run to the buildings as flowing light (the Cabin Creek hookup lines, reused) ----------
  // Water card: blue light flows from both wells to the pump house, on to the tank, then to the homes, the garage and the RV hookups; amber power
  // runs from the service point to the homes, garage, range, pump house and hookups, a beat later. Routes are illustrative, like the film's.
  const tube = (P, r, m) => { const pts = P.map(p => new THREE.Vector3(p[0], p[1], p[2])); if (pts.length < 2) return null;
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.05), Math.max(8, pts.length * 4), r, 6, false), m); mesh.renderOrder = 7; return mesh; };
  const flowM = (hex, k) => new THREE.ShaderMaterial({ uniforms: { uC: { value: new THREE.Color(hex).multiplyScalar(k) }, uK: { value: 0 }, uT: { value: 0 }, uR: { value: 12 } }, transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform vec3 uC; uniform float uT, uK, uR; varying vec2 vU; void main(){ float d = 0.45 + 0.55 * smoothstep(0.32, 0.0, abs(fract(vU.x * uR - uT * 1.2) - 0.5)); float reveal = step(vU.x, uK); gl_FragColor = vec4(uC * d, reveal * d); }' });
  FX.gtrutil = (c) => { const g = new THREE.Group(), U = INFO.util || {}, K = c.k ?? 2.4, wm = [], pm = [];
    (U.water || []).forEach((P, i) => { const m = flowM('#5fc8ff', K); m.uniforms.uR.value = Math.max(3, P.length / 3); const t = tube(P, 0.55, m); if (t) { g.add(t); wm.push([m, i < 2 ? 0 : i < 3 ? 0.9 : 1.7]); } });
    (U.power || []).forEach((P, i) => { const m = flowM('#ffc04a', K); m.uniforms.uR.value = Math.max(3, P.length / 3); const t = tube(P, 0.4, m); if (t) { g.add(t); pm.push([m, 2.4]); } });
    const all = wm.concat(pm), lit = all.length ? all[0][0] : flowM('#5fc8ff', K);
    return { obj: g, mat: lit, tick: (t, k) => { all.forEach(([m, d], j) => { m.uniforms.uT.value = t; m.uniforms.uK.value = reduced ? 1 : cl((t - d) / 1.4) * (k > 0.02 ? 1 : 0);
      m.uniforms.uC.value.set(j < wm.length ? '#5fc8ff' : '#ffc04a').multiplyScalar(K * k); }); } }; };

  // ---------- every frame ----------
  function tick(dt, state = {}) { base.tick(dt, state); clock += dt;
    tickBoard(clock); tickLights(clock); tickWalk(dt); tickGrow(dt, !!state.growOn);
    ribU.uT.value = clock; ribU.uK.value = 1.0 + 0.6 * dusk(); }
  window.__gtr = { part, root, FX, look: (v) => X.goView(v, 0.01) };
  return { fx: FX, tick, dusk: base.dusk };
}
