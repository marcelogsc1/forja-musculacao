// ================= estado =================
const APP_VERSION = '4.12.0';
const DEFAULT_PREFS = {theme: 'dark', inc: 2.5, bar: 20, sound: true, rest: 90, goal: 0, awake: true, pics: 'fig'};
let ST = freshState();
let SESS = [];
const UI = { tab: 'inicio', stack: [], scroll: {}, libQ: '', libM: '', libE: '', progTab: 'geral', progEx: null, progMetric: 'kg', calMonth: null, calSel: today(), bwMetric: 'kg', exTab: 'sobre', expand: {}, rtab: 'minhas', xf: {}, tplOpt: {}, bld: null };
const PAGES = {};
/* Conta nova começa vazia: nenhuma rotina pré-carregada (o usuário escolhe um programa ou monta o seu). */
function freshState(){ return { v: 4, routines: [], active: null, custom: {}, media: {}, bw: [], prefs: {...DEFAULT_PREFS}, profile: {createdAt: new Date().toISOString()} }; }
/* nomes antigos gerados pelo app, com tradução entre parênteses; nomes escritos pelo usuário não são tocados */
const OLD_WNAMES = {'Push (empurrar)': 'Push', 'Pull (puxar)': 'Pull', 'Legs (pernas)': 'Legs', 'Pull (Terra)': 'Pull A', 'Push (Supino)': 'Push A', 'Pull (Remada)': 'Pull B', 'Push (Desenvolvimento)': 'Push B'};
function fixState(){ (ST.routines || []).forEach(r => (r.workouts || []).forEach(w => { if (OLD_WNAMES[w.nome]) w.nome = OLD_WNAMES[w.nome]; })); ST.routines = ST.routines || []; ST.custom = ST.custom || {}; ST.media = ST.media || {}; ST.bw = ST.bw || []; ST.prefs = Object.assign({...DEFAULT_PREFS}, ST.prefs || {}); ST.profile = ST.profile || {}; if (!routineById(ST.active)) ST.active = ST.routines[0]?.id || null; }
function getEx(id){ return CAT[id] || ST.custom[id] || {n: 'Exercício removido', m: 'peito', p: 'custom', e: 'outros', pri: [], sec: [], d: []}; }
const exName = id => getEx(id).n;
const routineById = id => ST.routines.find(r => r.id === id);
const activeRoutine = () => routineById(ST.active) || ST.routines[0];
function findWorkout(rid, wid){ const r = routineById(rid); return r && r.workouts.find(w => w.id === wid); }
function isDark(){ const t = ST.prefs?.theme || 'dark'; return t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches); }
function applyTheme(){ const t = ST.prefs?.theme || 'dark'; const root = document.documentElement; if (t === 'system') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', t); Platform.themeColor(isDark()); }
function normSession(s){
  if (s.routine === undefined) s.routine = 'r-hip5';
  if (!s.workout && s.day) s.workout = s.day;
  if (!s.wname) s.wname = s.dayName || 'Treino';
  if (OLD_WNAMES[s.wname]) s.wname = OLD_WNAMES[s.wname];
  if (s.cor == null){ const w = findWorkout(s.routine, s.workout); s.cor = w ? w.cor : 0; }
  s.items = s.items || [];
  s.items.forEach(e => { if (!e.sets) e.sets = []; e.sets.forEach(x => { if (x.w && !x.t) x.t = 'w'; if (!x.t) x.t = 'n'; }); });
  return s;
}
function migrateOld(plano){ const r = routineFromTemplate(TEMPLATES[0], 'r-hip5', true); if (plano && Array.isArray(plano.days)) r.workouts = plano.days.map((d, i) => ({id: d.id, nome: d.nome, cor: i, items: d.items})); return r; }
let booted = false;
const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
/* Tela de entrada na primeira abertura: só com Firebase configurado, sem conta e sem nenhum dado no aparelho. */
const shouldWelcome = () => Auth.kind === 'firebase' && !lsGet('forja.welcome') && !(Store.hasAccount && Store.hasAccount()) && !Auth.user && !SESS.length && !ST.routines.length && !ST.profile.name;
function onDataLoaded(){ applyTheme(); if (booted) return; booted = true; const o = openSession(); if (o && (!location.hash.slice(1) || location.hash === '#treinar')) UI.stack = [{type: 'session', sid: o.id}]; else if (location.hash === '#treinar') setTimeout(() => A.fab(), 50); else if (shouldWelcome()) UI.stack = [{type: 'auth', first: true}]; render(); }
function isTyping(){ const a = document.activeElement; return a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT'); }
function canRerender(){ return !isTyping() && !KP.open && $('#sheet').hidden && !DRAG; }

// ================= consultas =================
/* Lista de treinos concluídos (mais recente primeiro) e índice de recordes.
   Guardados só até o fim da tarefa atual (microtask) e zerados em render e ao salvar ou apagar,
   então nunca ficam velhos, mas uma tela não refaz a mesma ordenação dezenas de vezes. */
let _doneC = null, _prC = null;
const doneReset = () => { _doneC = null; _prC = null; };
const sKey = s => s.date + (s.finishedAt || '');
const done = () => { if (!_doneC){ _doneC = SESS.filter(s => s.status === 'done').sort((a, b) => sKey(b).localeCompare(sKey(a))); queueMicrotask(doneReset); } return _doneC.slice(); };
const openSession = () => SESS.find(s => s.status === 'open');
function nextWorkout(r){
  if (!r || !r.workouts.length) return null;
  const last = done().find(s => s.routine === r.id && r.workouts.some(w => w.id === s.workout));
  if (!last) return r.workouts[0];
  const i = r.workouts.findIndex(w => w.id === last.workout);
  return r.workouts[(i + 1) % r.workouts.length];
}
/* ---- agenda da semana ----
   routine.dias = {"1": wid, ...} com a chave = dia da semana do JS (0 domingo ... 6 sábado).
   Sem agenda, vale a sequência (próximo treino depois do último feito). */
const WEEK = [1, 2, 3, 4, 5, 6, 0];
const DIA3 = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const hasSchedule = r => !!(r && r.dias && Object.values(r.dias).some(id => r.workouts.some(w => w.id === id)));
const scheduledOn = (r, d) => hasSchedule(r) ? r.workouts.find(w => w.id === r.dias[d.getDay()]) || null : null;
function defaultDays(n){ return n <= 1 ? [1] : n === 2 ? [1, 4] : n === 3 ? [1, 3, 5] : n === 4 ? [1, 2, 4, 5] : n === 5 ? [1, 2, 3, 4, 5] : n === 6 ? [1, 2, 3, 4, 5, 6] : WEEK.slice(); }
function setDays(r, days){ r.dias = {}; const ord = WEEK.filter(d => days.includes(d)); ord.forEach((d, i) => { const w = r.workouts[i % r.workouts.length]; if (w) r.dias[d] = w.id; }); if (!ord.length) delete r.dias; }
/* próximo dia (a partir de amanhã) com treino marcado */
function nextScheduled(r, from = new Date()){ for (let k = 1; k <= 7; k++){ const d = addDays(from, k); const w = scheduledOn(r, d); if (w) return {d, w, k}; } return null; }
/* O que o Início deve mostrar hoje */
function todayPlan(r){
  const td = today(); const doneToday = done().filter(s => s.date === td);
  if (doneToday.length) return {kind: 'done', s: doneToday[0], after: r ? (hasSchedule(r) ? nextScheduled(r) : {w: nextWorkout(r)}) : null};
  if (!r || !r.workouts.length) return {kind: 'none'};
  if (hasSchedule(r)){ const w = scheduledOn(r, new Date()); return w ? {kind: 'today', w} : {kind: 'rest', after: nextScheduled(r)}; }
  return {kind: 'next', w: nextWorkout(r)};
}
/* treino sugerido ao tocar em Treinar: o de hoje pela agenda, senão o próximo da sequência */
function suggested(r){ if (!r || !r.workouts.length) return null; if (hasSchedule(r)) return scheduledOn(r, new Date()) || nextScheduled(r)?.w || r.workouts[0]; return nextWorkout(r); }
const whenLabel = k => k === 1 ? 'amanhã' : k === 2 ? 'depois de amanhã' : '';
const isWork = x => x.ok && x.t !== 'w';
const workSets = e => (e.sets || []).filter(isWork);
function lastItem(ex, excludeId){
  for (const s of done()){ if (s.id === excludeId) continue; for (const e of (s.items || [])){ if (e.ex === ex && e.sets.some(x => x.ok && x.reps != null)) return {date: s.date, e}; } }
  return null;
}
function lastPerf(ex, excludeId){ const l = lastItem(ex, excludeId); if (!l) return null; const sets = workSets(l.e).filter(x => x.reps != null); return sets.length ? {date: l.date, sets} : null; }
const e1rm = (kg, reps) => kg * (1 + reps / 30);
/* melhor 1RM estimado de cada exercício, acumulado em ordem cronológica: bestBefore vira uma busca binária */
function prIndex(){
  if (_prC) return _prC; const idx = {}; done().reverse().forEach(s => { const k = sKey(s); (s.items || []).forEach(e => { let b = 0; workSets(e).forEach(x => { if (x.kg && x.reps) b = Math.max(b, e1rm(x.kg, x.reps)); }); if (!b) return; const l = idx[e.ex] || (idx[e.ex] = []); const prev = l.length ? l[l.length - 1].m : 0; l.push({k, m: Math.max(prev, b)}); }); });
  _prC = idx; return idx;
}
function bestBefore(ex, beforeKey){
  const l = prIndex()[ex]; if (!l) return 0; let lo = 0, hi = l.length; while (lo < hi){ const mid = (lo + hi) >> 1; if (l[mid].k < beforeKey) lo = mid + 1; else hi = mid; }
  return lo ? l[lo - 1].m : 0;
}
function sessionPRs(s){
  const out = []; const key = s.date + (s.finishedAt || '9');
  (s.items || []).forEach(e => {
    const prev = bestBefore(e.ex, key); if (!prev) return;
    let tp = null; workSets(e).forEach(x => { if (x.kg && x.reps){ const v = e1rm(x.kg, x.reps); if (!tp || v > tp.v) tp = {v, kg: x.kg, reps: x.reps}; } });
    if (tp && tp.v > prev + 0.01) out.push({ex: e.ex, ...tp});
  });
  return out;
}
const perfStr = p => { const kgs = [...new Set(p.sets.map(x => fmtN(x.kg)))]; return kgs.length === 1 ? `${kgs[0]} kg × ${p.sets.map(x => x.reps).join(' · ')}` : p.sets.map(x => `${fmtN(x.kg)}×${x.reps}`).join(' · '); };
const stats = s => { let sets = 0, vol = 0; (s.items || []).forEach(e => workSets(e).forEach(x => { sets++; vol += (x.kg || 0) * (x.reps || 0); })); return {sets, vol}; };
const wSets = w => w.items.reduce((a, x) => a + x.sets, 0);
const wMins = w => Math.round(w.items.reduce((a, x) => a + x.sets * (45 + (x.rest || 0)), 0) / 60 + 6);
function musclesOf(items){ const pri = new Set(), sec = new Set(); items.forEach(x => { const e = getEx(x.ex); e.pri.forEach(m => pri.add(m)); e.sec.forEach(m => sec.add(m)); }); pri.forEach(m => sec.delete(m)); return {pri: [...pri], sec: [...sec]}; }
function groupsOf(items){ const g = []; items.forEach(x => { const m = getEx(x.ex).m; if (!g.includes(m)) g.push(m); }); return g.map(m => MUSC[m] || m).join(' · '); }
function equipOf(items){ const g = []; items.forEach(x => { const m = getEx(x.ex).e; if (!g.includes(m)) g.push(m); }); return g.map(m => EQUIP[m]).join(', '); }
function regionLevels(sessions){
  const v = {}; sessions.forEach(s => (s.items || []).forEach(e => { const n = workSets(e).length; if (!n) return; const ex = getEx(e.ex); ex.pri.forEach(r => v[r] = (v[r] || 0) + n); ex.sec.forEach(r => v[r] = (v[r] || 0) + n / 2); }));
  const lv = {}; Object.entries(v).forEach(([r, n]) => { lv[r] = n >= 10 ? 3 : n >= 5 ? 2 : 1; }); return lv;
}

// ================= peças visuais =================
/* Ilustrações: Open Exercise Illustrations (CC0). Cada arquivo é um sprite [início | fim].
   window.FORJA_FIG (versão arquivo único) traz os arquivos embutidos. */
const figSrc = f => (window.FORJA_FIG && window.FORJA_FIG[f]) || `fig/${f}.webp`;
function thumb(ex, cls = ''){
  const media = ST.media[ex];
  if (media) return `<span class="demo own ${cls}" aria-hidden="true"><img src="/_blob/${esc(media)}" alt="" loading="lazy"></span>`;
  const c = CAT[ex];
  if (c && c.ph && ST.prefs.pics === 'foto' && !window.FORJA_FIG && !window.FORJA_NOPHOTO){ const src = `img/${ex}.jpg`; return `<span class="demo ${cls}" aria-hidden="true"><img class="f0" src="${src}" alt="" loading="lazy" decoding="async"><img class="f1" src="${src}" alt="" loading="lazy" decoding="async"></span>`; }
  if (c && c.f){ const src = figSrc(c.f); return `<span class="demo rx ${cls}" aria-hidden="true"><img class="f0" src="${src}" alt="" loading="lazy" decoding="async"><img class="f1" src="${src}" alt="" loading="lazy" decoding="async"></span>`; }
  return `<span class="demo custom ${cls}" aria-hidden="true">${esc((getEx(ex).n || '?').slice(0, 2).toUpperCase())}</span>`;
}
function muscleBlock(pri, sec, list = true){
  return `${BODY(pri, sec)}<div class="legend"><span style="--pc:var(--m-pri)"><i></i>Principal</span><span style="--pc:var(--m-sec)"><i></i>Secundário</span></div>
    ${list ? `<div class="mlist">${pri.map(m => `<span class="pri">${REG[m]}</span>`).join('')}${sec.map(m => `<span class="sec">${REG[m]}</span>`).join('')}</div>` : ''}`;
}
function heatBlock(lv){ return `${BODY([], [], {levels: lv})}<div class="legend"><span style="--pc:var(--m-l1)"><i></i>Pouco</span><span style="--pc:var(--m-l2)"><i></i>Moderado</span><span style="--pc:var(--m-l3)"><i></i>Bastante</span></div>`; }
const target = x => `${x.sets} × ${x.rmin}–${x.rmax}${x.rest != null ? ' · ' + fmtRest(x.rest) : ''}`;
function ring(v, max, size = 96, stroke = 10, color = 'var(--ember)'){
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, p = max ? Math.min(1, v / max) : 0;
  return `<svg viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--s2)" stroke-width="${stroke}"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p)}"/></svg>`;
}

// ================= navegação =================
const TABS = ['inicio', 'rotinas', 'exercicios', 'progresso'];
function push(page){ closeKP(); UI.scroll[UI.stack.length] = window.scrollY; UI.stack.push(page); closeSheet(); render(); window.scrollTo({top: 0}); }
function pop(){ closeKP(); UI.stack.pop(); closeSheet(); render(); window.scrollTo({top: UI.scroll[UI.stack.length] || 0}); }
function goTab(t){ closeKP(); UI.tab = t; UI.stack = []; closeSheet(); if (!Platform.isArtifact && location.hash !== '#' + t) try { history.replaceState(history.state, '', '#' + t); } catch (e) {} render(); window.scrollTo({top: 0}); }
const curPage = () => UI.stack[UI.stack.length - 1];
function initials(){ const n = (ST.profile.name || '').trim(); return n ? n.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() : ''; }
function render(){
  doneReset();
  const a = document.activeElement; const fid = a && a.id; const sel = a && a.selectionStart != null ? [a.selectionStart, a.selectionEnd] : null;
  const p = curPage(); const inSess = p && p.type === 'session';
  document.body.classList.toggle('in-session', !!inSess);
  document.body.classList.toggle('auth-mode', !!(p && p.type === 'auth'));
  if (p && p.type === 'auth' && p.first && (Store.mode === 'cloud' || Store.mode === 'api')){ UI.stack.pop(); return render(); }
  document.querySelectorAll('nav.tabs a').forEach(x => x.setAttribute('aria-current', !p && x.dataset.tab === UI.tab ? 'page' : 'false'));
  $('#fab').classList.toggle('live', !!openSession());
  const syncLbl = {cloud: 'Salvo na nuvem', pending: 'Sincronizando', local: 'Salvo só neste aparelho'}[syncClass()] || 'Conectando';
  const sync = `<span class="sync ${syncClass()}" title="${syncLbl}" role="img" aria-label="${syncLbl}"></span>`;
  let head, body;
  if (p && p.type === 'auth'){ head = ''; body = vAuth(p); }
  else if (!p){
    head = `<span class="brand">${I.brand}Forja</span><span class="sp"></span>${sync}<button class="avatar" data-act="profile" aria-label="Perfil e ajustes">${initials() || I.user}</button>`;
    body = UI.tab === 'rotinas' ? vRoutines() : UI.tab === 'exercicios' ? vLibrary() : UI.tab === 'progresso' ? vProgress() : vHome();
  } else if (inSess){
    const s = curSess(); const live = s && s.status === 'open';
    head = live ? `<button class="hbtn" data-act="minimize" aria-label="Minimizar treino">${I.down}</button><span class="ttl"><span class="clockpill" id="clock">${fmtClock((Date.now() - new Date(s.startedAt)) / 1000)}</span></span>${R.tick ? '<span class="restmini num" id="restmini"></span>' : ''}<button class="btn primary sm" data-act="finish">Finalizar</button>`
      : `<button class="hbtn" data-act="back" aria-label="Voltar">${I.back}</button><span class="ttl">${s && s.status === 'draft' ? 'Registrar treino' : 'Editar treino'}</span><button class="btn primary sm" data-act="${s && s.status === 'draft' ? 'save-draft' : 'back'}">${s && s.status === 'draft' ? 'Salvar' : 'Concluir'}</button>`;
    body = vSession();
  } else {
    const titles = {routine: () => routineById(p.rid)?.nome, template: () => tplById(p.tid)?.nome, workout: () => findWorkout(p.rid, p.wid)?.nome, exercise: () => exName(p.ex), past: () => 'Resumo', profile: () => 'Perfil'};
    head = `<button class="hbtn" data-act="back" aria-label="Voltar">${I.back}</button><span class="ttl">${esc((PAGES[p.type] ? PAGES[p.type].title(p) : (titles[p.type] || (() => ''))()) || '')}</span>${sync}<span style="width:12px"></span>`;
    body = PAGES[p.type] ? PAGES[p.type].view(p) : p.type === 'routine' ? vRoutine(p) : p.type === 'template' ? vTemplate(p) : p.type === 'workout' ? vWorkout(p) : p.type === 'exercise' ? vExercise(p) : p.type === 'past' ? vPast(p) : p.type === 'profile' ? vProfile() : '';
  }
  $('#top').innerHTML = head;
  $('#view').innerHTML = body || `<div class="empty" style="margin-top:24px"><b>Este item não existe mais.</b></div>`;
  fitNames();
  if (R.tick) drawRest();
  if (KP.open) drawKP();
  if (fid){ const el = document.getElementById(fid); if (el){ el.focus({preventScroll: true}); if (sel && el.setSelectionRange) try { el.setSelectionRange(sel[0], sel[1]); } catch (e) {} } }
}
/* Quantas camadas o voltar ainda tem para fechar (usado pelo histórico do navegador). */
function backDepth(){ return (!$('#sheet').hidden ? 1 : 0) + (KP.open ? 1 : 0) + UI.stack.length + (UI.tab !== 'inicio' ? 1 : 0); }
/* Botão voltar (Android/gesto). Devolve false quando já está na raiz. */
function handleBack(){
  if (!$('#sheet').hidden){ closeSheet(); return true; }
  if (KP.open){ closeKP(); render(); return true; }
  const p = curPage();
  if (p && p.type === 'session' && curSess()?.status === 'open'){ A.minimize(); return true; }
  if (UI.stack.length){ A.back(); return true; }
  if (UI.tab !== 'inicio'){ goTab('inicio'); return true; }
  return false;
}

// ================= Início =================
function greet(){ const h = new Date().getHours(); return h < 5 ? 'Boa noite' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; }
function isoWeek(d){ const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = x.getUTCDay() || 7; x.setUTCDate(x.getUTCDate() + 4 - day); const y0 = new Date(Date.UTC(x.getUTCFullYear(), 0, 1)); return Math.ceil(((x - y0) / 864e5 + 1) / 7); }
const pad2 = n => String(n).padStart(2, '0');
const LEGS = ['quadriceps', 'posteriores', 'gluteos', 'adutores', 'panturrilha'];
/* Frase curta do dia, a partir do foco do próximo treino (séries por grupo). */
function focusLine(w){
  if (!w || !w.items.length) return '';
  const by = {}; let tot = 0; w.items.forEach(x => { const m = getEx(x.ex).m; by[m] = (by[m] || 0) + x.sets; tot += x.sets; });
  const legs = LEGS.reduce((a, m) => a + (by[m] || 0), 0);
  if (legs / tot >= 0.6) return 'perna';
  const main = Object.entries(by).filter(([m]) => !['abdomen', 'antebraco', 'cardio'].includes(m)).sort((a, b) => b[1] - a[1]);
  if (!main.length) return (MUSC[Object.keys(by)[0]] || '').toLowerCase();
  if (legs / tot >= 0.25) return 'corpo inteiro';
  const top = main.slice(0, 2); const share = top.reduce((a, x) => a + x[1], 0) / tot;
  if (main.length >= 4 && share < 0.55) return 'superior';
  return top.map(([m]) => (MUSC[m] || m).toLowerCase()).join(' e ');
}
function relDay(iso){ const n = Math.round((new Date(today() + 'T12:00') - new Date(iso + 'T12:00')) / 864e5); return n <= 0 ? 'hoje' : n === 1 ? 'ontem' : n < 7 ? `há ${n} dias` : fmtD(iso); }
const sessMins = s => s.dur != null ? s.dur : s.startedAt && s.finishedAt ? Math.round((new Date(s.finishedAt) - new Date(s.startedAt)) / 60000) : null;
/* nome em destaque: o tamanho acompanha a palavra mais longa para nunca estourar o cartão */
function heroName(name, tag = 'h2', key = ''){
  const s = String(name).trim(); const ws = s.split(/\s+/); const k = Math.max(4, ...ws.map(x => x.length), Math.ceil(s.length / 2.3));
  const anim = key && KIN[key] !== s && !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); if (key) KIN[key] = s;
  let n = 0; const inner = ws.map(w => `<span class="w">${[...w].map(ch => `<span class="ch" style="--i:${n++}">${esc(ch)}</span>`).join('')}</span>`).join(' ');
  return `<${tag} class="cond hero-name${anim ? ' kin' : ''}" style="--k:${k}" aria-label="${esc(s)}"><span aria-hidden="true">${inner}</span></${tag}>`;
}
/* rede de segurança: se uma palavra ainda for larga demais para o cartão (fonte não carregada, nome incomum), reduz até caber */
function fitNames(){ document.querySelectorAll('.hero-name').forEach(el => { let fs = parseFloat(getComputedStyle(el).fontSize); let n = 0; while (el.scrollWidth > el.clientWidth + 1 && fs > 28 && n++ < 30){ fs -= 4; el.style.fontSize = fs + 'px'; } }); }
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => typeof render === 'function' && booted && canRerender() && render());
const glow = () => '<i class="glow g1" aria-hidden="true"></i><i class="glow g2" aria-hidden="true"></i><i class="grain" aria-hidden="true"></i>';
function vHome(){
  const r = activeRoutine(); const open = openSession(); const plan = todayPlan(r);
  const now = new Date(); const mon = mondayOf(now); const D = done(); const td = today();
  const byDate = {}; D.forEach(s => (byDate[s.date] = byDate[s.date] || []).push(s));
  const days = [...Array(7)].map((_, i) => addDays(mon, i));
  const weekSess = D.filter(s => s.date >= isoDate(mon));
  const sched = hasSchedule(r);
  const goal = ST.prefs.goal || (sched ? WEEK.filter(d => r.workouts.some(w => w.id === r.dias[d])).length : r ? Math.min(7, r.workouts.length) : 3);
  const monthCount = D.filter(s => s.date.startsWith(td.slice(0, 7))).length;
  let streak = 0; for (let k = 0; k < 104; k++){ const a = isoDate(addDays(mon, -7 * k)), b = isoDate(addDays(mon, -7 * k + 6)); if (D.some(s => s.date >= a && s.date <= b)) streak++; else if (k === 0) continue; else break; }
  const weekVol = weekSess.reduce((a, s) => a + stats(s).vol, 0);
  const picked = r && !open && UI.homeSel ? r.workouts.find(x => x.id === UI.homeSel) : null;
  const trainedToday = plan.kind === 'done';
  const f = plan.w ? focusLine(plan.w) : '';
  const line = open ? 'Treino em andamento.' : trainedToday ? 'Tá pago.' : plan.kind === 'rest' ? 'Hoje é descanso.' : f ? `Hoje é ${f}.` : r ? 'Monte o primeiro treino.' : 'Vamos montar seu treino.';
  const first = ST.profile.name ? `, ${esc(ST.profile.name.split(' ')[0])}` : '';
  let h = `<section class="greet"><div class="eyebrow">${DIAS[now.getDay()]} · semana ${isoWeek(now)}</div><h1>${greet()}${first}.</h1><p class="${trainedToday ? 'paid' : ''}">${line}</p></section>`;
  const workoutCard = (w, lbl) => { const ty = wkType(w.items, w.nome); return `<section class="hero home-hero" style="--pc:${col(w.cor)}">${glow()}<div class="hero-top"><span class="hero-lbl">${lbl}</span><span class="hero-rt">${esc(r.nome)}</span></div>
      ${heroTitle(w.nome, ty, {key: 'home', words: badgeWords(ty, w.items)})}
      <p class="hero-tag">${tagline(ty)}</p>
      ${w.items.length ? `<p class="hero-focus">${esc(groupsOf(w.items))}</p>` : ''}
      <div class="hero-stats"><div><b>${pad2(w.items.length)}</b><span>exercícios</span></div><div><b>${pad2(wSets(w))}</b><span>séries</span></div><div><b>${w.items.length ? wMins(w) : 0}′</b><span>estimados</span></div></div>
      <div class="hero-act"><button class="btn primary" data-act="start" data-rid="${r.id}" data-wid="${w.id}" ${w.items.length ? '' : 'disabled'}>${I.play}Começar</button><button class="btn ghost" data-act="open-workout" data-rid="${r.id}" data-wid="${w.id}">Ver treino</button></div></section>`; };
  const afterTxt = a => a && a.w ? (a.d ? `Próximo: ${a.k <= 2 ? whenLabel(a.k) : DIAS[a.d.getDay()]}, ${esc(a.w.nome)}` : `Próximo da sequência: ${esc(a.w.nome)}`) : '';
  if (open){
    const st = stats(open); const total = open.items.reduce((a, e) => a + e.sets.length, 0); const exDone = open.items.filter(e => e.sets.length && e.sets.every(x => x.ok)).length;
    h += `<section class="hero home-hero" style="--pc:${col(open.cor)}">${glow()}<div class="hero-top"><span class="hero-lbl live">Em andamento</span><span class="hero-rt mono">${fmtClock((Date.now() - new Date(open.startedAt)) / 1000)}</span></div>
      ${heroTitle(open.wname, wkType(open.items, open.wname), {key: 'home', words: badgeWords(wkType(open.items, open.wname), open.items)})}
      <div class="hero-stats"><div><b>${pad2(st.sets)}<small class="muted">/${pad2(total)}</small></b><span>séries feitas</span></div><div><b>${pad2(exDone)}<small class="muted">/${pad2(open.items.length)}</small></b><span>exercícios</span></div><div><b>${st.vol >= 10000 ? fmtN(Math.round(st.vol / 100) / 10) : fmtInt(st.vol)}<small class="muted">${st.vol >= 10000 ? 't' : 'kg'}</small></b><span>volume</span></div></div>
      <div class="hero-act"><button class="btn primary" data-act="open-session">${I.play}Continuar treino</button></div></section>`;
  } else if (picked){
    h += workoutCard(picked, `Treino · ${pad2(r.workouts.indexOf(picked) + 1)}/${pad2(r.workouts.length)}`);
  } else if (plan.kind === 'done'){
    const s = plan.s; const st = stats(s); const m = sessMins(s); const prs = sessionPRs(s);
    h += `<section class="hero home-hero is-done" style="--pc:var(--good)">${glow()}<div class="hero-top"><span class="hero-lbl">${I.check}Concluído hoje</span>${prs.length ? `<span class="pill good" style="margin-left:auto">${I.trophy}${prs.length} ${prs.length === 1 ? 'PR' : 'PRs'}</span>` : ''}</div>
      ${heroTitle(s.wname, 'done', {key: 'home', words: ['TÁ PAGO', s.wname, fmtD(s.date)]})}
      <p class="hero-tag">${tagline('done')}</p><p class="hero-focus">${afterTxt(plan.after) || 'Bom descanso.'}</p>
      <div class="hero-stats"><div><b>${m != null ? m : '–'}′</b><span>duração</span></div><div><b>${pad2(st.sets)}</b><span>séries</span></div><div><b>${st.vol >= 10000 ? fmtN(Math.round(st.vol / 100) / 10) : fmtInt(st.vol)}<small class="muted">${st.vol >= 10000 ? 't' : 'kg'}</small></b><span>volume</span></div></div>
      <div class="hero-act"><button class="btn ghost" style="flex:1" data-act="open-past" data-sid="${s.id}">Ver resumo do treino</button></div></section>`;
  } else if (plan.kind === 'rest'){
    const a = plan.after;
    h += `<section class="hero home-hero is-rest" style="--pc:var(--muted)">${glow()}<div class="hero-top"><span class="hero-lbl">Descanso · ${DIA3[now.getDay()]}</span><span class="hero-rt">${esc(r.nome)}</span></div>
      ${heroTitle('Descanso', 'rest', {key: 'home', words: ['REST DAY', 'SONO', 'ÁGUA', 'PROTEÍNA']})}
      <p class="hero-tag">${tagline('rest')}</p>${a ? `<p class="hero-focus">${afterTxt(a)}.</p>` : ''}
      <div class="hero-act"><button class="btn ghost" style="flex:1" data-act="fab">Treinar mesmo assim</button>${a ? `<button class="btn ghost" data-act="open-workout" data-rid="${r.id}" data-wid="${a.w.id}">Ver ${esc(a.w.nome)}</button>` : ''}</div></section>`;
  } else if (plan.kind === 'today'){
    h += workoutCard(plan.w, `Hoje · ${DIA3[now.getDay()]}`);
  } else if (plan.kind === 'next'){
    h += workoutCard(plan.w, `Próximo · ${pad2(r.workouts.indexOf(plan.w) + 1)}/${pad2(r.workouts.length)}`);
  } else if (!r){
    h += `<section class="hero home-hero" style="--pc:var(--ember)">${glow()}<div class="hero-top"><span class="hero-lbl">Primeiro passo</span></div>
      ${heroName('Comece aqui', 'h2', 'home')}
      <p class="hero-focus">Escolha um dos programas prontos ou monte um sob medida para seus dias, seu local e seu objetivo. Leva um minuto.</p>
      <div class="hero-act"><button class="btn primary" data-act="go-explore">Ver programas</button><button class="btn ghost" data-act="open-builder">Montar o meu</button></div></section>`;
  } else {
    h += `<section class="empty"><b>Rotina sem treinos</b>Adicione um treino à rotina ${esc(r.nome)}.<div style="margin-top:14px"><button class="btn primary sm" data-act="open-routine" data-rid="${r.id}">Abrir rotina</button></div></section>`;
  }
  if (r && !open && r.workouts.length > 1){
    const doneW = new Set(weekSess.filter(s => s.routine === r.id).map(s => s.workout)); const n = r.workouts.length;
    const shown = picked || plan.w || (plan.kind === 'done' ? r.workouts.find(w => w.id === plan.s.workout) : null) || null;
    const days4 = w => sched ? WEEK.filter(d => r.dias[d] === w.id).map(d => DIA3[d]).join(' ') : '';
    h += `<div class="track ${n <= 5 ? 'fit' : ''}" style="--n:${n}" role="group" aria-label="Treinos da rotina">${r.workouts.map((x, j) => `<button class="tk" style="--pc:${col(x.cor)}" data-act="home-sel" data-wid="${x.id}" aria-pressed="${x === shown}"><span class="n"><em>${sched ? (days4(x) || '—') : pad2(j + 1)}</em><i class="${doneW.has(x.id) ? 'on' : ''}" title="${doneW.has(x.id) ? 'Feito nesta semana' : ''}"></i></span><b>${esc(x.nome)}</b></button>`).join('')}</div>`;
    if (!sched) h += `<button class="sched-hint" data-act="days" data-rid="${r.id}">${I.cal || ''}<span>Defina os dias da semana de cada treino e o app mostra o certo para hoje.</span>${I.chev}</button>`;
  }
  { const pc = r ? planSummaryRow('home') : ''; if (pc) h += `<section>${pc}</section>`; }
  if (Platform.canInstall() && !installHidden()) h += installCard(true);
  if (!ST.profile.name) h += `<section><button class="lastrow" data-act="profile"><span class="avatar">${I.user}</span><div class="grow"><div class="eyebrow">Perfil</div><b>Complete seu perfil</b><div class="small muted" style="margin-top:2px">Nome, objetivo e meta semanal personalizam o app.</div></div>${I.chev}</button></section>`;
  const left = Math.max(0, goal - weekSess.length); const daysLeft = 7 - ((now.getDay() + 6) % 7) - (trainedToday ? 1 : 0);
  const hint = left === 0 ? `Meta cumprida.<span>${weekSess.length > goal ? `${weekSess.length - goal} além da meta` : 'Semana fechada'}</span>` : `Faltam ${left} ${left === 1 ? 'treino' : 'treinos'}<span>${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'} até domingo</span>`;
  h += `<section class="card wk"><div class="wk-top"><div><div class="eyebrow">Meta da semana</div><div class="wk-n"><b>${weekSess.length}</b><span>/${goal}</span></div></div><p class="wk-hint">${hint}</p></div>
    <div class="wk-bars">${days.map(d => { const k = isoDate(d); const l = byDate[k] || []; const pw = !l.length && k >= td ? scheduledOn(r, d) : null; const cls = [k === td ? 'today' : '', l.length ? 'on' : '', l.length > 1 ? 'two' : '', k > td ? 'fut' : '', pw ? 'plan' : ''].join(' '); return `<div class="wb ${cls}" style="--pc:${l.length ? col(l[0].cor) : pw ? col(pw.cor) : 'transparent'};--pc2:${l[1] ? col(l[1].cor) : 'transparent'}" title="${l.length ? l.map(s => esc(s.wname)).join(', ') : pw ? 'Planejado: ' + esc(pw.nome) : ''}"><i></i>${'STQQSSD'[(d.getDay() + 6) % 7]}</div>`; }).join('')}</div></section>
  <section class="strip"><div class="ac"><b>${streak}</b><span>${streak === 1 ? 'semana seguida' : 'semanas seguidas'}</span></div><div><b>${monthCount}</b><span>${monthCount === 1 ? 'treino' : 'treinos'} em ${MESL[now.getMonth()].toLowerCase()}</span></div><div><b>${weekVol >= 10000 ? fmtN(Math.round(weekVol / 100) / 10) : fmtInt(weekVol)}<small>${weekVol >= 10000 ? 't' : 'kg'}</small></b><span>volume na semana</span></div></section>`;
  const last = D[0];
  if (last){
    const prs = sessionPRs(last); const m = sessMins(last);
    h += `<section><button class="lastrow" style="--pc:${col(last.cor)}" data-act="open-past" data-sid="${last.id}"><span class="bar"></span><div class="grow"><div class="eyebrow">Último treino</div><b>${esc(last.wname)} <em>· ${relDay(last.date)}${m ? `, ${m} min` : ''}</em></b></div>${prs.length ? `<span class="pill good">${I.trophy}${prs.length} ${prs.length === 1 ? 'PR' : 'PRs'}</span>` : ''}${I.chev}</button></section>`;
  }
  h += `<section class="card"><div class="sec-head"><span class="eyebrow">Músculos da semana</span><button class="link" data-act="tab" data-tab="progresso">Detalhes</button></div>${weekSess.length ? heatBlock(regionLevels(weekSess)) : `<div style="opacity:.55">${heatBlock({})}</div><p class="small muted" style="text-align:center;margin:8px 0 0">O mapa acende conforme você treina.</p>`}</section>`;
  const prs = []; D.slice(0, 12).forEach(s => sessionPRs(s).forEach(p => prs.push({...p, date: s.date})));
  if (prs.length) h += `<section><div class="sec-head"><span class="eyebrow">Recordes recentes</span></div><div class="list">${prs.slice(0, 4).map(p => `<button class="li" data-act="open-ex" data-ex="${p.ex}">${thumb(p.ex)}<div class="grow"><b>${esc(exName(p.ex))}</b><span class="sub mono">${fmtN(p.kg)} kg × ${p.reps} · ${fmtD(p.date)}</span></div><span class="pill warn">PR</span></button>`).join('')}</div></section>`;
  h += `<section><div class="sec-head"><span class="eyebrow">Histórico</span>${D.length ? '<button class="link" data-act="tab" data-tab="progresso">Calendário</button>' : ''}</div>${D.length ? histList(D.slice(0, 5)) : '<div class="empty"><b>Nenhum treino ainda</b>Seus treinos concluídos aparecem aqui.</div>'}</section>`;
  return h;
}
function histList(list){ return `<div class="list">${list.map(s => { const st = stats(s); return `<button class="li noimg" data-act="open-past" data-sid="${s.id}"><span class="plate" style="--pc:${col(s.cor)}">${esc((s.wname || '?').slice(0, 1))}</span><div class="grow"><b>${esc(s.wname)}</b><span class="sub num">${fmtD(s.date)} · ${s.quick ? 'marcado sem séries' : `${st.sets} séries · ${fmtVol(st.vol)}`}</span></div>${I.chev}</button>`; }).join('')}</div>`; }

