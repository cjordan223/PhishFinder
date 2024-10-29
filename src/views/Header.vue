<template>
    <header class="bg-blue-500 w-full py-4">
        <div class="container mx-auto px-4">
            <div class="flex items-center justify-between h-24">
                <div class="flex items-center space-x-6">
                    <div class="flex-shrink-0">
                        <img class="h-16 w-16 rounded-full border-4 border-white shadow-lg"
                            src="/images/phishfinderlogo.png" alt="PhishFinder Logo">
                    </div>
                    <div class="text-white">
                        <h1 class="text-3xl font-mono font-bold tracking-tight">PhishFinder</h1>
                        <p class="text-lg font-mono">Stay Safe, Stay Aware</p>
                    </div>
                </div>
                <nav class="flex items-center space-x-8">
                    <a href="#/emails"
                        class="text-white font-mono text-lg hover:text-gray-200 transition-colors">Emails</a>
                    <a href="#/dashboard"
                        class="text-white font-mono text-lg hover:text-gray-200 transition-colors">Dashboard</a>
                    <button @click="$emit('logout')"
                        class="bg-red-500 hover:bg-red-600 text-white font-mono px-6 py-2 rounded-lg transition-colors">Logout</button>
                </nav>
            </div>
        </div>
    </header>
</template>

<script>
export default {
    name: 'Header'
};
</script>


<style scoped>
.font-mono {
    font-family: 'Space Mono', monospace;
}

/* Add any specific transitions */
.transition-colors {
    transition-property: color, background-color;
    transition-duration: 200ms;
    transition-timing-function: ease-in-out;
}
</style>