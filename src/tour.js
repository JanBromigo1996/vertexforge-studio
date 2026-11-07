/* ============================================================================
   GEFÜHRTE TOUR — erscheint beim ersten Start, jederzeit überspringbar (Esc),
   wiederholbar über Hilfe ▸ Geführte Tour, die Befehlspalette (F3) oder die Anleitung.
   ============================================================================ */
const TOUR_STEPS = [
  {k:'welcome'},
  {k:'hub',      mod:'projects', sel:'#hubGrid .pcard-cover', pad:6},
  {k:'new',      mod:'projects', sel:'#hubNew'},
  {k:'size',     mod:'projects', sel:'#hubDesign'},
  {k:'tabs',     mod:'projects', sel:'#tabs'},
  {k:'kpi',      mod:'pipeline', sel:'#view-pipeline .kpi-row'},
  {k:'timeline', mod:'pipeline', sel:'#view-pipeline .timeline'},
  {k:'phases',   mod:'pipeline', sel:'#view-pipeline .phase', alt:'#view-pipeline .phase-list'},
  {k:'tpl',      mod:'pipeline', sel:'#plTpl'},
  {k:'toolbar',  mod:'board',    sel:'#boardTools', alt:'#boardToolbar'},
  {k:'canvas',   mod:'board',    sel:'#viewport', inset:true},
  {k:'design',   mod:'board',    sel:'#boardDesign'},
  {k:'links',    mod:'board',    sel:'#viewport .node-card .sw-links', alt:'#viewport .node-card'},
  {k:'shots',    mod:'shots',    sel:'#view-shots .shot-table tbody tr', alt:'#view-shots .table-wrap'},
  {k:'save',     mod:null,       sel:'#savePill'},
  {k:'versions', mod:null,       sel:'#topbar [data-act=versions]'},
  {k:'menus',    mod:null,       sel:'#topbar .menubar'},
  {k:'actions',  mod:null,       sel:'#topbar .tb-view'},
  {k:'done'}
];
const TOUR = {on:false, i:0, el:null, prevMod:null};

