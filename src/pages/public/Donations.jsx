import { Heart, Landmark, HandHeart, UploadCloud, Utensils, Box, Calendar as CalendarIcon, CheckCircle2, AlertCircle, Copy, X, Clock, CheckCircle, Info, XCircle, ChevronLeft, ChevronRight, Sparkles, ArrowRight, User } from 'lucide-react';
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
    donorName: profile?.full_name || '',
    foodType: '',
    contactNumber: profile?.phone_number || '',
    notes: ''
  });
  const [foodLoading, setFoodLoading] = useState(false);
  const [foodSuccess, setFoodSuccess] = useState(false);
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

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
      setTimeout(() => {
        setFoodSuccess(false);
        setIsFoodModalOpen(false);
        setFoodForm({ ...foodForm, date: '', foodType: '', notes: '' });
        fetchFoodDates();
      }, 3000);
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

  const handleDateClick = (dateStr, booking) => {
    if (isPastDate(dateStr)) return;
    
    if (booking) {
      setSelectedBooking(booking);
      setIsFoodModalOpen(true);
    } else {
      setSelectedBooking(null);
      setFoodForm({ ...foodForm, date: dateStr });
      setIsFoodModalOpen(true);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Hero Header */}
      <div className="bg-emerald-900 py-20 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-500 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-teal-500 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-800/40 backdrop-blur-md px-6 py-2 rounded-full border border-emerald-700/50 text-emerald-200 text-sm font-bold mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
            <Heart size={16} className="fill-emerald-400 text-emerald-400" />
            Infaq Fi Sabilillah
          </div>
          <h1 className="text-5xl sm:text-7xl font-black text-white mb-6 tracking-tight leading-tight">Sumbangan & Wakaf</h1>
          <p className="text-emerald-100/80 text-xl sm:text-2xl max-w-3xl mx-auto font-medium leading-relaxed">
            Hulurkan sumbangan anda untuk kemakmuran bersama dan kesejahteraan komuniti Masjid Unggun.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-slate-900 p-2.5 rounded-[36px] shadow-2xl flex flex-wrap justify-center sm:justify-start gap-2 mb-16 border border-slate-200/50 dark:border-slate-800/50">
          <button 
            onClick={() => setActiveTab('cash')} 
            className={`flex items-center gap-3 px-10 py-5 rounded-[28px] font-black transition-all duration-500 ${activeTab === 'cash' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/30 scale-105' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Landmark size={22} /> Sumbangan Tunai
          </button>
          <button 
            onClick={() => setActiveTab('food')} 
            className={`flex items-center gap-3 px-10 py-5 rounded-[28px] font-black transition-all duration-500 ${activeTab === 'food' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/30 scale-105' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Utensils size={22} /> Tajaan Makanan
          </button>
          <button 
            onClick={() => setActiveTab('asset')} 
            className={`flex items-center gap-3 px-10 py-5 rounded-[28px] font-black transition-all duration-500 ${activeTab === 'asset' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/30 scale-105' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Box size={22} /> Wakaf Barangan
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'cash' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Payment Details */}
            <div className="lg:col-span-5 space-y-8">
              <div className="bg-white dark:bg-slate-900 rounded-[48px] p-12 shadow-xl border border-slate-100 dark:border-slate-800">
                <h3 className="text-3xl font-black mb-10 text-slate-900 dark:text-white tracking-tight">Maklumat Akaun</h3>
                
                <div className="space-y-10">
                  <div className="group relative flex items-center gap-6 p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[32px] border border-slate-100 dark:border-slate-700 hover:border-emerald-500 transition-all cursor-pointer" onClick={() => handleCopy('552012345678')}>
                    <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm shrink-0 group-hover:rotate-6 transition-transform">
                      <Landmark className="text-emerald-600" size={32} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Maybank Islamic</p>
                      <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">5520 1234 5678</p>
                      <p className="text-sm text-slate-500 font-bold mt-1">Bendahari Masjid Unggun</p>
                    </div>
                    <div className="p-3 text-slate-400 group-hover:text-emerald-600 transition-colors">
                      {copied ? <CheckCircle size={24} className="text-emerald-500" /> : <Copy size={24} />}
                    </div>
                  </div>

                  <div className="text-center p-10 bg-emerald-50 dark:bg-emerald-950/30 rounded-[48px] border-2 border-emerald-100 dark:border-emerald-900/50 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500 to-transparent"></div>
                    <p className="text-xs font-black text-emerald-800 dark:text-emerald-300 mb-6 uppercase tracking-widest relative z-10">Imbas Kod QR DuitNow</p>
                    <div className="relative z-10 w-56 h-56 mx-auto bg-white p-4 rounded-[40px] shadow-2xl border-4 border-emerald-100 dark:border-emerald-900">
                      {settings?.donation_qr_url ? (
                        <img src={settings.donation_qr_url} alt="QR Code" className="w-full h-full object-contain" />
                      ) : (
                        <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                          <UploadCloud className="text-slate-200" size={64} />
                        </div>
                      )}
                    </div>
                    <p className="mt-6 text-sm font-bold text-emerald-700/60 dark:text-emerald-400/60">Simpan kod QR untuk sumbangan pantas</p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/20 p-8 rounded-[40px] border border-amber-100 dark:border-amber-900/30 flex gap-6 items-center">
                <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900 text-amber-600 rounded-[20px] flex items-center justify-center shrink-0 shadow-sm">
                  <Info size={28} />
                </div>
                <div>
                  <h4 className="font-black text-amber-900 dark:text-amber-200 text-lg">Resit Transaksi</h4>
                  <p className="text-sm text-amber-800/70 dark:text-amber-400/70 font-medium leading-relaxed mt-1">Sila simpan resit untuk rujukan pihak pengurusan jika perlu.</p>
                </div>
              </div>
            </div>

            {/* Donation Form */}
            <div className="lg:col-span-7">
              <div className="bg-white dark:bg-slate-900 rounded-[48px] p-12 shadow-xl border border-slate-100 dark:border-slate-800 h-full">
                <h3 className="text-3xl font-black mb-10 text-slate-900 dark:text-white tracking-tight">Makluman Sumbangan</h3>
                
                {cashSuccess ? (
                  <div className="text-center py-20 animate-in zoom-in-95 duration-500">
                    <div className="w-32 h-32 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-10 shadow-inner border-8 border-emerald-50 dark:border-emerald-900/20">
                      <CheckCircle2 size={64} />
                    </div>
                    <h4 className="text-4xl font-black mb-6 tracking-tight">Alhamdulillah!</h4>
                    <p className="text-slate-500 font-bold text-xl leading-relaxed max-w-md mx-auto">Maklumat sumbangan anda telah direkodkan. Semoga diberkati Allah SWT.</p>
                  </div>
                ) : (
                  <form onSubmit={handleCashSubmit} className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Nama Penyumbang</label>
                        <input 
                          type="text" 
                          required
                          value={cashForm.donorName}
                          onChange={e => setCashForm({...cashForm, donorName: e.target.value})}
                          placeholder="Hamba Allah"
                          className="w-full px-8 py-5 border-2 border-slate-50 dark:border-slate-800 rounded-[28px] bg-slate-50 dark:bg-slate-950 focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-lg"
                        />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Jumlah Sumbangan (RM)</label>
                        <input 
                          type="number" 
                          required
                          value={cashForm.amount}
                          onChange={e => setCashForm({...cashForm, amount: e.target.value})}
                          placeholder="0.00"
                          className="w-full px-8 py-5 border-2 border-slate-50 dark:border-slate-800 rounded-[28px] bg-slate-50 dark:bg-slate-950 focus:border-emerald-500 focus:bg-white outline-none transition-all font-black text-2xl text-emerald-600"
                        />
                      </div>
                    </div>

                    <div className="pt-6">
                      <button 
                        type="submit" 
                        disabled={cashLoading}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-8 rounded-[32px] font-black text-2xl shadow-2xl shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4 group"
                      >
                        {cashLoading ? 'Memproses...' : 'Hantar Maklumat'}
                        <ArrowRight size={28} className="group-hover:translate-x-2 transition-transform" />
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'food' && (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="bg-white dark:bg-slate-900 rounded-[60px] p-12 shadow-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-8">
                <div>
                  <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Jadual Sumbangan Makanan</h3>
                  <p className="text-slate-500 font-bold">Pilih tarikh tersedia untuk menaja hidangan komuniti.</p>
                </div>
                <div className="flex items-center gap-6 bg-slate-50 dark:bg-slate-800 px-8 py-4 rounded-[30px] border border-slate-100 dark:border-slate-700 shadow-sm">
                  <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white dark:hover:bg-slate-700 hover:shadow-md transition-all text-slate-600"><ChevronLeft size={24} /></button>
                  <span className="font-black text-slate-900 dark:text-white min-w-[200px] text-center uppercase tracking-[0.2em] text-lg">
                    {currentMonth.toLocaleDateString('ms-MY', { month: 'long', year: 'numeric' })}
                  </span>
                  <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white dark:hover:bg-slate-700 hover:shadow-md transition-all text-slate-600"><ChevronRight size={24} /></button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-6 mb-8">
                {['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'].map(day => (
                  <div key={day} className="text-center text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-6">
                {Array.from({ length: startDayOfMonth(currentMonth) }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-[4/5] bg-slate-50/30 dark:bg-slate-800/10 rounded-[32px]"></div>
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
                      className={`aspect-[4/5] rounded-[32px] border-2 p-6 flex flex-col items-start justify-between transition-all duration-500 group relative overflow-hidden ${
                        past ? 'bg-slate-50 border-slate-50 opacity-40 grayscale cursor-not-allowed' : 
                        booking ? 'bg-amber-50 border-amber-200 text-amber-900 hover:shadow-xl hover:-translate-y-2' :
                        'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-emerald-500 hover:shadow-2xl hover:-translate-y-2'
                      }`}
                    >
                      <div className="flex justify-between items-start w-full">
                        <span className={`text-3xl font-black leading-none ${isToday ? 'text-emerald-600' : ''}`}>{day}</span>
                        {isToday && <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>}
                      </div>

                      <div className="w-full">
                        {booking ? (
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-amber-600/60 uppercase tracking-widest">Disumbangkan</p>
                            <p className="text-xs font-bold truncate w-full">{booking.donor_name}</p>
                          </div>
                        ) : past ? (
                          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Berlalu</span>
                        ) : (
                          <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-full w-fit group-hover:bg-emerald-600 group-hover:text-white transition-all">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full group-hover:bg-white animate-pulse"></div>
                            <span className="text-[10px] font-black uppercase tracking-widest">Tersedia</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Food Booking Modal */}
            {isFoodModalOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
                <div className="bg-white dark:bg-slate-900 rounded-[50px] shadow-2xl w-full max-w-xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
                  <div className="p-10 border-b border-slate-50 dark:border-slate-800 flex justify-between items-start">
                    <div>
                      <p className="text-xs font-black text-emerald-600 uppercase tracking-[0.3em] mb-2">Maklumat Tajaan</p>
                      <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        {new Date(foodForm.date || selectedBooking?.date).toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </h3>
                    </div>
                    <button onClick={() => setIsFoodModalOpen(false)} className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full hover:scale-110 transition-all text-slate-400">
                      <X size={24} />
                    </button>
                  </div>

                  <div className="p-10">
                    {selectedBooking ? (
                      <div className="space-y-10">
                        <div className="flex items-center gap-8 bg-amber-50 dark:bg-amber-950/20 p-10 rounded-[40px] border border-amber-100 dark:border-amber-900/30">
                          <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-[28px] flex items-center justify-center shadow-xl shrink-0">
                            <User className="text-amber-600" size={36} />
                          </div>
                          <div>
                            <p className="text-xs font-black text-amber-600 uppercase tracking-widest mb-1">Penyumbang</p>
                            <h4 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">{selectedBooking.donor_name}</h4>
                            <p className="text-sm font-bold text-amber-800/60 dark:text-amber-400/60 mt-1">{selectedBooking.food_type || 'Tajaan Am'}</p>
                          </div>
                        </div>
                        {selectedBooking.notes && (
                          <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[32px] border border-slate-100 dark:border-slate-700 italic text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                            "{selectedBooking.notes}"
                          </div>
                        )}
                        <button onClick={() => setIsFoodModalOpen(false)} className="w-full bg-slate-900 text-white py-6 rounded-[28px] font-black text-lg shadow-xl active:scale-95 transition-all">
                          Tutup
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleFoodSubmit} className="space-y-8">
                        {foodSuccess ? (
                          <div className="text-center py-10 animate-in zoom-in-95 duration-500">
                            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                              <CheckCircle2 size={48} />
                            </div>
                            <h4 className="text-2xl font-black mb-2">Terima Kasih!</h4>
                            <p className="text-slate-500 font-bold">Tempahan anda sedang diproses.</p>
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Penaja</label>
                                <input type="text" required value={foodForm.donorName} onChange={e => setFoodForm({...foodForm, donorName: e.target.value})} className="w-full px-6 py-4 border-2 border-slate-50 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950 focus:border-emerald-500 outline-none transition-all font-bold" placeholder="Hamba Allah" />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">No. Telefon</label>
                                <input type="tel" required value={foodForm.contactNumber} onChange={e => setFoodForm({...foodForm, contactNumber: e.target.value})} className="w-full px-6 py-4 border-2 border-slate-50 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950 focus:border-emerald-500 outline-none transition-all font-bold" placeholder="01X-XXXXXXX" />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Menu Makanan (Opsional)</label>
                              <input type="text" value={foodForm.foodType} onChange={e => setFoodForm({...foodForm, foodType: e.target.value})} className="w-full px-6 py-4 border-2 border-slate-50 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950 focus:border-emerald-500 outline-none transition-all font-bold" placeholder="Cth: Nasi Lemak / Bebas" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Catatan / Doa</label>
                              <textarea value={foodForm.notes} onChange={e => setFoodForm({...foodForm, notes: e.target.value})} className="w-full px-6 py-4 border-2 border-slate-50 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950 focus:border-emerald-500 outline-none transition-all font-medium h-24 resize-none" placeholder="Masukkan hajat atau nota..."></textarea>
                            </div>
                            <button 
                              type="submit" 
                              disabled={foodLoading}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 rounded-3xl font-black text-xl shadow-xl shadow-emerald-600/20 active:scale-95 transition-all"
                            >
                              {foodLoading ? 'Sila Tunggu...' : 'Hantar Tajaan'}
                            </button>
                          </>
                        )}
                      </form>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'asset' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Asset Selection */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-[50px] p-12 shadow-xl border border-slate-100 dark:border-slate-800">
              <h3 className="text-3xl font-black mb-10 text-slate-900 dark:text-white tracking-tight">Barangan Diperlukan</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {assets.length === 0 ? (
                  <div className="col-span-full py-24 text-center bg-slate-50 dark:bg-slate-800/30 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-700">
                    <Box className="mx-auto mb-4 text-slate-300" size={48} />
                    <p className="text-slate-500 font-bold">Tiada item diperlukan buat masa ini.</p>
                  </div>
                ) : assets.map(asset => (
                  <button 
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset)}
                    className={`p-8 rounded-[40px] border-2 text-left transition-all relative overflow-hidden group h-full flex flex-col ${
                      selectedAsset?.id === asset.id 
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 ring-8 ring-emerald-500/5 scale-105 shadow-2xl' 
                        : 'border-slate-100 dark:border-slate-800 hover:border-emerald-300 hover:bg-white hover:shadow-xl'
                    }`}
                  >
                    <div className="flex items-center gap-6 mb-6">
                      <div className="w-20 h-20 rounded-[24px] overflow-hidden bg-white shrink-0 shadow-lg border border-slate-100">
                        {asset.image_url ? <img src={asset.image_url} className="w-full h-full object-cover" /> : <Box className="w-full h-full p-6 text-slate-200" />}
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors leading-tight">{asset.item}</h4>
                        <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full mt-2 inline-block ${
                          asset.urgency_level === 'Sangat Diperlukan' ? 'bg-rose-500 text-white animate-pulse' : 'bg-emerald-600 text-white'
                        }`}>{asset.urgency_level}</span>
                      </div>
                    </div>
                    <div className="mt-auto space-y-3">
                      <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        <span>Kemajuan</span>
                        <span>{Math.min(100, Math.round((asset.received_quantity / asset.needed_quantity) * 100))}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden shadow-inner p-0.5">
                        <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, Math.round((asset.received_quantity / asset.needed_quantity) * 100))}%` }}></div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Asset Form */}
            <div className="lg:col-span-5">
              <div className="bg-white dark:bg-slate-900 rounded-[50px] p-12 shadow-xl border border-slate-100 dark:border-slate-800 sticky top-28">
                <h3 className="text-3xl font-black mb-10 text-slate-900 dark:text-white tracking-tight">Borang Wakaf</h3>
                
                {assetSuccess ? (
                  <div className="text-center py-16 animate-in zoom-in-95 duration-500">
                    <div className="w-28 h-28 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border-8 border-emerald-50">
                      <CheckCircle2 size={56} />
                    </div>
                    <h4 className="text-3xl font-black mb-4">Terima Kasih!</h4>
                    <p className="text-slate-500 font-bold text-lg">Semoga Allah SWT membalas kebaikan anda dengan keberkatan yang melimpah ruah.</p>
                  </div>
                ) : (
                  <form onSubmit={handleAssetSubmit} className="space-y-10">
                    {!selectedAsset ? (
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-10 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-700 text-center flex flex-col items-center justify-center min-h-[300px]">
                        <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center shadow-md mb-6">
                          <Box className="text-slate-200" size={40} />
                        </div>
                        <p className="text-lg font-bold text-slate-400 max-w-[240px]">Sila pilih item yang ingin diwakafkan daripada senarai.</p>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 p-8 rounded-[36px] border-2 border-emerald-100 dark:border-emerald-800 flex items-center gap-6 animate-in slide-in-from-top-4 duration-500">
                        <div className="w-16 h-16 bg-white rounded-2xl overflow-hidden border-2 border-emerald-100 shrink-0 shadow-lg">
                          {selectedAsset.image_url ? <img src={selectedAsset.image_url} className="w-full h-full object-cover" /> : <Box className="p-4 text-emerald-100" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Item Terpilih</p>
                          <p className="text-2xl font-black text-emerald-900 dark:text-emerald-300 leading-tight">{selectedAsset.item}</p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Nama Pewakaf</label>
                        <input type="text" required value={assetForm.donorName} onChange={e => setAssetForm({...assetForm, donorName: e.target.value})} className="w-full px-8 py-5 border-2 border-slate-50 dark:border-slate-800 rounded-[28px] bg-slate-50 dark:bg-slate-950 focus:border-emerald-500 outline-none transition-all font-bold text-lg" placeholder="Nama anda" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Kuantiti (Unit)</label>
                        <input type="number" min="1" required value={assetForm.quantity} onChange={e => setAssetForm({...assetForm, quantity: e.target.value})} className="w-full px-8 py-5 border-2 border-slate-50 dark:border-slate-800 rounded-[28px] bg-slate-50 dark:bg-slate-950 focus:border-emerald-500 outline-none transition-all font-black text-2xl text-emerald-600" />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={!selectedAsset || assetLoading}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-8 rounded-[32px] font-black text-2xl shadow-2xl shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4 group"
                    >
                      {assetLoading ? 'Menghantar...' : 'Sahkan Wakaf'}
                      <ArrowRight size={28} className="group-hover:translate-x-2 transition-transform" />
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Support Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-32">
        <div className="bg-slate-900 rounded-[60px] p-16 sm:p-24 text-center relative overflow-hidden group border border-white/5 shadow-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-teal-600/10 opacity-30"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] -mr-48 -mt-48 group-hover:scale-150 transition-transform duration-1000"></div>
          
          <div className="relative z-10 max-w-3xl mx-auto">
            <h3 className="text-4xl sm:text-5xl font-black text-white mb-8 tracking-tight">Terima Kasih Atas Kemurahan Hati Anda</h3>
            <p className="text-slate-400 text-xl font-medium leading-relaxed mb-16 opacity-80">
              Setiap sen dan setiap barangan yang anda wakafkan menjadi asbab kepada keselesaan jemaah dan kelancaran operasi Masjid Unggun.
            </p>
            
            <div className="flex flex-wrap justify-center gap-6">
              <div className="bg-white/5 backdrop-blur-xl px-10 py-5 rounded-[24px] border border-white/10 text-emerald-400 font-black flex items-center gap-4 hover:bg-white/10 transition-all">
                <CheckCircle size={24} className="text-emerald-500" /> Amanah & Telus
              </div>
              <div className="bg-white/5 backdrop-blur-xl px-10 py-5 rounded-[24px] border border-white/10 text-emerald-400 font-black flex items-center gap-4 hover:bg-white/10 transition-all">
                <CheckCircle size={24} className="text-emerald-500" /> Pengurusan Sistematik
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
