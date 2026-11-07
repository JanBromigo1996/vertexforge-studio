/* ============================================================================
   MODUL 3 — DENKBRETT: unendlicher Canvas, Andocken, Blender-Bedienung
   ============================================================================ */
const CV = {drag:null, pointers:new Map(), pinch:null, target:null, raf:0, space:false, sizes:null, moveRaf:0, lastMove:null, geo:{}};
const GAP = 10;
const NODE_LABEL = {mindmap:'bd.node', card:'bd.card', char:'bd.char', note:'bd.note', image:'bd.image', text:'bd.text', video:'bd.video', file:'bd.file'};

function activeBoard(){
  const p = activeProject();
  if(!p.boards.length) p.boards.push(newBoard('Board'));
  if(!p.boards.some(b=>b.id===ui.boardId)) ui.boardId = p.boards[0].id;
  return p.boards.find(b=>b.id===ui.boardId);
}
const nodeById = id => activeBoard().nodes.find(n=>n.id===id);
function nodeName(n){ if(!n) return ''; return (n.title || n.text || n.cat || t(NODE_LABEL[n.type])).split('\n')[0].slice(0,40); }

/* ---------- Rendering ---------- */
function renderBoard(){
  const p = activeProject(), b = activeBoard();
  $('boardSide').innerHTML = '';
  const tool = (act, icon, label, key, on) => `<button class="bt-tool ${on?'on':''}" ${act} data-tip="${esc(label)}${key ? ' · ' + key : ''}" aria-label="${esc(label)}">${ic(icon,18)}</button>`;
  const ld = S.settings.leftDrag;
  $('boardToolbar').innerHTML = `
    <div class="bt-row">
      <div class="bt-pill">
        <button class="bt-board" id="boardPick" title="${esc(t('bd.boards'))}">${ic('network',14)}<span>${esc(b.name)}</span><em>${p.boards.length > 1 ? p.boards.length : ''}</em>${ic('chevron',12)}</button>
        <button class="icon-btn sm" onclick="addBoard()" title="${esc(t('bd.newBoard'))}">${ic('plus',15)}</button>
      </div>
      <div class="bt-pill">
        <button class="icon-btn sm" onclick="undo()" title="${esc(t('e.undo'))} · Ctrl+Z">${ic('undo',16)}</button>
        <button class="icon-btn sm" onclick="redo()" title="${esc(t('e.redo'))} · Ctrl+Shift+Z">${ic('redo',16)}</button>
        <span class="bt-sep"></span>
        <button class="icon-btn sm ${S.settings.snap?'on':''}" onclick="toggleSnap()" title="${esc(t('set.snap'))} · ${esc(t('k.snapToggle'))}: Ctrl">${ic('pin',16)}</button>
        <button class="icon-btn sm ${ui.inspHidden?'':'on'}" onclick="toggleInspector()" title="${esc(t('bd.toggleInsp'))} · N">${ic('sliders',16)}</button>
        <span class="bt-sep"></span>
        <button class="btn btn-ghost btn-xs" onclick="fitBoard()" title="Home">${ic('fit',14)}<span class="hide-sm">${t('bd.fit')}</span></button>
        <span class="bt-sep"></span>
        <button class="icon-btn sm" onclick="openDeck()" title="${esc(t('cc.deck'))}">${ic('cards',16)}</button>
        <button class="icon-btn sm" id="boardDesign" title="${esc(t('ds.board'))}">${ic('palette',16)}</button>
        <button class="icon-btn sm ${ui.areaFull?'on':''}" onclick="toggleAreaFull()" title="${esc(ui.areaFull ? t('fs.exit') : t('fs.enter'))} · F11 / Esc">${ic(ui.areaFull?'shrink':'expand',16)}</button>
      </div>
    </div>
    <div class="bt-tools ${ui.sideHidden?'hidden':''}" id="boardTools">
      ${tool(`onclick="setLeftDrag('select')"`, 'pointer', t('set.ldSelect'), '', ld==='select')}
      ${tool(`onclick="setLeftDrag('pan')"`, 'hand', t('set.ldPan'), 'Space', ld==='pan')}
      <span class="bt-hsep"></span>
      ${tool(`onclick="addNode('mindmap')"`, 'node', t('bd.node'), 'Shift+A')}
      ${tool(`onclick="addNode('card')"`, 'card', t('bd.card'))}
      ${tool(`onclick="addNode('char')"`, 'cards', t('bd.char'))}
      ${tool(`onclick="addNode('note')"`, 'note', t('bd.note'))}
      ${tool(`onclick="addNode('text')"`, 'type', t('bd.text'))}
      ${tool(`onclick="pickBoardMedia()"`, 'image', t('bd.media'), 'Ctrl+V')}
      ${tool(`onclick="linkFiles()"`, 'link', t('bd.linkFile'))}
    </div>`;
  $('boardPick').onclick = e => openBoardMenu(e.currentTarget);
  $('boardDesign').onclick = e => openDesignPop(e.currentTarget, 'board');
  $('zoomHud').innerHTML = `<button class="icon-btn sm" onclick="zoomStep(1/1.25)" title="−">${ic('zoomOut',15)}</button><button class="zv" id="zoomVal" onclick="resetZoom()" title="100%">100%</button><button class="icon-btn sm" onclick="zoomStep(1.25)" title="+">${ic('zoomIn',15)}</button><button class="icon-btn sm" onclick="fitBoard(true)" title="${esc(t('bd.frameSel'))}">${ic('target',15)}</button>`;
  applyBoardStyle();
  renderNodes(); applyCam(); renderInspector();
}
function toggleBoardSide(){ ui.sideHidden = !ui.sideHidden; renderBoard(); }
function setLeftDrag(m){ S.settings.leftDrag = m; persistSoon(); renderBoard(); }
function openBoardMenu(btn){
  if(ui.menuBtn===btn){ closeMenu(); return; }
  const p = activeProject(), b = activeBoard(), r = btn.getBoundingClientRect();
  openMenu(r.left, r.bottom + 6, [
    ...p.boards.map(x=>({label:`${x.name}  ·  ${x.nodes.length}`, checked:x.id===b.id, run:()=>selectBoard(x.id)})),
    {sep:1},
    {label:t('bd.newBoard'), icon:'plus', run:addBoard},
    {label:t('bd.rename'), icon:'edit', kbd:'F2', run:()=>renameBoard(b.id)},
    {label:t('g.delete'), icon:'trash', danger:true, disabled:p.boards.length<2, run:()=>deleteBoard(b.id)}], t('bd.boards'));
  ui.menuBtn = btn; btn.classList.add('open');
}
function toggleInspector(){ ui.inspHidden = !ui.inspHidden; renderBoard(); }
function toggleSnap(){ S.settings.snap = !S.settings.snap; persistSoon(); renderBoard(); }
function selectBoard(id){ ui.boardId = id; ui.sel = new Set(); ui.active = null; ui.selConn = null; renderBoard(); }
function addBoard(){ const b = newBoard(t('bd.newName',{n:activeProject().boards.length+1})); activeProject().boards.push(b); ui.boardId = b.id; changed(); renderBoard(); }
async function renameBoard(id){ const b = activeProject().boards.find(x=>x.id===id); if(!b) return; const n = await askText(t('bd.rename'), b.name); if(n && n.trim()){ b.name = n.trim(); changed(); renderBoard(); } }
async function deleteBoard(id){
  const p = activeProject(), b = p.boards.find(x=>x.id===id); if(!b || p.boards.length<2) return;
  if(!(await softDelete(b.name))) return;
  p.boards = p.boards.filter(x=>x!==b); changed(); renderBoard();
}

function childCount(id){ return activeBoard().nodes.filter(n=>n.parent===id).length; }
function nodeHTML(n, i){
  const cls = `node node-${n.type}${ui.sel.has(n.id)?' selected':''}${ui.active===n.id?' active':''}${n.parent?' docked':''}`;
  const size = n.type==='text' ? '' : (n.type==='card' || n.type==='mindmap') ? `width:${n.w}px;min-height:${n.h}px;` : `width:${n.w}px;height:${n.h}px;`;
  const acc = (n.type==='card' || n.type==='mindmap') && n.color ? `--nacc:${n.color};` : '';
  const note = n.type==='note' && n.color ? `--note-bg:${n.color};--note-ink:${contrastText(n.color)};` : '';
  const kids = (n.type==='card' || n.type==='mindmap') ? childCount(n.id) : 0;
  const grip = `<div class="node-grip" data-act="move"><span class="grip-dots"></span>${t(NODE_LABEL[n.type])}${kids ? `<span class="gr" title="${kids}">${ic('link',11)}${kids}</span>` : ''}</div>`;
  let body = '';
  if(n.type==='image'){
    body = `<div class="node-img" data-act="move"><img src="${esc(assetSrc(n.src))}" alt="" draggable="false"></div><input class="n-caption" data-field="title" value="${esc(n.title)}" placeholder="${esc(t('nd.caption'))}">`;
  }else if(n.type==='video'){
    const src = n.src ? mediaURL(n.src) : localFileURL(n.path);
    body = `<div class="node-img node-vid" data-act="move"><video src="${esc(src)}" muted loop playsinline preload="metadata"></video><span class="vid-badge">${ic('play',12)}<span class="vid-dur"></span></span>${n.path ? `<span class="vid-link" title="${esc(n.path)}">${ic('link',11)}</span>` : ''}</div><input class="n-caption" data-field="title" value="${esc(n.title)}" placeholder="${esc(t('nd.caption'))}">`;
  }else if(n.type==='file'){
    const kind = fileKind(n.path), url = localFileURL(n.path), ext = (basename(n.path).split('.').pop()||'').toUpperCase().slice(0,5), sw = detectSoftware(n.path), swi = swInfo(sw), icon = swIconSrc(sw);
    const prev = url && kind==='image' ? `<img src="${esc(url)}" alt="" draggable="false" onerror="this.parentElement.classList.add('nopreview')">`
      : url && kind==='video' ? `<video src="${esc(url)}" muted loop playsinline preload="metadata" onerror="this.parentElement.classList.add('nopreview')"></video>` : '';
    body = `<div class="node-img file-prev ${prev?'':'nopreview'}" data-act="move">${prev}<div class="file-tile" style="--sw:${sw==='other'||sw==='folder'?'var(--accent)':swi.color}">${icon ? `<img src="${esc(icon)}" alt="">` : `<b>${esc(sw==='other'||sw==='folder' ? ext || '?' : swi.code)}</b>`}<span>${esc(ext)}</span></div></div>
      <div class="file-foot"><input class="n-caption" data-field="title" value="${esc(n.title || basename(n.path))}" placeholder="${esc(t('nd.caption'))}">
      <div class="file-path" data-path-check="${esc(n.path)}" title="${esc(n.path)}">${ic('link',11)}<span>${esc(n.path)}</span></div>
      <div class="file-acts">${IS_DESKTOP ? `<button data-act="fopen" title="${esc(t('lk.open'))}">${ic('external',13)}</button><button data-act="freveal" title="${esc(t('lk.reveal'))}">${ic('folder',13)}</button>` : ''}<button data-act="fcopy" title="${esc(t('lk.copy'))}">${ic('copy',13)}</button></div></div>`;
  }else if(n.type==='text'){
    const st = n.st;
    body = ui.editing===n.id
      ? `<textarea class="n-textedit" data-field="text" spellcheck="false" style="font-family:${fontStack(st.font)};font-size:${st.size}px;font-weight:${st.weight};line-height:${st.line};letter-spacing:${st.spacing}em;text-align:${st.align};font-style:${st.italic?'italic':'normal'};color:${st.foil==='plain'?st.color:'var(--text)'}">${esc(n.text)}</textarea>`
      : `<div class="n-textview" data-act="move">${stxHTML(st, n.text || ' ', 'px')}</div>`;
  }else if(n.type==='char'){
    body = charCardHTML(n, true);
  }else if(n.type==='note'){
    body = `<textarea class="n-note" data-field="text" placeholder="${esc(t('nd.noteText'))}">${esc(n.text)}</textarea>`;
  }else{
    body = `<div class="node-body"><input class="n-cat" data-field="cat" value="${esc(n.cat)}" placeholder="${esc(t('nd.cat'))}">
      <input class="n-title" data-field="title" value="${esc(n.title)}" placeholder="${esc(t('nd.title'))}">
      <textarea class="n-desc" data-field="desc" placeholder="${esc(t('nd.desc'))}">${esc(n.desc)}</textarea></div>`;
    if(n.type==='card') body += `<div class="stage-row"><div class="stepper">${Array.from({length:STAGES},(_,s)=>`<button data-stage="${s}" class="${s<=n.stage?'on':''}" title="${esc(t('stg.'+s))}"></button>`).join('')}</div><span class="stage-name">${t('stg.'+n.stage)}</span></div>
      <div class="n-links">${linksHTML(n.links,'node',n.id)}</div>`;
  }
  const pin = n.parent ? `<span class="dock-pin" title="${esc(t('insp.docked',{name:nodeName(nodeById(n.parent))}))}">${ic('pin',11)}</span>` : '';
  return `<div class="${cls}" data-id="${n.id}" style="left:${n.x}px;top:${n.y}px;${size}z-index:${i+1};${acc}${note}">${grip}${body}${pin}<div class="port port-in"></div><div class="port port-out" data-act="wire" title="${esc(t('bd.tipConnect'))}"></div><div class="node-resize" data-act="resize"></div><button class="node-del" data-act="del" title="${esc(t('g.delete'))} (X)">${ic('x',12)}</button></div>`;
}
function renderNodes(){
  const b = activeBoard();
  $('nodes').innerHTML = b.nodes.map(nodeHTML).join('');
  // Neue Elemente (hinzugefügt, eingefügt, per Undo zurückgeholt) sanft einblenden
  const ids = b.nodes.map(n=>n.id);
  if(ui.nodeSeenBoard===b.id && ui.nodeSeen) ids.forEach(id=>{ if(!ui.nodeSeen.has(id)){ const el = nodeEl(id); if(el) el.classList.add('pop'); } });
  ui.nodeSeen = new Set(ids); ui.nodeSeenBoard = b.id;
  layoutDocks(); renderWires();
  if(ui.editing){ const ta = nodeEl(ui.editing) && nodeEl(ui.editing).querySelector('.n-textedit'); if(ta && document.activeElement!==ta){ ta.focus(); } }
  checkPaths([...new Set(b.nodes.flatMap(n=>[...(n.links||[]).map(l=>l.path), ...(n.path ? [n.path] : [])]))]);
}
function updateNodeEl(n){
  const el = nodeEl(n.id); if(!el) return renderNodes();
  const tmp = document.createElement('div'); tmp.innerHTML = nodeHTML(n, activeBoard().nodes.indexOf(n));
  el.replaceWith(tmp.firstElementChild); layoutDocks(); renderWires();
}
function nodeEl(id){ return $('nodes').querySelector(`[data-id="${id}"]`); }
function nodeSize(n){
  if(CV.sizes && CV.sizes.has(n.id)) return CV.sizes.get(n.id);
  const el = nodeEl(n.id), s = {w:el ? el.offsetWidth : n.w || 100, h:el ? el.offsetHeight : n.h || 60};
  if(CV.sizes) CV.sizes.set(n.id, s);
  return s;
}
function nodeRect(n){ const s = nodeSize(n); return {x:n.x, y:n.y, w:s.w, h:s.h}; }
function freezeSizes(except){ CV.sizes = new Map(); if(except) CV.except = except; }
function thawSizes(){ CV.sizes = null; }
function refreshSel(){
  $('nodes').querySelectorAll('.node').forEach(el=>{ el.classList.toggle('selected', ui.sel.has(el.dataset.id)); el.classList.toggle('active', ui.active===el.dataset.id); });
  renderWires(); renderInspector();
}
function clearSel(){ ui.sel = new Set(); ui.active = null; ui.selConn = null; refreshSel(); }
function blurFields(){ const a = document.activeElement; if(a && a.closest && a.closest('#nodes')) a.blur(); }

