/* Função da Vercel: todas as rotas /api/* chegam aqui (veja "rewrites" em vercel.json). */
const handle = require('../server/handler');
module.exports = (req, res) => handle(req, res);
