// composables/useHostname.js
export function useHostname() {
    const nuxtApp = useNuxtApp()
    let hostname = ''
    
    if (import.meta.server) {
      // Server-side
      const reqHeaders = useRequestHeaders(['host'])
      hostname = reqHeaders.host
    } else {
      // Client-side
      hostname = window.location.hostname
    }
    
    return {
      hostname,
      isLocalhost: hostname.includes('localhost') || hostname.includes('127.0.0.1')
    }
  }