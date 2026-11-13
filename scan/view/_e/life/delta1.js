// Route 66 Delta Motel and RV Park life layer (rebuilt 11-11-2026 after Adam's notes: people zoomed and jumped, a caravan looped through the others,
// nothing funny happened, the fire pit was "three little circles"). Built on life1 (cars, the Sunset switch, the Room to grow build).
// People: real bodies with legs and arms that swing in step (one step = 0.75 m, so feet never slide), walking at 1.25 m/s on routes that the
// check script (Build/qc_paths.py) proves clear of every building, rig, lamp and tree. They stop and turn round on the spot at the ends.
// The motorhome: comes in off Route 66, down the lane, reverses into the empty pitch, stays, then drives out and away. Never through anything.
// The joke: a tumbleweed rolls along the frontage and stops at the office door. The manager comes out with a broom and sweeps it away. A gust
// blows it straight back to his feet. He throws his arms up and goes back inside.
// Also: semis on I-40, the pickup that stops to stare at the Delta sign, the guitar photo on the corner, the neon flicker at sunset.
// Room to grow (fx type deltaGrow): life1's lane and 22 pads (glow turned down) plus 7 tiny homes and a real fire pit courtyard: flagstones,
// a stone fire ring with flames and embers, Adirondack chairs with guests, string lights on posts, and one guest whose marshmallow keeps catching fire.
// It moves in the web viewer only. The AR file stays a still model.
let THREE;

