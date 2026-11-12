/* API do Forja. Um único manipulador (req, res) usado por:
   - Vercel: api/index.js
   - Desenvolvimento local: server/dev.js
   Contrato completo em docs/API.md */
const getDb = require('./lib/db');
const S = require('./lib/security');

const TYPES = ['profile', 'prefs', 'routine', 'exercise', 'measurement', 'media', 'avatar', 'session'];
const ID_RE = /^[A-Za-z0-9_.~:@+-]{1,120}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const MAX_BODY = 4 * 1024 * 1024;       // limite da Vercel é 4,5 MB
const MAX_CHANGES = 500;                // por requisição de sincronização
const MAX_RECORD = 256 * 1024;          // por registro (um treino tem poucos KB)
const PAGE = 1000;                      // registros por página no download
const MAX_RECORDS_PER_USER = 50000;

class HttpError extends Error { constructor(status, message, code){ super(message); this.status = status; this.code = code; } }
const bad = (m, code) => new HttpError(400, m, code);

// ---------- HTTP ----------
function allowedOrigin(req){
  const o = req.headers.origin; if (!o) return null;
  const list = (process.env.CORS_ORIGINS || 'https://localhost,capacitor://localhost,http://localhost,http://localhost:8080,http://localhost:5173').split(',').map(s => s.trim()).filter(Boolean);
  try { if (new URL(o).host === req.headers.host) return o; } catch (e) {}
  return list.includes(o) ? o : null;
}
function send(req, res, status, data){
  const h = {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', Vary: 'Origin'};
  const o = allowedOrigin(req);
  if (o) Object.assign(h, {'Access-Control-Allow-Origin': o, 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS', 'Access-Control-Max-Age': '600'});
  res.writeHead(status, h); res.end(data === undefined ? '' : JSON.stringify(data));
}
async function readBody(req){
  if (req.body !== undefined && req.body !== null){             // a Vercel já entrega o corpo lido
    if (typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
    const s = req.body.toString(); if (s.length > MAX_BODY) throw new HttpError(413, 'Corpo grande demais.');
    try { return s ? JSON.parse(s) : {}; } catch (e) { throw bad('JSON inválido.'); }
  }
  return new Promise((ok, fail) => {
    const chunks = []; let n = 0;
    req.on('data', c => { n += c.length; if (n > MAX_BODY){ fail(new HttpError(413, 'Corpo grande demais.')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { const s = Buffer.concat(chunks).toString(); ok(s ? JSON.parse(s) : {}); } catch (e) { fail(bad('JSON inválido.')); } });
    req.on('error', fail);
  });
}

// ---------- autenticação ----------
const publicUser = u => ({id: u.id, name: u.name, email: u.email, createdAt: u.created_at});
async function issue(db, user){
  const rt = S.newRefresh();
  await db.query('insert into refresh_tokens (id, user_id, expires_at) values ($1, $2, now() + make_interval(secs => $3))', [S.sha256(rt), user.id, S.REFRESH_TTL]);
  return {token: S.signAccess(user.id), refreshToken: rt, expiresIn: S.ACCESS_TTL, user: publicUser(user)};
}
async function requireUser(req, db){
  const p = S.verifyAccess((req.headers.authorization || '').replace(/^Bearer\s+/i, ''));
  if (!p) throw new HttpError(401, 'Não autenticado.', 'unauthorized');
  const {rows} = await db.query('select * from users where id = $1', [p.sub]);
  if (!rows[0]) throw new HttpError(401, 'Conta não encontrada.', 'unauthorized');
  return rows[0];
}

async function register(req, db){
  const b = await readBody(req);
  const email = String(b.email || '').trim().toLowerCase(); const name = String(b.name || '').trim().slice(0, 60); const pass = String(b.password || '');
  if (!EMAIL_RE.test(email)) throw bad('E-mail inválido.');
  if (pass.length < 8 || pass.length > 200) throw bad('A senha precisa ter de 8 a 200 caracteres.');
  const user = {id: S.newUserId(), email, name, pass_hash: S.hashPassword(pass)};
  try { const {rows} = await db.query('insert into users (id, email, name, pass_hash) values ($1, $2, $3, $4) returning *', [user.id, email, name, user.pass_hash]); return [201, await issue(db, rows[0])]; }
  catch (e) { if (String(e.code) === '23505' || /unique|duplicate/i.test(e.message)) throw new HttpError(409, 'Já existe uma conta com este e-mail.', 'email_taken'); throw e; }
}
async function login(req, db){
  const b = await readBody(req); const email = String(b.email || '').trim().toLowerCase(); const pass = String(b.password || '');
  const {rows} = await db.query('select * from users where email = $1', [email]); const u = rows[0];
  if (u && u.locked_until && new Date(u.locked_until) > new Date()) throw new HttpError(429, 'Muitas tentativas. Tente de novo em alguns minutos.', 'locked');
  if (!u || !S.checkPassword(pass, u.pass_hash)){
    if (u) await db.query(`update users set failed_logins = failed_logins + 1, locked_until = case when failed_logins + 1 >= 10 then now() + interval '15 minutes' else locked_until end where id = $1`, [u.id]);
    throw new HttpError(401, 'E-mail ou senha incorretos.', 'invalid_credentials');
  }
  if (u.failed_logins || u.locked_until) await db.query('update users set failed_logins = 0, locked_until = null where id = $1', [u.id]);
  return [200, await issue(db, u)];
}
async function refresh(req, db){
  const b = await readBody(req); const rt = String(b.refreshToken || ''); if (!rt) throw new HttpError(401, 'Sessão expirada.', 'unauthorized');
  const out = await db.tx(async t => {
    const {rows} = await t.query('select * from refresh_tokens where id = $1 for update', [S.sha256(rt)]); const row = rows[0];
    if (!row) throw new HttpError(401, 'Sessão expirada.', 'unauthorized');
    if (row.revoked_at) return {reused: row.user_id};
    if (new Date(row.expires_at) < new Date()) throw new HttpError(401, 'Sessão expirada.', 'unauthorized');
    await t.query('update refresh_tokens set revoked_at = now() where id = $1', [row.id]);
    const u = (await t.query('select * from users where id = $1', [row.user_id])).rows[0]; if (!u) throw new HttpError(401, 'Conta não encontrada.', 'unauthorized');
    return [200, await issue(t, u)];
  });
  /* token já usado de novo: possível roubo. Encerra todas as sessões da conta. */
  if (out.reused){ await db.query('update refresh_tokens set revoked_at = now() where user_id = $1 and revoked_at is null', [out.reused]); throw new HttpError(401, 'Sessão encerrada por segurança. Entre de novo.', 'token_reused'); }
  return out;
}
async function logout(req, db){ const b = await readBody(req); if (b.refreshToken) await db.query('update refresh_tokens set revoked_at = now() where id = $1 and revoked_at is null', [S.sha256(String(b.refreshToken))]); return [204]; }

// ---------- conta ----------
async function me(req, db){ return [200, publicUser(await requireUser(req, db))]; }
async function updateMe(req, db){ const u = await requireUser(req, db); const b = await readBody(req); const name = String(b.name ?? u.name).trim().slice(0, 60); const {rows} = await db.query('update users set name = $2 where id = $1 returning *', [u.id, name]); return [200, publicUser(rows[0])]; }
/* Exclusão de conta (exigência da Play Store): apaga usuário, tokens e todos os registros (on delete cascade) */
async function deleteMe(req, db){
  const u = await requireUser(req, db); const b = await readBody(req);
  if (!S.checkPassword(String(b.password || ''), u.pass_hash)) throw new HttpError(403, 'Senha incorreta.', 'invalid_password');
  await db.query('delete from users where id = $1', [u.id]);
  return [204];
}
/* Exportação completa (LGPD: direito de acesso e portabilidade) */
async function exportAll(req, db){
  const u = await requireUser(req, db);
  const {rows} = await db.query('select type, id, data, updated_at from records where user_id = $1 and not deleted order by type, id', [u.id]);
  return [200, {exportedAt: new Date().toISOString(), user: publicUser(u), records: rows.map(r => ({type: r.type, id: r.id, data: r.data, updatedAt: new Date(r.updated_at).toISOString()}))}];
}

// ---------- sincronização ----------
function cleanChange(c){
  if (!c || typeof c !== 'object') throw bad('Mudança inválida.');
  if (!TYPES.includes(c.type)) throw bad('Tipo inválido: ' + c.type);
  if (typeof c.id !== 'string' || !ID_RE.test(c.id)) throw bad('Id inválido.');
  if ((c.type === 'profile' || c.type === 'prefs' || c.type === 'avatar') && c.id !== 'me') throw bad('Id inválido para ' + c.type);
  if (c.type === 'measurement' && !DATE_RE.test(c.id)) throw bad('Medida precisa de data AAAA-MM-DD.');
  const at = new Date(c.updatedAt); if (isNaN(at)) throw bad('updatedAt inválido.');
  const max = Date.now() + 5 * 60 * 1000; const updatedAt = new Date(Math.min(at.getTime(), max)); // relógio adiantado não trava o registro
  const deleted = !!c.deleted;
  let data = null;
  if (!deleted){
    if (!c.data || typeof c.data !== 'object' || Array.isArray(c.data)) throw bad('Conteúdo inválido.');
    const json = JSON.stringify(c.data); if (json.length > MAX_RECORD) throw new HttpError(413, 'Registro grande demais.');
    if (c.type === 'session' && (!c.data.id || c.data.id !== c.id)) throw bad('O id do treino não confere.');
    data = json;
  }
  return {type: c.type, id: c.id, data, deleted, updatedAt: updatedAt.toISOString()};
}
const toRec = r => ({type: r.type, id: r.id, data: r.deleted ? null : r.data, deleted: r.deleted, updatedAt: new Date(r.updated_at).toISOString(), rev: String(r.rev)});

async function sync(req, db){
  const u = await requireUser(req, db); const b = await readBody(req);
  const since = b.since == null ? '0' : String(b.since); if (!/^\d{1,19}$/.test(since)) throw bad('Cursor inválido.');
  const changes = Array.isArray(b.changes) ? b.changes : []; if (changes.length > MAX_CHANGES) throw bad(`No máximo ${MAX_CHANGES} mudanças por vez.`);
  const clean = changes.map(cleanChange);
  return db.tx(async t => {
    await t.query('select id from users where id = $1 for update', [u.id]);          // uma sincronização por usuário por vez
    if (clean.length){
      const {rows: [{n}]} = await t.query('select count(*)::int as n from records where user_id = $1', [u.id]);
      if (n + clean.length > MAX_RECORDS_PER_USER) throw new HttpError(507, 'Limite de armazenamento da conta atingido.', 'quota_exceeded');
    }
    const written = new Set(); const rejected = [];
    for (const c of clean){
      const {rows} = await t.query(
        `insert into records (user_id, type, id, data, deleted, updated_at) values ($1, $2, $3, $4::jsonb, $5, $6)
         on conflict (user_id, type, id) do update set data = excluded.data, deleted = excluded.deleted, updated_at = excluded.updated_at, rev = excluded.rev, server_at = now()
         where records.updated_at <= excluded.updated_at
         returning rev`, [u.id, c.type, c.id, c.data, c.deleted, c.updatedAt]);
      if (rows[0]) written.add(String(rows[0].rev)); else rejected.push([c.type, c.id]);   // o servidor tem versão mais nova
    }
    const {rows} = await t.query('select type, id, data, deleted, updated_at, rev from records where user_id = $1 and rev > $2 order by rev limit $3', [u.id, since, PAGE]);
    const more = rows.length === PAGE;
    let cursor = BigInt(since); for (const r of rows) if (BigInt(r.rev) > cursor) cursor = BigInt(r.rev);
    if (!more) for (const w of written) if (BigInt(w) > cursor) cursor = BigInt(w);
    const out = rows.filter(r => !written.has(String(r.rev))).map(toRec);
    for (const [type, id] of rejected){ if (!out.some(x => x.type === type && x.id === id)){ const r = (await t.query('select type, id, data, deleted, updated_at, rev from records where user_id = $1 and type = $2 and id = $3', [u.id, type, id])).rows[0]; if (r) out.push(toRec(r)); } }
    return [200, {cursor: String(cursor), changes: out, more, accepted: written.size, rejected: rejected.length}];
  });
}

// ---------- roteador ----------
const ROUTES = {
  'GET /health': async (req, db) => { await db.query('select 1'); return [200, {ok: true, db: db.kind}]; },
  'POST /auth/register': register, 'POST /auth/login': login, 'POST /auth/refresh': refresh, 'POST /auth/logout': logout,
  'GET /me': me, 'PATCH /me': updateMe, 'DELETE /me': deleteMe,
  'GET /export': exportAll, 'POST /sync': sync,
};
module.exports = async function handle(req, res){
  if (req.method === 'OPTIONS') return send(req, res, 204);
  const url = new URL(req.url, 'http://x');
  let p = url.searchParams.get('__path'); p = p != null ? '/' + p : url.pathname.replace(/^\/api(?=\/|$)/, '');
  p = p.replace(/\/+$/, '') || '/';
  const fn = ROUTES[req.method + ' ' + p];
  if (!fn) return send(req, res, 404, {message: 'Rota não encontrada.', code: 'not_found'});
  try { const db = await getDb(); const [status, data] = await fn(req, db); send(req, res, status, data); }
  catch (e) {
    if (e instanceof HttpError) return send(req, res, e.status, {message: e.message, code: e.code});
    console.error(e); send(req, res, e.status || 500, {message: 'Erro no servidor.', code: 'server_error'});
  }
};
