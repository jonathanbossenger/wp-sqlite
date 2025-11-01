const path = require('path');
const fs = require('fs');
const png2icons = require('png2icons');

async function generateIcons() {
  const { Jimp } = await import('jimp');
  
  const assetsDir = path.join(__dirname, '..', 'assets');
  const iconsDir = path.join(assetsDir, 'icons');
  const customIconDir = path.join(iconsDir, 'custom');

  // Create directories
  ['mac', 'win', 'linux'].forEach(platform => {
    const platformDir = path.join(iconsDir, platform);
    if (!fs.existsSync(platformDir)) {
      fs.mkdirSync(platformDir, { recursive: true });
    }
  });

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
  console.log(`Using custom icon: ${customIconFiles[0]}`);

  // Load the custom icon
  const image = await Jimp.read(customIconPath);

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
