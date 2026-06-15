export const createHmsIntegrationService = (api) => ({
  listKeys() {
    return api.get('/api/company/developer/keys')
  },

  createKey(keyName, expiresAt = null) {
    return api.post('/api/company/developer/keys', { key_name: keyName, expires_at: expiresAt || null })
  },

  revokeKey(keyId) {
    return api.delete(`/api/company/developer/keys/${keyId}`)
  },
})
