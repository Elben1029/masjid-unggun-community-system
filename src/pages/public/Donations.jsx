import { Heart, Landmark, HandHeart, UploadCloud, Utensils, Box, Calendar as CalendarIcon, CheckCircle2, AlertCircle, Copy, X, Clock, CheckCircle, Info, XCircle, ChevronLeft, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function Donations() {
  const { settings } = useSettings();
  const { user, profile } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('cash'); // 'cash', 'food', 'asset'
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // --- CASH DONATION STATE ---
  const [cashForm, setCashForm] = useState({
    donorName: profile?.full_name || '',
    amount: '',
    reference: '',
  });
  const [cashLoading, setCashLoading] = useState(false);
  const [cashSuccess, setCashSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  // --- FOOD DONATION STATE ---
  const [foodDates, setFoodDates] = useState([]);
  const [foodForm, setFoodForm] = useState({
    date: '',
    donorName: '',
    foodType: '',
    contactNumber: '',
    notes: ''
  });
  const [foodLoading, setFoodLoading] = useState(false);
  const [foodSuccess, setFoodSuccess] = useState(false);

  // --- ASSET WAQF STATE ---
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [assetForm, setAssetForm] = useState({
    donorName: profile?.full_name || '',
    quantity: 1
  });
  const [assetLoading, setAssetLoading] = useState(false);
  const [assetSuccess, setAssetSuccess] = useState(false);

  // FETCH DATA
  const fetchFoodDates = async () => {
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('food_donations')
        .select('id, date, status, donor_name, food_type, contact_number, notes, created_at')
        .gte('date', startDate)
        .lte('date', endDate);
      if (!error && data) {
        setFoodDates(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAssets = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('is_needed', true)
        .order('created_at', { ascending: false });
      if (!error && data) {
        setAssets(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFoodDates();
  }, [currentMonth]);

  useEffect(() => {
    fetchAssets();
  }, []);

  useEffect(() => {
    // Handle pre-filled state from Inventory page
    if (location.state?.selectedTab) {
      setActiveTab(location.state.selectedTab);
    }
    
    if (location.state?.inventoryId && assets.length > 0) {
      const asset = assets.find(a => a.id === location.state.inventoryId);
      if (asset) setSelectedAsset(asset);
    } else if (location.state?.prefilledItem && assets.length > 0) {
      const asset = assets.find(a => a.item === location.state.prefilledItem);
      if (asset) setSelectedAsset(asset);
    }
  }, [location.state, assets]);

  // HANDLERS
  const handleCashSubmit = async (e) => {
    e.preventDefault();
    if (!cashForm.amount || Number(cashForm.amount) <= 0) {
      alert("Sila masukkan jumlah sumbangan yang sah.");
      return;
    }
    
    setCashLoading(true);
    try {
      const { error } = await supabase.from('cash_donations').insert({
        user_id: user?.id || null,
        donor_name: cashForm.donorName || 'Hamba Allah',
        amount: Number(cashForm.amount),
        purpose: 'Sumbangan Am / Tabung Masjid',
        status: 'pending'
      });

      if (error) throw error;
      
      setCashSuccess(true);
      setCashForm({ ...cashForm, amount: '', reference: '' });
      setTimeout(() => setCashSuccess(false), 5000);
    } catch (err) {
      console.error(err);
      alert("Gagal memproses maklumat sumbangan. Sila cuba lagi.");
    } finally {
      setCashLoading(false);
    }
  };

  const handleFoodSubmit = async (e) => {
    e.preventDefault();
    if (!foodForm.date) return alert("Sila pilih tarikh.");

    setFoodLoading(true);
    try {
      // Check if already sponsored
      const { data: existing } = await supabase
        .from("food_donations")
        .select("id")
        .eq("date", foodForm.date)
        .maybeSingle();

      if (existing) {
        alert("Maaf, tarikh ini telah pun ditaja. Sila pilih tarikh lain.");
        setFoodLoading(false);
        return;
      }

      const { error } = await supabase.from('food_donations').insert({
        user_id: user?.id || null,
        date: foodForm.date,
        donor_name: foodForm.donorName || 'Hamba Allah',
        food_type: foodForm.foodType,
        contact_number: foodForm.contactNumber,
        notes: foodForm.notes,
        status: 'pending'
      });

      if (error) throw error;
      
      setFoodSuccess(true);
      setFoodForm({ date: '', donorName: '', foodType: '', contactNumber: '', notes: '' });
      fetchFoodDates();
      setTimeout(() => setFoodSuccess(false), 5000);
    } catch (err) {
      console.error(err);
      alert("Gagal menghantar permohonan taja. Sila cuba lagi.");
    } finally {
      setFoodLoading(false);
    }
  };

  const handleAssetSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAsset) return alert("Sila pilih item yang ingin disumbangkan.");
    
    setAssetLoading(true);
    try {
      const { error } = await supabase.from('asset_waqf_donations').insert({
        user_id: user?.id || null,
        inventory_id: selectedAsset.id,
        donor_name: assetForm.donorName || 'Hamba Allah',
        quantity: Number(assetForm.quantity),
        status: 'pending'
      });

      if (error) throw error;

      setAssetSuccess(true);
      setAssetForm({ donorName: profile?.full_name || '', quantity: 1 });
      setSelectedAsset(null);
      setTimeout(() => setAssetSuccess(false), 5000);
    } catch (err) {
      console.error(err);
      alert("Gagal menghantar maklumat wakaf.");
    } finally {
      setAssetLoading(false);
    }
  };

  // CALENDAR HELPERS
  const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const startDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const getDayDetails = (dateStr) => foodDates.find(d => d.date === dateStr);
  const isPastDate = (dateStr) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    return new Date(dateStr) < today;
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Hero Header */}
      <div className="bg-emerald-900 py-16 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-500 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-4xl sm:text-6xl font-black text-white mb-6 tracking-tight">Sumbangan & Wakaf</h1>
          <p className="text-emerald-100/80 text-lg sm:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
            Sumbangan anda membantu memakmurkan masjid dan meringankan beban komuniti setempat.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-slate-900 p-2 rounded-[32px] shadow-2xl flex flex-wrap justify-center sm:justify-start gap-2 mb-12 border border-slate-200/50 dark:border-slate-800/50">
          <button 
            onClick={() => setActiveTab('cash')} 
            className={`flex items-center gap-2 px-8 py-4 rounded-[24px] font-black transition-all duration-500 ${activeTab === 'cash' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <Landmark size={20} /> Sumbangan Tunai
          </button>
          <button 
            onClick={() => setActiveTab('food')} 
            className={`flex items-center gap-2 px-8 py-4 rounded-[24px] font-black transition-all duration-500 ${activeTab === 'food' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <Utensils size={20} /> Tajaan Makanan
          </button>
          <button 
            onClick={() => setActiveTab('asset')} 
            className={`flex items-center gap-2 px-8 py-4 rounded-[24px] font-black transition-all duration-500 ${activeTab === 'asset' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <Box size={20} /> Wakaf Barangan
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'cash' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Payment Details */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-[40px] p-10 shadow-xl border border-slate-100 dark:border-slate-800">
                <h3 className="text-2xl font-black mb-8 text-slate-900 dark:text-white">Maklumat Akaun</h3>
                
                <div className="space-y-8">
                  <div className="flex items-center gap-6 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700">
                    <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                      <Landmark className="text-emerald-600" size={32} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Maybank Islamic</p>
                      <p className="text-xl font-black text-slate-900 dark:text-white truncate">5520 1234 5678</p>
                      <p className="text-xs text-slate-500 font-medium mt-1">Bendahari Masjid Unggun</p>
                    </div>
                    <button onClick={() => handleCopy('552012345678')} className="p-3 text-slate-400 hover:text-emerald-600 transition-colors">
                      {copied ? <CheckCircle size={20} className="text-emerald-500" /> : <Copy size={20} />}
                    </button>
                  </div>

                  <div className="text-center p-8 bg-emerald-50 dark:bg-emerald-950/30 rounded-[40px] border-2 border-emerald-100 dark:border-emerald-900/50">
                    <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300 mb-4 uppercase tracking-widest">Imbas Kod QR DuitNow</p>
                    {settings?.donation_qr_url ? (
                      <img src={settings.donation_qr_url} alt="QR Code" className="w-48 h-48 mx-auto rounded-3xl shadow-xl border-4 border-white" />
                    ) : (
                      <div className="w-48 h-48 mx-auto bg-slate-200 dark:bg-slate-800 rounded-3xl flex items-center justify-center">
                        <UploadCloud className="text-slate-400" size={48} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/20 p-8 rounded-[32px] border border-amber-100 dark:border-amber-900/30 flex gap-6">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                  <Info size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-amber-900 dark:text-amber-200 mb-1">Nota Penting</h4>
                  <p className="text-sm text-amber-800/70 dark:text-amber-400/70 leading-relaxed">Sila simpan resit transaksi anda untuk tujuan pengesahan oleh pihak pengurusan masjid.</p>
                </div>
              </div>
            </div>

            {/* Donation Form */}
            <div className="lg:col-span-7">
              <div className="bg-white dark:bg-slate-900 rounded-[40px] p-10 shadow-xl border border-slate-100 dark:border-slate-800">
                <h3 className="text-2xl font-black mb-8 text-slate-900 dark:text-white">Maklumkan Sumbangan</h3>
                
                {cashSuccess ? (
                  <div className="text-center py-12 animate-in zoom-in-95 duration-500">
                    <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                      <CheckCircle2 size={48} />
                    </div>
                    <h4 className="text-3xl font-black mb-4">Alhamdulillah!</h4>
                    <p className="text-slate-500 font-medium text-lg">Maklumat sumbangan anda telah diterima. Semoga Allah memberkati rezeki anda.</p>
                  </div>
                ) : (
                  <form onSubmit={handleCashSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Nama Penyumbang</label>
                        <input 
                          type="text" 
                          required
                          value={cashForm.donorName}
                          onChange={e => setCashForm({...cashForm, donorName: e.target.value})}
                          placeholder="Cth: Hamba Allah"
                          className="w-full px-6 py-4 border-2 border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950 focus:border-emerald-500 outline-none transition-all font-bold"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Jumlah Sumbangan (RM)</label>
                        <input 
                          type="number" 
                          required
                          value={cashForm.amount}
                          onChange={e => setCashForm({...cashForm, amount: e.target.value})}
                          placeholder="0.00"
                          className="w-full px-6 py-4 border-2 border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950 focus:border-emerald-500 outline-none transition-all font-bold text-emerald-600"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={cashLoading}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 rounded-3xl font-black text-xl shadow-xl shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {cashLoading ? 'Sedang Memproses...' : 'Hantar Maklumat Sumbangan'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'food' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Calendar View */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-[40px] p-10 shadow-xl border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Kalendar Tajaan</h3>
                <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-800 px-6 py-3 rounded-2xl">
                  <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} className="hover:text-emerald-600 transition-colors"><ChevronLeft size={20} /></button>
                  <span className="font-black text-slate-800 dark:text-white min-w-[140px] text-center uppercase tracking-widest text-sm">
                    {currentMonth.toLocaleDateString('ms-MY', { month: 'long', year: 'numeric' })}
                  </span>
                  <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} className="hover:text-emerald-600 transition-colors"><ChevronRight size={20} /></button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-4 mb-4">
                {['Ahd', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab'].map(day => (
                  <div key={day} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-4">
                {Array.from({ length: startDayOfMonth(currentMonth) }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square bg-slate-50/50 dark:bg-slate-800/10 rounded-2xl"></div>
                ))}
                {Array.from({ length: daysInMonth(currentMonth) }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const booking = getDayDetails(dateStr);
                  const past = isPastDate(dateStr);
                  const isSelected = foodForm.date === dateStr;
                  const isToday = new Date().toISOString().split('T')[0] === dateStr;

                  return (
                    <button 
                      key={day}
                      disabled={past}
                      onClick={() => setFoodForm({...foodForm, date: dateStr})}
                      className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all relative overflow-hidden group ${
                        past ? 'bg-slate-50 border-slate-50 opacity-40 grayscale' : 
                        booking ? 'bg-amber-50 border-amber-100 text-amber-700' :
                        isSelected ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 
                        'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-emerald-300'
                      }`}
                    >
                      <span className={`text-lg font-black ${isToday ? 'underline decoration-4 underline-offset-4' : ''}`}>{day}</span>
                      {booking && !isSelected && <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>}
                      {!booking && !past && !isSelected && <div className="w-1.5 h-1.5 bg-emerald-200 rounded-full group-hover:scale-150 transition-transform"></div>}
                    </button>
                  );
                })}
              </div>

              <div className="mt-10 flex gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest justify-center">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-white border border-slate-200"></div> Tersedia</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div> Telah Ditaja</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-600"></div> Pilihan</div>
              </div>
            </div>

            {/* Food Form */}
            <div className="lg:col-span-5">
              <div className="bg-white dark:bg-slate-900 rounded-[40px] p-10 shadow-xl border border-slate-100 dark:border-slate-800 sticky top-28">
                <h3 className="text-2xl font-black mb-8 text-slate-900 dark:text-white">Borang Tajaan</h3>
                
                {foodSuccess ? (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8">
                      <CheckCircle2 size={48} />
                    </div>
                    <h4 className="text-2xl font-black mb-4">Tempahan Berjaya!</h4>
                    <p className="text-slate-500 font-medium">Pihak masjid akan menghubungi anda untuk pengesahan menu dan nota sumbangan.</p>
                  </div>
                ) : (
                  <form onSubmit={handleFoodSubmit} className="space-y-6">
                    {!foodForm.date ? (
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center">
                        <CalendarIcon className="mx-auto mb-3 text-slate-300" size={32} />
                        <p className="text-sm font-medium text-slate-500">Sila pilih tarikh pada kalendar untuk memulakan tajaan.</p>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-800">
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Tarikh Pilihan</p>
                        <p className="text-xl font-black text-emerald-900 dark:text-emerald-300">
                          {new Date(foodForm.date).toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    )}

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nama Penaja / Kumpulan</label>
                        <input type="text" required value={foodForm.donorName} onChange={e => setFoodForm({...foodForm, donorName: e.target.value})} className="w-full px-6 py-4 border-2 border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950 focus:border-emerald-500 outline-none transition-all font-bold" placeholder="Nama anda" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Menu Makanan (Jika ada)</label>
                        <input type="text" value={foodForm.foodType} onChange={e => setFoodForm({...foodForm, foodType: e.target.value})} className="w-full px-6 py-4 border-2 border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950 focus:border-emerald-500 outline-none transition-all font-bold" placeholder="Cth: Nasi Lemak / Bebas" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">No. Telefon</label>
                        <input type="tel" required value={foodForm.contactNumber} onChange={e => setFoodForm({...foodForm, contactNumber: e.target.value})} className="w-full px-6 py-4 border-2 border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950 focus:border-emerald-500 outline-none transition-all font-bold" placeholder="012-3456789" />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={!foodForm.date || foodLoading}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 rounded-3xl font-black text-xl shadow-xl shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {foodLoading ? 'Sila Tunggu...' : 'Hantar Tempahan'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'asset' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Asset Selection */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-[40px] p-10 shadow-xl border border-slate-100 dark:border-slate-800">
              <h3 className="text-2xl font-black mb-8 text-slate-900 dark:text-white">Pilih Item Keperluan</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {assets.length === 0 ? (
                  <div className="col-span-full py-20 text-center text-slate-400 font-bold">Tiada item keperluan buat masa ini.</div>
                ) : assets.map(asset => (
                  <button 
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset)}
                    className={`p-6 rounded-[32px] border-2 text-left transition-all relative overflow-hidden group ${
                      selectedAsset?.id === asset.id 
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 ring-4 ring-emerald-500/10' 
                        : 'border-slate-100 dark:border-slate-800 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white shrink-0 border border-slate-100">
                        {asset.image_url ? <img src={asset.image_url} className="w-full h-full object-cover" /> : <Box className="w-full h-full p-4 text-slate-300" />}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">{asset.item}</h4>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                          asset.urgency_level === 'Sangat Diperlukan' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                        }`}>{asset.urgency_level}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <span>Progress</span>
                        <span>{Math.min(100, Math.round((asset.received_quantity / asset.needed_quantity) * 100))}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, Math.round((asset.received_quantity / asset.needed_quantity) * 100))}%` }}></div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Asset Form */}
            <div className="lg:col-span-5">
              <div className="bg-white dark:bg-slate-900 rounded-[40px] p-10 shadow-xl border border-slate-100 dark:border-slate-800 sticky top-28">
                <h3 className="text-2xl font-black mb-8 text-slate-900 dark:text-white">Borang Wakaf</h3>
                
                {assetSuccess ? (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                      <CheckCircle2 size={48} />
                    </div>
                    <h4 className="text-2xl font-black mb-4">Terima Kasih!</h4>
                    <p className="text-slate-500 font-medium">Permohonan wakaf barangan anda telah diterima. Pihak kami akan menghubungi anda segera.</p>
                  </div>
                ) : (
                  <form onSubmit={handleAssetSubmit} className="space-y-6">
                    {!selectedAsset ? (
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center">
                        <Box className="mx-auto mb-3 text-slate-300" size={32} />
                        <p className="text-sm font-medium text-slate-500">Sila pilih barangan yang ingin diwakafkan pada senarai item.</p>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-800 flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl overflow-hidden border border-emerald-200 shrink-0">
                          {selectedAsset.image_url ? <img src={selectedAsset.image_url} className="w-full h-full object-cover" /> : <Box className="p-3 text-emerald-200" />}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-0.5">Item Terpilih</p>
                          <p className="text-lg font-black text-emerald-900 dark:text-emerald-300">{selectedAsset.item}</p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nama Pewakaf</label>
                        <input type="text" required value={assetForm.donorName} onChange={e => setAssetForm({...assetForm, donorName: e.target.value})} className="w-full px-6 py-4 border-2 border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950 focus:border-emerald-500 outline-none transition-all font-bold" placeholder="Cth: Hamba Allah" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Kuantiti (Unit)</label>
                        <input type="number" min="1" required value={assetForm.quantity} onChange={e => setAssetForm({...assetForm, quantity: e.target.value})} className="w-full px-6 py-4 border-2 border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950 focus:border-emerald-500 outline-none transition-all font-bold" />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={!selectedAsset || assetLoading}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 rounded-3xl font-black text-xl shadow-xl shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {assetLoading ? 'Sedang Menghantar...' : 'Sahkan Wakaf Barangan'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Support */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
        <div className="bg-slate-900 rounded-[48px] p-12 text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-teal-600/20 opacity-50"></div>
          <div className="relative z-10">
            <h3 className="text-3xl font-black text-white mb-4">Terima Kasih Atas Keprihatinan Anda</h3>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10 font-medium">Setiap sumbangan anda amatlah dihargai dan digunakan sebaiknya untuk kelestarian Masjid Unggun.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="bg-white/5 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/10 text-emerald-400 font-black flex items-center gap-3">
                <CheckCircle size={20} /> Transaksi Selamat
              </div>
              <div className="bg-white/5 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/10 text-emerald-400 font-black flex items-center gap-3">
                <CheckCircle size={20} /> Amanah & Telus
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
