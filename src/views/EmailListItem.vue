<template>
    <li class="p-4 bg-white shadow rounded-lg cursor-pointer hover:shadow-lg transition" @click="openEmail">
        <strong>{{ email.subject || 'No Subject' }}</strong>
        <div v-if="email.isFlagged" class="flex items-center space-x-2 text-red-500">
            <img src="/images/icon128s.png" alt="suspicious" class="w-6 h-6" />
            <span>🚩 Suspicious</span>
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
    methods: {
        openEmail() {
            this.$emit('open', this.email);
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
.email-item {
    border-bottom: 1px solid #ddd;
    padding: 10px;
    cursor: pointer;
}

.warning-text {
    color: red;
    font-weight: bold;
}
</style>