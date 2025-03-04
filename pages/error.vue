<template>
	<div class="flex flex-col items-center justify-center min-h-screen px-4 py-12 bg-gray-50">
		<div class="text-center">
			<h1 class="text-4xl font-bold text-gray-800 mb-4">{{ error.statusCode }}</h1>
			<p class="text-xl text-gray-600 mb-8">{{ error.message }}</p>
			<button @click="handleError" class="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
				Go Back Home
			</button>
		</div>
	</div>
</template>

<script setup>
const props = defineProps({
	error: Object
})

function handleError() {
	clearError({ redirect: '/' })
}
</script>