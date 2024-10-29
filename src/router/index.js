import { createRouter, createWebHashHistory } from 'vue-router';
import LoginPage from '../views/LoginPage.vue';
import EmailPage from '../views/EmailPage.vue';
import Dashboard from '../views/Dashboard.vue';   

const routes = [
  { path: '/login', name: 'Login', component: LoginPage },
  { path: '/emails', name: 'Emails', component: EmailPage, meta: { requiresAuth: true } },
  { path: '/dashboard', name: 'Dashboard', component: Dashboard, meta: { requiresAuth: true } },  // Add Dashboard route
  { path: '/', redirect: '/login' }  // Default redirect to login page
];

const router = createRouter({
  history: createWebHashHistory(),  // Using hash mode for Chrome extensions
  routes,
});

router.beforeEach((to, from, next) => {
  chrome.storage.local.get('loggedOut', (result) => {
    console.log("Checking if logged out:", result.loggedOut);

    if (to.matched.some(record => record.meta.requiresAuth)) {
      if (result.loggedOut) {
        console.log("User is logged out, redirecting to login.");
        next('/login');  // Use Vue Router's next() to navigate
      } else {
        chrome.identity.getAuthToken({ interactive: false }, (token) => {
          if (token) {
            console.log("Token found, allowing navigation to:", to.path);
            next();  // Allow navigation
          } else {
            console.log("No token found, redirecting to login.");
            next('/login');  // Redirect to login page
          }
        });
      }
    } else {
      next();  // Proceed normally if the route doesn't require authentication
    }
  });
});

export default router;