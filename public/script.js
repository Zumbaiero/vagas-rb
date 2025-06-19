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
        const protocol = window.location.protocol;
        console.log('🌍 Detectando ambiente:', { hostname, protocol });

        // Em desenvolvimento local
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:3000/api';
        }

        // Para qualquer deploy (vagas-rb.tech, www.vagas-rb.tech ou vercel.app)
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
        if (this.elementos.loadVagas) {
            this.elementos.loadVagas.addEventListener('click', () => this.carregarVagas());
        }
        if (this.elementos.refreshVagas) {
            this.elementos.refreshVagas.addEventListener('click', () => this.carregarVagas(true));
        }
        if (this.elementos.retryBtn) {
            this.elementos.retryBtn.addEventListener('click', () => this.carregarVagas());
        }
        if (this.elementos.clearAllFilters) {
            this.elementos.clearAllFilters.addEventListener('click', () => this.limparTodosFiltros());
        }
        if (this.elementos.searchInput) {
            this.elementos.searchInput.addEventListener('input', (e) => {
                this.state.termoBusca = e.target.value || '';
                this.debounce(() => this.aplicarFiltros(), 300)();
            });
        }
        if (this.elementos.clearSearch) {
            this.elementos.clearSearch.addEventListener('click', () => {
                if (this.elementos.searchInput) {
                    this.elementos.searchInput.value = '';
                    this.state.termoBusca = '';
                    this.aplicarFiltros();
                }
            });
        }
        this.elementos.filterTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.definirFiltroAtivo(e.currentTarget.dataset.filter);
            });
        });
        this.elementos.cityTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.definirCidadeAtiva(e.currentTarget.dataset.city);
            });
        });
        if (this.elementos.sortToggle) {
            this.elementos.sortToggle.addEventListener('click', () => {
                this.state.ordenacaoAsc = !this.state.ordenacaoAsc;
                const btnText = this.elementos.sortToggle.querySelector('.btn-text');
                if (btnText) {
                    btnText.textContent = this.state.ordenacaoAsc ? 'A-Z' : 'Z-A';
                }
                this.aplicarFiltros();
            });
        }
        if (this.elementos.loadMore) {
            this.elementos.loadMore.addEventListener('click', () => {
                this.state.vagasExibidas += 20;
                this.renderizarVagas();
            });
        }
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                if (this.elementos.searchInput) this.elementos.searchInput.focus();
            }
            if (e.key === 'Escape' && this.elementos.searchInput === document.activeElement) {
                if (this.elementos.searchInput) {
                    this.elementos.searchInput.blur();
                    this.elementos.searchInput.value = '';
                    this.state.termoBusca = '';
                    this.aplicarFiltros();
                }
            }
        });
    }

    async carregarVagas(isRefresh = false) {
        if (this.state.loading) return;
        this.state.loading = true;
        this.mostrarLoading();
        if (isRefresh) this.mostrarToast(`🔄 Atualizando vagas de ${this.DOMAIN}...`, 'info');

        try {
            console.log('🔍 Carregando vagas da API...');
            const response = await fetch(`${this.API_BASE}/vagas`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            const dados = await response.json();
            if (dados.success && Array.isArray(dados.vagas)) {
                this.state.vagas = dados.vagas.filter(v => v && v.titulo && v.local && v.departamento && v.titulo !== 'Título não disponível');
                this.state.ultimaAtualizacao = new Date();
                this.atualizarEstatisticas();
                this.aplicarFiltros();
                this.mostrarResultados();
                this.mostrarToast(isRefresh ? `✅ ${this.state.vagas.length} vagas atualizadas!` : `🎉 ${this.state.vagas.length} vagas carregadas!`, 'success');
                ['refreshVagas', 'sortToggle', 'clearAllFilters'].forEach(id => {
                    if (this.elementos[id]) this.elementos[id].classList.remove('hidden');
                });
            } else {
                throw new Error(dados.erro || 'Formato de dados inválido');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar vagas:', error);
            let mensagemErro = error.message;
            if (mensagemErro.includes('Failed to fetch')) {
                mensagemErro = `Erro de conexão com ${this.DOMAIN}. Verifique sua internet.`;
            } else if (mensagemErro.includes('404')) {
                mensagemErro = `API não encontrada em ${this.DOMAIN}. Tente novamente.`;
            } else if (mensagemErro.includes('500')) {
                mensagemErro = `Erro interno da API ${this.DOMAIN}. Tente novamente em alguns minutos.`;
            }
            this.mostrarErro(mensagemErro);
            this.mostrarToast('❌ Erro ao carregar vagas', 'error');
            if (this.elementos.errorTime) this.elementos.errorTime.textContent = new Date().toLocaleString('pt-BR');
        } finally {
            this.state.loading = false;
            this.ocultarLoading();
        }
    }

    definirFiltroAtivo(filtro) { /* ... */ }
    definirCidadeAtiva(cidade) { /* ... */ }
    limparTodosFiltros()       { /* ... */ }
    aplicarFiltros()          { /* ... */ }
    atualizarContadores()      { /* ... */ }
    renderizarVagas()          { /* ... */ }
    criarCardVaga(vaga, idx)   { /* ... */ }
    atualizarEstatisticas()    { /* ... */ }
    atualizarStatusFiltro()    { /* ... */ }
    atualizarHorario()         { /* ... */ }
    formatarTempoRelativo(d)   { /* ... */ }
    mostrarLoading()           { /* ... */ }
    ocultarLoading()           { /* ... */ }
    mostrarResultados()        { /* ... */ }
    mostrarErro(m)             { /* ... */ }
    mostrarToast(m, t)         { /* ... */ }
    debounce(fn, w)            { /* ... */ }
    trackEvent(e, d)           { /* ... */ }
}

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌍 www.vagas-rb.tech carregando...');
    console.log('👤 Desenvolvido por: Zumbaiero');
    console.log('📅 Deploy: 19/06/2025 - 00:37 UTC');
    try {
        window.vagasApp = new VagasBoschApp();
    } catch (error) {
        console.error('❌ Erro ao inicializar app:', error);
        document.body.innerHTML = `
            <div style="text-align: center; padding: 50px; font-family: Arial;">
                <h2>⚠️ Erro na Inicialização</h2>
                <p>Erro: ${error.message}</p>
                <button onclick="window.location.reload()" style="padding: 10px 20px; margin-top: 20px;">
                    🔄 Recarregar Página
                </button>
            </div>
        `;
    }
});