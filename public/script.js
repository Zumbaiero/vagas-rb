// URL base da API - adequada para vagas-rb.tech
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : 'https://vagas-rb.tech/api';

// Elementos DOM
const loading = document.getElementById('loading');
const results = document.getElementById('results');
const jobsList = document.getElementById('jobsList');
const resultsCount = document.getElementById('resultsCount');
const infoList = document.getElementById('infoList');
const infoTitle = document.getElementById('infoTitle');
const infoContent = document.getElementById('infoContent');
const customSearchForm = document.getElementById('customSearchForm');

// Funções de utilidade
function showLoading() {
    loading.classList.remove('hidden');
    results.classList.add('hidden');
    infoList.classList.add('hidden');
}

function hideLoading() {
    loading.classList.add('hidden');
}

function showResults(jobs, searchInfo = '') {
    hideLoading();
    results.classList.remove('hidden');
    
    resultsCount.textContent = `${jobs.length} vaga${jobs.length !== 1 ? 's' : ''} encontrada${jobs.length !== 1 ? 's' : ''}`;
    
    if (searchInfo) {
        resultsCount.textContent += ` - ${searchInfo}`;
    }
    
    renderJobs(jobs);
}

function showError(message, errorType = 'generic') {
    hideLoading();
    results.classList.remove('hidden');
    resultsCount.textContent = 'Erro na busca';
    
    let errorDetails = '';
    
    if (errorType === 'cors') {
        errorDetails = `
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin-top: 15px;">
                <h4 style="color: #856404; margin-bottom: 10px;">🔧 Como resolver:</h4>
                <ol style="color: #856404; margin-left: 20px;">
                    <li>Certifique-se que o servidor está configurado corretamente</li>
                    <li>Verifique se o deploy foi feito na Vercel</li>
                    <li>Teste diretamente: <a href="https://vagas-rb.tech/api/jobs" target="_blank">https://vagas-rb.tech/api/jobs</a></li>
                </ol>
            </div>
        `;
    } else if (errorType === 'network') {
        errorDetails = `
            <div style="background: #f8d7da; border: 1px solid #f1aeb5; border-radius: 8px; padding: 15px; margin-top: 15px;">
                <h4 style="color: #721c24; margin-bottom: 10px;">🌐 Problema de conexão:</h4>
                <ul style="color: #721c24; margin-left: 20px;">
                    <li>Verifique sua conexão com a internet</li>
                    <li>Teste a API diretamente: <a href="https://vagas-rb.tech/api/jobs" target="_blank">https://vagas-rb.tech/api/jobs</a></li>
                    <li>Se estiver em desenvolvimento: <a href="http://localhost:3000/jobs" target="_blank">http://localhost:3000/jobs</a></li>
                </ul>
            </div>
        `;
    }
    
    jobsList.innerHTML = `
        <div class="job-card" style="text-align: center; color: #e74c3c;">
            <h3>❌ Erro</h3>
            <p style="margin-bottom: 15px;">${message}</p>
            ${errorDetails}
        </div>
    `;
}

