import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../stores/appStore';
import ColorPicker from '../ColorPicker';
import { Settings as SettingsIcon, Palette, Monitor, Eye, Globe, Bell, Database, Save } from 'lucide-react';

type TabId = 'general' | 'appearance' | 'notifications' | 'advanced';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const SettingsTab: React.FC = () => {
  const { t } = useTranslation();
  const { settings, updateSettings } = useAppStore();
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
    <div className="flex space-x-6 neo-fade-in">
      {/* Sidebar */}
      <div className="w-48 space-y-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center space-x-2 px-4 py-3 rounded-lg transition-all ${
              activeTab === tab.id
                ? 'neo-card bg-accent/10 text-accent'
                : 'hover:bg-surface text-text-secondary'
            }`}
          >
            {tab.icon}
            <span className="font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1">
        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center space-x-2">
              <SettingsIcon size={24} className="text-accent" />
              <span>{t('settings.general')}</span>
            </h3>

            <div className="neo-card p-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center space-x-3">
                  <Globe size={20} className="text-accent" />
                  <div>
                    <p className="font-semibold text-text-primary">{t('settings.language')}</p>
                    <p className="text-sm text-text-secondary">{t('settings.languageDescription')}</p>
                  </div>
                </div>
                <select
                  value={localSettings.language || 'pt-BR'}
                  onChange={(e) => handleSettingChange('language', e.target.value)}
                  className="neo-input w-48"
                >
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="en">English</option>
                </select>
              </label>
            </div>
          </div>
        )}

        {/* Appearance Tab */}
        {activeTab === 'appearance' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center space-x-2">
              <Palette size={24} className="text-accent" />
              <span>{t('settings.appearance')}</span>
            </h3>

            <div className="space-y-4">
              <div className="neo-card p-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <Monitor size={20} className="text-accent" />
                    <div>
                      <p className="font-semibold text-text-primary">{t('settings.theme')}</p>
                      <p className="text-sm text-text-secondary">{t('settings.themeDescription')}</p>
                    </div>
                  </div>
                  <select
                    value={localSettings.theme || 'dark'}
                    onChange={(e) => handleSettingChange('theme', e.target.value)}
                    className="neo-input w-48"
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                  </select>
                </label>
              </div>

              <div className="neo-card p-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <Eye size={20} className="text-accent" />
                    <div>
                      <p className="font-semibold text-text-primary">{t('settings.highContrast')}</p>
                      <p className="text-sm text-text-secondary">{t('settings.highContrastDescription')}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSettings.highContrast ?? true}
                      onChange={(e) => handleSettingChange('highContrast', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-surface peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                  </label>
                </label>
              </div>

              <div className="neo-card p-4">
                <div className="mb-3">
                  <div className="flex items-center space-x-3 mb-2">
                    <Palette size={20} className="text-accent" />
                    <p className="font-semibold text-text-primary">{t('settings.accentColor')}</p>
                  </div>
                  <p className="text-sm text-text-secondary mb-4">{t('settings.accentColorDescription')}</p>
                </div>
                <ColorPicker
                  value={localSettings.accentColor || '#007ACC'}
                  onChange={(color) => handleSettingChange('accentColor', color)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center space-x-2">
              <Bell size={24} className="text-accent" />
              <span>{t('settings.notifications')}</span>
            </h3>

            <div className="neo-card p-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center space-x-3">
                  <Bell size={20} className="text-accent" />
                  <div>
                    <p className="font-semibold text-text-primary">{t('settings.notifications')}</p>
                    <p className="text-sm text-text-secondary">{t('settings.notificationsDescription')}</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.notifications ?? true}
                    onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-surface peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                </label>
              </label>
            </div>
          </div>
        )}

        {/* Advanced Tab */}
        {activeTab === 'advanced' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center space-x-2">
              <Database size={24} className="text-accent" />
              <span>{t('settings.advanced')}</span>
            </h3>

            <div className="neo-card p-4 border-l-4" style={{ borderLeftColor: '#DCDCAA' }}>
              <div className="flex items-start space-x-3">
                <Database size={20} className="text-yellow-500 mt-1" />
                <div>
                  <p className="font-semibold text-text-primary mb-2">{t('settings.dataManagement')}</p>
                  <p className="text-sm text-text-secondary mb-4">{t('settings.dataManagementDescription')}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save/Reset Buttons */}
        {hasChanges && (
          <div className="mt-6 pt-6 border-t border-border-color flex items-center justify-end space-x-3">
            <button
              onClick={handleReset}
              className="neo-button"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSave}
              className="neo-button primary flex items-center space-x-2"
            >
              <Save size={18} />
              <span>{t('common.save')}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsTab;

