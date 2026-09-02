<script setup lang="ts">
import { ConfigProvider } from 'radix-vue'
</script>

<template>
  <!--
    The pharmacy shell scrolls inside `.page-content`, not on the document.
    Radix's default scrollbar compensation therefore only shrinks the page
    behind a dialog. Keep the scroll lock, but never add that extra padding.
  -->
  <ConfigProvider :scroll-body="false">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </ConfigProvider>
</template>
