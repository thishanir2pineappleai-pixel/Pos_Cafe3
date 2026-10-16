const fs = require('node:fs/promises');
const path = require('node:path');
const { uploads } = require('../../config');

// Generated names only: <uuid>.<png|jpg|pdf|doc|docx>. Anything else is never read, written or deleted, so a name that
// came from a user can never point outside the upload folders.
const SAFE_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|pdf|doc|docx)$/;

async function writeFile(dir, filename, buffer) {
  if (!SAFE_NAME.test(filename)) throw new Error('Unsafe upload filename');
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), buffer, { flag: 'wx' }); // never overwrite
}

// Best effort: a missing file is fine, and an unexpected name is ignored.
async function removeFile(dir, filename) {
  if (!filename || !SAFE_NAME.test(filename)) return;
  try {
    await fs.unlink(path.join(dir, filename));
  } catch (err) {
    if (err.code !== 'ENOENT') console.error('Could not delete upload', filename, err.message);
  }
}

// Returns the file's bytes, or null when the name is unsafe or the file is gone.
async function readFile(dir, filename) {
  if (!filename || !SAFE_NAME.test(filename)) return null;
  try {
    return await fs.readFile(path.join(dir, filename));
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

module.exports = {
  writeProductFile: (filename, buffer) => writeFile(uploads.productsDir, filename, buffer),
  removeProductFile: (filename) => removeFile(uploads.productsDir, filename),
  writeSettingsFile: (filename, buffer) => writeFile(uploads.settingsDir, filename, buffer),
  removeSettingsFile: (filename) => removeFile(uploads.settingsDir, filename),
  // Staff pictures and staff documents each have their own folder. Neither folder is served statically:
  // they are only readable through the authenticated Staff Management routes.
  writeStaffImage: (filename, buffer) => writeFile(uploads.staffDir, filename, buffer),
  readStaffImage: (filename) => readFile(uploads.staffDir, filename),
  removeStaffImage: (filename) => removeFile(uploads.staffDir, filename),
  writeStaffDocument: (filename, buffer) => writeFile(uploads.staffDocumentsDir, filename, buffer),
  readStaffDocument: (filename) => readFile(uploads.staffDocumentsDir, filename),
  removeStaffDocument: (filename) => removeFile(uploads.staffDocumentsDir, filename),
};
