import { useState, useEffect } from 'react';
import { 
  Calendar, Users, Image as ImageIcon, MapPin, Clock, 
  DollarSign, CheckCircle, AlertCircle, Upload, FileText, 
  Tag, ShieldAlert, ArrowRight, ExternalLink, X 
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
      .eq('status', 'Published') // Only show published events to public
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

  // Helper for proof upload
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
    console.log("📅 Attempting registration for event:", selectedEvent.id);

    try {
      let finalProofUrl = null;
      if (selectedEvent.event_type === 'paid' && proofFile) {
        console.log("📂 Uploading payment proof...");
        finalProofUrl = await uploadPaymentProof(proofFile);
        console.log("✅ Proof uploaded:", finalProofUrl);
      }

      // Check if trying to register over quota validation
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

      console.log("📤 Sending registration payload:", payload);
      const { data, error } = await supabase
        .from('event_registrations')
        .insert([payload])
        .select();

      if (error) {
        console.error("❌ Registration insert error:", error);
        // If unique constraint triggers
        if (error.code === '23505') {
          alert("Anda telah pun mendaftar untuk acara ini.");
        } else {
          throw error;
        }
      } else {
        console.log("✅ Registration successful:", data);
        
        // Note: Manual update of 'events' registered count will fail for non-admins due to RLS.
        // This should be handled by a DB trigger. We skip manual update here to prevent frontend error.
        
        alert("Pendaftaran anda telah dihantar! Status pendaftaran boleh disemak di sini atau pada panel pengurusan profil anda.");
        fetchEvents();
        fetchUserRegistrations();
        handleCloseModal();
      }
    } catch (err) {
      console.error("💥 Registration error:", err);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fadeIn">
      {/* Title Header */}
      <div className="mb-10 text-center">
        <span className="text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 px-3 py-1 rounded-full uppercase tracking-wider">
          Kalendar Komuniti
        </span>
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mt-3 mb-4 tracking-tight">
          Acara & Program Semasa
        </h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-base">
          Sertai pelbagai program keilmuan, kuliah pengajian, dan aktiviti kemasyarakatan anjuran rasmi {settings?.mosque_name || 'Masjid Unggun'}.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex justify-center gap-2 mb-10 flex-wrap">
        {['Semua', 'Percuma', 'Berbayar'].map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
              filter === type
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md scale-105'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {type} Acara
          </button>
        ))}
      </div>

      {/* Event Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full text-center py-16">
            <div className="inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 text-sm mt-3 font-medium">Memuatkan senarai acara rasmi...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
            <Calendar size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-bold">Tiada acara disiarkan pada masa ini.</p>
            <p className="text-xs text-slate-400 mt-1">Sila lawati laman ini dari semasa ke semasa untuk kemaskini program terbaru.</p>
          </div>
        ) : filteredEvents.map(ev => {
          const isPaid = ev.event_type === 'paid';
          const isFull = ev.max_participants && ev.registered >= ev.max_participants;
          const isClosed = ev.registration_deadline && new Date(ev.registration_deadline) < new Date();
          const joinedInfo = joinedEvents[ev.id];
          const canRegister = ev.registration_enabled !== false && !isFull && !isClosed && !joinedInfo;

          return (
            <div 
              key={ev.id} 
              className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
            >
              {/* Image Container */}
              <div className="relative h-52 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                {ev.image_url ? (
                  <img src={ev.image_url} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-500/10 to-teal-500/20 text-emerald-700 dark:text-emerald-400">
                    <ImageIcon size={40} className="opacity-40 mb-2" />
                    <span className="text-xs font-bold tracking-wider uppercase opacity-60">Poster Program</span>
                  </div>
                )}
                
                {/* Event Type & Fee Badge */}
                <div className="absolute top-4 right-4 flex flex-col gap-1.5 items-end">
                  <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wide shadow-lg backdrop-blur-md ${
                    isPaid ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
                  }`}>
                    {isPaid ? `YURAN RM${ev.event_fee || 0}` : 'PERCUMA'}
                  </span>
                </div>

                {/* Left side Category tag */}
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-slate-900/70 text-white backdrop-blur-md rounded-full text-[11px] font-bold">
                    {ev.category || 'Kuliah Umum'}
                  </span>
                </div>

                {/* Deadlines overlay notice if closed/full */}
                {(isFull || isClosed) && !joinedInfo && (
                  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
                    <span className="bg-rose-600 text-white px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase shadow-lg">
                      {isFull ? 'Kuota Penuh' : 'Pendaftaran Tutup'}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Body Content */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-emerald-600 transition-colors">
                    {ev.title}
                  </h3>
                  
                  {/* Parameter rows */}
                  <div className="mt-4 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Calendar size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="font-medium">
                        {ev.date ? new Date(ev.date).toLocaleDateString('ms-MY', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : 'Tarikh Akan Dimaklumkan'}
                      </span>
                    </div>

                    {(ev.start_time || ev.end_time) && (
                      <div className="flex items-center gap-2">
                        <Clock size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="font-medium">{ev.start_time || ''} - {ev.end_time || 'Selesai'}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <MapPin size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="font-medium truncate">{ev.location || 'Masjid Unggun'}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80 justify-between">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Users size={14} />
                        <span>{ev.registered || 0} Terdaftar</span>
                      </div>

                      {ev.max_participants && (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded">
                          Max: {ev.max_participants}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Call To Action Buttons based on Registration Status */}
                <div className="pt-2">
                  {joinedInfo ? (
                    <button 
                      onClick={() => handleOpenDetails(ev)}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                        joinedInfo.status === 'confirmed' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900' 
                          : joinedInfo.status === 'rejected'
                          ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900'
                          : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900'
                      }`}
                    >
                      {joinedInfo.status === 'confirmed' && <CheckCircle size={15} />}
                      {joinedInfo.status === 'rejected' && <AlertCircle size={15} />}
                      {joinedInfo.status === 'pending' && <Clock size={15} />}
                      <span>
                        {joinedInfo.status === 'confirmed' ? 'Penyertaan Disahkan' : joinedInfo.status === 'rejected' ? 'Pendaftaran Ditolak' : 'Pendaftaran Menunggu Pengesahan'}
                      </span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleOpenDetails(ev)}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm ${
                        canRegister 
                          ? 'bg-slate-900 text-white hover:bg-emerald-600 dark:bg-white dark:text-slate-900 dark:hover:bg-emerald-400 hover:scale-[1.02]' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      <span>{canRegister ? 'Daftar / Lihat Butiran' : 'Lihat Butiran Program'}</span>
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* POPUP VIEW DETAILS / JOIN EVENT MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-100 dark:border-slate-800 my-8 flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-800/30">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full uppercase tracking-wider">
                {selectedEvent.category || 'Informasi Acara'}
              </span>
              <button onClick={handleCloseModal} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Upper Section: Poster & Title Descriptions */}
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {selectedEvent.image_url && (
                  <div className="w-full md:w-1/2 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm shrink-0">
                    <img src={selectedEvent.image_url} alt="Poster" className="w-full h-auto object-cover max-h-80" />
                  </div>
                )}
                
                <div className="flex-1 space-y-3">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                    {selectedEvent.title}
                  </h2>
                  
                  <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-emerald-600" />
                      <span className="font-bold">Tarikh:</span> 
                      <span>{selectedEvent.date ? new Date(selectedEvent.date).toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Belum Ditetapkan'}</span>
                    </div>
                    {(selectedEvent.start_time || selectedEvent.end_time) && (
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-emerald-600" />
                        <span className="font-bold">Masa:</span> 
                        <span>{selectedEvent.start_time || ''} - {selectedEvent.end_time || 'Selesai'}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-emerald-600" />
                      <span className="font-bold">Tempat:</span> 
                      <span>{selectedEvent.location || 'Masjid Unggun'}</span>
                    </div>
                  </div>

                  {selectedEvent.description && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 whitespace-pre-wrap leading-relaxed pt-1">
                      <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">Sinopsis / Penerangan:</p>
                      {selectedEvent.description}
                    </div>
                  )}
                </div>
              </div>

              {/* Conditional Registration Section View */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
                {joinedEvents[selectedEvent.id] ? (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 text-center space-y-2 animate-fadeIn">
                    <CheckCircle size={32} className="mx-auto text-emerald-600 dark:text-emerald-400" />
                    <h3 className="font-bold text-sm text-emerald-900 dark:text-emerald-300">Pendaftaran Berjaya Direkodkan</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Status terkini penyertaan anda ialah <span className="font-bold underline uppercase">{joinedEvents[selectedEvent.id].status}</span>.
                    </p>
                  </div>
                ) : selectedEvent.registration_enabled === false ? (
                  <div className="text-center py-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-400">
                    Pendaftaran atas talian tidak diaktifkan untuk program ini.
                  </div>
                ) : selectedEvent.max_participants && selectedEvent.registered >= selectedEvent.max_participants ? (
                  <div className="text-center py-4 bg-rose-50 dark:bg-rose-950/30 rounded-xl text-xs text-rose-600 font-bold">
                    Harap maaf, kuota penyertaan maksimum telah dipenuhi.
                  </div>
                ) : selectedEvent.registration_deadline && new Date(selectedEvent.registration_deadline) < new Date() ? (
                  <div className="text-center py-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-xs text-amber-700 font-bold">
                    Tarikh tutup pendaftaran telah tamat pada {new Date(selectedEvent.registration_deadline).toLocaleDateString('ms-MY')}.
                  </div>
                ) : !isRegistering ? (
                  <div className="text-center space-y-3">
                    <button 
                      onClick={() => setIsRegistering(true)}
                      className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-sm transition-all shadow-md hover:scale-105"
                    >
                      Daftar Sebagai Peserta
                    </button>
                    {selectedEvent.event_type === 'paid' && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                        * Acara ini berbayar (RM{selectedEvent.event_fee || 0}). Arahan bayaran akan dipaparkan di langkah seterusnya.
                      </p>
                    )}
                  </div>
                ) : (
                  // Active Registration Form Block
                  <form onSubmit={handleSubmitRegistration} className="space-y-5 animate-fadeIn bg-slate-50/60 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
                      Lengkapkan Maklumat Penyertaan
                    </h3>

                    {!currentUser && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                        <AlertCircle size={16} className="shrink-0" />
                        <div>
                          <span>Anda mendaftar sebagai tetamu awam. Disarankan </span>
                          <Link to="/login" className="font-bold underline text-emerald-700 dark:text-emerald-400">Log Masuk</Link>
                          <span> terlebih dahulu untuk rekod penyertaan automatik.</span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Penuh <span className="text-rose-500">*</span></label>
                        <input 
                          type="text" 
                          required
                          value={participantName}
                          onChange={(e) => setParticipantName(e.target.value)}
                          className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                          placeholder="Sila masukkan nama penuh anda" 
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">No Telefon <span className="text-rose-500">*</span></label>
                        <input 
                          type="tel" 
                          required
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                          placeholder="Cth: 0123456789" 
                        />
                      </div>
                    </div>

                    {/* Paid Event Payment Details Instructions Container */}
                    {selectedEvent.event_type === 'paid' && (
                      <div className="p-4 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl space-y-3">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900 dark:text-amber-400">
                          <DollarSign size={16} />
                          <span>Arahan Pembayaran Yuran (Wajib)</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700 dark:text-slate-300">
                          <div className="space-y-1">
                            <p><span className="font-bold">Yuran Program:</span> <span className="text-amber-700 dark:text-amber-400 font-extrabold text-sm">RM{selectedEvent.event_fee || 0}</span></p>
                            {selectedEvent.bank_name && <p><span className="font-bold">Bank:</span> {selectedEvent.bank_name}</p>}
                            {selectedEvent.account_number && <p><span className="font-bold">No Akaun:</span> <span className="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 select-all">{selectedEvent.account_number}</span></p>}
                            {selectedEvent.account_name && <p><span className="font-bold">Nama Akaun:</span> {selectedEvent.account_name}</p>}
                            {selectedEvent.payment_notes && <p className="pt-1 italic text-[11px] text-amber-800 dark:text-amber-300 font-bold">{selectedEvent.payment_notes}</p>}
                          </div>

                          {/* Show Uploaded Bank QR Preview if admin provided one */}
                          <div className="flex flex-col items-center justify-center bg-white dark:bg-slate-800 p-2 rounded-xl border border-amber-100 dark:border-amber-900/30">
                            {selectedEvent.qr_code_url ? (
                              <>
                                <img src={selectedEvent.qr_code_url} alt="QR DuitNow" className="w-24 h-24 object-contain" />
                                <span className="text-[10px] text-slate-400 font-bold mt-1">Imbas untuk bayaran pantas</span>
                              </>
                            ) : (
                              <span className="text-xs text-slate-400 italic text-center">Tiada paparan QR rasmi dimuat naik. Sila lakukan pemindahan akaun.</span>
                            )}
                          </div>
                        </div>

                        {/* Customer Resit Attachment Upload */}
                        <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/40">
                          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                            Muat Naik Bukti Bayaran / Resit Transaksi
                          </label>
                          <input 
                            type="file" 
                            accept="image/*,.pdf"
                            onChange={(e) => setProofFile(e.target.files[0])}
                            className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-600 file:text-white hover:file:bg-amber-700 text-slate-600 dark:text-slate-400 cursor-pointer"
                          />
                          <p className="text-[10px] text-slate-400 mt-1">Sertakan paparan skrin resit pemindahan wang untuk disahkan oleh admin kariah.</p>
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex justify-end gap-2 pt-2">
                      <button 
                        type="button" 
                        onClick={() => setIsRegistering(false)}
                        className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      >
                        Kembali
                      </button>
                      <button 
                        type="submit" 
                        disabled={submitting}
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 shadow-sm"
                      >
                        {submitting ? 'Menghantar Data...' : 'Hantar Pendaftaran'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