// ================= Rotinas =================
function workoutRows(r, opts = {}){
  return `<div class="list" data-drag-kind="workouts" data-drag-id="${r.id}">${r.workouts.map((w, i) => `<div class="li noimg" data-drag-row>
    ${opts.drag && r.workouts.length > 1 ? `<button class="handle" aria-label="Arrastar para reordenar">${I.grip}</button>` : ''}
    <span class="plate" style="--pc:${col(w.cor)}">${i + 1}</span>
    <button class="grow" style="background:none;border:0;padding:0;text-align:left;color:inherit" data-act="open-workout" data-rid="${r.id}" data-wid="${w.id}"><b>${esc(w.nome)}</b><span class="sub">${w.items.length} exercícios · ${wSets(w)} séries · ~${wMins(w)} min</span></button>
    <button class="icon sm" data-act="edit-workout" data-rid="${r.id}" data-wid="${w.id}" aria-label="Editar ${esc(w.nome)}">${I.edit}</button></div>`).join('')}</div>`;
}
function vRoutines(){
  const tabs = `<section class="seg" role="tablist" style="margin-top:14px">${[['minhas', 'Minhas rotinas'], ['explorar', 'Explorar']].map(([k, l]) => `<button role="tab" data-act="rtab" data-t="${k}" aria-pressed="${UI.rtab === k}">${l}</button>`).join('')}</section>`;
  const head = `<section class="row between" style="margin-top:20px"><h1 class="display h1">Rotinas</h1><button class="icon" data-act="new-routine" aria-label="Nova rotina" title="Nova rotina">${I.plus}</button></section>${tabs}`;
  if (UI.rtab === 'explorar') return head + vExplore();
  const r = activeRoutine(); const others = ST.routines.filter(x => x !== r);
  return `${head}
  ${r ? `<section><div class="sec-head"><span class="eyebrow">Rotina ativa</span><button class="link" data-act="open-routine" data-rid="${r.id}">Abrir</button></div>
    <div class="card" style="padding:16px 4px 4px"><div style="padding:0 12px 12px"><h2 class="display h2">${esc(r.nome)}</h2>${r.desc ? `<p class="small muted" style="margin:6px 0 0">${esc(r.desc)}</p>` : ''}</div>${workoutRows(r, {drag: true}).replace('class="list"', 'class="list" style="border:0;border-radius:18px;background:transparent"')}</div>
    <p class="tiny muted" style="margin:8px 4px 0">Arraste pela alça para mudar a ordem da sequência. O lápis abre a edição direto.</p></section>` : ''}
  ${others.length ? `<section><div class="sec-head"><span class="eyebrow">Outras rotinas</span></div><div class="list">${others.map(o => `<button class="li noimg" data-act="open-routine" data-rid="${o.id}"><div class="row" style="gap:3px">${o.workouts.slice(0, 4).map(w => `<span class="plate sm" style="--pc:${col(w.cor)}"></span>`).join('')}</div><div class="grow"><b>${esc(o.nome)}</b><span class="sub">${o.workouts.length} treinos · ${o.workouts.reduce((a, w) => a + wSets(w), 0)} séries por ciclo</span></div>${I.chev}</button>`).join('')}</div></section>` : ''}
`;
}
function vRoutine(p){
  const r = routineById(p.rid); if (!r) return '';
  const ed = UI.renameRoutine === r.id; const m = musclesOf(r.workouts.flatMap(w => w.items));
  return `<section>${ed ? `<div class="stack"><input id="rname" class="field" value="${esc(r.nome)}" maxlength="40" aria-label="Nome da rotina"><textarea id="rdesc" class="field" maxlength="240" aria-label="Descrição" placeholder="Descrição (opcional)">${esc(r.desc || '')}</textarea><div class="row"><button class="btn primary sm" data-act="routine-save" data-rid="${r.id}">Salvar</button><button class="btn ghost sm" data-act="routine-cancel">Cancelar</button></div></div>`
    : `<div class="row between" style="align-items:flex-start;gap:12px"><h1 class="display h1">${esc(r.nome)}</h1><button class="icon" data-act="routine-menu" data-rid="${r.id}" aria-label="Mais opções">${I.more}</button></div>${r.desc ? `<p class="ink2" style="margin:10px 0 0">${esc(r.desc)}</p>` : ''}`}
    <div class="row wrap" style="margin-top:14px">${r.id === ST.active ? '<span class="tag good">Rotina ativa</span>' : `<button class="btn primary sm" data-act="set-active" data-rid="${r.id}">Usar como rotina ativa</button>`}</div></section>
  ${r.workouts.length ? `<section><div class="sec-head"><span class="eyebrow">Dias da semana</span><button class="link" data-act="days" data-rid="${r.id}">${hasSchedule(r) ? 'Alterar' : 'Definir'}</button></div>${hasSchedule(r) ? `<div class="agenda">${WEEK.map(d => { const w = r.workouts.find(x => x.id === r.dias[d]); const isT = d === new Date().getDay(); return `<label class="ag-row ${isT ? 'today' : ''}" style="--pc:${w ? col(w.cor) : 'transparent'}"><span class="ag-d">${DIA3[d]}</span><i></i><select data-act="day-w" data-rid="${r.id}" data-d="${d}" aria-label="Treino de ${DIAS[d]}"><option value="">Descanso</option>${r.workouts.map(x => `<option value="${x.id}" ${w === x ? 'selected' : ''}>${esc(x.nome)}</option>`).join('')}</select>${isT ? '<span class="ag-t">hoje</span>' : ''}</label>`; }).join('')}</div>` : `<button class="sched-hint" style="margin-top:0" data-act="days" data-rid="${r.id}">${I.cal}<span>Sem dias fixos: o app sugere o próximo treino da sequência. Defina os dias para ele mostrar o treino certo de cada dia.</span>${I.chev}</button>`}</section>` : ''}
  <section><div class="sec-head"><span class="eyebrow">Sequência de treinos</span><button class="link" data-act="new-workout" data-rid="${r.id}">+ Treino</button></div>${r.workouts.length ? workoutRows(r, {drag: true}) : '<div class="empty"><b>Nenhum treino</b>Toque em + Treino para criar.</div>'}</section>
  <section class="card"><div class="eyebrow" style="margin-bottom:10px">Músculos do ciclo</div>${muscleBlock(m.pri, m.sec, false)}</section>`;
}
function vWorkout(p){
  const r = routineById(p.rid); const w = r && r.workouts.find(x => x.id === p.wid); if (!w) return '';
  const i = r.workouts.indexOf(w); const m = musclesOf(w.items); const ed = !!p.edit; const open = openSession();
  let h = `<section class="hero" style="--pc:${col(w.cor)};margin-top:14px">${glow()}<div class="hero-top"><span class="hero-lbl">Treino · ${pad2(i + 1)}/${pad2(r.workouts.length)}</span><span class="hero-rt">${esc(r.nome)}</span></div>
    ${ed ? `<input id="wname" class="field" style="margin-top:18px;font-size:20px;font-weight:600" value="${esc(w.nome)}" maxlength="30" aria-label="Nome do treino" data-act="wname" data-rid="${r.id}" data-wid="${w.id}">` : heroTitle(w.nome, wkType(w.items, w.nome), {tag: 'h1', key: 'wk-' + w.id, words: badgeWords(wkType(w.items, w.nome), w.items)})}
    ${w.items.length ? `<p class="hero-focus">${esc(groupsOf(w.items))}</p>` : ''}
    <div class="hero-stats"><div><b>${pad2(w.items.length)}</b><span>exercícios</span></div><div><b>${pad2(wSets(w))}</b><span>séries</span></div><div><b>${w.items.length ? wMins(w) : 0}′</b><span>estimados</span></div></div>
    ${w.items.length ? `<p class="tiny muted" style="margin:14px 0 0">Equipamentos: ${esc(equipOf(w.items))}</p>` : ''}</section>`;
  if (ed) h += `<section class="card"><div class="eyebrow" style="margin-bottom:12px">Cor do treino</div><div class="swatches">${[...Array(COLORS)].map((_, k) => `<button style="--pc:${col(k)}" data-act="wcolor" data-rid="${r.id}" data-wid="${w.id}" data-c="${k}" aria-pressed="${w.cor === k}" aria-label="Cor ${k + 1}"></button>`).join('')}</div></section>`;
  h += `<section><div class="sec-head"><span class="eyebrow">${ed ? 'Arraste para reordenar' : 'Ordem dos exercícios'}</span><button class="btn sm ${ed ? 'primary' : ''}" data-act="toggle-edit">${ed ? 'Concluir edição' : I.edit + 'Editar'}</button></div>
    ${w.items.length ? `<div class="list" data-drag-kind="items" data-drag-id="${r.id}|${w.id}">${w.items.map((x, j) => { const pp = lastPerf(x.ex); return `<div class="li" data-drag-row>
      ${ed ? `<button class="handle" aria-label="Arrastar">${I.grip}</button>` : `<span class="ord">${j + 1}</span>`}
      <button style="background:none;border:0;padding:0;flex:none" data-act="open-ex" data-ex="${x.ex}" aria-label="Ver ${esc(exName(x.ex))}">${thumb(x.ex)}</button>
      <div class="grow"><b>${esc(exName(x.ex))}</b><span class="sub num">${target(x)}</span>${!ed && pp ? `<span class="sub num">Última: ${perfStr(pp)}</span>` : ''}${x.nota && !ed ? `<span class="sub" style="color:var(--ink2)">${esc(x.nota)}</span>` : ''}</div>
      ${ed ? `<button class="icon sm" data-act="i-edit" data-j="${j}" aria-label="Editar exercício">${I.more}</button>` : ''}</div>`; }).join('')}</div>` : '<div class="empty"><b>Treino vazio</b>Adicione exercícios da biblioteca.</div>'}
    ${ed || !w.items.length ? `<button class="btn ghost block" style="margin-top:12px" data-act="i-add">${I.plus}Adicionar exercícios</button>` : ''}</section>`;
  if (ed) h += `<section class="row wrap"><button class="btn ghost sm" data-act="dup-workout" data-rid="${r.id}" data-wid="${w.id}">Duplicar treino</button><button class="btn danger sm" data-act="ask-del-workout" data-rid="${r.id}" data-wid="${w.id}">Excluir treino</button></section>`;
  h += `<section class="card"><div class="eyebrow" style="margin-bottom:10px">Músculos deste treino</div>${muscleBlock(m.pri, m.sec)}</section>`;
  if (!ed) h += `<div style="position:sticky;bottom:calc(84px + env(safe-area-inset-bottom,0px));margin-top:18px;z-index:5"><button class="btn primary block" data-act="start" data-rid="${r.id}" data-wid="${w.id}" ${open || !w.items.length ? 'disabled' : ''}>${I.play}${open ? 'Há um treino em andamento' : 'Começar treino'}</button></div>`;
  return h;
}

