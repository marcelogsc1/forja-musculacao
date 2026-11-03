/* ============================================================================
   Camada de dados do Forja (offline first, sincronização por registros)
   ----------------------------------------------------------------------------
   A interface trabalha com dois objetos em memória:
     ST   → perfil, preferências, rotinas, exercícios criados, medidas, imagens
     SESS → treinos (sessões)
   Para gravar e sincronizar, esses objetos são divididos em REGISTROS pequenos:

     tipo         id                  conteúdo (data)
     profile      'me'                ST.profile
     prefs        'me'                {prefs, active, v}
     routine      id da rotina        rotina inteira (treinos e exercícios) + ord
     exercise     id do exercício     exercício criado pelo usuário
     measurement  data (AAAA-MM-DD)   medidas corporais do dia
     media        id do exercício     {asset} imagem própria do exercício
     session      id do treino        treino completo (séries, cargas, notas)

   Cada registro tem updatedAt (gerado no aparelho) e deleted (exclusão lógica).
   Só registros alterados são gravados e enviados: mudar uma carga envia um
   treino, não o banco inteiro.

   Gravação local: IndexedDB (sem limite prático de tamanho, assíncrono).
   Se o navegador bloquear IndexedDB, o app segue funcionando só em memória.

   Envio: fila de saída (outbox) com espera de ~1,5 s para juntar toques
   seguidos, nova tentativa automática e envio imediato ao sair do app.

   Adaptadores remotos, todos com a mesma interface sync({since, changes}):
     RestAdapter   → SEU backend (/api). Contrato em docs/API.md
     ClaudeAdapter → banco do artifact no claude.ai (versão publicada lá)
   ========================================================================== */

const recKey = (type, id) => type + '/' + id;
const STATE_TYPES = ['profile', 'prefs', 'routine', 'exercise', 'measurement', 'media'];
const nowISO = () => new Date().toISOString();

/* estado (ST) → registros, sem as sessões */
function decomposeState(st){
  const out = new Map(); const put = (type, id, data) => out.set(recKey(type, id), {type, id, data});
  put('profile', 'me', st.profile || {});
  put('prefs', 'me', {prefs: st.prefs || {}, active: st.active || null, v: st.v || 4});
  (st.routines || []).forEach((r, i) => put('routine', r.id, {...r, ord: i}));
  Object.entries(st.custom || {}).forEach(([id, e]) => put('exercise', id, e));
  (st.bw || []).forEach(m => m && m.date && put('measurement', m.date, m));
  Object.entries(st.media || {}).forEach(([ex, a]) => put('media', ex, {asset: a}));
  return out;
}
/* registros → estado (ST) */
function assembleState(recs){
  const st = {v: 4, routines: [], active: null, custom: {}, media: {}, bw: [], prefs: {}, profile: {}};
  const routines = [];
  for (const r of recs){
    if (r.deleted || !r.data) continue;
    if (r.type === 'profile') st.profile = r.data;
    else if (r.type === 'prefs'){ st.prefs = r.data.prefs || {}; st.active = r.data.active || null; st.v = r.data.v || 4; }
    else if (r.type === 'routine') routines.push(r.data);
    else if (r.type === 'exercise') st.custom[r.id] = r.data;
    else if (r.type === 'measurement') st.bw.push(r.data);
    else if (r.type === 'media') st.media[r.id] = r.data.asset;
  }
  st.routines = routines.sort((a, b) => (a.ord ?? 0) - (b.ord ?? 0)).map(({ord, ...r}) => r);
  st.bw.sort((a, b) => a.date.localeCompare(b.date));
  return st;
}