function startTour(){
  if(!S) return;
  closeMenu(); if(paletteEl) closePalette && closePalette();
  ['designer','modal2','dialog'].forEach(id=>{ const m = $(id); if(m && m.classList.contains('open')){ if(id==='designer') closeDesigner(); else if(id==='modal2') closeSheet(); } });
  if(ui.xf) cancelXf();
  TOUR.on = true; TOUR.i = 0; TOUR.prevMod = S.activeModule;
  let el = document.getElementById('tour');
  if(!el){ el = document.createElement('div'); el.id = 'tour'; document.body.appendChild(el); }
  el.innerHTML = `<div class="tour-block"></div><div class="tour-spot"></div><div class="tour-card" role="dialog" aria-live="polite"></div>`;
  el.className = 'tour'; TOUR.el = el;
  requestAnimationFrame(()=>el.classList.add('open'));
  el.addEventListener('click', tourClick);
  tourShow(0);
}
function endTour(done){
  if(!TOUR.on) return;
  TOUR.on = false;
  S.settings.tourDone = true; persistSoon();
  const el = TOUR.el; if(el){ el.classList.remove('open'); el.removeEventListener('click', tourClick); setTimeout(()=>{ if(!TOUR.on) el.remove(); }, 180); }
  if(TOUR.prevMod && TOUR.prevMod!==S.activeModule) go(TOUR.prevMod);
  if(!done) toast(t('tour.skipped'));
}
function tourClick(e){
  const b = e.target.closest('[data-tour]'); if(!b) return;
  const a = b.dataset.tour;
  if(a==='next') tourShow(TOUR.i + 1);
  else if(a==='back') tourShow(TOUR.i - 1);
  else if(a==='skip') endTour(false);
  else if(a==='finish') endTour(true);
  else if(a==='dot') tourShow(+b.dataset.i);
  else if(a==='lang'){ setLang(b.dataset.l); tourShow(TOUR.i); }
}
function tourTarget(st){
  if(!st.sel) return null;
  const vis = el => { if(!el) return null; const r = el.getBoundingClientRect(); return r.width > 4 && r.height > 4 && r.bottom > 0 && r.top < innerHeight ? el : null; };
  return vis(document.querySelector(st.sel)) || (st.alt ? vis(document.querySelector(st.alt)) : null);
}
function tourShow(i){
  if(!TOUR.on) return;
  if(i >= TOUR_STEPS.length){ endTour(true); return; }
  TOUR.i = i = clamp(i, 0, TOUR_STEPS.length-1);
  const st = TOUR_STEPS[i];
  let switched = false;
  if(st.mod && S.activeModule!==st.mod){ go(st.mod); switched = true; }
  // Ziel ggf. in den sichtbaren Bereich holen
  const pre = st.sel && document.querySelector(st.sel);
  if(pre && !st.inset){ const r = pre.getBoundingClientRect(); if(r.top < 60 || r.bottom > innerHeight - 40) pre.scrollIntoView({block:'center'}); }
  if(st.mod==='board' && st.k==='links'){ const c = document.querySelector('#viewport .node-card'); if(c){ const r = c.getBoundingClientRect(), v = $('viewport').getBoundingClientRect(); if(r.right > v.right || r.left < v.left || r.bottom > v.bottom || r.top < v.top) fitBoard(); } }
  tourPlace();
  // Nach dem Seitenwechsel (Wisch-Übergang) die Position noch einmal exakt nachführen
  clearTimeout(TOUR.t); if(switched) TOUR.t = setTimeout(tourPlace, 250);
}
function tourPlace(){
  if(!TOUR.on || !TOUR.el) return;
  const st = TOUR_STEPS[TOUR.i], n = TOUR_STEPS.length, last = TOUR.i===n-1, first = TOUR.i===0;
  const spot = TOUR.el.querySelector('.tour-spot'), card = TOUR.el.querySelector('.tour-card');
  const tg = tourTarget(st);
  const lang = currentLang();
  const langPick = first ? `<div class="tour-langs">${LANG_ORDER.map(l=>`<button class="${l===lang?'on':''}" data-tour="lang" data-l="${l}">${esc(LANG_NAMES[l])}</button>`).join('')}</div>` : '';
  const key = TOUR.i + ':' + lang, fresh = card.dataset.k !== key;
  if(fresh){ card.dataset.k = key; card.innerHTML = `
    <div class="tour-top"><span class="tour-step">${first ? ic('sparkle',13) : `${TOUR.i}/${n-2}`}</span>${last ? '' : `<button class="tour-x" data-tour="skip" title="${esc(t('tour.skip'))} (Esc)">${ic('x',14)}</button>`}</div>
    <h3>${esc(t('tour.'+st.k+'.t'))}</h3>
    <p>${t('tour.'+st.k+'.d')}</p>
    ${langPick}
    <div class="tour-dots">${TOUR_STEPS.map((_,j)=>`<button class="${j===TOUR.i?'on':j<TOUR.i?'past':''}" data-tour="dot" data-i="${j}" aria-label="${j+1}"></button>`).join('')}</div>
    <div class="tour-foot">
      ${first ? `<button class="btn btn-ghost" data-tour="skip">${t('tour.skip')}</button>` : last ? '<span></span>' : `<button class="btn btn-ghost" data-tour="back">${ic('chevronR',13)}<span>${t('tour.back')}</span></button>`}
      ${last ? `<button class="btn btn-primary" data-tour="finish">${t('tour.finish')}</button>` : `<button class="btn btn-primary" data-tour="next">${first ? t('tour.start') : t('tour.next')} <kbd>→</kbd></button>`}
    </div>`;
  card.classList.remove('swap'); void card.offsetWidth; card.classList.add('swap'); }
  // Spotlight
  const pad = st.pad != null ? st.pad : 8;
  let R;
  if(tg){
    const r = tg.getBoundingClientRect();
    R = st.inset ? {x:r.left+10, y:r.top+10, w:r.width-20, h:r.height-20} : {x:r.left-pad, y:r.top-pad, w:r.width+pad*2, h:r.height+pad*2};
    R.x = Math.max(4, R.x); R.y = Math.max(4, R.y); R.w = Math.min(innerWidth-8-R.x, R.w); R.h = Math.min(innerHeight-8-R.y, R.h);
    spot.style.cssText = `left:${R.x}px;top:${R.y}px;width:${R.w}px;height:${R.h}px;opacity:1`;
  }else{
    spot.style.cssText = `left:${innerWidth/2}px;top:${innerHeight/2}px;width:0;height:0;opacity:1`;
  }
  // Karte platzieren: unter / über / rechts / links vom Ziel, sonst mittig
  const cw = Math.min(380, innerWidth - 32), ch = card.offsetHeight || 220, gap = 14;
  let x, y;
  if(!R){ x = (innerWidth - cw)/2; y = (innerHeight - ch)/2; }
  else if(st.inset){ x = R.x + R.w - cw - 18; y = R.y + R.h - ch - 18; }
  else if(R.y + R.h + gap + ch < innerHeight - 12){ x = R.x + R.w/2 - cw/2; y = R.y + R.h + gap; }
  else if(R.y - gap - ch > 12){ x = R.x + R.w/2 - cw/2; y = R.y - gap - ch; }
  else if(R.x + R.w + gap + cw < innerWidth - 12){ x = R.x + R.w + gap; y = R.y + R.h/2 - ch/2; }
  else if(R.x - gap - cw > 12){ x = R.x - gap - cw; y = R.y + R.h/2 - ch/2; }
  else { x = (innerWidth - cw)/2; y = innerHeight - ch - 16; }
  x = clamp(x, 16, innerWidth - cw - 16); y = clamp(y, 12, innerHeight - ch - 12);
  card.style.width = cw + 'px'; card.style.left = x + 'px'; card.style.top = y + 'px';
  const nx = card.querySelector('[data-tour=next],[data-tour=finish]'); if(nx) nx.focus({preventScroll:true});
}
/* Tastatur: während der Tour gehören alle Tasten ihr */
document.addEventListener('keydown', e=>{
  if(!TOUR.on) return;
  e.stopImmediatePropagation();
  if(e.key==='Escape'){ e.preventDefault(); endTour(false); }
  else if(e.key==='ArrowRight' || e.key==='Enter' || e.key===' '){ e.preventDefault(); tourShow(TOUR.i + 1); }
  else if(e.key==='ArrowLeft' || e.key==='Backspace'){ e.preventDefault(); tourShow(TOUR.i - 1); }
  else if(e.key==='Tab'){ /* Fokus in der Karte belassen */ }
  else e.preventDefault();
}, true);
window.addEventListener('resize', ()=>{ if(TOUR.on) requestAnimationFrame(tourPlace); });
