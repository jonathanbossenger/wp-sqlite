# WP SQLite

<img src="https://github.com/jonathanbossenger/wp-sqlite/blob/main/assets/icons/icon.png" width="48">

A desktop application for viewing and editing SQLite databases in [WordPress Studio](https://developer.wordpress.com/studio/) installations. Built with Electron and React.

## Table of Contents
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Building Executables](#building-executables)
- [Usage](#usage)
- [Technical Stack](#technical-stack)
- [License](#license)

## Features

- WordPress Studio Integration
  - Automatic detection of WordPress Studio installations
  - Finds SQLite database in wp-content/database/.ht.sqlite
  - Recent directories support for quick access
- Database Viewing
  - View all tables in the database
  - Browse table data with pagination (50 rows per page)
  - View table schema with primary key indicators
  - Search/filter within table data
- Data Editing
  - Edit existing rows with modal editor
  - Delete rows (with confirmation)
  - Automatic data type detection
  - Primary key protection
- Clean, modern UI with real-time updates
- System tray integration
- Cross-platform support (macOS, Windows, Linux)

## Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- A [WordPress Studio](https://developer.wordpress.com/studio/) installation for testing ([GitHub](https://github.com/Automattic/studio/))

## Development Setup

1. Clone the repository:
```bash
git clone https://github.com/jonathanbossenger/wp-sqlite.git
cd wp-sqlite
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

This will:
- Generate application icons
- Start webpack in watch mode for the renderer process
- Launch Electron in development mode
- Enable hot reloading for React components

## Building Executables

The project uses Electron Forge for building platform-specific executables.

### Build for all platforms:
```bash
npm run make
```

This will create executables in the `out/make` directory for:
- macOS (.dmg)
- Windows (.exe)
- Linux (.deb, .rpm)

### Platform-specific builds:

For macOS:
```bash
npm run make -- --platform=darwin
```

For Windows:
```bash
npm run make -- --platform=win32
```

For Linux:
```bash
npm run make -- --platform=linux
```

## Usage

1. Launch the application
2. Select your WordPress Studio installation directory
3. The app will automatically:
   - Detect the SQLite database at wp-content/database/.ht.sqlite
   - Load the list of tables
4. Select a table to view its data
5. Use pagination controls to navigate through rows
6. Edit or delete rows as needed
7. Use the search box to filter data

### Editing Data

1. Click "Edit" on any row to open the edit modal
2. Modify the values (primary key fields are read-only)
3. Click "Save Changes" to update the row
4. Changes are immediately saved to the database

### Deleting Data

1. Click "Delete" on any row
2. Confirm the deletion
3. The row is permanently removed from the database

## Technical Stack

- Electron - Desktop application framework
- React - UI framework
- Tailwind CSS - Styling and responsive design
- better-sqlite3 - SQLite database interface
- Sharp - Image processing for icons

## Development Scripts

- `npm start` - Start the application
- `npm run dev` - Start the application in development mode
- `npm run build` - Build the renderer process
- `npm run generate-icons` - Generate application icons
- `npm run generate-tray` - Generate tray icon
- `npm run generate-all` - Generate all icons
- `npm run package` - Package the application without creating installers
- `npm run make` - Create platform-specific distributables

## License

GPL-2.0-or-later
