import React from 'react';
import { useCategories } from '../hooks/useCategories';

const Hero: React.FC = () => {
  const { categories } = useCategories();
  const firstCategoryId = categories[0]?.id || 'menu';

  return (
    <section className="relative min-h-[50vh] lg:min-h-[85vh] flex items-center bg-[#faf9f6] overflow-hidden">
      {/* Background atmospheric layer */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-beige-100/30 -skew-x-12 transform translate-x-24" />
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center relative z-10 py-16">
        {/* Text Content */}
        <div className="lg:col-span-6 flex flex-col items-start space-y-8 lg:space-y-10">
          <div className="space-y-4">
            <p className="text-espresso-500 uppercase tracking-[0.3em] text-xs font-semibold font-body">
              The Artisanal Choice
            </p>
            <h1 className="text-5xl md:text-7xl lg:text-8xl leading-[1.1] text-[#26170c] font-headline font-normal tracking-tight">
              Elevated Coffee, <br />
              <span className="italic">Simply Poured</span>
            </h1>
          </div>

          <p className="text-[#4f453f] font-body text-lg md:text-xl max-w-md leading-relaxed opacity-80">
            A curated selection of single-origin beans, roasted with technical
            precision and delivered with quiet intentionality.
          </p>

          <div className="pt-2">
            <a
              href={`#${firstCategoryId}`}
              className="bg-[#26170c] text-white px-10 py-4 rounded-full font-body font-medium tracking-wide transition-all duration-300 hover:bg-[#26170c]/90 active:scale-[0.98] active:opacity-80"
            >
              Explore Menu
            </a>
          </div>
        </div>

        {/* Asymmetric Image Container — hidden on mobile */}
        <div className="lg:col-span-6 relative hidden lg:flex justify-end">
          <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-lg aspect-[4/5] overflow-hidden rounded-lg shadow-2xl shadow-[#26170c]/5 bg-beige-200">
            <img
              alt="Premium artisanal coffee"
              className="w-full h-full object-cover grayscale-[20%] contrast-[1.05]"
              src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80&auto=format&fit=crop"
            />
            {/* Overlapping logo element */}
            <div className="absolute -bottom-4 -left-4 w-28 h-28 md:w-32 md:h-32 bg-[#faf9f6] p-5 md:p-6 rounded-sm shadow-xl hidden md:flex items-center justify-center">
              <img
                alt="Don Macchiatos logo"
                className="w-14 md:w-16 h-auto opacity-20"
                src="/logo.png"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
