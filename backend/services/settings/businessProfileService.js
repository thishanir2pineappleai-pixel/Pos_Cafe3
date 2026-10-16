// Shop profile (Business Profile) logic. Talks only to the repository (in-memory for now, MySQL later).
// Every function takes the signed-in user (`auth`) and only ever sees shops of that user's own account: a shop of another
// account answers 404, exactly like a shop that does not exist.
const { businessProfileRepository } = require('../../repositories');
const { ERROR_CODES } = require('../../config/constants/errors');
const { MESSAGES } = require('../../config/constants/messages');
const { AppError } = require('../../responses/error');
const imageService = require('../storage/imageService');

const notFound = () => new AppError(404, ERROR_CODES.NOT_FOUND, MESSAGES.SHOP_NOT_FOUND);

function toDto(row) {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    phone: row.phone,
    email: row.email,
    website: row.website,
    timezone: row.timezone,
    image: imageService.settingsImageUrl(row.imagePath),
    status: 'Active', // the Figma shows an "Active" badge but no way to change it; no status rules exist yet
    createdAt: row.createdAt,
    updatedAt: row.updatedAt, // the "Updated on ..." date on the card
  };
}

const list = async (auth) => (await businessProfileRepository.listByAccount(auth.accountId)).map(toDto);

// The shop, but only if it belongs to the caller's account.
async function owned(auth, id) {
  const row = await businessProfileRepository.findById(id);
  if (!row || row.accountId !== auth.accountId) throw notFound();
  return row;
}

async function get(auth, id) {
  return toDto(await owned(auth, id));
}

// The account and owner are set here from the signed-in user, never from the request body.
const create = async (auth, value) => toDto(await businessProfileRepository.create({ ...value, accountId: auth.accountId, ownerId: auth.userId }));

// Replaces all text fields (an absent email or website becomes empty); the logo is changed only by the image endpoint.
async function update(auth, id, value) {
  await owned(auth, id);
  return toDto(await businessProfileRepository.update(id, value));
}

// The file is saved only after the profile is known to exist and to be the caller's; the replaced file is deleted afterwards.
async function setImage(auth, id, buffer, type) {
  await owned(auth, id);
  const filename = await imageService.saveSettingsImage(buffer, type);
  const previous = await businessProfileRepository.setImagePath(id, filename);
  if (previous === undefined) {
    await imageService.removeSettingsImage(filename);
    throw notFound();
  }
  await imageService.removeSettingsImage(previous);
  return get(auth, id);
}

module.exports = { list, get, create, update, setImage };
