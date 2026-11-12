// Offline helper for ONE viewer listing (made per listing by tools/lens.py; do not edit the copy in dist/).
// What it promises:
//   1. Online, the page always comes from the network, never from the saved copy (so a fix or a new fact shows at once).
//   2. Files whose address carries a fingerprint (?v=...) or a version folder (_e/three181/...) never change, so they
//      are kept on the phone and reused.
//   3. With no signal, a listing that was opened before still opens: page, 3D model, fonts and libraries from the saved copy.
// Tracking notes, share codes and enquiries are never saved or replayed.
const BUILD = '8343ec9081', CACHE = 'nv-7d75861464dd';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
const skip = (u) => /\/_(t|share|enquiry|dash|admin)(\/|$)/.test(u.pathname);
const fixed = (u) => u.searchParams.has('v') || (u.pathname.includes('/_e/') && !u.pathname.includes('/_e/legal/'));
const late = (ms) => new Promise((_, no) => setTimeout(() => no(new Error('slow')), ms));
async function keep(c, key, res) {
  if (!res || res.status !== 200 || res.type === 'opaque' || res.redirected) return;
  await c.put(key, res.clone());
  const u = new URL(key);   // a new model replaces the old one, so the phone does not fill up
  if (u.searchParams.has('v')) for (const k of await c.keys()) { const ku = new URL(k.url); if (ku.pathname === u.pathname && ku.search !== u.search) await c.delete(k); }
}
self.addEventListener('fetch', (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || skip(u) || r.headers.has('range')) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE), page = r.mode === 'navigate';
    if (fixed(u) && !page) { const hit = await c.match(r.url); if (hit) return hit; const res = await fetch(r); e.waitUntil(keep(c, r.url, res)); return res; }
    const key = page ? u.origin + u.pathname : r.url;   // the page is saved without ?r=, so any recipient's link finds it
    try {
      const res = await Promise.race([page ? fetch(r.url, { cache: 'no-store', credentials: 'same-origin' }) : fetch(r), late(self.navigator.onLine === false ? 50 : 9000)]);
      e.waitUntil(keep(c, key, res)); return res;
    } catch (err) { const hit = await c.match(key); if (hit) return hit; throw err; }
  })());
});
// The page tells us what it loaded the first time (before this helper was in charge), so one visit is enough to save it all.
self.addEventListener('message', (e) => {
  const d = e.data || {}; if (!Array.isArray(d.cache)) return;
  e.waitUntil((async () => {
    const c = await caches.open(CACHE); let n = 0;
    for (const url of d.cache.slice(0, 120)) {
      try { const u = new URL(url); if (u.origin !== location.origin || skip(u)) continue;
        const key = url === d.page ? u.origin + u.pathname : url;
        if (key !== url || !(await c.match(key))) await keep(c, key, await fetch(url, key === url ? { cache: 'force-cache' } : { cache: 'no-store' }));
        n++; } catch (err) {}
    }
    if (e.source) e.source.postMessage({ nvSaved: n, build: BUILD });
  })());
});
