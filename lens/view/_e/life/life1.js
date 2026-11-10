// Life layer for the desk viewer (10-11-2026, first used on Stella Mare RV Resort).
// Small moving pieces (carts, a mower with a pelican waddling behind, a few people, pelicans, highway cars), swaying palms,
// moving water, surf on the beach, a Sunset switch and the Room to grow build animation.
// Loaded only when listing.json has scene.life. It moves in the web viewer only: the AR file stays a still model.
// The model carries the pieces as hidden "proto_*" parts inside the plinth; paths and places come from model_info.json "life".
let THREE;   // handed in by the engine, so there is only one copy of three.js on the page

export async function init(X) {
  THREE = X.THREE;
  const { model, part, MATS, INFO, SC, D, GROW, scene, sun, renderer, NV, glowM } = X; const GM = X.GLOWMATS || [];   // GM: glow materials the engine dims by day (scene.dayGlow)
  const L = INFO.life || {}, CFG = SC.life || {}, reduced = !!NV.reduced, TS = CFG.speed ?? 1.5, LAND = INFO.land ?? 0.5;
  const PY = (INFO.protoAt || [0, -8, 0])[1];
  const root = new THREE.Group(); root.name = 'life'; model.add(root);
  const ease = (k) => k < 0 ? 0 : k > 1 ? 1 : k * k * (3 - 2 * k);
  const back = (k) => { if (k <= 0) return 0; if (k >= 1) return 1; const c = 1.9, x = k - 1; return 1 + (c + 1) * x * x * x + c * x * x; };
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

  // ---------- instanced copies of a hidden piece ----------
  function inst(name, n, opt = {}) {
    const p = part[name]; if (!p || !n) return null; const meshes = []; p.traverse(o => { if (o.isMesh) meshes.push(o); });
    const ims = meshes.map(o => { o.updateMatrix(); const g = o.geometry.clone(); g.applyMatrix4(o.matrix); g.translate(0, -PY, 0);
      const im = new THREE.InstancedMesh(g, o.material, n); im.castShadow = true; im.frustumCulled = false; im.userData.tint = !!opt.tint && o.material.name === opt.tint;
      if (im.userData.tint) for (let i = 0; i < n; i++) im.setColorAt(i, new THREE.Color(1, 1, 1));
      (opt.parent || root).add(im); return im; });
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(0, 0, 0, 'YXZ'), pv = new THREE.Vector3(), sv = new THREE.Vector3();
    const box = new THREE.Box3(); ims.forEach(im => { im.geometry.computeBoundingBox(); box.union(im.geometry.boundingBox); });
    const I = { n, box, ims,
      set(i, x, y, z, ry = 0, s = 1, rz = 0, rx = 0) { e.set(rx, ry, rz); q.setFromEuler(e); m4.compose(pv.set(x, y, z), q, sv.setScalar(Math.max(s, 1e-4))); for (const im of ims) im.setMatrixAt(i, m4); },
      color(i, c) { const col = new THREE.Color(c); for (const im of ims) if (im.userData.tint) im.setColorAt(i, col); },
      done() { for (const im of ims) { im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; } },
      show(v) { for (const im of ims) im.visible = v; } };
    for (let i = 0; i < n; i++) I.set(i, 0, PY, 0, 0, 0.0001); I.done(); return I;
  }

  // ---------- ground height under a point (once, at start) ----------
  const ray = new THREE.Raycaster(), groundM = []; (part.ground || model).traverse(o => { if (o.isMesh) groundM.push(o); });
  model.updateMatrixWorld(true);
  const groundY = (x, z, fall = LAND) => { const o = model.localToWorld(new THREE.Vector3(x, 60, z)); ray.set(o, new THREE.Vector3(0, -1, 0)); const h = ray.intersectObjects(groundM, false)[0];
    return h ? model.worldToLocal(h.point.clone()).y : fall; };

  // ---------- paths ----------
  function path(pts, closed, withY) {
    const P = pts.map(p => ({ x: p[0], z: p[1], y: withY ? groundY(p[0], p[1]) : null })); if (closed) P.push({ ...P[0] });
    const cum = [0]; for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i].x - P[i - 1].x, P[i].z - P[i - 1].z));
    const len = cum[cum.length - 1] || 1;
    return { len, P, at(d, o) { let i = 1; while (i < cum.length - 1 && cum[i] < d) i++; const a = P[i - 1], b = P[i], t = clamp((d - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1));
      o.x = a.x + (b.x - a.x) * t; o.z = a.z + (b.z - a.z) * t; o.y = a.y == null ? null : a.y + (b.y - a.y) * t; const dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1; o.dx = dx / l; o.dz = dz / l; return o; } };
  }
  const angTo = (a, b, k) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return a + d * k; };

  // movers: 'loop' (closed), 'wrap' (start again at the beginning), 'pingpong' (there and back)
  const movers = [], tmp = {};
  function mover(I, idx, pts, o = {}) {
    const mode = o.mode || (o.loop ? 'loop' : 'pingpong'), p = path(pts, mode === 'loop', !!o.ground);
    const m = Object.assign({ I, idx, p, mode, sp: o.speed || 1, side: o.side || 0, d: (o.t0 || 0) * p.len, dir: 1, y: o.y ?? LAND, s: o.s ?? 1, h: null, ph: Math.random() * 6, wait: 0, pause: o.pause ?? 0 }, o.extra || {});
    movers.push(m); return m;
  }
  function place(m, d, dir, t) {
    m.p.at(d, tmp); const dx = tmp.dx * dir, dz = tmp.dz * dir, x = tmp.x - dz * m.side, z = tmp.z + dx * m.side, want = Math.atan2(dx, dz);
    m.h = m.h == null || reduced ? want : angTo(m.h, want, Math.min(1, (m.turn ?? 6) * (m.dt || 0.016)));
    let y = (tmp.y != null ? tmp.y : m.y) + (m.lift || 0), s = m.s, rz = 0;
    if (m.walk) { y += Math.abs(Math.sin(t * m.walk + m.ph)) * 0.12; rz = Math.sin(t * m.walk + m.ph) * 0.06; }
    if (m.waddle) { rz = Math.sin(t * m.waddle + m.ph) * 0.22; y += Math.abs(Math.sin(t * m.waddle + m.ph)) * 0.08; }
    if (m.buzz) y += Math.sin(t * 40 + m.ph) * 0.02;
    if (m.mode === 'wrap') s *= clamp(Math.min(d, m.p.len - d) / 14);
    m.I.set(m.idx, x, y, z, m.h, s, rz);
  }
  function moveAll(dt, t) {
    for (const m of movers) { m.dt = dt;
      if (m.follow) { const f = m.follow; let d = f.d - f.dir * m.gap, dir = f.dir; if (d < 0) { d = -d; dir = -dir; } if (d > f.p.len) { d = 2 * f.p.len - d; dir = -dir; } place(m, d, dir, t); continue; }
      if (!reduced) { if (m.wait > 0) m.wait -= dt; else { m.d += m.dir * m.sp * dt * TS;
        if (m.mode === 'loop' || m.mode === 'wrap') m.d = ((m.d % m.p.len) + m.p.len) % m.p.len;
        else if (m.d > m.p.len) { m.d = m.p.len; m.dir = -1; m.wait = m.pause; } else if (m.d < 0) { m.d = 0; m.dir = 1; m.wait = m.pause; } } }
      place(m, m.d, m.dir, t); }
  }

  // ---------- the cast (kept small on purpose: subtle, never busy) ----------
  const SHIRTS = ['#e8553a', '#3a7fd0', '#f2c230', '#ffffff', '#ff7aa0', '#2f9e6a', '#d24a32', '#7a5cd6', '#40b8c4', '#f08a3c', '#9ad14a', '#ffffff'];
  const carts = inst('proto_cart', (L.carts || []).length);
  (L.carts || []).forEach((c, i) => mover(carts, i, c.pts, { mode: c.loop ? 'loop' : 'pingpong', speed: c.speed, side: c.side, t0: c.t0, pause: 4, extra: { turn: 4 } }));
  const nWalk = (L.walkers || []).length, nStill = (L.still || []).length, nSwim = L.swim ? L.swim.n : 0, nKids = L.splash ? L.splash.n : 0;
  const people = inst('proto_person', nWalk + nStill + nSwim + nKids, { tint: 'shirt' }); let pi = 0;
  const dogs = inst('proto_dog', (L.walkers || []).filter(w => w.dog).length); let di = 0;
  (L.walkers || []).forEach((w) => { const onSand = w.pts.length && w.pts[0][0] > 200, m = mover(people, pi, w.pts, { speed: w.speed, side: w.side, t0: w.t0, pause: 2.5, ground: onSand, y: LAND, extra: { walk: 7, turn: 5 } });
    people.color(pi++, w.shirt || SHIRTS[pi % SHIRTS.length]);
    if (w.dog && dogs) movers.push(Object.assign({}, m, { I: dogs, idx: di++, follow: m, gap: -2.2, side: m.side + 0.9, walk: 11, h: null, ph: Math.random() * 6 })); });
  const still = (L.still || []).map((s, i) => { const k = pi++; people.color(k, s.shirt || SHIRTS[(k + 3) % SHIRTS.length]); return { k, ...s }; });
  const swim = []; for (let i = 0; i < nSwim; i++) { const k = pi++; people.color(k, SHIRTS[(k + 5) % SHIRTS.length]); swim.push(k); }
  const kids = []; for (let i = 0; i < nKids; i++) { const k = pi++; people.color(k, SHIRTS[(k + 7) % SHIRTS.length]); kids.push(k); }
  // the mower, with a pelican waddling along behind it (the joke: it thinks the mower is its mum)
  const mower = inst('proto_mower', L.mower ? 1 : 0), pelSit = inst('proto_pelican_sit', (L.mower ? 1 : 0) + (L.perch ? 1 : 0));
  let mowM = null; if (mower) { mowM = mover(mower, 0, L.mower.pts, { speed: L.mower.speed, pause: 0.6, extra: { buzz: 1, turn: 2.2 } });
    movers.push({ I: pelSit, idx: 0, p: mowM.p, follow: mowM, gap: 4.2, side: 0, y: LAND, s: 1, h: null, ph: 0, waddle: 9, turn: 3 }); }
  if (L.perch && pelSit) pelSit.set(pelSit.n - 1, L.perch.at[0], L.perch.y, L.perch.at[1], 2.4);
  const pels = inst('proto_pelican', (L.pelicans || []).length);
  // highway cars: each carriageway one way, gentle fade in and out at the rim
  const CARC = ['#ffffff', '#c9302c', '#2b2f36', '#9aa3ad', '#2d5fa8', '#f2f0ea', '#4a4f57'];
  const nCars = (L.cars || []).reduce((a, c) => a + (c.n || 3), 0), cars = inst('proto_car', nCars, { tint: 'car_body' }); let ci = 0;
  (L.cars || []).forEach((c) => { for (let j = 0; j < (c.n || 3); j++) { mover(cars, ci, c.pts, { mode: 'wrap', speed: c.speed * (0.9 + 0.2 * Math.random()), t0: (j + Math.random() * 0.5) / (c.n || 3), side: 0, y: LAND + 0.05, extra: { turn: 8 } }); cars.color(ci, CARC[ci % CARC.length]); ci++; } });
  [carts, people, dogs, mower, pelSit, pels, cars].forEach(I => I && I.done());

  // ---------- the bear (Montana Basecamp 10-11-2026, Adam's funny touch): only when model_info life.bear exists, so other listings are unchanged ----------
  // A black bear ambles a loop from the field to one picnic table, sniffs the cooler, a camper opens the RV door, peeks, ducks back in and slams it;
  // the bear looks up, sniffs again, turns and ambles off. Four-leg walk (lateral sequence), every foot planted while it is on the ground:
  // the stride is driven by the distance walked, so the feet never slide.
  let bearTick = () => {}; const bearI = [];
  if (L.bear && part.proto_bear_body && part.proto_bear_leg) try {
    const BR = L.bear, bp = path(BR.path, false), bB = inst('proto_bear_body', 1), bH = inst('proto_bear_head', 1), bL = inst('proto_bear_leg', 4);
    const dr = inst('proto_door', BR.door ? 1 : 0), cp = BR.camper ? inst('proto_person', 1, { tint: 'shirt' }) : null; if (cp) cp.color(0, BR.camper.shirt || '#f08a3c');
    bearI.push(bB, bH, bL, dr, cp);
    const Lg = 0.6, SW = 0.45, s0 = Lg * Math.sin(SW), BETA = 0.62, CYC = (2 * s0) / BETA, Y = BR.y ?? 0.2, V = (BR.speed ?? 1.0) * (CFG.bearPace ?? 1);
    const HIPS = [[0.19, -0.5, 0], [0.19, 0.48, 0.25], [-0.19, -0.5, 0.5], [-0.19, 0.48, 0.75]];   // x, z, phase: left hind, left fore, right hind, right fore
    const NECK = [0, 0.92, 0.78], o = {}, look = {};
    let d = Math.max(0, (BR.stopD || 0) - 45), ph = 0, h = null, mode = 'walk', tm = 0, hy = 0, hp = 0.12;
    const at = (dd) => bp.at(((dd % bp.len) + bp.len) % bp.len, o);
    const ease3 = (k) => k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k);
    const camPt = BR.camper ? BR.camper.out : null;
    function poseLegs(x, z, yb) {
      const c = Math.cos(h), s = Math.sin(h);
      HIPS.forEach(([lx, lz, off], i) => { const u = (((ph + off) % 1) + 1) % 1; let xf, lift = 0;
        if (u < BETA) xf = s0 - 2 * s0 * (u / BETA); else { const w = (u - BETA) / (1 - BETA); xf = -s0 + 2 * s0 * ease3(w); lift = Math.sin(Math.PI * w) * 0.09; }
        const th = -Math.asin(Math.max(-0.95, Math.min(0.95, xf / Lg)));
        bL.set(i, x + lx * c + lz * s, yb + 0.62 + lift, z - lx * s + lz * c, h, 1, 0, th); });
    }
    bearTick = (dt, t) => {
      if (reduced) { d = BR.stopD - 3.5; at(d); h = Math.atan2(o.dx, o.dz); ph = 0; } else {
        tm += dt;
        if (mode === 'walk') { const left = BR.stopD - (((d % bp.len) + bp.len) % bp.len), k = left > 0 && left < 1.6 ? Math.max(0.18, left / 1.6) : 1, step = V * k * dt;
          if (left > 0 && left <= step + 0.005) { d += left; ph += left / CYC; mode = 'sniff'; tm = 0; } else { d += step; ph += step / CYC; } }
        else if (mode === 'sniff') { if (tm > (BR.dwell ?? 7.5)) { mode = 'turn'; tm = 0; } }
        else if (mode === 'turn') { at(d + 1.2); const p0 = { ...o }; at(d); const want = Math.atan2(p0.x - o.x, p0.z - o.z); let dd = want - h; while (dd > Math.PI) dd -= 2 * Math.PI; while (dd < -Math.PI) dd += 2 * Math.PI;
          const st = Math.sign(dd) * Math.min(Math.abs(dd), 1.3 * dt); h += st; ph += Math.abs(st) * 0.45 / CYC; if (Math.abs(dd) < 0.04) { mode = 'walk'; tm = 0; d += 0.01; } }
      }
      at(d); const x = o.x, z = o.z;
      if (mode === 'walk' || h == null) { at(d + 0.9); const want = Math.atan2(o.x - x, o.z - z); h = h == null || reduced ? want : angTo(h, want, Math.min(1, 3.2 * dt)); at(d); }
      const moving = mode === 'walk' && !reduced, yb = Y + (moving ? 0.022 * Math.sin(ph * Math.PI * 4) : 0), roll = moving ? 0.03 * Math.sin(ph * Math.PI * 2) : 0;
      bB.set(0, x, yb, z, h, 1, roll);
      poseLegs(x, z, yb);
      // head: low and swinging as it walks; down and sniffing at the cooler; up to stare at the camper
      let wy = 0.13 * Math.sin(ph * Math.PI * 2) + 0.08 * Math.sin(t * 0.37), wp = 0.14 + 0.05 * Math.sin(ph * Math.PI * 4);
      if (mode === 'sniff' && !reduced) { const T = tm; wp = 0.5 + 0.06 * Math.sin(t * 9); wy = 0.12 * Math.sin(t * 0.8);
        if (T > 3.1 && T < 5.7 && camPt) { const ang = Math.atan2(camPt[0] - x, camPt[2] - z); let rel = ang - h; while (rel > Math.PI) rel -= 2 * Math.PI; while (rel < -Math.PI) rel += 2 * Math.PI;
          const k = ease3((T - 3.1) / 0.35) * (1 - ease3((T - 5.3) / 0.4)); wy = wy * (1 - k) + Math.max(-1.0, Math.min(1.0, rel)) * k; wp = wp * (1 - k) - 0.12 * k; } }
      if (mode === 'turn') { wp = 0.22; wy = 0; }
      hy += (wy - hy) * Math.min(1, 6 * dt); hp += (wp - hp) * Math.min(1, 6 * dt);
      const c = Math.cos(h), s = Math.sin(h); bH.set(0, x + NECK[2] * s, yb + NECK[1], z + NECK[2] * c, h + hy, 1, 0, hp);
      // the camper: door opens, a peek, a quick duck back in, door slammed
      if (dr || cp) { const T = mode === 'sniff' ? tm : 99; let a = 0, out = 0;
        if (T < 99) { a = 1.7 * ease3((T - 1.3) / 0.6); out = ease3((T - 1.9) / 0.6); if (T > 3.85) { out *= 1 - ease3((T - 3.85) / 0.28); } if (T > 4.12) a *= 1 - Math.min(1, (T - 4.12) / 0.2); }
        if (dr) { const H0 = BR.door.hinge; dr.set(0, H0[0], H0[1], H0[2], BR.door.ry - a); }
        if (cp) { const A = BR.camper.in, Bo = BR.camper.out; cp.set(0, A[0] + (Bo[0] - A[0]) * out, A[1], A[2] + (Bo[2] - A[2]) * out, BR.camper.ry + 0.35 * out * Math.sin(t * 2.2), 1, 0, 0.18 * out); }
      }
      bearI.forEach(I => I && I.done());
    };
    bearTick(0, 0);
  } catch (err) { console.warn('bear', err); }

  // ---------- palms sway (the crowns only, gently) ----------
  const swayU = { value: 0 };
  if (!reduced) MATS.filter(m => ['palms', 'proto_palm'].includes(m.userData.p) && /frond/.test(m.name)).forEach(m => {
    m.onBeforeCompile = (sh) => { sh.uniforms.uSway = swayU; sh.vertexShader = 'uniform float uSway;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      float swh = max(0.0, position.y - 3.0); float swp = position.x * 0.17 + position.z * 0.13;
      transformed.x += (sin(uSway * 1.2 + swp) * 0.06 + sin(uSway * 3.1 + swp * 2.0) * 0.02) * swh;
      transformed.z += (cos(uSway * 1.0 + swp * 1.3) * 0.05) * swh;
      transformed.y -= abs(sin(uSway * 1.7 + swp)) * 0.015 * swh;`); };
    m.customProgramCacheKey = () => 'nvsway1'; m.needsUpdate = true; });

  // ---------- water: the ripples drift ----------
  const waterTex = []; for (const w of SC.waterParts || []) part[w] && part[w].traverse(o => { if (o.isMesh && o.material.normalMap) { const t = o.material.normalMap; t.wrapS = t.wrapT = THREE.RepeatWrapping; waterTex.push({ t, m: o.material, n0: o.material.normalScale.clone() }); } });

  // ---------- surf: three soft lines of foam roll in to the beach ----------
  const surf = [];
  const FOAM = (() => { const W = 256, H = 64, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d'), im = x.createImageData(W, H);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const v = j / (H - 1), across = Math.pow(1 - v, 1.6) * Math.min(1, v * 14 + 0.15), br = 0.55 + 0.45 * Math.sin(i / W * Math.PI * 6 + Math.sin(i * 0.21) * 1.5) * Math.sin(i / W * Math.PI * 2 + 1),
      a = Math.max(0, across * (0.6 + 0.4 * br) * (0.8 + 0.2 * Math.random())), k = (j * W + i) * 4; im.data[k] = im.data[k + 1] = im.data[k + 2] = 255; im.data[k + 3] = Math.round(255 * Math.min(1, a)); }
    x.putImageData(im, 0, 0); const t = new THREE.CanvasTexture(cv); t.wrapS = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t; })();
  if (L.sea && L.sea.length > 3 && !reduced) {
    const S = L.sea, n = S.length, N = S.map((p, i) => { const a = S[Math.max(0, i - 1)], b = S[Math.min(n - 1, i + 1)]; let nx = b[1] - a[1], nz = -(b[0] - a[0]); const l = Math.hypot(nx, nz) || 1; nx /= l; nz /= l; if (nx < 0) { nx = -nx; nz = -nz; } return [nx, nz]; });
    for (let w = 0; w < 3; w++) { const pos = new Float32Array(n * 2 * 3), idx = []; for (let i = 0; i < n - 1; i++) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
      const uv = new Float32Array(n * 2 * 2); for (let i = 0; i < n; i++) { uv[i * 4] = i / 6; uv[i * 4 + 1] = 0; uv[i * 4 + 2] = i / 6; uv[i * 4 + 3] = 1; }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx);
      const m = new THREE.MeshBasicMaterial({ color: 0xffffff, map: FOAM, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
      const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 3; root.add(mesh); surf.push({ g, m, ph: w / 3 }); }
    surf.S = S; surf.N = N;
  }
  const RIM = (INFO.R || 420) - 2.5;
  const tickSurf = (t) => { if (!surf.length) return; const S = surf.S, N = surf.N, y = (INFO.waterY ?? 0.05) + 0.04;
    for (const s of surf) { const f = ((t / 8) + s.ph) % 1, d = 40 * (1 - f) - 12, wd = 2.5 + 4.5 * Math.sin(Math.PI * Math.min(1, f * 1.2)), p = s.g.attributes.position.array;
      for (let i = 0; i < S.length; i++) { const wob = Math.sin(i * 0.21 + t * 0.35 + s.ph * 9) * 2.2 + Math.sin(i * 0.53 + s.ph * 4) * 0.8, dd = d + wob, [nx, nz] = N[i], k = i * 6;
        let ax = S[i][0] + nx * dd, az = S[i][1] + nz * dd, bx = S[i][0] + nx * (dd + wd), bz = S[i][1] + nz * (dd + wd);
        if (Math.hypot(bx, bz) > RIM) { const sc = RIM / Math.hypot(bx, bz); bx *= sc; bz *= sc; } if (Math.hypot(ax, az) > RIM) { ax = bx; az = bz; }
        p[k] = ax; p[k + 1] = y; p[k + 2] = az; p[k + 3] = bx; p[k + 4] = y; p[k + 5] = bz; }
      s.g.attributes.position.needsUpdate = true; s.m.opacity = 0.75 * Math.pow(Math.sin(Math.PI * f), 0.6) * (f > 0.85 ? (1 - f) / 0.15 : 1); } };

  // ---------- Sunset switch ----------
  const hemi = scene.children.find(o => o.isHemisphereLight), sd = INFO.sun || [-0.42, 0.16, 0.89];
  const DAY = { sc: sun.color.clone(), si: sun.intensity, sp: sun.position.clone(), hi: hemi ? hemi.intensity : 0, hs: hemi ? hemi.color.clone() : null, hg: hemi ? hemi.groundColor.clone() : null, ex: renderer.toneMappingExposure, en: scene.environmentIntensity, bg: SC.backdrop };
  const DUSK = { sc: new THREE.Color('#ff8d4d'), si: 2.0, sp: new THREE.Vector3(sd[0] * 1.25, 0.24, sd[2] * 1.25), hi: 0.3, hs: new THREE.Color('#8a90c4'), hg: new THREE.Color('#40281c'), ex: 1.0, en: 0.25, bg: CFG.duskBackdrop || ['#3a2d4d', '#7d4436', '#1b1210'] };
  const lampsI = INFO.lamps || [], lampM = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffc27a').multiplyScalar(3.2), toneMapped: false, transparent: true, opacity: 0 });
  const lampMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.42, 8, 6), lampM, Math.max(1, lampsI.length)); lampMesh.frustumCulled = false;
  const poolTex = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const x = cv.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,190,120,0.9)'); g.addColorStop(1, 'rgba(255,170,90,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(cv); })();
  const poolM = new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const poolMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(9, 9).rotateX(-Math.PI / 2), poolM, Math.max(1, lampsI.length)); poolMesh.frustumCulled = false; poolMesh.renderOrder = 3;
  { const m4 = new THREE.Matrix4(); lampsI.forEach((p, i) => { lampMesh.setMatrixAt(i, m4.makeTranslation(p[0], p[1], p[2])); poolMesh.setMatrixAt(i, m4.makeTranslation(p[0], LAND + 0.12, p[2])); }); }
  lampMesh.visible = poolMesh.visible = false; root.add(lampMesh, poolMesh);
  const GLOWS = [['glass', new THREE.Color(1.0, 0.6, 0.28), 1.5], ['pool_water', new THREE.Color(0.2, 0.75, 1.0), 0.9], ['rv_glass', new THREE.Color(1.0, 0.6, 0.28), 1.5]];
  const glowMats = MATS.filter(m => GLOWS.some(g => g[0] === m.name)).map(m => ({ m, e0: m.userData.e0.clone(), g: GLOWS.find(g => g[0] === m.name) }));
  let dusk = false, dk = 0;
  const bgCv = scene.background && scene.background.image, bgX = bgCv && bgCv.getContext && bgCv.getContext('2d');
  const lerpHex = (a, b, k) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), k).getHexString();
  const paintBg = (k) => { if (!bgX) return; const gr = bgX.createLinearGradient(0, 0, 0, bgCv.height); [0, 0.55, 1].forEach((s, i) => gr.addColorStop(s, lerpHex(DAY.bg[i], DUSK.bg[i], k))); bgX.fillStyle = gr; bgX.fillRect(0, 0, bgCv.width, bgCv.height); scene.background.needsUpdate = true; };
  function applyDusk(k, selOn) {
    const e = ease(k); sun.color.copy(DAY.sc).lerp(DUSK.sc, e); sun.intensity = DAY.si + (DUSK.si - DAY.si) * e; sun.position.copy(DAY.sp).lerp(DUSK.sp, e);
    if (hemi) { hemi.intensity = DAY.hi + (DUSK.hi - DAY.hi) * e; hemi.color.copy(DAY.hs).lerp(DUSK.hs, e); hemi.groundColor.copy(DAY.hg).lerp(DUSK.hg, e); }
    renderer.toneMappingExposure = DAY.ex + (DUSK.ex - DAY.ex) * e; scene.environmentIntensity = DAY.en + (DUSK.en - DAY.en) * e; paintBg(e);
    const lk = ease((k - 0.35) / 0.65); lampM.opacity = lk; poolM.opacity = 0.75 * lk; lampMesh.visible = poolMesh.visible = lk > 0.01;
    for (const g of glowMats) { g.m.userData.e0.copy(g.e0).lerp(g.g[1].clone().multiplyScalar(g.g[2]), lk); if (!selOn(g.m)) { g.m.emissive.copy(g.m.userData.e0); g.m.emissiveIntensity = 1; } }
  }
  // the button sits under the Tour button, same look
  const tb = document.getElementById('tourbtn'), st = document.createElement('style');
  st.textContent = `#sunbtn { position:fixed; left:14px; top:calc(env(safe-area-inset-top) + ${tb ? 108 : 64}px); z-index:4; border:1px solid rgba(var(--lc),.2); background:rgba(var(--bgc),.7); color:var(--ink); font:600 12.5px var(--font), sans-serif; padding:8px 12px; border-radius:20px; backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px); display:flex; align-items:center; gap:6px; min-height:36px; cursor:pointer; }
    #sunbtn svg { width:15px; height:15px; } #sunbtn.on { background:var(--hero); color:var(--onhero); border-color:var(--hero); }`;
  document.head.appendChild(st);
  const btn = document.createElement('button'); btn.id = 'sunbtn'; btn.type = 'button'; btn.setAttribute('aria-pressed', 'false');
  const SUN_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M17 18a5 5 0 0 0-10 0"/><path d="M12 2v7M4.2 10.2l1.4 1.4M1 18h2M21 18h2M18.4 11.6l1.4-1.4M23 22H1M8 6l4-4 4 4"/></svg>';
  const DAY_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 1.5v2.5M12 20v2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M1.5 12H4M20 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8"/></svg>';
  const label = () => { btn.innerHTML = dusk ? DAY_SVG + '<span>Daytime</span>' : SUN_SVG + '<span>Sunset</span>'; btn.classList.toggle('on', dusk); btn.setAttribute('aria-pressed', dusk); btn.setAttribute('aria-label', dusk ? 'Back to daytime' : 'Show the park at sunset'); };
  label(); btn.onclick = () => { dusk = !dusk; label(); }; (tb && tb.parentNode ? tb.parentNode : document.body).insertBefore(btn, tb ? tb.nextSibling : null);
  window.__sunset = (on) => { dusk = on == null ? !dusk : !!on; label(); if (reduced) dk = dusk ? 1 : 0; };

  // ---------- Room to grow: the lawn builds itself, out of light ----------
  // (Adam, 10-11-2026: not yellow, "more glowing, like built-in light"): everything first appears as warm white light, then turns solid
  const LIGHT = new THREE.Color(CFG.light || '#fff2da');
  const lightM = (k, extra) => { const m = new THREE.MeshBasicMaterial(Object.assign({ color: LIGHT.clone().multiplyScalar(k), toneMapped: false, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }, extra)); m.userData.gc = m.color.clone(); GM.push(m); return m; };
  // light shapes that flash per item: additive, brightness set per copy (black = invisible)
  const ghosts = (geo, n, k, parent) => { const m = new THREE.MeshBasicMaterial({ color: LIGHT.clone().multiplyScalar(k), toneMapped: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }); m.userData.gc = m.color.clone(); GM.push(m);
    const im = new THREE.InstancedMesh(geo, m, Math.max(1, n)); im.frustumCulled = false; im.renderOrder = 4; const c0 = new THREE.Color(0, 0, 0); for (let i = 0; i < im.count; i++) im.setColorAt(i, c0); parent.add(im);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), pv = new THREE.Vector3(), sv = new THREE.Vector3(1, 1, 1), up = new THREE.Vector3(0, 1, 0), col = new THREE.Color();
    return { set(i, x, y, z, ry, b, s = 1) { q.setFromAxisAngle(up, ry || 0); m4.compose(pv.set(x, y, z), q, sv.setScalar(b > 0.003 ? s : 1e-4)); im.setMatrixAt(i, m4); im.setColorAt(i, col.setScalar(Math.max(0, b))); },
      done() { im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; } }; };
  const flash = (t, a, d, decay = 2.2) => t <= a ? 0 : t < a + d ? (t - a) / d : Math.exp(-(t - a - d) * decay);
  const FX = {
    build(c) {
      const g = new THREE.Group(), pads = INFO[c.list || 'grow'] || [], rots = INFO[c.rot || 'growRot'] || [], lane = L.growLane || [], n = pads.length;
      const xs = pads.map(p => p[0]).concat(lane.map(p => p[0])), zs = pads.map(p => p[2]), x0 = Math.min(...xs) - 12, x1 = Math.max(...xs) + 12, z0 = Math.min(...zs) - 14, z1 = Math.max(...zs) + 14;
      const sweepM = lightM(1.6, { side: THREE.DoubleSide });
      const sweep = new THREE.Mesh(new THREE.PlaneGeometry(z1 - z0, 9), sweepM); sweep.rotation.y = Math.PI / 2; sweep.position.set(x0, LAND + 4.5, (z0 + z1) / 2); g.add(sweep);
      const conc = new THREE.MeshStandardMaterial({ color: '#b9b4a9', roughness: 0.92 });
      const LW = c.laneWidth ?? 6, laneM = new THREE.Mesh(new THREE.BoxGeometry(1, 0.3, LW), conc), lx0 = lane.length ? lane[0][0] : x0, lx1 = lane.length ? lane[1][0] : x1, lz = lane.length ? lane[0][1] : 0;
      laneM.receiveShadow = true; g.add(laneM);
      const edgeM = lightM(2.6), edges = [-1, 1].map(sg => { const e = new THREE.Mesh(new THREE.BoxGeometry(1, 0.25, 0.45), edgeM); e.position.z = lz + sg * LW / 2; g.add(e); return e; });
      // several lanes in any direction (Montana Basecamp 10-11-2026): life.growLanes = polylines; each segment draws in turn. Without it, the single lane above.
      const MULTI = (L.growLanes || []).filter(l => l && l.length > 1), segs = [];
      for (const l of MULTI) for (let i = 1; i < l.length; i++) { const [ax, az] = l[i - 1], [bx, bz] = l[i], sl = Math.hypot(bx - ax, bz - az); if (sl < 0.5) continue;
        const ry = -Math.atan2(bz - az, bx - ax), mm = new THREE.Mesh(new THREE.BoxGeometry(1, 0.3, LW), conc); mm.rotation.y = ry; mm.receiveShadow = true; g.add(mm);
        const ee = [-1, 1].map(sg => { const e = new THREE.Mesh(new THREE.BoxGeometry(1, 0.25, 0.45), edgeM); e.rotation.y = ry; g.add(e); return { e, sg }; });
        segs.push({ ax, az, ux: (bx - ax) / sl, uz: (bz - az) / sl, sl, mm, ee }); }
      const PL = c.len ?? 18, PW = c.wid ?? 4.8, padI = new THREE.InstancedMesh(new THREE.BoxGeometry(PW, 0.32, PL), conc, Math.max(1, n)); padI.receiveShadow = true; padI.frustumCulled = false; g.add(padI);
      const outM = pads.map(() => lightM(c.k ?? 2.4)), outs = pads.map((ct, i) => { const ry = rots[i] || 0, pts = [[-PW / 2, -PL / 2], [PW / 2, -PL / 2], [PW / 2, PL / 2], [-PW / 2, PL / 2]].map(([x, z]) => new THREE.Vector3(x * Math.cos(ry) + z * Math.sin(ry) + ct[0], LAND + 0.45, -x * Math.sin(ry) + z * Math.cos(ry) + ct[2]));
        const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0), 24, 0.32, 5, true), outM[i]); g.add(m); return m; });
      const padG = ghosts(new THREE.BoxGeometry(PW + 0.5, 0.9, PL + 0.5), n, 1.8, g); const laneGM = lightM(1.6), laneG = new THREE.Mesh(new THREE.BoxGeometry(1, 0.8, LW + 0.6), laneGM); laneG.renderOrder = 4; g.add(laneG);
      const palmsP = L.growPalms || [], palmI = inst('proto_palm', palmsP.length, { parent: g }), palmG = ghosts(new THREE.CylinderGeometry(0.5, 1.4, 10, 10, 1, true).translate(0, 5, 0), palmsP.length, 1.3, g);
      const rvP = (L.growRVs || []), rvI = inst('proto_rv', rvP.length, { parent: g }), rvPaths = rvP.map(r => path(r.path, false));
      const rvLongX = rvI ? (rvI.box.max.x - rvI.box.min.x) > (rvI.box.max.z - rvI.box.min.z) : false;
      const rvSize = rvI ? rvI.box.getSize(new THREE.Vector3()) : new THREE.Vector3(3, 3.5, 12), rvG = ghosts(new THREE.BoxGeometry(rvSize.x + 0.6, rvSize.y + 0.6, rvSize.z + 0.6).translate(0, rvSize.y / 2, 0), rvP.length, 1.4, g);
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), pv = new THREE.Vector3(), sv = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), o = {};
      const T = { sweep: [0.5, 2.0], lane: [1.0, 2.4], pad0: 1.8, padGap: c.padGap ?? 0.045, padDur: 0.55, palm0: 2.2, palmGap: 0.06, rv0: 3.3, rvGap: 0.5, rvDur: 2.6 };
      const padEnd = T.pad0 + (n - 1) * T.padGap + T.padDur, fmt = c.tag || (GROW && GROW.tag && GROW.tag.text) || '', total = c.count ?? n;
      return { obj: g, mat: edgeM, tick(t0, k, pulse) {
        const t = reduced ? 99 : t0;
        const sf = clamp((t - T.sweep[0]) / (T.sweep[1] - T.sweep[0])); sweep.position.x = x0 + (x1 - x0) * ease(sf); sweepM.opacity = 0.3 * Math.sin(Math.PI * sf); sweep.visible = sf > 0 && sf < 1;
        const lf = ease((t - T.lane[0]) / (T.lane[1] - T.lane[0])), len = Math.max(0.01, (lx1 - lx0) * lf), mid = lx0 + len / 2;
        laneM.scale.x = len; laneM.position.set(mid, LAND - 0.12 + 0.14 * lf, lz); laneM.visible = lf > 0;
        edges.forEach(e => { e.scale.x = len; e.position.x = mid; e.position.y = LAND + 0.2; e.visible = lf > 0; }); edgeM.opacity = lf * (t < T.lane[1] + 0.6 ? 1 : 0.35 + 0.2 * pulse); laneG.scale.x = len; laneG.position.set(mid, LAND + 0.2, lz); laneGM.opacity = 0.35 * flash(t, T.lane[0], T.lane[1] - T.lane[0], 1.6); laneG.visible = laneGM.opacity > 0.003;
        if (segs.length) { laneM.visible = false; laneG.visible = false; edges.forEach(e => e.visible = false); const n2 = segs.length, span = T.lane[1] - T.lane[0];
          segs.forEach((sg, i) => { const f = ease((t - T.lane[0] - i * span * 0.35) / (span * 0.9)), ln = Math.max(0.01, sg.sl * f), mx = sg.ax + sg.ux * ln / 2, mz = sg.az + sg.uz * ln / 2;
            sg.mm.scale.x = ln; sg.mm.position.set(mx, LAND - 0.12 + 0.14 * f, mz); sg.mm.visible = f > 0;
            sg.ee.forEach(({ e, sg: k }) => { e.scale.x = ln; e.position.set(mx - sg.uz * k * LW / 2, LAND + 0.2, mz + sg.ux * k * LW / 2); e.visible = f > 0; }); }); }
        for (let i = 0; i < n; i++) { const pf = clamp((t - T.pad0 - i * T.padGap) / T.padDur), b = back(pf), p = pads[i];
          q.setFromAxisAngle(up, rots[i] || 0); m4.compose(pv.set(p[0], LAND - 0.5 + 0.62 * b, p[2]), q, sv.set(1, 1, 1).multiplyScalar(pf > 0 ? 1 : 1e-4)); padI.setMatrixAt(i, m4);
          outM[i].opacity = pf * (t > padEnd + 0.4 ? 0.22 + 0.16 * pulse : 0.7); outs[i].visible = pf > 0;
          padG.set(i, p[0], LAND + 0.3, p[2], rots[i] || 0, flash(t, T.pad0 + i * T.padGap, T.padDur * 0.6, 3.2) * 0.26); }
        padI.instanceMatrix.needsUpdate = true; padG.done();
        if (palmI) { palmsP.forEach((p, j) => { const pf = clamp((t - T.palm0 - j * T.palmGap) / 0.55); palmI.set(j, p[0], LAND, p[1], j * 1.7, pf > 0 ? back(pf) * 1.05 : 1e-4); palmG.set(j, p[0], LAND, p[1], 0, flash(t, T.palm0 + j * T.palmGap, 0.25, 3) * 0.5, 1); }); palmI.done(); palmG.done(); }
        if (rvI) { rvP.forEach((r, j) => { const P = rvPaths[j], rf = clamp((t - T.rv0 - j * T.rvGap) / T.rvDur);
            if (rf <= 0) { rvI.set(j, 0, PY, 0, 0, 1e-4); rvG.set(j, 0, PY, 0, 0, 0); return; } const e2 = ease(rf); P.at(e2 * P.len, o);
            const yaw = rvLongX ? Math.atan2(-o.dz, o.dx) : Math.atan2(o.dx, o.dz); rvI.set(j, o.x, LAND, o.z, yaw, clamp(rf * 6));
            const gb = rf < 0.25 ? 1 - rf / 0.25 : rf > 0.97 ? flash(t, T.rv0 + j * T.rvGap + T.rvDur * 0.97, 0.08, 3) * 0.5 : 0; rvG.set(j, o.x, LAND, o.z, yaw, gb * 0.5); }); rvI.done(); rvG.done(); }
        if (GROW && GROW.tag && fmt) { const nn = Math.round(total * clamp((t - T.pad0) / (padEnd - T.pad0))); GROW.tag.text = fmt.replace(/\d+/, String(nn)); }
      } };
    },
  };


  // ---------- Find your site: a guest types their site number and sees the walk to the pool, the bathhouse, the beach ----------
  // (Adam, 10-11-2026: "They get number 27... I could show number 27 on the map, how you get to the pool from your pitch")
  // listing.json scene.wayfind: lanes (walkable polylines, model x/z), go (destinations: door or via points), start (where routes begin with no site)
  const WF = SC.wayfind; let wfTick = () => {};
  if (WF && INFO.pads && INFO.padNo) {
    const LY0 = LAND + 0.7, nodes = [], adj = [];
    const addN = (x, z) => { nodes.push([x, z]); adj.push([]); return nodes.length - 1; };
    for (const l of WF.lanes) { let prev = -1; for (let i = 1; i < l.length; i++) { const [a, b] = l[i - 1], [c, d] = l[i], n = Math.max(1, Math.ceil(Math.hypot(c - a, d - b) / 4));
        for (let k = (i === 1 ? 0 : 1); k <= n; k++) { const id = addN(a + (c - a) * k / n, b + (d - b) * k / n); if (prev >= 0) { adj[prev].push(id); adj[id].push(prev); } prev = id; } } }
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) if (Math.hypot(nodes[i][0] - nodes[j][0], nodes[i][1] - nodes[j][1]) < 2.8) { adj[i].push(j); adj[j].push(i); }
    const near = (x, z) => { let b = 0, bd = 1e9; nodes.forEach(([a, c], i) => { const d = Math.hypot(a - x, c - z); if (d < bd) { bd = d; b = i; } }); return b; };
    const route = (s, e) => { const n = nodes.length, dist = new Float64Array(n).fill(1e9), prev = new Int32Array(n).fill(-1), done = new Uint8Array(n); dist[s] = 0;
      for (;;) { let u = -1, bd = 1e9; for (let i = 0; i < n; i++) if (!done[i] && dist[i] < bd) { bd = dist[i]; u = i; } if (u < 0 || u === e) break; done[u] = 1;
        for (const v of adj[u]) { const w = bd + Math.hypot(nodes[u][0] - nodes[v][0], nodes[u][1] - nodes[v][1]); if (w < dist[v]) { dist[v] = w; prev[v] = u; } } }
      const out = []; for (let v = e; v >= 0; v = prev[v]) out.unshift(nodes[v]); return out; };
    const goOf = (g) => g.via ? g.via : [g.door];
    const startPt = () => { const g = WF.go.find(x => x.id === WF.start); return g ? goOf(g)[0] : nodes[0]; };
    const simplify = (P) => { const o = [P[0]]; for (let i = 1; i < P.length - 1; i++) { const a = o[o.length - 1], b = P[i], c = P[i + 1], cr = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]); if (Math.abs(cr) > 0.5) o.push(b); } o.push(P[P.length - 1]); return o; };
    const g0 = new THREE.Group(); g0.visible = false; root.add(g0);
    const pathM = lightM(1.5), padM = lightM(2.2), pillarM = lightM(1.4, { side: THREE.DoubleSide });
    const dot = new THREE.Mesh(new THREE.SphereGeometry(1.3, 12, 8), new THREE.MeshBasicMaterial({ color: LIGHT.clone().multiplyScalar(4), toneMapped: false })); g0.add(dot);
    const pill = () => { const m = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.8, 26, 16, 1, true).translate(0, 13, 0), pillarM); g0.add(m); return m; };
    const pA = pill(), pB = pill(); let tube = null, outl = null, curve = null, len = 1, tw = 0, labels = [];
    const mk = (cls) => { const e = document.createElement('div'); e.className = 'tag'; e.style.display = 'none'; e.style.zIndex = 3; document.body.appendChild(e); return e; };
    const tagS = mk(), tagD = mk(), tv = new THREE.Vector3();
    let site = null, dest = null;
    function draw() {
      if (tube) { g0.remove(tube); tube.geometry.dispose(); tube = null; } if (outl) { g0.remove(outl); outl.geometry.dispose(); outl = null; }
      const sp = site != null ? INFO.pads[site] : null, from = sp ? [sp[0], sp[2]] : startPt();
      if (sp) { const ry = (INFO.padRot || [])[site] || 0, PW = 4.8, PL = 20, pts = [[-PW / 2, -PL / 2], [PW / 2, -PL / 2], [PW / 2, PL / 2], [-PW / 2, PL / 2]].map(([x, z]) => new THREE.Vector3(x * Math.cos(ry) + z * Math.sin(ry) + sp[0], LAND + 0.6, -x * Math.sin(ry) + z * Math.cos(ry) + sp[2]));
        outl = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0), 24, 0.45, 5, true), padM); g0.add(outl); pA.position.set(sp[0], LAND, sp[2]); pA.visible = true; } else pA.visible = false;
      if (dest) { const vp = goOf(dest), end = vp[vp.length - 1]; let P = route(near(from[0], from[1]), near(vp[0][0], vp[0][1]));
        P = [from, ...P, ...vp]; P = simplify(P); const V3 = P.map(([x, z]) => new THREE.Vector3(x, LY0, z));
        curve = new THREE.CatmullRomCurve3(V3, false, 'catmullrom', 0.02); len = curve.getLength();
        tube = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.min(600, Math.max(40, Math.round(len / 2))), 0.42, 6, false), pathM); g0.add(tube);
        pB.position.set(end[0], LAND, end[1]); pB.visible = true; } else { pB.visible = false; curve = null; }
      tw = 0; g0.visible = true;
      // frame the whole route (or the site) with room to spare, wide enough for a tall phone screen
      const pts = (curve ? curve.getPoints(40).map(v => [v.x, v.z]) : []).concat([from]);
      const xs = pts.map(p => p[0]), zs = pts.map(p => p[1]), cx = (Math.min(...xs) + Math.max(...xs)) / 2, cz = (Math.min(...zs) + Math.max(...zs)) / 2;
      const span = Math.max(60, Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs)));
      const cam = X.camera, asp = cam ? cam.aspect : 1.5, hh = Math.atan(Math.tan(THREE.MathUtils.degToRad((cam ? cam.fov : 40) / 2)) * Math.min(asp, 1.6));
      const need = (span * 0.62) / Math.tan(hh) / (asp < 0.8 ? 1.35 : 1);
      if (X.goView) X.goView({ at: [cx, 0, cz], dist: Math.max(170, need), el: 1.0, az: SC.az ?? 0.6 }, 1.2);
    }
    function clear() { site = null; dest = null; g0.visible = false; tagS.style.display = tagD.style.display = 'none'; panel.querySelectorAll('.wfgo').forEach(b => b.classList.remove('on')); msg.textContent = ''; }
    wfTick = (dt) => {
      if (!g0.visible) return; tw += dt; const k = reduced ? 1 : clamp(tw / 1.4);
      if (tube) { const ic = tube.geometry.index.count; tube.geometry.setDrawRange(0, Math.floor(ic * k / 6) * 6); }
      pathM.opacity = 0.9; padM.opacity = 0.6 + 0.4 * Math.sin(tw * 3); pillarM.opacity = 0.32 * (0.7 + 0.3 * Math.sin(tw * 2.4));
      if (curve) { const f = reduced ? 1 : ((tw * 22) / len) % 1, pt = curve.getPointAt(k < 1 ? k : f); dot.position.copy(pt); dot.visible = true; } else dot.visible = false;
      const tag = (el, x, z, text) => { tv.set(x, LAND + 10, z); model.localToWorld(tv); tv.project(X.camera); if (tv.z > 1) { el.style.display = 'none'; return; } el.textContent = text; el.style.display = 'block';
        const hw = el.offsetWidth / 2 + 8, sx = Math.min(innerWidth - hw, Math.max(hw, (tv.x * 0.5 + 0.5) * innerWidth)); el.style.transform = `translate(${sx}px, ${(-tv.y * 0.5 + 0.5) * innerHeight - 8}px) translate(-50%, -100%)`; };
      if (site != null) tag(tagS, INFO.pads[site][0], INFO.pads[site][2], (WF.unit || 'Site') + ' ' + INFO.padNo[site] + (dest ? '' : ' · you are here')); else tagS.style.display = 'none';
      if (dest && curve) { const e = goOf(dest).slice(-1)[0], mins = Math.max(1, Math.round(len / (WF.walk || 78))); tag(tagD, e[0], e[1], `${dest.label} · about ${mins} min walk`); } else tagD.style.display = 'none';
    };
    // ---- the panel ----
    const css = document.createElement('style'); const top0 = (tb ? 152 : 108);
    css.textContent = `#wfbtn { position:fixed; left:14px; top:calc(env(safe-area-inset-top) + ${top0}px); z-index:4; border:1px solid rgba(var(--lc),.2); background:rgba(var(--bgc),.7); color:var(--ink); font:600 12.5px var(--font), sans-serif; padding:8px 12px; border-radius:20px; backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px); display:flex; align-items:center; gap:6px; min-height:36px; cursor:pointer; }
      #wfbtn svg { width:15px; height:15px; } #wfbtn.on { background:var(--hero); color:var(--onhero); border-color:var(--hero); }
      #wfpanel { position:fixed; left:14px; top:calc(env(safe-area-inset-top) + ${top0 + 46}px); z-index:5; width:min(310px, calc(100vw - 28px)); background:rgba(var(--bgc),.9); border:1px solid rgba(var(--lc),.2); border-radius:16px; padding:12px; color:var(--ink); font:13px var(--font), sans-serif; backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); display:none; }
      #wfpanel.on { display:block; } #wfpanel .row { display:flex; gap:8px; } #wfpanel input { flex:1; min-width:0; font:600 16px var(--font), sans-serif; padding:9px 11px; border-radius:10px; border:1px solid rgba(var(--lc),.25); background:rgba(var(--lc),.06); color:var(--ink); }
      #wfpanel .show { font:700 13px var(--font), sans-serif; padding:9px 14px; border-radius:10px; border:0; background:var(--hero); color:var(--onhero); cursor:pointer; }
      #wfpanel .lab { margin:10px 0 6px; color:var(--dim); font-size:12px; } #wfpanel .gos { display:flex; flex-wrap:wrap; gap:6px; }
      #wfpanel .wfgo { font:600 12.5px var(--font), sans-serif; padding:7px 10px; border-radius:16px; border:1px solid rgba(var(--lc),.22); background:transparent; color:var(--ink); cursor:pointer; } #wfpanel .wfgo.on { background:var(--hero); color:var(--onhero); border-color:var(--hero); }
      #wfpanel .msg { color:var(--hero); font-size:12px; min-height:0; margin-top:6px; } #wfpanel .note { color:var(--dim); font-size:10.5px; margin-top:8px; line-height:1.35; } #wfpanel .x { float:right; background:none; border:0; color:var(--dim); font-size:18px; cursor:pointer; margin:-4px -2px 0 0; }`;
    document.head.appendChild(css);
    const wb = document.createElement('button'); wb.id = 'wfbtn'; wb.type = 'button'; wb.setAttribute('aria-expanded', 'false');
    wb.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg><span>' + (WF.title || 'Find your site') + '</span>';
    const panel = document.createElement('div'); panel.id = 'wfpanel'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', WF.title || 'Find your site');
    panel.innerHTML = `<button class="x" type="button" aria-label="Close">×</button><div style="font-weight:700;font-size:14px;margin-bottom:8px">${WF.title || 'Find your site'}</div>
      <div class="row"><input type="text" inputmode="numeric" pattern="[0-9]*" placeholder="${WF.unit || 'Site'} number, e.g. 27" aria-label="${WF.unit || 'Site'} number"><button class="show" type="button">Show</button></div>
      <div class="msg" aria-live="polite"></div><div class="lab">Walk to</div><div class="gos">${WF.go.map(g => `<button class="wfgo" type="button" data-id="${g.id}">${g.label}</button>`).join('')}</div>
      ${WF.note ? `<div class="note">${WF.note}</div>` : ''}`;
    const sunB = document.getElementById('sunbtn'); (sunB || document.body).after ? (sunB || tb || document.body).after(wb) : document.body.appendChild(wb); wb.after(panel);
    const inp = panel.querySelector('input'), msg = panel.querySelector('.msg'), nums = INFO.padNo;
    const lo = Math.min(...nums), hi = Math.max(...nums);
    const showSite = () => { const n = parseInt(inp.value, 10), i = nums.indexOf(n); if (i < 0) { msg.textContent = `${WF.unit || 'Site'}s run from ${lo} to ${hi}.`; return; } msg.textContent = ''; site = i; draw(); tuck(); NV.beacon && NV.beacon('tap', 'site'); };
    panel.querySelector('.show').onclick = showSite; inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { showSite(); inp.blur(); } });
    panel.querySelectorAll('.wfgo').forEach(b => b.onclick = () => { dest = WF.go.find(g => g.id === b.dataset.id); panel.querySelectorAll('.wfgo').forEach(x => x.classList.toggle('on', x === b)); if (inp.value && site == null) { const i = nums.indexOf(parseInt(inp.value, 10)); if (i >= 0) site = i; } draw(); tuck(); NV.beacon && NV.beacon('tap', 'walk:' + dest.id); });
    const openP = (on) => { panel.classList.toggle('on', on); wb.classList.toggle('on', on); wb.setAttribute('aria-expanded', on); if (!on) clear(); };
    // on a phone the panel tucks away after a choice so the route shows; the button brings it back
    const tuck = () => { if (innerWidth < 760) { panel.classList.remove('on'); wb.setAttribute('aria-expanded', 'false'); } };
    wb.onclick = () => { const hn = document.getElementById('hint'); if (hn) hn.style.opacity = 0; if (!panel.classList.contains('on') && g0.visible) { panel.classList.add('on'); wb.setAttribute('aria-expanded', 'true'); } else openP(!panel.classList.contains('on')); }; panel.querySelector('.x').onclick = () => openP(false);
    window.__site = (n, go) => { openP(true); inp.value = n; showSite(); if (go) panel.querySelector(`.wfgo[data-id="${go}"]`)?.click(); };
  }

  // ---------- each frame ----------
  let t = 0;
  function tick(dt, state = {}) {
    t += dt; const grow = !!state.growOn, sel = state.sel;
    wfTick(dt);
    moveAll(dt, t);
    bearTick(dt, t);
    // the mower and its pelican leave the lawn while the Room to grow idea plays on it
    if (mower) { mower.show(!grow); pelSit.ims.forEach(im => im.visible = true); if (grow) { pelSit.set(0, 0, PY, 0, 0, 1e-4); } }
    still.forEach((s, i) => people.set(s.k, s.at[0], s.y, s.at[1], (s.ry || 0) + (reduced ? 0 : Math.sin(t * 0.4 + i * 2) * 0.35)));
    if (L.swim) swim.forEach((k, i) => { const a = t * 0.18 * TS + i * Math.PI, c = L.swim.c; people.set(k, c[0] + Math.cos(a) * L.swim.rx, L.swim.y - 1.75 + Math.sin(t * 2 + i) * 0.05, c[1] + Math.sin(a) * L.swim.rz, -a); });
    if (L.splash) kids.forEach((k, i) => { const a = t * 0.5 * TS * (i ? -1 : 1) + i * 2.4, c = L.splash.c, r = L.splash.r * (0.7 + 0.3 * Math.sin(t * 0.7 + i)); people.set(k, c[0] + Math.cos(a) * r, L.splash.y + Math.abs(Math.sin(t * 9 + i)) * 0.15, c[1] + Math.sin(a) * r, i ? -a : -a + Math.PI, 0.62); });
    if (pels) (L.pelicans || []).forEach((p, i) => { const a = (reduced ? 0 : t) * 0.11 * TS + (p.t0 || 0) + i * 2, c = p.c; pels.set(i, c[0] + Math.cos(a) * p.r, p.y + Math.sin(t * 0.5 + i) * 1.2, c[1] + Math.sin(a) * p.r, -a, 1.6, 0.32); });
    [carts, people, dogs, mower, pelSit, pels, cars].forEach(I => I && I.done());
    if (!reduced) { swayU.value = t; for (const w of waterTex) { w.t.offset.x = t * 0.018; w.t.offset.y = t * 0.011; w.m.normalScale.copy(w.n0).multiplyScalar(0.85 + 0.15 * Math.sin(t * 0.8)); } tickSurf(t); }
    const want = dusk ? 1 : 0; if (dk !== want || dusk) { dk = reduced ? want : dk + Math.sign(want - dk) * Math.min(Math.abs(want - dk), dt / 2.4); applyDusk(dk, (m) => !!sel && sel.parts.includes(m.userData.p)); }
  }
  return { fx: FX, tick, dusk: () => dk };
}
