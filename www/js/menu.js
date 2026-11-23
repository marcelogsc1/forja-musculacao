/* ---------- Cardápios sugeridos (v4.18) ----------
   Monta cardápios de um dia inteiro a partir das metas do plano (calorias, proteína, carboidrato e gordura),
   com alimentos da TACO e medidas caseiras da POF/IBGE (foods.js). Tudo roda no aparelho, sem IA:
   modelos de refeição + escolha ponderada pelo perfil + ajuste de porções por busca local.
   Sugestões educativas; não substituem nutricionista. */

const MEALS = {
  cafe: {t: 'Café da manhã', kc: .24, pw: 1},
  lm: {t: 'Lanche da manhã', kc: .10, pw: .7},
  alm: {t: 'Almoço', kc: .30, pw: 1.2},
  lt: {t: 'Lanche da tarde', kc: .13, pw: .8},
  jan: {t: 'Jantar', kc: .25, pw: 1.2},
  ceia: {t: 'Ceia', kc: .08, pw: .8}
};
const MN_STYLES = [['trad', 'Tradicional', 'Arroz e feijão no almoço e no jantar'], ['prat', 'Prático', 'Pouco preparo, fácil de levar em marmita'], ['var', 'Variado', 'Mais alimentos diferentes ao longo da semana']];
const MN_DIETS = [['oni', 'Como de tudo'], ['semver', 'Sem carne vermelha'], ['pesc', 'Pescetariana'], ['veg', 'Vegetariana'], ['vegan', 'Vegana']];
const MN_TRAIN = [['manha', 'Manhã'], ['tarde', 'Tarde'], ['noite', 'Noite'], ['none', 'Varia']];
const DIET_EX = {oni: [], semver: ['carne', 'porco'], pesc: ['carne', 'porco', 'frango'], veg: ['carne', 'porco', 'frango', 'peixe', 'mar'], vegan: ['carne', 'porco', 'frango', 'peixe', 'mar', 'ovo', 'lac', 'mel']};
const MN_NOTE = {macarrao: 'peso cru', cafe: 'ou chá, sem açúcar'};
const MAIN = ['alm', 'jan'];
/* v4.28: alimentos que você gosta e que evita, escolhidos na lista, e o quanto variar */
const MN_GROUPS = [['Proteínas', ['prot', 'bprot']], ['Carboidratos', ['base', 'bcarb']], ['Feijões', ['leg']], ['Frutas', ['fruit']], ['Saladas e legumes', ['salad', 'cooked']], ['Gorduras, castanhas e outros', ['fat', 'sweet', 'drink']]];
const MN_RANGE = [['basic', 'Básicos', 'O que tem em qualquer mercado'], ['mid', 'Equilibrado', 'Básicos e alguns diferentes'], ['wide', 'Bem variado', 'Inclui os menos comuns']];
/* o básico do mercado brasileiro: fácil de achar e de preparar */
const MN_COMMON = new Set(['arroz', 'batata', 'batdoce', 'mandioca', 'macarrao', 'cuscuz', 'fcarioca', 'fpreto', 'frango', 'coxa', 'patinho', 'moida', 'musculo', 'ovo', 'atum', 'sardinha', 'paof', 'paoi', 'aveia', 'tapioca', 'torrada', 'iogurte', 'minas', 'mussarela', 'requeijao', 'presunto', 'leitepo', 'banana', 'maca', 'mamao', 'laranja', 'melancia', 'goiaba', 'tangerina', 'abacaxi', 'alface', 'tomate', 'pepino', 'cenoura', 'repolho', 'abobrinha', 'abobora', 'chuchu', 'beterraba', 'couve', 'cenourac', 'brocolis', 'azeite', 'amendoim', 'manteiga', 'mel', 'cafe']);

/* Modelos de refeição (v4.29): cada um é um prato ou lanche conhecido, com nome. Os alimentos de cada vaga combinam
   entre si; nada de juntar itens soltos. Cada vaga: r = papel do alimento, from = alimentos aceitos (sem from, qualquer um
   do papel), n = quantos diferentes, fix = porção fixa, opt = some se não houver opção, only = só nessas refeições,
   dg = porção padrão em gramas, nt = observação curta do item. pre = bom antes do treino. nm = nome do prato. */
const CAFE_FRUIT = ['mamao', 'banana', 'melao', 'abacaxi', 'laranja', 'maca', 'tangerina', 'melancia', 'pera', 'goiaba'];
const kw0 = k => FOODS[k] ? FOODS[k].kw[0] : '';
const itF = (it, rs) => (it.find(i => rs.includes(i.r) || rs.includes(i.f)) || {}).f;
const withCafe = (nm, it) => it.some(i => i.f === 'cafe') ? `${nm} e café${it.some(i => i.nt === 'no café') ? ' com leite' : ''}` : nm;
const CAFE = [{r: 'drink', fix: 1, only: ['cafe'], opt: 1}, {r: 'bprot', from: ['leitepo'], fix: 1, only: ['cafe'], opt: 1, dg: 20, nt: 'no café'}, {r: 'fruit', from: CAFE_FRUIT, only: ['cafe'], opt: 1, fix: 1}];
const TPL = [
  {id: 'paoovo', at: ['cafe', 'lm', 'lt'], pre: 1, s: [{r: 'bcarb', from: ['paof', 'paoi']}, {r: 'bprot', from: ['ovo'], nt: 'mexido ou cozido'}, {r: 'bprot', from: ['clara'], cut: 1, nt: 'junto com o ovo'}, ...CAFE], nm: it => withCafe('Pão com ovo', it)},
  {id: 'paoqj', at: ['cafe', 'lm', 'lt'], s: [{r: 'bcarb', from: ['paof', 'paoi']}, {r: 'bprot', from: ['minas', 'mussarela', 'requeijao']}, ...CAFE], nm: it => withCafe(itF(it, ['requeijao']) ? 'Pão com requeijão' : 'Pão com queijo', it)},
  {id: 'misto', at: ['cafe', 'lm', 'lt'], s: [{r: 'bcarb', from: ['paof', 'paoi']}, {r: 'bprot', from: ['mussarela']}, {r: 'bprot', from: ['presunto']}, ...CAFE], nm: it => withCafe('Misto quente', it)},
  {id: 'sandn', at: ['lm', 'lt'], pre: 1, s: [{r: 'bcarb', from: ['paoi', 'paof']}, {r: 'bprot', from: ['frango', 'atum']}, {r: 'salad', from: ['cenoura', 'alface', 'tomate'], fix: 1, dg: 30}], nm: it => `Sanduíche natural de ${kw0(itF(it, ['frango', 'atum']))}`},
  {id: 'tap', at: ['cafe', 'lm', 'lt'], pre: 1, s: [{r: 'bcarb', from: ['tapioca']}, {r: 'bprot', from: ['ovo', 'minas', 'mussarela', 'frango']}, ...CAFE], nm: it => { const f = itF(it, ['ovo', 'minas', 'mussarela', 'frango']); return withCafe(f === 'ovo' ? 'Tapioca com ovo' : f === 'frango' ? 'Tapioca de frango' : 'Tapioca com queijo', it); }},
  {id: 'cuscuz', at: ['cafe', 'lt'], pre: 1, s: [{r: 'bcarb', from: ['cuscuz']}, {r: 'bprot', from: ['ovo']}, ...CAFE], nm: it => withCafe('Cuscuz com ovo', it)},
  {id: 'ovostor', at: ['cafe', 'lm'], s: [{r: 'bprot', from: ['ovo'], nt: 'mexidos'}, {r: 'bprot', from: ['clara'], cut: 1, nt: 'mexidas junto'}, {r: 'bcarb', from: ['torrada', 'paoi']}, ...CAFE], nm: it => withCafe('Ovos mexidos com torrada', it)},
  {id: 'iog', at: ['cafe', 'lm', 'lt', 'ceia'], s: [{r: 'bprot', from: ['iogurte', 'iogurted']}, {r: 'fruit', from: ['banana', 'morango', 'mamao', 'manga', 'kiwi', 'abacaxi', 'maca']}, {r: 'bcarb', from: ['aveia']}, {r: 'sweet', from: ['mel'], opt: 1, fix: 1, dg: 8}], nm: it => `Iogurte com ${kw0(itF(it, ['fruit']))} e aveia`},
  {id: 'vit', at: ['cafe', 'lm', 'lt', 'ceia'], pre: 1, s: [{r: 'bprot', from: ['leitepo', 'sojapo'], nt: 'batido com água ou gelo'}, {r: 'fruit', from: ['banana', 'morango', 'mamao', 'manga', 'abacate']}, {r: 'bcarb', from: ['aveia'], opt: 1}], nm: it => `Vitamina de ${kw0(itF(it, ['fruit']))}`},
  {id: 'mingau', at: ['cafe', 'lt', 'ceia'], s: [{r: 'bprot', from: ['leitepo', 'sojapo'], nt: 'com água, no fogo'}, {r: 'bcarb', from: ['aveia']}, {r: 'fruit', from: ['banana', 'maca'], opt: 1}], nm: () => 'Mingau de aveia'},
  {id: 'panq', at: ['cafe', 'lt'], pre: 1, s: [{r: 'fruit', from: ['banana']}, {r: 'bprot', from: ['ovo']}, {r: 'bcarb', from: ['aveia']}], nm: () => 'Panqueca de banana com aveia'},
  {id: 'fcast', at: ['lm', 'lt'], s: [{r: 'fruit'}, {r: 'fat', from: ['castpara', 'caju', 'nozes', 'amendoa', 'amendoim']}], nm: it => `${(kw0(itF(it, ['fruit'])) || 'Fruta').replace(/^./, c => c.toUpperCase())} com castanhas`},
  {id: 'batfr', at: ['lm', 'lt'], pre: 1, s: [{r: 'bcarb', from: ['batdoce']}, {r: 'bprot', from: ['frango', 'ovo']}], nm: it => `Batata-doce com ${kw0(itF(it, ['frango', 'ovo']))}`},
  {id: 'ricota', at: ['ceia', 'lm'], s: [{r: 'bcarb', from: ['torrada', 'paoi']}, {r: 'bprot', from: ['ricota', 'minas']}], nm: it => `Torrada com ${itF(it, ['ricota']) ? 'ricota' : 'queijo minas'}`},
  {id: 'pf', lbl: 'Prato feito', at: MAIN, main: 1, s: [{r: 'base', from: ['arroz', 'arrozi']}, {r: 'leg'}, {r: 'prot'}, {r: 'salad', n: 2, fix: 1}, {r: 'cooked', fix: 1}, {r: 'fat', from: ['azeite'], opt: 1, fix: 1, dg: 8, nt: 'na salada'}, {r: 'fruit', from: CAFE_FRUIT, only: ['alm'], opt: 1, fix: 1, nt: 'de sobremesa'}], nm: it => `Arroz, feijão e ${kw0(itF(it, ['prot']))}`},
  {id: 'tuber', at: MAIN, main: 1, s: [{r: 'base', from: ['batdoce', 'batata', 'mandioca', 'cara']}, {r: 'leg', opt: 1, vegOnly: 1}, {r: 'prot'}, {r: 'salad', fix: 1}, {r: 'cooked', n: 2, fix: 1}, {r: 'fat', from: ['azeite'], opt: 1, fix: 1, dg: 8, nt: 'na salada'}, {r: 'fruit', from: CAFE_FRUIT, only: ['alm'], opt: 1, fix: 1, nt: 'de sobremesa'}], nm: it => `${kw0(itF(it, ['prot'])).replace(/^./, c => c.toUpperCase())} com ${kw0(itF(it, ['base']))}`},
  {id: 'massa', at: MAIN, main: 1, s: [{r: 'base', from: ['macarrao']}, {r: 'prot', from: ['moida', 'frango', 'atum', 'camarao', 'tofu']}, {r: 'leg', opt: 1, vegOnly: 1}, {r: 'salad', fix: 1}, {r: 'cooked', from: ['abobrinha', 'brocolis', 'berinjela'], fix: 1}, {r: 'fruit', from: CAFE_FRUIT, only: ['alm'], opt: 1, fix: 1, nt: 'de sobremesa'}], nm: it => `Macarrão com ${kw0(itF(it, ['prot']))}`},
  {id: 'sand', lbl: 'Sanduíche', at: ['jan'], dn: 1, s: [{r: 'bcarb', from: ['paof', 'paoi']}, {r: 'bprot', from: ['frango', 'ovo', 'atum', 'moida', 'tofu']}, {r: 'bprot', from: ['minas', 'mussarela'], opt: 1}, {r: 'salad', from: ['alface', 'tomate', 'cenoura'], n: 2, fix: 1}], nm: it => `Sanduíche de ${kw0(itF(it, ['frango', 'ovo', 'atum', 'moida', 'tofu']))}`},
  {id: 'tapj', lbl: 'Tapioca recheada', at: ['jan'], dn: 1, s: [{r: 'bcarb', from: ['tapioca']}, {r: 'bprot', from: ['frango', 'ovo', 'moida', 'tofu']}, {r: 'bprot', from: ['minas', 'mussarela'], opt: 1}, {r: 'salad', from: ['alface', 'tomate', 'cenoura'], n: 2, fix: 1}], nm: it => `Tapioca de ${kw0(itF(it, ['frango', 'ovo', 'moida', 'tofu']))} com salada`},
  {id: 'omel', lbl: 'Omelete', at: ['jan'], dn: 1, s: [{r: 'bprot', from: ['ovo']}, {r: 'bprot', from: ['minas', 'mussarela', 'frango'], opt: 1}, {r: 'bcarb', from: ['paoi', 'torrada', 'paof']}, {r: 'salad', n: 2, fix: 1}], nm: () => 'Omelete com salada e pão'},
  {id: 'cuscj', lbl: 'Cuscuz recheado', at: ['jan'], dn: 1, s: [{r: 'bcarb', from: ['cuscuz']}, {r: 'bprot', from: ['ovo', 'frango', 'moida']}, {r: 'salad', from: ['alface', 'tomate', 'cenoura'], n: 2, fix: 1}], nm: it => `Cuscuz com ${kw0(itF(it, ['ovo', 'frango', 'moida']))} e salada`},
  {id: 'leve', lbl: 'Prato leve', at: ['jan'], main: 1, s: [{r: 'prot'}, {r: 'cooked', n: 2, fix: 1}, {r: 'salad', fix: 1}, {r: 'base', from: ['batdoce', 'arroz', 'arrozi', 'mandioca']}, {r: 'leg', opt: 1, vegOnly: 1}, {r: 'fat', from: ['azeite'], opt: 1, fix: 1, dg: 8, nt: 'na salada'}], nm: it => `${kw0(itF(it, ['prot'])).replace(/^./, c => c.toUpperCase())} com legumes`}
];
/* v4.29: whey protein. Não está na TACO: usa os números do rótulo que a pessoa informa (proteína e calorias por dose).
   Entra como item fixo na refeição de depois do treino (e numa segunda refeição, com 2 doses), e o resto do dia se ajusta. */
