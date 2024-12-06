<template>
  <a-page-header
    :title="title"
    :subtitle="subtitle"
    :show-back="showBack">
    <template #extra>
      <slot id="extra"></slot>
    </template>
  </a-page-header>
</template>
<script setup>
  defineProps({
    title: {
      type: String,
      default: '',
    },
    subtitle: {
      type: String,
      default: '',
    },
    showBack: {
      type: Boolean,
      default: false,
    },
  })
</script>
