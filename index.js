// Importa as bibliotecas necessárias
const express = require('express');
const axios = require('axios');

// Cria a aplicação Express
const app = express();

// **ADICIONE ESTAS LINHAS PARA RESOLVER O CORS:**
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// **ADICIONE TAMBÉM ESTA LINHA PARA SERVIR ARQUIVOS ESTÁTICOS:**
app.use(express.static('public'));

// Define a porta em que o servidor irá escutar
const PORT = process.env.PORT || 3000;

// Constantes de configuração da SmartRecruiters
const COMPANY_ID = 'BoschGroup';
const BASE_URL = `https://api.smartrecruiters.com/v1/companies/${COMPANY_ID}/postings`;

/**
 * fetchJobs - Função para buscar vagas na API da SmartRecruiters
 * @param {Object} filters - Objeto contendo filtros opcionais:
 *   q          - palavra-chave de pesquisa (título/descrição)
 *   department - área/departamento
 *   city       - cidade
 *   limit      - número máximo de resultados
 *   country    - país (padrão: br)
 * @returns {Promise<Array>} Array de objetos { title, expirationDate, jobAdUrl, location, department }
 */
async function fetchJobs(filters = {}) {
  try {
    // Monta parâmetros básicos
    const params = { 
      country: filters.country || "br", 
      limit: filters.limit || 100  // Aumentei o limite para capturar mais vagas
    };

    // Adiciona filtros opcionais apenas se fornecidos
    if (filters.q) params.q = filters.q;
    if (filters.department) params.department = filters.department;
    if (filters.city) params.city = filters.city;

    console.log('Buscando vagas com parâmetros:', params);

    // Faz a requisição GET à API da SmartRecruiters
    const resp = await axios.get(BASE_URL, { params });
    const jobs = resp.data.content || resp.data.jobs || [];

    console.log(`Encontradas ${jobs.length} vagas na API`);

    // Mapeia e enriquece os dados das vagas
    return jobs.map(job => ({
      id: job.id,
      title: job.name || job.title,
      url: job.jobAdUrl || job.ref, // URL principal da vaga
      applyUrl: job.applyUrl, // URL direta para candidatura (se disponível)
      expirationDate: job.expirationDate,
      location: job.location ? `${job.location.city}, ${job.location.country}` : 'N/A',
      department: job.department ? job.department.label : 'N/A',
      description: job.jobAd ? job.jobAd.sections?.jobDescription?.text : null,
      // URLs adicionais que podem estar disponíveis
      refNumber: job.refNumber,
      companyUrl: `https://jobs.smartrecruiters.com/${COMPANY_ID}/${job.id || job.refNumber}`
    }));
  } catch (error) {
    console.error('Erro na requisição à API:', error.message);
    throw error;
  }
}

/**
 * filterJobsByKeywords - Filtra vagas por palavras-chave no título e descrição
 * @param {Array} jobs - Array de vagas
 * @param {Array} keywords - Array de palavras-chave para buscar
 * @param {Array} excludeKeywords - Array de palavras-chave para excluir
 * @returns {Array} Vagas filtradas
 */
function filterJobsByKeywords(jobs, keywords, excludeKeywords = []) {
  if (!keywords || keywords.length === 0) return jobs;
  
  return jobs.filter(job => {
    const searchText = `${job.title} ${job.description || ''}`.toLowerCase();
    
    // Verifica se contém as palavras-chave desejadas
    const hasKeywords = keywords.some(keyword => 
      searchText.includes(keyword.toLowerCase())
    );
    
    // Verifica se NÃO contém palavras-chave indesejadas
    const hasExcludedKeywords = excludeKeywords.some(keyword => 
      searchText.includes(keyword.toLowerCase())
    );
    
    return hasKeywords && !hasExcludedKeywords;
  });
}

/**
 * filterJobsByLocation - Filtra vagas por localização específica
 * @param {Array} jobs - Array de vagas
 * @param {string} targetCity - Cidade desejada
 * @returns {Array} Vagas filtradas por localização
 */
