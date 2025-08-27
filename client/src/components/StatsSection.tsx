import React from 'react';
import { useQuery } from 'react-query';
import { getPublicStats } from '../utils/api';

export default function StatsSection() {
  const { data: stats, isLoading } = useQuery('publicStats', getPublicStats, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });

  if (isLoading) {
    return (
      <section className="section-padding bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              <span className="text-4xl mr-3">📊</span>
              Statistiken
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 stagger-children">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="stats-card">
                <div className="h-10 bg-gray-300 rounded animate-pulse mb-4"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!stats) return null;

  const statItems = [
    {
      value: stats.totalIssues,
      label: 'Eingereichte Meldungen',
      emoji: '📝',
      color: 'text-blue-600',
    },
    {
      value: stats.resolvedIssues,
      label: 'Gelöste Probleme',
      emoji: '✅',
      color: 'text-green-600',
    },
    {
      value: `${stats.successRate}%`,
      label: 'Erfolgsquote',
      emoji: '🎯',
      color: 'text-purple-600',
    },
    {
      value: stats.totalVotes,
      label: 'Unterstützerstimmen',
      emoji: '👍',
      color: 'text-orange-600',
    },
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            <span className="text-4xl mr-3">📊</span>
            Unsere Erfolge im Überblick
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Gemeinsam haben wir schon viel erreicht. Diese Zahlen zeigen unseren Fortschritt im Kampf gegen die Bürokratie.
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 stagger-children">
          {statItems.map((item, index) => (
            <div key={index} className="stats-card fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="text-3xl mb-3">{item.emoji}</div>
              <div className="stats-number">
                {typeof item.value === 'number' ? item.value.toLocaleString('de-DE') : item.value}
              </div>
              <div className="stats-label">
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* Additional insights */}
        {stats.topCategories && stats.topCategories.length > 0 && (
          <div className="mt-16">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Die häufigsten Problembereiche
              </h3>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {stats.topCategories.slice(0, 3).map((category, index) => (
                <div key={category.category} className="card card-body text-center">
                  <div className="text-2xl mb-3">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {getCategoryName(category.category)}
                  </h4>
                  <p className="text-gray-600">
                    {category.count} {category.count === 1 ? 'Meldung' : 'Meldungen'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function getCategoryName(category: string) {
  const nameMap: { [key: string]: string } = {
    buergeramt: 'Bürgeramt',
    bauwesen: 'Bauwesen',
    steuern: 'Steuern',
    gesundheit: 'Gesundheit',
    bildung: 'Bildung',
    verkehr: 'Verkehr',
    soziales: 'Soziales',
    umwelt: 'Umwelt',
    gewerbe: 'Gewerbe',
    sonstiges: 'Sonstiges',
  };
  return nameMap[category] || category;
} 