// ================= Biblioteca =================
function libList(){ const q = norm(UI.libQ.trim()); return [...Object.keys(CAT), ...Object.keys(ST.custom)].filter(k => { const e = getEx(k); return (!UI.libM || e.m === UI.libM) && (!UI.libE || e.e === UI.libE) && (!q || norm(e.n).includes(q) || norm(MUSC[e.m] || '').includes(q)); }); }
function vLibrary(){
  return `<section class="row between" style="margin-top:20px"><h1 class="display h1">Exercícios</h1><button class="icon" data-act="new-ex" aria-label="Criar exercício" title="Criar exercício">${I.plus}</button></section>
  <section class="stack" style="gap:12px"><div class="search">${svg('M11 17.5a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13zM20 20l-4.2-4.2')}<input id="lib-q" class="field" type="search" placeholder="Buscar por nome ou músculo" value="${esc(UI.libQ)}" data-act="libq" autocomplete="off"></div>
    <div class="chips" role="group" aria-label="Músculo"><button class="chip" data-act="libm" data-m="" aria-pressed="${!UI.libM}">Todos</button>${Object.keys(MUSC).map(m => `<button class="chip" data-act="libm" data-m="${m}" aria-pressed="${UI.libM === m}">${MUSC[m]}</button>`).join('')}</div>
    <div class="chips" role="group" aria-label="Equipamento"><button class="chip" data-act="libe" data-e="" aria-pressed="${!UI.libE}">Todo equipamento</button>${Object.keys(EQUIP).map(k => `<button class="chip" data-act="libe" data-e="${k}" aria-pressed="${UI.libE === k}">${EQUIP[k]}</button>`).join('')}</div></section>
  <section id="lib-list" style="margin-top:14px">${libRows(libList())}</section>`;
}
function libRows(list){ return `<div class="tiny muted" style="margin:0 4px 10px">${list.length} exercícios</div>${list.length ? `<div class="list lib-list">${list.map(k => { const e = getEx(k); return `<button class="li" data-act="open-ex" data-ex="${k}">${thumb(k)}<div class="grow"><b>${esc(e.n)}</b><span class="sub">${MUSC[e.m] || ''} · ${EQUIP[e.e] || ''}${ST.custom[k] ? ' · seu' : ''}</span></div>${I.chev}</button>`; }).join('')}</div>` : '<div class="empty"><b>Nada encontrado</b>Tente outro nome ou limpe os filtros.</div>'}`; }
/* Instrução completa: preparação, execução passo a passo, erros comuns e dica. Exercícios criados pelo usuário usam o texto dele. */
function instBlock(id, e){
  const x = typeof INS !== 'undefined' && INS[id];
  if (!x) return e.d && e.d.length ? `<section class="card inst"><div class="eyebrow">Execução</div><ol class="steps">${e.d.map(s => `<li>${esc(s)}</li>`).join('')}</ol></section>` : '<section class="empty"><b>Sem instrução</b>Edite o exercício para escrever como executá-lo.</section>';
  const [prep, steps, errs, tip] = x;
  return `<section class="card inst"><div class="inst-h"><span class="inst-n mono">01</span><span class="eyebrow">Preparação</span></div><p>${esc(prep)}</p></section>
  <section class="card inst"><div class="inst-h"><span class="inst-n mono">02</span><span class="eyebrow">Execução</span></div><ol class="steps">${steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol></section>
  <section class="card inst"><div class="inst-h"><span class="inst-n mono">03</span><span class="eyebrow">Erros comuns</span></div><ul class="errs">${errs.map(s => `<li>${esc(s)}</li>`).join('')}</ul></section>
  ${tip ? `<section class="inst-tip"><div class="eyebrow">Dica</div><p>${esc(tip)}</p></section>` : ''}
  <p class="tiny muted" style="margin:14px 4px 0">Orientação geral de técnica. Ajuste carga e amplitude ao seu nível e, se sentir dor, pare e procure um profissional.</p>`;
}
function exHistory(ex){ return done().slice().reverse().map(s => { const e = (s.items || []).find(e => e.ex === ex); if (!e) return null; const sets = workSets(e).filter(x => x.reps != null && x.kg != null); if (!sets.length) return null; return {date: s.date, sets, kg: Math.max(...sets.map(x => x.kg)), rm: Math.max(...sets.map(x => e1rm(x.kg, x.reps))), vol: sets.reduce((a, x) => a + x.kg * x.reps, 0)}; }).filter(Boolean); }
function vExercise(p){
  const e = getEx(p.ex); const hist = exHistory(p.ex); const t = UI.exTab;
  let h = `<section><div class="eyebrow">${MUSC[e.m] || ''} · ${EQUIP[e.e] || ''}</div><h1 class="display h1" style="margin-top:6px">${esc(e.n)}</h1></section>
  <section>${ST.media[p.ex] ? `<span class="demo own wide"><img src="/_blob/${esc(ST.media[p.ex])}" alt="Demonstração de ${esc(e.n)}"></span>` : CAT[p.ex] ? thumb(p.ex, 'wide') : ''}
    ${CAT[p.ex] && CAT[p.ex].ph && !ST.media[p.ex] && !window.FORJA_FIG && !window.FORJA_NOPHOTO ? `<div class="seg" style="margin-top:10px">${[['fig', 'Ilustração'], ['foto', 'Foto real']].map(([k, l]) => `<button data-act="pics" data-v="${k}" aria-pressed="${ST.prefs.pics === k}">${l}</button>`).join('')}</div>` : ''}
    ${Store.adapter?.assets ? `<div class="row wrap" style="margin-top:10px"><label class="btn sm" for="media-in" style="cursor:pointer">${ST.media[p.ex] ? 'Trocar minha imagem' : 'Usar minha imagem ou GIF'}</label><input id="media-in" type="file" accept="image/*" hidden data-act="media" data-ex="${p.ex}">${ST.media[p.ex] ? `<button class="link muted" data-act="media-del" data-ex="${p.ex}">Voltar à foto padrão</button>` : ''}</div>` : ''}</section>
  <section class="seg" role="tablist">${[['sobre', 'Sobre'], ['hist', 'Histórico'], ['inst', 'Instrução']].map(([k, l]) => `<button role="tab" data-act="extab" data-t="${k}" aria-pressed="${t === k}">${l}</button>`).join('')}</section>`;
  if (t === 'hist'){
    h += hist.length ? `<section class="stats"><div class="stat"><b class="num">${fmtN(Math.max(...hist.map(x => x.kg)))}</b><span>kg máximo</span></div><div class="stat ember"><b class="num">${fmtN(Math.round(Math.max(...hist.map(x => x.rm)) * 10) / 10)}</b><span>1RM estimado</span></div><div class="stat"><b class="num">${hist.length}</b><span>treinos</span></div></section>
      <section class="card">${chartBlock(hist, UI.progMetric)}</section><section class="card"><div class="eyebrow" style="margin-bottom:10px">Registros</div><div class="tablewrap"><table class="hist"><thead><tr><th>Data</th><th>Séries (kg × reps)</th><th>Máx.</th></tr></thead><tbody>${hist.slice().reverse().map(x => `<tr><td>${fmtD(x.date)}</td><td>${x.sets.map(y => `${fmtN(y.kg)}×${y.reps}`).join(' · ')}</td><td>${fmtN(x.kg)}</td></tr>`).join('')}</tbody></table></div></section>` : '<section class="empty"><b>Sem registros ainda</b>Faça este exercício num treino para ver o histórico.</section>';
  } else if (t === 'inst'){
    h += instBlock(p.ex, e);
  } else {
    h += `<section class="card"><div class="eyebrow" style="margin-bottom:10px">Músculos trabalhados</div>${muscleBlock(e.pri, e.sec)}</section>
    ${e.d && e.d.length ? `<section class="card"><div class="sec-head" style="margin-bottom:12px"><span class="eyebrow">Pontos-chave</span><button class="link" data-act="extab" data-t="inst">Instrução completa</button></div><ol class="cues">${e.d.map(c => `<li>${esc(c)}</li>`).join('')}</ol></section>` : ''}`;
    const sim = Object.keys(CAT).filter(k => k !== p.ex && CAT[k].p === e.p).slice(0, 6);
    if (sim.length) h += `<section><div class="sec-head"><span class="eyebrow">Variações do mesmo movimento</span></div><div class="list">${sim.map(k => `<button class="li" data-act="open-ex" data-ex="${k}">${thumb(k)}<div class="grow"><b>${esc(CAT[k].n)}</b><span class="sub">${EQUIP[CAT[k].e]}</span></div>${I.chev}</button>`).join('')}</div></section>`;
  }
  h += `<section class="row wrap"><button class="btn primary grow" data-act="add-to-workout" data-ex="${p.ex}">${I.plus}Adicionar a um treino</button>${ST.custom[p.ex] ? `<button class="btn danger" data-act="ask-del-custom" data-ex="${p.ex}">Excluir</button>` : ''}</section>`;
  return h;
}

// ================= Sessão (ao vivo, registro retroativo e edição) =================
/* Uma sessão tem status:
   open  → treino acontecendo agora (cronômetro, descanso, tela ligada)
   draft → registro de um treino de outro dia, ainda não salvo
   done  → treino concluído (pode ser editado depois) */
function curSess(){ const p = curPage(); if (p && p.type === 'session' && p.sid) return SESS.find(s => s.id === p.sid) || null; return openSession(); }
function prefillSets(ex, n, excludeId){
  const l = lastItem(ex, excludeId); const prev = l ? l.e.sets.filter(x => x.ok) : [];
  return Array.from({length: n}, (_, k) => { const p = prev[k] || prev[prev.length - 1]; return {kg: p ? p.kg ?? null : null, reps: p ? p.reps ?? null : null, ok: false, t: prev[k] && prev[k].t === 'w' ? 'w' : 'n', km: false, rm: false}; });
}
function buildSession(rid, wid, extra = {}){
  if (rid === 'free') return {id: uid('s'), date: today(), routine: null, workout: null, wname: 'Treino livre', cor: 5, items: [], free: true, ...extra};
  const w = findWorkout(rid, wid); if (!w) return null;
  return {id: uid('s'), date: today(), routine: rid, workout: wid, wname: w.nome, cor: w.cor, items: w.items.map(x => ({uid: x.uid, planned: x.ex, ex: x.ex, sets: prefillSets(x.ex, x.sets)})), ...extra};
}
function startSession(rid, wid){
  UI.homeSel = null;
  const o = openSession(); if (o){ toast('Já existe um treino em andamento.'); openSess(o.id); return; }
  const s = buildSession(rid, wid, {status: 'open', startedAt: new Date().toISOString()}); if (!s) return;
  SESS.push(s); saveSession(s); if (ST.prefs.awake) Platform.keepAwake(true); closeSheet(); UI.expand = {};
  openSess(s.id); Platform.haptic('medium');
}
function startRetro(rid, wid, date){
  const s = buildSession(rid, wid, {status: 'draft', date, startedAt: null, dur: 60}); if (!s) return;
  SESS.push(s); saveSession(s); closeSheet(); UI.expand = {}; UI.scroll[UI.stack.length] = window.scrollY; UI.stack.push({type: 'session', sid: s.id}); render(); window.scrollTo({top: 0});
}
function repeatSession(src){
  if (openSession()){ toast('Finalize o treino em andamento antes.'); return; }
  if (src.routine && findWorkout(src.routine, src.workout)) return startSession(src.routine, src.workout);
  const s = {id: uid('s'), date: today(), routine: null, workout: null, wname: src.wname, cor: src.cor, free: true, status: 'open', startedAt: new Date().toISOString(), items: src.items.filter(e => e.sets.some(x => x.ok)).map(e => ({uid: uid('x'), planned: e.ex, ex: e.ex, sets: prefillSets(e.ex, Math.max(1, e.sets.length))}))};
  SESS.push(s); saveSession(s); if (ST.prefs.awake) Platform.keepAwake(true); openSess(s.id);
}
function openSess(id){ closeKP(); closeSheet(); UI.stack = [{type: 'session', sid: id}]; render(); window.scrollTo({top: 0}); }
function planItem(s, e){ const w = findWorkout(s.routine, s.workout); return w && w.items.find(x => x.uid === e.uid); }
function itemTarget(s, e){ const p = planItem(s, e); const t = p ? {...p} : {sets: e.sets.length, rmin: 8, rmax: 12, rest: ST.prefs.rest, nota: ''}; if (e.rest != null) t.rest = e.rest; return t; }
/* Progressão dupla: bateu o topo da faixa em todas as séries, a carga sobe um passo e as repetições voltam ao início da faixa.
   O app diz quanto subir e aplica com um toque. */
