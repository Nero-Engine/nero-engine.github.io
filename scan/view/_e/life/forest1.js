// Magical Forest Boutique Retreat and RV life layer (11-11-2026): life1 (people, the golf cart, cars on Clark Road, sunset, the build) plus the resort's own pieces.
// Always on: the funny touch (a raccoon raids the cooler by the pool, pulls out a fish, waddles off to eat it, and comes back), a guest's motorhome
// arriving down the drive to an empty site, a canoe on the fishing pond, the fountain and fish rising on the ponds, moving water.
// At sunset: the string lights, the drive lamps, the hookup lamps and the fire pit come on, fireflies over the ponds (the stays' windows and the pool
// light up through life1).
// Buttons along the bottom (after the fact chips): Find your cabin, Cooler bandit.
// Fact card effects (listing.json fx types): area (the resort shrinks to a point and the Houston area map draws its drive routes), forestGrow (Room to grow:
// the film's three ideas build in light: two more treehouses, an event pavilion and three more RV sites).
// It moves in the web viewer only. The AR file stays a still model.
let THREE;

export async function init(X) {
  THREE = X.THREE;
  const v = new URL(import.meta.url).searchParams.get('l1');
  const base = await (await import('./life1.js' + (v ? '?v=' + v : ''))).init(X);
  const { model, part, MATS, INFO, SC, D, camera, controls, NV, glowM, goView, GROW } = X; const GM = X.GLOWMATS || [];
  const reduced = !!NV.reduced, T = NV.beacon || (() => {}), S = INFO.scale, R = INFO.R, F = INFO.forest || {}, PY = (INFO.protoAt || [0, -8, 0])[1];
  const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), sm = (x) => { x = cl(x); return x * x * (3 - 2 * x); };
  const dusk01 = () => (base.dusk ? base.dusk() : 0);
  const HOME = SC.home, K = 1.6;
  const root = new THREE.Group(); root.name = 'forest_life'; model.add(root);
  // the hidden pieces never show in place (they live inside the plinth)
  Object.keys(part).filter(n => n.startsWith('proto_')).forEach(n => { part[n].visible = false; });

  // ---------- small helpers ----------
  const tv = new THREE.Vector3();
  const mkTag = (cls = 'tag') => { const el = document.createElement('div'); el.className = cls; el.style.zIndex = 3; el.style.display = 'none'; document.body.appendChild(el); return el; };
  function tagTo(el, p, text) { tv.copy(p); model.localToWorld(tv); tv.project(camera); if (tv.z > 1 || Math.abs(tv.x) > 1.1 || Math.abs(tv.y) > 1.1) { el.style.display = 'none'; return; }
    if (el.textContent !== text) el.textContent = text; el.style.display = 'block'; const hw = el.offsetWidth / 2 + 8, x = Math.min(innerWidth - hw, Math.max(hw, (tv.x * 0.5 + 0.5) * innerWidth));
    const y = Math.max(120, (-tv.y * 0.5 + 0.5) * innerHeight - 8); el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
    // never over the fact card or the buttons
    const bx = document.getElementById('bottom'); if (bx) { const r = bx.getBoundingClientRect(), cb = document.getElementById('card'), top = cb && cb.style.display === 'block' ? cb.getBoundingClientRect().top : r.top + 40;
      if (y > top - 2 && x + hw > r.left && x - hw < r.right) el.style.display = 'none'; } }
  // a solid copy of a hidden piece, moved back up to the origin
  function piece(name, parent = root, y0 = PY) { const p = part[name]; if (!p) return null; const G = new THREE.Group();
    p.traverse(o => { if (!o.isMesh) return; o.updateMatrix(); const g = o.geometry.clone(); g.applyMatrix4(o.matrix); g.translate(0, -y0, 0); const m = new THREE.Mesh(g, o.material); m.castShadow = true; m.frustumCulled = false; G.add(m); });
    parent.add(G); return G; }
  const softTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  function puffs(srcs, n, o) { const N = srcs.length * n, pos = new Float32Array(N * 3), seed = new Float32Array(N); for (let i = 0; i < N; i++) seed[i] = Math.random();
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({ map: softTex, color: new THREE.Color(o.color), size: o.size * S, transparent: true, opacity: 0, depthWrite: false, blending: o.add ? THREE.AdditiveBlending : THREE.NormalBlending, toneMapped: !o.add });
    const p = new THREE.Points(g, m); p.frustumCulled = false; p.visible = false; root.add(p);
    return { p, m, update(t, k) { p.visible = k > 0.01; m.opacity = o.op * k; if (!p.visible) return;
      for (let i = 0; i < N; i++) { const s = srcs[(i / n) | 0], f = (t * o.rate + seed[i]) % 1, a = seed[i] * 40;
        if (o.fountain) { const r = o.spread * (0.4 + seed[i] * 0.6), up = o.rise * 4 * f * (1 - f); pos[i * 3] = s.x + Math.cos(a) * r * f; pos[i * 3 + 1] = s.y + up; pos[i * 3 + 2] = s.z + Math.sin(a) * r * f; }
        else { pos[i * 3] = s.x + Math.sin(a + t * 0.7) * o.spread * (0.3 + f) + (o.drift || 0) * f; pos[i * 3 + 1] = s.y + f * o.rise; pos[i * 3 + 2] = s.z + Math.cos(a * 1.3 + t * 0.5) * o.spread * (0.3 + f); } }
      g.attributes.position.needsUpdate = true; } }; }
  const poly = (pts) => { const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1])); const len = cum[cum.length - 1] || 1;
    return { len, at(d, o) { d = cl(d, 0, len); let i = 1; while (i < cum.length - 1 && cum[i] < d) i++; const f = (d - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1); o.lerpVectors(pts[i - 1], pts[i], f);
      return Math.atan2(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z); } }; };
  const P3 = (a, y = 0) => new THREE.Vector3(a[0], y, a[1]);
  const angTo = (a, b, k) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return a + d * k; };

  // ---------- moving water: random ripples in the ponds and the pool (Karoo's water, smaller waves for small ponds) ----------
  const waterT = { value: 0 };
  MATS.filter(m => ['pond_turquoise', 'pond_deep', 'pool_water'].includes(m.name)).forEach(m => { const small = m.name === 'pool_water'; m.normalMap = null; m.roughness = small ? 0.12 : 0.2; m.metalness = small ? 0.05 : 0.15; m.envMapIntensity = 0.8;
    const prev = m.onBeforeCompile;
    m.onBeforeCompile = (sh, r) => { if (prev) prev(sh, r); sh.uniforms.uWT = waterT;
      sh.vertexShader = 'varying vec2 vWxz;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vWxz = transformed.xz;');
      sh.fragmentShader = 'uniform float uWT;\nvarying vec2 vWxz;\n' + sh.fragmentShader
        .replace('#include <color_fragment>', `#include <color_fragment>
  { float h = wN(vWxz * 0.25 + vec2(uWT * 0.02, 0.0)); diffuseColor.rgb *= 0.9 + 0.18 * h; }`)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
  { vec2 p = vWxz * ${small ? '1.6' : '1.0'}; float t = uWT, e = 0.15, fw = length(fwidth(p));
    vec2 g = wGrad(p * 0.5 + vec2(t * 0.08, t * 0.05), e) * 0.5;
    g += wGrad(p * 1.3 + vec2(-t * 0.14, t * 0.11), e) * 1.3 * 0.55 * clamp(1.6 - fw * 1.2, 0.0, 1.0);
    g += wGrad(p * 3.1 + vec2(t * 0.25, -t * 0.2), e) * 3.1 * 0.25 * clamp(1.4 - fw * 3.0, 0.0, 1.0);
    normal = normalize((viewMatrix * vec4(normalize(vec3(-g.x * 0.22, 1.0, -g.y * 0.22)), 0.0)).xyz); }`)
        .replace('void main() {', `float wH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float wN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(wH(i), wH(i + vec2(1.0, 0.0)), f.x), mix(wH(i + vec2(0.0, 1.0)), wH(i + vec2(1.0, 1.0)), f.x), f.y); }
