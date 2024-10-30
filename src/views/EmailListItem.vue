<template>
    <li class="p-4 bg-white shadow rounded-lg cursor-pointer hover:shadow-lg transition" @click="openEmail">
        <strong>{{ email.subject || 'No Subject' }}</strong>

        <!-- Security Risk Icon (for link risks) -->
        <div v-if="hasLinkRisks" class="flex items-center space-x-2 text-red-500"> <span>🚩 Security Risk
                Detected</span>
        </div>

        <!-- Suspicious Keywords Icon -->
        <div v-if="hasKeywordFlag" class="flex items-center space-x-2 text-yellow-500">
            <span>🔍 Suspicious Keywords Detected</span>
        </div>

        <p class="text-sm text-gray-500">From: {{ email.from || 'Unknown Sender' }}</p>
        <p class="text-sm text-gray-500">Date: {{ formatDate(email.date) || 'Unknown Date' }}</p>
        <p class="truncate" v-html="sanitizeEmailBody(email.snippet || 'No Snippet')"></p>
    </li>
</template>

<script>
export default {
    name: 'EmailListItem',
    props: {
        email: {
            type: Object,
            required: true,
        },
    },
    computed: {
        hasLinkRisks() {
            return Array.isArray(this.email.linkRisks) && this.email.linkRisks.length > 0;
        },
        hasKeywordFlag() {
            return this.email.isFlagged === true &&
                Array.isArray(this.email.keywords) &&
                this.email.keywords.length > 0;
        }
    },
    methods: {
        openEmail() {
            console.log('Opening email with data:', this.email); // Add this line
            this.$emit('open', {
                ...this.email,
                suspiciousKeywords: this.email.keywords || [] // Pass keywords if they exist
            });
        },
        formatDate(date) {
            const options = {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            };
            return new Date(date).toLocaleDateString(undefined, options);
        },
        sanitizeEmailBody(body) {
            return body.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/&nbsp;/g, ' ');
        },
    },
};
</script>

<style scoped>
.warning-text {
    color: red;
    font-weight: bold;
}
</style>