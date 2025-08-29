import { MenuItem } from '../types';

export const menuData: MenuItem[] = [
  // Hot Coffees
  {
    id: 'americano',
    name: 'Americano',
    description: 'Rich espresso with hot water, smooth and bold',
    basePrice: 120,
    category: 'hot-coffee',
    popular: true,
    variations: [
      { id: 'small', name: 'Small (8oz)', price: 0 },
      { id: 'medium', name: 'Medium (12oz)', price: 20 },
      { id: 'large', name: 'Large (16oz)', price: 40 }
    ],
    addOns: [
      { id: 'extra-shot', name: 'Extra Shot', price: 25, category: 'coffee' },
      { id: 'decaf', name: 'Decaf', price: 0, category: 'coffee' },
      { id: 'oat-milk', name: 'Oat Milk', price: 15, category: 'milk' },
      { id: 'almond-milk', name: 'Almond Milk', price: 15, category: 'milk' }
    ]
  },
  {
    id: 'cappuccino',
    name: 'Cappuccino',
    description: 'Espresso with steamed milk and foam, perfectly balanced',
    basePrice: 140,
    category: 'hot-coffee',
    popular: true,
    variations: [
      { id: 'small', name: 'Small (8oz)', price: 0 },
      { id: 'medium', name: 'Medium (12oz)', price: 20 },
      { id: 'large', name: 'Large (16oz)', price: 40 }
    ],
    addOns: [
      { id: 'extra-shot', name: 'Extra Shot', price: 25, category: 'coffee' },
      { id: 'vanilla-syrup', name: 'Vanilla Syrup', price: 10, category: 'syrup' },
      { id: 'caramel-syrup', name: 'Caramel Syrup', price: 10, category: 'syrup' },
      { id: 'oat-milk', name: 'Oat Milk', price: 15, category: 'milk' }
    ]
  },
  {
    id: 'latte',
    name: 'Café Latte',
    description: 'Smooth espresso with steamed milk, creamy and comforting',
    basePrice: 150,
    category: 'hot-coffee',
    variations: [
      { id: 'small', name: 'Small (8oz)', price: 0 },
      { id: 'medium', name: 'Medium (12oz)', price: 20 },
      { id: 'large', name: 'Large (16oz)', price: 40 }
    ]
  },
  {
    id: 'mocha',
    name: 'Café Mocha',
    description: 'Rich espresso with chocolate and steamed milk',
    basePrice: 160,
    category: 'hot-coffee'
  },
  {
    id: 'macchiato',
    name: 'Caramel Macchiato',
    description: 'Vanilla-flavored drink with espresso and caramel',
    basePrice: 170,
    category: 'hot-coffee'
  },
  {
    id: 'flat-white',
    name: 'Flat White',
    description: 'Double shot espresso with microfoam milk',
    basePrice: 155,
    category: 'hot-coffee'
  },

  // Iced Coffees
  {
    id: 'iced-americano',
    name: 'Iced Americano',
    description: 'Bold espresso over ice, refreshingly smooth',
    basePrice: 130,
    category: 'iced-coffee',
    popular: true,
    variations: [
      { id: 'small', name: 'Small (12oz)', price: 0 },
      { id: 'medium', name: 'Medium (16oz)', price: 20 },
      { id: 'large', name: 'Large (20oz)', price: 40 }
    ]
  },
  {
    id: 'iced-latte',
    name: 'Iced Latte',
    description: 'Cold espresso with milk over ice, creamy and cool',
    basePrice: 160,
    category: 'iced-coffee'
  },
  {
    id: 'cold-brew',
    name: 'Cold Brew',
    description: '12-hour steeped coffee, smooth and less acidic',
    basePrice: 140,
    category: 'iced-coffee'
  },
  {
    id: 'frappe',
    name: 'Coffee Frappe',
    description: 'Blended iced coffee with whipped cream',
    basePrice: 180,
    category: 'iced-coffee'
  },
  {
    id: 'iced-mocha',
    name: 'Iced Mocha',
    description: 'Chocolate and espresso over ice with whipped cream',
    basePrice: 170,
    category: 'iced-coffee'
  },

  // Non-Coffee
  {
    id: 'hot-chocolate',
    name: 'Premium Hot Chocolate',
    description: 'Rich, creamy hot chocolate with marshmallows',
    basePrice: 140,
    category: 'non-coffee'
  },
  {
    id: 'chai-latte',
    name: 'Chai Latte',
    description: 'Spiced tea with steamed milk, warming and aromatic',
    basePrice: 150,
    category: 'non-coffee'
  },
  {
    id: 'matcha-latte',
    name: 'Matcha Latte',
    description: 'Premium Japanese green tea with steamed milk',
    basePrice: 170,
    category: 'non-coffee'
  },
  {
    id: 'herbal-tea',
    name: 'Herbal Tea Selection',
    description: 'Choice of chamomile, peppermint, or lemon ginger',
    basePrice: 100,
    category: 'non-coffee'
  },
  {
    id: 'fresh-juice',
    name: 'Fresh Orange Juice',
    description: 'Freshly squeezed orange juice, no preservatives',
    basePrice: 120,
    category: 'non-coffee'
  },

  // Pastries & Food
  {
    id: 'croissant',
    name: 'Butter Croissant',
    description: 'Flaky, buttery French pastry, baked fresh daily',
    basePrice: 95,
    category: 'food'
  },
  {
    id: 'pain-au-chocolat',
    name: 'Pain au Chocolat',
    description: 'Buttery pastry with dark chocolate, a French classic',
    basePrice: 110,
    category: 'food'
  },
  {
    id: 'muffin',
    name: 'Blueberry Muffin',
    description: 'Soft, fluffy muffin loaded with fresh blueberries',
    basePrice: 110,
    category: 'food'
  },
  {
    id: 'danish',
    name: 'Cheese Danish',
    description: 'Light pastry with creamy cheese filling',
    basePrice: 115,
    category: 'food'
  },
  {
    id: 'sandwich',
    name: 'Club Sandwich',
    description: 'Triple-layered sandwich with turkey, bacon, and fresh vegetables',
    basePrice: 220,
    category: 'food'
  },
  {
    id: 'avocado-toast',
    name: 'Avocado Toast',
    description: 'Sourdough bread with fresh avocado, seeds, and herbs',
    basePrice: 180,
    category: 'food'
  },
  {
    id: 'bagel',
    name: 'Everything Bagel',
    description: 'Toasted bagel with cream cheese and everything seasoning',
    basePrice: 130,
    category: 'food'
  }
];

export const categories = [
  { id: 'hot-coffee', name: 'Hot Coffee', icon: '☕' },
  { id: 'iced-coffee', name: 'Iced Coffee', icon: '🧊' },
  { id: 'non-coffee', name: 'Non-Coffee', icon: '🫖' },
  { id: 'food', name: 'Food & Pastries', icon: '🥐' }
];

export const addOnCategories = [
  { id: 'coffee', name: 'Coffee Options' },
  { id: 'milk', name: 'Milk Alternatives' },
  { id: 'syrup', name: 'Syrups & Flavors' },
  { id: 'extras', name: 'Extras' }
];