-- Redesign About Page - Settings Expansion
DO $$ 
BEGIN 
    -- Hero Section
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='settings' AND column_name='about_hero_image_url') THEN 
        ALTER TABLE public.settings ADD COLUMN about_hero_image_url TEXT;
    END IF; 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='settings' AND column_name='about_hero_title') THEN 
        ALTER TABLE public.settings ADD COLUMN about_hero_title TEXT DEFAULT 'Tentang Kami';
    END IF; 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='settings' AND column_name='about_hero_description') THEN 
        ALTER TABLE public.settings ADD COLUMN about_hero_description TEXT;
    END IF; 

    -- Visi Section
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='settings' AND column_name='visi_title') THEN 
        ALTER TABLE public.settings ADD COLUMN visi_title TEXT DEFAULT 'Visi';
    END IF; 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='settings' AND column_name='visi_description') THEN 
        ALTER TABLE public.settings ADD COLUMN visi_description TEXT;
    END IF; 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='settings' AND column_name='visi_icon') THEN 
        ALTER TABLE public.settings ADD COLUMN visi_icon TEXT;
    END IF; 

    -- Misi Section
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='settings' AND column_name='misi_title') THEN 
        ALTER TABLE public.settings ADD COLUMN misi_title TEXT DEFAULT 'Misi';
    END IF; 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='settings' AND column_name='misi_description') THEN 
        ALTER TABLE public.settings ADD COLUMN misi_description TEXT;
    END IF; 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='settings' AND column_name='misi_icon') THEN 
        ALTER TABLE public.settings ADD COLUMN misi_icon TEXT;
    END IF; 

    -- CTA & Footer
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='settings' AND column_name='cta_text') THEN 
        ALTER TABLE public.settings ADD COLUMN cta_text TEXT DEFAULT 'Lihat Carta Organisasi';
    END IF; 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='settings' AND column_name='footer_copyright') THEN 
        ALTER TABLE public.settings ADD COLUMN footer_copyright TEXT;
    END IF; 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='settings' AND column_name='footer_description') THEN 
        ALTER TABLE public.settings ADD COLUMN footer_description TEXT;
    END IF; 

    -- Social Links
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='settings' AND column_name='facebook_url') THEN 
        ALTER TABLE public.settings ADD COLUMN facebook_url TEXT;
    END IF; 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='settings' AND column_name='instagram_url') THEN 
        ALTER TABLE public.settings ADD COLUMN instagram_url TEXT;
    END IF; 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='settings' AND column_name='twitter_url') THEN 
        ALTER TABLE public.settings ADD COLUMN twitter_url TEXT;
    END IF; 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='settings' AND column_name='whatsapp_number') THEN 
        ALTER TABLE public.settings ADD COLUMN whatsapp_number TEXT;
    END IF; 
END $$;
