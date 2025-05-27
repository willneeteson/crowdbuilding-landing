// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    // Add modal styles
    const modalStyles = `
        .members-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        .members-modal .modal-content {
            background: white;
            padding: 20px;
            border-radius: 8px;
            max-width: 600px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
        }
        .members-modal .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        .members-modal .close-modal {
            cursor: pointer;
            font-size: 24px;
            padding: 5px;
        }
        .members-modal .details-grid {
            display: grid;
            gap: 15px;
        }
        .members-modal .detail-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            background: #f5f5f5;
            border-radius: 4px;
        }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = modalStyles;
    document.head.appendChild(styleSheet);

    // Create modal if it doesn't exist
    if (!document.getElementById('projectDetailsModal')) {
        const modalHTML = `
            <div id="projectDetailsModal" class="members-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Project Details</h3>
                        <span class="close-modal">×</span>
                    </div>
                    <div class="modal-body">
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // Get project ID from URL
    const pathParts = window.location.pathname.split('/');
    const projectId = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];

    if (!projectId) {
        console.error('No project ID found in URL');
        return;
    }

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
        })
        .catch(error => {
            console.error('Error fetching project data:', error);
        });
});

function updatePageElements(data) {
    // Update basic elements
    updateElement('.project-title', data.title);
    updateElement('.project-subtitle', data.subtitle);
    updateElement('.project-intro', data.intro);
    updateElement('.project-location', data.location);
    updateElement('.project-phase', data.phase?.name);
    updateElement('.project-development-form', data.development_form?.name);
    updateElement('.project-homes-count', data.number_of_homes);
    updateElement('.project-member-status', data.member_status?.name);

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

function updateElement(selector, value) {
    const element = document.querySelector(selector);
    if (element && value) {
        element.textContent = value;
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
        container.style.display = 'block';
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

    // Add close handlers
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal();
        });
    });

    // Close modal when clicking outside
    const modal = document.getElementById('projectDetailsModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });

        // Add escape key handler
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.style.display === 'flex') {
                closeModal();
            }
        });
    }
}

function showModal() {
    console.log('showModal called');
    const data = window.projectData;
    if (!data) {
        console.error('No project data available');
        return;
    }

    const modal = document.getElementById('projectDetailsModal');
    const modalBody = modal?.querySelector('.modal-body');
    
    if (!modal || !modalBody) {
        console.error('Modal elements not found');
        return;
    }

    console.log('Showing modal with data:', data);

    // Create modal content
    const content = `
        <div class="details-grid">
            <div class="detail-item">
                <strong>Phase:</strong>
                <span>${data.phase?.name || 'Not specified'}</span>
            </div>
            <div class="detail-item">
                <strong>Location:</strong>
                <span>${data.location || 'Not specified'}</span>
            </div>
            <div class="detail-item">
                <strong>Development Form:</strong>
                <span>${data.development_form?.name || 'Not specified'}</span>
            </div>
            <div class="detail-item">
                <strong>Number of Homes:</strong>
                <span>${data.number_of_homes || 'Not specified'}</span>
            </div>
            <div class="detail-item">
                <strong>Member Status:</strong>
                <span>${data.member_status?.name || 'Not specified'}</span>
            </div>
            <div class="detail-item">
                <strong>Building Permit:</strong>
                <span>${data.building_permit_status?.name || 'Not specified'}</span>
            </div>
            <div class="detail-item">
                <strong>Construction Financing:</strong>
                <span>${data.needs_construction_financing?.name || 'Not specified'}</span>
            </div>
            <div class="detail-item">
                <strong>Planning Costs:</strong>
                <span>${data.needs_planning_costs_financing?.name || 'Not specified'}</span>
            </div>
            <div class="detail-item">
                <strong>Chamber Registration:</strong>
                <span>${data.chamber_of_commerce_registration_status?.name || 'Not specified'}</span>
            </div>
        </div>
    `;

    // Update modal and show it
    modalBody.innerHTML = content;
    modal.style.display = 'flex';
    console.log('Modal should be visible now');
}

function closeModal() {
    const modal = document.getElementById('projectDetailsModal');
    if (modal) {
        modal.style.display = 'none';
    }
} 