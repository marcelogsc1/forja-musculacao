/* ============================================================================
   Explorar: biblioteca de programas, filtros, página do programa e
   assistente "Montar meu programa". Depende de programs.js e app.js.
   ========================================================================== */
const GOAL_COLOR = {hipertrofia: 'var(--ember)', forca: 'var(--c1)', definicao: 'var(--c3)', condicionamento: 'var(--c0)', saude: 'var(--c7)'};
const GOAL_SHORT = {hipertrofia: 'Hipertrofia', forca: 'Força', definicao: 'Definição', condicionamento: 'HIIT', saude: 'Saúde'};
const XF_KEYS = {
  goal: {n: 'Objetivo', opts: () => Object.entries(GOALS)},
  local: {n: 'Local', opts: () => Object.entries(LOCAIS).map(([k, v]) => [k, v.n])},
  nivel: {n: 'Nível', opts: () => NIVEIS.map(n => [n, n])},
  dias: {n: 'Dias por semana', opts: () => [['2', '2 dias'], ['3', '3 dias'], ['4', '4 dias'], ['5', '5 dias'], ['6', '6 dias']]},
  dur: {n: 'Duração', opts: () => [['30', 'Até 30 min'], ['45', 'Até 45 min'], ['60', 'Até 60 min'], ['90', 'Até 90 min']]},
  tipo: {n: 'Tipo', opts: () => [['programa', 'Programas completos'], ['avulso', 'Treinos avulsos'], ['comp', 'Complementos']]},
};
const tplById = id => id === '_bld' ? builderTpl() : TEMPLATES.find(t => t.id === id);
/* Programa com os ajustes do usuário (local, duração, nível) aplicados, quando for gerado */
function effTpl(t){
  const o = t && t.gen && UI.tplOpt[t.id]; if (!o) return t;
  const g = {...t.gen, ...o}; return {...t, gen: g, nivel: g.nivel, dur: g.dur, local: [g.local], workouts: genProgram(g)};
}
function tplFilter(f, q){
  const nq = norm((q || '').trim());
  return TEMPLATES.filter(t => (!f.goal || t.goal.includes(f.goal)) && (!f.local || t.local.includes(f.local)) && (!f.nivel || t.nivel === f.nivel)
    && (!f.dias || (!t.avulso && !t.comp && String(t.freq) === f.dias)) && (!f.dur || t.dur <= +f.dur) && (!f.foco || (t.foco || []).includes(f.foco))
    && (!f.tipo || (f.tipo === 'avulso' ? t.avulso : f.tipo === 'comp' ? t.comp : !t.avulso && !t.comp))
    && (!nq || norm(t.nome + ' ' + t.desc + ' ' + (t.tag || []).join(' ')).includes(nq)));
}
const tplMeta = t => t.avulso ? `Treino avulso · ${t.workouts[0].items.length} exercícios · ~${t.dur} min` : `${t.comp ? 'Complemento · ' : ''}${t.freq}x por semana · ${t.nivel} · ~${t.dur} min`;

// ---------- peças visuais ----------
/* Capa: fundo escuro com brilho na cor do objetivo, atleta à direita e título à esquerda */
function coverArt(t, cls = 'row', o = {}){
  const ac = GOAL_COLOR[t.goal[0]] || 'var(--ember)'; const ex = CAT[t.art];
  const eb = o.eb != null ? o.eb : (t.avulso ? 'Treino avulso' : t.comp ? 'Complemento' : GOALS[t.goal[0]]);
  const meta = o.meta != null ? o.meta : (t.avulso ? `${t.workouts[0].items.length} exercícios · ~${t.dur} min` : `${t.freq}x por semana · ~${t.dur} min`);
  const chips = o.chips || (t.nivel ? [t.nivel] : []);
  return `<span class="cov ${cls}" style="--ac:${ac}">${ex ? `<span class="cov-img"><img src="${figSrc(ex.f)}" alt="" loading="lazy" decoding="async"></span>` : ''}
    <span class="cov-txt">${eb ? `<span class="cov-eb">${esc(eb)}</span>` : ''}<b class="cov-tt">${esc(o.title || t.nome)}</b>${meta ? `<span class="cov-m">${esc(meta)}</span>` : ''}${chips.length ? `<span class="cov-ch">${chips.map(c => `<i>${esc(c)}</i>`).join('')}</span>` : ''}</span></span>`;
}
const pcard = t => `<button class="pcard" data-act="open-template" data-tid="${t.id}">${coverArt(t, 'row')}</button>`;
const pslide = t => `<button class="pslide" data-act="open-template" data-tid="${t.id}">${coverArt(t, 'big')}</button>`;
function bodyThumb(regs, back){
  const arr = back ? BODYDATA.back : BODYDATA.front, vb = back ? BODYDATA.vbB : BODYDATA.vbF, border = back ? BODYDATA.bb : BODYDATA.bf;
  let h = ''; for (const [skin, r, d] of arr) h += `<path class="${skin ? 'm-skin' : r.some(x => regs.includes(x)) ? 'm-pri' : 'm-off'}" d="${d}"/>`;
  return `<svg viewBox="${vb.join(' ')}" aria-hidden="true">${h}<path class="m-border" d="${border}"/></svg>`;
}
const FOCO_BACK = {costas: 1, gluteos: 1};

