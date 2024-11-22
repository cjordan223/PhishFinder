<template>
    <div class="email-header space-y-2">
        <!-- Subject line -->
        <h2 class="text-lg font-semibold">{{ subject }}</h2>

        <div class="flex items-center justify-between">
            <div class="flex items-center gap-1">
                <span class="font-medium">{{ parsedSender.displayName }}</span>
                <span class="text-gray-500 text-sm">&lt;{{ parsedSender.address }}&gt;</span>
            </div>
            <span class="text-gray-500 text-sm">{{ formattedDate }}</span>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { emailHelpers } from '@/utils/utils';

const props = defineProps({
    sender: {
        type: Object,
        required: true,
        validator: (value) => {
            return value.displayName !== undefined && value.address !== undefined;
        }
    },
    subject: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    }
});

const parsedSender = computed(() => {
    const fullSender = `${props.sender.displayName} ${props.sender.address}`;
    return emailHelpers.parseSender(fullSender);
});

const formattedDate = computed(() => {
    return emailHelpers.formatDate(props.date);
});
</script>