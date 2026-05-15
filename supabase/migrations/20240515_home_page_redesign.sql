-- Home Page Redesign - Settings Expansion
DO $$ 
BEGIN 
    -- Hero Section
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='settings' AND column_name='home_welcome_text') THEN 
        ALTER TABLE public.settings ADD COLUMN home_welcome_text TEXT DEFAULT 'Selamat Datang';
    END IF; 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='settings' AND column_name='home_tagline') THEN 
        ALTER TABLE public.settings ADD COLUMN home_tagline TEXT;
    END IF; 

    -- Info Penting Section
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='settings' AND column_name='home_info_title') THEN 
        ALTER TABLE public.settings ADD COLUMN home_info_title TEXT DEFAULT 'Maklumat Penting';
    END IF; 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='settings' AND column_name='home_info_description') THEN 
        ALTER TABLE public.settings ADD COLUMN home_info_description TEXT;
    END IF; 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='settings' AND column_name='home_info_image_url') THEN 
        ALTER TABLE public.settings ADD COLUMN home_info_image_url TEXT;
    END IF; 
END $$;
