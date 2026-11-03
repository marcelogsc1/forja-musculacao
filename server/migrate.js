/* Cria as tabelas no banco de DATABASE_URL (opcional: a API também faz isso sozinha na primeira chamada). */
require('./lib/db')().then(db => { console.log('Banco pronto (' + db.kind + ').'); process.exit(0); }).catch(e => { console.error(e); process.exit(1); });
