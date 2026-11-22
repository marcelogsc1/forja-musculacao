/* Observações do treino (v4.13)
   O usuário escreve em português livre ("sem polia", "mais foco em glúteo", "tenho 40 minutos").
   Regras fixas, sem IA: o texto é quebrado em frases, cada frase passa por padrões conhecidos
   e vira ajustes pequenos sobre o treino escolhido (trocar, somar uma série, incluir um exercício).
   Nada é aplicado sem a prévia "O que entendi"; o que não for reconhecido fica como lembrete na sessão. */

const OB_EQ = [
  [/\b(polias?|cabos?|cross ?over|cross)\b/, 'cabo'], [/\b(maquinas?|aparelhos?)\b/, 'maquina'], [/\bsmith\b/, 'smith'],
  [/\bhalter(es)?\b/, 'halter'], [/\bbarra(s)?\b(?! fixa)(?! w)/, 'barra'], [/\b(elasticos?|faixas?|bands?|minibands?)\b/, 'elastico'],
  [/\bkettlebells?\b/, 'kettlebell'], [/\b(peso do corpo|peso corporal|calistenia)\b/, 'peso'],
];
const OB_MUS = [
  [/\b(peito|peitoral|peitorais)\b/, ['peito']], [/\b(costas|dorsal|dorsais|lats?)\b/, ['costas']], [/\b(ombros?|deltoides?)\b/, ['ombros']],
  [/\bbiceps\b/, ['biceps']], [/\btriceps\b/, ['triceps']], [/\bbracos?\b/, ['biceps', 'triceps']], [/\bantebracos?\b/, ['antebraco']],
  [/\bquadriceps\b/, ['quadriceps']], [/\bposteriores?( de coxa)?\b/, ['posteriores']], [/\b(gluteos?|bumbum)\b/, ['gluteos']],
  [/\b(pernas?|coxas?|inferiores)\b/, ['quadriceps', 'posteriores']], [/\bpanturrilhas?\b/, ['panturrilha']],
  [/\b(abdomen|abdominais?|abs|core|barriga)\b/, ['abdomen']], [/\badutor(es|a)?\b/, ['adutores']],
];
const OB_ADD = {peito: ['pressI', 'fly', 'pressH2'], costas: ['rowH2', 'pullV2', 'rowH', 'pullV'], ombros: ['lat', 'rear', 'ohp'], biceps: ['bi2', 'bi', 'bi3'], triceps: ['tri2', 'tri', 'tri3'],
  quadriceps: ['squat2', 'legext', 'lunge'], posteriores: ['legcurl', 'hinge'], gluteos: ['glute', 'abduct', 'lunge'], panturrilha: ['calf'], abdomen: ['core2', 'core'], adutores: ['adduct'], antebraco: []};
const OB_JOINT = [
  [/\bombros?\b/, 'ombro', e => ['ombro-press', 'dip-peito', 'ombro-front', 'pullover', 'press-decl'].includes(e.p) || /remada alta|atras da nuca|paralela/.test(norm(e.n))],
  [/\bjoelhos?\b/, 'joelho', e => ['quad-comp', 'quad-iso'].includes(e.p)],
  [/\b(lombar|coluna|costas baixa|hernia)\b/, 'lombar', e => ['terra', 'hinge'].includes(e.p) || (e.p === 'remada' && e.e === 'barra') || (e.p === 'quad-comp' && e.e === 'barra')],
  [/\b(punhos?|pulsos?)\b/, 'punho', e => (e.e === 'barra' && ['biceps', 'triceps-over', 'triceps-push'].includes(e.p)) || /flexao/.test(norm(e.n))],
  [/\bcotovelos?\b/, 'cotovelo', e => ['triceps-over', 'triceps-push'].includes(e.p) && e.e === 'barra'],
];
const OB_NEG = /\b(ocupad\w*|quebrad\w*|manutencao|lotad\w*|fila|sem|nao (quero|gosto|tenho|curto|consigo|uso|usar|fazer|faco|curti)|evit\w*|tir\w*|remov\w*|odeio|nada de|chega de|detesto|troc\w* (o|a|os|as)?)\b/;
const OB_STOP = new Set(['com', 'sem', 'para', 'pra', 'mais', 'menos', 'quero', 'gosto', 'fazer', 'treino', 'exercicio', 'exercicios', 'nao', 'tirar', 'trocar', 'evitar', 'tenho', 'odeio', 'muito', 'pouco', 'favor']);
let OB_VOCAB = null;
const obVocab = () => OB_VOCAB || (OB_VOCAB = new Set(Object.values(CAT).flatMap(e => norm(e.n).split(/[^a-z0-9]+/)).filter(w => w.length >= 4 && !OB_STOP.has(w))));
const ISO_P = ['quad-iso', 'fly', 'ombro-lat', 'ombro-front', 'ombro-post', 'biceps', 'martelo', 'triceps-over', 'triceps-push', 'flexora', 'pant', 'abd', 'abd-inf', 'obliquo', 'gluteo', 'adutor', 'antebraco', 'antebraco-flex', 'encolhimento'];
/* exercícios que pedem técnica ou força avançada: só entram por troca automática se não houver outra opção */
const OB_HARD = new Set(['flexora-nordica', 'sissy', 'paralelas', 'barra-fixa', 'barra-supinada', 'barra-neutra', 'barra-arqueiro', 'paralelas-peito', 'flexao-arqueiro', 'agachamento-unilateral', 'pike', 'flexao-declinada']);
const EQ_PREF = ['halter', 'barra', 'maquina', 'cabo', 'smith', 'peso', 'casa', 'kettlebell', 'elastico', 'suspensao', 'outros'];

