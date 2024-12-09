<template>
    <div class="min-h-screen w-full bg-gray-900 text-white relative">
        <!-- Particles Container with error handling -->
        <div class="absolute inset-0">
            <Particles id="tsparticles" :particlesInit="particlesInit" :options="{
                background: {
                    color: {
                        value: 'transparent'
                    }
                },
                fpsLimit: 60,
                particles: {
                    color: {
                        value: '#ffffff'
                    },
                    links: {
                        color: '#ffffff',
                        distance: 150,
                        enable: true,
                        opacity: 0.2,
                        width: 1
                    },
                    move: {
                        enable: true,
                        speed: 1
                    },
                    number: {
                        density: {
                            enable: true,
                            area: 800
                        },
                        value: 80
                    },
                    opacity: {
                        value: 0.2
                    },
                    size: {
                        value: { min: 1, max: 3 }
                    }
                },
                detectRetina: true
            }" />
        </div>

        <!-- Existing Content (with z-index to appear above particles) -->
        <div class="relative z-10">
            <!-- Navigation -->
            <nav class="w-full bg-gray-800/80 backdrop-blur-sm p-4">
                <div class="container mx-auto px-4">
                    <div class="flex items-center justify-between max-w-7xl mx-auto">
                        <div class="flex items-center space-x-4">
                            <img src="/images/phishfinderlogo.png" alt="PhishFinder Logo" class="w-32 h-32">
                            <span
                                class="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">PhishFinder</span>
                        </div>
                        <div class="flex items-center space-x-4">
                            <button class="text-gray-300 hover:text-white flex items-center space-x-2"
                                @click="navigateToDetails">
                                <ChartBarIcon class="h-5 w-5" />
                                <span>Detailed Analytics</span>
                            </button>
                            <button class="text-gray-300 hover:text-white">
                                <BellIcon class="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <!-- Main Content -->
            <main class="container mx-auto px-4 py-6">
                <div class="flex justify-between items-center mb-6">
                    <h1 class="text-2xl font-bold">Welcome, Conner! 👋</h1>
                    <button class="bg-gray-700 px-4 py-2 rounded-md">EXPORT PDF</button>
                </div>

                <!-- Top Stats Section -->
                <div class="grid grid-cols-2 gap-4 mb-8">
                    <!-- First Card -->
                    <div
                        class="bg-gray-800 rounded-lg p-6 transform transition-transform duration-200 hover:scale-105 hover:shadow-lg">
                        <div class="flex flex-col h-full">
                            <h3 class="text-xl font-semibold mb-4">Security Overview</h3>
                            <div class="space-y-4">
                                <div class="flex justify-between items-center">
                                    <span>Threat Level</span>
                                    <span class="text-green-400">Low</span>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span>Active Threats</span>
                                    <span class="text-red-400">3</span>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span>Last Scan</span>
                                    <span>2 hours ago</span>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span>Protected Emails</span>
                                    <span>1,234</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Second Card -->
                    <div
                        class="bg-gray-800 rounded-lg p-6 transform transition-transform duration-200 hover:scale-105 hover:shadow-lg">
                        <div class="flex items-center justify-center h-full">
                            <div id="chart1" style="width: 100%; height: 200px;"></div>
                            <button id="refreshButton1"
                                class="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">
                                Refresh Chart
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Stats Section -->
                <div class="grid grid-cols-3 gap-4 mb-8">
                    <div v-for="(stat, index) in stats.slice(1)" :key="index"
                        class="bg-gray-800 rounded-lg p-6 transform transition-transform duration-200 hover:scale-105 hover:shadow-lg">
                        <div class="flex items-center justify-between">
                            <div>
                                <div v-if="stat.label === 'Compliant Devices'">
                                    <div id="chart2" style="width: 220px; height: 140px;"></div>
                                    <button id="refreshButton2"
                                        class="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">
                                        Refresh Chart
                                    </button>
                                </div>
                                <div v-else-if="stat.label === 'Policies Executed'">
                                    <div id="chart3" style="width: 220px; height: 140px;"></div>
                                    <button id="refreshButton3"
                                        class="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">
                                        Refresh Chart
                                    </button>
                                </div>
                                <div v-else-if="stat.label === 'Available Updates'">
                                    <div id="chart4" style="width: 220px; height: 140px;"></div>
                                    <button id="refreshButton4"
                                        class="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">
                                        Refresh Chart
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </div>
</template>

