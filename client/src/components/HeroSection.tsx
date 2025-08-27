import React from 'react';
import { useTranslation } from 'next-i18next';

interface HeroSectionProps {
  onSubmitClick: () => void;
}

export default function HeroSection({ onSubmitClick }: HeroSectionProps) {
  const { t } = useTranslation('common');

  return (
    <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16 md:py-24">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            {t('title')}
          </h1>
          <p className="text-xl md:text-2xl mb-4 text-blue-100">
            {t('subtitle')}
          </p>
          <p className="text-lg md:text-xl mb-8 text-blue-200">
            {t('tagline')}
          </p>
          
          <button
            onClick={onSubmitClick}
            className="bg-white text-blue-600 font-semibold px-8 py-4 rounded-lg text-lg hover:bg-gray-50 transition-colors shadow-lg"
          >
            {t('navigation.submit')}
          </button>
          
          <p className="text-sm text-blue-200 mt-4">
            {t('form.hint')}
          </p>
        </div>
      </div>
    </section>
  );
} 