const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Middleware de log para produção
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

// CORS
app.use((req, res, next) => {
    const allowedOrigins = [
        'https://www.vagas-rb.tech',
        'https://vagas-rb.tech',
        'http://localhost:3000'
    ];
    
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Middleware para parsing JSON
app.use(express.json({ limit: '10mb' }));

// Cache para arquivos estáticos em produção
if (isProduction) {
    app.use(express.static(path.join(__dirname, 'public'), {
        maxAge: '1d',
        etag: true,
        lastModified: true
    }));
} else {
    app.use(express.static(path.join(__dirname, 'public')));
}

// Função para normalizar valores
function normalizeValue(value, defaultValue = 'Não informado') {
    if (value === null || value === undefined || value === '') {
        return defaultValue;
    }
    return String(value);
}

// Health check otimizado
app.get('/api/health', (req, res) => {
    const healthData = {
        status: 'OK',
        service: 'Vagas Bosch API',
        domain: 'www.vagas-rb.tech',
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

// API para buscar vagas da Bosch - Otimizada
app.get('/api/vagas', async (req, res) => {
    const startTime = Date.now();
    
    try {
        console.log('🔍 Iniciando busca de vagas na Bosch...');
        
        const response = await axios.get('https://api.smartrecruiters.com/v1/companies/BoschGroup/postings', {
            params: {
                country: 'br',
                limit: 100,
                orderBy: 'mostRecent'
            },
            timeout: 20000,
            headers: {
                'User-Agent': 'VagasRB-Tech/2.0 (www.vagas-rb.tech)'
            }
        });

        if (!response.data || !response.data.content) {
            throw new Error('Resposta inválida da API SmartRecruiters');
        }

        console.log(`📊 API retornou ${response.data.content.length} vagas`);

        // Processar vagas com validação rigorosa
        const vagas = response.data.content
            .filter(vaga => vaga && vaga.name && vaga.id)
            .map(vaga => {
                // Extrair local com validação
                let local = 'Brasil';
                if (vaga.location) {
                    if (vaga.location.city && vaga.location.country) {
                        local = `${vaga.location.city}, ${vaga.location.country}`;
                    } else if (vaga.location.city) {
                        local = vaga.location.city;
                    } else if (vaga.location.country) {
                        local = vaga.location.country;
                    }
                }

                // Extrair departamento com validação
                let departamento = 'Não informado';
                if (vaga.department && vaga.department.label) {
                    departamento = vaga.department.label;
                }

                // Extrair função/experiência do título
                const titulo = normalizeValue(vaga.name, 'Título não disponível');
                let nivel = 'Não especificado';
                const tituloLower = titulo.toLowerCase();
                
                if (tituloLower.includes('estagio') || tituloLower.includes('estágio') || tituloLower.includes('trainee') || tituloLower.includes('intern')) {
                    nivel = 'Estágio';
                } else if (tituloLower.includes('junior') || tituloLower.includes('júnior') || tituloLower.includes('jr')) {
                    nivel = 'Júnior';
                } else if (tituloLower.includes('senior') || tituloLower.includes('sênior') || tituloLower.includes('sr')) {
                    nivel = 'Sênior';
                } else if (tituloLower.includes('pleno') || tituloLower.includes('mid')) {
                    nivel = 'Pleno';
                }

                return {
                    id: normalizeValue(vaga.id),
                    titulo: titulo,
                    local: normalizeValue(local, 'Brasil'),
                    departamento: normalizeValue(departamento),
                    nivel: nivel,
                    link: normalizeValue(vaga.jobAdUrl, '#'),
                    linkCandidatura: normalizeValue(vaga.applyUrl || vaga.jobAdUrl, '#'),
                    dataExpiracao: vaga.expirationDate || null,
                    dataCriacao: vaga.postingDate || null,
                    referencia: normalizeValue(vaga.refNumber, null),
                    empresa: 'Bosch Group',
                    pais: 'Brasil'
                };
            })
            .filter(vaga => vaga.titulo !== 'Título não disponível');

        const processTime = Date.now() - startTime;
        console.log(`✅ Processadas ${vagas.length} vagas em ${processTime}ms`);
        
        res.json({
            success: true,
            total: vagas.length,
            vagas: vagas,
            timestamp: new Date().toISOString(),
            domain: 'www.vagas-rb.tech',
            processTime: `${processTime}ms`,
            version: '2.0.0'
        });

    } catch (error) {
        const processTime = Date.now() - startTime;
        console.error('❌ Erro ao buscar vagas:', error.message);
        
        // Log detalhado para debug
        if (!isProduction) {
            console.error('Stack trace:', error.stack);
        }
        
        res.status(500).json({ 
            success: false,
            erro: 'Erro ao buscar vagas da Bosch',
            details: isProduction ? 'Erro interno do servidor' : error.message,
            timestamp: new Date().toISOString(),
            domain: 'www.vagas-rb.tech',
            processTime: `${processTime}ms`,
            version: '2.0.0'
        });
    }
});

// Redirect de vagas-rb.tech para www.vagas-rb.tech
app.get('*', (req, res, next) => {
    if (req.get('host') === 'vagas-rb.tech' && isProduction) {
        return res.redirect(301, `https://www.vagas-rb.tech${req.url}`);
    }
    next();
});

// Página inicial
app.get('/', (req, res) => {
    if (!isProduction) {
        console.log('🏠 Servindo página inicial');
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Sitemap para SEO
app.get('/sitemap.xml', (req, res) => {
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://www.vagas-rb.tech/</loc>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    </url>
    <url>
        <loc>https://www.vagas-rb.tech/api/health</loc>
        <changefreq>hourly</changefreq>
        <priority>0.5</priority>
    </url>
</urlset>`;
    
    res.type('application/xml');
    res.send(sitemap);
});

// Robots.txt para SEO
app.get('/robots.txt', (req, res) => {
    const robots = `User-agent: *
Allow: /
Disallow: /api/

Sitemap: https://www.vagas-rb.tech/sitemap.xml`;
    
    res.type('text/plain');
    res.send(robots);
});

// Catch-all para SPA
app.get('*', (req, res) => {
    if (req.url.startsWith('/api/')) {
        res.status(404).json({
            error: 'Rota da API não encontrada',
            path: req.url,
            available_routes: ['/api/health', '/api/vagas'],
            domain: 'www.vagas-rb.tech',
            timestamp: new Date().toISOString()
        });
    } else {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

// Error handler global
app.use((error, req, res, next) => {
    console.error('❌ Erro não tratado:', error);
    res.status(500).json({
        error: 'Erro interno do servidor',
        timestamp: new Date().toISOString(),
        domain: 'www.vagas-rb.tech'
    });
});

// Para desenvolvimento local
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
        console.log(`🌍 Produção: https://www.vagas-rb.tech`);
        console.log(`📊 Health: http://localhost:${PORT}/api/health`);
        console.log(`🔍 Vagas: http://localhost:${PORT}/api/vagas`);
        console.log(`📅 Deploy: 19/06/2025 - 00:25 UTC`);
        console.log(`👤 Autor: Zumbaiero`);
    });
}

// Exportar para Vercel
module.exports = app;