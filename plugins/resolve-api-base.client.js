export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const configuredApiBase = config.public?.apiBase

  if (!process.client || !configuredApiBase) return

  const currentHost = window.location.hostname
  const currentProtocol = window.location.protocol || 'http:'
  const localHosts = new Set(['localhost', '127.0.0.1', '0.0.0.0'])

  if (!currentHost || localHosts.has(currentHost)) return

  try {
    const parsedApiBase = new URL(configuredApiBase)

    if (!localHosts.has(parsedApiBase.hostname)) return

    parsedApiBase.hostname = currentHost
    parsedApiBase.protocol = currentProtocol

    config.public.apiBase = parsedApiBase.toString().replace(/\/$/, '')
  } catch (error) {
    console.warn('Unable to resolve LAN API base from configured value:', configuredApiBase, error)
  }
})
