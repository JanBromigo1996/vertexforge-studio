/* ============================================================================
   MODUL 2 — PIPELINE: Phasen, Aufgaben, Deadlines, Aufwand, Zeitachse, Kanban
   ============================================================================ */
/* Pipeline-Vorlagen: [Phase, Tage, Software, [[Aufgabe, Std, Prio], …]] — jeweils {de, en} */
const TEMPLATE_IDS = ['character','environment','hardsurface','motion','short'];
const TEMPLATES = {
  character:[
    [['Konzept & Referenzen','Concept & references'], 7, ['PureRef','Photoshop'], [[['Referenzen sammeln (Anatomie, Kleidung, Material)','Gather references (anatomy, clothing, materials)'],4,'high'],[['Silhouetten & Farbkonzept','Silhouettes & color concept'],6,'med']]],
    [['Sculpting','Sculpting'], 14, ['ZBrush'], [[['Blockout & Proportionen','Blockout & proportions'],8,'high'],[['Primär- & Sekundärformen','Primary & secondary forms'],12,'high'],[['Tertiärdetails, Poren & Alphas','Tertiary detail, pores & alphas'],10,'med']]],
    [['Kleidung & Simulation','Clothing & simulation'], 10, ['Marvelous Designer','ZBrush'], [[['Schnittmuster anlegen','Create sewing patterns'],6,'high'],[['Simulation, Falten & Export','Simulation, folds & export'],6,'med'],[['Kleidung in ZBrush detaillieren','Detail clothing in ZBrush'],6,'low']]],
    [['Retopologie & UV','Retopology & UV'], 10, ['Blender','RizomUV'], [[['Animationsfähige Retopologie','Animation-ready retopology'],12,'high'],[['UDIM-Layout & Texel-Dichte','UDIM layout & texel density'],5,'med']]],
    [['Texturierung & Lookdev','Texturing & lookdev'], 12, ['Substance Painter','Blender'], [[['High-to-Low baken','Bake high to low'],3,'high'],[['Texturen & Smart Materials','Textures & smart materials'],14,'high'],[['Shader & Lookdev-Turntable','Shaders & lookdev turntable'],5,'med']]],
    [['Rigging & Animation','Rigging & animation'], 14, ['Blender'], [[['Körper- & Gesichts-Rig','Body & face rig'],12,'high'],[['Weight Painting & Korrektur-Shapes','Weight painting & corrective shapes'],8,'med'],[['Test- & Shot-Animation','Test & shot animation'],16,'med']]],
    [['Rendering & Finishing','Rendering & finishing'], 10, ['Blender','After Effects','DaVinci Resolve'], [[['Licht & finaler Render','Lighting & final render'],8,'high'],[['Compositing','Compositing'],6,'med'],[['Grading & Export','Grading & export'],4,'critical']]]
  ],
  environment:[
    [['Konzept & Blockout','Concept & blockout'], 8, ['PureRef','Blender'], [[['Moodboard & Lichtstimmung','Mood board & lighting mood'],4,'high'],[['Layout-Blockout & Kameras','Layout blockout & cameras'],8,'high']]],
    [['Modulare Assets','Modular assets'], 14, ['Blender','ZBrush'], [[['Modulares Kit modellieren','Model the modular kit'],16,'high'],[['Hero-Assets sculpten','Sculpt hero assets'],12,'med']]],
    [['Materialien','Materials'], 10, ['Substance 3D Designer','Substance Painter'], [[['Kachelbare Materialien','Tileable materials'],10,'high'],[['Trim-Sheets & Decals','Trim sheets & decals'],6,'med']]],
    [['Set Dressing & Licht','Set dressing & lighting'], 10, ['Blender','Unreal Engine'], [[['Assets platzieren & Vegetation','Place assets & vegetation'],10,'med'],[['Licht, Nebel & Atmosphäre','Light, fog & atmosphere'],8,'high']]],
    [['Render & Präsentation','Render & presentation'], 6, ['Blender','DaVinci Resolve'], [[['Beauty-Shots rendern','Render beauty shots'],6,'high'],[['Grading & Portfolio-Bilder','Grade & portfolio images'],4,'med']]]
  ],
  hardsurface:[
    [['Konzept & Referenzen','Concept & references'], 5, ['PureRef','Photoshop'], [[['Referenzblätter & Funktionen','Reference sheets & function'],4,'high']]],
    [['Blockout','Blockout'], 7, ['Blender'], [[['Proportionen & Silhouette','Proportions & silhouette'],6,'high'],[['Mechanik & bewegliche Teile','Mechanics & moving parts'],5,'med']]],
    [['Detailmodellierung','Detail modeling'], 12, ['Blender','ZBrush'], [[['Hard-Surface-Details & Bevels','Hard-surface detail & bevels'],16,'high'],[['Kitbash & Paneele','Kitbash & panels'],6,'low']]],
    [['UV & Texturierung','UV & texturing'], 10, ['RizomUV','Substance Painter'], [[['UVs & Baking','UVs & baking'],6,'high'],[['Lack, Abnutzung & Decals','Paint, wear & decals'],10,'med']]],
    [['Lookdev & Turntable','Lookdev & turntable'], 5, ['Blender','DaVinci Resolve'], [[['Studio-Licht & Turntable','Studio light & turntable'],5,'high'],[['Schnitt & Export','Edit & export'],2,'med']]]
  ],
  motion:[
    [['Storyboard & Styleframes','Storyboard & style frames'], 7, ['Photoshop','Illustrator'], [[['Storyboard','Storyboard'],6,'high'],[['Styleframes','Style frames'],8,'high']]],
    [['3D-Assets','3D assets'], 8, ['Blender'], [[['Modelle & Materialien','Models & materials'],10,'med']]],
    [['Animation','Animation'], 10, ['Blender'], [[['Animatic & Timing','Animatic & timing'],5,'high'],[['Finale Animation','Final animation'],14,'high']]],
    [['Compositing','Compositing'], 7, ['After Effects'], [[['Render-Passes & Comp','Render passes & comp'],8,'high'],[['Typo & Grafiken','Typography & graphics'],5,'med']]],
    [['Schnitt, Sound & Delivery','Edit, sound & delivery'], 5, ['DaVinci Resolve','Premiere Pro'], [[['Schnitt & Musik','Edit & music'],4,'high'],[['Grading & Export-Formate','Grading & export formats'],3,'critical']]]
  ],
  short:[
    [['Story & Drehbuch','Story & script'], 10, ['PureRef'], [[['Logline & Treatment','Logline & treatment'],4,'high'],[['Drehbuch','Script'],8,'high']]],
    [['Previs & Animatic','Previs & animatic'], 10, ['Blender','DaVinci Resolve'], [[['Storyboard','Storyboard'],8,'high'],[['3D-Previs & Animatic','3D previs & animatic'],10,'high']]],
    [['Assets & Charaktere','Assets & characters'], 28, ['ZBrush','Marvelous Designer','Substance Painter','Blender'], [[['Charaktere','Characters'],40,'critical'],[['Props & Sets','Props & sets'],24,'high'],[['Rigs','Rigs'],16,'high']]],
    [['Animation','Animation'], 21, ['Blender'], [[['Blocking','Blocking'],20,'high'],[['Polish','Polish'],24,'high'],[['Cloth- & FX-Simulation','Cloth & FX simulation'],10,'med']]],
    [['Licht & Rendering','Lighting & rendering'], 12, ['Blender'], [[['Licht pro Sequenz','Lighting per sequence'],12,'high'],[['Render-Farm / Batch','Render farm / batch'],6,'med']]],
    [['Compositing','Compositing'], 8, ['After Effects'], [[['Comp & FX','Comp & FX'],10,'med']]],
    [['Schnitt, Grading & Ton','Edit, grading & sound'], 8, ['DaVinci Resolve'], [[['Schnitt','Edit'],6,'high'],[['Grading','Grading'],4,'med'],[['Sounddesign & Mix','Sound design & mix'],6,'med']]],
    [['Festival-Delivery','Festival delivery'], 4, [], [[['DCP / Master & Untertitel','DCP / master & subtitles'],4,'critical'],[['Poster & Stills','Poster & stills'],3,'low']]]
  ]
};
function buildTemplate(id, start){
  const tpl = TEMPLATES[id]; if(!tpl) return [];
  let cur = start || rel(0);
  return tpl.map(([name, days, tools, tasks])=>{
    const s = cur, e = rel(days, cur); cur = e;
    const step = Math.max(1, Math.floor(days / tasks.length));
    return {id:uid('ph'), title:L(name[0],name[1]), tools:[...tools], start:s, deadline:e, collapsed:false,
      tasks:tasks.map(([tx,h,pr],i)=>({id:uid('tk'), text:L(tx[0],tx[1]), status:'todo', deadline:i===tasks.length-1 ? e : rel(step*(i+1), s), prio:pr, est:h}))};
  });
}
function insertTemplate(id){
  const p = activeProject(), last = p.phases.map(ph=>ph.deadline).filter(Boolean).sort().pop();
  const start = last && last > rel(0) ? last : rel(0);
  normalizeProject({phases:buildTemplate(id, start)}, assetCtx()).phases.forEach(ph=>p.phases.push(ph));
  changed(); if(S.activeModule!=='pipeline') go('pipeline'); else renderPipeline();
}

