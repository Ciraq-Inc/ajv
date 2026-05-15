<!-- layouts/default.vue -->
<template>
    <div>
      <!-- WCAG 2.4.1 Bypass Blocks: keyboard skip-link, visible on focus -->
      <a href="#main-content" class="skip-link">Skip to main content</a>
      <Navbar />
      <main id="main-content" tabindex="-1">
        <slot />
      </main>
    </div>
  </template>
