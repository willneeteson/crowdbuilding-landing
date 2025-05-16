let currentUserId = null;

async function isUserLoggedIn() {
  if (typeof $memberstackDom !== 'undefined') {
    await $memberstackDom.onReady;
    const member = await $memberstackDom.getCurrentMember();

    if (member && member.id) {
      console.log('User is logged in:', member.id);
      return member;
    } else {
      console.log('User is NOT logged in');
      return null;
    }
  } else {
    console.error('Memberstack is not loaded');
    return null;
  }
}

// Get current user ID from Memberstack
async function getCurrentUserId() {
  const member = await isUserLoggedIn();
  if (member) {
    currentUserId = member.id;
    return currentUserId;
  }
  return null;
}

async function fetchGroupPosts(groupSlug) {
  const endpoint = `https://api.crowdbuilding.com/api/v1/groups/${groupSlug}/posts`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();
    renderPosts(data.data);
  } catch (error) {
    console.error('Error fetching group posts:', error);
  }
}

async function fetchCommentsForPost(postId) {
  const endpoint = `https://api.crowdbuilding.com/api/v1/posts/${postId}/comments`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
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

function attachCommentToggles() {
  document.querySelectorAll('.post-comments-toggle').forEach(toggle => {
    toggle.addEventListener('click', async () => {
      const postId = toggle.getAttribute('data-post-id');
      const commentsList = document.getElementById(`comments-${postId}`);
      const isVisible = commentsList.style.display === 'block';

      if (isVisible) {
        commentsList.style.display = 'none';
      } else {
        commentsList.style.display = 'block';

        if (!commentsList.hasAttribute('data-loaded')) {
          const comments = await fetchCommentsForPost(postId);
          renderComments(comments, commentsList);
          commentsList.setAttribute('data-loaded', 'true');
        }
      }
    });
  });
}

function attachDeleteButtons() {
  document.querySelectorAll('.post-delete-button').forEach(button => {
    button.addEventListener('click', () => {
      const postId = button.getAttribute('data-post-id');
      if (confirm('Are you sure you want to delete this post?')) {
        deletePost(postId);
      }
    });
  });
}

async function deletePost(postId) {
  const groupSlug = 'tiny-house-alkmaar'; // Replace this dynamically if needed
  const token = await getApiTokenFromMemberstack();

  if (!token) {
    alert('You are not signed in.');
    return;
  }

  try {
    const response = await fetch(`https://api.crowdbuilding.com/api/v1/groups/${groupSlug}/posts/${postId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const postElement = document.querySelector(`.post-item [data-post-id="${postId}"]`)?.closest('.post-item');
      if (postElement) postElement.remove();
    } else {
      console.error('Failed to delete post:', response.status);
      alert('Could not delete the post.');
    }
  } catch (error) {
    console.error('Error deleting post:', error);
    alert('Something went wrong.');
  }
}

function renderPosts(posts) {
  const container = document.getElementById('groupPosts');
  container.innerHTML = '';

  console.log('Rendering posts, currentUserId:', currentUserId);

  posts.forEach(post => {
    const postElement = document.createElement('article');
    postElement.className = 'post-item';

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

    // Debug information
    console.log('Post data:', {
      postId: post.id,
      currentUserId,
      postCreatedById: post.created_by?.id,
      hasPermissions: !!post.permissions,
      canDeleteFromPermissions: post.permissions?.can_delete,
      postData: post // Log the entire post object
    });

    const canDelete = post.permissions?.can_delete || post.created_by?.id === currentUserId;
    console.log('Can delete calculation:', {
      fromPermissions: post.permissions?.can_delete,
      fromCreatorMatch: post.created_by?.id === currentUserId,
      finalResult: canDelete
    });

    const deleteButton = canDelete
      ? `<button class="post-delete-button" data-post-id="${post.id}">Delete</button>`
      : '';

    postElement.innerHTML = `
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
        <div class="post-likes">
          ${likeAvatars}
          <span>${post.likes_count} like${post.likes_count !== 1 ? 's' : ''}</span>
        </div>
        <div class="post-comments-toggle" data-post-id="${post.id}">
          <span>${post.comments_count} comment${post.comments_count !== 1 ? 's' : ''}</span>
        </div>
        ${deleteButton}
      </div>
      <div class="post-comments-list" id="comments-${post.id}" style="display: none;"></div>
    `;

    container.appendChild(postElement);
  });

  attachCommentToggles();
  attachDeleteButtons();
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

// Initialise
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Get current user ID
    const userId = await getCurrentUserId();
    console.log('Initialized with user ID:', userId);
    
    // Only fetch posts if we have a user
    if (userId) {
      fetchGroupPosts('tiny-house-alkmaar');
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
