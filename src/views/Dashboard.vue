<template>
    <div class="min-h-screen">
        <Header @logout="logout" class="fixed top-0 w-full z-10" />

        <div class="container mx-auto px-4 pt-20 pb-8">
            <div class="metrics-dashboard">
                <!-- Header with time range selector -->
                <div class="flex justify-between items-center mb-6">
                    <h1 class="text-2xl font-bold text-white">Security Dashboard</h1>
                    <select v-model="timeRange" @change="fetchMetrics"
                        class="bg-white border border-gray-300 rounded-lg px-3 py-2">
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="90d">Last 90 days</option>
                    </select>
                </div>
                <!-- Button to open metrics in a new tab -->
                <div class="bg-white rounded-lg shadow p-4 mb-4">
                    <button @click="openMetricsPage" class="px-4 py-2 bg-blue-500 text-white rounded-lg">
                        Open Metrics in New Tab
                    </button>
                </div>
                <!-- Embedded Dashboard Iframe -->
                <div class="bg-white rounded-lg shadow p-4">
                    <iframe
                        style="background: #21313C;border: none;border-radius: 2px;box-shadow: 0 2px 10px 0 rgba(70, 76, 79, .2);width: 100%;height: 600px;"
                        src="https://charts.mongodb.com/charts-project-0-waizlvy/embed/dashboards?id=cb913134-f09f-4887-b801-d2e447be1950&theme=dark&autoRefresh=true&maxDataAge=3600&showTitleAndDesc=true&scalingWidth=scale&scalingHeight=fixed"></iframe>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { useRouter } from 'vue-router';
import Header from './components/Header.vue';

export default {
    name: 'Dashboard',
    components: {
        Header
    },
    data() {
        return {
            timeRange: '7d',
            router: null
        };
    },
    methods: {
        fetchMetrics() {
            // Fetch metrics logic here
        },
        openMetricsPage() {
            const metricsUrl = chrome.runtime.getURL('metrics.html');
            window.open(metricsUrl, '_blank');
        },
        logout() {
            chrome.storage.local.set({ loggedOut: true }, () => {
                this.$router.push('/login');
            });
        }
    },
    mounted() {
        this.router = useRouter();
    }
};
</script>

<style scoped>
iframe {
    max-width: 100%;
    height: auto;
}
</style>