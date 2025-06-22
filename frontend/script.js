class VagasApp {
    constructor() {
        this.apiUrl = window.location.hostname === 'localhost' ? 
            'http://localhost:3000/api/vagas' : 
            '/api/vagas';
        this.allJobs = [];
        this.filteredJobs = [];
        this.currentFilter = '';
        this.currentSearch = '';
        
        this.initializeElements();
        this.bindEvents();
        this.loadJobs();
    }

    initializeElements() {
        this.searchInput = document.getElementById('searchInput');
        this.clearSearchBtn = document.getElementById('clearSearch');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.jobsGrid = document.getElementById('jobsGrid');
        this.resultsCount = document.getElementById('resultsCount');
        this.loading = document.getElementById('loading');
        this.noResults = document.getElementById('noResults');
    }

    bindEvents() {
        // Search input events
        this.searchInput.addEventListener('input', (e) => {
            this.currentSearch = e.target.value.trim();
            this.toggleClearButton();
            this.debounceSearch();
        });

        this.clearSearchBtn.addEventListener('click', () => {
            this.searchInput.value = '';
            this.currentSearch = '';
            this.toggleClearButton();
            this.filterJobs();
        });

        // Filter button events
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setActiveFilter(e.target);
                this.currentFilter = e.target.dataset.filter;
                this.filterJobs();
            });
        });
    }

    toggleClearButton() {
        this.clearSearchBtn.style.display = this.currentSearch ? 'block' : 'none';
    }

    setActiveFilter(activeBtn) {
        this.filterButtons.forEach(btn => btn.classList.remove('active'));
        activeBtn.classList.add('active');
    }

    debounceSearch() {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.filterJobs();
        }, 300);
    }

    async loadJobs() {
        try {
            this.showLoading(true);
            const response = await fetch(this.apiUrl);
            
            if (!response.ok) {
                throw new Error('Erro ao carregar vagas');
            }
            
            this.allJobs = await response.json();
            this.filteredJobs = [...this.allJobs];
            this.renderJobs();
            this.updateResultsCount();
        } catch (error) {
            console.error('Erro ao carregar vagas:', error);
            this.showError('Erro ao carregar vagas. Tente novamente mais tarde.');
        } finally {
            this.showLoading(false);
        }
    }

    async filterJobs() {
        try {
            this.showLoading(true);
            
            const params = new URLSearchParams();
            
            if (this.currentFilter && this.currentFilter !== 'all') {
                if (this.currentFilter === 'campinas') {
                    params.append('cidade', 'campinas');
                } else {
                    params.append('nivel', this.currentFilter);
                }
            }
            
            if (this.currentSearch) {
                params.append('busca', this.currentSearch);
            }
            
            const url = `${this.apiUrl}${params.toString() ? '?' + params.toString() : ''}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error('Erro ao filtrar vagas');
            }
            
            this.filteredJobs = await response.json();
            this.renderJobs();
            this.updateResultsCount();
        } catch (error) {
            console.error('Erro ao filtrar vagas:', error);
            this.showError('Erro ao filtrar vagas. Tente novamente.');
        } finally {
            this.showLoading(false);
        }
    }

    renderJobs() {
        if (this.filteredJobs.length === 0) {
            this.showNoResults(true);
            this.jobsGrid.innerHTML = '';
            return;
        }

        this.showNoResults(false);
        this.jobsGrid.innerHTML = this.filteredJobs.map(job => this.createJobCard(job)).join('');
    }

    createJobCard(job) {
        const location = job.location ? 
            `${job.location.city}, ${job.location.region}` : 
            'Localização não informada';
        
        const functionLabel = job.function?.label || 'Função não informada';
        const experienceLevel = this.getExperienceLevelLabel(job.experienceLevel?.id);
        const releasedDate = new Date(job.releasedDate).toLocaleDateString('pt-BR');
        
        // Construir URL oficial da vaga
        const jobUrl = `https://jobs.smartrecruiters.com/BoschGroup/${job.id}-${job.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}`;

        return `
            <div class="job-card">
                <h3 class="job-title">${job.name}</h3>
                
                <div class="job-meta">
                    <div class="job-meta-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span class="job-location">${location}</span>
                    </div>
                    <div class="job-meta-item">
                        <i class="fas fa-calendar"></i>
                        <span>Publicada em ${releasedDate}</span>
                    </div>
                </div>

                <div class="job-meta">
                    <span class="job-function">${functionLabel}</span>
                    ${experienceLevel ? `<span class="job-experience">${experienceLevel}</span>` : ''}
                </div>

                <div class="job-actions">
                    <a href="${jobUrl}" target="_blank" class="btn btn-primary">
                        <i class="fas fa-external-link-alt"></i>
                        Ver Vaga
                    </a>
                    <button class="btn btn-secondary" onclick="navigator.share ? navigator.share({title: '${job.name}', url: '${jobUrl}'}) : this.copyToClipboard('${jobUrl}')">
                        <i class="fas fa-share"></i>
                        Compartilhar
                    </button>
                </div>
            </div>
        `;
    }

    getExperienceLevelLabel(level) {
        const levels = {
            'entry_level': 'Júnior',
            'associate': 'Pleno',
            'mid_senior_level': 'Sênior',
            'senior': 'Sênior',
            'executive': 'Executivo'
        };
        return levels[level] || '';
    }

    updateResultsCount() {
        const count = this.filteredJobs.length;
        const text = count === 1 ? 'vaga encontrada' : 'vagas encontradas';
        this.resultsCount.textContent = `${count} ${text}`;
    }

    showLoading(show) {
        this.loading.style.display = show ? 'block' : 'none';
    }

    showNoResults(show) {
        this.noResults.style.display = show ? 'block' : 'none';
    }

    showError(message) {
        this.jobsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #ef4444;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p>${message}</p>
            </div>
        `;
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            // Feedback visual simples
            const btn = event.target.closest('.btn-secondary');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i> Copiado!';
            setTimeout(() => {
                btn.innerHTML = originalText;
            }, 2000);
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new VagasApp();
});

// Add copy to clipboard method to button prototype for inline onclick
HTMLButtonElement.prototype.copyToClipboard = function(text) {
    navigator.clipboard.writeText(text).then(() => {
        const originalText = this.innerHTML;
        this.innerHTML = '<i class="fas fa-check"></i> Copiado!';
        setTimeout(() => {
            this.innerHTML = originalText;
        }, 2000);
    });
};