function nextLoad(p){ const top = Math.max(0, ...p.sets.map(x => +x.kg || 0)); if (!top) return 0; const step = ST.prefs.inc || 2.5; return Math.round((top + step) / step) * step; }
function hintFor(t, p, e, k){
  if (!p) return '';
  const hit = p.sets.length >= t.sets && p.sets.every(x => x.reps >= t.rmax);
  if (!hit) return `<span class="hint keep">${I.arrow}Meta: 1 repetição a mais que da última vez</span>`;
  const nk = nextLoad(p); const open = e ? (e.sets || []).filter(x => !x.ok && x.t !== 'w') : [];
  if (!nk) return `<span class="hint up">${I.up}Meta batida da última vez: suba a carga</span>`;
  if (!open.length || open.every(x => +x.kg >= nk)) return `<span class="hint up">${I.up}Carga nova: ${fmtN(nk)} kg. Mire em ${t.rmin} repetições</span>`;
  return `<button class="hint up" data-act="hint-up" data-k="${k}" data-kg="${nk}" data-r="${t.rmin}">${I.up}Meta batida: suba para ${fmtN(nk)} kg<em>Aplicar</em></button>`;
}
function cellCls(x, f){ const v = x[f]; if (v == null) return 'blank'; return (x.ok || x[f === 'kg' ? 'km' : 'rm']) ? '' : 'auto'; }
function vSession(){
  const s = curSess();
  if (!s) return `<div class="empty" style="margin-top:24px"><b>Nenhum treino aberto</b><div style="margin-top:12px"><button class="btn primary sm" data-act="tab" data-tab="inicio">Ir para o início</button></div></div>`;
  const live = s.status === 'open';
  const st = stats(s); const total = s.items.reduce((a, e) => a + e.sets.filter(x => x.t !== 'w').length, 0);
  const cur = s.items.findIndex(e => e.sets.some(x => !x.ok));
  let h = `<section style="margin-top:16px"><div class="hero-lbl ${live ? 'live' : ''}" style="--pc:${col(s.cor)}">${live ? `${fmtD(s.date)} · em andamento` : s.status === 'draft' ? 'Registro de treino passado' : 'Editando treino salvo'}</div><h1 class="display h1" style="margin-top:10px">${esc(s.wname)}</h1>
    ${live ? '' : `<div class="formgrid" style="margin-top:14px"><label class="flabel"><span class="tiny muted">Data</span><input id="ss-date" class="field" type="date" max="${today()}" value="${s.date}" data-act="ss-date"></label><label class="flabel"><span class="tiny muted">Duração (min)</span><input id="ss-dur" class="field num" inputmode="numeric" value="${s.dur ?? (s.startedAt && s.finishedAt ? Math.round((new Date(s.finishedAt) - new Date(s.startedAt)) / 60000) : '')}" data-act="ss-dur" placeholder="opcional"></label></div>`}
    <div class="meta mono" style="margin-top:12px;font-size:12.5px"><span><b>${pad2(st.sets)}</b>/${pad2(total)} séries</span><span><b>${fmtVol(st.vol)}</b> de volume</span></div><div class="progress" style="margin-top:12px"><i style="width:${total ? st.sets / total * 100 : 0}%"></i></div>
    ${live ? '' : '<p class="tiny muted" style="margin:10px 0 0">Toque nos campos de kg e reps para anotar e no ✓ para confirmar cada série. Só séries confirmadas entram no histórico.</p>'}</section><section class="stack">`;
  s.items.forEach((e, k) => {
    const t = itemTarget(s, e); const l = lastItem(e.ex, s.id); const prevSets = l ? l.e.sets.filter(x => x.ok) : [];
    const p = lastPerf(e.ex, s.id); const allDone = e.sets.length && e.sets.every(x => x.ok);
    if (allDone && !UI.expand[k] && !(KP.open && KP.k === k)){
      const ws = workSets(e);
      h += `<article class="ex complete" id="card-${k}"><button class="ex-collapsed" data-act="expand" data-k="${k}">${thumb(e.ex)}<div class="grow"><h3 style="font-size:16px;font-weight:800">${esc(exName(e.ex))}</h3><div class="small muted num">${ws.map(x => `${fmtN(x.kg)}×${x.reps}`).join(' · ') || 'concluído'}</div></div><span class="donebadge">${I.check}</span></button></article>`;
      return;
    }
    let n = 0;
    h += `<article class="ex ${allDone ? 'complete' : k === cur && live ? 'current' : ''}" id="card-${k}">
      <div class="ex-head"><button class="thumbbtn" data-act="open-ex" data-ex="${e.ex}" aria-label="Ver como fazer">${thumb(e.ex)}</button><div class="grow"><h3>${esc(exName(e.ex))}</h3><div class="tgt num">${t.sets} × ${t.rmin}–${t.rmax} · ${t.rest ? 'descanso ' + fmtRest(t.rest) : 'sem descanso'}</div></div><button class="icon sm" data-act="ex-menu" data-k="${k}" aria-label="Opções do exercício">${I.more}</button></div>
      ${live ? hintFor(t, p, e, k) : ''}
      ${e.planned && e.ex !== e.planned ? `<div class="flag"><span>Troca só deste treino · no plano: ${esc(exName(e.planned))}</span><button data-act="unswap" data-k="${k}">Desfazer</button></div>` : ''}
      ${!e.planned ? '<div class="flag"><span>Adicionado só neste treino</span></div>' : ''}
      ${e.note ? `<div class="note">${esc(e.note)}</div>` : t.nota ? `<div class="note">${esc(t.nota)}</div>` : ''}
      <div class="sets" role="group" aria-label="Séries"><div class="hrow" aria-hidden="true"><span class="h">Série</span><span class="h">Anterior</span><span class="h">kg</span><span class="h">Reps</span><span class="h" aria-label="Feita">${I.check.replace('<svg', '<svg style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:3"')}</span></div>
      ${e.sets.map((x, j) => { if (x.t !== 'w') n++; const pv = prevSets[j]; const act = KP.open && KP.sid === s.id && KP.k === k && KP.j === j;
        return `<div class="srow ${x.ok ? 'done' : ''}"><button class="setn ${x.t !== 'n' ? x.t : ''}" data-act="set-menu" data-k="${k}" data-j="${j}" aria-label="Série ${j + 1}: tipo e opções">${x.t === 'w' ? 'A' : x.t === 'f' ? 'F' : x.t === 'd' ? 'D' : n}</button>
        <button class="prev ${pv ? 'has' : ''}" data-act="copy-prev" data-k="${k}" data-j="${j}" ${pv ? '' : 'disabled'} aria-label="Repetir valores da última vez">${pv ? `${fmtN(pv.kg)} × ${pv.reps}` : '—'}</button>
        <button class="cell ${cellCls(x, 'kg')} ${act && KP.f === 'kg' ? 'active' : ''}" id="c-${k}-${j}-kg" data-act="cell" data-k="${k}" data-j="${j}" data-f="kg" aria-label="Carga da série ${j + 1}">${act && KP.f === 'kg' && KP.buf.endsWith(',') ? KP.buf : x.kg != null ? fmtN(x.kg) : 'kg'}</button>
        <button class="cell ${cellCls(x, 'reps')} ${act && KP.f === 'reps' ? 'active' : ''}" id="c-${k}-${j}-reps" data-act="cell" data-k="${k}" data-j="${j}" data-f="reps" aria-label="Repetições da série ${j + 1}">${x.reps != null ? x.reps : `${t.rmin}–${t.rmax}`}</button>
        <button class="check ${UI.popped === `${k}-${j}` ? 'pop' : ''}" data-act="done" data-k="${k}" data-j="${j}" aria-pressed="${!!x.ok}" aria-label="Confirmar série ${j + 1}">${I.check}</button></div>`; }).join('')}</div>
      <button class="addset" data-act="addset" data-k="${k}">+ Adicionar série</button></article>`;
  });
  UI.popped = null;
  h += `</section><section class="stack"><button class="btn ghost block" data-act="add-extra">${I.plus}Adicionar exercício</button>`;
  if (live) h += `<button class="btn primary block" data-act="finish">Finalizar treino</button><button class="link muted" style="align-self:center" data-act="ask-discard">Descartar treino</button>`;
  else if (s.status === 'draft') h += `<button class="btn primary block" data-act="save-draft">Salvar no histórico</button><button class="link muted" style="align-self:center" data-act="ask-discard">Descartar registro</button>`;
  else h += `<button class="btn primary block" data-act="back">Concluir edição</button>`;
  return h + '</section>';
}
function propagate(e, j, f){
  const v = e.sets[j][f]; const mk = f === 'kg' ? 'km' : 'rm';
  for (let i = j + 1; i < e.sets.length; i++){ const y = e.sets[i]; if (y.ok || y[mk]) continue; if (e.sets[j].t !== 'w' && y.t === 'w') continue; y[f] = v; }
}
function checkSet(k, j){
  const s = curSess(); if (!s) return; const e = s.items[k]; if (!e) return; const x = e.sets[j]; if (!x) return;
  Platform.unlockAudio();
  if (x.ok){ x.ok = false; saveSession(s); render(); return; }
  if (x.reps == null){ openKP(k, j, 'reps'); toast('Anote as repetições da série.'); return; }
  x.ok = true; x.km = x.km || x.kg != null; x.rm = true;
  const others = s.items.flatMap(it => it.ex === e.ex ? workSets(it).filter(y => y !== x) : []);
  let pr = false;
  if (x.t !== 'w' && x.kg && x.reps){ const v = e1rm(x.kg, x.reps); const prev = bestBefore(e.ex, s.date + (s.finishedAt || '9')); const inS = Math.max(0, ...others.filter(y => y.kg && y.reps).map(y => e1rm(y.kg, y.reps))); if (prev && v > prev + 0.01 && v > inS + 0.01) pr = true; }
  UI.popped = `${k}-${j}`; Platform.haptic(pr ? 'success' : 'medium');
  const t = itemTarget(s, e); const allDone = e.sets.every(y => y.ok);
  saveSession(s);
  if (KP.open){ const nj = e.sets.findIndex((y, i) => i > j && !y.ok); if (nj >= 0) Object.assign(KP, {j: nj, f: 'kg', fresh: true, buf: ''}); else closeKP(); }
  render();
  if (s.status === 'open' && x.t !== 'w' && t.rest) startRest(t.rest, `${exName(e.ex)} · série ${j + 1}`);
  if (pr) toast(`Novo recorde: ${exName(e.ex)}, ${fmtN(x.kg)} kg × ${x.reps}`);
  if (allDone){ const nx = document.getElementById(`card-${k + 1}`); if (nx) setTimeout(() => nx.scrollIntoView({behavior: reduced() ? 'auto' : 'smooth', block: 'start'}), 150); }
  else if (KP.open) scrollCellIntoView();
}
function warmups(e){
  const first = e.sets.find(x => x.t !== 'w' && x.kg); if (!first) return null;
  const inc = ST.prefs.inc || 2.5; const r = v => Math.max(0, Math.round(v / inc) * inc);
  return [[0.5, 10], [0.7, 5], [0.85, 3]].map(([p, reps]) => ({kg: r(first.kg * p), reps, ok: false, t: 'w', km: true, rm: true})).filter(x => x.kg > 0);
}
function vPast(p){
  const s = SESS.find(x => x.id === p.sid); if (!s) return '';
  const st = stats(s); const prs = sessionPRs(s); const mins = s.dur != null ? s.dur : s.startedAt && s.finishedAt ? Math.round((new Date(s.finishedAt) - new Date(s.startedAt)) / 60000) : null;
  let h = p.fresh ? `<section class="hero celebrate" style="--pc:${col(s.cor)};margin-top:14px">${glow()}<div class="hero-top" style="justify-content:center"><span class="hero-lbl">Treino concluído · ${fmtD(s.date)}</span></div>${heroTitle(s.wname, 'done', {tag: 'h1', key: 'done-' + s.id, stack: true, words: ['TÁ PAGO', s.wname, fmtD(s.date)]})}<p class="hero-tag" style="max-width:none">${tagline('done')}</p><p class="ink2" style="margin:8px 0 0">${st.sets ? `Mais um tijolo na construção. ${prs.length ? 'E com recorde novo.' : 'Bom trabalho.'}` : 'Registro salvo.'}</p></section>`
    : `<section class="row" style="gap:14px;margin-top:20px"><span class="plate" style="--pc:${col(s.cor)};width:52px;height:52px;font-size:20px">${esc((s.wname || '?').slice(0, 1))}</span><div class="grow"><div class="eyebrow">${fmtDLong(s.date)}</div><h1 class="display h2" style="margin-top:4px">${esc(s.wname)}</h1></div></section>`;
  h += `<section class="stats"><div class="stat"><b class="num">${mins != null ? mins : '–'}</b><span>minutos</span></div><div class="stat"><b class="num">${st.sets}</b><span>séries</span></div><div class="stat ember"><b class="num">${st.vol >= 10000 ? fmtN(Math.round(st.vol / 100) / 10) : fmtInt(st.vol)}</b><span>${st.vol >= 10000 ? 'toneladas' : 'kg de volume'}</span></div></section>`;
  if (prs.length) h += `<section class="card"><div class="eyebrow" style="margin-bottom:4px">Recordes neste treino</div>${prs.map(x => `<div class="pr"><span class="trophy">${I.trophy}</span><div class="grow"><b style="font-size:15px">${esc(exName(x.ex))}</b><div class="small muted num">${fmtN(x.kg)} kg × ${x.reps} · 1RM est. ${fmtN(Math.round(x.v * 10) / 10)} kg</div></div></div>`).join('')}</section>`;
  h += `<section class="card"><label class="flabel"><span class="eyebrow">Como foi o treino?</span><div class="seg" style="margin-top:4px">${[['1', 'Pesado'], ['2', 'Ok'], ['3', 'Muito bom']].map(([k, l]) => `<button data-act="feel" data-sid="${s.id}" data-v="${k}" aria-pressed="${s.feel === k}">${l}</button>`).join('')}</div><textarea id="s-note" class="field" style="margin-top:10px;min-height:64px" maxlength="400" placeholder="Anotação (sono, energia, dor, ajustes)" data-act="s-note" data-sid="${s.id}">${esc(s.note || '')}</textarea></label></section>`;
  if (!s.quick && st.sets) h += `<section class="card"><div class="eyebrow" style="margin-bottom:10px">Músculos trabalhados</div>${heatBlock(regionLevels([s]))}</section>`;
  h += s.quick ? '<section class="empty"><b>Marcado como feito</b>Sem séries registradas. Toque em “Editar séries” para anotar cargas e repetições.</section>' : `<section><div class="sec-head"><span class="eyebrow">Exercícios</span></div><div class="list">${s.items.filter(e => workSets(e).length).map(e => `<button class="li" data-act="open-ex" data-ex="${e.ex}">${thumb(e.ex)}<div class="grow"><b>${esc(exName(e.ex))}</b><span class="sub num">${workSets(e).map(x => `${fmtN(x.kg)}×${x.reps}`).join(' · ')}</span></div></button>`).join('') || '<div class="li muted">Nenhuma série confirmada.</div>'}</div></section>`;
  h += `<section class="stack">${p.fresh ? '<button class="btn primary block" data-act="back">Concluir</button>' : ''}
    <div class="row"><button class="btn ghost grow" data-act="edit-session" data-sid="${s.id}">${I.edit}Editar séries</button><button class="btn ghost grow" data-act="repeat-session" data-sid="${s.id}">${I.play}Repetir</button></div>
    ${s.free && s.items.length ? `<button class="btn ghost block" data-act="save-free" data-sid="${s.id}">Salvar como treino na rotina ativa</button>` : ''}
    <button class="link muted" style="align-self:center" data-act="ask-del-session" data-sid="${s.id}">Apagar registro</button></section>`;
  return h;
}
function finishSession(s){
  s.status = 'done'; s.finishedAt = new Date().toISOString(); s.dur = Math.max(1, Math.round((new Date(s.finishedAt) - new Date(s.startedAt)) / 60000));
  saveSession(s); stopRest(); closeKP(); closeSheet(); Platform.keepAwake(false);
  UI.stack = [{type: 'past', sid: s.id, fresh: true}]; render(); window.scrollTo({top: 0}); Platform.haptic('success');
}
function saveDraft(s){
  if (!stats(s).sets && !s.items.some(e => e.sets.some(x => x.reps != null))) return confirmSheet({title: 'Nenhuma série confirmada', text: 'Confirme as séries com o ✓, ou salve como “feito sem séries”.', ok: 'Salvar sem séries', cancel: 'Voltar e anotar', onOk: () => { s.quick = true; s.items = []; commitDraft(s); }});
  const pending = s.items.reduce((a, e) => a + e.sets.filter(x => !x.ok && x.reps != null).length, 0);
  if (pending) return confirmSheet({sub: 'Salvar registro', title: `${pending} ${pending === 1 ? 'série anotada sem ✓' : 'séries anotadas sem ✓'}`, text: 'Quer confirmar todas as séries que têm repetições anotadas?', ok: 'Confirmar e salvar', cancel: 'Salvar só as confirmadas', onOk: () => { s.items.forEach(e => e.sets.forEach(x => { if (x.reps != null) x.ok = true; })); commitDraft(s); }, onCancel: () => commitDraft(s)});
  commitDraft(s);
}
function commitDraft(s){
  const dur = s.dur || 60; const start = new Date(`${s.date}T18:00:00`); s.startedAt = start.toISOString(); s.finishedAt = new Date(start.getTime() + dur * 60000).toISOString();
  s.status = 'done'; saveSession(s); closeKP(); UI.stack = [{type: 'past', sid: s.id}]; UI.tab = 'progresso'; render(); window.scrollTo({top: 0}); toast(`Treino de ${fmtD(s.date)} salvo`);
}
function quickMark(rid, wid, date){
  const w = findWorkout(rid, wid); if (!w) return;
  const s = {id: uid('q'), date, routine: rid, workout: wid, wname: w.nome, cor: w.cor, status: 'done', quick: true, startedAt: null, finishedAt: new Date(`${date}T19:00:00`).toISOString(), items: []};
  SESS.push(s); saveSession(s); closeSheet(); render(); toast(`${w.nome} marcado em ${fmtD(date)}`, () => { deleteSession(s.id); render(); });
}

// ================= teclado numérico =================
const KP = {open: false, sid: null, k: 0, j: 0, f: 'kg', fresh: true, buf: ''};
const kpSess = () => SESS.find(s => s.id === KP.sid);
function openKP(k, j, f){
  const s = curSess(); if (!s) return;
  Object.assign(KP, {open: true, sid: s.id, k, j, f, fresh: true, buf: ''}); document.body.classList.add('kp-open'); render(); scrollCellIntoView();
}
function closeKP(){ if (!KP.open) return; KP.open = false; document.body.classList.remove('kp-open'); $('#kp').hidden = true; const s = kpSess(); if (s) saveSession(s); }
function scrollCellIntoView(){ requestAnimationFrame(() => { const el = document.getElementById(`c-${KP.k}-${KP.j}-${KP.f}`); if (!el) return; const r = el.getBoundingClientRect(); const kpH = $('#kp').offsetHeight || 330; if (r.bottom > innerHeight - kpH - 12 || r.top < 70) window.scrollBy({top: r.top - (innerHeight - kpH) / 2 + 20, behavior: reduced() ? 'auto' : 'smooth'}); }); }
function plates(kg){
  const bar = ST.prefs.bar; if (kg == null || kg < bar) return '';
  let side = (kg - bar) / 2; const out = []; for (const pl of [25, 20, 15, 10, 5, 2.5, 1.25]){ while (side >= pl - 1e-9){ out.push(pl); side -= pl; } }
  return out.length ? `Anilhas por lado: <b>${out.map(fmtN).join(' + ')}</b> (barra de ${bar} kg${side > 0.01 ? `, sobra ${fmtN(side * 2)} kg` : ''})` : `Só a barra (${bar} kg)`;
}
function drawKP(){
  const s = kpSess(); const e = s && s.items[KP.k]; const x = e && e.sets[KP.j];
  if (!x){ closeKP(); return; }
  const ex = getEx(e.ex); const inc = KP.f === 'kg' ? ST.prefs.inc : 1;
  const el = $('#kp'); el.hidden = false;
  el.innerHTML = `<div class="in"><div class="kp-top"><button class="icon sm kp-x" data-act="kp-close" aria-label="Fechar teclado e tirar a seleção" title="Fechar">${I.hide}</button><div class="what"><b>${esc(ex.n)}</b><span>${x.t === 'w' ? 'Aquecimento' : `Série ${e.sets.slice(0, KP.j + 1).filter(y => y.t !== 'w').length}`} · ${KP.f === 'kg' ? 'carga (kg)' : 'repetições'}${R.tick ? ' · descanso <span id="kprest" class="num"></span>' : ''}</span></div><button class="btn sm okbtn" data-act="kp-done">${I.check}${x.ok ? 'Confirmada' : 'Série feita'}</button></div>
    ${KP.f === 'kg' && ex.e === 'barra' && x.kg ? `<div class="kp-plates">${plates(x.kg)}</div>` : ''}
    <div class="kp-grid">${['1', '2', '3'].map(d => `<button data-act="kp" data-k="${d}">${d}</button>`).join('')}<button class="fn" data-act="kp" data-k="bk" aria-label="Apagar">${I.bksp}</button>
    ${['4', '5', '6'].map(d => `<button data-act="kp" data-k="${d}">${d}</button>`).join('')}<button class="fn" data-act="kp" data-k="minus" aria-label="Diminuir ${fmtN(inc)}">−${fmtN(inc)}</button>
    ${['7', '8', '9'].map(d => `<button data-act="kp" data-k="${d}">${d}</button>`).join('')}<button class="fn" data-act="kp" data-k="plus" aria-label="Aumentar ${fmtN(inc)}">+${fmtN(inc)}</button>
    <button data-act="kp" data-k="," ${KP.f === 'reps' ? 'disabled' : ''} aria-label="Vírgula">,</button><button data-act="kp" data-k="0">0</button><button class="fn" data-act="kp-close" aria-label="Fechar teclado">${I.hide}</button><button class="go" data-act="kp" data-k="next">${KP.f === 'kg' ? 'Reps' : 'Próxima'} ${I.arrow}</button></div></div>`;
  updRestLabels();
}
function kpKey(key){
  const s = kpSess(); const e = s && s.items[KP.k]; const x = e && e.sets[KP.j]; if (!x) return;
  const f = KP.f; const mk = f === 'kg' ? 'km' : 'rm';
  if (key === 'next'){
    if (f === 'kg') KP.f = 'reps';
    else { const nj = e.sets.findIndex((y, i) => i > KP.j && !y.ok); if (nj >= 0){ KP.j = nj; KP.f = 'kg'; } else { closeKP(); render(); return; } }
    KP.fresh = true; KP.buf = ''; render(); scrollCellIntoView(); return;
  }
  if (x.ok){ x.ok = false; }
  if (key === 'plus' || key === 'minus'){ const inc = f === 'kg' ? ST.prefs.inc : 1; const base = x[f] ?? 0; const v = Math.max(0, Math.round((base + (key === 'plus' ? inc : -inc)) * 100) / 100); x[f] = f === 'reps' ? Math.round(v) : v; KP.buf = fmtN(x[f]); }
  else if (key === 'bk'){ if (KP.fresh) KP.buf = x[f] != null ? fmtN(x[f]) : ''; KP.buf = KP.buf.slice(0, -1); x[f] = parseNum(KP.buf.endsWith(',') ? KP.buf.slice(0, -1) : KP.buf); }
  else {
    if (KP.fresh) KP.buf = '';
    if (key === ',' && (f === 'reps' || KP.buf.includes(','))) return;
    let nb = KP.buf + key; if (nb === ',') nb = '0,'; nb = nb.replace(/^0(\d)/, '$1');
    if (nb.replace(',', '').length > 6) return;
    KP.buf = nb; x[f] = parseNum(nb.endsWith(',') ? nb.slice(0, -1) : nb); if (f === 'reps' && x[f] != null) x[f] = Math.round(x[f]);
  }
  KP.fresh = false; x[mk] = x[f] != null; propagate(e, KP.j, f); saveSessionSoon(s); render();
}
let saveT = null; function saveSessionSoon(s){ clearTimeout(saveT); saveT = setTimeout(() => saveSession(s), 600); }

// ================= descanso =================
const R = {end: 0, total: 0, tick: null, label: ''};
function startRest(sec, label){ if (!sec) return; R.end = Date.now() + sec * 1000; R.total = sec; R.label = label || ''; R.buzzed = false; clearInterval(R.tick); R.tick = setInterval(drawRest, 250); Platform.scheduleRestEnd(new Date(R.end), label); drawRest(); const h = $('#top'); if (h && !$('#restmini') && curPage()?.type === 'session') render(); }
function stopRest(){ clearInterval(R.tick); R.tick = null; $('#rest').hidden = true; const m = $('#restmini'); if (m) m.remove(); Platform.cancelRestEnd(); }
function updRestLabels(){ const left = Math.round((R.end - Date.now()) / 1000); const txt = left > 0 ? fmtClock(left) : 'pronto'; const a = $('#restmini'); if (a) a.textContent = txt; const b = $('#kprest'); if (b) b.textContent = txt; }
function drawRest(){
  if (!R.tick) return;
  const el = $('#rest'); const left = Math.round((R.end - Date.now()) / 1000); const over = left <= 0;
  if (over && !R.buzzed){ R.buzzed = true; Platform.alarm(); }
  if (left < -90){ stopRest(); return; }
  updRestLabels();
  const p = curPage(); if (!p || p.type !== 'session' || curSess()?.status !== 'open'){ el.hidden = true; return; }
  el.hidden = false; el.className = 'rest' + (over ? ' over' : '');
  el.innerHTML = `<div class="rring">${ring(over ? R.total : R.total - Math.max(0, left), R.total, 52, 6, over ? 'var(--good)' : 'var(--ember)')}</div><div class="grow"><div class="clock num">${over ? '+' + fmtClock(-left) : fmtClock(left)}</div><div class="lbl">${over ? 'Descanso concluído · próxima série' : esc(R.label || 'Descanso')}</div></div><button data-act="rest-sub" aria-label="Menos 15 segundos">−15</button><button data-act="rest-add" aria-label="Mais 15 segundos">+15</button><button data-act="rest-stop">${over ? 'Ok' : 'Pular'}</button>`;
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && openSession() && ST.prefs.awake) Platform.keepAwake(true); });

