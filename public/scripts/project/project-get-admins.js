// Function to show login message
function showLoginMessage() {
    const adminsContainer = document.getElementById('projectAdmin');
    if (!adminsContainer) return;

    adminsContainer.innerHTML = `
        <div class="w-embed">
            <div class="login-message">
                <p>Log in om de beheerders te bekijken</p>
                <a href="/login" class="login-button">Inloggen</a>
            </div>
        </div>
    `;
}

// Function to show permission message
function showPermissionMessage() {
    const adminsContainer = document.getElementById('projectAdmin');
    if (!adminsContainer) return;

    adminsContainer.innerHTML = `
        <div class="w-embed">
            <div class="permission-message">
                <p>Je moet lid zijn van deze groep om de beheerders te bekijken</p>
                <a href="/join-group" class="join-button">Word lid</a>
            </div>
        </div>
    `;
}

// Function to show loading state
function showLoadingState() {
    const adminsContainer = document.getElementById('projectAdmin');
    if (!adminsContainer) return;

    // Create 3 greyed out avatars for loading state
    const loadingHTML = `
        <div class="members-compact-view loading">
            ${Array(3).fill(`
                <div class="member-avatar loading">
                    <div class="loading-placeholder"></div>
                </div>
            `).join('')}
        </div>
    `;

    adminsContainer.innerHTML = loadingHTML;
}

// Function to show admins modal
async function showAdminsModal() {
    try {
        const modalSystem = await window.waitForModalSystem();
        modalSystem.showModal('adminsModal');
    } catch (error) {
        console.error('Error showing admins modal:', error);
    }
}

// Function to populate admins list
async function populateAdminsList(data) {
    try {
        console.log('Starting to populate admins list with data:', data);
        
        const adminsContainer = document.getElementById('projectAdmin');
        console.log('Found admins container:', adminsContainer);
        
        if (!adminsContainer) {
            console.error('Admins container not found!');
            return;
        }

        // Handle both array and object data structures
        const admins = Array.isArray(data) ? data : [data.created_by];
        
        if (!Array.isArray(admins)) {
            console.error('No valid admins array found in data:', data);
            return;
        }

        console.log('Number of admins to display:', admins.length);

        // Create compact avatar view (max 3 avatars + remaining count)
        const maxAvatars = 3;
        const remainingCount = Math.max(0, admins.length - maxAvatars);
        
        const avatarsHTML = admins.slice(0, maxAvatars).map(admin => {
            const avatarUrl = admin.avatar_url 
                ? (admin.avatar_url.startsWith('http') ? admin.avatar_url : `https://api.crowdbuilding.com${admin.avatar_url}`)
                : 'https://api.crowdbuilding.com/storage/default-avatar.png';
            
            return `
                <div class="member-avatar">
                    <img src="${avatarUrl}" alt="${admin.name}" class="member-image" onerror="this.src='https://api.crowdbuilding.com/storage/default-avatar.png'">
                </div>
            `;
        }).join('');

        // Add remaining count if there are more admins
        const remainingHTML = remainingCount > 0 
            ? `<div class="member-avatar remaining-count">+${remainingCount}</div>`
            : '';

        // Create the compact view container with click handler
        const compactViewHTML = `
            <div class="members-compact-view">
                <div class="members-avatars" onclick="showAdminsModal()">
                    ${avatarsHTML}
                    ${remainingHTML}
                </div>
            </div>
        `;

        // Create admins list content for modal
        const adminsListContent = `
            <div class="cb-members-list">
                ${admins.map(admin => {
                    const avatarUrl = admin.avatar_url 
                        ? (admin.avatar_url.startsWith('http') ? admin.avatar_url : `https://api.crowdbuilding.com${admin.avatar_url}`)
                        : 'https://api.crowdbuilding.com/storage/default-avatar.png';
                    
                    return `
                        <div class="cb-member-item">
                            <a href="/user?id=${admin.id}" class="cb-member-link">
                                <div class="cb-member-avatar">
                                    <img src="${avatarUrl}" alt="${admin.name}" class="member-image" onerror="this.src='https://api.crowdbuilding.com/storage/default-avatar.png'">
                                </div>
                                <div class="cb-member-info">
                                    <div class="cb-member-name">${admin.name}</div>
                                    <div class="cb-member-role">Beheerder</div>
                                </div>
                            </a>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        // Wait for modal system and create the admins modal
        const modalSystem = await window.waitForModalSystem();
        modalSystem.createModal(`Beheerders (${admins.length})`, adminsListContent, { id: 'adminsModal' });

        // Add the compact view to the container
        adminsContainer.innerHTML = compactViewHTML;

        console.log('Admins list populated successfully');
    } catch (error) {
        console.error('Error populating admins list:', error);
    }
}

// Function to fetch admins data
async function fetchAdminsData() {
    try {
        console.log('Starting to fetch admins data...');
        
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

        console.log('Fetching project data for:', projectId);
        
        const response = await fetch(`https://api.crowdbuilding.com/api/v1/groups/${projectId}`, {
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
        console.log('Fetched project data:', data);
        
        if (data && data.data) {
            populateAdminsList(data.data);
        } else {
            console.error('Invalid data format received from API:', data);
        }
    } catch (error) {
        console.error('Error fetching admins data:', error);
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
        
        await fetchAdminsData();
    } catch (error) {
        console.error('Initialization error:', error);
        showPermissionMessage();
    }
}

// Make fetchAdminsData globally available
window.fetchAdminsData = fetchAdminsData;

// Start the initialization
initialize(); 