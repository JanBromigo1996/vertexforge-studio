/* ============================================================================
   MODUL 4 — SHOTLIST
   ============================================================================ */
function timecode(frames, fps){ const s = Math.floor(frames/fps); return `${pad(Math.floor(s/60))}:${pad(s%60)}:${pad(frames%fps)}`; }
function renderShots(){
  const p = activeProject(), fps = p.fps;
  const total = p.shots.reduce((a,s)=>a+s.frames, 0), rendered = p.shots.filter(s=>s.status.render==='done').length;
  const rows = p.shots.map((s,i)=>`<tr data-shot="${i}">
    <td><input class="inp mono" style="width:92px;font-weight:600;color:var(--accent)" value="${esc(s.code)}" data-sf="code"></td>
    <td><div class="thumb ${s.thumb?'has':''}" data-sact="${s.thumb?'view':'thumb'}" title="${esc(t(s.thumb?'sh.view':'sh.upload'))}">${s.thumb ? `<img src="${esc(assetSrc(s.thumb))}" alt=""><button class="thumb-swap" data-sact="thumb" title="${esc(t('sh.replace'))}">${ic('image',13)}</button>` : ic('image',15) + t('sh.image')}</div></td>
    <td style="min-width:290px"><input class="inp" style="margin-bottom:4px;font-weight:600" value="${esc(s.seq)}" placeholder="${esc(t('sh.seq'))}" data-sf="seq"><input class="inp" style="color:var(--text-2)" value="${esc(s.desc)}" placeholder="${esc(t('sh.desc'))}" data-sf="desc"></td>
    <td><input class="inp mono" type="number" min="1" style="width:80px" value="${s.frames}" data-sf="frames"></td>
    <td class="mono" style="color:var(--text-2);white-space:nowrap">${(s.frames/fps).toLocaleString(locale(),{minimumFractionDigits:2, maximumFractionDigits:2})} s</td>
    <td><input class="inp mono" style="width:140px;font-size:11px" value="${esc(s.lens)}" data-sf="lens"></td>
    <td><input class="inp" style="width:190px;font-size:11.5px" value="${esc(s.vfx)}" data-sf="vfx"></td>
    <td><div class="dept">${DEPTS.map(([k,l])=>`<button class="st-${s.status[k]}" data-dept="${k}" title="${k}: ${s.status[k].toUpperCase()}">${l}</button>`).join('')}</div></td>
    <td class="sh-end"><button class="icon-btn sm danger" data-sact="del" title="${esc(t('g.delete'))}">${ic('trash',13)}</button><span class="sh-grip" data-sgrip title="${esc(t('sh.drag'))}">${ic('grip',16)}</span></td>
  </tr>`).join('');
  const v = $('view-shots'), scroll = v.scrollTop;
  v.innerHTML = `<div class="page wide">
    <div class="page-head">
      <div><div class="eyebrow">${t('sh.eyebrow')}</div><h1 class="page-title">${esc(projectName(p))}</h1><p class="page-sub">${t('sh.sub')}</p></div>
      <div class="head-actions">
        <label class="mini-range">${ic('film',14)}<span>${t('sh.fps')}</span><select class="sel" id="shFps">${[24,25,30,48,60].map(f=>`<option value="${f}" ${f===fps?'selected':''}>${f} fps</option>`).join('')}</select></label>
        <button class="btn btn-icon" id="shDesign" title="${esc(t('ds.surfShots'))}">${ic('palette',15)}</button>
        <button class="btn btn-primary" id="shAdd" title="Shift+A">${ic('plus',14)}<span>${t('sh.add')}</span></button>
      </div>
    </div>
    <div class="kpi-row">
      <div class="panel kpi"><div class="kpi-main"><div class="kpi-label">${t('sh.count')}</div><div class="kpi-value">${p.shots.length}</div></div></div>
      <div class="panel kpi"><div class="kpi-main"><div class="kpi-label">${t('sh.frames')}</div><div class="kpi-value">${total.toLocaleString(locale())}</div></div></div>
      <div class="panel kpi"><div class="kpi-main"><div class="kpi-label">${t('sh.runtime',{fps})}</div><div class="kpi-value mono" style="font-size:19px">${timecode(total,fps)}</div><div class="kpi-text">mm:ss:ff</div></div></div>
      <div class="panel kpi">${ring(p.shots.length ? Math.round(rendered/p.shots.length*100) : 0)}<div class="kpi-main"><div class="kpi-label">${t('sh.rendered')}</div><div class="kpi-text">${t('sh.renderedText',{d:rendered, t:p.shots.length})}</div></div></div>
    </div>
    <div class="panel table-wrap">${p.shots.length ? `<table class="shot-table"><thead><tr><th>${t('th.shot')}</th><th>${t('th.frame')}</th><th>${t('th.seq')}</th><th>${t('th.frames')}</th><th>${t('th.dur')}</th><th>${t('th.lens')}</th><th>${t('th.vfx')}</th><th>${t('th.depts')}</th><th></th></tr></thead><tbody>${rows}</tbody></table>` : `<div class="empty">${ic('film',28)}${t('sh.empty')}<button class="btn btn-primary" onclick="addShot()">${ic('plus',14)} ${t('sh.add')}</button></div>`}</div>
  </div>`;
  v.scrollTop = scroll;
  $('shFps').onchange = e => { p.fps = +e.target.value; changed(); renderShots(); };
  applySurf(v, activeProject().shotStyle); $('shDesign').onclick = e => openDesignPop(e.currentTarget, 'shots');
  $('shAdd').onclick = addShot;
  v.onpointerdown = e => { const g = e.target.closest('[data-sgrip]'); if(g && e.button===0){ e.preventDefault(); shotDrag(e, g.closest('tr')); } };
  v.onkeydown = e => {   // Alt+↑/↓ verschiebt den Shot, in dem gerade getippt wird
    if(!e.altKey || (e.key!=='ArrowUp' && e.key!=='ArrowDown')) return;
    const row = e.target.closest && e.target.closest('[data-shot]'); if(!row) return;
    const i = +row.dataset.shot, j = i + (e.key==='ArrowUp' ? -1 : 1); if(j < 0 || j >= p.shots.length) return;
    e.preventDefault(); const f = e.target.dataset.sf;
    [p.shots[i], p.shots[j]] = [p.shots[j], p.shots[i]]; changed(); renderShots();
    const el = v.querySelector(`[data-shot="${j}"] [data-sf="${f}"]`); if(el) el.focus();
  };
  v.onchange = e => { const f = e.target.dataset.sf; if(!f) return; const s = p.shots[+e.target.closest('[data-shot]').dataset.shot]; if(!s) return; s[f] = f==='frames' ? Math.max(1, parseInt(e.target.value,10) || 1) : e.target.value; changed(); renderShots(); };
  // Bild direkt auf ein Shot-Feld ziehen
  v.ondragover = e => { const th = e.target.closest('.thumb'); if(!th || ![...e.dataTransfer.types].includes('Files')) return; e.preventDefault(); v.querySelectorAll('.thumb.drop').forEach(x=>x!==th && x.classList.remove('drop')); th.classList.add('drop'); };
  v.ondragleave = e => { const th = e.target.closest('.thumb'); if(th) th.classList.remove('drop'); };
  v.ondrop = async e => {
    const th = e.target.closest('.thumb'); if(!th) return; e.preventDefault(); th.classList.remove('drop');
    const f = [...e.dataTransfer.files].find(x=>x.type.startsWith('image/')); if(!f) return;
    const i = +th.closest('[data-shot]').dataset.shot, s = p.shots[i]; if(!s) return;
    s.thumb = addAsset(await compressImage(f, 1800)); changed(); renderShots();
  };
  v.onclick = async e => {
    const row = e.target.closest('[data-shot]'); if(!row) return;
    const i = +row.dataset.shot, s = p.shots[i];
    const d = e.target.closest('[data-dept]'); if(d){ const o = ['todo','wip','done'], k = d.dataset.dept; s.status[k] = o[(o.indexOf(s.status[k])+1) % 3]; changed(); renderShots(); return; }
    const a = e.target.closest('[data-sact]'); if(!a) return;
    if(a.dataset.sact==='thumb'){ const [f] = await pickFiles('image/*'); if(!f) return; s.thumb = addAsset(await compressImage(f, 1800)); changed(); renderShots(); }
    if(a.dataset.sact==='view'){ openShotImage(i); return; }
    if(a.dataset.sact==='del'){ if(await softDelete(s.code)){ p.shots.splice(i,1); changed(); renderShots(); } }
  };
}
/* Shots per Griff am rechten Rand umsortieren (Drag & Drop mit Live-Vorschau) */
function shotDrag(e, row){
  const p = activeProject(), tbody = row.parentElement, rows = [...tbody.children], from = rows.indexOf(row);
  const rects = rows.map(r=>r.getBoundingClientRect()), h = rects[from].height, y0 = e.clientY;
  const scroller = $('view-shots'), s0 = scroller.scrollTop;
  let to = from, lastY = e.clientY, raf = 0;
  row.classList.add('sh-dragging'); tbody.classList.add('sh-sorting'); document.body.classList.add('grabbing');
  const update = () => {
    raf = 0;
    const dy = lastY - y0 + (scroller.scrollTop - s0);
    row.style.transform = `translateY(${dy}px)`;
    const mid = rects[from].top + h/2 + dy;      // alles in Inhalts-Koordinaten des Starts
    to = from;
    rows.forEach((r,i)=>{ if(i===from) return; const c = rects[i].top + rects[i].height/2; if(i > from && mid > c) to = Math.max(to, i); if(i < from && mid < c) to = Math.min(to, i); });
    rows.forEach((r,i)=>{ if(i===from) return; const sh = (from < to && i > from && i <= to) ? -h : (from > to && i >= to && i < from) ? h : 0; r.style.transform = sh ? `translateY(${sh}px)` : ''; });
    // am Rand automatisch scrollen
    const vr = scroller.getBoundingClientRect();
    if(lastY < vr.top + 50) scroller.scrollTop -= 12; else if(lastY > vr.bottom - 50) scroller.scrollTop += 12;
  };
  const move = ev => { lastY = ev.clientY; if(!raf) raf = requestAnimationFrame(update); };
  const end = ev => {
    window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', end); window.removeEventListener('pointercancel', end); window.removeEventListener('keydown', onKey, true); window.removeEventListener('contextmenu', rc, true);
    cancelAnimationFrame(raf); document.body.classList.remove('grabbing');
    const cancel = ev && ev.type!=='pointerup';
    if(!cancel && to!==from){ const [s] = p.shots.splice(from, 1); p.shots.splice(to, 0, s); changed(); }
    renderShots();
    if(!cancel && to!==from){ const r = $('view-shots').querySelector(`[data-shot="${to}"]`); if(r){ r.classList.add('sh-dropped'); setTimeout(()=>r.classList.remove('sh-dropped'), 500); } }
  };
  const onKey = ev => { if(ev.key==='Escape'){ ev.stopPropagation(); end({type:'cancel'}); } };
  const rc = ev => { ev.preventDefault(); end({type:'cancel'}); };   // Rechtsklick bricht ab (wie Blender)
  window.addEventListener('pointermove', move); window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end); window.addEventListener('keydown', onKey, true); window.addEventListener('contextmenu', rc, true);
}
function addShot(){
  const p = activeProject(), maxN = p.shots.reduce((m,s)=>Math.max(m, parseInt((s.code.match(/\d+/)||['0'])[0],10)), 0), last = p.shots[p.shots.length-1];
  p.shots.push({uid:uid('sh'), code:`SH_${String(maxN+10).padStart(3,'0')}`, seq:last ? last.seq : 'SQ01', desc:'', frames:72, lens:'50mm', vfx:'', thumb:'', status:Object.fromEntries(DEPTS.map(([k])=>[k,'todo']))});
  changed(); renderShots();
  setTimeout(()=>{ const r = document.querySelector('#view-shots tbody tr:last-child [data-sf=desc]'); if(r){ r.scrollIntoView({block:'center'}); r.focus(); } }, 20);
}
MOD_KEYS.shots = (e, ctrl, k) => { if(e.shiftKey && !ctrl && e.code==='KeyA'){ addShot(); return true; } return false; };

