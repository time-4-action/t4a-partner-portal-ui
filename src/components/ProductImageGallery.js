'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

const ProductImageGallery = ({ images, altText }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset index when images change (e.g., when a new variant is selected)
  useEffect(() => {
    setCurrentIndex(0);
  }, [images]);

  // Handle cases where images might be missing and provide a placeholder
  const safeImages = (!images || images.length === 0)
    ? [{ url: "https://via.placeholder.com/800" }]
    : images;

  const goToPrevious = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? safeImages.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    const isLastSlide = currentIndex === safeImages.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

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
              className="absolute top-1/2 left-3 transform -translate-y-1/2 z-10 cursor-pointer p-2 bg-black/50 rounded-full text-white hover:bg-black/75 transition-opacity"
              aria-label="Previous Image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Right Arrow */}
            <button
              onClick={goToNext}
              className="absolute top-1/2 right-3 transform -translate-y-1/2 z-10 cursor-pointer p-2 bg-black/50 rounded-full text-white hover:bg-black/75 transition-opacity"
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
          className="bg-neutral-700"
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
