/* Conexão com o banco.
   Produção: PostgreSQL pela variável DATABASE_URL (Neon na Vercel, Supabase, etc.).
   Desenvolvimento: sem DATABASE_URL, usa PGlite (PostgreSQL de verdade rodando dentro do Node, pasta .data/). */
const fs = require('fs');
const path = require('path');
let ready = null;

async function create(){
  const schema = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');
  if (process.env.DATABASE_URL){
    const {Pool} = require('pg');
    const pool = new Pool({connectionString: process.env.DATABASE_URL, max: Number(process.env.PG_POOL_MAX || 3), idleTimeoutMillis: 10000});
    const db = {
      kind: 'pg',
      query: (text, params) => pool.query(text, params),
      async tx(fn){ const c = await pool.connect(); try { await c.query('begin'); const r = await fn({query: (t, p) => c.query(t, p)}); await c.query('commit'); return r; } catch (e) { await c.query('rollback').catch(() => {}); throw e; } finally { c.release(); } },
    };
    await pool.query(schema);
    return db;
  }
  const {PGlite} = await import('@electric-sql/pglite');
  const dir = process.env.PGLITE_DIR || path.join(__dirname, '..', '..', '.data', 'pglite');
  fs.mkdirSync(dir, {recursive: true});
  const lite = new PGlite(dir);
  await lite.exec(schema);
  return {
    kind: 'pglite',
    query: (text, params) => lite.query(text, params),
    tx: fn => lite.transaction(t => fn({query: (q, p) => t.query(q, p)})),
  };
}
module.exports = () => ready || (ready = create().catch(e => { ready = null; throw e; }));
