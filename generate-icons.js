import sharp from 'sharp';
import fs from 'fs';

const input = 'public/logo.png';
const out192 = 'public/pwa-192x192.png';
const out512 = 'public/pwa-512x512.png';
const appleTouch = 'public/apple-touch-icon.png';

async function generate() {
  if (!fs.existsSync(input)) {
    console.error('Input logo not found');
    return;
  }
  
  await sharp(input).resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } }).toFile(out192);
  await sharp(input).resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } }).toFile(out512);
  await sharp(input).resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } }).toFile(appleTouch);
  console.log('Icons generated successfully.');
}
generate();
