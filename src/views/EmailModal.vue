<!-- EmailModal.vue -->
<template>
    <div v-if="email"
        class="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50 overflow-y-auto">
        <div class="relative p-4 w-full max-w-2xl max-h-full mx-auto">
            <!-- Modal Content -->
            <div class="relative bg-white rounded-lg shadow">
                <!-- Modal Header -->
                <div class="flex items-center justify-between p-4 md:p-5 border-b">
                    <h3 class="text-xl font-semibold">
                        {{ email.subject || 'No Subject' }}
                    </h3>
                    <button @click="close" class="text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-lg p-1.5">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                        <span class="sr-only">Close modal</span>
                    </button>
                </div>
                <!-- Modal Body -->
                <div class="p-4 space-y-4 md:p-5">
                    <p><strong>From:</strong> {{ email.from || 'Unknown Sender' }}</p>
                    <p><strong>Date:</strong> {{ formatDate(email.date) || 'Unknown Date' }}</p>
                    <!-- Display the sanitized email body -->
                    <div class="email-body-content" v-html="sanitizeEmailBody(email.body)">
                    </div>
                </div>
                <!-- Modal Footer -->
                <div class="flex items-center justify-end p-4 md:p-5 border-t">
                    <button @click="close"
                        class="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg px-5 py-2.5">
                        Close
                    </button>
                    <button @click="analyzeEmail"
                        class="ml-2 text-white bg-green-700 hover:bg-green-800 font-medium rounded-lg px-5 py-2.5">
                        Analyze
                    </button>
                    <button @click="testSafeBrowsing"
                        class="ml-2 text-white bg-purple-700 hover:bg-purple-800 font-medium rounded-lg px-5 py-2.5">Test
                        Safe Browsing API</button>
                    <button @click="checkLinks"
                        class="ml-2 text-white bg-orange-700 hover:bg-orange-800 font-medium rounded-lg px-5 py-2.5">Check
                        Links</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import DOMPurify from 'dompurify';
import { linkAnalysis, analyzeEmailContent, extractUrlsFromEmail } from '@/utils/utils.js';

export default {
    name: 'EmailModal',
    props: {
        email: {
            type: Object,
            required: true,
        },
    },
    methods: {
        close() {
            this.$emit('close');
        },
        formatDate(date) {
            if (!date) return 'Unknown Date';
            const options = {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
            };
            return new Date(date).toLocaleDateString(undefined, options);
        },
        sanitizeEmailBody(body) {
            return DOMPurify.sanitize(body, { USE_PROFILES: { html: true } });
        },
        async analyzeEmail() {
            console.log('API Token:', process.env.API_TOKEN); // Debugging purpose

            try {
                const analyzedEmail = await analyzeEmailContent(this.email, this.sendToBackendForAnalysis);
                const message = analyzedEmail.isFlagged
                    ? `Suspicious content found. Risks: ${analyzedEmail.linkRisks.join(', ')}`
                    : 'No suspicious content found.';
                alert(message);
            } catch (error) {
                console.error('Failed to analyze email:', error);
                alert('An error occurred while analyzing the email.');
            }
        },
        async testSafeBrowsing() {
            const urls = extractUrlsFromEmail(this.email.body);
            if (urls.length === 0) {
                alert('No URLs found in the email.');
                return;
            }

            try {
                const response = await fetch('http://localhost:3001/api/analyze', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ text: this.email.body }),
                });

                const result = await response.json();
                if (result.flaggedUrls && result.flaggedUrls.length > 0) {
                    const flaggedUrls = result.flaggedUrls.map(entry => entry.url); // Extract URLs only
                    alert('Suspicious URLs detected: ' + flaggedUrls.join(', '));
                } else {
                    alert('No suspicious URLs detected.');
                }
            } catch (error) {
                console.error('Error calling Safe Browsing API:', error);
                alert('An error occurred while testing the Safe Browsing API.');
            }
        },
        async checkLinks() {
            const linkRisks = linkAnalysis(this.email.body);
            if (linkRisks.length > 0) {
                alert('Link Risks Detected:\n' + linkRisks.join('\n'));
            } else {
                alert('No link-related risks detected.');
            }
        },
        async sendToBackendForAnalysis(text) {
            try {
                const response = await fetch('http://localhost:3001/api/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text }),
                });
                const result = await response.json();
                return result.isSuspicious || false;
            } catch (error) {
                console.error('Error calling backend API:', error);
                return false;
            }
        }
    }
};
</script>

<style scoped>
.email-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(87, 93, 106, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    overflow-y: auto;
}

.modal-content {
    background-color: #e0f7fa;
    padding: 20px;
    border-radius: 5px;
    width: 90%;
    max-width: 500px;
    max-height: 80vh;
    overflow-y: auto;
    position: relative;
}

.email-body-content {
    white-space: pre-wrap;
    overflow-wrap: break-word;
}
</style>
