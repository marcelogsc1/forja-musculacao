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
const LOCAIS = {
  academia: {n: 'Academia', eq: ['barra', 'halter', 'cabo', 'maquina', 'smith', 'peso', 'kettlebell', 'outros'], art: 'leg-press'},
  casa: {n: 'Em casa', eq: ['halter', 'peso', 'elastico', 'kettlebell', 'outros'], art: 'goblet', d: 'Halteres, elástico e peso do corpo'},
  halteres: {n: 'Apenas halteres', eq: ['halter', 'peso'], art: 'rosca-martelo', d: 'Um par de halteres e um banco'},
  peso: {n: 'Peso corporal', eq: ['peso', 'outros'], art: 'flexao', d: 'Sem equipamento, só uma barra fixa opcional'},
  elastico: {n: 'Elástico', eq: ['elastico', 'peso'], art: 'remada-elastico', d: 'Elásticos com alças ou tubos'},
  kettlebell: {n: 'Kettlebell', eq: ['kettlebell', 'peso'], art: 'kettlebell-swing', d: 'Um ou dois kettlebells'},
  suspensao: {n: 'Fita de suspensão', eq: ['suspensao', 'peso', 'outros'], art: 'trx-remada', d: 'TRX ou fita presa na porta'},
  viagem: {n: 'Em viagem', eq: ['peso', 'elastico', 'outros'], art: 'polichinelo', d: 'Quarto de hotel, peso do corpo e um elástico'},
  cardio: {n: 'Cardio e HIIT', eq: ['peso', 'outros', 'maquina', 'kettlebell'], art: 'burpee', d: 'Intervalados, circuitos e aeróbico'},
};
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
  pressH: {r: 'main', c: ['supino-reto-barra', 'supino-reto-halter', 'supino-reto-maquina', 'kb-supino-solo', 'supino-elastico', 'trx-supino', 'flexao']},
  pressH2: {r: 'comp', c: ['supino-reto-maquina', 'supino-reto-halter', 'supino-reto-smith', 'flexao-aberta', 'supino-elastico', 'flexao']},
  pressI: {r: 'comp', c: ['supino-incl-halter', 'supino-incl-maquina', 'supino-incl-barra', 'supino-incl-smith', 'flexao-declinada', 'supino-elastico']},
  fly: {r: 'iso', c: ['voador', 'crossover', 'crucifixo-halter', 'crucifixo-incl', 'flexao-aberta']},
  dip: {r: 'comp', c: ['paralelas-peito', 'mergulho-maquina', 'flexao-diamante']},
  pullV: {r: 'comp', c: ['puxada-aberta', 'barra-fixa', 'barra-assistida-elastico', 'puxada-elastico', 'pullover-halter', 'kb-remada', 'trx-remada']},
  pullV2: {r: 'comp', c: ['puxada-neutra', 'puxada-supinada', 'barra-supinada', 'barra-neutra', 'puxada-elastico', 'pullover-halter', 'kb-renegade']},
  rowH: {r: 'comp', c: ['remada-curvada', 'remada-baixa', 'serrote', 'kb-remada', 'remada-elastico', 'trx-remada', 'remada-porta', 'remada-invertida']},
  rowH2: {r: 'comp', c: ['remada-iso', 'remada-apoiada-t', 'remada-incl-halter', 'kb-renegade', 'remada-unilateral-elastico', 'trx-remada', 'remada-invertida', 'remada-porta']},
  ohp: {r: 'comp', c: ['desenv-halter', 'desenv-maquina', 'desenv-barra', 'kb-desenv', 'desenv-elastico', 'pike', 'flexao-declinada']},
  lat: {r: 'small', c: ['elev-lateral-cabo', 'elev-lateral-halter', 'remada-alta-halter', 'elev-frontal-elastico']},
  front: {r: 'small', c: ['elev-frontal', 'elev-frontal-cabo']},
  rear: {r: 'small', c: ['voador-inverso', 'face-pull', 'crucifixo-inverso-halter', 'face-pull-elastico', 'crucifixo-inverso-elastico']},
  shrug: {r: 'iso', c: ['encolhimento-halter', 'encolhimento-barra']},
  bi: {r: 'iso', c: ['rosca-barra', 'rosca-halter', 'rosca-elastico', 'trx-rosca', 'barra-supinada']},
  bi2: {r: 'iso', c: ['rosca-inclinada', 'rosca-martelo', 'rosca-concentrada', 'rosca-elastico']},
  bi3: {r: 'iso', c: ['rosca-scott', 'rosca-martelo-corda', 'rosca-martelo', 'rosca-concentrada']},
  tri: {r: 'iso', c: ['triceps-corda', 'triceps-frances-halter', 'triceps-elastico', 'trx-triceps', 'flexao-diamante', 'mergulho-banco']},
  tri2: {r: 'iso', c: ['triceps-frances-cabo', 'triceps-halter-deitado', 'triceps-coice', 'mergulho-banco', 'flexao-diamante']},
  tri3: {r: 'iso', c: ['triceps-testa', 'triceps-barra', 'triceps-frances-pe', 'paralelas']},
  squat: {r: 'main', c: ['agachamento', 'hack', 'goblet', 'agachamento-halter', 'agachamento-elastico', 'trx-agachamento', 'agachamento-livre']},
  squat2: {r: 'comp', c: ['leg-press', 'hack', 'agachamento-smith', 'bulgaro', 'goblet', 'agachamento-elastico', 'trx-agachamento', 'agachamento-unilateral']},
  lunge: {r: 'comp', c: ['bulgaro', 'afundo', 'step-up', 'afundo-caminhando']},
  hinge: {r: 'comp', c: ['stiff-barra', 'stiff-halter', 'kettlebell-swing', 'stiff-elastico', 'ponte-unilateral']},
  dead: {r: 'main', c: ['levantamento-terra', 'terra-halter', 'kb-terra', 'kettlebell-swing', 'stiff-elastico', 'ponte-unilateral']},
  legcurl: {r: 'iso', c: ['cadeira-flexora', 'mesa-flexora', 'stiff-unilateral', 'trx-flexora', 'pull-through-elastico', 'flexora-nordica', 'ponte-unilateral']},
  legext: {r: 'iso', c: ['extensora', 'extensora-elastico', 'sissy']},
  glute: {r: 'comp', c: ['elevacao-pelvica', 'hip-thrust-halter', 'ponte', 'pull-through', 'ponte-elastico', 'coice-elastico', 'ponte-unilateral', 'ponte-solo']},
  abduct: {r: 'small', c: ['abducao', 'abducao-elastico', 'monster-walk']},
  adduct: {r: 'small', c: ['adutora']},
  calf: {r: 'small', c: ['pant-pe', 'pant-sentado', 'pant-halter', 'pant-elastico', 'pant-degrau']},
  core: {r: 'core', c: ['abd-polia', 'abd-maquina', 'elev-pernas', 'pallof', 'prancha']},
  core2: {r: 'core', c: ['lenhador', 'elev-pernas-barra', 'abd-russo', 'dead-bug', 'prancha-lateral']},
  hiit: {r: 'circ', c: ['burpee', 'kb-thruster', 'agachamento-salto', 'escalador']},
  hiit2: {r: 'circ', c: ['polichinelo', 'skater', 'skipping', 'urso']},
  cardio: {r: 'cardio', c: ['caminhada-inclinada', 'bike', 'eliptico', 'pular-corda', 'corrida']},
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

