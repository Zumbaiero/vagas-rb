// URL base da API - detecta automaticamente o ambiente
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : '/api'; // Mudança importante: usar caminho relativo em produção

console.log('🌍 Ambiente detectado:', window.location.hostname);
console.log('🔗 API Base URL:', API_BASE_URL);

// [Resto do código continua exatamente igual ao que você tem]

// Apenas uma função de teste melhorada:
async function testConnection() {
    try {
        console.log('🔍 Testando conexão com a API...');
        const response = await fetch(`${API_BASE_URL}/health`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API conectada com sucesso!', data);
        } else {
            console.error('❌ API Health check falhou:', response.status);
        }
    } catch (error) {
        console.error('❌ Erro ao conectar com a API:', error.message);
        console.log('🔗 Teste manual: ' + window.location.origin + '/api/health');
    }
}

// [Todo o resto do seu código script.js continua igual]