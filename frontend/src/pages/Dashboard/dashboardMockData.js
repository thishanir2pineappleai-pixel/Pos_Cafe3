// LOCAL MOCK DATA ONLY: numbers and names copied from the Dashboard design so the screen can be shown.
// It is not live data and is not connected to any API or database.
import icedLatte from '../../assets/images/iced-latte.png';
import filterCoffee from '../../assets/images/filter-coffee.png';
import cappuccino from '../../assets/images/cappuccino.png';
import sugar from '../../assets/images/stock-sugar.png';
import milk from '../../assets/images/stock-milk.png';
import coffeePowder from '../../assets/images/stock-coffee-powder.png';
import chocolateSyrup from '../../assets/images/stock-chocolate-syrup.png';

// Shown in the header: "Cashier: Kumar | Login: 08:30 AM | Shop: Open". The design also has a closed variant
// ("Logout: 10:30 PM | Shop: Closed"), supported by the `open` flag.
export const SHIFT = { cashier: 'Kumar', time: '08:30 AM', open: true };

export const SUMMARY = [
  { id: 'sales', label: "Today's Total Sales", value: 'Rs. 45,000.00', change: '+5.2%', tone: 'green' },
  { id: 'orders', label: "Today's Orders", value: '86', change: '+12.2%', tone: 'blue' },
  { id: 'customers', label: 'New Customers', value: '24', change: '+22.2%', tone: 'purple' },
  { id: 'peak', label: 'Peak Hours', value: '17.30 - 12.45 AM', change: '+5.2%', tone: 'orange' },
];

// Sales Trend. `max` is the top of the y axis, `highlight` the index the tooltip starts on.
export const TREND = {
  today: {
    labels: ['06:00 AM', '09:00 AM', '12:00 PM', '15:00 PM', '18:00 PM', '21:00 PM', '12:00 AM'],
    values: [4000, 28000, 45000, 38000, 66000, 96000, 34000],
    ticks: [0, 25000, 50000, 75000, 100000],
    highlight: 2,
  },
  week: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    values: [8000, 30000, 45000, 38000, 66000, 96000, 40000],
    ticks: [0, 25000, 50000, 75000, 100000],
    highlight: 2,
  },
  month: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    values: [9000, 30000, 41000, 36000, 72000, 112000, 60000],
    ticks: [0, 30000, 60000, 90000, 120000],
    highlight: 2,
  },
};

export const TOP_SELLING = [
  { id: 1, name: 'Iced Latte', category: 'Beverages', sold: 124, price: 'Rs. 320', image: icedLatte },
  { id: 2, name: 'Filter  Coffee', category: 'Beverages', sold: 98, price: 'Rs. 180', image: filterCoffee },
  { id: 3, name: 'Cappuccino', category: 'Beverages', sold: 76, price: 'Rs. 180', image: cappuccino },
  { id: 4, name: 'Cappuccino', category: 'Beverages', sold: 76, price: 'Rs. 180', image: cappuccino },
];

export const ORDER_STATUS = [
  { id: 'pending', label: 'Pending', count: 46, tone: 'purple' },
  { id: 'preparing', label: 'Preparing', count: 15, tone: 'orange' },
  { id: 'delivered', label: 'Delivered', count: 21, tone: 'blue' },
  { id: 'paid', label: 'Paid', count: 33, tone: 'green' },
  { id: 'cancelled', label: 'Cancelled', count: 5, tone: 'red' },
];

export const STOCK_COUNTS = [
  { id: 'out', label: 'Out of Stock', count: '02', tone: 'red' },
  { id: 'low', label: 'Low Stock', count: '03', tone: 'orange' },
  { id: 'in', label: 'In Stock', count: '46', tone: 'green' },
];

export const STOCK_ITEMS = [
  { id: 1, name: 'Sugar', category: 'Beverages', quantity: '0 kg', status: 'Out of Stock', image: sugar },
  { id: 2, name: 'Milk', category: 'Beverages', quantity: '0 ml', status: 'Out of Stock', image: milk },
  { id: 3, name: 'Coffee Powder', category: 'Beverages', quantity: '5 kg', status: 'Low Stock', image: coffeePowder },
  { id: 4, name: 'Chocolate Syrup', category: 'Add-ons', quantity: '4 l', status: 'Low Stock', image: chocolateSyrup },
];

export const RECENT_ORDERS = [
  { id: '#VB-4829', table: 'T - 01', status: 'Paid' },
  { id: '#VB-4828', table: 'T - 22', status: 'Preparing' },
  { id: '#VB-4827', table: 'T - 07', status: 'Pending' },
  { id: '#VB-4826', table: 'T - 06', status: 'Cancelled' },
  { id: '#VB-4825', table: 'T - 03', status: 'Delivered' },
];
