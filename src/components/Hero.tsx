import React from 'react';
import { useCategories } from '../hooks/useCategories';

const Hero: React.FC = () => {
  const { categories } = useCategories();
  const firstCategoryId = categories[0]?.id || 'menu';

  return (
    <section className="relative bg-gradient-to-br from-beige-100 to-cream-100 py-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-playfair font-semibold text-black mb-6 animate-fade-in">
          Welcome to
          <span className="block text-cream-600 mt-2">Beracah Cafe</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto animate-slide-up">
          Where every cup tells a story. Experience our carefully crafted beverages 
          and fresh pastries in a warm, inviting atmosphere.
        </p>
        <div className="flex justify-center">
          <a 
            href={`#${firstCategoryId}`}
            className="bg-black text-white px-8 py-3 rounded-full hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 font-medium"
          >
            Explore Menu
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;