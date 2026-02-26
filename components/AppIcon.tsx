'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppIconProps {
  packageId: string;
  packageName: string;
  iconPath?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showFallbackIcon?: boolean;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
  '2xl': 'w-20 h-20',
};

const iconSizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
  '2xl': 'w-10 h-10',
};

const imageSizes = {
  sm: 32,
  md: 32,
  lg: 64,
  xl: 128,
  '2xl': 128,
};

export function AppIcon({
  packageId,
  packageName,
  iconPath,
  size = 'lg',
  className,
  showFallbackIcon = true,
}: AppIconProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Reset image state when iconPath changes (e.g. store manifest icon arrives async)
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [iconPath]);

  // Determine icon URL
  const imageSize = imageSizes[size];
  const isExternalUrl = iconPath?.startsWith('http');
  const iconUrl = isExternalUrl
    ? iconPath!
    : `${(iconPath || `/icons/${packageId}/`).replace(/\/?$/, '/')}icon-${imageSize}.png`;

  const handleError = () => {
    setImageError(true);
  };

  const handleLoad = () => {
    setImageLoaded(true);
  };

  // If image failed to load and we want to show fallback, render simple fallback
  if (imageError && showFallbackIcon) {
    return (
      <div
        className={cn(
          'rounded-lg bg-gradient-to-br from-bg-elevated to-bg-surface flex items-center justify-center flex-shrink-0 border border-overlay/5',
          sizeClasses[size],
          className
        )}
      >
        <Package className={cn('text-text-muted', iconSizeClasses[size])} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg bg-gradient-to-br from-bg-elevated to-bg-surface flex items-center justify-center flex-shrink-0 border border-overlay/5 overflow-hidden relative',
        sizeClasses[size],
        className
      )}
    >
      {/* Show fallback icon until image loads or on error */}
      {(!imageLoaded || imageError) && showFallbackIcon && (
        <Package
          className={cn(
            'text-text-muted absolute',
            iconSizeClasses[size],
            imageLoaded && !imageError ? 'opacity-0' : 'opacity-100'
          )}
        />
      )}

      {/* Actual image - using Next.js Image for automatic AVIF/WebP conversion */}
      {!imageError && (
        <Image
          src={iconUrl}
          alt={packageName}
          width={imageSize}
          height={imageSize}
          className={cn(
            'object-contain transition-opacity duration-200',
            imageLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onError={handleError}
          onLoad={handleLoad}
          sizes={`${imageSize}px`}
          quality={90}
        />
      )}
    </div>
  );
}
