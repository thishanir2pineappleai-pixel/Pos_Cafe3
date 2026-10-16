// Stock Details card. LIMITS: the design lists INGREDIENTS with units (Sugar 0 kg, Milk 0 ml) that belong to an Inventory
// module that does not exist yet, and Menu products have neither a unit nor a shop. So this reports the Menu PRODUCTS'
// stock (the whole catalogue, shared by all shops) and says so in its response.
const { menuRepository } = require('../../repositories');
const { getStockStatus } = require('../../config/constants/status');
const { formatProductCode } = require('../../utils/formatter');

async function stockSummary({ limit }) {
  const { counts, attention } = await menuRepository.stockOverview({ limit });
  return {
    source: 'menu_products',
    counts,
    items: attention.map((p) => ({
      id: p.id,
      code: formatProductCode(p.id),
      name: p.name,
      category: p.categoryName,
      quantity: p.quantity,
      lowStockAlert: p.lowStockAlert,
      status: getStockStatus(p.quantity, p.lowStockAlert),
    })),
  };
}

module.exports = { stockSummary };
