/* ============================================================================
   TEAM-ORDNER — gemeinsam an einem Projekt arbeiten, ohne Server und ohne Konto
   Das Projekt liegt als Ordner in einem geteilten Ordner (OneDrive, Dropbox,
   Google Drive, Nextcloud, Netzlaufwerk). Jede Aufgabe, Karte, jeder Shot … ist
   eine eigene kleine Datei. Beim Abgleich wird pro Element verglichen:
     nur ich geändert → schreiben · nur jemand anderes → übernehmen ·
     beide → meine Fassung gilt, die andere landet als Kopie in „conflicts/“.
   Bilder liegen einmalig unter „assets/“. „presence/“ zeigt, wer gerade arbeitet.
   ============================================================================ */
const TEAM_EXT = '.vforge-team';
const TEAM_MANIFEST = 'vforge-team.json';
const TEAM_INTERVAL = 5000;
const TEAM = {state:{}, timer:null, busy:false, clientId:'', handles:{}};

/* ---------- Dateizugriff: Desktop-App (Go) oder Browser (File System Access API) ---------- */
const TEAM_BROWSER = typeof window.showDirectoryPicker === 'function';
const TEAM_OK = IS_DESKTOP || TEAM_BROWSER;
const TFS = {
  async pick(){
    if(IS_DESKTOP){ const p = await nativeAsync('vfTeamPick'); return p ? {path:p, label:p.split(/[\\/]/).pop()} : null; }
    try{ const h = await window.showDirectoryPicker({mode:'readwrite', id:'vforge-team'}); return {handle:h, label:h.name}; }catch(e){ return null; }
  },
  async mkdir(loc, name){
    if(IS_DESKTOP){ const p = await window.vfTeamMkdir(loc.path, name); return {path:p, label:name}; }
    const h = await loc.handle.getDirectoryHandle(name, {create:true}); return {handle:h, label:name};
  },
  async dirFor(loc, parts, create){
    let h = loc.handle; for(const part of parts) h = await h.getDirectoryHandle(part, {create}); return h;
  },
  async scan(loc){
    if(IS_DESKTOP) return (await window.vfTeamScan(loc.path)) || [];
    const out = [];
    const walk = async (h, pre, depth) => {
      for await (const [name, e] of h.entries()){
        if(e.kind==='directory'){ if(depth < 3) await walk(e, pre + name + '/', depth + 1); }
        else if(!name.endsWith('.tmp') && !name.endsWith('.crswap')){ const f = await e.getFile(); out.push({rel:pre + name, mtime:f.lastModified, size:f.size}); }
      }
    };
    await walk(loc.handle, '', 0); return out;
  },
  async read(loc, rels){
    if(!rels.length) return {};
    if(IS_DESKTOP) return (await window.vfTeamRead(loc.path, rels)) || {};
    const out = {};
    for(const r of rels){
      try{ const parts = r.split('/'), name = parts.pop(), d = await TFS.dirFor(loc, parts, false); out[r] = await (await (await d.getFileHandle(name)).getFile()).text(); }catch(e){}
    }
    return out;
  },
  async write(loc, rel, content){
    if(IS_DESKTOP) return window.vfTeamWrite(loc.path, rel, content);
    const parts = rel.split('/'), name = parts.pop(), d = await TFS.dirFor(loc, parts, true);
    const w = await (await d.getFileHandle(name, {create:true})).createWritable(); await w.write(content); await w.close();
  },
  async remove(loc, rel){
    if(IS_DESKTOP) return window.vfTeamDelete(loc.path, rel);
    try{ const parts = rel.split('/'), name = parts.pop(), d = await TFS.dirFor(loc, parts, false); await d.removeEntry(name); }catch(e){}
  }
};

