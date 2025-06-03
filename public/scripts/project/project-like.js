// Like Button Handler
/*
CSS classes for styling:
.project__like-btn.liked - The liked state of the button
.project__like-btn.loading - The loading state while API call is in progress
.project__like-btn.error - Shown briefly when an error occurs
.project__like-heart.liked - The liked state of the heart icon
.project__like-btn.shimmer - Shows shimmer effect while loading initial state
*/

const API_URL = window.API_BASE_URL || 'https://api.crowdbuilding.com';

class LikeButton {
  constructor(button) {
    this.button = button;
    if (!this.button) {
      console.error('No button element found');
      return;
    }
    
    console.log('Initializing like button:', this.button);
    this.heartIcon = this.button.querySelector('.project__like-heart');
    this.counter = this.button.querySelector('.project__like-counter');
    
    // Hide the counter initially and add shimmer effect
    this.counter.style.visibility = 'hidden';
    this.button.classList.add('shimmer');
    
    // Initialize state as null until we get it from the API
    this.isLiked = null;
    console.log('Initial like state set to null until API response');
    
    this.init();
  }

  init() {
    // Get project ID from URL using the same logic as project-get-details.js
    const pathParts = window.location.pathname.split('/');
    this.groupId = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];
    console.log('Group ID from URL:', this.groupId);
    
    if (!this.groupId) {
      console.error('No project ID found in URL');
      return;
    }
    
    // Store group ID in button's data attribute for reference
    this.button.dataset.groupId = this.groupId;
    
    // Initialize click handler
    this.button.addEventListener('click', async (e) => {
      console.log('Like button clicked');
      e.preventDefault();
      
      // Check if user is logged in
      const isLoggedIn = await window.auth.isUserLoggedIn();
      console.log('User logged in status:', isLoggedIn);
      
      if (!isLoggedIn) {
        // Trigger login modal or redirect to login page
        console.log('User needs to login first');
        return;
      }
      
      if (!this.button.classList.contains('loading')) {
        console.log('Initiating like toggle');
        this.toggleLike();
      } else {
        console.log('Button is in loading state, ignoring click');
      }
    });

    // Check initial follow status
    this.checkFollowStatus();
  }

  async checkFollowStatus() {
    console.log('Checking follow status for group:', this.groupId);
    try {
      const apiToken = await window.auth.getApiToken();
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };

      if (apiToken) {
        headers['Authorization'] = `Bearer ${apiToken}`;
      }

      const url = `${API_URL}/api/v1/groups/${this.groupId}`;
      console.log('Making GET request to:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: headers
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      console.log('Follow status response:', data);
      
      // Update initial state based on API response
      this.isLiked = data.data.is_following;
      console.log('Updated like state from API:', this.isLiked);
      this.updateUI(data.data.followers_count || 0);
      
      // Remove shimmer effect and show counter after data is loaded
      this.button.classList.remove('shimmer');
      this.counter.style.visibility = 'visible';
      
    } catch (error) {
      console.error('Error checking follow status:', error);
      // Show counter even on error, but with 0
      this.counter.style.visibility = 'visible';
      this.button.classList.remove('shimmer');
    }
  }

  async toggleLike() {
    console.log('Toggling like state, current state:', this.isLiked);
    try {
      // Add loading state
      this.button.classList.add('loading');
      
      // Get API token
      console.log('Getting API token');
      const apiToken = await window.auth.getApiToken();
      console.log('API token received:', apiToken ? 'Yes' : 'No');
      
      if (!apiToken) {
        throw new Error('No API token available');
      }

      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`
      };
      
      // Choose endpoint based on current state
      const endpoint = this.isLiked ? 'unfollow' : 'follow';
      const url = `${API_URL}/api/v1/groups/${this.groupId}/${endpoint}`;
      console.log(`Making POST request to ${endpoint} endpoint:`, url);
      console.log('Request headers:', headers);

      const response = await fetch(url, {
        method: 'POST',
        headers: headers
      });

      console.log('Follow API response status:', response.status);
      
      // Handle specific error cases
      if (response.status === 403) {
        const errorData = await response.json();
        console.error('Permission error:', errorData);
        // Refresh status to ensure we have correct state
        await this.checkFollowStatus();
        return;
      }
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error response:', errorData);
        throw new Error(`Network response was not ok: ${response.status}`);
      }

      const data = await response.json();
      console.log('Follow API response data:', data);
      
      // Get the updated group data to ensure we have the correct count
      const groupResponse = await fetch(`${API_URL}/api/v1/groups/${this.groupId}`, {
        method: 'GET',
        headers: headers
      });

      if (!groupResponse.ok) {
        throw new Error('Failed to get updated group data');
      }

      const groupData = await groupResponse.json();
      console.log('Updated group data:', groupData);
      
      // Update state based on API response
      this.isLiked = groupData.data.is_following;
      console.log('Updated like state after toggle:', this.isLiked);
      
      // Update UI with the count from the API response
      this.updateUI(groupData.data.followers_count);
      
    } catch (error) {
      console.error('Error toggling like:', error);
      // Visual feedback for error
      this.button.classList.add('error');
      setTimeout(() => this.button.classList.remove('error'), 2000);
      
      // Refresh the status to ensure UI is in sync
      await this.checkFollowStatus();
    } finally {
      // Remove loading state
      this.button.classList.remove('loading');
    }
  }

  updateUI(count) {
    console.log('Updating UI - count:', count, 'isLiked:', this.isLiked);
    // Update the counter with the exact count from API
    if (typeof count === 'number') {
      this.counter.textContent = count.toString();
    }
    
    // Update heart icon and button state
    if (this.isLiked) {
      this.heartIcon.classList.add('liked');
      this.button.classList.add('liked');
    } else {
      this.heartIcon.classList.remove('liked');
      this.button.classList.remove('liked');
    }
  }
}

// Initialize like buttons
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM ready, initializing like buttons');
  // Initialize for all like buttons on the page
  const buttons = document.querySelectorAll('.project__like-btn');
  console.log('Found like buttons:', buttons.length);
  buttons.forEach(button => {
    new LikeButton(button);
  });
}); 