import { Heart, Landmark, HandHeart, UploadCloud, Utensils, Box, Calendar as CalendarIcon, CheckCircle2, AlertCircle, Copy, X, Clock, CheckCircle, Info, XCircle } from 'lucide-react';
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
    slot: '',
    donorName: '',
    foodType: '',
    contactNumber: '',
    notes: ''
  });
  const [foodLoading, setFoodLoading] = useState(false);
  const [foodSuccess, setFoodSuccess] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null); // For Quick View Modal

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
  useEffect(() => {
    fetchFoodDates();
  }, [currentMonth]);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchFoodDates = async () => {
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('food_donations')
        .select('id, date, slot, status, donor_name, food_type, contact_number, notes, created_at')
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

  // HANDLERS
  const handleCashSubmit = async (e) => {
    e.preventDefault();
    if (!cashFile) return alert("Sila muat naik resit transaksi.");
    if (!cashForm.amount || Number(cashForm.amount) <= 0) {
      alert("Jumlah sumbangan tidak sah");
      return;
    }
    
    setCashLoading(true);
    try {
      const fileExt = cashFile.name.split('.').pop();
      const fileName = `receipt-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, cashFile);
      
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName);

      const { error } = await supabase.from('cash_donations').insert({
        user_id: user?.id || null,
        donor_name: cashForm.donorName || 'Hamba Allah',
        amount: Number(cashForm.amount),
        donation_type: 'Tabung Masjid',
        reference_number: cashForm.reference || null,
        receipt_url: urlData.publicUrl || null,
        status: 'pending'
      });

      if (error) {
        console.error("Cash donation insert error:", error);
        alert(error.message);
        return;
      }
      setCashSuccess(true);
      setCashForm({ donorName: '', amount: '', reference: '' });
      setCashFile(null);
      setTimeout(() => setCashSuccess(false), 5000);
    } catch (err) {
      console.error(err);
      alert("Gagal menghantar sumbangan. Sila cuba lagi.");
    } finally {
      setCashLoading(false);
    }
  };

  const handleFoodSubmit = async (e) => {
    e.preventDefault();
    if (!foodForm.date) return alert("Sila pilih tarikh.");
    if (!foodForm.slot) return alert("Sila pilih slot.");

    setFoodLoading(true);
    try {
      const { data: existingBooking } = await supabase
        .from("food_donations")
        .select("id")
        .eq("date", foodForm.date)
        .eq("slot", foodForm.slot)
        .maybeSingle();

      if (existingBooking) {
        alert("Slot sudah ditempah");
        setFoodLoading(false);
        return;
      }

      const { error } = await supabase.from('food_donations').insert({
        date: foodForm.date,
        slot: foodForm.slot,
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
      setFoodForm({ date: '', slot: '', donorName: '', foodType: '', contactNumber: '', notes: '' });
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

  const generateDates = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dates = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      dates.push(`${yyyy}-${mm}-${dd}`);
    }
    return dates;
  };

  const getSlotDetails = (dateStr, slot) => {
    return foodDates.find(f => f.date === dateStr && f.slot === slot);
  };

  const isSlotTaken = (dateStr, slot) => {
    const booking = getSlotDetails(dateStr, slot);
    return booking && (booking.status === 'approved' || booking.status === 'completed');
  };

  const isSlotPending = (dateStr, slot) => {
    const booking = getSlotDetails(dateStr, slot);
    return booking && booking.status === 'pending';
  };

  const isDateFullyTaken = (dateStr) => {
    return ['breakfast', 'lunch', 'dinner'].every(slot => isSlotTaken(dateStr, slot) || isSlotPending(dateStr, slot));
  };

  const isPastDate = (dateStr) => {
    // using local time string YYYY-MM-DD
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return dateStr < `${yyyy}-${mm}-${dd}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
      case 'completed': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
      case 'pending':
      default: return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'approved': return 'Diluluskan';
      case 'completed': return 'Selesai';
      case 'cancelled': return 'Dibatalkan';
      case 'pending':
      default: return 'Menunggu';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle size={12} className="mr-1" />;
      case 'completed': return <CheckCircle2 size={12} className="mr-1" />;
      case 'cancelled': return <XCircle size={12} className="mr-1" />;
      case 'pending':
      default: return <Clock size={12} className="mr-1" />;
    }
  };

  const slotLabels = {
    'breakfast': 'Sarapan',
    'lunch': 'Makan Tengah Hari',
    'dinner': 'Makan Malam'
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
      <div className="mb-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 mb-6 shadow-sm">
          <Heart size={32} className="animate-pulse" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">Kempen Sumbangan</h1>
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
            Wang Ringgit
          </button>
          <button 
            onClick={() => setActiveTab('food')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'food' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            <Utensils size={18} />
            Jadual Sumbangan Makanan
          </button>
          <button 
            onClick={() => setActiveTab('asset')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'asset' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            <Box size={18} />
            Sumbangan Aset Masjid
          </button>
        </div>
      </div>

      {/* CASH DONATION TAB */}
      {activeTab === 'cash' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="lg:col-span-7 space-y-6">
            
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 text-center">
              <Landmark className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Tabung Masjid</h2>
              <p className="text-emerald-700 dark:text-emerald-300 font-medium">Sumbangan anda akan disalurkan terus ke Tabung Masjid untuk pelbagai kegunaan dan kebajikan.</p>
            </div>

            <div className="glass p-8 rounded-3xl mt-8 shadow-sm">
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 border-b pb-4 border-slate-100 dark:border-slate-800">Maklumat Pembayaran</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* QR Section */}
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center">
                  <h4 className="font-bold text-slate-800 dark:text-white mb-4">Bayar Menggunakan QR</h4>
                  {(settings?.qr_image_url || settings?.qr_code_url) ? (
                    <img src={settings.qr_image_url || settings.qr_code_url} alt="DuitNow QR" className="w-40 h-40 rounded-xl bg-white p-3 shadow-md object-contain mb-4" />
                  ) : (
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${settings?.account_number || '10052010123456'}`} alt="DuitNow QR" className="w-40 h-40 rounded-xl bg-white p-3 shadow-md mb-4" />
                  )}
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Imbas kod QR menggunakan aplikasi bank atau e-wallet anda.
                  </p>
                </div>

                {/* Bank Transfer Section */}
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col justify-center">
                  <h4 className="font-bold text-slate-800 dark:text-white mb-4 text-center md:text-left">Pemindahan Bank</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold mb-1">Bank</p>
                      <p className="font-bold text-slate-800 dark:text-white text-lg">{settings?.bank_name || 'Bank Islam Malaysia Berhad'}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold mb-1">No Akaun</p>
                      <div className="flex items-center gap-3">
                        <p className="font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
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
            <div className="glass-card rounded-3xl p-8 sticky top-28 border border-slate-200 dark:border-slate-800">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Muat Naik Resit Pembayaran</h2>
              
              {cashSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Alhamdulillah!</h3>
                  <p className="text-slate-600 dark:text-slate-400">Maklumat sumbangan anda telah diterima dan sedang menunggu pengesahan admin.</p>
                </div>
              ) : (
                <form onSubmit={handleCashSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Penyumbang (Pilihan)</label>
                    <input
                      type="text"
                      value={cashForm.donorName}
                      onChange={e => setCashForm({...cashForm, donorName: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-900/50 focus:ring-emerald-500 focus:border-emerald-500 dark:text-white"
                      placeholder="Hamba Allah"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Jumlah (RM)</label>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        required
                        value={cashForm.amount}
                        onChange={e => setCashForm({...cashForm, amount: e.target.value})}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-900/50 focus:ring-emerald-500 focus:border-emerald-500 dark:text-white"
                        placeholder="50.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">No. Rujukan (Pilihan)</label>
                      <input
                        type="text"
                        value={cashForm.reference}
                        onChange={e => setCashForm({...cashForm, reference: e.target.value})}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-900/50 focus:ring-emerald-500 focus:border-emerald-500 dark:text-white"
                        placeholder="Cth: REF123456"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Resit Transaksi</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-xl bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <div className="space-y-1 text-center">
                        <UploadCloud className="mx-auto h-12 w-12 text-slate-400" />
                        <div className="flex text-sm text-slate-600 dark:text-slate-400 justify-center">
                          <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-emerald-600 hover:text-emerald-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-emerald-500 dark:text-emerald-400">
                            <span>Muat Naik Fail</span>
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*,.pdf" onChange={e => setCashFile(e.target.files[0])} />
                          </label>
                          <p className="pl-1">atau seret dan lepas</p>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">PNG, JPG, PDF sehingga 5MB</p>
                        {cashFile && <p className="text-sm font-bold text-emerald-600 mt-2">{cashFile.name}</p>}
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={cashLoading}
                    className="w-full py-4 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 mt-4"
                  >
                    {cashLoading ? 'Menghantar...' : 'Hantar Makluman'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FOOD DONATION TAB */}
      {activeTab === 'food' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="lg:col-span-8 glass-card rounded-3xl p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <CalendarIcon className="text-emerald-500" />
                Jadual Sumbangan
              </h2>
              <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 p-2 rounded-xl">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                  className="p-2 rounded-lg bg-white shadow-sm hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
                >
                  &larr;
                </button>
                <span className="font-bold py-1 min-w-[140px] text-center text-slate-800 dark:text-white">
                  {currentMonth.toLocaleDateString('ms-MY', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                  className="p-2 rounded-lg bg-white shadow-sm hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
                >
                  &rarr;
                </button>
              </div>
            </div>
            
            {/* Desktop Calendar Grid / Mobile Agenda */}
            <div className="space-y-6">
              {generateDates().map(dateStr => {
                const dateObj = new Date(dateStr);
                const day = dateObj.toLocaleDateString('ms-MY', { weekday: 'long' });
                const dateNum = dateObj.getDate();
                const pastDate = isPastDate(dateStr);
                const isSelected = foodForm.date === dateStr;
                
                const slots = ['breakfast', 'lunch', 'dinner'];
                
                return (
                  <div key={dateStr} className={`border-l-4 pl-4 py-2 ${pastDate ? 'border-slate-200 dark:border-slate-800 opacity-60' : isSelected ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-r-xl' : 'border-slate-300 dark:border-slate-700'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-800 dark:text-white">{dateNum}</span>
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{day}</span>
                      </div>
                      {!pastDate && (
                        <button 
                          onClick={() => setFoodForm({...foodForm, date: dateStr, slot: ''})}
                          className={`text-sm px-4 py-1.5 rounded-full font-medium transition-colors ${isSelected ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                        >
                          {isSelected ? 'Dipilih' : 'Pilih Tarikh'}
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {slots.map(slotId => {
                        const booking = getSlotDetails(dateStr, slotId);
                        
                        if (booking) {
                          return (
                            <div 
                              key={slotId}
                              onClick={() => setSelectedBooking(booking)}
                              className={`p-3 rounded-xl border cursor-pointer hover:shadow-md transition-all ${getStatusColor(booking.status)}`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold uppercase opacity-80">{slotLabels[slotId]}</span>
                                <span className="flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/50 dark:bg-black/20">
                                  {getStatusIcon(booking.status)}
                                  {getStatusLabel(booking.status)}
                                </span>
                              </div>
                              <p className="font-bold text-sm truncate">{booking.donor_name}</p>
                              <p className="text-xs opacity-90 truncate mt-1">{booking.food_type}</p>
                            </div>
                          );
                        }
                        
                        // Available slot
                        return (
                          <div 
                            key={slotId}
                            onClick={() => !pastDate && setFoodForm({...foodForm, date: dateStr, slot: slotId})}
                            className={`p-3 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center min-h-[80px] ${
                              pastDate 
                                ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-500' 
                                : foodForm.date === dateStr && foodForm.slot === slotId
                                  ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm dark:bg-emerald-900/30 dark:text-emerald-300 cursor-pointer'
                                  : 'bg-white border-emerald-200 text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50/50 cursor-pointer dark:bg-slate-900 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/20'
                            }`}
                          >
                            <span className="text-xs font-bold uppercase mb-1">{slotLabels[slotId]}</span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full dark:bg-emerald-900/50 dark:text-emerald-300">Kosong</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex flex-wrap gap-4 mt-8 text-sm text-slate-500 dark:text-slate-400 justify-center border-t border-slate-100 dark:border-slate-800 pt-6">
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-white border-2 border-dashed border-emerald-300 rounded-sm"></div> Kosong</span>
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-amber-100 border border-amber-200 rounded-sm"></div> Menunggu Pengesahan</span>
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded-sm"></div> Diluluskan</span>
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-green-100 border border-green-200 rounded-sm"></div> Selesai</span>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="glass-card rounded-3xl p-6 sticky top-28">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Borang Tempahan</h2>
              {foodSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Alhamdulillah!</h3>
                  <p className="text-slate-600 dark:text-slate-400">Tempahan tarikh sumbangan anda sedang diproses. Pihak masjid akan menghubungi anda sebentar lagi.</p>
                </div>
              ) : (
                <form onSubmit={handleFoodSubmit} className="space-y-4">
                  {foodForm.date ? (
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 p-4 rounded-xl mb-4 border border-emerald-100 dark:border-emerald-800">
                      <div className="flex items-center gap-3 mb-4">
                        <CalendarIcon size={24} />
                        <div>
                          <p className="text-[10px] opacity-80 uppercase font-bold tracking-wider">Tarikh & Slot Dipilih</p>
                          <p className="font-bold text-sm">
                            {new Date(foodForm.date).toLocaleDateString('ms-MY', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'})}
                            {foodForm.slot && ` - ${slotLabels[foodForm.slot]}`}
                          </p>
                        </div>
                      </div>
                      
                      {!foodForm.slot && <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Sila klik pada slot kosong (Sarapan / Tengah Hari / Malam) di kalendar.</p>}
                    </div>
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 p-4 rounded-xl mb-4 flex items-start gap-3 border border-slate-200 dark:border-slate-700">
                      <Info size={20} className="shrink-0 mt-0.5 text-slate-400" />
                      <p className="text-sm">Sila pilih tarikh dan slot kosong daripada jadual di sebelah sebelum mengisi borang.</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Penaja / Kumpulan</label>
                    <input
                      type="text"
                      required
                      value={foodForm.donorName}
                      onChange={e => setFoodForm({...foodForm, donorName: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-900/50 focus:ring-emerald-500 focus:border-emerald-500 dark:text-white"
                      placeholder="Cth: Keluarga Hj Ahmad"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Jenis Makanan & Kuantiti</label>
                    <input
                      type="text"
                      required
                      value={foodForm.foodType}
                      onChange={e => setFoodForm({...foodForm, foodType: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-900/50 focus:ring-emerald-500 focus:border-emerald-500 dark:text-white"
                      placeholder="Cth: Nasi Ayam (50 Pax)"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">No. Telefon</label>
                    <input
                      type="tel"
                      required
                      value={foodForm.contactNumber}
                      onChange={e => setFoodForm({...foodForm, contactNumber: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-900/50 focus:ring-emerald-500 focus:border-emerald-500 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nota (Pilihan)</label>
                    <textarea
                      rows="2"
                      value={foodForm.notes}
                      onChange={e => setFoodForm({...foodForm, notes: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-900/50 focus:ring-emerald-500 focus:border-emerald-500 dark:text-white text-sm"
                      placeholder="Sebarang maklumat tambahan"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={!foodForm.date || !foodForm.slot || foodLoading}
                    className="w-full py-3.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 mt-4"
                  >
                    {foodLoading ? 'Menghantar...' : 'Sahkan Tempahan'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ASSET WAQF TAB */}
      {activeTab === 'asset' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="lg:col-span-7 space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Senarai Keperluan Aset Masjid</h2>
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
                        <h3 className="font-bold text-slate-800 dark:text-white mb-1 line-clamp-1">{asset.item}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 flex-1">Kategori: {asset.category}</p>
                        
                        <div className="mt-auto">
                          <div className="flex justify-between text-xs font-bold mb-1">
                            <span className="text-emerald-600 dark:text-emerald-400">{asset.received_quantity || 0} Unit</span>
                            <span className="text-slate-500">Target: {asset.needed_quantity || 0}</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                            <div className="bg-emerald-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${percent}%` }}></div>
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
            <div className="glass-card rounded-3xl p-8 sticky top-28 border border-slate-200 dark:border-slate-800">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Borang Wakaf Aset</h2>
              
              {assetSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Alhamdulillah!</h3>
                  <p className="text-slate-600 dark:text-slate-400">Makluman wakaf anda telah dihantar. Pihak masjid akan menghubungi anda sebentar lagi.</p>
                </div>
              ) : (
                <form onSubmit={handleAssetSubmit} className="space-y-5">
                  {!selectedAsset && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 p-4 rounded-xl mb-4 flex items-start gap-3">
                      <AlertCircle size={20} className="shrink-0 mt-0.5" />
                      <p className="text-sm">Sila pilih aset yang ingin diwakafkan dari senarai di sebelah.</p>
                    </div>
                  )}

                  {selectedAsset && (
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl p-4 mb-4">
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-1">Aset Dipilih</p>
                      <p className="font-bold text-slate-800 dark:text-white">{selectedAsset.item}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Pewakaf</label>
                    <input
                      type="text"
                      required
                      value={assetForm.donorName}
                      onChange={e => setAssetForm({...assetForm, donorName: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-900/50 focus:ring-emerald-500 focus:border-emerald-500 dark:text-white"
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
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-900/50 focus:ring-emerald-500 focus:border-emerald-500 dark:text-white"
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

      {/* QUICK VIEW MODAL FOR FOOD DONATIONS */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedBooking(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className={`p-6 border-b ${getStatusColor(selectedBooking.status).replace('bg-', 'bg-').replace('border-', 'border-').replace('text-', 'text-')}`}>
              <div className="flex justify-between items-start mb-4">
                <span className="px-3 py-1 bg-white/80 dark:bg-black/20 rounded-full text-sm font-bold flex items-center">
                  {getStatusIcon(selectedBooking.status)}
                  {getStatusLabel(selectedBooking.status)}
                </span>
                <button onClick={() => setSelectedBooking(null)} className="p-1 rounded-full hover:bg-black/10 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <h3 className="text-2xl font-bold">{slotLabels[selectedBooking.slot]}</h3>
              <p className="opacity-90 font-medium mt-1">
                {new Date(selectedBooking.date).toLocaleDateString('ms-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1">Disumbang Oleh</p>
                <p className="font-medium text-slate-800 dark:text-white text-lg">{selectedBooking.donor_name}</p>
                {selectedBooking.contact_number && (
                  <p className="text-sm text-slate-600 dark:text-slate-300">{selectedBooking.contact_number}</p>
                )}
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1">Jenis Makanan</p>
                <p className="font-bold text-slate-800 dark:text-white">{selectedBooking.food_type}</p>
              </div>
              
              {selectedBooking.notes && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1">Nota Tambahan</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl italic">
                    "{selectedBooking.notes}"
                  </p>
                </div>
              )}

              <div className="text-xs text-center text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
                Dihantar pada {new Date(selectedBooking.created_at).toLocaleString('ms-MY')}
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 text-center">
              <button 
                onClick={() => setSelectedBooking(null)}
                className="px-6 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-lg font-medium transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