// ---------- Explorar ----------
function xActive(){ return Object.values(UI.xf).some(Boolean) || !!(UI.xq || '').trim(); }
function xChips(){
  return `<div class="chips" role="group" aria-label="Filtros">${Object.entries(XF_KEYS).map(([k, d]) => { const v = UI.xf[k]; const lbl = v ? (d.opts().find(o => o[0] === v) || [, v])[1] : d.n;
    return `<button class="chip ${v ? 'on' : ''}" data-act="xf-open" data-k="${k}" aria-pressed="${!!v}">${esc(lbl)}${v ? '' : `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`}</button>`; }).join('')}
    ${xActive() ? `<button class="chip" data-act="xf-clear">Limpar</button>` : ''}</div>`;
}
function xResults(){
  const list = tplFilter(UI.xf, UI.xq);
  return `<div class="tiny muted" style="margin:0 4px 10px">${list.length} ${list.length === 1 ? 'resultado' : 'resultados'}</div>${list.length ? `<div class="stack">${list.map(pcard).join('')}</div>` : '<div class="empty"><b>Nenhum programa com esses filtros</b>Tire um filtro ou monte um programa sob medida no assistente.</div>'}`;
}
function xSection(title, f, n = 8){
  const list = tplFilter(f); if (!list.length) return '';
  return `<section><div class="sec-head"><span class="eyebrow">${esc(title)}</span><button class="link" data-act="open-xlist" data-f='${esc(JSON.stringify(f))}' data-title="${esc(title)}">Ver todos</button></div>
    <div class="hscroll">${list.slice(0, n).map(pslide).join('')}</div></section>`;
}
function vExplore(){
  const feat = ['t-hip5', 'g-glute4', 'c-phul', 'g-casa3', 'c-avulso-hiit'].map(tplById).filter(Boolean);
  let h = `<section class="stack" style="gap:12px;margin-top:16px"><div class="search">${svg('M11 17.5a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13zM20 20l-4.2-4.2')}<input id="x-q" class="field" type="search" placeholder="Buscar programas e treinos" value="${esc(UI.xq || '')}" data-act="xq" autocomplete="off"></div>${xChips()}</section>`;
  if (xActive()) return h + `<section id="x-results" style="margin-top:14px">${xResults()}</section>`;
  h += `<section><button class="builder-cta" data-act="open-builder"><span class="grow"><span class="eyebrow" style="color:var(--ember)">Sob medida</span><b class="display h3" style="display:block;margin-top:6px">Montar meu programa</b><span class="small ink2" style="display:block;margin-top:6px">Objetivo, dias, local, tempo e músculo prioritário. O Forja monta os treinos.</span></span><span class="bc-chips"><i>Objetivo</i><i class="hot">Dias</i><i>Local</i><i>Foco</i></span></button></section>
  <section><div class="sec-head"><span class="eyebrow">Em destaque</span><span class="tiny muted">${TEMPLATES.length} programas e treinos</span></div><div class="hscroll">${feat.map(pslide).join('')}</div></section>
  <section><div class="sec-head"><span class="eyebrow">Onde você treina</span></div><div class="ltiles">${Object.entries(LOCAIS).map(([k, l]) => `<button class="ltile" data-act="open-xlist" data-f='{"local":"${k}"}' data-title="${esc(l.n)}">${coverArt({goal: ['hipertrofia'], art: l.art, nome: l.n}, '', {eb: '', meta: `${tplFilter({local: k}).length} opções`, chips: []})}</button>`).join('')}</div></section>
  <section><div class="sec-head"><span class="eyebrow">Foco muscular</span></div><div class="list">${Object.entries(FOCOS).map(([k, fo]) => `<button class="li frow" data-act="open-xlist" data-f='{"foco":"${k}"}' data-title="${esc(fo.n)}"><span class="fthumb">${bodyThumb(fo.reg, FOCO_BACK[k])}</span><div class="grow"><b>${esc(fo.n)}</b><span class="sub">${tplFilter({foco: k}).length} programas e treinos</span></div>${I.chev}</button>`).join('')}</div></section>`;
  h += xSection('Ganhar músculo', {goal: 'hipertrofia', tipo: 'programa'}) + xSection('Ganhar força', {goal: 'forca'}) + xSection('Definição e perda de gordura', {goal: 'definicao'})
    + xSection('Iniciantes', {nivel: 'Iniciante', tipo: 'programa'}) + xSection('Treinos avulsos', {tipo: 'avulso'}, 12) + xSection('Condicionamento e HIIT', {goal: 'condicionamento'}) + xSection('Complementos', {tipo: 'comp'});
  return h;
}
PAGES.xlist = {title: p => p.title || 'Programas', view: p => { const list = tplFilter(p.f || {}); return `<section style="margin-top:14px"><div class="tiny muted" style="margin:0 4px 10px">${list.length} ${list.length === 1 ? 'opção' : 'opções'}</div><div class="stack">${list.map(pcard).join('')}</div></section>`; }};

