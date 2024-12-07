<template>
    <header class="flex items-center justify-between p-4 bg-primary text-white">
        <div class="flex items-center space-x-2">
            <img src="/images/phishfinderlogo.png" alt="PhishFinder Logo" class="w-8 h-8">
            <h1 class="text-2xl font-bold">PhishFinder</h1>
        </div>
        <div class="flex items-center space-x-4">
            <button @click="openMetrics"
                class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors">
                Open Metrics
            </button>
            <button @click="handleLogout"
                class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors">
                Logout
            </button>
        </div>
    </header>
</template>

<script setup>
import { logout } from '@/utils/oauth';
const emit = defineEmits(['logout']);

function openMetrics() {
    chrome.tabs.create({ url: chrome.runtime.getURL('metrics.html') });
}

async function handleLogout() {
    try {
        await logout();
        emit('logout');
    } catch (error) {
        console.error('Logout failed:', error);
    }
}
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