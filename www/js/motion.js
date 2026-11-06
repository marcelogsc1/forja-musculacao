/* Identidade animada dos treinos (v4.8).
   O usuário escolhe o estilo em Perfil › Animação do treino:
     'type'   Tipografia: o nome faz o movimento (uma coreografia por tipo de treino)
     'equip'  Equipamento: o aparelho do exercício principal em loop, num selo quadrado ao lado do nome
     'badge'  Selo: anel com o nome do dia e os músculos girando, com o aparelho no centro
     'combo'  Tipografia + Equipamento (padrão)
     'off'    Estático
   O tipo do treino vem do nome ou, se o nome não disser, dos músculos dos exercícios.
   Tudo é CSS (transform, opacity, stroke-dashoffset) e para com "reduzir movimento". */

const KIN = {}; // último nome mostrado por cartão (entrada letra a letra só quando o treino muda)
const MOTION_MODES = [
  {v: 'combo', t: 'Tipografia e aparelho', s: 'O nome faz o movimento e o aparelho trabalha ao lado.'},
  {v: 'type', t: 'Tipografia', s: 'Só o nome, com uma coreografia para cada tipo de treino.'},
  {v: 'equip', t: 'Equipamento', s: 'O aparelho do exercício principal em movimento.'},
  {v: 'badge', t: 'Selo', s: 'Selo de clube girando com o dia e os músculos.'},
  {v: 'off', t: 'Estático', s: 'Sem animação.'},
];
const motionMode = () => (typeof ST !== 'undefined' && ST.prefs && ST.prefs.motion) || 'combo';
const reducedMotion = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

/* ---------- tipo do treino ---------- */
const WK_WORDS = [
  [/\b(pull|puxar|puxada|costas|dorsal|back)\b/i, 'pull'],
  [/\b(push|empurrar|peito|chest|press)\b/i, 'push'],
  [/\b(gl[uú]teo|gl[uú]teos|glute|bumbum)\b/i, 'glute'],
  [/\b(legs?|perna|pernas|lower|inferior(es)?|quadr[ií]ceps|posterior(es)?)\b/i, 'legs'],
  [/\b(upper|superior(es)?|tronco)\b/i, 'upper'],
  [/\b(ombros?|shoulders?|delt[oó]ides?)\b/i, 'shoulder'],
  [/\b(bra[cç]os?|arms?|b[ií]ceps|tr[ií]ceps)\b/i, 'arms'],
  [/\b(full|fullbody|corpo|total|hiit|circuito)\b/i, 'full'],
  [/\b(abd[oô]men|abdominal|core)\b/i, 'core'],
  [/\b(cardio|corrida|aer[oó]bico|esteira|bike)\b/i, 'cardio'],
];
function wkType(items, name){
  const n = String(name || '');
  for (const [re, t] of WK_WORDS) if (re.test(n)) return t;
  const by = {}; let tot = 0;
  (items || []).forEach(x => { const e = getEx(x.ex); if (!e) return; const s = Array.isArray(x.sets) ? x.sets.length : (x.sets || 0); by[e.m] = (by[e.m] || 0) + s; tot += s; });
  if (!tot) return 'full';
  const sum = ks => ks.reduce((a, k) => a + (by[k] || 0), 0) / tot;
  const legs = sum(['quadriceps', 'posteriores', 'gluteos', 'adutores', 'panturrilha']);
  const push = sum(['peito', 'ombros', 'triceps']), pull = sum(['costas', 'biceps', 'antebraco']);
  if (sum(['cardio']) >= 0.5) return 'cardio';
  if (sum(['abdomen']) >= 0.5) return 'core';
  if (legs >= 0.6) return (by.gluteos || 0) / tot >= 0.35 ? 'glute' : 'legs';
  if (legs >= 0.25 && push + pull >= 0.25) return 'full';
  if (push >= 0.6) return (by.ombros || 0) / tot >= 0.5 ? 'shoulder' : 'push';
  if (pull >= 0.6) return 'pull';
  if (sum(['biceps', 'triceps', 'antebraco']) >= 0.5) return 'arms';
  return 'upper';
}

