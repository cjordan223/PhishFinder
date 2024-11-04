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
                }" :date="emailHelpers.formatDate(email.metadata?.date) || 'No Date'" />

                <!-- Email Body -->
                <div class="email-body-content prose max-w-none">
                    {{ email.content?.body || 'No content available' }}
                </div>

                <!-- Security Analysis -->
                <SecurityAnalysis v-if="email?.security" :authentication="email.security.authentication"
                    :analysis="email.security.analysis" :urls="email.content?.urls" />

                <!-- Update WhoisLookup component -->
                <Transition>
                    <WhoisLookup v-if="showWhois && isWhoisMounted" :domain="normalizedSender?.domain"
                        :emailId="email.id" ref="whoisLookup" @mounted="isWhoisMounted = true" />
                </Transition>
            </div>

            <!-- Footer -->
            <div class="flex justify-end p-6 border-t bg-gray-50 rounded-b-xl">
                <button @click="toggleWhois"
                    class="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors mr-2 flex items-center space-x-2"
                    :disabled="!normalizedSender?.domain">
                    <LoadingSpinner v-if="isLoading" class="w-5 h-5" />
                    <span class="ml-2">{{ showWhois ? 'Hide WHOIS' : 'Show WHOIS' }}</span>
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
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { emailHelpers, apiHelpers } from '@/utils/utils';
import SecurityAnalysis from './SecurityAnalysis.vue';
import EmailHeader from './components/EmailHeader.vue';
import CloseIcon from './icons/CloseIcon.vue';
import LoadingSpinner from './components/LoadingSpinner.vue';
import WhoisLookup from './WhoisLookup.vue';

const props = defineProps({
    email: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['close']);

// Computed properties
const formattedDate = computed(() => emailHelpers.formatDate(props.email.metadata?.date));
const normalizedSender = computed(() => {
    const senderInfo = emailHelpers.parseSender(props.email?.sender?.address || '');
    console.log('Parsed sender info:', senderInfo); // Debug log
    return senderInfo;
});

const securityData = computed(() => ({
    authentication: props.email?.security?.authentication || {},
    analysis: props.email?.security?.analysis || {},
    urls: props.email?.content?.urls || []
}));

// Methods
function close() {
    emit('close');
}

const isLoading = ref(false);


// Lifecycle hooks
// debug props with logging
onMounted(() => {
    console.log('Email Modal Content:', {
        sender: normalizedSender.value,
        security: securityData.value
    });
});

const whoisLookup = ref(null);
const showWhois = ref(false);
const isWhoisMounted = ref(false);

// Replace the simple toggle with a more controlled version
const toggleWhois = async () => {
    if (!showWhois.value) {
        isWhoisMounted.value = false; // Reset mount state before showing
    }
    showWhois.value = !showWhois.value;
};

// Use watch instead of the v-if to control component visibility
watch(showWhois, (newVal) => {
    if (newVal && !isWhoisMounted.value) {
        isWhoisMounted.value = true;
    }
});

// Debug logs
console.log('Modal Email Details:', {
    id: props.email.id,
    domain: normalizedSender.value.domain
});
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