const WHEY0 = {doses: 0, p: 21, k: 120}; // dose padrão de 30 g dos concentrados mais vendidos no Brasil (20 a 23 g de proteína, 118 a 122 kcal no rótulo)
function ensureWhey(w){ w = {...WHEY0, doses: w && w.doses ? 1 : 0}; const per = x => x / 30 * 100;
  FOODS.whey = {n: 'Whey protein', t: 0, r: ['supl'], tg: ['lac', 'pratico'], k: per(w.k), p: per(w.p), c: per(Math.max(0, w.k - w.p * 4) / 4), f: 0, fb: 0, q: 30, lo: 30, hi: 60, kw: ['whey'], m: [30, 'dose', 'doses']}; return w; }
ensureWhey();
function wheyMeals(keys, ts, w){ const d = w && w.doses ? 1 : 0; if (!d) return [];
  const first = ts.pos && keys.includes(ts.pos) ? ts.pos : keys.includes('lt') ? 'lt' : keys.includes('lm') ? 'lm' : keys[keys.length - 1];
  if (d < 2) return [first]; const second = ['lm', 'lt', 'cafe', 'ceia'].find(k => keys.includes(k) && k !== first) || keys.find(k => k !== first); return second ? [first, second] : [first]; }
/* nome do prato de uma refeição já montada */
function dishName(m){ const t = TPL.find(x => x.id === m.t); if (!t || !t.nm) return ''; try { return t.nm(m.it) || ''; } catch (e) { return ''; } }
const ROLE_D = {base: 140, leg: 140, prot: 120, bcarb: 50, bprot: 70, fruit: 120, salad: 40, cooked: 90, fat: 8, sweet: 10, drink: 200};
const LEVER = {base: 'c', bcarb: 'c', fruit: 'k', sweet: 'c', leg: 'k', prot: 'p', bprot: 'p', fat: 'f', salad: 'd', cooked: 'd', drink: 'd'};

