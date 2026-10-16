const crypto = require('node:crypto');
const { uploads } = require('../../config');
const uploadService = require('./uploadService');

const PNG_HEADER = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const PNG_END = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]); // IEND chunk
const EXTENSIONS = { png: 'png', jpeg: 'jpg' };

// Decides the real type from the file's bytes (the client's filename and Content-Type are never trusted).
// PNG: signature and closing IEND chunk. JPEG: FF D8 FF start and FF D9 end (trailing zero padding is allowed).
// ponytail: this catches fake and truncated files but does not decode the pixels.
function detectImageType(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;
  if (buffer.subarray(0, 8).equals(PNG_HEADER) && buffer.subarray(-12).equals(PNG_END)) return 'png';
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    let end = buffer.length;
    while (end > 2 && buffer[end - 1] === 0x00) end -= 1;
    if (buffer[end - 2] === 0xff && buffer[end - 1] === 0xd9) return 'jpeg';
  }
  return null;
}

const generatedName = (type) => `${crypto.randomUUID()}.${EXTENSIONS[type]}`;

// Each save stores the file under a generated name and returns that name.
async function saveProductImage(buffer, type) {
  const filename = generatedName(type);
  await uploadService.writeProductFile(filename, buffer);
  return filename;
}

// Settings images (shop logo, admin picture) live in their own folder, apart from product photos.
async function saveSettingsImage(buffer, type) {
  const filename = generatedName(type);
  await uploadService.writeSettingsFile(filename, buffer);
  return filename;
}

// Staff pictures live in their own private folder (uploads/staff) and are read back only through the authenticated route.
async function saveStaffImage(buffer, type) {
  const filename = generatedName(type);
  await uploadService.writeStaffImage(filename, buffer);
  return filename;
}

const removeProductImage =(filename) => uploadService.removeProductFile(filename);
const removeSettingsImage = (filename) => uploadService.removeSettingsFile(filename);
const productImageUrl = (filename) => (filename ? `${uploads.publicPath}/${filename}` : null);
const settingsImageUrl = (filename) => (filename ? `${uploads.settingsPublicPath}/${filename}` : null);

module.exports = {
  detectImageType,
  saveProductImage, removeProductImage, productImageUrl,
  saveSettingsImage, removeSettingsImage, settingsImageUrl,
  saveStaffImage,
};
