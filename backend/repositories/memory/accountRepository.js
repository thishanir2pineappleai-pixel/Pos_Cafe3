// Creates an account together with its owner and first shop as ONE unit: either both rows exist afterwards or neither.
// With MySQL this is a single transaction (INSERT users, INSERT shops, COMMIT; ROLLBACK on any error).
const { nextId } = require('./store');
const adminProfileRepository = require('./adminProfileRepository');
const businessProfileRepository = require('./businessProfileRepository');

module.exports = {
  // owner: user columns; shop: shop columns. Returns { accountId, owner, shop }.
  async createWithOwnerAndShop({ owner, shop }) {
    const accountId = nextId('accounts');
    const createdOwner = await adminProfileRepository.create({ ...owner, accountId });
    try {
      const createdShop = await businessProfileRepository.create({ ...shop, accountId, ownerId: createdOwner.id });
      return { accountId, owner: createdOwner, shop: createdShop };
    } catch (err) {
      await adminProfileRepository.remove(createdOwner.id); // roll back
      throw err;
    }
  },
};
