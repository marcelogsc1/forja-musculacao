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
  let audio = null, wake = null, deferred = null, pre = null;
  const standalone = () => { try { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch (e) { return false; } };
  const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; try { if (typeof canRerender === 'function' && canRerender()) render(); } catch (err) {} });
  window.addEventListener('appinstalled', () => { deferred = null; });
  let chanOk = false;
  const chan = async LN => { if (chanOk || !LN.createChannel) return; try { await LN.createChannel({id: 'descanso', name: 'Fim do descanso', description: 'Avisa quando o descanso entre as séries acaba', importance: 5, visibility: 1, vibration: true, lights: true}); chanOk = true; } catch (e) {} };
  const swPost = msg => { try { if (isArtifact || !('serviceWorker' in navigator) || !('Notification' in window) || Notification.permission !== 'granted') return; const c = navigator.serviceWorker.controller; if (c) c.postMessage(msg); else navigator.serviceWorker.ready.then(r => r.active && r.active.postMessage(msg)).catch(() => {}); } catch (e) {} };
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
    /* bipes já agendados no relógio de áudio: tocam na hora certa mesmo se o navegador atrasar os timers */
    alarmAt(sec){
      P.alarmCancel(); if (!ST.prefs.sound) return false;
      try {
        audio = audio || new (window.AudioContext || window.webkitAudioContext)(); if (audio.state === 'suspended') audio.resume();
        if (audio.state !== 'running') return false;
        const m = audio.createGain(); m.connect(audio.destination); const t0 = audio.currentTime + Math.max(0, sec);
        [0, 0.22, 0.44].forEach((t, i) => { const o = audio.createOscillator(), g = audio.createGain(); o.frequency.value = i === 2 ? 1320 : 880; g.gain.setValueAtTime(0.0001, t0 + t); g.gain.exponentialRampToValueAtTime(0.25, t0 + t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + t + 0.18); o.connect(g).connect(m); o.start(t0 + t); o.stop(t0 + t + 0.2); });
        pre = m; return true;
      } catch (e) { return false; }
    },
    alarmCancel(){ if (pre){ try { pre.disconnect(); } catch (e) {} pre = null; } },
    buzz(){ try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch (e) {} },
    unlockAudio(){ try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); if (audio.state === 'suspended') audio.resume(); } catch (e) {} },
    /* v4.32: aviso do fim do descanso com o app em segundo plano.
       Android (app): notificação local exata, num canal com som e vibração.
       Navegador/PWA: o service worker espera o tempo e mostra a notificação (som e vibração do sistema),
       só se o app não estiver na tela. No artefato do claude.ai não há como avisar com o app fechado. */
    restNotify(){ if (isNative) return 'native'; if (isArtifact || !('Notification' in window) || !('serviceWorker' in navigator)) return 'none'; return Notification.permission; },
    async askNotify(){
      const LN = plug('LocalNotifications');
      if (LN){ try { let p = await LN.checkPermissions(); if (p.display !== 'granted') p = await LN.requestPermissions(); await chan(LN); return p.display === 'granted'; } catch (e) { return false; } }
      if (!('Notification' in window)) return false;
      try { return (await Notification.requestPermission()) === 'granted'; } catch (e) { return false; }
    },
    async exactAlarmOk(){ const LN = plug('LocalNotifications'); if (!LN || !LN.checkExactNotificationSetting) return true; try { return (await LN.checkExactNotificationSetting()).exact_alarm !== 'denied'; } catch (e) { return true; } },
    async openExactAlarm(){ const LN = plug('LocalNotifications'); if (LN && LN.changeExactNotificationSetting) try { await LN.changeExactNotificationSetting(); } catch (e) {} },
    async scheduleRestEnd(date, label){
      const body = label ? `${label}: hora da próxima série` : 'Hora da próxima série';
      const LN = plug('LocalNotifications');
      if (LN){ try { await chan(LN); await LN.cancel({notifications: [{id: 7001}]}).catch(() => {}); await LN.schedule({notifications: [{id: 7001, title: 'Descanso concluído', body, channelId: 'descanso', schedule: {at: date, allowWhileIdle: true}}]}); } catch (e) {} return; }
      swPost({type: 'rest-at', at: +date, title: 'Descanso concluído', body});
    },
    async cancelRestEnd(){ const LN = plug('LocalNotifications'); if (LN){ try { await LN.cancel({notifications: [{id: 7001}]}); } catch (e) {} return; } swPost({type: 'rest-cancel'}); },
    async keepAwake(on){
      const K = plug('KeepAwake'); if (K){ try { on ? await K.keepAwake() : await K.allowSleep(); } catch (e) {} return; }
      try { if (on && 'wakeLock' in navigator && !wake){ wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => { wake = null; }); } else if (!on && wake){ await wake.release(); wake = null; } } catch (e) { wake = null; }
    },
    themeColor(dark){
      let m = document.querySelector('meta[name="theme-color"]'); if (!m){ m = document.createElement('meta'); m.name = 'theme-color'; document.head.appendChild(m); }
      m.content = dark ? '#0E0F11' : '#E8E6E1';
      const SB = plug('StatusBar'); if (SB){ SB.setStyle({style: dark ? 'DARK' : 'LIGHT'}).catch(() => {}); SB.setBackgroundColor && SB.setBackgroundColor({color: m.content}).catch(() => {}); }
    },
    /* Botão voltar do Android / gesto de voltar. handler() devolve false quando está na raiz. */
    onBack(handler, depthFn){
      const App = plug('App');
      if (App){ App.addListener('backButton', () => { if (handler() === false) App.exitApp(); }); return; }
      if (isArtifact) return; // dentro do claude.ai o histórico pertence ao host
      /* Voltar no navegador/PWA: o app mantém no histórico uma "escada" com um degrau por camada aberta
         (folha, teclado, páginas, aba). Cada voltar consome um degrau e fecha a camada de cima.
         O Chrome ignora no voltar degraus criados sem toque do usuário, por isso eles só são
         criados logo depois de um toque ou tecla. Degraus que sobram (camada fechada pelo próprio app)
         são pulados de uma vez quando o voltar chega à raiz. */
      try {
        let depth = 0;
        history.replaceState({forja: 'step', n: 0}, '');
        const sync = () => { const want = Math.min(8, Math.max(0, depthFn ? depthFn() : 1)); while (depth < want){ try { history.pushState({forja: 'step', n: depth + 1}, ''); depth++; } catch (e) { break; } } };
        const later = () => setTimeout(sync, 0);
        window.addEventListener('click', later, {passive: true});
        window.addEventListener('keydown', later, {passive: true});
        window.addEventListener('popstate', e => {
          const st = e.state; if (!st || st.forja !== 'step') return;
          const prev = depth; depth = st.n; if (st.n >= prev) return;
          if (handler() === false){ if (st.n > 0) history.go(-st.n); else history.back(); }
        });
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
