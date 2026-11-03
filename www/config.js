/* Configuração do Forja
   firebase: firebaseConfig do projeto (Console do Firebase > Configurações do projeto > Seus apps > App da Web).
             Esses valores são públicos por natureza; a proteção dos dados vem das regras (firestore.rules).
   Para voltar a funcionar sem conta, troque apiKey por 'COLE_AQUI'. */
window.FORJA_CONFIG = {
  firebase: {
    apiKey: 'AIzaSyCzWfoIpOwOiHUMy2V1H7k-KwJ__QAtgtc',
    authDomain: 'haltera-50d53.firebaseapp.com',
    projectId: 'haltera-50d53',
    storageBucket: 'haltera-50d53.firebasestorage.app',
    messagingSenderId: '121379477082',
    appId: '1:121379477082:web:80df97370b045c0263aa63'
  },
  /* Opcional: chave do site do reCAPTCHA v3 para o App Check na versão web. */
  appCheckSiteKey: ''
};
