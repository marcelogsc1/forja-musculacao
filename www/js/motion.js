/* Identidade animada dos treinos.
   Cada treino ganha um "tipo" (puxar, empurrar, perna...) deduzido do nome e dos músculos,
   uma ilustração em movimento desenhada em SVG (só traços, na cor do treino) e uma frase do dia.
   As animações usam só transform/opacity/stroke-dashoffset (leves) e param com "reduzir movimento". */

const KIN = {}; // último nome animado por cartão, para a entrada das letras só acontecer quando o treino muda

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

/* ---------- ilustrações animadas (viewBox 160 × 240, ancoradas à direita do cartão) ---------- */
const dumbbell = (x, y, w = 44) => `<g><rect x="${x - w / 2 - 6}" y="${y - 10}" width="8" height="20" rx="2.5"/><rect x="${x + w / 2 - 2}" y="${y - 10}" width="8" height="20" rx="2.5"/><rect x="${x - w / 2 - 12}" y="${y - 6}" width="6" height="12" rx="2"/><rect x="${x + w / 2 + 6}" y="${y - 6}" width="6" height="12" rx="2"/><line x1="${x - w / 2 + 2}" y1="${y}" x2="${x + w / 2 - 2}" y2="${y}"/></g>`;
const barbell = (cx, y, half = 62) => `<g><line x1="${cx - half}" y1="${y}" x2="${cx + half}" y2="${y}"/>${[-1, 1].map(s => `<rect x="${cx + s * (half - 16) - (s < 0 ? 0 : 12)}" y="${y - 22}" width="12" height="44" rx="3"/><rect x="${cx + s * (half - 30) - (s < 0 ? 0 : 9)}" y="${y - 15}" width="9" height="30" rx="2.5"/>`).join('')}</g>`;
function rope(){
  let a = 'M108,-60', b = 'M108,-60';
  for (let y = -60; y < 300; y += 24){ a += ` c9,5 9,19 0,24`; b += ` c-9,5 -9,19 0,24`; }
  return `<g class="m-rope"><path d="${a}"/><path d="${b}" opacity=".55"/></g>`;
}
function motionArt(type){
  let g = '';
  switch (type){
    case 'pull':
      g = `${rope()}<g class="m-grip"><rect x="92" y="168" width="32" height="40" rx="12"/><line x1="99" y1="180" x2="117" y2="180" opacity=".5"/><line x1="99" y1="188" x2="117" y2="188" opacity=".5"/><line x1="99" y1="196" x2="117" y2="196" opacity=".5"/></g>
        <g class="m-chev" opacity=".7"><path d="M98,218 l10,8 l10,-8"/><path d="M98,230 l10,8 l10,-8" opacity=".5"/></g>`; break;
    case 'push': // anilha empurrada: rola para a frente, com rastro de velocidade
      g = `<g class="m-speed">${[96, 116, 136, 156].map((y, i) => `<line x1="${4 + i * 5}" y1="${y}" x2="${50 - i * 3}" y2="${y}" style="--d:${i * 0.15}s"/>`).join('')}</g>
        <g class="m-roll"><g class="m-plate"><circle cx="108" cy="126" r="44"/><circle cx="108" cy="126" r="32" opacity=".45"/><circle cx="108" cy="126" r="8"/><line x1="108" y1="82" x2="108" y2="94" opacity=".6"/><line x1="108" y1="158" x2="108" y2="170" opacity=".6"/></g></g>
        <line x1="40" y1="176" x2="160" y2="176" class="m-floor"/>`; break;
    case 'legs':
      g = `<line x1="100" y1="34" x2="100" y2="206" class="m-guide"/><line x1="56" y1="196" x2="144" y2="196" class="m-floor"/>
        <g class="m-squat">${barbell(100, 60)}</g>`; break;
    case 'glute':
      g = `<path d="M30,206 Q100,206 150,206" class="m-floor"/><g class="m-thrust"><path class="m-hip" d="M44,200 Q100,120 156,200"/>${barbell(100, 120, 54)}</g>`; break;
    case 'upper':
      g = `<g class="m-curl" style="--o:100px 196px">${dumbbell(100, 96, 60)}<line x1="100" y1="106" x2="100" y2="196" opacity=".35"/></g><circle cx="100" cy="196" r="5" class="m-dot"/>`; break;
    case 'arms':
      g = `<g class="m-curl" style="--o:72px 200px">${dumbbell(72, 110, 34)}<line x1="72" y1="120" x2="72" y2="200" opacity=".35"/></g><g class="m-curl b" style="--o:128px 200px">${dumbbell(128, 110, 34)}<line x1="128" y1="120" x2="128" y2="200" opacity=".35"/></g>`; break;
    case 'shoulder':
      g = `<circle cx="100" cy="120" r="6" class="m-dot"/><g class="m-raise l" style="--o:100px 120px">${dumbbell(48, 170, 26)}<line x1="100" y1="120" x2="56" y2="166" opacity=".35"/></g><g class="m-raise r" style="--o:100px 120px">${dumbbell(152, 170, 26)}<line x1="100" y1="120" x2="144" y2="166" opacity=".35"/></g>`; break;
    case 'core':
      g = `<g class="m-gyro"><ellipse cx="100" cy="120" rx="58" ry="22"/><ellipse class="b" cx="100" cy="120" rx="58" ry="22" opacity=".6"/><ellipse class="c" cx="100" cy="120" rx="58" ry="22" opacity=".35"/></g><circle cx="100" cy="120" r="7" class="m-dot"/>`; break;
    case 'cardio':
      g = `<path class="m-ecg" pathLength="100" d="M-4,130 H40 l8,-18 l10,40 l12,-78 l12,92 l9,-36 h14 l6,-10 l6,10 H170"/>`; break;
    case 'rest':
      g = `<path class="m-moon" d="M112,52 a34,34 0 1 0 22,58 a28,28 0 1 1 -22,-58z"/>${['Z', 'z', 'z'].map((z, i) => `<text class="m-z" x="${74 - i * 14}" y="${150 + i * 18}" style="--d:${i * 0.9}s;font-size:${26 - i * 6}px">${z}</text>`).join('')}`; break;
    case 'done':
      g = `<circle cx="104" cy="118" r="46" class="m-ring" opacity=".35"/><path class="m-check" pathLength="100" d="M80,120 l16,16 l32,-36"/>${[[50, 60], [150, 52], [156, 178], [52, 182]].map(([x, y], i) => `<g class="m-spark" style="--d:${i * 0.5}s;transform-origin:${x}px ${y}px"><line x1="${x}" y1="${y - 8}" x2="${x}" y2="${y + 8}"/><line x1="${x - 8}" y1="${y}" x2="${x + 8}" y2="${y}"/></g>`).join('')}`; break;
    default: // corpo inteiro: kettlebell em balanço
      g = `<line x1="100" y1="28" x2="100" y2="40" class="m-guide"/><g class="m-swing" style="--o:100px 30px"><line x1="100" y1="30" x2="100" y2="128" opacity=".35"/><path d="M84,150 a16,16 0 0 1 32,0"/><circle cx="100" cy="172" r="26"/><path d="M90,170 h20" opacity=".45"/></g>`;
  }
  return `<svg class="art art-${type}" viewBox="0 0 160 240" preserveAspectRatio="xMaxYMid meet" aria-hidden="true" focusable="false">${g}</svg>`;
}