/* ============================================================================
   MODUL 5 — STORY & LORE
   ============================================================================ */
function renderStory(){
  const p = activeProject();
  if(!p.chapters.some(c=>c.id===ui.chapterId)) ui.chapterId = p.chapters[0].id;
  if(!p.lore.some(l=>l.id===ui.loreId)) ui.loreId = p.lore[0] ? p.lore[0].id : null;
  const ch = p.chapters.find(c=>c.id===ui.chapterId);
  $('view-story').innerHTML = `<div class="story ${ui.focus?'focus':''}" id="storyRoot">
    <aside class="story-nav">
      <div class="side-head"><span>${t('sy.scenes')}</span><button class="btn btn-xs" onclick="addChapter()" title="Shift+A">${t('sy.scene')}</button></div>
      <ul class="side-list" id="chapterList"></ul>
      <div class="side-head" style="border-top:1px solid var(--line);margin-top:6px"><span>${t('sy.bible')}</span><button class="btn btn-xs" onclick="addLore()">${t('sy.entry')}</button></div>
      <ul class="side-list" id="loreList"></ul>
    </aside>
    <div class="story-center">
      <div class="story-toolbar">
        <div class="inline" style="flex-wrap:wrap">
          ${['scene','char','cam','cut'].map(f=>`<button class="btn btn-xs" onclick="insertFormat('${f}')">${t('fmt.'+f)}</button>`).join('')}
          <button class="btn btn-xs ${ui.focus?'on':''}" onclick="toggleFocus()" title="Ctrl+Space">${ic('focus',13)} ${t('sy.focus')}</button>
        </div>
        <div class="inline">
          <span class="mono muted" style="font-size:11px" id="wordCount"></span>
          <button class="icon-btn sm" id="storyDesign" title="${esc(t('ds.story'))}">${ic('palette',15)}</button>
          <button class="icon-btn sm ${ui.areaFull?'on':''}" onclick="toggleAreaFull()" title="${esc(ui.areaFull ? t('fs.exit') : t('fs.enter'))} · F11 / Esc">${ic(ui.areaFull?'shrink':'expand',15)}</button>
        </div>
      </div>
      <div class="paper-scroll"><div class="paper">
        <input class="paper-title" id="chTitle" value="${esc(ch.title)}" placeholder="${esc(t('sy.titlePh'))}" oninput="saveChapter()">
        <textarea class="paper-body" id="chBody" placeholder="${esc(t('sy.bodyPh'))}" oninput="saveChapter()">${esc(ch.body)}</textarea>
        <div class="paper-foot"><span>${t('sy.detected')}</span><span id="lorePills" class="inline" style="flex-wrap:wrap"></span></div>
      </div></div>
    </div>
    <aside class="story-insp" id="loreInsp"></aside>
  </div>`;
  renderStoryLists(); renderLoreInspector(); updateStoryMeta(); autoGrow($('chBody'));
  applyStoryStyle();
  $('storyDesign').onclick = e => openDesignPop(e.currentTarget, 'story');
}
function renderStoryLists(){
  const p = activeProject(); if(!$('chapterList')) return;
  $('chapterList').innerHTML = p.chapters.map((c,i)=>`<li class="${c.id===ui.chapterId?'active':''}" onclick="selectChapter('${c.id}')"><span class="t">${esc(c.title || t('g.untitled'))}</span>
    ${i>0 ? `<button class="x" onclick="event.stopPropagation();moveChapter('${c.id}',-1)" title="${esc(t('ph.moveUp'))}">${ic('arrowUp',12)}</button>` : ''}
    ${p.chapters.length>1 ? `<button class="x" onclick="event.stopPropagation();deleteChapter('${c.id}')" title="${esc(t('g.delete'))}">${ic('x',12)}</button>` : ''}</li>`).join('');
  $('loreList').innerHTML = p.lore.length ? p.lore.map(l=>`<li class="${l.id===ui.loreId?'active':''}" onclick="selectLore('${l.id}')"><span class="t">${esc(l.name)}</span><span class="mono muted" style="font-size:9.5px">${t('stg.'+l.stage)}</span></li>`).join('') : `<li style="cursor:default;color:var(--muted)">${t('sy.noEntries')}</li>`;
}
function renderLoreInspector(){
  const el = $('loreInsp'); if(!el) return;
  const l = activeProject().lore.find(x=>x.id===ui.loreId);
  if(!l){ el.innerHTML = `<div class="eyebrow">${t('li.title')}</div><p class="muted">${t('li.empty')}</p>`; return; }
  const field = (k, label, mono) => `<label class="f"><span class="f-l">${label}</span><input class="inp ${mono?'mono':''}" value="${esc(l[k])}" oninput="setLore('${l.id}','${k}',this.value)"></label>`;
  el.innerHTML = `<div class="eyebrow">${t('li.title')}</div>
    <div class="insp-card">
      <label class="f"><span class="f-l">${t('li.name')}</span><input class="inp" style="font-family:var(--display);font-weight:700;font-size:14px" value="${esc(l.name)}" oninput="setLore('${l.id}','name',this.value)"></label>
      ${field('category', t('li.cat'))}${field('polyTarget', t('li.poly'), true)}${field('shader', t('li.shader'))}
      <label class="f"><span class="f-l">${t('stg.label')}</span><select class="sel" onchange="setLore('${l.id}','stage',+this.value,true)">${Array.from({length:STAGES},(_,s)=>`<option value="${s}" ${s===l.stage?'selected':''}>${s+1} · ${t('stg.'+s)}</option>`).join('')}</select></label>
      <div class="stepper" style="--nacc:var(--accent)">${Array.from({length:STAGES},(_,s)=>`<button class="${s<=l.stage?'on':''}" style="${s<=l.stage?'background:var(--accent)':''}" onclick="setLore('${l.id}','stage',${s},true)" title="${esc(t('stg.'+s))}"></button>`).join('')}</div>
      <label class="f"><span class="f-l">${t('li.notes')}</span><textarea class="inp" rows="5" oninput="setLore('${l.id}','notes',this.value)">${esc(l.notes)}</textarea></label>
    </div>
    <div class="insp-card"><div class="f-l">${t('lk.files')}</div>${linksHTML(l.links,'lore',l.id)}<div class="note">${IS_DESKTOP ? t('lk.hintDesktop') : t('lk.hintBrowser')}</div></div>
    <button class="btn" style="color:var(--danger);align-self:flex-start" onclick="deleteLore('${l.id}')">${ic('trash',14)} ${t('li.delete')}</button>`;
  checkPaths(l.links.map(x=>x.path));
}
function updateStoryMeta(){
  const p = activeProject(), text = ($('chBody') && $('chBody').value) || '';
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  $('wordCount').textContent = t('sy.words',{n:words.toLocaleString(locale()), m:Math.max(1, Math.round(words/180))});
  const low = text.toLowerCase();
  const hits = p.lore.filter(l=>l.name.trim() && low.includes(l.name.trim().toLowerCase()));
  $('lorePills').innerHTML = hits.length ? hits.map(l=>`<span class="lore-pill" onclick="selectLore('${l.id}')">${esc(l.name)}</span>`).join('') : `<span>${t('g.none')}</span>`;
}
function autoGrow(ta){ if(!ta) return; ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; }
function saveChapter(){
  const ch = activeProject().chapters.find(c=>c.id===ui.chapterId); if(!ch) return;
  ch.title = $('chTitle').value; ch.body = $('chBody').value;
  autoGrow($('chBody')); updateStoryMeta(); renderStoryLists(); changed();
}
function insertFormat(type){
  const ta = $('chBody');
  const snip = {scene:L('\n\nEXT. ORT – NACHT\n\n','\n\nEXT. LOCATION – NIGHT\n\n'), char:L('\n\nFIGUR\n(Regieanweisung)\nDialog …\n','\n\nCHARACTER\n(parenthetical)\nDialogue …\n'), cam:L('\n\n[KAMERA: SH_010 – 35mm]\n','\n\n[CAMERA: SH_010 – 35mm]\n'), cut:L('\n\nSCHNITT AUF:\n\n','\n\nCUT TO:\n\n')}[type];
  const s = ta.selectionStart ?? ta.value.length, e = ta.selectionEnd ?? s;
  ta.value = ta.value.slice(0,s) + snip + ta.value.slice(e);
  ta.focus(); ta.selectionStart = ta.selectionEnd = s + snip.length;
  saveChapter();
}
function toggleFocus(){ ui.focus = !ui.focus; renderStory(); }
function selectChapter(id){ ui.chapterId = id; renderStory(); }
function moveChapter(id, dir){ const l = activeProject().chapters, i = l.findIndex(c=>c.id===id), j = i + dir; if(i<0 || j<0 || j>=l.length) return; [l[i], l[j]] = [l[j], l[i]]; changed(); renderStoryLists(); }
function selectLore(id){ ui.loreId = id; renderStoryLists(); renderLoreInspector(); if(innerWidth < 900) $('loreInsp').scrollIntoView({behavior:'smooth'}); }
function addChapter(){ const p = activeProject(); const c = {id:uid('ch'), title:t('sy.sceneN',{n:p.chapters.length+1}), body:L('INT. SCHAUPLATZ – NACHT\n\n','INT. LOCATION – NIGHT\n\n')}; p.chapters.push(c); ui.chapterId = c.id; changed(); renderStory(); setTimeout(()=>{ const ti = $('chTitle'); if(ti){ ti.focus(); ti.select(); } }, 20); }
async function deleteChapter(id){ const p = activeProject(), c = p.chapters.find(x=>x.id===id); if(!c || p.chapters.length<2) return; if(!(await softDelete(c.title))) return; p.chapters = p.chapters.filter(x=>x!==c); changed(); renderStory(); }
function addLore(){ const p = activeProject(); const l = {id:uid('lr'), name:t('sy.newAsset'), category:'Prop', polyTarget:'15,000 quads (UDIM 1001)', shader:'Principled BSDF', notes:'', stage:0, links:[]}; p.lore.push(l); ui.loreId = l.id; changed(); renderStoryLists(); renderLoreInspector(); }
function setLore(id, k, v, rerender){ const l = activeProject().lore.find(x=>x.id===id); if(!l) return; l[k] = v; changed(); if(k==='name'){ renderStoryLists(); updateStoryMeta(); } if(rerender){ renderStoryLists(); renderLoreInspector(); } }
async function deleteLore(id){ const p = activeProject(), l = p.lore.find(x=>x.id===id); if(!l) return; if(!(await softDelete(l.name))) return; p.lore = p.lore.filter(x=>x!==l); ui.loreId = null; changed(); renderStory(); }
MOD_KEYS.story = (e, ctrl, k) => {
  if(e.shiftKey && !ctrl && e.code==='KeyA'){ addChapter(); return true; }
  if(ctrl && e.code==='Space'){ toggleFocus(); return true; }
  return false;
};
MOD_KEYS.projects = (e, ctrl) => { if(e.shiftKey && !ctrl && e.code==='KeyA'){ newProjectDialog(); return true; } return false; };
/* Strg+Leertaste auch beim Schreiben im Story-Modul */
document.addEventListener('keydown', e=>{ if(S && S.activeModule==='story' && (e.ctrlKey||e.metaKey) && e.code==='Space' && isTyping(e.target)){ e.preventDefault(); const pos = e.target.selectionStart; const id = e.target.id; toggleFocus(); const el = $(id); if(el){ el.focus(); try{ el.setSelectionRange(pos,pos); }catch(_){} } } });

