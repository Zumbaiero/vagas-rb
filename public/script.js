class VagasBoschApp {
    constructor() {
        // Configuração da API
        this.API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000/api' 
            : '/api';
        
        // Estado da aplicação
        this.state = {
            vagas: [],
            vagasFiltradas: [],
            filtroAtivo: 'all',
            termoBusca: '',
            ordenacao: 'titulo',
            ordenacaoAsc: true,
            loading: false,
            vagasExibidas: 20,
            ultimaAtualizacao: null
        };
        
        // Elementos DOM
        this.elementos = this.inicializarElementos();
        
        // Inicializar aplicação
        this.init();
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
            loadVagas: document.getElementById('loadVagas'),
            refreshVagas: document.getElementById('refreshVagas'),
            sortToggle: document.getElementById('sortToggle'),
            
            // Contadores dos filtros
            countAll: document.getElementById('countAll'),
            countCampinas: document.getElementById('countCampinas'),
            countSap: document.getElementById('countSap'),
            countEngineering: document.getElementById('countEngineering'),
            
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
            retryBtn: document.getElementById('retryBtn'),
            reportBtn: document.getElementById('reportBtn'),
            
            // Toast
            toastContainer: document.getElementById('toastContainer')
        };
    }
    
    init() {
        console.log('🚀 Inicializando Vagas Bosch App');
        this.configurarEventListeners();
        this.carregarVagas();
        this.atualizarHorario();
        
        // Atualizar horário a cada minuto
        setInterval(() => this.atualizarHorario(), 60000);
    }
    
    configurarEventListeners() {
        // Botões principais
        this.elementos.loadVagas.addEventListener('click', () => this.carregarVagas());
        this.elementos.refreshVagas.addEventListener('click', () => this.carregarVagas(true));
        this.elementos.retryBtn.addEventListener('click', () => this.carregarVagas());
        
        // Busca
        this.elementos.searchInput.addEventListener('input', (e) => {
            this.state.termoBusca = e.target.value;
            this.debounce(() => this.aplicarFiltros(), 300)();
        });
        
        this.elementos.clearSearch.addEventListener('click', () => {
            this.elementos.searchInput.value = '';
            this.state.termoBusca = '';
            this.aplicarFiltros();
        });
        
        // Filtros
        this.elementos.filterTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const filtro = e.currentTarget.dataset.filter;
                this.definirFiltroAtivo(filtro);
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
        
        // Report button
        this.elementos.reportBtn.addEventListener('click', () => {
            window.open('mailto:contato@vagas-rb.tech?subject=Problema no site&body=Descreva o problema encontrado...', '_blank');
        });
    }
    
    async carregarVagas(isRefresh = false) {
        if (this.state.loading) return;
        
        this.state.loading = true;
        this.mostrarLoading();
        
        if (isRefresh) {
            this.mostrarToast('🔄 Atualizando vagas...', 'info');
        }
        
        try {
            console.log('🔍 Carregando vagas da API...');
            
            const response = await fetch(`${this.API_BASE}/vagas`);
            const dados = await response.json();
            
            if (dados.success) {
                this.state.vagas = dados.vagas;
                this.state.ultimaAtualizacao = new Date();
                
                this.atualizarEstatisticas();
                this.aplicarFiltros();
                this.mostrarResultados();
                
                const mensagem = isRefresh 
                    ? `✅ ${dados.total} vagas atualizadas!` 
                    : `🎉 ${dados.total} vagas carregadas com sucesso!`;
                    
                this.mostrarToast(mensagem, 'success');
                
                console.log(`✅ ${dados.total} vagas carregadas`);
                
                // Mostrar controles adicionais
                this.elementos.refreshVagas.classList.remove('hidden');
                this.elementos.sortToggle.classList.remove('hidden');
                
            } else {
                throw new Error(dados.erro || 'Erro desconhecido');
            }
            
        } catch (error) {
            console.error('❌ Erro ao carregar vagas:', error);
            this.mostrarErro(error.message);
            this.mostrarToast('❌ Erro ao carregar vagas', 'error');
        } finally {
            this.state.loading = false;
            this.ocultarLoading();
        }
    }
    
    definirFiltroAtivo(filtro) {
        // Atualizar estado
        this.state.filtroAtivo = filtro;
        this.state.vagasExibidas = 20;
        
        // Atualizar UI dos tabs
        this.elementos.filterTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.filter === filtro);
        });
        
        // Aplicar filtros
        this.aplicarFiltros();
    }
    
    aplicarFiltros() {
        let vagasFiltradas = [...this.state.vagas];
        
        // Filtro por categoria
        switch (this.state.filtroAtivo) {
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
        const contadores = {
            all: this.state.vagas.length,
            campinas: this.state.vagas.filter(v => v.local.toLowerCase().includes('campinas')).length,
            sap: this.state.vagas.filter(v => 
                v.titulo.toLowerCase().includes('sap') || 
                v.departamento.toLowerCase().includes('sap')).length,
            engineering: this.state.vagas.filter(v => 
                v.departamento.toLowerCase().includes('engineering') ||
                v.departamento.toLowerCase().includes('engenharia') ||
                v.titulo.toLowerCase().includes('engineer')).length
        };
        
        this.elementos.countAll.textContent = contadores.all;
        this.elementos.countCampinas.textContent = contadores.campinas;
        this.elementos.countSap.textContent = contadores.sap;
        this.elementos.countEngineering.textContent = contadores.engineering;
    }
    
    renderizarVagas() {
        const vagasParaExibir = this.state.vagasFiltradas.slice(0, this.state.vagasExibidas);
        
        this.elementos.resultCount.textContent = 
            `${this.state.vagasFiltradas.length} vaga${this.state.vagasFiltradas.length !== 1 ? 's' : ''} encontrada${this.state.vagasFiltradas.length !== 1 ? 's' : ''}`;
        
        if (vagasParaExibir.length === 0) {
            this.elementos.vagasList.innerHTML = `
                <div class="sem-vagas">
                    <div style="text-align: center; padding: 60px 20px; color: #7f8c8d;">
                        <div style="font-size: 4em; margin-bottom: 20px;">🤷‍♂️</div>
                        <h3>Nenhuma vaga encontrada</h3>
                        <p>Tente ajustar os filtros ou termo de busca</p>
                    </div>
                </div>
            `;
        } else {
            this.elementos.vagasList.innerHTML = vagasParaExibir.map((vaga, index) => 
                this.criarCardVaga(vaga, index)).join('');
        }
        
        // Mostrar/ocultar botão "Load More"
        const loadMoreSection = document.querySelector('.load-more-section');
        if (this.state.vagasFiltradas.length > this.state.vagasExibidas) {
            loadMoreSection.classList.remove('hidden');
        } else {
            loadMoreSection.classList.add('hidden');
        }
        
        // Animação de entrada
        this.elementos.vagasList.classList.add('fade-in');
    }
    
    criarCardVaga(vaga, index) {
        const dataExpiracao = vaga.dataExpiracao 
            ? new Date(vaga.dataExpiracao).toLocaleDateString('pt-BR')
            : null;
        
        return `
            <div class="vaga-card" style="animation-delay: ${index * 0.1}s">
                <div class="vaga-header">
                    <h3 class="vaga-titulo">${vaga.titulo}</h3>
                    ${vaga.referencia ? `<span class="vaga-ref">Ref: ${vaga.referencia}</span>` : ''}
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
                    ${dataExpiracao ? `
                        <div class="vaga-info-item">
                            <span class="info-icon">⏰</span>
                            <strong>Expira em:</strong> ${dataExpiracao}
                        </div>
                    ` : ''}
                </div>
                
                <div class="vaga-actions">
                    <a href="${vaga.link}" target="_blank" class="vaga-btn vaga-btn-primary">
                        <span>📋</span> Ver Vaga
                    </a>
                    ${vaga.linkCandidatura && vaga.linkCandidatura !== vaga.link ? `
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
        this.elementos.totalVagasGeral.textContent = this.state.vagas.length;
        
        if (this.state.ultimaAtualizacao) {
            const tempo = this.formatarTempoRelativo(this.state.ultimaAtualizacao);
            this.elementos.ultimaAtualizacao.textContent = tempo;
        }
    }
    
    atualizarStatusFiltro() {
        const filtroTexto = {
            'all': 'Mostrando todas as vagas',
            'campinas': 'Filtrado: Campinas',
            'sap': 'Filtrado: SAP',
            'engineering': 'Filtrado: Engenharia'
        };
        
        let status = filtroTexto[this.state.filtroAtivo];
        
        if (this.state.termoBusca) {
            status += ` • Busca: "${this.state.termoBusca}"`;
        }
        
        this.elementos.filterStatus.textContent = status;
    }
    
    atualizarHorario() {
        if (this.state.ultimaAtualizacao) {
            const tempo = this.formatarTempoRelativo(this.state.ultimaAtualizacao);
            this.elementos.ultimaAtualizacao.textContent = tempo;
        } else {
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
        this.elementos.loading.classList.remove('hidden');
        this.elementos.resultados.classList.add('hidden');
        this.elementos.errorSection.classList.add('hidden');
    }
    
    ocultarLoading() {
        this.elementos.loading.classList.add('hidden');
    }
    
    mostrarResultados() {
        this.elementos.resultados.classList.remove('hidden');
        this.elementos.errorSection.classList.add('hidden');
    }
    
    mostrarErro(mensagem) {
        this.elementos.errorSection.classList.remove('hidden');
        this.elementos.resultados.classList.add('hidden');
        this.elementos.errorMessage.textContent = mensagem;
    }
    
    mostrarToast(mensagem, tipo = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${tipo}`;
        
        const icones = {
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️'
        };
        
        toast.innerHTML = `
            <span>${icones[tipo]}</span>
            <span>${mensagem}</span>
        `;
        
        this.elementos.toastContainer.appendChild(toast);
        
        // Remover após 4 segundos
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
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

// Inicializar aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌍 vagas-rb.tech carregando...');
    window.vagasApp = new VagasBoschApp();
});

// Debug para desenvolvimento
if (window.location.hostname === 'localhost') {
    console.log('🔧 Modo desenvolvimento ativo');
    window.debugApp = () => window.vagasApp;
}