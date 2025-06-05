// Initialize plot details functionality
class PlotDetailsManager {
    constructor() {
        this.modalSystem = null;
        this.plotData = null;
        this.init();
    }

    async init() {
        try {
            this.modalSystem = await window.waitForModalSystem();
            await this.setupModal();
            await this.fetchPlotData();
            this.setupEventListeners();
        } catch (error) {
            console.error('Error initializing plot details:', error);
        }
    }

    async setupModal() {
        this.modalSystem.createModal('Project Kenmerken', '', { id: 'projectDetailsModal' });
        const modal = document.getElementById('projectDetailsModal');
        if (modal) {
            modal.classList.add('project-details-modal');
        }
    }

    async fetchPlotData() {
        try {
            const slug = this.getSlugFromUrl();
            if (!slug) {
                throw new Error('No slug found in URL');
            }

            const response = await fetch(`https://api.crowdbuilding.com/api/v1/plots/${slug}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const { data } = await response.json();
            this.plotData = data;
            this.updatePageElements(data);
        } catch (error) {
            console.error('Error fetching plot data:', error);
        }
    }

    getSlugFromUrl() {
        const pathParts = window.location.pathname.split('/');
        return pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            const detailsGroup = e.target.closest('.project__sidebar-group.details');
            if (detailsGroup) {
                e.preventDefault();
                this.showModal();
            }
        });
    }

    updatePageElements(data) {
        // Update basic elements
        this.updateElement('.project-title', data.title);
        this.updateElement('.project-subtitle', data.subtitle);
        this.updateElement('.project-intro', data.intro, true);
        this.updateElement('.project-location', data.location);
        this.updateElement('.project-phase', data.phase?.name);
        this.updateElement('.project-development-form', data.development_form?.name);
        this.updateElement('.project-homes-count', data.number_of_homes);
        this.updateElement('.project-member-status', data.member_status?.name);

        // Update descriptions
        if (data.info) {
            this.updateDescriptions(data.info);
        }

        // Update arrays with max items
        this.updateArrayElement('.project-housing-forms', data.housing_forms, 'title');
        this.updateArrayElement('.project-target-audiences', data.target_audiences, 'name');
        this.updateArrayElement('.project-interests', data.interests, 'name');

        // Update images
        this.updateImages(data.images);

        // Initialize admin display if available
        if (typeof window.fetchAdminsData === 'function') {
            window.fetchAdminsData();
        }
    }

    updateElement(selector, value, isHTML = false) {
        const element = document.querySelector(selector);
        if (!element) return;

        if (value) {
            if (isHTML) {
                element.innerHTML = value;
            } else {
                element.textContent = value;
            }
            element.style.display = 'block';
        } else {
            element.style.display = 'none';
        }
    }

    updateArrayElement(selector, array, property) {
        const container = document.querySelector(selector);
        if (!container) return;

        if (array?.length) {
            const maxItems = 3;
            const displayItems = array.slice(0, maxItems);
            const remainingCount = Math.max(0, array.length - maxItems);

            container.innerHTML = displayItems.map(item => 
                `<div class="tag">${item[property]}</div>`
            ).join('') + (remainingCount > 0 ? `<div class="remaining-count">+${remainingCount}</div>` : '');
            container.style.display = 'block';
        } else {
            container.style.display = 'none';
        }
    }

    updateDescriptions(descriptions) {
        const container = document.querySelector('.project-descriptions');
        if (!container) return;

        if (descriptions?.length) {
            container.innerHTML = descriptions.map(desc => `
                <div class="description-section">
                    <h3>${desc.title}</h3>
                    <div class="description-content">${desc.text}</div>
                </div>
            `).join('');
            container.style.display = 'block';
        } else {
            container.style.display = 'none';
        }
    }

    updateImages(images) {
        const gallery = document.getElementById('gallery');
        if (!gallery || !images?.length) return;

        gallery.innerHTML = images
            .map(image => `<img src="${image.conversions?.thumb?.url || image.original_url}" alt="${image.name}" class="project-image">`)
            .join('');
    }

    showModal() {
        if (!this.plotData) {
            console.error('No plot data available');
            return;
        }

        const content = this.generateModalContent();
        this.modalSystem.updateModalContent('projectDetailsModal', content);
        this.modalSystem.showModal('projectDetailsModal');
    }

    generateModalContent() {
        const data = this.plotData;
        return `
            <div class="cb-details-grid">
                <div class="section-header">
                    <h3>Kenmerken</h3>
                </div>
                <div class="cb-detail-items">
                    ${this.generateDetailItem('Plaats', data.location)}
                    ${this.generateDetailItem('Projectfase', data.phase?.name)}
                    ${this.generateDetailItem('Ontwikkelvorm', data.development_form?.name)}
                    ${this.generateDetailItem('Status', data.member_status?.name)}
                    ${this.generateDetailItem('Grootte', data.number_of_homes, 'woningen')}
                    ${this.generateDetailItem('Woonmilieu', data.living_environment?.name)}
                    ${this.generateTagsSection('Doelgroepen', data.target_audiences)}
                    ${this.generateTagsSection('Woonvormen', data.housing_forms, 'title')}
                </div>

                <div class="section-header">
                    <h3>Contact informatie</h3>
                </div>
                <div class="cb-detail-items">
                    ${this.generateDetailItem('Naam contact persoon', data.contact_person)}
                    ${this.generateDetailItem('E-mail adres', data.contact_email)}
                    ${this.generateDetailItem('Website', data.website, null, true)}
                </div>
            </div>
        `;
    }

    generateDetailItem(label, value, suffix = '', isLink = false) {
        if (!value) return '';
        
        let displayValue = value;
        if (suffix) displayValue += ` ${suffix}`;
        if (isLink) displayValue = `<a href="${value}" target="_blank">${value}</a>`;

        return `
            <div class="cb-detail-item">
                <div class="detail-label">${label}</div>
                <div class="detail-value">${displayValue}</div>
            </div>
        `;
    }

    generateTagsSection(title, items, property = 'name') {
        if (!items?.length) return '';

        return `
            <div class="cb-detail-item">
                <div class="detail-label">${title}</div>
                <div class="detail-value">
                    <div class="tags-list">
                        ${items.map(item => `<div class="tag">${item[property]}</div>`).join('')}
                    </div>
                </div>
            </div>
        `;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => new PlotDetailsManager()); 