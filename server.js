const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, 'public')));

// API para buscar vagas da Bosch
app.get('/api/vagas', async (req, res) => {
  try {
    console.log('🔍 Buscando vagas da Bosch...');
    
    const response = await axios.get('https://api.smartrecruiters.com/v1/companies/BoschGroup/postings', {
      params: {
        country: 'br',
        limit: 100
      }
    });

    const vagas = response.data.content.map(vaga => ({
      id: vaga.id,
      titulo: vaga.name,
      local: vaga.location ? `${vaga.location.city}, ${vaga.location.country}` : 'Brasil',
      departamento: vaga.department ? vaga.department.label : 'Não informado',
      link: vaga.jobAdUrl,
      linkCandidatura: vaga.applyUrl || vaga.jobAdUrl,
      dataExpiracao: vaga.expirationDate,
      referencia: vaga.refNumber
    }));

    console.log(`✅ Encontradas ${vagas.length} vagas`);
    
    res.json({
      success: true,
      total: vagas.length,
      vagas: vagas,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao buscar vagas:', error.message);
    res.status(500).json({ 
      success: false,
      erro: 'Erro ao buscar vagas da Bosch',
      details: error.message 
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Vagas Bosch API',
    domain: 'vagas-rb.tech',
    timestamp: new Date().toISOString()
  });
});

// Página inicial
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor (para desenvolvimento local)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`🌍 Deploy: https://vagas-rb.tech`);
  });
}

// Exportar para Vercel
module.exports = app;