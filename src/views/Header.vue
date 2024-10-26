<template>
    <header class="bg-blue-500">
        <div class="flex items-center justify-between p-6 max-w-7xl mx-auto">
            <!-- Logo and Text Section -->
            <div class="flex items-center">
                <!-- Enlarged Logo Image -->
                <img class="h-20 w-auto mr-4" src="/public/images/phishfinderlogo.png" alt="PhishFinder Logo" />
                <!-- Title and Tagline -->
                <div class="text-white">
                    <h1 class="text-2xl font-bold">Phish Finder</h1>
                    <p class="text-sm">Stay Safe, Stay Aware</p>
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
/* Additional styles if needed */
</style>