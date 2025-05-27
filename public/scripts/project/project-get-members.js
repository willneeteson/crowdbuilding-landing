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

        // Create HTML for members
        const membersHTML = members.map(member => {
            console.log('Processing member:', member);
            // Ensure avatar_url is a complete URL
            const avatarUrl = member.avatar_url 
                ? (member.avatar_url.startsWith('http') ? member.avatar_url : `https://api.crowdbuilding.com${member.avatar_url}`)
                : 'https://api.crowdbuilding.com/storage/default-avatar.png';
            
            return `
                <div class="w-embed">
                    <a href="/user?id=${member.id}" class="member-link">
                        <div class="member-item">
                            <div class="member-avatar">
                                <img src="${avatarUrl}" alt="${member.name}" class="member-image" onerror="this.src='https://api.crowdbuilding.com/storage/default-avatar.png'">
                            </div>
                            <div class="member-info">
                                <div class="member-name">${member.name}</div>
                                <div class="member-role">${member.role_label || 'Member'}</div>
                            </div>
                        </div>
                    </a>
                </div>
            `;
        }).join('');

        // Add members count to the heading if it exists
        const headingElement = membersContainer.previousElementSibling;
        if (headingElement && headingElement.tagName === 'H3') {
            headingElement.textContent = `Members (${members.length})`;
        }

        // Update the container with members list
        console.log('Generated HTML:', membersHTML);
        membersContainer.innerHTML = membersHTML;

        console.log('Members list populated successfully');
    } catch (error) {
        console.error('Error populating members list:', error);
    }
}

// Function to fetch members data
async function fetchMembersData() {
    try {
        console.log('Starting to fetch members data...');
        
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
