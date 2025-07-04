// Function to show login message
function showLoginMessage() {
    const membersContainer = document.getElementById('projectMembers');
    const memberWrapper = document.getElementById('projectMemberWrapper');
    
    // Hide the entire wrapper
    if (memberWrapper) {
        memberWrapper.style.display = 'none';
    }
    
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
                <h3>Project Kenmerken</h3>
                <span class="close-modal" onclick="closeProjectDetailsModal()">&times;</span>
            </div>
            <div class="modal-body">
                <div class="modal-section">
                    <h4>Project Informatie</h4>
                    <div class="project-details">
                        ${data.title ? `<div class="detail-item"><strong>Titel:</strong> ${data.title}</div>` : ''}
                        ${data.subtitle ? `<div class="detail-item"><strong>Ondertitel:</strong> ${data.subtitle}</div>` : ''}
                        ${data.location ? `<div class="detail-item"><strong>Locatie:</strong> ${data.location}</div>` : ''}
                        ${data.phase?.name ? `<div class="detail-item"><strong>Fase:</strong> ${data.phase.name}</div>` : ''}
                        ${data.development_form?.name ? `<div class="detail-item"><strong>Ontwikkelvorm:</strong> ${data.development_form.name}</div>` : ''}
                        ${data.number_of_homes ? `<div class="detail-item"><strong>Aantal Woningen:</strong> ${data.number_of_homes}</div>` : ''}
                    </div>
                </div>

                ${data.housing_forms && data.housing_forms.length > 0 ? `
                    <div class="modal-section">
                        <h4>Woonvormen</h4>
                        <div class="tags-list">
                            ${data.housing_forms.map(form => `<div class="tag">${form.title}</div>`).join('')}
                        </div>
                    </div>
                ` : ''}

                ${data.interests && data.interests.length > 0 ? `
                    <div class="modal-section">
                        <h4>Interesses</h4>
                        <div class="tags-list">
                            ${data.interests.map(interest => `<div class="tag">${interest.name}</div>`).join('')}
                        </div>
                    </div>
                ` : ''}

                ${data.buy_budgets && data.buy_budgets.length > 0 ? `
                    <div class="modal-section">
                        <h4>Koopbudgetten</h4>
                        <div class="tags-list">
                            ${data.buy_budgets.map(budget => `<div class="tag">${budget.name}</div>`).join('')}
                        </div>
                    </div>
                ` : ''}

                ${data.target_audiences && data.target_audiences.length > 0 ? `
                    <div class="modal-section">
                        <h4>Doelgroepen</h4>
                        <div class="tags-list">
                            ${data.target_audiences.map(audience => `<div class="tag">${audience.name}</div>`).join('')}
                        </div>
                    </div>
                ` : ''}

                <div class="modal-section">
                    <h4>Status</h4>
                    <div class="project-status">
                        ${data.building_permit_status?.name ? `<div class="status-item"><strong>Bouwvergunning:</strong> ${data.building_permit_status.name}</div>` : ''}
                        ${data.needs_construction_financing?.name ? `<div class="status-item"><strong>Bouwfinanciering:</strong> ${data.needs_construction_financing.name}</div>` : ''}
                        ${data.needs_planning_costs_financing?.name ? `<div class="status-item"><strong>Plankosten:</strong> ${data.needs_planning_costs_financing.name}</div>` : ''}
                        ${data.chamber_of_commerce_registration_status?.name ? `<div class="status-item"><strong>KvK Registratie:</strong> ${data.chamber_of_commerce_registration_status.name}</div>` : ''}
                    </div>
                </div>

                ${data.contact_name || data.contact_email ? `
                    <div class="modal-section">
                        <h4>Contactgegevens</h4>
                        <div class="contact-info">
                            ${data.contact_name ? `<div class="contact-item"><strong>Naam:</strong> ${data.contact_name}</div>` : ''}
                            ${data.contact_email ? `<div class="contact-item"><strong>E-mail:</strong> ${data.contact_email}</div>` : ''}
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    detailsElement.innerHTML = modalContent;
}

// Function to populate members list in Webflow
async function populateMembersList(members, containerType = 'members') {
    try {
        console.log(`Starting to populate ${containerType} list with data:`, members);
        
        // Determine which container to use based on type
        const containerId = containerType === 'admins' ? 'projectAdmin' : 'projectMembers';
        const wrapperId = containerType === 'admins' ? 'projectAdminWrapper' : 'projectMemberWrapper';
        const modalId = containerType === 'admins' ? 'adminsModal' : 'membersModal';
        const container = document.getElementById(containerId);
        const wrapper = document.getElementById(wrapperId);
        
        console.log(`Found ${containerType} container:`, container);
        
        if (!container || !wrapper) {
            console.error(`${containerType} container or wrapper not found!`);
            return;
        }

        // Filter members based on role
        const filteredMembers = members.filter(member => {
            if (containerType === 'admins') {
                return member.role_label === 'beheerder';
            } else {
                return member.role_label !== 'beheerder';
            }
        });
        
        console.log(`Number of ${containerType} to display:`, filteredMembers.length);

        // Hide the wrapper if no members to display
        if (filteredMembers.length === 0) {
            wrapper.style.display = 'none';
            return;
        } else {
            wrapper.style.display = 'block';
        }

        // Set max avatars based on container type
        const maxAvatars = containerType === 'admins' ? 3 : 5;
        const remainingCount = Math.max(0, filteredMembers.length - maxAvatars);
        
        const avatarsHTML = filteredMembers.slice(0, maxAvatars).map(member => {
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

        // Create the compact view container with click handler
        const compactViewHTML = `
            <div class="members-compact-view">
                <div class="members-avatars">
                    ${avatarsHTML}
                    ${remainingHTML}
                </div>
            </div>
        `;

        // Create members list content for modal
        const membersListContent = `
            <div class="cb-members-list">
                ${filteredMembers.map(member => {
                    const avatarUrl = member.avatar_url 
                        ? (member.avatar_url.startsWith('http') ? member.avatar_url : `https://api.crowdbuilding.com${member.avatar_url}`)
                        : 'https://api.crowdbuilding.com/storage/default-avatar.png';
                    
                    return `
                        <div class="cb-member-item">
                            <a href="/user?id=${member.id}" class="cb-member-link">
                                <div class="cb-member-avatar">
                                    <img src="${avatarUrl}" alt="${member.name}" class="member-image" onerror="this.src='https://api.crowdbuilding.com/storage/default-avatar.png'">
                                </div>
                                <div class="cb-member-info">
                                    <div class="cb-member-name">${member.name}</div>
                                    <div class="cb-member-role">${member.role_label || 'Member'}</div>
                                </div>
                            </a>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        // Wait for modal system and create the members modal
        const modalSystem = await window.waitForModalSystem();
        const modalTitle = containerType === 'admins' ? `Beheerders (${filteredMembers.length})` : `Deelnemers (${filteredMembers.length})`;
        modalSystem.createModal(modalTitle, membersListContent, { id: modalId });

        // Add the compact view to the container
        container.innerHTML = compactViewHTML;

        // Add click handler to the wrapper div
        if (wrapper) {
            wrapper.style.cursor = 'pointer';
            wrapper.addEventListener('click', () => showModal(modalId));
        }

        console.log(`${containerType} list populated successfully`);
    } catch (error) {
        console.error(`Error populating ${containerType} list:`, error);
    }
}

// Function to show any modal
async function showModal(modalId) {
    try {
        const modalSystem = await window.waitForModalSystem();
        modalSystem.showModal(modalId);
    } catch (error) {
        console.error('Error showing modal:', error);
    }
}

// Function to fetch members data
async function fetchMembersData() {
    try {
        console.log('Starting to fetch members data...');
        
        // Show loading state immediately for both containers
        showLoadingState();
        const adminContainer = document.getElementById('projectAdmin');
        if (adminContainer) {
            showLoadingState('admin');
        }
        
        // Check if user is logged in first
        const isLoggedIn = await window.auth.isUserLoggedIn();
        console.log('Is user logged in:', isLoggedIn);
        
        if (!isLoggedIn) {
            console.log('User is not logged in, showing login message');
            showLoginMessage();
            if (adminContainer) showLoginMessage('admin');
            return;
        }

        // Get authentication token
        console.log('Getting API token...');
        const token = await window.auth.getApiToken();
        console.log('Got auth token:', token ? 'Token exists' : 'No token');
        
        if (!token) {
            console.log('No authentication token available, showing login message');
            showLoginMessage();
            if (adminContainer) showLoginMessage('admin');
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

        // Initialize array to store all members
        let allMembers = [];
        let nextPageUrl = `https://api.crowdbuilding.com/api/v1/groups/${projectId}/members?page=1`;

        // Fetch all pages
        while (nextPageUrl) {
            console.log('Fetching page:', nextPageUrl);
            
            const response = await fetch(nextPageUrl, {
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
                    if (adminContainer) showPermissionMessage('admin');
                    return;
                }
                
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Fetched page data:', data);

            if (data && data.data) {
                // Add members from this page to our collection
                allMembers = allMembers.concat(data.data);
                
                // Get next page URL from the links
                nextPageUrl = data.links && data.links.next;
            } else {
                console.error('Invalid data format received from API:', data);
                break;
            }
        }

        console.log('Total members fetched:', allMembers.length);
        
        // Now populate both the members and admins lists with filtered data
        await populateMembersList(allMembers, 'members');
        if (adminContainer) {
            await populateMembersList(allMembers, 'admins');
        }
        
    } catch (error) {
        console.error('Error fetching members data:', error);
        showPermissionMessage();
        const adminContainer = document.getElementById('projectAdmin');
        if (adminContainer) showPermissionMessage('admin');
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