<script setup>
import { BellIcon, ChartBarIcon } from '@heroicons/vue/24/outline';
import { reactive, onMounted } from 'vue';
import { apiHelpers } from '@/utils/utils';
import { loadFull } from "tsparticles";

const stats = reactive([
    {
        value: 917,
        total: 2261,
        label: 'Compliant Devices',
        showInfo: true
    },
    {
        value: 1117,
        label: 'Policies Executed',
        sublabel: 'in the last 7 days'
    },
    {
        value: 171,
        label: 'Available Updates'
    },
    {
        value: 45,
        label: 'New Devices'
    }
]);

const particlesInit = async (engine) => {
    try {
        await loadFull(engine);
        console.log('Particles initialized successfully');
    } catch (error) {
        console.error('Error initializing particles:', error);
    }
};

function navigateToDetails() {
    chrome.tabs.create({ url: chrome.runtime.getURL('detailed-metrics.html') });
}

onMounted(() => {
    initializeChart();
});

async function initializeChart() {
    try {
        const token = await apiHelpers.getAuthToken();
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo?access_token=' + token);
        const userData = await response.json();
        const userEmail = userData.email;

        console.log('User email:', userEmail);

        const ChartsEmbedSDK = await import('@mongodb-js/charts-embed-dom');
        const sdk = new ChartsEmbedSDK.default({
            baseUrl: 'https://charts.mongodb.com/charts-project-0-waizlvy',
        });

        const emailFilter = {
            'receiver.address': {
                $regex: userEmail,
                $options: 'i'
            }
        };

        console.log('MongoDB Filter:', JSON.stringify(emailFilter, null, 2));

        const chart1 = sdk.createChart({
            chartId: '23d25ceb-7aaf-4afa-9099-e3d7fafc9872',
            theme: 'dark',
            autoRefresh: true,
            maxDataAge: 3600,
            showTitleAndDesc: false,
            scalingWidth: 'scale',
            scalingHeight: 'fixed',
            filter: emailFilter,
            debug: true
        });

        try {
            await chart1.render(document.getElementById('chart1'));
        } catch (error) {
            console.error('Chart render error:', error);
            try {
                const parsedError = JSON.parse(error.message);
                console.error('Parsed error:', parsedError);
            } catch (e) {
                console.error('Raw error:', error.message);
            }
        }

        document.getElementById('refreshButton1').addEventListener('click', () => chart1.refresh());

        const charts = [
            { id: 'chart2', buttonId: 'refreshButton2', chartId: '5b422ef3-f8a6-4b50-8279-9fbb77a0419a' },
            { id: 'chart3', buttonId: 'refreshButton3', chartId: 'dfaa0dbd-40db-4435-acf1-850a4bd564a1' },
            { id: 'chart4', buttonId: 'refreshButton4', chartId: 'c84a0985-4aee-4cde-966a-121127273b1d' }
        ];

        for (const chart of charts) {
            const chartInstance = sdk.createChart({
                chartId: chart.chartId,
                theme: 'dark',
                autoRefresh: true,
                maxDataAge: 3600,
                showTitleAndDesc: false,
                scalingWidth: 'scale',
                scalingHeight: 'fixed'
            });

            await chartInstance.render(document.getElementById(chart.id));
            document.getElementById(chart.buttonId).addEventListener('click', () => chartInstance.refresh());
        }
    } catch (error) {
        console.error('Failed to initialize chart:', error);
        const elements = ['chart1', 'chart2', 'chart3', 'chart4'];
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = 'Chart failed to load';
            }
        });
    }
}
</script>

<style scoped>
/* Your styles here */
#tsparticles {
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 0;
}
</style>