/* ---------- utilidades ---------- */
function rng(seed){ let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const deacc = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const qnt = (f, g, hi, lo) => { const F = FOODS[f]; const L = Math.max(F.lo, lo || 0); const H = Math.max(L, Math.min(F.hi, hi || F.hi)); let v = Math.round(g / F.q) * F.q; if (v > H) v = Math.floor(H / F.q) * F.q || L; if (v < L) v = Math.ceil(L / F.q) * F.q; return Math.round(Math.min(v, Math.max(H, L)) * 10) / 10; };
/* teto por papel: porções que fazem sentido num prato */
/* v4.29: tetos de porção que parecem comida de verdade (2 pães, 4 fatias de pão de forma, 3 ovos num lanche) */
const SNACK_CAP = {paof: 100, paoi: 100, torrada: 40, tapioca: 100, cuscuz: 135, ovo: 135, iogurte: 300, iogurted: 300, aveia: 45, batdoce: 210, mussarela: 40, presunto: 45, minas: 60, requeijao: 30, ricota: 70};
const SNACK_FLOOR = {frango: 60, atum: 45, ovo: 90, minas: 30, mussarela: 20, presunto: 30, ricota: 35, iogurte: 160, iogurted: 160};
/* planos com mais calorias aceitam porções um pouco maiores (até 1,5x), sem virar comida para três */
let MN_SCALE = 1;
let MN_GAIN = false;
function capOf(f, r, main, veg, dn){ const F = FOODS[f]; const sc = (f === 'ovo' || ['mussarela', 'presunto', 'requeijao', 'minas'].includes(f) ? 1 : MN_SCALE) * (dn && ['bcarb'].includes(r) ? 1.5 : 1); if (!main && SNACK_CAP[f]) return Math.round(SNACK_CAP[f] * sc); if (r === 'fruit') return main ? Math.max(F.lo, 260) : Math.max(F.lo, Math.min(220, F.m ? F.m[0] * 2 : 200)); if (r === 'base') return Math.min(F.hi, Math.round(220 * sc * (MN_GAIN ? 1.15 : 1))); if (f === 'ovo' && !main) return 180; if (f === 'tofu') return 200; if (r === 'bcarb' && !main) return 200; if (r === 'fat' && f !== 'azeite') return 30; if (f === 'azeite') return MN_GAIN ? 13 : 10; if (r === 'bprot' && f === 'leitepo') return 40; if (r === 'leg' && !veg) return 210; return F.hi; }
function floorOf(f, r, main){ const F = FOODS[f]; if (!main && r === 'bprot' && SNACK_FLOOR[f]) return Math.max(F.lo, SNACK_FLOOR[f]); if (main && r === 'prot') return Math.max(F.lo, f === 'ovo' ? 90 : f === 'tofu' ? 100 : 80); if (main && r === 'base') return Math.max(F.lo, 60); return F.lo; }
function dflt(f, r, goal){
  const F = FOODS[f]; let d = ROLE_D[r] || 60;
  if (r === 'fruit' && F.m) d = F.m[0] >= 60 ? F.m[0] : F.m[0] * 2;
  if (r === 'salad' && F.m && F.m[0] >= 40) d = F.m[0];
  if ((r === 'salad' || r === 'cooked') && goal === 'cut') d *= 1.4;
  if ((r === 'salad' || r === 'cooked') && goal === 'gain') d *= .8;
  return qnt(f, d);
}
function macOf(items){ const s = {k: 0, p: 0, c: 0, f: 0, fb: 0}; for (const i of items){ const F = FOODS[i.f]; const r = i.g / 100; s.k += F.k * r; s.p += F.p * r; s.c += F.c * r; s.f += F.f * r; s.fb += F.fb * r; } return s; }

/* ---------- preferências em texto livre ----------
   Regras em português, sem IA. Devolve o que entendeu (log), o que não entendeu (unk) e os efeitos. */
const OBS_RULES = [
  {re: /\bvegan[oa]?s?\b/, set: o => { o.diet = 'vegan'; }, t: 'Alimentação vegana'},
  {re: /\bvegetarian[oa]s?\b|\bovolacto/, set: o => { if (o.diet !== 'vegan') o.diet = 'veg'; }, t: 'Alimentação vegetariana'},
  {re: /\bpesc[ae]tarian[oa]s?\b|\bso (como )?peixe/, set: o => { if (!o.diet) o.diet = 'pesc'; }, t: 'Pescetariana: peixe sim, outras carnes não'},
  {re: /\b(sem|nao como|nao gosto de|evito|odeio|detesto) carnes? vermelhas?\b/, set: o => { o.ex.add('carne'); o.ex.add('porco'); }, t: 'Sem carne vermelha'},
  {re: /\bnao (como|como mais) carnes?\b(?! vermelha)/, set: o => { o.ex.add('carne'); o.ex.add('porco'); }, t: 'Sem carne de boi e de porco', s: 'Se também não come frango e peixe, escreva "vegetariano".'},
  {re: /lactose|laticinio|\bsem leite\b|\bnao (tomo|bebo) leite\b|leite me faz mal/, neg: 1, set: o => { o.ex.add('lac'); }, t: 'Sem leite e derivados'},
  {re: /gluten|celiac|\btrigo\b/, neg: 1, set: o => { o.ex.add('glu'); }, t: 'Sem glúten', s: 'Aveia sai também, porque costuma ter contato com trigo.'},
  {re: /amendoim/, neg: 1, set: o => { o.ex.add('amend'); }, t: 'Sem amendoim'},
  {re: /castanhas?|oleaginosas?|\bnoz(es)?\b|amendoas?/, neg: 1, set: o => { o.ex.add('cast'); }, t: 'Sem castanhas e nozes'},
  {re: /frutos do mar|camarao|crustaceo|marisco/, neg: 1, set: o => { o.ex.add('mar'); }, t: 'Sem frutos do mar'},
  {re: /\bovos?\b/, neg: 1, set: o => { o.ex.add('ovo'); }, t: 'Sem ovo'},
  {re: /\bsoja\b|\btofu\b/, neg: 1, set: o => { o.ex.add('soja'); }, t: 'Sem soja'},
  {re: /\bporco\b|\bsuin[oa]s?\b/, neg: 1, set: o => { o.ex.add('porco'); }, t: 'Sem carne de porco'},
  {re: /\bpeixes?\b/, neg: 1, set: o => { o.ex.add('peixe'); }, t: 'Sem peixe'},
  {re: /\bfrango\b|\bgalinha\b/, neg: 1, set: o => { o.ex.add('frango'); }, t: 'Sem frango'},
  {re: /acucar|\bdoces?\b|\bmel\b/, neg: 1, set: o => { o.ex.add('mel'); }, t: 'Sem mel e sem açúcar'},
  {re: /\bcafe\b(?! da manha)|cafeina/, neg: 1, set: o => { o.ex.add('cafe'); }, t: 'Sem café'},
  {re: /(nao gosto de|sem|odeio|detesto|evito) (salada|folhas?|verduras?)/, set: o => { o.noSalad = true; }, t: 'Sem salada crua; os legumes vêm cozidos'},
  {re: /diabet|glicemia|resistencia a insulina|pre.?diabet/, set: o => { o.ex.add('mel'); o.health.push('diabetes'); }, t: 'Sem mel e sem açúcar', s: 'Diabetes pede um plano feito com nutricionista e médico.'},
  {re: /\brenal\b|\brins?\b|gestante|gravida|gestacao|amamenta|lactante|hipertens|pressao alta|colesterol|triglicer|gastrite|refluxo|anemia|tireoide|hipotireoid|cirurgia bariatrica|bariatrica|alergia alimentar grave|anafila/, set: (o, m) => { o.health.push(m[0]); }, t: 'Condição de saúde informada', s: 'Isso muda o que é seguro comer. Use os cardápios só como ideia e monte o seu com um nutricionista.'},
  {re: /\b([3-6]|tres|quatro|cinco|seis) refeic/, set: (o, m) => { o.meals = {tres: 3, quatro: 4, cinco: 5, seis: 6}[m[1]] || +m[1]; }, t: m => `${({tres: 3, quatro: 4, cinco: 5, seis: 6})[m[1]] || m[1]} refeições por dia`},
  {re: /trein\w* (em )?jejum|jejum antes do treino|trein\w* sem comer|trein\w* de estomago vazio/, set: o => { o.fastTrain = true; o.train = 'manha'; }, t: 'Treino em jejum, de manhã', s: 'O café da manhã vira a refeição de depois do treino.'},
  {re: /(alterna\w*|as vezes|de vez em quando|uns dias|alguns dias) (o )?(jant\w* )?(com )?(um )?lanche|lanche (as vezes|de vez em quando|alguns dias|uns dias)/, set: o => { o.din = 'misto'; }, t: 'Jantar: alterna prato e lanche'},
  {re: /(prefiro|gosto de|quero|pode ser|melhor) (um |uns )?lanches?|lanches? (a|de|na|pela) noite|lanches? no (lugar d[ao] )?jant\w*|jant\w* (tipo|como|estilo|de|em forma de|vira|virar|com|so) (um |uma )?(lanche|sanduiche|misto|tapioca|omelete|cuscuz|crepioca)|(sanduiche|tapioca|omelete|misto quente) (no|de|na hora do) jant\w*|\bsem jant\w*|nao janto|nao como (a )?jant\w*|nao faco (a )?jant\w*|sanduiches? (a|de|na) noite|(sem|nada de) (arroz e feijao|comida( de panela)?|prato( de comida)?) (a|de|na|pela|no) (noite|jant\w*)|(a|de) noite (so |prefiro )?(um )?lanche/, set: o => { o.din = 'lanche'; }, t: 'Jantar em formato de lanche', s: 'Sanduíche, tapioca, omelete ou cuscuz no lugar de arroz e feijão. Para tirar o jantar de vez, escolha menos refeições.'},
  {re: /(como|almoco|almoço) (fora|no restaurante|na rua|no trabalho)|restaurante|bandejao|self.?service|refeitorio|quentinha|\bpf\b|prato feito no/, set: o => { o.lunchOut = true; }, t: 'Almoço fora de casa', s: 'Use o almoço como guia de proporções para montar o prato no restaurante.'},
  {re: /almoco (leve|pequeno|rapido)|almoco tipo lanche|pouca fome no almoco/, set: o => { o.lightLunch = true; }, t: 'Almoço mais leve'},
  {re: /(sem|pouco|menos|nada de|evito|cortar) carbo\w* (a|de|na|pela|no) (noite|jant\w*)|carbo\w* so (de dia|ate o almoco)/, set: o => { o.lowCarbNight = true; }, t: 'Menos carboidrato à noite', s: 'O carboidrato passa para as refeições do dia; o total não muda.'},
  {re: /(sem|pouca|nao tenho) fome (de|pela|a|na) manha|acordo sem fome|como pouco (de|pela|a) manha|cafe da manha (leve|pequeno|rapido)/, set: o => { o.smallBf = true; }, t: 'Café da manhã leve'},
  {re: /(muita |mais )?fome (a|de|pela|na) noite|belisc\w* (a|de) noite|ataco a geladeira|como muito (a|de) noite/, set: o => { o.bigNight = true; }, t: 'Mais comida à noite'},
  {re: /(nao tomo|pulo|sem|nao como no|nao faco) (o )?cafe da manha|jejum|\bpulo o cafe\b/, set: o => { o.skipBf = true; }, t: 'Sem café da manhã: começa no almoço'},
  {re: /trein\w* (de|pela|a|na|logo de|bem) (manha|cedo|madrugada)|trein\w* (as|às) ([5-9]|10|11)\s*h?\b|trein\w* cedo/, set: o => { o.train = 'manha'; }, t: 'Treino de manhã'},
  {re: /trein\w* (de|pela|a|na|no fim da) tarde|trein\w* (as|às) (1[2-7])\s*h?\b|trein\w* depois do almoco/, set: o => { o.train = 'tarde'; }, t: 'Treino à tarde'},
  {re: /trein\w* (de|a|na|pela) noite|trein\w* (as|às) (1[89]|2[0-3])\s*h?\b|trein\w* depois do trabalho/, set: o => { o.train = 'noite'; }, t: 'Treino à noite'},
  {re: /pratic|rapid|pouco tempo|correria|marmita|nao sei cozinhar|cozinho pouco|nao cozinho|nao gosto de cozinhar|preguica de cozinhar|sem fogao|nao tenho tempo|sem tempo/, set: o => { o.prat = true; }, t: 'Mais prático: pouco preparo e marmita'},
  {re: /barat|econom|orcamento|grana|gastar pouco|apertad|caro\b/, set: o => { o.budget = true; }, t: 'Alimentos mais em conta'},
  {re: /low ?carb|menos carbo|pouco carbo|cortar carbo|reduzir carbo/, set: o => { o.lowcarb = true; }, t: 'Menos carboidrato, mesmas calorias'},
  {re: /mais proteina|proteina alta|bastante proteina|muita proteina|hiperproteic/, set: o => { o.hiprot = true; }, t: 'Proteína no topo da faixa'},
  {re: /jantar leve|janto pouco|jantar cedo|jantar pequeno|pouca fome a noite/, set: o => { o.light = true; }, t: 'Jantar mais leve'},
  {re: /mais (fome|apetite) (de|pela|a) manha|cafe da manha (grande|reforcado)/, set: o => { o.bigBf = true; }, t: 'Café da manhã reforçado'},
  {re: /frit/, set: () => {}, t: 'Sem frituras', s: 'Já é assim: tudo é cozido, assado ou grelhado.'},
  {re: /whey|albumina/, set: () => {}, t: 'Whey: use a opção acima', s: 'Marque "Toma whey protein?" acima e o cardápio desconta da meta do dia.'},
  {re: /suplement/, set: () => {}, t: 'Suplementos ficam a seu critério', s: 'Whey dá para marcar na opção acima.'},
  {re: /comida (caseira|simples|de casa|de verdade|brasileira)|trivial|arroz e feijao (todo dia|sempre)|(gosto|adoro) de arroz e feijao/, set: o => { o.style = 'trad'; }, t: 'Comida caseira: arroz, feijão e mistura'},
  {re: /variar|variedade|variado|enjoo|enjoei|nao gosto de repetir|diferente todo dia|nada repetido/, set: o => { o.style = 'var'; }, t: 'Mais variedade'},
  {re: /(sem|nao gosto de|odeio|detesto|evito|nao como) frutas?\b/, set: o => { o.noFruit = true; }, t: 'Sem frutas'},
  {re: /(sem|nao gosto de|odeio|detesto|evito|nao como) (legumes?|verduras? cozidas?|vegetais)/, set: o => { o.noCooked = true; }, t: 'Sem legumes cozidos', s: 'Fibras e vitaminas fazem falta: tente ao menos a salada crua.'},
  {re: /hala?l|kosher|casher|judaic|islam|muculman/, set: o => { o.ex.add('porco'); o.ex.add('mar'); }, t: 'Sem porco e sem frutos do mar', s: 'Outras regras religiosas, como separar carne e leite ou o abate, não são controladas aqui.'},
  {re: /cervej|alcool|bebida alcoolica|\bvinho|\bdrinks?\b|caipirinha/, set: () => {}, t: 'Bebida alcoólica fica fora do cardápio', s: 'Se beber, conte as calorias: o álcool tem 7 kcal por grama.'},
  {re: /emagrec|secar|perder (peso|gordura|barriga)|definir|definicao|ganhar (massa|peso|musculo)|hipertrofia|engordar|bulking|cutting|manter (o )?peso/, set: () => {}, t: 'Objetivo: vem do seu plano', s: 'Para mudar o objetivo, edite o plano de calorias.'},
  {re: /\bcomo (\d|tres|quatro|cinco|seis) vezes/, set: (o, m) => { o.meals = Math.max(3, Math.min(6, {tres: 3, quatro: 4, cinco: 5, seis: 6}[m[1]] || +m[1])); }, t: m => `${Math.max(3, Math.min(6, ({tres: 3, quatro: 4, cinco: 5, seis: 6})[m[1]] || +m[1]))} refeições por dia`},
  {re: /como de tudo|sem restric/, set: () => {}, t: 'Sem restrições'}
];
const NOT_IN_DB = [[/quinoa/, 'quinoa'], [/granola/, 'granola'], [/\bchia\b/, 'chia'], [/cottage/, 'queijo cottage'], [/pasta de amendoim|manteiga de amendoim/, 'pasta de amendoim'], [/peito de peru|blanquet/, 'peito de peru'], [/grao.?de.?bico/, 'grão-de-bico'], [/salsicha|linguica|bacon|salame/, 'embutidos'], [/pizza|hamburguer|lanche(s)? (de|da) rua|fast.?food/, 'fast-food'], [/refri|refrigerante/, 'refrigerante'], [/chocolate|sorvete|bolo|doces? de/, 'doces'], [/iogurte grego|kefir|skyr/, 'iogurte grego e kefir'], [/acai/, 'açaí'], [/whey|albumina|hipercalor/, 'suplementos'], [/tilapia/, 'tilápia'], [/frango desfiado/, 'frango desfiado (use peito de frango)'], [/batata frita|fritura/, 'frituras']];
/* pratos citados pelo nome ("adoro pão com ovo", "costumo comer cuscuz") */
const DISH_KW = [['paoovo', /pao com ovo/, 'pão com ovo'], ['misto', /misto( quente)?/, 'misto quente'], ['paoqj', /pao com (queijo|requeijao)/, 'pão com queijo'], ['tap', /tapioca/, 'tapioca'], ['cuscuz', /cuscuz/, 'cuscuz'], ['iog', /iogurte/, 'iogurte com fruta'], ['vit', /vitamina/, 'vitamina'], ['mingau', /mingau/, 'mingau'], ['panq', /panqueca/, 'panqueca de banana'], ['sandn', /sanduiche natural|lanche natural/, 'sanduíche natural'], ['batfr', /batata.?doce com frango/, 'batata-doce com frango'], ['ovostor', /ovos? mexidos?/, 'ovos mexidos'], ['pf', /arroz e feijao|prato feito/, 'arroz e feijão'], ['massa', /macarrao|macarronada|massa/, 'macarrão'], ['omel', /omelete/, 'omelete'], ['fcast', /fruta com castanha/, 'fruta com castanhas']];
const NEG_RE = /\b(nao|sem|odeio|detesto|evito|evitar|alergi\w*|intoleran\w*|nada de|nunca|tirar|tira|exceto|menos|nem|enjoei|enjoo)\b/;
let _kwIdx = null;
function kwIndex(){
  if (_kwIdx) return _kwIdx;
  const m = new Map();
  for (const [k, F] of Object.entries(FOODS)) for (const w of F.kw){ const n = deacc(w); if (!m.has(n)) m.set(n, {w, keys: []}); m.get(n).keys.push(k); }
  _kwIdx = [...m.entries()].map(([n, v]) => [n, v.keys, v.w]).sort((a, b) => b[0].length - a[0].length); return _kwIdx;
}
function parseMenuObs(text){
  const o = {likeDish: new Set(), noDish: new Set(), diet: null, ex: new Set(), no: new Set(), like: new Set(), meals: null, skipBf: false, train: null, prat: false, budget: false, lowcarb: false, hiprot: false, light: false, bigBf: false, noSalad: false, noFruit: false, noCooked: false, din: null, lunchOut: false, lightLunch: false, lowCarbNight: false, smallBf: false, bigNight: false, fastTrain: false, style: null, missing: [], health: [], log: [], unk: []};
  const raw = String(text || '').trim(); if (!raw) return o;
  const segs = raw.split(/[.;\n!?]+|,(?![^(]*\))|\b(?:mas|porem|porém)\b|\be(?=\s+(?:nao|não|sem|odeio|detesto|gosto|adoro|prefiro|amo|treino)\b)/i).map(s => s && s.trim()).filter(Boolean);
  const seen = new Set();
  const add = (t, s) => { if (seen.has(t)) return; seen.add(t); o.log.push({t, s}); };
  for (const seg of segs){
    let n = ' ' + deacc(seg).replace(/\s+/g, ' ') + ' '; const neg = NEG_RE.test(n); let hit = false;
    for (const R of OBS_RULES){
      const m = n.match(R.re); if (!m) continue;
      if (R.neg && !neg) continue;
      R.set(o, m); add(typeof R.t === 'function' ? R.t(m) : R.t, R.s); hit = true;
      n = n.replace(m[0], ' ');
    }
    // pratos citados
    for (const [id, re, nm] of DISH_KW){ if (!re.test(n)) continue; hit = true; if (neg){ o.noDish.add(id); add(`Sem ${nm}`); } else { o.likeDish.add(id); add(`Mais ${nm}`); } }
    // alimentos citados
    const found = [];
    for (const [w, keys, orig] of kwIndex()){
      const re = new RegExp(`(^|[^a-z])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=[^a-z]|$)`);
      if (re.test(n)){ found.push([orig, keys]); n = n.replace(re, '$1 '); }
    }
    if (found.length){
      hit = true;
      const isNeg = neg; const isLike = /\b(gosto|adoro|amo|prefiro|curto|quero|inclui\w*|coloca\w*|pode ter|mais)\b/.test(' ' + deacc(seg) + ' ');
      for (const [w, keys] of found){
        if (isNeg) keys.forEach(k => o.no.add(k)); else keys.forEach(k => o.like.add(k));
        add(isNeg ? `Sem ${w}` : `${isLike ? 'Mais' : 'Incluir'} ${w}`);
      }
    }
    if (!hit){ const miss = NOT_IN_DB.find(([re]) => re.test(n)); if (miss){ hit = true; o.missing.push(miss[1]); add(`Fora da lista: ${miss[1]}`, 'Os cardápios usam só alimentos da tabela TACO. Este não está nela, então não entra.'); } }
    if (!hit && seg.length > 2 && !/^(e|tambem|ok|obrigad\w*|so isso|nada|nenhuma?)$/.test(deacc(seg).trim())) o.unk.push(seg);
  }
  return o;
}

/* ---------- metas por refeição ---------- */
function mealKeys(n, skipBf){
  if (skipBf) return n <= 3 ? ['alm', 'lt', 'jan'] : ['alm', 'lt', 'jan', 'ceia'];
  return {3: ['cafe', 'alm', 'jan'], 4: ['cafe', 'alm', 'lt', 'jan'], 5: ['cafe', 'lm', 'alm', 'lt', 'jan'], 6: ['cafe', 'lm', 'alm', 'lt', 'jan', 'ceia']}[n] || ['cafe', 'alm', 'lt', 'jan'];
}
function trainSlots(keys, train, fast){
  const has = k => keys.includes(k);
  if (fast) return {pre: null, pos: keys[0]};
  if (train === 'manha') return {pre: has('cafe') ? 'cafe' : null, pos: has('lm') ? 'lm' : 'alm'};
  if (train === 'tarde') return {pre: 'alm', pos: has('lt') ? 'lt' : 'jan'};
  if (train === 'noite') return {pre: has('lt') ? 'lt' : 'alm', pos: 'jan'};
  return {pre: null, pos: null};
}
/* Horário de treino mais comum nos últimos treinos registrados (pela hora de início) */
function guessTrain(){
  const hs = done().filter(s => s.startedAt).slice(0, 12).map(s => new Date(s.startedAt).getHours()).sort((a, b) => a - b);
  if (hs.length < 3) return null; const h = hs[Math.floor(hs.length / 2)];
  return h < 11 ? 'manha' : h < 17 ? 'tarde' : 'noite';
}
function menuTargets(res, o){
  let p = res.p, c = res.c, f = res.f;
  if (o.hiprot && res.phi > p){ c = Math.max(0, c - (res.phi - p)); p = res.phi; }
  if (o.lowcarb){ const cut = c * .3; c -= cut; f += cut * 4 / 9; }
  return {p, c, f, k: p * 4 + c * 4 + f * 9};
}
function mealTargets(keys, T, ts, o){
  const w = keys.map(k => { const M = MEALS[k]; let kc = M.kc; if (k === 'jan' && o.light) kc *= .7; if (k === 'cafe' && o.bigBf) kc *= 1.3; if (k === 'cafe' && o.smallBf) kc *= .6; if (k === 'alm' && o.lightLunch) kc *= .75; if ((k === 'jan' || k === 'ceia') && o.bigNight) kc *= 1.25; const pre = ts.pre === k, pos = ts.pos === k;
    const cn = (k === 'jan' || k === 'ceia') && o.lowCarbNight ? .35 : 1;
    return {k, P: M.pw * (pos ? 1.1 : 1), C: kc * cn * (pre ? 1.3 : 1) * (pos ? 1.25 : 1), F: kc * (cn < 1 ? 1.3 : 1) * (pre ? .5 : 1) * (pos ? .8 : 1)}; });
  const sum = x => w.reduce((a, b) => a + b[x], 0); const sP = sum('P'), sC = sum('C'), sF = sum('F');
  return Object.fromEntries(w.map(x => { const p = T.p * x.P / sP, c = T.c * x.C / sC, f = T.f * x.F / sF; return [x.k, {p, c, f, k: p * 4 + c * 4 + f * 9}]; }));
}

/* ---------- porções: busca local sobre passos de medida caseira ---------- */
function solveMeal(items, t){
  const adj = items.filter(i => !i.x);
  const err = () => { const s = macOf(items); let e = 4 * ((s.p - t.p) / Math.max(6, t.p * .1)) ** 2 + ((s.c - t.c) / Math.max(10, t.c * .12)) ** 2 + (s.f > t.f ? 4 : 1.2) * ((s.f - t.f) / Math.max(4, t.f * .13)) ** 2 + 2 * ((s.k - t.k) / Math.max(40, t.k * .07)) ** 2;
    for (const i of adj) e += .06 * ((i.g - i.d) / i.d) ** 2; return e; };
  let cur = err();
  for (let it = 0; it < 500; it++){
    let best = null;
    for (const i of adj){ const q = FOODS[i.f].q; for (const m of [1, -1, 3, -3, 8, -8]){ const ng = qnt(i.f, i.g + m * q, i.hi, i.lo); if (ng === i.g) continue; const old = i.g; i.g = ng; const e = err(); i.g = old; if (e < cur - 1e-9 && (!best || e < best.e)) best = {i, g: ng, e}; } }
    if (!best) break; best.i.g = best.g; cur = best.e;
  }
  return items;
}

/* Ajuste fino do dia inteiro: as refeições ficam perto das suas metas, mas o que manda é o total do dia */
function solveDay(meals, T, MT){
  const adj = meals.flatMap(m => m.it.filter(i => !i.x).map(i => ({m, i})));
  const all = () => meals.flatMap(m => m.it);
  const err = () => { const s = macOf(all()); let e = 4 * ((s.p - T.p) / (T.p * .05)) ** 2 + ((s.c - T.c) / (T.c * .06)) ** 2 + (s.f > T.f ? 5 : 1.5) * ((s.f - T.f) / (T.f * .08)) ** 2 + 2 * ((s.k - T.k) / (T.k * .04)) ** 2;
    for (const m of meals){ const t = MT[m.k]; if (!t) continue; const q = macOf(m.it); e += .6 * ((q.k - t.k) / Math.max(60, t.k * .12)) ** 2 + 1.2 * ((q.p - t.p) / Math.max(8, t.p * .15)) ** 2; }
    for (const {i} of adj) e += .04 * ((i.g - i.d) / i.d) ** 2; return e; };
  let cur = err();
  for (let it = 0; it < 400; it++){
    let best = null;
    for (const {i} of adj){ const q = FOODS[i.f].q; for (const mv of [1, -1, 2, -2]){ const ng = qnt(i.f, i.g + mv * q, i.hi, i.lo); if (ng === i.g) continue; const old = i.g; i.g = ng; const e = err(); i.g = old; if (e < cur - 1e-9 && (!best || e < best.e)) best = {i, g: ng, e}; } }
    if (!best) break; best.i.g = best.g; cur = best.e;
  }
}
const slim = m => ({k: m.k, t: m.t, it: m.it.map(i => ({f: i.f, g: i.g, r: i.r, x: i.x, ...(i.nt ? {nt: i.nt} : {})}))});
function fatten(m, cx){ const main = MAIN.includes(m.k); return {...m, it: m.it.map(i => { const hi = capOf(i.f, i.r, main, cx.veg), lo = floorOf(i.f, i.r, main); return {...i, hi, lo, d: qnt(i.f, dflt(i.f, i.r, cx.goal), hi, lo)}; })}; }

/* ---------- escolha dos alimentos ---------- */
function menuCtx(cfg, o, res){
  const fp = cfg.fp || {}; (fp.like || []).forEach(k => FOODS[k] && o.like.add(k)); (fp.no || []).forEach(k => FOODS[k] && o.no.add(k)); const range = cfg.range || 'mid';
  const ex = new Set([...(DIET_EX[o.diet || cfg.diet] || []), ...o.ex]);
  const vg = ['veg', 'vegan'].includes(o.diet || cfg.diet);
  const ok = k => { const F = FOODS[k]; if (o.no.has(k)) return false; if (range === 'basic' && !MN_COMMON.has(k) && !o.like.has(k)) return false; if (o.noFruit && F.r.includes('fruit')) return false; if (o.noCooked && F.r.includes('cooked')) return false; if (!vg && k === 'tofu' && !o.like.has(k)) return false; if (!vg && k === 'sojapo' && !o.like.has(k) && !ex.has('lac')) return false; if (F.tg.some(t => ex.has(t))) return false; if (ex.has('glu') && k === 'aveia') return false; if (ex.has('cafe') && k === 'cafe') return false; return true; };
  const diet = o.diet || cfg.diet; const goal = (ST.prefs.plan || {}).goal || 'maint';
  return {cfg, o, res, ex, ok, diet, goal, range, style: o.prat ? 'prat' : o.style || cfg.style, din: o.din || cfg.din || 'prato', veg: diet === 'veg' || diet === 'vegan'};
}
function weightOf(k, r, cx, used, mealUsed, dayU){
  const F = FOODS[k]; let w = 1;
  if (cx.o.like.has(k)) w *= 3.5;
  if (cx.goal === 'cut'){ if (F.tg.includes('magro')) w *= 1.8; if (r === 'prot' && F.p > 15 && F.f / F.p > .35) w *= .45; /* carnes gordas deixam pouco espaço para proteína no déficit */ if (F.tg.includes('denso')) w *= .6; if (r === 'fruit' && F.k < 50) w *= 1.5; }
  if (cx.goal === 'gain'){ if (F.tg.includes('denso')) w *= 1.8; if (F.tg.includes('magro')) w *= .8; }
  if (cx.style === 'prat' && F.tg.includes('pratico')) w *= 2;
  if (cx.o.budget){ if (F.tg.includes('barato')) w *= 2.4; else if (['salmao', 'camarao', 'nozes', 'amendoa', 'castpara', 'kiwi', 'morango', 'contra', 'maminha'].includes(k)) w *= .3; }
  if (cx.style === 'var') w *= 1;
  if (cx.range === 'wide' && !MN_COMMON.has(k)) w *= 1.9;
  if (cx.range === 'mid' && !MN_COMMON.has(k) && !cx.o.like.has(k)) w *= .7;
  if (k === 'arroz' && cx.style === 'trad') w *= 1.6;
  if ((k === 'tofu' || k === 'sojapo') && !cx.veg && !cx.o.like.has(k)) w *= .12;
  if (k === 'clara' && cx.goal !== 'cut') w *= .4;
  const u = used[k] || 0; w *= Math.pow(['salad', 'cooked', 'drink', 'fat'].includes(r) ? .6 : ['base', 'leg'].includes(r) && cx.style === 'trad' ? .8 : .4, u);
  if (mealUsed.has(k)) w *= .01;
  if (dayU && (r === 'prot' || r === 'bprot' || r === 'fruit')) w *= Math.pow(r === 'fruit' ? .2 : .06, dayU.get(k) || 0);
  return w;
}
function pickW(cands, R){ const tot = cands.reduce((a, b) => a + b[1], 0); if (!tot) return null; let x = R() * tot; for (const [k, w] of cands){ x -= w; if (x <= 0) return k; } return cands[cands.length - 1][0]; }
/* quanto um prato consegue entregar no máximo (kcal), com as porções no limite: evita sugerir um lanche pequeno para uma meta grande */
function tplCap(t, mk, cx){
  let k = 0;
  for (const sl of t.s){
    if (sl.only && !sl.only.includes(mk)) continue; if (sl.vegOnly && !cx.veg) continue; if (sl.cut && cx.goal !== 'cut') continue;
    const pool = slotPool(sl, cx); if (!pool.length) continue;
    const best = Math.max(...pool.map(f => FOODS[f].k * (sl.r === 'drink' || sl.fix ? qnt(f, sl.dg || dflt(f, sl.r, cx.goal), 9999, 0) : capOf(f, sl.r, !!t.main, cx.veg, !!t.dn)) / 100));
    k += best * (sl.n || 1);
  }
  return k;
}
function tplFor(mk, cx, R, used, ts, avoid, tk){
  let L = TPL.filter(t => t.at.includes(mk));
  if (mk === 'jan'){ if (cx.din === 'lanche') L = L.filter(t => t.dn); else if (cx.din !== 'misto') L = L.filter(t => !t.dn); }
  if (MAIN.includes(mk) && !(mk === 'jan' && cx.din === 'lanche')){
    if (cx.style === 'trad') L = L.filter(t => t.dn || t.id === 'pf' || (mk === 'jan' && (t.id === 'leve' || t.id === 'tuber')));
    if (cx.style === 'prat') L = L.filter(t => t.dn || t.id === 'pf' || t.id === 'massa');
    if (cx.ex.has('glu')) L = L.filter(t => t.id !== 'massa');
  } else {
  }
  L = L.filter(t => tplOk(t, mk, cx) && !cx.o.noDish.has(t.id) && !((t.id === 'vit' || t.id === 'mingau') && !cx.veg && !cx.ok('leitepo') && !cx.o.likeDish.has(t.id))); // sem leite em pó, o extrato de soja deixa a vitamina com pouca proteína e muita gordura
  const ws = L.map(t => { let w = 1;
    if (MAIN.includes(mk)){ if (cx.style === 'trad') w = t.id === 'pf' ? (mk === 'alm' ? 1 : 3) : 1; if (cx.style === 'var') w = t.id === 'pf' ? 1.6 : 1; if (mk === 'jan' && (cx.o.light || cx.goal === 'cut') && t.id === 'leve') w *= 2.5; if (t.dn) w = cx.din === 'misto' ? 2.2 : 1; if (t.id === 'sand' && cx.din === 'lanche') w *= 1.5; }
    else { if (mk === 'cafe' && ['paoovo', 'paoqj', 'tap', 'cuscuz'].includes(t.id)) w = 1.8; if (mk === 'ceia' && ['iog', 'ricota', 'mingau'].includes(t.id)) w = 1.6; if (ts.pre === mk) w *= t.pre ? 2 : .35; if (cx.style === 'prat' && ['cuscuz', 'tap', 'panq', 'mingau'].includes(t.id)) w *= .5; }
    if (cx.o.likeDish.has(t.id)) w *= 6;
    if (tk){ const cap = tplCap(t, mk, cx); if (cap < tk) w *= Math.pow(Math.max(.05, cap / tk), 4); }
    w *= Math.pow(cx.o.likeDish.has(t.id) ? .85 : .5, used['tpl:' + t.id] || 0); if (avoid && t.id === avoid) w *= .05; return [t, w]; });
  return pickW(ws, R);
}
function slotPool(sl, cx){ return (sl.from || Object.keys(FOODS).filter(k => FOODS[k].r.includes(sl.r))).filter(k => FOODS[k] && cx.ok(k)); }
function tplOk(t, mk, cx){ return t.s.every(sl => sl.opt || (sl.only && !sl.only.includes(mk)) || (sl.vegOnly && !cx.veg) || (sl.r === 'salad' && cx.o.noSalad) || (sl.r === 'cooked' && cx.o.noCooked) || slotPool(sl, cx).length); }
/* v4.29: reforço de proteína só onde faz sentido no prato (um ovo no prato feito, tofu no vegetariano). Nos lanches, nada de item avulso:
   a proteína do próprio lanche aumenta, e o que faltar o dia compensa nas outras refeições. */
const BOOST = {main: ['ovo', 'tofu']};
function buildMeal(mk, cx, R, used, ts, tgt, avoid, dayU = new Map()){
  const wh = (cx.wm || []).includes(mk); if (wh){ const W = macOf([{f: 'whey', g: 30}]); tgt = {p: Math.max(0, tgt.p - W.p), c: Math.max(0, tgt.c - W.c), f: tgt.f, k: Math.max(0, tgt.k - W.k)}; }
  const done = m => { if (wh) m.it.push({f: 'whey', g: 30, d: 30, r: 'supl', x: 1, hi: 30, lo: 30, nt: 'com água ou no leite'}); return m; };
  const tpl = tplFor(mk, cx, R, used, ts, avoid, tgt.k); if (!tpl) return done({k: mk, t: null, it: []});
  used['tpl:' + tpl.id] = (used['tpl:' + tpl.id] || 0) + 1;
  const items = []; const mu = new Set(); const pre = ts.pre === mk;
  for (const sl of tpl.s){
    if (sl.only && !sl.only.includes(mk)) continue;
    if (sl.vegOnly && !cx.veg) continue;
    if (sl.cut && cx.goal !== 'cut') continue; /* no déficit, claras completam a proteína sem somar gordura */
    if (sl.r === 'fat' && pre && !MAIN.includes(mk)) continue;
    if (sl.r === 'salad' && cx.o.noSalad) continue;
    if (sl.r === 'cooked' && cx.o.noCooked) continue;
    const n = sl.n || 1;
    for (let j = 0; j < n; j++){
      let pool = slotPool(sl, cx);
      if (!pool.length) continue;
      if (pre && sl.r !== 'drink') { const pp = pool.filter(k => !FOODS[k].tg.includes('cast')); if (pp.length) pool = pp; }
      const k = pickW(pool.map(k => [k, weightOf(k, sl.r, cx, used, mu, dayU)]), R); if (!k || mu.has(k)) continue;
      mu.add(k); used[k] = (used[k] || 0) + 1; dayU.set(k, (dayU.get(k) || 0) + 1);
      const fix = (!!sl.fix && !(cx.goal === 'gain' && (sl.r === 'fruit' || k === 'azeite'))) || sl.r === 'drink'; /* no ganho, a fruta e o azeite também podem crescer */
      let hi = capOf(k, sl.r, !!tpl.main, cx.veg, !!tpl.dn), lo = floorOf(k, sl.r, !!tpl.main);
      if (wh){ if (sl.r === 'prot' || sl.r === 'bprot') lo = Math.min(lo, k === 'ovo' ? 45 : FOODS[k].lo); if (sl.r === 'base' || sl.r === 'bcarb') hi = Math.round(hi * 1.3); } // com whey, a comida da refeição pode ter menos proteína e mais carboidrato
      const d = qnt(k, sl.dg || dflt(k, sl.r, cx.goal), hi, lo);
      items.push({f: k, g: d, d, r: sl.r, x: fix ? 1 : 0, hi, lo, ...(sl.nt ? {nt: sl.nt} : {})});
    }
  }
  solveMeal(items, tgt);
  // proteína curta no prato principal: um ovo (ou tofu no vegetariano), como num prato feito com ovo
  if (tpl.main && tpl.id !== 'massa' && macOf(items).p < tgt.p * .82){
    const k = BOOST.main.find(k => FOODS[k] && cx.ok(k) && !mu.has(k) && (k !== 'tofu' || cx.veg) && (dayU.get(k) || 0) < 2);
    if (k){ const r = 'prot'; const hi = Math.min(capOf(k, r, true, cx.veg), k === 'ovo' ? 90 : 150); mu.add(k); used[k] = (used[k] || 0) + 1; dayU.set(k, (dayU.get(k) || 0) + 1); const d = qnt(k, k === 'ovo' ? 45 : 100, hi); items.push({f: k, g: d, d, r, x: 0, hi, nt: k === 'ovo' ? 'cozido ou frito com pouco óleo' : ''}); solveMeal(items, tgt); }
  }
  return done({k: mk, t: tpl.id, it: items});
}
const MN_DAYS = 5;
function genMenu(cfg, res, seed, nDays = MN_DAYS){
  const o = parseMenuObs(cfg.obs); const cx = menuCtx(cfg, o, res); ensureWhey(cfg.whey);
  const keys = mealKeys(o.meals || cfg.n, o.skipBf); const ts = trainSlots(keys, o.train || cfg.train, o.fastTrain); cx.wm = wheyMeals(keys, ts, cfg.whey);
  const T = menuTargets(res, o); const MT = mealTargets(keys, T, ts, o); MN_SCALE = Math.min(1.7, Math.max(1, T.k / 2000)); MN_GAIN = cx.goal === 'gain';
  const R = rng(seed); const used = {}; const days = [];
  for (let d = 0; d < nDays; d++){
    const meals = []; let lunchProt = null; const dayU = new Map();
    for (const mk of keys){
      let m = buildMeal(mk, cx, R, used, ts, MT[mk], null, dayU);
      if (mk === 'jan' && cx.style === 'prat' && lunchProt && lunchProt !== 'ovo' && m.t && TPL.find(t => t.id === m.t).main){ // marmita: mesma proteína do almoço
        const p = m.it.find(i => i.r === 'prot'); if (p && p.f !== lunchProt && cx.ok(lunchProt) && !m.it.some(i => i.f === lunchProt)){ p.f = lunchProt; m = fatten(m, cx); solveMeal(m.it, MT[mk]); }
      }
      if (mk === 'alm'){ const p = m.it.find(i => i.r === 'prot'); lunchProt = p && m.t !== 'massa' ? p.f : null; } // molho do macarrão não vira a proteína da marmita
      meals.push(m);
    }
    solveDay(meals, T, MT); days.push({meals: meals.map(slim)});
  }
  return {days, keys, ts, T: {p: Math.round(T.p), c: Math.round(T.c), f: Math.round(T.f), k: Math.round(T.k)}};
}

/* ---------- estado ---------- */
const menuState = () => ST.prefs.menu || null;
function planRes(){ const pl = ST.prefs.plan; if (!pl) return null; const r = planCalc(planInput(pl)); return r.ok ? r : null; }
function makeMenu(keepSeed){
  const M = ST.prefs.menu; const res = planRes(); if (!M || !res) return false;
  if (!keepSeed) M.seed = Math.floor(Math.random() * 2 ** 31);
  const g = genMenu(M, res, M.seed); M.days = g.days; M.keys = g.keys; M.ts = g.ts; M.T = g.T; M.made = today(); M.day = Math.min(M.day || 0, g.days.length - 1);
  const o = parseMenuObs(M.obs); if (o.meals) M.n = o.meals; if (o.diet) M.diet = o.diet; if (o.train) M.train = o.train; if (o.din) M.din = o.din; if (o.style) M.style = o.style;
  saveState(); return true;
}
/* Re-ajusta só as porções, mantendo os alimentos (quando o plano muda) */
function resolveMenu(){
  const M = ST.prefs.menu; const res = planRes(); if (!M || !M.days || !res) return;
  const o = parseMenuObs(M.obs); const T = menuTargets(res, o); const MT = mealTargets(M.keys, T, M.ts || {}, o); const goal = (ST.prefs.plan || {}).goal; MN_SCALE = Math.min(1.7, Math.max(1, T.k / 2000)); MN_GAIN = goal === 'gain';
  const cx = menuCtx(M, o, res); ensureWhey(M.whey); cx.wm = wheyMeals(M.keys, M.ts || {}, M.whey);
  M.days.forEach(d => { const ms = d.meals.map(m => fatten(m, cx)); ms.forEach(m => { m.it.forEach(i => { if (!i.x) i.g = i.d; }); solveMeal(m.it, MT[m.k]); }); solveDay(ms, T, MT); d.meals = ms.map(slim); });
  M.T = {p: Math.round(T.p), c: Math.round(T.c), f: Math.round(T.f), k: Math.round(T.k)}; saveState();
}

/* ---------- apresentação ---------- */
const frTxt = u => u % 1 ? `${u >= 1 ? Math.floor(u) : ''}½` : String(u);
function amountTxt(f, g, unit){
  const F = FOODS[f];
  if (f === 'whey'){ const d = Math.max(1, Math.round(g / 30)); return {q: `${d} ${d > 1 ? 'doses' : 'dose'}`, sub: `${Math.round(F.p * g / 100)} g de proteína`}; } const gR = g < 20 ? Math.round(g) : Math.round(g / 5) * 5;
  if (f === 'cafe') return {q: unit === 'g' ? `${fmtInt(gR)} ml` : `${frTxt(Math.max(.5, Math.round(g / F.m[0] * 2) / 2))} ${g > F.m[0] ? F.m[2] : F.m[1]}`, sub: MN_NOTE[f]};
  if (unit === 'g' || !F.m) return {q: `${fmtInt(gR)} g`, sub: unit !== 'g' && MN_NOTE[f] ? MN_NOTE[f] : MN_NOTE[f] || ''};
  /* v4.28: colheres e unidades pequenas sempre inteiras; xícara, concha, prato, fatia e unidades grandes aceitam meio */
  const [ug, s, p] = F.m; const whole = ug < 6 || /^colher/.test(s) || ['ovo', 'tapioca', 'torrada', 'castanha', 'noz', 'amêndoa', 'coxa', 'uva'].includes(s); let u = g / ug; u = whole ? Math.max(1, Math.round(u)) : Math.max(.5, Math.round(u * 2) / 2);
  if ((/^colher/.test(s) ? u > 16 : u > 8) && ug >= 6) return {q: `${fmtInt(gR)} g`, sub: MN_NOTE[f] || ''};
  const approx = Math.abs(u * ug - g) / g > .12;
  const num = frTxt(u);
  return {q: `${approx ? '≈ ' : ''}${num} ${u > 1 ? p : s}`, sub: `${fmtInt(gR)} g${MN_NOTE[f] ? ' · ' + MN_NOTE[f] : ''}`};
}
function dayMac(day){ return macOf(day.meals.flatMap(m => m.it)); }
function menuOptInCard(res){
  if (!res) return `<section class="mn-optin"><div class="eyebrow">Cardápios sugeridos</div><h3>Ideias de refeição para as suas metas</h3><p>Primeiro calcule suas calorias e proteína no assistente acima. Os cardápios são montados em cima desses números.</p><button class="btn primary sm" data-act="plan-open">Calcular minhas metas</button></section>`;
  return `<section class="mn-optin"><div class="eyebrow">Cardápios sugeridos · opcional</div><h3>Quer ideias de cardápio para ${fmtK(res.kcal)} kcal?</h3><p>O app monta cinco dias completos, com todas as refeições, porções em gramas ou medidas caseiras e trocas equivalentes. Você escolhe o estilo e conta o que gosta e o que evita.</p>
    <div class="mn-ex" aria-hidden="true"><span>Café da manhã</span><span>Almoço</span><span>Lanche</span><span>Jantar</span></div>
    <button class="btn primary" data-act="mn-setup">Montar meus cardápios</button></section>`;
}
function menuView(){
  const M = menuState(); const res = planRes(); if (M) ensureWhey(M.whey);
  if (!M || !M.on || !M.days || !res) return menuOptInCard(res);
  const o = parseMenuObs(M.obs); const unit = M.unit || 'cas'; const di = Math.min(M.day || 0, M.days.length - 1); const day = M.days[di]; const ts = M.ts || {};
  const T = menuTargets(res, o); const changed = Math.abs(T.k - (M.T ? M.T.k : 0)) > 40 || Math.abs(T.p - (M.T ? M.T.p : 0)) > 5;
  const s = dayMac(day); const pct = (v, t) => Math.max(0, Math.min(100, v / (t || 1) * 100)).toFixed(0);
  const cfgTxt = [`${M.keys.length} refeições`, (MN_STYLES.find(x => x[0] === (o.prat ? 'prat' : o.style || M.style)) || [])[1], (o.din || M.din) === 'lanche' ? 'jantar tipo lanche' : (o.din || M.din) === 'misto' ? 'jantar alterna' : null, (MN_DIETS.find(x => x[0] === (o.diet || M.diet)) || [])[1], M.train && M.train !== 'none' ? `treino ${({manha: 'de manhã', tarde: 'à tarde', noite: 'à noite'})[o.train || M.train]}` : null, M.whey && M.whey.doses ? 'com whey' : null].filter(Boolean).join(' · ');
  const shortP = s.p < M.T.p * .9;
  const upd = changed ? `<button class="mn-upd" data-act="mn-resolve">${I.info}<span><b>Seu plano mudou.</b> Ajustar as porções para ${fmtK(T.k)} kcal</span>${I.chev}</button>` : '';
  if (!UI.mnOpen){ /* minimizado: um resumo, e o toque abre tudo */
    const names = day.meals.map(m => MEALS[m.k].t.replace(' da manhã', '').replace(' da tarde', '').replace('Lanche', 'Lanche'));
    return `<section class="mn-card mn-mini"><button class="mn-mini-b" data-act="mn-toggle" aria-expanded="false"><div class="row between"><span class="eyebrow">Cardápios sugeridos</span>${I.down}</div>
      <h3>${M.days.length} cardápios prontos</h3><p>${esc(cfgTxt)}</p>
      <div class="mn-mini-m">${names.map(n => `<span>${esc(n)}</span>`).join('')}</div>
      <div class="mn-mini-f"><span class="mono">~${fmtK(M.T.k)} kcal · ${M.T.p} g de proteína por dia</span><b>Ver cardápios</b></div></button>${upd}</section>`;
  }
  let h = `<section class="mn-card"><div class="row between"><button class="mn-min" data-act="mn-toggle" aria-expanded="true"><span class="eyebrow">Cardápios sugeridos</span>${I.down}</button><div class="seg mini mn-unit" role="group" aria-label="Unidade das porções"><button data-act="mn-unit" data-v="cas" aria-pressed="${unit === 'cas'}">Medidas</button><button data-act="mn-unit" data-v="g" aria-pressed="${unit === 'g'}">Gramas</button></div></div>
    <button class="mn-cfg" data-act="mn-setup"><span class="grow">${esc(cfgTxt)}${o.log.length ? `<em>${o.log.length} ${o.log.length === 1 ? 'preferência' : 'preferências'}</em>` : ''}</span>${I.edit}</button>
    ${upd}
    <div class="mn-dh"><span class="eyebrow">Cardápio</span><div class="seg mn-days" role="tablist" aria-label="Cardápio">${M.days.map((_, j) => `<button role="tab" data-act="mn-day" data-v="${j}" aria-pressed="${j === di}" aria-label="Cardápio ${j + 1}">${j + 1}</button>`).join('')}</div></div>
    <div class="mn-tot"><div class="mn-k"><b class="mono">${fmtK(s.k)}</b><span>de ${fmtK(M.T.k)} kcal</span></div>
      <div class="mn-bars">${[['Proteína', s.p, M.T.p, 'var(--c1)'], ['Carbo', s.c, M.T.c, 'var(--c2)'], ['Gordura', s.f, M.T.f, 'var(--c0)']].map(([n, v, t, c]) => `<div style="--mc:${c}"><span>${n}</span><i><u style="width:${pct(v, t)}%"></u></i><b class="mono">${Math.round(v)}<small>/${t} g</small></b></div>`).join('')}</div></div>
    ${shortP ? `<p class="mn-warn">${o.diet === 'vegan' || M.diet === 'vegan' ? 'Com alimentos veganos da tabela, a proteína ficou abaixo da meta. Mais leguminosas e tofu ajudam; uma proteína vegetal em pó pode completar. Vale conversar com um nutricionista.' : 'A proteína ficou abaixo da meta com estas restrições. Mais uma refeição por dia ajuda a distribuir.'}</p>` : ''}
    <div class="mn-meals">`;
  day.meals.forEach((m, mi) => {
    const ms = macOf(m.it); const tag = ts.pre === m.k ? 'Pré-treino' : ts.pos === m.k ? 'Pós-treino' : ''; const tp = TPL.find(t => t.id === m.t);
    h += `<article class="mn-meal"><header><div><b>${MEALS[m.k].t}</b>${tag ? `<span class="mn-tag">${tag}</span>` : ''}${m.k === 'alm' && o.lunchOut ? '<span class="mn-tag out">Fora de casa</span>' : ''}${dishName(m) ? `<span class="mn-lbl mn-dish">${esc(dishName(m))}</span>` : ''}</div><span class="mono">${fmtK(ms.k)} kcal · ${Math.round(ms.p)} g prot.</span></header>
      <ul>${m.it.map((it, ii) => { const a = amountTxt(it.f, it.g, unit); if (it.nt) a.sub = [a.sub, it.nt].filter(Boolean).join(' · '); const wh = it.f === 'whey'; return `<li><button data-act="${wh ? 'mn-setup' : 'mn-swap'}" data-m="${mi}" data-i="${ii}" aria-label="${wh ? 'Ajustar whey' : 'Trocar ' + esc(FOODS[it.f].n)}"><span class="mn-q">${esc(a.q)}</span><span class="mn-n">${esc(FOODS[it.f].n)}${a.sub ? `<small>${esc(a.sub)}</small>` : ''}</span>${wh ? '' : `<i class="mn-sw">${I.swap}</i>`}</button></li>`; }).join('')}</ul>
      <button class="link mn-other" data-act="mn-other" data-m="${mi}">${I.swap}Outra opção</button></article>`;
  });
  h += `</div><div class="row wrap mn-acts"><button class="btn ghost sm" data-act="mn-redo">Refazer todos</button><button class="btn ghost sm" data-act="mn-toggle">Minimizar</button></div>
    <p class="mn-disc">Sugestões para inspirar, não uma dieta prescrita. Para um plano preciso e seguro para você, procure um nutricionista.</p>
    <p class="mn-src">Composição: TACO 4ª ed. (NEPA/UNICAMP). Medidas caseiras: POF 2008-2009 (IBGE), em colheres, xícaras, conchas, prato raso e unidades.</p></section>`;
  return h;
}

/* ---------- dicas com base científica (sempre visíveis) ---------- */
function nutriTips(){
  const pl = ST.prefs.plan; const res = planRes(); const lw = lastWeight(); const kg = lw ? lw.kg : null; const goal = pl ? pl.goal : null; const o = parseMenuObs((ST.prefs.menu || {}).obs);
  const T = []; const n1 = v => fmtN(Math.round(v));
  T.push({ic: 'p', t: 'Proteína do dia', b: `Cerca de 1,6 g por kg por dia capta quase todo o ganho de massa com o treino; ir até 2,2 g/kg não atrapalha.${res ? ` Sua meta: ${res.p} g.` : kg ? ` Para você: ${n1(kg * 1.6)} a ${n1(kg * 2.2)} g.` : ''}`, r: 'Morton et al., Br J Sports Med, 2018'});
  T.push({ic: 'd', t: 'Divida a proteína', b: `Para hipertrofia, cerca de 0,4 g/kg por refeição em pelo menos 4 refeições.${kg ? ` Para você: uns ${n1(kg * 0.4)} g em cada.` : ''}`, r: 'Schoenfeld & Aragon, J Int Soc Sports Nutr, 2018'});
  if (goal === 'cut') T.push({ic: 'w', t: 'Ritmo de perda', b: 'Perder de 0,5% a 1% do peso por semana ajuda a preservar músculo. Mais rápido que isso, a perda de massa magra tende a aumentar.', r: 'Helms et al., J Int Soc Sports Nutr, 2014'});
  if (goal === 'gain') T.push({ic: 'w', t: 'Ritmo de ganho', b: 'Ganhar de 0,25% a 0,5% do peso por semana costuma bastar. Superávit maior soma mais gordura do que músculo.', r: 'Iraki et al., Sports, 2019'});
  T.push({ic: 'f', t: 'Fibras, frutas e vegetais', b: 'Pelo menos 25 g de fibras por dia, vindas da comida, e 400 g de frutas, verduras e legumes. Os cardápios já puxam nessa direção.', r: 'OMS, diretriz sobre carboidratos, 2023'});
  T.push({ic: 'g', t: 'Comida de verdade como base', b: 'Prefira alimentos in natura ou minimamente processados, e deixe ultraprocessados como exceção.', r: 'Guia Alimentar para a População Brasileira, Ministério da Saúde, 2014'});
  if (o.lowcarb) T.push({ic: 'c', t: 'Menos carboidrato', b: 'Com as mesmas calorias e a mesma proteína, cortar carboidrato não faz perder mais gordura. Vale pelo gosto e pela saciedade de cada um.', r: 'Hall & Guo, Gastroenterology, 2017'});
  T.push({ic: 'c', t: 'Creatina', b: 'O suplemento com mais evidência para força e massa. Depois de saturar, 3 a 5 g por dia mantêm os estoques, e é segura em adultos saudáveis.', r: 'Kreider et al., J Int Soc Sports Nutr, 2017'});
  T.push({ic: 'k', t: 'Cafeína antes do treino', b: `Doses de 3 a 6 mg por kg, em geral 60 min antes, melhoram o desempenho.${kg ? ` Para você: ${n1(kg * 3)} a ${n1(kg * 6)} mg (uma xícara de café passado tem bem menos que isso).` : ''} Evite à noite para não atrapalhar o sono.`, r: 'Guest et al., J Int Soc Sports Nutr, 2021'});
  return T;
}
function tipsView(){
  const T = nutriTips(); const all = UI.tipsAll; const L = all ? T : T.slice(0, 3);
  return `<section class="tips"><div class="sec-head"><span class="eyebrow">Dicas com base científica</span><span class="tiny muted">${T.length} dicas</span></div>
    <div class="tips-l">${L.map(x => `<article class="tip"><b>${esc(x.t)}</b><p>${esc(x.b)}</p><cite>${esc(x.r)}</cite></article>`).join('')}</div>
    ${T.length > 3 ? `<button class="link" data-act="tips-all">${all ? 'Mostrar menos' : `Ver as ${T.length}`}</button>` : ''}</section>`;
}
function nutritionTab(){
  const lead = '<p class="small ink2" style="margin:14px 4px 12px">Calorias e macros para o seu objetivo, ideias de cardápio e dicas com base científica.</p>';
  /* sem plano: o assistente vem primeiro (o cardápio depende dele). Com plano: o cardápio no topo e o plano em versão compacta. */
  if (!planRes()) return `${lead}${planSummaryRow(ST.prefs.plan ? 'body' : 'tab')}<section style="margin-top:14px">${menuView()}</section>${tipsView()}`;
  return `${lead}<section style="margin-top:0">${menuView()}</section><section style="margin-top:14px">${planSummaryRow('profile')}</section>${tipsView()}`;
}

/* ---------- folha de configuração ---------- */
const MN_OBS_EX = ['adoro pão com ovo', 'costumo comer cuscuz', 'jantar tipo lanche', 'sem lactose', 'não gosto de peixe', 'levo marmita', 'orçamento apertado', 'como fora no almoço'];
const MN_HELP = [
  ['Restrições', ['sem lactose', 'sem glúten', 'alergia a amendoim', 'sem frutos do mar', 'vegetariano', 'vegano', 'sem carne vermelha', 'sem porco', 'halal']],
  ['Gostos', ['adoro ovos', 'não gosto de peixe', 'odeio brócolis', 'prefiro arroz integral', 'sem frutas', 'não gosto de salada']],
  ['Rotina', ['treino às 19h', 'treino em jejum', 'não tomo café da manhã', 'como fora no almoço', '5 refeições']],
  ['Jeito de comer', ['jantar tipo lanche', 'às vezes lanche no jantar', 'jantar leve', 'almoço leve', 'café da manhã reforçado', 'sem fome de manhã', 'fome à noite', 'sem carboidrato à noite', 'menos carboidrato', 'mais proteína']],
  ['Praticidade e bolso', ['levo marmita', 'não gosto de cozinhar', 'orçamento apertado', 'comida caseira', 'gosto de variar']],
  ['Saúde', ['diabetes', 'pressão alta', 'gestante']]
];
function obsPreview(text){
  const o = parseMenuObs(text); if (!String(text || '').trim()) return '<p class="tiny muted" style="margin:0">Escreva do seu jeito: restrições, gostos, rotina ou orçamento.</p>';
  return `${o.log.length ? `<div class="mn-got"><span class="tiny muted">Entendi:</span>${o.log.map(x => `<span class="mn-chip" title="${esc(x.s || '')}">${I.check}${esc(x.t)}</span>`).join('')}</div>` : ''}
    ${o.log.filter(x => x.s).map(x => `<p class="tiny ink2" style="margin:6px 0 0">${esc(x.s)}</p>`).join('')}
    ${o.unk.length ? `<p class="tiny mn-unk">Não entendi: ${o.unk.map(u => `"${esc(u)}"`).join(', ')}.</p>` : ''}`;
}
function openMenuSetup(){
  const M = ST.prefs.menu || {}; const pl = ST.prefs.plan || {}; const g = guessTrain();
  const c = UI.mnc = {whey: {...WHEY0, doses: M.whey && M.whey.doses ? 1 : 0}, n: M.n || pl.meals || 4, style: M.style || 'trad', diet: M.diet || 'oni', din: M.din || 'prato', train: M.train || g || 'none', obs: M.obs || '', range: M.range || 'mid', fp: {like: [...((M.fp || {}).like || [])], no: [...((M.fp || {}).no || [])]}};
  const chips = (act, opts, cur) => `<div class="pw-chips">${opts.map(([v, l]) => `<button data-act="${act}" data-v="${v}" aria-pressed="${String(cur) === String(v)}">${l}</button>`).join('')}</div>`;
  openSheet(`${sheetHead('Cardápios', M.on ? 'Ajustar cardápios' : 'Montar cardápios')}
    <div class="stack" style="margin-top:14px;gap:16px">
    <div class="pw-f"><span class="pw-l">Refeições por dia</span>${chips('mnc-n', [3, 4, 5, 6].map(n => [n, n]), c.n)}</div>
    <div class="pw-f"><span class="pw-l">Estilo</span><div class="stack" style="gap:8px" id="mnc-style">${MN_STYLES.map(([v, t, s]) => `<button class="choice" data-act="mnc-style" data-v="${v}" aria-pressed="${c.style === v}"><span class="grow"><b>${t}</b><span>${s}</span></span><i class="tick">${I.check}</i></button>`).join('')}</div></div>
    <div class="pw-f"><span class="pw-l">Alimentação</span>${chips('mnc-diet', MN_DIETS, c.diet)}</div>
    <div class="pw-f"><span class="pw-l">Jantar</span>${chips('mnc-din', [['prato', 'Prato de comida'], ['lanche', 'Lanche'], ['misto', 'Alternar']], c.din)}<span class="tiny muted">Lanche: sanduíche, tapioca, omelete ou cuscuz no lugar de arroz e feijão.</span></div>
    <div class="pw-f"><span class="pw-l">Horário do treino ${g ? '<small>(sugerido pelo seu histórico)</small>' : ''}</span>${chips('mnc-train', MN_TRAIN, c.train)}<span class="tiny muted">O lanche antes do treino ganha carboidrato e menos gordura; o depois, proteína.</span></div>
    <div class="pw-f"><span class="pw-l">Toma whey protein?</span><div class="seg">${[[0, 'Não'], [1, 'Sim']].map(([v, t]) => `<button data-act="mnc-whey" data-v="${v}" aria-pressed="${c.whey.doses === v}">${t}</button>`).join('')}</div>
      <p class="tiny muted" id="mn-whey" style="margin:6px 0 0" ${c.whey.doses ? '' : 'hidden'}>1 dose por dia, depois do treino. A meta do dia já desconta.</p></div>
    <div class="pw-f"><span class="pw-l">Que alimentos usar</span><div class="seg">${MN_RANGE.map(([v, t]) => `<button data-act="mnc-range" data-v="${v}" aria-pressed="${c.range === v}">${t}</button>`).join('')}</div></div>
    <div class="pw-f"><span class="pw-l">Seus alimentos <small id="mnc-fp-n">${mnFpTxt(c.fp)}</small></span>
      <p class="tiny muted" style="margin:0 0 6px">1 toque: <b class="fp-lk">gosto</b> · 2 toques: <b class="fp-no">não como</b></p>
      ${MN_GROUPS.map(([t, rs], gi) => { const ks = Object.keys(FOODS).filter(k => FOODS[k].r.some(r => rs.includes(r))); return `<details class="fp-g"><summary>${t} <span class="tiny muted">${ks.length}</span>${I.down}</summary><div class="fp-l">${ks.map(k => { const st = c.fp.like.includes(k) ? 'like' : c.fp.no.includes(k) ? 'no' : ''; return `<button class="fp-c" data-act="mnc-fp" data-k="${k}" data-s="${st}" aria-label="${esc(FOODS[k].n)}">${esc(FOODS[k].n)}</button>`; }).join('')}</div></details>`; }).join('')}</div>
    <div class="pw-f"><span class="pw-l">Preferências e ajustes <small>o que gosta, costuma comer ou evita</small></span>
      <div class="adj-box mn-ai">${I_SPARK}<textarea id="mn-obs" class="adj-ta" rows="2" maxlength="500" placeholder="Ex.: adoro pão com ovo, costumo almoçar arroz e feijão, sem lactose" aria-label="Preferências e ajustes">${esc(c.obs)}</textarea></div>
      <div class="adj-chips" role="group" aria-label="Sugestões">${MN_OBS_EX.map(x => `<button data-act="mnc-ex" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</div>
      <div id="mn-obs-prev" class="mn-prev">${obsPreview(c.obs)}</div>
      <details class="mn-help"><summary>Mais exemplos ${I.down}</summary>${MN_HELP.map(([t, L]) => `<div class="mn-hg"><b>${t}</b><div class="ob-ex">${L.map(x => `<button class="chip" data-act="mnc-ex" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</div></div>`).join('')}</details>
</div>
    </div>
    <div class="sheet-foot"><button class="btn primary block" data-act="mn-create">${M.on ? 'Atualizar cardápios' : 'Criar cardápios'}</button>${M.on ? '<button class="link muted" style="width:100%;margin-top:4px" data-act="mn-off">Desligar sugestões de cardápio</button>' : ''}</div>`);
}
function mnFpTxt(fp){ const a = fp.like.length, b = fp.no.length; return a || b ? `${a ? a + ' gosto' : ''}${a && b ? ' · ' : ''}${b ? b + ' não como' : ''}` : ''; }
function mnKeepObs(){ const t = $('#mn-obs'); if (t && UI.mnc) UI.mnc.obs = t.value; }
function mnPress(act, v){ document.querySelectorAll(`[data-act="${act}"]`).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === String(v)))); }
A['mn-setup'] = () => openMenuSetup();
A['mnc-n'] = el => { UI.mnc.n = +el.dataset.v; mnPress('mnc-n', el.dataset.v); };
A['mnc-style'] = el => { UI.mnc.style = el.dataset.v; mnPress('mnc-style', el.dataset.v); };
A['mnc-diet'] = el => { UI.mnc.diet = el.dataset.v; mnPress('mnc-diet', el.dataset.v); };
A['mnc-din'] = el => { UI.mnc.din = el.dataset.v; mnPress('mnc-din', el.dataset.v); };
A['mnc-train'] = el => { UI.mnc.train = el.dataset.v; mnPress('mnc-train', el.dataset.v); };
A['mnc-whey'] = el => { UI.mnc.whey.doses = +el.dataset.v; mnPress('mnc-whey', el.dataset.v); const b = $('#mn-whey'); if (b) b.hidden = !UI.mnc.whey.doses; };
A['mnc-range'] = el => { UI.mnc.range = el.dataset.v; mnPress('mnc-range', el.dataset.v); };
A['mnc-fp'] = el => { const k = el.dataset.k; const fp = UI.mnc.fp; const st = el.dataset.s || ''; const nx = st === '' ? 'like' : st === 'like' ? 'no' : '';
  fp.like = fp.like.filter(x => x !== k); fp.no = fp.no.filter(x => x !== k); if (nx === 'like') fp.like.push(k); if (nx === 'no') fp.no.push(k);
  el.dataset.s = nx; const n = $('#mnc-fp-n'); if (n) n.textContent = mnFpTxt(fp); Platform.haptic('light'); };
