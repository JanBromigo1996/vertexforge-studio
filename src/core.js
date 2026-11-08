let S = null;      // gesamter Arbeitsstand (Projekte, Einstellungen, Assets)
let db = null;     // IndexedDB-Verbindung
/* ============================================================================
   A. KONSTANTEN & HILFSFUNKTIONEN
   ============================================================================ */
const APP_VERSION = '2.8.1';
const SCHEMA = 3;
const MODULES = ['projects','pipeline','board','shots','story','guide'];
const MOD_ICONS = {projects:'grid', pipeline:'calendar', board:'network', shots:'film', story:'book', guide:'compass'};
const THEMES = ['fantasy','scifi','classic','mythology'];
const PRIOS = ['low','med','high','critical'];
const PRIO_LABEL = {low:'Low', med:'Med', high:'High', critical:'Critical'};
const PRIO_WEIGHT = {critical:0, high:1, med:2, low:3};
const STATUSES = ['todo','wip','review','done'];
const STATUS_COLOR = {todo:'var(--muted)', wip:'var(--warn)', review:'var(--review)', done:'var(--ok)'};
const DEPTS = [['layout','LAY'],['anim','ANI'],['sim','CFX'],['light','LGT'],['render','RND']];
const FOILS = ['gold','chrome','bronze','crimson','patina','ice','ember','ivory','neon','plain','ink'];
const FXS = ['none','extrude','emboss','glow','outline','long'];
const STAGES = 8;
const IS_DESKTOP = typeof window.vfInfo === 'function';
/* Asynchrone Systemaufrufe der Desktop-App (Dialoge): Ergebnis kommt über __vfResolve zurück */
const NATIVE = {seq:0, cb:{}};
window.__vfResolve = (id, res, err) => { const c = NATIVE.cb[id]; delete NATIVE.cb[id]; if(c) err ? c.rej(new Error(err)) : c.res(res); };
function nativeAsync(name, ...args){ return new Promise((res, rej)=>{ const id = ++NATIVE.seq; NATIVE.cb[id] = {res, rej}; try{ Promise.resolve(window[name](id, ...args)).catch(rej); }catch(e){ rej(e); } }); }
const DOCK_TYPES = new Set(['image','text','video','file']);
const MEDIA_TYPES = new Set(['image','video','file']);
/* Design je Bereich: Denkbrett (Hintergrund + Knoten-Stil, je Brett) und Story (Papier, je Projekt) */
const BOARD_BGS = ['dots','grid','plain','cork','wood','walnut','felt','concrete','blueprint','paper','chalk'];
const NODE_STYLES = ['studio','sticky','index','blueprint','chalk','glass','polaroid','kraft'];
const BOARD_PRESETS = {studio:['dots','studio'], desk:['wood','polaroid'], pinboard:['cork','sticky'], workshop:['walnut','kraft'], felt:['felt','polaroid'], concrete:['concrete','index'], sketch:['paper','index'], blueprint:['blueprint','blueprint'], chalk:['chalk','chalk'], glass:['plain','glass']};
const STORY_PAPERS = ['parchment','clean','manuscript','typewriter','night'];
/* Projektbibliothek: Darstellung der Projekte (global) · Pipeline/Shotlist: Oberfläche (pro Projekt) */
const LIB_STYLES = ['studio','dvd','posters','books','gallery'];
const SURF_STYLES = ['studio','paper','blueprint','kraft','film'];
const DOCK_TARGETS = new Set(['card','mindmap']);

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp = (v,a,b) => Math.min(b, Math.max(a, v));
const uid = p => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2,7)}`;
const arr = v => Array.isArray(v) ? v : [];
const str = (v,d='') => typeof v==='string' ? v : (v==null ? d : String(v));
const num = (v,d,mn=-Infinity,mx=Infinity) => { const n = parseFloat(v); return Number.isFinite(n) ? clamp(n,mn,mx) : d; };
const sid = (v,p) => (typeof v==='string' && /^[\w-]{1,80}$/.test(v)) ? v : uid(p);
const isoDate = v => /^\d{4}-\d{2}-\d{2}$/.test(v||'') ? v : '';
const safeColor = (v,d) => /^#[0-9a-f]{3,8}$/i.test(v||'') ? v : d;
const isDataImg = v => typeof v==='string' && /^data:(image|video)\//.test(v);   // eingebettete Bilder & Videos
const isDataVideo = v => typeof v==='string' && /^data:video\//.test(v);
const pad = n => String(n).padStart(2,'0');
const isTyping = el => !!(el && el.closest && el.closest('input,textarea,select,[contenteditable="true"]'));
const basename = p => String(p||'').split(/[\\/]/).pop();
function isoLocal(d){ return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function rel(days, from){ const d = from ? parseISO(from) : new Date(); d.setDate(d.getDate()+days); return isoLocal(d); }
function parseISO(s){ if(!isoDate(s)) return null; const [y,m,d] = s.split('-').map(Number); return new Date(y,m-1,d); }
function today0(){ const n = new Date(); n.setHours(0,0,0,0); return n; }
function daysUntil(s){ const t0 = parseISO(s); return t0 ? Math.round((t0 - today0())/86400000) : null; }
function locale(){ return LANG_LOCALE[currentLang()] || 'en-GB'; }
function fmtDate(s, short){ const d = parseISO(s); return d ? d.toLocaleDateString(locale(), short ? {day:'2-digit',month:'short'} : {day:'2-digit',month:'short',year:'numeric'}) : '—'; }
function fmtBytes(b){ if(!Number.isFinite(b)) return '—'; const u = ['B','KB','MB','GB']; let i = 0; while(b >= 1024 && i < 3){ b /= 1024; i++; } return `${b.toFixed(i?1:0)} ${u[i]}`; }
function cyrb(s){ let h1 = 0xdeadbeef, h2 = 0x41c6ce57; for(let i = 0; i < s.length; i++){ const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); } h1 = Math.imul(h1 ^ (h1>>>16), 2246822507) ^ Math.imul(h2 ^ (h2>>>13), 3266489909); h2 = Math.imul(h2 ^ (h2>>>16), 2246822507) ^ Math.imul(h1 ^ (h1>>>13), 3266489909); return (h2>>>0).toString(36) + (h1>>>0).toString(36); }
function detectLang(){ const l = (navigator.language||'en').slice(0,2).toLowerCase(); return LANG_ORDER.includes(l) ? l : 'en'; }
function currentLang(){ return (S && S.settings && S.settings.lang) || detectLang(); }
const L = (de, en) => currentLang()==='de' ? de : en;

/* ============================================================================
   B. ICONS (eigene Linien-Icons, offline)
   ============================================================================ */
const ICONS = {
  brush:'<path d="M18.5 3.5l2 2-9 9-2.5-.5-.5-2.5z"/><path d="M8.5 14.5c-2 0-3.5 1.5-3.5 3.5 0 1-.7 2-2 2 4 1.5 7.5-.5 7.5-3.5z"/>',
  users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c1.9.7 3.1 2.5 3.5 5.2"/>',
  refresh:'<path d="M20 11a8 8 0 0 0-14.7-4.3L4 8"/><path d="M4 3v5h5"/><path d="M4 13a8 8 0 0 0 14.7 4.3L20 16"/><path d="M20 21v-5h-5"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1.2-4 4.4-6 8-6s6.8 2 8 6"/>',
  paw:'<circle cx="6" cy="10" r="2"/><circle cx="10" cy="5.5" r="2"/><circle cx="14" cy="5.5" r="2"/><circle cx="18" cy="10" r="2"/><path d="M8.5 15.5c1-2.3 2.2-3.5 3.5-3.5s2.5 1.2 3.5 3.5c.8 1.9-.3 4-2.3 4h-2.4c-2 0-3.1-2.1-2.3-4z"/>',
  cube:'<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/>',
  wheel:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.5"/><path d="M12 3.5v6M12 14.5v6M3.5 12h6M14.5 12h6"/>',
  mountain:'<path d="M3 20l6.5-11 4 6.5 2.5-4L21 20z"/><circle cx="17" cy="6" r="1.6"/>',
  rotate:'<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
  cards:'<rect x="3" y="6" width="11" height="15" rx="1.8" transform="rotate(-8 8.5 13.5)"/><rect x="10" y="4" width="11" height="15" rx="1.8" transform="rotate(8 15.5 11.5)"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  calendar:'<rect x="3" y="4.5" width="18" height="16.5" rx="2"/><path d="M16 2.5v4M8 2.5v4M3 10h18M8 14h3"/>',
  network:'<circle cx="5.5" cy="6" r="2.5"/><circle cx="18.5" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M7.4 7.8l3.4 7.8M16.6 7.8l-3.4 7.8M8 6h8"/>',
  film:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M7.5 4l-2 5M12.5 4l-2 5M17.5 4l-2 5"/>',
  book:'<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 21.5v-17M8.5 7h7M8.5 11h5"/>',
  compass:'<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2.2 4.8-4.8 2.2 2.2-4.8z"/>',
  plus:'<path d="M12 5v14M5 12h14"/>', x:'<path d="M6 6l12 12M18 6L6 18"/>',
  trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/>',
  download:'<path d="M12 3v12M7 10l5 5 5-5M4 20h16"/>', upload:'<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
  copy:'<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon:'<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  sliders:'<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
  check:'<path d="M5 12.5l4.5 4.5L19 7"/>', type:'<path d="M5 7V4h14v3M12 4v16M9 20h6"/>',
  zoomIn:'<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M11 8v6M8 11h6"/>', zoomOut:'<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M8 11h6"/>',
  fit:'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  card:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  node:'<rect x="3.5" y="6" width="17" height="12" rx="3"/><path d="M7.5 11h9M7.5 14h5"/>',
  note:'<path d="M5 3h14v12l-6 6H5z"/><path d="M13 21v-6h6"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>', clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  alert:'<path d="M12 3.5l9.5 16.5h-19z"/><path d="M12 10v4.5M12 17.2v.3"/>', flag:'<path d="M5 21V4h11l-2 4 2 4H5"/>',
  sort:'<path d="M7 4v16M3.5 16.5L7 20l3.5-3.5M17 20V4M13.5 7.5L17 4l3.5 3.5"/>', chevron:'<path d="M6 9l6 6 6-6"/>', chevronR:'<path d="M9 6l6 6-6 6"/>',
  front:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M4 15V5a1 1 0 0 1 1-1h10"/>', back:'<rect x="4" y="4" width="12" height="12" rx="2"/><path d="M20 9v10a1 1 0 0 1-1 1H9"/>',
  folder:'<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2h8.5A1.5 1.5 0 0 1 21 8.5v10a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z"/>',
  target:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
  edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  save:'<path d="M4.5 5.5a1 1 0 0 1 1-1h11l3 3v11a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1z"/><path d="M8 4.5v4.5h7.5V4.5M7.5 19.5v-6h9v6"/><path d="M13 6v1.5"/>',
  history:'<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3.5 8.5"/><path d="M3.5 3.5v5h5M12 7.5V12l3 2"/>',
  grip:'<circle cx="9" cy="6" r=".9"/><circle cx="15" cy="6" r=".9"/><circle cx="9" cy="12" r=".9"/><circle cx="15" cy="12" r=".9"/><circle cx="9" cy="18" r=".9"/><circle cx="15" cy="18" r=".9"/>',
  pointer:'<path d="M5 3l14 7.5-6.2 1.7L10 18.5z"/>',
  play:'<path d="M7 4.5v15l12-7.5z"/>',
  video:'<rect x="2.5" y="5.5" width="14" height="13" rx="2"/><path d="M16.5 10l5-3v10l-5-3"/>',
  palette:'<path d="M12 3a9 9 0 0 0 0 18c1.2 0 1.8-.8 1.8-1.7 0-1.2-1-1.6-1-2.6 0-.9.8-1.6 1.7-1.6H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"/><circle cx="7.5" cy="11" r="1.1"/><circle cx="10" cy="7" r="1.1"/><circle cx="15" cy="7.5" r="1.1"/>',
  expand:'<path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/>',
  shrink:'<path d="M20 10h-6V4M4 14h6v6M14 10l7-7M10 14l-7 7"/>',
  dots:'<circle cx="12" cy="5.5" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="12" cy="18.5" r="1.2"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  pin:'<path d="M9 4h6l-1 5 3 3v2H7v-2l3-3z"/><path d="M12 14v7"/>',
  unlink:'<path d="M9.5 14.5l5-5M8 11l-2 2a3.5 3.5 0 0 0 5 5l2-2M16 13l2-2a3.5 3.5 0 0 0-5-5l-2 2"/><path d="M3 3l18 18"/>',
  link:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  list:'<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
  kanban:'<rect x="3" y="4" width="5" height="16" rx="1"/><rect x="10" y="4" width="5" height="10" rx="1"/><rect x="17" y="4" width="4" height="13" rx="1"/>',
  undo:'<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>', redo:'<path d="M15 14l5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
  external:'<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  keyboard:'<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>',
  sparkle:'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  focus:'<path d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4"/><circle cx="12" cy="12" r="3"/>',
  arrowUp:'<path d="M12 19V5M6 11l6-6 6 6"/>', arrowDown:'<path d="M12 5v14M6 13l6 6 6-6"/>',
  swap:'<path d="M4 8h14l-4-4M20 16H6l4 4"/>', layers:'<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
  hand:'<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12M11 11.5V4a1.5 1.5 0 0 1 3 0v8M14 11.5V5.5a1.5 1.5 0 0 1 3 0V14M17 9.5a1.5 1.5 0 0 1 3 0V15a7 7 0 0 1-7 7h-1a7 7 0 0 1-6-3.4L4 15.5a1.5 1.5 0 0 1 2.6-1.5L8 16"/>'
};
function ic(name, size=16){ return `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]||''}</svg>`; }

/* ============================================================================
   C. SCHRIFTEN & GESTALTETER TEXT (3D-Effekte)
   ============================================================================ */
const FONTS = /*@FONTS*/;
const FONT_SET = new Set(FONTS.map(f=>f[0]));
const FONT_CATS = ['all','fantasy','3d','cinema','scifi','horror','sans'];
const COLOR_FONTS = new Set(['Nabla','Honk','Bungee Spice']);
function fontStack(name){ const f = FONTS.find(x=>x[0]===name) || FONTS[0]; return `'${f[0]}', ${f[1]}`; }
const fontOk = n => FONT_SET.has(n) ? n : '';
function fontFromStack(s){ const m = /'([^']+)'/.exec(String(s||'')); return m ? m[1] : ''; }
function fontSelectHTML(attr, value){
  return `<select class="sel" ${attr}>${FONT_CATS.slice(1).map(c=>`<optgroup label="${esc(t('fcat.'+c))}">${FONTS.filter(f=>f[2]===c).map(([n])=>`<option value="${esc(n)}" ${n===value?'selected':''}>${esc(n)}</option>`).join('')}</optgroup>`).join('')}</select>`;
}

/* 3D-Effekte als Schatten-Stapel (in em → skaliert mit der Schriftgröße) */
function fxShadows(o){
  const c = o.fxColor, d = o.fxDepth, out = [];
  if(o.fx==='extrude'){
    const n = Math.round(3 + d*1.15), s = .011;
    for(let i = 1; i <= n; i++) out.push(`${(i*s).toFixed(3)}em ${(i*s).toFixed(3)}em 0 color-mix(in srgb, ${c} ${Math.round(100 - i/n*48)}%, #000)`);
    out.push(`${(n*s+.03).toFixed(3)}em ${(n*s+.06).toFixed(3)}em .1em rgba(0,0,0,.55)`);
  }else if(o.fx==='long'){
    const n = Math.round(8 + d*2.6), s = .016;
    for(let i = 1; i <= n; i++) out.push(`${(i*s).toFixed(3)}em ${(i*s).toFixed(3)}em 0 color-mix(in srgb, ${c} ${Math.round(100 - i/n*100)}%, transparent)`);
  }else if(o.fx==='emboss'){
    const k = .5 + d/10;
    out.push(`0 ${(-.02*k).toFixed(3)}em 0 rgba(255,255,255,.5)`, `0 ${(.03*k).toFixed(3)}em 0 color-mix(in srgb, ${c} 60%, #000)`, `0 ${(.065*k).toFixed(3)}em ${(.07*k).toFixed(3)}em rgba(0,0,0,.6)`);
  }else if(o.fx==='glow'){
    const k = .4 + d/8;
    out.push(`0 0 ${(.05*k).toFixed(3)}em ${c}`, `0 0 ${(.18*k).toFixed(3)}em ${c}`, `0 0 ${(.42*k).toFixed(3)}em ${c}`);
  }else if(o.fx==='outline'){
    const w = (.008*(1+d/2)).toFixed(3);
    [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]].forEach(([x,y])=>out.push(`${x*w}em ${y*w}em 0 ${c}`));
  }
  if(o.shadow) out.push('0 .05em .16em rgba(0,0,0,.72)');
  return out.join(',');
}
/* Text mit Oberfläche & 3D-Effekt. mode 'cover' = Größe relativ zur Cover-Breite (cqw) */
function stxHTML(o, text, mode){
  const size = mode==='cover' ? `calc(${(o.size/3).toFixed(3)}cqw * var(--title-scale,1))` : `${o.size}px`;
  const colorFont = COLOR_FONTS.has(o.font);
  const base = `font-family:${fontStack(o.font)};font-size:${size};font-weight:${o.weight};font-style:${o.italic?'italic':'normal'};letter-spacing:${o.spacing}em;line-height:${o.line};text-align:${o.align};--plain:${o.color};--lhpx:${Math.max(1,o.line)}em`;
  const sh = fxShadows(o);
  const backColor = o.fx!=='none' ? o.fxColor : 'transparent';
  const frontCls = colorFont ? '' : `foil-${o.foil}`;
  const front = colorFont ? `style="color:${o.color}"` : '';
  const tx = esc(text);
  return `<span class="stx" style="${base}"><span class="stx-back" aria-hidden="true" style="color:${backColor};${sh?`text-shadow:${sh}`:''}">${tx}</span><span class="stx-front ${frontCls}" ${front}>${tx}</span></span>`;
}
function textDefaults(o={}){
  return Object.assign({font:'Cinzel', size:30, weight:700, spacing:.06, line:1.05, italic:false, align:'center', foil:'gold', color:'#f3ead7', fx:'none', fxColor:'#5a3a12', fxDepth:8, shadow:true}, o);
}
function normStyle(o, d){
  o = o || {};
  return {
    font:fontOk(o.font) || d.font, size:num(o.size,d.size,3,400), weight:num(o.weight,d.weight,100,900),
    spacing:num(o.spacing,d.spacing,-.1,1), line:num(o.line,d.line,.6,3), italic:!!(o.italic ?? d.italic),
    align:['left','center','right'].includes(o.align) ? o.align : d.align,
    foil:FOILS.includes(o.foil) ? o.foil : d.foil, color:safeColor(o.color,d.color),
    fx:FXS.includes(o.fx) ? o.fx : d.fx, fxColor:safeColor(o.fxColor,d.fxColor), fxDepth:num(o.fxDepth,d.fxDepth,0,20),
    shadow:o.shadow==null ? d.shadow : !!o.shadow
  };
}
const STYLE_PRESETS = [
  {id:'epic',   s:{font:'Cinzel Decorative', weight:900, foil:'gold',   fx:'extrude', fxColor:'#5a3a12', fxDepth:8,  shadow:true,  spacing:.04, italic:false}},
  {id:'arcane', s:{font:'Metamorphous',      weight:400, foil:'patina', fx:'glow',    fxColor:'#3fd3a0', fxDepth:6,  shadow:false, spacing:.06, italic:false}},
  {id:'dark',   s:{font:'Pirata One',        weight:400, foil:'crimson',fx:'emboss',  fxColor:'#2a0505', fxDepth:8,  shadow:true,  spacing:.02, italic:false}},
  {id:'toon',   s:{font:'Lilita One',        weight:400, foil:'plain',  color:'#ffd34d', fx:'extrude', fxColor:'#b04a12', fxDepth:10, shadow:true, spacing:.01, italic:false}},
  {id:'neon',   s:{font:'Orbitron',          weight:900, foil:'neon',   fx:'glow',    fxColor:'#00c8ff', fxDepth:8,  shadow:false, spacing:.1,  italic:false}},
  {id:'chrome', s:{font:'Michroma',          weight:400, foil:'chrome', fx:'extrude', fxColor:'#1c2433', fxDepth:6,  shadow:true,  spacing:.08, italic:false}},
  {id:'iso',    s:{font:'Nabla',             weight:400, foil:'plain',  fx:'none',    fxColor:'#000000', fxDepth:0,  shadow:false, spacing:.02, italic:false}},
  {id:'steam',  s:{font:'Rye',               weight:400, foil:'bronze', fx:'extrude', fxColor:'#3b2108', fxDepth:7,  shadow:true,  spacing:.03, italic:false}},
  {id:'frost',  s:{font:'Cinzel',            weight:700, foil:'ice',    fx:'glow',    fxColor:'#8fd8ff', fxDepth:5,  shadow:false, spacing:.12, italic:false}},
  {id:'horror', s:{font:'Creepster',         weight:400, foil:'plain',  color:'#c8d6a0', fx:'outline', fxColor:'#1a0a0a', fxDepth:6, shadow:true, spacing:.04, italic:false}},
  {id:'cinema', s:{font:'Playfair Display',  weight:900, foil:'ivory',  fx:'long',    fxColor:'#000000', fxDepth:6,  shadow:false, spacing:.02, italic:true}},
  {id:'ember',  s:{font:'Grenze Gotisch',    weight:800, foil:'ember',  fx:'glow',    fxColor:'#ff6a1a', fxDepth:6,  shadow:false, spacing:.03, italic:false}}
];

