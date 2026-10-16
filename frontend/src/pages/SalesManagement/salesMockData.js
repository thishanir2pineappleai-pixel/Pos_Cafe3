// LOCAL MOCK DATA ONLY: sample orders and discounts used to reproduce the Sales Management designs.
// It is not real database data and is not connected to any API.
import { INITIAL_PRODUCTS } from '../MenuManagement/menuMockData.js';
import { toISO } from '../../api/formatDate.js';

// The designs show "Today (21 Mar 2026)", so "today" is pinned to that date.
export const TODAY = new Date(2026, 2, 21);
export const ORDERS_PAGE_SIZE = 7;
export const DISCOUNTS_PAGE_SIZE = 12;
export const PRODUCTS = INITIAL_PRODUCTS;

const CUSTOMERS = ['Sarah Jenkins', 'Michael Chen', 'Anita Sharma', 'Donald Obama', 'Priya Nair', 'Kavindu Perera',
  'Nimal Silva', 'Emma Wilson', 'Arjun Patel', 'Lakshmi Devi', 'Tom Baker', 'Sofia Rossi'];
const ITEMS = ['Iced Latte,Muffin', 'Filter Coffee', '3x Cappuccino, 2x Croissants', '1x Cappuccino, 3x Croissants',
  'Chicken Burger, French Fries', '2x Mango Smoothie', 'Cheesecake, Espresso', 'Club Sandwich, Iced Tea'];
const STATUSES = ['Paid', 'Paid', 'Preparing', 'Pending', 'Delivered', 'Paid', 'Cancelled', 'Delivered'];

// Rows copied from the design (its repeated order ids are kept as drawn).
const DESIGN_ROWS = [
  ['#VB-4829', 'Take Away', 'Sarah Jenkins', 'Iced Latte,Muffin', 840, 'Paid', 12, 55],
  ['#VB-4828', 'Dine-In', 'Michael Chen', 'Filter Coffee', 180, 'Preparing', 12, 48],
  ['#VB-4827', 'Dine-In', 'Anita Sharma', '3x Cappuccino, 2x Croissants', 1240, 'Pending', 12, 42],
  ['#VB-4826', 'Dine-In', 'Donald Obama', '1x Cappuccino, 3x Croissants', 5840, 'Delivered', 12, 40],
  ['#VB-4826', 'Take Away', 'Donald Obama', '1x Cappuccino, 3x Croissants', 5840, 'Cancelled', 12, 40],
  ['#VB-4829', 'Take Away', 'Sarah Jenkins', 'Iced Latte,Muffin', 840, 'Paid', 12, 55],
  ['#VB-4829', 'Dine-In', 'Sarah Jenkins', 'Iced Latte,Muffin', 840, 'Paid', 12, 55],
];

export const formatTime = (hour, minute) =>
  `${((hour + 11) % 12) + 1}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;

function makeOrders() {
  const orders = [];
  let seq = 4800;
  const start = new Date(2026, 1, 1); // 1 Feb 2026 .. 31 May 2026
  for (let day = 0; day < 120; day += 1) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + day);
    const isToday = toISO(date) === toISO(TODAY);
    const count = isToday ? 50 : 3 + ((day * 7) % 6);
    for (let i = 0; i < count; i += 1) {
      const n = day * 100 + i;
      const design = isToday && i < DESIGN_ROWS.length ? DESIGN_ROWS[i] : null;
      const hour = design ? design[6] : n % 5 === 0 ? 19 : 8 + ((n * 5) % 13);
      const minute = design ? design[7] : (n * 11) % 60;
      orders.push({
        id: design ? design[0] : `#VB-${(seq -= 1)}`,
        type: design ? design[1] : n % 3 === 0 ? 'Take Away' : 'Dine-In',
        customer: design ? design[2] : CUSTOMERS[n % CUSTOMERS.length],
        items: design ? design[3] : ITEMS[n % ITEMS.length],
        total: design ? design[4] : 300 + ((n * 377) % 5200) - (((n * 377) % 5200) % 20),
        status: design ? design[5] : STATUSES[n % STATUSES.length],
        hour,
        time: formatTime(hour, minute),
        date: toISO(date),
        isNewCustomer: n % 6 === 0, // assumption: "New Customers" counts orders flagged as a first visit
      });
    }
  }
  // newest day first, original order kept within a day (Array.sort is stable)
  return orders.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export const ORDERS = makeOrders();

export const INITIAL_DISCOUNT_DEFS = [
  { name: 'Seasonal Discount', value: 5 },
  { name: 'Staff', value: 5 },
  { name: 'Student', value: 5 },
  { name: 'Loyalty Member', value: 5 },
  { name: 'Gold Member', value: 8 },
  { name: 'Silver Member', value: 3 },
];

const ids = (count) => PRODUCTS.slice(0, count).map((p) => p.id);

// productIds === null means "All Products".
export const INITIAL_DISCOUNTS = Array.from({ length: 22 }, (_, i) => {
  const name = i === 0 ? 'Staff' : i === 1 ? 'Student' : i === 2 ? 'Loyalty Member' : INITIAL_DISCOUNT_DEFS[(i + 1) % INITIAL_DISCOUNT_DEFS.length].name;
  const def = INITIAL_DISCOUNT_DEFS.find((d) => d.name === name);
  return {
    id: i + 1,
    name,
    value: i < 12 ? 5 : def.value,
    productIds: i === 1 ? ids(8) : i === 2 ? ids(1) : null,
    start: '2026-05-01',
    end: '2026-05-31',
    status: i === 2 ? 'Inactive' : 'Active',
  };
});

export const appliesLabel = (d) => {
  if (d.productIds === null) return 'All Products';
  return d.productIds.length === 1 ? '1 Product' : `${d.productIds.length} Products`;
};

const hourLabel = (h) => `${((h + 11) % 12) + 1}:00 ${h < 12 ? 'AM' : 'PM'}`;

// Summary numbers for a list of orders. Assumptions: revenue excludes cancelled orders,
// peak hour is the clock hour with the most orders.
export function summarize(orders) {
  const counts = {};
  orders.forEach((o) => { counts[o.hour] = (counts[o.hour] || 0) + 1; });
  const best = Object.keys(counts).sort((a, b) => counts[b] - counts[a] || a - b)[0];
  return {
    revenue: orders.filter((o) => o.status !== 'Cancelled').reduce((sum, o) => sum + o.total, 0),
    orders: orders.length,
    newCustomers: orders.filter((o) => o.isNewCustomer).length,
    peakHour: best === undefined ? '-' : `${hourLabel(Number(best))} – ${hourLabel(Number(best) + 1)}`,
  };
}
