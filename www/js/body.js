/* Mapa muscular anatômico.
   Desenho: react-native-body-highlighter (MIT, © 2022 ELABBASSI Hicham), dados em BODYDATA.
   BODY(pri, sec, {levels, label}) devolve frente e costas lado a lado.
   pri/sec: regiões do app (REG). levels: {regiao: 0..3} para mapa de calor. */
const BODY = (() => {
  const memo = new Map();
  function cls(regs, pri, sec, lv){
    if (!regs.length) return 'm-off';
    if (lv){ let l = 0; for (const r of regs) l = Math.max(l, lv[r] || 0); return 'm-l' + l; }
    for (const r of regs) if (pri.includes(r)) return 'm-pri';
    for (const r of regs) if (sec.includes(r)) return 'm-sec';
    return 'm-off';
  }
  function side(arr, border, vb, pri, sec, lv){
    let h = '';
    for (const [skin, regs, d] of arr) h += `<path class="${skin ? 'm-skin' : cls(regs, pri, sec, lv)}" d="${d}"/>`;
    return `<svg viewBox="${vb.join(' ')}" aria-hidden="true">${h}<path class="m-border" d="${border}"/></svg>`;
  }
  return function BODY(pri = [], sec = [], opts = {}){
    const key = JSON.stringify([pri, sec, opts.levels || null]);
    if (memo.has(key)) return memo.get(key);
    const label = opts.label || (pri.length ? 'Músculos: ' + pri.map(r => REG[r]).join(', ') : 'Mapa muscular');
    const html = `<div class="mmap" role="img" aria-label="${label}"><figure>${side(BODYDATA.front, BODYDATA.bf, BODYDATA.vbF, pri, sec, opts.levels)}<figcaption>Frente</figcaption></figure><figure>${side(BODYDATA.back, BODYDATA.bb, BODYDATA.vbB, pri, sec, opts.levels)}<figcaption>Costas</figcaption></figure></div>`;
    if (memo.size > 40) memo.clear();
    memo.set(key, html); return html;
  };
})();
