'use client';

import { useState, useEffect, useRef, ImgHTMLAttributes } from 'react';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  aspectRatio?: '1:1' | '4:3' | '16:9' | '3:2' | string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  loading?: 'lazy' | 'eager';
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * OptimizedImage - Image component with lazy loading, aspect ratio, and error handling
 *
 * Features:
 * - Lazy loading with Intersection Observer
 * - Aspect ratio preservation
 * - Blur placeholder
 * - Fallback image on error
 * - Loading state
 *
 * @example
 * ```tsx
 * <OptimizedImage
 *   src={product.imageUrl}
 *   alt={product.name}
 *   aspectRatio="1:1"
 *   objectFit="cover"
 *   loading="lazy"
 *   placeholder="blur"
 *   className="rounded-lg"
 * />
 * ```
 */
export function OptimizedImage({
  src,
  alt,
  fallbackSrc = '/images/placeholder.png',
  aspectRatio,
  objectFit = 'cover',
  loading = 'lazy',
  placeholder = 'blur',
  blurDataURL,
  onLoad,
  onError,
  className = '',
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | null>(loading === 'eager' ? src : null);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | undefined>(undefined);

  // Lazy loading with Intersection Observer
  useEffect(() => {
    if (loading === 'lazy' && imgRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setCurrentSrc(src);
              observerRef.current?.disconnect();
            }
          });
        },
        {
          rootMargin: '50px', // Start loading 50px before entering viewport
        }
      );

      observerRef.current.observe(imgRef.current);

      return () => {
        observerRef.current?.disconnect();
      };
    }
  }, [src, loading]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setCurrentSrc(fallbackSrc);
    onError?.();
  };

  // Parse aspect ratio
  const paddingBottom = aspectRatio
    ? aspectRatio.includes(':')
      ? `${(parseFloat(aspectRatio.split(':')[1]) / parseFloat(aspectRatio.split(':')[0])) * 100}%`
      : aspectRatio
    : undefined;

  const containerStyle = paddingBottom
    ? { paddingBottom, position: 'relative' as const }
    : undefined;

  const imageStyle = paddingBottom
    ? {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit,
      }
    : { objectFit };

  return (
    <div className={`overflow-hidden ${className}`} style={containerStyle}>
      {/* Blur placeholder */}
      {!isLoaded && placeholder === 'blur' && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={
            blurDataURL
              ? {
                  backgroundImage: `url(${blurDataURL})`,
                  backgroundSize: 'cover',
                  filter: 'blur(20px)',
                  transform: 'scale(1.1)',
                }
              : undefined
          }
        />
      )}

      {/* Loading skeleton */}
      {!isLoaded && placeholder === 'empty' && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <svg
            className="w-12 h-12 text-gray-300"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}

      {/* Actual image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={currentSrc || undefined}
        alt={alt}
        style={imageStyle}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />

      {/* Error state */}
      {hasError && fallbackSrc && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <p className="text-xs text-gray-400">Image not available</p>
        </div>
      )}
    </div>
  );
}

/**
 * ProductImage - Specialized image component for product images
 *
 * @example
 * ```tsx
 * <ProductImage
 *   src={product.imageUrl}
 *   alt={product.name}
 *   size="md"
 * />
 * ```
 */
interface ProductImageProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
}

const sizeClasses = {
  sm: 'w-12 h-12',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
  xl: 'w-48 h-48',
};

export function ProductImage({
  src,
  alt,
  size = 'md',
  className = '',
  onClick,
}: ProductImageProps) {
  return (
    <div
      className={`${sizeClasses[size]} ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <OptimizedImage
        src={src}
        alt={alt}
        aspectRatio="1:1"
        objectFit="cover"
        loading="lazy"
        placeholder="blur"
        className="rounded-lg border border-gray-200"
      />
    </div>
  );
}
