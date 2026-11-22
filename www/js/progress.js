// ================= Progresso (v4.23) =================
/* Três abas:
   Resumo     números do período comparados com o período anterior, destaques de evolução, treinos por semana e calendário.
   Exercícios lista com busca e filtro por músculo; cada linha já mostra a última série, a tendência e quanto mudou.
   Músculos   radar dos grupos (período atual × anterior), séries por semana de cada músculo com faixa de referência e mapa do corpo.
   Sem siglas: "1RM" vira "força estimada" e "volume" vira "total levantado", sempre com explicação curta. */

const PG_PER = [[7, '7 dias'], [30, '30 dias'], [90, '3 meses'], [365, '1 ano']];
const progPer = () => PG_PER.some(p => p[0] === UI.progPer) ? UI.progPer : 30;
const perLbl = n => (PG_PER.find(p => p[0] === n) || [0, ''])[1];
/* início (inclusivo) do período de n dias; k = 2 dá o início do período anterior */
const perStart = (n, k = 1) => isoDate(addDays(new Date(), -n * k + 1));
const PX_PER = [[30, '1 mês'], [90, '3 meses'], [365, '1 ano'], [0, 'Tudo']];

/* grupos largos do radar */
const BG = [['costas', 'Costas', ['costas']], ['ombros', 'Ombros', ['ombros']], ['abdomen', 'Abdômen', ['abdomen']], ['bracos', 'Braços', ['biceps', 'triceps', 'antebraco']], ['peito', 'Peito', ['peito']], ['pernas', 'Pernas', ['quadriceps', 'posteriores', 'gluteos', 'adutores', 'panturrilha']]];
const PG_MUSC = Object.keys(MUSC).filter(k => k !== 'cardio');
const BAND = [10, 20];   // séries por semana: faixa de referência para ganho de massa

/* histórico de um exercício, do mais antigo ao mais recente */
function exSeries(ex){
  return done().reverse().map(s => {
    const e = (s.items || []).find(e => e.ex === ex); if (!e) return null;
    const sets = workSets(e).filter(x => x.reps > 0); if (!sets.length) return null;
    const wk = sets.filter(x => x.kg > 0); let best = null;
    wk.forEach(x => { const v = e1rm(x.kg, x.reps); if (!best || v > best.v) best = {v, kg: x.kg, reps: x.reps}; });
    const top = wk.length ? wk.reduce((a, x) => x.kg > a.kg || (x.kg === a.kg && x.reps > a.reps) ? x : a) : sets.reduce((a, x) => x.reps > a.reps ? x : a);
    return {date: s.date, sid: s.id, sets, top, best, kg: wk.length ? top.kg : 0, rm: best ? best.v : 0, vol: wk.reduce((a, x) => a + x.kg * x.reps, 0), reps: Math.max(...sets.map(x => x.reps)), rt: sets.reduce((a, x) => a + x.reps, 0)};
  }).filter(Boolean);
}
const _exsC = {v: null, n: -1};
function exSeriesCached(ex){ const n = done().length + ':' + SESS.length; if (_exsC.n !== n){ _exsC.v = {}; _exsC.n = n; } return _exsC.v[ex] || (_exsC.v[ex] = exSeries(ex)); }
const byReps = H => H.length && H.every(h => !h.kg);   // exercício só com peso do corpo
const PX_M = {kg: ['Maior carga', 'kg', 'A carga mais alta que você usou em cada treino.'], rm: ['Força estimada', 'kg', 'Quanto você levantaria numa única repetição, calculado a partir das suas séries (fórmula de Epley). Serve para comparar treinos com repetições diferentes.'], vol: ['Total levantado', 'kg', 'Carga × repetições de todas as séries do exercício, somadas. Mostra quanto trabalho você fez.'], reps: ['Mais repetições', 'reps', 'O maior número de repetições numa série.'], rt: ['Repetições no treino', 'reps', 'Todas as repetições do exercício no treino, somadas.']};
const pxMetrics = H => byReps(H) ? ['reps', 'rt'] : ['kg', 'rm', 'vol'];
const setTxt = x => x.kg > 0 ? `${fmtN(x.kg)} kg × ${x.reps}` : `${x.reps} reps`;

