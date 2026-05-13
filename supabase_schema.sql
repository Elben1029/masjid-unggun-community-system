-- Setup Profile and Roles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- SAFE MIGRATIONS FOR EXISTING TABLES
-- ==========================================

-- 0. Migrate Profiles table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='full_name') THEN 
        ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
    END IF; 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='username') THEN 
        ALTER TABLE public.profiles ADD COLUMN username TEXT;
    END IF; 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='phone_number') THEN 
        ALTER TABLE public.profiles ADD COLUMN phone_number TEXT;
    END IF; 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='password_hash') THEN 
        ALTER TABLE public.profiles ADD COLUMN password_hash TEXT;
    END IF; 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='status') THEN 
        ALTER TABLE public.profiles ADD COLUMN status TEXT DEFAULT 'active';
    END IF; 
    
    -- Add unique constraint if missing
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_username_key') THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_key UNIQUE(username);
    END IF;
END $$;

-- 1. Migrate Inventory table
DO $$ 
BEGIN 
    -- Rename condition to item_condition
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='inventory' AND column_name='condition') THEN 
        ALTER TABLE public.inventory RENAME COLUMN condition TO item_condition; 
    END IF; 
    
    -- Add new Waqf tracking columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='inventory' AND column_name='is_needed') THEN 
        ALTER TABLE public.inventory ADD COLUMN is_needed BOOLEAN DEFAULT false;
        ALTER TABLE public.inventory ADD COLUMN needed_quantity INTEGER DEFAULT 0;
        ALTER TABLE public.inventory ADD COLUMN received_quantity INTEGER DEFAULT 0;
        ALTER TABLE public.inventory ADD COLUMN minimum_required INTEGER DEFAULT 0;
        ALTER TABLE public.inventory ADD COLUMN status TEXT DEFAULT 'active';
        ALTER TABLE public.inventory ADD COLUMN location TEXT;
        ALTER TABLE public.inventory ADD COLUMN purchase_date DATE;
    END IF; 
END $$;

-- 2. Migrate Food Donations table
DO $$ 
BEGIN 
    -- Add slot and food_type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='food_donations' AND column_name='slot') THEN 
        ALTER TABLE public.food_donations ADD COLUMN slot TEXT NOT NULL DEFAULT 'lunch';
    END IF; 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='food_donations' AND column_name='food_type') THEN 
        ALTER TABLE public.food_donations ADD COLUMN food_type TEXT;
    END IF;
END $$;

-- Drop old UNIQUE constraint and add composite constraint
ALTER TABLE public.food_donations DROP CONSTRAINT IF EXISTS food_donations_date_key;
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'food_donations_date_slot_key') THEN
        ALTER TABLE public.food_donations ADD CONSTRAINT food_donations_date_slot_key UNIQUE(date, slot);
    END IF;
END $$;

-- 3. Migrate Asset Waqf Donations
DO $$ 
BEGIN 
    -- Add inventory_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='asset_waqf_donations' AND column_name='inventory_id') THEN 
        ALTER TABLE public.asset_waqf_donations ADD COLUMN inventory_id UUID;
    END IF; 
END $$;

-- 4. Migrate Cash Donations table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='cash_donations' AND column_name='payment_method') THEN 
        ALTER TABLE public.cash_donations ADD COLUMN payment_method TEXT;
    END IF; 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='cash_donations' AND column_name='reference_number') THEN 
        ALTER TABLE public.cash_donations ADD COLUMN reference_number TEXT;
    END IF; 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='cash_donations' AND column_name='receipt_url') THEN 
        ALTER TABLE public.cash_donations ADD COLUMN receipt_url TEXT;
    END IF;
END $$;

