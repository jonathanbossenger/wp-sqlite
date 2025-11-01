const { contextBridge, ipcRenderer, shell } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  getDatabaseInfo: (directory) => ipcRenderer.invoke('get-database-info', directory),
  getTables: (directory) => ipcRenderer.invoke('get-tables', directory),
  getTableData: (directory, tableName, offset, limit) => ipcRenderer.invoke('get-table-data', directory, tableName, offset, limit),
  getTableRowCount: (directory, tableName) => ipcRenderer.invoke('get-table-row-count', directory, tableName),
  executeQuery: (directory, query) => ipcRenderer.invoke('execute-query', directory, query),
  updateRow: (directory, tableName, rowId, data) => ipcRenderer.invoke('update-row', directory, tableName, rowId, data),
  deleteRow: (directory, tableName, rowId) => ipcRenderer.invoke('delete-row', directory, tableName, rowId),
  insertRow: (directory, tableName, data) => ipcRenderer.invoke('insert-row', directory, tableName, data),
  quitApp: () => ipcRenderer.invoke('quit-app'),
  getRecentDirectories: () => ipcRenderer.invoke('get-recent-directories'),
  selectRecentDirectory: (directory) => ipcRenderer.invoke('select-recent-directory', directory),
  openExternal: (url) => shell.openExternal(url)
});
