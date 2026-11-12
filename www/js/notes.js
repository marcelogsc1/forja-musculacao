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
const OB_NEG = /\b(sem|nao (quero|gosto|tenho|curto|consigo|uso|usar|fazer|faco|curti)|evit\w*|tir\w*|remov\w*|odeio|nada de|chega de|detesto|troc\w* (o|a|os|as)?)\b/;
const OB_STOP = new Set(['com', 'sem', 'para', 'pra', 'mais', 'menos', 'quero', 'gosto', 'fazer', 'treino', 'exercicio', 'exercicios', 'nao', 'tirar', 'trocar', 'evitar', 'tenho', 'odeio', 'muito', 'pouco', 'favor']);
let OB_VOCAB = null;
const obVocab = () => OB_VOCAB || (OB_VOCAB = new Set(Object.values(CAT).flatMap(e => norm(e.n).split(/[^a-z0-9]+/)).filter(w => w.length >= 4 && !OB_STOP.has(w))));
const ISO_P = ['quad-iso', 'fly', 'ombro-lat', 'ombro-front', 'ombro-post', 'biceps', 'martelo', 'triceps-over', 'triceps-push', 'flexora', 'pant', 'abd', 'abd-inf', 'obliquo', 'gluteo', 'adutor', 'antebraco', 'antebraco-flex', 'encolhimento'];
/* exercícios que pedem técnica ou força avançada: só entram por troca automática se não houver outra opção */
const OB_HARD = new Set(['flexora-nordica', 'sissy', 'paralelas', 'barra-fixa', 'agachamento-unilateral', 'pike', 'flexao-declinada']);
const EQ_PREF = ['halter', 'barra', 'maquina', 'cabo', 'smith', 'peso', 'kettlebell', 'elastico', 'suspensao', 'outros'];

