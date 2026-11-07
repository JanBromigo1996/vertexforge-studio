/* ============================================================================
   DESIGN JE BEREICH — Denkbrett: Hintergrund & Knoten-Stil (pro Brett), Story: Papier (pro Projekt)
   Live-Vorschau: Änderungen wirken sofort, ohne die Ansicht neu aufzubauen.
   ============================================================================ */
function applyBoardStyle(){
  const vp = $('viewport'); if(!vp) return;
  const st = activeBoard().style || {bg:'dots', node:'studio'};
  vp.className = vp.className.replace(/\b(bg|ns)-\w+/g, '').trim();
  vp.classList.add('bg-' + st.bg, 'ns-' + st.node);
  vp.classList.toggle('nogrid', !S.settings.grid && (st.bg==='dots' || st.bg==='grid'));
}
function setBoardStyle(patch){
  const b = activeBoard(); b.style = Object.assign({}, b.style, patch);
  const vp = $('viewport'); vp.classList.add('style-anim'); clearTimeout(ui.styleT); ui.styleT = setTimeout(()=>vp.classList.remove('style-anim'), 420);
  applyBoardStyle(); changed(); renderWires(); refreshDesignPop();
}
function applyStoryStyle(){
  const root = document.getElementById('storyRoot'); if(!root) return;
  root.className = root.className.replace(/\bpaper-\w+/g, '').trim();
  root.classList.add('paper-' + (activeProject().storyStyle || 'parchment'));
}
function applySurf(v, k){
  if(!v) return;
  v.className = v.className.replace(/\bsurf-\w+/g, '').trim();
  v.classList.add('surf-' + (k || 'studio'));
}
function styleAnim(el){ if(!el) return; el.classList.add('style-anim'); clearTimeout(el._sa); el._sa = setTimeout(()=>el.classList.remove('style-anim'), 520); }
function setHubStyle(k){ S.settings.hubStyle = k; const v = $('view-projects'); styleAnim(v); v.className = v.className.replace(/\blib-\w+/g,'').trim(); v.classList.add('lib-' + k); persistSoon(); refreshDesignPop(); }
function setSurfStyle(area, k){
  const p = activeProject(); p[area==='pipeline' ? 'pipeStyle' : 'shotStyle'] = k;
  const v = $(area==='pipeline' ? 'view-pipeline' : 'view-shots'); styleAnim(v); applySurf(v, k); changed(); refreshDesignPop();
}
function setStoryStyle(v){ activeProject().storyStyle = v; applyStoryStyle(); changed(); refreshDesignPop(); }

