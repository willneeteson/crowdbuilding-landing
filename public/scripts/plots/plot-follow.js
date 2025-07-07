/**
 * Plot Follow Button Handler
 * Manages the follow functionality for plot pages.
 * Uses the following API endpoints:
 * - GET /api/v1/plots/:id - Get plot details and follow status
 * - POST /api/v1/plots/:id/follow - Follow a plot
 * - POST /api/v1/plots/:id/unfollow - Unfollow a plot
 */

const API_URL = window.API_BASE_URL || 'https://api.crowdbuilding.com';

class LikeButton {
  /**
   * Initialize a new follow button instance
   * @param {HTMLElement} button - The follow button element
   */
  constructor(button) {
    this.button = button;
    if (!this.button) {
      console.error('No button element found');
      return;
    }
    
    this.heartIcon = this.button.querySelector('.project__like-heart');
    this.counter = this.button.querySelector('.project__like-counter');
    this.isFollowing = null;
    this.canFollow = false;
    this.canUnfollow = false;
    
    // Initialize button state
    this.setLoadingState(true);
    this.init();

    // Add styles if not already present
    if (!document.getElementById('like-button-styles')) {
      const style = document.createElement('style');
      style.id = 'like-button-styles';
      style.textContent = `
        .project__like-btn {
          grid-column-gap: 6px;
          grid-row-gap: 6px;
          border: 1px solid var(--color--color-neutral-black-100);
          color: var(--color--color-neutral-black-100);
          border-radius: 99px;
          justify-content: center;
          align-items: center;
          height: 44px;
          padding-left: 14px;
          padding-right: 16px;
          text-decoration: none;
          display: flex;
          background: transparent;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .project__like-btn:hover {
          background: var(--color--color-neutral-black-100);
          color: white;
        }

        .project__like-btn.liked {
          background: var(--color--color-neutral-black-100);
          color: white;
        }

        .project__like-btn.loading {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .project__like-btn.error {
          border-color: #e74c3c;
          color: #e74c3c;
        }

        .project__like-heart {
          width: 20px;
          height: 20px;
          transition: transform 0.2s ease;
        }

        /* Hide the liked heart by default */
        .project__like-heart.liked:not(.unliked) {
          display: none;
        }

        /* When button is liked, hide the unliked heart */
        .project__like-btn.liked .project__like-heart.unliked {
          display: none !important;
        }

        /* When button is liked, show the liked heart */
        .project__like-btn.liked .project__like-heart.liked:not(.unliked) {
          display: block !important;
        }

        .project__like-btn:hover .project__like-heart {
          transform: scale(1.1);
        }

        .project__like-btn.shimmer {
          position: relative;
          overflow: hidden;
        }

        .project__like-btn.shimmer::after {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.2) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `;
      document.head.appendChild(style);
    }
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
    // Get plot ID from URL
    const pathParts = window.location.pathname.split('/');
    this.plotId = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];
    
    if (!this.plotId) {
      console.error('No plot ID found in URL');
      this.setLoadingState(false);
      return;
    }
    
    // Store plot ID in button's data attribute
    this.button.dataset.plotId = this.plotId;
    
