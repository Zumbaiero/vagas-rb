// Determina a URL base da API
const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : 'https://vagas-rb.tech/api';

// Seletores de elementos
const loadingEl = document.getElementById('loading');
const resultsEl = document.getElementById('results');
const jobsListEl = document.getElementById('jobsList');
const resultsCountEl = document.getElementById('resultsCount');
const infoListEl = document.getElementById('infoList');
const infoTitleEl = document.getElementById('infoTitle');
const infoContentEl = document.getElementById('infoContent');
const customSearchForm = document.getElementById('customSearchForm');

// Exibir e ocultar loading
function showLoading() {
  loadingEl.classList.remove('hidden');
  resultsEl.classList.add('hidden');
  infoListEl.classList.add('hidden');
}

function hideLoading() {
  loadingEl.classList.add('hidden');
}

// Mostrar resultados ou erros
function displayResults(jobs, criteria) {
  hideLoading();
  resultsEl.classList.remove('hidden');
  resultsCountEl.textContent = `${jobs.length} vaga${jobs.length === 1 ? '' : 's'} encontrada${jobs.length === 1 ? '' : 's'}`;
  if (criteria) resultsCountEl.textContent += ` - ${criteria}`;
  renderJobs(jobs);
}

function displayError(msg, type = 'generic') {
  hideLoading();
  resultsEl.classList.remove('hidden');
  resultsCountEl.textContent = 'Erro na busca';
  let details = '';

  if (type === 'cors') {
    details = `
      <div style="background: #fff3cd; border: 1px solid #ffeeba; border-radius: 8px; padding: 15px; margin-top: 15px;">
        <h4 style="color: #856404;">🔧 Como resolver:</h4>
        <ol style="color: #856404;">
          <li>Verifique se o backend está configurado para CORS</li>
          <li>Confirme o deploy na Vercel</li>
          <li>Teste a API em: <a href="${API_BASE}/jobs" target="_blank">${API_BASE}/jobs</a></li>
        </ol>
      </div>
    `;
  } else if (type === 'network') {
    details = `
      <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 15px; margin-top: 15px;">
        <h4 style="color: #721c24;">🌐 Problema de conexão:</h4>
        <ul style="color: #721c24;">
          <li>Cheque sua conexão de internet</li>
          <li>Teste diretamente a API: <a href="${API_BASE}/jobs" target="_blank">${API_BASE}/jobs</a></li>
          <li>Se local, rode o servidor em http://localhost:3000</li>
        </ul>
      </div>
    `;
  }

  jobsListEl.innerHTML = `
    <div class="job-card" style="text-align: center; color: #e74c3c;">
      <h3>❌ Erro</h3>
      <p>${msg}</p>
      ${details}
    </div>
  `;
}

function renderJobs(jobs) {
  if (!jobs || jobs.length === 0) {
    jobsListEl.innerHTML = `
      <div class="job-card text-center">
        <h3>🔍 Nenhuma vaga encontrada</h3>
        <p>Ajuste seus filtros ou tente outro termo.</p>
      </div>
    `;
    return;
  }
  jobsListEl.innerHTML = jobs.map(job => {
    const jobUrl = job.url || job.jobAdUrl || job.primaryUrl;
    const links = [];
    
    if (jobUrl) {
      links.push(`<a href="${jobUrl}" target="_blank" class="job-link">📋 Ver Vaga</a>`);
    }
    if (job.applyUrl && job.applyUrl !== jobUrl) {
      links.push(`<a href="${job.applyUrl}" target="_blank" class="job-link apply">✉️ Candidatar-se</a>`);
    }
    links.push(`<a href="https://careers.smartrecruiters.com/BoschGroup/brazil" target="_blank" class="job-link">🏢 Empresa</a>`);

    const jobInfoItems = [];
    if (job.location && job.location !== 'N/A') {
      jobInfoItems.push(`<div class="info-item"><strong>📍 Local:</strong> ${job.location}</div>`);
    }
    if (job.department && job.department !== 'N/A') {
      jobInfoItems.push(`<div class="info-item"><strong>🏢 Departamento:</strong> ${job.department}</div>`);
    }
    if (job.expirationDate) {
      const date = new Date(job.expirationDate).toLocaleDateString('pt-BR');
      jobInfoItems.push(`<div class="info-item"><strong>⏰ Expira em:</strong> ${date}</div>`);
    }
    if (job.refNumber) {
      jobInfoItems.push(`<div class="info-item"><strong>🔢 Ref:</strong> ${job.refNumber}</div>`);
    }

    return `
      <div class="job-card">
        <div class="job-header">
          <h3 class="job-title">${job.title || 'Título não informado'}</h3>
        </div>
        ${jobInfoItems.length ? `<div class="job-info">${jobInfoItems.join('')}</div>` : ''}
        ${
          job.description
            ? `<div style="background: #f1f3f4; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                 <strong>📝 Descrição:</strong>
                 <p style="margin-top: 8px; font-size: 0.95em;">${job.description.substring(0, 300)}${job.description.length > 300 ? '...' : ''}</p>
               </div>`
            : ''
        }
        <div class="job-links">${links.join('')}</div>
      </div>
    `;
  }).join('');
}

