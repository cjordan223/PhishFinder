<!-- PaginationControls.vue -->
<template>
    <div class="flex items-center justify-between bg-white/90 px-4 py-0.5 border-b">
        <div class="flex flex-1 items-center justify-between">
            <button @click="$emit('prevPage')" :disabled="currentPage === 1"
                class="relative inline-flex items-center px-2 py-0.5 text-gray-400 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                <ChevronLeftIcon class="h-5 w-5" aria-hidden="true" />
            </button>

            <div class="flex items-center justify-center space-x-0.5">
                <button v-for="pageNum in displayedPages" :key="pageNum" @click="handlePageClick(pageNum)"
                    :disabled="pageNum === '...'" :class="[
                        pageNum === currentPage
                            ? 'bg-primary text-white'
                            : pageNum === '...'
                                ? 'text-gray-400 cursor-default'
                                : 'text-gray-900 hover:bg-gray-50',
                        'relative inline-flex items-center px-3 py-0.5 text-sm font-semibold rounded-md'
                    ]">
                    {{ pageNum }}
                </button>
            </div>

            <button @click="$emit('nextPage')" :disabled="nextPageDisabled"
                class="relative inline-flex items-center px-2 py-0.5 text-gray-400 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                <ChevronRightIcon class="h-5 w-5" aria-hidden="true" />
            </button>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/20/solid';

const props = defineProps({
    currentPage: {
        type: Number,
        required: true
    },
    nextPageDisabled: {
        type: Boolean,
        required: true
    },
    totalPages: {
        type: Number,
        required: true
    }
});

const emit = defineEmits(['prevPage', 'nextPage', 'goToPage']);

const displayedPages = computed(() => {
    const pages = [];
    const totalPages = props.totalPages;
    const current = props.currentPage;

    if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }
    } else {
        if (current <= 3) {
            pages.push(1, 2, 3, '...', totalPages);
        } else if (current >= totalPages - 2) {
            pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
        } else {
            pages.push(1, '...', current - 1, current, current + 1, '...', totalPages);
        }
    }
    return pages;
});

function handlePageClick(pageNum) {
    // Only emit if the pageNum is a number (not ellipsis)
    if (typeof pageNum === 'number') {
        emit('goToPage', pageNum);
    }
}
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