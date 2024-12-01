<template>
    <div class="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm">
        <div class="absolute inset-0 flex flex-col transform transition-all duration-300 ease-in-out"
            :class="{ 
                'translate-x-0 opacity-100': show, 
                'translate-x-full opacity-0': !show 
            }">
            <div class="h-full flex flex-col bg-white shadow-2xl">
                <!-- Header with back button -->
                <div class="flex-none bg-white border-b shadow-sm">
                    <div class="flex items-center justify-between p-4">
                        <div class="flex items-center flex-1 min-w-0">
                            <button @click="$emit('close')" class="p-2 hover:bg-gray-100 rounded-full mr-4 flex-shrink-0">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <h1 class="text-xl font-semibold truncate pr-4">{{ email.metadata?.subject || 'No Subject' }}</h1>
                        </div>
                        <SecurityBadge :status="securityStatus" :tooltip="securityTooltip" class="flex-shrink-0" />
                    </div>

                    <!-- Security Analysis Section -->
                    <div class="flex-none border-t">
                        <div class="p-4">
                            <div class="flex items-center justify-between mb-4">
                                <h2 class="text-lg font-medium text-gray-900">Security Analysis</h2>
                                <button @click="showSecurityDetails = !showSecurityDetails"
                                    class="text-blue-600 hover:text-blue-800 text-sm">
                                    {{ showSecurityDetails ? 'Hide Details' : 'Show Details' }}
                                </button>
                            </div>

                            <div v-if="showSecurityDetails" class="max-h-[50vh] overflow-y-auto pr-2">
                                <div class="space-y-4">
                                    <!-- Suspicious Keywords Section -->
                                    <div v-if="email.security?.analysis?.suspiciousKeywords?.length" 
                                        class="bg-gray-50 p-4 rounded-lg">
                                        <h3 class="text-sm font-medium text-amber-600 mb-2">Suspicious Keywords</h3>
                                        <div v-for="(category, index) in email.security.analysis.suspiciousKeywords" 
                                            :key="index" 
                                            class="mb-2">
                                            <div class="text-xs text-gray-600 mb-1">Found in {{ category.location }}:</div>
                                            <KeywordAlert :keywords="category.matches" />
                                        </div>
                                    </div>

                                    <!-- Authentication Section -->
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <h3 class="text-sm font-medium text-gray-700 mb-2">Email Authentication</h3>
                                        <AuthStatus :spf="email.security?.authentication?.spf"
                                            :dkim="email.security?.authentication?.dkim"
                                            :dmarc="email.security?.authentication?.dmarc" />
                                    </div>

                                    <!-- URL Risks Section -->
                                    <div v-if="email.security?.analysis?.linkRisks?.length" class="bg-gray-50 p-4 rounded-lg">
                                        <UrlStatus :risks="email.security.analysis.linkRisks" />
                                    </div>

                                    <!-- URL Mismatches Section -->
                                    <div v-if="email.security?.analysis?.urlMismatches?.length"
                                        class="bg-gray-50 p-4 rounded-lg">
                                        <h3 class="text-sm font-medium text-red-600 mb-2">URL Mismatches Detected</h3>
                                        <ul class="space-y-2">
                                            <li v-for="(mismatch, index) in email.security.analysis.urlMismatches" :key="index"
                                                class="text-xs bg-red-50 p-3 rounded">
                                                <div class="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <div class="text-gray-500">Displayed as:</div>
                                                        <div class="font-medium">{{ mismatch.displayedUrl }}</div>
                                                    </div>
                                                    <div>
                                                        <div class="text-gray-500">Actually links to:</div>
                                                        <div class="font-medium">{{ mismatch.actualUrl }}</div>
                                                    </div>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>

                                    <!-- Safe Browsing Results -->
                                    <div v-if="email.security?.analysis?.safeBrowsingResult?.length"
                                        class="bg-gray-50 p-4 rounded-lg">
                                        <h3 class="text-sm font-medium text-gray-700 mb-2">Safe Browsing Alerts</h3>
                                        <ul class="space-y-2">
                                            <li v-for="(result, index) in email.security.analysis.safeBrowsingResult"
                                                :key="index" class="text-xs bg-yellow-50 p-3 rounded">
                                                <div class="flex justify-between items-start">
                                                    <div>
                                                        <div class="font-medium text-yellow-800">
                                                            {{ formatThreatType(result.threatType) }}
                                                        </div>
                                                        <div class="text-gray-600 mt-1">{{ result.threat.url }}</div>
                                                    </div>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Email content -->
                <div class="flex-1 overflow-y-auto">
                    <div class="p-4 min-h-full">
                        <!-- Sender info -->
                        <div class="mb-4">
                            <div class="flex items-center gap-2">
                                <span class="font-medium truncate">{{ email.sender?.displayName ||
                                    email.sender?.address?.split('@')[0] }}</span>
                                <span class="text-gray-500 truncate">&lt;{{ email.sender?.address }}&gt;</span>
                            </div>
                            <div class="text-gray-500 text-sm">
                                {{ formatDate(email.metadata?.date) || 'No date' }}
                            </div>
                        </div>

                        <!-- Email body -->
                        <div class="email-body-content prose max-w-none bg-white rounded-lg border p-6">
                            <div v-if="email.content?.htmlBody" v-html="sanitizeAndStyleContent(email.content.htmlBody)"
                                class="rendered-html"></div>
                            <div v-else-if="email.content?.body" class="whitespace-pre-wrap">{{ email.content.body }}</div>
                            <div v-else class="text-gray-500 italic">No content available</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import SecurityBadge from '../security/SecurityBadge.vue';
