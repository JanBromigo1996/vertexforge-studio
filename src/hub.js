/* ============================================================================
   MODUL 1 — PROJEKTE (Bibliothek), COVER-RENDERER, DESIGNER, NEUES PROJEKT
   ============================================================================ */
function coverHTML(c, extra=''){
  const src = assetSrc(c.image) || presetArt(c.preset);
  const ribbon = c.ribbon && c.ribbonColor!=='none'
    ? `<div class="cover-ribbon" style="background:${c.ribbonColor};color:${contrastText(c.ribbonColor)}">${esc(c.ribbon)}</div>` : '';
  const layer = kind => { const o = c[kind]; return o.text ? `<div class="cover-text" data-kind="${kind}" style="left:${o.x}%;top:${o.y}%">${stxHTML(o, o.text, 'cover')}</div>` : ''; };
  return `<div class="cover" style="--vig:${c.vignette}"><img class="cover-img" src="${esc(src)}" alt="" draggable="false" style="object-position:${c.focusX}% ${c.focusY}%"><div class="cover-vig"></div>${ribbon}${layer('title')}${layer('banner')}${extra}</div>`;
}
function stats(p){
  let total = 0, done = 0, overdue = 0, critical = 0, est = 0, next = null;
  p.phases.forEach(ph=>ph.tasks.forEach(x=>{
    total++;
    if(x.status==='done'){ done++; return; }
    est += x.est || 0;
    const d = daysUntil(x.deadline);
    if(d!==null && d < 0) overdue++;
    if(x.prio==='critical') critical++;
    if(x.deadline && (!next || x.deadline < next.task.deadline)) next = {task:x, phase:ph};
  }));
  const finalDeadline = p.phases.map(ph=>ph.deadline).filter(Boolean).sort().pop() || '';
  return {total, done, overdue, critical, est, next, finalDeadline, pct:total ? Math.round(done/total*100) : 0};
}
function renderProjects(){
  const st = S.settings, q = ui.hubQuery.trim().toLowerCase();
  let list = S.projects.map(p=>({p, s:stats(p)})).filter(x=>!q || projectName(x.p).toLowerCase().includes(q));
  const sorters = {
    recent:(a,b)=>b.p.updatedAt - a.p.updatedAt,
    name:(a,b)=>projectName(a.p).localeCompare(projectName(b.p)),
    progress:(a,b)=>b.s.pct - a.s.pct,
    deadline:(a,b)=>((a.s.next && a.s.next.task.deadline) || '9999').localeCompare((b.s.next && b.s.next.task.deadline) || '9999')
  };
  list.sort(sorters[st.hubSort]);
  const cards = list.map(({p,s})=>{
    const active = p.id===S.activeProjectId;
    return `<article class="pcard ${active?'active':''}" data-pid="${p.id}">
      <div class="pcard-cover" tabindex="0" data-open="${p.id}" title="${esc(t('act.open'))}">
        <i class="lib-deco lib-a" aria-hidden="true"></i><i class="lib-deco lib-b" aria-hidden="true"></i>
        ${coverHTML(p.cover)}
        <div class="pcard-progress"><div style="width:${s.pct}%"></div></div>
        ${active ? `<span class="pcard-active">${t('hub.active')}</span>` : ''}
        <button class="pcard-more" data-pa="more" aria-label="${esc(t('act.more'))}">${ic('dots',18)}</button>
        <div class="pcard-actions">
          <button data-pa="design" title="${esc(t('act.design'))}">${ic('sliders',15)}</button>
          <button data-pa="image" title="${esc(t('act.uploadCover'))}">${ic('image',15)}</button>
          <button data-pa="dup" title="${esc(t('act.duplicate'))}">${ic('copy',15)}</button>
          <button data-pa="export" title="${esc(t('act.export'))}">${ic('download',15)}</button>
          <button class="danger" data-pa="delete" title="${esc(t('act.delete'))}">${ic('trash',15)}</button>
        </div>
      </div>
      <div class="pcard-meta">
        <div class="pcard-name" title="${esc(projectName(p))}">${esc(projectName(p))}</div>
        <div class="pcard-sub"><span>${s.pct}% · ${t('hub.tasks',{d:s.done, t:s.total})}</span>${s.next ? cdBadge(s.next.task.deadline, false) : ''}</div>
      </div>
    </article>`;
  }).join('');
  const v = $('view-projects');
  v.className = v.className.replace(/\blib-\w+/g,'').trim(); v.classList.add('lib-' + st.hubStyle);
  v.innerHTML = `<div class="page wide">
    <div class="page-head">
      <div><div class="eyebrow">${t('hub.eyebrow')}</div><h1 class="page-title">${t('mod.projects')}</h1><p class="page-sub">${t(document.documentElement.classList.contains('touch') ? 'hub.subTouch' : 'hub.sub',{n:S.projects.length})}</p></div>
      <div class="head-actions">
        <div class="search">${ic('search',14)}<input class="inp" id="hubSearch" placeholder="${esc(t('hub.search'))}" value="${esc(ui.hubQuery)}"></div>
        <label class="mini-range" title="${esc(t('hub.sort'))}">${ic('sort',14)}<select class="sel" id="hubSort">${['recent','name','progress','deadline'].map(k=>`<option value="${k}" ${st.hubSort===k?'selected':''}>${t('sort.'+k)}</option>`).join('')}</select></label>
        <button class="btn" id="hubDesign" title="${esc(t('ds.lib'))}">${ic('palette',15)}<span class="hide-sm">${t('ds.view')}</span></button>
        <button class="btn btn-primary" id="hubNew">${ic('plus',15)}<span>${t('np.title')}</span></button>
      </div>
    </div>
    <div class="hub-grid" id="hubGrid" style="--card-w:${st.cardSize}px;--title-scale:${st.titleScale}">
      ${cards || `<div class="empty">${t('hub.noMatch')}</div>`}
      <div class="pcard"><div class="pcard-new" id="hubNewCard" tabindex="0"><div class="plus">${ic('plus',22)}</div>
        <div style="font-family:var(--display);font-weight:700;font-size:14px">${t('np.title')}</div><div class="note">${t('hub.newDesc')}</div></div></div>
    </div></div>`;
  $('hubDesign').onclick = e => openDesignPop(e.currentTarget, 'hub');
  $('hubNew').onclick = newProjectDialog; $('hubNewCard').onclick = newProjectDialog;
  $('hubNewCard').onkeydown = e => { if(e.key==='Enter') newProjectDialog(); };
  $('hubSearch').oninput = e => { ui.hubQuery = e.target.value; const pos = e.target.selectionStart; renderProjects(); const s = $('hubSearch'); s.focus(); s.setSelectionRange(pos,pos); };
  $('hubSort').onchange = e => { st.hubSort = e.target.value; persistSoon(); renderProjects(); };
  const grid = $('hubGrid');
  // Cover folgen der Maus in Echtzeit (leichte Neigung + Lichtreflex)
  grid.onpointermove = e => {
    if(e.pointerType==='touch') return;
    const c = e.target.closest('.pcard-cover'); grid.querySelectorAll('.pcard-cover.tilting').forEach(x=>{ if(x!==c){ x.classList.remove('tilting'); x.style.removeProperty('--rx'); x.style.removeProperty('--ry'); } });
    if(!c) return;
    const r = c.getBoundingClientRect(), px = (e.clientX - r.left)/r.width, py = (e.clientY - r.top)/r.height;
    c.classList.add('tilting');
    c.style.setProperty('--ry', ((px - .5) * 9).toFixed(2) + 'deg'); c.style.setProperty('--rx', ((.5 - py) * 7).toFixed(2) + 'deg');
    c.style.setProperty('--mx', (px*100).toFixed(1) + '%'); c.style.setProperty('--my', (py*100).toFixed(1) + '%');
  };
  grid.onpointerleave = () => grid.querySelectorAll('.pcard-cover.tilting').forEach(x=>{ x.classList.remove('tilting'); x.style.removeProperty('--rx'); x.style.removeProperty('--ry'); });
  grid.onclick = e => {
    const a = e.target.closest('[data-pa]'), card = e.target.closest('[data-pid]');
    if(a && card && a.dataset.pa==='more'){ e.stopPropagation(); const r = a.getBoundingClientRect(); hubMenu(card.dataset.pid, r.left, r.bottom + 4); return; }
    if(a && card){ e.stopPropagation(); projectAction(card.dataset.pid, a.dataset.pa); return; }
    const o = e.target.closest('[data-open]'); if(o) openProject(o.dataset.open);
  };
  grid.onkeydown = e => { const o = e.target.closest('[data-open]'); if(o && e.key==='Enter') openProject(o.dataset.open); };
  grid.oncontextmenu = e => {
    const card = e.target.closest('[data-pid]'); if(!card) return;
    e.preventDefault(); hubMenu(card.dataset.pid, e.clientX, e.clientY);
  };
}
function hubMenu(id, x, y){
    openMenu(x, y, [
      {label:t('act.open'), icon:'chevronR', run:()=>openProject(id)},
      {label:t('act.design'), icon:'sliders', run:()=>openDesigner(id)},
      {label:t('act.uploadCover'), icon:'image', run:()=>projectAction(id,'image')},
      {sep:1},
      {label:t('act.duplicate'), icon:'copy', run:()=>projectAction(id,'dup')},
      {label:t('act.export'), icon:'download', run:()=>exportProject(id)},
      {sep:1},
      {label:t('act.delete'), icon:'trash', danger:true, run:()=>projectAction(id,'delete')}
    ], projectName(S.projects.find(p=>p.id===id)));
}
async function projectAction(id, act){
  const p = S.projects.find(x=>x.id===id); if(!p) return;
  if(act==='design') return openDesigner(id);
  if(act==='export') return exportProject(id);
  if(act==='image'){
    const [f] = await pickFiles('image/*'); if(!f) return;
    p.cover.image = addAsset(await compressImage(f, 1600)); changed(); renderProjects(); toast(t('ts.coverUpdated')); return;
  }
  if(act==='dup'){
    const copy = normalizeProject(JSON.parse(JSON.stringify(p)), assetCtx());
    copy.id = uid('proj'); copy.cover.title.text = p.cover.title.text + ' 2'; copy.updatedAt = Date.now();
    S.projects.splice(S.projects.indexOf(p)+1, 0, copy); changed(); render(); toast(t('ts.dup')); return;
  }
  if(act==='delete'){
    if(!(await confirmDelete(t('dlg.delProject'), t('dlg.delProjectText',{name:projectName(p)})))) return;
    histCommit();
    S.projects = S.projects.filter(x=>x.id!==id);
    if(!S.projects.length) S.projects.push(normalizeProject(blankProject(), assetCtx()));
    if(S.activeProjectId===id) S.activeProjectId = S.projects[0].id;
    changed(); render(); toast(t('ts.deleted'));
  }
}

