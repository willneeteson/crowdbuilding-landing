// User Profile Hover Card functionality
document.addEventListener('DOMContentLoaded', function() {
  // Cache for storing user data to avoid repeated API calls
  const userDataCache = new Map();
  
  // Create the hover card element that will be reused
  const hoverCard = document.createElement('div');
  hoverCard.className = 'user-hover-card';
  hoverCard.innerHTML = `
    <div class="user-hover-card-header">
      <img class="user-hover-card-avatar" src="" alt="User avatar">
      <h4 class="user-hover-card-name"></h4>
    </div>
    <div class="user-hover-card-info">
      <p class="user-hover-card-region"></p>
    </div>
    <div class="user-hover-card-stats">
      <div class="user-hover-card-stat">
        <div class="user-hover-card-stat-value" id="user-posts-count">-</div>
        <div class="user-hover-card-stat-label">Posts</div>
      </div>
      <div class="user-hover-card-stat">
        <div class="user-hover-card-stat-value" id="user-comments-count">-</div>
        <div class="user-hover-card-stat-label">Comments</div>
      </div>
      <div class="user-hover-card-stat">
        <div class="user-hover-card-stat-value" id="user-likes-count">-</div>
        <div class="user-hover-card-stat-label">Likes</div>
      </div>
    </div>
  `;
  document.body.appendChild(hoverCard);
  
  // Track mouse position for positioning the hover card
  let mouseX = 0;
  let mouseY = 0;
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });
  
  // Debounce function to limit API calls
  function debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }
  
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
  
  // Fetch user data from the API
  async function fetchUserData(userId) {
    if (!userId) return null;
    
    if (userDataCache.has(userId)) {
      return userDataCache.get(userId);
    }
    
    try {
      const token = await window.auth.getApiToken();
      const response = await fetch(`https://api.crowdbuilding.com/api/v1/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
      });
      
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      
      const data = await response.json();
      userDataCache.set(userId, data.data);
      return data.data;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }
  
  // Show the hover card
  function showHoverCard(userData) {
    if (!userData) return;
    
    // Update hover card content
    const avatar = hoverCard.querySelector('.user-hover-card-avatar');
    const name = hoverCard.querySelector('.user-hover-card-name');
    const region = hoverCard.querySelector('.user-hover-card-region');
    const postsCount = hoverCard.querySelector('#user-posts-count');
    const commentsCount = hoverCard.querySelector('#user-comments-count');
    const likesCount = hoverCard.querySelector('#user-likes-count');
    
    avatar.src = userData.avatar_url || 'https://cdn.prod.website-files.com/66dffceb975388322f140196/6810dfceaa06e55034a48587_cb_placeholder-avatar.svg';
    avatar.alt = userData.name;
    name.textContent = userData.name;
    
    // Set region if available
    if (userData.region && userData.region.name) {
      region.textContent = `Region: ${userData.region.name}`;
      region.style.display = 'block';
    } else {
      region.style.display = 'none';
    }
    
    // Set stats if available
    postsCount.textContent = userData.posts_count || '-';
    commentsCount.textContent = userData.comments_count || '-';
    likesCount.textContent = userData.likes_count || '-';
    
    // Position the hover card near the cursor
    const windowWidth = window.innerWidth;
    const cardWidth = 280; // Width of the hover card as defined in CSS
    
    // Position horizontally to avoid going off screen
    let leftPos = mouseX + 15;
    if (leftPos + cardWidth > windowWidth - 20) {
      leftPos = mouseX - cardWidth - 15;
    }
    
    hoverCard.style.left = `${leftPos}px`;
    hoverCard.style.top = `${mouseY + 15}px`;
    
    // Show the hover card
    hoverCard.classList.add('show');
  }
  
  // Hide the hover card
  function hideHoverCard() {
    hoverCard.classList.remove('show');
  }
  
  // Attach hover events and click events to user elements
  function attachHoverEvents() {
    console.log('Attaching user hover events and click functionality');
    
    // Target all post authors and comment authors
    const userElements = document.querySelectorAll('.post-author, .comment-item .comment-content h5');
    
    userElements.forEach(element => {
      // Add the hover trigger class
      element.classList.add('user-hover-trigger');
      
      // Attach mouse events
      const debouncedShowCard = debounce(async () => {
        const userId = findUserId(element);
        if (userId) {
          const userData = await fetchUserData(userId);
          showHoverCard(userData);
        }
      }, 300);
      
      // Remove existing event listeners if any (to prevent duplicates)
      element.removeEventListener('mouseenter', element._debouncedShowCard);
      element.removeEventListener('mouseleave', hideHoverCard);
      element.removeEventListener('click', element._handleUserClick);
      
      // Save reference to the debounced function for later removal
      element._debouncedShowCard = debouncedShowCard;
      
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
      
      element.addEventListener('mouseenter', debouncedShowCard);
      element.addEventListener('mouseleave', hideHoverCard);
      element.addEventListener('click', handleUserClick);
      
      // Make it clear this is clickable
      element.style.cursor = 'pointer';
    });
    
    // Also attach to avatar images
    const avatarElements = document.querySelectorAll('.post-avatar, .comment-avatar');
    
    avatarElements.forEach(element => {
      // Add the hover trigger class
      element.classList.add('user-hover-trigger');
      
      // Attach mouse events
      const debouncedShowCard = debounce(async () => {
        const userId = findUserId(element);
        if (userId) {
          const userData = await fetchUserData(userId);
          showHoverCard(userData);
        }
      }, 300);
      
      // Remove existing event listeners if any (to prevent duplicates)
      element.removeEventListener('mouseenter', element._debouncedShowCard);
      element.removeEventListener('mouseleave', hideHoverCard);
      element.removeEventListener('click', element._handleUserClick);
      
      // Save reference to the debounced function for later removal
      element._debouncedShowCard = debouncedShowCard;
      
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
      
      element.addEventListener('mouseenter', debouncedShowCard);
      element.addEventListener('mouseleave', hideHoverCard);
      element.addEventListener('click', handleUserClick);
      
      // Make it clear this is clickable
      element.style.cursor = 'pointer';
    });
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
  
  // Initial setup
  function init() {
    populateAuthorMaps();
    attachHoverEvents();
    
    // Re-attach hover events when posts are loaded or modal is shown
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.addedNodes.length) {
          setTimeout(() => {
            populateAuthorMaps();
            attachHoverEvents();
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
  
  // Expose functions to re-attach hover events when new content is loaded
  window.attachUserHoverEvents = attachHoverEvents;
  window.populateUserAuthorMaps = populateAuthorMaps;
}); 