/* Gemeinsamer Typografie-Editor (Cover-Designer & Denkbrett-Inspector) */
function styleEditorHTML(o, opts={}){
  const colorFont = COLOR_FONTS.has(o.font);
  const fontPart = opts.fontGrid ? `
    <div class="subhead"><span>${t('des.font')}</span></div>
    <div class="inline" style="flex-wrap:wrap;gap:8px">
      <div class="font-cats">${FONT_CATS.map(c=>`<button type="button" data-fontcat="${c}" class="${ui.fontCat===c?'active':''}">${t('fcat.'+c)}</button>`).join('')}</div>
      <div class="search grow" style="min-width:150px">${ic('search',14)}<input class="inp" style="width:100%" data-fontq placeholder="${esc(t('des.fontSearch'))}" value="${esc(ui.fontQuery)}"></div>
    </div>
    <div class="font-grid" data-fontgrid>${fontGridHTML(o.font)}</div>`
    : `<label class="f"><span class="f-l">${t('des.font')}</span>${fontSelectHTML('data-sk="font"', o.font)}</label>`;
  return `
    ${opts.presets ? `<div class="subhead"><span>${t('des.presets')}</span></div><div class="style-presets">${STYLE_PRESETS.map(p=>`<button type="button" class="style-preset" data-stylepreset="${p.id}">${stxHTML(Object.assign(textDefaults(), p.s, {size:19, line:1}), 'Aa Vertex', 'px')}<small>${t('sp.'+p.id)}</small></button>`).join('')}</div>` : ''}
    ${fontPart}
    ${colorFont ? `<div class="note">${t('des.colorFont')}</div>` : ''}
    <div class="f-row">
      <label class="f"><span class="f-l">${t('des.size')} <output>${Math.round(o.size*10)/10}</output></span><div class="inline"><input type="range" class="grow" min="${opts.sizeMin||4}" max="${opts.sizeMax||120}" step="0.1" value="${o.size}" data-sk="size"><input class="inp mono" type="number" style="width:64px" step="0.5" value="${Math.round(o.size*10)/10}" data-sk="size"></div></label>
      <label class="f"><span class="f-l">${t('des.spacing')} <output>${o.spacing.toFixed(3)}</output></span><input type="range" min="-0.08" max="0.6" step="0.005" value="${o.spacing}" data-sk="spacing"></label>
    </div>
    <div class="f-row4">
      <label class="f"><span class="f-l">${t('des.line')}</span><input type="range" min="0.7" max="2.4" step="0.01" value="${o.line}" data-sk="line"></label>
      <label class="f"><span class="f-l">${t('des.weight')}</span><select class="sel" data-sk="weight">${[300,400,500,600,700,800,900].map(w=>`<option value="${w}" ${w===o.weight?'selected':''}>${w}</option>`).join('')}</select></label>
      <label class="f"><span class="f-l">${t('des.italic')}</span><label class="switch"><input type="checkbox" data-sk="italic" ${o.italic?'checked':''}><span></span></label></label>
      <div class="f"><span class="f-l">${t('des.align')}</span><div class="seg">${['left','center','right'].map(a=>`<button type="button" data-skalign="${a}" class="${o.align===a?'active':''}" title="${t('al.'+a)}">${a==='left'?'⇤':a==='center'?'↔':'⇥'}</button>`).join('')}</div></div>
    </div>
    <div class="f-row3">
      <label class="f"><span class="f-l">${t('des.surface')}</span><select class="sel" data-sk="foil" ${colorFont?'disabled':''}>${FOILS.map(f=>`<option value="${f}" ${f===o.foil?'selected':''}>${t('foil.'+f)}</option>`).join('')}</select></label>
      <label class="f"><span class="f-l">${t('des.color')}</span><input type="color" value="${o.color}" data-sk="color"></label>
      <label class="f"><span class="f-l">${t('des.shadow')}</span><label class="switch"><input type="checkbox" data-sk="shadow" ${o.shadow?'checked':''}><span></span></label></label>
    </div>
    <div class="f-row3">
      <label class="f"><span class="f-l">${t('des.effect')}</span><select class="sel" data-sk="fx">${FXS.map(f=>`<option value="${f}" ${f===o.fx?'selected':''}>${t('fx.'+f)}</option>`).join('')}</select></label>
      <label class="f"><span class="f-l">${t('des.fxColor')}</span><input type="color" value="${o.fxColor}" data-sk="fxColor"></label>
      <label class="f"><span class="f-l">${t('des.depth')} <output>${o.fxDepth}</output></span><input type="range" min="0" max="20" step="1" value="${o.fxDepth}" data-sk="fxDepth"></label>
    </div>`;
}
function fontGridHTML(current){
  const q = ui.fontQuery.trim().toLowerCase();
  return FONTS.filter(f=>(ui.fontCat==='all' || f[2]===ui.fontCat) && (!q || f[0].toLowerCase().includes(q)))
    .map(([n])=>`<button type="button" class="font-chip ${n===current?'active':''}" data-fontpick="${esc(n)}" style="font-family:${fontStack(n)}" title="${esc(n)}">${esc(n)}</button>`).join('') || `<div class="note">${t('pal.none')}</div>`;
}
/* Wendet eine Eingabe aus dem Typografie-Editor an. Rückgabe: true = Editor neu zeichnen */
function applyStyleEvent(o, e){
  const el = e.target;
  if(e.type==='click'){
    const p = el.closest('[data-stylepreset]'); if(p){ Object.assign(o, STYLE_PRESETS.find(x=>x.id===p.dataset.stylepreset).s); return 'all'; }
    const f = el.closest('[data-fontpick]'); if(f){ o.font = f.dataset.fontpick; return 'all'; }
    const a = el.closest('[data-skalign]'); if(a){ o.align = a.dataset.skalign; return 'all'; }
    const c = el.closest('[data-fontcat]'); if(c){ ui.fontCat = c.dataset.fontcat; return 'fonts'; }
    return false;
  }
  if(el.dataset.fontq!==undefined){ ui.fontQuery = el.value; return 'fonts'; }
  const k = el.dataset.sk; if(!k) return false;
  let v = el.type==='checkbox' ? el.checked : el.value;
  if(['size','spacing','line','fxDepth','weight'].includes(k)){ v = parseFloat(v); if(!Number.isFinite(v)) return false; }
  if(k==='size') v = clamp(v, 3, 400);
  o[k] = v;
  const box = el.closest('.f');
  if(box){ const out = box.querySelector('output'); if(out) out.textContent = k==='spacing' ? v.toFixed(3) : (Math.round(v*10)/10); box.querySelectorAll(`[data-sk="${k}"]`).forEach(x=>{ if(x!==el) x.value = v; }); }
  return (k==='font' || k==='fx') && e.type==='change' ? 'all' : 'preview';
}

/* ============================================================================
   D. SOFTWARE-BIBLIOTHEK (Badges, Erkennung, Programm-Icons)
   ============================================================================ */
const SW_BUILTIN = {
  blender:     {name:'Blender',               code:'BL', color:'#E87D0D', text:'#ffffff', ext:['blend']},
  zbrush:      {name:'ZBrush',                code:'ZB', color:'#D9A23A', text:'#1a1405', ext:['ztl','zpr','zbr']},
  substance:   {name:'Substance 3D Painter',  code:'Pt', color:'#D8475B', text:'#ffffff', ext:['spp']},
  sdesigner:   {name:'Substance 3D Designer', code:'Ds', color:'#D99A2E', text:'#1a1405', ext:['sbs','sbsar']},
  marvelous:   {name:'Marvelous Designer',    code:'MD', color:'#C0392B', text:'#ffffff', ext:['zprj','zpac','avt']},
  photoshop:   {name:'Photoshop',             code:'Ps', color:'#31A8FF', text:'#001E36', ext:['psd','psb']},
  aftereffects:{name:'After Effects',         code:'Ae', color:'#9C8CFF', text:'#0e0a3a', ext:['aep','aet']},
  davinci:     {name:'DaVinci Resolve',       code:'DR', color:'#4A86C8', text:'#ffffff', ext:['drp','drt']},
  premiere:    {name:'Premiere Pro',          code:'Pr', color:'#7C6CF0', text:'#ffffff', ext:['prproj']},
  illustrator: {name:'Illustrator',           code:'Ai', color:'#FF9A00', text:'#2b1500', ext:['ai']},
  unreal:      {name:'Unreal Engine',         code:'UE', color:'#D8D8D8', text:'#111111', ext:['uproject','umap','uasset']},
  houdini:     {name:'Houdini',               code:'Hn', color:'#FF6A1A', text:'#ffffff', ext:['hip','hipnc','hiplc']},
  maya:        {name:'Maya',                  code:'My', color:'#37A5AF', text:'#ffffff', ext:['ma','mb']},
  c4d:         {name:'Cinema 4D',             code:'C4', color:'#2F5DB6', text:'#ffffff', ext:['c4d']},
  rizom:       {name:'RizomUV',               code:'RZ', color:'#6CB04A', text:'#ffffff', ext:['rizomuv']},
  pureref:     {name:'PureRef',               code:'PR', color:'#8D8A84', text:'#ffffff', ext:['pur']},
  folder:      {name:'', code:'', color:'#9a8660', text:'#ffffff', ext:[]},
  other:       {name:'', code:'··', color:'#6E6A62', text:'#ffffff', ext:[]}
};
function contrastText(hex){
  const h = String(hex).replace('#',''); const f = h.length===3 ? h.split('').map(x=>x+x).join('') : h.slice(0,6);
  const [r,g,b] = [0,2,4].map(i=>parseInt(f.substr(i,2),16)||0);
  return (r*299+g*587+b*114)/1000 > 150 ? '#14120e' : '#ffffff';
}
function swKeys(){ return [...Object.keys(SW_BUILTIN).filter(k=>k!=='folder'&&k!=='other'), ...S.settings.swCustom.map(c=>c.key)]; }
function swInfo(key){
  const custom = S.settings.swCustom.find(c=>c.key===key);
  const base = custom || SW_BUILTIN[key] || SW_BUILTIN.other;
  const ov = S.settings.swOverride[key] || {};
  const color = ov.color || base.color;
  const name = key==='folder' ? t('lk.folder') : key==='other' ? t('lk.other') : base.name;
  return {key: (custom||SW_BUILTIN[key]) ? key : 'other', name, code: ov.code || base.code, color, text: custom ? contrastText(color) : (ov.color ? contrastText(color) : base.text), ext: ov.ext || base.ext, icon: ov.icon || null};
}
function detectSoftware(path){
  const p = String(path).trim();
  const last = basename(p.replace(/[\\/]+$/,''));
  if(/[\\/]$/.test(p) || !last.includes('.')) return 'folder';
  const ext = last.split('.').pop().toLowerCase();
  for(const k of swKeys()) if(swInfo(k).ext.includes(ext)) return k;
  return 'other';
}
function softwareFromName(name){
  const n = String(name).toLowerCase().trim();
  const map = [['substance designer','sdesigner'],['designer','sdesigner'],['substance','substance'],['marvelous','marvelous'],['after effects','aftereffects'],['aftereffects','aftereffects'],['davinci','davinci'],['resolve','davinci'],['premiere','premiere'],['unreal','unreal'],['ue5','unreal'],['cinema','c4d'],['c4d','c4d'],['rizom','rizom'],['photoshop','photoshop'],['illustrator','illustrator'],['zbrush','zbrush'],['blender','blender'],['houdini','houdini'],['maya','maya'],['pureref','pureref']];
  for(const [k,v] of map) if(n.includes(k)) return v;
  const c = S.settings.swCustom.find(x=>x.name.toLowerCase()===n); return c ? c.key : null;
}
function swIconSrc(key){
  const info = swInfo(key);
  if(info.icon) return assetSrc(info.icon);
  if(S.settings.sysIcons) return ui.sysIcons[key] || '';
  return '';
}
function swMini(key){
  const i = swInfo(key), src = swIconSrc(key);
  if(key==='folder') return `<span class="sw-mini" style="background:color-mix(in srgb,${i.color} 22%,transparent);color:${i.color}">${ic('folder',13)}</span>`;
  return src ? `<span class="sw-mini"><img src="${esc(src)}" alt=""></span>` : `<span class="sw-mini" style="background:${i.color};color:${i.text}">${esc(i.code)}</span>`;
}
function swBadge(key, attrs='', cls=''){
  const i = swInfo(key), src = swIconSrc(key);
  const head = key==='folder' ? `<span class="sw-img" style="color:${i.color}">${ic('folder',15)}</span>` : src ? `<span class="sw-img"><img src="${esc(src)}" alt=""></span>` : `<span class="sw-code">${esc(i.code)}</span>`;
  return `<button type="button" class="sw-badge ${cls}" style="--sw:${i.color};--swt:${i.text}" ${attrs}>${head}<span class="sw-name">${esc(i.name)}</span></button>`;
}
/* Programm-Icons der installierten Software (nur Desktop-App) */
/* Wo die Programme typischerweise liegen (Windows). Gesucht wird in dieser Reihenfolge:
   App-Paths-Registry → Startmenü-/Desktop-Verknüpfungen → bekannte Installationsordner → Dateizuordnung. */
const PF = 'C:\\Program Files', PF86 = 'C:\\Program Files (x86)';
const SW_FIND = {
  blender:     {exe:['blender.exe'], lnk:['Blender*'], glob:[PF+'\\Blender Foundation\\Blender*\\blender.exe']},
  zbrush:      {exe:['ZBrush.exe'], lnk:['ZBrush*'], glob:[PF+'\\Maxon ZBrush*\\ZBrush.exe', PF+'\\Pixologic\\ZBrush*\\ZBrush.exe']},
  substance:   {exe:['Adobe Substance 3D Painter.exe'], lnk:['*Substance 3D Painter*','Substance Painter*'], glob:[PF+'\\Adobe\\Adobe Substance 3D Painter\\Adobe Substance 3D Painter.exe']},
  sdesigner:   {exe:['Adobe Substance 3D Designer.exe'], lnk:['*Substance 3D Designer*','Substance Designer*'], glob:[PF+'\\Adobe\\Adobe Substance 3D Designer\\Adobe Substance 3D Designer.exe']},
  marvelous:   {exe:['MarvelousDesigner.exe'], lnk:['Marvelous Designer*'], glob:[PF+'\\Marvelous Designer*\\MarvelousDesigner*.exe', PF+'\\CLO Virtual Fashion\\Marvelous Designer*\\*.exe']},
  photoshop:   {exe:['Photoshop.exe'], lnk:['Adobe Photoshop*','Photoshop*'], glob:[PF+'\\Adobe\\Adobe Photoshop*\\Photoshop.exe']},
  aftereffects:{exe:['AfterFX.exe'], lnk:['Adobe After Effects*','After Effects*'], glob:[PF+'\\Adobe\\Adobe After Effects*\\Support Files\\AfterFX.exe']},
  davinci:     {exe:['Resolve.exe'], lnk:['DaVinci Resolve*'], glob:[PF+'\\Blackmagic Design\\DaVinci Resolve\\Resolve.exe']},
  premiere:    {exe:['Adobe Premiere Pro.exe'], lnk:['Adobe Premiere Pro*'], glob:[PF+'\\Adobe\\Adobe Premiere Pro*\\Adobe Premiere Pro.exe']},
  illustrator: {exe:['Illustrator.exe'], lnk:['Adobe Illustrator*'], glob:[PF+'\\Adobe\\Adobe Illustrator*\\Support Files\\Contents\\Windows\\Illustrator.exe']},
  unreal:      {exe:['UnrealEditor.exe','EpicGamesLauncher.exe'], lnk:['Unreal Engine*','Epic Games Launcher*'], glob:[PF+'\\Epic Games\\UE_*\\Engine\\Binaries\\Win64\\UnrealEditor.exe', PF86+'\\Epic Games\\Launcher\\Portal\\Binaries\\Win64\\EpicGamesLauncher.exe']},
  houdini:     {exe:['houdini.exe','houdinifx.exe'], lnk:['Houdini*'], glob:[PF+'\\Side Effects Software\\Houdini*\\bin\\houdini*.exe']},
  maya:        {exe:['maya.exe'], lnk:['Maya 20*','Maya*'], glob:[PF+'\\Autodesk\\Maya*\\bin\\maya.exe']},
  c4d:         {exe:['Cinema 4D.exe'], lnk:['Cinema 4D*','Maxon Cinema 4D*'], glob:[PF+'\\Maxon Cinema 4D*\\Cinema 4D.exe']},
  rizom:       {exe:['rizomuv.exe'], lnk:['RizomUV*'], glob:[PF+'\\Rizom Lab\\RizomUV*\\rizomuv.exe']},
  pureref:     {exe:['PureRef.exe'], lnk:['PureRef*'], glob:[PF+'\\PureRef\\PureRef.exe']}
};
function loadSystemIcons(force){
  try{ const c = JSON.parse(localStorage.getItem('vf.sysicons2')||'{}'); if(c && typeof c==='object') ui.sysIcons = c; }catch(e){}
  if(!IS_DESKTOP || !S.settings.sysIcons || typeof window.vfIcons!=='function') return;
  // Einmal pro Sitzung suchen (die Suche läuft im Hintergrund, die UI nutzt bis dahin den Cache).
  if(ui.sysIconsAsked && !force) return; ui.sysIconsAsked = true;
  const reqs = swKeys().map(k => {
    const f = SW_FIND[k] || {}, i = swInfo(k);
    const name = i.name || '';
    return {key:k, exe:f.exe||[], lnk:f.lnk||(name?[name+'*']:[]), glob:f.glob||[], ext:i.ext[0]||'', path:''};
  });
  window.vfOnIcons = icons => {
    ui.sysIcons = Object.assign({}, icons||{});
    try{ localStorage.setItem('vf.sysicons2', JSON.stringify(ui.sysIcons)); localStorage.removeItem('vf.sysicons'); }catch(e){}
    rerenderActive();
  };
  try{ window.vfIcons(reqs); }catch(e){}
}
/* Existenzprüfung verknüpfter Dateien (Desktop) */
async function checkPaths(paths){
  if(!IS_DESKTOP || !paths.length) return;
  try{
    const res = await window.vfExists(paths);
    let changed = false;
    for(const [p,v] of Object.entries(res||{})){ if(ui.exists[p]!==v){ ui.exists[p] = v; changed = true; } }
    if(changed) document.querySelectorAll('[data-path-check]').forEach(b=>b.classList.toggle('missing', ui.exists[b.dataset.pathCheck]===false));
  }catch(e){}
}

/* ============================================================================
   E. PROZEDURALE COVER-MOTIVE
   ============================================================================ */
