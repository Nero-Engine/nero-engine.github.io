// Riverbend RV Resort and Cabins life layer, library version (riverbend2, 11-11-2026). Built on riverbend1 (kept as it was) with:
// - people from Model Kit/Library who really walk (people1.js): walkers on the lanes and the river trail, one with a dog, two standing about;
//   the camper in the joke is the library person too
// - the land for sale: a soft ribbon of light round the 9.76 acres, always on, stronger at sunset (as Totem Pole)
// - a fine grain on the ground so the low sun catches the land (as Totem Pole)
// - wildlife by the water: a great blue heron wading the Uncompahgre shallows by the angler and fishing now and then, gulls gliding over Chipeta Lake
// - kept from riverbend1: cabin letters in Find your site, moving water, RV roof sheen down 20%, the deer pancake joke and its tour stop,
//   the calmer grey shop roofs, the Room to grow trees stepping aside. The valley (area zoom) is gone (Adam, 11-11-2026: tour of the site only).
// It moves in the web viewer only. The AR file stays a still model (it has the border and a still heron).
import { initPeople } from './people1.js?v=1';
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
    const cakeM = new THREE.MeshStandardMaterial({ color: '#c98a3e', roughness: 0.75 }), syrupM = new THREE.MeshStandardMaterial({ color: '#7a3d12', roughness: 0.3 });
    MATS.forEach(m => { if (m.name === 'plate') { m.color.set('#bdb8ae'); if (m.userData.c0) m.userData.c0.copy(m.color); m.userData.lum = 0.4; } if (m.name === 'fruit') { m.color.set('#5f9e3a'); if (m.userData.c0) m.userData.c0.copy(m.color); } });   // the white plate bloomed and the yellow bowl read as pancakes
    const P = INFO.deer.plate, cakes = [];
    for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.042, 16), i === 4 ? syrupM : cakeM); m.position.set(P[0], P[1] + 0.022 + i * 0.042, P[2]); root.add(m); cakes.push(m); }
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

  // ---------- library people who really walk ----------
  const PEOPLE = initPeople(X, root);

  // ---------- the land for sale: a soft ribbon of light round the border (Kolding green), always on ----------
  const ribU = { uK: { value: 1 }, uT: { value: 0 } }, HG = HERO.clone();
  try { if (part.border) { const bm = new THREE.MeshBasicMaterial({ color: HG.clone().multiplyScalar(1.6), toneMapped: false }); part.border.traverse(o => { if (o.isMesh) { o.material = bm; o.castShadow = false; } }); }
    const BP = INFO.border || []; if (BP.length > 4) { const W2 = 7, pos = [], uv = [], idx = [];
      for (let i = 0; i < BP.length; i++) { const a = BP[Math.max(0, i - 1)], b = BP[Math.min(BP.length - 1, i + 1)], p = BP[i]; let dx = b[0] - a[0], dz = b[2] - a[2]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
        pos.push(p[0] - dz * W2, p[1] + 0.15, p[2] + dx * W2, p[0] + dz * W2, p[1] + 0.15, p[2] - dx * W2); uv.push(0, i, 1, i); if (i) { const k = (i - 1) * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
      const m = new THREE.ShaderMaterial({ uniforms: Object.assign(ribU, { uC: { value: new THREE.Vector3(HG.r, HG.g, HG.b) } }), transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
        vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: 'uniform float uK, uT; uniform vec3 uC; varying vec2 vU; void main(){ float d = abs(vU.x - 0.5) * 2.0; float a = exp(-d * d * 6.0) * 0.42 + exp(-d * d * 60.0) * 0.4; float run = 0.85 + 0.15 * sin(vU.y * 0.25 - uT * 2.0); gl_FragColor = vec4(mix(uC * 0.9, mix(uC, vec3(1.0), 0.45), exp(-d * d * 60.0)), clamp(a * uK * run, 0.0, 0.85)); }' });
      const rib = new THREE.Mesh(g, m); rib.name = 'borderGlow'; rib.renderOrder = 6; rib.frustumCulled = false; model.add(rib); } } catch (err) { console.warn('border', err); }

  // ---------- a fine grain on the ground: the low sun catches the land ----------
  try { if (part.ground) { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), id = x.createImageData(256, 256);
      const H = new Float32Array(256 * 256); let s = 7; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
      for (let o = 0; o < 6; o++) { const f = 2 ** (o + 2), amp = 1 / (o + 1.2), G = []; for (let i = 0; i < f * f; i++) G.push(r());
        for (let j = 0; j < 256; j++) for (let i = 0; i < 256; i++) { const u = i / 256 * f, w = j / 256 * f, i0 = Math.floor(u), j0 = Math.floor(w), a = u - i0, b = w - j0, Pq = (p, q) => G[(q % f) * f + (p % f)];
          const aa = a * a * (3 - 2 * a), bb = b * b * (3 - 2 * b); H[j * 256 + i] += amp * ((Pq(i0, j0) * (1 - aa) + Pq(i0 + 1, j0) * aa) * (1 - bb) + (Pq(i0, j0 + 1) * (1 - aa) + Pq(i0 + 1, j0 + 1) * aa) * bb); } }
      for (let j = 0; j < 256; j++) for (let i = 0; i < 256; i++) { const k = (j * 256 + i) * 4, dx = H[j * 256 + (i + 1) % 256] - H[j * 256 + (i + 255) % 256], dz = H[((j + 1) % 256) * 256 + i] - H[((j + 255) % 256) * 256 + i];
        const nn = new THREE.Vector3(-dx * 3, -dz * 3, 1).normalize(); id.data[k] = (nn.x * 0.5 + 0.5) * 255; id.data[k + 1] = (nn.y * 0.5 + 0.5) * 255; id.data[k + 2] = (nn.z * 0.5 + 0.5) * 255; id.data[k + 3] = 255; }
      x.putImageData(id, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(150, 150); t.anisotropy = 4;
      part.ground.traverse(o => { if (o.isMesh && o.material && o.material.map) { o.material.normalMap = t; o.material.normalScale = new THREE.Vector2(0.35, 0.35); o.material.roughness = 1; o.material.metalness = 0; o.material.envMapIntensity = Math.min(o.material.envMapIntensity ?? 1, 0.35); o.material.needsUpdate = true; /* matte: grass never shines */ } }); } } catch (err) { console.warn('grain', err); }

  // ---------- wildlife by the water: the heron wades and fishes, gulls glide over the lake ----------
  const WD = INFO.wild || {}, PYw = (INFO.protoAt || [0, -8, 0])[1];
  const kidW = (name) => { if (!part[name]) return null; const g = new THREE.Group(), inner = part[name].clone(true); inner.visible = true; inner.position.set(0, -PYw, 0); g.add(inner); g.traverse(o => { if (o.isMesh) o.castShadow = true; }); root.add(g); return g; };
  let heron = null, hb = null; if (WD.heron) { heron = kidW('proto_heron'); if (heron) { hb = WD.heron; heron.position.set(hb.at[0], hb.y, hb.at[1]); heron.rotation.y = hb.ry; } }
  const gulls = []; if (WD.gulls) for (let i = 0; i < (WD.gulls.n || 3); i++) { const g = kidW('proto_gull'); if (g) gulls.push({ g, ph: i * 2.1, r: WD.gulls.r * (0.7 + 0.18 * i), y: WD.gulls.y + i * 4, dir: i % 2 ? -1 : 1, sp: 0.16 - i * 0.02 }); }
  function wildTick(dt, t) {
    if (heron && hb) { const P = 16, c = reduced ? 3 : t % P, side = [Math.cos(hb.ry), -Math.sin(hb.ry)];
      // a few slow steps along the shallows, stand, peer, strike, swallow, step back
      const w = c < 4 ? sm(c / 4) : c < 12 ? 1 : 1 - sm((c - 12) / 4), off = (w - 0.5) * (hb.wade || 6);
      heron.position.set(hb.at[0] + side[0] * off, hb.y + (c < 4 || c > 12 ? Math.abs(Math.sin(c * 3.2)) * 0.04 : 0), hb.at[1] + side[1] * off);
      const walkDir = c < 4 ? 1 : c > 12 ? -1 : 0, face = walkDir ? Math.atan2(side[0] * walkDir, side[1] * walkDir) : hb.ry;
      heron.rotation.y += (((face - heron.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * Math.min(1, 3 * dt);
      const strike = c > 8.2 && c < 8.9 ? Math.sin((c - 8.2) / 0.7 * Math.PI) : 0, peer = c > 5 && c < 8.2 ? 0.18 : 0;
      heron.rotation.x = reduced ? 0 : peer + strike * 0.55; }
    gulls.forEach(G => { const a = G.ph + (reduced ? 0 : t * G.sp * G.dir), c0 = WD.gulls.c; G.g.position.set(c0[0] + Math.cos(a) * G.r, G.y + Math.sin(t * 0.5 + G.ph) * 1.5, c0[1] + Math.sin(a) * G.r);
      G.g.rotation.set(0, Math.atan2(-Math.sin(a) * G.dir, Math.cos(a) * G.dir), -0.35 * G.dir, 'YXZ'); });
  }

  // ---------- every frame ----------
  let clock = 0;
  function tick(dt, state = {}) { base.tick(dt, state); clock += dt;
    if (part.growtrees) part.growtrees.visible = !state.growOn;
    waterT.value = reduced ? 0 : clock * 1.8;
    if (DV.tick) DV.tick(dt, clock); tourTick(dt, state);
    if (FX._ringTick) FX._ringTick(clock);
    PEOPLE.tick(dt, clock); wildTick(dt, clock);
    ribU.uT.value = clock; ribU.uK.value = 0.85 + 0.6 * (base.dusk ? base.dusk() : 0); }
  window.__riverbend = { part, get clock() { return clock; }, wild: { heron, gulls } };
  return { fx: FX, tick, dusk: base.dusk };
}
