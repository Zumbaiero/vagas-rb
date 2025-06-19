const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Logging middleware
app.use((req, res, next) => {
  if (!isProduction) console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Security headers in production
app.use((req, res, next) => {
  if (isProduction) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  }
  next();
});

// Redirect sem "www." → com "www."
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
  const allowed = [
    'https://vagas-rb.tech',
    'https://www.vagas-rb.tech',
    'https://vagas-rb.vercel.app',
    'http://localhost:3000'
  ];
  const origin = req.headers.origin;
  if (allowed.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin,Content-Type,Accept');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// JSON parser
app.use(express.json({ limit: '10mb' }));

// Serve static files
if (isProduction) {
  app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d', etag: true, lastModified: true
  }));
} else {
  app.use(express.static(path.join(__dirname, 'public')));
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Vagas Bosch API',
    routes: ['/api/health', '/api/vagas'],
    timestamp: new Date().toISOString()
  });
});

// API de vagas — limite aumentado para 200
app.get('/api/vagas', async (req, res) => {
  try {
    const response = await axios.get(
      'https://api.smartrecruiters.com/v1/companies/BoschGroup/postings',
      {
        params: { country: 'br', limit: 200, orderBy: 'mostRecent' },
        timeout: 20000,
        headers: { 'User-Agent': 'VagasRB-Tech/2.0 (vagas-rb.tech)' }
      }
    );
    const content = response.data.content || [];
    const vagas = content
      .filter(v => v && v.name && v.id)
      .map(v => {
        const normalize = (val, def = '') => (val == null ? def : String(val));
        const local = v.location
          ? [v.location.city, v.location.country].filter(Boolean).join(', ')
          : 'Brasil';
        let nivel = 'Não especificado';
        const low = v.name.toLowerCase();
        if (/estagi|trainee|intern/.test(low)) nivel = 'Estágio';
        else if (/junior|jr/.test(low)) nivel = 'Júnior';
        else if (/senior|sr/.test(low)) nivel = 'Sênior';
        else if (/pleno|mid/.test(low)) nivel = 'Pleno';
        return {
          id: normalize(v.id),
          titulo: normalize(v.name, 'Título não disponível'),
          local,
          departamento: v.department?.label || 'Não informado',
          nivel,
          link: normalize(v.jobAdUrl, '#'),
          linkCandidatura: normalize(v.applyUrl || v.jobAdUrl, '#'),
          dataCriacao: v.postingDate || null,
          dataExpiracao: v.expirationDate || null,
          referencia: normalize(v.refNumber, '')
        };
      });

    res.json({ success: true, total: vagas.length, vagas });
  } catch (err) {
    console.error('❌ Erro ao buscar vagas:', err.message);
    res.status(500).json({
      success: false,
      erro: 'Erro ao buscar vagas da Bosch',
      details: isProduction ? 'Erro interno do servidor' : err.message
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
  res.type('text/plain').send(
`User-agent: *
Allow: /
Disallow: /api/

Sitemap: https://www.vagas-rb.tech/sitemap.xml`
  );
});

// SPA catch-all
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Rota da API não encontrada' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Erro não tratado:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Start server (dev)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  });
}

module.exports = app;