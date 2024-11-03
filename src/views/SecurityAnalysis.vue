<script setup>
import { computed } from 'vue';
import AuthenticationBadge from './components/AuthenticationBadge.vue';
import RiskBadge from './components/RiskBadge.vue';
import UrlStatusIcon from './components/UrlStatusIcon.vue';

const props = defineProps({
    authentication: {
        type: Object,
        default: () => ({
            spf: null,
            dkim: null,
            dmarc: null,
            summary: null
        })
    },
    analysis: {
        type: Object,
        default: () => ({
            isFlagged: false,
            suspiciousKeywords: [],
            linkRisks: [],
            safeBrowsingResult: []
        })
    },
    urls: {
        type: Array,
        default: () => []
    }
});

const suspiciousKeywords = computed(() => {
    return props.analysis?.suspiciousKeywords?.map(keyword => ({
        type: keyword.type,
        matches: keyword.matches,
        location: keyword.location
    })) || [];
});

const authenticationStatus = computed(() => {
    return {
        spf: props.authentication?.summary?.includes('SPF: Pass') ? 'pass' : 'fail',
        dkim: props.authentication?.summary?.includes('DKIM: Pass') ? 'pass' : 'fail',
        dmarc: props.authentication?.summary?.includes('DMARC: Pass') ? 'pass' : 'fail'
    };
});

function getAuthTooltip(type) {
    const tooltips = {
        spf: `Sender Policy Framework: ${props.authentication?.spf || 'Not available'}`,
        dkim: `DKIM: ${props.authentication?.dkim || 'Not available'}`,
        dmarc: `DMARC: ${props.authentication?.dmarc || 'Not available'}`
    };
    return tooltips[type];
}

function getUrlStatus(url) {
    if (props.analysis?.safeBrowsingResult?.some(result => result.url === url)) {
        return 'malicious';
    }
    return props.analysis?.linkRisks?.some(risk => risk.url === url) ? 'suspicious' : 'safe';
}
</script>

<template>
    <div class="space-y-4 bg-gray-50 p-4 rounded-lg">
        <h3 class="text-lg font-medium text-gray-900">Security Analysis</h3>

        <!-- Risk Level and Authentication -->
        <div class="flex items-center space-x-4">
            <RiskBadge :isFlagged="analysis?.isFlagged || false" />
            <div class="flex space-x-2">
                <AuthenticationBadge v-for="(status, type) in authenticationStatus" :key="type" :type="type"
                    :status="status" :tooltip="getAuthTooltip(type)" />
            </div>
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