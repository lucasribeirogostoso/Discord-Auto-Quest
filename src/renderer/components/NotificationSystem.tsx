import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
}

interface NotificationSystemProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({
  notifications,
  onRemove,
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-96 max-w-[calc(100vw-2rem)]">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
};

interface NotificationItemProps {
  notification: Notification;
  onRemove: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => onRemove(notification.id), 300);
      }, notification.duration);

      return () => clearTimeout(timer);
    }
  }, [notification.id, notification.duration, onRemove]);

  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(notification.id), 300);
  };

  const handleAction = () => {
    notification.onAction?.();
    if (!notification.duration || notification.duration <= 0) {
      onRemove(notification.id);
    }
  };

  const icons = {
    success: <CheckCircle2 size={20} className="text-green-500" />,
    error: <AlertCircle size={20} className="text-red-500" />,
    warning: <AlertTriangle size={20} className="text-yellow-500" />,
    info: <Info size={20} className="text-cyan-500" />,
  };

  const colors = {
    success: { border: 'border-green-500/50', bg: 'bg-green-500/10', glow: '0 0 20px rgba(57, 255, 20, 0.3)' },
    error: { border: 'border-red-500/50', bg: 'bg-red-500/10', glow: '0 0 20px rgba(255, 0, 110, 0.3)' },
    warning: { border: 'border-yellow-500/50', bg: 'bg-yellow-500/10', glow: '0 0 20px rgba(255, 214, 10, 0.3)' },
    info: { border: 'border-cyan-500/50', bg: 'bg-cyan-500/10', glow: '0 0 20px rgba(0, 245, 255, 0.3)' },
  };

  const colorStyle = colors[notification.type];

  return (
    <div
      className={`hologram-card p-4 rounded-lg border ${colorStyle.border} ${colorStyle.bg} animate-slide-in-right ${
        isExiting ? 'animate-fade-out' : ''
      }`}
      style={{ boxShadow: colorStyle.glow }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{icons[notification.type]}</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white">{notification.title}</div>
          {notification.message && (
            <div className="mt-1 text-sm text-text-secondary">{notification.message}</div>
          )}
          {notification.onAction && notification.actionLabel && (
            <button
              onClick={handleAction}
              className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/20 text-xs font-semibold text-white/90 hover:bg-white/10 transition-colors"
            >
              {notification.actionLabel}
            </button>
          )}
        </div>
        <button
          onClick={handleRemove}
          className="flex-shrink-0 text-text-tertiary hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default NotificationSystem;
