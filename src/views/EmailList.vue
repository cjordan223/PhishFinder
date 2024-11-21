<template>
    <ul class="space-y-4">
        <EmailListItem v-for="email in emails" :key="email.id" :email="email" @open="$emit('open', email)" />
    </ul>
</template>

<script setup>
import EmailListItem from './EmailListItem.vue';

const props = defineProps({
    emails: {
        type: Array,
        required: true
    }
});

const emit = defineEmits(['open']);
</script>

<style scoped>
.space-y-4> :not([hidden])~ :not([hidden]) {
    margin-top: 1rem;
}
</style>