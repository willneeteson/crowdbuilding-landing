let currentUserId = null;

async function getCurrentUserId() {
    console.log('Getting current user ID...');
    const memberstackId = await window.auth.getCurrentMemberstackId();
    console.log('Retrieved memberstack ID:', memberstackId);
    
    if (memberstackId) {
        currentUserId = memberstackId;
        console.log('Set current user ID to:', currentUserId);
        return currentUserId;
    }
    console.log('No user ID available');
    return null;
}

function showLoadingState(container) {
    container.innerHTML = `
        <div class="post-item loading">
            <div class="loading-spinner"></div>
            <p>Loading posts...</p>
        </div>
    `;
}

function showErrorState(container, message) {
    container.innerHTML = `
        <div class="post-item error">
            <p>${message}</p>
            <button onclick="window.location.reload()">Try Again</button>
        </div>
    `;
}

async function fetchGroupPosts(groupSlug) {
    const container = document.getElementById('groupPosts');
    showLoadingState(container);

    const token = await window.auth.getApiToken();
    const endpoint = `https://api.crowdbuilding.com/api/v1/groups/${groupSlug}/posts`;

    try {
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        renderPosts(data.data);
    } catch (error) {
        console.error('Error fetching group posts:', error);
        showErrorState(container, 'Failed to load posts. Please try again.');
    }
}

