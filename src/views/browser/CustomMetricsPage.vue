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
                                <!-- Ensure this div has the correct ID -->
                                <div id="chart1" style="width: 220px; height: 140px;"></div>
                                <button id="refreshButton1"
                                    class="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">Refresh
                                    Chart</button>
                            </div>
                            <div v-else-if="stat.label === 'Policies Executed'">
                                <!-- Ensure this div has the correct ID -->
                                <div id="chart2" style="width: 220px; height: 140px;"></div>
                                <button id="refreshButton2"
                                    class="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">Refresh
                                    Chart</button>
                            </div>
                            <div v-else-if="stat.label === 'Available Updates'">
                                <!-- Ensure this div has the correct ID -->
                                <div id="chart3" style="width: 220px; height: 140px;"></div>
                                <button id="refreshButton3"
                                    class="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">Refresh
                                    Chart</button>
                            </div>
                            <div v-else-if="stat.label === 'New Devices'">
                                <!-- Ensure this div has the correct ID -->
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
                <!-- Device Troubleshooting Card -->
                <div
                    class="bg-gray-800 rounded-lg p-6 transform transition-transform duration-200 hover:scale-105 hover:shadow-lg">
                    <div id="chart5" style="width: 100%; height: 300px;"></div>
                    <button id="refreshButton5"
                        class="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">Refresh
                        Chart</button>
                </div>

                <!-- Outstanding Patch Count Card -->
                <div
                    class="bg-gray-800 rounded-lg p-6 transform transition-transform duration-200 hover:scale-105 hover:shadow-lg">
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead>
                                <tr>
                                    <th class="text-left text-sm text-gray-400"></th>
                                    <th v-for="(col, index) in patchData.columns" :key="index"
                                        class="text-center text-sm text-gray-400 p-2">
                                        {{ col }}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(row, index) in patchData.rows" :key="index">
                                    <td class="text-sm text-gray-400">{{ row.severity }}</td>
                                    <td v-for="(value, valueIndex) in row.values" :key="valueIndex"
                                        class="text-center text-sm p-2">
                                        <span class="bg-purple-600 px-2 py-1 rounded">{{ value }}</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Placeholder for Device Health Card -->
            <div
                class="bg-gray-800 rounded-lg p-6 transform transition-transform duration-200 hover:scale-105 hover:shadow-lg mt-6">
                <h2 class="text-lg font-semibold mb-4">Device Health by Group</h2>
                <p class="text-sm text-gray-400">Placeholder content</p>
            </div>
        </main>
    </div>
</template>

<script>
import { reactive } from 'vue';
import { BellIcon, InformationCircleIcon } from '@heroicons/vue/24/outline'

