const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const COMPANY_ID = 'BoschGroup';
const SMART_API = `https://api.smartrecruiters.com/v1/companies/${COMPANY_ID}/postings`;

// Configura CORS
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

// Middleware JSON
app.use(express.json());

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Função helper para obter vagas
async function fetchJobs(params = {}) {
  try {
    const defaultParams = {
      country: params.country || 'br',
      limit: params.limit || 100
    };
    if (params.q) defaultParams.q = params.q;
    if (params.department) defaultParams.department = params.department;
    if (params.city) defaultParams.city = params.city;

    const resp = await axios.get(SMART_API, { params: defaultParams });
    const jobsArray = resp.data.content || resp.data.jobs || [];

    return jobsArray.map(job => ({
      id: job.id,
      title: job.name || job.title,
      url: job.jobAdUrl,
      applyUrl: job.applyUrl,
      expirationDate: job.expirationDate,
      location: job.location ? `${job.location.city}, ${job.location.country}` : 'N/A',
      department: job.department ? job.department.label : 'N/A',
      description: job.jobAd ? job.jobAd.sections?.jobDescription?.text : '',
      refNumber: job.refNumber,
      companyUrl: `https://jobs.smartrecruiters.com/${COMPANY_ID}/${job.id || job.refNumber}`
    }));
  } catch (error) {
    console.error('Erro na chamada da API SmartRecruiters:', error.message);
    throw error;
  }
}

// Filtra vagas por palavras-chave e exclusões
function filterByKeywords(jobs, keywords = [], exclude = []) {
  if (!keywords.length && !exclude.length) return jobs;
  return jobs.filter(job => {
    const text = (job.title + ' ' + job.description).toLowerCase();
    const matchesKeyword = keywords.length ? keywords.some(k => text.includes(k.toLowerCase())) : true;
    const matchesExcluded = exclude.some(e => text.includes(e.toLowerCase()));
    return matchesKeyword && !matchesExcluded;
  });
}

// Filtra por cidade
function filterByCity(jobs, city) {
  if (!city) return jobs;
  return jobs.filter(job => (job.location || '').toLowerCase().includes(city.toLowerCase()));
}

// Busca conjunto de vagas
async function searchJobs(searchConfig = {}) {
  const { level, technologies, department, city, country, excludeKeywords } = searchConfig;
  const fetchedJobs = await fetchJobs({ department, city, country, limit: 100 });
  let filtered = filterByCity(fetchedJobs, city);

  const combinedKeywords = [...(level || []), ...(technologies || [])];
  filtered = filterByKeywords(filtered, combinedKeywords, excludeKeywords || []);

  return filtered;
}

// Rota principal
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
      filters
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar vagas', message: err.message });
  }
});

// Rota específica: Junior SAP
app.get('/api/jobs/junior-sap', async (req, res) => {
  try {
    const jobs = await searchJobs({
      level: ['junior', 'jr'],
      technologies: ['sap', 'erp'],
      city: 'Campinas',
      excludeKeywords: ['senior','sênior','pleno','sr','estagiário','estágio','trainee','lead','gerente']
    });
    res.json({
      count: jobs.length,
      jobs: jobs.map(j => ({
        ...j,
        primaryUrl: j.url || j.companyUrl,
        allUrls: {
          jobAd: j.url,
          apply: j.applyUrl,
          company: j.companyUrl
        }
      })),
      searchCriteria: 'Junior SAP - Campinas'
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar vagas Junior SAP', message: err.message });
  }
});

// Rota específica: Junior SAP CLT
app.get('/api/jobs/junior-sap-clt', async (req, res) => {
  try {
    const jobs = await searchJobs({
      level: ['junior', 'jr'],
      technologies: ['sap', 'erp'],
      city: 'Campinas',
      excludeKeywords: ['senior','sênior','pleno','sr','estagiário','estágio','trainee','lead','gerente']
    });
    res.json({
      count: jobs.length,
      jobs: jobs.map(j => ({
        ...j,
        primaryUrl: j.url || j.companyUrl,
      })),
      searchCriteria: 'Junior SAP CLT em Campinas'
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar vagas Junior SAP CLT', message: err.message });
  }
});

// Rota: Estágio SAP
app.get('/api/jobs/estagio-sap', async (req, res) => {
  try {
    const jobs = await searchJobs({
      level: ['estágio','estagiário','trainee','intern'],
      technologies: ['sap','erp'],
      city: 'Campinas',
      excludeKeywords: ['senior','sênior','pleno','jr','junior','sr','lead','gerente']
    });
    res.json({
      count: jobs.length,
      jobs,
      searchCriteria: 'Estágio SAP - Campinas'
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar estágios SAP', message: err.message });
  }
});

// Busca customizada
app.get('/api/jobs/search', async (req, res) => {
  try {
    const level = req.query.level ? req.query.level.split(',') : [];
    const technologies = req.query.technologies ? req.query.technologies.split(',') : [];
    const excludeKeywords = req.query.exclude ? req.query.exclude.split(',') : [];
    const result = await searchJobs({
      level,
      technologies,
      department: req.query.department,
      city: req.query.city || 'Campinas',
      country: req.query.country,
      excludeKeywords
    });
    res.json({
      count: result.length,
      jobs: result,
      searchCriteria: { level, technologies, excludeKeywords }
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro na busca customizada', message: err.message });
  }
});

// Rota: Departamentos
app.get('/api/departments', async (req, res) => {
  try {
    const allJobs = await fetchJobs({ limit: 100 });
    const depts = [...new Set(allJobs.map(j => j.department).filter(d => d !== 'N/A'))].sort();
    res.json({ count: depts.length, departments: depts });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao obter departamentos', message: err.message });
  }
});

// Rota: Cidades
app.get('/api/cities', async (req, res) => {
  try {
    const allJobs = await fetchJobs({ limit: 100 });
    const cities = [...new Set(allJobs.map(j => j.location).filter(c => c !== 'N/A'))].sort();
    res.json({ count: cities.length, cities });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao obter cidades', message: err.message });
  }
});

// Rota index do frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    domain: 'vagas-rb.tech'
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.originalUrl
  });
});

// Exporta para Vercel / exec local
module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`API rodando na porta ${PORT}`);
  });
}