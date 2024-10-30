<template>
  <div class="common-dimensions">

    <div class="max-w-4xl mx-auto p-4 bg-gray-100 flex items-center justify-center min-h-[500px]">
      <div class="bg-white shadow-lg rounded-lg p-8 max-w-sm w-full mx-4">
        <div class="text-center">
          <img src="/public/images/phishfinderlogo.png" alt="PhishFinder Logo"
            class="w-24 h-24 mx-auto mb-6 rounded-full border-4 border-blue-500 shadow-lg" />
          <h1 class="text-2xl font-bold mb-4 font-mono">Welcome to PhishFinder</h1>
          <p class="text-gray-700 mb-6">Please login with your Google account to continue</p>
          <button @click="login"
            class="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors font-mono">
            Login with Google
          </button>
        </div>
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
