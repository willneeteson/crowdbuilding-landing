// ✅ Helper to get token via Memberstack exchange
async function getApiTokenFromMemberstack() {
    return window.auth.getApiToken();
  }
  
  // Format date helper
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