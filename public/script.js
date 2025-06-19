class VagasBoschApp {
    constructor() {
        this.API_BASE = this.detectarApiBase();
        console.log('🔗 API Base detectada:', this.API_BASE);
        
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
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:3000/api';
        } else {
            return '/api';
        }
    }
    
    inicializarElementos() {
        return {
            // Header stats
            totalVagasGeral: document.getElementById('totalVagasGeral'),
            ultimaAtualizacao: document.getElementById('ultimaAtualizacao'),
            
            // Controles
            searchInput: document.getElementById('searchInput'),
            clearSearch: document.getElementById('clearSearch'),
            filterTabs: document.querySelectorAll('.filter-tab'),
            cityTabs: document.querySelectorAll('.city-tab'),
            loadVagas: document.getElementById('loadVagas'),
            refreshVagas: document.getElementById('refreshVagas'),
            sortToggle: document.getElementById('sortToggle'),
            clearAllFilters: document.getElementById('clearAllFilters'),
            
            // Contadores dos filtros
            countAll: document.getElementById('countAll'),
            countJunior: document.getElementById('countJunior'),
            countEstagio: document.getElementById('countEstagio'),
            countCampinas: document.getElementById('countCampinas'),
            countSap: document.getElementById('countSap'),
            countEngineering: document.getElementById('countEngineering'),
            
            // Contadores das cidades
            countAllCities: document.getElementById('countAllCities'),
            countCidadeCampinas: document.getElementById('countCidadeCampinas'),
            countCidadeSaoPaulo: document.getElementById('countCidadeSaoPaulo'),
            countCidadeCuritiba: document.getElementById('countCidadeCuritiba'),
            countCidadePortoAlegre: document.getElementById('countCidadePortoAlegre'),
            
            // Seções principais
            loading: document.getElementById('loading'),
            resultados: document.getElementById('resultados'),
            errorSection: document.getElementById('errorSection'),
            
            // Resultados
            resultCount: document.getElementById('resultCount'),
            filterStatus: document.getElementById('filterStatus'),
            vagasList: document.getElementById('vagasList'),
            loadMore: document.getElementById('loadMore'),
            
            // Erro
            errorMessage: document.getElementById('errorMessage'),
            errorTime: document.getElementById('errorTime'),
            retryBtn: document.getElementById('retryBtn'),
            
            // Toast
            toastContainer: document.getElementById('toastContainer')
        };
    }
    
    init() {
        console.log('🚀 Inicializando Vagas Bosch App para vagas-rb.tech');
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
                this.mostrarToast('✅ Conectado com vagas-rb.tech', 'success');
            } else {
                console.warn('⚠️ API respondeu com erro:', response.status);
            }
        } catch (error) {
            console.error('❌ Erro na conexão:', error);
        }
    }
    
    configurarEventListeners() {
        // Botões principais
        this.elementos.loadVagas.addEventListener('click', () => this.carregarVagas());
        this.elementos.refreshVagas.addEventListener('click', () => this.carregarVagas(true));
        this.elementos.retryBtn.addEventListener('click', () => this.carregarVagas());
        this.elementos.clearAllFilters.addEventListener('click', () => this.limparTodosFiltros());
        
        // Busca
        this.elementos.searchInput.addEventListener('input', (e) => {
            this.state.termoBusca = e.target.value || '';
            this.debounce(() => this.aplicarFiltros(), 300)();
        });
        
        this.elementos.clearSearch.addEventListener('click', () => {
            this.elementos.searchInput.value = '';
            this.state.termoBusca = '';
            this.aplicarFiltros();
        });
        
        // Filtros rápidos
        this.elementos.filterTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const filtro = e.currentTarget.dataset.filter;
                this.definirFiltroAtivo(filtro);
            });
        });
        
        // Filtros por cidade
        this.elementos.cityTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const cidade = e.currentTarget.dataset.city;
                this.definirCidadeAtiva(cidade);
            });
        });
        
        // Ordenação
        this.elementos.sortToggle.addEventListener('click', () => {
            this.state.ordenacaoAsc = !this.state.ordenacaoAsc;
            this.elementos.sortToggle.querySelector('.btn-text').textContent = 
                this.state.ordenacaoAsc ? 'A-Z' : 'Z-A';
            this.aplicarFiltros();
        });
        
        // Load more
        this.elementos.loadMore.addEventListener('click', () => {
            this.state.vagasExibidas += 20;
            this.renderizarVagas();
        });
    }
    
    async carregarVagas(isRefresh = false) {
        if (this.state.loading) return;
        
        this.state.loading = true;
        this.mostrarLoading();
        
        try {
            console.log('🔍 Carregando vagas da API...');
            
            const response = await fetch(`${this.API_BASE}/vagas`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const dados = await response.json();
            
            if (dados.success && Array.isArray(dados.vagas)) {
                // FILTRAR VAGAS UNDEFINED/NULAS
                this.state.vagas = dados.vagas.filter(vaga => {
                    return vaga && 
                           vaga.titulo && 
                           vaga.local && 
                           vaga.departamento;
                });
                
                this.state.ultimaAtualizacao = new Date();
                
                this.atualizarEstatisticas();
                this.aplicarFiltros();
                this.mostrarResultados();
                
                const mensagem = isRefresh 
                    ? `✅ ${this.state.vagas.length} vagas atualizadas!` 
                    : `🎉 ${this.state.vagas.length} vagas carregadas!`;
                    
                this.mostrarToast(mensagem, 'success');
                
                // Mostrar controles adicionais
                this.elementos.refreshVagas.classList.remove('hidden');
                this.elementos.sortToggle.classList.remove('hidden');
                this.elementos.clearAllFilters.classList.remove('hidden');
                
            } else {
                throw new Error(dados.erro || 'Formato de dados inválido');
            }
            
        } catch (error) {
            console.error('❌ Erro ao carregar vagas:', error);
            this.mostrarErro(error.message);
            
            // Atualizar timestamp do erro
            if (this.elementos.errorTime) {
                this.elementos.errorTime.textContent = new Date().toLocaleString('pt-BR');
            }
        } finally {
            this.state.loading = false;
            this.ocultarLoading();
        }
    }
    
    definirFiltroAtivo(filtro) {
        this.state.filtroAtivo = filtro;
        this.state.vagasExibidas = 20;
        
        this.elementos.filterTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.filter === filtro);
        });
        
        this.aplicarFiltros();
    }
    
    definirCidadeAtiva(cidade) {
        this.state.cidadeAtiva = cidade;
        this.state.vagasExibidas = 20;
        
        this.elementos.cityTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.city === cidade);
        });
        
        this.aplicarFiltros();
    }
    
    limparTodosFiltros() {
        // Resetar estado
        this.state.filtroAtivo = 'all';
        this.state.cidadeAtiva = 'all';
        this.state.termoBusca = '';
        this.state.vagasExibidas = 20;
        
        // Resetar UI
        this.elementos.searchInput.value = '';
        
        this.elementos.filterTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.filter === 'all');
        });
        
        this.elementos.cityTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.city === 'all');
        });
        
        this.aplicarFiltros();
        this.mostrarToast('🗑️ Filtros limpos', 'info');
    }
    
    aplicarFiltros() {
        let vagasFiltradas = [...this.state.vagas];
        
        // Verificar se vagas existem e têm propriedades necessárias
        vagasFiltradas = vagasFiltradas.filter(vaga => {
            return vaga && 
                   typeof vaga.titulo === 'string' && 
                   typeof vaga.local === 'string' && 
                   typeof vaga.departamento === 'string';
        });
        
        // Filtro por categoria
        switch (this.state.filtroAtivo) {
            case 'junior':
                vagasFiltradas = vagasFiltradas.filter(vaga => 
                    vaga.titulo.toLowerCase().includes('junior') || 
                    vaga.titulo.toLowerCase().includes('júnior') ||
                    vaga.titulo.toLowerCase().includes('jr'));
                break;
            case 'estagio':
                vagasFiltradas = vagasFiltradas.filter(vaga => 
                    vaga.titulo.toLowerCase().includes('estágio') ||
                    vaga.titulo.toLowerCase().includes('estagio') ||
                    vaga.titulo.toLowerCase().includes('trainee') ||
                    vaga.titulo.toLowerCase().includes('intern'));
                break;
            case 'campinas':
                vagasFiltradas = vagasFiltradas.filter(vaga => 
                    vaga.local.toLowerCase().includes('campinas'));
                break;
            case 'sap':
                vagasFiltradas = vagasFiltradas.filter(vaga => 
                    vaga.titulo.toLowerCase().includes('sap') || 
                    vaga.departamento.toLowerCase().includes('sap'));
                break;
            case 'engineering':
                vagasFiltradas = vagasFiltradas.filter(vaga => 
                    vaga.departamento.toLowerCase().includes('engineering') ||
                    vaga.departamento.toLowerCase().includes('engenharia') ||
                    vaga.titulo.toLowerCase().includes('engineer'));
                break;
        }
        
        // Filtro por cidade
        if (this.state.cidadeAtiva !== 'all') {
            vagasFiltradas = vagasFiltradas.filter(vaga => 
                vaga.local.toLowerCase().includes(this.state.cidadeAtiva.toLowerCase()));
        }
        
        // Filtro por busca
        if (this.state.termoBusca) {
            const termo = this.state.termoBusca.toLowerCase();
            vagasFiltradas = vagasFiltradas.filter(vaga =>
                vaga.titulo.toLowerCase().includes(termo) ||
                vaga.departamento.toLowerCase().includes(termo) ||
                vaga.local.toLowerCase().includes(termo)
            );
        }
        
        // Ordenação
        vagasFiltradas.sort((a, b) => {
            const comparison = a.titulo.localeCompare(b.titulo);
            return this.state.ordenacaoAsc ? comparison : -comparison;
        });
        
        this.state.vagasFiltradas = vagasFiltradas;
        this.atualizarContadores();
        this.renderizarVagas();
        this.atualizarStatusFiltro();
    }
    
    atualizarContadores() {
        // Função helper para contar com segurança
        const contarVagas = (filtroFunc) => {
            return this.state.vagas.filter(vaga => {
                if (!vaga || !vaga.titulo || !vaga.local || !vaga.departamento) {
                    return false;
                }
                return filtroFunc(vaga);
            }).length;
        };
        
        // Contadores dos filtros rápidos
        const contadores = {
            all: this.state.vagas.length,
            junior: contarVagas(v => 
                v.titulo.toLowerCase().includes('junior') || 
                v.titulo.toLowerCase().includes('júnior') ||
                v.titulo.toLowerCase().includes('jr')),
            estagio: contarVagas(v => 
                v.titulo.toLowerCase().includes('estágio') ||
                v.titulo.toLowerCase().includes('estagio') ||
                v.titulo.toLowerCase().includes('trainee') ||
                v.titulo.toLowerCase().includes('intern')),
            campinas: contarVagas(v => v.local.toLowerCase().includes('campinas')),
            sap: contarVagas(v => 
                v.titulo.toLowerCase().includes('sap') || 
                v.departamento.toLowerCase().includes('sap')),
            engineering: contarVagas(v => 
                v.departamento.toLowerCase().includes('engineering') ||
                v.departamento.toLowerCase().includes('engenharia') ||
                v.titulo.toLowerCase().includes('engineer'))
        };
        
        // Contadores das cidades
        const contadoresCidades = {
            all: this.state.vagas.length,
            campinas: contarVagas(v => v.local.toLowerCase().includes('campinas')),
            saoPaulo: contarVagas(v => v.local.toLowerCase().includes('são paulo') || v.local.toLowerCase().includes('sao paulo')),
            curitiba: contarVagas(v => v.local.toLowerCase().includes('curitiba')),
            portoAlegre: contarVagas(v => v.local.toLowerCase().includes('porto alegre'))
        };
        
        // Atualizar UI
        if (this.elementos.countAll) this.elementos.countAll.textContent = contadores.all;
        if (this.elementos.countJunior) this.elementos.countJunior.textContent = contadores.junior;
        if (this.elementos.countEstagio) this.elementos.countEstagio.textContent = contadores.estagio;
        if (this.elementos.countCampinas) this.elementos.countCampinas.textContent = contadores.campinas;
        if (this.elementos.countSap) this.elementos.countSap.textContent = contadores.sap;
        if (this.elementos.countEngineering) this.elementos.countEngineering.textContent = contadores.engineering;
        
        if (this.elementos.countAllCities) this.elementos.countAllCities.textContent = contadoresCidades.all;
        if (this.elementos.countCidadeCampinas) this.elementos.countCidadeCampinas.textContent = contadoresCidades.campinas;
        if (this.elementos.countCidadeSaoPaulo) this.elementos.countCidadeSaoPaulo.textContent = contadoresCidades.saoPaulo;
        if (this.elementos.countCidadeCuritiba) this.elementos.countCidadeCuritiba.textContent = contadoresCidades.curitiba;
        if (this.elementos.countCidadePortoAlegre) this.elementos.countCidadePortoAlegre.textContent = contadoresCidades.portoAlegre;
    }
    
    renderizarVagas() {
        const vagasParaExibir = this.state.vagasFiltradas.slice(0, this.state.vagasExibidas);
        
        if (this.elementos.resultCount) {
            this.elementos.resultCount.textContent = 
                `${this.state.vagasFiltradas.length} vaga${this.state.vagasFiltradas.length !== 1 ? 's' : ''} encontrada${this.state.vagasFiltradas.length !== 1 ? 's' : ''}`;
        }
        
        if (vagasParaExibir.length === 0) {
            this.elementos.vagasList.innerHTML = `
                <div class="sem-vagas">
                    <div style="text-align: center; padding: 60px 20px; color: #7f8c8d;">
                        <div style="font-size: 4em; margin-bottom: 20px;">🤷‍♂️</div>
                        <h3>Nenhuma vaga encontrada</h3>
                        <p>Tente ajustar os filtros ou termo de busca</p>
                        <button onclick="window.vagasApp.limparTodosFiltros()" style="margin-top: 15px; padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 8px; cursor: pointer;">
                            🗑️ Limpar Filtros
                        </button>
                    </div>
                </div>
            `;
        } else {
            this.elementos.vagasList.innerHTML = vagasParaExibir.map((vaga, index) => 
                this.criarCardVaga(vaga, index)).join('');
        }
        
        // Load more button
        const loadMoreSection = document.querySelector('.load-more-section');
        if (loadMoreSection) {
            if (this.state.vagasFiltradas.length > this.state.vagasExibidas) {
                loadMoreSection.classList.remove('hidden');
            } else {
                loadMoreSection.classList.add('hidden');
            }
        }
    }
    
    criarCardVaga(vaga, index) {
        if (!vaga || !vaga.titulo || !vaga.local || !vaga.departamento) {
            return '<div class="vaga-card-error">⚠️ Vaga com dados inválidos</div>';
        }
        
        const dataExpiracao = vaga.dataExpiracao 
            ? new Date(vaga.dataExpiracao).toLocaleDateString('pt-BR')
            : null;
        
        return `
            <div class="vaga-card" style="animation-delay: ${index * 0.1}s">
                <div class="vaga-header">
                    <h3 class="vaga-titulo">${vaga.titulo || 'Título não disponível'}</h3>
                    ${vaga.referencia && vaga.referencia !== 'null' ? `<span class="vaga-ref">Ref: ${vaga.referencia}</span>` : ''}
                </div>
                
                <div class="vaga-info">
                    <div class="vaga-info-item">
                        <span class="info-icon">📍</span>
                        <strong>Local:</strong> ${vaga.local || 'Não informado'}
                    </div>
                    <div class="vaga-info-item">
                        <span class="info-icon">🏢</span>
                        <strong>Departamento:</strong> ${vaga.departamento || 'Não informado'}
                    </div>
                    ${dataExpiracao ? `
                        <div class="vaga-info-item">
                            <span class="info-icon">⏰</span>
                            <strong>Expira em:</strong> ${dataExpiracao}
                        </div>
                    ` : ''}
                </div>
                
                <div class="vaga-actions">
                    <a href="${vaga.link || '#'}" target="_blank" class="vaga-btn vaga-btn-primary">
                        <span>📋</span> Ver Vaga
                    </a>
                    ${vaga.linkCandidatura && vaga.linkCandidatura !== vaga.link && vaga.linkCandidatura !== '#' ? `
                        <a href="${vaga.linkCandidatura}" target="_blank" class="vaga-btn vaga-btn-success">
                            <span>✉️</span> Candidatar-se
                        </a>
                    ` : ''}
                    <a href="https://careers.smartrecruiters.com/BoschGroup/brazil" target="_blank" class="vaga-btn vaga-btn-secondary">
                        <span>🏢</span> Bosch Carreiras
                    </a>
                </div>
            </div>
        `;
    }
    
    atualizarEstatisticas() {
        if (this.elementos.totalVagasGeral) {
            this.elementos.totalVagasGeral.textContent = this.state.vagas.length;
        }
        
        if (this.state.ultimaAtualizacao && this.elementos.ultimaAtualizacao) {
            const tempo = this.formatarTempoRelativo(this.state.ultimaAtualizacao);
            this.elementos.ultimaAtualizacao.textContent = tempo;
        }
    }
    
    atualizarStatusFiltro() {
        const filtroTexto = {
            'all': 'Todas as vagas',
            'junior': 'Filtrado: Vagas Júnior',
            'estagio': 'Filtrado: Estágios',
            'campinas': 'Filtrado: Campinas',
            'sap': 'Filtrado: SAP',
            'engineering': 'Filtrado: Engenharia'
        };
        
        const cidadeTexto = {
            'all': '',
            'campinas': ' • Cidade: Campinas',
            'sao paulo': ' • Cidade: São Paulo',
            'curitiba': ' • Cidade: Curitiba',
            'porto alegre': ' • Cidade: Porto Alegre'
        };
        
        let status = filtroTexto[this.state.filtroAtivo] || 'Filtro desconhecido';
        status += cidadeTexto[this.state.cidadeAtiva] || '';
        
        if (this.state.termoBusca) {
            status += ` • Busca: "${this.state.termoBusca}"`;
        }
        
        if (this.elementos.filterStatus) {
            this.elementos.filterStatus.textContent = status;
        }
    }
    
    atualizarHorario() {
        if (this.state.ultimaAtualizacao && this.elementos.ultimaAtualizacao) {
            const tempo = this.formatarTempoRelativo(this.state.ultimaAtualizacao);
            this.elementos.ultimaAtualizacao.textContent = tempo;
        } else if (this.elementos.ultimaAtualizacao) {
            this.elementos.ultimaAtualizacao.textContent = 'Nunca';
        }
    }
    
    formatarTempoRelativo(data) {
        const agora = new Date();
        const diferenca = agora - data;
        const minutos = Math.floor(diferenca / 60000);
        
        if (minutos < 1) return 'Agora mesmo';
        if (minutos < 60) return `${minutos}min atrás`;
        
        const horas = Math.floor(minutos / 60);
        if (horas < 24) return `${horas}h atrás`;
        
        const dias = Math.floor(horas / 24);
        return `${dias}d atrás`;
    }
    
    mostrarLoading() {
        if (this.elementos.loading) this.elementos.loading.classList.remove('hidden');
        if (this.elementos.resultados) this.elementos.resultados.classList.add('hidden');
        if (this.elementos.errorSection) this.elementos.errorSection.classList.add('hidden');
    }
    
    ocultarLoading() {
        if (this.elementos.loading) this.elementos.loading.classList.add('hidden');
    }
    
    mostrarResultados() {
        if (this.elementos.resultados) this.elementos.resultados.classList.remove('hidden');
        if (this.elementos.errorSection) this.elementos.errorSection.classList.add('hidden');
    }
    
    mostrarErro(mensagem) {
        if (this.elementos.errorSection) this.elementos.errorSection.classList.remove('hidden');
        if (this.elementos.resultados) this.elementos.resultados.classList.add('hidden');
        if (this.elementos.errorMessage) this.elementos.errorMessage.textContent = mensagem;
    }
    
    mostrarToast(mensagem, tipo = 'info') {
        if (!this.elementos.toastContainer) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${tipo}`;
        
        const icones = {
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️'
        };
        
        toast.innerHTML = `
            <span>${icones[tipo] || 'ℹ️'}</span>
            <span>${mensagem}</span>
        `;
        
        this.elementos.toastContainer.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'slideIn 0.3s ease reverse';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.remove();
                    }
                }, 300);
            }
        }, 4000);
    }
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌍 vagas-rb.tech carregando...');
    console.log('👤 Desenvolvido por Zumbaiero');
    console.log('📅 18/06/2025 - 23:45 UTC');
    
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