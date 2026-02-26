-- =============================================
-- DISABLE RLS ON ALL TABLES & DROP ALL POLICIES
-- =============================================

BEGIN;

-- ============ menu_items ============
DROP POLICY IF EXISTS "Anyone can read menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Authenticated users can manage menu items" ON public.menu_items;
ALTER TABLE public.menu_items DISABLE ROW LEVEL SECURITY;

-- ============ variations ============
DROP POLICY IF EXISTS "Anyone can read variations" ON public.variations;
DROP POLICY IF EXISTS "Authenticated users can manage variations" ON public.variations;
ALTER TABLE public.variations DISABLE ROW LEVEL SECURITY;

-- ============ add_ons ============
DROP POLICY IF EXISTS "Anyone can read add-ons" ON public.add_ons;
DROP POLICY IF EXISTS "Authenticated users can manage add-ons" ON public.add_ons;
ALTER TABLE public.add_ons DISABLE ROW LEVEL SECURITY;

-- ============ categories ============
DROP POLICY IF EXISTS "Anyone can read categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can manage categories" ON public.categories;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;

-- ============ promotional_banners ============
DROP POLICY IF EXISTS "Anyone can read active banners" ON public.promotional_banners;
DROP POLICY IF EXISTS "Authenticated users can manage banners" ON public.promotional_banners;
ALTER TABLE public.promotional_banners DISABLE ROW LEVEL SECURITY;

-- ============ serving_preferences ============
DROP POLICY IF EXISTS "Anyone can read serving preferences" ON public.serving_preferences;
DROP POLICY IF EXISTS "Authenticated users can manage serving preferences" ON public.serving_preferences;
ALTER TABLE public.serving_preferences DISABLE ROW LEVEL SECURITY;

-- ============ upsells ============
DROP POLICY IF EXISTS "Anyone can read upsells" ON public.upsells;
DROP POLICY IF EXISTS "Authenticated users can manage upsells" ON public.upsells;
DROP POLICY IF EXISTS "Anon users can insert upsells" ON public.upsells;
DROP POLICY IF EXISTS "Anon users can update upsells" ON public.upsells;
DROP POLICY IF EXISTS "Anon users can delete upsells" ON public.upsells;
ALTER TABLE public.upsells DISABLE ROW LEVEL SECURITY;

-- ============ bundles ============
DROP POLICY IF EXISTS "Anyone can read bundles" ON public.bundles;
DROP POLICY IF EXISTS "Authenticated users can manage bundles" ON public.bundles;
DROP POLICY IF EXISTS "Anon users can insert bundles" ON public.bundles;
DROP POLICY IF EXISTS "Anon users can update bundles" ON public.bundles;
DROP POLICY IF EXISTS "Anon users can delete bundles" ON public.bundles;
ALTER TABLE public.bundles DISABLE ROW LEVEL SECURITY;

-- ============ bundle_items ============
DROP POLICY IF EXISTS "Anyone can read bundle_items" ON public.bundle_items;
DROP POLICY IF EXISTS "Authenticated users can manage bundle_items" ON public.bundle_items;
DROP POLICY IF EXISTS "Anon users can insert bundle_items" ON public.bundle_items;
DROP POLICY IF EXISTS "Anon users can update bundle_items" ON public.bundle_items;
DROP POLICY IF EXISTS "Anon users can delete bundle_items" ON public.bundle_items;
ALTER TABLE public.bundle_items DISABLE ROW LEVEL SECURITY;

-- ============ storage policies (menu-images bucket) ============
DROP POLICY IF EXISTS "Public read access for menu images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload menu images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update menu images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete menu images" ON storage.objects;
DROP POLICY IF EXISTS "Anon users can upload menu images" ON storage.objects;
DROP POLICY IF EXISTS "Anon users can update menu images" ON storage.objects;
DROP POLICY IF EXISTS "Anon users can delete menu images" ON storage.objects;

COMMIT;
