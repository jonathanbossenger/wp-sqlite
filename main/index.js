const { app, BrowserWindow, ipcMain, dialog, Notification, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

let mainWindow = null;
let store = null;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Initialize electron store
const initStore = async () => {
  const { default: Store } = await import('electron-store');
  store = new Store({
    defaults: {
      recentDirectories: []
    }
  });
};

// Function to add a directory to recent list
const addToRecentDirectories = (directory) => {
  if (!store) return [];
  const recentDirectories = store.get('recentDirectories', []);
  const filteredDirectories = recentDirectories.filter(dir => dir !== directory);
  filteredDirectories.unshift(directory);
  const updatedDirectories = filteredDirectories.slice(0, 5);
  store.set('recentDirectories', updatedDirectories);
  return updatedDirectories;
};

// Function to check if directory is a WordPress Studio installation
const isWordPressStudioDirectory = async (directory) => {
  try {
    const dbPath = path.join(directory, 'wp-content', 'database', '.ht.sqlite');
    await fs.promises.access(dbPath);
    return true;
  } catch (error) {
    return false;
  }
};

// Function to get SQLite database path
const getDatabasePath = (directory) => {
  return path.join(directory, 'wp-content', 'database', '.ht.sqlite');
};

// Function to filter out hidden tables (those starting with underscore)
const filterHiddenTables = (tables) => {
  return tables.filter(t => !t.name.startsWith('_'));
};

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    title: 'WP SQLite',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, '..', 'preload.js'),
    },
  });

  // Load the index.html file.
  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  // Open the DevTools in development.
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
};

const createMenu = () => {
  const template = [
    {
      label: 'WP SQLite',
      submenu: [
        {
          label: 'About WP SQLite',
          click: () => {
            const aboutWindow = new BrowserWindow({
              width: 300,
              height: 340,
              title: 'About WP SQLite',
              resizable: false,
              minimizable: false,
              maximizable: false,
              fullscreenable: false,
              webPreferences: {
                nodeIntegration: true,
                contextIsolation: true,
                preload: path.join(__dirname, '..', 'preload.js'),
              }
            });

            aboutWindow.loadFile(path.join(__dirname, '..', 'renderer', 'about.html'));
            
            // Open dev tools immediately in development mode
            if (process.env.NODE_ENV === 'development') {
              aboutWindow.webContents.openDevTools({ mode: 'detach' });
            }

            aboutWindow.once('ready-to-show', () => {
              aboutWindow.show();
            });
          }
        },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { 
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Command+Q' : 'Alt+F4',
          click: async () => {
            app.isQuitting = true;
            app.quit();
          }
        }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
};

// Handle directory selection
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: 'Select WordPress Studio Installation Directory',
  });
  
  if (!result.canceled) {
    const directory = result.filePaths[0];
    // Verify it's a WordPress Studio directory
    if (await isWordPressStudioDirectory(directory)) {
      addToRecentDirectories(directory);
      return directory;
    } else {
      throw new Error('Selected directory is not a WordPress Studio installation (no .ht.sqlite database found)');
    }
  }
  return null;
});

// Get recent directories
ipcMain.handle('get-recent-directories', async () => {
  if (!store) return [];
  return store.get('recentDirectories', []);
});

// Handle selecting a recent directory
ipcMain.handle('select-recent-directory', async (event, directory) => {
  if (await isWordPressStudioDirectory(directory)) {
    addToRecentDirectories(directory);
    return directory;
  } else {
    if (store) {
      const recentDirectories = store.get('recentDirectories', []);
      const filteredDirectories = recentDirectories.filter(dir => dir !== directory);
      store.set('recentDirectories', filteredDirectories);
    }
    throw new Error('Selected directory is no longer a valid WordPress Studio installation');
  }
});

// Get database info
ipcMain.handle('get-database-info', async (event, wpDirectory) => {
  const dbPath = getDatabasePath(wpDirectory);
  try {
    const db = new Database(dbPath, { readonly: true });
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
    const visibleTables = filterHiddenTables(tables);
    db.close();
    return {
      path: dbPath,
      tableCount: visibleTables.length
    };
  } catch (error) {
    console.error('Error getting database info:', error);
    throw error;
  }
});

// Get list of tables
ipcMain.handle('get-tables', async (event, wpDirectory) => {
  const dbPath = getDatabasePath(wpDirectory);
  try {
    const db = new Database(dbPath, { readonly: true });
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
    db.close();
    const visibleTables = filterHiddenTables(tables);
    return visibleTables.map(t => t.name);
  } catch (error) {
    console.error('Error getting tables:', error);
    throw error;
  }
});

