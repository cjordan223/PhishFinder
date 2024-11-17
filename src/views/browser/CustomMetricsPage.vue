<template>
    <div class="min-h-screen bg-gray-900 text-white">
        <!-- Navigation -->
        <nav class="bg-gray-800 p-4">
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
        </nav>

        <!-- Main Content -->
        <main class="max-w-7xl mx-auto p-6">
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
                                <p class="text-4xl font-bold"></p>
                                <div id="chart" style="width: 220px; height: 140px;"></div>
                            </div>
                            <p v-else class="text-4xl font-bold">{{ stat.value }}</p>
                            <p v-if="stat.total && stat.label !== 'Compliant Devices'" class="text-sm text-gray-400">of
                                {{ stat.total }}</p>
                            <p class="text-sm text-gray-400">{{ stat.label }}</p>
                            <p v-if="stat.sublabel" class="text-sm text-gray-400">{{ stat.sublabel }}</p>
                        </div>
                        <div v-if="stat.showInfo" class="text-gray-400">
                            <InformationCircleIcon class="h-6 w-6" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Two Column Layout -->
            <div class="grid grid-cols-2 gap-6">
                <!-- Device Troubleshooting Card -->
                <div
                    class="bg-gray-800 rounded-lg p-6 transform transition-transform duration-200 hover:scale-105 hover:shadow-lg">
                    <div class="mb-4">
                        <h2 class="text-lg font-semibold">Device Troubleshooting</h2>
                        <p class="text-sm text-gray-400">606 Devices require your attention</p>
                    </div>
                    <div class="relative w-48 h-48">
                        <div class="absolute inset-0 flex items-center justify-center">
                            <div v-for="(item, index) in troubleshootingData" :key="index"
                                class="w-4 h-4 rounded-full mx-1" :style="{ backgroundColor: item.color }" />
                        </div>
                    </div>
                    <div class="mt-4">
                        <div v-for="(item, index) in troubleshootingData" :key="index"
                            class="flex items-center justify-between mt-2">
                            <span class="text-sm">{{ item.label }}</span>
                            <span class="text-sm">{{ item.percentage }}%</span>
                        </div>
                    </div>
                </div>

                <!-- Outstanding Patch Count Card -->
                <div
                    class="bg-gray-800 rounded-lg p-6 transform transition-transform duration-200 hover:scale-105 hover:shadow-lg">
                    <h2 class="text-lg font-semibold mb-4">Outstanding Patch Count</h2>
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
import { reactive, onMounted } from 'vue';
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
                // Dynamically import the SDK to avoid top-level await issues
                const { default: ChartsEmbedSDK } = await import('@mongodb-js/charts-embed-dom');

                const sdk = new ChartsEmbedSDK({
                    baseUrl: 'https://charts.mongodb.com/charts-project-0-waizlvy',
                });

                const chart = sdk.createChart({
                    chartId: '23d25ceb-7aaf-4afa-9099-e3d7fafc9872',
                });

                await chart.render(document.getElementById('chart'));
            } catch (error) {
                console.error('Failed to initialize chart:', error);
                window.alert('Chart failed to initialise');
            }
        }
    }
}
</script>

<style scoped>
/* Your styles here */
</style>