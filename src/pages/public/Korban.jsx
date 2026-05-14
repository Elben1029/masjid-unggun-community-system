import { Check, Info, Box, Users, Search, Clock, ShieldCheck, MapPin, User, Phone, Mail, FileText, ChevronRight, AlertCircle, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useSettings } from '../../contexts/SettingsContext';

const packages = [
  {
    id: 'lembu_bahagian',
    name: '1 Bahagian Lembu',
    animal_type: 'Lembu',
    price: 850,
    shares: 1,
    description: 'Satu bahagian daripada 7 bahagian lembu.'
  },
  {
    id: 'lembu_ekor',
    name: '1 Ekor Lembu',
    animal_type: 'Lembu',
    price: 5950,
    shares: 7,
    description: 'Satu ekor lembu (7 bahagian).'
  },
  {
    id: 'kambing_ekor',
    name: '1 Ekor Kambing',
    animal_type: 'Kambing',
    price: 1100,
    shares: 1,
    description: 'Satu ekor kambing.'
  }
];

export default function Korban() {
  const { settings } = useSettings();
  const [view, setView] = useState('register'); // 'register', 'list', 'status'
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [parts, setParts] = useState([]);
  const [searchIC, setSearchIC] = useState('');
  const [statusResult, setStatusResult] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    ic_number: '',
    phone: '',
    email: '',
    address: '',
    beneficiary_name: '',
    notes: ''
  });

  useEffect(() => {
    if (view === 'list') {
      fetchKorbanList();
    }
  }, [view]);

  async function fetchKorbanList() {
    try {
      const { data, error } = await supabase
        .from('korban_parts')
        .select(`
          *,
          assignments:korban_assignments(
            donor:korban_donors(full_name)
          )
        `)
        .order('part_number', { ascending: true });
      
      if (error) throw error;
      setParts(data || []);
    } catch (err) {
      console.error("Error fetching korban list:", err);
    }
  }

  async function checkStatus(searchTerm = null) {
    const ic = searchTerm || searchIC;
    if (!ic) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('korban_donors')
        .select('*')
        .eq('ic_number', ic)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setStatusResult(data || []);
    } catch (err) {
      console.error("Error checking status:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedPkg) return;
    
    setLoading(true);
    try {
      const pkg = packages.find(p => p.id === selectedPkg);
      
      // Get current user if logged in
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('korban_donors')
        .insert([{
          full_name: formData.full_name,
          ic_number: formData.ic_number,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          beneficiary_name: formData.beneficiary_name,
          notes: formData.notes,
          package_type: pkg.animal_type,
          shares: pkg.shares,
          status: 'pending',
          user_id: user?.id || null
        }])
        .select();

      if (error) throw error;
      
      alert("Pendaftaran berjaya! Sila tunggu kelulusan daripada pihak admin.");
      const registeredIC = formData.ic_number;
      
      setFormData({
        full_name: '',
        ic_number: '',
        phone: '',
        email: '',
        address: '',
        beneficiary_name: '',
        notes: ''
      });
      setSelectedPkg(null);
      setView('status');
      setSearchIC(registeredIC);
      checkStatus(registeredIC);
    } catch (err) {
      console.error("Korban Registration Error Detail:", err);
      alert(`Ralat semasa pendaftaran: ${err.message || "Sila cuba lagi"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2.5rem] bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 mb-6 shadow-sm ring-8 ring-orange-50 dark:ring-orange-900/10">
          <Box size={40} />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Ibadah Korban 1447H</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Laksanakan ibadah korban anda bersama {settings?.mosque_name || 'Masjid Unggun'}. 
          Pendaftaran dibuka sehingga 10 Zulhijjah.
        </p>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mt-10">
          <button 
            onClick={() => setView('register')}
            className={`px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 ${
              view === 'register' 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldCheck size={20} />
            Pendaftaran
          </button>
          <button 
            onClick={() => setView('list')}
            className={`px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 ${
              view === 'list' 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users size={20} />
            Senarai Peserta
          </button>
          <button 
            onClick={() => setView('status')}
            className={`px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 ${
              view === 'status' 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Clock size={20} />
            Semak Status
          </button>
        </div>
      </div>

      {view === 'register' && (
        <div className="glass-card rounded-[3rem] p-8 md:p-12 border border-slate-200 dark:border-slate-800 shadow-xl max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-12">
            {/* Step 1: Package */}
            <div>
              <div className="flex items-center gap-4 mb-6">
                <span className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl font-bold shadow-lg shadow-emerald-600/20">1</span>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Pilih Pakej Korban</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {packages.map(pkg => (
                  <div 
                    key={pkg.id}
                    onClick={() => setSelectedPkg(pkg.id)}
                    className={`group relative border-2 rounded-3xl p-6 transition-all duration-300 ${
                      selectedPkg === pkg.id
                        ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10 shadow-xl scale-[1.02]'
                        : 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:border-emerald-300 dark:hover:border-emerald-700 cursor-pointer'
                    }`}
                  >
                    {selectedPkg === pkg.id && (
                      <div className="absolute -top-3 -right-3 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg">
                        <Check size={18} />
                      </div>
                    )}
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">{pkg.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{pkg.description}</p>
                    <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">RM {pkg.price}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2: Information */}
            <div>
              <div className="flex items-center gap-4 mb-6">
                <span className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl font-bold shadow-lg shadow-emerald-600/20">2</span>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Maklumat Peserta</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <User size={16} /> Nama Penuh (Spt dalam IC)
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.full_name}
                    onChange={e => setFormData({...formData, full_name: e.target.value})}
                    placeholder="cth: Ahmad Bin Abu"
                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-emerald-500 outline-none transition-all dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <ShieldCheck size={16} /> No. Kad Pengenalan
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.ic_number}
                    onChange={e => setFormData({...formData, ic_number: e.target.value})}
                    placeholder="cth: 900101-01-5555"
                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-emerald-500 outline-none transition-all dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Phone size={16} /> No. Telefon
                  </label>
                  <input
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    placeholder="012-3456789"
                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-emerald-500 outline-none transition-all dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Mail size={16} /> Emel (Opsional)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    placeholder="email@contoh.com"
                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-emerald-500 outline-none transition-all dark:text-white"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <MapPin size={16} /> Alamat Penuh
                  </label>
                  <textarea
                    required
                    rows="2"
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    placeholder="No 123, Jalan Masjid..."
                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-emerald-500 outline-none transition-all dark:text-white"
                  ></textarea>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Users size={16} /> Nama Waris/Beneficiary
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.beneficiary_name}
                    onChange={e => setFormData({...formData, beneficiary_name: e.target.value})}
                    placeholder="Nama wakil waris"
                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-emerald-500 outline-none transition-all dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <FileText size={16} /> Nota Tambahan
                  </label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    placeholder="Sebutkan hajat/pesanan..."
                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-emerald-500 outline-none transition-all dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t-2 border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <p className="text-slate-500 dark:text-slate-400 font-medium">Jumlah Keseluruhan</p>
                <h3 className="text-4xl font-black text-slate-900 dark:text-white">
                  RM {selectedPkg ? packages.find(p => p.id === selectedPkg).price : '0'}
                </h3>
              </div>
              <button
                disabled={!selectedPkg || loading}
                type="submit"
                className="w-full md:w-auto px-12 py-5 rounded-[2rem] bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xl shadow-2xl shadow-emerald-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    Daftar Sekarang
                    <ChevronRight size={24} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {view === 'list' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {parts.map(part => (
              <div key={part.id} className="glass-card rounded-[2.5rem] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg">
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Bahagian {part.part_number}</h3>
                    <p className="text-sm text-slate-500">{part.animal_type}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{part.current_shares}/{part.max_shares}</span>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Bahagian Diisi</p>
                  </div>
                </div>
                <div className="p-6 space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Senarai Peserta</h4>
                  {part.assignments && part.assignments.length > 0 ? (
                    <div className="space-y-2">
                      {part.assignments.map((asgn, idx) => (
                        <div key={idx} className="flex items-center gap-3 py-2 px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                          <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </span>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{asgn.donor.full_name}</p>
                        </div>
                      ))}
                      {[...Array(part.max_shares - part.current_shares)].map((_, idx) => (
                        <div key={`empty-${idx}`} className="flex items-center gap-3 py-2 px-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700">
                          <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-xs font-bold">
                            {part.current_shares + idx + 1}
                          </span>
                          <p className="text-sm font-medium text-slate-400 italic">Kosong</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                      <p className="text-sm text-slate-500 italic">Belum ada peserta</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {parts.length === 0 && (
            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm">
              <Users className="mx-auto h-20 w-20 text-slate-200 dark:text-slate-700 mb-6" />
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Belum Ada Rekod</h3>
              <p className="text-slate-500">Senarai peserta akan dikemaskini oleh pihak admin dari semasa ke semasa.</p>
            </div>
          )}
        </div>
      )}

      {view === 'status' && (
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="glass-card rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-lg text-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Semak Status Pendaftaran</h2>
            <div className="flex gap-4">
              <input
                type="text"
                value={searchIC}
                onChange={e => setSearchIC(e.target.value)}
                placeholder="Masukkan No. Kad Pengenalan"
                className="flex-1 px-6 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-emerald-500 outline-none transition-all dark:text-white font-bold text-center tracking-widest"
              />
              <button 
                onClick={checkStatus}
                disabled={loading}
                className="px-8 py-4 bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 text-white rounded-2xl font-bold transition-all flex items-center gap-2 shadow-lg"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Search size={20} />}
                Cari
              </button>
            </div>
          </div>

          {statusResult && statusResult.length > 0 ? (
            <div className="space-y-4">
              {statusResult.map(res => (
                <div key={res.id} className="glass-card rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                      res.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 
                      res.status === 'pending' ? 'bg-orange-100 text-orange-600' : 
                      'bg-red-100 text-red-600'
                    }`}>
                      {res.status === 'approved' ? <ShieldCheck size={28} /> : 
                       res.status === 'pending' ? <Clock size={28} /> : <AlertCircle size={28} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{res.package_type} - {res.shares} Bahagian</h3>
                      <p className="text-sm text-slate-500">ID: {res.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
                        res.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                        res.status === 'pending' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {res.status === 'approved' ? 'Diluluskan' : res.status === 'pending' ? 'Dalam Proses' : 'Ditolak/Batal'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : statusResult && (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
              <p className="text-slate-500">Tiada rekod dijumpai untuk No. IC ini.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

