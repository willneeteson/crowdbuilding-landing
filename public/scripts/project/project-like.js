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
    
    this.unlikedHeartIcon = this.button.querySelector('.project__like-heart.unliked');
    this.likedHeartIcon = this.button.querySelector('.project__like-heart.liked');
    this.counter = document.querySelector('[data-detail="member-count"]');
    this.buttonText = document.querySelector('#btnLikeText');
    this.isLiked = null;
    this.canFollow = false;
    this.canUnfollow = false;
    
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
      if (this.counter) this.counter.style.visibility = 'hidden';
      this.button.classList.add('shimmer');
    } else {
      if (this.counter) this.counter.style.visibility = 'visible';
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
      
      // Check if we can perform the action based on permissions
      if (this.isLiked && !this.canUnfollow) {
        console.log('Cannot unfollow - no permission');
        return;
      }
      if (!this.isLiked && !this.canFollow) {
        console.log('Cannot follow - no permission');
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
      
      // Update permissions
      this.canFollow = data.data?.permissions?.can_follow || false;
      this.canUnfollow = data.data?.permissions?.can_unfollow || false;
      
      // Update liked state based on permissions
      this.isLiked = this.canUnfollow;
      
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
      
      // Only attempt the action if we have permission
      if ((this.isLiked && !this.canUnfollow) || (!this.isLiked && !this.canFollow)) {
        throw new Error('No permission to perform this action');
      }
      
      const endpoint = this.isLiked ? 'unfollow' : 'follow';
      await this.makeRequest(`/api/v1/groups/${this.groupId}/${endpoint}`, {
        method: 'POST'
      });
      
      // Get updated group data
      const data = await this.makeRequest(`/api/v1/groups/${this.groupId}`);
      
      // Update permissions and state
      this.canFollow = data.data?.permissions?.can_follow || false;
      this.canUnfollow = data.data?.permissions?.can_unfollow || false;
      this.isLiked = this.canUnfollow;
      
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
    if (this.counter) {
      this.counter.textContent = count.toString();
    }
    
    // Update button text
    if (this.buttonText) {
      this.buttonText.textContent = this.isLiked ? 'volgt' : 'Volgen';
    }
    
    // Update like state
    if (this.isLiked) {
      this.button.classList.add('liked');
      if (this.likedHeartIcon) this.likedHeartIcon.style.display = 'block';
      if (this.unlikedHeartIcon) this.unlikedHeartIcon.style.display = 'none';
    } else {
      this.button.classList.remove('liked');
      if (this.likedHeartIcon) this.likedHeartIcon.style.display = 'none';
      if (this.unlikedHeartIcon) this.unlikedHeartIcon.style.display = 'block';
    }
    
    // Update button state based on permissions
    this.button.disabled = (!this.canFollow && !this.canUnfollow);
  }
}

// Initialize like buttons when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('.project__like-btn');
  buttons.forEach(button => new LikeButton(button));
}); 