/* Neues Projekt mit Pipeline-Vorlage */
function newProjectDialog(){
  closeMenu();
  const html = `<div class="dlg-head"><h2>${t('np.title')}</h2><button class="icon-btn" data-close>${ic('x',18)}</button></div>
  <div class="dlg-body">
    <label class="f"><span class="f-l">${t('np.name')}</span><input class="inp" id="npName" value="${esc(t('np.defaultName'))}" style="height:36px;font-size:14px"></label>
    <label class="f"><span class="f-l">${t('np.template')}</span><select class="sel" id="npTpl" style="height:34px">${[...TEMPLATE_IDS,'empty'].map(id=>`<option value="${id}">${t('tpl.'+id)}</option>`).join('')}</select></label>
    <div class="f-row">
      <label class="f"><span class="f-l">${t('np.start')}</span><input type="date" class="inp" id="npStart" value="${rel(0)}"></label>
      <label class="f"><span class="f-l">${t('v.theme')}</span><select class="sel" id="npTheme">${THEMES.map(th=>`<option value="${th}">${t('th.'+th)}</option>`).join('')}</select></label>
    </div>
  </div>
  <div class="dlg-foot"><button class="btn" data-close>${t('g.cancel')}</button><button class="btn btn-primary" id="npCreate">${ic('plus',14)} ${t('np.create')}</button></div>`;
  const sh = openSheet(html, 'sm');
  const create = () => {
    const raw = blankProject($('npName').value.trim().toUpperCase() || t('np.defaultName'), $('npTpl').value, isoDate($('npStart').value) || rel(0), $('npTheme').value);
    const p = normalizeProject(raw, assetCtx());
    S.projects.push(p); S.activeProjectId = p.id;
    Object.assign(ui, {boardId:null, sel:new Set(), active:null, chapterId:null, loreId:null});
    closeSheet(); changed(); S.activeModule = 'projects'; render(); openDesigner(p.id);
  };
  sh.addEventListener('click', e=>{ if(e.target.closest('[data-close]')) closeSheet(); });
  $('npCreate').onclick = create;
  $('npName').onkeydown = e => { if(e.key==='Enter') create(); };
  setTimeout(()=>{ $('npName').focus(); $('npName').select(); }, 30);
}

