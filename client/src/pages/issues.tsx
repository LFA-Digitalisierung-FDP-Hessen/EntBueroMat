import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useQuery } from 'react-query';
import { getIssues, getCategories, voteForIssue, removeVote, getVoteStatus } from '../utils/api';
import type { Issue } from '../utils/api';
import toast, { Toaster } from 'react-hot-toast';
import Footer from '../components/Footer';
import Header from '../components/Header';

interface FiltersState {
  category: string;
  status: string;
  search: string;
  sort: string;
  order: 'ASC' | 'DESC';
}

interface VoteStatus {
  [issueId: number]: {
    hasVoted: boolean;
    voteCount: number;
  };
}

export default function IssuesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FiltersState>({
    category: '',
    status: '',
    search: '',
    sort: 'created_at',
    order: 'DESC'
  });
  const [voteStatuses, setVoteStatuses] = useState<VoteStatus>({});
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Fetch categories for filter dropdown
  const { data: categoriesData } = useQuery('categories', getCategories);

  // Fetch issues with current filters and pagination
  const { data: issuesData, isLoading, error, refetch } = useQuery(
    ['issues', currentPage, filters],
    () => getIssues({
      page: currentPage,
      limit: 12,
      ...filters
    }),
    {
      keepPreviousData: true
    }
  );

  // Load vote statuses for visible issues with delay to prevent rate limiting
  useEffect(() => {
    if (issuesData?.issues) {
      const loadVoteStatuses = async () => {
        const newStatuses: VoteStatus = {};
        
        // Load statuses with 150ms delay between calls to prevent rate limiting
        for (let i = 0; i < issuesData.issues.length; i++) {
          const issue = issuesData.issues[i];
          try {
            // Add delay between requests
            if (i > 0) {
              await new Promise(resolve => setTimeout(resolve, 150));
            }
            const status = await getVoteStatus(issue.id);
            newStatuses[issue.id] = status;
          } catch (error) {
            console.warn(`Failed to load vote status for issue ${issue.id}:`, error);
            // If vote status can't be loaded, set defaults
            newStatuses[issue.id] = {
              hasVoted: false,
              voteCount: issue.vote_count || 0
            };
          }
        }
        
        setVoteStatuses(newStatuses);
      };

      // Add delay before starting to load vote statuses
      const timeoutId = setTimeout(loadVoteStatuses, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [issuesData?.issues]);

  const handleFilterChange = (filterName: keyof FiltersState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleVote = async (issueId: number) => {
    try {
      const currentStatus = voteStatuses[issueId];
      
      if (currentStatus?.hasVoted) {
        const result = await removeVote(issueId);
        setVoteStatuses(prev => ({
          ...prev,
          [issueId]: {
            hasVoted: false,
            voteCount: result.voteCount
          }
        }));
        toast.success('Stimme entfernt');
      } else {
        const result = await voteForIssue(issueId);
        setVoteStatuses(prev => ({
          ...prev,
          [issueId]: {
            hasVoted: true,
            voteCount: result.voteCount
          }
        }));
        toast.success('Stimme abgegeben!');
      }
    } catch (error) {
      toast.error('Fehler beim Abstimmen');
    }
  };

  const getCategoryLabel = (category: string) => {
    const categoryMap: Record<string, string> = {
      'general': 'Allgemein',
      'construction': 'Bauwesen',
      'healthcare': 'Gesundheitswesen',
      'municipal': 'Kommunalverwaltung',
      'taxation': 'Steuerwesen',
      'education': 'Bildung',
      'environment': 'Umwelt',
      'transport': 'Verkehr',
      'business': 'Wirtschaft',
      'other': 'Sonstiges'
    };
    return categoryMap[category] || category;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return '#10B981';
      case 'in_progress':
        return '#F59E0B';
      case 'submitted':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'Gelöst';
      case 'in_progress':
        return 'In Bearbeitung';
      case 'submitted':
        return 'Eingereicht';
      default:
        return status;
    }
  };

  const getSortLabel = (sort: string) => {
    switch (sort) {
      case 'created_at':
        return 'Erstellungsdatum';
      case 'updated_at':
        return 'Aktualisierung';
      case 'vote_count':
        return 'Stimmen';
      case 'title':
        return 'Titel';
      default:
        return sort;
    }
  };

  return (
    <>
      <Head>
        <title>Alle Meldungen - EntBüro-Mat</title>
        <meta name="description" content="Durchsuchen Sie alle Bürokratie-Meldungen mit praktischen Filtermöglichkeiten." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Header */}
      <Header />

      {/* Main Content */}
      <main>
        {/* Page Header */}
        <section className="section" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
          <div className="container">
            <h1 className="section-title">Alle Meldungen</h1>
            <p className="section-description">
              Durchsuchen Sie alle eingereichten Bürokratie-Probleme. 
              Nutzen Sie die Filter, um relevante Meldungen zu finden.
            </p>
          </div>
        </section>

        {/* Filters Section */}
        <section className="filters-section">
          <div className="container">
            <div className="filters-container">
              {/* Mobile Filter Toggle */}
              <div className="mobile-filter-header">
                <button 
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                  className="mobile-filter-toggle"
                >
                  <span>🔍 Filter & Sortierung</span>
                  <span className={`toggle-icon ${showMobileFilters ? 'open' : ''}`}>
                    ▼
                  </span>
                </button>
              </div>

              <div className={`filters-row ${showMobileFilters ? 'mobile-visible' : ''}`}>
                <div className="filter-group">
                  <label className="filter-label">Suche</label>
                  <input
                    type="text"
                    placeholder="Suche nach Titel oder Beschreibung..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="filter-input"
                  />
                </div>

                <div className="filter-group">
                  <label className="filter-label">Kategorie</label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="filter-select"
                  >
                    <option value="">Alle Kategorien</option>
                    {categoriesData?.categories?.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="filter-select"
                  >
                    <option value="">Alle Status</option>
                    <option value="submitted">Eingereicht</option>
                    <option value="in_progress">In Bearbeitung</option>
                    <option value="resolved">Gelöst</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">Sortieren</label>
                  <select
                    value={`${filters.sort}_${filters.order}`}
                    onChange={(e) => {
                      const [sort, order] = e.target.value.split('_');
                      handleFilterChange('sort', sort);
                      handleFilterChange('order', order);
                    }}
                    className="filter-select"
                  >
                    <option value="created_at_DESC">Neueste zuerst</option>
                    <option value="created_at_ASC">Älteste zuerst</option>
                    <option value="vote_count_DESC">Meiste Stimmen</option>
                    <option value="vote_count_ASC">Wenigste Stimmen</option>
                    <option value="updated_at_DESC">Zuletzt aktualisiert</option>
                    <option value="title_ASC">Titel A-Z</option>
                    <option value="title_DESC">Titel Z-A</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Results Section */}
        <section className="results-section">
          <div className="container">
            {isLoading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Meldungen werden geladen...</p>
              </div>
            ) : error ? (
              <div className="error-container">
                <p>Fehler beim Laden der Meldungen. Bitte versuchen Sie es erneut.</p>
                <button onClick={() => refetch()} className="btn btn-secondary">
                  Erneut versuchen
                </button>
              </div>
            ) : issuesData?.issues?.length === 0 ? (
              <div className="no-issues">
                <p>Keine Meldungen gefunden. Versuchen Sie andere Filtereinstellungen.</p>
              </div>
            ) : (
              <>
                {/* Results Info */}
                <div className="results-info">
                  <p>
                    {issuesData?.pagination.total || 0} Meldungen gefunden
                    {filters.search && ` für "${filters.search}"`}
                    {filters.category && ` in ${getCategoryLabel(filters.category)}`}
                    {filters.status && ` mit Status "${getStatusText(filters.status)}"`}
                  </p>
                </div>

                {/* Issues Grid */}
                <div className="issues-grid">
                  {issuesData?.issues.map((issue: Issue) => (
                    <div key={issue.id} className="issue-card">
                      <div className="issue-header">
                        <div className="issue-meta">
                          <span className="issue-category">
                            {getCategoryLabel(issue.category)}
                          </span>
                          {issue.location && (
                            <span className="issue-location">📍 {issue.location}</span>
                          )}
                        </div>
                        <div 
                          className="issue-status"
                          style={{ 
                            color: getStatusColor(issue.status),
                            fontWeight: 'bold'
                          }}
                        >
                          {getStatusText(issue.status)}
                        </div>
                      </div>
                      
                      <h3 className="issue-title">{issue.title}</h3>
                      <p className="issue-description">
                        {issue.description.length > 200 
                          ? `${issue.description.substring(0, 200)}...` 
                          : issue.description
                        }
                      </p>
                      
                      <div className="issue-stats">
                        <button
                          onClick={() => handleVote(issue.id)}
                          className={`vote-button ${voteStatuses[issue.id]?.hasVoted ? 'voted' : ''}`}
                        >
                          <span className="vote-icon">
                            {voteStatuses[issue.id]?.hasVoted ? '👍' : '👍'}
                          </span>
                          <span className="vote-count">
                            {voteStatuses[issue.id]?.voteCount || issue.vote_count || 0} Stimmen
                          </span>
                        </button>
                        <div className="issue-date">
                          {new Date(issue.created_at).toLocaleDateString('de-DE')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {issuesData?.pagination && issuesData.pagination.totalPages > 1 && (
                  <div className="pagination">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={!issuesData.pagination.hasPrev}
                      className="pagination-btn"
                    >
                      ← Vorherige
                    </button>
                    
                    <div className="pagination-info">
                      Seite {issuesData.pagination.page} von {issuesData.pagination.totalPages}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      disabled={!issuesData.pagination.hasNext}
                      className="pagination-btn"
                    >
                      Nächste →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />

      <Toaster position="top-right" />
      
      <style jsx>{`
        .filters-section {
          background: #f9fafb;
          padding: 40px 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .filters-container {
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .filters-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 20px;
          align-items: end;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
        }

        .filter-label {
          font-family: "field-gothic-no-75-bold-wide", "Inter", sans-serif;
          font-weight: 700;
          margin-bottom: 8px;
          color: var(--fdp-black);
          font-size: 12px;
        }

        .filter-input,
        .filter-select {
          padding: 12px;
          border: 2px solid #e5e7eb;
          border-radius: 6px;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          background: white;
          transition: border-color 0.3s ease;
        }

        .filter-input:focus,
        .filter-select:focus {
          outline: none;
          border-color: var(--fdp-magenta);
        }

        .results-section {
          padding: 40px 0;
        }

        .results-info {
          margin-bottom: 30px;
          padding: 20px;
          background: #f9fafb;
          border-radius: 8px;
          border-left: 4px solid var(--fdp-yellow);
        }

        .results-info p {
          margin: 0;
          color: #374151;
          font-weight: 500;
        }

        .issues-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 30px;
          margin-bottom: 40px;
        }

        .vote-button {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          padding: 8px 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 14px;
          font-weight: 600;
        }

        .vote-button:hover {
          background: var(--fdp-yellow);
          border-color: var(--fdp-magenta);
        }

        .vote-button.voted {
          background: var(--fdp-yellow);
          border-color: var(--fdp-magenta);
          color: var(--fdp-black);
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 20px;
          margin-top: 40px;
        }

        .pagination-btn {
          background: var(--fdp-magenta);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: background-color 0.3s ease;
        }

        .pagination-btn:hover:not(:disabled) {
          background: var(--fdp-yellow);
          color: var(--fdp-black);
        }

        .pagination-btn:disabled {
          background: #d1d5db;
          cursor: not-allowed;
        }

        .pagination-info {
          font-weight: 600;
          color: #374151;
        }

        .error-container {
          text-align: center;
          padding: 60px 20px;
          color: #dc2626;
        }

        @media (max-width: 1024px) {
          .filters-row {
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }
          
          .issues-grid {
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
          }
        }

        .mobile-filter-header {
          display: none;
        }

        @media (max-width: 768px) {
          .filters-section {
            padding: 20px 0;
          }

          .filters-container {
            padding: 20px;
          }

          .mobile-filter-header {
            display: block;
            margin-bottom: 15px;
          }

          .mobile-filter-toggle {
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            background: var(--fdp-yellow);
            border: 2px solid var(--fdp-magenta);
            border-radius: 8px;
            font-family: "field-gothic-no-75-bold-wide", "Inter", sans-serif;
            font-weight: 700;
            color: var(--fdp-black);
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .mobile-filter-toggle:hover {
            background: var(--fdp-magenta);
            color: var(--fdp-white);
          }

          .toggle-icon {
            transition: transform 0.3s ease;
            font-size: 12px;
          }

          .toggle-icon.open {
            transform: rotate(180deg);
          }

          .filters-row {
            display: none;
            grid-template-columns: 1fr;
            gap: 15px;
            margin-top: 15px;
          }

          .filters-row.mobile-visible {
            display: grid;
            animation: slideDown 0.3s ease;
          }

          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .issues-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          
          .pagination {
            flex-direction: column;
            gap: 15px;
          }

          .results-info {
            padding: 15px;
            font-size: 14px;
          }
        }

        @media (min-width: 769px) {
          .filters-row {
            display: grid !important;
          }
        }
      `}</style>
    </>
  );
} 