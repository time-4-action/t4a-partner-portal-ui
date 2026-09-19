/**
 * Product Image Gallery Component
 *
 * A responsive image carousel for displaying product photos with navigation controls.
 * Features include:
 * - Keyboard and button navigation (previous/next)
 * - Dot indicators for direct slide access
 * - Automatic index reset when images change (variant selection)
 * - Placeholder image fallback
 * - Infinite loop navigation
 *
 * @module ProductImageGallery
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

/**
 * Product Image Gallery Component
 *
 * Displays a carousel of product images with navigation controls.
 * Automatically resets to the first image when the images array changes.
 *
 * @param {Object} props - Component props
 * @param {Array<Object>} props.images - Array of image objects with `url` property
 * @param {string} props.altText - Alt text for images (product name)
 * @returns {JSX.Element} Image gallery with navigation
 *
 * @example
 * <ProductImageGallery
 *   images={[{ url: "https://..." }, { url: "https://..." }]}
 *   altText="Product Name"
 * />
 */
const ProductImageGallery = ({ images, altText }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset to first image when images array changes (e.g., variant selection)
  useEffect(() => {
    setCurrentIndex(0);
  }, [images]);

  // No images at all (neither variant nor parent) → show the same tasteful placeholder as the
  // product list, not a broken external placeholder service.
  const hasImages = Array.isArray(images) && images.length > 0;
  if (!hasImages) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-muted shadow-lg">
        <svg className="h-16 w-16 text-muted-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  const safeImages = images;

  /**
   * Navigates to the previous image in the gallery.
   * Wraps to the last image if currently on the first.
   */
  const goToPrevious = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? safeImages.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  /**
   * Navigates to the next image in the gallery.
   * Wraps to the first image if currently on the last.
   */
  const goToNext = () => {
    const isLastSlide = currentIndex === safeImages.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  /**
   * Jumps directly to a specific slide by index.
   *
   * @param {number} slideIndex - Index of the slide to display
   */
  const goToSlide = (slideIndex) => {
    setCurrentIndex(slideIndex);
  };

  return (
    <div>
      <div className="relative w-full rounded-lg overflow-hidden shadow-lg">
        {safeImages.length > 1 && (
          <>
            {/* Left Arrow */}
            <button
              onClick={goToPrevious}
              className="absolute top-1/2 left-3 transform -translate-y-1/2 z-10 cursor-pointer p-2 bg-black/50 rounded-full text-white hover:bg-black/80 transition-opacity"
              aria-label="Previous Image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Right Arrow */}
            <button
              onClick={goToNext}
              className="absolute top-1/2 right-3 transform -translate-y-1/2 z-10 cursor-pointer p-2 bg-black/50 rounded-full text-white hover:bg-black/80 transition-opacity"
              aria-label="Next Image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        <Image
          src={safeImages[currentIndex].url}
          alt={`${altText} image ${currentIndex + 1}`}
          width={1200}
          height={1200}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          // Make image responsive while maintaining aspect ratio
          style={{ width: '100%', height: 'auto' }}
          className="bg-accent"
          priority={currentIndex === 0}
        />
      </div>

      {/* Dots Navigation */}
      {safeImages.length > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          {safeImages.map((_, slideIndex) => (
            <button key={slideIndex} onClick={() => goToSlide(slideIndex)} className={`h-3 w-3 rounded-full transition-colors ${currentIndex === slideIndex ? 'bg-cyan-400' : 'bg-neutral-500 hover:bg-neutral-400'}`} aria-label={`Go to image ${slideIndex + 1}`}></button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImageGallery;
