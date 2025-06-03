// Like Button Handler
class LikeButton {
  constructor(button) {
    this.button = button;
    if (!this.button) return;
    
    this.heartIcon = this.button.querySelector('.project__like-heart');
    this.counter = this.button.querySelector('.project__like-counter');
    
    // Try to get initial state from class
    this.isLiked = this.button.classList.contains('liked');
    
    this.init();
  }

  init() {
    // Get project ID from URL using the same logic as project-get-details.js
    const pathParts = window.location.pathname.split('/');
    this.groupId = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];
    
    if (!this.groupId) {
      console.error('No project ID found in URL');
      return;
    }
    
    // Store group ID in button's data attribute for reference
    this.button.dataset.groupId = this.groupId;
    
    // Initialize click handler
    this.button.addEventListener('click', (e) => {
      e.preventDefault();
      if (!this.button.classList.contains('loading')) {
        this.toggleLike();
      }
    });

    // Apply initial state to button if liked
    if (this.isLiked) {
      this.heartIcon.classList.add('liked');
    }

    // Check initial follow status
    this.checkFollowStatus();
  }

  async checkFollowStatus() {
    try {
      const response = await fetch(`https://api.crowdbuilding.com/api/v1/groups/${this.groupId}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      // Update initial state based on API response
      this.isLiked = data.data.is_following;
      this.updateUI(data.data.followers_count || 0);
      
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  }

  async toggleLike() {
    try {
      // Add loading state
      this.button.classList.add('loading');
      
      const response = await fetch(`https://api.crowdbuilding.com/api/v1/groups/${this.groupId}/follow`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      // Toggle like state
      this.isLiked = !this.isLiked;
      
      // Update UI
      this.updateUI(data.followers_count || 0);
      
    } catch (error) {
      console.error('Error toggling like:', error);
      // Visual feedback for error
      this.button.classList.add('error');
      setTimeout(() => this.button.classList.remove('error'), 2000);
    } finally {
      // Remove loading state
      this.button.classList.remove('loading');
    }
  }

  updateUI(count) {
    // Update the counter
    this.counter.textContent = count;
    
    // Update heart icon state
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
  // Initialize for all like buttons on the page
  document.querySelectorAll('.project__like-btn').forEach(button => {
    new LikeButton(button);
  });
}); 