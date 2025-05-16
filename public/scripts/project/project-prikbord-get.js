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
        const response = await fetch(`https://api.crowdbuilding.com/api/v1/posts/${postId}/like`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        console.log('Like toggle response:', data); // Debug log
        
        // Force update UI directly after API call
        const updatedPost = data.data;
        const isLiked = updatedPost.likes && updatedPost.likes.some(like => like.id === currentUserId);
        
        // Get all buttons for this post and update them
        const buttons = document.querySelectorAll(`.post-like-button[data-post-id="${postId}"]`);
        buttons.forEach(button => {
            // Update button state
            if (isLiked) {
                button.classList.add('liked');
            } else {
                button.classList.remove('liked');
            }
            
            // Update like count
            const likeCount = button.querySelector('.like-count');
            if (likeCount) {
                likeCount.textContent = updatedPost.likes_count;
            }
            
            // IMPORTANT: Explicitly update heart fill
            const heartIcon = button.querySelector('svg path');
            if (heartIcon) {
                console.log(`Setting heart fill to ${isLiked ? 'currentColor' : 'none'} for post ${postId}`);
                heartIcon.setAttribute('fill', isLiked ? 'currentColor' : 'none');
                
                // Double check that the fill attribute is set
                setTimeout(() => {
                    const currentFill = heartIcon.getAttribute('fill');
                    console.log(`Current fill for post ${postId}: ${currentFill}`);
                    if (isLiked && currentFill !== 'currentColor') {
                        console.log(`Forcing heart fill for post ${postId}`);
                        heartIcon.setAttribute('fill', 'currentColor');
                    }
                }, 100);
            }
        });
        
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
        const isLiked = post.likes && post.likes.some(like => like.id === currentUserId);
        console.log('Post', post.id, 'isLiked:', isLiked, 'Likes:', post.likes); // Debug log

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

        // Create the post element without the SVG to avoid issues with fill attribute
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
                <button class="post-like-button ${isLiked ? 'liked' : ''}" data-post-id="${post.id}">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                            stroke="currentColor" stroke-width="2"
                            fill="${isLiked ? 'currentColor' : 'none'}"/>
                    </svg>
                    <span class="like-count">${post.likes_count}</span>
                </button>
                <div class="post-comments-count" data-post-id="${post.id}">
                    <span>${post.comments_count} comment${post.comments_count !== 1 ? 's' : ''}</span>
                </div>
            </div>
        `;

        container.appendChild(postElement);

        // Explicitly set the fill attribute for the heart icon
        if (isLiked) {
            const heartIcon = postElement.querySelector('.post-like-button svg path');
            if (heartIcon) {
                console.log(`Setting heart fill for post ${post.id} to currentColor`);
                heartIcon.setAttribute('fill', 'currentColor');
            }
        }
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
    // Update all buttons for this post (both in list and modal if open)
    const buttons = document.querySelectorAll(`.post-like-button[data-post-id="${postId}"]`);
    
    buttons.forEach(button => {
        // Update the like count
        const countElement = button.querySelector('.like-count');
        if (countElement) {
            countElement.textContent = likeCount;
        }
        
        // Update the like button class
        if (isLiked) {
            button.classList.add('liked');
        } else {
            button.classList.remove('liked');
        }
        
        // Update the heart fill
        const heartIcon = button.querySelector('svg path');
        if (heartIcon) {
            heartIcon.setAttribute('fill', isLiked ? 'currentColor' : 'none');
        }
    });
}

// Make these functions available globally for newly created posts
window.attachLikeHandlers = attachLikeHandlers;
window.attachPostClickHandlers = attachPostClickHandlers;
window.attachMenuHandlers = attachMenuHandlers;

// Initialise
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Get current user ID
        currentUserId = await window.auth.getCurrentMemberstackId();
        console.log('Initialized with user ID:', currentUserId);
        
        // Only fetch posts if we have a user
        if (currentUserId) {
            fetchGroupPosts('tiny-house-alkmaar');
            
            // Wait a bit and then ensure all heart icons are properly filled
            setTimeout(fixAllHeartIcons, 1000);
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
            // Check if this post is liked by the current user
            const isLiked = likeButton.classList.contains('liked');
            const heartIcon = likeButton.querySelector('svg path');
            
            console.log(`Post ${postId} - isLiked: ${isLiked}`);
            
            if (isLiked && heartIcon) {
                console.log(`Fixing heart icon for post ${postId}`);
                heartIcon.setAttribute('fill', 'currentColor');
            }
        }
    });
}