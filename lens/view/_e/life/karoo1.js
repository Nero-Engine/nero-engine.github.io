// Karoo Lodge and Cabins life layer (10-11-2026): life1 (people, the car on the drive, sunset) plus Karoo's own pieces.
// Always on: the funny touch (Canada geese chase guests in bathrobes from three cabins' stairs into their hot tubs, taking turns), steam on the tubs at dusk,
// the canvas cabins glowing from inside at dusk.
// Buttons along the bottom (after the fact chips): Sunset, Find your cabin, Peek inside, Stand on the pier, Fire pit night.
// Fact card effects (listing.json fx types): buyout (up to 50 guests of light fill the resort), lake (the resort shrinks onto Smith Mountain Lake and
// the shore lights up from the dam), karooGrow (Room to grow: the lodge roof lifts and the gathering room builds itself in light).
// It moves in the web viewer only. The AR file stays a still model.
let THREE;

export async function init(X) {
  THREE = X.THREE;
  const v = new URL(import.meta.url).searchParams.get('l1');
  const base = await (await import('./life1.js' + (v ? '?v=' + v : ''))).init(X);
  const { model, part, MATS, INFO, SC, D, camera, controls, NV, glowM, goView, renderer } = X;
  const reduced = !!NV.reduced, T = NV.beacon || (() => {}), S = INFO.scale, R = INFO.R, C = INFO.cabins || [], HERO = new THREE.Color(D.theme.hero);
  const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), sm = (x) => { x = cl(x); return x * x * (3 - 2 * x); };
  const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  const dusk01 = () => (base.dusk ? base.dusk() : 0);
  const HOME = SC.home;
  const WARM = new THREE.Color('#ffb46a');
  // cabin local frame (x to the front, the stairs on +z) to model metres
  const toM = (c, x, y, z) => { const cs = Math.cos(c.ry), sn = Math.sin(c.ry); return new THREE.Vector3(c.pos[0] + x * cs + z * sn, y, c.pos[2] - x * sn + z * cs); };
  const BEDS = { Boschendal: 'Two master suites, two queens and two compact bunks, two full bathrooms', Kilimanjaro: 'One queen and one compact bunk', Nakupenda: 'One queen and one twin bunk',
    Stellenbosch: 'One queen and one compact bunk', Bushwillow: 'One queen', Malachite: 'One queen', Rwenzori: 'One queen', Kwango: 'One queen' };
  const WORDN = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
  const CABIN_URL = 'https://www.karooresort.com/karoo-cabins', AMEN_URL = 'https://www.karooresort.com/amenities';

  // ---------- small helpers: tags, simple people, soft particles ----------
  const tv = new THREE.Vector3();
  const mkTag = (cls = 'tag') => { const el = document.createElement('div'); el.className = cls; el.style.zIndex = 3; el.style.display = 'none'; document.body.appendChild(el); return el; };
  function tagTo(el, p, text) { tv.copy(p); model.localToWorld(tv); tv.project(camera); if (tv.z > 1) { el.style.display = 'none'; return; }
    if (el.textContent !== text) el.textContent = text; el.style.display = 'block'; const hw = el.offsetWidth / 2 + 8, x = Math.min(innerWidth - hw, Math.max(hw, (tv.x * 0.5 + 0.5) * innerWidth));
    el.style.transform = `translate(${x}px, ${Math.max(120, (-tv.y * 0.5 + 0.5) * innerHeight - 8)}px) translate(-50%, -100%)`; }
  const std = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: new THREE.Color(c), roughness: 0.8 }, o));
  const mesh = (g, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = true; return o; };
  const root = new THREE.Group(); root.name = 'karoo_life'; model.add(root);
  const softTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  // a rising cloud of soft points from a few sources (steam, embers)
  function puffs(srcs, n, o) { const N = srcs.length * n, pos = new Float32Array(N * 3), seed = new Float32Array(N); for (let i = 0; i < N; i++) seed[i] = Math.random();
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({ map: softTex, color: new THREE.Color(o.color), size: o.size * S, transparent: true, opacity: 0, depthWrite: false, blending: o.add ? THREE.AdditiveBlending : THREE.NormalBlending, toneMapped: !o.add });
    const p = new THREE.Points(g, m); p.frustumCulled = false; p.visible = false; root.add(p);
    return { p, m, update(t, k) { p.visible = k > 0.01; m.opacity = o.op * k; if (!p.visible) return;
      for (let i = 0; i < N; i++) { const s = srcs[(i / n) | 0], f = (t * o.rate + seed[i]) % 1, a = seed[i] * 40;
        pos[i * 3] = s.x + Math.sin(a + t * 0.7) * o.spread * (0.3 + f) + o.drift * f; pos[i * 3 + 1] = s.y + f * o.rise; pos[i * 3 + 2] = s.z + Math.cos(a * 1.3 + t * 0.5) * o.spread * (0.3 + f); }
      g.attributes.position.needsUpdate = true; } }; }
  // a person: shirt colour, pose 'stand' | 'sit'; forward is +z
  function person(shirt, pose = 'stand') { const G = new THREE.Group(), skin = std('#d9a582'), sh = std(shirt), pant = std('#2c3442');
    if (pose === 'sit') { G.add(mesh(new THREE.BoxGeometry(0.36, 0.16, 0.5), pant, 0, 0.42, 0.12), mesh(new THREE.BoxGeometry(0.34, 0.42, 0.14), pant, 0, 0.21, 0.36), mesh(new THREE.BoxGeometry(0.42, 0.56, 0.24), sh, 0, 0.78, -0.06)); }
    else { G.add(mesh(new THREE.BoxGeometry(0.15, 0.88, 0.2), pant, -0.1, 0.44, 0), mesh(new THREE.BoxGeometry(0.15, 0.88, 0.2), pant, 0.1, 0.44, 0), mesh(new THREE.BoxGeometry(0.42, 0.6, 0.24), sh, 0, 1.16, 0)); }
    const hy = pose === 'sit' ? 1.22 : 1.6; G.add(mesh(new THREE.SphereGeometry(0.13, 10, 8), skin, 0, hy, 0)); const hair = mesh(new THREE.SphereGeometry(0.125, 10, 8), std('#3a2a1e'), 0, hy + 0.06, -0.03); hair.scale.set(1, 0.7, 1); G.add(hair);
    return G; }

  // ---------- canvas cabins glow from inside at dusk; steam on every tub ----------
  const CANVAS = MATS.filter(m => m.name === 'canvas');
  // moving water (Adam, 10-11-2026: "the water is not very realistic... no realistic water movement"): four wave trains in the surface normal,
  // so the sky and the sun glint and drift across the lake; colour shifts a little with the wave height
  const waterT = { value: 0 };
  MATS.filter(m => m.name === 'lake').forEach(m => { m.roughness = 0.26; m.metalness = 0; m.envMapIntensity = 0.6; const prev = m.onBeforeCompile;
    m.onBeforeCompile = (sh, r) => { if (prev) prev(sh, r); sh.uniforms.uWT = waterT;
      sh.vertexShader = 'varying vec2 vWxz;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vWxz = transformed.xz;');
      sh.fragmentShader = 'uniform float uWT;\nvarying vec2 vWxz;\n' + sh.fragmentShader
        .replace('#include <color_fragment>', `#include <color_fragment>
  { float h = wN(vWxz * 0.08 + vec2(uWT * 0.01, 0.0)); diffuseColor.rgb *= 0.88 + 0.2 * h; }`)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
  { // random ripples (value noise, three sizes drifting different ways); the small ones fade with distance so they never band
    vec2 p = vWxz; float t = uWT, e = 0.15, fw = length(fwidth(p));
    vec2 g = wGrad(p * 0.22 + vec2(t * 0.05, t * 0.03), e) * 0.22;
    g += wGrad(p * 0.55 + vec2(-t * 0.09, t * 0.07), e) * 0.55 * clamp(1.6 - fw * 1.2, 0.0, 1.0);
    g += wGrad(p * 1.40 + vec2(t * 0.16, -t * 0.12), e) * 1.40 * 0.45 * clamp(1.4 - fw * 3.0, 0.0, 1.0);
    g += wGrad(p * 3.20 + vec2(-t * 0.25, -t * 0.2), e) * 3.20 * 0.18 * clamp(1.2 - fw * 7.0, 0.0, 1.0);
    normal = normalize((viewMatrix * vec4(normalize(vec3(-g.x * 0.3 * clamp(1.2 - fw * 0.9, 0.35, 1.0), 1.0, -g.y * 0.3 * clamp(1.2 - fw * 0.9, 0.35, 1.0))), 0.0)).xyz); }`)
        .replace('void main() {', `float wH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float wN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(wH(i), wH(i + vec2(1.0, 0.0)), f.x), mix(wH(i + vec2(0.0, 1.0)), wH(i + vec2(1.0, 1.0)), f.x), f.y); }