/* ---------- Andocken (Bilder & Titel an Karten) ---------- */
function layoutDocks(opts={}){
  const b = activeBoard(), by = Object.fromEntries(b.nodes.map(n=>[n.id,n])), groups = new Map();
  b.nodes.forEach(n=>{ if(n.parent && by[n.parent]){ if(!groups.has(n.parent)) groups.set(n.parent, []); groups.get(n.parent).push(n); } });
  groups.forEach((kids, pid)=>{
    const P = nodeRect(by[pid]);
    ['top','bottom','left','right'].forEach(side=>{
      const list = kids.filter(k=>k.dock===side && k.id!==opts.except).sort((a,c)=>a.order-c.order);
      if(!list.length) return;
      const sz = list.map(k=>nodeSize(k)), horiz = side==='top' || side==='bottom';
      const total = sz.reduce((a,s)=>a + (horiz ? s.w : s.h), 0) + GAP*(list.length-1);
      let cx = P.x + (P.w - total)/2, cy = P.y + (P.h - total)/2;   /* zentriert zur Karte */
      list.forEach((k,i)=>{
        const {w, h} = sz[i]; let x, y;
        if(side==='bottom'){ x = cx; y = P.y + P.h + GAP; cx += w + GAP; }
        else if(side==='top'){ x = cx; y = P.y - GAP - h; cx += w + GAP; }
        else if(side==='right'){ x = P.x + P.w + GAP; y = cy; cy += h + GAP; }
        else { x = P.x - GAP - w; y = cy; cy += h + GAP; }
        k.x = Math.round(x); k.y = Math.round(y);
        const el = nodeEl(k.id); if(el){ el.style.left = k.x + 'px'; el.style.top = k.y + 'px'; }
      });
    });
  });
}
function findDockTarget(pt, n){
  let best = null, bestD = Infinity;
  for(const c of activeBoard().nodes){
    if(!DOCK_TARGETS.has(c.type) || c.id===n.id) continue;
    const R = nodeRect(c), m = 70;
    if(pt.x < R.x-m || pt.x > R.x+R.w+m || pt.y < R.y-m || pt.y > R.y+R.h+m) continue;
    const d = Math.hypot(Math.max(R.x-pt.x, 0, pt.x-(R.x+R.w)), Math.max(R.y-pt.y, 0, pt.y-(R.y+R.h)));
    if(d < bestD){ bestD = d; best = {c, R}; }
  }
  if(!best) return null;
  const {c, R} = best, nx = (pt.x - (R.x+R.w/2)) / (R.w/2), ny = (pt.y - (R.y+R.h/2)) / (R.h/2);
  const side = Math.abs(nx) > Math.abs(ny) ? (nx > 0 ? 'right' : 'left') : (ny > 0 ? 'bottom' : 'top');
  const sib = activeBoard().nodes.filter(k=>k.parent===c.id && k.dock===side && k.id!==n.id).sort((a,b)=>a.order-b.order);
  const horiz = side==='top' || side==='bottom';
  const index = sib.filter(k=>{ const r = nodeRect(k); return horiz ? r.x + r.w/2 < pt.x : r.y + r.h/2 < pt.y; }).length;
  return {parent:c.id, side, index, R};
}
function showDockBar(tg){
  const bar = $('dockBar');
  document.querySelectorAll('.node.dock-target').forEach(e=>e.classList.remove('dock-target'));
  if(!tg){ bar.style.display = 'none'; return; }
  const R = tg.R, th = 5;
  const g = {bottom:[R.x, R.y+R.h+4, R.w, th], top:[R.x, R.y-4-th, R.w, th], right:[R.x+R.w+4, R.y, th, R.h], left:[R.x-4-th, R.y, th, R.h]}[tg.side];
  Object.assign(bar.style, {display:'block', left:g[0]+'px', top:g[1]+'px', width:g[2]+'px', height:g[3]+'px'});
  const el = nodeEl(tg.parent); if(el) el.classList.add('dock-target');
}
function dockNode(n, parentId, side, index){
  const sib = activeBoard().nodes.filter(k=>k.parent===parentId && k.dock===side && k.id!==n.id).sort((a,b)=>a.order-b.order);
  sib.splice(clamp(index, 0, sib.length), 0, n);
  sib.forEach((k,i)=>{ k.order = i; });
  n.parent = parentId; n.dock = side;
}
function undock(n){
  if(!n.parent) return;
  const pid = n.parent, side = n.dock;
  delete n.parent; delete n.dock; delete n.order;
  activeBoard().nodes.filter(k=>k.parent===pid && k.dock===side).sort((a,b)=>a.order-b.order).forEach((k,i)=>{ k.order = i; });
}
/* Schütteln erkennen: ≥ 3 Richtungswechsel in 0,7 s */
function shakeAxis(s, v, now){
  const d = v - s.a;
  if(s.dir===0){ if(Math.abs(d) > 14){ s.dir = Math.sign(d); s.a = v; } return false; }
  if(Math.sign(d)===s.dir){ s.a = v; return false; }
  if(Math.abs(d) > 20){ s.flips.push(now); s.dir = -s.dir; s.a = v; s.flips = s.flips.filter(t0=>now - t0 < 700); return s.flips.length >= 3; }
  return false;
}
function detachDuringDrag(d, n, shaken){
  const oldParent = n.parent; undock(n); d.detached = true;
  const el = nodeEl(n.id);
  if(el){ el.classList.remove('docked'); if(shaken){ el.classList.add('shake-off'); setTimeout(()=>el.classList.remove('shake-off'), 400); } const pin = el.querySelector('.dock-pin'); if(pin) pin.remove(); }
  const p = nodeById(oldParent); if(p) updateNodeEl(p);
  layoutDocks(); updateWires();
}
function dockDragUpdate(d, e){
  const n = d.items[0].n;
  const snap = S.settings.snap !== !!(e.ctrlKey || e.metaKey);
  d.target = snap ? findDockTarget(toWorld(e.clientX, e.clientY), n) : null;
  if(n.parent){
    // Wegziehen löst automatisch: sobald das Element deutlich von seiner Karte weg ist
    // (bzw. nicht mehr über ihr andocken würde). Schütteln funktioniert weiterhin.
    const now = performance.now();
    d.shx = d.shx || {a:e.clientX, dir:0, flips:[]}; d.shy = d.shy || {a:e.clientY, dir:0, flips:[]};
    const shaken = shakeAxis(d.shx, e.clientX, now) || shakeAxis(d.shy, e.clientY, now);
    const far = Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 46 && (!d.target || d.target.parent!==n.parent);
    if(shaken || far) detachDuringDrag(d, n, shaken);
  }
  showDockBar(d.target);
}
function dockFinish(d){
  const n = d.items[0].n; showDockBar(null);
  const before = n.parent + ':' + n.dock;
  if(d.target){
    dockNode(n, d.target.parent, d.target.side, d.target.index);
    if(before !== n.parent + ':' + n.dock) toast(t('bd.docked',{name:nodeName(nodeById(n.parent))}));
  }
  const p = n.parent && nodeById(n.parent);
  if(p) updateNodeEl(p);
  updateNodeEl(n);
  const el = nodeEl(n.id);
  if(el && n.parent){ el.classList.add('anim'); layoutDocks(); renderWires(); setTimeout(()=>{ el.classList.remove('anim'); renderWires(); }, 260); }
}

