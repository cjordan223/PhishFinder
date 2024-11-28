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
        validator: (value) => ['safe', 'warning', 'high-risk', 'unknown'].includes(value)
    },
    tooltip: {
        type: String,
        default: ''
    }
});

// Log status and tooltip
console.log('Security Badge Status:', props.status);
console.log('Security Badge Tooltip:', props.tooltip);

const statusColor = computed(() => ({
    'bg-green-500': props.status === 'safe',
    'bg-yellow-500': props.status === 'warning',
    'bg-red-500': props.status === 'high-risk',
    'bg-gray-500': props.status === 'unknown'
}));

const textColor = computed(() => ({
    'text-green-700': props.status === 'safe',
    'text-yellow-700': props.status === 'warning',
    'text-red-700': props.status === 'high-risk',
    'text-gray-700': props.status === 'unknown'
}));

const statusText = computed(() => ({
    'safe': 'Secure',
    'warning': 'Caution',
    'high-risk': 'High Risk',
    'unknown': 'Unknown'
}[props.status]));
</script>