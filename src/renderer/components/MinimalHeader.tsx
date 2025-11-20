import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../stores/appStore';
import { Menu, X } from 'lucide-react';
import AccountSwitcher from './AccountSwitcher';

const MinimalHeader: React.FC = () => {
  const { t } = useTranslation();
  const { discordStatus, currentView, setCurrentView } = useAppStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const menuItems = [
    { id: 'dashboard', label: t('nav.dashboard') },
    { id: 'quests', label: t('nav.quests') },
    { id: 'library', label: t('nav.library') },
    { id: 'stats', label: t('nav.stats') },
    { id: 'history', label: t('nav.history') },
    { id: 'settings', label: t('nav.settings') },
  ];

  return (
    <header className="h-16 bg-[#09090b]/90 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-6 z-50 relative">
      <div className="flex items-center gap-4">
        <div className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Discord Auto Quest
        </div>
      </div>

      <div className="flex items-center gap-4">
        <AccountSwitcher />
        
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
          <div className={`w-2 h-2 rounded-full ${discordStatus.isRunning ? 'bg-[#0aff60] shadow-[0_0_8px_#0aff60]' : 'bg-[#ff0055] shadow-[0_0_8px_#ff0055]'}`} />
          <span className="text-xs font-medium text-gray-300">
            {discordStatus.isRunning ? t('common.online') : t('common.offline')}
          </span>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-gray-300 hover:text-white"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {menuOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  className={`px-4 py-3 text-sm cursor-pointer transition-colors ${
                    currentView === item.id 
                      ? 'bg-[#00f0ff]/10 text-[#00f0ff]' 
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                  onClick={() => {
                    setCurrentView(item.id as any);
                    setMenuOpen(false);
                  }}
                >
                  {item.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default MinimalHeader;

