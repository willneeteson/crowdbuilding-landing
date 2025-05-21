// Function to populate members list in Webflow
function populateMembersList(data) {
    try {
        const membersContainer = document.getElementById('projectMembers');
        if (!membersContainer) return;

        // Create HTML for members
        const membersHTML = data.members.map(member => `
            <div class="w-embed">
                <div class="member-item">
                    <div class="member-avatar">
                        <img src="${member.avatar_url || '/images/default-avatar.png'}" alt="${member.name}" class="member-image">
                    </div>
                    <div class="member-info">
                        <div class="member-name">${member.name}</div>
                        <div class="member-role">${member.role_label || 'Member'}</div>
                    </div>
                </div>
            </div>
        `).join('');

        // Add members count
        const membersCountElement = document.querySelector('.project-members-count');
        if (membersCountElement) {
            membersCountElement.textContent = data.members_count || 0;
        }

        // Update the container with members list
        membersContainer.innerHTML = membersHTML;

        console.log('Members list populated successfully');
    } catch (error) {
        console.error('Error populating members list:', error);
    }
}

// Function to fetch members data
async function fetchMembersData() {
    try {
        // Get authentication token
        const token = await window.auth.getApiToken();
        if (!token) {
            console.error('No authentication token available');
            return;
        }

        const projectId = 'tiny-house-alkmaar';
        const response = await fetch(`https://api.crowdbuilding.com/api/v1/groups/${projectId}/members`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Fetched members data:', data);
        
        if (data && data.data) {
            populateMembersList(data.data);
        } else {
            console.error('Invalid data format received from API');
        }
    } catch (error) {
        console.error('Error fetching members data:', error);
    }
}

// Call the function when the page loads
document.addEventListener('DOMContentLoaded', fetchMembersData);
