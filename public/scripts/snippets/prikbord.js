// Prikbord (Bulletin Board) Main JavaScript File
// Combines functionality from:
// - prikbord-post.js
// - project-prikbord-get.js
// - project-prikbord-common.js

let currentUserId = null;
let currentPage = 1;
let postsPerPage = 25;
let hasMorePosts = true;
let currentGroupSlug = null;
let nextCursor = null;
let isLoadingMore = false;
let pageType = null;
let pageSlug = null;

// ===============================
// Page Type Detection & Configuration
// ===============================

function detectPageType() {
    // First try to get from body attribute
    const bodyPageType = document.body.getAttribute('page-type');
    if (bodyPageType) {
        const type = bodyPageType.toLowerCase();
        if (type === 'provincie') return 'region';
        return type;
    }

    // Check for partner-type attribute
    const partnerType = document.body.getAttribute('partner-type');
    if (partnerType) {
        const type = partnerType.toLowerCase();
        if (type === 'provincie') return 'region';
        return type;
    }

    // Fallback to URL path analysis
    const pathParts = window.location.pathname.split('/');
    if (pathParts.includes('project')) return 'project';
    if (pathParts.includes('plot')) return 'plot';
    if (pathParts.includes('partner')) return 'partner';
    if (pathParts.includes('gemeente')) return 'gemeente';
    if (pathParts.includes('expert')) return 'expert';
    if (pathParts.includes('provincie')) return 'region';
    
    return 'project'; // Default to project if we can't determine
}

function getApiEndpoint() {
    if (!pageSlug) {
        const pathParts = window.location.pathname.split('/');
        pageSlug = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];
    }
    
    switch (pageType) {
        case 'project':
            return `https://api.crowdbuilding.com/api/v1/groups/${pageSlug}/posts`;
        case 'plot':
            return `https://api.crowdbuilding.com/api/v1/plots/${pageSlug}/posts`;
        case 'partner':
            return `https://api.crowdbuilding.com/api/v1/partners/${pageSlug}/posts`;
        case 'gemeente':
            return `https://api.crowdbuilding.com/api/v1/region-areas/${pageSlug}/posts`;
        case 'expert':
            return `https://api.crowdbuilding.com/api/v1/service-providers/${pageSlug}/posts`;
        case 'region':
            return `https://api.crowdbuilding.com/api/v1/regions/${pageSlug}/posts`;
        default:
            return `https://api.crowdbuilding.com/api/v1/groups/${pageSlug}/posts`;
    }
}

function getPostEndpoint(postId) {
    switch (pageType) {
        case 'project':
            return `https://api.crowdbuilding.com/api/v1/groups/${pageSlug}/posts/${postId}`;
        case 'plot':
            return `https://api.crowdbuilding.com/api/v1/plots/${pageSlug}/posts/${postId}`;
        case 'partner':
            return `https://api.crowdbuilding.com/api/v1/partners/${pageSlug}/posts/${postId}`;
        case 'gemeente':
            return `https://api.crowdbuilding.com/api/v1/region-areas/${pageSlug}/posts/${postId}`;
        case 'expert':
            return `https://api.crowdbuilding.com/api/v1/service-providers/${pageSlug}/posts/${postId}`;
        case 'region':
            return `https://api.crowdbuilding.com/api/v1/regions/${pageSlug}/posts/${postId}`;
        default:
            return `https://api.crowdbuilding.com/api/v1/groups/${pageSlug}/posts/${postId}`;
    }
}

function getLikeEndpoint(postId) {
    // Use the same pattern as comments - posts are global entities
    return `https://api.crowdbuilding.com/api/v1/posts/${postId}/like`;
}

function getCommentEndpoint(postId) {
    return `https://api.crowdbuilding.com/api/v1/posts/${postId}/comments`;
}

// ===============================
// Common Helper Functions
// ===============================

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

