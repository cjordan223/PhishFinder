<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light to-primary-dark p-4">
    <div class="bg-white shadow-xl rounded-2xl p-8 max-w-sm w-full">
      <div class="text-center">
        <img src="/images/phishfinderlogo.png" alt="PhishFinder Logo"
          class="w-24 h-24 mx-auto mb-6 rounded-full border-4 border-primary shadow-lg" />
        <h1 class="text-2xl font-bold mb-4 font-mono">Welcome to PhishFinder</h1>
        <p class="text-gray-600 mb-8">Please login with your Google account to continue</p>
        <button @click="login"
          class="w-full bg-primary hover:bg-primary-dark text-white py-3 px-4 rounded-lg transition-colors font-mono">
          Login with Google
        </button>
      </div>
    </div>
  </div>
</template>


<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const login = () => {
  chrome.identity.getAuthToken({ interactive: true }, (token) => {
    if (token) {
      console.log("Token obtained:", token);
      chrome.storage.local.set({ loggedOut: false }, () => {
        router.push('/emails');
      });
    } else {
      console.error("Failed to authenticate");
      alert("Failed to authenticate");
    }
  });
};

onMounted(() => {
  chrome.identity.getAuthToken({ interactive: false }, (token) => {
    if (token) {
      chrome.storage.local.get(['loggedOut'], (result) => {
        if (!result.loggedOut) {
          console.log("Auto-login: Redirecting to emails page");
          router.push('/emails');
        }
      });
    }
  });
});
</script>

<style scoped>
.font-mono {
  font-family: 'Space Mono', monospace;
}
</style>
