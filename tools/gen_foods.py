# Gera src/js/foods.js a partir da TACO 4ª ed. (NEPA/UNICAMP) e da POF 2008-2009 (IBGE, medidas caseiras).
import json, csv, collections, sys
D = '/tmp/claude-0/-home-claude/d8bf57ad-6497-5bbb-b29a-ea61f70914fb/scratchpad/taco/'
taco = {x['n']: x for x in json.load(open(D + 'taco_all.json'))}
pof = collections.defaultdict(dict)
for r in csv.DictReader(open(D + 'taco/data/processed/pof/pof_medidas_caseiras.csv')):
    pof[r['codigo_alimento']][(r['descricao_preparacao'], r['descricao_medida'])] = float(r['quantidade_g'])

def M(code, prep, meas, s, p):
    ks = [k for k in pof[code] if k[1] == meas and k[0].startswith(prep)]
    if not ks: sys.exit(f'medida ausente {code} {prep} {meas}')
    return [pof[code][ks[0]], s, p, code]

# chave: (taco, nome, papéis, tags, medida|None, quantum g, min g, max g, palavras-chave)
# papéis: base leg prot bcarb bprot fruit salad cooked fat sweet drink
# tags: carne porco frango peixe mar ovo lac glu soja amend cast mel cafe | barato pratico magro denso pre
F = {}
def f(key, t, n, r, tg, m, q, lo, hi, kw):
    F[key] = dict(t=t, n=n, r=r, tg=tg, m=m, q=q, lo=lo, hi=hi, kw=kw)

