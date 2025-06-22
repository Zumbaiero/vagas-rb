const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Permitir CORS para o frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.get('/api/vagas', async (req, res) => {
  try {
    const { nivel, busca } = req.query;
    
    const response = await axios.get('https://api.smartrecruiters.com/v1/companies/BoschGroup/postings');
    let vagasBrasil = response.data.content.filter(vaga => {
      return vaga.location && vaga.location.country === 'br';
    });

    // Filtrar por nível de experiência
    if (nivel) {
      vagasBrasil = vagasBrasil.filter(vaga => {
        const experienceLevel = vaga.experienceLevel?.id || '';
        const nomeVaga = vaga.name?.toLowerCase() || '';
        
        switch (nivel) {
          case 'junior':
            return experienceLevel === 'entry_level' || 
                   nomeVaga.includes('junior') || 
                   nomeVaga.includes('jr') ||
                   nomeVaga.includes('trainee');
          case 'estagio':
            return nomeVaga.includes('estágio') || 
                   nomeVaga.includes('estagio') || 
                   nomeVaga.includes('intern') ||
                   nomeVaga.includes('trainee');
          case 'pleno':
            return experienceLevel === 'associate' || 
                   nomeVaga.includes('pleno') || 
                   nomeVaga.includes('pl');
          case 'senior':
            return experienceLevel === 'senior' || 
                   nomeVaga.includes('senior') || 
                   nomeVaga.includes('sr');
          default:
            return true;
        }
      });
    }

    // Filtrar por busca de texto
    if (busca) {
      const termoBusca = busca.toLowerCase();
      vagasBrasil = vagasBrasil.filter(vaga => {
        const nomeVaga = vaga.name?.toLowerCase() || '';
        const funcao = vaga.function?.label?.toLowerCase() || '';
        const departamento = vaga.department?.label?.toLowerCase() || '';
        
        return nomeVaga.includes(termoBusca) || 
               funcao.includes(termoBusca) || 
               departamento.includes(termoBusca);
      });
    }

    res.json(vagasBrasil);
  } catch (error) {
    console.error('Erro ao buscar vagas:', error.message);
    res.status(500).json({ error: 'Erro ao buscar vagas' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor backend rodando na porta ${PORT}`);
});

