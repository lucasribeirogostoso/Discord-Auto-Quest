import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../stores/appStore';
import { 
  Menu, X, LayoutDashboard, Target, BookOpen, 
  BarChart3, History, Settings
} from 'lucide-react';

const RadialNavigation: React.FC = () => {
  const { t } = useTranslation();
  const { currentView, setCurrentView } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard, angle: 0 },
    { id: 'quests', label: t('nav.quests'), icon: Target, angle: 60 },
    { id: 'library', label: t('nav.library'), icon: BookOpen, angle: 120 },
    { id: 'stats', label: t('nav.stats'), icon: BarChart3, angle: 180 },
    { id: 'history', label: t('nav.history'), icon: History, angle: 240 },
    { id: 'settings', label: t('nav.settings'), icon: Settings, angle: 300 },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleItemClick = (id: string) => {
    setCurrentView(id as any);
    setIsOpen(false);
  };

  const radius = 140;

  return (
    <div className="radial-menu" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="radial-menu-button"
      >
        {isOpen ? (
          <X size={24} className="text-white" />
        ) : (
          <Menu size={24} className="text-white" />
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="radial-menu-overlay"
            onClick={() => setIsOpen(false)}
          />
          <div className="radial-menu-items">
            {navItems.map((item) => {
              const Icon = item.icon;
              const x = Math.cos((item.angle - 90) * (Math.PI / 180)) * radius;
              const y = Math.sin((item.angle - 90) * (Math.PI / 180)) * radius;
              const isActive = currentView === item.id;

              return (
                <div
                  key={item.id}
                  className={`radial-menu-item ${isActive ? 'ring-2 ring-purple-400' : ''}`}
                  style={{
                    left: `calc(50% + ${x}px)`,
                    top: `calc(50% + ${y}px)`,
                    transform: 'translate(-50%, -50%)',
                    animationDelay: `${item.angle / 60 * 0.1}s`,
                  }}
                  onClick={() => handleItemClick(item.id)}
                  title={item.label}
                >
                  <Icon size={24} className={isActive ? 'text-purple-400' : 'text-white/80'} />
                  <span className="text-[10px] text-white/60 mt-1 text-center">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default RadialNavigation;

