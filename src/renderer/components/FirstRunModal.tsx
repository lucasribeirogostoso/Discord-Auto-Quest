import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../stores/appStore';
import { AlertTriangle } from 'lucide-react';

const FirstRunModal: React.FC = () => {
  const { t } = useTranslation();
  const { showFirstRunModal, setShowFirstRunModal, updateSettings } = useAppStore();

  if (!showFirstRunModal) return null;

  const handleAccept = async () => {
    await updateSettings({ firstRun: false });
    setShowFirstRunModal(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white dark:bg-discord-darker rounded-lg shadow-2xl max-w-md w-full mx-4 animate-slide-in">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex-shrink-0">
              <AlertTriangle className="text-yellow-500" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('dashboard.firstRunTitle')}
            </h2>
          </div>

          <div className="mb-6">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {t('dashboard.firstRunMessage')}
            </p>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                {t('dashboard.disclaimerText')}
              </p>
            </div>
          </div>

          <button
            onClick={handleAccept}
            className="w-full bg-gradient-to-r from-discord-blurple to-discord-fuchsia text-white font-semibold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity"
          >
            {t('dashboard.iUnderstand')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FirstRunModal;