/* ---------- Kamera ---------- */
function applyCam(){
  const c = activeBoard().cam, vp = $('viewport');
  $('world').style.transform = `translate(${c.x}px,${c.y}px) scale(${c.z})`;
  const g = 24*c.z; vp.style.setProperty('--g', g + 'px'); vp.style.setProperty('--gx', c.x + 'px'); vp.style.setProperty('--gy', c.y + 'px');
  const zv = $('zoomVal'); if(zv) zv.textContent = Math.round(c.z*100) + '%';
}
function zoomAt(f, cx, cy){
  const cam = activeBoard().cam, base = CV.target || {...cam};
  const z = clamp(base.z*f, .08, 4), wx = (cx-base.x)/base.z, wy = (cy-base.y)/base.z;
  CV.target = {z, x:cx - wx*z, y:cy - wy*z};
  if(!CV.raf) CV.raf = requestAnimationFrame(stepCam);
}
function zoomNow(f, cx, cy){
  CV.target = null; const cam = activeBoard().cam;
  const z = clamp(cam.z*f, .08, 4), wx = (cx-cam.x)/cam.z, wy = (cy-cam.y)/cam.z;
  cam.z = z; cam.x = cx - wx*z; cam.y = cy - wy*z; applyCam(); persistSoon();
}
function panBy(dx, dy){ CV.target = null; const c = activeBoard().cam; c.x += dx; c.y += dy; applyCam(); persistSoon(); }
function stepCam(){
  const cam = activeBoard().cam, tg = CV.target;
  if(!tg){ CV.raf = 0; return; }
  cam.x += (tg.x-cam.x)*.45; cam.y += (tg.y-cam.y)*.45; cam.z += (tg.z-cam.z)*.45;
  if(Math.abs(tg.z-cam.z) < .0008 && Math.abs(tg.x-cam.x) < .3 && Math.abs(tg.y-cam.y) < .3){ Object.assign(cam, tg); CV.target = null; CV.raf = 0; applyCam(); persistSoon(); return; }
  applyCam(); CV.raf = requestAnimationFrame(stepCam);
}
function zoomStep(f){ const r = $('viewport').getBoundingClientRect(); zoomAt(f, r.width/2, r.height/2); }
function resetZoom(){ const r = $('viewport').getBoundingClientRect(); zoomAt(1/(CV.target || activeBoard().cam).z, r.width/2, r.height/2); }
function fitBoard(selOnly){
  const b = activeBoard(), r = $('viewport').getBoundingClientRect();
  let list = selOnly && ui.sel.size ? b.nodes.filter(n=>ui.sel.has(n.id)) : b.nodes;
  if(!list.length){ CV.target = {x:80, y:70, z:1}; if(!CV.raf) CV.raf = requestAnimationFrame(stepCam); return; }
  const R = list.map(nodeRect);
  const minX = Math.min(...R.map(n=>n.x)), minY = Math.min(...R.map(n=>n.y)) - 26, maxX = Math.max(...R.map(n=>n.x+n.w)), maxY = Math.max(...R.map(n=>n.y+n.h));
  const z = clamp(Math.min((r.width-100)/(maxX-minX||1), (r.height-100)/(maxY-minY||1)), .1, 1.5);
  CV.target = {z, x:(r.width-(maxX-minX)*z)/2 - minX*z, y:(r.height-(maxY-minY)*z)/2 - minY*z};
  if(!CV.raf) CV.raf = requestAnimationFrame(stepCam);
}
function toWorld(cx, cy){ const r = $('viewport').getBoundingClientRect(), c = activeBoard().cam; return {x:(cx-r.left-c.x)/c.z, y:(cy-r.top-c.y)/c.z}; }
function viewCenter(){ const r = $('viewport').getBoundingClientRect(); return toWorld(r.left+r.width/2, r.top+r.height/2); }
function mouseWorld(){ const r = $('viewport').getBoundingClientRect(), m = ui.mouse; return (m.x>r.left && m.x<r.right && m.y>r.top && m.y<r.bottom) ? toWorld(m.x, m.y) : viewCenter(); }

/* ---------- Elemente anlegen ---------- */
function addNode(type, at){
  const b = activeBoard(), c = at || viewCenter();
  const base = {
    mindmap:{w:240, h:110, cat:t('nd.idea'), title:t('nd.newNode'), desc:'', links:[]},
    card:{w:290, h:150, cat:t('nd.cardCat'), title:t('nd.newCard'), desc:t('nd.cardDesc'), links:[], stage:0},
    char:{w:250, h:350, kind:'character', title:t('cc.newName'), sub:'', desc:'', stats:[0,0,0,0,0], facts:[{k:t('cc.f.poly'), v:''},{k:t('cc.f.tex'), v:''}], links:[], src:''},
    note:{w:220, h:150, text:''},
    text:{text:t('nd.textDefault'), st:textDefaults({size:44, align:'center', foil:S.settings.mode==='dark'?'gold':'plain', color:S.settings.mode==='dark'?'#e3cf9f':'#3a2f22', fx:S.settings.mode==='dark'?'extrude':'none', fxColor:'#3a2508', fxDepth:5, shadow:S.settings.mode==='dark'})}
  }[type];
  if(!base) return;
  const w = base.w || 300, h = base.h || 110;
  const n = normalizeNode(Object.assign({id:uid('nd'), type, x:Math.round(c.x - w/2), y:Math.round(c.y - h/2), color:''}, base), new Set(b.nodes.map(x=>x.id)), assetCtx());
  b.nodes.push(n); ui.sel = new Set([n.id]); ui.active = n.id; ui.selConn = null;
  changed(); renderNodes(); renderInspector();
  if(type==='text') editNode(n.id);
  else { const f = nodeEl(n.id) && nodeEl(n.id).querySelector(type==='note' ? '.n-note' : type==='char' ? '.tc-name' : '.n-title'); if(f){ f.focus(); f.select && f.select(); } }
}
async function addImages(files, at){
  const b = activeBoard(), base = at || mouseWorld(), added = [];
  for(const f of files){
    if(!f || !f.type || !f.type.startsWith('image/')) continue;
    const src = await compressImage(f, 2200);
    let w = 300, h = 220;
    try{ const img = await loadImg(src); const s = Math.min(1, 360/Math.max(img.naturalWidth, img.naturalHeight)); w = Math.max(80, Math.round(img.naturalWidth*s)); h = Math.max(60, Math.round(img.naturalHeight*s)) + 44; }catch(e){}
    const n = {id:uid('img'), type:'image', x:Math.round(base.x - w/2 + added.length*28), y:Math.round(base.y - h/2 + added.length*28), w, h, src:addAsset(src), title:(f.name||'').replace(/\.[^.]+$/,'').slice(0,60), color:''};
    b.nodes.push(n); added.push(n.id);
  }
  if(added.length){ ui.sel = new Set(added); ui.active = added[added.length-1]; changed(); renderNodes(); renderInspector(); toast(t('bd.imgAdded',{n:added.length})); }
}
async function pickBoardMedia(at){ const files = await pickFiles('image/*,video/*', true); if(!files.length) return; const c = at || viewCenter(), img = files.filter(f=>f.type.startsWith('image/')), vid = files.filter(f=>f.type.startsWith('video/')); if(img.length) addImages(img, c); if(vid.length) addVideos(vid, img.length ? {x:c.x+40, y:c.y+40} : c); }
async function pickBoardImages(){ const files = await pickFiles('image/*', true); if(files.length) addImages(files, viewCenter()); }
async function pickBoardVideos(){ const files = await pickFiles('video/*', true); if(files.length) addVideos(files, viewCenter()); }
const VIDEO_MAX = 80 * 1024 * 1024;
function fmtDur(s){ s = Math.round(s); return Math.floor(s/60) + ':' + String(s%60).padStart(2,'0'); }
function videoSize(url){
  return new Promise(res=>{ const v = document.createElement('video'); v.preload = 'metadata'; v.muted = true;
    v.onloadedmetadata = () => res({w:v.videoWidth||16, h:v.videoHeight||9}); v.onerror = () => res({w:16, h:9}); v.src = url; setTimeout(()=>res({w:16,h:9}), 4000); });
}
/* Videos einbetten (bis 80 MB – größere Dateien besser verknüpfen, damit Projektdateien schlank bleiben) */
async function addVideos(files, at){
  const b = activeBoard(), base = at || mouseWorld(), added = [];
  for(const f of files){
    if(!f || !f.type || !f.type.startsWith('video/')) continue;
    if(f.size > VIDEO_MAX){ toast(t('bd.videoTooBig', {name:f.name, mb:Math.round(f.size/1048576)}), true); continue; }
    const src = await readFile(f), ref = addAsset(src);
    const s = await videoSize(mediaURL(ref)), w = 360, h = Math.round(w * s.h / s.w) + 44;
    b.nodes.push({id:uid('vid'), type:'video', x:Math.round(base.x - w/2 + added.length*28), y:Math.round(base.y - h/2 + added.length*28), w, h, src:ref, path:'', title:(f.name||'').replace(/\.[^.]+$/,'').slice(0,60), color:''});
    added.push(b.nodes[b.nodes.length-1].id);
  }
  if(added.length){ ui.sel = new Set(added); ui.active = added[added.length-1]; changed(); renderNodes(); renderInspector(); toast(t('bd.videoAdded', {n:added.length})); }
}
/* Dateien verknüpfen statt einbetten: Bilder, Videos, .blend, .ztl … – Vorschau für Bilder/Videos in der Desktop-App */
async function linkFiles(at, given){
  let paths = given || [];
  if(!paths.length){
    if(IS_DESKTOP){ const p = await nativeAsync('vfPickPath'); if(p) paths = [p]; }
    else { const p = await askText(t('bd.linkPathQ'), ''); if(p && p.trim()) paths = [p.trim().replace(/^"|"$/g,'')]; }
  }
  if(!paths.length) return;
  const b = activeBoard(), base = at || viewCenter(), added = [];
  for(const p of paths){
    const kind = fileKind(p), w = kind==='other' ? 240 : 320, h = kind==='other' ? 210 : 280;
    const n = {id:uid('fil'), type:'file', x:Math.round(base.x - w/2 + added.length*28), y:Math.round(base.y - h/2 + added.length*28), w, h, path:p, title:basename(p).replace(/\.[^.]+$/,'').slice(0,60), color:''};
    if(kind==='video' && localFileURL(p)){ n.type = 'video'; n.src = ''; const s = await videoSize(localFileURL(p)); n.w = 360; n.h = Math.round(360 * s.h / s.w) + 44; }
    b.nodes.push(n); added.push(n.id);
  }
  ui.sel = new Set(added); ui.active = added[added.length-1]; changed(); renderNodes(); renderInspector();
  toast(t('bd.linked', {n:added.length}));
}
async function fileAction(n, act){
  if(act==='fcopy'){ (await copyText(n.path)) ? toast(t('lk.copied')) : toast(t('lk.copyFail'), true); return; }
  try{ if(act==='fopen'){ await window.vfOpenPath(n.path); toast(t('lk.opened')); } else await window.vfRevealPath(n.path); }
  catch(e){ toast(t('lk.missing') + ': ' + n.path, true); }
}
/* Großansicht (Doppelklick auf Bild/Video) – Esc oder Klick schließt */
function openLightbox(n){
  if(!n) return;
  const src = n.type==='image' ? assetSrc(n.src) : n.type==='video' ? (n.src ? mediaURL(n.src) : localFileURL(n.path)) : localFileURL(n.path);
  const kind = n.type==='image' ? 'image' : n.type==='video' ? 'video' : fileKind(n.path);
  if(!src || kind==='other'){ if(n.type==='file' && IS_DESKTOP) fileAction(n, 'fopen'); return; }
  const lb = document.createElement('div'); lb.className = 'lightbox';
  lb.innerHTML = `<div class="lb-stage">${kind==='video' ? `<video src="${esc(src)}" controls autoplay playsinline></video>` : `<img src="${esc(src)}" alt="">`}</div><div class="lb-cap">${esc(n.title || basename(n.path||''))}<span>Esc</span></div>`;
  document.body.appendChild(lb); requestAnimationFrame(()=>lb.classList.add('open'));
  const close = () => { lb.classList.remove('open'); document.removeEventListener('keydown', kd, true); setTimeout(()=>lb.remove(), 200); };
  const kd = e => { if(e.key==='Escape'){ e.stopImmediatePropagation(); e.preventDefault(); close(); } };
  document.addEventListener('keydown', kd, true);
  lb.addEventListener('click', e=>{ if(!e.target.closest('video')) close(); });
}
function editNode(id){
  const n = nodeById(id); if(!n) return;
  if(n.type==='text'){ ui.editing = id; updateNodeEl(n); const ta = nodeEl(id) && nodeEl(id).querySelector('.n-textedit'); if(ta){ ta.focus(); ta.select(); } return; }
  const el = nodeEl(id); if(!el) return;
  const f = el.querySelector(n.type==='note' ? '.n-note' : n.type==='image' ? '.n-caption' : '.n-title'); if(f){ f.focus(); f.select && f.select(); }
}

