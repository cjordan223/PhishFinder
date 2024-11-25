<template>
    <li @click="openEmail" class="p-4 bg-white shadow rounded-lg cursor-pointer hover:shadow-lg transition"
        :class="{ 'is-flagged': isFlagged }">
        <div class="flex justify-between items-start">
            <div>
                <div class="flex items-center">
                    <span v-if="isFlagged" class="flag-indicator text-red-500 mr-2">⚠️</span>
                    <h3 class="font-medium">{{ email.metadata?.subject }}</h3>
                </div>
                <p class="text-sm text-gray-600">{{ senderDisplay }}</p>
                <p class="text-sm text-gray-500">{{ email.metadata?.snippet }}</p>

                <!-- Security Analysis Display -->
                <div v-if="securityInfo" class="security-warning mt-2">
                    <div v-if="securityInfo.authentication">
                        <p class="text-sm">
                            Authentication: {{ securityInfo.authentication.summary }}
                        </p>
                    </div>
                    <div v-if="securityInfo.analysis?.linkRisks?.length" class="mt-1">
                        <p class="text-sm text-red-600">
                            Suspicious Links Found: {{ securityInfo.analysis.linkRisks.length }}
                        </p>
                    </div>
                </div>
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

const securityInfo = computed(() => {
    return props.email.security || null;
});

const isFlagged = computed(() => {
    return props.email.security?.analysis?.isFlagged ||
        props.email.security?.analysis?.linkRisks?.some(risk => risk.isSuspicious) ||
        false;
});
</script>

<style scoped>
.email-list-item {
    padding: 12px;
    border-bottom: 1px solid #eee;
    cursor: pointer;
}

.is-flagged {
    background-color: #fff3f3;
    border-left: 4px solid #ff4444;
}

.flag-indicator {
    margin-right: 8px;
}

.security-warning {
    margin-top: 8px;
    padding: 8px;
    background-color: #fff0f0;
    border-radius: 4px;
    font-size: 0.9em;
}

.security-warning ul {
    margin: 4px 0;
    padding-left: 20px;
}

.security-warning li {
    color: #d32f2f;
}
</style>