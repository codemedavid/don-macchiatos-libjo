/**
 * Sync menu items from ITEM-LIST-2026-3.xls and create new upsells.
 *
 * Run: node scripts/sync-menu-and-upsells.mjs
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yjletxodujvomtmxqxwz.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqbGV0eG9kdWp2b210bXhxeHd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNTE4OTEsImV4cCI6MjA4OTYyNzg5MX0.Cd2-J3ReAhA-GHla6iWJ4EuRGQK_cSidjxs-CgRr2dA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Excel items parsed from ITEM-LIST-2026-3.xls ──────────────────────────
const EXCEL_ITEMS = [
  // MEALS
  { name: '1 PC CHICKEN MEAL', price: 140, excelCategory: 'MEALS' },
  { name: '2 PC CHICKEN MEAL', price: 190, excelCategory: 'MEALS' },
  { name: 'BABY BACK RIBS', price: 295, excelCategory: 'MEALS' },
  { name: 'BACON WITH EGG', price: 110, excelCategory: 'MEALS' },
  { name: 'BEEF TAPA WITH EGG', price: 150, excelCategory: 'MEALS' },
  { name: 'CHICKEN POPS', price: 140, excelCategory: 'MEALS' },
  { name: 'CHICKEN SKIN CRUNCH', price: 120, excelCategory: 'MEALS' },
  { name: 'CHORIZO WITH EGG', price: 120, excelCategory: 'MEALS' },
  { name: 'GARLIC PARMESAN WINGS', price: 190, excelCategory: 'MEALS' },
  { name: 'GRILLED PORK BELLY', price: 160, excelCategory: 'MEALS' },
  { name: 'HUNGARIAN SAUSAGE WITH EGG', price: 120, excelCategory: 'MEALS' },
  { name: 'KOREAN SPAM WITH EGG', price: 120, excelCategory: 'MEALS' },
  { name: 'LECHON KAWALI', price: 160, excelCategory: 'MEALS' },
  { name: 'PORK SISIG WITH EGG', price: 140, excelCategory: 'MEALS' },
  { name: 'SPICY BUFFALO WINGS', price: 190, excelCategory: 'MEALS' },
  { name: 'SPICY GARLIC BUTTER WINGS', price: 190, excelCategory: 'MEALS' },
  { name: 'SWEET & SOUR CHICKEN POPS', price: 170, excelCategory: 'MEALS' },

  // DONMAC COFFEE
  { name: 'BLACK FOREST', price: 39, excelCategory: 'DONMAC COFFEE' },
  { name: 'BROWN SPANISH LATTE', price: 39, excelCategory: 'DONMAC COFFEE' },
  { name: 'CARAMEL MACCHIATOS', price: 39, excelCategory: 'DONMAC COFFEE' },
  { name: 'DON DARKO', price: 39, excelCategory: 'DONMAC COFFEE' },
  { name: 'DON MATCHATOS', price: 39, excelCategory: 'DONMAC COFFEE' },
  { name: 'DONYA BERRY', price: 39, excelCategory: 'DONMAC COFFEE' },
  { name: 'HOT BARAKO', price: 39, excelCategory: 'DONMAC COFFEE' },
  { name: 'HOT CARAMEL', price: 39, excelCategory: 'DONMAC COFFEE' },
  { name: 'HOT DARKO', price: 39, excelCategory: 'DONMAC COFFEE' },
  { name: 'MATCHA BERRY', price: 39, excelCategory: 'DONMAC COFFEE' },
  { name: 'OREO COFFEE', price: 39, excelCategory: 'DONMAC COFFEE' },

  // NON-COFFEE DRINKS
  { name: 'BLUE LEMONADE GLASS', price: 25, excelCategory: 'NON-COFFEE DRINKS' },
  { name: 'BLUE LEMONADE PITCHER', price: 69, excelCategory: 'NON-COFFEE DRINKS' },
  { name: 'CUCUMBER LEMONADE GLASS', price: 25, excelCategory: 'NON-COFFEE DRINKS' },
  { name: 'CUCUMBER LEMONADE PITCHER', price: 69, excelCategory: 'NON-COFFEE DRINKS' },
  { name: 'JUICE 8OZ', price: 10, excelCategory: 'NON-COFFEE DRINKS' },
  { name: 'LEMOM ICED TEA PITCHER', price: 69, excelCategory: 'NON-COFFEE DRINKS' },
  { name: 'LEMON ICED TEA GLASS', price: 25, excelCategory: 'NON-COFFEE DRINKS' },

  // SHAKES & HALO-HALO
  { name: 'AVOCADO SHAKE', price: 74, excelCategory: 'SHAKES & HALO-HALO' },
  { name: 'DRAGON FRUIT SHAKE', price: 74, excelCategory: 'SHAKES & HALO-HALO' },
  { name: 'HALO-HALO', price: 99, excelCategory: 'SHAKES & HALO-HALO' },
  { name: 'MAIS CON YELO', price: 79, excelCategory: 'SHAKES & HALO-HALO' },
  { name: 'MANGO SHAKE', price: 69, excelCategory: 'SHAKES & HALO-HALO' },
  { name: 'OREO SHAKE', price: 69, excelCategory: 'SHAKES & HALO-HALO' },
  { name: 'STRAWBERRY SHAKE', price: 69, excelCategory: 'SHAKES & HALO-HALO' },

  // SNACKS
  { name: 'BURGER REGULAR', price: 53, excelCategory: 'SNACKS' },
  { name: 'BURGER WITH FRIES', price: 75, excelCategory: 'SNACKS' },
  { name: 'BURGER WITH TLC', price: 62, excelCategory: 'SNACKS' },
  { name: 'FLAVORED FRIES', price: 69, excelCategory: 'SNACKS' },
  { name: 'SIOMAI', price: 35, excelCategory: 'SNACKS' },
  { name: 'SIOPAO', price: 39, excelCategory: 'SNACKS' },

  // ADD ONS
  { name: 'BIBIGO SEASONED SEAWEED 5G', price: 38, excelCategory: 'ADD ONS' },
  { name: 'DM KETCHUP', price: 3, excelCategory: 'ADD ONS' },
  { name: 'EGG', price: 15, excelCategory: 'ADD ONS' },
  { name: 'EXTRA RICE', price: 25, excelCategory: 'ADD ONS' },
  { name: 'KIMCHI', price: 20, excelCategory: 'ADD ONS' },
  { name: 'KOREAN SPAM', price: 20, excelCategory: 'ADD ONS' },
  { name: 'NAMKWANG SEAWEEDS 4G', price: 38, excelCategory: 'ADD ONS' },

  // ICE CREAM
  { name: 'ICE CREAM SMALL', price: 30, excelCategory: 'ICE CREAM' },
  { name: 'ICE CREAM SUGAR CONE LARGE', price: 30, excelCategory: 'ICE CREAM' },
  { name: 'ICE CREAM SUNDAE ( TOPPINGS)', price: 5, excelCategory: 'ICE CREAM' },
  { name: 'ICE CREAM SUNDAE WITH 1 TOPPING', price: 40, excelCategory: 'ICE CREAM' },

  // DIY RAMEN
  { name: 'JIN RAMEN MILD', price: 75, excelCategory: 'DIY RAMEN' },
  { name: 'JIN RAMEN SPICY', price: 75, excelCategory: 'DIY RAMEN' },
  { name: 'NONGSHIM BEEF BULGOGI', price: 95, excelCategory: 'DIY RAMEN' },
  { name: 'NONGSHIM NEOGURI CUP 62G', price: 85, excelCategory: 'DIY RAMEN' },
  { name: 'OTTOGI CHEESE RAMEN', price: 90, excelCategory: 'DIY RAMEN' },
  { name: 'OTTOGI CHEESE RAMEN STIR-FRY', price: 95, excelCategory: 'DIY RAMEN' },
  { name: 'OTTOGI REAL CHEESE', price: 100, excelCategory: 'DIY RAMEN' },
  { name: 'SAMYANG BULDAK CARBONARA', price: 100, excelCategory: 'DIY RAMEN' },
  { name: 'SAMYANG BULDAK CHEESE', price: 100, excelCategory: 'DIY RAMEN' },
  { name: 'SAMYANG BULDAK CREAM CARBONARA', price: 100, excelCategory: 'DIY RAMEN' },
  { name: 'SAMYANG BULDAK HOT CHICKEN 140G', price: 95, excelCategory: 'DIY RAMEN' },
  { name: 'SAMYANG QUATTRO CHEESE', price: 100, excelCategory: 'DIY RAMEN' },
  { name: 'SAMYANG ROSE', price: 98, excelCategory: 'DIY RAMEN' },
  { name: 'SHIN RAMYUN 120G', price: 85, excelCategory: 'DIY RAMEN' },
];

// ─── Map Excel categories → DB category IDs ────────────────────────────────
const CATEGORY_MAP = {
  'MEALS': 'food',
  'DONMAC COFFEE': 'iced-coffee',       // most DonMac drinks are iced; hot ones get 'hot-coffee'
  'NON-COFFEE DRINKS': 'non-coffee',
  'SHAKES & HALO-HALO': 'frappe-and-shakes',
  'SNACKS': 'other-snacks',
  'ADD ONS': 'add-ons',
  'ICE CREAM': 'frappe-and-shakes',     // ice cream falls under shakes/frappes category
  'DIY RAMEN': 'diy-korean-ramen',
};

function getDbCategory(item) {
  // Hot coffee items go to hot-coffee category
  if (item.excelCategory === 'DONMAC COFFEE' && item.name.startsWith('HOT ')) {
    return 'hot-coffee';
  }
  return CATEGORY_MAP[item.excelCategory] || item.excelCategory.toLowerCase();
}

function normalize(name) {
  return name.trim().toUpperCase().replace(/\s+/g, ' ');
}

// ─── STEP 1: Sync menu items ───────────────────────────────────────────────
async function syncMenuItems() {
  console.log('═══ STEP 1: Syncing menu items ═══\n');

  // Fetch all current DB items
  const { data: dbItems, error: fetchError } = await supabase
    .from('menu_items')
    .select('id, name, base_price, category')
    .order('sort_order', { ascending: true });

  if (fetchError) throw fetchError;

  console.log(`Current DB items: ${dbItems.length}`);
  console.log(`Excel items: ${EXCEL_ITEMS.length}\n`);

  // Build lookup of Excel item names (normalized)
  const excelNameSet = new Set(EXCEL_ITEMS.map(e => normalize(e.name)));
  const excelByName = new Map(EXCEL_ITEMS.map(e => [normalize(e.name), e]));

  // Find items to DELETE (in DB but NOT in Excel)
  const toDelete = dbItems.filter(db => !excelNameSet.has(normalize(db.name)));
  console.log(`Items to DELETE (not in Excel): ${toDelete.length}`);
  for (const item of toDelete) {
    console.log(`  ❌ ${item.name} (${item.category}) — ₱${item.base_price}`);
  }

  // Find items to INSERT (in Excel but NOT in DB)
  const dbNameSet = new Set(dbItems.map(db => normalize(db.name)));
  const toInsert = EXCEL_ITEMS.filter(e => !dbNameSet.has(normalize(e.name)));
  console.log(`\nItems to INSERT (new from Excel): ${toInsert.length}`);
  for (const item of toInsert) {
    console.log(`  ✅ ${item.name} (${item.excelCategory}) — ₱${item.price}`);
  }

  // Find items to UPDATE (price or category changed)
  const toUpdate = [];
  for (const db of dbItems) {
    const excel = excelByName.get(normalize(db.name));
    if (excel) {
      const newCategory = getDbCategory(excel);
      if (db.base_price !== excel.price || db.category !== newCategory) {
        toUpdate.push({ id: db.id, name: db.name, base_price: excel.price, category: newCategory, oldPrice: db.base_price, oldCategory: db.category });
      }
    }
  }
  console.log(`\nItems to UPDATE (price/category change): ${toUpdate.length}`);
  for (const item of toUpdate) {
    console.log(`  🔄 ${item.name}: ₱${item.oldPrice}→₱${item.base_price}, ${item.oldCategory}→${item.category}`);
  }

  // Execute DELETE
  if (toDelete.length > 0) {
    const deleteIds = toDelete.map(d => d.id);
    // Delete related data first (variations, serving_preferences, add_ons depend on menu_item_id)
    for (const table of ['variations', 'serving_preferences', 'add_ons']) {
      const { error } = await supabase.from(table).delete().in('menu_item_id', deleteIds);
      if (error) console.warn(`  Warning deleting from ${table}:`, error.message);
    }
    const { error } = await supabase.from('menu_items').delete().in('id', deleteIds);
    if (error) throw error;
    console.log(`\n✅ Deleted ${toDelete.length} items`);
  }

  // Execute UPDATE
  for (const item of toUpdate) {
    const { error } = await supabase
      .from('menu_items')
      .update({ base_price: item.base_price, category: item.category })
      .eq('id', item.id);
    if (error) throw error;
  }
  if (toUpdate.length > 0) console.log(`✅ Updated ${toUpdate.length} items`);

  // Execute INSERT
  const maxSortOrder = Math.max(...dbItems.map(i => i.sort_order ?? 0), 0);
  for (let i = 0; i < toInsert.length; i++) {
    const item = toInsert[i];
    const { error } = await supabase.from('menu_items').insert({
      name: item.name,
      description: '',
      base_price: item.price,
      category: getDbCategory(item),
      popular: false,
      available: true,
      sort_order: maxSortOrder + i + 1,
    });
    if (error) throw error;
  }
  if (toInsert.length > 0) console.log(`✅ Inserted ${toInsert.length} items`);

  // Return the final menu items for upsell creation
  const { data: finalItems, error: finalError } = await supabase
    .from('menu_items')
    .select('id, name, base_price, category')
    .order('sort_order', { ascending: true });
  if (finalError) throw finalError;
  console.log(`\n📋 Final menu count: ${finalItems.length} items\n`);
  return finalItems;
}

// ─── STEP 2: Delete all existing upsells ────────────────────────────────────
async function deleteAllUpsells() {
  console.log('═══ STEP 2: Deleting existing upsells ═══\n');
  const { data: existing } = await supabase.from('upsells').select('id, name');
  console.log(`Existing upsells to delete: ${existing?.length || 0}`);
  for (const u of existing || []) {
    console.log(`  🗑️  ${u.name}`);
  }

  const { error } = await supabase.from('upsells').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw error;
  console.log('✅ All upsells deleted\n');
}

// ─── STEP 3: Create smart upsells ──────────────────────────────────────────
async function createUpsells(menuItems) {
  console.log('═══ STEP 3: Creating new upsells ═══\n');

  // Helper to find item IDs by name patterns
  const findIds = (patterns) => {
    return menuItems
      .filter(m => patterns.some(p => normalize(m.name).includes(normalize(p))))
      .map(m => m.id);
  };

  const findId = (name) => {
    const item = menuItems.find(m => normalize(m.name) === normalize(name));
    return item?.id;
  };

  const findIdsByCategory = (cat) => menuItems.filter(m => m.category === cat).map(m => m.id);

  // ─── BEST PAIR upsells (triggered when adding a specific item) ────────

  const bestPairUpsells = [
    // Meal + Drink pairings
    {
      name: 'Add a Refreshing Drink?',
      description: 'Complete your meal with an ice-cold drink! Perfect pairing.',
      trigger_names: ['1 PC CHICKEN MEAL', '2 PC CHICKEN MEAL', 'BABY BACK RIBS', 'GRILLED PORK BELLY', 'LECHON KAWALI', 'PORK SISIG WITH EGG', 'BEEF TAPA WITH EGG'],
      offer_names: ['BLUE LEMONADE GLASS', 'LEMON ICED TEA GLASS', 'CUCUMBER LEMONADE GLASS', 'MANGO SHAKE'],
      discount_type: 'none',
      discount_value: 0,
      accept_label: 'Yes, Add Drink!',
    },
    // Wings + Shake pairing
    {
      name: 'Cool Down with a Shake!',
      description: 'Spicy wings are best with a cold, creamy shake on the side.',
      trigger_names: ['SPICY BUFFALO WINGS', 'SPICY GARLIC BUTTER WINGS', 'GARLIC PARMESAN WINGS', 'SWEET & SOUR CHICKEN POPS'],
      offer_names: ['AVOCADO SHAKE', 'MANGO SHAKE', 'STRAWBERRY SHAKE', 'OREO SHAKE'],
      discount_type: 'percentage',
      discount_value: 10,
      accept_label: 'Add a Shake — 10% Off!',
    },
    // Burger + Fries/Drink combo
    {
      name: 'Fries or Drink with Your Burger?',
      description: 'Make it a combo! Add fries or a cold drink.',
      trigger_names: ['BURGER REGULAR', 'BURGER WITH TLC'],
      offer_names: ['FLAVORED FRIES', 'BLUE LEMONADE GLASS', 'LEMON ICED TEA GLASS'],
      discount_type: 'none',
      discount_value: 0,
      accept_label: 'Add to My Order!',
    },
    // Ramen + Korean side
    {
      name: 'Add Korean Sides to Your Ramen!',
      description: 'Level up your ramen with authentic Korean sides.',
      trigger_names: ['JIN RAMEN MILD', 'JIN RAMEN SPICY', 'SHIN RAMYUN 120G', 'NONGSHIM BEEF BULGOGI', 'NONGSHIM NEOGURI CUP 62G', 'SAMYANG BULDAK HOT CHICKEN 140G', 'SAMYANG BULDAK CARBONARA', 'SAMYANG BULDAK CHEESE', 'SAMYANG BULDAK CREAM CARBONARA', 'SAMYANG QUATTRO CHEESE', 'SAMYANG ROSE', 'OTTOGI CHEESE RAMEN', 'OTTOGI CHEESE RAMEN STIR-FRY', 'OTTOGI REAL CHEESE'],
      offer_names: ['KIMCHI', 'KOREAN SPAM', 'EGG', 'BIBIGO SEASONED SEAWEED 5G'],
      discount_type: 'none',
      discount_value: 0,
      accept_label: 'Add Korean Sides!',
    },
    // Breakfast meal + Coffee
    {
      name: 'Start with DonMac Coffee!',
      description: 'Nothing beats a hot meal paired with our signature coffee.',
      trigger_names: ['BACON WITH EGG', 'HUNGARIAN SAUSAGE WITH EGG', 'CHORIZO WITH EGG', 'KOREAN SPAM WITH EGG', 'BEEF TAPA WITH EGG'],
      offer_names: ['HOT BARAKO', 'HOT CARAMEL', 'BROWN SPANISH LATTE', 'CARAMEL MACCHIATOS'],
      discount_type: 'percentage',
      discount_value: 10,
      accept_label: 'Add Coffee — 10% Off!',
    },
    // Coffee + Snack pairing
    {
      name: 'Pair It with a Snack?',
      description: 'Enjoy your coffee even more with a delicious snack!',
      trigger_names: ['BLACK FOREST', 'BROWN SPANISH LATTE', 'CARAMEL MACCHIATOS', 'DON DARKO', 'DON MATCHATOS', 'DONYA BERRY', 'MATCHA BERRY', 'OREO COFFEE', 'HOT BARAKO', 'HOT CARAMEL', 'HOT DARKO'],
      offer_names: ['SIOPAO', 'SIOMAI', 'BURGER REGULAR'],
      discount_type: 'none',
      discount_value: 0,
      accept_label: 'Add a Snack!',
    },
    // Shake + Ice cream
    {
      name: 'Top It Off with Ice Cream!',
      description: 'Make your dessert game strong — add ice cream!',
      trigger_names: ['HALO-HALO', 'MAIS CON YELO', 'AVOCADO SHAKE', 'DRAGON FRUIT SHAKE', 'MANGO SHAKE', 'OREO SHAKE', 'STRAWBERRY SHAKE'],
      offer_names: ['ICE CREAM SMALL', 'ICE CREAM SUNDAE WITH 1 TOPPING'],
      discount_type: 'none',
      discount_value: 0,
      accept_label: 'Yes, Add Ice Cream!',
    },
    // Chicken + Extra Rice
    {
      name: 'Need Extra Rice?',
      description: 'Your meal deserves more rice! Add an extra cup.',
      trigger_names: ['1 PC CHICKEN MEAL', '2 PC CHICKEN MEAL', 'CHICKEN POPS', 'CHICKEN SKIN CRUNCH', 'PORK SISIG WITH EGG', 'GRILLED PORK BELLY', 'LECHON KAWALI', 'BABY BACK RIBS'],
      offer_names: ['EXTRA RICE'],
      discount_type: 'none',
      discount_value: 0,
      accept_label: 'Add Extra Rice!',
    },
  ];

  // ─── UPGRADE MEAL upsells ─────────────────────────────────────────────

  const upgradeMealUpsells = [
    {
      name: 'Upgrade to 2 PC Chicken Meal!',
      description: 'For just ₱50 more, double the chicken! Great value.',
      trigger_names: ['1 PC CHICKEN MEAL'],
      offer_names: ['2 PC CHICKEN MEAL'],
      discount_type: 'none',
      discount_value: 0,
      accept_label: 'Upgrade for ₱50!',
    },
    {
      name: 'Go for Burger with Fries!',
      description: 'Upgrade your burger to include crispy fries — a classic combo!',
      trigger_names: ['BURGER REGULAR'],
      offer_names: ['BURGER WITH FRIES'],
      discount_type: 'none',
      discount_value: 0,
      accept_label: 'Upgrade to Burger + Fries!',
    },
    {
      name: 'Try a Pitcher Instead!',
      description: 'Sharing? Grab the pitcher — way more value for groups!',
      trigger_names: ['BLUE LEMONADE GLASS', 'LEMON ICED TEA GLASS', 'CUCUMBER LEMONADE GLASS'],
      offer_names: ['BLUE LEMONADE PITCHER', 'LEMOM ICED TEA PITCHER', 'CUCUMBER LEMONADE PITCHER'],
      discount_type: 'none',
      discount_value: 0,
      accept_label: 'Get the Pitcher!',
    },
  ];

  // ─── BEFORE YOU GO upsells (shown at checkout) ────────────────────────

  const beforeYouGoUpsells = [
    {
      name: 'Don\'t Forget Dessert!',
      description: 'Treat yourself! Grab halo-halo or a refreshing shake before you go.',
      trigger_names: [],
      offer_names: ['HALO-HALO', 'MAIS CON YELO', 'AVOCADO SHAKE', 'MANGO SHAKE', 'ICE CREAM SUNDAE WITH 1 TOPPING'],
      discount_type: 'percentage',
      discount_value: 5,
      accept_label: 'Add Dessert — 5% Off!',
    },
    {
      name: 'Add a DonMac Coffee?',
      description: 'Our signature coffee for only ₱39! A perfect finish to your order.',
      trigger_names: [],
      offer_names: ['DON DARKO', 'BROWN SPANISH LATTE', 'CARAMEL MACCHIATOS', 'DON MATCHATOS', 'OREO COFFEE', 'DONYA BERRY', 'BLACK FOREST'],
      discount_type: 'none',
      discount_value: 0,
      accept_label: 'Add Coffee for ₱39!',
    },
    {
      name: 'Grab Some Korean Ramen!',
      description: 'Take home some premium Korean ramen — perfect for a midnight snack!',
      trigger_names: [],
      offer_names: ['SHIN RAMYUN 120G', 'SAMYANG BULDAK HOT CHICKEN 140G', 'JIN RAMEN SPICY', 'SAMYANG ROSE'],
      discount_type: 'none',
      discount_value: 0,
      accept_label: 'Add Ramen to My Order!',
    },
  ];

  // Build all upsells
  const allUpsells = [
    ...bestPairUpsells.map((u, i) => ({ ...u, type: 'best_pair', sort_order: i + 1 })),
    ...upgradeMealUpsells.map((u, i) => ({ ...u, type: 'upgrade_meal', sort_order: i + 100 })),
    ...beforeYouGoUpsells.map((u, i) => ({ ...u, type: 'before_you_go', sort_order: i + 200 })),
  ];

  let created = 0;
  let skipped = 0;

  for (const upsell of allUpsells) {
    const triggerIds = upsell.trigger_names.length > 0
      ? upsell.trigger_names.map(n => findId(n)).filter(Boolean)
      : [];
    const offerIds = upsell.offer_names.map(n => findId(n)).filter(Boolean);

    // Skip if no offer items resolved (all names might have been removed)
    if (offerIds.length === 0) {
      console.log(`  ⚠️  Skipping "${upsell.name}" — no offer items found`);
      skipped++;
      continue;
    }

    // For best_pair and upgrade_meal, skip if no trigger items
    if (upsell.type !== 'before_you_go' && triggerIds.length === 0) {
      console.log(`  ⚠️  Skipping "${upsell.name}" — no trigger items found`);
      skipped++;
      continue;
    }

    const { error } = await supabase.from('upsells').insert({
      type: upsell.type,
      name: upsell.name,
      description: upsell.description,
      trigger_item_ids: triggerIds,
      offer_item_ids: offerIds,
      discount_type: upsell.discount_type || 'none',
      discount_value: upsell.discount_value || 0,
      active: true,
      sort_order: upsell.sort_order,
      skip_label: 'No, thanks',
      accept_label: upsell.accept_label || 'Add to Order',
    });

    if (error) {
      console.error(`  ❌ Failed to create "${upsell.name}":`, error.message);
    } else {
      const icon = upsell.type === 'best_pair' ? '🍔' : upsell.type === 'upgrade_meal' ? '⬆️' : '🛒';
      console.log(`  ${icon} ${upsell.type}: "${upsell.name}" — ${triggerIds.length} triggers, ${offerIds.length} offers`);
      created++;
    }
  }

  console.log(`\n✅ Created ${created} upsells (${skipped} skipped)\n`);
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Beracah Cafe — Menu & Upsell Sync\n');
  console.log('════════════════════════════════════════\n');

  try {
    const menuItems = await syncMenuItems();
    await deleteAllUpsells();
    await createUpsells(menuItems);

    console.log('════════════════════════════════════════');
    console.log('✅ All done! Menu synced and upsells created.');
    console.log('════════════════════════════════════════\n');
  } catch (err) {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  }
}

main();
