<template>
    <!-- Modal container, visible only if email prop is provided -->
    <div v-if="email"
        class="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50 overflow-y-auto">
        <div class="relative p-4 w-full max-w-2xl max-h-full mx-auto">
            <div class="relative bg-white rounded-lg shadow">
                <!-- Modal header with email subject and close button -->
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
                <!-- Modal body with email details and analysis results -->
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

                    <!-- Display Suspicious Keywords -->
                    <div v-if="hasKeywords" class="mt-4">
                        <p><strong>Suspicious Keywords:</strong></p>
                        <ul>
                            <li v-for="keyword in normalizedKeywords" :key="keyword" class="text-red-500">
                                {{ keyword }}
                            </li>
                        </ul>
                    </div>
                    <!-- Display Email Authentication Records -->
                    <div v-if="dnsRecords" class="mt-4">
                        <p><strong>Email Authentication Records:</strong></p>
                        <ul>
                            <li><strong>SPF:</strong> <span v-if="dnsRecords.spf">{{ dnsRecords.spf }}</span><span
                                    v-else>No SPF record found</span></li>
                            <li><strong>DKIM:</strong> <span v-if="dnsRecords.dkim">{{ dnsRecords.dkim }}</span><span
                                    v-else>No DKIM record found</span></li>
                            <li><strong>DMARC:</strong> <span v-if="dnsRecords.dmarc">{{ dnsRecords.dmarc }}</span><span
                                    v-else>No DMARC record found</span></li>
                            <li><strong>Summary:</strong> {{ dnsRecords.summary }}</li>
                        </ul>
                    </div>


                    <!-- WHOIS Lookup Section -->
                    <div class="mt-4">
                        <input id="domainInput" v-model="domainInput" placeholder="Enter domain"
                            class="border p-2 rounded" />
                        <button @click="fetchWhoisData"
                            class="ml-2 text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg px-5 py-2.5">
                            Lookup WHOIS
                        </button>
                        <pre id="whoisResult" class="mt-4 bg-gray-100 p-4 rounded">{{ whoisResult }}</pre>
                    </div>
                    <!-- Display WHOIS data -->
                    <div v-if="whoisData">
                        <h3>Domain Information</h3>
                        <p><strong>Domain:</strong> {{ whoisData.domain.domain }}</p>
                        <p><strong>Registrar:</strong> {{ whoisData.registrar.name }}</p>
                        <p><strong>Registrant Organization:</strong> {{ whoisData.registrant.organization }}</p>
                        <p><strong>Registrant Country:</strong> {{ whoisData.registrant.country }}</p>
                        <p><strong>Creation Date:</strong> {{ formatDate(whoisData.domain.created_date) }}</p>
                        <p><strong>Expiration Date:</strong> {{ formatDate(whoisData.domain.expiration_date) }}</p>
                        <p><strong>Updated Date:</strong> {{ formatDate(whoisData.domain.updated_date) }}</p>
                        <p><strong>Name Servers:</strong> {{ whoisData.domain.name_servers.join(', ') }}</p>
                    </div>
                    <div v-else-if="whoisLoading">
                        <p>Loading WHOIS data...</p>
                    </div>
                    <div v-else-if="whoisError">
                        <p>Error fetching WHOIS data: {{ whoisError }}</p>
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
                <!-- Modal footer with close and analyze buttons -->
                <div class="flex items-center justify-end p-4 md:p-5 border-t">
                    <button @click="close"
                        class="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg px-5 py-2.5">
                        Close
                    </button>
                    <button @click="AICheck"
                        class="ml-2 text-white bg-green-700 hover:bg-green-800 font-medium rounded-lg px-5 py-2.5">
                        Analyze for AI
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
            validator(value) {
                console.log('Email prop received:', value); // Log received email prop
                return true;
            }
        },
    },
    computed: {
        hasKeywords() {
            return Array.isArray(this.suspiciousKeywords) &&
                this.suspiciousKeywords.length > 0;
        },
        normalizedKeywords() {
            return Array.isArray(this.suspiciousKeywords) ?
                Array.from(this.suspiciousKeywords) : [];
        }
    },
    data() {
        return {
            flaggedUrls: [],  // URLs flagged by Safe Browsing API
            safeBrowsingResult: null,  // Result of Safe Browsing API
            domainRisks: [],  // Analysis result of domains and IPs
            aiAnalysisResult: null,  // Result of AI analysis
            loading: false,  // Loading state for API calls
            suspiciousKeywords: [],  // Suspicious keywords found in email
            dnsRecords: null,  // DNS records for the domain
            whoisData: null,
            whoisLoading: false,
            whoisError: null,
            domainInput: '', //

        };
    },
    methods: {
        // Emit close event to parent component
        close() {
            this.$emit('close');
        },
        // Format date to a readable string
        formatDate(date) {
            if (!date) return 'Unknown Date';
            const options = {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
            };
            return new Date(date).toLocaleDateString(undefined, options);
        },
        // Sanitize email body to prevent XSS attacks
        sanitizeEmailBody(body) {
            return DOMPurify.sanitize(body, { USE_PROFILES: { html: true } });
        },
        // Perform AI analysis on email content
        async AICheck() {
            const emailContent = this.email.body || 'No Content';
            if (emailContent.length < 300) {
                this.aiAnalysisResult = 'The email content is too short to analyze reliably.';
                return;
            }
            this.loading = true;
            try {
                const response = await fetch('http://localhost:8080/analysis/ai-analyze', {
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
        // Analyze domains and IPs in email content
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
        // Test URLs in email content using Safe Browsing API
        async testSafeBrowsing() {
            const urls = extractUrlsFromEmail(this.email.body);
            if (urls.length === 0) {
                this.safeBrowsingResult = 'No URLs found in the email.';
                return;
            }
            this.loading = true;
            try {
                const response = await fetch('http://localhost:8080/analysis/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: this.email.body }),
                });
                const result = await response.json();
                console.log('API Response:', result);
                this.flaggedUrls = result.flaggedUrls?.map(entry => entry.url) || [];
                this.safeBrowsingResult = result.isSuspicious ? 'Suspicious' : 'Safe';

                // Combine API keywords with existing keywords
                const apiKeywords = result.suspiciousKeywords || [];
                const existingKeywords = Array.from(this.suspiciousKeywords || []);
                this.suspiciousKeywords = [...new Set([...existingKeywords, ...apiKeywords])];

            } catch (error) {
                console.error('Error calling Safe Browsing API:', error);
                this.safeBrowsingResult = 'An error occurred while testing the Safe Browsing API.';
            } finally {
                this.loading = false;
            }
        },
        // Fetch DNS records for the domain
        async fetchDNSRecords(domain) {
            console.log(`Fetching DNS records for domain: ${domain}`);
            try {
                const response = await fetch(`http://localhost:8080/dns/dns-records/${domain}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch DNS records: ${response.statusText}`);
                }
                const data = await response.json();
                console.log('Fetched DNS Records:', data); // Log the fetched DNS records
                this.dnsRecords = data;
            } catch (error) {
                console.error('Error fetching DNS records:', error);
                this.dnsRecords = null;
            }
        },
        // Fetch WHOIS data for the domain
        async fetchWhoisData() {
            const domain = this.domainInput;
            this.whoisLoading = true;
            this.whoisError = null;
            try {
                const response = await fetch(`http://localhost:8080/whois/${domain}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch WHOIS data: ${response.statusText}`);
                }
                const data = await response.json();
                this.whoisData = data;
            } catch (error) {
                this.whoisError = error.message;
            } finally {
                this.whoisLoading = false;
            }
        },
        // Extract domain from email address
        extractDomainFromEmail(email) {
            const match = email.match(/@([\w.-]+)/);
            return match ? match[1] : null;
        },
    },
    watch: {
        domainInput(newDomain) {
            if (newDomain) {
                this.fetchWhoisData();
            }
        },
    },
    mounted() {
        this.analyzeDomain();
        this.testSafeBrowsing();

        if (this.email.keywords) {
            this.suspiciousKeywords = Array.from(this.email.keywords);
        }

        // Fetch DNS records for the domain
        const domain = this.extractDomainFromEmail(this.email.from);
        if (domain) {
            this.fetchDNSRecords(domain);
        }

        console.log('Mounted: Email Keywords:', Array.from(this.email.keywords || []));
        console.log('Mounted: Suspicious Keywords:', Array.from(this.suspiciousKeywords));
    }
};
</script>

<style scoped>
.email-body-content {
    white-space: pre-wrap;
    overflow-wrap: break-word;
}
</style>