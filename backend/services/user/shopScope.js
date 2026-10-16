// Decides WHICH SHOP a Staff Management request works on. Staff Management data belongs to a shop, and the shop always
// comes from the caller's own account, never from a request body:
//   * ?shopId=N is accepted only when shop N belongs to the caller's account (otherwise 404, as if it did not exist);
//   * without it the account's first shop (lowest id) is used;
//   * with no shop at all, reads return empty structures (resolveShop -> null) and writes answer 409 (requireShop).
// PENDING APPROVAL: admins are not tied to one shop in the current data model, so every user of an account may work on
// every shop of that account.
const { businessProfileRepository } = require('../../repositories');
const { ERROR_CODES } = require('../../config/constants/errors');
const { MESSAGES } = require('../../config/constants/messages');
const { AppError } = require('../../responses/error');

async function resolveShop(auth, requested) {
  const shops = (await businessProfileRepository.listByAccount(auth.accountId)).sort((a, b) => a.id - b.id);
  if (requested !== undefined && requested !== null) {
    if (!shops.some((s) => s.id === requested)) throw new AppError(404, ERROR_CODES.NOT_FOUND, MESSAGES.SHOP_NOT_FOUND);
    return requested;
  }
  return shops[0]?.id ?? null;
}

async function requireShop(auth, requested) {
  const shopId = await resolveShop(auth, requested);
  if (shopId === null) throw new AppError(409, ERROR_CODES.CONFLICT, MESSAGES.SHOP_REQUIRED);
  return shopId;
}

module.exports = { resolveShop, requireShop };
