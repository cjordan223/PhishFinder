<template>
    <div class="email-header space-y-2">
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
                <span class="font-medium">{{ sender.displayName }}</span>
                <span class="text-gray-500">&lt;{{ sender.address }}&gt;</span>
            </div>
            <span class="text-gray-500">{{ date }}</span>
        </div>
    </div>
</template>

<script setup>
defineProps({
    sender: {
        type: Object,
        required: true,
        validator: (value) => {
            return value.displayName !== undefined && value.address !== undefined;
        }
    },
    date: {
        type: String,
        required: true
    }
});
</script>