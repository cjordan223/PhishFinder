<template>
    <div class="fixed inset-0 bg-gray-100 overflow-hidden">
        <div class="h-full flex flex-col">
            <div class="flex-grow overflow-hidden">
                <div class="h-full flex flex-col">
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
                    </div>

                    <div class="flex-none border-t">
                        <div class="p-4">
                            <div class="flex items-center justify-between mb-4">
                                <h2 class="text-lg font-medium text-gray-900 flex items-center gap-2">
                                    <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor"
                                        viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    Security Analysis
                                </h2>
                                <div class="flex items-center gap-2">
                                    <button @click.prevent="showSecurityDetails = !showSecurityDetails"
                                        class="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm transition-colors duration-200">
                                        <span>{{ showSecurityDetails ? 'Hide Details' : 'Show Details' }}</span>
                                        <svg class="w-4 h-4 transform transition-transform duration-200"
                                            :class="{ 'rotate-180': showSecurityDetails }" fill="none"
                                            stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <transition enter-active-class="transition-all duration-300 ease-out"
                                leave-active-class="transition-all duration-200 ease-in"
                                enter-from-class="opacity-0 -translate-y-4" enter-to-class="opacity-100 translate-y-0"
                                leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-4">
                                <div v-if="showSecurityDetails" class="max-h-[300px] overflow-y-auto pr-2 space-y-4">
                                    <!-- Suspicious Keywords Section -->
                                    <div v-if="email.security?.analysis?.suspiciousKeywords?.length"
                                        class="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200">
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
                                    <div
                                        class="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200">
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

                                    <!-- Domain Information -->
                                    <div v-if="email.sender?.domain"
                                        class="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200">
                                        <div class="flex items-center justify-between mb-2">
                                            <h3 class="text-sm font-medium text-gray-700">Domain Information</h3>
                                            <button @click="performWhoisLookup"
                                                class="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-md transition-colors duration-200"
                                                :disabled="isWhoisLoading">
                                                <span v-if="isWhoisLoading">Loading...</span>
                                                <span v-else>WHOIS Lookup</span>
                                            </button>
                                        </div>

                                        <div v-if="whoisData" class="mt-3 text-xs">
                                            <div class="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p class="text-gray-500">Registrar:</p>
                                                    <p class="font-medium">{{ whoisData.registrar?.name || 'N/A' }}</p>
                                                </div>
                                                <div>
                                                    <p class="text-gray-500">Organization:</p>
                                                    <p class="font-medium">{{ whoisData.registrant?.organization ||
                                                        'N/A' }}</p>
                                                </div>
                                                <div>
                                                    <p class="text-gray-500">Creation Date:</p>
                                                    <p class="font-medium">{{ formatDate(whoisData.domain?.created_date)
                                                        }}</p>
                                                </div>
                                                <div>
                                                    <p class="text-gray-500">Expiration Date:</p>
                                                    <p class="font-medium">{{
                                                        formatDate(whoisData.domain?.expiration_date) }}</p>
                                                </div>
                                                <div>
                                                    <p class="text-gray-500">Last Updated:</p>
                                                    <p class="font-medium">{{ formatDate(whoisData.domain?.updated_date)
                                                        }}</p>
                                                </div>
                                                <div>
                                                    <p class="text-gray-500">Country:</p>
                                                    <p class="font-medium">{{ whoisData.registrant?.country || 'N/A' }}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- AI Analysis Results -->
                                    <div
                                        class="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200">
                                        <div class="flex items-center justify-between mb-2">
                                            <h3 class="text-sm font-medium text-gray-700">AI Content Analysis</h3>
                                            <button @click="performAIAnalysis"
                                                class="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-md text-sm transition-colors duration-200"
                                                :disabled="isAIAnalyzing">
                                                <span v-if="isAIAnalyzing">Analyzing...</span>
                                                <span v-else>AI Analysis</span>
                                            </button>
                                        </div>

                                        <!-- Error State -->
                                        <div v-if="aiError" class="text-red-600 text-sm mb-2">
                                            {{ aiError }}
                                        </div>

                                        <!-- Success State -->
                                        <div v-if="aiAnalysisResult">
                                            <div class="flex items-center gap-4">
                                                <div class="flex-1">
                                                    <div class="h-2 bg-gray-200 rounded-full">
                                                        <div class="h-2 bg-purple-600 rounded-full"
                                                            :style="{ width: `${aiAnalysisResult.score}%` }">
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="text-sm font-medium">
                                                    {{ aiAnalysisResult.score }}% AI Generated
                                                </div>
                                            </div>
                                            <p class="text-xs text-gray-500 mt-2">
                                                This score indicates the likelihood that the content was generated by
                                                AI.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </transition>
                        </div>
                    </div>

                    <div class="flex-grow overflow-y-auto p-4">
                        <div class="email-body-content prose max-w-none bg-white rounded-lg border p-6">
                            <div v-if="email.content?.htmlBody" v-html="sanitizeAndStyleContent(email.content.htmlBody)"
                                class="rendered-html">
                            </div>
                            <div v-else-if="email.content?.body" class="whitespace-pre-wrap">
                                {{ email.content.body }}
                            </div>
                            <div v-else class="text-gray-500 italic">
                                No content available
                            </div>
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
    const analysis = props.email?.security?.analysis;
    const auth = props.email?.security?.authentication;

    // High-risk indicators
    if (analysis?.safeBrowsingResult?.length > 0) {
        tooltipParts.push('Malicious URLs detected');
    }
    if (analysis?.urlMismatches?.length > 0) {
        tooltipParts.push('URL mismatches found');
    }
    if (analysis?.isFlagged) {
        tooltipParts.push('Manually flagged as suspicious');
    }
    if (analysis?.linkRisks?.some(risk => risk.domainMimicry && risk.isSuspicious)) {
        tooltipParts.push('Domain spoofing detected');
    }

    // Warning indicators
    if (analysis?.linkRisks?.some(risk => risk.isSuspicious && !risk.domainMimicry)) {
        tooltipParts.push('Suspicious links detected');
    }
    if (analysis?.suspiciousKeywords?.length > 2) {
        tooltipParts.push('Multiple suspicious keywords found');
    }

    // Authentication issues
    if (auth) {
        const missingAuth = [];
        if (!auth.spf) missingAuth.push('SPF');
        if (!auth.dkim) missingAuth.push('DKIM');
        if (!auth.dmarc) missingAuth.push('DMARC');
        if (missingAuth.length > 0) {
            tooltipParts.push(`Missing authentication: ${missingAuth.join(', ')}`);
        }
    }

    return tooltipParts.length > 0 ? tooltipParts.join('. ') : 'No security issues detected';
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

