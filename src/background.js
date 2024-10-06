chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
  });
  
  // Example token retrieval for OAuth flow
  chrome.identity.getAuthToken({ interactive: true }, function(token) {
    if (chrome.runtime.lastError || !token) {
      console.error("OAuth failed: " + chrome.runtime.lastError.message);
      return;
    }
    console.log('Token obtained:', token);
  });
  