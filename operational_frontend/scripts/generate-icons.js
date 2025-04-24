const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = {
  mdpi: 48,
  hdpi: 72,
  xhdpi: 96,
  xxhdpi: 144,
  xxxhdpi: 192
};

const generateIcons = async () => {
  const iconSvg = `
    <svg width="108" height="108" viewBox="0 0 108 108" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="108" height="108" rx="24" fill="#3B82F6"/>
      <path d="M54 20C35.2 20 20 35.2 20 54C20 72.8 35.2 88 54 88C72.8 88 88 72.8 88 54C88 35.2 72.8 20 54 20ZM54 44C59.5 44 64 48.5 64 54C64 59.5 59.5 64 54 64C48.5 64 44 59.5 44 54C44 48.5 48.5 44 54 44ZM54 82C45.7 82 38.3 78.1 33.7 72.1C38.4 67.4 45.8 64 54 64C62.2 64 69.6 67.4 74.3 72.1C69.7 78.1 62.3 82 54 82Z" fill="white"/>
    </svg>
  `;

  const svgBuffer = Buffer.from(iconSvg);

  for (const [density, size] of Object.entries(sizes)) {
    const outputPath = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res', `mipmap-${density}`, 'ic_launcher.png');
    
    await sharp(svgBuffer)
      .resize(size, size)
      .toFile(outputPath);
    
    console.log(`Generated ${density} icon: ${size}x${size}`);
  }
};

generateIcons().catch(console.error);