/* ---------- armazenamento local (IndexedDB, com reserva em memória) ---------- */
const LocalDB = (() => {
  let db = null; const mem = {rec: new Map(), meta: new Map()};
  const tx = (store, mode, fn) => new Promise((ok, bad) => { const t = db.transaction(store, mode); const r = fn(t.objectStore(store)); t.oncomplete = () => ok(r && r.result); t.onerror = () => bad(t.error); t.onabort = () => bad(t.error); });
  return {
    get mode(){ return db ? 'idb' : 'mem'; },
    async open(){
      try {
        if (!window.indexedDB) throw new Error('sem indexedDB');
        db = await new Promise((ok, bad) => { const r = indexedDB.open('forja', 1); r.onupgradeneeded = () => { const d = r.result; d.createObjectStore('rec', {keyPath: 'k'}); d.createObjectStore('meta'); }; r.onsuccess = () => ok(r.result); r.onerror = () => bad(r.error); r.onblocked = () => bad(new Error('bloqueado')); });
      } catch (e) { db = null; }
    },
    async all(){ if (!db) return [...mem.rec.values()]; return tx('rec', 'readonly', s => s.getAll()); },
    async put(list){ if (!list.length) return; if (!db){ list.forEach(r => mem.rec.set(r.k, r)); return; } await tx('rec', 'readwrite', s => { list.forEach(r => s.put(r)); }); },
    async del(keys){ if (!keys.length) return; if (!db){ keys.forEach(k => mem.rec.delete(k)); return; } await tx('rec', 'readwrite', s => { keys.forEach(k => s.delete(k)); }); },
    async getMeta(k){ if (!db) return mem.meta.get(k); return tx('meta', 'readonly', s => s.get(k)); },
    async setMeta(k, v){ if (!db){ mem.meta.set(k, v); return; } await tx('meta', 'readwrite', s => { s.put(v, k); }); },
    async clear(){ if (!db){ mem.rec.clear(); mem.meta.clear(); return; } await tx('rec', 'readwrite', s => { s.clear(); }); await tx('meta', 'readwrite', s => { s.clear(); }); },
  };
})();

/* ---------- login no seu backend ---------- */
const Auth = (() => {
  const KEY = 'forja.auth';
  let data = null; try { data = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
  const cfg = () => window.FORJA_CONFIG || {};
  async function call(path, body){
    let r;
    try { r = await fetch(apiBase() + path, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)}); }
    catch (e) { throw Object.assign(new Error('Sem conexão com o servidor'), {status: 0}); }
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(j.message || 'Falha na autenticação'), {status: r.status, code: j.code});
    return j;
  }
  function save(j){ data = {token: j.token, refreshToken: j.refreshToken || null, user: j.user}; try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} }
  let refreshing = null;
  return {
    get enabled(){ return !!apiBase(); },
    get token(){ return data && data.token; },
    get user(){ return data && data.user; },
    async login(email, password){ save(await call('/auth/login', {email, password})); },
    async register(name, email, password){ save(await call('/auth/register', {name, email, password})); },
    /* várias requisições podem receber 401 juntas: só uma renova o token */
    refresh(){ if (!data || !data.refreshToken) return Promise.resolve(false); return refreshing || (refreshing = call('/auth/refresh', {refreshToken: data.refreshToken}).then(j => { save(j); return true; }).catch(e => e.status === 0 ? null : false).finally(() => { refreshing = null; })); },
    async logout(){ const rt = data && data.refreshToken; data = null; try { localStorage.removeItem(KEY); } catch (e) {} if (rt) call('/auth/logout', {refreshToken: rt}).catch(() => {}); },
    cfg,
  };
})();
/* No app Android (Capacitor) a página roda em https://localhost, então a API precisa de endereço completo */
function apiBase(){
  const c = window.FORJA_CONFIG || {};
  const native = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
  return ((native && c.nativeApiUrl) || c.apiUrl || '').replace(/\/$/, '');
}

function RestAdapter(){
  async function req(method, path, body, retry = true){
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 20000);
    let r;
    try { r = await fetch(apiBase() + path, {method, signal: ctl.signal, headers: {'Content-Type': 'application/json', Authorization: 'Bearer ' + Auth.token}, body: body ? JSON.stringify(body) : undefined}); }
    catch (e) { throw Object.assign(new Error('offline'), {status: 0}); }
    finally { clearTimeout(t); }
    if (r.status === 401 && retry){ const ok = await Auth.refresh(); if (ok) return req(method, path, body, false); if (ok === null) throw Object.assign(new Error('offline'), {status: 0}); }
    const j = r.status === 204 ? null : await r.json().catch(() => null);
    if (!r.ok) throw Object.assign(new Error((j && j.message) || 'HTTP ' + r.status), {status: r.status, code: j && j.code});
    return j;
  }
  return {
    name: 'api', assets: null, downloads: null,
    async init(){ if (!Auth.token) return null; try { const me = await req('GET', '/me'); return {uid: me.id, user: me}; } catch (e) { if (e.status === 0) return {uid: Auth.user && Auth.user.id, offline: true}; if (e.status === 401) return {expired: true}; return null; } },
    /* envia mudanças e recebe as dos outros aparelhos desde o cursor */
    sync: ({since, changes}) => req('POST', '/sync', {since, changes}),
    deleteMe: password => req('DELETE', '/me', {password}),
    exportAll: () => req('GET', '/export'),
  };
}