-- 5. Migrate Events table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='events' AND column_name='category') THEN 
        ALTER TABLE public.events ADD COLUMN category TEXT;
    END IF; 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='events' AND column_name='start_time') THEN 
        ALTER TABLE public.events ADD COLUMN start_time TEXT;
    END IF; 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='events' AND column_name='end_time') THEN 
        ALTER TABLE public.events ADD COLUMN end_time TEXT;
    END IF; 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='events' AND column_name='location') THEN 
        ALTER TABLE public.events ADD COLUMN location TEXT;
    END IF; 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='events' AND column_name='event_type') THEN 
        ALTER TABLE public.events ADD COLUMN event_type TEXT DEFAULT 'free';
    END IF; 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='events' AND column_name='event_fee') THEN 
        ALTER TABLE public.events ADD COLUMN event_fee DECIMAL(10, 2);
    END IF; 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='events' AND column_name='bank_name') THEN 
        ALTER TABLE public.events ADD COLUMN bank_name TEXT;
    END IF; 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='events' AND column_name='account_name') THEN 
        ALTER TABLE public.events ADD COLUMN account_name TEXT;
    END IF; 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='events' AND column_name='account_number') THEN 
        ALTER TABLE public.events ADD COLUMN account_number TEXT;
    END IF; 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='events' AND column_name='qr_code_url') THEN 
        ALTER TABLE public.events ADD COLUMN qr_code_url TEXT;
    END IF; 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='events' AND column_name='payment_notes') THEN 
        ALTER TABLE public.events ADD COLUMN payment_notes TEXT;
    END IF; 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='events' AND column_name='registration_enabled') THEN 
        ALTER TABLE public.events ADD COLUMN registration_enabled BOOLEAN DEFAULT true;
    END IF; 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='events' AND column_name='max_participants') THEN 
        ALTER TABLE public.events ADD COLUMN max_participants INTEGER;
    END IF; 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='events' AND column_name='registration_deadline') THEN 
        ALTER TABLE public.events ADD COLUMN registration_deadline TIMESTAMPTZ;
    END IF; 
END $$;

-- ==========================================
-- SCHEMA DEFINITIONS
-- ==========================================

-- Helper function for JWT admin check
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    is_profile_admin BOOLEAN;
BEGIN
    -- Check JWT first
    IF coalesce((auth.jwt() ->> 'role'), '') = 'admin' OR coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin' THEN
        RETURN true;
    END IF;

    -- Fallback to profile (Security Definer avoids recursion)
    SELECT role = 'admin' INTO is_profile_admin FROM public.profiles WHERE id = auth.uid();
    RETURN coalesce(is_profile_admin, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Profiles table to store user roles and metadata
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    phone TEXT,
    full_name TEXT,
    username TEXT UNIQUE,
    phone_number TEXT,
    password_hash TEXT,
    status TEXT DEFAULT 'active',
    role TEXT DEFAULT 'guest',
    role_version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Food Donations (Calendar slots)
CREATE TABLE IF NOT EXISTS public.food_donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    slot TEXT NOT NULL DEFAULT 'lunch', -- breakfast, lunch, dinner
    donor_name TEXT,
    user_id UUID REFERENCES public.profiles(id),
    status TEXT DEFAULT 'pending', -- available, pending, approved, completed, cancelled
    food_type TEXT,
    contact_number TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(date, slot)
);

-- Deprecated asset_waqf table (kept for backward compatibility during transition)
CREATE TABLE IF NOT EXISTS public.asset_waqf (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    target_amount INTEGER,
    current_amount INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.asset_waqf_donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_id UUID REFERENCES public.inventory(id) ON DELETE CASCADE,
    waqf_id UUID REFERENCES public.asset_waqf(id) ON DELETE CASCADE, -- Deprecated, keep for old records
    user_id UUID REFERENCES public.profiles(id),
    donor_name TEXT,
    quantity INTEGER DEFAULT 1,
    notes TEXT,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected, completed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Force rebuild FK constraint for postgREST cache
ALTER TABLE public.asset_waqf_donations DROP CONSTRAINT IF EXISTS asset_waqf_donations_inventory_id_fkey;
ALTER TABLE public.asset_waqf_donations ADD CONSTRAINT asset_waqf_donations_inventory_id_fkey FOREIGN KEY (inventory_id) REFERENCES public.inventory(id) ON DELETE CASCADE;

-- Cash Donations
CREATE TABLE IF NOT EXISTS public.cash_donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id),
    donor_name TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method TEXT, -- QR, bank_transfer
    reference_number TEXT,
    receipt_url TEXT,
    status TEXT DEFAULT 'pending', -- pending, verified, approved
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory table
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item TEXT NOT NULL,
    category TEXT,
    quantity INTEGER DEFAULT 1,
    item_condition TEXT DEFAULT 'Baik',
    image_url TEXT,
    is_needed BOOLEAN DEFAULT false,
    needed_quantity INTEGER DEFAULT 0,
    received_quantity INTEGER DEFAULT 0,
    minimum_required INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    location TEXT,
    purchase_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for Inventory Waqf (New)