    // Initialize click handler
    this.button.addEventListener('click', async (e) => {
      e.preventDefault();
      
      const isLoggedIn = await window.auth.isUserLoggedIn();
      if (!isLoggedIn) {
        console.log('User needs to login first');
        return;
      }
      
      // Check if we can perform the action based on permissions
      if (this.isFollowing && !this.canUnfollow) {
        console.log('Cannot unfollow - no permission');
        return;
      }
      if (!this.isFollowing && !this.canFollow) {
        console.log('Cannot follow - no permission');
        return;
      }
      
      if (!this.button.classList.contains('loading')) {
        this.toggleFollow();
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
      const data = await this.makeRequest(`/api/v1/plots/${this.plotId}`);
      
      // Update permissions
      this.canFollow = data.data?.permissions?.can_follow || false;
      this.canUnfollow = data.data?.permissions?.can_unfollow || false;
      
      // Update follow state based on permissions
      this.isFollowing = this.canUnfollow;
      
      this.updateUI(data.data?.followers_count || 0, data.data?.followers || []);
    } catch (error) {
      console.error('Error checking follow status:', error);
    } finally {
      this.setLoadingState(false);
    }
  }

  /**
   * Toggle the follow state
   */
  async toggleFollow() {
    try {
      this.button.classList.add('loading');
      
      // Only attempt the action if we have permission
      if ((this.isFollowing && !this.canUnfollow) || (!this.isFollowing && !this.canFollow)) {
        throw new Error('No permission to perform this action');
      }
      
      const endpoint = this.isFollowing ? 'unfollow' : 'follow';
      await this.makeRequest(`/api/v1/plots/${this.plotId}/${endpoint}`, {
        method: 'POST'
      });
      
      // Get updated plot data
      const data = await this.makeRequest(`/api/v1/plots/${this.plotId}`);
      
      // Update permissions and state
      this.canFollow = data.data?.permissions?.can_follow || false;
      this.canUnfollow = data.data?.permissions?.can_unfollow || false;
      this.isFollowing = this.canUnfollow;
      
      this.updateUI(data.data?.followers_count || 0, data.data?.followers || []);

      // Show alert message
      const message = this.isFollowing 
        ? 'Je volgt nu deze kavel!' 
        : 'Je volgt deze kavel niet meer.';
      
      window.alert(message);
      
    } catch (error) {
      console.error('Error toggling follow:', error);
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
   * @param {Array} followers - Array of follower data
   */
  updateUI(count, followers = []) {
    // Update counter
    this.counter.textContent = count.toString();
    
    // Update follow state
    if (this.isFollowing) {
      this.heartIcon.classList.add('liked');
      this.button.classList.add('liked');
    } else {
      this.heartIcon.classList.remove('liked');
      this.button.classList.remove('liked');
    }
    
    // Update button state based on permissions
    this.button.disabled = (!this.canFollow && !this.canUnfollow);

    // Update follower avatars
    this.updateFollowerAvatars(followers);
  }

  /**
   * Update the follower avatars display
   * @param {Array} followers - Array of follower data
   */
  updateFollowerAvatars(followers) {
    const avatarWrapper = document.getElementById('followAvatarWrapper');
    if (!avatarWrapper) return;

    // Hide wrapper if no followers
    if (!followers || followers.length === 0) {
      avatarWrapper.style.display = 'none';
      return;
    }

    // Show wrapper if there are followers
    avatarWrapper.style.display = 'flex';

    // Take the 5 most recent followers
    const recentFollowers = followers.slice(0, 5);
    
    // Create avatar elements
    const avatarHTML = recentFollowers.map(follower => {
      const avatarUrl = follower.avatar_url || 'https://api.crowdbuilding.com/storage/default-avatar.png';
      return `
        <div class="follower-avatar">
          <img src="${avatarUrl}" 
               alt="${follower.name || 'Follower'}" 
               onerror="this.src='https://api.crowdbuilding.com/storage/default-avatar.png'"
               title="${follower.name || 'Follower'}"
          >
        </div>
      `;
    }).join('');

    // Add remaining count if there are more followers
    const remainingCount = followers.length - recentFollowers.length;
    const remainingHTML = remainingCount > 0 
      ? `<div class="follower-avatar remaining-count">+${remainingCount}</div>`
      : '';

    // Update the wrapper content
    avatarWrapper.innerHTML = avatarHTML + remainingHTML;

    // Add styles if not already present
    if (!document.getElementById('follower-avatar-styles')) {
      const style = document.createElement('style');
      style.id = 'follower-avatar-styles';
      style.textContent = `
        #followAvatarWrapper {
          display: flex;
          align-items: center;
          gap: -8px;
        }
        .follower-avatar {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          overflow: hidden;
          border: 2px solid #F2F0EA;
          margin-right: -16px;
        }
        .follower-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      .follower-avatar.remaining-count {
      background: #E0DDD8;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 500;
      }
      `;
      document.head.appendChild(style);
    }
  }
}

// Initialize follow buttons when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('.project__like-btn');
  buttons.forEach(button => new LikeButton(button));
}); 