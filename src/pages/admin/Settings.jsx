import { useState, useEffect } from 'react';
import { Save, Info, UploadCloud, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useSettings } from '../../contexts/SettingsContext';

export default function Settings() {
  const { settings, loading: settingsLoading, refreshSettings } = useSettings();
  const [loading, setLoading] = useState(false);
  
  // Settings State
  const [mosqueName, setMosqueName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  
  // Bank Details
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  // Images
  const [orgChartUrl, setOrgChartUrl] = useState('');
  const [mosqueLogoUrl, setMosqueLogoUrl] = useState('');
  const [mosqueBannerUrl, setMosqueBannerUrl] = useState('');
  const [qrImageUrl, setQrImageUrl] = useState('');

  // About Page Settings
  const [aboutHeroImageUrl, setAboutHeroImageUrl] = useState('');
  const [aboutHeroTitle, setAboutHeroTitle] = useState('');
  const [aboutHeroDescription, setAboutHeroDescription] = useState('');
  const [visiTitle, setVisiTitle] = useState('');
  const [visiDescription, setVisiDescription] = useState('');
  const [misiTitle, setMisiTitle] = useState('');
  const [misiDescription, setMisiDescription] = useState('');
  const [ctaText, setCtaText] = useState('');

  // Home Page Settings
  const [homeWelcomeText, setHomeWelcomeText] = useState('');
  const [homeTagline, setHomeTagline] = useState('');
  const [homeInfoTitle, setHomeInfoTitle] = useState('');
  const [homeInfoDescription, setHomeInfoDescription] = useState('');
  const [homeInfoImageUrl, setHomeInfoImageUrl] = useState('');

  // Footer Settings
  const [footerCopyright, setFooterCopyright] = useState('');
  const [footerDescription, setFooterDescription] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');

  useEffect(() => {
    if (!settingsLoading && settings) {
      setMosqueName(settings.mosque_name || '');
      setAddress(settings.address || '');
      setPhone(settings.phone || '');
      setEmail(settings.email || '');
      setBankName(settings.bank_name || '');
      setAccountNumber(settings.account_number || '');
      setAccountName(settings.account_name || '');
      setOrgChartUrl(settings.org_chart_url || settings.organization_chart_url || '');
      setMosqueLogoUrl(settings.mosque_logo_url || '');
      setMosqueBannerUrl(settings.mosque_banner_url || '');
      setQrImageUrl(settings.qr_image_url || settings.qr_code_url || '');
      
      // About Page
      setAboutHeroImageUrl(settings.about_hero_image_url || '');
      setAboutHeroTitle(settings.about_hero_title || 'Tentang Kami');
      setAboutHeroDescription(settings.about_hero_description || '');
      setVisiTitle(settings.visi_title || 'Visi');
      setVisiDescription(settings.visi_description || '');
      setMisiTitle(settings.misi_title || 'Misi');
      setMisiDescription(settings.misi_description || '');
      setCtaText(settings.cta_text || 'Lihat Carta Organisasi');
      
      // Home Page
      setHomeWelcomeText(settings.home_welcome_text || 'Selamat Datang');
      setHomeTagline(settings.home_tagline || '');
      setHomeInfoTitle(settings.home_info_title || 'Maklumat Penting');
      setHomeInfoDescription(settings.home_info_description || '');
      setHomeInfoImageUrl(settings.home_info_image_url || '');
      
      // Footer
      setFooterCopyright(settings.footer_copyright || '');
      setFooterDescription(settings.footer_description || '');
      setFacebookUrl(settings.facebook_url || '');
      setInstagramUrl(settings.instagram_url || '');
      setTwitterUrl(settings.twitter_url || '');
      setWhatsappNumber(settings.whatsapp_number || '');
    }
  }, [settings, settingsLoading]);

  const handleImageUpload = async (event, fieldName) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      setLoading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${fieldName}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('settings')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('settings')
        .getPublicUrl(filePath);

      if (fieldName === 'org_chart') setOrgChartUrl(data.publicUrl);
      if (fieldName === 'mosque_logo') setMosqueLogoUrl(data.publicUrl);
      if (fieldName === 'mosque_banner') setMosqueBannerUrl(data.publicUrl);
      if (fieldName === 'qr_image') setQrImageUrl(data.publicUrl);
      if (fieldName === 'about_hero') setAboutHeroImageUrl(data.publicUrl);
      if (fieldName === 'home_info') setHomeInfoImageUrl(data.publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Gagal memuat naik imej.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          id: 'global',
          mosque_name: mosqueName,
          address,
          phone,
          email,
          bank_name: bankName,
          account_number: accountNumber,
          account_name: accountName,
          org_chart_url: orgChartUrl,
          mosque_logo_url: mosqueLogoUrl,
          mosque_banner_url: mosqueBannerUrl,
          qr_image_url: qrImageUrl,
          about_hero_image_url: aboutHeroImageUrl,
          about_hero_title: aboutHeroTitle,
          about_hero_description: aboutHeroDescription,
          visi_title: visiTitle,
          visi_description: visiDescription,
          misi_title: misiTitle,
          misi_description: misiDescription,
          cta_text: ctaText,
          home_welcome_text: homeWelcomeText,
          home_tagline: homeTagline,
          home_info_title: homeInfoTitle,
          home_info_description: homeInfoDescription,
          home_info_image_url: homeInfoImageUrl,
          footer_copyright: footerCopyright,
          footer_description: footerDescription,
          facebook_url: facebookUrl,
          instagram_url: instagramUrl,
          twitter_url: twitterUrl,
          whatsapp_number: whatsappNumber,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      await refreshSettings();
      alert("Tetapan berjaya disimpan.");
    } catch (err) {
      console.error("Error saving settings:", err);
      alert("Gagal menyimpan tetapan.");
    } finally {
      setLoading(false);
    }
  };

  const renderImageUpload = (label, url, fieldName, description) => (
    <div className="mt-4">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{label}</label>
      {description && <p className="text-xs text-slate-500 mb-3">{description}</p>}
      
      {url && (
        <div className="mb-4 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center p-2 relative group max-w-sm">
          <img src={url} alt={label} className="max-h-48 object-contain rounded-lg" />
        </div>
      )}
      
      <div className="relative">
        <input 
          type="file" 
          accept="image/*"
          onChange={(e) => handleImageUpload(e, fieldName)}
          disabled={loading}
          className="block w-full text-sm text-slate-500
            file:mr-4 file:py-2.5 file:px-4
            file:rounded-xl file:border-0
            file:text-sm file:font-semibold
            file:bg-emerald-50 file:text-emerald-700
            hover:file:bg-emerald-100
            dark:file:bg-emerald-900/30 dark:file:text-emerald-400
            disabled:opacity-50 cursor-pointer"
        />
      </div>
    </div>
  );

  if (settingsLoading) return <div className="text-center py-10 flex flex-col items-center"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>Memuatkan tetapan...</div>;

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Tetapan Sistem</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">Urus maklumat rasmi dan media masjid yang akan dipaparkan kepada umum.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Hubungi Masjid */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Maklumat Hubungan</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Masjid</label>
              <input 
                type="text" 
                value={mosqueName}
                onChange={(e) => setMosqueName(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Alamat Penuh</label>
              <textarea 
                rows="3"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500" 
                placeholder="Cth: Kampung Unggun, Menggatal, Sabah"
              ></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombor Telefon Pejabat</label>
              <input 
                type="text" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500" 
                placeholder="Cth: 088-123456"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Emel Rasmi</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500" 
                placeholder="Cth: admin@masjidunggun.com"
              />
            </div>
          </div>
        </div>

        {/* Imej & Media */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <ImageIcon className="text-emerald-500" />
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Imej & Media</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {renderImageUpload("Logo Masjid", mosqueLogoUrl, "mosque_logo", "Logo rasmi masjid untuk dipaparkan di navbar.")}
            {renderImageUpload("Banner Utama", mosqueBannerUrl, "mosque_banner", "Imej latar belakang utama (Hero banner).")}
            {renderImageUpload("Carta Organisasi", orgChartUrl, "org_chart", "Imej struktur carta organisasi masjid.")}
          </div>
        </div>

        {/* Maklumat Bank */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Akaun Bank Rasmi (Sumbangan)</h2>
            <Info size={20} className="text-emerald-500" title="Maklumat ini akan dipaparkan di halaman Derma" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Bank</label>
              <input 
                type="text" 
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500" 
                placeholder="Cth: Bank Islam"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombor Akaun</label>
              <input 
                type="text" 
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500" 
                placeholder="100XXXXXXXXXX"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Pemilik Akaun</label>
              <input 
                type="text" 
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500" 
                placeholder="Cth: MAJLIS AGAMA ISLAM (MASJID UNGGUN)"
              />
            </div>
            
            <div className="md:col-span-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              {renderImageUpload("QR DuitNow / Kod QR Bank", qrImageUrl, "qr_image", "Muat naik imej kod QR rasmi bank untuk memudahkan pemindahan wang.")}
            </div>
          </div>
        </div>

        {/* Halaman Utama */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <ImageIcon className="text-emerald-500" />
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Halaman Utama (Laman Depan)</h2>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Teks Selamat Datang (Kecil)</label>
                <input 
                  type="text" 
                  value={homeWelcomeText}
                  onChange={(e) => setHomeWelcomeText(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white" 
                  placeholder="Cth: Selamat Datang"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tagline Hero</label>
                <input 
                  type="text" 
                  value={homeTagline}
                  onChange={(e) => setHomeTagline(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white" 
                  placeholder="Cth: Pusat ibadah dan pembangunan komuniti..."
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4">Kad Maklumat Penting (Kiri)</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tajuk Maklumat</label>
                  <input 
                    type="text" 
                    value={homeInfoTitle}
                    onChange={(e) => setHomeInfoTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white" 
                    placeholder="Cth: Maklumat Penting"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kandungan Maklumat</label>
                  <textarea 
                    rows="4"
                    value={homeInfoDescription}
                    onChange={(e) => setHomeInfoDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white" 
                    placeholder="Masukkan maklumat atau pengumuman di sini..."
                  ></textarea>
                </div>
                {renderImageUpload("Imej Maklumat", homeInfoImageUrl, "home_info", "Imej untuk dipaparkan di dalam kad maklumat penting.")}
              </div>
            </div>
          </div>
        </div>

        {/* About Page & Footer */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <Info className="text-emerald-500" />
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Halaman Tentang Kami & Footer</h2>
          </div>
          
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs">1</span>
                Hero Section (Bahagian Atas)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tajuk Hero</label>
                  <input 
                    type="text" 
                    value={aboutHeroTitle}
                    onChange={(e) => setAboutHeroTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white" 
                    placeholder="Tentang Kami"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Penerangan Hero</label>
                  <textarea 
                    rows="2"
                    value={aboutHeroDescription}
                    onChange={(e) => setAboutHeroDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white" 
                    placeholder="Penerangan ringkas di bawah tajuk..."
                  ></textarea>
                </div>
                <div className="md:col-span-2">
                  {renderImageUpload("Imej Hero", aboutHeroImageUrl, "about_hero", "Imej yang dipaparkan di sebelah teks (50/50 split).")}
                </div>
              </div>
            </div>

            {/* Visi & Misi */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs">2</span>
                Visi & Misi
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Bahagian Visi</h4>
                  <input 
                    type="text" 
                    value={visiTitle}
                    onChange={(e) => setVisiTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold" 
                    placeholder="Tajuk (Visi)"
                  />
                  <textarea 
                    rows="3"
                    value={visiDescription}
                    onChange={(e) => setVisiDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white" 
                    placeholder="Kandungan visi..."
                  ></textarea>
                </div>
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Bahagian Misi</h4>
                  <input 
                    type="text" 
                    value={misiTitle}
                    onChange={(e) => setMisiTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold" 
                    placeholder="Tajuk (Misi)"
                  />
                  <textarea 
                    rows="3"
                    value={misiDescription}
                    onChange={(e) => setMisiDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white" 
                    placeholder="Kandungan misi..."
                  ></textarea>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Teks Butang CTA (Bawah Visi/Misi)</label>
                <input 
                  type="text" 
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white" 
                  placeholder="Lihat Carta Organisasi"
                />
              </div>
            </div>

            {/* Footer Section */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs">3</span>
                Footer (Bahagian Bawah Laman)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Penerangan Ringkas Footer</label>
                  <textarea 
                    rows="2"
                    value={footerDescription}
                    onChange={(e) => setFooterDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white" 
                    placeholder="Ayat ringkas di bawah logo di footer..."
                  ></textarea>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Teks Hak Cipta (Copyright)</label>
                  <input 
                    type="text" 
                    value={footerCopyright}
                    onChange={(e) => setFooterCopyright(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white" 
                    placeholder="© 2024 Masjid Unggun. Hak Cipta Terpelihara."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Facebook URL</label>
                  <input 
                    type="url" 
                    value={facebookUrl}
                    onChange={(e) => setFacebookUrl(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white" 
                    placeholder="https://facebook.com/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Instagram URL</label>
                  <input 
                    type="url" 
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white" 
                    placeholder="https://instagram.com/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Twitter URL</label>
                  <input 
                    type="url" 
                    value={twitterUrl}
                    onChange={(e) => setTwitterUrl(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white" 
                    placeholder="https://twitter.com/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">WhatsApp (No. Telefon)</label>
                  <input 
                    type="text" 
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white" 
                    placeholder="60123456789"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 sticky bottom-6 z-10">
          <button 
            type="submit" 
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/30 flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={20} />
            {loading ? 'Menyimpan...' : 'Simpan Semua Tetapan'}
          </button>
        </div>
      </form>
    </div>
  );
}
