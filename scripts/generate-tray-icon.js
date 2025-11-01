const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function generateTrayIcon() {
  const assetsDir = path.join(__dirname, '..', 'assets');
  
  // Create a simple 32x32 tray icon
  const size = 32;
  
  // Create SVG for database icon
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="16" cy="8" rx="12" ry="4" fill="#333" opacity="0.8"/>
      <rect x="4" y="8" width="24" height="16" fill="#333" opacity="0.8"/>
      <ellipse cx="16" cy="24" rx="12" ry="4" fill="#333" opacity="0.8"/>
      <ellipse cx="16" cy="8" rx="10" ry="3" fill="#555"/>
      <rect x="6" y="8" width="20" height="16" fill="#555"/>
      <ellipse cx="16" cy="24" rx="10" ry="3" fill="#555"/>
      <ellipse cx="16" cy="16" rx="10" ry="3" fill="#666"/>
    </svg>
  `;

  // Generate PNG from SVG
  await sharp(Buffer.from(svg))
    .resize(32, 32)
    .png()
    .toFile(path.join(assetsDir, 'tray-icon.png'));

  console.log('Created tray-icon.png');
}

generateTrayIcon().catch(console.error);
