import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');

export function readData(file) {
  const filePath = path.join(DATA_DIR, file);
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function writeData(file, data) {
  const filePath = path.join(DATA_DIR, file);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export function initData() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Seed menu
  if (!fs.existsSync(path.join(DATA_DIR, 'menu.json'))) {
    const menu = [
      {
        id: 1,
        name: "Chicken Biryani",
        price: 1200,
        category: "Biryani",
        description: "Aromatic basmati rice with tender chicken, saffron & spices",
        image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop",
        available: true
      },
      {
        id: 2,
        name: "Mutton Biryani",
        price: 1500,
        category: "Biryani",
        description: "Premium mutton layered with fragrant basmati rice",
        image: "https://images.unsplash.com/photo-1642821373181-696a54913e93?w=400&h=300&fit=crop",
        available: true
      },
      {
        id: 3,
        name: "Beef Biryani",
        price: 1400,
        category: "Biryani",
        description: "Slow-cooked beef with perfectly spiced basmati rice",
        image: "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=400&h=300&fit=crop",
        available: true
      },
      {
        id: 4,
        name: "Seekh Kabab",
        price: 500,
        category: "BBQ",
        description: "Minced beef kebabs grilled on charcoal skewers",
        image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop",
        available: true
      },
      {
        id: 5,
        name: "Chicken BBQ",
        price: 800,
        category: "BBQ",
        description: "Full chicken marinated and grilled to perfection",
        image: "https://images.unsplash.com/photo-1610057099443-fde6c99db7f6?w=400&h=300&fit=crop",
        available: true
      },
      {
        id: 6,
        name: "Chapli Kabab",
        price: 600,
        category: "BBQ",
        description: "Traditional Peshawari chapli kabab with spices",
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop",
        available: true
      },
      {
        id: 7,
        name: "Roti / Naan",
        price: 50,
        category: "Bread",
        description: "Freshly baked tandoori roti or naan",
        image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop",
        available: true
      },
      {
        id: 8,
        name: "Garlic Naan",
        price: 80,
        category: "Bread",
        description: "Buttery naan topped with fresh garlic and herbs",
        image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop",
        available: true
      },
      {
        id: 9,
        name: "Lassi",
        price: 200,
        category: "Drinks",
        description: "Traditional yogurt drink, sweet or salty",
        image: "https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=400&h=300&fit=crop",
        available: true
      },
      {
        id: 10,
        name: "Soft Drink",
        price: 150,
        category: "Drinks",
        description: "Chilled soft drink of your choice",
        image: "https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=400&h=300&fit=crop",
        available: true
      }
    ];
    writeData('menu.json', menu);
    console.log('[Data] Seeded menu.json with 10 items');
  }

  // Empty orders
  if (!fs.existsSync(path.join(DATA_DIR, 'orders.json'))) {
    writeData('orders.json', []);
    console.log('[Data] Created empty orders.json');
  }

  // Empty reservations
  if (!fs.existsSync(path.join(DATA_DIR, 'reservations.json'))) {
    writeData('reservations.json', []);
    console.log('[Data] Created empty reservations.json');
  }

  // Default settings
  if (!fs.existsSync(path.join(DATA_DIR, 'settings.json'))) {
    writeData('settings.json', {
      restaurantName: 'Usmania Restaurant',
      phone: '03323133978',
      email: 'ikrambaloch112001@gmail.com',
      address: 'Quetta, Balochistan',
      openingHours: '11:00 AM - 11:00 PM (Daily)',
      description: 'Premium Pakistani cuisine, BBQ & Biryani'
    });
    console.log('[Data] Created default settings.json');
  }

  console.log('[Data] Data store initialized');
}