/* ---------- frase do dia (uma por dia, sempre a mesma no mesmo dia) ---------- */
const TAGS = {
  push: ['Empurra, que o peito agradece.', 'Peito estufado, ego também.', 'Hoje o supino é a sua terapia.'],
  pull: ['Puxa, que as costas vêm junto.', 'Costas largas não se fazem sozinhas.', 'Remada boa, postura melhor.'],
  legs: ['Hoje a escada vira inimiga.', 'Aqui ninguém pula perna.', 'Amanhã você senta devagar.'],
  glute: ['Glúteo em obra. Desculpe o transtorno.', 'Ponte, elevação e orgulho.', 'Hoje é dia de subir o quadril.'],
  upper: ['Do quadril pra cima, tudo nosso.', 'Camiseta apertando em breve.', 'Tronco em construção.'],
  shoulder: ['Ombro de capa de revista.', 'Largura também é atitude.', 'Hoje os ombros pedem passagem.'],
  arms: ['Manga apertada em breve.', 'Bíceps e tríceps, dupla clássica.', 'Hoje é dia de pump.'],
  full: ['Corpo inteiro, sem desculpa.', 'Da cabeça aos pés, tudo trabalha.', 'Treino completo, consciência limpa.'],
  core: ['Barriga trincando, devagar e sempre.', 'Core firme, coluna feliz.', 'Abdômen se faz aqui e na cozinha.'],
  cardio: ['Coração acelerado, por bons motivos.', 'Fôlego também se treina.', 'Cada passo conta, literalmente.'],
  rest: ['Sofá autorizado. O músculo cresce agora.', 'Descansar também é treinar.', 'Hoje o peso que você levanta é o controle remoto.'],
  done: ['Missão cumprida. Agora é comer e dormir.', 'Pode se olhar no espelho com orgulho.', 'Treino feito, dia ganho.'],
};
function tagline(type){ const l = TAGS[type] || TAGS.full; const d = new Date(); const doy = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5); return l[doy % l.length]; }
const EQ_CAP = {push: 'Supino reto', pull: 'Puxada alta', legs: 'Agachamento', glute: 'Elevação pélvica', upper: 'Remada com halter', shoulder: 'Desenvolvimento', arms: 'Rosca com barra W', full: 'Kettlebell swing', core: 'Roda abdominal', cardio: 'Esteira', rest: 'Recuperação', done: 'Concluído'};
const DAY_WORD = {push: 'PUSH DAY', pull: 'PULL DAY', legs: 'LEG DAY', glute: 'GLUTE DAY', upper: 'UPPER DAY', shoulder: 'SHOULDER DAY', arms: 'ARM DAY', full: 'FULL BODY', core: 'CORE DAY', cardio: 'CARDIO', rest: 'REST DAY', done: 'TÁ PAGO'};