A['mnc-ex'] = el => { const t = $('#mn-obs'); if (!t) return; const v = t.value.trim(); t.value = v ? `${v.replace(/[,;.]\s*$/, '')}, ${el.dataset.v}` : el.dataset.v; mnKeepObs(); $('#mn-obs-prev').innerHTML = obsPreview(t.value); };
A['mn-create'] = () => {
  mnKeepObs(); const c = UI.mnc; const old = ST.prefs.menu || {};
  const o = parseMenuObs(c.obs);
  ST.prefs.menu = {...old, on: true, n: o.meals || c.n, style: o.style || c.style, diet: o.diet || c.diet, din: o.din || c.din, train: o.train || c.train, obs: c.obs.trim().slice(0, 500), unit: old.unit || 'cas', day: 0, range: c.range, fp: {like: c.fp.like.slice(), no: c.fp.no.slice()}, whey: {...c.whey}};
  if (!makeMenu(false)){ toast('Calcule suas metas primeiro.'); return; }
  UI.mnOpen = true; closeSheet(); render(); Platform.haptic('success'); toast('Cardápios prontos');
};
A['mn-off'] = () => { const M = ST.prefs.menu; if (M){ M.on = false; delete M.days; } saveState(); closeSheet(); render(); toast('Sugestões de cardápio desligadas'); };
A['mn-unit'] = el => { ST.prefs.menu.unit = el.dataset.v; saveState(); render(); };
A['mn-day'] = el => { ST.prefs.menu.day = +el.dataset.v; saveState(); render(); };
A['mn-redo'] = () => { makeMenu(false); render(); toast('Cardápios novos'); };
A['mn-resolve'] = () => { resolveMenu(); render(); toast('Porções ajustadas ao plano'); };
A['mn-toggle'] = () => { const was = UI.mnOpen; UI.mnOpen = !UI.mnOpen; render(); if (was){ const c = $('.mn-card'); if (c && c.getBoundingClientRect().top < 0) c.scrollIntoView({block: 'start'}); } };
A['tips-all'] = () => { UI.tipsAll = !UI.tipsAll; render(); };
A['mn-other'] = el => {
  const M = ST.prefs.menu; const res = planRes(); if (!M || !res) return; const di = M.day || 0; const mi = +el.dataset.m; const old = M.days[di].meals[mi];
  const o = parseMenuObs(M.obs); const cx = menuCtx(M, o, res); const T = menuTargets(res, o); const MT = mealTargets(M.keys, T, M.ts || {}, o); ensureWhey(M.whey); cx.wm = wheyMeals(M.keys, M.ts || {}, M.whey); MN_SCALE = Math.min(1.7, Math.max(1, T.k / 2000)); MN_GAIN = cx.goal === 'gain';
  const used = {}; M.days.forEach(d => d.meals.forEach(m => m.it.forEach(i => { used[i.f] = (used[i.f] || 0) + 1; }))); old.it.forEach(i => { used[i.f] = (used[i.f] || 0) + 3; });
  const dayU = new Map(); M.days[di].meals.forEach((m, j) => { if (j !== mi) m.it.forEach(i => dayU.set(i.f, (dayU.get(i.f) || 0) + 1)); });
  M.days[di].meals[mi] = slim(buildMeal(old.k, cx, rng(Math.floor(Math.random() * 2 ** 31)), used, M.ts || {}, MT[old.k], old.t, dayU));
  saveState(); render(); Platform.haptic('light');
};
/* Troca equivalente: mantém o que aquele alimento entrega (proteína, carboidrato, gordura ou calorias) */
function swapGrams(from, to, g, r){
  const A0 = FOODS[from], B = FOODS[to]; const lv = LEVER[r] || 'k';
  const hi = capOf(to, r, ['base', 'prot', 'leg', 'salad', 'cooked'].includes(r), true);
  if (lv === 'd') return Math.min(dflt(to, r, (ST.prefs.plan || {}).goal), hi);
  const key = lv === 'p' ? 'p' : lv === 'c' ? 'c' : lv === 'f' ? 'f' : 'k'; const a = A0[key], b = B[key];
  if (!a || !b || a / b > 6) return qnt(to, g * A0.k / (B.k || 1), hi);
  return qnt(to, g * a / b, hi);
}
A['mn-swap'] = el => {
  const M = ST.prefs.menu; const res = planRes(); if (!M) return; const di = M.day || 0; const mi = +el.dataset.m, ii = +el.dataset.i; const meal = M.days[di].meals[mi]; const it = meal.it[ii];
  const o = parseMenuObs(M.obs); const cx = menuCtx(M, o, res || {}); const unit = M.unit || 'cas'; const lv = LEVER[it.r] || 'k';
  const inMeal = new Set(meal.it.map(x => x.f));
  /* v4.29: a troca fica dentro do prato (no pão com queijo, outro queijo; no prato feito, outra mistura) */
  const tp = TPL.find(t => t.id === meal.t); const sl = tp && tp.s.find(x => x.r === it.r && (!x.from || x.from.includes(it.f)));
  const allowed = sl && sl.from && !tp.main ? new Set(sl.from) : null;
  const cands = Object.keys(FOODS).filter(k => k !== it.f && !inMeal.has(k) && FOODS[k].r.includes(it.r) && cx.ok(k) && (!allowed || allowed.has(k))).map(k => { const g = swapGrams(it.f, k, it.g, it.r); const m = macOf([{f: k, g}]); return {k, g, m}; });
  const cur = macOf([it]); cands.sort((x, y) => (cx.o.like.has(y.k) - cx.o.like.has(x.k)) || Math.abs(x.m.k - cur.k) - Math.abs(y.m.k - cur.k)); const what = {p: 'a mesma proteína', c: 'o mesmo carboidrato', f: 'a mesma gordura', k: 'as mesmas calorias', d: 'uma porção equivalente'}[lv];
  UI.sheet = {kind: 'mnswap', di, mi, ii};
  const a0 = amountTxt(it.f, it.g, unit);
  UI.sheet.cands = cands.slice(0, 1).map(c => c.k);
  /* v4.29: também dá para trocar o prato inteiro, escolhendo entre outros pratos que cabem na refeição */
  const alts = res ? mealAlts(M, di, mi, 3) : []; UI.sheet.alts = alts;
  openSheet(`${sheetHead(MEALS[meal.k].t, 'Trocar ' + FOODS[it.f].n.toLowerCase())}
    <p class="small ink2" style="margin:8px 0 0">Agora: <b>${esc(a0.q)}</b>${a0.sub ? ` (${esc(a0.sub)})` : ''}, ${fmtK(cur.k)} kcal.</p>
    ${cands.length ? `<div class="eyebrow" style="margin-top:16px">Trocar só este item</div><p class="tiny muted" style="margin:2px 0 0">Com ${what}.</p>` : ''}
    <div class="mn-swl">${cands.length ? cands.map((c, ci) => { const more = ci === 5 ? `<details class="mn-more"><summary>Mais ${cands.length - 5} opções</summary><div class="mn-swl">` : ''; const a = amountTxt(c.k, c.g, unit); const dk = Math.round(c.m.k - cur.k); return `<button class="mn-swi" data-act="mn-swap-do" data-f="${c.k}" data-g="${c.g}"><span class="grow"><b>${esc(FOODS[c.k].n)}</b><span>${esc(a.q)}${a.sub ? ` · ${esc(a.sub)}` : ''}</span></span><em class="mono ${Math.abs(dk) < 25 ? '' : dk > 0 ? 'up' : 'dn'}">${dk === 0 ? '=' : (dk > 0 ? '+' : '−') + Math.abs(dk)} kcal</em></button>`.replace(/^/, more); }).join('') + (cands.length > 5 ? '</div></details>' : '') : ''}</div>
    ${alts.length ? `<div class="eyebrow" style="margin-top:18px">${cands.length ? 'Ou trocar o prato' : 'Trocar o prato'}</div><div class="mn-swl">${alts.map((m, x) => { const q = macOf(m.it); return `<button class="mn-swi" data-act="mn-dish-do" data-x="${x}"><span class="grow"><b>${esc(dishName(m) || MEALS[m.k].t)}</b><span>${esc(m.it.map(i => kw0(i.f)).slice(0, 4).join(', '))}</span></span><em class="mono">${fmtK(q.k)} kcal</em></button>`; }).join('')}</div>` : ''}
    <button class="btn ghost block mn-dis" data-act="mn-dislike">${I.swap}Não gosto, trocar por outro</button>
    <p class="tiny muted" style="margin:6px 2px 0;text-align:center">O app escolhe a troca e não sugere mais ${esc(FOODS[it.f].n.toLowerCase())}.</p>`);
};
function mealAlts(M, di, mi, n){
  const res = planRes(); const old = M.days[di].meals[mi]; const o = parseMenuObs(M.obs); const cx = menuCtx(M, o, res); const T = menuTargets(res, o); const MT = mealTargets(M.keys, T, M.ts || {}, o); ensureWhey(M.whey); cx.wm = wheyMeals(M.keys, M.ts || {}, M.whey); MN_SCALE = Math.min(1.7, Math.max(1, T.k / 2000)); MN_GAIN = cx.goal === 'gain'; cx.wm = wheyMeals(M.keys, M.ts || {}, M.whey);
  const used = {}; M.days.forEach(d => d.meals.forEach(m => m.it.forEach(i => { used[i.f] = (used[i.f] || 0) + 1; })));
  const out = []; const seen = new Set([old.t]); const names = new Set([dishName(old)]);
  for (let t = 0; t < 16 && out.length < n; t++){
    const dayU = new Map(); M.days[di].meals.forEach((m, j) => { if (j !== mi) m.it.forEach(i => dayU.set(i.f, (dayU.get(i.f) || 0) + 1)); });
    const u = {...used}; [...seen].forEach(id => { u['tpl:' + id] = (u['tpl:' + id] || 0) + 3; }); old.it.forEach(i => { u[i.f] = (u[i.f] || 0) + 3; }); // prefere pratos e alimentos diferentes do atual
    const m = slim(buildMeal(old.k, cx, rng(Math.floor(Math.random() * 2 ** 31)), u, M.ts || {}, MT[old.k], null, dayU)); const nm = dishName(m);
    if (!m.t || !nm || names.has(nm)) continue; names.add(nm); seen.add(m.t); out.push(m);
  }
  return out;
}
A['mn-dish-do'] = el => { const s = UI.sheet; const M = ST.prefs.menu; if (!s || s.kind !== 'mnswap' || !M || !s.alts) return; const m = s.alts[+el.dataset.x]; if (!m) return; M.days[s.di].meals[s.mi] = m; saveState(); closeSheet(); render(); Platform.haptic('light'); };
/* "não gosto": o alimento sai de todos os cardápios e entra a melhor troca equivalente em cada lugar */
A['mn-dislike'] = () => {
  const s = UI.sheet; const M = ST.prefs.menu; if (!s || s.kind !== 'mnswap' || !M) return; const k = M.days[s.di].meals[s.mi].it[s.ii].f;
  M.fp = M.fp || {like: [], no: []}; M.fp.like = (M.fp.like || []).filter(x => x !== k); if (!(M.fp.no || []).includes(k)) M.fp.no = [...(M.fp.no || []), k];
  /* as refeições com esse alimento são remontadas: entra outro prato que combine, sem ele */
  const res = planRes(); if (!res) return; const o = parseMenuObs(M.obs); const cx = menuCtx(M, o, res); const T = menuTargets(res, o); const MT = mealTargets(M.keys, T, M.ts || {}, o); ensureWhey(M.whey); cx.wm = wheyMeals(M.keys, M.ts || {}, M.whey); MN_SCALE = Math.min(1.7, Math.max(1, T.k / 2000)); MN_GAIN = cx.goal === 'gain'; let n = 0;
  const used = {}; M.days.forEach(d => d.meals.forEach(m => m.it.forEach(i => { used[i.f] = (used[i.f] || 0) + 1; })));
  M.days.forEach(d => { const dayU = new Map(); d.meals.forEach(m => m.it.forEach(i => dayU.set(i.f, (dayU.get(i.f) || 0) + 1)));
    d.meals = d.meals.map(m => { if (!m.it.some(i => i.f === k)) return m; n++; m.it.forEach(i => dayU.set(i.f, Math.max(0, (dayU.get(i.f) || 1) - 1)));
      return slim(buildMeal(m.k, cx, rng(Math.floor(Math.random() * 2 ** 31)), used, M.ts || {}, MT[m.k], null, dayU)); }); });
  saveState(); closeSheet(); render(); Platform.haptic('success'); toast(`${FOODS[k].n} trocado em ${n} ${n === 1 ? 'refeição' : 'refeições'}. Não aparece mais.`);
};
A['mn-swap-do'] = el => {
  const s = UI.sheet; const M = ST.prefs.menu; if (!s || s.kind !== 'mnswap' || !M) return;
  const it = M.days[s.di].meals[s.mi].it[s.ii]; it.f = el.dataset.f; it.g = +el.dataset.g;
  saveState(); closeSheet(); render(); Platform.haptic('light');
};
document.addEventListener('input', ev => { const t = ev.target; if (t && t.id === 'mn-obs'){ if (UI.mnc) UI.mnc.obs = t.value; const p = $('#mn-obs-prev'); if (p) p.innerHTML = obsPreview(t.value); } });
A['plan-weigh-go'] = () => { UI.bodyTab = 'nutricao'; goTab('corpo'); };
