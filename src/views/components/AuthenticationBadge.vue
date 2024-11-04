<template>
    <div class="flex items-center space-x-2">
        <div class="relative" @mouseenter="showTooltip = true" @mouseleave="showTooltip = false">
            <div :class="badgeClasses">
                {{ label }}: {{ statusText }}
            </div>
            <div v-if="showTooltip"
                class="absolute bottom-full mb-2 p-2 bg-gray-800 text-white text-sm rounded shadow-lg whitespace-nowrap z-50">
                {{ tooltip }}
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, ref } from 'vue';

const showTooltip = ref(false);

const props = defineProps({
    label: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: null
    },
    tooltip: {
        type: String,
        required: true
    }
});

const statusText = computed(() => {
    if (props.status === 'pass') return '✓';
    if (props.status === 'fail') return '✗';
    return '?';
});

const badgeClasses = computed(() => ({
    'px-3 py-1 rounded-full text-sm font-medium': true,
    'bg-green-100 text-green-800': props.status === 'pass',
    'bg-red-100 text-red-800': props.status === 'fail',
    'bg-gray-100 text-gray-800': !props.status
}));
</script>