import type { IpcChannelMap, IpcEventMap } from '@shared/ipc-channels'

/**
 * Shape of the api object exposed by the preload script via contextBridge.
 * Components never import from 'electron' — they use window.api exclusively.
 */
interface ElectronApi {
  invoke<C extends keyof IpcChannelMap>(
    channel: C,
    payload?: IpcChannelMap[C]['req'],
  ): Promise<IpcChannelMap[C]['res']>

  on<C extends keyof IpcEventMap>(
    channel: C,
    listener: (data: IpcEventMap[C]) => void,
  ): void

  off<C extends keyof IpcEventMap>(
    channel: C,
    listener: (data: IpcEventMap[C]) => void,
  ): void
}

declare global {
  interface Window {
    api: ElectronApi
  }
}

export {}
