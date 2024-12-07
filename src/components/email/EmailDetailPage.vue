<template>
    <div class="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm">
        <div class="absolute inset-0 flex flex-col transform transition-all duration-300 ease-in-out" :class="{
            'translate-x-0 opacity-100': show,
            'translate-x-full opacity-0': !show
        }">
            <div class="h-full flex flex-col bg-white shadow-2xl">
                <!-- Header with back button -->
                <div class="flex-none bg-white border-b shadow-sm">
                    <div class="flex items-center justify-between p-4">
                        <div class="flex items-center flex-1 min-w-0">
                            <button @click="$emit('close')"
                                class="p-2 hover:bg-gray-100 rounded-full mr-4 flex-shrink-0">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <h1 class="text-xl font-semibold truncate pr-4">
                                {{ email.metadata?.subject || 'No Subject' }}
                            </h1>
                        </div>
                        <SecurityBadge :status="securityStatus" :tooltip="securityTooltip" class="flex-shrink-0" />
                    </div>

                    <!-- Security Analysis Section -->
                    <div class="flex-none border-t">
                        <div class="p-4">
                            <div class="flex items-center justify-between mb-4">
                                <h2 class="text-lg font-medium text-gray-900">Security Analysis</h2>
                                <button @click.prevent="showSecurityDetails = !showSecurityDetails"
                                    class="text-blue-600 hover:text-blue-800 text-sm">
                                    {{ showSecurityDetails ? 'Hide Details' : 'Show Details' }}
                                </button>
                            </div>

                            <div v-if="showSecurityDetails" class="max-h-[40vh] overflow-y-auto pr-2">
                                <div class="space-y-4">
                                    <!-- Suspicious Keywords Section -->
                                    <div v-if="email.security?.analysis?.suspiciousKeywords?.length"
                                        class="bg-gray-50 p-4 rounded-lg">
                                        <div class="flex items-start gap-2">
                                            <h3 class="text-sm font-medium text-amber-600 group relative cursor-help">
                                                Suspicious Keywords
                                                <div
                                                    class="absolute left-0 top-full mt-1 w-80 p-3 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                                    <p class="font-medium mb-2">About Suspicious Keywords</p>
                                                    <p class="mb-2">Keywords are analyzed for potentially suspicious
                                                        patterns:</p>
                                                    <ul class="space-y-1 list-disc pl-4">
                                                        <li>Common in phishing but also legitimate emails</li>
                                                        <li>Not inherently malicious</li>
                                                        <li>Consider the overall context</li>
                                                        <li>Verify sender if something feels off</li>
                                                    </ul>
                                                </div>
                                            </h3>
                                        </div>
                                        <div v-for="(category, index) in email.security.analysis.suspiciousKeywords"
                                            :key="index" class="mb-2">
                                            <div class="text-xs text-gray-600 mb-1">Found in {{ category.location }}:
                                            </div>
                                            <KeywordAlert :keywords="category.matches" />
                                        </div>
                                    </div>

                                    <!-- Authentication Section -->
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <h3 class="text-sm font-medium text-gray-700 mb-2">Email Authentication</h3>
                                        <AuthStatus :spf="email.security?.authentication?.spf"
                                            :dkim="email.security?.authentication?.dkim"
                                            :dmarc="email.security?.authentication?.dmarc"
                                            :spfDetails="email.security?.authentication?.spfDetails"
                                            :dkimDetails="email.security?.authentication?.dkimDetails"
                                            :dmarcDetails="email.security?.authentication?.dmarcDetails" />
                                    </div>

                                    <!-- Sender Profile Section -->
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <div class="flex items-center justify-between">
                                            <h3 class="text-sm font-medium text-gray-700">Sender Profile</h3>
                                            <button @click="showSenderProfile = !showSenderProfile"
                                                class="text-blue-600 hover:text-blue-800 text-sm">
                                                {{ showSenderProfile ? 'Hide Details' : 'Show Details' }}
                                            </button>
                                        </div>

                                        <div v-if="showSenderProfile" class="mt-4">
                                            <div class="grid grid-cols-2 gap-y-2 text-sm">
                                                <div class="text-gray-500">First seen:</div>
                                                <div class="text-right">{{
                                                    formatFirstSeen(senderProfile?.sender?.firstSeen) }}</div>

                                                <div class="text-gray-500">Total emails:</div>
                                                <div class="text-right">{{ senderProfile?.securityMetrics?.totalEmails
                                                    || 0 }}</div>

                                                <div class="text-gray-500">Suspicious emails:</div>
                                                <div class="text-right">{{
                                                    senderProfile?.securityMetrics?.suspiciousEmails || 0 }}</div>

                                                <div class="text-gray-500">Authentication:</div>
                                                <div class="text-right text-xs">
                                                    {{
                                                        senderProfile?.lastAuthenticationStatus?.summary?.replace(/\n\s+/g,
                                                    ', ') || 'No data' }}
                                                </div>

                                                <div class="text-gray-500">Common words:</div>
                                                <div class="text-right flex flex-wrap justify-end gap-1">
                                                    <span v-for="word in topWords" :key="word"
                                                        class="text-xs bg-gray-100 px-2 py-0.5 rounded">
                                                        {{ word }}
                                                    </span>
                                                    <span v-if="!topWords.length" class="text-xs text-gray-400">
                                                        No data available
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- URL Risks Section -->
                                    <div v-if="email.security?.analysis?.linkRisks?.length"
                                        class="bg-gray-50 p-4 rounded-lg">
                                        <UrlStatus :risks="email.security.analysis.linkRisks" />
                                    </div>

                                    <!-- URL Mismatches Section -->
                                    <div v-if="email.security?.analysis?.urlMismatches?.length"
                                        class="bg-gray-50 p-4 rounded-lg">
                                        <h3 class="text-sm font-medium text-red-600 mb-2">URL Mismatches Detected</h3>
                                        <ul class="space-y-2">
                                            <li v-for="(mismatch, index) in email.security.analysis.urlMismatches"
                                                :key="index" class="text-xs bg-red-50 p-3 rounded">
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
                                    <div v-if="email.content?.htmlBody"
                                        v-html="sanitizeAndStyleContent(email.content.htmlBody)" class="rendered-html">
                                    </div>
                                    <div v-else-if="email.content?.body" class="whitespace-pre-wrap">
                                        {{ email.content.body }}
                                    </div>
                                    <div v-else class="text-gray-500 italic">No content available</div>
                                </div>
                            </div>
                        </div>
                        <div class="p-4">
                            <button @click="logSecurityAnalysis" class="bg-blue-500 text-white px-4 py-2 rounded-md">
                                Log Security Analysis
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import DOMPurify from 'dompurify';
import SecurityBadge from '../security/SecurityBadge.vue';
import AuthStatus from '../security/AuthStatus.vue';
import UrlStatus from '../security/UrlStatus.vue';
import KeywordAlert from '../security/KeywordAlert.vue';
import { useSecurityStatus } from '@/utils/useSecurityStatus';

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
const senderProfile = ref(null);
const showSenderProfile = ref(false);

