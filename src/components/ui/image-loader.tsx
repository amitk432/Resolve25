'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ImageLoaderProps {
  query: string;
  alt: string;
  className?: string;
  width: number;
  height: number;
}

export default function ImageLoader({ query, alt, className, width, height }: ImageLoaderProps) {
  const [imgSrc, setImgSrc] = useState(`https://placehold.co/${width}x${height}.png`);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchImage() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/unsplash?query=${encodeURIComponent(query)}`);
        const data = await response.json();
        if (response.ok) {
          setImgSrc(data.url);
        } else {
          console.error('Failed to fetch image from Unsplash:', data.error);
        }
      } catch (error) {
        console.error('Error fetching image:', error);
      }
    }

    if (query) {
      fetchImage();
    }
  }, [query]);

  return (
    <div className={cn("relative", className)}>
      {isLoading && (
        <div className="absolute inset-0 bg-muted/50 flex items-center justify-center rounded-lg">
          <div className="h-8 w-8 border-4 border-background border-t-primary rounded-full animate-spin"></div>
        </div>
      )}
      <Image
        src={imgSrc}
        alt={alt}
        width={width}
        height={height}
        className={cn("transition-opacity duration-300", isLoading ? 'opacity-0' : 'opacity-100', className)}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
        }}
      />
    </div>
  );
}
