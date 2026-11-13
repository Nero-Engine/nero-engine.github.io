// Live AR for the Lens desk viewer (arlive1, 11-11-2026). Android phones only, and only for a listing with "scene": {"arLive": true}.
// "View on your desk" starts a camera session inside this same page (WebXR), so the model on the real table is the live viewer:
// boats, people and the heron keep moving, the fact chips and cards still work, Room to grow still builds.
//   1. the phone looks for the table: a ring shows where the model will sit;
//   2. a tap puts the model there, about 60 cm across, its best side facing the person;
//   3. one finger turns it, two fingers resize and turn it; Move picks a new spot; Exit goes back to the 3D view.
// How it stays simple: the model never moves in the 3D scene. The camera session's own origin is moved to the tapped spot instead,
// so lights, shadows, glows and the life layer need no changes. Turning and resizing are applied to the model's outer group and undone on exit.
// The engine draws straight to the camera session here (no bloom pass). iPhones never load this file: they open Apple Quick Look as before.
// If the phone cannot do this, or the session fails, init() or start() says so and the engine falls back to the old route (Scene Viewer).
// This file is kept by browsers for a year: after any change, save it under a new name (arlive2.js) or raise the ?v= number in engine/lens.html.
export async function init(X) {
  const { THREE, renderer, scene, camera, root, model, sun, SC, T, frame, resize, look, quiet } = X;
  if (!navigator.xr || !navigator.xr.isSessionSupported || !window.XRRigidTransform) return null;
  if (!(await navigator.xr.isSessionSupported('immersive-ar'))) return null;

  // ---------- the few extra things on screen during the session ----------
  const css = document.createElement('style');
  css.textContent = `
    #xrpad, #xrbar, #xrhint { display:none; }
    html.xrlive, html.xrlive body { background:transparent !important; }
    html.xrlive canvas#c { visibility:hidden !important; }
    html.xrlive #hint, html.xrlive #tourbtn, html.xrlive #tourbar, html.xrlive #sunbtn, html.xrlive #wfbtn, html.xrlive #wfpanel, html.xrlive #acts, html.xrlive #reset,
    html.xrlive #qrbox, html.xrlive #ar, html.xrlive #arcard, html.xrlive #ask, html.xrlive model-viewer { display:none !important; }
    html.xrlive #top { background:linear-gradient(rgba(var(--bgc),.6), rgba(var(--bgc),0)); }
    html.xrlive #bottom { background:linear-gradient(rgba(var(--bgc),0), rgba(var(--bgc),.8) 34%); }
    html.xrlive #xrpad { display:block; position:fixed; inset:0; touch-action:none; }
    html.xrlive #xrbar { display:flex; gap:8px; position:fixed; right:14px; top:calc(env(safe-area-inset-top) + 64px); z-index:4; }
    #xrbar button { border:1px solid rgba(var(--lc),.25); background:rgba(var(--bgc),.75); color:var(--ink); font:700 13px var(--font), sans-serif; padding:9px 14px; border-radius:20px; min-height:38px; }
    #xrbar #xrexit { background:var(--hero); border-color:var(--hero); color:var(--onhero); }
    html.xrlive #xrhint { display:block; position:fixed; left:50%; top:calc(env(safe-area-inset-top) + 118px); transform:translateX(-50%); max-width:82vw; text-align:center; pointer-events:none;
      font:600 13px/1.4 var(--font), sans-serif; color:#fff; background:rgba(var(--bgc),.7); padding:7px 13px; border-radius:18px; transition:opacity .6s; }`;
  document.head.appendChild(css);
  const el = (tag, id, text) => { const e = document.createElement(tag); e.id = id; if (text) e.textContent = text; return e; };
  const pad = el('div', 'xrpad'), bar = el('div', 'xrbar'), hint = el('div', 'xrhint'), moveB = el('button', 'xrmove', 'Move'), exitB = el('button', 'xrexit', 'Exit');
  pad.setAttribute('aria-hidden', 'true'); moveB.type = exitB.type = 'button'; bar.append(moveB, exitB); hint.setAttribute('role', 'status');
  const cv = document.getElementById('c'); cv.after(pad); document.body.append(bar, hint);   // the pad sits straight after the canvas, so every button stays above it

  // the ring that shows where the model will sit (drawn in the camera session's own space, before the model is placed)
  const ringG = new THREE.RingGeometry(0.27, 0.3, 64).rotateX(-Math.PI / 2), dotG = new THREE.CircleGeometry(0.012, 20).rotateX(-Math.PI / 2);
  const ringM = new THREE.MeshBasicMaterial({ color: new THREE.Color(SC.glowHex || '#ffffff'), toneMapped: false, transparent: true, opacity: 0.9, depthTest: false });
  const ring = new THREE.Group(); ring.add(new THREE.Mesh(ringG, ringM), new THREE.Mesh(dotG, ringM)); ring.matrixAutoUpdate = false; ring.visible = false; ring.renderOrder = 9;

  const floorY = (() => { const b = new THREE.Box3().setFromObject(model.getObjectByName('plinth') || model); return isFinite(b.min.y) ? b.min.y : 0; })();   // the underside of the base
  const AZ = (SC.home && SC.home.az) ?? SC.az ?? 0.5, KMIN = 0.3, KMAX = 3;
  let session = null, live = false, dead = false, baseSpace = null, hitSrc = null, lastHit = null, placed = false, everPlaced = false, overlay = false, saved = null, k = 1, rot = 0, hintT = 0;
  const say = (t, fade) => { hint.textContent = t; hint.style.opacity = 1; clearTimeout(hintT); if (fade) hintT = setTimeout(() => { hint.style.opacity = 0; }, fade); };

  function apply() {   // size and turn, about the middle of the base; the base's underside stays on the table
    root.scale.setScalar(k); root.rotation.y = rot; root.position.set(0, -floorY * k, 0); root.updateMatrixWorld(true);
    const c = sun.shadow.camera, s = Math.max(1, k); c.left = saved.sh[0] * s; c.right = saved.sh[1] * s; c.top = saved.sh[2] * s; c.bottom = saved.sh[3] * s; c.updateProjectionMatrix(); }
  function unplace() { placed = false; root.visible = false; lastHit = null; renderer.xr.setReferenceSpace(baseSpace); say('Point your phone at the table, then tap to put the model there'); }
  function place() {
    if (!lastHit) return; const p = lastHit.position, v = camera.getWorldPosition(new THREE.Vector3());
    const yaw = Math.atan2(v.x - p.x, v.z - p.z) - AZ;   // the model's usual front faces the person
    renderer.xr.setReferenceSpace(baseSpace.getOffsetReferenceSpace(new XRRigidTransform({ x: p.x, y: p.y, z: p.z, w: 1 }, { x: 0, y: Math.sin(yaw / 2), z: 0, w: Math.cos(yaw / 2) })));
    placed = true; ring.visible = false; root.visible = true; rot = 0; apply();
    say(overlay ? 'Drag to turn it · two fingers to resize · walk round it' : 'Walk round it. Tap again to move it.', 7000);
    if (!everPlaced) { everPlaced = true; T('tap', 'ar live placed'); } }
  const onSelect = () => { if (!live) return; if (!placed) place(); else if (!overlay) unplace(); };

  // one finger turns the model; two fingers resize and turn it
  const pts = new Map(); let two = null;
  const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  pad.addEventListener('pointerdown', (e) => { try { pad.setPointerCapture(e.pointerId); } catch (err) {} pts.set(e.pointerId, [e.clientX, e.clientY]); two = null; });
  pad.addEventListener('pointermove', (e) => { const was = pts.get(e.pointerId); if (!was) return; pts.set(e.pointerId, [e.clientX, e.clientY]); if (!placed) return;
    if (pts.size === 1) { rot += (e.clientX - was[0]) * 0.008; apply(); }
    else if (pts.size === 2) { const [a, b] = [...pts.values()], d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
      if (two) { k = Math.min(KMAX, Math.max(KMIN, k * d / two.d)); rot -= wrap(ang - two.ang); apply(); } two = { d, ang }; } });
  const up = (e) => { pts.delete(e.pointerId); two = null; }; pad.addEventListener('pointerup', up); pad.addEventListener('pointercancel', up);
  // a tap on a button, chip or card must not count as a tap on the table
  document.body.addEventListener('beforexrselect', (e) => { if (e.target !== pad) e.preventDefault(); });
  moveB.onclick = () => { if (live && placed) unplace(); };
  exitB.onclick = () => { if (session) session.end().catch(() => {}); };

  function cleanup() {
    if (!saved) return; const s = saved; saved = null; live = false; session = null; hitSrc = null; lastHit = null; placed = false;
    try { renderer.setAnimationLoop(null); } catch (e) {}
    renderer.xr.enabled = false; scene.remove(ring); scene.background = s.bg;
    root.visible = true; root.scale.setScalar(1); root.rotation.y = 0; root.position.set(0, 0, 0); root.updateMatrixWorld(true);
    const c = sun.shadow.camera; c.left = s.sh[0]; c.right = s.sh[1]; c.top = s.sh[2]; c.bottom = s.sh[3]; c.updateProjectionMatrix();
    camera.position.copy(s.cp); camera.quaternion.copy(s.cq); camera.scale.set(1, 1, 1); camera.updateMatrixWorld(true);
    document.documentElement.classList.remove('xrlive'); clearTimeout(hintT); pts.clear();
    try { resize(); look(); } catch (e) { console.warn('live AR exit', e); } }

  async function begin(s) {
    session = s; s.addEventListener('end', () => setTimeout(cleanup, 60));   // after three.js has finished its own tidy-up
    const c = sun.shadow.camera; saved = { bg: scene.background, sh: [c.left, c.right, c.top, c.bottom], cp: camera.position.clone(), cq: camera.quaternion.clone() };
    quiet(); live = true; k = 1; rot = 0; placed = false; everPlaced = false;
    renderer.setAnimationLoop((t, f) => { if (f && live) frame(performance.now(), f); });   // set before the session starts, so three.js parks its page loop
    renderer.xr.enabled = true; renderer.xr.setReferenceSpaceType('local');
    await renderer.xr.setSession(s);
    baseSpace = renderer.xr.getReferenceSpace();
    hitSrc = await s.requestHitTestSource({ space: await s.requestReferenceSpace('viewer') });
    overlay = !!(s.domOverlayState && s.domOverlayState.type);
    scene.background = null; root.visible = false; scene.add(ring); document.documentElement.classList.add('xrlive');
    s.addEventListener('select', onSelect);
    say('Point your phone at the table, then tap to put the model there'); T('tap', 'ar live'); }

  return {
    get on() { return live; },
    can: () => !dead && !session,
    // must be called straight from the tap, with nothing awaited before it (the browser only allows a camera session from a real tap)
    start() { let p; try { p = navigator.xr.requestSession('immersive-ar', { requiredFeatures: ['hit-test'], optionalFeatures: ['dom-overlay'], domOverlay: { root: document.body } }); } catch (e) { dead = true; return Promise.resolve(false); }
      return p.then(begin).then(() => true).catch((e) => { dead = true; console.warn('live AR', e); T('tap', 'ar live failed'); const s = session; if (s) { try { s.end().catch(() => {}); } catch (err) {} } else cleanup(); return false; }); },
    // called by the engine once a frame during the session, in place of its bloom pass
    draw(f) { scene.background = null;
      if (!placed && hitSrc) { const h = f.getHitTestResults(hitSrc), pose = h.length ? h[0].getPose(baseSpace) : null;
        if (pose) { lastHit = pose.transform; ring.matrix.fromArray(pose.transform.matrix); ring.visible = true; } else ring.visible = false; }
      renderer.render(scene, camera); },
  };
}
