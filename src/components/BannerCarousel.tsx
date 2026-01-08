import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PromotionalBanner } from '../types';

interface BannerCarouselProps {
    banners: PromotionalBanner[];
}

const BannerCarousel: React.FC<BannerCarouselProps> = ({ banners }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    // Auto-rotate banners
    useEffect(() => {
        if (!isAutoPlaying || banners.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [isAutoPlaying, banners.length]);

    const goToPrevious = () => {
        setIsAutoPlaying(false);
        setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    };

    const goToNext = () => {
        setIsAutoPlaying(false);
        setCurrentIndex((prev) => (prev + 1) % banners.length);
    };

    const goToSlide = (index: number) => {
        setIsAutoPlaying(false);
        setCurrentIndex(index);
    };

    if (banners.length === 0) {
        return null;
    }

    const currentBanner = banners[currentIndex];

    const handleBannerClick = () => {
        if (currentBanner.link_url) {
            window.open(currentBanner.link_url, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <section className="w-full bg-beige-50 py-6 sm:py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div
                    className={`relative w-full h-64 sm:h-80 md:h-96 lg:h-[28rem] rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300 ${currentBanner.link_url ? 'cursor-pointer' : ''}`}
                    onClick={handleBannerClick}
                    onMouseEnter={() => setIsAutoPlaying(false)}
                    onMouseLeave={() => setIsAutoPlaying(true)}
                >
                    {/* Banner Image */}
                    <div className="absolute inset-0 transition-opacity duration-500">
                        <img
                            src={currentBanner.image_url}
                            alt={currentBanner.title}
                            className="w-full h-full object-cover"
                        />
                        {/* Improved Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    </div>

                    {/* Banner Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 text-white">
                        <div className="max-w-4xl">
                            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-playfair font-bold mb-3 animate-fade-in text-shadow-sm leading-tight">
                                {currentBanner.title}
                            </h2>
                            {currentBanner.description && (
                                <p className="text-base sm:text-lg md:text-xl text-white/95 max-w-2xl animate-slide-up font-light leading-relaxed">
                                    {currentBanner.description}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Navigation Arrows (only show if multiple banners) */}
                    {banners.length > 1 && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md transition-all duration-200 border border-white/10 group group-hover:opacity-100 opacity-0 sm:opacity-100"
                                aria-label="Previous banner"
                            >
                                <ChevronLeft className="h-6 w-6" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); goToNext(); }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md transition-all duration-200 border border-white/10 group group-hover:opacity-100 opacity-0 sm:opacity-100"
                                aria-label="Next banner"
                            >
                                <ChevronRight className="h-6 w-6" />
                            </button>
                        </>
                    )}

                    {/* Dots Navigation (only show if multiple banners) */}
                    {banners.length > 1 && (
                        <div className="absolute bottom-6 right-6 sm:bottom-8 sm:right-8 flex space-x-2">
                            {banners.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={(e) => { e.stopPropagation(); goToSlide(index); }}
                                    className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${index === currentIndex
                                            ? 'bg-white w-8 sm:w-10'
                                            : 'bg-white/40 hover:bg-white/60 w-4 sm:w-6'
                                        }`}
                                    aria-label={`Go to banner ${index + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default BannerCarousel;
