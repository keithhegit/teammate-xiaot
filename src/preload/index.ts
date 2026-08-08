import { contextBridge, ipcRenderer } from 'electron'

import { IPC_CHANNELS, type MonsterApi } from '../shared/api'

const api: MonsterApi = {
  getSession: () => ipcRenderer.invoke(IPC_CHANNELS.getSession),
  trashTarget: () => ipcRenderer.invoke(IPC_CHANNELS.trashTarget),
  closeOverlay: () => ipcRenderer.send(IPC_CHANNELS.closeOverlay)
}

contextBridge.exposeInMainWorld('monsterApi', api)

