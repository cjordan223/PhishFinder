<template>
    <div v-if="email"
        class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 backdrop-blur-sm p-4">
        <div class="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl">
            <!-- Header -->
            <div class="flex items-center justify-between p-6 border-b">
                <h3 class="text-xl font-semibold text-gray-900">
                    {{ email.metadata?.subject || 'No Subject' }}
                </h3>
                <button @click="close"
                    class="text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-lg p-2 transition-colors">
                    <CloseIcon />
                </button>
            </div>

            <!-- Content -->
            <div class="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <!-- Email Header Component -->
                <EmailHeader :sender="{
                    displayName: email.sender?.displayName || email.sender?.address?.split('@')[0] || 'Unknown Sender',
                    address: email.sender?.address || 'no-address'
                }" :date="email.metadata?.date || 'No Date'" />

                <!-- Email Body -->
                <div class="email-body-content prose max-w-none">
                    {{ email.content?.body || 'No content available' }}
                </div>

                <!-- Security Analysis -->
                <SecurityAnalysis v-if="email.security" :authentication="email.security.authentication"
                    :analysis="email.security.analysis" :urls="email.content?.urls || []" />
            </div>

            <!-- Footer -->
            <div class="flex justify-end p-6 border-t bg-gray-50 rounded-b-xl">
                <button @click="triggerDnsLookup"
                    class="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors mr-2"
                    :disabled="!email.sender?.domain">
                    Refresh DNS
                </button>
                <button @click="close"
                    class="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors">
                    Close
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { emailHelpers, apiHelpers } from '@/utils/utils';
import SecurityAnalysis from './SecurityAnalysis.vue';
import WhoisLookup from './WhoisLookup.vue';
import EmailHeader from './components/EmailHeader.vue';
import CloseIcon from './icons/CloseIcon.vue';

const props = defineProps({
    email: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['close']);

// Computed properties
const formattedDate = computed(() => emailHelpers.formatDate(props.email.metadata?.date));
const normalizedSender = computed(() => ({
    address: props.email.sender?.address || '',
    displayName: props.email.sender?.displayName || 'Unknown Sender',
    domain: props.email.sender?.domain || ''
}));

const securityAnalysis = computed(() => ({
    isFlagged: props.email.security?.analysis?.isFlagged || false,
    suspiciousKeywords: props.email.security?.analysis?.suspiciousKeywords || [],
    linkRisks: props.email.security?.analysis?.linkRisks || [],
    safeBrowsingResult: props.email.security?.analysis?.safeBrowsingResult || []
}));

// Lifecycle hooks
onMounted(() => {
    console.log('Email Modal Content:', {
        body: props.email.content?.body,
        security: props.email.security,
        sender: props.email.sender
    });
});

// Methods
function close() {
    emit('close');
}

</script>

<style scoped>
.email-body-content {
    white-space: pre-wrap;
    word-wrap: break-word;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    line-height: 1.5;
    color: #374151;
}
</style>