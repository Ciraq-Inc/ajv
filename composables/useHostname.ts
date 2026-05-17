// composables/useHostname.ts
export function useHostname() {
  const hostname = process.client ? window.location.hostname : ''

  // Detailed logging
  console.log('Full URL:', process.client ? window.location.href : 'server side')
  console.log('Hostname detected:', hostname)

  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1'
  const baseDomain = 'medsgh.com'

  function parseSubdomain(): string | null {
    if (isLocalhost) return null

    console.log('Parsing subdomain from:', hostname)

    if (hostname.endsWith('.vercel.app')) {
      console.log('Vercel preview deployment detected')
      return process.client
        ? new URLSearchParams(window.location.search).get('subdomain')
        : null
    }

    if (hostname.endsWith(baseDomain)) {
      const parts = hostname.split('.')
      console.log('Domain parts:', parts)

      if (parts.length > 2 && parts[0] !== 'www') {
        console.log('Subdomain detected:', parts[0])
        return parts[0] ?? null
      }
    }

    console.log('No subdomain detected')
    return null
  }

  return {
    hostname,
    isLocalhost,
    baseDomain,
    parseSubdomain,
  }
}