// ---------- página do programa ----------
const exRow = x => `<button class="li hv" data-act="open-ex" data-ex="${x.ex}">${thumb(x.ex, 'round')}<div class="grow"><b>${esc(exName(x.ex))}</b><span class="sub num">${x.sets} ${x.sets === 1 ? 'série' : 'séries'} · ${x.rmin === x.rmax ? x.rmin : x.rmin + '–' + x.rmax} reps${x.rest ? ' · ' + fmtRest(x.rest) : ''}</span>${x.nota ? `<span class="sub" style="color:var(--ink2)">${esc(x.nota)}</span>` : ''}</div></button>`;
function optGroup(label, k, opts, cur, act, extra = ''){
  return `<div class="og"><span class="eyebrow">${esc(label)}</span><div class="chips">${opts.map(([v, l]) => `<button class="chip" data-act="${act}" data-k="${k}" data-v="${esc(v)}" ${extra} aria-pressed="${String(cur) === String(v)}">${esc(l)}</button>`).join('')}</div></div>`;
}
function vTemplate(p){
  const t0 = tplById(p.tid); if (!t0) return ''; const t = effTpl(t0);
  const m = musclesOf(t.workouts.flatMap(w => w.items)); const g = t.gen;
  let h = `<section class="tpl-hero">${coverArt(t, 'xl', {chips: [t.nivel, t.avulso ? 'Avulso' : t.freq + 'x por semana', '~' + t.dur + ' min']})}</section>
  <section><p class="ink2" style="margin:0">${esc(t.desc)}</p>
    <div class="row wrap" style="gap:6px;margin-top:12px">${t.goal.map(x => `<span class="tag" style="background:color-mix(in srgb,${GOAL_COLOR[x]} 16%,transparent);color:${GOAL_COLOR[x]}">${esc(GOALS[x])}</span>`).join('')}${t.local.filter(l => LOCAIS[l]).map(l => `<span class="tag">${esc(LOCAIS[l].n)}</span>`).join('')}</div></section>`;
  if (g) h += `<section class="card stack" style="gap:14px"><div><div class="eyebrow" style="color:var(--ink2)">Ajuste à sua realidade</div><p class="tiny muted" style="margin:6px 0 0">Os exercícios mudam na hora conforme o equipamento e o tempo disponíveis.</p></div>
    ${optGroup('Onde', 'local', Object.entries(LOCAIS).filter(([k]) => k !== 'cardio').map(([k, l]) => [k, l.n]), g.local, 'tpl-opt', `data-tid="${t.id}"`)}
    ${optGroup('Tempo por treino', 'dur', [[30, '30 min'], [45, '45 min'], [60, '60 min'], [75, '75 min']], g.dur, 'tpl-opt', `data-tid="${t.id}"`)}
    ${optGroup('Nível', 'nivel', NIVEIS.map(n => [n, n]), g.nivel, 'tpl-opt', `data-tid="${t.id}"`)}</section>`;
  h += `<section class="stack" style="gap:10px"><button class="btn primary block" data-act="add-template" data-tid="${t.id}">${I.plus}${t.avulso ? 'Salvar como nova rotina' : 'Salvar nas minhas rotinas'}</button>
    ${t.avulso && activeRoutine() ? `<button class="btn block" data-act="add-tpl-workout" data-tid="${t.id}">Adicionar à rotina ativa</button>` : ''}</section>`;
  h += t.workouts.map((w, i) => `<section><div class="row" style="margin-bottom:10px"><span class="plate" style="--pc:${col(w.cor)}">${i + 1}</span><div class="grow"><h2 class="display h3">${esc(w.nome)}</h2><span class="tiny muted">${w.items.length} exercícios · ${wSets(w)} séries · ~${wMins(w)} min</span></div></div><div class="list">${w.items.map(exRow).join('')}</div></section>`).join('');
  h += `<section class="card"><div class="eyebrow" style="margin-bottom:10px">Músculos trabalhados</div>${muscleBlock(m.pri, m.sec, false)}</section>`;
  return h;
}

