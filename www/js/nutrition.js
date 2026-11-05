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
   - 7.700 kcal por kg de peso é a aproximação clássica; por isso o check-in semanal corrige o plano pelo seu peso real.
   Gasto do dia (v4.6), em partes, em vez dos fatores de atividade "sedentário/moderado/..." que misturam rotina e treino:
   - Base da rotina: basal × 1,4, o limite inferior da faixa "sedentário ou leve" medida com água duplamente marcada
     (FAO/OMS/UNU 2004: 1,40 a 1,69). Começa no lado conservador; o check-in sobe se for preciso.
   - Passos acima de 5.000 por dia (limite de estilo de vida sedentário, Tudor-Locke et al. 2013): caminhada a ~5 km/h,
     3,8 MET (Compendium 2024, código 17190), passada média de 0,75 m, descontado o gasto de ficar sentado (1,3 MET, 11582).
   - Trabalho: diferença entre o MET da função e ficar sentado, 8 h × 5 dias (Compendium 2024: 11600 = 1,8; 11610 = 3,3; 11615 = 4,5).
   - Treino: minutos reais do histórico × MET da musculação (Compendium 2024: 02054 = 3,5; 02052 = 5,0; 02055 = 5,8),
     multiplicado por 0,72, porque em média 28% do gasto extra é compensado pelo corpo (Careau et al. 2021).
   - Unidade: 1 MET = basal/24 por hora, para o cálculo acompanhar o seu metabolismo.
   - Margem: equações acertam dentro de 10% em boa parte das pessoas, mas com erros individuais grandes (Frankenfield 2005;
     Plucker et al. 2024, água duplamente marcada). Por isso: faixa provável, calibração pela sua experiência e check-in. */
const KCAL_KG = 7700;
const BASE_PAL = 1.4, BG_MET = 1.3, WALK_MET = 3.8, STRIDE = 0.75, WALK_KMH = 5, STEP_FLOOR = 5000, COMP = 0.72, WORK_H = 8 * 5 / 7;
const JOBS = [
  {v: 'sit', m: 1.3, t: 'Sentado', s: 'Escritório, estudo, motorista, home office.'},
  {v: 'stand', m: 1.8, t: 'Em pé, leve', s: 'Comércio, atendimento, professor, cabeleireiro.'},
  {v: 'mod', m: 3.3, t: 'Em pé, com esforço', s: 'Cozinha, enfermagem, montagem, manutenção.'},
  {v: 'heavy', m: 4.5, t: 'Braçal', s: 'Obra, carga e descarga, mudanças, campo.'},
  {v: 'none', m: 1.3, t: 'Não trabalho fora', s: 'Em casa a maior parte do dia.'},
];
const STEPS = [{v: 4000, t: 'Menos de 5 mil'}, {v: 6250, t: '5 a 7,5 mil'}, {v: 8750, t: '7,5 a 10 mil'}, {v: 11250, t: '10 a 12,5 mil'}, {v: 14000, t: 'Mais de 12,5 mil'}];
const TTYPES = [
  {v: 3.5, t: 'Musculação tradicional', s: 'Vários exercícios, 8 a 15 repetições, descanso normal.'},
  {v: 5.0, t: 'Pesado, com básicos', s: 'Agachamento, terra, supino pesados; esforço alto.'},
  {v: 5.8, t: 'Circuito ou bisets', s: 'Pouco descanso, frequência cardíaca alta o tempo todo.'},
];
/* fatores antigos: só para planos criados antes da v4.6 */
const ACT = [
  {v: 1.2, t: 'Sedentário', s: 'Trabalho sentado, pouco deslocamento e sem treino regular.'},
  {v: 1.375, t: 'Levemente ativo', s: 'Treino 1 a 3 vezes por semana ou rotina com caminhadas.'},
  {v: 1.55, t: 'Moderadamente ativo', s: 'Treino 3 a 5 vezes por semana.'},
  {v: 1.725, t: 'Muito ativo', s: 'Treino 6 a 7 vezes por semana ou trabalho em pé o dia todo.'},
  {v: 1.9, t: 'Extremamente ativo', s: 'Treino intenso diário e trabalho físico pesado.'},
];
const CUT_RATES = [
  {v: 0.25, t: 'Suave', s: 'Mais fácil de manter, bom para quem já está perto da meta.'},
  {v: 0.5, t: 'Moderado', s: 'Preserva bem a massa muscular; ritmo indicado para quem já é magro.'},
  {v: 0.75, t: 'Firme', s: 'Mais rápido e ainda sustentável, com treino e proteína em dia.'},
  {v: 1, t: 'Intenso', s: 'Limite superior recomendado. Faz mais sentido com mais gordura para perder.'},
];
/* Ritmo sugerido: quanto mais magro, mais lento (Helms 2014; Garthe 2011: 0,7%/sem preservou mais massa magra em atletas).
   Faixas de IMC da OMS como aproximação quando o % de gordura é desconhecido. */
