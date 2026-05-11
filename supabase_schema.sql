-- Setup Profile and Roles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table to store user roles and metadata
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    phone TEXT,
    role TEXT DEFAULT 'guest',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Food Donations (Calendar slots)
CREATE TABLE IF NOT EXISTS public.food_donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL UNIQUE,
    donor_name TEXT,
    user_id UUID REFERENCES public.profiles(id),
    status TEXT DEFAULT 'pending', -- pending, reserved, completed, cancelled
    contact_number TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asset Waqf (Items needed)
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
    waqf_id UUID REFERENCES public.asset_waqf(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id),
    donor_name TEXT,
    quantity INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- Trigger for Asset Waqf
CREATE OR REPLACE FUNCTION public.update_asset_waqf_amount()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'approved' THEN
        UPDATE public.asset_waqf
        SET current_amount = current_amount + NEW.quantity
        WHERE id = NEW.waqf_id;
    ELSIF TG_OP = 'UPDATE' AND NEW.status = 'approved' AND OLD.status != 'approved' THEN
        UPDATE public.asset_waqf
        SET current_amount = current_amount + NEW.quantity
        WHERE id = NEW.waqf_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'approved' AND NEW.status != 'approved' THEN
        UPDATE public.asset_waqf
        SET current_amount = current_amount - OLD.quantity
        WHERE id = NEW.waqf_id;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'approved' THEN
        UPDATE public.asset_waqf
        SET current_amount = current_amount - OLD.quantity
        WHERE id = OLD.waqf_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_asset_waqf_donation ON public.asset_waqf_donations;
CREATE TRIGGER on_asset_waqf_donation
    AFTER INSERT OR UPDATE OR DELETE ON public.asset_waqf_donations
    FOR EACH ROW EXECUTE FUNCTION public.update_asset_waqf_amount();

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
    status TEXT DEFAULT 'Akan Datang',
    description TEXT,
    image_url TEXT,
    registered INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory table
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item TEXT NOT NULL,
    category TEXT,
    quantity INTEGER DEFAULT 1,
    condition TEXT DEFAULT 'Baik',
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
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

    INSERT INTO public.profiles (id, email, phone, role)
    VALUES (new.id, new.email, new.phone, assigned_role);
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

-- Profiles Policies
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Events Policies
CREATE POLICY "Anyone can view events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Admins can manage events" ON public.events FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Inventory Policies
CREATE POLICY "Anyone can view inventory" ON public.inventory FOR SELECT USING (true);
CREATE POLICY "Admins can manage inventory" ON public.inventory FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Settings Policies
CREATE POLICY "Anyone can view settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage settings" ON public.settings FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Food Donations Policies
CREATE POLICY "Anyone can view food donations" ON public.food_donations FOR SELECT USING (true);
CREATE POLICY "Anyone can create food donations" ON public.food_donations FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own food donations" ON public.food_donations FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Admins can manage food donations" ON public.food_donations FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Asset Waqf Policies
CREATE POLICY "Anyone can view asset waqf" ON public.asset_waqf FOR SELECT USING (true);
CREATE POLICY "Admins can manage asset waqf" ON public.asset_waqf FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Asset Waqf Donations Policies
CREATE POLICY "Anyone can view asset waqf donations" ON public.asset_waqf_donations FOR SELECT USING (true);
CREATE POLICY "Anyone can donate to asset waqf" ON public.asset_waqf_donations FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage asset waqf donations" ON public.asset_waqf_donations FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Cash Donations Policies
CREATE POLICY "Anyone can view own cash donations" ON public.cash_donations FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Anyone can submit cash donations" ON public.cash_donations FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage cash donations" ON public.cash_donations FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Korban Registrations Policies
CREATE POLICY "Anyone can view own korban" ON public.korban_registrations FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Anyone can register for korban" ON public.korban_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage korban" ON public.korban_registrations FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

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
CREATE POLICY "Public Access for events" ON storage.objects FOR SELECT USING (bucket_id = 'events');
CREATE POLICY "Admin Upload for events" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'events' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admin Update for events" ON storage.objects FOR UPDATE USING (bucket_id = 'events' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admin Delete for events" ON storage.objects FOR DELETE USING (bucket_id = 'events' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Storage Policies for 'inventory'
CREATE POLICY "Public Access for inventory" ON storage.objects FOR SELECT USING (bucket_id = 'inventory');
CREATE POLICY "Admin Upload for inventory" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'inventory' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admin Update for inventory" ON storage.objects FOR UPDATE USING (bucket_id = 'inventory' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admin Delete for inventory" ON storage.objects FOR DELETE USING (bucket_id = 'inventory' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Storage Policies for 'receipts'
CREATE POLICY "Admin Access for receipts" ON storage.objects FOR SELECT USING (bucket_id = 'receipts' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Authenticated Upload for receipts" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'receipts' AND auth.role() = 'authenticated');

-- Storage Policies for 'qr'
CREATE POLICY "Public Access for qr" ON storage.objects FOR SELECT USING (bucket_id = 'qr');
CREATE POLICY "Admin Upload for qr" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'qr' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admin Update for qr" ON storage.objects FOR UPDATE USING (bucket_id = 'qr' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admin Delete for qr" ON storage.objects FOR DELETE USING (bucket_id = 'qr' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Storage Policies for 'settings'
CREATE POLICY "Public Access for settings" ON storage.objects FOR SELECT USING (bucket_id = 'settings');
CREATE POLICY "Admin Upload for settings" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'settings' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admin Update for settings" ON storage.objects FOR UPDATE USING (bucket_id = 'settings' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admin Delete for settings" ON storage.objects FOR DELETE USING (bucket_id = 'settings' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
