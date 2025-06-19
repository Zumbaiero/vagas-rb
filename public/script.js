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
        
        // Em desenvolvimento local
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:3000/api';
        }
        
        // Em qualquer deploy (vagas-rb.tech, www.vagas-rb.tech ou vercel.app)
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
    
    // ... restante do código permanece inalterado ...
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