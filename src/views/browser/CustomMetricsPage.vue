<template>
    <div class="min-h-screen bg-gray-100">
        <header class="bg-white shadow p-4">
            <h1 class="text-2xl font-bold text-gray-800">Custom Metrics Page</h1>
        </header>
        <div class="container mx-auto px-4 pt-8 pb-8">
            <div class="bg-white rounded-lg shadow p-4">
                <BarChart :chartData="chartData" :options="options" />
            </div>
        </div>
    </div>
</template>

<script>
import { defineComponent, h } from 'vue';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

export default defineComponent({
    name: 'CustomMetricsPage',
    components: {
        BarChart: defineComponent({
            extends: Bar,
            props: {
                chartData: {
                    type: Object,
                    required: true,
                    default: () => ({
                        labels: [],
                        datasets: []
                    })
                },
                options: {
                    type: Object,
                    required: true,
                    default: () => ({
                        responsive: true,
                        maintainAspectRatio: false
                    })
                }
            },
            setup(props) {
                return () => h(Bar, { chartData: props.chartData, options: props.options });
            }
        })
    },
    data() {
        return {
            chartData: {
                labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
                datasets: [
                    {
                        label: 'Dataset 1',
                        backgroundColor: '#42A5F5',
                        data: [40, 20, 12, 39, 10, 40, 39]
                    },
                    {
                        label: 'Dataset 2',
                        backgroundColor: '#66BB6A',
                        data: [30, 24, 19, 32, 25, 24, 20]
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        };
    }
});
</script>

<style scoped>
iframe {
    max-width: 100%;
    height: auto;
}
</style>