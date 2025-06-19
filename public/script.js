class VagasBoschApp {
  constructor() {
    this.API_BASE = this.detectarApiBase();
    this.VERSION = '2.0.0';
    this.DOMAIN = window.location.hostname;

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
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3000/api';
    }
    return '/api';
  }

  inicializarElementos() {
    const elems = {};
    const ids = [
      'totalVagasGeral','ultimaAtualizacao',
      'searchInput','clearSearch',
      'loadVagas','refreshVagas','sortToggle','clearAllFilters',
      'countAll','countJunior','countEstagio','countCampinas','countSap','countEngineering',
      'countAllCities','countCidadeCampinas','countCidadeSaoPaulo','countCidadeCuritiba','countCidadePortoAlegre',
      'loading','resultados','errorSection',
      'resultCount','filterStatus','vagasList','loadMore',
      'errorMessage','errorTime','retryBtn','toastContainer'
    ];
    ids.forEach(id => elems[id] = document.getElementById(id));
    elems.filterTabs = document.querySelectorAll('.filter-tab');
    elems.cityTabs   = document.querySelectorAll('.city-tab');
    return elems;
  }

  init() {
    console.log(`🚀 Inicializando VagasBoschApp em ${this.DOMAIN}`);
    this.configurarEventListeners();
    this.testarConexaoAPI();
    this.carregarVagas();
    this.atualizarHorario();
    setInterval(() => this.atualizarHorario(), 60000);
  }

  async testarConexaoAPI() {
    try {
      console.log('🔍 Testando conexão com a API...');
      const resp = await fetch(`${this.API_BASE}/health`);
      if (resp.ok) {
        const data = await resp.json();
        console.log('✅ API ok:', data);
        this.mostrarToast(`✅ Conectado com ${this.DOMAIN}`, 'success');
      } else {
        console.warn('⚠️ API respondeu com erro', resp.status);
        this.mostrarToast('⚠️ API com problemas', 'warning');
      }
    } catch (err) {
      console.error('❌ Erro de conexão', err);
      this.mostrarToast('❌ Erro de conexão', 'error');
    }
  }

  configurarEventListeners() {
    const e = this.elementos;
    if (e.loadVagas)       e.loadVagas.addEventListener('click', () => this.carregarVagas());
    if (e.refreshVagas)    e.refreshVagas.addEventListener('click', () => this.carregarVagas(true));
    if (e.retryBtn)        e.retryBtn.addEventListener('click', () => this.carregarVagas());
    if (e.clearAllFilters) e.clearAllFilters.addEventListener('click', () => this.limparTodosFiltros());
    if (e.searchInput) {
      e.searchInput.addEventListener('input', ev => {
        this.state.termoBusca = ev.target.value;
        this.debounce(() => this.aplicarFiltros(), 300)();
      });
    }
    if (e.clearSearch) {
      e.clearSearch.addEventListener('click', () => {
        e.searchInput.value = '';
        this.state.termoBusca = '';
        this.aplicarFiltros();
      });
    }
    e.filterTabs.forEach(tab => {
      tab.addEventListener('click', ev => this.definirFiltroAtivo(ev.currentTarget.dataset.filter));
    });
    e.cityTabs.forEach(tab => {
      tab.addEventListener('click', ev => this.definirCidadeAtiva(ev.currentTarget.dataset.city));
    });
    if (e.sortToggle) {
      e.sortToggle.addEventListener('click', () => {
        this.state.ordenacaoAsc = !this.state.ordenacaoAsc;
        const btnText = e.sortToggle.querySelector('.btn-text');
        if (btnText) btnText.textContent = this.state.ordenacaoAsc ? 'A-Z' : 'Z-A';
        this.aplicarFiltros();
      });
    }
    if (e.loadMore) {
      e.loadMore.addEventListener('click', () => {
        this.state.vagasExibidas += 20;
        this.renderizarVagas();
      });
    }
    document.addEventListener('keydown', ev => {
      if ((ev.ctrlKey || ev.metaKey) && ev.key === 'k') {
        ev.preventDefault();
        if (e.searchInput) e.searchInput.focus();
      }
      if (ev.key === 'Escape' && document.activeElement === e.searchInput) {
        e.searchInput.blur();
        e.searchInput.value = '';
        this.state.termoBusca = '';
        this.aplicarFiltros();
      }
    });
  }

  async carregarVagas(isRefresh = false) {
    if (this.state.loading) return;
    this.state.loading = true;
    this.mostrarLoading();
    if (isRefresh) this.mostrarToast('🔄 Atualizando vagas...', 'info');

    try {
      console.log('🔍 Carregando vagas...');
      const resp = await fetch(`${this.API_BASE}/vagas`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const dados = await resp.json();
      if (dados.success && Array.isArray(dados.vagas)) {
        this.state.vagas = dados.vagas;
        this.state.ultimaAtualizacao = new Date();
        this.atualizarEstatisticas();
        this.aplicarFiltros();
        this.mostrarResultados();
        this.mostrarToast(`🎉 ${this.state.vagas.length} vagas carregadas!`, 'success');
      } else {
        throw new Error(dados.erro || 'Formato de dados inválido');
      }
    } catch (err) {
      console.error('❌ Erro ao carregar vagas:', err);
      this.mostrarErro(err.message);
      this.mostrarToast('❌ Erro ao carregar vagas', 'error');
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
    this.state.filtroAtivo = 'all';
    this.state.cidadeAtiva = 'all';
    this.state.termoBusca = '';
    this.state.vagasExibidas = 20;
    if (this.elementos.searchInput) this.elementos.searchInput.value = '';
    this.elementos.filterTabs.forEach(tab => tab.classList.toggle('active', tab.dataset.filter === 'all'));
    this.elementos.cityTabs.forEach(tab => tab.classList.toggle('active', tab.dataset.city === 'all'));
    this.aplicarFiltros();
    this.mostrarToast('🗑️ Filtros limpos', 'info');
  }

  aplicarFiltros() {
    let list = [...this.state.vagas];

    // filtros rápidos
    switch (this.state.filtroAtivo) {
      case 'junior':
        list = list.filter(v => v.titulo.toLowerCase().includes('junior') || v.titulo.toLowerCase().includes('jr'));
        break;
      case 'estagio':
        list = list.filter(v => /estagi|trainee|intern/.test(v.titulo.toLowerCase()));
        break;
      case 'campinas':
        list = list.filter(v => v.local.toLowerCase().includes('campinas'));
        break;
      case 'sap':
        list = list.filter(v => v.titulo.toLowerCase().includes('sap') || v.departamento.toLowerCase().includes('sap'));
        break;
      case 'engineering':
        list = list.filter(v => /engenharia|engineer/.test(v.departamento.toLowerCase()));
        break;
    }

    // filtro por cidade
    if (this.state.cidadeAtiva !== 'all') {
      list = list.filter(v => v.local.toLowerCase().includes(this.state.cidadeAtiva));
    }

    // busca por termo
    if (this.state.termoBusca.trim()) {
      const termo = this.state.termoBusca.toLowerCase();
      list = list.filter(v =>
        v.titulo.toLowerCase().includes(termo) ||
        v.local.toLowerCase().includes(termo) ||
        v.departamento.toLowerCase().includes(termo)
      );
    }

    // ordenação
    list.sort((a, b) => {
      const cmp = a.titulo.localeCompare(b.titulo, 'pt-BR');
      return this.state.ordenacaoAsc ? cmp : -cmp;
    });

    this.state.vagasFiltradas = list;
    this.atualizarContadores();
    this.renderizarVagas();
    this.atualizarStatusFiltro();
  }

  atualizarContadores() {
    const totalAll = this.state.vagas.length;
    const count = type => this.state.vagas.filter(v => v.titulo.toLowerCase().includes(type)).length;
    document.getElementById('countAll').textContent = totalAll;
    document.getElementById('countJunior').textContent = count('junior');
    document.getElementById('countEstagio').textContent = this.state.vagas.filter(v => /estagi|trainee/.test(v.titulo.toLowerCase())).length;
    document.getElementById('countCampinas').textContent = this.state.vagas.filter(v => v.local.toLowerCase().includes('campinas')).length;
    document.getElementById('countSap').textContent = count('sap');
    document.getElementById('countEngineering').textContent = this.state.vagas.filter(v => /engenharia|engineer/.test(v.departamento.toLowerCase())).length;

    document.getElementById('countAllCities').textContent = totalAll;
    document.getElementById('countCidadeCampinas').textContent = this.state.vagas.filter(v => v.local.toLowerCase().includes('campinas')).length;
    document.getElementById('countCidadeSaoPaulo').textContent = this.state.vagas.filter(v => v.local.toLowerCase().includes('são paulo')).length;
    document.getElementById('countCidadeCuritiba').textContent = this.state.vagas.filter(v => v.local.toLowerCase().includes('curitiba')).length;
    document.getElementById('countCidadePortoAlegre').textContent = this.state.vagas.filter(v => v.local.toLowerCase().includes('porto alegre')).length;
  }

  renderizarVagas() {
    const toShow = this.state.vagasFiltradas.slice(0, this.state.vagasExibidas);
    if (this.elementos.vagasList) {
      if (toShow.length === 0) {
        this.elementos.vagasList.innerHTML = `
          <div class="sem-vagas"><h3>Nenhuma vaga encontrada</h3></div>
        `;
      } else {
        this.elementos.vagasList.innerHTML = toShow.map((v,i) => this.criarCardVaga(v,i)).join('');
      }
    }
    const loadMoreSec = document.querySelector('.load-more-section');
    if (loadMoreSec) {
      loadMoreSec.classList.toggle('hidden', this.state.vagasFiltradas.length <= this.state.vagasExibidas);
    }
    if (this.elementos.resultCount) {
      this.elementos.resultCount.textContent = `${this.state.vagasFiltradas.length} vaga${this.state.vagasFiltradas.length!==1?'s':''} encontrada${this.state.vagasFiltradas.length!==1?'s':''}`;
    }
  }

  criarCardVaga(vaga, index) {
    const dataExp = vaga.dataExpiracao ? new Date(vaga.dataExpiracao).toLocaleDateString('pt-BR') : null;
    const dataCri = vaga.dataCriacao ? new Date(vaga.dataCriacao).toLocaleDateString('pt-BR') : null;
    return `
      <div class="vaga-card" style="animation-delay:${index*0.1}s">
        <div class="vaga-header">
          <h3 class="vaga-titulo">${vaga.titulo}</h3>
          ${vaga.referencia?`<span class="vaga-ref">Ref:${vaga.referencia}</span>`:''}
        </div>
        <div class="vaga-info">
          <div><span>📍</span> ${vaga.local}</div>
          <div><span>🏢</span> ${vaga.departamento}</div>
          ${vaga.nivel?`<div><span>⭐</span> ${vaga.nivel}</div>`:''}
          ${dataExp?`<div><span>⏰</span> ${dataExp}</div>`:''}
          ${dataCri?`<div><span>📅</span> ${dataCri}</div>`:''}
        </div>
        <div class="vaga-actions">
          <a href="${vaga.link}" class="vaga-btn vaga-btn-primary">📋 Ver Vaga</a>
          ${vaga.linkCandidatura && vaga.linkCandidatura!==vaga.link?`<a href="${vaga.linkCandidatura}" target="_blank" rel="noopener" class="vaga-btn vaga-btn-success">✉️ Candidatar-se</a>`:''}
        </div>
      </div>
    `;
  }

  atualizarEstatisticas() {
    if (this.elementos.totalVagasGeral) {
      const total = this.state.vagas.length;
      this.elementos.totalVagasGeral.textContent = total >= 200 ? '200+' : total;
    }
    if (this.elementos.ultimaAtualizacao && this.state.ultimaAtualizacao) {
      this.elementos.ultimaAtualizacao.textContent = this.formatarTempoRelativo(this.state.ultimaAtualizacao);
    }
  }

  atualizarStatusFiltro() {
    const textos = {
      all: 'Todas as vagas',
      junior: 'Filtrado: Júnior',
      estagio: 'Filtrado: Estágio',
      campinas: 'Filtrado: Campinas',
      sap: 'Filtrado: SAP',
      engineering: 'Filtrado: Engenharia'
    };
    let txt = textos[this.state.filtroAtivo] || '';
    if (this.state.cidadeAtiva !== 'all') {
      txt += ` • Cidade: ${this.state.cidadeAtiva.charAt(0).toUpperCase()+this.state.cidadeAtiva.slice(1)}`;
    }
    if (this.state.termoBusca) {
      txt += ` • Busca: "${this.state.termoBusca}"`;
    }
    if (this.elementos.filterStatus) {
      this.elementos.filterStatus.textContent = txt;
    }
  }

  atualizarHorario() {
    if (this.elementos.ultimaAtualizacao) {
      this.elementos.ultimaAtualizacao.textContent = this.state.ultimaAtualizacao
        ? this.formatarTempoRelativo(this.state.ultimaAtualizacao)
        : 'Nunca';
    }
  }

  formatarTempoRelativo(data) {
    const diff = Date.now() - data;
    const mins = Math.floor(diff/60000);
    if (mins < 1) return 'Agora mesmo';
    if (mins < 60) return `${mins}min atrás`;
    const hrs = Math.floor(mins/60);
    if (hrs < 24) return `${hrs}h atrás`;
    const dias = Math.floor(hrs/24);
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

  mostrarErro(msg) {
    if (this.elementos.errorSection) this.elementos.errorSection.classList.remove('hidden');
    if (this.elementos.resultados) this.elementos.resultados.classList.add('hidden');
    if (this.elementos.errorMessage) this.elementos.errorMessage.textContent = msg;
    if (this.elementos.errorTime) this.elementos.errorTime.textContent = new Date().toLocaleString('pt-BR');
  }

  mostrarToast(msg, tipo='info') {
    const container = this.elementos.toastContainer;
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    const icons = { success:'✅', error:'❌', warning:'⚠️', info:'ℹ️' };
    toast.innerHTML = `<span>${icons[tipo]||'ℹ️'}</span><span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  debounce(fn, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), wait);
    };
  }

  trackEvent(event, data={}) {
    console.log(`📊 Event: ${event}`, data);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.vagasApp = new VagasBoschApp();
});