/* equipamento que este treino já usa: se tem máquina ou polia, está numa academia */
function obAllowedEq(items, ban){
  const used = new Set(items.map(x => getEx(x.ex) && getEx(x.ex).e).filter(Boolean));
  const gym = ['maquina', 'cabo', 'smith', 'barra'].some(e => used.has(e));
  const base = gym ? LOCAIS.academia.eq : [...used, 'peso', 'casa'];
  return [...new Set([...base, ...OB_CTX.plus])].filter(e => !ban.has(e));
}
/* melhor substituto: mesmo padrão de movimento, equipamento permitido, ainda não está no treino */
function obAlt(ex, items, ban, prefer){
  const e = getEx(ex); if (!e) return null; const inW = new Set(items.map(x => x.ex)); const allow = new Set(obAllowedEq(items, ban));
  const rank = k => { const c = CAT[k]; return (prefer && c.e === prefer ? 0 : 10) + (allow.has(c.e) ? 0 : 100) + EQ_PREF.indexOf(c.e); };
  const ok = k => k !== ex && !inW.has(k) && !ban.has(CAT[k].e) && (allow.has(CAT[k].e) || (prefer && CAT[k].e === prefer)) && obNeedsOk(k);
  const same = Object.keys(CAT).filter(k => ok(k) && !CAT[k].hid && CAT[k].p === e.p);
  const near = Object.keys(CAT).filter(k => ok(k) && !CAT[k].hid && CAT[k].p !== e.p && CAT[k].m === e.m && (CAT[k].pri || [])[0] === (e.pri || [])[0] && CAT[k].m !== 'cardio');
  const pick = l => l.sort((a, b) => rank(a) - rank(b))[0];
  const pf = k => prefer && CAT[k].e === prefer && !OB_HARD.has(k);
  return (prefer && (pick(same.filter(pf)) || pick(near.filter(pf)))) || pick(same.filter(k => !OB_HARD.has(k))) || pick(near.filter(k => !OB_HARD.has(k))) || pick(same) || pick(near) || null;
}
function obAddFor(m, items, ban){
  const inW = new Set(items.map(x => x.ex)); const allow = new Set(obAllowedEq(items, ban));
  for (const sl of OB_ADD[m] || []){ const k = (SLOTS[sl] ? SLOTS[sl].c : []).find(k => CAT[k] && !inW.has(k) && allow.has(CAT[k].e) && !ban.has(CAT[k].e)); if (k) return k; }
  return null;
}
/* v4.25: contexto da leitura (equipamentos liberados por "só halteres") e foco em ângulos/porções do músculo */
const OB_CTX = {plus: new Set(), pref: {}, home: false};
/* em casa, nada que precise de barra fixa, paralelas ou outro aparelho */
const obNeedsOk = k => !OB_CTX.home || !(typeof NEEDS_X !== 'undefined' && NEEDS_X[k] || []).some(n => !CASA.includes(n));
const OB_FOCUS = /\b(mais|foco|focar|priori\w*|enfase|enfatizar|reforc\w*|caprich\w*|fraco|atrasad\w*|desenvolver|crescer|atencao|incluir|adicion\w*|acrescent\w*|trabalhar|pegar|quero)\b/;
const OB_ANG = [
  {re: /\b(peito|peitoral) (superior|de cima|alto)\b|\bparte (de cima|superior|alta) do peito\b|\bclavicular\b/, m: 'peito', t: 'peito superior', p: ['press-incl'], ex: ['crossover-baixo', 'supino-incl-halter']},
  {re: /\b(peito|peitoral) (inferior|de baixo|baixo)\b|\bparte (de baixo|inferior|baixa) do peito\b/, m: 'peito', t: 'peito inferior', p: ['press-decl', 'dip-peito'], ex: ['crossover-alto']},
  {re: /\b(peito|peitoral) (interno|do meio|central|centro)\b|\bmeio do peito\b/, m: 'peito', t: 'meio do peito', p: ['fly'], ex: ['supino-squeeze', 'voador', 'crossover']},
  {re: /\b(deltoides?|ombros?) (lateral|laterais|medio)\b|\blateral do ombro\b|\bombros? (largos?|mais largos?)\b/, m: 'ombros', t: 'deltoide lateral', p: ['ombro-lat'], ex: ['elev-lateral-halter', 'elev-lateral-cabo']},
  {re: /\b(deltoides?|ombros?) (posterior|posteriores|traseiros?|de tras)\b|\bposterior do ombro\b/, m: 'ombros', t: 'deltoide posterior', p: ['ombro-post'], ex: ['face-pull', 'voador-inverso', 'crucifixo-inverso-halter']},
  {re: /\b(deltoides?|ombros?) (anterior|anteriores|frontal|da frente)\b/, m: 'ombros', t: 'deltoide anterior', p: ['ombro-front', 'ombro-press']},
  {re: /\blargura (das |nas |da )?costas\b|\bcostas (largas|mais largas)\b|\bdorsal largo\b|\bformato (de )?v\b|\bv invertido\b/, m: 'costas', t: 'largura das costas', p: ['puxada', 'pullover'], ex: ['puxada-aberta', 'pulldown-estendido']},
  {re: /\bespessura (das |nas |da )?costas\b|\bcostas (grossas|densas)\b|\bmeio das costas\b|\bromboides?\b/, m: 'costas', t: 'espessura das costas', p: ['remada'], ex: ['remada-baixa', 'remada-curvada', 'serrote']},
  {re: /\btrapezios?\b/, m: 'costas', t: 'trapézio', p: ['encolhimento'], verb: 1},
  {re: /\b(lombar|eretores)\b/, m: 'costas', t: 'lombar', ex: ['hiperextensao', 'superman'], verb: 1},
  {re: /\bcabeca longa do biceps\b|\bbiceps (cabeca )?longa\b/, m: 'biceps', t: 'cabeça longa do bíceps', ex: ['rosca-inclinada', 'rosca-arrastada']},
  {re: /\bcabeca curta do biceps\b|\bbiceps (cabeca )?curta\b/, m: 'biceps', t: 'cabeça curta do bíceps', ex: ['rosca-scott', 'rosca-scott-halter', 'rosca-concentrada', 'rosca-spider']},
  {re: /\bbraquial\b|\bbraquiorradial\b/, m: 'biceps', t: 'braquial e braquiorradial', p: ['martelo', 'antebraco-flex']},
  {re: /\bcabeca longa do triceps\b|\btriceps (cabeca )?longa\b/, m: 'triceps', t: 'cabeça longa do tríceps', p: ['triceps-over']},
  {re: /\bcabeca lateral do triceps\b|\btriceps lateral\b/, m: 'triceps', t: 'cabeça lateral do tríceps', p: ['triceps-push']},
  {re: /\bgluteo medio\b|\blateral do (gluteo|quadril|bumbum)\b|\babducao\b|\babdutor(es|a)?\b/, m: 'gluteos', t: 'glúteo médio', ex: ['abducao', 'abducao-elastico', 'monster-walk', 'abducao-deitada', 'ostra']},
  {re: /\bgluteo maximo\b/, m: 'gluteos', t: 'glúteo máximo', ex: ['elevacao-pelvica', 'hip-thrust-halter', 'hip-thrust-maquina', 'ponte', 'coice-cabo']},
  {re: /\breto femoral\b|\bvastos?\b|\bfrente da coxa\b/, m: 'quadriceps', t: 'frente da coxa', p: ['quad-iso'], ex: ['extensora']},
  {re: /\bparte (de tras|posterior) da coxa\b|\bisquio\w*\b/, m: 'posteriores', t: 'posterior de coxa', p: ['flexora', 'hinge']},
  {re: /\bsoleo\b/, m: 'panturrilha', t: 'sóleo', ex: ['pant-sentado']},
  {re: /\bgastrocnemios?\b|\bgemeos\b/, m: 'panturrilha', t: 'gastrocnêmio', ex: ['pant-pe', 'pant-legpress', 'pant-smith']},
  {re: /\b(abdomen|abdominal|abs) inferior\b|\bparte (de baixo|inferior) do abdomen\b|\binfra\b/, m: 'abdomen', t: 'abdômen inferior', p: ['abd-inf']},
  {re: /\bobliquos?\b|\blateral do abdomen\b|\bcintura\b/, m: 'abdomen', t: 'oblíquos', p: ['obliquo']},
  {re: /\b(parte interna da coxa|interno da coxa)\b/, m: 'adutores', t: 'adutores', p: ['adutor']},
];
const obAngCands = a => Object.keys(CAT).filter(k => !CAT[k].hid && ((a.ex || []).includes(k) || (CAT[k].m === a.m && (a.p || []).includes(CAT[k].p))));
/* escolhe o melhor exercício de uma lista: equipamento liberado, fora do treino, sem os de técnica avançada se houver outro */
function obPick(cands, items, ban, o = {}){
  const inW = new Set(items.map(x => x.ex)); const allow = new Set(obAllowedEq(items, ban));
  const rank = k => { const c = CAT[k]; const pi = (o.pri || []).indexOf(k); return (pi >= 0 ? pi : 6) + (o.eq && c.e === o.eq ? 0 : 8) + (o.iso != null && ISO_P.includes(c.p) !== o.iso ? 4 : 0) + (OB_HARD.has(k) ? 60 : 0) + EQ_PREF.indexOf(c.e) * .3; };
  return cands.filter(k => CAT[k] && !inW.has(k) && allow.has(CAT[k].e) && !ban.has(CAT[k].e) && obNeedsOk(k)).sort((a, b) => rank(a) - rank(b))[0] || null;
}
const OB_W_STOP = new Set([...OB_STOP, 'por', 'pelo', 'pela', 'outro', 'outra', 'hoje', 'esse', 'essa', 'este', 'esta', 'aquele', 'tambem', 'colocar', 'coloca', 'incluir', 'inclui', 'adicionar', 'adiciona', 'acrescentar', 'acrescenta', 'ocupado', 'ocupada', 'quebrado', 'quebrada', 'troca', 'substituir', 'substitui', 'mudar', 'muda', 'quero', 'gostaria', 'queria', 'fila', 'lotado', 'lotada', 'tira', 'remove', 'remover']);
const obWords = t => norm(t).split(/[^a-z0-9]+/).filter(w => w.length >= 3 && !OB_W_STOP.has(w));
const obTokHit = (toks, w) => toks.some(t => t === w || (w.length >= 4 && (t.startsWith(w) || w.startsWith(t) && t.length >= 4)));
/* exercícios do treino citados numa frase ("o leg press", "supino") */
function obMatchItems(phrase, items){
  const ws = obWords(phrase).filter(w => !OB_EQ.some(([re]) => re.test(w)) || items.some(x => norm(exName(x.ex)).includes(w))); if (!ws.length) return [];
  const sc = items.map(x => { const toks = norm(exName(x.ex)).split(/[^a-z0-9]+/); return [x, ws.filter(w => obTokHit(toks, w)).length]; });
  const best = Math.max(0, ...sc.map(([, n]) => n)); if (!best || best < Math.min(2, ws.length)) return [];
  return sc.filter(([, n]) => n === best).map(([x]) => x);
}
/* exercício do catálogo pelo nome ("elevação pélvica", "rosca martelo na corda") */
let OB_POP = null; const obPop = () => OB_POP || (OB_POP = new Set(Object.values(SLOTS).flatMap(x => (x.c || []).slice(0, 3))));
function obFindEx(phrase, items = [], ban = new Set()){
  const ws = obWords(phrase); const core = ws.filter(w => !OB_EQ.some(([re]) => re.test(w)) && !OB_MUS.some(([re]) => re.test(w))); if (!core.length) return null; const qeq = (OB_EQ.find(([re]) => re.test(norm(phrase))) || [])[1];
  let best = null, bs = 0; const pop = obPop();
  Object.keys(CAT).forEach(k => { const c = CAT[k]; if (c.hid || ban.has(c.e)) return; const toks = norm(c.n).split(/[^a-z0-9]+/).filter(Boolean);
    const hc = core.filter(w => obTokHit(toks, w)).length; if (!hc) return; const ha = ws.filter(w => obTokHit(toks, w)).length;
    const sc = hc * 10 + ha * 3 + (qeq && c.e === qeq ? 8 : 0) - toks.length * .4 - (OB_HARD.has(k) ? 2 : 0) - (items.some(x => x.ex === k) ? 5 : 0) + (pop.has(k) ? 2 : 0);
    if (hc >= Math.min(2, core.length) && sc > bs){ bs = sc; best = k; } });
  return best;
}
/* onde entra um exercício novo: composto depois do último composto, isolado antes do abdômen */
function obInsertAt(items, k){
  const iso = ISO_P.includes(CAT[k].p); if (!iso){ const lc = items.map(x => ISO_P.includes((getEx(x.ex) || {}).p)).lastIndexOf(false); return lc + 1; }
  const ab = items.findIndex(x => (getEx(x.ex) || {}).m === 'abdomen'); return ab >= 0 ? ab : items.length;
}
const OB_NUM = {um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6};
const obNum = v => OB_NUM[v] || +v;
function obFitTime(items, mins){
  const w = {items}; let guard = 40; const iso = x => ISO_P.includes((getEx(x.ex) || {}).p);
  const log = [];
  while (wMins(w) > mins && guard--){
    const cand = items.map((x, j) => [x, j]).filter(([x]) => x.sets > (x._done ? 0 : 2) && !x._f).sort((a, b) => (iso(b[0]) - iso(a[0])) || (b[1] - a[1]))[0];
    if (cand){ cand[0].sets--; const tt = (cand[0]._done || 0) + cand[0].sets; log.push(`${exName(cand[0].ex)}: ${tt + 1} → ${tt} ${tt === 1 ? 'série' : 'séries'}`); continue; }
    const free = items.map((x, j) => [x, j]).filter(([x]) => !x._done && x.sets > 0); const drop = free.filter(([x]) => iso(x) && !x._f).pop() || (free.length > 3 ? free[free.length - 1] : null);
    if (!drop) break; items.splice(drop[1], 1); log.push(`Sai ${exName(drop[0].ex)}`);
  }
  return log;
}
/* lê o texto e devolve as regras reconhecidas, cada uma com o que muda; off = índices desligados na prévia */
/* opts.program: leitura para um programa inteiro (assistente). Foco em músculo só mexe nos treinos que já trabalham aquele músculo. */
function obInterpret(text, w0, off = new Set(), opts = {}){
  let items = w0.items.map(x => ({...x})); const rules = [], flags = [], notes = [];
  const ban = new Set(); let fitTo = null; let wset = {}; OB_CTX.plus = new Set(); const S = !!opts.session; const lockd = x => S && x._done > 0; const tot = x => (x._done || 0) + x.sets; const used = new Set();
  const FILL = /\b(por favor|pfv|pf|obrigad[oa]|valeu|ok|blz|beleza)\b/g;
  const clauses = norm(text).replace(/\s+e\s+(?=(nao|sem|mais|quero|prefiro|tenho|tirar|trocar|foco|focar|priorizar|descanso|estou|odeio|evitar)\b)/g, ';').split(/[\n.;!?]+|,|\bmas\b/).map(c => c.replace(FILL, '').trim()).filter(c => c.length > 2);
  const push = (title, fn) => { const i = rules.length; const before = items.map(x => ({...x})); const bw = {...wset}; const log = fn(); if (!log || !log.length){ items = before; wset = bw; return false; } if (off.has(i)){ items = before; wset = bw; } rules.push({title, log, on: !off.has(i)}); return true; };
  // 0) "só halteres", "apenas peso do corpo", "em casa": libera só esses equipamentos
  let wl = null; let wlHome = false; OB_CTX.home = false;
  clauses.forEach((c, ci) => { const m = c.match(/\b(so|apenas|somente|unicamente)\b/); const home = /\b(em casa|no hotel|em viagem|no quarto)\b/.test(c);
    if (!m && !home) return; const eqs = OB_EQ.filter(([re]) => re.test(m ? c.slice(m.index) : c)).map(([, e]) => e);
    if (!eqs.length && !home) return; if (!eqs.length) wlHome = true; wl = new Set([...(wl || []), ...(eqs.length ? eqs : ['casa']), 'peso', 'casa']); used.add(ci); });
  OB_CTX.home = wlHome; const wlMain = wl && [...wl].find(e => e !== 'peso' && e !== 'casa');
  if (wl){ Object.keys(EQUIP).forEach(e => { if (!wl.has(e)) ban.add(e); }); wl.forEach(e => OB_CTX.plus.add(e)); }
  const wlBan = new Set(ban);
  if (wl) push(wlHome && !wlMain ? 'Em casa: peso do corpo e objetos da casa' : `Só com ${[...wl].filter(e => e !== 'casa').map(e => EQUIP[e].toLowerCase()).join(' e ')}`, () => { const log = []; items.forEach((x, j) => { const e = getEx(x.ex); if (!e || !ban.has(e.e)) return;
    if (lockd(x)){ log.push(`${exName(x.ex)}: já começou, ficou como está`); return; } const alt = obAlt(x.ex, items, ban, wlMain); if (alt){ log.push(`${exName(x.ex)} → ${exName(alt)}`); items[j] = {...x, ex: alt}; } else log.push(`${exName(x.ex)}: sem substituto com esse equipamento, ficou como está`); }); return log; });
  // 1) primeiro as restrições de equipamento, para as outras regras já respeitarem
  OB_CTX.pref = {};
  clauses.forEach(c => { if (!OB_NEG.test(c)) return; const [lhs, rhs] = c.split(/\s(?:por|pelo|pela)\s/); const exWords = lhs.split(/[^a-z0-9]+/).filter(w => obVocab().has(w) && !OB_EQ.some(([re]) => re.test(w)) && !OB_MUS.some(([re]) => re.test(w)));
    if (exWords.length) return; const pf = rhs && (OB_EQ.find(([re]) => re.test(rhs)) || [])[1]; OB_EQ.forEach(([re, eq]) => { if (re.test(lhs)){ ban.add(eq); if (pf && pf !== eq) OB_CTX.pref[eq] = pf; } }); });
  ban.forEach(eq => !wlBan.has(eq) && push(`Sem ${EQUIP[eq].toLowerCase()}`, () => { const log = []; items.forEach((x, j) => { const e = getEx(x.ex); if (!e || e.e !== eq) return; if (lockd(x)){ log.push(`${exName(x.ex)}: já começou, ficou como está`); return; } const alt = obAlt(x.ex, items, ban, OB_CTX.pref[eq]); if (alt){ log.push(`${exName(x.ex)} → ${exName(alt)}`); items[j] = {...x, ex: alt}; } else log.push(`${exName(x.ex)}: sem substituto com o equipamento disponível, ficou como está`); }); return log; }));
  clauses.forEach((c, ci) => {
    let hit = used.has(ci); const mus = [...new Set(OB_MUS.filter(([re]) => re.test(c)).flatMap(([, m]) => m))];
    const eqs = OB_EQ.filter(([re]) => re.test(c)).map(([, e]) => e); const neg = OB_NEG.test(c);
    // dor: só sinaliza, não troca sozinho
    if (/\b(dor|doi|doendo|lesao|lesion\w*|machuc\w*|incomod\w*|tendinite|bursite)\b/.test(c)){
      OB_JOINT.forEach(([re, nome, test]) => { if (!re.test(c)) return; const list = items.filter(x => getEx(x.ex) && test(getEx(x.ex))).map(x => exName(x.ex));
        flags.push({title: `Dor no ${nome}`, joint: nome, list, text: list.length ? `Os exercícios deste treino que costumam exigir mais do ${nome}: ${list.join(', ')}. Com dor, o ajuste certo depende de avaliação: fale com um fisioterapeuta ou médico antes de mudar a carga. Você pode trocar cada um em Editar.` : `Nenhum exercício deste treino costuma exigir muito do ${nome}, mas com dor vale falar com um fisioterapeuta ou médico.`}); hit = true; });
      if (hit) return;
    }
    // descanso com valor: entre séries (todos os exercícios) ou entre um exercício e o próximo
    const isRest = /\b(descans\w*|intervalo|pausa|emend\w*)\b/.test(c) || (/\bentre (as |os |um |cada )?(series|exercicios?|aparelhos?)\b/.test(c) && obRestVal(c) != null);
    if (isRest){
      const exScope = /\bentre (os |um |cada )?(exercicios?|aparelhos?|maquinas?)\b|troca de (exercicio|aparelho)|de um exercicio (pro|para o|pra) (outro|proximo)|(depois|no fim|ao fim|ao terminar) (de )?(cada )?exercicio|emend\w*/.test(c);
      const v = obRestVal(c); const none = /\bsem (descanso|intervalo|pausa)\b|\bemend\w*/.test(c);
      const up = /\b(maior|mais longo|longo|mais descanso|descansar mais|aumentar)\b/.test(c), dn = /\b(menor|mais curto|curto|menos descanso|descansar menos|diminuir|reduzir)\b/.test(c);
      if (exScope){
        const base = w0.restEx != null ? w0.restEx : Math.round(items.reduce((a, x) => a + (x.rest || 60), 0) / Math.max(1, items.length));
        const nv = none ? 0 : v != null ? v : up ? Math.min(600, base + 30) : dn ? Math.max(0, base - 30) : null;
        if (nv != null){ hit = push(nv ? `Descanso entre exercícios: ${fmtRest(nv)}` : 'Sem pausa extra entre exercícios', () => { if (w0.restEx === nv) return []; wset.restEx = nv; return [`Ao terminar um exercício: ${w0.restEx != null ? fmtRest(w0.restEx) : 'mesmo descanso das séries'} → ${nv ? fmtRest(nv) : 'segue direto para o próximo'}`]; }) || hit; if (hit) return; }
      } else if (v != null || none){
        const nv = none ? 0 : v;
        hit = push(nv ? `Descanso entre séries: ${fmtRest(nv)}` : 'Sem descanso entre séries', () => items.map((x, j) => { if (x.rest === nv) return null; const l = `${exName(x.ex)}: ${fmtRest(x.rest || 0)} → ${fmtRest(nv)}`; items[j] = {...x, rest: nv}; return l; }).filter(Boolean)) || hit;
        if (hit) return;
      }
    }
    // tempo disponível
    const hh = c.match(/\b(\d)\s*(?:h|horas?)(?![a-z])(?:\s*e?\s*(\d{1,2})(?!\d))?/); const hw = c.match(/\b(uma|meia) hora\b/); const mm = hh ? [0, String(+hh[1] * 60 + (+hh[2] || 0))] : hw ? [0, hw[1] === 'meia' ? '30' : '60'] : c.match(/(\d{2,3})\s*(min|minutos|m\b)/); const short = /\b(mais curto|mais rapido|pouco tempo|menos tempo|treino curto|corrido|pressa)\b/.test(c);
    if ((mm || short) && !isRest){ fitTo = mm ? +mm[1] : 'short'; hit = true; }
    // estilo
    const style = /\b(forca|pesad\w*|carga alta|mais carga|poucas rep\w*)\b/.test(c) ? 'forca' : /\b(resistencia|definicao|definir|queimar|muitas rep\w*|reps altas)\b/.test(c) ? 'res' : /\b(hipertrofia|ganhar massa|crescer)\b/.test(c) ? 'hip' : '';
    if (style){ const S = {forca: ['mais força', 4, 6, 180, 2, 1], res: ['mais resistência', 12, 15, 60, 15, 20], hip: ['hipertrofia', 8, 12, 90, 10, 15]}[style];
      hit = push(`Estilo: ${S[0]}`, () => { const log = []; items.forEach((x, j) => { const iso = ISO_P.includes((getEx(x.ex) || {}).p); const n = iso ? (style === 'forca' ? {...x, rmin: 8, rmax: 12, rest: 90} : {...x, rmin: S[4], rmax: S[5], rest: style === 'res' ? 45 : 60}) : {...x, rmin: S[1], rmax: S[2], rest: S[3]};
        if (n.rmin !== x.rmin || n.rmax !== x.rmax || n.rest !== x.rest){ log.push(`${exName(x.ex)}: ${x.rmin}–${x.rmax} → ${n.rmin}–${n.rmax} reps, descanso ${fmtRest(n.rest)}`); items[j] = n; } }); return log; }) || hit; }
    // descanso
    const restUp = /\b(descanso (maior|mais longo|longo)|descansar mais|mais descanso)\b/.test(c), restDn = /\b(descanso (menor|mais curto|curto)|descansar menos|menos descanso)\b/.test(c);
    if (restUp || restDn) hit = push(restUp ? 'Descanso maior' : 'Descanso menor', () => items.map((x, j) => { const r = Math.max(30, Math.min(300, (x.rest || 60) + (restUp ? 30 : -30))); if (r === x.rest) return null; items[j] = {...x, rest: r}; return `${exName(x.ex)}: ${fmtRest(x.rest || 60)} → ${fmtRest(r)}`; }).filter(Boolean)) || hit;
    if (hit && used.has(ci)) return;
    // v4.25: "trocar X por Y" (Y = equipamento, outro exercício ou um ângulo)
    const sw = c.match(/\b(?:troc\w*|substitu\w*|mud\w*)\s+(?:o |a |os |as )?(.+?)\s+(?:por|pelo|pela|pra|para)\s+(?:o |a |um |uma )?(.+)$/);
    if (sw){ const tg = obMatchItems(sw[1], items); const rhs = sw[2];
      if (tg.length){ const eq = (OB_EQ.find(([re]) => re.test(rhs)) || [])[1]; const ang = OB_ANG.find(a => a.re.test(rhs)); const named = obFindEx(rhs, items, ban);
        hit = push(`Trocar ${exName(tg[0].ex).toLowerCase()}`, () => { const log = []; tg.forEach(t => { const j = items.findIndex(x => x.uid === t.uid && x.ex === t.ex); if (j < 0) return;
          if (lockd(t)){ log.push(`${exName(t.ex)}: já começou, ficou como está`); return; }
          let alt = null; const e = getEx(t.ex);
          if (named && named !== t.ex && !items.some(x => x.ex === named)) alt = named;
          else if (ang) alt = obPick(obAngCands(ang), items, ban, {pri: ang.ex, eq: e.e, iso: ISO_P.includes(e.p)});
          else if (eq){ const a = obAlt(t.ex, items, ban, eq); alt = a && CAT[a].e === eq ? a : null; }
          else alt = obAlt(t.ex, items, ban);
          if (alt){ items[j] = {...t, ex: alt}; log.push(`${exName(t.ex)} → ${exName(alt)}`); }
          else flags.push({title: `Sem troca para ${exName(t.ex)}`, text: eq ? `Não achei no catálogo uma versão com ${EQUIP[eq].toLowerCase()} deste movimento.` : 'Não achei um exercício equivalente com o equipamento disponível.'}); }); return log; }) || hit;
        if (hit || flags.length) return; }
      else { flags.push({title: 'Não achei esse exercício', text: `Não encontrei “${sw[1]}” neste treino. Confira o nome como aparece na lista.`}); return; } }
    // v4.25: foco num ângulo ou porção do músculo ("peito superior", "deltoide lateral", "glúteo médio")
    const angs = neg ? [] : OB_ANG.filter(a => a.re.test(c) && (!a.verb || OB_FOCUS.test(c)));
    if (angs.length){ angs.forEach(a => { hit = push(`Foco em ${a.t}`, () => { const log = [];
        if (opts.program && !items.some(x => (getEx(x.ex) || {}).m === a.m)) return log;
        const has = items.filter(x => { const e = getEx(x.ex); return e && ((a.ex || []).includes(x.ex) || (e.m === a.m && (a.p || []).includes(e.p))); });
        if (has.length){ has.slice(0, 2).forEach(x => { if (tot(x) < 5){ x.sets++; x._f = 1; log.push(`${exName(x.ex)}: ${tot(x) - 1} → ${tot(x)} séries`); } }); if (!log.length) flags.push({title: `Já há foco em ${a.t}`, text: `${has.map(x => exName(x.ex)).join(', ')} já trabalha essa parte, com o máximo de séries que o app sugere.`}); return log; }
        const same = items.filter(x => (getEx(x.ex) || {}).m === a.m && !lockd(x));
        if (same.length >= 2){ const t = same[same.length - 1]; const te = getEx(t.ex); const k = obPick(obAngCands(a), items, ban, {pri: a.ex, eq: te.e, iso: ISO_P.includes(te.p)}); if (!k) return log;
          const j = items.findIndex(x => x.uid === t.uid && x.ex === t.ex); items[j] = {...t, ex: k, _f: 1}; log.push(`${exName(t.ex)} → ${exName(k)}`); return log; }
        const k = obPick(obAngCands(a), items, ban, {pri: a.ex}); if (!k) return log;
        const it = {...newItem(k), sets: 3, _f: 1, _new: 1}; const lm = items.map(x => (getEx(x.ex) || {}).m).lastIndexOf(a.m); items.splice(lm >= 0 ? lm + 1 : obInsertAt(items, k), 0, it); log.push(`Entra ${exName(k)} (3 × ${it.rmin}–${it.rmax})`);
        return log; }) || hit; });
      if (hit) return; }
    // v4.25: séries em todos os exercícios, a mais ou a menos
    const same = t => { flags.push({title: t, text: 'Já está assim neste treino, nada a mudar.'}); return true; };
    const scope = mus.length ? items.filter(x => mus.includes((getEx(x.ex) || {}).m)) : items;
    const sx = c.match(/\b(\d)\s*x\s*(\d{1,2})(?:\s*(?:a|-)\s*(\d{1,2}))?\b/);
    if (sx){ const n = +sx[1], a = +sx[2], b = +(sx[3] || sx[2]); hit = push(`${n} × ${a === b ? a : a + '–' + b}${mus.length ? ' em ' + mus.map(m => MUSC[m].toLowerCase()).join(' e ') : ' em cada exercício'}`, () => scope.map(x => { const r = S ? Math.max(0, n - (x._done || 0)) : n; if (r === x.sets && x.rmin === a && x.rmax === b) return null; const l = `${exName(x.ex)}: ${tot(x)} × ${x.rmin}–${x.rmax} → ${n} × ${a === b ? a : a + '–' + b}`; x.sets = r; x.rmin = Math.min(a, b); x.rmax = Math.max(a, b); x._f = 1; return l; }).filter(Boolean)) || same('Já está assim') || hit; return; }
    const nS = c.match(/\b(\d|uma|duas|tres|quatro|cinco|seis)\s+series\b/);
    if (nS && (/\b(tudo|todos|todas|cada|por exercicio|geral|todo o treino)\b/.test(c) || mus.length) && !/\b(a mais|a menos|mais|menos)\b/.test(c)){ const n = Math.max(1, Math.min(8, obNum(nS[1])));
      hit = push(`${n} ${n === 1 ? 'série' : 'séries'} ${mus.length ? 'em ' + mus.map(m => MUSC[m].toLowerCase()).join(' e ') : 'em cada exercício'}`, () => scope.map(x => { const r = S ? Math.max(0, n - (x._done || 0)) : n; if (r === x.sets) return null; const l = `${exName(x.ex)}: ${tot(x)} → ${(x._done || 0) + r} séries`; x.sets = r; x._f = 1; return l; }).filter(Boolean)) || same(`Já tem ${n} ${n === 1 ? 'série' : 'séries'}`) || hit; if (hit) return; }
    const fewer = /\b(uma serie a menos|menos uma serie|tirar uma serie|tira uma serie|menos series|reduzir (as )?series|diminuir (as )?series|reduz\w* (o )?volume|diminu\w* (o )?volume|menos volume)\b/.test(c);
    const more = !mus.length && /\b(uma serie a mais|mais uma serie|mais series|aumentar (as )?series|mais volume|aument\w* (o )?volume|treino mais longo|mais completo|tenho mais tempo|tempo sobrando)\b/.test(c);
    if (fewer){ hit = push(mus.length ? `Uma série a menos em ${mus.map(m => MUSC[m].toLowerCase()).join(' e ')}` : 'Uma série a menos em cada exercício', () => scope.map(x => { const lo = S ? (x._done ? 0 : 1) : 1; if (x.sets <= lo) return null; x.sets--; x._f = 1; return `${exName(x.ex)}: ${tot(x) + 1} → ${tot(x)} séries`; }).filter(Boolean)) || hit; if (hit) return; }
    if (more){ hit = push('Mais volume', () => items.filter(x => !ISO_P.includes((getEx(x.ex) || {}).p) || items.length <= 3).map(x => { if (tot(x) >= 5) return null; x.sets++; x._f = 1; return `${exName(x.ex)}: ${tot(x) - 1} → ${tot(x)} séries`; }).filter(Boolean)) || hit; if (hit) return; }
    // v4.25: repetições ("10 a 12 repetições", "15 reps")
    const rr = c.match(/\b(\d{1,2})\s*(?:a|ate|-|e)\s*(\d{1,2})\s*(?:rep\w*|repeticoes)\b/) || c.match(/\b(\d{1,2})\s*(?:rep\w*|repeticoes)\b/);
    if (rr){ let a = Math.max(1, Math.min(30, +rr[1])), b = Math.max(1, Math.min(30, +(rr[2] || rr[1]))); if (a > b) [a, b] = [b, a];
      hit = push(`${a === b ? a : a + ' a ' + b} repetições${mus.length ? ' em ' + mus.map(m => MUSC[m].toLowerCase()).join(' e ') : ''}`, () => scope.map(x => { if (x.rmin === a && x.rmax === b) return null; const l = `${exName(x.ex)}: ${x.rmin}–${x.rmax} → ${a === b ? a : a + '–' + b} reps`; x.rmin = a; x.rmax = b; return l; }).filter(Boolean)) || same(`Já está em ${a === b ? a : a + ' a ' + b} repetições`) || hit; if (hit) return; }
    // v4.25: dia mais leve
    if (/\b(treino leve|mais leve|pegar leve|leve hoje|cansad\w*|exaust\w*|sem energia|pouca energia|dormi mal|indispost\w*|deload|recuperacao|moid\w*|sem pique|sem disposicao)\b/.test(c)){
      hit = push('Treino mais leve hoje', () => items.map(x => { if (tot(x) <= 2 || x.sets < 1) return null; x.sets--; x._f = 1; return `${exName(x.ex)}: ${tot(x) + 1} → ${tot(x)} séries`; }).filter(Boolean)) || hit;
      if (hit) flags.push({title: 'Dia mais leve', text: 'Tirei uma série dos exercícios com 3 ou mais. Se fizer sentido, use cargas um pouco menores e pare antes da falha.'});
      if (hit) return; }
    // v4.25: incluir um exercício pelo nome ("adicionar elevação pélvica")
    if (!neg && /\b(adicion\w*|inclu\w*|acrescent\w*|coloc\w*|quero fazer|fazer tambem|botar)\b/.test(c)){ const k = obFindEx(c, items, ban);
      if (k && !items.some(x => x.ex === k)){ hit = push(`Incluir ${exName(k).toLowerCase()}`, () => { const it = {...newItem(k), sets: 3, _f: 1, _new: 1}; items.splice(obInsertAt(items, k), 0, it); return [`Entra ${exName(k)} (3 × ${it.rmin}–${it.rmax})`]; }) || hit; if (hit) return; } }
    // tirar ou trocar um exercício específico
    const words = c.split(/[^a-z0-9]+/).filter(w => obVocab().has(w) && !OB_MUS.some(([re]) => re.test(w)));
    if (neg && words.length && words.some(w => !OB_EQ.some(([re]) => re.test(w)))){
      const tg = items.filter(x => { const n = norm(exName(x.ex)); return words.every(w => n.includes(w)); });
      if (tg.length){ const remove = /\b(tir\w*|remov\w*)\b/.test(c);
        hit = push(remove ? `Tirar ${exName(tg[0].ex).toLowerCase()}` : `Trocar ${exName(tg[0].ex).toLowerCase()}`, () => { const log = []; tg.forEach(t => { const j = items.findIndex(x => x.uid === t.uid && x.ex === t.ex); if (j < 0) return;
          if (lockd(t)){ log.push(`${exName(t.ex)}: já começou, ficou como está`); return; }
          if (remove){ items.splice(j, 1); log.push(`Sai ${exName(t.ex)}`); return; }
          const alt = obAlt(t.ex, items, ban, ban.has(getEx(t.ex).e) ? null : getEx(t.ex).e); if (alt){ items[j] = {...items[j], ex: alt}; log.push(`${exName(t.ex)} → ${exName(alt)}`); } }); return log; }) || hit; }
    } else if (eqs.length && !neg && /\b(prefir\w*|mais|usar|quero|gosto|priorizar)\b/.test(c)){
      // preferir um equipamento: troca até 2 exercícios que têm versão com ele
      const pref = eqs[0]; hit = push(`Mais exercícios com ${EQUIP[pref].toLowerCase()}`, () => { const log = []; for (let j = 0; j < items.length && log.length < 2; j++){ const e = getEx(items[j].ex); if (!e || e.e === pref) continue; const alt = Object.keys(CAT).find(k => CAT[k].p === e.p && CAT[k].e === pref && !items.some(x => x.ex === k)); if (alt){ log.push(`${exName(items[j].ex)} → ${exName(alt)}`); items[j] = {...items[j], ex: alt}; } } return log; }) || hit;
    }
    // foco em músculo: uma série a mais nos exercícios dele; se pedir exercício a mais, ou se o treino não tiver nenhum, inclui um
    if (mus.length && !neg && /\b(mais|foco|focar|priori\w*|enfase|enfatizar|reforc\w*|caprich\w*|fraco|atrasad\w*|desenvolver|crescer|atencao|incluir|adicion\w*|acrescent\w*)\b/.test(c)){
      const wantEx = /\b(exercicios?|outro|incluir|adicion\w*|acrescent\w*)\b/.test(c);
      mus.forEach(m => { hit = push(`Mais ${MUSC[m].toLowerCase()}`, () => { const log = []; const mine = items.filter(x => (getEx(x.ex) || {}).m === m); if (opts.program && !mine.length) return log;
        if (wantEx || !mine.length){ const k = obAddFor(m, items, ban); if (k){ const it = {...newItem(k), sets: 3, _f: 1, _new: 1}; const iso = ISO_P.includes(CAT[k].p); const lastComp = items.map(x => ISO_P.includes((getEx(x.ex) || {}).p)).lastIndexOf(false);
            const at = iso ? (items.findIndex(x => ['abdomen'].includes((getEx(x.ex) || {}).m)) + 1 || items.length + 1) - 1 : lastComp + 1; items.splice(Math.max(0, at), 0, it); log.push(`Entra ${exName(k)} (3 × ${it.rmin}–${it.rmax})`); } }
        if (!wantEx) mine.slice(0, 2).forEach(x => { if (tot(x) < 5){ x.sets++; x._f = 1; log.push(`${exName(x.ex)}: ${tot(x) - 1} → ${tot(x)} séries`); } });
        return log; }) || hit; });
    }
    if (!hit && !(neg && eqs.length)){ const nt = norm(text.normalize('NFC')); const at = nt.indexOf(c); notes.push(at >= 0 ? text.normalize('NFC').substr(at, c.length) : c); }
  });
  // o tempo vem por último, para caber depois das outras mudanças (sem desfazer o foco pedido)
  if (fitTo){ const base = S ? 6 : 0; const est = () => wMins({items}) - base; const tgt = fitTo === 'short' ? Math.round(est() * .75) : fitTo; const min = S ? 5 : 15;
    if (tgt >= min && tgt < est()) push(S ? `Terminar em até ${tgt} minutos` : `Treino em até ${tgt} minutos`, () => obFitTime(items, tgt + base));
    else if (tgt >= min) flags.push({title: `Cabe em ${tgt} minutos`, text: S ? `Pela estimativa do app, o que falta leva cerca de ${est()} minutos.` : `Pela estimativa do app, este treino já leva cerca de ${est()} minutos.`}); }
  return {rules, flags, notes, items, wset};
}
/* valor de descanso em segundos: "90 s", "2 min", "1:30", "minuto e meio", "dois minutos", "descanso 60" */
function obRestVal(c){
  const cl = v => Math.max(10, Math.min(600, Math.round(v / 5) * 5)); let m;
  if ((m = c.match(/\b(\d{1,2}):(\d{2})\b/))) return cl(+m[1] * 60 + +m[2]);
  if ((m = c.match(/(\d+(?:[.,]\d+)?)\s*(s|seg|segs|segundos?)\b/))) return cl(parseFloat(m[1].replace(',', '.')));
  if (/\b(1|um) minuto e meio\b|\b1[.,]5 ?min/.test(c)) return 90;
  if ((m = c.match(/\b(\d|dois|duas|tres|quatro|cinco) minutos? e meio\b/))) return cl((({dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5})[m[1]] || +m[1]) * 60 + 30);
  if (/\bmeio minuto\b/.test(c)) return 30;
  if ((m = c.match(/(\d+(?:[.,]\d+)?)\s*(min|mins|minutos?|m)\b/))) return cl(parseFloat(m[1].replace(',', '.')) * 60);
  if ((m = c.match(/\b(um|dois|duas|tres|quatro|cinco)\s+minutos?\b/))) return cl(({um: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5})[m[1]] * 60);
  if ((m = c.match(/\b(\d{2,3})\b/)) && +m[1] >= 15 && +m[1] <= 300) return cl(+m[1]);
  return null;
}

