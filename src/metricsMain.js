import { createApp } from 'vue';
import CustomMetricsPage from './views/browser/CustomMetricsPage.vue';
import Particles from "vue3-particles";
import './assets/tailwind.css';
import './assets/main.css';
import './assets/browser.css';

const app = createApp(CustomMetricsPage);

// Register Particles plugin
app.use(Particles);

app.mount('#browser-app');