CREATE OR REPLACE FUNCTION public.update_inventory_waqf_amount()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'approved' THEN
        UPDATE public.inventory
        SET received_quantity = received_quantity + NEW.quantity,
            quantity = quantity + NEW.quantity,
            is_needed = CASE WHEN (received_quantity + NEW.quantity) >= needed_quantity THEN false ELSE is_needed END
        WHERE id = NEW.inventory_id;
    ELSIF TG_OP = 'UPDATE' AND NEW.status = 'approved' AND OLD.status != 'approved' THEN
        UPDATE public.inventory
        SET received_quantity = received_quantity + NEW.quantity,
            quantity = quantity + NEW.quantity,
            is_needed = CASE WHEN (received_quantity + NEW.quantity) >= needed_quantity THEN false ELSE is_needed END
        WHERE id = NEW.inventory_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'approved' AND NEW.status != 'approved' THEN
        UPDATE public.inventory
        SET received_quantity = received_quantity - OLD.quantity,
            quantity = quantity - OLD.quantity
        WHERE id = NEW.inventory_id;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'approved' THEN
        UPDATE public.inventory
        SET received_quantity = received_quantity - OLD.quantity,
            quantity = quantity - OLD.quantity
        WHERE id = OLD.inventory_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_asset_waqf_donation ON public.asset_waqf_donations;
CREATE TRIGGER on_asset_waqf_donation
    AFTER INSERT OR UPDATE OR DELETE ON public.asset_waqf_donations
    FOR EACH ROW EXECUTE FUNCTION public.update_inventory_waqf_amount();

-- Korban Registrations
CREATE TABLE IF NOT EXISTS public.korban_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id),
    participant_name TEXT NOT NULL,
    contact_number TEXT NOT NULL,
    part_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    date TIMESTAMPTZ,
    start_time TEXT,
    end_time TEXT,
    location TEXT,
    category TEXT,
    status TEXT DEFAULT 'Akan Datang', -- Published, Draft, Akan Datang, Selesai, Dibatalkan
    description TEXT,
    image_url TEXT,
    event_type TEXT DEFAULT 'free', -- free, paid
    event_fee DECIMAL(10, 2),
    bank_name TEXT,
    account_name TEXT,
    account_number TEXT,
    qr_code_url TEXT,
    payment_notes TEXT,
    registration_enabled BOOLEAN DEFAULT true,
    max_participants INTEGER,
    registration_deadline TIMESTAMPTZ,
    registered INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event Registrations table
CREATE TABLE IF NOT EXISTS public.event_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    participant_name TEXT,
    phone_number TEXT,
    registration_status TEXT DEFAULT 'pending', -- pending, confirmed, rejected, cancelled
    payment_status TEXT DEFAULT 'pending', -- pending, confirmed
    payment_proof_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, event_id)
);

-- Settings table (Global singleton)
CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY,
    mosque_name TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    bank_name TEXT,
    account_number TEXT,
    account_name TEXT,
    org_chart_url TEXT,
    organization_chart_url TEXT,
    mosque_logo_url TEXT,
    mosque_banner_url TEXT,
    qr_image_url TEXT,
    qr_code_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TRIGGER for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    assigned_role TEXT;
