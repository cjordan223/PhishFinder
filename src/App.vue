<!-- src/App.vue -->
<template>
  <div id="app">

    <transition name="fade" mode="out-in">
      <router-view />
    </transition>
  </div>
</template>

<script>

export default {
  computed: {
    isLoggedIn() {
      return !this.loggedOut;
    },
  },
  data() {
    return {
      loggedOut: true,
    };
  },
  mounted() {
    chrome.storage.local.get('loggedOut', (result) => {
      this.loggedOut = result.loggedOut;
    });
  },
};
</script>

<style scoped>
@import './assets/main.css';
</style>
