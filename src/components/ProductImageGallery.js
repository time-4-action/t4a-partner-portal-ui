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

import { useState } from 'react';
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

  // Reset to the first image when the image set changes (e.g. variant selection). Done during
  // render via the "adjust state from props" pattern instead of an effect, so there is no
  // extra render with a stale (possibly out-of-range) index.
  const [prevImages, setPrevImages] = useState(images);
  if (images !== prevImages) {
    setPrevImages(images);
    setCurrentIndex(0);
  }

  // No images at all (neither variant nor parent) → show the same tasteful placeholder as the
  // product list, not a broken external placeholder service.
  const hasImages = Array.isArray(images) && images.length > 0;
  if (!hasImages) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-xl border border-border bg-card">
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
  // Show at most this many thumbnails; the rest stay reachable via the arrows / "+N" tile.
  const MAX_THUMBS = 12;
  const thumbCount = safeImages.length > MAX_THUMBS ? MAX_THUMBS - 1 : safeImages.length;
  const hiddenCount = safeImages.length - thumbCount;

  const goToSlide = (slideIndex) => {
    setCurrentIndex(slideIndex);
  };

  return (
    <div className="w-full">
      {/* Square stage, width-capped (never height-capped — that would letterbox the image). */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        {safeImages.length > 1 && (
          <>
            {/* Left Arrow */}
            <button
              onClick={goToPrevious}
              className="absolute top-1/2 left-2 z-10 -translate-y-1/2 cursor-pointer rounded-full border border-border bg-background/90 p-1.5 text-foreground shadow-xs transition-colors hover:bg-accent"
              aria-label="Previous Image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Right Arrow */}
            <button
              onClick={goToNext}
              className="absolute top-1/2 right-2 z-10 -translate-y-1/2 cursor-pointer rounded-full border border-border bg-background/90 p-1.5 text-foreground shadow-xs transition-colors hover:bg-accent"
              aria-label="Next Image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          className="h-full w-full object-contain"
          priority={currentIndex === 0}
        />
      </div>

      {/* Thumbnail strip — capped at MAX_THUMBS; the last tile shows how many more the arrows reach. */}
      {safeImages.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {safeImages.slice(0, thumbCount).map((img, slideIndex) => (
            <button
              key={img.url}
              onClick={() => goToSlide(slideIndex)}
              aria-label={`Go to image ${slideIndex + 1}`}
              className={`h-14 w-14 shrink-0 overflow-hidden rounded-md border bg-card transition-colors ${currentIndex === slideIndex ? 'border-accent-brand' : 'border-border hover:border-input'}`}
            >
              <Image src={img.url} alt="" width={112} height={112} className="h-full w-full object-cover" />
            </button>
          ))}
          {hiddenCount > 0 && (
            <button
              onClick={() => goToSlide(thumbCount)}
              aria-label={`${hiddenCount} more images`}
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-md border bg-muted text-xs font-medium text-muted-foreground transition-colors hover:border-input ${currentIndex >= thumbCount ? 'border-accent-brand' : 'border-border'}`}
            >
              +{hiddenCount}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductImageGallery;