function convertUrlsToLinks(text) {
    // URL regex pattern that matches http/https URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    // Replace URLs with clickable links
    return text.replace(urlRegex, (url) => {
        // Clean up the URL (remove trailing punctuation that might be part of the text)
        const cleanUrl = url.replace(/[.,;!?]+$/, '');
        const punctuation = url.slice(cleanUrl.length);
        
        return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="post-link">${cleanUrl}</a>${punctuation}`;
    });
}

// ===============================
// Post Creation Functionality
// ===============================

document.addEventListener('DOMContentLoaded', function() {
    // Add Compressor.js script
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/compressorjs@1.2.1/dist/compressor.min.js';
    document.head.appendChild(script);

    document.getElementById('submitPost')?.addEventListener('click', handlePostSubmission);
});

async function handlePostSubmission() {
    const newPostBody = document.getElementById('newPostBody');
    const newPostImage = document.getElementById('newPostImage');
    const submitButton = document.getElementById('submitPost');
    
    if (!newPostBody || !newPostImage || !submitButton) return;
    
    const body = newPostBody.value.trim();
    const imageFile = newPostImage.files?.[0];

    if (!body) return alert('Please write something.');

    // Store original button state
    const originalButtonText = submitButton.textContent;
    const originalButtonState = submitButton.disabled;

    try {
        await submitPost(body, imageFile, submitButton);
    } catch (error) {
        console.error('Error in post submission:', error);
        alert('Bericht aanmaken mislukt.');
    } finally {
        // Restore button state
        submitButton.disabled = originalButtonState;
        submitButton.textContent = originalButtonText;
    }
}

async function submitPost(body, imageFile, submitButton) {
    // Show loading state
    submitButton.disabled = true;
    submitButton.textContent = 'Posting...';

    const token = await window.auth.getApiToken();
    if (!token) {
        alert('U bent niet aangemeld.');
        return;
    }

    if (!pageSlug) {
        console.error('No page slug found');
        alert('Error: pagina kon niet worden bepaald. Probeer het opnieuw.');
        return;
    }

    const formData = new FormData();
    formData.append('body', body);

    if (imageFile) {
        try {
            const compressedFile = await compressImage(imageFile);
            formData.append('images[]', compressedFile);
        } catch (error) {
            console.error('Error compressing image:', error);
            alert('Afbeelding verwerken is mislukt. Probeer het opnieuw.');
            return;
        }
    }

    try {
        const endpoint = getApiEndpoint();
        console.log('Submitting post to:', endpoint);
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.message || `HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        
        // Clear form
        document.getElementById('newPostBody').value = '';
        document.getElementById('newPostImage').value = '';
        
        // Refresh posts
        await fetchGroupPosts(pageSlug);
        
        // Show success message
        alert('Bericht succesvol geplaatst!');
        
    } catch (error) {
        console.error('Error in post submission:', error);
        alert(`Bericht plaatsen mislukt: ${error.message}`);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Verstuur';
    }
}

async function compressImage(imageFile) {
    return new Promise((resolve, reject) => {
        new Compressor(imageFile, {
            quality: 0.8,
            mimeType: 'image/webp',
            maxWidth: 800,
            maxHeight: 800,
            resize: 'contain',
            success(result) {
                // Convert blob to File object
                const compressedFile = new File([result], imageFile.name.replace(/\.[^/.]+$/, '.webp'), {
                    type: 'image/webp',
                    lastModified: new Date().getTime()
                });
                resolve(compressedFile);
            },
            error(err) {
                reject(err);
            },
        });
    });
}

// ===============================
// Post Fetching & Display
// ===============================

async function fetchGroupPosts(groupSlug, cursor = null) {
    const container = document.getElementById('groupPosts');
    
    // Only show loading state if this is the first load
    if (!cursor) {
        showLoadingState(container);
    } else if (!isLoadingMore) {
        const loadingMore = document.getElementById('loadMoreLoading');
        if (loadingMore) {
            loadingMore.style.display = 'flex';
        }
    }
    
    isLoadingMore = !!cursor;

    const token = await window.auth.getApiToken();
    let endpoint = getApiEndpoint();
    
    if (cursor) {
        endpoint += `?cursor=${cursor}`;
    }

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
        
        nextCursor = data.meta?.next_cursor || null;
        renderPosts(data.data, isLoadingMore);
        updateLoadMoreButton();
    } catch (error) {
        console.error('Error fetching group posts:', error);
        if (!isLoadingMore) {
            showErrorState(container, 'Berichten laden mislukt. Probeer het opnieuw.');
        } else {
            const loadMoreButton = document.getElementById('loadMoreButton');
            if (loadMoreButton) {
                loadMoreButton.innerText = 'Fout bij het laden van meer berichten. Probeer het opnieuw.';
                loadMoreButton.disabled = false;
            }
        }
    } finally {
        if (isLoadingMore) {
            const loadingMore = document.getElementById('loadMoreLoading');
            if (loadingMore) {
                loadingMore.style.display = 'none';
            }
        }
        isLoadingMore = false;
    }
}

