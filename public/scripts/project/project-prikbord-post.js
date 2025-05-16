document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('submitPost')?.addEventListener('click', async () => {
    const newPostBody = document.getElementById('newPostBody') as HTMLTextAreaElement;
    const newPostImage = document.getElementById('newPostImage') as HTMLInputElement;
    
    if (!newPostBody || !newPostImage) return;
    
    const body = newPostBody.value.trim();
    const imageFile = newPostImage.files?.[0];

    if (!body) return alert('Please write something.');

    const token = await getApiTokenFromMemberstack();
    if (!token) {
      alert('You are not signed in.');
      return;
    }

    const formData = new FormData();
    formData.append('body', body);
    if (imageFile) {
      formData.append('images[]', imageFile);
    }

    try {
      const response = await fetch('https://api.crowdbuilding.com/api/v1/groups/tiny-house-alkmaar/posts', {
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
      const container = document.getElementById('groupPosts');
      if (container) {
        const postElement = document.createElement('article');
        postElement.className = 'post-item';
        
        const postImages = data.data.images?.length
          ? data.data.images.map(img =>
              `<div class="post-image">
                <img src="${img.original_url}" alt="${img.name || ''}">
              </div>`
            ).join('')
          : '';

        postElement.innerHTML = `
          <div class="post-header">
            <img class="post-avatar" src="${data.data.created_by.avatar_url}" alt="${data.data.created_by.name}">
            <div class="post-meta">
              <h4 class="post-author">${data.data.created_by.name}</h4>
              <time datetime="${data.data.created_at}">${formatDate(data.data.created_at)}</time>
            </div>
          </div>
          <div class="post-body">
            <p>${data.data.body}</p>
            ${postImages}
          </div>
          <div class="post-footer">
            <div class="post-likes">
              <span>0 likes</span>
            </div>
            <div class="post-comments-toggle" data-post-id="${data.data.id}">
              <span>0 comments</span>
            </div>
          </div>
          <div class="post-comments-list" id="comments-${data.data.id}" style="display: none;"></div>
        `;

        container.insertBefore(postElement, container.firstChild);
      }

      newPostBody.value = '';
      newPostImage.value = '';

    } catch (error) {
      console.error('Error creating new post:', error);
      alert('Failed to create post.');
    }
  });
});

// ✅ Helper to get token via Memberstack exchange
async function getApiTokenFromMemberstack() {
  // @ts-ignore - Memberstack is loaded globally
  if (typeof $memberstackDom !== 'undefined') {
    // @ts-ignore
    await $memberstackDom.onReady;
    // @ts-ignore
    const memberstackToken = $memberstackDom.getMemberCookie();

    if (!memberstackToken) {
      console.warn('User not signed in to Memberstack.');
      return null;
    }

    try {
      const response = await fetch('https://api.crowdbuilding.com/api/v1/sanctum/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberstack_token: memberstackToken,
          device_name: navigator.userAgent
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.token;
      } else {
        console.error('Failed to exchange Memberstack token.');
      }
    } catch (error) {
      console.error('Error fetching API token:', error.message);
    }
  }

  return null;
}

// Add formatDate function if not already defined
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}
