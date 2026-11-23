"""v4.28: padroniza as medidas caseiras dos cardápios.
Só medidas que quase todo mundo conhece: colher de chá, colher de sopa, xícara de chá, concha, prato raso,
e unidades naturais (ovo, banana, fatia, filé, bife, pote...). Saem "colher de servir", "prato de sobremesa",
"porção", "pedaço" e "copo americano". Os gramas de cada medida vêm da mesma fonte de antes:
IBGE, POF 2008-2009, Tabela de Medidas Referidas para os Alimentos Consumidos no Brasil (pof_medidas_caseiras.csv).
Uso: python3 tools/medidas.py <pof_medidas_caseiras.csv>   (reescreve src/js/foods.js)"""
import csv, json, re, sys, collections
POF = sys.argv[1]; FJ = '/home/claude/build4/src/js/foods.js'
pof = collections.defaultdict(list)
for r in csv.DictReader(open(POF)): pof[r['codigo_alimento']].append((r['descricao_preparacao'], r['descricao_medida'], float(r['quantidade_g'])))
SG = {'COLHER DE SOPA': ('colher de sopa', 'colheres de sopa'), 'COLHER DE CHA': ('colher de chá', 'colheres de chá'), 'XICARA DE CHA': ('xícara', 'xícaras'),
      'CONCHA': ('concha', 'conchas'), 'PRATO RASO': ('prato raso', 'pratos rasos'), 'FATIA': ('fatia', 'fatias'), 'FILE': ('filé', 'filés'), 'BIFE': ('bife', 'bifes')}
# alimento: (medida na POF, preparo na POF ('' = o primeiro que houver), singular e plural se for unidade natural)
NEW = {
  'arroz': ('COLHER DE SOPA', ''), 'arrozi': ('COLHER DE SOPA', ''),
  'batdoce': ('COLHER DE SOPA', 'CROZIDO'), 'mandioca': ('COLHER DE SOPA', 'CROZIDO'), 'cara': ('COLHER DE SOPA', 'CROZIDO'),
  'cuscuz': ('FATIA', ''), 'musculo': ('COLHER DE SOPA', 'CROZIDO'), 'lagarto': ('BIFE', ''), 'lombo': ('FILE', ''),
  'camarao': ('COLHER DE SOPA', ''), 'rucula': ('PRATO RASO', ''), 'agriao': ('PRATO RASO', 'CRU'),
  'uva': ('UNIDADE', '', 'uva', 'uvas'), 'brocolis': ('COLHER DE SOPA', 'CROZIDO'), 'couveflor': ('COLHER DE SOPA', ''),
  'abobrinha': ('COLHER DE SOPA', ''), 'abobora': ('COLHER DE SOPA', ''), 'beterraba': ('XICARA DE CHA', 'CROZIDO'),
  'chuchu': ('COLHER DE SOPA', ''), 'couve': ('XICARA DE CHA', 'REFOGADO'), 'cenourac': ('XICARA DE CHA', 'CROZIDO'),
  'cafe': ('XICARA DE CHA', ''),
}
src = open(FJ).read(); a = src.index('{'); b = src.rindex('}') + 1; F = json.loads(src[a:b])
for k, spec in NEW.items():
    v = F[k]; code = v.get('pof'); meas, prep = spec[0], spec[1]
    hits = [g for p, m, g in pof[code] if m == meas and p.startswith(prep)]
    if not hits: sys.exit(f'sem {meas} {prep} para {k} ({code})')
    g = hits[0]; s, pl = (spec[2], spec[3]) if len(spec) > 2 else SG[meas]
    v['m'] = [g, s, pl]
# passo da porção: colheres e unidades pequenas inteiras; xícara, concha, prato e fatia em meios
for k, v in F.items():
    if not v.get('m') or k not in NEW: continue   # os outros mantêm o passo que já tinham
    g, s = v['m'][0], v['m'][1]
    if k == 'cafe': continue
    q = g if (s.startswith('colher') or g < 30) else g / 2
    v['q'] = round(q, 2); v['lo'] = max(v['lo'], v['q'])
    if v['hi'] < v['lo']: v['hi'] = v['lo']
head = src[:a].replace('Medidas caseiras: IBGE', 'Medidas caseiras (padronizadas em tools/medidas.py): IBGE')
open(FJ, 'w').write(head + json.dumps(F, ensure_ascii=False, separators=(',', ':')) + src[b:])
for k in NEW: print(k, F[k]['m'], 'q', F[k]['q'], 'lo', F[k]['lo'])
