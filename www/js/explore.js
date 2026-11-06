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
  h += `<section><button class="builder-cta" data-act="open-builder"><span class="grow"><span class="eyebrow" style="color:var(--ember)">Sob medida</span><b class="display h3" style="display:block;margin-top:6px">Montar meu programa</b><span class="small ink2" style="display:block;margin-top:6px">Cinco perguntas rápidas e o Forja monta os treinos para a sua rotina.</span></span><span class="bc-chips"><i>5 perguntas</i><i class="hot">1 minuto</i></span></button></section>
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
/* Assistente em passos: uma pergunta por tela, cada passo é uma página da pilha
   (o voltar do celular e o do topo voltam uma pergunta). No fim, o programa recomendado
   e, discretamente, outras opções compatíveis com as respostas. */
const BSTEPS = ['goal', 'dias', 'local', 'nivel', 'foco'];
const GOAL_SUB = {hipertrofia: 'Aumentar a massa muscular, com volume e repetições moderadas.', forca: 'Levantar mais peso nos básicos. Poucas repetições e descansos longos.', definicao: 'Perder gordura mantendo os músculos. Bi-sets e cardio no fim.', condicionamento: 'Fôlego e gasto calórico. Circuitos quase sem descanso.', saude: 'Começar ou voltar a treinar com segurança e constância.'};
const NIVEL_SUB = {Iniciante: 'Começando agora ou voltando depois de uma pausa longa.', 'Intermediário': 'Treina com regularidade e já conhece os exercícios básicos.', 'Avançado': 'Treina há anos e precisa de mais volume para evoluir.'};
function splitLabel(keys){ const ks = keys.join(); return /CI/.test(ks) ? 'Circuitos' : /GA/.test(ks) ? 'Glúteos em foco' : /^PU,PL,LG,PU2/.test(ks) ? 'Push Pull Legs 2x' : /^PU,PL,LG$/.test(ks) ? 'Push Pull Legs' : /^UA,LA,PU/.test(ks) ? 'Upper Lower + Push Pull Legs' : /^UA,LA/.test(ks) ? 'Superiores e inferiores' : 'Corpo inteiro'; }
function splitWhy(keys, dias){ const l = splitLabel(keys);
  return l === 'Push Pull Legs' ? 'Cada treino foca um movimento: empurrar, puxar e pernas. Cada músculo é treinado 1 vez por semana, com mais volume por treino.'
    : l === 'Corpo inteiro' ? `O corpo todo em cada treino, então cada músculo é trabalhado ${dias >= 3 ? 'de 2 a 3' : '2'} vezes por semana com poucos dias de academia.`
    : l === 'Superiores e inferiores' ? 'Alterna parte de cima e pernas. Cada músculo é treinado 2 vezes por semana, com treinos de duração moderada.'
    : l === 'Upper Lower + Push Pull Legs' ? 'Dois dias de superiores e inferiores e três de empurrar, puxar e pernas: cada músculo cerca de 2 vezes por semana.'
    : l === 'Push Pull Legs 2x' ? 'Empurrar, puxar e pernas duas vezes na semana. Cada músculo 2 vezes, com bastante volume.'
    : l === 'Glúteos em foco' ? 'Dias de inferiores com glúteos em primeiro lugar, intercalados com treinos de superiores.'
    : 'Exercícios em sequência com descanso só no fim da volta, para manter o coração acelerado.'; }
const bldDiasSub = (b, n) => b.goal === 'condicionamento' ? `${n} circuitos` : splitLabel(bldKeys({...b, dias: n, div: 'auto'}));
function bldAlts(b){
  // outras divisões possíveis para os mesmos dias
  const divs = []; const cur = bldKeys(b).join();
  const tries = b.dias === 3 ? ['auto', 'ppl'] : b.dias === 4 ? ['auto', 'fb'] : [];
  if (b.goal !== 'condicionamento') tries.forEach(d => { const k = bldKeys({...b, div: d, foco: b.foco === 'gluteos' ? '' : b.foco}); if (k.join() !== cur) divs.push({div: d, nofoco: b.foco === 'gluteos', label: splitLabel(k)}); });
  // programas da biblioteca compatíveis com as respostas
  const sc = t => (t.freq === b.dias ? 4 : Math.abs(t.freq - b.dias) === 1 ? 1 : -9) + (t.nivel === b.nivel ? 2 : 0) + (b.foco && (t.foco || []).includes(b.foco) ? 3 : 0) + (t.dur <= b.dur ? 1 : 0);
  const lib = tplFilter({goal: b.goal, local: b.local, tipo: 'programa'}).map(t => [sc(t), t]).filter(x => x[0] > 0).sort((x, y) => y[0] - x[0]).slice(0, 4).map(x => x[1]);
  return {divs, lib};
}
function bldProgress(i){ return `<div class="bq-prog" aria-label="Passo ${i + 1} de ${BSTEPS.length}">${BSTEPS.map((_, j) => `<i class="${j < i ? 'done' : j === i ? 'on' : ''}"></i>`).join('')}</div><div class="eyebrow" style="margin-top:14px">Passo ${i + 1} de ${BSTEPS.length}</div>`; }
const bqChoice = (k, v, cur, title, sub, lead = '') => `<button class="choice" data-act="bld-pick" data-k="${k}" data-v="${esc(v)}" aria-pressed="${String(cur) === String(v)}">${lead}<span class="grow"><b>${title}</b>${sub ? `<span>${sub}</span>` : ''}</span><i class="tick">${I.check}</i></button>`;
function vBuilderStep(b, step){
  const i = BSTEPS.indexOf(step); let q = '', body = '';
  if (step === 'goal'){ q = 'Qual é o seu objetivo agora?'; body = `<div class="stack" style="gap:10px">${Object.entries(GOALS).map(([k, n]) => bqChoice('goal', k, b.goal, esc(n), GOAL_SUB[k])).join('')}</div>`; }
  else if (step === 'dias'){ q = 'Quantos dias por semana você consegue treinar?'; body = `<div class="bq-days">${[2, 3, 4, 5, 6].map(n => `<button class="bq-day" data-act="bld-set" data-k="dias" data-v="${n}" aria-pressed="${b.dias === n}"><b class="mono">${n}</b><span>dias</span></button>`).join('')}</div>
    <div class="card bq-note"><div class="eyebrow">Com ${b.dias} dias</div><b>${bldDiasSub(b, b.dias)}</b><p>Prefira o número que você mantém nas semanas corridas. Constância rende mais que um plano ambicioso abandonado.</p></div>
    <button class="btn primary block" style="margin-top:18px" data-act="bld-next" data-step="dias">Continuar</button>`; }
  else if (step === 'local'){ q = 'Onde você vai treinar?'; body = `<div class="stack" style="gap:10px">${Object.entries(LOCAIS).filter(([k]) => k !== 'cardio').map(([k, l]) => bqChoice('local', k, b.local, esc(l.n), l.d || 'Máquinas, polias, barras e halteres')).join('')}</div>`; }
  else if (step === 'nivel'){ q = 'Como está a sua experiência?'; body = `<div class="stack" style="gap:10px">${NIVEIS.map(n => bqChoice('nivel', n, b.nivel, n, NIVEL_SUB[n])).join('')}</div>
    <div class="og" style="margin-top:22px"><span class="eyebrow">Tempo por treino</span><div class="seg">${[30, 45, 60, 75].map(m => `<button data-act="bld-set" data-k="dur" data-v="${m}" aria-pressed="${b.dur === m}">${m} min</button>`).join('')}</div></div>
    <button class="btn primary block" style="margin-top:22px" data-act="bld-next" data-step="nivel">Continuar</button>`; }
  else if (step === 'foco'){ q = 'Quer dar prioridade a algum músculo?'; body = `<p class="ink2" style="margin:-6px 0 16px">Opcional. O programa ganha volume extra para ele, sem deixar o resto de lado.</p><div class="list">${[['', 'Não, quero equilíbrio', 'Todos os grupos com o mesmo peso']].concat(Object.entries(FOCOS).map(([k, f]) => [k, f.n, ''])).map(([k, n, sub]) => `<button class="li frow bq-foco" data-act="bld-pick" data-k="foco" data-v="${k}" aria-pressed="${(b.foco || '') === k}"><span class="fthumb">${k ? bodyThumb(FOCOS[k].reg, FOCO_BACK[k]) : bodyThumb([], 0)}</span><div class="grow"><b>${esc(n)}</b>${sub ? `<span class="sub">${sub}</span>` : ''}</div><i class="tick">${I.check}</i></button>`).join('')}</div>`; }
  return `<section class="bq">${bldProgress(i)}<h1 class="display h2 bq-q">${q}</h1>${body}</section>`;
}
function vBuilderResult(b){
  const t = builderTpl(); const keys = bldKeys(b); const al = UI.bldAlt ? bldAlts(b) : null;
  const ans = [['goal', GOAL_SHORT[b.goal]], ['dias', b.dias + ' dias'], ['local', LOCAIS[b.local].n], ['nivel', `${b.nivel} · ${b.dur} min`], ['foco', b.foco ? FOCOS[b.foco].n : 'Sem prioridade']];
  return `<section class="bq-res" style="--ac:${GOAL_COLOR[b.goal]}"><div class="eyebrow" style="color:var(--ac)">Seu programa</div><h1 class="display h1" style="margin-top:8px">${esc(t.nome)}</h1>
    <p class="ink2" style="margin:10px 0 0"><b style="color:var(--ink)">${splitLabel(keys)}</b>. ${splitWhy(keys, b.dias)}</p>
    <div class="bq-ans">${ans.map(([k, v]) => `<button class="chip" data-act="bld-go" data-step="${k}">${esc(v)}</button>`).join('')}</div></section>
  <section><div class="list bq-week">${t.workouts.map((w, i) => `<details class="bq-w"><summary><span class="plate" style="--pc:${col(w.cor)}">${i + 1}</span><span class="grow"><b>${esc(w.nome)}</b><span class="sub">${w.items.length} exercícios · ${wSets(w)} séries · ~${wMins(w)} min</span></span>${I.chev}</summary><div class="list">${w.items.map(exRow).join('')}</div></details>`).join('')}</div>
    <p class="tiny muted" style="margin:10px 4px 0">Toque em um treino para ver os exercícios. Depois de salvar, você pode trocar qualquer um.</p></section>
  <section class="stack" style="gap:10px"><button class="btn primary block" data-act="add-template" data-tid="_bld">${I.plus}Salvar programa</button>
    ${al ? '' : '<button class="link bq-more" data-act="bld-alt">Ver outras opções</button>'}</section>
  ${al ? `<section><div class="sec-head"><span class="eyebrow">Outras opções para você</span><button class="link" data-act="bld-alt">Ocultar</button></div>
    ${al.divs.length ? `<div class="stack" style="gap:10px;margin-bottom:12px">${al.divs.map(d => `<button class="choice" data-act="bld-div" data-v="${d.div}" data-nofoco="${d.nofoco ? 1 : ''}"><span class="grow"><b>${esc(d.label)}</b><span>Mesmos ${b.dias} dias, outra divisão${d.nofoco ? ', sem o foco em glúteos' : ''}. ${splitWhy(bldKeys({...b, div: d.div, foco: d.nofoco ? '' : b.foco}), b.dias)}</span></span>${I.chev}</button>`).join('')}</div>` : ''}
    ${al.lib.length ? `<div class="stack">${al.lib.map(pcard).join('')}</div>` : (al.divs.length ? '' : '<div class="empty"><b>Sem outras opções</b>Mude uma das respostas acima para ver mais programas.</div>')}</section>` : ''}
  <p class="tiny muted" style="margin:16px 4px 0">O assistente segue as recomendações usadas no seu plano: 10 a 20 séries semanais por músculo, cada um treinado cerca de 2x por semana, e escolhe o melhor exercício disponível para o seu equipamento.</p>`;
}
PAGES.builder = {title: () => 'Montar meu programa', view: p => {
  const b = UI.bld || (UI.bld = {...BLD0, nivel: NIVEIS.includes(ST.profile.level) ? ST.profile.level : BLD0.nivel});
  return p.step && p.step !== 'res' ? vBuilderStep(b, p.step) : p.step === 'res' ? vBuilderResult(b) : vBuilderStep(b, 'goal');
}};
const bldNext = step => { const i = BSTEPS.indexOf(step); push({type: 'builder', step: i < BSTEPS.length - 1 ? BSTEPS[i + 1] : 'res'}); };
// ---------- ações ----------
A.rtab = el => { UI.rtab = el.dataset.t; render(); };
A['xf-open'] = el => { const k = el.dataset.k, d = XF_KEYS[k];
  openSheet(`${sheetHead('Filtrar', d.n)}<div class="stack" style="gap:8px;margin-top:16px">${[['', 'Qualquer']].concat(d.opts()).map(([v, l]) => `<button class="btn ${String(UI.xf[k] || '') === v ? 'primary' : ''} block" style="justify-content:flex-start" data-act="xf-set" data-k="${k}" data-v="${esc(v)}">${esc(l)}</button>`).join('')}</div>`); };
A['xf-set'] = el => { UI.xf[el.dataset.k] = el.dataset.v || ''; closeSheet(); render(); };
A['xf-clear'] = () => { UI.xf = {}; UI.xq = ''; render(); };
A['open-xlist'] = el => { let f = {}; try { f = JSON.parse(el.dataset.f); } catch (e) {} push({type: 'xlist', f, title: el.dataset.title}); };
A['open-builder'] = () => { UI.bld = null; UI.bldAlt = false; push({type: 'builder', step: 'goal'}); };
A['tpl-opt'] = el => { const tid = el.dataset.tid, k = el.dataset.k; const o = UI.tplOpt[tid] = UI.tplOpt[tid] || {}; o[k] = k === 'dur' ? +el.dataset.v : el.dataset.v; render(); };
A.bld = el => { const k = el.dataset.k; UI.bld[k] = k === 'dias' || k === 'dur' ? +el.dataset.v : el.dataset.v; render(); };
A['bld-set'] = el => { const k = el.dataset.k; UI.bld[k] = k === 'dias' || k === 'dur' ? +el.dataset.v : el.dataset.v; if (k === 'dias') UI.bld.div = 'auto'; render(); Platform.haptic('light'); };
/* escolher avança sozinho depois de um instante, para a marcação aparecer */
A['bld-pick'] = el => { const k = el.dataset.k; const step = curPage().step; UI.bld[k] = k === 'dias' ? +el.dataset.v : el.dataset.v; if (k === 'dias') UI.bld.div = 'auto'; UI.bldAlt = false; render(); Platform.haptic('light'); clearTimeout(A._bt); A._bt = setTimeout(() => { if (curPage()?.type === 'builder' && curPage().step === step) bldNext(step); }, 220); };
A['bld-next'] = el => bldNext(el.dataset.step);
A['bld-go'] = el => { const i = UI.stack.findIndex(p => p.type === 'builder' && p.step === el.dataset.step); if (i >= 0){ UI.stack = UI.stack.slice(0, i + 1); render(); window.scrollTo({top: 0}); } };
A['bld-alt'] = () => { UI.bldAlt = !UI.bldAlt; render(); if (UI.bldAlt) setTimeout(() => $('.bq-more, .bq-res ~ section .sec-head')?.scrollIntoView({behavior: 'smooth', block: 'start'}), 30); };
A['bld-div'] = el => { UI.bld.div = el.dataset.v; if (el.dataset.nofoco) UI.bld.foco = ''; UI.bldAlt = false; render(); window.scrollTo({top: 0, behavior: 'smooth'}); toast('Divisão trocada'); };
A['add-template'] = el => {
  const t = effTpl(tplById(el.dataset.tid)); if (!t) return;
  const r = routineFromTemplate(t); ST.routines.push(r); if (!activeRoutine()) ST.active = r.id; saveState();
  UI.tab = 'rotinas'; UI.rtab = 'minhas'; UI.stack = [{type: 'routine', rid: r.id}]; render(); window.scrollTo({top: 0}); Platform.haptic('success'); if (r.workouts.length) openDaysSheet(r.id, true); else toast(`${t.nome} salvo nas suas rotinas`);
};
A['add-tpl-workout'] = el => {
  const t = effTpl(tplById(el.dataset.tid)); const r = activeRoutine(); if (!t || !r) return;
  const w = t.workouts[0]; const wid = uid('w'); r.workouts.push({id: wid, nome: w.nome, cor: w.cor, items: w.items.map(x => ({uid: uid('i'), ...x}))}); saveState();
  UI.tab = 'rotinas'; UI.rtab = 'minhas'; UI.stack = [{type: 'routine', rid: r.id}]; render(); window.scrollTo({top: 0}); toast(`${w.nome} adicionado a ${r.nome}`);
};
A.pics = el => { ST.prefs.pics = el.dataset.v; saveState(); render(); };
document.addEventListener('input', ev => { const t = ev.target; if (t.dataset && t.dataset.act === 'xq'){ const was = xActive(); UI.xq = t.value; if (was !== xActive()){ render(); const i = $('#x-q'); if (i){ i.focus(); i.setSelectionRange(i.value.length, i.value.length); } } else { const el = $('#x-results'); if (el) el.innerHTML = xResults(); } } });