/* ---------- Auswahl-Operationen ---------- */
function selectAll(){ const b = activeBoard(); ui.sel = new Set(b.nodes.map(n=>n.id)); ui.active = b.nodes.length ? b.nodes[b.nodes.length-1].id : null; refreshSel(); }
function invertSel(){ const b = activeBoard(); ui.sel = new Set(b.nodes.filter(n=>!ui.sel.has(n.id)).map(n=>n.id)); ui.active = [...ui.sel].pop() || null; refreshSel(); }
function deleteNodes(ids){
  const b = activeBoard(), set = new Set(ids);
  if(!set.size) return;
  b.nodes.forEach(n=>{ if(n.parent && set.has(n.parent) && !set.has(n.id)) undock(n); });
  b.nodes = b.nodes.filter(n=>!set.has(n.id));
  b.connections = b.connections.filter(c=>!set.has(c.from) && !set.has(c.to));
  ids.forEach(id=>ui.sel.delete(id)); if(set.has(ui.active)) ui.active = null;
  if(ui.editing && set.has(ui.editing)) ui.editing = null;
  changed(); renderNodes(); renderInspector();
}
function deleteSelection(){
  if(ui.selConn){ const b = activeBoard(); b.connections = b.connections.filter(c=>c.id!==ui.selConn); ui.selConn = null; changed(); renderWires(); return; }
  if(ui.sel.size) deleteNodes([...ui.sel]);
}
/* Kopieren/Duplizieren: angedockte Kinder ausgewählter Karten wandern mit */
function collectClip(ids){
  const b = activeBoard(), set = new Set(ids);
  b.nodes.forEach(n=>{ if(n.parent && set.has(n.parent)) set.add(n.id); });
  return {nodes:b.nodes.filter(n=>set.has(n.id)).map(n=>JSON.parse(JSON.stringify(n))), connections:b.connections.filter(c=>set.has(c.from) && set.has(c.to)).map(c=>({...c}))};
}
function pasteClip(clip, at, offset){
  const b = activeBoard(), map = {};
  clip.nodes.forEach(n=>{ map[n.id] = uid('nd'); });
  const minX = Math.min(...clip.nodes.map(n=>n.x)), minY = Math.min(...clip.nodes.map(n=>n.y));
  const dx = at ? at.x - minX : (offset||0), dy = at ? at.y - minY : (offset||0);
  const added = clip.nodes.map(n=>{
    const c = JSON.parse(JSON.stringify(n)); c.id = map[n.id]; c.x = Math.round(n.x + dx); c.y = Math.round(n.y + dy);
    if(c.parent){ if(map[c.parent]) c.parent = map[c.parent]; else { delete c.parent; delete c.dock; delete c.order; } }
    return c;
  });
  b.nodes.push(...added);
  clip.connections.forEach(c=>b.connections.push({id:uid('cn'), from:map[c.from], to:map[c.to], label:c.label}));
  ui.sel = new Set(added.filter(n=>!n.parent).map(n=>n.id)); ui.active = added.length ? added[0].id : null;
  changed(); renderNodes(); renderInspector();
  return added;
}
function copySel(){ if(!ui.sel.size) return; ui.clip = collectClip([...ui.sel]); toast(t('bd.copied',{n:ui.clip.nodes.length})); }
function duplicateSel(grab){
  if(!ui.sel.size) return;
  pasteClip(collectClip([...ui.sel]), null, grab ? 0 : 30);
  if(grab) startGrab(); else toast(t('ts.dup'));
}
function attachToActive(){
  const a = nodeById(ui.active);
  const kids = [...ui.sel].map(nodeById).filter(n=>n && n.id!==ui.active && DOCK_TYPES.has(n.type));
  if(!a || !DOCK_TARGETS.has(a.type) || !kids.length){ toast(t('bd.attachHint')); return; }
  kids.forEach(n=>{ undock(n); dockNode(n, a.id, 'bottom', 999); });
  changed(); renderNodes(); toast(t('bd.docked',{name:nodeName(a)}));
}
function detachSel(){
  const list = [...ui.sel].map(nodeById).filter(n=>n && n.parent);
  if(!list.length) return;
  list.forEach(n=>{ undock(n); n.x += 24; n.y += 24; });
  changed(); renderNodes(); toast(t('bd.detached'));
}
function orderSel(front){
  const b = activeBoard(), ids = ui.sel;
  if(!ids.size) return;
  const moving = b.nodes.filter(n=>ids.has(n.id)), rest = b.nodes.filter(n=>!ids.has(n.id));
  b.nodes = front ? [...rest, ...moving] : [...moving, ...rest];
  changed(); renderNodes();
}
function alignSel(mode){
  const list = [...ui.sel].map(nodeById).filter(n=>n && !n.parent); if(list.length < 2) return;
  const R = list.map(n=>({n, r:nodeRect(n)}));
  if(mode==='left'){ const x = Math.min(...R.map(o=>o.r.x)); R.forEach(o=>o.n.x = x); }
  if(mode==='top'){ const y = Math.min(...R.map(o=>o.r.y)); R.forEach(o=>o.n.y = y); }
  if(mode==='distH'){ R.sort((a,b)=>a.r.x-b.r.x); const total = R.reduce((s,o)=>s+o.r.w,0), span = R[R.length-1].r.x + R[R.length-1].r.w - R[0].r.x, gap = (span-total)/(R.length-1); let x = R[0].r.x; R.forEach(o=>{ o.n.x = Math.round(x); x += o.r.w + gap; }); }
  if(mode==='distV'){ R.sort((a,b)=>a.r.y-b.r.y); const total = R.reduce((s,o)=>s+o.r.h,0), span = R[R.length-1].r.y + R[R.length-1].r.h - R[0].r.y, gap = (span-total)/(R.length-1); let y = R[0].r.y; R.forEach(o=>{ o.n.y = Math.round(y); y += o.r.h + gap; }); }
  changed(); renderNodes();
}

/* ---------- Verbindungen ---------- */
function anchors(a, b){
  const ac = {x:a.x+a.w/2, y:a.y+a.h/2}, bc = {x:b.x+b.w/2, y:b.y+b.h/2};
  if(b.x >= a.x+a.w-10) return [{x:a.x+a.w, y:ac.y, dx:1, dy:0}, {x:b.x, y:bc.y, dx:-1, dy:0}];
  if(b.x+b.w <= a.x+10) return [{x:a.x, y:ac.y, dx:-1, dy:0}, {x:b.x+b.w, y:bc.y, dx:1, dy:0}];
  if(bc.y > ac.y) return [{x:ac.x, y:a.y+a.h, dx:0, dy:1}, {x:bc.x, y:b.y, dx:0, dy:-1}];
  return [{x:ac.x, y:a.y, dx:0, dy:-1}, {x:bc.x, y:b.y+b.h, dx:0, dy:1}];
}
function bezier(p, q){
  const d = Math.max(40, Math.hypot(q.x-p.x, q.y-p.y)*.42);
  const c1 = {x:p.x+p.dx*d, y:p.y+p.dy*d}, c2 = {x:q.x+(q.dx||0)*d, y:q.y+(q.dy||0)*d};
  return {d:`M${p.x},${p.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${q.x},${q.y}`, mid:{x:(p.x+3*c1.x+3*c2.x+q.x)/8, y:(p.y+3*c1.y+3*c2.y+q.y)/8}, p, c1, c2, q};
}
function bezAt(g, t0){ const m = 1-t0; return {x:m*m*m*g.p.x + 3*m*m*t0*g.c1.x + 3*m*t0*t0*g.c2.x + t0*t0*t0*g.q.x, y:m*m*m*g.p.y + 3*m*m*t0*g.c1.y + 3*m*t0*t0*g.c2.y + t0*t0*t0*g.q.y}; }
/* Griff-Position: ~26 px entlang der Kurve vom Ende entfernt – so bleibt der Port frei
   und man kann aus demselben Knoten beliebig viele weitere Kabel ziehen. */
