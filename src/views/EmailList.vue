<template>
    <ul class="space-y-4">
        <EmailListItem v-for="email in emails" :key="email.id" :email="normalizeEmail(email)"
            @open="$emit('open', normalizeEmail(email))" />
    </ul>
</template>

<script setup>
import { defineProps, onMounted } from 'vue';
import EmailListItem from './EmailListItem.vue';
import { emailHelpers } from '@/utils/utils';

const props = defineProps({
    emails: {
        type: Array,
        required: true
    }
});

const emit = defineEmits(['open']);

// Function to normalize the email object structure
function normalizeEmail(email) {
    console.log('Normalizing email with security:', email.security);

    if (email.content?.body && !email.payload) {
        return email;
    }

    const body = emailHelpers.getEmailBody(email.payload);

    return {
        id: email.id,
        metadata: {
            subject: email.payload?.headers?.find(h => h.name.toLowerCase() === 'subject')?.value || 'No Subject',
            date: email.payload?.headers?.find(h => h.name.toLowerCase() === 'date')?.value,
            snippet: email.snippet || 'No Snippet',
            labels: email.labelIds || []
        },
        sender: {
            address: email.payload?.headers?.find(h => h.name.toLowerCase() === 'from')?.value || '',
            displayName: '',
            domain: ''
        },
        content: {
            body: body || '',
            sanitizedBody: emailHelpers.sanitizeEmailBody(body || ''),
            urls: emailHelpers.extractUrlsFromEmail(body || ''),
            rawPayload: email.payload
        },
        security: {
            authentication: {
                spf: email.security?.authentication?.spf || null,
                dkim: email.security?.authentication?.dkim || null,
                dmarc: email.security?.authentication?.dmarc || null,
                summary: email.security?.authentication?.summary || null
            },
            analysis: {
                isFlagged: email.security?.analysis?.isFlagged || false,
                suspiciousKeywords: email.security?.analysis?.suspiciousKeywords || [],
                linkRisks: email.security?.analysis?.linkRisks || [],
                safeBrowsingResult: email.security?.analysis?.safeBrowsingResult || []
            }
        }
    };
}

onMounted(() => {
    const normalizedEmails = props.emails.map(normalizeEmail);
    console.log("Normalized Emails:", normalizedEmails);
    console.log("Sample email body:", normalizedEmails[0]?.content?.body?.substring(0, 100));
});
</script>