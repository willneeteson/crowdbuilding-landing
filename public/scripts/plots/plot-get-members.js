// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Get project ID from URL
        const pathParts = window.location.pathname.split('/');
        const slug = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];

        if (!slug) {
            console.error('No slug found in URL');
            return;
        }

        // Fetch project data
        fetch(`https://api.crowdbuilding.com/api/v1/plots/${slug}/members`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(response => {
                const data = response.data;
                
                // Store data globally
                window.membersData = data;
                console.log('Members data stored:', data);

                // Update page elements with members data
                updateMembersElements(data);
            })
            .catch(error => {
                console.error('Error fetching members data:', error);
            });
    } catch (error) {
        console.error('Error initializing members:', error);
    }
});

function updateMembersElements(data) {
    const membersContainer = document.querySelector('.project-members');
    if (!membersContainer) return;

    if (data && data.length > 0) {
        // Sort members from newest to oldest
        const sortedData = [...data].sort((a, b) => {
            // Try different possible timestamp fields
            const aTime = a.created_at || a.joined_at || a.member_since || a.timestamp || 0;
            const bTime = b.created_at || b.joined_at || b.member_since || b.timestamp || 0;
            
            // Convert to timestamps if they're strings
            const aTimestamp = typeof aTime === 'string' ? new Date(aTime).getTime() : aTime;
            const bTimestamp = typeof bTime === 'string' ? new Date(bTime).getTime() : bTime;
            
            // Sort newest first (descending order)
            return bTimestamp - aTimestamp;
        });

        membersContainer.innerHTML = sortedData.map(member => `
            <div class="member-card">
                <div class="member-avatar">
                    <img src="${member.avatar_url || '/images/default-avatar.png'}" alt="${member.name}">
                </div>
                <div class="member-info">
                    <h4>${member.name}</h4>
                    ${member.role ? `<div class="member-role">${member.role}</div>` : ''}
                </div>
            </div>
        `).join('');
        membersContainer.style.display = 'block';
    } else {
        membersContainer.innerHTML = '<p>Geen leden gevonden.</p>';
    }
} 