// ---------- assistente ----------
const BLD0 = {goal: 'hipertrofia', dias: 4, local: 'academia', nivel: 'Intermediário', dur: 60, foco: '', div: 'auto'};
function bldKeys(b){
  if (b.goal === 'condicionamento') return ['CI', 'CI2', 'CI3', 'CI', 'CI2', 'CI3'].slice(0, b.dias);
  if (b.foco === 'gluteos' && (b.dias === 3 || b.dias === 4)) return SPLITS['glute' + b.dias];
  if (b.dias === 3 && b.div === 'ppl') return SPLITS.ppl3;
  if (b.dias === 4 && b.div === 'fb') return ['FA', 'FB', 'FC', 'FA'];
  return SPLITS[b.dias];
}
function builderTpl(){
  const b = UI.bld || (UI.bld = {...BLD0}); const o = {...b, keys: bldKeys(b), foco: b.foco || undefined};
  const nm = `${{hipertrofia: 'Hipertrofia', forca: 'Força', definicao: 'Definição', condicionamento: 'Condicionamento', saude: 'Saúde'}[b.goal]} sob medida ${b.dias}x`;
  return {id: '_bld', nome: nm, desc: `${GOALS[b.goal]}, ${b.dias} dias por semana, ${LOCAIS[b.local].n.toLowerCase()}, cerca de ${b.dur} minutos${b.foco ? ', prioridade para ' + FOCOS[b.foco].n.toLowerCase() : ''}. Montado pelo assistente do Forja.`,
    goal: [b.goal], local: [b.local], nivel: b.nivel, freq: b.dias, dur: b.dur, foco: b.foco ? [b.foco] : [], tag: ['MEU', 'PROGRAMA'], art: LOCAIS[b.local].art, workouts: genProgram(o)};
}
PAGES.builder = {title: () => 'Montar meu programa', view: () => {
  const b = UI.bld || (UI.bld = {...BLD0}); const t = builderTpl();
  return `<section style="margin-top:8px"><h1 class="display h1">Sob medida</h1><p class="ink2" style="margin:8px 0 0">Escolha as opções e veja os treinos mudarem abaixo. Depois é só salvar e editar o que quiser.</p></section>
  <section class="card stack" style="gap:16px">
    ${optGroup('Objetivo', 'goal', Object.entries(GOALS), b.goal, 'bld')}
    ${optGroup('Dias por semana', 'dias', [2, 3, 4, 5, 6].map(n => [n, n + ' dias']), b.dias, 'bld')}
    ${b.dias === 3 && b.goal !== 'condicionamento' && b.foco !== 'gluteos' ? optGroup('Divisão', 'div', [['auto', 'Corpo inteiro'], ['ppl', 'Push Pull Legs']], b.div === 'ppl' ? 'ppl' : 'auto', 'bld') : ''}
    ${b.dias === 4 && b.goal !== 'condicionamento' && b.foco !== 'gluteos' ? optGroup('Divisão', 'div', [['auto', 'Superiores e inferiores'], ['fb', 'Corpo inteiro']], b.div === 'fb' ? 'fb' : 'auto', 'bld') : ''}
    ${optGroup('Onde você treina', 'local', Object.entries(LOCAIS).filter(([k]) => k !== 'cardio').map(([k, l]) => [k, l.n]), b.local, 'bld')}
    ${optGroup('Nível', 'nivel', NIVEIS.map(n => [n, n]), b.nivel, 'bld')}
    ${optGroup('Tempo por treino', 'dur', [[30, '30 min'], [45, '45 min'], [60, '60 min'], [75, '75 min']], b.dur, 'bld')}
    ${optGroup('Músculo prioritário (opcional)', 'foco', [['', 'Nenhum'], ...Object.entries(FOCOS).map(([k, f]) => [k, f.n])], b.foco, 'bld')}
  </section>
  <section><button class="btn primary block" data-act="add-template" data-tid="_bld">${I.plus}Salvar programa</button></section>
  ${t.workouts.map((w, i) => `<section><div class="row" style="margin-bottom:10px"><span class="plate" style="--pc:${col(w.cor)}">${i + 1}</span><div class="grow"><h2 class="display h3">${esc(w.nome)}</h2><span class="tiny muted">${w.items.length} exercícios · ${wSets(w)} séries · ~${wMins(w)} min</span></div></div><div class="list">${w.items.map(exRow).join('')}</div></section>`).join('')}
  <p class="tiny muted" style="margin:16px 4px 0">O assistente segue as recomendações usadas no seu plano: 10 a 20 séries semanais por músculo, cada um treinado cerca de 2x por semana, e escolhe o melhor exercício disponível para o seu equipamento.</p>`;
}};

