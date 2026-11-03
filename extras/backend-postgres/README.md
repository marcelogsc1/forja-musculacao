# Backend alternativo: API própria + PostgreSQL

O Forja usa **Firebase** (Auth + Firestore). Esta pasta guarda a alternativa com API própria em Node + PostgreSQL, testada e funcional, caso um dia você queira sair do Firebase.

Para usar: mova `api/` e `server/` de volta para a raiz, restaure os "rewrites" de `/api` no `vercel.json`, configure `DATABASE_URL` e `AUTH_SECRET` e, em `www/config.js`, deixe `firebase` vazio e preencha `apiUrl: '/api'`. O app escolhe o backend pelo que estiver configurado. Contrato em `API.md`.
