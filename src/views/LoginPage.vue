<template>
  <div class="common-dimensions">
    <div class="max-w-4xl mx-auto p-4 bg-gray-100 flex items-center justify-center min-h-[500px]">
      <div class="bg-white shadow-lg rounded-lg p-8 max-w-sm w-full text-center">
        <h1 class="text-2xl font-bold mb-4">Welcome to Phish Finder</h1>
        <p class="text-gray-700 mb-6">Please login with your Google account to continue</p>
        <button @click="login" class="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600">
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
function login() {
  chrome.identity.getAuthToken({ interactive: true }, (token) => {
    if (token) {
      console.log("Token obtained:", token);
      chrome.storage.local.set({ loggedOut: false }, () => {
        router.push('/emails');  // Redirect to the emails page after login
      });
    } else {
      console.error("Failed to authenticate");
      alert("Failed to authenticate");
    }
  });
}
// Auto-login if token exists
onMounted(() => {
  chrome.identity.getAuthToken({ interactive: false }, (token) => {
    if (token) {
      console.log("Auto-login: Redirecting to emails page");
      router.push('/emails');
    }
  });
});
</script>
<style scoped>
.login-button {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 20px;
}

.login-button:hover {
  background-color: #0056b3;
}
</style>