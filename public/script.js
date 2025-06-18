// URL base da API
const API_BASE_URL = 'http://localhost:3000';

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

function showError(message) {
    hideLoading();
    results.classList.remove('hidden');
    resultsCount.textContent = 'Erro na busca';
    jobsList.innerHTML = `
        <div class="job-card" style="text-align: center; color: #e74c3c;">
            <h3>❌ Erro</h3>
            <p>${message}</p>
            <p style="margin-top: 10px; font-size: 0.9em; color: #7f8c8d;">
                Verifique se a API está rodando em ${API_BASE_URL}
            </p>
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
        // Criar links apenas para URLs válidas
        const links = [];
        
        if (job.primaryUrl || job.url) {
            links.push(`<a href="${job.primaryUrl || job.url}" target="_blank" class="job-link">📋 Ver Vaga</a>`);
        }
        
        if (job.applyUrl && job.applyUrl !== job.url) {
            links.push(`<a href="${job.applyUrl}" target="_blank" class="job-link apply">✉️ Candidatar-se</a>`);
        }
        
        if (job.companyUrl && job.companyUrl !== job.url && job.companyUrl !== job.applyUrl) {
            links.push(`<a href="${job.companyUrl}" target="_blank" class="job-link">🏢 Página da Empresa</a>`);
        }

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

// Funções de busca
async function fetchAPI(endpoint) {
    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Erro na API:', error);
        throw error;
    }
}

async function searchJuniorSAP() {
    try {
        const data = await fetchAPI('/jobs/junior-sap');
        showResults(data.jobs, data.searchCriteria);
    } catch (error) {
        showError(`Erro ao buscar vagas Junior SAP: ${error.message}`);
    }
}

async function searchJuniorSAPCLT() {
    try {
        const data = await fetchAPI('/jobs/junior-sap-clt');
        showResults(data.jobs, data.searchCriteria);
    } catch (error) {
        showError(`Erro ao buscar vagas Junior SAP CLT: ${error.message}`);
    }
}

async function searchEstagioSAP() {
    try {
        const data = await fetchAPI('/jobs/estagio-sap');
        showResults(data.jobs, data.searchCriteria);
    } catch (error) {
        showError(`Erro ao buscar estágios SAP: ${error.message}`);
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
        showError(`Erro ao carregar departamentos: ${error.message}`);
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
        showError(`Erro ao carregar cidades: ${error.message}`);
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
    
    // Adicionar parâmetros apenas se preenchidos
    const searchQuery = formData.get('searchQuery')?.trim();
    const department = formData.get('department')?.trim();
    const city = formData.get('city')?.trim();
    const level = formData.get('level')?.trim();
    const technologies = formData.get('technologies')?.trim();
    const exclude = formData.get('exclude')?.trim();
    
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
        showError(`Erro na busca customizada: ${error.message}`);
    }
});

function clearForm() {
    customSearchForm.reset();
    results.classList.add('hidden');
    infoList.classList.add('hidden');
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Frontend carregado! API esperada em:', API_BASE_URL);
});