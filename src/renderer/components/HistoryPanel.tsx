import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../stores/appStore';
import AnimatedCard from './AnimatedCard';
import { 
  Search, Filter, Trash2, CheckCircle, XCircle, Clock, Download, 
  Calendar, FileText, X, ChevronDown, ChevronUp
} from 'lucide-react';

const HistoryPanel: React.FC = () => {
  const { t } = useTranslation();
  const { history, clearHistory, settings } = useAppStore();
  const isHighContrast = settings.highContrast ?? true;
  const accentColor = settings.accentColor || '#8B5CF6';
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failure'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'duration'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const filteredHistory = useMemo(() => {
    let filtered = history.filter((item) => {
      const matchesSearch =
        item.questName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.applicationName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesType = typeFilter === 'all' || item.taskType === typeFilter;
      
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
      
      return matchesSearch && matchesStatus && matchesType && matchesDate;
    });

    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = a.timestamp - b.timestamp;
      } else if (sortBy === 'name') {
        comparison = a.questName.localeCompare(b.questName);
      } else if (sortBy === 'duration') {
        comparison = a.duration - b.duration;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [history, searchTerm, statusFilter, typeFilter, dateFilter, sortBy, sortOrder]);

  const groupedHistory = useMemo(() => {
    const groups: Record<string, typeof filteredHistory> = {};
    filteredHistory.forEach((item) => {
      const date = new Date(item.timestamp);
      const dateKey = date.toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
    });
    return groups;
  }, [filteredHistory]);

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

  const getTaskTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      WATCH_VIDEO: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      PLAY_ON_DESKTOP: 'bg-green-500/20 text-green-400 border-green-500/50',
      STREAM_ON_DESKTOP: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
      PLAY_ACTIVITY: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
      WATCH_VIDEO_ON_MOBILE: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50',
    };
    return colors[type] || 'bg-gray-500/20 text-gray-400 border-gray-500/50';
  };

  const uniqueTaskTypes = useMemo(() => {
    return Array.from(new Set(history.map(h => h.taskType)));
  }, [history]);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
    setDateFilter('all');
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || dateFilter !== 'all';

  const toggleGroup = (dateKey: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dateKey)) {
        newSet.delete(dateKey);
      } else {
        newSet.add(dateKey);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title and Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-4xl font-bold flex items-center space-x-3 mb-2 ${isHighContrast ? 'text-hc-primary' : 'text-white'}`}>
            <Clock size={40} style={{ color: isHighContrast ? accentColor : '#8B5CF6' }} className="animate-float" />
            <span className="gradient-text">{t('history.title')}</span>
          </h2>
          <p className={`text-sm ${isHighContrast ? 'text-hc-secondary' : 'text-gray-400'}`}>
            Visualize e gerencie todo o histórico de suas automações
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportHistory}
            disabled={filteredHistory.length === 0}
            className="flex items-center space-x-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
            title="Exportar histórico"
          >
            <Download size={18} />
            <span>Exportar</span>
          </button>
          <button
            onClick={() => setShowConfirmClear(true)}
            disabled={history.length === 0}
            className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Trash2 size={18} />
            <span>{t('history.clearHistory')}</span>
          </button>
        </div>
      </div>

      {/* Enhanced Filters */}
      <AnimatedCard>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Filter className="text-purple-500" size={20} />
              <h3 className="text-lg font-semibold text-white">Filtros</h3>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center space-x-1 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <X size={16} />
                <span>Limpar filtros</span>
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder={t('history.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-modern w-full pl-10 pr-4 py-2.5 rounded-lg focus:outline-none text-white placeholder-gray-500"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="input-modern w-full pl-4 pr-4 py-2.5 rounded-lg focus:outline-none text-white appearance-none cursor-pointer"
              >
                <option value="all">{t('history.filterAll')}</option>
                <option value="success">{t('history.filterSuccess')}</option>
                <option value="failure">{t('history.filterFailure')}</option>
              </select>
            </div>

            {/* Type Filter */}
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="input-modern w-full pl-4 pr-4 py-2.5 rounded-lg focus:outline-none text-white appearance-none cursor-pointer"
              >
                <option value="all">Todos os Tipos</option>
                {uniqueTaskTypes.map(type => (
                  <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div className="relative">
              <Calendar
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="input-modern w-full pl-10 pr-4 py-2.5 rounded-lg focus:outline-none text-white appearance-none cursor-pointer"
              >
                <option value="all">Todo o Período</option>
                <option value="today">Hoje</option>
                <option value="week">Última Semana</option>
                <option value="month">Último Mês</option>
              </select>
            </div>
          </div>

          {/* Sort Options */}
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center space-x-4">
            <span className="text-sm text-gray-400 font-medium">Ordenar por:</span>
            <div className="flex items-center space-x-2">
              {(['date', 'name', 'duration'] as const).map((sort) => (
                <button
                  key={sort}
                  onClick={() => {
                    if (sortBy === sort) {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy(sort);
                      setSortOrder('desc');
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    sortBy === sort
                      ? 'gradient-primary text-white'
                      : 'glass-card text-gray-400 hover:text-white'
                  }`}
                >
                  {sort === 'date' ? 'Data' : sort === 'name' ? 'Nome' : 'Duração'}
                  {sortBy === sort && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </AnimatedCard>

      {/* Results Summary */}
      <AnimatedCard className="border-l-4 border-purple-500/50 bg-purple-500/10">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <FileText className="text-purple-500" size={20} />
              <span className="text-white font-medium">
                {filteredHistory.length} {filteredHistory.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
              </span>
            </div>
            {filteredHistory.length !== history.length && (
              <span className="text-sm text-gray-400">
                de {history.length} total
              </span>
            )}
          </div>
        </div>
      </AnimatedCard>

      {/* Timeline View */}
      <div className="space-y-4">
        {Object.entries(groupedHistory).length === 0 ? (
          <AnimatedCard>
            <div className="p-12 text-center">
              <Clock size={64} className="mx-auto text-gray-400 mb-4 opacity-50" />
              <p className="text-lg font-medium text-gray-400 mb-2">
                {hasActiveFilters ? 'Nenhum resultado encontrado' : t('history.noHistory')}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-purple-400 hover:text-purple-300 transition-colors text-sm font-medium"
                >
                  Limpar filtros para ver todos os resultados
                </button>
              )}
            </div>
          </AnimatedCard>
        ) : (
          Object.entries(groupedHistory).map(([dateKey, items]) => {
            const isExpanded = expandedGroups.has(dateKey);
            return (
              <AnimatedCard key={dateKey} hover3D={false}>
                <div>
                  {/* Group Header */}
                  <button
                    onClick={() => toggleGroup(dateKey)}
                    className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                      <div className="text-left">
                        <h3 className="text-lg font-bold text-white">{dateKey}</h3>
                        <p className="text-sm text-gray-400">{items.length} {items.length === 1 ? 'quest' : 'quests'}</p>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                  </button>

                  {/* Group Items */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-2 animate-fade-in">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="glass-card p-4 rounded-lg hover:bg-white/5 transition-colors border border-white/10"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-3 mb-2">
                                {item.status === 'success' ? (
                                  <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                                ) : (
                                  <XCircle size={20} className="text-red-500 flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-white truncate">{item.questName}</h4>
                                  <p className="text-sm text-gray-400 truncate">{item.applicationName}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                                <span className="flex items-center space-x-1">
                                  <Clock size={14} />
                                  <span>{formatDate(item.timestamp)}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Clock size={14} />
                                  <span>{formatDuration(item.duration)}</span>
                                </span>
                                <span className={`px-2 py-1 rounded-full border ${getTaskTypeColor(item.taskType)}`}>
                                  {item.taskType.replace(/_/g, ' ')}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              {item.status === 'success' ? (
                                <div className="flex items-center space-x-2 px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-full">
                                  <CheckCircle size={16} className="text-green-400" />
                                  <span className="text-green-400 font-semibold text-sm">
                                    {t('history.status.success')}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2 px-3 py-1 bg-red-500/20 border border-red-500/50 rounded-full">
                                  <XCircle size={16} className="text-red-400" />
                                  <span className="text-red-400 font-semibold text-sm">
                                    {t('history.status.failure')}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </AnimatedCard>
            );
          })
        )}
      </div>

      {/* Confirm Clear Modal */}
      {showConfirmClear && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <AnimatedCard className="max-w-md w-full mx-4 animate-scale-in">
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                {t('history.clearHistory')}
              </h3>
              <p className="text-gray-300 mb-6">
                {t('history.confirmClear')}
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleClearHistory}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
                >
                  {t('common.confirm')}
                </button>
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className="flex-1 glass-card text-white font-semibold py-2.5 px-4 rounded-lg transition-colors hover:bg-white/10"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </AnimatedCard>
        </div>
      )}
    </div>
  );
};

export default HistoryPanel;
