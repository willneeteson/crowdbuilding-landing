// Initialize plot details functionality
class PlotDetailsManager {
    constructor() {
        this.plotData = null;
        this.mapManager = null;
        this.init();
    }

    async init() {
        try {
            await this.fetchPlotData();
            this.initializeMap();
        } catch (error) {
            console.error('Error initializing plot details:', error);
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

    updatePageElements(data) {
        // Update basic elements
        this.updateElement('.project-title', data.title);
        this.updateElement('.project-subtitle', data.subtitle);
        this.updateElement('.project-intro', data.intro, true);
        
        // Update sidebar status
        this.updateSidebarStatus(data);
        
        // Update sidebar planning
        this.updateSidebarPlanning(data);
        
        // Update sidebar location
        this.updateSidebarLocation(data);
        
        // Update sidebar contact
        this.updateSidebarContact(data);

        // Update details section
        this.updateDetailsSection(data);

        // Update deadline counter
        this.updateDeadlineCounter(data.application_deadline);

        // Update documents
        this.updateDocuments(data.documents);

        // Update descriptions
        if (data.info) {
            this.updateDescriptions(data.info);
        }

        // Update FAQs
        if (data.faqs) {
            this.updateFAQs(data.faqs);
        }

        // Update signup procedure
        this.updateSignupProcedure(data.signup_procedure);

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
            element.style.display = 'inline-block';
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
            container.style.display = 'inline-block';
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
        const signupBtn = document.getElementById('plotSignupBtn');
        const deadlineWrapper = document.getElementById('deadlineWrapper');
        
        if (!deadlineCounter || !deadlineNumber || !deadline) {
            if (deadlineCounter) deadlineCounter.style.display = 'none';
            if (deadlineWrapper) deadlineWrapper.style.display = 'none';
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
            if (deadlineWrapper) deadlineWrapper.style.display = 'block';
        } else {
            deadlineCounter.style.display = 'none';
            if (signupBtn) signupBtn.style.display = 'none';
            if (deadlineWrapper) deadlineWrapper.style.display = 'none';
        }
    }

    updateDocuments(documents) {
        const container = document.getElementById('tabContentPlotFiles');
        const tabButton = document.getElementById('tabBtnBestanden');
        
        // Hide tab button if no documents
        if (tabButton) {
            tabButton.style.display = (!documents?.length) ? 'none' : 'inline-block';
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

    updateDetailsSection(data) {
        const detailsWrapper = document.querySelector('.project__sidebar-group.details .project__sidebar-details-list');
        if (!detailsWrapper) return;

        detailsWrapper.innerHTML = `
            <div class="cb-details-grid">
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

                ${data.faqs?.length ? `
                    <div class="section-header">
                        <h3>Veelgestelde vragen</h3>
                    </div>
                    <div class="cb-detail-items">
                        ${data.faqs.map((faq, index) => `
                            <div>
                                <div data-hover="false" data-delay="0" class="dropdown w-dropdown">
                                    <div class="dropdown-toggle-2 w-dropdown-toggle" id="w-dropdown-toggle-${index + 1}" 
                                        aria-controls="w-dropdown-list-${index + 1}" aria-haspopup="menu" 
                                        aria-expanded="false" role="button" tabindex="0">
                                        <div class="icon-3 w-icon-dropdown-toggle" aria-hidden="true"></div>
                                        <div class="text-block-6">${faq.data.title}</div>
                                    </div>
                                    <nav class="dropdown-list-2 w-dropdown-list" id="w-dropdown-list-${index + 1}" 
                                        aria-labelledby="w-dropdown-toggle-${index + 1}">
                                        <div class="w-richtext">
                                            ${faq.data.text}
                                        </div>
                                    </nav>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    updateSidebarStatus(data) {
        const statusWrapper = document.querySelector('.project__sidebar-group.status .project__sidebar-details-list');
        if (!statusWrapper) return;

        statusWrapper.innerHTML = `
            <div class="project__sidebar-list-item">
                <div class="project__detail-item project__detail-item--status">${data.application_deadline_status?.name || 'Vooraankondiging'}</div>
            </div>
        `;
    }

    updateSidebarPlanning(data) {
        const openDateElement = document.getElementById('deadlineOpen');
        const deadlineElement = document.getElementById('deadlineClose');
        
        if (!openDateElement || !deadlineElement) return;

        const openDate = data.application_open_date ? new Date(data.application_open_date).toLocaleDateString('nl-NL') : 'Nog niet bekend';
        const deadline = data.application_deadline ? new Date(data.application_deadline).toLocaleDateString('nl-NL') : 'Nog niet bekend';

        openDateElement.textContent = openDate;
        deadlineElement.textContent = deadline;
    }

    updateSidebarLocation(data) {
        const locationWrapper = document.querySelector('.project__sidebar-group.locatie .project__sidebar-list-item');
        if (!locationWrapper) return;

        const address = data.address || {};
        locationWrapper.innerHTML = `
            <div class="project-phase">
                ${address.street || ''} ${address.house_number || ''}<br>
                ${address.postal_code || ''}<br>
                ${address.city || ''}
            </div>
        `;
    }

    updateSidebarContact(data) {
        const contactWrapper = document.querySelector('.project__sidebar-group.contact .project__sidebar-details-list');
        if (!contactWrapper) return;

        contactWrapper.innerHTML = `
            <div class="project__sidebar-list-item">
                <div class="project__detail-item project__detail-item--provider-type">${data.provider_type?.name || 'Type aanbieder'}</div>
            </div>
            <div class="project__sidebar-list-item">
                <div class="project__detail-item project__detail-item--organization">${data.organization || 'Organisatie'}</div>
            </div>
            <div class="project__sidebar-list-item">
                <div class="project__detail-item project__detail-item--contact-person">${data.contact_person || 'Naam'}</div>
            </div>
            <div class="project__sidebar-list-item">
                <div class="project__detail-item project__detail-item--contact-email">${data.contact_email || 'E-mailadres'}</div>
            </div>
            <div class="project__sidebar-list-item">
                <div class="project__detail-item project__detail-item--contact-phone">${data.contact_phone || 'Telefoonnummer'}</div>
            </div>
            <div class="project__sidebar-list-item">
                <div class="project__detail-item project__detail-item--website">${data.website ? `<a href="${data.website}" target="_blank">${data.website}</a>` : 'Website'}</div>
            </div>
        `;
    }

    updateFAQs(faqs) {
        const container = document.getElementById('tabContentPlotFAQ');
        const tabButton = document.getElementById('tabBtnFAQ');
        
        // Hide tab button if no FAQs
        if (tabButton) {
            tabButton.style.display = (!faqs?.length) ? 'none' : 'inline-block';
        }

        if (!container) return;

        if (faqs?.length) {
            container.innerHTML = faqs.map((faq, index) => `
                <div>
                    <div data-hover="false" data-delay="0" class="dropdown w-dropdown">
                        <div class="dropdown-toggle-2 w-dropdown-toggle" id="w-dropdown-toggle-${index + 1}" 
                            aria-controls="w-dropdown-list-${index + 1}" aria-haspopup="menu" 
                            aria-expanded="false" role="button" tabindex="0">
                            <div class="icon-3 w-icon-dropdown-toggle" aria-hidden="true"></div>
                            <div class="text-block-6">${faq.data.title}</div>
                        </div>
                        <nav class="dropdown-list-2 w-dropdown-list" id="w-dropdown-list-${index + 1}" 
                            aria-labelledby="w-dropdown-toggle-${index + 1}">
                            <div class="w-richtext">
                                ${faq.data.text}
                            </div>
                        </nav>
                    </div>
                </div>
            `).join('');
            container.style.display = 'block';
        } else {
            container.style.display = 'none';
        }
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

    initializeMap() {
        const mapContainer = document.getElementById('innerMap');
        if (!mapContainer) return;

        this.mapManager = new PlotMapManager(mapContainer, this.plotData);
    }

    updateSignupProcedure(signupProcedure) {
        const container = document.getElementById('tabContentPlotInschrijfprocedure');
        const tabButton = document.getElementById('tabBtnInschrijfprocedure');
        
        // Hide tab button if no signup procedure
        if (tabButton) {
            tabButton.style.display = (!signupProcedure) ? 'none' : 'inline-block';
        }

        if (!container) return;

        if (signupProcedure) {
            container.innerHTML = `
                <div class="w-richtext">
                    ${signupProcedure}
                </div>
            `;
            container.style.display = 'block';
        } else {
            container.style.display = 'none';
        }
    }
}

class PlotMapManager {
    constructor(container, plotData) {
        this.map = null;
        this.container = container;
        this.plotData = plotData;
        this.marker = null;
        this.init();
    }

    init() {
        if (!this.container || !this.plotData?.latitude || !this.plotData?.longitude) return;

        mapboxgl.accessToken = 'pk.eyJ1Ijoid2lsbG5lZXRlc29uIiwiYSI6ImNtMDJpZGM0eTAxbmkyanF1bTI2ZDByczQifQ.irtx4lkDC9cUXHtRIgBJVg';
        
        this.map = new mapboxgl.Map({
            container: this.container,
            style: 'mapbox://styles/willneeteson/cm02jz7we007b01r6d69f99cq',
            center: [this.plotData.longitude, this.plotData.latitude],
            zoom: 14,
            minZoom: 6,
            maxZoom: 18,
            language: 'nl',
            localize: true,
            zoomAnimationOptions: { duration: 300 },
            pitchWithRotate: false,
            dragRotate: false,
            touchZoomRotate: false
        });

        this.setupMapControls();
        this.createMarker();
    }

    setupMapControls() {
        this.map.scrollZoom.disable();
        this.setupTouchControls();
    }

    setupTouchControls() {
        let isPinching = false;
        const canvas = this.map.getCanvas();

        canvas.addEventListener('wheel', (event) => {
            if (event.ctrlKey) {
                this.map.scrollZoom.enable();
            } else {
                this.map.scrollZoom.disable();
            }
        });

        canvas.addEventListener('touchstart', (event) => {
            if (event.touches.length === 2) {
                isPinching = true;
                this.map.scrollZoom.enable();
            }
        });

        canvas.addEventListener('touchend', () => {
            isPinching = false;
            this.map.scrollZoom.disable();
        });

        canvas.addEventListener('touchmove', (event) => {
            if (event.touches.length !== 2) {
                isPinching = false;
                this.map.scrollZoom.disable();
            }
        });
    }

    createMarker() {
        const markerElement = document.createElement('div');
        markerElement.className = 'plot-marker';

        const popup = new mapboxgl.Popup({
            offset: 25,
            closeButton: true,
            maxWidth: '300px',
            className: 'plot-popup',
            closeOnClick: false
        }).setHTML(`
            <div class="plot__popup">
                ${this.plotData.image ? `<img src="${this.plotData.image.original_url}" alt="${this.plotData.title}" class="plot__popup-img"/>` : ''}
                <div class="plot__popup-content">
                    <h4>${this.plotData.title}</h4>
                    ${this.plotData.subtitle ? `<p>${this.plotData.subtitle}</p>` : ''}
                    ${this.plotData.address ? `
                        <div class="plot__popup-address">
                            ${this.plotData.address.street} ${this.plotData.address.house_number}<br>
                            ${this.plotData.address.postal_code} ${this.plotData.address.city}
                        </div>
                    ` : ''}
                </div>
            </div>
        `);

        this.marker = new mapboxgl.Marker({
            element: markerElement,
            anchor: 'center'
        })
            .setLngLat([this.plotData.longitude, this.plotData.latitude])
            .setPopup(popup)
            .addTo(this.map);
    }

    destroy() {
        if (this.marker) {
            this.marker.remove();
        }
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
    }
}

// Add styles for plot map and marker
const plotMapStyles = document.createElement('style');
plotMapStyles.textContent = `
    .plot-marker {
        width: 24px;
        height: 24px;
        background: #e74c3c;
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        transition: transform 0.2s;
    }

    .plot-marker:hover {
        transform: scale(1.1);
    }

    .plot-popup .mapboxgl-popup-content {
        padding: 0;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        min-width: 250px;
    }

    .plot-popup .mapboxgl-popup-close-button {
        padding: 8px;
        font-size: 16px;
        color: #666;
        background: white;
        border-radius: 50%;
        margin: 8px;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .plot-popup .mapboxgl-popup-close-button:hover {
        background: #f5f5f5;
        color: #333;
    }

    .plot__popup {
        position: relative;
    }

    .plot__popup-img {
        width: 100%;
        height: 150px;
        object-fit: cover;
    }

    .plot__popup-content {
        padding: 16px;
    }

    .plot__popup-content h4 {
        margin: 0 0 8px 0;
        font-size: 16px;
        line-height: 1.4;
    }

    .plot__popup-content p {
        margin: 0 0 8px 0;
        font-size: 14px;
        line-height: 1.5;
        color: #666;
    }

    .plot__popup-address {
        font-size: 14px;
        line-height: 1.5;
        color: #666;
    }

    #innerMap {
        width: 100%;
        height: 100%;
        min-height: 400px;
    }
`;
document.head.appendChild(plotMapStyles);

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => new PlotDetailsManager()); 