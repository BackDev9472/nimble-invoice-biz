import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function Logo({ className, size = 'md', showText = true }: LogoProps) {
  const sizeClasses = {
    sm: {
      icon: 'w-5 h-5',
      text: 'text-lg',
      gap: 'gap-2'
    },
    md: {
      icon: 'w-6 h-6',
      text: 'text-xl', 
      gap: 'gap-2'
    },
    lg: {
      icon: 'w-8 h-8',
      text: 'text-2xl',
      gap: 'gap-3'
    }
  };

  return (
    <div className={cn('flex items-center', sizeClasses[size].gap, className)}>
      <svg 
        className={cn(sizeClasses[size].icon, 'text-primary')} 
        viewBox="0 0 200 160" 
        fill="currentColor"
      >
        <path d="M100 96.6667L125 60H200V140C200 151.04 191.04 160 180 160H20C8.96 160 0 151.04 0 140V60H75L100 96.6667Z" fill="currentColor"/>
        <path d="M180 0C191.04 0 200 8.96 200 20V40H0V20C0 8.96 8.96 0 20 0H180Z" fill="currentColor"/>
      </svg>
      {showText && (
        <span className={cn('font-bold text-accent', sizeClasses[size].text)}>
          WalletPay
        </span>
      )}
    </div>
  );
}