let designPop = null;
function closeDesignPop(){ if(designPop){ designPop.el.classList.remove('open'); const el = designPop.el; setTimeout(()=>el.remove(), 160); document.removeEventListener('pointerdown', designPop.out, true); designPop = null; } }
function openDesignPop(btn, area){
  if(designPop && designPop.btn===btn){ closeDesignPop(); return; }
  closeDesignPop(); closeMenu();
  const el = document.createElement('div'); el.className = 'design-pop'; el.dataset.area = area;
  document.body.appendChild(el);
  const out = e => { if(!el.contains(e.target) && !btn.contains(e.target)) closeDesignPop(); };
  designPop = {el, btn, area, out};
  refreshDesignPop();
  const r = btn.getBoundingClientRect(), w = el.offsetWidth;
  el.style.left = clamp(r.right - w, 8, innerWidth - w - 8) + 'px'; el.style.top = (r.bottom + 8) + 'px';
  requestAnimationFrame(()=>el.classList.add('open'));
  setTimeout(()=>document.addEventListener('pointerdown', out, true), 0);
  el.addEventListener('input', e=>{
    const r = e.target.closest('[data-hub]'); if(!r) return;
    const k = r.dataset.hub; S.settings[k] = parseFloat(r.value);
    const g = $('hubGrid'); if(g) g.style.setProperty(k==='cardSize' ? '--card-w' : '--title-scale', k==='cardSize' ? r.value+'px' : r.value);
    persistSoon();
  });
  el.addEventListener('click', e=>{
    const p = e.target.closest('[data-preset]'); if(p){ const [bg, node] = BOARD_PRESETS[p.dataset.preset]; setBoardStyle({bg, node}); return; }
    const bgb = e.target.closest('[data-bg]'); if(bgb){ setBoardStyle({bg:bgb.dataset.bg}); return; }
    const nb = e.target.closest('[data-ns]'); if(nb){ setBoardStyle({node:nb.dataset.ns}); return; }
    const pp = e.target.closest('[data-paper]'); if(pp){ setStoryStyle(pp.dataset.paper); return; }
    const lb = e.target.closest('[data-lib]'); if(lb){ setHubStyle(lb.dataset.lib); return; }
    const sf = e.target.closest('[data-surf]'); if(sf){ setSurfStyle(designPop.area, sf.dataset.surf); return; }
  });
}
function refreshDesignPop(){
  if(!designPop) return;
  const el = designPop.el;
  if(designPop.area==='board'){
    const st = activeBoard().style, cur = Object.keys(BOARD_PRESETS).find(k=>BOARD_PRESETS[k][0]===st.bg && BOARD_PRESETS[k][1]===st.node);
    el.innerHTML = `<div class="dp-head">${ic('palette',14)}<span>${t('ds.board')}</span></div>
      <div class="dp-label">${t('ds.presets')}</div>
      <div class="dp-presets">${Object.keys(BOARD_PRESETS).map(k=>`<button class="dp-preset ${cur===k?'on':''}" data-preset="${k}"><span class="sw-prev bg-${BOARD_PRESETS[k][0]} ns-${BOARD_PRESETS[k][1]}"><i></i><i></i></span><em>${t('ds.p.'+k)}</em></button>`).join('')}</div>
      <div class="dp-label">${t('ds.bg')}</div>
      <div class="dp-chips">${BOARD_BGS.map(k=>`<button class="dp-chip ${st.bg===k?'on':''}" data-bg="${k}"><span class="chip-sw bg-${k}"></span>${t('ds.bg.'+k)}</button>`).join('')}</div>
      <div class="dp-label">${t('ds.nodes')}</div>
      <div class="dp-chips">${NODE_STYLES.map(k=>`<button class="dp-chip ${st.node===k?'on':''}" data-ns="${k}"><span class="chip-sw ns-${k}"></span>${t('ds.ns.'+k)}</button>`).join('')}</div>
      <div class="dp-note">${t('ds.boardNote')}</div>`;
  }else if(designPop.area==='hub'){
    const cur = S.settings.hubStyle;
    el.innerHTML = `<div class="dp-head">${ic('palette',14)}<span>${t('ds.lib')}</span></div>
      <div class="dp-presets libs">${LIB_STYLES.map(k=>`<button class="dp-preset ${cur===k?'on':''}" data-lib="${k}"><span class="lib-prev lp-${k}"><i></i><i></i><i></i></span><em>${t('ds.lib.'+k)}</em></button>`).join('')}</div>
      <div class="dp-label">${t('ds.sizes')}</div>
      <label class="dp-range">${ic('grid',14)}<span>${t('hub.cover')}</span><input type="range" min="160" max="380" step="1" value="${S.settings.cardSize}" data-hub="cardSize"></label>
      <label class="dp-range">${ic('type',14)}<span>${t('hub.titleSize')}</span><input type="range" min="0.6" max="1.6" step="0.01" value="${S.settings.titleScale}" data-hub="titleScale"></label>
      <div class="dp-note">${t('ds.libNote')}</div>`;
  }else if(designPop.area==='pipeline' || designPop.area==='shots'){
    const p = activeProject(), cur = designPop.area==='pipeline' ? p.pipeStyle : p.shotStyle;
    el.innerHTML = `<div class="dp-head">${ic('palette',14)}<span>${t(designPop.area==='pipeline' ? 'ds.surfPipe' : 'ds.surfShots')}</span></div>
      <div class="dp-presets papers">${SURF_STYLES.map(k=>`<button class="dp-preset ${cur===k?'on':''}" data-surf="${k}"><span class="surf-prev surf-${k}"><b></b><i></i><i></i></span><em>${t('ds.surf.'+k)}</em></button>`).join('')}</div>
      <div class="dp-note">${t('ds.surfNote')}</div>`;
  }else{
    const cur = activeProject().storyStyle;
    el.innerHTML = `<div class="dp-head">${ic('palette',14)}<span>${t('ds.story')}</span></div>
      <div class="dp-presets papers">${STORY_PAPERS.map(k=>`<button class="dp-preset ${cur===k?'on':''}" data-paper="${k}"><span class="paper-prev paper-${k}"><b>Aa</b><i></i><i></i></span><em>${t('ds.paper.'+k)}</em></button>`).join('')}</div>`;
  }
}
document.addEventListener('keydown', e=>{ if(designPop && e.key==='Escape'){ e.stopImmediatePropagation(); e.preventDefault(); closeDesignPop(); } }, true);


/* ============================================================================
   TOUCH: Tablets und Smartphones erkennen → größere Bedienelemente (html.touch)
   ============================================================================ */
(function touchMode(){
  const mq = matchMedia('(pointer: coarse)');
  const set = () => document.documentElement.classList.toggle('touch', mq.matches || (navigator.maxTouchPoints > 0 && matchMedia('(hover: none)').matches));
  set();
  if(mq.addEventListener) mq.addEventListener('change', set);
  // Erster Finger-Tipp auf einem Gerät mit Maus + Touchscreen schaltet ebenfalls um
  window.addEventListener('pointerdown', e => { if(e.pointerType==='touch') document.documentElement.classList.add('touch'); else if(e.pointerType==='mouse' && !mq.matches) document.documentElement.classList.remove('touch'); }, true);
})();