/* ---------- interface ---------- */
function obsCard(r, w, ed = false){
  return `<section class="card stack ob-card"><div class="row between"><span class="eyebrow">Observações e preferências</span>${w.obs ? `<span class="tiny muted">${w.obsAt ? 'ajustado ' + relDay(w.obsAt).toLowerCase() : 'salvo'}</span>` : ''}</div>
    <textarea id="wobs" class="field ob-ta" rows="3" maxlength="400" placeholder="Ex.: sem polia · mais foco em glúteo · tenho 45 minutos · descanso de 90 s · 2 min entre exercícios" data-act="wobs" data-rid="${r.id}" data-wid="${w.id}">${esc(w.obs || '')}</textarea>
    <div class="row between" style="gap:10px"><span class="tiny muted grow">${ed ? 'Escreva o que quer mudar. O app sugere ajustes pequenos, você confere e eles ficam salvos neste treino.' : 'O app lê a anotação e sugere ajustes pequenos. Você confere antes de aplicar, e eles ficam salvos no treino.'}</span><button class="btn sm primary" data-act="obs-run" data-rid="${r.id}" data-wid="${w.id}">Ajustar treino</button></div></section>`;
}
function openObsSheet(rid, wid){
  const r = routineById(rid); const w = r && r.workouts.find(x => x.id === wid); if (!w) return;
  const off = (UI.sheet && UI.sheet.kind === 'obs' && UI.sheet.wid === wid) ? UI.sheet.off : new Set();
  const res = obInterpret(w.obs || '', w, off); UI.sheet = {kind: 'obs', rid, wid, off, res};
  const on = res.rules.filter(x => x.on).length;
  openSheet(`${sheetHead(w.nome, 'O que entendi')}
    ${res.rules.length ? `<div class="ob-list">${res.rules.map((x, i) => `<button class="ob-rule" data-act="obs-tog" data-i="${i}" aria-pressed="${x.on}"><i class="tick">${I.check}</i><span class="grow"><b>${esc(x.title)}</b>${x.log.map(l => `<span>${esc(l)}</span>`).join('')}</span></button>`).join('')}</div>` : ''}
    ${res.flags.map(f => `<div class="ob-flag"><b>${esc(f.title)}</b><p>${esc(f.text)}</p></div>`).join('')}
    ${res.notes.length ? `<div class="ob-notes"><span class="eyebrow">Guardado como lembrete</span>${res.notes.map(n => `<p>“${esc(n)}”</p>`).join('')}<p class="tiny muted">Não reconheci um ajuste nessas frases. Elas aparecem no começo do treino para você lembrar.</p></div>` : ''}
    ${!res.rules.length && !res.flags.length && !res.notes.length ? '<p class="ink2" style="margin:14px 0 0">Escreva uma observação para o app sugerir ajustes.</p>' : ''}
    <div class="stack" style="margin-top:18px">${on ? `<button class="btn primary block" data-act="obs-apply">Aplicar ${on} ${on === 1 ? 'ajuste' : 'ajustes'}</button>` : ''}<button class="btn ghost block" data-act="close">${on ? 'Agora não' : 'Fechar'}</button></div>`);
}
A.wobs = el => { const r = routineById(el.dataset.rid); const w = r && r.workouts.find(x => x.id === el.dataset.wid); if (!w) return; const v = el.value.trim().slice(0, 400); if ((w.obs || '') === v) return; if (v) w.obs = v; else delete w.obs; saveState(); };
A['obs-run'] = el => { const t = $('#wobs'); if (t) A.wobs(t); UI.sheet = null; openObsSheet(el.dataset.rid, el.dataset.wid); };
A['obs-tog'] = el => { const sh = UI.sheet; const i = +el.dataset.i; if (sh.off.has(i)) sh.off.delete(i); else sh.off.add(i); openObsSheet(sh.rid, sh.wid); };
A['obs-apply'] = () => { const sh = UI.sheet; const r = routineById(sh.rid); const w = r && r.workouts.find(x => x.id === sh.wid); if (!w) return;
  const before = w.items.map(x => ({...x})); const bEx = w.restEx; w.items = sh.res.items.map(x => { const y = {...x, uid: x.uid || uid('i')}; delete y._f; return y; });
  if ('restEx' in (sh.res.wset || {})) w.restEx = sh.res.wset.restEx;
  w.obsAt = today(); saveState(); closeSheet(); render(); Platform.haptic('success');
  toast('Treino ajustado', () => { w.items = before; if (bEx === undefined) delete w.restEx; else w.restEx = bEx; saveState(); render(); }); };
