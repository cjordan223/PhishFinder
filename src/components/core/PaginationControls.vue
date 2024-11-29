<!-- PaginationControls.vue -->
<template>
    <div class="fixed top-1/2 w-full px-4 -translate-y-1/2 pointer-events-none">
        <div class="max-w-7xl mx-auto flex justify-between items-center">
            <button @click="$emit('prevPage')" :disabled="currentPage === 1"
                class="pointer-events-auto w-8 h-8 flex items-center justify-center text-gray-700 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-full hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            <button @click="$emit('nextPage')" :disabled="nextPageDisabled"
                class="pointer-events-auto w-8 h-8 flex items-center justify-center text-gray-700 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-full hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        currentPage: {
            type: Number,
            required: true,
        },
        nextPageDisabled: {
            type: Boolean,
            required: true,
        },
    },
    methods: {
        prevPage() {
            this.$emit('prevPage');
        },
        nextPage() {
            this.$emit('nextPage');
        },
    },
};
</script>

<style scoped>
.arrow-button {
    position: fixed;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    padding: 10px;
    cursor: pointer;
}

.arrow-button.left {
    left: 10px;
}

.arrow-button.right {
    right: 10px;
}

.icon {
    width: 32px;
    height: 32px;
    color: #333;
}

.arrow-button:hover .icon {
    color: #555;
}

.arrow-button:disabled .icon {
    color: #ccc;
    cursor: not-allowed;
}
</style>