/* ============================================================================
   MODUL 6 — ANLEITUNG
   ============================================================================ */
function renderGuide(){
  const lang = currentLang(), secs = GUIDE[lang] || GUIDE.en, note = t('guide.only');
  const v = $('view-guide');
  v.innerHTML = `<div class="page">
    <div class="page-head"><div><div class="eyebrow">VertexForge Studio ${APP_VERSION}</div><h1 class="page-title">${t('mod.guide')}</h1>${note ? `<p class="page-sub">${esc(note)}</p>` : ''}</div>
      <div class="head-actions"><button class="btn" onclick="startTour()">${ic('sparkle',14)} ${t('tour.menu')}</button><button class="btn" onclick="openKeys()">${ic('keyboard',14)} ${t('h.keys')}</button><button class="btn btn-primary" onclick="go('projects')">${ic('grid',14)} ${t('mod.projects')}</button></div></div>
    <div class="guide">
      <nav class="guide-toc">${secs.map(([id,,title])=>`<button data-gjump="${id}">${esc(title)}</button>`).join('')}</nav>
      <div class="guide-body">${secs.map(([id,icon,title,html])=>`<section class="panel gsec" id="g_${id}"><h2><span class="gi">${ic(icon,16)}</span>${esc(title)}</h2>${macKeys(html).replace('{KEYS}', keysTableHTML())}</section>`).join('')}</div>
    </div></div>`;
  v.querySelector('.guide-toc').onclick = e => { const b = e.target.closest('[data-gjump]'); if(b){ const s = $('g_'+b.dataset.gjump); if(s) s.scrollIntoView({behavior:'smooth', block:'start'}); } };
}