/* variação no período: do último registro antes do período (ou do primeiro dentro) até o último */
function exDelta(H, m, start){
  const inP = start ? H.filter(h => h.date >= start) : H; if (!inP.length) return null;
  const before = start ? H.filter(h => h.date < start) : []; const a = before.length ? before[before.length - 1] : inP[0]; const b = inP[inP.length - 1];
  return {d: r1(b[m] - a[m]), a, b, only: a === b};
}
function dBadge(dl, unit){
  if (!dl) return '<span class="pg-d flat">sem treino</span>';
  if (dl.only) return '<span class="pg-d flat">1º registro</span>';
  if (!dl.d) return '<span class="pg-d flat">igual</span>';
  return `<span class="pg-d ${dl.d > 0 ? 'up' : 'down'}">${dl.d > 0 ? '+' : '−'}${fmtN(Math.abs(dl.d))} ${unit}</span>`;
}
function spark(vals){
  if (vals.length < 2) return '<svg class="pg-spark" viewBox="0 0 60 24" aria-hidden="true"></svg>';
  let lo = Math.min(...vals), hi = Math.max(...vals); if (hi === lo){ hi += 1; lo -= 1; }
  const pts = vals.map((v, i) => [2 + i * 56 / (vals.length - 1), 21 - (v - lo) / (hi - lo) * 18]);
  const up = vals[vals.length - 1] >= vals[0];
  return `<svg class="pg-spark ${up ? 'up' : 'down'}" viewBox="0 0 60 24" aria-hidden="true"><path d="${pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('')}"/><circle cx="${pts[pts.length - 1][0].toFixed(1)}" cy="${pts[pts.length - 1][1].toFixed(1)}" r="2.4"/></svg>`;
}
const perChips = (act, cur, list = PG_PER) => `<div class="chips pg-per" role="group" aria-label="Período">${list.map(([v, l]) => `<button class="chip" data-act="${act}" data-v="${v}" aria-pressed="${cur === v}">${l}</button>`).join('')}</div>`;

function vProgress(){
  const t = ['resumo', 'ex', 'mus'].includes(UI.progTab) ? UI.progTab : 'resumo';
  return `<section style="margin-top:20px"><h1 class="display h1">Progresso</h1></section><section class="seg" role="tablist">${[['resumo', 'Resumo'], ['ex', 'Exercícios'], ['mus', 'Músculos']].map(([k, l]) => `<button role="tab" data-act="progtab" data-t="${k}" aria-pressed="${t === k}">${l}</button>`).join('')}</section>${t === 'ex' ? progExTab() : t === 'mus' ? progMusTab() : progResumo()}`;
}

