/* Instruções detalhadas por exercício.
   Formato: id: [preparação, [passos da execução], [erros comuns], dica]
   Texto de técnica geral de musculação; não substitui orientação presencial de um profissional. */
const INS = {};
Object.assign(INS, {
'supino-reto-barra': [
  'Deite com os olhos logo abaixo da barra. Pegada um pouco mais larga que os ombros, punhos alinhados com os antebraços. Junte as escápulas e leve-as para baixo, como se fosse guardá-las no bolso de trás, e mantenha um leve arco natural na lombar com o glúteo apoiado. Pés firmes no chão, um pouco atrás dos joelhos.',
  ['Tire a barra do suporte com os braços estendidos e posicione-a sobre a linha dos ombros.', 'Inspire e desça a barra em 2 a 3 segundos até tocar a parte baixa do peito, na linha dos mamilos. Os cotovelos ficam entre 45° e 70° do tronco, nunca abertos a 90°.', 'Com o toque leve no peito, empurre a barra para cima e um pouco em direção ao rosto, terminando de novo sobre os ombros.', 'Solte o ar na parte final da subida e mantenha as escápulas presas durante toda a série.'],
  ['Abrir os cotovelos a 90°, o que joga a carga na frente do ombro.', 'Quicar a barra no peito ou tirar o glúteo do banco para vencer a carga.', 'Soltar as escápulas no topo, perdendo a base estável.'],
  'Empurre o chão com os pés, como se fosse deslizar o corpo para trás no banco. Isso deixa as costas firmes e dá mais força na saída do peito.'],
'supino-reto-smith': [
  'Posicione o banco para que a barra desça sobre a parte baixa do peito, não sobre o pescoço. Pegada um pouco mais larga que os ombros, escápulas juntas e para baixo, pés firmes.',
  ['Destrave a barra girando os punhos e mantenha os braços estendidos acima do peito.', 'Desça controlando até a barra ficar a um ou dois dedos do peito, cotovelos a cerca de 45° do tronco.', 'Empurre de volta até quase estender os cotovelos.', 'Ao terminar, gire os punhos para travar a barra no gancho mais próximo.'],
  ['Banco mal posicionado: como a barra corre num trilho fixo, ela vai descer no lugar errado do peito.', 'Travar os cotovelos com força no topo, tirando a tensão do peitoral.'],
  'Faça uma descida de teste sem peso para achar a posição do banco antes de carregar a barra.'],
'supino-reto-halter': [
  'Sente na ponta do banco com os halteres em pé sobre as coxas. Deite levando os halteres junto ao peito com ajuda das coxas. Escápulas juntas e para baixo, pés firmes no chão.',
  ['Comece com os braços estendidos, halteres sobre a linha do peito e palmas voltadas para os pés.', 'Desça os halteres abrindo os cotovelos a cerca de 45° até as mãos ficarem na altura do peito ou um pouco abaixo, sentindo o peitoral alongar.', 'Empurre para cima aproximando levemente os halteres, sem bater um no outro.', 'Mantenha os antebraços na vertical durante todo o movimento.'],
  ['Descer demais e perder o controle, forçando o ombro.', 'Deixar os halteres caírem para fora, virando um crucifixo.', 'Largar os halteres de qualquer jeito no fim da série.'],
  'Para terminar, traga os halteres ao peito e sente levando os joelhos ao encontro deles. É a forma segura de sair da posição.'],
'supino-reto-maquina': [
  'Regule o assento para as pegadas ficarem na altura do meio do peito, não dos ombros. Costas e escápulas apoiadas no encosto, pés firmes no chão.',
  ['Segure as pegadas com os punhos retos e cotovelos um pouco abaixo da linha dos ombros.', 'Empurre até quase estender os cotovelos, mantendo o peito aberto.', 'Volte devagar até sentir o peitoral alongar, sem deixar as placas encostarem.'],
  ['Assento alto demais, o que transforma o exercício em desenvolvimento de ombro.', 'Tirar as costas do encosto e empurrar com o tronco.'],
  'Na volta, deixe as escápulas encostadas e o peito alto. É isso que mantém a carga no peitoral e não no ombro.'],
'flexao': [
  'Mãos no chão um pouco mais abertas que os ombros, dedos apontando para frente. Pernas estendidas, apoiando na ponta dos pés. Corpo em linha reta da cabeça aos calcanhares, abdômen e glúteos contraídos.',
  ['Desça o corpo inteiro como uma prancha, cotovelos a cerca de 45° do tronco.', 'Desça até o peito ficar a poucos centímetros do chão.', 'Empurre o chão para subir, mantendo o quadril alinhado com o tronco.'],
  ['Deixar o quadril cair ou empinar o bumbum.', 'Abrir os cotovelos a 90°, formando um T com os braços.', 'Fazer só metade do movimento.'],
  'Se ainda não consegue fazer com boa forma, apoie os joelhos ou faça a flexão inclinada com as mãos num banco. É melhor progredir assim do que repetir com o corpo torto.'],
'supino-incl-halter': [
  'Banco entre 30° e 45°. Inclinações maiores passam a trabalhar mais o ombro que o peito. Leve os halteres ao peito com ajuda das coxas, escápulas juntas e para baixo.',
  ['Comece com os halteres acima da parte de cima do peito, braços estendidos.', 'Desça abrindo os cotovelos a cerca de 45° até sentir o peito superior alongar.', 'Empurre para cima e levemente para dentro, sem bater os halteres.'],
  ['Banco muito inclinado, tirando o foco do peito.', 'Arquear demais a lombar para tirar o peito do banco.'],
  'Pense em empurrar os halteres em direção ao teto e não para frente. A trajetória certa termina acima da clavícula.'],
'supino-incl-barra': [
  'Banco entre 30° e 45°. Pegada um pouco mais larga que os ombros, escápulas presas, pés firmes. A barra deve descer na parte de cima do peito, perto da clavícula.',
  ['Tire a barra do suporte e posicione-a acima da parte de cima do peito.', 'Desça controlando até tocar levemente logo abaixo da clavícula.', 'Empurre de volta em linha reta para cima.'],
  ['Descer a barra no meio do peito, como no supino reto.', 'Tirar o quadril do banco para empurrar mais.'],
  'Mantenha os cotovelos um pouco à frente da barra na descida. Isso protege o ombro e deixa o peito superior trabalhar.'],
'supino-incl-smith': [
  'Ajuste o banco inclinado (30° a 45°) de modo que a barra desça logo abaixo da clavícula. Escápulas juntas e para baixo, pegada um pouco mais larga que os ombros.',
  ['Destrave a barra e mantenha os braços estendidos.', 'Desça controlando até perto da parte de cima do peito.', 'Empurre até quase estender os cotovelos e repita.'],
  ['Banco fora de posição, fazendo a barra descer no pescoço ou no meio do peito.', 'Bater a barra no peito para ganhar impulso.'],
  'O Smith permite controlar bem a descida. Use 3 segundos para descer e você vai sentir muito mais o peito superior.'],
'supino-incl-maquina': [
  'Regule o assento para as pegadas ficarem na altura da parte de cima do peito. Costas apoiadas, pés firmes no chão.',
  ['Segure as pegadas com punhos retos.', 'Empurre para cima e para frente até quase estender os cotovelos.', 'Volte devagar até sentir o peito superior alongar.'],
  ['Assento muito baixo, deixando a pegada acima dos ombros.', 'Tirar as costas do encosto no esforço.'],
  'Mantenha o peito alto e os ombros longe das orelhas durante toda a série.'],
'voador': [
  'Regule o assento para os braços ficarem na altura do peito, cotovelos um pouco abaixo dos ombros. Costas apoiadas no encosto e peito aberto.',
  ['Segure as pegadas com os cotovelos levemente flexionados e fixos nesse ângulo.', 'Aproxime os braços à frente do peito como se fosse abraçar uma árvore grande.', 'Segure um instante com o peito contraído.', 'Volte devagar até sentir o peitoral alongar, sem passar da linha do corpo.'],
  ['Dobrar e esticar os cotovelos durante o movimento, virando um supino.', 'Deixar os ombros subirem e projetarem para frente no fim.'],
  'Pense em levar os cotovelos um em direção ao outro, não as mãos. Isso tira o bíceps e o ombro da jogada.'],
'crossover': [
  'Polias na altura dos ombros ou um pouco acima. Dê um passo à frente, um pé adiante do outro, tronco levemente inclinado e peito aberto.',
  ['Comece com os braços abertos, cotovelos levemente flexionados.', 'Traga as mãos para frente e um pouco para baixo, em arco, até se encontrarem na frente do peito.', 'Contraia o peito por um instante.', 'Volte devagar em arco até sentir o peitoral alongar.'],
  ['Usar o peso do corpo e balançar o tronco.', 'Dobrar os cotovelos e transformar o exercício em empurrada.'],
  'Mudando a altura das polias você muda a região: de cima para baixo foca a parte inferior do peito, de baixo para cima foca a parte superior.'],
'crucifixo-halter': [
  'Deite no banco reto com os halteres acima do peito, palmas uma de frente para a outra, cotovelos levemente flexionados. Escápulas juntas e pés firmes.',
  ['Abra os braços em arco, mantendo o mesmo ângulo nos cotovelos.', 'Desça até os halteres ficarem na altura do peito, sentindo o alongamento sem dor no ombro.', 'Volte pelo mesmo arco até os halteres se aproximarem acima do peito.'],
  ['Descer demais com carga alta, sobrecarregando a frente do ombro.', 'Esticar os cotovelos por completo, o que estressa a articulação.'],
  'Use carga bem menor que no supino com halteres. O crucifixo é exercício de alongamento e controle, não de força máxima.'],
'puxada-aberta': [
  'Ajuste o apoio das coxas para ficar firme no banco. Pegada mais aberta que os ombros, palmas para frente. Peito alto e tronco levemente inclinado para trás, cerca de 10° a 20°.',
  ['Comece com os braços estendidos e os ombros alongados para cima.', 'Primeiro desça os ombros, afastando-os das orelhas, e então puxe a barra levando os cotovelos para baixo e para trás.', 'Traga a barra até a parte de cima do peito.', 'Suba devagar até estender os braços de novo.'],
  ['Puxar a barra atrás da nuca.', 'Jogar o tronco muito para trás e transformar a puxada em remada.', 'Puxar com os bíceps, sem descer os ombros antes.'],
  'Imagine que suas mãos são ganchos e quem puxa são os cotovelos indo em direção aos bolsos da calça.'],
'puxada-neutra': [
  'Prenda o triângulo na polia alta. Apoio das coxas firme, peito alto, tronco levemente inclinado para trás.',
  ['Segure o triângulo com as palmas uma de frente para a outra, braços estendidos.', 'Desça os ombros e puxe levando os cotovelos rente ao corpo, para baixo.', 'Traga o triângulo até a parte de cima do peito.', 'Volte devagar até alongar as costas.'],
  ['Encolher os ombros durante a puxada.', 'Usar o balanço do tronco para descer o peso.'],
  'A pegada neutra deixa os cotovelos mais fechados e costuma permitir mais carga com menos estresse no ombro.'],
'puxada-supinada': [
  'Pegada na largura dos ombros, palmas voltadas para você. Apoio das coxas firme, peito alto.',
  ['Braços estendidos, ombros alongados para cima.', 'Desça os ombros e puxe trazendo os cotovelos para baixo e junto ao corpo.', 'Leve a barra até a parte de cima do peito.', 'Suba controlando até estender os braços.'],
  ['Deixar o bíceps fazer todo o trabalho, puxando só com os braços.', 'Tirar o quadril do banco.'],
  'Esta pegada recruta bastante bíceps. Se o braço cansar antes das costas, use uma pegada neutra ou aberta.'],
'puxada-unilateral': [
  'Prenda uma alça na polia alta. Sente ou ajoelhe de frente para a polia com o tronco levemente inclinado na direção do braço que vai puxar.',
  ['Segure a alça com o braço estendido e o ombro alongado para cima.', 'Desça o ombro e puxe levando o cotovelo para baixo, junto à lateral do corpo.', 'Termine com a mão perto do ombro e a lateral das costas contraída.', 'Volte devagar até alongar.'],
  ['Girar o tronco para ajudar a puxar.', 'Deixar o ombro subir no fim da volta, perdendo o controle.'],
  'Trabalhar um lado de cada vez ajuda a corrigir diferenças de força entre os lados e a sentir melhor o dorsal.'],
'barra-fixa': [
  'Segure a barra com as palmas para frente, mãos um pouco mais abertas que os ombros. Fique pendurado com os braços estendidos, pernas juntas e abdômen firme.',
  ['Comece descendo os ombros, afastando-os das orelhas, sem dobrar os braços.', 'Puxe levando os cotovelos para baixo e para trás até o queixo passar a barra.', 'Desça devagar até estender totalmente os braços.'],
  ['Balançar as pernas para ganhar impulso.', 'Fazer só a metade de cima, sem estender os braços.', 'Esticar o pescoço para o queixo passar da barra.'],
  'Se ainda não faz repetições completas, use elástico de assistência, a máquina graviton ou faça só a descida bem lenta (3 a 5 segundos).'],
'pulldown-estendido': [
  'Barra reta ou corda na polia alta. Fique em pé a um passo da polia, quadril levemente para trás, tronco inclinado à frente e coluna neutra.',
  ['Segure a barra com os braços quase estendidos, cotovelos levemente flexionados e fixos.', 'Leve a barra em arco para baixo até perto das coxas, usando as costas.', 'Volte em arco até a altura dos olhos, sentindo o dorsal alongar.'],
  ['Dobrar os cotovelos e transformar em tríceps.', 'Mexer o tronco para baixo e para cima a cada repetição.'],
  'Funciona muito bem como pré-ativação das costas antes das puxadas ou como finalizador com cargas leves.'],
'remada-iso': [
  'Regule o assento para as pegadas ficarem na altura do meio do peito. Peito apoiado no suporte, pés firmes.',
  ['Segure as pegadas com os braços estendidos e ombros alongados à frente.', 'Puxe levando os cotovelos para trás, junto ao corpo, e aproxime as escápulas no fim.', 'Volte devagar até estender os braços e alongar as costas.'],
  ['Tirar o peito do apoio para puxar com o corpo.', 'Encolher os ombros em direção às orelhas.'],
  'Por ter braços independentes, dá para fazer um lado de cada vez e comparar a força de cada lado.'],
'remada-baixa': [
  'Sente com os pés apoiados na plataforma e joelhos levemente flexionados. Segure o triângulo, tronco ereto e coluna neutra.',
  ['Comece com os braços estendidos, deixando as escápulas irem levemente para frente.', 'Puxe o triângulo até a parte de cima do abdômen, levando os cotovelos para trás rente ao corpo.', 'Aproxime as escápulas no fim do movimento.', 'Volte devagar, sem arredondar a lombar.'],
  ['Balançar o tronco para frente e para trás a cada repetição.', 'Arredondar a lombar na volta.', 'Puxar até o peito com os cotovelos abertos.'],
  'O tronco pode inclinar um pouco, uns 10°, mas deve ficar praticamente parado. Quem se move são os braços e as escápulas.'],
'remada-unilateral-cabo': [
  'Polia na altura do peito ou abaixo. Fique de pé ou sentado de frente para o cabo, com o tronco firme.',
  ['Segure a alça com o braço estendido à frente.', 'Puxe levando o cotovelo para trás, junto ao corpo, até a mão chegar perto da cintura.', 'Contraia as costas por um instante.', 'Volte devagar até estender o braço e alongar a lateral das costas.'],
  ['Girar o tronco para trás para completar a puxada.', 'Puxar com o cotovelo aberto, perdendo o foco no dorsal.'],
  'Deixe o ombro ir um pouco à frente na volta. Esse alongamento extra aumenta a amplitude e o trabalho das costas.'],
'serrote': [
  'Apoie o joelho e a mão do mesmo lado num banco reto. A outra perna fica no chão, um pouco afastada. Tronco quase paralelo ao chão e coluna neutra.',
  ['Segure o halter com o braço estendido, pendurado abaixo do ombro.', 'Puxe levando o cotovelo para trás e para cima, em direção ao quadril.', 'Termine com o halter na altura da cintura e o cotovelo acima do tronco.', 'Desça devagar até estender o braço.'],
  ['Girar o tronco para subir o halter.', 'Puxar o halter em direção ao peito, trabalhando mais braço e ombro.'],
  'Pense em levar o cotovelo ao bolso de trás da calça. Esse caminho em arco ativa melhor o dorsal.'],
'remada-curvada': [
  'Pés na largura do quadril, joelhos levemente flexionados. Incline o tronco à frente levando o quadril para trás até ficar entre 30° e 45° do chão, coluna neutra e abdômen firme. Pegada na largura dos ombros.',
  ['Deixe a barra pendurada com os braços estendidos, abaixo dos ombros.', 'Puxe a barra em direção à parte baixa do abdômen, levando os cotovelos para trás.', 'Aproxime as escápulas no fim do movimento.', 'Desça a barra devagar sem mudar a posição do tronco.'],
  ['Arredondar a lombar.', 'Levantar o tronco a cada repetição para usar impulso.', 'Usar tanta carga que a barra não chega ao abdômen.'],
  'Se a lombar cansar antes das costas, troque pela remada com apoio de peito ou pelo serrote.'],
'remada-cavalinho': [
  'Fique com uma perna de cada lado da barra, joelhos flexionados, quadril para trás e coluna neutra, tronco a cerca de 45°. Use o puxador em V ou as pegadas da máquina.',
  ['Comece com os braços estendidos e a barra pendurada.', 'Puxe a barra em direção ao abdômen, levando os cotovelos para trás.', 'Aproxime as escápulas no topo.', 'Desça devagar mantendo a coluna firme.'],
  ['Arredondar a lombar ou levantar o tronco para puxar.', 'Deixar as anilhas baterem no peito por excesso de carga.'],
  'Use anilhas menores para conseguir mais amplitude. Anilhas grandes encostam no peito antes da hora.'],
'desenv-halter': [
  'Sente num banco com encosto quase vertical, entre 75° e 90°. Leve os halteres até a altura dos ombros, palmas para frente, cotovelos um pouco à frente do corpo.',
  ['Empurre os halteres para cima até quase estender os cotovelos, aproximando-os acima da cabeça.', 'Desça devagar até os halteres ficarem na altura das orelhas ou um pouco abaixo.', 'Mantenha a lombar apoiada e o abdômen firme.'],
  ['Arquear a lombar para empurrar mais.', 'Abrir os cotovelos totalmente para os lados, a 90° do tronco.', 'Bater os halteres no topo.'],
  'Cotovelos levemente à frente, num ângulo de uns 30° em relação ao corpo, deixam o ombro numa posição mais confortável e forte.'],
'desenv-maquina': [
  'Regule o assento para as pegadas ficarem na altura dos ombros. Costas apoiadas e pés firmes.',
  ['Segure as pegadas com os punhos retos.', 'Empurre para cima até quase estender os cotovelos.', 'Desça devagar até as mãos voltarem à altura dos ombros.'],
  ['Assento baixo demais, começando o movimento com as mãos muito abaixo dos ombros.', 'Afastar a lombar do encosto.'],
  'A máquina permite ir perto da falha com segurança. Bom exercício para o fim do treino de ombros.'],
'desenv-smith': [
  'Coloque um banco com encosto vertical no Smith, de modo que a barra desça um pouco à frente do rosto. Pegada um pouco mais larga que os ombros.',
  ['Destrave a barra com os braços estendidos.', 'Desça controlando até a barra ficar na altura do queixo.', 'Empurre de volta até quase estender os cotovelos.'],
  ['Descer a barra atrás da nuca.', 'Posicionar o banco tão perto que a barra raspa no rosto.'],
  'Teste a trajetória sem peso antes de carregar a barra para achar a posição do banco.'],
'elev-lateral-halter': [
  'Em pé, pés na largura do quadril, halteres ao lado do corpo. Incline o tronco levemente à frente e mantenha os cotovelos levemente flexionados.',
  ['Eleve os halteres para os lados, levando os cotovelos para fora e para cima.', 'Suba até os braços ficarem na altura dos ombros, nem acima nem abaixo.', 'Desça devagar, em 2 a 3 segundos, sem deixar os halteres encostarem no corpo.'],
  ['Balançar o tronco para jogar o peso para cima.', 'Encolher os ombros, transferindo o trabalho para o trapézio.', 'Subir com os punhos acima dos cotovelos.'],
  'Pense em empurrar os halteres para longe, para os lados, e não para cima. Carga leve e controle valem mais que peso neste exercício.'],
'elev-lateral-sentado': [
  'Sente na ponta do banco, tronco ereto e levemente inclinado à frente, halteres ao lado do corpo e cotovelos levemente flexionados.',
  ['Eleve os halteres para os lados, cotovelos guiando o movimento.', 'Pare quando os braços chegarem à altura dos ombros.', 'Desça devagar até perto do banco.'],
  ['Inclinar o tronco para trás para ajudar.', 'Subir demais e encolher os ombros.'],
  'Sentado não dá para roubar com as pernas. É uma ótima forma de isolar o deltoide lateral.'],
'elev-lateral-cabo': [
  'Polia baixa. Fique de lado para a máquina e segure a alça com a mão mais distante, cabo passando à frente do corpo. Segure no aparelho com a outra mão.',
  ['Comece com a mão perto da coxa oposta, cotovelo levemente flexionado.', 'Eleve o braço para o lado até a altura do ombro.', 'Desça devagar até a posição inicial.'],
  ['Inclinar o corpo para longe da máquina a cada repetição.', 'Subir acima da linha do ombro.'],
  'O cabo mantém tensão desde o início do movimento, onde o halter quase não pesa. Combina bem com a versão com halteres.'],
'remada-alta': [
  'Em pé, pegada na barra um pouco mais larga que os ombros, palmas para você, braços estendidos à frente das coxas.',
  ['Puxe a barra para cima rente ao corpo, cotovelos guiando para os lados e para cima.', 'Pare quando os cotovelos chegarem à altura dos ombros.', 'Desça devagar até estender os braços.'],
  ['Pegada muito fechada e cotovelos acima da linha dos ombros, posição que pode irritar o ombro.', 'Usar impulso do quadril.'],
  'Se sentir pinçamento ou dor na frente do ombro, abra mais a pegada ou troque pela elevação lateral.'],
'voador-inverso': [
  'Sente de frente para o encosto da máquina, peito apoiado. Regule para as pegadas ficarem na altura dos ombros.',
  ['Segure as pegadas com os braços estendidos à frente, cotovelos levemente flexionados.', 'Abra os braços para trás, em arco, até ficarem alinhados com o corpo.', 'Volte devagar até a frente.'],
  ['Juntar as escápulas com força, levando o trabalho para o meio das costas.', 'Tirar o peito do apoio.'],
  'Para focar no deltoide posterior, pense em levar as mãos para longe, para os lados, e não em espremer as escápulas.'],
'crucifixo-inverso-cabo': [
  'Polias na altura dos ombros. Cruze os cabos: a mão direita segura o cabo da esquerda e vice-versa, ou segure direto na ponta do cabo.',
  ['Comece com os braços cruzados à frente, cotovelos levemente flexionados.', 'Abra os braços para os lados e para trás até ficarem alinhados com os ombros.', 'Volte devagar até cruzar de novo.'],
  ['Puxar com os braços dobrando, virando uma remada.', 'Inclinar o corpo para trás.'],
  'Mantenha o peito alto e os ombros baixos. Carga leve e muitas repetições funcionam bem para o deltoide posterior.'],
'crucifixo-inverso-halter': [
  'Com halteres leves, incline o tronco à frente com o quadril para trás até quase ficar paralelo ao chão, coluna neutra. Ou deite de bruços num banco inclinado.',
  ['Halteres pendurados abaixo dos ombros, palmas uma de frente para a outra, cotovelos levemente flexionados.', 'Abra os braços para os lados até a altura dos ombros.', 'Desça devagar.'],
  ['Levantar o tronco durante o movimento.', 'Usar carga alta e balançar.'],
  'A versão deitada no banco inclinado tira o esforço da lombar e isola melhor o ombro.'],
'face-pull': [
  'Corda na polia na altura do rosto. Segure a corda com as palmas voltadas para baixo ou uma de frente para a outra e dê um passo para trás.',
  ['Comece com os braços estendidos à frente.', 'Puxe a corda em direção ao rosto, abrindo as mãos e levando os cotovelos para fora e para trás.', 'Termine com as mãos ao lado das orelhas, como quem faz pose de bíceps.', 'Volte devagar.'],
  ['Puxar a corda para o pescoço ou para o peito.', 'Inclinar o tronco para trás com carga alta.'],
  'É dos melhores exercícios para a saúde do ombro. Use carga moderada e foque em girar os braços para trás no fim.'],
});
Object.assign(INS, {
'rosca-halter': [
  'Em pé, pés na largura do quadril, halteres ao lado do corpo com as palmas para frente. Cotovelos colados na lateral do tronco e ombros para trás.',
  ['Flexione os cotovelos trazendo os halteres em direção aos ombros, sem mover os cotovelos para frente.', 'Contraia o bíceps no topo por um instante.', 'Desça devagar até estender os braços por completo.'],
  ['Balançar o tronco para subir o peso.', 'Levar os cotovelos para frente no fim, tirando a tensão do bíceps.', 'Parar a descida no meio do caminho.'],
  'Comece com as palmas viradas para o corpo e gire para cima durante a subida. Essa rotação (supinação) contrai mais o bíceps.'],
'rosca-barra': [
  'Em pé, pegada na largura dos ombros, palmas para frente, barra apoiada nas coxas. Cotovelos junto ao corpo, joelhos levemente soltos e abdômen firme.',
  ['Suba a barra flexionando os cotovelos, sem mexer o tronco.', 'Leve até perto dos ombros e contraia o bíceps.', 'Desça controlando até estender os braços.'],
  ['Jogar o quadril para frente e o tronco para trás para ajudar.', 'Cotovelos indo para trás ou para frente durante o movimento.'],
  'Se sentir dor nos punhos com a barra reta, use a barra W.'],
'rosca-w': [
  'Segure a barra W na parte inclinada interna ou externa, palmas para frente. Cotovelos ao lado do corpo, tronco firme.',
  ['Flexione os cotovelos subindo a barra até perto dos ombros.', 'Segure um instante no topo.', 'Desça devagar até estender os braços.'],
  ['Usar balanço do corpo.', 'Subir os cotovelos junto com a barra.'],
  'A pegada interna (mais fechada) enfatiza a cabeça longa do bíceps; a externa, a cabeça curta.'],
'rosca-inclinada': [
  'Banco inclinado entre 45° e 60°. Sente com as costas apoiadas e deixe os braços pendurados ao lado do corpo, atrás da linha do tronco, palmas para frente.',
  ['Flexione os cotovelos subindo os halteres, mantendo os braços apontados para o chão.', 'Contraia o bíceps no topo.', 'Desça devagar até estender totalmente, sentindo o bíceps alongar.'],
  ['Levar os cotovelos para frente durante a subida.', 'Tirar a cabeça e os ombros do encosto.'],
  'O braço atrás do corpo alonga mais o bíceps. Use carga menor que na rosca em pé.'],
'rosca-cabo': [
  'Barra ou alça na polia baixa. Fique em pé de frente para a polia, um passo afastado, cotovelos colados ao corpo.',
  ['Flexione os cotovelos trazendo a barra até perto dos ombros.', 'Contraia no topo.', 'Desça devagar até estender os braços.'],
  ['Inclinar o corpo para trás.', 'Afastar os cotovelos do tronco.'],
  'O cabo mantém tensão em toda a amplitude, inclusive no fim da descida. Bom para séries mais longas.'],
'rosca-scott': [
  'Ajuste o banco Scott para a parte de trás dos braços apoiar inteira no estofado, com as axilas encostadas no topo. Pegada na largura dos ombros, palmas para cima.',
  ['Suba a barra flexionando os cotovelos até os antebraços ficarem quase verticais.', 'Contraia o bíceps.', 'Desça devagar até quase estender os braços, sem soltar o peso no fim.'],
  ['Deixar a barra cair na descida, o que pode lesionar o tendão do bíceps.', 'Tirar os braços do apoio para usar o corpo.'],
  'O ponto mais difícil e mais arriscado é perto da extensão total. Controle bem os últimos centímetros da descida.'],
'rosca-scott-maquina': [
  'Regule o assento para os braços apoiarem inteiros no estofado, axilas encostadas no topo do apoio. Segure as pegadas com as palmas para cima.',
  ['Flexione os cotovelos trazendo as pegadas em direção aos ombros.', 'Segure um instante no topo.', 'Volte devagar até quase estender os braços.'],
  ['Assento alto ou baixo demais, deixando o cotovelo fora do eixo da máquina.', 'Soltar o peso de uma vez na descida.'],
  'O cotovelo deve ficar alinhado com o eixo de giro da máquina. Isso deixa a resistência uniforme.'],
'rosca-martelo': [
  'Em pé, halteres ao lado do corpo com as palmas uma de frente para a outra, como quem segura um martelo. Cotovelos colados ao tronco.',
  ['Suba os halteres flexionando os cotovelos, mantendo a pegada neutra o tempo todo.', 'Leve até perto dos ombros.', 'Desça devagar até estender os braços.'],
  ['Balançar o corpo.', 'Girar os punhos durante o movimento.'],
  'A pegada neutra trabalha muito o braquial e o braquiorradial, o que dá espessura ao braço e ao antebraço.'],
'rosca-martelo-corda': [
  'Corda na polia baixa. Segure as pontas da corda com as palmas uma de frente para a outra, cotovelos junto ao corpo.',
  ['Flexione os cotovelos subindo a corda até perto dos ombros.', 'Afaste levemente as pontas da corda no topo.', 'Desça devagar até estender os braços.'],
  ['Inclinar o tronco para trás.', 'Cotovelos saindo do lugar.'],
  'Funciona bem como último exercício de braço, com séries de 12 a 15 repetições.'],
'triceps-frances-cabo': [
  'Corda na polia baixa ou média. De costas para a máquina, leve a corda por cima da cabeça com os cotovelos apontando para frente. Um pé à frente do outro e tronco levemente inclinado.',
  ['Comece com os cotovelos flexionados e as mãos atrás da cabeça.', 'Estenda os cotovelos levando a corda para frente e para cima, sem mexer os braços.', 'Volte devagar até sentir o tríceps alongar.'],
  ['Abrir os cotovelos para os lados.', 'Mover os braços inteiros em vez de só os antebraços.'],
  'O braço acima da cabeça alonga a cabeça longa do tríceps, que é a maior parte do músculo.'],
'triceps-frances-halter': [
  'Sente num banco com encosto. Segure um halter com as duas mãos pela parte de cima do disco e leve-o acima da cabeça, braços estendidos.',
  ['Flexione os cotovelos descendo o halter atrás da cabeça.', 'Desça até sentir o tríceps alongar, cotovelos apontando para cima.', 'Estenda os cotovelos voltando à posição inicial.'],
  ['Abrir muito os cotovelos.', 'Arquear a lombar.'],
  'Mantenha o abdômen firme e as costas no encosto. O movimento acontece só nos cotovelos.'],
'triceps-frances-pe': [
  'Em pé, pés na largura do quadril. Segure um halter com as duas mãos acima da cabeça, braços estendidos e abdômen contraído.',
  ['Flexione os cotovelos descendo o halter atrás da cabeça.', 'Mantenha os cotovelos apontando para frente e próximos da cabeça.', 'Estenda os braços voltando ao topo.'],
  ['Arquear a lombar para compensar.', 'Deixar os cotovelos abrirem para os lados.'],
  'Contraia glúteos e abdômen para proteger a lombar. Se for difícil manter a coluna neutra, faça sentado.'],
'triceps-testa': [
  'Deite no banco reto com a barra W acima do peito, braços estendidos, pegada na parte interna da barra.',
  ['Incline levemente os braços para trás, em direção à cabeça.', 'Flexione os cotovelos descendo a barra em direção à testa ou um pouco atrás da cabeça.', 'Estenda os cotovelos voltando à posição inicial.'],
  ['Abrir os cotovelos para os lados.', 'Mover os ombros e transformar em pullover.'],
  'Descer a barra um pouco atrás da cabeça, e não na testa, aumenta o alongamento do tríceps e costuma ser mais confortável para o cotovelo.'],
'triceps-corda': [
  'Corda na polia alta. Fique em pé de frente para a máquina, tronco levemente inclinado à frente, cotovelos colados ao corpo.',
  ['Comece com os cotovelos flexionados e as mãos na altura do peito.', 'Estenda os cotovelos levando a corda para baixo.', 'No fim, afaste as pontas da corda para os lados.', 'Volte devagar até os antebraços passarem da horizontal.'],
  ['Deixar os cotovelos subirem e irem para frente na volta.', 'Inclinar demais o tronco e usar o peso do corpo.'],
  'Abrir a corda no final aumenta a contração. Mantenha os cotovelos parados como se estivessem presos ao corpo.'],
'triceps-barra': [
  'Barra reta ou V na polia alta. Pegada na largura dos ombros, palmas para baixo, cotovelos colados ao corpo.',
  ['Estenda os cotovelos levando a barra até as coxas.', 'Contraia o tríceps embaixo.', 'Suba devagar até os antebraços ficarem um pouco acima da horizontal.'],
  ['Mover os ombros e os cotovelos.', 'Usar o peso do corpo para empurrar.'],
  'Permite mais carga que a corda. Bom para trabalhar força com 8 a 12 repetições.'],
'mergulho-maquina': [
  'Sente na máquina com as costas apoiadas e segure as pegadas ao lado do corpo. Ajuste o assento para os cotovelos começarem a cerca de 90°.',
  ['Empurre as pegadas para baixo até estender os cotovelos.', 'Mantenha os cotovelos próximos ao corpo.', 'Volte devagar até os cotovelos formarem uns 90°.'],
  ['Deixar os ombros subirem em direção às orelhas.', 'Afastar as costas do encosto.'],
  'É uma alternativa segura às paralelas para quem ainda não tem força ou sente o ombro no mergulho livre.'],
'paralelas': [
  'Segure as barras paralelas com os braços estendidos, corpo suspenso. Para focar o tríceps, mantenha o tronco o mais vertical possível.',
  ['Desça flexionando os cotovelos, que apontam para trás.', 'Desça até os braços ficarem paralelos ao chão ou um pouco abaixo, se o ombro estiver confortável.', 'Empurre para cima até estender os braços.'],
  ['Descer demais e forçar a frente do ombro.', 'Deixar os ombros subirem em direção às orelhas.'],
  'Se ainda não consegue o peso corporal, use a máquina graviton ou elástico. Quando ficar fácil, adicione carga com cinto.'],
'supino-fechado': [
  'Deite no banco reto. Pegada na largura dos ombros, não mais fechada que isso, para poupar os punhos. Escápulas juntas e pés firmes.',
  ['Tire a barra e posicione-a sobre os ombros.', 'Desça até a parte baixa do peito com os cotovelos próximos ao corpo.', 'Empurre de volta até estender os braços.'],
  ['Pegada muito fechada, com as mãos quase se tocando, o que sobrecarrega os punhos.', 'Abrir os cotovelos, virando um supino comum.'],
  'É um dos exercícios que mais permitem carga para o tríceps. Bom para treinos de força.'],
'agachamento': [
  'Apoie a barra no trapézio, abaixo da nuca, mãos um pouco mais abertas que os ombros. Pés na largura dos ombros ou um pouco mais, pontas levemente para fora. Peito alto e abdômen firme, como quem vai levar um soco.',
  ['Inspire, segure o ar e comece o movimento levando o quadril para trás e dobrando os joelhos ao mesmo tempo.', 'Desça mantendo os joelhos na direção das pontas dos pés e o peso no meio do pé.', 'Desça até o quadril ficar na altura dos joelhos ou abaixo, desde que a lombar continue neutra.', 'Suba empurrando o chão com o pé inteiro, quadril e ombros subindo juntos, e solte o ar no fim.'],
  ['Joelhos caindo para dentro na subida.', 'Calcanhares saindo do chão.', 'Lombar arredondando no fundo do agachamento.', 'Subir o quadril antes do tronco, transformando a subida num bom dia.'],
  'Use um suporte com travas de segurança na altura certa. Assim você pode tentar a última repetição sem medo de ficar preso embaixo da barra.'],
'agachamento-smith': [
  'Barra apoiada no trapézio. Pés um pouco à frente da linha da barra, na largura dos ombros. Peito alto e abdômen firme.',
  ['Destrave a barra e desça levando o quadril para trás e dobrando os joelhos.', 'Desça até as coxas ficarem paralelas ao chão ou um pouco abaixo.', 'Suba empurrando o chão com o pé inteiro.'],
  ['Pés exatamente embaixo da barra, o que força os joelhos e a lombar no trilho fixo.', 'Joelhos caindo para dentro.'],
  'Pés mais à frente enfatizam glúteos e posteriores; pés mais embaixo do corpo enfatizam quadríceps.'],
'hack': [
  'Apoie as costas e os ombros nas almofadas da máquina. Pés na plataforma na largura dos ombros, na parte do meio ou um pouco abaixo.',
  ['Destrave a máquina e desça dobrando os joelhos, costas sempre apoiadas.', 'Desça até as coxas passarem da paralela, se a lombar continuar encostada.', 'Suba empurrando a plataforma com o pé inteiro, sem travar os joelhos no topo.'],
  ['Calcanhares saindo da plataforma.', 'Lombar descolando do encosto no fundo.'],
  'É um dos melhores exercícios para quadríceps porque a máquina segura o tronco e deixa você focar só nas pernas.'],
'leg-press': [
  'Sente com as costas e o quadril bem apoiados no encosto. Pés na plataforma na largura do quadril, no meio da altura. Segure as alças laterais.',
  ['Destrave a plataforma com as pernas quase estendidas.', 'Desça dobrando os joelhos em direção ao peito, joelhos alinhados com as pontas dos pés.', 'Desça até onde o quadril continua apoiado no banco, sem a lombar descolar.', 'Empurre de volta sem travar os joelhos no topo.'],
  ['Descer tanto que o quadril sai do encosto e a lombar arredonda.', 'Travar os joelhos com força no topo.', 'Joelhos caindo para dentro.'],
  'Pés mais altos na plataforma trabalham mais glúteos e posteriores; mais baixos, mais quadríceps.'],
'goblet': [
  'Segure um halter ou kettlebell junto ao peito, cotovelos apontando para baixo. Pés um pouco mais abertos que os ombros, pontas levemente para fora.',
  ['Desça levando o quadril para baixo entre os calcanhares, tronco ereto.', 'Desça até os cotovelos tocarem a parte de dentro dos joelhos.', 'Suba empurrando o chão com o pé inteiro.'],
  ['Inclinar o tronco à frente e deixar o peso puxar o corpo.', 'Calcanhares saindo do chão.'],
  'É o melhor exercício para aprender o padrão do agachamento. O peso à frente ajuda a manter o tronco ereto.'],
'bulgaro': [
  'Fique de costas para um banco, a uns dois passos dele, e apoie o peito do pé de trás sobre o banco. Halteres ao lado do corpo. O pé da frente fica afastado o bastante para o joelho não passar muito da ponta do pé.',
  ['Desça o corpo na vertical, dobrando o joelho da frente.', 'Desça até a coxa da frente ficar perto da paralela ao chão.', 'Suba empurrando o chão com o pé da frente inteiro.', 'Faça todas as repetições de um lado e depois troque.'],
  ['Pé da frente muito perto do banco, sobrecarregando o joelho.', 'Empurrar com a perna de trás.', 'Perder o equilíbrio e o joelho da frente balançar para os lados.'],
  'Tronco mais inclinado à frente enfatiza glúteo; mais ereto, enfatiza quadríceps.'],
'afundo': [
  'Em pé, halteres ao lado do corpo, pés na largura do quadril.',
  ['Dê um passo à frente amplo.', 'Desça o corpo até o joelho de trás quase tocar o chão, os dois joelhos perto de 90°.', 'Empurre com o pé da frente para voltar à posição inicial.', 'Alterne as pernas ou faça todas de um lado.'],
  ['Passo curto demais, jogando o joelho da frente muito à frente.', 'Tronco caindo para frente.', 'Joelho da frente caindo para dentro.'],
  'Se o equilíbrio for um problema, comece com o afundo parado (sem dar o passo) ou segure em um apoio.'],
'extensora': [
  'Sente com as costas apoiadas e ajuste o encosto para o joelho ficar alinhado com o eixo da máquina. O rolo fica na frente do tornozelo, logo acima do pé. Segure as alças laterais.',
  ['Estenda os joelhos levantando o rolo até as pernas ficarem quase retas.', 'Contraia o quadríceps no topo por um segundo.', 'Desça devagar até os joelhos ficarem a uns 90°.'],
  ['Joelho fora do eixo da máquina.', 'Chutar o peso e deixar ele cair na volta.', 'Levantar o quadril do banco.'],
  'Segurar um segundo no topo com a perna estendida aumenta muito o trabalho do quadríceps, principalmente da parte perto do joelho.'],
'cadeira-flexora': [
  'Sente com as costas apoiadas e ajuste o encosto para o joelho ficar alinhado com o eixo da máquina. O rolo de baixo fica atrás do tornozelo e o de cima prende a coxa logo acima do joelho.',
  ['Flexione os joelhos levando o rolo para baixo e para trás.', 'Vá até onde conseguir, sem tirar o quadril do banco.', 'Volte devagar até quase estender as pernas.'],
  ['Rolo de cima solto, deixando a coxa subir.', 'Movimento rápido e sem controle na volta.'],
  'Incline o tronco um pouco à frente durante a série. Isso alonga mais os posteriores e aumenta o trabalho.'],
'mesa-flexora': [
  'Deite de bruços com os joelhos logo após a borda do banco e o rolo atrás dos tornozelos. Segure as alças e mantenha o quadril colado no banco.',
  ['Flexione os joelhos levando os calcanhares em direção ao glúteo.', 'Contraia os posteriores no topo.', 'Desça devagar até quase estender as pernas.'],
  ['Levantar o quadril do banco para ajudar.', 'Usar impulso e soltar o peso na descida.'],
  'Pressione o quadril contra o banco o tempo todo. É isso que impede a lombar de compensar.'],
'stiff-halter': [
  'Em pé, pés na largura do quadril, halteres à frente das coxas, joelhos levemente flexionados.',
  ['Leve o quadril para trás como se fosse fechar uma porta com o bumbum, deslizando os halteres rente às pernas.', 'Desça mantendo a coluna neutra até sentir os posteriores da coxa alongarem, geralmente com os halteres na altura da canela.', 'Volte empurrando o quadril para frente até ficar em pé.'],
  ['Arredondar a lombar para descer mais.', 'Dobrar demais os joelhos e virar um agachamento.', 'Afastar os halteres do corpo.'],
  'A amplitude certa é até onde a coluna continua neutra. Descer mais que isso não trabalha mais os posteriores, só a lombar.'],
'stiff-barra': [
  'Pegada na largura dos ombros, barra à frente das coxas, pés na largura do quadril, joelhos levemente flexionados e abdômen firme.',
  ['Leve o quadril para trás deslizando a barra rente às coxas e às pernas.', 'Mantenha a coluna neutra e desça até sentir os posteriores alongarem, geralmente com a barra logo abaixo dos joelhos.', 'Volte empurrando o quadril para frente e contraindo os glúteos no topo.'],
  ['Arredondar a lombar.', 'Barra se afastando do corpo, o que sobrecarrega a lombar.', 'Jogar o quadril para frente demais no topo, arqueando as costas.'],
  'No terra romeno a barra sai do alto e não encosta no chão entre as repetições. O foco é o alongamento dos posteriores.'],
'hiperextensao': [
  'Ajuste o banco romano para a borda do apoio ficar logo abaixo do quadril, deixando o tronco livre para dobrar. Calcanhares presos e braços cruzados no peito.',
  ['Desça o tronco dobrando no quadril, mantendo a coluna neutra.', 'Suba até o corpo ficar em linha reta, contraindo glúteos e posteriores.', 'Não passe da linha do corpo no topo.'],
  ['Hiperestender a lombar no topo, arqueando para trás.', 'Usar impulso para subir.'],
  'Para dar ênfase ao glúteo, arredonde levemente a parte de cima das costas e aponte os pés um pouco para fora.'],
'elevacao-pelvica': [
  'Sente no chão com a parte de baixo das escápulas apoiada na borda de um banco. Barra sobre o quadril, com uma proteção. Pés no chão na largura do quadril, a uma distância em que as canelas fiquem verticais no topo.',
  ['Empurre o chão com os calcanhares e suba o quadril até o tronco ficar alinhado com as coxas.', 'No topo, contraia forte os glúteos e mantenha o queixo levemente encolhido.', 'Desça o quadril controlando até perto do chão.'],
  ['Arquear a lombar no topo em vez de estender o quadril.', 'Pés longe demais, levando o trabalho para os posteriores.', 'Pés perto demais, levando o trabalho para o quadríceps.'],
  'Mantenha o olhar à frente, não para o teto. Isso ajuda a girar a pelve e a contrair o glúteo sem arquear as costas.'],
'ponte': [
  'Deite de costas no chão, joelhos dobrados e pés apoiados na largura do quadril. Barra sobre o quadril com proteção, segurando com as mãos.',
  ['Empurre o chão com os calcanhares subindo o quadril.', 'Suba até o corpo ficar em linha dos ombros aos joelhos.', 'Contraia os glúteos por um segundo no topo e desça devagar.'],
  ['Arquear a lombar no topo.', 'Joelhos abrindo ou fechando durante o movimento.'],
  'A amplitude é menor que na elevação pélvica com banco, mas é mais fácil de montar e boa para aprender a contrair o glúteo.'],
'hiperext-reversa': [
  'Deite de bruços na máquina com o quadril na borda e as pernas penduradas. Prenda os tornozelos no rolo ou na alça e segure as pegadas da frente.',
  ['Eleve as pernas estendidas para trás até ficarem alinhadas com o tronco.', 'Contraia os glúteos no topo.', 'Desça controlando, sem deixar o peso balançar.'],
  ['Subir as pernas acima da linha do tronco, arqueando a lombar.', 'Balançar o peso com impulso.'],
  'Além do glúteo, trabalha a lombar de forma suave e costuma ser bem tolerado por quem tem desconforto lombar.'],
'coice-cabo': [
  'Prenda uma tornozeleira na polia baixa. Fique de frente para a máquina, segure no aparelho e incline o tronco levemente à frente, com o joelho de apoio levemente flexionado.',
  ['Leve a perna para trás e um pouco para cima, com o joelho levemente flexionado.', 'Contraia o glúteo no fim sem arquear a lombar.', 'Volte devagar até a perna passar um pouco à frente do corpo.'],
  ['Arquear a lombar para levar a perna mais alto.', 'Girar o quadril para o lado.'],
  'A amplitude útil é curta. Pare quando sentir que a lombar começaria a arquear.'],
'abducao': [
  'Sente com as costas apoiadas e as pernas encostadas nas almofadas pelo lado de fora dos joelhos.',
  ['Afaste as pernas empurrando as almofadas para fora.', 'Segure um instante na abertura máxima.', 'Volte devagar sem deixar as placas baterem.'],
  ['Usar impulso e soltar as pernas na volta.', 'Inclinar o tronco para frente e para trás a cada repetição.'],
  'Inclinar o tronco à frente e manter essa posição durante a série enfatiza o glúteo máximo; sentado reto, o glúteo médio.'],
'pant-pe': [
  'Apoie os ombros nas almofadas da máquina e a ponta dos pés na borda do degrau, calcanhares para fora. Joelhos estendidos, mas não travados.',
  ['Desça os calcanhares abaixo do degrau até sentir a panturrilha alongar.', 'Segure um segundo embaixo.', 'Suba na ponta dos pés o mais alto que conseguir e contraia.'],
  ['Fazer repetições rápidas e curtas, quicando.', 'Dobrar os joelhos para ajudar a subir.'],
  'A pausa de um segundo no alongamento tira o efeito mola do tendão e faz a panturrilha trabalhar de verdade.'],
'pant-sentado': [
  'Sente com a ponta dos pés no degrau e a almofada sobre as coxas, logo acima dos joelhos.',
  ['Destrave a máquina e desça os calcanhares até alongar a panturrilha.', 'Segure um segundo embaixo.', 'Suba na ponta dos pés o máximo que conseguir.'],
  ['Amplitude curta.', 'Usar impulso.'],
  'Com o joelho dobrado o trabalho vai mais para o sóleo, músculo que fica por baixo do gastrocnêmio. Combine com a versão em pé.'],
'pant-legpress': [
  'Sente no leg press e apoie apenas a ponta dos pés na borda de baixo da plataforma, calcanhares para fora. Pernas estendidas, sem destravar a máquina.',
  ['Empurre a plataforma com a ponta dos pés, estendendo os tornozelos.', 'Volte devagar até sentir a panturrilha alongar.', 'Repita com amplitude completa.'],
  ['Destravar a plataforma, o que é perigoso se o pé escorregar.', 'Dobrar os joelhos durante o movimento.'],
  'Use calçado com boa aderência. O pé escorregar da plataforma é o principal risco deste exercício.'],
'pant-smith': [
  'Coloque um step ou anilha sob a barra do Smith. Barra apoiada no trapézio, ponta dos pés na borda do step.',
  ['Destrave a barra e desça os calcanhares até alongar.', 'Suba na ponta dos pés o mais alto possível.', 'Desça devagar.'],
  ['Step instável ou escorregadio.', 'Repetições curtas e rápidas.'],
  'Uma alternativa quando a máquina de panturrilha está ocupada.'],
'abd-polia': [
  'Corda na polia alta. Ajoelhe de frente para a máquina e segure a corda ao lado da cabeça, quadril um pouco atrás dos joelhos.',
  ['Flexione o tronco enrolando a coluna, levando os cotovelos em direção às coxas.', 'Contraia o abdômen no fim.', 'Volte devagar até alongar o abdômen.'],
  ['Puxar com os braços.', 'Sentar sobre os calcanhares, transformando o movimento em flexão de quadril.'],
  'O quadril fica parado. Pense em aproximar as costelas da pelve, enrolando a coluna como uma lagarta.'],
});
Object.assign(INS, {
'abd-maquina': [
  'Ajuste o assento para o eixo da máquina ficar na altura da cintura. Segure as pegadas e prenda os pés nos rolos, se houver.',
  ['Flexione o tronco enrolando a coluna para frente.', 'Contraia o abdômen no fim por um segundo.', 'Volte devagar sem deixar as placas baterem.'],
  ['Puxar com os braços em vez do abdômen.', 'Movimento rápido, usando impulso.'],
  'Expire durante a flexão. Soltar o ar ajuda a fechar as costelas e contrair mais o abdômen.'],
'elev-pernas': [
  'Deite de costas num banco reto e segure a borda atrás da cabeça. Pernas estendidas ou levemente flexionadas.',
  ['Suba as pernas até ficarem perpendiculares ao corpo.', 'No fim, tire levemente o quadril do banco, enrolando a pelve.', 'Desça devagar até as pernas ficarem quase na linha do banco, sem a lombar descolar.'],
  ['Deixar a lombar arquear na descida.', 'Balançar as pernas.'],
  'Joelhos flexionados deixam o exercício mais fácil. Estenda as pernas aos poucos conforme ganhar força.'],
'elev-pernas-barra': [
  'Pendure-se na barra fixa com pegada na largura dos ombros, ombros ativos (afastados das orelhas) e corpo parado.',
  ['Suba as pernas estendidas à frente até a altura do quadril ou mais.', 'Enrole a pelve no fim, levando o quadril levemente para frente.', 'Desça devagar sem balançar o corpo.'],
  ['Balançar para ganhar impulso.', 'Subir só as pernas sem enrolar a pelve, trabalhando apenas os flexores do quadril.'],
  'Comece com os joelhos dobrados (elevação de joelhos) e estenda as pernas quando conseguir controlar o balanço.'],
'prancha': [
  'Apoie os antebraços no chão com os cotovelos abaixo dos ombros e as pernas estendidas na ponta dos pés.',
  ['Contraia abdômen e glúteos, deixando o corpo em linha reta da cabeça aos calcanhares.', 'Empurre o chão com os antebraços, afastando levemente as escápulas.', 'Respire normalmente e mantenha a posição pelo tempo planejado.'],
  ['Quadril caindo, arqueando a lombar.', 'Quadril alto demais, aliviando o abdômen.', 'Prender a respiração.'],
  'Uma prancha de 20 a 30 segundos com contração máxima vale mais que 2 minutos relaxado. Tente puxar os cotovelos em direção aos pés sem movê-los.'],
'abd-solo': [
  'Deite de costas, joelhos dobrados e pés no chão. Mãos ao lado da cabeça sem puxar o pescoço, ou cruzadas no peito.',
  ['Enrole o tronco tirando as escápulas do chão, aproximando as costelas da pelve.', 'Contraia o abdômen no topo.', 'Desça devagar até apoiar os ombros de novo.'],
  ['Puxar a cabeça com as mãos.', 'Subir o tronco inteiro com impulso, usando os flexores do quadril.'],
  'Não precisa sentar por completo. O abdômen trabalha nos primeiros 30° da subida.'],
'supino-decl-barra': [
  'Deite no banco declinado com as pernas presas nos rolos. Pegada um pouco mais larga que os ombros, escápulas juntas.',
  ['Tire a barra do suporte (de preferência com ajuda) e posicione-a sobre o peito.', 'Desça até tocar a parte baixa do peito.', 'Empurre de volta até estender os braços.'],
  ['Descer a barra no pescoço.', 'Tirar a barra do suporte sozinho com carga alta.'],
  'Ênfase na parte inferior do peitoral. Peça ajuda para tirar e colocar a barra, já que a posição dificulta.'],
'supino-decl-halter': [
  'Deite no banco declinado com as pernas presas, halteres acima do peito, palmas para os pés.',
  ['Desça os halteres até a altura do peito, cotovelos a cerca de 45°.', 'Empurre para cima aproximando levemente os halteres.', 'Mantenha os antebraços verticais.'],
  ['Descer demais e perder o controle.', 'Levantar a cabeça do banco.'],
  'Para entrar na posição, deite com os halteres no peito. Para sair, traga-os ao peito e sente com cuidado.'],
'supino-decl-maquina': [
  'Regule o assento para as pegadas ficarem na altura da parte baixa do peito. Costas apoiadas e pés firmes.',
  ['Empurre as pegadas para frente e para baixo até quase estender os cotovelos.', 'Volte devagar até sentir o peito alongar.'],
  ['Tirar as costas do encosto.', 'Travar os cotovelos.'],
  'Boa opção para trabalhar a parte inferior do peito sem a montagem trabalhosa do banco declinado.'],
'crucifixo-incl': [
  'Banco inclinado entre 30° e 45°. Halteres acima da parte de cima do peito, palmas uma de frente para a outra, cotovelos levemente flexionados.',
  ['Abra os braços em arco até os halteres ficarem na altura do peito.', 'Sinta o peito superior alongar.', 'Volte pelo mesmo arco até os halteres se aproximarem.'],
  ['Esticar os cotovelos.', 'Descer além do confortável para o ombro.'],
  'Mantenha o mesmo ângulo nos cotovelos do início ao fim. O movimento acontece no ombro.'],
'supino-cabo': [
  'Polias na altura do peito. Fique no centro do crossover, um pé à frente do outro, alças na altura do peito e cotovelos para trás.',
  ['Empurre as alças para frente até estender os braços, aproximando as mãos.', 'Contraia o peito no fim.', 'Volte devagar até sentir o peitoral alongar.'],
  ['Inclinar o tronco para frente para usar o peso do corpo.', 'Deixar os ombros irem para frente no fim.'],
  'O cabo dá tensão constante. Funciona bem com repetições mais altas e no fim do treino de peito.'],
'paralelas-peito': [
  'Segure as barras paralelas com os braços estendidos. Incline o tronco à frente, cerca de 30°, e cruze as pernas atrás.',
  ['Desça flexionando os cotovelos, que se abrem levemente para os lados.', 'Desça até sentir o peito alongar, sem forçar o ombro.', 'Empurre para cima mantendo o tronco inclinado.'],
  ['Descer além do confortável, forçando a frente do ombro.', 'Ficar com o tronco vertical, o que tira o foco do peito.'],
  'Se o ombro reclamar, reduza a amplitude. A parte final da descida é onde está o maior risco.'],
'flexao-inclinada': [
  'Apoie as mãos num banco firme, um pouco mais abertas que os ombros. Pernas estendidas, corpo em linha reta.',
  ['Desça o peito em direção à borda do banco, cotovelos a cerca de 45°.', 'Empurre o banco para subir.', 'Mantenha o abdômen e os glúteos contraídos.'],
  ['Quadril caindo.', 'Fazer só metade do movimento.'],
  'Quanto mais alto o apoio, mais fácil. Vá baixando a altura conforme ganhar força até fazer a flexão no chão.'],
'supino-pegada-neutra': [
  'Banco inclinado entre 30° e 45°. Halteres com as palmas uma de frente para a outra, cotovelos próximos ao corpo.',
  ['Desça os halteres até a altura do peito, mantendo os cotovelos rente ao tronco.', 'Empurre para cima até estender os braços.', 'Controle a descida.'],
  ['Abrir os cotovelos, perdendo a vantagem da pegada neutra.', 'Arquear demais a lombar.'],
  'A pegada neutra costuma ser mais confortável para o ombro e trabalha bem o peito superior e o tríceps.'],
'pullover-halter': [
  'Deite com as costas apoiadas num banco reto, ou atravessado com só a parte de cima das costas apoiada. Segure um halter com as duas mãos acima do peito, cotovelos levemente flexionados.',
  ['Leve o halter em arco para trás da cabeça, mantendo o ângulo dos cotovelos.', 'Desça até sentir o alongamento do dorsal e do peito, sem forçar o ombro.', 'Volte em arco até o halter ficar acima do peito.'],
  ['Dobrar e esticar os cotovelos, virando tríceps.', 'Arquear a lombar para descer mais.'],
  'Pense em puxar o halter com os cotovelos, não com as mãos. Isso deixa o dorsal fazer o trabalho.'],
'pulldown-corda': [
  'Corda na polia alta. Fique em pé a um passo da máquina, quadril para trás e tronco inclinado à frente.',
  ['Segure a corda com os braços quase estendidos.', 'Leve a corda em arco para baixo até as mãos chegarem ao lado das coxas, abrindo um pouco as pontas.', 'Volte em arco até alongar as costas.'],
  ['Dobrar os cotovelos.', 'Mover o tronco a cada repetição.'],
  'A corda permite levar as mãos um pouco mais para trás do que a barra, aumentando a contração do dorsal.'],
'barra-supinada': [
  'Segure a barra com as palmas voltadas para você, mãos na largura dos ombros. Fique pendurado com os braços estendidos e abdômen firme.',
  ['Desça os ombros antes de dobrar os braços.', 'Puxe levando os cotovelos para baixo, junto ao corpo, até o queixo passar a barra.', 'Desça devagar até estender os braços.'],
  ['Balançar o corpo.', 'Não estender os braços embaixo.'],
  'Costuma ser a versão mais fácil da barra fixa porque o bíceps ajuda bastante. Boa porta de entrada.'],
'remada-invertida': [
  'Barra numa altura próxima à da cintura, no Smith ou num suporte. Deite embaixo, segure a barra um pouco mais aberta que os ombros e estenda o corpo em linha reta, apoiado nos calcanhares.',
  ['Puxe o peito em direção à barra, levando os cotovelos para trás.', 'Aproxime as escápulas no topo.', 'Desça devagar até estender os braços.'],
  ['Quadril caindo.', 'Puxar só com os braços sem mexer as escápulas.'],
  'Quanto mais vertical o corpo (barra mais alta), mais fácil. Pés num banco deixam mais difícil.'],
'remada-apoiada-t': [
  'Deite de bruços no apoio inclinado da máquina, peito bem apoiado, pés firmes. Segure as pegadas com os braços estendidos.',
  ['Puxe as pegadas levando os cotovelos para trás.', 'Aproxime as escápulas no topo.', 'Desça devagar até estender os braços e alongar as costas.'],
  ['Tirar o peito do apoio para puxar.', 'Encolher os ombros.'],
  'Com o peito apoiado a lombar fica livre de esforço, então você pode focar totalmente nas costas.'],
'remada-supinada': [
  'Pegada na largura dos ombros com as palmas para frente (supinada). Tronco inclinado entre 30° e 45°, coluna neutra e joelhos levemente flexionados.',
  ['Puxe a barra em direção à parte baixa do abdômen, cotovelos rente ao corpo.', 'Aproxime as escápulas no topo.', 'Desça devagar.'],
  ['Levantar o tronco para ajudar.', 'Arredondar a lombar.'],
  'A pegada supinada mantém os cotovelos mais fechados e enfatiza a parte baixa do dorsal.'],
'remada-incl-halter': [
  'Deite de bruços num banco inclinado a cerca de 30° a 45°, peito apoiado. Halteres pendurados abaixo dos ombros.',
  ['Puxe os halteres levando os cotovelos para trás.', 'Aproxime as escápulas no topo.', 'Desça devagar até estender os braços.'],
  ['Tirar o peito do banco.', 'Levar os halteres em direção ao peito em vez da cintura.'],
  'Cotovelos rente ao corpo trabalham mais o dorsal; cotovelos abertos a 45° trabalham mais o meio das costas.'],
'remada-alta-maquina': [
  'Sente na máquina com o peito apoiado, ajuste o assento para as pegadas ficarem acima da cabeça.',
  ['Puxe as pegadas para baixo e para trás, levando os cotovelos em direção aos quadris.', 'Contraia as costas no fim.', 'Volte devagar até estender os braços acima.'],
  ['Tirar o peito do apoio.', 'Encolher os ombros.'],
  'É um meio-termo entre puxada e remada. Ótimo para o dorsal com pouca exigência de técnica.'],
'remada-smith': [
  'Barra do Smith na altura dos joelhos. Pegada na largura dos ombros, tronco inclinado à frente entre 30° e 45°, coluna neutra e joelhos levemente flexionados.',
  ['Destrave a barra e puxe em direção ao abdômen.', 'Aproxime as escápulas.', 'Desça devagar sem mudar a posição do tronco.'],
  ['Arredondar a lombar.', 'Usar impulso do tronco.'],
  'O trilho fixo facilita manter a trajetória e ajuda a focar na contração das costas.'],
'levantamento-terra': [
  'Pés na largura do quadril, barra sobre o meio do pé (a uns 3 cm da canela). Dobre o quadril e os joelhos até as mãos alcançarem a barra, pegada logo fora das pernas. Canelas encostam na barra, coluna neutra, peito alto e braços estendidos.',
  ['Puxe a folga da barra: tensione os dorsais como se fosse esconder as axilas, até ouvir a barra encostar nas anilhas.', 'Inspire, firme o abdômen e empurre o chão com as pernas, mantendo a barra rente ao corpo.', 'Quando a barra passar dos joelhos, leve o quadril à frente até ficar em pé, sem inclinar para trás.', 'Desça levando o quadril para trás e, depois dos joelhos, dobrando as pernas, com a barra sempre rente.'],
  ['Arredondar a lombar.', 'Começar com o quadril baixo demais (como um agachamento) ou alto demais (como um stiff).', 'Barra se afastando do corpo.', 'Hiperestender a lombar no topo.'],
  'Pense em empurrar o chão para longe, e não em puxar a barra para cima. Isso ajuda a manter a coluna firme e as pernas trabalhando.'],
'terra-sumo': [
  'Pés bem afastados, mais largos que os ombros, pontas para fora. Barra sobre o meio do pé. Mãos por dentro das pernas, na largura dos ombros. Quadril baixo, tronco mais ereto que no terra convencional.',
  ['Empurre os joelhos para fora, na direção das pontas dos pés.', 'Puxe a folga da barra e firme o abdômen.', 'Empurre o chão afastando os pés, como se fosse abrir o piso, até ficar em pé.', 'Desça controlando pelo mesmo caminho.'],
  ['Joelhos caindo para dentro.', 'Quadril subindo antes da barra sair do chão.'],
  'A amplitude é menor que no convencional e o trabalho vai mais para glúteos e adutores. Quem tem fêmur longo costuma se adaptar bem.'],
'encolhimento-barra': [
  'Em pé, pegada na largura dos ombros, barra à frente das coxas, braços estendidos.',
  ['Suba os ombros em direção às orelhas, em linha reta.', 'Segure um segundo no topo.', 'Desça devagar até alongar o trapézio.'],
  ['Girar os ombros para trás em círculo.', 'Dobrar os cotovelos para puxar.'],
  'O movimento é só para cima e para baixo. Girar os ombros não trabalha mais e pode irritar a articulação.'],
'encolhimento-halter': [
  'Em pé, halteres ao lado do corpo, palmas uma de frente para a outra.',
  ['Suba os ombros em direção às orelhas.', 'Segure um segundo no topo.', 'Desça devagar até alongar.'],
  ['Mexer a cabeça para frente.', 'Amplitude curta.'],
  'Os halteres ao lado do corpo deixam o movimento mais natural que a barra à frente.'],
'arnold': [
  'Sente num banco com encosto vertical. Halteres na altura dos ombros com as palmas voltadas para você, como no topo de uma rosca.',
  ['Empurre os halteres para cima girando os punhos ao mesmo tempo.', 'Termine com os braços quase estendidos e as palmas para frente.', 'Desça girando de volta até as palmas ficarem para você.'],
  ['Girar só no topo, sem coordenar com a subida.', 'Arquear a lombar.'],
  'A rotação aumenta a amplitude e o tempo de trabalho do deltoide anterior. Use carga um pouco menor que no desenvolvimento comum.'],
'desenv-barra': [
  'Em pé, barra apoiada na frente dos ombros, pegada um pouco mais larga que os ombros. Glúteos e abdômen contraídos, pés na largura do quadril.',
  ['Afaste levemente a cabeça para trás e empurre a barra para cima em linha reta.', 'Quando a barra passar da testa, leve a cabeça de volta para frente, ficando com a barra acima do meio da cabeça.', 'Desça controlando até a frente dos ombros.'],
  ['Arquear a lombar para empurrar.', 'Empurrar a barra para frente, longe do corpo.', 'Usar as pernas para dar impulso.'],
  'Contrair os glúteos com força trava a pelve e protege a lombar durante todo o movimento.'],
'desenv-maquina-2': [
  'Regule o assento para as pegadas ficarem na altura dos ombros. Costas apoiadas, pés firmes.',
  ['Empurre as pegadas para cima até quase estender os braços.', 'Desça devagar até a altura dos ombros.'],
  ['Tirar a lombar do encosto.', 'Travar os cotovelos.'],
  'Nas máquinas articuladas cada braço trabalha de forma independente. Ótimo para equilibrar os lados.'],
'elev-frontal': [
  'Em pé, halteres à frente das coxas, palmas para o corpo ou uma de frente para a outra.',
  ['Eleve os halteres à frente com os braços quase estendidos.', 'Suba até a altura dos ombros.', 'Desça devagar.'],
  ['Balançar o corpo.', 'Subir acima da cabeça.'],
  'O deltoide anterior já trabalha bastante nos supinos e desenvolvimentos. Use este exercício como complemento, com carga leve.'],
'elev-frontal-cabo': [
  'Polia baixa, de costas para a máquina, segurando a alça entre as pernas ou ao lado do corpo.',
  ['Eleve o braço à frente com o cotovelo quase estendido até a altura do ombro.', 'Desça devagar.'],
  ['Inclinar o corpo para trás.', 'Usar impulso.'],
  'O cabo mantém tensão desde o início do movimento.'],
'elev-frontal-anilha': [
  'Em pé, segure uma anilha pelas laterais com as duas mãos, à frente das coxas.',
  ['Eleve a anilha à frente com os braços quase estendidos até a altura dos olhos.', 'Desça devagar.'],
  ['Arquear a lombar.', 'Usar balanço.'],
  'Segurar a anilha pelas laterais também trabalha a pegada e o antebraço.'],
'rosca-concentrada': [
  'Sente num banco com as pernas afastadas. Apoie a parte de trás do braço na parte de dentro da coxa, halter pendurado com o braço estendido.',
  ['Suba o halter flexionando o cotovelo, sem mexer o braço.', 'Contraia o bíceps no topo.', 'Desça devagar até estender totalmente.'],
  ['Levantar o tronco para ajudar.', 'Encurtar a descida.'],
  'Com o braço apoiado não dá para roubar. Ótimo para sentir o bíceps e trabalhar a contração.'],
'rosca-spider': [
  'Deite de bruços num banco inclinado, peito apoiado e braços pendurados na vertical. Barra W ou halteres, palmas para frente.',
  ['Flexione os cotovelos subindo o peso, braços sempre apontados para o chão.', 'Contraia o bíceps no topo.', 'Desça devagar até estender.'],
  ['Balançar os braços.', 'Tirar o peito do banco.'],
  'O bíceps fica sob tensão máxima na parte de cima do movimento, ao contrário da rosca inclinada.'],
'rosca-inversa': [
  'Em pé, pegada na barra com as palmas para baixo, na largura dos ombros. Cotovelos ao lado do corpo.',
  ['Suba a barra flexionando os cotovelos, punhos retos.', 'Leve até perto dos ombros.', 'Desça devagar.'],
  ['Deixar os punhos dobrarem para baixo.', 'Usar balanço.'],
  'Trabalha muito o braquiorradial, o músculo grande do antebraço. A barra W deixa mais confortável para os punhos.'],
'rosca-cabo-alto': [
  'Polias na altura dos ombros ou acima. Fique no centro do crossover com os braços abertos, segurando as alças com as palmas para cima.',
  ['Flexione os cotovelos trazendo as mãos em direção às orelhas, sem baixar os braços.', 'Contraia o bíceps.', 'Volte devagar até estender.'],
  ['Deixar os cotovelos caírem.', 'Mover os ombros.'],
  'Trabalha o bíceps com o braço elevado, ângulo diferente das roscas comuns. Use carga leve.'],
'rosca-maquina': [
  'Regule o assento para o cotovelo ficar alinhado com o eixo da máquina e os braços apoiados no estofado.',
  ['Flexione os cotovelos trazendo as pegadas em direção aos ombros.', 'Segure um instante no topo.', 'Volte devagar até quase estender.'],
  ['Assento mal regulado.', 'Soltar o peso na volta.'],
  'Permite ir até perto da falha com segurança e sem roubar.'],
'triceps-coice': [
  'Apoie um joelho e uma mão num banco, tronco paralelo ao chão. Segure o halter com o braço colado ao corpo e o cotovelo dobrado a 90°.',
  ['Estenda o cotovelo levando o halter para trás até o braço ficar reto.', 'Contraia o tríceps por um segundo.', 'Volte devagar até 90°.'],
  ['Deixar o braço cair e o cotovelo descer.', 'Balançar o halter.'],
  'Mantenha o braço paralelo ao chão e parado. Só o antebraço se move.'],
});
Object.assign(INS, {
'mergulho-banco': [
  'Sente na borda de um banco e apoie as mãos ao lado do quadril, dedos para frente. Tire o quadril do banco, pernas estendidas à frente ou joelhos dobrados.',
  ['Desça o corpo flexionando os cotovelos, que apontam para trás.', 'Desça até os cotovelos formarem cerca de 90°.', 'Empurre o banco para subir até estender os braços.'],
  ['Descer demais, forçando a frente do ombro.', 'Afastar o corpo do banco.'],
  'Com os joelhos dobrados fica mais fácil. Se sentir o ombro, prefira o tríceps na polia.'],
'triceps-inverso': [
  'Barra reta na polia alta. Pegada na largura dos ombros com as palmas para cima (supinada), cotovelos colados ao corpo.',
  ['Estenda os cotovelos levando a barra até as coxas.', 'Contraia o tríceps.', 'Volte devagar.'],
  ['Cotovelos saindo do corpo.', 'Carga alta demais para a pegada.'],
  'A pegada invertida muda o ângulo e costuma ser sentida mais na parte de dentro do tríceps. Use carga menor.'],
'triceps-halter-deitado': [
  'Deite no banco reto com um halter em cada mão acima do peito, palmas uma de frente para a outra.',
  ['Flexione os cotovelos descendo os halteres ao lado da cabeça.', 'Mantenha os braços apontados para cima e parados.', 'Estenda os cotovelos voltando ao topo.'],
  ['Abrir os cotovelos.', 'Mover os ombros.'],
  'A pegada neutra com halteres costuma ser mais confortável para o cotovelo que a barra.'],
'triceps-maquina': [
  'Regule o assento para o cotovelo ficar alinhado com o eixo da máquina. Braços apoiados no estofado.',
  ['Estenda os cotovelos empurrando as pegadas para baixo.', 'Contraia o tríceps.', 'Volte devagar.'],
  ['Assento mal regulado.', 'Usar o tronco para empurrar.'],
  'Bom para o fim do treino, levando a série perto da falha com segurança.'],
'flexao-diamante': [
  'Em posição de flexão, mãos juntas abaixo do peito, com polegares e indicadores formando um losango, ou na largura dos ombros. Corpo em linha reta.',
  ['Desça com os cotovelos rente ao corpo, apontando para trás.', 'Leve o peito até perto das mãos.', 'Empurre o chão até estender os braços.'],
  ['Abrir os cotovelos.', 'Quadril caindo.'],
  'Se o losango incomodar os punhos, use as mãos na largura dos ombros com os cotovelos colados. O trabalho no tríceps é parecido.'],
'rosca-punho': [
  'Sente com os antebraços apoiados nas coxas ou num banco, punhos para fora da borda, palmas para cima segurando a barra.',
  ['Deixe a barra rolar até a ponta dos dedos.', 'Feche a mão e flexione o punho para cima o máximo possível.', 'Desça devagar.'],
  ['Mover os antebraços.', 'Amplitude curta.'],
  'Repetições altas, entre 15 e 25, funcionam bem para o antebraço.'],
'rosca-punho-inversa': [
  'Sente com os antebraços apoiados, punhos para fora da borda, palmas para baixo segurando a barra.',
  ['Estenda o punho levando a barra para cima.', 'Segure um instante.', 'Desça devagar.'],
  ['Carga alta demais.', 'Mover os antebraços.'],
  'Use carga bem menor que na rosca de punho. Os extensores do punho são mais fracos.'],
'farmer': [
  'Pegue um halter pesado em cada mão, braços ao lado do corpo. Ombros para trás e para baixo, peito alto e abdômen firme.',
  ['Caminhe com passos curtos e firmes.', 'Mantenha o corpo ereto, sem inclinar para os lados.', 'Siga pela distância ou tempo planejado e coloque os halteres no chão com a coluna neutra.'],
  ['Deixar os ombros caírem para frente.', 'Inclinar o corpo para um lado.'],
  'Trabalha pegada, trapézio, core e postura ao mesmo tempo. Para pegar e soltar os halteres, agache como num terra.'],
'agachamento-frontal': [
  'Barra apoiada na frente dos ombros, perto do pescoço, com os cotovelos altos e apontando para frente. Pegada com os dedos sob a barra ou braços cruzados. Pés na largura dos ombros.',
  ['Desça mantendo o tronco o mais ereto possível e os cotovelos altos.', 'Desça até as coxas passarem da paralela, se a mobilidade permitir.', 'Suba empurrando o chão e levando os cotovelos para cima.'],
  ['Cotovelos caindo, o que faz a barra rolar para frente.', 'Inclinar o tronco à frente.'],
  'Exige mobilidade de punho e tornozelo. Calçado com salto, ou anilhas finas sob os calcanhares, ajudam bastante.'],
'step-up': [
  'Fique de frente para um banco firme, de altura em que o joelho fique perto de 90° ao apoiar o pé. Halteres ao lado do corpo.',
  ['Apoie o pé inteiro no banco.', 'Suba empurrando com a perna de cima, sem dar impulso com a de baixo.', 'Desça devagar com controle e repita.'],
  ['Empurrar com o pé que está no chão.', 'Joelho da perna de cima caindo para dentro.'],
  'Faça todas as repetições de uma perna antes de trocar. Mantenha o peso no calcanhar da perna de cima.'],
'afundo-caminhando': [
  'Em pé, mãos na cintura ou halteres ao lado do corpo, com espaço livre à frente.',
  ['Dê um passo amplo à frente e desça até o joelho de trás quase tocar o chão.', 'Empurre com o pé da frente e traga o pé de trás para dar o próximo passo.', 'Siga alternando as pernas.'],
  ['Passos curtos.', 'Tronco caindo à frente.'],
  'Mantenha os pés na largura do quadril, como trilhos, e não numa linha só. Melhora muito o equilíbrio.'],
'afundo-barra': [
  'Barra apoiada no trapézio como no agachamento. Pés na largura do quadril.',
  ['Dê um passo à frente ou para trás.', 'Desça até o joelho de trás quase tocar o chão.', 'Volte à posição inicial empurrando com a perna da frente.'],
  ['Perder o equilíbrio com a barra.', 'Passo curto.'],
  'O afundo para trás costuma ser mais estável e mais amigável para o joelho que o afundo para frente.'],
'sissy': [
  'Em pé, segure num apoio firme. Pés na largura do quadril.',
  ['Fique na ponta dos pés e incline o corpo para trás enquanto dobra os joelhos à frente.', 'Mantenha quadril e tronco alinhados, como uma tábua.', 'Desça até onde conseguir controlar e volte estendendo os joelhos.'],
  ['Dobrar o quadril, virando um agachamento comum.', 'Descer mais do que o joelho tolera.'],
  'Exercício intenso para o quadríceps. Comece com amplitude pequena e aumente aos poucos.'],
'bom-dia': [
  'Barra no trapézio como no agachamento, pés na largura do quadril, joelhos levemente flexionados.',
  ['Leve o quadril para trás inclinando o tronco à frente, coluna neutra.', 'Desça até o tronco ficar quase paralelo ao chão ou até sentir os posteriores alongarem.', 'Volte empurrando o quadril para frente.'],
  ['Arredondar a lombar.', 'Carga alta demais.'],
  'Use carga bem leve no começo. A alavanca longa deixa o exercício mais pesado do que parece.'],
'kettlebell-swing': [
  'Pés um pouco mais abertos que os ombros, kettlebell no chão à frente. Leve o quadril para trás e segure a alça com as duas mãos, coluna neutra.',
  ['Puxe o kettlebell para trás entre as pernas, como um passe de futebol americano.', 'Estenda o quadril com força, contraindo os glúteos, e deixe o kettlebell subir até a altura do peito.', 'Deixe o kettlebell descer e leve o quadril para trás para receber, já emendando a próxima.'],
  ['Agachar em vez de dobrar no quadril.', 'Levantar o kettlebell com os braços.', 'Arquear a lombar no topo.'],
  'Os braços só guiam. A força vem da explosão do quadril. Termine cada repetição em pé, firme, como numa prancha em pé.'],
'stiff-unilateral': [
  'Em pé sobre uma perna, joelho levemente flexionado, halter na mão oposta.',
  ['Incline o tronco à frente levando a perna livre para trás, em linha com o tronco.', 'Desça até sentir o posterior da perna de apoio alongar.', 'Volte contraindo o glúteo da perna de apoio.'],
  ['Abrir o quadril para o lado da perna de trás.', 'Arredondar as costas.'],
  'Segure num apoio com a mão livre se o equilíbrio atrapalhar. O objetivo é sentir o posterior, não se equilibrar.'],
'adutora': [
  'Sente na máquina com as costas apoiadas e as pernas abertas, almofadas na parte de dentro dos joelhos.',
  ['Feche as pernas apertando as almofadas.', 'Segure um instante.', 'Abra devagar até sentir a parte interna da coxa alongar.'],
  ['Abrir mais do que o confortável.', 'Usar impulso.'],
  'Os adutores ajudam bastante no agachamento e no terra. Vale treinar com amplitude controlada.'],
'ponte-solo': [
  'Deite de costas, joelhos dobrados, pés no chão na largura do quadril e braços ao lado do corpo.',
  ['Empurre o chão com os calcanhares e suba o quadril.', 'Suba até o corpo formar uma linha dos ombros aos joelhos.', 'Contraia os glúteos por dois segundos e desça devagar.'],
  ['Arquear a lombar no topo.', 'Empurrar com a ponta dos pés.'],
  'Ótimo como aquecimento antes de agachamentos e terra. Ajuda a ativar o glúteo.'],
'pull-through': [
  'Corda na polia baixa. De costas para a máquina, com o cabo entre as pernas, dê dois passos à frente. Pés um pouco mais abertos que o quadril.',
  ['Leve o quadril para trás deixando a corda passar entre as pernas, coluna neutra.', 'Desça até sentir os posteriores alongarem.', 'Estenda o quadril com força, contraindo os glúteos, até ficar em pé.'],
  ['Agachar em vez de dobrar no quadril.', 'Puxar com os braços.'],
  'Excelente para aprender o movimento de dobrar no quadril antes do stiff e do terra.'],
'pant-burrinho': [
  'Na máquina específica, ou com o tronco inclinado e apoiado, ponta dos pés num degrau e quadril sobre os calcanhares.',
  ['Desça os calcanhares até alongar a panturrilha.', 'Suba na ponta dos pés o mais alto possível.', 'Desça devagar.'],
  ['Amplitude curta.', 'Dobrar os joelhos.'],
  'Com o tronco inclinado a panturrilha fica mais alongada, o que aumenta o trabalho.'],
'pant-halter': [
  'Em pé com a ponta de um pé num degrau, halter na mão do mesmo lado, outra mão segurando num apoio.',
  ['Desça o calcanhar até alongar a panturrilha.', 'Suba na ponta do pé o mais alto possível.', 'Faça as repetições e troque de lado.'],
  ['Quicar embaixo.', 'Dobrar o joelho.'],
  'Uma perna de cada vez dobra a carga sem precisar de muito peso.'],
'abd-russo': [
  'Sente no chão com os joelhos dobrados e incline o tronco para trás, coluna neutra. Pés no chão ou levemente elevados.',
  ['Gire o tronco para um lado levando as mãos (ou um peso) ao lado do quadril.', 'Volte ao centro e gire para o outro lado.', 'Mantenha o abdômen contraído.'],
  ['Mexer só os braços sem girar o tronco.', 'Arredondar a lombar.'],
  'A rotação vem do tronco, não dos braços. Siga as mãos com o olhar para girar o tronco inteiro.'],
'lenhador': [
  'Polia alta ou baixa, de lado para a máquina. Segure a alça com as duas mãos, pés afastados e joelhos levemente flexionados.',
  ['Puxe o cabo em diagonal, de cima para baixo ou de baixo para cima, girando o tronco.', 'Os braços ficam quase estendidos e guiam o movimento.', 'Volte devagar e faça os dois lados.'],
  ['Puxar só com os braços.', 'Girar o quadril em vez do tronco.'],
  'Gire sobre a ponta do pé de trás para deixar o movimento mais natural e proteger o joelho.'],
'roda': [
  'Ajoelhe no chão com as mãos na roda abaixo dos ombros. Abdômen contraído e glúteos firmes.',
  ['Role a roda para frente estendendo o corpo, mantendo a lombar neutra.', 'Vá até onde conseguir sem arquear as costas.', 'Volte puxando a roda com o abdômen.'],
  ['Arquear a lombar.', 'Ir longe demais antes de ter força.'],
  'Comece rolando até uma parede à frente, que limita a distância. Afaste-se dela conforme ficar mais forte.'],
'abd-declinado': [
  'Deite no banco declinado com os pés presos nos rolos e as mãos no peito ou ao lado da cabeça.',
  ['Enrole o tronco subindo até perto da vertical.', 'Contraia o abdômen.', 'Desça devagar sem deixar o tronco cair.'],
  ['Puxar o pescoço.', 'Usar impulso.'],
  'Quanto mais inclinado o banco, mais difícil. Segure uma anilha no peito para progredir.'],
'abd-bicicleta': [
  'Deite de costas, mãos ao lado da cabeça, joelhos dobrados acima do quadril.',
  ['Leve o cotovelo em direção ao joelho oposto enquanto estende a outra perna.', 'Troque de lado como num pedalar.', 'Mantenha a lombar apoiada no chão.'],
  ['Puxar o pescoço.', 'Ir rápido demais sem controle.'],
  'Devagar é mais difícil e mais eficiente. Gire o tronco, não só o cotovelo.'],
'prancha-lateral': [
  'Deite de lado apoiado no antebraço, cotovelo abaixo do ombro, pernas estendidas e pés empilhados.',
  ['Suba o quadril até o corpo ficar em linha reta.', 'Mantenha a posição pelo tempo planejado.', 'Troque de lado.'],
  ['Quadril caindo.', 'Corpo girando para frente ou para trás.'],
  'Joelhos dobrados no chão deixam mais fácil. Elevar a perna de cima deixa mais difícil.'],
'dead-bug': [
  'Deite de costas com os braços estendidos para o teto e os joelhos dobrados a 90° acima do quadril.',
  ['Cole a lombar no chão.', 'Estenda um braço para trás e a perna oposta para frente, devagar.', 'Volte e troque de lado.'],
  ['Lombar descolando do chão.', 'Movimento rápido.'],
  'Expire enquanto estende braço e perna. Isso ajuda a manter a lombar no chão.'],
'escalador': [
  'Posição de prancha alta, mãos abaixo dos ombros, corpo em linha reta.',
  ['Traga um joelho em direção ao peito.', 'Volte e traga o outro joelho, alternando em ritmo.', 'Mantenha o quadril baixo e estável.'],
  ['Quadril subindo.', 'Mãos fora da linha dos ombros.'],
  'Mais lento trabalha mais o abdômen; mais rápido trabalha mais o condicionamento.'],
'abd-obliquo': [
  'Deite de costas com os joelhos dobrados e uma mão atrás da cabeça.',
  ['Suba o tronco girando, levando o ombro em direção ao joelho oposto.', 'Contraia a lateral do abdômen.', 'Desça devagar e faça os dois lados.'],
  ['Puxar a cabeça.', 'Girar só o cotovelo.'],
  'Pense em levar o ombro, e não o cotovelo, até o joelho oposto.'],
'elev-joelhos-paralela': [
  'Apoie os antebraços na cadeira do capitão (paralela com encosto), costas apoiadas e pernas penduradas.',
  ['Suba os joelhos em direção ao peito.', 'No topo, enrole a pelve levando o quadril levemente para frente.', 'Desça devagar sem balançar.'],
  ['Balançar as pernas.', 'Subir só até a horizontal sem enrolar a pelve.'],
  'Quando ficar fácil, faça com as pernas estendidas.'],
'agachamento-livre': [
  'Pés na largura dos ombros, pontas levemente para fora, braços estendidos à frente ou mãos juntas no peito.',
  ['Desça levando o quadril para trás e dobrando os joelhos.', 'Desça até as coxas passarem da paralela, mantendo os calcanhares no chão.', 'Suba empurrando o chão.'],
  ['Joelhos caindo para dentro.', 'Calcanhares saindo do chão.'],
  'Para dificultar sem peso, desça em 3 a 4 segundos ou faça uma pausa de 2 segundos embaixo.'],
'agachamento-salto': [
  'Pés na largura dos ombros, braços ao lado do corpo.',
  ['Agache até as coxas ficarem perto da paralela.', 'Salte com força estendendo quadril, joelhos e tornozelos.', 'Aterrisse suave, na ponta dos pés passando para o pé inteiro, já descendo para o próximo.'],
  ['Aterrissar com os joelhos rígidos.', 'Joelhos caindo para dentro na aterrissagem.'],
  'A aterrissagem silenciosa é sinal de boa técnica. Pare a série quando o salto começar a perder altura.'],
'afundo-salto': [
  'Comece em posição de afundo, uma perna à frente e outra atrás.',
  ['Desça até o joelho de trás quase tocar o chão.', 'Salte trocando as pernas no ar.', 'Aterrisse suave já na posição de afundo com a outra perna à frente.'],
  ['Aterrissar com o joelho de trás batendo no chão.', 'Tronco caindo à frente.'],
  'Exige bastante coordenação. Comece com o afundo alternado sem salto.'],
'agachamento-unilateral': [
  'Em pé sobre uma perna, a outra estendida à frente. Braços à frente para equilíbrio.',
  ['Desça devagar dobrando o joelho de apoio, quadril para trás.', 'Desça até onde conseguir controlar.', 'Suba empurrando com o pé inteiro.'],
  ['Joelho caindo para dentro.', 'Calcanhar saindo do chão.'],
  'Comece sentando num banco e levantando com uma perna só. Vá baixando a altura do banco aos poucos.'],
'flexao-declinada': [
  'Pés num banco ou degrau, mãos no chão um pouco mais abertas que os ombros, corpo em linha reta.',
  ['Desça o peito em direção ao chão, cotovelos a cerca de 45°.', 'Empurre o chão até estender os braços.', 'Mantenha o abdômen firme.'],
  ['Quadril caindo ou empinado.', 'Cabeça baixando antes do peito.'],
  'Com os pés elevados o trabalho vai mais para o peito superior e o ombro. Quanto mais alto o apoio, mais difícil.'],
'flexao-aberta': [
  'Mãos bem mais abertas que os ombros, corpo em linha reta.',
  ['Desça o peito em direção ao chão.', 'Empurre até estender os braços.'],
  ['Abrir tanto que o ombro incomoda.', 'Quadril caindo.'],
  'Mãos mais abertas aumentam o trabalho do peito e reduzem o do tríceps.'],
'flexao-arqueiro': [
  'Mãos bem afastadas, mais que o dobro da largura dos ombros, corpo em prancha.',
  ['Desça o corpo em direção a uma das mãos, dobrando esse cotovelo.', 'O outro braço fica quase estendido.', 'Suba e repita para o outro lado.'],
  ['Quadril girando.', 'Dobrar os dois braços igualmente.'],
  'É uma progressão para a flexão com um braço. Exige bastante força.'],
'barra-neutra': [
  'Segure as barras paralelas da barra fixa, palmas uma de frente para a outra. Corpo pendurado, braços estendidos.',
  ['Desça os ombros antes de dobrar os braços.', 'Puxe até o queixo passar das mãos.', 'Desça devagar até estender.'],
  ['Balançar o corpo.', 'Amplitude curta.'],
  'A pegada neutra costuma ser a mais confortável para o ombro e o cotovelo.'],
'ponte-unilateral': [
  'Deite de costas com um joelho dobrado e o pé no chão. A outra perna estendida para cima ou com o joelho dobrado no peito.',
  ['Empurre o chão com o calcanhar da perna de apoio, subindo o quadril.', 'Mantenha o quadril nivelado, sem cair para o lado.', 'Desça devagar e troque de lado.'],
  ['Quadril inclinando para o lado da perna livre.', 'Arquear a lombar.'],
  'Uma perna de cada vez dobra a carga sem precisar de peso. Ótimo para treino em casa.'],
'pant-degrau': [
  'Ponta dos pés na borda de um degrau, calcanhares para fora. Segure num apoio.',
  ['Desça os calcanhares abaixo do degrau.', 'Suba na ponta dos pés o mais alto possível.', 'Desça devagar.'],
  ['Quicar embaixo.', 'Amplitude curta.'],
  'Faça com uma perna só quando ficar fácil.'],
'burpee': [
  'Em pé, pés na largura do quadril.',
  ['Agache e apoie as mãos no chão.', 'Jogue os pés para trás ficando em prancha.', 'Faça uma flexão (opcional), traga os pés de volta e salte com os braços para cima.'],
  ['Quadril caindo na prancha.', 'Aterrissar duro.'],
  'Mantenha um ritmo que permita técnica limpa do início ao fim. Sem a flexão e sem o salto, fica mais acessível.'],
'polichinelo': [
  'Em pé, pés juntos e braços ao lado do corpo.',
  ['Salte abrindo pernas e braços em forma de estrela.', 'Salte de novo voltando à posição inicial.', 'Mantenha um ritmo constante.'],
  ['Aterrissar com os calcanhares.', 'Joelhos rígidos.'],
  'Bom para aquecimento ou circuito. Aterrisse na ponta dos pés com os joelhos levemente flexionados.'],
'skipping': [
  'Em pé, braços dobrados ao lado do corpo.',
  ['Corra no lugar elevando os joelhos até a altura do quadril.', 'Movimente os braços em sincronia com as pernas.', 'Fique na ponta dos pés.'],
  ['Inclinar o tronco para trás.', 'Joelhos baixos.'],
  'Mantenha o tronco ereto e o abdômen firme. A intensidade vem da velocidade e da altura dos joelhos.'],
'skater': [
  'Em pé, joelhos levemente flexionados.',
  ['Salte para o lado aterrissando sobre uma perna.', 'Leve a outra perna cruzada atrás, sem apoiar.', 'Salte para o outro lado e repita.'],
  ['Aterrissar com o joelho rígido.', 'Joelho caindo para dentro.'],
  'Trabalha glúteo médio, equilíbrio e condicionamento ao mesmo tempo.'],
'urso': [
  'Em quatro apoios, mãos abaixo dos ombros, joelhos abaixo do quadril. Tire os joelhos do chão, a poucos centímetros.',
  ['Caminhe para frente movendo mão e pé opostos ao mesmo tempo.', 'Mantenha as costas retas e o quadril baixo.', 'Volte caminhando para trás.'],
  ['Subir o quadril.', 'Joelhos tocando o chão.'],
  'Passos curtos e controlados. O desafio é manter o tronco estável enquanto se move.'],
'inchworm': [
  'Em pé, pés na largura do quadril.',
  ['Dobre o quadril e apoie as mãos no chão à frente dos pés.', 'Caminhe com as mãos até ficar em prancha.', 'Caminhe com os pés até perto das mãos e fique em pé.'],
  ['Arquear a lombar na prancha.', 'Dobrar muito os joelhos.'],
  'Bom para aquecimento e mobilidade dos posteriores. Dobre levemente os joelhos se precisar.'],
'pular-corda': [
  'Segure as pontas da corda com os cotovelos próximos ao corpo. Ajuste o tamanho: pisando no meio da corda, as alças devem chegar perto das axilas.',
  ['Gire a corda com os punhos, não com os braços.', 'Salte baixo, só o suficiente para a corda passar, na ponta dos pés.', 'Mantenha um ritmo constante.'],
  ['Saltar alto demais.', 'Girar os braços inteiros.'],
  'Comece com intervalos curtos (30 segundos pulando, 30 descansando) e aumente aos poucos.'],
'abd-cruzado': [
  'Deite de costas, mãos atrás da cabeça, uma perna dobrada e o tornozelo da outra apoiado sobre o joelho.',
  ['Suba o tronco girando, levando o cotovelo em direção ao joelho elevado.', 'Contraia a lateral do abdômen.', 'Desça e faça os dois lados.'],
  ['Puxar o pescoço.', 'Usar impulso.'],
  'Mantenha o cotovelo aberto e gire o tronco inteiro.'],
'corrida': [
  'Aqueça com 5 minutos de caminhada. Tênis adequado e postura ereta.',
  ['Aterrisse com o pé perto da linha do corpo, não muito à frente.', 'Mantenha passos curtos e cadência alta.', 'Braços dobrados a 90°, balançando para frente e para trás.'],
  ['Passadas longas, aterrissando com o calcanhar à frente do corpo.', 'Aumentar o volume semanal rápido demais.'],
  'Na maior parte do tempo, corra num ritmo em que ainda consegue conversar. Isso constrói base com menos risco de lesão.'],
'esteira': [
  'Comece caminhando para aquecer. Prenda a chave de segurança na roupa.',
  ['Aumente a velocidade aos poucos até o ritmo planejado.', 'Fique no centro da esteira e olhe para frente.', 'Desacelere aos poucos no fim.'],
  ['Segurar nas barras laterais durante a corrida.', 'Ficar muito perto da frente da esteira.'],
  'Uma inclinação de 1% compensa a falta de resistência do ar e deixa o esforço mais próximo da corrida na rua.'],
'caminhada-inclinada': [
  'Esteira com inclinação entre 8% e 15%, velocidade de caminhada (cerca de 4 a 6 km/h).',
  ['Caminhe com o tronco ereto, sem segurar nas barras.', 'Passos firmes com o pé inteiro.', 'Mantenha o ritmo pelo tempo planejado.'],
  ['Segurar nas barras, o que tira boa parte do esforço.', 'Inclinar o tronco à frente.'],
  'Ótima opção de cardio de baixo impacto, que trabalha bem glúteos e panturrilhas.'],
'bike': [
  'Ajuste o banco: com o pedal embaixo, o joelho fica levemente flexionado, uns 25° a 30°.',
  ['Pedale com o tronco estável e os ombros relaxados.', 'Ajuste a carga para manter a cadência planejada.', 'Use o tempo ou a distância como meta.'],
  ['Banco baixo demais, sobrecarregando o joelho.', 'Balançar o quadril no banco, sinal de banco alto.'],
  'Bom para aquecimento antes do treino de pernas e para cardio sem impacto.'],
'eliptico': [
  'Suba no aparelho com os pés inteiros nos pedais e segure as alças.',
  ['Movimente pernas e braços de forma coordenada.', 'Mantenha o tronco ereto.', 'Ajuste a resistência para o esforço planejado.'],
  ['Apoiar o peso do corpo nas alças.', 'Ficar na ponta dos pés.'],
  'Cardio de baixo impacto que também trabalha os braços.'],
'remo-ergometro': [
  'Prenda os pés na plataforma com a faixa na altura do peito do pé. Segure o puxador com os braços estendidos.',
  ['Empurre primeiro com as pernas.', 'Quando as pernas estiverem quase estendidas, incline o tronco levemente para trás.', 'Puxe o puxador até a parte de baixo do peito.', 'Volte na ordem inversa: braços, tronco e pernas.'],
  ['Puxar com os braços antes de empurrar com as pernas.', 'Arredondar a lombar.'],
  'Cerca de 60% da força vem das pernas. Pense em empurrar a plataforma, não em puxar o cabo.'],
'agachamento-halter': [
  'Halteres ao lado do corpo ou apoiados nos ombros. Pés na largura dos ombros.',
  ['Desça levando o quadril para trás e dobrando os joelhos.', 'Desça até as coxas ficarem paralelas ao chão.', 'Suba empurrando o chão.'],
  ['Joelhos caindo para dentro.', 'Tronco caindo à frente.'],
  'Halteres nos ombros deixam o tronco mais ereto e enfatizam o quadríceps.'],
});
Object.assign(INS, {
'terra-halter': [
  'Pés na largura do quadril, halteres no chão ao lado dos pés ou à frente das canelas.',
  ['Dobre o quadril e os joelhos, coluna neutra, e segure os halteres.', 'Empurre o chão e fique em pé, mantendo os halteres perto do corpo.', 'Desça levando o quadril para trás.'],
  ['Arredondar a lombar.', 'Halteres longe do corpo.'],
  'Os halteres ao lado do corpo deixam o movimento parecido com o terra com barra hexagonal, mais confortável para a lombar.'],
'remada-alta-halter': [
  'Em pé, halteres à frente das coxas, palmas para o corpo.',
  ['Puxe os halteres para cima, cotovelos guiando para os lados.', 'Pare quando os cotovelos chegarem à altura dos ombros.', 'Desça devagar.'],
  ['Subir os cotovelos acima dos ombros.', 'Usar impulso.'],
  'Os halteres permitem uma trajetória mais livre que a barra, geralmente mais confortável para o ombro.'],
'supino-elastico': [
  'Passe o elástico pelas costas, na altura das axilas, ou prenda num ponto fixo atrás de você na altura do peito. Segure as pontas na altura do peito.',
  ['Empurre as mãos para frente até estender os braços.', 'Volte devagar até as mãos ficarem perto do peito.', 'Mantenha o peito aberto e os ombros baixos.'],
  ['Deixar o elástico puxar rápido na volta.', 'Ombros indo para frente.'],
  'Para aumentar a resistência, dê um passo à frente ou use um elástico mais forte.'],
'puxada-elastico': [
  'Prenda o elástico num ponto alto, como o topo de uma porta com ancoragem. Ajoelhe ou sente de frente e segure as pontas com os braços estendidos para cima.',
  ['Desça os ombros e puxe levando os cotovelos para baixo e para trás.', 'Traga as mãos até a altura do peito.', 'Volte devagar.'],
  ['Puxar só com os braços.', 'Inclinar o tronco para trás demais.'],
  'Mantenha o peito alto. Afaste-se do ponto de ancoragem para aumentar a tensão.'],
'remada-elastico': [
  'Sente no chão com as pernas estendidas e passe o elástico pela sola dos pés. Segure as pontas com os braços estendidos, tronco ereto.',
  ['Puxe as pontas em direção à cintura, levando os cotovelos para trás.', 'Aproxime as escápulas no fim.', 'Volte devagar até estender os braços.'],
  ['Inclinar o tronco para trás para puxar.', 'Arredondar a lombar.'],
  'Cruze as pontas do elástico à frente dos pés para aumentar a resistência.'],
'remada-unilateral-elastico': [
  'Prenda o elástico num ponto baixo ou pise na ponta. Incline o tronco à frente com uma mão apoiada no joelho.',
  ['Puxe o elástico levando o cotovelo para trás, em direção ao quadril.', 'Contraia as costas.', 'Volte devagar e troque de lado.'],
  ['Girar o tronco.', 'Puxar em direção ao peito.'],
  'Mesmo padrão do serrote. Ótimo para treinar costas em casa.'],
'desenv-elastico': [
  'Pise no meio do elástico com os pés na largura do quadril. Segure as pontas na altura dos ombros.',
  ['Empurre as mãos para cima até estender os braços.', 'Desça devagar até a altura dos ombros.', 'Mantenha o abdômen e os glúteos contraídos.'],
  ['Arquear a lombar.', 'Deixar o elástico puxar as mãos para baixo sem controle.'],
  'Pés mais afastados aumentam a tensão.'],
'elev-frontal-elastico': [
  'Pise no meio do elástico e segure as pontas ao lado do corpo, cotovelos levemente flexionados.',
  ['Eleve os braços para os lados até a altura dos ombros.', 'Desça devagar.', 'Mantenha os ombros longe das orelhas.'],
  ['Encolher os ombros.', 'Balançar o tronco.'],
  'A resistência do elástico aumenta no topo, onde o deltoide está mais contraído.'],
'crucifixo-inverso-elastico': [
  'Segure o elástico com as duas mãos à frente do peito, braços estendidos, mãos na largura dos ombros.',
  ['Abra os braços para os lados até o elástico encostar no peito.', 'Volte devagar.', 'Mantenha os cotovelos quase estendidos.'],
  ['Dobrar os cotovelos.', 'Arquear as costas.'],
  'Ótimo para a postura. Dá para fazer várias séries ao longo do dia.'],
'face-pull-elastico': [
  'Prenda o elástico num ponto na altura do rosto. Segure as pontas com os braços estendidos à frente.',
  ['Puxe em direção ao rosto, abrindo os cotovelos para os lados.', 'Termine com as mãos ao lado das orelhas.', 'Volte devagar.'],
  ['Puxar em direção ao pescoço.', 'Cotovelos baixos.'],
  'Mesmo movimento do face pull na polia. Excelente para a saúde do ombro.'],
'rosca-elastico': [
  'Pise no meio do elástico com os pés na largura do quadril. Segure as pontas com as palmas para frente.',
  ['Flexione os cotovelos subindo as mãos até os ombros.', 'Contraia no topo.', 'Desça devagar.'],
  ['Cotovelos indo para frente.', 'Balançar o corpo.'],
  'Pés mais afastados ou elástico mais curto aumentam a resistência.'],
'agachamento-elastico': [
  'Pise no elástico com os pés na largura dos ombros e segure as pontas na altura dos ombros.',
  ['Desça levando o quadril para trás e dobrando os joelhos.', 'Desça até as coxas ficarem perto da paralela.', 'Suba empurrando o chão.'],
  ['Joelhos caindo para dentro.', 'Calcanhares saindo do chão.'],
  'A resistência aumenta na subida, onde você é mais forte. Faça a descida devagar.'],
'stiff-elastico': [
  'Pise no meio do elástico, pés na largura do quadril, pontas nas mãos.',
  ['Leve o quadril para trás mantendo a coluna neutra.', 'Desça até sentir os posteriores alongarem.', 'Volte contraindo os glúteos.'],
  ['Arredondar a lombar.', 'Dobrar demais os joelhos.'],
  'Mantenha as mãos perto das pernas durante todo o movimento.'],
'pull-through-elastico': [
  'Prenda o elástico num ponto baixo atrás de você e passe-o entre as pernas. Afaste-se até criar tensão.',
  ['Leve o quadril para trás deixando as mãos passarem entre as pernas.', 'Estenda o quadril com força até ficar em pé.', 'Contraia os glúteos no topo.'],
  ['Agachar em vez de dobrar no quadril.', 'Puxar com os braços.'],
  'Ótimo para aprender o movimento do quadril em casa.'],
'ponte-elastico': [
  'Deite de costas com o elástico sobre o quadril, preso pelas mãos no chão. Joelhos dobrados e pés no chão.',
  ['Suba o quadril empurrando o chão com os calcanhares.', 'Contraia os glúteos no topo.', 'Desça devagar.'],
  ['Arquear a lombar.', 'Empurrar com a ponta dos pés.'],
  'Um mini band acima dos joelhos, empurrando-os para fora, ativa ainda mais o glúteo.'],
'abducao-elastico': [
  'Sente com um mini band acima dos joelhos, pés no chão.',
  ['Afaste os joelhos para os lados contra o elástico.', 'Segure um instante.', 'Volte devagar.'],
  ['Usar impulso.', 'Tirar os pés do chão para abrir mais.'],
  'Incline o tronco à frente para trabalhar mais o glúteo máximo.'],
'monster-walk': [
  'Mini band acima dos joelhos ou nos tornozelos. Joelhos levemente flexionados, quadril um pouco para trás.',
  ['Dê passos laterais curtos mantendo a tensão no elástico.', 'Não deixe os pés se juntarem.', 'Ande para um lado e depois para o outro.'],
  ['Joelhos caindo para dentro.', 'Tronco balançando.'],
  'Ótimo aquecimento antes do treino de pernas. Ativa o glúteo médio.'],
'pallof': [
  'Prenda o elástico num ponto na altura do peito, de lado. Segure com as duas mãos junto ao peito e afaste-se até criar tensão.',
  ['Empurre as mãos para frente até estender os braços.', 'Resista à rotação: o tronco não pode girar.', 'Volte as mãos ao peito.'],
  ['Deixar o tronco girar.', 'Pés muito juntos.'],
  'É um exercício anti-rotação: o objetivo é ficar parado contra a força do elástico.'],
'barra-assistida-elastico': [
  'Prenda o elástico na barra e apoie um joelho ou o pé no laço. Segure a barra com as palmas para frente.',
  ['Desça os ombros e puxe até o queixo passar da barra.', 'Desça devagar até estender os braços.'],
  ['Pular para subir.', 'Não descer completamente.'],
  'Elásticos mais grossos ajudam mais. Vá trocando por mais finos conforme ganhar força.'],
'pant-elastico': [
  'Sente com as pernas estendidas e passe o elástico pela ponta dos pés, segurando as pontas.',
  ['Empurre a ponta do pé para frente contra o elástico.', 'Volte devagar.'],
  ['Amplitude curta.', 'Mover a perna inteira.'],
  'Funciona bem como alternativa leve ou para quem está voltando de lesão.'],
'extensora-elastico': [
  'Sente numa cadeira com o elástico preso atrás, no pé da cadeira, e na frente do tornozelo.',
  ['Estenda o joelho até a perna ficar reta.', 'Segure um segundo.', 'Volte devagar.'],
  ['Mover o quadril.', 'Soltar rápido.'],
  'Uma perna de cada vez. Alternativa à cadeira extensora para treinar em casa.'],
'kb-remada': [
  'Apoie uma mão e um joelho num banco, ou incline o tronco com a mão no joelho. Kettlebell no chão abaixo do ombro.',
  ['Puxe o kettlebell em direção ao quadril.', 'Contraia as costas.', 'Desça devagar.'],
  ['Girar o tronco.', 'Puxar em direção ao peito.'],
  'A alça do kettlebell permite uma pegada mais neutra que o halter.'],
'kb-desenv': [
  'Kettlebells na posição de rack: alça na mão, peso apoiado no antebraço, perto do ombro.',
  ['Empurre para cima até estender os braços.', 'Desça devagar de volta ao rack.', 'Mantenha os glúteos e o abdômen contraídos.'],
  ['Arquear a lombar.', 'Deixar o punho dobrar para trás.'],
  'Mantenha o punho reto, alinhado com o antebraço.'],
'kb-thruster': [
  'Kettlebells na posição de rack. Pés na largura dos ombros.',
  ['Agache até as coxas ficarem na paralela.', 'Suba com força e use o impulso para empurrar os kettlebells acima da cabeça.', 'Desça os kettlebells ao rack enquanto desce no próximo agachamento.'],
  ['Separar em dois movimentos, perdendo o impulso.', 'Joelhos caindo para dentro.'],
  'Exercício intenso para o corpo todo. Use carga moderada e foque na fluidez.'],
'kb-turco': [
  'Deite de costas com o kettlebell na mão direita, braço estendido para cima. Joelho direito dobrado, pé no chão. Braço e perna esquerdos estendidos a 45°.',
  ['Apoie no cotovelo esquerdo e depois na mão, sem tirar os olhos do kettlebell.', 'Suba o quadril e passe a perna esquerda por baixo até ajoelhar.', 'Levante-se ficando em pé com o braço estendido.', 'Volte fazendo os passos na ordem inversa.'],
  ['Dobrar o cotovelo do braço com o peso.', 'Ir rápido demais.'],
  'Aprenda sem peso ou com um sapato equilibrado na mão. Exige técnica e paciência.'],
'kb-renegade': [
  'Posição de prancha alta com as mãos nas alças de dois kettlebells. Pés mais afastados para dar estabilidade.',
  ['Puxe um kettlebell em direção ao quadril.', 'Mantenha o quadril nivelado, sem girar.', 'Apoie e repita do outro lado.'],
  ['Girar o quadril.', 'Pés juntos, sem estabilidade.'],
  'Combina remada e prancha. O principal é manter o corpo parado.'],
'kb-supino-solo': [
  'Deite de costas no chão, joelhos dobrados. Kettlebell na mão, braço apoiado no chão com o cotovelo a cerca de 45°.',
  ['Empurre o kettlebell para cima até estender o braço.', 'Desça até o cotovelo tocar o chão.', 'Repita e troque de lado.'],
  ['Bater o cotovelo no chão.', 'Deixar o punho dobrar.'],
  'O chão limita a amplitude, o que deixa o exercício mais amigável para o ombro.'],
'triceps-elastico': [
  'Prenda o elástico num ponto alto. Segure as pontas com os cotovelos colados ao corpo.',
  ['Estenda os cotovelos levando as mãos para baixo.', 'Abra levemente as mãos no fim.', 'Volte devagar.'],
  ['Cotovelos saindo do corpo.', 'Usar o tronco.'],
  'Mesmo padrão do tríceps na corda.'],
'coice-elastico': [
  'Em quatro apoios, com o elástico preso no pé e seguro pelas mãos.',
  ['Estenda a perna para trás e para cima.', 'Contraia o glúteo no topo.', 'Volte devagar e troque de lado.'],
  ['Arquear a lombar.', 'Girar o quadril.'],
  'A amplitude é curta. Pare quando sentir que a lombar começaria a arquear.'],
'trx-remada': [
  'Segure as alças com os braços estendidos e incline o corpo para trás, em linha reta dos calcanhares à cabeça.',
  ['Puxe o peito em direção às alças, levando os cotovelos para trás.', 'Aproxime as escápulas no topo.', 'Desça devagar até estender os braços.'],
  ['Quadril caindo.', 'Puxar só com os braços.'],
  'Quanto mais inclinado o corpo, mais difícil. Ajuste a dificuldade com a posição dos pés.'],
'trx-supino': [
  'De costas para a ancoragem, segure as alças com os braços estendidos à frente e incline o corpo à frente, em linha reta.',
  ['Desça o peito entre as alças dobrando os cotovelos.', 'Empurre de volta até estender os braços.', 'Mantenha o abdômen firme.'],
  ['Quadril caindo.', 'Alças se abrindo demais.'],
  'A instabilidade das alças exige muito do core e dos estabilizadores do ombro.'],
'trx-rosca': [
  'Segure as alças com as palmas para cima e incline o corpo para trás, braços estendidos.',
  ['Flexione os cotovelos puxando o corpo em direção às alças.', 'Mantenha os cotovelos na altura dos ombros.', 'Volte devagar.'],
  ['Deixar os cotovelos caírem.', 'Quadril caindo.'],
  'Funciona como rosca de bíceps com o peso do corpo.'],
'trx-triceps': [
  'De costas para a ancoragem, segure as alças acima da cabeça e incline o corpo à frente.',
  ['Flexione os cotovelos levando as mãos para trás da cabeça.', 'Estenda os cotovelos voltando à posição inicial.', 'Mantenha os cotovelos apontando para frente.'],
  ['Abrir os cotovelos.', 'Quadril caindo.'],
  'Quanto mais inclinado, mais difícil.'],
'trx-agachamento': [
  'Segure as alças de frente para a ancoragem, braços estendidos, pés na largura dos ombros.',
  ['Desça levando o quadril para trás, usando as alças para equilíbrio.', 'Desça até as coxas passarem da paralela.', 'Suba empurrando o chão.'],
  ['Puxar com os braços para subir.', 'Joelhos caindo para dentro.'],
  'Ótimo para aprender a amplitude completa do agachamento com apoio.'],
'trx-flexora': [
  'Deite de costas com os calcanhares nas alças. Braços no chão ao lado do corpo.',
  ['Suba o quadril.', 'Traga os calcanhares em direção ao glúteo, dobrando os joelhos.', 'Estenda as pernas de volta mantendo o quadril alto.'],
  ['Quadril caindo.', 'Movimento rápido.'],
  'Exercício exigente para os posteriores. Comece só com a ponte segurando a posição.'],
'remada-porta': [
  'Abra uma porta firme e segure as maçanetas dos dois lados. Pés perto da base da porta e corpo inclinado para trás, braços estendidos.',
  ['Puxe o corpo em direção à porta.', 'Aproxime as escápulas.', 'Volte devagar.'],
  ['Porta que pode fechar ou se soltar.', 'Puxar com os braços sem mexer as escápulas.'],
  'Confira se a porta está firme e travada. Use uma toalha na maçaneta se a pegada escorregar.'],
'flexora-nordica': [
  'Ajoelhe com os calcanhares presos sob um apoio firme ou segurados por alguém. Corpo ereto dos joelhos à cabeça.',
  ['Incline o corpo à frente devagar, mantendo quadril e tronco alinhados.', 'Resista à queda o máximo possível com os posteriores.', 'Apoie as mãos no chão no fim e empurre para voltar.'],
  ['Dobrar o quadril.', 'Cair rápido sem resistir.'],
  'É muito intenso. Comece fazendo só a descida lenta e use as mãos para voltar.'],
'hip-thrust-halter': [
  'Escápulas apoiadas num banco, halter sobre o quadril. Pés no chão na largura do quadril.',
  ['Empurre o chão e suba o quadril até o tronco ficar alinhado com as coxas.', 'Contraia os glúteos no topo.', 'Desça devagar.'],
  ['Arquear a lombar.', 'Pés longe demais.'],
  'Mesmo padrão da elevação pélvica com barra. Bom para treinar em casa.'],
'kb-terra': [
  'Pés na largura do quadril, kettlebell no chão entre os pés.',
  ['Dobre o quadril e os joelhos, coluna neutra, e segure a alça.', 'Empurre o chão e fique em pé.', 'Desça levando o quadril para trás.'],
  ['Arredondar a lombar.', 'Kettlebell à frente dos pés.'],
  'Ótima forma de aprender o terra antes da barra.'],
'pike': [
  'Comece em posição de flexão e leve o quadril para cima, formando um V invertido. Mãos na largura dos ombros.',
  ['Dobre os cotovelos levando a cabeça em direção ao chão, à frente das mãos.', 'Empurre de volta.', 'Mantenha o quadril alto.'],
  ['Cotovelos abertos.', 'Quadril baixo, virando uma flexão comum.'],
  'Pés num banco deixam mais difícil e mais parecido com o desenvolvimento.'],
});
