<!-- EmailModal.vue -->
<template>
    <div v-if="email"
        class="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50 overflow-y-auto">
        <div class="relative p-4 w-full max-w-2xl max-h-full mx-auto">
            <!-- Modal Content -->
            <div class="relative bg-white rounded-lg shadow dark:bg-gray-700">
                <!-- Modal Header -->
                <div class="flex items-center justify-between p-4 md:p-5 border-b dark:border-gray-600">
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                        {{ email.subject || 'No Subject' }}
                    </h3>
                    <button @click="close"
                        class="text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-lg p-1.5 dark:hover:bg-gray-600 dark:hover:text-white">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                        <span class="sr-only">Close modal</span>
                    </button>
                </div>
                <!-- Modal Body -->
                <div class="p-4 space-y-4 md:p-5">
                    <p><strong>From:</strong> {{ email.from || 'Unknown Sender' }}</p>
                    <p><strong>Date:</strong> {{ formatDate(email.date) || 'Unknown Date' }}</p>
                    <div v-if="email.body" class="text-gray-800 dark:text-gray-200"
                        v-html="sanitizeEmailBody(email.body)"></div>
                </div>
                <!-- Modal Footer -->
                <div class="flex items-center justify-end p-4 md:p-5 border-t dark:border-gray-600">
                    <button @click="close"
                        class="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg px-5 py-2.5">
                        Close
                    </button>
                    <button @click="analyzeEmail"
                        class="ml-2 text-white bg-green-700 hover:bg-green-800 font-medium rounded-lg px-5 py-2.5">
                        Analyze
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import DOMPurify from 'dompurify';

export default {
    name: 'EmailModal',
    props: {
        email: {
            type: Object,
            required: true,
        },
    },
    methods: {
        close() {
            this.$emit('close');
        },
        formatDate(date) {
            if (!date) return 'Unknown Date';
            const options = {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
            };
            return new Date(date).toLocaleDateString(undefined, options);
        },
        sanitizeEmailBody(body) {
            return DOMPurify.sanitize(body, { USE_PROFILES: { html: true } });
        },
        async analyzeEmail() {
            console.log('API Token:', process.env.API_TOKEN); // Debugging purpose

            const emailContent = this.email.body || 'No Content';

            if (emailContent.length < 300) {
                alert('The email content is too short to analyze reliably.');
                return;
            }

            try {
                const response = await fetch('http://localhost:3001/api/analyze', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ text: emailContent }),
                });

                if (!response.ok) {
                    throw new Error(`Error: ${response.statusText}`);
                }

                const result = await response.json();
                console.log('AI Detection Result:', result);
                alert(`Human Score: ${result.score}%. This email is ${result.score}% likely to be written by a human.`);
            } catch (error) {
                console.error('Failed to analyze email:', error);
                alert('An error occurred while analyzing the email.');
            }
        },
    },
};
</script>

<style scoped>
.email-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    overflow-y: auto;
    /* Allow scrolling for long content */
}

.modal-content {
    background-color: white;
    padding: 20px;
    border-radius: 5px;
    width: 90%;
    max-width: 500px;
    max-height: 80vh;
    /* Set max height for modal */
    overflow-y: auto;
    /* Make modal content scrollable */
    position: relative;
    /* Ensure the close button is positioned relative to the modal */
}

.email-body-content {
    white-space: pre-wrap;
    /* Preserve formatting for plain text emails */
    overflow-wrap: break-word;
    /* Break long words */
}

.close-button {
    position: absolute;
    top: 10px;
    right: 10px;
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
}
</style>