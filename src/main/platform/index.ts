import type { IPlatform } from './IPlatform'
import { WindowsPlatform } from './windows'

let instance: IPlatform | null = null

/**
 * Returns the platform implementation for the current OS.
 * Currently only Windows is supported. Future Mac/Linux implementations
 * would be selected here based on process.platform.
 */
export function getPlatform(): IPlatform {
  if (!instance) {
    if (process.platform !== 'win32') {
      throw new Error(`Unsupported platform: ${process.platform}. DeskFlow currently supports Windows only.`)
    }
    instance = new WindowsPlatform()
  }
  return instance
}

export type { IPlatform }
