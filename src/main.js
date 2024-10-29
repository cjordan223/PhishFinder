import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './assets/tailwind.css'; // Add this line to import Tailwind CSS
import './assets/main.css'; // Add this line to import Tailwind CSS
const app = createApp(App);

console.log("Router instance: ", router);  // Log router instance to verify

app.use(router);   
app.mount('#app');    
