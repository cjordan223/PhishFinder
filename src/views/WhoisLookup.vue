<template>
    <div class="whois-lookup bg-gray-50 p-4 rounded-lg">
        <div class="flex justify-between items-center mb-4">
            <h4 class="font-semibold">Domain Information</h4>
            <button @click="fetchWhoisData" class="text-blue-600 hover:text-blue-800" :disabled="loading">
                Refresh
            </button>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center py-4">
            <LoadingSpinner />
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-red-600 py-2">
            {{ error }}
        </div>

        <!-- Data Display -->
        <div v-else-if="whoisData" class="space-y-3">
            <div class="grid grid-cols-2 gap-2">
                <div class="text-gray-600">Registration Date:</div>
                <div>{{ formatDate(whoisData.creationDate) }}</div>

                <div class="text-gray-600">Expiration Date:</div>
                <div>{{ formatDate(whoisData.expiryDate) }}</div>

                <div class="text-gray-600">Registrar:</div>
                <div>{{ whoisData.registrar }}</div>
            </div>

            <!-- Additional WHOIS Details -->
            <div v-if="whoisData.additionalDetails" class="mt-4">
                <h5 class="font-medium mb-2">Additional Details</h5>
                <div class="text-sm space-y-1">
                    <div v-for="(value, key) in whoisData.additionalDetails" :key="key">
                        <span class="text-gray-600">{{ formatKey(key) }}:</span>
                        <span class="ml-2">{{ value }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- No Data State -->
        <div v-else class="text-gray-500 py-2">
            No WHOIS data available for {{ domain }}
        </div>
    </div>
</template>

<script>
import { ref } from 'vue';
import { emailHelpers } from '@/utils/utils';
import LoadingSpinner from './components/LoadingSpinner.vue';

export default {
    name: 'WhoisLookup',
    components: {
        LoadingSpinner
    },
    props: {
        domain: {
            type: String,
            required: true
        }
    },
    setup(props) {
        const whoisData = ref(null);
        const loading = ref(false);
        const error = ref(null);

        async function fetchWhoisData() {
            if (!props.domain) return;

            loading.value = true;
            error.value = null;

            try {
                const response = await fetch(`http://localhost:8080/whois/${props.domain}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch WHOIS data');
                }
                whoisData.value = await response.json();
            } catch (err) {
                error.value = err.message;
            } finally {
                loading.value = false;
            }
        }

        function formatDate(date) {
            return emailHelpers.formatDate(date);
        }

        function formatKey(key) {
            return key.split(/(?=[A-Z])/).join(' ');
        }

        // Fetch data on mount
        fetchWhoisData();

        return {
            whoisData,
            loading,
            error,
            fetchWhoisData,
            formatDate,
            formatKey
        };
    }
};
</script>