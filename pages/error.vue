<template>
	<div class="flex flex-col items-center justify-center min-h-screen px-4 py-12 bg-ink-50">
		<div class="text-center">
			<h1 class="text-4xl font-bold text-ink-900 mb-4">{{ error?.statusCode }}</h1>
			<p class="text-xl text-ink-600 mb-8">{{ error?.message }}</p>
			<button @click="handleError" class="px-6 py-3 bg-brand-700 text-white rounded-lg hover:bg-brand-700 transition">
				Go Back Home
			</button>
		</div>
	</div>
</template>

<script setup lang="ts">
interface NuxtError {
  statusCode?: number;
  message?: string;
  [key: string]: unknown;
}

const props = defineProps<{
  error?: NuxtError;
}>()

function handleError(): void {
  clearError({ redirect: '/' })
}
</script>