const whoisData = ref(null);
const isWhoisLoading = ref(false);

async function performWhoisLookup() {
    if (!props.email?.sender?.domain) {
        console.error('No domain available for WHOIS lookup');
        return;
    }

    isWhoisLoading.value = true;
    const domain = props.email.sender.domain;

    try {
        // First check storage
        const stored = await chrome.storage.local.get(`whois_${domain}`);
        if (stored[`whois_${domain}`]) {
            whoisData.value = stored[`whois_${domain}`].data;
            console.log('Retrieved WHOIS data from storage:', whoisData.value);
            return;
        }

        // If not in storage, request from background
        chrome.runtime.sendMessage({
            action: 'performWhoisLookup',
            domain: domain
        });

        // Poll storage for result
        const result = await new Promise((resolve, reject) => {
            let attempts = 0;
            const checkStorage = async () => {
                const stored = await chrome.storage.local.get(`whois_${domain}`);
                if (stored[`whois_${domain}`]) {
                    resolve(stored[`whois_${domain}`].data);
                } else if (attempts++ < 10) {
                    setTimeout(checkStorage, 500);
                } else {
                    reject(new Error('WHOIS lookup timed out'));
                }
            };
            checkStorage();
        });

        whoisData.value = result;
        console.log('WHOIS data set:', whoisData.value);
    } catch (error) {
        console.error('Error performing WHOIS lookup:', error);
    } finally {
        isWhoisLoading.value = false;
    }
}

const isAIAnalyzing = ref(false);
const aiAnalysisResult = ref(null);
const aiError = ref(null);

async function performAIAnalysis() {
    if (!props.email?.content?.body && !props.email?.content?.htmlBody) {
        aiError.value = 'No content available for analysis';
        return;
    }

    isAIAnalyzing.value = true;
    aiError.value = null;

    try {
        // Get text content, preferring plain text over HTML
        let text = props.email.content.body ||
            props.email.content.htmlBody.replace(/<[^>]*>/g, '');

        // Trim and clean the text
        text = text.trim();

        // Check word count requirements (matching backend)
        const wordCount = text.split(/\s+/).length;
        if (wordCount < 10) {
            aiError.value = 'Text must be at least 10 words long';
            return;
        }

        const response = await fetch('http://localhost:8080/analysis/ai-analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'AI analysis failed');
        }

        const result = await response.json();
        aiAnalysisResult.value = result;
        console.log('AI Analysis Result:', result);
    } catch (error) {
        console.error('Error performing AI analysis:', error);
        aiError.value = error.message;
    } finally {
        isAIAnalyzing.value = false;
    }
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

/* Add smooth scrollbar styling */
.overflow-y-auto {
    scrollbar-width: thin;
    scrollbar-color: #CBD5E1 transparent;
}

.overflow-y-auto::-webkit-scrollbar {
    width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
    background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
    background-color: #CBD5E1;
    border-radius: 3px;
}

/* Add hover effect for security cards */
.security-card {
    @apply transition-all duration-200 ease-in-out;
}

.security-card:hover {
    @apply transform -translate-y-0.5;
}
</style>