const PRESETS = ['arcane','neon','tide','brass','dune','ink','storm','forge'];
const PRESET_NAMES = {arcane:['Arkaner Sumpf','Arcane swamp'], neon:['Neon-Horizont','Neon horizon'], tide:['Versunkene Stadt','Sunken city'], brass:['Messing-Werk','Brass works'], dune:['Dünen-Dämmerung','Dune dusk'], ink:['Pergament & Tinte','Parchment & ink'], storm:['Sturmgipfel','Storm peak'], forge:['Esse','The forge']};
const _art = {};
function presetArt(id){
  if(_art[id]) return _art[id];
  let s = '';
  switch(id){
    case 'neon': {
      let g = ''; for(let i = 0; i <= 12; i++) g += `<line x1="300" y1="560" x2="${-300+i*100}" y2="900" stroke="#ff3d81" stroke-opacity=".35"/>`;
      for(let j = 0; j < 9; j++){ const y = (560+Math.pow(j/8,1.9)*340).toFixed(1); g += `<line x1="0" y1="${y}" x2="600" y2="${y}" stroke="#36d6ff" stroke-opacity=".28"/>`; }
      let st = ''; for(let k = 0; k < 5; k++) st += `<rect x="140" y="${468+k*19}" width="320" height="${3+k*2}" fill="#170d2c"/>`;
      s = `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#06071a"/><stop offset=".62" stop-color="#1b0f33"/><stop offset="1" stop-color="#05060c"/></linearGradient><linearGradient id="sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd27a"/><stop offset="1" stop-color="#ff3d81"/></linearGradient></defs><rect width="600" height="900" fill="url(#g)"/><circle cx="300" cy="420" r="150" fill="url(#sun)" opacity=".9"/>${st}<path d="M0 560 L60 500 L90 520 L150 470 L200 540 L260 520 L300 560 Z M300 560 L360 510 L420 530 L470 480 L530 520 L600 490 L600 560 Z" fill="#0b0818"/><rect y="560" width="600" height="340" fill="#06060f"/>${g}`;
      break; }
    case 'tide': {
      let b = ''; for(let i = 0; i < 14; i++){ const x = 40+((i*137)%520), y = 120+((i*251)%640), r = 3+(i%4)*2; b += `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#bff3ea" stroke-opacity=".35"/>`; }
      s = `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d4a55"/><stop offset=".55" stop-color="#0b2e38"/><stop offset="1" stop-color="#030e12"/></linearGradient></defs><rect width="600" height="900" fill="url(#g)"/><polygon points="240,0 300,0 420,900 160,900" fill="#9ff0e0" opacity=".07"/><polygon points="330,0 380,0 560,900 380,900" fill="#9ff0e0" opacity=".05"/><g fill="#0a2a31" stroke="#c9a45c" stroke-opacity=".55"><rect x="110" y="420" width="60" height="420"/><rect x="430" y="420" width="60" height="420"/><rect x="215" y="300" width="170" height="540"/><path d="M200 300 Q300 170 400 300 Z"/></g><path d="M300 120 V420 M262 170 Q262 225 300 225 Q338 225 338 170" fill="none" stroke="#e7c77d" stroke-width="7" stroke-linecap="round"/>${b}<rect y="820" width="600" height="80" fill="#02090c" opacity=".8"/>`;
      break; }
    case 'brass':
      s = `<defs><radialGradient id="g" cx="50%" cy="42%" r="70%"><stop offset="0" stop-color="#5a3518"/><stop offset=".55" stop-color="#23160f"/><stop offset="1" stop-color="#0f0a08"/></radialGradient></defs><rect width="600" height="900" fill="url(#g)"/><circle cx="300" cy="380" r="150" fill="none" stroke="#d99a3c" stroke-width="16" stroke-dasharray="26 16" opacity=".85"/><circle cx="300" cy="380" r="105" fill="none" stroke="#b07a2c" stroke-width="3"/><circle cx="455" cy="230" r="70" fill="none" stroke="#c48a36" stroke-width="10" stroke-dasharray="16 11" opacity=".6"/><circle cx="135" cy="560" r="85" fill="none" stroke="#c48a36" stroke-width="10" stroke-dasharray="18 12" opacity=".5"/><path d="M300 380 L300 300 M300 380 L360 410" stroke="#f2c46d" stroke-width="6" stroke-linecap="round"/><circle cx="300" cy="380" r="12" fill="#f2c46d"/><path d="M0 720 H600 V900 H0 Z" fill="#120c09"/><path d="M60 720 V560 H140 M540 720 V600 H470" fill="none" stroke="#8a5a26" stroke-width="12"/>`;
      break;
    case 'dune':
      s = `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1d3a"/><stop offset=".45" stop-color="#a5523a"/><stop offset=".7" stop-color="#e2a35e"/><stop offset="1" stop-color="#3a2116"/></linearGradient></defs><rect width="600" height="900" fill="url(#g)"/><circle cx="380" cy="380" r="70" fill="#ffe2a8" opacity=".9"/><path d="M0 560 Q150 470 300 540 T600 520 V900 H0 Z" fill="#8a4a2c"/><path d="M0 640 Q200 560 380 640 T600 620 V900 H0 Z" fill="#5c2f1d"/><path d="M0 740 Q250 660 420 740 T600 730 V900 H0 Z" fill="#2e1710"/><path d="M120 470 L135 380 L150 470 Z M150 470 L160 410 L170 470 Z" fill="#2e1710" opacity=".8"/>`;
      break;
    case 'ink':
      s = `<defs><radialGradient id="g" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="#efe5d0"/><stop offset="1" stop-color="#cdbc98"/></radialGradient></defs><rect width="600" height="900" fill="url(#g)"/><circle cx="300" cy="360" r="190" fill="none" stroke="#2a221a" stroke-width="2.5"/><circle cx="300" cy="360" r="172" fill="none" stroke="#2a221a" stroke-width=".8"/><path d="M150 520 C220 300 380 300 450 520" fill="none" stroke="#7a2c20" stroke-width="10" stroke-linecap="round" opacity=".85"/><path d="M300 170 V550" stroke="#2a221a" stroke-width="1.2"/><rect x="40" y="40" width="520" height="820" fill="none" stroke="#2a221a" stroke-width="1.2"/><rect x="52" y="52" width="496" height="796" fill="none" stroke="#2a221a" stroke-width=".6"/>`;
      break;
    case 'storm': {
      let r = ''; for(let i = 0; i < 40; i++){ const x = (i*61)%600, y = (i*113)%700; r += `<line x1="${x}" y1="${y}" x2="${x-12}" y2="${y+40}" stroke="#9fb6d6" stroke-opacity=".25"/>`; }
      s = `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#121a2a"/><stop offset=".6" stop-color="#26324a"/><stop offset="1" stop-color="#0a0d14"/></linearGradient></defs><rect width="600" height="900" fill="url(#g)"/><ellipse cx="300" cy="220" rx="320" ry="110" fill="#3a4a66" opacity=".55"/><path d="M330 120 L290 260 L330 255 L280 400" fill="none" stroke="#e8f2ff" stroke-width="5" stroke-linejoin="round"/><path d="M0 900 L0 640 L120 520 L210 600 L320 430 L440 590 L520 520 L600 600 L600 900 Z" fill="#0c111b"/><path d="M320 430 L360 485 L300 470 Z" fill="#e8f2ff" opacity=".7"/>${r}`;
      break; }
    case 'forge': {
      let sp = ''; for(let i = 0; i < 26; i++){ const x = 200+((i*73)%220), y = 300+((i*131)%300); sp += `<circle cx="${x}" cy="${y}" r="${1+(i%3)}" fill="#ffc35a" opacity="${(.4+(i%5)*.12).toFixed(2)}"/>`; }
      s = `<defs><radialGradient id="g" cx="50%" cy="62%" r="60%"><stop offset="0" stop-color="#ff7a1a"/><stop offset=".35" stop-color="#7a2a0c"/><stop offset="1" stop-color="#120806"/></radialGradient></defs><rect width="600" height="900" fill="url(#g)"/><path d="M170 640 H430 L400 700 H200 Z" fill="#1a0f0b"/><path d="M215 600 H385 V640 H215 Z" fill="#2a1a12"/><path d="M300 600 C260 520 330 470 300 400 C360 460 350 540 300 600 Z" fill="#ffcf6a" opacity=".85"/><rect x="250" y="700" width="100" height="160" fill="#140b08"/>${sp}`;
      break; }
    default: {
      let f = ''; for(let i = 0; i < 22; i++){ const x = 30+((i*173)%540), y = 180+((i*311)%560); f += `<circle cx="${x}" cy="${y}" r="${1.5+(i%3)}" fill="#f7d47a" opacity="${(.35+(i%4)*.15).toFixed(2)}"/>`; }
      s = `<defs><radialGradient id="g" cx="50%" cy="42%" r="62%"><stop offset="0" stop-color="#2f7a5c" stop-opacity=".55"/><stop offset=".5" stop-color="#0f2a22" stop-opacity=".6"/><stop offset="1" stop-color="#07090c"/></radialGradient></defs><rect width="600" height="900" fill="#07090c"/><rect width="600" height="900" fill="url(#g)"/><path d="M0 900 V180 Q110 360 80 900 Z M600 900 V140 Q480 360 520 900 Z" fill="#0b1513" opacity=".85"/><circle cx="300" cy="380" r="175" fill="none" stroke="#d6b064" stroke-width="1.5" stroke-dasharray="6 5" opacity=".6"/><circle cx="300" cy="380" r="140" fill="none" stroke="#5fc79a" stroke-opacity=".35"/><circle cx="300" cy="380" r="62" fill="#e8c77a" opacity=".12"/><path d="M300 250 L330 380 L300 510 L270 380 Z" fill="none" stroke="#e8c77a" stroke-width="1.5" opacity=".8"/><ellipse cx="300" cy="720" rx="360" ry="60" fill="#0f1d19" opacity=".9"/>${f}`;
    }
  }
  _art[id] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 900" preserveAspectRatio="xMidYMid slice">${s}</svg>`);
  return _art[id];
}

/* ============================================================================
   F. ASSETS (Bilder werden getrennt & dedupliziert gespeichert)
   ============================================================================ */
function addAsset(dataUrl, store){
  const target = store || S.assets;
  const id = 'a' + cyrb(dataUrl.length + ':' + dataUrl.slice(0,2000) + dataUrl.slice(-2000) + (dataUrl.length > 8000 ? dataUrl.slice(dataUrl.length>>1, (dataUrl.length>>1)+2000) : ''));
  target[id] = dataUrl;
  return 'asset:' + id;
}
/* Videos: einmalig in eine Blob-URL wandeln (schneller & speicherschonender als riesige data:-URLs im DOM) */
const _blobURLs = new Map();
function mediaURL(ref){
  const src = assetSrc(ref); if(!isDataVideo(src)) return src;
  if(_blobURLs.has(ref)) return _blobURLs.get(ref);
  try{
    const i = src.indexOf(','), mime = src.slice(5, src.indexOf(';')), bin = atob(src.slice(i+1));
    const u8 = new Uint8Array(bin.length); for(let k = 0; k < bin.length; k++) u8[k] = bin.charCodeAt(k);
    const url = URL.createObjectURL(new Blob([u8], {type:mime})); _blobURLs.set(ref, url); return url;
  }catch(e){ return src; }
}
/* Verknüpfte Dateien auf dem PC anzeigen (Desktop-App: Laufwerke sind als lokale Hosts eingebunden) */
const MEDIA_EXT = {image:['png','jpg','jpeg','webp','gif','bmp','avif','svg'], video:['mp4','webm','mov','m4v','ogv','mkv']};
function fileKind(path){ const e = (basename(path).split('.').pop() || '').toLowerCase(); return MEDIA_EXT.image.includes(e) ? 'image' : MEDIA_EXT.video.includes(e) ? 'video' : 'other'; }
function localFileURL(path){
  const p = String(path||'').trim(), m = p.match(/^([a-zA-Z]):[\\/](.*)$/);
  if(!m){
    /* macOS/Linux-App: absolute Pfade über den lokalen App-Server (mit Schlüssel) */
    if(p.startsWith('/') && window.__vfFileBase) return window.__vfFileBase + p.split('/').map(encodeURIComponent).join('/');
    return location.protocol==='file:' && p.startsWith('/') ? 'file://' + p.split('/').map(encodeURIComponent).join('/') : '';
  }
  const rest = m[2].split(/[\\/]+/).map(encodeURIComponent).join('/');
  if(IS_DESKTOP) return `https://drive-${m[1].toLowerCase()}.vertexforge.example/${rest}`;
  return location.protocol==='file:' ? `file:///${m[1].toUpperCase()}:/${rest}` : '';
}
function assetSrc(ref){
  if(!ref) return '';
  if(ref.startsWith('asset:')) return S.assets[ref.slice(6)] || '';
  return isDataImg(ref) ? ref : '';
}
function collectRefs(projects, settings){
  const refs = new Set(), add = r => { if(typeof r==='string' && r.startsWith('asset:')) refs.add(r.slice(6)); };
  for(const p of projects){
    add(p.cover.image);
    p.boards.forEach(b=>b.nodes.forEach(n=>add(n.src)));
    p.shots.forEach(s=>add(s.thumb));
  }
  if(settings) Object.values(settings.swOverride||{}).forEach(o=>add(o && o.icon));
  return refs;
}

/* ============================================================================
   G. DATENMODELL, BEISPIELE & NORMALISIERUNG (inkl. Migration v1/v2)
   ============================================================================ */
function defaultCover(o={}){
  return Object.assign({
    title:Object.assign(textDefaults(), {text:t('np.defaultName'), x:50, y:76}),
    banner:Object.assign(textDefaults({font:'JetBrains Mono', size:8.5, weight:500, spacing:.35, line:1.4, foil:'plain', color:'#e9e2d0', fx:'none'}), {text:L('KURZFILM · ','SHORT FILM · ') + new Date().getFullYear(), x:50, y:89}),
    ribbon:t('rb.prod'), ribbonColor:'#c9a45c', preset:'arcane', image:'', focusX:50, focusY:50, vignette:.75
  }, o);
}
function newBoard(name){ return {id:uid('brd'), name, cam:{x:80,y:70,z:1}, nodes:[], connections:[], style:{bg:'dots', node:'studio'}}; }
function newTask(text, deadline, prio='med', est=0, status='todo'){ return {id:uid('tk'), text, status, deadline, prio, est}; }

