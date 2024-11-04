<template>
    <div class="whois-lookup bg-gray-50 p-4 rounded-lg">
        <div class="flex justify-between items-center mb-4">
            <h4 class="font-semibold">Domain Information</h4>
            <button @click="refreshData" class="text-blue-600 hover:text-blue-800" :disabled="loading"
                :class="{ 'opacity-50 cursor-not-allowed': loading }">
                <span v-if="loading">Refreshing...</span>
                <span v-else>Refresh</span>
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
        <div v-else-if="whoisData?.whoisData" class="space-y-3">
            <div class="grid grid-cols-2 gap-2">
                <div class="text-gray-600">Registration Date:</div>
                <div>{{ formatDate(whoisData.whoisData.domain.created_date) }}</div>

                <div class="text-gray-600">Expiration Date:</div>
                <div>{{ formatDate(whoisData.whoisData.domain.expiration_date) }}</div>

                <div class="text-gray-600">Registrar:</div>
                <div>{{ whoisData.whoisData.registrar?.name || 'N/A' }}</div>
            </div>

            <!-- Additional WHOIS Details -->
            <div v-if="whoisData.whoisData.domain" class="mt-4">
                <h5 class="font-medium mb-2">Additional Details</h5>
                <div class="text-sm space-y-1">
                    <div>
                        <span class="text-gray-600">Domain:</span>
                        <span class="ml-2">{{ whoisData.whoisData.domain.domain }}</span>
                    </div>
                    <div>
                        <span class="text-gray-600">Name Servers:</span>
                        <span class="ml-2">{{ whoisData.whoisData.domain.name_servers?.join(', ') }}</span>
                    </div>
                    <div>
                        <span class="text-gray-600">Status:</span>
                        <span class="ml-2">{{ whoisData.whoisData.domain.status?.join(', ') }}</span>
                    </div>
                    <div>
                        <span class="text-gray-600">Last Updated:</span>
                        <span class="ml-2">{{ formatDate(whoisData.whoisData.domain.updated_date) }}</span>
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
import { ref, onMounted } from 'vue';
import { emailHelpers } from '@/utils/utils';
import { dnsCache } from '@/utils/dnsCache'; // Import the DNS cache
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

        // Add a force refresh option
        const forceRefresh = ref(false);

        async function fetchWhoisData() {
            if (!props.domain) {
                console.warn('No domain provided for WHOIS lookup');
                return;
            }

            loading.value = true;
            error.value = null;

            const url = `http://localhost:8080/whois/${props.domain}`;
            console.log('Sending request to:', url);

            try {
                // Check cache first
                const cachedData = dnsCache.get(props.domain);
                if (cachedData && !forceRefresh.value) {
                    console.log('Using cached WHOIS data');
                    whoisData.value = cachedData;
                    return;
                }

                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log('Received WHOIS data:', data);

                whoisData.value = data;
                dnsCache.set(props.domain, data);

            } catch (err) {
                console.error('WHOIS lookup error:', err);
                error.value = `Failed to fetch WHOIS data: ${err.message}`;
            } finally {
                loading.value = false;
                forceRefresh.value = false;
            }
        }

        // Add method to force refresh
        function refreshData() {
            forceRefresh.value = true;
            fetchWhoisData();
        }

        function formatDate(date) {
            return emailHelpers.formatDate(date);
        }

        function formatKey(key) {
            return key.split(/(?=[A-Z])/).join(' ');
        }

        // Fetch data on mount
        fetchWhoisData();
        console.log('WHOIS data fetched:', whoisData.value);

        // Add this to debug props
        onMounted(() => {
            console.log('whois.registrar', whoisData.value?.registrar);
            console.log('whois.creationDate', whoisData.value?.creationDate);
            console.log('whois.expiryDate', whoisData.value?.expiryDate);

        });

        return {
            whoisData,
            loading,
            error,
            fetchWhoisData,
            refreshData,
            formatDate,
            formatKey
        };
    }
};
</script>