function wireHandle(g, side){
  const end = side==='to' ? g.q : g.p; let t0 = side==='to' ? 1 : 0, pt = end;
  for(let i = 1; i <= 40; i++){ const tt = side==='to' ? 1 - i/80 : i/80; pt = bezAt(g, tt); t0 = tt; if(Math.hypot(pt.x-end.x, pt.y-end.y) >= 26) break; }
  return pt;
}
function wireGeo(c, by){
  const A = by[c.from], B = by[c.to]; if(!A || !B) return null;
  const [p,q] = anchors(A,B); return bezier(p,q);
}
function renderWires(){
  const b = activeBoard(), by = Object.fromEntries(b.nodes.map(n=>[n.id, nodeRect(n)]));
  let paths = '', labels = ''; CV.geo = {};
  b.connections.forEach(c=>{
    const bz = wireGeo(c, by); if(!bz) return; CV.geo[c.id] = bz;
    const sel = ui.selConn===c.id, hid = CV.drag && CV.drag.type==='rewire' && CV.drag.id===c.id;
 const flow = ui.sel.has(c.from) || ui.sel.has(c.to);
    paths += `<path class="wire${sel?' sel':''}${hid?' hidden':''}${flow?' flow':''}" data-w="${c.id}" d="${bz.d}" marker-end="url(#vfArrow)"/><path class="wire-hit" data-conn="${c.id}" d="${bz.d}"/>`;
    labels += `<div class="wire-label ${sel?'sel':''} ${c.label?'':'empty'}" data-conn="${c.id}" style="left:${bz.mid.x}px;top:${bz.mid.y}px"><span class="wl-text" data-act="label">${esc(c.label || t('bd.addLabel'))}</span><button data-act="cdel" title="${esc(t('g.delete'))}">${ic('x',11)}</button></div>`
      + `<div class="wire-end ${sel?'sel':''}" data-end="${c.id}" data-side="to" style="left:${(bz.hq=wireHandle(bz,'to')).x}px;top:${bz.hq.y}px" title="${esc(t('k.rewire'))}"></div>`
      + `<div class="wire-end ${sel?'sel':''}" data-end="${c.id}" data-side="from" style="left:${(bz.hp=wireHandle(bz,'from')).x}px;top:${bz.hp.y}px" title="${esc(t('k.rewire'))}"></div>`;
  });
  $('wires').innerHTML = `<defs><marker id="vfArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="arrow-head" d="M0,0 L10,5 L0,10 z"/></marker></defs>${paths}<path id="tempWire" class="wire-temp" d=""/><polyline id="cutLine" class="cut-line" points=""/>`;
  $('wireLabels').innerHTML = labels;
}
/* Schnelles Aktualisieren beim Ziehen: nur Koordinaten, kein Neuaufbau */
function updateWires(){
  const b = activeBoard(), by = Object.fromEntries(b.nodes.map(n=>[n.id, nodeRect(n)]));
  const W = $('wires'), Lb = $('wireLabels');
  if(W.querySelectorAll('[data-w]').length !== b.connections.length) return renderWires();
  b.connections.forEach(c=>{
    const bz = wireGeo(c, by); if(!bz) return; CV.geo[c.id] = bz;
    W.querySelectorAll(`[data-w="${c.id}"],[data-conn="${c.id}"]`).forEach(p=>p.setAttribute('d', bz.d));
    const lab = Lb.querySelector(`.wire-label[data-conn="${c.id}"]`); if(lab){ lab.style.left = bz.mid.x+'px'; lab.style.top = bz.mid.y+'px'; }
    Lb.querySelectorAll(`[data-end="${c.id}"]`).forEach(h=>{ const pt = wireHandle(bz, h.dataset.side); h.style.left = pt.x+'px'; h.style.top = pt.y+'px'; });
  });
}
/* Schnitt (Strg + Rechts-Ziehen, wie Blender): Schnittpunkt Linie/Bezier */
function segHit(a,b,c,d){
  const den = (b.x-a.x)*(d.y-c.y) - (b.y-a.y)*(d.x-c.x); if(!den) return false;
  const u = ((c.x-a.x)*(d.y-c.y) - (c.y-a.y)*(d.x-c.x)) / den, v = ((c.x-a.x)*(b.y-a.y) - (c.y-a.y)*(b.x-a.x)) / den;
  return u>=0 && u<=1 && v>=0 && v<=1;
}
function bezPoints(g){
  const out = []; for(let i = 0; i <= 24; i++){ const t0 = i/24, m = 1-t0;
    out.push({x:m*m*m*g.p.x + 3*m*m*t0*g.c1.x + 3*m*t0*t0*g.c2.x + t0*t0*t0*g.q.x, y:m*m*m*g.p.y + 3*m*m*t0*g.c1.y + 3*m*t0*t0*g.c2.y + t0*t0*t0*g.q.y}); }
  return out;
}
function cutWires(line){
  const b = activeBoard(), hit = new Set();
  b.connections.forEach(c=>{ const g = CV.geo[c.id]; if(!g) return; const pts = bezPoints(g);
    for(let i = 1; i < line.length && !hit.has(c.id); i++) for(let j = 1; j < pts.length; j++) if(segHit(line[i-1], line[i], pts[j-1], pts[j])){ hit.add(c.id); break; } });
  if(hit.size){ b.connections = b.connections.filter(c=>!hit.has(c.id)); changed(); toast(t('bd.cut',{n:hit.size})); }
  renderWires();
}
/* Wo landet ein Kabel? Knoten unter dem Mauszeiger (mit Hervorhebung) */
function wireTargetAt(x, y, exclude){
  const el = document.elementFromPoint(x, y), tg = el && el.closest && el.closest('.node');
  const id = tg && tg.dataset.id !== exclude ? tg.dataset.id : null;
  document.querySelectorAll('.node.wire-target').forEach(n=>{ if(n.dataset.id!==id) n.classList.remove('wire-target'); });
  if(id) nodeEl(id).classList.add('wire-target');
  return id;
}
function tempWire(fromRect, toPt, targetId, reverse){
  let p = {x:fromRect.x+fromRect.w, y:fromRect.y+fromRect.h/2, dx:1, dy:0}, q = {x:toPt.x, y:toPt.y, dx:0, dy:0};
  if(targetId){ const [a,b2] = anchors(fromRect, nodeRect(nodeById(targetId))); p = a; q = b2; }
  if(reverse){ const tmp = p; p = q; q = tmp; }
  const tw = $('tempWire'); if(tw) tw.setAttribute('d', bezier(p, q).d);
}
async function labelConn(id){ const c = activeBoard().connections.find(x=>x.id===id); if(!c) return; const v = await askText(t('bd.labelConn'), c.label); if(v!==null){ c.label = v.trim(); changed(); renderWires(); } }
function reverseConn(id){ const c = activeBoard().connections.find(x=>x.id===id); if(!c) return; [c.from, c.to] = [c.to, c.from]; changed(); renderWires(); }
function deleteConn(id){ const b = activeBoard(); b.connections = b.connections.filter(c=>c.id!==id); ui.selConn = null; changed(); renderWires(); }

/* ---------- Inspector (Eigenschaften, Taste N) ---------- */
function renderInspector(){
  const el = $('nodeInspector');
  if(S.activeModule!=='board') return;
  const list = [...ui.sel].map(nodeById).filter(Boolean);
  if(ui.inspHidden || !list.length){ el.classList.remove('open'); el.innerHTML = ''; return; }
  const n = list.length===1 ? list[0] : null;
  const actions = `<div class="insp-actions">
    <button class="btn btn-xs" data-ia="front">${ic('front',13)} ${t('insp.front')}</button><button class="btn btn-xs" data-ia="back">${ic('back',13)} ${t('insp.back')}</button>
    <button class="btn btn-xs" data-ia="dup">${ic('copy',13)} ${t('act.duplicate')}</button><button class="btn btn-xs" data-ia="del" style="color:var(--danger)">${ic('trash',13)} ${t('g.delete')}</button></div>`;
  let h = '';
  if(!n){
    h = `<div class="insp-head"><span>${t('insp.multi')} · ${t('g.selected',{n:list.length})}</span><button class="icon-btn sm" data-ia="close">${ic('x',13)}</button></div>
      <div class="insp-actions"><button class="btn btn-xs" data-ia="alignL">${t('insp.alignL')}</button><button class="btn btn-xs" data-ia="alignT">${t('insp.alignT')}</button><button class="btn btn-xs" data-ia="distH">${t('insp.distH')}</button><button class="btn btn-xs" data-ia="distV">${t('insp.distV')}</button></div>
      ${list.some(x=>DOCK_TYPES.has(x.type)) && nodeById(ui.active) && DOCK_TARGETS.has(nodeById(ui.active).type) ? `<button class="btn btn-xs" data-ia="attach">${ic('pin',13)} ${t('bd.attach')} (Ctrl+P)</button>` : ''}
      ${actions}`;
  }else{
    h = `<div class="insp-head"><span>${t(NODE_LABEL[n.type])}</span><button class="icon-btn sm" data-ia="close" title="N">${ic('x',13)}</button></div>`;
    if(n.parent) h += `<div class="insp-info">${ic('pin',14)}<span class="grow">${esc(t('insp.docked',{name:nodeName(nodeById(n.parent))}))}</span><button class="btn btn-xs" data-ia="detach">${ic('unlink',13)} Alt+P</button></div>`;
    if(n.type==='text'){
      h += `<button class="btn btn-xs" data-ia="edit">${ic('edit',13)} ${t('insp.editText')} (Tab)</button><div class="subhead"><span>${t('insp.style')}</span></div>${styleEditorHTML(n.st, {presets:true, sizeMin:6, sizeMax:300})}`;
    }else if(n.type==='note'){
      const cols = ['', '#e8d9a8','#d9e3b4','#c9dde6','#e6c9c9','#d9cde6','#2f2a20'];
      h += `<div class="f"><span class="f-l">${t('insp.paper')}</span><div class="swatches">${cols.map(c=>`<button class="swatch ${n.color===c?'active':''}" data-ncol="${c}" style="background:${c||'var(--note)'}"></button>`).join('')}</div></div>`;
    }else if(n.type==='char'){
      h += charInspectorHTML(n);
    }else if(n.type!=='image'){
      const cols = ['', '#cfa75c','#7fb6a5','#5cc4d3','#cc7461','#9b7fc8','#8fa3b8','#9bb07a','#c07a4f'];
      h += `<div class="f"><span class="f-l">${t('insp.accent')}</span><div class="swatches">${cols.map(c=>`<button class="swatch ${n.color===c?'active':''}" data-ncol="${c}" style="background:${c||'var(--accent)'}"></button>`).join('')}</div></div>`;
      if(n.type==='card') h += `<label class="f"><span class="f-l">${t('stg.label')}</span><select class="sel" data-nf="stage">${Array.from({length:STAGES},(_,s)=>`<option value="${s}" ${s===n.stage?'selected':''}>${s+1} · ${t('stg.'+s)}</option>`).join('')}</select></label>`;
      const kids = childCount(n.id); if(kids) h += `<div class="insp-info">${ic('link',14)} ${kids} × ${t('bd.images')} / ${t('bd.text')}</div>`;
    }
    h += actions;
  }
  const scroll = el.scrollTop;
  el.innerHTML = h; el.classList.add('open'); el.scrollTop = scroll;
}
function initInspector(){
  const el = $('nodeInspector');
  el.addEventListener('pointerdown', e=>e.stopPropagation());
  const handle = e => {
    const list = [...ui.sel].map(nodeById).filter(Boolean), n = list.length===1 ? list[0] : null;
    if(e.type==='click'){
      const ia = e.target.closest('[data-ia]');
      if(ia){
        const a = ia.dataset.ia;
        const acts = {close:()=>{ ui.inspHidden = true; renderBoard(); }, front:()=>orderSel(true), back:()=>orderSel(false), dup:()=>duplicateSel(false), del:deleteSelection,
          alignL:()=>alignSel('left'), alignT:()=>alignSel('top'), distH:()=>alignSel('distH'), distV:()=>alignSel('distV'), attach:attachToActive, detach:detachSel, edit:()=>n && editNode(n.id)};
        acts[a] && acts[a](); return;
      }
      const c = e.target.closest('[data-ncol]'); if(c && n){ n.color = c.dataset.ncol; changed(); updateNodeEl(n); renderInspector(); return; }
    }
    if(n && n.type==='char' && charInspectorEvent(n, e)) return;
    if(n && n.type==='text'){
      const r = applyStyleEvent(n.st, e);
      if(r){ if(r!=='fonts') { changed(); updateNodeEl(n); } if(r==='all') renderInspector(); }
      return;
    }
    if(n && e.target.dataset.nf==='stage' && e.type==='change'){ n.stage = +e.target.value; changed(); updateNodeEl(n); }
  };
  el.addEventListener('click', handle); el.addEventListener('input', handle); el.addEventListener('change', e=>{ if(e.target.dataset.sk==='font' || e.target.dataset.sk==='fx' || e.target.dataset.nf) handle(e); });
}

