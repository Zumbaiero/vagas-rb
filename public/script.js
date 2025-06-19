class VagasBoschApp {
    constructor() {
        this.API_BASE = this.detectarApiBase();
        this.VERSION = '2.0.0';
        this.DOMAIN = 'www.vagas-rb.tech';
        
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
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:3000/api';
        } else if (hostname.includes('vagas-rb.tech')) {
            return `${protocol}//www.vagas-rb.tech/api`;
        } else {
            return '/api';
        }
    }
    
    inicializarElementos() {
        const elementos = {};
        
        const ids = [
            'totalVagasGeral', 'ultimaAtualizacao', 'searchInput', 'clearSearch',
            'loadVagas', 'refreshVagas', 'sortToggle', 'clearAllFilters',
            'countAll', 'countJunior', 'countEstagio', 'countCampinas', 'countSap', 'countEngineering',
            'countAllCities', 'countCidadeCampinas', 'countCidadeSaoPaulo', 'countCidadeCuritiba', 'countCidadePortoAlegre',
            'loading', 'resultados', 'errorSection', 'resultCount', 'filterStatus', 'vagasList', 'loadMore',
            'errorMessage', 'errorTime', 'retryBtn', 'toastContainer'
        ];
        
        ids.forEach(id => {
            elementos[id] = document.getElementById(id);
        });
        
        elementos.filterTabs = document.querySelectorAll('.filter-tab');
        elementos.cityTabs = document.querySelectorAll('.city-tab');
        
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
                const filtro = e.currentTarget.dataset.filter;
                this.definirFiltroAtivo(filtro);
            });
        });
        
        this.elementos.cityTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const cidade = e.currentTarget.dataset.city;
                this.definirCidadeAtiva(cidade);
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
                if (this.elementos.searchInput) {
                    this.elementos.searchInput.focus();
                }
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
        
        if (isRefresh) {
            this.mostrarToast(`🔄 Atualizando vagas de ${this.DOMAIN}...`, 'info');
        }
        
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
                this.state.vagas = dados.vagas.filter(vaga => {
                    return vaga && 
                           vaga.titulo && 
                           vaga.local && 
                           vaga.departamento &&
                           vaga.titulo !== 'Título não disponível';
                });
                
                this.state.ultimaAtualizacao = new Date();
                
                this.atualizarEstatisticas();
                this.aplicarFiltros();
                this.mostrarResultados();
                
                const mensagem = isRefresh 
                    ? `✅ ${this.state.vagas.length} vagas atualizadas!` 
                    : `🎉 ${this.state.vagas.length} vagas carregadas!`;
                    
                this.mostrarToast(mensagem, 'success');
                
                console.log(`✅ ${this.state.vagas.length} vagas carregadas com sucesso`);
                
                ['refreshVagas', 'sortToggle', 'clearAllFilters'].forEach(id => {
                    if (this.elementos[id]) {
                        this.elementos[id].classList.remove('hidden');
                    }
                });
                
            } else {
                throw new Error(dados.erro || 'Formato de dados inválido');
            }
            
        } catch (error) {
            console.error('❌ Erro ao carregar vagas:', error);
            
            let mensagemErro = error.message;
            
            if (error.message.includes('Failed to fetch')) {
                mensagemErro = `Erro de conexão com ${this.DOMAIN}. Verifique sua internet.`;
            } else if (error.message.includes('404')) {
                mensagemErro = `API não encontrada em ${this.DOMAIN}. Tente novamente.`;
            } else if (error.message.includes('500')) {
                mensagemErro = `Erro interno da API ${this.DOMAIN}. Tente novamente em alguns minutos.`;
            }
            
            this.mostrarErro(mensagemErro);
            this.mostrarToast('❌ Erro ao carregar vagas', 'error');
            
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
            const isActive = tab.dataset.filter === filtro;
            tab.classList.toggle('active', isActive);
        });
        
        this.aplicarFiltros();
    }
    
    definirCidadeAtiva(cidade) {
        this.state.cidadeAtiva = cidade;
        this.state.vagasExibidas = 20;
        
        this.elementos.cityTabs.forEach(tab => {
            const isActive = tab.dataset.city === cidade;
            tab.classList.toggle('active', isActive);
        });
        
        this.aplicarFiltros();
    }
    
    limparTodosFiltros() {
        this.state.filtroAtivo = 'all';
        this.state.cidadeAtiva = 'all';
        this.state.termoBusca = '';
        this.state.vagasExibidas = 20;
        
        if (this.elementos.searchInput) {
            this.elementos.searchInput.value = '';
        }
        
        this.elementos.filterTabs.forEach(tab => {
            const isActive = tab.dataset.filter === 'all';
            tab.classList.toggle('active', isActive);
        });
        
        this.elementos.cityTabs.forEach(tab => {
            const isActive = tab.dataset.city === 'all';
            tab.classList.toggle('active', isActive);
        });
        
        this.aplicarFiltros();
        this.mostrarToast('🗑️ Filtros limpos', 'info');
    }
    
    aplicarFiltros() {
        let vagasFiltradas = [...this.state.vagas];
        
        vagasFiltradas = vagasFiltradas.filter(vaga => {
            return vaga && 
                   typeof vaga.titulo === 'string' && 
                   typeof vaga.local === 'string' && 
                   typeof vaga.departamento === 'string';
        });
        
        switch (this.state.filtroAtivo) {
            case 'junior':
                vagasFiltradas = vagasFiltradas.filter(vaga => 
                    vaga.titulo.toLowerCase().includes('junior') || 
                    vaga.titulo.toLowerCase().includes('júnior') ||
                    vaga.titulo.toLowerCase().includes('jr') ||
                    (vaga.nivel && vaga.nivel.toLowerCase() === 'júnior'));
                break;
            case 'estagio':
                vagasFiltradas = vagasFiltradas.filter(vaga => 
                    vaga.titulo.toLowerCase().includes('estágio') ||
                    vaga.titulo.toLowerCase().includes('estagio') ||
                    vaga.titulo.toLowerCase().includes('trainee') ||
                    vaga.titulo.toLowerCase().includes('intern') ||
                    (vaga.nivel && vaga.nivel.toLowerCase() === 'estágio'));
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
                    vaga.titulo.toLowerCase().includes('engineer') ||
                    vaga.titulo.toLowerCase().includes('engenheiro'));
                break;
        }
        
        if (this.state.cidadeAtiva !== 'all') {
            vagasFiltradas = vagasFiltradas.filter(vaga => 
                vaga.local.toLowerCase().includes(this.state.cidadeAtiva.toLowerCase()));
        }
        
        if (this.state.termoBusca.trim()) {
            const termo = this.state.termoBusca.toLowerCase().trim();
            vagasFiltradas = vagasFiltradas.filter(vaga =>
                vaga.titulo.toLowerCase().includes(termo) ||
                vaga.departamento.toLowerCase().includes(termo) ||
                vaga.local.toLowerCase().includes(termo) ||
                (vaga.nivel && vaga.nivel.toLowerCase().includes(termo))
            );
        }
        
        vagasFiltradas.sort((a, b) => {
            const comparison = a.titulo.localeCompare(b.titulo, 'pt-BR');
            return this.state.ordenacaoAsc ? comparison : -comparison;
        });
        
        this.state.vagasFiltradas = vagasFiltradas;
        this.atualizarContadores();
        this.renderizarVagas();
        this.atualizarStatusFiltro();
    }
    
    atualizarContadores() {
        const contarVagas = (filtroFunc) => {
            return this.state.vagas.filter(vaga => {
                if (!vaga || !vaga.titulo || !vaga.local || !vaga.departamento) {
                    return false;
                }
                return filtroFunc(vaga);
            }).length;
        };
        
        const contadores = {
            all: this.state.vagas.length,
            junior: contarVagas(v => 
                v.titulo.toLowerCase().includes('junior') || 
                v.titulo.toLowerCase().includes('júnior') ||
                v.titulo.toLowerCase().includes('jr') ||
                (v.nivel && v.nivel.toLowerCase() === 'júnior')),
            estagio: contarVagas(v => 
                v.titulo.toLowerCase().includes('estágio') ||
                v.titulo.toLowerCase().includes('estagio') ||
                v.titulo.toLowerCase().includes('trainee') ||
                v.titulo.toLowerCase().includes('intern') ||
                (v.nivel && v.nivel.toLowerCase() === 'estágio')),
            campinas: contarVagas(v => v.local.toLowerCase().includes('campinas')),
            sap: contarVagas(v => 
                v.titulo.toLowerCase().includes('sap') || 
                v.departamento.toLowerCase().includes('sap')),
            engineering: contarVagas(v => 
                v.departamento.toLowerCase().includes('engineering') ||
                v.departamento.toLowerCase().includes('engenharia') ||
                v.titulo.toLowerCase().includes('engineer') ||
                v.titulo.toLowerCase().includes('engenheiro'))
        };
        
        const contadoresCidades = {
            all: this.state.vagas.length,
            campinas: contarVagas(v => v.local.toLowerCase().includes('campinas')),
            saoPaulo: contarVagas(v => 
                v.local.toLowerCase().includes('são paulo') || 
                v.local.toLowerCase().includes('sao paulo')),
            curitiba: contarVagas(v => v.local.toLowerCase().includes('curitiba')),
            portoAlegre: contarVagas(v => 
                v.local.toLowerCase().includes('porto alegre'))
        };
        
        const updateCount = (elementId, value) => {
            if (this.elementos[elementId]) {
                this.elementos[elementId].textContent = value;
            }
        };
        
        updateCount('countAll', contadores.all);
        updateCount('countJunior', contadores.junior);
        updateCount('countEstagio', contadores.estagio);
        updateCount('countCampinas', contadores.campinas);
        updateCount('countSap', contadores.sap);
        updateCount('countEngineering', contadores.engineering);
        
        updateCount('countAllCities', contadoresCidades.all);
        updateCount('countCidadeCampinas', contadoresCidades.campinas);
        updateCount('countCidadeSaoPaulo', contadoresCidades.saoPaulo);
        updateCount('countCidadeCuritiba', contadoresCidades.curitiba);
        updateCount('countCidadePortoAlegre', contadoresCidades.portoAlegre);
    }
    
    renderizarVagas() {
        const vagasParaExibir = this.state.vagasFiltradas.slice(0, this.state.vagasExibidas);
        
        if (this.elementos.resultCount) {
            this.elementos.resultCount.textContent = 
                `${this.state.vagasFiltradas.length} vaga${this.state.vagasFiltradas.length !== 1 ? 's' : ''} encontrada${this.state.vagasFiltradas.length !== 1 ? 's' : ''}`;
        }
        
        if (!this.elementos.vagasList) return;
        
        if (vagasParaExibir.length === 0) {
            this.elementos.vagasList.innerHTML = `
                <div class="sem-vagas">
                    <div style="text-align: center; padding: 60px 20px; color: #7f8c8d;">
                        <div style="font-size: 4em; margin-bottom: 20px;">🤷‍♂️</div>
                        <h3>Nenhuma vaga encontrada</h3>
                        <p>Tente ajustar os filtros ou termo de busca</p>
                        <button onclick="window.vagasApp.limparTodosFiltros()" 
                                style="margin-top: 15px; padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 8px; cursor: pointer; font-family: inherit;">
                            🗑️ Limpar Filtros
                        </button>
                        <p style="margin-top: 15px; font-size: 0.9em;">
                            <small>Fonte: ${this.DOMAIN}</small>
                        </p>
                    </div>
                </div>
            `;
        } else {
            this.elementos.vagasList.innerHTML = vagasParaExibir.map((vaga, index) => 
                this.criarCardVaga(vaga, index)).join('');
        }
        
        const loadMoreSection = document.querySelector('.load-more-section');
        if (loadMoreSection) {
            if (this.state.vagasFiltradas.length > this.state.vagasExibidas) {
                loadMoreSection.classList.remove('hidden');
            } else {
                loadMoreSection.classList.add('hidden');
            }
        }
        
        if (this.elementos.vagasList) {
            this.elementos.vagasList.classList.add('fade-in');
        }
    }
    
    criarCardVaga(vaga, index) {
        if (!vaga || !vaga.titulo || !vaga.local || !vaga.departamento) {
            return '<div class="vaga-card-error">⚠️ Vaga com dados inválidos</div>';
        }
        
        const dataExpiracao = vaga.dataExpiracao 
            ? new Date(vaga.dataExpiracao).toLocaleDateString('pt-BR')
            : null;
            
        const dataCriacao = vaga.dataCriacao
            ? new Date(vaga.dataCriacao).toLocaleDateString('pt-BR')
            : null;
        
        return `
            <div class="vaga-card" style="animation-delay: ${index * 0.1}s">
                <div class="vaga-header">
                    <h3 class="vaga-titulo">${vaga.titulo}</h3>
                    ${vaga.referencia && vaga.referencia !== 'null' && vaga.referencia !== 'Não informado' 
                        ? `<span class="vaga-ref">Ref: ${vaga.referencia}</span>` 
                        : ''}
                </div>
                
                <div class="vaga-info">
                    <div class="vaga-info-item">
                        <span class="info-icon">📍</span>
                        <strong>Local:</strong> ${vaga.local}
                    </div>
                    <div class="vaga-info-item">
                        <span class="info-icon">🏢</span>
                        <strong>Departamento:</strong> ${vaga.departamento}
                    </div>
                    ${vaga.nivel && vaga.nivel !== 'Não especificado' ? `
                        <div class="vaga-info-item">
                            <span class="info-icon">⭐</span>
                            <strong>Nível:</strong> ${vaga.nivel}
                        </div>
                    ` : ''}
                    ${dataExpiracao ? `
                        <div class="vaga-info-item">
                            <span class="info-icon">⏰</span>
                            <strong>Expira em:</strong> ${dataExpiracao}
                        </div>
                    ` : ''}
                    ${dataCriacao ? `
                        <div class="vaga-info-item">
                            <span class="info-icon">📅</span>
                            <strong>Publicada em:</strong> ${dataCriacao}
                        </div>
                    ` : ''}
                </div>
                
                <div class="vaga-actions">
                    <a href="${vaga.link || '#'}" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       class="vaga-btn vaga-btn-primary">
                        <span>📋</span> Ver Vaga
                    </a>
                    ${vaga.linkCandidatura && vaga.linkCandidatura !== vaga.link && vaga.linkCandidatura !== '#' ? `
                        <a href="${vaga.linkCandidatura}" 
                           target="_blank" 
                           rel="noopener noreferrer"
                           class="vaga-btn vaga-btn-success">
                            <span>✉️</span> Candidatar-se
                        </a>
                    ` : ''}
                    <a href="https://careers.smartrecruiters.com/BoschGroup/brazil" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       class="vaga-btn vaga-btn-secondary">
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
    
    trackEvent(event, data = {}) {
        // Analytics placeholder
        console.log(`📊 Event: ${event}`, data);
    }
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