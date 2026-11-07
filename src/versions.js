/* ============================================================================
   VERSIONEN — lokale Sicherungspunkte (wie Papyrus-Backups / Blender „Save Versions“)
   · automatisch alle 10 Minuten, wenn sich etwas geändert hat
   · bei jedem Speichern in eine Projektdatei
   · vor dem Öffnen einer Datei und vor dem Wiederherstellen (Sicherheitsnetz)
   · manuell mit Namen (Strg+Alt+S)
   Bilder liegen einmalig in der Bild-Ablage; Versionen speichern nur Verweise.
   ============================================================================ */
const VER_AUTO_EVERY = 10 * 60 * 1000, VER_AUTO_KEEP = 30, VER_SAFETY_KEEP = 10;
const VER_ICON = {manual:'flag', file:'save', auto:'clock', safety:'history'};

function verAll(){
  return new Promise(res=>{
    const out = [];
    if(!db || !db.objectStoreNames.contains('versions')) return res(out);
    try{
      const cur = db.transaction('versions','readonly').objectStore('versions').openCursor();
      cur.onsuccess = e => { const c = e.target.result; if(c){ out.push(c.value); c.continue(); } else res(out.sort((a,b)=>b.at-a.at)); };
      cur.onerror = () => res(out);
    }catch(e){ res(out); }
  });
}
const verPut = v => idbReq('versions', 'readwrite', st=>st.put(v, v.id));
const verDel = id => idbReq('versions', 'readwrite', st=>st.delete(id));
const verGet = id => idbReq('versions', 'readonly', st=>st.get(id));

function verStats(projects){
  let tasks = 0, nodes = 0;
  projects.forEach(p=>{ (p.phases||[]).forEach(ph=>tasks += (ph.tasks||[]).length); (p.boards||[]).forEach(b=>nodes += (b.nodes||[]).length); });
  return {projects:projects.length, tasks, nodes};
}
/* Neue Version anlegen. Gibt die Version zurück (oder null, wenn nichts zu tun war). */
async function makeVersion(kind, label){
  if(!db || !db.objectStoreNames.contains('versions')) return null;
  const data = JSON.stringify({p:S.projects, a:S.activeProjectId});
  if(kind==='auto' && data===ui.lastVerData) return null;
  if(saveTimer) await saveNow();                      // Bilder sicher in der Ablage
  const p = activeProject();
  const v = {id:uid('ver'), at:Date.now(), kind, label:label || '', data, size:data.length, refs:[...collectRefs(S.projects)],
    stats:verStats(S.projects), project:p ? projectName(p) : '', pinned:kind==='manual', app:APP_VERSION};
  await verPut(v);
  ui.lastVerData = data; ui.lastVerAt = v.at;
  // Aufräumen: nur automatische und Sicherheits-Versionen werden rotiert
  const all = await verAll();
  const prune = (k, keep) => all.filter(x=>x.kind===k && !x.pinned).slice(keep).forEach(x=>verDel(x.id));
  prune('auto', VER_AUTO_KEEP); prune('safety', VER_SAFETY_KEEP);
  if(ui.verOpen) renderVersions();
  return v;
}
async function saveVersionPrompt(){
  const all = await verAll();
  const n = all.filter(v=>v.kind==='manual').length + 1;
  const name = await askText(t('ver.saveTitle'), t('ver.defaultName', {n}));
  if(name===null || name===undefined) return;
  const v = await makeVersion('manual', String(name).trim() || t('ver.defaultName', {n}));
  if(v) toast(t('ver.saved', {name:v.label}));
}
/* Automatische Version, wenn seit 10 Min. keine angelegt wurde und sich etwas geändert hat */
function verTick(){
  if(!S || document.hidden) return;
  if(Date.now() - (ui.lastVerAt||0) < VER_AUTO_EVERY) return;
  makeVersion('auto');
}
async function verInit(){
  const all = await verAll();
  if(all.length){ ui.lastVerAt = all[0].at; ui.lastVerData = all[0].data; }
  else ui.lastVerAt = Date.now() - VER_AUTO_EVERY + 60000;   // erste Auto-Version nach ~1 Min. Arbeit
  setInterval(verTick, 60000);
}
async function verRefs(){
  const refs = new Set();
  (await verAll()).forEach(v=>(v.refs||[]).forEach(r=>refs.add(r)));
  return refs;
}