/* ---------- Kontextmenüs ---------- */
function addMenuItems(at){
  return [
    {label:t('bd.node'), icon:'node', run:()=>addNode('mindmap', at)},
    {label:t('bd.card'), icon:'card', run:()=>addNode('card', at)},
    {label:t('bd.char'), icon:'cards', run:()=>addNode('char', at)},
    {label:t('bd.note'), icon:'note', run:()=>addNode('note', at)},
    {label:t('bd.text'), icon:'type', run:()=>addNode('text', at)},
    {label:t('bd.media'), icon:'image', run:()=>pickBoardMedia(at)},
    {label:t('bd.linkFile'), icon:'link', run:()=>linkFiles(at)}
  ];
}
function openCtxMenu(ctx, x, y){
  const at = toWorld(x, y);
  if(ctx.kind==='node'){
    const n = nodeById(ctx.id); if(!n) return;
    if(!ui.sel.has(n.id)){ ui.sel = new Set([n.id]); }
    ui.active = n.id; refreshSel();
    const cols = (n.type==='note' ? ['#e8d9a8','#d9e3b4','#c9dde6','#e6c9c9','#d9cde6'] : ['#cfa75c','#7fb6a5','#5cc4d3','#cc7461','#9b7fc8','#8fa3b8']).map(c=>({color:c, run:()=>{ [...ui.sel].map(nodeById).forEach(m=>{ if(m && m.type!=='text' && m.type!=='image') m.color = c; }); changed(); renderNodes(); }}));
    const items = [
      {label:n.type==='text' ? t('insp.editText') : t('k.rename'), icon:'edit', kbd:'Tab', run:()=>editNode(n.id)},
      {label:t('act.duplicate'), icon:'copy', kbd:'Shift+D', run:()=>duplicateSel(true)},
      {label:t('bd.copy'), icon:'copy', kbd:'Ctrl+C', run:copySel}
    ];
    if(n.parent) items.push({label:t('insp.detach'), icon:'unlink', kbd:'Alt+P', run:detachSel});
    if(ui.sel.size > 1 && DOCK_TARGETS.has(n.type)) items.push({label:t('bd.attach'), icon:'pin', kbd:'Ctrl+P', run:attachToActive});
    items.push({sep:1}, {label:t('insp.front'), icon:'front', kbd:'PgUp', run:()=>orderSel(true)}, {label:t('insp.back'), icon:'back', kbd:'PgDn', run:()=>orderSel(false)});
    if(n.type!=='text' && n.type!=='image') items.push({swatches:cols});
    items.push({sep:1}, {label:t('g.delete'), icon:'trash', kbd:'X', danger:true, run:deleteSelection});
    openMenu(x, y, items, nodeName(n));
  }else if(ctx.kind==='conn'){
    ui.selConn = ctx.id; renderWires();
    openMenu(x, y, [{label:t('bd.labelConn'), icon:'edit', run:()=>labelConn(ctx.id)}, {label:t('bd.reverse'), icon:'swap', run:()=>reverseConn(ctx.id)}, {sep:1}, {label:t('g.delete'), icon:'trash', danger:true, run:()=>deleteConn(ctx.id)}]);
  }else{
    openMenu(x, y, [...addMenuItems(at), {sep:1},
      {label:t('bd.paste'), icon:'copy', kbd:'Ctrl+V', disabled:!ui.clip, run:()=>ui.clip && pasteClip(ui.clip, at)},
      {label:t('bd.selectAll'), icon:'check', kbd:'A', run:selectAll},
      {label:t('bd.fit'), icon:'fit', kbd:'Home', run:()=>fitBoard()}], t('bd.add'));
  }
}

/* ---------- Modale Transformation: G (Grab) & S (Scale) wie in Blender ---------- */
function movableItems(clickedId){
  let sel = [...ui.sel].map(nodeById).filter(Boolean);
  if(sel.length > 1){ sel = sel.filter(n=>!n.parent); if(!sel.length && clickedId) sel = [nodeById(clickedId)]; }
  return sel.map(n=>({n, x:n.x, y:n.y, parent:n.parent, dock:n.dock, order:n.order}));
}
/* Laufende Maus-Aktion abbrechen (Rechtsklick oder Esc, wie in Blender) */
function cancelDrag(){
  const d = CV.drag; if(!d) return false;
  CV.drag = null; CV.lastMove = null; thawSizes(); showDockBar(null);
  document.querySelectorAll('.node.lifting').forEach(n=>n.classList.remove('lifting'));
  $('viewport').classList.remove('panning'); $('boxSel').style.display = 'none';
  document.querySelectorAll('.node.wire-target').forEach(n=>n.classList.remove('wire-target'));
  if(d.type==='move'){
    d.items.forEach(it=>{ it.n.x = it.x; it.n.y = it.y; if(it.parent){ it.n.parent = it.parent; it.n.dock = it.dock; it.n.order = it.order; } });
    renderNodes();
  }else if(d.type==='resize'){
    const n = d.n; if(n.st) n.st.size = d.size; else { n.w = d.ow; n.h = d.oh; }
    updateNodeEl(n);
  }else if(d.type==='box'){ ui.sel = d.base; refreshSel(); }
  else if(d.type==='pan'){ const c = activeBoard().cam; c.x = d.x; c.y = d.y; applyCam(); }
  else renderWires();
  CV.noCtx = true;
  return true;
}
function xfHint(text){ const h = $('xfHint'); h.textContent = text || ''; h.classList.toggle('on', !!text); }
function startGrab(){
  const items = movableItems(ui.active); if(!items.length) return;
  ui.xf = {type:'grab', items, sx:ui.mouse.x, sy:ui.mouse.y, axis:null, dockable:items.length===1 && DOCK_TYPES.has(items[0].n.type)};
  $('viewport').classList.add('xf'); blurFields(); xfHint('G · ' + t('bd.grabHint'));
}
function startScale(){
  const list = [...ui.sel].map(nodeById).filter(Boolean); if(!list.length) return;
  const R = list.map(nodeRect), minX = Math.min(...R.map(r=>r.x)), minY = Math.min(...R.map(r=>r.y)), maxX = Math.max(...R.map(r=>r.x+r.w)), maxY = Math.max(...R.map(r=>r.y+r.h));
  const pivot = {x:(minX+maxX)/2, y:(minY+maxY)/2}, cam = activeBoard().cam, vr = $('viewport').getBoundingClientRect();
  const ps = {x:vr.left + cam.x + pivot.x*cam.z, y:vr.top + cam.y + pivot.y*cam.z};
  ui.xf = {type:'scale', pivot, ps, d0:Math.max(12, Math.hypot(ui.mouse.x-ps.x, ui.mouse.y-ps.y)), items:list.map((n,i)=>({n, x:n.x, y:n.y, w:R[i].w, h:R[i].h, size:n.st ? n.st.size : 0, ow:n.w, oh:n.h}))};
  $('viewport').classList.add('xf'); blurFields(); xfHint('S · ' + t('bd.scaleHint'));
}
function moveItems(d, cx, cy, e){
  const z = activeBoard().cam.z;
  let dx = (cx-d.sx)/z, dy = (cy-d.sy)/z;
  if(d.axis==='x') dy = 0; if(d.axis==='y') dx = 0;
  d.items.forEach(it=>{ it.n.x = Math.round(it.x + dx); it.n.y = Math.round(it.y + dy); const el = nodeEl(it.n.id); if(el){ el.style.left = it.n.x+'px'; el.style.top = it.n.y+'px'; } });
  if(d.dockable && e) dockDragUpdate(d, e);
  layoutDocks({except:d.dockable ? d.items[0].n.id : null}); updateWires();
}
function updateXf(e){
  const d = ui.xf; if(!d) return;
  if(d.type==='grab'){ moveItems(d, e.clientX, e.clientY, e); return; }
  const f = clamp(Math.hypot(e.clientX-d.ps.x, e.clientY-d.ps.y) / d.d0, .05, 20);
  d.items.forEach(it=>{
    const n = it.n, el = nodeEl(n.id);
    n.x = Math.round(d.pivot.x + (it.x - d.pivot.x)*f); n.y = Math.round(d.pivot.y + (it.y - d.pivot.y)*f);
    if(n.type==='text'){ n.st.size = clamp(Math.round(it.size*f*10)/10, 6, 400); const s = el && el.querySelector('.stx, .n-textedit'); if(s) s.style.fontSize = n.st.size + 'px'; }
    else { n.w = Math.max(80, Math.round(it.w*f)); n.h = Math.max(50, Math.round((MEDIA_TYPES.has(n.type) ? it.oh : it.h)*f)); if(el){ el.style.width = n.w+'px'; el.style[(n.type==='card'||n.type==='mindmap')?'minHeight':'height'] = n.h+'px'; } }
    if(el){ el.style.left = n.x+'px'; el.style.top = n.y+'px'; }
  });
  layoutDocks(); renderWires();
}
function confirmXf(){
  const d = ui.xf; if(!d) return;
  ui.xf = null; $('viewport').classList.remove('xf'); xfHint('');
  if(d.dockable) dockFinish(d);
  changed(); layoutDocks(); renderWires(); renderInspector();
}
function cancelXf(){
  const d = ui.xf; if(!d) return;
  ui.xf = null; $('viewport').classList.remove('xf'); xfHint(''); showDockBar(null);
  d.items.forEach(it=>{ it.n.x = it.x; it.n.y = it.y; if(d.type==='scale'){ if(it.n.st) it.n.st.size = it.size; else { it.n.w = it.ow; it.n.h = it.oh; } } });
  renderNodes();
}

/* ---------- Software-Verknüpfungen (Karten & Welt-Bibel) ---------- */
function shortPath(p){ const parts = String(p).split(/[\\/]/).filter(Boolean); return parts.length > 2 ? '…/' + parts.slice(-2).join('/') : p; }
function linksHTML(links, kind, id){
  const opts = `<option value="auto">${t('lk.auto')}</option>` + swKeys().map(k=>`<option value="${k}">${esc(swInfo(k).name)}</option>`).join('') + `<option value="folder">${t('lk.folder')}</option>`;
  const primary = IS_DESKTOP ? t('lk.open') : t('lk.copy');
  return `<div class="sw-links">${links.map((l,i)=>`<div class="sw-link">
      ${swBadge(l.sw, `data-path-check="${esc(l.path)}" onclick="linkAct('${kind}','${id}',${i},'primary')" title="${esc(primary + ': ' + l.path)}"`, ui.exists[l.path]===false ? 'missing' : '')}
      <span class="sw-path" onclick="linkAct('${kind}','${id}',${i},'copy')" title="${esc(l.path)}">${esc(shortPath(l.path))}</span>
      ${IS_DESKTOP ? `<button class="icon-btn sm" onclick="linkAct('${kind}','${id}',${i},'reveal')" title="${esc(t('lk.reveal'))}">${ic('folder',13)}</button>` : ''}
      <button class="icon-btn sm" onclick="linkAct('${kind}','${id}',${i},'copy')" title="${esc(t('lk.copy'))}">${ic('copy',13)}</button>
      <button class="icon-btn sm danger" onclick="linkAct('${kind}','${id}',${i},'remove')" title="${esc(t('lk.remove'))}">${ic('x',13)}</button></div>`).join('')}
    <div class="sw-add"><select class="sel" id="sws_${kind}_${id}" title="Software">${opts}</select>
      <input class="inp" id="swp_${kind}_${id}" placeholder="${esc(t('lk.path'))}" onkeydown="if(event.key==='Enter')addLink('${kind}','${id}')">
      ${IS_DESKTOP ? `<button class="btn btn-xs" onclick="browseLink('${kind}','${id}')" title="${esc(t('lk.browse'))}">${ic('folder',13)}</button>` : '<span></span>'}
      <button class="btn btn-xs" onclick="addLink('${kind}','${id}')" title="${esc(t('lk.add'))}">${ic('plus',13)}</button></div></div>`;
}
function linkOwner(kind, id){ return kind==='node' ? nodeById(id) : activeProject().lore.find(l=>l.id===id); }
function rerenderLinks(kind, id){ if(kind==='node'){ const n = nodeById(id); if(n) updateNodeEl(n); } else { renderLoreInspector(); renderStoryLists(); } }
function addLink(kind, id, pathArg){
  const o = linkOwner(kind, id), inp = $(`swp_${kind}_${id}`), sel = $(`sws_${kind}_${id}`);
  if(!o) return;
  const path = String(pathArg || (inp && inp.value) || '').trim().replace(/^"(.*)"$/,'$1'); if(!path) return;
  const sw = !sel || sel.value==='auto' ? detectSoftware(path) : sel.value;
  o.links = o.links || []; o.links.push({sw, path});
  changed(); rerenderLinks(kind, id); toast(t('lk.linked',{sw:swInfo(sw).name}));
}
async function browseLink(kind, id){ try{ const p = await nativeAsync('vfPickPath'); if(p) addLink(kind, id, p); }catch(e){} }
async function linkAct(kind, id, i, act){
  const o = linkOwner(kind, id), l = o && o.links && o.links[i]; if(!l) return;
  if(act==='primary') act = IS_DESKTOP ? 'open' : 'copy';
  if(act==='copy'){ (await copyText(l.path)) ? toast(t('lk.copied')) : toast(t('lk.copyFail'), true); }
  if(act==='open'){ try{ await window.vfOpenPath(l.path); toast(t('lk.opened')); }catch(e){ toast(t('lk.missing') + ': ' + l.path, true); } }
  if(act==='reveal'){ try{ await window.vfRevealPath(l.path); }catch(e){ toast(t('lk.missing'), true); } }
  if(act==='remove'){ o.links.splice(i,1); changed(); rerenderLinks(kind, id); }
}

