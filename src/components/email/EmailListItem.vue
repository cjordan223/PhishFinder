<template>
    <li @click="openEmail" class="p-4 bg-white shadow rounded-lg cursor-pointer hover:shadow-lg transition"
        :class="{ 'is-flagged': isFlagged }">
        <div class="flex justify-between items-start">
            <div class="flex-grow">
                <div class="flex items-center gap-2">
                    <SecurityBadge :status="securityStatus" :tooltip="securityTooltip" />
                    <h3 class="font-medium">{{ email.metadata?.subject }}</h3>
                </div>

                <div class="flex items-center gap-2 mt-1">
                    <span class="text-sm text-gray-600">{{ senderDisplay }}</span>
                    <span v-if="hasUrlMismatches" class="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">
                        URL Mismatch Detected
                    </span>
                </div>

                <p class="text-sm text-gray-500 mt-1">{{ email.metadata?.snippet }}</p>
            </div>
            <span class="text-sm text-gray-500">{{ formattedDate }}</span>
        </div>
    </li>
</template>

<script setup>
import { computed } from 'vue';
import SecurityBadge from '../security/SecurityBadge.vue';

const props = defineProps({
    email: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['open']);

const securityInfo = computed(() => props.email.security || null);

// Log security info
console.log('Security Info:', securityInfo.value);

const securityStatus = computed(() => {
    if (!securityInfo.value) return 'unknown';
    if (securityInfo.value.analysis?.isFlagged) return 'high-risk';
    if (hasSecurityRisks.value) return 'warning';
    return 'safe';
});

// Log security status
console.log('Security Status:', securityStatus.value);

const hasSecurityRisks = computed(() => {
    const analysis = securityInfo.value?.analysis;
    return analysis?.linkRisks?.length > 0 ||
        analysis?.suspiciousKeywords?.length > 0 ||
        analysis?.urlMismatches?.length > 0;
});

const securityTooltip = computed(() => {
    if (!securityInfo.value) return 'Security scan pending';
    if (securityInfo.value.analysis?.isFlagged) return 'High-risk email detected';
    if (hasSecurityRisks.value) return 'Potential security risks detected';
    return 'No security risks detected';
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
</script>

<style scoped>
.is-flagged {
    @apply border-l-4 border-red-500 bg-red-50;
}
</style>