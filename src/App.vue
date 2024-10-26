<!-- src/App.vue -->
<template>
  <div id="app">

    <!-- This is where the routed pages (LoginPage or EmailPage) will be rendered -->
    <router-view></router-view>
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
/* No custom styles needed here, replaced with Tailwind classes in the template */
</style>
