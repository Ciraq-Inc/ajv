import { readMultipartFormData, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const apiBase = config.public?.apiBase

  if (!apiBase) {
    throw createError({ statusCode: 500, statusMessage: 'API base URL is not configured' })
  }

  const parts = await readMultipartFormData(event)

  if (!parts || parts.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No file received' })
  }

  const filePart = parts[0]

  if (!filePart.filename || !filePart.data) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid upload: missing filename or data' })
  }

  const formData = new FormData()
  const bytes = new Uint8Array(filePart.data)
  const blob = new Blob([bytes], { type: filePart.type || 'application/octet-stream' })
  formData.append('file', blob, filePart.filename)

  const response = await fetch(`${apiBase}/api/jobs/upload-document`, {
    method: 'POST',
    body: formData,
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok || !payload?.success) {
    throw createError({
      statusCode: response.status || 500,
      statusMessage: payload?.message || 'Upload failed',
    })
  }

  return {
    success: true,
    url: payload.url,
  }
})
