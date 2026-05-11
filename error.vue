<template>
  <div class="min-h-screen bg-[#fff7ff] flex flex-col items-center justify-center px-6 py-16 font-primary">

    <!-- Brand -->
    <a href="/" class="flex items-center gap-2.5 mb-12">
      <img src="/brand/rig-mark.svg" alt="MedsGH" class="h-8 w-8" />
    </a>

    <!-- Illustration -->
    <div class="relative mb-8 select-none" aria-hidden="true">
      <div class="w-36 h-36 rounded-full bg-[#f3e8ff] flex items-center justify-center mx-auto">
        <component :is="is404 ? MagnifyingGlassIcon : ExclamationCircleIcon" class="w-[72px] h-[72px] text-[#520094]" />
      </div>
      <div class="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#ead6fd] flex items-center justify-center">
        <BeakerIcon class="w-4 h-4 text-[#9b5fc9]" />
      </div>
    </div>

    <!-- Error code -->
    <p class="text-[#cbb5e1] text-sm font-semibold tracking-widest uppercase mb-2">
      Error {{ error.statusCode }}
    </p>

    <!-- Heading -->
    <h1 class="text-3xl sm:text-4xl font-bold text-[#1e1a22] text-center mb-3">
      {{ is404 ? 'Page not found' : 'Something went wrong' }}
    </h1>

    <!-- Subtext -->
    <p class="text-[#4c4453] text-base text-center max-w-sm leading-relaxed mb-10">
      {{ is404
        ? "We couldn't find the page you're looking for. It may have moved or no longer exists."
        : error.message || 'An unexpected error occurred. Please try again.' }}
    </p>

    <!-- Actions -->
    <div class="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-none sm:w-auto">
      <button
        @click="handleError"
        class="flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#520094] hover:bg-[#6c24b3] text-white font-semibold text-sm shadow-lg shadow-[#520094]/30 transition-all active:scale-95"
      >
        <HomeIcon class="w-[18px] h-[18px]" />
        Back to home
      </button>
      <button
        @click="$router.back()"
        class="flex items-center justify-center gap-2 px-7 py-3.5 rounded-full border border-[#ead6fd] text-[#520094] font-semibold text-sm hover:bg-[#f3e8ff] transition-all active:scale-95"
      >
        <ArrowLeftIcon class="w-[18px] h-[18px]" />
        Go back
      </button>
    </div>

  </div>
</template>

<script setup>
import {
  MagnifyingGlassIcon,
  ExclamationCircleIcon,
  BeakerIcon,
  HomeIcon,
  ArrowLeftIcon,
} from '@heroicons/vue/24/outline'

const props = defineProps({
  error: Object
})

const is404 = computed(() => props.error?.statusCode === 404)

function handleError() {
  clearError({ redirect: '/' })
}
</script>
