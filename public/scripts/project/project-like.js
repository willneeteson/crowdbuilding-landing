/**
 * Project Like Button Handler
 * Manages the like/follow functionality for project pages.
 * Uses the following API endpoints:
 * - GET /api/v1/groups/:id - Get group details and follow status
 * - POST /api/v1/groups/:id/follow - Follow a group
 * - POST /api/v1/groups/:id/unfollow - Unfollow a group
 */

const API_URL = window.API_BASE_URL || 'https://api.crowdbuilding.com';

class LikeButton {
  /**
   * Initialize a new like button instance
   * @param {HTMLElement} button - The like button element
   */
  constructor(button) {
    this.button = button;
    if (!this.button) {
      console.error('No button element found');
      return;
    }
    
    this.heartIcon = this.button.querySelector('.project__like-heart');
    this.counter = this.button.querySelector('.project__like-counter');
    this.isLiked = null;
    
    // Initialize button state
    this.setLoadingState(true);
    this.init();
  }

  /**
   * Set the loading state of the button
   * @param {boolean} isLoading - Whether the button is in loading state
   */
  setLoadingState(isLoading) {
    if (isLoading) {
      this.counter.style.visibility = 'hidden';
      this.button.classList.add('shimmer');
    } else {
      this.counter.style.visibility = 'visible';
      this.button.classList.remove('shimmer');
    }
  }

  /**
   * Initialize the button functionality
   */
  init() {
    // Get project ID from URL
    const pathParts = window.location.pathname.split('/');
    this.groupId = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];
    
    if (!this.groupId) {
      console.error('No project ID found in URL');
      this.setLoadingState(false);
      return;
    }
    
    // Store group ID in button's data attribute
    this.button.dataset.groupId = this.groupId;
    
    // Initialize click handler
    this.button.addEventListener('click', async (e) => {
      e.preventDefault();
      
      const isLoggedIn = await window.auth.isUserLoggedIn();
      if (!isLoggedIn) {
        console.log('User needs to login first');
        return;
      }
      
      if (!this.button.classList.contains('loading')) {
        this.toggleLike();
      }
    });

    // Check initial follow status
    this.checkFollowStatus();
  }

  /**
   * Make an authenticated API request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} API response
   */
  async makeRequest(endpoint, options = {}) {
    const apiToken = await window.auth.getApiToken();
    if (!apiToken) {
      throw new Error('No API token available');
    }

    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiToken}`
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    });

    if (response.status === 403) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Permission denied');
    }

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Check the current follow status
   */
  async checkFollowStatus() {
    try {
      const data = await this.makeRequest(`/api/v1/groups/${this.groupId}`);
      
      this.isLiked = Boolean(data.data?.is_member);
      this.updateUI(data.data?.followers_count || 0);
    } catch (error) {
      console.error('Error checking follow status:', error);
    } finally {
      this.setLoadingState(false);
    }
  }

  /**
   * Toggle the like/follow state
   */
  async toggleLike() {
    try {
      this.button.classList.add('loading');
      
      const endpoint = this.isLiked ? 'unfollow' : 'follow';
      await this.makeRequest(`/api/v1/groups/${this.groupId}/${endpoint}`, {
        method: 'POST'
      });
      
      // Get updated group data
      const data = await this.makeRequest(`/api/v1/groups/${this.groupId}`);
      
      this.isLiked = Boolean(data.data?.is_member);
      this.updateUI(data.data?.followers_count || 0);
      
    } catch (error) {
      console.error('Error toggling like:', error);
      this.button.classList.add('error');
      setTimeout(() => this.button.classList.remove('error'), 2000);
      await this.checkFollowStatus();
    } finally {
      this.button.classList.remove('loading');
    }
  }

  /**
   * Update the UI state
   * @param {number} count - The new follower count
   */
  updateUI(count) {
    // Update counter
    this.counter.textContent = count.toString();
    
    // Update like state
    if (this.isLiked) {
      this.heartIcon.classList.add('liked');
      this.button.classList.add('liked');
    } else {
      this.heartIcon.classList.remove('liked');
      this.button.classList.remove('liked');
    }
  }
}

// Initialize like buttons when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('.project__like-btn');
  buttons.forEach(button => new LikeButton(button));
}); 