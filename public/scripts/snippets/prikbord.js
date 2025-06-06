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

    // Get the current page slug from the URL
    const pathParts = window.location.pathname.split('/');
    const groupSlug = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];
    
    if (!groupSlug) {
        console.error('No group slug found in URL');
        alert('Error: groep kon niet worden bepaald. Probeer het opnieuw.');
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
        const response = await fetch(`https://api.crowdbuilding.com/api/v1/groups/${groupSlug}/posts`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('API Error Response:', response.status, data);
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // Add the new post to the top of the list
        await handleNewPost(data.data);

        // Clear form
        document.getElementById('newPostBody').value = '';
        document.getElementById('newPostImage').value = '';

    } catch (error) {
        throw error; // Re-throw to be handled by caller
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
    let endpoint = `https://api.crowdbuilding.com/api/v1/groups/${groupSlug}/posts`;
    
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
        container.innerHTML = `
            <div class="post-item empty">
                <p>Nog geen berichten</p>
            </div>
        `;
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
                <p>${post.body}</p>
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
        
        const response = await fetch(`https://api.crowdbuilding.com/api/v1/posts/${postId}/like`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        
        // Determine if the post is now liked
        let isLiked = false;
        if (data.message) {
            isLiked = !data.message.toLowerCase().includes('unlike') && 
                     !data.message.toLowerCase().includes('niet meer') &&
                     !data.message.toLowerCase().includes('removed');
        } else if (data.data.likes_count !== undefined && previousCount !== undefined) {
            isLiked = data.data.likes_count > previousCount;
        }
        
        // Update UI
        updateLikeButtonState(postId, isLiked, data.data.likes_count);
        
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
            // Get the current page slug from the URL
            const pathParts = window.location.pathname.split('/');
            const groupSlug = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];
            
            if (!groupSlug) {
                console.error('No group slug found in URL');
                const container = document.getElementById('groupPosts');
                if (container) {
                    container.innerHTML = '<div class="post-item">Error: No group found in URL.</div>';
                }
                return;
            }
            
            // Initialize posts
            fetchGroupPosts(groupSlug, null);
            
            // Setup heart icons and handlers
            setTimeout(fixAllHeartIcons, 1000);
            addDirectLikeClickHandler();
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

// Make necessary functions available globally
window.attachLikeHandlers = attachLikeHandlers;
window.attachPostClickHandlers = attachPostClickHandlers;
window.attachMenuHandlers = attachMenuHandlers;
window.attachCommentLikeHandlers = attachCommentLikeHandlers;
window.fixAllHearts = fixAllHeartIcons; 