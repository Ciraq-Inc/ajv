<template>
  <ConfirmDialog
    :is-open="pending !== null"
    :title="pending?.title"
    :message="pending?.message"
    :confirm-text="pending?.confirmText"
    cancel-text="Cancel"
    variant="danger"
    @confirm="$emit('accept')"
    @close="$emit('cancel')"
  />
</template>

<script setup lang="ts">
import ConfirmDialog from '~/components/ConfirmDialog.vue'
import type { ConfirmRequest } from '~/composables/useConfirmAction'

defineProps<{ pending: ConfirmRequest | null }>()
defineEmits<{ accept: []; cancel: [] }>()
</script>
