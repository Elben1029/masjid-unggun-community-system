import { Heart, Landmark, HandHeart, UploadCloud, Utensils, Box, Calendar as CalendarIcon, CheckCircle2, AlertCircle, Copy, X, Clock, CheckCircle, Info, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function Donations() {
  const { settings } = useSettings();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('cash'); // 'cash', 'food', 'asset'
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // --- CASH DONATION STATE ---
  const [cashForm, setCashForm] = useState({
    donorName: '',
    amount: '',
    reference: '',
  });
  const [cashFile, setCashFile] = useState(null);
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
  const [selectedDateModal, setSelectedDateModal] = useState(null); // For the new Date selection modal

  // --- ASSET WAQF STATE ---
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [assetForm, setAssetForm] = useState({
    donorName: '',
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
        purpose: 'Tabung Masjid',
        status: 'pending'
      });

      if (error) throw error;
      
      setCashSuccess(true);
      setCashForm({ donorName: '', amount: '', reference: '' });
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
      const { data: existingBooking } = await supabase
        .from("food_donations")
        .select("id")
        .eq("date", foodForm.date)
        .maybeSingle();

      if (existingBooking) {
        alert("Tarikh ini sudah pun ditaja. Sila pilih tarikh lain.");
        setFoodLoading(false);
        return;
      }

      const { error } = await supabase.from('food_donations').insert({
        date: foodForm.date,
        donor_name: foodForm.donorName || 'Hamba Allah',
        food_type: foodForm.foodType,
        user_id: user?.id || null,
        contact_number: foodForm.contactNumber,
        notes: foodForm.notes,
        status: 'pending'
      });

      if (error) throw error;
      setFoodSuccess(true);
      fetchFoodDates();
      setFoodForm({ date: '', donorName: '', foodType: '', contactNumber: '', notes: '' });
      setTimeout(() => setFoodSuccess(false), 5000);
    } catch (err) {
      console.error(err);
      alert("Gagal menempah tarikh. Mungkin telah ditempah orang lain.");
    } finally {
      setFoodLoading(false);
    }
  };

  const handleAssetSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAsset) return alert("Sila pilih aset.");

    setAssetLoading(true);
    try {
      const { error } = await supabase.from('asset_waqf_donations').insert({
        inventory_id: selectedAsset.id,
        user_id: user?.id || null,
        donor_name: assetForm.donorName || 'Hamba Allah',
        quantity: parseInt(assetForm.quantity),
        status: 'pending'
      });

      if (error) throw error;
      setAssetSuccess(true);
      setAssetForm({ donorName: '', quantity: 1 });
      setSelectedAsset(null);
      setTimeout(() => setAssetSuccess(false), 5000);
    } catch (err) {
      console.error(err);
      alert("Gagal menghantar makluman wakaf.");
    } finally {
      setAssetLoading(false);
    }
  };

  const handleCopyAccount = () => {
    const accountNo = settings?.account_number || '10052010123456';
    navigator.clipboard.writeText(accountNo.replace(/\s+/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateCalendarGrid = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // 0 = Sunday, 1 = Monday...
    const firstDayIndex = new Date(year, month, 1).getDay(); 
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const grid = [];
    // Padding for first week
    for (let i = 0; i < firstDayIndex; i++) {
      grid.push(null);
    }
    // Days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      grid.push(`${yyyy}-${mm}-${dd}`);
    }
    return grid;
  };

  const getDayDetails = (dateStr) => {
    return foodDates.find(f => f.date === dateStr);
  };

  const isPastDate = (dateStr) => {
    if (!dateStr) return false;
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return dateStr < `${yyyy}-${mm}-${dd}`;
  };

  const getStatusColorIndicator = (status) => {
    switch (status) {
      case 'approved': return 'bg-blue-500';
      case 'completed': return 'bg-green-600';
      case 'cancelled': return 'bg-slate-400';
      case 'pending': return 'bg-amber-500';
      default: return 'bg-emerald-400';
    }
  };
  
  const getBadgeClass = (status) => {
    switch (status) {
      case 'approved': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'cancelled': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
      case 'pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
      default: return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'approved': return 'Diluluskan';
      case 'completed': return 'Selesai';
      case 'cancelled': return 'Dibatalkan';
      case 'pending': return 'Menunggu';
      default: return 'Available';
    }
  };

  const slotLabels = {
    'breakfast': 'Sarapan',
    'lunch': 'Makan Tengah Hari',
    'dinner': 'Makan Malam'
  };
  
  const weekDays = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative text-slate-900 dark:text-white">
      <div className="mb-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 mb-6 shadow-sm">
          <Heart size={32} className="animate-pulse" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-6">Kempen Sumbangan</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          "Perumpamaan orang yang menafkahkan hartanya di jalan Allah adalah serupa dengan sebutir benih yang menumbuhkan tujuh bulir, pada tiap-tiap bulir seratus biji."
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-12">
        <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl inline-flex flex-wrap justify-center gap-2">
          <button 
            onClick={() => setActiveTab('cash')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'cash' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            <Landmark size={18} />
            <span className="hidden sm:inline">Wang Ringgit</span>
            <span className="sm:hidden">Wang</span>
          </button>
          <button 
            onClick={() => setActiveTab('food')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'food' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            <Utensils size={18} />
            <span className="hidden sm:inline">Jadual Makanan</span>
            <span className="sm:hidden">Makanan</span>
          </button>
          <button 
            onClick={() => setActiveTab('asset')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'asset' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            <Box size={18} />
            <span className="hidden sm:inline">Aset Masjid</span>
            <span className="sm:hidden">Aset</span>
          </button>
        </div>
      </div>

      {/* CASH DONATION TAB */}
      {activeTab === 'cash' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="lg:col-span-7 space-y-6">
            
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 text-center">
              <Landmark className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Tabung Masjid</h2>
              <p className="text-emerald-700 dark:text-emerald-300 font-medium">Sumbangan anda akan disalurkan terus ke Tabung Masjid untuk pelbagai kegunaan dan kebajikan.</p>
            </div>

            <div className="glass p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-bold mb-6 border-b pb-4 border-slate-100 dark:border-slate-800">Maklumat Pembayaran</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                {/* QR Section */}
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center">
                  <h4 className="font-bold mb-4">Bayar Menggunakan QR</h4>
                  {(settings?.qr_image_url || settings?.qr_code_url) ? (
                    <img src={settings.qr_image_url || settings.qr_code_url} alt="DuitNow QR" className="w-32 h-32 sm:w-40 sm:h-40 rounded-xl bg-white p-3 shadow-md object-contain mb-4" />
                  ) : (
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${settings?.account_number || '10052010123456'}`} alt="DuitNow QR" className="w-32 h-32 sm:w-40 sm:h-40 rounded-xl bg-white p-3 shadow-md mb-4" />
                  )}
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Imbas kod QR menggunakan aplikasi bank atau e-wallet anda.
                  </p>
                </div>

                {/* Bank Transfer Section */}
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col justify-center">
                  <h4 className="font-bold mb-4 text-center md:text-left">Pemindahan Bank</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold mb-1">Bank</p>
                      <p className="font-bold text-lg">{settings?.bank_name || 'Bank Islam Malaysia Berhad'}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold mb-1">No Akaun</p>
                      <div className="flex items-center gap-3">
                        <p className="font-mono text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
                          {settings?.account_number || '1005 2010 1234 56'}
                        </p>
                        <button 
                          onClick={handleCopyAccount}
                          className="p-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-600 dark:text-slate-300"
                          title="Salin No Akaun"
                        >
                          {copied ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Copy size={18} />}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold mb-1">Nama Akaun</p>
                      <p className="font-medium text-slate-700 dark:text-slate-300">{settings?.account_name || 'Masjid Unggun Kota Kinabalu'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="glass-card rounded-3xl p-6 sm:p-8 sticky top-28 border border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold mb-6">Makluman Sumbangan</h2>
              
              {cashSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Alhamdulillah!</h3>
                  <p className="text-slate-600 dark:text-slate-400">Maklumat sumbangan anda telah diterima. Terima kasih atas keprihatinan anda.</p>
                </div>
              ) : (
                <form onSubmit={handleCashSubmit} className="space-y-4 sm:space-y-5">
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800 flex items-start gap-3">
                    <Info size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">
                      Sila masukkan maklumat sumbangan selepas anda membuat transaksi melalui QR atau perbankan internet untuk rujukan kami.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Penyumbang (Pilihan)</label>
                    <input
                      type="text"
                      value={cashForm.donorName}
                      onChange={e => setCashForm({...cashForm, donorName: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-900/50 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Hamba Allah"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Jumlah Sumbangan (RM)</label>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      required
                      value={cashForm.amount}
                      onChange={e => setCashForm({...cashForm, amount: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-900/50 focus:ring-emerald-500 focus:border-emerald-500 text-lg font-bold text-emerald-600"
                      placeholder="0.00"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={cashLoading}
                    className="w-full py-4 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 mt-4"
                  >
                    {cashLoading ? 'Memproses...' : 'Sahkan Sumbangan'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FOOD DONATION TAB */}
      {activeTab === 'food' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="lg:col-span-8 glass-card rounded-3xl p-4 sm:p-8 border border-slate-200 dark:border-slate-800">
            {/* Calendar Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
              <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                <CalendarIcon className="text-emerald-500" />
                Jadual Sumbangan
              </h2>
              <div className="flex items-center gap-1 sm:gap-3 bg-slate-100 dark:bg-slate-800 p-1.5 sm:p-2 rounded-xl">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                  className="p-1.5 sm:p-2 rounded-lg bg-white dark:bg-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                >
                  <ChevronLeft size={20} className="text-slate-700 dark:text-slate-300" />
                </button>
                <span className="font-bold py-1 min-w-[120px] sm:min-w-[140px] text-center text-sm sm:text-base">
                  {currentMonth.toLocaleDateString('ms-MY', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                  className="p-1.5 sm:p-2 rounded-lg bg-white dark:bg-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                >
                  <ChevronRight size={20} className="text-slate-700 dark:text-slate-300" />
                </button>
              </div>
            </div>
            
            {/* Monthly Calendar Grid */}
            <div className="w-full">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                {weekDays.map(day => (
                  <div key={day} className="text-center text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider py-2">
                    <span className="hidden sm:inline">{day}</span>
                    <span className="sm:hidden">{day.substring(0,3)}</span>
                  </div>
                ))}
              </div>
              
              {/* Calendar cells */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {generateCalendarGrid().map((dateStr, index) => {
                  if (!dateStr) {
                    return <div key={`empty-${index}`} className="min-h-[70px] sm:min-h-[110px] rounded-xl bg-slate-50/50 dark:bg-slate-800/10"></div>;
                  }
                  
                  const dateObj = new Date(dateStr);
                  const dateNum = dateObj.getDate();
                  const past = isPastDate(dateStr);
                  const isToday = dateStr === new Date().toLocaleDateString('en-CA');
                  const isSelected = foodForm.date === dateStr;
                  
                  // Get booking for this date
                  const booking = getDayDetails(dateStr);
                  const isSponsored = !!booking;
                  
                  return (
                    <button 
                      key={dateStr} 
                      onClick={() => {
                        if (!past) {
                          setFoodForm({...foodForm, date: dateStr});
                        }
                      }}
                      className={`relative min-h-[70px] sm:min-h-[110px] p-2 flex flex-col items-center sm:items-start rounded-xl border transition-all duration-300 ${
                        past 
                          ? 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed dark:border-slate-800 dark:bg-slate-900/20 dark:text-slate-600' 
                          : isSelected
                            ? 'border-emerald-500 bg-emerald-50 shadow-md ring-2 ring-emerald-500/20 dark:border-emerald-500 dark:bg-emerald-900/20'
                            : isSponsored
                              ? 'border-amber-200 bg-amber-50/50 hover:shadow-sm dark:border-amber-900/50 dark:bg-amber-950/20'
                              : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:hover:border-emerald-700'
                      }`}
                    >
                      <span className={`text-xs sm:text-sm font-bold w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full mb-1 sm:mb-2 ${
                        isToday ? 'bg-emerald-600 text-white' : ''
                      }`}>
                        {dateNum}
                      </span>
                      
                      {!past && (
                        <div className="w-full flex flex-col gap-1 items-center sm:items-start">
                          {isSponsored ? (
                            <>
                              <div className="hidden sm:block text-[10px] font-bold text-amber-700 dark:text-amber-400 leading-tight">Ditaja Oleh:</div>
                              <div className="hidden sm:block text-[10px] font-medium text-slate-600 dark:text-slate-400 truncate w-full">{booking.donor_name}</div>
                              <div className="sm:hidden w-2 h-2 rounded-full bg-amber-500"></div>
                            </>
                          ) : (
                            <>
                              <div className="hidden sm:block text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Kosong</div>
                              <div className="sm:hidden w-2 h-2 rounded-full bg-emerald-400"></div>
                            </>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 mt-8 text-xs sm:text-sm text-slate-500 dark:text-slate-400 justify-center border-t border-slate-100 dark:border-slate-800 pt-6">
              <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-white border border-slate-300 dark:bg-slate-800 dark:border-slate-700"></div> Tersedia (Available)</span>
              <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div> Telah Ditaja (Sponsored)</span>
              <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-600"></div> Hari Ini</span>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="glass-card rounded-3xl p-6 sm:p-8 sticky top-28 border border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold mb-6">Borang Tempahan</h2>
              {foodSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Alhamdulillah!</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">Tempahan tarikh sumbangan anda sedang diproses. Pihak masjid akan menghubungi anda sebentar lagi.</p>
                </div>
              ) : (
                <form onSubmit={handleFoodSubmit} className="space-y-4">
                  {foodForm.date ? (
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 p-4 rounded-xl mb-4 border border-emerald-100 dark:border-emerald-800">
                      <div className="flex items-center gap-3">
                        <CalendarIcon size={20} />
                        <div>
                          <p className="text-[10px] opacity-80 uppercase font-bold tracking-wider">Tarikh Dipilih</p>
                          <p className="font-bold text-sm">
                            {new Date(foodForm.date).toLocaleDateString('ms-MY', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'})}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 p-4 rounded-xl mb-4 flex items-start gap-3 border border-slate-200 dark:border-slate-700">
                      <Info size={20} className="shrink-0 mt-0.5 text-slate-400" />
                      <p className="text-sm">Sila klik pada tarikh tersedia di kalendar untuk menaja hidangan komuniti.</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Penaja / Kumpulan</label>
                    <input
                      type="text"
                      required
                      value={foodForm.donorName}
                      onChange={e => setFoodForm({...foodForm, donorName: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-900/50 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                      placeholder="Cth: Keluarga Hj Ahmad"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Menu Makanan (Pilihan)</label>
                    <input
                      type="text"
                      value={foodForm.foodType}
                      onChange={e => setFoodForm({...foodForm, foodType: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-900/50 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                      placeholder="Cth: Nasi Lemak / Mee Goreng"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">No. Telefon</label>
                    <input
                      type="tel"
                      required
                      value={foodForm.contactNumber}
                      onChange={e => setFoodForm({...foodForm, contactNumber: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-900/50 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Hajat / Doa / Nota (Pilihan)</label>
                    <textarea
                      rows="3"
                      value={foodForm.notes}
                      onChange={e => setFoodForm({...foodForm, notes: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-900/50 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                      placeholder="Masukkan doa atau nota khas untuk penajaan ini"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={!foodForm.date || foodLoading}
                    className="w-full py-4 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 mt-4"
                  >
                    {foodLoading ? 'Menghantar...' : 'Sahkan Penajaan'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ASSET WAQF TAB */}
      {activeTab === 'asset' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="lg:col-span-7 space-y-6">
            <h2 className="text-2xl font-bold mb-6">Senarai Keperluan Aset Masjid</h2>
            {assets.length === 0 ? (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 text-center">
                <Box className="mx-auto h-12 w-12 text-amber-500 mb-3 opacity-50" />
                <p className="text-amber-800 dark:text-amber-300 font-medium">Tiada senarai aset diperlukan buat masa ini.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assets.map(asset => {
                  const percent = Math.min(100, Math.round(((asset.received_quantity || 0) / (asset.needed_quantity || 1)) * 100));
                  return (
                    <div 
                      key={asset.id}
                      onClick={() => setSelectedAsset(asset)}
                      className={`cursor-pointer rounded-2xl border-2 transition-all duration-300 flex flex-col overflow-hidden ${
                        selectedAsset?.id === asset.id 
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10 shadow-md transform -translate-y-1' 
                          : 'border-transparent glass-card hover:border-emerald-200 dark:hover:border-emerald-800'
                      }`}
                    >
                      {asset.image_url && (
                        <div className="h-40 w-full overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                          <img src={asset.image_url} alt={asset.item} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold line-clamp-1 flex-1">{asset.item}</h3>
                          {percent >= 100 ? (
                            <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-bold rounded-full whitespace-nowrap">Selesai</span>
                          ) : percent > 50 ? (
                            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] font-bold rounded-full whitespace-nowrap">Hampir Selesai</span>
                          ) : (
                            <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] font-bold rounded-full whitespace-nowrap">Diperlukan</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 flex-1">Kategori: {asset.category}</p>
                        
                        <div className="mt-auto">
                          <div className="flex justify-between text-xs font-bold mb-1.5">
                            <span className="text-emerald-600 dark:text-emerald-400">{asset.received_quantity || 0} Unit</span>
                            <span className="text-slate-500">{percent}% (Sasaran: {asset.needed_quantity || 0})</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${percent}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="lg:col-span-5">
            <div className="glass-card rounded-3xl p-6 sm:p-8 sticky top-28 border border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold mb-6">Borang Wakaf Aset</h2>
              
              {assetSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Alhamdulillah!</h3>
                  <p className="text-slate-600 dark:text-slate-400">Makluman wakaf anda telah dihantar. Pihak masjid akan menghubungi anda sebentar lagi.</p>
                </div>
              ) : (
                <form onSubmit={handleAssetSubmit} className="space-y-4 sm:space-y-5">
                  {!selectedAsset && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 p-4 rounded-xl mb-4 flex items-start gap-3">
                      <AlertCircle size={20} className="shrink-0 mt-0.5" />
                      <p className="text-sm">Sila pilih aset yang ingin diwakafkan dari senarai di sebelah.</p>
                    </div>
                  )}

                  {selectedAsset && (
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl p-4 mb-4">
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-1">Aset Dipilih</p>
                      <p className="font-bold">{selectedAsset.item}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Pewakaf</label>
                    <input
                      type="text"
                      required
                      value={assetForm.donorName}
                      onChange={e => setAssetForm({...assetForm, donorName: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-900/50 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Cth: Hamba Allah"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kuantiti (Unit)</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={assetForm.quantity}
                      onChange={e => setAssetForm({...assetForm, quantity: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-900/50 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!selectedAsset || assetLoading}
                    className="w-full py-4 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
                  >
                    {assetLoading ? 'Menghantar...' : 'Sahkan Wakaf'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QUICK VIEW / SLOT DETAILS MODAL FOR CALENDAR (Mobile Bottom Sheet / Desktop Modal) */}
      {selectedDateModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedDateModal(null)}>
          <div 
            className="bg-white dark:bg-slate-900 w-full sm:max-w-xl sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom sm:slide-in-from-bottom-8" 
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 z-10">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Maklumat Tempahan</p>
                <h3 className="text-xl sm:text-2xl font-bold">
                  {new Date(selectedDateModal).toLocaleDateString('ms-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}
                </h3>
              </div>
              <button onClick={() => setSelectedDateModal(null)} className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
                <X size={20} className="text-slate-600 dark:text-slate-300" />
              </button>
            </div>
            
            {/* Modal Body: Slots */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
              {['breakfast', 'lunch', 'dinner'].map(slotId => {
                const booking = getSlotDetails(selectedDateModal, slotId);
                const past = isPastDate(selectedDateModal);
                
                return (
                  <div key={slotId} className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-50/50 dark:bg-slate-800/20">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-bold text-lg">{slotLabels[slotId]}</h4>
                        {!booking && <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Kosong</span>}
                        {booking && <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${getBadgeClass(booking.status)}`}>{getStatusLabel(booking.status)}</span>}
                      </div>
                      
                      {booking ? (
                        <div className="space-y-1 text-sm">
                          <p><span className="text-slate-500 dark:text-slate-400">Disumbang oleh:</span> <span className="font-medium text-slate-900 dark:text-white">{booking.donor_name}</span></p>
                          <p><span className="text-slate-500 dark:text-slate-400">Menu:</span> <span className="font-medium text-slate-900 dark:text-white">{booking.food_type}</span></p>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {past ? 'Telah Berlalu' : 'Tiada tempahan untuk slot ini. Anda boleh menempah slot ini sekarang.'}
                        </p>
                      )}
                    </div>
                    
                    {!booking && !past && (
                      <button 
                        onClick={() => {
                          setFoodForm({...foodForm, date: selectedDateModal, slot: slotId});
                          setSelectedDateModal(null);
                          // Optional scroll to form logic could go here
                        }}
                        className="px-4 py-2 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors w-full sm:w-auto text-center"
                      >
                        Tempah Slot
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
