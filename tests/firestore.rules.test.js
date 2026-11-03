/* Testes das regras do Firestore no emulador oficial do Firebase.
   Uso:  npm run test:rules   (precisa de Java 21+; o firebase-tools baixa o emulador na primeira vez) */
const fs = require('fs');
const path = require('path');
const {initializeTestEnvironment, assertSucceeds, assertFails} = require('@firebase/rules-unit-testing');
const {doc, setDoc, getDoc, getDocs, deleteDoc, collection, query, where, orderBy, serverTimestamp, Timestamp, writeBatch} = require('firebase/firestore');

let ok = 0;
const t = async (name, fn) => { try { await fn(); ok++; console.log('ok -', name); } catch (e) { console.error('FALHOU -', name, '\n', e.message); process.exitCode = 1; } };
const at = iso => Timestamp.fromDate(new Date(iso));
const rec = (type, id, data, updatedAt = '2026-11-03T10:00:00.000Z', deleted = false) => ({type, id, data: deleted ? null : data, deleted, updatedAt: at(updatedAt), serverAt: serverTimestamp()});
const session = id => ({id, status: 'done', date: '2026-11-03', wname: 'Upper', items: [{uid: 'd1-1', ex: 'supino-reto-barra', sets: [{kg: 40, reps: 10, ok: true, t: 'n'}]}], updatedAt: '2026-11-03T10:00:00.000Z'});