/* ---------- Gespeicherte Verknüpfung je Projekt (Browser-Ordnerzugriff liegt in IndexedDB) ---------- */
async function teamLoc(p){
  if(!p.team) return null;
  if(p.team.path) return {path:p.team.path, label:p.team.label};
  let h = TEAM.handles[p.id];
  if(!h){ h = await idbReq('suite', 'readonly', st=>st.get('teamh:' + p.id)); if(h) TEAM.handles[p.id] = h; }
  if(!h) return null;
  return {handle:h, label:p.team.label};
}
async function teamPermission(loc, ask){
  if(!loc || !loc.handle || !loc.handle.queryPermission) return !!loc;
  let s = await loc.handle.queryPermission({mode:'readwrite'});
  if(s!=='granted' && ask) s = await loc.handle.requestPermission({mode:'readwrite'});
  return s==='granted';
}
function teamClient(){
  if(TEAM.clientId) return TEAM.clientId;
  try{ TEAM.clientId = localStorage.getItem('vf-client') || ''; }catch(e){}
  if(!TEAM.clientId){ TEAM.clientId = uid('cl'); try{ localStorage.setItem('vf-client', TEAM.clientId); }catch(e){} }
  return TEAM.clientId;
}
const teamUser = () => S.settings.userName || t('tm.someone');

/* ---------- Projekt ⇄ Einzeldateien ---------- */
const recRel = key => 'records/' + key + '.json';
const relKey = rel => rel.startsWith('records/') && rel.endsWith('.json') ? rel.slice(8, -5) : null;
function teamRecords(p){
  const R = {}, put = (k, o) => { R[k] = JSON.stringify(o); };
  const {phases, boards, shots, chapters, lore, team, updatedAt, ...meta} = p;
  put('meta', Object.assign({}, meta, {phaseOrder:phases.map(x=>x.id), boardOrder:boards.map(b=>b.id), shotOrder:shots.map(s=>s.uid), chapterOrder:chapters.map(c=>c.id), loreOrder:lore.map(l=>l.id)}));
  phases.forEach(ph=>{ const {tasks, collapsed, ...r} = ph; put('ph/' + ph.id, Object.assign(r, {taskOrder:tasks.map(x=>x.id)})); tasks.forEach(x=>put('tk/' + x.id, Object.assign({}, x, {phase:ph.id}))); });
  boards.forEach(b=>{ const {nodes, connections, cam, ...r} = b; put('bd/' + b.id, Object.assign(r, {nodeOrder:nodes.map(n=>n.id)})); nodes.forEach(n=>put('nd/' + n.id, Object.assign({}, n, {board:b.id}))); connections.forEach(c=>put('cn/' + c.id, Object.assign({}, c, {board:b.id}))); });
  shots.forEach(s=>put('sh/' + s.uid, s)); chapters.forEach(c=>put('ch/' + c.id, c)); lore.forEach(l=>put('lr/' + l.id, l));
  return R;
}
function teamBuild(R, local){
  const all = pre => Object.keys(R).filter(k=>k.startsWith(pre)).map(k=>JSON.parse(R[k]));
  const order = (ids, items, idf) => { const m = new Map(items.map(x=>[idf(x), x])), out = []; (ids || []).forEach(id=>{ if(m.has(id)){ out.push(m.get(id)); m.delete(id); } }); return out.concat([...m.values()]); };
  const meta = R.meta ? JSON.parse(R.meta) : {};
  const tasks = all('tk/'), nodes = all('nd/'), conns = all('cn/');
  const phases = order(meta.phaseOrder, all('ph/'), x=>x.id).map(ph=>{
    const lp = local && local.phases.find(x=>x.id===ph.id);
    return Object.assign(ph, {collapsed:lp ? lp.collapsed : false, tasks:order(ph.taskOrder, tasks.filter(x=>x.phase===ph.id), x=>x.id)});
  });
  const orphanT = tasks.filter(x=>!phases.some(ph=>ph.id===x.phase));
  if(orphanT.length && phases.length) phases[phases.length-1].tasks.push(...orphanT);
  const boards = order(meta.boardOrder, all('bd/'), x=>x.id).map(b=>{
    const lb = local && local.boards.find(x=>x.id===b.id);
    return Object.assign(b, {cam:lb ? lb.cam : undefined, nodes:order(b.nodeOrder, nodes.filter(n=>n.board===b.id), n=>n.id), connections:conns.filter(c=>c.board===b.id)});
  });
  const p = Object.assign({}, meta, {phases, boards, shots:order(meta.shotOrder, all('sh/'), s=>s.uid), chapters:order(meta.chapterOrder, all('ch/'), c=>c.id), lore:order(meta.loreOrder, all('lr/'), l=>l.id)});
  const out = normalizeProject(p, assetCtx());
  out.id = local ? local.id : out.id; out.team = local ? local.team : null; out.updatedAt = Date.now();
  return out;
}
const recName = (key, json) => { try{ const d = JSON.parse(json); return d.title || d.text || d.name || d.code || d.cat || key; }catch(e){ return key; } };
const assetIds = s => [...String(s).matchAll(/"asset:([\w-]{1,40})"/g)].map(m=>m[1]);

