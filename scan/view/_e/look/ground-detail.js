// LOOK ENGINE: ground detail (12-11-2026). Sharp, lit grass, dirt and gravel over a blurry satellite photo, for films AND Living Models.
// Adam, 12-11-2026: "the roads are high quality and the water is high quality. The landscape, like the grass and dirt, is just flat and blurry...
// like satellite picture quality." Then: "Every time I update something... it is updated to both engines automatically."
// THIS FILE IS THE ONE MASTER. Never edit a copy. After a change Adam approves:  python3 "/Users/pearcey/Nero Lens/Scripts/Look.py" promote ground "<what>"
// which copies it to the film engine (Lens Starter/Film/assets/look/) and the Living Model (Viewer Platform/public/_e/look/) and seals the film engine.
//
// The photo stays in charge of WHERE things are and what colour they are. Up close, each spot gets fine detail and small bumps that catch
// the light, from one tiling picture (Model Kit/textures/ground detail/ground_detail.jpg: red = grass, green = dirt, blue = gravel; CC0 Poly Haven).
// Which of the three a spot gets is read from the photo's own colour there: clearly green = grass, grey and dull = gravel or tarmac, the rest = dirt.
// The detail is always on and fixed to the ground at three sizes; distance blurs the fine one away by itself.
// 12-11-2026 (Adam: "it needs to just be everywhere from the start and doesn't move when I move around... the whole gravel is glistening"):
// no fade ring round the camera, and no bumps worked out per screen pixel (those change with every camera move and made the gravel sparkle).
//
// Each engine keeps only its own strength: a film is colour graded after this, which doubles the contrast, so films run it gentler.
export const TUNE = {
  living: { tile: 12, tile2: 55, tile3: 240, strength: 0.85, relief: 2.4, lo: 0.4, hi: 1.75, rmax: 0.4 },
  film: { tile: 18, tile2: 80, tile3: 320, strength: 0.5, relief: 1.2, lo: 0.6, hi: 1.32, rmax: 0.22 },
};
const f = (v) => Number(v).toFixed(4);
// The shared maths, as one GLSL function. c = the photo colour, m = ground position in metres.
export function groundGLSL(o = TUNE.living) {
  return `vec3 nlGroundCore(vec3 c, vec2 m, sampler2D det, vec3 T, float K, float R) {
  float mx = max(c.r, max(c.g, c.b)), mn = min(c.r, min(c.g, c.b)), sat = (mx - mn) / max(mx, 0.001);
  float wG = smoothstep(0.0, 0.05, c.g - max(c.r, c.b) * 0.98);
  float wV = (1.0 - wG) * (1.0 - smoothstep(0.10, 0.24, sat));
  vec3 w = vec3(wG, max(0.0, 1.0 - wG - wV), wV);
  vec2 u1 = m / T.x, u2 = m.yx / T.y + 0.37; float e = 2.5 / 512.0;
  float h1 = dot(w, texture2D(det, u1).rgb), h2 = dot(w, texture2D(det, u2).rgb), h3 = dot(w, texture2D(det, m / T.z + 0.71).rgb);
  float s1 = (h1 - dot(w, texture2D(det, u1 + vec2(e, 0.0)).rgb)) * 0.8 + (h1 - dot(w, texture2D(det, u1 + vec2(0.0, e)).rgb)) * 0.6;
  float s2 = (h2 - dot(w, texture2D(det, u2 + vec2(e, 0.0)).rgb)) * 0.8 + (h2 - dot(w, texture2D(det, u2 + vec2(0.0, e)).rgb)) * 0.6;
  float h = h1 * 0.4 + h2 * 0.35 + h3 * 0.25;
  float relief = clamp((s1 + s2) * R, -${f(o.rmax)}, ${f(o.rmax)});   // the slope of the fine and medium detail, lit from one fixed side, worked out on the ground itself
  return c * clamp(1.0 + K * 2.6 * (h - 0.5) + relief, ${f(o.lo)}, ${f(o.hi)});
}
`;
}
// Living Model: put the detail on any MeshStandardMaterial whose map is the photo, on a mesh whose own x and z are metres (y up).
//   groundDetail(THREE, groundMaterial, tex, { tile: 9, tile2: 47, tile3: 230, strength: 0.85 })   (tile sizes in metres)
export function groundDetail(THREE, material, tex, o = {}) {
  const t = { ...TUNE.living, ...o };
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.colorSpace = THREE.NoColorSpace; tex.anisotropy = 16; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.needsUpdate = true;
  const U = { nlDet: { value: tex }, nlT: { value: new THREE.Vector3(t.tile, t.tile2, t.tile3) }, nlK: { value: t.strength }, nlRelief: { value: t.relief } };
  material.userData.groundDetail = U;
  material.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 nlPos;").replace("#include <begin_vertex>", "#include <begin_vertex>\nnlPos = transformed;");
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", `#include <common>
varying vec3 nlPos; uniform sampler2D nlDet; uniform vec3 nlT; uniform float nlK; uniform float nlRelief;
${groundGLSL(t)}`)
      .replace("#include <map_fragment>", `#include <map_fragment>
diffuseColor.rgb = nlGroundCore(diffuseColor.rgb, nlPos.xz, nlDet, nlT, nlK, nlRelief);`); };
  material.customProgramCacheKey = () => "nl-ground-detail-6"; material.needsUpdate = true; return U;
}
