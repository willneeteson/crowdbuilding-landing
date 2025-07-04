// Initialize plot details functionality
// This file depends on the shared MapManager from map.js

// Ensure MapManager is available before initializing
async function ensureMapManager() {
    if (typeof MapManager !== 'undefined') {
        return Promise.resolve();
    }
    
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = '/scripts/snippets/map.js';
        script.onload = () => {
            console.log('MapManager loaded successfully');
            resolve();
        };
        script.onerror = () => {
            console.error('Failed to load MapManager');
            reject(new Error('Failed to load MapManager'));
        };
        document.head.appendChild(script);
    });
}

class PlotDetailsManager {
    constructor() {
        this.plotData = null;
        this.mapManager = null;
        this.init();
    }

    async init() {
        try {
            await ensureMapManager();
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
        this.updateElement('#contentIntroduction', data.intro, true);
        
        // Update sidebar status
        this.updateSidebarStatus(data);
        
        // Update sidebar planning
        this.updateSidebarPlanning(data);
        
        // Update sidebar location
        this.updateSidebarLocation(data);
        
        // Update sidebar contact
        this.updateSidebarContact(data);

        // Update properties
        this.updateProperties(data);

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
        this.updateSignupProcedure(data.application_procedure);

        // Update external application button
        this.updateExternalApplicationButton(data);

        // Update arrays with max items
        this.updateArrayElement('.project-housing-forms', data.housing_forms, 'title');
        this.updateArrayElement('.project-target-audiences', data.target_audiences, 'name');
        this.updateArrayElement('.project-interests', data.interests, 'name');

        // Update images
        this.updateImages(data.images);

        // Update groups/projects related to this plot (using data from plot response)
        this.updatePlotGroups(data.groups || []);

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
        const container = document.getElementById('contentDescriptions');
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
        const signupBtnClosed = document.getElementById('plotSignupBtnClosed');
        const deadlineWrapper = document.getElementById('deadlineWrapper');
        
        console.log('Deadline data:', {
            deadline,
            deadlineCounter: !!deadlineCounter,
            deadlineNumber: !!deadlineNumber,
            signupBtn: !!signupBtn,
            signupBtnClosed: !!signupBtnClosed,
            deadlineWrapper: !!deadlineWrapper
        });

        if (!deadline) {
            console.log('No deadline provided');
            if (deadlineCounter) deadlineCounter.style.display = 'none';
            if (deadlineWrapper) deadlineWrapper.style.display = 'none';
            if (signupBtn) signupBtn.style.display = 'none';
            if (signupBtnClosed) signupBtnClosed.style.display = 'none';
            return;
        }

        const today = new Date();
        const deadlineDate = new Date(deadline);
        const diffTime = deadlineDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        console.log('Deadline calculation:', {
            today: today.toISOString(),
            deadlineDate: deadlineDate.toISOString(),
            diffDays
        });

        if (diffDays > 0) {
            console.log('Showing deadline counter');
            if (deadlineNumber) deadlineNumber.textContent = diffDays;
            if (deadlineCounter) deadlineCounter.style.display = 'block';
            if (signupBtn) signupBtn.style.display = 'block';
            if (signupBtnClosed) signupBtnClosed.style.display = 'none';
            if (deadlineWrapper) deadlineWrapper.style.display = 'flex';
        } else {
            console.log('Showing closed button - deadline passed');
            if (deadlineCounter) deadlineCounter.style.display = 'none';
            if (signupBtn) signupBtn.style.display = 'none';
            if (signupBtnClosed) signupBtnClosed.style.display = 'block';
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
            icon = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clip-path="url(#clip0_216_20)">
                    <path d="M2.5 18.75H4.375V20H2.5C1.12109 20 0 18.8789 0 17.5V2.5C0 1.12109 1.12109 0 2.5 0H8.59766C9.09375 0 9.57031 0.199219 9.92188 0.550781L14.4492 5.07422C14.8008 5.42578 15 5.90234 15 6.39844V11.875H13.75V7.5H9.375C8.33984 7.5 7.5 6.66016 7.5 5.625V1.25H2.5C1.80859 1.25 1.25 1.80859 1.25 2.5V17.5C1.25 18.1914 1.80859 18.75 2.5 18.75ZM13.7305 6.25C13.7031 6.14063 13.6484 6.03906 13.5664 5.96094L9.03906 1.43359C8.95703 1.35156 8.85937 1.29687 8.75 1.26953V5.625C8.75 5.96875 9.03125 6.25 9.375 6.25H13.7305ZM6.875 13.75H8.125C9.33203 13.75 10.3125 14.7305 10.3125 15.9375C10.3125 17.1445 9.33203 18.125 8.125 18.125H7.5V19.375C7.5 19.7188 7.21875 20 6.875 20C6.53125 20 6.25 19.7188 6.25 19.375V17.5V14.375C6.25 14.0312 6.53125 13.75 6.875 13.75ZM8.125 16.875C8.64453 16.875 9.0625 16.457 9.0625 15.9375C9.0625 15.418 8.64453 15 8.125 15H7.5V16.875H8.125ZM11.875 13.75H13.125C14.1602 13.75 15 14.5898 15 15.625V18.125C15 19.1602 14.1602 20 13.125 20H11.875C11.5312 20 11.25 19.7188 11.25 19.375V14.375C11.25 14.0312 11.5312 13.75 11.875 13.75ZM13.125 18.75C13.4688 18.75 13.75 18.4688 13.75 18.125V15.625C13.75 15.2812 13.4688 15 13.125 15H12.5V18.75H13.125ZM16.25 14.375C16.25 14.0312 16.5312 13.75 16.875 13.75H18.75C19.0938 13.75 19.375 14.0312 19.375 14.375C19.375 14.7188 19.0938 15 18.75 15H17.5V16.25H18.75C19.0938 16.25 19.375 16.5312 19.375 16.875C19.375 17.2188 19.0938 17.5 18.75 17.5H17.5V19.375C17.5 19.7188 17.2188 20 16.875 20C16.5312 20 16.25 19.7188 16.25 19.375V16.875V14.375Z" fill="#090F3F"/>
                </g>
                <defs>
                    <clipPath id="clip0_216_20">
                        <rect width="20" height="20" fill="white"/>
                    </clipPath>
                </defs>
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
        const statusElement = document.getElementById('projectDevelopmentForm');
        if (!statusElement) return;

        statusElement.textContent = data.application_deadline_status?.name || 'Vooraankondiging';
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
        const locationElement = document.getElementById('location');
        if (!locationElement) return;

        locationElement.textContent = data.location || 'Locatie niet bekend';
    }

    updateSidebarContact(data) {
        const providerTypeElement = document.getElementById('contactTypeAanbieder');
        const organizationElement = document.getElementById('contactOrganisatie');
        const contactPersonElement = document.getElementById('contactNaam');
        const contactEmailElement = document.getElementById('contactEmail');
        const contactPhoneElement = document.getElementById('contactTel');
        const websiteElement = document.getElementById('contactWebsite');

        if (!providerTypeElement || !organizationElement || !contactPersonElement || 
            !contactEmailElement || !contactPhoneElement || !websiteElement) return;

        providerTypeElement.textContent = data.type_of_provider || 'Type aanbieder';
        organizationElement.textContent = data.organisation || 'Organisatie';
        contactPersonElement.textContent = data.name || 'Naam';
        contactEmailElement.textContent = data.email || 'E-mailadres';
        contactPhoneElement.textContent = data.phone || 'Telefoonnummer';
        
        if (data.website) {
            try {
                const url = new URL(data.website);
                const displayUrl = url.hostname.replace(/^www\./, ''); // Remove www. if present
                websiteElement.innerHTML = `<a href="${data.website}" target="_blank">${displayUrl}</a>`;
            } catch (e) {
                // If URL parsing fails, show the original website
                websiteElement.innerHTML = `<a href="${data.website}" target="_blank">${data.website}</a>`;
            }
        } else {
            websiteElement.textContent = 'Website';
        }
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
            const faqStyles = `
                .faq-item {
                    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
                    margin-bottom: 12px;
                    overflow: hidden;
                }
                .faq-question {
                    padding: 16px 20px;
                    background: transparent;
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: background-color 0.2s ease;
                }
                .faq-icon {
                    width: 20px;
                    height: 20px;
                    position: relative;
                    transition: transform 0.3s ease;
                }
                .faq-icon::before,
                .faq-icon::after {
                    content: '';
                    position: absolute;
                    background: #333;
                    transition: transform 0.3s ease;
                }
                .faq-icon::before {
                    width: 2px;
                    height: 12px;
                    top: 4px;
                    left: 9px;
                }
                .faq-icon::after {
                    width: 12px;
                    height: 2px;
                    top: 9px;
                    left: 4px;
                }
                .faq-question.active .faq-icon::before {
                    transform: rotate(90deg);
                }
                .faq-answer {
                    padding: 0;
                    max-height: 0;
                    overflow: hidden;
                    transition: all 0.3s ease;
                }
                .faq-answer.active {
                    padding: 16px 20px;
                    max-height: 1000px;
                }
                .faq-answer-content {
                    line-height: 1.6;
                }
            `;

            // Add styles to document
            const styleSheet = document.createElement('style');
            styleSheet.textContent = faqStyles;
            document.head.appendChild(styleSheet);

            container.innerHTML = faqs.map((faq, index) => `
                <div class="faq-item">
                    <div class="faq-question" id="faq-question-${index}">
                        <span>${faq.data.title}</span>
                        <div class="faq-icon"></div>
                    </div>
                    <div class="faq-answer" id="faq-answer-${index}">
                        <div class="faq-answer-content">
                            ${faq.data.text}
                        </div>
                    </div>
                </div>
            `).join('');

            // Add click event listeners
            faqs.forEach((_, index) => {
                const question = document.getElementById(`faq-question-${index}`);
                const answer = document.getElementById(`faq-answer-${index}`);
                
                if (question && answer) {
                    question.addEventListener('click', () => {
                        const isActive = question.classList.contains('active');
                        
                        // Close all other FAQs
                        document.querySelectorAll('.faq-question.active').forEach(q => {
                            if (q !== question) {
                                q.classList.remove('active');
                                q.nextElementSibling.classList.remove('active');
                            }
                        });

                        // Toggle current FAQ
                        question.classList.toggle('active');
                        answer.classList.toggle('active');
                    });
                }
            });

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

        // Hide map container if location data is not available
        if (!this.plotData?.latitude || !this.plotData?.longitude) {
            mapContainer.style.display = 'none';
            return;
        }

        // Use the shared MapManager instead of PlotMapManager
        this.mapManager = new MapManager('innerMap', {
            center: [this.plotData.longitude, this.plotData.latitude],
            zoom: 14,
            minZoom: 6,
            maxZoom: 18,
            disableScrollZoom: true,
            enableTouchControls: true,
            enableResizeHandler: true,
            enableNavigationControl: false,
            autoCenterOnData: false
        });

        // Create a single marker for the plot
        const plotFeature = {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [this.plotData.longitude, this.plotData.latitude],
            },
            properties: {
                id: this.plotData.id || 'plot-marker',
                title: this.plotData.title,
                description: this.plotData.subtitle || "Plot location",
                image: this.plotData.image?.original_url || "https://cdn.prod.website-files.com/66dffceb975388322f140196/67bcaf8a62d1172be49c4000_e21844b19f5eee45e161d9c34c5fc437_cb_placeholder.jpg",
                popupHTML: this.generatePlotPopupHTML(),
                className: 'plot-marker',
                popupClassName: 'plot-popup'
            },
        };

        // Wait for map to be ready before adding marker
        const handleMapReady = () => {
            // Add a small delay to ensure map is fully rendered
            setTimeout(() => {
                this.mapManager.addMarkers([plotFeature], {
                    className: 'plot-marker',
                    popupClassName: 'plot-popup',
                    popupOffset: 25
                });
            }, 100);
        };

        // Listen for the mapReady event
        mapContainer.addEventListener('mapReady', handleMapReady, { once: true });
        
        // Fallback: if mapReady event doesn't fire, try after a delay
        setTimeout(() => {
            if (this.mapManager && this.mapManager.map && this.mapManager.map.isStyleLoaded()) {
                handleMapReady();
            }
        }, 2000);
    }

    generatePlotPopupHTML() {
        return `
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
        `;
    }

    updateSignupProcedure(signupProcedure) {
        console.log('Signup procedure data:', signupProcedure);
        const container = document.getElementById('tabContentPlotInschrijfprocedure');
        const tabButton = document.getElementById('tabBtnInschrijfprocedure');
        const contentElement = document.getElementById('contentInschrijfprocedure');
        
        console.log('Found elements:', {
            container: !!container,
            tabButton: !!tabButton,
            contentElement: !!contentElement
        });
        
        // Hide tab button if no signup procedure
        if (tabButton) {
            tabButton.style.display = (!signupProcedure) ? 'none' : 'inline-block';
        }

        // Update the main content element if it exists
        if (contentElement && signupProcedure) {
            contentElement.innerHTML = signupProcedure;
            contentElement.style.display = 'block';
            console.log('Updated contentInschrijfprocedure with HTML content');
        } else if (contentElement) {
            contentElement.style.display = 'none';
        }

        // Update the tab container if it exists
        if (container && signupProcedure) {
            const content = `
                <div class="w-richtext">
                    ${signupProcedure}
                </div>
            `;
            container.innerHTML = content;
            container.style.display = 'block';
            console.log('Updated tabContentPlotInschrijfprocedure with HTML content');
        } else if (container) {
            container.style.display = 'none';
        }
    }

    updateProperties(data) {
        // Type aanbod
        const typeAanbodElement = document.getElementById('propertiesTypeAanbod');
        if (typeAanbodElement) {
            console.log('Type aanbod data:', data.offer_type);
            typeAanbodElement.textContent = data.offer_type?.name || 'Type aanbod';
            // Also update the parent element's visibility
            const parentElement = typeAanbodElement.closest('.project__sidebar-list-item');
            if (parentElement) {
                parentElement.style.display = data.offer_type?.name ? 'flex' : 'none';
            }
        }

        // Bebouwingstype
        const bebouwingstypeElement = document.getElementById('propertiesBebouwingstype');
        if (bebouwingstypeElement) {
            bebouwingstypeElement.textContent = data.building_type?.name || 'Bebouwingstype';
        }

        // Eigendomstype
        const eigendomstypeElement = document.getElementById('propertiesEigendomstype');
        if (eigendomstypeElement) {
            eigendomstypeElement.textContent = data.property_type || 'Eigendomstype';
        }

        // Woonmilieu
        const woonmilieuElement = document.getElementById('propertiesWoonmillieu');
        if (woonmilieuElement) {
            woonmilieuElement.textContent = data.living_environment?.name || 'Woonmilieu';
        }

        // Aantal woningen
        const aantalWoningenElement = document.getElementById('propertiesAantalWoningen');
        if (aantalWoningenElement) {
            aantalWoningenElement.textContent = data.number_of_homes ? `${data.number_of_homes} woningen` : 'Aantal woningen';
        }

        // Minimum aantal woningen
        const minAantalWoningenElement = document.getElementById('propertiesMinimumAantalWoningen');
        if (minAantalWoningenElement) {
            minAantalWoningenElement.textContent = data.min_number_of_homes ? `${data.min_number_of_homes} woningen` : 'Minimum aantal woningen';
        }

        // Maximum aantal woningen
        const maxAantalWoningenElement = document.getElementById('propertiesMaximumAantalWoningen');
        if (maxAantalWoningenElement) {
            maxAantalWoningenElement.textContent = data.max_number_of_homes ? `${data.max_number_of_homes} woningen` : 'Maximum aantal woningen';
        }

        // Minimum prijs
        const minPrijsElement = document.getElementById('propertiesMinimumPrijs');
        if (minPrijsElement) {
            minPrijsElement.textContent = data.min_price ? `€${data.min_price.toLocaleString('nl-NL')}` : 'Minimum prijs';
        }

        // Maximum prijs
        const maxPrijsElement = document.getElementById('propertiesMaximumPrijs');
        if (maxPrijsElement) {
            maxPrijsElement.textContent = data.max_price ? `€${data.max_price.toLocaleString('nl-NL')}` : 'Maximum prijs';
        }

        // Oppervlakte locatie
        const oppervlakteLocatieElement = document.getElementById('propertiesOppervlakteLocatie');
        if (oppervlakteLocatieElement) {
            oppervlakteLocatieElement.textContent = data.surface_area ? `${data.surface_area} m²` : 'Oppervlakte locatie';
        }

        // Bebouwbaar oppervlakte
        const bebouwbaarOppervlakteElement = document.getElementById('propertiesBebouwbaarOppervlakte');
        if (bebouwbaarOppervlakteElement) {
            bebouwbaarOppervlakteElement.textContent = data.buildable_surface_area ? `${data.buildable_surface_area} m²` : 'Bebouwbaar oppervlakte';
        }

        // Maximum realiseerbaar woonoppervlakte
        const maxWoonoppervlakteElement = document.getElementById('propertiesMaximumRealiseerbaarWoonoppervlakte');
        if (maxWoonoppervlakteElement) {
            maxWoonoppervlakteElement.textContent = data.maximum_realizable_living_area ? `${data.maximum_realizable_living_area} m²` : 'Maximum realiseerbaar woonoppervlakte';
        }

        // Hide elements that don't have data
        const elements = [
            { element: bebouwingstypeElement, data: data.building_type?.name },
            { element: eigendomstypeElement, data: data.property_type },
            { element: woonmilieuElement, data: data.living_environment?.name },
            { element: aantalWoningenElement, data: data.number_of_homes },
            { element: minAantalWoningenElement, data: data.min_number_of_homes },
            { element: maxAantalWoningenElement, data: data.max_number_of_homes },
            { element: minPrijsElement, data: data.min_price },
            { element: maxPrijsElement, data: data.max_price },
            { element: oppervlakteLocatieElement, data: data.surface_area },
            { element: bebouwbaarOppervlakteElement, data: data.buildable_surface_area },
            { element: maxWoonoppervlakteElement, data: data.maximum_realizable_living_area }
        ];

        elements.forEach(({ element, data }) => {
            if (element) {
                const parentElement = element.closest('.project__sidebar-list-item');
                if (parentElement) {
                    parentElement.style.display = data ? 'flex' : 'none';
                }
            }
        });
    }

    updatePlotGroups(groups) {
        const container = document.getElementById('plotGroupsContainer');
        const tabButton = document.getElementById('tabBtnProjects');
        
        // Hide tab button if no groups
        if (tabButton) {
            tabButton.style.display = (!groups || groups.length === 0) ? 'none' : 'inline-block';
        }
        
        if (!container) {
            console.log('Plot groups container not found');
            return;
        }

        if (!groups || groups.length === 0) {
            container.style.display = 'none';
            return;
        }

        const groupsHTML = groups.map(group => `
            <a href="/groups/${group.id}" class="plot-group-item">
                <div class="card__content-wrapper">
                    <h3>
                        <span class="plot-group-link">${group.title}</span>
                    </h3>
                    ${group.subtitle ? `<p>${group.subtitle}</p>` : ''}
                    ${group.intro ? `<div class="plot-group-intro">${group.intro}</div>` : ''}
                    ${group.location ? `<p>${group.location}</p>` : ''}
                    ${group.member_status ? `<p>${group.member_status.name}</p>` : ''}
                    ${group.housing_forms?.length ? `
                        <div class="plot-group-tags">
                            ${group.housing_forms.map(form => `<span class="tag">${form.title}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
                ${group.image ? `
                    <div class="card__img-wrapper">
                        <img src="${group.image.original_url}" alt="${group.title}" class="card__img">
                    </div>
                ` : ''}
            </a>
        `).join('');

        container.innerHTML = `
                <div class="plot-groups-list">
                    ${groupsHTML}
                </div>
        `;

        // Add styles for plot groups
        this.addPlotGroupsStyles();

        container.style.display = 'block';
    }

    addPlotGroupsStyles() {
        // Check if styles already exist
        if (document.getElementById('plot-groups-styles')) {
            return;
        }

        const styles = document.createElement('style');
        styles.id = 'plot-groups-styles';
        styles.textContent = `
            .plot-groups-list {
                display: flex;
                flex-direction: column;
                gap: 24px;
            }

            .plot-group-item {
                display: grid;
                grid-template-columns: 1fr 150px;
                gap: 24px;
                align-items: center;
                padding: 24px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                transition: transform 0.2s ease, box-shadow 0.2s ease;
                text-decoration: none;
                border: 1px solid #e0e0e0;
                color: var(--_color---color-neutral-black-100);
            }

            .plot-group-item:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.15);
            }

            .plot-group-subtitle {
                margin: 0 0 8px 0;
                font-size: 16px;
                color: #666;
                line-height: 1.5;
            }

            .plot-group-intro {
                margin: 0 0 12px 0;
                font-size: 14px;
                line-height: 1.6;
            }

            .plot-group-status {
                margin: 0 0 12px 0;
                font-size: 14px;
                font-weight: 500;
                color: #e74c3c;
            }

            .plot-group-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }

            .plot-group-tags .tag {
                padding: 4px 8px;
                background: #f0f0f0;
                border-radius: 99px;
                font-size: 12px;
                color: #666;
                border: 1px solid #ddd;
            }

            .plot-group-image-wrapper {
                width: 150px;
                height: 110px;
                border-radius: 4px;
                overflow: hidden;
                position: relative;
            }

            .plot-group-image {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.2s ease;
            }

            .plot-group-item:hover .plot-group-image {
                transform: scale(1.05);
            }

            @media (max-width: 768px) {
                .plot-group-item {
                    grid-template-columns: 1fr;
                    gap: 16px;
                }

                .plot-group-image-wrapper {
                    width: 100%;
                    height: 200px;
                }
            }
        `;

        document.head.appendChild(styles);
    }

    updateExternalApplicationButton(data) {
        const signupBtn = document.getElementById('plotSignupBtn');
        const signupBtnClosed = document.getElementById('plotSignupBtnClosed');
        
        console.log('Looking for plot signup buttons:', {
            signupBtnFound: !!signupBtn,
            signupBtnClosedFound: !!signupBtnClosed,
            currentHref: signupBtn?.href,
            currentText: signupBtn?.textContent,
            currentDisplay: signupBtn?.style.display
        });
        
        if (!signupBtn) {
            console.warn('plotSignupBtn element not found in DOM');
            return;
        }

        // Check if deadline has passed
        const deadline = data.application_deadline;
        if (deadline) {
            const today = new Date();
            const deadlineDate = new Date(deadline);
            const diffTime = deadlineDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays <= 0) {
                // Deadline has passed - show closed button, hide regular button
                if (signupBtn) signupBtn.style.display = 'none';
                if (signupBtnClosed) signupBtnClosed.style.display = 'block';
                console.log('Deadline has passed, showing closed button');
                return;
            }
        }

        // Deadline hasn't passed or no deadline - proceed with regular button logic
        if (signupBtnClosed) signupBtnClosed.style.display = 'none';

        console.log('Application type data:', {
            applicationType: data.application_type,
            applicationTypeName: data.application_type?.name,
            website: data.website
        });

        // Hide button if application_type is null or not set
        if (!data.application_type || !data.application_type.name) {
            signupBtn.style.display = 'none';
            console.log('Application type is null or not set, hiding button');
            return;
        }

        // Check application type and configure button accordingly
        if (data.application_type.name === "Externe inschrijving") {
            // External application - use website from API
            if (data.website) {
                signupBtn.href = data.website;
                signupBtn.target = '_blank';
                signupBtn.rel = 'noopener noreferrer';
                signupBtn.style.display = 'block';
                signupBtn.textContent = 'Externe inschrijving';
                
                console.log('External application button configured:', {
                    href: signupBtn.href,
                    target: signupBtn.target,
                    display: signupBtn.style.display,
                    textContent: signupBtn.textContent
                });
            } else {
                // Hide button if no website is available
                signupBtn.style.display = 'none';
                console.log('External application type but no website available, hiding button');
            }
        } else if (data.application_type.name === "Officiële inschrijving") {
            signupBtn.href = 'https://plot.crowdbuilding.com';
            signupBtn.target = '_blank';
            signupBtn.rel = 'noopener noreferrer';
            signupBtn.style.display = 'block';
            signupBtn.textContent = 'Officiële inschrijving';
            
            console.log('Official application button configured:', {
                href: signupBtn.href,
                target: signupBtn.target,
                display: signupBtn.style.display,
                textContent: signupBtn.textContent
            });
        } else {
            // Hide button if no valid application type is available
            signupBtn.style.display = 'none';
            console.log('No valid application type available, hiding button');
        }
    }
}

 // Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => new PlotDetailsManager()); 