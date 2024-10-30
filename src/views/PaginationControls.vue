<!-- PaginationControls.vue -->
<template>
    <div>
        <button @click.prevent="prevPage" :disabled="currentPage === 1" class="arrow-button left"
            aria-label="Previous page">
            <!-- Left arrow icon -->
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
        </button>
        <button @click.prevent="nextPage" :disabled="nextPageDisabled" class="arrow-button right"
            aria-label="Next page">
            <!-- Right arrow icon -->
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
        </button>
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