let cameraCaptureFn: (() => Promise<string | null>) | null = null

/**
 * Register a global camera frame capture function provided by the UI camera component.
 * The function should return a single-frame data URL (e.g. "data:image/jpeg;base64,...").
 */
export function registerCameraCapture(fn: () => Promise<string | null>) {
  cameraCaptureFn = fn
}

/**
 * Unregister the currently active camera capture function.
 */
export function unregisterCameraCapture(fn: () => Promise<string | null>) {
  if (cameraCaptureFn === fn) {
    cameraCaptureFn = null
  }
}

/**
 * Capture a single frame from the active camera, if available.
 * Returns a data URL string or null if no camera is registered/ready.
 */
export async function captureCurrentCameraFrame(): Promise<string | null> {
  if (!cameraCaptureFn) return null
  try {
    return await cameraCaptureFn()
  } catch {
    return null
  }
}

