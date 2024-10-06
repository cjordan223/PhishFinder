<template>
    <div id="app">
      <!-- Main layout structure -->
      <header>
        <nav>
          <h1>Phish Finder</h1>
          <router-link v-if="!isLoggedIn" to="/login">Login</router-link>
          <button v-if="isLoggedIn" @click="logout">Logout</button>
        </nav>
      </header>
  
      <!-- This is where the routed pages (LoginPage or EmailPage) will be rendered -->
      <router-view></router-view>
    </div>
  </template>
  
  <script>
  import { useRouter } from 'vue-router';
  
  export default {
    computed: {
      isLoggedIn() {
        return !this.loggedOut; // Change this based on your authentication state
      },
    },
    data() {
      return {
        loggedOut: true, // You can update this based on the Chrome storage
      };
    },
    mounted() {
      // Check if user is logged in and update the state accordingly
      chrome.storage.local.get('loggedOut', (result) => {
        this.loggedOut = result.loggedOut;
      });
    },
    methods: {
      logout() {
        chrome.identity.getAuthToken({ interactive: false }, (token) => {
          if (token) {
            chrome.identity.removeCachedAuthToken({ token }, () => {
              chrome.storage.local.set({ loggedOut: true }, () => {
                console.log('Logged out, redirecting to login page');
                window.location.href = '/login'; // Redirect to login
              });
            });
          }
        });
      },
    },
  };
  </script>
  
  <style scoped>
  /* App.vue */
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    background-color: #007bff;
    color: white;
  }
  
  nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  button {
    background-color: #ff4d4d;
    color: white;
    padding: 8px 15px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }
  
  button:hover {
    background-color: #ff1a1a;
  }
  </style>
  
  