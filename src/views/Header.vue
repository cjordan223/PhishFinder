<template>
    <header class="bg-blue-500">
        <div class="flex items-center justify-between p-6 max-w-7xl mx-auto">
            <!-- Logo and Text Section -->
            <div class="flex items-center">
                <!-- Enlarged Logo Image -->
                <img class="h-24 w-24 mr-6 rounded-full border-4 border-white shadow-lg"
                    src="/public/images/phishfinderlogo.png" alt="PhishFinder Logo" />
                <!-- Title and Tagline -->
                <div class="text-white">
                    <h1 class="title text-2xl font-bold">PhishFinder</h1>
                    <p class="text-sm">Stay Safe,Stay Aware</p>
                </div>
            </div>

            <!-- Navigation Links and Logout Button -->
            <nav class="flex gap-8" aria-label="Global">
                <a href="/learning" class="text-white text-sm font-semibold hover:text-gray-300">Learning</a>
                <a href="/emails" class="text-white text-sm font-semibold hover:text-gray-300">Emails</a>
                <a href="/dashboard" class="text-white text-sm font-semibold hover:text-gray-300">Dashboard</a>
                <button @click="$emit('logout')" class="bg-red-500 py-2 px-4 rounded-lg hover:bg-red-600 text-white">
                    Logout
                </button>
            </nav>
        </div>
    </header>
</template>

<script>
export default {
    name: 'Header',
    methods: {
        logout() {
            chrome.identity.getAuthToken({ interactive: false }, (token) => {
                if (token) {
                    chrome.identity.removeCachedAuthToken({ token }, () => {
                        chrome.storage.local.set({ loggedOut: true }, () => {
                            console.log('Logged out, redirecting to login page');
                            this.$router.replace('/login');
                        });
                    });
                } else {
                    chrome.storage.local.set({ loggedOut: true }, () => {
                        console.log('No token found, redirecting to login');
                        this.$router.replace('/login');
                    });
                }
            });
        }
    }
};
</script>

<style scoped>
.title {
    font-family: 'Space Mono', monospace;
    font-size: 2rem;
    /* Increase font size for h1 */
}

p {
    font-family: 'Space Mono', monospace;
    font-size: 1.25rem;
    /* Increase font size for p */
}

a {
    font-family: 'Space Mono', monospace;
}

/* Additional styles if needed */
</style>