/* ---------- Wiederherstellen / Kopie / Export ---------- */
function verParse(v){
  const o = JSON.parse(v.data);
  return normalizeSuite({projects:o.p, activeProjectId:o.a, assets:S.assets}, S.settings);
}
async function restoreVersion(id){
  const v = await verGet(id); if(!v) return;
  const ok = await dialog({title:t('ver.restoreQ'), text:t('ver.restoreText', {name:verLabel(v), date:verDate(v.at)}), buttons:[{label:t('g.cancel'), value:false},{label:t('ver.restore'), value:true, primary:true}]});
  if(!ok) return;
  await makeVersion('safety', t('ver.beforeRestore'));
  histCommit();
  const inc = verParse(v);
  S.projects = inc.projects; S.activeProjectId = inc.activeProjectId; Object.assign(S.assets, inc.assets);
  Object.assign(ui, {boardId:null, sel:new Set(), active:null, selConn:null, chapterId:null, loreId:null});
  changed(); render(); closeSheet();
  toast(t('ver.restored', {name:verLabel(v)}));
}
async function copyFromVersion(id){
  const v = await verGet(id); if(!v) return;
  const inc = verParse(v);
  const src = inc.projects.find(p=>p.id===inc.activeProjectId) || inc.projects[0]; if(!src) return;
  src.id = uid('proj');
  const d = new Date(v.at);
  src.cover.title.text = `${projectName(src)}\n(${d.toLocaleDateString(locale(), {day:'2-digit', month:'2-digit'})} ${d.toLocaleTimeString(locale(), {hour:'2-digit', minute:'2-digit'})})`;
  src.updatedAt = Date.now();
  Object.assign(S.assets, inc.assets);
  S.projects.push(src); S.activeProjectId = src.id;
  changed(); closeSheet(); go('projects');
  toast(t('ver.copied'));
}
async function exportVersion(id){
  const v = await verGet(id); if(!v) return;
  const inc = verParse(v);
  const d = new Date(v.at);
  exportProjects(inc.projects, `${safeName(v.project || 'VertexForge')}_${isoLocal(d)}_${pad(d.getHours())}${pad(d.getMinutes())}.vforge`, t('ts.backup'));
}
async function renameVersion(id){
  const v = await verGet(id); if(!v) return;
  const name = await askText(t('ver.rename'), verLabel(v)); if(name===null || name===undefined) return;
  v.label = String(name).trim(); v.pinned = true; await verPut(v); renderVersions();
}
async function togglePin(id){ const v = await verGet(id); if(!v) return; v.pinned = !v.pinned; await verPut(v); renderVersions(); }
async function deleteVersion(id){
  const v = await verGet(id); if(!v) return;
  if(!(await confirmDelete(t('ver.del'), t('g.delNamed', {name:verLabel(v)})))) return;
  await verDel(id); renderVersions(); gcAssets();
}