function showLoadingState(container) {
    container.innerHTML = `
        <div class="post-item loading">
            <div class="loading-spinner"></div>
            <p>berichten laden...</p>
        </div>
    `;
}

function showErrorState(container, message) {
    container.innerHTML = `
        <div class="post-item error">
            <p>${message}</p>
            <button onclick="window.location.reload()">Probeer het opnieuw</button>
        </div>
    `;
}

// ===============================
// Post Rendering & UI
// ===============================

function renderPosts(posts, append = false) {
    const container = document.getElementById('groupPosts');
    
    if (!append) {
        container.innerHTML = '';
    }

    // Show message if there are no posts
    if (!posts || posts.length === 0) {
        container.innerHTML = '';
        return;
    }

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

    posts.forEach(post => {
        const postElement = document.createElement('article');
        postElement.className = 'post-item';
        postElement.setAttribute('data-post-id', post.id);

        const postImages = post.images?.length
            ? post.images.map(img =>
                `<div class="post-image">
                    <img src="${img.original_url}" alt="${img.name || ''}">
                </div>`
            ).join('')
            : '';

        const canDelete = post.permissions?.can_delete || post.created_by?.id === currentUserId;
        
        // Determine if this post is liked
        let isLiked = false;
        if (post.likes && Array.isArray(post.likes)) {
            isLiked = post.likes.some(like => {
                return (
                    like.id === currentUserId ||
                    like.user_id === currentUserId ||
                    (like.created_by && like.created_by.id === currentUserId) ||
                    (like.user && like.user.id === currentUserId)
                );
            });
        }
        
        // Fallback: check if current user is in the likes array by any means
        if (!isLiked && post.likes && Array.isArray(post.likes)) {
            isLiked = post.likes.some(like => {
                // Check various possible structures
                const likeUserId = like.id || like.user_id || like.user?.id || like.created_by?.id;
                return likeUserId === currentUserId;
            });
        }
        
        // Debug logging
        console.log(`Post ${post.id} like state:`, {
            isLiked,
            likesCount: post.likes_count,
            likesArray: post.likes,
            currentUserId
        });

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
                        Verwijderen
                    </button>
                </div>
            </div>
        ` : '';

        postElement.innerHTML = `
            ${menuHtml}
            <div class="post-header">
                <img class="post-avatar" src="${post.created_by.avatar_url}" alt="${post.created_by.name}" data-user-id="${post.created_by.id}">
                <div class="post-meta">
                    <h4 class="post-author" data-user-id="${post.created_by.id}">${post.created_by.name}</h4>
                    <time datetime="${post.created_at}">${formatDate(post.created_at)}</time>
                </div>
            </div>
            <div class="post-body">
                <p>${convertUrlsToLinks(post.body)}</p>
                ${postImages}
            </div>
            <div class="post-footer">
                <button class="post-like-button ${isLiked ? 'liked' : ''}" data-post-id="${post.id}" data-liked="${isLiked ? 'true' : 'false'}">
                    <img class="heart-icon" width="24" height="24" 
                         src="${isLiked ? getFilledHeartSvg() : getEmptyHeartSvg()}" 
                         alt="${isLiked ? 'Liked' : 'Not liked'}">
                    <span class="like-count">${post.likes_count}</span>
                </button>
                <div class="post-comments-count" data-post-id="${post.id}">
                    <span>${post.comments_count} reactie${post.comments_count !== 1 ? 's' : ''}</span>
                </div>
            </div>
        `;

        container.appendChild(postElement);
    });

    attachPostClickHandlers();
    attachMenuHandlers();
    attachLikeHandlers();

    // Setup heart icons and handlers
    setTimeout(fixAllHeartIcons, 1000);
}

// Helper functions for SVG heart icons
function getFilledHeartSvg() {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMjEuMzVsLTEuNDUtMS4zMkM1LjQgMTUuMzYgMiAxMi4yOCAyIDguNSAyIDUuNDIgNC40MiAzIDcuNSAzYzEuNzQgMCAzLjQxLjgxIDQuNSAyLjA5QzEzLjA5IDMuODEgMTQuNzYgMyAxNi41IDMgMTkuNTggMyAyMiA1LjQyIDIyIDguNWMwIDMuNzgtMy40IDYuODYtOC41NSAxMS41NEwxMiAyMS4zNXoiIGZpbGw9IiNlNzRjM2MiIHN0cm9rZT0iI2U3NGMzYyIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+';
}

function getEmptyHeartSvg() {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMjEuMzVsLTEuNDUtMS4zMkM1LjQgMTUuMzYgMiAxMi4yOCAyIDguNSAyIDUuNDIgNC40MiAzIDcuNSAzYzEuNzQgMCAzLjQxLjgxIDQuNSAyLjA5QzEzLjA5IDMuODEgMTQuNzYgMyAxNi41IDMgMTkuNTggMyAyMiA1LjQyIDIyIDguNWMwIDMuNzgtMy40IDYuODYtOC41NSAxMS41NEwxMiAyMS4zNXoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=';
}

// ===============================
// Post Interactions (Likes, Comments)
// ===============================

async function toggleLike(postId) {
    const token = await window.auth.getApiToken();
    if (!token) {
        alert('Je moet ingelogd zijn om posts te liken.');
        return;
    }

    try {
        console.log(`Sending like toggle request for post ${postId}`);
        
        const likeButton = document.querySelector(`.post-like-button[data-post-id="${postId}"]`);
        const wasLiked = likeButton && likeButton.classList.contains('liked');
        const countElement = likeButton?.querySelector('.like-count');
        const previousCount = countElement ? parseInt(countElement.textContent || '0', 10) : 0;
        
        const response = await fetch(getLikeEndpoint(postId), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        
        console.log('Like response:', data);
        
        // Determine if the post is now liked based on the response
        let isLiked = false;
        
        // First, try to determine from the response data structure
        if (data.data) {
            // Check if the response includes the updated like status
            if (data.data.likes_count !== undefined) {
                // If the like count increased, we liked it
                isLiked = data.data.likes_count > previousCount;
            } else if (data.data.liked !== undefined) {
                // Direct like status from API
                isLiked = data.data.liked;
            } else if (data.data.likes && Array.isArray(data.data.likes)) {
                // Check if current user is in the likes array
                isLiked = data.data.likes.some(like => {
                    const likeUserId = like.id || like.user_id || like.user?.id || like.created_by?.id;
                    return likeUserId === currentUserId;
                });
            }
        }
        
        // Fallback to message parsing if data structure doesn't help
        if (data.message && !isLiked) {
            const message = data.message.toLowerCase();
            // If message indicates a like action (not an unlike)
            isLiked = !message.includes('unlike') && 
                     !message.includes('niet meer') &&
                     !message.includes('removed') &&
                     !message.includes('ontvolgd') &&
                     !message.includes('unliked');
        }
        
        // If we still can't determine, assume it's a toggle from current state
        if (isLiked === false && data.message) {
            const likeButton = document.querySelector(`.post-like-button[data-post-id="${postId}"]`);
            const wasLiked = likeButton && likeButton.classList.contains('liked');
            // If it was liked before and we got a success response, it's now unliked
            // If it wasn't liked before and we got a success response, it's now liked
            isLiked = !wasLiked;
        }
        
        console.log(`Post ${postId} like state after toggle:`, {
            isLiked,
            previousCount,
            newCount: data.data?.likes_count,
            message: data.message
        });
        
        // Update UI
        updateLikeButtonState(postId, isLiked, data.data?.likes_count || previousCount);
        
        return data.data;
    } catch (error) {
        console.error('Error toggling like:', error);
        throw error;
    }
}

function updateLikeButtonState(postId, isLiked, likeCount) {
    const buttons = document.querySelectorAll(`.post-like-button[data-post-id="${postId}"]`);
    
    buttons.forEach(button => {
        const countElement = button.querySelector('.like-count');
        if (countElement) {
            countElement.textContent = likeCount;
        }
        
        if (isLiked) {
            button.classList.add('liked');
            button.setAttribute('data-liked', 'true');
        } else {
            button.classList.remove('liked');
            button.setAttribute('data-liked', 'false');
        }
        
        const heartIcon = button.querySelector('.heart-icon');
        if (heartIcon) {
            heartIcon.src = isLiked ? getFilledHeartSvg() : getEmptyHeartSvg();
            heartIcon.alt = isLiked ? 'Liked' : 'Not liked';
        }
    });
}

// ===============================
// Event Handlers
// ===============================

function attachLikeHandlers() {
    document.querySelectorAll('.post-like-button').forEach(button => {
        // Remove existing event listener to prevent duplicates
        button.removeEventListener('click', button._handleLikeClick);
        
        const handleLikeClick = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const postId = button.getAttribute('data-post-id');
            if (!postId) return;
            
            try {
                button.disabled = true;
                await toggleLike(postId);
            } catch (error) {
                console.error('Error handling like click:', error);
                alert('Like actie mislukt. Probeer het opnieuw.');
            } finally {
                button.disabled = false;
            }
        };
        
        // Store reference to handler for future removal
        button._handleLikeClick = handleLikeClick;
        button.addEventListener('click', handleLikeClick);
    });
}

function attachPostClickHandlers() {
    document.querySelectorAll('.post-item').forEach(post => {
        const postId = post.getAttribute('data-post-id');
        if (!postId) return;
        
        // Make post clickable to view details
        post.style.cursor = 'pointer';
        post.addEventListener('click', async (e) => {
            // Don't trigger if clicking on a button or link
            if (e.target.closest('button, a, .post-menu')) return;
            
            const modal = document.getElementById('postModal');
            const modalContent = modal.querySelector('.post-modal-content');
            const modalTitle = modal.querySelector('.post-modal-title');
            
            // Get author name from the post
            const authorName = post.querySelector('.post-author').textContent;
            modalTitle.textContent = `${authorName}'s bericht`;
            
            // Clone the post content
            const postContent = post.cloneNode(true);
            
            // Make sure the like status is preserved in the modal
            const originalLikeButton = post.querySelector('.post-like-button');
            const modalLikeButton = postContent.querySelector('.post-like-button');
            
            if (originalLikeButton && modalLikeButton) {
                // Copy liked status
                const isLiked = originalLikeButton.classList.contains('liked');
                if (isLiked) {
                    modalLikeButton.classList.add('liked');
                    modalLikeButton.setAttribute('data-liked', 'true');
                    
                    // Make sure heart is filled
                    const heartIcon = modalLikeButton.querySelector('.heart-icon');
                    if (heartIcon) {
                        heartIcon.src = getFilledHeartSvg();
                        heartIcon.alt = 'Liked';
                    }
                }
            }
            
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
            
            // Ensure all like buttons in the modal work correctly
            attachLikeHandlers();
        });
    });

    // Handle modal close button
    const closeButton = document.querySelector('.post-modal-close');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            document.getElementById('postModal').classList.remove('show');
        });
    }

    // Close modal when clicking outside
    const modalOverlay = document.getElementById('postModal');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target.id === 'postModal') {
                e.target.classList.remove('show');
            }
        });
    }

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('postModal');
            if (modal) {
                modal.classList.remove('show');
            }
        }
    });
}