export default {
    name: 'SecurityDashboard',
    components: {
        BellIcon,
        InformationCircleIcon
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
                    label: 'Available Updates',
                    sublabel: 'Exposed in last 7 days'
                },
                {
                    value: 28,
                    label: 'New Devices',
                    sublabel: 'Added in last 7 days'
                }
            ]),
            troubleshootingData: reactive([
                { label: 'Needs review', percentage: 45, color: '#3B82F6' },
                { label: 'Failed attempts', percentage: 30, color: '#22C55E' },
                { label: 'Not compatible', percentage: 25, color: '#8B5CF6' }
            ]),
            patchData: reactive({
                columns: ['90+ days', '61-89 days', '31-60 days', '16-30 days', '< 15 days'],
                rows: [
                    { severity: 'Critical', values: [14, 4, 27, 11, 50] },
                    { severity: 'High', values: [32, 5, 9, 3, 20] },
                    { severity: 'Medium', values: [16, 0, 0, 4, 7] },
                    { severity: 'Low', values: [0, 0, 0, 0, 0] },
                    { severity: 'Unknown', values: [158, 81, 70, 70, 125] }
                ]
            }),
            deviceHealthData: reactive({
                labels: ['Lodge Desktop', 'Lodge Core', 'Lodge Serv', 'Corp Services', 'Corp General'],
                datasets: [
                    {
                        label: 'Device Count',
                        data: [525, 397, 313, 129, 51],
                        backgroundColor: '#6366F1'
                    }
                ]
            }),
            chartOptions: reactive({
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#374151'
                        },
                        ticks: {
                            color: '#9CA3AF'
                        }
                    },
                    x: {
                        grid: {
                            color: '#374151'
                        },
                        ticks: {
                            color: '#9CA3AF'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            })
        }
    },
    mounted() {
        this.initializeChart();
    },
    methods: {
        async initializeChart() {
            try {
                const ChartsEmbedSDK = await import('@mongodb-js/charts-embed-dom');
                const sdk = new ChartsEmbedSDK.default({
                    baseUrl: 'https://charts.mongodb.com/charts-project-0-waizlvy',
                });

                const chart1 = sdk.createChart({
                    chartId: '23d25ceb-7aaf-4afa-9099-e3d7fafc9872',
                    theme: 'dark', // Set the theme to dark
                    autoRefresh: true, // Enable auto-refresh
                    maxDataAge: 3600, // Set max data age to 1 hour
                    showTitleAndDesc: false, // Hide title and description
                    scalingWidth: 'scale', // Scale width
                    scalingHeight: 'fixed' // Fixed height
                });

                await chart1.render(document.getElementById('chart1'));

                // Add event listener for refresh button
                document.getElementById('refreshButton1').addEventListener('click', () => chart1.refresh());

                const chart2 = sdk.createChart({
                    chartId: '5b422ef3-f8a6-4b50-8279-9fbb77a0419a',
                    theme: 'dark', // Set the theme to dark
                    autoRefresh: true, // Enable auto-refresh
                    maxDataAge: 3600, // Set max data age to 1 hour
                    showTitleAndDesc: false, // Hide title and description
                    scalingWidth: 'scale', // Scale width
                    scalingHeight: 'fixed' // Fixed height
                });

                await chart2.render(document.getElementById('chart2'));

                // Add event listener for refresh button
                document.getElementById('refreshButton2').addEventListener('click', () => chart2.refresh());

                const chart3 = sdk.createChart({
                    chartId: 'dfaa0dbd-40db-4435-acf1-850a4bd564a1',
                    theme: 'dark', // Set the theme to dark
                    autoRefresh: true, // Enable auto-refresh
                    maxDataAge: 3600, // Set max data age to 1 hour
                    showTitleAndDesc: false, // Hide title and description
                    scalingWidth: 'scale', // Scale width
                    scalingHeight: 'fixed' // Fixed height
                });

                await chart3.render(document.getElementById('chart3'));

                // Add event listener for refresh button
                document.getElementById('refreshButton3').addEventListener('click', () => chart3.refresh());

                const chart4 = sdk.createChart({
                    chartId: 'c84a0985-4aee-4cde-966a-121127273b1d',
                    theme: 'dark', // Set the theme to dark
                    autoRefresh: true, // Enable auto-refresh
                    maxDataAge: 3600, // Set max data age to 1 hour
                    showTitleAndDesc: false, // Hide title and description
                    scalingWidth: 'scale', // Scale width
                    scalingHeight: 'fixed' // Fixed height
                });

                await chart4.render(document.getElementById('chart4'));

                // Add event listener for refresh button
                document.getElementById('refreshButton4').addEventListener('click', () => chart4.refresh());

                const chart5 = sdk.createChart({
                    chartId: '6a11c51a-78a4-4cb7-83bb-968c4c0e8c9e',
                    theme: 'dark', // Set the theme to dark
                    autoRefresh: true, // Enable auto-refresh
                    maxDataAge: 3600, // Set max data age to 1 hour
                    showTitleAndDesc: false, // Hide title and description
                    scalingWidth: 'scale', // Scale width
                    scalingHeight: 'fixed' // Fixed height
                });

                await chart5.render(document.getElementById('chart5'));

                // Add event listener for refresh button
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