(async () => {
  const env = await initializeTestEnvironment({projectId: 'forja-teste', firestore: {rules: fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8'), host: '127.0.0.1', port: 8085}});
  const ana = env.authenticatedContext('ana').firestore();
  const bia = env.authenticatedContext('bia').firestore();
  const anon = env.unauthenticatedContext().firestore();
  const R = (db, uid, rid) => doc(db, 'users', uid, 'records', rid);

  await t('dono grava treino', () => assertSucceeds(setDoc(R(ana, 'ana', 'session__s-1'), rec('session', 's-1', session('s-1')))));
  await t('dono lê o próprio treino', () => assertSucceeds(getDoc(R(ana, 'ana', 'session__s-1'))));
  await t('outra pessoa não lê', () => assertFails(getDoc(R(bia, 'ana', 'session__s-1'))));
  await t('outra pessoa não grava', () => assertFails(setDoc(R(bia, 'ana', 'session__s-2'), rec('session', 's-2', session('s-2')))));
  await t('sem login não lê', () => assertFails(getDoc(R(anon, 'ana', 'session__s-1'))));
  await t('sem login não lista', () => assertFails(getDocs(collection(anon, 'users', 'ana', 'records'))));
  await t('dono lista com consulta incremental', () => assertSucceeds(getDocs(query(collection(ana, 'users', 'ana', 'records'), where('serverAt', '>', Timestamp.fromMillis(0)), orderBy('serverAt')))));
  await t('id do documento precisa bater com tipo e id', () => assertFails(setDoc(R(ana, 'ana', 'session__outro'), rec('session', 's-3', session('s-3')))));
  await t('tipo desconhecido recusado', () => assertFails(setDoc(R(ana, 'ana', 'hack__x'), rec('hack', 'x', {a: 1}))));
  await t('campo extra no documento recusado', () => assertFails(setDoc(R(ana, 'ana', 'session__s-4'), {...rec('session', 's-4', session('s-4')), admin: true})));
  await t('serverAt forjado recusado', () => assertFails(setDoc(R(ana, 'ana', 'session__s-5'), {...rec('session', 's-5', session('s-5')), serverAt: at('2030-01-01T00:00:00.000Z')})));
  await t('updatedAt muito no futuro recusado', () => assertFails(setDoc(R(ana, 'ana', 'session__s-6'), rec('session', 's-6', session('s-6'), '2099-01-01T00:00:00.000Z'))));
  await t('status de treino inválido recusado', () => assertFails(setDoc(R(ana, 'ana', 'session__s-7'), rec('session', 's-7', {...session('s-7'), status: 'qualquer'}))));
  await t('treino com id interno diferente recusado', () => assertFails(setDoc(R(ana, 'ana', 'session__s-8'), rec('session', 's-8', session('s-9')))));
  await t('perfil válido', () => assertSucceeds(setDoc(R(ana, 'ana', 'profile__me'), rec('profile', 'me', {name: 'Ana', height: '168', goal: 'Hipertrofia', createdAt: '2026-11-03T10:00:00.000Z'}))));
  await t('perfil com id diferente de me recusado', () => assertFails(setDoc(R(ana, 'ana', 'profile__x'), rec('profile', 'x', {name: 'Ana'}))));
  await t('perfil com campo desconhecido recusado', () => assertFails(setDoc(R(ana, 'ana', 'profile__me'), rec('profile', 'me', {name: 'Ana', isAdmin: true}, '2026-11-03T11:00:00.000Z'))));
  await t('nome gigante recusado', () => assertFails(setDoc(R(ana, 'ana', 'profile__me'), rec('profile', 'me', {name: 'x'.repeat(200)}, '2026-11-03T11:00:00.000Z'))));
  await t('medida válida', () => assertSucceeds(setDoc(R(ana, 'ana', 'measurement__2026-11-03'), rec('measurement', '2026-11-03', {date: '2026-11-03', kg: 70.5, cintura: 82}))));
  await t('medida absurda recusada', () => assertFails(setDoc(R(ana, 'ana', 'measurement__2026-11-04'), rec('measurement', '2026-11-04', {date: '2026-11-04', kg: 9999}))));
  await t('rotina válida', () => assertSucceeds(setDoc(R(ana, 'ana', 'routine__r-hip5'), rec('routine', 'r-hip5', {id: 'r-hip5', nome: 'Hipertrofia', ord: 0, workouts: [{id: 'd1', nome: 'Upper', cor: 0, items: []}]}))));
  await t('preferências válidas', () => assertSucceeds(setDoc(R(ana, 'ana', 'prefs__me'), rec('prefs', 'me', {prefs: {theme: 'dark', rest: 90}, active: 'r-hip5', v: 4}))));
  await t('exercício criado válido', () => assertSucceeds(setDoc(R(ana, 'ana', 'exercise__c-1'), rec('exercise', 'c-1', {n: 'Supino articulado', m: 'peito', e: 'maquina', p: 'custom', pri: ['peitoral'], sec: [], d: []}))));
  await t('mais recente vence: gravação antiga recusada', () => assertFails(setDoc(R(ana, 'ana', 'session__s-1'), rec('session', 's-1', {...session('s-1'), note: 'velha'}, '2026-11-03T09:00:00.000Z'))));
  await t('mais recente vence: gravação nova aceita', () => assertSucceeds(setDoc(R(ana, 'ana', 'session__s-1'), rec('session', 's-1', {...session('s-1'), note: 'nova'}, '2026-11-03T12:00:00.000Z'))));
  await t('exclusão lógica (deleted) aceita', () => assertSucceeds(setDoc(R(ana, 'ana', 'session__s-1'), rec('session', 's-1', null, '2026-11-03T13:00:00.000Z', true))));
  await t('deleted com conteúdo recusado', () => assertFails(setDoc(R(ana, 'ana', 'session__s-10'), {...rec('session', 's-10', session('s-10')), deleted: true})));
  await t('lote de gravações do dono', async () => { const b = writeBatch(ana); for (let i = 0; i < 20; i++) b.set(R(ana, 'ana', 'session__b-' + i), rec('session', 'b-' + i, session('b-' + i))); await assertSucceeds(b.commit()); });
  await t('dono apaga documento (exclusão de conta)', () => assertSucceeds(deleteDoc(R(ana, 'ana', 'measurement__2026-11-03'))));
  await t('outra pessoa não apaga', () => assertFails(deleteDoc(R(bia, 'ana', 'prefs__me'))));
  await t('coleções fora de users/{uid}/records bloqueadas', () => assertFails(setDoc(doc(ana, 'publico', 'x'), {a: 1})));
  await t('documento users/{uid} bloqueado', () => assertFails(setDoc(doc(ana, 'users', 'ana'), {a: 1})));

  await env.cleanup();
  console.log(`\n${ok} testes de regras passaram${process.exitCode ? ', com falhas acima' : ''}.`);
})();