function demoProjects(){
  const P = 'D:\\Projekte\\FrogWizard\\';
  const frog = {
    id:'proj_frog', theme:'fantasy', fps:24,
    cover: defaultCover({
      title:Object.assign(textDefaults(), {text:'FROG\nWIZARD', font:'Cinzel Decorative', size:40, weight:900, spacing:.06, foil:'gold', fx:'extrude', fxColor:'#4a3010', fxDepth:7, x:50, y:73}),
      banner:Object.assign(textDefaults({font:'JetBrains Mono', size:8.5, weight:500, spacing:.35, line:1.4, foil:'plain', color:'#e9e2d0', fx:'none'}), {text:L('ARKANER SUMPF · 3D-KURZFILM','ARCANE SWAMP · 3D SHORT'), x:50, y:89}),
      ribbon:t('rb.prod'), ribbonColor:'#9bb07a', preset:'arcane'}),
    phases:[
      {id:'ph_1', title:L('Konzept, Silhouetten & Referenzen','Concept, silhouettes & references'), tools:['PureRef','Photoshop'], start:rel(-42), deadline:rel(-21), tasks:[
        {id:'tk_1', text:L('Referenzen für Frosch-Anatomie & Zauberer-Robe sammeln','Gather references for frog anatomy & wizard robe'), status:'done', deadline:rel(-35), prio:'high', est:4},
        {id:'tk_2', text:L('Silhouetten & Farbkonzepte für Frosch, Stab & Tasche','Silhouettes & color concepts for frog, staff & bag'), status:'done', deadline:rel(-24), prio:'med', est:6}]},
      {id:'ph_2', title:L('High-Poly Sculpting & Kleidungs-Simulation','High-poly sculpting & cloth simulation'), tools:['ZBrush','Marvelous Designer'], start:rel(-21), deadline:rel(4), tasks:[
        {id:'tk_3', text:L('Frosch-Körper Blockout & Primärformen in A-Pose','Frog body blockout & primary forms in A-pose'), status:'done', deadline:rel(-12), prio:'high', est:10},
        {id:'tk_4', text:L('Robe & Gurte in Marvelous Designer schneiden und simulieren','Cut and simulate robe & straps in Marvelous Designer'), status:'wip', deadline:rel(-2), prio:'critical', est:8},
        {id:'tk_5', text:L('Wurzelstab, Hut & Hautdetails ausarbeiten','Detail root staff, hat & skin'), status:'todo', deadline:rel(4), prio:'high', est:9}]},
      {id:'ph_3', title:L('Retopologie & UDIM-Unwrapping','Retopology & UDIM unwrapping'), tools:['Blender','RizomUV'], start:rel(4), deadline:rel(18), tasks:[
        {id:'tk_6', text:L('Körper in saubere Animations-Loops retopologisieren','Retopologize body into clean animation loops'), status:'todo', deadline:rel(12), prio:'high', est:12},
        {id:'tk_7', text:L('Kleidung, Tasche & Phiolen auf UDIMs 1001–1005 verteilen','Lay out clothes, bag & vials on UDIMs 1001–1005'), status:'todo', deadline:rel(18), prio:'med', est:6}]},
      {id:'ph_4', title:L('Texturierung, SSS-Shading & Grooming','Texturing, SSS shading & grooming'), tools:['Substance Painter','Blender'], start:rel(18), deadline:rel(36), tasks:[
        {id:'tk_8', text:L('High-to-Low Maps baken & UDIMs texturieren','Bake high-to-low maps & texture UDIMs'), status:'todo', deadline:rel(27), prio:'high', est:14},
        {id:'tk_9', text:L('Subsurface-Haut & Glas-Elixiere in Cycles aufbauen','Build subsurface skin & glass elixirs in Cycles'), status:'todo', deadline:rel(33), prio:'med', est:6},
        {id:'tk_10', text:L('Moos auf dem Hut mit Hair Curves','Moss on the hat with hair curves'), status:'todo', deadline:rel(36), prio:'low', est:3}]},
      {id:'ph_5', title:L('Rigging, Blendshapes & Cloth','Rigging, blendshapes & cloth'), tools:['Blender'], start:rel(36), deadline:rel(55), tasks:[
        {id:'tk_11', text:L('Körper- & Gesichts-Rig, Weight-Painting prüfen','Body & face rig, check weight painting'), status:'todo', deadline:rel(46), prio:'high', est:12},
        {id:'tk_12', text:L('Kehlsack-Blendshapes fürs Zaubern','Throat-sac blendshapes for spellcasting'), status:'todo', deadline:rel(55), prio:'med', est:5}]},
      {id:'ph_6', title:L('Animation, Rendering & Finishing','Animation, rendering & finishing'), tools:['Blender','After Effects','DaVinci Resolve'], start:rel(55), deadline:rel(84), tasks:[
        {id:'tk_13', text:L('Shots animieren & Caches baken','Animate shots & bake caches'), status:'todo', deadline:rel(70), prio:'high', est:30},
        {id:'tk_14', text:L('Compositing & Glühwürmchen-FX in After Effects','Compositing & firefly FX in After Effects'), status:'todo', deadline:rel(78), prio:'med', est:10},
        {id:'tk_15', text:L('Schnitt, Grading & Ton in DaVinci Resolve','Edit, grade & sound in DaVinci Resolve'), status:'todo', deadline:rel(84), prio:'critical', est:12}]}
    ],
    boards:[{
      id:'brd_main', name:L('Charakter & Props','Character & props'), cam:{x:90,y:110,z:.85},
      nodes:[
        {id:'nd_title', type:'text', x:70, y:-60, text:L('MEISTER QUAK\nder Sumpfmagier','MASTER CROAK\nthe swamp mage'), st:Object.assign(textDefaults(), {font:'Cinzel Decorative', size:40, weight:900, align:'left', foil:'gold', fx:'extrude', fxColor:'#3a2508', fxDepth:6, spacing:.03, line:1.05})},
        {id:'nd_frog', type:'card', x:70, y:120, w:270, h:150, cat:L('Protagonist · Rig','Protagonist · rig'), title:L('Meister Quak','Master Croak'), desc:L('142 Jahre alter Sumpfmagier. Bläht beim Zaubern den leuchtenden Kehlsack auf.','142-year-old swamp mage. Inflates his glowing throat sac when casting.'), stage:2, color:'',
          links:[{sw:'zbrush', path:P+'sculpt\\quak_body_v07.ztl'},{sw:'blender', path:P+'quak_master.blend'}]},
        {id:'nd_staff', type:'mindmap', x:480, y:40, w:250, h:110, cat:L('Hero-Prop · Emission','Hero prop · emission'), title:L('Wurzelstab des Ahnen','Root staff of the elder'), desc:L('Knorriges Wurzelholz mit eingeschlossenem Leuchtkäfer im Bernstein.','Gnarled root wood with a firefly trapped in amber.'), color:''},
        {id:'nd_bag', type:'card', x:480, y:220, w:260, h:140, cat:'Marvelous · Substance', title:L('Alchemie-Ledertasche','Alchemy leather bag'), desc:L('Vernähtes Leder, Messingschnallen, Schlaufen für sechs Phiolen.','Stitched leather, brass buckles, loops for six vials.'), stage:1, color:'#c07a4f', links:[{sw:'marvelous', path:P+'cloth\\tasche_gurte.zprj'}]},
        {id:'nd_note', type:'note', x:800, y:40, w:220, h:150, text:L('Look: feuchte Haut, warmes Bernsteinlicht, kühler Nebel. Referenz: Laubfrosch-Makrofotos.','Look: wet skin, warm amber light, cool fog. Reference: tree-frog macro photos.'), color:''},
        {id:'nd_cc1', type:'char', x:70, y:430, w:250, h:350, kind:'character', title:L('Meister Quak','Master Croak'), artist:'Jan', links:[{sw:'zbrush', path:P+'sculpt\\quak_body_v07.ztl'},{sw:'blender', path:P+'quak_master.blend'}], sub:L('Sumpfmagier · Protagonist','Swamp mage · protagonist'), art:'ink', stats:[90,70,35,20,0],
          desc:L('142 Jahre alt, gemächlich, aber gefährlich, wenn der Kehlsack zu leuchten beginnt. Silhouette: runder Körper, lange Finger, schwerer Umhang.','142 years old, unhurried, but dangerous once the throat sac starts to glow. Silhouette: round body, long fingers, heavy cloak.'),
          facts:[{k:'Polycount',v:'48k tris'},{k:L('Texturen','Textures'),v:'4× 4K UDIM'},{k:L('Größe','Height'),v:'1.10 m'}]},
        {id:'nd_cc2', type:'char', x:350, y:430, w:250, h:350, kind:'prop', title:L('Wurzelstab','Root staff'), artist:'Jan', sub:L('Hero-Prop · Emission','Hero prop · emission'), links:[{sw:'blender', path:P+'props\\root_staff.blend'},{sw:'substance', path:P+'props\\root_staff.spp'}], art:'brass', stats:[100,85,60,40,0],
          desc:L('Knorriges Wurzelholz mit einem Glühwürmchen in Bernstein. Der Bernstein bekommt Emission und Subsurface.','Gnarled root wood with a firefly trapped in amber. The amber gets emission and subsurface.'), facts:[{k:'Polycount',v:'9k tris'},{k:L('Material','Material'),v:'Wood, amber'}]},
        {id:'nd_cc3', type:'char', x:630, y:430, w:250, h:350, kind:'environment', title:L('Nebelsumpf','Fog swamp'), sub:L('Hauptschauplatz','Main location'), art:'storm', stats:[40,10,20,0,0],
          desc:L('Zypressenwurzeln, Bodennebel, Glühwürmchen. Fokus auf Lichtstimmung statt Detail.','Cypress roots, ground fog, fireflies. Focus on lighting mood rather than detail.'), facts:[{k:L('Fläche','Area'),v:'40 × 40 m'}], flip:false}
      ],
      connections:[
        {id:'cn_1', from:'nd_frog', to:'nd_staff', label:L('trägt rechts','carries right')},
        {id:'cn_2', from:'nd_frog', to:'nd_bag', label:L('Schultergurt','shoulder strap')}
      ]
    }],
    shots:[
      {uid:'sh_1', code:'SH_010', seq:'SQ01_SWAMP', desc:L('Establishing: Nebliger Sumpfwald, Laterne am Wurzelstab taucht aus dem Dunst auf.','Establishing: foggy swamp forest, the lantern on the staff emerges from the mist.'), frames:96, lens:'35mm Anamorph', vfx:'Volumetric Fog + Fireflies', thumb:'', status:{layout:'done',anim:'done',sim:'wip',light:'wip',render:'todo'}},
      {uid:'sh_2', code:'SH_020', seq:'SQ01_SWAMP', desc:L('Close-Up: Goldene Pupillen weiten sich, Kehlsack leuchtet blau auf.','Close-up: golden pupils widen, the throat sac glows blue.'), frames:72, lens:'85mm Macro', vfx:'Blendshape + SSS emission', thumb:'', status:{layout:'done',anim:'wip',sim:'todo',light:'todo',render:'todo'}},
      {uid:'sh_3', code:'SH_030', seq:'SQ02_SPELL', desc:L('Low-Angle: Der Wurzelstab stößt ins Moos, Druckwelle bewegt den Umhang.','Low angle: the staff strikes the moss, a shockwave moves the cloak.'), frames:120, lens:'24mm Wide', vfx:'Cloth wind + moss particles', thumb:'', status:{layout:'wip',anim:'todo',sim:'todo',light:'todo',render:'todo'}}
    ],
    chapters:[{id:'ch_1', title:L('Szene 1 — Das Flüstern im Sumpf','Scene 1 — Whispers in the swamp'), body:L('EXT. NEBELSUMPF – NACHT\n\nDichter Bodennebel zieht über knorrige Zypressenwurzeln. Nur das bernsteinfarbene Schimmern des Wurzelstab durchbricht die Dunkelheit.\n\n[KAMERA: SH_010 – 35mm Anamorph, langsame Fahrt]\n\nMEISTER QUAK tritt auf einen bemoosten Findling. Seine Alchemie-Ledertasche klirrt leise.\n\nMEISTER QUAK\n(tiefes, resonantes Quaken)\nDie Runen unter dem Moor erwachen zu früh …','EXT. FOG SWAMP – NIGHT\n\nDense ground fog drifts over gnarled cypress roots. Only the amber shimmer of the Root staff pierces the dark.\n\n[CAMERA: SH_010 – 35mm anamorphic, slow push]\n\nMASTER CROAK steps onto a mossy boulder. His Alchemy leather bag clinks softly.\n\nMASTER CROAK\n(deep, resonant croak)\nThe runes beneath the bog are waking too early …')}],
    lore:[
      {id:'lr_1', name:L('Meister Quak','Master Croak'), category:L('Charakter · Hauptfigur','Character · lead'), polyTarget:'45,000 quads (UDIM 1001–1003)', shader:'Principled BSDF + Subsurface', notes:L('Kehlsack braucht eigene Shape-Keys und eine verknüpfte Emission-Map.','Throat sac needs its own shape keys and a linked emission map.'), stage:2, links:[{sw:'zbrush', path:P+'sculpt\\quak_body_v07.ztl'}]},
      {id:'lr_2', name:L('Wurzelstab','Root staff'), category:'Hero prop', polyTarget:'12,500 quads (UDIM 1004)', shader:L('Raues Wurzelholz + Harz','Rough root wood + resin'), notes:'', stage:1, links:[]},
      {id:'lr_3', name:L('Alchemie-Ledertasche','Alchemy leather bag'), category:L('Ausrüstung','Equipment'), polyTarget:'8,200 quads (UDIM 1005)', shader:L('Sattelleder + Messing','Saddle leather + brass'), notes:'', stage:1, links:[{sw:'marvelous', path:P+'cloth\\tasche_gurte.zprj'}]}
    ]
  };
  const neon = {
    id:'proj_neon', theme:'scifi', fps:24,
    cover: defaultCover({
      title:Object.assign(textDefaults(), {text:L('SEKTOR 9','SECTOR 9'), font:'Orbitron', size:34, weight:900, spacing:.1, foil:'neon', fx:'glow', fxColor:'#00b7ff', fxDepth:6, shadow:false, x:50, y:21}),
      banner:Object.assign(textDefaults({font:'Rajdhani', size:10, weight:600, spacing:.2, line:1.3, foil:'plain', color:'#9fe8f2', fx:'none'}), {text:L('[ HARD-SURFACE · FAHRZEUGE ]','[ HARD SURFACE · VEHICLES ]'), x:50, y:30}),
      ribbon:t('rb.concept'), ribbonColor:'#8fa3b8', preset:'neon'}),
    phases:buildTemplate('hardsurface', rel(-6)),
    boards:[{id:'brd_c1', name:L('Fahrzeug-Specs','Vehicle specs'), cam:{x:80,y:80,z:1}, nodes:[
      {id:'nc_1', type:'card', x:100, y:120, w:270, h:130, cat:L('Hero-Fahrzeug','Hero vehicle'), title:'K-900 Spinner', desc:L('Gepanzerte Limousine mit vertikalen VTOL-Turbinen.','Armored limousine with vertical VTOL turbines.'), stage:1, color:'#5cc4d3', links:[{sw:'unreal', path:'D:\\Projekte\\Sektor9\\Sektor9.uproject'}]}], connections:[]}],
    shots:[], chapters:[{id:'ch_c1', title:L('Sequenz 01 — Ankunft','Sequence 01 — Arrival'), body:'EXT. SKYLINE ROOFTOP – NIGHT\n\n'}], lore:[]
  };
  const atlantis = {
    id:'proj_atlantis', theme:'mythology', fps:25,
    cover: defaultCover({
      title:Object.assign(textDefaults(), {text:'ATLANTIS', font:'Cinzel Decorative', size:34, weight:700, spacing:.08, foil:'gold', fx:'emboss', fxColor:'#1e3a33', fxDepth:8, x:50, y:79}),
      banner:Object.assign(textDefaults({font:'Cormorant Garamond', size:11, weight:600, spacing:.15, line:1.3, foil:'plain', color:'#e9e2d0', fx:'none'}), {text:L('══ ZITADELLE DES POSEIDON ══','══ CITADEL OF POSEIDON ══'), x:50, y:89}),
      ribbon:L('WELT-BIBEL','WORLD BIBLE'), ribbonColor:'#79b3a2', preset:'tide'}),
    phases:buildTemplate('environment', rel(-3)),
    boards:[newBoard(L('Architektur','Architecture'))], shots:[],
    chapters:[{id:'ch_a1', title:L('Prolog — Die Goldenen Ringe','Prologue — The golden rings'), body:''}],
    lore:[{id:'lra_1', name:L('Orichalkum','Orichalcum'), category:'Material', polyTarget:'Procedural shader', shader:L('Gold-Kupfer mit türkiser Patina','Gold-copper with turquoise patina'), notes:'', stage:0, links:[]}]
  };
  return [frog, neon, atlantis];
}
function blankProject(name, template, start, theme){
  const p = {
    id:uid('proj'), theme:theme || 'fantasy', fps:24, createdAt:Date.now(), updatedAt:Date.now(),
    cover:defaultCover({preset:PRESETS[Math.floor(Math.random()*PRESETS.length)], ribbon:t('rb.pre')}),
    phases:template && template!=='empty' ? buildTemplate(template, start || rel(0)) : [],
    boards:[newBoard(L('Haupt-Denkbrett','Main board'))], shots:[],
    chapters:[{id:uid('ch'), title:t('sy.sceneN',{n:1}), body:L('EXT. SCHAUPLATZ – TAG\n\n','EXT. LOCATION – DAY\n\n')}], lore:[]
  };
  if(name) p.cover.title.text = name;
  return p;
}

/* Kontext zum Übernehmen alter, inline gespeicherter Bilder in die Asset-Ablage */
function assetCtx(rawAssets){
  const assets = {};
  if(rawAssets && typeof rawAssets==='object') for(const [k,v] of Object.entries(rawAssets)) if(/^[\w-]{1,40}$/.test(k) && isDataImg(v)) assets[k] = v;
  return {assets, ref(v){
    if(typeof v!=='string' || !v) return '';
    if(v.startsWith('asset:')) return assets[v.slice(6)] || (S && S.assets && S.assets[v.slice(6)]) ? v : '';
    if(isDataImg(v)) return addAsset(v, assets);
    return '';
  }};
}
function normLinks(l){ return arr(l).map(x=>({sw:(x && (SW_BUILTIN[x.sw] || String(x.sw||'').startsWith('c_'))) ? x.sw : 'other', path:str(x && x.path).trim()})).filter(x=>x.path).slice(0,40); }
function normalizeCover(c, A){
  c = c || {}; const D = defaultCover();
  let title = c.title, banner = c.banner;
  if(!title || typeof title!=='object'){
    const ly = c.position==='pos-top' ? 20 : c.position==='pos-center' ? 50 : 76;
    const foilMap = {'foil-gold':'gold','foil-chrome':'chrome','foil-ivory':'ivory','foil-cyber':'neon','foil-crimson':'crimson'};
    const ts = num(c.titleSize, c.fontSize ? c.fontSize*1.25 : 30, 3, 400), bs = num(c.bannerSize, 8.5, 3, 400);
    title = {text:typeof c.title==='string' ? c.title : D.title.text, x:c.titlePos && c.titlePos.x, y:(c.titlePos && c.titlePos.y) ?? ly,
      font:c.titleFont || fontFromStack(c.font), size:ts, weight:c.titleWeight, spacing:num(c.titleSpacing ?? c.letterSpacing, 2)/ts, line:c.titleLine,
      foil:c.titleFoil || foilMap[c.foil], color:c.titleColor, shadow:c.titleShadow!==false, fx:'none'};
    banner = {text:typeof c.banner==='string' ? c.banner : (c.subtitle ?? D.banner.text), x:c.bannerPos && c.bannerPos.x, y:(c.bannerPos && c.bannerPos.y) ?? clamp(ly+12,0,100),
      font:c.bannerFont, size:bs, weight:c.bannerWeight, spacing:num(c.bannerSpacing,3)/bs, line:c.bannerLine, foil:c.bannerFoil, color:c.bannerColor, shadow:c.bannerShadow!==false, fx:'none'};
  }
  const nt = (o, d) => Object.assign(normStyle(o, d), {text:str(o && o.text, d.text), x:num(o && o.x, d.x, 0, 100), y:num(o && o.y, d.y, 0, 100)});
  const rc = c.ribbonColor;
  return {
    title:nt(title, D.title), banner:nt(banner || {}, D.banner),
    ribbon:str(c.ribbon ?? c.ribbonText, D.ribbon), ribbonColor:(rc==='none' || rc==='transparent') ? 'none' : safeColor(rc, D.ribbonColor),
    preset:PRESETS.includes(c.preset) ? c.preset : D.preset, image:A.ref(c.image ?? c.imageSrc),
    focusX:num(c.focusX,50,0,100), focusY:num(c.focusY,50,0,100), vignette:num(c.vignette,.75,0,1)
  };
}
function normalizeNode(n, seen, A){
  n = n || {};
  let id = sid(n.id,'nd'); if(seen.has(id)) id = uid('nd'); seen.add(id);
  const type = ['mindmap','card','char','note','image','text','video','file'].includes(n.type) ? n.type : 'mindmap';
  const base = {id, type, x:Math.round(num(n.x,0)), y:Math.round(num(n.y,0)), w:num(n.w,240,40,6000), h:num(n.h,120,24,6000), color:safeColor(n.color,'')};
  if(DOCK_TYPES.has(type) && typeof n.parent==='string'){ base.parent = n.parent; base.dock = ['top','bottom','left','right'].includes(n.dock) ? n.dock : 'bottom'; base.order = num(n.order,0); }
  if(type==='image') return Object.assign(base, {src:A.ref(n.src), title:str(n.title)});
  if(type==='video') return Object.assign(base, {src:A.ref(n.src), path:str(n.path).slice(0,1000), title:str(n.title)});
  if(type==='file') return Object.assign(base, {path:str(n.path).slice(0,1000), title:str(n.title)});
  if(type==='text'){
    const legacy = n.st ? null : {font:n.font, size:n.size, weight:n.weight, color:n.color, align:n.align, line:n.line, spacing:n.spacing!=null && n.size ? n.spacing/n.size : undefined, foil:'plain', fx:'none', shadow:false};
    const d = textDefaults({size:40, align:'center', foil:'plain', color:'#e3cf9f', shadow:false});
    delete base.color;
    return Object.assign(base, {text:str(n.text,'Titel'), st:normStyle(n.st || legacy, d)});
  }
  if(type==='note') return Object.assign(base, {text:str(n.text)});
  if(type==='char'){
    const st = arr(n.stats); delete base.color;
    return Object.assign(base, {w:num(n.w,250,150,900), h:num(n.h,350,210,1260), kind:CHAR_KINDS.includes(n.kind) ? n.kind : 'character', artist:str(n.artist).slice(0,40), title:str(n.title).slice(0,80), sub:str(n.sub).slice(0,80), desc:str(n.desc),
      src:A.ref(n.src), art:/^[a-z]{2,12}$/.test(n.art||'') ? n.art : '', stats:CHAR_STATS.map((_,i)=>Math.round(num(st[i],0,0,100))), facts:arr(n.facts).slice(0,8).map(f=>({k:str(f && f.k).slice(0,40), v:str(f && f.v).slice(0,80)})), links:normLinks(n.links), flip:!!n.flip});
  }
  return Object.assign(base, {cat:str(n.cat), title:str(n.title), desc:str(n.desc), links:normLinks(n.links), stage:Math.round(num(n.stage,0,0,STAGES-1))});
}
function normalizeBoard(b, A){
  b = b || {}; const seen = new Set();
  const nodes = arr(b.nodes).map(n=>normalizeNode(n, seen, A)).filter(n=>n.type==='image' ? n.src : n.type==='video' ? (n.src || n.path) : n.type==='file' ? n.path : true);
  const byId = Object.fromEntries(nodes.map(n=>[n.id,n]));
  nodes.forEach(n=>{ if(n.parent && !(byId[n.parent] && DOCK_TARGETS.has(byId[n.parent].type))){ delete n.parent; delete n.dock; delete n.order; } });
  const cam = b.cam || {x:b.panX, y:b.panY, z:b.zoom};
  return {
    id:sid(b.id,'brd'), name:str(b.name,'Board'), cam:{x:num(cam.x,80), y:num(cam.y,70), z:num(cam.z,1,.1,4)}, nodes,
    style:{bg:BOARD_BGS.includes(b.style && b.style.bg) ? b.style.bg : 'dots', node:NODE_STYLES.includes(b.style && b.style.node) ? b.style.node : 'studio'},
    connections:arr(b.connections).filter(c=>c && byId[c.from] && byId[c.to] && c.from!==c.to).map(c=>({id:sid(c.id,'cn'), from:c.from, to:c.to, label:str(c.label)}))
  };
}
function normalizeProject(p, A){
  p = p || {};
  const st = s => ['todo','wip','done'].includes(s) ? s : 'todo';
  const proj = {
    id:sid(p.id,'proj'), theme:THEMES.includes(p.theme) ? p.theme : 'fantasy', fps:[24,25,30,48,60].includes(+p.fps) ? +p.fps : 24,
    storyStyle:STORY_PAPERS.includes(p.storyStyle) ? p.storyStyle : 'parchment',
    pipeStyle:SURF_STYLES.includes(p.pipeStyle) ? p.pipeStyle : 'studio',
    shotStyle:SURF_STYLES.includes(p.shotStyle) ? p.shotStyle : 'studio',
    createdAt:num(p.createdAt, Date.now()), updatedAt:num(p.updatedAt, Date.now()),
    cover:normalizeCover(p.cover, A),
    phases:arr(p.phases).map(ph=>({
      id:sid(ph.id,'ph'), title:str(ph.title,'Phase'), tools:arr(ph.tools).map(x=>str(x).trim()).filter(Boolean).slice(0,12),
      start:isoDate(ph.start), deadline:isoDate(ph.deadline), collapsed:!!ph.collapsed,
      tasks:arr(ph.tasks).map(x=>({id:sid(x.id,'tk'), text:str(x.text), status:STATUSES.includes(x.status) ? x.status : (x.done ? 'done' : 'todo'), deadline:isoDate(x.deadline), prio:PRIOS.includes(x.prio) ? x.prio : 'med', est:num(x.est,0,0,9999)}))
    })),
    boards:arr(p.boards).map(b=>normalizeBoard(b, A)),
    shots:arr(p.shots).map(s=>({uid:sid(s.uid,'sh'), code:str(s.code ?? s.id,'SH_010'), seq:str(s.seq), desc:str(s.desc), frames:Math.round(num(s.frames,48,1,1e6)), lens:str(s.lens,'35mm'), vfx:str(s.vfx), thumb:A.ref(s.thumb), status:Object.fromEntries(DEPTS.map(([k])=>[k, st(s.status && s.status[k])]))})),
    chapters:arr(p.chapters).map(c=>({id:sid(c.id,'ch'), title:str(c.title,'Szene'), body:str(c.body)})),
    team:p.team && typeof p.team==='object' && p.team.label ? {label:str(p.team.label).slice(0,200), path:str(p.team.path).slice(0,1000)} : null,
    lore:arr(p.lore).map(l=>({id:sid(l.id,'lr'), name:str(l.name,'Asset'), category:str(l.category), polyTarget:str(l.polyTarget), shader:str(l.shader), notes:str(l.notes), stage:Math.round(num(l.stage,0,0,STAGES-1)), links:normLinks(l.links)}))
  };
  if(!proj.boards.length) proj.boards.push(newBoard('Board'));
  if(!proj.chapters.length) proj.chapters.push({id:uid('ch'), title:t('sy.sceneN',{n:1}), body:''});
  return proj;
}
function normalizeSettings(s){
  s = s || {};
  const ov = {};
  if(s.swOverride && typeof s.swOverride==='object') for(const [k,v] of Object.entries(s.swOverride)){ if(!v || typeof v!=='object') continue; ov[k] = {color:safeColor(v.color, undefined), code:v.code ? str(v.code).slice(0,4) : undefined, ext:Array.isArray(v.ext) ? v.ext.map(x=>str(x).toLowerCase().replace(/[^a-z0-9]/g,'')).filter(Boolean).slice(0,10) : undefined, icon:typeof v.icon==='string' && v.icon.startsWith('asset:') ? v.icon : undefined}; Object.keys(ov[k]).forEach(x=>ov[k][x]===undefined && delete ov[k][x]); }
  return {
    lang:LANG_ORDER.includes(s.lang) ? s.lang : detectLang(),
    mode:s.mode==='light' ? 'light' : 'dark',
    cardSize:num(s.cardSize,240,160,380), titleScale:num(s.titleScale,1,.6,1.6),
    hubSort:['recent','name','progress','deadline'].includes(s.hubSort) ? s.hubSort : 'recent',
    hubStyle:LIB_STYLES.includes(s.hubStyle) ? s.hubStyle : 'studio',
    userName:str(s.userName).slice(0,40),
    taskFilter:['all','open','overdue','critical'].includes(s.taskFilter) ? s.taskFilter : 'all',
    sortByDate:!!s.sortByDate, pipeView:s.pipeView==='kanban' ? 'kanban' : 'list',
    leftDrag:s.leftDrag==='pan' ? 'pan' : 'select', snap:s.snap!==false, grid:s.grid!==false, sysIcons:s.sysIcons!==false,
    uiZoom:num(s.uiZoom,1,.5,2), tourDone:!!s.tourDone, motion:s.motion==='off' ? 'off' : 'on',
    swCustom:arr(s.swCustom).filter(c=>c && /^c_[\w]+$/.test(c.key)).map(c=>({key:c.key, name:str(c.name,'Program').slice(0,40), code:str(c.code,'??').slice(0,4), color:safeColor(c.color,'#888888'), text:'#fff', ext:arr(c.ext).map(x=>str(x).toLowerCase().replace(/[^a-z0-9]/g,'')).filter(Boolean).slice(0,10)})),
    swOverride:ov
  };
}
function normalizeSuite(raw, keepSettings){
  raw = raw || {};
  const A = assetCtx(raw.assets);
  const settings = keepSettings || normalizeSettings(Object.assign({}, raw.settings, raw.colorMode ? {mode:raw.colorMode} : {}));
  const modMap = {hub:'projects', mindmap:'board', shotlist:'shots', lore:'story', handbook:'guide'};
  const projects = arr(raw.projects).map(p=>normalizeProject(p, A));
  const seen = new Set(); projects.forEach(p=>{ if(seen.has(p.id)) p.id = uid('proj'); seen.add(p.id); });
  const mod = modMap[raw.activeModule] || raw.activeModule;
  return {
    app:'VertexForge Studio', schema:SCHEMA, settings,
    activeModule:MODULES.includes(mod) ? mod : 'projects',
    activeProjectId:projects.some(p=>p.id===raw.activeProjectId) ? raw.activeProjectId : (projects[0] && projects[0].id),
    file:raw.file && typeof raw.file==='object' ? {name:str(raw.file.name), path:str(raw.file.path)} : {name:'', path:''},
    resetEpoch:RESET_EPOCH, appVersion:APP_VERSION,
    projects, assets:A.assets
  };
}

