// MySQL (Prisma) product repository: the same methods and the same row shapes as the in-memory one
// (repositories/memory/menuRepository.js): product columns plus categoryName, discountName/discountPercentage and, for a
// single product, its ingredients. Money and quantities come back as plain numbers and dates as ISO strings, so API
// responses are identical to memory mode.
// Methods the Menu Service does not call are not implemented here (existingIds and stockOverview exist only in the memory
// copy: they were written for Sales and the Dashboard, which will ask the Menu Service over its API).
const { prisma } = require('./client');
const { getStockStatus } = require('../../config/constants/status');
const { formatProductCode } = require('../../utils/formatter');

const COLUMNS = ['name', 'categoryId', 'costPrice', 'sellingPrice', 'quantity', 'lowStockAlert', 'discountId'];
const num = (v) => (v === null || v === undefined ? null : Number(v));
const big = (v) => (v === null || v === undefined ? null : BigInt(v));

function toProduct(p) {
  return {
    id: p.id,
    name: p.name,
    categoryId: p.categoryId,
    costPrice: num(p.costPrice),
    sellingPrice: Number(p.sellingPrice),
    quantity: Number(p.quantity),
    lowStockAlert: num(p.lowStockAlert),
    discountId: p.discountId,
    imagePath: p.imagePath,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

const withJoins = (p) => ({
  ...toProduct(p),
  categoryName: p.category ? p.category.name : null,
  discountName: p.discount ? p.discount.name : null,
  discountPercentage: p.discount ? Number(p.discount.percentage) : null,
});

function columnsOf(data) {
  const out = {};
  for (const f of COLUMNS) {
    if (data[f] === undefined) continue;
    out[f] = f === 'quantity' || f === 'lowStockAlert' ? big(data[f]) : data[f];
  }
  return out;
}

const linkRows = (links) => links.map((l, position) => ({ ingredientId: l.ingredientId, quantity: l.quantity, position }));
const statusOf = (p) => getStockStatus(p.quantity, p.lowStockAlert);

module.exports = {
  // ponytail: the category filter runs in SQL; the text search, status and sort run in JS exactly as in memory mode (the
  // search matches the computed status text and the #PRD code). Fine for a cafe catalogue; for tens of thousands of
  // products push them into SQL.
  async list({ search, status, categoryId, sort, offset, limit }) {
    const needle = search ? search.toLowerCase() : null;
    const found = await prisma.product.findMany({ where: categoryId ? { categoryId } : {}, include: { category: true, discount: true } });
    let rows = found.map(withJoins).filter((p) => {
      if (status && statusOf(p) !== status) return false;
      if (!needle) return true;
      return [p.name, formatProductCode(p.id), p.categoryName, statusOf(p)].some((text) => text && text.toLowerCase().includes(needle));
    });
    rows = rows.sort((a, b) => {
      if (sort === 'price_asc' && a.sellingPrice !== b.sellingPrice) return a.sellingPrice - b.sellingPrice;
      if (sort === 'price_desc' && a.sellingPrice !== b.sellingPrice) return b.sellingPrice - a.sellingPrice;
      return b.id - a.id;
    });
    return { total: rows.length, rows: rows.slice(offset, offset + limit) };
  },

  async findById(id) {
    const p = await prisma.product.findUnique({
      where: { id },
      include: { category: true, discount: true, ingredients: { include: { ingredient: true }, orderBy: { position: 'asc' } } },
    });
    if (!p) return null;
    return { ...withJoins(p), ingredients: p.ingredients.map((l) => ({ ingredientId: l.ingredientId, name: l.ingredient.name, quantity: l.quantity })) };
  },

  // The product row and its ingredient links are saved together or not at all.
  async create(data, links) {
    return toProduct(await prisma.product.create({ data: { ...columnsOf(data), ingredients: { create: linkRows(links) } } }));
  },

  // Replaces the columns and the whole ingredient list in one transaction; null when the product does not exist.
  async update(id, data, links) {
    return prisma.$transaction(async (tx) => {
      if (!(await tx.product.findUnique({ where: { id }, select: { id: true } }))) return null;
      await tx.productIngredient.deleteMany({ where: { productId: id } });
      return toProduct(await tx.product.update({ where: { id }, data: { ...columnsOf(data), ingredients: { create: linkRows(links) } } }));
    });
  },

  // Deletes the product and its ingredient links only (never an ingredient); returns the deleted row, or null.
  async remove(id) {
    try {
      return toProduct(await prisma.product.delete({ where: { id } }));
    } catch (err) {
      if (err.code === 'P2025') return null;
      throw err;
    }
  },

  async updateIngredientQuantity(productId, ingredientId, quantity) {
    return prisma.$transaction(async (tx) => {
      const { count } = await tx.productIngredient.updateMany({ where: { productId, ingredientId }, data: { quantity } });
      if (count === 0) return false;
      await tx.product.update({ where: { id: productId }, data: { updatedAt: new Date() } });
      return true;
    });
  },

  // Returns the previous image file name (or null), or undefined when the product does not exist.
  async setImagePath(id, imagePath) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.product.findUnique({ where: { id }, select: { imagePath: true } });
      if (!existing) return undefined;
      await tx.product.update({ where: { id }, data: { imagePath } });
      return existing.imagePath;
    });
  },

  async counts() {
    const [total, outOfStock] = await Promise.all([prisma.product.count(), prisma.product.count({ where: { quantity: { lte: 0 } } })]);
    return { total, active: total - outOfStock, outOfStock };
  },
};
