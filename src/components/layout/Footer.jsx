import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, MessageCircle, Globe } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

export default function Footer() {
  const { settings } = useSettings();
  
  return (
    <footer className="bg-slate-900 border-t border-slate-800 pt-16 pb-8 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          
          {/* About */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center overflow-hidden">
                {settings?.mosque_logo_url ? (
                  <img src={settings.mosque_logo_url} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold">M</span>
                )}
              </div>
              <span className="font-bold text-xl text-white">
                {settings?.mosque_name || (
                  <>Masjid <span className="text-emerald-400">Unggun</span></>
                )}
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              {settings?.footer_description || 'Pusat ibadah dan kemasyarakatan yang komprehensif, menguruskan acara, sumbangan, dan kebajikan jemaah.'}
            </p>
            <div className="flex items-center gap-4 pt-2">
              {settings?.facebook_url && (
                <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-colors">
                  <Globe size={18} />
                </a>
              )}
              {settings?.instagram_url && (
                <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-colors">
                  <Globe size={18} />
                </a>
              )}
              {settings?.twitter_url && (
                <a href={settings.twitter_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-colors">
                  <Globe size={18} />
                </a>
              )}
              {settings?.whatsapp_number && (
                <a href={`https://wa.me/${settings.whatsapp_number.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-colors">
                  <MessageCircle size={18} />
                </a>
              )}
              {!settings?.facebook_url && !settings?.instagram_url && !settings?.twitter_url && !settings?.whatsapp_number && (
                <>
                  <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-colors">
                    <Globe size={18} />
                  </a>
                  <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-colors">
                    <MessageCircle size={18} />
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold text-lg">Pautan Pantas</h3>
            <ul className="space-y-3">
              {[
                { name: 'Utama', path: '/' },
                { name: 'Acara & Program', path: '/events' },
                { name: 'Sumbangan', path: '/donations' },
                { name: 'Daftar Korban', path: '/korban' },
              ].map((link) => (
                <li key={link.name}>
                  <Link to={link.path} className="text-sm hover:text-emerald-400 transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold text-lg">Hubungi Kami</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                <span className="text-sm text-slate-400 whitespace-pre-line">
                  {settings?.address || 'Masjid Unggun, Jalan Contoh,\n88000 Kota Kinabalu, Sabah'}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="text-emerald-500 shrink-0" size={18} />
                <span className="text-sm text-slate-400">{settings?.phone || '+60 88-123 4567'}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="text-emerald-500 shrink-0" size={18} />
                <span className="text-sm text-slate-400">{settings?.email || 'admin@masjidunggun.com'}</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} {settings?.footer_copyright || `${settings?.mosque_name || 'Masjid Unggun'} Management System. All rights reserved.`}</p>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-slate-300">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-slate-300">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
