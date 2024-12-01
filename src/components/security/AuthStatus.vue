<template>
    <div class="flex flex-col space-y-2">
        <div class="relative flex items-center space-x-2" v-if="props.spf">
            <span class="auth-pill group" :class="spfClass">
                SPF: {{ spfStatus }}
                <div class="auth-tooltip">
                    <div class="font-medium mb-1">Sender Policy Framework</div>
                    <p class="text-xs text-gray-200">Verifies that the sender's email server is authorized to send mail for this domain. Helps prevent email spoofing.</p>
                    <div class="mt-2 pt-2 border-t border-gray-600">
                        <div class="text-xs">Current Status: {{ props.spf }}</div>
                    </div>
                </div>
            </span>
        </div>

        <div class="relative flex items-center space-x-2" v-if="props.dkim">
            <span class="auth-pill group" :class="dkimClass">
                DKIM: {{ dkimStatus }}
                <div class="auth-tooltip">
                    <div class="font-medium mb-1">DomainKeys Identified Mail</div>
                    <p class="text-xs text-gray-200">Digital signature that verifies email hasn't been tampered with during transit. Ensures email integrity.</p>
                    <div class="mt-2 pt-2 border-t border-gray-600">
                        <div class="text-xs">Current Status: {{ props.dkim }}</div>
                    </div>
                </div>
            </span>
        </div>

        <div class="relative flex items-center space-x-2" v-if="props.dmarc">
            <span class="auth-pill group" :class="dmarcClass">
                DMARC: {{ dmarcStatus }}
                <div class="auth-tooltip">
                    <div class="font-medium mb-1">Domain-based Message Authentication</div>
                    <p class="text-xs text-gray-200">Policy framework that uses SPF and DKIM to protect against spoofing and phishing attempts.</p>
                    <div class="mt-2 pt-2 border-t border-gray-600">
                        <div class="text-xs">Current Status: {{ props.dmarc }}</div>
                    </div>
                </div>
            </span>
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

    // For DMARC - only fail if policy is reject/quarantine and fails
    if (value.includes('v=dmarc1')) {
        if (value.includes('p=reject') || value.includes('p=quarantine')) {
            return value.includes('fail') ? 'fail' : 'pass';
        }
        return 'neutral'; // p=none is neutral
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
    @apply px-2 py-0.5 rounded-full text-xs font-medium cursor-help relative;
}

.auth-tooltip {
    @apply invisible opacity-0 absolute z-20 p-3 text-white bg-gray-800 rounded-lg shadow-lg
    transform -translate-x-1/2 translate-y-2 w-64 transition-all duration-200;
    left: 50%;
    top: -5px;
}

.auth-pill:hover .auth-tooltip {
    @apply visible opacity-100;
    top: calc(100% + 5px);
}

/* Updated arrow position */
.auth-tooltip::after {
    content: '';
    @apply absolute w-0 h-0 border-8 border-transparent border-b-gray-800;
    top: -16px;
    left: 50%;
    transform: translateX(-50%);
}
</style>