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
import { useSecurityStatus } from '@/utils/useSecurityStatus';

const props = defineProps({
    email: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['open']);

const securityStatus = useSecurityStatus(props.email?.security);

const securityTooltip = computed(() => {
    if (!props.email?.security) return 'Security scan pending';

    const analysis = props.email?.security?.analysis;
    const auth = props.email?.security?.authentication;

    // High-risk conditions
    if (
        analysis?.safeBrowsingResult?.length > 0 ||
        analysis?.urlMismatches?.length > 0 ||
        analysis?.isFlagged ||
        analysis?.linkRisks?.some(risk => risk.domainMimicry && risk.isSuspicious)
    ) {
        return 'High-risk: Malicious content or phishing attempt detected';
    }

    // Warning conditions
    if (
        analysis?.linkRisks?.some(risk => risk.isSuspicious && !risk.domainMimicry) ||
        analysis?.suspiciousKeywords?.length > 2
    ) {
        return 'Warning: Multiple suspicious elements detected';
    }

    // Caution conditions
    if (
        analysis?.suspiciousKeywords?.length > 0 ||
        (auth && (!auth.spf || !auth.dkim || !auth.dmarc))
    ) {
        return 'Caution: Contains suspicious keywords or authentication issues';
    }

    return 'No security risks detected';
});

const formattedDate = computed(() => {
    return new Date(props.email.metadata?.date).toLocaleDateString();
});

const openEmail = () => {
    emit('open', props.email);
};

const sanitizedSnippet = computed(() => {
    return DOMPurify.sanitize(props.email?.metadata?.snippet || '');
});
</script>

<style scoped>
.is-flagged {
    @apply border-l-4 border-red-500 bg-red-50;
}
</style>