/* ---------- aparelhos (viewBox 120 × 120) ---------- */
let EQN = 0;
const plateEnd = (cx, cy, r, label) => `<g transform="translate(${cx} ${cy})"><circle r="${r}" fill="#1D1D21" class="pcS w26"/><circle r="${r * .82}" class="k w1 a2"/><g fill="#0B0B0C" class="kf w08 a2">${[0, 120, 240].map(a => `<rect x="-3.5" y="${-r * .66}" width="7" height="4" rx="2" transform="rotate(${a})"/>`).join('')}</g><circle r="${r * .27}" fill="#3A3A40" class="kf w1 a6"/><circle r="${r * .11}" fill="#0B0B0C"/>${label ? `<text y="${r * .72}" font-size="4.6" fill="#F3F1ED" class="mono tm fo5">${label}</text>` : ''}</g>`;
const holes = (x, ys) => `<g fill="#0B0B0C">${ys.map(y => `<circle cx="${x}" cy="${y}" r="1"/>`).join('')}</g>`;
const hexHead = (cx, cy, r) => { const p = [0, 1, 2, 3, 4, 5].map(i => { const a = Math.PI / 3 * i + Math.PI / 6; return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`; }).join(' '); return `<polygon points="${p}" fill="#2E2E33" class="pcS w2 rj"/><polygon points="${p}" fill="none" class="k w1 a2" transform="translate(${cx} ${cy}) scale(.62) translate(${-cx} ${-cy})"/><circle cx="${cx}" cy="${cy}" r="2" fill="#F3F1ED" class="fo6"/>`; };
const EQ = {
  push: () => `<line x1="8" y1="106" x2="112" y2="106" class="k w1 a3"/>
    <rect x="25" y="20" width="6" height="86" rx="1.5" fill="#1F1F23" class="kf w1 a6"/>${holes(28, [28, 35, 49, 56, 63, 70])}
    <path d="M31 39.5h6.5v5.5h-2.6" class="k w2 a6 rc rj"/><path d="M19 106h18" class="k w2 a6 rc"/>
    <rect x="34" y="68" width="58" height="9" rx="4.5" fill="#26262B" class="kf w1 a6"/><line x1="38" y1="72.5" x2="88" y2="72.5" class="k w1 a2 dsh"/>
    <path d="M44 77l-4 29M84 77l4 29M36 106h12M80 106h14M42 92h44" class="k w2 a6 rc"/><line x1="62" y1="40" x2="62" y2="62" class="k w1 a2 dsh2"/>
    <g class="eq-press">${plateEnd(42, 42, 19, '20')}</g>`,
  pull: () => `<line x1="6" y1="110" x2="114" y2="110" class="k w1 a3"/><path d="M12 110V12h96v98" class="k w2 a6 rj"/><path d="M12 12h96" class="k w3 a7"/>
    <circle cx="54" cy="17.5" r="4.2" fill="#1F1F23" class="kf w1 a6"/><circle cx="54" cy="17.5" r="1.2" fill="#F3F1ED" class="fo6"/><circle cx="96" cy="17.5" r="4.2" fill="#1F1F23" class="kf w1 a6"/><circle cx="96" cy="17.5" r="1.2" fill="#F3F1ED" class="fo6"/>
    <line x1="54" y1="13.3" x2="96" y2="13.3" class="k w1 a5"/><line x1="54" y1="21.7" x2="54" y2="34" class="k w1 a7 eq-cabL"/><line x1="96" y1="21.7" x2="96" y2="58" class="k w1 a7 eq-cabS"/>
    <line x1="87" y1="26" x2="87" y2="106" class="k w1 a3"/><line x1="105" y1="26" x2="105" y2="106" class="k w1 a3"/>
    <g class="eq-stack">${[58, 64.5, 71].map(y => `<rect x="85.5" y="${y}" width="21" height="5.5" rx="1.2" fill="#2B2B30" class="kf w1 a6"/>`).join('')}<circle cx="109" cy="73.7" r="2.2" class="pcF"/><line x1="105" y1="73.7" x2="107" y2="73.7" class="pcS w2"/></g>
    ${[77.5, 84, 90.5, 97].map(y => `<rect x="85.5" y="${y}" width="21" height="5.5" rx="1.2" fill="#1C1C20" class="kf w1 a3"/>`).join('')}
    <rect x="38" y="94" width="32" height="5" rx="2.5" fill="#26262B" class="kf w1 a6"/><line x1="54" y1="99" x2="54" y2="110" class="k w2 a6"/>
    <circle cx="45" cy="82" r="4" fill="#26262B" class="kf w1 a6"/><circle cx="63" cy="82" r="4" fill="#26262B" class="kf w1 a6"/><line x1="49" y1="82" x2="59" y2="82" class="k w1 a6"/><line x1="54" y1="86" x2="54" y2="94" class="k w1 a3"/>
    <g class="eq-bar"><path d="M24 40l6-4h48l6 4" class="k w3 a9 rc rj"/><path d="M24 40l6-4M78 36l6 4" fill="none" class="pcS w4 rc"/><circle cx="54" cy="36" r="1.8" fill="#F3F1ED"/></g>`,
  legs: () => `<rect x="6" y="106" width="108" height="5" rx="1.5" fill="#1C1C20" class="kf w1 a3"/>
    <rect x="34" y="14" width="6" height="92" rx="1.2" fill="#1F1F23" class="kf w1 a6"/><rect x="80" y="14" width="6" height="92" rx="1.2" fill="#1F1F23" class="kf w1 a6"/>
    ${holes(37, [22, 29, 43, 50, 57, 64, 71, 78])}${holes(83, [22, 29, 43, 50, 57, 64, 71, 78])}
    <path d="M30 14h14M76 14h14" class="k w2 a6"/><path d="M40 84h10M70 84h10" class="k w3 a6 rc"/><path d="M40 31h4v4M80 31h-4v4" class="k w2 a6 rj"/>
    <g class="eq-squat"><line x1="4" y1="34" x2="116" y2="34" class="k w26 rc"/><line x1="46" y1="34" x2="74" y2="34" stroke="#0B0B0C" class="knurl"/>
      <rect x="13" y="15" width="7" height="38" rx="2" class="pcF"/><rect x="20.5" y="20" width="5" height="28" rx="1.6" fill="#2E2E33" class="kf w1 a6"/><rect x="26" y="29" width="3" height="10" rx="1" fill="#F3F1ED" class="fo85"/>
      <rect x="100" y="15" width="7" height="38" rx="2" class="pcF"/><rect x="94.5" y="20" width="5" height="28" rx="1.6" fill="#2E2E33" class="kf w1 a6"/><rect x="91" y="29" width="3" height="10" rx="1" fill="#F3F1ED" class="fo85"/></g>`,
  glute: () => `<line x1="6" y1="104" x2="114" y2="104" class="k w1 a3"/>
    <rect x="8" y="56" width="38" height="9" rx="4.5" fill="#26262B" class="kf w1 a6"/><line x1="12" y1="60.5" x2="42" y2="60.5" class="k w1 a2 dsh"/>
    <path d="M15 65l-2 39M39 65l2 39M8 104h12M34 104h12M14 84h26" class="k w2 a6 rc"/>
    <line x1="92" y1="62" x2="92" y2="84" class="k w1 a2 dsh2"/><path d="M98 68l-6-6-6 6" class="k w1 a3 rc rj eq-chev"/>
    <g class="eq-thrust">${plateEnd(70, 86, 17, '20')}</g>`,
  upper: () => `<line x1="6" y1="106" x2="114" y2="106" class="k w1 a3"/>
    <rect x="34" y="56" width="74" height="8" rx="4" fill="#26262B" class="kf w1 a6"/><line x1="38" y1="60" x2="104" y2="60" class="k w1 a2 dsh"/>
    <path d="M44 64l-3 42M98 64l3 42M36 106h12M94 106h12M42 86h58" class="k w2 a6 rc"/>
    <path d="M20 96c0-14 2-24 6-34" class="k w1 a2 dsh2"/>
    <g class="eq-row">${hexHead(22, 92, 10)}</g>`,
  shoulder: () => `<line x1="6" y1="108" x2="114" y2="108" class="k w1 a3"/>
    <rect x="49" y="30" width="22" height="58" rx="7" fill="#26262B" class="kf w1 a6"/><line x1="60" y1="36" x2="60" y2="82" class="k w1 a2 dsh"/>
    <rect x="38" y="86" width="44" height="7" rx="3.5" fill="#2A2A2F" class="kf w1 a6"/><path d="M60 93v15M48 108h24" class="k w2 a6 rc"/>
    <g class="eq-pressL"><rect x="14" y="62" width="6" height="18" rx="2" class="pcF"/><rect x="36" y="62" width="6" height="18" rx="2" class="pcF"/><line x1="20" y1="71" x2="36" y2="71" class="k w26 rc"/></g>
    <g class="eq-pressR"><rect x="78" y="62" width="6" height="18" rx="2" class="pcF"/><rect x="100" y="62" width="6" height="18" rx="2" class="pcF"/><line x1="84" y1="71" x2="100" y2="71" class="k w26 rc"/></g>`,
  arms: () => `<line x1="6" y1="108" x2="114" y2="108" class="k w1 a3"/>
    <path d="M10 90a50 50 0 0 1 0-46M110 90a50 50 0 0 0 0-46" class="k w1 a2 dsh2"/>
    <g class="eq-curl"><path d="M14 88h22l6-5 6 5 6-5 6 5 6-5 6 5 6-5 6 5h22" class="k w26 rc rj"/>
      <rect x="6" y="76" width="7" height="24" rx="2" class="pcF"/><rect x="2" y="80" width="4" height="16" rx="1.5" fill="#2E2E33" class="kf w1 a6"/><rect x="13" y="84.5" width="3" height="7" rx="1" fill="#F3F1ED" class="fo85"/>
      <rect x="107" y="76" width="7" height="24" rx="2" class="pcF"/><rect x="114" y="80" width="4" height="16" rx="1.5" fill="#2E2E33" class="kf w1 a6"/><rect x="104" y="84.5" width="3" height="7" rx="1" fill="#F3F1ED" class="fo85"/></g>`,
  full: () => `<line x1="6" y1="110" x2="114" y2="110" class="k w1 a3"/><path d="M18 46a46 46 0 0 0 84 0" class="k w1 a2 dsh2"/>
    <circle cx="60" cy="16" r="2.2" fill="#F3F1ED" class="fo6"/>
    <g class="eq-swing"><line x1="60" y1="16" x2="60" y2="40" class="k w1 a3"/><path d="M47 54c0-12 4-17 13-17s13 5 13 17" class="k w4 a9 rc"/>
      <circle cx="60" cy="66" r="19" fill="#26262B" class="pcS w26"/><path d="M50 84h20" class="k w2 a6 rc"/><path d="M48 60c4-5 20-5 24 0" class="k w1 a2"/>
      <text x="60" y="74" font-size="7" fill="#F3F1ED" class="mono tm fo6">16</text></g>`,
  core: () => `<rect x="6" y="96" width="108" height="4" rx="2" fill="#26262B" class="kf w1 a3"/>
    <g class="eq-trail"><line x1="10" y1="92" x2="26" y2="92" class="pcS w1 rc"/><line x1="6" y1="86" x2="18" y2="86" class="pcS w1 rc"/></g>
    <g class="eq-roll"><g class="eq-spin">
      <circle cx="40" cy="78" r="18" fill="#1D1D21" class="pcS w3"/><circle cx="40" cy="78" r="18" class="k w1 a3 dsh"/><circle cx="40" cy="78" r="12" class="k w1 a2"/>
      <line x1="40" y1="66" x2="40" y2="90" class="k w1 a3"/><line x1="28" y1="78" x2="52" y2="78" class="k w1 a3"/></g>
      <circle cx="40" cy="78" r="5.5" fill="#3A3A40" class="kf w1 a6"/><circle cx="40" cy="78" r="2" fill="#F3F1ED"/></g>`,
  cardio: () => `<line x1="6" y1="104" x2="114" y2="104" class="k w1 a3"/>
    <rect x="10" y="82" width="86" height="11" rx="5.5" fill="#26262B" class="kf w1 a6"/><circle cx="16" cy="87.5" r="3.2" fill="#3A3A40" class="kf w1 a6"/><circle cx="90" cy="87.5" r="3.2" fill="#3A3A40" class="kf w1 a6"/>
    <line x1="14" y1="81" x2="92" y2="81" class="pcS w2 rc eq-belt"/><path d="M14 93l-2 11M92 93l2 11" class="k w2 a6 rc"/>
    <path d="M92 82l10-44" class="k w3 a7 rc"/><path d="M98 52H76" class="k w2 a6 rc"/>
    <rect x="86" y="22" width="28" height="18" rx="4" fill="#1F1F23" class="kf w1 a6"/>
    <path d="M90 32h5l2-4 3 8 2-6 2 2h5" fill="none" class="pcS w1 rc rj eq-ecg"/>`,
  rest: () => `<line x1="8" y1="96" x2="112" y2="96" class="k w1 a3"/>
    <path d="M10 94c0-9 3-13 9-13h12c6 0 8 4 8 13z" fill="#2A2A2F" class="kf w1 a6"/><path d="M15 86c4-1 12-1 18 0" class="k w1 a2"/>
    <path d="M28 70l6-6h8l6 6v12l-6 6h-8l-6-6z" fill="#2E2E33" class="kf w1 a6"/><path d="M33 72h10M33 80h10" class="k w1 a2"/>
    <rect x="48" y="73.5" width="30" height="5" rx="1.5" fill="#3A3A40" class="kf w1 a6"/><line x1="52" y1="76" x2="74" y2="76" stroke="#0B0B0C" class="knurl"/>
    <path d="M78 70l6-6h8l6 6v12l-6 6h-8l-6-6z" fill="#2E2E33" class="kf w1 a6"/>
    <g class="eq-blanket"><path d="M44 96c0-14 6-22 16-22h40c6 0 10 6 10 14v8z" fill="#3B3F47" class="pcS w1"/><path d="M52 86c10-3 30-3 52 0" class="k w1 a2 dsh"/></g>
    <text class="eq-z mono pcF" x="30" y="58" font-size="11">z</text><text class="eq-z mono pcF" x="38" y="48" font-size="8" style="animation-delay:1.3s">z</text>`,
  done: () => `<path d="M44 10l12 34M76 10L64 44" fill="none" class="pcS w4 rc"/><path d="M38 10h44" class="k w2 a5 rc"/>
    <g class="eq-medal"><circle cx="60" cy="70" r="26" fill="#1D1D21" class="pcS w3"/><circle cx="60" cy="70" r="20" class="k w1 a2 dsh"/>
      <path d="M49 71l8 8 15-17" fill="none" class="pcS w4 rc rj eq-check"/></g>
    ${[[22, 40], [100, 34], [104, 96], [18, 98]].map(([x, y], i) => `<g class="eq-spark" style="animation-delay:${i * .5}s;transform-origin:${x}px ${y}px"><path d="M${x} ${y - 6}v12M${x - 6} ${y}h12" fill="none" class="pcS w2 rc"/></g>`).join('')}`,
};
const EQ_VB = {rest: '4 24 112 92'};
const EQ_TOK = {'#0B0B0C': 'e0', '#1C1C20': 'e1', '#1D1D21': 'e1', '#1F1F23': 'e1', '#26262B': 'e2', '#2A2A2F': 'e2', '#2B2B30': 'e2', '#2E2E33': 'e3', '#3A3A40': 'e3', '#3B3F47': 'e3', '#F3F1ED': 'eqk'};
/* as cores fixas do desenho viram tokens, para o aparelho funcionar no tema claro e no escuro */
const eqDraw = ty => (EQ[ty] || EQ.full)().replace(/(fill|stroke)="(#[0-9A-F]{6})"/gi, (m, a, c) => EQ_TOK[c.toUpperCase()] ? `style="${a}:var(--${EQ_TOK[c.toUpperCase()]})"` : m);
function equipSvg(ty){ return `<svg class="eq" viewBox="${EQ_VB[ty] || '0 0 120 120'}" aria-hidden="true" focusable="false">${eqDraw(ty)}</svg>`; }
function equipTile(ty){ return `<div class="eq-tile">${equipSvg(ty)}<span class="eq-cap">${EQ_CAP[ty] || ''}</span></div>`; }
function badgeSvg(ty, words){
  const id = 'rg' + (++EQN); const one = (words.join(' · ') + ' · ').toUpperCase(); let txt = one; while (txt.length < 36) txt += one; txt = txt.trim(); const fs = txt.length > 44 ? 6.2 : 7.4;
  return `<div class="eq-badge"><svg viewBox="0 0 120 120" aria-hidden="true" focusable="false"><defs><path id="${id}" d="M60 60m-49 0a49 49 0 1 1 98 0a49 49 0 1 1-98 0"/><clipPath id="c${id}"><circle cx="60" cy="60" r="35"/></clipPath></defs>
    <circle cx="60" cy="60" r="58" class="bd-o"/><circle cx="60" cy="60" r="41" class="bd-i"/>
    <g class="bd-spin"><text class="bd-t" style="font-size:${fs}px"><textPath href="#${id}" textLength="300" lengthAdjust="spacing">${esc(txt)}</textPath></text></g>
    <circle cx="60" cy="60" r="35" class="bd-c"/>
    <g clip-path="url(#c${id})"><g transform="translate(60 61) scale(.6) translate(-60 -60)" class="eq">${eqDraw(ty)}</g></g></svg></div>`;
}

/* ---------- nome com coreografia ---------- */
function kineticName(name, ty, tag, key){
  const s = String(name).trim(); const ws = s.split(/\s+/);
  const k = Math.max(4, ...ws.map(x => x.length), Math.ceil(s.length / 2.3));
  const mode = motionMode(); const moving = mode !== 'off' && !reducedMotion();
  const kinetic = moving && (mode === 'type' || mode === 'combo');
  const enter = moving && !kinetic && key && KIN[key] !== s; if (key) KIN[key] = s;
  const letters = [...s.replace(/\s+/g, '')]; const n = letters.length; const mid = (n - 1) / 2;
  let i = 0;
  const style = j => {
    if (!kinetic) return `--i:${j}`;
    switch (ty){
      case 'push': return `--c:${(-.04 * j).toFixed(3)}em;--s:${(.08 + .02 * j).toFixed(3)}em;animation-delay:${(.045 * j).toFixed(3)}s`;
      case 'pull': return `animation-delay:${(.09 * (n - 1 - j)).toFixed(2)}s`;
      case 'legs': return `animation-delay:${(.03 * j).toFixed(2)}s`;
      case 'glute': return `--a:${(.15 + .85 * (n > 1 ? Math.sin(Math.PI * j / (n - 1)) : 1)).toFixed(2)}`;
      case 'upper': return `animation-delay:${(.05 * Math.abs(j - mid)).toFixed(2)}s`;
      case 'shoulder': { const d = j - mid; return `--d:${d.toFixed(2)};--e:${(Math.abs(d) / Math.max(mid, .5)).toFixed(2)}`; }
      case 'arms': return `animation-delay:${j % 2 ? 1.2 : 0}s`;
      case 'full': return `animation-delay:${(.06 * j).toFixed(2)}s`;
      case 'core': return `animation-delay:${(.08 * j).toFixed(2)}s`;
      case 'cardio': return `animation-delay:${(.02 * j).toFixed(2)}s`;
      case 'rest': return `animation-delay:${(.12 * j).toFixed(2)}s`;
      default: return '';
    }
  };
  const chk = kinetic && ty === 'done' ? '<svg class="kd-chk" viewBox="0 0 46 46" aria-hidden="true"><path d="M6 24l11 11L40 10"/></svg>' : '';
  const inner = ws.map((w, wi) => `<span class="w">${[...w].map(ch => `<span class="ch" style="${style(i++)}">${esc(ch)}</span>`).join('')}${wi === ws.length - 1 ? chk : ''}</span>`).join(' ');
  let deco = '';
  if (kinetic){
    if (ty === 'push') deco = '<i class="kd-streak" style="top:28%;width:22px"></i><i class="kd-streak" style="top:50%;width:30px;animation-delay:.05s"></i><i class="kd-streak" style="top:72%;width:18px;animation-delay:.1s"></i>';
    else if (ty === 'pull') deco = '<i class="kd-rope"></i>';
    else if (ty === 'legs' || ty === 'glute') deco = '<i class="kd-floor"></i>';
    else if (ty === 'upper') deco = '<i class="kd-bar"></i>';
    else if (ty === 'cardio') deco = '<svg class="kd-ecg" viewBox="0 0 230 18" preserveAspectRatio="none" aria-hidden="true"><path d="M0 10h80l6-7l8 15l8-18l8 18l6-8h114"/></svg>';
    else if (ty === 'rest') deco = '<i class="kd-z">z</i><i class="kd-z kd-z2">z</i>';
  }
  const cls = `cond hero-name${kinetic ? ` kt kt-${ty}` : ''}${enter ? ' kin' : ''}`;
  return `<${tag} class="${cls}" style="--k:${k}" aria-label="${esc(s)}"><span class="hn" aria-hidden="true">${inner}${deco}</span></${tag}>`;
}
/* Bloco do nome do cartão conforme o estilo escolhido.
   words: palavras do anel do selo (dia + músculos). */
function heroTitle(name, ty, opts = {}){
  const mode = motionMode(); const tag = opts.tag || 'h2'; const key = opts.key || '';
  const side = mode === 'equip' || mode === 'combo' ? equipTile(ty) : mode === 'badge' ? badgeSvg(ty, opts.words || [DAY_WORD[ty] || name]) : '';
  if (!side) return kineticName(name, ty, tag, key);
  return opts.stack ? `<div class="hero-row stk">${side}${kineticName(name, ty, tag, key)}</div>` : `<div class="hero-row">${kineticName(name, ty, tag, key)}${side}</div>`;
}
function badgeWords(ty, items){ const top = items && items.length ? groupsOf(items).split(' · ').slice(0, 3) : []; return [DAY_WORD[ty] || '', ...top].filter(Boolean); }

/* ---------- escolha do estilo (Perfil) ---------- */
function motionPreview(mode){
  const prev = ST.prefs.motion; ST.prefs.motion = mode;
  const html = `<div class="mp" style="--pc:${col(0)}">${heroTitle('Push', 'push', {words: ['PUSH DAY', 'PEITO', 'OMBROS', 'TRÍCEPS']})}</div>`;
  ST.prefs.motion = prev; return html;
}
function openMotionSheet(){
  UI.sheet = {kind: 'motion'};
  openSheet(`${sheetHead('Personalidade', 'Animação do treino')}
    <p class="ink2 small" style="margin:10px 0 0">Como o treino do dia aparece no cartão do Início, na página do treino e na tela de concluído.</p>
    <div class="mo-list">${MOTION_MODES.map(m => `<button class="choice mo-opt" data-act="motion-set" data-v="${m.v}" aria-pressed="${motionMode() === m.v}">${motionPreview(m.v)}<span class="grow"><b>${m.t}${m.v === 'combo' ? ' <em class="pill good">padrão</em>' : ''}</b><span>${m.s}</span></span><i class="tick">${I.check}</i></button>`).join('')}</div>
    ${reducedMotion() ? '<p class="tiny muted" style="margin:10px 0 0">Seu aparelho está com "reduzir movimento" ligado, então as animações ficam paradas.</p>' : ''}`);
}
A['motion-open'] = () => openMotionSheet();
A['motion-set'] = el => { ST.prefs.motion = el.dataset.v; saveState(); Object.keys(KIN).forEach(k => delete KIN[k]); openMotionSheet(); render(); Platform.haptic('light'); };
