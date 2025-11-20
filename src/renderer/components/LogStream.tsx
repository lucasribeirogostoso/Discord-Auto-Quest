import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../stores/appStore';
import { Maximize2, Minimize2, Filter } from 'lucide-react';

const LogStream: React.FC = () => {
  const { t } = useTranslation();
  const { logs } = useAppStore();
  const [expanded, setExpanded] = useState(false);
  const [logFilter, setLogFilter] = useState<'all' | 'info' | 'success' | 'error' | 'warning'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const filteredLogs = useMemo(() => {
    if (logFilter === 'all') return logs.slice(-50); // Mostrar apenas últimos 50
    return logs.filter(log => log.level === logFilter).slice(-50);
  }, [logs, logFilter]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  if (logs.length === 0) {
    return null;
  }

  return (
    <div 
      className="minimal-card" 
      style={{ 
        position: 'fixed', 
        bottom: '24px', 
        right: '24px', 
        width: expanded ? '600px' : '400px', 
        maxHeight: expanded ? '600px' : '300px',
        zIndex: 20,
        transition: 'all 0.3s ease',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-3" style={{ borderBottom: '1px solid var(--minimal-border)', flexShrink: 0, width: '100%', boxSizing: 'border-box' }}>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full" style={{ background: 'var(--minimal-success)', animation: 'pulse 2s ease-in-out infinite' }} />
          <span className="minimal-text" style={{ fontSize: '14px', fontWeight: 600 }}>Console</span>
          <span className="minimal-text-secondary" style={{ fontSize: '12px' }}>({filteredLogs.length})</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-1.5 hover:bg-white/10 rounded transition-colors"
            >
              <Filter size={14} className="text-white/60" />
            </button>
            {showFilters && (
              <div className="minimal-card" style={{ position: 'absolute', bottom: '100%', right: 0, marginBottom: '8px', minWidth: '120px', zIndex: 100 }}>
                {(['all', 'info', 'success', 'error', 'warning'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => {
                      setLogFilter(level);
                      setShowFilters(false);
                    }}
                    className={`minimal-menu-item ${logFilter === level ? 'active' : ''}`}
                  >
                    {t(`dashboard.${level}Logs`)}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="minimal-menu-button"
          >
            {expanded ? (
              <Minimize2 size={14} />
            ) : (
              <Maximize2 size={14} />
            )}
          </button>
        </div>
      </div>

      {/* Logs Content */}
      <div 
        style={{ 
          fontFamily: 'monospace', 
          fontSize: '11px', 
          lineHeight: '1.6',
          maxHeight: expanded ? '550px' : '250px',
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '8px',
          width: '100%',
          boxSizing: 'border-box',
          wordBreak: 'break-word',
          wordWrap: 'break-word',
          overflowWrap: 'break-word'
        }}
      >
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 minimal-text-secondary" style={{ fontSize: '12px' }}>
            {t('dashboard.noLogs')}
          </div>
        ) : (
          <>
            {filteredLogs.map((log, index) => (
              <div
                key={index}
                style={{ 
                  marginBottom: '4px', 
                  padding: '4px 8px',
                  borderLeft: `2px solid ${
                    log.level === 'success' ? 'var(--minimal-success)' :
                    log.level === 'error' ? 'var(--minimal-error)' :
                    log.level === 'warning' ? 'var(--minimal-warning)' :
                    'var(--minimal-info)'
                  }`,
                  color: 'var(--minimal-text-primary)',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  wordBreak: 'break-word',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '4px',
                  alignItems: 'flex-start'
                }}
              >
                <span className="minimal-text-secondary" style={{ fontSize: '10px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {formatTime(log.timestamp)}
                </span>
                <span style={{ 
                  fontSize: '10px', 
                  fontWeight: 600, 
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  color: log.level === 'success' ? 'var(--minimal-success)' :
                         log.level === 'error' ? 'var(--minimal-error)' :
                         log.level === 'warning' ? 'var(--minimal-warning)' :
                         'var(--minimal-info)'
                }}>
                  [{log.level.toUpperCase()}]
                </span>
                <span 
                  className="minimal-text" 
                  style={{ 
                    fontSize: '11px', 
                    wordBreak: 'break-word',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    flex: '1 1 0',
                    minWidth: 0
                  }}
                >
                  {log.message}
                </span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </>
        )}
      </div>
    </div>
  );
};

export default LogStream;

