/* Aba Corpo (v4.17): título e explicação, fotos de evolução e três partes: Peso, Medidas e Nutrição.
   Fotos de evolução: registros "photo" do Store (imagem JPEG reduzida + miniatura). Com conta, sincronizam
   como o resto; sem conta, ficam neste aparelho. Não entram no backup em arquivo. */

/* lista em memória, montada dos registros (mais recente primeiro) */
function photoList(){ return Store.recs('photo').map(r => ({id: r.id, ...r.data})).sort((a, b) => b.date.localeCompare(a.date) || (b.at || '').localeCompare(a.at || '')); }
function photosChanged(){ UI.photos = null; }
const getPhotos = () => UI.photos || (UI.photos = photoList());
const photoById = id => { const r = Store.recs('photo').find(x => x.id === id); return r ? {id, ...r.data} : null; };
const PHOTO_MAX_FILE = 20 * 1024 * 1024; const PHOTO_MAX_LEN = 230000; const THUMB_MAX_LEN = 38000;
const photoCloud = () => Store.mode === 'cloud' || Store.mode === 'api';
/* reduz a imagem: lado maior até max px (ou recorte 3:4 para a miniatura), JPEG dentro do limite de tamanho */
async function imgJpeg(f, max, q, crop34, lim){
  let src, close = () => {};
  try { src = await createImageBitmap(f, {imageOrientation: 'from-image'}); close = () => src.close && src.close(); }
  catch (e) { const url = URL.createObjectURL(f); src = await new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = url; }); close = () => URL.revokeObjectURL(url); }
  try {
    const w = src.width, h = src.height; if (!w || !h) throw new Error('vazia');
    let out = '';
    for (const [k, qq] of [[1, q], [1, q - .1], [.85, q - .14], [.7, q - .18], [.55, q - .22]]){
      const m = Math.round(max * k); let sx = 0, sy = 0, sw = w, sh = h, cw, ch;
      if (crop34){ const r = 3 / 4; if (w / h > r){ sw = h * r; sx = (w - sw) / 2; } else { sh = w / r; sy = (h - sh) / 2; } cw = m; ch = Math.round(m / r); }
      else { const z = Math.min(1, m / Math.max(w, h)); cw = Math.round(w * z); ch = Math.round(h * z); }
      const c = document.createElement('canvas'); c.width = cw; c.height = ch; const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(src, sx, sy, sw, sh, 0, 0, cw, ch);
      out = c.toDataURL('image/jpeg', qq); if (out.length <= lim) break;
    }
    if (!/^data:image\/jpeg;base64,/.test(out) || out.length > lim) throw new Error('grande');
    return out;
  } finally { close(); }
}
async function addPhoto(f){
  if (!/^image\//.test(f.type || '') && !/\.(jpe?g|png|webp|heic|heif|avif)$/i.test(f.name || '')){ toast('Escolha uma imagem (JPG, PNG ou WEBP).'); return; }
  if (f.size > PHOTO_MAX_FILE){ toast('Imagem grande demais. O limite é 20 MB.'); return; }
  toast('Preparando a foto…');
  try {
    const [img, th] = await Promise.all([imgJpeg(f, 1080, .8, false, PHOTO_MAX_LEN), imgJpeg(f, 300, .74, true, THUMB_MAX_LEN)]);
    Store.putRec('photo', uid('ph'), {date: today(), at: new Date().toISOString(), th, img}); UI.photos = null;
    render(); Platform.haptic('success'); toast(photoCloud() ? 'Foto salva na sua conta' : 'Foto salva neste aparelho');
  } catch (e) { toast('Não consegui salvar essa imagem. Tente uma foto em JPG ou PNG.'); }
}
/* fotos da prévia 4.17 (guardadas à parte no aparelho) passam para os registros */
async function migratePhotosV417(){
  if (!window.indexedDB || lsGet('forja.phmig')) return;
  try {
    const dbs = indexedDB.databases ? await indexedDB.databases() : null; if (dbs && !dbs.some(d => d.name === 'forja-fotos')){ lsSet('forja.phmig', 1); return; }
    const db = await new Promise((ok, no) => { const r = indexedDB.open('forja-fotos', 1); r.onupgradeneeded = () => { r.transaction.abort(); }; r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });
    const all = (st) => new Promise((ok, no) => { const t = db.transaction(st, 'readonly'); const q = t.objectStore(st).getAll(); q.onsuccess = () => ok(q.result); q.onerror = () => no(q.error); });
    const [mini, full] = await Promise.all([all('mini'), all('full')]); const F = new Map(full.map(x => [x.id, x.img]));
    mini.forEach(m => { const img = F.get(m.id); if (img && img.length <= PHOTO_MAX_LEN && m.th) Store.putRec('photo', m.id, {date: m.date, at: m.at || new Date().toISOString(), th: m.th, img}); });
    db.close(); indexedDB.deleteDatabase('forja-fotos'); lsSet('forja.phmig', 1); UI.photos = null; if (mini.length) render();
  } catch (e) { lsSet('forja.phmig', 1); }
}
/* peso mais próximo de uma data (até 10 dias de distância) */
function kgNear(date){
  const t = new Date(date + 'T12:00').getTime(); let best = null, bd = Infinity;
  for (const p of bwSeries('kg')){ const d = Math.abs(new Date(p.date + 'T12:00').getTime() - t); if (d < bd){ bd = d; best = p; } }
  return best && bd <= 10 * 864e5 ? best.v : null;
}
function photoCard(){
  migratePhotosV417(); const L = getPhotos(); const n = L.length; const first = L[n - 1];
  const add = `<label class="ph-add" for="ph-in">${I.camera}<span>Adicionar foto</span></label>`;
  const thumbs = L.slice(0, 12).map(p => `<button class="ph-th" data-act="ph-open" data-id="${p.id}" aria-label="Foto de ${fmtD(p.date)}"><img src="${p.th}" alt=""><span>${fmtD(p.date)}</span></button>`).join('');
  return `<section class="card ph-card">
    <div class="row between" style="align-items:flex-start"><div class="grow"><div class="eyebrow">Fotos de evolução</div>
      <div class="small muted" style="margin-top:4px">${n ? `${n} ${n === 1 ? 'foto' : 'fotos'} · desde ${fmtD(first.date)}` : 'Uma por mês já mostra muita coisa que a balança não mostra.'}</div></div>
      ${n >= 2 ? `<button class="btn sm ghost" data-act="ph-compare">Comparar</button>` : ''}</div>
    <div class="ph-strip">${add}${thumbs}${n > 12 ? `<button class="ph-more" data-act="ph-all">+${n - 12}</button>` : ''}</div>
    ${!n ? '<p class="small ink2" style="margin:12px 0 0">Dica: mesma luz, mesma distância e a mesma roupa. Frente, lado e costas.</p>' : ''}
    <input id="ph-in" type="file" accept="image/*" data-act="ph-file" hidden>
    <p class="ph-note">* ${photoCloud() ? 'Fotos reduzidas e guardadas na sua conta. Só você vê.' : 'Fotos reduzidas e guardadas só neste aparelho. Só você vê.'}</p>
  </section>`;
}
async function openPhoto(id){
  const p = photoById(id); if (!p) return;
  const kg = kgNear(p.date); const L = getPhotos(); const first = L[L.length - 1];
  openSheet(`${sheetHead('Foto de evolução', fmtDLong(p.date))}
    <div class="ph-view"><img src="${p.img || p.th}" alt="Foto de ${fmtD(p.date)}"></div>
    <div class="row" style="gap:10px;margin-top:12px;align-items:flex-end"><label class="flabel grow"><span class="tiny muted">Data da foto</span><input class="field" type="date" value="${p.date}" max="${today()}" data-act="ph-date" data-id="${p.id}"></label>${kg != null ? `<div class="ph-kg"><span class="tiny muted">Peso perto dessa data</span><b class="num">${fmtN(kg)} kg</b></div>` : ''}</div>
    <div class="stack" style="margin-top:16px">${first && first.id !== p.id ? `<button class="btn ghost block" data-act="ph-compare" data-id="${p.id}">Comparar com a primeira</button>` : ''}<button class="btn danger block" data-act="ph-del" data-id="${p.id}">Apagar foto</button></div>`);
}
async function openCompare(id){
  const L = getPhotos(); if (L.length < 2) return;
  const a = L[L.length - 1]; const b = id ? L.find(x => x.id === id) : L[0]; if (!b || a.id === b.id) return;
  const days = Math.round((new Date(b.date) - new Date(a.date)) / 864e5); const ka = kgNear(a.date), kb = kgNear(b.date);
  const col = (p, k, t) => `<figure class="ph-cmp"><img src="${p.img || p.th}" alt="${t}, ${fmtD(p.date)}"><figcaption><b>${t}</b><span>${fmtD(p.date)}${k != null ? ` · ${fmtN(k)} kg` : ''}</span></figcaption></figure>`;
  openSheet(`${sheetHead('Antes e agora', days > 0 ? `${days} ${days === 1 ? 'dia' : 'dias'} de diferença` : 'Mesmo dia')}
    <div class="ph-cmp-row">${col(a, ka, 'Primeira')}${col(b, kb, b === L[0] ? 'Mais recente' : 'Escolhida')}</div>
    ${ka != null && kb != null ? `<p class="small ink2" style="margin:12px 0 0;text-align:center">Peso: ${kb - ka > 0 ? '+' : kb - ka < 0 ? '−' : ''}${fmtN(Math.abs(r1(kb - ka)))} kg no período</p>` : ''}`);
}

/* ---------- peso ---------- */
function wGoal(){
  const pl = ST.prefs.plan; if (pl && pl.target) return {kg: pl.target, from: pl.startKg || null, src: 'plan'};
  if (ST.prefs.wGoal) return {kg: ST.prefs.wGoal, from: ST.prefs.wGoalFrom || null, src: 'own'};
  return null;
}
const BMI_CAT = b => b < 18.5 ? {t: 'Abaixo do peso', c: 'var(--c1)'} : b < 25 ? {t: 'Peso adequado', c: 'var(--good)'} : b < 30 ? {t: 'Sobrepeso', c: 'var(--warn)'} : b < 35 ? {t: 'Obesidade grau I', c: 'var(--bad)'} : b < 40 ? {t: 'Obesidade grau II', c: 'var(--bad)'} : {t: 'Obesidade grau III', c: 'var(--bad)'};
function weightTab(){
  const pts = bwSeries('kg');
  if (!pts.length) return `<section class="empty"><b>Registre seu peso</b>Com o peso e a sua altura, o app calcula o IMC, a faixa de peso saudável e acompanha a meta.<button class="btn primary" style="margin-top:14px" data-act="bw-open" data-f="kg">Registrar peso</button></section>`;
  const lp = pts[pts.length - 1]; const cur = lp.v; const G = wGoal(); const pf = ST.profile || {}; const h = parseNum(pf.height); const age = ageFrom(pf.birth);
  const lim = isoDate(addDays(new Date(), -30)); const base = pts.filter(x => x.date <= lim).pop() || (pts.length > 1 ? pts[0] : null);
  const d30 = base && base !== lp ? r1(cur - base.v) : null; const sgn = v => v > 0 ? '+' : v < 0 ? '−' : '';
  const start = G && G.src === 'plan' && G.from ? G.from : pts[0].v;
  let goalBox = `<button class="wt-cell wt-goal" data-act="wgoal-open"><span>Meta</span><b>Definir</b><em>toque para escolher</em></button>`, diffBox = `<div class="wt-cell"><span>Desde o início</span><b class="num">${sgn(r1(cur - pts[0].v))}${fmtN(Math.abs(r1(cur - pts[0].v)))} kg</b><em>${fmtD(pts[0].date)}</em></div>`, prog = '';
  if (G){
    const diff = r1(G.kg - cur); const reached = Math.abs(diff) < .3 || (start > G.kg ? cur <= G.kg : start < G.kg ? cur >= G.kg : false);
    goalBox = `<button class="wt-cell wt-goal" data-act="wgoal-open"><span>Meta</span><b class="num">${fmtN(G.kg)} kg</b><em>${G.src === 'plan' ? 'do seu plano' : 'alterar'}</em></button>`;
    diffBox = `<div class="wt-cell"><span>Diferença</span><b class="num">${reached ? 'Atingida' : `${sgn(diff)}${fmtN(Math.abs(diff))} kg`}</b><em>${reached ? 'parabéns' : diff < 0 ? 'para perder' : 'para ganhar'}</em></div>`;
    const tot = G.kg - start; const pr = tot ? Math.max(0, Math.min(1, (cur - start) / tot)) : 1;
    prog = `<div class="wt-prog"><div class="goal-line"><div><b class="num">${fmtN(start)}</b><span>início</span></div><div class="gl-bar"><i style="width:${(pr * 100).toFixed(0)}%;background:var(--good)"></i><em style="left:${(pr * 100).toFixed(0)}%"></em></div><div style="text-align:right"><b class="num">${fmtN(G.kg)}</b><span>meta</span></div></div><p class="tiny muted" style="margin:8px 0 0">${Math.round(pr * 100)}% do caminho</p></div>`;
  }
  let h_ = `<section class="card wt-now">
    <div class="row between" style="align-items:flex-start"><div><div class="eyebrow">Peso atual</div><div class="wt-big"><b class="num">${fmtN(cur)}</b><span>kg</span></div>
      <div class="small muted">${relDay(lp.date)}${d30 != null ? ` · ${sgn(d30)}${fmtN(Math.abs(d30))} kg em ${base.date <= lim ? '30 dias' : 'relação à primeira pesagem'}` : ''}</div></div>
      <button class="btn sm primary" data-act="bw-open" data-f="kg">${I.plus}Registrar</button></div>
    <div class="wt-3">${goalBox}${diffBox}<div class="wt-cell"><span>Pesagens</span><b class="num">${pts.length}</b><em>desde ${fmtD(pts[0].date)}</em></div></div>${prog}</section>`;
  h_ += `<section class="card stack"><div class="row between"><div class="eyebrow">Evolução do peso</div>${pts.length > 1 ? `<button class="link" data-act="bw-metric" data-m="kg">Ver tudo</button>` : ''}</div>${pts.length > 1 ? lineChart(pts.slice(-40), 'kg', {goal: G && G.kg}) : '<p class="small muted" style="margin:0">O gráfico aparece a partir da segunda pesagem.</p>'}</section>`;
  if (!h) h_ += `<section class="card"><div class="eyebrow">IMC e peso saudável</div><p class="small ink2" style="margin:8px 0 12px">Informe sua altura no Perfil para calcular o IMC e a faixa de peso saudável para você.</p><button class="btn ghost block" data-act="profile">Informar altura</button></section>`;
  else {
    const m = h / 100; const bmi = cur / (m * m); const cat = BMI_CAT(bmi); const lo = 18.5 * m * m, hi = 24.9 * m * m;
    const pos = Math.max(0, Math.min(1, (bmi - 15) / 25)); const minor = age != null && age < 18;
    h_ += `<section class="card imc"><div class="row between"><div class="eyebrow">IMC</div><span class="tiny muted">${fmtN(cur)} kg · ${fmtN(Math.round(h))} cm</span></div>
      <div class="imc-v"><b class="num">${(Math.round(bmi * 10) / 10).toFixed(1).replace('.', ',')}</b><span style="color:${cat.c}">${minor ? 'Para menores de 18 anos o IMC usa outra tabela' : cat.t}</span></div>
      <div class="imc-bar" aria-hidden="true"><i style="flex:3.5;background:var(--c1)"></i><i style="flex:6.5;background:var(--good)"></i><i style="flex:5;background:var(--warn)"></i><i style="flex:10;background:var(--bad)"></i><em style="left:${(pos * 100).toFixed(1)}%"></em></div>
      <div class="imc-ticks" aria-hidden="true"><span style="left:14%">18,5</span><span style="left:40%">25</span><span style="left:60%">30</span></div>
      <p class="tiny muted" style="margin:12px 0 0">Peso ÷ altura², classificação da OMS para adultos. Músculo também conta, então veja junto com a cintura, em Medidas.</p></section>`;
    const inR = cur >= lo && cur <= hi; const rp = v => Math.max(0, Math.min(100, (v - (lo - 12)) / ((hi + 12) - (lo - 12)) * 100));
    h_ += `<section class="card hw"><div class="eyebrow">Peso saudável para você</div>
      <div class="hw-v"><b class="num">${fmtN(r1(lo))} a ${fmtN(r1(hi))}</b><span>kg</span></div>
      <div class="hw-bar" aria-hidden="true"><i style="left:${rp(lo).toFixed(1)}%;right:${(100 - rp(hi)).toFixed(1)}%"></i><em style="left:${rp(cur).toFixed(1)}%" title="Você"></em>${G ? `<u style="left:${rp(G.kg).toFixed(1)}%" title="Meta"></u>` : ''}</div>
      <div class="hw-leg"><span><em></em>você: ${fmtN(cur)} kg${inR ? ', dentro da faixa' : cur > hi ? `, ${fmtN(r1(cur - hi))} kg acima` : `, ${fmtN(r1(lo - cur))} kg abaixo`}</span>${G ? `<span><u></u>meta: ${fmtN(G.kg)} kg${G.kg < lo ? ', abaixo da faixa' : G.kg > hi ? ', acima da faixa' : ''}</span>` : ''}</div>
      <p class="tiny muted" style="margin:12px 0 0">Faixa da OMS (IMC 18,5 a 24,9). Não há um peso ideal único: com mais músculo, ficar acima dela pode não ser gordura.</p></section>`;
  }
  return h_;
}
function openGoalSheet(){
  const G = wGoal(); const lp = bwSeries('kg').pop();
  openSheet(`${sheetHead('Meta de peso', G && G.src === 'plan' ? 'Ligada ao seu plano de calorias' : 'Opcional')}
    <label class="flabel" style="margin-top:14px"><span class="tiny muted">Meta (kg)</span><input id="wg-in" class="field num" inputmode="decimal" placeholder="${lp ? fmtN(lp.v) : 'ex.: 72'}" value="${G ? fmtN(G.kg) : ''}"></label>
    <p class="tiny muted" style="margin:10px 0 0">${G && G.src === 'plan' ? 'Mudar aqui também muda a meta do plano, e a previsão de data é refeita.' : 'O app mostra a diferença, o progresso e a meta no gráfico.'}</p>
    <div class="sheet-foot"><button class="btn primary block" data-act="wgoal-save">Salvar meta</button>${G ? '<button class="link muted" style="width:100%;margin-top:4px" data-act="wgoal-del">Remover meta</button>' : ''}</div>`);
  setTimeout(() => { const i = $('#wg-in'); if (i) i.focus(); }, 60);
}

/* ---------- tela ---------- */
const BODY_TABS = [['peso', 'Peso'], ['medidas', 'Medidas'], ['nutricao', 'Nutrição']];
function vBody(){
  const t = BODY_TABS.some(x => x[0] === UI.bodyTab) ? UI.bodyTab : 'peso';
  const body = t === 'medidas' ? progBody(true) : t === 'nutricao' ? `<section style="margin-top:14px"><p class="small ink2" style="margin:0 4px 12px">O assistente calcula calorias, proteína e macros para o seu objetivo, com base nos seus dados e nos seus treinos, e ajusta toda semana pelo seu peso real.</p>${planSummaryRow(ST.prefs.plan ? 'body' : 'tab')}</section>` : weightTab();
  return `<section style="margin-top:20px"><h1 class="display h1">Corpo</h1><p class="ink2 body-lead">Seu peso, suas medidas e fotos para ver a evolução, e quanto comer para chegar no objetivo.</p></section>
  ${photoCard()}
  <section class="seg" role="tablist" style="margin-top:16px">${BODY_TABS.map(([k, l]) => `<button role="tab" data-act="body-tab" data-t="${k}" aria-pressed="${t === k}">${l}</button>`).join('')}</section>${body}`;
}

A['body-tab'] = el => { UI.bodyTab = el.dataset.t; render(); };
A['ph-open'] = el => openPhoto(el.dataset.id);
A['ph-compare'] = el => openCompare(el.dataset.id);
A['ph-all'] = () => { const L = getPhotos(); openSheet(`${sheetHead('Fotos de evolução', `${L.length} fotos`)}<div class="ph-grid">${L.map(p => `<button class="ph-th" data-act="ph-open" data-id="${p.id}"><img src="${p.th}" alt=""><span>${fmtD(p.date)}</span></button>`).join('')}</div>`); };
A['ph-del'] = el => { const id = el.dataset.id; confirmSheet({title: 'Apagar esta foto?', text: `Ela será apagada${photoCloud() ? ' da sua conta e de todos os aparelhos' : ' deste aparelho'} e não dá para recuperar.`, ok: 'Apagar', danger: true, onOk: () => { Store.delRec('photo', id); UI.photos = null; render(); toast('Foto apagada'); }}); };
A['wgoal-open'] = () => openGoalSheet();
A['wgoal-save'] = () => {
  const v = parseNum($('#wg-in') && $('#wg-in').value); if (!(v >= 30 && v <= 250)){ toast('Digite uma meta entre 30 e 250 kg.'); return; }
  const lp = bwSeries('kg').pop(); const pl = ST.prefs.plan;
  if (pl){ pl.target = r1(v); if (!pl.startKg && lp) pl.startKg = lp.v; } else { ST.prefs.wGoal = r1(v); ST.prefs.wGoalFrom = lp ? lp.v : null; }
  saveState(); closeSheet(); render(); Platform.haptic('success'); toast('Meta salva');
};
A['wgoal-del'] = () => { const pl = ST.prefs.plan; if (pl && pl.target) delete pl.target; delete ST.prefs.wGoal; delete ST.prefs.wGoalFrom; saveState(); closeSheet(); render(); toast('Meta removida'); };
document.addEventListener('change', ev => { const t = ev.target; if (t && t.dataset && t.dataset.act === 'ph-date' && t.value && t.value <= today()){ const id = t.dataset.id; const p = photoById(id); if (!p || p.date === t.value) return; const {id: _, ...d} = p; Store.putRec('photo', id, {...d, date: t.value}); UI.photos = null; render(); toast('Data da foto alterada'); } });
