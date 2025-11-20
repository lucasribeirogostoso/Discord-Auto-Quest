import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../stores/appStore';
import AnimatedCard from './AnimatedCard';
import ColorPicker from './ColorPicker';
import { 
  Settings as SettingsIcon, Palette, Monitor, Eye, Globe, 
  Bell, Database, Save
} from 'lucide-react';

type TabId = 'general' | 'appearance' | 'notifications' | 'advanced';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const SettingsPanel: React.FC = () => {
  const { t } = useTranslation();
  const { settings, updateSettings, initialize } = useAppStore();
  const isHighContrast = settings.highContrast ?? true;
  const accentColor = settings.accentColor || '#8B5CF6';
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

  const handleResetAll = async () => {
    if (confirm(t('settings.confirmReset') || 'Tem certeza que deseja resetar todas as configurações?')) {
      await initialize();
      setLocalSettings(useAppStore.getState().settings);
      setHasChanges(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className={`text-4xl font-bold flex items-center space-x-3 mb-2 ${isHighContrast ? 'text-hc-primary' : 'text-white'}`}>
          <SettingsIcon size={40} style={{ color: isHighContrast ? accentColor : '#8B5CF6' }} className="animate-float" />
          <span className="gradient-text">{t('settings.title')}</span>
        </h2>
        <p className={`text-sm ${isHighContrast ? 'text-hc-secondary' : 'text-gray-400'}`}>
          {t('settings.description')}
        </p>
      </div>

      {/* Tabbed Interface */}
      <AnimatedCard>
        <div className="flex flex-col lg:flex-row">
          {/* Tab Navigation */}
          <div className="flex lg:flex-col border-b lg:border-b-0 lg:border-r border-white/10 p-2 lg:p-4 space-x-2 lg:space-x-0 lg:space-y-2 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'gradient-primary text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.icon}
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-6">
            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                  <SettingsIcon size={24} className="text-purple-500" />
                  <span>{t('settings.general')}</span>
                </h3>

                <div className="space-y-4">
                  <div className="glass-card p-4 rounded-lg">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <Globe size={20} className="text-purple-500" />
                        <div>
                          <p className="font-semibold text-white">{t('settings.language')}</p>
                          <p className="text-sm text-gray-400">{t('settings.languageDescription')}</p>
                        </div>
                      </div>
                      <select
                        value={localSettings.language || 'pt-BR'}
                        onChange={(e) => handleSettingChange('language', e.target.value)}
                        className="glass-card px-4 py-2 rounded-lg text-white focus:outline-none"
                      >
                        <option value="pt-BR">Português (Brasil)</option>
                        <option value="en">English</option>
                      </select>
                    </label>
                  </div>

                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                  <Palette size={24} className="text-purple-500" />
                  <span>{t('settings.appearance')}</span>
                </h3>

                <div className="space-y-4">
                  <div className="glass-card p-4 rounded-lg">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <Monitor size={20} className="text-purple-500" />
                        <div>
                          <p className="font-semibold text-white">{t('settings.theme')}</p>
                          <p className="text-sm text-gray-400">{t('settings.themeDescription')}</p>
                        </div>
                      </div>
                      <select
                        value={localSettings.theme || 'dark'}
                        onChange={(e) => handleSettingChange('theme', e.target.value)}
                        className="glass-card px-4 py-2 rounded-lg text-white focus:outline-none"
                      >
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                      </select>
                    </label>
                  </div>

                  <div className="glass-card p-4 rounded-lg">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <Eye size={20} className="text-purple-500" />
                        <div>
                          <p className="font-semibold text-white">{t('settings.highContrast')}</p>
                          <p className="text-sm text-gray-400">{t('settings.highContrastDescription')}</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={localSettings.highContrast ?? true}
                          onChange={(e) => handleSettingChange('highContrast', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                      </label>
                    </label>
                  </div>

                  <div className="glass-card p-4 rounded-lg">
                    <div className="mb-3">
                      <div className="flex items-center space-x-3 mb-2">
                        <Palette size={20} className="text-purple-500" />
                        <p className="font-semibold text-white">{t('settings.accentColor')}</p>
                      </div>
                      <p className="text-sm text-gray-400 mb-4">{t('settings.accentColorDescription')}</p>
                    </div>
                    <ColorPicker
                      value={localSettings.accentColor || '#8B5CF6'}
                      onChange={(color) => handleSettingChange('accentColor', color)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                  <Bell size={24} className="text-purple-500" />
                  <span>{t('settings.notifications')}</span>
                </h3>

                <div className="space-y-4">
                  <div className="glass-card p-4 rounded-lg">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <Bell size={20} className="text-purple-500" />
                        <div>
                          <p className="font-semibold text-white">{t('settings.notifications')}</p>
                          <p className="text-sm text-gray-400">{t('settings.notificationsDescription')}</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={localSettings.notifications ?? true}
                          onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                      </label>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Tab */}
            {activeTab === 'advanced' && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                  <Database size={24} className="text-purple-500" />
                  <span>{t('settings.advanced')}</span>
                </h3>

                <div className="space-y-4">
                  <div className="glass-card p-4 rounded-lg border-l-4 border-yellow-500/50 bg-yellow-500/10">
                    <div className="flex items-start space-x-3">
                      <Database size={20} className="text-yellow-500 mt-1" />
                      <div>
                        <p className="font-semibold text-yellow-400 mb-2">{t('settings.dataManagement')}</p>
                        <p className="text-sm text-gray-300 mb-4">{t('settings.dataManagementDescription')}</p>
                        <button
                          onClick={handleResetAll}
                          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium"
                        >
                          {t('settings.resetAllSettings')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save/Reset Buttons */}
            {hasChanges && (
              <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-end space-x-3 animate-fade-in">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 glass-card text-white rounded-lg transition-colors hover:bg-white/10 font-medium"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 gradient-primary text-white rounded-lg transition-colors hover:shadow-lg font-medium flex items-center space-x-2"
                >
                  <Save size={18} />
                  <span>{t('common.save')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </AnimatedCard>
    </div>
  );
};

export default SettingsPanel;
