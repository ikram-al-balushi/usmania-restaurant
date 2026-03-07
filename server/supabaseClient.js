import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY ||
    SUPABASE_URL === 'your-supabase-url-here' ||
    SUPABASE_SERVICE_KEY === 'your-supabase-service-role-key-here') {
  console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env');
  process.exit(1);
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ─── Create tables if they don't exist ───
async function createTables() {
  const { error } = await supabase.rpc('exec_sql', {
    query: `
      CREATE TABLE IF NOT EXISTS menu (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        price NUMERIC NOT NULL,
        category TEXT NOT NULL,
        description TEXT DEFAULT '',
        image TEXT DEFAULT '',
        available BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        items JSONB NOT NULL,
        total NUMERIC DEFAULT 0,
        delivery_type TEXT DEFAULT 'dine-in',
        customer_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        address TEXT DEFAULT '',
        status TEXT DEFAULT 'confirmed',
        source TEXT DEFAULT 'web',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS reservations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        guests INTEGER DEFAULT 1,
        notes TEXT DEFAULT '',
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `
  });

  if (error) {
    // exec_sql RPC may not exist — fall back to individual table creation
    console.log('[Supabase] exec_sql RPC not available, creating tables individually...');
    await createTablesIndividually();
  } else {
    console.log('[Supabase] Tables ensured via RPC');
  }
}

async function createTablesIndividually() {
  // Try to select from each table — if it fails, table doesn't exist
  // Since we can't run DDL from the client, tables must be created via Supabase Dashboard
  const tables = ['menu', 'orders', 'reservations', 'settings'];
  const missing = [];

  for (const table of tables) {
    const { error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      missing.push(table);
    }
  }

  if (missing.length > 0) {
    console.error(`\n[Supabase] ERROR: The following tables are missing: ${missing.join(', ')}`);
    console.error('[Supabase] Please create them in Supabase Dashboard → SQL Editor.');
    console.error('[Supabase] Run this SQL:\n');
    console.error(getCreateTableSQL());
    process.exit(1);
  }

  console.log('[Supabase] All tables exist');
}

export function getCreateTableSQL() {
  return `
-- Menu table
CREATE TABLE IF NOT EXISTS menu (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  category TEXT NOT NULL,
  description TEXT DEFAULT '',
  image TEXT DEFAULT '',
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  items JSONB NOT NULL,
  total NUMERIC DEFAULT 0,
  delivery_type TEXT DEFAULT 'dine-in',
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT DEFAULT '',
  status TEXT DEFAULT 'confirmed',
  source TEXT DEFAULT 'web',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  guests INTEGER DEFAULT 1,
  notes TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Enable Row Level Security (allow all via service_role key)
ALTER TABLE menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Policies: allow service_role full access (anon read for menu)
CREATE POLICY "Allow public read menu" ON menu FOR SELECT USING (true);
CREATE POLICY "Allow service full access menu" ON menu FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service full access orders" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service full access reservations" ON reservations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service full access settings" ON settings FOR ALL USING (true) WITH CHECK (true);
  `.trim();
}

// ─── Create storage bucket for menu images ───
async function ensureStorageBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some(b => b.name === 'menu-images');

  if (!exists) {
    const { error } = await supabase.storage.createBucket('menu-images', {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024, // 5MB
    });
    if (error) {
      console.error('[Supabase] Failed to create menu-images bucket:', error.message);
    } else {
      console.log('[Supabase] Created menu-images storage bucket');
    }
  } else {
    console.log('[Supabase] menu-images bucket exists');
  }
}

// ─── Seed menu data if table is empty ───
async function seedMenuData() {
  const { count } = await supabase.from('menu').select('*', { count: 'exact', head: true });

  if (count === 0) {
    // Read from local JSON file
    const menuPath = path.join(__dirname, 'data', 'menu.json');
    if (fs.existsSync(menuPath)) {
      const menuData = JSON.parse(fs.readFileSync(menuPath, 'utf-8'));
      const rows = menuData.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        category: item.category,
        description: item.description || '',
        image: item.image || '',
        available: item.available !== false,
      }));

      const { error } = await supabase.from('menu').insert(rows);
      if (error) {
        console.error('[Supabase] Failed to seed menu:', error.message);
      } else {
        console.log(`[Supabase] Seeded menu with ${rows.length} items`);
      }
    } else {
      console.log('[Supabase] No local menu.json found for seeding');
    }
  } else {
    console.log(`[Supabase] Menu already has ${count} items`);
  }
}

// ─── Seed settings data if table is empty ───
async function seedSettingsData() {
  const { count } = await supabase.from('settings').select('*', { count: 'exact', head: true });

  if (count === 0) {
    const settingsPath = path.join(__dirname, 'data', 'settings.json');
    if (fs.existsSync(settingsPath)) {
      const settingsData = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      const rows = Object.entries(settingsData).map(([key, value]) => ({
        key,
        value: String(value),
      }));

      const { error } = await supabase.from('settings').insert(rows);
      if (error) {
        console.error('[Supabase] Failed to seed settings:', error.message);
      } else {
        console.log(`[Supabase] Seeded settings with ${rows.length} keys`);
      }
    } else {
      console.log('[Supabase] No local settings.json found for seeding');
    }
  } else {
    console.log(`[Supabase] Settings already has ${count} entries`);
  }
}

// ─── Main initialization ───
export async function initSupabase() {
  console.log('[Supabase] Initializing...');
  await createTables();
  await ensureStorageBucket();
  await seedMenuData();
  await seedSettingsData();
  console.log('[Supabase] Ready');
}
