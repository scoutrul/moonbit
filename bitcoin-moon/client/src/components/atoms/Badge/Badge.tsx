import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'moon' | 'bitcoin';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full';

  const variantClasses = {
    default: 'bg-dark-card text-moon-silver border border-dark-border',
    success: 'bg-green-900/20 text-green-400 border border-green-800',
    warning: 'bg-yellow-900/20 text-yellow-400 border border-yellow-800',
    danger: 'bg-red-900/20 text-red-400 border border-red-800',
    moon: 'bg-moon-silver/10 text-moon-silver border border-moon-silver/20',
    bitcoin: 'bg-bitcoin-orange/10 text-bitcoin-orange border border-bitcoin-orange/20',
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1.5 text-sm',
  };

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={classes}>
      {children}
    </span>
  );
};

export default Badge; 