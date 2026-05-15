import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const SettingsContext = createContext({});

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    mosque_name: 'Masjid Unggun',
    address: '',
    phone: '',
    email: '',
    bank_name: '',
    account_number: '',
    account_name: '',
    org_chart_url: '',
    organization_chart_url: '',
    mosque_logo_url: '',
    mosque_banner_url: '',
    qr_image_url: '',
    qr_code_url: '',
    about_hero_image_url: '',
    about_hero_title: 'Tentang Kami',
    about_hero_description: '',
    visi_title: 'Visi',
    visi_description: '',
    visi_icon: '',
    misi_title: 'Misi',
    misi_description: '',
    misi_icon: '',
    cta_text: 'Lihat Carta Organisasi',
    footer_copyright: '',
    footer_description: '',
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
    whatsapp_number: ''
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 'global')
        .single();
      
      if (error && error.code === 'PGRST116') {
        // Row does not exist, automatically create it
        const defaultSettings = {
          id: 'global',
          mosque_name: 'Masjid Unggun'
        };
        const { data: newData, error: insertError } = await supabase
          .from('settings')
          .insert([defaultSettings])
          .select()
          .single();
        
        if (!insertError && newData) {
          setSettings(newData);
        }
      } else if (error) {
        console.error("Error fetching settings:", error);
      } else if (data) {
        setSettings(data);
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const refreshSettings = () => {
    return fetchSettings();
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
