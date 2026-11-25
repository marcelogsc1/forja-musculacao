/* ============================================================================
   Biblioteca de programas do Forja
   ----------------------------------------------------------------------------
   1. Metadados para filtros (objetivo, local, nível, frequência, duração, foco).
   2. Gerador de programas: monta treinos a partir de "vagas" de movimento,
      escolhendo o melhor exercício disponível para o equipamento do local.
      É o mesmo motor do assistente "Montar meu programa".
   3. Programas clássicos escritos à mão (PHUL, PHAT, GBR, PPL, GZCLP, 5x5...),
      conferidos nas fontes citadas em cada descrição.
   ========================================================================== */

const GOALS = {hipertrofia: 'Ganhar músculo', forca: 'Ganhar força', definicao: 'Definição e perda de gordura', condicionamento: 'Condicionamento e HIIT', saude: 'Saúde e começo'};
/* Locais: eq = tipos de equipamento (filtro da biblioteca e observações); ok = o que pode existir ali (ver exNeeds).
   "Em casa" não supõe nenhum equipamento: só o peso do corpo e objetos comuns (cadeira, sofá, mesa, mochila, toalha, degrau, porta, parede). */
const CASA = ['cadeira', 'parede', 'porta', 'mesa', 'toalha', 'mochila', 'degrau', 'ancora'];
const LOCAIS = {
  academia: {n: 'Academia', eq: ['barra', 'halter', 'cabo', 'maquina', 'smith', 'peso', 'kettlebell', 'casa', 'outros'], ok: null, art: 'leg-press'},
  casa: {n: 'Em casa', eq: ['peso', 'casa'], ok: CASA, art: 'agachamento-livre', d: 'Sem equipamento: peso do corpo e objetos da casa, como cadeira, mochila e toalha'},
  halteres: {n: 'Apenas halteres', eq: ['halter', 'peso', 'casa'], ok: ['halter', 'banco', ...CASA], main: 'halter', art: 'rosca-martelo', d: 'Um par de halteres, um banco e o peso do corpo'},
  peso: {n: 'Calistenia', eq: ['peso', 'casa'], ok: ['barrafixa', 'paralelas', ...CASA], art: 'flexao', d: 'Peso do corpo com barra fixa e paralelas, em casa ou na praça'},
  elastico: {n: 'Elástico', eq: ['elastico', 'peso', 'casa'], ok: ['elastico', ...CASA], main: 'elastico', art: 'remada-elastico', d: 'Elásticos com alças ou tubos e o peso do corpo'},
  kettlebell: {n: 'Kettlebell', eq: ['kettlebell', 'peso', 'casa'], ok: ['kettlebell', ...CASA], main: 'kettlebell', art: 'kettlebell-swing', d: 'Um ou dois kettlebells e o peso do corpo'},
  suspensao: {n: 'Fita de suspensão', eq: ['suspensao', 'peso', 'casa'], ok: ['suspensao', ...CASA], main: 'suspensao', art: 'trx-remada', d: 'TRX ou fita presa na porta, mais o peso do corpo'},
  viagem: {n: 'Em viagem', eq: ['peso', 'elastico', 'casa'], ok: ['elastico', ...CASA], art: 'polichinelo', d: 'Quarto de hotel: peso do corpo e um elástico na mala'},
  cardio: {n: 'Cardio e HIIT', eq: ['peso', 'outros', 'maquina', 'kettlebell', 'casa'], ok: null, art: 'burpee', d: 'Intervalados, circuitos e aeróbico'},
};
/* O que cada exercício precisa para ser feito. Base pelo tipo de equipamento, mais exceções conhecidas. */
const NEEDS_BASE = {barra: ['barra'], halter: ['halter'], cabo: ['cabo'], maquina: ['maquina'], smith: ['smith'], kettlebell: ['kettlebell'], elastico: ['elastico'], suspensao: ['suspensao'], peso: [], casa: [], outros: []};
const NEEDS_X = {
  'barra-fixa': ['barrafixa'], 'barra-fixa-peso': ['barrafixa'], 'barra-supinada': ['barrafixa'], 'barra-neutra': ['barrafixa'], 'elev-pernas-barra': ['barrafixa'], 'remada-invertida': ['barrafixa'], 'barra-assistida-elastico': ['barrafixa', 'elastico'],
  'paralelas': ['paralelas'], 'paralelas-peito': ['paralelas'],
  'elev-joelhos-paralela': ['maquina'], 'hiperextensao': ['maquina'], 'abd-declinado': ['maquina'], 'pant-burrinho': ['maquina'], 'corrida': ['maquina'], 'roda': ['roda'], 'pular-corda': ['corda'], 'elev-frontal-anilha': ['anilha'],
  'flexao-inclinada': ['cadeira'], 'flexao-declinada': ['cadeira'], 'mergulho-banco': ['cadeira'], 'elevacao-pelvica-sofa': ['cadeira'], 'remada-porta': ['porta'], 'remada-mesa': ['mesa'],
  'flexora-nordica': ['ancora'], 'flexora-toalha': ['toalha'], 'remada-mochila': ['mochila'], 'pant-degrau': ['degrau'], 'subida-degrau': ['degrau'], 'descida-degrau': ['degrau'], 'flexao-parede-invertida': ['parede'],
  'step-up': ['halter', 'banco'], 'pull-through-elastico': ['elastico'], 'flexora-elastico': ['elastico'],
  // v4.21
  'mergulho-cadeiras': ['cadeira'], 'flexao-parede': ['parede'], 'cadeirinha': ['parede'], 'agachamento-cadeira': ['cadeira'], 'bulgaro-cadeira': ['cadeira'], 'subida-caixa': ['degrau'], 'joelho-cotovelo-suspenso': ['barrafixa'], 'barra-arqueiro': ['barrafixa'], 'corda-naval': ['cordanaval'], 'treno': ['treno'], 'rosca-scott-halter': ['halter', 'banco'], 'crucifixo-inverso-incl': ['halter', 'banco'], 'triceps-unilateral-halter': ['halter', 'banco'], 'flexora-halter': ['halter', 'banco'], 'supino-squeeze': ['halter', 'banco']
};
function exNeeds(id){ const x = CAT[id]; if (!x) return ['?']; return NEEDS_X[id] || NEEDS_BASE[x.e] || ['?']; }
function exOk(id, local){ const L = LOCAIS[local]; if (!L || !L.ok) return true; return exNeeds(id).every(n => L.ok.includes(n)); }
/* ---------- v4.28: tipo de academia e o que ela tem ----------
   Nem toda academia é igual. O assistente pergunta o tipo, já marca o que costuma existir nele
   e a pessoa ajusta. O gerador e o ajuste rápido só escolhem o que dá para fazer ali. */
const GYM_INV = [
  ['halter', 'Halteres', ''], ['barra', 'Barras e anilhas', ''], ['bancosup', 'Banco de supino', ''], ['rack', 'Rack de agachamento', ''], ['smith', 'Smith', ''],
  ['polia', 'Polia', ''], ['cross', 'Cross over', ''], ['legpress', 'Leg press', ''], ['hack', 'Hack', ''], ['maqinf', 'Extensora e flexora', ''],
  ['abdutora', 'Abdutora e adutora', ''], ['maqsup', 'Máquinas de tronco', 'supino, voador, puxada'], ['articulada', 'Máquinas específicas', 'hip thrust, cavalinho'],
  ['barrafixa', 'Barra fixa', ''], ['paralelas', 'Paralelas', ''], ['kettlebell', 'Kettlebells', ''], ['cardio', 'Esteira e bike', ''], ['outros', 'Corda naval e trenó', ''],
];
const GYM_TIPOS = {
  bairro: {n: 'Academia de bairro', d: 'O básico: barras, halteres e poucas máquinas.', inv: ['halter', 'barra', 'bancosup', 'rack', 'polia', 'legpress', 'maqinf', 'barrafixa', 'paralelas', 'cardio']},
  rede: {n: 'Academia de rede', d: 'Muitas máquinas, polias e smith.', inv: ['halter', 'barra', 'bancosup', 'smith', 'polia', 'cross', 'legpress', 'hack', 'maqinf', 'abdutora', 'maqsup', 'barrafixa', 'cardio']},
  completa: {n: 'Academia completa', d: 'Quase tudo, até máquinas específicas.', inv: GYM_INV.map(x => x[0])},
  nsei: {n: 'Não sei dizer', d: 'Uma academia comum.', inv: ['halter', 'barra', 'bancosup', 'rack', 'smith', 'polia', 'cross', 'legpress', 'maqinf', 'maqsup', 'barrafixa', 'cardio']},
};
const GYM_PREF = [['livre', 'Pesos livres'], ['equil', 'Equilibrado'], ['maq', 'Máquinas']];
const G_CROSS = new Set(['crucifixo-incl-cabo', 'crossover', 'crossover-baixo', 'crossover-alto', 'lenhador', 'coice-cabo', 'pull-through', 'supino-cabo', 'rosca-martelo-cruzada', 'elev-lateral-cabo', 'triceps-coice-cabo', 'rosca-cabo-alto']);
const G_RACK = new Set(['agachamento', 'agachamento-frontal', 'afundo-barra', 'bom-dia']);
const G_BENCH = new Set(['supino-reto-barra', 'supino-incl-barra', 'supino-decl-barra', 'supino-fechado']);
const G_ARTIC = new Set(['agachamento-pendulo', 'gluteo-maquina', 'remada-apoiada-t', 'hip-thrust-maquina', 'hiperext-reversa', 'pant-sentado', 'elev-lateral-maquina', 'mergulho-maquina', 'desenv-maquina-2', 'remada-alta-maquina']);
const G_CARDIO = new Set(['esteira', 'caminhada-inclinada', 'bike', 'eliptico', 'remo-ergometro', 'stepmill', 'air-bike', 'corrida']);
/* o que da academia o exercício precisa (vazio: dá em qualquer academia) */
function gymNeeds(id){
  const x = CAT[id]; if (!x) return [];
  const nx = (NEEDS_X[id] || []).filter(n => n === 'barrafixa' || n === 'paralelas');
  if (id === 'terra-hexagonal') return ['barra', 'articulada'];
  if (x.e === 'barra') return ['barra', ...(G_RACK.has(id) ? ['rack'] : []), ...(G_BENCH.has(id) ? ['bancosup'] : [])];
  if (x.e === 'halter') return ['halter'];
  if (x.e === 'smith') return ['smith'];
  if (x.e === 'kettlebell') return ['kettlebell'];
  if (x.e === 'cabo') return [G_CROSS.has(id) ? 'cross' : 'polia'];
  if (x.e === 'maquina'){
    if (G_CARDIO.has(id)) return ['cardio']; if (id === 'hack' || id === 'pant-hack') return ['hack']; if (['leg-press', 'pant-legpress', 'leg-press-horizontal', 'leg-press-unilateral'].includes(id)) return ['legpress'];
    if (['extensora', 'cadeira-flexora', 'mesa-flexora', 'pant-pe', 'flexora-em-pe', 'extensora-unilateral', 'flexora-unilateral'].includes(id)) return ['maqinf']; if (id === 'abducao' || id === 'adutora') return ['abdutora'];
    if (G_ARTIC.has(id)) return ['articulada']; if (NEEDS_X[id] && NEEDS_X[id].includes('maquina') && ['elev-joelhos-paralela', 'hiperextensao', 'abd-declinado', 'pant-burrinho'].includes(id)) return [];
    return ['maqsup'];
  }
  if (id === 'corda-naval' || id === 'treno') return ['outros'];
  if (id === 'elev-frontal-anilha') return ['barra'];
  return nx;
}
const gymOk = (id, inv) => !inv || gymNeeds(id).every(n => inv.has(n));
const GYM_LIVRE = ['barra', 'halter', 'kettlebell', 'peso'], GYM_MAQ = ['maquina', 'cabo', 'smith'];
const NIVEIS = ['Iniciante', 'Intermediário', 'Avançado'];
const FOCOS = {
  bracos: {n: 'Braços', reg: ['biceps', 'triceps', 'antebraco'], slots: ['bi2', 'tri2'], small: true},
  peito: {n: 'Peitoral', reg: ['peitoral'], slots: ['pressI', 'fly']},
  costas: {n: 'Costas', reg: ['dorsal', 'meio_costas', 'trapezio'], slots: ['pullV2', 'rowH2']},
  ombros: {n: 'Ombros', reg: ['delt_ant', 'delt_lat', 'delt_post'], slots: ['lat', 'rear'], small: true},
  gluteos: {n: 'Glúteos', reg: ['gluteos', 'abdutores'], slots: ['glute', 'abduct']},
  pernas: {n: 'Pernas', reg: ['quadriceps', 'posteriores', 'panturrilha'], slots: ['lunge', 'legcurl']},
  abdomen: {n: 'Abdômen', reg: ['abdomen', 'obliquos'], slots: ['core2'], small: true},
};

