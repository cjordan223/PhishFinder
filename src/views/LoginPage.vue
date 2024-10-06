<!-- src/views/LoginPage.vue -->
<template>
  <div class="login-container">
    <div class="login-content">
      <h1>Welcome to Phish Finder</h1>
      <p>Please login with your Google account to continue</p>
      <button @click="login" class="login-button">Login with Google</button>
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

// Use `onMounted` lifecycle hook to check if the user is already logged in
onMounted(() => {
  chrome.identity.getAuthToken({ interactive: false }, (token) => {
    if (token) {
      console.log("Auto-login: Redirecting to emails page");
      router.push('/emails');  // Auto-redirect if token already exists
    }
  });
});
</script>


<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f9f9f9;
}

.login-content {
  text-align: center;
}

.login-button {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
}

.login-button:hover {
  background-color: #0056b3;
}
</style>
