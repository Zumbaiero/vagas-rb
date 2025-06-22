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

## 🔧 Correções Implementadas

### Backend
- ✅ **Paginação completa**: Implementada busca com paginação para capturar todas as vagas disponíveis
- ✅ **Filtros aprimorados**: Melhorados os filtros por nível de experiência
- ✅ **Compatibilidade Vercel**: Mantida compatibilidade total com deploy na Vercel

### Frontend
- ✅ **URLs oficiais**: Botão "Ver Vaga" agora direciona para URLs oficiais no formato `https://jobs.smartrecruiters.com/BoschGroup/[ID]-[nome-da-vaga]`
- ✅ **Interface atualizada**: Mantido design profissional e responsivo
- ✅ **Compartilhamento**: Função de compartilhar usa as URLs oficiais

## 🛠️ Tecnologias

### Backend
- **Node.js** com Express
- **Axios** para consumo da API
- Filtros inteligentes por nível e busca textual
- Paginação automática para capturar todas as vagas

### Frontend
- **HTML5, CSS3, JavaScript** puro
- Design responsivo com CSS Grid e Flexbox
- Font Awesome para ícones
- Google Fonts (Inter)

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

## 🚀 Deploy na Vercel

### Pré-requisitos
- Conta na [Vercel](https://vercel.com)
- [Vercel CLI](https://vercel.com/cli) instalado (opcional)

### Opção 1: Deploy via GitHub (Recomendado)

1. **Faça upload do código para o GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/seu-usuario/vagas-rb-app.git
   git push -u origin main
   ```

2. **Conecte o repositório na Vercel**:
   - Acesse [vercel.com](https://vercel.com)
   - Clique em "New Project"
   - Importe seu repositório do GitHub
   - Configure o domínio personalizado para `vagas-rb.tech`

### Opção 2: Deploy via Vercel CLI

1. **Instale a Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Faça login na Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy do projeto**:
   ```bash
   vercel --prod
   ```

4. **Configure o domínio personalizado**:
   - No dashboard da Vercel, vá em Settings > Domains
   - Adicione `vagas-rb.tech`
   - Configure os DNS conforme instruções da Vercel

## 🔧 Configuração de Domínio

Para usar o domínio `vagas-rb.tech`:

1. **Configure os DNS do seu domínio**:
   - Tipo: `CNAME`
   - Nome: `@` (ou deixe vazio)
   - Valor: `cname.vercel-dns.com`

2. **Adicione o domínio na Vercel**:
   - Dashboard > Settings > Domains
   - Adicione `vagas-rb.tech`
   - Aguarde a verificação

## 🧪 Teste Local

### Backend
```bash
cd backend
npm install
npm start
```
O backend estará disponível em `http://localhost:3000`

### Frontend
```bash
cd frontend
python3 -m http.server 8080
```
O frontend estará disponível em `http://localhost:8080`

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

## 🔒 Segurança

- CORS configurado para permitir acesso do frontend
- Validação de parâmetros de entrada
- Tratamento de erros adequado

## 📈 Melhorias Implementadas

### v2.0 - Correções e Melhorias
- ✅ Implementada paginação automática para capturar todas as vagas
- ✅ URLs oficiais das vagas implementadas
- ✅ Filtros aprimorados por nível de experiência
- ✅ Melhor tratamento de erros
- ✅ Interface mais robusta e profissional

## 📄 Licença

Este projeto é de uso livre para fins educacionais e demonstrativos.

## 🤝 Contribuição

Sinta-se à vontade para contribuir com melhorias:
1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

---

**Desenvolvido para demonstrar integração com APIs e deploy na Vercel** 🚀

