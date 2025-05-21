// Default group ID
const DEFAULT_GROUP_ID = 'tiny-house-alkmaar';

// Function to handle joining a group
async function joinGroup(groupId = DEFAULT_GROUP_ID) {
    try {
        const response = await fetch(`/api/groups/${groupId}/join`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to join group');
        }

        // Handle successful join
        if (data.message) {
            showNotification('success', data.message);
        }

        // Update UI to reflect joined status
        updateGroupUI(true);

        return data;
    } catch (error) {
        console.error('Error joining group:', error);
        showNotification('error', error.message || 'Failed to join group');
        throw error;
    }
}

// Function to update UI elements after joining
function updateGroupUI(isJoined) {
    const joinButton = document.querySelector('.join-group-button');
    if (joinButton) {
        if (isJoined) {
            joinButton.textContent = 'Joined';
            joinButton.classList.add('joined');
            joinButton.disabled = true;
        } else {
            joinButton.textContent = 'Join Group';
            joinButton.classList.remove('joined');
            joinButton.disabled = false;
        }
    }
}

// Function to show notifications
function showNotification(type, message) {
    const notificationContainer = document.querySelector('.notification-container');
    if (!notificationContainer) return;

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    notificationContainer.appendChild(notification);

    // Remove notification after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Event listener for join button
document.addEventListener('DOMContentLoaded', () => {
    const joinButton = document.querySelector('.join-group-button');
    if (joinButton) {
        joinButton.addEventListener('click', async (e) => {
            e.preventDefault();
            // Use the group ID from the button's data attribute or fall back to default
            const groupId = joinButton.dataset.groupId || DEFAULT_GROUP_ID;
            
            try {
                joinButton.disabled = true;
                await joinGroup(groupId);
            } catch (error) {
                joinButton.disabled = false;
            }
        });
    }
});
