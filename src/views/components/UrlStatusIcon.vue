<template>
    <div class="inline-flex items-center">
        <span :class="iconClasses" :title="statusText">
            {{ icon }}
        </span>
    </div>
</template>

<script>
export default {
    name: 'UrlStatusIcon',
    props: {
        status: {
            type: String,
            required: true,
            validator: value => ['safe', 'suspicious', 'unknown'].includes(value)
        }
    },
    computed: {
        iconClasses() {
            return {
                'w-5 h-5 flex items-center justify-center rounded-full': true,
                'text-green-500': this.status === 'safe',
                'text-red-500': this.status === 'suspicious',
                'text-gray-500': this.status === 'unknown'
            };
        },
        icon() {
            switch (this.status) {
                case 'safe': return '✓';
                case 'suspicious': return '⚠️';
                default: return '?';
            }
        },
        statusText() {
            switch (this.status) {
                case 'safe': return 'Safe URL';
                case 'suspicious': return 'Suspicious URL';
                default: return 'Unknown Status';
            }
        }
    }
};
</script>