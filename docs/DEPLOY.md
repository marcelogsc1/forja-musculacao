# Publicar na web: GitHub + Vercel (+ Firebase)

- **Vercel:** hospeda o site estático (pasta `www`), que também é o app instalável (PWA).
- **Firebase:** contas e dados (veja `docs/FIREBASE.md`).

## Vercel

1. Importe o repositório do GitHub (Add New, Project).
2. **Framework Preset:** Other. O `vercel.json` já define a pasta `www` e os cabeçalhos certos: service worker sem cache, SDK do Firebase com cache longo e cabeçalhos de segurança.
3. Não há variáveis de ambiente nem banco na Vercel: a configuração do Firebase fica em `www/config.js`.
4. Cada envio ao GitHub publica uma versão nova. O app instalado se atualiza sozinho na próxima abertura. Se houver um treino em andamento, ele avisa e espera você tocar em Atualizar.

Depois do primeiro deploy, adicione o domínio da Vercel em Firebase > Authentication > Configurações > Domínios autorizados.

## Instalação pelo navegador (PWA)

- **Android (Chrome):** cartão "Instalar o Forja" no Início e no Perfil. O Chrome gera um WebAPK: o app aparece na lista de apps e em Configurações, Apps, como instalado de verdade.
- **iPhone (Safari):** Compartilhar, Adicionar à Tela de Início. O app mostra essas instruções ao tocar em Instalar.
- **Computador (Chrome/Edge):** ícone de instalar na barra de endereço.

## Site e Play Store ao mesmo tempo

Funciona sem problema e é o recomendado. Os dois usam o mesmo Firebase, então a mesma conta vê os mesmos treinos no celular e no site. A diferença é a atualização: o site muda a cada envio ao GitHub, e o app da loja só quando você envia uma versão nova. Por isso, ao evoluir o formato dos dados, acrescente campos em vez de remover. Lembre de liberar o campo novo nas regras do Firestore antes de publicar.

Depois que o app estiver na Play Store, para convidar quem abre o site no Android a baixar da loja, acrescente ao manifesto `"related_applications": [{"platform": "play", "id": "app.forja.treino"}]` e `"prefer_related_applications": true`.
