# Development Guide

This guide provides information for developers working on the WP SQLite application.

## Project Structure

```
wp-sqlite/
├── main/
│   └── index.js              # Main Electron process
├── renderer/
│   ├── src/
│   │   ├── App.js           # Main React component
│   │   ├── components/      # React components
│   │   │   ├── DatabaseViewer.js
│   │   │   ├── EditRowModal.js
│   │   │   ├── RecentDirectories.js
│   │   │   ├── TableList.js
│   │   │   └── TableViewer.js
│   │   ├── index.js         # React entry point
│   │   └── styles.css       # Tailwind CSS
│   ├── index.html           # HTML template
│   └── about.html           # About window
├── scripts/
│   ├── generate-app-icons.js
│   └── generate-tray-icon.js
├── assets/
│   ├── icons/               # Application icons for all platforms
│   └── tray-icon.png        # System tray icon
├── preload.js               # Electron preload script
├── webpack.config.js        # Webpack configuration
├── forge.config.js          # Electron Forge configuration
└── package.json             # Dependencies and scripts
```

## Key Technologies

- **Electron**: Desktop application framework
- **React**: UI library
- **Tailwind CSS**: Utility-first CSS framework
- **better-sqlite3**: SQLite3 bindings for Node.js
- **Webpack**: Module bundler
- **Electron Forge**: Build and packaging tool

## IPC Communication

The app uses Electron's IPC (Inter-Process Communication) to securely communicate between the main and renderer processes:

### Main Process Handlers

- `select-directory`: Opens directory picker and validates WordPress Studio installation
- `get-database-info`: Returns database path and table count
- `get-tables`: Returns list of all tables in the database
- `get-table-data`: Returns paginated table data
- `get-table-row-count`: Returns total row count for a table
- `execute-query`: Executes a custom SQL query
- `update-row`: Updates a row in a table
- `delete-row`: Deletes a row from a table
- `insert-row`: Inserts a new row into a table
- `get-recent-directories`: Returns list of recently used directories
- `select-recent-directory`: Validates and selects a recent directory
- `quit-app`: Quits the application

### Renderer API (exposed via preload.js)

```javascript
window.electronAPI.selectDirectory()
window.electronAPI.getDatabaseInfo(directory)
window.electronAPI.getTables(directory)
window.electronAPI.getTableData(directory, tableName, offset, limit)
window.electronAPI.getTableRowCount(directory, tableName)
window.electronAPI.executeQuery(directory, query)
window.electronAPI.updateRow(directory, tableName, rowId, data)
window.electronAPI.deleteRow(directory, tableName, rowId)
window.electronAPI.insertRow(directory, tableName, data)
window.electronAPI.quitApp()
window.electronAPI.getRecentDirectories()
window.electronAPI.selectRecentDirectory(directory)
window.electronAPI.openExternal(url)
```

## Database Operations

### WordPress Studio Database Location

The app looks for the SQLite database at:
```
<wordpress-studio-directory>/wp-content/database/.ht.sqlite
```

### SQL Queries

All SQL queries use parameterized statements to prevent SQL injection:

```javascript
// Example: Get table data with pagination
const stmt = db.prepare('SELECT * FROM ? LIMIT ? OFFSET ?');
const data = stmt.all(tableName, limit, offset);

// Example: Update row
const stmt = db.prepare('UPDATE ? SET ? = ? WHERE ? = ?');
stmt.run(tableName, column, value, pkColumn, rowId);
```

## Development Workflow

### Starting Development Mode

```bash
npm run dev
```

This will:
1. Generate all icons
2. Start Webpack in watch mode
3. Launch Electron with hot reloading

### Building for Production

```bash
npm run build
```

This compiles the renderer process with Webpack in production mode.

### Creating Distributables

```bash
npm run make
```

This creates platform-specific installers in the `out/make` directory.

## Component Architecture

### App.js

Main application component that handles:
- Directory selection
- Error handling
- State management for selected directory

### DatabaseViewer.js

Displays:
- Selected directory path
- Database information
- Table list (via TableList component)
- Table viewer (via TableViewer component)

### TableList.js

Displays list of all tables in the database with selection functionality.

### TableViewer.js

Displays:
- Table data with pagination
- Search/filter functionality
- Edit and Delete buttons
- Pagination controls

### EditRowModal.js

Modal dialog for editing row data:
- Displays all columns
- Read-only primary key fields
- Auto-detects input types based on column type
- Saves only changed fields

## Testing

### Manual Testing

1. Create a test WordPress Studio installation:
```bash
mkdir -p /tmp/test-wp-studio/wp-content/database
```

2. Create a test database:
```javascript
const Database = require('better-sqlite3');
const db = new Database('/tmp/test-wp-studio/wp-content/database/.ht.sqlite');

db.exec(`
  CREATE TABLE wp_users (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    user_login TEXT NOT NULL,
    user_email TEXT NOT NULL
  )
`);

db.prepare('INSERT INTO wp_users (user_login, user_email) VALUES (?, ?)').run('admin', 'admin@example.com');
db.close();
```

3. Launch the app and select the test directory

### Automated Testing

Basic database operations can be tested with:

```javascript
const Database = require('better-sqlite3');
const db = new Database('/tmp/test-wp-studio/wp-content/database/.ht.sqlite');

// Test table listing
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables);

// Test data retrieval
const data = db.prepare('SELECT * FROM wp_users LIMIT 10').all();
console.log('Data:', data);

db.close();
```

## Security Considerations

1. **SQL Injection Prevention**: All queries use parameterized statements
2. **Directory Validation**: Only allows selection of valid WordPress Studio directories
3. **Read-only Primary Keys**: Primary key fields cannot be edited
4. **Secure IPC**: Uses contextBridge for secure communication
5. **No Remote Code Execution**: All SQL is executed locally

## Future Enhancements

Potential features for future versions:

- [ ] Export table data to CSV/JSON
- [ ] Import data from CSV/JSON
- [ ] SQL query builder/console
- [ ] Table schema editor
- [ ] Database backup/restore
- [ ] Multiple database support
- [ ] Advanced search with regex
- [ ] Dark mode theme
- [ ] Keyboard shortcuts
- [ ] Undo/Redo for data changes

## Troubleshooting

### Icons not generating

Run the icon generation scripts manually:
```bash
npm run generate-all
```

### Build fails

Clean and reinstall dependencies:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Database not found

Ensure the WordPress Studio installation has the correct structure:
```
wordpress-studio/
└── wp-content/
    └── database/
        └── .ht.sqlite
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

GPL-2.0-or-later
