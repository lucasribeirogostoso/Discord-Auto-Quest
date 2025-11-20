import React, { useState, useEffect, useMemo } from 'react';
import { Search, Command, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppStore, executeQuestAutomation } from '../stores/appStore';

interface Command {
  id: string;
  label: string;
  category: string;
  icon?: React.ReactNode;
  action: () => void;
  shortcut?: string;
}

const CommandPalette: React.FC = () => {
  const { t } = useTranslation();
  const { setCurrentView } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: Command[] = useMemo(
    () => [
      {
        id: 'dashboard',
        label: t('nav.dashboard'),
        category: 'Navigation',
        action: () => {
          setCurrentView('dashboard');
          setIsOpen(false);
        },
      },
      {
        id: 'quests',
        label: t('nav.quests'),
        category: 'Navigation',
        action: () => {
          setCurrentView('quests');
          setIsOpen(false);
        },
      },
      {
        id: 'library',
        label: t('nav.library'),
        category: 'Navigation',
        action: () => {
          setCurrentView('library');
          setIsOpen(false);
        },
      },
      {
        id: 'stats',
        label: t('nav.stats'),
        category: 'Navigation',
        action: () => {
          setCurrentView('stats');
          setIsOpen(false);
        },
      },
      {
        id: 'history',
        label: t('nav.history'),
        category: 'Navigation',
        action: () => {
          setCurrentView('history');
          setIsOpen(false);
        },
      },
      {
        id: 'settings',
        label: t('nav.settings'),
        category: 'Navigation',
        action: () => {
          setCurrentView('settings');
          setIsOpen(false);
        },
      },
      {
        id: 'execute',
        label: t('dashboard.executeButton'),
        category: 'Actions',
        action: () => {
          executeQuestAutomation();
          setIsOpen(false);
        },
        shortcut: 'E',
      },
    ],
    [t, setCurrentView]
  );

  const filteredCommands = useMemo(() => {
    if (!searchTerm) return commands;
    const term = searchTerm.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(term) ||
        cmd.category.toLowerCase().includes(term)
    );
  }, [commands, searchTerm]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setSearchTerm('');
        setSelectedIndex(0);
      }
      if (isOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        }
        if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
          e.preventDefault();
          filteredCommands[selectedIndex].action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm]);

  if (!isOpen) return null;

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) {
      acc[cmd.category] = [];
    }
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, Command[]>);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 animate-fade-in"
      onClick={() => {
        setIsOpen(false);
        setSearchTerm('');
      }}
    >
      <div
        className="hologram-card rounded-2xl shadow-2xl w-full max-w-2xl mx-4 animate-scale-in border-2"
        style={{ borderColor: '#00F5FF', boxShadow: '0 0 40px rgba(0, 245, 255, 0.3)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-neon">
          <Search size={20} className="text-cyan-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('common.searchCommands') || 'Search commands...'}
            className="flex-1 bg-transparent text-white placeholder-text-tertiary outline-none text-base"
            autoFocus
          />
          <div className="flex items-center gap-1 px-2 py-1 hologram-card rounded text-xs text-cyan-500 border border-cyan-500/50">
            <Command size={12} />
            <span>K</span>
          </div>
        </div>

        {/* Commands List */}
        <div className="max-h-96 overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">
              <p>No commands found</p>
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, cmds]) => (
              <div key={category} className="mb-4">
                <div className="px-3 py-2 text-xs font-semibold text-cyan-500 uppercase border-b border-neon">
                  {category}
                </div>
                {cmds.map((cmd) => {
                  const globalIndex = filteredCommands.indexOf(cmd);
                  return (
                    <button
                      key={cmd.id}
                      onClick={cmd.action}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                        selectedIndex === globalIndex
                          ? 'bg-cyan-500/20 border border-cyan-500/50'
                          : 'hover:bg-bg-surface border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {cmd.icon}
                        <span className="text-white">{cmd.label}</span>
                      </div>
                      {cmd.shortcut && (
                        <div className="flex items-center gap-1 text-xs text-text-tertiary">
                          <kbd className="px-2 py-1 hologram-card rounded border border-neon">{cmd.shortcut}</kbd>
                          <ArrowRight size={14} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
