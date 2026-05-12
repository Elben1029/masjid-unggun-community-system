import { Heart, Landmark, HandHeart, UploadCloud, Utensils, Box, Calendar as CalendarIcon, CheckCircle2, AlertCircle } from 'lucide-react';
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
  const [selectedFund, setSelectedFund] = useState('');
  const [cashForm, setCashForm] = useState({
    donorName: '',
    amount: '',
    paymentMethod: 'qr', // 'qr' or 'bank_transfer'
    reference: '',
  });
  const [cashFile, setCashFile] = useState(null);
  const [cashLoading, setCashLoading] = useState(false);
  const [cashSuccess, setCashSuccess] = useState(false);

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

  // --- ASSET WAQF STATE ---
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [assetForm, setAssetForm] = useState({
    donorName: '',
    quantity: 1
  });
  const [assetLoading, setAssetLoading] = useState(false);
  const [assetSuccess, setAssetSuccess] = useState(false);

  const funds = [
    {
      id: 'f1',
      title: 'Tabung Pengurusan Masjid',
      icon: Landmark,
      description: `Untuk bil utiliti, penyelenggaraan, dan pengurusan harian ${settings?.mosque_name || 'Masjid Unggun'}.`,
      color: 'from-emerald-500 to-emerald-600',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
      iconColor: 'text-emerald-600 dark:text-emerald-400'
    },
    {
      id: 'f2',
      title: 'Tabung Kebajikan Anak Yatim',
      icon: Heart,
      description: `Sumbangan khusus untuk anak-anak yatim dan asnaf di kariah ${settings?.mosque_name || 'Masjid Unggun'}.`,
      color: 'from-rose-400 to-red-500',
      iconBg: 'bg-rose-100 dark:bg-rose-900/50',
      iconColor: 'text-rose-600 dark:text-rose-400'
    },
    {
      id: 'f3',
      title: 'Tabung Pembangunan',
      icon: HandHeart,
      description: 'Bagi tujuan pembesaran dan naik taraf fasiliti masjid pada masa akan datang.',
      color: 'from-blue-500 to-indigo-600',
      iconBg: 'bg-blue-100 dark:bg-blue-900/50',
      iconColor: 'text-blue-600 dark:text-blue-400'
    }
  ];

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
        .select('date, slot, status')
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
    if (!selectedFund) return alert("Sila pilih tabung terlebih dahulu.");
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
        payment_method: cashForm.paymentMethod,
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
      setCashForm({ donorName: '', amount: '', paymentMethod: 'qr', reference: '' });
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

  const isSlotTaken = (dateStr, slot) => {
    return foodDates.some(f => f.date === dateStr && f.slot === slot && (f.status === 'approved' || f.status === 'completed'));
  };

  const isSlotPending = (dateStr, slot) => {
    return foodDates.some(f => f.date === dateStr && f.slot === slot && f.status === 'pending');
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Pilih Tabung</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {funds.map((fund) => (
                <div 
                  key={fund.id}
                  onClick={() => setSelectedFund(fund.id)}
                  className={`cursor-pointer rounded-2xl border-2 transition-all duration-300 p-6 ${
                    selectedFund === fund.id 
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10 shadow-md transform -translate-y-1' 
                      : 'border-transparent glass-card hover:border-emerald-200 dark:hover:border-emerald-800'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl ${fund.iconBg} flex items-center justify-center ${fund.iconColor} mb-4`}>
                    <fund.icon size={24} />
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-white mb-2">{fund.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{fund.description}</p>
                </div>
              ))}
            </div>

            <div className="glass p-6 rounded-2xl mt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800 dark:text-white">Maklumat Pembayaran</h3>
                <div className="flex bg-slate-200 dark:bg-slate-700 rounded-lg p-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setCashForm({...cashForm, paymentMethod: 'qr'}) }}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${cashForm.paymentMethod === 'qr' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                  >QR Pay</button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setCashForm({...cashForm, paymentMethod: 'bank_transfer'}) }}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${cashForm.paymentMethod === 'bank_transfer' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                  >Bank Transfer</button>
                </div>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{settings?.bank_name || 'Bank Islam Malaysia Berhad'}</p>
                  <p className="font-mono text-xl font-bold text-slate-800 dark:text-white tracking-wider">{settings?.account_number || '1005 2010 1234 56'}</p>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">{settings?.account_name || 'Masjid Unggun Kota Kinabalu'}</p>
                </div>
                {cashForm.paymentMethod === 'qr' && (
                  (settings?.qr_image_url || settings?.qr_code_url) ? (
                    <img src={settings.qr_image_url || settings.qr_code_url} alt="DuitNow QR" className="w-24 h-24 rounded-lg bg-white p-2 shadow-sm object-contain" />
                  ) : (
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${settings?.account_number || '10052010123456'}`} alt="DuitNow QR" className="w-24 h-24 rounded-lg bg-white p-2 shadow-sm" />
                  )
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="glass-card rounded-3xl p-8 sticky top-28 border border-slate-200 dark:border-slate-800">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Maklumkan Sumbangan</h2>
              
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
                    <input 
                      type="file" 
                      accept="image/*,.pdf"
                      onChange={e => setCashFile(e.target.files[0])}
                      className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!selectedFund || cashLoading}
                    className="w-full py-4 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
                  >
                    {cashLoading ? 'Menghantar...' : 'Hantar Makluman'}
                  </button>
                  {!selectedFund && <p className="text-xs text-center text-rose-500 mt-2">Sila pilih tabung terlebih dahulu.</p>}
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FOOD DONATION TAB */}
      {activeTab === 'food' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="glass-card rounded-3xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <CalendarIcon className="text-emerald-500" />
                Pilih Tarikh
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                >
                  &larr;
                </button>
                <span className="font-bold py-2 min-w-[100px] text-center">
                  {currentMonth.toLocaleDateString('ms-MY', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                >
                  &rarr;
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {generateDates().map(dateStr => {
                const dateObj = new Date(dateStr);
                const day = dateObj.toLocaleDateString('ms-MY', { weekday: 'short' });
                const dateNum = dateObj.getDate();
                const month = dateObj.toLocaleDateString('ms-MY', { month: 'short' });
                const fullyTaken = isDateFullyTaken(dateStr);
                const pastDate = isPastDate(dateStr);
                const isSelected = foodForm.date === dateStr;

                return (
                  <button
                    key={dateStr}
                    onClick={() => !fullyTaken && !pastDate && setFoodForm({...foodForm, date: dateStr, slot: ''})}
                    disabled={fullyTaken || pastDate}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-200 ${
                      pastDate ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed dark:bg-slate-900/50 dark:border-slate-800 dark:text-slate-600' :
                      fullyTaken ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:border-slate-700' :
                      isSelected ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-md dark:bg-emerald-900/20 dark:text-emerald-400' :
                      'bg-white border-slate-200 text-slate-700 hover:border-emerald-300 hover:shadow-sm dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-xs uppercase font-bold opacity-70">{day}</span>
                    <span className="text-xl font-black my-1">{dateNum}</span>
                    <span className="text-xs">{month}</span>
                    <div className="flex gap-1 mt-2">
                      <span className={`w-2 h-2 rounded-full ${isSlotTaken(dateStr, 'breakfast') ? 'bg-red-500' : isSlotPending(dateStr, 'breakfast') ? 'bg-amber-500' : 'bg-emerald-500'}`} title="Sarapan" />
                      <span className={`w-2 h-2 rounded-full ${isSlotTaken(dateStr, 'lunch') ? 'bg-red-500' : isSlotPending(dateStr, 'lunch') ? 'bg-amber-500' : 'bg-emerald-500'}`} title="Makan Tengah Hari" />
                      <span className={`w-2 h-2 rounded-full ${isSlotTaken(dateStr, 'dinner') ? 'bg-red-500' : isSlotPending(dateStr, 'dinner') ? 'bg-amber-500' : 'bg-emerald-500'}`} title="Makan Malam" />
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-4 mt-6 text-sm text-slate-500 justify-center">
              <span className="flex items-center gap-1"><div className="w-3 h-3 bg-white border border-slate-300 rounded-full"></div> Kosong</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 bg-amber-100 border border-amber-300 rounded-full"></div> Menunggu Pengesahan</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 bg-slate-200 border border-slate-300 rounded-full"></div> Telah Ditempah</span>
            </div>
          </div>

          <div className="glass-card rounded-3xl p-8 sticky top-28">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Maklumat Sumbangan</h2>
            {foodSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Alhamdulillah!</h3>
                <p className="text-slate-600 dark:text-slate-400">Tempahan tarikh sumbangan anda sedang diproses. Pihak masjid akan menghubungi anda sebentar lagi.</p>
              </div>
            ) : (
              <form onSubmit={handleFoodSubmit} className="space-y-5">
                {foodForm.date ? (
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 p-4 rounded-xl mb-4 border border-emerald-100 dark:border-emerald-800">
                    <div className="flex items-center gap-3 mb-4">
                      <CalendarIcon size={24} />
                      <div>
                        <p className="text-xs opacity-80 uppercase font-bold">Tarikh Dipilih</p>
                        <p className="font-bold text-lg">{new Date(foodForm.date).toLocaleDateString('ms-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}</p>
                      </div>
                    </div>
                    
                    <p className="text-sm font-bold mb-2">Pilih Slot Masa:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'breakfast', label: 'Sarapan' },
                        { id: 'lunch', label: 'Makan Tengah Hari' },
                        { id: 'dinner', label: 'Makan Malam' }
                      ].map(s => {
                        const taken = isSlotTaken(foodForm.date, s.id);
                        const pending = isSlotPending(foodForm.date, s.id);
                        return (
                          <button
                            key={s.id}
                            type="button"
                            disabled={taken || pending}
                            onClick={() => setFoodForm({...foodForm, slot: s.id})}
                            className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                              taken || pending ? 'bg-slate-100 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed dark:bg-slate-800 dark:border-slate-700' :
                              foodForm.slot === s.id ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' :
                              'bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:bg-slate-900 dark:border-emerald-800 dark:text-emerald-400'
                            }`}
                          >
                            {s.label}
                            {(taken || pending) && <span className="block text-[10px] mt-0.5">{taken ? 'Penuh' : 'Pending'}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 p-4 rounded-xl mb-4 flex items-start gap-3">
                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                    <p className="text-sm">Sila pilih tarikh kosong daripada kalendar di sebelah sebelum mengisi borang.</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Penaja / Hamba Allah</label>
                  <input
                    type="text"
                    required
                    value={foodForm.donorName}
                    onChange={e => setFoodForm({...foodForm, donorName: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-900/50 focus:ring-emerald-500 focus:border-emerald-500 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Jenis Makanan (Cth: Nasi Lemak 50 Pax)</label>
                  <input
                    type="text"
                    required
                    value={foodForm.foodType}
                    onChange={e => setFoodForm({...foodForm, foodType: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-900/50 focus:ring-emerald-500 focus:border-emerald-500 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">No. Telefon Untuk Dihubungi</label>
                  <input
                    type="tel"
                    required
                    value={foodForm.contactNumber}
                    onChange={e => setFoodForm({...foodForm, contactNumber: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-900/50 focus:ring-emerald-500 focus:border-emerald-500 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nota Tambahan (Pilihan)</label>
                  <textarea
                    rows="3"
                    value={foodForm.notes}
                    onChange={e => setFoodForm({...foodForm, notes: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-900/50 focus:ring-emerald-500 focus:border-emerald-500 dark:text-white"
                    placeholder="Cth: Kari Ayam dan Nasi Putih untuk 100 orang"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={!foodForm.date || !foodForm.slot || foodLoading}
                  className="w-full py-4 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
                >
                  {foodLoading ? 'Menghantar...' : 'Sahkan Tempahan'}
                </button>
              </form>
            )}
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
    </div>
  );
}
