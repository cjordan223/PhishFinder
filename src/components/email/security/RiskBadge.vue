<template>
    <div :class="badgeClasses">
        <span class="mr-1">{{ icon }}</span>
        {{ text }}
    </div>
</template>

<script>
export default {
    name: 'RiskBadge',
    props: {
        isFlagged: {
            type: Boolean,
            required: true
        }
    },
    computed: {
        badgeClasses() {
            return {
                'px-3 py-1 rounded-full text-sm font-medium inline-flex items-center': true,
                'bg-red-100 text-red-800': this.isFlagged,
                'bg-green-100 text-green-800': !this.isFlagged
            };
        },
        icon() {
            return this.isFlagged ? '⚠️' : '✓';
        },
        text() {
            return this.isFlagged ? 'High Risk' : 'Low Risk';
        }
    }
};
</script>