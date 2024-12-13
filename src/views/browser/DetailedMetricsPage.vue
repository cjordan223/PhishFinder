<template>
    <div class="min-h-screen w-full bg-gray-900 text-white relative">
        <!-- Particles background -->
        <div class="absolute inset-0">
            <Particles id="tsparticles" :particlesInit="particlesInit" :options="particlesOptions" />
        </div>

        <!-- Content -->
        <div class="relative z-10">
            <!-- Navigation -->
            <nav class="w-full bg-gray-800/80 backdrop-blur-sm p-4">
                <div class="container mx-auto px-4">
                    <div class="flex items-center justify-between max-w-7xl mx-auto">
                        <div class="flex items-center space-x-4">
                            <img src="/images/phishfinderlogo.png" alt="PhishFinder Logo" class="w-32 h-32">
                            <span class="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">Detailed
                                Analytics</span>
                        </div>
                        <button class="text-gray-300 hover:text-white" @click="goBack">
                            <ArrowLeftIcon class="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </nav>

            <!-- Main Content -->
            <main class="container mx-auto px-4 py-6 max-w-7xl">
                <!-- Two Column Layout -->
                <div class="grid grid-cols-2 gap-6">
                    <div
                        class="bg-gray-800 rounded-lg p-6 transform transition-transform duration-200 hover:scale-105 hover:shadow-lg">
                        <div id="chart5" style="width: 100%; height: 400px;"></div>
                        <button id="refreshButton5"
                            class="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">
                            Refresh Chart
                        </button>
                    </div>

                    <div
                        class="bg-gray-800 rounded-lg p-6 transform transition-transform duration-200 hover:scale-105 hover:shadow-lg">
                        <div id="chart6" style="width: 100%; height: 400px;"></div>
                        <button id="refreshButton6"
                            class="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">
                            Refresh Chart
                        </button>
                    </div>
                </div>
            </main>
        </div>
    </div>
</template>

<script setup>
import { ArrowLeftIcon } from '@heroicons/vue/24/outline';
import { loadFull } from "tsparticles";

const particlesInit = async (engine) => {
    await loadFull(engine);
};

function goBack() {
    chrome.tabs.getCurrent(tab => {
        if (tab && tab.id) {
            chrome.tabs.remove(tab.id);
        }
    });
}
</script>