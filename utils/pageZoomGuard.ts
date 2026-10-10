const GESTURE_EVENTS = ['gesturestart', 'gesturechange', 'gestureend'] as const

// iOS Safari ignores user-scalable=no for pinch zoom (an accessibility override), but still
// fires these proprietary events first; cancelling them stops the page zooming.
export const installPageZoomGuard = (doc: Document): void => {
  for (const type of GESTURE_EVENTS) {
    doc.addEventListener(type, (event) => event.preventDefault(), { passive: false })
  }
}
