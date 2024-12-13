import { createApp } from 'vue';
import DetailedMetricsPage from './views/browser/DetailedMetricsPage.vue';
import Particles from "vue3-particles";
import './assets/tailwind.css';
import './assets/main.css';
import './assets/browser.css';

const app = createApp(DetailedMetricsPage);
app.use(Particles);
app.mount('#browser-app'); 