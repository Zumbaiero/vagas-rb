class VagasBoschApp {
    constructor() {
        this.API_BASE = this.detectarApiBase();
        this.VERSION = '2.0.0';
        this.DOMAIN = window.location.hostname;
        
        console.log(`🔗 API Base detectada: ${this.API_BASE}`);
        console.log(`🌍 Domínio: ${this.DOMAIN}`);
        console.log(`📊 Versão: ${this.VERSION}`);
        
        this.state = {
            vagas: [],
            vagasFiltradas: [],
            filtroAtivo: 'all',
            cidadeAtiva: 'all',
            termoBusca: '',
            ordenacao: 'titulo',
            ordenacaoAsc: true,
            loading: false,
            vagasExibidas: 20,
            ultimaAtualizacao: null
        };
        
        this.elementos = this.inicializarElementos();
        this.init();
    }
    
    detectarApiBase() {
        const hostname = window.location.hostname;
        console.log('🌍 Detectando ambiente:', { hostname });
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:3000/api';
        }
        
        return '/api';
    }
    
    inicializarElementos() {
        const elementos = {};
        const ids = [
            'totalVagasGeral', 'ultimaAtualizacao',
            'searchInput', 'clearSearch',
            'loadVagas', 'refreshVagas', 'sortToggle', 'clearAllFilters',
            'countAll', 'countJunior', 'countEstagio',
            'countCampinas', 'countSap', 'countEngineering',
            'countAllCities', 'countCidadeCampinas',
            'countCidadeSaoPaulo', 'countCidadeCuritiba', 'countCidadePortoAlegre',
            'loading', 'resultados', 'errorSection',
            'resultCount', 'filterStatus', 'vagasList', 'loadMore',
            'errorMessage', 'errorTime', 'retryBtn', 'toastContainer'
        ];
        ids.forEach(id => {
            elementos[id] = document.getElementById(id);
        });
        elementos.filterTabs = document.querySelectorAll('.filter-tab');
        elementos.cityTabs   = document.querySelectorAll('.city-tab');
        return elementos;
    }
    
    init() {
        console.log(`🚀 Inicializando Vagas Bosch App para ${this.DOMAIN}`);
        this.configurarEventListeners();
        this.testarConexaoAPI();
        this.carregarVagas();
        this.atualizarHorario();
        setInterval(() => this.atualizarHorario(), 60000);
    }
    
    async testarConexaoAPI() {
        try {
            console.log('🔍 Testando conexão com API...');
            const response = await fetch(`${this.API_BASE}/health`);
            if (response.ok) {
                const data = await response.json();
                console.log('✅ API conectada:', data);
                this.mostrarToast(`✅ Conectado com ${this.DOMAIN}`, 'success');
            } else {
                console.warn('⚠️ API respondeu com erro:', response.status);
                this.mostrarToast('⚠️ API com problemas', 'warning');
            }
        } catch (error) {
            console.error('❌ Erro na conexão:', error);
            this.mostrarToast('❌ Erro de conexão', 'error');
        }
    }
    
    configurarEventListeners() {
        /* ... sem alterações ... */
    }
    
    async carregarVagas(isRefresh = false) {
        /* ... sem alterações ... */
    }
    
    aplicarFiltros() {
        /* ... sem alterações ... */
    }
    
    atualizarContadores() {
        /* ... sem alterações ... */
    }
    
    renderizarVagas() {
        /* ... sem alterações ... */
    }
    
    criarCardVaga(vaga, index) {
        const dataExpiracao = vaga.dataExpiracao
            ? new Date(vaga.dataExpiracao).toLocaleDateString('pt-BR')
            : null;
        const dataCriacao = vaga.dataCriacao
            ? new Date(vaga.dataCriacao).toLocaleDateString('pt-BR')
            : null;

        return `
        <div class="vaga-card" style="animation-delay:${index*0.1}s">
            <div class="vaga-header">
                <h3 class="vaga-titulo">${vaga.titulo}</h3>
                ${vaga.referencia ? `<span class="vaga-ref">Ref:${vaga.referencia}</span>` : ''}
            </div>
            <div class="vaga-info">
                <div class="vaga-info-item"><span class="info-icon">📍</span><strong>Local:</strong> ${vaga.local}</div>
                <div class="vaga-info-item"><span class="info-icon">🏢</span><strong>Departamento:</strong> ${vaga.departamento}</div>
                ${vaga.nivel ? `<div class="vaga-info-item"><span class="info-icon">⭐</span><strong>Nível:</strong> ${vaga.nivel}</div>` : ''}
                ${dataExpiracao ? `<div class="vaga-info-item"><span class="info-icon">⏰</span><strong>Expira em:</strong> ${dataExpiracao}</div>` : ''}
                ${dataCriacao ? `<div class="vaga-info-item"><span class="info-icon">📅</span><strong>Publicada em:</strong> ${dataCriacao}</div>` : ''}
            </div>
            <div class="vaga-actions">
                <!-- redireciona para a vaga no mesmo tab -->
                <a href="${vaga.link}" class="vaga-btn vaga-btn-primary">
                    <span>📋</span> Ver Vaga
                </a>
                ${vaga.linkCandidatura && vaga.linkCandidatura !== vaga.link
                    ? `<a href="${vaga.linkCandidatura}" class="vaga-btn vaga-btn-success">
                         <span>✉️</span> Candidatar-se
                       </a>`
                    : ''
                }
                <a href="https://careers.smartrecruiters.com/BoschGroup/brazil"
                   target="_blank"
                   rel="noopener noreferrer"
                   class="vaga-btn vaga-btn-secondary">
                    <span>🏢</span> Bosch Carreiras
                </a>
            </div>
        </div>`;
    }
    
    atualizarEstatisticas() {
        if (this.elementos.totalVagasGeral) {
            const total = this.state.vagas.length;
            this.elementos.totalVagasGeral.textContent = total > 100 ? '100+' : total;
        }
        if (this.state.ultimaAtualizacao && this.elementos.ultimaAtualizacao) {
            const tempo = this.formatarTempoRelativo(this.state.ultimaAtualizacao);
            this.elementos.ultimaAtualizacao.textContent = tempo;
        }
    }
    
    atualizarStatusFiltro() {
        /* ... sem alterações ... */
    }
    
    atualizarHorario() {
        /* ... sem alterações ... */
    }
    
    formatarTempoRelativo(data) {
        /* ... sem alterações ... */
    }
    
    mostrarLoading() {
        /* ... sem alterações ... */
    }
    
    ocultarLoading() {
        /* ... sem alterações ... */
    }
    
    mostrarResultados() {
        /* ... sem alterações ... */
    }
    
    mostrarErro(mensagem) {
        /* ... sem alterações ... */
    }
    
    mostrarToast(mensagem, tipo = 'info') {
        /* ... sem alterações ... */
    }
    
    debounce(func, wait) {
        /* ... sem alterações ... */
    }
    
    trackEvent(event, data = {}) {
        /* ... sem alterações ... */
    }
}

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.vagasApp = new VagasBoschApp();
    } catch (error) {
        document.body.innerHTML = `
          <div style="text-align:center;padding:50px;font-family:Arial;">
            <h2>⚠️ Erro na Inicialização</h2>
            <p>Erro: ${error.message}</p>
            <button onclick="window.location.reload()" style="padding:10px 20px;margin-top:20px;">
                🔄 Recarregar Página
            </button>
          </div>`;
    }
});