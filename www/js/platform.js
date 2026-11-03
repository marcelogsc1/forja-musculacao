/* ============================================================================
   Ponte com a plataforma: Android (Capacitor), navegador/PWA ou artifact.
   Tudo aqui degrada com segurança quando o recurso não existe.
   Plugins Capacitor usados quando presentes: App, Haptics, LocalNotifications,
   StatusBar, KeepAwake (opcional).
   ========================================================================== */
const Platform = (() => {
  const cap = window.Capacitor;
  const isNative = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  const isArtifact = !!window.claude || /claude|anthropic/i.test(location.hostname);
  const reg = {};
  const plug = n => { if (!cap) return null; if (cap.Plugins && cap.Plugins[n]) return cap.Plugins[n]; if (isNative && cap.registerPlugin) return reg[n] || (reg[n] = cap.registerPlugin(n)); return null; };
  let audio = null, wake = null, deferred = null;
  const standalone = () => { try { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch (e) { return false; } };
  const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; try { if (typeof canRerender === 'function' && canRerender()) render(); } catch (err) {} });
  window.addEventListener('appinstalled', () => { deferred = null; });
  const P = {
    isNative, isArtifact,
    haptic(kind = 'light'){
      const H = plug('Haptics');
      if (H){ (kind === 'success' ? H.notification({type: 'SUCCESS'}) : H.impact({style: kind === 'heavy' ? 'HEAVY' : kind === 'medium' ? 'MEDIUM' : 'LIGHT'})).catch(() => {}); return; }
      try { navigator.vibrate && navigator.vibrate(kind === 'success' ? [30, 60, 30] : kind === 'heavy' ? 60 : kind === 'medium' ? 30 : 15); } catch (e) {}
    },
    alarm(){
      try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch (e) {}
      if (!ST.prefs.sound) return;
      try {
        audio = audio || new (window.AudioContext || window.webkitAudioContext)();
        [0, 0.22, 0.44].forEach((t, i) => { const o = audio.createOscillator(), g = audio.createGain(); o.frequency.value = i === 2 ? 1320 : 880; g.gain.setValueAtTime(0.0001, audio.currentTime + t); g.gain.exponentialRampToValueAtTime(0.25, audio.currentTime + t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + t + 0.18); o.connect(g).connect(audio.destination); o.start(audio.currentTime + t); o.stop(audio.currentTime + t + 0.2); });
      } catch (e) {}
    },
    unlockAudio(){ try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); if (audio.state === 'suspended') audio.resume(); } catch (e) {} },
    async scheduleRestEnd(date, label){ const LN = plug('LocalNotifications'); if (!LN) return; try { await LN.schedule({notifications: [{id: 7001, title: 'Descanso concluído', body: label || 'Hora da próxima série', schedule: {at: date, allowWhileIdle: true}}]}); } catch (e) {} },
    async cancelRestEnd(){ const LN = plug('LocalNotifications'); if (LN) try { await LN.cancel({notifications: [{id: 7001}]}); } catch (e) {} },
    async keepAwake(on){
      const K = plug('KeepAwake'); if (K){ try { on ? await K.keepAwake() : await K.allowSleep(); } catch (e) {} return; }
      try { if (on && 'wakeLock' in navigator && !wake){ wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => { wake = null; }); } else if (!on && wake){ await wake.release(); wake = null; } } catch (e) { wake = null; }
    },
    themeColor(dark){
      let m = document.querySelector('meta[name="theme-color"]'); if (!m){ m = document.createElement('meta'); m.name = 'theme-color'; document.head.appendChild(m); }
      m.content = dark ? '#0E0F11' : '#F3F3F1';
      const SB = plug('StatusBar'); if (SB){ SB.setStyle({style: dark ? 'DARK' : 'LIGHT'}).catch(() => {}); SB.setBackgroundColor && SB.setBackgroundColor({color: m.content}).catch(() => {}); }
    },
    /* Botão voltar do Android / gesto de voltar. handler() devolve false quando está na raiz. */
    onBack(handler){
      const App = plug('App');
      if (App){ App.addListener('backButton', () => { if (handler() === false) App.exitApp(); }); return; }
      if (isArtifact) return; // dentro do claude.ai o histórico pertence ao host
      try {
        history.replaceState({forja: 'base'}, '');
        history.pushState({forja: 'top'}, '');
        window.addEventListener('popstate', e => { if (!e.state || e.state.forja !== 'base') return; if (handler() === false) history.back(); else history.pushState({forja: 'top'}, ''); });
      } catch (e) {}
    },
    /* Instalação como app (PWA). No Android o Chrome gera um WebAPK: ícone na lista de apps e em Configurações > Apps. */
    canInstall(){ if (isNative || isArtifact) return false; if (standalone()) return false; return !!deferred || isIOS(); },
    async install(){
      if (deferred){ const e = deferred; deferred = null; e.prompt(); try { const c = await e.userChoice; return c && c.outcome === 'accepted' ? 'accepted' : 'dismissed'; } catch (err) { return 'dismissed'; } }
      if (isIOS()) return 'ios';
      return 'unavailable';
    },
    get standalone(){ return standalone(); },
    async share(text){ try { if (navigator.share){ await navigator.share({text}); return true; } } catch (e) {} return false; },
  };
  return P;
})();