function filterJobsByLocation(jobs, targetCity) {
  if (!targetCity) return jobs;
  
  return jobs.filter(job => {
    const location = job.location.toLowerCase();
    return location.includes(targetCity.toLowerCase());
  });
}

/**
 * searchSpecificJobs - Busca vagas específicas (ex: Junior SAP)
 * @param {Object} searchCriteria - Critérios de busca
 * @returns {Promise<Array>} Vagas filtradas
 */
async function searchSpecificJobs(searchCriteria = {}) {
  const { 
    level = [], 
    technologies = [], 
    department, 
    city, 
    country,
    excludeKeywords = []
  } = searchCriteria;
  
  // Busca todas as vagas primeiro
  const allJobs = await fetchJobs({ department, city, country, limit: 100 });
  
  // Filtra por localização se especificada
  let filteredJobs = city ? filterJobsByLocation(allJobs, city) : allJobs;
  
  // Combina palavras-chave de nível e tecnologias
  const keywords = [...level, ...technologies];
  
  // Filtra por palavras-chave se especificadas
  if (keywords.length > 0) {
    filteredJobs = filterJobsByKeywords(filteredJobs, keywords, excludeKeywords);
  }
  
  return filteredJobs;
}

// Rota principal para buscar vagas
app.get('/jobs', async (req, res) => {
  try {
    const filters = {
      q: req.query.q,
      department: req.query.department,
      city: req.query.city,
      limit: parseInt(req.query.limit) || 100,
      country: req.query.country || 'br'
    };

    const result = await fetchJobs(filters);
    res.json({ 
      count: result.length, 
      jobs: result,
      filters: filters
    });
  }
  catch (err) {
    console.error('Erro ao buscar vagas:', err.message);
    res.status(500).json({ error: 'Erro ao buscar vagas', details: err.message });
  }
});

// Nova rota específica para buscar vagas Junior SAP em Campinas
app.get('/jobs/junior-sap', async (req, res) => {
  try {
    const result = await searchSpecificJobs({
      level: ['junior', 'jr'],
      technologies: ['sap', 'erp'],
      city: 'Campinas',
      excludeKeywords: ['senior', 'sênior', 'sr', 'pleno', 'lead', 'principal', 'especialista', 'expert', 'gerente', 'coordenador', 'supervisor']
    });
    
    res.json({ 
      count: result.length, 
      jobs: result.map(job => ({
        ...job,
        // Garantir que sempre tenha uma URL válida
        primaryUrl: job.url || job.companyUrl,
        allUrls: {
          jobAd: job.url,
          apply: job.applyUrl,
          company: job.companyUrl
        }
      })),
      searchCriteria: 'Junior SAP - Campinas (excluindo Senior/Pleno)',
      note: 'Use primaryUrl para acessar a vaga, ou confira allUrls para mais opções'
    });
  }
  catch (err) {
    console.error('Erro ao buscar vagas Junior SAP:', err.message);
    res.status(500).json({ error: 'Erro ao buscar vagas Junior SAP', details: err.message });
  }
});

// Nova rota específica para vagas Junior SAP sem estágio
app.get('/jobs/junior-sap-clt', async (req, res) => {
  try {
    const result = await searchSpecificJobs({
      level: ['junior', 'jr'],
      technologies: ['sap', 'erp'],
      city: 'Campinas',
      excludeKeywords: [
        'senior', 'sênior', 'sr', 'pleno', 'lead', 'principal', 'especialista', 'expert', 
        'gerente', 'coordenador', 'supervisor', 'estágio', 'estagiário', 'trainee', 'intern'
      ]
    });
    
    res.json({ 
      count: result.length, 
      jobs: result.map(job => ({
        ...job,
        primaryUrl: job.url || job.companyUrl,
        allUrls: {
          jobAd: job.url,
          apply: job.applyUrl,
          company: job.companyUrl
        }
      })),
      searchCriteria: 'Junior SAP CLT - Campinas (sem estágio/senior)',
      note: 'Use primaryUrl para acessar a vaga'
    });
  }
  catch (err) {
    console.error('Erro ao buscar vagas Junior SAP CLT:', err.message);
    res.status(500).json({ error: 'Erro ao buscar vagas Junior SAP CLT', details: err.message });
  }
});

