// Totem Pole RV Park life layer (10-11-2026, reworked 11-11-2026 from Adam's review): life1 (people, golf carts, I-37 traffic, swimmers, sunset,
// the Room to grow build) plus, for this park:
//  - the pond as real water (Adam: "you know there's a big lake. That comes with the business"): the sky reflected in moving ripples (the water
//    normal map, two layers drifting), drifting cloud reflections, a sun glint that follows the sun into the Sunset view, a soft shoreline;
//  - life on the water: egrets circling over it, a great blue heron wading at the edge, a few ducks paddling;
//  - a fine grain on the ground, so the low sun catches the land (it reads as a landscape, not a flat photo);
//  - Room to grow as the film has it: the new lanes and pads (life1's build), plus a row of nine timber cabins with porches and an RV and boat
//    storage yard (four canopy rows, rigs and boats under), each labelled as an idea;
//  - the funny touch: an armadillo strolls across an empty pad; a camper in a safari hat creeps up with a camera, crouches, the flash goes off, the
//    armadillo jumps straight up and scurries off, the camper runs after it. Repeats. "The locals" card cues it so it plays while the card is up.
// Model frame metres throughout (INFO.life). The AR file stays still: it has the water and the border, not the moving pieces.
let THREE;

export async function init(X) {
  THREE = X.THREE;
  const v = new URL(import.meta.url).searchParams.get('l1');
  const base = await (await import('./life1.js' + (v ? '?v=' + v : ''))).init(X);
  const { model, part, INFO, SC, NV, camera, sun } = X;
  const L = INFO.life || {}, A = L.armadillo, reduced = !!NV.reduced, TS = (SC.life || {}).speed ?? 1.5, PY = (INFO.protoAt || [0, -8, 0])[1], LAND = INFO.land ?? 0.1;
  const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), sm = (x) => { x = cl(x); return x * x * (3 - 2 * x); };
  const angTo = (a, b, k) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return a + d * k; };
  const inPoly = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [x1, z1] = P[i], [x2, z2] = P[j]; if ((z1 > z) !== (z2 > z) && x < x1 + ((z - z1) * (x2 - x1)) / (z2 - z1)) c = !c; } return c; };
  const segD = (P, x, z) => { let m = 1e9; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [ax, az] = P[j], [bx, bz] = P[i], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1e-9, t = cl(((x - ax) * dx + (z - az) * dz) / l2); m = Math.min(m, Math.hypot(x - ax - t * dx, z - az - t * dz)); } return m; };
  const std = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: new THREE.Color(c), roughness: 0.8 }, o));
  let duskK = 0; const dusk = () => (base.dusk ? base.dusk() : 0);

  // ---------- 1. the pond: real water ----------
  const WP = L.water || [], WY = L.waterY ?? 0;
  const wU = { uT: { value: 0 }, uSun: { value: new THREE.Vector3(0, 1, 0) }, uSunC: { value: new THREE.Color(1, 1, 1) }, uDusk: { value: 0 }, uNorm: { value: null }, uHasN: { value: 0 } };
  let wC = null;
  if (WP.length > 5) try {
    if (part.water) { part.water.traverse(o => { if (o.isMesh && o.material.normalMap) { const t = o.material.normalMap; t.wrapS = t.wrapT = THREE.RepeatWrapping; wU.uNorm.value = t; wU.uHasN.value = 1; } }); part.water.visible = false; }
    const xs = WP.map(p => p[0]), zs = WP.map(p => p[1]), x0 = Math.min(...xs) - 4, x1 = Math.max(...xs) + 4, z0 = Math.min(...zs) - 4, z1 = Math.max(...zs) + 4, ST = 1.6;
    const nx = Math.ceil((x1 - x0) / ST) + 1, nz = Math.ceil((z1 - z0) / ST) + 1, pos = new Float32Array(nx * nz * 3), ed = new Float32Array(nx * nz), idx = [];
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const x = x0 + i * ST, z = z0 + j * ST, k = j * nx + i; pos.set([x, WY, z], k * 3); ed[k] = (inPoly(WP, x, z) ? 1 : -1) * segD(WP, x, z); }
    for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; if (Math.max(ed[a], ed[b], ed[c], ed[d]) < -0.8) continue; idx.push(a, c, b, b, c, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aEdge', new THREE.BufferAttribute(ed, 1)); g.setIndex(idx);
    const m = new THREE.ShaderMaterial({ uniforms: wU, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
      vertexShader: `attribute float aEdge; varying float vE; varying vec2 vP; varying vec3 vW;
        void main() { vE = aEdge; vP = position.xz; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: `uniform float uT, uDusk, uHasN; uniform vec3 uSun, uSunC; uniform sampler2D uNorm; varying float vE; varying vec2 vP; varying vec3 vW;
        float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float n2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
        float fbm(vec2 p) { float a = 0.5, s = 0.0; for (int k = 0; k < 4; k++) { s += a * n2(p); p *= 2.03; a *= 0.5; } return s; }
        vec3 sky(vec3 r) { float t = clamp(r.y, 0.0, 1.0);
          vec3 dz = vec3(0.16, 0.36, 0.72), dh = vec3(0.6, 0.75, 0.9), sz = vec3(0.3, 0.2, 0.32), sh = vec3(0.98, 0.52, 0.28);
          vec3 c = mix(mix(dh, dz, pow(t, 0.55)), mix(sh, sz, pow(t, 0.45)), uDusk);
          vec2 q = r.xz / (r.y + 0.2) * 1.6 + vec2(uT * 0.004, uT * 0.002); float cl = smoothstep(0.5, 0.78, fbm(q));
          c += sh * pow(max(dot(r, normalize(uSun)), 0.0), 3.0) * 0.7 * uDusk;
          return mix(c, mix(vec3(1.0, 1.0, 1.0), vec3(1.0, 0.7, 0.5), uDusk), cl * 0.75 * (1.0 - 0.3 * uDusk)); }
        void main() {
          if (vE < -0.8) discard;
          float fw = length(fwidth(vP));
          vec2 g = vec2(0.0);
          if (uHasN > 0.5) { vec3 a = texture2D(uNorm, vP * 0.07 + vec2(uT * 0.013, uT * 0.008)).xyz * 2.0 - 1.0; vec3 b = texture2D(uNorm, vP * 0.19 + vec2(-uT * 0.011, uT * 0.015)).xyz * 2.0 - 1.0;
            g = a.xy * 0.55 + b.xy * 0.45 * clamp(1.6 - fw * 2.0, 0.0, 1.0); }
          else { float e = 0.2, c0 = n2(vP * 0.4 + uT * 0.05); g = vec2(n2(vP * 0.4 + vec2(e, 0) + uT * 0.05) - c0, n2(vP * 0.4 + vec2(0, e) + uT * 0.05) - c0) / e; }
          float k = 0.6 * clamp(1.3 - fw * 0.25, 0.35, 1.0);
          vec3 N = normalize(vec3(-g.x * k, 1.0, -g.y * k)), V = normalize(cameraPosition - vW), R = reflect(-V, N);
          float fr = 0.06 + 0.94 * pow(1.0 - max(dot(N, V), 0.0), 5.0), refl = mix(0.24, 1.0, fr);
          vec3 deep = mix(vec3(0.03, 0.12, 0.16), vec3(0.03, 0.04, 0.09), uDusk) * (0.85 + 0.3 * fbm(vP * 0.03));
          vec3 col = mix(deep, sky(R) * (1.0 - 0.4 * uDusk), refl * (1.0 - 0.25 * uDusk));
          float sp = max(dot(R, normalize(uSun)), 0.0);
          col += uSunC * (pow(sp, 900.0) * 8.0 + pow(sp, 90.0) * 0.45 * (0.6 + uDusk) + pow(sp, 10.0) * 0.18);
          col = mix(col, col * 1.2 + vec3(0.03, 0.05, 0.03), (1.0 - smoothstep(0.0, 7.0, vE)) * 0.45);   // shallows lighter near the shore
          float a = smoothstep(-0.6, 3.5, vE) * 0.95;
          gl_FragColor = vec4(col, a);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }` });
    wC = new THREE.Mesh(g, m); wC.name = 'pondWater'; wC.renderOrder = 3; wC.frustumCulled = false; model.add(wC);
  } catch (err) { console.warn('water', err); }

  // the land for sale: a bright blue core line (the model's tube) and a soft glow ribbon on the ground either side of it, always on, stronger at sunset
  const ribU = { uK: { value: 1 }, uT: { value: 0 } };
  try { if (part.border) { const bm = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.16, 0.45, 1.0).multiplyScalar(1.15), toneMapped: false }); part.border.traverse(o => { if (o.isMesh) { o.material = bm; o.castShadow = false; } }); }
    const BP = INFO.border || []; if (BP.length > 4) { const W2 = 9, pos = [], uv = [], idx = [];
      for (let i = 0; i < BP.length; i++) { const a = BP[Math.max(0, i - 1)], b = BP[Math.min(BP.length - 1, i + 1)], p = BP[i]; let dx = b[0] - a[0], dz = b[2] - a[2]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
        pos.push(p[0] - dz * W2, p[1] + 0.15, p[2] + dx * W2, p[0] + dz * W2, p[1] + 0.15, p[2] - dx * W2); uv.push(0, i, 1, i); if (i) { const k = (i - 1) * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
      const m = new THREE.ShaderMaterial({ uniforms: ribU, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
        vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: 'uniform float uK, uT; varying vec2 vU; void main(){ float d = abs(vU.x - 0.5) * 2.0; float a = exp(-d * d * 6.0) * 0.5 + exp(-d * d * 60.0) * 0.45; float run = 0.85 + 0.15 * sin(vU.y * 0.25 - uT * 2.0); gl_FragColor = vec4(mix(vec3(0.1, 0.36, 0.95), vec3(0.45, 0.7, 1.0), exp(-d * d * 60.0)), clamp(a * uK * run, 0.0, 0.9)); }' });
      const rib = new THREE.Mesh(g, m); rib.name = 'borderGlow'; rib.renderOrder = 6; rib.frustumCulled = false; model.add(rib); } } catch (err) { console.warn('border', err); }

  // ---------- 2. a fine grain on the ground: the low sun catches the land ----------
  try { if (part.ground) { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), id = x.createImageData(256, 256);
      const H = new Float32Array(256 * 256); let s = 7; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
      for (let o = 0; o < 6; o++) { const f = 2 ** (o + 2), amp = 1 / (o + 1.2), G = []; for (let i = 0; i < f * f; i++) G.push(r());
        for (let j = 0; j < 256; j++) for (let i = 0; i < 256; i++) { const u = i / 256 * f, w = j / 256 * f, i0 = Math.floor(u), j0 = Math.floor(w), a = u - i0, b = w - j0, P = (p, q) => G[(q % f) * f + (p % f)];
          const aa = a * a * (3 - 2 * a), bb = b * b * (3 - 2 * b); H[j * 256 + i] += amp * ((P(i0, j0) * (1 - aa) + P(i0 + 1, j0) * aa) * (1 - bb) + (P(i0, j0 + 1) * (1 - aa) + P(i0 + 1, j0 + 1) * aa) * bb); } }
      for (let j = 0; j < 256; j++) for (let i = 0; i < 256; i++) { const k = (j * 256 + i) * 4, dx = H[j * 256 + (i + 1) % 256] - H[j * 256 + (i + 255) % 256], dz = H[((j + 1) % 256) * 256 + i] - H[((j + 255) % 256) * 256 + i];
        const nn = new THREE.Vector3(-dx * 3, -dz * 3, 1).normalize(); id.data[k] = (nn.x * 0.5 + 0.5) * 255; id.data[k + 1] = (nn.y * 0.5 + 0.5) * 255; id.data[k + 2] = (nn.z * 0.5 + 0.5) * 255; id.data[k + 3] = 255; }
      x.putImageData(id, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(150, 150); t.anisotropy = 4;
      part.ground.traverse(o => { if (o.isMesh && o.material && o.material.map) { o.material.normalMap = t; o.material.normalScale = new THREE.Vector2(0.55, 0.55); o.material.needsUpdate = true; } }); } } catch (err) { console.warn('grain', err); }

  // ---------- 3. birds on the pond: egrets circling over it, a heron wading at the edge, ducks paddling ----------
  const birds = new THREE.Group(); birds.name = 'pondBirds'; model.add(birds); const BIRDS = [];
  if (WP.length > 5) try {
    const WHITE = std('#f6f6f2', { roughness: 0.6 }), YEL = std('#e7b43a'), BLK = std('#1d1d1f'), HGRY = std('#7f8fa3', { roughness: 0.75 }), HDARK = std('#3d4553'), HWHT = std('#e9e6dc');
    const DBR = std('#7a5a3c'), DGR = std('#1f5c3a', { roughness: 0.4 }), DWH = std('#efe9de');
    const mk = (geo, m, x, y, z, rx = 0, ry = 0, rz = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.castShadow = true; return o; };
    const S2 = 3;   // drawn twice life size, so they read from the desk view
    const egret = () => { const g = new THREE.Group(), body = mk(new THREE.SphereGeometry(0.16, 10, 8).scale(0.8, 0.8, 2.2), WHITE, 0, 0, 0);
      const neck = mk(new THREE.CylinderGeometry(0.04, 0.05, 0.4, 6), WHITE, 0, 0.06, 0.42, 1.2), head = mk(new THREE.SphereGeometry(0.06, 8, 6), WHITE, 0, 0.13, 0.6), bill = mk(new THREE.ConeGeometry(0.02, 0.18, 6), YEL, 0, 0.13, 0.72, Math.PI / 2);
      const legs = mk(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 4), BLK, 0, -0.02, -0.55, Math.PI / 2);
      const wingG = new THREE.BoxGeometry(0.75, 0.02, 0.32).translate(0.375, 0, 0), wl = mk(wingG, WHITE, 0.08, 0.04, 0.02), wr = mk(wingG, WHITE, -0.08, 0.04, 0.02, 0, Math.PI, 0);
      const tipG = new THREE.BoxGeometry(0.4, 0.015, 0.24).translate(0.2, 0, 0), tl = mk(tipG, WHITE, 0.75, 0, 0), tr = mk(tipG, WHITE, 0.75, 0, 0); wl.add(tl); wr.add(tr);
      g.add(body, neck, head, bill, legs, wl, wr); g.scale.setScalar(S2); birds.add(g); return { g, wl, wr, tl, tr }; };
    const cx = WP.reduce((a, p) => a + p[0], 0) / WP.length, cz = WP.reduce((a, p) => a + p[1], 0) / WP.length;
    const span = Math.max(...WP.map(p => Math.hypot(p[0] - cx, p[1] - cz)));
    [[0.55, 13, 0.0, 1], [0.8, 18, 2.1, 1], [0.4, 10, 4.0, -1]].forEach(([rf, y, ph, dir]) => { const e = egret(); BIRDS.push({ kind: 'egret', ...e, r: span * rf, y: WY + y, ph, dir, cx, cz, flap: 0 }); });
    // the heron: on the shore point nearest the park, a step into the water, facing out over it
    let hp = WP[0]; for (const p of WP) if (p[0] < hp[0]) hp = p; const toC = new THREE.Vector2(cx - hp[0], cz - hp[1]).normalize(); const hx = hp[0] + toC.x * 2.2, hz = hp[1] + toC.y * 2.2;
    { const g = new THREE.Group(), body = mk(new THREE.SphereGeometry(0.2, 10, 8).scale(0.8, 0.85, 1.9), HGRY, 0, 0.95, 0), neckG = new THREE.Group(); neckG.position.set(0, 1.05, 0.28);
      const n1 = mk(new THREE.CylinderGeometry(0.045, 0.06, 0.42, 6), HWHT, 0, 0.2, 0.04, 0.25), head = mk(new THREE.SphereGeometry(0.075, 8, 6), HWHT, 0, 0.42, 0.1), cap = mk(new THREE.SphereGeometry(0.05, 6, 4).scale(1, 0.5, 1.4), HDARK, 0, 0.47, 0.07);
      const bill = mk(new THREE.ConeGeometry(0.022, 0.22, 6), YEL, 0, 0.42, 0.26, Math.PI / 2); neckG.add(n1, head, cap, bill);
      const legs = [-0.06, 0.06].map(a => mk(new THREE.CylinderGeometry(0.014, 0.014, 0.85, 4), HDARK, a, 0.42, 0)); g.add(body, neckG, ...legs); g.scale.setScalar(S2);
      g.position.set(hx, WY - 0.18 * S2, hz); g.rotation.y = Math.atan2(toC.x, toC.y); birds.add(g); BIRDS.push({ kind: 'heron', g, neckG, t0: 0 }); }
    // ducks: a little group paddling slow loops in open water, clear of the shore
    let dc = [cx, cz]; for (let k = 0; k < 40; k++) { const a = k * 2.4, r = span * 0.15 * (k % 5), p = [cx + Math.cos(a) * r, cz + Math.sin(a) * r]; if (inPoly(WP, p[0], p[1]) && segD(WP, p[0], p[1]) > 14) { dc = p; break; } }
    const rD = Math.max(4, Math.min(9, segD(WP, dc[0], dc[1]) - 4));
    for (let i = 0; i < 4; i++) { const g = new THREE.Group(), male = i % 2 === 0;
      g.add(mk(new THREE.SphereGeometry(0.16, 10, 8).scale(0.85, 0.6, 1.4), male ? std('#8c8c86') : DBR, 0, 0.06, 0), mk(new THREE.SphereGeometry(0.085, 8, 6), male ? DGR : DBR, 0, 0.2, 0.17),
        mk(new THREE.BoxGeometry(0.06, 0.02, 0.08), YEL, 0, 0.19, 0.27), mk(new THREE.BoxGeometry(0.16, 0.05, 0.1), male ? DWH : DBR, 0, 0.12, -0.2));
      g.scale.setScalar(S2); birds.add(g); BIRDS.push({ kind: 'duck', g, i, c: dc, r: rD * (0.7 + 0.12 * i), ph: i * 0.55 }); }
  } catch (err) { console.warn('birds', err); }
  let bt = 0;
  function tickBirds(dt) { bt += reduced ? 0 : dt;
    for (const b of BIRDS) {
      if (b.kind === 'egret') { const a = b.ph + b.dir * bt * 0.09 * TS * (14 / Math.max(10, b.r)), x = b.cx + Math.cos(a) * b.r, z = b.cz + Math.sin(a) * b.r * 0.8;
        const glide = Math.sin(bt * 0.35 + b.ph) > 0.25, f = glide ? Math.sin(bt * 1.5 + b.ph) * 0.06 + 0.12 : Math.sin(bt * 9 + b.ph) * 0.65;
        b.g.position.set(x, b.y + Math.sin(bt * 0.6 + b.ph) * 1.2, z); b.g.rotation.set(0, Math.atan2(-Math.sin(a) * b.dir, Math.cos(a) * b.dir * 0.8), -b.dir * 0.22);
        b.wl.rotation.z = f; b.wr.rotation.z = -f; b.tl.rotation.z = f * 0.5; b.tr.rotation.z = -f * 0.5; }
      else if (b.kind === 'heron') { const c = (bt % 14) / 14; const strike = c > 0.8 && c < 0.86 ? Math.sin((c - 0.8) / 0.06 * Math.PI) : 0, look = Math.sin(bt * 0.4) * 0.35;
        b.neckG.rotation.set(0.9 * strike, look, 0); b.neckG.position.z = 0.28 + 0.1 * strike; }
      else if (b.kind === 'duck') { const a = b.ph + bt * 0.12 * TS * (6 / b.r), x = b.c[0] + Math.cos(a) * b.r + b.i * 0.8, z = b.c[1] + Math.sin(a) * b.r * 0.7;
        b.g.position.set(x, WY - 0.02 + Math.sin(bt * 2 + b.i) * 0.02, z); b.g.rotation.set(Math.sin(bt * 2.3 + b.i) * 0.06, Math.atan2(-Math.sin(a), Math.cos(a) * 0.7), 0); } } }

  // ---------- 4. Room to grow, as the film: cabins and the RV and boat storage yard (the lanes and pads are life1's build) ----------
  const GC = L.growCabins || [], GY = L.growYard; const grow = new THREE.Group(); grow.name = 'growExtras'; grow.visible = false; model.add(grow);
  const LIGHT = new THREE.Color((SC.life || {}).light || '#c8dcff');
  const ghostM = () => new THREE.MeshBasicMaterial({ color: LIGHT.clone().multiplyScalar(1.6), toneMapped: false, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const CAB = [], YARD = []; let cabWin = null, yardLamps = [];
  try {
    const wallM = std('#b4875a', { roughness: 0.9 }), trimM = std('#e9e4da'), roofM = std('#3b4148', { roughness: 0.75 }), deckM = std('#8a6e50', { roughness: 0.95 });
    cabWin = std('#1b1a18', { emissive: new THREE.Color('#ffb45a'), emissiveIntensity: 0, roughness: 0.4 });
    const floorG = new THREE.BoxGeometry(8.6, 0.45, 6.6).translate(0, 0.62, 0), wallG = new THREE.BoxGeometry(5.6, 2.9, 6.0).translate(-1.3, 1.45, 0);
    const rs = new THREE.Shape([new THREE.Vector2(-3.9, 0), new THREE.Vector2(3.9, 0), new THREE.Vector2(0, 2.3)]), roofG = new THREE.ExtrudeGeometry(rs, { depth: 8.4, bevelEnabled: false }); roofG.translate(0, 0, -4.2); roofG.rotateY(Math.PI / 2); roofG.translate(-0.15, 0, 0);
    const winG = new THREE.PlaneGeometry(1.4, 1.1), doorG = new THREE.PlaneGeometry(0.95, 2.0), postG = new THREE.BoxGeometry(0.18, 2.9, 0.18), railG = new THREE.BoxGeometry(0.1, 0.9, 6.4);
    const ghostG = new THREE.BoxGeometry(9.2, 6.5, 7.4).translate(0, 3.2, 0);
    GC.forEach(([x, z, ry], i) => { const g = new THREE.Group(); g.position.set(x, LAND, z); g.rotation.y = ry; grow.add(g);
      const floor = new THREE.Mesh(floorG, deckM), wallsG = new THREE.Group(); wallsG.position.y = 0.85; const walls = new THREE.Mesh(wallG, wallM); wallsG.add(walls);
      for (const zz of [-1.7, 1.7]) { const w = new THREE.Mesh(winG, cabWin); w.position.set(1.52, 1.55, zz); w.rotation.y = Math.PI / 2; wallsG.add(w); }
      const dr = new THREE.Mesh(doorG, cabWin); dr.position.set(1.52, 1.0, 0); dr.rotation.y = Math.PI / 2; wallsG.add(dr);
      for (const zz of [-3.02, 3.02]) { const w = new THREE.Mesh(winG, cabWin); w.position.set(-1.3, 1.55, zz); w.rotation.y = zz < 0 ? Math.PI : 0; wallsG.add(w); }
      const rail = new THREE.Mesh(railG, trimM); rail.position.set(4.15, 1.3, 0); wallsG.add(rail);
      const roof = new THREE.Group(); const rm = new THREE.Mesh(roofG, roofM); rm.position.y = 3.7; roof.add(rm);
      for (const zz of [-3.1, 3.1]) { const p = new THREE.Mesh(postG, trimM); p.position.set(4.0, 2.3, zz); roof.add(p); }
      [floor, walls, rm].forEach(o => { o.castShadow = o.receiveShadow = true; });
      const gh = new THREE.Mesh(ghostG, ghostM()); gh.renderOrder = 4; g.add(floor, wallsG, roof, gh); CAB.push({ g, floor, wallsG, roof, gh, i }); });
    if (GY) { const [px, pz, pw, pd] = GY.pad; const gm = std('#b9ab90', { roughness: 1, transparent: true, opacity: 0 }); const yp = new THREE.Mesh(new THREE.PlaneGeometry(pw, pd).rotateX(-Math.PI / 2), gm);
      yp.position.set(px, LAND + 0.08, pz); yp.rotation.y = GY.roofRy; yp.receiveShadow = true; grow.add(yp); YARD.push({ kind: 'gravel', m: gm, t0: 7.6 });
      const postGeo = new THREE.CylinderGeometry(0.14, 0.14, 4.6, 6).translate(0, 2.3, 0), postM = std('#9aa0a6', { roughness: 0.7, metalness: 0.3 });
      const roofGeo = new THREE.BoxGeometry(12.5, 0.25, GY.bayL + 0.05), roofMat = std('#a3aab1', { roughness: 0.5, metalness: 0.35 });
      GY.posts.forEach(([x, z, ri, k]) => { const p = new THREE.Mesh(postGeo, postM); p.position.set(x, LAND, z); p.castShadow = true; grow.add(p); YARD.push({ kind: 'post', m: p, t0: 7.9 + ri * 0.28 + k * 0.05 }); });
      GY.roofs.forEach(([x, z, ri, k]) => { const r = new THREE.Mesh(roofGeo, roofMat); r.position.set(x, LAND + 4.75, z); r.rotation.y = GY.roofRy; r.castShadow = true; grow.add(r); YARD.push({ kind: 'roof', m: r, t0: 8.45 + ri * 0.28 + k * 0.07 }); });
      const rigM = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d'); x.fillStyle = '#efece6'; x.fillRect(0, 0, 256, 64); x.fillStyle = '#1b222a'; x.fillRect(14, 16, 228, 14); x.fillStyle = '#0a4aa8'; x.fillRect(0, 40, 256, 7);
        const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
      const plain = std('#e9e6e0', { roughness: 0.9 }), side = std('#ffffff', { map: rigM, roughness: 0.85 }), rigG = new THREE.BoxGeometry(10.5, 3.2, 2.5).translate(0, 1.95, 0);
      GY.rigs.forEach(([x, z, dx, dz, ri, k]) => { const o = new THREE.Mesh(rigG, [plain, plain, plain, plain, side, side]); o.position.set(x, LAND, z); o.rotation.y = -Math.atan2(dz, dx); o.castShadow = true; grow.add(o); YARD.push({ kind: 'pop', m: o, t0: 9.6 + ri * 0.25 + k * 0.06 }); });
      const hs = new THREE.Shape([new THREE.Vector2(-4, 0.6), new THREE.Vector2(3.2, 0.6), new THREE.Vector2(4.4, 1.5), new THREE.Vector2(4.6, 2.0), new THREE.Vector2(-4, 2.0)]);
      const hull = new THREE.ExtrudeGeometry(hs, { depth: 2.5, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 2 }); hull.translate(0, 0, -1.25);
      const cabG = new THREE.BoxGeometry(2.6, 1.0, 1.9).translate(-0.6, 2.5, 0), trlG = new THREE.BoxGeometry(8.0, 0.25, 1.9).translate(-0.2, 0.45, 0), boatM = std('#f1f0ec', { roughness: 0.55 }), trlM = std('#3a3f45');
      GY.boats.forEach(([x, z, dx, dz, ri, k]) => { const g = new THREE.Group(); g.add(new THREE.Mesh(hull, boatM), new THREE.Mesh(cabG, boatM), new THREE.Mesh(trlG, trlM)); g.position.set(x, LAND, z); g.rotation.y = -Math.atan2(dz, dx); grow.add(g); YARD.push({ kind: 'pop', m: g, t0: 9.6 + ri * 0.25 + k * 0.06 }); });
      const lampSprite = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,240,210,1)'); gr.addColorStop(1, 'rgba(255,240,210,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
      GY.roofs.forEach(([x, z]) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: lampSprite, color: 0xdfe9ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); s.position.set(x, LAND + 4.1, z); s.scale.setScalar(4); grow.add(s); yardLamps.push(s); }); }
  } catch (err) { console.warn('grow extras', err); }
  // idea labels for the cabins and the yard (the new sites carry the listing's own grow tag)
  const tagBox = document.getElementById('tags'), mkTag = (t) => { const el = document.createElement('div'); el.className = 'tag c'; el.textContent = t; el.style.display = 'none'; tagBox && tagBox.appendChild(el); return el; };
  const TAGS2 = [];
  if (CAB.length) { const c = CAB[0].g.position; TAGS2.push({ el: mkTag('Idea: 9 timber cabins'), at: new THREE.Vector3(c.x, 12, c.z), t0: 7.2 }); }
  if (GY) TAGS2.push({ el: mkTag('Idea: RV and boat storage'), at: new THREE.Vector3(GY.pad[0], 12, GY.pad[1]), t0: 10.2 });
  const tv = new THREE.Vector3();
  function placeTag(T, on) { const el = T.el; if (!on) { el.style.display = 'none'; return; } tv.copy(T.at); model.localToWorld(tv); tv.project(camera); if (tv.z > 1) { el.style.display = 'none'; return; }
    el.style.display = 'block'; const hw = el.offsetWidth / 2 + 8, x = Math.min(innerWidth - hw, Math.max(hw, (tv.x * 0.5 + 0.5) * innerWidth)); el.style.transform = `translate(${x}px, ${(-tv.y * 0.5 + 0.5) * innerHeight - 8}px) translate(-50%, -100%)`; }
  let tg = -1;
  const back = (x) => { x = cl(x); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  function tickGrow(dt, on) {
    if (!on) { if (grow.visible) { grow.visible = false; TAGS2.forEach(T => placeTag(T, false)); } tg = -1; return; }
    if (tg < 0) tg = 0; tg += dt; const t = reduced ? 99 : tg; grow.visible = true;
    CAB.forEach(c => { const a = t - (6.2 + c.i * 0.22), ef = cl((a - 0.1) / 0.3), ew = cl((a - 0.3) / 0.45), er = cl((a - 0.75) / 0.35);
      c.floor.visible = ef > 0; c.floor.scale.y = Math.max(0.01, ef); c.wallsG.visible = ew > 0; c.wallsG.scale.y = Math.max(0.01, 1 - Math.pow(1 - ew, 3));
      c.roof.visible = er > 0; c.roof.position.y = Math.pow(1 - er, 2) * 7; c.gh.material.opacity = a > 0 ? 0.32 * Math.exp(-Math.max(0, a - 0.2) * 2.2) * cl(a / 0.2) : 0; c.gh.visible = c.gh.material.opacity > 0.003; });
    for (const y of YARD) { const a = t - y.t0;
      if (y.kind === 'gravel') y.m.opacity = 0.85 * sm(a / 0.8);
      else if (y.kind === 'post') { y.m.visible = a > 0; y.m.scale.y = Math.max(0.01, 1 - Math.pow(1 - cl(a / 0.3), 3)); }
      else if (y.kind === 'roof') { const e = cl(a / 0.3); y.m.visible = a > 0; y.m.scale.set(Math.max(0.01, e), 1, Math.max(0.01, 0.3 + 0.7 * e)); y.m.position.y = LAND + 4.75 + (1 - e) * 2.2; }
      else if (y.kind === 'pop') { y.m.visible = a > 0; y.m.scale.setScalar(Math.max(0.001, back(a / 0.35))); } }
    const dk = dusk(); yardLamps.forEach((s, i) => { s.material.opacity = (0.25 + 0.6 * dk) * sm((t - 11 - i * 0.02) / 0.4); });
    TAGS2.forEach(T => placeTag(T, t > T.t0)); }

  // ---------- 5. the armadillo and the camper with the camera ----------
  let tickA = () => {}, cue = () => {};
  if (A && A.path && A.path.length > 4 && part.proto_armadillo && part.proto_camper) try {
    const root = new THREE.Group(); root.name = 'armadillo'; model.add(root);
    const copy = (name) => { const g = new THREE.Group(); part[name].traverse(o => { if (!o.isMesh) return; const m = new THREE.Mesh(o.geometry, o.material); m.position.y = -PY; m.castShadow = true; m.frustumCulled = false; g.add(m); });
      g.rotation.order = 'YXZ'; root.add(g); return g; };
    const arm = copy('proto_armadillo'), cam = copy('proto_camper');
    const fm = new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 1, 1).multiplyScalar(6), toneMapped: false, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    const hm = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.9, 0.95, 1).multiplyScalar(2), toneMapped: false, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    const fl = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), fm), halo = new THREE.Mesh(new THREE.SphereGeometry(1.1, 14, 10), hm); fl.renderOrder = halo.renderOrder = 5; root.add(fl, halo);
    const P = A.path.map(p => new THREE.Vector3(p[0], 0, p[1])); P.push(P[0].clone());
    const cum = [0]; for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + P[i].distanceTo(P[i - 1])); const LEN = cum[cum.length - 1];
    const o = new THREE.Vector3();
    const at = (d) => { d = ((d % LEN) + LEN) % LEN; let lo = 1, hi = cum.length - 1; while (lo < hi) { const mid = (lo + hi) >> 1; if (cum[mid] < d) lo = mid + 1; else hi = mid; }
      const a = P[lo - 1], b = P[lo], f = (d - cum[lo - 1]) / ((cum[lo] - cum[lo - 1]) || 1); o.lerpVectors(a, b, f); return Math.atan2(b.x - a.x, b.z - a.z); };
    const Y = A.y ?? 0.18, STOP = A.stopD, vW = 0.42 * TS, vD = 2.6 * TS, vRun = 1.9 * TS, GAP = 3.6, NEAR = 2.0;
    let dA = STOP - 10, dC = dA - GAP, mode = 'walk', tm = 0, hA = null, hC = null, clock = 0, vA = vW, crouch = 0, lean = 0;
    const local = (d) => ((d % LEN) + LEN) % LEN;
    // "The locals" card: start the gag about two seconds before the stop, so the flash goes off while the card is up
    cue = () => { if (reduced) return; dA = STOP - vW * 2.2; dC = dA - GAP; mode = 'walk'; tm = 0; };
    tickA = (dt) => {
      clock += dt;
      if (reduced) { dA = STOP; dC = STOP - NEAR; mode = 'still'; crouch = 1; }
      else {
        tm += dt;
        if (mode === 'walk') { vA = vW; const before = local(dA); dA += vA * dt; const after = local(dA); if (before < STOP && (after >= STOP || after < before)) { dA += STOP - after; mode = 'sniff'; tm = 0; } }
        else if (mode === 'sniff') { vA = 0; if (tm > 3.0) { mode = 'hop'; tm = 0; } }
        else if (mode === 'hop') { vA = 0; if (tm > 0.6) { mode = 'dash'; tm = 0; } }
        else if (mode === 'dash') { vA = vW + (vD - vW) * Math.exp(-tm / 5); dA += vA * dt; if (local(dA - STOP) > LEN - 11 && tm > 3) { mode = 'walk'; tm = 0; } }
        const want = mode === 'sniff' || mode === 'hop' ? NEAR : GAP, gap = dA - dC;
        const vC = cl(vA + 1.1 * (gap - want), 0, mode === 'sniff' ? 0.5 * TS : vRun); dC += vC * dt; if (dA - dC < 1.2) dC = dA - 1.2;
        crouch += ((mode === 'sniff' && tm > 1.3) || (mode === 'hop' && tm < 0.25) ? 1 - crouch : -crouch) * Math.min(1, 5 * dt);
        lean += ((vC > 1.2 * TS ? 0.22 : 0) - lean) * Math.min(1, 4 * dt);
        cam.userData.v = vC;
      }
      let h = at(dA); const ax = o.x, az = o.z; hA = hA == null || reduced ? h : angTo(hA, h, Math.min(1, 6 * dt));
      let y = Y, rx = 0, rz = 0;
      if (mode === 'walk' || mode === 'dash') { const f = mode === 'dash' ? 26 : 12; y += Math.abs(Math.sin(clock * f)) * 0.025; rz = Math.sin(clock * f) * 0.06; }
      if (mode === 'sniff' || mode === 'still') rx = 0.12 + 0.07 * Math.sin(clock * 11);
      if (mode === 'hop') { const u = cl(tm / 0.55); y += Math.sin(Math.PI * u) * 1.0; rx = -0.35 * Math.sin(Math.PI * u); rz = 0.25 * Math.sin(Math.PI * u * 2); }
      arm.position.set(ax, y, az); arm.rotation.set(rx, hA, rz);
      h = at(dC); const cx = o.x, cz = o.z; const toA = Math.atan2(ax - cx, az - cz);
      hC = hC == null || reduced ? toA : angTo(hC, mode === 'sniff' || mode === 'hop' || mode === 'still' ? toA : h, Math.min(1, 5 * dt));
      const vc = cam.userData.v || 0, stepF = 6 + vc * 3, bob = vc > 0.05 ? Math.abs(Math.sin(clock * stepF)) * (0.04 + 0.03 * vc) : 0;
      const jolt = mode === 'hop' ? Math.sin(Math.PI * cl(tm / 0.4)) * -0.25 : 0;
      cam.position.set(cx, Y - 0.04 + bob - 0.22 * crouch, cz); cam.rotation.set(0.38 * crouch + lean + jolt, hC, vc > 0.05 ? Math.sin(clock * stepF) * 0.05 : 0);
      const fk = mode === 'sniff' ? Math.max(Math.exp(-Math.pow((tm - 2.55) / 0.05, 2)), 0.6 * Math.exp(-Math.pow((tm - 2.8) / 0.04, 2))) : 0;
      if (fk > 0.002) { const s = Math.sin(hC), c = Math.cos(hC), fy = 1.41 - 0.22 * crouch - 0.05; fl.position.set(cx + s * 0.58, Y + fy, cz + c * 0.58); halo.position.copy(fl.position); }
      fm.opacity = fk; hm.opacity = 0.55 * fk; fl.visible = halo.visible = fk > 0.002;
    };
    tickA(0);
    window.__armadillo = { get mode() { return mode; }, get d() { return local(dA); }, LEN, STOP, cue };
  } catch (err) { console.warn('armadillo', err); }

  // ---------- each frame ----------
  let lastSel = null, wt = 0; const sv = new THREE.Vector3();
  function tick(dt, state = {}) {
    base.tick(dt, state);
    const id = state.sel && state.sel.id; if (id !== lastSel) { lastSel = id; if (id === 'locals') cue(); }
    tickA(dt); tickBirds(dt); tickGrow(dt, !!state.growOn);
    if (wC) { wt += reduced ? 0 : dt; wU.uT.value = wt; duskK = dusk(); wU.uDusk.value = duskK;
      sv.copy(sun.position); if (sun.target) sv.sub(sun.target.position); wU.uSun.value.copy(sv.normalize()); wU.uSunC.value.copy(sun.color).multiplyScalar(0.6 + 0.4 * Math.min(1.5, sun.intensity / 2)); }
    if (cabWin) cabWin.emissiveIntensity = 1.6 * dusk();
    ribU.uT.value += reduced ? 0 : dt; ribU.uK.value = 0.75 + 0.6 * dusk();
  }
  return { fx: base.fx, tick, dusk: base.dusk };
}
