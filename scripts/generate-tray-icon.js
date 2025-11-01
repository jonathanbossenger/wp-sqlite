const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function generateTrayIcon() {
  const assetsDir = path.join(__dirname, '..', 'assets');
  const iconsDir = path.join(assetsDir, 'icons');
  const customIconDir = path.join(iconsDir, 'custom');
  
  // Find the custom icon file
  if (!fs.existsSync(customIconDir)) {
    throw new Error(`Custom icon directory not found: ${customIconDir}`);
  }
  
  const customIconFiles = fs.readdirSync(customIconDir)
    .filter(file => file.toLowerCase().endsWith('.png'))
    .sort(); // Sort to ensure consistent selection
  
  if (customIconFiles.length === 0) {
    throw new Error('No PNG file found in assets/icons/custom/');
  }
  
  const customIconPath = path.join(customIconDir, customIconFiles[0]);
  console.log(`Using custom icon for tray: ${customIconFiles[0]}`);

  // Generate 32x32 tray icon from custom icon
  await sharp(customIconPath)
    .resize(32, 32)
    .png()
    .toFile(path.join(assetsDir, 'tray-icon.png'));

  console.log('Created tray-icon.png');
}

generateTrayIcon().catch(console.error);
