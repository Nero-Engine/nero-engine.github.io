// Ground detail in the desk viewer (12-11-2026): sharp, lit grass, dirt and gravel over the blurry satellite ground, fading in as you zoom.
// Switched on per listing with  "scene": { "ground": { "detail": true } }  in listing.json (optional: tile, tile2, tile3 in metres, strength).
// Listings without it are untouched. The maths is ../look/ground-detail.js, a copy of the ONE master in the Look Engine (Model Kit/fx/ground-detail.js)
// made by Scripts/Look.py. Never edit the copy: change the master, then  python3 Scripts/Look.py promote ground "<what>".
import { groundDetail } from "../look/ground-detail.js";
// The picture ground_detail_512.jpg is three CC0 Poly Haven ground photos packed as red = grass, green = dirt, blue = gravel.
export async function init({ THREE, part, INFO, SC }) {
  const cfg = (SC.ground && SC.ground.detail) ? (SC.ground.detail === true ? {} : SC.ground.detail) : null; if (!cfg || !part.ground) return null;
  const tex = await new THREE.TextureLoader().loadAsync(new URL("./ground_detail_512.jpg", import.meta.url).href), out = [];
  part.ground.traverse((o) => { if (o.isMesh && o.material && o.material.map) out.push(groundDetail(THREE, o.material, tex, cfg)); });
  return out;
}
