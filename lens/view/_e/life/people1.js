// The library person in the life layer (11-11-2026): one proper person from Model Kit/Library, with a real walk.
// The model carries hidden pieces inside the plinth: proto_person (standing), proto_person_sit, proto_person_w0..w7 (the 8 steps of the walk).
// model_info.json "people": { walkers: [{ pts, speed, side, shirt, t0, y, dog }], still: [{ at, y, ry, shirt }], sit: [{ at, y, ry, shirt }] }.
// A walker's step is chosen by the distance walked, so feet do not slide; at each end of the path they stop, stand, turn and walk back.
// Any listing's life file uses it:   const PEOPLE = initPeople(X, root);   then PEOPLE.tick(dt, clock) each frame.
// Listings built before the library have no "people" block and no proto_person_w0, so this does nothing for them.
export function initPeople(X, root) {
  const { THREE, part, INFO, SC, NV } = X, P = INFO.people;
  if (!P || !part.proto_person_w0 || !part.proto_person) return { tick() {}, n: 0 };
  const reduced = !!NV.reduced, TS = (SC.life || {}).speed ?? 1.5, LAND = INFO.land ?? 0.6, PY = (INFO.protoAt || [0, -8, 0])[1], STRIDE = 1.4;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  function inst(name, n, tint) {
    const p = part[name]; if (!p || !n) return null; const meshes = []; p.traverse(o => { if (o.isMesh) meshes.push(o); });
    const ims = meshes.map(o => { o.updateMatrix(); const g = o.geometry.clone(); g.applyMatrix4(o.matrix); g.translate(0, -PY, 0);
      const im = new THREE.InstancedMesh(g, o.material, n); im.castShadow = true; im.frustumCulled = false; im.userData.tint = o.material.name === tint;
      if (im.userData.tint) for (let i = 0; i < n; i++) im.setColorAt(i, new THREE.Color(1, 1, 1)); root.add(im); return im; });
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0), pv = new THREE.Vector3(), sv = new THREE.Vector3();
    const I = { set(i, x, y, z, ry = 0, s = 1) { q.setFromAxisAngle(Y, ry); m4.compose(pv.set(x, y, z), q, sv.setScalar(Math.max(s, 1e-4))); for (const im of ims) im.setMatrixAt(i, m4); },
      hide(i) { I.set(i, 0, PY, 0, 0, 1e-4); }, color(i, c) { const col = new THREE.Color(c); for (const im of ims) if (im.userData.tint) im.setColorAt(i, col); },
      done() { for (const im of ims) { im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; } } };
    for (let i = 0; i < n; i++) I.hide(i); I.done(); return I;
  }
  function path(pts) { const Q = pts.map(p => ({ x: p[0], z: p[1] })), cum = [0]; for (let i = 1; i < Q.length; i++) cum.push(cum[i - 1] + Math.hypot(Q[i].x - Q[i - 1].x, Q[i].z - Q[i - 1].z));
    const len = cum[cum.length - 1] || 1;
    return { len, at(d, o) { d = clamp(d, 0, len); let i = 1; while (i < cum.length - 1 && cum[i] < d) i++; const a = Q[i - 1], b = Q[i], t = clamp((d - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1));
      o.x = a.x + (b.x - a.x) * t; o.z = a.z + (b.z - a.z) * t; const l = Math.hypot(b.x - a.x, b.z - a.z) || 1; o.dx = (b.x - a.x) / l; o.dz = (b.z - a.z) / l; return o; } }; }
  const angTo = (a, b, k) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return a + d * k; };
  const W = (P.walkers || []).filter(w => w.pts && w.pts.length > 1), ST = P.still || [], SI = P.sit || [];
  const frames = []; for (let k = 0; k < 8; k++) frames.push(inst('proto_person_w' + k, W.length, 'shirt'));
  const stand = inst('proto_person', W.length + ST.length, 'shirt'), sit = inst('proto_person_sit', SI.length, 'shirt'), dogs = inst('proto_dog', W.filter(w => w.dog).length);
  let di = 0;
  const walkers = W.map((w, i) => { const p = path(w.pts); frames.forEach(f => f && f.color(i, w.shirt || '#ffffff')); stand.color(i, w.shirt || '#ffffff');
    return { i, p, d: (w.t0 || 0) * p.len, dir: 1, sp: w.speed || 1.2, side: w.side || 0, y: w.y ?? LAND, h: null, wait: 0, f: -1, dog: w.dog && dogs ? di++ : -1, walked: Math.random() * 3 }; });
  ST.forEach((s, j) => stand.color(W.length + j, s.shirt || '#ffffff')); SI.forEach((s, j) => sit && sit.color(j, s.shirt || '#ffffff'));
  if (sit) { SI.forEach((s, j) => sit.set(j, s.at[0], s.y, s.at[1], s.ry || 0)); sit.done(); }
  const o = {};
  function tick(dt, t) {
    for (const w of walkers) {
      if (!reduced) { if (w.wait > 0) w.wait -= dt; else { const step = w.sp * dt * TS; w.d += w.dir * step; w.walked += step;
        if (w.d > w.p.len) { w.d = w.p.len; w.dir = -1; w.wait = 2.5; } else if (w.d < 0) { w.d = 0; w.dir = 1; w.wait = 2.5; } } }
      w.p.at(w.d, o); const dx = o.dx * w.dir, dz = o.dz * w.dir, x = o.x - dz * w.side, z = o.z + dx * w.side, want = Math.atan2(dx, dz);
      w.h = w.h == null || reduced ? want : angTo(w.h, want, Math.min(1, 5 * dt));
      const standing = reduced || w.wait > 0, f = standing ? -1 : Math.floor((w.walked / STRIDE) * 8) % 8;
      if (f !== w.f) { if (w.f >= 0) frames[w.f].hide(w.i); else stand.hide(w.i); w.f = f; }
      (f >= 0 ? frames[f] : stand).set(w.i, x, w.y, z, w.h);
      if (w.dog >= 0) { const bx = x - dx * 2.0 - dz * 0.8, bz = z - dz * 2.0 + dx * 0.8; dogs.set(w.dog, bx, w.y + (standing ? 0 : Math.abs(Math.sin(t * 11)) * 0.06), bz, w.h); }
    }
    // people standing about turn a little now and then, the way people do
    ST.forEach((s, j) => stand.set(W.length + j, s.at[0], s.y, s.at[1], (s.ry || 0) + (reduced || s.fixed ? 0 : Math.sin(t * 0.4 + j * 2) * 0.35)));
    frames.forEach(f => f && f.done()); stand.done(); if (dogs) dogs.done();
  }
  tick(0, 0);
  return { tick, n: W.length + ST.length + SI.length };
}
