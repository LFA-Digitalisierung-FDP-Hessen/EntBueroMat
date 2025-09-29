import React from 'react';
import Link from 'next/link';
import { useQuery } from 'react-query';
import { getRecentResolved } from '../utils/api';

export default function ResolvedIssues() {
  const { data, isLoading } = useQuery('recentResolved', () => getRecentResolved(6), {
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });

  if (isLoading) {
    return (
      <div className="stagger-children">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card card-body">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-300 rounded mb-3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data?.issues?.length) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-6">📭</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Noch nichts gelöst
          </h3>
          <p className="text-gray-600 mb-6">
            Aber wir arbeiten dran! Bald werden hier die ersten Erfolgsgeschichten stehen.
          </p>
          <button
            onClick={() => {
              const submitButton = document.querySelector('[data-submit-form]') as HTMLElement;
              submitButton?.click();
            }}
            className="btn btn-primary"
          >
            <span className="text-lg mr-2">🚀</span>
            Problem melden
          </button>
        </div>
      </div>
    );
  }

  const getCategoryName = (category: string) => {
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
  };

  const getCategoryEmoji = (category: string) => {
    const emojiMap: { [key: string]: string } = {
      buergeramt: '🏛️',
      bauwesen: '🏗️',
      steuern: '💰',
      gesundheit: '🏥',
      bildung: '📚',
      verkehr: '🚗',
      soziales: '👥',
      umwelt: '🌱',
      gewerbe: '🏪',
      sonstiges: '📋',
    };
    return emojiMap[category] || '📋';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
        {data.issues.map((issue, index) => (
          <div 
            key={issue.id} 
            className="card card-body hover:shadow-xl transition-all duration-300 border-l-4 border-green-500 fade-in-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">✅</span>
                <div className="flex flex-col">
                  <span className="badge badge-resolved text-xs">
                    Gelöst
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <span>{getCategoryEmoji(issue.category)}</span>
                <span>{getCategoryName(issue.category)}</span>
              </div>
            </div>
            
            {/* Title */}
            <h3 className="text-lg font-semibold text-gray-900 mb-3 leading-tight">
              <Link href={`/issue/${issue.id}`} className="text-gray-900 hover:text-purple-600 transition-colors duration-300 no-underline hover:underline">
                {issue.title}
              </Link>
            </h3>
            
            {/* Description */}
            <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-3">
              {issue.description.length > 120 
                ? `${issue.description.substring(0, 120)}...`
                : issue.description
              }
            </p>
            
            {/* Metadata */}
            <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center">
                  <span className="mr-1">👍</span>
                  <span>{issue.vote_count}</span>
                </div>
                {issue.location && (
                  <div className="flex items-center">
                    <span className="mr-1">📍</span>
                    <span className="truncate max-w-20">{issue.location}</span>
                  </div>
                )}
              </div>
              <span>
                Gelöst: {formatDate(issue.resolved_at || issue.created_at)}
              </span>
            </div>
            
            {/* Success Badge */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <div className="text-green-600 font-semibold text-sm mb-1">
                🎉 Problem erfolgreich gelöst!
              </div>
              <div className="text-xs text-green-700">
                Gemeinsam haben wir Veränderung bewirkt
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Call to Action */}
      <div className="text-center pt-8">
        <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-8 border-2 border-green-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ihr Problem noch nicht dabei?
          </h3>
          <p className="text-gray-600 mb-6">
            Melden Sie Ihr Bürokratieproblem und werden Sie Teil unserer Erfolgsgeschichte!
          </p>
          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="btn btn-primary btn-lg"
          >
            <span className="text-xl mr-2">📝</span>
            Problem melden
          </button>
        </div>
      </div>
    </div>
  );
} 