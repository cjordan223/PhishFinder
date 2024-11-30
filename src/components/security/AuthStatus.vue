<template>
    <div class="flex flex-col space-y-2">
        <div class="flex items-center space-x-2" v-if="props.spf">
            <span class="auth-pill" :class="spfClass">SPF: {{ spfStatus }}</span>
            <button @click="showSpfInfo = !showSpfInfo" class="text-gray-400 hover:text-gray-600">
                <i class="fas fa-info-circle"></i>
            </button>
            <div v-if="showSpfInfo" class="auth-tooltip">{{ props.spf }}</div>
        </div>

        <div class="flex items-center space-x-2" v-if="props.dkim">
            <span class="auth-pill" :class="dkimClass">DKIM: {{ dkimStatus }}</span>
            <button @click="showDkimInfo = !showDkimInfo" class="text-gray-400 hover:text-gray-600">
                <i class="fas fa-info-circle"></i>
            </button>
            <div v-if="showDkimInfo" class="auth-tooltip">{{ props.dkim }}</div>
        </div>

        <div class="flex items-center space-x-2" v-if="props.dmarc">
            <span class="auth-pill" :class="dmarcClass">DMARC: {{ dmarcStatus }}</span>
            <button @click="showDmarcInfo = !showDmarcInfo" class="text-gray-400 hover:text-gray-600">
                <i class="fas fa-info-circle"></i>
            </button>
            <div v-if="showDmarcInfo" class="auth-tooltip">{{ props.dmarc }}</div>
        </div>
    </div>
</template>

<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
    spf: String,
    dkim: String,
    dmarc: String
});

// Log authentication statuses
console.log('SPF Status:', props.spf);
console.log('DKIM Status:', props.dkim);
console.log('DMARC Status:', props.dmarc);

const getStatus = (value) => {
    if (!value) return 'neutral';
    value = value.toLowerCase();

    if (value.includes('pass')) return 'pass';
    if (value.includes('fail')) return 'fail';

    // For SPF
    if (value.includes('v=spf1')) {
        return value.includes('redirect=_spf.google.com') ? 'pass' : 'neutral';
    }

    // For DMARC
    if (value.includes('v=dmarc1')) {
        return value.includes('p=none') ? 'neutral' : 'pass';
    }

    // For DKIM
    if (value.includes('no dkim record')) return 'fail';

    return 'neutral';
};

const spfStatus = computed(() => getStatus(props.spf));
const dkimStatus = computed(() => getStatus(props.dkim));
const dmarcStatus = computed(() => getStatus(props.dmarc));

const getStatusClass = (status) => ({
    'bg-green-100 text-green-800': status === 'pass',
    'bg-red-100 text-red-800': status === 'fail',
    'bg-gray-100 text-gray-800': status === 'neutral'
});

const spfClass = computed(() => getStatusClass(spfStatus.value));
const dkimClass = computed(() => getStatusClass(dkimStatus.value));
const dmarcClass = computed(() => getStatusClass(dmarcStatus.value));

const showSpfInfo = ref(false);
const showDkimInfo = ref(false);
const showDmarcInfo = ref(false);
</script>

<style scoped>
.auth-pill {
    @apply px-2 py-0.5 rounded-full text-xs font-medium;
}

.auth-tooltip {
    @apply absolute z-10 mt-2 p-2 text-xs bg-gray-800 text-white rounded shadow-lg w-48;
    left: 50%;
    transform: translateX(-50%);
}

.auth-tooltip::before {
    content: '';
    @apply absolute -top-2 left-1/2 transform -translate-x-1/2 border-8 border-transparent border-b-gray-800;
}
</style>