<!-- UserProfile.vue -->
<template>
	<div class="bg-white rounded-lg shadow-md overflow-hidden">
		<!-- Profile Header -->
		<div class="bg-gradient-to-r from-indigo-500 to-indigo-700 p-4">
			<div class="flex items-center">
				<div class="bg-white rounded-full p-3 shadow-md">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24"
						stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
							d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
					</svg>
				</div>
				<div class="ml-4 text-white">
					<h3 class="text-lg font-medium">{{ userStore.profile.name || 'My Account' }}</h3>
					<p class="text-indigo-100 text-sm">{{ formatPhoneNumber }}</p>
				</div>
			</div>
		</div>

		<!-- User Details Form -->
		<div class="p-4">
			<!-- Display alert for successful update -->
			<div v-if="updateSuccess" class="mb-4 bg-green-50 border-l-4 border-green-500 text-green-700 p-3">
				<div class="flex items-center">
					<svg class="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					<span>Profile updated successfully!</span>
				</div>
			</div>

			<form @submit.prevent="saveProfile">
				<div class="space-y-4">
					<!-- Name input -->
					<div>
						<label for="name" class="block text-sm font-medium text-gray-700">Full Name</label>
						<input v-model="profile.name" type="text" id="name"
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
							placeholder="Your full name">
					</div>

					<!-- Email input -->
					<div>
						<label for="email" class="block text-sm font-medium text-gray-700">Email</label>
						<input v-model="profile.email" type="email" id="email"
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
							placeholder="Your email address">
					</div>

					<!-- Address input -->
					<div>
						<label for="address" class="block text-sm font-medium text-gray-700">Delivery Address</label>
						<textarea v-model="profile.address" id="address" rows="3"
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
							placeholder="Your delivery address"></textarea>
					</div>
				</div>

				<div class="mt-6 flex items-center justify-between">
					<button type="button" @click="logout"
						class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24"
							stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
								d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
						</svg>
						Logout
					</button>

					<button type="submit" :disabled="isLoading"
						class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
						<span v-if="isLoading" class="flex items-center">
							<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
								viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
								</path>
							</svg>
							Saving...
						</span>
						<span v-else class="flex items-center">
							<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24"
								stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
							</svg>
							Save Profile
						</span>
					</button>
				</div>
			</form>
		</div>

		<!-- Order History Section -->
		<div class="border-t border-gray-200 p-4">
			<h4 class="font-medium text-gray-900 mb-3">Order History</h4>

			<div v-if="isLoadingOrders" class="text-center py-4">
				<svg class="animate-spin h-6 w-6 text-indigo-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none"
					viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
					</path>
				</svg>
				<p class="mt-2 text-sm text-gray-500">Loading your orders...</p>
			</div>

			<div v-else-if="orders.length === 0" class="text-center py-4 text-gray-500">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24"
					stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
						d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
				</svg>
				<p class="mt-2">You haven't placed any orders yet</p>
			</div>

			<div v-else class="space-y-3">
				<div v-for="order in orders" :key="order.orderId"
					class="border border-gray-200 rounded-md p-3 hover:bg-gray-50">
					<div class="flex justify-between items-start">
						<div>
							<p class="font-medium text-gray-800">Order #{{ order.orderId.substring(0, 8) }}</p>
							<p class="text-sm text-gray-500">{{ formatDate(order.createdAt) }}</p>
						</div>
						<div class="text-right">
							<span :class="[
								'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
								getStatusClasses(order.status)
							]">
								{{ formatStatus(order.status) }}
							</span>
							<p class="mt-1 text-sm font-medium text-gray-900">GHS {{ order.totalAmount.toFixed(2) }}</p>
						</div>
					</div>

					<div class="mt-2 text-sm text-gray-500">
						<p>{{ order.totalQuantity }} items ({{ order.totalItems }} products)</p>
					</div>

					<button @click="viewOrderDetails(order)"
						class="mt-2 text-sm text-indigo-600 hover:text-indigo-800 flex items-center">
						View details
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24"
							stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
						</svg>
					</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Order Details Modal -->
	<div v-if="selectedOrder" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="order-details-modal"
		role="dialog" aria-modal="true">
		<div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
			<!-- Background overlay -->
			<div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"
				@click="selectedOrder = null"></div>

			<!-- Modal panel -->
			<div
				class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
				<div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
					<div class="sm:flex sm:items-start">
						<div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
							<h3 class="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">
								Order Details
							</h3>

							<div class="border-b border-gray-200 pb-4 mb-4">
								<div class="flex justify-between text-sm">
									<span class="text-gray-500">Order ID:</span>
									<span class="font-medium">{{ selectedOrder.orderId }}</span>
								</div>
								<div class="flex justify-between text-sm mt-2">
									<span class="text-gray-500">Date:</span>
									<span>{{ formatDate(selectedOrder.createdAt) }}</span>
								</div>
								<div class="flex justify-between text-sm mt-2">
									<span class="text-gray-500">Status:</span>
									<span :class="[
										'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
										getStatusClasses(selectedOrder.status)
									]">
										{{ formatStatus(selectedOrder.status) }}
									</span>
								</div>
							</div>

							<div class="border-b border-gray-200 pb-4 mb-4">
								<h4 class="font-medium text-gray-900 mb-2">Items</h4>
								<div v-for="(item, index) in selectedOrder.items" :key="index"
									class="flex justify-between text-sm py-2">
									<div>
										<span class="font-medium">{{ item.brandName }}</span>
										<span class="text-gray-500 block text-xs">{{ item.genericName }}</span>
										<span class="text-gray-500 text-xs">{{ item.quantity }} x GHS{{
											item.price.toFixed(2) }}</span>
									</div>
									<span class="font-medium">GHS{{ item.subtotal.toFixed(2) }}</span>
								</div>

								<div class="mt-3 pt-3 border-t border-gray-200">
									<div class="flex justify-between text-sm font-medium">
										<span>Total:</span>
										<span>GHS{{ selectedOrder.totalAmount.toFixed(2) }}</span>
									</div>
								</div>
							</div>

							<div>
								<h4 class="font-medium text-gray-900 mb-2">Delivery Information</h4>
								<div class="text-sm">
									<p class="text-gray-800">{{ selectedOrder.customerInfo.name || 'No name provided' }}
									</p>
									<p class="text-gray-800">{{ selectedOrder.customerInfo.phoneNumber }}</p>
									<p class="text-gray-800">{{ selectedOrder.customerInfo.address || 'No address provided' }}</p>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
					<button type="button" @click="selectedOrder = null"
						class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
						Close
					</button>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue';
