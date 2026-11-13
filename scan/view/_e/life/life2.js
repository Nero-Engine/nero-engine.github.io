// Life layer 2 for the desk viewer (10-11-2026, first used on Piper Beach Resort, a PLANNED resort).
// Loads life1 (moving people, cars, pelicans, palm sway, surf, the Sunset switch) and adds, only for listings that ask for it
// with scene.life.src = "../_e/life/life2.js":
//   1. the planned resort rises out of the empty lot in light on first open (any touch skips; reduced motion shows it finished)
//   2. a four-jet diamond flies along the beach with smoke; tap a jet for the air show card; an umbrella blows away, a pelican ducks
//   3. the lazy river flows: guests on rings, kids down the slides with a splash, the swim-up bar, swimmers
//   4. view from a room: tap a tower floor (or pick one on the card) and stand on that floor's Gulf-facing balcony
//   5. through the year: a month slider fills the beach in step with a sourced monthly visitor count
//   6. Day, Sunset, Night: windows light one by one, the pools glow, string lights over the wedding lawn
//   7. the wedding hall roof lifts off to show a tiny wedding inside
// Everything is driven by model_info.json "piper" (places in model metres) and the listing's own cards. It moves in the web viewer only.
let THREE;

export async function init(X) {
  THREE = X.THREE;
  const v = new URL(import.meta.url).searchParams.get('l1');
  const base = await (await import('./life1.js' + (v ? '?v=' + v : ''))).init(X);
  const { model, part, MATS, INFO, SC, scene, sun, renderer, camera, controls, NV } = X;
  const PI = INFO.piper || {}, CFG = SC.life || {}, reduced = !!NV.reduced, T = NV.beacon || (() => {});
  const canvas = renderer.domElement, R = INFO.R || 440, WY = INFO.waterY ?? 0, PY = (INFO.protoAt || [0, -9, 0])[1];
  const RY = PI.base ?? 1.7, ROT = PI.rot || 0, CR = Math.cos(ROT), SR = Math.sin(ROT), TW = PI.tower || { x0: -76, x1: -16, z0: -32, z1: -10, pod: 6.4, fh: 3.2, n: 16, top: 57.6 };
  const root = new THREE.Group(); root.name = 'life2'; model.add(root);
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const ease = (k) => { k = clamp(k); return k * k * (3 - 2 * k); };
  const back = (k) => { if (k <= 0) return 0; if (k >= 1) return 1; const c = 1.9, x = k - 1; return 1 + (c + 1) * x * x * x + c * x * x; };
  const L2M = (x, y, z) => new THREE.Vector3(x * CR + z * SR, y + RY, -x * SR + z * CR);           // the resort's own frame to model metres
  const M2L = (p) => [p.x * CR - p.z * SR, p.y - RY, p.x * SR + p.z * CR];
  let rnd = 4242; const rand = () => (rnd = (rnd * 16807) % 2147483647) / 2147483647;
  const interp = (Lst, x) => { if (!Lst || !Lst.length) return 0; if (x <= Lst[0][0]) return Lst[0][1]; for (let i = 1; i < Lst.length; i++) if (x <= Lst[i][0]) { const t = (x - Lst[i - 1][0]) / ((Lst[i][0] - Lst[i - 1][0]) || 1); return Lst[i - 1][1] + (Lst[i][1] - Lst[i - 1][1]) * t; } return Lst[Lst.length - 1][1]; };
  const shoreZ = (x) => interp(PI.shore, x), vegZ = (x) => interp(PI.veg, x);
  const beachH = (x, z) => { const zv = vegZ(x), zs = shoreZ(x), t = clamp((z - zv) / Math.max(zs - zv, 1)); return 2.1 * Math.pow(1 - t, 1.3) + 0.15 - 0.9 * clamp((t - 0.93) / 0.07); };
  const dusk01 = () => (base.dusk ? base.dusk() : 0);
  const css = document.createElement('style'); document.head.appendChild(css);
  const add = (s) => { css.textContent += s; };

  // ---------- instanced copies of a hidden proto_* piece (same idea as life1) ----------
  function inst(name, n, opt = {}) {
    const p = part[name]; if (!p || !n) return null; const meshes = []; p.traverse(o => { if (o.isMesh) meshes.push(o); });
    const ims = meshes.map(o => { o.updateMatrix(); const g = o.geometry.clone(); g.applyMatrix4(o.matrix); g.translate(0, -PY, 0);
      const im = new THREE.InstancedMesh(g, o.material, n); im.castShadow = !opt.noShadow; im.frustumCulled = false; im.userData.tint = !!opt.tint && o.material.name === opt.tint;
      if (im.userData.tint) for (let i = 0; i < n; i++) im.setColorAt(i, new THREE.Color(1, 1, 1)); root.add(im); return im; });
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(0, 0, 0, 'YXZ'), pv = new THREE.Vector3(), sv = new THREE.Vector3();
    const I = { n, ims,
      set(i, x, y, z, ry = 0, s = 1, rz = 0, rx = 0, sy) { e.set(rx, ry, rz); q.setFromEuler(e); m4.compose(pv.set(x, y, z), q, sv.set(Math.max(s, 1e-4), Math.max(sy ?? s, 1e-4), Math.max(s, 1e-4))); for (const im of ims) im.setMatrixAt(i, m4); },
      hide(i) { this.set(i, 0, PY, 0, 0, 1e-4); },
      color(i, c) { const col = new THREE.Color(c); for (const im of ims) if (im.userData.tint) im.setColorAt(i, col); },
      done() { for (const im of ims) { im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; } } };
    for (let i = 0; i < n; i++) I.hide(i); I.done(); return I;
  }
  const SHIRTS = ['#e8553a', '#3a7fd0', '#f2c230', '#d8d4cc', '#ff7aa0', '#2f9e6a', '#d24a32', '#7a5cd6', '#40b8c4', '#f08a3c', '#9ad14a', '#d8d4cc'];
  const BRIGHT = ['#ff5a5f', '#ffd23f', '#3ec1d3', '#ff9a3c', '#7bd389', '#f78fb3', '#d8d4cc', '#5b8cff'];

  // =====================================================================================
  // 1. THE RISE: the planned resort grows out of the empty lot in white light
  // =====================================================================================
  const BUILD = { A: ['resort', 'wedding', 'wedding_roof', 'walkover'], B: ['pool', 'lazyriver', 'slides'], C: ['palms'] };
  const LIGHT = new THREE.Color(CFG.light || '#fff3dd').multiplyScalar(CFG.lightK ?? 1.6);   // Piper: HREC gold, 60% of the first version (Adam 10-11-2026: "you can't see any detail")
  const GU = {}; for (const g of 'ABC') GU[g] = { uLev: { value: -99 }, uSol: { value: -99 }, uMode: { value: g === 'B' ? 1 : 0 }, uJit: { value: g === 'C' ? 9 : 0 } };
  const SU = { uBOn: { value: reduced ? 0 : 1 }, uLC: { value: LIGHT }, uCs: { value: CR }, uSn: { value: ROT ? SR : 0 }, uBase: { value: RY + 0.3 }, uDrop: { value: 0 }, uWin: { value: 0 }, uWinOn: { value: 0 }, uWinK: { value: 1 } };
  const groupOf = (p) => Object.keys(BUILD).find(g => BUILD[g].includes(p));
  const patched = [];
  function patch(m) {
    const g = groupOf(m.userData.p), isGlass = m.name === 'glass', isWater = m.name === 'pool_water' && g;
    if (!g && !isGlass) return;
    const prev = m.onBeforeCompile, prevKey = m.customProgramCacheKey ? m.customProgramCacheKey() : '';
    m.onBeforeCompile = (sh, r) => { if (prev) prev.call(m, sh, r);
      Object.assign(sh.uniforms, SU, g ? GU[g] : {});
      sh.vertexShader = 'varying vec3 vRP;\n' + (isWater ? 'uniform float uDrop;\n' : '') + sh.vertexShader
        .replace('#include <begin_vertex>', '#include <begin_vertex>' + (isWater ? '\n transformed.y -= uDrop;' : ''))
        .replace('#include <project_vertex>', 'vRP = transformed;\n#include <project_vertex>');
      let head = 'varying vec3 vRP; uniform float uBOn, uCs, uSn, uBase, uWin, uWinOn, uWinK; uniform vec3 uLC;\nfloat nvh(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }\n';
      let fs = sh.fragmentShader;
      if (g) { head += 'uniform float uLev, uSol, uMode, uJit;\n';
        fs = fs.replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
          float bz = 0.0;
          if (uBOn > 0.5) { vec2 lp = vec2(vRP.x * uCs - vRP.z * uSn, vRP.x * uSn + vRP.z * uCs);
            float h = (uMode < 0.5 ? vRP.y : lp.x) - uJit * nvh(floor(vRP.xz / 7.0));
            if (h > uLev) discard;
            if (h > uSol) { if (h > uLev - 0.9) bz = 2.0; else { float fl = fract((vRP.y - uBase) / 3.2), gx = fract(lp.x / 3.0), gz = fract(lp.y / 3.0);
                if (fl > 0.09 && gx > 0.07 && gz > 0.07) discard; bz = 1.4; } }
            else if (h > uSol - 3.0) bz = (h - (uSol - 3.0)) / 3.0; }`)
          .replace('#include <opaque_fragment>', 'if (bz > 0.0) outgoingLight = mix(outgoingLight, uLC, min(bz, 1.0)) * max(bz, 1.0);\n#include <opaque_fragment>'); }
      if (isGlass) fs = fs.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          if (uWinOn > 0.5) { float hh = nvh(floor(vRP.xz / 3.3) + floor(vRP.y / 3.2) * 7.13); totalEmissiveRadiance *= step(hh, uWin) * (0.65 + 0.7 * fract(hh * 13.0)) * uWinK; }`);
      sh.fragmentShader = head + fs; };
    m.customProgramCacheKey = () => prevKey + '|nvb2' + (g || '') + (isGlass ? 'g' : '') + (isWater ? 'w' : '');
    m.needsUpdate = true; patched.push(m);
  }
  MATS.forEach(patch);
  const buildMeshes = []; for (const g of Object.values(BUILD)) for (const p of g) part[p] && part[p].traverse(o => { if (o.isMesh) buildMeshes.push([o, o.castShadow]); });
  const glassMats = MATS.filter(m => m.name === 'glass' && groupOf(m.userData.p));
  const TOPH = RY + 0.3 + TW.top + 14, FH = TW.fh || 3.2;
  const XS = [-95, 100];   // the deck sweep, west to east in the resort's frame
  const TB = 11.2;         // seconds for the whole rise
  let bt = reduced ? TB + 5 : 0, building = !reduced, firstDone = reduced;
  const stair = (h0, h1, k) => { const H = (h1 - h0) * k, q = H / FH, f = Math.floor(q); return h0 + (f + ease((q - f - 0.5) / 0.5)) * FH; };
  function setBuild(t) {
    const A = GU.A, B = GU.B, C = GU.C;
    // foundations glow for a moment, then the tower rises floor by floor as light, then turns solid and colours in
    if (t < 0.6) A.uLev.value = RY - 1; else if (t < 1.6) A.uLev.value = RY - 1 + 1.8 * ease((t - 0.6) / 0.35);
    else A.uLev.value = stair(RY + 0.8, TOPH, ease((t - 1.6) / 5.0));
    A.uSol.value = t < 2.6 ? RY - 4 : RY - 4 + (TOPH + 4 - RY) * ease((t - 2.6) / 5.4);
    if (t > 8.2) { A.uLev.value = 999; A.uSol.value = 999; }
    B.uLev.value = XS[0] + (XS[1] - XS[0]) * ease((t - 3.2) / 2.6); B.uSol.value = XS[0] - 4 + (XS[1] - XS[0] + 8) * ease((t - 4.2) / 2.8); if (t > 7.2) { B.uLev.value = B.uSol.value = 999; }
    C.uLev.value = RY - 1 + 24 * ease((t - 6.4) / 1.6); C.uSol.value = RY - 6 + 30 * ease((t - 7.0) / 1.8); if (t > 8.9) { C.uLev.value = C.uSol.value = 999; }
    SU.uDrop.value = 1.4 * (1 - ease((t - 6.2) / 1.4));
    // lights come on: windows flicker on one by one, then settle back to day
    const lk = t < 8.6 ? 0 : t < 9.8 ? ease((t - 8.6) / 1.0) : 1 - ease((t - 10.1) / 1.0);
    if (!dusk01()) { SU.uWinOn.value = lk > 0.001 ? 1 : 0; SU.uWin.value = clamp((t - 8.6) / 1.1) * 0.9; glassMats.forEach(m => { m.emissive.setRGB(1.0, 0.62, 0.3).multiplyScalar(1.6 * lk); }); }
  }
  function startBuild() { if (reduced) return; bt = 0; building = true; SU.uBOn.value = 1; buildMeshes.forEach(([o]) => o.castShadow = false); setBuild(0); }
  function endBuild() { if (!building) return; building = false; firstDone = true; bt = TB + 5; SU.uBOn.value = 0; SU.uDrop.value = 0; buildMeshes.forEach(([o, c]) => o.castShadow = c);
    if (!dusk01()) { SU.uWinOn.value = 0; glassMats.forEach(m => m.emissive.copy(m.userData.e0)); } if (!jets.next) jets.next = 15; }
  if (building) startBuild(); else SU.uBOn.value = 0;
  // the floating words during the rise
  const btag = document.createElement('div'); btag.className = 'tag c'; btag.style.zIndex = 3; document.body.appendChild(btag);
  const tv = new THREE.Vector3();
  function tagTo(el, p, text) { tv.copy(p); model.localToWorld(tv); tv.project(camera); if (tv.z > 1) { el.style.display = 'none'; return; }
    if (el.textContent !== text) el.textContent = text; el.style.display = 'block'; const hw = el.offsetWidth / 2 + 8, x = Math.min(innerWidth - hw, Math.max(hw, (tv.x * 0.5 + 0.5) * innerWidth));
    el.style.transform = `translate(${x}px, ${Math.max(120, (-tv.y * 0.5 + 0.5) * innerHeight - 8)}px) translate(-50%, -100%)`; }
  const towerTop = L2M((TW.x0 + TW.x1) / 2, TW.top + 16, (TW.z0 + TW.z1) / 2);

  // the row button becomes "Watch it rise" (the engine's Room to grow switch is not used on a planned resort)
  const growBtn = document.getElementById('grow');
  if (growBtn && !X.GROW) growBtn.innerHTML = '<span><small>PLANNED</small>Watch it rise</span><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>';
  let hooked = false;
  function replay() { T('tap', 'replay build'); if (room.on) leaveRoom(true); if (window.__choose) window.__choose(null); startBuild(); }
  window.__rise = replay;

  // =====================================================================================
  // 2. THE JETS: four F/A-18 Super Hornets in blue and gold, diamond formation, white smoke
  // =====================================================================================
  // shape after the film's hornet.js (published dimensions: length 18.3 m, span 13.6 m); drawn 2.2 times life size so they read on a desk
  const JS = CFG.jetScale ?? 2.2;
  function loft(sec, n, ex) { const pos = [], idx = [];
    const se = (a, e) => { const c = Math.cos(a), s = Math.sin(a); return [Math.sign(c) * Math.pow(Math.abs(c), 2 / e), Math.sign(s) * Math.pow(Math.abs(s), 2 / e)]; };
    sec.forEach(([x, wt, wb, top, bot]) => { for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, box = wb > wt + 0.05 && Math.sin(a) < 0, [cz, cy] = se(a, box ? 6 : ex), mid = (top + bot) / 2, hh = (top - bot) / 2, k = clamp((0.3 - cy) / 0.35), w = wt + (wb - wt) * k * k * (3 - 2 * k); pos.push(x, mid + cy * hh, cz * w); } });
    for (let r = 0; r < sec.length - 1; r++) for (let i = 0; i < n; i++) { const a = r * n + i, b = r * n + (i + 1) % n, c = a + n, d = b + n; idx.push(a, c, b, b, c, d); }
    const tip = pos.length / 3; pos.push(sec[0][0] + 0.02, (sec[0][3] + sec[0][4]) / 2, 0); for (let i = 0; i < n; i++) idx.push(tip, i, (i + 1) % n);
    const L = sec.length - 1, end = pos.length / 3; pos.push(sec[L][0], (sec[L][3] + sec[L][4]) / 2, 0); for (let i = 0; i < n; i++) idx.push(end, L * n + (i + 1) % n, L * n + i);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g; }
  function surface(P0, c0, P1, c1, th, nc = 12, ns = 5) {
    const p0 = new THREE.Vector3(...P0), p1 = new THREE.Vector3(...P1), cd = new THREE.Vector3(-1, 0, 0), sp = p1.clone().sub(p0), spP = sp.clone().sub(cd.clone().multiplyScalar(sp.dot(cd))).normalize();
    const nrm = new THREE.Vector3().crossVectors(cd, spP).normalize(); if (nrm.y < 0 && Math.abs(nrm.y) > 0.3) nrm.negate(); if (Math.abs(nrm.y) <= 0.3 && nrm.z * P1[2] < 0) nrm.negate();
    const naca = (x) => 5 * th * (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1036 * x ** 4), cs = (i) => 0.5 - 0.5 * Math.cos(Math.PI * i / nc), pos = [], idx = [];
    for (let s = 0; s <= ns; s++) { const f = s / ns, le = p0.clone().lerp(p1, f), ch = c0 + (c1 - c0) * f, tf = 1 - 0.25 * f;
      for (const side of [1, -1]) for (let i = 0; i <= nc; i++) { const x = cs(i), t = naca(x) * ch * tf, q = le.clone().add(cd.clone().multiplyScalar(x * ch)).add(nrm.clone().multiplyScalar(side * t)); pos.push(q.x, q.y, q.z); } }
    const row = 2 * (nc + 1);
    for (let s = 0; s < ns; s++) for (const sd of [0, 1]) for (let i = 0; i < nc; i++) { const a = s * row + sd * (nc + 1) + i, b = a + 1, c = a + row, d = b + row; if (sd === 0) idx.push(a, b, c, b, d, c); else idx.push(a, c, b, b, c, d); }
    for (const s of [0, ns]) for (let i = 0; i < nc; i++) { const u = s * row + i, l = s * row + (nc + 1) + i; if (s === ns) idx.push(u, u + 1, l, u + 1, l + 1, l); else idx.push(u, l, u + 1, u + 1, l, l + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g; }
  const mirrorZ = (g) => { const m = g.clone(); m.applyMatrix4(new THREE.Matrix4().makeScale(1, 1, -1)); const i = m.index.array; for (let k = 0; k < i.length; k += 3) { const t = i[k + 1]; i[k + 1] = i[k + 2]; i[k + 2] = t; } m.computeVertexNormals(); return m; };
  function merge(list) { const pos = [], nor = [], prt = []; for (const [g0, p] of list) { const g = g0.index ? g0.toNonIndexed() : g0; if (!g.attributes.normal) g.computeVertexNormals();
      pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array); for (let i = 0; i < g.attributes.position.count; i++) prt.push(p); }
    const o = new THREE.BufferGeometry(); o.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); o.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); o.setAttribute('aPart', new THREE.Float32BufferAttribute(prt, 1)); return o; }
  const jetGeo = (() => {
    const fus = loft([[9.15, 0.02, 0.02, 0.0, -0.06], [9.0, 0.13, 0.13, 0.08, -0.15], [8.6, 0.27, 0.27, 0.22, -0.28], [8.0, 0.41, 0.41, 0.36, -0.4], [7.2, 0.54, 0.54, 0.5, -0.52], [6.3, 0.63, 0.63, 0.62, -0.6],
      [5.4, 0.7, 0.7, 0.74, -0.66], [4.4, 0.76, 0.76, 0.86, -0.72], [3.25, 0.86, 0.86, 1.0, -0.8], [3.1, 0.88, 1.4, 1.0, -0.92], [2.2, 0.98, 1.46, 1.04, -0.98], [1.0, 1.08, 1.48, 1.0, -1.02],
      [-0.5, 1.16, 1.46, 0.95, -1.02], [-2.0, 1.2, 1.42, 0.9, -0.98], [-3.5, 1.22, 1.34, 0.84, -0.9], [-5.0, 1.2, 1.24, 0.74, -0.78], [-6.4, 1.15, 1.16, 0.6, -0.65], [-7.5, 1.1, 1.1, 0.48, -0.55], [-8.05, 1.06, 1.06, 0.42, -0.5]], 24, 2.7);
    const lerx = (s) => { const sh = new THREE.Shape(), P = [[6.2, 0.5], [5.0, 0.86], [3.6, 1.2], [2.2, 1.62], [1.0, 2.02], [0.15, 2.2], [-0.4, 1.5], [-0.4, 0.9], [2.0, 0.85], [4.5, 0.62]];
      sh.moveTo(P[0][0], P[0][1]); P.slice(1).forEach(([a, b]) => sh.lineTo(a, b)); sh.closePath();
      const g = new THREE.ExtrudeGeometry(sh, { depth: 0.07, bevelEnabled: false }), p = g.attributes.position;
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getY(i), d = p.getZ(i), y = 0.66 - 0.36 * clamp((6.2 - x) / 6.4) - 0.06 * Math.max(0, z - 1.0); p.setXYZ(i, x, y + d - 0.035, z * s); }
      if (s < 0) { const pp = p.array; for (let k = 0; k < pp.length; k += 9) for (let j = 0; j < 3; j++) { const t = pp[k + 3 + j]; pp[k + 3 + j] = pp[k + 6 + j]; pp[k + 6 + j] = t; } } g.computeVertexNormals(); return g; };
    const wing = surface([0.25, 0.30, 1.2], 4.7, [-1.72, 0.03, 6.15], 1.75, 0.055), stab = surface([-5.35, -0.02, 1.12], 2.95, [-7.25, -0.14, 3.18], 1.3, 0.045);
    const H = 2.95, cant = 20 * Math.PI / 180, fin = surface([-3.35, 0.62, 0.92], 3.45, [-3.35 - Math.tan(35 * Math.PI / 180) * H, 0.62 + Math.cos(cant) * H, 0.92 + Math.sin(cant) * H], 1.42, 0.05, 10, 4);
    const rail = new THREE.CylinderGeometry(0.06, 0.06, 2.3, 6); rail.rotateZ(Math.PI / 2); rail.translate(-2.75, 0.03, 6.18);
    const paint = merge([[fus, 0], [lerx(1), 4], [lerx(-1), 4], [wing, 1], [mirrorZ(wing), 1], [stab, 2], [mirrorZ(stab), 2], [fin, 3], [mirrorZ(fin), 3], [rail, 6], [mirrorZ(rail), 6]]);
    const cn = new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2); cn.scale(1.8, 0.72, 0.58); cn.translate(4.55, 0.8, 0);
    const noz = merge([0.56, -0.56].map((z) => { const g = new THREE.CylinderGeometry(0.46, 0.52, 0.85, 14, 1, false); g.rotateZ(Math.PI / 2); g.translate(-8.4, -0.05, z); return [g, 0]; }));
    return { paint, cn, noz }; })();
  const BLUE = new THREE.Color('#2149ad'), GOLD = new THREE.Color('#f2bd25');
  const jetM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.42, metalness: 0.15 });
  jetM.onBeforeCompile = (sh) => { sh.uniforms.uBlue = { value: BLUE }; sh.uniforms.uGold = { value: GOLD };
    sh.vertexShader = 'attribute float aPart; varying float vPart; varying vec3 vAP;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vAP = position; vPart = aPart;');
    sh.fragmentShader = `uniform vec3 uBlue, uGold; varying float vPart; varying vec3 vAP;
      vec3 livery(){ vec3 P = vAP; float g = 0.0, p = vPart;
        if (p < 0.5) { g += step(5.75, P.x) * (1.0 - smoothstep(0.13, 0.17, abs(P.z))); g += step(P.y, -0.25) * (1.0 - smoothstep(0.2, 0.25, abs(P.z))) * step(-7.6, P.x) * step(P.x, 8.6); g += smoothstep(9.05, 9.1, P.x); }
        else if (p < 1.5) g += smoothstep(5.6, 5.7, abs(P.z));
        else if (p < 2.5) g += smoothstep(2.9, 3.0, abs(P.z));
        else if (p < 3.5) g += smoothstep(2.25, 2.35, P.y - 0.62);
        else if (p > 5.5) g = 1.0;
        return mix(uBlue, uGold, clamp(g, 0.0, 1.0)); }\n` + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n diffuseColor.rgb = livery();'); };
  jetM.customProgramCacheKey = () => 'nvhornet2';
  const NJ = 4, jetIM = [new THREE.InstancedMesh(jetGeo.paint, jetM, NJ), new THREE.InstancedMesh(jetGeo.cn, new THREE.MeshStandardMaterial({ color: 0x2a2a22, roughness: 0.08, metalness: 0.4 }), NJ),
    new THREE.InstancedMesh(jetGeo.noz, new THREE.MeshStandardMaterial({ color: 0x4a4a4e, roughness: 0.45, metalness: 0.85 }), NJ)];
  jetIM.forEach(im => { im.frustumCulled = false; im.castShadow = true; im.visible = false; root.add(im); });
  // smoke (rebuilt 10-11-2026 after Adam saw a giant flickering wall): soft round sprites, unlit, thin, no depth writes, nothing near the camera.
  // One point per puff; size in metres turned into pixels in the shader, and capped so a puff can never fill the screen.
  const NP = 520, NPT = NJ * NP, sPos = new Float32Array(NPT * 3), sA = new Float32Array(NPT), sS = new Float32Array(NPT);
  const smokeG = new THREE.BufferGeometry(); smokeG.setAttribute('position', new THREE.BufferAttribute(sPos, 3)); smokeG.setAttribute('aA', new THREE.BufferAttribute(sA, 1)); smokeG.setAttribute('aS', new THREE.BufferAttribute(sS, 1));
  const smokeU = { uC: { value: new THREE.Color(0.9, 0.92, 0.94) }, uK: { value: 1 }, uMax: { value: 90 } };
  const smokeM = new THREE.ShaderMaterial({ uniforms: smokeU, transparent: true, depthWrite: false, depthTest: true,
    vertexShader: `attribute float aA; attribute float aS; uniform float uK, uMax; varying float vA;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); float d = -mv.z; vA = aA;
        float px = aS * uK / max(d, 1e-6);   // uK = metres-to-world scale * projection * half the drawing height
        if (d <= 0.0 || aA < 0.004) { vA = 0.0; px = 0.0; }
        vA *= 1.0 - smoothstep(uMax * 0.8, uMax * 1.6, px);   // a puff right by the camera fades instead of filling the view
        gl_PointSize = min(px, uMax); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uC; varying float vA; void main(){ vec2 q = gl_PointCoord * 2.0 - 1.0; float r = dot(q, q); if (r > 1.0 || vA <= 0.0) discard;
        float a = vA * pow(1.0 - r, 1.3); gl_FragColor = vec4(uC, a); }` });
  const smoke = new THREE.Points(smokeG, smokeM); smoke.frustumCulled = false; smoke.renderOrder = 5; smoke.visible = false; root.add(smoke);
  const smokeScale = new THREE.Vector3();
  const puffs = Array.from({ length: NPT }, () => ({ age: 99, x: 0, y: 0, z: 0 }));
  // the flight line: along the beach, just off the water's edge, low
  const SH = (PI.shore || []).filter(([x, z]) => Math.hypot(x, z) < R - 10), fit = (() => { let sx = 0, sz = 0, sxx = 0, sxz = 0; SH.forEach(([x, z]) => { sx += x; sz += z; sxx += x * x; sxz += x * z; }); const n = SH.length || 1, b = (n * sxz - sx * sz) / ((n * sxx - sx * sx) || 1); return { a: (sz - b * sx) / n, b }; })();
  const FORM = [[0, 0, 0], [-13.6, 0, -11.8], [-13.6, 0, 11.8], [-27.2, -2.2, 0]];   // lead, left wing, right wing, slot (metres at life size)
  const jets = { on: false, t: 0, dir: 1, next: 0, n: 0, pos: [], heading: 0, X0: R + 220, V: CFG.jetSpeed ?? 160, Y: CFG.jetY ?? 46 };
  const m4 = new THREE.Matrix4(), q1 = new THREE.Quaternion(), q2 = new THREE.Quaternion(), pv = new THREE.Vector3(), sv = new THREE.Vector3(JS, JS, JS), UP = new THREE.Vector3(0, 1, 0), FW = new THREE.Vector3(1, 0, 0);
  let emitT = 0, pi = 0;
  function startPass(how) { if (jets.on) return false; jets.on = true; jets.t = 0; jets.dir = jets.n % 2 ? -1 : 1; jets.n++; jets.joke = false; jetIM.forEach(im => im.visible = true); smoke.visible = true; T('jets', how); return true; }
  function tickJets(dt) {
    if (!jets.on) { if (firstDone && !reduced) { jets.next -= dt; if (jets.next <= 0) { startPass('auto'); jets.next = 40 + Math.random() * 30; } } }
    let anyPuff = false;
    if (jets.on) { jets.t += dt; const d = jets.dir, xl = d * (-jets.X0 + jets.V * jets.t), heading = Math.atan2(-(fit.b * d), d), bank = Math.sin(jets.t * 0.9) * 0.05;
      jets.lead = xl; if (Math.abs(xl) > jets.X0 + 60) { jets.on = false; jetIM.forEach(im => im.visible = false); }
      for (let j = 0; j < NJ; j++) { const [fx, fy, fz] = FORM[j], ox = fx * JS, oz = fz * JS * d;
        const x = xl + d * ox, z = fit.a + fit.b * x + 32 + oz, y = jets.Y + fy * JS + Math.sin(jets.t * 1.3 + j) * 0.6;
        q1.setFromAxisAngle(UP, heading); q2.setFromAxisAngle(FW, bank); q1.multiply(q2); m4.compose(pv.set(x, y, z), q1, sv); jetIM.forEach(im => im.setMatrixAt(j, m4));
        jets.pos[j] = [x, y, z];
        // smoke from the tail, only over the plate
        if (Math.hypot(x, z) < R - 8 && emitT <= 0) { const p = puffs[j * NP + (pi % NP)]; p.age = 0; p.x = x - d * 9.2 * JS * Math.cos(Math.atan(fit.b)); p.y = y - 0.3; p.z = z; } }
      jetIM.forEach(im => im.instanceMatrix.needsUpdate = true);
      if (emitT <= 0) { emitT = 0.012; pi++; } emitT -= dt; }
    if (smoke.visible) { const LIFE = 5.5;
      for (let i = 0; i < NPT; i++) { const p = puffs[i], k3 = i * 3; if (p.age > LIFE) { sA[i] = 0; sS[i] = 0; continue; }
        p.age += dt; anyPuff = true; const k = Math.min(1, p.age / LIFE);
        sPos[k3] = p.x; sPos[k3 + 1] = p.y - 1.2 * k; sPos[k3 + 2] = p.z;
        sS[i] = (2.2 + 3.6 * Math.sqrt(k)) * (JS / 2.2) * 2;            // diameter in metres: thin at the tail, a soft few metres later
        sA[i] = 0.7 * Math.pow(1 - k, 1.6) * clamp(p.age / 0.12); }
      // pixels per metre at distance 1: world scale of the model times the projection, times half the drawing height
      root.matrixWorld.decompose(pv, q2, smokeScale); const db = renderer.getDrawingBufferSize(new THREE.Vector2());
      smokeU.uK.value = smokeScale.x * camera.projectionMatrix.elements[5] * db.y * 0.5; smokeU.uMax.value = 0.09 * db.y;
      const dk = dusk01(), nn = typeof nk === 'number' ? ease(nk) : 0; smokeU.uC.value.setRGB(0.9, 0.92, 0.94).lerp(new THREE.Color(0.95, 0.72, 0.6), 0.6 * ease(dk)).multiplyScalar(1 - 0.7 * nn); }
    if (anyPuff || jets.on) { smokeG.attributes.position.needsUpdate = true; smokeG.attributes.aA.needsUpdate = true; smokeG.attributes.aS.needsUpdate = true; } else smoke.visible = false;
  }

  // =====================================================================================
  // beach crowd, the umbrella joke, pool and river life
  // =====================================================================================
  const VISITS = CFG.months || [369688, 613357, 542325, 609965, 773132, 944025, 856414, 794771, 720777, 522785, 488853, 340831];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const VMAX = Math.max(...VISITS);
  let month = CFG.month ?? new Date().getMonth();
  const SL = []; const NSET = 64, NSTAND = 54, NSWIM = 36;
  const inD = (x, z, m) => Math.hypot(x, z) < R - m;
  for (let tries = 0; SL.length < NSET + NSTAND + NSWIM && tries < 6000; tries++) {
    const kind = SL.filter(s => s.k === 0).length < NSET ? 0 : SL.filter(s => s.k === 1).length < NSTAND ? 1 : 2;
    const x = (rand() * 2 - 1) * 380 * (rand() < 0.5 ? 0.45 : 1), zv = vegZ(x), zs = shoreZ(x);
    const z = kind === 2 ? zs + 3 + rand() * 13 : zv + (zs - zv) * (kind === 0 ? 0.22 + rand() * 0.5 : 0.3 + rand() * 0.66);
    if (!inD(x, z, 16)) continue; if (SL.some(s => Math.hypot(s.x - x, s.z - z) < (kind === 0 ? 7 : 3.5))) continue;
    SL.push({ k: kind, x, z, y: kind === 2 ? WY : beachH(x, z), r: rand() * 6.28, pr: rand(), s: 0, c: BRIGHT[Math.floor(rand() * BRIGHT.length)], sh: SHIRTS[Math.floor(rand() * SHIRTS.length)] }); }
  // the joke's own umbrella, towel, owner and a pelican, on the beach in front of the resort
  const JX = CFG.jokeX ?? 26, JZ = vegZ(JX) + (shoreZ(JX) - vegZ(JX)) * 0.34, JY = beachH(JX, JZ), PX = JX + 11, PZ = JZ + 6;
  const nSet = SL.filter(s => s.k === 0).length, nStand = SL.filter(s => s.k === 1).length, nSwim = SL.filter(s => s.k === 2).length;
  const umb = inst('proto_umbrella', nSet + 1, { tint: 'umb' }), towel = inst('proto_towel', nSet + 1, { tint: 'towel', noShadow: true });
  // people: lying on towels, standing, swimming; then the river, bar, pool, tubs, slides; then the joke's owner
  const RIV = PI.river || [], LAG = PI.lagoon || [], NRIV = RIV.length > 10 ? 16 : 0, NBAR = PI.bar ? 6 : 0, NLAG = LAG.length ? 5 : 0, NTUB = (PI.tubs || []).length * 2, NKID = (PI.slides || []).length;
  const nPeople = nSet + nStand + nSwim + NBAR + NLAG + NTUB + NKID + 1;
  const ppl = inst('proto_person', nPeople, { tint: 'shirt' }), rings = inst('proto_ring', NRIV, { tint: 'ring' }), pel = inst('proto_pelican_sit', 1);
  let k0 = 0; const SLOT = { set: [], stand: [], swim: [] };
  SL.forEach(s => { if (s.k === 0) { s.u = SLOT.set.length; s.p = k0++; SLOT.set.push(s); } });
  SL.forEach(s => { if (s.k === 1) { s.p = k0++; SLOT.stand.push(s); } else if (s.k === 2) { s.p = k0++; SLOT.swim.push(s); } });
  SL.forEach(s => { ppl.color(s.p, s.sh); if (s.k === 0) { umb.color(s.u, s.c); towel.color(s.u, BRIGHT[(s.u * 3 + 1) % BRIGHT.length]); } });
  for (const g of Object.values(SLOT)) g.sort((a, b) => a.pr - b.pr);
  const kBar = k0, kLag = kBar + NBAR, kTub = kLag + NLAG, kKid = kTub + NTUB, kOwner = kKid + NKID;
  for (let i = kBar; i < kOwner; i++) ppl.color(i, SHIRTS[(i * 5) % SHIRTS.length]); ppl.color(kOwner, '#e8553a');
  umb.color(nSet, '#ff5a5f'); towel.color(nSet, '#3ec1d3');
  if (rings) for (let i = 0; i < NRIV; i++) rings.color(i, BRIGHT[i % BRIGHT.length]);
  function crowdTarget(m) { const f = VISITS[m] / VMAX; for (const [g, list] of Object.entries(SLOT)) { const n = Math.round(list.length * f); list.forEach((s, i) => s.want = i < n ? 1 : 0); } }
  crowdTarget(month);
  // river path (closed loop) and the lagoon loop for swimmers
  const loop = (P) => { const cum = [0]; for (let i = 1; i <= P.length; i++) { const a = P[i - 1], b = P[i % P.length]; cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
    const len = cum[cum.length - 1] || 1; return { len, at(d, o) { d = ((d % len) + len) % len; let i = 1; while (i < cum.length - 1 && cum[i] < d) i++; const a = P[i - 1], b = P[i % P.length], t = (d - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1);
      o.x = a[0] + (b[0] - a[0]) * t; o.z = a[1] + (b[1] - a[1]) * t; o.h = Math.atan2(b[0] - a[0], b[1] - a[1]); return o; } }; };
  const river = RIV.length ? loop(RIV) : null;
  const lagC = LAG.length ? LAG.reduce((a, p) => [a[0] + p[0] / LAG.length, a[1] + p[1] / LAG.length], [0, 0]) : [0, 0];
  const lagIn = loop(LAG.map(([x, z]) => [lagC[0] + (x - lagC[0]) * 0.55, lagC[1] + (z - lagC[1]) * 0.55]));
  // slides: kids ride down (their heads show above the tube), splash out at the bottom
  const SLD = (PI.slides || []).map(P => { const pts = P.map(p => new THREE.Vector3(p[0], p[1] - 0.6, p[2])); return new THREE.CatmullRomCurve3(pts); });
  const NSPL = 14, spl = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.35, 0), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, transparent: true, opacity: 0.9 }), NSPL * Math.max(1, SLD.length));
  spl.frustumCulled = false; root.add(spl); const drops = Array.from({ length: spl.count }, () => ({ a: 9, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 }));
  function splash(i, p) { for (let k = 0; k < NSPL; k++) { const d = drops[i * NSPL + k], a = Math.random() * 6.28, sp = 1.5 + Math.random() * 2.5; Object.assign(d, { a: 0, x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * sp, vy: 3 + Math.random() * 3, vz: Math.sin(a) * sp }); } }
  // string lights over the wedding lawn (light at dusk)
  const STR = PI.strings || [], strM = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd79a').multiplyScalar(3.2), toneMapped: false, transparent: true, opacity: 0 });
  const strIM = new THREE.InstancedMesh(new THREE.SphereGeometry(0.22, 6, 4), strM, Math.max(1, STR.length)); strIM.frustumCulled = false; strIM.visible = false;
  STR.forEach((p, i) => strIM.setMatrixAt(i, m4.makeTranslation(p[0], p[1], p[2]))); root.add(strIM);

  const o = {}, jk = { t: -1 };
  let lifeK = firstDone ? 1 : 0, tt = 0;
  function tickPeople(dt) {
    const T0 = reduced ? 0 : tt, sk = lifeK;
    // beach: each slot eases in or out with the month
    for (const s of SL) { const w = (s.want ?? 0) * sk * (tod === 2 && s.pr > 0.12 ? 0 : 1);   /* the beach empties at night, a few strollers stay */ if (s.s !== w) s.s = reduced ? w : s.s + Math.sign(w - s.s) * Math.min(Math.abs(w - s.s), dt * 2.5);
      const e = back(s.s);
      if (s.k === 0) { umb.set(s.u, s.x, s.y - 0.1, s.z, s.r, e); towel.set(s.u, s.x + 1.8, s.y + 0.02, s.z + 0.6, s.r + 1.2, e); ppl.set(s.p, s.x + 1.8 + Math.sin(s.r + 1.2) * 1.0, s.y + 0.18, s.z + 0.6 + Math.cos(s.r + 1.2) * 1.0, s.r + 1.2, e, 0, -Math.PI / 2); }
      else if (s.k === 1) ppl.set(s.p, s.x, s.y, s.z, s.r + Math.sin(T0 * 0.3 + s.r) * 0.4, e);
      else ppl.set(s.p, s.x + Math.sin(T0 * 0.2 + s.r) * 1.5, s.y - 1.55 + Math.sin(T0 * 1.4 + s.r) * 0.12, s.z, s.r, e); }
    // the bar: guests in the water round the counter, chatting
    if (NBAR) { const c = PI.bar.c, rr = PI.bar.r + 0.8, wy = PI.lagoonY ?? (RY + 0.62); for (let i = 0; i < NBAR; i++) { const a = Math.PI * (0.62 + i * 0.13) + ROT, x = c[0] + Math.sin(a) * rr, z = c[1] + Math.cos(a) * rr;
        ppl.set(kBar + i, x, wy - 1.0 + Math.sin(T0 * 0.8 + i) * 0.03, z, Math.atan2(c[0] - x, c[1] - z) + Math.sin(T0 * 0.5 + i * 2) * 0.3, sk); } }
    // swimmers in the lagoon pool
    if (NLAG) for (let i = 0; i < NLAG; i++) { lagIn.at(T0 * 0.55 + i * lagIn.len / NLAG, o); ppl.set(kLag + i, o.x, (PI.lagoonY ?? RY + 0.62) - 1.3 + Math.sin(T0 * 2 + i) * 0.06, o.z, o.h, sk); }
    // the double hot tub
    (PI.tubs || []).forEach((tb, j) => { for (let i = 0; i < 2; i++) { const a = i * Math.PI + j, x = tb[0] + Math.cos(a) * 1.3, z = tb[1] + Math.sin(a) * 1.3; ppl.set(kTub + j * 2 + i, x, RY + 0.95 - 1.2, z, Math.atan2(tb[0] - x, tb[1] - z), sk); } });
    // the lazy river: rings drift round the loop, turning slowly
    if (rings && river) for (let i = 0; i < NRIV; i++) { river.at(T0 * 0.9 + i * river.len / NRIV, o); rings.set(i, o.x, (PI.riverY ?? RY + 0.65) - 0.12 + Math.sin(T0 * 1.7 + i) * 0.04, o.z, T0 * 0.25 + i * 1.3, sk); }
    // kids down the slides, a splash at the bottom
    SLD.forEach((cv, i) => { const per = 7.5, ph = ((T0 + i * 3.7) % per), k = ph / 2.8;
      if (k < 1 && sk > 0.5) { cv.getPointAt(clamp(k * k * 0.35 + k * 0.65), pv); const ahead = cv.getPointAt(Math.min(1, k + 0.02)); ppl.set(kKid + i, pv.x, pv.y, pv.z, Math.atan2(ahead.x - pv.x, ahead.z - pv.z), 0.68, 0, 0.5); if (!reduced && k + dt / 2.8 >= 1) splash(i, cv.getPointAt(1)); }
      else ppl.hide(kKid + i); });
    for (let i = 0; i < drops.length; i++) { const d = drops[i]; if (d.a > 1.2) { spl.setMatrixAt(i, m4.makeScale(1e-4, 1e-4, 1e-4)); continue; } d.a += dt; d.vy -= 9.8 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.z += d.vz * dt; const s = 1 - d.a / 1.2; spl.setMatrixAt(i, m4.compose(pv.set(d.x, d.y, d.z), q1.identity(), sv.setScalar(s))); }
    sv.set(JS, JS, JS); spl.instanceMatrix.needsUpdate = true;
    // the joke: as the jets come over, one umbrella lifts and tumbles away down the beach; its owner runs after it, then carries it back.
    // A pelican sitting nearby ducks flat until they have gone.
    const ux = JX, uz = JZ, uy = JY; let ox = ux + 1.9, oz = uz + 0.7, oh = 0.6, oy = uy, carry = false, ub = [ux, uy - 0.1, uz, 0.2, 1, 0, 0];
    if (jets.on && !jets.joke && jk.t < 0 && jets.lead != null) { const ahead = (ux - jets.lead) * jets.dir; if (ahead < 90 && ahead > 0) { jets.joke = true; jk.t = 0; jk.d = jets.dir; } }
    if (jk.t >= 0) { jk.t += dt; const t = jk.t, d = jk.d, LX = ux + d * 34, LZ = uz + 3;
      if (t < 0.4) ub = [ux, uy - 0.1, uz, 0.2, 1, Math.sin(t * 40) * 0.12, 0];
      else if (t < 3.2) { const f = (t - 0.4) / 2.8; ub = [ux + (LX - ux) * f, beachH(ux, uz) + 0.4 + Math.sin(Math.PI * f) * 8, uz + (LZ - uz) * f, 0.2 + f * 5, 1, f * 6 * Math.PI * d, f * 2.4 * Math.PI]; }
      else if (t < 4.6) ub = [LX, beachH(LX, LZ) + 0.2, LZ, 1.1, 1, 1.35 * d, 0];
      const runF = clamp((t - 0.9) / 3.6), walkB = clamp((t - 5.4) / 5.0);
      if (t < 5.4) { const e2 = ease(runF); ox = ux + 1.9 + (LX - d * 1.4 - ux - 1.9) * e2; oz = uz + 0.7 + (LZ - uz - 0.7) * e2; oh = Math.atan2(d, 0.1); oy = beachH(ox, oz) + (runF > 0 && runF < 1 ? Math.abs(Math.sin(t * 14)) * 0.25 : 0); if (t > 4.6) carry = true; }
      else { const e2 = ease(walkB); ox = LX - d * 1.4 + (ux + 1.9 - LX + d * 1.4) * e2; oz = LZ + (uz + 0.7 - LZ) * e2; oh = Math.atan2(-d, 0.1); oy = beachH(ox, oz) + Math.abs(Math.sin(t * 7)) * 0.1; carry = walkB < 1; }
      if (carry) ub = [ox + 0.3, oy + 1.2, oz, 0.2, 1, 0.5 * -d, 0];
      if (t > 10.6) jk.t = -1; }
    umb.set(nSet, ub[0], ub[1], ub[2], ub[3], ub[4] * sk, ub[5], ub[6]); towel.set(nSet, ux + 1.8, uy + 0.02, uz + 0.6, 1.5, sk);
    if (jk.t < 0) ppl.set(kOwner, ux + 1.9, uy, uz + 0.7, 0.6, sk); else ppl.set(kOwner, ox, oy, oz, oh, sk);
    if (pel) { let duck = 0; if (jets.on && jets.lead != null) duck = 1 - clamp((Math.abs(jets.lead - PX) - 60) / 120); pel.k = pel.k ?? 0;
      pel.k += (duck - pel.k) * Math.min(1, dt * (duck > pel.k ? 9 : 2.2)); const pk = pel.k, sy = 1 - 0.55 * pk + (pk > 0.02 && duck === 0 ? 0.08 * Math.sin(tt * 18) * pk : 0);
      pel.set(0, PX, beachH(PX, PZ) - 0.05, PZ, -2.2, 1.15 * sk * (1 + 0.18 * pk), 0, 0, 1.15 * sk * sy); }
    for (const I of [umb, towel, ppl, rings, pel]) I && I.done();
  }

  // =====================================================================================
  // 4. VIEW FROM A ROOM: stand on a floor's Gulf-facing balcony and look out
  // =====================================================================================
  const BX = PI.balconyX ?? -46, FL0 = 3, FLN = FL0 + (TW.n || 16) - 2, FMIN = Math.max(FL0, CFG.minFloor ?? FL0);   // floors with a Gulf balcony: 3 to 17 (two podium storeys below); views from FMIN up clear the low roofs in front
  const room = { on: false, phase: '', t: 0, floor: 10, yaw: 0, pitch: 0 };
  const C0 = { near: camera.near, far: camera.far, minD: controls.minDistance, maxP: controls.maxPolarAngle };
  const eyeOf = (f) => { const slab = 0.3 + TW.pod + (f - FL0) * FH + 0.28; return L2M(BX, slab + 1.55, TW.z1 + 1.0); };
  const seaDir = new THREE.Vector3(SR, 0, CR);   // the resort's +z (the Gulf) in model space
  const W = (p) => model.localToWorld(p.clone());
  const ui = document.createElement('div'); ui.id = 'roomui'; ui.hidden = true; ui.setAttribute('role', 'region'); ui.setAttribute('aria-label', 'View from a room');
  ui.innerHTML = '<div class="rl"><b id="rlab">Illustrative view, floor 10</b><span>Planned resort · drag to look around</span></div><div class="rb"><button id="rdn" aria-label="Floor down">−</button><button id="rup" aria-label="Floor up">+</button><button id="rback">Back</button></div>';
  document.body.appendChild(ui);
  add(`#roomui { position:fixed; left:50%; transform:translateX(-50%); top:calc(env(safe-area-inset-top) + 64px); z-index:7; display:flex; align-items:center; gap:10px; width:max-content; max-width:calc(100vw - 32px);
      background:rgba(var(--bgc),.88); border:1px solid rgba(var(--lc),.2); border-radius:14px; padding:8px 10px 8px 14px; color:var(--ink); font:13px var(--font), sans-serif; backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); }
    #roomui[hidden] { display:none; } #roomui .rl { display:flex; flex-direction:column; line-height:1.25; } #roomui .rl b { font-size:14px; } #roomui .rl span { font-size:12px; color:var(--dim); }
    #roomui .rb { display:flex; gap:6px; } #roomui button { min-width:40px; min-height:40px; border-radius:12px; border:1px solid rgba(var(--lc),.22); background:rgba(var(--lc),.07); color:var(--ink); font:700 15px var(--font), sans-serif; padding:0 10px; }
    #roomui #rback { background:var(--hero); color:var(--onhero); border-color:var(--hero); }
    body.nvroom #bottom, body.nvroom #tourbtn, body.nvroom #sunbtn, body.nvroom #acts, body.nvroom #reset, body.nvroom #hint, body.nvroom #qrbox { display:none !important; }`);
  const rlab = ui.querySelector('#rlab');
  function enterRoom(f, how) {
    f = Math.max(FMIN, Math.min(FLN, f | 0)); T('room', String(f) + (how ? ' ' + how : ''));
    if (building) endBuild();
    const wasOn = room.on; room.floor = f; rlab.textContent = 'Illustrative view, floor ' + f;
    if (!wasOn) { room.from = { p: camera.position.clone(), t: controls.target.clone() }; controls.enabled = false; controls.autoRotate = false;
      controls.minDistance = 0.00005; controls.maxPolarAngle = Math.PI - 0.02; camera.near = 0.0004; camera.far = 4; camera.updateProjectionMatrix(); }
    room.on = true; room.phase = wasOn ? 'move' : 'in'; room.t = 0; room.yaw = 0; room.pitch = 0;
    room.p0 = camera.position.clone(); room.t0 = controls.target.clone();
    document.body.classList.add('nvroom'); ui.hidden = false; }
  function leaveRoom(quiet) { if (!room.on) return; room.on = false; room.phase = ''; document.body.classList.remove('nvroom'); ui.hidden = true;
    controls.enabled = true; controls.minDistance = C0.minD; controls.maxPolarAngle = C0.maxP; camera.near = C0.near; camera.far = C0.far; camera.updateProjectionMatrix();
    if (!quiet) X.goView(SC.home, 1.6); }
  ui.querySelector('#rback').onclick = () => { T('tap', 'room back'); leaveRoom(); };
  ui.querySelector('#rup').onclick = () => enterRoom(room.floor + 1, 'step'); ui.querySelector('#rdn').onclick = () => enterRoom(room.floor - 1, 'step');
  window.__room = (f) => f ? enterRoom(f, 'test') : leaveRoom();
  const lookAtFrom = (eye, yaw, pitch) => { const d = seaDir.clone().applyAxisAngle(UP, yaw); const dist = 300; const tg = eye.clone().add(d.multiplyScalar(dist)); tg.y = Math.max(-12, Math.min(40, eye.y + Math.tan(-0.06 + pitch) * dist)); return tg; };
  const bez = (a, c, b, k) => a.clone().multiplyScalar((1 - k) * (1 - k)).add(c.clone().multiplyScalar(2 * k * (1 - k))).add(b.clone().multiplyScalar(k * k));
  function tickRoom(dt) {
    if (!room.on) return; room.t += dt;
    const eye = eyeOf(room.floor), front = eye.clone().add(seaDir.clone().multiplyScalar(70)); front.y += 6;
    let P, Tg;
    if (room.phase === 'in') { const k1 = clamp(room.t / 1.7), k2 = clamp((room.t - 1.7) / 1.5);
      const p0 = model.worldToLocal(room.p0.clone()), t0 = model.worldToLocal(room.t0.clone());
      if (k2 <= 0) { const e = ease(k1), c = p0.clone().lerp(front, 0.5); c.y = Math.max(p0.y, front.y) + 40; P = bez(p0, c, front, e); Tg = t0.clone().lerp(eye, e); }
      else { const e = ease(k2); P = front.clone().lerp(eye, e); const turn = ease((k2 - 0.25) / 0.75) * Math.PI; const dir = seaDir.clone().negate().applyAxisAngle(UP, turn);
        Tg = P.clone().add(dir.multiplyScalar(300)); Tg.y = Math.max(-12, Math.min(40, P.y + Math.tan(-0.06 * ease((k2 - 0.25) / 0.75) - 0.05 * (1 - ease((k2 - 0.25) / 0.75))) * 300)); }
      if (k2 >= 1) room.phase = 'on'; }
    else if (room.phase === 'move') { const e = ease(room.t / 0.9), p0 = model.worldToLocal(room.p0.clone()); P = p0.lerp(eye, e); Tg = lookAtFrom(P, room.yaw, room.pitch); if (room.t >= 0.9) room.phase = 'on'; }
    else { P = eye; Tg = lookAtFrom(eye, room.yaw, room.pitch); }
    camera.position.copy(W(P)); controls.target.copy(W(Tg)); camera.lookAt(controls.target);
  }
  // the room view's own sky and far Gulf (the plate ends 440 m out), plus a balcony frame round the eye
  const skyU = { uZ: { value: new THREE.Color('#4f8fd0') }, uH: { value: new THREE.Color('#d8ebf3') }, uS: { value: new THREE.Color('#2a9aa4') }, uA: { value: 0 } };
  const SKY = { day: ['#4f8fd0', '#d8ebf3', '#2a9aa4'], dusk: ['#3b3a6b', '#ffa064', '#2f5866'], night: ['#03060f', '#18223f', '#050c16'] };
  const skyM = new THREE.ShaderMaterial({ uniforms: skyU, side: THREE.BackSide, transparent: true, depthWrite: false,
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 uZ, uH, uS; uniform float uA; varying vec3 vD; void main(){ float y = vD.y; vec3 c = y > 0.0 ? mix(uH, uZ, pow(clamp(y * 2.2, 0.0, 1.0), 0.7)) : mix(uH, uS, clamp(-y * 9.0, 0.0, 1.0)); gl_FragColor = vec4(c, uA); }' });
  skyM.toneMapped = false;
  const sky = new THREE.Mesh(new THREE.SphereGeometry(2600, 32, 16), skyM); sky.renderOrder = -10; sky.frustumCulled = false; sky.visible = false; root.add(sky);
  const frame = new THREE.Group(); frame.visible = false; root.add(frame);
  { const conc = new THREE.MeshStandardMaterial({ color: '#e9e4da', roughness: 0.85 }), metal = new THREE.MeshStandardMaterial({ color: '#9aa1a6', roughness: 0.35, metalness: 0.8 }),
      glassM = new THREE.MeshStandardMaterial({ color: '#9fd3d6', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.08, depthWrite: false });
    const bx = (m, w, h, d, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); frame.add(o); return o; };
    bx(conc, 5.6, 0.25, 2.6, 0, -1.68, 0.7);      // balcony floor slab
    bx(conc, 5.6, 0.3, 2.6, 0, 1.8, 0.7);         // the slab of the floor above
    bx(metal, 5.4, 0.05, 0.07, 0, -0.62, 1.9);    // handrail
    bx(glassM, 5.4, 0.95, 0.02, 0, -1.12, 1.9);     // glass balustrade
    for (const sx of [-2.75, 2.75]) bx(conc, 0.22, 3.6, 2.6, sx, 0.05, 0.7);   // dividers to the next balconies
    for (const i of [-2, -1, 1, 2]) bx(metal, 0.035, 0.95, 0.035, i * 1.3, -1.12, 1.9); }
  let exBase = null, exSet = null, roomA = 0;
  function tickRoomLook(dt) {
    roomA = room.on && room.phase !== 'in' ? Math.min(1, roomA + dt / 0.6) : room.on && room.t > 1.9 ? Math.min(1, roomA + dt / 0.8) : room.on ? roomA : Math.max(0, roomA - dt / 0.4);
    const on = roomA > 0.001; sky.visible = frame.visible = on; if (part.plinth) part.plinth.visible = !(room.on && roomA > 0.5);
    if (on) { const dk = dusk01(), n = ease(nk), C = (i) => new THREE.Color(SKY.day[i]).lerp(new THREE.Color(SKY.dusk[i]), ease(dk)).lerp(new THREE.Color(SKY.night[i]), n);
      skyU.uZ.value.copy(C(0)); skyU.uH.value.copy(C(1)); skyU.uS.value.copy(C(2)); skyU.uA.value = roomA;
      const eye = eyeOf(room.floor); sky.position.copy(eye); frame.position.copy(eye); frame.rotation.set(0, Math.atan2(seaDir.x, seaDir.z), 0); }
    // a touch less exposure on the balcony (the sand fills the view), restored on the way out
    if (renderer.toneMappingExposure !== exSet) exBase = renderer.toneMappingExposure;
    renderer.toneMappingExposure = exBase * (1 - 0.18 * roomA); exSet = renderer.toneMappingExposure; }
  // drag to look round from the balcony
  let look = null;
  canvas.addEventListener('pointerdown', (e) => { if (room.on && room.phase === 'on' && e.isPrimary) look = { x: e.clientX, y: e.clientY, yaw: room.yaw, pitch: room.pitch }; });
  addEventListener('pointermove', (e) => { if (!look || !room.on) return; room.yaw = clamp(look.yaw + (e.clientX - look.x) * 0.005, -1.25, 1.25); room.pitch = clamp(look.pitch - (e.clientY - look.y) * 0.004, -0.3, 0.3); });
  addEventListener('pointerup', () => { look = null; });

  // =====================================================================================
  // 7. THE WEDDING HALL ROOF lifts off
  // =====================================================================================
  const roof = part.wedding_roof; let roofK = 0, roofTap = false;
  function tickRoof(dt, sel) { if (!roof) return; const want = (sel && sel.id === (CFG.roofCard || 'wedding')) || roofTap ? 1 : 0; if (!(sel && sel.id === (CFG.roofCard || 'wedding'))) roofTap = false;
    roofK = reduced ? want : roofK + Math.sign(want - roofK) * Math.min(Math.abs(want - roofK), dt / 1.3); const e = ease(roofK);
    const rr = PI.rot || 0, sx = (CFG.roofSlide ?? 22) * e; roof.position.set(Math.cos(rr) * sx + seaDir.x * 2 * e, 15 * Math.sin(Math.PI * 0.5 * Math.min(1, e * 1.4)) + (e > 0.99 && !reduced ? Math.sin(tt * 1.4) * 0.35 : 0), -Math.sin(rr) * sx + seaDir.z * 2 * e); roof.traverse(m => { if (m.isMesh) m.castShadow = e < 0.05; }); }

  // =====================================================================================
  // taps: a jet, the roof, a tower floor, or the open sky
  // =====================================================================================
  const rc = new THREE.Raycaster(), ndc = new THREE.Vector2(), inv = new THREE.Matrix4();
  const hitParts = ['wedding_roof', 'wedding', 'resort'].map(n => part[n]).filter(Boolean);
  let down = null, tapTimer = 0;
  canvas.addEventListener('pointerdown', (e) => { if (!e.isPrimary) return; down = { x: e.clientX, y: e.clientY, t: performance.now(), skip: building && !!firstDone === false };
    if (building) { endBuild(); down.skip = true; } });
  canvas.addEventListener('pointerup', (e) => { if (!e.isPrimary || !down) return; const d = down; down = null;
    if (d.skip || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 9 || performance.now() - d.t > 450 || room.on) return;
    if (tapTimer) { clearTimeout(tapTimer); tapTimer = 0; return; }   // a double tap belongs to the engine (fly in)
    const x = e.clientX, y = e.clientY; tapTimer = setTimeout(() => { tapTimer = 0; onTap(x, y); }, 330); });
  function onTap(x, y) {
    const r = canvas.getBoundingClientRect(); ndc.set((x - r.left) / r.width * 2 - 1, -((y - r.top) / r.height) * 2 + 1); rc.setFromCamera(ndc, camera);
    const ray = rc.ray.clone().applyMatrix4(inv.copy(model.matrixWorld).invert());
    if (jets.on) for (const p of jets.pos) if (p && ray.intersectsSphere(new THREE.Sphere(new THREE.Vector3(...p), 14 * JS))) { T('tap', 'jet'); if (window.__choose) window.__choose(CFG.jetCard || 'airshow'); return; }
    const hit = rc.intersectObjects(hitParts, true)[0];
    if (hit) { let p = hit.object; while (p && p.parent !== model) p = p.parent; const name = p && p.name;
      if (name === 'wedding_roof' || name === 'wedding') { T('tap', 'roof'); if (window.__choose) window.__choose(CFG.roofCard || 'wedding'); roofTap = true; return; }
      if (name === 'resort') { const lp = M2L(model.worldToLocal(hit.point.clone())); const [lx, ly, lz] = lp;
        if (lx > TW.x0 - 1.5 && lx < TW.x1 + 1.5 && lz > TW.z0 - 2.5 && lz < TW.z1 + 2.5 && ly > TW.pod + 0.3 && ly < TW.top + 0.3) { enterRoom(FL0 + Math.floor((ly - 0.3 - TW.pod) / FH), 'tap'); } }
      return; }
    // nothing hit: the sky, or past the edge of the plate, calls a fly-past
    const tgy = -ray.origin.y / ray.direction.y; const gx = ray.origin.x + ray.direction.x * tgy, gz = ray.origin.z + ray.direction.z * tgy;
    if (!(tgy > 0 && Math.hypot(gx, gz) < R)) { if (startPass('tap')) T('tap', 'sky'); }
  }
  window.__jets = () => startPass('test');

  // =====================================================================================
  // 6. DAY, SUNSET, NIGHT: one switch with three steps (replaces life1's two-step button)
  // =====================================================================================
  let tod = 0, nk = 0, winK = 0;
  const hemi = scene.children.find(o => o.isHemisphereLight);
  const old = document.getElementById('sunbtn'); const tb = old ? old.cloneNode(false) : document.createElement('button'); if (old) old.replaceWith(tb); else { tb.id = 'sunbtn'; document.body.appendChild(tb); }
  const ICON = ['<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 1.5v2.5M12 20v2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M1.5 12H4M20 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M17 18a5 5 0 0 0-10 0"/><path d="M12 2v7M4.2 10.2l1.4 1.4M1 18h2M21 18h2M18.4 11.6l1.4-1.4M23 22H1M8 6l4-4 4 4"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/></svg>'];
  const TODN = ['Day', 'Sunset', 'Night'];
  const tlabel = () => { tb.innerHTML = ICON[tod] + '<span>' + TODN[tod] + '</span>'; tb.classList.toggle('on', tod > 0); tb.setAttribute('aria-label', 'Time of day: ' + TODN[tod] + '. Tap for ' + TODN[(tod + 1) % 3]); };
  function setTod(m) { tod = ((m % 3) + 3) % 3; tlabel(); if (window.__sunset) window.__sunset(tod > 0); if (reduced) nk = tod === 2 ? 1 : 0; }
  tb.type = 'button'; tb.onclick = () => { setTod(tod + 1); T('tap', 'time ' + TODN[tod]); }; tlabel();
  window.__tod = setTod;
  const NIGHT = { sc: new THREE.Color('#8fa6ff'), hs: new THREE.Color('#33407a'), hg: new THREE.Color('#0d0f1a'), bg: ['#060912', '#0f1730', '#04050a'] };
  const DUSKBG = CFG.duskBackdrop || ['#3a2d4d', '#7d4436', '#1b1210'];
  const bgCv = scene.background && scene.background.image, bgX = bgCv && bgCv.getContext && bgCv.getContext('2d');
  const lerpHex = (a, b, k) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), k).getHexString();
  const waterMats = MATS.filter(m => m.name === 'pool_water');
  function tickNight(dt) {
    const want = tod === 2 ? 1 : 0; nk = reduced ? want : nk + Math.sign(want - nk) * Math.min(Math.abs(want - nk), dt / 1.2);
    const dk = dusk01(), lk = ease((dk - 0.35) / 0.65);
    // windows light one by one as the sun goes, more of them at night
    const wWant = tod === 0 ? 0 : tod === 1 ? 0.55 : 0.88; winK = reduced ? wWant : winK + Math.sign(wWant - winK) * Math.min(Math.abs(wWant - winK), dt / 4.0);
    if (!building || dk > 0.01) { SU.uWinOn.value = dk > 0.01 ? 1 : 0; SU.uWin.value = winK; SU.uWinK.value = 1 + 0.5 * nk; }
    strM.opacity = lk; strIM.visible = lk > 0.01;
    if (nk > 0.001) { const e = ease(nk);
      sun.intensity *= 1 - 0.78 * e; sun.color.lerp(NIGHT.sc, 0.85 * e);
      if (hemi) { hemi.intensity *= 1 - 0.5 * e; hemi.color.lerp(NIGHT.hs, e); hemi.groundColor.lerp(NIGHT.hg, e); }
      renderer.toneMappingExposure *= 1 - 0.1 * e; scene.environmentIntensity *= 1 - 0.65 * e;
      waterMats.forEach(m => { m.emissive.multiplyScalar(1 + 1.3 * e); });
      if (bgX) { const gr = bgX.createLinearGradient(0, 0, 0, bgCv.height); [0, 0.55, 1].forEach((s, i) => gr.addColorStop(s, lerpHex(DUSKBG[i], NIGHT.bg[i], e))); bgX.fillStyle = gr; bgX.fillRect(0, 0, bgCv.width, bgCv.height); scene.background.needsUpdate = true; } }
  }

  // =====================================================================================
  // the card add-ons: the month slider (Through the year) and the floor picker (View from a room)
  // =====================================================================================
  const card = document.getElementById('card'), cs = document.getElementById('cs');
  const px = document.createElement('div'); px.id = 'px'; if (card && cs) card.insertBefore(px, cs);
  add(`#px { display:none; margin:8px 0 2px; } #px.on { display:block; }
    #px input[type=range] { width:100%; accent-color:var(--hero); height:28px; margin:0; }
    #px .ml { display:flex; justify-content:space-between; font-size:11px; color:var(--muted); padding:0 5px; } #px .ml b { color:var(--hero); }
    #px .mv { font-size:14px; margin:6px 0 2px; color:var(--ink); } #px .mv b { color:var(--hero); font-size:17px; }
    #px .mn { font-size:12px; color:var(--muted); line-height:1.35; }
    #px .fl { display:flex; flex-wrap:wrap; gap:6px; } #px .fl button { min-width:40px; min-height:36px; border-radius:10px; border:1px solid rgba(var(--lc),.22); background:rgba(var(--lc),.07); color:var(--ink); font:700 13px var(--font), sans-serif; }
    @media (max-width:759px) { #bottom.reading #px .mn { font-size:11.5px; } }`);
  let pxFor = null;
  const fmt = (n) => n.toLocaleString('en-US');
  function yearPanel() { px.innerHTML = `<input type="range" min="0" max="11" step="1" value="${month}" aria-label="Month of 2025"><div class="ml">${'JFMAMJJASOND'.split('').map((c, i) => i === month ? `<b>${c}</b>` : `<span>${c}</span>`).join('')}</div>
      <div class="mv"><b>${MONTHS[month]} 2025</b> · ${fmt(VISITS[month])} recreation visits</div><div class="mn">${CFG.monthNote || 'Whole seashore (Florida and Mississippi units), not Perdido Key alone. 2025 included a 43-day partial federal shutdown.'}</div>`;
    const rg = px.querySelector('input'); rg.oninput = () => { setMonth(+rg.value, true); }; rg.onchange = () => T('month', MONTHS[month]); }
  function setMonth(m, fromSlider) { month = Math.max(0, Math.min(11, m | 0)); crowdTarget(month);
    if (pxFor === 'year') { const mv = px.querySelector('.mv'), ml = px.querySelector('.ml'); if (mv) mv.innerHTML = `<b>${MONTHS[month]} 2025</b> · ${fmt(VISITS[month])} recreation visits`;
      if (ml) ml.innerHTML = 'JFMAMJJASOND'.split('').map((c, i) => i === month ? `<b>${c}</b>` : `<span>${c}</span>`).join(''); if (!fromSlider) { const rg = px.querySelector('input'); if (rg) rg.value = month; } } }
  window.__month = (m) => setMonth(m);
  function roomPanel() { const b = []; for (let f = FMIN; f <= FLN; f++) b.push(`<button type="button" data-f="${f}" aria-label="Floor ${f}">${f}</button>`);
    px.innerHTML = `<div class="mn" style="margin-bottom:6px">Pick a floor (or tap one on the tower):</div><div class="fl">${b.join('')}</div>`;
    px.querySelectorAll('button').forEach(x => x.onclick = () => enterRoom(+x.dataset.f, 'card')); }
  function tickCard(sel) { const want = sel && (sel.id === (CFG.yearCard || 'year') ? 'year' : sel.id === (CFG.roomCard || 'room') ? 'room' : null);
    if (want !== pxFor) { pxFor = want; if (want === 'year') yearPanel(); else if (want === 'room') roomPanel(); else px.innerHTML = ''; px.classList.toggle('on', !!want); } }

  // =====================================================================================
  // each frame
  // =====================================================================================
  let lastSel = null;
  function tick(dt, state = {}) {
    tt += dt; const sel = state.sel;
    if (!hooked && growBtn && !X.GROW) { hooked = true; growBtn.onclick = replay; growBtn.setAttribute('aria-pressed', 'false'); }
    if (sel && building) endBuild();
    if (sel !== lastSel) { lastSel = sel; if (sel && sel.id === (CFG.jetCard || 'airshow') && !jets.on) startPass('card'); }
    base.tick(dt, state);
    if (building) { bt += dt; setBuild(bt); if (bt >= TB) endBuild(); }
    if (building || bt < TB + 1.6) tagTo(btag, towerTop, bt < 1.4 ? 'Today: the empty lot' : 'Planned resort, illustrative'); else btag.style.display = 'none';
    if (building && bt < 1.0) btag.style.opacity = String(clamp(bt / 0.3)); else btag.style.opacity = building || bt < TB + 1.6 ? '1' : '0';
    lifeK = firstDone ? Math.min(1, lifeK + dt / 1.5) : 0; if (reduced) lifeK = firstDone ? 1 : 0;
    tickPeople(dt); tickJets(dt); tickRoof(dt, sel); tickCard(sel); tickNight(dt); tickRoom(dt); tickRoomLook(dt);
  }
  window.__go = (v, d) => X.goView(v, d ?? 1.6); window.__jokeAt = [JX, JY, JZ];   // test hooks (walkthrough recording)
  if (/[?&]dbg\b/.test(location.search)) window.__dbg = { scene, model, part, MATS, renderer, root, SU, GU, sun, camera, controls };   // inspection only, with ?dbg
  return { fx: base.fx, tick, dusk: base.dusk };
}
