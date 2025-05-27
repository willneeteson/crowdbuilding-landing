// Function to show login message
function showLoginMessage() {
    const membersContainer = document.getElementById('projectMembers');
    if (!membersContainer) return;

    membersContainer.innerHTML = `
        <div class="w-embed">
            <div class="login-message">
                <p>Log in om de leden te bekijken</p>
                <a href="/login" class="login-button">Inloggen</a>
            </div>
        </div>
    `;
}

// Function to show permission message
function showPermissionMessage() {
    const membersContainer = document.getElementById('projectMembers');
    if (!membersContainer) return;

    membersContainer.innerHTML = `
        <div class="w-embed">
            <div class="permission-message">
                <p>Je moet lid zijn van deze groep om de leden te bekijken</p>
                <a href="/join-group" class="join-button">Word lid</a>
            </div>
        </div>
    `;
}

// Function to show loading state
function showLoadingState() {
    const membersContainer = document.getElementById('projectMembers');
    if (!membersContainer) return;

    // Create 5 greyed out avatars for loading state
    const loadingHTML = `
        <div class="members-compact-view loading">
            ${Array(5).fill(`
                <div class="member-avatar loading">
                    <div class="loading-placeholder"></div>
                </div>
            `).join('')}
        </div>
    `;

    membersContainer.innerHTML = loadingHTML;
}

