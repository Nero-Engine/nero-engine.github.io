(()=>{
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const fmt=n=>n.toLocaleString('en-GB');
const track=(ev,p)=>{try{window.fbq&&fbq('track',ev,p||{})}catch(_){}try{window.gtag&&gtag('event',ev.toLowerCase(),p||{})}catch(_){}};

// nav + sticky mobile bar + mobile menu
const nav=$('#nav'),mbar=$('#mbar');
const onS=()=>{const y=scrollY;nav&&nav.classList.toggle('scrolled',y>20);mbar&&mbar.classList.toggle('show',y>innerHeight*.9)};
addEventListener('scroll',onS,{passive:true});onS();
const burger=$('#burger');
if(burger)burger.addEventListener('click',()=>{const o=document.body.classList.toggle('menu-open');burger.setAttribute('aria-expanded',o)});
$$('.mnav a').forEach(a=>a.addEventListener('click',()=>document.body.classList.remove('menu-open')));

// reveals + counters
const count=el=>{const t=+el.dataset.count,d=1400,s=performance.now();if(RM){el.textContent=fmt(t);return}
  const f=now=>{const p=Math.min((now-s)/d,1),e=1-Math.pow(1-p,3);el.textContent=fmt(Math.round(t*e));if(p<1)requestAnimationFrame(f)};requestAnimationFrame(f)};
const io=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;e.target.classList.add('in');e.target.querySelectorAll('[data-count]').forEach(count);io.unobserve(e.target)}),{threshold:.12,rootMargin:'0px 0px -6% 0px'});
$$('.rv').forEach(el=>io.observe(el));

// spotlight on cards
if(matchMedia('(hover:hover)').matches)$$('.card,.spot').forEach(c=>c.addEventListener('pointermove',e=>{const r=c.getBoundingClientRect();c.style.setProperty('--x',(e.clientX-r.left)+'px');c.style.setProperty('--y',(e.clientY-r.top)+'px')}));

// living waveforms
$$('.wave i,.mini-wave i,.quote-bub .bars i').forEach(b=>{b.style.animationDelay=(-Math.random()*1.2).toFixed(2)+'s';b.style.animationDuration=(.7+Math.random()*.8).toFixed(2)+'s'});

// hero phone story
const ph=$('#phone');
if(ph){
  const bubs=$$('#msgs .bub'),notif=$('#notif'),tm=$('#tm'),fc1=$('#fc1'),fc2=$('#fc2');
  let timers=[],tick;
  const at=(ms,fn)=>timers.push(setTimeout(fn,ms));
  const stop=()=>{timers.forEach(clearTimeout);timers=[];clearInterval(tick)};
  const finalState=()=>{ph.dataset.s=2;bubs.forEach(b=>b.classList.add('show'));notif.classList.add('show');fc1&&fc1.classList.add('show');fc2&&fc2.classList.add('show');tm.textContent='00:41'};
  const run=()=>{
    stop();
    ph.dataset.s=0;bubs.forEach(b=>b.classList.remove('show'));notif.classList.remove('show');fc1&&fc1.classList.remove('show');fc2&&fc2.classList.remove('show');tm.textContent='00:00';
    at(900,()=>fc2&&fc2.classList.add('show'));
    at(2600,()=>{ph.dataset.s=1;let s=0;tick=setInterval(()=>{s++;tm.textContent='00:'+String(s).padStart(2,'0')},1000)});
    [3400,5200,6800,8200].forEach((t,i)=>at(t,()=>bubs[i]&&bubs[i].classList.add('show')));
    at(10600,()=>{clearInterval(tick);ph.dataset.s=2;notif.classList.add('show');fc1&&fc1.classList.add('show')});
    at(16500,run);
  };
  if(RM)finalState();else new IntersectionObserver(([e])=>{e.isIntersecting?run():stop()},{threshold:.3}).observe(ph);
}