CS = ('colher de servir', 'colheres de servir'); SOPA = ('colher de sopa', 'colheres de sopa'); CON = ('concha', 'conchas')
# ---------- bases (almoço e jantar)
f('arroz', 3, 'Arroz branco', ['base'], ['barato'], M('6300101', 'NAO', 'COLHER DE ARROZ/SERVIR', *CS), 5, 45, 450, ['arroz'])
f('arrozi', 1, 'Arroz integral', ['base'], [], M('6300201', 'NAO', 'COLHER DE ARROZ/SERVIR', *CS), 5, 45, 450, ['arroz integral', 'integral'])
f('batdoce', 88, 'Batata-doce cozida', ['base', 'bcarb'], ['barato', 'pre'], M('6400401', 'CROZIDO', 'PEDACO', 'pedaço', 'pedaços'), 5, 70, 500, ['batata doce', 'batata-doce'])
f('batata', 91, 'Batata inglesa cozida', ['base'], ['barato'], M('6400101', 'CROZIDO', 'UNIDADE', 'batata média', 'batatas médias'), 5, 70, 600, ['batata inglesa', 'batata'])
f('mandioca', 129, 'Mandioca cozida', ['base'], ['barato'], M('6400601', 'CROZIDO', 'PEDACO', 'pedaço', 'pedaços'), 5, 50, 400, ['mandioca', 'aipim', 'macaxeira'])
f('cara', 102, 'Cará cozido', ['base'], [], M('6400701', 'CROZIDO', 'COLHER DE ARROZ/SERVIR', *CS), 5, 60, 450, ['cará', 'inhame'])
f('macarrao', 40, 'Macarrão', ['base'], ['glu', 'barato', 'denso'], None, 5, 30, 200, ['macarrão', 'massa', 'espaguete', 'macarrao'])
f('cuscuz', 533, 'Cuscuz de milho', ['base', 'bcarb'], ['barato', 'pratico'], M('6902901', 'NAO', 'PEDACO', 'pedaço', 'pedaços'), 5, 60, 450, ['cuscuz'])
# ---------- leguminosas
f('fcarioca', 561, 'Feijão carioca', ['leg'], ['barato'], M('6303102', 'NAO', 'CONCHA', *CON), 10, 70, 280, ['feijão', 'feijao', 'carioca'])
f('fpreto', 567, 'Feijão preto', ['leg'], ['barato'], M('6303102', 'NAO', 'CONCHA', *CON), 10, 70, 280, ['feijão preto', 'feijão', 'feijao'])
f('ffradinho', 563, 'Feijão-fradinho', ['leg'], [], M('6301603', 'NAO', 'CONCHA', *CON), 10, 70, 280, ['fradinho', 'feijão de corda', 'feijão'])
f('lentilha', 577, 'Lentilha', ['leg'], [], M('6302901', 'NAO', 'CONCHA', *CON), 10, 80, 320, ['lentilha'])
# ---------- proteínas principais
FIL = ('filé', 'filés'); BIF = ('bife', 'bifes')
f('frango', 410, 'Peito de frango grelhado', ['prot', 'bprot'], ['frango', 'barato', 'magro', 'pratico'], M('7800402', 'ASSADO', 'FILE', *FIL), 10, 40, 300, ['frango', 'peito de frango', 'galinha'])
f('coxa', 398, 'Coxa de frango sem pele', ['prot'], ['frango', 'barato'], M('7800302', 'CROZIDO', 'COXA', 'coxa', 'coxas'), 5, 55, 330, ['coxa', 'frango', 'sobrecoxa'])
f('patinho', 377, 'Patinho grelhado', ['prot'], ['carne', 'magro'], M('7100501', 'ASSADO', 'BIFE', *BIF), 10, 40, 300, ['patinho', 'carne', 'bife', 'carne vermelha', 'boi'])
f('contra', 346, 'Contrafilé grelhado', ['prot'], ['carne', 'magro'], M('7100201', 'ASSADO', 'BIFE', *BIF), 10, 40, 300, ['contrafilé', 'contra filé', 'carne', 'bife', 'carne vermelha', 'boi'])
f('maminha', 368, 'Maminha grelhada', ['prot'], ['carne', 'magro'], M('7100303', 'ASSADO', 'BIFE', *BIF), 10, 40, 300, ['maminha', 'carne', 'carne vermelha', 'boi'])
f('musculo', 371, 'Músculo cozido', ['prot'], ['carne', 'barato'], M('7101001', 'CROZIDO', 'PEDACO', 'pedaço', 'pedaços'), 5, 35, 280, ['músculo', 'carne', 'carne vermelha', 'boi', 'carne cozida'])
f('moida', 326, 'Carne moída (acém)', ['prot'], ['carne', 'barato', 'pratico'], M('7104301', 'REFOGADO', 'COLHER DE SOPA', *SOPA), 5, 25, 250, ['carne moída', 'moída', 'carne', 'carne vermelha', 'boi'])
f('lagarto', 363, 'Lagarto cozido', ['prot'], ['carne'], M('7106401', 'CROZIDO', 'PEDACO', 'pedaço', 'pedaços'), 5, 35, 280, ['lagarto', 'carne', 'carne vermelha', 'boi'])
f('lombo', 432, 'Lombo de porco assado', ['prot'], ['porco'], M('7103701', 'ASSADO', 'PEDACO', 'pedaço', 'pedaços'), 5, 45, 280, ['lombo', 'porco', 'suíno', 'carne de porco'])
f('merluza', 301, 'Merluza assada', ['prot'], ['peixe', 'magro'], M('7200101', 'ASSADO', 'FILE', *FIL), 10, 60, 360, ['merluza', 'peixe'])
f('abadejo', 276, 'Abadejo grelhado', ['prot'], ['peixe', 'magro'], M('7200101', 'ASSADO', 'FILE', *FIL), 10, 60, 360, ['abadejo', 'peixe'])
f('pintado', 313, 'Pintado grelhado', ['prot'], ['peixe', 'magro'], M('7400101', 'ASSADO', 'FILE', *FIL), 10, 60, 360, ['pintado', 'peixe'])
f('salmao', 317, 'Salmão grelhado', ['prot'], ['peixe'], M('7200101', 'ASSADO', 'FILE', *FIL), 10, 60, 300, ['salmão', 'salmao', 'peixe'])
f('sardinha', 318, 'Sardinha assada', ['prot'], ['peixe', 'barato'], None, 5, 40, 300, ['sardinha', 'peixe'])
f('atum', 277, 'Atum em conserva', ['prot', 'bprot'], ['peixe', 'pratico'], M('7703402', 'NAO', 'COLHER DE SOPA', *SOPA), 5, 30, 200, ['atum', 'peixe'])
f('camarao', 284, 'Camarão cozido', ['prot'], ['mar', 'magro'], M('7260101', 'CROZIDO', 'COLHER DE ARROZ/SERVIR', *CS), 5, 35, 300, ['camarão', 'camarao', 'frutos do mar'])
f('ovo', 488, 'Ovo cozido', ['prot', 'bprot'], ['ovo', 'barato', 'pratico'], M('7803301', 'CROZIDO', 'UNIDADE', 'ovo', 'ovos'), 45, 45, 225, ['ovo', 'ovos'])
f('clara', 486, 'Clara de ovo cozida', ['bprot'], ['ovo', 'magro'], None, 10, 30, 200, ['clara', 'claras'])
f('tofu', 584, 'Tofu', ['prot', 'bprot'], ['soja'], M('7903402', 'NAO', 'FATIA', 'fatia', 'fatias'), 10, 60, 400, ['tofu', 'queijo de soja'])
# ---------- café da manhã e lanches: carboidratos
f('paof', 53, 'Pão francês', ['bcarb'], ['glu', 'barato', 'pratico', 'pre'], M('8000105', 'NAO', 'UNIDADE', 'pão', 'pães'), 25, 25, 150, ['pão francês', 'pão', 'pao', 'pãozinho', 'pão de sal'])
f('paoi', 52, 'Pão de forma integral', ['bcarb'], ['glu', 'pratico'], M('8001401', 'NAO', 'FATIA', 'fatia', 'fatias'), 25, 25, 150, ['pão integral', 'pão de forma', 'pão', 'pao'])
f('aveia', 7, 'Aveia em flocos', ['bcarb'], ['glu', 'barato', 'pratico'], M('6500401', 'NAO', 'COLHER DE SOPA', *SOPA), 5, 15, 90, ['aveia'])
f('tapioca', 551, 'Tapioca com manteiga', ['bcarb'], ['lac', 'pre'], M('6501516', 'NAO', 'UNIDADE', 'tapioca', 'tapiocas'), 25, 50, 150, ['tapioca'])
f('torrada', 63, 'Torrada', ['bcarb'], ['glu', 'pratico'], M('8001901', 'NAO', 'UNIDADE', 'torrada', 'torradas'), 8, 16, 64, ['torrada', 'torradas'])
# ---------- café da manhã e lanches: proteínas
f('iogurte', 448, 'Iogurte natural', ['bprot'], ['lac', 'pratico'], M('7901204', 'NAO', 'POTE', 'pote', 'potes'), 10, 100, 400, ['iogurte'])
f('iogurted', 449, 'Iogurte natural desnatado', ['bprot'], ['lac', 'pratico', 'magro'], M('7901203', 'NAO', 'POTE', 'pote', 'potes'), 10, 100, 400, ['iogurte desnatado', 'iogurte'])
f('minas', 461, 'Queijo minas frescal', ['bprot'], ['lac', 'pratico'], M('7902001', 'NAO', 'FATIA', 'fatia', 'fatias'), 15, 30, 120, ['queijo minas', 'queijo branco', 'queijo'])
f('mussarela', 463, 'Muçarela', ['bprot'], ['lac', 'pratico'], M('7901803', 'NAO', 'FATIA', 'fatia', 'fatias'), 20, 20, 80, ['muçarela', 'mussarela', 'mozarela', 'queijo'])
f('ricota', 469, 'Ricota', ['bprot'], ['lac', 'magro'], M('7902201', 'NAO', 'FATIA', 'fatia', 'fatias'), 10, 35, 150, ['ricota'])
f('requeijao', 468, 'Requeijão cremoso', ['bprot'], ['lac'], M('7902901', 'NAO', 'COLHER DE SOPA', *SOPA), 5, 15, 45, ['requeijão', 'requeijao'])
f('presunto', 439, 'Presunto magro', ['bprot'], ['porco', 'pratico'], M('8102901', 'NAO', 'FATIA', 'fatia', 'fatias'), 15, 15, 90, ['presunto'])
f('leitepo', 456, 'Leite desnatado em pó', ['bprot'], ['lac', 'pratico', 'magro'], M('7900710', 'NAO', 'COLHER DE SOPA', *SOPA), 5, 10, 50, ['leite', 'leite em pó'])
f('sojapo', 583, 'Bebida de soja em pó', ['bprot'], ['soja', 'pratico'], M('7903501', 'NAO', 'COLHER DE SOPA', *SOPA), 5, 13, 52, ['leite de soja', 'soja', 'bebida de soja', 'extrato de soja'])
# ---------- frutas
U = lambda s, p: (s, p)
f('banana', 182, 'Banana-prata', ['fruit'], ['barato', 'pre', 'denso'], M('6801101', 'NAO', 'UNIDADE', 'banana', 'bananas'), 37.5, 37.5, 225, ['banana'])
f('maca', 222, 'Maçã', ['fruit'], ['pre'], M('6803001', 'NAO', 'UNIDADE', 'maçã', 'maçãs'), 75, 75, 300, ['maçã', 'maca'])
f('mamao', 225, 'Mamão formosa', ['fruit'], ['barato'], M('6803101', 'NAO', 'FATIA', 'fatia', 'fatias'), 85, 85, 340, ['mamão', 'mamao', 'papaia'])
f('laranja', 214, 'Laranja-pera', ['fruit'], ['barato'], M('6801801', 'NAO', 'UNIDADE', 'laranja', 'laranjas'), 90, 90, 360, ['laranja'])
f('morango', 239, 'Morango', ['fruit'], [], M('6805201', 'NAO', 'XICARA DE CHA', 'xícara', 'xícaras'), 60, 60, 360, ['morango', 'morangos'])
f('uva', 256, 'Uva', ['fruit'], [], M('6803901', 'NAO', 'COPO AMERICANO', 'copo americano', 'copos americanos'), 35, 70, 210, ['uva', 'uvas'])
f('manga', 231, 'Manga', ['fruit'], [], M('6803201', 'NAO', 'UNIDADE', 'manga', 'mangas'), 70, 70, 280, ['manga'])
f('abacaxi', 164, 'Abacaxi', ['fruit'], [], M('6802601', 'NAO', 'FATIA', 'fatia', 'fatias'), 75, 75, 300, ['abacaxi'])
f('melancia', 235, 'Melancia', ['fruit'], ['barato'], M('6803401', 'NAO', 'FATIA', 'fatia', 'fatias'), 100, 200, 400, ['melancia'])
f('melao', 236, 'Melão', ['fruit'], [], M('6803501', 'NAO', 'FATIA', 'fatia', 'fatias'), 90, 90, 360, ['melão', 'melao'])
f('kiwi', 207, 'Kiwi', ['fruit'], [], M('6807801', 'NAO', 'UNIDADE', 'kiwi', 'kiwis'), 94, 94, 282, ['kiwi'])
f('goiaba', 200, 'Goiaba', ['fruit'], ['barato'], M('6804201', 'NAO', 'UNIDADE', 'goiaba', 'goiabas'), 85, 85, 340, ['goiaba'])
f('tangerina', 251, 'Tangerina', ['fruit'], ['barato'], M('6802201', 'NAO', 'UNIDADE', 'tangerina', 'tangerinas'), 135, 135, 405, ['tangerina', 'mexerica', 'bergamota', 'ponkan'])
f('pera', 243, 'Pera', ['fruit'], [], M('6803601', 'NAO', 'UNIDADE', 'pera', 'peras'), 65, 65, 260, ['pera', 'pêra'])
f('abacate', 163, 'Abacate', ['fat'], [], M('6802701', 'NAO', 'COLHER DE SOPA', *SOPA), 15, 45, 180, ['abacate'])
# ---------- verduras e legumes
f('alface', 78, 'Alface', ['salad'], ['barato'], M('6700101', 'NAO', 'FOLHA', 'folha', 'folhas'), 10, 20, 80, ['alface', 'salada', 'folhas'])
f('tomate', 157, 'Tomate', ['salad'], ['barato'], M('6705101', 'NAO', 'UNIDADE', 'tomate', 'tomates'), 50, 50, 150, ['tomate'])
f('rucula', 152, 'Rúcula', ['salad'], [], M('6702001', 'NAO', 'PRATO DE SOBREMESA', 'prato de sobremesa', 'pratos de sobremesa'), 15, 15, 60, ['rúcula', 'rucula', 'folhas', 'salada'])
f('agriao', 75, 'Agrião', ['salad'], [], M('6701301', 'CRU', 'PORCAO', 'porção', 'porções'), 10, 20, 75, ['agrião', 'agriao', 'folhas', 'salada'])
f('pepino', 142, 'Pepino', ['salad'], ['barato'], M('6704001', 'NAO', 'UNIDADE', 'pepino', 'pepinos'), 25, 50, 150, ['pepino'])
f('cenoura', 110, 'Cenoura ralada', ['salad'], ['barato'], M('6401201', 'CRU', 'COLHER DE SOPA', *SOPA), 12, 24, 96, ['cenoura'])
f('repolho', 149, 'Repolho', ['salad'], ['barato'], M('6700901', 'CRU', 'COLHER DE SOPA', *SOPA), 10, 30, 100, ['repolho'])
f('brocolis', 100, 'Brócolis cozido', ['cooked'], [], M('6701704', 'CROZIDO', 'COLHER DE ARROZ/SERVIR', *CS), 10, 40, 160, ['brócolis', 'brocolis'])
f('couveflor', 118, 'Couve-flor cozida', ['cooked'], [], M('6700601', 'CROZIDO', 'COLHER DE ARROZ/SERVIR', *CS), 25, 50, 200, ['couve-flor', 'couve flor'])
f('abobrinha', 70, 'Abobrinha cozida', ['cooked'], ['barato'], M('6703701', 'CROZIDO', 'COLHER DE ARROZ/SERVIR', *CS), 35, 70, 210, ['abobrinha'])
f('abobora', 64, 'Abóbora cabotiá cozida', ['cooked'], ['barato'], M('6703901', 'CROZIDO', 'COLHER DE ARROZ/SERVIR', *CS), 36, 72, 216, ['abóbora', 'abobora', 'jerimum'])
f('beterraba', 97, 'Beterraba cozida', ['cooked'], ['barato'], M('6401101', 'CROZIDO', 'COLHER DE SOPA', *SOPA), 20, 40, 120, ['beterraba'])
f('chuchu', 112, 'Chuchu cozido', ['cooked'], ['barato'], M('6704101', 'CROZIDO', 'COLHER DE ARROZ/SERVIR', *CS), 45, 45, 180, ['chuchu'])
f('couve', 116, 'Couve refogada', ['cooked'], ['barato'], M('6700501', 'REFOGADO', 'COLHER DE ARROZ/SERVIR', *CS), 21, 42, 126, ['couve'])
f('cenourac', 109, 'Cenoura cozida', ['cooked'], ['barato'], M('6401201', 'CROZIDO', 'COLHER DE SOPA', *SOPA), 25, 50, 150, ['cenoura'])
f('berinjela', 95, 'Berinjela cozida', ['cooked'], [], M('6705401', 'CROZIDO', 'COLHER DE SOPA', *SOPA), 25, 50, 150, ['berinjela'])
# ---------- gorduras
f('azeite', 260, 'Azeite de oliva', ['fat'], [], M('8400101', 'NAO', 'COLHER DE SOPA', *SOPA), 4, 4, 24, ['azeite'])
f('castpara', 589, 'Castanha-do-pará', ['fat'], ['cast', 'pratico'], M('6600701', 'NAO', 'UNIDADE', 'castanha', 'castanhas'), 4, 4, 24, ['castanha', 'castanhas', 'castanha-do-pará', 'castanha do pará', 'oleaginosas'])
f('caju', 588, 'Castanha de caju', ['fat'], ['cast', 'pratico'], M('6600801', 'NAO', 'UNIDADE', 'castanha', 'castanhas'), 5, 5, 40, ['caju', 'castanha de caju', 'castanhas', 'oleaginosas'])
f('nozes', 597, 'Nozes', ['fat'], ['cast', 'pratico'], M('6601501', 'NAO', 'UNIDADE', 'noz', 'nozes'), 5, 5, 40, ['noz', 'nozes', 'oleaginosas'])
f('amendoa', 587, 'Amêndoas', ['fat'], ['cast', 'pratico'], M('6600501', 'NAO', 'UNIDADE', 'amêndoa', 'amêndoas'), 5, 5, 40, ['amêndoa', 'amêndoas', 'amendoa', 'oleaginosas'])
f('amendoim', 558, 'Amendoim torrado', ['fat'], ['amend', 'barato', 'pratico'], M('6301001', 'NAO', 'COLHER DE SOPA', *SOPA), 5, 10, 50, ['amendoim'])
f('linhaca', 594, 'Linhaça', ['fat'], [], M('6302001', 'NAO', 'COLHER DE SOPA', *SOPA), 5, 5, 26, ['linhaça', 'linhaca'])
f('manteiga', 261, 'Manteiga', ['fat'], ['lac'], M('7901501', 'NAO', 'COLHER DE CHA', 'colher de chá', 'colheres de chá'), 4, 4, 16, ['manteiga'])
# ---------- extras
f('mel', 507, 'Mel', ['sweet'], ['mel', 'pre'], M('6901602', 'NAO', 'COLHER DE SOPA', *SOPA), 5, 5, 30, ['mel', 'doce', 'açúcar'])
f('cafe', 471, 'Café sem açúcar', ['drink'], ['cafe'], M('8501302', 'NAO', 'XICARA DE CHA', 'xícara', 'xícaras'), 50, 50, 200, ['café', 'cafe', 'cafeína'])