/* ============================================================================
   H. SPEICHER (IndexedDB: Arbeitsstand + getrennte Bild-Ablage), VERLAUF, DATEIEN
   ============================================================================ */
const DB_NAME = 'VertexForgeStudio', DB_VERSION = 3, RESET_EPOCH = 3;
/* Alles löschen (nur für den einmaligen Vorab-Reset bzw. „Alles zurücksetzen“ in den Einstellungen) */
async function wipeAllData(){
  if(db) await Promise.all(['suite','assets','versions'].filter(n=>db.objectStoreNames.contains(n)).map(n=>idbReq(n, 'readwrite', st=>st.clear())));
  try{ Object.keys(localStorage).filter(k=>k.startsWith('vf.')).forEach(k=>localStorage.removeItem(k)); }catch(e){}
  ui.savedAssets.clear();
}
const ui = {sel:new Set(), active:null, selConn:null, boardId:null, chapterId:null, loreId:null, designer:null, editing:null, clip:null,
  sysIcons:{}, exists:{}, fileHandle:null, fileDirty:false, inspHidden:false, sideHidden:false, focus:false, fontCat:'all', fontQuery:'',
  hubQuery:'', mouse:{x:0,y:0}, xf:null, savedAssets:new Set(), saveState:'', saveTime:'', menuBtn:null};
let saveTimer = 0, histTimer = 0;

function idbOpen(name=DB_NAME, version=DB_VERSION, create=true){
  return new Promise(res=>{
    try{
      const r = version ? indexedDB.open(name, version) : indexedDB.open(name);
      r.onupgradeneeded = () => { if(!create) return; const d = r.result; if(!d.objectStoreNames.contains('suite')) d.createObjectStore('suite'); if(!d.objectStoreNames.contains('assets')) d.createObjectStore('assets'); if(!d.objectStoreNames.contains('versions')) d.createObjectStore('versions'); };
      r.onsuccess = () => res(r.result); r.onerror = () => res(null); r.onblocked = () => res(null);
    }catch(e){ res(null); }
  });
}
function idbReq(store, mode, fn){
  return new Promise(res=>{
    if(!db || !db.objectStoreNames.contains(store)) return res(null);
    try{ const tx = db.transaction(store, mode); const rq = fn(tx.objectStore(store)); rq.onsuccess = () => res(rq.result); rq.onerror = () => res(null); }catch(e){ res(null); }
  });
}
function idbAllAssets(){
  return new Promise(res=>{
    const out = {};
    if(!db || !db.objectStoreNames.contains('assets')) return res(out);
    try{
      const cur = db.transaction('assets','readonly').objectStore('assets').openCursor();
      cur.onsuccess = e => { const c = e.target.result; if(c){ out[c.key] = c.value; c.continue(); } else res(out); };
      cur.onerror = () => res(out);
    }catch(e){ res(out); }
  });
}
async function loadLegacyPapyrus(){
  try{
    if(indexedDB.databases){ const list = await indexedDB.databases(); if(!list.some(d=>d.name==='PapyrusCargo3DSuiteDB')) return null; }
    const old = await idbOpen('PapyrusCargo3DSuiteDB', undefined, false); if(!old) return null;
    const v = await new Promise(res=>{ try{ const rq = old.transaction('suiteStore','readonly').objectStore('suiteStore').get('masterState'); rq.onsuccess = () => res(rq.result); rq.onerror = () => res(null); }catch(e){ res(null); } });
    old.close(); return v;
  }catch(e){ return null; }
}
function persistSoon(){ setSaveState('pending'); clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 350); }
/* Jede inhaltliche Änderung: speichern + Verlauf + „ungespeichert in Datei“ */
function changed(){
  const p = activeProject(); if(p) p.updatedAt = Date.now();
  if(!ui.fileDirty && S.file && S.file.name){ ui.fileDirty = true; renderSavePill(); }
  persistSoon();
  clearTimeout(histTimer); histTimer = setTimeout(histCommit, 450);
  if(typeof teamPoke==='function') teamPoke();
}
async function saveNow(){
  clearTimeout(saveTimer); saveTimer = 0;
  if(ui.wiping) return;
  if(!db){ setSaveState('error'); return; }
  const rec = Object.assign({}, S, {assets:undefined});
  try{
    await new Promise((res,rej)=>{
      const tx = db.transaction(['suite','assets'], 'readwrite');
      tx.objectStore('suite').put(rec, 'main');
      const st = tx.objectStore('assets');
      for(const [id,v] of Object.entries(S.assets)) if(!ui.savedAssets.has(id)){ st.put(v, id); ui.savedAssets.add(id); }
      tx.oncomplete = res; tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error);
    });
    ui.saveTime = new Date().toLocaleTimeString(locale(), {hour:'2-digit', minute:'2-digit'});
    setSaveState('');
  }catch(e){
    ui.savedAssets.clear(); setSaveState('error'); toast(t('ts.saveFail'), true);
  }
}
async function gcAssets(){
  const refs = collectRefs(S.projects, S.settings);
  if(ui.clip) ui.clip.nodes.forEach(n=>{ if(n.src && n.src.startsWith('asset:')) refs.add(n.src.slice(6)); });
  (await verRefs()).forEach(r=>refs.add(r));          // Bilder, die nur noch in Versionen vorkommen, bleiben erhalten
  const dead = Object.keys(S.assets).filter(id=>!refs.has(id));
  if(!dead.length || !db) return;
  dead.forEach(id=>{ delete S.assets[id]; ui.savedAssets.delete(id); });
  try{ const tx = db.transaction('assets','readwrite'); dead.forEach(id=>tx.objectStore('assets').delete(id)); }catch(e){}
}
function setSaveState(s){ const changedState = (s==='error') !== (ui.saveState==='error'); ui.saveState = s; if(changedState || s==='') renderSavePill(); }

/* Verlauf (Rückgängig / Wiederholen) — Zustände als Text, Bilder bleiben in der Ablage */
const H = {undo:[], redo:[], base:null};
function snapshot(){ return JSON.stringify({p:S.projects, a:S.activeProjectId}, function(k,v){ if(k==='cam') return undefined; if((k==='x' || k==='y') && this && this.parent && this.dock) return undefined; return v; }); }
function histCommit(){
  clearTimeout(histTimer);
  const cur = snapshot();
  if(cur===H.base) return;
  if(H.base!=null){ H.undo.push(H.base); if(H.undo.length > 120) H.undo.shift(); }
  H.redo = []; H.base = cur;
}
function histRestore(json){
  const o = JSON.parse(json), cams = {};
  S.projects.forEach(p=>p.boards.forEach(b=>{ cams[b.id] = b.cam; }));
  S.projects = o.p;
  S.projects.forEach(p=>p.boards.forEach(b=>{ b.cam = cams[b.id] || {x:80,y:70,z:1}; b.nodes.forEach(n=>{ if(n.x==null) n.x = 0; if(n.y==null) n.y = 0; }); }));
  S.activeProjectId = S.projects.some(p=>p.id===o.a) ? o.a : S.projects[0].id;
  ui.sel = new Set(); ui.active = null; ui.selConn = null; ui.editing = null;
  if(S.file && S.file.name) ui.fileDirty = true;
  persistSoon(); render();
}
function undo(){ if(ui.xf) cancelXf(); if(CV.drag) cancelDrag(); histCommit(); if(!H.undo.length){ toast(t('ts.nothing')); return; } H.redo.push(H.base); H.base = H.undo.pop(); histRestore(H.base); H.base = snapshot(); }
function redo(){ histCommit(); if(!H.redo.length) return; H.undo.push(H.base); H.base = H.redo.pop(); histRestore(H.base); H.base = snapshot(); }