async function fetchCommentsForPost(postId) {
    const token = await window.auth.getApiToken();
    const endpoint = `https://api.crowdbuilding.com/api/v1/posts/${postId}/comments`;

    try {
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Error fetching comments for post', postId, error);
        return [];
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

async function toggleLike(postId) {
    const token = await window.auth.getApiToken();
    if (!token) {
        alert('Je moet ingelogd zijn om posts te liken.');
        return;
    }

    try {
        console.log(`Sending like toggle request for post ${postId}`);
        
        const response = await fetch(`https://api.crowdbuilding.com/api/v1/posts/${postId}/like`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        console.log('Like toggle full response:', JSON.stringify(data)); // Full response log
        
        // Get the updated post data
        const updatedPost = data.data;
        console.log('Updated post:', JSON.stringify(updatedPost)); // Log the post data
        
        // Determine if the post is now liked
        let isLiked = false;
        
        // Check if the current user's ID is in the likes array
        if (updatedPost.likes && Array.isArray(updatedPost.likes)) {
            isLiked = updatedPost.likes.some(like => {
                // The like object might have the user ID in different properties
                const likeUserId = like.id || like.user_id || (like.created_by && like.created_by.id);
                return likeUserId === currentUserId;
            });
            console.log(`Determined like status from likes array: ${isLiked}`);
        }
        
        // Double-check with the message if available
        if (data.message) {
            const unlikeIndication = data.message.toLowerCase().includes('niet meer') || 
                                     data.message.toLowerCase().includes('unlike') ||
                                     data.message.toLowerCase().includes('removed');
                                     
            const likeIndication = data.message.toLowerCase().includes('vindt post') || 
                                  data.message.toLowerCase().includes('liked') ||
                                  data.message.toLowerCase().includes('added like');
            
            if (unlikeIndication) {
                console.log('Message indicates post was UNliked');
                isLiked = false;
            } else if (likeIndication) {
                console.log('Message indicates post was liked');
                isLiked = true;
            }
        }
        
        console.log(`Post ${postId} final like status: ${isLiked}, likes_count: ${updatedPost.likes_count}`);
        
        // Update UI for all instances of this post's like button
        updateLikeButtonState(postId, isLiked, updatedPost.likes_count);
        
        return updatedPost;
    } catch (error) {
        console.error('Error toggling like:', error);
        throw error;
    }
}

function renderPosts(posts) {
    const container = document.getElementById('groupPosts');
    container.innerHTML = '';

    // Create modal container if it doesn't exist
    if (!document.getElementById('postModal')) {
        const modalHtml = `
            <div id="postModal" class="post-modal-overlay">
                <div class="post-modal">
                    <div class="post-modal-header">
                        <div class="post-modal-title"></div>
                        <button class="post-modal-close">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
                            </svg>
                        </button>
                    </div>
                    <div class="post-modal-content"></div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    console.log('Rendering posts, currentUserId:', currentUserId);

    posts.forEach(post => {
        const postElement = document.createElement('article');
        postElement.className = 'post-item';
        postElement.setAttribute('data-post-id', post.id);

        const likeAvatars = post.likes.map(like =>
            `<img class="like-avatar" src="${like.avatar_url}" alt="Like by user">`
        ).join('');

        const postImages = post.images?.length
            ? post.images.map(img =>
                `<div class="post-image">
                    <img src="${img.original_url}" alt="${img.name || ''}">
                </div>`
            ).join('')
            : '';

        const canDelete = post.permissions?.can_delete || post.created_by?.id === currentUserId;
        
        // Determine if this post is liked
        // First check the explicit property if available
        let isLiked = false;
        
        // Check if the current user's ID is in the likes array
        if (post.likes && Array.isArray(post.likes)) {
            isLiked = post.likes.some(like => {
                // The like object might have the user ID in different properties
                return (
                    like.id === currentUserId ||
                    like.user_id === currentUserId ||
                    (like.created_by && like.created_by.id === currentUserId) ||
                    (like.user && like.user.id === currentUserId)
                );
            });
        }
        
        console.log('Post', post.id, 'isLiked:', isLiked, 'likes_count:', post.likes_count, 'Likes:', JSON.stringify(post.likes)); // Debug log

        const menuHtml = canDelete ? `
            <div class="post-menu">
                <button class="post-menu-button" data-post-id="${post.id}">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="6" r="2" fill="currentColor"/>
                        <circle cx="12" cy="12" r="2" fill="currentColor"/>
                        <circle cx="12" cy="18" r="2" fill="currentColor"/>
                    </svg>
                </button>
                <div class="post-menu-dropdown" data-post-id="${post.id}">
                    <button class="post-menu-item delete" data-post-id="${post.id}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
                        </svg>
                        Delete Post
                    </button>
                </div>
            </div>
        ` : '';

        // Create the post element with image for heart instead of SVG
        postElement.innerHTML = `
            ${menuHtml}
            <div class="post-header">
                <img class="post-avatar" src="${post.created_by.avatar_url}" alt="${post.created_by.name}">
                <div class="post-meta">
                    <h4 class="post-author">${post.created_by.name}</h4>
                    <time datetime="${post.created_at}">${formatDate(post.created_at)}</time>
                </div>
            </div>
            <div class="post-body">
                <p>${post.body}</p>
                ${postImages}
            </div>
            <div class="post-footer">
                <button class="post-like-button ${isLiked ? 'liked' : ''}" data-post-id="${post.id}" data-liked="${isLiked ? 'true' : 'false'}">
                    <img class="heart-icon" width="24" height="24" src="${isLiked ? 
                        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMjEuMzVsLTEuNDUtMS4zMkM1LjQgMTUuMzYgMiAxMi4yOCAyIDguNSAyIDUuNDIgNC40MiAzIDcuNSAzYzEuNzQgMCAzLjQxLjgxIDQuNSAyLjA5QzEzLjA5IDMuODEgMTQuNzYgMyAxNi41IDMgMTkuNTggMyAyMiA1LjQyIDIyIDguNWMwIDMuNzgtMy40IDYuODYtOC41NSAxMS41NEwxMiAyMS4zNXoiIGZpbGw9IiNlNzRjM2MiIHN0cm9rZT0iI2U3NGMzYyIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+' : 
                        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMjEuMzVsLTEuNDUtMS4zMkM1LjQgMTUuMzYgMiAxMi4yOCAyIDguNSAyIDUuNDIgNC40MiAzIDcuNSAzYzEuNzQgMCAzLjQxLjgxIDQuNSAyLjA5QzEzLjA5IDMuODEgMTQuNzYgMyAxNi41IDMgMTkuNTggMyAyMiA1LjQyIDIyIDguNWMwIDMuNzgtMy40IDYuODYtOC41NSAxMS41NEwxMiAyMS4zNXoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4='}" 
                    alt="${isLiked ? 'Liked' : 'Not liked'}">
                    <span class="like-count">${post.likes_count}</span>
                </button>
                <div class="post-comments-count" data-post-id="${post.id}">
                    <span>${post.comments_count} comment${post.comments_count !== 1 ? 's' : ''}</span>
                </div>
            </div>
        `;

        container.appendChild(postElement);
    });

    attachPostClickHandlers();
    attachMenuHandlers();
    attachLikeHandlers();
}

function renderComments(comments, container) {
    container.innerHTML = '';

    if (comments.length === 0) {
        container.innerHTML = `<div class="comment-item empty">No comments yet.</div>`;
        return;
    }

    comments.forEach(comment => {
        const commentElement = document.createElement('div');
        commentElement.className = 'comment-item';

        commentElement.innerHTML = `
            <img class="post-avatar" src="${comment.created_by.avatar_url}" alt="${comment.created_by.name}">
            <div class="comment-content">
                <h5>${comment.created_by.name}</h5>
                <p>${comment.body}</p>
                <time datetime="${comment.created_at}">${formatDate(comment.created_at)}</time>
            </div>
        `;

        container.appendChild(commentElement);
    });
}

async function submitComment(postId, commentText) {
    const token = await window.auth.getApiToken();
    if (!token) {
        alert('You must be logged in to comment.');
        return;
    }

    try {
        const response = await fetch(`https://api.crowdbuilding.com/api/v1/posts/${postId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ body: commentText })
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error submitting comment:', error);
        throw error;
    }
}

function createCommentForm(postId) {
    const form = document.createElement('form');
    form.className = 'comment-form';
    form.innerHTML = `
        <textarea placeholder="Reageer..." required></textarea>
        <button type="submit">Verstuur</button>
    `;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const textarea = form.querySelector('textarea');
        const button = form.querySelector('button');
        const commentText = textarea.value.trim();

        if (!commentText) return;

        // Disable form while submitting
        textarea.disabled = true;
        button.disabled = true;
        button.textContent = 'Versturen...';

        try {
            const newComment = await submitComment(postId, commentText);
            
            // Add the new comment to the list
            const commentsList = document.getElementById(`modal-comments-${postId}`);
            const commentElement = document.createElement('div');
            commentElement.className = 'comment-item';
            commentElement.innerHTML = `
                <img class="post-avatar" src="${newComment.created_by.avatar_url}" alt="${newComment.created_by.name}">
                <div class="comment-content">
                    <h5>${newComment.created_by.name}</h5>
                    <p>${newComment.body}</p>
                    <time datetime="${newComment.created_at}">${formatDate(newComment.created_at)}</time>
                </div>
            `;
            commentsList.appendChild(commentElement);

            // Clear and re-enable form
            textarea.value = '';
            textarea.disabled = false;
            button.disabled = false;
            button.textContent = 'Verstuur';

            // Update comment count in the main post list
            const postElement = document.querySelector(`.post-item[data-post-id="${postId}"]`);
            if (postElement) {
                const commentsCount = postElement.querySelector('.post-comments-count span');
                const currentCount = parseInt(commentsCount.textContent);
                commentsCount.textContent = `${currentCount + 1} comment${currentCount + 1 !== 1 ? 's' : ''}`;
            }
        } catch (error) {
            alert('Failed to post comment. Please try again.');
            textarea.disabled = false;
            button.disabled = false;
            button.textContent = 'Verstuur';
        }
    });

    return form;
}

function attachPostClickHandlers() {
    // Handle post clicks to open modal
    document.querySelectorAll('.post-item').forEach(post => {
        post.addEventListener('click', async (e) => {
            // Don't open modal if clicking menu or its children
            if (e.target.closest('.post-menu')) return;
            
            const postId = post.getAttribute('data-post-id');
            const modal = document.getElementById('postModal');
            const modalContent = modal.querySelector('.post-modal-content');
            const modalTitle = modal.querySelector('.post-modal-title');
            
            // Get author name from the post
            const authorName = post.querySelector('.post-author').textContent;
            modalTitle.textContent = `${authorName}'s bericht`;
            
            // Clone the post content
            const postContent = post.cloneNode(true);
            
            // Add comments section
            const commentsList = document.createElement('div');
            commentsList.className = 'post-comments-list';
            commentsList.id = `modal-comments-${postId}`;
            postContent.appendChild(commentsList);
            
            // Add comment form
            const commentForm = createCommentForm(postId);
            
            // Update modal content
            modalContent.innerHTML = '';
            modalContent.appendChild(postContent);
            modalContent.appendChild(commentForm);
            
            // Show modal
            modal.classList.add('show');
            
            // Load comments
            const comments = await fetchCommentsForPost(postId);
            renderComments(comments, commentsList);
        });
    });

    // Handle modal close button
    document.querySelector('.post-modal-close').addEventListener('click', () => {
        document.getElementById('postModal').classList.remove('show');
    });

    // Close modal when clicking outside
    document.getElementById('postModal').addEventListener('click', (e) => {
        if (e.target.id === 'postModal') {
            e.target.classList.remove('show');
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.getElementById('postModal').classList.remove('show');
        }
    });
}

function attachMenuHandlers() {
    // Handle menu button clicks
    document.querySelectorAll('.post-menu-button').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const postId = button.getAttribute('data-post-id');
            const dropdown = document.querySelector(`.post-menu-dropdown[data-post-id="${postId}"]`);
            
            // Close all other dropdowns
            document.querySelectorAll('.post-menu-dropdown.show').forEach(d => {
                if (d !== dropdown) d.classList.remove('show');
            });
            
            dropdown.classList.toggle('show');
        });
    });

    // Handle delete button clicks
    document.querySelectorAll('.post-menu-item.delete').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const postId = button.getAttribute('data-post-id');
            if (confirm('Are you sure you want to delete this post?')) {
                deletePost(postId);
            }
        });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
        document.querySelectorAll('.post-menu-dropdown.show').forEach(dropdown => {
            dropdown.classList.remove('show');
        });
    });
}

