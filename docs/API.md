# API do Forja

Base: `/api` (mesmo domínio do site na Vercel). No app Android, o endereço completo fica em `www/config.js` (`nativeApiUrl`).

Todas as respostas são JSON. Erros: `{message, code}` com status HTTP adequado.

## Autenticação

- **Token de acesso:** JWT HS256, válido por 1 hora, enviado em `Authorization: Bearer <token>`.
- **Token de renovação:** aleatório, válido por 60 dias, guardado no banco só como hash. Cada uso gera um novo (rotação). Se um token antigo for reutilizado, todas as sessões da conta são encerradas (proteção contra roubo).
- **Senhas:** scrypt com sal. Mínimo de 8 caracteres.
- **Bloqueio:** 10 senhas erradas seguidas bloqueiam o login da conta por 15 minutos (status 429).

| Método | Rota | Corpo | Resposta |
|---|---|---|---|
| POST | `/auth/register` | `{name, email, password}` | 201 `{token, refreshToken, expiresIn, user}` · 409 e-mail já usado · 400 dados inválidos |
| POST | `/auth/login` | `{email, password}` | 200 `{token, refreshToken, expiresIn, user}` · 401 · 429 |
| POST | `/auth/refresh` | `{refreshToken}` | 200 novo par de tokens · 401 |
| POST | `/auth/logout` | `{refreshToken}` | 204 |
| GET | `/me` | | 200 `user = {id, name, email, createdAt}` |
| PATCH | `/me` | `{name}` | 200 `user` |
| DELETE | `/me` | `{password}` | 204 conta e todos os dados apagados · 403 senha errada |
| GET | `/export` | | 200 `{exportedAt, user, records[]}` (LGPD: cópia dos dados) |
| GET | `/health` | | 200 `{ok, db}` |
| POST | `/sync` | ver abaixo | ver abaixo |

## Registros

Tudo o que o usuário grava é um registro `{type, id, data, updatedAt, deleted}`:

| type | id | data |
|---|---|---|
| `profile` | `me` | `{name, birth, height, goal, level, createdAt}` |
| `prefs` | `me` | `{prefs: {theme, inc, bar, sound, rest, goal, awake, pics}, active, v}` |
| `routine` | id da rotina | `{id, nome, desc, from, ord, workouts: [{id, nome, cor, items: [{uid, ex, sets, rmin, rmax, rest, nota}]}]}` |
| `exercise` | id do exercício criado | `{n, m, e, p, pri[], sec[], d[]}` |
| `measurement` | `AAAA-MM-DD` | `{date, kg, cintura, ...}` |
| `media` | id do exercício | `{asset}` |
| `session` | id do treino | treino completo (formato abaixo) |

`updatedAt` é o horário da alteração no aparelho (ISO 8601). `deleted: true` com `data: null` é uma exclusão; ela é guardada para avisar os outros aparelhos.

### Treino (`session`)

```json
{
  "id": "s-mvz7f3haigcu", "status": "done", "date": "2026-11-02",
  "startedAt": "2026-11-02T11:57:20.351Z", "finishedAt": "2026-11-02T12:47:52.767Z", "dur": 50,
  "routine": "r-hip5", "workout": "d1", "wname": "Upper", "cor": 0,
  "free": false, "quick": false, "feel": "3", "note": "",
  "items": [{"uid": "d1-1", "planned": "supino-reto-barra", "ex": "supino-reto-barra", "rest": 150,
             "sets": [{"kg": 40, "reps": 10, "ok": true, "t": "n"}]}],
  "updatedAt": "2026-11-02T12:47:53.104Z"
}
```

- `status`: `open` (em andamento), `draft` (registro de dia passado), `done` (concluído).
- `t`: `n` normal, `w` aquecimento, `f` até a falha, `d` drop set. Só séries com `ok: true` contam no histórico.

## Sincronização: `POST /sync`

Uma chamada envia as alterações do aparelho e devolve as dos outros aparelhos.

```json
// pedido
{"since": "1234", "changes": [{"type": "session", "id": "s-1", "data": {...}, "updatedAt": "...", "deleted": false}]}
// resposta
{"cursor": "1290", "changes": [ ...registros alterados por outros aparelhos... ], "more": false, "accepted": 1, "rejected": 0}
```

- `since`: cursor da última sincronização (`null` na primeira). O servidor devolve só registros com `rev` maior.
- **Conflito:** o servidor só grava se `updatedAt` recebido for igual ou mais novo que o salvo. Se for mais antigo, a versão do servidor volta em `changes`.
- Os registros que o próprio aparelho acabou de enviar não voltam na resposta.
- `more: true`: há mais páginas (1.000 por vez); chame de novo com o novo cursor.
- Limites: 500 alterações por chamada, 256 KB por registro, 4 MB por requisição, 50.000 registros por conta.
- Horário do aparelho adiantado é limitado ao horário do servidor + 5 minutos.

## Banco

`server/schema.sql`: tabelas `users`, `refresh_tokens` e `records` (chave `(user_id, type, id)`, conteúdo em `jsonb`, índice por `rev` para a sincronização incremental e índice por data dos treinos para relatórios). Excluir o usuário apaga tudo em cascata.

## Próximos passos recomendados para o backend

- Recuperação de senha por e-mail (ex.: Resend ou SendGrid): rota que envia um link com token de uso único.
- Login com Google (Credential Manager no Android): rota que valida o ID token do Google e devolve o mesmo par de tokens.
- Upload de imagens próprias (`POST /media`) para um armazenamento de arquivos (Vercel Blob, S3).
- Limite de requisições por IP (ex.: Upstash Ratelimit) se o app crescer.
