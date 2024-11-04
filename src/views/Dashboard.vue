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
                <!-- Metric Cards Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <!-- Total Emails Scanned -->
                    <div class="bg-white rounded-lg shadow p-4">
                        <div class="flex justify-between items-center pb-2">
                            <h3 class="text-sm font-medium">Emails Scanned</h3>
                            <i class="text-gray-500">📧</i>
                        </div>
                        <div class="text-2xl font-bold">{{ metrics.totalScanned }}</div>
                        <p class="text-xs text-gray-500">
                            {{ calculatePercentageChange(metrics.previousTotalScanned, metrics.totalScanned) }}% from
                            last
                            period
                        </p>
                    </div>
                    <!-- Flagged Emails -->
                    <div class="bg-white rounded-lg shadow p-4">
                        <div class="flex justify-between items-center pb-2">
                            <h3 class="text-sm font-medium">Flagged Emails</h3>
                            <i class="text-red-500">⚠️</i>
                        </div>
                        <div class="text-2xl font-bold text-red-500">{{ metrics.flaggedEmails }}</div>
                        <p class="text-xs text-gray-500">
                            {{ calculateFlagRate(metrics.flaggedEmails, metrics.totalScanned) }}% flag rate
                        </p>
                    </div>
                    <!-- Average Risk Score -->
                    <div class="bg-white rounded-lg shadow p-4">
                        <div class="flex justify-between items-center pb-2">
                            <h3 class="text-sm font-medium">Avg Risk Score</h3>
                            <i class="text-green-500">🛡️</i>
                        </div>
                        <div class="text-2xl font-bold text-green-500">{{ metrics.averageRiskScore }}%</div>
                        <p class="text-xs text-gray-500">Safe threshold: 80%</p>
                    </div>
                    <!-- Suspicious URLs -->
                    <div class="bg-white rounded-lg shadow p-4">
                        <div class="flex justify-between items-center pb-2">
                            <h3 class="text-sm font-medium">Suspicious URLs</h3>
                            <i class="text-yellow-500">📊</i>
                        </div>
                        <div class="text-2xl font-bold text-yellow-500">{{ metrics.suspiciousUrls }}</div>
                        <p class="text-xs text-gray-500">
                            {{ calculatePercentageChange(metrics.previousSuspiciousUrls, metrics.suspiciousUrls) }}%
                            from
                            last period
                        </p>
                    </div>
                </div>
                <!-- Email Activity Chart -->
                <div class="bg-white rounded-lg shadow p-4">
                    <h3 class="text-lg font-semibold mb-4">Email Activity</h3>
                    <canvas ref="chartContainer" width="400" height="300" class="h-[300px]"></canvas>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { useRouter } from 'vue-router';
import Chart from 'chart.js/auto';
import Header from './components/Header.vue';

export default {
    name: 'Dashboard',
    components: {
        Header
    },
    data() {
        return {
            timeRange: '7d',
            metrics: {
                totalScanned: 0,
                previousTotalScanned: 0,
                flaggedEmails: 0,
                averageRiskScore: 0,
                suspiciousUrls: 0,
                previousSuspiciousUrls: 0
            },
            chart: null,
            router: null
        };
    },
    methods: {
        async fetchMetrics() {
            try {
                // Fetch email metrics from MongoDB
                const response = await fetch(`http://localhost:8080/metrics/${this.timeRange}`);
                const data = await response.json();

                this.metrics = {
                    totalScanned: data.totalEmails,
                    previousTotalScanned: data.previousTotalEmails,
                    flaggedEmails: data.flaggedEmails,
                    averageRiskScore: data.averageRiskScore,
                    suspiciousUrls: data.suspiciousUrls,
                    previousSuspiciousUrls: data.previousSuspiciousUrls
                };

                this.updateChart(data.dailyStats);
            } catch (error) {
                console.error('Error fetching metrics:', error);
            }
        },

        calculatePercentageChange(previous, current) {
            if (!previous) return 0;
            return (((current - previous) / previous) * 100).toFixed(1);
        },

        calculateFlagRate(flagged, total) {
            if (!total) return 0;
            return ((flagged / total) * 100).toFixed(1);
        },

        initChart() {
            const canvas = this.$refs.chartContainer;
            if (canvas && canvas.getContext) {
                const ctx = canvas.getContext('2d');
                this.chart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: [],
                        datasets: [
                            {
                                label: 'Total Emails',
                                data: [],
                                backgroundColor: '#60a5fa'
                            },
                            {
                                label: 'Flagged Emails',
                                data: [],
                                backgroundColor: '#ef4444'
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true, // Ensure the aspect ratio is maintained
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
            } else {
                console.error('Canvas element not found or getContext is not a function');
            }
        },

        updateChart(dailyStats) {
            if (!this.chart) return;

            this.chart.data.labels = dailyStats.map(stat => stat.date);
            this.chart.data.datasets[0].data = dailyStats.map(stat => stat.totalEmails);
            this.chart.data.datasets[1].data = dailyStats.map(stat => stat.flaggedEmails);
            this.chart.update();
        },

        navigateToEmailPage() {
            this.router.push('/emails');
        },

        logout() {
            chrome.storage.local.set({ loggedOut: true }, () => {
                this.$router.push('/login');
            });
        }
    },
    mounted() {
        this.initChart();
        this.fetchMetrics();
        this.router = useRouter();
    },
    beforeUnmount() {
        if (this.chart) {
            this.chart.destroy();
        }
    }
};
</script>

<style scoped>
canvas {
    max-width: 100%;
    height: auto;
}
</style>