/* ---------- Eingabe: Maus, Stift, Touch, Rad, Drop, Einfügen, Tastatur ---------- */
function initBoard(){
  const vp = $('viewport'), nodes = $('nodes');
  vp.addEventListener('contextmenu', e=>{ if(!isTyping(e.target)) e.preventDefault(); });
  window.addEventListener('contextmenu', e=>{ if(CV.noCtx && S && S.activeModule==='board'){ e.preventDefault(); } });
  initInspector();

  const startPan = (e, ctx) => {
    const cam = activeBoard().cam; CV.target = null;
    CV.drag = {type:'pan', sx:e.clientX, sy:e.clientY, x:cam.x, y:cam.y, moved:false, ctx};
    vp.classList.add('panning'); try{ vp.setPointerCapture(e.pointerId); }catch(_){}
  };
  const nodeDown = (e, el) => {
    const id = el.dataset.id, n = nodeById(id); if(!n) return;
    const actEl = e.target.closest('[data-act]'), act = actEl && actEl.dataset.act;
    const editable = !act && e.target.closest('input,textarea,select,button,.sw-link,.sw-add,.stage-row');
    if(act==='del'){ deleteNodes([id]); return; }
    if(act==='fopen' || act==='freveal' || act==='fcopy'){ e.preventDefault(); fileAction(n, act); return; }
    if(act==='flip'){ e.preventDefault(); e.stopPropagation(); flipCard(id); return; }
    const sb = e.target.closest('[data-stat]'); if(sb && n.type==='char'){ e.preventDefault(); ui.sel = new Set([id]); ui.active = id; refreshSel(); setCardStat(n, +sb.dataset.stat, e, sb); return; }
    let toggledOff = false;
    if(e.shiftKey){ if(ui.sel.has(id) && ui.active===id){ ui.sel.delete(id); ui.active = [...ui.sel].pop() || null; toggledOff = true; } else { ui.sel.add(id); ui.active = id; } }
    else if(!ui.sel.has(id)){ ui.sel = new Set([id]); ui.active = id; }
    else ui.active = id;
    ui.selConn = null; refreshSel();
    if(editable || toggledOff) return;
    e.preventDefault(); blurFields();
    if(ui.editing && ui.editing!==id){ const prev = nodeById(ui.editing); ui.editing = null; if(prev) updateNodeEl(prev); }
    if(act==='wire'){ freezeSizes(); CV.drag = {type:'wire', from:id}; try{ vp.setPointerCapture(e.pointerId); }catch(_){} return; }
    if(act==='resize'){ CV.drag = {type:'resize', n, sx:e.clientX, sy:e.clientY, w:el.offsetWidth, h:el.offsetHeight, ow:n.w, oh:n.h, size:n.st ? n.st.size : 0, moved:false}; try{ vp.setPointerCapture(e.pointerId); }catch(_){} return; }
    const items = movableItems(id);
    freezeSizes();
    CV.drag = {type:'move', id, shift:e.shiftKey, sx:e.clientX, sy:e.clientY, moved:false, items, dockable:items.length===1 && DOCK_TYPES.has(items[0].n.type)};
    try{ vp.setPointerCapture(e.pointerId); }catch(_){}
  };

  vp.addEventListener('pointerdown', e=>{
    if(e.target.closest('.node-inspector,.zoom-hud')) return;
    ui.mouse = {x:e.clientX, y:e.clientY};
    if(ui.xf){ e.preventDefault(); e.button===0 ? confirmXf() : cancelXf(); CV.noCtx = e.button===2; return; }
    if(CV.drag && e.button===2){ e.preventDefault(); cancelDrag(); return; }
    closeMenu();
    CV.noCtx = false;
    CV.pointers.set(e.pointerId, {x:e.clientX, y:e.clientY});
    if(CV.pointers.size===2){
      const [a,b] = [...CV.pointers.values()], cam = activeBoard().cam, r = vp.getBoundingClientRect();
      const mid = {x:(a.x+b.x)/2 - r.left, y:(a.y+b.y)/2 - r.top};
      CV.pinch = {d0:Math.hypot(a.x-b.x, a.y-b.y) || 1, z0:cam.z, wx:(mid.x-cam.x)/cam.z, wy:(mid.y-cam.y)/cam.z};
      CV.drag = null; return;
    }
    const nEl = e.target.closest('.node'), hit = e.target.closest('.wire-hit');
    if(e.button===2 && (e.ctrlKey || e.metaKey)){
      e.preventDefault(); const w = toWorld(e.clientX, e.clientY);
      CV.drag = {type:'cut', pts:[w], moved:false}; try{ vp.setPointerCapture(e.pointerId); }catch(_){} return;
    }
    if(e.button===1 || e.button===2 || CV.space || (e.pointerType==='touch' && !nEl && !hit)){
      if(e.button===1) e.preventDefault();
      startPan(e, e.button===2 ? (nEl ? {kind:'node', id:nEl.dataset.id} : hit ? {kind:'conn', id:hit.dataset.conn} : {kind:'bg'}) : null);
      return;
    }
    if(hit){ ui.selConn = hit.dataset.conn; ui.sel = new Set(); ui.active = null; refreshSel(); return; }
    if(nEl){ nodeDown(e, nEl); return; }
    blurFields(); vp.focus({preventScroll:true});
    if(ui.editing){ const prev = nodeById(ui.editing); ui.editing = null; if(prev) updateNodeEl(prev); }
    if(S.settings.leftDrag==='select' && e.pointerType!=='touch'){
      CV.drag = {type:'box', sx:e.clientX, sy:e.clientY, moved:false, add:e.shiftKey, sub:e.ctrlKey || e.metaKey, base:new Set(ui.sel)};
      try{ vp.setPointerCapture(e.pointerId); }catch(_){}
    }else{ if(!e.shiftKey) clearSel(); startPan(e, null); }
  });

  window.addEventListener('pointermove', e=>{
    ui.mouse = {x:e.clientX, y:e.clientY};
    if(CV.pointers.has(e.pointerId)) CV.pointers.set(e.pointerId, {x:e.clientX, y:e.clientY});
    if(!S || S.activeModule!=='board') return;
    /* Rechte Taste während einer Links-Aktion gedrückt → abbrechen (Blender) */
    if(e.button===2 && CV.drag && CV.drag.type!=='pan' && CV.drag.type!=='cut'){ cancelDrag(); return; }
    CV.lastMove = e;
    if(!CV.moveRaf) CV.moveRaf = requestAnimationFrame(()=>{ CV.moveRaf = 0; const ev = CV.lastMove; CV.lastMove = null; if(ev) handleMove(ev); });
  });
  const handleMove = e => {
    if(ui.xf){ updateXf(e); return; }
    const cam = activeBoard().cam;
    if(CV.pinch && CV.pointers.size >= 2){
      const [a,b] = [...CV.pointers.values()], r = vp.getBoundingClientRect();
      const z = clamp(CV.pinch.z0 * Math.hypot(a.x-b.x, a.y-b.y) / CV.pinch.d0, .08, 4);
      const mid = {x:(a.x+b.x)/2 - r.left, y:(a.y+b.y)/2 - r.top};
      Object.assign(cam, {z, x:mid.x - CV.pinch.wx*z, y:mid.y - CV.pinch.wy*z}); applyCam(); return;
    }
    const d = CV.drag; if(!d) return;
    if(d.type==='pan'){
      if(!d.moved && Math.hypot(e.clientX-d.sx, e.clientY-d.sy) < 4) return;
      d.moved = true; cam.x = d.x + (e.clientX-d.sx); cam.y = d.y + (e.clientY-d.sy); applyCam();
    }else if(d.type==='move'){
      if(!d.moved){ if(Math.hypot(e.clientX-d.sx, e.clientY-d.sy) < 3) return; d.moved = true; d.items.forEach(it=>{ const el = nodeEl(it.n.id); if(el) el.classList.add('lifting'); }); }
      moveItems(d, e.clientX, e.clientY, e);
    }else if(d.type==='resize'){
      const n = d.n, el = nodeEl(n.id); d.moved = true;
      const dx = (e.clientX-d.sx)/cam.z, dy = (e.clientY-d.sy)/cam.z;
      if(n.type==='text'){ n.st.size = clamp(Math.round(d.size * (d.w+dx)/d.w * 10)/10, 6, 400); const s = el && el.querySelector('.stx, .n-textedit'); if(s) s.style.fontSize = n.st.size+'px'; }
      else if(n.type==='image' || n.type==='video'){ const ar = (d.h-44)/d.w; n.w = Math.max(80, Math.round(d.w+dx)); n.h = Math.round(n.w*ar) + 44; el.style.width = n.w+'px'; el.style.height = n.h+'px'; }
      else { n.w = Math.max(150, Math.round(d.w+dx)); n.h = Math.max(70, Math.round(d.h+dy)); el.style.width = n.w+'px'; el.style[(n.type==='card'||n.type==='mindmap')?'minHeight':'height'] = n.h+'px'; }
      layoutDocks(); updateWires();
    }else if(d.type==='wire'){
      const n = nodeById(d.from); if(!n) return;
      d.target = wireTargetAt(e.clientX, e.clientY, d.from);
      tempWire(nodeRect(n), toWorld(e.clientX, e.clientY), d.target, false);
    }else if(d.type==='rewire'){
      const fixed = nodeById(d.fixed); if(!fixed) return;
      d.moved = true;
      d.target = wireTargetAt(e.clientX, e.clientY, d.fixed);
      tempWire(nodeRect(fixed), toWorld(e.clientX, e.clientY), d.target, d.side==='from');
    }else if(d.type==='cut'){
      d.moved = true; d.pts.push(toWorld(e.clientX, e.clientY));
      const cl = $('cutLine'); if(cl) cl.setAttribute('points', d.pts.map(p=>`${p.x},${p.y}`).join(' '));
    }else if(d.type==='box'){
      if(!d.moved && Math.hypot(e.clientX-d.sx, e.clientY-d.sy) < 4) return;
      d.moved = true;
      const r = vp.getBoundingClientRect(), x1 = Math.min(d.sx, e.clientX), y1 = Math.min(d.sy, e.clientY), x2 = Math.max(d.sx, e.clientX), y2 = Math.max(d.sy, e.clientY);
      Object.assign($('boxSel').style, {display:'block', left:(x1-r.left)+'px', top:(y1-r.top)+'px', width:(x2-x1)+'px', height:(y2-y1)+'px'});
      const a = toWorld(x1, y1), b = toWorld(x2, y2), hits = activeBoard().nodes.filter(n=>{ const R = nodeRect(n); return R.x < b.x && R.x+R.w > a.x && R.y < b.y && R.y+R.h > a.y; }).map(n=>n.id);
      const sel = new Set(d.add || d.sub ? d.base : []);
      hits.forEach(id=>d.sub ? sel.delete(id) : sel.add(id));
      ui.sel = sel; ui.active = hits.length ? hits[hits.length-1] : ui.active;
      $('nodes').querySelectorAll('.node').forEach(el=>{ el.classList.toggle('selected', sel.has(el.dataset.id)); el.classList.toggle('active', ui.active===el.dataset.id); });
    }
  };

  const end = e => {
    CV.pointers.delete(e.pointerId);
    if(CV.pointers.size < 2) CV.pinch = null;
    const d = CV.drag; if(!d) return;
    if(CV.lastMove){ const ev = CV.lastMove; CV.lastMove = null; handleMove(ev); }
    CV.drag = null; vp.classList.remove('panning'); thawSizes();
    document.querySelectorAll('.node.lifting').forEach(n=>n.classList.remove('lifting'));
    document.querySelectorAll('.node.wire-target').forEach(n=>n.classList.remove('wire-target'));
    if(d.type==='pan'){ if(d.moved) persistSoon(); else if(d.ctx && !CV.noCtx) openCtxMenu(d.ctx, e.clientX, e.clientY); }
    else if(d.type==='cut'){ if(d.moved && d.pts.length > 1) cutWires(d.pts); else renderWires(); }
    else if(d.type==='rewire'){
      const b = activeBoard(), c = b.connections.find(x=>x.id===d.id);
      if(c){
        if(d.target){
          const other = d.side==='to' ? c.from : c.to;
          const dup = b.connections.some(x=>x!==c && (d.side==='to' ? (x.from===other && x.to===d.target) : (x.from===d.target && x.to===other)));
          if(dup) b.connections = b.connections.filter(x=>x!==c); else c[d.side] = d.target;
        }else if(d.moved){ b.connections = b.connections.filter(x=>x!==c); toast(t('bd.connRemoved')); }
        if(d.moved) changed();
      }
      renderWires();
    }
    else if(d.type==='move'){
      if(d.moved){ if(d.dockable) dockFinish(d); changed(); layoutDocks(); renderWires(); }
      else if(!d.shift && ui.sel.size > 1){ ui.sel = new Set([d.id]); ui.active = d.id; refreshSel(); }
    }
    else if(d.type==='resize'){ if(d.moved){ changed(); updateNodeEl(d.n); } }
    else if(d.type==='wire'){
      const b = activeBoard(), tg = d.target;
      if(tg && tg!==d.from && !b.connections.some(c=>c.from===d.from && c.to===tg)){ b.connections.push({id:uid('cn'), from:d.from, to:tg, label:''}); changed(); }
      renderWires();
    }
    else if(d.type==='box'){ $('boxSel').style.display = 'none'; if(!d.moved && !d.add) clearSel(); else refreshSel(); }
  };
  window.addEventListener('pointerup', end);
  window.addEventListener('pointercancel', end);

  /* Feldänderungen in Knoten */
  nodes.addEventListener('input', e=>{
    const f = e.target.dataset.field; if(!f) return;
    const n = nodeById(e.target.closest('.node').dataset.id); if(!n) return;
    n[f] = e.target.value; changed();
    if(n.type!=='image'){ layoutDocks(); renderWires(); }
  });
  nodes.addEventListener('click', e=>{
    const st = e.target.closest('[data-stage]'); if(!st) return;
    const n = nodeById(st.closest('.node').dataset.id); if(!n) return;
    n.stage = +st.dataset.stage; changed(); updateNodeEl(n); renderInspector();
  });
  vp.addEventListener('dblclick', e=>{
    // Zeiger ist beim Ziehen „eingefangen“ – darum das Element unter der Maus selbst bestimmen
    const tg = document.elementFromPoint(e.clientX, e.clientY) || e.target;
    if(isTyping(tg)) return;
    const m = tg.closest('.node-img'); if(m){ const id = m.closest('.node').dataset.id; openLightbox(nodeById(id)); return; }
    const el = tg.closest('.node-text'); if(el) editNode(el.dataset.id);
  });
  // Videos spielen beim Überfahren lautlos an (Vorschau wie in PureRef/Cargo)
  nodes.addEventListener('pointerover', e=>{ const v = e.target.closest('.node-vid, .file-prev') && e.target.closest('.node').querySelector('video'); if(v && v.paused){ v.play().catch(()=>{}); } });
  nodes.addEventListener('pointerout', e=>{ const box = e.target.closest('.node'); if(!box || box.contains(e.relatedTarget)) return; const v = box.querySelector('video'); if(v && !v.paused){ v.pause(); } });
  nodes.addEventListener('loadedmetadata', e=>{ const v = e.target; if(v.tagName!=='VIDEO') return; const d = v.closest('.node') && v.closest('.node').querySelector('.vid-dur'); if(d && isFinite(v.duration)) d.textContent = fmtDur(v.duration); }, true);
  nodes.addEventListener('focusout', e=>{
    if(!e.target.classList.contains('n-textedit')) return;
    const n = nodeById(ui.editing); ui.editing = null;
    setTimeout(()=>{ if(n && !ui.editing) updateNodeEl(n); }, 0);
  });
  $('wireLabels').addEventListener('pointerdown', e=>{
    const end = e.target.closest('[data-end]');
    if(end && e.button===0){
      e.stopPropagation(); e.preventDefault();
      const c = activeBoard().connections.find(x=>x.id===end.dataset.end); if(!c) return;
      const side = end.dataset.side;
      freezeSizes();
      CV.drag = {type:'rewire', id:c.id, side, fixed:side==='to' ? c.from : c.to, moved:false};
      ui.selConn = c.id; renderWires();
      try{ vp.setPointerCapture(e.pointerId); }catch(_){}
      return;
    }
    if(end) return;
    const lab = e.target.closest('.wire-label'); if(!lab) return;
    e.stopPropagation();
    const id = lab.dataset.conn, act = e.target.closest('[data-act]') && e.target.closest('[data-act]').dataset.act;
    if(act==='cdel') deleteConn(id); else if(act==='label') labelConn(id);
  });

  /* Mausrad: Zoom zum Cursor · Strg+Rad horizontal · Shift+Rad vertikal (Blender) · Trackpad-Pinch = Zoom */
  vp.addEventListener('wheel', e=>{
    if(e.target.closest('.node-inspector')) return;
    const pinchy = e.ctrlKey && Math.abs(e.deltaY) < 50 && !Number.isInteger(e.deltaY);
    if((e.ctrlKey || e.metaKey) && !pinchy) return;      // Strg+Rad = UI-Zoom (global bzw. Browser)
    e.preventDefault();
    const r = vp.getBoundingClientRect(), unit = e.deltaMode===1 ? 16 : e.deltaMode===2 ? 400 : 1;
    const dy = e.deltaY*unit, dx = e.deltaX*unit;
    const pinch = e.ctrlKey && Math.abs(dy) < 50 && !Number.isInteger(e.deltaY);
    if(pinch){ zoomNow(Math.exp(-dy*.01), e.clientX-r.left, e.clientY-r.top); return; }
    if(e.ctrlKey || e.metaKey) return;                     // Strg+Rad = UI-Zoom (global)
    if(e.shiftKey){ panBy(0, -(dy || dx)); return; }
    if(e.altKey){ panBy(-(dy || dx), 0); return; }
    if(Math.abs(dx) > 0 && Math.abs(dx) >= Math.abs(dy)){ panBy(-dx, -dy); return; }
    zoomNow(Math.exp(-clamp(dy,-250,250)*.0016), e.clientX-r.left, e.clientY-r.top);
  }, {passive:false});

  /* Bilder: Drag & Drop und Strg+V; interne Elemente: Strg+C/Strg+V */
  vp.addEventListener('dragover', e=>{ if([...e.dataTransfer.types].includes('Files')){ e.preventDefault(); vp.classList.add('drop'); } });
  vp.addEventListener('dragleave', ()=>vp.classList.remove('drop'));
  vp.addEventListener('drop', e=>{
    e.preventDefault(); vp.classList.remove('drop');
    const all = [...e.dataTransfer.files], at = toWorld(e.clientX, e.clientY);
    const onCard = e.target.closest && e.target.closest('.node-char'), cimg = all.find(x=>x.type.startsWith('image/'));
    if(onCard && cimg && all.length===1){ dropCardImage(onCard.dataset.id, cimg); return; }
    const img = all.filter(x=>x.type.startsWith('image/')), vid = all.filter(x=>x.type.startsWith('video/'));
    if(img.length) addImages(img, at);
    if(vid.length) addVideos(vid, img.length ? {x:at.x + 40, y:at.y + 40} : at);
  });
  window.addEventListener('paste', e=>{
    if(!S || S.activeModule!=='board' || isTyping(e.target)) return;
    const files = [...(e.clipboardData && e.clipboardData.items || [])].filter(i=>i.type.startsWith('image/')).map(i=>i.getAsFile()).filter(Boolean);
    if(files.length){ e.preventDefault(); addImages(files, mouseWorld()); return; }
    // Eingefügter Dateipfad (z. B. „Als Pfad kopieren“ im Explorer) → Datei verknüpfen
    const txt = (e.clipboardData && e.clipboardData.getData('text/plain') || '').trim();
    const paths = txt.split(/\r?\n/).map(x=>x.trim().replace(/^"|"$/g,'')).filter(x=>/^([a-zA-Z]:[\\/]|\\\\)[^<>|?*]+\.[\w]{1,8}$/.test(x));
    if(paths.length){ e.preventDefault(); linkFiles(mouseWorld(), paths.slice(0,20)); return; }
    if(ui.clip){ e.preventDefault(); pasteClip(ui.clip, mouseWorld()); }
  });
  window.addEventListener('keyup', e=>{ if(e.code==='Space'){ CV.space = false; vp.classList.remove('space'); } });
  window.addEventListener('resize', ()=>{ if(S && S.activeModule==='board') renderWires(); });
  if(document.fonts) document.fonts.addEventListener('loadingdone', ()=>{ if(S && S.activeModule==='board'){ layoutDocks(); renderWires(); } });
}