// exercícios que exigem barra fixa ou paralelas: só na academia e na calistenia
const NEEDS_BAR = ['barra-fixa', 'barra-supinada', 'barra-neutra', 'elev-pernas-barra', 'paralelas', 'paralelas-peito', 'elev-joelhos-paralela', 'hiperextensao', 'barra-assistida-elastico'];
function pickEx(slot, eq, used, prefMachine, local){
  let c = SLOTS[slot].c;
  if (local && local !== 'academia' && local !== 'peso') c = c.filter(x => !NEEDS_BAR.includes(x));
  if (prefMachine) c = [...c].sort((a, b) => (/maquina|cabo/.test(CAT[b].e) ? 1 : 0) - (/maquina|cabo/.test(CAT[a].e) ? 1 : 0));
  return c.find(x => CAT[x] && eq.includes(CAT[x].e) && !used.has(x)) || null;
}
/* Gera um programa. o = {goal, local, dias, nivel, dur, foco, split} */
function genProgram(o){
  const eq = (LOCAIS[o.local] || LOCAIS.academia).eq; const sch = SCHEMES[o.goal] || SCHEMES.hipertrofia;
  const keys = o.keys || SPLITS[o.split || o.dias] || SPLITS[3];
  const n = DUR_N[o.dur] || 6; const beginner = o.nivel === 'Iniciante'; const circuit = o.goal === 'condicionamento';
  const fo = FOCOS[o.foco];
  const workouts = keys.map((k, wi) => {
    const d = DAYS[k]; let slots = [...d.s];
    if (fo && FOCUS_DAY[o.foco].includes(d.k)){ const at = fo.small ? Math.min(3, slots.length) : 1; slots.splice(at, 0, ...fo.slots); slots = [...new Set(slots)]; }
    const used = new Set(); const items = [];
    for (const s of slots){
      if (items.length >= n + (fo ? 1 : 0)) break;
      const ex = pickEx(s, eq, used, beginner && o.local === 'academia', o.local); if (!ex) continue; used.add(ex);
      const role = SLOTS[s].r === 'circ' ? 'comp' : SLOTS[s].r === 'cardio' ? 'comp' : SLOTS[s].r;
      let [sets, rmin, rmax, rest] = sch[role] || sch.comp;
      if (beginner){ sets = Math.max(2, sets - 1); if (o.goal !== 'forca'){ rmin = Math.max(rmin, 10); rmax = Math.max(rmax, 15); } }
      if (CAT[ex].e === 'peso' && o.goal !== 'forca' && /comp|main/.test(role)){ rmin = Math.max(rmin, 8); rmax = Math.max(rmax, 20); }
      if (CAT[ex].e === 'elastico'){ rmin = Math.max(rmin, 12); rmax = Math.max(rmax, 20); }
      items.push({ex, sets, rmin, rmax, rest, nota: ''});
    }
    if (circuit && items.length){ items.forEach(x => { x.rest = 0; x.sets = beginner ? 3 : 4; }); items[items.length - 1].rest = 90; items[0].nota = 'Circuito: faça os exercícios em sequência e descanse 90 s ao fim de cada volta.'; }
    if (o.goal === 'definicao'){
      for (let i = 2; i + 1 < items.length; i += 2){ items[i].rest = 0; items[i].nota = 'Bi-set: vá direto para o próximo exercício.'; }
      const c = pickEx('cardio', eq, used, false, o.local);
      if (c) items.push({ex: c, sets: 1, rmin: 15, rmax: 20, rest: 0, nota: 'Cardio moderado de 15 a 20 minutos. Anote os minutos no campo de repetições.'});
    }
    if (items[0] && SLOTS[d.s[0]].r === 'main' && !circuit && !items[0].nota) items[0].nota = 'Faça 1 a 2 séries leves de aproximação antes.';
    return {nome: d.n, cor: wi % COLORS, items};
  });
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
  G('g-casa3', 'Em Casa Completo 3x', {goal: 'hipertrofia', local: 'casa', dias: 3, nivel: 'Iniciante', dur: 45}, {tag: ['EM', 'CASA'], art: 'goblet', desc: 'Halteres, elástico e peso do corpo combinados. Cobre todos os grupos musculares em três treinos.'}),
  G('g-casa4', 'Em Casa Upper Lower 4x', {goal: 'hipertrofia', local: 'casa', dias: 4, nivel: 'Intermediário', dur: 45}, {tag: ['UPPER', 'LOWER'], art: 'remada-elastico', desc: 'Divisão de superiores e inferiores para treinar em casa com halteres e elástico.'}),
  G('g-casa-glute', 'Glúteos em Casa 3x', {goal: 'hipertrofia', local: 'casa', split: 'glute3', nivel: 'Iniciante', dur: 45, foco: 'gluteos'}, {tag: ['GLÚTEOS', 'CASA'], art: 'ponte-elastico', desc: 'Elevação de quadril, abdução com elástico e agachamentos, com um dia de corpo inteiro.'}),
  // peso corporal
  G('g-cal-fb3', 'Calistenia Iniciante 3x', {goal: 'hipertrofia', local: 'peso', dias: 3, nivel: 'Iniciante', dur: 45}, {tag: ['CALIS', 'TENIA'], art: 'flexao', desc: 'Flexões, agachamentos, remada invertida e core. Progrida aumentando repetições e depois variações mais difíceis.'}),
  G('g-cal-ul4', 'Calistenia Upper Lower 4x', {goal: 'hipertrofia', local: 'peso', dias: 4, nivel: 'Intermediário', dur: 45}, {tag: ['UPPER', 'LOWER'], art: 'barra-fixa', desc: 'Peso do corpo com barra fixa. Inclui variações como flexão arqueiro e agachamento unilateral.'}),
  G('g-hiit-pc', 'HIIT Sem Equipamento 3x', {goal: 'condicionamento', local: 'peso', split: 'circ3', nivel: 'Iniciante', dur: 30}, {tag: ['HIIT', '30 MIN'], art: 'burpee', desc: 'Circuito de 30 minutos com força e intervalados. Pode ser feito na sala de casa.'}),
  // elástico
  G('g-el-fb3', 'Elástico Corpo Inteiro 3x', {goal: 'hipertrofia', local: 'elastico', dias: 3, nivel: 'Iniciante', dur: 45}, {tag: ['ELÁSTICO', 'TOTAL'], art: 'agachamento-elastico', desc: 'Treino completo com elásticos e peso do corpo. Para casa, viagem ou recuperação.'}),
  G('g-el-ul4', 'Elástico Upper Lower 4x', {goal: 'hipertrofia', local: 'elastico', dias: 4, nivel: 'Intermediário', dur: 45}, {tag: ['UPPER', 'LOWER'], art: 'puxada-elastico', desc: 'Superiores e inferiores com elástico. Use elásticos mais fortes conforme ficar fácil.'}),
  // kettlebell
  G('g-kb-fb3', 'Kettlebell Corpo Inteiro 3x', {goal: 'hipertrofia', local: 'kettlebell', dias: 3, nivel: 'Intermediário', dur: 45}, {tag: ['KETTLE', 'BELL'], art: 'kettlebell-swing', desc: 'Swing, goblet, remada, desenvolvimento e levantamento turco. Força e condicionamento com uma ferramenta só.'}),
  G('g-kb-hiit', 'Kettlebell Condicionamento 3x', {goal: 'condicionamento', local: 'kettlebell', split: 'circ3', nivel: 'Intermediário', dur: 30}, {tag: ['KB', 'HIIT'], art: 'kb-thruster', desc: 'Circuitos curtos e intensos com kettlebell.'}),
  // fita de suspensão
  G('g-trx-fb3', 'TRX Corpo Inteiro 3x', {goal: 'hipertrofia', local: 'suspensao', dias: 3, nivel: 'Iniciante', dur: 45}, {tag: ['FITA DE', 'SUSPENSÃO'], art: 'trx-remada', desc: 'Remada, supino, agachamento, flexora e braços na fita. Ajuste a dificuldade mudando a inclinação do corpo.'}),
  G('g-trx-ul4', 'TRX Upper Lower 4x', {goal: 'hipertrofia', local: 'suspensao', dias: 4, nivel: 'Intermediário', dur: 45}, {tag: ['TRX', 'UPPER LOWER'], art: 'trx-supino', desc: 'Superiores e inferiores com a fita de suspensão e o peso do corpo.'}),
  // viagem
  G('g-viagem3', 'Hotel 30 Minutos 3x', {goal: 'hipertrofia', local: 'viagem', dias: 3, nivel: 'Iniciante', dur: 30}, {tag: ['EM', 'VIAGEM'], art: 'polichinelo', desc: 'Para o quarto de hotel: peso do corpo e um elástico que cabe na mala.'}),
  G('g-viagem-hiit', 'Viagem HIIT 2x', {goal: 'condicionamento', local: 'viagem', split: 'circ3', nivel: 'Intermediário', dur: 30}, {tag: ['HIIT', 'VIAGEM'], art: 'skater', desc: 'Dois ou três circuitos por semana para manter o condicionamento longe de casa.'}),
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
    {nome: 'Pernas Hipertrofia', cor: 3, items: [Y('agachamento', 4, 8, 10, 150, 'Cerca de 85% da carga do dia de força.'), Y('hack', 3, 8, 12, 120), Y('leg-press', 2, 12, 15, 90), Y('extensora', 3, 15, 20, 60), Y('stiff-barra', 3, 8, 12, 120), Y('mesa-flexora', 2, 12, 15, 60), Y('cadeira-flexora', 2, 15, 20, 60), Y('pant-burrinho', 4, 10, 15, 60), Y('pant-sentado', 3, 15, 20, 60)]},
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
    {nome: 'A: Peito', cor: 0, items: [Y('supino-reto-barra', 4, 6, 10, 150), Y('supino-incl-halter', 4, 8, 12, 90), Y('supino-decl-maquina', 3, 8, 12, 90), Y('voador', 3, 12, 15, 60), Y('crossover', 3, 12, 15, 60)]},
    {nome: 'B: Costas', cor: 3, items: [Y('barra-fixa', 4, 6, 10, 120), Y('remada-curvada', 4, 8, 10, 120), Y('puxada-neutra', 3, 10, 12, 90), Y('remada-unilateral-cabo', 3, 10, 12, 60), Y('pulldown-estendido', 3, 12, 15, 60)]},
    {nome: 'C: Ombros', cor: 2, items: [Y('desenv-barra', 4, 6, 10, 150), Y('arnold', 3, 8, 12, 90), Y('elev-lateral-halter', 4, 12, 20, 60), Y('elev-lateral-cabo', 3, 12, 20, 45), Y('face-pull', 3, 12, 20, 60), Y('encolhimento-barra', 3, 10, 15, 60)]},
    {nome: 'D: Braços', cor: 5, items: [Y('rosca-barra', 4, 8, 12, 60), Y('supino-fechado', 4, 6, 10, 90), Y('rosca-inclinada', 3, 10, 12, 60), Y('triceps-frances-cabo', 3, 10, 15, 60), Y('rosca-martelo', 3, 10, 15, 45), Y('triceps-corda', 3, 12, 15, 45), Y('rosca-punho', 2, 15, 20, 45)]},
    {nome: 'E: Pernas', cor: 1, items: [Y('agachamento', 4, 6, 10, 180), Y('leg-press', 4, 10, 15, 120), Y('stiff-barra', 3, 8, 12, 120), Y('extensora', 3, 12, 15, 60), Y('mesa-flexora', 3, 10, 15, 60), Y('pant-pe', 4, 10, 15, 60)]}]},
  {id: 'c-retorno', nome: 'Primeiro Mês na Academia', goal: ['saude', 'hipertrofia'], local: ['academia'], nivel: 'Iniciante', freq: 3, dur: 45, tag: ['PRIMEIRO', 'MÊS'], art: 'supino-reto-maquina',
   desc: 'Adaptação: máquinas fáceis de aprender, 2 séries longe da falha (3 a 4 reps sobrando). Também serve para voltar depois de uma pausa. Passe para um programa completo após 4 semanas.', workouts: [
    {nome: 'Adaptação A', cor: 3, items: [Y('leg-press', 2, 12, 15, 90), Y('supino-reto-maquina', 2, 12, 15, 90), Y('puxada-aberta', 2, 12, 15, 90), Y('cadeira-flexora', 2, 12, 15, 60), Y('prancha', 2, 20, 30, 60, 'Segundos de prancha nas repetições.')]},
    {nome: 'Adaptação B', cor: 5, items: [Y('extensora', 2, 12, 15, 60), Y('remada-iso', 2, 12, 15, 90), Y('desenv-maquina', 2, 12, 15, 90), Y('elevacao-pelvica', 2, 12, 15, 90), Y('dead-bug', 2, 10, 12, 60)]}]},
  {id: 'c-abs', nome: 'Abdômen e Core', goal: ['definicao', 'saude'], local: ['academia', 'casa', 'peso'], nivel: 'Iniciante', freq: 3, dur: 15, tag: ['CORE', '15 MIN'], art: 'abd-bicicleta', comp: true,
   desc: 'Complemento de 15 minutos para fazer no fim de 2 a 3 treinos. Combina flexão do tronco, rotação, anti-rotação e estabilidade.', workouts: [
    {nome: 'Core A', cor: 4, items: [Y('elev-pernas', 3, 10, 15, 45), Y('abd-bicicleta', 3, 20, 30, 45), Y('prancha', 3, 30, 45, 45, 'Segundos nas repetições.'), Y('dead-bug', 2, 10, 12, 45)]},
    {nome: 'Core B', cor: 6, items: [Y('abd-polia', 3, 10, 15, 45), Y('lenhador', 3, 10, 12, 45, 'Repetições em cada lado.'), Y('prancha-lateral', 2, 20, 40, 45, 'Segundos em cada lado.'), Y('roda', 3, 8, 12, 60)]}]},
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
   desc: 'Treino avulso de 25 minutos em circuito, em qualquer lugar.', workouts: [{nome: 'Circuito', cor: 7, items: [Y('agachamento-livre', 3, 15, 20, 0, 'Circuito: em sequência, 90 s de descanso ao fim da volta.'), Y('flexao', 3, 8, 15, 0), Y('remada-invertida', 3, 8, 12, 0), Y('afundo-caminhando', 3, 10, 12, 0), Y('prancha', 3, 30, 45, 0, 'Segundos.'), Y('polichinelo', 3, 20, 30, 90)]}]},
  {id: 'c-avulso-elastico', nome: 'Elástico 25 Minutos', goal: ['hipertrofia', 'saude'], local: ['elastico', 'viagem', 'casa'], nivel: 'Iniciante', freq: 1, dur: 25, tag: ['ELÁSTICO', '25 MIN'], art: 'puxada-elastico', avulso: true,
   desc: 'Treino avulso de corpo inteiro com um elástico.', workouts: [{nome: 'Elástico total', cor: 3, items: [Y('agachamento-elastico', 3, 12, 20, 60), Y('supino-elastico', 3, 12, 20, 60), Y('remada-elastico', 3, 12, 20, 60), Y('desenv-elastico', 2, 12, 20, 45), Y('ponte-elastico', 3, 15, 20, 45), Y('rosca-elastico', 2, 12, 20, 45)]}]},
  {id: 'c-avulso-kb', nome: 'Kettlebell 20 Minutos', goal: ['condicionamento'], local: ['kettlebell', 'casa', 'cardio'], nivel: 'Intermediário', freq: 1, dur: 20, tag: ['KB', '20 MIN'], art: 'kettlebell-swing', avulso: true,
   desc: 'Circuito avulso: swing, goblet, remada e desenvolvimento.', workouts: [{nome: 'KB circuito', cor: 4, items: [Y('kettlebell-swing', 4, 15, 20, 0, 'Circuito: 60 s de descanso ao fim da volta.'), Y('goblet', 4, 10, 12, 0), Y('kb-remada', 4, 10, 12, 0, 'Repetições em cada lado.'), Y('kb-desenv', 4, 8, 10, 60)]}]},
  {id: 'c-avulso-hiit', nome: 'HIIT 20 Minutos', goal: ['condicionamento', 'definicao'], local: ['peso', 'cardio', 'viagem'], nivel: 'Intermediário', freq: 1, dur: 20, tag: ['HIIT', '20 MIN'], art: 'escalador', avulso: true,
   desc: 'Intervalado de alta intensidade: 40 s de trabalho e 20 s de pausa em cada exercício.', workouts: [{nome: 'HIIT', cor: 0, items: [Y('burpee', 4, 8, 12, 0, '40 s de trabalho, 20 s de pausa. Repita o bloco 4 vezes.'), Y('agachamento-salto', 4, 10, 15, 0), Y('escalador', 4, 20, 30, 0), Y('skater', 4, 16, 20, 0), Y('skipping', 4, 30, 40, 60)]}]},
];