export async function init(X) {
  THREE = X.THREE;
  const v = new URL(import.meta.url).searchParams.get('l1');
  const base = await (await import('./life1.js' + (v ? '?v=' + v : ''))).init(X);
  const { model, part, MATS, INFO, SC, GROW, NV, camera } = X; const GM = X.GLOWMATS || [];
  const reduced = !!NV.reduced, CFG = SC.life || {}, LAND = INFO.land ?? 0.3, PY = (INFO.protoAt || [0, -8, 0])[1], DL = (INFO.life || {}).delta || {};
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), ease = (k) => { k = clamp(k); return k * k * (3 - 2 * k); };
  const back = (k) => { if (k <= 0) return 0; if (k >= 1) return 1; const c = 1.7, x = k - 1; return 1 + (c + 1) * x * x * x + c * x * x; };
  const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  const root = new THREE.Group(); root.name = 'delta_life'; model.add(root);
  const dusk = () => (base.dusk ? base.dusk() : 0);

  // ---------- instanced copies of a hidden piece of the model ----------
  function inst(name, n, parent) {
    const p = part[name]; if (!p || !n) return null; const meshes = []; p.traverse(o => { if (o.isMesh) meshes.push(o); });
    const ims = meshes.map(o => { o.updateMatrix(); const g = o.geometry.clone(); g.applyMatrix4(o.matrix); g.translate(0, -PY, 0);
      const im = new THREE.InstancedMesh(g, o.material, n); im.castShadow = true; im.frustumCulled = false; (parent || root).add(im); return im; });
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(0, 0, 0, 'YXZ'), pv = new THREE.Vector3(), sv = new THREE.Vector3();
    const I = { ims, set(i, x, y, z, ry = 0, s = 1, rz = 0, rx = 0) { e.set(rx, ry, rz); q.setFromEuler(e); m4.compose(pv.set(x, y, z), q, sv.setScalar(Math.max(s, 1e-4))); for (const im of ims) im.setMatrixAt(i, m4); },
      done() { for (const im of ims) im.instanceMatrix.needsUpdate = true; } };
    for (let i = 0; i < n; i++) I.set(i, 0, PY, 0, 0, 1e-4); I.done(); return I;
  }
  function path(pts) { const P = pts.map(p => ({ x: p[0], z: p[1] })), cum = [0]; for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i].x - P[i - 1].x, P[i].z - P[i - 1].z));
    const len = cum[cum.length - 1] || 1;
    return { len, at(d, o) { d = clamp(d, 0, len); let i = 1; while (i < cum.length - 1 && cum[i] < d) i++; const a = P[i - 1], b = P[i], t = clamp((d - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1));
      o.x = a.x + (b.x - a.x) * t; o.z = a.z + (b.z - a.z) * t; const l = Math.hypot(b.x - a.x, b.z - a.z) || 1; o.dx = (b.x - a.x) / l; o.dz = (b.z - a.z) / l; return o; } }; }
  const angTo = (a, b, k) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return a + d * k; };
  const angGap = (a, b) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return Math.abs(d); };
  const tv = new THREE.Vector3();
  const mkTag = () => { const el = document.createElement('div'); el.className = 'tag'; el.style.zIndex = 3; el.style.display = 'none'; (document.getElementById('tags') || document.body).appendChild(el); return el; };
  function tagTo(el, x, y, z, text) { tv.set(x, y, z); model.localToWorld(tv); tv.project(camera); if (tv.z > 1) { el.style.display = 'none'; return; }
    if (el.textContent !== text) el.textContent = text; el.style.display = 'block'; const hw = el.offsetWidth / 2 + 8, sx = Math.min(innerWidth - hw, Math.max(hw, (tv.x * 0.5 + 0.5) * innerWidth));
    el.style.transform = `translate(${sx}px, ${Math.max(120, (-tv.y * 0.5 + 0.5) * innerHeight - 8)}px) translate(-50%, -100%)`; }

  // ---------- people with real joints (instanced: torso, head, hair, two legs, two arms, two shoes) ----------
  // Facing +z. Hip 0.88 m, legs 0.86 m, so a leg swung by angle a lifts the hip by 0.86 (1 - cos a): the body drops a little mid-stride, feet stay down.
  const SKIN = ['#d9a582', '#a8724e', '#f0c8a4', '#7a4a32', '#c58c64'], HAIR = ['#2a1c14', '#6a4426', '#d8c08a', '#1a1a1a', '#9a9a9a'];
  const HIP = 0.88, LEG = 0.86;
  function mkRig(n, parent) {
    const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.78 });
    const mk = (geo, c) => { const im = new THREE.InstancedMesh(geo, mat, c); im.castShadow = true; im.frustumCulled = false; const w = new THREE.Color(1, 1, 1); for (let i = 0; i < c; i++) im.setColorAt(i, w); parent.add(im); return im; };
    const P = { torso: mk(new THREE.BoxGeometry(0.4, 0.56, 0.23).translate(0, 0.28, 0), n), head: mk(new THREE.SphereGeometry(0.115, 12, 9), n),
      hair: mk(new THREE.SphereGeometry(0.122, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.5).translate(0, 0.012, -0.01), n),
      leg: mk(new THREE.BoxGeometry(0.15, LEG, 0.17).translate(0, -LEG / 2, 0), 2 * n), shoe: mk(new THREE.BoxGeometry(0.14, 0.08, 0.27).translate(0, -LEG + 0.04, 0.05), 2 * n),
      arm: mk(new THREE.BoxGeometry(0.095, 0.6, 0.1).translate(0, -0.3, 0), 2 * n) };
    const c = new THREE.Color(), mB = new THREE.Matrix4(), mT = new THREE.Matrix4(), mX = new THREE.Matrix4(), mH = new THREE.Matrix4(), mS = new THREE.Matrix4(), zero = new THREE.Matrix4().makeScale(1e-4, 1e-4, 1e-4);
    const R = { n,
      dress(i, d) { P.torso.setColorAt(i, c.set(d.shirt)); P.head.setColorAt(i, c.set(d.skin)); P.hair.setColorAt(i, c.set(d.hair));
        for (const s of [0, 1]) { P.leg.setColorAt(2 * i + s, c.set(d.pants)); P.arm.setColorAt(2 * i + s, c.set(d.sleeve || d.shirt)); P.shoe.setColorAt(2 * i + s, c.set(d.shoe || '#2a2420')); }
        for (const k in P) P[k].instanceColor.needsUpdate = true; },
      hide(i) { P.torso.setMatrixAt(i, zero); P.head.setMatrixAt(i, zero); P.hair.setMatrixAt(i, zero); for (const s of [0, 1]) { P.leg.setMatrixAt(2 * i + s, zero); P.shoe.setMatrixAt(2 * i + s, zero); P.arm.setMatrixAt(2 * i + s, zero); } },
      // q: { x, z, yaw, y, s, lean, legL, legR, armL, armR, armLz, armRz, head, hipY }
      pose(i, q) { const s = q.s ?? 1; if (s < 0.01) { R.hide(i); return; }
        mB.makeRotationY(q.yaw || 0).setPosition(q.x, LAND + 0.06 + (q.y || 0), q.z); if (s !== 1) mB.multiply(mS.makeScale(s, s, s));
        const hy = q.hipY ?? HIP;
        mT.copy(mB).multiply(mX.makeTranslation(0, hy, 0)).multiply(mH.makeRotationX(q.lean || 0)); P.torso.setMatrixAt(i, mT);
        const tor = mT.clone();
        mT.copy(tor).multiply(mX.makeTranslation(0, 0.7, 0)).multiply(mH.makeRotationY(q.head || 0)); P.head.setMatrixAt(i, mT); P.hair.setMatrixAt(i, mT);
        [[-1, q.legL || 0], [1, q.legR || 0]].forEach(([sd, a], k) => { mT.copy(mB).multiply(mX.makeTranslation(sd * 0.1, hy, 0)).multiply(mH.makeRotationX(a)); P.leg.setMatrixAt(2 * i + k, mT); P.shoe.setMatrixAt(2 * i + k, mT); });
        [[-1, q.armL || 0, q.armLz ?? 0.08], [1, q.armR || 0, q.armRz ?? 0.08]].forEach(([sd, a, z], k) => { mT.copy(tor).multiply(mX.makeTranslation(sd * 0.255, 0.52, 0)).multiply(mH.makeRotationZ(-sd * z)).multiply(mS.makeRotationX(a)); P.arm.setMatrixAt(2 * i + k, mT); }); },
      done() { for (const k in P) P[k].instanceMatrix.needsUpdate = true; } };
    for (let i = 0; i < n; i++) R.hide(i); R.done(); return R;
  }
  // a walking pose from the distance walked: one full cycle = 1.5 m (two 0.75 m steps), swing 0.45 rad, arms opposite
  const walkQ = (q, ph, amp) => { const a = 0.45 * amp * Math.sin(ph); q.legL = -a; q.legR = a; q.armL = 0.7 * a; q.armR = -0.7 * a; q.y = -LEG * (1 - Math.cos(Math.abs(a))); q.lean = 0.04 * amp; return q; };
  const CYCLE = 1.5, WALK = 1.25;
  const dress = (d) => ({ skin: SKIN[Math.floor(rnd() * SKIN.length)], hair: HAIR[Math.floor(rnd() * HAIR.length)], ...d });

  // ---------- the walkers on their checked routes ----------
  const WK = DL.walks || [], ST = DL.stills || [];
  const nPeople = WK.length + WK.filter(w => w.pair).length + ST.length + 2;   // + the manager + the camper from the motorhome
  const RIG = mkRig(Math.max(1, nPeople), root); let ri = 0;
  const dogI = inst('proto_dog', WK.filter(w => w.dog).length);
  let di = 0;
  const walkers = WK.map((w) => { const p = path(w.mode === 'loop' ? [...w.pts, w.pts[0]] : w.pts), me = ri++; RIG.dress(me, dress({ shirt: w.shirt, pants: w.pants }));
    let pr = -1; if (w.pair) { pr = ri++; RIG.dress(pr, dress({ shirt: w.pair.shirt, pants: w.pair.pants })); }
    return { w, p, me, pr, dog: w.dog ? di++ : -1, d: rnd() * p.len, dir: 1, wait: 0, ph: rnd() * 6, amp: 1, yaw: null, sp: WALK * (0.92 + rnd() * 0.16) }; });
  const stills = ST.map(s => { const me = ri++; RIG.dress(me, dress({ shirt: s.shirt, pants: s.pants })); return { s, me, t0: rnd() * 8 }; });
  const MAN = ri++, CAMPER = ri++;
  RIG.dress(MAN, { shirt: '#3a6ea8', pants: '#5a4630', skin: '#c58c64', hair: '#9a9a9a', sleeve: '#3a6ea8' });
  RIG.dress(CAMPER, dress({ shirt: '#e8a23a', pants: '#2b3440' }));
  const o = {}, o2 = {}, q = {};
  function walkTick(dt) {
    for (const k of walkers) { const { w, p } = k;
      let moving = true;
      if (k.wait > 0) { k.wait -= dt; moving = false; }
      else { const step = k.sp * dt; k.d += k.dir * step; k.ph += step / CYCLE * Math.PI * 2;
        if (w.mode === 'loop') k.d = (k.d + p.len) % p.len;
        else if (k.d >= p.len || k.d <= 0) { k.d = clamp(k.d, 0, p.len); k.dir = -k.dir; k.wait = (w.pause || [3, 3])[k.dir < 0 ? 0 : 1]; moving = false; } }
      p.at(k.d, o); const want = Math.atan2(o.dx * k.dir, o.dz * k.dir);
      if (k.yaw == null) k.yaw = want;
      // turning on the spot at the ends: small steps while the body comes round
      const gap = angGap(k.yaw, want), turnK = Math.min(1, dt * (moving ? 6 : 3.2)), y0 = k.yaw; k.yaw = angTo(k.yaw, want, turnK);
      if (!moving && gap > 0.05) k.ph += Math.abs(k.yaw - y0) * 1.2;
      k.amp += ((moving || gap > 0.05 ? 1 : 0) - k.amp) * Math.min(1, dt * 6);
      if (!moving && gap <= 0.05) k.ph += (Math.round(k.ph / Math.PI) * Math.PI - k.ph) * Math.min(1, dt * 5);   // settle the feet together
      const Q = walkQ({ x: o.x, z: o.z, yaw: k.yaw, head: moving ? 0 : Math.sin(k.ph * 0.3) * 0.2 }, k.ph, k.amp * (moving ? 1 : 0.6)); RIG.pose(k.me, Q);
      if (k.pr >= 0) { const off = w.pair.off; RIG.pose(k.pr, walkQ({ x: o.x - o.dz * off, z: o.z + o.dx * off, yaw: k.yaw, head: Math.sin(k.ph * 0.25) * 0.15 - 0.1 }, k.ph + 0.9, k.amp * (moving ? 1 : 0.6))); }
      if (k.dog >= 0 && dogI) { // the dog trots a little behind and to the side, its own quicker gait
        p.at(w.mode === 'loop' ? ((k.d - 1.3 * k.dir) % p.len + p.len) % p.len : clamp(k.d - 1.3 * k.dir, 0, p.len), o2); const dyw = Math.atan2(o2.dx * k.dir, o2.dz * k.dir);
        dogI.set(k.dog, o2.x - o2.dz * 0.7, LAND + 0.06 + (moving ? 0.035 * Math.abs(Math.sin(k.ph * 2.2)) : 0), o2.z + o2.dx * 0.7, dyw, 1, 0, moving ? Math.sin(k.ph * 2.2) * 0.06 : 0); } }
    if (dogI) dogI.done();
  }
  let stT = 0;
  function stillTick(dt) { stT += dt;
    for (const k of stills) { const t = reduced ? 0 : stT + k.t0, s = k.s; const Q = { x: s.at[0], z: s.at[1], yaw: s.ry, head: Math.sin(t * 0.4) * 0.35, lean: 0.02 * Math.sin(t * 0.7), armL: 0.05 * Math.sin(t * 0.9), armR: -0.05 * Math.sin(t * 0.9) };
      if (s.wave) { const c = t % 9; if (c > 6 && c < 8.4) { const u = ease((c - 6) / 0.35) * ease((8.4 - c) / 0.35); Q.armR = -2.7 * u; Q.armRz = 0.08 + u * (0.25 + 0.3 * Math.sin(c * 11)); Q.head = 0.3 * u; } }
      RIG.pose(k.me, Q); } }

  // ---------- the motorhome that arrives, reverses into the empty pitch, stays, and leaves ----------
  const RD = null /* motorhome taken out (Adam, 11-11-2026: it drove through buildings and caravans) */, rvI = RD ? inst('proto_rv', 1) : null;
  const rvP = RD ? { inn: path(RD.inn), back: path(RD.back), out: path(RD.out) } : null;
  let rvS = 'wait', rvT = 0, rvD = 0, rvYaw = null, rvV = 0;
  const PAD = RD ? RD.back[RD.back.length - 1] : [0, 0];
  function rvTick(dt, growOn) { if (!rvI) return; rvT += dt;
    if (growOn && (rvS === 'inn' || rvS === 'out' || rvS === 'settle' || rvS === 'back')) { rvS = 'stay'; rvT = 0; rvYaw = null; }   // keep the lane clear for the Room to grow motorhomes
    let P, x, z, want, f = 1, rev = false;
    if (rvS === 'wait') { rvI.set(0, 0, PY, 0, 0, 1e-4); rvI.done(); RIG.hide(CAMPER); if (rvT > 6) { rvS = 'inn'; rvT = 0; rvD = 0; rvYaw = null; } return; }
    if (rvS === 'inn') { P = rvP.inn; const rem = P.len - rvD; rvV = clamp(1.3 + 0.3 * rem, 1.3, 12); rvD += rvV * dt; if (rvD >= P.len) { rvD = P.len; rvS = 'settle'; rvT = 0; } f = clamp(rvD / 15); }
    else if (rvS === 'settle') { P = rvP.inn; rvD = P.len; if (rvT > 1.4) { rvS = 'back'; rvT = 0; rvD = 0; } }
    else if (rvS === 'back') { P = rvP.back; rev = true; rvV = clamp(0.5 + 0.6 * Math.min(rvD, P.len - rvD), 0.5, 1.3); rvD += rvV * dt; if (rvD >= P.len) { rvD = P.len; rvS = 'stay'; rvT = 0; } }
    else if (rvS === 'stay') { P = rvP.back; rev = true; rvD = P.len; if (rvT > 42) { rvS = 'out'; rvT = 0; rvD = 0; } }
    else { P = rvP.out; rvV = clamp(1.0 + 0.22 * rvD, 1.0, 12); rvD += rvV * dt; const rem = P.len - rvD; f = clamp(rem / 15); if (rem <= 0) { rvS = 'wait'; rvT = 0; } }
    P.at(rvD, o); want = rev ? Math.atan2(-o.dx, -o.dz) : Math.atan2(o.dx, o.dz);
    if (rvYaw == null) rvYaw = want; else rvYaw = angTo(rvYaw, want, Math.min(1, dt * (0.8 + rvV * 0.6)));
    rvI.set(0, o.x, LAND, o.z, rvYaw, Math.max(1e-4, f)); rvI.done();
    // the camper steps out once it is parked, has a big stretch, then looks round the place
    if (rvS === 'stay' && rvT > 3 && rvT < 40) { const t = rvT - 3, cs = Math.cos(rvYaw), sn = Math.sin(rvYaw), side = 2.1, fw = 1.6;
      const cx = o.x + cs * side + sn * fw, cz = o.z - sn * side + cs * fw, st = ease(t / 0.8) * ease((37 - t) / 0.8);
      const up = t > 1.2 && t < 4.2 ? ease((t - 1.2) / 0.5) * ease((4.2 - t) / 0.5) : 0;
      RIG.pose(CAMPER, { x: cx, z: cz, yaw: rvYaw + Math.PI / 2 + Math.sin(t * 0.3) * 0.6 * (t > 5 ? 1 : 0), s: st, armL: -2.9 * up, armR: -2.9 * up, armLz: 0.08 + 0.15 * up, armRz: 0.08 + 0.15 * up, lean: -0.08 * up, y: 0.03 * up, head: t > 5 ? Math.sin(t * 0.5) * 0.4 : 0 }); }
    else RIG.hide(CAMPER);
  }

  // ---------- the joke: the tumbleweed, the manager and his broom ----------
  const TB = DL.tumble, OF = DL.office;
  const tw = new THREE.Group(); { const m = new THREE.MeshStandardMaterial({ color: '#a8875a', roughness: 1 });
    for (let i = 0; i < 7; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.36 + rnd() * 0.08, 0.022, 4, 20), m); r.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); r.castShadow = true; tw.add(r); }
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 1), new THREE.MeshStandardMaterial({ color: '#8a6c44', roughness: 1, wireframe: true })); tw.add(core); }
  const broom = new THREE.Group(), broomP = new THREE.Group(); { broom.add(broomP);
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.35, 6), new THREE.MeshStandardMaterial({ color: '#b0884f', roughness: 0.8 }));
    const bristle = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.24, 0.08), new THREE.MeshStandardMaterial({ color: '#d9b45a', roughness: 1 }));
    // held at the hands (0.95 m up, 0.32 m in front), the head on the ground a metre in front
    const a = new THREE.Vector3(0, 0, 0), b = new THREE.Vector3(0, -0.88, 0.62), mid = a.clone().lerp(b, 0.5); stick.position.copy(mid); stick.lookAt(b.clone().add(new THREE.Vector3(0, 0, 0))); stick.rotateX(Math.PI / 2);
    stick.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), a.clone().sub(b).normalize()); bristle.position.set(0, -0.92, 0.66); bristle.castShadow = stick.castShadow = true; broomP.add(stick, bristle); broomP.position.set(0.08, 0.95, 0.32); }
  if (TB && OF) root.add(tw, broom); tw.visible = broom.visible = false;
  const tIn = TB ? path(TB.inn) : null, tOff = TB ? path(TB.off) : null;
  let jT = 0, roll = 0;
  const JOKE = 42;
  function jokeTick(dt) { if (!tIn || !OF) return; jT = (jT + dt) % JOKE; const t = reduced ? 9 : jT;
    // where the tumbleweed is: in along the frontage (0..8), rests (8..12.5), swept off and blown away (12.5..19), blown straight back (20..25.5), rests, final gust (33..40)
    let P = tIn, d = tIn.len, fade = 1, hop = 0;
    if (t < 8) { const u = t / 8; d = tIn.len * clamp(u - 0.035 * Math.sin(u * Math.PI * 6)); fade = clamp(d / 4); hop = 1 - u * 0.6; }
    else if (t < 12.5) { d = tIn.len; }
    else if (t < 19.5) { P = tOff; const u = (t - 12.5) / 7; d = tOff.len * u * u; hop = 0.8; fade = clamp((tOff.len - d) / 6); }
    else if (t < 20) { P = tOff; d = tOff.len; fade = 0; }
    else if (t < 25.5) { P = tOff; const u = (t - 20) / 5.5; d = tOff.len * (1 - ease(u)); hop = 0.9; fade = clamp((tOff.len - d) / 6); }
    else if (t < 33) { P = tOff; d = 0; }
    else if (t < 40) { P = tOff; const u = (t - 33) / 7; d = tOff.len * u * u; hop = 0.8; fade = clamp((tOff.len - d) / 6); }
    else { fade = 0; }
    P.at(d, o); const prev = tw.userData.d ?? d; roll += Math.abs(d - prev) / 0.42; tw.userData.d = d;
    tw.visible = fade > 0.01; tw.scale.setScalar(Math.max(1e-3, fade));
    tw.position.set(o.x, LAND + 0.42 + hop * 0.3 * Math.abs(Math.sin(d * 1.1)), o.z); tw.rotation.set(0, Math.atan2(o.dx, o.dz), 0); tw.rotateX(roll);
    // the manager: out of the door (8.6..10.4), sweeps (10.4..13), hands on hips watching (13..20), arms thrown up when it comes back (25.5..27.8), back inside (28.5..30.4)
    const D = OF.door, Qp = OF.out, yawOut = Math.atan2(Qp[0] - D[0], Qp[1] - D[1]); let mq = null, sweep = 0;
    const walkBetween = (A, B, u, yaw) => { const x = A[0] + (B[0] - A[0]) * ease(u), z = A[1] + (B[1] - A[1]) * ease(u), dist = Math.hypot(B[0] - A[0], B[1] - A[1]) * ease(u);
      return walkQ({ x, z, yaw }, dist / CYCLE * Math.PI * 2, u > 0 && u < 1 ? 1 : 0); };
    if (t > 8.6 && t < 10.4) mq = walkBetween(D, Qp, (t - 8.6) / 1.8, yawOut);
    else if (t >= 10.4 && t < 28.5) { mq = { x: Qp[0], z: Qp[1], yaw: yawOut };
      const lookT = Math.atan2(tw.position.x - Qp[0], tw.position.z - Qp[1]);
      if (t < 13) { sweep = Math.sin((t - 10.4) * 7) * 0.55; mq.armL = -0.75; mq.armR = -0.55; mq.lean = 0.18; mq.yaw = yawOut + sweep * 0.3; }
      else if (t < 25.5) { mq.armL = 0.25; mq.armR = 0.25; mq.armLz = 0.75; mq.armRz = 0.75; mq.head = clamp(angTo(0, lookT - yawOut, 1), -1.2, 1.2); }
      else if (t < 27.8) { const sh = Math.sin((t - 25.5) * 14) * 0.25; mq.armL = -2.8 + sh; mq.armR = -2.8 - sh; mq.armLz = 0.35; mq.armRz = 0.35; mq.lean = -0.1; mq.head = Math.sin((t - 25.5) * 5) * 0.35; }
      else { mq.yaw = angTo(yawOut, yawOut + Math.PI, ease((t - 27.8) / 0.7)); } }
    else if (t >= 28.5 && t < 30.4) mq = walkBetween(Qp, D, (t - 28.5) / 1.9, yawOut + Math.PI);
    if (mq) { const sIn = t < 10.4 ? clamp((t - 8.6) / 0.25) : clamp((30.4 - t) / 0.25); mq.s = Math.min(mq.s ?? 1, sIn); RIG.pose(MAN, mq);
      broom.visible = t < 28.5 && mq.s > 0.5; broom.position.set(mq.x, LAND + 0.06 + (mq.y || 0), mq.z); broom.rotation.set(0, mq.yaw, 0); broomP.rotation.set(t >= 13 && t < 28.5 ? -0.5 : 0, sweep, 0);
      if (t >= 13 && t < 28.5) broomP.position.set(0.32, 0.95, 0.12); else broomP.position.set(0.08, 0.95, 0.32); }
    else { RIG.hide(MAN); broom.visible = false; } }

  // ---------- the neon: dark tubes by day (the printed face shows), a flicker-on at dusk, the bulbs chase ----------
  const NEONC = { neon_delta: '#ffd23a', neon_shield: '#f4f7ff', neon_car: '#bff4ff', neon_motel: '#ff4a2a', neon_vacancy: '#ff3a5a', neon_stars: '#ffc23a', neon_office: '#ff6a3a' };
  const HIDE_DAY = new Set(['neon_delta', 'neon_shield', 'neon_car']);
  const neon = MATS.filter(m => m.name && m.name.startsWith('neon_')).map((m, i) => ({ m, name: m.name, c: new THREE.Color(m.name.startsWith('neon_bulb') ? '#ffd27a' : (NEONC[m.name] || m.userData.neon || '#ffffff')),
    bulb: m.name.startsWith('neon_bulb') ? +m.name.slice(-1) : -1, on: 0.42 + i * 0.07 }));
  const flick = (k, at) => { const x = (k - at) / 0.22; if (x <= 0) return 0; if (x >= 1) return 1; return (x < 0.18 || (x > 0.34 && x < 0.5) || x > 0.66) ? 1 : 0.12; };
  let nt = 0;
  function neonTick(dt, sel) { nt += dt; const k = dusk();
    for (const n of neon) { let b;
      if (n.bulb >= 0) { const step = Math.floor(nt * 5) % 3; b = ease((k - 0.45) / 0.3) * (reduced ? 1 : (step === n.bulb ? 1.7 : 0.45)); }
      else b = reduced ? (k > 0.5 ? 1 : 0) : flick(k, n.on);
      const lvl = n.bulb >= 0 ? 2.0 : n.name === 'neon_shield' || n.name === 'neon_car' || n.name === 'neon_delta' ? 1.5 : 2.2;
      if (!n.m.userData.e0) n.m.userData.e0 = new THREE.Color(0, 0, 0);
      n.m.userData.e0.copy(n.c).multiplyScalar(b * lvl);
      if (!(sel && sel.parts && sel.parts.includes(n.m.userData.p))) { n.m.emissive.copy(n.m.userData.e0); n.m.emissiveIntensity = 1; }
      if (HIDE_DAY.has(n.name)) n.m.visible = k > 0.4; } }

  // ---------- semis on I-40 (real road speed, 25 m/s) ----------
  const semiL = (DL.semis || []).filter(l => l.pts && l.pts.length > 1), nSemi = semiL.reduce((a, l) => a + (l.n || 1), 0), semiI = inst('proto_semi', nSemi), semis = [];
  { let k = 0; semiL.forEach(l => { const p = path(l.pts); for (let j = 0; j < (l.n || 1); j++) semis.push({ i: k++, p, sp: l.speed || 24, d: ((l.t0 || 0) + j / (l.n || 1)) * p.len }); }); }
  function semiTick(dt) { if (!semiI) return; for (const s of semis) { if (!reduced) s.d = (s.d + s.sp * dt) % s.p.len; s.p.at(s.d, o);
    const f = clamp(Math.min(s.d, s.p.len - s.d) / 25); semiI.set(s.i, o.x, LAND, o.z, Math.atan2(o.dx, o.dz), f); } semiI.done(); }

  // ---------- the pickup that slows down to admire the sign ----------
  const PK = DL.pickup && DL.pickup.path && DL.pickup.path.length > 1 ? DL.pickup : null, pkP = PK ? path(PK.path) : null;
  const pkI = inst('proto_pickup', PK ? 1 : 0), drI = inst('proto_driver', PK ? 1 : 0), SIGN = DL.signTop || DL.sign || [28, 11, -49];
  const CAB = (PK && PK.cab) || [0.4, 1.05, -0.3], SD = PK ? (PK.signD ?? pkP.len / 2) : 0;
  let pkD = 0, pkStop = 0, pkLook = 0, pkH = null;
  function pickupTick(dt) { if (!pkP) return;
    const near = pkD - SD; let sp = 13;
    if (near > -60 && near < 0) sp = 13 - 11.5 * ease((near + 60) / 50);
    else if (near >= 0 && pkStop < 2.5) { sp = 0; pkStop += dt; }
    else if (near >= 0) sp = 1.5 + 11.5 * ease(near / 50);
    if (reduced) pkD = SD; else pkD += sp * dt;
    if (pkD > pkP.len) { pkD = 0; pkStop = 0; }
    pkP.at(pkD, o); const want = Math.atan2(o.dx, o.dz); pkH = pkH == null ? want : angTo(pkH, want, Math.min(1, dt * 3));
    const f = clamp(Math.min(pkD, pkP.len - pkD) / 20); pkI.set(0, o.x, LAND, o.z, pkH, f); pkI.done();
    const toSign = Math.atan2(SIGN[0] - o.x, SIGN[2] - o.z), lookOn = Math.abs(near) < 55 ? 1 : 0; pkLook += (lookOn - pkLook) * Math.min(1, dt * 2.5);
    const cs = Math.cos(pkH), sn = Math.sin(pkH), hx = o.x + CAB[0] * cs + CAB[2] * sn, hz = o.z - CAB[0] * sn + CAB[2] * cs;
    drI.set(0, hx, LAND + CAB[1], hz, angTo(pkH, toSign, pkLook), f); drI.done(); }

  // ---------- the guitar pose on the corner, and the friend taking the photo ----------
  const GU = DL.guitarist, PH = DL.photog, guI = inst('proto_guitarist', GU ? 1 : 0), phI = inst('proto_photog', PH ? 1 : 0);
  const flashM = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffffff').multiplyScalar(3), toneMapped: false, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const flash = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), flashM); flash.visible = false; root.add(flash);
  let gt = 0;
  function poseTick(dt) { gt += dt; const t = reduced ? 0 : gt;
    if (guI) { guI.set(0, GU.at[0], LAND, GU.at[1], GU.ry + Math.sin(t * 1.6) * 0.12, 1, Math.sin(t * 3.2) * 0.04); guI.done(); }
    if (phI) { phI.set(0, PH.at[0], LAND, PH.at[1], PH.ry, 1); phI.done();
      const c = t % 6, fk = c > 4.6 && c < 4.85 ? 1 - (c - 4.6) / 0.25 : 0; flash.visible = fk > 0.01; flashM.opacity = fk;
      const cs = Math.cos(PH.ry), sn = Math.sin(PH.ry); flash.position.set(PH.at[0] + 0.45 * sn, LAND + 1.55, PH.at[1] + 0.45 * cs); } }

  // ---------- Room to grow: life1's build (glow turned down) plus tiny homes and the fire pit courtyard ----------
  const LIGHT = new THREE.Color(CFG.light || '#fff3dc');
  const lightM = (k, extra) => { const m = new THREE.MeshBasicMaterial(Object.assign({ color: LIGHT.clone().multiplyScalar(k), toneMapped: false, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }, extra)); m.userData.gc = m.color.clone(); GM.push(m); return m; };
  const add = (m) => new THREE.MeshBasicMaterial({ color: new THREE.Color(m[0]).multiplyScalar(m[1]), toneMapped: false, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const radial = (stops) => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64); stops.forEach(([p, s]) => g.addColorStop(p, s)); x.fillStyle = g; x.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
  function flagstones() { const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'); x.fillStyle = '#7d705f'; x.fillRect(0, 0, 512, 512);
    const cols = ['#c9b393', '#bba27f', '#d4c2a2', '#b49a78', '#c4a886', '#a89074'], N = 9, cw = 512 / N;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const cx = (i + 0.5 + (rnd() - 0.5) * 0.3) * cw, cy = (j + 0.5 + (rnd() - 0.5) * 0.3) * cw; x.fillStyle = cols[Math.floor(rnd() * cols.length)]; x.beginPath();
      const k = 6 + Math.floor(rnd() * 3); for (let a = 0; a < k; a++) { const an = a / k * Math.PI * 2 + rnd() * 0.4, r = cw * (0.4 + rnd() * 0.12); x.lineTo(cx + Math.cos(an) * r, cy + Math.sin(an) * r); } x.closePath(); x.fill(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
  const growTags = [];
  const FX = Object.assign({}, base.fx);
  FX.deltaGrow = (c) => {
    const B = base.fx.build(Object.assign({ list: 'grow', rot: 'growRot', k: 1.1 }, c)), g = B.obj;
    if (B.mat && B.mat.userData.gc) { B.mat.userData.gc.multiplyScalar(0.45); B.mat.color.copy(B.mat.userData.gc); }   // Adam 11-11: "glows too bright"
    const TP = DL.tiny || [], tyI = inst('proto_tiny', TP.length, g), tgM = lightM(0.9);
    const tg = TP.map(p => { const m = new THREE.Mesh(new THREE.BoxGeometry(6.5, 4.6, 3.2).translate(0, 2.3, 0), tgM); m.position.set(p[0], LAND, p[1]); m.rotation.y = DL.tinyRot || 0; m.renderOrder = 4; m.visible = false; g.add(m); return m; });

    // the fire pit courtyard
    const CT = DL.court; const CZ = {};
    if (CT) { const [cx, cz] = CT.c, R = CT.r, cg = new THREE.Group(); cg.position.set(cx, LAND, cz); g.add(cg); CZ.g = cg;
      const stone = new THREE.MeshStandardMaterial({ color: '#9a8a74', roughness: 0.95 }), dark = new THREE.MeshStandardMaterial({ color: '#2a221c', roughness: 1 });
      CZ.pave = new THREE.Mesh(new THREE.CircleGeometry(R - 0.6, 64).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: flagstones(), roughness: 0.92 })); CZ.pave.position.y = 0.2; CZ.pave.receiveShadow = true; cg.add(CZ.pave);
      // a low stone seat wall round the edge, open toward the lane
      const wallG = new THREE.Group(); for (let a = 0; a < 40; a++) { const an = a / 40 * Math.PI * 2; if (angGap(an, -Math.PI * 0.5) < 0.3) continue;   // the opening faces the lane
        const b = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 0.55), stone); b.position.set(Math.cos(an) * (R - 0.6), 0.45, Math.sin(an) * (R - 0.6)); b.rotation.y = -an + Math.PI / 2; b.castShadow = b.receiveShadow = true; wallG.add(b); }
      cg.add(wallG); CZ.wall = wallG;
      // the fire ring: stacked stones, dark ash bed, crossed logs
      const ring = new THREE.Group(); for (let a = 0; a < 16; a++) { const an = a / 16 * Math.PI * 2, s = new THREE.Mesh(new THREE.DodecahedronGeometry(0.26, 0), stone); s.position.set(Math.cos(an) * 1.15, 0.38 + (a % 2) * 0.12, Math.sin(an) * 1.15); s.rotation.set(rnd() * 3, rnd() * 3, 0); s.scale.set(1.2, 0.8, 1); s.castShadow = true; ring.add(s); }
      const bed = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.08, 18), dark); bed.position.y = 0.3; ring.add(bed);
      const logM = new THREE.MeshStandardMaterial({ color: '#5a3a22', roughness: 1 }); for (let a = 0; a < 3; a++) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 1.3, 7), logM); l.rotation.set(Math.PI / 2 - 0.35, a * 2.1, 0); l.position.y = 0.55; ring.add(l); }
      cg.add(ring); CZ.ring = ring;
      // flames: layered additive cones that flicker, a ground glow, rising embers
      CZ.fl = [['#ff5a1a', 2.2, 0.55, 1.5], ['#ff9a2a', 2.6, 0.38, 1.2], ['#ffe08a', 3.0, 0.2, 0.8]].map(([col, k, r, h], i) => { const m = add([col, k]); const fl = []; for (let j = 0; j < 3; j++) { const cn = new THREE.Mesh(new THREE.ConeGeometry(r, h, 10, 1, true).translate(0, h / 2, 0), m); cn.position.set(Math.cos(j * 2.1) * 0.18, 0.35, Math.sin(j * 2.1) * 0.18); cn.renderOrder = 6; ring.add(cn); fl.push(cn); } return { m, fl, h }; });
      CZ.glowM = new THREE.MeshBasicMaterial({ map: radial([[0, 'rgba(255,150,60,0.9)'], [0.4, 'rgba(255,110,40,0.35)'], [1, 'rgba(255,90,30,0)']]), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
      CZ.glow = new THREE.Mesh(new THREE.PlaneGeometry(10, 10).rotateX(-Math.PI / 2), CZ.glowM); CZ.glow.position.y = 0.24; CZ.glow.renderOrder = 5; cg.add(CZ.glow);
      const NE = 60, eg = new THREE.BufferGeometry(), ep = new Float32Array(NE * 3); eg.setAttribute('position', new THREE.BufferAttribute(ep, 3));
      CZ.emM = new THREE.PointsMaterial({ color: new THREE.Color('#ffb04a').multiplyScalar(2), size: 3, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
      CZ.em = new THREE.Points(eg, CZ.emM); CZ.em.frustumCulled = false; cg.add(CZ.em); CZ.ember = Array.from({ length: NE }, () => ({ x: 0, y: 99, z: 0, vx: 0, vy: 0, vz: 0, life: 0 })); CZ.ep = ep;
      // eight Adirondack chairs round the fire, facing in
      const CHC = ['#c8352a', '#2a8a7a', '#f2c230', '#f4efe6', '#3a7fd0', '#e8743a', '#2a8a7a', '#c8352a'];
      CZ.chairs = CHC.map((col, i) => { const m = new THREE.MeshStandardMaterial({ color: col, roughness: 0.7 }), ch = new THREE.Group(), an = i / 8 * Math.PI * 2 + 0.2;
        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.07, 0.62), m); seat.position.set(0, 0.4, 0); seat.rotation.x = -0.12;
        const bk = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.85, 0.06), m); bk.position.set(0, 0.78, -0.36); bk.rotation.x = -0.38;
        const arms = [-1, 1].map(s => { const a = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.78), m); a.position.set(s * 0.42, 0.62, -0.02); return a; });
        const legs = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz]) => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 0.06), m); l.position.set(sx * 0.38, 0.3, sz * 0.26); return l; });
        ch.add(seat, bk, ...arms, ...legs); ch.traverse(o => { if (o.isMesh) o.castShadow = true; });
        const r = 3.3; ch.position.set(Math.cos(an) * r, 0.2, Math.sin(an) * r); ch.rotation.y = Math.atan2(-Math.cos(an), -Math.sin(an)); cg.add(ch); return { ch, an, r }; });
      // string lights: six posts, swags round the edge and three across, warm bulbs
      const postM = new THREE.MeshStandardMaterial({ color: '#4a3a2c', roughness: 0.9 }), wireM = new THREE.MeshBasicMaterial({ color: '#1a1612' });
      const PR = R - 1.6, NP = 6, posts = []; CZ.posts = [];
      for (let i = 0; i < NP; i++) { const an = i / NP * Math.PI * 2 + 0.26, p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 3.8, 6).translate(0, 1.9, 0), postM); p.position.set(Math.cos(an) * PR, 0.2, Math.sin(an) * PR); p.castShadow = true; cg.add(p); CZ.posts.push(p); posts.push(new THREE.Vector3(Math.cos(an) * PR, 3.95, Math.sin(an) * PR)); }
      const bulbs = [], swags = []; const sw = (a, b, sag) => { const pts = []; for (let k = 0; k <= 16; k++) { const u = k / 16, p = a.clone().lerp(b, u); p.y -= sag * 4 * u * (1 - u); pts.push(p); }
        const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.015, 3), wireM); cg.add(m); swags.push(m); const n = Math.max(4, Math.round(a.distanceTo(b) / 1.1)); for (let k = 1; k < n; k++) { const u = k / n, p = a.clone().lerp(b, u); p.y -= sag * 4 * u * (1 - u) + 0.08; bulbs.push(p); } };
      for (let i = 0; i < NP; i++) sw(posts[i], posts[(i + 1) % NP], 0.6); for (let i = 0; i < 3; i++) sw(posts[i], posts[i + 3], 1.1);
      CZ.swags = swags; CZ.bulbM = add(['#ffd59a', 2.2]); CZ.bulb = new THREE.InstancedMesh(new THREE.SphereGeometry(0.09, 8, 6), CZ.bulbM, bulbs.length); CZ.bulb.frustumCulled = false; CZ.bulb.renderOrder = 6;
      { const m4 = new THREE.Matrix4(); bulbs.forEach((p, i) => CZ.bulb.setMatrixAt(i, m4.makeTranslation(p.x, p.y, p.z))); } cg.add(CZ.bulb);
      // the guests in five of the chairs, sitting; chair 2's guest toasts a marshmallow
      CZ.rig = mkRig(5, cg); CZ.sit = [0, 2, 3, 5, 6].map((ci, k) => { CZ.rig.dress(k, dress({ shirt: ['#3a7fd0', '#e8553a', '#f4efe6', '#2f9e6a', '#7a5cd6'][k], pants: ['#2b3440', '#5a4a3a', '#2b2f36', '#3a3f47', '#2b3440'][k] })); return CZ.chairs[ci]; });
      CZ.stick = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 1.55, 4).translate(0, 0.775, 0).rotateX(Math.PI / 2 + 0.25), new THREE.MeshStandardMaterial({ color: '#8a6a4a' })); cg.add(CZ.stick);
      CZ.mallowM = new THREE.MeshStandardMaterial({ color: '#fff8ec', emissive: new THREE.Color(0, 0, 0), roughness: 0.6 }); CZ.mallow = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.07, 8), CZ.mallowM); cg.add(CZ.mallow);
      CZ.mfM = add(['#ff8a2a', 2.6]); CZ.mf = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.32, 8).translate(0, 0.16, 0), CZ.mfM); CZ.mf.renderOrder = 6; cg.add(CZ.mf);
      // a soft build-in-light ring that flashes once, then is gone (no glow left behind)
      CZ.ghM = lightM(1.1); CZ.gh = new THREE.Mesh(new THREE.TorusGeometry(R - 0.3, 0.18, 5, 64).rotateX(Math.PI / 2), CZ.ghM); CZ.gh.position.y = 0.35; cg.add(CZ.gh); }
    if (!growTags.length) growTags.push(mkTag(), mkTag());
    const T = { tiny0: 4.2, tinyGap: 0.35, tinyDur: 0.8, pave: [6.2, 7.0], ring: [6.9, 7.5], fire: 7.7, chair: 8.0, post: 8.7, lights: [9.6, 10.6], people: 10.4 };
    const v3 = new THREE.Vector3();
    return { obj: g, mat: B.mat, tick(t0, k, pulse) { B.tick(t0, k, pulse); const t = reduced ? 99 : t0, dk = dusk(), dt = 1 / 60;
      TP.forEach((p, j) => { const f = clamp((t - T.tiny0 - j * T.tinyGap) / T.tinyDur); tyI.set(j, p[0], LAND, p[1], DL.tinyRot || 0, f > 0 ? back(f) : 1e-4);
        tg[j].visible = f > 0 && f < 1; tg[j].scale.y = Math.max(0.01, f); }); if (tyI) tyI.done(); tgM.opacity = 0.3;
      if (CZ.g) { const pf = ease((t - T.pave[0]) / (T.pave[1] - T.pave[0])); CZ.pave.scale.setScalar(Math.max(1e-3, pf)); CZ.pave.visible = pf > 0;
        CZ.gh.visible = t > T.pave[0] && t < T.pave[1] + 1.2; CZ.ghM.opacity = 0.55 * Math.sin(Math.PI * clamp((t - T.pave[0]) / (T.pave[1] - T.pave[0] + 1.2))); CZ.gh.scale.setScalar(0.3 + 0.7 * pf);
        const wf = back(clamp((t - T.ring[0]) / (T.ring[1] - T.ring[0]))); CZ.wall.scale.set(1, Math.max(1e-3, wf), 1); CZ.wall.visible = wf > 0; CZ.ring.scale.setScalar(Math.max(1e-3, wf)); CZ.ring.visible = wf > 0;
        // the fire: lights with a puff, then burns and flickers; brighter at sunset
        const fk = ease((t - T.fire) / 0.5), tt = t0 * 1.0;
        CZ.fl.forEach((L, i) => { L.fl.forEach((cn, j) => { const n1 = Math.sin(tt * (9 + j * 2.3) + i * 1.7 + j) * 0.5 + Math.sin(tt * (15 + i * 3.1) + j * 2) * 0.5;
          cn.scale.set(1 + 0.12 * n1, Math.max(1e-3, fk * (0.85 + 0.3 * n1 + (t < T.fire + 0.6 ? 0.6 * (1 - (t - T.fire) / 0.6) : 0))), 1 + 0.12 * n1); cn.rotation.y = tt * 0.7 + j; }); L.m.opacity = fk * (0.55 + 0.25 * dk); });
        CZ.glowM.opacity = fk * (0.35 + 0.45 * dk) * (0.85 + 0.15 * Math.sin(tt * 11));
        // embers
        let ei = 0; for (const e of CZ.ember) { e.life -= dt; if (e.life <= 0 && fk > 0.5) { e.x = (rnd() - 0.5) * 0.8; e.z = (rnd() - 0.5) * 0.8; e.y = 0.6; e.vx = (rnd() - 0.5) * 0.4; e.vz = (rnd() - 0.5) * 0.4; e.vy = 1.0 + rnd() * 1.4; e.life = 1.2 + rnd() * 1.8; }
          if (e.life > 0) { e.x += e.vx * dt + Math.sin(tt * 3 + ei) * 0.004; e.y += e.vy * dt; e.z += e.vz * dt; } CZ.ep[ei * 3] = e.x; CZ.ep[ei * 3 + 1] = e.life > 0 ? e.y : -99; CZ.ep[ei * 3 + 2] = e.z; ei++; }
        CZ.em.geometry.attributes.position.needsUpdate = true; CZ.emM.opacity = fk * 0.9;
        CZ.chairs.forEach((c, i) => { const f = back(clamp((t - T.chair - i * 0.1) / 0.45)); c.ch.visible = f > 0; c.ch.scale.setScalar(Math.max(1e-3, f)); c.ch.position.y = 0.2 + (1 - clamp((t - T.chair - i * 0.1) / 0.45)) * 2.5; });
        CZ.posts.forEach((p, i) => { const f = ease((t - T.post - i * 0.08) / 0.5); p.scale.set(1, Math.max(1e-3, f), 1); p.visible = f > 0; });
        const lf = ease((t - T.lights[0]) / (T.lights[1] - T.lights[0])); CZ.swags.forEach(s => s.visible = lf > 0.02); CZ.bulb.visible = lf > 0.02; CZ.bulbM.opacity = lf * (0.35 + 0.65 * dk) * (0.92 + 0.08 * Math.sin(tt * 2));
        // the guests sit down one by one; one toasts a marshmallow that catches fire every 14 s, and he blows on it, waving the stick
        CZ.sit.forEach((c, i) => { const f = ease((t - T.people - i * 0.25) / 0.5); if (f <= 0) { CZ.rig.hide(i); return; } const yaw = c.ch.rotation.y, r = c.r + 0.1;
          const Q = { x: Math.cos(c.an) * r, z: Math.sin(c.an) * r, yaw, s: f, hipY: 0.46, y: 0.12 - LAND, legL: -1.0, legR: -0.94, lean: -0.22, armL: -0.35, armR: -0.35, head: Math.sin(tt * 0.5 + i * 2) * 0.25 };
          if (i === 1) { const cyc = tt % 14, burn = cyc > 9 && cyc < 12.5 ? 1 : 0, wave = burn ? Math.sin((cyc - 9) * 12) * 0.5 : 0; Q.armR = -1.1 + wave * 0.6; Q.armL = -0.4; Q.lean = burn ? 0.15 : -0.2;
            // the stick from his hand toward the fire
            const cs = Math.cos(yaw), sn = Math.sin(yaw), hx = Q.x + cs * 0.26 + sn * 0.5, hz = Q.z - sn * 0.26 + cs * 0.5; CZ.stick.position.set(hx, 0.9, hz); CZ.stick.rotation.set(0, yaw + wave * 0.6, 0);
            v3.set(0, 0, 1.5).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw + wave * 0.6);
            const tipX = hx + v3.x, tipZ = hz + v3.z, tipY = 0.9 - Math.sin(0.25) * 1.55 + (burn ? 0.15 + 0.2 * Math.abs(wave) : 0);
            CZ.mallow.position.set(tipX, tipY, tipZ); CZ.mallowM.color.set(burn ? '#3a2a1a' : '#fff8ec'); CZ.mf.position.set(tipX, tipY + 0.03, tipZ); CZ.mf.scale.setScalar(burn ? 0.8 + 0.4 * Math.sin(tt * 20) : 1e-3); CZ.mfM.opacity = burn ? 1 : 0;
            CZ.stick.visible = CZ.mallow.visible = f > 0.9; }
          CZ.rig.pose(i, Q); }); CZ.rig.done(); }
      g.userData.t = t; } };
  };

  // ---------- each frame ----------
  function tick(dt, state = {}) { base.tick(dt, state); const d = reduced ? 0 : Math.min(dt, 0.05);
    neonTick(dt, state.sel); semiTick(d); pickupTick(d); poseTick(d); walkTick(d); stillTick(d); rvTick(d, state.growOn); jokeTick(d); RIG.done();
    if (state.growOn && growTags.length) {
      const gtm = (() => { for (const ch of model.children) if (ch.userData && ch.userData.t != null && ch.visible) return ch.userData.t; return 0; })(), TP = DL.tiny || [];
      if (TP.length && gtm > 5.6) { const m = TP[3] || TP[0]; tagTo(growTags[0], m[0], 8, m[1], 'Idea: more tiny homes'); } else growTags[0].style.display = 'none';
      if (DL.court && gtm > 8.4) tagTo(growTags[1], DL.court.c[0], 6, DL.court.c[1], 'Idea: a fire pit courtyard'); else growTags[1].style.display = 'none'; }
    else growTags.forEach(el => el.style.display = 'none'); }
  return { fx: FX, tick, dusk: base.dusk };
}
