/**
 * Create new upsells for Beracah Cafe.
 * Run AFTER the SQL migration has been applied to sync menu items.
 *
 * Run: node scripts/create-upsells.mjs
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yjletxodujvomtmxqxwz.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqbGV0eG9kdWp2b210bXhxeHd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNTE4OTEsImV4cCI6MjA4OTYyNzg5MX0.Cd2-J3ReAhA-GHla6iWJ4EuRGQK_cSidjxs-CgRr2dA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function normalize(name) {
  return name.trim().toUpperCase().replace(/\s+/g, ' ');
}

async function main() {
  console.log('🚀 Creating upsells for Beracah Cafe\n');

  // 1. Fetch current menu items
  const { data: menuItems, error: fetchError } = await supabase
    .from('menu_items')
    .select('id, name, base_price, category')
    .order('name');

  if (fetchError) throw fetchError;
  console.log(`📋 Found ${menuItems.length} menu items\n`);

  // Helper to find item ID by name
  const findId = (name) => {
    const n = normalize(name);
    const item = menuItems.find(m => normalize(m.name) === n);
    return item?.id;
  };

  // Helper to find IDs by name list
  const findIds = (names) => names.map(n => findId(n)).filter(Boolean);

  // 2. Delete all existing upsells
  console.log('🗑️  Deleting existing upsells...');
  const { error: deleteError } = await supabase
    .from('upsells')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (deleteError) {
    console.error('Delete error:', deleteError.message);
    throw deleteError;
  }
  console.log('✅ Existing upsells cleared\n');

  // 3. Define upsells
  const allUpsells = [
    // ═══ BEST PAIR — triggered when customer adds a specific item ═══
    {
      type: 'best_pair',
      name: 'Add a Refreshing Drink?',
      description: 'Complete your meal with an ice-cold drink! Perfect pairing.',
      trigger_names: ['1 PC CHICKEN MEAL', '2 PC CHICKEN MEAL', 'BABY BACK RIBS', 'GRILLED PORK BELLY', 'LECHON KAWALI', 'PORK SISIG WITH EGG', 'BEEF TAPA WITH EGG'],
      offer_names: ['BLUE LEMONADE GLASS', 'LEMON ICED TEA GLASS', 'CUCUMBER LEMONADE GLASS', 'MANGO SHAKE'],
      discount_type: 'none',
      discount_value: 0,
      accept_label: 'Yes, Add Drink!',
      sort_order: 1,
    },
    {
      type: 'best_pair',
      name: 'Cool Down with a Shake!',
      description: 'Spicy wings pair perfectly with a cold, creamy shake.',
      trigger_names: ['SPICY BUFFALO WINGS', 'SPICY GARLIC BUTTER WINGS', 'GARLIC PARMESAN WINGS', 'SWEET & SOUR CHICKEN POPS'],
      offer_names: ['AVOCADO SHAKE', 'MANGO SHAKE', 'STRAWBERRY SHAKE', 'OREO SHAKE'],
      discount_type: 'percentage',
      discount_value: 10,
      accept_label: 'Add a Shake — 10% Off!',
      sort_order: 2,
    },
    {
      type: 'best_pair',
      name: 'Fries or Drink with Your Burger?',
      description: 'Make it a combo! Add fries or a cold drink.',
      trigger_names: ['BURGER REGULAR', 'BURGER WITH TLC'],
      offer_names: ['FLAVORED FRIES', 'BLUE LEMONADE GLASS', 'LEMON ICED TEA GLASS'],
      discount_type: 'none',
      discount_value: 0,
      accept_label: 'Add to My Order!',
      sort_order: 3,
    },
    {
      type: 'best_pair',
      name: 'Add Korean Sides to Your Ramen!',
      description: 'Level up your ramen with authentic Korean sides.',
      trigger_names: ['JIN RAMEN MILD', 'JIN RAMEN SPICY', 'SHIN RAMYUN 120G', 'NONGSHIM BEEF BULGOGI', 'NONGSHIM NEOGURI CUP 62G', 'SAMYANG BULDAK HOT CHICKEN 140G', 'SAMYANG BULDAK CARBONARA', 'SAMYANG BULDAK CHEESE', 'SAMYANG BULDAK CREAM CARBONARA', 'SAMYANG QUATTRO CHEESE', 'SAMYANG ROSE', 'OTTOGI CHEESE RAMEN', 'OTTOGI CHEESE RAMEN STIR-FRY', 'OTTOGI REAL CHEESE'],
      offer_names: ['KIMCHI', 'KOREAN SPAM', 'EGG', 'BIBIGO SEASONED SEAWEED 5G'],
      discount_type: 'none',
      discount_value: 0,
      accept_label: 'Add Korean Sides!',
      sort_order: 4,
    },
    {
      type: 'best_pair',
      name: 'Start with DonMac Coffee!',
      description: 'Nothing beats a hot meal paired with our signature coffee.',
      trigger_names: ['BACON WITH EGG', 'HUNGARIAN SAUSAGE WITH EGG', 'CHORIZO WITH EGG', 'KOREAN SPAM WITH EGG', 'BEEF TAPA WITH EGG'],
      offer_names: ['HOT BARAKO', 'HOT CARAMEL', 'BROWN SPANISH LATTE', 'CARAMEL MACCHIATOS'],
      discount_type: 'percentage',
      discount_value: 10,
      accept_label: 'Add Coffee — 10% Off!',
      sort_order: 5,
    },
    {
      type: 'best_pair',
      name: 'Pair It with a Snack?',
      description: 'Enjoy your coffee even more with a delicious snack!',
      trigger_names: ['BLACK FOREST', 'BROWN SPANISH LATTE', 'CARAMEL MACCHIATOS', 'DON DARKO', 'DON MATCHATOS', 'DONYA BERRY', 'MATCHA BERRY', 'OREO COFFEE', 'HOT BARAKO', 'HOT CARAMEL', 'HOT DARKO'],
      offer_names: ['SIOPAO', 'SIOMAI', 'BURGER REGULAR'],
      discount_type: 'none',
      discount_value: 0,
      accept_label: 'Add a Snack!',
      sort_order: 6,
    },
    {
      type: 'best_pair',
      name: 'Top It Off with Ice Cream!',
      description: 'Make your dessert game strong — add ice cream!',
      trigger_names: ['HALO-HALO', 'MAIS CON YELO', 'AVOCADO SHAKE', 'DRAGON FRUIT SHAKE', 'MANGO SHAKE', 'OREO SHAKE', 'STRAWBERRY SHAKE'],
      offer_names: ['ICE CREAM SMALL', 'ICE CREAM SUNDAE WITH 1 TOPPING'],
      discount_type: 'none',
      discount_value: 0,
      accept_label: 'Yes, Add Ice Cream!',
      sort_order: 7,
    },
    {
      type: 'best_pair',
      name: 'Need Extra Rice?',
      description: 'Your meal deserves more rice! Only ₱25.',
      trigger_names: ['1 PC CHICKEN MEAL', '2 PC CHICKEN MEAL', 'CHICKEN POPS', 'CHICKEN SKIN CRUNCH', 'PORK SISIG WITH EGG', 'GRILLED PORK BELLY', 'LECHON KAWALI', 'BABY BACK RIBS', 'BEEF TAPA WITH EGG', 'BACON WITH EGG', 'HUNGARIAN SAUSAGE WITH EGG', 'CHORIZO WITH EGG', 'KOREAN SPAM WITH EGG'],
      offer_names: ['EXTRA RICE'],
      discount_type: 'none',
      discount_value: 0,
      accept_label: 'Add Extra Rice!',
      sort_order: 8,
    },

    // ═══ UPGRADE MEAL — suggest upgrading to a better version ═══
    {
      type: 'upgrade_meal',
      name: 'Upgrade to 2 PC Chicken Meal!',
      description: 'For just ₱50 more, double the chicken! Great value.',
      trigger_names: ['1 PC CHICKEN MEAL'],
      offer_names: ['2 PC CHICKEN MEAL'],
      discount_type: 'none',
      discount_value: 0,
      accept_label: 'Upgrade for ₱50!',
      sort_order: 100,
    },
    {
      type: 'upgrade_meal',
      name: 'Go for Burger with Fries!',
      description: 'Upgrade your burger to include crispy fries — a classic combo!',
      trigger_names: ['BURGER REGULAR'],
      offer_names: ['BURGER WITH FRIES'],
      discount_type: 'none',
      discount_value: 0,
      accept_label: 'Upgrade to Burger + Fries!',
      sort_order: 101,
    },
    {
      type: 'upgrade_meal',
      name: 'Try a Pitcher Instead!',
      description: 'Sharing? Grab the pitcher — way more value for groups!',
      trigger_names: ['BLUE LEMONADE GLASS', 'LEMON ICED TEA GLASS', 'CUCUMBER LEMONADE GLASS'],
      offer_names: ['BLUE LEMONADE PITCHER', 'LEMON ICED TEA PITCHER', 'CUCUMBER LEMONADE PITCHER'],
      discount_type: 'none',
      discount_value: 0,
      accept_label: 'Get the Pitcher!',
      sort_order: 102,
    },

    // ═══ BEFORE YOU GO — shown at checkout ═══
    {
      type: 'before_you_go',
      name: "Don't Forget Dessert!",
      description: 'Treat yourself! Grab halo-halo or a refreshing shake before you go.',
      trigger_names: [],
      offer_names: ['HALO-HALO', 'MAIS CON YELO', 'AVOCADO SHAKE', 'MANGO SHAKE', 'ICE CREAM SUNDAE WITH 1 TOPPING'],
      discount_type: 'percentage',
      discount_value: 5,
      accept_label: 'Add Dessert — 5% Off!',
      sort_order: 200,
    },
    {
      type: 'before_you_go',
      name: 'Add a DonMac Coffee?',
      description: 'Our signature coffee for only ₱39! A perfect finish to your order.',
      trigger_names: [],
      offer_names: ['DON DARKO', 'BROWN SPANISH LATTE', 'CARAMEL MACCHIATOS', 'DON MATCHATOS', 'OREO COFFEE', 'DONYA BERRY', 'BLACK FOREST'],
      discount_type: 'none',
      discount_value: 0,
      accept_label: 'Add Coffee for ₱39!',
      sort_order: 201,
    },
    {
      type: 'before_you_go',
      name: 'Grab Some Korean Ramen!',
      description: 'Take home some premium Korean ramen — perfect for a midnight snack!',
      trigger_names: [],
      offer_names: ['SHIN RAMYUN 120G', 'SAMYANG BULDAK HOT CHICKEN 140G', 'JIN RAMEN SPICY', 'SAMYANG ROSE'],
      discount_type: 'none',
      discount_value: 0,
      accept_label: 'Add Ramen to My Order!',
      sort_order: 202,
    },
  ];

  // 4. Create upsells
  console.log('Creating upsells...\n');
  let created = 0;
  let skipped = 0;

  for (const upsell of allUpsells) {
    const triggerIds = upsell.trigger_names.length > 0 ? findIds(upsell.trigger_names) : [];
    const offerIds = findIds(upsell.offer_names);

    if (offerIds.length === 0) {
      console.log(`  ⚠️  Skip "${upsell.name}" — no offer items found`);
      skipped++;
      continue;
    }

    if (upsell.type !== 'before_you_go' && triggerIds.length === 0) {
      console.log(`  ⚠️  Skip "${upsell.name}" — no trigger items found`);
      skipped++;
      continue;
    }

    const { error } = await supabase.from('upsells').insert({
      type: upsell.type,
      name: upsell.name,
      description: upsell.description,
      trigger_item_ids: triggerIds,
      offer_item_ids: offerIds,
      discount_type: upsell.discount_type,
      discount_value: upsell.discount_value,
      active: true,
      sort_order: upsell.sort_order,
      skip_label: 'No, thanks',
      accept_label: upsell.accept_label,
    });

    if (error) {
      console.error(`  ❌ "${upsell.name}":`, error.message);
      skipped++;
    } else {
      const icon = upsell.type === 'best_pair' ? '🍔' : upsell.type === 'upgrade_meal' ? '⬆️' : '🛒';
      console.log(`  ${icon} [${upsell.type}] "${upsell.name}" — ${triggerIds.length} triggers → ${offerIds.length} offers`);
      created++;
    }
  }

  console.log(`\n✅ Done! Created ${created} upsells (${skipped} skipped)`);

  // 5. Verify
  const { data: final } = await supabase.from('upsells').select('id, type, name').order('sort_order');
  console.log(`\n📋 Final upsells (${final?.length || 0}):`);
  for (const u of final || []) {
    console.log(`   [${u.type}] ${u.name}`);
  }
}

main().catch(err => {
  console.error('❌ Fatal:', err);
  process.exit(1);
});
