// Puxar para atualizar: no topo da tela, puxe para baixo e solte.
/* Ao soltar: envia e recebe os dados da conta, procura versão nova do app (o service worker recarrega sozinho
   quando acha uma, ou avisa se houver treino aberto) e confere se as animações estão disponíveis.
   Não recarrega a página à toa: o usuário continua onde estava. */
const PTR = (() => {
  const LIMIT = 72, MAX = 120;
  let el = null, y0 = 0, x0 = 0, pull = 0, on = false, busy = false, ready = false;
  const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v13M6 12l6 6 6-6"/></svg>';
  const spin = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 3a9 9 0 1 1-9 9"/></svg>';
  function mk(){ if (el) return el; el = document.createElement('div'); el.className = 'ptr'; el.setAttribute('aria-hidden', 'true'); el.innerHTML = arrow; document.body.appendChild(el); return el; }
  const blocked = t => busy || window.scrollY > 0 || !canRerender() || (t && t.closest && t.closest('.sheet,#kp,input,textarea,select,video,[data-noptr]'));
  function draw(){
    const d = Math.min(MAX, pull); const p = Math.min(1, d / LIMIT);
    el.style.transform = `translateY(${d - 56}px) rotate(${p * 180}deg)`; el.style.opacity = Math.min(1, d / 40);
    const r = d >= LIMIT; if (r !== ready){ ready = r; el.classList.toggle('ready', r); if (r) Platform.haptic('light'); }
  }
  function reset(){ on = false; pull = 0; ready = false; if (!el) return; el.classList.remove('ready', 'busy'); el.classList.add('back'); el.style.transform = ''; el.style.opacity = ''; setTimeout(() => { if (el && !on && !busy){ el.classList.remove('back'); el.innerHTML = arrow; } }, 260); }
  document.addEventListener('touchstart', e => {
    if (e.touches.length !== 1 || blocked(e.target)) return;
    y0 = e.touches[0].clientY; x0 = e.touches[0].clientX; pull = 0; on = true;
  }, {passive: true});
  document.addEventListener('touchmove', e => {
    if (!on) return;
    const dy = e.touches[0].clientY - y0, dx = e.touches[0].clientX - x0;
    if (pull === 0 && (dy <= 0 || Math.abs(dx) > Math.abs(dy) || window.scrollY > 0)){ if (Math.abs(dx) > 8 || dy < -4) on = false; return; }
    pull = Math.max(0, dy * 0.5); mk().classList.remove('back'); draw();
  }, {passive: true});
  const end = () => { if (!on) return; if (ready) run(); else reset(); };
  document.addEventListener('touchend', end, {passive: true});
  document.addEventListener('touchcancel', () => { if (on) reset(); }, {passive: true});

  async function run(){
    busy = true; on = false; mk(); el.classList.add('busy'); el.classList.remove('ready'); el.innerHTML = spin; el.style.transform = `translateY(${LIMIT - 56}px)`; el.style.opacity = 1;
    const t0 = Date.now(); let fresh = false, err = false;
    const jobs = [];
    if (typeof Store !== 'undefined' && Store.flush && (Store.mode === 'cloud' || Store.mode === 'api')) jobs.push(Promise.resolve(Store.flush()).catch(() => { err = true; }));
    if ('serviceWorker' in navigator && navigator.serviceWorker.getRegistration) jobs.push(navigator.serviceWorker.getRegistration().then(async reg => {
      if (!reg) return; await reg.update().catch(() => {});
      if (reg.installing || reg.waiting) fresh = true;
    }).catch(() => {}));
    if (typeof probeAnim === 'function') jobs.push(probeAnim());
    await Promise.race([Promise.all(jobs), new Promise(r => setTimeout(r, 12000))]);
    const wait = 600 - (Date.now() - t0); if (wait > 0) await new Promise(r => setTimeout(r, wait));
    busy = false; reset();
    if (canRerender()) render();
    if (fresh) toast('Versão nova encontrada. Atualizando…');
    else if (!navigator.onLine) toast('Sem internet. Mostrando o que está salvo no aparelho.');
    else if (err) toast('Não deu para sincronizar agora. Tento de novo em instantes.');
    else toast('Tudo atualizado');
  }
  return {run};
})();
