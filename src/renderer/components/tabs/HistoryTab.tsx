import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../stores/appStore';
import { Search, Trash2, CheckCircle, XCircle, Clock, Download } from 'lucide-react';

const HistoryTab: React.FC = () => {
  const { t } = useTranslation();
  const { history, clearHistory } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failure'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const filteredHistory = useMemo(() => {
    let filtered = history.filter((item) => {
      const matchesSearch =
        item.questName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.applicationName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      
      const now = Date.now();
      let matchesDate = true;
      if (dateFilter === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        matchesDate = item.timestamp >= today.getTime();
      } else if (dateFilter === 'week') {
        matchesDate = item.timestamp >= now - 7 * 24 * 60 * 60 * 1000;
      } else if (dateFilter === 'month') {
        matchesDate = item.timestamp >= now - 30 * 24 * 60 * 60 * 1000;
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    });

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }, [history, searchTerm, statusFilter, dateFilter]);

  const handleClearHistory = async () => {
    await clearHistory();
    setShowConfirmClear(false);
  };

  const handleExportHistory = () => {
    const csv = [
      ['Quest Name', 'Application', 'Date', 'Duration (min)', 'Type', 'Status'].join(','),
      ...filteredHistory.map(item => [
        `"${item.questName}"`,
        `"${item.applicationName}"`,
        new Date(item.timestamp).toISOString(),
        Math.floor(item.duration / 60),
        item.taskType,
        item.status,
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `discord-auto-quest-history-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="space-y-4 neo-fade-in">
      {/* Filters */}
      <div className="neo-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary"
            />
            <input
              type="text"
              placeholder={t('history.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="neo-input pl-10 pr-4 py-2"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="neo-input"
          >
            <option value="all">{t('history.filterAll')}</option>
            <option value="success">{t('history.filterSuccess')}</option>
            <option value="failure">{t('history.filterFailure')}</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="neo-input"
          >
            <option value="all">Todo o Período</option>
            <option value="today">Hoje</option>
            <option value="week">Última Semana</option>
            <option value="month">Último Mês</option>
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-secondary">
          {filteredHistory.length} {filteredHistory.length === 1 ? 'resultado' : 'resultados'}
        </span>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportHistory}
            disabled={filteredHistory.length === 0}
            className="neo-button text-sm px-3 py-2 disabled:opacity-50"
          >
            <Download size={16} className="inline mr-2" />
            Exportar
          </button>
          <button
            onClick={() => setShowConfirmClear(true)}
            disabled={history.length === 0}
            className="neo-button text-sm px-3 py-2 disabled:opacity-50"
          >
            <Trash2 size={16} className="inline mr-2" />
            {t('history.clearHistory')}
          </button>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-2">
        {filteredHistory.length === 0 ? (
          <div className="neo-card p-12 text-center">
            <Clock size={48} className="mx-auto mb-4 text-text-tertiary opacity-50" />
            <p className="text-text-secondary">
              {t('history.noHistory')}
            </p>
          </div>
        ) : (
          filteredHistory.map((item) => (
            <div key={item.id} className="neo-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    {item.status === 'success' ? (
                      <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle size={20} className="text-red-500 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-text-primary truncate">{item.questName}</h4>
                      <p className="text-sm text-text-secondary truncate">{item.applicationName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-text-tertiary ml-8">
                    <span className="flex items-center space-x-1">
                      <Clock size={12} />
                      <span>{formatDate(item.timestamp)}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock size={12} />
                      <span>{formatDuration(item.duration)}</span>
                    </span>
                    <span>{item.taskType.replace(/_/g, ' ')}</span>
                  </div>
                </div>
                <div className="ml-4">
                  {item.status === 'success' ? (
                    <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-xs font-medium">
                      {t('history.status.success')}
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-xs font-medium">
                      {t('history.status.failure')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Confirm Clear Modal */}
      {showConfirmClear && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="neo-card p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-text-primary mb-4">
              {t('history.clearHistory')}
            </h3>
            <p className="text-text-secondary mb-6">
              {t('history.confirmClear')}
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleClearHistory}
                className="neo-button primary flex-1"
              >
                {t('common.confirm')}
              </button>
              <button
                onClick={() => setShowConfirmClear(false)}
                className="neo-button flex-1"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryTab;

