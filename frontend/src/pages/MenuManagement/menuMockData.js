// LOCAL MOCK DATA ONLY: sample data used to reproduce the Menu Management designs.
// It is not real database data and is not connected to any API.
import iceCoffeeImage from '../../assets/images/ice-coffee.png';

export const INITIAL_CATEGORIES = ['Coffee', 'Beverages', 'Drinks', 'Desserts', 'Burgers', 'Snacks'];

export const INITIAL_DISCOUNTS = [
  { name: 'Silver Member Discount', percentage: 5 },
  { name: 'Gold Member Discount', percentage: 8 },
  { name: 'New Year Offer', percentage: 15 },
  { name: 'Staff Discount', percentage: 20 },
  { name: 'Promo Code Discount', percentage: 12 },
  { name: 'Seasonal Discount', percentage: 10 },
];

export const INGREDIENT_OPTIONS = [
  { id: '#ING111', name: 'Sugar' },
  { id: '#ING101', name: 'Espresso' },
  { id: '#ING036', name: 'Chocolate syrup' },
  { id: '#ING011', name: 'Whipped cream' },
  { id: '#ING018', name: 'Milk' },
  { id: '#ING120', name: 'Brown Sugar' },
  { id: '#ING121', name: 'White Sugar' },
  { id: '#ING122', name: 'Sugar Syrup' },
  { id: '#ING123', name: 'Sugar Powder' },
  { id: '#ING140', name: 'Ice' },
  { id: '#ING150', name: 'Flour' },
  { id: '#ING160', name: 'Butter' },
];

export const PAGE_SIZE = 9;

const NAMES = [
  ['Ice Coffee', 'Beverages'], ['Espresso', 'Coffee'], ['Cappuccino', 'Coffee'], ['Caffe Latte', 'Coffee'],
  ['Americano', 'Coffee'], ['Mocha', 'Coffee'], ['Flat White', 'Coffee'], ['Macchiato', 'Coffee'],
  ['Cold Brew', 'Coffee'], ['Iced Tea', 'Beverages'], ['Lemonade', 'Beverages'], ['Mango Smoothie', 'Beverages'],
  ['Strawberry Shake', 'Beverages'], ['Chocolate Milkshake', 'Beverages'], ['Fresh Orange Juice', 'Beverages'],
  ['Watermelon Juice', 'Beverages'], ['Mojito', 'Drinks'], ['Passion Fruit Cooler', 'Drinks'], ['Ginger Beer', 'Drinks'],
  ['Soda Water', 'Drinks'], ['Lime Soda', 'Drinks'], ['Iced Milo', 'Drinks'], ['Hot Chocolate', 'Drinks'],
  ['Green Tea', 'Drinks'], ['Chocolate Cake', 'Desserts'], ['Cheesecake', 'Desserts'], ['Brownie', 'Desserts'],
  ['Ice Cream Sundae', 'Desserts'], ['Tiramisu', 'Desserts'], ['Waffle', 'Desserts'], ['Pancakes', 'Desserts'],
  ['Fruit Salad', 'Desserts'], ['Chicken Burger', 'Burgers'], ['Beef Burger', 'Burgers'], ['Cheese Burger', 'Burgers'],
  ['Veggie Burger', 'Burgers'], ['Fish Burger', 'Burgers'], ['Double Patty Burger', 'Burgers'],
  ['Spicy Chicken Burger', 'Burgers'], ['BBQ Burger', 'Burgers'], ['French Fries', 'Snacks'],
  ['Chicken Nuggets', 'Snacks'], ['Onion Rings', 'Snacks'], ['Garlic Bread', 'Snacks'], ['Sausage Roll', 'Snacks'],
  ['Chicken Wings', 'Snacks'], ['Nachos', 'Snacks'], ['Club Sandwich', 'Snacks'], ['Veg Spring Rolls', 'Snacks'],
  ['Cutlet', 'Snacks'],
];

// Stock for the first nine rows follows the design; the rest is deterministic filler.
const FIRST_STOCK = [112, 112, 10, 0, 0, 0, 0, 0, 0];
const stockFor = (i) => (i < FIRST_STOCK.length ? FIRST_STOCK[i] : i % 7 === 0 ? 0 : (i * 37) % 130);

const ICE_COFFEE_INGREDIENTS = [
  { id: '#ING111', name: 'Sugar', quantity: '40 g' },
  { id: '#ING101', name: 'Espresso', quantity: '60 ml' },
  { id: '#ING036', name: 'Chocolate syrup', quantity: '30 ml' },
  { id: '#ING011', name: 'Whipped cream', quantity: '50 g' },
  { id: '#ING018', name: 'Milk', quantity: '250 ml' },
];

export const INITIAL_PRODUCTS = NAMES.map(([name, category], i) => {
  const sellingPrice = i === 0 ? 500 : 250 + ((i * 137) % 1600) - (((i * 137) % 1600) % 50);
  return {
    id: `#PRD${111 + i}`,
    name,
    category,
    costPrice: i === 0 ? 350 : Math.round(sellingPrice * 0.7),
    sellingPrice,
    quantity: stockFor(i),
    lowStockAlert: 15,
    discountType: i === 0 ? 'Seasonal Discount' : '',
    image: iceCoffeeImage,
    ingredients: i === 0 ? ICE_COFFEE_INGREDIENTS
      : [ICE_COFFEE_INGREDIENTS[i % 5], ICE_COFFEE_INGREDIENTS[(i + 2) % 5]],
  };
});

export const STATUS_IN_STOCK = 'In Stock';
export const STATUS_LOW_STOCK = 'Low Stock';
export const STATUS_OUT_OF_STOCK = 'Out of stock';

export function getStockStatus(product) {
  if (product.quantity <= 0) return STATUS_OUT_OF_STOCK;
  return product.quantity <= product.lowStockAlert ? STATUS_LOW_STOCK : STATUS_IN_STOCK;
}

export const formatPrice = (n) => `Rs. ${Number(n).toFixed(2)}`;
