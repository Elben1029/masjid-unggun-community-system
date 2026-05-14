-- Korban Management Module Tables

-- 1. Korban Donors (Extended from previous korban_registrations)
CREATE TABLE IF NOT EXISTS public.korban_donors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id),
    full_name TEXT NOT NULL,
    ic_number TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    beneficiary_name TEXT,
    package_type TEXT NOT NULL, -- 'Lembu', 'Kambing'
    shares INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'withdrawn'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Korban Receivers
CREATE TABLE IF NOT EXISTS public.korban_receivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    village_location TEXT,
    contact_info TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Korban Parts (Groups)
CREATE TABLE IF NOT EXISTS public.korban_parts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    part_number TEXT UNIQUE NOT NULL, -- e.g. B01, B02, K01
    animal_type TEXT NOT NULL, -- 'Lembu', 'Kambing'
    max_shares INTEGER DEFAULT 7,
    current_shares INTEGER DEFAULT 0,
    receiver_id UUID REFERENCES public.korban_receivers(id) ON DELETE SET NULL,
    remarks TEXT,
    status TEXT DEFAULT 'active', -- 'active', 'completed'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Donor Part Assignments
CREATE TABLE IF NOT EXISTS public.korban_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donor_id UUID REFERENCES public.korban_donors(id) ON DELETE CASCADE,
    part_id UUID REFERENCES public.korban_parts(id) ON DELETE CASCADE,
    shares INTEGER DEFAULT 1,
    assigned_date TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(donor_id, part_id)
);

-- 5. Admin Logs for Korban
CREATE TABLE IF NOT EXISTS public.korban_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES public.profiles(id),
    action_type TEXT NOT NULL,
    action_description TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.korban_donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.korban_receivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.korban_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.korban_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.korban_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Donors
CREATE POLICY "Anyone can register for korban" ON public.korban_donors FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own registrations" ON public.korban_donors FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Admins can manage donors" ON public.korban_donors FOR ALL USING (public.is_admin());

-- Receivers
CREATE POLICY "Anyone can view receivers" ON public.korban_receivers FOR SELECT USING (true);
CREATE POLICY "Admins can manage receivers" ON public.korban_receivers FOR ALL USING (public.is_admin());

-- Parts
CREATE POLICY "Anyone can view parts" ON public.korban_parts FOR SELECT USING (true);
CREATE POLICY "Admins can manage parts" ON public.korban_parts FOR ALL USING (public.is_admin());

-- Assignments
CREATE POLICY "Anyone can view assignments" ON public.korban_assignments FOR SELECT USING (true);
CREATE POLICY "Admins can manage assignments" ON public.korban_assignments FOR ALL USING (public.is_admin());

-- Logs
CREATE POLICY "Admins can view logs" ON public.korban_logs FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can insert logs" ON public.korban_logs FOR INSERT WITH CHECK (public.is_admin());

-- Function to update part shares count
CREATE OR REPLACE FUNCTION public.update_korban_part_shares()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.korban_parts
        SET current_shares = current_shares + NEW.shares
        WHERE id = NEW.part_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.korban_parts
        SET current_shares = current_shares - OLD.shares
        WHERE id = OLD.part_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.part_id = NEW.part_id THEN
            UPDATE public.korban_parts
            SET current_shares = current_shares - OLD.shares + NEW.shares
            WHERE id = NEW.part_id;
        ELSE
            UPDATE public.korban_parts
            SET current_shares = current_shares - OLD.shares
            WHERE id = OLD.part_id;
            UPDATE public.korban_parts
            SET current_shares = current_shares + NEW.shares
            WHERE id = NEW.part_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_korban_assignment_change
    AFTER INSERT OR UPDATE OR DELETE ON public.korban_assignments
    FOR EACH ROW EXECUTE FUNCTION public.update_korban_part_shares();