// Use the imported security status utility
const securityStatus = useSecurityStatus(props.email?.security, senderProfile);

const securityTooltip = computed(() => {
    const tooltipParts = [];

    if (props.email?.security?.analysis?.isFlagged) {
        tooltipParts.push('High-risk email detected');
    }

    // Add sender profile context with null checks
    if (senderProfile.value?.sender?.firstSeen) {
        const daysSinceFirstSeen = Math.floor(
            (Date.now() - new Date(senderProfile.value.sender.firstSeen.$date)) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceFirstSeen < 7) {
            tooltipParts.push('New sender (first seen within 7 days)');
        }

        if (senderProfile.value?.securityMetrics?.suspiciousEmails > 0) {
            tooltipParts.push(`Sender has ${senderProfile.value.securityMetrics.suspiciousEmails} suspicious emails`);
        }
    }

    return tooltipParts.length > 0 ? tooltipParts.join(' • ') : 'No security risks detected';
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

const fetchSenderProfile = async (emailAddress) => {
    try {
        console.log('🔍 Fetching sender profile for:', emailAddress);
        const url = `http://localhost:8080/analysis/sender/${encodeURIComponent(emailAddress)}`;
        console.log('🌐 Request URL:', url);

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch sender profile');

        const data = await response.json();
        console.log('📧 Sender Profile Response:', data);

        senderProfile.value = data.profile;
    } catch (error) {
        console.error('❌ Error fetching sender profile:', error);
    }
};

// Watch for changes to the email prop and fetch sender profile
watch(() => props.email?.sender?.address, (newAddress) => {
    if (newAddress) {
        fetchSenderProfile(newAddress);
    }
});

// Initial fetch when component mounts
onMounted(() => {
    if (props.email?.sender?.address) {
        fetchSenderProfile(props.email.sender.address);
    }
});

const formatFirstSeen = (firstSeen) => {
    if (!firstSeen) return 'No Date';
    const dateValue = firstSeen.$date ? firstSeen.$date : firstSeen;
    return new Date(dateValue).toLocaleDateString();
};

const topWords = computed(() => {
    if (!senderProfile.value?.languageProfile?.wordFrequency) return [];

    return Object.entries(senderProfile.value.languageProfile.wordFrequency)
        .filter(([word]) => word.length > 2) // Filter out short words
        .sort((a, b) => b[1] - a[1]) // Sort by frequency
        .slice(0, 5) // Take top 5
        .map(([word]) => word);
});
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