BEGIN
    -- Determine role based on is_anonymous flag (new in Supabase) or missing email/phone
    IF new.is_anonymous = true THEN
        assigned_role := 'guest';
    ELSE
        assigned_role := 'public';
    END IF;

    INSERT INTO public.profiles (id, email, phone, phone_number, full_name, username, role)
    VALUES (
        new.id, 
        new.email, 
        coalesce(new.phone, new.raw_user_meta_data->>'phone'), 
        coalesce(new.phone, new.raw_user_meta_data->>'phone'),
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'username',
        assigned_role
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ROW LEVEL SECURITY (RLS) Policies

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_waqf ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_waqf_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.korban_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (public.is_admin());

-- Events Policies
DROP POLICY IF EXISTS "Anyone can view events" ON public.events;
DROP POLICY IF EXISTS "Admins can manage events" ON public.events;
CREATE POLICY "Anyone can view events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Admins can manage events" ON public.events FOR ALL USING (public.is_admin());

-- Event Registrations Policies
DROP POLICY IF EXISTS "Anyone can view own event registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Anyone can create event registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Users can update own event registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Admins can manage event registrations" ON public.event_registrations;
CREATE POLICY "Anyone can view own event registrations" ON public.event_registrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can create event registrations" ON public.event_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own event registrations" ON public.event_registrations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage event registrations" ON public.event_registrations FOR ALL USING (public.is_admin());

-- Inventory Policies
DROP POLICY IF EXISTS "Anyone can view inventory" ON public.inventory;
DROP POLICY IF EXISTS "Admins can manage inventory" ON public.inventory;
CREATE POLICY "Anyone can view inventory" ON public.inventory FOR SELECT USING (true);
CREATE POLICY "Admins can manage inventory" ON public.inventory FOR ALL USING (public.is_admin());

-- Settings Policies
DROP POLICY IF EXISTS "Anyone can view settings" ON public.settings;
DROP POLICY IF EXISTS "Admins can manage settings" ON public.settings;
CREATE POLICY "Anyone can view settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage settings" ON public.settings FOR ALL USING (public.is_admin());

-- Food Donations Policies
DROP POLICY IF EXISTS "Anyone can view food donations" ON public.food_donations;
DROP POLICY IF EXISTS "Anyone can create food donations" ON public.food_donations;
DROP POLICY IF EXISTS "Users can update own food donations" ON public.food_donations;
DROP POLICY IF EXISTS "Admins can manage food donations" ON public.food_donations;
CREATE POLICY "Anyone can view food donations" ON public.food_donations FOR SELECT USING (true);
CREATE POLICY "Anyone can create food donations" ON public.food_donations FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own food donations" ON public.food_donations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage food donations" ON public.food_donations FOR ALL USING (public.is_admin());

-- Asset Waqf Policies
DROP POLICY IF EXISTS "Anyone can view asset waqf" ON public.asset_waqf;
DROP POLICY IF EXISTS "Admins can manage asset waqf" ON public.asset_waqf;
CREATE POLICY "Anyone can view asset waqf" ON public.asset_waqf FOR SELECT USING (true);
CREATE POLICY "Admins can manage asset waqf" ON public.asset_waqf FOR ALL USING (public.is_admin());

-- Asset Waqf Donations Policies
DROP POLICY IF EXISTS "Anyone can view asset waqf donations" ON public.asset_waqf_donations;
DROP POLICY IF EXISTS "Anyone can donate to asset waqf" ON public.asset_waqf_donations;
DROP POLICY IF EXISTS "Admins can manage asset waqf donations" ON public.asset_waqf_donations;
CREATE POLICY "Anyone can view asset waqf donations" ON public.asset_waqf_donations FOR SELECT USING (true);
CREATE POLICY "Anyone can donate to asset waqf" ON public.asset_waqf_donations FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage asset waqf donations" ON public.asset_waqf_donations FOR ALL USING (public.is_admin());

-- Cash Donations Policies
DROP POLICY IF EXISTS "Anyone can view own cash donations" ON public.cash_donations;
DROP POLICY IF EXISTS "Anyone can submit cash donations" ON public.cash_donations;
DROP POLICY IF EXISTS "Admins can manage cash donations" ON public.cash_donations;
CREATE POLICY "Anyone can view own cash donations" ON public.cash_donations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can submit cash donations" ON public.cash_donations FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage cash donations" ON public.cash_donations FOR ALL USING (public.is_admin());

-- Korban Registrations Policies
DROP POLICY IF EXISTS "Anyone can view own korban" ON public.korban_registrations;
DROP POLICY IF EXISTS "Anyone can register for korban" ON public.korban_registrations;
DROP POLICY IF EXISTS "Admins can manage korban" ON public.korban_registrations;
CREATE POLICY "Anyone can view own korban" ON public.korban_registrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can register for korban" ON public.korban_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage korban" ON public.korban_registrations FOR ALL USING (public.is_admin());

-- ==========================================
-- STORAGE BUCKETS & POLICIES
-- ==========================================

-- Note: In Supabase, creating buckets directly via SQL requires accessing the storage schema.
-- Ensure you have the storage schema enabled. If this fails, please create the buckets manually via the Supabase Dashboard.

INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('events', 'events', true),
  ('inventory', 'inventory', true),
  ('receipts', 'receipts', true),
  ('qr', 'qr', true),
  ('settings', 'settings', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'events'
DROP POLICY IF EXISTS "Public Access for events" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload for events" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update for events" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete for events" ON storage.objects;
CREATE POLICY "Public Access for events" ON storage.objects FOR SELECT USING (bucket_id = 'events');
CREATE POLICY "Admin Upload for events" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'events' AND public.is_admin());
CREATE POLICY "Admin Update for events" ON storage.objects FOR UPDATE USING (bucket_id = 'events' AND public.is_admin());
CREATE POLICY "Admin Delete for events" ON storage.objects FOR DELETE USING (bucket_id = 'events' AND public.is_admin());

-- Storage Policies for 'inventory'
DROP POLICY IF EXISTS "Public Access for inventory" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload for inventory" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update for inventory" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete for inventory" ON storage.objects;
CREATE POLICY "Public Access for inventory" ON storage.objects FOR SELECT USING (bucket_id = 'inventory');
CREATE POLICY "Admin Upload for inventory" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'inventory' AND public.is_admin());
CREATE POLICY "Admin Update for inventory" ON storage.objects FOR UPDATE USING (bucket_id = 'inventory' AND public.is_admin());
CREATE POLICY "Admin Delete for inventory" ON storage.objects FOR DELETE USING (bucket_id = 'inventory' AND public.is_admin());

