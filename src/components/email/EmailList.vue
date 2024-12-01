<template>
  <TransitionGroup
    name="email-list"
    tag="div"
    class="flex flex-col"
  >
    <EmailListItem
      v-for="email in emails"
      :key="email.id"
      :email="email"
      @click="$emit('open', email)"
    />
  </TransitionGroup>
</template>

<script setup>
import EmailListItem from './EmailListItem.vue';

const props = defineProps({
    emails: {
        type: Array,
        required: true
    }
});

const emit = defineEmits(['open']);
</script>

<style scoped>
.email-list-move {
  transition: transform 0.5s ease;
}

.email-list-enter-active,
.email-list-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.email-list-enter-from,
.email-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.email-list-leave-active {
  position: absolute;
}
</style>