document.addEventListener('change', ev => { if (ev.target && ev.target.id === 'wobs') A.wobs(ev.target); });
/* lembrete na sessão: as frases que não viraram ajuste */
function obsReminder(s){
  if (!s || !s.routine) return ''; const r = routineById(s.routine); const w = r && r.workouts.find(x => x.id === s.workout); if (!w || !w.obs) return '';
  const notes = obInterpret(w.obs, w).notes; if (!notes.length) return '';
  return `<div class="ob-remind">${I.note}<span>${notes.map(esc).join(' · ')}</span></div>`;
}

/* ================= Ajuste rápido (v4.25) =================
   Um campo só para pedir mudanças: na rotina (fica salvo) ou no treino em andamento (só hoje).
   Usa a mesma leitura das observações, com prévia ao vivo e cada ajuste ligável/desligável. */
const I_SPARK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9z"/><path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/></svg>';
/* sessão → itens no formato do plano: sets = séries que faltam, _done = já confirmadas */
function sessToPlan(s){ return s.items.map(e => { const t = itemTarget(s, e); const ws = e.sets.filter(x => x.t !== 'w'); const done = ws.filter(x => x.ok).length;
  return {uid: e.uid, ex: e.ex, sets: ws.length - done, _done: done, rmin: t.rmin, rmax: t.rmax, rest: t.rest, nota: ''}; }); }
