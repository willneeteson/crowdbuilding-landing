// User Profile Click Navigation
document.addEventListener('DOMContentLoaded', function() {
  // Try to find user ID from post/comment element
  function findUserId(element) {
    // Check if element itself has the user ID
    let userId = element.getAttribute('data-user-id');
    if (userId) return userId;
    
    // Try to find it in the parent elements
    const userIdElement = element.closest('[data-user-id]');
    if (userIdElement) return userIdElement.getAttribute('data-user-id');
    
    // If it's a post author, try to get from post element
    if (element.classList.contains('post-author')) {
      const postElement = element.closest('.post-item');
      if (postElement) {
        const postId = postElement.getAttribute('data-post-id');
        // Store a mapping of post ID to user ID when posts are rendered
        return window.postAuthorMap?.[postId];
      }
    }
    
    // If it's a comment author, try similar approach
    if (element.closest('.comment-item')) {
      const commentElement = element.closest('.comment-item');
      const commentId = commentElement?.getAttribute('data-comment-id');
      return window.commentAuthorMap?.[commentId];
    }
    
    return null;
  }
  
  // Track post authors by creating a map from post ID to author ID
  window.postAuthorMap = window.postAuthorMap || {};
  window.commentAuthorMap = window.commentAuthorMap || {};
  
  // Populate the author maps from existing posts
  function populateAuthorMaps() {
    document.querySelectorAll('.post-item').forEach(post => {
      const postId = post.getAttribute('data-post-id');
      const authorElement = post.querySelector('.post-author');
      if (postId && authorElement) {
        const userId = authorElement.getAttribute('data-user-id');
        if (userId) {
          window.postAuthorMap[postId] = userId;
        }
      }
    });
    
    document.querySelectorAll('.comment-item').forEach(comment => {
      const commentId = comment.getAttribute('data-comment-id');
      const authorElement = comment.querySelector('h5');
      if (commentId && authorElement) {
        const userId = authorElement.getAttribute('data-user-id');
        if (userId) {
          window.commentAuthorMap[commentId] = userId;
        }
      }
    });
  }
  
  // Attach click events to user elements
  function attachClickEvents() {
    console.log('Attaching user click functionality');
    
    // Target all post authors and comment authors
    const userElements = document.querySelectorAll('.post-author, .comment-item .comment-content h5');
    
    userElements.forEach(element => {
      // Remove existing event listeners if any (to prevent duplicates)
      element.removeEventListener('click', element._handleUserClick);
      
      // Add click handler to navigate to user profile
      const handleUserClick = (e) => {
        const userId = findUserId(element);
        if (userId) {
          e.preventDefault();
          e.stopPropagation();
          // Navigate to user profile page
          window.location.href = `/user?id=${userId}`;
        }
      };
      
      // Save reference to click handler
      element._handleUserClick = handleUserClick;
      
      element.addEventListener('click', handleUserClick);
      
      // Make it clear this is clickable
      element.style.cursor = 'pointer';
    });
    
    // Also attach to avatar images
    const avatarElements = document.querySelectorAll('.post-avatar, .comment-avatar');
    
    avatarElements.forEach(element => {
      // Remove existing event listeners if any (to prevent duplicates)
      element.removeEventListener('click', element._handleUserClick);
      
      // Add click handler to navigate to user profile
      const handleUserClick = (e) => {
        const userId = findUserId(element);
        if (userId) {
          e.preventDefault();
          e.stopPropagation();
          // Navigate to user profile page
          window.location.href = `/user?id=${userId}`;
        }
      };
      
      // Save reference to click handler
      element._handleUserClick = handleUserClick;
      
      element.addEventListener('click', handleUserClick);
      
      // Make it clear this is clickable
      element.style.cursor = 'pointer';
    });
  }
  
  // Initial setup
  function init() {
    populateAuthorMaps();
    attachClickEvents();
    
    // Re-attach click events when posts are loaded or modal is shown
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.addedNodes.length) {
          setTimeout(() => {
            populateAuthorMaps();
            attachClickEvents();
          }, 100);
        }
      });
    });
    
    // Observe changes to the posts container and modal
    const postsContainer = document.getElementById('groupPosts');
    const modalContainer = document.getElementById('postModal');
    
    if (postsContainer) {
      observer.observe(postsContainer, { childList: true, subtree: true });
    }
    
    if (modalContainer) {
      observer.observe(modalContainer, { childList: true, subtree: true });
    }
  }
  
  // Initialize after everything else is loaded
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    // If DOM is already loaded, initialize right away
    setTimeout(init, 500);
  } else {
    // Otherwise wait for DOMContentLoaded
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 500));
  }
  
  // Also initialize when the window is fully loaded to catch any late elements
  window.addEventListener('load', () => setTimeout(init, 1000));
  
  // Expose functions for external use
  window.attachUserClickEvents = attachClickEvents;
  window.populateUserAuthorMaps = populateAuthorMaps;
}); 