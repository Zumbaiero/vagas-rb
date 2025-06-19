const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de log para debug
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Middleware para parsing JSON
app.use(express.json());

// CORREÇÃO: Servir arquivos estáticos ANTES das rotas da API
app.use(express.static(path.join(__dirname, 'public')));

// Middleware adicional para debug de arquivos estáticos
app.use('/style.css', (req, res, next) => {
    console.log('📄 Tentando servir style.css');
    const cssPath = path.join(__dirname, 'public', 'style.css');
    console.log('📂 Caminho do CSS:', cssPath);
    
    // Verificar se arquivo existe
    const fs = require('fs');
    if (fs.existsSync(cssPath)) {
        console.log('✅ Arquivo CSS encontrado');
        res.type('text/css');
        res.sendFile(cssPath);
    } else {
        console.log('❌ Arquivo CSS NÃO encontrado');
        res.status(404).send('CSS não encontrado');
    }
});

// Função para normalizar valores - EVITA UNDEFINED
function normalizeValue(value, defaultValue = 'Não informado') {
    if (value === null || value === undefined || value === '') {
        return defaultValue;
    }
    return String(value);
}

// Health check
app.get('/api/health', (req, res) => {
    console.log('✅ Health check acessado');
    res.json({
        status: 'OK',
        service: 'Vagas Bosch API',
        domain: 'localhost:3000',
        timestamp: new Date().toISOString(),
        environment: 'development',
        routes: ['/api/health', '/api/vagas'],
        staticFiles: {
            publicPath: path.join(__dirname, 'public'),
            cssExists: require('fs').existsSync(path.join(__dirname, 'public', 'style.css')),
            jsExists: require('fs').existsSync(path.join(__dirname, 'public', 'script.js'))
        }
    });
});

// API para buscar vagas da Bosch
app.get('/api/vagas', async (req, res) => {
    console.log('🔍 Iniciando busca de vagas...');
    
    try {
        const response = await axios.get('https://api.smartrecruiters.com/v1/companies/BoschGroup/postings', {
            params: {
                country: 'br',
                limit: 100
            },
            timeout: 15000
        });

        console.log(`📊 API SmartRecruiters retornou ${response.data.content?.length || 0} vagas`);

        const vagas = response.data.content.map(vaga => {
            if (!vaga) {
                console.warn('⚠️ Vaga undefined encontrada, pulando...');
                return null;
            }

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

            let departamento = 'Não informado';
            if (vaga.department && vaga.department.label) {
                departamento = vaga.department.label;
            }

            return {
                id: normalizeValue(vaga.id, 'sem-id'),
                titulo: normalizeValue(vaga.name, 'Título não disponível'),
                local: normalizeValue(local, 'Brasil'),
                departamento: normalizeValue(departamento, 'Não informado'),
                link: normalizeValue(vaga.jobAdUrl, '#'),
                linkCandidatura: normalizeValue(vaga.applyUrl || vaga.jobAdUrl, '#'),
                dataExpiracao: vaga.expirationDate || null,
                referencia: normalizeValue(vaga.refNumber, null)
            };
        }).filter(vaga => vaga !== null);

        console.log(`✅ Processadas ${vagas.length} vagas com sucesso`);
        
        res.json({
            success: true,
            total: vagas.length,
            vagas: vagas,
            timestamp: new Date().toISOString(),
            domain: 'localhost:3000'
        });

    } catch (error) {
        console.error('❌ Erro ao buscar vagas:', error.message);
        
        res.status(500).json({ 
            success: false,
            erro: 'Erro ao buscar vagas da Bosch',
            details: error.message,
            timestamp: new Date().toISOString(),
            domain: 'localhost:3000'
        });
    }
});

// Página inicial - serve o index.html
app.get('/', (req, res) => {
    console.log('🏠 Servindo página inicial');
    const indexPath = path.join(__dirname, 'public', 'index.html');
    
    // Verificar se arquivo existe
    const fs = require('fs');
    if (fs.existsSync(indexPath)) {
        console.log('✅ index.html encontrado');
        res.sendFile(indexPath);
    } else {
        console.log('❌ index.html NÃO encontrado em:', indexPath);
        res.status(404).send('index.html não encontrado');
    }
});

// Catch-all para debug
app.get('*', (req, res) => {
    console.log(`❓ Rota solicitada: ${req.url}`);
    
    if (req.url.startsWith('/api/')) {
        res.status(404).json({
            error: 'Rota da API não encontrada',
            path: req.url,
            available_routes: ['/api/health', '/api/vagas'],
            domain: 'localhost:3000'
        });
    } else {
        // Tentar servir arquivo estático
        const filePath = path.join(__dirname, 'public', req.url);
        const fs = require('fs');
        
        if (fs.existsSync(filePath)) {
            console.log('✅ Arquivo encontrado:', filePath);
            res.sendFile(filePath);
        } else {
            console.log('❌ Arquivo não encontrado:', filePath);
            console.log('📂 Tentando servir index.html como fallback');
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
        }
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔍 API Vagas: http://localhost:${PORT}/api/vagas`);
    console.log(`🎨 CSS: http://localhost:${PORT}/style.css`);
    console.log(`📄 JS: http://localhost:${PORT}/script.js`);
    
    // Verificar arquivos na inicialização
    const fs = require('fs');
    const publicPath = path.join(__dirname, 'public');
    
    console.log('\n📂 Verificando arquivos:');
    console.log(`   Pasta public: ${fs.existsSync(publicPath) ? '✅' : '❌'}`);
    console.log(`   index.html: ${fs.existsSync(path.join(publicPath, 'index.html')) ? '✅' : '❌'}`);
    console.log(`   style.css: ${fs.existsSync(path.join(publicPath, 'style.css')) ? '✅' : '❌'}`);
    console.log(`   script.js: ${fs.existsSync(path.join(publicPath, 'script.js')) ? '✅' : '❌'}`);
});

module.exports = app;