function applyToSession(s, res){
  const old = new Map(s.items.map(e => [e.uid, e])); const out = [];
  res.items.forEach(x => { const e = !x._new && old.get(x.uid);
    if (!e){ if (x.sets > 0) out.push({uid: uid('x'), ex: x.ex, sets: prefillSets(x.ex, x.sets, s.id), rmin: x.rmin, rmax: x.rmax, rest: x.rest}); return; }
    old.delete(x.uid);
    if (x.ex !== e.ex && !e.sets.some(y => y.ok)){ e.ex = x.ex; const n = e.sets.filter(y => y.t !== 'w').length; e.sets = prefillSets(e.ex, n, s.id); }
    const pend = () => e.sets.filter(y => y.t !== 'w' && !y.ok); let d = x.sets - pend().length;
    for (; d > 0; d--){ const l = e.sets[e.sets.length - 1]; e.sets.push({kg: l ? l.kg : null, reps: l ? l.reps : null, ok: false, t: 'n', km: false, rm: false}); }
    for (; d < 0; d++){ const p = pend(); const y = p[p.length - 1]; if (!y) break; e.sets.splice(e.sets.lastIndexOf(y), 1); }
    const t = itemTarget(s, e); if (x.rest != null && x.rest !== t.rest) e.rest = x.rest; if (x.rmin !== t.rmin || x.rmax !== t.rmax){ e.rmin = x.rmin; e.rmax = x.rmax; }
    if (e.sets.length) out.push(e); });
  old.forEach(e => { if (e.sets.some(y => y.ok)) out.push(e); });
  s.items = out; if (res.wset && 'restEx' in res.wset) s.restEx = res.wset.restEx;
}
function adjCtx(){ const sh = UI.sheet; if (!sh || sh.kind !== 'adj') return null;
  if (sh.mode === 'session'){ const s = SESS.find(x => x.id === sh.sid); if (!s) return null; const wk = s.routine ? findWorkout(s.routine, s.workout) : null;
    return {s, w0: {items: sessToPlan(s), restEx: s.restEx != null ? s.restEx : wk && wk.restEx}, name: s.wname}; }
  const r = routineById(sh.rid); const w = r && r.workouts.find(x => x.id === sh.wid); return w ? {r, w, w0: w, name: w.nome} : null; }