// Função para renderizar vagas
function renderJobs(jobs) {
    if (!jobs || jobs.length === 0) {
        jobsList.innerHTML = `
            <div class="job-card text-center">
                <h3>🔍 Nenhuma vaga encontrada</h3>
                <p>Tente ajustar os critérios de busca ou verifique outras opções.</p>
            </div>
        `;
        return;
    }

    jobsList.innerHTML = jobs.map(job => {
        // Criar links corrigidos
        const links = [];
        
        // Botão "Ver Vaga" - usa a URL da vaga (jobAdUrl ou url)
        const jobUrl = job.url || job.jobAdUrl || job.primaryUrl;
        if (jobUrl) {
            links.push(`<a href="${jobUrl}" target="_blank" class="job-link">📋 Ver Vaga</a>`);
        }
        
        // Botão "Candidatar-se" - usa applyUrl se disponível e diferente da URL principal
        if (job.applyUrl && job.applyUrl !== jobUrl) {
            links.push(`<a href="${job.applyUrl}" target="_blank" class="job-link apply">✉️ Candidatar-se</a>`);
        }
        
        // Botão "Página da Empresa" - sempre vai para a página da Bosch no Brasil
        links.push(`<a href="https://careers.smartrecruiters.com/BoschGroup/brazil" target="_blank" class="job-link company">🏢 Página da Empresa</a>`);

        // Informações da vaga (omitir campos vazios)
        const jobInfo = [];
        
        if (job.location && job.location !== 'N/A') {
            jobInfo.push(`<div class="info-item"><strong>📍 Local:</strong> ${job.location}</div>`);
        }
        
        if (job.department && job.department !== 'N/A') {
            jobInfo.push(`<div class="info-item"><strong>🏢 Departamento:</strong> ${job.department}</div>`);
        }
        
        if (job.expirationDate) {
            const expDate = new Date(job.expirationDate).toLocaleDateString('pt-BR');
            jobInfo.push(`<div class="info-item"><strong>⏰ Expira em:</strong> ${expDate}</div>`);
        }
        
        if (job.refNumber) {
            jobInfo.push(`<div class="info-item"><strong>🔢 Ref:</strong> ${job.refNumber}</div>`);
        }

        return `
            <div class="job-card">
                <div class="job-header">
                    <h3 class="job-title">${job.title || job.name || 'Título não disponível'}</h3>
                </div>
                
                ${jobInfo.length > 0 ? `<div class="job-info">${jobInfo.join('')}</div>` : ''}
                
                ${job.description && job.description.trim() ? `
                    <div style="margin-bottom: 15px; padding: 15px; background: #f1f3f4; border-radius: 8px;">
                        <strong>📝 Descrição:</strong>
                        <p style="margin-top: 8px; font-size: 0.95em; line-height: 1.5;">
                            ${job.description.substring(0, 300)}${job.description.length > 300 ? '...' : ''}
                        </p>
                    </div>
                ` : ''}
                
                ${links.length > 0 ? `
                    <div class="job-links">
                        ${links.join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// [resto das funções continua igual ao código anterior...]

// Funções de busca
async function fetchAPI(endpoint) {
    try {
        showLoading();
        console.log(`🔍 Fazendo requisição para: ${API_BASE_URL}${endpoint}`);
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ Dados recebidos:', data);
        return data;
    } catch (error) {
        console.error('❌ Erro na API:', error);
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('CORS_ERROR');
        } else if (error.message.includes('Failed to fetch')) {
            throw new Error('NETWORK_ERROR');
        }
        
        throw error;
    }
}

async function searchJuniorSAP() {
    try {
        const data = await fetchAPI('/jobs/junior-sap');
        showResults(data.jobs, data.searchCriteria);
    } catch (error) {
        if (error.message === 'CORS_ERROR') {
            showError('Erro de CORS: Não é possível acessar a API', 'cors');
        } else if (error.message === 'NETWORK_ERROR') {
            showError('Não foi possível conectar ao servidor', 'network');
        } else {
            showError(`Erro ao buscar vagas Junior SAP: ${error.message}`);
        }
    }
}

async function searchJuniorSAPCLT() {
    try {
        const data = await fetchAPI('/jobs/junior-sap-clt');
        showResults(data.jobs, data.searchCriteria);
    } catch (error) {
        if (error.message === 'CORS_ERROR') {
            showError('Erro de CORS: Não é possível acessar a API', 'cors');
        } else if (error.message === 'NETWORK_ERROR') {
            showError('Não foi possível conectar ao servidor', 'network');
        } else {
            showError(`Erro ao buscar vagas Junior SAP CLT: ${error.message}`);
        }
    }
}

async function searchEstagioSAP() {
    try {
        const data = await fetchAPI('/jobs/estagio-sap');
        showResults(data.jobs, data.searchCriteria);
    } catch (error) {
        if (error.message === 'CORS_ERROR') {
            showError('Erro de CORS: Não é possível acessar a API', 'cors');
        } else if (error.message === 'NETWORK_ERROR') {
            showError('Não foi possível conectar ao servidor', 'network');
        } else {
            showError(`Erro ao buscar estágios SAP: ${error.message}`);
        }
    }
}

async function loadDepartments() {
    try {
        showLoading();
        const data = await fetchAPI('/departments');
        hideLoading();
        
        infoTitle.textContent = `🏢 Departamentos Disponíveis (${data.count})`;
        infoContent.innerHTML = data.departments.map(dept => 
            `<div class="info-item-list">${dept}</div>`
        ).join('');
        
        infoList.classList.remove('hidden');
        results.classList.add('hidden');
    } catch (error) {
        if (error.message === 'CORS_ERROR') {
            showError('Erro de CORS: Não é possível acessar a API', 'cors');
        } else if (error.message === 'NETWORK_ERROR') {
            showError('Não foi possível conectar ao servidor', 'network');
        } else {
            showError(`Erro ao carregar departamentos: ${error.message}`);
        }
    }
}

async function loadCities() {
    try {
        showLoading();
        const data = await fetchAPI('/cities');
        hideLoading();
        
        infoTitle.textContent = `🌍 Cidades Disponíveis (${data.count})`;
        infoContent.innerHTML = data.cities.map(city => 
            `<div class="info-item-list">${city}</div>`
        ).join('');
        
        infoList.classList.remove('hidden');
        results.classList.add('hidden');
    } catch (error) {
        if (error.message === 'CORS_ERROR') {
            showError('Erro de CORS: Não é possível acessar a API', 'cors');
        } else if (error.message === 'NETWORK_ERROR') {
            showError('Não foi possível conectar ao servidor', 'network');
        } else {
            showError(`Erro ao carregar cidades: ${error.message}`);
        }
    }
}

function hideInfoList() {
    infoList.classList.add('hidden');
}

// Busca customizada
customSearchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(customSearchForm);
    const params = new URLSearchParams();
    
    const searchQuery = document.getElementById('searchQuery').value?.trim();
    const department = document.getElementById('department').value?.trim();
    const city = document.getElementById('city').value?.trim();
    const level = document.getElementById('level').value?.trim();
    const technologies = document.getElementById('technologies').value?.trim();
    const exclude = document.getElementById('exclude').value?.trim();
    
    if (searchQuery) params.append('q', searchQuery);
    if (department) params.append('department', department);
    if (city) params.append('city', city);
    if (level) params.append('level', level);
    if (technologies) params.append('technologies', technologies);
    if (exclude) params.append('exclude', exclude);
    
    try {
        const endpoint = params.toString() ? 
            `/jobs/search?${params.toString()}` : 
            '/jobs';
            
        const data = await fetchAPI(endpoint);
        
        const searchInfo = params.toString() ? 
            'Busca customizada' : 
            'Todas as vagas';
            
        showResults(data.jobs, searchInfo);
    } catch (error) {
        if (error.message === 'CORS_ERROR') {
            showError('Erro de CORS: Não é possível acessar a API', 'cors');
        } else if (error.message === 'NETWORK_ERROR') {
            showError('Não foi possível conectar ao servidor', 'network');
        } else {
            showError(`Erro na busca customizada: ${error.message}`);
        }
    }
});

function clearForm() {
    customSearchForm.reset();
    results.classList.add('hidden');
    infoList.classList.add('hidden');
}

// Teste de conectividade na inicialização
async function testConnection() {
    try {
        console.log('🔍 Testando conexão com a API...');
        const response = await fetch(`${API_BASE_URL}/jobs?limit=1`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            console.log('✅ API conectada com sucesso!');
        } else {
            console.warn('⚠️ API respondeu mas com erro:', response.status);
        }
    } catch (error) {
        console.error('❌ Erro ao conectar com a API:', error.message);
        if (window.location.hostname === 'localhost') {
            console.log('💡 Certifique-se que o servidor Node.js está rodando em http://localhost:3000');
        } else {
            console.log('💡 Verifique se o deploy foi feito corretamente na Vercel');
        }
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Frontend carregado! API esperada em:', API_BASE_URL);
    console.log('🌍 Domínio: vagas-rb.tech');
    testConnection();
});