// Funções fetch
async function callAPI(endpoint) {
  showLoading();
  try {
    const response = await fetch(`${API_BASE}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (err) {
    if (err.message.includes('Failed to fetch')) {
      throw new Error('NETWORK_ERROR');
    }
    throw err;
  }
}

// Rotas front-end
async function searchJuniorSAP() {
  try {
    const data = await callAPI('/jobs/junior-sap');
    displayResults(data.jobs, data.searchCriteria);
  } catch (err) {
    if (err.message === 'NETWORK_ERROR') {
      displayError('Falha de conexão', 'network');
    } else {
      displayError(`Erro: ${err.message}`, 'cors');
    }
  }
}

async function searchJuniorSAPCLT() {
  try {
    const data = await callAPI('/jobs/junior-sap-clt');
    displayResults(data.jobs, data.searchCriteria);
  } catch (err) {
    if (err.message === 'NETWORK_ERROR') {
      displayError('Falha de conexão', 'network');
    } else {
      displayError(`Erro: ${err.message}`, 'cors');
    }
  }
}

async function searchEstagioSAP() {
  try {
    const data = await callAPI('/jobs/estagio-sap');
    displayResults(data.jobs, data.searchCriteria);
  } catch (err) {
    if (err.message === 'NETWORK_ERROR') {
      displayError('Falha de conexão', 'network');
    } else {
      displayError(`Erro: ${err.message}`, 'cors');
    }
  }
}

async function loadDepartments() {
  try {
    const data = await callAPI('/departments');
    hideLoading();
    infoTitleEl.textContent = `Departamentos (${data.count})`;
    infoContentEl.innerHTML = data.departments.map(d => `<div class="info-item-list">${d}</div>`).join('');
    infoListEl.classList.remove('hidden');
    resultsEl.classList.add('hidden');
  } catch (err) {
    if (err.message === 'NETWORK_ERROR') {
      displayError('Falha de conexão', 'network');
    } else {
      displayError(`Erro ao carregar departamentos: ${err.message}`, 'cors');
    }
  }
}

async function loadCities() {
  try {
    const data = await callAPI('/cities');
    hideLoading();
    infoTitleEl.textContent = `Cidades (${data.count})`;
    infoContentEl.innerHTML = data.cities.map(city => `<div class="info-item-list">${city}</div>`).join('');
    infoListEl.classList.remove('hidden');
    resultsEl.classList.add('hidden');
  } catch (err) {
    if (err.message === 'NETWORK_ERROR') {
      displayError('Falha de conexão', 'network');
    } else {
      displayError(`Erro ao carregar cidades: ${err.message}`, 'cors');
    }
  }
}

function hideInfoList() {
  infoListEl.classList.add('hidden');
}

// Submissão do formulário
customSearchForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const params = new URLSearchParams();
  const searchQuery = document.getElementById('searchQuery').value.trim();
  const department = document.getElementById('department').value.trim();
  const city = document.getElementById('city').value.trim();
  const level = document.getElementById('level').value.trim();
  const technologies = document.getElementById('technologies').value.trim();
  const exclude = document.getElementById('exclude').value.trim();

  if (searchQuery) params.append('q', searchQuery);
  if (department) params.append('department', department);
  if (city) params.append('city', city);
  if (level) params.append('level', level);
  if (technologies) params.append('technologies', technologies);
  if (exclude) params.append('exclude', exclude);

  const endpoint = params.toString() ? `/jobs/search?${params.toString()}` : '/jobs';
  try {
    const data = await callAPI(endpoint);
    const criteria = params.toString() ? 'Busca personalizada' : 'Todas as vagas';
    displayResults(data.jobs, criteria);
  } catch (err) {
    if (err.message === 'NETWORK_ERROR') {
      displayError('Falha de conexão', 'network');
    } else {
      displayError(`Erro na busca customizada: ${err.message}`, 'cors');
    }
  }
});

function clearForm() {
  customSearchForm.reset();
  resultsEl.classList.add('hidden');
  infoListEl.classList.add('hidden');
}

// Teste de conectividade ao carregar
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Frontend carregado. Testando API em:', API_BASE);
  try {
    const testResp = await fetch(`${API_BASE}/jobs?limit=1`);
    if (testResp.ok) {
      console.log('API conectada com sucesso!');
    } else {
      console.warn('API respondeu, mas com status não-ok:', testResp.status);
    }
  } catch (err) {
    console.error('Erro no teste de conexão:', err.message);
  }
});