# Publicar na Play Store

**Você não envia o HTML para o Play Console.** O Play Console só aceita um Android App Bundle (`.aab`). O Capacitor coloca a pasta `www` dentro de um projeto Android nativo, e o Android Studio gera o `.aab` assinado. O app instalado roda os arquivos localmente (abre sem internet) e conversa direto com o Firebase.

## 1. Gerar o app Android

Requisitos: Node 18+, Android Studio (versão atual), JDK 17 ou 21.

```bash
npm install
npm run android:add      # cria a pasta android/ (uma vez)
npm run android:sync     # copia www/ e os plugins (rode sempre que mudar o app)
npm run android:open     # abre no Android Studio
```

O modelo do Capacitor 8 já vem com `targetSdkVersion 36` (Android 16), que é o mínimo exigido pela Play Store para apps novos e atualizações desde 31/08/2026.

Antes do primeiro envio:

1. **config.js:** com o `firebaseConfig` do seu projeto preenchido (o mesmo do site). Se restringir a chave de API por referenciador, inclua `https://localhost/*`, que é a origem do app Android.
2. **Ícone e tela de abertura:** `npx @capacitor/assets generate` a partir de `www/icons/maskable-512.png`, ou Android Studio, New, Image Asset.
3. **Permissões** em `android/app/src/main/AndroidManifest.xml`: `POST_NOTIFICATIONS` (aviso de fim de descanso) e `VIBRATE`.
4. **Orientação:** `android:screenOrientation="portrait"` na `MainActivity`.
5. **Versão:** em `android/app/build.gradle`, aumente `versionCode` (1, 2, 3...) a cada envio e ajuste `versionName`.
6. **Gerar:** Build, Generate Signed App Bundle, crie uma chave de upload (`.jks`) e guarde em lugar seguro com a senha. Ative a Assinatura de apps do Google Play quando o Console pedir.

## 2. Play Console

1. **Conta de desenvolvedor:** taxa única de US$ 25 e verificação de identidade.
2. **Teste fechado obrigatório (contas pessoais criadas depois de 13/11/2023):** pelo menos 12 testadores inscritos sem interrupção por 14 dias antes de liberar a produção. Comece cedo, com amigos e familiares.
3. **Ficha da loja:** nome, descrição curta e longa, ícone 512×512, imagem de destaque 1024×500 e capturas de tela (as de `www/screenshots/` têm 1080×2400 e servem).
4. **Conteúdo do app:**
   - **Política de privacidade:** `https://SEU-PROJETO.vercel.app/privacidade.html` (preencha os campos antes).
   - **Exclusão de conta:** obrigatória para apps que criam conta. No app: Perfil, Excluir minha conta. Na web: `https://SEU-PROJETO.vercel.app/excluir-conta.html`.
   - **Segurança dos dados:** declare que coleta nome, e-mail, informações de saúde e condicionamento físico (treinos e medidas), criptografados em trânsito, com opção de exclusão. O Google Firebase atua como prestador de serviço (processador), o que não conta como compartilhamento com terceiros.
   - **Declaração de apps de saúde:** obrigatória para todos os apps publicados; o Forja entra em "Atividade e condicionamento físico".
   - Classificação indicativa, público-alvo e anúncios (não tem).
5. **Envio:** crie a versão na faixa de teste fechado, envie o `.aab`, adicione os testadores e, depois dos 14 dias, peça acesso à produção.

## 3. Alternativa: TWA (app que abre o site em tela cheia)

Ferramentas como Bubblewrap ou PWABuilder geram um `.aab` que abre o seu site da Vercel em tela cheia. Vantagem: toda atualização do site já vale para o app. Desvantagens: depende de internet para abrir pela primeira vez e não usa os plugins nativos (vibração, notificação de descanso com tela bloqueada, tela ligada). Exige o arquivo `/.well-known/assetlinks.json` no site com a impressão digital da chave. Para o Forja, o Capacitor é a opção recomendada.

## Atualizações

- Mudanças só no site: envie ao GitHub, a Vercel publica.
- Mudanças no app Android: `npm run android:sync`, aumente `versionCode`, gere o `.aab` e envie no Console.
- As regras do Firestore precisam aceitar o formato das versões antigas que ainda estão nos celulares: acrescente campos, evite remover.
