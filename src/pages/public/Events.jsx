import { Calendar, Clock, MapPin, Users, Image as ImageIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Semua');
  const types = ['Semua', 'Akan Datang', 'Sedang Berlangsung', 'Selesai'];

  useEffect(() => {
    async function fetchEvents() {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });
      
      if (error) {
        console.error("Error fetching events:", error);
      } else {
        setEvents(data || []);
      }
      setLoading(false);
    }
    fetchEvents();
  }, []);

  const filteredEvents = filter === 'Semua' 
    ? events 
    : events.filter(e => e.status === filter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Acara & Program</h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Sertai pelbagai program keilmuan dan aktiviti kemasyarakatan yang dianjurkan oleh Masjid Unggun.
        </p>
      </div>

      {/* Filters */}
      <div className="flex justify-center gap-3 mb-12 flex-wrap">
        {types.map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              filter === type
                ? 'bg-teal-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Event Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full text-center py-12 text-slate-500">Memuatkan acara...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500">Tiada acara dijumpai.</div>
        ) : filteredEvents.map(event => (
          <div key={event.id} className="glass-card rounded-3xl overflow-hidden flex flex-col hover:-translate-y-1 transition-transform duration-300">
            <div className="relative h-48 bg-slate-100 dark:bg-slate-800">
              {event.image_url ? (
                <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-teal-500 to-emerald-600 text-white">
                  <ImageIcon size={48} className="opacity-50" />
                </div>
              )}
              <div className="absolute top-4 left-4 inline-block px-3 py-1 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-xs font-medium text-white">
                {event.status}
              </div>
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="text-xl font-bold mb-4 leading-tight text-slate-900 dark:text-white">{event.title}</h3>
              
              <div className="space-y-4 mb-8 flex-1">
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 text-sm">
                  <Calendar className="text-teal-600 dark:text-teal-400 shrink-0" size={18} />
                  <span>
                    {event.date ? new Date(event.date).toLocaleDateString('ms-MY', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'Tarikh tidak ditetapkan'}
                  </span>
                </div>
                {event.description && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3">
                    {event.description}
                  </p>
                )}
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 text-sm">
                  <Users className="text-teal-600 dark:text-teal-400 shrink-0" size={18} />
                  <span>{event.registered || 0} Terdaftar</span>
                </div>
              </div>

              <button 
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 shadow-md"
              >
                Daftar Sekarang
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
