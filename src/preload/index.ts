import { contextBridge, ipcRenderer } from 'electron'
import type { IpcChannelMap, IpcEventMap } from '@shared/ipc-channels'

// Derives the correct listener type directly from ipcRenderer.on — no explicit any needed
type IpcListener = Parameters<typeof ipcRenderer.on>[1]

// Registry maps each original listener → its wrapped counterpart for clean removal
const registry = new Map<(data: unknown) => void, IpcListener>()

function invoke<C extends keyof IpcChannelMap>(
  channel: C,
  payload?: IpcChannelMap[C]['req'],
): Promise<IpcChannelMap[C]['res']> {
  return ipcRenderer.invoke(channel as string, payload) as Promise<IpcChannelMap[C]['res']>
}

function on<C extends keyof IpcEventMap>(
  channel: C,
  listener: (data: IpcEventMap[C]) => void,
): void {
  const wrapped: IpcListener = (_event, data) => listener(data as IpcEventMap[C])
  registry.set(listener as unknown as (data: unknown) => void, wrapped)
  ipcRenderer.on(channel as string, wrapped)
}

function off<C extends keyof IpcEventMap>(
  channel: C,
  listener: (data: IpcEventMap[C]) => void,
): void {
  const wrapped = registry.get(listener as unknown as (data: unknown) => void)
  if (wrapped) {
    ipcRenderer.removeListener(channel as string, wrapped)
    registry.delete(listener as unknown as (data: unknown) => void)
  }
}

const api = { invoke, on, off }

contextBridge.exposeInMainWorld('api', api)