/* ============================================================================
   START
   ============================================================================ */
/* Startprotokoll (macOS/Linux-App): landet in vertexforge.log – hilft bei Fehlerberichten */
/* Kein Start darf an einer hängenden Systemabfrage scheitern: nach der Wartezeit geht es ohne Ergebnis weiter */
function withTimeout(p, ms, what){ let done = false; return Promise.race([Promise.resolve(p).finally(()=>{ done = true; }), new Promise(res=>setTimeout(()=>{ if(!done) vfTrace('timeout: ' + what); res(null); }, ms))]); }
function vfTrace(m){ if(window.__vfFileBase) try{ fetch('/vf-log?m=' + encodeURIComponent(m)).catch(()=>{}); }catch(e){} }
async function init(){
  vfTrace('init');
  if(innerWidth < 600) ui.sideHidden = true;
  initBoard();
  db = await idbOpen();
  vfTrace(db ? 'db ok' : 'db failed');
  let raw = null, assets = {};
  if(db){
    /* bewusst ohne Zeitlimit: ein leeres Ergebnis würde sonst wie ein neuer Start behandelt */
    raw = await idbReq('suite', 'readonly', st=>st.get('main')); vfTrace('suite read');
    assets = await idbAllAssets(); vfTrace('assets read');
  }
  let migrated = false, wiped = false, prevVersion = raw && raw.appVersion;
  /* Einmaliger Neustart der Vorab-Versionen: alte Test-Daten und Einstellungen verwerfen.
     Ab hier gilt: Updates migrieren verlustfrei (normalizeSuite) und legen vorher eine Sicherheits-Version an. */
  if(raw && (raw.resetEpoch||0) < RESET_EPOCH){ await wipeAllData(); raw = null; assets = {}; wiped = true; prevVersion = null; }
  let noLegacy = false; try{ noLegacy = localStorage.getItem('vf.noLegacy')==='1'; }catch(e){}
  if(!raw && !wiped && !noLegacy){ const legacy = await withTimeout(loadLegacyPapyrus(), 3000, 'legacy'); vfTrace('legacy checked'); if(legacy && Array.isArray(legacy.projects) && legacy.projects.length){ raw = legacy; migrated = true; } }
  if(raw){
    raw = Object.assign({}, raw, {assets:Object.assign({}, assets, raw.assets || {})});
    S = normalizeSuite(raw);
    Object.keys(assets).forEach(id=>ui.savedAssets.add(id));
  }else{
    let lang = detectLang();
    if(IS_DESKTOP){ try{ const inf = await withTimeout(window.vfInfo(), 3000, 'vfInfo'); if(inf && LANG_ORDER.includes(inf.lang)) lang = inf.lang; }catch(e){} vfTrace('info read'); }
    S = normalizeSuite({projects:[], settings:{lang}});
    const A = assetCtx();
    S.projects = demoProjects().map(p=>normalizeProject(p, A));
    S.activeProjectId = S.projects[0].id;
  }
  if(!S.projects.length){ S.projects.push(normalizeProject(blankProject(), assetCtx())); S.activeProjectId = S.projects[0].id; }
  render(); vfTrace('rendered');
  if(IS_DESKTOP && window.__vfFileBase) setTimeout(async()=>{ try{ const r = await withTimeout(window.vfExists(['/']), 4000, 'bridge test'); vfTrace('bridge test: ' + (r ? 'ok' : 'no answer')); const i = await withTimeout(window.vfInfo(), 4000, 'vfInfo 2'); vfTrace('vfInfo 2: ' + (i ? 'ok' : 'no answer')); }catch(e){ vfTrace('bridge error: ' + e.message); } }, 1500);
  H.base = snapshot();
  await saveNow(); vfTrace('saved');
  gcAssets();
  if(prevVersion && prevVersion !== APP_VERSION) setTimeout(()=>makeVersion('safety', t('ver.beforeUpdate', {v:APP_VERSION})), 800);
  loadSystemIcons();
  applyUiZoom();
  initWindowChrome();
  verInit();
  teamStart();
  window.vfZoomKey = d => stepUiZoom(d);
  if(!S.settings.tourDone) setTimeout(()=>{ if(!TOUR.on && !$('dialog').classList.contains('open')) startTour(); }, 500);
  if(!db) toast(t('ts.idbFail'), true);
  if(migrated) toast(t('ts.migrated'));
  try{ navigator.storage && navigator.storage.persist && navigator.storage.persist(); }catch(e){}

  setInterval(refreshCountdowns, 60000);
  document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='hidden'){ if(saveTimer) saveNow(); } else { refreshCountdowns(); if(S.activeModule==='board') checkPaths([...new Set(activeBoard().nodes.flatMap(n=>(n.links||[]).map(l=>l.path)))]); } });
  window.addEventListener('pagehide', ()=>{ if(saveTimer) saveNow(); });
  window.addEventListener('beforeunload', e=>{ if(saveTimer) saveNow(); if(!IS_DESKTOP && ui.fileDirty && ui.fileHandle){ e.preventDefault(); e.returnValue = ''; } });
  /* Desktop: vor dem Schließen alles sichern und ggf. nach der Projektdatei fragen */
  window.__vfBeforeClose = async () => {
    try{ window.vfCloseAck(); }catch(e){}
    await saveNow();
    if(ui.fileDirty && S.file && S.file.path){
      const r = await dialog({title:t('cl.title'), text:t('cl.text',{name:S.file.name}), buttons:[{label:t('g.cancel'), value:'cancel'},{label:t('cl.discard'), value:'discard'},{label:t('g.save'), value:'save', primary:true}]});
      if(r==='cancel' || r===null){ try{ window.vfCloseCancel(); }catch(e){} return; }
      if(r==='save' && !(await saveFile())){ try{ window.vfCloseCancel(); }catch(e){} return; }
    }
    try{ window.vfCloseNow(); }catch(e){}
  };
}
window.addEventListener('error', e=>vfTrace('error: ' + (e.message||'') + ' @' + (e.lineno||'')));
window.addEventListener('unhandledrejection', e=>vfTrace('rejection: ' + ((e.reason && e.reason.message) || e.reason)));
init();