// calculator
const jv=$('#jv'),mc=$('#mc');
if(jv&&mc){
  const calc=()=>{const v=+jv.value,c=+mc.value,mo=Math.round(v*c*4.33*.3/5)*5;
    $('#jvo').textContent='£'+fmt(v);$('#mco').textContent=c;$('#mo').textContent='£'+fmt(mo);$('#yr').textContent='£'+fmt(mo*12);
    [jv,mc].forEach(r=>r.style.setProperty('--p',((r.value-r.min)/(r.max-r.min)*100)+'%'))};
  jv.addEventListener('input',calc);mc.addEventListener('input',calc);calc();
}

// before / after sliders
$$('.ba').forEach(b=>{const r=b.querySelector('input');const set=()=>b.style.setProperty('--ba',r.value+'%');r.addEventListener('input',set);set()});

// click-to-play YouTube (nothing loads until tapped)
$$('.yt').forEach(y=>y.addEventListener('click',()=>{const f=document.createElement('iframe');f.src='https://www.youtube-nocookie.com/embed/'+y.dataset.id+'?autoplay=1&rel=0';f.allow='autoplay; encrypted-media; picture-in-picture';f.allowFullscreen=true;f.title=y.getAttribute('aria-label')||'Video';y.replaceChildren(f);y.classList.add('playing')},{once:true}));

// forms -> HighLevel
const utm=()=>{const q=new URLSearchParams(location.search);return{utm_source:q.get('utm_source')||'',utm_medium:q.get('utm_medium')||'',utm_campaign:q.get('utm_campaign')||'',utm_content:q.get('utm_content')||''}};
const LOCAL=/^(localhost|127\.0\.0\.1)$/.test(location.hostname);
const API=location.hostname.endsWith('workers.dev')?'/api/lead':'https://neroengine.nerolabs.workers.dev/api/lead';
const send=(hook,body)=>{const to=LOCAL?hook:API,b=LOCAL?body:{...body,_hook:hook};try{return fetch(to,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b),keepalive:true}).catch(()=>{})}catch(_){}};
// hidden trap field: people never see it, spam bots fill it in
$$('form[data-hook]').forEach(f=>{const h=document.createElement('input');h.type='text';h.name='website_url';h.tabIndex=-1;h.autocomplete='off';h.setAttribute('aria-hidden','true');h.style.cssText='position:absolute;left:-9999px;width:1px;height:1px;opacity:0';f.appendChild(h)});
const valid=f=>{let ok=true;f.querySelectorAll('[required]').forEach(i=>{const bad=!i.value.trim();i.classList.toggle('bad',bad);if(bad)ok=false});
  const t=f.querySelector('input[type=tel]');if(t&&t.value&&t.value.replace(/[^\d+]/g,'').length<10){t.classList.add('bad');ok=false}
  const e=f.querySelector('input[type=email]');if(e&&e.value&&!/^\S+@\S+\.\S+$/.test(e.value)){e.classList.add('bad');ok=false}
  return ok};
$$('form[data-hook]').forEach(f=>f.addEventListener('submit',e=>{
  e.preventDefault();if(!valid(f))return;
  const d=Object.fromEntries(new FormData(f));let body;
  if(f.dataset.form==='go'){
    const c=(d.contact||'').trim(),isMail=c.includes('@');
    body={first_name:d.business_name,business_name:d.business_name,trade:'',town:d.town,email:isMail?c:'',phone:isMail?'':c,link:isMail?'':'Mobile: '+c,source:'neroengine.com/go',page:location.href,...utm()};
  }else body={...d,page:location.href,form:f.dataset.form,...utm()};
  if(d.website_url)body.website_url=d.website_url;else delete body.website_url;
  send(f.dataset.hook,body);track('Lead',{content_name:f.dataset.form});
  f.classList.add('done');
}));

