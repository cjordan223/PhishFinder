<template>
    <div @click="openEmail" class="cursor-pointer p-3 hover:bg-gray-50 border-b last:border-b-0 transition-colors"
        :class="{
            'bg-red-50 border border-red-200': securityStatus === 'high-risk',
            'bg-yellow-50 border border-yellow-200': securityStatus === 'warning',
            'bg-blue-50 border border-blue-200': securityStatus === 'caution'
        }">
        <div class="flex items-center justify-between gap-2">
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                    <SecurityBadge :status="securityStatus" :tooltip="securityTooltip" class="flex-shrink-0" />
                    <h3 class="font-medium text-gray-900 truncate">{{ email.metadata?.subject }}</h3>
                </div>
                <p class="text-sm text-gray-600 truncate" v-html="sanitizedSnippet"></p>
            </div>
            <span class="text-sm text-gray-500 whitespace-nowrap">{{ formattedDate }}</span>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import SecurityBadge from '../security/SecurityBadge.vue';
import DOMPurify from 'dompurify';

const props = defineProps({
    email: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['open']);

// Safely access security info with null checks
const securityInfo = computed(() => {
    const security = props.email?.security;
    if (!security) return null;

    // Ensure we have the full security object structure
    return {
        analysis: {
            ...security.analysis,
            isFlagged: security.analysis?.isFlagged || false,
            suspiciousKeywords: security.analysis?.suspiciousKeywords || [],
            linkRisks: security.analysis?.linkRisks || [],
            urlMismatches: security.analysis?.urlMismatches || [],
            safeBrowsingResult: security.analysis?.safeBrowsingResult || []
        },
        authentication: security.authentication || {},
        behavioral: security.behavioral || {}
    };
});

const securityStatus = computed(() => {
    if (!securityInfo.value) return 'unknown';

    const analysis = securityInfo.value.analysis;
    const auth = securityInfo.value.authentication;

    // High-risk conditions (real security threats)
    if (
        analysis?.safeBrowsingResult?.length > 0 || // Known malicious URLs
        analysis?.linkRisks?.some(risk => risk.domainMimicry) || // Domain mimicry detected
        analysis?.urlMismatches?.length > 0 // URL spoofing detected
    ) {
        return 'high-risk';
    }

    // Warning conditions
    if (
        analysis?.linkRisks?.some(risk => risk.isSuspicious && !risk.domainMimicry) // Suspicious but not mimicry
    ) {
        return 'warning';
    }

    // Caution conditions
    if (
        analysis?.suspiciousKeywords?.length > 0 || // Suspicious keywords
        (auth?.spf?.result === 'fail' || auth?.dmarc?.result === 'fail') || // Major auth failures only
        analysis?.linkRisks?.some(risk => !risk.isSuspicious) // Normal external links
    ) {
        return 'caution';
    }

    // Secure conditions
    const allAuthPassed = auth?.summary?.toLowerCase().includes('pass');
    if (allAuthPassed && !analysis?.linkRisks?.length) {
        return 'secure';
    }

    return 'unknown';
});

const hasSecurityRisks = computed(() => {
    const analysis = securityInfo.value?.analysis;
    const auth = securityInfo.value?.authentication;

    return (analysis?.linkRisks?.some(risk => risk.isSuspicious)) ||
        (analysis?.suspiciousKeywords?.length > 0) ||
        (analysis?.urlMismatches?.length > 0) ||
        (auth?.summary?.includes('Fail'));
});

const securityTooltip = computed(() => {
    if (!securityInfo.value) return 'Security scan pending';
    
    switch (securityStatus.value) {
        case 'high-risk':
            return 'High-risk: Malicious URLs or domain spoofing detected';
        case 'warning':
            return 'Warning: Suspicious URLs or mismatches detected';
        case 'caution':
            return 'Caution: Contains suspicious keywords or authentication issues';
        case 'secure':
            return 'No security risks detected';
        default:
            return 'Security scan pending';
    }
});

const isDomainSuspicious = computed(() => {
    return securityInfo.value?.analysis?.domainAnalysis?.isSuspicious || false;
});

const senderDisplay = computed(() => {
    return props.email.sender?.displayName || props.email.sender?.address || 'Unknown Sender';
});

const formattedDate = computed(() => {
    return new Date(props.email.metadata?.date).toLocaleDateString();
});

const openEmail = () => {
    emit('open', props.email);
};

const isFlagged = computed(() => securityInfo.value?.analysis?.isFlagged || false);
const hasUrlMismatches = computed(() => securityInfo.value?.analysis?.urlMismatches?.length > 0);

const sanitizedSnippet = computed(() => {
    return DOMPurify.sanitize(props.email?.metadata?.snippet || '');
});
</script>

<style scoped>
.is-flagged {
    @apply border-l-4 border-red-500 bg-red-50;
}
</style>