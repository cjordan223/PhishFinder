<!-- src/App.vue -->
<template>
  <div id="app">
    <!-- Main layout structure -->
    <header class="flex justify-between items-center p-4 bg-blue-500 text-white">
      <nav>
        <!--  can add nav items here if needed -->
      </nav>
    </header>

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