// ---------- vagas de movimento: candidatos em ordem de preferência ----------
const SLOTS = {
  pressH: {r: 'main', c: ['supino-reto-barra', 'supino-reto-halter', 'supino-reto-maquina', 'supino-elastico', 'trx-supino', 'trx-flexao', 'flexao', 'flexao-joelhos', 'flexao-parede']},
  pressH2: {r: 'comp', c: ['supino-reto-maquina', 'supino-reto-halter', 'supino-reto-smith', 'flexao-aberta', 'supino-elastico', 'flexao']},
  pressI: {r: 'comp', c: ['supino-incl-halter', 'supino-incl-maquina', 'supino-incl-barra', 'supino-incl-smith', 'supino-squeeze', 'flexao-declinada', 'supino-elastico']},
  fly: {r: 'iso', c: ['voador', 'crossover', 'crossover-baixo', 'crossover-alto', 'crucifixo-incl-cabo', 'crucifixo-halter', 'crucifixo-incl', 'crucifixo-solo', 'flexao-aberta']},
  dip: {r: 'comp', c: ['paralelas-peito', 'mergulho-maquina', 'flexao-diamante', 'mergulho-cadeiras']},
  pullV: {r: 'comp', c: ['puxada-aberta', 'puxada-maquina', 'barra-fixa', 'puxada-elastico', 'pullover-halter', 'kb-remada', 'trx-remada', 'remada-mesa', 'superman-puxada']},
  pullV2: {r: 'comp', c: ['puxada-neutra', 'puxada-supinada', 'graviton', 'barra-supinada', 'barra-neutra', 'barra-arqueiro', 'puxada-elastico', 'pullover-halter', 'kb-remada', 'trx-remada', 'remada-mochila', 'superman-puxada']},
  rowH: {r: 'comp', c: ['remada-curvada', 'remada-baixa', 'remada-baixa-aberta', 'remada-maquina', 'serrote', 'remada-curvada-halter', 'remada-pendlay', 'kb-remada', 'remada-elastico', 'trx-remada', 'remada-invertida', 'remada-mesa', 'remada-porta', 'remada-mochila']},
  rowH2: {r: 'comp', c: ['remada-maquina', 'remada-iso', 'remada-baixa-aberta', 'remada-apoiada-t', 'remada-incl-halter', 'kb-renegade', 'kb-remada', 'remada-unilateral-elastico', 'trx-remada', 'remada-invertida', 'remada-mochila', 'remada-porta', 'remada-mesa']},
  ohp: {r: 'comp', c: ['desenv-halter', 'desenv-maquina', 'desenv-barra', 'kb-desenv', 'desenv-elastico', 'pike', 'flexao-declinada']},
  lat: {r: 'small', c: ['elev-lateral-cabo', 'elev-lateral-maquina', 'elev-lateral-halter', 'remada-alta-halter', 'elev-frontal-elastico', 'elev-y-solo']},
  front: {r: 'small', c: ['elev-frontal', 'elev-frontal-cabo', 'elev-frontal-barra']},
  rear: {r: 'small', c: ['voador-inverso', 'face-pull', 'crucifixo-inverso-halter', 'crucifixo-inverso-incl', 'face-pull-elastico', 'trx-remada-posterior', 'trx-y', 'crucifixo-inverso-elastico', 'anjo-reverso', 'elev-y-solo']},
  shrug: {r: 'iso', c: ['encolhimento-halter', 'encolhimento-barra', 'encolhimento-smith']},
  bi: {r: 'iso', c: ['rosca-barra', 'rosca-halter', 'rosca-elastico', 'trx-rosca', 'barra-supinada']},
  bi2: {r: 'iso', c: ['rosca-inclinada', 'rosca-martelo', 'rosca-concentrada', 'rosca-elastico', 'rosca-scott-halter']},
  bi3: {r: 'iso', c: ['rosca-scott', 'rosca-scott-cabo', 'rosca-martelo-corda', 'rosca-martelo', 'rosca-concentrada', 'rosca-arrastada', 'rosca-martelo-cruzada']},
  tri: {r: 'iso', c: ['triceps-corda', 'triceps-v', 'triceps-frances-halter', 'triceps-elastico', 'trx-triceps', 'flexao-diamante', 'mergulho-banco', 'mergulho-cadeiras']},
  tri2: {r: 'iso', c: ['triceps-frances-cabo', 'triceps-halter-deitado', 'triceps-coice', 'triceps-coice-cabo', 'triceps-unilateral-cabo', 'triceps-unilateral-halter', 'mergulho-banco', 'flexao-diamante']},
  tri3: {r: 'iso', c: ['triceps-testa', 'triceps-barra', 'triceps-v', 'triceps-frances-pe', 'paralelas']},
  squat: {r: 'main', c: ['agachamento', 'hack', 'goblet', 'agachamento-halter', 'agachamento-sumo-halter', 'agachamento-elastico', 'trx-agachamento', 'agachamento-livre', 'agachamento-cadeira']},
  squat2: {r: 'comp', c: ['leg-press', 'leg-press-horizontal', 'hack', 'agachamento-pendulo', 'agachamento-smith', 'afundo-smith', 'leg-press-unilateral', 'bulgaro', 'bulgaro-cadeira', 'goblet', 'kb-afundo', 'agachamento-elastico', 'trx-agachamento', 'trx-agachamento-unilateral', 'subida-degrau', 'agachamento-cossaco', 'agachamento-unilateral']},
  lunge: {r: 'comp', c: ['bulgaro', 'afundo', 'afundo-smith', 'afundo-reverso-halter', 'afundo-lateral-halter', 'afundo-cruzado-halter', 'step-up', 'kb-afundo', 'afundo-reverso', 'subida-caixa', 'afundo-caminhando', 'afundo-lateral', 'afundo-cruzado', 'descida-degrau']},
  hinge: {r: 'comp', c: ['stiff-barra', 'stiff-halter', 'stiff-smith', 'kb-stiff', 'kettlebell-swing', 'stiff-elastico', 'ponte-unilateral', 'bom-dia-solo']},
  dead: {r: 'main', c: ['levantamento-terra', 'terra-hexagonal', 'terra-halter', 'kb-terra', 'kb-sumo', 'kettlebell-swing', 'stiff-elastico', 'ponte-unilateral', 'bom-dia-solo']},
  legcurl: {r: 'iso', c: ['cadeira-flexora', 'mesa-flexora', 'flexora-em-pe', 'flexora-unilateral', 'flexora-halter', 'stiff-unilateral', 'trx-flexora', 'flexora-elastico', 'flexora-toalha', 'flexora-nordica', 'ponte-unilateral']},
  legext: {r: 'iso', c: ['extensora', 'extensora-unilateral', 'extensora-elastico', 'sissy', 'cadeirinha']},
  glute: {r: 'comp', c: ['elevacao-pelvica', 'hip-thrust-maquina', 'elevacao-pelvica-smith', 'hip-thrust-halter', 'ponte-halter', 'kettlebell-swing', 'ponte', 'gluteo-maquina', 'pull-through', 'ponte-elastico', 'coice-elastico', 'elevacao-pelvica-sofa', 'ponte-unilateral', 'ponte-solo', 'coice-quatro']},
  abduct: {r: 'small', c: ['abducao', 'abducao-cabo', 'abducao-elastico', 'monster-walk', 'abducao-deitada', 'hidrante', 'ostra']},
  adduct: {r: 'small', c: ['adutora', 'aducao-cabo', 'adutor-deitado']},
  calf: {r: 'small', c: ['pant-pe', 'pant-sentado', 'pant-hack', 'pant-halter', 'pant-degrau']},
  core: {r: 'core', c: ['abd-polia', 'abd-maquina', 'elev-pernas', 'pallof', 'prancha', 'abd-reverso', 'perdigueiro', 'prancha-urso', 'hollow-hold']},
  core2: {r: 'core', c: ['lenhador', 'rotacao-tronco', 'elev-pernas-barra', 'kb-moinho', 'abd-russo', 'dead-bug', 'prancha-lateral', 'canoa', 'v-up', 'limpador', 'prancha-lateral-rotacao', 'prancha-spiderman', 'flutter', 'sit-up', 'prancha-toque-ombro', 'trx-prancha']},
  hiit: {r: 'circ', c: ['burpee', 'kb-snatch', 'agachamento-salto', 'escalador', 'salto-grupado', 'corda-naval', 'air-bike', 'prancha-polichinelo']},
  hiit2: {r: 'circ', c: ['polichinelo', 'skater', 'skipping', 'urso', 'chute-gluteo', 'prancha-polichinelo']},
  cardio: {r: 'cardio', c: ['caminhada-inclinada', 'bike', 'eliptico', 'stepmill', 'air-bike', 'corrida', 'marcha', 'polichinelo']},
};
// esquema de séries por objetivo e papel: [séries, reps mín, reps máx, descanso s]
const SCHEMES = {
  hipertrofia: {main: [3, 6, 10, 150], comp: [3, 8, 12, 120], iso: [3, 10, 15, 75], small: [3, 12, 20, 60], core: [3, 10, 15, 60]},
  forca: {main: [5, 3, 5, 180], comp: [3, 6, 8, 150], iso: [3, 8, 12, 90], small: [3, 10, 15, 60], core: [3, 8, 12, 60]},
  definicao: {main: [3, 8, 12, 90], comp: [3, 10, 12, 75], iso: [3, 12, 15, 60], small: [3, 15, 20, 45], core: [3, 15, 20, 45]},
  condicionamento: {main: [3, 10, 12, 0], comp: [3, 10, 15, 0], iso: [3, 12, 15, 0], small: [3, 15, 20, 0], core: [3, 15, 20, 0]},
  saude: {main: [3, 8, 12, 120], comp: [3, 10, 12, 90], iso: [2, 12, 15, 60], small: [2, 12, 15, 60], core: [2, 10, 15, 60]},
};
// treinos-modelo (vagas em ordem de prioridade) e tipo do dia
const DAYS = {
  FA: {n: 'Corpo inteiro A', k: 'F', s: ['squat', 'pressH', 'rowH', 'hinge', 'ohp', 'bi', 'tri', 'calf', 'core']},
  FB: {n: 'Corpo inteiro B', k: 'F', s: ['hinge', 'pullV', 'pressI', 'lunge', 'lat', 'legcurl', 'tri2', 'bi2', 'core2']},
  FC: {n: 'Corpo inteiro C', k: 'F', s: ['squat2', 'pressH2', 'rowH2', 'glute', 'rear', 'lat', 'bi2', 'tri', 'calf']},
  UA: {n: 'Superiores A', k: 'U', s: ['pressH', 'rowH', 'ohp', 'pullV', 'lat', 'bi', 'tri', 'rear']},
  UB: {n: 'Superiores B', k: 'U', s: ['pressI', 'pullV2', 'rowH2', 'fly', 'lat', 'bi2', 'tri2', 'rear']},
  LA: {n: 'Inferiores A', k: 'L', s: ['squat', 'hinge', 'squat2', 'legcurl', 'calf', 'core', 'legext']},
  LB: {n: 'Inferiores B', k: 'L', s: ['dead', 'glute', 'lunge', 'legext', 'legcurl', 'calf', 'core2']},
  PU: {n: 'Push', k: 'P', s: ['pressH', 'pressI', 'ohp', 'fly', 'lat', 'tri', 'tri2']},
  PL: {n: 'Pull', k: 'B', s: ['pullV', 'rowH', 'rowH2', 'rear', 'bi', 'bi2', 'shrug']},
  LG: {n: 'Legs', k: 'L', s: ['squat', 'hinge', 'squat2', 'legcurl', 'legext', 'calf', 'core']},
  PU2: {n: 'Push B', k: 'P', s: ['pressI', 'ohp', 'pressH2', 'dip', 'lat', 'tri3', 'tri2']},
  PL2: {n: 'Pull B', k: 'B', s: ['rowH2', 'pullV2', 'rowH', 'rear', 'bi2', 'bi3', 'shrug']},
  LG2: {n: 'Legs B', k: 'L', s: ['dead', 'squat2', 'lunge', 'legcurl', 'glute', 'calf', 'core2']},
  GA: {n: 'Glúteos e posteriores', k: 'L', s: ['glute', 'hinge', 'lunge', 'abduct', 'legcurl', 'core']},
  GB: {n: 'Glúteos e quadríceps', k: 'L', s: ['squat', 'glute', 'squat2', 'abduct', 'legext', 'calf']},
  CI: {n: 'Circuito A', k: 'F', s: ['squat', 'pressH', 'rowH', 'hiit', 'lunge', 'ohp', 'hiit2', 'core']},
  CI2: {n: 'Circuito B', k: 'F', s: ['hinge', 'pullV', 'pressI', 'hiit2', 'squat2', 'lat', 'hiit', 'core2']},
  CI3: {n: 'Circuito C', k: 'F', s: ['lunge', 'pressH2', 'rowH2', 'hiit', 'glute', 'rear', 'hiit2', 'core']},
};
const SPLITS = {
  2: ['FA', 'FB'], 3: ['FA', 'FB', 'FC'], 4: ['UA', 'LA', 'UB', 'LB'], 5: ['UA', 'LA', 'PU', 'PL', 'LG'], 6: ['PU', 'PL', 'LG', 'PU2', 'PL2', 'LG2'],
  'ppl3': ['PU', 'PL', 'LG'], 'glute4': ['GA', 'UA', 'GB', 'UB'], 'glute3': ['GA', 'FA', 'GB'], 'circ3': ['CI', 'CI2', 'CI3'],
};
const DUR_N = {30: 4, 45: 5, 60: 6, 75: 7};
const FOCUS_DAY = {peito: 'FUP', costas: 'FUB', bracos: 'FUPB', ombros: 'FUP', gluteos: 'FL', pernas: 'FL', abdomen: 'FULPB'};

/* Escolhe o exercício da vaga: só o que dá para fazer no local; com o equipamento principal do local primeiro
   (num programa de kettlebell, o kettlebell vem antes do peso do corpo). */
/* pedem força ou técnica avançada: fora dos programas de iniciante */
const HARD = ['remada-pendlay', 'barra-fixa-peso', 'sissy', 'agachamento-unilateral', 'flexora-nordica', 'flexao-parede-invertida', 'flexao-arqueiro', 'paralelas', 'paralelas-peito', 'kb-snatch', 'elev-pernas-barra', 'flexao-palma', 'barra-arqueiro', 'joelho-cotovelo-suspenso', 'trx-pike', 'salto-grupado', 'trx-agachamento-unilateral', 'canivete'];
/* v4.31: limitações e condições. Fontes: ACSM (2026, treino de força; hipertensão), NSCA (idosos, 2019; joelho),
   ACOG (gestação, 2020) e revisões sobre dor lombar e ombro. "ban" sai do programa; "pre" sobe na lista da vaga. */
