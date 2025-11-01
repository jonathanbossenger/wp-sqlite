const path = require('path');
const fs = require('fs');
const png2icons = require('png2icons');

async function generateIcons() {
  const { Jimp, rgbaToInt } = await import('jimp');
  
  const assetsDir = path.join(__dirname, '..', 'assets');
  const iconsDir = path.join(assetsDir, 'icons');

  // Create directories
  ['mac', 'win', 'linux'].forEach(platform => {
    const platformDir = path.join(iconsDir, platform);
    if (!fs.existsSync(platformDir)) {
      fs.mkdirSync(platformDir, { recursive: true });
    }
  });

  // Create a simple icon with database symbol
  const size = 1024;
  const image = await new Jimp({ width: size, height: size, color: 0x00000000 });

  // Create gradient background
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dist = Math.sqrt(Math.pow(x - size/2, 2) + Math.pow(y - size/2, 2));
      if (dist < size/2) {
        // Gradient from purple to blue
        const ratio = dist / (size/2);
        const r = Math.floor(102 + (118 - 102) * ratio);
        const g = Math.floor(126 + (75 - 126) * ratio);
        const b = Math.floor(234 + (162 - 234) * ratio);
        const a = 255;
        const color = rgbaToInt(r, g, b, a);
        image.setPixelColor(color, x, y);
      }
    }
  }

  // Add rounded corners
  const cornerRadius = size / 8;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Check if pixel is in a corner that should be transparent
      const inTopLeft = x < cornerRadius && y < cornerRadius;
      const inTopRight = x > size - cornerRadius && y < cornerRadius;
      const inBottomLeft = x < cornerRadius && y > size - cornerRadius;
      const inBottomRight = x > size - cornerRadius && y > size - cornerRadius;

      if (inTopLeft || inTopRight || inBottomLeft || inBottomRight) {
        const cornerX = inTopLeft || inBottomLeft ? cornerRadius : size - cornerRadius;
        const cornerY = inTopLeft || inTopRight ? cornerRadius : size - cornerRadius;
        const dist = Math.sqrt(Math.pow(x - cornerX, 2) + Math.pow(y - cornerY, 2));
        if (dist > cornerRadius) {
          image.setPixelColor(0x00000000, x, y);
        }
      }
    }
  }

  // Save base PNG
  const basePngPath = path.join(iconsDir, 'icon.png');
  await image.write(basePngPath);
  console.log('Created base icon.png');

  // Generate macOS icons
  const macSizes = [16, 32, 64, 128, 256, 512, 1024];
  for (const size of macSizes) {
    const resized = image.clone().resize({ w: size, h: size });
    await resized.write(path.join(iconsDir, 'mac', `${size}x${size}.png`));
    console.log(`Created mac/${size}x${size}.png`);
  }

  // Generate .icns for macOS
  try {
    const input = await fs.promises.readFile(basePngPath);
    const output = png2icons.createICNS(input, png2icons.BILINEAR, 0);
    await fs.promises.writeFile(path.join(iconsDir, 'icon.icns'), output);
    console.log('Created icon.icns');
  } catch (error) {
    console.error('Error creating .icns:', error);
  }

  // Generate Windows icons
  const winSizes = [16, 24, 32, 48, 64, 128, 256];
  for (const size of winSizes) {
    const resized = image.clone().resize({ w: size, h: size });
    await resized.write(path.join(iconsDir, 'win', `${size}x${size}.png`));
    console.log(`Created win/${size}x${size}.png`);
  }

  // Generate .ico for Windows
  try {
    const input = await fs.promises.readFile(basePngPath);
    const output = png2icons.createICO(input, png2icons.BILINEAR, 0, false);
    await fs.promises.writeFile(path.join(iconsDir, 'icon.ico'), output);
    console.log('Created icon.ico');
  } catch (error) {
    console.error('Error creating .ico:', error);
  }

  // Generate Linux icons
  const linuxSizes = [16, 24, 32, 48, 64, 128, 256, 512];
  for (const size of linuxSizes) {
    const resized = image.clone().resize({ w: size, h: size });
    await resized.write(path.join(iconsDir, 'linux', `${size}x${size}.png`));
    console.log(`Created linux/${size}x${size}.png`);
  }

  console.log('Icon generation complete!');
}

generateIcons().catch(console.error);