/* equipamento que este treino já usa: se tem máquina ou polia, está numa academia */
function obAllowedEq(items, ban){
  const used = new Set(items.map(x => getEx(x.ex) && getEx(x.ex).e).filter(Boolean));
  const gym = ['maquina', 'cabo', 'smith', 'barra'].some(e => used.has(e));
  const base = gym ? LOCAIS.academia.eq : [...used, 'peso'];
  return base.filter(e => !ban.has(e));
}
/* melhor substituto: mesmo padrão de movimento, equipamento permitido, ainda não está no treino */
function obAlt(ex, items, ban, prefer){
  const e = getEx(ex); if (!e) return null; const inW = new Set(items.map(x => x.ex)); const allow = new Set(obAllowedEq(items, ban));
  const rank = k => { const c = CAT[k]; return (prefer && c.e === prefer ? 0 : 10) + (allow.has(c.e) ? 0 : 100) + EQ_PREF.indexOf(c.e); };
  const ok = k => k !== ex && !inW.has(k) && !ban.has(CAT[k].e) && (allow.has(CAT[k].e) || (prefer && CAT[k].e === prefer));
  const same = Object.keys(CAT).filter(k => ok(k) && CAT[k].p === e.p);
  const near = Object.keys(CAT).filter(k => ok(k) && CAT[k].p !== e.p && CAT[k].m === e.m && (CAT[k].pri || [])[0] === (e.pri || [])[0] && CAT[k].m !== 'cardio');
  const pick = l => l.sort((a, b) => rank(a) - rank(b))[0];
  return pick(same.filter(k => !OB_HARD.has(k))) || pick(near.filter(k => !OB_HARD.has(k))) || pick(same) || pick(near) || null;
}
function obAddFor(m, items, ban){
  const inW = new Set(items.map(x => x.ex)); const allow = new Set(obAllowedEq(items, ban));
  for (const sl of OB_ADD[m] || []){ const k = (SLOTS[sl] ? SLOTS[sl].c : []).find(k => CAT[k] && !inW.has(k) && allow.has(CAT[k].e) && !ban.has(CAT[k].e)); if (k) return k; }
  return null;
}
function obFitTime(items, mins){
  const w = {items}; let guard = 40; const iso = x => ISO_P.includes((getEx(x.ex) || {}).p);
  const log = [];
  while (wMins(w) > mins && guard--){
    const cand = items.map((x, j) => [x, j]).filter(([x]) => x.sets > 2 && !x._f).sort((a, b) => (iso(b[0]) - iso(a[0])) || (b[1] - a[1]))[0];
    if (cand){ cand[0].sets--; log.push(`${exName(cand[0].ex)}: ${cand[0].sets + 1} → ${cand[0].sets} séries`); continue; }
    const drop = items.map((x, j) => [x, j]).filter(([x]) => iso(x) && !x._f).pop() || (items.length > 3 ? [items[items.length - 1], items.length - 1] : null);
    if (!drop) break; items.splice(drop[1], 1); log.push(`Sai ${exName(drop[0].ex)}`);
  }
  return log;
}
/* lê o texto e devolve as regras reconhecidas, cada uma com o que muda; off = índices desligados na prévia */
function obInterpret(text, w0, off = new Set()){
  let items = w0.items.map(x => ({...x})); const rules = [], flags = [], notes = [];
  const ban = new Set(); let fitTo = null;
  const FILL = /\b(por favor|pfv|pf|obrigad[oa]|valeu|ok|blz|beleza)\b/g;
  const clauses = norm(text).replace(/\s+e\s+(?=(nao|sem|mais|quero|prefiro|tenho|tirar|trocar|foco|focar|priorizar|descanso|estou|odeio|evitar)\b)/g, ';').split(/[\n.;!?]+|,|\bmas\b/).map(c => c.replace(FILL, '').trim()).filter(c => c.length > 2);
  const push = (title, fn) => { const i = rules.length; const before = items.map(x => ({...x})); const log = fn(); if (!log || !log.length){ items = before; return false; } if (off.has(i)) items = before; rules.push({title, log, on: !off.has(i)}); return true; };
  // 1) primeiro as restrições de equipamento, para as outras regras já respeitarem
  clauses.forEach(c => { if (!OB_NEG.test(c)) return; const exWords = c.split(/[^a-z0-9]+/).filter(w => obVocab().has(w) && !OB_EQ.some(([re]) => re.test(w)) && !OB_MUS.some(([re]) => re.test(w)));
    if (exWords.length) return; OB_EQ.forEach(([re, eq]) => { if (re.test(c)) ban.add(eq); }); });
  ban.forEach(eq => push(`Sem ${EQUIP[eq].toLowerCase()}`, () => { const log = []; items.forEach((x, j) => { const e = getEx(x.ex); if (!e || e.e !== eq) return; const alt = obAlt(x.ex, items, ban); if (alt){ log.push(`${exName(x.ex)} → ${exName(alt)}`); items[j] = {...x, ex: alt}; } else log.push(`${exName(x.ex)}: sem substituto com o equipamento disponível, ficou como está`); }); return log; }));
  clauses.forEach(c => {
    let hit = false; const mus = [...new Set(OB_MUS.filter(([re]) => re.test(c)).flatMap(([, m]) => m))];
    const eqs = OB_EQ.filter(([re]) => re.test(c)).map(([, e]) => e); const neg = OB_NEG.test(c);
    // dor: só sinaliza, não troca sozinho
    if (/\b(dor|doi|doendo|lesao|lesion\w*|machuc\w*|incomod\w*|tendinite|bursite)\b/.test(c)){
      OB_JOINT.forEach(([re, nome, test]) => { if (!re.test(c)) return; const list = items.filter(x => getEx(x.ex) && test(getEx(x.ex))).map(x => exName(x.ex));
        flags.push({title: `Dor no ${nome}`, text: list.length ? `Os exercícios deste treino que costumam exigir mais do ${nome}: ${list.join(', ')}. Com dor, o ajuste certo depende de avaliação: fale com um fisioterapeuta ou médico antes de mudar a carga. Você pode trocar cada um em Editar.` : `Nenhum exercício deste treino costuma exigir muito do ${nome}, mas com dor vale falar com um fisioterapeuta ou médico.`}); hit = true; });
      if (hit) return;
    }
    // tempo disponível
    const hh = c.match(/\b(\d)\s*(h|hora|horas)\b/); const mm = hh ? [0, String(+hh[1] * 60)] : c.match(/(\d{2,3})\s*(min|minutos|m\b)/); const short = /\b(mais curto|mais rapido|pouco tempo|menos tempo|treino curto|corrido|pressa)\b/.test(c);
    if (mm || short){ fitTo = mm ? +mm[1] : 'short'; hit = true; }
    // estilo
    const style = /\b(forca|pesad\w*|carga alta|mais carga|poucas rep\w*)\b/.test(c) ? 'forca' : /\b(resistencia|definicao|definir|queimar|mais leve|muitas rep\w*|reps altas)\b/.test(c) ? 'res' : /\b(hipertrofia|ganhar massa|crescer)\b/.test(c) ? 'hip' : '';
    if (style){ const S = {forca: ['mais força', 4, 6, 180, 2, 1], res: ['mais resistência', 12, 15, 60, 15, 20], hip: ['hipertrofia', 8, 12, 90, 10, 15]}[style];
      hit = push(`Estilo: ${S[0]}`, () => { const log = []; items.forEach((x, j) => { const iso = ISO_P.includes((getEx(x.ex) || {}).p); const n = iso ? (style === 'forca' ? {...x, rmin: 8, rmax: 12, rest: 90} : {...x, rmin: S[4], rmax: S[5], rest: style === 'res' ? 45 : 60}) : {...x, rmin: S[1], rmax: S[2], rest: S[3]};
        if (n.rmin !== x.rmin || n.rmax !== x.rmax || n.rest !== x.rest){ log.push(`${exName(x.ex)}: ${x.rmin}–${x.rmax} → ${n.rmin}–${n.rmax} reps, descanso ${fmtRest(n.rest)}`); items[j] = n; } }); return log; }) || hit; }
    // descanso
    const restUp = /\b(descanso (maior|mais longo|longo)|descansar mais|mais descanso)\b/.test(c), restDn = /\b(descanso (menor|mais curto|curto)|descansar menos|menos descanso)\b/.test(c);
    if (restUp || restDn) hit = push(restUp ? 'Descanso maior' : 'Descanso menor', () => items.map((x, j) => { const r = Math.max(30, Math.min(300, (x.rest || 60) + (restUp ? 30 : -30))); if (r === x.rest) return null; items[j] = {...x, rest: r}; return `${exName(x.ex)}: ${fmtRest(x.rest || 60)} → ${fmtRest(r)}`; }).filter(Boolean)) || hit;
    // tirar ou trocar um exercício específico
    const words = c.split(/[^a-z0-9]+/).filter(w => obVocab().has(w) && !OB_MUS.some(([re]) => re.test(w)));
    if (neg && words.length && words.some(w => !OB_EQ.some(([re]) => re.test(w)))){
      const tg = items.filter(x => { const n = norm(exName(x.ex)); return words.every(w => n.includes(w)); });
      if (tg.length){ const remove = /\b(tir\w*|remov\w*)\b/.test(c);
        hit = push(remove ? `Tirar ${words.join(' ')}` : `Trocar ${words.join(' ')}`, () => { const log = []; tg.forEach(t => { const j = items.findIndex(x => x.uid === t.uid && x.ex === t.ex); if (j < 0) return;
          if (remove){ items.splice(j, 1); log.push(`Sai ${exName(t.ex)}`); return; }
          const alt = obAlt(t.ex, items, ban); if (alt){ items[j] = {...items[j], ex: alt}; log.push(`${exName(t.ex)} → ${exName(alt)}`); } }); return log; }) || hit; }
    } else if (eqs.length && !neg && /\b(prefir\w*|mais|usar|quero|gosto|priorizar)\b/.test(c)){
      // preferir um equipamento: troca até 2 exercícios que têm versão com ele
      const pref = eqs[0]; hit = push(`Mais exercícios com ${EQUIP[pref].toLowerCase()}`, () => { const log = []; for (let j = 0; j < items.length && log.length < 2; j++){ const e = getEx(items[j].ex); if (!e || e.e === pref) continue; const alt = Object.keys(CAT).find(k => CAT[k].p === e.p && CAT[k].e === pref && !items.some(x => x.ex === k)); if (alt){ log.push(`${exName(items[j].ex)} → ${exName(alt)}`); items[j] = {...items[j], ex: alt}; } } return log; }) || hit;
    }
    // foco em músculo: uma série a mais nos exercícios dele; se pedir exercício a mais, ou se o treino não tiver nenhum, inclui um
    if (mus.length && !neg && /\b(mais|foco|focar|priori\w*|enfase|enfatizar|reforc\w*|caprich\w*|fraco|atrasad\w*|desenvolver|crescer|atencao|incluir|adicion\w*|acrescent\w*)\b/.test(c)){
      const wantEx = /\b(exercicios?|outro|incluir|adicion\w*|acrescent\w*)\b/.test(c);
      mus.forEach(m => { hit = push(`Mais ${MUSC[m].toLowerCase()}`, () => { const log = []; const mine = items.filter(x => (getEx(x.ex) || {}).m === m);
        if (wantEx || !mine.length){ const k = obAddFor(m, items, ban); if (k){ const it = {...newItem(k), sets: 3, _f: 1}; const iso = ISO_P.includes(CAT[k].p); const lastComp = items.map(x => ISO_P.includes((getEx(x.ex) || {}).p)).lastIndexOf(false);
            const at = iso ? (items.findIndex(x => ['abdomen'].includes((getEx(x.ex) || {}).m)) + 1 || items.length + 1) - 1 : lastComp + 1; items.splice(Math.max(0, at), 0, it); log.push(`Entra ${exName(k)} (3 × ${it.rmin}–${it.rmax})`); } }
        if (!wantEx) mine.slice(0, 2).forEach(x => { if (x.sets < 5){ x.sets++; x._f = 1; log.push(`${exName(x.ex)}: ${x.sets - 1} → ${x.sets} séries`); } });
        return log; }) || hit; });
    }
    if (!hit && !(neg && eqs.length)){ const nt = norm(text.normalize('NFC')); const at = nt.indexOf(c); notes.push(at >= 0 ? text.normalize('NFC').substr(at, c.length) : c); }
  });
  // o tempo vem por último, para caber depois das outras mudanças (sem desfazer o foco pedido)
  if (fitTo){ const tgt = fitTo === 'short' ? Math.round(wMins({items}) * .75) : fitTo;
    if (tgt >= 15 && tgt < wMins({items})) push(`Treino em até ${tgt} minutos`, () => obFitTime(items, tgt));
    else if (tgt >= 15) flags.push({title: `Cabe em ${tgt} minutos`, text: `Pela estimativa do app, este treino já leva cerca de ${wMins({items})} minutos.`}); }
  return {rules, flags, notes, items};
}