/* Countdown */
function countdown(dateStr, done){
  if(done) return {cls:'done', label:t('cd.done')};
  const d = daysUntil(dateStr);
  if(d===null) return {cls:'none', label:t('cd.none')};
  if(d < 0) return {cls:'overdue', label:t('cd.overdue',{n:-d, u:plural(-d)})};
  if(d===0) return {cls:'today', label:t('cd.today')};
  return {cls:d <= 5 ? 'soon' : 'ok', label:t('cd.left',{n:d, u:plural(d)})};
}
function cdBadge(dateStr, done){
  const c = countdown(dateStr, done);
  return `<span class="cd cd-${c.cls}" data-cd data-date="${esc(dateStr||'')}" data-done="${done?1:0}" title="${esc(dateStr ? fmtDate(dateStr) : t('cd.none'))}">${ic('clock',12)}<span>${esc(c.label)}</span></span>`;
}
function refreshCountdowns(){
  document.querySelectorAll('[data-cd]').forEach(el=>{
    const c = countdown(el.dataset.date, el.dataset.done==='1');
    el.className = `cd cd-${c.cls}`; const s = el.querySelector('span'); if(s) s.textContent = c.label;
  });
}
function ring(pct, size=58){
  const r = (size-8)/2, c = 2*Math.PI*r;
  return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle class="bg" cx="${size/2}" cy="${size/2}" r="${r}"/><circle class="fg" style="--ring-c:${c.toFixed(2)}" cx="${size/2}" cy="${size/2}" r="${r}" stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${(c*(1-pct/100)).toFixed(2)}" transform="rotate(-90 ${size/2} ${size/2})"/><text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" fill="currentColor" font-family="JetBrains Mono" font-size="12" font-weight="600">${pct}%</text></svg>`;
}
function toolChip(name){ const k = softwareFromName(name); return `<span class="tool-chip">${k ? swMini(k) : `<span class="sw-mini" style="background:var(--line-2);color:var(--text)">${esc(name.slice(0,2))}</span>`}${esc(name)}</span>`; }

/* Zeitachse */
function phaseSpans(p){
  let prevEnd = null;
  return p.phases.map(ph=>{
    const td = ph.tasks.map(x=>parseISO(x.deadline)).filter(Boolean);
    const end = parseISO(ph.deadline) || (td.length ? new Date(Math.max(...td)) : null);
    let start = parseISO(ph.start) || prevEnd || (td.length ? new Date(Math.min(...td)) : null);
    if(end && !start) start = new Date(end.getTime() - 14*864e5);
    if(start && end && start > end) start = new Date(end.getTime());
    if(end) prevEnd = end;
    return {ph, start, end};
  });
}
function timelineHTML(p){
  const rows = phaseSpans(p).filter(r=>r.start && r.end);
  const legend = `<div class="tl-legend"><span><i style="background:var(--accent)"></i>${t('tl.progress')}</span><span><i style="background:var(--danger)"></i>${t('tl.overdue')}</span><span><i style="background:var(--warn)"></i>${t('tl.soon')}</span><span><i style="background:var(--ok)"></i>${t('tl.ok')}</span></div>`;
  if(!rows.length) return `<div class="tl-title"><h3>${t('tl.title')}</h3>${legend}</div><div class="tl-empty">${t('tl.empty')}</div>`;
  const today = today0();
  const min = Math.min(...rows.map(r=>+r.start), +today) - 3*864e5, max = Math.max(...rows.map(r=>+r.end), +today) + 5*864e5;
  const span = max - min, pos = d => ((+d - min) / span * 100);
  let ticks = '', m = new Date(min); m.setDate(1); m.setMonth(m.getMonth()+1);
  while(+m <= max){ ticks += `<div class="tl-tick" style="left:${pos(m).toFixed(2)}%">${m.toLocaleDateString(locale(),{month:'short',year:'2-digit'})}</div>`; m.setMonth(m.getMonth()+1); }
  const tickLines = ticks.replace(/>[^<]*<\/div>/g,'></div>'), tPos = pos(today).toFixed(2);
  const body = rows.map(({ph,start,end})=>{
    const total = ph.tasks.length, done = ph.tasks.filter(x=>x.status==='done').length, pct = total ? done/total*100 : 0;
    const cd = countdown(ph.deadline || isoLocal(end), total>0 && done===total);
    const dots = ph.tasks.filter(x=>parseISO(x.deadline)).map(x=>{ const c = countdown(x.deadline, x.status==='done'); return `<span class="tl-dot cd-${c.cls}" style="left:${pos(parseISO(x.deadline)).toFixed(2)}%" title="${esc(x.text)} — ${fmtDate(x.deadline)} (${esc(c.label)})"></span>`; }).join('');
    return `<div class="tl-row"><div class="tl-label" data-jump="${ph.id}" title="${esc(ph.title)}">${esc(ph.title)}</div><div class="tl-track">${tickLines}
      <div class="tl-bar cd-${cd.cls}" style="left:${pos(start).toFixed(2)}%;width:${Math.max(.6,pos(end)-pos(start)).toFixed(2)}%" title="${esc(ph.title)}: ${fmtDate(isoLocal(start))} – ${fmtDate(isoLocal(end))}"><div class="tl-fill" style="width:${pct}%"></div></div>
      ${dots}<div class="tl-today" style="left:${tPos}%"></div></div></div>`;
  }).join('');
  return `<div class="tl-title"><h3>${t('tl.title')}</h3>${legend}</div>
    <div class="tl-row tl-head"><div class="tl-label muted mono" style="font-size:10px;cursor:default">${t('tl.phase').toUpperCase()}</div><div class="tl-track">${ticks}<div class="tl-today" style="left:${tPos}%"></div><span class="tl-today-label" style="left:${tPos}%">${t('tl.today')}</span></div></div>${body}`;
}
function filteredTasks(ph){
  const f = S.settings.taskFilter;
  let list = ph.tasks.filter(x=>{
    if(f==='open') return x.status!=='done';
    if(f==='overdue') return x.status!=='done' && (daysUntil(x.deadline) ?? 1) < 0;
    if(f==='critical') return x.status!=='done' && x.prio==='critical';
    return true;
  });
  if(S.settings.sortByDate) list = [...list].sort((a,b)=>((a.status==='done')-(b.status==='done')) || (a.deadline||'9999').localeCompare(b.deadline||'9999') || PRIO_WEIGHT[a.prio]-PRIO_WEIGHT[b.prio]);
  return list;
}
const statusBtn = (x, ph) => `<button class="status st-${x.status}" data-cycle="${ph.id}:${x.id}" title="${esc(t('ts.'+x.status))}"><i></i>${t('ts.'+x.status)}</button>`;
function taskRow(ph, x){
  const done = x.status==='done';
  return `<div class="task p-${x.prio} ${done?'done':''}" data-task="${ph.id}:${x.id}">
    <label class="chk"><input type="checkbox" ${done?'checked':''} data-tf="done"><span></span></label>
    <input class="task-text" value="${esc(x.text)}" data-tf="text">
    <div class="task-meta">
      ${statusBtn(x, ph)}
      <label class="est" title="${esc(t('ph.estTitle'))}"><input type="number" min="0" step="0.5" value="${x.est||''}" placeholder="0" data-tf="est"><span>${t('g.hours')}</span></label>
      <select class="prio prio-${x.prio}" data-tf="prio">${PRIOS.map(k=>`<option value="${k}" ${k===x.prio?'selected':''}>${PRIO_LABEL[k]}</option>`).join('')}</select>
      <input type="date" class="date-in" value="${x.deadline}" data-tf="deadline">
      ${cdBadge(x.deadline, done)}
    </div>
    <button class="icon-btn sm danger" data-tdel title="${esc(t('g.delete'))}">${ic('x',14)}</button>
  </div>`;
}
function renderPipeline(){
  const p = activeProject(), s = stats(p), st = S.settings;
  const remainDays = s.finalDeadline ? Math.max(1, daysUntil(s.finalDeadline)) : null;
  const perDay = s.est && remainDays ? (s.est / remainDays) : 0;
  const filters = ['all','open','overdue','critical'];
  const phases = p.phases.map((ph,i)=>{
    const total = ph.tasks.length, done = ph.tasks.filter(x=>x.status==='done').length, pct = total ? Math.round(done/total*100) : 0;
    const est = ph.tasks.filter(x=>x.status!=='done').reduce((a,x)=>a+(x.est||0),0);
    const tasks = filteredTasks(ph);
    return `<section class="phase panel ${ph.collapsed?'collapsed':''}" id="phase_${ph.id}" data-phase="${ph.id}">
      <header class="phase-head">
        <button class="icon-btn sm" data-pact="collapse"><span class="chev">${ic('chevron',15)}</span></button>
        <span class="phase-num">${pad(i+1)}</span>
        <input class="phase-title" value="${esc(ph.title)}" data-pf="title">
        <div class="phase-dates">
          <label class="date-field"><span>${t('ph.start')}</span><input type="date" value="${ph.start}" data-pf="start"></label>
          <label class="date-field"><span>${t('ph.deadline')}</span><input type="date" value="${ph.deadline}" data-pf="deadline"></label>
        </div>
        ${cdBadge(ph.deadline, total>0 && done===total)}
        <span class="phase-pct">${pct}%</span>
        <button class="icon-btn sm" data-pact="up" title="${esc(t('ph.moveUp'))}">${ic('arrowUp',14)}</button>
        <button class="icon-btn sm" data-pact="down" title="${esc(t('ph.moveDown'))}">${ic('arrowDown',14)}</button>
        <button class="icon-btn sm danger" data-pact="delete" title="${esc(t('g.delete'))}">${ic('trash',14)}</button>
      </header>
      <div class="phase-bar"><div style="width:${pct}%"></div></div>
      <div class="phase-body">
        <div class="phase-tools">${ph.tools.map(toolChip).join('')}<input class="tools-input" value="${esc(ph.tools.join(', '))}" placeholder="${esc(t('ph.tools'))}" data-pf="tools"></div>
        ${est ? `<div class="phase-meta">${ic('clock',13)} ${t('ph.effort',{h:Math.round(est*10)/10})}</div>` : ''}
        <div class="task-list">${tasks.length ? tasks.map(x=>taskRow(ph,x)).join('') : `<div class="task-empty">${total ? t('ph.noMatch') : t('ph.noTasks')}</div>`}</div>
        <div class="task-add">
          <input class="inp" data-new="text" placeholder="${esc(t('ph.newTask'))}">
          <select class="sel" data-new="prio">${PRIOS.map(k=>`<option value="${k}" ${k==='med'?'selected':''}>${PRIO_LABEL[k]}</option>`).join('')}</select>
          <label class="est" title="${esc(t('ph.estTitle'))}"><input type="number" min="0" step="0.5" data-new="est" placeholder="0"><span>${t('g.hours')}</span></label>
          <input type="date" class="date-in" data-new="deadline" value="${ph.deadline}">
          <button class="btn btn-primary" data-pact="addtask">${ic('plus',14)}</button>
        </div>
      </div>
    </section>`;
  }).join('');
  const next = s.next;
  const v = $('view-pipeline');
  const scroll = v.scrollTop;
  v.innerHTML = `<div class="page">
    <div class="page-head">
      <div><div class="eyebrow">${t('pl.eyebrow')}</div><h1 class="page-title">${esc(projectName(p))}</h1><p class="page-sub">${t('pl.sub')}</p></div>
      <div class="head-actions">
        <div class="seg"><button data-view="list" class="${st.pipeView==='list'?'active':''}">${ic('list',13)} ${t('pl.list')}</button><button data-view="kanban" class="${st.pipeView==='kanban'?'active':''}">${ic('kanban',13)} ${t('pl.kanban')}</button></div>
        <div class="seg">${filters.map(k=>`<button data-filter="${k}" class="${st.taskFilter===k?'active':''}">${t('flt.'+k)}</button>`).join('')}</div>
        <button class="btn" id="plSort">${ic('sort',14)}<span>${st.sortByDate ? t('pl.sortDate') : t('pl.sortManual')}</span></button>
        <button class="btn" id="plTpl">${ic('layers',14)}<span class="hide-sm">${t('tpl.insert')}</span></button>
        <button class="btn" id="plDesign" title="${esc(t('ds.surfPipe'))}">${ic('palette',14)}<span class="hide-sm">${t('ds.design')}</span></button>
        <button class="btn btn-primary" id="plAdd">${ic('plus',14)}<span>${t('pl.addPhase')}</span></button>
      </div>
    </div>
    <div class="kpi-row">
      <div class="panel kpi">${ring(s.pct)}<div class="kpi-main"><div class="kpi-label">${t('kpi.progress')}</div><div class="kpi-text">${t('kpi.progressText',{d:s.done, t:s.total})}</div></div></div>
      <div class="panel kpi"><div class="kpi-main"><div class="kpi-label">${t('kpi.next')}</div>
        ${next ? `<div class="kpi-text" title="${esc(next.task.text)}" style="color:var(--text);font-weight:600">${esc(next.task.text)}</div><div class="inline">${cdBadge(next.task.deadline,false)}<span class="muted mono" style="font-size:10.5px">${fmtDate(next.task.deadline)}</span></div>` : `<div class="kpi-text">${t('kpi.noNext')}</div>`}</div></div>
      <div class="panel kpi"><div class="kpi-main"><div class="kpi-label">${t('kpi.overdue')}</div><div class="kpi-value" style="color:${s.overdue?'var(--danger)':'var(--ok)'}">${s.overdue}</div><div class="kpi-text">${s.overdue ? t('kpi.overdueYes') : t('kpi.overdueNo')}</div></div></div>
      <div class="panel kpi"><div class="kpi-main"><div class="kpi-label">${t('kpi.critical')}</div><div class="kpi-value" style="color:${s.critical?'var(--crit)':'var(--text)'}">${s.critical}</div><div class="kpi-text">Critical</div></div></div>
      <div class="panel kpi"><div class="kpi-main"><div class="kpi-label">${t('kpi.workload')}</div>
        ${s.est ? `<div class="kpi-value">${Math.round(s.est)} h</div><div class="kpi-text">${t('kpi.workloadText',{r:perDay.toFixed(1)})}</div><div class="meter ${perDay>8?'danger':perDay>5?'warn':''}"><div style="width:${clamp(perDay/8*100,3,100)}%"></div></div>` : `<div class="kpi-text">${t('kpi.noEst')}</div>`}</div></div>
      <div class="panel kpi"><div class="kpi-main"><div class="kpi-label">${t('kpi.final')}</div><div class="kpi-value" style="font-size:17px">${s.finalDeadline ? fmtDate(s.finalDeadline) : '—'}</div>${s.finalDeadline ? cdBadge(s.finalDeadline, s.total>0 && s.done===s.total) : ''}</div></div>
    </div>
    <div class="panel timeline">${timelineHTML(p)}</div>
    ${st.pipeView==='kanban' ? kanbanHTML(p) : `<div class="phase-list">${phases || `<div class="panel empty">${t('ph.empty')}<button class="btn btn-primary" id="plTpl2">${ic('layers',14)} ${t('tpl.insert')}</button></div>`}</div>`}
  </div>`;
  v.scrollTop = scroll;
  bindPipeline(v);
}
function kanbanHTML(p){
  const all = [];
  p.phases.forEach(ph=>ph.tasks.forEach(x=>{ if(filteredTasks(ph).includes(x)) all.push({ph, x}); }));
  return `<div class="kanban">${STATUSES.map(stt=>{
    const items = all.filter(o=>o.x.status===stt);
    return `<div class="kb-col" data-kbcol="${stt}"><div class="kb-head"><i style="background:${STATUS_COLOR[stt]}"></i>${t('ts.'+stt)}<span class="n">${items.length}</span></div>
      <div class="kb-list">${items.map(({ph,x})=>`<div class="kb-card p-${x.prio}" draggable="true" data-kb="${ph.id}:${x.id}">
        <div class="kb-ph">${esc(ph.title)}</div><div class="kb-t">${esc(x.text)}</div>
        <div class="kb-m"><span class="prio prio-${x.prio}" style="display:inline-flex;align-items:center">${PRIO_LABEL[x.prio]}</span>${x.est ? `<span class="mono muted" style="font-size:10.5px">${x.est} h</span>` : ''}${cdBadge(x.deadline, x.status==='done')}${statusBtn(x, ph)}</div></div>`).join('') || `<div class="task-empty" style="text-align:center;padding:20px 4px">${t('kb.drop')}</div>`}</div></div>`;
  }).join('')}</div>`;
}
const findPhase = id => activeProject().phases.find(p=>p.id===id);
function findTask(ref){ const [pid, tid] = ref.split(':'); const ph = findPhase(pid); return ph ? {ph, x:ph.tasks.find(x=>x.id===tid)} : {}; }
function cycleStatus(ref){ const {x} = findTask(ref); if(!x) return; x.status = STATUSES[(STATUSES.indexOf(x.status)+1) % STATUSES.length]; changed(); renderPipeline(); }
function togglePipeView(){ S.settings.pipeView = S.settings.pipeView==='list' ? 'kanban' : 'list'; persistSoon(); renderPipeline(); }
function addPhase(){
  const p = activeProject(), last = p.phases[p.phases.length-1];
  const start = (last && last.deadline) || rel(0);
  p.phases.push({id:uid('ph'), title:t('ph.new',{n:p.phases.length+1}), tools:[], start, deadline:rel(21, start), collapsed:false, tasks:[]});
  changed(); if(S.settings.pipeView==='kanban') S.settings.pipeView = 'list'; renderPipeline();
  setTimeout(()=>{ const el = document.querySelector('.phase:last-child .phase-title'); if(el){ el.scrollIntoView({behavior:'smooth', block:'center'}); el.focus(); el.select(); } }, 30);
}
function addTaskFrom(sec){
  const ph = findPhase(sec.dataset.phase), txt = sec.querySelector('[data-new=text]');
  if(!ph || !txt.value.trim()) return;
  ph.tasks.push(newTask(txt.value.trim(), isoDate(sec.querySelector('[data-new=deadline]').value), sec.querySelector('[data-new=prio]').value, num(sec.querySelector('[data-new=est]').value, 0, 0, 9999)));
  changed(); renderPipeline();
  setTimeout(()=>{ const n = document.querySelector(`[data-phase="${ph.id}"] [data-new=text]`); if(n) n.focus(); }, 0);
}
function templateMenu(btn){
  const r = btn.getBoundingClientRect();
  openMenu(r.left, r.bottom + 4, TEMPLATE_IDS.map(id=>({label:t('tpl.'+id), icon:'layers', run:()=>insertTemplate(id)})), t('tpl.insert'));
}
function bindPipeline(v){
  const st = S.settings;
  applySurf(v, activeProject().pipeStyle); $('plDesign').onclick = e => openDesignPop(e.currentTarget, 'pipeline');
  v.querySelectorAll('[data-view]').forEach(b=>b.onclick = () => { st.pipeView = b.dataset.view; persistSoon(); renderPipeline(); });
  v.querySelectorAll('[data-filter]').forEach(b=>b.onclick = () => { st.taskFilter = b.dataset.filter; persistSoon(); renderPipeline(); });
  $('plSort').onclick = () => { st.sortByDate = !st.sortByDate; persistSoon(); renderPipeline(); };
  $('plAdd').onclick = addPhase;
  $('plTpl').onclick = e => templateMenu(e.currentTarget);
  if($('plTpl2')) $('plTpl2').onclick = e => templateMenu(e.currentTarget);
  v.onclick = async e => {
    const j = e.target.closest('[data-jump]'); if(j){ const ph = findPhase(j.dataset.jump); if(ph && ph.collapsed){ ph.collapsed = false; renderPipeline(); } if(st.pipeView==='kanban'){ st.pipeView = 'list'; renderPipeline(); } const el = $('phase_'+j.dataset.jump); if(el) el.scrollIntoView({behavior:'smooth', block:'start'}); return; }
    const cyc = e.target.closest('[data-cycle]'); if(cyc){ cycleStatus(cyc.dataset.cycle); return; }
    const del = e.target.closest('[data-tdel]'); if(del){ const {ph,x} = findTask(del.closest('[data-task]').dataset.task); if(ph){ ph.tasks = ph.tasks.filter(y=>y!==x); changed(); renderPipeline(); } return; }
    const pa = e.target.closest('[data-pact]'); if(!pa) return;
    const sec = pa.closest('[data-phase]'), ph = sec && findPhase(sec.dataset.phase), list = activeProject().phases;
    if(!ph) return;
    const act = pa.dataset.pact, i = list.indexOf(ph);
    if(act==='collapse'){ ph.collapsed = !ph.collapsed; changed(); renderPipeline(); }
    if(act==='up' && i>0){ [list[i-1], list[i]] = [list[i], list[i-1]]; changed(); renderPipeline(); }
    if(act==='down' && i<list.length-1){ [list[i+1], list[i]] = [list[i], list[i+1]]; changed(); renderPipeline(); }
    if(act==='addtask') addTaskFrom(sec);
    if(act==='delete'){ if(ph.tasks.length && !(await confirmDelete(t('ph.del'), t('ph.delText',{name:ph.title, n:ph.tasks.length})))) return; activeProject().phases = list.filter(x=>x!==ph); changed(); renderPipeline(); }
  };
  v.onkeydown = e => { if(e.key==='Enter' && e.target.dataset.new){ e.preventDefault(); addTaskFrom(e.target.closest('[data-phase]')); } };
  const onField = (e, final) => {
    const el = e.target;
    if(el.dataset.pf){
      const ph = findPhase(el.closest('[data-phase]').dataset.phase); if(!ph) return;
      const k = el.dataset.pf;
      if(k==='title'){ ph.title = el.value; changed(); return; }
      if(!final) return;
      if(k==='tools') ph.tools = el.value.split(',').map(x=>x.trim()).filter(Boolean).slice(0,12);
      else ph[k] = isoDate(el.value);
      changed(); renderPipeline(); return;
    }
    if(el.dataset.tf){
      const {x} = findTask(el.closest('[data-task]').dataset.task); if(!x) return;
      const k = el.dataset.tf;
      if(k==='text'){ x.text = el.value; changed(); return; }
      if(k==='est'){ x.est = num(el.value, 0, 0, 9999); changed(); if(final) renderPipeline(); return; }
      if(!final) return;
      if(k==='done') x.status = el.checked ? 'done' : 'todo';
      if(k==='prio') x.prio = PRIOS.includes(el.value) ? el.value : 'med';
      if(k==='deadline') x.deadline = isoDate(el.value);
      changed(); renderPipeline();
    }
  };
  v.oninput = e => onField(e, false);
  v.onchange = e => onField(e, true);
  /* Kanban: Drag & Drop */
  v.ondragstart = e => { const c = e.target.closest('[data-kb]'); if(!c) return; e.dataTransfer.setData('text/plain', c.dataset.kb); e.dataTransfer.effectAllowed = 'move'; c.classList.add('dragging'); };
  v.ondragend = e => { const c = e.target.closest('[data-kb]'); if(c) c.classList.remove('dragging'); v.querySelectorAll('.kb-col').forEach(x=>x.classList.remove('drop')); };
  v.ondragover = e => { const col = e.target.closest('[data-kbcol]'); if(!col) return; e.preventDefault(); v.querySelectorAll('.kb-col').forEach(x=>x.classList.toggle('drop', x===col)); };
  v.ondrop = e => { const col = e.target.closest('[data-kbcol]'); if(!col) return; e.preventDefault(); const {x} = findTask(e.dataTransfer.getData('text/plain')); if(x){ x.status = col.dataset.kbcol; changed(); renderPipeline(); } };
}
MOD_KEYS.pipeline = (e, ctrl, k) => {
  if(e.shiftKey && k==='a' && !ctrl){ addPhase(); return true; }
  if(k==='v' && !ctrl && !e.shiftKey && !e.altKey){ togglePipeView(); return true; }
  return false;
};
