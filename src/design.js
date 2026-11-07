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
  el.addEventListener('click', e=>{
    const p = e.target.closest('[data-preset]'); if(p){ const [bg, node] = BOARD_PRESETS[p.dataset.preset]; setBoardStyle({bg, node}); return; }
    const bgb = e.target.closest('[data-bg]'); if(bgb){ setBoardStyle({bg:bgb.dataset.bg}); return; }
    const nb = e.target.closest('[data-ns]'); if(nb){ setBoardStyle({node:nb.dataset.ns}); return; }
    const pp = e.target.closest('[data-paper]'); if(pp){ setStoryStyle(pp.dataset.paper); return; }
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
  }else{
    const cur = activeProject().storyStyle;
    el.innerHTML = `<div class="dp-head">${ic('palette',14)}<span>${t('ds.story')}</span></div>
      <div class="dp-presets papers">${STORY_PAPERS.map(k=>`<button class="dp-preset ${cur===k?'on':''}" data-paper="${k}"><span class="paper-prev paper-${k}"><b>Aa</b><i></i><i></i></span><em>${t('ds.paper.'+k)}</em></button>`).join('')}</div>`;
  }
}
document.addEventListener('keydown', e=>{ if(designPop && e.key==='Escape'){ e.stopImmediatePropagation(); e.preventDefault(); closeDesignPop(); } }, true);
