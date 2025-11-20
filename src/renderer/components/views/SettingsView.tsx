import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../stores/appStore';
import ColorPicker from '../ColorPicker';
import { Settings as SettingsIcon, Palette, Monitor, Eye, Globe, Bell, Database, Save, X } from 'lucide-react';

type TabId = 'general' | 'appearance' | 'notifications' | 'advanced';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const SettingsView: React.FC = () => {
  const { t } = useTranslation();
  const { settings, updateSettings, setCurrentView } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);

  const tabs: Tab[] = [
    { id: 'general', label: t('settings.general') || 'Geral', icon: <SettingsIcon size={18} /> },
    { id: 'appearance', label: t('settings.appearance') || 'Aparência', icon: <Palette size={18} /> },
    { id: 'notifications', label: t('settings.notifications') || 'Notificações', icon: <Bell size={18} /> },
    { id: 'advanced', label: t('settings.advanced') || 'Avançado', icon: <Database size={18} /> },
  ];

  const handleSettingChange = (key: keyof typeof localSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateSettings(localSettings);
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalSettings(settings);
    setHasChanges(false);
  };

  return (
    <div className="view-container">
      <div className="flex items-center justify-between mb-8">
        <h1 className="neon-title">{t('settings.title')}</h1>
        <button
          onClick={() => setCurrentView('dashboard')}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex gap-8">
        {/* Settings Sidebar */}
        <div className="w-64 space-y-2 shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${
                activeTab === tab.id
                  ? 'bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20 shadow-[0_0_10px_rgba(0,240,255,0.1)]'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            >
              {tab.icon}
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 max-w-3xl">
          {activeTab === 'general' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-xl font-bold text-white mb-4">{t('settings.general')}</h3>

              <div className="neon-card">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-lg bg-[#00f0ff]/10">
                      <Globe size={20} className="text-[#00f0ff]" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{t('settings.language')}</p>
                      <p className="text-sm text-gray-400">{t('settings.languageDescription')}</p>
                    </div>
                  </div>
                  <select
                    value={localSettings.language || 'pt-BR'}
                    onChange={(e) => handleSettingChange('language', e.target.value)}
                    className="neon-input w-40 bg-black/30 border-white/10 focus:border-[#00f0ff]/50 text-white"
                  >
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="en">English</option>
                  </select>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-xl font-bold text-white mb-4">{t('settings.appearance')}</h3>

              <div className="space-y-4">
                <div className="neon-card">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 rounded-lg bg-[#ff0055]/10">
                        <Monitor size={20} className="text-[#ff0055]" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{t('settings.theme')}</p>
                        <p className="text-sm text-gray-400">{t('settings.themeDescription')}</p>
                      </div>
                    </div>
                    <select
                      value={localSettings.theme || 'dark'}
                      onChange={(e) => handleSettingChange('theme', e.target.value)}
                      className="neon-input w-32 bg-black/30 border-white/10 focus:border-[#ff0055]/50 text-white"
                    >
                      <option value="dark">Dark</option>
                      <option value="light">Light</option>
                    </select>
                  </label>
                </div>

                <div className="neon-card">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 rounded-lg bg-[#fcee0a]/10">
                        <Eye size={20} className="text-[#fcee0a]" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{t('settings.highContrast')}</p>
                        <p className="text-sm text-gray-400">{t('settings.highContrastDescription')}</p>
                      </div>
                    </div>
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.highContrast ?? true}
                        onChange={(e) => handleSettingChange('highContrast', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#fcee0a]"></div>
                    </div>
                  </label>
                </div>

                <div className="neon-card">
                  <div className="mb-4">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="p-2.5 rounded-lg bg-[#0aff60]/10">
                        <Palette size={20} className="text-[#0aff60]" />
                      </div>
                      <p className="font-medium text-white">{t('settings.accentColor')}</p>
                    </div>
                    <p className="text-sm text-gray-400 ml-14">{t('settings.accentColorDescription')}</p>
                  </div>
                  <div className="ml-14">
                    <ColorPicker
                      value={localSettings.accentColor || '#5865F2'}
                      onChange={(color) => handleSettingChange('accentColor', color)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-xl font-bold text-white mb-4">{t('settings.notifications')}</h3>

              <div className="neon-card">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-lg bg-[#00f0ff]/10">
                      <Bell size={20} className="text-[#00f0ff]" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{t('settings.notifications')}</p>
                      <p className="text-sm text-gray-400">{t('settings.notificationsDescription')}</p>
                    </div>
                  </div>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSettings.notifications ?? true}
                      onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00f0ff]"></div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-xl font-bold text-white mb-4">{t('settings.advanced')}</h3>

              <div className="neon-card">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-lg bg-[#ff0055]/10">
                      <Database size={20} className="text-[#ff0055]" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{t('settings.forceInjectionMode')}</p>
                      <p className="text-sm text-gray-400">{t('settings.forceInjectionModeDescription')}</p>
                    </div>
                  </div>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSettings.forceInjectionMode ?? false}
                      onChange={(e) => handleSettingChange('forceInjectionMode', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff0055]"></div>
                  </div>
                </label>
              </div>

              <div className="neon-card border-l-4 border-l-[#fcee0a] bg-yellow-900/10">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-lg bg-[#fcee0a]/10">
                    <Database size={20} className="text-[#fcee0a]" />
                  </div>
                  <div>
                    <p className="font-medium text-white mb-1">{t('settings.dataManagement')}</p>
                    <p className="text-sm text-gray-400">{t('settings.dataManagementDescription')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {hasChanges && (
            <div className="mt-8 pt-6 flex items-center justify-end gap-4 border-t border-white/10">
              <button
                onClick={handleReset}
                className="px-6 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSave}
                className="neon-button neon-button-primary flex items-center gap-2"
              >
                <Save size={18} />
                <span>{t('common.save')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsView;

