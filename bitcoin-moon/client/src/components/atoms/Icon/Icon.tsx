import React from 'react';

export interface IconProps {
  name: 'bitcoin' | 'moon' | 'chart' | 'close' | 'menu' | 'search' | 'filter';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'bitcoin' | 'moon' | 'white' | 'gray' | 'inherit' | 'success';
  className?: string;
}

const iconPaths = {
  bitcoin: 'M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z',
  moon: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z',
  chart: 'M3 3v18h18M9 17V9l4 4 4-8',
  close: 'M18 6L6 18M6 6l12 12',
  menu: 'M3 12h18M3 6h18M3 18h18',
  search: 'M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z',
  filter: 'M22 3H2l8 9.46V19l4 2v-8.54L22 3z',
};

export const Icon: React.FC<IconProps> = ({
  name,
  size = 'md',
  color = 'inherit',
  className = '',
}) => {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8',
  };

  const colorClasses = {
    bitcoin: 'text-bitcoin-orange',
    moon: 'text-moon-silver',
    white: 'text-white',
    gray: 'text-gray-400',
    inherit: '',
    success: 'text-green-400',
  };

  const classes = [
    sizeClasses[size],
    colorClasses[color],
    className,
  ].filter(Boolean).join(' ');

  return (
    <svg
      className={classes}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d={iconPaths[name]}
      />
    </svg>
  );
};

export default Icon; 