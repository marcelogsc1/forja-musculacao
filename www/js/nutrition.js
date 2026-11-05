/* Assistente de objetivo do Forja: gasto energético, calorias, macronutrientes e check-in semanal adaptativo.
   Referências usadas nos cálculos (também listadas no app, em "Como calculamos"):
   - Metabolismo basal: Mifflin-St Jeor (1990). A revisão de Frankenfield et al. (2005) o aponta como a equação que mais
     acerta dentro de 10% do valor medido, em pessoas com e sem obesidade.
   - Com % de gordura conhecido: Katch-McArdle, 370 + 21,6 × massa magra (kg).
   - % de gordura por circunferências: fórmula da Marinha dos EUA (Hodgdon & Beckett, 1984).
   - Proteína: sem ganho adicional de massa magra acima de 1,62 g/kg/dia (Morton et al., 2018); faixa 1,6 a 2,2 g/kg
     (Iraki et al., 2019); em déficit, 2,3 a 3,1 g/kg de massa magra (Helms et al., 2014).
   - Por refeição: 0,4 g/kg em pelo menos 4 refeições (Schoenfeld & Aragon, 2018).
   - Emagrecer: 0,5 a 1% do peso por semana (Helms et al., 2014). Ganhar: superávit de 10 a 20%, 0,25 a 0,5% do peso
     por semana (Iraki et al., 2019).
   - Gordura: 20 a 35% das calorias e pelo menos 0,5 g/kg (Iraki et al., 2019). Fibras: 14 g por 1.000 kcal
     (Dietary Guidelines for Americans). Água total de referência: 2,0 L (mulheres) e 2,5 L (homens) por dia, EFSA 2010.
   - 7.700 kcal por kg de peso é a aproximação clássica; por isso o check-in semanal corrige o plano pelo seu peso real. */
const KCAL_KG = 7700;
const ACT = [
  {v: 1.2, t: 'Sedentário', s: 'Trabalho sentado, pouco deslocamento e sem treino regular.'},
  {v: 1.375, t: 'Levemente ativo', s: 'Treino 1 a 3 vezes por semana ou rotina com caminhadas.'},
  {v: 1.55, t: 'Moderadamente ativo', s: 'Treino 3 a 5 vezes por semana.'},
  {v: 1.725, t: 'Muito ativo', s: 'Treino 6 a 7 vezes por semana ou trabalho em pé o dia todo.'},
  {v: 1.9, t: 'Extremamente ativo', s: 'Treino intenso diário e trabalho físico pesado.'},
];
const CUT_RATES = [
  {v: 0.25, t: 'Suave', s: 'Mais fácil de manter, ideal para quem já está perto da meta.'},
  {v: 0.5, t: 'Recomendado', s: 'Bom equilíbrio entre velocidade e preservação de massa muscular.', rec: true},
  {v: 0.75, t: 'Acelerado', s: 'Exige mais disciplina; a fome e o cansaço aparecem mais.'},
  {v: 1, t: 'Agressivo', s: 'Limite superior recomendado. Melhor por poucas semanas.'},
];
const GAIN_RATES = [
  {v: 10, w: 0.25, t: 'Ganho enxuto', s: 'Menos gordura junto. Indicado para intermediários e avançados.'},
  {v: 20, w: 0.5, t: 'Ganho acelerado', s: 'Mais rápido; faz mais sentido para iniciantes, que ganham músculo mais rápido.'},
];
const OBJ = {cut: {t: 'Emagrecer', s: 'Perder gordura preservando a massa muscular.'}, gain: {t: 'Ganhar massa', s: 'Construir músculo com o mínimo de gordura extra.'}, maint: {t: 'Recompor e manter', s: 'Peso estável, trocando gordura por músculo aos poucos.'}};

const r50 = v => Math.round(v / 50) * 50;
const r10 = v => Math.round(v / 10) * 10;
const r5 = v => Math.round(v / 5) * 5;
const fmtK = v => fmtInt(Math.round(v));
function ageFrom(birth){ if (!birth || !/^\d{4}-\d{2}-\d{2}$/.test(birth)) return null; const [y, m, d] = birth.split('-').map(Number); const n = new Date(); let a = n.getFullYear() - y; if (n.getMonth() + 1 < m || (n.getMonth() + 1 === m && n.getDate() < d)) a--; return a >= 0 && a < 120 ? a : null; }
const lastWeight = () => { const l = (ST.bw || []).filter(x => x.kg != null).sort((a, b) => a.date.localeCompare(b.date)); return l.length ? l[l.length - 1] : null; };
/* % de gordura pela fórmula da Marinha (cm, log base 10), com a medição completa mais recente dos últimos 90 dias */
function navyBF(sex, h){
  if (!h || !sex) return null; const lim = isoDate(addDays(new Date(), -90));
  const l = (ST.bw || []).filter(x => x.date >= lim && x.cintura && x.pescoco && (sex === 'M' || x.quadril)).sort((a, b) => b.date.localeCompare(a.date))[0]; if (!l) return null;
  const L = Math.log10; let bf;
  if (sex === 'M'){ if (l.cintura <= l.pescoco) return null; bf = 495 / (1.0324 - 0.19077 * L(l.cintura - l.pescoco) + 0.15456 * L(h)) - 450; }
  else { const s = l.cintura + l.quadril - l.pescoco; if (s <= 0) return null; bf = 495 / (1.29579 - 0.35004 * L(s) + 0.221 * L(h)) - 450; }
  return bf >= 3 && bf <= 60 ? {v: Math.round(bf * 10) / 10, date: l.date} : null;
}
/* Frequência real de treino nas últimas 4 semanas, para sugerir o nível de atividade */
function trainFreq(){ const lim = isoDate(addDays(new Date(), -28)); const n = done().filter(s => s.date >= lim).length; return n / 4; }
function suggestAct(){ const f = trainFreq(); const r = activeRoutine(); const planned = hasSchedule(r) ? WEEK.filter(d => r.workouts.some(w => w.id === r.dias[d])).length : 0; const x = Math.max(f, planned); return x >= 6 ? 1.725 : x >= 3 ? 1.55 : x >= 1 ? 1.375 : 1.2; }