vec2 wGrad(vec2 p, float e) { float c = wN(p); return vec2(wN(p + vec2(e, 0.0)) - c, wN(p + vec2(0.0, e)) - c) / e; }
void main() {`); };
    m.customProgramCacheKey = () => 'forestWater1' + (small ? 'p' : ''); m.needsUpdate = true; });

  // the water sat only 12 cm above the ground photo and lost to it from far away (depth precision): lift the water a little, as on Karoo
  if (part.water) part.water.position.y = 0.22;
  // ---------- ripple rings: the fountain on the deep pond, fish rising on both ponds ----------
  const WY = (INFO.waterY ?? 0.12) + 0.27;
  const ringM = () => new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
  const ripples = []; const addRipple = (x, z, rmax, life, op) => { const m = ringM(), r = new THREE.Mesh(new THREE.RingGeometry(0.86, 1, 40).rotateX(-Math.PI / 2), m); r.position.set(x, WY, z); r.visible = false; root.add(r);
    const o = { r, m, x, z, rmax, life, op, t: -1 }; ripples.push(o); return o; };
  const fountainC = F.fountain ? P3(F.fountain, WY) : null;
  const fRings = fountainC ? [0, 1, 2].map(i => Object.assign(addRipple(fountainC.x, fountainC.z, 4.2, 3.6, 0.35), { t: i * 1.2, loop: true })) : [];
  const fishRings = [0, 1, 2].map(() => addRipple(0, 0, 2.2, 2.4, 0.4));
  const pondOf = (pd) => { if (!pd) return null; const xs = pd.pts.map(p => p[0]), zs = pd.pts.map(p => p[1]); return { c: P3(pd.c), r: 0.5 * Math.min(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs)) }; };
  const PONDS = [pondOf(F.pond1), pondOf(F.pond2)].filter(Boolean);
  let fishClock = 0;
  const spray = fountainC ? puffs([new THREE.Vector3(fountainC.x, WY + 0.2, fountainC.z)], 70, { color: '#eef8ff', size: 0.5, op: 0.75, rate: 0.55, rise: 2.6, spread: 1.5, fountain: true }) : null;
  function rippleTick(dt, t) {
    for (const o of ripples) { if (o.t < 0) { o.r.visible = false; continue; } o.t += dt; if (o.loop && o.t > o.life) o.t -= o.life; const f = o.t / o.life;
      if (f >= 1) { o.t = -1; o.r.visible = false; continue; } o.r.visible = true; const s = 0.3 + o.rmax * f; o.r.scale.setScalar(s); o.m.opacity = o.op * (1 - f) * Math.min(1, f * 6); }
    fishClock -= dt; if (fishClock <= 0 && PONDS.length && !reduced) { fishClock = 2.5 + Math.random() * 4; const o = fishRings.find(f => f.t < 0); if (o) { const pd = PONDS[(Math.random() * PONDS.length) | 0], a = Math.random() * 6.28, rr = Math.random() * pd.r * 0.55;
      o.x = pd.c.x + Math.cos(a) * rr; o.z = pd.c.z + Math.sin(a) * rr; if (fountainC && Math.hypot(o.x - fountainC.x, o.z - fountainC.z) < 4) o.x += 5; o.r.position.set(o.x, WY, o.z); o.t = 0; } }
  }

  // ---------- the funny touch: the cooler bandit ----------
  // A raccoon (grey, black mask, ringed tail) comes out of the pines, stands up at the cooler by the pool, flips the lid, rummages, pulls out a fish,
  // the lid slams, it waddles back to the trees to eat it, then comes back for more. 46 second loop.
  const RAC = (() => { if (!F.cooler || !part.proto_rac_body) return null;
    const cooler = new THREE.Group(); cooler.position.copy(P3(F.cooler, 0.02)); cooler.rotation.y = F.coolerFace || 0; root.add(cooler); piece('proto_cooler', cooler);
    const hinge = new THREE.Group(); hinge.position.set(0, 0.38 * K, -0.21 * K); cooler.add(hinge); piece('proto_cooler_lid', hinge).position.z = -0.21 * K;
    const rac = new THREE.Group(); rac.position.copy(P3(F.den, 0.02)); root.add(rac);
    const pitch = new THREE.Group(); pitch.position.z = -0.14 * K; rac.add(pitch); const bod = new THREE.Group(); bod.position.z = 0.14 * K; pitch.add(bod);
    piece('proto_rac_body', bod);
    const headP = new THREE.Group(); headP.position.set(0, 0.32 * K, 0.2 * K); bod.add(headP); piece('proto_rac_head', headP);
    const tailP = new THREE.Group(); tailP.position.set(0, 0.28 * K, -0.24 * K); bod.add(tailP); piece('proto_rac_tail', tailP);
    const legs = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz]) => { const l = new THREE.Group(); l.position.set(sx * 0.085 * K, 0.2 * K, sz * 0.15 * K); bod.add(l); piece('proto_rac_leg', l); return { l, ph: (sx * sz > 0 ? 0 : Math.PI) }; });
    const fish = piece('proto_fish', root); fish.visible = false;
    const front = new THREE.Vector3(0, 0, 0.2 * K + 0.62 * K);
    cooler.updateMatrix(); const spot = front.clone().applyMatrix4(cooler.matrix); spot.y = 0.02;
    const den = P3(F.den, 0.02), faceC = (F.coolerFace || 0) + Math.PI;
    const there = poly([den, spot]), back = poly([spot, den]);
    const say = mkTag('tag'); say.style.fontSize = '11px';
    const LOOP = 46, mouth = new THREE.Vector3();
    return { cooler, hinge, rac, pitch, bod, headP, tailP, legs, fish, spot, den, faceC, there, back, say, LOOP, mouth };
  })();
  function racTick(t0) { if (!RAC) return; const A = RAC, k = ((t0 % A.LOOP) + A.LOOP) % A.LOOP, t = t0;
    let walk = 0, pitch = 0, headX = 0.1, lid = 0, yaw = A.rac.rotation.y, fish = 'hide', fishS = 1, talk = '';
    if (k < 9) { yaw = A.there.at(A.there.len * sm(k / 9), A.rac.position); walk = 1; }
    else if (k < 17) { A.rac.position.copy(A.spot); yaw = angTo(A.rac.rotation.y, A.faceC, 0.15);
      if (k < 10) pitch = 0;
      else if (k < 11.5) { pitch = -0.75 * sm((k - 10) / 1.2); lid = sm((k - 10.6) / 0.8); }
      else if (k < 15.5) { lid = 1; pitch = -0.75 + 1.05 * sm((k - 11.5) / 0.6); headX = 0.5 + Math.sin(t * 13) * 0.25; talk = 'rummage rummage'; }
      else { lid = 1 - sm((k - 16.1) / 0.25); pitch = 0.3 * (1 - sm((k - 15.5) / 0.6)); fish = 'mouth'; if (k > 16.1 && k < 16.9) talk = 'BANG'; } }
    else if (k < 26.5) { fish = 'mouth'; if (k < 17.8) { A.rac.position.copy(A.spot); yaw = angTo(A.rac.rotation.y, A.faceC + Math.PI, 0.12); } else { yaw = A.back.at(A.back.len * sm((k - 17.8) / 8.7), A.rac.position); walk = 1; } }
    else if (k < 40) { A.rac.position.copy(A.den); yaw = angTo(A.rac.rotation.y, A.faceC + Math.PI + 0.6, 0.05); pitch = -0.55 * sm((k - 26.5) / 0.8); headX = 0.35 + Math.abs(Math.sin(t * 7)) * 0.25; fish = k < 37 ? 'mouth' : 'hide'; fishS = 1 - 0.85 * sm((k - 28) / 9); if (k > 29 && k < 33) talk = 'nom nom'; }
    else { A.rac.position.copy(A.den); yaw = angTo(A.rac.rotation.y, A.faceC + Math.PI + Math.sin(t * 0.8) * 0.8, 0.05); headX = 0.05; }
    if (reduced) { walk = 0; }
    A.rac.rotation.y = yaw; A.pitch.rotation.x = pitch; A.headP.rotation.x = headX; A.headP.rotation.y = walk ? 0 : Math.sin(t * 0.9) * 0.3 * (k > 40 ? 1 : 0.3);
    A.tailP.rotation.y = Math.sin(t * (walk ? 6 : 1.6)) * (walk ? 0.35 : 0.2); A.tailP.rotation.x = -0.15;
    A.bod.position.y = walk ? Math.abs(Math.sin(t * 8)) * 0.03 : 0; A.bod.rotation.z = walk ? Math.sin(t * 8) * 0.1 : 0;
    A.legs.forEach(({ l, ph }, i) => { l.rotation.x = walk ? Math.sin(t * 8 + ph) * 0.6 : (pitch < -0.3 && i < 2 ? -0.9 : 0); });
    A.hinge.rotation.x = -1.95 * lid;
    A.fish.visible = fish === 'mouth';
    if (fish === 'mouth') { A.headP.updateWorldMatrix(true, false); A.mouth.set(0, -0.02 * K, 0.27 * K); A.headP.localToWorld(A.mouth); root.worldToLocal(A.mouth); A.fish.position.copy(A.mouth);
      A.fish.rotation.set(0, A.rac.rotation.y + Math.PI / 2, Math.sin(t * 10) * 0.3); A.fish.scale.setScalar(Math.max(0.05, fishS)); }
    if (talk && !reduced && mode === 'bandit') tagTo(A.say, A.rac.position.clone().setY(2.4), talk); else A.say.style.display = 'none'; }

  // ---------- a guest's motorhome arrives: in from Clark Road, along the drive and onto an empty site, stays a while, then leaves ----------
  const RVA = (() => { if (!F.rvPath || !part.proto_rv) return null; const g = new THREE.Group(); root.add(g); const p = piece('proto_rv', g); const bb = new THREE.Box3().setFromObject(p); const longX = (bb.max.x - bb.min.x) > (bb.max.z - bb.min.z);
    const pts = F.rvPath.map(q => P3(q, 0.3)); const inP = poly(pts), outP = poly([...pts].reverse()); return { g, longX, inP, outP, LOOP: 150, h: null }; })();
  const rvo = new THREE.Vector3();
  function rvTick(t0, grow) { if (!RVA) return; const A = RVA, k = ((t0 + 20) % A.LOOP), vIn = 6.5, tIn = A.inP.len / vIn, hold = 50, tOut = A.outP.len / vIn;
    let dir, vis = true, s = 1;
    if (k < tIn) { const f = k / tIn; dir = A.inP.at(A.inP.len * (1 - Math.pow(1 - f, 1.6)), rvo); s = cl(k / 1.2); }
    else if (k < tIn + hold) { dir = A.inP.at(A.inP.len, rvo); }
    else if (k < tIn + hold + tOut) { const f = (k - tIn - hold) / tOut; dir = A.outP.at(A.outP.len * Math.pow(f, 1.4), rvo); s = cl((tIn + hold + tOut - k) / 1.2); }
    else { vis = false; }
    A.g.visible = vis && !grow; if (!A.g.visible) return; const want = A.longX ? dir - Math.PI / 2 : dir; A.h = A.h == null || reduced ? want : angTo(A.h, want, 0.08);
    A.g.position.copy(rvo); A.g.rotation.y = A.h; A.g.scale.setScalar(Math.max(1e-3, s)); }

  // ---------- a canoe on the fishing pond (kayaks and canoes come with every rental) ----------
  const CAN = (() => { if (!F.canoe || !part.proto_canoe) return null; const g = new THREE.Group(); root.add(g); piece('proto_canoe', g); const pad = new THREE.Group(); pad.position.set(0, 0.75 * 1, -0.4); g.add(pad); piece('proto_paddle', pad);
    const pts = F.canoe.map(q => P3(q, WY - 0.08)); pts.push(pts[0].clone()); return { g, pad, P: poly(pts), d: 0 }; })();
  function canoeTick(dt, t) { if (!CAN) return; CAN.d = (CAN.d + (reduced ? 0 : dt * 0.7)) % CAN.P.len; const yaw = CAN.P.at(CAN.d, CAN.g.position); CAN.g.rotation.y = angTo(CAN.g.rotation.y, yaw, 0.05);
    CAN.g.rotation.z = Math.sin(t * 1.6) * 0.04; CAN.pad.rotation.x = Math.sin(t * 2.4) * 0.7; CAN.pad.rotation.z = Math.sin(t * 1.2) > 0 ? 0.5 : -0.5; }

  // ---------- dusk: string lights, drive lamps, hookup lamps, the fire pit, fireflies ----------
  const WARM = new THREE.Color('#ffc27a');
  const DUSKM = [['bulb', 2.6], ['lamp_head', 2.2], ['pad_lamp', 1.6]].flatMap(([n, k]) => MATS.filter(m => m.name === n).map(m => ({ m, k })));
  const fireC = F.fire ? P3(F.fire, 0.45) : null;
  const flameM = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff8a2a').multiplyScalar(2.4), toneMapped: false, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const flames = fireC ? [0, 1, 2, 3].map(i => { const f = new THREE.Mesh(new THREE.ConeGeometry(0.32, 1.2, 6).translate(0, 0.6, 0), flameM); f.position.copy(fireC).add(new THREE.Vector3(Math.cos(i * 1.7) * 0.3, 0, Math.sin(i * 1.7) * 0.3)); root.add(f); return f; }) : [];
  const embers = fireC ? puffs([fireC], 28, { color: '#ff9a3a', size: 0.32, op: 1, rate: 0.35, rise: 4.5, spread: 0.45, drift: 0.3, add: true }) : null;
  const fireGlow = fireC ? (() => { const m = new THREE.MeshBasicMaterial({ map: softTex, color: new THREE.Color('#ff9a4a').multiplyScalar(1.6), toneMapped: false, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    const p = new THREE.Mesh(new THREE.PlaneGeometry(9, 9).rotateX(-Math.PI / 2), m); p.position.copy(fireC).setY(0.3); root.add(p); return m; })() : null;
  const flySrc = PONDS.flatMap(pd => [0, 1, 2, 3, 4, 5].map(i => new THREE.Vector3(pd.c.x + Math.cos(i) * (pd.r + 4), 1.2, pd.c.z + Math.sin(i) * (pd.r + 4))));
  const flies = flySrc.length ? (() => { const N = flySrc.length * 4, pos = new Float32Array(N * 3), sd = new Float32Array(N).map(() => Math.random()); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({ map: softTex, color: new THREE.Color('#d8ff7a').multiplyScalar(2), size: 0.5 * S, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    const p = new THREE.Points(g, m); p.frustumCulled = false; root.add(p);
    return { update(t, k) { p.visible = k > 0.02; m.opacity = k; if (!p.visible) return; for (let i = 0; i < N; i++) { const s = flySrc[(i / 4) | 0], a = sd[i] * 50 + t * (0.2 + sd[i] * 0.3), on = Math.max(0, Math.sin(t * (1 + sd[i] * 2) + sd[i] * 30));
      pos[i * 3] = s.x + Math.sin(a) * 4; pos[i * 3 + 1] = s.y + Math.sin(a * 1.7) * 0.8 + (on > 0.2 ? 0 : -60); pos[i * 3 + 2] = s.z + Math.cos(a * 0.8) * 4; } g.attributes.position.needsUpdate = true; } }; })() : null;
  function duskTick(t, k, sel) { const lk = sm((k - 0.3) / 0.6);
    DUSKM.forEach(({ m, k: kk }) => { if (sel && sel.parts && sel.parts.includes(m.userData.p)) return; m.emissive.copy(WARM).multiplyScalar(kk * lk * (m.name === 'bulb' ? 0.92 + 0.08 * Math.sin(t * 3 + m.id) : 1)); m.emissiveIntensity = 1; });
    const fk = Math.max(0.35, lk); flameM.opacity = fk * (0.75 + 0.25 * Math.sin(t * 17)); flames.forEach((f, i) => { f.scale.set(1, 0.7 + 0.35 * Math.abs(Math.sin(t * 9 + i * 2)), 1); f.rotation.y = t * (1 + i * 0.3); });
    if (embers) embers.update(t, fk); if (fireGlow) fireGlow.opacity = 0.2 + 0.55 * lk; if (flies) flies.update(t, lk); }

  // ---------- the bottom buttons (custom modes) ----------
  const chips = document.getElementById('chips'), card = document.getElementById('card');
  let mode = null, curSel = null, curGrow = false; const BTN = {}, MODES = {};
  const minD0 = controls.minDistance;
  function showMyCard(c) { if (!card) return; card.className = ''; card.style.display = 'block'; document.getElementById('ck').textContent = c.k;
    document.getElementById('ch').innerHTML = c.h; document.getElementById('cp').textContent = c.p; const cs = document.getElementById('cs'); cs.textContent = c.s;
    for (const k of c.links || []) { const a = document.createElement('a'); a.href = k.u; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = k.t; cs.append(' · ', a); }
    if (c.links && c.links.length && D.checked) cs.append(' · checked ' + D.checked);
    const n = document.getElementById('cnum'); if (n) n.textContent = ''; const rb = document.getElementById('reset'); if (rb) rb.hidden = false; const mini = document.getElementById('mini'); if (mini) mini.hidden = true; }
  function setChip(id) { chips.querySelectorAll('.chip').forEach(b => { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); }); if (id && BTN[id]) { BTN[id].classList.add('on'); BTN[id].setAttribute('aria-pressed', 'true'); } }
  function startMode(id, arg) { if (mode) endMode(true); if (curGrow && window.__grow) window.__grow(false, true); if (window.__choose) window.__choose(null);
    mode = id; controls.autoRotate = false; setChip(id); T('tap', 'k ' + id); MODES[id].start(arg); }
  function endMode(quiet) { if (!mode) return; const m = MODES[mode]; mode = null; m.end(); controls.minDistance = minD0; setChip(null); if (!quiet) { if (card) card.style.display = 'none'; goView(HOME); } }
  { const rb = document.getElementById('reset'); if (rb) rb.addEventListener('click', () => { if (mode) endMode(false); }); }
  const CABINS_URL = 'https://www.magicalforestresort.com/cabins/', AMEN_URL = 'https://www.magicalforestresort.com/amenities/';

  // Cooler bandit: fly to the pool deck and watch the raccoon
  MODES.bandit = { start() { if (!RAC) return; const c = RAC.cooler.position; controls.minDistance = Math.min(minD0, 0.01);
      const dn = RAC.den, az = (F.coolerFace || 0) - Math.PI / 2, mx = c.x * 0.65 + dn.x * 0.35 + Math.sin(az) * 3, mz = c.z * 0.65 + dn.z * 0.35 + Math.cos(az) * 3;
      goView({ at: [mx, 0.5, mz], dist: 19, el: 0.5, az }, 1.6);
      showMyCard({ k: 'Just for fun', h: 'The <em>cooler bandit</em>', p: 'Pine woods, a fishing pond and a cooler left by the pool. A raccoon has worked out the rest. An illustration for fun, not a guest review.',
        s: 'Illustration only. Fishing pond, pool and fire pits: magicalforestresort.com amenities page', links: [{ t: 'Amenities page', u: AMEN_URL }] }); }, end() { if (RAC) RAC.say.style.display = 'none'; } };

  // Find your cabin: pick a stay, then the walk to the pool, the pavilion, the fire pit or the entrance, along the drive, the lane and the pond paths
  // drawn on the resort's own site map. Positions from the site map in the listing photos, not to scale.
  const WF = INFO.wf, STAYS = INFO.stays || {}, SK = ['lonestar', 'treehouse', 'hideout', 'container'].filter(k => STAYS[k]);
  const G2 = (() => { if (!WF) return null; const nodes = [], adj = [], lane = [];
    WF.lanes.forEach((L, li) => { let prev = -1; for (let i = 0; i < L.length; i++) { const [ax, az] = L[i]; if (i > 0) { const [bx, bz] = L[i - 1], n = Math.max(1, Math.ceil(Math.hypot(ax - bx, az - bz) / 2));
        for (let s = 1; s <= n; s++) { const x = bx + (ax - bx) * s / n, z = bz + (az - bz) * s / n, id = nodes.length; nodes.push([x, z]); adj.push([]); lane.push(li); if (prev >= 0) { const d = Math.hypot(x - nodes[prev][0], z - nodes[prev][1]); adj[id].push([prev, d]); adj[prev].push([id, d]); } prev = id; } }
        else { const id = nodes.length; nodes.push([ax, az]); adj.push([]); lane.push(li); prev = id; } } });
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) if (lane[i] !== lane[j]) { const d = Math.hypot(nodes[i][0] - nodes[j][0], nodes[i][1] - nodes[j][1]); if (d < 1.6) { adj[i].push([j, d]); adj[j].push([i, d]); } }
    const near = (p) => { let b = 0, bd = 1e9; nodes.forEach((n, i) => { const d = Math.hypot(n[0] - p[0], n[1] - p[1]); if (d < bd) { bd = d; b = i; } }); return b; };
    const route = (a, b) => { const s = near(a), e = near(b), dist = new Float64Array(nodes.length).fill(1e18), from = new Int32Array(nodes.length).fill(-1), done = new Uint8Array(nodes.length); dist[s] = 0;
      for (;;) { let u = -1, ud = 1e18; for (let i = 0; i < nodes.length; i++) if (!done[i] && dist[i] < ud) { ud = dist[i]; u = i; } if (u < 0 || u === e) break; done[u] = 1;
        for (const [w, d] of adj[u]) if (dist[u] + d < dist[w]) { dist[w] = dist[u] + d; from[w] = u; } }
      if (dist[e] >= 1e17) return null; const out = []; for (let u = e; u >= 0; u = from[u]) out.push(nodes[u]); out.reverse(); return [a, ...out, b]; };
    return { route }; })();
  const routeM = glowM(3, { depthWrite: false }); let routeMesh = null, routeT = 0, wfCab = -1, wfDest = null;
  const tagCab = mkTag('tag'), tagDest = mkTag('tag');
  const css = document.createElement('style'); css.textContent = `#fwf { position:fixed; left:12px; right:12px; bottom:calc(env(safe-area-inset-bottom) + 132px); z-index:5; max-width:480px; margin:0 auto; background:var(--panel); border:1px solid rgba(var(--lc),.14); border-radius:14px; padding:10px 12px; display:none; backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); }
    #fwf h4 { margin:0 0 6px; font-size:12px; letter-spacing:.12em; text-transform:uppercase; color:var(--hero); } #fwf .row { display:flex; flex-wrap:wrap; gap:6px; }
    #fwf button { border:1px solid rgba(var(--lc),.18); background:rgba(var(--lc),.07); color:var(--ink); font:600 12.5px var(--font), sans-serif; padding:7px 10px; border-radius:16px; cursor:pointer; }
    #fwf button.on { background:var(--hero); border-color:var(--hero); color:var(--onhero); } #fwf small { opacity:.7; font-weight:500; } #fwf .sub { margin:8px 0 0; } #fwf .x { position:absolute; right:4px; top:2px; border:0; background:none; font-size:20px; padding:4px 8px; }
    #fwf p { margin:7px 0 0; font-size:11.5px; color:var(--muted); }`;
  document.head.appendChild(css);
  const wf = document.createElement('div'); wf.id = 'fwf'; wf.setAttribute('role', 'dialog'); wf.innerHTML = '<button class="x" aria-label="Close">×</button><h4>Find your cabin</h4><div class="row" id="fwfc"></div><div class="row sub" id="fwfd"></div><p>Walks measured along the drive and the pond paths on the resort’s own site map, at an easy pace. Approximate, not to scale.</p>';
  document.body.appendChild(wf);
  const wfc = wf.querySelector('#fwfc'), wfd = wf.querySelector('#fwfd'); wf.querySelector('.x').onclick = () => endMode(false);
  SK.forEach((k, i) => { const s = STAYS[k], b = document.createElement('button'); b.type = 'button'; b.innerHTML = s.name + ' <small>sleeps ' + s.sleeps + '</small>'; b.onclick = () => pickCab(i); wfc.appendChild(b); });
  function clearRoute() { if (routeMesh) { root.remove(routeMesh); routeMesh.geometry.dispose(); routeMesh = null; } wfDest = null; tagDest.style.display = 'none'; }
  function pickCab(i) { wfCab = i; clearRoute(); [...wfc.children].forEach((b, k) => b.classList.toggle('on', k === i)); const s = STAYS[SK[i]]; T('tap', 'cabin ' + SK[i]);
    goView({ at: [s.c[0], 2, s.c[1]], dist: 70, el: 0.8, az: SC.az ?? 0.75 }, 1.2);
    wfd.innerHTML = ''; (WF ? WF.go : []).forEach((d) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = 'Walk to ' + d.label; b.dataset.k = d.id; b.onclick = () => pickDest(d); wfd.appendChild(b); }); }
  function pickDest(d) { clearRoute(); [...wfd.children].forEach(b => b.classList.toggle('on', b.dataset.k === d.id)); const s = STAYS[SK[wfCab]], r = G2 && G2.route(s.door, d.door); T('tap', 'walk ' + d.id); if (!r) return;
    const pts = r.filter((p, k, a) => k === 0 || Math.hypot(p[0] - a[k - 1][0], p[1] - a[k - 1][1]) > 0.4).map(p => new THREE.Vector3(p[0], 0.7, p[1]));
    let len = 0; for (let k = 1; k < pts.length; k++) len += pts[k].distanceTo(pts[k - 1]);
    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.1);
    routeMesh = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(40, Math.round(len)), 0.35, 6, false), routeM); routeMesh.renderOrder = 6; root.add(routeMesh); routeT = 0;
    const min = len / 78; wfDest = { d, end: pts[pts.length - 1], text: min < 1 ? 'under a minute’s walk' : 'about ' + Math.round(min) + ' min walk' };
    const xs = pts.map(p => p.x), zs = pts.map(p => p.z), cx = (Math.min(...xs) + Math.max(...xs)) / 2, cz = (Math.min(...zs) + Math.max(...zs)) / 2, span = Math.max(40, Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs));
    goView({ at: [cx, 0, cz], dist: span * 2.0, el: 0.95, az: SC.az ?? 0.75 }, 1.3); }
  MODES.find = { start() { wf.style.display = 'block'; if (card) card.style.display = 'none'; pickCab(wfCab < 0 ? 0 : wfCab); }, end() { wf.style.display = 'none'; clearRoute(); tagCab.style.display = 'none'; } };

  setTimeout(() => { [['find', 'Find your cabin'], ['bandit', 'Cooler bandit']].forEach(([id, label]) => {
    if (id === 'bandit' && !RAC) return; if (id === 'find' && !(WF && SK.length)) return;
    const b = document.createElement('button'); b.className = 'chip kchip'; b.type = 'button'; b.textContent = label; b.setAttribute('aria-pressed', 'false'); BTN[id] = b;
    b.onclick = () => { if (mode === id) endMode(false); else startMode(id); }; chips.appendChild(b); }); }, 0);

  // ---------- fact card effects ----------
  const FX = Object.assign({}, base.fx);

  // Getting here: the resort shrinks to a point, the Houston area map fades in round it and each drive route draws out from the resort
  // (Valhalla on OpenStreetMap roads, read 10-11-2026, the same minutes as the film)
  const HERO = new THREE.Color(D.theme.hero);
  let areaObj = null, areaP = 0, areaData = null, areaBuilt = false, areaLoading = false; const areaMats = MATS.filter(m => ['ground', 'water'].includes(m.userData.p));
  const fileURL = (n) => { try { return new URL(n, new URL(D.files.glb, location.href)).href; } catch (e) { return n; } };
  const areaTags = [], AY = 0.9;
  function buildArea(g, tex) { const L = areaData, fu = (R - 1.5) / L.R_km;
    const dg = new THREE.CircleGeometry(R - 1.5, 160); dg.rotateX(-Math.PI / 2);
    const dm = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false }); const disc = new THREE.Mesh(dg, dm); disc.position.y = 0.5; disc.renderOrder = 2; g.add(disc); g.userData.dm = dm;
    const rm = glowM(3.2, { depthWrite: false }); g.userData.rm = rm; g.userData.routes = [];
    L.places.forEach((p, i) => { const pts = p.route.map(([x, z]) => new THREE.Vector3(x * fu, AY, z * fu)); const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.05);
      const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.min(600, pts.length * 3), 0.55, 5, false), rm); mesh.renderOrder = 5; mesh.geometry.setDrawRange(0, 0); g.add(mesh);
      const dot = new THREE.Mesh(new THREE.SphereGeometry(1.6, 12, 8), rm); dot.position.set(p.at[0] * fu, AY + 0.6, p.at[1] * fu); dot.scale.setScalar(1e-3); g.add(dot);
      g.userData.routes.push({ mesh, dot, p, end: dot.position.clone().setY(AY + 3), t0: 0.9 + i * 0.35 }); const tg = mkTag('tag'); tg.style.zIndex = 1; areaTags.push(tg); });
    // where the resort is: a beacon of light
    const bm = glowM(4); const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.5, 22, 16, 1, true), bm); beacon.position.set(0, 11, 0); g.add(beacon); g.userData.bm = bm;
    { const tg = mkTag('tag'); tg.style.zIndex = 1; areaTags.push(tg); } areaBuilt = true; }
  const shrinkParts = () => model.children.filter(o => o !== areaObj && o.name !== 'plinth' && !o.userData.isFx && !(o.name || '').startsWith('proto_'));
  FX.area = (c) => { const g = new THREE.Group(); g.userData.isFx = true; areaObj = g;
    const ensure = () => { if (areaBuilt || areaLoading) return; areaLoading = true;
      Promise.all([fetch(fileURL('area.json')).then(r => r.json()), new THREE.TextureLoader().loadAsync(fileURL('area.jpg'))]).then(([j, tex]) => { tex.colorSpace = THREE.SRGBColorSpace; areaData = j; buildArea(g, tex); }).catch(e => console.warn('area', e)); };
    return { obj: g, mat: null, tick: (t) => { ensure(); g.userData.t = t; } }; };
  function areaTick(dt) { const on = !!(areaObj && areaObj.visible && areaBuilt); const t = on ? areaObj.userData.t || 0 : 0;
    areaP = on ? sm((t - 0.2) / 1.6) : Math.max(0, areaP - dt * 1.5);
    if (areaP <= 0 && !on) { if (areaObj && areaObj.userData.wasOn) { shrinkParts().forEach(o => { o.scale.setScalar(1); o.position.y = o.userData.y0 || 0; }); areaMats.forEach(m => { m.opacity = 1; m.transparent = false; m.depthWrite = true; }); areaObj.userData.wasOn = false; }
      areaTags.forEach(el => el.style.display = 'none'); return; }
    if (!areaBuilt) return; areaObj.userData.wasOn = true; const s = 1 + (0.035 - 1) * areaP;
    shrinkParts().forEach(o => { if (o.userData.y0 == null) o.userData.y0 = o.position.y; o.scale.setScalar(s); o.position.y = o.userData.y0 * s + 0.6 * areaP; });
    areaMats.forEach(m => { m.transparent = true; m.opacity = 1 - sm((areaP - 0.2) / 0.5); m.depthWrite = m.opacity > 0.95; });
    const g = areaObj; g.userData.dm.opacity = sm((areaP - 0.1) / 0.6); g.userData.bm.opacity = (on ? sm((t - 1.0) / 0.6) : 0) * (0.7 + 0.3 * Math.sin(t * 3));
    g.userData.rm.opacity = on ? 0.9 : 0;
    g.userData.routes.forEach((r, i) => { const f = on ? sm((t - r.t0) / (1.2 + r.p.min / 40)) : 0; r.mesh.geometry.setDrawRange(0, Math.floor(r.mesh.geometry.index.count * f / 6) * 6); r.dot.scale.setScalar(Math.max(1e-3, sm((f - 0.9) / 0.1)));
      if (f > 0.95) tagTo(areaTags[i], r.end, r.p.label); else areaTags[i].style.display = 'none'; });
    if (on && t > 0.8) tagTo(areaTags[areaTags.length - 1], new THREE.Vector3(0, 24, 0), 'Magical Forest'); else areaTags[areaTags.length - 1].style.display = 'none';
    // no two place tags on top of each other (phones): a later tag that would cover an earlier one is hidden; the beacon label gives way first
    const shown = []; areaTags.forEach(el => { if (el.style.display !== 'block') return; const b = el.getBoundingClientRect();
      if (shown.some(a => b.left < a.right && b.right > a.left && b.top < a.bottom && b.bottom > a.top)) el.style.display = 'none'; else shown.push(b); }); }

  // Room to grow: the film's ideas build in light. Two more treehouses in the pines, an event pavilion for weddings and retreats (life1's build does the
  // three RV sites by the drive, with one motorhome rolling in). The light is tinted toward the broker's colour, about 60% of Stella's, and settles fully.
  const LIGHT = new THREE.Color((SC.life && SC.life.light) || '#a8855a');
  const IDEAS = F.ideas || {}, BIGY = F.bigPY ?? PY;
  let GROWI = [];
  FX.forestGrow = (c) => { const b = base.fx.build(c), G = new THREE.Group(); G.add(b.obj); const items = GROWI = [];
    const ghostM = new THREE.MeshBasicMaterial({ color: LIGHT.clone().multiplyScalar(1.3), toneMapped: false, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }); ghostM.userData.gc = ghostM.color.clone(); GM.push(ghostM);
    const mk = (name, at, ry, t0) => { const holder = new THREE.Group(); holder.position.set(at[0], 0.2, at[1]); holder.rotation.y = ry; G.add(holder); const p = piece(name, holder, BIGY); if (!p) return;
      // own materials, so the light never touches the rest of the model
      const mats = []; p.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.userData = { e0: o.material.emissive.clone() }; mats.push(o.material); } });
      const bb = new THREE.Box3().setFromObject(p), size = bb.getSize(new THREE.Vector3());
      const ghost = new THREE.Mesh(new THREE.BoxGeometry(size.x + 0.8, size.y + 0.8, size.z + 0.8).translate(0, (size.y + 0.8) / 2, 0), ghostM.clone()); ghost.material.userData.gc = ghostM.color.clone(); GM.push(ghost.material); holder.add(ghost);
      items.push({ p, mats, ghost, t0, h: size.y }); };
    (IDEAS.th || []).forEach(([x, z, ry], i) => mk('proto_th', [x, z], ry, 1.0 + i * 0.7));
    if (IDEAS.pav) mk('proto_event', [IDEAS.pav[0], IDEAS.pav[1]], IDEAS.pav[2] || 0, 2.4);
    const lc = LIGHT.clone().multiplyScalar(0.9);
    return { obj: G, mat: b.mat, tick(t0, k, pulse) { b.tick(t0, k, pulse); const t = reduced ? 99 : t0;
      items.forEach(it => { const f = cl((t - it.t0) / 1.6), e = sm(f), settle = sm((t - it.t0 - 1.4) / 2.2);
        it.p.scale.set(1, Math.max(1e-3, e), 1); it.p.visible = f > 0;
        it.mats.forEach(m => { m.emissive.copy(lc).multiplyScalar(1 - settle); m.emissiveIntensity = 1; });
        it.ghost.material.opacity = f > 0 ? 0.32 * Math.sin(Math.PI * cl(f * 1.1)) * (1 - settle) : 0; it.ghost.visible = it.ghost.material.opacity > 0.003; }); } }; };

  // ---------- every frame ----------
  let clock = 0;
  function tick(dt, state = {}) { base.tick(dt, state); clock += dt; curSel = state.sel; curGrow = state.growOn;
    if (mode && (state.sel || state.growOn)) endMode(true);
    const k = dusk01(), t = reduced ? 0 : clock;
    waterT.value = t; rippleTick(dt, clock); if (spray) spray.update(t, 1);
    racTick(reduced ? 20 : clock); rvTick(clock, !!state.growOn); canoeTick(dt, t);
    duskTick(t, k, state.sel);
    if (mode === 'find' && wfCab >= 0) { const s = STAYS[SK[wfCab]]; tagTo(tagCab, new THREE.Vector3(s.top[0], s.top[1] + 3, s.top[2]), s.name + ' · sleeps ' + s.sleeps);
      if (routeMesh && wfDest) { routeT += dt; const n = routeMesh.geometry.index.count; routeMesh.geometry.setDrawRange(0, Math.floor(n * sm(routeT / 1.6) / 6) * 6); routeM.opacity = 0.85 + 0.15 * Math.sin(clock * 3);
        if (routeT > 1.2) tagTo(tagDest, wfDest.end.clone().setY(4), wfDest.d.label + ' · ' + wfDest.text); } }
    areaTick(dt); }

  window.__forest = { part, get mode() { return mode; }, get clock() { return clock; }, RAC, RVA, get grow() { return GROWI; } };
  return { fx: FX, tick, dusk: base.dusk };
}
