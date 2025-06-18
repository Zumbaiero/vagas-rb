const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Constantes de configuração da SmartRecruiters
const COMPANY_ID = 'BoschGroup';
const BASE_URL = `https://api.smartrecruiters.com/v1/companies/${COMPANY_ID}/postings`;

// CORS
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

// Middleware para logs
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Suas funções existentes (copie exatamente como estão)
async function fetchJobs(filters = {}) {
  try {
    const params = { 
      country: filters.country || "br", 
      limit: filters.limit || 100  
    };

    if (filters.q) params.q = filters.q;
    if (filters.department) params.department = filters.department;
    if (filters.city) params.city = filters.city;

    console.log('Buscando vagas com parâmetros:', params);
    const resp = await axios.get(BASE_URL, { params });
    const jobs = resp.data.content || resp.data.jobs || [];
    console.log(`Encontradas ${jobs.length} vagas na API`);

    return jobs.map(job => ({
      id: job.id,
      title: job.name || job.title,
      url: job.jobAdUrl || job.ref,
      applyUrl: job.applyUrl,
      expirationDate: job.expirationDate,
      location: job.location ? `${job.location.city}, ${job.location.country}` : 'N/A',
      department: job.department ? job.department.label : 'N/A',
      description: job.jobAd ? job.jobAd.sections?.jobDescription?.text : null,
      refNumber: job.refNumber,
      companyUrl: `https://jobs.smartrecruiters.com/${COMPANY_ID}/${job.id || job.refNumber}`
    }));
  } catch (error) {
    console.error('Erro na requisição à API:', error.message);
    throw error;
  }
}

function filterJobsByKeywords(jobs, keywords, excludeKeywords = []) {
  if (!keywords || keywords.length === 0) return jobs;
  return jobs.filter(job => {
    const searchText = `${job.title} ${job.description || ''}`.toLowerCase();
    const hasKeywords = keywords.some(keyword => searchText.includes(keyword.toLowerCase()));
    const hasExcludedKeywords = excludeKeywords.some(keyword => searchText.includes(keyword.toLowerCase()));
    return hasKeywords && !hasExcludedKeywords;
  });
}

function filterJobsByLocation(jobs, targetCity) {
  if (!targetCity) return jobs;
  return jobs.filter(job => {
    const location = job.location.toLowerCase();
    return location.includes(targetCity.toLowerCase());
  });
}

async function searchSpecificJobs(searchCriteria = {}) {
  const { level = [], technologies = [], department, city, country, excludeKeywords = [] } = searchCriteria;
  const allJobs = await fetchJobs({ department, city, country, limit: 100 });
  let filteredJobs = city ? filterJobsByLocation(allJobs, city) : allJobs;
  const keywords = [...level, ...technologies];
  if (keywords.length > 0) {
    filteredJobs = filterJobsByKeywords(filteredJobs, keywords, excludeKeywords);
  }
  return filteredJobs;
}

// ============ ROTAS DA API ============

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    domain: 'vagas-rb.tech',
    message: 'API funcionando!'
  });
});

// Rota principal para buscar vagas
app.get('/api/jobs', async (req, res) => {
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

// Junior SAP
app.get('/api/jobs/junior-sap', async (req, res) => {
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
        primaryUrl: job.url || job.companyUrl,
        allUrls: { jobAd: job.url, apply: job.applyUrl, company: job.companyUrl }
      })),
      searchCriteria: 'Junior SAP - Campinas (excluindo Senior/Pleno)'
    });
  }
  catch (err) {
    console.error('Erro ao buscar vagas Junior SAP:', err.message);
    res.status(500).json({ error: 'Erro ao buscar vagas Junior SAP', details: err.message });
  }
});

// Junior SAP CLT
app.get('/api/jobs/junior-sap-clt', async (req, res) => {
  try {
    const result = await searchSpecificJobs({
      level: ['junior', 'jr'],
      technologies: ['sap', 'erp'],
      city: 'Campinas',
      excludeKeywords: ['senior', 'sênior', 'sr', 'pleno', 'lead', 'principal', 'especialista', 'expert', 'gerente', 'coordenador', 'supervisor', 'estágio', 'estagiário', 'trainee', 'intern']
    });
    
    res.json({ 
      count: result.length, 
      jobs: result.map(job => ({
        ...job,
        primaryUrl: job.url || job.companyUrl,
        allUrls: { jobAd: job.url, apply: job.applyUrl, company: job.companyUrl }
      })),
      searchCriteria: 'Junior SAP CLT - Campinas (sem estágio/senior)'
    });
  }
  catch (err) {
    console.error('Erro ao buscar vagas Junior SAP CLT:', err.message);
    res.status(500).json({ error: 'Erro ao buscar vagas Junior SAP CLT', details: err.message });
  }
});

// Estágio SAP
app.get('/api/jobs/estagio-sap', async (req, res) => {
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

// Busca customizada
app.get('/api/jobs/search', async (req, res) => {
  try {
    const level = req.query.level ? req.query.level.split(',') : [];
    const technologies = req.query.technologies ? req.query.technologies.split(',') : [];
    const department = req.query.department;
    const city = req.query.city || 'Campinas';
    const country = req.query.country;
    const excludeKeywords = req.query.exclude ? req.query.exclude.split(',') : [];

    const result = await searchSpecificJobs({
      level, technologies, department, city, country, excludeKeywords
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

// Departamentos
app.get('/api/departments', async (req, res) => {
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

// Cidades
app.get('/api/cities', async (req, res) => {
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

// Rota para servir o frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Para desenvolvimento local
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  });
}

// Para Vercel
module.exports = app;