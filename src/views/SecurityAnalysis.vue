<template>
    <div class="security-analysis bg-gray-50 rounded-lg p-4">
        <!-- Authentication Status -->
        <div class="authentication-status mb-4">
            <h4 class="font-medium mb-2">Authentication Status</h4>
            <div class="grid grid-cols-3 gap-2">
                <AuthenticationBadge label="SPF" :status="getAuthStatus(authentication?.spf)"
                    :tooltip="authentication?.spf || 'No SPF record'" />
                <AuthenticationBadge label="DKIM" :status="getAuthStatus(authentication?.dkim)"
                    :tooltip="authentication?.dkim || 'No DKIM record'" />
                <AuthenticationBadge label="DMARC" :status="getAuthStatus(authentication?.dmarc)"
                    :tooltip="authentication?.dmarc || 'No DMARC record'" />
            </div>
        </div>

        <!-- Analysis Results -->
        <div class="analysis-results">
            <h4 class="font-medium mb-2">Security Analysis</h4>
            <RiskBadge :isFlagged="getAnalysisFlag" />

            <!-- URL Analysis -->
            <div v-if="urls?.length > 0" class="mt-4">
                <h5 class="font-medium mb-2">URLs Found</h5>
                <ul class="space-y-2">
                    <li v-for="url in urls" :key="url" class="flex items-center">
                        <UrlStatusIcon :status="getUrlStatus(url)" />
                        <span class="ml-2 text-sm">{{ url }}</span>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import AuthenticationBadge from './components/AuthenticationBadge.vue';
import RiskBadge from './components/RiskBadge.vue';
import UrlStatusIcon from './components/UrlStatusIcon.vue';

const props = defineProps({
    authentication: {
        type: Object,
        default: () => ({
            spf: '',
            dkim: '',
            dmarc: '',
            summary: ''
        })
    },
    analysis: {
        type: Object,
        default: () => ({
            isFlagged: false,
            linkRisks: [],
            safeBrowsingResults: {
                checkedUrls: 0,
                threatenedUrls: 0,
                results: []
            }
        })
    },
    urls: {
        type: Array,
        default: () => []
    }
});

const getAnalysisFlag = computed(() => {
    return props.analysis?.isFlagged || false;
});

function getAuthStatus(value) {
    if (!value) return null;
    return value.toLowerCase().includes('pass') ? 'pass' : 'fail';
}

function getUrlStatus(url) {
    const risk = props.analysis?.linkRisks?.find(risk => risk.url === url);
    return risk?.isSuspicious ? 'suspicious' : 'safe';
}
</script>