KEEPQ = {'paoi', 'torrada', 'ovo', 'paof', 'tapioca', 'cuscuz'}
out = {}
for k, v in F.items():
    x = taco[v['t']]
    num = lambda z: 0 if z in (None, 'Tr', '*', 'NA', '') else round(float(z), 1)
    o = {'n': v['n'], 't': v['t'], 'r': v['r'], 'tg': v['tg'], 'k': num(x['kcal']), 'p': num(x['p']), 'c': num(x['c']), 'f': num(x['l']), 'fb': num(x['f']),
         'q': v['q'], 'lo': v['lo'], 'hi': v['hi'], 'kw': v['kw']}
    if v['m']:
        o['m'] = [v['m'][0], v['m'][1], v['m'][2]]; o['pof'] = v['m'][3]
        ug = v['m'][0]
        if k not in KEEPQ:
            if ug < 6: o['q'] = ug
            elif ug <= 60: o['q'] = round(ug / 2, 2)
        o['lo'] = max(o['lo'], o['q'])
    out[k] = o
js = ('/* Alimentos do cardápio. Gerado por gen_foods.py; não edite à mão.\n'
      '   Composição por 100 g: Tabela Brasileira de Composição de Alimentos (TACO), 4ª edição, NEPA/UNICAMP, 2011.\n'
      '   Medidas caseiras: IBGE, Pesquisa de Orçamentos Familiares 2008-2009, Tabela de Medidas Referidas para os Alimentos Consumidos no Brasil, 2011.\n'
      '   r = papéis no prato; tg = etiquetas; q = passo da porção (g); lo/hi = porção mínima e máxima (g); m = [g por medida, singular, plural]. */\n'
      'const FOODS = ' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n')
open('/home/claude/build4/src/js/foods.js', 'w').write(js)
print(len(out), 'alimentos,', len(js), 'bytes')
for k, o in out.items():
    if o['k'] == 0: print('SEM KCAL', k)
