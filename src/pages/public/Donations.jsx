import { Heart, Landmark, HandHeart, UploadCloud, Utensils, Box, Calendar as CalendarIcon, CheckCircle2, AlertCircle, Copy, X, Clock, CheckCircle, Info, XCircle, ChevronLeft, ChevronRight, Sparkles, ArrowRight, Phone, MessageSquare } from 'lucide-react';
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
  
  // Modal States
  const [selectedDateModal, setSelectedDateModal] = useState(null); // { date, booking }
  const [isBookingMode, setIsBookingMode] = useState(false);

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
    donorName: profile?.full_name || '',
    foodType: '',
    contactNumber: profile?.phone_number || '',
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
      setFoodForm({ date: '', donorName: profile?.full_name || '', foodType: '', contactNumber: profile?.phone_number || '', notes: '' });
      fetchFoodDates();
      setSelectedDateModal(null);
      setIsBookingMode(false);
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

  const handleDateClick = (dateStr, booking) => {
    if (isPastDate(dateStr)) return;
    
    setSelectedDateModal({ date: dateStr, booking });
    if (!booking) {
      setIsBookingMode(true);
      setFoodForm({ ...foodForm, date: dateStr });
    } else {
      setIsBookingMode(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 overflow-x-hidden">
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
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white dark:bg-slate-900 rounded-[40px] p-6 sm:p-12 shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                    <Utensils className="text-emerald-600" size={28} />
                    Jadual Sumbangan Makanan
                  </h3>
                  <p className="text-slate-500 font-medium mt-1 text-sm sm:text-base">Sila pilih tarikh untuk menaja hidangan.</p>
                </div>
                <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-[20px] shadow-inner w-full md:w-auto justify-between">
                  <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} className="p-2.5 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-all text-slate-600 dark:text-slate-300 shadow-sm"><ChevronLeft size={18} /></button>
                  <span className="font-black text-slate-800 dark:text-white min-w-[120px] text-center uppercase tracking-widest text-[11px] sm:text-xs">
                    {currentMonth.toLocaleDateString('ms-MY', { month: 'long', year: 'numeric' })}
                  </span>
                  <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} className="p-2.5 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-all text-slate-600 dark:text-slate-300 shadow-sm"><ChevronRight size={18} /></button>
                </div>
              </div>

              {/* Hybrid Layout: Desktop Grid, Mobile List */}
              <div className="hidden sm:grid grid-cols-7 gap-3 sm:gap-6">
                {['Ahd', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab'].map(day => (
                  <div key={day} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pb-4">{day}</div>
                ))}
                
                {Array.from({ length: startDayOfMonth(currentMonth) }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square bg-slate-50/50 dark:bg-slate-800/10 rounded-3xl border border-transparent"></div>
                ))}

                {Array.from({ length: daysInMonth(currentMonth) }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const booking = getDayDetails(dateStr);
                  const past = isPastDate(dateStr);
                  const isToday = new Date().toISOString().split('T')[0] === dateStr;

                  return (
                    <button 
                      key={day}
                      disabled={past}
                      onClick={() => handleDateClick(dateStr, booking)}
                      className={`group relative aspect-square rounded-[32px] border-2 transition-all duration-500 flex flex-col p-5 text-left ${
                        past ? 'bg-slate-50 border-slate-50 opacity-40 grayscale cursor-not-allowed' : 
                        booking ? 'bg-amber-50 border-amber-100 hover:shadow-xl hover:shadow-amber-500/10' :
                        'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-auto">
                        <span className={`text-2xl font-black leading-none ${
                          isToday ? 'text-emerald-600 underline decoration-4 underline-offset-8' : 
                          booking ? 'text-amber-700' : 'text-slate-900 dark:text-white'
                        }`}>{day}</span>
                        {!past && !booking && <div className="w-2 h-2 rounded-full bg-emerald-400 group-hover:scale-150 transition-transform"></div>}
                        {booking && <div className="w-2 h-2 rounded-full bg-amber-500"></div>}
                      </div>

                      <div className="mt-2">
                        {past ? (
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Tamat</span>
                        ) : booking ? (
                          <div className="animate-in fade-in duration-500">
                            <span className="text-[9px] font-black text-amber-600 uppercase tracking-wider block mb-1">Disumbangkan</span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 line-clamp-1">{booking.donor_name}</span>
                          </div>
                        ) : (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider block mb-1">Tersedia</span>
                            <span className="text-xs font-bold text-slate-400 line-clamp-1">Klik untuk taja</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Mobile View: Card List */}
              <div className="sm:hidden space-y-4">
                {Array.from({ length: daysInMonth(currentMonth) }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const booking = getDayDetails(dateStr);
                  const past = isPastDate(dateStr);
                  const isToday = new Date().toISOString().split('T')[0] === dateStr;

                  return (
                    <button 
                      key={day}
                      disabled={past}
                      onClick={() => handleDateClick(dateStr, booking)}
                      className={`w-full p-5 rounded-[24px] border-2 transition-all flex items-center justify-between gap-4 text-left ${
                        past ? 'bg-slate-50 border-slate-50 opacity-40 grayscale cursor-not-allowed' : 
                        booking ? 'bg-amber-50 border-amber-100 shadow-sm' :
                        'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 active:scale-[0.98]'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 ${
                          isToday ? 'bg-emerald-600 text-white' : 
                          booking ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}>
                          <span className="text-lg font-black">{day}</span>
                          <span className="text-[8px] font-bold uppercase">{new Date(dateStr).toLocaleDateString('ms-MY', { weekday: 'short' })}</span>
                        </div>
                        <div>
                          <h4 className={`font-black text-sm ${booking ? 'text-amber-800 dark:text-amber-200' : 'text-slate-900 dark:text-white'}`}>
                            {booking ? booking.donor_name : 'Tersedia'}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`text-[9px] font-black uppercase tracking-widest ${
                              past ? 'text-slate-400' : 
                              booking ? 'text-amber-600' : 'text-emerald-600'
                            }`}>
                              {past ? 'Telah Berlalu' : booking ? 'Sudah Ditempah' : 'Sedia Ditaja'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={20} className={past ? 'text-slate-300' : booking ? 'text-amber-400' : 'text-emerald-400'} />
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-12 pt-8 border-t border-slate-50 dark:border-slate-800 flex flex-wrap gap-6 justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-50 border-2 border-emerald-500"></div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tersedia</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Telah Ditaja</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tamat</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'asset' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Asset Selection */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-[40px] p-6 sm:p-10 shadow-xl border border-slate-100 dark:border-slate-800">
              <h3 className="text-xl sm:text-2xl font-black mb-8 text-slate-900 dark:text-white">Pilih Item Keperluan</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {assets.length === 0 ? (
                  <div className="col-span-full py-20 text-center text-slate-400 font-bold">Tiada item keperluan buat masa ini.</div>
                ) : assets.map(asset => (
                  <button 
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset)}
                    className={`p-5 sm:p-6 rounded-[32px] border-2 text-left transition-all relative overflow-hidden group ${
                      selectedAsset?.id === asset.id 
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 ring-4 ring-emerald-500/10' 
                        : 'border-slate-100 dark:border-slate-800 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-white shrink-0 border border-slate-100">
                        {asset.image_url ? <img src={asset.image_url} className="w-full h-full object-cover" /> : <Box className="w-full h-full p-4 text-slate-300" />}
                      </div>
                      <div>
                        <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">{asset.item}</h4>
                        <span className={`text-[8px] sm:text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                          asset.urgency_level === 'Sangat Diperlukan' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                        }`}>{asset.urgency_level}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <span>Progress</span>
                        <span>{Math.min(100, Math.round((asset.received_quantity / asset.needed_quantity) * 100))}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 sm:h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, Math.round((asset.received_quantity / asset.needed_quantity) * 100))}%` }}></div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Asset Form */}
            <div className="lg:col-span-5">
              <div className="bg-white dark:bg-slate-900 rounded-[40px] p-6 sm:p-10 shadow-xl border border-slate-100 dark:border-slate-800 lg:sticky lg:top-28">
                <h3 className="text-xl sm:text-2xl font-black mb-8 text-slate-900 dark:text-white">Borang Wakaf</h3>
                
                {assetSuccess ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 size={40} />
                    </div>
                    <h4 className="text-xl font-black mb-4">Terima Kasih!</h4>
                    <p className="text-slate-500 font-medium text-sm">Permohonan wakaf barangan anda telah diterima.</p>
                  </div>
                ) : (
                  <form onSubmit={handleAssetSubmit} className="space-y-6">
                    {!selectedAsset ? (
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center">
                        <Box className="mx-auto mb-3 text-slate-300" size={32} />
                        <p className="text-xs sm:text-sm font-medium text-slate-500">Sila pilih barangan yang ingin diwakafkan.</p>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 p-5 rounded-3xl border border-emerald-100 dark:border-emerald-800 flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl overflow-hidden border border-emerald-200 shrink-0">
                          {selectedAsset.image_url ? <img src={selectedAsset.image_url} className="w-full h-full object-cover" /> : <Box className="p-3 text-emerald-200" />}
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mb-0.5">Item Terpilih</p>
                          <p className="text-base font-black text-emerald-900 dark:text-emerald-300">{selectedAsset.item}</p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nama Pewakaf</label>
                        <input type="text" required value={assetForm.donorName} onChange={e => setAssetForm({...assetForm, donorName: e.target.value})} className="w-full px-5 py-3.5 border-2 border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-bold focus:border-emerald-500 outline-none transition-all text-sm" placeholder="Cth: Hamba Allah" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Kuantiti (Unit)</label>
                        <input type="number" min="1" required value={assetForm.quantity} onChange={e => setAssetForm({...assetForm, quantity: e.target.value})} className="w-full px-5 py-3.5 border-2 border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-bold focus:border-emerald-500 outline-none transition-all text-sm" />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={!selectedAsset || assetLoading}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-[24px] font-black text-lg shadow-xl shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {assetLoading ? 'Sedang Menghantar...' : 'Sahkan Wakaf'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOD CALENDAR MODAL / POPUP - FULLY RESPONSIVE & SCROLLABLE */}
      {selectedDateModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-t-[40px] sm:rounded-[40px] shadow-2xl w-full sm:max-w-xl max-h-[92vh] sm:max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-500 border border-white/10">
            
            {/* Modal Header - Fixed */}
            <div className="flex justify-between items-center px-8 sm:px-10 py-6 sm:py-8 border-b border-slate-50 dark:border-slate-800 shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10">
              <div>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">
                  {isBookingMode ? 'Borang Tajaan' : 'Butiran Sumbangan'}
                </p>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {new Date(selectedDateModal.date).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}
                </h2>
              </div>
              <button 
                onClick={() => setSelectedDateModal(null)} 
                className="p-2.5 sm:p-3 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
                aria-label="Tutup"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-8 sm:p-10 overflow-y-auto flex-1 overscroll-contain">
              {isBookingMode ? (
                /* BOOKING FORM */
                <form onSubmit={handleFoodSubmit} className="space-y-8 pb-4">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Nama Penyumbang</label>
                      <input 
                        type="text" 
                        required
                        value={foodForm.donorName}
                        onChange={e => setFoodForm({...foodForm, donorName: e.target.value})}
                        className="w-full px-5 sm:px-6 py-4 border-2 border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-bold focus:border-emerald-500 outline-none transition-all shadow-sm text-sm sm:text-base" 
                        placeholder="Masukkan nama penuh anda" 
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">No. Telefon</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                            type="tel" 
                            value={foodForm.contactNumber}
                            onChange={e => setFoodForm({...foodForm, contactNumber: e.target.value})}
                            className="w-full pl-12 pr-6 py-4 border-2 border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-bold focus:border-emerald-500 outline-none transition-all shadow-sm text-sm sm:text-base" 
                            placeholder="012-3456789" 
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Menu (Opsional)</label>
                        <div className="relative">
                          <Utensils className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                            type="text" 
                            value={foodForm.foodType}
                            onChange={e => setFoodForm({...foodForm, foodType: e.target.value})}
                            className="w-full pl-12 pr-6 py-4 border-2 border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-bold focus:border-emerald-500 outline-none transition-all shadow-sm text-sm sm:text-base" 
                            placeholder="Cth: Nasi Lemak" 
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Catatan / Doa</label>
                      <div className="relative">
                        <MessageSquare className="absolute left-4 top-5 text-slate-400" size={16} />
                        <textarea 
                          value={foodForm.notes}
                          onChange={e => setFoodForm({...foodForm, notes: e.target.value})}
                          className="w-full pl-12 pr-6 py-4 border-2 border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:border-emerald-500 outline-none transition-all shadow-sm h-32 resize-none text-sm sm:text-base" 
                          placeholder="Tuliskan hajat atau doa anda di sini..."
                        ></textarea>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 pt-6 border-t border-slate-50 dark:border-slate-800">
                    <button type="button" onClick={() => setSelectedDateModal(null)} className="w-full sm:w-auto px-8 py-4 sm:py-5 text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[20px] transition-all text-sm">Batal</button>
                    <button type="submit" disabled={foodLoading} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-4 sm:py-5 rounded-[20px] font-black transition-all shadow-xl shadow-emerald-600/20 active:scale-95 disabled:opacity-50 text-sm">
                      {foodLoading ? 'Sila Tunggu...' : 'Hantar Tajaan'}
                    </button>
                  </div>
                </form>
              ) : (
                /* DETAILS VIEW */
                <div className="space-y-8 animate-in fade-in duration-500 pb-4">
                  <div className="flex items-center gap-5 sm:gap-6 p-6 sm:p-8 bg-amber-50 dark:bg-amber-900/20 rounded-[32px] border border-amber-100 dark:border-amber-900/30 shadow-sm">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-md shrink-0 rotate-3 transition-transform">
                      <HandHeart className="text-amber-600" size={32} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] sm:text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] mb-1">Penyumbang Hari Ini</p>
                      <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white truncate">{selectedDateModal.booking.donor_name}</h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 sm:gap-8 px-2">
                    <div className="space-y-1">
                      <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Menu Tajaan</p>
                      <p className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200">{selectedDateModal.booking.food_type || 'Menu Am'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                      <div className="flex items-center gap-1.5 text-emerald-600 font-black text-sm sm:text-base">
                        <CheckCircle size={14} />
                        <span>Selesai</span>
                      </div>
                    </div>
                  </div>

                  {selectedDateModal.booking.notes && (
                    <div className="space-y-3 p-6 sm:p-8 bg-slate-50 dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-inner">
                      <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Hajat / Nota</p>
                      <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 italic font-medium leading-relaxed">
                        "{selectedDateModal.booking.notes}"
                      </p>
                    </div>
                  )}

                  <div className="pt-6 border-t border-slate-50 dark:border-slate-800">
                    <button onClick={() => setSelectedDateModal(null)} className="w-full py-4 sm:py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[20px] font-black transition-all hover:scale-[1.01] active:scale-95 shadow-xl text-sm sm:text-base">Tutup</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer Support */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
        <div className="bg-slate-900 rounded-[48px] p-10 sm:p-12 text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-teal-600/20 opacity-50"></div>
          <div className="relative z-10">
            <h3 className="text-2xl sm:text-3xl font-black text-white mb-4">Terima Kasih Atas Keprihatinan Anda</h3>
            <p className="text-slate-400 text-sm sm:text-lg max-w-2xl mx-auto mb-10 font-medium leading-relaxed">Setiap sumbangan anda amatlah dihargai dan digunakan sebaiknya untuk kelestarian Masjid Unggun.</p>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              <div className="bg-white/5 backdrop-blur-md px-6 sm:px-8 py-3 sm:py-4 rounded-2xl border border-white/10 text-emerald-400 font-black flex items-center gap-2 sm:gap-3 text-xs sm:text-base">
                <CheckCircle size={18} /> Transaksi Selamat
              </div>
              <div className="bg-white/5 backdrop-blur-md px-6 sm:px-8 py-3 sm:py-4 rounded-2xl border border-white/10 text-emerald-400 font-black flex items-center gap-2 sm:gap-3 text-xs sm:text-base">
                <CheckCircle size={18} /> Amanah & Telus
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
