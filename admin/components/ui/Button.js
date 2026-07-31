'use client';

import { Button as ShadcnButton } from '@/components/ui/button';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  type = 'button',
  onClick,
  ...props
}) {
  const variantMap = {
    primary: 'default',
    secondary: 'secondary',
    accent: 'default',
    ghost: 'ghost',
    danger: 'destructive',
    outline: 'outline',
  };

  const sizeMap = {
    sm: 'sm',
    md: 'default',
    lg: 'lg',
    xl: 'lg',
  };

  const extraClasses = {
    primary: '!bg-[#2D6A4F] hover:!bg-[#1B4332] !text-white shadow-sm',
    accent: '!bg-[#E87722] hover:!bg-[#d95f0e] !text-white shadow-sm',
    secondary: '!bg-white !text-[#2D6A4F] !border-[#2D6A4F] hover:!bg-[#2D6A4F] hover:!text-white',
    ghost: '!text-[#2D6A4F] hover:!bg-[#2D6A4F]/10',
    danger: '',
    outline: '!border-[#EDE0CC] !text-[#1C1C1E] hover:!border-[#2D6A4F] hover:!text-[#2D6A4F]',
  };

  return (
    <ShadcnButton
      type={type}
      variant={variantMap[variant] || 'default'}
      size={sizeMap[size] || 'default'}
      className={`${extraClasses[variant] || ''} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </ShadcnButton>
  );
}
