import { installPageZoomGuard } from '~/utils/pageZoomGuard'

export default defineNuxtPlugin(() => {
  installPageZoomGuard(document)
})
