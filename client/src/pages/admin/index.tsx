import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { getAdminStats, getIssues } from '../../utils/api';
import toast, { Toaster } from 'react-hot-toast';

interface AdminStats {
  totalIssues: number;
  pendingApproval: number;
  approvedIssues: number;
  resolvedIssues: number;
  totalVotes: number;
  recentIssues: number;
  issuesByCategory: Array<{ category: string; count: number }>;
  issuesByStatus: Array<{ status: string; count: number }>;
}

interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    // Verify token and get user info
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => res.json())
    .then(data => {
      if (data.user) {
        setCurrentUser(data.user);
      } else {
        localStorage.removeItem('auth_token');
        router.push('/admin/login');
      }
    })
    .catch(() => {
      localStorage.removeItem('auth_token');
      router.push('/admin/login');
    });
  }, [router]);

  // Fetch admin statistics
  const { data: stats, isLoading: statsLoading } = useQuery(
    'adminStats',
    getAdminStats,
    {
      enabled: !!currentUser,
      refetchInterval: 30000 // Refresh every 30 seconds
    }
  );

  // Fetch pending issues
  const { data: pendingIssuesData, isLoading: issuesLoading } = useQuery(
    ['adminIssues', 'pending'],
    () => fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/issues?approved=pending&limit=10`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    }).then(res => res.json()),
    {
      enabled: !!currentUser,
      refetchInterval: 10000 // Refresh every 10 seconds
    }
  );

  // Get the issues from the pendingIssuesData
  let pendingIssues: any[] = [];
  if (pendingIssuesData?.issues) {
    pendingIssues = pendingIssuesData.issues.filter((issue: any) => issue.status !== 'rejected');
  }

  // Fetch rejected issues
  const { data: rejectedIssuesData, isLoading: rejectedLoading } = useQuery(
    ['adminIssues', 'rejected'],
    () => fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/issues/rejected`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    }).then(res => res.json()),
    {
      enabled: !!currentUser,
      refetchInterval: 10000 // Refresh every 10 seconds
    }
  );

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    toast.success('Erfolgreich abgemeldet');
    router.push('/admin/login');
  };

  const handleApprove = async (issueId: number) => {
    const token = localStorage.getItem('auth_token');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/issues/admin/${issueId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes: 'Approved by admin' })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Approval result:', result);
        
        toast.success('Meldung genehmigt!');
        
        // Invalidate all related queries to force refresh
        queryClient.invalidateQueries(['adminIssues', 'pending']);
        queryClient.invalidateQueries('adminStats');
        queryClient.invalidateQueries('issues'); // Invalidate public issues list
        queryClient.invalidateQueries('topIssues'); // Invalidate popular issues
        queryClient.invalidateQueries('publicStats'); // Invalidate public stats
        
        // Also refetch immediately to ensure fresh data
        setTimeout(() => {
          queryClient.refetchQueries('issues');
          queryClient.refetchQueries('topIssues');
        }, 500); // Small delay to ensure backend has processed
        
        console.log('Invalidated all queries after approval');
      } else {
        const errorData = await response.json();
        console.error('Approve error:', errorData);
        toast.error('Fehler beim Genehmigen');
      }
    } catch (error) {
      console.error('Approve error:', error);
      toast.error('Fehler beim Genehmigen');
    }
  };

  const handleReject = async (issueId: number) => {
    const token = localStorage.getItem('auth_token');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/issues/admin/${issueId}/reject`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: 'Rejected by admin' })
      });

      if (response.ok) {
        toast.success('Meldung abgelehnt');
        queryClient.invalidateQueries(['adminIssues', 'pending']);
        queryClient.invalidateQueries('adminStats');
      } else {
        toast.error('Fehler beim Ablehnen');
      }
    } catch (error) {
      toast.error('Fehler beim Ablehnen');
    }
  };

  const handleReactivate = async (issueId: number) => {
    const token = localStorage.getItem('auth_token');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/issues/${issueId}/reactivate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: 'Reactivated by admin' })
      });

      if (response.ok) {
        toast.success('Meldung reaktiviert');
        queryClient.invalidateQueries(['adminIssues', 'rejected']);
        queryClient.invalidateQueries('adminStats');
      } else {
        toast.error('Fehler beim Reaktivieren');
      }
    } catch (error) {
      toast.error('Fehler beim Reaktivieren');
    }
  };

  const handleDelete = async (issueId: number) => {
    const token = localStorage.getItem('auth_token');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/issues/admin/${issueId}/delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: 'Deleted by admin' })
      });

      if (response.ok) {
        toast.success('Meldung gelöscht');
        queryClient.invalidateQueries(['adminIssues', 'rejected']);
        queryClient.invalidateQueries('adminStats');
      } else {
        toast.error('Fehler beim Löschen');
      }
    } catch (error) {
      toast.error('Fehler beim Löschen');
    }
  };

  const handleExport = async () => {
    const token = localStorage.getItem('auth_token');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/export`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'issues_export.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        toast.error('Fehler beim Exportieren');
      }
    } catch (error) {
      toast.error('Fehler beim Exportieren');
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries('adminIssues');
    queryClient.invalidateQueries('adminStats');
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

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'submitted': 'Eingereicht',
      'in_progress': 'In Bearbeitung',
      'resolved': 'Gelöst',
      'rejected': 'Abgelehnt'
    };
    return statusMap[status] || status;
  };

  // State for collapsed sections
  const [isRejectedCollapsed, setIsRejectedCollapsed] = useState(true);

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard - EntBüro-Mat</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="admin-dashboard">
        {/* Header */}
        <header className="admin-header">
          <div className="container">
            <div className="header-content">
              <div className="logo-section">
                <Link href="/" className="logo">EntBüro-Mat</Link>
                <span className="admin-badge">Admin</span>
              </div>
              <div className="user-section">
                <span className="welcome">Willkommen, {currentUser.username}</span>
                <button onClick={handleLogout} className="logout-btn">
                  Abmelden
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="admin-main">
          <div className="container">
            <h1 className="page-title">Dashboard</h1>

            {/* Statistics Cards */}
            <div className="stats-grid">
              <div className="stat-card pending">
                <div className="stat-content">
                  <div className="stat-number">{stats?.pendingApproval || 0}</div>
                  <div className="stat-label">Warten auf Genehmigung</div>
                </div>
                <div className="stat-icon">⏳</div>
              </div>

              <div className="stat-card total">
                <div className="stat-content">
                  <div className="stat-number">{stats?.totalIssues || 0}</div>
                  <div className="stat-label">Gesamte Meldungen</div>
                </div>
                <div className="stat-icon">📋</div>
              </div>

              <div className="stat-card approved">
                <div className="stat-content">
                  <div className="stat-number">{stats?.approvedIssues || 0}</div>
                  <div className="stat-label">Genehmigte Meldungen</div>
                </div>
                <div className="stat-icon">✅</div>
              </div>

              <div className="stat-card resolved">
                <div className="stat-content">
                  <div className="stat-number">{stats?.resolvedIssues || 0}</div>
                  <div className="stat-label">Gelöste Probleme</div>
                </div>
                <div className="stat-icon">🎯</div>
              </div>

              <div className="stat-card votes">
                <div className="stat-content">
                  <div className="stat-number">{stats?.totalVotes || 0}</div>
                  <div className="stat-label">Bürgerstimmen</div>
                </div>
                <div className="stat-icon">👍</div>
              </div>

              <div className="stat-card recent">
                <div className="stat-content">
                  <div className="stat-number">{stats?.recentIssues || 0}</div>
                  <div className="stat-label">Diese Woche</div>
                </div>
                <div className="stat-icon">📈</div>
              </div>
            </div>

            {/* Pending Issues Section */}
            <div className="pending-section">
              <div className="section-header">
                <h2 className="section-title">Genehmigung erforderlich</h2>
                <button 
                  onClick={handleRefresh}
                  className="refresh-btn"
                  title="Meldungen aktualisieren"
                >
                  🔄 Aktualisieren
                </button>
              </div>
              
              {issuesLoading ? (
                <div className="loading">Lädt...</div>
              ) : pendingIssues?.length === 0 ? (
                <div className="no-pending">
                  <span className="icon">✨</span>
                  <p>Alle Meldungen sind bearbeitet!</p>
                </div>
              ) : (
                <div className="pending-list">
                  {pendingIssues?.map((issue: any) => (
                    <div key={issue.id} className="pending-item">
                      <div className="issue-info">
                        <div className="issue-header">
                          <h3 className="issue-title">{issue.title}</h3>
                          <div className="issue-meta">
                            <span className="category">{getCategoryLabel(issue.category)}</span>
                            {issue.location && <span className="location">📍 {issue.location}</span>}
                          </div>
                        </div>
                        <p className="issue-description">
                          {issue.description.length > 200 
                            ? `${issue.description.substring(0, 200)}...` 
                            : issue.description
                          }
                        </p>
                        <div className="issue-details">
                          <span>Eingereicht: {new Date(issue.created_at).toLocaleDateString('de-DE')}</span>
                          <span>Typ: {issue.issue_type}</span>
                          {!issue.is_anonymous && issue.submitter_email && (
                            <span>Von: {issue.submitter_email}</span>
                          )}
                        </div>
                      </div>
                      <div className="actions">
                        <button 
                          onClick={() => handleApprove(issue.id)}
                          className="approve-btn"
                        >
                          ✅ Genehmigen
                        </button>
                        <button 
                          onClick={() => handleReject(issue.id)}
                          className="reject-btn"
                        >
                          ❌ Ablehnen
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Rejected Issues Section */}
            <div className="rejected-section">
              <h2 className="section-title">Abgelehnte Meldungen</h2>
              
              {rejectedLoading ? (
                <div className="loading">Lädt...</div>
              ) : rejectedIssuesData?.issues?.length === 0 ? (
                <div className="no-rejected">
                  <span className="icon">✨</span>
                  <p>Keine abgelehnten Meldungen!</p>
                </div>
              ) : (
                <div className="rejected-list">
                  {rejectedIssuesData?.issues?.map((issue: any) => (
                    <div key={issue.id} className="rejected-item">
                      <div className="issue-info">
                        <div className="issue-header">
                          <h3 className="issue-title">{issue.title}</h3>
                          <div className="issue-meta">
                            <span className="category">{getCategoryLabel(issue.category)}</span>
                            {issue.location && <span className="location">📍 {issue.location}</span>}
                          </div>
                        </div>
                        <p className="issue-description">
                          {issue.description.length > 200 
                            ? `${issue.description.substring(0, 200)}...` 
                            : issue.description
                          }
                        </p>
                        <div className="issue-details">
                          <span>Abgelehnt: {new Date(issue.rejected_at).toLocaleDateString('de-DE')}</span>
                          <span>Typ: {issue.issue_type}</span>
                          {!issue.is_anonymous && issue.submitter_email && (
                            <span>Von: {issue.submitter_email}</span>
                          )}
                        </div>
                      </div>
                      <div className="actions">
                        <button 
                          onClick={() => handleReactivate(issue.id)}
                          className="reactivate-btn"
                        >
                          🔄 Reaktivieren
                        </button>
                        <button 
                          onClick={() => handleDelete(issue.id)}
                          className="delete-btn"
                        >
                          🗑️ Löschen
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <h2 className="section-title">Schnellzugriff</h2>
              <div className="actions-grid">
                <a href="/issues" className="action-card">
                  <div className="action-icon">👀</div>
                  <div className="action-title">Alle Meldungen anzeigen</div>
                  <div className="action-desc">Öffentliche Ansicht besuchen</div>
                </a>
                
                <a onClick={handleExport} className="action-card">
                  <div className="action-icon">📊</div>
                  <div className="action-title">Daten exportieren</div>
                  <div className="action-desc">CSV-Export aller Meldungen</div>
                </a>
                
                <a href="/" className="action-card">
                  <div className="action-icon">🏠</div>
                  <div className="action-title">Zur Startseite</div>
                  <div className="action-desc">Öffentliche Website besuchen</div>
                </a>
              </div>
            </div>
          </div>
        </main>
      </div>

      <Toaster position="top-right" />

      <style jsx>{`
        .admin-dashboard {
          min-height: 100vh;
          background: #f8fafc;
          font-family: 'Inter', sans-serif;
        }

        .admin-header {
          background: white;
          border-bottom: 1px solid #e5e7eb;
          padding: 1rem 0;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .logo {
          font-family: "field-gothic-no-75-bold-wide", "Inter", sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--fdp-magenta);
          text-decoration: none;
        }

        .admin-badge {
          background: var(--fdp-yellow);
          color: var(--fdp-black);
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .user-section {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .welcome {
          color: #374151;
          font-weight: 500;
        }

        .logout-btn {
          background: var(--fdp-magenta);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .logout-btn:hover {
          background: #c21765;
        }

        .admin-main {
          padding: 2rem 0;
        }

        .page-title {
          font-size: 2rem;
          font-weight: 700;
          color: #111827;
          margin-bottom: 2rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .stat-card {
          background: white;
          padding: 1.5rem;
          border-radius: 0.75rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .stat-card.pending {
          border-left: 4px solid #f59e0b;
        }

        .stat-card.total {
          border-left: 4px solid #6b7280;
        }

        .stat-card.approved {
          border-left: 4px solid #10b981;
        }

        .stat-card.resolved {
          border-left: 4px solid #3b82f6;
        }

        .stat-card.votes {
          border-left: 4px solid var(--fdp-magenta);
        }

        .stat-card.recent {
          border-left: 4px solid var(--fdp-yellow);
        }

        .stat-number {
          font-size: 2rem;
          font-weight: 700;
          color: #111827;
        }

        .stat-label {
          font-size: 0.875rem;
          color: #6b7280;
          margin-top: 0.25rem;
        }

        .stat-icon {
          font-size: 2rem;
          opacity: 0.7;
        }

        .pending-section, .quick-actions {
          background: white;
          border-radius: 0.75rem;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .section-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }

        .refresh-btn {
          background: var(--fdp-magenta);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .refresh-btn:hover {
          background: var(--fdp-yellow);
          color: var(--fdp-black);
          transform: translateY(-1px);
        }

        .no-pending {
          text-align: center;
          padding: 3rem;
          color: #6b7280;
        }

        .no-pending .icon {
          font-size: 3rem;
          display: block;
          margin-bottom: 1rem;
        }

        .pending-list {
          space-y: 1rem;
        }

        .pending-item {
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1.5rem;
          margin-bottom: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1.5rem;
        }

        .issue-info {
          flex: 1;
        }

        .issue-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.75rem;
        }

        .issue-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }

        .issue-meta {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }

        .category {
          background: var(--fdp-yellow);
          color: var(--fdp-black);
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .location {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .issue-description {
          color: #4b5563;
          line-height: 1.6;
          margin-bottom: 1rem;
        }

        .issue-details {
          display: flex;
          gap: 1rem;
          font-size: 0.75rem;
          color: #6b7280;
        }

        .actions {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .approve-btn, .reject-btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 0.375rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 120px;
        }

        .approve-btn {
          background: #10b981;
          color: white;
        }

        .approve-btn:hover {
          background: #059669;
        }

        .reject-btn {
          background: #ef4444;
          color: white;
        }

        .reject-btn:hover {
          background: #dc2626;
        }

        .reactivate-btn, .delete-btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 0.375rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 120px;
        }

        .reactivate-btn {
          background: #3b82f6;
          color: white;
        }

        .reactivate-btn:hover {
          background: #2563eb;
        }

        .delete-btn {
          background: #ef4444;
          color: white;
        }

        .delete-btn:hover {
          background: #dc2626;
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
        }

        .action-card {
          background: #f9fafb;
          border-radius: 0.75rem;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          text-align: center;
          transition: transform 0.3s ease;
          cursor: pointer;
        }

        .action-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .action-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }

        .action-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
          margin-bottom: 0.25rem;
        }

        .action-desc {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .loading {
          text-align: center;
          padding: 2rem;
          color: #6b7280;
        }

        .no-rejected {
          text-align: center;
          padding: 3rem;
          color: #6b7280;
        }

        .no-rejected .icon {
          font-size: 3rem;
          display: block;
          margin-bottom: 1rem;
        }

        .rejected-list {
          space-y: 1rem;
        }

        .rejected-item {
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1.5rem;
          margin-bottom: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1.5rem;
        }

        @media (max-width: 768px) {
          .header-content {
            flex-direction: column;
            gap: 1rem;
          }

          .pending-item {
            flex-direction: column;
            gap: 1rem;
          }

          .actions {
            flex-direction: row;
            width: 100%;
          }

          .approve-btn, .reject-btn {
            flex: 1;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .actions-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
} 