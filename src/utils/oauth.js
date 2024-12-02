import { useRouter } from 'vue-router';

export async function login() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (token) {
        chrome.storage.local.set({ loggedOut: false }, () => {
          resolve(token);
        });
      } else {
        reject(new Error("Failed to authenticate"));
      }
    });
  });
}

export async function logout() {
  try {
    const token = await new Promise((resolve) => {
      chrome.identity.getAuthToken({ interactive: false }, (token) => {
        resolve(token);
      });
    });

    if (token) {
      await new Promise((resolve) => {
        chrome.identity.removeCachedAuthToken({ token }, resolve);
      });
    }

    await chrome.storage.local.set({ loggedOut: true });
    chrome.runtime.reload();
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
}

export async function checkAuthStatus() {
  return new Promise((resolve) => {
    chrome.identity.getAuthToken({ interactive: false }, (token) => {
      if (token) {
        chrome.storage.local.get(['loggedOut'], (result) => {
          resolve(!result.loggedOut);
        });
      } else {
        resolve(false);
      }
    });
  });
} 