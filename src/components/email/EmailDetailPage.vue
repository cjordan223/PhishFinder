<template>
    <div class="fixed inset-0 z-50 bg-white transform transition-transform duration-300 ease-in-out"
        :class="{ 'translate-x-0': show, 'translate-x-full': !show }">
        <!-- Header with back button -->
        <div class="sticky top-0 z-10 bg-white border-b shadow-sm">
            <div class="flex items-center p-4">
                <button @click="$emit('close')" class="p-2 hover:bg-gray-100 rounded-full mr-4">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 class="text-xl font-semibold truncate">{{ email.metadata?.subject || 'No Subject' }}</h1>
            </div>
        </div>

        <!-- Email content -->
        <div class="h-[calc(100vh-64px)] overflow-y-auto p-4">
            <!-- Sender info -->
            <div class="mb-4">
                <div class="flex items-center gap-2">
                    <span class="font-medium">{{ email.sender?.displayName || email.sender?.address?.split('@')[0]
                        }}</span>
                    <span class="text-gray-500">&lt;{{ email.sender?.address }}&gt;</span>
                </div>
                <div class="text-gray-500 text-sm">
                    {{ emailHelpers.formatDate(email.metadata?.date) || 'No date' }}
                </div>
            </div>

            <!-- Email body -->
            <div class="email-body-content prose max-w-none bg-white rounded-lg border p-6">
                <div v-if="email.content?.htmlBody" v-html="sanitizeHtml(email.content.htmlBody)" class="rendered-html">
                </div>
                <div v-else-if="email.content?.body" class="whitespace-pre-wrap">{{ email.content.body }}</div>
                <div v-else class="text-gray-500 italic">No content available</div>
            </div>

        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { emailHelpers } from '@/utils/utils';
import DOMPurify from 'dompurify';

const props = defineProps({
    email: {
        type: Object,
        required: true
    },
    show: {
        type: Boolean,
        required: true
    }
});

defineEmits(['close']);

function sanitizeHtml(html) {
    return html ? DOMPurify.sanitize(html) : '';
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

.rendered-html {
    max-width: 100%;
    overflow-x: auto;
}

.rendered-html img {
    max-width: 100%;
    height: auto;
}
</style>