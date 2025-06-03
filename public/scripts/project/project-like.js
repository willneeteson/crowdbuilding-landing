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
    // Get the group ID from the button's data attribute or URL
    this.groupId = this.button.dataset.groupId;
    
    // If no group ID in data attribute, try to get it from URL
    if (!this.groupId) {
      const urlParams = new URLSearchParams(window.location.search);
      this.groupId = urlParams.get('group') || urlParams.get('groupId');
      
      // If found in URL, set it as data attribute
      if (this.groupId) {
        this.button.dataset.groupId = this.groupId;
      } else {
        console.error('No group ID found for like button');
        return;
      }
    }
    
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
  }

  async toggleLike() {
    try {
      // Add loading state
      this.button.classList.add('loading');
      
      const response = await fetch(`/groups/${this.groupId}/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include' // Include cookies if needed for authentication
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      // Toggle like state
      this.isLiked = !this.isLiked;
      
      // Update UI
      this.updateUI(data.followersCount || 0);
      
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