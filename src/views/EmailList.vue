<template>
    <ul class="space-y-4">
        <EmailListItem v-for="email in normalizedEmails" :key="email.id" :email="email" @open="$emit('open', email)" />
    </ul>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import EmailListItem from './EmailListItem.vue';
import { emailHelpers } from '@/utils/utils';

const props = defineProps({
    emails: {
        type: Array,
        required: true
    }
});

const emit = defineEmits(['open']);

const normalizedEmails = computed(() => {
    return props.emails.map(email => normalizeEmail(email));
});

function normalizeEmail(email) {
    console.log('Email before normalization:', email);
    console.log('Email structure check:', {
        hasContent: !!email.content,
        hasSecurity: !!email.security,
        hasBody: !!email.content?.body,
        hasPayload: !!email.payload
    });

    // If the email is already normalized, return it as is
    if (email.content?.body && email.security) {
        console.log('Email already normalized, keeping security:', email.security);
        return email;
    }

    const body = email.content?.body || emailHelpers.getEmailBody(email.payload);

    const normalizedEmail = {
        id: email.id,
        metadata: email.metadata || {
            subject: email.payload?.headers?.find(h => h.name.toLowerCase() === 'subject')?.value || 'No Subject',
            date: email.payload?.headers?.find(h => h.name.toLowerCase() === 'date')?.value,
            snippet: email.snippet || 'No Snippet',
            labels: email.labelIds || []
        },
        sender: email.sender || {
            address: email.payload?.headers?.find(h => h.name.toLowerCase() === 'from')?.value || '',
            displayName: '',
            domain: ''
        },
        content: email.content || {
            body: body || '',
            sanitizedBody: emailHelpers.sanitizeEmailBody(body || ''),
            urls: emailHelpers.extractUrlsFromEmail(body || ''),
            rawPayload: email.payload
        },
        security: email.security // Preserve the security object
    };

    // Debug logs
    console.log('Normalized email with security:', normalizedEmail);
    console.log('Security object:', normalizedEmail.security);

    return normalizedEmail;
}

onMounted(() => {
    console.log("Normalized Emails:", normalizedEmails.value);
    if (normalizedEmails.value.length > 0) {
        console.log("Sample email body:", normalizedEmails.value[0]?.content?.body?.substring(0, 100));
        console.log("Sample email security:", normalizedEmails.value[0]?.security);
    }
});
</script>

<style scoped>
.space-y-4> :not([hidden])~ :not([hidden]) {
    margin-top: 1rem;
}
</style>