const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Middleware de log para desenvolvimento
app.use((req, res, next) => {
  if (!isProduction) {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  }
  next();
});

// Security headers para produção
app.use((req, res, next) => {
  if (isProduction) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  }
  next();
});

// Redirecionamento de domínio customizado
// Somente para rotas NÃO-API, mantendo /api intactas
app.use((req, res, next) => {
  const host = req.get('host');
  if (isProduction
    && (host === 'vagas-rb.tech' || host === 'www.vagas-rb.tech')
    && !req.path.startsWith('/api/')) {
    // Redireciona tudo para o host "www.vagas-rb.tech"
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
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Parsing JSON
app.use(express.json({ limit: '10mb' }));

// Servir estáticos (public) e cache em produção
if (isProduction) {
  app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d',
    etag: true,
    lastModified: true
  }));
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

// API de vagas
app.get('/api/vagas', async (req, res) => {
  const startTime = Date.now();
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
    if (!response.data || !response.data.content) {
      throw new Error('Resposta inválida da API SmartRecruiters');
    }

    const vagas = response.data.content
      .filter(v => v && v.name && v.id)
      .map(vaga => {
        const normalize = (val, def = 'Não informado') =>
          val == null || val === '' ? def : String(val);

        // Local
        let local = 'Brasil';
        if (vaga.location) {
          if (vaga.location.city && vaga.location.country)
            local = `${vaga.location.city}, ${vaga.location.country}`;
          else if (vaga.location.city) local = vaga.location.city;
          else if (vaga.location.country) local = vaga.location.country;
        }

        // Departamento
        let departamento = 'Não informado';
        if (vaga.department && vaga.department.label) {
          departamento = vaga.department.label;
        }

        // Nível a partir do título
        const titulo = normalize(vaga.name, 'Título não disponível');
        let nivel = 'Não especificado';
        const low = titulo.toLowerCase();
        if (/estagi|trainee|intern/.test(low)) nivel = 'Estágio';
        else if (/junior|jr/.test(low)) nivel = 'Júnior';
        else if (/senior|sr/.test(low)) nivel = 'Sênior';
        else if (/pleno|mid/.test(low)) nivel = 'Pleno';

        return {
          id: normalize(vaga.id),
          titulo,
          local,
          departamento,
          nivel,
          link: normalize(vaga.jobAdUrl, '#'),
          linkCandidatura: normalize(vaga.applyUrl || vaga.jobAdUrl, '#'),
          dataExpiracao: vaga.expirationDate || null,
          dataCriacao: vaga.postingDate || null,
          referencia: normalize(vaga.refNumber, null),
          empresa: 'Bosch Group',
          pais: 'Brasil'
        };
      })
      .filter(v => v.titulo !== 'Título não disponível');

    console.log(`✅ Processadas ${vagas.length} vagas em ${Date.now() - startTime}ms`);
    res.json({
      success: true,
      total: vagas.length,
      vagas,
      timestamp: new Date().toISOString(),
      domain: 'vagas-rb.tech',
      version: '2.0.0',
      processTime: `${Date.now() - startTime}ms`
    });
  } catch (error) {
    console.error('❌ Erro ao buscar vagas:', error.message);
    res.status(500).json({
      success: false,
      erro: 'Erro ao buscar vagas da Bosch',
      details: isProduction ? 'Erro interno do servidor' : error.message,
      timestamp: new Date().toISOString(),
      domain: 'vagas-rb.tech'
    });
  }
});

// Sitemap e robots
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

// Spa catch-all (serve index.html ou retorna 404 para API não encontradas)
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
  // serve SPA
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handler global
app.use((err, req, res, next) => {
  console.error('❌ Erro não tratado:', err);
  res.status(500).json({
    error: 'Erro interno do servidor',
    timestamp: new Date().toISOString(),
    domain: 'vagas-rb.tech'
  });
});

// Inicia o servidor em local
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  });
}

module.exports = app;