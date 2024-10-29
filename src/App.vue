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

<style>
/* Add transition styles */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter,
.fade-leave-to

/* .fade-leave-active in <2.1.8 */
  {
  opacity: 0;
}
</style>
