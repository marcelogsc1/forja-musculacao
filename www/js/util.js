/* Utilidades gerais do Forja (formatação, datas, ícones, avisos). */
// ================= utilidades =================
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone = o => JSON.parse(JSON.stringify(o));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const pad = n => String(n).padStart(2, '0');
const isoDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => isoDate(new Date());
const MES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const MESL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DIAS = ['domingo','segunda','terça','quarta','quinta','sexta','sábado'];
const fmtDLong = s => { const [y, m, d] = s.split('-'); const dt = new Date(+y, +m - 1, +d); return `${DIAS[dt.getDay()]}, ${+d} de ${MESL[+m - 1].toLowerCase()}`; };
const fmtD = s => { const [, m, d] = s.split('-'); return `${+d} ${MES[+m - 1]}`; };
const fmtN = v => (v == null || v === '') ? '' : String(+(+v).toFixed(2)).replace('.', ',');
const fmtInt = v => Math.round(v).toLocaleString('pt-BR');
const fmtVol = v => v >= 10000 ? `${fmtN(Math.round(v / 100) / 10)} t` : `${fmtInt(v)} kg`;
const parseNum = v => { if (v == null) return null; const s = String(v).trim().replace(',', '.'); if (s === '' || s === '.') return null; const n = Number(s); return isFinite(n) && n >= 0 ? n : null; };
const fmtRest = s => !s ? 'sem descanso' : s < 60 ? `${s} s` : (s % 60 ? `${Math.floor(s / 60)}min${pad(s % 60)}` : `${s / 60} min`);
const fmtClock = sec => { sec = Math.max(0, Math.floor(sec)); const h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60, s = sec % 60; return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`; };
const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
function uid(p){ return p + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function mondayOf(d){ const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - (x.getDay() + 6) % 7); return x; }
function addDays(d, n){ const x = new Date(d); x.setDate(x.getDate() + n); return x; }

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const svg = (d, extra = '') => `<svg viewBox="0 0 24 24" ${extra}><path d="${d}"/></svg>`;
const I = {
  user: svg('M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20.5c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5'),
  eye: svg('M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'),
  eyeoff: svg('M3 3l18 18M10.6 5.6A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3 3.8M6.4 6.5C3.9 8.2 2.5 12 2.5 12S6 18.5 12 18.5c1.8 0 3.3-.5 4.6-1.2M9.9 9.9a3 3 0 0 0 4.2 4.2'),
  mail: svg('M3.5 6.5h17v11h-17zM3.8 7l8.2 6.2L20.2 7'),
  lock: svg('M6 10.5h12v9H6zM8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5'),
  cal: svg('M7 3v3M17 3v3M4 8.5h16M5.5 5h13A1.5 1.5 0 0 1 20 6.5v12a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-12A1.5 1.5 0 0 1 5.5 5z'),
  chev: '<svg class="chev" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>',
  back: svg('M15 5l-7 7 7 7'), down: svg('M6 9l6 6 6-6'), up: svg('M6 15l6-6 6 6'), x: svg('M6 6l12 12M18 6L6 18'), plus: svg('M12 5v14M5 12h14'),
  edit: svg('M4 20h4L19 9l-4-4L4 16z'), check: svg('M5 12.5l4.5 4.5L19 7.5'), more: '<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/></svg>',
  play: '<svg viewBox="0 0 24 24" class="fill"><path d="M8 5.5v13l10.5-6.5z"/></svg>', swap: svg('M7 7h12l-3-3M17 17H5l3 3'), info: svg('M12 11v6M12 7.5v.5M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z'),
  note: svg('M5 4h14v16H5zM9 9h6M9 13h6'), trash: svg('M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13'), timer: svg('M12 8v5l3 2M9 2h6M12 22a8 8 0 1 1 0-16 8 8 0 0 1 0 16z'),
  trophy: svg('M8 4h8v5a4 4 0 0 1-8 0zM8 6H4.5a3.5 3.5 0 0 0 3.8 4M16 6h3.5a3.5 3.5 0 0 1-3.8 4M12 13v4M8.5 20h7M10 17h4'),
  gear: svg('M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM19.4 13.5l1.6 1.2-2 3.4-1.9-.7a7 7 0 0 1-2 1.2L14.8 21h-4l-.3-2.4a7 7 0 0 1-2-1.2l-1.9.7-2-3.4 1.6-1.2a7 7 0 0 1 0-2.4L4.6 9.9l2-3.4 1.9.7a7 7 0 0 1 2-1.2L10.8 3h4l.3 2.4a7 7 0 0 1 2 1.2l1.9-.7 2 3.4-1.6 1.2a7 7 0 0 1 0 2.4z'),
  bksp: svg('M9 5h11v14H9l-6-7zM12.5 9.5l5 5M17.5 9.5l-5 5'), hide: svg('M6 9l6 6 6-6'), arrow: svg('M5 12h14M13 6l6 6-6 6'), flame: svg('M12 21c4 0 7-2.7 7-6.8 0-4.5-4-6.6-5-11.2-2.7 2-4.6 5-4.3 8-1.4-.6-2.2-2-2.4-3.3C6 9.4 5 11.7 5 14.2 5 18.3 8 21 12 21z'),
  grip: '<svg viewBox="0 0 24 24"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>',
  brand: '<svg viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="fg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--ember)"/><stop offset="1" stop-color="var(--ember2)"/></linearGradient></defs><rect x="1" y="1" width="30" height="30" rx="10" fill="url(#fg)"/><path d="M11 23V9h11M11 16h8" stroke="var(--ember-ink)" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};
let toastUndo = null;
function toast(msg, undo, label = 'Desfazer', ms){
  const t = $('#toast'); toastUndo = undo || null;
  t.innerHTML = `<span>${esc(msg)}</span>${undo ? `<button data-act="undo">${esc(label)}</button>` : ''}`; t.hidden = false;
  clearTimeout(toast._t); toast._t = setTimeout(() => { t.hidden = true; toastUndo = null; }, ms || (undo ? 5000 : 2600));
}