function recRate(bmi, bf, sex){
  if (bf){ const lean = sex === 'M' ? 15 : 23, high = sex === 'M' ? 25 : 33; return bf <= lean ? 0.5 : bf <= high ? 0.75 : 1; }
  return bmi < 25 ? 0.5 : bmi < 30 ? 0.75 : 1;
}
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
/* Treino real das últimas 4 semanas: sessões por semana e duração média */
function trainStats(){
  const lim = isoDate(addDays(new Date(), -28)); const L = done().filter(s => s.date >= lim);
  const mins = L.map(sessMins).filter(m => m != null && m >= 10 && m <= 240);
  const r = activeRoutine(); const planned = hasSchedule(r) ? WEEK.filter(d => r.workouts.some(w => w.id === r.dias[d])).length : 0;
  const sess = L.length ? Math.min(7, Math.round(L.length / 4)) : planned;
  return {sess, min: mins.length ? Math.round(mins.reduce((a, b) => a + b) / mins.length / 5) * 5 : 60, fromHist: !!L.length, n: L.length};
}
/* Gasto do dia em partes (ver cabeçalho). Devolve kcal por parte. */
function expend(bmr, kg, i){
  const hr = bmr / 24; const base = bmr * BASE_PAL;
  const extra = Math.max(0, (i.steps || 0) - STEP_FLOOR); const walkH = extra * STRIDE / 1000 / WALK_KMH;
  const steps = (WALK_MET - BG_MET) * walkH * hr;
  const job = (JOBS.find(j => j.v === i.job) || JOBS[0]); const work = (job.m - BG_MET) * WORK_H * hr;
  const train = Math.max(0, (i.tMet || 3.5) - BG_MET) * ((i.tSess || 0) * (i.tMin || 0) / 60 / 7) * hr * COMP;
  return {base, steps, work, train, total: base + steps + work + train};
}

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
  let tdee;
  if (i.cal && i.cal.kcal > 800){ tdee = i.cal.kcal - (i.cal.wk || 0) * KCAL_KG / 7; out.calib = true; }
  else if (i.job){ const e = expend(bmr, i.kg, i); out.parts = e; tdee = e.total; }
  else { tdee = bmr * (i.act || 1.55); out.legacy = true; }
  out.tdee = tdee; out.lo = r10(tdee * 0.9); out.hi = r10(tdee * 1.1); out.rec = recRate(bmi, bf, i.sex);
  let kcal = tdee, delta = 0, wk = 0;
  if (i.goal === 'cut'){ delta = -(i.rate / 100) * i.kg * KCAL_KG / 7; wk = -(i.rate / 100) * i.kg; }
  else if (i.goal === 'gain'){ const g = GAIN_RATES.find(x => x.v === i.gain) || GAIN_RATES[0]; delta = tdee * g.v / 100; wk = g.w / 100 * i.kg; }
  kcal = tdee + delta + (i.adj || 0);
  out.floor = false;
  if (kcal < bmr){ kcal = Math.ceil(bmr / 10) * 10; out.floor = true; out.warn.push('Para não comer abaixo do seu metabolismo basal, limitamos as calorias. A perda semanal fica um pouco menor que o ritmo escolhido.'); if (i.goal === 'cut') wk = (kcal - tdee) * 7 / KCAL_KG; }
  if (!out.floor) kcal = r10(kcal); out.kcal = kcal; out.tdeeR = r10(tdee); out.delta = kcal - out.tdeeR; out.wk = wk;
  // proteína
  /* sem % de gordura, acima de IMC 25 a proteína usa o peso de referência (IMC 25): evita superestimar em quem tem mais gordura */
  const refKg = !lbm && bmi >= 25 ? Math.min(i.kg, 25 * Math.pow(i.h / 100, 2)) : i.kg; out.refKg = refKg;
  let p, plo, phi, basis;
  if (i.goal === 'cut'){ if (lbm){ p = lbm * 2.7; plo = lbm * 2.3; phi = lbm * 3.1; basis = `2,7 g por kg de massa magra (${fmtN(Math.round(lbm * 10) / 10)} kg)`; } else { p = refKg * 2.0; plo = refKg * 1.6; phi = refKg * 2.2; basis = `2,0 g por kg${refKg !== i.kg ? ' do peso de referência' : ''}`; } }
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
  const ts = trainStats(); return {goal: pl.goal, sex, age: ageFrom(pf.birth), h, kg: lw ? lw.kg : null, bf, act: pl.act, job: pl.job, steps: pl.steps, tSess: pl.tSess ?? ts.sess, tMin: pl.tMin ?? ts.min, tMet: pl.tMet || 3.5, cal: pl.cal || null, rate: pl.rate || 0.5, gain: pl.gain || 10, target: pl.target || null, adj: pl.adj || 0, meals: pl.meals || 4};
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
const sexOf = pf => pf.sex === 'Masculino' || pf.sex === 'M' ? 'M' : pf.sex === 'Feminino' || pf.sex === 'F' ? 'F' : null;
/* Cartão do plano: no Início e no Perfil ganha destaque; em Corpo é uma linha. */
function planSummaryRow(where){
  const pl = ST.prefs.plan;
  if (!pl){
    if (where === 'home' && lsGet('forja.planHide') && lsGet('forja.planHide') > today()) return '';
    if (where === 'body') return `<button class="lastrow" data-act="plan-open"><span class="plan-ic">${I.target}</span><div class="grow"><div class="eyebrow">Assistente de objetivo</div><b>Calorias e proteína para o seu objetivo</b></div>${I.chev}</button>`;
    return `<div class="plan-promo"><i class="glow g1" aria-hidden="true"></i><div class="eyebrow">Assistente de objetivo</div><h3>Quanto comer para ${ST.profile.goal === 'Hipertrofia' ? 'ganhar massa' : ST.profile.goal === 'Definição' ? 'secar' : 'chegar no seu objetivo'}?</h3>
      <p>Calorias, proteína e macros calculados para você, com ajuste toda semana pelo seu peso real.</p>
      <div class="pp-mock" aria-hidden="true"><span><b class="mono">····</b> kcal</span><span><b class="mono">···</b> g proteína</span><span class="pp-bar"><i></i><i></i><i></i></span></div>
      <div class="row" style="gap:8px;margin-top:16px"><button class="btn primary grow" data-act="plan-open">Calcular em 1 minuto</button>${where === 'home' ? '<button class="btn ghost" data-act="plan-later">Agora não</button>' : ''}</div></div>`;
  }
  const res = planCalc(planInput(pl));
  if (!res.ok) return `<button class="lastrow" data-act="plan-open"><span class="plan-ic">${I.target}</span><div class="grow"><div class="eyebrow">Seu plano</div><b>Complete seus dados</b></div>${I.chev}</button>`;
  const ck = planCheck(pl, res); const due = ck.state === 'adjust' && ck.due;
  if (where === 'body') return `<button class="lastrow plan-row" data-act="plan-open"><span class="plan-ic">${I.target}</span><div class="grow"><div class="eyebrow">Plano · ${OBJ[pl.goal].t}</div><b class="mono">${fmtK(res.kcal)} <em>kcal</em> · ${res.p} <em>g proteína</em></b></div>${due ? '<span class="pill warn">Check-in</span>' : ''}${I.chev}</button>`;
  const kP = res.p * 4, kF = res.f * 9, kC = res.c * 4, kT = kP + kF + kC || 1;
  return `<button class="plan-card" data-act="plan-open"><div class="row between"><span class="eyebrow">Nutrição de hoje · ${OBJ[pl.goal].t}</span>${due ? '<span class="pill warn">Check-in pronto</span>' : ck.state === 'early' ? '' : '<span class="pill good">No ritmo</span>'}</div>
    <div class="pc-k"><b class="mono">${fmtK(res.kcal)}</b><span>kcal</span></div>
    <div class="macro-bar"><i style="--w:${kP / kT * 100}%;--mc:var(--c1)"></i><i style="--w:${kC / kT * 100}%;--mc:var(--c2)"></i><i style="--w:${kF / kT * 100}%;--mc:var(--c0)"></i></div>
    <div class="pc-m"><span style="--mc:var(--c1)"><b class="mono">${res.p}g</b> proteína</span><span style="--mc:var(--c2)"><b class="mono">${res.c}g</b> carbo</span><span style="--mc:var(--c0)"><b class="mono">${res.f}g</b> gordura</span></div></button>`;
}
PAGES.plano = {title: () => 'Seu objetivo', view: () => (!ST.prefs.plan || UI.pw) ? planWizard() : planDash()};
function pwInit(){
  const pl = ST.prefs.plan || {}; const pf = ST.profile || {}; const lw = lastWeight(); const ts = trainStats();
  const g = pl.goal || (pf.goal === 'Definição' ? 'cut' : pf.goal === 'Hipertrofia' ? 'gain' : null);
  UI.pw = {step: 0, goal: g, sex: sexOf(pf), birth: pf.birth || '', h: pf.height || '', kg: lw ? fmtN(lw.kg) : '', bfMode: pl.bfMode || 'auto', bf: pl.bf != null ? fmtN(pl.bf) : '',
    job: pl.job || null, steps: pl.steps || null, tSess: pl.tSess ?? ts.sess, tMin: pl.tMin ?? ts.min, tMet: pl.tMet || 3.5, rate: pl.rate || null, gain: pl.gain || (pf.level === 'Iniciante' ? 20 : 10), target: pl.target ? fmtN(pl.target) : '', meals: pl.meals || 4};
}
function pwSteps(){ return UI.pw.goal === 'maint' ? ['goal', 'body', 'day', 'train'] : ['goal', 'body', 'day', 'train', 'pace']; }
function planWizard(){
  if (!UI.pw) pwInit();
  const w = UI.pw; const steps = pwSteps(); const st = steps[Math.min(w.step, steps.length - 1)]; const k = steps.indexOf(st);
  const choice = (act, val, cur, title, sub, extra = '') => `<button class="choice" data-act="${act}" data-v="${val}" aria-pressed="${String(cur) === String(val)}"><span class="grow"><b>${title}${extra}</b>${sub ? `<span>${sub}</span>` : ''}</span><i class="tick">${I.check}</i></button>`;
  const chips = (act, opts, cur) => `<div class="pw-chips">${opts.map(([v, l]) => `<button data-act="${act}" data-v="${v}" aria-pressed="${String(cur) === String(v)}">${l}</button>`).join('')}</div>`;
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
  } else if (st === 'day'){
    q = 'Fora da academia'; hint = 'O treino vem no próximo passo. Aqui conta só a rotina: trabalho e quanto você anda.';
    body = `<div class="pw-f"><span class="pw-l">Trabalho ou estudo</span>${JOBS.map(j => choice('pw-job', j.v, w.job, j.t, j.s)).join('')}</div>
      <div class="pw-f" style="margin-top:8px"><span class="pw-l">Passos por dia <small>(média; veja no app de saúde do celular)</small></span>${chips('pw-steps', STEPS.map(s => [s.v, s.t]), w.steps)}</div>`;
    canNext = !!(w.job && w.steps);
  } else if (st === 'train'){
    const ts = trainStats();
    q = 'Seu treino'; hint = ts.fromHist ? `Preenchido com o seu histórico: ${ts.n} ${ts.n === 1 ? 'treino' : 'treinos'} nas últimas 4 semanas, ${ts.min} min em média.` : 'Quantas vezes por semana e quanto tempo dura, em média.';
    body = `<div class="pw-f"><span class="pw-l">Treinos por semana</span>${chips('pw-tsess', [0, 1, 2, 3, 4, 5, 6, 7].map(n => [n, n]), w.tSess)}</div>
      <div class="pw-f"><span class="pw-l">Duração média</span>${chips('pw-tmin', [[30, '30 min'], [45, '45 min'], [60, '1 h'], [75, '1h15'], [90, '1h30'], [120, '2 h']], w.tMin)}</div>
      ${w.tSess ? `<div class="pw-f"><span class="pw-l">Estilo</span>${TTYPES.map(t => choice('pw-tmet', t.v, w.tMet, t.t, t.s)).join('')}</div>` : ''}
      <p class="tiny muted" style="margin:4px 0 0">Musculação gasta menos do que parece: uma hora típica soma de 150 a 300 kcal, e o corpo compensa parte disso. Por isso contamos o treino à parte, pelo tempo real.</p>`;
  } else {
    const inp = {...pwInputs(), adj: 0}; const g = w.goal; const base = planCalc({...inp, rate: 0.5}); const rec = base.ok ? base.rec : 0.5;
    if (g === 'cut' && w.rate == null) w.rate = rec;
    q = 'Em que ritmo?'; hint = g === 'cut' ? 'Percentual do seu peso por semana. Quanto mais magro, mais devagar, para preservar músculo.' : 'Superávit sobre o gasto do dia. O ganho de peso esperado está ao lado.';
    body = (g === 'cut' ? CUT_RATES : GAIN_RATES).map(o => { const r = planCalc(g === 'cut' ? {...inp, rate: o.v} : {...inp, gain: o.v}); const kgw = r.ok ? Math.abs(r.wk) : 0;
      return choice(g === 'cut' ? 'pw-rate' : 'pw-gain', o.v, g === 'cut' ? w.rate : w.gain, o.t, `${o.s}<br><span class="mono pw-n">${r.ok ? `${fmtK(r.kcal)} kcal/dia · ${sgn(r.wk)}${fmtN(Math.round(kgw * 100) / 100)} kg/semana` : ''}${r.floor ? ' · limitado pelo basal' : ''}</span>`, (g === 'cut' ? o.v === rec : (UI.pw && ST.profile.level === 'Iniciante' ? o.v === 20 : o.v === 10)) ? '<em class="pill good">indicado para você</em>' : ''); }).join('')
      + `<label class="flabel" style="margin-top:6px"><span class="tiny muted">Peso meta (opcional, para prever a data)</span><input id="pw-target" class="field num" inputmode="decimal" value="${esc(w.target)}" data-pw="target" placeholder="${g === 'cut' ? 'ex.: 66' : 'ex.: 75'}"></label>`;
  }
  const last = k === steps.length - 1;
  return `<section class="pw"><div class="pw-bar" aria-hidden="true">${steps.map((_, j) => `<i class="${j <= k ? 'on' : ''}"></i>`).join('')}</div>
    <div class="eyebrow" style="margin-top:18px">Passo ${k + 1} de ${steps.length}</div><h1 class="display h1" style="margin-top:8px">${q}</h1>${hint ? `<p class="ink2 small" style="margin:8px 0 0">${hint}</p>` : ''}
    <div class="pw-body">${body}</div>
    <div class="pw-foot">${k > 0 ? `<button class="btn ghost" data-act="pw-back" aria-label="Voltar">${I.back}</button>` : ST.prefs.plan ? '<button class="btn ghost" data-act="pw-cancel">Cancelar</button>' : ''}<button class="btn primary grow" data-act="pw-next" ${canNext ? '' : 'disabled'}>${last ? 'Ver meu plano' : 'Continuar'}</button></div></section>`;
}
function pwInputs(){ const w = UI.pw; const h = parseNum(w.h); const nb = navyBF(w.sex, h); return {goal: w.goal, sex: w.sex, age: ageFrom(w.birth), h, kg: parseNum(w.kg), bf: w.bfMode === 'navy' && nb ? nb.v : w.bfMode === 'manual' ? parseNum(w.bf) : null, job: w.job, steps: w.steps, tSess: w.tSess, tMin: w.tMin, tMet: w.tMet, rate: w.rate || 0.5, gain: w.gain, target: parseNum(w.target), meals: w.meals}; }
function pwKeep(){ document.querySelectorAll('[data-pw]').forEach(i => { UI.pw[i.dataset.pw] = i.value; }); }
function pwSave(){
  const w = UI.pw; const old = ST.prefs.plan || {}; const kg = parseNum(w.kg);
  ST.profile.sex = w.sex === 'M' ? 'Masculino' : 'Feminino'; if (w.birth) ST.profile.birth = w.birth; if (parseNum(w.h)) ST.profile.height = String(parseNum(w.h));
  const lw = lastWeight(); if (kg && (!lw || Math.abs(lw.kg - kg) > 0.001)){ const td = today(); const e = (ST.bw || []).find(x => x.date === td); if (e) e.kg = kg; else ST.bw = (ST.bw || []).concat({date: td, kg}); }
  const same = old.goal === w.goal && old.rate === w.rate && old.gain === w.gain;
  const nb = navyBF(w.sex, parseNum(w.h)); const ts = trainStats();
  ST.prefs.plan = {goal: w.goal, job: w.job, steps: w.steps, tSess: ts.fromHist && w.tSess === ts.sess ? null : w.tSess, tMin: ts.fromHist && w.tMin === ts.min ? null : w.tMin, tMet: w.tMet, rate: w.rate || 0.5, gain: w.gain, target: parseNum(w.target), bfMode: w.bfMode === 'navy' && !nb ? 'auto' : w.bfMode, bf: w.bfMode === 'manual' ? parseNum(w.bf) : null, cal: old.cal || null, meals: w.meals || 4, adj: same ? (old.adj || 0) : 0, start: same && old.start ? old.start : today(), startKg: same && old.startKg ? old.startKg : kg, ck: same ? old.ck || null : null, log: same ? old.log || [] : []};
  UI.pw = null; saveState(); render(); window.scrollTo({top: 0}); Platform.haptic('success');
}
function calSheet(){
  const pl = ST.prefs.plan; const c = pl.cal || {};
  UI.sheet = {kind: 'cal'};
  openSheet(`${sheetHead('Gasto do dia', 'Calibrar com a sua experiência')}
    <p class="ink2 small" style="margin:10px 0 0">Se você já registrou tudo o que comia por pelo menos 3 semanas (num app de dieta ou com nutricionista), use esses números. Eles valem mais que qualquer fórmula.</p>
    <div class="stack" style="margin-top:14px"><label class="flabel"><span class="tiny muted">Calorias médias por dia naquele período</span><input id="cal-k" class="field num" inputmode="numeric" value="${c.kcal ? c.kcal : ''}" placeholder="ex.: 1500"></label>
    <div class="pw-f"><span class="pw-l">O que aconteceu com o peso? <small>(kg por semana, em média)</small></span><div class="pw-chips" id="cal-w">${[[-1, '−1'], [-0.75, '−0,75'], [-0.5, '−0,5'], [-0.25, '−0,25'], [0, 'Estável'], [0.25, '+0,25'], [0.5, '+0,5']].map(([v, l]) => `<button data-act="cal-w" data-v="${v}" aria-pressed="${(c.wk ?? 99) === v}">${l}</button>`).join('')}</div></div>
    <p class="tiny muted" style="margin:0">Conta: gasto = calorias que você comia − (variação de peso por semana × 7.700 ÷ 7).</p></div>
    <div class="sheet-foot"><button class="btn primary block" data-act="cal-save">Usar meu gasto real</button>${pl.cal ? '<button class="link muted" style="width:100%;margin-top:4px" data-act="cal-clear">Voltar para a estimativa</button>' : ''}</div>`);
}
function planDash(){
  const pl = ST.prefs.plan; const inp = planInput(pl); const res = planCalc(inp);
  if (!res.ok){
    const msg = res.blocked === 'minor' ? 'As fórmulas de gasto energético foram validadas para adultos. Para menores de 18 anos, procure um nutricionista para montar o plano.' : res.blocked === 'under' ? 'Pelo seu peso e altura, o IMC está abaixo de 18,5. Não montamos plano de emagrecimento nessa faixa; escolha Recompor e manter ou converse com um profissional.' : 'Faltam dados para calcular: sexo, nascimento, altura e um registro de peso.';
    return `<section class="empty" style="margin-top:20px"><b>Não dá para calcular agora</b>${msg}<div style="margin-top:14px"><button class="btn primary sm" data-act="plan-edit">Revisar dados</button></div></section>`;
  }
  const g = OBJ[pl.goal]; const ck = planCheck(pl, res); const lw = lastWeight();
  const kP = res.p * 4, kF = res.f * 9, kC = res.c * 4, kT = kP + kF + kC || 1;
  let h = res.legacy ? `<button class="sched-hint" style="margin-top:14px" data-act="plan-edit">${I.target}<span><b>Novo cálculo disponível.</b> Agora o gasto considera seu trabalho, seus passos e o tempo real de treino. Toque para revisar em 1 minuto.</span>${I.chev}</button>` : '';
  h += `<section class="hero plan-hero" style="--pc:${pl.goal === 'cut' ? 'var(--c7)' : pl.goal === 'gain' ? 'var(--ember)' : 'var(--c5)'};margin-top:14px">${glow()}
    <div class="hero-top"><span class="hero-lbl">Plano · ${g.t}</span><button class="hero-rt link" style="min-height:0;padding:0" data-act="plan-edit">Editar</button></div>
    <div class="plan-k"><b class="mono">${fmtK(res.kcal)}</b><span>kcal por dia</span></div>
    <p class="hero-focus">${res.calib ? 'Gasto real, pela sua experiência' : 'Gasto estimado'} <b class="mono">${fmtK(res.tdeeR)}</b>${res.delta ? ` · ${res.delta < 0 ? 'déficit' : 'superávit'} de <b class="mono">${fmtK(Math.abs(res.delta))}</b>` : ''}${pl.adj ? ` · ajuste dos check-ins ${sgn(pl.adj)}${fmtK(Math.abs(pl.adj))}` : ''}</p>
    <div class="macro-bar" role="img" aria-label="Distribuição das calorias"><i style="--w:${kP / kT * 100}%;--mc:var(--c1)"></i><i style="--w:${kC / kT * 100}%;--mc:var(--c2)"></i><i style="--w:${kF / kT * 100}%;--mc:var(--c0)"></i></div>
    <div class="hero-stats macros"><div style="--mc:var(--c1)"><b>${res.p}<small>g</small></b><span>proteína</span></div><div style="--mc:var(--c2)"><b>${res.c}<small>g</small></b><span>carboidratos</span></div><div style="--mc:var(--c0)"><b>${res.f}<small>g</small></b><span>gorduras</span></div></div></section>`;
  res.warn.forEach(t => { h += `<div class="pw-warn" style="margin-top:12px">${t}</div>`; });
  // margem e calibração
  if (!res.calib) h += `<section class="card range"><div class="row between"><span class="eyebrow">Margem da estimativa</span><span class="mono small muted">±10%</span></div>
    <div class="rg"><i></i><em></em></div><div class="rg-l mono"><span>${fmtK(res.lo)}</span><b>${fmtK(res.tdeeR)}</b><span>${fmtK(res.hi)}</span></div>
    <p class="small ink2" style="margin:10px 0 12px">Fórmulas acertam dentro dessa faixa para boa parte das pessoas, mas cada corpo é um. O check-in semanal leva você ao número certo. Já fez dieta registrando tudo? Seu histórico é mais preciso que a fórmula.</p>
    <button class="btn sm" data-act="cal-open">Calibrar com a minha experiência</button></section>`;
  else h += `<section class="card range"><div class="row between"><span class="eyebrow">Gasto calibrado</span><button class="link" style="min-height:0;padding:0" data-act="cal-open">Alterar</button></div><p class="small ink2" style="margin:8px 0 0">Comendo <b class="mono">${fmtK(pl.cal.kcal)} kcal</b> seu peso ${pl.cal.wk ? `${pl.cal.wk < 0 ? 'caía' : 'subia'} ${fmtN(Math.abs(pl.cal.wk))} kg por semana` : 'ficava estável'}. Isso dá um gasto real de cerca de <b class="mono">${fmtK(res.tdeeR)} kcal</b>.</p></section>`;
  // check-in
  const ckBody = ck.state === 'early' ? `<b>${pl.ck ? 'Coletando dados com as calorias novas' : 'Faltam dados para o primeiro ajuste'}</b><p>Pese-se em jejum, ao acordar, 3 a 4 vezes por semana. Com ${ck.need ? `mais ${ck.need} ${ck.need === 1 ? 'pesagem' : 'pesagens'}` : ''}${ck.need && ck.needDays ? ' e ' : ''}${ck.needDays ? `${ck.needDays} ${ck.needDays === 1 ? 'dia' : 'dias'} de histórico` : ''} o app compara sua tendência com o ritmo do plano.</p><button class="btn sm" data-act="plan-weigh">${I.plus}Registrar peso de hoje</button>`
    : `<div class="ck-nums"><div><span>Seu ritmo real</span><b class="mono">${sgn(ck.actual)}${fmtN(Math.abs(Math.round(ck.actual * 100) / 100))} <small>kg/sem</small></b></div><div><span>Ritmo do plano</span><b class="mono">${sgn(ck.expected)}${fmtN(Math.abs(Math.round(ck.expected * 100) / 100))} <small>kg/sem</small></b></div></div>
      ${ck.state === 'ok' ? `<p>Você está no ritmo. Mantenha as calorias. <span class="muted">Base: ${ck.n} pesagens em ${ck.days} dias.</span></p>` : `<p>${ck.sug < 0 ? 'O peso está mudando mais devagar' : 'O peso está mudando mais rápido'} do que o plano prevê. Sugestão: <b class="mono">${sgn(ck.sug)}${fmtK(Math.abs(ck.sug))} kcal</b> por dia. <span class="muted">Base: ${ck.n} pesagens em ${ck.days} dias. Considere só se você seguiu o plano com regularidade.</span></p>
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
  if (res.bf){ h += `<section class="card"><div class="eyebrow">Composição corporal</div><div class="ck-nums" style="margin-top:10px"><div><span>Gordura</span><b class="mono">${fmtN(res.bf)}<small>%</small></b></div><div><span>Massa magra</span><b class="mono">${fmtN(Math.round(res.lbm * 10) / 10)}<small> kg</small></b></div><div><span>Gordura</span><b class="mono">${fmtN(Math.round((inp.kg - res.lbm) * 10) / 10)}<small> kg</small></b></div></div><p class="tiny muted" style="margin:10px 0 0">${pl.bfMode === 'navy' ? 'Estimado pela fórmula da Marinha dos EUA com suas medidas de cintura, pescoço' + (inp.sex === 'F' ? ' e quadril' : '') + '. Margem de alguns pontos percentuais; use para acompanhar a tendência.' : 'Valor informado por você.'}</p></section>`; }
  // como calculamos
  const P = res.parts; const job = JOBS.find(j => j.v === inp.job);
  const gasto = res.calib ? `<li><b>Gasto do dia: ${fmtK(res.tdeeR)} kcal</b><span>Calibrado: ${fmtK(pl.cal.kcal)} kcal comidas ${pl.cal.wk ? `com o peso ${pl.cal.wk < 0 ? 'caindo' : 'subindo'} ${fmtN(Math.abs(pl.cal.wk))} kg/semana (${sgn(-pl.cal.wk)}${fmtK(Math.abs(pl.cal.wk) * KCAL_KG / 7)} kcal/dia)` : 'com o peso estável'}.</span></li>`
    : P ? `<li><b>Gasto do dia: ${fmtK(res.tdeeR)} kcal</b><span class="how-parts"><i>Rotina básica (basal × 1,4)</i><em class="mono">${fmtK(P.base)}</em><i>Passos acima de 5 mil</i><em class="mono">+${fmtK(P.steps)}</em><i>Trabalho ${job ? `(${job.t.toLowerCase()})` : ''}</i><em class="mono">+${fmtK(P.work)}</em><i>Treino (${inp.tSess}× de ${inp.tMin} min, ${fmtN(inp.tMet)} MET, 72%)</i><em class="mono">+${fmtK(P.train)}</em></span></li>`
    : `<li><b>Gasto do dia: ${fmtK(res.tdeeR)} kcal</b><span>Basal × ${fmtN(inp.act)} (cálculo antigo; revise o plano para usar o novo).</span></li>`;
  h += `<details class="card how"><summary><span class="eyebrow">Como calculamos</span>${I.down}</summary>
    <ol class="how-l">
      <li><b>Metabolismo basal: ${fmtK(res.bmr)} kcal</b><span>${res.method}${res.lbm ? `, com massa magra de ${fmtN(Math.round(res.lbm * 10) / 10)} kg` : `, com ${fmtN(inp.kg)} kg, ${fmtN(inp.h)} cm e ${inp.age} anos`}. É o que o corpo gasta em repouso.</span></li>
      ${gasto}
      <li><b>${pl.goal === 'cut' ? 'Déficit' : pl.goal === 'gain' ? 'Superávit' : 'Manutenção'}${res.delta ? `: ${sgn(res.delta)}${fmtK(Math.abs(res.delta))} kcal` : ''}</b><span>${pl.goal === 'cut' ? `${fmtN(inp.rate)}% do peso por semana, usando a aproximação de 7.700 kcal por kg. Ritmo indicado para o seu corpo: ${fmtN(res.rec)}%.` : pl.goal === 'gain' ? `${inp.gain}% acima do gasto, para ganhar cerca de ${(GAIN_RATES.find(x => x.v === inp.gain) || {}).w}% do peso por semana.` : 'Calorias iguais ao gasto.'}${pl.adj ? ` Ajustes dos check-ins: ${sgn(pl.adj)}${fmtK(Math.abs(pl.adj))} kcal.` : ''}${res.floor ? ' Limitado para não ficar abaixo do basal.' : ''}</span></li>
      <li><b>Proteína: ${res.p} g</b><span>${res.pBasis}. Faixa com respaldo: ${res.plo} a ${res.phi} g.${res.refKg !== inp.kg && !res.lbm ? ' Acima de IMC 25, usamos o peso de referência (IMC 25) para não superestimar.' : ''}</span></li>
      <li><b>Gorduras: ${res.f} g · Carboidratos: ${res.c} g</b><span>Gordura em 25% das calorias (mínimo de 0,5 g/kg); carboidratos completam o restante (${fmtN(Math.round(res.cKg * 10) / 10)} g/kg).</span></li>
    </ol>
    <p class="tiny muted" style="margin:12px 0 0">Por que o gasto é calculado em partes: os fatores tradicionais ("sedentário", "moderado"...) misturam rotina e treino e costumam contar a musculação como se fosse corrida. Aqui a rotina parte do limite inferior medido em pessoas sedentárias com água duplamente marcada, e o treino entra pelo tempo real, com o desconto da compensação do corpo.</p>
    <p class="tiny muted" style="margin:8px 0 0">Referências: Mifflin et al. 1990; Frankenfield et al. 2005; Plucker et al. 2024; FAO/OMS/UNU 2004; Compendium of Physical Activities 2024; Tudor-Locke et al. 2013; Careau et al. 2021; Katch-McArdle; Hodgdon &amp; Beckett 1984; Morton et al. 2018; Schoenfeld &amp; Aragon 2018; Helms et al. 2014; Garthe et al. 2011; Iraki et al. 2019; Dietary Guidelines for Americans; EFSA 2010.</p></details>
  <section class="row wrap" style="justify-content:center;gap:4px"><button class="link muted" data-act="plan-edit">Refazer o plano</button><button class="link muted" data-act="plan-del">Apagar plano</button></section>
  <p class="tiny muted" style="text-align:center;margin:10px 8px 0">Estimativas para adultos saudáveis. Não substitui nutricionista ou médico, principalmente com condições de saúde, gestação ou uso de medicamentos.</p>`;
  return h;
}
/* ---------- ações ---------- */
A['plan-open'] = () => { UI.pw = null; push({type: 'plano'}); };
A['plan-later'] = () => { lsSet('forja.planHide', isoDate(addDays(new Date(), 21))); render(); toast('Tudo bem. O assistente fica no seu Perfil.'); };
A['plan-edit'] = () => { pwInit(); render(); window.scrollTo({top: 0}); };
A['pw-goal'] = el => { UI.pw.goal = el.dataset.v; render(); };
A['pw-sex'] = el => { pwKeep(); UI.pw.sex = el.dataset.v; render(); };
A['pw-bf'] = el => { pwKeep(); UI.pw.bfMode = el.dataset.v; render(); if (el.dataset.v === 'manual') setTimeout(() => $('#pw-bf')?.focus(), 30); };
A['pw-job'] = el => { UI.pw.job = el.dataset.v; render(); };
A['pw-steps'] = el => { UI.pw.steps = +el.dataset.v; render(); };
A['pw-tsess'] = el => { UI.pw.tSess = +el.dataset.v; render(); };
A['pw-tmin'] = el => { UI.pw.tMin = +el.dataset.v; render(); };
A['pw-tmet'] = el => { UI.pw.tMet = +el.dataset.v; render(); };
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
A['cal-open'] = () => calSheet();
A['cal-w'] = el => { document.querySelectorAll('#cal-w button').forEach(b => b.setAttribute('aria-pressed', b === el)); UI.sheet.wk = +el.dataset.v; };
A['cal-save'] = () => { const k = parseNum($('#cal-k').value); const pl = ST.prefs.plan; const wk = UI.sheet.wk ?? (pl.cal ? pl.cal.wk : null);
  if (!k || k < 800 || k > 6000){ toast('Informe as calorias médias por dia (entre 800 e 6.000).'); return; } if (wk == null){ toast('Escolha o que aconteceu com o peso.'); return; }
  pl.cal = {kcal: Math.round(k), wk}; pl.adj = 0; pl.ck = today(); saveState(); closeSheet(); render(); toast('Gasto calibrado pela sua experiência.'); };
A['cal-clear'] = () => { delete ST.prefs.plan.cal; saveState(); closeSheet(); render(); };
document.addEventListener('input', ev => { const t = ev.target; if (!t.dataset || !t.dataset.pw || !UI.pw) return; UI.pw[t.dataset.pw] = t.value; const st = pwSteps()[UI.pw.step]; if (st === 'body'){ const w = UI.pw; const ok = !!(w.sex && ageFrom(w.birth) && parseNum(w.h) > 100 && parseNum(w.h) < 250 && parseNum(w.kg) > 30 && parseNum(w.kg) < 300); const b = $('[data-act="pw-next"]'); if (b) b.disabled = !ok; } });
document.addEventListener('change', ev => { const t = ev.target; if (t.dataset && t.dataset.pw && UI.pw && (t.dataset.pw === 'birth' || t.dataset.pw === 'h')){ UI.pw[t.dataset.pw] = t.value; setTimeout(() => { if (!isTyping() && UI.pw) render(); }, 0); } });
