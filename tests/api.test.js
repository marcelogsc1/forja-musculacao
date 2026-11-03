/* Teste da API com banco PGlite temporário. Uso: npm run test:api */
const http = require('http');
const os = require('os'); const fs = require('fs'); const path = require('path');
process.env.PGLITE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'forja-test-'));
const handle = require('../server/handler');
const assert = (c, m) => { if (!c) { console.error('FALHOU:', m); process.exit(1); } else console.log('ok -', m); };
(async () => {
  const srv = http.createServer((req, res) => handle(req, res)).listen(0); const port = srv.address().port;
  const call = async (method, p, body, token) => { const r = await fetch(`http://localhost:${port}/api${p}`, {method, headers: {'Content-Type': 'application/json', ...(token ? {Authorization: 'Bearer ' + token} : {})}, body: body ? JSON.stringify(body) : undefined}); const j = r.status === 204 ? null : await r.json(); return [r.status, j]; };
  let [s, j] = await call('GET', '/health'); assert(s === 200 && j.ok, 'health');
  [s, j] = await call('POST', '/auth/register', {name: 'Ana', email: 'Ana@x.com', password: '123'}); assert(s === 400, 'senha curta recusada');
  [s, j] = await call('POST', '/auth/register', {name: 'Ana', email: 'Ana@x.com', password: 'senha-forte-1'}); assert(s === 201 && j.token && j.refreshToken && j.user.email === 'ana@x.com', 'cadastro');
  const A = j;
  [s] = await call('POST', '/auth/register', {name: 'Ana', email: 'ana@x.com', password: 'senha-forte-1'}); assert(s === 409, 'e-mail duplicado');
  [s] = await call('POST', '/auth/login', {email: 'ana@x.com', password: 'errada'}); assert(s === 401, 'senha errada');
  [s, j] = await call('POST', '/auth/login', {email: 'ana@x.com', password: 'senha-forte-1'}); assert(s === 200, 'login');
  const t1 = '2026-11-03T10:00:00.000Z', t0 = '2026-11-03T09:00:00.000Z';
  const sess = {id: 's-1', date: '2026-11-03', status: 'done', items: []};
  [s, j] = await call('POST', '/sync', {since: null, changes: [{type: 'session', id: 's-1', data: sess, updatedAt: t1}, {type: 'profile', id: 'me', data: {name: 'Ana'}, updatedAt: t1}, {type: 'measurement', id: '2026-11-03', data: {date: '2026-11-03', kg: 60}, updatedAt: t1}]}, A.token);
  assert(s === 200 && j.accepted === 3 && j.changes.length === 0, 'envio de 3 registros (sem eco)'); const c1 = j.cursor;
  [s, j] = await call('POST', '/sync', {since: '0', changes: []}, A.token); assert(j.changes.length === 3, 'outro aparelho baixa tudo');
  [s, j] = await call('POST', '/sync', {since: c1, changes: []}, A.token); assert(j.changes.length === 0, 'incremental vazio');
  [s, j] = await call('POST', '/sync', {since: c1, changes: [{type: 'profile', id: 'me', data: {name: 'Velha'}, updatedAt: t0}]}, A.token); assert(j.rejected === 1 && j.changes[0].data.name === 'Ana', 'escrita antiga recusada e versão do servidor devolvida');
  [s, j] = await call('POST', '/sync', {since: c1, changes: [{type: 'session', id: 's-1', data: null, deleted: true, updatedAt: '2026-11-03T11:00:00.000Z'}]}, A.token); assert(j.accepted === 1, 'exclusão lógica');
  [s, j] = await call('POST', '/sync', {since: c1, changes: []}, A.token); assert(j.changes.some(x => x.id === 's-1' && x.deleted), 'exclusão chega ao outro aparelho');
  [s] = await call('POST', '/sync', {since: null, changes: [{type: 'hack', id: 'x', data: {}, updatedAt: t1}]}, A.token); assert(s === 400, 'tipo inválido recusado');
  [s] = await call('POST', '/sync', {since: null, changes: [{type: 'session', id: 's-2', data: {id: 'outro'}, updatedAt: t1}]}, A.token); assert(s === 400, 'id divergente recusado');
  [s] = await call('POST', '/sync', {since: null, changes: []}, 'token-falso'); assert(s === 401, 'sem token válido');
  // isolamento entre contas
  [s, j] = await call('POST', '/auth/register', {name: 'Bia', email: 'bia@x.com', password: 'senha-forte-2'}); const B = j;
  [s, j] = await call('POST', '/sync', {since: null, changes: []}, B.token); assert(j.changes.length === 0, 'contas isoladas');
  // renovação com rotação e detecção de reuso
  [s, j] = await call('POST', '/auth/refresh', {refreshToken: A.refreshToken}); assert(s === 200 && j.refreshToken !== A.refreshToken, 'renovação');
  const A2 = j;
  [s] = await call('POST', '/auth/refresh', {refreshToken: A.refreshToken}); assert(s === 401, 'token antigo reutilizado é recusado');
  [s] = await call('POST', '/auth/refresh', {refreshToken: A2.refreshToken}); assert(s === 401, 'reuso derruba a família de tokens');
  [s, j] = await call('POST', '/auth/login', {email: 'ana@x.com', password: 'senha-forte-1'}); const A3 = j;
  [s, j] = await call('GET', '/export', null, A3.token); assert(s === 200 && j.records.length === 2, 'exportação');
  [s] = await call('DELETE', '/me', {password: 'errada'}, A3.token); assert(s === 403, 'exclusão exige senha');
  [s] = await call('DELETE', '/me', {password: 'senha-forte-1'}, A3.token); assert(s === 204, 'conta excluída');
  [s] = await call('POST', '/auth/login', {email: 'ana@x.com', password: 'senha-forte-1'}); assert(s === 401, 'conta não existe mais');
  for (let i = 0; i < 10; i++) await call('POST', '/auth/login', {email: 'bia@x.com', password: 'x'});
  [s] = await call('POST', '/auth/login', {email: 'bia@x.com', password: 'senha-forte-2'}); assert(s === 429, 'bloqueio após 10 erros');
  console.log('\nTodos os testes passaram.'); srv.close(); process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