// Function to show project details modal
function showProjectDetailsModal() {
    const modal = document.getElementById('projectDetailsModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Function to close project details modal
function closeProjectDetailsModal() {
    const modal = document.getElementById('projectDetailsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Function to populate project details modal
function populateProjectDetailsModal(data) {
    const detailsElement = document.querySelector('.project__sidebar-group details');
    if (!detailsElement) return;

    const modalContent = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Project Details</h3>
                <span class="close-modal" onclick="closeProjectDetailsModal()">&times;</span>
            </div>
            <div class="modal-body">
                <div class="modal-section">
                    <h4>Project Information</h4>
                    <div class="project-details">
                        ${data.title ? `<div class="detail-item"><strong>Title:</strong> ${data.title}</div>` : ''}
                        ${data.subtitle ? `<div class="detail-item"><strong>Subtitle:</strong> ${data.subtitle}</div>` : ''}
                        ${data.location ? `<div class="detail-item"><strong>Location:</strong> ${data.location}</div>` : ''}
                        ${data.phase?.name ? `<div class="detail-item"><strong>Phase:</strong> ${data.phase.name}</div>` : ''}
                        ${data.development_form?.name ? `<div class="detail-item"><strong>Development Form:</strong> ${data.development_form.name}</div>` : ''}
                        ${data.number_of_homes ? `<div class="detail-item"><strong>Number of Homes:</strong> ${data.number_of_homes}</div>` : ''}
                    </div>
                </div>

                ${data.housing_forms && data.housing_forms.length > 0 ? `
                    <div class="modal-section">
                        <h4>Housing Forms</h4>
                        <div class="tags-list">
                            ${data.housing_forms.map(form => `<div class="tag">${form.title}</div>`).join('')}
                        </div>
                    </div>
                ` : ''}

                ${data.interests && data.interests.length > 0 ? `
                    <div class="modal-section">
                        <h4>Interests</h4>
                        <div class="tags-list">
                            ${data.interests.map(interest => `<div class="tag">${interest.name}</div>`).join('')}
                        </div>
                    </div>
                ` : ''}

                ${data.buy_budgets && data.buy_budgets.length > 0 ? `
                    <div class="modal-section">
                        <h4>Buy Budgets</h4>
                        <div class="tags-list">
                            ${data.buy_budgets.map(budget => `<div class="tag">${budget.name}</div>`).join('')}
                        </div>
                    </div>
                ` : ''}

                ${data.target_audiences && data.target_audiences.length > 0 ? `
                    <div class="modal-section">
                        <h4>Target Audiences</h4>
                        <div class="tags-list">
                            ${data.target_audiences.map(audience => `<div class="tag">${audience.name}</div>`).join('')}
                        </div>
                    </div>
                ` : ''}

                <div class="modal-section">
                    <h4>Status</h4>
                    <div class="project-status">
                        ${data.building_permit_status?.name ? `<div class="status-item"><strong>Building Permit:</strong> ${data.building_permit_status.name}</div>` : ''}
                        ${data.needs_construction_financing?.name ? `<div class="status-item"><strong>Construction Financing:</strong> ${data.needs_construction_financing.name}</div>` : ''}
                        ${data.needs_planning_costs_financing?.name ? `<div class="status-item"><strong>Planning Costs:</strong> ${data.needs_planning_costs_financing.name}</div>` : ''}
                        ${data.chamber_of_commerce_registration_status?.name ? `<div class="status-item"><strong>Chamber Registration:</strong> ${data.chamber_of_commerce_registration_status.name}</div>` : ''}
                    </div>
                </div>

                ${data.contact_name || data.contact_email ? `
                    <div class="modal-section">
                        <h4>Contact Information</h4>
                        <div class="contact-info">
                            ${data.contact_name ? `<div class="contact-item"><strong>Name:</strong> ${data.contact_name}</div>` : ''}
                            ${data.contact_email ? `<div class="contact-item"><strong>Email:</strong> ${data.contact_email}</div>` : ''}
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    detailsElement.innerHTML = modalContent;
}

// Function to populate members list in Webflow
function populateMembersList(data) {
    try {
        console.log('Starting to populate members list with data:', data);
        
        const membersContainer = document.getElementById('projectMembers');
        console.log('Found members container:', membersContainer);
        
        if (!membersContainer) {
            console.error('Members container not found!');
            return;
        }

        // Handle both array and object data structures
        const members = Array.isArray(data) ? data : (data.members || []);
        
        if (!Array.isArray(members)) {
            console.error('No valid members array found in data:', data);
            return;
        }

        console.log('Number of members to display:', members.length);

        // Create compact avatar view (max 5 avatars + remaining count)
        const maxAvatars = 5;
        const remainingCount = Math.max(0, members.length - maxAvatars);
        
        const avatarsHTML = members.slice(0, maxAvatars).map(member => {
            const avatarUrl = member.avatar_url 
                ? (member.avatar_url.startsWith('http') ? member.avatar_url : `https://api.crowdbuilding.com${member.avatar_url}`)
                : 'https://api.crowdbuilding.com/storage/default-avatar.png';
            
            return `
                <div class="member-avatar">
                    <img src="${avatarUrl}" alt="${member.name}" class="member-image" onerror="this.src='https://api.crowdbuilding.com/storage/default-avatar.png'">
                </div>
            `;
        }).join('');

        // Add remaining count if there are more members
        const remainingHTML = remainingCount > 0 
            ? `<div class="member-avatar remaining-count">+${remainingCount}</div>`
            : '';

        // Create the compact view container with two click handlers
        const compactViewHTML = `
            <div class="members-compact-view">
                <div class="members-avatars" onclick="showMembersModal()">
                    ${avatarsHTML}
                    ${remainingHTML}
                </div>
                <button class="details-button" onclick="showProjectDetailsModal()">View Details</button>
            </div>
        `;

        // Create the members modal HTML
        const membersModalHTML = `
            <div id="membersModal" class="members-modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Members (${members.length})</h3>
                        <span class="close-modal" onclick="closeMembersModal()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="members-list">
                            ${members.map(member => {
                                const avatarUrl = member.avatar_url 
                                    ? (member.avatar_url.startsWith('http') ? member.avatar_url : `https://api.crowdbuilding.com${member.avatar_url}`)
                                    : 'https://api.crowdbuilding.com/storage/default-avatar.png';
                                
                                return `
                                    <div class="member-item">
                                        <a href="/user?id=${member.id}" class="member-link">
                                            <div class="member-avatar">
                                                <img src="${avatarUrl}" alt="${member.name}" class="member-image" onerror="this.src='https://api.crowdbuilding.com/storage/default-avatar.png'">
                                            </div>
                                            <div class="member-info">
                                                <div class="member-name">${member.name}</div>
                                                <div class="member-role">${member.role_label || 'Member'}</div>
                                            </div>
                                        </a>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add the compact view and members modal to the container
        membersContainer.innerHTML = compactViewHTML + membersModalHTML;

        console.log('Members list populated successfully');
    } catch (error) {
        console.error('Error populating members list:', error);
    }
}

// Function to show the members modal
function showMembersModal() {
    const modal = document.getElementById('membersModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Function to close the members modal
function closeMembersModal() {
    const modal = document.getElementById('membersModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Close modal when clicking outside
document.addEventListener('click', (event) => {
    const modal = document.getElementById('membersModal');
    if (modal && event.target === modal) {
        closeMembersModal();
    }
});

// Function to fetch members data
async function fetchMembersData() {
    try {
        console.log('Starting to fetch members data...');
        
        // Show loading state immediately
        showLoadingState();
        
        // Check if user is logged in first
        const isLoggedIn = await window.auth.isUserLoggedIn();
        console.log('Is user logged in:', isLoggedIn);
        
        if (!isLoggedIn) {
            console.log('User is not logged in, showing login message');
            showLoginMessage();
            return;
        }

        // Get authentication token
        console.log('Getting API token...');
        const token = await window.auth.getApiToken();
        console.log('Got auth token:', token ? 'Token exists' : 'No token');
        
        if (!token) {
            console.log('No authentication token available, showing login message');
            showLoginMessage();
            return;
        }

        // Get the current page slug from the URL
        const pathParts = window.location.pathname.split('/');
        const projectId = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];
        
        if (!projectId) {
            console.error('No project ID found in URL');
            return;
        }

        console.log('Fetching members for project:', projectId);
        
        const response = await fetch(`https://api.crowdbuilding.com/api/v1/groups/${projectId}/members`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        console.log('API Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', errorText);
            
            // Check if user is not authenticated
            if (response.status === 403) {
                console.log('User needs to be a member of the group');
                showPermissionMessage();
                return;
            }
            
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Fetched members data:', data);
        
        if (data && data.data) {
            populateMembersList(data.data);
        } else {
            console.error('Invalid data format received from API:', data);
        }
    } catch (error) {
        console.error('Error fetching members data:', error);
        showPermissionMessage();
    }
}

// Wait for both DOM and auth to be ready
async function initialize() {
    try {
        console.log('Waiting for DOM to be ready...');
        await new Promise(resolve => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });

        // Show loading state immediately after DOM is ready
        showLoadingState();

        console.log('Waiting for auth to be ready...');
        if (typeof window.auth === 'undefined') {
            console.error('Auth module not found!');
            return;
        }

        // Wait for Memberstack to be ready
        if (typeof $memberstackDom !== 'undefined') {
            console.log('Waiting for Memberstack to be ready...');
            await $memberstackDom.onReady;
            console.log('Memberstack is ready');
        }

        // Wait a bit for auth to initialize
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await fetchMembersData();
    } catch (error) {
        console.error('Initialization error:', error);
        showPermissionMessage();
    }
}

// Start the initialization
initialize();
