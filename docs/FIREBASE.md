# Firebase: configuração completa

O Forja usa **Firebase Authentication** (contas com e-mail e senha) e **Cloud Firestore** (dados). O site continua na Vercel; o Firebase não hospeda nada.

## Como os dados ficam no Firestore

```
users/{uid}/records/{tipo}__{id}
  type       'profile' | 'prefs' | 'routine' | 'exercise' | 'measurement' | 'media' | 'session'
  id         id do item (perfil e preferências usam 'me'; medidas usam a data AAAA-MM-DD)
  data       conteúdo (null quando apagado)
  deleted    true quando o item foi apagado (avisa os outros aparelhos)
  updatedAt  Timestamp da alteração no aparelho ("a mais recente vence")
  serverAt   Timestamp do servidor (sincronização incremental e tempo real)
```

- Cada aparelho guarda tudo no IndexedDB e funciona sem internet.
- Ao gravar, envia só os documentos alterados, em lote (até 400 por vez).
- Ao abrir, baixa só o que mudou desde a última vez (`serverAt` maior que o último visto).
- Com o app aberto, um ouvinte em tempo real traz as mudanças dos outros aparelhos na hora.
- O cache próprio do Firestore fica só em memória, para não duplicar os dados no aparelho.

## 1. Criar o projeto

1. Em console.firebase.google.com, **Adicionar projeto**. O Google Analytics é opcional (o app não usa).
2. **Authentication > Começar > Método de login > E-mail/senha > Ativar**. Deixe "Link de e-mail (login sem senha)" desligado.
3. **Authentication > Configurações**:
   - **Domínios autorizados:** adicione o domínio da Vercel (ex.: `forja-musculacao.vercel.app`) e o seu domínio próprio, se tiver.
   - **Proteção contra enumeração de e-mail:** deixe ativada (é o padrão em projetos novos).
4. **Authentication > Modelos**: traduza para português os e-mails de confirmação e de redefinição de senha e coloque o nome "Forja" como remetente.
5. **Firestore Database > Criar banco de dados**:
   - Local: **southamerica-east1 (São Paulo)**, mais perto dos usuários e bom para a LGPD. Não dá para mudar depois.
   - Comece em **modo de produção** (tudo bloqueado) e publique as regras do passo 3.

## 2. Ligar o app ao projeto

1. **Configurações do projeto > Seus apps > Web (`</>`)**. Dê o nome "Forja web". Não marque Firebase Hosting.
2. Copie o objeto `firebaseConfig` mostrado e cole em `www/config.js`, no campo `firebase`. Esses valores são públicos por natureza; quem protege os dados são as regras.
3. Envie ao GitHub. A Vercel publica e o perfil passa a mostrar "Entrar ou criar conta".

O app Android usa a mesma configuração web: o Capacitor roda o mesmo código. Não precisa do `google-services.json` enquanto o login for por e-mail e senha.

## 3. Regras de segurança (`firestore.rules`)

O que elas garantem:

1. Cada pessoa só lê e grava `users/{seu uid}/records/...`, e só com **e-mail confirmado** e login por e-mail/senha ou Google. Contas anônimas ou com e-mail não confirmado não acessam nada. Todo o resto do banco é bloqueado.
2. Cada documento tem exatamente os 6 campos esperados, com tipos certos, e o nome do documento bate com `tipo__id`.
3. Conteúdo validado por tipo: perfil só com campos conhecidos e tamanhos máximos; medidas com valores plausíveis (peso até 500 kg, medidas até 300 cm); treinos com status válido, data AAAA-MM-DD e no máximo 80 exercícios; rotinas com até 30 treinos.
4. `serverAt` tem de ser o horário do servidor, então ninguém consegue furar a sincronização.
5. Uma gravação com `updatedAt` mais antigo que o salvo é recusada ("a mais recente vence"). O app então baixa a versão mais nova.
6. O dono pode apagar os próprios documentos, o que é necessário para a exclusão de conta.

**Publicar pelo console:** Firestore Database > Regras, cole o conteúdo de `firestore.rules` e clique em Publicar.

**Publicar pelo terminal:**

```bash
npm install
npx firebase login
npx firebase use --add          # escolha o projeto; atualiza o .firebaserc
npm run rules:deploy
```

**Testar as regras (38 testes):** precisa de Java 21 ou mais novo. `npm run test:rules` sobe o emulador oficial e confere que o dono consegue gravar e ler; que outra pessoa, ou alguém sem login, não consegue; e que formatos inválidos, `serverAt` forjado e gravações antigas são recusados.

Ao acrescentar um campo novo no perfil ou nas medidas, inclua o nome dele na lista correspondente das regras, ou a gravação será recusada.

## Confirmação de e-mail no app

- Ao criar a conta, o app envia o e-mail de confirmação e mostra no Perfil "Já confirmei meu e-mail" e "Reenviar".
- Até a confirmação, tudo continua salvo no aparelho; nada se perde. Ao confirmar, o app renova o token (as regras leem `email_verified` dele) e envia tudo para a conta.
- Ao voltar para o app depois de clicar no link, ele confere sozinho.

## 4. Proteções recomendadas antes de lançar

- **Restringir a chave de API:** Google Cloud Console > APIs e serviços > Credenciais > a chave "Browser key". Em **Restrições de aplicativos**, escolha Referenciadores HTTP e inclua `https://SEU-DOMINIO.vercel.app/*`, `https://localhost/*` (app Android) e `http://localhost:8080/*` (testes). Em **Restrições de API**, deixe só Identity Toolkit API, Token Service API e Cloud Firestore API.
- **App Check (opcional):** reduz o uso do seu Firebase por scripts de terceiros. Para a web, crie uma chave do reCAPTCHA v3 e coloque em `appCheckSiteKey` no `config.js`. Só ative a **aplicação obrigatória** no console depois de integrar o app Android (plugin `@capacitor-firebase/app-check` com Play Integrity); antes disso, o app Android seria bloqueado.
- **Alerta de orçamento:** no plano gratuito (Spark), o Firestore tem cota diária gratuita e para de responder quando ela acaba, sem cobrar. Se mudar para o Blaze, crie um alerta de orçamento no Google Cloud.
- **Senha:** o app exige 8 caracteres. Em Authentication > Configurações > Política de senha dá para exigir o mesmo no servidor.

## Consumo estimado

- Treino normal: cada série confirmada gera no máximo uma gravação a cada ~1,5 s, juntando as séries feitas em sequência.
- Abrir o app num aparelho novo: uma leitura por documento da conta (ex.: 300 treinos = cerca de 320 leituras, uma vez).
- Depois disso: só os documentos alterados.

## O que fica para depois

- **Login com Google:** no Android exige o plugin nativo `@capacitor-firebase/authentication` e o SHA-1 da chave de assinatura cadastrado no Firebase.
- **Imagens próprias de exercícios:** Firebase Storage, com regras parecidas (`users/{uid}/...`).
- **Exclusão automática dos dados ao apagar a conta pelo console:** extensão "Delete User Data" (exige o plano Blaze). Pelo app e pela página `excluir-conta.html`, a exclusão já apaga tudo.