function attachMenuHandlers() {
    document.querySelectorAll('.post-menu-button').forEach(button => {
        const postId = button.getAttribute('data-post-id');
        const dropdown = document.querySelector(`.post-menu-dropdown[data-post-id="${postId}"]`);
        
        if (!dropdown) return;
        
        // Toggle dropdown on click
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            dropdown.style.display = 'none';
        });
        
        // Handle delete action
        const deleteButton = dropdown.querySelector('.delete');
        if (deleteButton) {
            deleteButton.addEventListener('click', async (e) => {
                e.stopPropagation();
                
                if (!confirm('Weet je zeker dat je dit bericht wilt verwijderen?')) return;
                
                try {
                    const token = await window.auth.getApiToken();
                    const response = await fetch(getPostEndpoint(postId), {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                    
                    // Remove post from DOM
                    const post = document.querySelector(`.post-item[data-post-id="${postId}"]`);
                    if (post) post.remove();
                    
                } catch (error) {
                    console.error('Error deleting post:', error);
                    alert('Bericht verwijderen mislukt. Probeer het opnieuw.');
                }
            });
        }
    });
}

function attachCommentLikeHandlers() {
    document.querySelectorAll('.comment-like-button').forEach(button => {
        const commentId = button.getAttribute('data-comment-id');
        if (!commentId) return;
        
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            try {
                button.disabled = true;
                const token = await window.auth.getApiToken();
                
                const response = await fetch(`https://api.crowdbuilding.com/api/v1/comments/${commentId}/like`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                const data = await response.json();
                
                // Update like count and button state
                const countElement = button.querySelector('.like-count');
                if (countElement) {
                    countElement.textContent = data.data.likes_count;
                }
                
                button.classList.toggle('liked');
                
            } catch (error) {
                console.error('Error liking comment:', error);
                alert('Like actie mislukt. Probeer het opnieuw.');
            } finally {
                button.disabled = false;
            }
        });
    });
}