/* ---------- Basisstand (zuletzt abgeglichen) — lokal gespeichert, damit Neustarts nichts verwechseln ---------- */
async function teamBase(pid){
  if(TEAM.state[pid]) return TEAM.state[pid];
  const saved = await idbReq('suite', 'readonly', st=>st.get('teamb:' + pid));
  TEAM.state[pid] = saved && saved.recs ? saved : {recs:{}, mtimes:{}, assets:{}};
  return TEAM.state[pid];
}
function teamSaveBase(pid){ const b = TEAM.state[pid]; if(b) idbReq('suite', 'readwrite', st=>st.put(b, 'teamb:' + pid)); }

/* ---------- Abgleich ---------- */
async function teamSync(p, opts={}){
  if(!p || !p.team) return;
  if(TEAM.busy){ TEAM.pending = true; return; }       // läuft gerade ein Abgleich: danach sofort noch einmal
  const loc = await teamLoc(p);
  if(!loc || !(await teamPermission(loc, !!opts.ask))){ teamStatus(p, 'locked'); return; }
  TEAM.busy = true;
  try{
    const base = await teamBase(p.id), me = teamUser(), now = Date.now();
    const files = await TFS.scan(loc);
    const fileMap = Object.fromEntries(files.map(f=>[f.rel, f]));
    if(!fileMap[TEAM_MANIFEST]){ teamStatus(p, 'missing'); return; }
    // Geänderte Dateien lesen (nur, was sich seit dem letzten Abgleich verändert hat)
    const recFiles = files.filter(f=>relKey(f.rel));
    const toRead = recFiles.filter(f=>base.mtimes[f.rel]!==f.mtime).map(f=>f.rel);
    const raw = await TFS.read(loc, toRead);
    const remote = {}, remoteBy = {};
    recFiles.forEach(f=>{
      const k = relKey(f.rel);
      if(raw[f.rel]!=null){ try{ const env = JSON.parse(raw[f.rel]); remote[k] = JSON.stringify(env.d); remoteBy[k] = env.by; }catch(e){ remote[k] = base.recs[k]; } }
      else remote[k] = base.recs[k];
    });
    const local = teamRecords(p);
    const keys = new Set([...Object.keys(local), ...Object.keys(remote), ...Object.keys(base.recs)]);
    const result = {}, writes = [], deletes = [], conflicts = [], incoming = [];
    for(const k of keys){
      const L = local[k], R = remote[k], B = base.recs[k];
      if(L===R){ if(L!==undefined) result[k] = L; continue; }
      if(L===B){ if(R!==undefined){ result[k] = R; incoming.push([k, remoteBy[k]]); } else incoming.push([k, '']); continue; }   // nur dort geändert
      if(R===B){ if(L!==undefined){ result[k] = L; writes.push(k); } else deletes.push(k); continue; }                           // nur hier geändert
      // beide geändert
      if(L===undefined){ result[k] = R; incoming.push([k, remoteBy[k]]); continue; }       // hier gelöscht, dort bearbeitet → behalten
      result[k] = L; writes.push(k);
      if(R!==undefined){ conflicts.push({k, by:remoteBy[k], data:R}); }
    }
    // Bilder: fehlende hochladen bzw. herunterladen
    const needAssets = new Set(Object.values(result).flatMap(assetIds));
    for(const id of needAssets){
      const rel = 'assets/' + id + '.txt';
      if(S.assets[id] && !fileMap[rel] && !base.assets[id]){ await TFS.write(loc, rel, S.assets[id]); base.assets[id] = 1; }
      else if(!S.assets[id] && fileMap[rel]){ const r = await TFS.read(loc, [rel]); if(r[rel] && isDataImg(r[rel])){ S.assets[id] = r[rel]; base.assets[id] = 1; } }
      else if(fileMap[rel]) base.assets[id] = 1;
    }
    // Direkt vor dem Schreiben: hat jemand die Datei seit eben verändert? Dann dessen Stand als Konflikt sichern.
    if(writes.length){
      const cur = await TFS.read(loc, writes.map(recRel));
      writes.forEach(k=>{ const raw = cur[recRel(k)]; if(raw==null) return; try{ const env = JSON.parse(raw), d = JSON.stringify(env.d); if(d!==base.recs[k] && d!==result[k] && d!==remote[k]) conflicts.push({k, by:env.by, data:d}); }catch(e){} });
    }
    for(const c of conflicts) await TFS.write(loc, `conflicts/${c.k.replace('/','-')}-${now}.json`, JSON.stringify({by:c.by, at:now, d:JSON.parse(c.data)}));
    for(const k of writes) await TFS.write(loc, recRel(k), JSON.stringify({by:me, at:now, d:JSON.parse(result[k])}));
    for(const k of deletes) await TFS.remove(loc, recRel(k));
    // Übernehmen
    if(incoming.length){
      const idx = S.projects.findIndex(x=>x.id===p.id);
      const merged = teamBuild(result, p);
      if(idx >= 0){ S.projects[idx] = merged; histCommit(); persistSoon(); if(S.activeProjectId===p.id) teamRerender(); }
      const names = [...new Set(incoming.map(([,by])=>by).filter(Boolean))];
      if(!opts.quiet) toast(names.length ? t('tm.updatedBy', {names:names.join(', '), n:incoming.length}) : t('tm.updated', {n:incoming.length}));
    }
    if(conflicts.length) toast(t('tm.conflict', {name:recName(conflicts[0].k, conflicts[0].data), by:conflicts[0].by || t('tm.someone')}), true);
    // Neuer Basisstand
    // Basis: Zeitstempel aus dem Scan *vor* dem Schreiben. Selbst geschriebene Dateien werden beim nächsten Mal
    // noch einmal gelesen – so kann eine zeitgleiche Änderung von jemand anderem nicht unbemerkt bleiben.
    const written = new Set(writes);
    base.recs = result; base.mtimes = {};
    Object.keys(result).forEach(k=>{ const r = recRel(k); if(!written.has(k) && fileMap[r]) base.mtimes[r] = fileMap[r].mtime; });
    teamSaveBase(p.id);
    await teamPresence(loc, files);
    TEAM.lastSync = Date.now(); teamStatus(p, 'ok');
  }catch(e){
    console.error('team sync', e); teamStatus(p, 'error');
  }finally{
    TEAM.busy = false;
    if(TEAM.pending){ TEAM.pending = false; setTimeout(()=>{ const a = activeProject(); if(a && a.team) teamSync(a); }, 250); }
  }
}
function teamRerender(){
  // Eingabe nicht unterbrechen: läuft gerade eine Texteingabe, wird nur still neu gezeichnet, wenn sie endet
  if(isTyping(document.activeElement)){ ui.teamDirtyView = true; return; }
  render();
}
document.addEventListener('focusout', ()=>{ if(ui.teamDirtyView){ ui.teamDirtyView = false; setTimeout(()=>{ if(!isTyping(document.activeElement)) render(); }, 50); } });

