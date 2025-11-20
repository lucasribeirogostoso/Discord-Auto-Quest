import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../stores/appStore';
import { ChevronDown, User, Check, Trash2 } from 'lucide-react';
import { Account } from '../../types/electron';

const AccountSwitcher: React.FC = () => {
  const { t } = useTranslation();
  const { accounts, activeAccount, switchAccount, removeAccount } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  const handleSwitch = async (accountId: string) => {
    await switchAccount(accountId);
    setIsOpen(false);
  };

  const handleRemove = async (e: React.MouseEvent, accountId: string) => {
    e.stopPropagation();
    if (window.confirm(t('accounts.confirmRemove') || 'Are you sure you want to remove this account?')) {
      await removeAccount(accountId);
    }
  };

  if (accounts.length === 0) {
    return null;
  }

  return (
    <div className="minimal-menu" ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        className="minimal-menu-button"
        onClick={() => setIsOpen(!isOpen)}
        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        {activeAccount?.avatarUrl ? (
          <img
            src={activeAccount.avatarUrl}
            alt={activeAccount.displayName}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <User size={20} />
        )}
        <span className="minimal-text" style={{ fontSize: '14px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {activeAccount?.displayName || activeAccount?.username || t('accounts.noAccount')}
        </span>
        <ChevronDown size={16} style={{ opacity: 0.7 }} />
      </button>

      {isOpen && (
        <div className="minimal-menu-dropdown" style={{ minWidth: '250px', maxHeight: '400px', overflowY: 'auto' }}>
          <div className="minimal-text-secondary" style={{ padding: '8px 12px', fontSize: '12px', borderBottom: '1px solid var(--minimal-border)' }}>
            {t('accounts.selectAccount') || 'Select Account'}
          </div>
          {accounts.map((account: Account) => (
            <div
              key={account.id}
              className={`minimal-menu-item ${account.isActive ? 'active' : ''}`}
              onClick={() => handleSwitch(account.id)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                {account.avatarUrl ? (
                  <img
                    src={account.avatarUrl}
                    alt={account.displayName}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--minimal-accent-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <User size={18} style={{ color: 'var(--minimal-accent)' }} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="minimal-text" style={{ fontWeight: 500, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {account.displayName || account.username}
                  </div>
                  {account.globalName && account.globalName !== account.displayName && (
                    <div className="minimal-text-secondary" style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {account.globalName}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {account.isActive && (
                  <Check size={16} style={{ color: 'var(--minimal-success)', flexShrink: 0 }} />
                )}
                {accounts.length > 1 && (
                  <button
                    onClick={(e) => handleRemove(e, account.id)}
                    className="minimal-menu-button"
                    style={{ padding: '4px' }}
                    title={t('accounts.remove') || 'Remove account'}
                  >
                    <Trash2 size={14} style={{ color: 'var(--minimal-error)' }} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AccountSwitcher;

