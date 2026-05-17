import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useSettings } from '../../contexts/SettingsContext';
import { 
  Box, Users, Check, ChevronRight, ChevronLeft, Info, FileText, Upload,
  Phone, Mail, MapPin, User, ShieldCheck, Heart, Trash2, Search, CreditCard
} from 'lucide-react';

export default function Korban() {
  const { settings } = useSettings();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Steps: 1 (Booking), 2 (Payer Details), 3 (Payment & Akad), 4 (Success)
  const [step, setStep] = useState(1);

  // Cart / Booking items
  const [cart, setCart] = useState([]); // { package_id, quantity, participants: ['Name 1', 'Name 2'] }

  // Payer Details
  const [payer, setPayer] = useState({
    full_name: '',
    email: '',
    phone: '',
    country_code: '+60',
    address: '',
    next_of_kin: ''
  });

  // Payment Details
  const [payment, setPayment] = useState({
    receipt_file: null,
    reference_number: '',
    agree_tnc: false,
    agree_akad: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPackages();
  }, []);

  async function fetchPackages() {
    try {
      const { data, error } = await supabase.from('korban_packages').select('*').eq('status', 'active');
      if (error) throw error;
      setPackages(data || []);
    } catch (err) {
      console.error('Error fetching packages', err);
    } finally {
      setLoading(false);
    }
  }

  // Helper functions
  const totalAmount = cart.reduce((acc, item) => {
    const pkg = packages.find(p => p.id === item.package_id);
    return acc + ((pkg?.price || 0) * item.quantity);
  }, 0);

  const handleAddToCart = (pkg) => {
    setCart([...cart, {
      package_id: pkg.id,
      quantity: 1,
      participants: Array(pkg.shares).fill('')
    }]);
  };

  const handleUpdateQuantity = (index, delta) => {
    const newCart = [...cart];
    const item = newCart[index];
    const pkg = packages.find(p => p.id === item.package_id);
    
    if (item.quantity + delta > 0) {
      item.quantity += delta;
      // Adjust participants array size based on total shares needed (quantity * package shares)
      const totalShares = item.quantity * pkg.shares;
      if (item.participants.length < totalShares) {
        item.participants = [...item.participants, ...Array(totalShares - item.participants.length).fill('')];
      } else if (item.participants.length > totalShares) {
        item.participants = item.participants.slice(0, totalShares);
      }
      setCart(newCart);
    }
  };

  const handleRemoveFromCart = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const handleParticipantChange = (cartIndex, partIndex, value) => {
    const newCart = [...cart];
    newCart[cartIndex].participants[partIndex] = value;
    setCart(newCart);
  };

  const handleFetchPayer = async () => {
    if (!payer.phone && !payer.email) {
      alert("Sila masukkan No. Telefon atau Emel untuk carian.");
      return;
    }
    try {
      setLoading(true);
      const query = supabase.from('korban_payers').select('*');
      if (payer.phone) query.eq('phone', `${payer.country_code}${payer.phone}`);
      else query.eq('email', payer.email);
      
      const { data, error } = await query.order('created_at', { ascending: false }).limit(1);
      if (error) throw error;
      
      if (data && data.length > 0) {
        const d = data[0];
        setPayer({
          ...payer,
          full_name: d.full_name,
          email: d.email || payer.email,
          phone: d.phone.replace(payer.country_code, ''),
          address: d.address,
          next_of_kin: d.next_of_kin
        });
        alert("Maklumat berjaya dijumpai!");
      } else {
        alert("Tiada rekod dijumpai.");
      }
    } catch (err) {
      console.error(err);
      alert("Ralat semasa carian.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPayment({ ...payment, receipt_file: e.target.files[0] });
    }
  };

  const submitRegistration = async () => {
    try {
      setIsSubmitting(true);
      
      let receiptUrl = '';
      if (payment.receipt_file) {
        const fileExt = payment.receipt_file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `korban/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(filePath, payment.receipt_file);
          
        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage
          .from('receipts')
          .getPublicUrl(filePath);
          
        receiptUrl = publicUrlData.publicUrl;
      }
      
      // Get current user id if available
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;
      
      // Create Booking
      const { data: booking, error: bookingError } = await supabase.from('korban_bookings').insert([{
        user_id: userId,
        total_amount: totalAmount,
        status: 'pending',
        payment_status: 'Pending Verification',
        receipt_url: receiptUrl,
        reference_number: payment.reference_number
      }]).select().single();
      
      if (bookingError) throw bookingError;
      
      // Create Payer
      const { error: payerError } = await supabase.from('korban_payers').insert([{
        booking_id: booking.id,
        full_name: payer.full_name,
        email: payer.email,
        phone: `${payer.country_code}${payer.phone}`,
        address: payer.address,
        next_of_kin: payer.next_of_kin
      }]);
      
      if (payerError) throw payerError;
      
      // Create Participants
      const participantsData = [];
      cart.forEach(item => {
        item.participants.forEach(name => {
          if (name.trim() !== '') {
            participantsData.push({
              booking_id: booking.id,
              package_id: item.package_id,
              participant_name: name
            });
          }
        });
      });
      
      if (participantsData.length > 0) {
        const { error: partsError } = await supabase.from('korban_participants').insert(participantsData);
        if (partsError) throw partsError;
      }
      
      setStep(4); // Success step
    } catch (err) {
      console.error(err);
      alert(`Ralat semasa penghantaran: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
            Ibadah Korban 1447H
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Laksanakan ibadah korban anda bersama {settings?.mosque_name || 'Masjid Unggun'}. Mudah, selamat dan telus.
          </p>
        </div>

        {/* Stepper */}
        {step < 4 && (
          <div className="max-w-3xl mx-auto mb-12">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 dark:bg-slate-800 -z-10 rounded-full"></div>
              <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-purple-600 -z-10 rounded-full transition-all duration-500`} style={{ width: `${(step - 1) * 50}%` }}></div>
              
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg transition-colors ${
                    step === s ? 'bg-purple-600 text-white ring-4 ring-purple-600/20' : 
                    step > s ? 'bg-purple-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-600 border-2 border-slate-200 dark:border-slate-800'
                  }`}>
                    {step > s ? <Check size={24} /> : s}
                  </div>
                  <span className={`text-sm font-bold ${step >= s ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`}>
                    {s === 1 ? 'Tempahan' : s === 2 ? 'Maklumat' : 'Pembayaran'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content Area */}
          <div className="flex-1">
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <Box className="text-purple-600" /> Pilihan Pakej Korban
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {packages.map(pkg => (
                    <div key={pkg.id} className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-purple-300 dark:hover:border-purple-800 transition-all group">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{pkg.name}</h3>
                          <p className="text-sm text-slate-500">{pkg.description}</p>
                        </div>
                        <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                          {pkg.animal_type}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-6">
                        <p className="text-3xl font-black text-slate-900 dark:text-white">RM {pkg.price}</p>
                        <button 
                          onClick={() => handleAddToCart(pkg)}
                          className="px-6 py-3 bg-slate-900 dark:bg-purple-600 text-white rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-purple-700 transition-colors shadow-lg shadow-slate-900/20 dark:shadow-purple-600/20"
                        >
                          Pilih
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {cart.length > 0 && (
                  <div className="mt-12 bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800 shadow-lg">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Maklumat Peserta (Nama yang diniatkan)</h2>
                    
                    <div className="space-y-8">
                      {cart.map((item, cartIndex) => {
                        const pkg = packages.find(p => p.id === item.package_id);
                        return (
                          <div key={cartIndex} className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between items-center mb-6">
                              <h3 className="font-bold text-lg text-slate-900 dark:text-white">{pkg.name} x {item.quantity}</h3>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                                  <button onClick={() => handleUpdateQuantity(cartIndex, -1)} className="px-3 py-1 text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold">-</button>
                                  <span className="px-3 font-bold text-slate-900 dark:text-white">{item.quantity}</span>
                                  <button onClick={() => handleUpdateQuantity(cartIndex, 1)} className="px-3 py-1 text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold">+</button>
                                </div>
                                <button onClick={() => handleRemoveFromCart(cartIndex)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                  <Trash2 size={20} />
                                </button>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {item.participants.map((name, pIdx) => (
                                <div key={pIdx} className="space-y-1">
                                  <label className="text-xs font-bold text-slate-500">Peserta {pIdx + 1}</label>
                                  <input 
                                    type="text" 
                                    value={name}
                                    onChange={(e) => handleParticipantChange(cartIndex, pIdx, e.target.value)}
                                    placeholder="Nama penuh peserta" 
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 ring-purple-500/20 focus:border-purple-500 outline-none transition-all dark:text-white"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800 shadow-lg">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <User className="text-purple-600" /> Maklumat Pembayar
                  </h2>
                  <button onClick={handleFetchPayer} className="flex items-center gap-2 text-sm font-bold text-purple-600 bg-purple-50 dark:bg-purple-900/20 px-4 py-2 rounded-lg hover:bg-purple-100 transition-colors">
                    <Search size={16} /> Cari Rekod Lama
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Nama Penuh</label>
                    <input 
                      type="text" 
                      value={payer.full_name}
                      onChange={e => setPayer({...payer, full_name: e.target.value})}
                      className="w-full px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 ring-purple-500/20 focus:border-purple-500 outline-none transition-all dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Emel</label>
                    <input 
                      type="email" 
                      value={payer.email}
                      onChange={e => setPayer({...payer, email: e.target.value})}
                      className="w-full px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 ring-purple-500/20 focus:border-purple-500 outline-none transition-all dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">No. Telefon (WhatsApp)</label>
                    <div className="flex">
                      <select 
                        value={payer.country_code}
                        onChange={e => setPayer({...payer, country_code: e.target.value})}
                        className="px-4 py-3 rounded-l-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 font-bold dark:text-white outline-none border-r-0"
                      >
                        <option value="+60">+60</option>
                        <option value="+65">+65</option>
                        <option value="+62">+62</option>
                        <option value="+673">+673</option>
                      </select>
                      <input 
                        type="tel" 
                        value={payer.phone}
                        onChange={e => setPayer({...payer, phone: e.target.value})}
                        placeholder="123456789"
                        className="w-full px-5 py-3 rounded-r-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 ring-purple-500/20 focus:border-purple-500 outline-none transition-all dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Nama Waris / Kenalan</label>
                    <input 
                      type="text" 
                      value={payer.next_of_kin}
                      onChange={e => setPayer({...payer, next_of_kin: e.target.value})}
                      className="w-full px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 ring-purple-500/20 focus:border-purple-500 outline-none transition-all dark:text-white"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Alamat Penuh</label>
                    <textarea 
                      rows="3"
                      value={payer.address}
                      onChange={e => setPayer({...payer, address: e.target.value})}
                      className="w-full px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 ring-purple-500/20 focus:border-purple-500 outline-none transition-all dark:text-white"
                    ></textarea>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8">
                {/* Payment Instructions */}
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800 shadow-lg">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                    <CreditCard className="text-purple-600" /> Arahan Pembayaran
                  </h2>
                  <div className="p-6 bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-800/30 mb-8">
                    <p className="text-slate-700 dark:text-slate-300 mb-4">
                      Sila buat pembayaran berjumlah <span className="font-black text-xl text-purple-600 dark:text-purple-400">RM {totalAmount.toFixed(2)}</span> ke akaun berikut:
                    </p>
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                      <div className="flex-1 space-y-4">
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                          <p className="text-sm text-slate-500">Bank</p>
                          <p className="font-bold text-lg text-slate-900 dark:text-white">{settings?.bank_name || 'Bank Islam'}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                          <p className="text-sm text-slate-500">Nama Akaun</p>
                          <p className="font-bold text-lg text-slate-900 dark:text-white">{settings?.account_name || 'Masjid Unggun'}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                          <div>
                            <p className="text-sm text-slate-500">No Akaun</p>
                            <p className="font-black text-xl text-slate-900 dark:text-white font-mono tracking-wider">{settings?.account_number || '1234567890'}</p>
                          </div>
                          <button onClick={() => navigator.clipboard.writeText(settings?.account_number || '1234567890')} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600">Salin</button>
                        </div>
                      </div>
                      {settings?.qr_code_url && (
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
                          <img src={settings.qr_code_url} alt="DuitNow QR" className="w-48 h-48 object-cover rounded-xl mb-2 mx-auto" />
                          <p className="font-bold text-sm text-slate-600 dark:text-slate-400">Imbas untuk bayar (DuitNow)</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Upload Receipt */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Muat Naik Resit Pembayaran</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">No. Rujukan (Reference No)</label>
                        <input 
                          type="text" 
                          value={payment.reference_number}
                          onChange={e => setPayment({...payment, reference_number: e.target.value})}
                          placeholder="Contoh: REF123456"
                          className="w-full px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 ring-purple-500/20 focus:border-purple-500 outline-none transition-all dark:text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Gambar Resit (PDF/Image)</label>
                        <div className="relative">
                          <input 
                            type="file" 
                            accept="image/*,.pdf"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div className={`w-full px-5 py-3 rounded-xl border-2 border-dashed ${payment.receipt_file ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950'} flex items-center justify-center gap-2 transition-all`}>
                            <Upload size={20} className={payment.receipt_file ? 'text-purple-600' : 'text-slate-400'} />
                            <span className={`font-medium ${payment.receipt_file ? 'text-purple-600 dark:text-purple-400' : 'text-slate-500'}`}>
                              {payment.receipt_file ? payment.receipt_file.name : 'Pilih fail resit...'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Akad & T&C */}
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800 shadow-lg space-y-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="text-purple-600" /> Akad Wakalah & Syarat
                  </h3>
                  
                  <label className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <input type="checkbox" className="w-5 h-5 mt-1 accent-purple-600" checked={payment.agree_akad} onChange={e => setPayment({...payment, agree_akad: e.target.checked})} />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white mb-1">Lafaz Akad Wakalah Korban</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">"Saya mewakilkan urusan ibadah korban saya dan penama-penama yang lain pada tahun ini kepada wakil pengurusan Masjid Unggun kerana Allah Ta'ala."</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <input type="checkbox" className="w-5 h-5 mt-1 accent-purple-600" checked={payment.agree_tnc} onChange={e => setPayment({...payment, agree_tnc: e.target.checked})} />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white mb-1">Terma & Syarat</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Saya mengesahkan bahawa semua maklumat yang diberikan adalah benar. Pihak penganjur berhak menolak pendaftaran jika bayaran tidak disahkan.</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-12 border border-slate-200 dark:border-slate-800 shadow-2xl text-center max-w-2xl mx-auto">
                <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-green-100 dark:shadow-none ring-8 ring-green-50 dark:ring-green-900/10">
                  <Check size={48} strokeWidth={3} />
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Alhamdulillah, Tempahan Berjaya!</h2>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
                  Pendaftaran korban anda telah direkodkan. Sila tunggu pengesahan daripada pihak admin dalam masa 24 jam.
                </p>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-8 py-4 bg-slate-900 dark:bg-purple-600 text-white rounded-2xl font-bold shadow-lg shadow-slate-900/20 dark:shadow-purple-600/20 hover:scale-105 transition-all"
                >
                  Kembali ke Laman Utama
                </button>
              </div>
            )}

            {/* Navigation Buttons */}
            {step < 4 && (
              <div className="mt-8 flex justify-between items-center">
                {step > 1 ? (
                  <button 
                    onClick={() => setStep(step - 1)}
                    className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800 flex items-center gap-2 transition-all"
                  >
                    <ChevronLeft size={20} /> Kembali
                  </button>
                ) : <div></div>}
                
                {step < 3 ? (
                  <button 
                    onClick={() => {
                      if (step === 1 && cart.length === 0) {
                        alert("Sila pilih sekurang-kurangnya satu pakej korban.");
                        return;
                      }
                      if (step === 2 && (!payer.full_name || !payer.phone || !payer.address || !payer.next_of_kin)) {
                        alert("Sila isi semua maklumat pembayar yang wajib.");
                        return;
                      }
                      setStep(step + 1);
                    }}
                    className="px-8 py-4 rounded-2xl font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all"
                  >
                    Seterusnya <ChevronRight size={20} />
                  </button>
                ) : (
                  <button 
                    disabled={!payment.agree_akad || !payment.agree_tnc || !payment.receipt_file || isSubmitting}
                    onClick={submitRegistration}
                    className="px-10 py-4 rounded-2xl font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-600/30 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Memproses...' : 'Sahkan Tempahan & Hantar'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Sticky Sidebar / Order Summary */}
          {step < 4 && (
            <div className="lg:w-[380px] w-full">
              <div className="sticky top-24 bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800 shadow-xl">
                <h3 className="font-black text-xl text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <FileText className="text-purple-600" /> Ringkasan Tempahan
                </h3>
                
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <Box className="mx-auto text-slate-300 dark:text-slate-600 mb-3" size={48} />
                    <p className="text-slate-500 font-medium">Tiada pakej dipilih lagi.</p>
                  </div>
                ) : (
                  <div className="space-y-4 mb-6">
                    {cart.map((item, idx) => {
                      const pkg = packages.find(p => p.id === item.package_id);
                      return (
                        <div key={idx} className="flex justify-between items-start text-sm">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{pkg.name}</p>
                            <p className="text-slate-500">x {item.quantity}</p>
                          </div>
                          <p className="font-bold text-slate-900 dark:text-white">RM {(pkg.price * item.quantity).toFixed(2)}</p>
                        </div>
                      )
                    })}
                  </div>
                )}
                
                <div className="border-t-2 border-slate-100 dark:border-slate-800 pt-4 mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-500 font-medium">Jumlah Peserta</span>
                    <span className="font-bold text-slate-900 dark:text-white">{cart.reduce((a, b) => a + b.participants.length, 0)} Orang</span>
                  </div>
                  <div className="flex justify-between items-center text-lg mt-4">
                    <span className="font-black text-slate-900 dark:text-white">Jumlah</span>
                    <span className="font-black text-2xl text-purple-600 dark:text-purple-400">RM {totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-8 bg-purple-50 dark:bg-purple-900/10 rounded-xl p-4 flex gap-3 text-sm text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-800/30">
                  <ShieldCheck size={20} className="shrink-0 text-purple-600" />
                  <p>Transaksi anda adalah selamat dan maklumat dirahsiakan sepenuhnya.</p>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
