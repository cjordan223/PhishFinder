<template>
    <div v-if="email"
        class="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50 overflow-y-auto">
        <div class="relative p-4 w-full max-w-2xl max-h-full mx-auto">
            <div class="relative bg-white rounded-lg shadow">
                <div class="flex items-center justify-between p-4 md:p-5 border-b">
                    <h3 class="text-xl font-semibold">{{ email.subject || 'No Subject' }}</h3>
                    <button @click="close" class="text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-lg p-1.5">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                        <span class="sr-only">Close modal</span>
                    </button>
                </div>
                <div class="p-4 space-y-4 md:p-5">
                    <p><strong>From:</strong> {{ email.from || 'Unknown Sender' }}</p>
                    <p><strong>Date:</strong> {{ formatDate(email.date) || 'Unknown Date' }}</p>
                    <div class="email-body-content" v-html="sanitizeEmailBody(email.body)"></div>

                    <!-- Display AI Analysis Result -->
                    <div v-if="aiAnalysisResult !== null" class="mt-4">
                        <p><strong>AI Analysis:</strong> {{ aiAnalysisResult }}</p>
                    </div>

                    <!-- Display Flagged URLs from Safe Browsing API -->
                    <div v-if="flaggedUrls && flaggedUrls.length > 0" class="mt-4">
                        <p><strong>Flagged URLs:</strong></p>
                        <ul>
                            <li v-for="url in flaggedUrls" :key="url" class="text-red-500">{{ url }}</li>
                        </ul>
                    </div>

                    <!-- Display Safe Browsing Result -->
                    <div v-if="safeBrowsingResult" class="mt-4">
                        <p><strong>Safe Browsing Status:</strong> {{ safeBrowsingResult }}</p>
                    </div>

                    <!-- Display Domain and IP Risks -->
                    <div v-if="domainRisks && domainRisks.length > 0" class="mt-4">
                        <p><strong>Domain and IP Analysis:</strong></p>
                        <ul>
                            <li v-for="risk in domainRisks" :key="risk" class="text-red-500">{{ risk }}</li>
                        </ul>
                    </div>

                    <!-- Display loading spinner if any API call is in progress -->
                    <div v-if="loading" class="flex items-center justify-center mt-4">
                        <svg class="animate-spin h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none"
                            viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
                            </circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0116 0H4z"></path>
                        </svg>
                        <p class="ml-2">Analyzing...</p>
                    </div>
                </div>
                <div class="flex items-center justify-end p-4 md:p-5 border-t">
                    <button @click="close"
                        class="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg px-5 py-2.5">
                        Close
                    </button>
                    <button @click="AICheck"
                        class="ml-2 text-white bg-green-700 hover:bg-green-800 font-medium rounded-lg px-5 py-2.5">
                        Analyze for AI
                    </button>
                    <button @click="analyzeDomain"
                        class="ml-2 text-white bg-indigo-700 hover:bg-indigo-800 font-medium rounded-lg px-5 py-2.5">
                        Mismatched Domains / IP's
                    </button>
                    <button @click="testSafeBrowsing"
                        class="ml-2 text-white bg-purple-700 hover:bg-purple-800 font-medium rounded-lg px-5 py-2.5">
                        Test Safe Browsing API
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import DOMPurify from 'dompurify';
import { linkAnalysis, extractUrlsFromEmail } from '@/utils/utils.js';

export default {
    name: 'EmailModal',
    props: {
        email: {
            type: Object,
            required: true,
        },
    },
    data() {
        return {
            flaggedUrls: [],
            safeBrowsingResult: null,
            domainRisks: [],  // Store analysis result
            aiAnalysisResult: null,  // Store AI analysis result
            loading: false,  // Track loading state for API calls
        };
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
        async AICheck() {
            const emailContent = this.email.body || 'No Content';
            if (emailContent.length < 300) {
                this.aiAnalysisResult = 'The email content is too short to analyze reliably.';
                return;
            }
            this.loading = true;
            try {
                const response = await fetch('http://localhost:8080/api/ai-analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: emailContent }),
                });
                const result = await response.json();
                this.aiAnalysisResult = `Human Score: ${result.score}%. This email is ${result.score}% likely to be written by a human.`;
            } catch (error) {
                console.error('Failed to analyze email:', error);
                this.aiAnalysisResult = 'An error occurred while analyzing the email.';
            } finally {
                this.loading = false;
            }
        },
        async analyzeDomain() {
            const urls = extractUrlsFromEmail(this.email.body);
            if (urls.length === 0) {
                this.domainRisks = ['No URLs found in the email.'];
                return;
            }
            this.loading = true;
            try {
                const linkRisks = linkAnalysis(this.email.body);
                this.domainRisks = linkRisks;
            } catch (error) {
                console.error('Failed to analyze email links:', error);
                this.domainRisks = ['An error occurred while analyzing the email links.'];
            } finally {
                this.loading = false;
            }
        },
        async testSafeBrowsing() {
            const urls = extractUrlsFromEmail(this.email.body);
            if (urls.length === 0) {
                this.safeBrowsingResult = 'No URLs found in the email.';
                return;
            }
            this.loading = true;
            try {
                const response = await fetch('http://localhost:8080/api/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: this.email.body }),
                });
                const result = await response.json();
                this.flaggedUrls = result.flaggedUrls.map(entry => entry.url);
                this.safeBrowsingResult = result.isSuspicious ? 'Suspicious' : 'Safe';
            } catch (error) {
                console.error('Error calling Safe Browsing API:', error);
                this.safeBrowsingResult = 'An error occurred while testing the Safe Browsing API.';
            } finally {
                this.loading = false;
            }
        }
    }
};
</script>

<style scoped>
.email-body-content {
    white-space: pre-wrap;
    overflow-wrap: break-word;
}
</style>