/* ---------- interface ---------- */
function obsCard(r, w){
  return `<section class="card stack ob-card"><div class="row between"><span class="eyebrow">Observações e preferências</span>${w.obs ? `<span class="tiny muted">${w.obsAt ? 'ajustado ' + relDay(w.obsAt).toLowerCase() : 'salvo'}</span>` : ''}</div>
    <textarea id="wobs" class="field ob-ta" rows="3" maxlength="400" placeholder="Ex.: sem polia · mais foco em glúteo · tenho 45 minutos · trocar o agachamento · mais força" data-act="wobs" data-rid="${r.id}" data-wid="${w.id}">${esc(w.obs || '')}</textarea>
    <div class="row between" style="gap:10px"><span class="tiny muted grow">O app lê a anotação e sugere ajustes pequenos. Você confere antes de aplicar.</span><button class="btn sm primary" data-act="obs-run" data-rid="${r.id}" data-wid="${w.id}">Ajustar treino</button></div></section>`;
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
  const before = w.items.map(x => ({...x})); w.items = sh.res.items.map(x => { const y = {...x, uid: x.uid || uid('i')}; delete y._f; return y; }); w.obsAt = today(); saveState(); closeSheet(); render(); Platform.haptic('success');
  toast('Treino ajustado', () => { w.items = before; saveState(); render(); }); };
document.addEventListener('change', ev => { if (ev.target && ev.target.id === 'wobs') A.wobs(ev.target); });
/* lembrete na sessão: as frases que não viraram ajuste */
function obsReminder(s){
  if (!s || !s.routine) return ''; const r = routineById(s.routine); const w = r && r.workouts.find(x => x.id === s.workout); if (!w || !w.obs) return '';
  const notes = obInterpret(w.obs, w).notes; if (!notes.length) return '';
  return `<div class="ob-remind">${I.note}<span>${notes.map(esc).join(' · ')}</span></div>`;
}
