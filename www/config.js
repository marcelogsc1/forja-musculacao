/* Configuração do Forja
   firebase: cole aqui o objeto firebaseConfig do seu projeto
             (Console do Firebase > Configurações do projeto > Seus apps > App da Web).
             Esses valores são públicos por natureza; a proteção dos dados vem das regras (firestore.rules).
   Enquanto estiver com "COLE_AQUI", o app funciona sem conta, salvando só no aparelho. */
window.FORJA_CONFIG = {
  firebase: {
    apiKey: 'COLE_AQUI',
    authDomain: 'SEU-PROJETO.firebaseapp.com',
    projectId: 'SEU-PROJETO',
    storageBucket: 'SEU-PROJETO.firebasestorage.app',
    messagingSenderId: '',
    appId: ''
  },
  /* Opcional: chave do site do reCAPTCHA v3 para o App Check na versão web. */
  appCheckSiteKey: ''
};