// Get table data with pagination
ipcMain.handle('get-table-data', async (event, wpDirectory, tableName, offset = 0, limit = 50) => {
  const dbPath = getDatabasePath(wpDirectory);
  try {
    const db = new Database(dbPath, { readonly: true });
    
    // Get table schema
    const schema = db.prepare(`PRAGMA table_info(${tableName})`).all();
    
    // Get data
    const data = db.prepare(`SELECT * FROM ${tableName} LIMIT ? OFFSET ?`).all(limit, offset);
    
    db.close();
    
    return {
      schema: schema,
      data: data,
      columns: schema.map(col => col.name)
    };
  } catch (error) {
    console.error('Error getting table data:', error);
    throw error;
  }
});

// Get table row count
ipcMain.handle('get-table-row-count', async (event, wpDirectory, tableName) => {
  const dbPath = getDatabasePath(wpDirectory);
  try {
    const db = new Database(dbPath, { readonly: true });
    const result = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
    db.close();
    return result.count;
  } catch (error) {
    console.error('Error getting row count:', error);
    throw error;
  }
});

// Execute custom query
ipcMain.handle('execute-query', async (event, wpDirectory, query) => {
  const dbPath = getDatabasePath(wpDirectory);
  try {
    const db = new Database(dbPath);
    let result;
    
    // Check if it's a SELECT query
    if (query.trim().toUpperCase().startsWith('SELECT')) {
      result = db.prepare(query).all();
    } else {
      const stmt = db.prepare(query);
      result = stmt.run();
    }
    
    db.close();
    return result;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
});

// Update row
ipcMain.handle('update-row', async (event, wpDirectory, tableName, rowId, data) => {
  const dbPath = getDatabasePath(wpDirectory);
  try {
    const db = new Database(dbPath);
    
    // Get primary key column
    const schema = db.prepare(`PRAGMA table_info(${tableName})`).all();
    const pkColumn = schema.find(col => col.pk === 1);
    
    if (!pkColumn) {
      throw new Error('Table has no primary key');
    }
    
    // Build UPDATE query
    const columns = Object.keys(data);
    const setClause = columns.map(col => `${col} = ?`).join(', ');
    const values = columns.map(col => data[col]);
    
    const stmt = db.prepare(`UPDATE ${tableName} SET ${setClause} WHERE ${pkColumn.name} = ?`);
    const result = stmt.run(...values, rowId);
    
    db.close();
    return result;
  } catch (error) {
    console.error('Error updating row:', error);
    throw error;
  }
});

// Delete row
ipcMain.handle('delete-row', async (event, wpDirectory, tableName, rowId) => {
  const dbPath = getDatabasePath(wpDirectory);
  try {
    const db = new Database(dbPath);
    
    // Get primary key column
    const schema = db.prepare(`PRAGMA table_info(${tableName})`).all();
    const pkColumn = schema.find(col => col.pk === 1);
    
    if (!pkColumn) {
      throw new Error('Table has no primary key');
    }
    
    const stmt = db.prepare(`DELETE FROM ${tableName} WHERE ${pkColumn.name} = ?`);
    const result = stmt.run(rowId);
    
    db.close();
    return result;
  } catch (error) {
    console.error('Error deleting row:', error);
    throw error;
  }
});

// Insert row
ipcMain.handle('insert-row', async (event, wpDirectory, tableName, data) => {
  const dbPath = getDatabasePath(wpDirectory);
  try {
    const db = new Database(dbPath);
    
    // Build INSERT query
    const columns = Object.keys(data);
    const placeholders = columns.map(() => '?').join(', ');
    const values = columns.map(col => data[col]);
    
    const stmt = db.prepare(`INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`);
    const result = stmt.run(...values);
    
    db.close();
    return result;
  } catch (error) {
    console.error('Error inserting row:', error);
    throw error;
  }
});

// Handle quitting the app
ipcMain.handle('quit-app', async () => {
  app.isQuitting = true;
  app.quit();
});

app.whenReady().then(async () => {
  await initStore();
  createMenu();
  createWindow();

  // Handle dock icon clicks
  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // Handle macOS dock menu
  if (process.platform === 'darwin' && app.dock) {
    const dockMenu = Menu.buildFromTemplate([
      {
        label: 'Show Window',
        click() {
          if (mainWindow === null) {
            createWindow();
          } else {
            mainWindow.show();
            mainWindow.focus();
          }
        }
      }
    ]);
    app.dock.setMenu(dockMenu);
  }
});

app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