import { useUserStore } from '~/stores/user';

const userStore = useUserStore();

// State variables
const isLoading = ref(false);
const isLoadingOrders = ref(false);
const updateSuccess = ref(false);
const orders = ref([]);
const selectedOrder = ref(null);

// Initialize profile from user store data
const profile = reactive({
	name: userStore.profile.name || '',
	email: userStore.profile.email || '',
	address: userStore.profile.address || ''
});

// Format phone number for display
const formatPhoneNumber = computed(() => {
	const phoneNumber = userStore.userPhoneNumber;
	if (!phoneNumber) return '';

	// Format Ghana number with spaces
	let formatted = phoneNumber;

	if (formatted.startsWith('+233')) {
		formatted = '+233 ' + formatted.substring(4);
	}

	return formatted;
});

// Format date for display
const formatDate = (dateString) => {
	if (!dateString) return '';

	const date = new Date(dateString);
	return date.toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
};

// Format order status
const formatStatus = (status) => {
	const statusMap = {
		'pending': 'Pending',
		'processing': 'Processing',
		'shipped': 'Shipped',
		'delivered': 'Delivered',
		'cancelled': 'Cancelled'
	};

	return statusMap[status] || status;
};

// Get CSS classes for order status
const getStatusClasses = (status) => {
	const statusClasses = {
		'pending': 'bg-yellow-100 text-yellow-800',
		'processing': 'bg-blue-100 text-blue-800',
		'shipped': 'bg-indigo-100 text-indigo-800',
		'delivered': 'bg-green-100 text-green-800',
		'cancelled': 'bg-red-100 text-red-800'
	};

	return statusClasses[status] || 'bg-gray-100 text-gray-800';
};

// Save profile changes
const saveProfile = async () => {
	try {
		isLoading.value = true;

		// Update profile in user store
		await userStore.updateUserData({
			name: profile.name,
			email: profile.email,
			address: profile.address
		});

		// Show success message
		updateSuccess.value = true;

		// Hide success message after 3 seconds
		setTimeout(() => {
			updateSuccess.value = false;
		}, 3000);
	} catch (error) {
		console.error('Error saving profile:', error);
		alert('Failed to save profile. Please try again.');
	} finally {
		isLoading.value = false;
	}
};

// Fetch order history
const fetchOrderHistory = async () => {
	try {
		isLoadingOrders.value = true;
		orders.value = await userStore.getOrderHistory();
	} catch (error) {
		console.error('Error fetching order history:', error);
	} finally {
		isLoadingOrders.value = false;
	}
};

// View order details
const viewOrderDetails = (order) => {
	selectedOrder.value = order;
};

// Logout user
const logout = async () => {
	if (confirm('Are you sure you want to log out?')) {
		try {
			await userStore.logout();
			navigateTo('/');
		} catch (error) {
			console.error('Error logging out:', error);
		}
	}
};

// Fetch data on component mount
onMounted(async () => {
	if (userStore.isLoggedIn) {
		fetchOrderHistory();
	}
});
</script>