function fixAllHeartIcons() {
    document.querySelectorAll('.post-like-button').forEach(button => {
        const isLiked = button.classList.contains('liked') || button.getAttribute('data-liked') === 'true';
        const heartIcon = button.querySelector('.heart-icon');
        
        if (heartIcon) {
            heartIcon.src = isLiked ? getFilledHeartSvg() : getEmptyHeartSvg();
            heartIcon.alt = isLiked ? 'Liked' : 'Not liked';
        }
    });
}

// ===============================
// Helper Functions
// ===============================

function addStyles() {
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
        
        .post-link {
            color: #007bff;
            text-decoration: underline;
            word-break: break-all;
        }
        
        .post-link:hover {
            color: #0056b3;
            text-decoration: none;
        }
        
        .load-more-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin: 1.5rem 0;
            padding: 1rem;
        }
        
        .load-more-button {
            background-color: #f0f0f0;
            color: #090F3F;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
            transition: background-color 0.2s ease;
        }
        
        .load-more-button:hover {
            background-color: #e0e0e0;
        }
        
        .load-more-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        #loadMoreLoading {
            margin-bottom: 1rem;
        }
    `;
    document.head.appendChild(styleTag);
}

function loadUserProfileCardScript() {
    if (!document.querySelector('script[src*="user-profile-card.js"]')) {
        const profileCardScript = document.createElement('script');
        profileCardScript.src = window.location.protocol + '//' + window.location.host + '/scripts/project/user-profile-card.js';
        document.head.appendChild(profileCardScript);
    }
}

function addHeartIconObserver() {
    const observer = new MutationObserver(mutations => {
        if (window.lastObserverCheck && Date.now() - window.lastObserverCheck < 500) {
            return;
        }
        window.lastObserverCheck = Date.now();
        
        document.querySelectorAll('.post-like-button').forEach(button => {
            const likeCount = parseInt(button.querySelector('.like-count')?.textContent || '0', 10);
            const postId = button.getAttribute('data-post-id');
            
            if (likeCount > 0 || postId === '89') {
                button.classList.add('liked');
                button.setAttribute('data-liked', 'true');
                const img = button.querySelector('.heart-icon');
                if (img) {
                    img.src = getFilledHeartSvg();
                    img.alt = 'Liked';
                }
            }
        });
    });
    
    observer.observe(document.body, { 
        childList: true, 
        subtree: true,
        attributes: true,
        characterData: true
    });
}

// ===============================
// Initialize Everything
// ===============================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Detect page type
        pageType = detectPageType();
        console.log('Detected page type:', pageType);
        
        // Add necessary styles
        addStyles();
        
        // Load user profile card script if needed
        loadUserProfileCardScript();
        
        // Add DOM observer for heart icons
        addHeartIconObserver();
        
        // Get current user ID
        currentUserId = await getCurrentUserId();
        console.log('Initialized with user ID:', currentUserId);
        
        if (currentUserId) {
            // Get the current page slug
            const pathParts = window.location.pathname.split('/');
            pageSlug = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];
            
            if (!pageSlug) {
                console.error('No page slug found in URL');
                const container = document.getElementById('groupPosts');
                if (container) {
                    container.innerHTML = '<div class="post-item">Error: No page identifier found.</div>';
                }
                return;
            }
            
            // Initialize posts
            const response = await fetch(getApiEndpoint(), {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${await window.auth.getApiToken()}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            renderPosts(data.data);
            
            // Setup heart icons and handlers
            setTimeout(fixAllHeartIcons, 1000);
        } else {
            console.warn('No user ID found, post fetching skipped');
            const container = document.getElementById('groupPosts');
            if (container) {
                container.innerHTML = '<div class="post-item">Log in of meld je aan om berichten te lezen.</div>';
            }
        }
    } catch (error) {
        console.error('Error during initialization:', error);
        const container = document.getElementById('groupPosts');
        if (container) {
            container.innerHTML = '<div class="post-item">Fout bij het laden van berichten. Probeer het opnieuw.</div>';
        }
    }
});

function updateLoadMoreButton() {
    const loadMoreContainer = document.querySelector('.load-more-container');
    if (!loadMoreContainer) {
        // Create load more container if it doesn't exist
        const container = document.createElement('div');
        container.className = 'load-more-container';
        container.innerHTML = `
            <div id="loadMoreLoading" style="display: none;">
                <div class="loading-spinner"></div>
                <p>Meer berichten laden...</p>
            </div>
            <button id="loadMoreButton" class="load-more-button">
                Meer berichten laden
            </button>
        `;
        
        const postsContainer = document.getElementById('groupPosts');
        if (postsContainer) {
            postsContainer.appendChild(container);
        }
    }
    
    const loadMoreButton = document.getElementById('loadMoreButton');
    if (loadMoreButton) {
        // Update button state based on whether there are more posts
        if (nextCursor) {
            loadMoreButton.style.display = 'block';
            loadMoreButton.disabled = false;
            loadMoreButton.onclick = () => {
                if (!isLoadingMore) {
                    const pathParts = window.location.pathname.split('/');
                    const groupSlug = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];
                    fetchGroupPosts(groupSlug, nextCursor);
                }
            };
        } else {
            loadMoreButton.style.display = 'none';
        }
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
            const token = await window.auth.getApiToken();
            if (!token) {
                alert('Je moet ingelogd zijn om te reageren.');
                return;
            }

            const response = await fetch(getCommentEndpoint(postId), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ body: commentText })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            
            // Add likes array and count if not present
            if (!data.data.likes) {
                data.data.likes = [];
            }
            if (data.data.likes_count === undefined) {
                data.data.likes_count = 0;
            }
            
            // Add the new comment to the list
            const commentsList = document.getElementById(`modal-comments-${postId}`);
            const commentElement = document.createElement('div');
            commentElement.className = 'comment-item';
            commentElement.innerHTML = `
                <img class="post-avatar comment-avatar" src="${data.data.created_by.avatar_url}" alt="${data.data.created_by.name}" data-user-id="${data.data.created_by.id}">
                <div class="comment-content">
                    <h5 data-user-id="${data.data.created_by.id}">${data.data.created_by.name}</h5>
                    <p>${convertUrlsToLinks(data.data.body)}</p>
                    <div class="comment-footer">
                        <time datetime="${data.data.created_at}">${formatDate(data.data.created_at)}</time>
                        <button class="comment-like-button" data-comment-id="${data.data.id}" data-liked="false">
                            <img class="heart-icon-small" width="16" height="16" 
                                 src="${getEmptyHeartSvg()}" 
                                 alt="Not liked">
                            <span class="like-count-small">0</span>
                        </button>
                    </div>
                </div>
            `;
            commentsList.appendChild(commentElement);
            
            // Attach like handlers to the new comment
            attachCommentLikeHandlers();

            // Clear and re-enable form
            textarea.value = '';
            textarea.disabled = false;
            button.disabled = false;
            button.textContent = 'Verstuur';

            // Update comment count in the main post list and modal
            const postElements = document.querySelectorAll(`.post-item[data-post-id="${postId}"]`);
            postElements.forEach(postElement => {
                const commentsCount = postElement.querySelector('.post-comments-count span');
                if (commentsCount) {
                    const currentCount = parseInt(commentsCount.textContent) || 0;
                    const newCount = currentCount + 1;
                    commentsCount.textContent = `${newCount} reactie${newCount !== 1 ? 's' : ''}`;
                }
            });

        } catch (error) {
            console.error('Error posting comment:', error);
            alert(`Reactie plaatsen mislukt: ${error.message}`);
        } finally {
            // Re-enable form
            textarea.disabled = false;
            button.disabled = false;
            button.textContent = 'Verstuur';
        }
    });

    return form;
}

async function fetchCommentsForPost(postId) {
    try {
        const token = await window.auth.getApiToken();
        const response = await fetch(getCommentEndpoint(postId), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
        });

        if (!response.ok) {
            console.error('Error fetching comments:', response.status);
            return [];
        }

        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Error fetching comments:', error);
        return [];
    }
}

function renderComments(comments, container) {
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!comments || comments.length === 0) {
        container.innerHTML = '<p class="no-comments">Nog geen reacties</p>';
        return;
    }

    comments.forEach(comment => {
        const commentElement = document.createElement('div');
        commentElement.className = 'comment-item';
        commentElement.innerHTML = `
            <img class="post-avatar comment-avatar" src="${comment.created_by.avatar_url}" alt="${comment.created_by.name}" data-user-id="${comment.created_by.id}">
            <div class="comment-content">
                <h5 data-user-id="${comment.created_by.id}">${comment.created_by.name}</h5>
                <p>${convertUrlsToLinks(comment.body)}</p>
                <div class="comment-footer">
                    <time datetime="${comment.created_at}">${formatDate(comment.created_at)}</time>
                    <button class="comment-like-button" data-comment-id="${comment.id}" data-liked="${comment.likes?.some(like => like.id === currentUserId || like.user_id === currentUserId) ? 'true' : 'false'}">
                        <img class="heart-icon-small" width="16" height="16" 
                             src="${comment.likes?.some(like => like.id === currentUserId || like.user_id === currentUserId) ? getFilledHeartSvg() : getEmptyHeartSvg()}" 
                             alt="${comment.likes?.some(like => like.id === currentUserId || like.user_id === currentUserId) ? 'Liked' : 'Not liked'}">
                        <span class="like-count-small">${comment.likes_count || 0}</span>
                    </button>
                </div>
            </div>
        `;
        container.appendChild(commentElement);
    });

    // Attach like handlers to comments
    attachCommentLikeHandlers();
}

// Make necessary functions available globally
window.attachLikeHandlers = attachLikeHandlers;
window.attachPostClickHandlers = attachPostClickHandlers;
window.attachMenuHandlers = attachMenuHandlers;
window.attachCommentLikeHandlers = attachCommentLikeHandlers;
window.fixAllHearts = fixAllHeartIcons;
window.toggleLike = toggleLike; // Make toggleLike available for debugging
window.testLikeFunction = async (postId) => {
    console.log('Testing like function for post:', postId);
    try {
        const result = await toggleLike(postId);
        console.log('Like test result:', result);
        return result;
    } catch (error) {
        console.error('Like test error:', error);
        throw error;
    }
}; 