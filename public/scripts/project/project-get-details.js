// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Wait for modal system to be ready
        const modalSystem = await window.waitForModalSystem();
        
        // Get project ID from URL
        const pathParts = window.location.pathname.split('/');
        const projectId = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];

        if (!projectId) {
            console.error('No project ID found in URL');
            return;
        }

        // Create the project details modal
        modalSystem.createModal('Project Kenmerken', '', { id: 'projectDetailsModal' });

        // Fetch project data
        fetch(`https://api.crowdbuilding.com/api/v1/groups/${projectId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(response => {
                const data = response.data;
                
                // Store data globally
                window.projectData = data;
                console.log('Project data stored:', data);

                // Update page elements with project data
                updatePageElements(data);

                // Add click handler for modal
                setupModalHandler();

                // Initialize admin display
                if (typeof window.fetchAdminsData === 'function') {
                    window.fetchAdminsData();
                }
            })
            .catch(error => {
                console.error('Error fetching project data:', error);
            });
    } catch (error) {
        console.error('Error initializing project details:', error);
    }
});

function updateDescriptions(descriptions) {
    const container = document.querySelector('.project-descriptions');
    if (!container) return;

    if (descriptions && descriptions.length > 0) {
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

function updatePageElements(data) {
    // Update basic elements
    updateElement('.project-title', data.title);
    updateElement('.project-subtitle', data.subtitle);
    updateElement('.project-intro', data.intro, true);
    updateElement('.project-location', data.location);
    updateElement('.project-phase', data.phase?.name);
    updateElement('.project-development-form', data.development_form?.name);
    updateElement('.project-homes-count', data.number_of_homes);
    updateElement('.project-member-status', data.member_status?.name);

    // Update descriptions if they exist
    if (data.info) {
        updateDescriptions(data.info);
    }

    // Update arrays with max items
    updateArrayElement('.project-housing-forms', data.housing_forms, 'title');
    updateArrayElement('.project-target-audiences', data.target_audiences, 'name');
    updateArrayElement('.project-interests', data.interests, 'name');

    // Update images if they exist
    if (data.images && data.images.length > 0) {
        const gallery = document.getElementById('gallery');
        if (gallery) {
            gallery.innerHTML = data.images
                .map(image => `<img src="${image.conversions?.thumb?.url || image.original_url}" alt="${image.name}" class="project-image">`)
                .join('');
        }
    }
}

function updateElement(selector, value, isHTML = false) {
    const element = document.querySelector(selector);
    if (element && value) {
        if (isHTML) {
            element.innerHTML = value;
        } else {
            element.textContent = value;
        }
        element.style.display = 'block';
    } else if (element) {
        element.style.display = 'none';
    }
}

function updateArrayElement(selector, array, property) {
    const container = document.querySelector(selector);
    if (!container) return;

    if (array && array.length > 0) {
        const maxItems = 3;
        const displayItems = array.slice(0, maxItems);
        const remainingCount = Math.max(0, array.length - maxItems);

        container.innerHTML = displayItems.map(item => 
            `<div class="tag">${item[property]}</div>`
        ).join('') + (remainingCount > 0 ? `<div class="remaining-count">+${remainingCount}</div>` : '');
    } else {
        container.style.display = 'none';
    }
}

function setupModalHandler() {
    // Add click handler to details group and all its children
    document.addEventListener('click', function(e) {
        // Check if the clicked element or any of its parents have the details class
        const detailsGroup = e.target.closest('.project__sidebar-group.details');
        if (detailsGroup) {
            console.log('Details group or child clicked');
            e.preventDefault();
            showModal();
        }
    });
}

function showModal() {
    console.log('showModal called');
    const data = window.projectData;
    if (!data) {
        console.error('No project data available');
        return;
    }

    // Create modal content
    const content = `
        <div class="cb-details-grid">
            <div class="section-header">
                <h3>KENMERKEN</h3>
            </div>
            <div class="cb-detail-item">
                <h4>Plaats</h4>
                <span>${data.location || 'Niet gespecificeerd'}</span>
            </div>
            <div class="cb-detail-item">
                <h4>Projectfase</h4>
                <span>${data.phase?.name || 'Niet gespecificeerd'}</span>
            </div>
            <div class="cb-detail-item">
                <h4>Ontwikkelvorm</h4>
                <span>${data.development_form?.name || 'Niet gespecificeerd'}</span>
            </div>
            <div class="cb-detail-item">
                <h4>Status</h4>
                <span>${data.member_status?.name || 'Niet gespecificeerd'}</span>
            </div>
            <div class="cb-detail-item">
                <h4>Grootte</h4>
                <span>${data.number_of_homes || 'Niet gespecificeerd'} woningen</span>
            </div>
            <div class="cb-detail-item">
                <h4>Woonmilieu</h4>
                <span>${data.living_environment?.name || 'Niet gespecificeerd'}</span>
            </div>
            ${data.target_audiences && data.target_audiences.length > 0 ? `
                <div class="cb-detail-item full-width">
                    <h4>Doelgroepen</h4>
                    <div class="tags-list">
                        ${data.target_audiences.map(audience => `<div class="tag">${audience.name}</div>`).join('')}
                    </div>
                </div>
            ` : ''}
            ${data.housing_forms && data.housing_forms.length > 0 ? `
                <div class="cb-detail-item full-width">
                    <h4>Woonvormen</h4>
                    <div class="tags-list">
                        ${data.housing_forms.map(form => `<div class="tag">${form.title}</div>`).join('')}
                    </div>
                </div>
            ` : ''}

            <div class="section-header">
                <h3>CONTACT INFORMATIE</h3>
            </div>
            <div class="cb-detail-item">
                <h4>Naam contact persoon</h4>
                <span>${data.contact_person || 'Niet gespecificeerd'}</span>
            </div>
            <div class="cb-detail-item">
                <h4>E-mail adres</h4>
                <span>${data.contact_email || 'Niet gespecificeerd'}</span>
            </div>
            <div class="cb-detail-item">
                <h4>Website</h4>
                <span>${data.website ? `<a href="${data.website}" target="_blank">${data.website}</a>` : 'Niet gespecificeerd'}</span>
            </div>
        </div>
    `;

    // Get the modal element and add the project-details-modal class
    const modal = document.getElementById('projectDetailsModal');
    if (modal) {
        modal.classList.add('project-details-modal');
    }

    // Update modal content and show it
    window.modalSystem.updateModalContent('projectDetailsModal', content);
    window.modalSystem.showModal('projectDetailsModal');
} 