// ✅ Helper to get token via Memberstack exchange
async function getApiTokenFromMemberstack() {
  if (typeof $memberstackDom !== 'undefined') {
    await $memberstackDom.onReady;
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

// Format date helper
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
} 