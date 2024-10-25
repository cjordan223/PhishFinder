<template>
    <div class="flex justify-between mt-6">
        <button @click.prevent="prevPage" :disabled="currentPage === 1"
            class="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 disabled:bg-gray-300">
            Previous
        </button>
        <button @click.prevent="goToHome" class="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600">
            Home
        </button>
        <button @click.prevent="nextPage" :disabled="nextPageDisabled"
            class="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 disabled:bg-gray-300">
            Next
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
        }
    },
    methods: {
        prevPage() {
            this.$emit('prevPage');
        },
        nextPage() {
            this.$emit('nextPage');
        },
        goToHome() {
            this.$emit('goToHome');
        }
    }
};
</script>

<style scoped>
.pagination-controls {
    display: flex;
    justify-content: space-between;
    width: 100%;
}
</style>