/* Wer arbeitet gerade mit? (Lebenszeichen alle paar Sekunden) */
async function teamPresence(loc, files){
  const me = teamClient(), now = Date.now();
  if(!TEAM.lastPresence || now - TEAM.lastPresence > 20000){
    TEAM.lastPresence = now;
    await TFS.write(loc, `presence/${me}.json`, JSON.stringify({name:teamUser(), at:now, module:S.activeModule}));
  }
  const others = files.filter(f=>f.rel.startsWith('presence/') && !f.rel.includes(me) && now - f.mtime < 90000).map(f=>f.rel);
  const r = await TFS.read(loc, others);
  TEAM.online = Object.values(r).map(x=>{ try{ return JSON.parse(x); }catch(e){ return null; } }).filter(x=>x && now - x.at < 90000);
}

/* ---------- Status in der Titelleiste ---------- */
function teamStatus(p, st){
  if(p.id!==S.activeProjectId) return;
  TEAM.status = st; TEAM.statusPid = p.id; renderTeamBadge();
}
function renderTeamBadge(){
  const el = document.getElementById('teamBadge'); if(!el) return;
  const p = activeProject();
  if(!p || !p.team){ el.hidden = true; return; }
  el.hidden = false;
  const mine = TEAM.statusPid===p.id, st = mine ? (TEAM.status || 'ok') : 'sync', online = mine ? (TEAM.online || []) : [];
  el.className = 'team-badge st-' + st;
  const av = online.slice(0,3).map(o=>`<i title="${esc(o.name)}" style="--h:${[...o.name].reduce((a,c)=>a + c.charCodeAt(0), 0) % 360}">${esc(o.name.trim().slice(0,1).toUpperCase())}</i>`).join('');
  el.innerHTML = `${ic('users',14)}<span class="tb-lbl">${st==='locked' ? t('tm.connect') : st==='error' || st==='missing' ? t('tm.offline') : t('tm.team')}</span>${av ? `<span class="tb-av">${av}</span>` : ''}`;
  el.title = [p.team.label, st==='ok' ? (TEAM.lastSync ? t('tm.synced', {time:new Date(TEAM.lastSync).toLocaleTimeString(locale(), {hour:'2-digit', minute:'2-digit', second:'2-digit'})}) : '') : t('tm.st.' + st),
    online.length ? t('tm.online', {names:online.map(o=>o.name).join(', ')}) : t('tm.alone')].filter(Boolean).join('\n');
}

