// Riverbend RV Resort and Cabins life layer (11-11-2026): life1 (people, the camper van, cars on Highway 50, sunset, Find your site, and the
// four-legged walker, here a mule deer doe who eats a camper's breakfast off a picnic table while the camper looks the other way) plus:
// - Find your site takes cabin letters too (A, B, F, G, H, I from the resort's site map), not only site numbers
// - the cottonwoods standing where the Room to grow idea goes step aside while it plays
// - moving water on the Uncompahgre, Chipeta Lake and the ponds (wave trains in the surface normal, as Karoo)
// - fact card effect 'valley': the resort shrinks onto the Uncompahgre valley (real terrain, height x1.6), Montrose, the Black Canyon and the
//   San Juans labelled, and the real drive routes draw themselves from the gate with their minutes
// It moves in the web viewer only. The AR file stays a still model.
let THREE;

export async function init(X) {
  THREE = X.THREE;
  const v = new URL(import.meta.url).searchParams.get('l1');
  const SC = X.SC, INFO = X.INFO;
  // cabins join the site list before life1 builds Find your site (numbers only there; letters are swapped in on the way through, below)
  const CAB = INFO.cabinsWF || [], cab0 = (INFO.pads || []).length;
  if (INFO.pads && SC.wayfind) CAB.forEach((c, k) => { INFO.pads.push(c.at); INFO.padRot.push(c.rot); INFO.padNo.push(9001 + k); });
  const L0 = INFO.life || {}, DEER = L0.bear || null, CAMPER = (L0.still || [])[0] || null;
  if (DEER) { delete L0.bear; if (CAMPER) L0.still = L0.still.slice(1); }
  const base = await (await import('./life1.js' + (v ? '?v=' + v : ''))).init(X);
  const { model, part, MATS, D, camera, glowM, NV } = X;
  const reduced = !!NV.reduced, R = INFO.R, HERO = new THREE.Color(D.theme.hero);
  const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), sm = (x) => { x = cl(x); return x * x * (3 - 2 * x); };
  const FX = Object.assign({}, base.fx);
  const root = new THREE.Group(); root.name = 'riverbend_life'; model.add(root);

  // ---------- Find your site: cabin letters ----------
  if (CAB.length) {
    const letters = CAB.map(c => c.id.toUpperCase());
    CAB.forEach((c, k) => { INFO.padNo[cab0 + k] = 9001 + k; });
    const panel = document.getElementById('wfpanel');
    const shown = (k) => { INFO.padNo[cab0 + k] = letters[k]; SC.wayfind.unit = 'Cabin'; };   // the tag reads unit + ' ' + padNo
    if (panel) {
      const inp = panel.querySelector('input');
      inp.setAttribute('inputmode', 'text'); inp.removeAttribute('pattern'); inp.placeholder = 'Site number or cabin letter, e.g. 27 or F'; inp.setAttribute('aria-label', 'Site number or cabin letter');
      let undo = null;
      const before = (e) => { const t = e.target; const isGo = t.closest && (t.closest('.show') || t.closest('.wfgo')); const isKey = e.type === 'keydown' && e.key === 'Enter' && t === inp;
        if (!isGo && !isKey) return; const raw = inp.value.trim().replace(/^cabin\s*/i, '').toUpperCase(), k = letters.indexOf(raw);
        CAB.forEach((c, j) => { INFO.padNo[cab0 + j] = 9001 + j; }); SC.wayfind.unit = 'Site';
        if (k < 0) return; inp.value = String(9001 + k); SC.wayfind.unit = 'Cabin';
        undo = () => { inp.value = letters[k]; shown(k); }; setTimeout(() => { if (undo) { undo(); undo = null; } hideOutline(); }, 0); };
      panel.addEventListener('click', before, true); panel.addEventListener('keydown', before, true);
      // the error line names both ranges
      new MutationObserver(() => { const m = panel.querySelector('.msg'); if (m && /run from/.test(m.textContent) && !/cabin/i.test(m.textContent)) m.textContent = 'Sites run from 1 to 83; cabins are ' + letters.join(', ') + '.'; })
        .observe(panel.querySelector('.msg'), { childList: true, characterData: true, subtree: true });
    }
    // life1 draws a 20 m RV pad outline; a cabin gets a ring of light round it instead
    const ringM = new THREE.MeshBasicMaterial({ color: HERO.clone().multiplyScalar(2.2), toneMapped: false, transparent: true, opacity: 0.8 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(6, 0.4, 6, 48), ringM); ring.rotation.x = Math.PI / 2; ring.visible = false; root.add(ring);
    function hideOutline() { const n = INFO.padNo.findIndex(x => typeof x === 'string'); ring.visible = false; if (n < 0) return;
      model.traverse(o => { if (o.isMesh && o.geometry.type === 'TubeGeometry' && o.geometry.parameters.closed && o.geometry.parameters.path.points.length === 4) {
        const p = o.geometry.parameters.path.points, cx = (p[0].x + p[2].x) / 2, cz = (p[0].z + p[2].z) / 2, at = INFO.pads[n];
        if (Math.hypot(cx - at[0], cz - at[2]) < 1) { o.visible = false; ring.position.set(at[0], 0.9, at[2]); ring.visible = true; } } }); }
    FX._ringTick = (t) => { ring.material.opacity = 0.6 + 0.4 * Math.sin(t * 3); if (ring.visible && !ring.parent.visible) ring.visible = false; };
    window.__cabin = (L, go) => { const p = document.getElementById('wfpanel'); if (!p) return; window.__site(L, go); };
  }

  // ---------- moving water ----------
  const waterT = { value: 0 };
  MATS.filter(m => m.name === 'lake').forEach(m => { m.roughness = 0.24; m.metalness = 0.05; m.envMapIntensity = 0.6; const prev = m.onBeforeCompile;
    m.onBeforeCompile = (sh, r) => { if (prev) prev(sh, r); sh.uniforms.uWT = waterT;
      sh.vertexShader = 'varying vec2 vWxz;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vWxz = transformed.xz;');
      sh.fragmentShader = 'uniform float uWT;\nvarying vec2 vWxz;\n' + sh.fragmentShader
        .replace('#include <color_fragment>', `#include <color_fragment>
  { float h = wN(vWxz * 0.08 + vec2(uWT * 0.12, uWT * 0.05)); float sw = wN(vWxz * 0.025 + vec2(uWT * 0.05, -uWT * 0.03)); diffuseColor.rgb *= 0.82 + 0.2 * h + 0.14 * sw; }`)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
  { vec2 p = vWxz; float t = uWT, e = 0.15, fw = length(fwidth(p));
    vec2 g = wGrad(p * 0.035 + vec2(t * 0.06, -t * 0.04), e) * 0.035 * 2.2;
    g += wGrad(p * 0.22 + vec2(t * 0.16, t * 0.06), e) * 0.22;
    g += wGrad(p * 0.55 + vec2(-t * 0.09, t * 0.11), e) * 0.55 * clamp(1.6 - fw * 1.2, 0.0, 1.0);
    g += wGrad(p * 1.40 + vec2(t * 0.2, -t * 0.12), e) * 1.40 * 0.45 * clamp(1.4 - fw * 3.0, 0.0, 1.0);
    g += wGrad(p * 3.20 + vec2(-t * 0.25, -t * 0.3), e) * 3.20 * 0.18 * clamp(1.2 - fw * 7.0, 0.0, 1.0);
    normal = normalize((viewMatrix * vec4(normalize(vec3(-g.x * 0.3 * clamp(1.2 - fw * 0.9, 0.35, 1.0), 1.0, -g.y * 0.3 * clamp(1.2 - fw * 0.9, 0.35, 1.0))), 0.0)).xyz); }`)
        .replace('void main() {', `float wH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float wN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(wH(i), wH(i + vec2(1.0, 0.0)), f.x), mix(wH(i + vec2(0.0, 1.0)), wH(i + vec2(1.0, 1.0)), f.x), f.y); }
vec2 wGrad(vec2 p, float e) { float c = wN(p); return vec2(wN(p + vec2(e, 0.0)) - c, wN(p + vec2(0.0, e)) - c) / e; }
void main() {`); };
    m.customProgramCacheKey = () => 'riverbendWater2'; m.needsUpdate = true; });

  // RV roofs and white sides: the sun sheen was too bright (Adam, 11-11-2026: "needs to come down like 20%")
  MATS.forEach(m => { if (m.userData.p !== 'rvs') return; const l = (m.color.r + m.color.g + m.color.b) / 3; if (l < 0.6 && !m.map) return;
    m.color.multiplyScalar(0.84); if (m.userData.c0) m.userData.c0.copy(m.color); m.roughness = Math.max(m.roughness, 0.45); m.envMapIntensity = (m.envMapIntensity ?? 1) * 0.8; if (m.userData.lum) m.userData.lum *= 0.84; });

  // ---------- the funny touch: the deer eats the camper's pancakes (Adam, 11-11-2026: faces the table, head down, the stack goes; the camper turns and jumps) ----------
  const DV = { c: 0, on: false };
  if (DEER && part.proto_bear_body && part.proto_bear_head && part.proto_bear_leg && INFO.deer) try {
    const PY = (INFO.protoAt || [0, -8, 0])[1], Y = DEER.y ?? 0.2;
    const kid = (name) => { const g = new THREE.Group(), inner = part[name].clone(true); inner.visible = true; inner.position.set(0, -PY, 0); g.add(inner); return g; };
    const deer = new THREE.Group(), body = kid('proto_bear_body'), head = kid('proto_bear_head'); deer.add(body); head.position.set(0, 0.92, 0.78); deer.add(head);
    const HIPS = [[0.19, -0.5, 0], [0.19, 0.48, 0.25], [-0.19, -0.5, 0.5], [-0.19, 0.48, 0.75]];
    const legs = HIPS.map(([x, z]) => { const l = kid('proto_bear_leg'); l.position.set(x, 0.62, z); deer.add(l); return l; });
    deer.traverse(o => { if (o.isMesh) o.castShadow = true; }); root.add(deer);
    // the pancakes: five on the plate, eaten from the top
    const cakeM = new THREE.MeshStandardMaterial({ color: '#d9a35a', roughness: 0.7 }), syrupM = new THREE.MeshStandardMaterial({ color: '#7a3d12', roughness: 0.3 });
    const P = INFO.deer.plate, cakes = [];
    for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.03, 16), i === 4 ? syrupM : cakeM); m.position.set(P[0], P[1] + 0.016 + i * 0.03, P[2]); root.add(m); cakes.push(m); }
    // the camper (yellow shirt), back to the table, coffee in hand
    let camper = null, cry0 = 0, cAt = null;
    if (CAMPER && part.proto_person) { camper = kid('proto_person'); camper.traverse(o => { if (o.isMesh && o.material.name === 'shirt') { o.material = o.material.clone(); o.material.color.set(CAMPER.shirt || '#f2c230'); } });
      cAt = new THREE.Vector3(CAMPER.at[0], CAMPER.y ?? Y, CAMPER.at[1]); { const tb = new THREE.Vector3(INFO.deerTable[0], cAt.y, INFO.deerTable[1]); cAt.sub(tb).setLength(3.0).add(tb); }   /* close enough to share the shot */ camper.position.copy(cAt); cry0 = CAMPER.ry || 0; camper.rotation.y = cry0; root.add(camper); }
    // the path (model metres): the first stopD metres come from the trees to the table, the rest goes back
    const pts = DEER.path.map(([x, z]) => new THREE.Vector3(x, 0, z)), cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
    const LEN = cum[cum.length - 1], STOP = DEER.stopD, o = new THREE.Vector3();
    const at = (d) => { d = cl(d, 0, LEN); let i = 1; while (i < cum.length - 1 && cum[i] < d) i++; const f = (d - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1); o.lerpVectors(pts[i - 1], pts[i], f); return Math.atan2(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z); };
    at(STOP); const stopP = o.clone(), T = new THREE.Vector3(INFO.deerTable[0], 0, INFO.deerTable[1]), faceT = Math.atan2(T.x - stopP.x, T.z - stopP.z);
    const faceCam = cAt ? Math.atan2(T.x - cAt.x, T.z - cAt.z) : cry0;
    // one loop, seconds: walk in, turn to the table, eat (the stack goes), the camper turns round and jumps, the deer looks up and bolts, the camper stares, a fresh stack
    const WALK = 15, EAT0 = 15.6, EAT1 = 24, TURN_C = 20.5, LOOK = 24, BOLT = 25, PERIOD = 36, VW = STOP / WALK, VB = 3.2;
    const angTo = (a, b, k) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return a + d * k; };
    let h = at(0), ph = 0, pitch = 0.15, yaw = 0;
    // the close-up: low, from the lane side, the table a little above the middle of the screen (the fact card covers the bottom)
    DV.view = () => { const ou = INFO.deer.out, la = 0.75, lb = -0.66, az = Math.atan2(la * Math.cos(ou) - lb * Math.sin(ou), la * Math.sin(ou) + lb * Math.cos(ou)), ph = innerWidth < 760 ? 1.0 : 1.6;
      const mx = cAt ? (T.x * 0.65 + cAt.x * 0.35) : T.x, mz = cAt ? (T.z * 0.65 + cAt.z * 0.35) : T.z;
      return { at: [mx + Math.sin(az) * ph, 0.5, mz + Math.cos(az) * ph], dist: innerWidth < 760 ? 9 : 11, el: 0.55, az }; };
    DV.on = true; DV.table = T; DV.face = faceT; DV.set = (c) => { DV.c = c; };
    DV.tick = (dt, t) => { DV.c = (DV.c + dt) % PERIOD; const c = reduced ? EAT0 + 4 : DV.c; let d, want, moving = 0, wp = 0.15, wy = 0;
      if (c < WALK) { d = c * VW; want = at(d + 0.6); moving = VW; }
      else if (c < BOLT) { d = STOP; want = faceT; at(STOP);
        if (c >= EAT0 && c < EAT1) { wp = 0.62 + 0.05 * Math.sin(t * 9); wy = 0.08 * Math.sin(t * 1.3); }
        else if (c >= LOOK) { wp = -0.15; wy = cAt ? angTo(0, Math.atan2(cAt.x - stopP.x, cAt.z - stopP.z) - h, 1) * 0.8 : 0; } }
      else { d = STOP + Math.min(LEN - STOP, (c - BOLT) * VB); want = at(d + 0.8); moving = d < LEN - 0.05 ? VB : 0; }
      at(d); h = angTo(h, want, Math.min(1, (c >= WALK && c < BOLT ? 4 : 6) * dt));
      ph += moving * dt / 1.3; const sw = moving > 2 ? 0.55 : 0.35;
      deer.position.set(o.x, Y + (moving ? 0.02 * Math.abs(Math.sin(ph * Math.PI * 2)) : 0), o.z); deer.rotation.y = h;
      legs.forEach((l, i) => { l.rotation.x = moving ? sw * Math.sin(2 * Math.PI * (ph + HIPS[i][2])) : 0; });
      pitch += (wp - pitch) * Math.min(1, 6 * dt); yaw += (wy - yaw) * Math.min(1, 6 * dt); head.rotation.set(pitch, yaw, 0, 'YXZ');
      // the stack: full until she starts, one pancake every 1.5 s, back (a fresh breakfast) once she has gone and the camper has turned away
      const eaten = c < EAT0 + 0.8 ? 0 : c < BOLT ? Math.min(5, Math.floor((c - EAT0 - 0.8) / 1.5) + 1) : (c > PERIOD - 1.2 ? 0 : 5);
      cakes.forEach((m, i) => { m.visible = i < 5 - eaten; });
      if (camper) { let ry = cry0, y = cAt.y, rz = 0;
        if (c > TURN_C && c < PERIOD - 3) { const k = sm((c - TURN_C) / 0.45); ry = angTo(cry0, faceCam, k); }
        else if (c >= PERIOD - 3) ry = angTo(faceCam, cry0, sm((c - (PERIOD - 3)) / 0.8));
        if (c > TURN_C + 0.6 && c < TURN_C + 1.8) { const u = (c - TURN_C - 0.6) / 1.2; y += 0.4 * Math.abs(Math.sin(u * Math.PI * 2)); rz = 0.12 * Math.sin(u * Math.PI * 6); }
        camper.position.y = y; camper.rotation.set(0, ry, rz, 'YXZ'); } };
    DV.c = 2;
  } catch (err) { console.warn('deer', err); }
  // the tour stops on it once: on the 'Open all year' stop, glide in close while she eats (Adam: "most people won't be looking for it")
  let tourSel = null, tourSelT = 0, tourDone = false;
  function tourTick(dt, state) { const tb = document.getElementById('tourbtn'), touring = !!(tb && tb.classList.contains('on'));
    if (!touring) { tourDone = false; tourSel = null; return; }
    const id = state.sel && state.sel.id; if (id !== tourSel) { tourSel = id; tourSelT = 0; } tourSelT += dt;
    if (id === 'year' && !tourDone && tourSelT > 2.4 && DV.on) { tourDone = true; DV.set(12); X.goView(DV.view(), 2.2); } }
  window.__deer = { get c() { return DV.c; }, set: (c) => DV.set && DV.set(c), look: () => DV.view && X.goView(DV.view(), 0.01) };

  // the big shops' flat roofs read as white blocks under the bloom: a calmer grey
  MATS.forEach(m => { if (m.name === 'flat_roof' || m.name === 'shop_wall') { m.color.set(m.name === 'flat_roof' ? '#8e8c86' : '#b4b0a6'); if (m.userData.c0) m.userData.c0.copy(m.color); m.userData.lum = 0.5; } });
  // ---------- the valley (area zoom) ----------
  const tv = new THREE.Vector3();
  const mkTag = (cls = 'tag') => { const el = document.createElement('div'); el.className = cls; el.style.zIndex = 3; el.style.display = 'none'; document.body.appendChild(el); return el; };
  function tagTo(el, p, text) { tv.copy(p); model.localToWorld(tv); tv.project(camera); if (tv.z > 1 || Math.abs(tv.x) > 1.05 || Math.abs(tv.y) > 1.05) { el.style.display = 'none'; return; }
    if (el.textContent !== text) el.textContent = text; el.style.display = 'block'; const hw = el.offsetWidth / 2 + 8, x = Math.min(innerWidth - hw, Math.max(hw, (tv.x * 0.5 + 0.5) * innerWidth));
    const y = Math.max(120, (-tv.y * 0.5 + 0.5) * innerHeight - 8); el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
    // never over the fact card or the chips
    const cd = document.getElementById('card'), ch = document.getElementById('chips'); let lim = innerHeight;
    if (cd && cd.style.display === 'block') lim = Math.min(lim, cd.getBoundingClientRect().top); if (ch) lim = Math.min(lim, ch.getBoundingClientRect().top);
    if (y > lim - 4) el.style.display = 'none'; }
  let vObj = null, vInst = [], vAct = null, vP = 0, VD = null, vBuilt = false, vLoading = false, vKP = null, vFu = 1, vTags = [], vRoutes = [], vWant = [];
  const vMats = MATS.filter(m => ['ground', 'water'].includes(m.userData.p));
  const vURL = (() => { try { return new URL('valley.json', new URL(D.files.glb, location.href)).href; } catch (e) { return 'valley.json'; } })();
  const b64 = (s, T) => { const bin = atob(s), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new T(u.buffer); };
  const EX = 1.6;
  function buildValley(g) { const L = VD, n = L.n, H = b64(L.h, Int16Array), half = L.half, fu = (R - 3) / half; vFu = fu;
    const hAt = (u, w) => { const fx = cl((u + half) / (2 * half) * (n - 1), 0, n - 1.001), fz = cl((w + half) / (2 * half) * (n - 1), 0, n - 1.001), i = fx | 0, j = fz | 0, a = fx - i, b = fz - j;
      const s = (ii, jj) => H[jj * n + ii]; return (s(i, j) * (1 - a) + s(i + 1, j) * a) * (1 - b) + (s(i, j + 1) * (1 - a) + s(i + 1, j + 1) * a) * b; };
    const yOf = (u, w) => 0.15 + hAt(u, w) * EX * fu;
    const NR = 90, NA = 320, pos = [], col = [], idx = [], c = new THREE.Color();
    const floor = new THREE.Color('#7a7f4e'), adobe = new THREE.Color('#a59a80'), forest = new THREE.Color('#2c4529'), rock = new THREE.Color('#6d6a64'), snow = new THREE.Color('#e9edf1');
    const vid = (r, a) => r === 0 ? 0 : 1 + (r - 1) * NA + (a % NA);
    const push = (x, z) => { const u = x / fu, w = z / fu, h = hAt(u, w), e = h + L.base; pos.push(x, yOf(u, w), z);
      const sl = Math.abs(hAt(u + 400, w) - hAt(u - 400, w)) + Math.abs(hAt(u, w + 400) - hAt(u, w - 400));
      if (e < 1900) c.copy(floor).lerp(adobe, cl(sl / 120)); else if (e < 2350) c.copy(adobe).lerp(forest, cl((e - 1900) / 450)); else if (e < 3400) c.copy(forest);
      else if (e < 3800) c.copy(forest).lerp(rock, cl((e - 3400) / 300)); else c.copy(rock).lerp(snow, cl((e - 3800) / 200));
      col.push(c.r, c.g, c.b); };
    push(0, 0); for (let r = 1; r <= NR; r++) for (let a = 0; a < NA; a++) { const rr = (R - 1.5) * r / NR, t = a / NA * Math.PI * 2; push(rr * Math.cos(t), rr * Math.sin(t)); }
    for (let a = 0; a < NA; a++) idx.push(0, vid(1, a + 1), vid(1, a));
    for (let r = 1; r < NR; r++) for (let a = 0; a < NA; a++) { const p0 = vid(r, a), p1 = vid(r, a + 1), p2 = vid(r + 1, a), p3 = vid(r + 1, a + 1); idx.push(p0, p1, p2, p1, p3, p2); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    const dm = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, transparent: true, opacity: 0 }); const dio = new THREE.Mesh(geo, dm); dio.receiveShadow = true; g.add(dio); g.userData.dm = dm;
    { const p = [], ix = []; for (let a = 0; a <= NA; a++) { const k = 1 + (NR - 1) * NA + (a % NA); p.push(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2], pos[k * 3], -0.6, pos[k * 3 + 2]); }
      for (let a = 0; a < NA; a++) { const k = a * 2; ix.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); sg.setIndex(ix); sg.computeVertexNormals();
      const skm = new THREE.MeshStandardMaterial({ color: new THREE.Color('#0b1a12'), roughness: 0.7, side: THREE.DoubleSide, transparent: true, opacity: 0 }); g.add(new THREE.Mesh(sg, skm)); g.userData.skm = skm; }
    // drive routes from the gate, glowing, draped on the land
    const rm = new THREE.MeshBasicMaterial({ color: HERO.clone().multiplyScalar(2.6), toneMapped: false, transparent: true, depthWrite: false });
    vRoutes = L.routes.map(r => { const pts = r.pts.map(([x, z]) => new THREE.Vector3(x * fu, yOf(x, z) + 0.9, z * fu)); const cv = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.1);
      const m = new THREE.Mesh(new THREE.TubeGeometry(cv, Math.min(500, pts.length * 4), 0.9, 5, false), rm); m.geometry.setDrawRange(0, 0); m.visible = false; m.renderOrder = 5; g.add(m);
      return { k: r.k, name: r.name, min: r.min, m, end: pts[pts.length - 1].clone().add(new THREE.Vector3(0, 3, 0)), tag: mkTag() }; });
    // places
    vTags = L.places.filter(p => p[4] !== 'park' && p[0] !== 'Montrose').map(p => ({ name: p[0], kind: p[4], at: new THREE.Vector3(p[1] * fu, 0.15 + p[3] * EX * fu + 3, p[2] * fu), el: mkTag() }));
    vKP = new THREE.Vector3(L.park[0] * fu, 0.15 + L.park[2] * EX * fu, L.park[1] * fu);
    const bm = glowM(4); const beacon = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2.4, 40, 16, 1, true), bm); beacon.position.copy(vKP).add(new THREE.Vector3(0, 20, 0)); g.add(beacon); g.userData.bm = bm;
    g.userData.parkTag = mkTag();
    vBuilt = true; }
  const shrinkParts = () => model.children.filter(o => o !== vObj && o.name !== 'plinth' && o !== root && !o.userData.isFx);
  // one shared valley; each fact card that uses it has its own empty marker object, shown by the engine while that card is open
  FX.valley = (c) => { const g = new THREE.Group(); g.userData.isFx = true; const inst = { g, c, t: 0 }; vInst.push(inst);
    if (!vObj) { vObj = new THREE.Group(); vObj.userData.isFx = true; vObj.name = 'valley'; model.add(vObj); }
    const ensure = () => { if (vBuilt || vLoading) return; vLoading = true; fetch(vURL).then(r => r.json()).then(j => { VD = j; buildValley(vObj); }).catch(e => console.warn('valley', e)); };
    return { obj: g, mat: null, tick: (t) => { ensure(); inst.t = t; } }; };
  function valleyTick(dt) { const act = vInst.find(i => i.g.visible) || null; if (act) { vAct = act; vWant = act.c.routes || []; }
    const on = !!(act && vBuilt); const t = on ? act.t || 0 : 0; if (vObj && vBuilt) vObj.userData.places = !vAct || vAct.c.places !== false;
    const hide = () => { vTags.forEach(p => p.el.style.display = 'none'); vRoutes.forEach(r => { r.tag.style.display = 'none'; }); if (vObj && vObj.userData.parkTag) vObj.userData.parkTag.style.display = 'none'; };
    vP = on ? (reduced ? 1 : sm((t - 0.3) / 2.0)) : Math.max(0, vP - dt * 1.5);
    if (vP <= 0 && !on) { if (vObj && vObj.userData.wasOn) { shrinkParts().forEach(o => { o.scale.setScalar(1); o.position.set(0, o.userData.y0 || 0, 0); }); root.scale.setScalar(1); root.position.set(0, 0, 0);
      vMats.forEach(m => { m.opacity = 1; m.transparent = m.userData.tr0 || false; m.depthWrite = true; }); vObj.userData.wasOn = false; ['trees', 'town', 'ground', 'water'].forEach(n => { if (part[n]) part[n].visible = true; }); } if (vObj) vObj.visible = false; hide(); return; }
    if (vObj) vObj.visible = vP > 0;
    ['trees', 'town', 'ground', 'water'].forEach(n => { if (part[n]) part[n].visible = vP < 0.55; });
    if (!vKP) return; const g = vObj; g.userData.wasOn = true;
    const s = 1 + (vFu * 3 - 1) * vP;   // the resort at three times true scale on the valley, so it stays visible
    shrinkParts().concat([root]).forEach(o => { if (o.userData.y0 == null) o.userData.y0 = o.position.y; o.scale.setScalar(s); o.position.set(vKP.x * vP, vKP.y * vP + o.userData.y0 * s, vKP.z * vP); });
    vMats.forEach(m => { if (m.userData.tr0 == null) m.userData.tr0 = m.transparent; m.transparent = true; m.opacity = 1 - sm((vP - 0.2) / 0.5); m.depthWrite = m.opacity > 0.95; });
    g.userData.dm.opacity = sm((vP - 0.15) / 0.5); g.userData.skm.opacity = g.userData.dm.opacity; g.userData.dm.depthWrite = g.userData.dm.opacity > 0.9;
    g.userData.bm.opacity = (on ? sm((t - 1.6) / 0.8) : 0) * (0.7 + 0.3 * Math.sin(t * 3));
    const lab = on && vP > 0.85;
    if (lab) tagTo(g.userData.parkTag, vKP.clone().add(new THREE.Vector3(0, 44, 0)), 'Riverbend · Montrose'); else g.userData.parkTag.style.display = 'none';
    vTags.forEach(p => { if (lab && g.userData.places) tagTo(p.el, p.at, p.name); else p.el.style.display = 'none'; });
    vRoutes.forEach((r, i) => { const want = on && (vWant === 'all' || vWant.includes(r.k)); r.m.visible = want; if (!want) { r.tag.style.display = 'none'; return; }
      if (r.k === 'downtown') r.tag.style.display = 'none';
      const k = reduced ? 1 : sm((t - 2.0 - i * 0.25) / 2.4); r.m.geometry.setDrawRange(0, Math.floor(r.m.geometry.index.count * k / 6) * 6);
      if (k > 0.97 && r.k !== 'downtown') tagTo(r.tag, r.end, (vWant.length === 1 ? '' : r.name.replace('Montrose Regional Airport', 'Airport').replace('Black Canyon of the Gunnison', 'Black Canyon') + ' · ') + r.min + ' min'); else r.tag.style.display = 'none'; });
    // a single-route card keeps the place labels but drops the duplicate
    if (vWant.length === 1) vTags.forEach(p => { if (p.name.startsWith('Black Canyon') && vWant[0] === 'canyon' && lab) tagTo(p.el, p.at, 'Black Canyon of the Gunnison · ' + (vRoutes.find(r => r.k === 'canyon') || {}).min + ' min'); });
    vRoutes.forEach(r => { if (vWant.length === 1) r.tag.style.display = 'none'; }); }

  // ---------- every frame ----------
  let clock = 0;
  function tick(dt, state = {}) { base.tick(dt, state); clock += dt;
    if (part.growtrees) part.growtrees.visible = !state.growOn;
    waterT.value = reduced ? 0 : clock * 1.8;
    if (DV.tick) DV.tick(dt, clock); tourTick(dt, state);
    if (FX._ringTick) FX._ringTick(clock);
    valleyTick(dt); }
  window.__riverbend = { part, get vP() { return vP; }, get clock() { return clock; } };
  return { fx: FX, tick, dusk: base.dusk };
}