const LIMS = {
  ombro: {n: 'Ombro', ban: ['remada-alta', 'remada-alta-halter', 'remada-alta-maquina', 'desenv-barra', 'paralelas', 'paralelas-peito', 'mergulho-maquina', 'mergulho-banco', 'mergulho-cadeiras', 'supino-reto-barra', 'supino-incl-barra', 'supino-decl-barra', 'barra-fixa', 'puxada-aberta', 'barra-arqueiro', 'pullover-halter', 'flexao-arqueiro', 'flexao-parede-invertida', 'pike', 'trx-pike', 'triceps-frances-pe', 'triceps-frances-halter', 'kb-snatch', 'crucifixo-halter', 'crucifixo-incl', 'crucifixo-solo', 'flexao-aberta', 'barra-fixa-peso', 'elev-frontal-barra'],
    pre: ['supino-pegada-neutra', 'supino-reto-halter', 'supino-reto-maquina', 'desenv-maquina', 'puxada-neutra', 'face-pull', 'remada-baixa', 'triceps-corda'], more: 'rowH2',
    why: 'Ombro: saem remada alta, paralelas, desenvolvimento com barra e crucifixo aberto. Entram halteres e pegada neutra, e mais puxadas do que empurrões.'},
  joelho: {n: 'Joelho', ban: ['agachamento-salto', 'afundo-salto', 'salto-grupado', 'burpee', 'skipping', 'corrida', 'pular-corda', 'skater', 'sissy', 'agachamento-unilateral', 'trx-agachamento-unilateral', 'agachamento-cossaco', 'afundo-caminhando', 'afundo-cruzado', 'afundo-cruzado-halter', 'afundo-lateral', 'afundo-lateral-halter', 'bulgaro', 'bulgaro-cadeira', 'agachamento-frontal', 'afundo-barra', 'descida-degrau', 'flexora-nordica', 'kb-afundo', 'afundo', 'agachamento', 'afundo-smith', 'agachamento-pendulo'],
    pre: ['leg-press', 'agachamento-cadeira', 'subida-degrau', 'step-up', 'elevacao-pelvica', 'hip-thrust-maquina', 'elevacao-pelvica-smith', 'cadeira-flexora', 'mesa-flexora', 'goblet'], depth: true,
    why: 'Joelho: sem saltos, afundos profundos e agachamento livre com barra. Agachamentos e leg press vão até cerca de 90° de joelho, com mais glúteo e posterior.'},
  lombar: {n: 'Lombar', ban: ['levantamento-terra', 'terra-sumo', 'bom-dia', 'bom-dia-solo', 'remada-curvada', 'remada-curvada-halter', 'agachamento', 'agachamento-frontal', 'afundo-barra', 'stiff-barra', 'kettlebell-swing', 'kb-snatch', 'sit-up', 'v-up', 'canivete', 'abd-declinado', 'elev-pernas', 'elev-pernas-barra', 'flutter', 'limpador', 'abd-russo', 'superman-puxada', 'desenv-barra', 'abd-solo', 'rotacao-tronco', 'remada-pendlay', 'terra-hexagonal', 'stiff-smith'],
    pre: ['leg-press', 'leg-press-horizontal', 'remada-maquina', 'hack', 'remada-apoiada-t', 'remada-incl-halter', 'remada-iso', 'serrote', 'remada-baixa', 'elevacao-pelvica', 'hip-thrust-maquina', 'stiff-halter', 'perdigueiro', 'prancha-lateral', 'dead-bug', 'pallof', 'prancha'],
    why: 'Lombar: saem terra e stiff com barra, bom-dia, remada curvada e agachamento com barra nas costas. Entram remadas com apoio, leg press, elevação pélvica e core de estabilidade, como perdigueiro e prancha lateral.'},
  punho: {n: 'Punho ou cotovelo', ban: ['flexao', 'flexao-joelhos', 'flexao-diamante', 'flexao-declinada', 'flexao-aberta', 'flexao-arqueiro', 'flexao-palma', 'flexao-inclinada', 'flexao-parede', 'trx-flexao', 'prancha-toque-ombro', 'prancha-urso', 'urso', 'escalador', 'burpee', 'prancha-spiderman', 'prancha-polichinelo', 'rosca-barra', 'triceps-testa', 'triceps-barra', 'agachamento-frontal', 'kb-snatch', 'pike', 'paralelas', 'paralelas-peito', 'rosca-punho', 'rosca-punho-inversa'],
    pre: ['rosca-martelo', 'rosca-halter', 'rosca-maquina', 'triceps-corda', 'triceps-maquina', 'supino-reto-maquina', 'supino-pegada-neutra'],
    why: 'Punho ou cotovelo: sem flexões com a mão no chão e sem barra reta nas roscas e no tríceps. Entram halteres, cordas e máquinas, que deixam o punho mais neutro.'},
  quadril: {n: 'Quadril', ban: ['agachamento-sumo-halter', 'terra-sumo', 'agachamento-cossaco', 'afundo-lateral', 'afundo-lateral-halter', 'bulgaro', 'bulgaro-cadeira', 'afundo-salto', 'agachamento-salto', 'salto-grupado', 'afundo-cruzado', 'afundo-cruzado-halter', 'corrida'],
    pre: ['leg-press', 'elevacao-pelvica', 'hip-thrust-maquina', 'ponte', 'cadeira-flexora', 'subida-degrau'], depth: true,
    why: 'Quadril: sem afundos laterais, agachamento sumo e saltos. A amplitude dos agachamentos fica onde não dói, com glúteo trabalhado em ponte e elevação pélvica.'},
  pescoco: {n: 'Pescoço', ban: ['encolhimento-barra', 'encolhimento-halter', 'desenv-barra', 'abd-solo', 'sit-up', 'v-up', 'canivete', 'kb-snatch', 'barra-fixa'],
    pre: ['desenv-maquina', 'puxada-neutra', 'abd-maquina', 'prancha', 'dead-bug'], drop: ['shrug'],
    why: 'Pescoço: sem encolhimentos, desenvolvimento com barra e abdominais que puxam a cabeça. O abdômen fica com prancha e dead bug.'},
  impacto: {n: 'Sem impacto', ban: ['agachamento-salto', 'afundo-salto', 'salto-grupado', 'burpee', 'skipping', 'corrida', 'pular-corda', 'skater', 'polichinelo', 'prancha-polichinelo', 'chute-gluteo', 'kb-snatch', 'escalador'],
    pre: ['bike', 'eliptico', 'caminhada-inclinada', 'remo-ergometro', 'air-bike', 'corda-naval'],
    why: 'Sem impacto: nada de saltos ou corrida. O cardio vai para bicicleta, elíptico, remo ou caminhada inclinada.'},
  pressao: {n: 'Pressão alta', cond: true, rmin: 8, rmax: 15, rir: 2, rest: 90, noHiit: true,
    why: 'Pressão alta: séries de 8 a 15 repetições, sem ir à falha e sem prender a respiração (solte o ar na subida). O aeróbico moderado também ajuda a baixar a pressão.'},
  coracao: {n: 'Coração, diabetes ou outra condição', cond: true, rmin: 10, rmax: 15, rir: 3, rest: 90, noHiit: true, clear: true,
    why: 'Condição de saúde: intensidade moderada, parando com 3 repetições sobrando e descansos maiores. Antes de começar, peça a liberação do seu médico.'},
  gestacao: {n: 'Gestação', cond: true, rmin: 10, rmax: 15, rir: 3, rest: 60, noHiit: true, clear: true,
    ban: ['supino-reto-barra', 'supino-reto-halter', 'supino-reto-smith', 'supino-decl-barra', 'supino-decl-halter', 'supino-fechado', 'crucifixo-halter', 'crucifixo-solo', 'kb-supino-solo', 'triceps-testa', 'triceps-halter-deitado', 'ponte', 'ponte-solo', 'ponte-unilateral', 'ponte-elastico', 'ponte-halter', 'ponte-marcha', 'dead-bug', 'abd-solo', 'abd-declinado', 'abd-bicicleta', 'abd-obliquo', 'abd-cruzado', 'abd-reverso', 'abd-russo', 'abd-polia', 'abd-maquina', 'sit-up', 'v-up', 'flutter', 'canivete', 'hollow-hold', 'elev-pernas', 'elev-pernas-barra', 'limpador', 'canoa', 'mesa-flexora', 'superman-puxada', 'burpee', 'agachamento-salto', 'afundo-salto', 'salto-grupado', 'kettlebell-swing', 'kb-snatch', 'skipping', 'pular-corda', 'corrida', 'bulgaro', 'bulgaro-cadeira', 'agachamento-unilateral', 'trx-agachamento-unilateral', 'afundo-caminhando', 'levantamento-terra', 'terra-sumo', 'escalador', 'prancha-polichinelo'],
    pre: ['supino-reto-maquina', 'supino-incl-maquina', 'supino-incl-halter', 'desenv-maquina', 'leg-press', 'cadeira-flexora', 'pallof', 'perdigueiro', 'prancha-lateral', 'remada-baixa', 'bike', 'eliptico', 'caminhada-inclinada'],
    why: 'Gestação: nada deitada de barriga para cima por muito tempo, sem saltos e sem exercícios de muito equilíbrio, com séries moderadas e sem prender a respiração. Pare se sentir tontura, dor, sangramento ou falta de ar, e só comece com a liberação do obstetra.'},
};
/* número fixo por pessoa: duas pessoas com as mesmas respostas não recebem sempre os mesmos exercícios */
function seedOf(str){ let h = 2166136261; for (const ch of String(str)){ h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function pickEx(slot, eq, used, prefMachine, local, beginner, gym, X){
  const inv = gym && gym.inv ? new Set(gym.inv) : null; X = X || {};
  let c = SLOTS[slot].c.filter(x => CAT[x] && !CAT[x].hid && exOk(x, local || 'academia') && !(beginner && HARD.includes(x)) && !(X.ban && X.ban.has(x)) && (!inv || (local || 'academia') !== 'academia' || gymOk(x, inv)));
  const main = local && LOCAIS[local] && LOCAIS[local].main;
  if (main) c = [...c].sort((a, b) => (CAT[b].e === main) - (CAT[a].e === main));
  const pref = gym && gym.pref;
  /* preferência da pessoa: pesos livres ou máquinas primeiro; na academia completa, as máquinas específicas ganham espaço */
  /* preferência suave: sobe algumas posições, sem trocar um bom exercício por um bem pior (ex.: flexora com halter no lugar da cadeira flexora) */
  const soft = (L, test, k) => { const r = x => L.indexOf(x) - (test(x) ? k : 0); return [...L].sort((a, b) => r(a) - r(b)); };
  const kk = /iso|small/.test(SLOTS[slot].r) ? .8 : 2.5;
  if (pref === 'livre') c = soft(c, x => GYM_LIVRE.includes(CAT[x].e) && CAT[x].e !== 'peso', kk);
  else if (pref === 'maq' || (prefMachine && pref !== 'livre')) c = pref === 'maq' ? soft(c, x => GYM_MAQ.includes(CAT[x].e), kk) : [...c].sort((a, b) => GYM_MAQ.includes(CAT[b].e) - GYM_MAQ.includes(CAT[a].e));
  if (gym && gym.tipo === 'completa' && pref !== 'livre'){ const r = x => c.indexOf(x) - (G_ARTIC.has(x) || G_CROSS.has(x) ? 1.5 : 0); c = [...c].sort((a, b) => r(a) - r(b)); }
  if (X.pre && X.pre.size) c = soft(c, x => X.pre.has(x), 2.5);
  const free = c.filter(x => !used.has(x));
  /* entre as duas melhores opções equivalentes, a escolha segue a pessoa (exercício principal fica sempre o primeiro) */
  const weak = x => ['elastico', 'casa', 'peso'].includes(CAT[x].e);
  if (X.seed != null && free.length > 1 && SLOTS[slot].r !== 'main' && !(X.pre && X.pre.has(free[0]) && !X.pre.has(free[1])) && !(weak(free[1]) && !weak(free[0]))){ const h = seedOf(X.seed + slot + (X.wi || 0)); if (h % 100 < 38) return free[1]; }
  return free[0] || null;
}
/* Gera um programa. o = {goal, local, dias, nivel, dur, foco, split} */
function genProgram(o){
  const eq = (LOCAIS[o.local] || LOCAIS.academia).eq; const sch = SCHEMES[o.goal] || SCHEMES.hipertrofia;
  const keys = o.keys || SPLITS[o.split || o.dias] || SPLITS[3];
  const beginner = o.nivel === 'Iniciante'; const novato = !!o.novato; const n = Math.max(4, (DUR_N[o.dur] || 6) - (novato ? 1 : 0)); const circuit = o.goal === 'condicionamento';
  /* um ou mais músculos prioritários (o primeiro escolhido entra mais cedo no treino) */
  const fos = (o.focos || (o.foco ? [o.foco] : [])).filter(k => FOCOS[k]);
  /* v4.31: limitações, idade, ritmo e cardio da pessoa */
  const lim = (o.lim || []).filter(k => LIMS[k]); const L0 = lim.map(k => LIMS[k]);
  const X = {ban: new Set(L0.flatMap(l => l.ban || [])), pre: new Set(L0.flatMap(l => l.pre || [])), seed: o.seed != null ? String(o.seed) : null};
  const age = +o.age || 0; const older = age >= 60; const teen = age && age < 18;
  if (older){ HARD.forEach(x => X.ban.add(x)); ['agachamento-salto', 'afundo-salto', 'salto-grupado', 'burpee', 'kb-snatch'].forEach(x => X.ban.add(x)); }
  const cond = L0.filter(l => l.cond); const noHiit = cond.some(l => l.noHiit); if (noHiit) SLOTS.hiit.c.forEach(x => X.ban.add(x));
  const ritmo = o.ritmo || 'equil'; const adv = o.nivel === 'Avançado'; const mid = o.nivel === 'Intermediário';
  const rirBase = cond.length ? Math.max(...cond.map(l => l.rir)) : novato || beginner ? 3 : ritmo === 'leve' ? 3 : ritmo === 'forte' ? (adv ? 0 : 1) : (adv ? 1 : 2);
  const cardio = o.cardio || (o.goal === 'definicao' ? 'leve' : 'nao'); const cardioT = noHiit && cardio === 'hiit' ? 'leve' : cardio;
  const why = [];
  const seen = {};
  const workouts = keys.map((k, wi) => {
    const d = DAYS[k]; let slots = [...d.s]; let extra = 0; X.wi = wi; seen[k] = (seen[k] || 0) + 1; const rep2 = seen[d.k + '#'] = (seen[d.k + '#'] || 0) + 1;
    L0.forEach(l => { if (l.drop) slots = slots.filter(x => !l.drop.includes(x)); if (l.more && /U|P|F/.test(d.k) && !slots.includes(l.more)) slots.splice(Math.min(3, slots.length), 0, l.more); });
    fos.slice().reverse().forEach(fk => { const fo = FOCOS[fk]; if (!FOCUS_DAY[fk].includes(d.k)) return; const at = fo.small ? Math.min(3, slots.length) : 1; slots.splice(at, 0, ...fo.slots); extra++; });
    slots = [...new Set(slots)]; extra = Math.min(1, extra);
    const used = new Set(); const items = [];
    for (const s of slots){
      if (items.length >= n + extra) break;
      const ex = pickEx(s, eq, used, (beginner || novato || older) && o.local === 'academia', o.local, beginner || older, o.local === 'academia' ? o.gym : null, X); if (!ex) continue; used.add(ex);
      const role = SLOTS[s].r === 'circ' ? 'comp' : SLOTS[s].r === 'cardio' ? 'comp' : SLOTS[s].r;
      let [sets, rmin, rmax, rest] = sch[role] || sch.comp;
      if (beginner){ sets = Math.max(2, sets - 1); if (o.goal !== 'forca'){ rmin = Math.max(rmin, 10); rmax = Math.max(rmax, 15); } }
      if (novato){ sets = Math.min(sets, 3); if (o.goal !== 'forca'){ rmin = Math.max(rmin, 12); rmax = Math.max(rmax, 15); } rest = Math.max(rest, 60); }
      if ((CAT[ex].e === 'peso' || CAT[ex].e === 'casa') && o.goal !== 'forca' && /comp|main/.test(role)){ rmin = Math.max(rmin, 8); rmax = Math.max(rmax, 20); rest = Math.min(rest, 90); }
      if (CAT[ex].e === 'elastico'){ rmin = Math.max(rmin, 12); rmax = Math.max(rmax, 20); }
      /* avançado em hipertrofia: um pouco mais de volume nos exercícios principais */
      if (adv && (o.goal === 'hipertrofia' || o.goal === 'forca') && /main|comp/.test(role) && !circuit) sets += 1;
      /* ondulação: no segundo treino do mesmo tipo na semana, repetições mais altas (intermediário e avançado) */
      if ((mid || adv) && rep2 > 1 && (o.goal === 'hipertrofia' || o.goal === 'definicao') && role === 'comp' && !circuit){ rmin = Math.max(rmin + 2, 10); rmax = Math.max(rmax + 3, 15); rest = Math.max(60, rest - 30); }
      if (older){ rmin = Math.max(rmin, 8); rmax = Math.max(rmax, 12); rest = Math.max(rest, 90); }
      if (teen && rmin < 6){ rmin = 6; rmax = Math.max(rmax, 10); }
      cond.forEach(l => { rmin = Math.max(rmin, l.rmin); rmax = Math.max(rmax, l.rmax, rmin + 2); rest = circuit ? rest : Math.max(rest, l.rest); if (sets > 3) sets = 3; });
      let nota = '';
      if (L0.some(l => l.depth) && /agachamento|leg-press|hack|goblet|step|subida/.test(ex)) nota = 'Desça só até onde não doer, por volta de 90° de joelho.';
      if (L0.some(l => l.depth) && /extensora/.test(ex)) nota = 'Use uma amplitude sem dor e não force o fim do movimento.';
      if (lim.includes('lombar') && /stiff|terra|hip|elevacao|ponte/.test(ex)) nota = 'Carga moderada e coluna neutra. Pare se a dor aumentar.';
      items.push({ex, sets, rmin, rmax, rest, nota});
    }
    if (circuit && items.length){ items.forEach(x => { x.rest = 0; x.sets = beginner ? 3 : 4; }); items[items.length - 1].rest = 90; items[0].nota = 'Circuito: faça os exercícios em sequência e descanse 90 s ao fim de cada volta.'; }
    if (o.goal === 'definicao' && !cond.length){ for (let i = 2; i + 1 < items.length; i += 2){ if (items[i].nota) continue; items[i].rest = 0; items[i].nota = 'Bi-set: vá direto para o próximo exercício.'; } }
    /* técnica de intensidade só para quem pediu ritmo puxado e já tem experiência */
    if (ritmo === 'forte' && (adv || mid) && !cond.length && !circuit && (o.goal === 'hipertrofia' || o.goal === 'definicao')){ const iso = [...items].reverse().find(x => /iso|small/.test((Object.entries(SLOTS).find(([, v]) => v.c.includes(x.ex)) || [, {}])[1].r || '') && !x.nota); if (iso) iso.nota = 'Na última série, faça um drop-set: tire cerca de 30% da carga e siga até perto da falha.'; }
    if (!circuit && cardioT !== 'nao'){
      const cs = cardioT === 'hiit' ? ['air-bike', 'bike', 'remo-ergometro', 'corda-naval', 'eliptico', 'corrida', 'pular-corda'] : ['caminhada-inclinada', 'bike', 'eliptico', 'stepmill', 'remo-ergometro', 'corrida', 'marcha'];
      const c = cs.find(x => CAT[x] && !CAT[x].hid && !X.ban.has(x) && exOk(x, o.local || 'academia') && (o.local !== 'academia' || !o.gym || !o.gym.inv || gymOk(x, new Set(o.gym.inv))));
      if (c) items.push(cardioT === 'hiit' ? {ex: c, sets: 1, rmin: 8, rmax: 10, rest: 0, nota: 'Intervalado: 30 s forte e 60 s leve, de 6 a 8 vezes. Anote os minutos no campo de repetições.'} : {ex: c, sets: 1, rmin: o.goal === 'definicao' ? 15 : 10, rmax: o.goal === 'definicao' ? 20 : 15, rest: 0, nota: `Cardio moderado de ${o.goal === 'definicao' ? '15 a 20' : '10 a 15'} minutos, conseguindo conversar. Anote os minutos no campo de repetições.`});
    }
    if (items[0] && SLOTS[d.s[0]].r === 'main' && !circuit && !items[0].nota) items[0].nota = 'Faça 1 a 2 séries leves de aproximação antes.';
    return {nome: d.n, cor: wi % COLORS, items};
  });
  /* o porquê de cada escolha, para a tela de resultado */
  const rirTxt = rirBase >= 3 ? 'com 3 repetições sobrando' : rirBase === 2 ? 'com 2 repetições sobrando' : rirBase === 1 ? 'com 1 ou 2 repetições sobrando' : 'perto da falha nos exercícios isolados';
  why.push({t: 'Esforço', d: `Termine cada série ${rirTxt}. ${o.goal === 'forca' ? 'Para força, não precisa ir à falha.' : rirBase <= 1 ? 'Chegar perto da falha ajuda no ganho de massa.' : 'Assim dá para aprender a técnica e progredir com segurança.'}`});
  if (beginner || novato) why.push({t: 'Começo', d: `${novato ? 'Começando agora' : 'Iniciante'}: menos séries, mais repetições e exercícios mais fáceis de aprender. Quando fizer todas as repetições com folga, suba a carga.`});
  else if ((mid || adv) && (o.goal === 'hipertrofia' || o.goal === 'definicao') && keys.length >= 4) why.push({t: 'Variação na semana', d: 'O segundo treino de cada tipo usa repetições mais altas que o primeiro. Assim os músculos recebem estímulos diferentes na mesma semana.'});
  if (adv && (o.goal === 'hipertrofia' || o.goal === 'forca')) why.push({t: 'Volume', d: 'Avançado: uma série a mais nos exercícios principais, porque quem já treina há anos costuma precisar de mais volume para continuar evoluindo.'});
  if (older) why.push({t: '60 anos ou mais', d: 'Mais máquinas e apoio, 8 a 12 repetições e 90 s ou mais de descanso. Suba o peso com firmeza e desça devagar.'});
  if (teen) why.push({t: 'Menos de 18 anos', d: 'Sem cargas máximas: 6 repetições ou mais por série, de preferência com acompanhamento de um professor.'});
  L0.forEach(l => { const d = l.why.replace(/^[^:]{2,40}: /, ''); why.push({t: l.n, d: d.charAt(0).toUpperCase() + d.slice(1)}); });
  if (cardioT !== 'nao' && !circuit) why.push({t: 'Cardio', d: cardioT === 'hiit' ? 'Intervalado curto no fim de cada treino.' : `Cardio moderado no fim de cada treino${noHiit && cardio === 'hiit' ? ', no lugar do intervalado, por segurança' : ''}.`});
  if (fos.length) why.push({t: 'Prioridade', d: 'Os músculos escolhidos ganham exercício extra e entram mais cedo nos treinos.'});
  workouts.why = why; workouts.clear = L0.some(l => l.clear);
  return workouts;
}
function genMeta(o){
  const L = LOCAIS[o.local]; const splitN = {2: 'Corpo inteiro 2x', 3: 'Corpo inteiro 3x', 4: 'Superiores e inferiores 4x', 5: 'Upper Lower + Push Pull Legs', 6: 'Push Pull Legs 6x', ppl3: 'Push Pull Legs 3x', glute4: 'Glúteos 4x', glute3: 'Glúteos 3x', circ3: 'Circuito 3x'}[o.split || o.dias];
  return splitN;
}

// ---------- programas gerados para a biblioteca ----------
const G = (id, nome, o, extra) => ({id, nome, gen: o, goal: [o.goal], local: [o.local], nivel: o.nivel, freq: (SPLITS[o.split || o.dias] || []).length, dur: o.dur, foco: o.foco ? [o.foco] : [], ...extra});
const GEN_LIST = [
  // academia
  G('g-fb2-ac', 'Corpo Inteiro 2x (minimalista)', {goal: 'hipertrofia', local: 'academia', dias: 2, nivel: 'Iniciante', dur: 60}, {tag: ['FULL', 'BODY'], art: 'goblet', desc: 'Dois treinos de corpo inteiro por semana. Mínimo eficaz para quem tem pouco tempo: cada músculo treinado 2x.'}),
  G('g-ul4-def', 'Definição Upper Lower 4x', {goal: 'definicao', local: 'academia', dias: 4, nivel: 'Intermediário', dur: 60}, {tag: ['UPPER', 'LOWER'], art: 'caminhada-inclinada', desc: 'Musculação pesada o suficiente para manter massa no déficit calórico, bi-sets para ganhar tempo e cardio moderado no fim.'}),
  G('g-circ-ac', 'Circuito Metabólico 3x', {goal: 'condicionamento', local: 'academia', split: 'circ3', nivel: 'Intermediário', dur: 45}, {tag: ['CIRCUITO', 'TOTAL'], art: 'burpee', desc: 'Exercícios em sequência, quase sem descanso, alternando força e intervalados. Gasta muita energia em pouco tempo.'}),
  G('g-glute4', 'Glúteos em Foco 4x', {goal: 'hipertrofia', local: 'academia', split: 'glute4', nivel: 'Intermediário', dur: 60, foco: 'gluteos'}, {tag: ['GLÚTEOS', 'FOCO'], art: 'elevacao-pelvica', desc: 'Dois dias de inferiores com prioridade para glúteos e dois de superiores. Estrutura comum nos treinos de personal para quem quer glúteos maiores.'}),
  G('g-glute3', 'Glúteos e Pernas 3x', {goal: 'hipertrofia', local: 'academia', split: 'glute3', nivel: 'Iniciante', dur: 60, foco: 'gluteos'}, {tag: ['GLÚTEOS', 'PERNAS'], art: 'abducao', desc: 'Três treinos, dois com ênfase em glúteos e um de corpo inteiro. Bom ponto de partida para foco em inferiores.'}),
  G('g-peito4', 'Especialização Peitoral 4x', {goal: 'hipertrofia', local: 'academia', dias: 4, nivel: 'Intermediário', dur: 60, foco: 'peito'}, {tag: ['PEITO', 'FOCO'], art: 'supino-incl-halter', desc: 'Superiores e inferiores com peitoral em primeiro e volume extra de supino inclinado e crucifixo. Use por 6 a 8 semanas.'}),
  G('g-costas4', 'Especialização Costas 4x', {goal: 'hipertrofia', local: 'academia', dias: 4, nivel: 'Intermediário', dur: 60, foco: 'costas'}, {tag: ['COSTAS', 'FOCO'], art: 'remada-baixa', desc: 'Mais puxadas e remadas nos dias de superiores, para largura e espessura das costas.'}),
  G('g-bracos5', 'Braços em Foco 5x', {goal: 'hipertrofia', local: 'academia', dias: 5, nivel: 'Avançado', dur: 75, foco: 'bracos'}, {tag: ['BRAÇOS', 'FOCO'], art: 'rosca-inclinada', desc: 'Upper, Lower, Push, Pull e Legs com bíceps e tríceps extras nos dias de superiores.'}),
  G('g-ombros4', 'Ombros 3D 4x', {goal: 'hipertrofia', local: 'academia', dias: 4, nivel: 'Intermediário', dur: 60, foco: 'ombros'}, {tag: ['OMBROS', '3D'], art: 'elev-lateral-halter', desc: 'Volume extra de deltoide lateral e posterior, as porções que mais dão largura e que costumam ficar para trás.'}),
  G('g-forca3', 'Força Corpo Inteiro 3x', {goal: 'forca', local: 'academia', dias: 3, nivel: 'Intermediário', dur: 75}, {tag: ['FORÇA', 'TOTAL'], art: 'levantamento-terra', desc: 'Básicos pesados com poucas repetições e descansos longos, mais acessórios para equilíbrio.'}),
  G('g-maq-def', 'Definição nas Máquinas 3x', {goal: 'definicao', local: 'academia', dias: 3, nivel: 'Iniciante', dur: 60}, {tag: ['DEFINIÇÃO', 'MÁQUINAS'], art: 'supino-reto-maquina', desc: 'Máquinas e polias em bi-sets, com cardio no fim. Simples de seguir e seguro para quem está começando.'}),
  G('g-ppl3', 'Push Pull Legs 3x', {goal: 'hipertrofia', local: 'academia', split: 'ppl3', nivel: 'Iniciante', dur: 60}, {tag: ['PUSH', 'PULL', 'LEGS'], art: 'puxada-aberta', desc: 'A divisão clássica em empurrar, puxar e pernas, uma vez por semana. Boa para quem tem 3 dias e prefere treinos focados.'}),
  // casa e halteres
  G('g-hal-fb3', 'Halteres Corpo Inteiro 3x', {goal: 'hipertrofia', local: 'halteres', dias: 3, nivel: 'Iniciante', dur: 45}, {tag: ['FULL', 'BODY'], art: 'agachamento-halter', desc: 'Só halteres e um banco. Três treinos de corpo inteiro com os movimentos básicos.'}),
  G('g-hal-ul4', 'Halteres Upper Lower 4x', {goal: 'hipertrofia', local: 'halteres', dias: 4, nivel: 'Intermediário', dur: 60}, {tag: ['UPPER', 'LOWER'], art: 'supino-incl-halter', desc: 'Superiores e inferiores duas vezes por semana usando apenas halteres.'}),
  G('g-hal-ppl', 'Halteres Push Pull Legs 3x', {goal: 'hipertrofia', local: 'halteres', split: 'ppl3', nivel: 'Intermediário', dur: 45}, {tag: ['PUSH', 'PULL', 'LEGS'], art: 'serrote', desc: 'Empurrar, puxar e pernas com halteres. Ideal para academia de prédio ou home gym.'}),
  G('g-hal-def', 'Halteres Definição 3x', {goal: 'definicao', local: 'halteres', dias: 3, nivel: 'Intermediário', dur: 45}, {tag: ['DEFINIÇÃO', 'CASA'], art: 'terra-halter', desc: 'Bi-sets com halteres e um bloco de cardio sem equipamento no fim.'}),
  G('g-casa3', 'Em Casa Completo 3x', {goal: 'hipertrofia', local: 'casa', dias: 3, nivel: 'Iniciante', dur: 45}, {tag: ['EM', 'CASA'], art: 'agachamento-livre', desc: 'Sem nenhum equipamento: peso do corpo, uma cadeira firme, a mesa, a mochila e a toalha. Cobre todos os grupos musculares em três treinos.'}),
  G('g-casa4', 'Em Casa Upper Lower 4x', {goal: 'hipertrofia', local: 'casa', dias: 4, nivel: 'Intermediário', dur: 45}, {tag: ['UPPER', 'LOWER'], art: 'remada-mesa', desc: 'Superiores e inferiores em casa, sem equipamento. Remada embaixo da mesa, flexões, pike e variações de agachamento e afundo.'}),
  G('g-casa-glute', 'Glúteos em Casa 3x', {goal: 'hipertrofia', local: 'casa', split: 'glute3', nivel: 'Iniciante', dur: 45, foco: 'gluteos'}, {tag: ['GLÚTEOS', 'CASA'], art: 'elevacao-pelvica-sofa', desc: 'Sem equipamento: elevação pélvica no sofá, abduções no chão, afundos e agachamentos, com um dia de corpo inteiro.'}),
  // peso corporal
  G('g-cal-fb3', 'Calistenia Iniciante 3x', {goal: 'hipertrofia', local: 'peso', dias: 3, nivel: 'Iniciante', dur: 45}, {tag: ['CALIS', 'TENIA'], art: 'flexao', desc: 'Peso do corpo com barra fixa: flexões, barras, agachamentos e remada invertida. Progrida aumentando repetições e depois variações mais difíceis.'}),
  G('g-cal-ul4', 'Calistenia Upper Lower 4x', {goal: 'hipertrofia', local: 'peso', dias: 4, nivel: 'Intermediário', dur: 45}, {tag: ['UPPER', 'LOWER'], art: 'barra-fixa', desc: 'Peso do corpo com barra fixa. Inclui variações como flexão arqueiro e agachamento unilateral.'}),
  G('g-hiit-pc', 'HIIT Sem Equipamento 3x', {goal: 'condicionamento', local: 'casa', split: 'circ3', nivel: 'Iniciante', dur: 30}, {tag: ['HIIT', '30 MIN'], art: 'burpee', desc: 'Circuito de 30 minutos com força e intervalados. Pode ser feito na sala de casa.'}),
  // elástico
  G('g-el-fb3', 'Elástico Corpo Inteiro 3x', {goal: 'hipertrofia', local: 'elastico', dias: 3, nivel: 'Iniciante', dur: 45}, {tag: ['ELÁSTICO', 'TOTAL'], art: 'agachamento-elastico', desc: 'Treino completo com elásticos e peso do corpo. Para casa, viagem ou recuperação.'}),
  G('g-el-ul4', 'Elástico Upper Lower 4x', {goal: 'hipertrofia', local: 'elastico', dias: 4, nivel: 'Intermediário', dur: 45}, {tag: ['UPPER', 'LOWER'], art: 'puxada-elastico', desc: 'Superiores e inferiores com elástico. Use elásticos mais fortes conforme ficar fácil.'}),
  // kettlebell
  G('g-kb-fb3', 'Kettlebell Corpo Inteiro 3x', {goal: 'hipertrofia', local: 'kettlebell', dias: 3, nivel: 'Intermediário', dur: 45}, {tag: ['KETTLE', 'BELL'], art: 'kettlebell-swing', desc: 'Swing, goblet, terra, remada e desenvolvimento com kettlebell, completados com o peso do corpo. Força e condicionamento com uma ferramenta só.'}),
  G('g-kb-hiit', 'Kettlebell Condicionamento 3x', {goal: 'condicionamento', local: 'kettlebell', split: 'circ3', nivel: 'Intermediário', dur: 30}, {tag: ['KB', 'HIIT'], art: 'kb-snatch', desc: 'Circuitos curtos e intensos com kettlebell: swing, snatch, goblet e remada.'}),
  // fita de suspensão
  G('g-trx-fb3', 'TRX Corpo Inteiro 3x', {goal: 'hipertrofia', local: 'suspensao', dias: 3, nivel: 'Iniciante', dur: 45}, {tag: ['FITA DE', 'SUSPENSÃO'], art: 'trx-remada', desc: 'Remada, supino, agachamento, flexora e braços na fita. Ajuste a dificuldade mudando a inclinação do corpo.'}),
  G('g-trx-ul4', 'TRX Upper Lower 4x', {goal: 'hipertrofia', local: 'suspensao', dias: 4, nivel: 'Intermediário', dur: 45}, {tag: ['TRX', 'UPPER LOWER'], art: 'trx-supino', desc: 'Superiores e inferiores com a fita de suspensão e o peso do corpo.'}),
  // viagem
  G('g-viagem3', 'Hotel 30 Minutos 3x', {goal: 'hipertrofia', local: 'viagem', dias: 3, nivel: 'Iniciante', dur: 30}, {tag: ['EM', 'VIAGEM'], art: 'polichinelo', desc: 'Para o quarto de hotel: peso do corpo e um elástico que cabe na mala.'}),
  G('g-viagem-hiit', 'Viagem HIIT 3x', {goal: 'condicionamento', local: 'viagem', split: 'circ3', nivel: 'Intermediário', dur: 30}, {tag: ['HIIT', 'VIAGEM'], art: 'skater', desc: 'Três circuitos curtos por semana para manter o condicionamento longe de casa. Peso do corpo e um elástico.'}),
  // cardio
  G('g-cardio-ac', 'Musculação + Cardio 3x', {goal: 'definicao', local: 'academia', dias: 3, nivel: 'Intermediário', dur: 75}, {tag: ['CARDIO', 'FORÇA'], art: 'bike', desc: 'Corpo inteiro com bi-sets e cardio moderado de 15 a 20 minutos ao final de cada treino.', locExtra: ['cardio']}),
];

// ---------- programas escritos à mão ----------
const Y = (ex, sets, rmin, rmax, rest, nota = '') => ({ex, sets, rmin, rmax, rest, nota});
const HAND = [
  {id: 'c-phul', nome: 'PHUL Força e Hipertrofia', goal: ['hipertrofia', 'forca'], local: ['academia'], nivel: 'Intermediário', freq: 4, dur: 75, tag: ['PHUL', '4 DIAS'], art: 'supino-reto-barra',
   desc: 'Power Hypertrophy Upper Lower: dois dias de força (3 a 5 reps) e dois de hipertrofia (8 a 12). Estrutura conforme o guia da StrengthLog.', workouts: [
    {nome: 'Upper Força', cor: 0, items: [Y('supino-reto-barra', 4, 3, 5, 180), Y('remada-curvada', 4, 3, 5, 180), Y('supino-incl-halter', 3, 6, 10, 120), Y('puxada-aberta', 3, 6, 10, 120), Y('desenv-barra', 3, 5, 8, 120), Y('rosca-barra', 3, 6, 10, 90), Y('triceps-testa', 3, 8, 12, 90)]},
    {nome: 'Lower Força', cor: 1, items: [Y('agachamento', 4, 3, 5, 180), Y('levantamento-terra', 4, 3, 5, 180), Y('bulgaro', 3, 6, 10, 120), Y('mesa-flexora', 3, 6, 10, 90), Y('pant-pe', 4, 6, 10, 60)]},
    {nome: 'Upper Hipertrofia', cor: 2, items: [Y('supino-incl-barra', 4, 8, 12, 120), Y('remada-baixa', 4, 8, 12, 120), Y('crucifixo-halter', 3, 8, 12, 90), Y('serrote', 3, 8, 12, 90), Y('elev-lateral-halter', 3, 8, 12, 60), Y('rosca-halter', 3, 8, 12, 60), Y('triceps-barra', 3, 10, 15, 60)]},
    {nome: 'Lower Hipertrofia', cor: 3, items: [Y('afundo-barra', 3, 8, 12, 120), Y('leg-press', 4, 8, 12, 120), Y('extensora', 3, 8, 12, 90), Y('mesa-flexora', 3, 8, 12, 90), Y('pant-pe', 3, 8, 12, 60), Y('pant-sentado', 3, 8, 12, 60)]}]},
  {id: 'c-phat', nome: 'PHAT Power Hypertrophy', goal: ['hipertrofia', 'forca'], local: ['academia'], nivel: 'Avançado', freq: 5, dur: 90, tag: ['PHAT', '5 DIAS'], art: 'remada-curvada',
   desc: 'Programa de Layne Norton: dois dias de força e três de hipertrofia por grupos. Alto volume, para quem já treina há anos. Estrutura conforme a StrengthLog.', workouts: [
    {nome: 'Upper Força', cor: 0, items: [Y('remada-curvada', 3, 3, 5, 180), Y('barra-fixa', 2, 6, 10, 120), Y('supino-reto-halter', 3, 3, 5, 180), Y('paralelas-peito', 2, 6, 10, 120), Y('desenv-halter', 3, 6, 10, 120), Y('rosca-w', 3, 6, 10, 90), Y('triceps-testa', 3, 6, 10, 90)]},
    {nome: 'Lower Força', cor: 1, items: [Y('agachamento', 3, 3, 5, 240), Y('hack', 2, 6, 10, 150), Y('extensora', 2, 6, 10, 90), Y('stiff-barra', 3, 5, 8, 150), Y('mesa-flexora', 2, 6, 10, 90), Y('pant-pe', 3, 6, 10, 60), Y('pant-sentado', 2, 6, 10, 60)]},
    {nome: 'Costas e Ombros', cor: 2, items: [Y('remada-curvada', 4, 8, 10, 120, 'Cerca de 85% da carga do dia de força.'), Y('puxada-aberta', 3, 8, 12, 90), Y('remada-baixa', 3, 8, 12, 90), Y('serrote', 2, 12, 15, 60), Y('puxada-neutra', 2, 15, 20, 60), Y('desenv-halter', 3, 8, 12, 90), Y('remada-alta', 2, 12, 15, 60), Y('elev-lateral-halter', 3, 12, 20, 60)]},
    {nome: 'Pernas Hipertrofia', cor: 3, items: [Y('agachamento', 4, 8, 10, 150, 'Cerca de 85% da carga do dia de força.'), Y('hack', 3, 8, 12, 120), Y('leg-press', 2, 12, 15, 90), Y('extensora', 3, 15, 20, 60), Y('stiff-barra', 3, 8, 12, 120), Y('mesa-flexora', 2, 12, 15, 60), Y('cadeira-flexora', 2, 15, 20, 60), Y('pant-pe', 4, 10, 15, 60), Y('pant-sentado', 3, 15, 20, 60)]},
    {nome: 'Peito e Braços', cor: 4, items: [Y('supino-reto-halter', 4, 8, 10, 120, 'Cerca de 85% da carga do dia de força.'), Y('supino-incl-halter', 3, 8, 12, 90), Y('supino-reto-maquina', 3, 12, 15, 90), Y('crossover', 2, 15, 20, 60), Y('rosca-scott', 3, 8, 12, 60), Y('rosca-concentrada', 2, 12, 15, 60), Y('rosca-spider', 2, 15, 20, 60), Y('triceps-frances-pe', 3, 8, 12, 60), Y('triceps-corda', 2, 12, 15, 60), Y('triceps-coice', 2, 15, 20, 45)]}]},
  {id: 'c-gbr', nome: 'Upper Lower Clássico (GBR)', goal: ['hipertrofia'], local: ['academia'], nivel: 'Intermediário', freq: 4, dur: 60, tag: ['UPPER', 'LOWER'], art: 'agachamento-frontal',
   desc: 'Generic Bulking Routine de Lyle McDonald: 4 dias, compostos pesados de 6 a 8 reps e acessórios de 10 a 15. Ajuste séries pelo cansaço. Estrutura conforme a Legion Athletics.', workouts: [
    {nome: 'Lower A', cor: 1, items: [Y('agachamento', 4, 6, 8, 180), Y('stiff-barra', 3, 6, 8, 150), Y('leg-press', 3, 10, 12, 120), Y('mesa-flexora', 3, 10, 12, 90), Y('pant-pe', 4, 6, 8, 60), Y('pant-sentado', 3, 10, 12, 60)]},
    {nome: 'Upper A', cor: 0, items: [Y('supino-reto-barra', 4, 6, 8, 180), Y('remada-curvada', 4, 6, 8, 150), Y('desenv-halter', 3, 10, 12, 120), Y('puxada-aberta', 3, 10, 12, 90), Y('triceps-corda', 2, 12, 15, 60), Y('rosca-barra', 2, 12, 15, 60)]},
    {nome: 'Lower B', cor: 3, items: [Y('agachamento-frontal', 4, 6, 8, 180), Y('stiff-barra', 3, 6, 8, 150), Y('hack', 3, 10, 12, 120), Y('mesa-flexora', 3, 10, 12, 90), Y('pant-pe', 4, 6, 8, 60), Y('pant-sentado', 3, 10, 12, 60)]},
    {nome: 'Upper B', cor: 2, items: [Y('supino-incl-barra', 4, 6, 8, 180), Y('serrote', 4, 6, 8, 120), Y('supino-reto-halter', 3, 10, 12, 120), Y('barra-supinada', 3, 10, 12, 90), Y('triceps-frances-cabo', 2, 12, 15, 60), Y('rosca-halter', 2, 12, 15, 60)]}]},
  {id: 'c-ppl-reddit', nome: 'PPL Iniciante Linear 6x', goal: ['hipertrofia', 'forca'], local: ['academia'], nivel: 'Iniciante', freq: 6, dur: 60, tag: ['PUSH', 'PULL', 'LEGS'], art: 'face-pull',
   desc: 'O PPL popularizado no Reddit (Metallicadpa). Último set do básico é AMRAP (o máximo de reps com boa técnica). Aumente a carga dos básicos a cada treino concluído.', workouts: [
    {nome: 'Pull A', cor: 3, items: [Y('levantamento-terra', 1, 5, 5, 180, 'Série única AMRAP: faça o máximo com boa técnica.'), Y('puxada-aberta', 3, 8, 12, 90), Y('remada-baixa', 3, 8, 12, 90), Y('face-pull', 5, 15, 20, 60), Y('rosca-martelo', 4, 8, 12, 60), Y('rosca-halter', 4, 8, 12, 60)]},
    {nome: 'Push A', cor: 0, items: [Y('supino-reto-barra', 5, 5, 5, 180, '4x5 e a última série AMRAP.'), Y('desenv-barra', 3, 8, 12, 120), Y('supino-incl-halter', 3, 8, 12, 90), Y('triceps-corda', 3, 8, 12, 60), Y('triceps-frances-halter', 3, 8, 12, 60), Y('elev-lateral-halter', 6, 15, 20, 45)]},
    {nome: 'Legs A', cor: 1, items: [Y('agachamento', 3, 5, 5, 180, '2x5 e a última série AMRAP.'), Y('stiff-barra', 3, 8, 12, 120), Y('leg-press', 3, 8, 12, 120), Y('cadeira-flexora', 3, 8, 12, 90), Y('pant-pe', 5, 8, 12, 60)]},
    {nome: 'Pull B', cor: 4, items: [Y('remada-curvada', 5, 5, 5, 150, '4x5 e a última série AMRAP.'), Y('puxada-aberta', 3, 8, 12, 90), Y('remada-baixa', 3, 8, 12, 90), Y('face-pull', 5, 15, 20, 60), Y('rosca-martelo', 4, 8, 12, 60), Y('rosca-halter', 4, 8, 12, 60)]},
    {nome: 'Push B', cor: 2, items: [Y('desenv-barra', 5, 5, 5, 150, '4x5 e a última série AMRAP.'), Y('supino-reto-barra', 3, 8, 12, 120), Y('supino-incl-halter', 3, 8, 12, 90), Y('triceps-corda', 3, 8, 12, 60), Y('triceps-frances-halter', 3, 8, 12, 60), Y('elev-lateral-halter', 6, 15, 20, 45)]},
    {nome: 'Legs B', cor: 5, items: [Y('agachamento', 3, 5, 5, 180, '2x5 e a última série AMRAP.'), Y('stiff-barra', 3, 8, 12, 120), Y('leg-press', 3, 8, 12, 120), Y('cadeira-flexora', 3, 8, 12, 90), Y('pant-pe', 5, 8, 12, 60)]}]},
  {id: 'c-gzclp', nome: 'GZCLP Força Linear', goal: ['forca'], local: ['academia'], nivel: 'Iniciante', freq: 3, dur: 60, tag: ['GZCLP', 'FORÇA'], art: 'agachamento',
   desc: 'Quatro treinos alternados em 3 dias por semana. T1: 5x3 (último AMRAP), T2: 3x10, T3: 3x15 (último AMRAP). Quando falhar, siga para o próximo estágio (6x2, 10x1). Conforme o wiki do r/Fitness.', workouts: [
    {nome: 'Dia 1', cor: 0, items: [Y('agachamento', 5, 3, 3, 240, 'T1: última série AMRAP.'), Y('supino-reto-barra', 3, 10, 10, 150, 'T2'), Y('puxada-aberta', 3, 15, 15, 75, 'T3: última série AMRAP; suba a carga ao fazer 25.')]},
    {nome: 'Dia 2', cor: 1, items: [Y('desenv-barra', 5, 3, 3, 240, 'T1: última série AMRAP.'), Y('levantamento-terra', 3, 10, 10, 150, 'T2'), Y('serrote', 3, 15, 15, 75, 'T3: última série AMRAP.')]},
    {nome: 'Dia 3', cor: 2, items: [Y('supino-reto-barra', 5, 3, 3, 240, 'T1: última série AMRAP.'), Y('agachamento', 3, 10, 10, 150, 'T2'), Y('puxada-aberta', 3, 15, 15, 75, 'T3: última série AMRAP.')]},
    {nome: 'Dia 4', cor: 3, items: [Y('levantamento-terra', 5, 3, 3, 240, 'T1: última série AMRAP.'), Y('desenv-barra', 3, 10, 10, 150, 'T2'), Y('serrote', 3, 15, 15, 75, 'T3: última série AMRAP.')]}]},
  {id: 'c-5x5', nome: 'Força 5x5 A/B', goal: ['forca'], local: ['academia'], nivel: 'Iniciante', freq: 3, dur: 45, tag: ['5X5', 'FORÇA'], art: 'agachamento',
   desc: 'Dois treinos alternados (A, B, A na semana 1; B, A, B na semana 2). Cinco séries de 5 nos básicos e aumento pequeno de carga a cada treino. Estilo dos programas 5x5 lineares.', workouts: [
    {nome: 'Treino A', cor: 0, items: [Y('agachamento', 5, 5, 5, 180), Y('supino-reto-barra', 5, 5, 5, 180), Y('remada-curvada', 5, 5, 5, 150)]},
    {nome: 'Treino B', cor: 1, items: [Y('agachamento', 5, 5, 5, 180), Y('desenv-barra', 5, 5, 5, 180), Y('levantamento-terra', 1, 5, 5, 180, 'Uma série de 5 pesada.')]}]},
  {id: 'c-3x5', nome: 'Força Básica 3x5', goal: ['forca'], local: ['academia'], nivel: 'Iniciante', freq: 3, dur: 45, tag: ['3X5', 'BÁSICO'], art: 'desenv-barra',
   desc: 'Três séries de 5 no agachamento e no supino ou desenvolvimento, uma de 5 no terra. A progressão linear mais simples para os primeiros meses.', workouts: [
    {nome: 'Treino A', cor: 2, items: [Y('agachamento', 3, 5, 5, 180), Y('supino-reto-barra', 3, 5, 5, 180), Y('levantamento-terra', 1, 5, 5, 180)]},
    {nome: 'Treino B', cor: 3, items: [Y('agachamento', 3, 5, 5, 180), Y('desenv-barra', 3, 5, 5, 180), Y('levantamento-terra', 1, 5, 5, 180), Y('barra-fixa', 3, 5, 10, 120, 'Acessório opcional.')]}]},
  {id: 'c-bbb', nome: '5/3/1 Boring But Big', goal: ['forca', 'hipertrofia'], local: ['academia'], nivel: 'Intermediário', freq: 4, dur: 60, tag: ['5/3/1', 'BBB'], art: 'levantamento-terra',
   desc: 'Template de Jim Wendler: 5/3/1 no básico e 5x10 com 50 a 60% do treino máximo, mais dorsais ou abdômen 5x10. Semanas: 65/75/85% (5,5,5+), 70/80/90% (3,3,3+), 75/85/95% (5,3,1+) e deload.', workouts: [
    {nome: 'Desenvolvimento', cor: 0, items: [Y('desenv-barra', 3, 1, 5, 180, 'Séries 5/3/1 da semana; a última é AMRAP.'), Y('desenv-barra', 5, 10, 10, 90, 'BBB: 5x10 com 50 a 60% do treino máximo.'), Y('barra-fixa', 5, 10, 10, 60, 'Dorsais 5x10 (use puxada se precisar).')]},
    {nome: 'Terra', cor: 1, items: [Y('levantamento-terra', 3, 1, 5, 180, 'Séries 5/3/1 da semana; a última é AMRAP.'), Y('levantamento-terra', 5, 10, 10, 120, 'BBB: comece leve, 30 a 45% nos primeiros ciclos.'), Y('elev-pernas-barra', 5, 10, 15, 60)]},
    {nome: 'Supino', cor: 2, items: [Y('supino-reto-barra', 3, 1, 5, 180, 'Séries 5/3/1 da semana; a última é AMRAP.'), Y('supino-reto-barra', 5, 10, 10, 90, 'BBB: 5x10.'), Y('serrote', 5, 10, 10, 60)]},
    {nome: 'Agachamento', cor: 3, items: [Y('agachamento', 3, 1, 5, 180, 'Séries 5/3/1 da semana; a última é AMRAP.'), Y('agachamento', 5, 10, 10, 120, 'BBB: comece leve nos primeiros ciclos.'), Y('abd-polia', 5, 10, 15, 60)]}]},
  {id: 'c-arnold', nome: 'Arnold Split 6x', goal: ['hipertrofia'], local: ['academia'], nivel: 'Avançado', freq: 6, dur: 75, tag: ['ARNOLD', 'SPLIT'], art: 'arnold',
   desc: 'Divisão clássica dos anos 70: peito e costas, ombros e braços, pernas, repetidos duas vezes. Alto volume por sessão.', workouts: [
    {nome: 'Peito e Costas', cor: 0, items: [Y('supino-reto-barra', 4, 6, 10, 120), Y('barra-fixa', 4, 6, 12, 120), Y('supino-incl-halter', 3, 8, 12, 90), Y('remada-curvada', 3, 8, 12, 90), Y('crucifixo-halter', 3, 10, 15, 60), Y('pullover-halter', 3, 10, 15, 60)]},
    {nome: 'Ombros e Braços', cor: 2, items: [Y('desenv-barra', 4, 6, 10, 120), Y('elev-lateral-halter', 4, 12, 15, 60), Y('crucifixo-inverso-halter', 3, 12, 15, 60), Y('rosca-barra', 4, 8, 12, 60), Y('triceps-testa', 4, 8, 12, 60), Y('rosca-concentrada', 3, 10, 15, 45), Y('triceps-corda', 3, 10, 15, 45)]},
    {nome: 'Pernas', cor: 1, items: [Y('agachamento', 4, 6, 10, 180), Y('stiff-barra', 3, 8, 12, 120), Y('leg-press', 3, 10, 15, 120), Y('extensora', 3, 12, 15, 60), Y('mesa-flexora', 3, 10, 15, 60), Y('pant-pe', 4, 10, 15, 60)]}]},
  {id: 'c-abc', nome: 'ABC Clássico', goal: ['hipertrofia'], local: ['academia'], nivel: 'Iniciante', freq: 3, dur: 60, tag: ['TREINO', 'ABC'], art: 'crossover',
   desc: 'A divisão mais comum nas academias brasileiras: A peito, ombros e tríceps; B costas e bíceps; C pernas. Faça 3x ou repita a sequência 6x por semana.', workouts: [
    {nome: 'A: Peito, Ombros, Tríceps', cor: 0, items: [Y('supino-reto-barra', 3, 8, 12, 120), Y('supino-incl-halter', 3, 8, 12, 90), Y('crossover', 3, 12, 15, 60), Y('desenv-halter', 3, 8, 12, 90), Y('elev-lateral-halter', 3, 12, 15, 60), Y('triceps-corda', 3, 10, 15, 60), Y('triceps-frances-halter', 3, 10, 12, 60)]},
    {nome: 'B: Costas e Bíceps', cor: 3, items: [Y('puxada-aberta', 3, 8, 12, 90), Y('remada-baixa', 3, 8, 12, 90), Y('serrote', 3, 8, 12, 90), Y('face-pull', 3, 12, 15, 60), Y('rosca-barra', 3, 8, 12, 60), Y('rosca-martelo', 3, 10, 12, 60)]},
    {nome: 'C: Pernas', cor: 1, items: [Y('agachamento', 4, 8, 10, 150), Y('leg-press', 3, 10, 12, 120), Y('extensora', 3, 12, 15, 60), Y('stiff-barra', 3, 8, 12, 120), Y('mesa-flexora', 3, 10, 15, 60), Y('pant-pe', 4, 12, 15, 60)]}]},
  {id: 'c-abcd', nome: 'ABCD 4x', goal: ['hipertrofia'], local: ['academia'], nivel: 'Intermediário', freq: 4, dur: 60, tag: ['TREINO', 'ABCD'], art: 'desenv-halter',
   desc: 'A peito e tríceps; B costas e bíceps; C pernas; D ombros e abdômen. Mais volume por grupo do que o ABC, cada um 1x por semana.', workouts: [
    {nome: 'A: Peito e Tríceps', cor: 0, items: [Y('supino-reto-barra', 4, 6, 10, 150), Y('supino-incl-halter', 3, 8, 12, 90), Y('voador', 3, 12, 15, 60), Y('paralelas-peito', 3, 8, 12, 90), Y('triceps-corda', 3, 10, 15, 60), Y('triceps-frances-cabo', 3, 10, 15, 60)]},
    {nome: 'B: Costas e Bíceps', cor: 3, items: [Y('barra-fixa', 4, 6, 10, 120), Y('remada-curvada', 3, 8, 10, 120), Y('puxada-neutra', 3, 10, 12, 90), Y('remada-iso', 3, 10, 12, 90), Y('rosca-barra', 3, 8, 12, 60), Y('rosca-inclinada', 3, 10, 12, 60)]},
    {nome: 'C: Pernas', cor: 1, items: [Y('agachamento', 4, 6, 10, 180), Y('stiff-barra', 3, 8, 12, 120), Y('leg-press', 3, 10, 15, 120), Y('cadeira-flexora', 3, 10, 15, 60), Y('extensora', 3, 12, 15, 60), Y('pant-sentado', 4, 12, 20, 60)]},
    {nome: 'D: Ombros e Abdômen', cor: 2, items: [Y('desenv-halter', 4, 8, 12, 120), Y('elev-lateral-cabo', 4, 12, 20, 60), Y('voador-inverso', 3, 12, 20, 60), Y('encolhimento-halter', 3, 10, 15, 60), Y('abd-polia', 3, 10, 15, 60), Y('elev-pernas-barra', 3, 10, 15, 60)]}]},
  {id: 'c-abcde', nome: 'ABCDE (um grupo por dia)', goal: ['hipertrofia'], local: ['academia'], nivel: 'Avançado', freq: 5, dur: 60, tag: ['ABCDE', 'SPLIT'], art: 'rosca-scott',
   desc: 'O "bro split": peito, costas, ombros, braços e pernas, um por dia. Muito volume por sessão e cada grupo 1x por semana, por isso funciona melhor para avançados.', workouts: [
    {nome: 'A: Peito', cor: 0, items: [Y('supino-reto-barra', 4, 6, 10, 150), Y('supino-incl-halter', 4, 8, 12, 90), Y('supino-decl-barra', 3, 8, 12, 90), Y('voador', 3, 12, 15, 60), Y('crossover', 3, 12, 15, 60)]},
    {nome: 'B: Costas', cor: 3, items: [Y('barra-fixa', 4, 6, 10, 120), Y('remada-curvada', 4, 8, 10, 120), Y('puxada-neutra', 3, 10, 12, 90), Y('remada-unilateral-cabo', 3, 10, 12, 60), Y('pulldown-estendido', 3, 12, 15, 60)]},
    {nome: 'C: Ombros', cor: 2, items: [Y('desenv-barra', 4, 6, 10, 150), Y('arnold', 3, 8, 12, 90), Y('elev-lateral-halter', 4, 12, 20, 60), Y('elev-lateral-cabo', 3, 12, 20, 45), Y('face-pull', 3, 12, 20, 60), Y('encolhimento-barra', 3, 10, 15, 60)]},
    {nome: 'D: Braços', cor: 5, items: [Y('rosca-barra', 4, 8, 12, 60), Y('supino-fechado', 4, 6, 10, 90), Y('rosca-inclinada', 3, 10, 12, 60), Y('triceps-frances-cabo', 3, 10, 15, 60), Y('rosca-martelo', 3, 10, 15, 45), Y('triceps-corda', 3, 12, 15, 45), Y('rosca-punho', 2, 15, 20, 45)]},
    {nome: 'E: Pernas', cor: 1, items: [Y('agachamento', 4, 6, 10, 180), Y('leg-press', 4, 10, 15, 120), Y('stiff-barra', 3, 8, 12, 120), Y('extensora', 3, 12, 15, 60), Y('mesa-flexora', 3, 10, 15, 60), Y('pant-pe', 4, 10, 15, 60)]}]},
  {id: 'c-retorno', nome: 'Primeiro Mês na Academia', goal: ['saude', 'hipertrofia'], local: ['academia'], nivel: 'Iniciante', freq: 3, dur: 45, tag: ['PRIMEIRO', 'MÊS'], art: 'supino-reto-maquina',
   desc: 'Adaptação: máquinas fáceis de aprender, 2 séries longe da falha (3 a 4 reps sobrando). Também serve para voltar depois de uma pausa. Passe para um programa completo após 4 semanas.', workouts: [
    {nome: 'Adaptação A', cor: 3, items: [Y('leg-press', 2, 12, 15, 90), Y('supino-reto-maquina', 2, 12, 15, 90), Y('puxada-aberta', 2, 12, 15, 90), Y('cadeira-flexora', 2, 12, 15, 60), Y('prancha', 2, 20, 30, 60, 'Segundos de prancha nas repetições.')]},
    {nome: 'Adaptação B', cor: 5, items: [Y('extensora', 2, 12, 15, 60), Y('remada-iso', 2, 12, 15, 90), Y('desenv-maquina', 2, 12, 15, 90), Y('elevacao-pelvica', 2, 12, 15, 90), Y('dead-bug', 2, 10, 12, 60)]}]},
  {id: 'c-abs', nome: 'Abdômen e Core', goal: ['definicao', 'saude'], local: ['academia', 'casa', 'peso'], nivel: 'Iniciante', freq: 3, dur: 15, tag: ['CORE', '15 MIN'], art: 'abd-bicicleta', comp: true,
   desc: 'Complemento de 15 minutos para fazer no fim de 2 a 3 treinos, na academia ou em casa, sem equipamento. Combina flexão do tronco, rotação e estabilidade.', workouts: [
    {nome: 'Core A', cor: 4, items: [Y('elev-pernas', 3, 10, 15, 45), Y('abd-bicicleta', 3, 20, 30, 45), Y('prancha', 3, 30, 45, 45, 'Segundos nas repetições.'), Y('dead-bug', 2, 10, 12, 45)]},
    {nome: 'Core B', cor: 6, items: [Y('abd-reverso', 3, 10, 15, 45), Y('abd-russo', 3, 10, 12, 45, 'Repetições em cada lado.'), Y('prancha-lateral', 2, 20, 40, 45, 'Segundos em cada lado.'), Y('canoa', 3, 10, 15, 45)]}]},
  {id: 'c-pernas-comp', nome: 'Pernas Fortes (complemento)', goal: ['hipertrofia'], local: ['academia'], nivel: 'Intermediário', freq: 1, dur: 45, tag: ['PERNAS', '+1'], art: 'hack', comp: true,
   desc: 'Um dia extra de inferiores para somar ao seu plano por 6 a 8 semanas quando as pernas estão atrás.', workouts: [
    {nome: 'Pernas extra', cor: 1, items: [Y('hack', 3, 8, 12, 150), Y('bulgaro', 3, 8, 12, 90, 'Repetições em cada perna.'), Y('mesa-flexora', 3, 10, 15, 60), Y('extensora', 2, 12, 20, 60), Y('adutora', 2, 12, 15, 60), Y('pant-sentado', 3, 12, 20, 45)]}]},
  {id: 'c-hiit-cardio', nome: 'Cardio Intervalado 3x', goal: ['condicionamento', 'definicao'], local: ['cardio', 'academia'], nivel: 'Intermediário', freq: 3, dur: 30, tag: ['HIIT', 'CARDIO'], art: 'bike',
   desc: 'Três sessões de cardio: intervalado na bike, contínuo no elíptico e caminhada inclinada. Use em dias sem musculação ou logo após o treino.', workouts: [
    {nome: 'HIIT na bike', cor: 0, items: [Y('bike', 1, 5, 5, 0, 'Aquecimento de 5 minutos.'), Y('bike', 8, 1, 1, 90, '30 s forte e 90 s leve, 8 vezes. Anote 1 por série concluída.'), Y('bike', 1, 5, 5, 0, 'Volta à calma de 5 minutos.')]},
    {nome: 'Contínuo', cor: 7, items: [Y('eliptico', 1, 25, 30, 0, 'Ritmo em que dá para conversar. Minutos nas repetições.')]},
    {nome: 'Caminhada inclinada', cor: 2, items: [Y('caminhada-inclinada', 1, 30, 40, 0, 'Inclinação 8 a 12%. Minutos nas repetições.')]}]},
  {id: 'c-avulso-peito', nome: 'Peito e Tríceps Rápido', goal: ['hipertrofia'], local: ['academia'], nivel: 'Intermediário', freq: 1, dur: 45, tag: ['PEITO', 'TRÍCEPS'], art: 'supino-incl-halter', avulso: true,
   desc: 'Treino avulso de 45 minutos para um dia de empurrar.', workouts: [{nome: 'Peito e Tríceps', cor: 0, items: [Y('supino-incl-halter', 3, 8, 12, 120), Y('supino-reto-maquina', 3, 8, 12, 90), Y('crossover', 3, 12, 15, 60), Y('triceps-corda', 3, 10, 15, 60), Y('triceps-frances-cabo', 2, 10, 15, 60)]}]},
  {id: 'c-avulso-costas', nome: 'Costas e Bíceps Rápido', goal: ['hipertrofia'], local: ['academia'], nivel: 'Intermediário', freq: 1, dur: 45, tag: ['COSTAS', 'BÍCEPS'], art: 'puxada-neutra', avulso: true,
   desc: 'Treino avulso de 45 minutos para um dia de puxar.', workouts: [{nome: 'Costas e Bíceps', cor: 3, items: [Y('puxada-aberta', 3, 8, 12, 90), Y('remada-baixa', 3, 8, 12, 90), Y('remada-unilateral-cabo', 2, 10, 12, 60), Y('rosca-inclinada', 3, 10, 12, 60), Y('rosca-martelo-corda', 2, 10, 15, 60)]}]},
  {id: 'c-avulso-ombro', nome: 'Ombros Completo', goal: ['hipertrofia'], local: ['academia'], nivel: 'Intermediário', freq: 1, dur: 40, tag: ['OMBROS', ''], art: 'elev-lateral-cabo', avulso: true,
   desc: 'Treino avulso para as três porções do deltoide.', workouts: [{nome: 'Ombros', cor: 2, items: [Y('desenv-halter', 3, 8, 12, 120), Y('elev-lateral-cabo', 4, 12, 20, 60), Y('face-pull', 3, 12, 20, 60), Y('elev-lateral-halter', 2, 15, 20, 45, 'Série final perto da falha.'), Y('encolhimento-halter', 2, 10, 15, 60)]}]},
  {id: 'c-avulso-pernas', nome: 'Pernas Completo', goal: ['hipertrofia'], local: ['academia'], nivel: 'Intermediário', freq: 1, dur: 60, tag: ['LEG', 'DAY'], art: 'leg-press', avulso: true,
   desc: 'Treino avulso de pernas inteiras.', workouts: [{nome: 'Pernas', cor: 1, items: [Y('agachamento', 4, 6, 10, 180), Y('stiff-barra', 3, 8, 12, 120), Y('leg-press', 3, 10, 15, 120), Y('cadeira-flexora', 3, 10, 15, 60), Y('extensora', 2, 12, 15, 60), Y('pant-pe', 3, 10, 15, 60)]}]},
  {id: 'c-avulso-gluteo', nome: 'Glúteo Máximo', goal: ['hipertrofia'], local: ['academia'], nivel: 'Intermediário', freq: 1, dur: 45, tag: ['GLÚTEO', 'MAX'], art: 'elevacao-pelvica', avulso: true,
   desc: 'Treino avulso com foco total em glúteos.', workouts: [{nome: 'Glúteos', cor: 5, items: [Y('elevacao-pelvica', 4, 8, 12, 120), Y('bulgaro', 3, 8, 12, 90, 'Tronco levemente inclinado à frente para mais glúteo.'), Y('stiff-halter', 3, 10, 12, 90), Y('abducao', 3, 12, 20, 60), Y('coice-cabo', 3, 12, 15, 45, 'Repetições em cada perna.')]}]},
  {id: 'c-avulso-bracos', nome: 'Braços Bombados', goal: ['hipertrofia'], local: ['academia', 'halteres'], nivel: 'Iniciante', freq: 1, dur: 30, tag: ['BRAÇOS', '30 MIN'], art: 'rosca-martelo', avulso: true,
   desc: 'Treino avulso de bíceps e tríceps em bi-sets.', workouts: [{nome: 'Braços', cor: 6, items: [Y('rosca-halter', 3, 8, 12, 0, 'Bi-set com o próximo.'), Y('triceps-frances-halter', 3, 10, 12, 75), Y('rosca-martelo', 3, 10, 12, 0, 'Bi-set com o próximo.'), Y('triceps-coice', 3, 12, 15, 75), Y('rosca-concentrada', 2, 12, 15, 45)]}]},
  {id: 'c-avulso-pc', nome: 'Corpo Inteiro Sem Equipamento', goal: ['condicionamento', 'saude'], local: ['peso', 'viagem', 'casa'], nivel: 'Iniciante', freq: 1, dur: 25, tag: ['ZERO', 'EQUIP.'], art: 'agachamento-livre', avulso: true,
   desc: 'Treino avulso de 25 minutos em circuito, em qualquer lugar.', workouts: [{nome: 'Circuito', cor: 7, items: [Y('agachamento-livre', 3, 15, 20, 0, 'Circuito: em sequência, 90 s de descanso ao fim da volta.'), Y('flexao', 3, 8, 15, 0), Y('remada-mesa', 3, 8, 12, 0, 'Embaixo de uma mesa firme. Dobre os joelhos para facilitar.'), Y('afundo-caminhando', 3, 10, 12, 0), Y('prancha', 3, 30, 45, 0, 'Segundos.'), Y('polichinelo', 3, 20, 30, 90)]}]},
  {id: 'c-avulso-elastico', nome: 'Elástico 25 Minutos', goal: ['hipertrofia', 'saude'], local: ['elastico', 'viagem'], nivel: 'Iniciante', freq: 1, dur: 25, tag: ['ELÁSTICO', '25 MIN'], art: 'puxada-elastico', avulso: true,
   desc: 'Treino avulso de corpo inteiro com um elástico.', workouts: [{nome: 'Elástico total', cor: 3, items: [Y('agachamento-elastico', 3, 12, 20, 60), Y('supino-elastico', 3, 12, 20, 60), Y('remada-elastico', 3, 12, 20, 60), Y('desenv-elastico', 2, 12, 20, 45), Y('ponte-elastico', 3, 15, 20, 45), Y('rosca-elastico', 2, 12, 20, 45)]}]},
  {id: 'c-avulso-kb', nome: 'Kettlebell 20 Minutos', goal: ['condicionamento'], local: ['kettlebell', 'cardio'], nivel: 'Intermediário', freq: 1, dur: 20, tag: ['KB', '20 MIN'], art: 'kettlebell-swing', avulso: true,
   desc: 'Circuito avulso: swing, goblet, remada e desenvolvimento.', workouts: [{nome: 'KB circuito', cor: 4, items: [Y('kettlebell-swing', 4, 15, 20, 0, 'Circuito: 60 s de descanso ao fim da volta.'), Y('goblet', 4, 10, 12, 0), Y('kb-remada', 4, 10, 12, 0, 'Repetições em cada lado.'), Y('kb-desenv', 4, 8, 10, 60)]}]},
  {id: 'c-avulso-hiit', nome: 'HIIT 20 Minutos', goal: ['condicionamento', 'definicao'], local: ['casa', 'peso', 'cardio', 'viagem'], nivel: 'Intermediário', freq: 1, dur: 20, tag: ['HIIT', '20 MIN'], art: 'escalador', avulso: true,
   desc: 'Intervalado de alta intensidade: 40 s de trabalho e 20 s de pausa em cada exercício.', workouts: [{nome: 'HIIT', cor: 0, items: [Y('burpee', 4, 8, 12, 0, '40 s de trabalho, 20 s de pausa. Repita o bloco 4 vezes.'), Y('agachamento-salto', 4, 10, 15, 0), Y('escalador', 4, 20, 30, 0), Y('skater', 4, 16, 20, 0), Y('skipping', 4, 30, 40, 60)]}]},

  // v4.21: programas com os exercícios novos
  {id: 'c-trx', nome: 'Fita de Suspensão Corpo Inteiro', goal: ['hipertrofia', 'condicionamento'], local: ['suspensao'], nivel: 'Intermediário', freq: 3, dur: 40, tag: ['TRX', '3X'], art: 'trx-remada',
   desc: 'Dois treinos alternados para 3 dias por semana usando só a fita de suspensão. Ajuste a dificuldade mudando a inclinação do corpo: mais deitado é mais difícil.', workouts: [
    {nome: 'Fita A', cor: 2, items: [Y('trx-agachamento', 3, 12, 15, 60), Y('trx-remada', 3, 10, 15, 60), Y('trx-flexao', 3, 8, 12, 60), Y('trx-rosca', 3, 10, 15, 45), Y('trx-triceps', 3, 10, 15, 45), Y('trx-prancha', 3, 20, 40, 45, 'Segundos nas repetições.')]},
    {nome: 'Fita B', cor: 5, items: [Y('trx-agachamento-unilateral', 3, 6, 10, 60, 'Repetições em cada perna.'), Y('trx-remada-posterior', 3, 10, 15, 60), Y('trx-supino', 3, 10, 15, 60), Y('trx-flexora', 3, 10, 12, 60), Y('trx-y', 3, 10, 12, 45), Y('trx-pike', 3, 6, 10, 45)]}]},
  {id: 'c-casa-cadeira', nome: 'Em Casa com Cadeira e Parede', goal: ['saude', 'definicao'], local: ['casa', 'viagem'], nivel: 'Iniciante', freq: 3, dur: 30, tag: ['CASA', 'INÍCIO'], art: 'flexao-inclinada',
   desc: 'Para começar em casa sem equipamento: uma cadeira firme, uma parede e uma mesa. Alterne os treinos A e B, 3 vezes por semana.', workouts: [
    {nome: 'Casa A', cor: 3, items: [Y('agachamento-cadeira', 3, 10, 15, 60), Y('flexao-inclinada', 3, 8, 12, 60), Y('remada-mesa', 3, 8, 12, 60), Y('ponte-marcha', 3, 10, 12, 45, 'Repetições em cada lado.'), Y('cadeirinha', 3, 20, 40, 45, 'Segundos nas repetições.'), Y('prancha-urso', 3, 15, 30, 45, 'Segundos nas repetições.')]},
    {nome: 'Casa B', cor: 6, items: [Y('bulgaro-cadeira', 3, 8, 12, 60, 'Repetições em cada perna.'), Y('flexao-parede', 3, 10, 15, 45), Y('remada-porta', 3, 10, 12, 60), Y('mergulho-cadeiras', 3, 6, 10, 60), Y('elevacao-pelvica-sofa', 3, 12, 15, 45), Y('perdigueiro', 3, 8, 10, 45, 'Repetições em cada lado.')]}]},
  {id: 'c-core-avancado', nome: 'Abdômen Avançado', goal: ['definicao', 'condicionamento'], local: ['academia', 'peso'], nivel: 'Avançado', freq: 2, dur: 20, tag: ['CORE', 'AVANÇADO'], art: 'canoa', comp: true,
   desc: 'Complemento de 20 minutos para quem já domina prancha e abdominal comum. Junta flexão do tronco, rotação, membros inferiores e estabilidade.', workouts: [
    {nome: 'Core avançado A', cor: 0, items: [Y('joelho-cotovelo-suspenso', 3, 8, 12, 60), Y('v-up', 3, 10, 15, 45), Y('limpador', 3, 8, 10, 45, 'Repetições em cada lado.'), Y('hollow-hold', 3, 20, 40, 45, 'Segundos nas repetições.')]},
    {nome: 'Core avançado B', cor: 4, items: [Y('canivete', 3, 8, 12, 45), Y('prancha-spiderman', 3, 8, 10, 45, 'Repetições em cada lado.'), Y('prancha-lateral-rotacao', 3, 8, 10, 45, 'Repetições em cada lado.'), Y('flutter', 3, 20, 40, 45, 'Segundos nas repetições.')]}]},
  {id: 'c-pernas-halteres', nome: 'Pernas e Glúteos com Halteres', goal: ['hipertrofia', 'definicao'], local: ['halteres', 'academia'], nivel: 'Intermediário', freq: 2, dur: 45, tag: ['PERNAS', 'HALTERES'], art: 'stiff-halter',
   desc: 'Dois treinos de inferiores só com halteres e um banco, para casa ou academia. Um dia puxa mais para quadríceps, o outro para posteriores e glúteos.', workouts: [
    {nome: 'Pernas A', cor: 1, items: [Y('agachamento-sumo-halter', 4, 8, 12, 90), Y('afundo-reverso-halter', 3, 8, 12, 75, 'Repetições em cada perna.'), Y('afundo-lateral-halter', 3, 8, 10, 60, 'Repetições em cada lado.'), Y('pant-halter', 3, 12, 20, 45), Y('abd-solo', 3, 15, 20, 45)]},
    {nome: 'Pernas B', cor: 5, items: [Y('stiff-halter', 4, 8, 12, 90), Y('hip-thrust-halter', 3, 10, 15, 75), Y('afundo-cruzado-halter', 3, 8, 12, 60, 'Repetições em cada perna.'), Y('flexora-halter', 3, 10, 15, 60), Y('ponte-halter', 2, 12, 15, 45)]}]},
  {id: 'c-condic-academia', nome: 'Condicionamento na Academia', goal: ['condicionamento', 'definicao'], local: ['academia', 'cardio'], nivel: 'Intermediário', freq: 2, dur: 30, tag: ['HIIT', 'ACADEMIA'], art: 'kettlebell-swing',
   desc: 'Circuito com corda naval, air bike, trenó e kettlebell. Faça cada exercício pelo tempo indicado e descanse ao fim da volta.', workouts: [
    {nome: 'Circuito A', cor: 0, items: [Y('corda-naval', 4, 20, 30, 0, 'Segundos de trabalho. 60 s de descanso ao fim da volta.'), Y('kettlebell-swing', 4, 12, 15, 0), Y('air-bike', 4, 20, 30, 0, 'Segundos forte.'), Y('burpee', 4, 8, 10, 60)]},
    {nome: 'Circuito B', cor: 7, items: [Y('treno', 4, 15, 20, 0, 'Metros por série.'), Y('salto-grupado', 4, 6, 8, 0), Y('remo-ergometro', 4, 30, 45, 0, 'Segundos forte.'), Y('prancha-polichinelo', 4, 20, 30, 60, 'Segundos nas repetições.')]}]},
];

// ---------- monta a biblioteca final ----------
(function buildLibrary(){
  const meta = {
    't-hip5': {goal: ['hipertrofia'], local: ['academia'], nivel: 'Intermediário', freq: 5, dur: 75, tag: ['HIPER', '5 DIAS'], art: 'supino-reto-barra', destaque: true},
    't-ul4': {goal: ['hipertrofia'], local: ['academia'], nivel: 'Intermediário', freq: 4, dur: 60, tag: ['UPPER', 'LOWER'], art: 'remada-curvada'},
    't-ppl': {goal: ['hipertrofia'], local: ['academia'], nivel: 'Avançado', freq: 6, dur: 75, tag: ['PUSH', 'PULL', 'LEGS'], art: 'desenv-halter'},
    't-fb3': {goal: ['hipertrofia', 'saude'], local: ['academia'], nivel: 'Iniciante', freq: 3, dur: 60, tag: ['FULL', 'BODY'], art: 'agachamento'},
    't-maq3': {goal: ['saude', 'hipertrofia'], local: ['academia'], nivel: 'Iniciante', freq: 3, dur: 45, tag: ['MÁQUI', 'NAS'], art: 'voador'},
    't-bracos': {goal: ['hipertrofia'], local: ['academia'], nivel: 'Intermediário', freq: 2, dur: 40, tag: ['BRAÇOS', 'OMBROS'], art: 'rosca-barra', foco: ['bracos', 'ombros'], comp: true},
    't-express': {goal: ['hipertrofia', 'definicao'], local: ['academia'], nivel: 'Intermediário', freq: 3, dur: 45, tag: ['EXPRESS', '45 MIN'], art: 'goblet'},
  };
  TEMPLATES.forEach(t => Object.assign(t, {foco: [], ...meta[t.id]}));
  /* foco só para quem de fato prioriza um grupo (especializações, complementos e avulsos de um grupo); divisões equilibradas ficam sem foco */
  const focoHand = {'c-abs': ['abdomen'], 'c-pernas-comp': ['pernas'], 'c-core-avancado': ['abdomen'], 'c-pernas-halteres': ['pernas', 'gluteos'],
    'c-avulso-peito': ['peito'], 'c-avulso-costas': ['costas'], 'c-avulso-ombro': ['ombros'], 'c-avulso-pernas': ['pernas'], 'c-avulso-gluteo': ['gluteos'], 'c-avulso-bracos': ['bracos']};
  HAND.forEach(t => { t.foco = focoHand[t.id] || []; });
  HAND.forEach(t => TEMPLATES.push({dias: t.freq + 'x por semana', foco: [], ...t}));
  GEN_LIST.forEach(g => { const w = genProgram(g.gen); TEMPLATES.push({dias: g.freq + 'x por semana', workouts: w, ...g, local: [...g.local, ...(g.locExtra || [])]}); });
  // foco inferido pelos músculos mais trabalhados quando não declarado
  TEMPLATES.forEach(t => { if (!t.dias) t.dias = t.freq + 'x por semana'; if (t.avulso) t.dias = 'Treino avulso'; if (t.comp) t.dias = 'Complemento · ' + t.freq + 'x'; });
})();