// tracking on key clicks
document.addEventListener('click',e=>{const a=e.target.closest('a');if(!a)return;
  if(a.href.includes('buy.stripe.com'))track('InitiateCheckout');
  else if(a.href.includes('wa.me')||a.href.startsWith('tel:'))track('Contact')});

// HighLevel widgets, loaded only when needed so they never slow the first paint
const loadWidget=(id,el)=>{const s=document.createElement('script');s.src='https://widgets.leadconnectorhq.com/loader.js';s.dataset.resourcesUrl='https://widgets.leadconnectorhq.com/chat-widget/loader.js';s.dataset.widgetId=id;(el||document.body).appendChild(s)};
const wc=$('#webcall-widget');
if(wc){let done=false;const go=()=>{if(done)return;done=true;loadWidget(wc.dataset.widget,wc)};
  new IntersectionObserver(([e],o)=>{if(e.isIntersecting){go();o.disconnect()}},{rootMargin:'600px'}).observe(wc);wc.addEventListener('pointerdown',go,{once:true})}
const CHAT=document.body.dataset.chat;
if(CHAT){const go=()=>loadWidget(CHAT);let fired=false;const once=()=>{if(fired)return;fired=true;go()};
  ['scroll','pointerdown','keydown'].forEach(ev=>addEventListener(ev,once,{once:true,passive:true}));setTimeout(once,6000)}
})();

/* Email chooser (13-10-2026): a mailto link does nothing when the visitor has no mail app set up
   (Gmail or Outlook in the browser), so every email button opens a small choice of
   Gmail, Outlook, their own email app, or copy the address. Each opens a ready-made email. */
(()=>{
const q=(h)=>{const u=new URL(h.replace(/&amp;/g,'&'));const p=u.searchParams;return{to:decodeURIComponent(u.pathname),su:p.get('subject')||'',bd:p.get('body')||'',raw:h}};
let box;
const make=()=>{box=document.createElement('div');box.className='mpick';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','Send us an email');
box.innerHTML='<div class="mp-card"><button class="mp-x" aria-label="Close">×</button><p class="mp-h">Send us an email</p><p class="mp-to"></p><div class="mp-opts"><a class="mp-o" data-k="gmail" target="_blank" rel="noopener">Gmail</a><a class="mp-o" data-k="outlook" target="_blank" rel="noopener">Outlook</a><a class="mp-o" data-k="app">Your email app</a><button class="mp-o" data-k="copy" type="button">Copy the address</button></div><p class="mp-note">A ready-made email opens with everything filled in.</p></div>';
document.body.appendChild(box);
box.addEventListener('click',e=>{if(e.target===box||e.target.closest('.mp-x'))close()});
addEventListener('keydown',e=>{if(e.key==='Escape')close()})};
const close=()=>{if(box)box.classList.remove('on')};
const open=(m)=>{if(!box)make();const E=encodeURIComponent;
box.querySelector('.mp-to').textContent=m.to;
box.querySelector('[data-k=gmail]').href='https://mail.google.com/mail/?view=cm&fs=1&to='+E(m.to)+'&su='+E(m.su)+'&body='+E(m.bd);
box.querySelector('[data-k=outlook]').href='https://outlook.office.com/mail/deeplink/compose?to='+E(m.to)+'&subject='+E(m.su)+'&body='+E(m.bd);
box.querySelector('[data-k=app]').href=m.raw;
const c=box.querySelector('[data-k=copy]');c.textContent='Copy the address';
c.onclick=()=>{(navigator.clipboard?navigator.clipboard.writeText(m.to):Promise.reject()).then(()=>{c.textContent='Copied: '+m.to}).catch(()=>{c.textContent=m.to})};
box.classList.add('on');box.querySelector('[data-k=gmail]').focus()};
document.addEventListener('click',e=>{const a=e.target.closest('a[href^="mailto:"]');if(!a||(box&&box.contains(a)))return;e.preventDefault();open(q(a.getAttribute('href')))});
})();
