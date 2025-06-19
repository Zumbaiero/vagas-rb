const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Logging middleware
app.use((req, res, next) => {
  if (!isProduction) {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  }
  next();
});

// Security headers
app.use((req, res, next) => {
  if (isProduction) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  }
  next();
});

// Redirect plain domain to www for non-/api routes
app.use((req, res, next) => {
  const host = req.get('host');
  if (
    isProduction &&
    host === 'vagas-rb.tech' &&
    !req.path.startsWith('/api/')
  ) {
    return res.redirect(301, `https://www.vagas-rb.tech${req.originalUrl}`);
  }
  next();
});

// CORS
app.use((req, res, next) => {
  const allowedOrigins = [
    'https://vagas-rb.tech',
    'https://www.vagas-rb.tech',
    'https://vagas-rb.vercel.app',
    'http://localhost:3000'
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// JSON parser
app.use(express.json({ limit: '10mb' }));

// Static files
if (isProduction) {
  app.use(
    express.static(path.join(__dirname, 'public'), {
      maxAge: '1d',
      etag: true,
      lastModified: true
    })
  );
} else {
  app.use(express.static(path.join(__dirname, 'public')));
}

// Health check
app.get('/api/health', (req, res) => {
  const healthData = {
    status: 'OK',
    service: 'Vagas Bosch API',
    domain: 'vagas-rb.tech',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    routes: ['/api/health', '/api/vagas']
  };
  if (!isProduction) {
    const fs = require('fs');
    healthData.staticFiles = {
      publicPath: path.join(__dirname, 'public'),
      cssExists: fs.existsSync(path.join(__dirname, 'public', 'style.css')),
      jsExists: fs.existsSync(path.join(__dirname, 'public', 'script.js')),
      htmlExists: fs.existsSync(path.join(__dirname, 'public', 'index.html'))
    };
  }
  res.json(healthData);
});

// Fetch and normalize job postings
app.get('/api/vagas', async (req, res) => {
  const start = Date.now();
  try {
    console.log('🔍 Buscando vagas na SmartRecruiters...');
    const response = await axios.get(
      'https://api.smartrecruiters.com/v1/companies/BoschGroup/postings',
      {
        params: { country: 'br', limit: 100, orderBy: 'mostRecent' },
        timeout: 20000,
        headers: { 'User-Agent': 'VagasRB-Tech/2.0 (vagas-rb.tech)' }
      }
    );

    const postings = Array.isArray(response.data.content)
      ? response.data.content
      : [];

    const normalize = (val, def = null) =>
      val == null || val === '' ? def : String(val);

    const vagas = postings
      .filter(p => p && p.id && p.name)
      .map(p => {
        // Determine URLs: try jobAdUrl first, then applyUrl, then any URI field
        const urlView = normalize(p.jobAdUrl) ||
                        normalize(p.applyUrl) ||
                        normalize(p.uri) ||
                        '#';
        const urlApply = normalize(p.applyUrl) ||
                         normalize(p.jobAdUrl) ||
                         normalize(p.uri) ||
                         '#';

        // Location
        let local = 'Brasil';
        if (p.location) {
          const city = normalize(p.location.city);
          const country = normalize(p.location.country);
          if (city && country) local = `${city}, ${country}`;
          else if (city) local = city;
          else if (country) local = country;
        }

        // Department
        const departamento = normalize(p.department?.label, 'Não informado');

        // Title & level
        const titulo = normalize(p.name, 'Título não disponível');
        const low = titulo.toLowerCase();
        let nivel = 'Não especificado';
        if (/estagi|trainee|intern/.test(low)) nivel = 'Estágio';
        else if (/junior|jr/.test(low)) nivel = 'Júnior';
        else if (/pleno|mid/.test(low)) nivel = 'Pleno';
        else if (/senior|sr/.test(low)) nivel = 'Sênior';

        return {
          id: normalize(p.id),
          titulo,
          local,
          departamento,
          nivel,
          link: urlView,
          linkCandidatura: urlApply,
          dataExpiracao: normalize(p.expirationDate, null),
          dataCriacao: normalize(p.postingDate, null),
          referencia: normalize(p.refNumber, null),
          empresa: 'Bosch Group',
          pais: 'Brasil'
        };
      })
      .filter(v => v.titulo !== 'Título não disponível');

    console.log(`✅ Processadas ${vagas.length} vagas em ${Date.now() - start}ms`);
    res.json({
      success: true,
      total: vagas.length,
      vagas,
      timestamp: new Date().toISOString(),
      domain: 'vagas-rb.tech',
      version: '2.0.0',
      processTime: `${Date.now() - start}ms`
    });
  } catch (err) {
    console.error('❌ Erro ao buscar vagas:', err.message);
    res.status(500).json({
      success: false,
      erro: 'Erro ao buscar vagas da Bosch',
      details: isProduction ? 'Erro interno do servidor' : err.message,
      timestamp: new Date().toISOString(),
      domain: 'vagas-rb.tech'
    });
  }
});

// Sitemap & robots
app.get('/sitemap.xml', (req, res) => {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://www.vagas-rb.tech/</loc><changefreq>daily</changefreq><priority>1.0</priority><lastmod>${new Date().toISOString().split('T')[0]}</lastmod></url>
  <url><loc>https://www.vagas-rb.tech/api/health</loc><changefreq>hourly</changefreq><priority>0.5</priority></url>
</urlset>`;
  res.type('application/xml').send(sitemap);
});

app.get('/robots.txt', (req, res) => {
  const robots = `User-agent: *
Allow: /
Disallow: /api/

Sitemap: https://www.vagas-rb.tech/sitemap.xml`;
  res.type('text/plain').send(robots);
});

// SPA catch-all (serve index.html or 404 API)
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      error: 'Rota da API não encontrada',
      path: req.path,
      available: ['/api/health', '/api/vagas'],
      domain: 'vagas-rb.tech',
      timestamp: new Date().toISOString()
    });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Erro não tratado:', err);
  res.status(500).json({
    error: 'Erro interno do servidor',
    timestamp: new Date().toISOString(),
    domain: 'vagas-rb.tech'
  });
});

// Run locally if invoked directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  });
}

module.exports = app;