/* ---------- Versions-Browser ---------- */
function verLabel(v){ return v.label || t('ver.kind.' + v.kind); }
function verDate(at){ const d = new Date(at); return d.toLocaleDateString(locale(), {weekday:'short', day:'2-digit', month:'short'}) + ' · ' + d.toLocaleTimeString(locale(), {hour:'2-digit', minute:'2-digit'}); }
function verDay(at){
  const d = new Date(at), today = new Date(); today.setHours(0,0,0,0);
  const diff = Math.round((today - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 864e5);
  return diff===0 ? t('ver.today') : diff===1 ? t('ver.yesterday') : d.toLocaleDateString(locale(), {weekday:'long', day:'numeric', month:'long', year:'numeric'});
}
function fmtSize(n){ return n > 1e6 ? (n/1e6).toFixed(1) + ' MB' : Math.max(1, Math.round(n/1e3)) + ' KB'; }
function openVersions(){
  closeMenu();
  ui.verOpen = true;
  const sh = openSheet(`<div class="dlg-head"><div><h2>${t('ver.title')}</h2><p class="muted" style="margin-top:3px;font-size:12px">${t('ver.sub')}</p></div><button class="icon-btn" data-close>${ic('x',18)}</button></div>
    <div class="ver-bar"><button class="btn btn-primary" data-vact="new">${ic('flag',14)}<span>${t('ver.save')}</span><kbd>Ctrl+Alt+S</kbd></button>
      <div class="seg" id="verFilter">${['all','manual','file','auto'].map(k=>`<button data-vf="${k}" class="${(ui.verFilter||'all')===k?'active':''}">${t('ver.f.'+k)}</button>`).join('')}</div></div>
    <div class="dlg-body ver-list" id="verList"><div class="ver-empty">${ic('history',22)}</div></div>`, 'ver-sheet');
  ui.onSheetClose = () => { ui.verOpen = false; };
  sh.addEventListener('click', async e=>{
    if(e.target.closest('[data-close]')){ closeSheet(); return; }
    const f = e.target.closest('[data-vf]'); if(f){ ui.verFilter = f.dataset.vf; sh.querySelectorAll('[data-vf]').forEach(b=>b.classList.toggle('active', b===f)); renderVersions(); return; }
    const a = e.target.closest('[data-vact]'); if(!a) return;
    const id = a.closest('[data-ver]') && a.closest('[data-ver]').dataset.ver;
    const act = a.dataset.vact;
    if(act==='new') saveVersionPrompt();
    if(act==='restore') restoreVersion(id);
    if(act==='more'){
      const v = await verGet(id); if(!v) return; const r = a.getBoundingClientRect();
      openMenu(r.right - 220, r.bottom + 4, [
        {label:t('ver.copy'), icon:'copy', run:()=>copyFromVersion(id)},
        {label:t('ver.export'), icon:'download', run:()=>exportVersion(id)},
        {label:t('ver.rename'), icon:'edit', run:()=>renameVersion(id)},
        {label:v.pinned ? t('ver.unpin') : t('ver.pin'), icon:'pin', run:()=>togglePin(id)},
        {sep:1},
        {label:t('g.delete'), icon:'trash', danger:true, run:()=>deleteVersion(id)}]);
    }
  });
  sh.addEventListener('dblclick', e=>{ const r = e.target.closest('[data-ver]'); if(r) restoreVersion(r.dataset.ver); });
  renderVersions();
}
async function renderVersions(){
  const list = document.getElementById('verList'); if(!list) return;
  const f = ui.verFilter || 'all';
  const all = (await verAll()).filter(v=>f==='all' || v.kind===f || (f==='auto' && v.kind==='safety'));
  if(!all.length){ list.innerHTML = `<div class="ver-empty">${ic('history',26)}<b>${t('ver.empty')}</b><span>${t('ver.emptyText')}</span></div>`; return; }
  let html = '', day = '';
  all.forEach(v=>{
    const d = verDay(v.at);
    if(d!==day){ day = d; html += `<div class="ver-day">${esc(d)}</div>`; }
    const s = v.stats || {};
    html += `<div class="ver-row k-${v.kind}" data-ver="${v.id}" title="${esc(t('ver.dbl'))}">
      <span class="ver-ic">${ic(VER_ICON[v.kind]||'clock',15)}</span>
      <div class="ver-main"><div class="ver-name">${esc(verLabel(v))}${v.pinned && v.kind!=='manual' ? ` <span class="ver-pin">${ic('pin',11)}</span>` : ''}</div>
        <div class="ver-meta"><span class="mono">${new Date(v.at).toLocaleTimeString(locale(), {hour:'2-digit', minute:'2-digit'})}</span><span>${esc(v.project||'')}</span><span>${t('ver.stats', {p:s.projects||0, t:s.tasks||0, n:s.nodes||0})}</span><span class="mono">${fmtSize(v.size||0)}</span></div></div>
      <button class="btn btn-xs" data-vact="restore">${ic('undo',12)}<span>${t('ver.restore')}</span></button>
      <button class="icon-btn sm" data-vact="more" title="${esc(t('g.more'))}">${ic('dots',15)}</button>
    </div>`;
  });
  list.innerHTML = html;
}

/* ---------- Inkrementell speichern: name.vforge → name_v02.vforge ---------- */
function nextIncName(name){
  const m = String(name).match(/^(.*?)(?:[_\- ]v(\d+))?(\.vforge|\.json)?$/i);
  const base = m[1] || 'VertexForge', n = m[2] ? parseInt(m[2],10) + 1 : 2, w = m[2] ? Math.max(2, m[2].length) : 2;
  return `${base}_v${String(n).padStart(w,'0')}${m[3] || '.vforge'}`;
}
async function saveIncremental(){
  if(!S.file || !S.file.name){ saveFile(true); return; }
  const name = nextIncName(S.file.name);
  if(IS_DESKTOP && S.file.path){
    const dir = S.file.path.slice(0, S.file.path.length - S.file.name.length);
    let path = dir + name, guard = 0;
    try{ while(guard++ < 50){ const ex = await window.vfExists([path]); if(!ex || !ex[path]) break; path = dir + nextIncName(basename(path)); } }catch(e){}
    try{
      histCommit();
      await window.vfWriteFile(path, serialize());
      S.file = {name:basename(path), path}; ui.fileDirty = false; persistSoon(); renderSavePill(); updateTitle();
      makeVersion('file', basename(path));
      toast(t('ts.savedFile', {name:basename(path)}));
    }catch(e){ toast(t('ts.saveFail'), true); }
    return;
  }
  // Browser: neue Datei mit hochgezähltem Namen anlegen
  const r = await writeNewFile(serialize(), name);
  if(r){ S.file = {name:r.name, path:r.path||''}; if(r.handle) ui.fileHandle = r.handle; ui.fileDirty = false; persistSoon(); renderSavePill(); makeVersion('file', r.name); toast(t('ts.savedFile', {name:r.name})); }
}
