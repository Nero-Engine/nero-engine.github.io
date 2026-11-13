// Tin Cup RV Park life layer (tincup1, 13-11-2026). Built on life1 (carts on the gravel lanes, cars on Tin Cup Road, lamps, Find your site)
// with the Riverbend 2 pieces (moving lake water, RV sheen down 20%, the border ribbon, ground grain, library people, heron and gulls) and:
// - the joke, the park's own name: a golfer on the Lake of the Woods course across the road slices his tee shot, the ball sails over
//   Tin Cup Road, bounces once on a camper's striped awning and drops PLOP into the tin coffee cup of a man in a camp chair. He looks at
//   the cup, looks at the course, raises the cup. The Locals tour stop flies to it, wide enough to see the tee, the road and the camper.
// - the office roof lifts (and the upper floor slides the other way) on the office card: the lounge with guests at the desk, the manager's flat above
// - its own effects for the cards: tcpads (the 75 pads light in a wave, each at its own height), tcmeters (42 meters glow green, 33 grey),
//   tcutil (city water and city sewer lines flow under the lanes), tcgrow (Room to grow: ghost pads rise on the east lawn, RVs arrive,
//   the 33 grey meters turn green). No halo rings anywhere.
// It moves in the web viewer only. The AR file stays a still model.
import { initPeople } from './people1.js?v=1';
let THREE;

