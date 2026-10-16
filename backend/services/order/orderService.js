// Order list and CSV export for the Sales Management table. Read-only: order creation is not part of this stage.
const { orderRepository } = require('../../repositories');
const { dateOf, timeLabel } = require('../../utils/date');
const { formatItemsText } = require('../../utils/formatter');
const { buildMeta } = require('../../utils/pagination');
const { toCsv } = require('../report/csvService');

const CSV_HEADERS = ['Order ID', 'Order Type', 'Customer', 'Items', 'Total', 'Status', 'Time', 'Date'];

function toDto(o) {
  return {
    id: o.id,
    orderId: o.orderNumber,
    type: o.type,
    customer: o.customerName,
    items: o.items,
    itemsText: formatItemsText(o.items),
    total: o.total,
    status: o.status,
    time: timeLabel(o.placedAt),
    date: dateOf(o.placedAt),
    placedAt: o.placedAt,
  };
}

async function list({ from, to, search, page, limit }) {
  const { rows, total } = await orderRepository.list({ from, to, search, offset: (page - 1) * limit, limit });
  return { items: rows.map(toDto), meta: buildMeta(total, page, limit) };
}

// Same filters as list(), but every matching row (not one page).
async function exportCsv({ from, to, search }) {
  const rows = (await orderRepository.findAll({ from, to, search })).map(toDto);
  return toCsv(CSV_HEADERS, rows.map((o) => [o.orderId, o.type, o.customer, o.itemsText, o.total, o.status, o.time, o.date]));
}

module.exports = { list, exportCsv };