// ---------- Resumo ----------
const fmtDur = m => m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? pad(m % 60) : ''}` : `${m} min`;
function cmpTxt(a, b, per, unit = ''){
  if (!b && !a) return '';
  const d = a - b; const lbl = `vs. ${per === 7 ? '7 dias' : per === 30 ? '30 dias' : per === 90 ? '3 meses' : 'ano'} anteriores`;
  if (!d) return `<span class="pg-cmp">igual ${lbl}</span>`;
  return `<span class="pg-cmp ${d > 0 ? 'up' : 'down'}">${d > 0 ? '+' : '−'}${unit === 'min' ? fmtDur(Math.abs(d)) : fmtInt(Math.abs(d))} ${lbl}</span>`;
}
function progResumo(){
  const per = progPer(); const st = perStart(per), pst = perStart(per, 2); const D = done();
  const cur = D.filter(s => s.date >= st), prev = D.filter(s => s.date >= pst && s.date < st);
  const sum = (L, f) => L.reduce((a, s) => a + (f(s) || 0), 0);
  const mins = L => sum(L, s => sessMins(s)); const sets = L => sum(L, s => stats(s).sets); const prs = L => new Set(L.flatMap(s => sessionPRs(s).map(x => x.ex))).size;
  const k = (lbl, val, cmp, cls = '') => `<div class="pg-kpi ${cls}"><span class="pg-kl">${lbl}</span><b class="num">${val}</b>${cmp}</div>`;
  const nC = cur.length, mC = mins(cur), sC = sets(cur), pC = prs(cur);
  let h = `<section>${perChips('pg-per', per)}</section><section class="pg-kpis">
    ${k('Treinos', nC, cmpTxt(nC, prev.length, per))}
    ${k('Tempo treinando', mC ? fmtDur(mC) : '0 min', cmpTxt(mC, mins(prev), per, 'min'))}
    ${k('Séries feitas', fmtInt(sC), cmpTxt(sC, sets(prev), per))}
    ${k('Recordes', pC, pC ? `<span class="pg-cmp">${pC === 1 ? 'exercício superou' : 'exercícios superaram'} sua melhor marca</span>` : '<span class="pg-cmp">nenhuma marca nova no período</span>', pC ? 'hot' : '')}</section>`;
  // destaques: exercícios que mais subiram de carga no período
  const exs = [...new Set(cur.flatMap(s => (s.items || []).map(e => e.ex)))];
  const gains = exs.map(ex => { const H = exSeriesCached(ex); if (byReps(H)) return null; const dl = exDelta(H, 'kg', st); return dl && !dl.only && dl.d > 0 ? {ex, dl, pct: dl.d / (dl.a.kg || 1)} : null; }).filter(Boolean).sort((a, b) => b.pct - a.pct).slice(0, 4);
  h += `<section class="card pg-card"><div class="sec-head"><span class="eyebrow">Onde você mais evoluiu</span>${exs.length ? `<button class="link" data-act="progtab" data-t="ex">Ver todos</button>` : ''}</div>
    ${gains.length ? `<div class="list flush">${gains.map(g => `<button class="li" data-act="open-progex" data-ex="${g.ex}">${thumb(g.ex)}<div class="grow"><b>${esc(exName(g.ex))}</b><span class="sub">${fmtN(g.dl.a.kg)} kg → ${fmtN(g.dl.b.kg)} kg</span></div><span class="pg-d up big">+${fmtN(g.dl.d)} kg</span></button>`).join('')}</div>`
      : `<p class="small muted" style="margin:6px 0 0">${nC ? 'Nenhum exercício subiu de carga neste período. Quando você aumentar o peso de um exercício, ele aparece aqui.' : 'Nenhum treino neste período ainda.'}</p>`}</section>`;
  // treinos por semana
  const now = new Date(); const mon = mondayOf(now); const r = activeRoutine();
  const weeks = [...Array(8)].map((_, i) => { const a = addDays(mon, -7 * (7 - i)); return {a, n: D.filter(s => s.date >= isoDate(a) && s.date <= isoDate(addDays(a, 6))).length}; });
  const goal = r ? r.workouts.length : 0; const maxN = Math.max(goal + 1, 4, ...weeks.map(w => w.n)); const avg = weeks.slice(0, 7).reduce((a, w) => a + w.n, 0) / 7;
  const yb = v => 116 - v / maxN * 92;
  h += `<section class="card pg-card"><div class="sec-head"><span class="eyebrow">Treinos por semana</span><span class="tiny muted">média ${fmtN(r1(avg))} por semana</span></div>
    <svg class="chart" viewBox="0 0 360 150" role="img" aria-label="Treinos por semana nas últimas 8 semanas">${goal ? `<line x1="4" x2="356" y1="${yb(goal)}" y2="${yb(goal)}" stroke="var(--good)" stroke-width="1.4" stroke-dasharray="4 5"/><text x="356" y="${yb(goal) - 6}" text-anchor="end" font-size="10.5" font-weight="700" fill="var(--good)">meta ${goal}</text>` : ''}${weeks.map((w, i) => { const x = 10 + i * 43; const hh = w.n / maxN * 92; const hit = goal && w.n >= goal; return `<rect x="${x}" y="${116 - hh}" width="32" height="${Math.max(hh, 3)}" rx="8" fill="${i === 7 ? 'var(--ember)' : hit ? 'var(--good)' : 'var(--s3)'}"><title>${w.n} treinos</title></rect><text x="${x + 16}" y="${110 - hh}" text-anchor="middle" font-size="12" font-weight="800" fill="var(--ink)">${w.n || ''}</text><text x="${x + 16}" y="136" text-anchor="middle" font-size="10" fill="var(--muted)">${i === 7 ? 'atual' : fmtD(isoDate(w.a))}</text>`; }).join('')}</svg>
    ${goal ? `<p class="tiny muted" style="margin:2px 0 0">Verde: semanas em que você cumpriu os ${goal} treinos do ${esc(r.nome)}.</p>` : ''}</section>`;
  return h + progCalendar();
}

// ---------- Exercícios ----------
function progExList(){
  const per = progPer(); const st = perStart(per); const q = norm((UI.progQ || '').trim());
  const seen = new Map(); done().forEach(s => (s.items || []).forEach(e => { if (!seen.has(e.ex) && workSets(e).some(x => x.reps > 0)) seen.set(e.ex, s.date); }));
  return [...seen.keys()].filter(k => (!UI.progM || getEx(k).m === UI.progM) && (!q || norm(exName(k)).includes(q))).map(k => ({k, H: exSeriesCached(k), st}));
}
function progExRow(k, H, st){
  const last = H[H.length - 1]; if (!last) return '';
  const m = byReps(H) ? 'reps' : 'kg'; const u = m === 'kg' ? 'kg' : 'reps';
  return `<button class="li pg-row" data-act="open-progex" data-ex="${k}">${thumb(k)}<div class="grow"><b>${esc(exName(k))}</b><span class="sub">${setTxt(last.top)} · ${relDay(last.date)}</span></div><span class="pg-tr">${spark(H.slice(-8).map(h => h[m]))}${dBadge(exDelta(H, m, st), u)}</span></button>`;
}
function progExRows(){
  const L = progExList(); if (!L.length) return `<p class="small muted" style="padding:18px 16px;margin:0">${UI.progQ ? 'Nenhum exercício com esse nome nos seus treinos.' : 'Nenhum exercício deste músculo nos seus treinos.'}</p>`;
  return L.map(x => progExRow(x.k, x.H, x.st)).join('');
}
function progExTab(){
  const any = done().some(s => (s.items || []).some(e => workSets(e).some(x => x.reps > 0)));
  if (!any) return `<section class="empty"><b>Sua evolução aparece aqui</b>Registre carga e repetições num treino. Cada exercício ganha uma linha com a última série e quanto você evoluiu.</section>`;
  const per = progPer(); const has = new Set(); done().forEach(s => (s.items || []).forEach(e => { if (workSets(e).length) has.add(getEx(e.ex).m); }));
  if (UI.progM && !has.has(UI.progM)) UI.progM = null;
  return `<section>${perChips('pg-per', per)}</section><section class="stack" style="gap:10px"><div class="search">${svg('M11 17.5a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13zM20 20l-4.2-4.2')}<input class="field" type="search" placeholder="Buscar exercício" value="${esc(UI.progQ || '')}" data-act="progq" aria-label="Buscar exercício"></div>
    <div class="chips" role="group" aria-label="Músculo"><button class="chip" data-act="pg-m" data-v="" aria-pressed="${!UI.progM}">Todos</button>${PG_MUSC.filter(g => has.has(g)).map(g => `<button class="chip" data-act="pg-m" data-v="${g}" aria-pressed="${UI.progM === g}">${MUSC[g]}</button>`).join('')}</div></section>
    <p class="tiny muted pg-note">Ao lado de cada exercício: a tendência dos últimos treinos e quanto a maior carga mudou em ${perLbl(per)}.</p>
    <section class="list pg-list" id="prog-list">${progExRows()}</section>`;
}

/* página de progresso de um exercício (também usada na aba Histórico do exercício) */
function progExBody(ex){
  const H = exSeriesCached(ex);
  if (!H.length) return '<section class="empty"><b>Sem registros ainda</b>Faça este exercício num treino para ver a evolução.</section>';
  const ms = pxMetrics(H); const m = ms.includes(UI.pxM) ? UI.pxM : ms[0]; const [lbl, u, help] = PX_M[m];
  const per = PX_PER.some(p => p[0] === UI.pxPer) ? UI.pxPer : 0; const st = per ? perStart(per) : null;
  const P = st ? H.filter(h => h.date >= st) : H; const dl = exDelta(H, m, st); const lastV = P.length ? P[P.length - 1][m] : null;
  const wk = H.flatMap(h => h.sets.filter(x => x.kg > 0).map(x => ({...x, date: h.date})));
  const maxKg = wk.length ? wk.reduce((a, x) => x.kg > a.kg || (x.kg === a.kg && x.reps > a.reps) ? x : a) : null;
  const bestRm = H.reduce((a, h) => h.rm > (a ? a.rm : 0) ? h : a, null); const bestVol = H.reduce((a, h) => h.vol > (a ? a.vol : 0) ? h : a, null);
  const bestReps = H.flatMap(h => h.sets.map(x => ({...x, date: h.date}))).reduce((a, x) => !a || x.reps > a.reps ? x : a, null);
  const rec = (t, v, sub) => `<div class="pg-rec-i"><span class="pg-kl">${t}</span><b class="num">${v}</b><span class="tiny muted">${sub}</span></div>`;
  const recs = byReps(H) ? [rec('Mais repetições', `${bestReps.reps}`, `numa série · ${fmtD(bestReps.date)}`), rec('Treinos', H.length, `desde ${fmtD(H[0].date)}`)]
    : [rec('Maior carga', `${fmtN(maxKg.kg)} kg`, `× ${maxKg.reps} · ${fmtD(maxKg.date)}`), rec('Força estimada', `${fmtN(r1(bestRm.rm))} kg`, `com ${fmtN(bestRm.best.kg)} kg × ${bestRm.best.reps} · ${fmtD(bestRm.date)}`), rec('Total num treino', fmtVol(bestVol.vol), fmtD(bestVol.date)), rec('Treinos', H.length, `desde ${fmtD(H[0].date)}`)];
  // maior carga para pelo menos N repetições
  const RB = [1, 3, 5, 8, 10, 12, 15, 20]; const repRows = byReps(H) ? [] : RB.map(n => { const c = wk.filter(x => x.reps >= n); if (!c.length) return null; const b = c.reduce((a, x) => x.kg > a.kg ? x : a); return {n, b}; }).filter(Boolean).filter((r, i, a) => !a[i + 1] || a[i + 1].b.kg < r.b.kg || i === a.length - 1);
  let h = `<section class="seg pg-mseg" role="group" aria-label="Medida">${ms.map(k => `<button data-act="px-m" data-v="${k}" aria-pressed="${m === k}">${PX_M[k][0]}</button>`).join('')}</section>
  <section class="card pg-card">
    <div class="pg-big"><div><span class="pg-kl">${lbl} ${per ? `· ${PX_PER.find(p => p[0] === per)[1].toLowerCase()}` : ''}</span><b class="num">${lastV != null ? fmtN(r1(lastV)) : '–'}<small> ${u}</small></b></div>${dl ? dBadge(dl, u).replace('pg-d', 'pg-d big') : ''}</div>
    <p class="tiny muted" style="margin:4px 0 10px">${dl && !dl.only ? `${dl.d > 0 ? 'Subiu' : dl.d < 0 ? 'Caiu' : 'Ficou igual'} desde ${fmtD(dl.a.date)} (${fmtN(r1(dl.a[m]))} ${u}). ` : ''}${help}</p>
    ${P.length > 1 ? lineChart(P.map(x => ({date: x.date, v: x[m]})), u) : `<p class="small muted" style="margin:0">${P.length ? 'Só um treino neste período: a linha aparece a partir do segundo.' : 'Nenhum treino deste exercício neste período.'}</p>`}
    ${perChips('px-per', per, PX_PER)}</section>
  <section><div class="sec-head"><span class="eyebrow">Recordes</span></div><div class="pg-rec">${recs.join('')}</div></section>`;
  if (repRows.length > 1) h += `<section class="card pg-card"><div class="eyebrow">Maior carga por repetições</div><p class="tiny muted" style="margin:4px 0 10px">A carga mais alta que você já fez para pelo menos esse número de repetições.</p><div class="pg-reps">${repRows.map(r => `<div><span>${r.n} ${r.n === 1 ? 'rep' : 'reps'}</span><b class="num">${fmtN(r.b.kg)} kg</b><em>${r.b.reps > r.n ? `fez ${r.b.reps} · ` : ''}${fmtD(r.b.date)}</em></div>`).join('')}</div></section>`;
  const bestKey = byReps(H) ? null : bestRm.date;
  h += `<section><div class="sec-head"><span class="eyebrow">Histórico</span><span class="tiny muted">${H.length} ${H.length === 1 ? 'treino' : 'treinos'}</span></div><div class="list pg-hist">${H.slice().reverse().slice(0, 40).map(x => `<button class="li" data-act="open-past" data-sid="${x.sid}"><div class="grow"><b>${fmtD(x.date)}${x.date === bestKey ? ' <span class="pg-pr">recorde</span>' : ''}</b><span class="pg-sets">${x.sets.map(y => `<i>${y.kg > 0 ? `${fmtN(y.kg)}<small>×</small>${y.reps}` : `${y.reps}<small> reps</small>`}</i>`).join('')}</span></div>${I.chev}</button>`).join('')}</div></section>`;
  return h;
}
PAGES.progex = {title: p => exName(p.ex), view: p => {
  const e = getEx(p.ex);
  return `<section class="pg-exhead">${thumb(p.ex)}<div class="grow"><div class="eyebrow">${MUSC[e.m] || ''} · ${EQUIP[e.e] || ''}</div><h1 class="display h2" style="margin-top:4px">${esc(e.n)}</h1></div><button class="btn sm" data-act="open-ex" data-ex="${p.ex}">Como fazer</button></section>${progExBody(p.ex)}`;
}};

// ---------- Músculos ----------
function setsByMusc(L){ const o = {}; L.forEach(s => (s.items || []).forEach(e => { const n = workSets(e).length; if (!n) return; const g = getEx(e.ex).m; o[g] = (o[g] || 0) + n; })); return o; }
function radar(cur, prev, lblCur, lblPrev){
  const W = 360, H = 290, cx = 180, cy = 145, R = 82; const n = BG.length;
  const vC = BG.map(g => g[2].reduce((a, k) => a + (cur[k] || 0), 0)), vP = BG.map(g => g[2].reduce((a, k) => a + (prev[k] || 0), 0));
  const mx = Math.max(4, ...vC, ...vP); const ang = i => (-120 + i * 360 / n) * Math.PI / 180;
  const pt = (i, f) => [cx + Math.cos(ang(i)) * R * f, cy + Math.sin(ang(i)) * R * f];
  const poly = v => v.map((x, i) => pt(i, Math.max(.04, x / mx)).map(c => c.toFixed(1)).join(',')).join(' ');
  const rings = [.25, .5, .75, 1].map(f => `<polygon points="${BG.map((_, i) => pt(i, f).map(c => c.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="var(--line)"/>`).join('');
  const axes = BG.map((_, i) => { const [x, y] = pt(i, 1); return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="var(--line)"/>`; }).join('');
  const labels = BG.map((g, i) => { const [x, y] = pt(i, 1.3); const c = Math.cos(ang(i)); const anchor = c > .3 ? 'start' : c < -.3 ? 'end' : 'middle'; const d = vC[i] - vP[i];
    return `<text x="${x.toFixed(1)}" y="${(y - 6).toFixed(1)}" text-anchor="${anchor}" font-size="12.5" font-weight="600" fill="var(--ink2)">${g[1]}</text><text x="${x.toFixed(1)}" y="${(y + 14).toFixed(1)}" text-anchor="${anchor}" font-size="17" font-weight="800" fill="var(--ink)">${vC[i]}<tspan font-size="11" font-weight="700" fill="${d > 0 ? 'var(--good)' : d < 0 ? 'var(--muted)' : 'var(--faint)'}"> ${d ? (d > 0 ? '+' : '−') + Math.abs(d) : ''}</tspan></text>`; }).join('');
  return `<svg class="chart pg-radar" viewBox="0 0 ${W} ${H}" role="img" aria-label="Séries por grupo muscular: ${BG.map((g, i) => `${g[1]} ${vC[i]}`).join(', ')}">${rings}${axes}
    <polygon points="${poly(vP)}" fill="none" stroke="var(--muted)" stroke-width="1.6" stroke-dasharray="4 4"/>
    <polygon points="${poly(vC)}" fill="var(--ember)" fill-opacity=".22" stroke="var(--ember)" stroke-width="2.4" stroke-linejoin="round"/>
    ${vC.map((v, i) => { const [x, y] = pt(i, Math.max(.04, v / mx)); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.6" fill="var(--ember)"/>`; }).join('')}${labels}</svg>
    <div class="pg-leg"><span><i class="c"></i>${lblCur}</span><span><i class="p"></i>${lblPrev}</span></div>`;
}
function bandBar(v){
  const MAX = 26; const cls = v >= BAND[0] && v <= BAND[1] ? 'ok' : v > BAND[1] ? 'hi' : v >= 5 ? 'mid' : 'lo';
  return `<span class="pg-band"><span class="pg-zone" style="left:${BAND[0] / MAX * 100}%;width:${(BAND[1] - BAND[0]) / MAX * 100}%"></span><i class="${cls}" style="width:${Math.min(100, v / MAX * 100)}%"></i></span>`;
}
function progMusTab(){
  const per = progPer(); const st = perStart(per), pst = perStart(per, 2); const D = done();
  const cur = D.filter(s => s.date >= st), prev = D.filter(s => s.date >= pst && s.date < st);
  const sc = setsByMusc(cur), sp = setsByMusc(prev); const wks = per / 7;
  const prevLbl = per === 7 ? '7 dias anteriores' : per === 30 ? '30 dias anteriores' : per === 90 ? '3 meses anteriores' : 'ano anterior';
  let h = `<section>${perChips('pg-per', per)}</section><section class="card pg-card"><div class="sec-head"><span class="eyebrow">Séries por grupo muscular</span><span class="tiny muted">${perLbl(per)}</span></div>${radar(sc, sp, perLbl(per) === '1 ano' ? 'Último ano' : 'Últimos ' + perLbl(per), prevLbl)}
    <p class="tiny muted" style="margin:6px 0 0">Quanto mais longe do centro, mais séries o grupo recebeu. O número pequeno mostra a diferença para o período anterior.</p></section>`;
  const rows = PG_MUSC.map(g => ({g, v: (sc[g] || 0) / wks}));
  h += `<section class="card pg-card"><div class="eyebrow">Séries por semana</div><p class="tiny muted" style="margin:4px 0 12px">Média de séries por semana em ${perLbl(per)}. A faixa verde vai de ${BAND[0]} a ${BAND[1]}, a referência mais usada para ganho de massa.</p>
    <div class="pg-mlist">${rows.map(({g, v}) => `<button class="pg-mrow" data-act="open-progmus" data-g="${g}"><span class="pg-mn">${MUSC[g]}</span>${bandBar(v)}<span class="num pg-mv">${fmtN(r1(v))}</span>${I.chev}</button>`).join('')}</div>
    <p class="tiny muted" style="margin:12px 0 0">Conta as séries do músculo principal de cada exercício, sem aquecimento. Toque num músculo para ver semana a semana e os exercícios dele.</p></section>`;
  const r = activeRoutine();
  if (r){
    const mon = mondayOf(new Date()); const tgt = {}; r.workouts.forEach(w => w.items.forEach(x => { const g = getEx(x.ex).m; tgt[g] = (tgt[g] || 0) + x.sets; }));
    const got = setsByMusc(D.filter(s => s.date >= isoDate(mon))); const rr = Object.keys(MUSC).filter(g => tgt[g] || got[g]);
    if (rr.length) h += `<section class="card pg-card"><div class="eyebrow">Esta semana no seu programa</div><p class="tiny muted" style="margin:4px 0 14px">Séries feitas / previstas no ${esc(r.nome)}</p><div class="stack" style="gap:10px">${rr.map(g => `<div class="mbar"><span>${MUSC[g]}</span><span class="track"><i class="${tgt[g] && (got[g] || 0) >= tgt[g] ? 'full' : ''}" style="width:${tgt[g] ? Math.min(100, (got[g] || 0) / tgt[g] * 100) : 100}%"></i></span><span class="num">${got[g] || 0}/${tgt[g] || 0}</span></div>`).join('')}</div></section>`;
  }
  h += `<section class="card pg-card"><div class="eyebrow" style="margin-bottom:10px">Mapa do corpo · ${perLbl(per)}</div>${heatBlock(regionLevels(cur))}</section>`;
  return h;
}
PAGES.progmus = {title: p => MUSC[p.g] || 'Músculo', view: p => {
  const g = p.g; const D = done(); const mon = mondayOf(new Date());
  const weeks = [...Array(12)].map((_, i) => { const a = addDays(mon, -7 * (11 - i)); const L = D.filter(s => s.date >= isoDate(a) && s.date <= isoDate(addDays(a, 6))); return {a, n: setsByMusc(L)[g] || 0}; });
  const mx = Math.max(BAND[1] + 4, ...weeks.map(w => w.n)); const yb = v => 120 - v / mx * 100; const avg = weeks.slice(0, 11).reduce((a, w) => a + w.n, 0) / 11;
  const chart = `<svg class="chart" viewBox="0 0 360 150" role="img" aria-label="Séries de ${MUSC[g]} por semana"><rect x="4" y="${yb(BAND[1])}" width="352" height="${yb(BAND[0]) - yb(BAND[1])}" fill="var(--good)" fill-opacity=".1"/><text x="356" y="${yb(BAND[1]) + 12}" text-anchor="end" font-size="10" fill="var(--good)">${BAND[0]}–${BAND[1]}</text>${weeks.map((w, i) => { const x = 8 + i * 29.4; const hh = 120 - yb(w.n); const ok = w.n >= BAND[0] && w.n <= BAND[1]; return `<rect x="${x}" y="${yb(w.n)}" width="22" height="${Math.max(hh, 2)}" rx="6" fill="${i === 11 ? 'var(--ember)' : ok ? 'var(--good)' : 'var(--s3)'}"><title>${w.n} séries</title></rect>${w.n ? `<text x="${x + 11}" y="${yb(w.n) - 5}" text-anchor="middle" font-size="10.5" font-weight="800" fill="var(--ink)">${w.n}</text>` : ''}${i % 3 === 2 || i === 11 ? `<text x="${x + 11}" y="140" text-anchor="middle" font-size="9.5" fill="var(--muted)">${i === 11 ? 'atual' : fmtD(isoDate(w.a))}</text>` : ''}`; }).join('')}</svg>`;
  const exs = []; D.forEach(s => (s.items || []).forEach(e => { if (getEx(e.ex).m === g && !exs.includes(e.ex) && workSets(e).some(x => x.reps > 0)) exs.push(e.ex); }));
  const st = perStart(progPer());
  return `<section class="pg-kpis three" style="margin-top:14px"><div class="pg-kpi"><span class="pg-kl">Esta semana</span><b class="num">${weeks[11].n}</b><span class="pg-cmp">séries</span></div><div class="pg-kpi"><span class="pg-kl">Média semanal</span><b class="num">${fmtN(r1(avg))}</b><span class="pg-cmp">últimas 11 semanas</span></div><div class="pg-kpi"><span class="pg-kl">Exercícios</span><b class="num">${exs.length}</b><span class="pg-cmp">já feitos</span></div></section>
    <section class="card pg-card"><div class="eyebrow">Séries por semana</div><p class="tiny muted" style="margin:4px 0 8px">Verde: semanas dentro da faixa de ${BAND[0]} a ${BAND[1]} séries.</p>${chart}</section>
    <section class="card pg-card"><div class="eyebrow" style="margin-bottom:8px">Músculos trabalhados</div>${heatBlock(regionLevels(D.filter(s => s.date >= perStart(30)).map(s => ({...s, items: (s.items || []).filter(e => getEx(e.ex).m === g)}))))}</section>
    <section><div class="sec-head"><span class="eyebrow">Exercícios de ${esc((MUSC[g] || '').toLowerCase())}</span><span class="tiny muted">variação em ${perLbl(progPer())}</span></div><div class="list pg-list">${exs.length ? exs.map(k => progExRow(k, exSeriesCached(k), st)).join('') : '<p class="small muted" style="padding:16px;margin:0">Nenhum exercício deste músculo registrado ainda.</p>'}</div></section>`;
}};

A['pg-per'] = el => { UI.progPer = +el.dataset.v; render(); };
A['pg-m'] = el => { UI.progM = el.dataset.v || null; render(); };
A['px-m'] = el => { UI.pxM = el.dataset.v; render(); };
A['px-per'] = el => { UI.pxPer = +el.dataset.v; render(); };
A['open-progex'] = el => push({type: 'progex', ex: el.dataset.ex});
A['open-progmus'] = el => push({type: 'progmus', g: el.dataset.g});
