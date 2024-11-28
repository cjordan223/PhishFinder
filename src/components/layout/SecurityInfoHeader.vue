<template>
    <div class="bg-gray-50 border-b border-gray-200">
        <div class="max-w-screen-xl mx-auto py-2 px-4">
            <div class="flex justify-between items-center text-sm">
                <div class="flex gap-8">
                    <div class="flex items-center gap-2">
                        <span class="font-medium text-gray-700">Authentication:</span>
                        <div class="flex gap-1">
                            <span class="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs">SPF Pass</span>
                            <span class="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs">DKIM Fail</span>
                            <span class="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full text-xs">DMARC
                                Neutral</span>
                        </div>
                        <button class="text-gray-400 hover:text-gray-600">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="font-medium text-gray-700">Watch for:</span>
                        <div class="flex gap-1">
                            <span class="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs">Suspicious
                                URLs</span>
                            <span class="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs">URL
                                Mismatches</span>
                            <span class="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs">Keywords</span>
                        </div>
                    </div>
                </div>
                <button @click="showInfo = !showInfo" class="text-blue-600 hover:text-blue-800 text-xs">
                    Learn More
                </button>
            </div>

            <!-- Info Panel -->
            <div v-if="showInfo" class="mt-2 pb-2 text-xs text-gray-600 grid grid-cols-2 gap-4">
                <div>
                    <h4 class="font-medium text-gray-700 mb-1">Email Authentication</h4>
                    <ul class="space-y-1">
                        <li><span class="font-medium">SPF:</span> Verifies sender's IP is authorized</li>
                        <li><span class="font-medium">DKIM:</span> Checks email hasn't been tampered with</li>
                        <li><span class="font-medium">DMARC:</span> Enforces authentication policies</li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-medium text-gray-700 mb-1">Security Indicators</h4>
                    <ul class="space-y-1">
                        <li><span class="font-medium">Suspicious URLs:</span> Links to potentially harmful sites</li>
                        <li><span class="font-medium">URL Mismatches:</span> Displayed URL differs from actual link</li>
                        <li><span class="font-medium">Keywords:</span> Common phrases used in phishing attempts</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';

const showInfo = ref(false);
</script>