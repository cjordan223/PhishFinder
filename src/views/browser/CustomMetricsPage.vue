<template>
    <div class="min-h-screen w-full bg-gray-900 text-white">
        <!-- Navigation -->
        <nav class="w-full bg-gray-800 p-4">
            <div class="container mx-auto px-4">
                <div class="flex items-center justify-between max-w-7xl mx-auto">
                    <div class="flex items-center space-x-4">
                        <span
                            class="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">PhishFinder</span>
                    </div>
                    <div class="flex items-center space-x-4">
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
                <h1 class="text-2xl font-bold">Welcome, User! 👋</h1>
                <button class="bg-gray-700 px-4 py-2 rounded-md">EXPORT PDF</button>
            </div>

            <!-- Top Stats Section -->
            <div class="grid grid-cols-4 gap-4 mb-8">
                <div v-for="(stat, index) in stats" :key="index"
                    class="bg-gray-800 rounded-lg p-6 transform transition-transform duration-200 hover:scale-105 hover:shadow-lg">
                    <div class="flex items-center justify-between">
                        <div>
                            <div v-if="stat.label === 'Compliant Devices'">
                                <div id="chart1" style="width: 220px; height: 140px;"></div>
                                <button id="refreshButton1"
                                    class="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">Refresh
                                    Chart</button>
                            </div>
                            <div v-else-if="stat.label === 'Policies Executed'">
                                <div id="chart2" style="width: 220px; height: 140px;"></div>
                                <button id="refreshButton2"
                                    class="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">Refresh
                                    Chart</button>
                            </div>
                            <div v-else-if="stat.label === 'Available Updates'">
                                <div id="chart3" style="width: 220px; height: 140px;"></div>
                                <button id="refreshButton3"
                                    class="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">Refresh
                                    Chart</button>
                            </div>
                            <div v-else-if="stat.label === 'New Devices'">
                                <div id="chart4" style="width: 220px; height: 140px;"></div>
                                <button id="refreshButton4"
                                    class="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">Refresh
                                    Chart</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Two Column Layout -->
            <div class="grid grid-cols-2 gap-6">
                <div
                    class="bg-gray-800 rounded-lg p-6 transform transition-transform duration-200 hover:scale-105 hover:shadow-lg">
                    <div id="chart5" style="width: 100%; height: 300px;"></div>
                    <button id="refreshButton5"
                        class="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">Refresh
                        Chart</button>
                </div>
            </div>
        </main>
    </div>
</template>

<script>
import { reactive } from 'vue';
import { BellIcon } from '@heroicons/vue/24/outline';
import { apiHelpers } from '@/utils/utils';

export default {
    name: 'SecurityDashboard',
    components: {
        BellIcon
    },
    data() {
        return {
            stats: reactive([
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
            ])
        };
    },
    mounted() {
        this.initializeChart();
    },
    methods: {
        async initializeChart() {
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

                // Create a filter that uses regex to match the email anywhere in receiver.address
                const emailFilter = {
                    'receiver.address': {
                        $regex: userEmail,
                        $options: 'i'  // case-insensitive
                    }
                };

                // Add debug logging
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

                // Add event listener for refresh button
                document.getElementById('refreshButton1').addEventListener('click', () => chart1.refresh());

                const chart2 = sdk.createChart({
                    chartId: '5b422ef3-f8a6-4b50-8279-9fbb77a0419a',
                    theme: 'dark',
                    autoRefresh: true,
                    maxDataAge: 3600,
                    showTitleAndDesc: false,
                    scalingWidth: 'scale',
                    scalingHeight: 'fixed'
                });

                await chart2.render(document.getElementById('chart2'));
                document.getElementById('refreshButton2').addEventListener('click', () => chart2.refresh());

                const chart3 = sdk.createChart({
                    chartId: 'dfaa0dbd-40db-4435-acf1-850a4bd564a1',
                    theme: 'dark',
                    autoRefresh: true,
                    maxDataAge: 3600,
                    showTitleAndDesc: false,
                    scalingWidth: 'scale',
                    scalingHeight: 'fixed'
                });

                await chart3.render(document.getElementById('chart3'));
                document.getElementById('refreshButton3').addEventListener('click', () => chart3.refresh());

                const chart4 = sdk.createChart({
                    chartId: 'c84a0985-4aee-4cde-966a-121127273b1d',
                    theme: 'dark',
                    autoRefresh: true,
                    maxDataAge: 3600,
                    showTitleAndDesc: false,
                    scalingWidth: 'scale',
                    scalingHeight: 'fixed'
                });

                await chart4.render(document.getElementById('chart4'));
                document.getElementById('refreshButton4').addEventListener('click', () => chart4.refresh());

                const chart5 = sdk.createChart({
                    chartId: '6a11c51a-78a4-4cb7-83bb-968c4c0e8c9e',
                    theme: 'dark',
                    autoRefresh: true,
                    maxDataAge: 3600,
                    showTitleAndDesc: false,
                    scalingWidth: 'scale',
                    scalingHeight: 'fixed'
                });

                await chart5.render(document.getElementById('chart5'));
                document.getElementById('refreshButton5').addEventListener('click', () => chart5.refresh());
            } catch (error) {
                console.error('Failed to initialize chart:', error);
                const chartElement1 = document.getElementById('chart1');
                if (chartElement1) {
                    chartElement1.innerHTML = 'Chart failed to load';
                }
                const chartElement2 = document.getElementById('chart2');
                if (chartElement2) {
                    chartElement2.innerHTML = 'Chart failed to load';
                }
                const chartElement3 = document.getElementById('chart3');
                if (chartElement3) {
                    chartElement3.innerHTML = 'Chart failed to load';
                }
                const chartElement4 = document.getElementById('chart4');
                if (chartElement4) {
                    chartElement4.innerHTML = 'Chart failed to load';
                }
                const chartElement5 = document.getElementById('chart5');
                if (chartElement5) {
                    chartElement5.innerHTML = 'Chart failed to load';
                }
            }
        }
    }
}
</script>

<style scoped>
/* Your styles here */
</style>