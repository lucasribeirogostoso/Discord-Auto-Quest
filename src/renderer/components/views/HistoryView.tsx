import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../stores/appStore';
import { Search, Trash2, CheckCircle, XCircle, Clock, Download, X } from 'lucide-react';

const HistoryView: React.FC = () => {
  const { t } = useTranslation();
  const { history, clearHistory, setCurrentView } = useAppStore();
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
    <div className="view-container">
      <div className="flex items-center justify-between mb-8">
        <h1 className="neon-title">{t('history.title')}</h1>
        <button
          onClick={() => setCurrentView('dashboard')}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <div className="neon-card mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
            />
            <input
              type="text"
              placeholder={t('history.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="neon-input pl-10 bg-black/30 border-white/10 focus:border-[#00f0ff]/50 text-white w-full"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="neon-input bg-black/30 border-white/10 focus:border-[#00f0ff]/50 text-white"
          >
            <option value="all">{t('history.filterAll')}</option>
            <option value="success">{t('history.filterSuccess')}</option>
            <option value="failure">{t('history.filterFailure')}</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="neon-input bg-black/30 border-white/10 focus:border-[#00f0ff]/50 text-white"
          >
            <option value="all">Todo o Período</option>
            <option value="today">Hoje</option>
            <option value="week">Última Semana</option>
            <option value="month">Último Mês</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-400">
          {filteredHistory.length} {filteredHistory.length === 1 ? 'resultado' : 'resultados'}
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportHistory}
            disabled={filteredHistory.length === 0}
            className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={16} />
            <span>Exportar</span>
          </button>
          <button
            onClick={() => setShowConfirmClear(true)}
            disabled={history.length === 0}
            className="px-4 py-2 rounded-lg bg-[#ff0055]/10 hover:bg-[#ff0055]/20 text-[#ff0055] border border-[#ff0055]/20 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 size={16} />
            <span>{t('history.clearHistory')}</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredHistory.length === 0 ? (
          <div className="neon-card text-center py-16">
            <Clock size={48} className="mx-auto mb-4 text-gray-600" />
            <p className="text-gray-500">{t('history.noHistory')}</p>
          </div>
        ) : (
          filteredHistory.map((item) => (
            <div key={item.id} className="neon-card p-4 hover:bg-white/5 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-4 mb-2">
                    {item.status === 'success' ? (
                      <CheckCircle size={20} className="text-[#0aff60] shrink-0" />
                    ) : (
                      <XCircle size={20} className="text-[#ff0055] shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white text-sm">{item.questName}</h4>
                      <p className="text-xs text-gray-400">{item.applicationName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-xs text-gray-500 ml-9">
                    <span className="flex items-center gap-1.5">
                      <Clock size={12} />
                      <span>{formatDate(item.timestamp)}</span>
                    </span>
                    <span>{formatDuration(item.duration)}</span>
                    <span>{item.taskType.replace(/_/g, ' ')}</span>
                  </div>
                </div>
                <div className="ml-4">
                  {item.status === 'success' ? (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-[#0aff60]/10 text-[#0aff60] border border-[#0aff60]/20">
                      {t('history.status.success')}
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-[#ff0055]/10 text-[#ff0055] border border-[#ff0055]/20">
                      {t('history.status.failure')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showConfirmClear && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="neon-card w-full max-w-md m-4 border-[#ff0055]/50 shadow-[0_0_30px_rgba(255,0,85,0.2)]">
            <h3 className="text-xl font-bold text-white mb-4">
              {t('history.clearHistory')}
            </h3>
            <p className="text-gray-400 mb-6">
              {t('history.confirmClear')}
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleClearHistory}
                className="flex-1 py-2.5 rounded-lg bg-[#ff0055] text-white font-medium hover:bg-[#ff0055]/90 transition-colors shadow-[0_0_10px_#ff0055]"
              >
                {t('common.confirm')}
              </button>
              <button
                onClick={() => setShowConfirmClear(false)}
                className="flex-1 py-2.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
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

export default HistoryView;

