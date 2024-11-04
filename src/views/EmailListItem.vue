<template>
    <li @click="openEmail" class="p-4 bg-white shadow rounded-lg cursor-pointer hover:shadow-lg transition">
        <div class="flex justify-between items-start">
            <div>
                <h3 class="font-medium">{{ email.metadata?.subject }}</h3>
                <p class="text-sm text-gray-600">{{ senderDisplay }}</p>
                <p class="text-sm text-gray-500">{{ email.metadata?.snippet }}</p>
            </div>
            <span class="text-sm text-gray-500">{{ formattedDate }}</span>
        </div>
    </li>
</template>

<script setup>
import { computed } from 'vue';
import { emailHelpers } from '@/utils/utils';

const props = defineProps({
    email: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['open']);

const senderDisplay = computed(() => {
    const from = props.email.sender?.address || '';
    const parsed = emailHelpers.parseSender(from);
    return parsed.displayName || parsed.address || 'Unknown Sender';
});

const formattedDate = computed(() => {
    return emailHelpers.formatDate(props.email.metadata?.date);
});

function openEmail() {
    emit('open', props.email);
}
</script>