vec2 wGrad(vec2 p, float e) { float c = wN(p); return vec2(wN(p + vec2(e, 0.0)) - c, wN(p + vec2(0.0, e)) - c) / e; }
void main() {`); };
    m.customProgramCacheKey = () => 'karooWater3'; m.needsUpdate = true; });
  if (part.water) part.water.position.y = 0.32;   // the lake bed showed through the water from far away (depth precision): lift the water a little
  const steam = puffs((INFO.tubs || []).map(t => new THREE.Vector3(t[0], t[1] + 1.0, t[2])), 10, { color: '#e8edf2', size: 1.6, op: 0.32, rate: 0.12, rise: 2.6, spread: 0.45, drift: 0.3 });

  // ---------- the funny touch: geese and bathrobes (Adam, 10-11-2026: "a couple more of the other houses as well") ----------
  // Three cabins take turns: a goose leaves the water, waits by the stairs, chases a guest in a bathrobe into the hot tub, then goes home.
  // Every ground path walks round the cabin's deck and canopy (never through them): the deck box plus a margin, walked the short way round.
  const toL = (c, p) => { const cs = Math.cos(c.ry), sn = Math.sin(c.ry), dx = p.x - c.pos[0], dz = p.z - c.pos[2]; return { x: dx * cs - dz * sn, z: dx * sn + dz * cs }; };
  const poly = (pts) => { const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1])); const len = cum[cum.length - 1];
    return { len, at(d, o) { d = cl(d, 0, len); let i = 1; while (i < cum.length - 1 && cum[i] < d) i++; const f = (d - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1); o.lerpVectors(pts[i - 1], pts[i], f); return Math.atan2(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z); } }; };
  // the way round a cabin, from model point a to model point b (both on the ground)
  function around(c, a, b) { const L = c.local, m = 2.4, x0 = L.dx0 - m, x1 = Math.max(L.dx1, L.stX1) + m, z0 = L.dz0 - m, z1 = L.dz1 + m, P = 2 * (x1 - x0) + 2 * (z1 - z0);
    const tOf = (q) => { const x = cl(q.x, x0, x1), z = cl(q.z, z0, z1), d = [Math.abs(z - z0), Math.abs(x - x1), Math.abs(z - z1), Math.abs(x - x0)], k = d.indexOf(Math.min(...d));
      return k === 0 ? x - x0 : k === 1 ? (x1 - x0) + (z - z0) : k === 2 ? (x1 - x0) + (z1 - z0) + (x1 - x) : 2 * (x1 - x0) + (z1 - z0) + (z1 - z); };
    const pOf = (t) => { t = ((t % P) + P) % P; const w = x1 - x0, h = z1 - z0; return t < w ? [x0 + t, z0] : t < w + h ? [x1, z0 + t - w] : t < 2 * w + h ? [x1 - (t - w - h), z1] : [x0, z1 - (t - 2 * w - h)]; };
    const la = toL(c, a), lb = toL(c, b), inside = (q) => q.x > x0 && q.x < x1 && q.z > z0 && q.z < z1;
    // a straight line that never enters the box needs no detour
    let hits = false; for (let i = 1; i < 20; i++) { const f = i / 20; if (inside({ x: la.x + (lb.x - la.x) * f, z: la.z + (lb.z - la.z) * f })) { hits = true; break; } }
    if (!hits) return [a, b];
    const ta = tOf(la), tb = tOf(lb); let d = tb - ta; if (d > P / 2) d -= P; if (d < -P / 2) d += P;
    const out = [a]; const n = Math.max(2, Math.ceil(Math.abs(d) / 1.5)); for (let i = 0; i <= n; i++) { const [x, z] = pOf(ta + d * i / n); out.push(toM(c, x, 0, z)); }
    out.push(b); return out.filter((p, k, A) => k === 0 || p.distanceTo(A[k - 1]) > 0.05); }
  const shoreNear = (p) => { let best = null, bd = 1e9; (INFO.shore || []).forEach(([x, z]) => { const d = Math.hypot(x - p.x, z - p.z); if (d < bd) { bd = d; best = new THREE.Vector3(x, 0, z - 1.5); } }); return best; };
  function makeGoose() { const goose = new THREE.Group(), gb = std('#8a7d6b'), blk = std('#141414'), wht = std('#f2f0ea');
    const body = mesh(new THREE.SphereGeometry(0.22, 12, 10), gb, 0, 0.42, 0); body.scale.set(1, 0.85, 1.75); goose.add(body);
    const breast = mesh(new THREE.SphereGeometry(0.19, 10, 8), std('#c9bfae'), 0, 0.4, 0.2); breast.scale.set(1, 0.9, 1.1); goose.add(breast);
    goose.add(mesh(new THREE.SphereGeometry(0.1, 8, 6), wht, 0, 0.4, -0.36));
    const neck = new THREE.Group(); neck.position.set(0, 0.5, 0.3); goose.add(neck);
    neck.add(mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.42, 8), blk, 0, 0.2, 0.02)); const head = new THREE.Group(); head.position.set(0, 0.42, 0.05); neck.add(head);
    head.add(mesh(new THREE.SphereGeometry(0.07, 10, 8), blk, 0, 0, 0)); const bill = mesh(new THREE.ConeGeometry(0.03, 0.1, 6), blk, 0, -0.01, 0.1); bill.rotation.x = Math.PI / 2; head.add(bill);
    const strap = mesh(new THREE.SphereGeometry(0.072, 8, 6), wht, 0, -0.02, -0.01); strap.scale.set(1.04, 0.6, 0.6); head.add(strap);
    const wings = [-1, 1].map(s => { const w = new THREE.Group(); w.position.set(s * 0.2, 0.5, 0); const m = mesh(new THREE.SphereGeometry(0.2, 10, 6), std('#6f6352'), s * 0.12, 0, -0.04); m.scale.set(1.2, 0.18, 1.4); w.add(m); goose.add(w); return w; });
    for (const s of [-1, 1]) goose.add(mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.22, 4), blk, s * 0.07, 0.11, 0));
    goose.scale.setScalar(1.5); root.add(goose); return { goose, neck, wings }; }
  function makeRobe(col, hairCol) { const robe = new THREE.Group(), cloth = std(col, { roughness: 0.95 }), skin = std('#d9a582');
    robe.add(mesh(new THREE.CylinderGeometry(0.24, 0.34, 1.1, 12), cloth, 0, 0.82, 0), mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.3, 6), skin, -0.1, 0.15, 0), mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.3, 6), skin, 0.1, 0.15, 0));
    const belt = mesh(new THREE.TorusGeometry(0.27, 0.03, 6, 16), std('#e9e2d4'), 0, 0.95, 0); belt.rotation.x = Math.PI / 2; robe.add(belt);
    robe.add(mesh(new THREE.SphereGeometry(0.13, 10, 8), skin, 0, 1.55, 0), mesh(new THREE.SphereGeometry(0.135, 10, 8), std(hairCol), 0, 1.6, -0.03));
    const arms = [-1, 1].map(s => { const a = new THREE.Group(); a.position.set(s * 0.28, 1.3, 0); a.add(mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.55, 8), cloth, 0, -0.27, 0)); robe.add(a); return a; });
    root.add(robe); return { robe, arms }; }
  function makeChase(GC, from, offset, robeCol, hairCol) {
    const L = GC.local, DH = GC.deck, zst = (GC.stZ[0] + GC.stZ[1]) / 2;
    const tubC = V3(GC.tub), door = V3(GC.door); door.y = DH; tubC.y = 0;
    const foot = V3(GC.stair); foot.y = 0;
    const outF = toM(GC, L.stX1 + 2.6, 0, zst);   // a step out from the stairs, clear of the deck
    const tubSide = tubC.clone().add(new THREE.Vector3().subVectors(V3(GC.pos).setY(0), tubC).setY(0).normalize().multiplyScalar(-((GC.tubR || 1) + 0.5)));
    // the tub sits outside the deck: approach it from its outer side
    const run = around(GC, outF, tubSide), tubEdge = run[run.length - 1];
    const deck = [door, toM(GC, L.dx1 - 0.2, DH, zst), toM(GC, L.dx1 + 0.1, DH, zst), foot, outF];
    const RP = poly([...deck, ...run.slice(1)]), STAIRS = poly(deck).len, chase = poly(run);
    const wait = toM(GC, L.stX1 + 3.6, 0, zst + 2.2);
    const toWait = poly(around(GC, from, wait)), home = poly(around(GC, tubEdge.clone().lerp(outF, 0.15), from));
    const G = makeGoose(), Rb = makeRobe(robeCol, hairCol), LOOP = 50, gp = new THREE.Vector3(), rp = new THREE.Vector3();
    const say = mkTag('tag'); say.style.fontSize = '11px';
    function tick(T0) { const t = T0 + offset, k = ((t % LOOP) + LOOP) % LOOP; let honk = false, flap = 0, gry = 0, runk = 0;
      if (k < 8) gry = toWait.at(toWait.len * sm(k / 8), gp);
      else if (k < 15) { toWait.at(toWait.len, gp); gry = Math.atan2(foot.x - gp.x, foot.z - gp.z); honk = k > 13; }
      else if (k < 15 + chase.len / 2.7 + 0.6) { const d = Math.max(0, (k - 15.4) * 2.7 - 1.3); gry = chase.at(Math.min(d, chase.len - 0.9), gp); flap = 1; honk = true; }
      else if (k < 27) { chase.at(chase.len - 0.9, gp); gry = Math.atan2(tubC.x - gp.x, tubC.z - gp.z); honk = (k % 1.6) < 0.8; flap = k < 23 ? 1 : 0; }
      else if (k < 44) gry = home.at(home.len * sm((k - 27) / 17), gp);
      else home.at(home.len, gp);
      const moving = (k < 8) || (k > 15 && k < 21.5) || (k > 27 && k < 44);
      G.goose.position.set(gp.x, moving ? Math.abs(Math.sin(t * 9)) * 0.03 : 0, gp.z); G.goose.rotation.y = gry; G.goose.rotation.z = moving ? Math.sin(t * 9) * 0.08 : 0;
      G.neck.rotation.x = honk ? 0.5 + Math.sin(t * 14) * 0.25 : (moving ? 0.25 : Math.sin(t * 1.3) * 0.1); G.wings.forEach((w, i) => (w.rotation.z = (i ? -1 : 1) * flap * (0.4 + 0.5 * Math.sin(t * 22))));
      const tIn = 15 + chase.len / 3.0;   // the guest reaches the tub
      let ry = 0, y = 0;
      if (k <= 15) { ry = RP.at(cl((k - 9) / 5.5) * STAIRS, rp); y = rp.y; runk = k > 9 ? 0.4 : 0; }
      else if (k <= tIn) { ry = RP.at(STAIRS + (k - 15) * 3.0, rp); y = 0; runk = 1; }
      else { const f = sm((k - tIn) / 0.8); rp.lerpVectors(tubEdge, tubC, f); ry = Math.atan2(tubC.x - tubEdge.x, tubC.z - tubEdge.z); y = f * 0.5 - sm((k - tIn - 0.3) / 0.8) * 1.45; }
      Rb.robe.visible = k > 9 && k < LOOP - 0.5; Rb.robe.position.set(rp.x, y + (runk > 0.9 ? Math.abs(Math.sin(t * 12)) * 0.06 : 0), rp.z); Rb.robe.rotation.y = ry;
      Rb.arms.forEach((a, i) => { a.rotation.x = runk > 0.9 ? -2.4 + Math.sin(t * 12 + i * 3) * 0.5 : Math.sin(t * 6 + i * 3) * 0.35 * runk; a.rotation.z = (i ? -1 : 1) * (runk > 0.9 ? 0.5 : 0.05); });
      if (honk && k > 15 && k < 27 && !reduced) tagTo(say, gp.clone().setY(4.2), 'HONK!'); else say.style.display = 'none'; }
    return tick; }
  const CHASES = [];
  { const pond = INFO.pond ? new THREE.Vector3(INFO.pond[0], 0, INFO.pond[1]) : null;
    const pick = [['Stellenbosch', 0, '#f6f4ef', '#5a3a22'], ['Kilimanjaro', 17, '#f2b8c6', '#d8b26a'], ['Malachite', 34, '#9cc7e8', '#2a2018']];
    pick.forEach(([nm, off, col, hair]) => { const c = C.find(x => x.name === nm); if (!c) return; const cp = V3(c.pos).setY(0), water = (pond && cp.distanceTo(pond) < 30) ? pond : shoreNear(cp); if (!water) return;
      // the goose waddles in from the water side, at most 16 m away, so it walks at a goose's pace
      const start = cp.clone().add(water.clone().sub(cp).setY(0).normalize().multiplyScalar(Math.min(16, cp.distanceTo(water)))); CHASES.push(makeChase(c, start, off, col, hair)); }); }
  const gooseTick = (t) => CHASES.forEach(f => f(t));

  // ---------- the bottom buttons (custom modes) ----------
  const chips = document.getElementById('chips'), card = document.getElementById('card'), bottomBox = document.getElementById('bottom');
  let mode = null, modeT = 0, prevSunset = null, curSel = null, curGrow = false;
  const minD0 = controls.minDistance, maxP0 = controls.maxPolarAngle;
  function showMyCard(c) { if (!card) return; card.className = ''; card.style.display = 'block'; const ck = document.getElementById('ck'); ck.textContent = c.k;
    document.getElementById('ch').innerHTML = c.h; document.getElementById('cp').textContent = c.p; const cs = document.getElementById('cs'); cs.textContent = c.s;
    for (const k of c.links || []) { const a = document.createElement('a'); a.href = k.u; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = k.t; cs.append(' · ', a); }
    if (c.links && c.links.length && D.checked) cs.append(' · checked ' + D.checked);
    const n = document.getElementById('cnum'); if (n) n.textContent = ''; const rb = document.getElementById('reset'); if (rb) rb.hidden = false; const mini = document.getElementById('mini'); if (mini) mini.hidden = true; }
  const BTN = {};
  function setChip(id) { chips.querySelectorAll('.chip').forEach(b => { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); }); if (id && BTN[id]) { BTN[id].classList.add('on'); BTN[id].setAttribute('aria-pressed', 'true'); } }
  const MODES = {};
  function startMode(id, arg) {
    if (mode) endMode(true, true);
    if (curGrow && window.__grow) window.__grow(false, true); if (curSel && window.__choose) window.__choose(null); else if (window.__choose) window.__choose(null);
    mode = id; modeT = 0; controls.autoRotate = false; setChip(id); T('tap', 'k ' + id); MODES[id].start(arg); }
  function endMode(quiet, keepDusk) { if (!mode) return; const m = MODES[mode]; mode = null; m.end(); controls.minDistance = minD0; controls.maxPolarAngle = maxP0; setChip(null);
    if (!keepDusk && prevSunset !== null && window.__sunset) { window.__sunset(prevSunset); prevSunset = null; }
    if (!quiet) { if (card) card.style.display = 'none'; goView(HOME); } }
  const wantDusk = () => { if (prevSunset === null) prevSunset = dusk01() > 0.5; if (window.__sunset) window.__sunset(true); };
  { const rb = document.getElementById('reset'); if (rb) rb.addEventListener('click', () => { if (mode) endMode(false); }); const cx = document.getElementById('cx'); }

  // Sunset: lanterns, string lights, the stoves and steam, every canvas glows
  MODES.sunset = { start() { wantDusk(); showMyCard({ k: 'Evening at Karoo', h: 'Lanterns and <em>wood-burning</em> hot tubs', p: 'At sunset the lanterns and string lights come on, the stoves under the private wood-burning hot tubs are lit and the canvas cabins glow.',
      s: 'Source: karooresort.com amenities (private wood-burning hot tubs, fire pits). Lights shown are illustrative.', links: [{ t: 'Karoo amenities', u: AMEN_URL }] });
      goView({ at: [-8, 2, 25], dist: 210, el: 0.55, az: 2.75 }, 1.6); }, end() {} };

  // Peek inside: the stretch tent and the canvas roof lift off one cabin
  let peekI = -1, peekP = 0; const peekBase = {};
  const peekOf = (i) => { const c = C[i]; return { k: c.name + ' · inside', h: 'Sleeps <em>' + c.sleeps + '</em>', p: (BEDS[c.name] || '') + ', from the cabin page. The inside is drawn as an illustration.',
    s: 'Source: karooresort.com cabin pages (beds and guests per cabin)', links: [{ t: 'Karoo cabins', u: CABIN_URL }] }; };
  MODES.peek = { start(i = 4) { peekI = i; const c = C[i]; showMyCard(peekOf(i)); controls.minDistance = Math.min(minD0, 0.02); goView({ at: [c.pos[0], -4, c.pos[2]], dist: 50, el: 0.55, az: 2.75 }, 1.4); },
    end() { /* lowered back in tick */ } };

  // Stand on the pier: eye height at the end of the community pier, looking back at the resort
  MODES.pier = { start() { wantDusk(); const b = INFO.pier.b, a = INFO.pier.a, d = new THREE.Vector3(b[0] - a[0], 0, b[2] - a[2]).normalize();
      controls.minDistance = 0.004; controls.maxPolarAngle = 1.56;
      goView({ at: [b[0] - d.x * 44, 1.4, b[2] - d.z * 44], dist: 42, el: 0.035, az: Math.atan2(d.x, d.z) }, 2.4);
      showMyCard({ k: 'Smith Mountain Lake', h: 'From the <em>community pier</em>', p: 'Looking back at the cabins from the end of the community pier at dusk. Swimming from the pier, kayaks and fishing are on the resort’s amenities list.',
        s: 'Source: karooresort.com amenities (swimming on the community pier, kayaks, fishing)', links: [{ t: 'Karoo amenities', u: AMEN_URL }] }); }, end() {} };

  // Fire pit night: guests round the fire, embers rising, string lights bright
  const seated = (INFO.fireSeats || []).map(([x, z, ry], k) => { const p = person(['#d24a32', '#3a7fd0', '#f2c230', '#2f9e6a', '#ff7aa0', '#f2f0ea'][k % 6], 'sit'); p.position.set(x, 0, z); p.rotation.y = ry; p.visible = false; root.add(p); return p; });
  const embers = puffs([V3(INFO.embers || INFO.fire || [0, 0.6, 0])], 46, { color: '#ff9a3a', size: 0.35, op: 1, rate: 0.35, rise: 5.5, spread: 0.5, drift: 0.4, add: true });
  let fireP = 0;
  MODES.fire = { start() { wantDusk(); const f = INFO.fire; goView({ at: [f[0], 1.2, f[2]], dist: 24, el: 0.42, az: 2.9 }, 1.6);
      showMyCard({ k: 'Evenings', h: 'The <em>fire pit</em> by the lake', p: 'Fire pits, family-sized hammocks and the lakefront are on the resort’s amenities list.', s: 'Source: karooresort.com amenities. People shown are illustrative.', links: [{ t: 'Karoo amenities', u: AMEN_URL }] }); }, end() {} };

  // Find your cabin: pick a cabin, see it, then the walk to the lodge, the fire pit, the pier or the parking
  const DR = (INFO.drive || []).map(p => new THREE.Vector3(p[0], 0, p[2]));
  const nearestI = (p) => { let b = 0, bd = 1e9; DR.forEach((q, i) => { const d = Math.hypot(q.x - p.x, q.z - p.z); if (d < bd) { bd = d; b = i; } }); return b; };
  const F = INFO.fire ? V3(INFO.fire).setY(0) : null, FA = F ? F.clone().add(new THREE.Vector3(-2.6, 0, -1.5)) : null, FB = F ? F.clone().add(new THREE.Vector3(2.4, 0, 1.2)) : null;
  const PA = V3(INFO.pier.a).setY(0), PB = V3(INFO.pier.b).setY(0);
  const DEST = { lodge: { t: 'Lodge', to: V3(INFO.lodge.doors[2]).setY(0) }, fire: { t: 'Fire pit', tail: [FA, F] }, pier: { t: 'Pier', tail: [FA, FB, PA.clone().add(new THREE.Vector3(-0.8, 0, -2)), PA, PB] },
    parking: { t: 'Parking', to: V3(INFO.parking[0]).setY(0) } };
  function route(ci, dk) { const c = C[ci], st = V3(c.stair).setY(0), i0 = nearestI(st), d = DEST[dk]; let i1, tail;
    if (d.tail) { i1 = DR.length - 1; tail = d.tail; } else { i1 = nearestI(d.to); tail = [d.to]; }
    const mid = []; if (i0 <= i1) for (let i = i0; i <= i1; i++) mid.push(DR[i]); else for (let i = i0; i >= i1; i--) mid.push(DR[i]);
    const pts = [st, ...mid, ...tail].filter((p, k, a) => k === 0 || p.distanceTo(a[k - 1]) > 0.5); let len = 0; for (let k = 1; k < pts.length; k++) len += pts[k].distanceTo(pts[k - 1]); return { pts, len }; }
  const routeM = glowM(3, { depthWrite: false }); let routeMesh = null, routeT = 0, wfCab = -1, wfDest = null;
  const tagCab = mkTag('tag'), tagDest = mkTag('tag');
  const css = document.createElement('style'); css.textContent = `#kwf { position:fixed; left:12px; right:12px; bottom:calc(env(safe-area-inset-bottom) + 132px); z-index:5; max-width:480px; margin:0 auto; background:var(--panel); border:1px solid rgba(var(--lc),.14); border-radius:14px; padding:10px 12px; display:none; backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); }
    #kwf h4 { margin:0 0 6px; font-size:12px; letter-spacing:.12em; text-transform:uppercase; color:var(--hero); } #kwf .row { display:flex; flex-wrap:wrap; gap:6px; }
    #kwf button { border:1px solid rgba(var(--lc),.18); background:rgba(var(--lc),.07); color:var(--ink); font:600 12.5px var(--font), sans-serif; padding:7px 10px; border-radius:16px; }
    #kwf button.on { background:var(--hero); border-color:var(--hero); color:var(--onhero); } #kwf small { opacity:.7; font-weight:500; } #kwf .sub { margin:8px 0 0; } #kwf .x { position:absolute; right:4px; top:2px; border:0; background:none; font-size:20px; padding:4px 8px; }
    #kwf p { margin:7px 0 0; font-size:11.5px; color:var(--muted); }`;
  document.head.appendChild(css);
  const wf = document.createElement('div'); wf.id = 'kwf'; wf.setAttribute('role', 'dialog'); wf.innerHTML = '<button class="x" aria-label="Close">×</button><h4>Find your cabin</h4><div class="row" id="kwfc"></div><div class="row sub" id="kwfd"></div><p>Walks measured along the drive and paths on the resort map, at an easy pace. Approximate.</p>';
  document.body.appendChild(wf);
  const wfc = wf.querySelector('#kwfc'), wfd = wf.querySelector('#kwfd'); wf.querySelector('.x').onclick = () => endMode(false);
  C.forEach((c, i) => { const b = document.createElement('button'); b.type = 'button'; b.innerHTML = c.name + ' <small>sleeps ' + c.sleeps + '</small>'; b.onclick = () => pickCab(i); wfc.appendChild(b); });
  function clearRoute() { if (routeMesh) { root.remove(routeMesh); routeMesh.geometry.dispose(); routeMesh = null; } wfDest = null; tagDest.style.display = 'none'; }
  function pickCab(i) { wfCab = i; clearRoute(); [...wfc.children].forEach((b, k) => b.classList.toggle('on', k === i)); const c = C[i]; T('tap', 'cabin ' + c.name);
    goView({ at: [c.pos[0], 2, c.pos[2]], dist: 70, el: 0.8, az: 2.75 }, 1.2);
    wfd.innerHTML = ''; Object.entries(DEST).forEach(([k, d]) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = 'Walk to ' + d.t; b.dataset.k = k; b.onclick = () => pickDest(k); wfd.appendChild(b); });
    const pk = document.createElement('button'); pk.type = 'button'; pk.textContent = 'Peek inside'; pk.onclick = () => startMode('peek', i); wfd.appendChild(pk); }
  function pickDest(k) { clearRoute(); wfDest = k; [...wfd.children].forEach(b => b.classList.toggle('on', b.dataset.k === k)); const r = route(wfCab, k); T('tap', 'walk ' + k);
    const curve = new THREE.CatmullRomCurve3(r.pts.map(p => new THREE.Vector3(p.x, 0.6, p.z)), false, 'catmullrom', 0.1);
    routeMesh = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(40, Math.round(r.len)), 0.3, 6, false), routeM); routeMesh.renderOrder = 6; root.add(routeMesh); routeT = 0;
    const min = r.len / 78; wfDest = { k, r, text: min < 1 ? 'Under a minute’s walk' : 'About ' + Math.round(min) + ' min walk' };
    const all = [...r.pts]; const xs = all.map(p => p.x), zs = all.map(p => p.z); const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cz = (Math.min(...zs) + Math.max(...zs)) / 2, span = Math.max(40, Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs));
    goView({ at: [cx, 0, cz], dist: span * 2.0, el: 0.95, az: 2.75 }, 1.3); }
  MODES.find = { start() { wf.style.display = 'block'; if (card) card.style.display = 'none'; pickCab(wfCab < 0 ? 4 : wfCab); }, end() { wf.style.display = 'none'; clearRoute(); tagCab.style.display = 'none'; } };

  // the chips, after the fact chips the page makes
  setTimeout(() => { [['sunset', 'Sunset'], ['find', 'Find your cabin'], ['peek', 'Peek inside'], ['pier', 'Stand on the pier'], ['fire', 'Fire pit night']].forEach(([id, label]) => {
    const b = document.createElement('button'); b.className = 'chip kchip'; b.type = 'button'; b.textContent = label; b.setAttribute('aria-pressed', 'false'); BTN[id] = b;
    b.onclick = () => { if (mode === id && !(id === 'peek' && peekI !== 4)) endMode(false); else startMode(id, id === 'peek' ? 4 : undefined); }; chips.appendChild(b); }); }, 0);

  // ---------- fact card effects ----------
  const FX = Object.assign({}, base.fx);
  // the whole resort for one group: guests of light fill every cabin and the lodge, a counter climbs to 50
  let buyObj = null; const buyTag = mkTag('tag');
  FX.buyout = (c) => { const g = new THREE.Group(), n = Math.min(c.count || 50, (INFO.guests || []).length);
    // 28 cabin places first (all of them), then the lodge rooms, to the resort's own buyout figure
    const list = (INFO.guests || []).slice(0, n); const m = new THREE.MeshBasicMaterial({ color: WARM.clone().multiplyScalar(2.2), toneMapped: false, transparent: true, opacity: 0, depthWrite: false });
    const gg = new THREE.CapsuleGeometry(0.6, 1.6, 3, 8); gg.translate(0, 1.4, 0); const im = new THREE.InstancedMesh(gg, m, list.length); im.frustumCulled = false; g.add(im);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sv = new THREE.Vector3(), pv = new THREE.Vector3(); buyObj = g;
    const lodgeTop = new THREE.Vector3(-20, 22, 0);
    g.userData.tick = (t) => { let shown = 0; list.forEach((p, i) => { const a = cl((t - 0.5 - i * 0.07) / 0.5); if (a > 0) shown++; pv.set(p[0], (p[3] < 8 ? 7.6 : 9.6) - 2 + 2 * a + Math.sin(t * 2 + i) * 0.15, p[2]); sv.setScalar(Math.max(1e-4, a)); m4.compose(pv, q, sv); im.setMatrixAt(i, m4); });
      im.instanceMatrix.needsUpdate = true; m.opacity = 0.9; tagTo(buyTag, lodgeTop, shown + (shown === list.length ? ' guests · one booking' : ' guests')); };
    return { obj: g, mat: m, tick: (t) => g.userData.tick(t) }; };

  // Smith Mountain Lake: the resort shrinks onto the lake model, the shore lights from the dam up every arm
  let lakeObj = null, lakeP = 0, lakeData = null, lakeBuilt = false, lakeLoading = false, lakeShore = null, lakeKP = null; const lakeMats = MATS.filter(m => ['ground', 'water'].includes(m.userData.p));
  const lakeURL = (() => { try { return new URL('lake.json', new URL(D.files.glb, location.href)).href; } catch (e) { return 'lake.json'; } })();
  const b64 = (s, T) => { const bin = atob(s), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new T(u.buffer); };
  function buildLake(g) { const L = lakeData, n = L.n, H = b64(L.h, Int16Array), MK = b64(L.mask, Uint8Array), half = L.half, fu = (R - 3) / half;
    const hAt = (u, w) => { const fx = cl((u + half) / (2 * half) * n - 0.5, 0, n - 1.001), fz = cl((w + half) / (2 * half) * n - 0.5, 0, n - 1.001), i = fx | 0, j = fz | 0, a = fx - i, b = fz - j;
      const s = (A, ii, jj) => A[jj * n + ii]; const hh = (s(H, i, j) * (1 - a) + s(H, i + 1, j) * a) * (1 - b) + (s(H, i, j + 1) * (1 - a) + s(H, i + 1, j + 1) * a) * b;
      const mm = (s(MK, i, j) * (1 - a) + s(MK, i + 1, j) * a) * (1 - b) + (s(MK, i, j + 1) * (1 - a) + s(MK, i + 1, j + 1) * a) * b; return [hh / 2, mm / 255]; };
    const NR = 70, NA = 300, pos = [], col = [], idx = [], c = new THREE.Color(), forest = new THREE.Color('#1f3a22'), hill = new THREE.Color('#4a5a32'), lake = new THREE.Color('#0f4a66');
    const vid = (r, a) => r === 0 ? 0 : 1 + (r - 1) * NA + (a % NA);
    const push = (x, z) => { const [h, m] = hAt(x / fu, z / fu); const land = m < 0.5; const y = land ? Math.max(0.15, h * L.ex * 0.01 * fu) : 0.1; pos.push(x, y, z);
      if (land) c.copy(forest).lerp(hill, cl(h / 300)); else c.copy(lake); col.push(c.r, c.g, c.b); };
    push(0, 0); for (let r = 1; r <= NR; r++) for (let a = 0; a < NA; a++) { const rr = (R - 1.5) * r / NR, t = a / NA * Math.PI * 2; push(rr * Math.cos(t), rr * Math.sin(t)); }
    for (let a = 0; a < NA; a++) idx.push(0, vid(1, a + 1), vid(1, a));
    for (let r = 1; r < NR; r++) for (let a = 0; a < NA; a++) { const p0 = vid(r, a), p1 = vid(r, a + 1), p2 = vid(r + 1, a), p3 = vid(r + 1, a + 1); idx.push(p0, p1, p2, p1, p3, p2); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    const dm = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, transparent: true, opacity: 0 }); const dio = new THREE.Mesh(geo, dm); dio.receiveShadow = true; g.add(dio); g.userData.dm = dm;
    // a skirt down to the plinth band
    { const p = [], ix = []; for (let a = 0; a <= NA; a++) { const k = 1 + (NR - 1) * NA + (a % NA); p.push(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2], pos[k * 3], -0.6, pos[k * 3 + 2]); }
      for (let a = 0; a < NA; a++) { const k = a * 2; ix.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); sg.setIndex(ix); sg.computeVertexNormals();
      const skm = new THREE.MeshStandardMaterial({ color: new THREE.Color('#0b1a2e'), roughness: 0.7, side: THREE.DoubleSide, transparent: true, opacity: 0 }); g.add(new THREE.Mesh(sg, skm)); g.userData.skm = skm; }
    // the shore, sorted by when the light reaches it from the dam
    const sh = b64(L.shore, Int16Array), sa = b64(L.sarr, Uint8Array), ns = sa.length, order = [...Array(ns).keys()].sort((a, b) => sa[a] - sa[b]), sp = new Float32Array(ns * 18), hw = 0.55;
    order.forEach((s, j) => { const x0 = sh[s * 4] / 80 * fu, z0 = sh[s * 4 + 1] / 80 * fu, x1 = sh[s * 4 + 2] / 80 * fu, z1 = sh[s * 4 + 3] / 80 * fu, dx = x1 - x0, dz = z1 - z0, l = Math.hypot(dx, dz) || 1, nx = -dz / l * hw, nz = dx / l * hw, y = Math.hypot(x0, z0) > R - 3 || Math.hypot(x1, z1) > R - 3 ? -9 : 0.3;
      sp.set([x0 - nx, y, z0 - nz, x1 - nx, y, z1 - nz, x1 + nx, y, z1 + nz, x0 - nx, y, z0 - nz, x1 + nx, y, z1 + nz, x0 + nx, y, z0 + nz], j * 18); });
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); lg.setDrawRange(0, 0);
    lakeShore = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: HERO.clone().multiplyScalar(2.4), toneMapped: false, transparent: true, depthWrite: false, side: THREE.DoubleSide })); lakeShore.frustumCulled = false; lakeShore.renderOrder = 5; lakeShore.userData.n = ns; g.add(lakeShore);
    // where Karoo sits: a beacon of light
    lakeKP = new THREE.Vector3(L.karoo[0] * fu, Math.max(0, L.karoo[1]) * L.ex * 0.01 * fu, L.karoo[2] * fu);
    const bm = glowM(4); const beacon = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2.2, 34, 16, 1, true), bm); beacon.position.copy(lakeKP).add(new THREE.Vector3(0, 17, 0)); g.add(beacon); g.userData.bm = bm;
    lakeBuilt = true; }
  const shrinkParts = () => model.children.filter(o => o !== lakeObj && o.name !== 'plinth' && o !== root && !o.userData.isFx).concat([root]);
  FX.lake = (c) => { const g = new THREE.Group(); g.userData.isFx = true; lakeObj = g;
    const ensure = () => { if (lakeBuilt || lakeLoading) return; lakeLoading = true; fetch(lakeURL).then(r => r.json()).then(j => { lakeData = j; buildLake(g); }).catch(e => console.warn('lake', e)); };
    return { obj: g, mat: null, tick: (t) => { ensure(); g.userData.t = t; } }; };
  function lakeTick(dt) { const on = !!(lakeObj && lakeObj.visible && lakeBuilt); const t = on ? lakeObj.userData.t || 0 : 0;
    const target = on ? sm((t - 0.4) / 2.2) : 0; lakeP = on ? target : Math.max(0, lakeP - dt * 1.5);
    if (lakeP <= 0 && !on) { if (lakeObj && lakeObj.userData.wasOn) { shrinkParts().forEach(o => { o.scale.setScalar(1); o.position.set(0, o.userData.y0 || 0, 0); }); lakeMats.forEach(m => { m.opacity = 1; m.transparent = false; m.depthWrite = true; }); lakeObj.userData.wasOn = false; } return; }
    if (!lakeKP) return; lakeObj.userData.wasOn = true; const s = 1 + (0.0075 * ((R - 3) / lakeData.half) / 0.716 - 1) * lakeP;
    shrinkParts().forEach(o => { if (o.userData.y0 == null) o.userData.y0 = o.position.y; o.scale.setScalar(s); o.position.set(lakeKP.x * lakeP, lakeKP.y * lakeP + o.userData.y0 * s, lakeKP.z * lakeP); });
    lakeMats.forEach(m => { m.transparent = true; m.opacity = 1 - sm((lakeP - 0.2) / 0.5); m.depthWrite = m.opacity > 0.95; });
    const g = lakeObj; g.userData.dm.opacity = sm((lakeP - 0.15) / 0.5); g.userData.skm.opacity = g.userData.dm.opacity; g.userData.dm.depthWrite = g.userData.dm.opacity > 0.9;
    const ig = on ? sm((t - 2.6) / 3.2) : 0; lakeShore.geometry.setDrawRange(0, Math.floor(lakeShore.userData.n * ig) * 6); g.userData.bm.opacity = (on ? sm((t - 2.0) / 0.8) : 0) * (0.7 + 0.3 * Math.sin(t * 3)); }

  // Room to grow: the lodge roof lifts, the upper floor follows, the gathering room builds itself in light along the lodge
  let growObj = null, growU = 0; const GP = ['lodge_roof', 'lodge_upper', 'lodge_lid', 'gather'].map(n => part[n]);
  const GATHER = MATS.filter(m => m.userData.p === 'gather'); const clipP = new THREE.Plane(); if (GATHER.length) { renderer.localClippingEnabled = true; GATHER.forEach(m => { m.clippingPlanes = [clipP]; }); }
  if (part.gather) part.gather.visible = false;
  const LOD = INFO.lodge, lax = new THREE.Vector3(Math.cos(LOD.ry), 0, -Math.sin(LOD.ry)), lc = new THREE.Vector3(LOD.c[0], 0, LOD.c[1]);
  const floorM = glowM(1.2); let floorMesh = null;
  if (LOD.room) { const ro = LOD.room; const fg = new THREE.PlaneGeometry(ro.size[0], ro.size[2]); fg.rotateX(-Math.PI / 2); floorMesh = new THREE.Mesh(fg, floorM); const o = lc.clone().addScaledVector(lax, ro.origin[0]);
    floorMesh.position.set(o.x, ro.origin[1] + 0.06, o.z); floorMesh.rotation.y = LOD.ry; floorMesh.visible = false; root.add(floorMesh); }
  FX.karooGrow = (c) => { const g = new THREE.Group(); g.userData.isFx = true; growObj = g; return { obj: g, mat: null, tick: (t) => { g.userData.t = t; } }; };
  const wv = new THREE.Vector3(), nv = new THREE.Vector3();
  function growTick(dt) { const on = !!(growObj && growObj.visible); growU = on ? Math.min(7, growU + dt) : Math.max(0, growU - dt * 3); if (!GP[0]) return; const u = growU;
    const up = sm(u / 1.6), up2 = sm((u - 0.5) / 1.4);
    if (GP[0]) GP[0].position.y = 18 * up;
    if (GP[1]) GP[1].position.y = 9 * up2;
    if (GP[2]) GP[2].visible = u < 0.9;
    // a lodge part moves in model space: lift straight up keeps it simple and true to the film (roof first, then the upper floor)
    const sweep = sm((u - 1.4) / 3.6);
    if (part.gather) part.gather.visible = u > 1.3;
    if (floorMesh) { floorMesh.visible = u > 1.1; floorM.opacity = sm((u - 1.1) / 0.6) * (0.08 + 0.17 * (1 - sweep)); }
    if (GATHER.length && LOD.room) { const ro = LOD.room, x0 = ro.origin[0] - ro.size[0] / 2 - 0.5, x1 = ro.origin[0] + ro.size[0] / 2 + 0.5, x = x0 + (x1 - x0) * sweep;
      wv.copy(lc).addScaledVector(lax, x); model.localToWorld(wv); nv.copy(lax).transformDirection(model.matrixWorld).negate(); clipP.setFromNormalAndCoplanarPoint(nv, wv);
      GATHER.forEach(m => { m.emissive.copy(HERO); m.emissiveIntensity = 0.9 * (1 - sm((u - 5.2) / 1.2)) + 0.12; }); } }

  // ---------- every frame ----------
  let clock = 0, peekTarget = 0;
  function tick(dt, state = {}) { base.tick(dt, state); clock += dt; modeT += dt; curSel = state.sel; curGrow = state.growOn;
    if (mode && (state.sel || state.growOn)) endMode(true);
    const k = dusk01();
    if (!state.sel) CANVAS.forEach(m => { m.emissive.copy(WARM); m.emissiveIntensity = 0.32 * k; });
    steam.update(clock, k);
    gooseTick(clock); waterT.value = reduced ? 0 : clock;
    // peek: lift the tent and the canvas roof of one cabin
    peekTarget = mode === 'peek' ? 1 : 0; peekP += Math.sign(peekTarget - peekP) * Math.min(Math.abs(peekTarget - peekP), dt / 1.6);
    if (peekI >= 0) { const cp = part['canopy' + peekI], lp = part['lid' + peekI], e = sm(peekP); if (cp) cp.position.y = 11 * sm(peekP * 1.25); if (lp) lp.position.y = 6 * sm(peekP * 1.25 - 0.25);
      if (peekP <= 0 && mode !== 'peek') peekI = -1; }
    if (mode === 'peek' && peekI >= 0) tagTo(tagCab, V3(C[peekI].top).add(new THREE.Vector3(0, 9, 0)), C[peekI].name + ' · sleeps ' + C[peekI].sleeps); else if (mode !== 'find') tagCab.style.display = 'none';
    // find: the cabin's name, the route drawing itself, the walk time
    if (mode === 'find' && wfCab >= 0) { tagTo(tagCab, V3(C[wfCab].top).add(new THREE.Vector3(0, 3, 0)), C[wfCab].name + ' · sleeps ' + C[wfCab].sleeps);
      if (routeMesh && wfDest) { routeT += dt; const n = routeMesh.geometry.index.count; routeMesh.geometry.setDrawRange(0, Math.floor(n * sm(routeT / 1.6) / 6) * 6); routeM.opacity = 0.85 + 0.15 * Math.sin(clock * 3);
        const end = wfDest.r.pts[wfDest.r.pts.length - 1]; if (routeT > 1.2) tagTo(tagDest, new THREE.Vector3(end.x, 4, end.z), DEST[wfDest.k].t + ' · ' + wfDest.text); } }
    // fire pit night
    fireP += Math.sign((mode === 'fire' ? 1 : 0) - fireP) * Math.min(Math.abs((mode === 'fire' ? 1 : 0) - fireP), dt / 1.2);
    seated.forEach((p, i) => { const a = cl(fireP * 2 - i * 0.12); p.visible = a > 0.02; p.scale.setScalar(Math.max(0.01, a)); });
    embers.update(clock, Math.max(fireP, k * 0.35));
    if (buyObj && !buyObj.visible) buyTag.style.display = 'none';
    lakeTick(dt); growTick(dt); }

  window.__karoo = { part, get mode() { return mode; }, get peekP() { return peekP; }, get growU() { return growU; }, get clock() { return clock; } };
  return { fx: FX, tick, dusk: base.dusk };
}
