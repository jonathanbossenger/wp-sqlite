# GitHub Copilot Instructions for WP SQLite

## Project Overview

WP SQLite is a desktop application for viewing and editing SQLite databases in [WordPress Studio](https://developer.wordpress.com/studio/) installations. It's built with Electron and React, providing a user-friendly interface for database management.

WordPress Studio is a desktop application for local WordPress development. For more information, see the [Studio GitHub repository](https://github.com/Automattic/studio/).

## Technology Stack

- **Electron**: Desktop application framework (main and renderer processes)
- **React**: UI library for the renderer process
- **Tailwind CSS**: Utility-first CSS framework for styling
- **better-sqlite3**: SQLite3 bindings for Node.js
- **Webpack**: Module bundler for the renderer process
- **Electron Forge**: Build and packaging tool

## Project Structure

```
wp-sqlite/
├── main/
│   └── index.js              # Main Electron process with IPC handlers
├── renderer/
│   ├── src/
│   │   ├── App.js           # Main React component
│   │   ├── components/      # React components (DatabaseViewer, TableList, TableViewer, EditRowModal, RecentDirectories)
│   │   ├── index.js         # React entry point
│   │   └── styles.css       # Tailwind CSS styles
│   ├── index.html           # HTML template
│   └── about.html           # About window
├── scripts/
│   ├── generate-app-icons.js    # Icon generation script
│   └── generate-tray-icon.js    # Tray icon generation
├── preload.js               # Electron preload script (security bridge)
├── webpack.config.js        # Webpack configuration
└── forge.config.js          # Electron Forge configuration
```

## Architecture and Patterns

### Electron IPC Communication

The app uses Electron's IPC (Inter-Process Communication) for secure communication between main and renderer processes:

- **Main Process** (`main/index.js`): Handles IPC requests, database operations, file system access
- **Renderer Process** (`renderer/src/`): React UI that makes IPC calls via `window.electronAPI`
- **Preload Script** (`preload.js`): Exposes secure API via `contextBridge`

**Important:** Always use IPC for database operations. Never directly access SQLite from the renderer process.

### IPC Handlers

Main process handlers available:
- `select-directory`: Directory picker for WordPress Studio installation
- `get-database-info`: Database path and table count
- `get-tables`: List all tables
- `get-table-data`: Paginated table data
- `get-table-row-count`: Total row count
- `execute-query`: Custom SQL query execution
- `update-row`, `delete-row`, `insert-row`: CRUD operations
- `get-recent-directories`, `select-recent-directory`: Recent directory management

### React Component Patterns

- **Functional Components**: Use functional components with hooks
- **State Management**: Use React's `useState` and `useEffect` hooks
- **Props**: Pass data and callbacks via props
- **Event Handlers**: Prefix handler functions with `handle` (e.g., `handleEdit`, `handleDelete`)

### Database Operations

**Critical Security Rule:** All SQL queries MUST use parameterized statements to prevent SQL injection:

```javascript
// ✅ Good - Parameterized values with validated table name
// Note: Table names cannot be parameterized, so validate against a whitelist
const validTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
if (!validTables.includes(tableName)) {
  throw new Error('Invalid table name');
}
const stmt = db.prepare(`SELECT * FROM ${tableName} LIMIT ? OFFSET ?`);
const data = stmt.all(limit, offset);

// ❌ Bad - Direct concatenation of user values (SQL injection risk!)
const query = `SELECT * FROM users WHERE name = '${userName}'`;  // NEVER DO THIS
// Correct version: db.prepare('SELECT * FROM users WHERE name = ?').all(userName);
```

### WordPress Studio Database Location

The app expects the SQLite database at:
```
{wordpress-studio-directory}/wp-content/database/.ht.sqlite
```

Example paths:
- macOS: `/Users/username/Studio/my-site/wp-content/database/.ht.sqlite`
- Windows: `C:\Users\username\Studio\my-site\wp-content\database\.ht.sqlite`
- Linux: `/home/username/Studio/my-site/wp-content/database/.ht.sqlite`

## Development Workflow

### Available Commands

- `npm run dev`: Start development mode (generates icons, runs webpack watch, launches Electron)
- `npm run build`: Build for production
- `npm run generate-all`: Generate all application icons
- `npm run make`: Create platform-specific distributables
- `npm start`: Start the application without watch mode

### Development Mode

When working on the app:
1. Run `npm run dev` to start development server
2. Webpack watches for changes in renderer code
3. React components hot reload automatically
4. Main process changes require app restart

## Code Style and Conventions

### JavaScript/React

- Use ES6+ syntax (arrow functions, destructuring, template literals)
- Use `const` and `let`, avoid `var`
- Prefer functional components over class components
- Use meaningful variable and function names
- Keep components focused and single-purpose

### Naming Conventions

- **Components**: PascalCase (e.g., `DatabaseViewer`, `TableList`)
- **Files**: Match component names (e.g., `DatabaseViewer.js`)
- **Functions**: camelCase (e.g., `handleSelectDirectory`)
- **Event Handlers**: Prefix with `handle` (e.g., `handleEdit`, `handleDelete`)
- **IPC Channels**: kebab-case (e.g., `select-directory`, `get-table-data`)

### CSS/Styling

- Use Tailwind CSS utility classes
- Keep inline styles for dynamic values only
- Follow existing Tailwind patterns in components
- Use `@tailwindcss/forms` plugin for form elements

## Common Tasks

### Adding a New IPC Handler

1. Add handler in `main/index.js`:
```javascript
ipcMain.handle('my-handler', async (event, arg) => {
  // Implementation
  return result;
});
```

2. Expose in `preload.js`:
```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  myFunction: (arg) => ipcRenderer.invoke('my-handler', arg)
});
```

3. Call from React:
```javascript
const result = await window.electronAPI.myFunction(arg);
```

### Adding a New Component

1. Create component file in `renderer/src/components/`
2. Use functional component with hooks
3. Import and use Tailwind classes for styling
4. Export as default
5. Import in parent component

### Modifying Database Queries

- Always use parameterized statements
- Test with WordPress Studio database
- Handle errors gracefully
- Consider pagination for large result sets

## Testing

### Manual Testing

1. Create test WordPress Studio directory structure:

**macOS/Linux:**
```bash
mkdir -p ~/test-wp-studio/wp-content/database
```

**Windows (PowerShell):**
```powershell
New-Item -ItemType Directory -Path "$env:USERPROFILE\test-wp-studio\wp-content\database" -Force
```

2. Use the app to open and test functionality
3. Test CRUD operations (Create, Read, Update, Delete)
4. Test pagination with large datasets
5. Test error handling with invalid directories

**Note:** This project does not currently have automated tests. When adding code, ensure manual testing covers:
- Directory selection and validation
- Table listing
- Data viewing with pagination
- Row editing and deletion
- Error states and edge cases

## Security Considerations

### Critical Security Rules

1. **SQL Injection Prevention**: ALWAYS use parameterized statements, NEVER concatenate user input into SQL queries
2. **Directory Validation**: Only allow selection of valid WordPress Studio directories with expected structure
3. **Read-only Primary Keys**: Primary key fields must not be editable to prevent data corruption
4. **Secure IPC**: Use `contextBridge` to expose limited API surface to renderer
5. **No Remote Code Execution**: All SQL executes locally, no network requests

### When Adding Features

- Validate all user input
- Use parameterized SQL queries
- Sanitize file paths
- Handle errors without exposing sensitive information
- Follow Electron security best practices

## Platform-Specific Considerations

### Cross-Platform Support

The app supports macOS, Windows, and Linux:
- Use `path.join()` for file paths (not string concatenation)
- Test on target platforms when possible
- Use Electron Forge platform-specific configurations in `forge.config.js`

### Icons and Assets

- Application icons generated from `assets/icons/icon.png`
- Tray icon at `assets/tray-icon.png`
- Run `npm run generate-all` after changing source icons

## Dependencies

### Core Dependencies

- `better-sqlite3`: Direct SQLite access (main process only)
- `electron-store`: Persistent storage for recent directories
- `react` and `react-dom`: UI framework
- `tailwindcss`: Styling

### Development Dependencies

- `webpack` and loaders: Bundling
- `electron-forge`: Building and packaging
- `sharp`: Icon processing

### Adding New Dependencies

1. Install via npm: `npm install package-name`
2. Import where needed
3. Ensure compatibility with Electron
4. Test build and packaging still work

## Common Pitfalls to Avoid

1. **Don't** access SQLite directly from renderer process
2. **Don't** use string concatenation for SQL queries
3. **Don't** forget to handle errors in IPC handlers
4. **Don't** block the main process with long-running operations
5. **Don't** modify primary keys when editing rows
6. **Don't** forget to validate directory structure before accessing database
7. **Don't** use synchronous file system operations in the main process unnecessarily

## Helpful Context

- The app is specifically designed for WordPress Studio SQLite databases
- WordPress Studio uses `.ht.sqlite` as the database filename
- Database path: `wp-content/database/.ht.sqlite` relative to Studio installation
- The app stores recent directories using `electron-store` for quick access
- System tray integration allows running in background

## Future Enhancement Areas

When considering new features, these areas have been identified for potential enhancement:
- Export/import functionality (CSV/JSON)
- SQL query console
- Table schema editor
- Database backup/restore
- Dark mode theme
- Keyboard shortcuts
- Undo/Redo for data changes