import AuthStatus from '../security/AuthStatus.vue';
import UrlStatus from '../security/UrlStatus.vue';
import DOMPurify from 'dompurify';
import KeywordAlert from '../security/KeywordAlert.vue';

const props = defineProps({
    email: {
        type: Object,
        required: true
    },
    show: {
        type: Boolean,
        default: false
    }
});

const showSecurityDetails = ref(false);

// Define hasSecurityRisks first since securityStatus depends on it
const hasSecurityRisks = computed(() => {
    const analysis = props.email?.security?.analysis;
    return analysis?.linkRisks?.length > 0 ||
        analysis?.suspiciousKeywords?.length > 0 ||
        analysis?.urlMismatches?.length > 0;
});

// Now define securityStatus which uses hasSecurityRisks
const securityStatus = computed(() => {
    if (!props.email?.security) return 'unknown';

    const analysis = props.email.security.analysis;
    const auth = props.email.security.authentication;

    // High-risk conditions
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
        auth?.summary?.includes('Fail') || // Authentication failures
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

const securityTooltip = computed(() => {
    if (!props.email?.security) return 'Security scan pending';
    if (props.email?.security?.analysis?.isFlagged) return 'High-risk email detected';
    if (hasSecurityRisks.value) return 'Potential security risks detected';
    return 'No security risks detected';
});

const formatDate = (date) => {
    if (!date) return 'No Date';
    return new Date(date).toLocaleString();
};

const formatThreatType = (threatType) => {
    return threatType.split('_').map(word =>
        word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
};

function sanitizeAndStyleContent(content) {
    if (typeof content === 'object') {
        return DOMPurify.sanitize(JSON.stringify(content, null, 2));
    }

    // Add default styles to ensure proper rendering
    const styledContent = `
        <div style="font-family: system-ui, -apple-system, sans-serif; color: #374151; line-height: 1.5;">
            ${content}
        </div>
    `;

    return DOMPurify.sanitize(styledContent, {
        ALLOWED_TAGS: ['a', 'b', 'br', 'div', 'p', 'span', 'strong', 'em', 'i', 'u', 'ul', 'ol', 'li', 'img'],
        ALLOWED_ATTR: ['href', 'style', 'src', 'alt', 'class'],
        ALLOW_DATA_ATTR: false
    });
}
</script>

<style scoped>
.rendered-html {
    font-family: system-ui, -apple-system, sans-serif;
    color: #374151;
    line-height: 1.5;
}

.rendered-html img {
    max-width: 100%;
    height: auto;
}

.rendered-html a {
    color: #2563eb;
    text-decoration: underline;
}
</style>