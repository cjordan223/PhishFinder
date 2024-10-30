import { createRouter, createWebHashHistory } from 'vue-router';
import LoginPage from '../views/LoginPage.vue';
import EmailPage from '../views/EmailPage.vue';
import Dashboard from '../views/Dashboard.vue';

const routes = [
  { path: '/login', name: 'Login', component: LoginPage },
  { path: '/emails', name: 'Emails', component: EmailPage, meta: { requiresAuth: true } },
  { path: '/dashboard', name: 'Dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/', redirect: '/login' }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  chrome.storage.local.get('loggedOut', (result) => {
    if (to.matched.some(record => record.meta.requiresAuth)) {
      if (result.loggedOut) {
        next('/login');
      } else {
        chrome.identity.getAuthToken({ interactive: false }, (token) => {
          if (token) {
            next();
          } else {
            chrome.storage.local.set({ loggedOut: true }, () => {
              next('/login');
            });
          }
        });
      }
    } else if (to.path === '/login' && !result.loggedOut) {
      // Redirect to emails if already logged in
      next('/emails');
    } else {
      next();
    }
  });
});

export default router;