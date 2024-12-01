<template>
    <div class="inline-flex items-center" :title="tooltip">
        <span class="w-2 h-2 rounded-full mr-1" :class="statusColor"></span>
        <span class="text-xs font-medium" :class="textColor">
            {{ statusText }}
        </span>
    </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    status: {
        type: String,
        required: true,
        validator: (value) => ['secure', 'warning', 'high-risk', 'caution', 'unknown'].includes(value)
    },
    tooltip: {
        type: String,
        default: ''
    }
});

const statusColor = computed(() => ({
    'bg-green-500': props.status === 'secure',
    'bg-yellow-500': props.status === 'warning',
    'bg-red-500': props.status === 'high-risk',
    'bg-blue-500': props.status === 'caution',
    'bg-gray-500': props.status === 'unknown'
}));

const textColor = computed(() => ({
    'text-green-700': props.status === 'secure',
    'text-yellow-700': props.status === 'warning',
    'text-red-700': props.status === 'high-risk',
    'text-blue-700': props.status === 'caution',
    'text-gray-700': props.status === 'unknown'
}));

const statusText = computed(() => {
    switch (props.status) {
        case 'secure':
            return 'Secure';
        case 'warning':
            return 'Warning';
        case 'high-risk':
            return 'High Risk';
        case 'caution':
            return 'Caution';
        default:
            return 'Unknown';
    }
});
</script>