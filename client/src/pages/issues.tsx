import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQuery, useQueryClient } from 'react-query';
import { 
  getIssues, 
  getCategories, 
  voteForIssue, 
  removeVote, 
  checkAdminStatus,
  approveIssue,
  rejectIssue,
  updateIssueStatus,
  reactivateIssue,
  deleteIssue
} from '../utils/api';
import type { Issue } from '../utils/api';
import toast, { Toaster } from 'react-hot-toast';
import Footer from '../components/Footer';
import Header from '../components/Header';

interface FiltersState {
  category: string;
  status: string;
  search: string;
  location: string;
  sort: string;
  order: 'ASC' | 'DESC';
}

interface VoteStatus {
  [issueId: number]: {
    hasVoted: boolean;
    voteCount: number;
  };
}

// Helper function to safely extract error information
const getErrorInfo = (error: unknown) => {
  if (error instanceof Error) {
    return {
      message: error.message,
      status: (error as any)?.response?.status,
      serverError: (error as any)?.response?.data?.error
    };
  }
  
  const anyError = error as any;
  return {
    message: anyError?.message || 'Unbekannter Fehler',
    status: anyError?.response?.status,
    serverError: anyError?.response?.data?.error
  };
};

export default function IssuesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FiltersState>({
    category: '',
    status: '',
    search: '',
    location: '',
    sort: 'created_at',
    order: 'DESC'
  });
  const [voteStatuses, setVoteStatuses] = useState<VoteStatus>({});
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check admin status on page load
  useEffect(() => {
    const checkAdmin = async () => {
      const { isAdmin, user } = await checkAdminStatus();
      setIsAdmin(isAdmin);
      setAdminUser(user);
    };
    checkAdmin();
  }, []);

  // Handle URL parameters for filter presets (z.B. von Dashboard-Links)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const presetFilters: Partial<FiltersState> = {};
    
    if (urlParams.get('status')) presetFilters.status = urlParams.get('status')!;
    if (urlParams.get('category')) presetFilters.category = urlParams.get('category')!;
    
    if (Object.keys(presetFilters).length > 0) {
      setFilters(prev => ({ ...prev, ...presetFilters }));
    }
  }, [router.query]);

  // Fetch categories for filter dropdown
  const { data: categoriesData } = useQuery('categories', getCategories);

  // Fetch issues with current filters and pagination
  const { data: issuesData, isLoading, error, refetch } = useQuery(
    ['issues', currentPage, filters, isAdmin],
    () => {
      const params: any = {
        page: currentPage,
        limit: 12,
        category: filters.category,
        status: filters.status,
        search: filters.search,
        sort: filters.sort,
        order: filters.order
      };
      
      // Für Admins: Verwende den Admin-Endpoint mit approved='all'
      if (isAdmin) {
        params.approved = 'all';
      }
      
      return getIssues(params);
    },
    {
      keepPreviousData: true,
      enabled: true // Query läuft immer, auch wenn isAdmin noch false ist
    }
  );

  // Initialize vote statuses from issue data (no more separate API calls needed!)
  useEffect(() => {
    if (issuesData?.issues) {
      const newStatuses: VoteStatus = {};
      
      issuesData.issues.forEach((issue: Issue) => {
        newStatuses[issue.id] = {
          hasVoted: issue.has_voted || false,
          voteCount: issue.vote_count || 0
        };
      });
      
      setVoteStatuses(newStatuses);
    }
  }, [issuesData?.issues]);

  const handleFilterChange = (filterName: keyof FiltersState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleSortChange = (sortValue: string) => {
    const lastUnderscoreIndex = sortValue.lastIndexOf('_');
    const sort = sortValue.substring(0, lastUnderscoreIndex);
    const order = sortValue.substring(lastUnderscoreIndex + 1);
    setFilters(prev => ({
      ...prev,
      sort,
      order: order as 'ASC' | 'DESC'
    }));
    setCurrentPage(1); // Reset to first page when sorting
  };

  const handleVote = async (issueId: number) => {
    try {
      const currentStatus = voteStatuses[issueId];
      let result;
      
      if (currentStatus?.hasVoted) {
        result = await removeVote(issueId);
        toast.success('Stimme entfernt');
      } else {
        try {
          result = await voteForIssue(issueId);
          toast.success('Stimme abgegeben!');
        } catch (voteError: any) {
          // Falls der Vote fehlschlägt (z.B. bereits gevotet), versuche ihn zu entfernen
          if (voteError?.response?.status === 400) {
            console.log('Vote bereits vorhanden, entferne stattdessen...');
            result = await removeVote(issueId);
            toast.success('Stimme entfernt');
          } else {
            throw voteError;
          }
        }
      }
      
      // Lokalen Vote-Status aktualisieren ohne die Liste neu zu laden
      setVoteStatuses(prev => ({
        ...prev,
        [issueId]: {
          hasVoted: !currentStatus?.hasVoted,
          voteCount: result.voteCount
        }
      }));
      
      // Nur bei Sortierung nach Vote-Count die Liste neu laden
      if (filters.sort === 'vote_count') {
        await refetch();
      }
    } catch (error: any) {
      console.error('Vote error:', error);
      toast.error('Fehler beim Abstimmen');
    }
  };

  // Admin-Aktions-Handler
  const handleApprove = async (issueId: number) => {
    try {
      await approveIssue(issueId, 'Genehmigt durch Admin');
      toast.success('Meldung genehmigt!');
      // Nur refetch verwenden, um doppelte Requests zu vermeiden
      refetch();
    } catch (error) {
      toast.error('Fehler beim Genehmigen');
    }
  };

  const handleReject = async (issueId: number) => {
    try {
      await rejectIssue(issueId, 'Abgelehnt durch Admin');
      toast.success('Meldung abgelehnt');
      // Nur refetch verwenden, um doppelte Requests zu vermeiden
      refetch();
    } catch (error) {
      toast.error('Fehler beim Ablehnen');
    }
  };

  const handleStatusChange = async (issueId: number, newStatus: string) => {
    try {
      await updateIssueStatus(issueId, newStatus);
      toast.success('Status aktualisiert');
      // Nur refetch verwenden, um doppelte Requests zu vermeiden
      refetch();
    } catch (error) {
      toast.error('Fehler beim Aktualisieren des Status');
    }
  };

  const handleReactivate = async (issueId: number) => {
    try {
      await reactivateIssue(issueId);
      toast.success('Meldung reaktiviert');
      // Nur refetch verwenden, um doppelte Requests zu vermeiden
      refetch();
    } catch (error) {
      toast.error('Fehler beim Reaktivieren');
    }
  };

  const handleDelete = async (issueId: number) => {
    if (!confirm('Sind Sie sicher, dass Sie diese Meldung löschen möchten?')) {
      return;
    }
    try {
      await deleteIssue(issueId, 'Gelöscht durch Admin');
      toast.success('Meldung gelöscht');
      // Nur refetch verwenden, um doppelte Requests zu vermeiden
      refetch();
    } catch (error) {
      toast.error('Fehler beim Löschen');
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
      case 'pending_approval':
        return '#F59E0B';
      case 'submitted':
        return '#6B7280';
      case 'in_progress':
        return '#F59E0B';
      case 'resolved':
        return '#10B981';
      case 'rejected':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return 'Warten auf Genehmigung';
      case 'submitted':
        return 'Eingereicht';
      case 'in_progress':
        return 'In Bearbeitung';
      case 'resolved':
        return 'Gelöst';
      case 'rejected':
        return 'Abgelehnt';
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
                  <label className="filter-label">Ort</label>
                  <input
                    type="text"
                    placeholder="Nach Ort filtern..."
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className="filter-input"
                  />
                </div>

                <div className="filter-group">
                  <label className="filter-label">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="filter-select"
                  >
                    <option value="">Alle Status</option>
                    {isAdmin && <option value="pending_approval">Warten auf Genehmigung</option>}
                    <option value="submitted">Eingereicht</option>
                    <option value="in_progress">In Bearbeitung</option>
                    <option value="resolved">Gelöst</option>
                    {isAdmin && <option value="rejected">Abgelehnt</option>}
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">Sortieren</label>
                  <select
                    value={`${filters.sort}_${filters.order}`}
                    onChange={(e) => handleSortChange(e.target.value)}
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
                <h3>🚨 Fehler beim Laden der Meldungen</h3>
                <div className="error-details">
                  {(() => {
                    const errorInfo = getErrorInfo(error);
                    return (
                      <>
                        <p><strong>Fehlermeldung:</strong> {errorInfo.message}</p>
                        {errorInfo.status && (
                          <p><strong>Status-Code:</strong> {errorInfo.status}</p>
                        )}
                        {errorInfo.serverError && (
                          <p><strong>Server-Fehler:</strong> {errorInfo.serverError}</p>
                        )}
                      </>
                    );
                  })()}
                </div>
                <div className="error-actions">
                  <button onClick={() => refetch()} className="btn btn-secondary">
                    🔄 Erneut versuchen
                  </button>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="btn btn-outline"
                  >
                    🔃 Seite neu laden
                  </button>
                </div>
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
                  {issuesData?.issues.map((issue: Issue) => {
                    return (
                      <div 
                        key={issue.id} 
                        className={`issue-card ${issue.status === 'pending_approval' ? 'pending-approval' : ''}`}
                      >
                        {/* Moderne Status-Leiste */}
                        <div 
                          className="issue-status-bar"
                          style={{ 
                            background: `linear-gradient(135deg, ${getStatusColor(issue.status)} 0%, ${getStatusColor(issue.status)}90 100%)`
                          }}
                        ></div>
                        
                        {/* Status-Text in eigener Zeile */}
                        <div 
                          className="issue-status-text"
                          style={{ 
                            color: getStatusColor(issue.status)
                          }}
                        >
                          {getStatusText(issue.status)}
                        </div>
                        
                        <Link href={`/issue/${issue.id}`} className="issue-title-link">
                          <h3 className="issue-title">
                              {issue.title}
                          </h3>
                          
                          {/* Badges unter dem Titel */}
                          <div className="issue-badges small">
                            {issue.location && (
                              <span className="badge badge-location">
                                📍 {issue.location}
                              </span>
                            )}
                            <span className="badge badge-category">
                              {getCategoryLabel(issue.category)}
                            </span>
                          </div>
                          
                          <p className="issue-description">
                            {issue.description.length > 200 
                              ? `${issue.description.substring(0, 200)}...` 
                              : issue.description
                            }
                          </p>
                        </Link>
                        
                        {isAdmin && !issue.is_anonymous && issue.submitter_name && issue.submitter_name.trim() && (
                          <div className="submitter-info">
                            <p>
                              <strong>Eingereicht von:</strong> {issue.submitter_name}
                              {issue.submitter_email && ` (${issue.submitter_email})`}
                            </p>
                          </div>
                        )}
                        
                        <div className="horizontal-line thin"></div>
                        
                        <div className="issue-stats">
                          {issue.status !== 'pending_approval' && issue.status !== 'rejected' && (
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
                          )}
                          {(issue.status === 'pending_approval' || issue.status === 'rejected') && (
                            <div className="vote-display">
                              <span className="vote-icon">👍</span>
                              <span className="vote-count">
                                {voteStatuses[issue.id]?.voteCount || issue.vote_count || 0} Stimmen
                              </span>
                            </div>
                          )}
                          <div className="issue-date">
                            {new Date(issue.created_at).toLocaleDateString('de-DE')}
                          </div>
                        </div>

                        {/* Admin-Aktionsknöpfe */}
                        {isAdmin && (
                          <>
                            <div className="horizontal-line thin"></div>
                            <div className="admin-actions">
                            {issue.status === 'pending_approval' && (
                              <>
                                <button
                                  onClick={() => handleApprove(issue.id)}
                                  className="admin-btn approve-btn"
                                >
                                  ✅ Genehmigen
                                </button>
                                <button
                                  onClick={() => handleReject(issue.id)}
                                  className="admin-btn reject-btn"
                                >
                                  ❌ Ablehnen
                                </button>
                              </>
                            )}
                            
                            {(issue.status === 'submitted' || issue.status === 'in_progress' || issue.status === 'resolved') && (
                              <>
                                {issue.status !== 'in_progress' && (
                                  <button
                                    onClick={() => handleStatusChange(issue.id, 'in_progress')}
                                    className="admin-btn status-btn"
                                  >
                                    🔄 In Bearbeitung
                                  </button>
                                )}
                                {issue.status !== 'resolved' && (
                                  <button
                                    onClick={() => handleStatusChange(issue.id, 'resolved')}
                                    className="admin-btn status-btn"
                                  >
                                    ✅ Als gelöst markieren
                                  </button>
                                )}
                                <button
                                  onClick={() => handleReject(issue.id)}
                                  className="admin-btn reject-btn"
                                >
                                  ❌ Ablehnen
                                </button>
                              </>
                            )}
                            
                            {issue.status === 'rejected' && (
                              <>
                                <button
                                  onClick={() => handleReactivate(issue.id)}
                                  className="admin-btn reactivate-btn"
                                >
                                  🔄 Reaktivieren
                                </button>
                                <button
                                  onClick={() => handleDelete(issue.id)}
                                  className="admin-btn delete-btn"
                                >
                                  🗑️ Löschen
                                </button>
                              </>
                            )}
                          </div>
                          </>
                        )}
                      </div>
                    );
                  })}
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

        .vote-display {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 600;
          color: #6b7280;
          cursor: not-allowed;
        }

        .issue-title-link {
          color: inherit;
        }

        .issue-status-header {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 15px;
        }

        .approval-status {
          font-size: 0.75rem;
          padding: 2px 8px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(4px);
          text-align: center;
        }

        .submitter-info {
          margin: 10px 0;
          padding: 8px;
          background: #f9fafb;
          border-radius: 6px;
          font-size: 0.875rem;
          color: #4b5563;
        }

        .submitter-info p {
          margin: 0;
        }

        .admin-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .admin-btn {
          padding: 6px 12px;
          border: none;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .admin-btn.approve-btn {
          background: #10B981;
          color: white;
        }

        .admin-btn.approve-btn:hover {
          background: #059669;
        }

        .admin-btn.reject-btn {
          background: #EF4444;
          color: white;
        }

        .admin-btn.reject-btn:hover {
          background: #DC2626;
        }

        .admin-btn.status-btn {
          background: #3B82F6;
          color: white;
        }

        .admin-btn.status-btn:hover {
          background: #2563EB;
        }

        .admin-btn.reactivate-btn {
          background: var(--fdp-yellow);
          color: var(--fdp-black);
        }

        .admin-btn.reactivate-btn:hover {
          background: var(--fdp-magenta);
          color: white;
        }

        .admin-btn.delete-btn {
          background: #EF4444;
          color: white;
        }

        .admin-btn.delete-btn:hover {
          background: #DC2626;
        }

        .issue-card.pending-approval {
          background: #fff7b2;
          border: 2px solid #fbbf24;
          box-shadow: 0 2px 8px rgba(251, 191, 36, 0.15);
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
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 12px;
          margin: 20px 0;
        }

        .error-container h3 {
          margin-bottom: 20px;
          font-size: 1.5rem;
          color: #dc2626;
        }

        .error-details {
          background: white;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          text-align: left;
          border: 1px solid #f3f4f6;
        }

        .error-details p {
          margin: 10px 0;
          color: #374151;
        }

        .error-details strong {
          color: #1f2937;
        }

        .error-actions {
          display: flex;
          gap: 15px;
          justify-content: center;
          flex-wrap: wrap;
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