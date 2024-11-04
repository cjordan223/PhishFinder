<script setup>
import { computed, ref } from 'vue';
import AuthenticationBadge from './components/AuthenticationBadge.vue';
import RiskBadge from './components/RiskBadge.vue';
import UrlStatusIcon from './components/UrlStatusIcon.vue';

const props = defineProps({
    authentication: {
        type: Object,
        required: true,
        default: () => ({})
    },
    analysis: {
        type: Object,
        required: true,
        default: () => ({})
    },
    urls: {
        type: Array,
        default: () => []
    }
});

// Add debug logging
console.log('Authentication data:', props.authentication);

const getAuthStatus = (type) => {
    if (!props.authentication?.summary) {
        console.warn('No authentication summary found');
        return null;
    }

    const summary = props.authentication.summary;
    console.log(`Checking ${type} status from summary:`, summary);

    const match = summary.match(new RegExp(`${type}: (Pass|Fail)`));
    const status = match ? match[1].toLowerCase() : null;
    console.log(`${type} status:`, status);
    return status;
};

const getAuthTooltip = (type) => {
    if (!props.authentication) return 'Not available';
    const values = {
        spf: props.authentication.spf,
        dkim: props.authentication.dkim,
        dmarc: props.authentication.dmarc
    };
    return `${type}: ${values[type.toLowerCase()] || 'Not available'}`;
};

const suspiciousKeywords = computed(() => {
    return props.analysis?.suspiciousKeywords?.map(keyword => ({
        type: keyword.type,
        matches: keyword.matches,
        location: keyword.location
    })) || [];
});

function getUrlStatus(url) {
    if (props.analysis?.safeBrowsingResult?.some(result => result.url === url)) {
        return 'malicious';
    }
    return props.analysis?.linkRisks?.some(risk => risk.url === url) ? 'suspicious' : 'safe';
}
</script>

<template>
    <div class="security-analysis p-4 bg-gray-50 rounded-lg">
        <!-- Authentication Badges -->
        <div class="flex space-x-2 mb-4">
            <AuthenticationBadge label="SPF" :status="getAuthStatus('SPF')" :tooltip="getAuthTooltip('SPF')" />
            <AuthenticationBadge label="DKIM" :status="getAuthStatus('DKIM')" :tooltip="getAuthTooltip('DKIM')" />
            <AuthenticationBadge label="DMARC" :status="getAuthStatus('DMARC')" :tooltip="getAuthTooltip('DMARC')" />
        </div>

        <!-- Risk Level and Authentication -->
        <div class="flex items-center space-x-4">
            <RiskBadge :isFlagged="analysis?.isFlagged || false" />
        </div>

        <!-- Suspicious Keywords -->
        <div v-if="suspiciousKeywords.length > 0" class="mt-4">
            <h4 class="font-medium text-gray-700 mb-2">Suspicious Content:</h4>
            <ul class="space-y-2">
                <li v-for="(keyword, index) in suspiciousKeywords" :key="index"
                    class="flex items-center text-sm text-gray-600">
                    <span
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {{ keyword.type }}
                    </span>
                    <span class="ml-2">
                        Found in {{ keyword.location }}: {{ keyword.matches.join(', ') }}
                    </span>
                </li>
            </ul>
        </div>

        <!-- URLs -->
        <div v-if="urls.length > 0" class="mt-4">
            <h4 class="font-medium text-gray-700 mb-2">URLs in Email:</h4>
            <ul class="space-y-2">
                <li v-for="url in urls" :key="url" class="flex items-center text-sm">
                    <UrlStatusIcon :status="getUrlStatus(url)" />
                    <span class="ml-2 text-gray-600">{{ url }}</span>
                </li>
            </ul>
        </div>

        <!-- Safe Browsing Results -->
        <div v-if="analysis?.safeBrowsingResult?.length > 0" class="mt-4">
            <h4 class="font-medium text-gray-700 mb-2">Safe Browsing Alerts:</h4>
            <ul class="space-y-2">
                <li v-for="(result, index) in analysis.safeBrowsingResult" :key="index"
                    class="flex items-center text-sm text-red-600">
                    <span
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {{ result.threatType }}
                    </span>
                    <span class="ml-2">{{ result.url }}</span>
                </li>
            </ul>
        </div>
    </div>
</template>

<style scoped>
.security-analysis {
    border: 1px solid #e5e7eb;
}
</style>