export async function init(X) {
  THREE = X.THREE;
  const v = new URL(import.meta.url).searchParams.get('l1');
  const SC = X.SC, INFO = X.INFO;
  const base = await (await import('./life1.js' + (v ? '?v=' + v : ''))).init(X);
  const { model, part, MATS, D, NV } = X;
  const reduced = !!NV.reduced, HERO = new THREE.Color(D.theme.hero), PY = (INFO.protoAt || [0, -8, 0])[1];
  const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), sm = (x) => { x = cl(x); return x * x * (3 - 2 * x); };
  const back = (k) => { if (k <= 0) return 0; if (k >= 1) return 1; const c = 1.7, x = k - 1; return 1 + (c + 1) * x * x * x + c * x * x; };
  const flash = (t, a, d, decay = 2.2) => t <= a ? 0 : t < a + d ? (t - a) / d : Math.exp(-(t - a - d) * decay);
  const angTo = (a, b, k) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return a + d * k; };
  const FX = Object.assign({}, base.fx);
  const root = new THREE.Group(); root.name = 'tincup_life'; model.add(root);
  const kid = (name, parent = root) => { if (!part[name]) return null; const g = new THREE.Group(), inner = part[name].clone(true); inner.visible = true; inner.position.set(0, -PY, 0); g.add(inner);
    g.traverse(o => { if (o.isMesh) o.castShadow = true; }); parent.add(g); return g; };
  const lightM = (k, o = {}) => new THREE.MeshBasicMaterial(Object.assign({ color: new THREE.Color('#fff4dc').multiplyScalar(k), toneMapped: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }, o));

  // ground height under a point: life1's height grid (four reads a point). The raycast it replaced froze Chrome about 1.5 s on load (13-11-2026)
  const groundY = (x, z, fall = INFO.land ?? 0.5) => base.groundY(x, z, fall);

  // ---------- moving water on Lake of the Woods ----------
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
    m.customProgramCacheKey = () => 'tincupWater1'; m.needsUpdate = true; });

  // RV roofs and white sides: the sun sheen down 20% (as Riverbend)
  MATS.forEach(m => { if (m.userData.p !== 'rvs') return; const l = (m.color.r + m.color.g + m.color.b) / 3; if (l < 0.6 && !m.map) return;
    m.color.multiplyScalar(0.84); if (m.userData.c0) m.userData.c0.copy(m.color); m.roughness = Math.max(m.roughness, 0.45); m.envMapIntensity = (m.envMapIntensity ?? 1) * 0.8; if (m.userData.lum) m.userData.lum *= 0.84; });

  // ---------- library people who really walk ----------
  const PEOPLE = initPeople(X, root);

  // ---------- the land for sale: a soft ribbon of light round the 27.20 acres, always on, stronger at sunset ----------
  const ribU = { uK: { value: 1 }, uT: { value: 0 } }, HG = HERO.clone();
  try { if (part.border) { const bm = new THREE.MeshBasicMaterial({ color: HG.clone().multiplyScalar(2.6), toneMapped: false }); part.border.traverse(o => { if (o.isMesh) { o.material = bm; o.castShadow = false; } }); }
    const BP = INFO.border || []; if (BP.length > 4) { const W2 = 10, pos = [], uv = [], idx = [];
      for (let i = 0; i < BP.length; i++) { const a = BP[Math.max(0, i - 1)], b = BP[Math.min(BP.length - 1, i + 1)], p = BP[i]; let dx = b[0] - a[0], dz = b[2] - a[2]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
        pos.push(p[0] - dz * W2, p[1] + 0.15, p[2] + dx * W2, p[0] + dz * W2, p[1] + 0.15, p[2] - dx * W2); uv.push(0, i, 1, i); if (i) { const k = (i - 1) * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
      const m = new THREE.ShaderMaterial({ uniforms: Object.assign(ribU, { uC: { value: new THREE.Vector3(HG.r, HG.g, HG.b) } }), transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
        vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: 'uniform float uK, uT; uniform vec3 uC; varying vec2 vU; void main(){ float d = abs(vU.x - 0.5) * 2.0; float a = exp(-d * d * 5.0) * 0.6 + exp(-d * d * 40.0) * 0.65; float run = 0.85 + 0.15 * sin(vU.y * 0.25 - uT * 2.0); gl_FragColor = vec4(mix(uC * 0.9, mix(uC, vec3(1.0), 0.45), exp(-d * d * 60.0)), clamp(a * uK * run, 0.0, 0.95)); }' });
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
      part.ground.traverse(o => { if (o.isMesh && o.material && o.material.map) { o.material.normalMap = t; o.material.normalScale = new THREE.Vector2(0.35, 0.35); o.material.roughness = 1; o.material.metalness = 0; o.material.envMapIntensity = Math.min(o.material.envMapIntensity ?? 1, 0.35); o.material.needsUpdate = true; } }); } } catch (err) { console.warn('grain', err); }

  // ---------- wildlife on Lake of the Woods: the heron wades and fishes, gulls glide over the lake, the boat rocks ----------
  const WD = INFO.wild || {};
  let heron = null, hb = null; if (WD.heron) { heron = kid('proto_heron'); if (heron) { hb = WD.heron; heron.position.set(hb.at[0], hb.y, hb.at[1]); heron.rotation.y = hb.ry; } }
  const gulls = []; if (WD.gulls) for (let i = 0; i < (WD.gulls.n || 3); i++) { const g = kid('proto_gull'); if (g) gulls.push({ g, ph: i * 2.1, r: WD.gulls.r * (0.7 + 0.18 * i), y: WD.gulls.y + i * 4, dir: i % 2 ? -1 : 1, sp: 0.16 - i * 0.02 }); }
  function wildTick(dt, t) {
    if (heron && hb) { const P = 16, c = reduced ? 3 : t % P, side = [Math.cos(hb.ry), -Math.sin(hb.ry)];
      const w = c < 4 ? sm(c / 4) : c < 12 ? 1 : 1 - sm((c - 12) / 4), off = (w - 0.5) * (hb.wade || 6);
      heron.position.set(hb.at[0] + side[0] * off, hb.y + (c < 4 || c > 12 ? Math.abs(Math.sin(c * 3.2)) * 0.04 : 0), hb.at[1] + side[1] * off);
      const walkDir = c < 4 ? 1 : c > 12 ? -1 : 0, face = walkDir ? Math.atan2(side[0] * walkDir, side[1] * walkDir) : hb.ry;
      heron.rotation.y += (((face - heron.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * Math.min(1, 3 * dt);
      const strike = c > 8.2 && c < 8.9 ? Math.sin((c - 8.2) / 0.7 * Math.PI) : 0, peer = c > 5 && c < 8.2 ? 0.18 : 0;
      heron.rotation.x = reduced ? 0 : peer + strike * 0.55; }
    gulls.forEach(G => { const a = G.ph + (reduced ? 0 : t * G.sp * G.dir), c0 = WD.gulls.c; G.g.position.set(c0[0] + Math.cos(a) * G.r, G.y + Math.sin(t * 0.5 + G.ph) * 1.5, c0[1] + Math.sin(a) * G.r);
      G.g.rotation.set(0, Math.atan2(-Math.sin(a) * G.dir, Math.cos(a) * G.dir), -0.35 * G.dir, 'YXZ'); });
    if (part.lakelife && !reduced) { part.lakelife.position.y = Math.sin(t * 0.9) * 0.05; }
  }


  // gravel lanes drawn in front of the ground, and tap a thing to open its card: in life1.js since 13-11-2026 (scene.life.front, scene.life.tap)

  // ---------- the office roof lifts on the office card: the roof up and one way, the upper floor up a little the other way ----------
  const OF = INFO.office || null, roofCard = (SC.life && SC.life.roofCard) || 'office'; let roofE = 0;
  function tickRoof(dt, sel) { if (!OF || !part.office_roof) return; const want = sel && sel.id === roofCard ? 1 : 0;
    roofE += (want - roofE) * Math.min(1, (want ? 1.6 : 3) * dt); const e = sm(roofE), f = OF.f || 0, sx = Math.sin(f + Math.PI / 2), sz = Math.cos(f + Math.PI / 2);
    const up = 13 * Math.sin(Math.PI * 0.5 * Math.min(1, e * 1.3)) + (e > 0.99 && !reduced ? Math.sin(clock * 1.4) * 0.3 : 0);
    part.office_roof.position.set(sx * 12 * e, up, sz * 12 * e);
    if (part.office_upper) part.office_upper.position.set(-sx * 9 * e, 6 * Math.sin(Math.PI * 0.5 * Math.min(1, e * 1.3)), -sz * 9 * e);
    part.office_roof.traverse(m => { if (m.isMesh) m.castShadow = e < 0.05; }); }

  // ---------- the joke: Tin Cup ----------
  const J = INFO.joke || null, JK = { c: 3, on: false };
  if (J && part.proto_golfer && part.proto_ball && part.proto_cup && part.proto_camper) try {
    const tee = new THREE.Vector3(...J.tee), ry = J.teeRy, fx = new THREE.Vector3(Math.cos(ry), 0, -Math.sin(ry)), fz = new THREE.Vector3(Math.sin(ry), 0, Math.cos(ry));
    // the golfer stands side-on, left of the ball, facing it; the club hangs from his hands and swings in the line of the shot
    const golfer = kid('proto_golfer'); golfer.position.copy(tee).addScaledVector(fx, -0.72); golfer.rotation.y = ry + Math.PI / 2;
    const frame = new THREE.Group(); frame.position.copy(tee).addScaledVector(fx, -0.32).add(new THREE.Vector3(0, 0.95, 0)); frame.rotation.y = ry; root.add(frame);
    const swing = new THREE.Group(); frame.add(swing); const club = kid('proto_club', swing); if (club) club.rotation.z = 0.33;
    // the ball, a soft glow round it in flight so it reads from the wide view, and a short trail of light
    const ball = kid('proto_ball'), glow = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 8), lightM(2.2, { opacity: 0.85 })); root.add(glow); glow.visible = false;
    const TRN = 26, trailM = lightM(1.4, { opacity: 0.6 }), trail = new THREE.InstancedMesh(new THREE.SphereGeometry(0.22, 8, 6), trailM, TRN); trail.frustumCulled = false; root.add(trail);
    const hist = []; const m4 = new THREE.Matrix4(), q0 = new THREE.Quaternion(), sv = new THREE.Vector3();
    // the camper in his camp chair beside the trailer, his tin cup in his right hand
    const chair = kid('proto_chair'), chairP = new THREE.Vector3(...J.chair); chair.position.copy(chairP); chair.rotation.y = J.chairRy;
    const camper = kid('proto_camper'); camper.position.copy(chairP); camper.rotation.y = J.chairRy;
    const cR = new THREE.Vector3(Math.cos(J.chairRy), 0, -Math.sin(J.chairRy)), cF = new THREE.Vector3(Math.sin(J.chairRy), 0, Math.cos(J.chairRy));
    const cupG = new THREE.Group(); root.add(cupG); kid('proto_cup', cupG);
    const cupHome = chairP.clone().addScaledVector(cR, -0.3).addScaledVector(cF, 0.28).add(new THREE.Vector3(0, 0.66, 0));
    const cupUp = chairP.clone().addScaledVector(cR, -0.32).addScaledVector(cF, 0.3).add(new THREE.Vector3(0, 1.45, 0));
    const drops = []; for (let i = 0; i < 5; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 4), new THREE.MeshStandardMaterial({ color: '#6b4426', roughness: 0.3 })); d.visible = false; root.add(d); drops.push({ d, a: i / 5 * Math.PI * 2 }); }
    const awn = new THREE.Vector3(...J.awning), faceTee = Math.atan2(tee.x - chairP.x, tee.z - chairP.z);
    // one loop, seconds: address, swing and hit, the ball flies (a slice: out left, curling back right), bounces on the awning, PLOP,
    // he looks down at the cup, turns to the course, raises the cup to the golfer; the golfer shades his eyes; a fresh ball
    const HIT = 4.2, FLY = 4.6, LAND = HIT + FLY, HOP = 0.75, PLOP = LAND + HOP, PERIOD = 22;
    const flightAt = (u, o) => { o.lerpVectors(tee, awn, u); const lift = 4 * u * (1 - u); o.y += 26 * lift; o.addScaledVector(fx, -9 * lift * (1 - u * 0.4)); return o; };
    const hopAt = (u, o) => { o.lerpVectors(awn, cupHome, u); o.y += 1.1 * 4 * u * (1 - u) + 0.06; return o; };
    const bp = new THREE.Vector3();
    JK.view = () => { const mid = new THREE.Vector3().lerpVectors(tee, chairP, 0.5), wide = innerWidth < 760;
      return { at: [mid.x, 2, mid.z], dist: wide ? 150 : 118, el: 0.42, az: ry + Math.PI / 2 + 0.55 }; };
    JK.close = () => ({ at: [chairP.x, chairP.y + 1, chairP.z], dist: 9, el: 0.35, az: J.chairRy + 0.4 });
    JK.on = true; JK.set = (c) => { JK.c = c; hist.length = 0; };
    JK.tick = (dt) => { JK.c = (JK.c + dt) % PERIOD; const c = reduced ? PLOP + 3 : JK.c;
      // the swing: waggle, slow backswing, fast downswing through the ball, hold the follow-through
      let ph = 0; if (c < 2.6) ph = 0.12 * Math.sin(c * 4) * (c > 1 ? 1 : 0); else if (c < 3.8) ph = 2.3 * sm((c - 2.6) / 1.2); else if (c < HIT) ph = 2.3 - 4.3 * sm((c - 3.8) / (HIT - 3.8)); else if (c < HIT + 0.25) ph = -2.0 - 0.3 * sm((c - HIT) / 0.25); else if (c < PERIOD - 2) ph = -2.3; else ph = -2.3 * (1 - sm((c - PERIOD + 2) / 1.6));
      swing.rotation.x = ph; golfer.rotation.y = ry + Math.PI / 2 + (ph < 0 ? -0.55 * cl(-ph / 2.3) : 0.35 * cl(ph / 2.3));
      // the ball
      let show = true, flying = false;
      if (c < HIT) bp.copy(tee).add(new THREE.Vector3(0, 0.05, 0));
      else if (c < LAND) { flightAt((c - HIT) / FLY, bp); flying = true; }
      else if (c < PLOP) hopAt((c - LAND) / HOP, bp), flying = true;
      else { show = c < PERIOD - 1.2; bp.copy(cupG.position).add(new THREE.Vector3(0, 0.04, 0)); }
      ball.visible = show && !(c >= PLOP); ball.position.copy(bp);
      // big and bright in the air so it reads from the wide view, shrinking to a real ball as it drops to the cup
      const gs = c < LAND - 0.6 ? 2.6 : c < PLOP ? 2.6 - 2.35 * sm((c - LAND + 0.6) / (HOP + 0.6)) : 0.25;
      glow.visible = flying; glow.position.copy(bp); glow.scale.setScalar(gs); glow.material.opacity = 0.85;
      if (flying) { hist.unshift(bp.clone()); if (hist.length > TRN) hist.pop(); } else if (hist.length) hist.pop();
      for (let i = 0; i < TRN; i++) { const p = hist[i]; m4.compose(p || bp, q0, sv.setScalar(p ? Math.max(1e-4, (1 - i / TRN) * gs) : 1e-4)); trail.setMatrixAt(i, m4); } trail.instanceMatrix.needsUpdate = true;
      // on the Golf next door card the camera starts wide (tee, road and camper in one shot), then glides in for the bounce and the PLOP
      if (JK.follow && c > LAND - 1.7 && c < LAND - 1.5 && JK.goneClose !== JK.selN) { JK.goneClose = JK.selN; X.goView(JK.close(), 1.5); }
      // the cup: in his hand, a wobble on the PLOP, a splash of coffee, then raised to the course
      const k = c > PLOP + 4.2 && c < PERIOD - 2.2 ? sm((c - PLOP - 4.2) / 0.9) : c >= PERIOD - 2.2 ? 1 - sm((c - PERIOD + 2.2) / 1.2) : 0;
      cupG.position.lerpVectors(cupHome, cupUp, k); const wob = c > PLOP && c < PLOP + 0.8 ? Math.sin((c - PLOP) * 30) * 0.18 * (1 - (c - PLOP) / 0.8) : 0;
      cupG.rotation.set(wob, J.chairRy, 0, 'YXZ');
      drops.forEach((o, i) => { const u = (c - PLOP) / 0.5; o.d.visible = u > 0 && u < 1; if (!o.d.visible) return; o.d.position.set(cupHome.x + Math.cos(o.a) * 0.09 * u, cupHome.y + 0.11 + 0.22 * 4 * u * (1 - u), cupHome.z + Math.sin(o.a) * 0.09 * u); });
      // the camper: looks down at the cup, then round at the course, raises the cup, then back to his view
      let cy = J.chairRy, lean = 0;
      if (c > PLOP + 0.3 && c < PLOP + 2.1) lean = 0.22 * sm((c - PLOP - 0.3) / 0.4);
      if (c > PLOP + 2.1 && c < PERIOD - 1.8) { cy = angTo(J.chairRy, faceTee, 0.55 * sm((c - PLOP - 2.1) / 0.7)); lean = 0.22 * (1 - sm((c - PLOP - 2.1) / 0.5)); }
      else if (c >= PERIOD - 1.8) cy = angTo(angTo(J.chairRy, faceTee, 0.55), J.chairRy, sm((c - PERIOD + 1.8) / 1.2));
      camper.rotation.set(lean, cy, 0, 'YXZ');
    };
    JK.c = 1;
  } catch (err) { console.warn('tincup joke', err); }
  // the Locals tour stop: fly out wide so the tee, the road and the camper share the frame, timed so the swing comes as the camera settles
  let tourSel = null, tourSelT = 0, tourDone = false;
  function tourTick(dt, state) { const tb = document.getElementById('tourbtn'), touring = !!(tb && tb.classList.contains('on')), id = state.sel && state.sel.id;
    if (id !== tourSel) { tourSel = id; tourSelT = 0; JK.follow = id === 'locals' && JK.on; if (JK.follow) { JK.selN = (JK.selN || 0) + 1; JK.set(touring ? 1.0 : 2.0); } } tourSelT += dt;
    if (!touring) { tourDone = false; return; }
    if (id === 'locals' && !tourDone && tourSelT > 1.2) tourDone = true; }
  window.__tincup = { get c() { return JK.c; }, set: (c) => JK.set && JK.set(c), look: () => JK.view && X.goView(JK.view(), 0.01), close: () => JK.close && X.goView(JK.close(), 0.01), part, root, FX,
    go: (v) => X.goView(v, 0.01), screen: (p) => { const v = model.localToWorld(new THREE.Vector3(...p)).project(X.camera), r = X.renderer.domElement.getBoundingClientRect(); return [r.left + (v.x + 1) / 2 * r.width, r.top + (1 - v.y) / 2 * r.height]; } };

  // ---------- card effects ----------
  const sitePads = INFO.sitePads || [], siteRot = INFO.siteRot || [], siteKind = INFO.siteKind || [];
  // a thin frame of light round each pad, at its own height; the 75 light in a wave from the entrance outwards
  FX.tcpads = (c) => { const g = new THREE.Group(), n = sitePads.length, m = lightM(c.k ?? 2.2, { vertexColors: false }), sides = [];
    const bar = new THREE.BoxGeometry(1, 0.12, 1); for (let s = 0; s < 4; s++) { const im = new THREE.InstancedMesh(bar, m, n); im.frustumCulled = false; im.renderOrder = 5; for (let i = 0; i < n; i++) im.setColorAt(i, new THREE.Color(0, 0, 0)); g.add(im); sides.push(im); }
    const ent = INFO.lanes && INFO.lanes.east ? INFO.lanes.east[0] : [80, -187], order = sitePads.map((p, i) => Math.hypot(p[0] - ent[0], p[2] - ent[1])), dmax = Math.max(...order);
    const pv = new THREE.Vector3(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), col = new THREE.Color(), m4 = new THREE.Matrix4();
    sitePads.forEach((p, i) => { const L = siteKind[i] === 'field' ? 13 : 15, W = 4.6, r = siteRot[i] || 0; q.setFromAxisAngle(up, r);
      const ux = new THREE.Vector3(1, 0, 0).applyQuaternion(q), uz = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
      [[ux, W / 2, 0.22, L], [ux, -W / 2, 0.22, L], [uz, L / 2, W, 0.22], [uz, -L / 2, W, 0.22]].forEach(([u, o, sx, sz], s) => { pv.set(p[0], p[1] + 0.32, p[2]).addScaledVector(u, o); m4.compose(pv, q, new THREE.Vector3(sx, 1, sz)); sides[s].setMatrixAt(i, m4); }); });
    return { obj: g, mat: m, tick: (t, k) => { sitePads.forEach((p, i) => { const a = 0.3 + order[i] / dmax * 2.2, b = flash(t, a, 0.25, 1.6) * 0.9 + (t > a ? 0.35 : 0); col.setScalar(b * k); sides.forEach(s => s.setColorAt(i, col)); });
      sides.forEach(s => { s.instanceColor.needsUpdate = true; }); } }; };
  // the meters: a small cap of light on each post, 42 green (metered today), 33 dim (next)
  const meters = INFO.meters || [];
  FX.tcmeters = (c) => { const g = new THREE.Group(), on = meters.filter(m => m[3]), off = meters.filter(m => !m[3]);
    const cap = new THREE.BoxGeometry(0.8, 0.8, 0.8), mOn = new THREE.MeshBasicMaterial({ color: new THREE.Color('#3dff7a').multiplyScalar(c.k ?? 3), toneMapped: false, transparent: true }), mOff = new THREE.MeshBasicMaterial({ color: new THREE.Color('#c9d2dc').multiplyScalar(0.9), toneMapped: false, transparent: true });
    const put = (L, mat) => { const im = new THREE.InstancedMesh(cap, mat, Math.max(1, L.length)); im.frustumCulled = false; const m4 = new THREE.Matrix4(); L.forEach((p, i) => im.setMatrixAt(i, m4.makeTranslation(p[0], p[1] + 1.9, p[2]))); g.add(im); return im; };
    const a = put(on, mOn), b = put(off, mOff); a.count = 0;
    return { obj: g, mat: mOn, tick: (t, k, pulse) => { a.count = Math.min(on.length, Math.floor(t * 30)); mOn.opacity = k * (0.75 + 0.25 * (pulse ?? 1)); mOff.opacity = k * 0.55 * cl((t - 1.6) * 2); } }; };
  // city water (blue) and city sewer (green) flowing along under every lane
  const flowU = { uT: { value: 0 } };
  FX.tcutil = (c) => { const g = new THREE.Group(), lanes = Object.values(INFO.lanes || {});
    const mk = (hex) => new THREE.ShaderMaterial({ uniforms: Object.assign({ uC: { value: new THREE.Color(hex).multiplyScalar(c.k ?? 2.4) }, uK: { value: 0 } }, flowU), transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending,
      vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform vec3 uC; uniform float uT, uK; varying vec2 vU; void main(){ float d = 0.55 + 0.45 * smoothstep(0.35, 0.0, abs(fract(vU.x * 40.0 - uT * 0.9) - 0.5)); gl_FragColor = vec4(uC * d, uK * d); }' });
    const mW = mk('#39a8ff'), mS = mk('#45e07a');
    lanes.forEach(L => { if (!L || L.length < 2) return; [[mW, 1.5], [mS, -1.5]].forEach(([m, off]) => { const pts = [];
      for (let i = 0; i < L.length; i++) { const a = L[Math.max(0, i - 1)], b = L[Math.min(L.length - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, x = L[i][0] - dz / l * off, z = L[i][1] + dx / l * off; pts.push(new THREE.Vector3(x, groundY(x, z) + 0.45, z)); }
      const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.1), mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(8, pts.length * 6), 0.6, 6, false), m); mesh.renderOrder = 7; g.add(mesh); }); });
    return { obj: g, mat: mW, tick: (t, k) => { mW.uniforms.uK.value = k * cl(t * 1.5); mS.uniforms.uK.value = k * cl(t * 1.5 - 0.6); } }; };
  // Room to grow: new gravel lanes draw in, the ghost pads rise one by one in white light, RVs arrive on every other pad, the grey meters turn green
  const growMeters = { k: 0, want: 0 };
  FX.tcgrow = (c) => { const g = new THREE.Group(), all = INFO.grow || [], rots = INFO.growRot || [], N = Math.min(all.length, c.n ?? 30), pads = all.slice(0, N);
    const lanes = ((INFO.life || {}).growLanes || []).map(l => { const a = l[0], b = l[l.length - 1], y = groundY((a[0] + b[0]) / 2, (a[1] + b[1]) / 2); return { a, b, y }; });
    const grav = new THREE.MeshStandardMaterial({ color: '#d9d2c2', roughness: 0.95 }), laneMs = lanes.map(l => { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 0.25, 6.5), grav); m.receiveShadow = true; g.add(m); return m; });
    const padGeo = []; if (part.proto_pad) part.proto_pad.traverse(o => { if (o.isMesh) { const gg = o.geometry.clone(); o.updateMatrix(); gg.applyMatrix4(o.matrix); gg.translate(0, -PY, 0); padGeo.push([gg, o.material]); } });
    const padI = padGeo.map(([gg, mm]) => { const im = new THREE.InstancedMesh(gg, mm, N); im.receiveShadow = true; im.frustumCulled = false; g.add(im); return im; });
    const rvGeo = []; if (part.proto_rv) part.proto_rv.traverse(o => { if (o.isMesh) { const gg = o.geometry.clone(); o.updateMatrix(); gg.applyMatrix4(o.matrix); gg.translate(0, -PY, 0); rvGeo.push([gg, o.material]); } });
    const RVN = Math.ceil(N / 2), rvI = rvGeo.map(([gg, mm]) => { const im = new THREE.InstancedMesh(gg, mm, RVN); im.castShadow = true; im.frustumCulled = false; g.add(im); return im; });
    const ghostM = lightM(c.k ?? 1.6), ghost = new THREE.InstancedMesh(new THREE.BoxGeometry(4.9, 0.5, 13.4), ghostM, N); ghost.frustumCulled = false; ghost.renderOrder = 5; for (let i = 0; i < N; i++) ghost.setColorAt(i, new THREE.Color(0, 0, 0)); g.add(ghost);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), pv = new THREE.Vector3(), sv = new THREE.Vector3(), col = new THREE.Color();
    const T = { lane: [0.2, 1.4], pad0: 1.2, padGap: 0.11, padDur: 0.5, rv0: 4.6, rvGap: 0.16, rvDur: 0.7, meters: 3.6 };
    return { obj: g, mat: ghostM, tick: (t) => { growMeters.want = t > T.meters ? 1 : 0;
      lanes.forEach((l, i) => { const f = sm((t - T.lane[0] - i * 0.3) / (T.lane[1] - T.lane[0])), len = Math.hypot(l.b[0] - l.a[0], l.b[1] - l.a[1]) * f, ang = Math.atan2(l.b[1] - l.a[1], l.b[0] - l.a[0]);
        const m = laneMs[i]; m.visible = f > 0; m.scale.x = Math.max(len, 1e-3); m.rotation.y = -ang; m.position.set(l.a[0] + Math.cos(ang) * len / 2, l.y + 0.05, l.a[1] + Math.sin(ang) * len / 2); });
      pads.forEach((p, i) => { const a = T.pad0 + i * T.padGap, f = cl((t - a) / T.padDur), b = back(f); q.setFromAxisAngle(up, rots[i] || 0);
        m4.compose(pv.set(p[0], p[1] - 0.5 + 0.52 * b, p[2]), q, sv.setScalar(f > 0 ? 1 : 1e-4)); padI.forEach(im => im.setMatrixAt(i, m4));
        const gb = flash(t, a, 0.3, 1.4) * 1.0 + (t > a ? 0.04 : 0); m4.compose(pv.set(p[0], p[1] + 0.2, p[2]), q, sv.setScalar(gb > 0.004 ? 1 : 1e-4)); ghost.setMatrixAt(i, m4); ghost.setColorAt(i, col.setScalar(gb)); });
      padI.forEach(im => { im.instanceMatrix.needsUpdate = true; }); ghost.instanceMatrix.needsUpdate = true; ghost.instanceColor.needsUpdate = true;
      for (let j = 0; j < RVN; j++) { const i = j * 2, p = pads[i]; if (!p) continue; const a = T.rv0 + j * T.rvGap, f = cl((t - a) / T.rvDur), r = rots[i] || 0, fwd = new THREE.Vector3(Math.sin(r), 0, Math.cos(r));
        // each RV rolls the last 14 m onto its pad (backs in) and settles
        const off = (1 - sm(f)) * 14; m4.compose(pv.set(p[0] + fwd.x * off, p[1] + 0.12, p[2] + fwd.z * off), q.setFromAxisAngle(up, r), sv.setScalar(f > 0 ? 1 : 1e-4)); rvI.forEach(im => im.setMatrixAt(j, m4)); }
      rvI.forEach(im => { im.instanceMatrix.needsUpdate = true; }); } }; };
  // the grey meters turn green with Room to grow (and go back after)
  const meterNext = []; MATS.forEach(m => { if (m.name === 'meter_next') meterNext.push(m); });
  const GREEN = new THREE.Color('#3ddc6a');
  function tickMeters(dt, state) { if (!state.growOn) growMeters.want = 0; growMeters.k += (growMeters.want - growMeters.k) * Math.min(1, 3 * dt);
    meterNext.forEach(m => { if (!m.userData.c0) return; m.color.copy(m.userData.c0).lerp(GREEN, growMeters.k); if (m.emissive) m.emissive.copy(m.userData.e0 || new THREE.Color(0, 0, 0)).lerp(GREEN, growMeters.k * 0.8); }); }

  // ---------- every frame ----------
  let clock = 0;
  function tick(dt, state = {}) { base.tick(dt, state); clock += dt;
    waterT.value = reduced ? 0 : clock * 1.8; flowU.uT.value = clock;
    if (JK.tick) JK.tick(dt); tourTick(dt, state); tickRoof(dt, state.sel); tickMeters(dt, state);
    PEOPLE.tick(dt, clock); wildTick(dt, clock);
    ribU.uT.value = clock; ribU.uK.value = 1.1 + 0.6 * (base.dusk ? base.dusk() : 0); }
  return { fx: FX, tick, dusk: base.dusk };
}