/* Projektdateien (.vforge) */
function serialize(projects){
  projects = projects || S.projects;
  const refs = collectRefs(projects), assets = {};
  refs.forEach(id=>{ if(S.assets[id]) assets[id] = S.assets[id]; });
  projects = projects.map(p=>p.team ? Object.assign({}, p, {team:null}) : p);   // Team-Verknüpfung ist gerätebezogen
  return JSON.stringify({app:'VertexForge Studio', schema:SCHEMA, version:APP_VERSION, exportedAt:new Date().toISOString(), data:{activeProjectId:S.activeProjectId, projects, assets}});
}
function stamp(){ const d = new Date(); return `${isoLocal(d)}_${pad(d.getHours())}${pad(d.getMinutes())}`; }
function safeName(s){ return String(s).replace(/[^\w\-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,40) || 'VertexForge'; }
function downloadText(content, name){
  const blob = new Blob([content], {type:'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href), 5000);
}
const FILE_TYPES = [{description:'VertexForge', accept:{'application/json':['.vforge','.json']}}];
async function writeNewFile(content, name){
  if(IS_DESKTOP){ const p = await nativeAsync('vfSaveFileAs', name, content); return p ? {name:basename(p), path:p} : null; }
  if(window.showSaveFilePicker){
    try{ const h = await window.showSaveFilePicker({suggestedName:name, types:FILE_TYPES}); const w = await h.createWritable(); await w.write(content); await w.close(); return {name:h.name, handle:h}; }
    catch(e){ if(e && e.name==='AbortError') return null; }
  }
  downloadText(content, name); return {name};
}
async function saveFile(as=false){
  try{
    histCommit();
    const content = serialize();
    let res;
    if(!as && IS_DESKTOP && S.file.path){ await window.vfWriteFile(S.file.path, content); res = {name:S.file.name, path:S.file.path}; }
    else if(!as && ui.fileHandle){ const w = await ui.fileHandle.createWritable(); await w.write(content); await w.close(); res = {name:ui.fileHandle.name, handle:ui.fileHandle}; }
    else res = await writeNewFile(content, (S.file.name || safeName(projectName(activeProject())) + '.vforge'));
    if(!res) return false;
    S.file = {name:res.name, path:res.path || ''}; if(res.handle) ui.fileHandle = res.handle;
    ui.fileDirty = false; persistSoon(); renderSavePill(); updateTitle();
    makeVersion('file', res.name);
    toast(t('ts.savedFile', {name:res.name})); return true;
  }catch(e){ toast(t('ts.saveFail') + ' ' + (e && e.message || ''), true); return false; }
}
async function exportProjects(projects, name, msg){
  try{ const r = await writeNewFile(serialize(projects), name); if(r) toast(msg); }catch(e){ toast(t('ts.saveFail'), true); }
}
const exportBackup = () => exportProjects(S.projects, `VertexForge_Backup_${stamp()}.vforge`, t('ts.backup'));
const exportProject = id => { const p = S.projects.find(x=>x.id===id); if(p) exportProjects([p], `${safeName(projectName(p))}_${stamp()}.vforge`, t('ts.projExported')); };
async function openFile(mergeOnly=false){
  let text, info = {};
  try{
    if(IS_DESKTOP){ const r = await nativeAsync('vfOpenFile'); if(!r || !r.content) return; text = r.content; info = {name:basename(r.path), path:r.path}; }
    else if(window.showOpenFilePicker){ let h; try{ [h] = await window.showOpenFilePicker({types:FILE_TYPES}); }catch(e){ return; } const f = await h.getFile(); text = await f.text(); info = {name:f.name, handle:h}; }
    else { const [f] = await pickFiles('.vforge,.json,application/json'); if(!f) return; text = await f.text(); info = {name:f.name}; }
  }catch(e){ toast(t('ts.invalid'), true); return; }
  await loadContent(text, info, mergeOnly);
}
async function loadContent(text, info, mergeOnly){
  let raw; try{ raw = JSON.parse(text); }catch(e){ toast(t('ts.invalid'), true); return; }
  const data = raw && raw.data ? raw.data : raw;
  if(!data || !Array.isArray(data.projects) || !data.projects.length){ toast(t('ts.invalid'), true); return; }
  const inc = normalizeSuite(data, S.settings);
  const n = inc.projects.length;
  const choice = mergeOnly ? 'merge' : await dialog({title:t('imp.title'), text:t('imp.text',{n}), buttons:[{label:t('g.cancel'), value:null},{label:t('imp.add'), value:'merge'},{label:t('imp.replace'), value:'replace', primary:true}]});
  if(!choice) return;
  if(choice==='replace') await makeVersion('safety', t('ver.beforeOpen'));
  histCommit();
  Object.assign(S.assets, inc.assets);
  if(choice==='replace'){
    S.projects = inc.projects; S.activeProjectId = inc.activeProjectId;
    S.file = {name:info.name || '', path:info.path || ''}; ui.fileHandle = info.handle || null; ui.fileDirty = false;
  }else{
    const ids = new Set(S.projects.map(p=>p.id));
    inc.projects.forEach(p=>{ if(ids.has(p.id)) p.id = uid('proj'); S.projects.push(p); });
    S.activeProjectId = inc.projects[0].id; if(S.file.name) ui.fileDirty = true;
  }
  Object.assign(ui, {boardId:null, sel:new Set(), active:null, selConn:null, chapterId:null, loreId:null});
  histCommit(); await saveNow(); render();
  toast(choice==='replace' ? t('ts.restored') : t('ts.imported',{n}));
}

/* ============================================================================
   I. UI-BAUSTEINE: Toast, Dialog, Sheet, Menü, Befehlssuche, Datei-Auswahl
   ============================================================================ */
/* Löschen ohne Rückfrage – stattdessen ein Hinweis mit „Rückgängig“ (der Verlauf hält alles fest) */
function softDelete(name){
  histCommit();
  setTimeout(()=>{ histCommit(); undoToast(name ? t('ts.deletedNamed',{name}) : t('ts.deleted')); }, 0);
  return Promise.resolve(true);
}
function undoToast(msg){
  const el = document.createElement('div');
  el.className = 'toast undo';
  el.innerHTML = ic('trash',15) + `<span>${esc(msg)}</span><button>${ic('undo',14)}${t('e.undo')}</button><i class="toast-time"></i>`;
  $('toasts').appendChild(el);
  while($('toasts').children.length > 4) $('toasts').firstChild.remove();
  const close = () => { el.style.transition = 'opacity .25s, transform .25s'; el.style.opacity = '0'; el.style.transform = 'translateY(6px)'; setTimeout(()=>el.remove(), 260); };
  el.querySelector('button').onclick = () => { clearTimeout(timer); undo(); close(); };
  const timer = setTimeout(close, 6500);
}
function toast(msg, err=false){
  const el = document.createElement('div');
  el.className = 'toast' + (err ? ' err' : '');
  el.innerHTML = (err ? ic('alert',15) : ic('check',15)) + `<span>${esc(msg)}</span>`;
  $('toasts').appendChild(el);
  while($('toasts').children.length > 4) $('toasts').firstChild.remove();
  setTimeout(()=>{ el.style.transition = 'opacity .3s'; el.style.opacity = '0'; setTimeout(()=>el.remove(), 320); }, err ? 4500 : 2200);
}
function dialog({title, text='', buttons=[{label:t('g.ok'), value:true, primary:true}], input=null}){
  return new Promise(resolve=>{
    const m = $('dialog');
    m.innerHTML = `<div class="dlg" role="dialog" aria-modal="true"><h3>${esc(title)}</h3>${text ? `<p>${esc(text)}</p>` : ''}
      ${input!==null ? `<input class="inp" id="dlgInput" value="${esc(input)}">` : ''}
      <div class="dlg-actions">${buttons.map((b,i)=>`<button class="btn ${b.primary?'btn-primary':''} ${b.danger?'btn-danger':''}" data-i="${i}">${esc(b.label)}</button>`).join('')}</div></div>`;
    m.classList.add('open');
    const close = v => { ghostOut(m); m.classList.remove('open'); m.innerHTML = ''; document.removeEventListener('keydown', kd, true); resolve(v); };
    m.querySelectorAll('[data-i]').forEach(btn=> btn.onclick = () => { const b = buttons[+btn.dataset.i]; close(input!==null && b.value===true ? $('dlgInput').value : b.value); });
    const kd = e => { if(e.key==='Escape'){ e.stopPropagation(); e.preventDefault(); close(null); } else if(e.key==='Enter' && input!==null){ e.preventDefault(); close($('dlgInput').value); } };
    document.addEventListener('keydown', kd, true);
    m.onpointerdown = e => { if(e.target===m) close(null); };
    setTimeout(()=>{ const f = $('dlgInput') || m.querySelector('.btn-primary,.btn-danger'); if(f){ f.focus(); if(f.select) f.select(); } }, 30);
  });
}
const confirmDelete = (title, text) => dialog({title, text, buttons:[{label:t('g.cancel'), value:false},{label:t('g.delete'), value:true, danger:true}]});
const askText = (title, value) => dialog({title, input:value, buttons:[{label:t('g.cancel'), value:null},{label:t('g.apply'), value:true, primary:true}]});

/* Sheet (Einstellungen, Tastenkürzel, Neues Projekt) */
function openSheet(html, cls=''){
  const m = $('modal2');
  m.innerHTML = `<div class="sheet ${cls}" role="dialog" aria-modal="true">${html}</div>`;
  m.classList.add('open');
  m.onpointerdown = e => { if(e.target===m) closeSheet(); };
  return m.firstElementChild;
}
function closeSheet(){ const m = $('modal2'); if(!m.classList.contains('open')) return; ghostOut(m); m.classList.remove('open'); m.innerHTML = ''; if(ui.onSheetClose){ const f = ui.onSheetClose; ui.onSheetClose = null; f(); } }

/* Kontextmenü / Dropdown */
let menuEl = null;
function closeMenu(){ if(menuEl){ ghostOut(menuEl); menuEl.remove(); menuEl = null; } if(ui.menuBtn){ ui.menuBtn.classList.remove('open'); ui.menuBtn = null; } document.removeEventListener('pointerdown', menuOutside, true); }
function menuOutside(e){ if(menuEl && !menuEl.contains(e.target) && !(ui.menuBtn && ui.menuBtn.contains(e.target))) closeMenu(); }
function openMenu(x, y, items, title){
  closeMenu();
  const el = document.createElement('div');
  el.className = 'menu'; el.setAttribute('role','menu');
  el.innerHTML = (title ? `<div class="menu-title">${esc(title)}</div>` : '') + items.map((it,i)=>{
    if(it.sep) return '<div class="menu-sep"></div>';
    if(it.swatches) return `<div class="menu-swatches">${it.swatches.map((s,j)=>`<button data-sw="${i}:${j}" title="${esc(s.title||s.color)}" style="background:${s.color||'var(--accent)'}"></button>`).join('')}</div>`;
    return `<button class="menu-item ${it.danger?'danger':''}" data-mi="${i}" ${it.disabled?'disabled':''} role="menuitem">${it.checked!==undefined ? `<span class="check">${it.checked?ic('check',14):''}</span>` : (it.icon ? ic(it.icon,15) : '<span style="width:15px"></span>')}<span class="lbl">${esc(it.label)}</span>${it.kbd ? `<kbd>${esc(kbdLabel(it.kbd))}</kbd>` : ''}</button>`;
  }).join('');
  $('menuLayer').appendChild(el); menuEl = el;
  const r = el.getBoundingClientRect();
  el.style.left = clamp(x, 6, innerWidth - r.width - 6) + 'px';
  el.style.top = clamp(y, 6, innerHeight - r.height - 6) + 'px';
  el.addEventListener('click', e=>{
    const b = e.target.closest('[data-mi]'); const s = e.target.closest('[data-sw]');
    if(b){ const it = items[+b.dataset.mi]; closeMenu(); it.run && it.run(); }
    else if(s){ const [i,j] = s.dataset.sw.split(':').map(Number); closeMenu(); items[i].swatches[j].run(); }
  });
  el.addEventListener('contextmenu', e=>e.preventDefault());
  setTimeout(()=>document.addEventListener('pointerdown', menuOutside, true), 0);
  return el;
}
function menuKey(e){
  if(!menuEl) return false;
  const items = [...menuEl.querySelectorAll('.menu-item:not([disabled])')];
  let i = items.findIndex(x=>x.classList.contains('hl'));
  if(e.key==='Escape'){ closeMenu(); return true; }
  if(e.key==='ArrowDown' || e.key==='ArrowUp'){ items.forEach(x=>x.classList.remove('hl')); i = e.key==='ArrowDown' ? (i+1) % items.length : (i-1+items.length) % items.length; items[i] && items[i].classList.add('hl'); return true; }
  if(e.key==='Enter' && i>=0){ items[i].click(); return true; }
  return true;
}

/* Befehlssuche (F3) */
let paletteEl = null;
function closePalette(){ if(paletteEl){ paletteEl.remove(); paletteEl = null; } }
function getCommands(){
  const m = S.activeModule, cmds = [];
  const add = (label, run, kbd='', group=t('pal.cmd'), icon='chevronR') => cmds.push({label, run, kbd, group, icon});
  MODULES.forEach((mod,i)=>add(t('mod.'+mod), ()=>go(mod), 'Alt+'+(i+1), t('pal.go'), MOD_ICONS[mod]));
  S.projects.forEach(p=>add(projectName(p), ()=>openProject(p.id), '', t('pal.project'), 'film'));
  add(t('f.newProject'), newProjectDialog, 'Ctrl+N', t('menu.file'), 'plus');
  add(t('tour.menu'), startTour, '', t('menu.help'), 'sparkle');
  add(t('uz.in'), ()=>stepUiZoom(1), 'Ctrl++', t('menu.view'), 'plus');
  add(t('uz.out'), ()=>stepUiZoom(-1), 'Ctrl+-', t('menu.view'), 'sliders');
  add(t('uz.reset'), ()=>stepUiZoom(0), 'Ctrl+0', t('menu.view'), 'fit');
  add(t('f.open'), ()=>openFile(), 'Ctrl+O', t('menu.file'), 'folder');
  add(t('f.save'), ()=>saveFile(), 'Ctrl+S', t('menu.file'), 'save');
  add(t('f.saveAs'), ()=>saveFile(true), 'Ctrl+Shift+S', t('menu.file'), 'save');
  add(t('f.exportProject'), ()=>exportProject(S.activeProjectId), '', t('menu.file'), 'download');
  add(t('f.backup'), exportBackup, '', t('menu.file'), 'download');
  add(t('f.import'), ()=>openFile(true), '', t('menu.file'), 'upload');
  add(t('f.settings'), openSettings, 'Ctrl+,', t('menu.file'), 'gear');
  add(t('e.undo'), undo, 'Ctrl+Z', t('menu.edit'), 'undo');
  add(t('e.redo'), redo, 'Ctrl+Shift+Z', t('menu.edit'), 'redo');
  add(t('v.mode'), toggleMode, '', t('menu.view'), 'sun');
  add(t('v.fullscreen'), toggleFullscreen, 'F11', t('menu.view'), 'fit');
  THEMES.forEach(th=>add(`${t('v.theme')}: ${t('th.'+th)}`, ()=>setTheme(th), '', t('menu.view'), 'sparkle'));
  LANG_ORDER.forEach(l=>add(`${t('v.lang')}: ${LANG_NAMES[l]}`, ()=>setLang(l), '', t('menu.view'), 'globe'));
  add(t('h.keys'), openKeys, '?', t('menu.help'), 'keyboard');
  add(t('mod.guide'), ()=>go('guide'), 'F1', t('menu.help'), 'compass');
  if(m==='board'){
    [['mindmap','bd.node','node'],['card','bd.card','card'],['char','bd.char','cards'],['note','bd.note','note'],['text','bd.text','type']].forEach(([ty,k,icn])=>add(`${t('bd.add')}: ${t(k)}`, ()=>addNode(ty), 'Shift+A', t('mod.board'), icn));
    add(`${t('bd.add')}: ${t('bd.media')}`, ()=>pickBoardMedia(), '', t('mod.board'), 'image');
    add(t('cc.deck'), openDeck, '', t('mod.board'), 'cards');
    add(t('bd.fit'), ()=>fitBoard(), 'Home', t('mod.board'), 'fit');
    add(t('bd.selectAll'), selectAll, 'A', t('mod.board'), 'check');
  }
  if(m==='pipeline'){
    add(t('pl.addPhase'), addPhase, 'Shift+A', t('mod.pipeline'), 'plus');
    add(`${t('pl.list')} / ${t('pl.kanban')}`, togglePipeView, 'V', t('mod.pipeline'), 'kanban');
    TEMPLATE_IDS.forEach(id=>add(`${t('tpl.insert')}: ${t('tpl.'+id)}`, ()=>insertTemplate(id), '', t('mod.pipeline'), 'layers'));
  }
  if(m==='shots') add(t('sh.add'), addShot, 'Shift+A', t('mod.shots'), 'plus');
  if(m==='story'){ add(t('sy.scene'), addChapter, 'Shift+A', t('mod.story'), 'plus'); add(t('sy.focus'), toggleFocus, 'Ctrl+Space', t('mod.story'), 'focus'); }
  return cmds;
}
/* Inhalte für die Schnellsuche: Aufgaben, Denkbrett-Elemente, Karten, Shots, Kapitel */
function getContentItems(){
  const out = [], ap = activeProject();
  const add = (label, sub, group, icon, run, extra='') => out.push({label, sub, group, icon, run, extra, content:true});
  const ensure = pid => { if(S.activeProjectId!==pid) openProject(pid, false); };
  S.projects.forEach(p=>p.phases.forEach(ph=>ph.tasks.forEach(x=>{ if(x.text) add(x.text, `${projectName(p)} · ${ph.title || ''}`, t('pal.task'), x.status==='done' ? 'check' : 'list', ()=>{
    ensure(p.id); ph.collapsed = false; if(S.settings.taskFilter!=='all') S.settings.taskFilter = 'all';
    go('pipeline'); setTimeout(()=>flashEl(document.querySelector(`[data-task="${ph.id}:${x.id}"]`)), 280); }); })));
  ap.boards.forEach(b=>b.nodes.forEach(n=>{
    const label = n.title || n.text || n.cat || n.path || ''; if(!label.trim()) return;
    const extra = [n.sub, n.desc, n.cat!==label ? n.cat : '', ...(n.facts||[]).map(f=>f.k+' '+f.v)].filter(Boolean).join(' ');
    add(label.split('\n')[0].slice(0,90), `${b.name} · ${t(NODE_LABEL[n.type])}${n.type==='char' ? ' · ' + t('cc.k.'+n.kind) : ''}`, n.type==='char' ? t('bd.char') : t('mod.board'), n.type==='char' ? 'cards' : n.type==='note' ? 'note' : 'node', ()=>locateNode(n.id), extra);
  }));
  ap.shots.forEach((s,i)=>{ const label = [s.code, s.seq, s.desc].filter(Boolean).join(' · '); if(label) add(label.slice(0,90), projectName(ap), t('mod.shots'), 'film', ()=>{ go('shots'); setTimeout(()=>flashEl(document.querySelector(`#view-shots [data-shot="${i}"]`)), 280); }); });
  ap.chapters.forEach(c=>add(c.title || t('g.untitled'), (c.body || '').replace(/<[^>]+>/g,' ').slice(0,70), t('pal.chapter'), 'book', ()=>{ ui.chapterId = c.id; go('story'); }));
  return out;
}
function flashEl(el){ if(!el) return; el.scrollIntoView({block:'center', behavior:'smooth'}); el.classList.remove('found'); void el.offsetWidth; el.classList.add('found'); }
function openPalette(){
  closeMenu(); closePalette();
  const cmds = getCommands(), content = getContentItems();
  const el = document.createElement('div');
  el.className = 'palette';
  el.innerHTML = `<input placeholder="${esc(t('pal.ph'))}" aria-label="${esc(t('e.search'))}"><div class="palette-list"></div>`;
  document.body.appendChild(el); paletteEl = el;
  const input = el.querySelector('input'), list = el.querySelector('.palette-list');
  let shown = [], hl = 0;
  const draw = () => {
    const q = input.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const hit = c => { const h = (c.label + ' ' + c.group + ' ' + (c.sub || '') + ' ' + (c.extra || '')).toLowerCase(); return q.every(w=>h.includes(w)); };
    shown = q.length ? [...content.filter(hit).slice(0, 40), ...cmds.filter(hit)].slice(0, 70) : cmds.slice(0, 60);
    hl = clamp(hl, 0, Math.max(0, shown.length-1));
    list.innerHTML = shown.length ? shown.map((c,i)=>`<button class="menu-item ${i===hl?'hl':''} ${c.content?'pc-item':''}" data-pi="${i}">${ic(c.icon,15)}<span class="lbl">${esc(c.label)}${c.sub?`<small>${esc(c.sub)}</small>`:''}</span>${c.kbd?`<kbd>${esc(kbdLabel(c.kbd))}</kbd>`:''}<span class="grp">${esc(c.group)}</span></button>`).join('') : `<div class="palette-empty">${t('pal.none')}</div>`;
    const h = list.querySelector('.hl'); if(h) h.scrollIntoView({block:'nearest'});
  };
  const run = i => { const c = shown[i]; closePalette(); if(c) c.run(); };
  input.addEventListener('input', ()=>{ hl = 0; draw(); });
  input.addEventListener('keydown', e=>{
    if(e.key==='ArrowDown'){ hl++; draw(); e.preventDefault(); }
    else if(e.key==='ArrowUp'){ hl--; draw(); e.preventDefault(); }
    else if(e.key==='Enter'){ run(hl); e.preventDefault(); }
    else if(e.key==='Escape'){ closePalette(); e.preventDefault(); e.stopPropagation(); }
  });
  list.addEventListener('click', e=>{ const b = e.target.closest('[data-pi]'); if(b) run(+b.dataset.pi); });
  setTimeout(()=>document.addEventListener('pointerdown', function out(ev){ if(paletteEl && !paletteEl.contains(ev.target)){ closePalette(); } document.removeEventListener('pointerdown', out, true); }, true), 0);
  draw(); input.focus();
}

function pickFiles(accept='image/*', multiple=false){
  return new Promise(res=>{ const i = document.createElement('input'); i.type = 'file'; i.accept = accept; i.multiple = multiple; i.onchange = () => res([...i.files]); i.click(); });
}
function readFile(f){ return new Promise((res,rej)=>{ const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); }); }
function loadImg(src){ return new Promise((res,rej)=>{ const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }); }
async function compressImage(file, maxDim=1800){
  const src = await readFile(file);
  if(/svg|gif/.test(file.type)) return src;
  try{
    const img = await loadImg(src);
    const s = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
    if(s===1 && file.size < 700000) return src;
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(img.naturalWidth*s)); c.height = Math.max(1, Math.round(img.naturalHeight*s));
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    let out = c.toDataURL('image/webp', .9);
    if(!out.startsWith('data:image/webp')) out = c.toDataURL('image/jpeg', .9);
    return out.length < src.length ? out : src;
  }catch(e){ return src; }
}
async function copyText(text){
  try{ await navigator.clipboard.writeText(text); return true; }
  catch(e){
    const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); let ok = false; try{ ok = document.execCommand('copy'); }catch(_){}
    ta.remove(); return ok;
  }
}

/* ============================================================================
   J. NAVIGATION, KOPF- & STATUSLEISTE, THEMES, SPRACHE
   ============================================================================ */
const activeProject = () => S.projects.find(p=>p.id===S.activeProjectId) || S.projects[0];
const projectName = p => (p.cover.title.text || t('g.untitled')).split('\n').map(s=>s.trim()).filter(Boolean).join(' ') || t('g.untitled');

