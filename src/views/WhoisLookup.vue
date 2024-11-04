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
        <div v-else-if="whoisData" class="space-y-3">
            <div class="grid grid-cols-2 gap-2">
                <div class="text-gray-600">Domain:</div>
                <div>{{ whoisData?.whoisData?.domain?.domain || 'N/A' }}</div>

                <div class="text-gray-600">Registrar:</div>
                <div>{{ whoisData?.whoisData?.registrar?.name || 'N/A' }}</div>

                <div class="text-gray-600">Organization:</div>
                <div>{{ whoisData?.whoisData?.registrant?.organization || 'N/A' }}</div>

                <div class="text-gray-600">WHOIS Server:</div>
                <div>{{ whoisData?.whoisData?.domain?.whois_server || 'N/A' }}</div>
            </div>

            <!-- Additional Details -->
            <div class="mt-4">
                <h5 class="font-medium mb-2">Administrative Contact</h5>
                <div class="text-sm space-y-1">
                    <div>
                        <span class="text-gray-600">Organization:</span>
                        <span class="ml-2">{{ whoisData?.whoisData?.administrative?.organization || 'N/A' }}</span>
                    </div>
                    <div>
                        <span class="text-gray-600">Province:</span>
                        <span class="ml-2">{{ whoisData?.whoisData?.administrative?.province || 'N/A' }}</span>
                    </div>
                    <div>
                        <span class="text-gray-600">Country:</span>
                        <span class="ml-2">{{ whoisData?.whoisData?.administrative?.country || 'N/A' }}</span>
                    </div>
                </div>
            </div>

            <!-- Technical Contact -->
            <div class="mt-4">
                <h5 class="font-medium mb-2">Technical Contact</h5>
                <div class="text-sm space-y-1">
                    <div>
                        <span class="text-gray-600">Organization:</span>
                        <span class="ml-2">{{ whoisData?.whoisData?.technical?.organization || 'N/A' }}</span>
                    </div>
                    <div>
                        <span class="text-gray-600">Email:</span>
                        <span class="ml-2">{{ whoisData?.whoisData?.technical?.email || 'N/A' }}</span>
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

<script setup>
import { ref, onMounted } from 'vue';
import { dnsCache } from '@/utils/dnsCache'; // Import the DNS cache
import LoadingSpinner from './components/LoadingSpinner.vue';

const whoisData = ref(null);
const loading = ref(false);
const error = ref(null);
let isInitialFetch = true;

const props = defineProps({
    domain: {
        type: String,
        required: true
    },
    emailId: {
        type: String,
        required: true
    }
});

const emit = defineEmits(['mounted']);

async function fetchWhoisData() {
    if (!isInitialFetch) {
        console.log('Skipping duplicate fetch');
        return;
    }

    if (!props.domain) {
        console.warn('No domain provided for WHOIS lookup');
        return;
    }

    loading.value = true;
    error.value = null;

    try {
        // Check cache first
        const cachedData = dnsCache.get(props.domain);
        console.log('Checking cache for domain:', props.domain);

        if (cachedData) {
            console.log('Using cached WHOIS data for:', props.domain);
            whoisData.value = cachedData;

            // Always update database when emailId is provided, even with cached data
            if (props.emailId) {
                console.log('Updating database with cached WHOIS data');
                await updateDatabaseAssociation();
            }
        } else {
            // Fetch new data if not cached
            const response = await fetch(`http://localhost:8080/whois/${encodeURIComponent(props.domain)}`, {
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
            console.log('Received new WHOIS data:', data);

            if (data.success) {
                whoisData.value = data;
                dnsCache.set(props.domain, data);

                // Update database with new data
                if (props.emailId) {
                    await updateDatabaseAssociation();
                }
            }
        }
    } catch (err) {
        console.error('WHOIS lookup error:', err);
        error.value = `Failed to fetch WHOIS data: ${err.message}`;
    } finally {
        loading.value = false;
        isInitialFetch = false;
    }
}

// Separate function for database updates
async function updateDatabaseAssociation() {
    try {
        const updateUrl = `http://localhost:8080/whois/${encodeURIComponent(props.domain)}/${encodeURIComponent(props.emailId)}`;
        console.log('Updating database association:', updateUrl);

        const updateResponse = await fetch(updateUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (!updateResponse.ok) {
            console.error('Failed to update WHOIS database association');
        } else {
            console.log('Successfully updated WHOIS database association');
        }
    } catch (err) {
        console.error('Error updating WHOIS database:', err);
    }
}

// Add a function to clear cache for testing
function clearCache() {
    console.log('Clearing DNS cache');
    dnsCache.clear();
}

onMounted(() => {
    console.log('WhoisLookup mounted for domain:', props.domain);
    emit('mounted');
    if (!isInitialFetch) return;
    fetchWhoisData();
});
</script>