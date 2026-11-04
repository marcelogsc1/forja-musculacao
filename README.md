# Forja · app de treino

Registro de treinos de musculação com rotinas editáveis e dias da semana, biblioteca de 64 programas e treinos, assistente "Montar meu programa", 210 exercícios com ilustrações realistas, instrução detalhada (preparação, execução, erros comuns e dica) e mapa muscular, progresso de cargas, calendário e medidas corporais.

O mesmo código vira três coisas:

| Versão | Como chega ao usuário | Guia |
|---|---|---|
| Site | GitHub → Vercel | `docs/DEPLOY.md` |
| Contas e dados | Firebase Authentication + Cloud Firestore | `docs/FIREBASE.md` |
| App instalável pelo navegador (PWA) | Botão "Instalar" no app ou menu do Chrome | já incluído |
| App da Play Store | Capacitor gera o `.aab` no Android Studio | `docs/PLAY-STORE.md` |

## Estrutura

```
www/                      o app (HTML, CSS e JS puros, sem etapa de build)
  index.html, config.js   config.js: firebaseConfig do seu projeto
  manifest.webmanifest    PWA: nome, ícones, capturas de tela (instalação rica no Android)
  sw.js                   service worker: abre sem internet e se atualiza sozinho
  privacidade.html        política de privacidade (modelo para completar)
  excluir-conta.html      exclusão de conta pela web (exigência da Play Store)
  vendor/firebase-13.2.0  SDK do Firebase embutido (sem depender de CDN)
  js/store.js             DADOS: registros, IndexedDB, fila de envio, sincronização, conta (Firebase)
  js/app.js               telas, treino ao vivo, teclado numérico, descanso
  js/explore.js           biblioteca de programas e assistente
  js/programs.js          programas e gerador de treinos
  js/catalog.js           210 exercícios
  js/instructions.js      instrução detalhada de cada exercício
  js/platform.js          Android: voltar, vibração, notificações, tela ligada, instalação PWA
  js/util.js, templates.js, bodydata.js, body.js, boot.js
  fig/                    ilustrações (início e fim do movimento lado a lado)
  screenshots/            capturas usadas na instalação e na ficha da Play Store
firestore.rules           regras de segurança do Firestore
tests/firestore.rules.test.js   38 testes das regras no emulador
firebase.json, .firebaserc, firestore.indexes.json   projeto Firebase (CLI)
vercel.json               publicação na Vercel
capacitor.config.json     projeto Android
docs/                     FIREBASE.md, DEPLOY.md, PLAY-STORE.md, licenças
extras/backend-postgres/  alternativa sem Firebase (API própria + PostgreSQL), não usada
```

## Rodar no computador

```bash
npm install
npm run dev          # http://localhost:8080
npm run test:rules   # testa as regras do Firestore no emulador (Java 21+)
```

## Como os dados funcionam

Tudo o que o usuário grava vira um **registro** pequeno: perfil, preferências, cada rotina, cada exercício criado, cada medida corporal, cada imagem própria e cada treino. Detalhes em `docs/API.md`.

- **No aparelho:** IndexedDB. Sem limite prático de tamanho e sem travar a tela. O app funciona 100% offline.
- **Envio:** só os registros alterados, agrupados (no máximo ~1,5 s depois da primeira alteração), com nova tentativa automática quando a internet volta e envio imediato ao sair do app.
- **Download:** cada aparelho guarda um cursor e baixa só o que mudou desde a última vez.
- **Conflitos:** vale a alteração mais recente de cada registro. Editar o treino no celular e a rotina no computador ao mesmo tempo não gera perda, porque são registros diferentes.
- **Primeiro login num aparelho:** o que já está na conta prevalece; o que só existe no aparelho é enviado.
- **Tempo real:** com o app aberto, mudanças feitas em outro aparelho aparecem na hora.
- **Conta:** cadastro com e-mail de confirmação, recuperação de senha por e-mail, sair (envia o que falta e limpa o aparelho) e excluir conta (apaga tudo no Firestore e o login: Perfil, Excluir minha conta, ou `excluir-conta.html`).
- **Versão do claude.ai:** continua usando o banco do claude.ai no formato antigo, sem migração de dados.

## Testar direto no celular sem servidor

`forja-celular.html` é o app inteiro num arquivo só. Abra com o Chrome do Android. Funciona sem conta (dados só no aparelho).

## Licenças

- Código do Forja: seu.
- Ilustrações: Open Exercise Illustrations, CC0 (`docs/LICENSE-open-exercise-illustrations-CC0.txt`). Geradas por IA e revisadas a olho pelo autor do projeto; detalhes podem ter imperfeições.
- Fotos opcionais: Free Exercise DB, domínio público.
- Desenho anatômico: react-native-body-highlighter, MIT (`docs/LICENSE-body-highlighter.txt`).
- Fontes Archivo, Geist e Geist Mono: SIL Open Font License 1.1 (`www/fonts/OFL-Archivo.txt`, `www/fonts/OFL-Geist.txt`).
- Firebase JS SDK 13.2.0: Apache 2.0 (`www/vendor/firebase-13.2.0`).
