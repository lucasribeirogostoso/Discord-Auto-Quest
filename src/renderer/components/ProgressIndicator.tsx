import React from 'react';
import { Loader2 } from 'lucide-react';

interface ProgressIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'dots' | 'pulse' | 'ring';
  className?: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  size = 'md',
  variant = 'spinner',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  if (variant === 'spinner') {
    return (
      <Loader2
        className={`${sizeClasses[size]} animate-spin text-purple-500 ${className}`}
      />
    );
  }

  if (variant === 'dots') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`${sizeClasses[size]} rounded-full gradient-primary animate-pulse`}
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full gradient-primary animate-pulse ${className}`}
      />
    );
  }

  if (variant === 'ring') {
    return (
      <div className={`relative ${sizeClasses[size]} ${className}`}>
        <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
        <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return null;
};

export default ProgressIndicator;

