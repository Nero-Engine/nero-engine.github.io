// Ground detail in the desk viewer (12-11-2026): sharp, lit grass, dirt and gravel over the blurry satellite ground, fading in as you zoom.
// Switched on per listing with  "scene": { "ground": { "detail": true } }  in listing.json (optional: tile, tile2, tile3 in metres, strength).
// Listings without it are untouched. The groundDetail function below is a copy of Model Kit/fx/ground-detail.js (the master: change it there first).
// The picture ground_detail_512.jpg is three CC0 Poly Haven ground photos packed as red = grass, green = dirt, blue = gravel.
export async function init({ THREE, part, INFO, SC }) {
  const cfg = (SC.ground && SC.ground.detail) ? (SC.ground.detail === true ? {} : SC.ground.detail) : null; if (!cfg || !part.ground) return null;
  const tex = await new THREE.TextureLoader().loadAsync(new URL("./ground_detail_512.jpg", import.meta.url).href), out = [];
  part.ground.traverse((o) => { if (o.isMesh && o.material && o.material.map) out.push(groundDetail(THREE, o.material, tex, cfg)); });
  return out;
}
export function groundDetail(THREE, material, tex, o = {}) {
  // 12-11-2026 (Adam: "it needs to just be everywhere from the start and doesn't move when I move around... the whole gravel is glistening"):
  // the detail is fixed to the ground at three sizes (fine, medium, broad) and is ALWAYS on. No fade ring round the camera. The picture's own
  // smaller copies (mipmaps) blur the fine size away with distance, so zooming out shows the broad size, the way real ground does. No bumps
  // worked out per screen pixel: those change with every camera move and made the gravel sparkle.
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.colorSpace = THREE.NoColorSpace; tex.anisotropy = 16; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.needsUpdate = true;
  const U = { nlDet: { value: tex }, nlT: { value: new THREE.Vector3(o.tile ?? 12, o.tile2 ?? 55, o.tile3 ?? 240) }, nlK: { value: o.strength ?? 0.85 }, nlRelief: { value: o.relief ?? 2.4 } };
  material.userData.groundDetail = U;
  material.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 nlPos;").replace("#include <begin_vertex>", "#include <begin_vertex>\nnlPos = transformed;");
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", `#include <common>
varying vec3 nlPos; uniform sampler2D nlDet; uniform vec3 nlT; uniform float nlK; uniform float nlRelief;`)
      .replace("#include <map_fragment>", `#include <map_fragment>
{ vec3 pc = diffuseColor.rgb; float mx = max(pc.r, max(pc.g, pc.b)), mn = min(pc.r, min(pc.g, pc.b)), sat = (mx - mn) / max(mx, 0.001);
  float wG = smoothstep(0.0, 0.05, pc.g - max(pc.r, pc.b) * 0.98);
  float wV = (1.0 - wG) * (1.0 - smoothstep(0.10, 0.24, sat));
  vec3 w = vec3(wG, max(0.0, 1.0 - wG - wV), wV);
  vec2 u1 = nlPos.xz / nlT.x, u2 = nlPos.zx / nlT.y + 0.37; float e = 2.5 / 512.0;
  float h1 = dot(w, texture2D(nlDet, u1).rgb), h2 = dot(w, texture2D(nlDet, u2).rgb), h3 = dot(w, texture2D(nlDet, nlPos.xz / nlT.z + 0.71).rgb);
  float s1 = (h1 - dot(w, texture2D(nlDet, u1 + vec2(e, 0.0)).rgb)) * 0.8 + (h1 - dot(w, texture2D(nlDet, u1 + vec2(0.0, e)).rgb)) * 0.6;
  float s2 = (h2 - dot(w, texture2D(nlDet, u2 + vec2(e, 0.0)).rgb)) * 0.8 + (h2 - dot(w, texture2D(nlDet, u2 + vec2(0.0, e)).rgb)) * 0.6;
  float h = h1 * 0.4 + h2 * 0.35 + h3 * 0.25;
  // relief: the slope of the fine and medium detail, lit from one fixed side. Worked out on the ground itself, so it does not change when the camera moves.
  float relief = clamp((s1 + s2) * nlRelief, -0.4, 0.4);
  diffuseColor.rgb = pc * clamp(1.0 + nlK * 2.6 * (h - 0.5) + relief, 0.4, 1.75); }`); };
  material.customProgramCacheKey = () => "nl-ground-detail-5"; material.needsUpdate = true; return U;
}
