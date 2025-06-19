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

// Health check otimizado
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

// API para buscar vagas da Bosch
app.get('/api/vagas', async (req, res) => {
    // ... lógica existente ...
});

// Redirect de vagas-rb.tech para www.vagas-rb.tech
app.get('*', (req, res, next) => {
    if (req.get('host') === 'vagas-rb.tech' && isProduction) {
        return res.redirect(301, `https://www.vagas-rb.tech${req.url}`);
    }
    next();
});

// Página inicial e catch-alls existentes...
// ... restante do código permanece inalterado ...

// Para desenvolvimento local
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
        console.log(`🌍 Produção: https://vagas-rb.tech`);
        console.log(`📊 Health: http://localhost:${PORT}/api/health`);
        console.log(`🔍 Vagas: http://localhost:${PORT}/api/vagas`);
        console.log(`📅 Deploy: 19/06/2025 - 00:25 UTC`);
        console.log(`👤 Autor: Zumbaiero`);
    });
}

// Exportar para Vercel
module.exports = app;