async function deletePost(postId) {
    const postElement = document.querySelector(`[data-post-id="${postId}"]`).closest('.post-item');
    const originalContent = postElement.innerHTML;
    
    // Show loading state
    postElement.innerHTML = `
        <div class="post-item loading">
            <div class="loading-spinner"></div>
            <p>Deleting post...</p>
        </div>
    `;

    const groupSlug = 'tiny-house-alkmaar'; // Replace this dynamically if needed
    const token = await window.auth.getApiToken();

    if (!token) {
        alert('You are not signed in.');
        postElement.innerHTML = originalContent;
        return;
    }

    try {
        const response = await fetch(`https://api.crowdbuilding.com/api/v1/groups/${groupSlug}/posts/${postId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        console.log('Post deleted:', data);
        
        // Remove the post element with a fade out animation
        postElement.style.opacity = '0';
        postElement.style.transition = 'opacity 0.3s ease-out';
        setTimeout(() => postElement.remove(), 300);
    } catch (error) {
        console.error('Error deleting post:', error);
        postElement.innerHTML = originalContent;
        alert('Failed to delete post. Please try again.');
    }
}

function attachLikeHandlers() {
    document.querySelectorAll('.post-like-button').forEach(button => {
        // Remove any existing event listeners to avoid duplicates
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        newButton.addEventListener('click', async (e) => {
            e.stopPropagation(); // Prevent modal from opening
            const postId = newButton.getAttribute('data-post-id');
            
            try {
                const updatedPost = await toggleLike(postId);
                
                // Check if the current user is in the likes array
                const isLiked = updatedPost.likes && updatedPost.likes.some(like => like.id === currentUserId);
                console.log('Post', postId, 'isLiked:', isLiked, 'currentUserId:', currentUserId);
                
                // Update both the main post and modal post (if open)
                updateLikeButtonState(postId, isLiked, updatedPost.likes_count);
            } catch (error) {
                console.error('Error toggling like:', error);
                alert('Failed to update like. Please try again.');
            }
        });
    });
}

// Helper function to update like button state in all instances
function updateLikeButtonState(postId, isLiked, likeCount) {
    console.log(`Updating button state for post ${postId}: isLiked=${isLiked}, likeCount=${likeCount}`);
    
    // Update all buttons for this post (both in list and modal if open)
    const buttons = document.querySelectorAll(`.post-like-button[data-post-id="${postId}"]`);
    console.log(`Found ${buttons.length} buttons to update`);
    
    buttons.forEach((button, index) => {
        // Update the like count
        const countElement = button.querySelector('.like-count');
        if (countElement) {
            countElement.textContent = likeCount;
        }
        
        // Update the like button class
        if (isLiked) {
            button.classList.add('liked');
            button.setAttribute('data-liked', 'true');
        } else {
            button.classList.remove('liked');
            button.setAttribute('data-liked', 'false');
        }
        
        // Replace SVG with an image element for better compatibility
        replaceHeartWithImage(button, isLiked);
    });
    
    // Add an extra heart check to the document
    document.documentElement.setAttribute('data-post-' + postId + '-liked', isLiked ? 'true' : 'false');
}

// Replace the SVG with an image element instead
function replaceHeartWithImage(button, isLiked) {
    // First, try to find and remove any existing heart (SVG or image)
    const existingHeart = button.querySelector('svg, img.heart-icon');
    if (existingHeart) {
        existingHeart.remove();
    }
    
    // Create a new image element
    const heartImg = document.createElement('img');
    heartImg.className = 'heart-icon';
    heartImg.width = 24;
    heartImg.height = 24;
    
    // Set source based on liked state
    if (isLiked) {
        heartImg.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMjEuMzVsLTEuNDUtMS4zMkM1LjQgMTUuMzYgMiAxMi4yOCAyIDguNSAyIDUuNDIgNC40MiAzIDcuNSAzYzEuNzQgMCAzLjQxLjgxIDQuNSAyLjA5QzEzLjA5IDMuODEgMTQuNzYgMyAxNi41IDMgMTkuNTggMyAyMiA1LjQyIDIyIDguNWMwIDMuNzgtMy40IDYuODYtOC41NSAxMS41NEwxMiAyMS4zNXoiIGZpbGw9IiNlNzRjM2MiIHN0cm9rZT0iI2U3NGMzYyIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+';
        heartImg.alt = 'Liked';
    } else {
        heartImg.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMjEuMzVsLTEuNDUtMS4zMkM1LjQgMTUuMzYgMiAxMi4yOCAyIDguNSAyIDUuNDIgNC40MiAzIDcuNSAzYzEuNzQgMCAzLjQxLjgxIDQuNSAyLjA5QzEzLjA5IDMuODEgMTQuNzYgMyAxNi41IDMgMTkuNTggMyAyMiA1LjQyIDIyIDguNWMwIDMuNzgtMy40IDYuODYtOC41NSAxMS41NEwxMiAyMS4zNXoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=';
        heartImg.alt = 'Not liked';
    }
    
    // Insert the image at the beginning of the button
    button.insertBefore(heartImg, button.firstChild);
}

// Add a global function to fix all hearts
window.fixAllHearts = function() {
    console.log('Manual heart fix triggered');
    document.querySelectorAll('.post-like-button').forEach(button => {
        const isLiked = button.classList.contains('liked');
        replaceHeartWithImage(button, isLiked);
    });
};

// Apply hearts fix on DOM load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(window.fixAllHearts, 500);
    setTimeout(window.fixAllHearts, 1500);
});

// Make these functions available globally for newly created posts
window.attachLikeHandlers = attachLikeHandlers;
window.attachPostClickHandlers = attachPostClickHandlers;
window.attachMenuHandlers = attachMenuHandlers;

// Initialise
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Add a style tag to force heart icons to display correctly
        const styleTag = document.createElement('style');
        styleTag.innerHTML = `
            .post-like-button.liked svg path {
                fill: #e74c3c !important;
                stroke: #e74c3c !important;
            }
            .post-like-button:not(.liked) svg path {
                fill: none !important;
                stroke: currentColor !important;
            }
        `;
        document.head.appendChild(styleTag);
        
        // Get current user ID
        currentUserId = await window.auth.getCurrentMemberstackId();
        console.log('Initialized with user ID:', currentUserId);
        
        // Only fetch posts if we have a user
        if (currentUserId) {
            fetchGroupPosts('tiny-house-alkmaar');
            
            // Wait a bit and then ensure all heart icons are properly filled
            setTimeout(fixAllHeartIcons, 1000);
            
            // Add direct document-level event listener for like buttons
            addDirectLikeClickHandler();
        } else {
            console.log('User not logged in, not fetching posts');
            const container = document.getElementById('groupPosts');
            if (container) {
                container.innerHTML = '<div class="post-item">Please log in to view posts.</div>';
            }
        }
    } catch (error) {
        console.error('Error during initialization:', error);
        const container = document.getElementById('groupPosts');
        if (container) {
            container.innerHTML = '<div class="post-item">Error loading posts. Please try again later.</div>';
        }
    }
});

// Function to fix all heart icons
function fixAllHeartIcons() {
    console.log('Fixing all heart icons');
    document.querySelectorAll('.post-item').forEach(post => {
        const postId = post.getAttribute('data-post-id');
        const likeButton = post.querySelector('.post-like-button');
        
        if (likeButton) {
            const likeCountElement = likeButton.querySelector('.like-count');
            const likeCount = likeCountElement ? parseInt(likeCountElement.textContent) || 0 : 0;
            
            // If there are likes, check if the current user has liked it
            if (likeCount > 0) {
                // We need to explicitly check if this post is liked by requesting its data
                checkPostLikeStatus(postId).then(isLiked => {
                    if (isLiked) {
                        console.log(`Post ${postId} is liked by current user, updating UI`);
                        likeButton.classList.add('liked');
                        const heartIcon = likeButton.querySelector('img.heart-icon');
                        if (heartIcon) {
                            heartIcon.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMjEuMzVsLTEuNDUtMS4zMkM1LjQgMTUuMzYgMiAxMi4yOCAyIDguNSAyIDUuNDIgNC40MiAzIDcuNSAzYzEuNzQgMCAzLjQxLjgxIDQuNSAyLjA5QzEzLjA5IDMuODEgMTQuNzYgMyAxNi41IDMgMTkuNTggMyAyMiA1LjQyIDIyIDguNWMwIDMuNzgtMy40IDYuODYtOC41NSAxMS41NEwxMiAyMS4zNXoiIGZpbGw9IiNlNzRjM2MiIHN0cm9rZT0iI2U3NGMzYyIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+';
                            heartIcon.alt = 'Liked';
                        }
                    }
                }).catch(error => {
                    console.error(`Error checking like status for post ${postId}:`, error);
                });
            }
            
            // Also update based on class
            const isLiked = likeButton.classList.contains('liked');
            const heartIcon = likeButton.querySelector('img.heart-icon');
            
            console.log(`Post ${postId} - isLiked class: ${isLiked}, likeCount: ${likeCount}`);
            
            if (isLiked && heartIcon) {
                console.log(`Fixing heart icon for post ${postId}`);
                heartIcon.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMjEuMzVsLTEuNDUtMS4zMkM1LjQgMTUuMzYgMiAxMi4yOCAyIDguNSAyIDUuNDIgNC40MiAzIDcuNSAzYzEuNzQgMCAzLjQxLjgxIDQuNSAyLjA5QzEzLjA5IDMuODEgMTQuNzYgMyAxNi41IDMgMTkuNTggMyAyMiA1LjQyIDIyIDguNWMwIDMuNzgtMy40IDYuODYtOC41NSAxMS41NEwxMiAyMS4zNXoiIGZpbGw9IiNlNzRjM2MiIHN0cm9rZT0iI2U3NGMzYyIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+';
                heartIcon.alt = 'Liked';
            }
        }
    });
}

// Function to check if a post is liked by the current user
async function checkPostLikeStatus(postId) {
    const token = await window.auth.getApiToken();
    if (!token) return false;

    try {
        const response = await fetch(`https://api.crowdbuilding.com/api/v1/posts/${postId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        const post = data.data;
        
        console.log(`Post ${postId} details:`, JSON.stringify(post));
        
        // Check if the post is liked by the current user
        let isLiked = false;
        
        // Check if the current user's ID is in the likes array
        if (post.likes && Array.isArray(post.likes)) {
            isLiked = post.likes.some(like => {
                // The like object might have the user ID in different properties
                const likeUserId = like.id || like.user_id || 
                                  (like.created_by && like.created_by.id) || 
                                  (like.user && like.user.id);
                return likeUserId === currentUserId;
            });
        }
        
        console.log(`Post ${postId} like status check - isLiked: ${isLiked} (from likes array), likes_count: ${post.likes_count}`);
        return isLiked;
    } catch (error) {
        console.error(`Error checking post ${postId}:`, error);
        return false;
    }
}

// Add a direct document-level click handler for all like buttons
function addDirectLikeClickHandler() {
    console.log('Adding direct document-level like button handler');
    
    // Remove any existing handler with the same name
    document.removeEventListener('click', handleLikeButtonClick);
    
    // Add the click handler to the entire document
    document.addEventListener('click', handleLikeButtonClick);
}

// Handler function for like button clicks
function handleLikeButtonClick(event) {
    // Find if the click was on a like button or its child elements
    const likeButton = event.target.closest('.post-like-button');
    if (!likeButton) return; // Not a like button click
    
    // Prevent event propagation
    event.preventDefault();
    event.stopPropagation();
    
    const postId = likeButton.getAttribute('data-post-id');
    if (!postId) return; // No post ID found
    
    console.log(`Direct handler: Like button clicked for post ${postId}`);
    
    // Toggle the like status through the API
    toggleLike(postId).catch(error => {
        console.error(`Error toggling like for post ${postId}:`, error);
        alert('Failed to update like status. Please try again.');
    });
}