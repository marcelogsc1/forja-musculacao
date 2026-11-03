# Publicar na web: GitHub + Vercel + banco Neon

Resultado: o site (que também é o app instalável) e a API no mesmo endereço, por exemplo `https://forja-app.vercel.app` e `https://forja-app.vercel.app/api`.

## 1. GitHub

1. Crie um repositório (pode ser privado) e envie esta pasta inteira. O `.gitignore` já deixa de fora `node_modules`, `android/` e `.data/`.

## 2. Vercel

1. Em vercel.com, **Add New, Project** e importe o repositório.
2. **Framework Preset:** Other. Não precisa mudar mais nada: o `vercel.json` já define a pasta `www` como site e `api/index.js` como função.
3. Antes do primeiro deploy, adicione as variáveis de ambiente (Settings, Environment Variables):
   - `AUTH_SECRET`: texto aleatório com 32 caracteres ou mais. Gere com `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`. Nunca mude depois, ou todos precisarão entrar de novo.
   - `CORS_ORIGINS` (opcional): origens extras que podem chamar a API. O padrão já inclui o app Android (`https://localhost`, `capacitor://localhost`).

## 3. Banco de dados (Neon pela Vercel)

1. No projeto da Vercel: **Storage** (ou Marketplace), **Neon**, crie o banco e conecte ao projeto.
2. A integração cria a variável `DATABASE_URL` sozinha.
3. As tabelas são criadas automaticamente na primeira chamada da API. Se preferir criar antes: `DATABASE_URL=... npm run db:migrate`.
4. Faça um novo deploy e teste: abra `https://SEU-PROJETO.vercel.app/api/health`. Deve aparecer `{"ok":true,"db":"pg"}`.

Outros bancos PostgreSQL também servem (Supabase, Railway, RDS): basta colocar a `DATABASE_URL`.

## 4. Ajustes no código

1. Em `www/config.js`, troque `nativeApiUrl` pelo seu domínio: `https://SEU-PROJETO.vercel.app/api`. Isso é o que o app Android usa.
2. Em `www/privacidade.html` e `www/excluir-conta.html`, preencha nome, e-mail de contato e data.
3. Envie para o GitHub. Cada envio publica uma nova versão; o app instalado se atualiza sozinho na próxima abertura (se houver treino em andamento, ele avisa e espera você tocar em Atualizar).

## Instalação pelo navegador (PWA)

- **Android (Chrome):** o app mostra o cartão "Instalar o Forja" no Início e no Perfil. O Chrome gera um WebAPK: o Forja aparece na lista de apps e em Configurações, Apps, como um app instalado de verdade, não só um atalho.
- **iPhone (Safari):** Compartilhar, Adicionar à Tela de Início. O app mostra essas instruções ao tocar em Instalar.
- **Computador (Chrome/Edge):** ícone de instalar na barra de endereço.

Requisitos já atendidos: HTTPS, `manifest.webmanifest` com ícones 192 e 512 (inclusive maskable), capturas de tela e descrição (janela de instalação rica), e service worker que funciona sem internet.

## Site e Play Store ao mesmo tempo

Funciona sem problema e é o recomendado:

- Os dois usam a mesma API e o mesmo banco. A pessoa pode treinar no app Android e ver tudo no site, e vice-versa, com a mesma conta.
- O site é atualizado a cada envio ao GitHub. O app da Play Store só muda quando você gera e envia uma nova versão; por isso a API deve continuar aceitando versões antigas do app. Ao mudar o formato dos dados no futuro, acrescente campos em vez de remover.
- Se quiser que quem abre o site no Android seja convidado a baixar da Play Store em vez de instalar o PWA, acrescente ao manifesto `"related_applications": [{"platform": "play", "id": "app.forja.treino"}]` e `"prefer_related_applications": true` depois que o app estiver publicado.