/* Núcleo do cálculo. Recebe dados completos e devolve o plano; não depende da tela. */
function planCalc(i){
  const out = {warn: [], ok: false};
  if (!i.sex || !i.age || !i.h || !i.kg) { out.missing = true; return out; }
  if (i.age < 18){ out.blocked = 'minor'; return out; }
  const bmi = i.kg / Math.pow(i.h / 100, 2); out.bmi = bmi;
  if (i.goal === 'cut' && bmi < 18.5){ out.blocked = 'under'; return out; }
  const bf = i.bf && i.bf >= 3 && i.bf <= 60 ? i.bf : null; out.bf = bf;
  const lbm = bf ? i.kg * (1 - bf / 100) : null; out.lbm = lbm;
  const mif = 10 * i.kg + 6.25 * i.h - 5 * i.age + (i.sex === 'M' ? 5 : -161);
  const bmr = lbm ? 370 + 21.6 * lbm : mif; out.bmr = bmr; out.mif = mif; out.method = lbm ? 'Katch-McArdle' : 'Mifflin-St Jeor';
  const tdee = bmr * i.act; out.tdee = tdee;
  let kcal = tdee, delta = 0, wk = 0;
  if (i.goal === 'cut'){ delta = -(i.rate / 100) * i.kg * KCAL_KG / 7; wk = -(i.rate / 100) * i.kg; }
  else if (i.goal === 'gain'){ const g = GAIN_RATES.find(x => x.v === i.gain) || GAIN_RATES[0]; delta = tdee * g.v / 100; wk = g.w / 100 * i.kg; }
  kcal = tdee + delta + (i.adj || 0);
  out.floor = false;
  if (kcal < bmr){ kcal = Math.ceil(bmr / 10) * 10; out.floor = true; out.warn.push('Para não comer abaixo do seu metabolismo basal, limitamos as calorias. A perda semanal fica um pouco menor que o ritmo escolhido.'); if (i.goal === 'cut') wk = (kcal - tdee) * 7 / KCAL_KG; }
  if (!out.floor) kcal = r10(kcal); out.kcal = kcal; out.tdeeR = r10(tdee); out.delta = kcal - out.tdeeR; out.wk = wk;
  // proteína
  const refKg = !lbm && bmi >= 30 ? Math.min(i.kg, 25 * Math.pow(i.h / 100, 2)) : i.kg; out.refKg = refKg;
  let p, plo, phi, basis;
  if (i.goal === 'cut'){ if (lbm){ p = lbm * 2.7; plo = lbm * 2.3; phi = lbm * 3.1; basis = `2,7 g por kg de massa magra (${fmtN(Math.round(lbm * 10) / 10)} kg)`; } else { p = refKg * 2.2; plo = refKg * 1.6; phi = refKg * 2.2; basis = `2,2 g por kg${refKg !== i.kg ? ' do peso de referência' : ''}`; } }
  else { const k = i.goal === 'gain' ? 1.8 : 2.0; p = refKg * k; plo = refKg * 1.6; phi = refKg * 2.2; basis = `${fmtN(k)} g por kg${refKg !== i.kg ? ' do peso de referência' : ''}`; }
  p = r5(p); out.p = p; out.plo = r5(plo); out.phi = r5(phi); out.pBasis = basis;
  // gordura e carboidrato
  let f = Math.max(kcal * 0.25 / 9, 0.5 * i.kg); let c = (kcal - p * 4 - f * 9) / 4;
  if (c < 0){ f = Math.max(0.5 * i.kg, (kcal - p * 4) / 9); c = Math.max(0, (kcal - p * 4 - f * 9) / 4); }
  out.f = r5(f); out.c = r5(c); out.cKg = c / i.kg;
  if (i.goal === 'gain' && out.cKg < 3) out.warn.push('Carboidratos abaixo de 3 g/kg: em fase de ganho, vale priorizar carboidrato para render no treino.');
  out.fiber = Math.round(kcal / 1000 * 14); out.water = i.sex === 'M' ? 2.5 : 2.0;
  out.meals = i.meals || 4; out.perMeal = r5(p / out.meals); out.perMealMin = Math.round(0.4 * refKg);
  // previsão até a meta
  if (i.target && wk && ((i.goal === 'cut' && i.target < i.kg) || (i.goal === 'gain' && i.target > i.kg))){
    const r = Math.abs(wk) / i.kg; const weeks = Math.ceil(Math.log(i.target / i.kg) / Math.log(1 + Math.sign(wk) * r));
    if (isFinite(weeks) && weeks > 0){ out.weeks = weeks; out.eta = isoDate(addDays(new Date(), weeks * 7)); }
    const tb = i.target / Math.pow(i.h / 100, 2); if (i.goal === 'cut' && tb < 18.5) out.warn.push(`A meta de ${fmtN(i.target)} kg fica abaixo do IMC 18,5 para a sua altura. Considere uma meta mais alta.`);
  }
  out.ok = true; return out;
}
/* Dados do usuário + plano salvo */
function planInput(pl){
  const pf = ST.profile || {}; const lw = lastWeight(); const h = parseNum(pf.height);
  const sex = pf.sex === 'Masculino' || pf.sex === 'M' ? 'M' : pf.sex === 'Feminino' || pf.sex === 'F' ? 'F' : null;
  const nb = navyBF(sex, h); const bf = pl.bfMode === 'navy' && nb ? nb.v : pl.bfMode === 'manual' ? pl.bf : null;
  return {goal: pl.goal, sex, age: ageFrom(pf.birth), h, kg: lw ? lw.kg : null, bf, act: pl.act || 1.55, rate: pl.rate || 0.5, gain: pl.gain || 10, target: pl.target || null, adj: pl.adj || 0, meals: pl.meals || 4};
}
/* Check-in: tendência do peso desde o início do plano (regressão linear) comparada com o ritmo esperado */
function planCheck(pl, res){
  const since = pl.ck || pl.start; const from = [isoDate(addDays(new Date(), -28)), pl.start, pl.ck || ''].sort().pop(); /* só pesagens com as calorias atuais */
  const pts = (ST.bw || []).filter(x => x.kg != null && x.date >= from).sort((a, b) => a.date.localeCompare(b.date));
  const days = pts.length ? (new Date(pts[pts.length - 1].date) - new Date(pts[0].date)) / 864e5 : 0;
  const sinceDays = Math.round((new Date(today()) - new Date(since)) / 864e5);
  if (pts.length < 4 || days < 10) return {state: 'early', n: pts.length, days: Math.round(days), need: Math.max(0, 4 - pts.length), needDays: Math.max(0, 10 - Math.round(days))};
  const t0 = new Date(pts[0].date).getTime(); const X = pts.map(p => (new Date(p.date) - t0) / 864e5), Y = pts.map(p => p.kg);
  const mx = X.reduce((a, b) => a + b) / X.length, my = Y.reduce((a, b) => a + b) / Y.length;
  const slope = X.reduce((a, x, k) => a + (x - mx) * (Y[k] - my), 0) / X.reduce((a, x) => a + (x - mx) ** 2, 0);
  const actual = slope * 7; const expected = res.wk || 0; const diff = actual - expected;
  const tol = Math.max(0.15, Math.abs(expected) * 0.3);
  const base = {actual, expected, n: pts.length, days: Math.round(days), due: sinceDays >= 7};
  if (Math.abs(diff) < tol) return {...base, state: 'ok'};
  let sug = -r50(Math.max(-250, Math.min(250, diff * KCAL_KG / 7)));
  if (res.kcal + sug < res.bmr) sug = Math.ceil((res.bmr - res.kcal) / 10) * 10;
  if (!sug) return {...base, state: 'ok'};
  return {...base, state: 'adjust', sug};
}

