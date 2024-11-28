<template>
    <div class="keyword-alert">
        <div class="text-sm font-medium text-amber-600 mb-1">
            Suspicious Keywords Detected
        </div>
        <div class="flex flex-wrap gap-1">
            <span v-for="(keyword, index) in keywords" :key="index"
                class="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs">
                {{ keyword }}
            </span>
        </div>
    </div>
</template>

<script setup>
defineProps({
    keywords: {
        type: Array,
        required: true
    }
});
</script>