// ================= Progresso =================
function vProgress(){
  const t = UI.progTab;
  return `<section style="margin-top:20px"><h1 class="display h1">Progresso</h1></section><section class="seg" role="tablist">${[['geral', 'Visão geral'], ['ex', 'Cargas'], ['corpo', 'Corpo']].map(([k, l]) => `<button role="tab" data-act="progtab" data-t="${k}" aria-pressed="${t === k}">${l}</button>`).join('')}</section>${t === 'ex' ? progEx() : t === 'corpo' ? progBody() : progGeneral()}`;
}
function progGeneral(){
  const now = new Date(); if (!UI.calMonth) UI.calMonth = [now.getFullYear(), now.getMonth()];
  const [y, m] = UI.calMonth; const D = done(); const byDate = {}; D.forEach(s => (byDate[s.date] = byDate[s.date] || []).push(s));
  const first = new Date(y, m, 1); const lead = (first.getDay() + 6) % 7; const dim = new Date(y, m + 1, 0).getDate();
  let cells = ''; for (let k = 0; k < lead; k++) cells += '<button class="out" tabindex="-1" aria-hidden="true"></button>';
  for (let d = 1; d <= dim; d++){ const ds = `${y}-${pad(m + 1)}-${pad(d)}`; const l = byDate[ds] || []; cells += `<button class="${l.length ? 'has' : ''} ${ds === today() ? 'today' : ''} ${ds === UI.calSel ? 'sel' : ''}" style="--pc:${l.length ? col(l[0].cor) : 'transparent'}" data-act="calsel" data-date="${ds}" aria-label="${d} de ${MESL[m]}${l.length ? ', ' + l.map(s => s.wname).join(' e ') : ''}"><span>${d}</span><span class="dots">${l.slice(0, 3).map(s => `<i style="--pc:${col(s.cor)}"></i>`).join('')}</span></button>`; }
  const sel = byDate[UI.calSel] || []; const [, sm, sd] = UI.calSel.split('-'); const future = UI.calSel > today(); const r = activeRoutine();
  const mon = mondayOf(now); const weeks = [...Array(8)].map((_, i) => { const a = addDays(mon, -7 * (7 - i)); const n = D.filter(s => s.date >= isoDate(a) && s.date <= isoDate(addDays(a, 6))).length; return {a, n}; });
  const maxN = Math.max(5, ...weeks.map(w => w.n));
  const tgt = {}; if (r) r.workouts.forEach(w => w.items.forEach(x => { const g = getEx(x.ex).m; tgt[g] = (tgt[g] || 0) + x.sets; }));
  const weekS = D.filter(s => s.date >= isoDate(mon)); const got = {}; weekS.forEach(s => (s.items || []).forEach(e => { const g = getEx(e.ex).m; const n = workSets(e).length; if (n) got[g] = (got[g] || 0) + n; }));
  const rows = Object.keys(MUSC).filter(g => tgt[g] || got[g]);
  return `<section class="card"><div class="row between"><button class="icon sm" data-act="calnav" data-d="-1" aria-label="Mês anterior">${I.back}</button><h2 class="display h3">${MESL[m]} ${y}</h2><button class="icon sm" data-act="calnav" data-d="1" aria-label="Próximo mês">${svg('M9 5l7 7-7 7')}</button></div>
    <div class="cal">${['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map(w => `<span class="wd">${w}</span>`).join('')}${cells}</div>
    <div style="border-top:1px solid var(--line);margin-top:14px;padding-top:12px"><div class="eyebrow">${+sd} de ${MESL[+sm - 1].toLowerCase()}</div>
    ${sel.length ? `<div style="margin:8px -14px 0">${sel.map(s => { const st = stats(s); return `<button class="li noimg" data-act="open-past" data-sid="${s.id}"><span class="plate" style="--pc:${col(s.cor)}">${esc((s.wname || '?').slice(0, 1))}</span><div class="grow"><b>${esc(s.wname)}</b><span class="sub num">${s.quick ? 'marcado sem séries' : `${st.sets} séries · ${fmtVol(st.vol)}`}</span></div>${I.chev}</button>`; }).join('')}</div>` : `<p class="small muted" style="margin:8px 0 0">${future ? 'Esse dia ainda não chegou.' : 'Nenhum treino neste dia.'}</p>`}
    ${!future ? `<div style="margin-top:14px" class="stack"><button class="btn ${sel.length ? 'ghost' : 'primary'} block" data-act="retro-sheet" data-date="${UI.calSel}">${I.plus}Registrar treino ${UI.calSel === today() ? 'de hoje' : 'neste dia'}</button>${r ? `<div><div class="tiny muted" style="margin-bottom:8px">Ou só marcar como feito, sem séries:</div><div class="row wrap" style="gap:6px">${r.workouts.map(w => `<button class="chip" data-act="quick" data-rid="${r.id}" data-wid="${w.id}"><span class="plate sm" style="--pc:${col(w.cor)}"></span>${esc(w.nome)}</button>`).join('')}</div></div>` : ''}</div>` : ''}</div></section>
  <section class="card"><div class="eyebrow" style="margin-bottom:12px">Treinos por semana</div>
    <svg class="chart" viewBox="0 0 360 150" role="img" aria-label="Treinos por semana nas últimas 8 semanas">${weeks.map((w, i) => { const x = 8 + i * 44; const hh = w.n / maxN * 92; return `<rect x="${x}" y="${116 - hh}" width="34" height="${Math.max(hh, 3)}" rx="8" fill="${i === 7 ? 'var(--ember)' : 'var(--s3)'}"><title>${w.n} treinos</title></rect><text x="${x + 17}" y="${109 - hh}" text-anchor="middle" font-size="12" font-weight="800" fill="var(--ink)">${w.n || ''}</text><text x="${x + 17}" y="136" text-anchor="middle" font-size="10" fill="var(--muted)">${i === 7 ? 'atual' : fmtD(isoDate(w.a))}</text>`; }).join('')}</svg></section>
  ${r ? `<section class="card"><div class="eyebrow">Séries por músculo nesta semana</div><p class="tiny muted" style="margin:4px 0 14px">Feitas / previstas no ciclo de ${esc(r.nome)}</p><div class="stack" style="gap:10px">${rows.map(g => `<div class="mbar"><span>${MUSC[g]}</span><span class="track"><i class="${tgt[g] && (got[g] || 0) >= tgt[g] ? 'full' : ''}" style="width:${tgt[g] ? Math.min(100, (got[g] || 0) / tgt[g] * 100) : 100}%"></i></span><span class="num">${got[g] || 0}/${tgt[g] || 0}</span></div>`).join('')}</div></section>` : ''}
  <section class="card"><div class="eyebrow" style="margin-bottom:10px">Mapa de 30 dias</div>${heatBlock(regionLevels(D.filter(s => s.date >= isoDate(addDays(now, -30)))))}</section>`;
}
function lineChart(pts, unit){
  const W = 360, H = 210, L = 38, Rr = 12, T = 24, B = 28;
  const vals = pts.map(p => p.v); let lo = Math.min(...vals), hi = Math.max(...vals);
  if (hi === lo){ hi += 1; lo = Math.max(0, lo - 1); }
  const sp = hi - lo; lo = Math.max(0, lo - sp * .2); hi += sp * .2;
  const raw = (hi - lo) / 4; const p10 = Math.pow(10, Math.floor(Math.log10(raw))); const nn = raw / p10; const step = (nn < 1.5 ? 1 : nn < 3.5 ? 2 : nn < 7.5 ? 5 : 10) * p10;
  const ticks = []; for (let t = Math.ceil(lo / step) * step; t <= hi + 1e-9; t += step) ticks.push(t);
  const x = i => pts.length === 1 ? L + (W - L - Rr) / 2 : L + i * (W - L - Rr) / (pts.length - 1);
  const yv = v => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${yv(p.v).toFixed(1)}`).join('');
  const area = pts.length > 1 ? `${path}L${x(pts.length - 1).toFixed(1)},${H - B}L${x(0).toFixed(1)},${H - B}Z` : '';
  const li = pts.length - 1; const every = Math.ceil(pts.length / 5);
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolução em ${unit}"><defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--ember)" stop-opacity=".35"/><stop offset="1" stop-color="var(--ember)" stop-opacity="0"/></linearGradient></defs>
    ${ticks.map(t => `<line x1="${L}" x2="${W - Rr}" y1="${yv(t)}" y2="${yv(t)}" stroke="var(--line)"/><text x="${L - 8}" y="${yv(t) + 4}" text-anchor="end" font-size="11" fill="var(--muted)">${fmtN(Math.round(t * 10) / 10)}</text>`).join('')}
    ${area ? `<path d="${area}" fill="url(#ag)"/>` : ''}<path d="${path}" fill="none" stroke="var(--ember)" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>
    ${pts.map((p, i) => `<circle cx="${x(i)}" cy="${yv(p.v)}" r="${i === li ? 6 : 3.5}" fill="${i === li ? 'var(--ember)' : 'var(--s1)'}" stroke="var(--ember)" stroke-width="2"><title>${fmtD(p.date)}: ${fmtN(Math.round(p.v * 10) / 10)} ${unit}</title></circle>`).join('')}
    ${pts.map((p, i) => (i === li || (i % every === 0 && x(li) - x(i) >= 46)) ? `<text x="${x(i)}" y="${H - 8}" text-anchor="${pts.length > 1 && i === li ? 'end' : pts.length > 1 && i === 0 ? 'start' : 'middle'}" font-size="10.5" fill="var(--muted)">${fmtD(p.date)}</text>` : '').join('')}
    <text x="${Math.min(x(li), W - Rr - 4)}" y="${yv(pts[li].v) - 13}" text-anchor="${pts.length > 1 ? 'end' : 'middle'}" font-size="13" font-weight="800" fill="var(--ink)">${fmtN(Math.round(pts[li].v * 10) / 10)} ${unit}</text></svg>`;
}
function chartBlock(hist, mt){
  const pts = hist.map(h => ({date: h.date, v: mt === 'rm' ? h.rm : mt === 'vol' ? h.vol : h.kg})); const d = pts.length > 1 ? pts[pts.length - 1].v - pts[0].v : 0;
  return `<div class="seg" role="group" aria-label="Medida">${[['kg', 'Carga máx.'], ['rm', '1RM est.'], ['vol', 'Volume']].map(([k, l]) => `<button data-act="metric" data-m="${k}" aria-pressed="${mt === k}">${l}</button>`).join('')}</div>
    <div style="margin:16px 0 4px"><div class="display h1 num" style="color:${d >= 0 ? 'var(--ink)' : 'var(--bad)'}">${pts.length > 1 ? `${d >= 0 ? '+' : '−'}${fmtN(Math.abs(Math.round(d * 10) / 10))}` : fmtN(Math.round(pts[0].v * 10) / 10)}<span style="font-size:20px"> kg</span></div>
    <div class="small muted">${pts.length > 1 ? `desde ${fmtD(pts[0].date)} · ${pts.length} treinos` : 'primeiro registro; a linha aparece no próximo treino'}${mt === 'rm' ? ' · estimativa (Epley), não um teste real' : mt === 'vol' ? ' · kg × repetições somados' : ''}</div></div>${lineChart(pts, 'kg')}`;
}
function progEx(){
  const exs = []; done().forEach(s => (s.items || []).forEach(e => { if (!exs.includes(e.ex) && workSets(e).some(x => x.kg != null && x.reps != null)) exs.push(e.ex); }));
  if (!exs.length) return `<section class="empty"><b>Seus gráficos de carga aparecem aqui</b>Registre kg e repetições num treino. A partir do segundo registro do mesmo exercício a linha começa a subir.</section>`;
  if (!UI.progEx || !exs.includes(UI.progEx)) UI.progEx = exs[0];
  const hist = exHistory(UI.progEx); const groups = {}; exs.forEach(k => { const g = getEx(k).m; (groups[g] = groups[g] || []).push(k); });
  return `<section class="card stack"><label class="flabel"><span class="eyebrow">Exercício</span><select id="prog-ex" class="field" data-act="progex">${Object.keys(MUSC).filter(g => groups[g]).map(g => `<optgroup label="${MUSC[g]}">${groups[g].map(k => `<option value="${k}" ${k === UI.progEx ? 'selected' : ''}>${esc(exName(k))}</option>`).join('')}</optgroup>`).join('')}</select></label>${chartBlock(hist, UI.progMetric)}
    <div class="tablewrap"><table class="hist"><thead><tr><th>Data</th><th>Séries</th><th>Máx.</th></tr></thead><tbody>${hist.slice().reverse().map(h => `<tr><td>${fmtD(h.date)}</td><td>${h.sets.map(x => `${fmtN(x.kg)}×${x.reps}`).join(' · ')}</td><td>${fmtN(h.kg)}</td></tr>`).join('')}</tbody></table></div></section>`;
}
const BWF = {kg: 'Peso (kg)', cintura: 'Cintura (cm)', pescoco: 'Pescoço (cm)', quadril: 'Quadril (cm)', braco: 'Braço (cm)', peito: 'Peito (cm)', coxa: 'Coxa (cm)'};
const BWN = k => BWF[k].split(' ')[0]; const BWU = k => k === 'kg' ? 'kg' : 'cm';
/* série de uma medida, em ordem de data */
const bwSeries = k => (ST.bw || []).filter(x => x[k] != null).sort((a, b) => a.date.localeCompare(b.date)).map(x => ({date: x.date, v: x[k]}));
const r1 = v => Math.round(v * 10) / 10;
function bwDelta(pts){ if (pts.length < 2) return null; const a = pts[0], b = pts[pts.length - 1]; return {d: r1(b.v - a.v), from: a.date}; }
const deltaTxt = (dl, unit) => dl ? `<span class="bm-d ${dl.d > 0 ? 'up' : dl.d < 0 ? 'down' : ''}">${dl.d > 0 ? I.up : dl.d < 0 ? I.down : ''}${dl.d ? (dl.d > 0 ? '+' : '−') + fmtN(Math.abs(dl.d)) + ' ' + unit : 'sem mudança'}</span><span class="bm-since">desde ${fmtD(dl.from)}</span>` : '<span class="bm-since">primeira medição</span>';
function sparkline(pts){
  if (pts.length < 2) return `<svg class="bm-sp" viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true"><circle cx="50" cy="14" r="2.6"/></svg>`;
  const vs = pts.map(p => p.v); let lo = Math.min(...vs), hi = Math.max(...vs); if (hi === lo){ hi += 1; lo -= 1; }
  const t0 = +new Date(pts[0].date), t1 = +new Date(pts[pts.length - 1].date) || t0 + 1; const span = Math.max(1, t1 - t0);
  const xy = pts.map(p => [((+new Date(p.date) - t0) / span) * 96 + 2, 25 - ((p.v - lo) / (hi - lo)) * 22]);
  const d = xy.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('');
  const L = xy[xy.length - 1];
  return `<svg class="bm-sp" viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true"><path d="${d}"/></svg><i class="bm-dot" style="left:${L[0]}%;top:${(L[1] / 28 * 100).toFixed(1)}%"></i>`;
}
/* indicadores calculados a partir das medidas */
function bwDerived(){
  const pf = ST.profile || {}; const h = parseNum(pf.height); const out = [];
  const w = bwSeries('cintura'); const sex = typeof sexOf === 'function' ? sexOf(pf) : null;
  if (h && w.length){ const v = w[w.length - 1].v / h; out.push({k: 'rcest', t: 'Relação cintura/altura', v: fmtN(Math.round(v * 100) / 100), sub: v < .5 ? 'Abaixo de 0,5: faixa recomendada' : 'Acima de 0,5: vale reduzir a cintura', ok: v < .5}); }
  const nb = typeof navyBF === 'function' && sex && h ? navyBF(sex, h) : null;
  if (nb) out.push({k: 'bf', t: 'Gordura estimada', v: fmtN(nb.v) + '%', sub: 'Fórmula da Marinha dos EUA, com cintura, pescoço' + (sex === 'F' ? ', quadril' : '') + ' e altura'});
  return out;
}
function progBody(){
  const planRow = `<section>${planSummaryRow('body')}</section>`;
  const list = (ST.bw || []).slice().sort((a, b) => a.date.localeCompare(b.date)); const view = UI.bwView || 'resumo';
  const last = list[list.length - 1]; const keys = Object.keys(BWF); const has = keys.filter(k => bwSeries(k).length);
  const head = `<section class="bm-head"><div class="grow"><div class="eyebrow">Medidas do corpo</div><div class="small muted" style="margin-top:4px">${last ? `Última medição ${relDay(last.date).toLowerCase()} · ${list.length} ${list.length === 1 ? 'registro' : 'registros'}` : 'Nenhuma medição ainda'}</div></div><button class="btn primary sm" data-act="bw-open">${I.plus}Registrar</button></section>`;
  if (!list.length) return `${planRow}${head}<section class="empty"><b>Comece pelo peso e pela cintura</b>Para acompanhar definição, a cintura costuma dizer mais que a balança. As demais medidas são opcionais.<button class="btn primary" style="margin-top:14px" data-act="bw-open">Registrar primeira medição</button></section>`;
  const seg = `<div class="seg bm-seg">${[['resumo', 'Resumo'], ['graficos', 'Gráficos'], ['historico', 'Histórico']].map(([v, l]) => `<button data-act="bw-view" data-v="${v}" aria-pressed="${view === v}">${l}</button>`).join('')}</div>`;
  let body = '';
  if (view === 'resumo'){
    const tiles = keys.map(k => { const pts = bwSeries(k); if (!pts.length) return `<button class="bm-tile empty-t" data-act="bw-open" data-f="${k}"><span class="bm-l">${BWN(k)}</span><span class="bm-add">${I.plus}Adicionar</span></button>`;
      const lastp = pts[pts.length - 1]; return `<button class="bm-tile${k === 'kg' ? ' wide' : ''}" data-act="bw-metric" data-m="${k}"><span class="bm-l">${BWN(k)}<em>${relDay(lastp.date).toLowerCase()}</em></span><span class="bm-v"><b class="num">${fmtN(lastp.v)}</b> ${BWU(k)}</span><span class="bm-dl">${deltaTxt(bwDelta(pts), BWU(k))}</span><span class="bm-spw">${sparkline(pts)}</span></button>`; }).join('');
    const der = bwDerived();
    body = `<section class="bm-grid">${tiles}</section>${der.length ? `<section class="card bm-der">${der.map(d => `<div><span class="bm-l">${d.t}</span><b class="num">${d.v}</b><span class="sub ${d.ok === true ? 'good' : d.ok === false ? 'warn' : ''}">${d.sub}</span></div>`).join('')}</section>` : ''}
      <p class="tiny muted" style="margin:10px 4px 0">Toque numa medida para ver o gráfico e o histórico dela.</p>`;
  } else if (view === 'graficos'){
    body = has.map(k => { const pts = bwSeries(k); const lp = pts[pts.length - 1]; return `<section class="card stack bm-chart"><button class="bm-ch" data-act="bw-metric" data-m="${k}"><span class="grow"><span class="bm-l">${BWN(k)}</span><span class="bm-v"><b class="num">${fmtN(lp.v)}</b> ${BWU(k)}</span><span class="bm-dl">${deltaTxt(bwDelta(pts), BWU(k))}</span></span>${I.chev}</button>${pts.length > 1 ? lineChart(pts, BWU(k)) : '<p class="tiny muted" style="margin:0">O gráfico aparece a partir da segunda medição.</p>'}</section>`; }).join('');
  } else {
    body = `<section class="list bm-hist">${list.slice().reverse().map(x => { const ks = keys.filter(k => x[k] != null); return `<div class="li bm-row"><div class="grow"><b>${fmtD(x.date)}</b><span class="bm-vals">${ks.map(k => `<span><em>${BWN(k)}</em>${fmtN(x[k])}</span>`).join('')}</span></div><button class="icon sm" data-act="bw-edit" data-d="${x.date}" aria-label="Editar medição de ${fmtD(x.date)}">${I.edit || I.note}</button><button class="icon sm" data-act="bw-del-day" data-d="${x.date}" aria-label="Apagar medição de ${fmtD(x.date)}">${I.trash}</button></div>`; }).join('')}</section>`;
  }
  return `${planRow}${head}${seg}${body}`;
}
/* página de uma medida: gráfico grande, números e cada registro */
function vBodyMetric(p){
  const k = p.m; const pts = bwSeries(k); const u = BWU(k);
  if (!pts.length) return `<div class="empty"><b>Sem registros de ${BWN(k).toLowerCase()}</b><button class="btn primary" style="margin-top:12px" data-act="bw-open" data-f="${k}">Registrar</button></div>`;
  const lp = pts[pts.length - 1]; const vs = pts.map(x => x.v);
  const ago = d => { const lim = isoDate(addDays(new Date(), -d)); const base = pts.filter(x => x.date <= lim).pop(); return base && base !== lp ? r1(lp.v - base.v) : null; };
  const stat = (t, v) => `<div><span>${t}</span><b class="num">${v}</b></div>`;
  const ch = v => v == null ? '–' : (v > 0 ? '+' : v < 0 ? '−' : '') + fmtN(Math.abs(v)) + ' ' + u;
  return `<section style="margin-top:8px"><div class="display h1 num">${fmtN(lp.v)}<span style="font-size:20px"> ${u}</span></div><div class="bm-dl" style="margin-top:4px">${deltaTxt(bwDelta(pts), u)}</div></section>
  <section class="card stack">${pts.length > 1 ? lineChart(pts, u) : '<p class="tiny muted" style="margin:0">O gráfico aparece a partir da segunda medição.</p>'}
    <div class="bm-stats">${stat('30 dias', ch(ago(30)))}${stat('90 dias', ch(ago(90)))}${stat('Mínimo', fmtN(Math.min(...vs)) + ' ' + u)}${stat('Máximo', fmtN(Math.max(...vs)) + ' ' + u)}</div></section>
  <section><div class="sec-head"><span class="eyebrow">Registros</span><button class="link" data-act="bw-open" data-f="${k}">Registrar</button></div>
    <div class="list">${pts.slice().reverse().map((x, i, arr) => { const prev = arr[i + 1]; const d = prev ? r1(x.v - prev.v) : null; return `<div class="li bm-row"><div class="grow"><b class="num">${fmtN(x.v)} ${u}</b><span class="sub">${fmtD(x.date)}${d != null ? ` · ${d > 0 ? '+' : d < 0 ? '−' : ''}${fmtN(Math.abs(d))} desde a anterior` : ''}</span></div><button class="icon sm" data-act="bw-del-val" data-d="${x.date}" data-m="${k}" aria-label="Apagar ${BWN(k).toLowerCase()} de ${fmtD(x.date)}">${I.trash}</button></div>`; }).join('')}</div></section>`;
}
PAGES.bmetric = {title: p => BWN(p.m), view: p => vBodyMetric(p)};
/* registrar ou editar medidas de um dia (mesmo dia: soma às medidas já salvas, não apaga as outras) */
function openBwSheet(date, focus){
  const d = date || today(); const cur = (ST.bw || []).find(x => x.date === d) || {};
  UI.sheet = {kind: 'bw'};
  openSheet(`${sheetHead('Medidas do corpo', date ? 'Editar medição' : 'Nova medição')}
    <p class="small muted" style="margin:10px 0 0">Preencha só o que mediu. Medidas do mesmo dia são somadas ao registro existente.</p>
    <div class="formgrid" style="margin-top:14px"><label class="flabel" style="grid-column:1/-1"><span class="tiny muted">Data</span><input id="bw-date" class="field" type="date" value="${d}" max="${today()}" ${date ? 'readonly' : ''}></label>
    ${Object.keys(BWF).map(k => { const pts = bwSeries(k); const lp = pts[pts.length - 1]; return `<label class="flabel"><span class="tiny muted">${BWF[k]}</span><input id="bw-${k}" class="field num" inputmode="decimal" value="${cur[k] != null ? fmtN(cur[k]) : ''}" placeholder="${lp ? 'último ' + fmtN(lp.v) : '—'}"></label>`; }).join('')}</div>
    <button class="btn primary block" style="margin-top:16px" data-act="bw-add" data-edit="${date ? 1 : ''}">Salvar medição</button>`);
  if (focus) setTimeout(() => { const i = $('#bw-' + focus); if (i) i.focus(); }, 80);
}
// ================= folhas =================
function openSheet(html){ if (!toastUndo) $('#toast').hidden = true; const w = $('#sheet'); w.innerHTML = `<div class="sheet-wrap" data-act="sheet-bg"><div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div></div>`; w.hidden = false; document.body.style.overflow = 'hidden'; }
function closeSheet(){ const w = $('#sheet'); if (!w) return; w.hidden = true; w.innerHTML = ''; document.body.style.overflow = ''; UI.sheet = null; }
const sheetHead = (sub, title) => `<div class="row between" style="align-items:flex-start;gap:12px"><div class="grow"><div class="eyebrow">${esc(sub)}</div><h2 class="display h2" style="margin-top:6px">${esc(title)}</h2></div><button class="icon" data-act="close" aria-label="Fechar">${I.x}</button></div>`;
function confirmSheet(o){ UI.sheet = {kind: 'confirm', onOk: o.onOk, onCancel: o.onCancel}; openSheet(`${sheetHead(o.sub || 'Confirmar', o.title)}${o.text ? `<p class="ink2" style="margin:12px 0 0">${esc(o.text)}</p>` : ''}<div class="stack" style="margin-top:18px"><button class="btn ${o.danger ? 'danger' : 'primary'} block" data-act="confirm-ok">${esc(o.ok)}</button><button class="btn ghost block" data-act="confirm-cancel">${esc(o.cancel || 'Cancelar')}</button></div>`); }
function menuSheet(sub, title, items){ UI.sheet = {kind: 'menu', items}; openSheet(`${sheetHead(sub, title)}<div class="menu">${items.map((it, i) => it ? `<button class="${it.danger ? 'danger' : ''}" data-act="menu-pick" data-i="${i}" ${it.disabled ? 'disabled' : ''}>${it.icon || ''}${esc(it.label)}</button>` : '').join('')}</div>`); }
function openPicker(mode){ UI.sheet = {...mode, q: '', m: '', sel: []}; drawPicker(); }
function pickerBody(){
  const sh = UI.sheet; const q = norm(sh.q.trim());
  const opt = k => { const e = getEx(k); const on = sh.sel.includes(k); return `<button class="opt" data-act="pick" data-ex="${k}" ${sh.multi ? `aria-pressed="${on}"` : ''}>${thumb(k)}<span class="grow"><b>${esc(e.n)}</b><span class="s">${MUSC[e.m] || ''} · ${EQUIP[e.e] || ''}</span></span>${sh.multi ? `<span class="tick">${I.check}</span>` : ''}</button>`; };
  const all = [...Object.keys(CAT), ...Object.keys(ST.custom)].filter(k => k !== sh.cur);
  if (q || sh.m){ const hits = all.filter(k => { const e = getEx(k); return (!sh.m || e.m === sh.m) && (!q || norm(e.n).includes(q)); }); return hits.length ? `<div class="stack" style="gap:8px">${hits.map(opt).join('')}</div>` : '<p class="muted">Nada encontrado.</p>'; }
  if (sh.cur){ const c = getEx(sh.cur); const same = all.filter(k => getEx(k).p === c.p && c.p !== 'custom'); const musc = all.filter(k => getEx(k).m === c.m && !same.includes(k));
    return `<div class="eyebrow" style="margin:6px 0 10px">Mesmo movimento</div><div class="stack" style="gap:8px">${same.map(opt).join('') || '<p class="small muted">Sem outra opção do mesmo movimento.</p>'}</div><div class="eyebrow" style="margin:18px 0 10px">Mesmo músculo, outro ângulo</div><div class="stack" style="gap:8px">${musc.map(opt).join('') || '<p class="small muted">Sem outras opções.</p>'}</div>`; }
  return Object.keys(MUSC).map(g => { const l = all.filter(k => getEx(k).m === g); return l.length ? `<div class="eyebrow" style="margin:16px 0 10px">${MUSC[g]}</div><div class="stack" style="gap:8px">${l.map(opt).join('')}</div>` : ''; }).join('');
}
function drawPicker(){
  const sh = UI.sheet; const titles = {add: ['Adicionar ao treino', 'Escolha um ou mais'], swap: ['Trocar só hoje', 'O plano continua igual'], replace: ['Substituir no plano', 'Vale para os próximos treinos'], extra: ['Adicionar ao treino de hoje', 'Escolha um ou mais']};
  const [t, sub] = titles[sh.kind];
  openSheet(`${sheetHead(sub, t)}${sh.cur ? `<div style="margin-top:10px" class="small muted">Atual: <b style="color:var(--ink)">${esc(exName(sh.cur))}</b></div>` : ''}
    <div class="search" style="margin:14px 0 10px">${svg('M11 17.5a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13zM20 20l-4.2-4.2')}<input id="pick-q" class="field" type="search" placeholder="Buscar exercício" value="${esc(sh.q)}" data-act="pickq" autocomplete="off"></div>
    <div class="chips" style="margin-bottom:12px"><button class="chip" data-act="pickm" data-m="" aria-pressed="${!sh.m}">Todos</button>${Object.keys(MUSC).map(g => `<button class="chip" data-act="pickm" data-m="${g}" aria-pressed="${sh.m === g}">${MUSC[g]}</button>`).join('')}</div>
    <div id="pick-body">${pickerBody()}</div>
    ${sh.multi ? `<div class="sheet-foot"><button class="btn primary block" id="pick-go" data-act="pick-confirm" ${sh.sel.length ? '' : 'disabled'}>${sh.sel.length ? `Adicionar ${sh.sel.length} ${sh.sel.length === 1 ? 'exercício' : 'exercícios'}` : 'Selecione exercícios'}</button></div>` : ''}`);
}
function openItemEdit(j){ const p = curPage(); const w = findWorkout(p.rid, p.wid); UI.sheet = {kind: 'item', j, draft: clone(w.items[j])}; drawItemEdit(); }
function drawItemEdit(){
  const d = UI.sheet.draft; const rests = [0, 30, 45, 60, 75, 90, 120, 150, 180, 240];
  openSheet(`${sheetHead('Editar exercício', exName(d.ex))}<div class="stack" style="margin-top:18px">
    <div class="row between"><span class="eyebrow">Séries</span><div class="stepper"><button data-act="ie-sets" data-d="-1" aria-label="Menos">−</button><output class="num">${d.sets}</output><button data-act="ie-sets" data-d="1" aria-label="Mais">+</button></div></div>
    <div class="formgrid"><label class="flabel"><span class="tiny muted">Reps mínimas</span><input id="ie-rmin" class="field num" inputmode="numeric" value="${d.rmin}"></label><label class="flabel"><span class="tiny muted">Reps máximas</span><input id="ie-rmax" class="field num" inputmode="numeric" value="${d.rmax}"></label></div>
    <div><div class="tiny muted" style="margin-bottom:8px">Descanso</div><div class="row wrap" style="gap:6px">${rests.map(r => `<button class="chip" data-act="ie-rest" data-r="${r}" aria-pressed="${r === d.rest}">${r ? fmtRest(r) : 'nenhum'}</button>`).join('')}</div></div>
    <label class="flabel"><span class="tiny muted">Observação fixa</span><input id="ie-nota" class="field" maxlength="160" value="${esc(d.nota || '')}" placeholder="Ex.: banco no 3º furo"></label>
    <button class="btn primary block" data-act="ie-save">Salvar</button>
    <div class="menu"><button data-act="ie-replace">${I.swap}Substituir exercício</button><button data-act="open-ex-sheet" data-ex="${d.ex}">${I.info}Ver como fazer</button><button class="danger" data-act="ie-remove">${I.trash}Remover do treino</button></div></div>`);
}
function readItemEdit(){ const d = UI.sheet.draft; const a = parseInt($('#ie-rmin')?.value, 10), b = parseInt($('#ie-rmax')?.value, 10); if (a > 0) d.rmin = a; if (b > 0) d.rmax = b; if (d.rmax < d.rmin) [d.rmin, d.rmax] = [d.rmax, d.rmin]; const n = $('#ie-nota'); if (n) d.nota = n.value.trim(); }
function openNewEx(){ UI.sheet = {kind: 'newex', pri: [], sec: []}; drawNewEx(); }
function drawNewEx(){
  const sh = UI.sheet; const v = id => esc(sh[id] ?? '');
  openSheet(`${sheetHead('Biblioteca', 'Criar exercício')}<div class="stack" style="margin-top:16px">
    <label class="flabel"><span class="tiny muted">Nome</span><input id="nx-n" class="field" maxlength="60" value="${v('nx-n')}" placeholder="Ex.: Supino na máquina articulada"></label>
    <div class="formgrid"><label class="flabel"><span class="tiny muted">Grupo</span><select id="nx-m" class="field">${Object.entries(MUSC).map(([k, l]) => `<option value="${k}" ${sh['nx-m'] === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label><label class="flabel"><span class="tiny muted">Equipamento</span><select id="nx-e" class="field">${Object.entries(EQUIP).map(([k, l]) => `<option value="${k}" ${sh['nx-e'] === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
    <div><div class="tiny muted" style="margin-bottom:8px">Músculos principais</div><div class="row wrap" style="gap:6px">${Object.entries(REG).map(([k, l]) => `<button class="chip" data-act="nx-pri" data-r="${k}" aria-pressed="${sh.pri.includes(k)}">${l}</button>`).join('')}</div></div>
    <div><div class="tiny muted" style="margin-bottom:8px">Músculos secundários</div><div class="row wrap" style="gap:6px">${Object.entries(REG).map(([k, l]) => `<button class="chip" data-act="nx-sec" data-r="${k}" aria-pressed="${sh.sec.includes(k)}">${l}</button>`).join('')}</div></div>
    <div class="card" style="background:var(--s2)">${muscleBlock(sh.pri, sh.sec, false)}</div>
    <label class="flabel"><span class="tiny muted">Dicas de execução (uma por linha)</span><textarea id="nx-d" class="field">${v('nx-d')}</textarea></label>
    <button class="btn primary block" data-act="nx-save">Criar exercício</button></div>`);
}
function keepNewEx(){ ['nx-n', 'nx-m', 'nx-e', 'nx-d'].forEach(id => { const el = $('#' + id); if (el) UI.sheet[id] = el.value; }); }
function openAddTo(ex){
  UI.sheet = {kind: 'addto', ex};
  openSheet(`${sheetHead('Adicionar a um treino', exName(ex))}<div class="stack" style="margin-top:16px">${ST.routines.map(r => `<div><div class="eyebrow" style="margin-bottom:8px">${esc(r.nome)}</div><div class="list" style="background:var(--s2)">${r.workouts.map((w, i) => `<button class="li noimg" data-act="addto-pick" data-rid="${r.id}" data-wid="${w.id}"><span class="plate" style="--pc:${col(w.cor)}">${i + 1}</span><div class="grow"><b>${esc(w.nome)}</b><span class="sub">${w.items.length} exercícios</span></div>${I.plus.replace('<svg', '<svg class="chev" style="stroke:var(--ember)"')}</button>`).join('') || '<div class="li muted small">Sem treinos</div>'}</div></div>`).join('')}</div>`);
}
/* Escolha dos dias: o usuário marca os dias em que treina e os treinos são distribuídos na ordem da rotina. */
function openDaysSheet(rid, fresh){
  const r = routineById(rid); if (!r || !r.workouts.length) return;
  if (!UI.sheet || UI.sheet.kind !== 'days' || UI.sheet.rid !== rid) UI.sheet = {kind: 'days', rid, fresh: !!fresh, sel: hasSchedule(r) ? WEEK.filter(d => r.workouts.some(w => w.id === r.dias[d])) : defaultDays(r.workouts.length)};
  const sel = UI.sheet.sel; const ord = WEEK.filter(d => sel.includes(d));
  openSheet(`${sheetHead(r.nome, fresh ? 'Em quais dias você treina?' : 'Dias da semana')}
    <p class="ink2 small" style="margin:10px 0 0">Marque os dias. Os treinos entram na ordem da rotina e o Início mostra o treino certo de cada dia.${ord.length > r.workouts.length ? ' Com mais dias que treinos, a sequência recomeça.' : ''}</p>
    <div class="daypick" role="group" aria-label="Dias de treino">${WEEK.map(d => `<button data-act="day-tog" data-d="${d}" aria-pressed="${sel.includes(d)}" aria-label="${DIAS[d]}">${DIA3[d].slice(0, 1).toUpperCase()}<small>${DIA3[d]}</small></button>`).join('')}</div>
    <div class="list" style="background:var(--s2);margin-top:14px">${ord.length ? ord.map((d, i) => { const w = r.workouts[i % r.workouts.length]; return `<div class="li noimg" style="min-height:52px"><span class="plate" style="--pc:${col(w.cor)}">${DIA3[d]}</span><div class="grow"><b>${esc(w.nome)}</b><span class="sub">${w.items.length} exercícios · ~${wMins(w)} min</span></div></div>`; }).join('') : '<div class="li noimg"><div class="grow muted small">Nenhum dia marcado: o app segue a sequência de treinos.</div></div>'}</div>
    <div class="sheet-foot"><button class="btn primary block" data-act="days-save">${ord.length ? `Salvar ${ord.length} ${ord.length === 1 ? 'dia' : 'dias'}` : 'Seguir a sequência'}</button>${hasSchedule(r) && ord.length ? '<button class="link muted" style="width:100%;margin-top:4px" data-act="days-clear">Sem dias fixos (seguir a sequência)</button>' : fresh ? '<button class="link muted" style="width:100%;margin-top:4px" data-act="close">Depois</button>' : ''}</div>`);
}
function openStartSheet(date){
  const retro = !!date && date !== 'live'; const act = retro ? 'retro' : 'start'; const dd = retro ? `data-date="${date}"` : '';
  const r = activeRoutine(); const w = suggested(r); const todayW = !retro && hasSchedule(r) && scheduledOn(r, new Date()) === w;
  UI.sheet = {kind: 'start'};
  openSheet(`${sheetHead(retro ? `Registrar treino · ${fmtDLong(date)}` : 'Começar treino', retro ? 'Qual treino você fez?' : 'O que vamos treinar?')}<div class="stack" style="margin-top:16px">
    ${w ? `<button class="hero" style="--pc:${col(w.cor)};text-align:left;width:100%;padding:18px" data-act="${act}" ${dd} data-rid="${r.id}" data-wid="${w.id}">${glow()}<div class="hero-top"><span class="hero-lbl">${retro ? 'Sugestão' : todayW ? `Treino de hoje · ${DIA3[new Date().getDay()]}` : hasSchedule(r) ? 'Próximo da agenda' : 'Próximo da sequência'}</span></div>${heroTitle(w.nome, wkType(w.items, w.nome), {tag: 'div', words: badgeWords(wkType(w.items, w.nome), w.items)})}<div class="meta mono" style="margin-top:12px;font-size:12px"><span><b>${pad2(w.items.length)}</b> exercícios</span><span><b>${wMins(w)}′</b> estimados</span></div></button>` : ''}
    ${ST.routines.map(rr => { const ws = rr.workouts.filter(x => x !== w); return ws.length ? `<div class="eyebrow" style="margin-top:4px">${rr === r ? 'Outro treino de ' : ''}${esc(rr.nome)}</div><div class="list" style="background:var(--s2)">${ws.map(x => `<button class="li noimg" data-act="${act}" ${dd} data-rid="${rr.id}" data-wid="${x.id}"><span class="plate" style="--pc:${col(x.cor)}">${rr.workouts.indexOf(x) + 1}</span><div class="grow"><b>${esc(x.nome)}</b><span class="sub">${x.items.length} exercícios · ~${wMins(x)} min</span></div>${I.chev}</button>`).join('')}</div>` : ''; }).join('')}
    <button class="btn ghost block" data-act="${act}" ${dd} data-rid="free">${I.plus}Treino livre (montar ${retro ? 'os exercícios' : 'na hora'})</button></div>`);
}
// ================= Perfil e conta =================
function lifetime(){
  const D = done(); let vol = 0, sets = 0, mins = 0; const count = {};
  D.forEach(s => { const st = stats(s); vol += st.vol; sets += st.sets; mins += s.dur != null ? s.dur : (s.startedAt && s.finishedAt ? (new Date(s.finishedAt) - new Date(s.startedAt)) / 60000 : 0); s.items.forEach(e => { if (workSets(e).length) count[e.ex] = (count[e.ex] || 0) + 1; }); });
  const fav = Object.entries(count).sort((a, b) => b[1] - a[1])[0];
  const prs = D.reduce((a, s) => a + sessionPRs(s).length, 0);
  return {n: D.length, vol, sets, hours: mins / 60, fav: fav && fav[0], prs, first: D.length ? D[D.length - 1].date : null};
}
function installHidden(){ try { return localStorage.getItem('forja.installHide') === '1'; } catch (e) { return false; } }
function installCard(home){
  if (!Platform.canInstall()) return '';
  return `<section class="card row" style="gap:14px;align-items:center"><span class="avatar" style="background:var(--ember);color:var(--ember-ink)">${I.down}</span><div class="grow"><b>Instalar o Forja</b><div class="small muted">Abre em tela cheia, fica na lista de apps e funciona sem internet.</div></div><div class="stack" style="gap:6px"><button class="btn primary sm" data-act="install">Instalar</button>${home ? '<button class="link muted" style="min-height:0;padding:0" data-act="install-hide">Agora não</button>' : ''}</div></section>`;
}
function vProfile(){
  const P = ST.prefs, pf = ST.profile; const L = lifetime(); const lastBw = (ST.bw || []).slice().sort((a, b) => a.date.localeCompare(b.date)).filter(x => x.kg != null).pop();
  const acct = Store.mode === 'verify' ? `Conta <b>${esc(Auth.user?.email || '')}</b> criada. Falta confirmar o e-mail: abra o link que enviamos (confira também o spam). Até lá, tudo fica salvo neste aparelho e sobe para a conta assim que você confirmar.` : Store.mode === 'api' ? `Conectado como <b>${esc(Auth.user?.email || Auth.user?.name || 'usuário')}</b>. Seus treinos ficam salvos na sua conta e sincronizam entre aparelhos.` : Store.mode === 'cloud' ? 'Seus dados estão salvos na sua conta do Claude e sincronizam entre aparelhos.' : Store.authExpired ? 'Sua sessão expirou. Entre de novo para voltar a sincronizar.' : 'Seus dados estão salvos só neste aparelho. Crie uma conta para guardar na nuvem e usar em outros aparelhos.';
  const field = (id, label, val, attrs = '') => `<label class="flabel"><span class="tiny muted">${label}</span><input id="pf-${id}" class="field" value="${esc(val ?? '')}" data-act="pf" data-k="${id}" ${attrs}></label>`;
  const seg = (k, opts) => `<div class="seg wrapseg">${opts.map(([v, l]) => `<button data-act="pf-set" data-k="${k}" data-v="${v}" aria-pressed="${String(pf[k] || '') === String(v)}">${l}</button>`).join('')}</div>`;
  return `<section class="profile-hero"><div class="avatar xl">${initials() || I.user}</div><div class="grow"><h1 class="display h2">${esc(pf.name || 'Seu perfil')}</h1><div class="small muted">${[pf.goal, pf.level].filter(Boolean).map(esc).join(' · ') || 'Complete seus dados abaixo'}</div></div></section>
  <section><button class="set-btn" data-act="open-settings"><span class="s-ic">${I.gear}</span><span class="grow"><b>Configurações</b><span class="sub">Treino, aparência, animações e dados</span></span>${I.chev}</button></section>
  <section>${planSummaryRow('profile')}</section>
  <section class="card"><div class="row" style="align-items:flex-start"><span class="sync ${syncClass()}" style="margin-top:6px"></span><div class="grow"><div class="eyebrow" style="margin-bottom:6px">Conta</div><div class="small ink2">${acct}</div></div></div>
        <div class="stack" style="margin-top:14px;gap:10px">${Store.mode === 'verify' ? '<button class="btn primary block" data-act="check-verified">Já confirmei meu e-mail</button><button class="btn ghost block" data-act="resend-verify">Reenviar e-mail de confirmação</button><button class="link muted" data-act="logout">Sair desta conta</button>' : Store.mode === 'api' ? '<button class="btn ghost block" data-act="logout">Sair da conta</button>' : Store.mode === 'cloud' ? '' : `<button class="btn primary block" data-act="login">Entrar ou criar conta</button>`}</div></section>
  ${installCard()}
  <section class="stats"><div class="stat"><b class="num">${L.n}</b><span>treinos</span></div><div class="stat"><b class="num">${fmtN(Math.round(L.hours * 10) / 10)}</b><span>horas</span></div><div class="stat ember"><b class="num">${L.vol >= 10000 ? fmtN(Math.round(L.vol / 100) / 10) : fmtInt(L.vol)}</b><span>${L.vol >= 10000 ? 'toneladas' : 'kg'} levantados</span></div></section>
  ${L.n ? `<section class="card small ink2">${L.prs} recordes batidos · ${L.sets} séries no total${L.fav ? ` · mais feito: <b style="color:var(--ink)">${esc(exName(L.fav))}</b>` : ''}${L.first ? ` · desde ${fmtDLong(L.first)}` : ''}</section>` : ''}
  <section class="card stack"><div class="eyebrow">Dados pessoais</div>
    ${field('name', 'Nome', pf.name, 'maxlength="40" autocomplete="name"')}
    <div class="formgrid">${field('birth', 'Nascimento', pf.birth, 'type="date"')}${field('height', 'Altura (cm)', pf.height, 'inputmode="numeric"')}</div>
    <div class="small muted">Peso atual: ${lastBw ? `<b style="color:var(--ink)">${fmtN(lastBw.kg)} kg</b> em ${fmtD(lastBw.date)}` : 'sem registro'} · <button class="link" style="min-height:0;padding:0" data-act="go-body">Registrar medidas</button></div>
    <div><div class="tiny muted" style="margin-bottom:8px">Objetivo</div>${seg('goal', [['Hipertrofia', 'Hipertrofia'], ['Definição', 'Definição'], ['Força', 'Força'], ['Saúde', 'Saúde']])}</div>
    <div><div class="tiny muted" style="margin-bottom:8px">Experiência</div>${seg('level', [['Iniciante', 'Iniciante'], ['Intermediário', 'Intermediário'], ['Avançado', 'Avançado']])}</div></section>
  <p class="tiny muted" style="text-align:center;margin-top:18px">Forja ${APP_VERSION}</p>`;
}
/* ================= configurações ================= */
const SI = {
  sun: svg('M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4'),
  bell: svg('M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9zM10 20a2 2 0 0 0 4 0'),
  phone: svg('M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM11 18h2'),
  plate: svg('M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'),
  bar: svg('M2 12h20M5 8v8M8 6v12M16 6v12M19 8v8'),
  img: svg('M4 4h16v16H4zM4 16l5-5 4 4 3-3 4 4M15 9a1 1 0 1 0 0-.01'),
  spark: svg('M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z'),
  dl: svg('M12 3v12M7 10l5 5 5-5M4 21h16'),
  ul: svg('M12 21V9M7 14l5-5 5 5M4 3h16'),
  out: svg('M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l-5-5 5-5M5 12h11'),
  doc: svg('M6 2h9l5 5v15H6zM14 2v6h6M9 13h8M9 17h6'),
};
const PREF_OPTS = {
  goal: {t: 'Meta semanal', o: [0, 2, 3, 4, 5, 6], f: v => v ? `${v} treinos` : 'Automática', s: 'Treinos por semana. Automática segue a agenda'},
  rest: {t: 'Descanso padrão', o: [60, 90, 120, 180], f: v => fmtRest(v), s: 'Para exercícios novos e treino livre'},
  inc: {t: 'Botões + e − da carga', o: [1, 2, 2.5, 5], f: v => fmtN(v) + ' kg', s: 'Quanto cada toque soma ou tira no teclado'},
  bar: {t: 'Peso da barra', o: [10, 15, 20], f: v => v + ' kg', s: 'Usado na calculadora de anilhas'},
  theme: {t: 'Tema', o: ['dark', 'light', 'system'], f: v => ({dark: 'Escuro', light: 'Claro', system: 'Igual ao sistema'})[v]},
  pics: {t: 'Imagens dos exercícios', o: ['fig', 'foto'], f: v => ({fig: 'Ilustração', foto: 'Foto real'})[v] || 'Ilustração'},
};
function vSettings(){
  const P = ST.prefs;
  const row = (k, ic) => { const d = PREF_OPTS[k]; return `<button class="s-row" data-act="set-pick" data-k="${k}"><span class="s-ic">${ic}</span><span class="grow"><b>${d.t}</b>${d.s ? `<span class="sub">${d.s}</span>` : ''}</span><em>${esc(d.f(P[k]))}</em>${I.chev}</button>`; };
  const tg = (k, ic, t, sub) => `<button class="s-row toggle" data-act="pref-tog" data-k="${k}" role="switch" aria-checked="${!!P[k]}"><span class="s-ic">${ic}</span><span class="grow"><b>${t}</b><span class="sub">${sub}</span></span><i></i></button>`;
  const act = (a, ic, t, sub = '', cls = '', extra = '') => `<button class="s-row ${cls}" data-act="${a}" ${extra}><span class="s-ic">${ic}</span><span class="grow"><b>${t}</b>${sub ? `<span class="sub">${sub}</span>` : ''}</span>${cls ? '' : I.chev}</button>`;
  const picsOk = !window.FORJA_FIG && !window.FORJA_NOPHOTO;
  return `<section class="s-group"><div class="eyebrow">Treino</div><div class="list">${row('goal', I.target)}${row('rest', I.timer)}${row('inc', SI.plate)}${row('bar', SI.bar)}${tg('sound', SI.bell, 'Som no fim do descanso', 'Toca três bipes curtos')}${tg('awake', SI.phone, 'Manter a tela ligada', 'Evita que o celular apague entre as séries')}</div></section>
  <section class="s-group"><div class="eyebrow">Aparência</div><div class="list">${row('theme', SI.sun)}
    <button class="s-row" data-act="motion-open"><span class="s-ic">${SI.spark}</span><span class="grow"><b>Animação do treino</b><span class="sub">${(MOTION_MODES.find(m => m.v === motionMode()) || MOTION_MODES[0]).t}</span></span>${motionPreview(motionMode())}${I.chev}</button>
    ${picsOk ? row('pics', SI.img) : ''}</div></section>
  <section class="s-group"><div class="eyebrow">Objetivo e corpo</div><div class="list">${act('plan-open', I.flame, 'Assistente de objetivo', ST.prefs.plan ? 'Calorias, proteína e ritmo do seu plano' : 'Calcule calorias e proteína para o seu objetivo')}${act('go-body', I.note, 'Peso e medidas', 'Registros do corpo e gráficos')}</div></section>
  <section class="s-group"><div class="eyebrow">Seus dados</div><div class="list">
    ${Store.adapter?.downloads || !Platform.isArtifact ? act('export', SI.dl, 'Exportar backup', 'Arquivo JSON com treinos, rotinas e medidas') : ''}
    <label class="s-row" for="import-in"><span class="s-ic">${SI.ul}</span><span class="grow"><b>Importar backup</b><span class="sub">Restaura um arquivo exportado antes</span></span>${I.chev}</label><input id="import-in" type="file" accept="application/json,.json" hidden data-act="import">
    ${Store.mode === 'api' ? act('logout', SI.out, 'Sair da conta', Auth.user?.email ? esc(Auth.user.email) : '') : ''}
    ${act('ask-wipe', I.trash, `Apagar todos os dados${Store.mode === 'api' ? ' deste aparelho' : ''}`, '', 'danger')}
    ${Store.mode === 'api' ? act('ask-delete-account', I.trash, 'Excluir minha conta', 'Apaga a conta e tudo que está na nuvem', 'danger') : ''}</div></section>
  <section class="s-group"><div class="eyebrow">Sobre</div><div class="list">
    ${!Platform.isArtifact ? `<a class="s-row" href="privacidade.html" target="_blank" rel="noopener"><span class="s-ic">${SI.doc}</span><span class="grow"><b>Política de privacidade</b></span>${I.chev}</a>` : ''}
    <div class="s-row"><span class="s-ic">${I.info}</span><span class="grow"><b>Versão</b><span class="sub">Ilustração anatômica: react-native-body-highlighter (MIT) · fotos: Free Exercise DB</span></span><em>${APP_VERSION}</em></div></div></section>`;
}
PAGES.settings = {title: () => 'Configurações', view: () => vSettings()};
/* ================= tela de entrada ================= */
function vAuth(p){
  const st = UI.auth || (UI.auth = {mode: 'login', show: false}); const m = st.mode;
  const field = (id, label, type, ac, icon, extra = '') => `<label class="af"><span class="af-ic">${icon}</span><input id="${id}" type="${type}" placeholder=" " autocomplete="${ac}" ${extra}><span class="af-l">${label}</span></label>`;
  const title = m === 'register' ? 'Crie sua<br>conta.' : m === 'forgot' ? 'Nova<br>senha.' : 'Bem-vindo<br>de volta.';
  const sub = m === 'register' ? 'Seus treinos, cargas e recordes guardados na nuvem e disponíveis em qualquer aparelho.' : m === 'forgot' ? 'Digite o e-mail da conta. Enviamos um link para você criar uma senha nova.' : 'Entre para continuar de onde parou, em qualquer aparelho.';
  return `<div class="auth">
    <div class="auth-bg" aria-hidden="true"><i class="glow g1"></i><i class="glow g2"></i><i class="grain"></i></div>
    <div class="auth-top">${p.first ? '<span></span>' : `<button class="icon clear" data-act="back" aria-label="Voltar">${I.back}</button>`}<span class="brand">${I.brand}Forja</span><span></span></div>
    <div class="auth-hero"><div class="eyebrow">${m === 'register' ? 'Nova conta' : m === 'forgot' ? 'Recuperar acesso' : 'Entrar'}</div><h1 class="cond">${title}</h1><p>${sub}</p></div>
    ${m !== 'forgot' ? `<div class="seg auth-seg" role="tablist">${[['login', 'Entrar'], ['register', 'Criar conta']].map(([k, l]) => `<button type="button" role="tab" data-act="auth-mode" data-m="${k}" aria-pressed="${m === k}"${k === 'register' ? ' data-reg="1"' : ''}>${l}</button>`).join('')}</div>` : ''}
    <form class="auth-form" data-form="auth" novalidate>
      ${m === 'register' ? field('au-name', 'Nome', 'text', 'name', I.user, `value="${esc(st.name || '')}" maxlength="60"`) : ''}
      ${field('au-email', 'E-mail', 'email', 'email', I.mail, `value="${esc(st.email || '')}" inputmode="email" autocapitalize="off" spellcheck="false" required`)}
      ${m !== 'forgot' ? `<label class="af pw"><span class="af-ic">${I.lock}</span><input id="au-pass" type="${st.show ? 'text' : 'password'}" placeholder=" " autocomplete="${m === 'login' ? 'current-password' : 'new-password'}" minlength="8" required><span class="af-l">Senha</span><button type="button" class="eye" data-act="pw-toggle" aria-label="${st.show ? 'Ocultar senha' : 'Mostrar senha'}" aria-pressed="${!!st.show}">${st.show ? I.eyeoff : I.eye}</button></label>` : ''}
      ${m === 'register' ? '<p class="af-rule" id="au-rule"><i></i>Pelo menos 8 caracteres</p>' : ''}
      ${m === 'login' ? '<div class="af-row"><button type="button" class="link muted" data-act="auth-mode" data-m="forgot">Esqueci minha senha</button></div>' : ''}
      ${st.note ? `<p class="auth-note" role="status">${esc(st.note)}</p>` : ''}
      <p id="au-err" class="auth-err" role="alert" hidden></p>
      ${m === 'forgot' ? `<button class="btn primary block auth-go" type="button" data-act="forgot"><span>Enviar link</span></button><button type="button" class="link muted" style="width:100%" data-act="auth-mode" data-m="login">Voltar para entrar</button>`
        : `<button class="btn primary block auth-go" type="submit"><span>${m === 'login' ? 'Entrar' : 'Criar conta'}</span></button>`}
    </form>
    ${m !== 'forgot' ? `<div class="auth-or"><span>ou</span></div><button class="btn ghost block" data-act="auth-skip">Continuar sem conta</button><p class="auth-fine">Sem conta, seus treinos ficam só neste aparelho. Dá para criar a conta depois, no Perfil, sem perder nada.</p>` : ''}
    <p class="auth-legal">${m === 'register' ? 'Ao criar a conta você concorda com a' : 'Veja nossa'} <a href="privacidade.html" target="_blank" rel="noopener">política de privacidade</a>.</p>
  </div>`;
}
function authKeep(){ const st = UI.auth || {}; const e = $('#au-email'), n = $('#au-name'); if (e) st.email = e.value; if (n) st.name = n.value; UI.auth = st; }
function openLogin(mode = 'login'){
  if (!Auth.enabled){ UI.sheet = {kind: 'info'}; openSheet(`${sheetHead('Conta', 'Login em breve')}<p class="ink2" style="margin:14px 0 0">O login fica ativo quando o app for ligado ao seu servidor. A tela, o fluxo e a sincronização já estão prontos no código (veja o README do projeto).</p><p class="ink2">Até lá, seus treinos ficam salvos ${Store.mode === 'cloud' ? 'na sua conta do Claude' : 'neste aparelho'}. Use “Exportar backup” para levar tudo para o app novo.</p><button class="btn primary block" style="margin-top:12px" data-act="close">Entendi</button>`); return; }
  UI.auth = {mode, show: false, email: UI.auth?.email || ''}; const p = curPage(); if (p && p.type === 'auth'){ render(); return; } push({type: 'auth'});
}
// ================= arrastar para reordenar =================
let DRAG = null;
document.addEventListener('pointerdown', ev => {
  const h = ev.target.closest('.handle'); if (!h) return;
  const row = h.closest('[data-drag-row]'); const list = row && row.parentElement; if (!list || !list.dataset.dragKind) return;
  const rows = [...list.children].filter(x => x.hasAttribute('data-drag-row'));
  DRAG = {row, rows, list, from: rows.indexOf(row), to: rows.indexOf(row), y0: ev.clientY, rects: rows.map(r => r.getBoundingClientRect()), id: ev.pointerId};
  try { h.setPointerCapture(ev.pointerId); } catch (e) {}
  row.classList.add('dragging'); Platform.haptic('light'); ev.preventDefault();
});
document.addEventListener('pointermove', ev => {
  if (!DRAG || ev.pointerId !== DRAG.id) return;
  const dy = ev.clientY - DRAG.y0; const {rects, from, rows} = DRAG; const hgt = rects[from].height;
  DRAG.row.style.transform = `translateY(${dy}px)`;
  const center = rects[from].top + hgt / 2 + dy; let to = from;
  rects.forEach((r, i) => { const mid = r.top + r.height / 2; if (i < from && center < mid) to = Math.min(to, i); if (i > from && center > mid) to = Math.max(to, i); });
  if (to !== DRAG.to){ DRAG.to = to; Platform.haptic('light'); }
  rows.forEach((r, i) => { if (i === from) return; let s = 0; if (from < to && i > from && i <= to) s = -hgt; if (from > to && i >= to && i < from) s = hgt; r.style.transition = 'transform .15s'; r.style.transform = s ? `translateY(${s}px)` : ''; });
});
function endDrag(){
  if (!DRAG) return; const {from, to, list, rows} = DRAG; rows.forEach(r => { r.style.transform = ''; r.style.transition = ''; }); DRAG.row.classList.remove('dragging');
  const kind = list.dataset.dragKind, id = list.dataset.dragId; DRAG = null;
  if (from === to) return;
  if (kind === 'workouts'){ const r = routineById(id); const [w] = r.workouts.splice(from, 1); r.workouts.splice(to, 0, w); }
  else if (kind === 'items'){ const [rid, wid] = id.split('|'); const w = findWorkout(rid, wid); const [x] = w.items.splice(from, 1); w.items.splice(to, 0, x); }
  saveState(); render();
}
document.addEventListener('pointerup', endDrag); document.addEventListener('pointercancel', endDrag);

// ================= ações =================
const A = {};
A.back = () => { closeKP(); const p = curPage(); if (p?.fresh){ UI.stack = []; UI.tab = 'inicio'; render(); window.scrollTo({top: 0}); return; } if (p?.type === 'session'){ const s = curSess(); if (s && s.status === 'draft' && UI.stack.length === 1){ UI.stack = []; render(); return; } } pop(); };
A.tab = el => goTab(el.dataset.tab);
A.close = () => closeSheet();
A['sheet-bg'] = (el, ev) => { if (ev.target === el) closeSheet(); };
A.undo = () => { const f = toastUndo; toastUndo = null; $('#toast').hidden = true; if (f) f(); };
A['confirm-ok'] = () => { const f = UI.sheet && UI.sheet.onOk; closeSheet(); if (f) f(); };
A['confirm-cancel'] = () => { const f = UI.sheet && UI.sheet.onCancel; closeSheet(); if (f) f(); };
A['menu-pick'] = el => { const it = UI.sheet.items[+el.dataset.i]; closeSheet(); if (it && it.run) it.run(); };
A.profile = () => { push({type: 'profile'}); if (Auth.kind === 'firebase' && Store.mode === 'api') Auth.reloadUser().then(() => { if (curPage()?.type === 'profile' && canRerender()) render(); }); };
A.pref = el => { const k = el.dataset.k; let v = el.dataset.v; if (k !== 'theme') v = +v; ST.prefs[k] = v; saveState(); applyTheme(); render(); };
A['hint-up'] = el => { const ss = curSess(); const e = ss && ss.items[+el.dataset.k]; if (!e) return; const kg = +el.dataset.kg, r = +el.dataset.r; e.sets.forEach(x => { if (!x.ok && x.t !== 'w'){ x.kg = kg; x.reps = r; } }); saveSession(ss); render(); Platform.haptic('light'); toast(`${fmtN(kg)} kg nas próximas séries, mirando em ${r} repetições`); };
A['pref-tog'] = el => { const k = el.dataset.k; ST.prefs[k] = !ST.prefs[k]; saveState(); render(); if (k === 'sound' && ST.prefs.sound){ Platform.unlockAudio(); Platform.alarm(); } };
A['open-settings'] = () => push({type: 'settings'});
A['set-pick'] = el => { const k = el.dataset.k; const d = PREF_OPTS[k];
  menuSheet('Configurações', d.t, d.o.map(v => ({label: d.f(v), icon: String(ST.prefs[k]) === String(v) ? I.check : '<span class="mi-sp"></span>', run: () => { ST.prefs[k] = v; saveState(); applyTheme(); render(); }}))); };
A['pf-set'] = el => { const k = el.dataset.k; ST.profile[k] = ST.profile[k] === el.dataset.v ? '' : el.dataset.v; saveState(); render(); };
A['go-body'] = () => { UI.progTab = 'corpo'; goTab('progresso'); };
A.login = () => openLogin('login');
A['login-mode'] = el => openLogin(el.dataset.m);
A['auth-mode'] = el => { authKeep(); UI.auth.mode = el.dataset.m; UI.auth.note = ''; render(); const f = $(UI.auth.mode === 'register' ? '#au-name' : '#au-email'); if (f && !f.value) f.focus(); };
A['pw-toggle'] = el => { const i = $('#au-pass'); if (!i) return; const show = i.type === 'password'; i.type = show ? 'text' : 'password'; UI.auth.show = show; el.setAttribute('aria-pressed', show); el.setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha'); el.innerHTML = show ? I.eyeoff : I.eye; i.focus({preventScroll: true}); try { i.setSelectionRange(i.value.length, i.value.length); } catch (e) {} };
A['auth-skip'] = () => { lsSet('forja.welcome', '1'); UI.stack.pop(); render(); window.scrollTo({top: 0}); };
document.addEventListener('input', ev => { if (ev.target.id === 'au-pass'){ const r = $('#au-rule'); if (r) r.classList.toggle('ok', ev.target.value.length >= 8); } });
A.forgot = async () => { const email = ($('#au-email').value || '').trim(); const err = $('#au-err'); if (!email){ err.textContent = 'Digite seu e-mail acima e toque de novo em Esqueci minha senha.'; err.hidden = false; return; }
  try { await Auth.resetPassword(email); if (curPage()?.type === 'auth'){ UI.auth = {mode: 'login', email, note: 'Se houver conta com esse e-mail, enviamos um link para criar uma nova senha. Confira também o spam.'}; render(); return; } closeSheet(); toast('Se houver conta com esse e-mail, enviamos um link para criar uma nova senha.', null, '', 6000); } catch (e) { err.textContent = e.status === 0 ? 'Sem conexão. Tente de novo.' : e.status === 429 ? 'Muitas tentativas. Aguarde alguns minutos.' : 'Não foi possível enviar agora.'; err.hidden = false; } };
A['check-verified'] = async el => { el.disabled = true; const ok = await Store.checkVerified(); render(); toast(ok ? 'E-mail confirmado. Seus dados estão sendo salvos na conta.' : 'Ainda não aparece como confirmado. Abra o link do e-mail e tente de novo.'); };
A['resend-verify'] = async () => { try { await Auth.resendVerification(); toast('Enviamos outro e-mail de confirmação.'); } catch (e) { toast(e.status === 429 ? 'Aguarde alguns minutos para reenviar.' : 'Não foi possível reenviar agora.'); } };
A.logout = () => Store.mode === 'verify' ? Store.logout().then(() => { render(); toast('Você saiu. Seus dados continuam neste aparelho.'); }) : confirmSheet({title: 'Sair da conta?', text: 'Seus dados continuam salvos na conta. Este aparelho fica limpo até você entrar de novo.', ok: 'Sair', onOk: async () => { const left = await Store.logout(); UI.stack = []; UI.tab = 'inicio'; render(); toast(left ? 'Saiu. Algumas alterações recentes não chegaram ao servidor.' : 'Você saiu da conta'); }});
A['ask-delete-account'] = () => { UI.sheet = {kind: 'delacc'}; openSheet(`${sheetHead('Conta', 'Excluir minha conta')}<form class="stack" style="margin-top:14px" data-form="delacc"><p class="ink2" style="margin:0">Isso apaga para sempre a conta e todos os dados dela no servidor: rotinas, treinos, medidas e perfil. Não dá para desfazer. Se quiser guardar uma cópia, exporte um backup antes.</p>
    <label class="flabel"><span class="tiny muted">Confirme sua senha</span><input id="del-pass" class="field" type="password" autocomplete="current-password" required></label>
    <p id="del-err" class="small" style="color:var(--bad);margin:0" hidden></p>
    <button class="btn danger block" type="submit">Excluir conta e dados</button><button class="btn ghost block" type="button" data-act="close">Cancelar</button></form>`); };
A.install = async () => { const r = await Platform.install(); if (r === 'ios') openSheet(`${sheetHead('Instalar', 'Instalar no iPhone')}<ol class="cues" style="margin-top:14px"><li>Toque em Compartilhar, na barra do Safari.</li><li>Escolha “Adicionar à Tela de Início”.</li><li>Toque em Adicionar. O Forja abre em tela cheia, como um app.</li></ol>`); else if (r === 'accepted'){ toast('Forja instalado'); render(); } else if (r === 'unavailable') toast('Use o menu do navegador: Instalar app'); };
A['install-hide'] = () => { try { localStorage.setItem('forja.installHide', '1'); } catch (e) {} render(); };
A['ask-wipe'] = () => confirmSheet({title: 'Apagar todos os dados?', text: 'Rotinas, treinos, medidas e perfil serão apagados deste aparelho' + (Store.mode !== 'local' ? ' e da nuvem' : '') + '. Exporte um backup antes se quiser guardar.', ok: 'Apagar tudo', danger: true, onOk: () => { const ids = SESS.map(s => s.id); ids.forEach(id => deleteSession(id)); ST = freshState(); saveState(); UI.stack = []; UI.tab = 'inicio'; render(); toast('Dados apagados'); }});
A['retro-sheet'] = el => openStartSheet(el.dataset.date);
A.retro = el => startRetro(el.dataset.rid, el.dataset.wid, el.dataset.date);
A['save-draft'] = () => { closeKP(); const s = curSess(); if (s) saveDraft(s); };
A['edit-session'] = el => { UI.expand = {}; push({type: 'session', sid: el.dataset.sid}); };
A['repeat-session'] = el => { const s = SESS.find(x => x.id === el.dataset.sid); if (s) repeatSession(s); };
A.feel = el => { const s = SESS.find(x => x.id === el.dataset.sid); s.feel = s.feel === el.dataset.v ? null : el.dataset.v; saveSession(s); render(); };
A.fab = () => { closeKP(); const o = openSession(); if (o) openSess(o.id); else openStartSheet(); };
A.minimize = () => { closeKP(); UI.stack = []; render(); window.scrollTo({top: 0}); };
A['open-session'] = () => A.fab();
A['open-routine'] = el => push({type: 'routine', rid: el.dataset.rid});
A['open-template'] = el => push({type: 'template', tid: el.dataset.tid});
A['open-workout'] = el => push({type: 'workout', rid: el.dataset.rid, wid: el.dataset.wid});
A['edit-workout'] = el => push({type: 'workout', rid: el.dataset.rid, wid: el.dataset.wid, edit: true});
A['open-ex'] = el => { UI.exTab = 'sobre'; push({type: 'exercise', ex: el.dataset.ex}); };
A['open-ex-sheet'] = el => { closeSheet(); A['open-ex'](el); };
A.days = el => openDaysSheet(el.dataset.rid);
A['day-tog'] = el => { const d = +el.dataset.d; const s = UI.sheet; s.sel = s.sel.includes(d) ? s.sel.filter(x => x !== d) : [...s.sel, d]; openDaysSheet(s.rid, s.fresh); Platform.haptic('light'); };
A['days-save'] = () => { const s = UI.sheet; const r = routineById(s.rid); if (!r) return; setDays(r, s.sel); saveState(); closeSheet(); UI.homeSel = null; render(); toast(hasSchedule(r) ? 'Dias salvos. O Início mostra o treino de cada dia.' : 'Sem dias fixos: o app segue a sequência.'); };
A['days-clear'] = () => { const r = routineById(UI.sheet.rid); if (!r) return; delete r.dias; saveState(); closeSheet(); render(); toast('Sem dias fixos: o app segue a sequência.'); };
A['go-explore'] = () => { UI.rtab = 'explorar'; goTab('rotinas'); };
A['home-sel'] = el => { UI.homeSel = el.getAttribute('aria-pressed') === 'true' && UI.homeSel === el.dataset.wid ? null : el.dataset.wid; render(); };
A['open-past'] = el => push({type: 'past', sid: el.dataset.sid});
A['toggle-edit'] = () => { const p = curPage(); p.edit = !p.edit; render(); };
A.extab = el => { UI.exTab = el.dataset.t; render(); };
A['new-routine'] = () => { const r = {id: uid('r'), nome: 'Nova rotina', desc: '', workouts: [{id: uid('w'), nome: 'Treino A', cor: 0, items: []}]}; ST.routines.push(r); saveState(); UI.renameRoutine = r.id; push({type: 'routine', rid: r.id}); setTimeout(() => { const i = $('#rname'); if (i){ i.focus(); i.select(); } }, 30); };
A['routine-menu'] = el => { const r = routineById(el.dataset.rid); menuSheet('Rotina', r.nome, [
  {label: 'Renomear e descrever', icon: I.edit, run: () => { UI.renameRoutine = r.id; render(); setTimeout(() => $('#rname')?.focus(), 0); }},
  {label: 'Duplicar rotina', icon: I.plus, run: () => { const c = clone(r); c.id = uid('r'); c.nome += ' (cópia)'; c.workouts.forEach(w => { w.id = uid('w'); w.items.forEach(x => x.uid = uid('i')); }); ST.routines.push(c); saveState(); UI.stack[UI.stack.length - 1] = {type: 'routine', rid: c.id}; render(); toast('Rotina duplicada'); }},
  {label: 'Excluir rotina', icon: I.trash, danger: true, run: () => confirmSheet({title: `Excluir ${r.nome}?`, text: 'Os treinos já registrados continuam no seu histórico.', ok: 'Excluir rotina', danger: true, onOk: () => { ST.routines = ST.routines.filter(x => x !== r); if (ST.active === r.id) ST.active = ST.routines[0]?.id || null; saveState(); pop(); toast('Rotina excluída'); }})}]); };
A['routine-cancel'] = () => { UI.renameRoutine = null; render(); };
A['routine-save'] = el => { const r = routineById(el.dataset.rid); const n = $('#rname').value.trim(); if (n) r.nome = n; r.desc = $('#rdesc').value.trim(); saveState(); UI.renameRoutine = null; render(); };
A['set-active'] = el => { ST.active = el.dataset.rid; saveState(); render(); toast('Rotina ativa atualizada'); };
A['add-template-old'] = el => { const t = TEMPLATES.find(x => x.id === el.dataset.tid); const r = routineFromTemplate(t); ST.routines.push(r); saveState(); UI.tab = 'rotinas'; UI.stack = [{type: 'routine', rid: r.id}]; render(); window.scrollTo({top: 0}); toast(`${t.nome} adicionada às suas rotinas`); };
A['new-workout'] = el => { const r = routineById(el.dataset.rid); const w = {id: uid('w'), nome: 'Treino ' + 'ABCDEFGHIJ'[r.workouts.length % 10], cor: r.workouts.length % COLORS, items: []}; r.workouts.push(w); saveState(); push({type: 'workout', rid: r.id, wid: w.id, edit: true}); };
A.wcolor = el => { const w = findWorkout(el.dataset.rid, el.dataset.wid); w.cor = +el.dataset.c; saveState(); render(); };
A['dup-workout'] = el => { const r = routineById(el.dataset.rid); const w = clone(findWorkout(el.dataset.rid, el.dataset.wid)); w.id = uid('w'); w.nome += ' (cópia)'; w.items.forEach(x => x.uid = uid('i')); r.workouts.push(w); saveState(); UI.stack[UI.stack.length - 1] = {type: 'workout', rid: r.id, wid: w.id, edit: true}; render(); toast('Treino duplicado'); };
A['ask-del-workout'] = el => { const r = routineById(el.dataset.rid); const w = findWorkout(el.dataset.rid, el.dataset.wid); confirmSheet({title: `Excluir ${w.nome}?`, text: 'Ele sai da rotina. O histórico continua.', ok: 'Excluir treino', danger: true, onOk: () => { r.workouts = r.workouts.filter(x => x !== w); saveState(); pop(); toast('Treino excluído'); }}); };
A['i-edit'] = el => openItemEdit(+el.dataset.j);
A['i-add'] = () => openPicker({kind: 'add', multi: true});
A['ie-sets'] = el => { readItemEdit(); const d = UI.sheet.draft; d.sets = Math.max(1, Math.min(10, d.sets + +el.dataset.d)); drawItemEdit(); };
A['ie-rest'] = el => { readItemEdit(); UI.sheet.draft.rest = +el.dataset.r; drawItemEdit(); };
A['ie-save'] = () => { readItemEdit(); const p = curPage(); const w = findWorkout(p.rid, p.wid); w.items[UI.sheet.j] = UI.sheet.draft; saveState(); closeSheet(); render(); toast('Exercício atualizado'); };
A['ie-replace'] = () => { readItemEdit(); const keep = UI.sheet; UI.sheet = {kind: 'replace', cur: keep.draft.ex, q: '', m: '', sel: [], back: keep}; drawPicker(); };
A['ie-remove'] = () => { const p = curPage(); const w = findWorkout(p.rid, p.wid); const j = UI.sheet.j; const [x] = w.items.splice(j, 1); saveState(); closeSheet(); render(); toast(`${exName(x.ex)} removido`, () => { w.items.splice(j, 0, x); saveState(); render(); }); };
A.pickm = el => { UI.sheet.m = el.dataset.m; drawPicker(); };
A.pick = el => {
  const sh = UI.sheet; const ex = el.dataset.ex;
  if (sh.multi){ sh.sel = sh.sel.includes(ex) ? sh.sel.filter(k => k !== ex) : [...sh.sel, ex]; el.setAttribute('aria-pressed', sh.sel.includes(ex)); const b = $('#pick-go'); if (b){ b.disabled = !sh.sel.length; b.textContent = sh.sel.length ? `Adicionar ${sh.sel.length} ${sh.sel.length === 1 ? 'exercício' : 'exercícios'}` : 'Selecione exercícios'; } return; }
  const s = curSess();
  if (sh.kind === 'swap'){ const e = s.items[sh.k]; e.ex = ex; const pre = prefillSets(ex, e.sets.length, s.id); e.sets.forEach((x, i) => { if (!x.ok){ Object.assign(x, {kg: pre[i].kg, reps: pre[i].reps, km: false, rm: false}); } }); saveSession(s); closeSheet(); render(); toast(`Hoje: ${exName(ex)}`); }
  else if (sh.kind === 'replace'){ const back = sh.back; back.draft.ex = ex; UI.sheet = back; drawItemEdit(); }
};
A['pick-confirm'] = () => {
  const sh = UI.sheet;
  if (sh.kind === 'extra'){ const s = curSess(); sh.sel.forEach(ex => s.items.push({uid: uid('x'), planned: null, ex, sets: prefillSets(ex, 3, s.id)})); saveSession(s); closeSheet(); render(); const n = s.items.length - sh.sel.length; setTimeout(() => document.getElementById(`card-${n}`)?.scrollIntoView({behavior: 'smooth', block: 'start'}), 100); return; }
  const p = curPage(); const w = findWorkout(p.rid, p.wid); sh.sel.forEach(ex => w.items.push(newItem(ex))); saveState(); closeSheet(); render(); toast(`${sh.sel.length} adicionado${sh.sel.length > 1 ? 's' : ''}`);
};
function newItem(ex){ const e = getEx(ex); const iso = ['quad-iso', 'fly', 'ombro-lat', 'ombro-front', 'ombro-post', 'biceps', 'martelo', 'triceps-over', 'triceps-push', 'flexora', 'pant', 'abd', 'abd-inf', 'obliquo', 'gluteo', 'adutor', 'antebraco', 'antebraco-flex', 'encolhimento'].includes(e.p); return {uid: uid('i'), ex, sets: 3, rmin: iso ? 10 : 8, rmax: iso ? 15 : 12, rest: iso ? 60 : 120, nota: ''}; }
A.start = el => startSession(el.dataset.rid, el.dataset.wid);
/* tocar de novo no campo selecionado tira a seleção; abrir um campo não desfaz a série (só digitar desfaz) */
A.cell = el => { const k = +el.dataset.k, j = +el.dataset.j, f = el.dataset.f; if (KP.open && KP.k === k && KP.j === j && KP.f === f){ closeKP(); render(); return; } openKP(k, j, f); };
A.kp = el => kpKey(el.dataset.k);
A['kp-close'] = () => { closeKP(); render(); };
A['kp-done'] = () => checkSet(KP.k, KP.j);
A.done = el => checkSet(+el.dataset.k, +el.dataset.j);
A['copy-prev'] = el => { Platform.haptic('light'); const s = curSess(); const k = +el.dataset.k, j = +el.dataset.j; const e = s.items[k]; const l = lastItem(e.ex, s.id); const pv = l && l.e.sets.filter(x => x.ok)[j]; if (!pv) return; const x = e.sets[j]; x.kg = pv.kg; x.reps = pv.reps; x.km = x.rm = true; propagate(e, j, 'kg'); propagate(e, j, 'reps'); saveSession(s); render(); buzz(10); };
A['set-menu'] = el => { const s = curSess(); const k = +el.dataset.k, j = +el.dataset.j; const e = s.items[k]; const x = e.sets[j]; const setT = t => () => { x.t = t; saveSession(s); render(); };
  menuSheet(exName(e.ex), `Série ${j + 1}`, [{label: 'Série normal', icon: svg('M12 5v14'), run: setT('n')}, {label: 'Aquecimento (não conta no volume)', icon: I.flame, run: setT('w')}, {label: 'Até a falha', icon: svg('M5 19L19 5M5 5l14 14'), run: setT('f')}, {label: 'Drop set', icon: svg('M12 5v14M6 13l6 6 6-6'), run: setT('d')},
    e.sets.length > 1 ? {label: 'Apagar esta série', icon: I.trash, danger: true, run: () => { const [rm] = e.sets.splice(j, 1); saveSession(s); render(); toast('Série apagada', () => { e.sets.splice(j, 0, rm); saveSession(s); render(); }); }} : null]); };
A.addset = el => { const s = curSess(); const e = s.items[+el.dataset.k]; const l = e.sets[e.sets.length - 1]; e.sets.push({kg: l ? l.kg : null, reps: l ? l.reps : null, ok: false, t: 'n', km: false, rm: false}); saveSession(s); render(); };
A.expand = el => { UI.expand[+el.dataset.k] = true; render(); };
A['ex-menu'] = el => { const s = curSess(); const k = +el.dataset.k; const e = s.items[k]; const t = itemTarget(s, e);
  menuSheet('Exercício', exName(e.ex), [
    {label: 'Ver como fazer', icon: I.info, run: () => { UI.exTab = 'inst'; push({type: 'exercise', ex: e.ex}); }},
    {label: s.status === 'open' ? 'Trocar aparelho só hoje' : 'Trocar exercício', icon: I.swap, run: () => openPicker({kind: 'swap', k, cur: e.ex})},
    warmups(e) && !e.sets.some(x => x.t === 'w') ? {label: 'Adicionar séries de aquecimento', icon: I.flame, run: () => { e.sets.unshift(...warmups(e)); saveSession(s); render(); toast('3 séries de aquecimento adicionadas (50%, 70% e 85%)'); }} : null,
    {label: 'Anotação', icon: I.note, run: () => { UI.sheet = {kind: 'note', k}; openSheet(`${sheetHead(exName(e.ex), 'Anotação deste treino')}<textarea id="note-in" class="field" style="margin-top:16px" maxlength="200" placeholder="Ex.: senti o ombro, banco no 4º furo">${esc(e.note || '')}</textarea><button class="btn primary block" style="margin-top:12px" data-act="note-save">Salvar</button>`); setTimeout(() => $('#note-in')?.focus(), 50); }},
    {label: `Descanso: ${fmtRest(t.rest)}`, icon: I.timer, run: () => menuSheet(exName(e.ex), 'Descanso hoje', [0, 45, 60, 90, 120, 150, 180].map(r => ({label: r ? fmtRest(r) : 'Sem descanso', icon: t.rest === r ? I.check : '', run: () => { e.rest = r; saveSession(s); render(); }})))},
    k > 0 ? {label: 'Mover para cima', icon: I.up, run: () => { [s.items[k - 1], s.items[k]] = [s.items[k], s.items[k - 1]]; UI.expand = {}; saveSession(s); render(); }} : null,
    k < s.items.length - 1 ? {label: 'Mover para baixo', icon: I.down, run: () => { [s.items[k + 1], s.items[k]] = [s.items[k], s.items[k + 1]]; UI.expand = {}; saveSession(s); render(); }} : null,
    {label: s.status === 'open' ? 'Tirar do treino de hoje' : 'Remover deste treino', icon: I.trash, danger: true, run: () => { const [rm] = s.items.splice(k, 1); UI.expand = {}; saveSession(s); render(); toast(`${exName(rm.ex)} retirado de hoje`, () => { s.items.splice(k, 0, rm); saveSession(s); render(); }); }}]); };
A['note-save'] = () => { const s = curSess(); s.items[UI.sheet.k].note = $('#note-in').value.trim(); saveSession(s); closeSheet(); render(); };
A.unswap = el => { const s = curSess(); const e = s.items[+el.dataset.k]; e.ex = e.planned; const pre = prefillSets(e.ex, e.sets.length, s.id); e.sets.forEach((x, i) => { if (!x.ok) Object.assign(x, {kg: pre[i].kg, reps: pre[i].reps, km: false, rm: false}); }); saveSession(s); render(); };
A['add-extra'] = () => { closeKP(); openPicker({kind: 'extra', multi: true}); };
A.finish = () => { closeKP(); const s = curSess(); if (!s) return; const st = stats(s); const total = s.items.reduce((a, e) => a + e.sets.filter(x => x.t !== 'w').length, 0);
  if (!st.sets) return confirmSheet({title: 'Nenhuma série marcada', text: 'Marque as séries feitas com o ✓ antes de finalizar, ou descarte o treino.', ok: 'Continuar treinando', cancel: 'Fechar', onOk: () => {}});
  if (st.sets < total) return confirmSheet({sub: 'Finalizar treino', title: `${st.sets} de ${total} séries feitas`, text: 'As séries sem ✓ não entram no histórico.', ok: 'Finalizar assim', cancel: 'Continuar treinando', onOk: () => finishSession(s)});
  finishSession(s); };
A['ask-discard'] = () => { const s = curSess(); if (!s) return; const draft = s.status === 'draft'; confirmSheet({title: draft ? 'Descartar este registro?' : 'Descartar este treino?', text: draft ? 'Nada será salvo no histórico.' : 'As séries anotadas hoje serão apagadas.', ok: 'Descartar', danger: true, onOk: () => { closeKP(); deleteSession(s.id); if (draft){ UI.stack = []; render(); } else { stopRest(); Platform.keepAwake(false); goTab('inicio'); } toast(draft ? 'Registro descartado' : 'Treino descartado'); }}); };
A['ask-del-session'] = el => confirmSheet({title: 'Apagar este registro?', ok: 'Apagar', danger: true, onOk: () => { const sid = el.dataset.sid; const s = SESS.find(x => x.id === sid); deleteSession(sid); A.back(); toast('Registro apagado', () => { SESS.push(s); saveSession(s); render(); }); }});
A['save-free'] = el => { const s = SESS.find(x => x.id === el.dataset.sid); const r = activeRoutine(); if (!r) return; const w = {id: uid('w'), nome: 'Treino ' + 'ABCDEFGHIJ'[r.workouts.length % 10], cor: r.workouts.length % COLORS, items: s.items.map(e => ({...newItem(e.ex), sets: Math.max(1, workSets(e).length || e.sets.length)}))}; r.workouts.push(w); saveState(); toast(`Salvo como ${w.nome} em ${r.nome}`); UI.stack = [{type: 'workout', rid: r.id, wid: w.id, edit: true}]; render(); };
A['rest-add'] = () => { R.end = Math.max(R.end, Date.now()) + 15000; R.total += 15; R.buzzed = false; drawRest(); };
A['rest-sub'] = () => { R.end -= 15000; drawRest(); };
A['rest-stop'] = () => stopRest();
A.quick = el => quickMark(el.dataset.rid, el.dataset.wid, UI.calSel);
A.calnav = el => { let [y, m] = UI.calMonth; m += +el.dataset.d; if (m < 0){ m = 11; y--; } if (m > 11){ m = 0; y++; } UI.calMonth = [y, m]; render(); };
A.calsel = el => { UI.calSel = el.dataset.date; render(); };
A.progtab = el => { UI.progTab = el.dataset.t; render(); };
A.metric = el => { UI.progMetric = el.dataset.m; render(); };
A.bwm = el => { UI.bwMetric = el.dataset.m; render(); };
A['bw-add'] = el => { const date = $('#bw-date').value || today(); const edit = el && el.dataset && el.dataset.edit; const old = (ST.bw || []).find(x => x.date === date); const e = edit ? {date} : {...(old || {}), date}; let any = false;
  Object.keys(BWF).forEach(k => { const raw = $('#bw-' + k).value.trim(); const v = parseNum(raw); if (v != null && v > 0){ e[k] = v; any = true; } else if (edit && raw === '') delete e[k]; });
  if (!any && !edit){ toast('Preencha pelo menos uma medida.'); return; }
  ST.bw = (ST.bw || []).filter(x => x.date !== date); if (Object.keys(BWF).some(k => e[k] != null)) ST.bw.push(e); saveState(); closeSheet(); render(); toast(old && !edit ? 'Medidas somadas à medição do dia' : 'Medição salva'); };
A['bw-open'] = el => openBwSheet(null, el && el.dataset && el.dataset.f);
A['bw-edit'] = el => openBwSheet(el.dataset.d);
A['bw-view'] = el => { UI.bwView = el.dataset.v; render(); };
A['bw-metric'] = el => push({type: 'bmetric', m: el.dataset.m});
A['bw-del-day'] = el => { const it = (ST.bw || []).find(x => x.date === el.dataset.d); if (!it) return; ST.bw = ST.bw.filter(x => x !== it); saveState(); render(); toast('Medição apagada', () => { ST.bw.push(it); saveState(); render(); }); };
A['bw-del-val'] = el => { const it = (ST.bw || []).find(x => x.date === el.dataset.d); if (!it) return; const k = el.dataset.m; const v = it[k]; delete it[k]; if (!Object.keys(BWF).some(q => it[q] != null)) ST.bw = ST.bw.filter(x => x !== it); saveState(); render(); toast(`${BWN(k)} de ${fmtD(it.date)} apagado`, () => { it[k] = v; if (!ST.bw.includes(it)) ST.bw.push(it); saveState(); render(); }); };
A['bw-del'] = el => { const list = ST.bw.slice().sort((a, b) => a.date.localeCompare(b.date)); const it = list[+el.dataset.i]; ST.bw = ST.bw.filter(x => x !== it); saveState(); render(); toast('Medição apagada', () => { ST.bw.push(it); saveState(); render(); }); };
A.libm = el => { UI.libM = el.dataset.m; render(); };
A.libe = el => { UI.libE = el.dataset.e; render(); };
A['new-ex'] = () => openNewEx();
A['nx-pri'] = A['nx-sec'] = (el, ev, act) => { keepNewEx(); const sh = UI.sheet; const r = el.dataset.r; const k = act === 'nx-pri' ? 'pri' : 'sec', o = k === 'pri' ? 'sec' : 'pri'; sh[k] = sh[k].includes(r) ? sh[k].filter(x => x !== r) : [...sh[k], r]; sh[o] = sh[o].filter(x => x !== r); const y = $('.sheet').scrollTop; drawNewEx(); $('.sheet').scrollTop = y; };
A['nx-save'] = () => { keepNewEx(); const sh = UI.sheet; const n = (sh['nx-n'] || '').trim(); if (!n){ toast('Dê um nome ao exercício.'); $('#nx-n')?.focus(); return; } const id = uid('c'); ST.custom[id] = {n, m: sh['nx-m'] || 'peito', p: 'custom', e: sh['nx-e'] || 'outros', pri: sh.pri, sec: sh.sec, d: (sh['nx-d'] || '').split('\n').map(x => x.trim()).filter(Boolean)}; saveState(); closeSheet(); push({type: 'exercise', ex: id}); toast('Exercício criado'); };
A['ask-del-custom'] = el => confirmSheet({title: `Excluir ${exName(el.dataset.ex)}?`, ok: 'Excluir', danger: true, onOk: () => { delete ST.custom[el.dataset.ex]; saveState(); pop(); toast('Exercício excluído'); }});
A['add-to-workout'] = el => openAddTo(el.dataset.ex);
A['addto-pick'] = el => { const w = findWorkout(el.dataset.rid, el.dataset.wid); w.items.push(newItem(UI.sheet.ex)); saveState(); closeSheet(); toast(`Adicionado ao ${w.nome}`); };
A['media-del'] = el => { const id = ST.media[el.dataset.ex]; delete ST.media[el.dataset.ex]; saveState(); render(); if (Store.adapter?.assets && id && !Object.values(ST.media).includes(id)) Store.adapter?.assets.delete(id).catch(() => {}); };
A.export = async () => { const data = JSON.stringify({app: 'forja', version: APP_VERSION, exportedAt: new Date().toISOString(), estado: ST, sessoes: SESS}, null, 2); const name = `forja-backup-${today()}.json`; const dl = Store.adapter?.downloads;
  if (dl){ try { await dl.save({filename: name, data}); } catch (e) { if (e && e.code !== 'declined') toast('Não foi possível exportar agora.'); } return; }
  try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], {type: 'application/json'})); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); } catch (e) { toast('Não foi possível exportar agora.'); } };

