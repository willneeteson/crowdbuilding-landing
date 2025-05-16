document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('submitPost')?.addEventListener('click', async () => {
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

    // Show loading state
    submitButton.disabled = true;
    submitButton.textContent = 'Posting...';

    const token = await window.auth.getApiToken();
    if (!token) {
      alert('You are not signed in.');
      // Restore button state
      submitButton.disabled = originalButtonState;
      submitButton.textContent = originalButtonText;
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
        postElement.style.opacity = '0';
        
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
        
        // Fade in the new post
        requestAnimationFrame(() => {
          postElement.style.transition = 'opacity 0.3s ease-in';
          postElement.style.opacity = '1';
        });
      }

      // Clear form
      newPostBody.value = '';
      newPostImage.value = '';

    } catch (error) {
      console.error('Error creating new post:', error);
      alert('Failed to create post.');
    } finally {
      // Restore button state
      submitButton.disabled = originalButtonState;
      submitButton.textContent = originalButtonText;
    }
  });
});