/* Adaptador do claude.ai: mantém o formato antigo (um documento "estado" + coleção de sessões)
   para não mexer nos dados já salvos lá. Traduz para registros na entrada e na saída. */
function ClaudeAdapter(){
  let db = null, uid = null;
  const stP = () => `data/users/${uid}/estado`;
  const sCol = () => db.doc(`data/users/${uid}/perfil`).collection('sessoes');
  const toRecs = (st, at) => [...decomposeState(st).values()].map(r => ({...r, updatedAt: at}));
  return {
    name: 'claude', assets: null, downloads: null, snapshot: true,
    async init(){
      let user = null;
      try { [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]); } catch (e) { return null; }
      try { this.downloads = await window.claude.use('downloads'); } catch (e) {}
      try { uid = user ? await user.id() : null; } catch (e) {}
      if (!db || !uid) return null;
      try { this.assets = await window.claude.use('assets'); } catch (e) {}
      return {uid};
    },
    async sync({since, changes}){
      for (const c of changes.filter(c => c.type === 'session')) c.deleted ? await sCol().doc(c.id).delete() : await sCol().doc(c.id).set(c.data);
      if (changes.some(c => c.type !== 'session')) await db.doc(stP()).set({...Store.stateSnapshot(), updatedAt: nowISO()});
      if (since) return {cursor: since, changes: []};
      const a = await db.doc(stP()).get(); const q = await sCol().get();
      const sess = q.docs.map(d => { const s = {...d.data(), id: d.id}; return {type: 'session', id: d.id, data: s, updatedAt: s.updatedAt || '2000-01-01T00:00:00.000Z'}; });
      if (a.exists){ const st = a.data(); return {cursor: 'claude', full: true, changes: [...toRecs(st, st.updatedAt || '2000-01-01T00:00:00.000Z'), ...sess]}; }
      const p = await db.doc(`data/users/${uid}/plano`).get();
      if (p.exists){ const st = freshState(); st.routines = [migrateOld(p.data())]; st.active = st.routines[0].id; return {cursor: 'claude', full: true, pushState: true, changes: [...toRecs(st, '2000-01-01T00:00:00.000Z'), ...sess]}; }
      return {cursor: 'claude', changes: sess};
    },
    subscribe(onRecs){
      sCol().onSnapshot(snap => onRecs(snap.docChanges().map(ch => ch.type === 'removed' ? {type: 'session', id: ch.doc.id, deleted: true, data: null, updatedAt: nowISO()} : {type: 'session', id: ch.doc.id, data: {...ch.doc.data(), id: ch.doc.id}, updatedAt: ch.doc.data().updatedAt || nowISO()})), () => {});
      db.doc(stP()).onSnapshot(snap => { if (snap.exists){ const st = snap.data(); onRecs(toRecs(st, st.updatedAt || nowISO()), {fullState: true}); } }, () => {});
    },
  };
}

