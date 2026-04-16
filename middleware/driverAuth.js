export default defineNuxtRouteMiddleware((to, from) => {
    if (process.client) {
        const token = localStorage.getItem('driver_token')
        if (!token && to.path !== '/driver/login') {
            return navigateTo('/driver/login')
        }
    }
})