/* ---------- Teilen, Öffnen, Beenden ---------- */
async function teamAskName(){
  if(S.settings.userName) return true;
  let def = '';
  try{ def = IS_DESKTOP ? ((await window.vfInfo()) || {}).user || '' : ''; }catch(e){}
  const n = await dialog({title:t('tm.nameQ'), text:t('tm.nameText'), input:def, buttons:[{label:t('g.cancel'), value:null},{label:t('g.apply'), value:true, primary:true}]});
  if(!n || !n.trim()) return false;
  S.settings.userName = n.trim().slice(0,40); persistSoon(); return true;
}
async function teamShare(){
  const p = activeProject();
  if(!TEAM_OK){ dialog({title:t('tm.title'), text:t('tm.unsupported')}); return; }
  if(p.team){ teamMenuInfo(); return; }
  const ok = await dialog({title:t('tm.shareQ', {name:projectName(p)}), text:t('tm.shareText'), buttons:[{label:t('g.cancel'), value:false},{label:t('tm.pickFolder'), value:true, primary:true}]});
  if(!ok || !(await teamAskName())) return;
  const parent = await TFS.pick(); if(!parent) return;
  const name = (projectName(p).replace(/[^\p{L}\p{N} _-]+/gu, '').trim() || 'Project').slice(0, 60) + TEAM_EXT;
  const loc = await TFS.mkdir(parent, name);
  const existing = await TFS.scan(loc);
  if(existing.some(f=>f.rel===TEAM_MANIFEST)){ toast(t('tm.exists'), true); return; }
  await TFS.write(loc, TEAM_MANIFEST, JSON.stringify({app:'VertexForge Studio', format:1, project:p.id, name:projectName(p), created:Date.now(), by:teamUser()}, null, 2));
  await TFS.write(loc, 'README.txt', t('tm.readme'));
  await teamLink(p, loc);
  TEAM.state[p.id] = {recs:{}, mtimes:{}, assets:{}};
  await teamSync(p, {quiet:true});
  toast(t('tm.shared', {folder:loc.label}));
}
async function teamLink(p, loc){
  p.team = {label:loc.label, path:loc.path || ''};
  if(loc.handle){ TEAM.handles[p.id] = loc.handle; await idbReq('suite', 'readwrite', st=>st.put(loc.handle, 'teamh:' + p.id)); }
  changed(); renderChrome(); teamStart();
}
async function teamOpen(){
  if(!TEAM_OK){ dialog({title:t('tm.title'), text:t('tm.unsupported')}); return; }
  if(!(await teamAskName())) return;
  const loc = await TFS.pick(); if(!loc) return;
  const files = await TFS.scan(loc);
  const man = (await TFS.read(loc, [TEAM_MANIFEST]))[TEAM_MANIFEST];
  if(!man){ dialog({title:t('tm.title'), text:t('tm.notTeam')}); return; }
  let info = {}; try{ info = JSON.parse(man); }catch(e){}
  const raw = await TFS.read(loc, files.filter(f=>relKey(f.rel)).map(f=>f.rel));
  const R = {}; Object.entries(raw).forEach(([rel, s])=>{ try{ R[relKey(rel)] = JSON.stringify(JSON.parse(s).d); }catch(e){} });
  for(const id of new Set(Object.values(R).flatMap(assetIds))){ const rel = 'assets/' + id + '.txt'; if(!S.assets[id]){ const r = await TFS.read(loc, [rel]); if(r[rel] && isDataImg(r[rel])) S.assets[id] = r[rel]; } }
  const pid = info.project || (R.meta && JSON.parse(R.meta).id);
  let p = S.projects.find(x=>x.id===pid);
  const built = teamBuild(R, p || {id:pid, phases:[], boards:[], team:null});
  if(p){ const i = S.projects.indexOf(p); built.team = p.team; S.projects[i] = built; p = built; }
  else { S.projects.unshift(built); p = built; }
  TEAM.state[p.id] = {recs:R, mtimes:Object.fromEntries(files.filter(f=>relKey(f.rel)).map(f=>[f.rel, f.mtime])), assets:{}};
  teamSaveBase(p.id);
  await teamLink(p, loc);
  openProject(p.id);
  toast(t('tm.opened', {name:projectName(p)}));
}
async function teamStop(){
  const p = activeProject(); if(!p.team) return;
  const ok = await dialog({title:t('tm.stopQ'), text:t('tm.stopText'), buttons:[{label:t('g.cancel'), value:false},{label:t('tm.stop'), value:true, primary:true}]});
  if(!ok) return;
  p.team = null; delete TEAM.handles[p.id]; delete TEAM.state[p.id];
  idbReq('suite', 'readwrite', st=>st.delete('teamh:' + p.id)); idbReq('suite', 'readwrite', st=>st.delete('teamb:' + p.id));
  changed(); renderChrome();
}
function teamMenuInfo(){
  const p = activeProject(), el = document.getElementById('teamBadge');
  const r = el ? el.getBoundingClientRect() : {left:innerWidth/2, bottom:60};
  const online = TEAM.statusPid===p.id ? (TEAM.online || []) : [];
  openMenu(r.left, r.bottom + 6, [
    ...(TEAM.status==='locked' ? [{label:t('tm.connect'), icon:'link', run:()=>teamSync(p, {ask:true})}] : []),
    {label:t('tm.syncNow'), icon:'refresh', run:()=>teamSync(p)},
    {label:t('tm.myName', {name:teamUser()}), icon:'users', run:async()=>{ const n = await askText(t('tm.nameQ'), S.settings.userName || ''); if(n && n.trim()){ S.settings.userName = n.trim().slice(0,40); persistSoon(); TEAM.lastPresence = 0; } }},
    {sep:1},
    {label:t('tm.stop'), icon:'unlink', run:teamStop}
  ], `${p.team.label}${online.length ? ' · ' + online.map(o=>o.name).join(', ') : ''}`);
}

/* ---------- Taktgeber ---------- */
let teamDebounce = null;
function teamStart(){
  if(!TEAM_OK) return;
  clearInterval(TEAM.timer);
  let tick = 0;
  TEAM.timer = setInterval(()=>{ tick++; if(document.hidden && tick % 6) return; const p = activeProject(); if(p && p.team) teamSync(p); }, TEAM_INTERVAL);   // im Hintergrund seltener
  const p = activeProject(); if(p && p.team) teamSync(p, {quiet:true});
}
/* Nach lokalen Änderungen zügig hochladen */
function teamPoke(){ const p = activeProject(); if(!p || !p.team) return; clearTimeout(teamDebounce); teamDebounce = setTimeout(()=>teamSync(p), 1500); }
