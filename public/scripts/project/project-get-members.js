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

        if (!data.members || !Array.isArray(data.members)) {
            console.error('No members array in data:', data);
            return;
        }

        console.log('Number of members to display:', data.members.length);

        // Create HTML for members
        const membersHTML = data.members.map(member => {
            console.log('Processing member:', member);
            // Ensure avatar_url is a complete URL
            const avatarUrl = member.avatar_url 
                ? (member.avatar_url.startsWith('http') ? member.avatar_url : `https://api.crowdbuilding.com${member.avatar_url}`)
                : 'https://api.crowdbuilding.com/storage/default-avatar.png';
            
            return `
                <div class="w-embed">
                    <div class="member-item">
                        <div class="member-avatar">
                            <img src="${avatarUrl}" alt="${member.name}" class="member-image" onerror="this.src='https://api.crowdbuilding.com/storage/default-avatar.png'">
                        </div>
                        <div class="member-info">
                            <div class="member-name">${member.name}</div>
                            <div class="member-role">${member.role_label || 'Member'}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Add members count to the heading if it exists
        const headingElement = membersContainer.previousElementSibling;
        if (headingElement && headingElement.tagName === 'H3') {
            headingElement.textContent = `Members (${data.members_count || 0})`;
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
        
        // Get authentication token
        const token = await window.auth.getApiToken();
        console.log('Got auth token:', token ? 'Yes' : 'No');
        
        if (!token) {
            console.error('No authentication token available');
            return;
        }

        const projectId = 'tiny-house-alkmaar';
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
                console.log('User needs to be authenticated');
                // You might want to show a login prompt or redirect to login
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

        // Wait a bit for auth to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await fetchMembersData();
    } catch (error) {
        console.error('Initialization error:', error);
    }
}

// Start the initialization
initialize();
