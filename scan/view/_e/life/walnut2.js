// Walnut Grove Marina life layer, library version (walnut2, 11-11-2026): the boats on the slough and the people are Model Kit library models
// (a real cruiser and houseboat, a person who really walks: people1.js). Everything else as walnut1.
// Walnut Grove Marina life layer (11-11-2026): life1 (people on the docks and the levee, a dog, pickups on Thornton Road, moving water, Sunset)
// plus the slough's own pieces.
// Always on: two cruisers passing on Snodgrass Slough with a soft wake, and the funny touch: a great blue heron riding the roof of a slow
// houseboat up and down past the docks, like a captain. Now and then it turns to inspect the marina, then faces front again.
// Room to grow (fx type wgBuild): the cleared ground outlines in light, new vine rows race across it in white light and turn green,
// a guest dock rises from the water and a cruiser glides in to tie up, then a small tasting room builds itself from the ground up and lights warm.
// Every piece is labelled an idea. It moves in the web viewer only: the AR file stays a still model.
import { initPeople } from './people1.js?v=1';
let THREE;

export async function init(X) {
  THREE = X.THREE;
  const v = new URL(import.meta.url).searchParams.get('l1');
  const base = await (await import('./life1.js' + (v ? '?v=' + v : ''))).init(X);
  const { model, part, INFO, SC, GROW, NV, camera } = X; const GM = X.GLOWMATS || [];
  const reduced = !!NV.reduced, CFG = SC.life || {}, TS = CFG.speed ?? 1.5, LAND = INFO.land ?? 0.6, WY = INFO.waterY ?? 0, PY = (INFO.protoAt || [0, -8, 0])[1];
  const WG = INFO.wg || {}, GR = WG.grow || {};
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), ease = (k) => { k = clamp(k); return k * k * (3 - 2 * k); };
  const back = (k) => { if (k <= 0) return 0; if (k >= 1) return 1; const c = 1.7, x = k - 1; return 1 + (c + 1) * x * x * x + c * x * x; };
  const root = new THREE.Group(); root.name = 'walnut_life'; model.add(root);
  const PEOPLE = initPeople(X, root);

  // ---------- instanced copies of a hidden piece (same idea as life1) ----------
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

  // ---------- a soft V wake behind each moving boat ----------
  const WAKE = (() => { const W = 64, H = 128, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d'), im = x.createImageData(W, H);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const v = j / (H - 1), u = Math.abs(i / (W - 1) - 0.5) * 2, edge = Math.exp(-Math.pow((u - v * 0.95) / 0.07, 2)), mid = Math.exp(-Math.pow(u / 0.12, 2)) * 0.5,
      a = (edge + mid) * Math.pow(1 - v, 1.3) * Math.min(1, v * 12), k = (j * W + i) * 4; im.data[k] = im.data[k + 1] = im.data[k + 2] = 255; im.data[k + 3] = Math.round(255 * Math.min(1, a)); }
    x.putImageData(im, 0, 0); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const wakeGeo = new THREE.PlaneGeometry(12, 30).rotateX(-Math.PI / 2).translate(0, 0, -15);
  const mkWake = () => { const m = new THREE.MeshBasicMaterial({ map: WAKE, transparent: true, opacity: 0.5, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
    const w = new THREE.Mesh(wakeGeo, m); w.renderOrder = 3; w.frustumCulled = false; root.add(w); return w; };

  // ---------- boats on the slough ----------
  const lanes = (WG.lanes || []).filter(l => l.pts && l.pts.length > 1), cru = inst('proto_cruiser', lanes.length), boats = [];
  lanes.forEach((l, i) => boats.push({ I: cru, i, p: path(l.pts), d: (l.t0 || 0) * 1, sp: l.speed || 6, h: null, wake: mkWake(), fade: 30, sink: 0.04 }));
  boats.forEach(b => { b.d = (lanes[b.i].t0 || 0) * b.p.len; });
  // the heron's houseboat: up the slough past the docks and back down, slowly, forever
  const hb = WG.heron && WG.heron.pts && WG.heron.pts.length > 3 ? WG.heron : null;
  const hbI = inst('proto_houseboat', hb ? 1 : 0), herI = inst('proto_heron', hb ? 1 : 0);
  let hbB = null; if (hb) { const P = [...hb.pts, hb.pts[0]]; hbB = { I: hbI, i: 0, p: path(P), sp: hb.speed || 2.4, h: null, wake: mkWake(), fade: 0, sink: 0.04, loop: true }; hbB.d = (hb.t0 || 0) * hbB.p.len; boats.push(hbB); }
  const o = {};
  function moveBoat(b, dt, t) {
    if (!reduced) b.d += b.sp * dt * TS; b.d = ((b.d % b.p.len) + b.p.len) % b.p.len;
    b.p.at(b.d, o); const want = Math.atan2(o.dx, o.dz); b.h = b.h == null || reduced ? want : angTo(b.h, want, Math.min(1, 1.6 * dt));
    const s = b.fade ? clamp(Math.min(b.d, b.p.len - b.d) / b.fade) : 1, bob = reduced ? 0 : Math.sin(t * 1.3 + b.i * 2) * 0.05, roll = reduced ? 0 : Math.sin(t * 0.9 + b.i) * 0.015;
    b.I.set(b.i, o.x, WY - b.sink + bob, o.z, b.h, s, roll); b.x = o.x; b.z = o.z; b.s = s; b.roll = roll; b.bob = bob;
    b.wake.position.set(o.x, WY + 0.06, o.z); b.wake.rotation.y = b.h; b.wake.scale.setScalar(Math.max(0.001, s)); b.wake.material.opacity = 0.42 * s * (0.85 + 0.15 * Math.sin(t * 2 + b.i));
  }
  // the heron stands at the front of the flat roof; every so often it turns to look over the marina, then faces front again
  const HER_Z = -1.5, HER_Y = 4.78; let herLook = 0, herT = 0;   // the front of the library houseboat's porch roof
  function moveHeron(t, dt) { if (!hbB) return; herT += dt;
    const cyc = herT % 14, want = reduced ? 0 : cyc > 8 && cyc < 11.5 ? 1.25 * Math.sin(Math.min(1, (cyc - 8) / 0.6) * Math.PI / 2) : 0; herLook += (want - herLook) * Math.min(1, dt * 3);
    const c = Math.cos(hbB.h), s = Math.sin(hbB.h), x = hbB.x + s * HER_Z, z = hbB.z + c * HER_Z, y = WY - hbB.sink + hbB.bob + HER_Y;
    // it rides the rocking roof with a little sway of its own, the way a captain keeps balance
    herI.set(0, x, y, z, hbB.h + herLook, 1.8, -hbB.roll * 2 + (reduced ? 0 : Math.sin(t * 1.1) * 0.04)); herI.done(); }

  // gulls: a few library gulls wheeling over the slough, banking into the turn, each on its own circle and height
  const GU = INFO.gulls, gulls = GU ? inst('proto_gull', GU.n || 3) : null;
  function moveGulls(t) { if (!gulls) return; for (let i = 0; i < (GU.n || 3); i++) { const r = GU.r * (0.6 + 0.25 * i), w = (reduced ? 0 : t) * (9 + i) / r * (i % 2 ? -1 : 1) + i * 2.1, cx = GU.c[0] + Math.sin(i * 1.7) * 30, cz = GU.c[1] + Math.cos(i * 2.3) * 30;
      const x = cx + Math.cos(w) * r, z = cz + Math.sin(w) * r, dir = i % 2 ? -1 : 1, h = Math.atan2(-Math.sin(w) * dir, Math.cos(w) * dir);
      gulls.set(i, x, GU.y + i * 5 + Math.sin(t * 0.5 + i) * 2, z, h, 2.2, -0.35 * dir); } gulls.done(); }
  // for review pictures: fly the camera to the heron's boat
  window.__heron = (dist = 70) => { if (hbB && X.goView) X.goView({ at: [hbB.x, 0, hbB.z], dist, el: 0.45, az: SC.az ?? 0.6 }, 0.01); };

  // ---------- Room to grow: wgBuild ----------
  const LIGHT = new THREE.Color(CFG.light || '#fff3dc');
  const lightM = (k, extra) => { const m = new THREE.MeshBasicMaterial(Object.assign({ color: LIGHT.clone().multiplyScalar(k), toneMapped: false, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }, extra)); m.userData.gc = m.color.clone(); GM.push(m); return m; };
  const tv = new THREE.Vector3();
  const mkTag = () => { const el = document.createElement('div'); el.className = 'tag'; el.style.zIndex = 3; el.style.display = 'none'; (document.getElementById('tags') || document.body).appendChild(el); return el; };
  function tagTo(el, x, y, z, text) { tv.set(x, y, z); model.localToWorld(tv); tv.project(camera); if (tv.z > 1) { el.style.display = 'none'; return; }
    if (el.textContent !== text) el.textContent = text; el.style.display = 'block'; const hw = el.offsetWidth / 2 + 8, sx = Math.min(innerWidth - hw, Math.max(hw, (tv.x * 0.5 + 0.5) * innerWidth));
    el.style.transform = `translate(${sx}px, ${Math.max(120, (-tv.y * 0.5 + 0.5) * innerHeight - 8)}px) translate(-50%, -100%)`; }
  const growTags = [];
  const FX = Object.assign({}, base.fx);
  FX.wgBuild = (c) => {
    const g = new THREE.Group(), rows = GR.rows || [], n = rows.length;
    // 1. the cleared ground's edge in light
    const ol = (GR.outline || []).map(([x, z]) => new THREE.Vector3(x, LAND + 0.5, z)), olM = lightM(2.4);
    const olMesh = ol.length > 2 ? new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ol, true, 'catmullrom', 0), 160, 0.9, 5, true), olM) : null; if (olMesh) g.add(olMesh);
    // 2. the new rows: a bar of white light runs along each row, then the green hedge rises in its place
    const vineM = new THREE.MeshStandardMaterial({ color: '#5d7a32', roughness: 0.9 });
    const hedge = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1.5, 1.0).translate(0, 0.75, 0), vineM, Math.max(1, n)), ghostM = lightM(1.0);
    const ghost = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.9, 1.3).translate(0, 0.45, 0), ghostM, Math.max(1, n)); ghost.renderOrder = 4;
    hedge.frustumCulled = ghost.frustumCulled = false; hedge.castShadow = true; ghostM.opacity = 1; g.add(hedge, ghost);
    const c0 = new THREE.Color(0, 0, 0); for (let i = 0; i < n; i++) ghost.setColorAt(i, c0);
    const RW = rows.map(([ax, az, bx, bz]) => ({ ax, az, L: Math.hypot(bx - ax, bz - az), ry: -Math.atan2(bz - az, bx - ax), ux: (bx - ax), uz: (bz - az) }));
    // 3. the guest dock: a long float with finger piers, rising out of the water
    const DK = GR.dock, wood = new THREE.MeshStandardMaterial({ color: '#c9b79a', roughness: 0.85 }), dockG = new THREE.Group(); g.add(dockG);
    const dockLight = lightM(1.8), dockParts = [];
    if (DK) { const al = [Math.cos(DK.ry), -Math.sin(DK.ry)];
      const deck = new THREE.Mesh(new THREE.BoxGeometry(DK.len, 0.35, DK.wid), wood); deck.rotation.y = DK.ry; deck.position.set(DK.c[0], 0, DK.c[1]); dockG.add(deck); dockParts.push(deck);
      (DK.fingers || []).forEach(f => { const m = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.3, DK.fingerLen), wood); m.rotation.y = DK.ry; m.position.set(f[0], 0, f[1]); dockG.add(m); dockParts.push(m); });
      dockParts.forEach(m => { const gl = new THREE.Mesh(m.geometry, dockLight); gl.scale.set(1.04, 2.2, 1.04); gl.rotation.y = m.rotation.y; gl.position.copy(m.position); gl.renderOrder = 4; m.userData.gl = gl; dockG.add(gl); });
      dockG.userData.al = al; }
    const arr = GR.boat && GR.boat.length > 1 ? path(GR.boat) : null, arrI = arr ? inst('proto_cruiser', 1, g) : null, arrWake = arr ? mkWake() : null; if (arrWake) { root.remove(arrWake); g.add(arrWake); }
    // 4. the tasting room: walls build up from the ground in light, a dark roof drops on, a deck, then warm windows
    const TR = GR.tasting, trG = new THREE.Group(); g.add(trG);
    let trBody, trRoof, trDeck, trWin, trGhost;
    if (TR) { trG.position.set(TR.c[0], TR.y ?? LAND, TR.c[1]); trG.rotation.y = TR.ry;
      trBody = new THREE.Mesh(new THREE.BoxGeometry(24, 5, 12).translate(0, 2.5, 0), new THREE.MeshStandardMaterial({ color: '#8c6b4c', roughness: 0.85 }));
      trRoof = new THREE.Mesh(new THREE.BoxGeometry(26, 0.5, 14).translate(0, 0.25, 0), new THREE.MeshStandardMaterial({ color: '#2b2d31', roughness: 0.7 }));
      trDeck = new THREE.Mesh(new THREE.BoxGeometry(30, 0.4, 7).translate(0, 0.2, 0), wood); trDeck.position.z = (TR.deckSide || 1) * 9.5;
      const winM = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffc27a').multiplyScalar(1.6), toneMapped: false, transparent: true, opacity: 0 });
      trWin = new THREE.Mesh(new THREE.BoxGeometry(20, 1.8, 12.15).translate(0, 2.6, 0), winM);
      trGhost = new THREE.Mesh(new THREE.BoxGeometry(24.6, 5.6, 12.6).translate(0, 2.8, 0), lightM(1.4)); trGhost.renderOrder = 4;
      trG.add(trBody, trRoof, trDeck, trWin, trGhost); trBody.castShadow = trRoof.castShadow = true; }
    if (!growTags.length) growTags.push(mkTag(), mkTag());
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), pv = new THREE.Vector3(), sv = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), col = new THREE.Color(), ob = {};
    const T = { ol: [0.2, 1.0], row0: 0.9, rowGap: Math.min(0.016, 2.6 / Math.max(1, n)), rowRun: 0.5, dock: [3.9, 5.1], boat: [4.8, 8.6], tr: [5.6, 7.6] };
    const rowEnd = T.row0 + (n - 1) * T.rowGap + T.rowRun + 0.6, fmt = c.tag || (GROW && GROW.tag && GROW.tag.text) || '', total = c.count ?? GR.acres ?? 39;
    return { obj: g, mat: olM, tick(t0, k, pulse) {
      const t = reduced ? 99 : t0;
      if (olMesh) olM.opacity = clamp((t - T.ol[0]) / (T.ol[1] - T.ol[0])) * (t < rowEnd ? 0.9 : 0.35 + 0.2 * pulse);
      for (let i = 0; i < n; i++) { const r = RW[i], f = clamp((t - T.row0 - i * T.rowGap) / T.rowRun), e = ease(f), gr = ease((t - T.row0 - i * T.rowGap - T.rowRun) / 0.5);
        q.setFromAxisAngle(up, r.ry);
        // light bar: grows along the row, then fades as the hedge rises
        const L = Math.max(0.01, r.L * e), cx = r.ax + r.ux * e / 2, cz = r.az + r.uz * e / 2;
        m4.compose(pv.set(cx, LAND, cz), q, sv.set(f > 0 ? L : 1e-4, 1, 1)); ghost.setMatrixAt(i, m4); ghost.setColorAt(i, col.setScalar(f > 0 ? 0.85 * (1 - gr) : 0));
        m4.compose(pv.set(r.ax + r.ux / 2, LAND, r.az + r.uz / 2), q, sv.set(r.L, Math.max(1e-4, back(gr)), 1)); hedge.setMatrixAt(i, m4); }
      ghost.instanceMatrix.needsUpdate = hedge.instanceMatrix.needsUpdate = true; ghost.instanceColor.needsUpdate = true; ghost.visible = t < rowEnd + 1;
      if (DK) { const f = ease((t - T.dock[0]) / (T.dock[1] - T.dock[0])); dockG.visible = t > T.dock[0];
        dockParts.forEach((m, j) => { const fj = ease((t - T.dock[0] - j * 0.12) / 0.8); m.position.y = WY - 1.4 + 2.0 * fj; m.userData.gl.position.y = m.position.y; m.userData.gl.visible = fj > 0 && fj < 1; });
        dockLight.opacity = 0.35 * Math.sin(Math.PI * clamp(f)); }
      if (arrI) { const f = clamp((t - T.boat[0]) / (T.boat[1] - T.boat[0])), e = 1 - Math.pow(1 - f, 2.2); arr.at(e * arr.len, ob);
        const yaw = Math.atan2(ob.dx, ob.dz); arrI.set(0, ob.x, WY - 0.04, ob.z, yaw, f > 0 ? clamp(f * 8) : 1e-4); arrI.done();
        arrWake.position.set(ob.x, WY + 0.06, ob.z); arrWake.rotation.y = yaw; arrWake.material.opacity = f > 0 && f < 1 ? 0.45 * (1 - e) : 0; }
      if (TR) { const fb = ease((t - T.tr[0]) / 1.3), fr = back((t - T.tr[0] - 1.2) / 0.5), fd = ease((t - T.tr[0] - 1.0) / 0.6), fw = ease((t - T.tr[1]) / 0.8);
        trBody.scale.set(1, Math.max(1e-4, fb), 1); trRoof.visible = fr > 0; trRoof.position.y = 5 + (1 - fr) * 6; trDeck.scale.set(1, 1, Math.max(1e-4, fd)); trDeck.visible = fd > 0;
        trGhost.scale.set(1, Math.max(1e-4, Math.min(1, fb * 1.15)), 1); trGhost.material.opacity = 0.4 * (fb > 0 ? 1 - fw : 0) * (0.7 + 0.3 * pulse); trGhost.visible = fb > 0 && fw < 1;
        trWin.material.opacity = fw * (0.75 + 0.25 * pulse); trWin.visible = fw > 0; trG.visible = fb > 0; }
      if (GROW && GROW.tag && fmt) { const nn = Math.round(total * clamp((t - T.row0) / (rowEnd - 0.6 - T.row0))); GROW.tag.text = fmt.replace(/\d+/, String(nn)); }
      g.userData.t = t;
    } };
  };

  // ---------- each frame ----------
  let clock = 0;
  function tick(dt, state = {}) { base.tick(dt, state); clock += dt;
    PEOPLE.tick(dt, clock); for (const b of boats) moveBoat(b, dt, clock); if (cru) cru.done(); if (hbI) hbI.done(); moveHeron(clock, dt); moveGulls(clock);
    // the idea labels for the dock and the tasting room show only while Room to grow plays, once each piece is there
    if (state.growOn && GR.dock && growTags.length) {
      const gt = (() => { for (const ch of model.children) if (ch.userData && ch.userData.t != null && ch.visible) return ch.userData.t; return 0; })();
      if (gt > 5.0) tagTo(growTags[0], GR.dock.c[0], 6, GR.dock.c[1], 'Idea: a guest dock'); else growTags[0].style.display = 'none';
      if (GR.tasting && gt > 7.4) tagTo(growTags[1], GR.tasting.c[0], 14, GR.tasting.c[1], 'Idea: a tasting room'); else growTags[1].style.display = 'none'; }
    else growTags.forEach(el => el.style.display = 'none');
  }
  return { fx: FX, tick, dusk: base.dusk };
}