function adjChips(items, S){
  const ms = new Set(items.map(x => (getEx(x.ex) || {}).m)); const c = [S ? 'Só tenho mais 20 minutos' : 'Tenho 45 minutos', 'Treino mais leve hoje'];
  [['peito', 'Mais peito superior'], ['costas', 'Mais largura nas costas'], ['ombros', 'Mais deltoide lateral'], ['gluteos', 'Mais glúteo médio'], ['biceps', 'Mais cabeça longa do bíceps'], ['triceps', 'Mais cabeça longa do tríceps'], ['posteriores', 'Mais posterior de coxa'], ['quadriceps', 'Mais frente da coxa']].forEach(([m, t]) => { if (ms.has(m)) c.push(t); });
  c.push(S ? 'Só halteres hoje' : 'Só halteres', 'Sem máquinas', 'Uma série a menos em tudo', '3 séries em tudo');
  return [...new Set(c)].slice(0, 10);
}
function openAdjust(o){
  UI.sheet = {kind: 'adj', off: new Set(), text: '', ...o}; const cx = adjCtx(); if (!cx) return;
  const S = o.mode === 'session';
  openSheet(`${sheetHead(cx.name, S ? 'Ajustar o treino de hoje' : 'Ajustar este treino')}
    <p class="ink2 adj-lead">${S ? 'Diga o que mudou hoje. O que você já fez fica como está.' : 'Diga o que quer mudar. Você confere antes de aplicar.'}</p>
    <div class="adj-box">${I_SPARK}<textarea id="adj-in" class="adj-ta" rows="2" maxlength="300" enterkeyhint="done" placeholder="${S ? 'Ex.: leg press ocupado, só tenho 25 minutos' : 'Ex.: tenho 40 minutos, trocar leg press por hack, mais peito superior'}"></textarea><button class="adj-clear" data-act="adj-clear" aria-label="Limpar">${I.x || '×'}</button></div>
    <div class="adj-chips" role="group" aria-label="Sugestões">${adjChips(cx.w0.items, S).map(t => `<button data-act="adj-chip" data-t="${esc(t)}">${esc(t)}</button>`).join('')}</div>
    <div id="adj-prev" aria-live="polite"></div>`);
  drawAdjPrev(); setTimeout(() => { const t = $('#adj-in'); if (t && !matchMedia('(pointer:coarse)').matches) t.focus(); }, 60);
}
function drawAdjPrev(){
  const sh = UI.sheet; const box = $('#adj-prev'); const cx = adjCtx(); if (!box || !cx) return; const S = sh.mode === 'session';
  if (!sh.text.trim()){ sh.res = null; box.innerHTML = `<div class="adj-help"><span class="eyebrow">O que dá para pedir</span><ul><li><b>Tempo</b> “tenho 40 minutos”, “treino mais curto”</li><li><b>Equipamento</b> “só halteres”, “sem polia”, “leg press ocupado”</li><li><b>Troca</b> “trocar supino reto por halteres”, “trocar extensora por agachamento búlgaro”</li><li><b>Foco</b> “mais peito superior”, “mais glúteo médio”, “mais cabeça longa do tríceps”</li><li><b>Volume</b> “uma série a menos em tudo”, “3 séries em tudo”, “10 a 12 repetições”</li><li><b>Dia</b> “estou cansado hoje”, “descanso de 90 s”</li></ul></div>`; return; }
  const res = obInterpret(sh.text, cx.w0, sh.off, {session: S}); sh.res = res; const on = res.rules.filter(x => x.on).length;
  const mins = S ? null : wMins({items: res.items, restEx: res.wset && 'restEx' in res.wset ? res.wset.restEx : cx.w0.restEx});
  box.innerHTML = `${res.rules.length ? `<div class="eyebrow" style="margin-top:18px">O que vou mudar</div><div class="ob-list" style="margin-top:10px">${res.rules.map((x, i) => `<button class="ob-rule" data-act="adj-tog" data-i="${i}" aria-pressed="${x.on}"><i class="tick">${I.check}</i><span class="grow"><b>${esc(x.title)}</b>${x.log.map(l => `<span>${esc(l)}</span>`).join('')}</span></button>`).join('')}</div>` : ''}
    ${res.flags.map(f => `<div class="ob-flag"><b>${esc(f.title)}</b><p>${esc(f.text)}</p></div>`).join('')}
    ${res.notes.length ? `<div class="adj-miss"><b>Não entendi ${res.notes.length === 1 ? 'esta parte' : 'estas partes'}</b>${res.notes.map(n => `<p>“${esc(n)}”</p>`).join('')}<p class="tiny muted">Tente com outras palavras, como “trocar remada curvada por máquina” ou “tenho 30 minutos”.</p></div>` : ''}
    ${on ? `<div class="adj-foot">${mins ? `<span class="tiny muted num">Fica com ${res.items.length} exercícios, ${res.items.reduce((a, x) => a + x.sets, 0)} séries e cerca de ${mins} min</span>` : ''}
      <button class="btn primary block" data-act="adj-apply">${S ? `Aplicar no treino de hoje` : `Salvar na rotina`}</button>
      ${!S && !openSession() ? '<button class="btn ghost block" data-act="adj-today">Usar só hoje e começar o treino</button>' : ''}</div>` : ''}`;
}
let ADJ_T = 0;
document.addEventListener('input', ev => { if (!ev.target || ev.target.id !== 'adj-in') return; clearTimeout(ADJ_T); ADJ_T = setTimeout(() => { if (!UI.sheet || UI.sheet.kind !== 'adj') return; UI.sheet.text = ev.target.value; UI.sheet.off = new Set(); drawAdjPrev(); }, 280); });
document.addEventListener('keydown', ev => { if (ev.target && ev.target.id === 'adj-in' && ev.key === 'Enter' && !ev.shiftKey){ ev.preventDefault(); ev.target.blur(); clearTimeout(ADJ_T); UI.sheet.text = ev.target.value; UI.sheet.off = new Set(); drawAdjPrev(); } });
A['adj-open'] = el => openAdjust(el.dataset.sid ? {mode: 'session', sid: el.dataset.sid} : {mode: 'routine', rid: el.dataset.rid, wid: el.dataset.wid});
A['adj-chip'] = el => { const t = $('#adj-in'); if (!t) return; const cur = t.value.trim(); t.value = cur ? `${cur.replace(/[,;.]$/, '')}, ${el.dataset.t.toLowerCase()}` : el.dataset.t; UI.sheet.text = t.value; UI.sheet.off = new Set(); drawAdjPrev(); Platform.haptic('light'); };
A['adj-clear'] = () => { const t = $('#adj-in'); if (t){ t.value = ''; t.focus(); } UI.sheet.text = ''; UI.sheet.off = new Set(); drawAdjPrev(); };
A['adj-tog'] = el => { const sh = UI.sheet; const i = +el.dataset.i; if (sh.off.has(i)) sh.off.delete(i); else sh.off.add(i); drawAdjPrev(); };
const adjClean = items => items.map(x => { const y = {...x, uid: x.uid || uid('i')}; delete y._f; delete y._new; delete y._done; return y; });
A['adj-apply'] = () => { const sh = UI.sheet; const cx = adjCtx(); if (!cx || !sh.res) return; const res = sh.res; const n = res.rules.filter(x => x.on).length;
  if (sh.mode === 'session'){ const s = cx.s; const snap = JSON.stringify(s.items); const bx = s.restEx; applyToSession(s, res); UI.expand = {}; saveSession(s); closeSheet(); render(); Platform.haptic('success');
    toast(`Treino de hoje ajustado (${n} ${n === 1 ? 'mudança' : 'mudanças'})`, () => { s.items = JSON.parse(snap); if (bx === undefined) delete s.restEx; else s.restEx = bx; saveSession(s); render(); }); return; }
  const w = cx.w; const before = w.items.map(x => ({...x})); const bEx = w.restEx; w.items = adjClean(res.items); if ('restEx' in (res.wset || {})) w.restEx = res.wset.restEx;
  saveState(); closeSheet(); render(); Platform.haptic('success');
  toast('Treino ajustado na rotina', () => { w.items = before; if (bEx === undefined) delete w.restEx; else w.restEx = bEx; saveState(); render(); }); };
A['adj-today'] = () => { const sh = UI.sheet; if (!sh.res) return; const res = sh.res; const {rid, wid} = sh; startSession(rid, wid); const s = openSession(); if (!s) return; applyToSession(s, res); saveSession(s); render(); toast('Treino de hoje começou com os ajustes. A rotina não mudou.'); };
function adjBar(attrs, S){
  return `<button class="adj-bar" data-act="adj-open" ${attrs}><i>${I_SPARK}</i><span class="grow"><b>${S ? 'Ajustar o treino de hoje' : 'Ajuste rápido'}</b><span>${S ? 'Pouco tempo, aparelho ocupado, mais foco…' : 'Tempo, equipamento, foco, séries…'}</span></span>${I.chev || ''}</button>`;
}
