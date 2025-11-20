import React from 'react';

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  hover3D?: boolean;
  glowOnHover?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className = '',
  onClick,
  style,
}) => {
  return (
    <div
      className={`hologram-card transition-all duration-300 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default AnimatedCard;
