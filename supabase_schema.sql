-- Setup Profile and Roles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table to store user roles and metadata
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    phone TEXT,
    role TEXT DEFAULT 'public',
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
    bank_name TEXT,
    account_number TEXT,
    account_name TEXT,
    org_chart_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Donations table
CREATE TABLE IF NOT EXISTS public.donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contributor_name TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    fund_id TEXT NOT NULL,
    status TEXT DEFAULT 'Menunggu Pengesahan',
    receipt_url TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS) Policies

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public can view profiles" ON public.profiles FOR SELECT USING (true);
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

-- Donations Policies
CREATE POLICY "Public can submit donations" ON public.donations FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own donations" ON public.donations FOR SELECT USING (
    auth.uid() = user_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
CREATE POLICY "Admins can manage donations" ON public.donations FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- TRIGGER for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, phone)
    VALUES (new.id, new.email, new.phone);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