// ---------- monta a biblioteca final ----------
(function buildLibrary(){
  const meta = {
    't-hip5': {goal: ['hipertrofia'], local: ['academia'], nivel: 'Intermediário', freq: 5, dur: 75, tag: ['HIPER', '5 DIAS'], art: 'supino-reto-barra', foco: ['bracos', 'peito', 'costas'], destaque: true},
    't-ul4': {goal: ['hipertrofia'], local: ['academia'], nivel: 'Intermediário', freq: 4, dur: 60, tag: ['UPPER', 'LOWER'], art: 'remada-curvada'},
    't-ppl': {goal: ['hipertrofia'], local: ['academia'], nivel: 'Avançado', freq: 6, dur: 75, tag: ['PUSH', 'PULL', 'LEGS'], art: 'desenv-halter'},
    't-fb3': {goal: ['hipertrofia', 'saude'], local: ['academia'], nivel: 'Iniciante', freq: 3, dur: 60, tag: ['FULL', 'BODY'], art: 'agachamento'},
    't-maq3': {goal: ['saude', 'hipertrofia'], local: ['academia'], nivel: 'Iniciante', freq: 3, dur: 45, tag: ['MÁQUI', 'NAS'], art: 'voador'},
    't-bracos': {goal: ['hipertrofia'], local: ['academia'], nivel: 'Intermediário', freq: 2, dur: 40, tag: ['BRAÇOS', 'OMBROS'], art: 'rosca-barra', foco: ['bracos', 'ombros'], comp: true},
    't-express': {goal: ['hipertrofia', 'definicao'], local: ['academia'], nivel: 'Intermediário', freq: 3, dur: 45, tag: ['EXPRESS', '45 MIN'], art: 'goblet'},
  };
  TEMPLATES.forEach(t => Object.assign(t, {foco: [], ...meta[t.id]}));
  const focoHand = {'c-phat': ['bracos'], 'c-arnold': ['peito', 'costas', 'bracos'], 'c-abcde': ['bracos', 'ombros'], 'c-abcd': ['ombros'], 'c-abs': ['abdomen'], 'c-pernas-comp': ['pernas'], 'c-gbr': ['pernas'],
    'c-avulso-peito': ['peito'], 'c-avulso-costas': ['costas'], 'c-avulso-ombro': ['ombros'], 'c-avulso-pernas': ['pernas'], 'c-avulso-gluteo': ['gluteos'], 'c-avulso-bracos': ['bracos'], 'c-avulso-pc': ['abdomen']};
  HAND.forEach(t => { t.foco = focoHand[t.id] || []; });
  HAND.forEach(t => TEMPLATES.push({dias: t.freq + 'x por semana', foco: [], ...t}));
  GEN_LIST.forEach(g => { const w = genProgram(g.gen); TEMPLATES.push({dias: g.freq + 'x por semana', workouts: w, ...g, local: [...g.local, ...(g.locExtra || [])]}); });
  // foco inferido pelos músculos mais trabalhados quando não declarado
  TEMPLATES.forEach(t => { if (!t.dias) t.dias = t.freq + 'x por semana'; if (t.avulso) t.dias = 'Treino avulso'; if (t.comp) t.dias = 'Complemento · ' + t.freq + 'x'; });
})();
