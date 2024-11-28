<template>
    <div class="url-risks" @click.stop>
        <div class="flex items-center justify-between text-sm font-medium text-red-600 mb-1 cursor-pointer"
            @click="isOpen = !isOpen">
            <span>Suspicious URLs Detected ({{ risks.length }})</span>
            <svg class="w-4 h-4 transform transition-transform" :class="{ 'rotate-180': isOpen }" fill="none"
                stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
        </div>
        <transition enter-active-class="transition duration-100 ease-out"
            leave-active-class="transition duration-75 ease-in" enter-from-class="transform opacity-0 scale-95"
            leave-to-class="transform opacity-0 scale-95">
            <ul v-if="isOpen" class="space-y-2">
                <li v-for="(risk, index) in processedRisks" :key="index" class="text-xs bg-red-50 p-3 rounded">
                    <div class="flex justify-between items-start">
                        <span class="font-medium break-all">{{ risk.url }}</span>
                        <span class="ml-2 text-red-700 whitespace-nowrap">
                            {{ risk.threatType }}
                        </span>
                    </div>
                    <p v-if="risk.description" class="mt-1 text-gray-600">
                        {{ risk.description }}
                    </p>
                </li>
            </ul>
        </transition>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
    risks: {
        type: Array,
        required: true
    }
});

const isOpen = ref(true);

const processedRisks = computed(() => {
    return props.risks.map(risk => {
        const safeBrowsingResult = risk.safeBrowsingResult?.[0];
        return {
            url: risk.url,
            isSuspicious: risk.isSuspicious,
            threatType: safeBrowsingResult?.threatType?.replace(/_/g, ' ').toLowerCase() ||
                (risk.isSuspicious ? 'Suspicious URL' : 'Unknown Threat'),
            description: risk.isSuspicious ?
                'This URL has been flagged as potentially malicious' :
                'This URL appears in a suspicious context'
        };
    });
});
</script>

<style scoped>
.url-risks {
    position: relative;
    z-index: 10;
}
</style>