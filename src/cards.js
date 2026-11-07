/* ============================================================================
   SAMMELKARTEN — Charaktere, Kreaturen, Props, Fahrzeuge, Umgebungen
   Eine Karte auf dem Denkbrett: Vorderseite (Bild, Typ, Fortschritt je Disziplin),
   Rückseite (Beschreibung, Fakten, verknüpfte Dateien). Klick auf ↻ dreht sie um.
   Das Deck zeigt alle Karten eines Projekts auf einen Blick.
   ============================================================================ */
const CHAR_KINDS = ['character','creature','prop','vehicle','environment'];
const CHAR_COLORS = {character:'#d6a740', creature:'#c4553f', prop:'#3f9c97', vehicle:'#4f7cc4', environment:'#5e9a4c'};
const CHAR_ICONS = {character:'user', creature:'paw', prop:'cube', vehicle:'wheel', environment:'mountain'};
const CHAR_STATS = ['model','sculpt','texture','rig','anim'];

function charPct(n){ return Math.round(n.stats.reduce((a,b)=>a+b,0) / n.stats.length); }
function charNumber(n){
  const p = activeProject(); let i = 0, found = 0;
  p.boards.forEach(b=>b.nodes.forEach(x=>{ if(x.type==='char'){ i++; if(x.id===n.id) found = i; } }));
  return found || 0;
}
/* Kartenkörper. edit=true: auf dem Denkbrett (Felder bearbeitbar), sonst Deck/Lesemodus */
function charCardHTML(n, edit){
  const kind = n.kind, col = CHAR_COLORS[kind], pct = charPct(n), no = String(charNumber(n)).padStart(3,'0');
  const img = assetSrc(n.src) || (n.art ? presetArt(n.art) : '');
  const field = (f, cls, ph) => edit
    ? `<input class="${cls}" data-field="${f}" value="${esc(n[f])}" placeholder="${esc(ph)}" spellcheck="false">`
    : `<span class="${cls}">${esc(n[f] || ph)}</span>`;
  const stats = CHAR_STATS.map((k,i)=>`<div class="tc-stat"><span class="tc-sl">${t('cc.s.'+k)}</span><span class="tc-bar" ${edit?`data-stat="${i}"`:''} title="${t('cc.s.'+k)} · ${n.stats[i]}%"><i style="width:${n.stats[i]}%"></i></span><b>${n.stats[i]}</b></div>`).join('');
  const facts = n.facts.filter(f=>f.k || f.v);
  return `<div class="tc ${n.flip?'flip':''}" style="--kc:${col}" data-kind="${kind}">
    <div class="tc-inner">
      <div class="tc-face tc-front">
        <div class="tc-top">${field('title','tc-name',t('cc.name'))}<span class="tc-hp" title="${t('cc.overall')}">${pct}<small>%</small></span></div>
        <div class="tc-art ${img?'':'empty'}" ${edit?'data-act="move"':''}>${img ? `<img src="${esc(img)}" alt="" draggable="false">` : `<span>${ic('image',22)}<em>${t('cc.dropImg')}</em></span>`}<span class="tc-shine"></span></div>
        <div class="tc-type"><span class="tc-kind">${ic(CHAR_ICONS[kind],12)}${t('cc.k.'+kind)}</span>${field('sub','tc-sub',t('cc.role'))}</div>
        <div class="tc-stats">${stats}</div>
        <div class="tc-foot"><span class="tc-no">#${no}</span><button class="tc-flip" data-act="flip" title="${esc(t('cc.flip'))}">${ic('rotate',13)}</button></div>
      </div>
      <div class="tc-face tc-back">
        <div class="tc-top"><span class="tc-name">${esc(n.title || t('cc.name'))}</span><span class="tc-kind">${ic(CHAR_ICONS[kind],12)}</span></div>
        ${edit ? `<textarea class="tc-desc" data-field="desc" placeholder="${esc(t('cc.descPh'))}">${esc(n.desc)}</textarea>` : `<p class="tc-desc">${esc(n.desc || t('cc.descPh'))}</p>`}
        ${facts.length ? `<dl class="tc-facts">${facts.map(f=>`<div><dt>${esc(f.k)}</dt><dd>${esc(f.v)}</dd></div>`).join('')}</dl>` : (edit ? `<div class="tc-hint">${t('cc.factsHint')}</div>` : '')}
        ${edit ? `<div class="n-links">${linksHTML(n.links,'node',n.id)}</div>` : (n.links.length ? `<div class="tc-files">${ic('link',11)} ${n.links.length} ${t('cc.files')}</div>` : '')}
        <div class="tc-foot"><span class="tc-no">#${no}</span><button class="tc-flip" data-act="flip" title="${esc(t('cc.flip'))}">${ic('rotate',13)}</button></div>
      </div>
    </div>
  </div>`;
}
function flipCard(id){
  const n = nodeById(id); if(!n) return;
  n.flip = !n.flip; changed();
  const el = nodeEl(id), tc = el && el.querySelector('.tc'); if(tc) tc.classList.toggle('flip', n.flip);
}
/* Klick auf einen Balken setzt den Wert (wie bei einer Bewertung) */
function setCardStat(n, i, e, bar){
  const r = bar.getBoundingClientRect(), v = Math.round(clamp((e.clientX - r.left) / r.width, 0, 1) * 20) * 5;
  n.stats[i] = v; changed(); updateNodeEl(n); renderInspector();
}
async function pickCardImage(id){
  const n = nodeById(id); if(!n) return;
  const [f] = await pickFiles('image/*'); if(!f) return;
  n.src = addAsset(await compressImage(f, 1400)); n.art = ''; changed(); updateNodeEl(n); renderInspector();
}
async function dropCardImage(id, file){
  const n = nodeById(id); if(!n) return;
  n.src = addAsset(await compressImage(file, 1400)); n.art = ''; changed(); updateNodeEl(n); renderInspector();
}
function charInspectorHTML(n){
  return `<label class="f"><span class="f-l">${t('cc.kind')}</span><select class="sel" data-cf="kind">${CHAR_KINDS.map(k=>`<option value="${k}" ${k===n.kind?'selected':''}>${t('cc.k.'+k)}</option>`).join('')}</select></label>
    <div class="f"><span class="f-l">${t('cc.image')}</span><div class="row-btns"><button class="btn btn-xs" data-cact="img">${ic('image',13)} ${t(n.src||n.art?'cc.imgChange':'cc.imgPick')}</button>${n.src||n.art?`<button class="btn btn-xs" data-cact="noimg">${ic('x',13)} ${t('cc.imgRemove')}</button>`:''}</div></div>
    <div class="subhead"><span>${t('cc.progress')}</span></div>
    ${CHAR_STATS.map((k,i)=>`<label class="f f-range"><span class="f-l">${t('cc.s.'+k)}</span><input type="range" min="0" max="100" step="5" value="${n.stats[i]}" data-cstat="${i}"><b class="mono">${n.stats[i]}</b></label>`).join('')}
    <div class="subhead"><span>${t('cc.facts')}</span></div>
    <div class="cc-facts">${n.facts.map((f,i)=>`<div class="cc-fact"><input class="inp" data-fk="${i}" value="${esc(f.k)}" placeholder="${esc(t('cc.factK'))}"><input class="inp" data-fv="${i}" value="${esc(f.v)}" placeholder="${esc(t('cc.factV'))}"><button class="icon-btn sm" data-cact="fdel" data-i="${i}" title="${esc(t('g.delete'))}">${ic('x',12)}</button></div>`).join('')}
      ${n.facts.length < 8 ? `<button class="btn btn-xs" data-cact="fadd">${ic('plus',13)} ${t('cc.factAdd')}</button>` : ''}</div>
    <button class="btn btn-xs" data-cact="flip">${ic('rotate',13)} ${t('cc.flip')}</button>`;
}
function charInspectorEvent(n, e){
  const tg = e.target;
  if(e.type==='input' || e.type==='change'){
    if(tg.dataset.cstat!=null){ n.stats[+tg.dataset.cstat] = +tg.value; tg.nextElementSibling.textContent = tg.value; changed(); updateNodeEl(n); return true; }
    if(tg.dataset.cf==='kind'){ n.kind = tg.value; changed(); updateNodeEl(n); return true; }
    if(tg.dataset.fk!=null){ n.facts[+tg.dataset.fk].k = tg.value; changed(); updateNodeEl(n); return true; }
    if(tg.dataset.fv!=null){ n.facts[+tg.dataset.fv].v = tg.value; changed(); updateNodeEl(n); return true; }
    return false;
  }
  const b = tg.closest('[data-cact]'); if(!b) return false;
  const a = b.dataset.cact;
  if(a==='img') pickCardImage(n.id);
  else if(a==='noimg'){ n.src = ''; n.art = ''; changed(); updateNodeEl(n); renderInspector(); }
  else if(a==='fadd'){ n.facts.push({k:'', v:''}); changed(); renderInspector(); setTimeout(()=>{ const i = $('nodeInspector').querySelector(`[data-fk="${n.facts.length-1}"]`); if(i) i.focus(); }, 0); }
  else if(a==='fdel'){ n.facts.splice(+b.dataset.i, 1); changed(); updateNodeEl(n); renderInspector(); }
  else if(a==='flip') flipCard(n.id);
  return true;
}

