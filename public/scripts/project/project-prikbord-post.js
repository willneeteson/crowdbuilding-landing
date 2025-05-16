document.addEventListener('DOMContentLoaded', function() {
  // Add Compressor.js script
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/compressorjs@1.2.1/dist/compressor.min.js';
  document.head.appendChild(script);

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
      try {
        // Compress and convert image to WebP
        const compressedBlob = await new Promise((resolve, reject) => {
          new Compressor(imageFile, {
            quality: 0.8,
            mimeType: 'image/webp',
            maxWidth: 800,
            maxHeight: 800,
            resize: 'contain',
            success(result) {
              resolve(result);
            },
            error(err) {
              reject(err);
            },
          });
        });

        // Convert blob to File object
        const compressedFile = new File([compressedBlob], imageFile.name.replace(/\.[^/.]+$/, '.webp'), {
          type: 'image/webp',
          lastModified: new Date().getTime()
        });

        formData.append('images[]', compressedFile);
      } catch (error) {
        console.error('Error compressing image:', error);
        alert('Failed to process image. Please try again.');
        submitButton.disabled = originalButtonState;
        submitButton.textContent = originalButtonText;
        return;
      }
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
        postElement.setAttribute('data-post-id', data.data.id);
        
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
            <button class="post-like-button" data-post-id="${data.data.id}" data-liked="false">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
                  fill="none" 
                  stroke="currentColor" 
                  style="fill: none; stroke: currentColor;"
                  stroke-width="2"/>
              </svg>
              <span class="like-count">0</span>
            </button>
            <div class="post-comments-count" data-post-id="${data.data.id}">
              <span>0 comments</span>
            </div>
          </div>
        `;

        container.insertBefore(postElement, container.firstChild);
        
        // Fade in the new post
        requestAnimationFrame(() => {
          postElement.style.transition = 'opacity 0.3s ease-in';
          postElement.style.opacity = '1';
        });
        
        // Attach event handlers to the new post
        window.attachPostClickHandlers?.();
        window.attachMenuHandlers?.();
        window.attachLikeHandlers?.();
        
        // Also run the heart fix just in case
        setTimeout(() => {
          if (window.fixAllHearts) {
            window.fixAllHearts();
          }
        }, 200);
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
