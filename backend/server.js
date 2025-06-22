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

app.get("/api/vagas", async (req, res) => {
  try {
    const { nivel, busca, cidade } = req.query;
    let allVagas = [];
    let offset = 0;
    const limit = 100;
    let hasMoreData = true;

    while (hasMoreData) {
      const response = await axios.get(
        `https://api.smartrecruiters.com/v1/companies/BoschGroup/postings?limit=${limit}&offset=${offset}`
      );
      
      const vagasPage = response.data.content.filter(
        (vaga) => vaga.location && vaga.location.country === "br"
      );
      
      allVagas = allVagas.concat(vagasPage);
      
      // Se retornou menos que o limite, não há mais páginas
      if (response.data.content.length < limit) {
        hasMoreData = false;
      } else {
        offset += limit;
      }
      
      // Limite de segurança para evitar loops infinitos
      if (offset > 1000) {
        hasMoreData = false;
      }
    }

    let filteredVagas = [...allVagas];

    // Filtrar por cidade
    if (cidade) {
      filteredVagas = filteredVagas.filter((vaga) => {
        const cidadeVaga = vaga.location?.city?.toLowerCase() || "";
        return cidadeVaga.includes(cidade.toLowerCase());
      });
    }

    // Filtrar por nível de experiência
    if (nivel) {
      filteredVagas = filteredVagas.filter((vaga) => {
        const experienceLevel = vaga.experienceLevel?.id || "";
        const nomeVaga = vaga.name?.toLowerCase() || "";

        switch (nivel) {
          case "junior":
            return (
              experienceLevel === "entry_level" ||
              nomeVaga.includes("junior") ||
              nomeVaga.includes("jr") ||
              nomeVaga.includes("trainee")
            );
          case "estagio":
            return (
              nomeVaga.includes("estágio") ||
              nomeVaga.includes("estagio") ||
              nomeVaga.includes("intern") ||
              nomeVaga.includes("trainee")
            );
          case "pleno":
            return (
              experienceLevel === "associate" ||
              nomeVaga.includes("pleno") ||
              nomeVaga.includes("pl")
            );
          case "senior":
            return (
              experienceLevel === "senior" ||
              nomeVaga.includes("senior") ||
              nomeVaga.includes("sr")
            );
          default:
            return true;
        }
      });
    }

    // Filtrar por busca de texto
    if (busca) {
      const termoBusca = busca.toLowerCase();
      filteredVagas = filteredVagas.filter((vaga) => {
        const nomeVaga = vaga.name?.toLowerCase() || "";
        const funcao = vaga.function?.label?.toLowerCase() || "";
        const departamento = vaga.department?.label?.toLowerCase() || "";

        return (
          nomeVaga.includes(termoBusca) ||
          funcao.includes(termoBusca) ||
          departamento.includes(termoBusca)
        );
      });
    }

    res.json(filteredVagas);
  } catch (error) {
    console.error("Erro ao buscar vagas:", error.message);
    res.status(500).json({ error: "Erro ao buscar vagas" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor backend rodando na porta ${PORT}`);
});