document.addEventListener('click', ev => {
  const nav = ev.target.closest('nav.tabs a');
  if (nav){ ev.preventDefault(); const t = nav.dataset.tab; if (Platform.isArtifact && location.hash !== '#' + t){ try { location.hash = t; } catch (e) { goTab(t); } } else { if (!Platform.isArtifact) try { history.replaceState(history.state, '', '#' + t); } catch (e) {} goTab(t); } return; }
  const el = ev.target.closest('[data-act]');
  /* com o teclado aberto, tocar numa área vazia do treino tira a seleção (como fechar o teclado do celular) */
  if (KP.open && !ev.target.closest('#kp') && (!el || el.closest('#top') === null && !['cell', 'check', 'kp', 'kp-done', 'kp-close'].includes(el.dataset.act) && el.closest('.ex') === null)){ closeKP(); render(); if (!el) return; }
  if (!el) return;
  if (el.tagName === 'INPUT' || el.tagName === 'SELECT') return;
  const act = el.dataset.act; const fn = A[act]; if (!fn) return;
  fn(el, ev, act);
});
document.addEventListener('input', ev => {
  const t = ev.target; const act = t.dataset && t.dataset.act;
  if (act === 'pickq'){ UI.sheet.q = t.value; $('#pick-body').innerHTML = pickerBody(); return; }
  if (act === 'libq'){ UI.libQ = t.value; $('#lib-list').innerHTML = libRows(libList()); }
});
document.addEventListener('change', async ev => {
  const t = ev.target; const act = t.dataset && t.dataset.act;
  if (act === 'progex'){ UI.progEx = t.value; render(); }
  if (act === 'day-w'){ const r = routineById(t.dataset.rid); if (!r) return; r.dias = r.dias || {}; if (t.value) r.dias[t.dataset.d] = t.value; else delete r.dias[t.dataset.d]; if (!hasSchedule(r)) delete r.dias; saveState(); render(); }
  if (act === 'pf'){ ST.profile[t.dataset.k] = t.value.trim(); saveState(); if (t.dataset.k === 'name') render(); }
  if (act === 'ss-date' || act === 'ss-dur'){ const s = curSess(); if (!s) return; if (act === 'ss-date'){ if (t.value && t.value <= today()) s.date = t.value; } else { const v = parseInt(t.value, 10); s.dur = v > 0 ? v : null; } saveSession(s); }
  if (act === 's-note'){ const s = SESS.find(x => x.id === t.dataset.sid); if (s){ s.note = t.value.trim(); saveSession(s); } }
  if (act === 'import' && t.files && t.files[0]){
    let j = null; try { j = JSON.parse(await t.files[0].text()); } catch (e) {} t.value = '';
    if (!j || !j.estado || !Array.isArray(j.sessoes)){ toast('Este arquivo não é um backup do Forja.'); return; }
    confirmSheet({title: 'Importar backup?', text: `${j.sessoes.length} treinos e ${(j.estado.routines || []).length} rotinas. Os dados atuais serão substituídos.`, ok: 'Importar', onOk: () => { const keep = new Set(j.sessoes.map(x => x.id)); SESS.filter(x => !keep.has(x.id)).map(x => x.id).forEach(id => deleteSession(id)); ST = j.estado; fixState(); saveState(); SESS = j.sessoes.map(normSession); SESS.forEach(x => saveSession(x)); applyTheme(); render(); toast('Backup importado'); }});
  }
  if (act === 'wname'){ const w = findWorkout(t.dataset.rid, t.dataset.wid); const v = t.value.trim(); if (w && v){ w.nome = v; saveState(); } }
  if (act === 'media' && t.files && t.files[0]){
    const f = t.files[0]; if (f.size > 20 * 1024 * 1024){ toast('Arquivo grande demais (máx. 20 MB).'); return; }
    toast('Enviando imagem…');
    try { const r = await Store.adapter?.assets.upload(f); const old = ST.media[t.dataset.ex]; ST.media[t.dataset.ex] = r.id; saveState(); render(); toast('Imagem salva'); if (old && !Object.values(ST.media).includes(old)) Store.adapter?.assets.delete(old).catch(() => {}); }
    catch (e) { toast(e && e.code === 'unsupported_type' ? 'Formato não aceito. Use JPG, PNG, GIF ou WEBP.' : 'Não consegui enviar a imagem.'); }
  }
});
document.addEventListener('submit', async ev => {
  const f = ev.target; if (f.dataset.form !== 'auth') return; ev.preventDefault();
  const err = $('#au-err'); const btn = f.querySelector('[type=submit]'); btn.disabled = true; err.hidden = true;
  const wasReg = ((UI.auth && curPage()?.type === 'auth') ? UI.auth.mode : UI.sheet?.mode) === 'register';
  { const em = $('#au-email'), pw = $('#au-pass'), nm = $('#au-name'); const bad = nm && !nm.value.trim() ? 'Digite seu nome.' : em && !/^\S+@\S+\.\S+$/.test(em.value.trim()) ? 'Digite um e-mail válido.' : pw && pw.value.length < 8 ? 'A senha tem pelo menos 8 caracteres.' : '';
    if (bad){ err.textContent = bad; err.hidden = false; btn.disabled = false; btn.classList.remove('busy'); return; } }
  btn.classList.add('busy');
  try { if (wasReg) await Auth.register($('#au-name').value.trim(), $('#au-email').value.trim(), $('#au-pass').value); else await Auth.login($('#au-email').value.trim(), $('#au-pass').value);
    lsSet('forja.welcome', '1'); closeSheet(); if (curPage()?.type === 'auth') UI.stack.pop(); render(); toast('Conectando…'); await Store.switchToApi();
    if (Store.mode === 'verify'){ UI.stack = [{type: 'profile'}]; render(); toast(wasReg ? 'Conta criada. Confirme o e-mail para começar a salvar na nuvem.' : 'Confirme seu e-mail para começar a salvar na nuvem.', null, '', 6000); }
    else if (Store.mode === 'api') toast('Conectado. Seus dados estão sincronizados.');
    else toast('Conta conectada, mas o servidor não respondeu. Tentaremos de novo.'); if (!ST.profile.name && Auth.user && Auth.user.name){ ST.profile.name = Auth.user.name; saveState(); } render(); }
  catch (e) { err.textContent = e.status === 401 ? 'E-mail ou senha incorretos.' : e.status === 409 ? 'Já existe uma conta com este e-mail.' : e.status === 429 ? 'Muitas tentativas. Aguarde alguns minutos.' : e.status === 400 ? (e.message || 'Confira os dados.') : 'Não foi possível conectar ao servidor. Verifique a internet.'; err.hidden = false; btn.disabled = false; btn.classList.remove('busy'); }
});
document.addEventListener('submit', async ev => {
  const f = ev.target; if (f.dataset.form !== 'delacc') return; ev.preventDefault();
  const err = $('#del-err'); const btn = f.querySelector('[type=submit]'); btn.disabled = true; err.hidden = true;
  try { await Store.deleteAccount($('#del-pass').value); closeSheet(); UI.stack = []; UI.tab = 'inicio'; render(); toast('Conta e dados excluídos'); }
  catch (e) { err.textContent = e.status === 401 || e.status === 403 ? 'Senha incorreta.' : 'Não foi possível excluir agora. Tente de novo com internet.'; err.hidden = false; btn.disabled = false; }
});
document.addEventListener('keydown', ev => {
  if (ev.key === 'Escape'){ handleBack(); return; }
  if (!KP.open || isTyping() || !$('#sheet').hidden) return;
  const map = {Backspace: 'bk', Enter: 'next', Tab: 'next', ',': ',', '.': ',', '+': 'plus', '-': 'minus'};
  const k = /^[0-9]$/.test(ev.key) ? ev.key : map[ev.key]; if (!k) return; ev.preventDefault(); kpKey(k);
});
window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (TABS.includes(h)) goTab(h); });
setInterval(() => { const s = curSess(); const c = $('#clock'); if (c && s) c.textContent = fmtClock((Date.now() - new Date(s.startedAt)) / 1000); }, 1000);
{ const h = location.hash.slice(1); if (TABS.includes(h)) UI.tab = h; }

