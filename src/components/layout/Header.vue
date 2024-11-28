<template>
    <div>
        <nav
            class="bg-white dark:bg-gray-900 fixed w-full z-20 top-0 start-0 border-b border-gray-200 dark:border-gray-600 mb-8">
            <div class="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
                <router-link to="/" class="flex items-center space-x-3 rtl:space-x-reverse">
                    <img src="/images/phishfinderlogo.png" class="h-8" alt="PhishFinder Logo">
                    <span
                        class="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">PhishFinder</span>
                </router-link>
                <div class="flex md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
                    <button @click="openMetricsPage"
                        class="bg-blue-500 hover:bg-blue-600 text-white font-mono px-6 py-2 mx-2 rounded-lg transition-colors">Open
                        Metrics</button>
                    <button @click="logout"
                        class="bg-red-500 hover:bg-red-600 text-white font-mono px-6 py-2 mx-2 rounded-lg transition-colors">Logout</button><button
                        data-collapse-toggle="navbar-sticky" type="button"
                        class="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
                        aria-controls="navbar-sticky" aria-expanded="false">
                        <span class="sr-only">Open main menu</span>
                        <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none"
                            viewBox="0 0 17 14">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M1 1h15M1 7h15M1 13h15" />
                        </svg>
                    </button>
                </div>

            </div>
        </nav>
        <SecurityInfoHeader class="fixed w-full top-16 z-10" />
        <div class="mt-32">
            <slot></slot>
        </div>
    </div>
</template>

<script>
import SecurityInfoHeader from './SecurityInfoHeader.vue';

export default {
    name: 'Header',
    methods: {
        logout() {
            chrome.storage.local.set({ loggedOut: true }, () => {
                this.$router.push('/login');
            });
        },
        openMetricsPage() {
            const metricsUrl = chrome.runtime.getURL('metrics.html');
            window.open(metricsUrl, '_blank');
        }
    }
};
</script>

<style scoped>
.font-mono {
    font-family: 'Space Mono', monospace;
}

.transition-colors {
    transition-property: color, background-color;
    transition-duration: 200ms;
    transition-timing-function: ease-in-out;
}
</style>