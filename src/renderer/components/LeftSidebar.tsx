import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../stores/appStore';
import { 
  LayoutDashboard, 
  Gamepad2, 
  Library, 
  BarChart2, 
  History, 
  Settings 
} from 'lucide-react';

const LeftSidebar: React.FC = () => {
  const { t } = useTranslation();
  const { currentView, setCurrentView } = useAppStore();

  const navItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { id: 'quests', label: t('nav.quests'), icon: Gamepad2 },
    { id: 'library', label: t('nav.library'), icon: Library },
    { id: 'stats', label: t('nav.stats'), icon: BarChart2 },
    { id: 'history', label: t('nav.history'), icon: History },
    { id: 'settings', label: t('nav.settings'), icon: Settings },
  ];

  return (
    <div className="w-64 h-full bg-[#09090b] border-r border-white/10 flex flex-col flex-shrink-0 z-20">
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00f0ff] to-[#0066ff] flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.3)]">
            <Gamepad2 className="text-white" size={20} />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            AutoQuest
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as any)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                isActive 
                  ? 'bg-[#00f0ff]/10 text-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.1)] border border-[#00f0ff]/20' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            >
              <Icon 
                size={20} 
                className={`transition-colors ${isActive ? 'text-[#00f0ff]' : 'text-gray-500 group-hover:text-white'}`} 
              />
              <span className="font-medium">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00f0ff] shadow-[0_0_5px_#00f0ff]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Area */}
      <div className="p-4 border-t border-white/10">
        <div className="p-4 rounded-xl bg-gradient-to-br from-[#18181b] to-[#09090b] border border-white/5">
          <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">Status</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse" />
            <span className="text-sm text-gray-300">System Online</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeftSidebar;
