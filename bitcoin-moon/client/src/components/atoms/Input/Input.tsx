import React from 'react';

export interface InputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'search';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  error?: boolean;
  className?: string;
  id?: string;
  name?: string;
}

export const Input: React.FC<InputProps> = ({
  value = '',
  onChange,
  placeholder,
  type = 'text',
  size = 'md',
  disabled = false,
  error = false,
  className = '',
  id,
  name,
}) => {
  const baseClasses = 'w-full rounded-lg border bg-dark-card text-moon-silver placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors duration-200';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-3 text-base',
  };

  const stateClasses = error
    ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
    : 'border-dark-border focus:ring-bitcoin-orange/50 focus:border-bitcoin-orange';

  const disabledClasses = disabled
    ? 'opacity-50 cursor-not-allowed'
    : '';

  const classes = [
    baseClasses,
    sizeClasses[size],
    stateClasses,
    disabledClasses,
    className,
  ].filter(Boolean).join(' ');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <input
      id={id}
      name={name}
      type={type}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      className={classes}
    />
  );
};

export default Input; 