/* Senhas (scrypt), token de acesso (JWT HS256) e token de renovação. Só módulos nativos do Node. */
const crypto = require('crypto');

const ACCESS_TTL = 60 * 60;               // 1 hora
const REFRESH_TTL = 60 * 60 * 24 * 60;    // 60 dias (renovado a cada uso)

function secret(){
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) throw Object.assign(new Error('AUTH_SECRET ausente ou curto (mínimo 32 caracteres).'), {status: 500});
  return 'dev-secret-apenas-para-testes-locais-0000';
}
const b64u = b => Buffer.from(b).toString('base64url');

function hashPassword(pass){
  const N = 16384, r = 8, p = 1; const salt = crypto.randomBytes(16);
  const h = crypto.scryptSync(pass, salt, 32, {N, r, p, maxmem: 64 * 1024 * 1024});
  return `scrypt$${N}$${r}$${p}$${salt.toString('base64url')}$${h.toString('base64url')}`;
}
function checkPassword(pass, stored){
  try {
    const [alg, N, r, p, salt, hash] = stored.split('$'); if (alg !== 'scrypt') return false;
    const want = Buffer.from(hash, 'base64url');
    const got = crypto.scryptSync(pass, Buffer.from(salt, 'base64url'), want.length, {N: +N, r: +r, p: +p, maxmem: 64 * 1024 * 1024});
    return crypto.timingSafeEqual(got, want);
  } catch (e) { return false; }
}
function signAccess(userId){
  const head = b64u(JSON.stringify({alg: 'HS256', typ: 'JWT'}));
  const now = Math.floor(Date.now() / 1000);
  const body = b64u(JSON.stringify({sub: userId, iat: now, exp: now + ACCESS_TTL}));
  const sig = crypto.createHmac('sha256', secret()).update(head + '.' + body).digest('base64url');
  return `${head}.${body}.${sig}`;
}
function verifyAccess(token){
  if (!token) return null; const parts = token.split('.'); if (parts.length !== 3) return null;
  const good = crypto.createHmac('sha256', secret()).update(parts[0] + '.' + parts[1]).digest();
  const got = Buffer.from(parts[2], 'base64url');
  if (got.length !== good.length || !crypto.timingSafeEqual(got, good)) return null;
  try { const p = JSON.parse(Buffer.from(parts[1], 'base64url').toString()); return p.exp > Date.now() / 1000 ? p : null; } catch (e) { return null; }
}
const newRefresh = () => crypto.randomBytes(32).toString('base64url');
const sha256 = s => crypto.createHash('sha256').update(s).digest('hex');
const newUserId = () => 'u_' + crypto.randomBytes(10).toString('hex');

module.exports = {ACCESS_TTL, REFRESH_TTL, hashPassword, checkPassword, signAccess, verifyAccess, newRefresh, sha256, newUserId};
