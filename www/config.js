/* Configuração do Forja
   apiUrl        endereço da API para a versão web. Na Vercel, a API fica no mesmo domínio: '/api'.
   nativeApiUrl  endereço COMPLETO da API para o app Android (lá a página roda em https://localhost).
                 Troque pelo domínio do seu projeto na Vercel, ex.: 'https://forja-app.vercel.app/api'.
   Com apiUrl vazio o app funciona sem conta, salvando só no aparelho. */
window.FORJA_CONFIG = {
  apiUrl: location.protocol === 'file:' ? '' : '/api',
  nativeApiUrl: 'https://SEU-PROJETO.vercel.app/api'
};
