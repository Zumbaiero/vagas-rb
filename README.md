# Vagas RB - Aplicação de Vagas da Bosch Brasil

Uma aplicação simples e profissional para buscar e filtrar vagas de emprego da Bosch no Brasil, consumindo a API SmartRecruiters.

## 🚀 Funcionalidades

- **Busca de vagas**: Pesquise por cargo, função ou departamento
- **Filtros rápidos**: Filtre vagas por nível de experiência (Estágio, Júnior, Pleno, Sênior)
- **Interface responsiva**: Design moderno e profissional que funciona em desktop e mobile
- **Dados em tempo real**: Consome diretamente a API da SmartRecruiters da Bosch
- **Compartilhamento**: Compartilhe vagas facilmente
- **Paginação automática**: Busca todas as vagas disponíveis usando paginação da API
- **URLs oficiais**: Links diretos para as páginas oficiais das vagas

## 🛠️ Tecnologias

### Backend
- **Node.js** com Express
- **Axios** para consumo da API

### Frontend
- **HTML5, CSS3, JavaScript** puro

## 📦 Estrutura do Projeto

```
vagas-rb-app/
├── backend/
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── script.js
├── package.json
├── vercel.json
└── README.md
```

## 📋 API Endpoints

### GET `/api/vagas`
Retorna todas as vagas da Bosch no Brasil (com paginação automática)

**Parâmetros de query opcionais:**
- `nivel`: Filtra por nível (`junior`, `estagio`, `pleno`, `senior`)
- `busca`: Busca textual em nome, função e departamento

**Exemplos:**
- `/api/vagas` - Todas as vagas
- `/api/vagas?nivel=pleno` - Apenas vagas pleno
- `/api/vagas?busca=engenheiro` - Vagas que contenham "engenheiro"
- `/api/vagas?nivel=senior&busca=software` - Vagas sênior de software

## 🔗 URLs das Vagas

As vagas agora direcionam para URLs oficiais no formato:
```
https://jobs.smartrecruiters.com/BoschGroup/[ID]-[nome-da-vaga-formatado]
```

Exemplo:
```
https://jobs.smartrecruiters.com/BoschGroup/744000066194216-agente-qualidade-logistica-jr-terceiro-turno-31121
```

## 🎨 Personalização

### Cores principais
- Azul primário: `#3b82f6`
- Azul secundário: `#1e40af`
- Cinza: `#6b7280`
- Verde: `#059669`

### Fontes
- Família principal: Inter (Google Fonts)
- Ícones: Font Awesome 6

## 📱 Responsividade

A aplicação é totalmente responsiva e otimizada para:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (até 767px)

## 📄 Licença

Este projeto é de uso livre para fins educacionais e demonstrativos.

---

**Desenvolvido para estudos de integração de APIs e deploy na Vercel** 🚀