-- Storage Policies for 'receipts'
DROP POLICY IF EXISTS "Admin Access for receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload for receipts" ON storage.objects;
CREATE POLICY "Admin Access for receipts" ON storage.objects FOR SELECT USING (bucket_id = 'receipts' AND public.is_admin());
CREATE POLICY "Authenticated Upload for receipts" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'receipts' AND auth.role() = 'authenticated');

-- Storage Policies for 'qr'
DROP POLICY IF EXISTS "Public Access for qr" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload for qr" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update for qr" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete for qr" ON storage.objects;
CREATE POLICY "Public Access for qr" ON storage.objects FOR SELECT USING (bucket_id = 'qr');
CREATE POLICY "Admin Upload for qr" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'qr' AND public.is_admin());
CREATE POLICY "Admin Update for qr" ON storage.objects FOR UPDATE USING (bucket_id = 'qr' AND public.is_admin());
CREATE POLICY "Admin Delete for qr" ON storage.objects FOR DELETE USING (bucket_id = 'qr' AND public.is_admin());

-- Storage Policies for 'settings'
DROP POLICY IF EXISTS "Public Access for settings" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload for settings" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update for settings" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete for settings" ON storage.objects;
CREATE POLICY "Public Access for settings" ON storage.objects FOR SELECT USING (bucket_id = 'settings');
CREATE POLICY "Admin Upload for settings" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'settings' AND public.is_admin());
CREATE POLICY "Admin Update for settings" ON storage.objects FOR UPDATE USING (bucket_id = 'settings' AND public.is_admin());
CREATE POLICY "Admin Delete for settings" ON storage.objects FOR DELETE USING (bucket_id = 'settings' AND public.is_admin());

-- Force PostgREST to reload schema and recognize new foreign keys
NOTIFY pgrst, 'reload schema';
