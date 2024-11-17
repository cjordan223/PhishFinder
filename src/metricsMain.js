import { createApp } from 'vue';
import CustomMetricsPage from './views/browser/CustomMetricsPage.vue';
import './assets/tailwind.css';
import './assets/main.css';

const app = createApp(CustomMetricsPage);
app.mount('#browser-app');