// Nova rota apenas para estágios SAP em Campinas
app.get('/jobs/estagio-sap', async (req, res) => {
  try {
    const result = await searchSpecificJobs({
      level: ['estágio', 'estagiário', 'trainee', 'intern'],
      technologies: ['sap', 'erp'],
      city: 'Campinas',
      excludeKeywords: ['senior', 'sênior', 'sr', 'pleno', 'junior', 'jr']
    });
    
    res.json({ 
      count: result.length, 
      jobs: result,
      searchCriteria: 'Estágio SAP - Campinas'
    });
  }
  catch (err) {
    console.error('Erro ao buscar estágios SAP:', err.message);
    res.status(500).json({ error: 'Erro ao buscar estágios SAP', details: err.message });
  }
});

// Rota flexível para busca customizada
app.get('/jobs/search', async (req, res) => {
  try {
    // Extrai parâmetros da query string
    const level = req.query.level ? req.query.level.split(',') : [];
    const technologies = req.query.technologies ? req.query.technologies.split(',') : [];
    const department = req.query.department;
    const city = req.query.city || 'Campinas'; // Padrão Campinas
    const country = req.query.country;
    const excludeKeywords = req.query.exclude ? req.query.exclude.split(',') : [];

    const result = await searchSpecificJobs({
      level,
      technologies,
      department,
      city,
      country,
      excludeKeywords
    });
    
    res.json({ 
      count: result.length, 
      jobs: result,
      searchCriteria: { level, technologies, department, city, country, excludeKeywords }
    });
  }
  catch (err) {
    console.error('Erro na busca customizada:', err.message);
    res.status(500).json({ error: 'Erro na busca customizada', details: err.message });
  }
});

// Rota para listar todos os departamentos disponíveis
app.get('/departments', async (req, res) => {
  try {
    const allJobs = await fetchJobs({ limit: 100 });
    const departments = [...new Set(allJobs.map(job => job.department).filter(dept => dept !== 'N/A'))];
    
    res.json({ 
      count: departments.length,
      departments: departments.sort()
    });
  }
  catch (err) {
    console.error('Erro ao buscar departamentos:', err.message);
    res.status(500).json({ error: 'Erro ao buscar departamentos', details: err.message });
  }
});

// Rota para listar todas as cidades disponíveis
app.get('/cities', async (req, res) => {
  try {
    const allJobs = await fetchJobs({ limit: 100 });
    const cities = [...new Set(allJobs.map(job => job.location).filter(loc => loc !== 'N/A'))];
    
    res.json({ 
      count: cities.length,
      cities: cities.sort()
    });
  }
  catch (err) {
    console.error('Erro ao buscar cidades:', err.message);
    res.status(500).json({ error: 'Erro ao buscar cidades', details: err.message });
  }
});

// Inicia o servidor na porta definida
app.listen(PORT, () => {
  console.log(`🚀 API rodando em http://localhost:${PORT}`);
  console.log('\n📋 Rotas disponíveis:');
  console.log(`   GET /jobs - Lista todas as vagas`);
  console.log(`   GET /jobs/junior-sap - Vagas Junior SAP em Campinas (sem senior)`);
  console.log(`   GET /jobs/junior-sap-clt - Vagas Junior SAP CLT em Campinas (sem estágio/senior)`);
  console.log(`   GET /jobs/estagio-sap - Estágios SAP em Campinas`);
  console.log(`   GET /jobs/search - Busca customizada`);
  console.log(`   GET /departments - Lista departamentos`);
  console.log(`   GET /cities - Lista cidades`);
  console.log('\n💡 Exemplos de uso:');
  console.log(`   http://localhost:${PORT}/jobs/junior-sap`);
  console.log(`   http://localhost:${PORT}/jobs/junior-sap-clt`);
  console.log(`   http://localhost:${PORT}/jobs/estagio-sap`);
  console.log(`   http://localhost:${PORT}/jobs/search?level=junior&technologies=sap&city=Campinas&exclude=senior,pleno`);
});