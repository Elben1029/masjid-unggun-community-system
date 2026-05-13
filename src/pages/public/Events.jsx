import { useState, useEffect } from 'react';
import { 
  Calendar, Users, Image as ImageIcon, MapPin, Clock, 
  DollarSign, CheckCircle, AlertCircle, Upload, FileText, 
  Tag, ShieldAlert, ArrowRight, ExternalLink, X, ChevronRight, Info, Sparkles
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';

export default function Events() {
  const { settings } = useSettings();
  const { currentUser, currentUserProfile } = useAuth();
  const navigate = useNavigate();
  
  const [events, setEvents] = useState([]);
  const [joinedEvents, setJoinedEvents] = useState({}); // { event_id: { status, payment_status } }
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Semua'); // 'Semua' | 'Percuma' | 'Berbayar'
  
  // Selected Event Modal State
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Registration Form Fields
  const [participantName, setParticipantName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [proofFile, setProofFile] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchUserRegistrations();
      // Pre-fill form details
      setParticipantName(currentUserProfile?.full_name || currentUser.email?.split('@')[0] || '');
      setPhoneNumber(currentUserProfile?.phone_number || currentUserProfile?.phone || '');
    } else {
      setJoinedEvents({});
    }
  }, [currentUser, currentUserProfile]);

  async function fetchEvents() {
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'Published')
      .order('date', { ascending: true });
    
    if (error) {
      console.error("Error fetching events:", error);
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  }

  async function fetchUserRegistrations() {
    if (!currentUser) return;
    const { data, error } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('user_id', currentUser.id);

    if (error) {
      console.error("Error fetching user registrations:", error);
    } else {
      const joinedMap = {};
      data?.forEach(reg => {
        joinedMap[reg.event_id] = {
          status: reg.registration_status,
          paymentStatus: reg.payment_status,
          proofUrl: reg.payment_proof_url
        };
      });
      setJoinedEvents(joinedMap);
    }
  }

  const handleOpenDetails = (ev) => {
    setSelectedEvent(ev);
    setIsRegistering(false);
    setProofFile(null);
    if (currentUser) {
      setParticipantName(currentUserProfile?.full_name || currentUser.email?.split('@')[0] || '');
      setPhoneNumber(currentUserProfile?.phone_number || currentUserProfile?.phone || '');
    }
  };

  const handleCloseModal = () => {
    setSelectedEvent(null);
    setIsRegistering(false);
    setProofFile(null);
  };

  async function uploadPaymentProof(file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `resit_${currentUser.id}_${Date.now()}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('events')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('events')
      .getPublicUrl(fileName);

    return publicUrl;
  }

  const handleSubmitRegistration = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Sila log masuk atau daftar akaun terlebih dahulu untuk menyertai acara.");
      navigate('/login');
      return;
    }
    
    setSubmitting(true);

    try {
      let finalProofUrl = null;
      if (selectedEvent.event_type === 'paid' && proofFile) {
        finalProofUrl = await uploadPaymentProof(proofFile);
      }

      if (selectedEvent.max_participants && selectedEvent.registered >= selectedEvent.max_participants) {
        alert("Harap maaf, kuota pendaftaran telah penuh.");
        setSubmitting(false);
        return;
      }

      const payload = {
        user_id: currentUser.id,
        event_id: selectedEvent.id,
        participant_name: participantName,
        phone_number: phoneNumber,
        registration_status: 'pending',
        payment_status: 'pending',
        payment_proof_url: finalProofUrl
      };

      const { error } = await supabase
        .from('event_registrations')
        .insert([payload]);

      if (error) {
        if (error.code === '23505') {
          alert("Anda telah pun mendaftar untuk acara ini.");
        } else {
          throw error;
        }
      } else {
        alert("Pendaftaran anda telah dihantar! Status pendaftaran boleh disemak pada panel pengurusan profil anda.");
        fetchEvents();
        fetchUserRegistrations();
        handleCloseModal();
      }
    } catch (err) {
      alert(`Gagal memproses pendaftaran: ${err.message || 'Sila cuba lagi.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEvents = filter === 'Semua' 
    ? events 
    : filter === 'Percuma' 
      ? events.filter(e => e.event_type !== 'paid')
      : events.filter(e => e.event_type === 'paid');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Hero Section */}
      <div className="bg-slate-900 py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-[120px] animate-pulse delay-700"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 text-emerald-400 text-xs font-black uppercase tracking-widest mb-6">
            <Sparkles size={14} />
            Kalendar Komuniti {settings?.mosque_name || 'Masjid Unggun'}
          </div>
          <h1 className="text-5xl sm:text-7xl font-black text-white mb-6 tracking-tight">Acara & Program</h1>
          <p className="text-slate-400 text-xl max-w-2xl mx-auto font-medium leading-relaxed">
            Sertai pelbagai program keilmuan, kuliah pengajian, dan aktiviti kemasyarakatan anjuran rasmi kami.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        {/* Filters */}
        <div className="flex justify-center gap-2 mb-16">
          <div className="bg-white dark:bg-slate-900 p-1.5 rounded-[24px] shadow-2xl border border-slate-200/50 dark:border-slate-800/50 flex gap-1">
            {['Semua', 'Percuma', 'Berbayar'].map(type => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-8 py-3 rounded-[20px] text-sm font-black transition-all duration-500 ${
                  filter === type
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Event Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">Memuatkan Acara...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-32 bg-white dark:bg-slate-900 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-xl">
            <Calendar size={64} className="mx-auto text-slate-200 mb-6" />
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Tiada Acara Dijumpai</h3>
            <p className="text-slate-500 font-medium">Sila cuba tapis kategori lain atau kembali sebentar lagi.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredEvents.map(ev => {
              const isPaid = ev.event_type === 'paid';
              const isFull = ev.max_participants && ev.registered >= ev.max_participants;
              const isClosed = ev.registration_deadline && new Date(ev.registration_deadline) < new Date();
              const joinedInfo = joinedEvents[ev.id];
              const canRegister = ev.registration_enabled !== false && !isFull && !isClosed && !joinedInfo;

              return (
                <div 
                  key={ev.id} 
                  className="bg-white dark:bg-slate-900 rounded-[40px] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col group"
                >
                  {/* Poster Area */}
                  <div className="relative aspect-[16/10] bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    {ev.image_url ? (
                      <img src={ev.image_url} alt={ev.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600">
                        <ImageIcon size={48} strokeWidth={1.5} className="opacity-40" />
                      </div>
                    )}
                    
                    {/* Badge Overlays */}
                    <div className="absolute top-6 left-6 flex gap-2">
                      <span className="px-4 py-1.5 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                        {ev.category || 'Program'}
                      </span>
                    </div>

                    <div className="absolute top-6 right-6">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl border border-white/20 ${
                        isPaid ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
                      }`}>
                        {isPaid ? `RM${ev.event_fee}` : 'Percuma'}
                      </span>
                    </div>

                    {(isFull || isClosed) && !joinedInfo && (
                      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="bg-rose-600 text-white px-6 py-2 rounded-full text-xs font-black tracking-widest uppercase shadow-2xl animate-pulse">
                          {isFull ? 'Penuh' : 'Tutup'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Details Area */}
                  <div className="p-8 flex-1 flex flex-col">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight mb-6 group-hover:text-emerald-600 transition-colors line-clamp-2">
                      {ev.title}
                    </h3>

                    <div className="space-y-4 mb-8">
                      <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700">
                          <Calendar size={18} className="text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Tarikh</p>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                            {ev.date ? new Date(ev.date).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Akan Datang'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700">
                          <MapPin size={18} className="text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Lokasi</p>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate max-w-[180px]">
                            {ev.location || 'Masjid Unggun'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Users size={16} />
                        <span className="text-xs font-black tracking-widest uppercase">{ev.registered || 0} Terdaftar</span>
                      </div>
                      
                      <button 
                        onClick={() => handleOpenDetails(ev)}
                        className={`px-6 py-3 rounded-2xl font-black text-xs transition-all shadow-lg flex items-center gap-2 group/btn ${
                          joinedInfo 
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                            : canRegister 
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20' 
                              : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400'
                        }`}
                      >
                        {joinedInfo ? 'Semak Status' : canRegister ? 'Daftar Sekarang' : 'Lihat Butiran'}
                        <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* EVENT DETAILS MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-[48px] shadow-2xl w-full max-w-4xl overflow-hidden border border-white/10 animate-in zoom-in-95 duration-500 my-8 flex flex-col lg:flex-row max-h-[90vh]">
            
            {/* Modal Image Section */}
            <div className="lg:w-2/5 relative bg-slate-100 dark:bg-slate-800 shrink-0">
              {selectedEvent.image_url ? (
                <img src={selectedEvent.image_url} alt="Event" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-4 p-20">
                  <ImageIcon size={64} strokeWidth={1} />
                  <p className="font-bold text-xs uppercase tracking-widest">Tiada Poster</p>
                </div>
              )}
              <div className="absolute top-8 left-8">
                <button onClick={handleCloseModal} className="p-4 bg-white/20 backdrop-blur-xl hover:bg-white/40 text-white rounded-full transition-all border border-white/20">
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Content Section */}
            <div className="lg:w-3/5 p-10 sm:p-14 overflow-y-auto flex flex-col">
              <div className="mb-10">
                <span className="px-4 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full mb-4 inline-block">
                  {selectedEvent.category || 'Program Masjid'}
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white leading-tight tracking-tight mb-6">
                  {selectedEvent.title}
                </h2>
                
                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tarikh & Masa</p>
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
                      <Calendar size={18} className="text-emerald-600" />
                      {selectedEvent.date ? new Date(selectedEvent.date).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Akan Dimaklumkan'}
                    </div>
                    {(selectedEvent.start_time || selectedEvent.end_time) && (
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mt-1 ml-6 font-medium">
                        <Clock size={14} />
                        {selectedEvent.start_time || 'Mula'} - {selectedEvent.end_time || 'Selesai'}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Lokasi Program</p>
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
                      <MapPin size={18} className="text-emerald-600" />
                      {selectedEvent.location || 'Masjid Unggun'}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Butiran Acara</p>
                  <p className="whitespace-pre-wrap">{selectedEvent.description || 'Tiada maklumat tambahan disediakan untuk acara ini.'}</p>
                </div>
              </div>

              <div className="mt-auto pt-10 border-t border-slate-50 dark:border-slate-800">
                {joinedInfo ? (
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 p-8 rounded-[32px] border border-emerald-100 dark:border-emerald-800 flex flex-col items-center text-center gap-4">
                    <CheckCircle2 size={48} className="text-emerald-600" />
                    <div>
                      <h4 className="text-xl font-black text-emerald-900 dark:text-emerald-200">Anda Sudah Terdaftar</h4>
                      <p className="text-emerald-700/70 dark:text-emerald-400/70 font-medium text-sm mt-1">Status: <span className="font-black uppercase">{joinedInfo.status}</span></p>
                    </div>
                  </div>
                ) : isRegistering ? (
                  <form onSubmit={handleSubmitRegistration} className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">Maklumat Pendaftaran</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nama Penuh</label>
                        <input type="text" required value={participantName} onChange={e => setParticipantName(e.target.value)} className="w-full px-6 py-4 border-2 border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-bold focus:border-emerald-500 outline-none transition-all" placeholder="Masukkan nama penuh" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">No. Telefon</label>
                        <input type="tel" required value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="w-full px-6 py-4 border-2 border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-bold focus:border-emerald-500 outline-none transition-all" placeholder="012-3456789" />
                      </div>
                    </div>

                    {selectedEvent.event_type === 'paid' && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 p-8 rounded-[32px] border border-amber-100 dark:border-amber-800/50 space-y-6">
                        <div className="flex items-center gap-4 text-amber-700 dark:text-amber-400">
                          <DollarSign size={24} />
                          <h4 className="font-black text-lg">Arahan Pembayaran Yuran</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
                          <div className="space-y-3 text-sm">
                            <p className="text-2xl font-black text-slate-900 dark:text-white">RM{selectedEvent.event_fee}</p>
                            <div className="space-y-1 font-bold text-slate-600 dark:text-slate-400">
                              <p className="flex justify-between"><span>Bank:</span> <span>{selectedEvent.bank_name || 'Maybank'}</span></p>
                              <p className="flex justify-between"><span>No Akaun:</span> <span className="font-mono text-slate-900 dark:text-white">{selectedEvent.account_number || '1234567890'}</span></p>
                              <p className="flex justify-between"><span>Nama:</span> <span>{selectedEvent.account_name || 'Bendahari Masjid'}</span></p>
                            </div>
                          </div>
                          {selectedEvent.qr_code_url && (
                            <div className="bg-white p-3 rounded-2xl shadow-xl w-32 h-32 mx-auto">
                              <img src={selectedEvent.qr_code_url} alt="QR" className="w-full h-full object-contain" />
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Sertakan Resit Pembayaran</label>
                          <input type="file" required onChange={e => setProofFile(e.target.files[0])} className="w-full text-xs file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-amber-600 file:text-white hover:file:bg-amber-700 cursor-pointer" />
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-4">
                      <button type="button" onClick={() => setIsRegistering(false)} className="px-8 py-5 text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[20px] transition-all">Batal</button>
                      <button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white px-12 py-5 rounded-[20px] font-black transition-all shadow-xl shadow-emerald-600/20 active:scale-95 disabled:opacity-50">
                        {submitting ? 'Sila Tunggu...' : 'Hantar Pendaftaran'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-4">
                    {canRegister ? (
                      <button 
                        onClick={() => setIsRegistering(true)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-6 rounded-[24px] font-black text-xl shadow-xl shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
                      >
                        Daftar Sebagai Peserta
                        <ArrowRight size={24} />
                      </button>
                    ) : (
                      <div className="flex-1 bg-slate-100 dark:bg-slate-800 p-8 rounded-[32px] text-center">
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Pendaftaran Tidak Tersedia</p>
                      </div>
                    )}
                    <button onClick={handleCloseModal} className="sm:w-32 py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[24px] font-black transition-all hover:scale-[1.02] active:scale-95 shadow-xl">Tutup</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