function applyTheme(){
  const p = activeProject();
  document.documentElement.dataset.mode = S.settings.mode;
  document.documentElement.dataset.theme = p ? p.theme : 'fantasy';
  document.documentElement.lang = currentLang();
  const mc = document.querySelector('meta[name=theme-color]'); if(mc) mc.content = S.settings.mode==='dark' ? '#19181c' : '#ece6da';
  if(HAS_WINCTL && ui.winDark !== S.settings.mode){ ui.winDark = S.settings.mode; try{ window.vfWinTheme(S.settings.mode==='dark'); }catch(e){} }
}
const LOGO_SVG = `<svg width="22" height="22" viewBox="0 0 256 256" aria-hidden="true"><rect width="256" height="256" rx="58" fill="#1d1a16"/><polygon points="50,64 98,64 128,152 128,204" fill="#e9bb5c"/><polygon points="206,64 158,64 128,152 128,204" fill="#b9853a"/><polygon points="128,78 143,98 128,118 113,98" fill="#f4e7c6"/></svg>`;
const WIN_GLYPH = {
  min:'<svg width="10" height="10" viewBox="0 0 10 10"><path d="M0 5.5h10" stroke="currentColor" stroke-width="1"/></svg>',
  max:'<svg width="10" height="10" viewBox="0 0 10 10"><rect x=".5" y=".5" width="9" height="9" rx="1" fill="none" stroke="currentColor" stroke-width="1"/></svg>',
  restore:'<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1"><rect x=".5" y="2.5" width="7" height="7" rx="1"/><path d="M2.5 2.5V1.5a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-1"/></svg>',
  close:'<svg width="10" height="10" viewBox="0 0 10 10"><path d="M.5.5l9 9M9.5.5l-9 9" stroke="currentColor" stroke-width="1.1"/></svg>'
};
const HAS_WINCTL = IS_DESKTOP && typeof window.vfWin === 'function';
function renderChrome(){
  const p = activeProject();
  $('topbar').innerHTML = `
    <div class="tb-left">
      <button class="brand" data-act="home" title="VertexForge Studio · ${esc(t('mod.projects'))}">${LOGO_SVG}</button>
      <nav class="menubar">${['file','edit','view','help'].map(m=>`<button data-menu="${m}">${t('menu.'+m)}</button>`).join('')}</nav>
      <button class="proj-crumb" id="projCrumb" title="${esc(t('pal.project'))}"><span class="pc-dot"></span><span class="pc-name">${esc(projectName(p))}</span>${ic('chevron',13)}</button>
      <button class="team-badge" id="teamBadge" hidden></button>
    </div>
    <nav class="tabs" id="tabs" role="tablist"><span class="tab-ink" id="tabInk"></span>${MODULES.map((m,i)=>`<button role="tab" data-mod="${m}" class="${S.activeModule===m?'active':''}" title="${esc(t('mod.'+m))} · Alt+${i+1}">${ic(MOD_ICONS[m],15)}<span>${t('mod.'+m)}</span></button>`).join('')}</nav>
    <div class="tb-right">
      <div class="tb-tools">
        <button class="icon-btn" data-act="search" title="${esc(t('pal.searchTip'))} · Ctrl+K">${ic('search',17)}</button>
        <button class="icon-btn save-btn" id="savePill"></button>
        <button class="icon-btn" data-act="versions" title="${esc(t('ver.title'))} · Ctrl+Alt+H">${ic('history',17)}</button>
        <span class="tb-sep"></span>
        <span class="tb-view"><button class="icon-btn" data-act="mode" title="${esc(t('v.mode'))}">${ic(S.settings.mode==='dark'?'sun':'moon',17)}</button>
        <button class="icon-btn" data-act="settings" title="${esc(t('f.settings'))} · Ctrl+,">${ic('gear',17)}</button>
        ${HAS_WINCTL ? '' : `<button class="icon-btn ${ui.fullscreen?'on':''}" data-act="fullscreen" title="${esc(t('v.fullscreen'))} · F11">${ic('fit',17)}</button>`}</span>
      </div>
      ${HAS_WINCTL ? `<div class="win-ctl"><button data-win="min" title="${esc(t('win.min'))}">${WIN_GLYPH.min}</button><button data-win="max" title="${esc(ui.winMax||ui.fullscreen ? t('win.restore') : t('win.max'))}">${ui.winMax||ui.fullscreen ? WIN_GLYPH.restore : WIN_GLYPH.max}</button><button data-win="close" class="close" title="${esc(t('win.close'))}">${WIN_GLYPH.close}</button></div>` : ''}
    </div>`;
  const tb = $('topbar');
  tb.querySelectorAll('[data-mod]').forEach(b=>b.onclick = () => go(b.dataset.mod));
  tb.querySelectorAll('[data-menu]').forEach(b=>{ b.onclick = () => openMainMenu(b); b.onpointerenter = () => { if(ui.menuBtn && ui.menuBtn!==b && ui.menuBtn.dataset.menu) openMainMenu(b); }; });
  tb.querySelector('[data-act=home]').onclick = () => go('projects');
  tb.querySelector('[data-act=mode]').onclick = toggleMode;
  tb.querySelector('[data-act=settings]').onclick = openSettings;
  tb.querySelector('[data-act=versions]').onclick = openVersions;
  tb.querySelector('[data-act=search]').onclick = openPalette;
  const fs = tb.querySelector('[data-act=fullscreen]'); if(fs) fs.onclick = toggleFullscreen;
  tb.querySelectorAll('[data-win]').forEach(b=>b.onclick = () => winAction(b.dataset.win));
  $('projCrumb').onclick = e => openProjectMenu(e.currentTarget);
  $('teamBadge').onclick = () => { const p = activeProject(); if(TEAM.status==='locked') teamSync(p, {ask:true}); else teamMenuInfo(); };
  renderTeamBadge();
  $('savePill').onclick = () => saveFile();
  renderSavePill(); renderStatus(); updateTitle();
  requestAnimationFrame(()=>moveTabInk(true));
}
/* Gleitende Markierung unter dem aktiven Arbeitsbereich */
function moveTabInk(instant){
  const ink = $('tabInk'), a = document.querySelector('#tabs [data-mod].active'); if(!ink || !a) return;
  if(instant && ui.inkPos){ ink.style.transition = 'none'; ink.style.transform = `translateX(${ui.inkPos.x}px)`; ink.style.width = ui.inkPos.w + 'px'; void ink.offsetWidth; ink.style.transition = ''; }
  const x = a.offsetLeft, w = a.offsetWidth;
  if(instant && !ui.inkPos){ ink.style.transition = 'none'; }
  ink.style.transform = `translateX(${x}px)`; ink.style.width = w + 'px';
  if(instant && !ui.inkPos){ void ink.offsetWidth; ink.style.transition = ''; }
  ui.inkPos = {x, w};
}
function openProjectMenu(btn){
  if(ui.menuBtn===btn){ closeMenu(); return; }
  const r = btn.getBoundingClientRect();
  const items = [
    ...S.projects.slice().sort((a,b)=>b.updatedAt-a.updatedAt).map(x=>({label:projectName(x), checked:x.id===S.activeProjectId, run:()=>openProject(x.id, false)})),
    {sep:1},
    {label:t('mod.projects'), icon:'grid', kbd:'Alt+1', run:()=>go('projects')},
    {label:t('f.newProject'), icon:'plus', kbd:'Ctrl+N', run:newProjectDialog}];
  openMenu(r.left, r.bottom + 4, items, t('pal.project'));
  ui.menuBtn = btn; btn.classList.add('open');
}
function renderSavePill(){
  const el = $('savePill'); if(!el) return;
  const hasFile = S.file && S.file.name, err = ui.saveState==='error', dirty = hasFile && ui.fileDirty;
  const cls = 'icon-btn save-btn' + (err ? ' error' : dirty ? ' dirty' : hasFile ? ' linked' : '');
  if(el.className!==cls) el.className = cls;
  if(!el.firstChild) el.innerHTML = ic('save',17) + '<span class="sv-dot"></span>';
  const lines = [err ? t('st.error') : hasFile ? `${S.file.name}${dirty ? ' – ' + t('st.unsaved') : ''}` : t('st.auto'), (ui.saveTime ? `${t('st.saved')} ${ui.saveTime}` : ''), `${t('f.save')} · Ctrl+S`].filter(Boolean);
  el.title = lines.join('\n');
  const sb = document.getElementById('sbSave');
  if(sb){ sb.className = 'sb-save' + (err ? ' error' : dirty ? ' dirty' : ''); sb.innerHTML = `<span class="d"></span>${esc(err ? t('st.error') : hasFile ? S.file.name + (dirty ? ' •' : '') : t('st.local'))}${ui.saveTime && !err ? `<span class="muted">· ${ui.saveTime}</span>` : ''}`; }
  updateTitle();
}
/* ---------- Eigene Fenstersteuerung (Desktop-App, rahmenloses Fenster) ---------- */
async function winAction(a){
  if(!HAS_WINCTL) return;
  try{ const st = await window.vfWin(a); if(st){ ui.winMax = !!st.max; ui.fullscreen = !!st.full; } }catch(e){}
  if(a==='max') setTimeout(syncWinState, 60);
}
async function syncWinState(){
  if(!HAS_WINCTL) return;
  try{ const st = await window.vfWinState(); const was = !!ui.winMax + ':' + !!ui.fullscreen; ui.winMax = !!st.max; ui.fullscreen = !!st.full;
    document.documentElement.classList.toggle('win-max', ui.winMax || ui.fullscreen);
    document.documentElement.classList.toggle('is-fs', !!ui.fullscreen);
    if(was !== ui.winMax + ':' + ui.fullscreen){ const b = document.querySelector('[data-win=max]'); if(b){ b.innerHTML = (ui.winMax||ui.fullscreen) ? WIN_GLYPH.restore : WIN_GLYPH.max; b.title = t((ui.winMax||ui.fullscreen) ? 'win.restore' : 'win.max'); } }
  }catch(e){}
}
function initWindowChrome(){
  if(!HAS_WINCTL) return;
  document.documentElement.classList.add('frameless');
  // Ziehen über freie Flächen der Titelleiste (wie bei normalen Programmen), Doppelklick = Maximieren
  const tb = $('topbar'); let armed = null;
  const free = el => !el.closest('button,select,input,a,.tabs,[data-menu],.menu');
  tb.addEventListener('pointerdown', e=>{ if(e.button===0 && free(e.target)) armed = {x:e.clientX, y:e.clientY}; });
  tb.addEventListener('pointermove', e=>{ if(armed && e.buttons===1 && Math.hypot(e.clientX-armed.x, e.clientY-armed.y) > 2){ armed = null; window.vfWin('drag'); } });
  window.addEventListener('pointerup', ()=>{ armed = null; });
  tb.addEventListener('dblclick', e=>{ if(free(e.target)) winAction('max'); });
  // Größe ändern an den Fensterkanten
  const edges = ['t','b','l','r','tl','tr','bl','br'];
  const wrap = document.createElement('div'); wrap.className = 'win-edges';
  wrap.innerHTML = edges.map(k=>`<div class="we we-${k}" data-edge="${k}"></div>`).join('');
  document.body.appendChild(wrap);
  wrap.addEventListener('pointerdown', e=>{ const d = e.target.closest('[data-edge]'); if(d && e.button===0){ e.preventDefault(); window.vfWin('resize:' + d.dataset.edge); } });
  window.addEventListener('resize', ()=>{ clearTimeout(ui.winT); ui.winT = setTimeout(syncWinState, 80); });
  syncWinState();
}
function updateTitle(){
  const p = activeProject(); if(!p) return;
  const title = `${ui.fileDirty ? '● ' : ''}${S.file && S.file.name ? S.file.name + ' — ' : ''}${projectName(p)} – VertexForge Studio`;
  if(document.title===title) return;
  document.title = title;
  if(IS_DESKTOP) try{ window.vfSetTitle(title); }catch(e){}
}
function renderStatus(){
  const hint = t('hint.' + S.activeModule).split(' · ').map(h=>`<span>${esc(h)}</span>`).join('');
  $('statusbar').innerHTML = `<div class="sb-hints">${ic('keyboard',13)}${hint}</div>
    <div class="sb-right"><span class="sb-save" id="sbSave"></span><span>${IS_DESKTOP ? t('sb.desktop') : t('sb.browser')}</span>
    <span class="inline">${ic('globe',12)}<select id="sbLang" aria-label="${esc(t('v.lang'))}">${LANG_ORDER.map(l=>`<option value="${l}" ${l===currentLang()?'selected':''}>${LANG_NAMES[l]}</option>`).join('')}</select></span>
    <span class="sb-ver">v${APP_VERSION}</span></div>`;
  $('sbLang').onchange = e => setLang(e.target.value);
  renderSavePill();
}
function openMainMenu(btn){
  if(ui.menuBtn===btn){ closeMenu(); return; }
  const r = btn.getBoundingClientRect();
  const m = btn.dataset.menu;
  let items = [];
  if(m==='file') items = [
    {label:t('f.newProject'), icon:'plus', kbd:'Ctrl+N', run:newProjectDialog},
    {label:t('f.open'), icon:'folder', kbd:'Ctrl+O', run:()=>openFile()},
    {sep:1},
    {label:t('f.save'), icon:'save', kbd:'Ctrl+S', run:()=>saveFile()},
    {label:t('f.saveAs'), icon:'save', kbd:'Ctrl+Shift+S', run:()=>saveFile(true)},
    {label:t('f.saveInc') + (S.file && S.file.name ? ` (${nextIncName(S.file.name)})` : ''), icon:'layers', kbd:'Ctrl+Alt+Shift+S', run:saveIncremental},
    {sep:1},
    {label:t('ver.save'), icon:'flag', kbd:'Ctrl+Alt+S', run:()=>saveVersionPrompt()},
    {label:t('ver.title'), icon:'history', kbd:'Ctrl+Alt+H', run:openVersions},
    {sep:1},
    {label:t(activeProject().team ? 'tm.manage' : 'f.teamShare'), icon:'users', run:teamShare},
    {label:t('f.teamOpen'), icon:'folder', run:teamOpen},
    {sep:1},
    {label:t('f.exportProject'), icon:'download', run:()=>exportProject(S.activeProjectId)},
    {label:t('f.backup'), icon:'download', run:exportBackup},
    {label:t('f.import'), icon:'upload', run:()=>openFile(true)},
    {sep:1},
    {label:t('f.settings'), icon:'gear', kbd:'Ctrl+,', run:openSettings}];
  if(m==='edit') items = [
    {label:t('e.undo'), icon:'undo', kbd:'Ctrl+Z', run:undo, disabled:!H.undo.length && snapshot()===H.base},
    {label:t('e.redo'), icon:'redo', kbd:'Ctrl+Shift+Z', run:redo, disabled:!H.redo.length},
    {sep:1},
    {label:t('e.search'), icon:'search', kbd:'Ctrl+K', run:openPalette}];
  if(m==='view') items = [
    ...MODULES.map((mod,i)=>({label:t('mod.'+mod), checked:S.activeModule===mod, kbd:'Alt+'+(i+1), run:()=>go(mod)})),
    {sep:1},
    {label:t('v.fullscreen'), icon:'fit', kbd:'F11', checked:!!ui.fullscreen, run:toggleFullscreen},
    {label:t('v.mode'), icon:S.settings.mode==='dark'?'sun':'moon', run:toggleMode},
    {sep:1},
    {label:t('uz.in') + ` · ${Math.round((S.settings.uiZoom||1)*100)} %`, icon:'zoomIn', kbd:'Ctrl++', run:()=>stepUiZoom(1)},
    {label:t('uz.out'), icon:'zoomOut', kbd:'Ctrl+-', run:()=>stepUiZoom(-1)},
    {label:t('uz.reset'), icon:'search', kbd:'Ctrl+0', run:()=>stepUiZoom(0)},
    {sep:1},
    ...THEMES.map(th=>({label:t('th.'+th), checked:activeProject().theme===th, run:()=>setTheme(th)}))];
  if(m==='help') items = [
    {label:t('tour.menu'), icon:'sparkle', run:startTour},
    {label:t('mod.guide'), icon:'compass', kbd:'F1', run:()=>go('guide')},
    {label:t('h.keys'), icon:'keyboard', kbd:'?', run:openKeys},
    {label:t('e.search'), icon:'search', kbd:'Ctrl+K', run:openPalette},
    {sep:1},
    {label:t('h.about'), icon:'sparkle', run:()=>dialog({title:'VertexForge Studio ' + APP_VERSION, text:t('h.aboutText')})}];
  openMenu(r.left, r.bottom + 4, items);
  ui.menuBtn = btn; btn.classList.add('open');
}
const RENDERERS = {projects:()=>renderProjects(), pipeline:()=>renderPipeline(), board:()=>renderBoard(), shots:()=>renderShots(), story:()=>renderStory(), guide:()=>renderGuide()};
function rerenderActive(){ RENDERERS[S.activeModule](); }
function render(){
  applyTheme(); renderChrome();
  document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active', v.id==='view-'+S.activeModule));
  rerenderActive();
}
function go(mod){
  if(!MODULES.includes(mod)) return;
  if(ui.xf) cancelXf();
  const prev = S.activeModule;
  if(ui.areaFull && !AREA_FULL.has(mod)) exitAreaFull();
  S.activeModule = mod; render(); persistSoon();
  const v = $('view-'+mod); if(v && !v.classList.contains('fill')) v.scrollTop = 0;
  if(prev!==mod) swipeViews(prev, mod);
}
/* Seitlicher Übergang zwischen Arbeitsbereichen – Richtung folgt der Reihenfolge der Tabs */
function swipeViews(from, to){
  const a = $('view-'+from), b = $('view-'+to); if(!a || !b) return;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const dir = MODULES.indexOf(to) > MODULES.indexOf(from) ? 1 : -1;
  document.querySelectorAll('.view.leaving,.view.entering').forEach(x=>x.classList.remove('leaving','entering'));
  [a,b].forEach(x=>x.style.setProperty('--dir', dir));
  a.classList.add('leaving'); b.classList.add('entering');
  clearTimeout(ui.swipeT);
  ui.swipeT = setTimeout(()=>{ a.classList.remove('leaving'); b.classList.remove('entering'); }, 230);
  countUp(b); staggerIn(b);
}
/* Inhalte eines Bereichs erscheinen beim Öffnen leicht versetzt – nur die ersten, damit nichts wartet */
const STAGGER_SEL = '.hub-grid > *, .kpi-row > *, .phase-list > *, .kb-list > *, .shot-table tbody > tr, .gsec, .side-list > *';
function staggerIn(root){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const els = [...root.querySelectorAll(STAGGER_SEL)].slice(0, 18);
  els.forEach((e,i)=>{ e.style.setProperty('--i', i); e.classList.add('stag'); });
  setTimeout(()=>els.forEach(e=>{ e.classList.remove('stag'); e.style.removeProperty('--i'); }), 420 + els.length*22);
}
/* Schließen mit kurzem Ausblenden: eine Kopie blendet aus, das Original ist sofort wieder frei */
function ghostOut(el){
  if(!el || !el.isConnected || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const r = el.getBoundingClientRect(); if(!r.width) return;
  const g = el.cloneNode(true); g.removeAttribute('id'); g.querySelectorAll('[id]').forEach(x=>x.removeAttribute('id'));
  g.classList.remove('open'); g.classList.add('ghost'); g.setAttribute('aria-hidden','true'); g.inert = true;
  g.style.zIndex = getComputedStyle(el).zIndex;
  el.querySelectorAll('canvas').forEach((c,i)=>{ const d = g.querySelectorAll('canvas')[i]; if(d){ d.width = c.width; d.height = c.height; try{ d.getContext('2d').drawImage(c,0,0); }catch(e){} } });
  document.body.appendChild(g); setTimeout(()=>g.remove(), 180);
}
/* Schnelle Tooltips statt der trägen Browser-Titel, Tastenkürzel als Tasten-Chips */
const TIP = {el:null, t:0, warm:0, cur:null};
function hideTip(){ clearTimeout(TIP.t); if(TIP.cur && TIP.el && TIP.el.classList.contains('show')) TIP.warm = performance.now() + 400; TIP.cur = null; if(TIP.el) TIP.el.classList.remove('show'); }
function showTip(tg){
  const raw = tg.dataset.tip; if(!raw) return;
  if(!TIP.el){ TIP.el = document.createElement('div'); TIP.el.className = 'vtip'; TIP.el.setAttribute('role','tooltip'); document.body.appendChild(TIP.el); }
  const el = TIP.el, parts = raw.split(' · '); let key = '';
  if(parts.length > 1 && /^(Ctrl|Strg|Alt|Shift|F\d|Esc|Del|Entf|⌘|⌥|⇧|\?$)/.test(parts[parts.length-1].trim())) key = parts.pop().trim();
  el.innerHTML = `<span>${esc(macKeys(parts.join(' · ')))}</span>${key ? `<span class="vtip-k">${keyHTML(key)}</span>` : ''}`;
  el.style.left = '0px'; el.style.top = '0px'; el.classList.remove('above');
  const r = tg.getBoundingClientRect(), w = el.offsetWidth, h = el.offsetHeight;
  let y = r.bottom + 7, above = false; if(y + h > innerHeight - 6){ y = r.top - h - 7; above = true; }
  el.style.left = Math.round(Math.max(6, Math.min(innerWidth - w - 6, r.left + r.width/2 - w/2))) + 'px'; el.style.top = Math.round(y) + 'px';
  el.classList.toggle('above', above); void el.offsetWidth; el.classList.add('show');
}
document.addEventListener('pointerover', e=>{
  if(e.pointerType==='touch' || !e.target.closest) return;
  const tg = e.target.closest('[title],[data-tip]:not(.bt-tool)');
  if(!tg || tg===TIP.cur || tg.classList.contains('bt-tool') || tg.closest('.vtip')) return;
  if(tg.hasAttribute('title')){ const tt = tg.getAttribute('title'); tg.removeAttribute('title'); if(!tt) return; tg.dataset.tip = tt; if(!tg.hasAttribute('aria-label') && !tg.textContent.trim()) tg.setAttribute('aria-label', tt); }
  hideTip(); TIP.cur = tg;
  TIP.t = setTimeout(()=>{ if(TIP.cur===tg && tg.isConnected) showTip(tg); }, performance.now() < TIP.warm ? 30 : 450);
});
document.addEventListener('pointerout', e=>{ if(TIP.cur && !(e.relatedTarget && TIP.cur.contains(e.relatedTarget))) hideTip(); });
['pointerdown','keydown','wheel'].forEach(ev=>document.addEventListener(ev, hideTip, true));
window.addEventListener('blur', hideTip);
/* Kennzahlen zählen beim Öffnen eines Bereichs kurz hoch */
function countUp(root){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  root.querySelectorAll('.kpi-value').forEach(el=>{
    const txt = el.textContent, m = txt.match(/^(\D*)(\d[\d.,]*)(.*)$/); if(!m || el.children.length) return;
    const target = parseFloat(m[2].replace(/[.,](?=\d{3}\b)/g,'').replace(',','.')); if(!isFinite(target) || target < 2 || /:/.test(txt)) return;
    const dec = /[.,]\d{1,2}$/.test(m[2]) ? 1 : 0, t0 = performance.now(), dur = 650;
    const step = now => { const k = Math.min(1, (now - t0)/dur), e = 1 - Math.pow(1-k, 3);
      el.textContent = k < 1 ? m[1] + (target*e).toLocaleString(locale(), {maximumFractionDigits:dec, minimumFractionDigits:dec}) + m[3] : txt;
      if(k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
}
async function toggleFullscreen(){
  if(IS_DESKTOP){ try{ ui.fullscreen = await window.vfFullscreen(); }catch(e){} }
  else{ try{ if(document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen({navigationUI:'hide'}); }catch(e){} ui.fullscreen = !!document.fullscreenElement; }
  const b = document.querySelector('[data-act=fullscreen]'); if(b) b.classList.toggle('on', !!ui.fullscreen);
  applyFsClass();
}
/* Randloses Vollbild: Titel- und Statusleiste blenden sich aus und erscheinen, wenn die Maus an den Rand fährt */
function applyFsClass(){ document.documentElement.classList.toggle('is-fs', !!ui.fullscreen); setTimeout(syncWinState, 150); }
document.addEventListener('fullscreenchange', ()=>{ if(!IS_DESKTOP){ ui.fullscreen = !!document.fullscreenElement; applyFsClass(); } });
document.addEventListener('mousemove', e=>{
  if(!ui.fullscreen) return;
  const el = document.documentElement, top = e.clientY < 8 || (el.classList.contains('fs-peek') && e.clientY < 60);
  const bottom = e.clientY > innerHeight - 8 || (el.classList.contains('fs-peek-b') && e.clientY > innerHeight - 40);
  el.classList.toggle('fs-peek', top); el.classList.toggle('fs-peek-b', bottom);
});
function toggleMode(){
  S.settings.mode = S.settings.mode==='dark' ? 'light' : 'dark';
  document.documentElement.classList.add('mode-swap'); setTimeout(()=>document.documentElement.classList.remove('mode-swap'), 260);
  render(); persistSoon();
}
function setTheme(th){ if(!THEMES.includes(th)) return; activeProject().theme = th; applyTheme(); changed(); }
function setLang(l){ if(!LANG_ORDER.includes(l)) return; S.settings.lang = l; render(); persistSoon(); toast(t('ts.lang',{l:LANG_NAMES[l]})); }
function openProject(id, navigate=true){
  if(!S.projects.some(p=>p.id===id)) return;
  S.activeProjectId = id;
  Object.assign(ui, {boardId:null, sel:new Set(), active:null, selConn:null, chapterId:null, loreId:null, editing:null});
  if(navigate && S.activeModule==='projects') S.activeModule = 'pipeline';
  render(); persistSoon();
}

/* ============================================================================
   K. EINSTELLUNGEN & TASTENKÜRZEL-ÜBERSICHT
   ============================================================================ */
async function openSettings(){
  closeMenu();
  let est = null; try{ est = navigator.storage && navigator.storage.estimate ? await navigator.storage.estimate() : null; }catch(e){}
  let persisted = null; try{ persisted = navigator.storage && navigator.storage.persisted ? await navigator.storage.persisted() : null; }catch(e){}
  let dataDir = ''; if(IS_DESKTOP){ try{ dataDir = (await window.vfInfo()).dataDir; }catch(e){} }
  const st = S.settings;
  const swRows = () => swKeys().map(k=>{
    const i = swInfo(k), custom = k.startsWith('c_'), src = swIconSrc(k);
    return `<div class="sw-row" data-swk="${k}">
      <div class="sw-ico-lg" style="background:${src?'transparent':i.color};color:${i.text}">${src?`<img src="${esc(src)}" alt="">`:esc(i.code)}</div>
      ${custom ? `<input class="inp" data-swf="name" value="${esc(i.name)}" title="${esc(t('set.swName'))}">` : `<span style="font-weight:600">${esc(i.name)}</span>`}
      <input class="inp mono" data-swf="code" value="${esc(i.code)}" maxlength="4" title="${esc(t('set.swCode'))}">
      <input class="inp mono hide-sm" data-swf="ext" value="${esc(i.ext.join(', '))}" title="${esc(t('set.swExt'))}">
      <input type="color" data-swf="color" value="${i.color}">
      <button class="btn btn-xs" data-swa="icon" title="${esc(t('set.upload'))}">${ic('image',13)}</button>
      <button class="btn btn-xs" data-swa="${custom?'del':'reset'}" title="${esc(custom?t('g.delete'):t('set.resetIcon'))}">${ic(custom?'trash':'undo',13)}</button>
    </div>`;
  }).join('');
  const html = `<div class="dlg-head"><h2>${t('set.title')}</h2><button class="icon-btn" data-close>${ic('x',18)}</button></div>
  <div class="dlg-body">
    <div class="set-sec"><div class="subhead"><span>${t('set.general')} · ${t('set.appearance')}</span></div>
      <div class="set-row"><span>${ic('globe',14)} ${t('v.lang')}</span><select class="sel" data-set="lang">${LANG_ORDER.map(l=>`<option value="${l}" ${l===st.lang?'selected':''}>${LANG_NAMES[l]}</option>`).join('')}</select></div>
      <div class="set-row"><span>${t('v.mode')}</span><div class="seg"><button data-setmode="dark" class="${st.mode==='dark'?'active':''}">${ic('moon',13)} ${t('set.dark')}</button><button data-setmode="light" class="${st.mode==='light'?'active':''}">${ic('sun',13)} ${t('set.light')}</button></div></div>
      <div class="set-row"><span>${t('v.theme')} (${esc(projectName(activeProject()))})</span><select class="sel" data-set="theme">${THEMES.map(th=>`<option value="${th}" ${th===activeProject().theme?'selected':''}>${t('th.'+th)}</option>`).join('')}</select></div>
    </div>
    <div class="set-sec"><div class="subhead"><span>${t('set.canvas')}</span></div>
      <div class="set-row"><span>${t('set.leftDrag')}</span><div class="seg"><button data-setld="select" class="${st.leftDrag==='select'?'active':''}">${t('set.ldSelect')}</button><button data-setld="pan" class="${st.leftDrag==='pan'?'active':''}">${t('set.ldPan')}</button></div></div>
      <div class="set-row"><span>${t('set.snap')}</span><label class="switch"><input type="checkbox" data-set="snap" ${st.snap?'checked':''}><span></span></label></div>
      <div class="set-row"><span>${t('set.grid')}</span><label class="switch"><input type="checkbox" data-set="grid" ${st.grid?'checked':''}><span></span></label></div>
    </div>
    <div class="set-sec"><div class="subhead"><span>${t('set.software')}</span><button class="btn btn-xs" data-swa="add">${ic('plus',13)} ${t('set.addSw')}</button></div>
      <div class="note">${t('set.softwareHint')}</div>
      <div class="set-row"><span>${t('set.sysIcons')}</span><label class="switch"><input type="checkbox" data-set="sysIcons" ${st.sysIcons?'checked':''} ${IS_DESKTOP?'':'disabled'}><span></span></label></div>
      <div class="sw-table" id="swTable">${swRows()}</div>
    </div>
    <div class="set-sec"><div class="subhead"><span>${t('set.data')}</span></div>
      ${est ? `<div class="set-row"><span>${t('set.storage',{used:fmtBytes(est.usage), quota:fmtBytes(est.quota)})}</span><div class="meter" style="width:180px"><div style="width:${clamp((est.usage||0)/(est.quota||1)*100,1,100)}%"></div></div></div>` : ''}
      ${persisted!==null ? `<div class="set-row"><span>${t('set.persist')}</span><span>${persisted ? t('g.yes') : t('g.no')}</span></div>` : ''}
      ${dataDir ? `<div class="set-row"><span>${t('set.dataDir')}</span><span class="mono" style="font-size:11px">${esc(dataDir)}</span></div>` : ''}
      <div class="inline" style="flex-wrap:wrap"><button class="btn" data-setact="samples">${ic('sparkle',14)} ${t('set.samples')}</button><button class="btn" data-setact="backup">${ic('download',14)} ${t('f.backup')}</button><button class="btn" data-setact="reset" style="color:var(--danger)">${ic('trash',14)} ${t('set.reset')}</button><button class="btn" data-setact="factory" style="color:var(--danger)">${ic('alert',14)} ${t('set.factory')}</button></div>
    </div>
  </div>
  <div class="dlg-foot"><button class="btn btn-primary" data-close>${t('g.done')}</button></div>`;
  const sh = openSheet(html);
  ui.onSheetClose = () => { loadSystemIcons(true); render(); };
  const redrawSw = () => { $('swTable').innerHTML = swRows(); };
  sh.addEventListener('click', async e=>{
    if(e.target.closest('[data-close]')) return closeSheet();
    const mode = e.target.closest('[data-setmode]'); if(mode){ st.mode = mode.dataset.setmode; applyTheme(); sh.querySelectorAll('[data-setmode]').forEach(b=>b.classList.toggle('active', b===mode)); persistSoon(); return; }
    const ld = e.target.closest('[data-setld]'); if(ld){ st.leftDrag = ld.dataset.setld; sh.querySelectorAll('[data-setld]').forEach(b=>b.classList.toggle('active', b===ld)); persistSoon(); return; }
    const sa = e.target.closest('[data-swa]');
    if(sa){
      const act = sa.dataset.swa, row = sa.closest('[data-swk]'), k = row && row.dataset.swk;
      if(act==='add'){ st.swCustom.push({key:uid('c').replace(/-/g,'_'), name:'Program', code:'PG', color:'#888888', text:'#fff', ext:[]}); redrawSw(); persistSoon(); }
      if(act==='icon'){ const [f] = await pickFiles('image/*'); if(!f) return; const ref = addAsset(await compressImage(f, 128)); st.swOverride[k] = Object.assign(st.swOverride[k]||{}, {icon:ref}); redrawSw(); persistSoon(); }
      if(act==='reset'){ delete st.swOverride[k]; redrawSw(); persistSoon(); }
      if(act==='del'){ st.swCustom = st.swCustom.filter(c=>c.key!==k); delete st.swOverride[k]; redrawSw(); persistSoon(); }
      return;
    }
    const act = e.target.closest('[data-setact]');
    if(act){
      const a = act.dataset.setact;
      if(a==='samples'){ const A = assetCtx(); demoProjects().map(p=>normalizeProject(p, A)).forEach(p=>{ if(S.projects.some(x=>x.id===p.id)) p.id = uid('proj'); S.projects.push(p); }); changed(); closeSheet(); go('projects'); }
      if(a==='backup') exportBackup();
      if(a==='factory'){ if(await confirmDelete(t('set.factoryQ'), t('set.factoryText'))){ ui.wiping = true; clearTimeout(saveTimer); await wipeAllData(); localStorage.setItem('vf.noLegacy','1'); try{ if(IS_DESKTOP && window.vfSetZoom) window.vfSetZoom(1); }catch(e){} location.reload(); } }
      if(a==='reset'){ if(await confirmDelete(t('set.resetQ'), t('set.resetText'))){ histCommit(); S.projects = [normalizeProject(blankProject(), assetCtx())]; S.activeProjectId = S.projects[0].id; S.file = {name:'', path:''}; ui.fileDirty = false; changed(); closeSheet(); go('projects'); } }
    }
  });
  sh.addEventListener('change', e=>{
    const k = e.target.dataset.set;
    if(k==='lang'){ st.lang = e.target.value; persistSoon(); closeSheet(); openSettings(); return; }
    if(k==='theme'){ setTheme(e.target.value); return; }
    if(k){ st[k] = e.target.checked; persistSoon(); return; }
    const f = e.target.dataset.swf; if(!f) return;
    const k2 = e.target.closest('[data-swk]').dataset.swk, custom = st.swCustom.find(c=>c.key===k2);
    let v = e.target.value;
    if(f==='ext') v = v.split(/[,\s]+/).map(x=>x.toLowerCase().replace(/[^a-z0-9]/g,'')).filter(Boolean).slice(0,10);
    if(f==='code') v = v.slice(0,4);
    if(custom){ custom[f] = v; if(f==='color') custom.text = contrastText(v); }
    else { st.swOverride[k2] = Object.assign(st.swOverride[k2]||{}, {[f]:v}); }
    redrawSw(); persistSoon();
  });
}
const KEYMAP = [
  ['global','Ctrl+Z','k.undo'],['global','Ctrl+Shift+Z / Ctrl+Y','k.redo'],['global','Ctrl+S','k.save'],['global','Ctrl+Shift+S','k.saveAs'],['global','Ctrl+Alt+S','ver.save'],['global','Ctrl+Alt+H','ver.title'],['global','Ctrl+Alt+Shift+S','f.saveInc'],['global','Ctrl+O','k.open'],
  ['global','Ctrl+N','k.newProject'],['global','Ctrl+K / F3','k.search'],['global','F1','k.guide'],['global','?','k.keys'],['global','Ctrl+,','k.settings'],
  ['global','Ctrl+PgUp / Ctrl+PgDn','k.workspace'],['global','Alt+1 … Alt+6','k.workspaceN'],['global','Shift+A','k.addCtx'],['global','Esc','k.esc'],['global','F11','v.fullscreen'],['global','Ctrl+Wheel / Ctrl++ / Ctrl+-','k.uiZoom'],['global','Ctrl+0','uz.reset'],
  ['board','LMB','k.select'],['board','Shift+LMB','k.selectAdd'],['board','LMB-Drag','k.box'],['board','A','k.selectAll'],['board','Alt+A','k.deselect'],['board','Ctrl+I','k.invert'],
  ['board','G','k.grab'],['board','G → X / Y','k.axis'],['board','S','k.scale'],['board','X / Del','k.delete'],['board','Shift+D','k.duplicate'],['board','Ctrl+C / Ctrl+V','k.copyPaste'],
  ['board','Ctrl+P','k.parent'],['board','Alt+P','k.unparent'],['board','Shake','k.shake'],['board','Ctrl (Drag)','k.snapToggle'],['board','Tab','k.edit'],['board','F2','k.rename'],
  ['board','Home','k.frameAll'],['board','Num . / F','k.frameSel'],['board','MMB / RMB-Drag / Space','k.pan'],['board','Wheel','k.zoom'],['board','Shift+Wheel / Alt+Wheel','k.panWheel'],
  ['board','Num+ / Num-','k.zoomKeys'],['board','PgUp / PgDn','k.order'],['board','RMB / Esc','k.cancelRmb'],['board','Ctrl+RMB-Drag','k.cut'],['board','● Drag','k.rewire'],['board','N','k.sidebar'],['board','T','k.toolbar'],['board','RMB','k.ctx'],
  ['other','Shift+A','k.addCtx'],['other','V','k.view'],['other','Ctrl+Space','k.focus'],['other','⠿ Drag / Alt+↑↓','sh.drag']
];
const KEY_DE = {Ctrl:'Strg', Del:'Entf', Home:'Pos1', Space:'Leertaste', PgUp:'Bild↑', PgDn:'Bild↓', Wheel:'Mausrad', Shake:'Schütteln', LMB:'Linksklick', RMB:'Rechtsklick', MMB:'Mitteltaste', Drag:'Ziehen'};
function kbdLabel(s){ if(currentLang()==='de') s = s.replace(/\b(Ctrl|Del)\b/g, w=>KEY_DE[w]); return macKeys(s); }
function keyHTML(s){
  const de = currentLang()==='de';
  return s.split(' / ').map(alt=>alt.split(/\+(?!$)/).map(k=>{ let x = k.trim(); if(de) x = x.replace(/[A-Za-z]+/g, w=>KEY_DE[w]||w); x = macKeys(x); return `<kbd>${esc(x)}</kbd>`; }).join('+')).join(' <span class="muted">/</span> ');
}
function keysTableHTML(){
  return `<div class="keys-grid">${['global','board','other'].map(c=>`<div class="keys-group"><h4>${t('ctx.'+c)}</h4>${KEYMAP.filter(k=>k[0]===c).map(k=>`<div class="keys-row"><span>${t(k[2])}</span><span>${keyHTML(k[1])}</span></div>`).join('')}</div>`).join('')}</div>`;
}
function openKeys(){
  closeMenu();
  const sh = openSheet(`<div class="dlg-head"><h2>${t('keys.title')}</h2><button class="icon-btn" data-close>${ic('x',18)}</button></div><div class="dlg-body">${keysTableHTML()}</div>`);
  sh.addEventListener('click', e=>{ if(e.target.closest('[data-close]')) closeSheet(); });
}

/* ============================================================================
   L. GLOBALE TASTATUR (Blender-Stil) — Modulspezifisches in MOD_KEYS
   ============================================================================ */
const MOD_KEYS = {};

/* ---------- UI-Zoom (Strg + Mausrad / Strg + / − / 0) ----------
   Desktop-App: echter WebView2-Zoom (gestochen scharf, alle Bereiche).
   Browser: der native Browser-Zoom übernimmt – wir blockieren ihn nur nicht. */
const UIZ_STEPS = [.5,.67,.75,.8,.9,1,1.1,1.25,1.4,1.6,1.8,2];
function uiZoomNative(){ return IS_DESKTOP && typeof window.vfSetZoom==='function'; }
let zoomPillTimer = 0;
function showZoomPill(z){
  let el = document.getElementById('zoomPill');
  if(!el){ el = document.createElement('div'); el.id = 'zoomPill'; el.className = 'zoom-pill'; document.body.appendChild(el); }
  el.innerHTML = `${ic('search',13)}<b>${Math.round(z*100)} %</b><span>${esc(t('uz.reset'))}: ${keyHTML('Ctrl+0')}</span>`;
  el.classList.add('show'); clearTimeout(zoomPillTimer); zoomPillTimer = setTimeout(()=>el.classList.remove('show'), 1100);
}
function setUiZoom(z, quiet){
  z = Math.round(clamp(z, .5, 2) * 100) / 100;
  if(!uiZoomNative()){ if(!quiet) toast(t('uz.browser')); return; }
  S.settings.uiZoom = z;
  try{ window.vfSetZoom(z); }catch(e){}
  persistSoon();
  if(!quiet) showZoomPill(z);
}
function stepUiZoom(dir){
  const z = S.settings.uiZoom || 1;
  const next = dir > 0 ? UIZ_STEPS.find(v=>v > z+.001) : [...UIZ_STEPS].reverse().find(v=>v < z-.001);
  setUiZoom(dir===0 ? 1 : (next || z));
}
function applyUiZoom(){ if(uiZoomNative() && S.settings.uiZoom && S.settings.uiZoom!==1){ try{ window.vfSetZoom(S.settings.uiZoom); }catch(e){} } }
window.addEventListener('wheel', e=>{
  if(!S || !(e.ctrlKey || e.metaKey)) return;
  const pinch = e.ctrlKey && Math.abs(e.deltaY) < 50 && !Number.isInteger(e.deltaY);
  if(pinch && e.target.closest && e.target.closest('#viewport')) return;   // Trackpad-Pinch zoomt das Denkbrett
  if(!uiZoomNative()) return;                                               // Browser-Zoom
  e.preventDefault(); e.stopPropagation();
  if(pinch){ setUiZoom((S.settings.uiZoom||1) * Math.exp(-e.deltaY*.01)); return; }
  const now = performance.now(); if(now - (ui.lastUiZoom||0) < 60) return; ui.lastUiZoom = now;
  stepUiZoom(e.deltaY < 0 ? 1 : -1);
}, {capture:true, passive:false});
document.addEventListener('keydown', e=>{
  if(!S || !(e.ctrlKey || e.metaKey) || e.altKey) return;
  const plus = e.key==='+' || e.key==='=' || e.code==='NumpadAdd', minus = e.key==='-' || e.code==='NumpadSubtract', zero = e.key==='0' || e.code==='Numpad0';
  if(!(plus || minus || zero)) return;
  e.stopImmediatePropagation();
  if(!uiZoomNative()) return;                                               // Browser zoomt selbst
  e.preventDefault(); stepUiZoom(plus ? 1 : minus ? -1 : 0);
}, true);

document.addEventListener('keydown', e=>{
  if(!S) return;
  if($('dialog').classList.contains('open')) return;
  if(paletteEl) return;
  if(menuEl){ if(menuKey(e)) e.preventDefault(); return; }
  const ctrl = e.ctrlKey || e.metaKey, k = (e.key||'').toLowerCase();
  if($('modal2').classList.contains('open')){ if(e.key==='Escape'){ e.preventDefault(); closeSheet(); } return; }
  if($('designer').classList.contains('open')){ if(e.key==='Escape'){ e.preventDefault(); closeDesigner(); } if(ctrl && k==='s'){ e.preventDefault(); saveDesigner(); } return; }
  const typing = isTyping(e.target);
  if(ctrl && e.altKey && e.code==='KeyS'){ e.preventDefault(); e.shiftKey ? saveIncremental() : saveVersionPrompt(); return; }
  if(ctrl && e.altKey && e.code==='KeyH'){ e.preventDefault(); openVersions(); return; }
  if(ctrl && k==='s'){ e.preventDefault(); saveFile(e.shiftKey); return; }
  if(ctrl && k==='o'){ e.preventDefault(); openFile(); return; }
  if(ctrl && k==='n'){ e.preventDefault(); newProjectDialog(); return; }
  if(ctrl && e.key===','){ e.preventDefault(); openSettings(); return; }
  if(e.key==='F3' || ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.code==='KeyK')){ e.preventDefault(); openPalette(); return; }
  if(e.key==='F1'){ e.preventDefault(); go('guide'); return; }
  if(ctrl && (e.key==='PageUp' || e.key==='PageDown')){ e.preventDefault(); const i = MODULES.indexOf(S.activeModule); go(MODULES[(i + (e.key==='PageDown'?1:-1) + MODULES.length) % MODULES.length]); return; }
  if(e.altKey && !ctrl && /^Digit[1-6]$/.test(e.code)){ e.preventDefault(); go(MODULES[+e.code.slice(5)-1]); return; }
  if(e.key==='F11'){ e.preventDefault(); AREA_FULL.has(S.activeModule) || ui.areaFull ? toggleAreaFull() : toggleFullscreen(); return; }
  if(e.key==='Escape' && ui.areaFull && !typing && !(typeof CV!=='undefined' && CV.drag) && !ui.xf && !ui.editing){ e.preventDefault(); exitAreaFull(); return; }
  if(typing && ctrl && (k==='z' || k==='y') && e.target.tagName!=='TEXTAREA'){ e.preventDefault(); e.target.blur(); (k==='y' || e.shiftKey) ? redo() : undo(); return; }
  if(typing){ if(e.key==='Escape') e.target.blur(); return; }
  if(ctrl && k==='z'){ e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if(ctrl && k==='y'){ e.preventDefault(); redo(); return; }
  if(e.key==='?'){ e.preventDefault(); openKeys(); return; }
  const h = MOD_KEYS[S.activeModule];
  if(h && h(e, ctrl, k)) e.preventDefault();
});

document.addEventListener('fullscreenchange', ()=>{ if(!IS_DESKTOP){ ui.fullscreen = !!document.fullscreenElement; const b = document.querySelector('[data-act=fullscreen]'); if(b) b.classList.toggle('on', ui.fullscreen); if(!ui.fullscreen && ui.areaFull) exitAreaFull(true); } });

/* ---------- Bereichs-Vollbild (Denkbrett, Story): nur die Arbeitsfläche, Esc beendet ---------- */
const AREA_FULL = new Set(['board','story']);
async function toggleAreaFull(){ ui.areaFull ? exitAreaFull() : enterAreaFull(); }
async function enterAreaFull(){
  if(!AREA_FULL.has(S.activeModule) || ui.areaFull) return;
  ui.areaFull = true; closeMenu(); if(typeof closeDesignPop==='function') closeDesignPop();
  document.documentElement.classList.add('area-full');
  if(!ui.fullscreen) await toggleFullscreen();
  let hint = document.getElementById('fsHint');
  if(!hint){ hint = document.createElement('div'); hint.id = 'fsHint'; hint.className = 'fs-hint'; document.body.appendChild(hint); }
  hint.innerHTML = `${ic('fit',13)}<span>${esc(t('fs.exit'))}</span><kbd>Esc</kbd>`;
  hint.classList.remove('show'); void hint.offsetWidth; hint.classList.add('show');
  clearTimeout(ui.fsT); ui.fsT = setTimeout(()=>hint.classList.remove('show'), 2200);
  setTimeout(()=>{ if(S.activeModule==='board') applyCam(); }, 60);
}
async function exitAreaFull(fromBrowser){
  if(!ui.areaFull) return;
  ui.areaFull = false;
  document.documentElement.classList.remove('area-full');
  const hint = document.getElementById('fsHint'); if(hint) hint.classList.remove('show');
  if(ui.fullscreen && !fromBrowser) await toggleFullscreen();
  rerenderActive();
}
