<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light to-primary-dark p-4">
    <div class="bg-white shadow-xl rounded-2xl p-8 max-w-sm w-full">
      <div class="text-center">
        <img src="/images/phishfinderlogo.png" alt="PhishFinder Logo"
          class="w-24 h-24 mx-auto mb-6 rounded-full border-4 border-primary shadow-lg" />
        <h1 class="text-2xl font-bold mb-4 font-mono">Welcome to PhishFinder</h1>
        <p class="text-gray-600 mb-8">Please login with your Google account to continue</p>
        <button @click="handleLogin"
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
import { login, checkAuthStatus } from '../utils/oauth';

const router = useRouter();

const handleLogin = async () => {
  try {
    await login();
    router.push('/emails');
  } catch (error) {
    console.error("Login failed:", error);
    alert("Failed to authenticate");
  }
};

onMounted(async () => {
  const isAuthenticated = await checkAuthStatus();
  if (isAuthenticated) {
    console.log("Auto-login: Redirecting to emails page");
    router.push('/emails');
  }
});
</script>

<style scoped>
.font-mono {
  font-family: 'Space Mono', monospace;
}
</style>