/* ============================================================================
   COVER- & TITEL-DESIGNER
   ============================================================================ */
function openDesigner(id){
  closeMenu();
  const p = S.projects.find(x=>x.id===id); if(!p) return;
  ui.designer = {id, cover:JSON.parse(JSON.stringify(p.cover)), theme:p.theme, tab:'title'};
  const m = $('designer');
  m.innerHTML = `<div class="designer" role="dialog" aria-modal="true">
    <div class="des-preview">
      <div class="des-hint">${t('des.preview').toUpperCase()}</div>
      <div class="des-stage" id="desStage"></div>
      <div class="inline" style="flex-wrap:wrap;justify-content:center">
        <button class="btn" data-dact="upload">${ic('upload',14)} ${t('des.ownImage')}</button>
        <button class="btn btn-ghost" data-dact="removeImg" id="desRemove">${ic('trash',14)} ${t('des.removeImage')}</button>
      </div>
    </div>
    <div class="des-controls">
      <div class="des-head"><div><h2>${t('des.title')}</h2><div class="note">${t('des.sub')}</div></div><button class="icon-btn" data-dact="close" title="${esc(t('g.close'))}">${ic('x',18)}</button></div>
      <div class="des-tabs">${[['title','des.tabTitle'],['banner','des.tabBanner'],['ribbon','des.tabRibbon'],['image','des.tabImage']].map(([k,l])=>`<button data-dtab="${k}" class="${k==='title'?'active':''}">${t(l)}</button>`).join('')}</div>
      <div class="des-body" id="desBody"></div>
      <div class="des-foot"><button class="btn" data-dact="close">${t('g.cancel')}</button><button class="btn btn-primary" data-dact="save">${ic('check',15)} ${t('des.saveCover')}</button></div>
    </div></div>`;
  m.classList.add('open');
  m.onpointerdown = e => { if(e.target===m) closeDesigner(); };
  m.onclick = async e => {
    const tab = e.target.closest('[data-dtab]');
    if(tab){ ui.designer.tab = tab.dataset.dtab; m.querySelectorAll('[data-dtab]').forEach(b=>b.classList.toggle('active', b===tab)); renderDesignerBody(); return; }
    const a = e.target.closest('[data-dact]');
    if(a){
      const act = a.dataset.dact;
      if(act==='close') return closeDesigner();
      if(act==='save') return saveDesigner();
      if(act==='upload'){ const [f] = await pickFiles('image/*'); if(!f || !ui.designer) return; ui.designer.cover.image = addAsset(await compressImage(f, 1600)); renderDesignerPreview(); renderDesignerBody(); return; }
      if(act==='removeImg'){ ui.designer.cover.image = ''; renderDesignerPreview(); renderDesignerBody(); return; }
      if(act==='center'){ ui.designer.cover[ui.designer.tab].x = 50; renderDesignerPreview(); renderDesignerBody(); return; }
    }
    const c = ui.designer.cover;
    const rb = e.target.closest('[data-ribbon]'); if(rb){ c.ribbonColor = rb.dataset.ribbon; renderDesignerPreview(); renderDesignerBody(); return; }
    const rt = e.target.closest('[data-ribbontext]'); if(rt){ c.ribbon = rt.dataset.ribbontext; renderDesignerPreview(); renderDesignerBody(); return; }
    const pr = e.target.closest('[data-preset]'); if(pr){ c.preset = pr.dataset.preset; c.image = ''; renderDesignerPreview(); renderDesignerBody(); return; }
    if(['title','banner'].includes(ui.designer.tab)){
      const r = applyStyleEvent(c[ui.designer.tab], e);
      if(r==='all'){ renderDesignerBody(); renderDesignerPreview(); }
      else if(r==='fonts'){ renderFontArea(); }
    }
  };
  const onInput = e => {
    if(!ui.designer) return;
    const c = ui.designer.cover, el = e.target;
    if(el.dataset.ctext!==undefined){ c[ui.designer.tab].text = el.value; renderDesignerPreview(); return; }
    if(el.dataset.cpos){ c[ui.designer.tab][el.dataset.cpos] = parseFloat(el.value); const o = el.closest('.f').querySelector('output'); if(o) o.textContent = Math.round(el.value*10)/10; renderDesignerPreview(); return; }
    if(el.dataset.cf){ const k = el.dataset.cf; c[k] = el.type==='range' ? parseFloat(el.value) : el.value; const o = el.closest('.f') && el.closest('.f').querySelector('output'); if(o) o.textContent = Math.round(c[k]*100)/100; renderDesignerPreview(); return; }
    if(el.id==='desTheme'){ ui.designer.theme = el.value; return; }
    if(['title','banner'].includes(ui.designer.tab)){
      const r = applyStyleEvent(c[ui.designer.tab], e);
      if(r==='all'){ renderDesignerBody(); renderDesignerPreview(); }
      else if(r==='fonts') renderFontArea();
      else if(r) renderDesignerPreview();
    }
  };
  m.oninput = onInput;
  m.onchange = onInput;
  initDesignerDrag();
  renderDesignerPreview(); renderDesignerBody();
}
function renderFontArea(){
  const g = document.querySelector('#desBody [data-fontgrid]');
  if(g) g.innerHTML = fontGridHTML(ui.designer.cover[ui.designer.tab].font);
  document.querySelectorAll('#desBody [data-fontcat]').forEach(b=>b.classList.toggle('active', b.dataset.fontcat===ui.fontCat));
}
function renderDesignerBody(){
  const d = ui.designer, c = d.cover, body = $('desBody');
  const scroll = body.scrollTop;
  if(d.tab==='title' || d.tab==='banner'){
    const o = c[d.tab];
    body.innerHTML = `<div class="des-pane active">
      <label class="f"><span class="f-l">${t('des.text')} <span class="muted" style="text-transform:none">${t('des.enterHint')}</span></span>
        <textarea class="inp" rows="3" data-ctext style="font-size:15px;font-family:${fontStack(o.font)}">${esc(o.text)}</textarea></label>
      ${styleEditorHTML(o, {presets:true, fontGrid:true, sizeMax:d.tab==='title'?120:60})}
      <div class="f-row">
        <label class="f"><span class="f-l">${t('des.posX')} <output>${Math.round(o.x*10)/10}</output></span><input type="range" min="0" max="100" step="0.1" value="${o.x}" data-cpos="x"></label>
        <label class="f"><span class="f-l">${t('des.posY')} <output>${Math.round(o.y*10)/10}</output></span><input type="range" min="0" max="100" step="0.1" value="${o.y}" data-cpos="y"></label>
      </div>
      <div class="inline"><button class="btn btn-xs" data-dact="center">${ic('target',13)} ${t('des.center')}</button><span class="note">${t('des.dragHint')}</span></div>
    </div>`;
  }else if(d.tab==='ribbon'){
    const colors = ['#c9a45c','#9bb07a','#c07a4f','#8fa3b8','#e8dfc8','#79b3a2','#cc7461','#2a2620','none'];
    body.innerHTML = `<div class="des-pane active">
      <label class="f"><span class="f-l">${t('des.ribbonText')}</span><input class="inp" data-cf="ribbon" value="${esc(c.ribbon)}"></label>
      <div class="f"><span class="f-l">${t('des.ribbonPresets')}</span><div class="inline" style="flex-wrap:wrap">${['prod','pre','concept','render','done','paused'].map(k=>`<button class="btn btn-xs" data-ribbontext="${esc(t('rb.'+k))}">${esc(t('rb.'+k))}</button>`).join('')}</div></div>
      <div class="f"><span class="f-l">${t('des.ribbonColor')}</span><div class="swatches">${colors.map(col=>`<button class="swatch ${col==='none'?'none':''} ${c.ribbonColor===col?'active':''}" data-ribbon="${col}" title="${col}" style="${col!=='none'?`background:${col}`:''}"></button>`).join('')}<input type="color" data-cf="ribbonColor" value="${c.ribbonColor==='none'?'#c9a45c':c.ribbonColor}"></div></div>
    </div>`;
  }else{
    body.innerHTML = `<div class="des-pane active">
      <div class="subhead"><span>${t('des.motifs')}</span></div>
      <div class="preset-grid">${PRESETS.map(id=>`<button class="preset ${!c.image && c.preset===id?'active':''}" data-preset="${id}" title="${esc(L(PRESET_NAMES[id][0],PRESET_NAMES[id][1]))}"><img src="${presetArt(id)}" alt=""><span>${esc(L(PRESET_NAMES[id][0],PRESET_NAMES[id][1]))}</span></button>`).join('')}</div>
      <div class="f-row3">
        <label class="f"><span class="f-l">${t('des.focusX')} <output>${c.focusX}</output></span><input type="range" min="0" max="100" step="1" value="${c.focusX}" data-cf="focusX"></label>
        <label class="f"><span class="f-l">${t('des.focusY')} <output>${c.focusY}</output></span><input type="range" min="0" max="100" step="1" value="${c.focusY}" data-cf="focusY"></label>
        <label class="f"><span class="f-l">${t('des.vignette')} <output>${c.vignette}</output></span><input type="range" min="0" max="1" step="0.01" value="${c.vignette}" data-cf="vignette"></label>
      </div>
      <label class="f"><span class="f-l">${t('des.theme')}</span><select class="sel" id="desTheme">${THEMES.map(th=>`<option value="${th}" ${th===d.theme?'selected':''}>${t('th.'+th)}</option>`).join('')}</select></label>
    </div>`;
  }
  body.scrollTop = scroll;
  const rm = $('desRemove'); if(rm) rm.hidden = !c.image;
}
function renderDesignerPreview(){
  const d = ui.designer; if(!d) return;
  $('desStage').innerHTML = coverHTML(d.cover, '<div class="guide-v" id="gV"></div><div class="guide-h" id="gH"></div>');
  const sel = $('desStage').querySelector(`.cover-text[data-kind="${d.tab}"]`); if(sel) sel.classList.add('cur');
}
function initDesignerDrag(){
  const stage = $('desStage');
  stage.onpointerdown = e => {
    const el = e.target.closest('.cover-text'); if(!el) return;
    e.preventDefault();
    const kind = el.dataset.kind, d = ui.designer;
    if(d.tab!==kind){ d.tab = kind; document.querySelectorAll('[data-dtab]').forEach(b=>b.classList.toggle('active', b.dataset.dtab===kind)); renderDesignerBody(); stage.querySelectorAll('.cover-text').forEach(x=>x.classList.toggle('cur', x===el)); }
    const rect = stage.querySelector('.cover').getBoundingClientRect();
    const o = d.cover[kind], sx = e.clientX, sy = e.clientY, ox = o.x, oy = o.y;
    el.classList.add('dragging'); el.setPointerCapture(e.pointerId);
    el.oncontextmenu = ev => ev.preventDefault();
    const move = ev => {
      if(ev.button===2 || (ev.buttons & 2)){ o.x = ox; o.y = oy; el.style.left = ox+'%'; el.style.top = oy+'%'; up(); return; }
      let x = clamp(ox + (ev.clientX-sx)/rect.width*100, 0, 100), y = clamp(oy + (ev.clientY-sy)/rect.height*100, 0, 100);
      const snx = !ev.altKey && Math.abs(x-50) < 1.6, sny = !ev.altKey && Math.abs(y-50) < 1.2;
      if(snx) x = 50; if(sny) y = 50;
      $('gV').classList.toggle('on', snx); $('gH').classList.toggle('on', sny);
      o.x = Math.round(x*10)/10; o.y = Math.round(y*10)/10;
      el.style.left = o.x + '%'; el.style.top = o.y + '%';
    };
    const up = () => {
      el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
      el.classList.remove('dragging'); $('gV').classList.remove('on'); $('gH').classList.remove('on');
      document.querySelectorAll('#desBody [data-cpos]').forEach(r=>{ r.value = o[r.dataset.cpos]; const out = r.closest('.f').querySelector('output'); if(out) out.textContent = o[r.dataset.cpos]; });
    };
    el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  };
}
function closeDesigner(){ $('designer').classList.remove('open'); $('designer').innerHTML = ''; ui.designer = null; }
function saveDesigner(){
  const d = ui.designer; if(!d) return;
  const p = S.projects.find(x=>x.id===d.id);
  if(p){ p.cover = normalizeCover(d.cover, assetCtx()); p.theme = d.theme; changed(); }
  closeDesigner(); render(); toast(t('ts.coverSaved'));
}