/* ---------- o "Store": une memória, disco e servidor ---------- */
const Store = (() => {
  const R = new Map();         // chave → registro {type, id, data, updatedAt, deleted}
  const SIG = new Map();       // chave → JSON do conteúdo (detecta o que mudou)
  let outbox = new Map();      // chave → updatedAt enviado pendente
  let cursor = null, account = null;
  let adapter = null, ready = false, syncing = false, again = false, timer = null, subscribed = false, renderLater = false;
  const writes = new Map(); let writeTimer = null;
  const api = {mode: 'loading', uid: null, adapter: null, authExpired: false};

  // ---- disco ----
  function queueWrite(r){ writes.set(recKey(r.type, r.id), {...r, k: recKey(r.type, r.id)}); clearTimeout(writeTimer); writeTimer = setTimeout(flushWrites, 60); }
  async function flushWrites(){ clearTimeout(writeTimer); if (!writes.size) return; const list = [...writes.values()]; writes.clear(); try { await LocalDB.put(list); } catch (e) { console.warn('falha ao gravar', e); } }
  const saveMeta = () => { LocalDB.setMeta('outbox', [...outbox]).catch(() => {}); LocalDB.setMeta('cursor', cursor).catch(() => {}); LocalDB.setMeta('account', account).catch(() => {}); };

  // ---- registrar mudanças locais ----
  function setLocal(type, id, data, deleted = false){
    const k = recKey(type, id); const sig = deleted ? null : JSON.stringify(data);
    if (!deleted && SIG.get(k) === sig) return false;
    if (deleted && !R.has(k)) return false;
    if (deleted && R.get(k).deleted) return false;
    const r = {type, id, data: deleted ? null : data, updatedAt: nowISO(), deleted};
    R.set(k, r); if (deleted) SIG.delete(k); else SIG.set(k, sig);
    outbox.set(k, r.updatedAt); queueWrite(r); return true;
  }
  /* compara o ST atual com os registros e grava só o que mudou */
  function diffState(){
    const next = decomposeState(ST); let n = 0;
    next.forEach(r => { if (setLocal(r.type, r.id, JSON.parse(JSON.stringify(r.data)))) n++; });
    R.forEach((r, k) => { if (STATE_TYPES.includes(r.type) && !r.deleted && !next.has(k)){ setLocal(r.type, r.id, null, true); n++; } });
    return n;
  }
  api.saveState = () => { if (diffState()){ saveMeta(); schedule(); } };
  api.saveSession = s => { s.updatedAt = nowISO(); if (setLocal('session', s.id, JSON.parse(JSON.stringify(s)))){ saveMeta(); schedule(); } };
  api.deleteSession = id => { SESS = SESS.filter(s => s.id !== id); if (setLocal('session', id, null, true)){ saveMeta(); schedule(); } };
  api.stateSnapshot = () => JSON.parse(JSON.stringify(ST));
  api.pending = () => outbox.size;

  // ---- remontar memória a partir dos registros ----
  function rebuild(){ const list = [...R.values()]; ST = assembleState(list.filter(r => r.type !== 'session')); fixState(); SESS = list.filter(r => r.type === 'session' && !r.deleted && r.data).map(r => normSession(JSON.parse(JSON.stringify(r.data)))); }
  function rebuildSessions(ids){
    for (const id of ids){
      const r = R.get(recKey('session', id)); const i = SESS.findIndex(s => s.id === id);
      if (!r || r.deleted || !r.data){ if (i >= 0) SESS.splice(i, 1); continue; }
      const s = normSession(JSON.parse(JSON.stringify(r.data))); if (i >= 0){ for (const k of Object.keys(SESS[i])) delete SESS[i][k]; Object.assign(SESS[i], s); } else SESS.push(s);
    }
  }
  /* aplica registros vindos do servidor (vence a mudança mais recente) */
  function applyRemote(list, o = {}){
    let stChanged = false; const sessIds = [];
    for (const r of list){
      const k = recKey(r.type, r.id); const L = R.get(k);
      const local = outbox.has(k);
      if (local && !o.serverWins && L && (L.updatedAt || '') > (r.updatedAt || '')) continue;
      const sig = r.deleted ? null : JSON.stringify(r.data);
      const same = L && !!L.deleted === !!r.deleted && (r.deleted || SIG.get(k) === sig);
      if (same){ if (local && (L.updatedAt || '') <= (r.updatedAt || '')) outbox.delete(k); continue; }
      if (!L && r.deleted) continue;
      const rec = {type: r.type, id: r.id, data: r.deleted ? null : r.data, updatedAt: r.updatedAt, deleted: !!r.deleted};
      R.set(k, rec); if (rec.deleted) SIG.delete(k); else SIG.set(k, sig); outbox.delete(k); queueWrite(rec);
      if (r.type === 'session') sessIds.push(r.id); else stChanged = true;
    }
    /* documento "estado" completo (claude.ai): o que não veio nele foi apagado em outro aparelho */
    if (o.fullState){ const keep = new Set(list.filter(r => r.type !== 'session').map(r => recKey(r.type, r.id))); R.forEach((r, k) => { if (STATE_TYPES.includes(r.type) && !r.deleted && !keep.has(k) && !outbox.has(k)){ const rec = {...r, data: null, deleted: true}; R.set(k, rec); SIG.delete(k); queueWrite(rec); stChanged = true; } }); }
    if (o.fullSessions){ const keep = new Set(list.filter(r => r.type === 'session').map(r => r.id)); R.forEach((r, k) => { if (r.type === 'session' && !r.deleted && !keep.has(r.id) && !outbox.has(k)){ const rec = {...r, data: null, deleted: true}; R.set(k, rec); SIG.delete(k); queueWrite(rec); sessIds.push(r.id); } }); }
    if (stChanged){ ST = assembleState([...R.values()].filter(r => r.type !== 'session')); fixState(); }
    if (sessIds.length) rebuildSessions(sessIds);
    if (stChanged || sessIds.length){ if (stChanged) applyTheme(); if (canRerender()) render(); else renderLater = true; }
  }
  setInterval(() => { if (renderLater && canRerender()){ renderLater = false; render(); } }, 1000);

  // ---- sincronização ----
  /* agrupa alterações seguidas: envia no máximo ~1,5 s depois da primeira (não adia indefinidamente durante o treino) */
  let due = 0;
  function schedule(ms = 1500){ renderSync(); if (!ready) return; const at = Date.now() + ms; if (timer && due <= at) return; clearTimeout(timer); due = at; timer = setTimeout(() => { timer = null; sync(); }, ms); }
  async function sync(){
    if (!ready || !adapter) return;
    if (syncing){ again = true; return; }
    syncing = true; clearTimeout(timer); timer = null;
    try {
      await flushWrites();
      if (cursor == null){
        /* primeira sincronização desta conta: recebe tudo; em caso de mesmo registro, vale o do servidor */
        const res = await adapter.sync({since: null, changes: []});
        applyRemote(res.changes, {serverWins: true, fullState: res.full, fullSessions: res.full});
        if (res.pushState) R.forEach((r, k) => { if (STATE_TYPES.includes(r.type)) outbox.set(k, r.updatedAt); });
        cursor = res.cursor; let more = res.more;
        while (more){ const r2 = await adapter.sync({since: cursor, changes: []}); applyRemote(r2.changes); cursor = r2.cursor; more = r2.more; }
        saveMeta();
      }
      for (let guard = 0; guard < 50; guard++){
        const keys = [...outbox.keys()].slice(0, 200);
        const changes = keys.map(k => R.get(k)).filter(Boolean).map(r => ({type: r.type, id: r.id, data: r.data, updatedAt: r.updatedAt, deleted: !!r.deleted}));
        const sent = new Map(changes.map(c => [recKey(c.type, c.id), c.updatedAt]));
        keys.forEach(k => { if (!R.get(k)) outbox.delete(k); });
        const res = await adapter.sync({since: cursor, changes});
        sent.forEach((at, k) => { if (outbox.get(k) === at) outbox.delete(k); });
        applyRemote(res.changes || []); cursor = res.cursor; saveMeta();
        if (!outbox.size && !res.more) break;
      }
      api.authExpired = false;
    } catch (e) {
      if (e && e.status === 401){ api.authExpired = true; ready = false; render(); }
      else if (e && e.code === 'quota_exceeded') toast('O espaço do servidor acabou. Apague treinos antigos.');
      else { if (e && e.status !== 0) console.warn('sincronização falhou', e); clearTimeout(timer); timer = setTimeout(() => { timer = null; sync(); }, 10000 + Math.random() * 5000); due = Date.now() + 10000; }
    } finally {
      syncing = false; renderSync();
      if (again){ again = false; schedule(300); }
    }
  }
  api.flush = sync;

  // ---- partida ----
  async function loadLocal(){
    await LocalDB.open();
    const list = await LocalDB.all();
    outbox = new Map((await LocalDB.getMeta('outbox')) || []); cursor = (await LocalDB.getMeta('cursor')) ?? null; account = (await LocalDB.getMeta('account')) ?? null;
    if (list.length){ list.forEach(r => { const {k, ...rec} = r; R.set(k, rec); if (!rec.deleted) SIG.set(k, JSON.stringify(rec.data)); }); rebuild(); return; }
    /* migração da versão anterior (localStorage) */
    let old = null; for (const key of ['forja.cache.v3', 'forja.local.v2']){ try { const j = JSON.parse(localStorage.getItem(key) || 'null'); if (j && j.st && Array.isArray(j.sess)){ old = j; break; } } catch (e) {} }
    ST = old ? old.st : freshState(); fixState(); SESS = old ? old.sess.map(normSession) : [];
    diffState(); SESS.forEach(s => setLocal('session', s.id, JSON.parse(JSON.stringify(s))));
    if (old) R.forEach(r => { if (r.type === 'session' && r.data && r.data.updatedAt) r.updatedAt = r.data.updatedAt; });
    await flushWrites(); saveMeta();
    if (old) try { ['forja.cache.v3', 'forja.local.v2', 'forja.outbox.v3'].forEach(k => localStorage.removeItem(k)); } catch (e) {}
  }
  api.init = async function(){
    await loadLocal(); onDataLoaded();
    await connect();
  };
  async function connect(){
    ready = false; adapter = null; api.adapter = null;
    const cfg = window.FORJA_CONFIG || {};
    const a = apiBase() ? (Auth.token ? RestAdapter() : null) : (window.claude && window.claude.use ? ClaudeAdapter() : null);
    let info = null; if (a){ try { info = await a.init(); } catch (e) { info = null; } }
    if (!info || info.expired){ api.mode = 'local'; api.authExpired = !!(info && info.expired); renderSync(); render(); return; }
    /* dados locais de outra conta não podem subir para esta */
    if (account && info.uid && account !== info.uid){ await wipe(); ST = freshState(); fixState(); SESS = []; diffState(); }
    if (account !== info.uid){ account = info.uid; cursor = null; saveMeta(); }
    adapter = a; api.adapter = a; api.uid = info.uid; api.mode = a.name === 'api' ? 'api' : 'cloud'; ready = true;
    render(); await sync();
    if (adapter.subscribe && !subscribed){ subscribed = true; adapter.subscribe((recs, o) => applyRemote(recs, o || {})); }
  }
  async function wipe(){ R.clear(); SIG.clear(); outbox = new Map(); cursor = null; account = null; writes.clear(); await LocalDB.clear(); }
  api.switchToApi = async () => { subscribed = false; await connect(); };
  /* sair: tenta enviar o que falta e limpa este aparelho */
  api.logout = async () => { await sync().catch(() => {}); const left = outbox.size; await Auth.logout(); await wipe(); ST = freshState(); fixState(); SESS = []; diffState(); await flushWrites(); outbox = new Map(); saveMeta(); ready = false; adapter = null; api.adapter = null; api.mode = 'local'; return left; };
  api.deleteAccount = async password => { if (!adapter || !adapter.deleteMe) throw new Error('sem conta'); await adapter.deleteMe(password); await Auth.logout(); await wipe(); ST = freshState(); fixState(); SESS = []; diffState(); await flushWrites(); outbox = new Map(); saveMeta(); ready = false; adapter = null; api.adapter = null; api.mode = 'local'; };
  api.wipeLocal = wipe;
  api.reloadRemote = () => { if (ready && adapter && !adapter.subscribe) sync(); };
  api.storage = () => LocalDB.mode;

  window.addEventListener('online', () => schedule(200));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden'){ flushWrites(); if (outbox.size) sync(); } else api.reloadRemote(); });
  window.addEventListener('pagehide', () => { flushWrites(); });
  setInterval(() => { if (document.visibilityState === 'visible') api.reloadRemote(); }, 60000);
  return api;
})();
function saveState(){ Store.saveState(); }
function saveSession(s){ Store.saveSession(s); }
function deleteSession(id){ Store.deleteSession(id); }
function renderSync(){ const el = document.querySelector('.sync'); if (el) el.className = 'sync ' + syncClass(); }
function syncClass(){ return Store.mode === 'cloud' || Store.mode === 'api' ? (Store.pending() ? 'pending' : 'cloud') : Store.mode === 'local' ? 'local' : ''; }
