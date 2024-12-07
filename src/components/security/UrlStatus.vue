<template>
    <div>

        <!-- Suspicious URLs Section -->
        <div v-if="suspiciousUrls.length" class="url-risks mb-4">
            <div class="flex items-center justify-between text-sm font-medium text-red-600 mb-1 cursor-pointer"
                @click="isRisksOpen = !isRisksOpen">
                <span>Suspicious URLs Detected ({{ suspiciousUrls.length }})</span>
                <svg class="w-4 h-4 transform transition-transform" :class="{ 'rotate-180': isRisksOpen }" fill="none"
                    stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
            </div>
            <transition enter-active-class="transition duration-100 ease-out"
                leave-active-class="transition duration-75 ease-in">
                <ul v-if="isRisksOpen" class="space-y-2">
                    <li v-for="risk in suspiciousUrls" :key="risk.url" class="text-xs bg-red-50 p-3 rounded">
                        <div class="flex justify-between items-start">
                            <span class="font-medium break-all">{{ risk.url }}</span>
                            <span class="ml-2 text-red-700 whitespace-nowrap">{{ risk.threatType }}</span>
                        </div>
                        <p v-if="risk.description" class="mt-1 text-gray-600">{{ risk.description }}</p>
                    </li>
                </ul>
            </transition>
        </div>

        <!-- External URLs Section -->
        <div v-if="externalUrls.length" class="external-urls">
            <div class="flex items-center justify-between text-sm mb-1 cursor-pointer"
                @click="isExternalOpen = !isExternalOpen">
                <div class="flex items-start gap-3">
                    <h3 class="text-sm font-medium text-gray-700 group relative cursor-help">
                        External URLs ({{ externalUrls.length }})
                        <div
                            class="absolute left-0 top-full mt-1 w-80 p-3 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                            <p class="font-medium mb-2">About External Links</p>
                            <p class="mb-2">External links are normal in emails, but they can pose risks:</p>
                            <ul class="space-y-1 list-disc pl-4">
                                <li>Verify the sender's identity before clicking</li>
                                <li>Hover over links to preview their destination</li>
                                <li>Be cautious of unexpected or urgent requests</li>
                                <li>Check for subtle misspellings in domain names</li>
                            </ul>
                        </div>
                    </h3>
                </div>
                <svg class="w-4 h-4 transform transition-transform" :class="{ 'rotate-180': isExternalOpen }"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
            </div>
            <transition enter-active-class="transition duration-100 ease-out"
                leave-active-class="transition duration-75 ease-in">
                <ul v-if="isExternalOpen" class="space-y-2">
                    <li v-for="url in externalUrls" :key="url.url" class="text-xs bg-gray-50 p-3 rounded">
                        <span class="font-medium break-all">{{ url.url }}</span>
                        <p class="mt-1 text-gray-600">{{ url.description }}</p>
                    </li>
                </ul>
            </transition>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
    risks: {
        type: Array,
        required: true
    }
});

const isRisksOpen = ref(true);
const isExternalOpen = ref(false);

const { suspiciousUrls, externalUrls } = computed(() => {
    const suspicious = [];
    const external = [];

    props.risks.forEach(risk => {
        const processed = processRisk(risk);
        if (processed.isSuspicious) {
            suspicious.push(processed);
        } else {
            external.push(processed);
        }
    });

    return { suspiciousUrls: suspicious, externalUrls: external };
}).value;

function processRisk(risk) {
    const safeBrowsingResult = risk.safeBrowsingResult?.[0];
    const isLegitimateRedirect = checkLegitimateRedirect(risk.url, risk.context);

    const isSuspicious =
        (safeBrowsingResult?.threatType) ||
        (risk.domainMimicry) ||
        (risk.isSuspicious && !isLegitimateRedirect);

    return {
        url: risk.url,
        isSuspicious,
        threatType: isSuspicious ? (safeBrowsingResult?.threatType || 'Suspicious URL') : 'External Link',
        description: getUrlDescription(risk, isLegitimateRedirect)
    };
}

function getUrlDescription(risk, isLegitimateRedirect) {
    if (risk.safeBrowsingResult?.[0]) {
        return 'This URL has been flagged as malicious';
    }
    if (risk.domainMimicry && risk.isSuspicious) {
        return 'This URL appears to be impersonating a legitimate domain';
    }
    if (risk.urlMismatch) {
        return 'The displayed URL does not match the actual destination';
    }
    if (risk.isSuspicious && !isLegitimateRedirect) {
        return 'This URL appears suspicious';
    }
    return 'External link - exercise normal caution';
}

function checkLegitimateRedirect(url, context) {
    // Whitelist of common legitimate redirect/tracking domains
    const legitimateRedirects = [
        'click.mailchimp.com',
        'email.mailgun.net',
        'click.sendgrid.net',
        'links.salesforce.com',
        // Add more legitimate services
    ];

    try {
        const urlObj = new URL(url);
        return legitimateRedirects.some(domain => urlObj.hostname.includes(domain));
    } catch {
        return false;
    }
}
</script>

<style scoped>
.url-risks {
    position: relative;
    z-index: 10;
}
</style>