MOD_KEYS.board = (e, ctrl, k) => {
  if(ui.xf){
    if(k==='x' || k==='y'){ if(ui.xf.type==='grab'){ ui.xf.axis = ui.xf.axis===k ? null : k; xfHint(`G · ${ui.xf.axis ? ui.xf.axis.toUpperCase() + ' · ' : ''}${t('bd.grabHint')}`); updateXf({clientX:ui.mouse.x, clientY:ui.mouse.y}); } return true; }
    if(e.key==='Enter'){ confirmXf(); return true; }
    if(e.key==='Escape'){ cancelXf(); return true; }
    return true;
  }
  if(CV.drag && e.key==='Escape'){ cancelDrag(); return true; }
  const alt = e.altKey, shift = e.shiftKey, code = e.code;
  if(e.code==='Space'){ CV.space = true; $('viewport').classList.add('space'); return true; }
  if(shift && !ctrl && code==='KeyA'){ const m = ui.mouse, at = mouseWorld(); openMenu(m.x, m.y, addMenuItems(at), t('bd.add')); return true; }
  if(alt && code==='KeyA'){ clearSel(); return true; }
  if(alt && code==='KeyP'){ detachSel(); return true; }
  if(ctrl && k==='a'){ selectAll(); return true; }
  if(ctrl && k==='i'){ invertSel(); return true; }
  if(ctrl && k==='c'){ copySel(); return false; }
  if(ctrl && k==='p'){ attachToActive(); return true; }
  if(ctrl || alt) return false;
  if(shift && k==='d'){ duplicateSel(true); return true; }
  if(k==='a'){ selectAll(); return true; }
  if(k==='g'){ startGrab(); return true; }
  if(k==='s'){ startScale(); return true; }
  if(k==='x' || e.key==='Delete' || e.key==='Backspace'){ deleteSelection(); return true; }
  if(e.key==='Tab'){ if(ui.active) editNode(ui.active); return true; }
  if(e.key==='F2'){ if(ui.active) editNode(ui.active); else renameBoard(ui.boardId); return true; }
  if(e.key==='Home'){ fitBoard(); return true; }
  if(code==='NumpadDecimal' || k==='f'){ fitBoard(true); return true; }
  if(e.key==='+' || code==='NumpadAdd' || e.key==='='){ zoomStep(1.2); return true; }
  if(e.key==='-' || code==='NumpadSubtract'){ zoomStep(1/1.2); return true; }
  if(e.key==='PageUp'){ orderSel(true); return true; }
  if(e.key==='PageDown'){ orderSel(false); return true; }
  if(k==='n'){ toggleInspector(); return true; }
  if(k==='t'){ toggleBoardSide(); return true; }
  if(e.key==='Escape'){ clearSel(); return true; }
  return false;
};
