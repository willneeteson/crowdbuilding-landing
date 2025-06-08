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

        // Update deadline counter
        this.updateDeadlineCounter(data.application_deadline);

        // Update documents
        this.updateDocuments(data.documents);

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

    updateDeadlineCounter(deadline) {
        const deadlineCounter = document.querySelector('.plot-deadline-counter');
        const deadlineNumber = document.querySelector('.deadline-number');
        const signupBtn = document.querySelector('#plotSignupBtn');
        
        if (!deadlineCounter || !deadlineNumber || !deadline) {
            if (deadlineCounter) deadlineCounter.style.display = 'none';
            return;
        }

        const today = new Date();
        const deadlineDate = new Date(deadline);
        const diffTime = deadlineDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 0) {
            deadlineNumber.textContent = diffDays;
            deadlineCounter.style.display = 'block';
            if (signupBtn) signupBtn.style.display = 'block';
        } else {
            deadlineCounter.style.display = 'none';
            if (signupBtn) signupBtn.style.display = 'none';
        }
    }

    updateDocuments(documents) {
        const container = document.getElementById('tabContentPlotFiles');
        const tabButton = document.getElementById('tabBtnBestanden');
        
        // Hide tab button if no documents
        if (tabButton) {
            tabButton.style.display = (!documents?.length) ? 'none' : 'block';
        }

        if (!container || !documents?.length) {
            if (container) {
                container.innerHTML = '<div class="no-documents">Geen documenten beschikbaar</div>';
            }
            return;
        }

        const documentsList = documents.map(doc => this.generateDocumentElement(doc)).join('');
        container.innerHTML = `
            <div class="documents-grid">
                ${documentsList}
            </div>
        `;
    }

    generateDocumentElement(doc) {
        const fileIcon = this.getFileIcon(doc.mime_type);
        const fileDate = new Date(doc.created_at).toLocaleDateString('nl-NL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return `
            <div class="document-item">
                <a href="${doc.original_url}" target="_blank" class="document-link">
                    <div class="document-icon">
                        ${fileIcon}
                    </div>
                    <div class="document-info">
                        <div class="document-name">${doc.name}</div>
                        <div class="document-meta">
                            <span class="document-date">${fileDate}</span>
                            <span class="document-type">${this.getFileExtension(doc.file_name)}</span>
                        </div>
                    </div>
                </a>
            </div>
        `;
    }

    getFileIcon(mimeType) {
        // Default icon for documents
        let icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
            <path d="M64 0C28.7 0 0 28.7 0 64V448c0 35.3 28.7 64 64 64H320c35.3 0 64-28.7 64-64V160H256c-17.7 0-32-14.3-32-32V0H64zM256 0V128H384L256 0zM64 224H88c30.9 0 56 25.1 56 56s-25.1 56-56 56H80v32c0 8.8-7.2 16-16 16s-16-7.2-16-16V240c0-8.8 7.2-16 16-16zm24 80c13.3 0 24-10.7 24-24s-10.7-24-24-24H80v48h8zm72-64c0-8.8 7.2-16 16-16h24c26.5 0 48 21.5 48 48v64c0 26.5-21.5 48-48 48H176c-8.8 0-16-7.2-16-16V240zm32 112h8c8.8 0 16-7.2 16-16V272c0-8.8-7.2-16-16-16h-8v96zm96-128h24c8.8 0 16 7.2 16 16s-7.2 16-16 16H304v32h24c8.8 0 16 7.2 16 16s-7.2 16-16 16H304v48c0 8.8-7.2 16-16 16s-16-7.2-16-16V240c0-8.8 7.2-16 16-16z"/>
        </svg>`;

        // Specific icons for different mime types
        if (mimeType === 'application/pdf') {
            icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                <path d="M64 464H96v48H64c-35.3 0-64-28.7-64-64V64C0 28.7 28.7 0 64 0H229.5c17 0 33.3 6.7 45.3 18.7l90.5 90.5c12 12 18.7 28.3 18.7 45.3V288H336V160H256c-17.7 0-32-14.3-32-32V48H64c-8.8 0-16 7.2-16 16V448c0 8.8 7.2 16 16 16zM176 352h32c30.9 0 56 25.1 56 56s-25.1 56-56 56H192v32c0 8.8-7.2 16-16 16s-16-7.2-16-16V368c0-8.8 7.2-16 16-16zm32 80c13.3 0 24-10.7 24-24s-10.7-24-24-24H192v48h16zm96-80h32c26.5 0 48 21.5 48 48v64c0 26.5-21.5 48-48 48H304c-8.8 0-16-7.2-16-16V368c0-8.8 7.2-16 16-16zm32 128c8.8 0 16-7.2 16-16V400c0-8.8-7.2-16-16-16H320v96h16zm80-112c0-8.8 7.2-16 16-16h24c26.5 0 48 21.5 48 48v64c0 26.5-21.5 48-48 48H432c-8.8 0-16-7.2-16-16V368zm32 112h8c8.8 0 16-7.2 16-16V400c0-8.8-7.2-16-16-16h-8v96z"/>
            </svg>`;
        }

        return icon;
    }

    getFileExtension(filename) {
        return filename.split('.').pop().toUpperCase();
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
                    <h3>Inschrijving</h3>
                </div>
                <div class="cb-detail-items">
                    ${this.generateDetailItem('Status', data.application_deadline_status?.name)}
                    ${this.generateDetailItem('Start inschrijving', data.application_open_date)}
                    ${this.generateDetailItem('Deadline inschrijving', data.application_deadline)}
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