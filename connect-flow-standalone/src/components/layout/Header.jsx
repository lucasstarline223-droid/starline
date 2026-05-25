import React, { useState, useRef, useEffect } from 'react';
import UserProfileDropdown from './UserProfileDropdown';
import NotificationPreferencesModal from './NotificationPreferencesModal';
import NotificationsPanel from './NotificationsPanel';
import { Search, Bell, Volume2, VolumeX, Sliders, Sun, Moon } from 'lucide-react';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useNotificacaoSonora } from '@/hooks/useNotificacaoSonora';

export default function Header({ user }) {
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const [preferencesModalOpen, setPreferencesModalOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const { isDark, toggle: toggleDark } = useDarkMode();
  const dropdownRef = useRef(null);
  const { habilitado, tocarBip } = useNotificacaoSonora();

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownAberto(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-8">
      <div className="flex items-center gap-4" />

      <div className="flex items-center gap-3">
        <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <Search className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDark}
          title={isDark ? 'Modo claro' : 'Modo noturno'}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {isDark
            ? <Sun className="w-5 h-5 text-yellow-400" />
            : <Moon className="w-5 h-5 text-gray-600" />}
        </button>

        {/* Sininho com dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownAberto(!dropdownAberto)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
          >
            <Bell className={`w-5 h-5 ${habilitado ? 'text-blue-600' : 'text-gray-600'}`} />
            {notifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {notifCount > 99 ? '99+' : notifCount}
              </span>
            )}
          </button>

          {dropdownAberto && (
           <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
             <div className="px-4 py-3 border-b border-gray-100">
               <p className="text-sm font-semibold text-gray-800">Notificações</p>
             </div>

             <NotificationsPanel onCountChange={setNotifCount} />

             <div className="px-4 py-3 border-t border-gray-100 space-y-3">
               <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Alerta Sonoro</p>

               <div className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all ${
                   habilitado
                     ? 'border-blue-200 bg-blue-50 text-blue-700'
                     : 'border-gray-200 bg-gray-50 text-gray-600'
                 }`}>
                 <div className="flex items-center gap-2">
                   {habilitado ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                   <span className="text-sm font-medium">
                     {habilitado ? 'Alerta sonoro ativado' : 'Alerta sonoro desativado'}
                   </span>
                 </div>
               </div>

               <p className="text-xs text-gray-500">
                 {habilitado 
                   ? 'Você receberá notificações sonoras nesta página. Gerencie suas preferências abaixo.'
                   : 'Ative as notificações sonoras nas preferências para receber alertas nesta página.'
                 }
               </p>

               {/* Botão de teste */}
               <button
                 onClick={() => { tocarBip(); }}
                 className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm transition-colors"
               >
                 <Volume2 className="w-4 h-4" />
                 Testar som
               </button>

               {/* Preferências de Notificação */}
               <button
                 onClick={() => {
                   setPreferencesModalOpen(true);
                   setDropdownAberto(false);
                 }}
                 className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm transition-colors"
               >
                 <Sliders className="w-4 h-4" />
                 Preferências de Notificação
               </button>
             </div>
           </div>
          )}
        </div>

        {user && <UserProfileDropdown user={user} />}
      </div>

      <NotificationPreferencesModal
        open={preferencesModalOpen}
        onOpenChange={setPreferencesModalOpen}
      />
    </header>
  );
}