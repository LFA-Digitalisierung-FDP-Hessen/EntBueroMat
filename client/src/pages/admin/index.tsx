import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { getAdminStats, getIssues } from '../../utils/api';
import toast, { Toaster } from 'react-hot-toast';
import Header from '../../components/Header';

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
      refetchInterval: 5 * 60 * 1000 // Refresh every 5 minutes
    }
  );



  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    toast.success('Erfolgreich abgemeldet');
    router.push('/admin/login');
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
      'pending_approval': 'Warten auf Genehmigung',
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

      {/* Header */}
      <Header />

      <div className="admin-dashboard">
        <main className="admin-main">
          <div className="container">
            {/* Admin Welcome Section */}
            <div className="admin-welcome">
              <h1 className="page-title">Dashboard</h1>
              <div className="admin-info-bar">
                <span className="welcome">Willkommen, {currentUser.username}!</span>
                <button onClick={handleLogout} className="logout-btn">
                  Abmelden
                </button>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="stats-grid">
              <a 
                href="/issues?status=pending_approval" 
                className="stat-card pending clickable"
                title="Klicken Sie hier, um alle wartenden Meldungen anzuzeigen"
              >
                <div className="stat-content">
                  <div className="stat-number">{stats?.pendingApproval || 0}</div>
                  <div className="stat-label">Warten auf Genehmigung</div>
                </div>
                <div className="stat-icon">⏳</div>
              </a>

              <a 
                href="/issues" 
                className="stat-card total clickable"
                title="Klicken Sie hier, um alle Meldungen anzuzeigen"
              >
                <div className="stat-content">
                  <div className="stat-number">{stats?.totalIssues || 0}</div>
                  <div className="stat-label">Gesamte Meldungen</div>
                </div>
                <div className="stat-icon">📋</div>
              </a>

              <a 
                href="/issues?status=submitted" 
                className="stat-card approved clickable"
                title="Klicken Sie hier, um alle genehmigten Meldungen anzuzeigen"
              >
                <div className="stat-content">
                  <div className="stat-number">{stats?.approvedIssues || 0}</div>
                  <div className="stat-label">Genehmigte Meldungen</div>
                </div>
                <div className="stat-icon">✅</div>
              </a>

              <a 
                href="/issues?status=resolved" 
                className="stat-card resolved clickable"
                title="Klicken Sie hier, um alle gelösten Probleme anzuzeigen"
              >
                <div className="stat-content">
                  <div className="stat-number">{stats?.resolvedIssues || 0}</div>
                  <div className="stat-label">Gelöste Probleme</div>
                </div>
                <div className="stat-icon">🎯</div>
              </a>

              <div className="stat-card votes">
                <div className="stat-content">
                  <div className="stat-number">{stats?.totalVotes || 0}</div>
                  <div className="stat-label">Bürgerstimmen</div>
                </div>
                <div className="stat-icon">👍</div>
              </div>

              <a 
                href="/issues?sort=created_at&order=DESC" 
                className="stat-card recent clickable"
                title="Klicken Sie hier, um die neuesten Meldungen anzuzeigen"
              >
                <div className="stat-content">
                  <div className="stat-number">{stats?.recentIssues || 0}</div>
                  <div className="stat-label">Diese Woche</div>
                </div>
                <div className="stat-icon">📈</div>
              </a>
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

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        .admin-welcome {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: white;
          border-radius: 0.75rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .admin-info-bar {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .welcome {
          color: #374151;
          font-weight: 500;
          font-size: 1rem;
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
          margin-bottom: 1em;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
        }

        .stat-card {
          background: white;
          padding: 1.5rem;
          border-radius: 0.75rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          justify-content: space-between;
          text-decoration: none;
          color: inherit;
        }

        .stat-card.clickable {
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .stat-card.clickable:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          text-decoration: none;
          color: inherit;
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

        .management-info {
          text-align: center;
        }

        .info-text {
          color: #6b7280;
          margin-bottom: 2rem;
          font-size: 1rem;
          line-height: 1.6;
        }

        .quick-links {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-top: 2rem;
        }

        .quick-link-btn {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          background: #f9fafb;
          border-radius: 12px;
          text-decoration: none;
          color: inherit;
          transition: all 0.3s ease;
          border: 2px solid transparent;
        }

        .quick-link-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          text-decoration: none;
          color: inherit;
        }

        .quick-link-btn.pending {
          border-color: #f59e0b;
        }

        .quick-link-btn.pending:hover {
          background: #fef3c7;
        }

        .quick-link-btn.approved {
          border-color: #10b981;
        }

        .quick-link-btn.approved:hover {
          background: #d1fae5;
        }

        .quick-link-btn.resolved {
          border-color: #3b82f6;
        }

        .quick-link-btn.resolved:hover {
          background: #dbeafe;
        }

        .quick-link-btn .icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .quick-link-btn div {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .quick-link-btn strong {
          font-weight: 600;
          color: #111827;
        }

        .quick-link-btn small {
          color: #6b7280;
          font-size: 0.875rem;
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



        @media (max-width: 768px) {
          .admin-welcome {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }

          .admin-info-bar {
            flex-direction: column;
            gap: 0.5rem;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .actions-grid {
            grid-template-columns: 1fr;
          }

          .quick-links {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
} 