/* ---------- telas ---------- */
const sgn = v => v > 0 ? '+' : v < 0 ? '−' : '';
function planSummaryRow(where){
  const pl = ST.prefs.plan;
  if (!pl) return where === 'home' ? '' : `<button class="lastrow" data-act="plan-open"><span class="plan-ic">${I.target}</span><div class="grow"><div class="eyebrow">Assistente de objetivo</div><b>Calcule calorias e proteína</b><div class="small muted" style="margin-top:2px">Metabolismo basal, gasto do dia, macros e ajuste semanal pelo seu peso.</div></div>${I.chev}</button>`;
  const res = planCalc(planInput(pl)); if (!res.ok) return `<button class="lastrow" data-act="plan-open"><span class="plan-ic">${I.target}</span><div class="grow"><div class="eyebrow">Seu plano</div><b>Complete seus dados</b><div class="small muted" style="margin-top:2px">Falta informação para calcular o plano.</div></div>${I.chev}</button>`;
  const ck = planCheck(pl, res); const due = ck.state === 'adjust' && ck.due;
  return `<button class="lastrow plan-row" data-act="plan-open"><span class="plan-ic">${I.target}</span><div class="grow"><div class="eyebrow">Plano · ${OBJ[pl.goal].t}</div><b class="mono">${fmtK(res.kcal)} <em>kcal</em> · ${res.p} <em>g proteína</em></b></div>${due ? '<span class="pill warn">Check-in</span>' : ''}${I.chev}</button>`;
}
PAGES.plano = {title: () => 'Seu objetivo', view: () => (!ST.prefs.plan || UI.pw) ? planWizard() : planDash()};
function pwInit(){
  const pl = ST.prefs.plan || {}; const pf = ST.profile || {}; const lw = lastWeight();
  const g = pl.goal || (pf.goal === 'Definição' ? 'cut' : pf.goal === 'Hipertrofia' ? 'gain' : null);
  const sex = pf.sex === 'Masculino' || pf.sex === 'M' ? 'M' : pf.sex === 'Feminino' || pf.sex === 'F' ? 'F' : null;
  const lvl = pf.level;
  UI.pw = {step: 0, goal: g, sex, birth: pf.birth || '', h: pf.height || '', kg: lw ? fmtN(lw.kg) : '', bfMode: pl.bfMode || 'auto', bf: pl.bf != null ? fmtN(pl.bf) : '', act: pl.act || suggestAct(), rate: pl.rate || 0.5, gain: pl.gain || (lvl === 'Iniciante' ? 20 : 10), target: pl.target ? fmtN(pl.target) : '', meals: pl.meals || 4};
}
function pwSteps(){ return UI.pw.goal === 'maint' ? ['goal', 'body', 'act'] : ['goal', 'body', 'act', 'pace']; }
function planWizard(){
  if (!UI.pw) pwInit();
  const w = UI.pw; const steps = pwSteps(); const st = steps[Math.min(w.step, steps.length - 1)]; const k = steps.indexOf(st);
  const choice = (act, val, cur, title, sub, extra = '') => `<button class="choice" data-act="${act}" data-v="${val}" aria-pressed="${String(cur) === String(val)}"><span class="grow"><b>${title}${extra}</b><span>${sub}</span></span><i class="tick">${I.check}</i></button>`;
  let body = '', q = '', hint = '', canNext = true;
  if (st === 'goal'){
    q = 'Qual é o seu objetivo agora?'; hint = 'Você pode trocar quando quiser. O plano se ajusta.';
    body = Object.entries(OBJ).map(([g, x]) => choice('pw-goal', g, w.goal, x.t, x.s)).join(''); canNext = !!w.goal;
  } else if (st === 'body'){
    q = 'Sobre você'; hint = 'Usamos estes dados nas fórmulas de gasto energético. Eles ficam salvos no seu perfil.';
    const h = parseNum(w.h); const nb = navyBF(w.sex, h);
    body = `<div class="pw-f"><span class="pw-l">Sexo biológico <small>(muda a fórmula do metabolismo)</small></span><div class="seg">${[['M', 'Masculino'], ['F', 'Feminino']].map(([v, l]) => `<button data-act="pw-sex" data-v="${v}" aria-pressed="${w.sex === v}">${l}</button>`).join('')}</div></div>
      <div class="formgrid"><label class="flabel"><span class="tiny muted">Nascimento</span><input id="pw-birth" class="field" type="date" value="${esc(w.birth)}" data-pw="birth"></label><label class="flabel"><span class="tiny muted">Altura (cm)</span><input id="pw-h" class="field num" inputmode="numeric" value="${esc(w.h)}" data-pw="h" placeholder="168"></label></div>
      <label class="flabel"><span class="tiny muted">Peso atual (kg)</span><input id="pw-kg" class="field num" inputmode="decimal" value="${esc(w.kg)}" data-pw="kg" placeholder="70"></label>
      <div class="pw-f"><span class="pw-l">Percentual de gordura <small>(opcional, deixa o cálculo mais preciso)</small></span>
        <div class="seg">${[['auto', 'Não sei'], ...(nb ? [['navy', `Pelas medidas · ${fmtN(nb.v)}%`]] : []), ['manual', 'Informar']].map(([v, l]) => `<button data-act="pw-bf" data-v="${v}" aria-pressed="${(w.bfMode === v) || (v === 'auto' && w.bfMode === 'navy' && !nb)}">${l}</button>`).join('')}</div>
        ${w.bfMode === 'manual' ? `<label class="flabel" style="margin-top:10px"><span class="tiny muted">% de gordura (bioimpedância, dobras ou DEXA)</span><input id="pw-bf" class="field num" inputmode="decimal" value="${esc(w.bf)}" data-pw="bf" placeholder="18"></label>` : ''}
        ${!nb ? `<p class="tiny muted" style="margin:8px 0 0">Registre cintura, pescoço${w.sex === 'F' ? ' e quadril' : ''} em Progresso › Corpo e o app estima pela fórmula da Marinha dos EUA.</p>` : ''}</div>`;
    const age = ageFrom(w.birth); canNext = !!(w.sex && age && parseNum(w.h) > 100 && parseNum(w.h) < 250 && parseNum(w.kg) > 30 && parseNum(w.kg) < 300);
    if (age != null && age < 18) body += `<div class="pw-warn">Estas fórmulas foram validadas para adultos. Para menores de 18 anos, o ideal é montar o plano com um nutricionista.</div>`;
  } else if (st === 'act'){
    q = 'Como é o seu dia a dia?'; const sug = suggestAct(); const f = trainFreq();
    hint = f ? `Pelo seu histórico, você treinou ${fmtN(Math.round(f * 10) / 10)} vezes por semana nas últimas 4 semanas.` : 'Conte o treino e a rotina fora da academia.';
    body = ACT.map(a => choice('pw-act', a.v, w.act, a.t, a.s, a.v === sug ? '<em class="pill good">sugerido</em>' : '')).join('');
  } else {
    const inp = {...pwInputs(), adj: 0}; const g = w.goal;
    q = g === 'cut' ? 'Em que ritmo?' : 'Em que ritmo?'; hint = g === 'cut' ? 'Percentual do seu peso por semana. Ritmos mais lentos preservam mais músculo.' : 'Superávit sobre o gasto do dia. O ganho de peso esperado está ao lado.';
    body = (g === 'cut' ? CUT_RATES : GAIN_RATES).map(o => { const r = planCalc(g === 'cut' ? {...inp, rate: o.v} : {...inp, gain: o.v}); const kgw = r.ok ? Math.abs(r.wk) : 0; return choice(g === 'cut' ? 'pw-rate' : 'pw-gain', o.v, g === 'cut' ? w.rate : w.gain, o.t, `${o.s}<br><span class="mono pw-n">${r.ok ? `${sgn(r.delta)}${fmtK(Math.abs(r.delta))} kcal/dia · ${sgn(r.wk)}${fmtN(Math.round(kgw * 100) / 100)} kg/semana` : ''}${r.floor ? ' · limitado pelo basal' : ''}</span>`, o.rec ? '<em class="pill good">recomendado</em>' : ''); }).join('')
      + `<label class="flabel" style="margin-top:6px"><span class="tiny muted">Peso meta (opcional, para prever a data)</span><input id="pw-target" class="field num" inputmode="decimal" value="${esc(w.target)}" data-pw="target" placeholder="${g === 'cut' ? 'ex.: 66' : 'ex.: 75'}"></label>`;
  }
  const last = k === steps.length - 1;
  return `<section class="pw"><div class="pw-bar" aria-hidden="true">${steps.map((_, j) => `<i class="${j <= k ? 'on' : ''}"></i>`).join('')}</div>
    <div class="eyebrow" style="margin-top:18px">Passo ${k + 1} de ${steps.length}</div><h1 class="display h1" style="margin-top:8px">${q}</h1>${hint ? `<p class="ink2 small" style="margin:8px 0 0">${hint}</p>` : ''}
    <div class="pw-body">${body}</div>
    <div class="pw-foot">${k > 0 ? `<button class="btn ghost" data-act="pw-back">${I.back}</button>` : ST.prefs.plan ? '<button class="btn ghost" data-act="pw-cancel">Cancelar</button>' : ''}<button class="btn primary grow" data-act="pw-next" ${canNext ? '' : 'disabled'}>${last ? 'Ver meu plano' : 'Continuar'}</button></div></section>`;
}
function pwInputs(){ const w = UI.pw; const h = parseNum(w.h); const nb = navyBF(w.sex, h); return {goal: w.goal, sex: w.sex, age: ageFrom(w.birth), h, kg: parseNum(w.kg), bf: w.bfMode === 'navy' && nb ? nb.v : w.bfMode === 'manual' ? parseNum(w.bf) : null, act: w.act, rate: w.rate, gain: w.gain, target: parseNum(w.target), meals: w.meals}; }
function pwKeep(){ document.querySelectorAll('[data-pw]').forEach(i => { UI.pw[i.dataset.pw] = i.value; }); }
function pwSave(){
  const w = UI.pw; const old = ST.prefs.plan || {}; const kg = parseNum(w.kg);
  ST.profile.sex = w.sex === 'M' ? 'Masculino' : 'Feminino'; if (w.birth) ST.profile.birth = w.birth; if (parseNum(w.h)) ST.profile.height = String(parseNum(w.h));
  const lw = lastWeight(); if (kg && (!lw || Math.abs(lw.kg - kg) > 0.001)){ const td = today(); const e = (ST.bw || []).find(x => x.date === td); if (e) e.kg = kg; else ST.bw = (ST.bw || []).concat({date: td, kg}); }
  const same = old.goal === w.goal && old.rate === w.rate && old.gain === w.gain;
  const nb = navyBF(w.sex, parseNum(w.h));
  ST.prefs.plan = {goal: w.goal, act: w.act, rate: w.rate, gain: w.gain, target: parseNum(w.target), bfMode: w.bfMode === 'navy' && !nb ? 'auto' : w.bfMode, bf: w.bfMode === 'manual' ? parseNum(w.bf) : null, meals: w.meals || 4, adj: same ? (old.adj || 0) : 0, start: same && old.start ? old.start : today(), startKg: same && old.startKg ? old.startKg : kg, ck: same ? old.ck || null : null, log: same ? old.log || [] : []};
  UI.pw = null; saveState(); render(); window.scrollTo({top: 0}); Platform.haptic('success');
}
function planDash(){
  const pl = ST.prefs.plan; const inp = planInput(pl); const res = planCalc(inp);
  if (!res.ok){
    const msg = res.blocked === 'minor' ? 'As fórmulas de gasto energético foram validadas para adultos. Para menores de 18 anos, procure um nutricionista para montar o plano.' : res.blocked === 'under' ? 'Pelo seu peso e altura, o IMC está abaixo de 18,5. Não montamos plano de emagrecimento nessa faixa; escolha Recompor e manter ou converse com um profissional.' : 'Faltam dados para calcular: sexo, nascimento, altura e um registro de peso.';
    return `<section class="empty" style="margin-top:20px"><b>Não dá para calcular agora</b>${msg}<div style="margin-top:14px"><button class="btn primary sm" data-act="plan-edit">Revisar dados</button></div></section>`;
  }
  const g = OBJ[pl.goal]; const ck = planCheck(pl, res); const lw = lastWeight();
  const kP = res.p * 4, kF = res.f * 9, kC = res.c * 4, kT = kP + kF + kC || 1;
  let h = `<section class="hero plan-hero" style="--pc:${pl.goal === 'cut' ? 'var(--c7)' : pl.goal === 'gain' ? 'var(--ember)' : 'var(--c5)'};margin-top:14px">${glow()}
    <div class="hero-top"><span class="hero-lbl">Plano · ${g.t}</span><button class="hero-rt link" style="min-height:0;padding:0" data-act="plan-edit">Editar</button></div>
    <div class="plan-k"><b class="mono">${fmtK(res.kcal)}</b><span>kcal por dia</span></div>
    <p class="hero-focus">Manutenção estimada <b class="mono">${fmtK(res.tdeeR)}</b>${res.delta ? ` · ${res.delta < 0 ? 'déficit' : 'superávit'} de <b class="mono">${fmtK(Math.abs(res.delta))}</b>` : ''}${pl.adj ? ` · inclui ajuste de ${sgn(pl.adj)}${fmtK(Math.abs(pl.adj))} dos check-ins` : ''}</p>
    <div class="macro-bar" role="img" aria-label="Distribuição das calorias"><i style="--w:${kP / kT * 100}%;--mc:var(--c1)"></i><i style="--w:${kC / kT * 100}%;--mc:var(--c2)"></i><i style="--w:${kF / kT * 100}%;--mc:var(--c0)"></i></div>
    <div class="hero-stats macros"><div style="--mc:var(--c1)"><b>${res.p}<small>g</small></b><span>proteína</span></div><div style="--mc:var(--c2)"><b>${res.c}<small>g</small></b><span>carboidratos</span></div><div style="--mc:var(--c0)"><b>${res.f}<small>g</small></b><span>gorduras</span></div></div></section>`;
  res.warn.forEach(t => { h += `<div class="pw-warn" style="margin-top:12px">${t}</div>`; });
  // check-in
  const ckBody = ck.state === 'early' ? `<b>${pl.ck ? 'Coletando dados com as calorias novas' : 'Faltam dados para o primeiro ajuste'}</b><p>Pese-se em jejum, ao acordar, 3 a 4 vezes por semana. Com ${ck.need ? `mais ${ck.need} ${ck.need === 1 ? 'pesagem' : 'pesagens'}` : ''}${ck.need && ck.needDays ? ' e ' : ''}${ck.needDays ? `${ck.needDays} ${ck.needDays === 1 ? 'dia' : 'dias'} de histórico` : ''} o app compara sua tendência com o ritmo do plano.</p><button class="btn sm" data-act="plan-weigh">${I.plus}Registrar peso de hoje</button>`
    : `<div class="ck-nums"><div><span>Seu ritmo real</span><b class="mono">${sgn(ck.actual)}${fmtN(Math.abs(Math.round(ck.actual * 100) / 100))} <small>kg/sem</small></b></div><div><span>Ritmo do plano</span><b class="mono">${sgn(ck.expected)}${fmtN(Math.abs(Math.round(ck.expected * 100) / 100))} <small>kg/sem</small></b></div></div>
      ${ck.state === 'ok' ? `<p>Você está no ritmo. Mantenha as calorias. <span class="muted">Base: ${ck.n} pesagens em ${ck.days} dias.</span></p>` : `<p>${ck.sug < 0 ? 'O peso está caindo mais devagar' : 'O peso está mudando mais rápido'} do que o plano prevê${pl.goal === 'gain' ? (ck.actual < ck.expected ? ' (ganhando devagar)' : ' (ganhando rápido)') : ''}. Sugestão: <b class="mono">${sgn(ck.sug)}${fmtK(Math.abs(ck.sug))} kcal</b> por dia. <span class="muted">Base: ${ck.n} pesagens em ${ck.days} dias. Considere só se você seguiu o plano com regularidade.</span></p>
        <div class="row" style="gap:8px"><button class="btn primary sm" data-act="plan-apply" data-v="${ck.sug}">Aplicar ajuste</button><button class="btn ghost sm" data-act="plan-skip">Manter</button></div>`}`;
  h += `<section class="card plan-ck ${ck.state === 'adjust' ? 'is-adj' : ''}"><div class="eyebrow">Check-in semanal${pl.ck ? ` · último em ${fmtD(pl.ck)}` : ''}</div>${ckBody}</section>`;
  // meta e prazo
  if (pl.target && lw){
    const s = pl.startKg || lw.kg; const tot = pl.target - s; const prog = tot ? Math.max(0, Math.min(1, (lw.kg - s) / tot)) : 0;
    h += `<section class="card"><div class="sec-head"><span class="eyebrow">Meta de peso</span>${res.eta ? `<span class="mono small muted">previsão ${fmtD(res.eta)}</span>` : ''}</div>
      <div class="goal-line"><div><b class="mono">${fmtN(s)}</b><span>início</span></div><div class="gl-bar"><i style="width:${prog * 100}%"></i><em style="left:${prog * 100}%"></em></div><div style="text-align:right"><b class="mono">${fmtN(pl.target)}</b><span>meta</span></div></div>
      <p class="small ink2" style="margin:12px 0 0">Agora: <b class="mono">${fmtN(lw.kg)} kg</b>${res.weeks ? ` · cerca de ${res.weeks} ${res.weeks === 1 ? 'semana' : 'semanas'} no ritmo atual` : ''}.</p></section>`;
  }
  // distribuição
  h += `<section class="plan-grid"><div class="card"><span class="eyebrow">Por refeição</span><b class="mono">${res.perMeal}<small> g</small></b><span class="small muted">de proteína em ${res.meals} refeições</span><div class="seg mini" style="margin-top:10px">${[3, 4, 5, 6].map(n => `<button data-act="plan-meals" data-v="${n}" aria-pressed="${res.meals === n}">${n}</button>`).join('')}</div></div>
    <div class="card"><span class="eyebrow">Fibras</span><b class="mono">${res.fiber}<small> g</small></b><span class="small muted">por dia</span><span class="eyebrow" style="margin-top:14px">Água</span><b class="mono">${fmtN(res.water)}<small> L</small></b><span class="small muted">total por dia, mais no calor e no treino</span></div></section>`;
  if (res.perMeal < res.perMealMin) h += `<p class="tiny muted" style="margin:8px 4px 0">Com ${res.meals} refeições a proteína por refeição fica abaixo de ${res.perMealMin} g (0,4 g/kg). Mais refeições ajudam a distribuir melhor.</p>`;
  // composição
  if (res.bf){ h += `<section class="card"><div class="eyebrow">Composição corporal</div><div class="ck-nums" style="margin-top:10px"><div><span>Gordura</span><b class="mono">${fmtN(res.bf)}<small>%</small></b></div><div><span>Massa magra</span><b class="mono">${fmtN(Math.round(res.lbm * 10) / 10)}<small> kg</small></b></div><div><span>Gordura</span><b class="mono">${fmtN(Math.round((inp.kg - res.lbm) * 10) / 10)}<small> kg</small></b></div></div><p class="tiny muted" style="margin:10px 0 0">${pl.bfMode === 'navy' ? 'Estimado pela fórmula da Marinha dos EUA com suas medidas de cintura, pescoço' + (inp.sex === 'F' ? ' e quadril' : '') + '. Margem de alguns pontos percentuais; use para acompanhar a tendência.' : 'Valor informado por você.'}</p></section>`; }
  // como calculamos
  h += `<details class="card how"><summary><span class="eyebrow">Como calculamos</span>${I.down}</summary>
    <ol class="how-l">
      <li><b>Metabolismo basal: ${fmtK(res.bmr)} kcal</b><span>${res.method}${res.lbm ? `, com massa magra de ${fmtN(Math.round(res.lbm * 10) / 10)} kg` : `, com ${fmtN(inp.kg)} kg, ${fmtN(inp.h)} cm e ${inp.age} anos`}. É o que o corpo gasta em repouso.</span></li>
      <li><b>Gasto do dia: ${fmtK(res.tdeeR)} kcal</b><span>Basal × ${fmtN(inp.act)} (${(ACT.find(a => a.v === inp.act) || {}).t || ''}).</span></li>
      <li><b>${pl.goal === 'cut' ? 'Déficit' : pl.goal === 'gain' ? 'Superávit' : 'Manutenção'}${res.delta ? `: ${sgn(res.delta)}${fmtK(Math.abs(res.delta))} kcal` : ''}</b><span>${pl.goal === 'cut' ? `${fmtN(inp.rate)}% do peso por semana, usando a aproximação de 7.700 kcal por kg.` : pl.goal === 'gain' ? `${inp.gain}% acima do gasto, para ganhar cerca de ${(GAIN_RATES.find(x => x.v === inp.gain) || {}).w}% do peso por semana.` : 'Calorias iguais ao gasto estimado.'}${pl.adj ? ` Ajustes dos check-ins: ${sgn(pl.adj)}${fmtK(Math.abs(pl.adj))} kcal.` : ''}</span></li>
      <li><b>Proteína: ${res.p} g</b><span>${res.pBasis}. Faixa com respaldo: ${res.plo} a ${res.phi} g.${res.refKg !== inp.kg && !res.lbm ? ' Com IMC acima de 30, usamos o peso de referência (IMC 25) para não superestimar.' : ''}</span></li>
      <li><b>Gorduras: ${res.f} g · Carboidratos: ${res.c} g</b><span>Gordura em 25% das calorias (mínimo de 0,5 g/kg); carboidratos completam o restante (${fmtN(Math.round(res.cKg * 10) / 10)} g/kg).</span></li>
    </ol>
    <p class="tiny muted" style="margin:12px 0 0">Toda fórmula tem margem de erro de cerca de 10% para mais ou para menos. Por isso o check-in semanal compara seu peso real com o previsto e ajusta o plano.</p>
    <p class="tiny muted" style="margin:8px 0 0">Referências: Mifflin et al. 1990; Frankenfield et al. 2005; Katch-McArdle; Hodgdon &amp; Beckett 1984 (Marinha dos EUA); Morton et al. 2018; Schoenfeld &amp; Aragon 2018; Helms et al. 2014; Iraki et al. 2019; Dietary Guidelines for Americans (fibras); EFSA 2010 (água).</p></details>
  <section class="row wrap" style="justify-content:center;gap:4px"><button class="link muted" data-act="plan-edit">Refazer o plano</button><button class="link muted" data-act="plan-del">Apagar plano</button></section>
  <p class="tiny muted" style="text-align:center;margin:10px 8px 0">Estimativas para adultos saudáveis. Não substitui nutricionista ou médico, principalmente com condições de saúde, gestação ou uso de medicamentos.</p>`;
  return h;
}
/* ---------- ações ---------- */
A['plan-open'] = () => { UI.pw = null; push({type: 'plano'}); };
A['plan-edit'] = () => { pwInit(); render(); window.scrollTo({top: 0}); };
A['pw-goal'] = el => { UI.pw.goal = el.dataset.v; render(); };
A['pw-sex'] = el => { pwKeep(); UI.pw.sex = el.dataset.v; render(); };
A['pw-bf'] = el => { pwKeep(); UI.pw.bfMode = el.dataset.v; render(); if (el.dataset.v === 'manual') setTimeout(() => $('#pw-bf')?.focus(), 30); };
A['pw-act'] = el => { UI.pw.act = +el.dataset.v; render(); };
A['pw-rate'] = el => { pwKeep(); UI.pw.rate = +el.dataset.v; render(); };
A['pw-gain'] = el => { pwKeep(); UI.pw.gain = +el.dataset.v; render(); };
A['pw-back'] = () => { pwKeep(); UI.pw.step = Math.max(0, UI.pw.step - 1); render(); window.scrollTo({top: 0}); };
A['pw-cancel'] = () => { UI.pw = null; render(); };
A['pw-next'] = () => { pwKeep(); const steps = pwSteps(); if (UI.pw.step >= steps.length - 1) return pwSave(); UI.pw.step++; render(); window.scrollTo({top: 0}); };
A['plan-meals'] = el => { ST.prefs.plan.meals = +el.dataset.v; saveState(); render(); };
A['plan-apply'] = el => { const pl = ST.prefs.plan; const v = +el.dataset.v; pl.adj = (pl.adj || 0) + v; pl.ck = today(); pl.log = (pl.log || []).concat({d: today(), v}).slice(-8); saveState(); render(); toast(`Plano ajustado em ${sgn(v)}${fmtK(Math.abs(v))} kcal por dia.`); Platform.haptic('success'); };
A['plan-skip'] = () => { const pl = ST.prefs.plan; pl.ck = today(); saveState(); render(); toast('Plano mantido. Novo check-in em 7 dias.'); };
A['plan-weigh'] = () => { UI.progTab = 'corpo'; UI.bwMetric = 'kg'; goTab('progresso'); setTimeout(() => { const i = $('#bw-kg'); if (i){ i.scrollIntoView({block: 'center'}); i.focus(); } }, 60); };
A['plan-del'] = () => confirmSheet({title: 'Apagar o plano?', text: 'As metas de calorias e proteína e os ajustes dos check-ins serão apagados. Seu peso e suas medidas continuam salvos.', ok: 'Apagar', danger: true, onOk: () => { delete ST.prefs.plan; saveState(); UI.stack.pop(); render(); toast('Plano apagado'); }});
document.addEventListener('input', ev => { const t = ev.target; if (!t.dataset || !t.dataset.pw || !UI.pw) return; UI.pw[t.dataset.pw] = t.value; const st = pwSteps()[UI.pw.step]; if (st === 'body'){ const w = UI.pw; const ok = !!(w.sex && ageFrom(w.birth) && parseNum(w.h) > 100 && parseNum(w.h) < 250 && parseNum(w.kg) > 30 && parseNum(w.kg) < 300); const b = $('[data-act="pw-next"]'); if (b) b.disabled = !ok; } });
document.addEventListener('change', ev => { const t = ev.target; if (t.dataset && t.dataset.pw && UI.pw && (t.dataset.pw === 'birth' || t.dataset.pw === 'h')){ UI.pw[t.dataset.pw] = t.value; setTimeout(() => { if (!isTyping() && UI.pw) render(); }, 0); } });