/* Shot-Bild groß ansehen, ersetzen oder entfernen (Pfeiltasten: vorheriger/nächster Shot mit Bild) */
function openShotImage(i){
  const p = activeProject();
  const lb = document.createElement('div'); lb.className = 'lightbox shot-lb';
  const draw = () => {
    const s = p.shots[i]; if(!s || !s.thumb){ close(); return; }
    lb.innerHTML = `<div class="lb-stage"><img src="${esc(assetSrc(s.thumb))}" alt=""></div>
      <div class="lb-cap"><b class="mono">${esc(s.code)}</b>${s.desc ? ' · ' + esc(s.desc) : ''}</div>
      <div class="lb-actions"><button class="btn" data-lb="replace">${ic('image',14)} ${t('sh.replace')}</button><button class="btn" data-lb="remove">${ic('trash',14)} ${t('sh.removeImg')}</button><button class="btn" data-lb="close">${ic('x',14)} Esc</button></div>`;
  };
  const withImg = dir => { for(let j = i + dir; j >= 0 && j < p.shots.length; j += dir) if(p.shots[j].thumb) return j; return -1; };
  const close = () => { lb.classList.remove('open'); document.removeEventListener('keydown', kd, true); setTimeout(()=>lb.remove(), 200); };
  const kd = e => {
    if(e.key==='Escape'){ e.stopImmediatePropagation(); e.preventDefault(); close(); }
    else if(e.key==='ArrowRight' || e.key==='ArrowLeft'){ const j = withImg(e.key==='ArrowRight' ? 1 : -1); if(j>=0){ i = j; draw(); } e.preventDefault(); e.stopImmediatePropagation(); }
  };
  draw(); document.body.appendChild(lb); requestAnimationFrame(()=>lb.classList.add('open'));
  document.addEventListener('keydown', kd, true);
  lb.addEventListener('click', async e=>{
    const b = e.target.closest('[data-lb]');
    if(!b){ if(!e.target.closest('img')) close(); return; }
    const s = p.shots[i];
    if(b.dataset.lb==='replace'){ const [f] = await pickFiles('image/*'); if(!f) return; s.thumb = addAsset(await compressImage(f, 1800)); changed(); renderShots(); draw(); }
    else if(b.dataset.lb==='remove'){ s.thumb = ''; changed(); renderShots(); close(); undoToast(t('ts.deletedNamed',{name:s.code + ' · ' + t('sh.image')})); }
    else close();
  });
}
