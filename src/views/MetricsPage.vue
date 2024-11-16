<template>
    <div class="min-h-screen bg-gray-100">
        <Header @logout="logout" class="fixed top-0 w-full z-10" />
        <div class="container mx-auto px-4 pt-20 pb-8">
            <div class="bg-white rounded-lg shadow p-4">
                <h1 class="text-2xl font-bold text-gray-800 mb-4">Metrics Page</h1>
                <iframe
                    style="background: #21313C;border: none;border-radius: 2px;box-shadow: 0 2px 10px 0 rgba(70, 76, 79, .2);width: 100%;height: 600px;"
                    src="https://charts.mongodb.com/charts-project-0-waizlvy/embed/dashboards?id=cb913134-f09f-4887-b801-d2e447be1950&theme=dark&autoRefresh=true&maxDataAge=3600&showTitleAndDesc=true&scalingWidth=scale&scalingHeight=fixed"></iframe>
            </div>
        </div>
    </div>
</template>

<script>
import { useRouter } from 'vue-router';
import Header from './components/Header.vue';

export default {
    name: 'MetricsPage',
    components: {
        Header
    },
    methods: {
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