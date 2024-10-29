<!-- src/App.vue -->
<template>
  <div id="app">
    <Header @logout="logout" />
    <transition name="fade" mode="out-in">
      <router-view />
    </transition>
  </div>
</template>

<script>
import Header from './views/Header.vue';

export default {
  name: 'App',
  components: {
    Header
  },
  methods: {
    logout() {
      chrome.storage.local.set({ loggedOut: true }, () => {
        this.$router.push('/login');
      });
    }
  }
};
</script>

<style></style>
