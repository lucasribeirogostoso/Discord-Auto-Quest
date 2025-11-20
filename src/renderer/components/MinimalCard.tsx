import React from 'react';

interface MinimalCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
  style?: React.CSSProperties;
}

const MinimalCard: React.FC<MinimalCardProps> = ({
  children,
  className = '',
  onClick,
  interactive = false,
  style,
}) => {
  const baseClasses = 'neon-card';
  const interactiveClass = interactive ? 'neon-card-interactive' : '';
  const combinedClasses = `${baseClasses} ${interactiveClass} ${className}`.trim();

  return (
    <div className={combinedClasses} onClick={onClick} style={style}>
      {children}
    </div>
  );
};

export default MinimalCard;