// ---------- ações ----------
A.rtab = el => { UI.rtab = el.dataset.t; render(); };
A['xf-open'] = el => { const k = el.dataset.k, d = XF_KEYS[k];
  openSheet(`${sheetHead('Filtrar', d.n)}<div class="stack" style="gap:8px;margin-top:16px">${[['', 'Qualquer']].concat(d.opts()).map(([v, l]) => `<button class="btn ${String(UI.xf[k] || '') === v ? 'primary' : ''} block" style="justify-content:flex-start" data-act="xf-set" data-k="${k}" data-v="${esc(v)}">${esc(l)}</button>`).join('')}</div>`); };
A['xf-set'] = el => { UI.xf[el.dataset.k] = el.dataset.v || ''; closeSheet(); render(); };
A['xf-clear'] = () => { UI.xf = {}; UI.xq = ''; render(); };
A['open-xlist'] = el => { let f = {}; try { f = JSON.parse(el.dataset.f); } catch (e) {} push({type: 'xlist', f, title: el.dataset.title}); };
A['open-builder'] = () => push({type: 'builder'});
A['tpl-opt'] = el => { const tid = el.dataset.tid, k = el.dataset.k; const o = UI.tplOpt[tid] = UI.tplOpt[tid] || {}; o[k] = k === 'dur' ? +el.dataset.v : el.dataset.v; render(); };
A.bld = el => { const k = el.dataset.k; UI.bld[k] = k === 'dias' || k === 'dur' ? +el.dataset.v : el.dataset.v; render(); };
A['add-template'] = el => {
  const t = effTpl(tplById(el.dataset.tid)); if (!t) return;
  const r = routineFromTemplate(t); ST.routines.push(r); if (!activeRoutine()) ST.active = r.id; saveState();
  UI.tab = 'rotinas'; UI.rtab = 'minhas'; UI.stack = [{type: 'routine', rid: r.id}]; render(); window.scrollTo({top: 0}); toast(`${t.nome} salvo nas suas rotinas`); Platform.haptic('success');
};
A['add-tpl-workout'] = el => {
  const t = effTpl(tplById(el.dataset.tid)); const r = activeRoutine(); if (!t || !r) return;
  const w = t.workouts[0]; const wid = uid('w'); r.workouts.push({id: wid, nome: w.nome, cor: w.cor, items: w.items.map(x => ({uid: uid('i'), ...x}))}); saveState();
  UI.tab = 'rotinas'; UI.rtab = 'minhas'; UI.stack = [{type: 'routine', rid: r.id}]; render(); window.scrollTo({top: 0}); toast(`${w.nome} adicionado a ${r.nome}`);
};
A.pics = el => { ST.prefs.pics = el.dataset.v; saveState(); render(); };
document.addEventListener('input', ev => { const t = ev.target; if (t.dataset && t.dataset.act === 'xq'){ const was = xActive(); UI.xq = t.value; if (was !== xActive()){ render(); const i = $('#x-q'); if (i){ i.focus(); i.setSelectionRange(i.value.length, i.value.length); } } else { const el = $('#x-results'); if (el) el.innerHTML = xResults(); } } });
