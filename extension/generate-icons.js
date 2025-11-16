const fs = require('fs');
const path = require('path');

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir);
}

// Simple PNG generator using Canvas (if available) or create placeholder SVGs
const { createCanvas } = require('canvas');

function createIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background gradient (approximated with solid color)
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#667eea');
  gradient.addColorStop(1, '#764ba2');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  // Lightning bolt icon
  ctx.fillStyle = 'white';
  ctx.beginPath();
  const scale = size / 16;
  ctx.moveTo(9 * scale, 2 * scale);
  ctx.lineTo(4 * scale, 9 * scale);
  ctx.lineTo(7 * scale, 9 * scale);
  ctx.lineTo(7 * scale, 14 * scale);
  ctx.lineTo(12 * scale, 7 * scale);
  ctx.lineTo(9 * scale, 7 * scale);
  ctx.closePath();
  ctx.fill();
  
  return canvas.toBuffer('image/png');
}

// Generate icons
try {
  fs.writeFileSync(path.join(iconsDir, 'icon16.png'), createIcon(16));
  fs.writeFileSync(path.join(iconsDir, 'icon48.png'), createIcon(48));
  fs.writeFileSync(path.join(iconsDir, 'icon128.png'), createIcon(128));
  console.log('Icons generated successfully!');
} catch (error) {
  console.error('Error generating icons:', error.message);
  console.log('Please install canvas: npm install canvas');
}
