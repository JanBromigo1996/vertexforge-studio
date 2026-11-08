/* Gemeinsam für alle Seiten: Repository-Links, Sprache (EN Standard, DE), Animationen beim Scrollen, Zähler, Spotlight */
const REPO = 'JanBromigo1996/vertexforge-studio';
const VF = {lang:'en', onLang:[], still: matchMedia('(prefers-reduced-motion: reduce)').matches};
(function(){
  const gh = 'https://github.com/' + REPO + '/';
  document.querySelectorAll('[data-gh]').forEach(a=>{ a.href = gh + a.dataset.gh; a.target = '_blank'; a.rel = 'noopener'; });

  try{ const s = localStorage.getItem('vf-site-lang'); if(s==='de' || s==='en') VF.lang = s; }catch(e){}
  VF.setLang = l => {
    VF.lang = l; document.documentElement.dataset.l = l; document.documentElement.lang = l;
    document.querySelectorAll('[data-setlang]').forEach(b=>b.setAttribute('aria-pressed', String(b.dataset.setlang===l)));
    try{ localStorage.setItem('vf-site-lang', l); }catch(e){}
    VF.onLang.forEach(f=>f());
  };
  document.querySelectorAll('[data-setlang]').forEach(b=>b.addEventListener('click', ()=>VF.setLang(b.dataset.setlang)));

  /* Einblenden beim Scrollen – nur für Elemente, die beim Laden noch unterhalb des Bildschirms liegen.
     Ohne JavaScript oder bei „Bewegung reduzieren“ ist alles sofort sichtbar. */
  if(!VF.still && 'IntersectionObserver' in window){
    const io = new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.remove('pre'); io.unobserve(e.target); } }), {rootMargin:'0px 0px -8% 0px'});
    const below = el => el.getBoundingClientRect().top > innerHeight * .92;
    document.querySelectorAll('.reveal').forEach(el=>{ if(below(el)){ el.classList.add('pre'); io.observe(el); } });
    document.querySelectorAll('.reveal-stagger').forEach(g=>{ [...g.children].forEach((c,i)=>{ if(below(c)){ c.style.setProperty('--i', i); c.classList.add('pre'); io.observe(c); } }); });
  }

  /* Zahlen zählen hoch, sobald sie sichtbar werden */
  const nf = new Intl.NumberFormat('en-US');
  if(!VF.still && 'IntersectionObserver' in window){
    const co = new IntersectionObserver(es=>es.forEach(e=>{
      if(!e.isIntersecting) return; co.unobserve(e.target);
      const el = e.target, to = +el.dataset.count, t0 = performance.now();
      const step = now => { const k = Math.min(1, (now - t0)/1100), v = Math.round(to * (1 - Math.pow(1-k, 4))); el.textContent = nf.format(v); if(k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }), {threshold:.6});
    document.querySelectorAll('[data-count]').forEach(el=>co.observe(el));
  }

  /* Lichtkegel folgt der Maus auf Karten */
  document.querySelectorAll('.feat,.card,.step-card').forEach(el=>el.addEventListener('pointermove', e=>{
    const r = el.getBoundingClientRect(); el.style.setProperty('--mx', (e.clientX - r.left) + 'px'); el.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }));

  /* Download passend zum System des Besuchers hervorheben */
  const ua = navigator.userAgent || '', plat = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '';
  const os = /Android|iPhone|iPad|CrOS/i.test(ua) ? '' : /Mac/i.test(plat) ? 'mac' : /Linux/i.test(plat) ? 'linux' : /Win/i.test(plat) ? 'win' : '';
  const FILES = {win:'VertexForge-Studio-Setup.exe', mac:'VertexForge-Studio-macOS.dmg', linux:'VertexForge-Studio-linux-amd64.deb'};
  if(os){
    const hero = document.getElementById('heroDl');
    if(hero){ hero.href = gh + 'releases/latest/download/' + FILES[os]; hero.querySelectorAll('.hero-os').forEach(e=>e.hidden = e.dataset.for !== os); }
    const cards = document.querySelectorAll('.dl [data-os]');
    if(cards.length){ cards.forEach(c=>c.classList.toggle('main', c.dataset.os === os)); const m = document.querySelector('.dl [data-os="' + os + '"]'); if(m && m.parentNode.firstElementChild !== m) m.parentNode.insertBefore(m, m.parentNode.firstElementChild); }
  }

  VF.setLang(VF.lang);
})();
