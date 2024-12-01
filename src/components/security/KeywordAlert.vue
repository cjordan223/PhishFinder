<template>
    <div class="keyword-alert">
        <div class="flex flex-wrap gap-1">
            <span v-for="(keyword, index) in processedKeywords" :key="index"
                class="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs">
                {{ keyword }}
            </span>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    keywords: {
        type: Array,
        required: true
    }
});

const processedKeywords = computed(() => {
    // Predefined list of suspicious keywords
    const suspiciousKeywords = new Set([
        'account',
        'password',
        'verify',
        'security',
        'login',
        'bank',
        'urgent',
        'suspended',
        'locked',
        'update',
        'won',
        'winner'
    ]);

    // Create a Set to track unique keywords (case-insensitive)
    const uniqueKeywords = new Set();
    
    return props.keywords
        .filter(word => {
            const lowerWord = word.toLowerCase();
            // Only include if it's in our predefined list
            if (suspiciousKeywords.has(lowerWord) && !uniqueKeywords.has(lowerWord)) {
                uniqueKeywords.add(lowerWord);
                return true;
            }
            return false;
        });
});
</script>