/* ---------- Deck: alle Karten eines Projekts ---------- */
let deckEl = null;
function closeDeck(){ if(!deckEl) return; const el = deckEl; deckEl = null; el.classList.remove('open'); setTimeout(()=>el.remove(), 220); }
function allCards(){
  const p = activeProject(), out = [];
  p.boards.forEach(b=>b.nodes.forEach(n=>{ if(n.type==='char') out.push({n, b}); }));
  return out;
}
function openDeck(){
  closeMenu(); closeDeck();
  const el = document.createElement('div'); el.className = 'deck'; deckEl = el;
  let filter = 'all';
  const draw = () => {
    const cards = allCards(), list = cards.filter(c=>filter==='all' || c.n.kind===filter);
    const counts = Object.fromEntries(CHAR_KINDS.map(k=>[k, cards.filter(c=>c.n.kind===k).length]));
    el.innerHTML = `<div class="deck-head">
        <div><div class="eyebrow">${t('cc.deck')} · ${esc(projectName(activeProject()))}</div><h2>${t('cc.deckTitle',{n:cards.length})}</h2></div>
        <div class="deck-filter">${['all', ...CHAR_KINDS.filter(k=>counts[k])].map(k=>`<button class="${filter===k?'on':''}" data-df="${k}" ${k!=='all'?`style="--kc:${CHAR_COLORS[k]}"`:''}>${k==='all' ? t('cc.all') : `${ic(CHAR_ICONS[k],12)}${t('cc.k.'+k)}`}<span>${k==='all' ? cards.length : counts[k]}</span></button>`).join('')}</div>
        <button class="icon-btn deck-x" data-dact="close" title="Esc">${ic('x',18)}</button>
      </div>
      <div class="deck-grid">${list.length ? list.map((c,i)=>`<div class="deck-card" data-cid="${c.n.id}" style="--i:${i}">${charCardHTML(c.n, false)}<button class="deck-loc" data-dact="locate" data-cid="${c.n.id}">${ic('target',13)} ${t('cc.locate')}</button></div>`).join('')
        : `<div class="deck-empty">${ic('cards',34)}<p>${t('cc.empty')}</p><button class="btn btn-primary" data-dact="new">${ic('plus',14)} ${t('cc.new')}</button></div>`}</div>
      <div class="deck-tip">${t('cc.deckTip')}</div>`;
  };
  draw();
  document.body.appendChild(el);
  requestAnimationFrame(()=>el.classList.add('open'));
  el.addEventListener('click', e=>{
    const f = e.target.closest('[data-df]'); if(f){ filter = f.dataset.df; draw(); return; }
    const a = e.target.closest('[data-dact]');
    if(a){
      if(a.dataset.dact==='close') closeDeck();
      else if(a.dataset.dact==='new'){ closeDeck(); if(S.activeModule!=='board') go('board'); setTimeout(()=>addNode('char'), 60); }
      else if(a.dataset.dact==='locate') locateNode(a.dataset.cid);
      return;
    }
    const card = e.target.closest('.deck-card');
    if(card){ const n = allCards().find(c=>c.n.id===card.dataset.cid); if(n){ card.querySelector('.tc').classList.toggle('flip'); } return; }
    if(e.target===el || e.target.classList.contains('deck-grid')) closeDeck();
  });
}
/* Zu einem Element springen (Deck, Schnellsuche) */
function locateNode(id){
  closeDeck();
  const p = activeProject(), b = p.boards.find(x=>x.nodes.some(n=>n.id===id)); if(!b) return;
  ui.boardId = b.id; ui.sel = new Set([id]); ui.active = id;
  if(S.activeModule!=='board') go('board'); else renderBoard();
  setTimeout(()=>{ fitBoard(true); const el = nodeEl(id); if(el){ el.classList.remove('found'); void el.offsetWidth; el.classList.add('found'); } renderInspector(); }, 120);
}
document.addEventListener('keydown', e=>{ if(deckEl && e.key==='Escape'){ e.stopImmediatePropagation(); e.preventDefault(); closeDeck(); } }, true);
