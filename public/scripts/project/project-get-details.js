// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
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
    updateElement('.project-contact-name', data.contact_name);
    updateElement('.project-contact-email', data.contact_email);
    
    // Update status indicators
    updateElement('.project-building-permit', data.building_permit_status?.name);
    updateElement('.project-construction-financing', data.needs_construction_financing?.name);
    updateElement('.project-planning-costs', data.needs_planning_costs_financing?.name);
    updateElement('.project-chamber-registration', data.chamber_of_commerce_registration_status?.name);

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

function setupModalHandler() {
    // Add click handler to details group
    const detailsGroup = document.querySelector('.project__sidebar-group.details');
    if (detailsGroup) {
        detailsGroup.addEventListener('click', function(e) {
            e.preventDefault();
            showModal();
        });
    }

    // Add close handlers
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
        button.addEventListener('click', closeModal);
    });

    // Close modal when clicking outside
    const modal = document.getElementById('projectDetailsModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
}

function showModal() {
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
}

function closeModal() {
    const modal = document.getElementById('projectDetailsModal');
    if (modal) {
        modal.style.display = 'none';
    }
} 