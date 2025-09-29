import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQuery, useQueryClient } from 'react-query';
import { 
  getIssue, 
  checkAdminStatus,
  voteForIssue,
  removeVote,
  updateIssueStatus,
  addIssueUpdate
} from '../../utils/api';
import type { Issue } from '../../utils/api';
import toast, { Toaster } from 'react-hot-toast';
import Footer from '../../components/Footer';
import Header from '../../components/Header';

interface IssueUpdate {
  id: number;
  update_text: string;
  updated_by: string;
  updater_name: string;
  created_at: string;
}

export default function IssueDetailPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = router.query;
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [newUpdate, setNewUpdate] = useState('');
  const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false);
  const [voteCount, setVoteCount] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);

  // Check admin status on page load
  useEffect(() => {
    const checkAdmin = async () => {
      const { isAdmin, user } = await checkAdminStatus();
      setIsAdmin(isAdmin);
      setAdminUser(user);
    };
    checkAdmin();
  }, []);

  // Fetch issue details
  const { data: issueData, isLoading, error, refetch } = useQuery(
    ['issue', id],
    () => getIssue(Number(id)),
    {
      enabled: !!id && !isNaN(Number(id)),
      onSuccess: (data) => {
        setVoteCount(data.issue.vote_count || 0);
        setHasVoted(data.issue.has_voted || false);
      }
    }
  );

  const handleVote = async () => {
    if (!issueData?.issue) return;

    try {
      if (hasVoted) {
        const result = await removeVote(issueData.issue.id);
        setVoteCount(result.voteCount);
        setHasVoted(false);
        toast.success('Stimme entfernt');
      } else {
        const result = await voteForIssue(issueData.issue.id);
        setVoteCount(result.voteCount);
        setHasVoted(true);
        toast.success('Stimme abgegeben!');
      }
      
      // Issue-Daten neu laden um Vote-Status zu synchronisieren
      refetch();
    } catch (error) {
      toast.error('Fehler beim Abstimmen');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!issueData?.issue) return;

    try {
      await updateIssueStatus(issueData.issue.id, newStatus);
      toast.success('Status aktualisiert');
      // Nur refetch verwenden, um doppelte Requests zu vermeiden
      refetch();
    } catch (error) {
      toast.error('Fehler beim Aktualisieren des Status');
    }
  };

  const handleAddUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueData?.issue || !newUpdate.trim()) return;

    setIsSubmittingUpdate(true);
    try {
      await addIssueUpdate(issueData.issue.id, newUpdate);
      setNewUpdate('');
      toast.success('Update hinzugefügt');
      // Nur refetch verwenden, um doppelte Requests zu vermeiden
      refetch();
    } catch (error) {
      toast.error('Fehler beim Hinzufügen des Updates');
    } finally {
      setIsSubmittingUpdate(false);
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



  if (isLoading) {
    return (
      <>
        <Header />
        <main>
          <section className="section">
            <div className="container">
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Meldung wird geladen...</p>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !issueData?.issue) {
    return (
      <>
        <Header />
        <main>
          <section className="section">
            <div className="container">
              <div className="error-container">
                <h1>Meldung nicht gefunden</h1>
                <p>Die angeforderte Meldung konnte nicht gefunden werden oder ist nicht öffentlich verfügbar.</p>
                <Link href="/issues" className="btn btn-primary">
                  Zurück zur Übersicht
                </Link>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  const issue = issueData.issue;
  const updates = issueData.updates || [];

  return (
    <>
      <Head>
        <title>{issue.title} - der EntBüro-Mat</title>
        <meta name="description" content={issue.description.substring(0, 160)} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Header />

      <main>
        {/* Navigation breadcrumb */}
        <section className="breadcrumb-section">
          <div className="container">
            <nav className="breadcrumb">
              <Link href="/">Startseite</Link>
              <span className="breadcrumb-separator">›</span>
              <Link href="/issues">Alle Meldungen</Link>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-current">{issue.title}</span>
            </nav>
          </div>
        </section>

        {/* Issue detail */}
        <section className="section">
          <div className="container">
            <div className="issue-detail-layout">
              {/* Main content */}
              <div className="issue-main">
                {/* Prominenter Status */}
                <div className="prominent-status">
                  <div 
                    className="status-badge large"
                    style={{ 
                      backgroundColor: getStatusColor(issue.status)
                    }}
                  >
                    {getStatusText(issue.status)}
                  </div>
                </div>

                <h1 className="issue-title">{issue.title}</h1>

                {/* Badges nebeneinander unter dem Titel */}
                <div className="issue-badges">
                  {issue.location && (
                    <span className="badge badge-location">
                      📍 {issue.location}
                    </span>
                  )}
                  <span className="badge badge-category">
                    {getCategoryLabel(issue.category)}
                  </span>
                </div>

                <div className="horizontal-line"></div>

                <div className="issue-stats">
                  <div className="issue-date">
                    Eingereicht am {new Date(issue.created_at).toLocaleDateString('de-DE', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  
                  {issue.status !== 'pending_approval' && issue.status !== 'rejected' && (
                    <button
                      onClick={handleVote}
                      className={`vote-button ${hasVoted ? 'voted' : ''}`}
                    >
                      <span className="vote-icon">
                        {hasVoted ? '👍' : '👍'}
                      </span>
                      <span className="vote-count">
                        {voteCount} {voteCount === 1 ? 'Stimme' : 'Stimmen'}
                      </span>
                    </button>
                  )}
                  {(issue.status === 'pending_approval' || issue.status === 'rejected') && (
                    <div className="vote-display">
                      <span className="vote-icon">👍</span>
                      <span className="vote-count">
                        {voteCount} {voteCount === 1 ? 'Stimme' : 'Stimmen'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="issue-description">
                  <h3>Beschreibung</h3>
                  <div className="description-content">
                    {issue.description.split('\n').map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                </div>



                {/* Updates section */}
                <div className="updates-section">
                  <h3>Updates und Bearbeitungsstand</h3>
                  
                  {/* Admin update form */}
                  {isAdmin && issue.status !== 'pending_approval' && (
                    <form onSubmit={handleAddUpdate} className="update-form">
                      <div className="form-group">
                        <label htmlFor="newUpdate">Neues Update hinzufügen:</label>
                        <textarea
                          id="newUpdate"
                          value={newUpdate}
                          onChange={(e) => setNewUpdate(e.target.value)}
                          placeholder="Geben Sie hier eine Updatenachricht zum Bearbeitungsstand ein..."
                          rows={4}
                          required
                          minLength={10}
                          maxLength={1000}
                        />
                      </div>
                      <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={isSubmittingUpdate || !newUpdate.trim()}
                      >
                        {isSubmittingUpdate ? 'Wird hinzugefügt...' : 'Update hinzufügen'}
                      </button>
                    </form>
                  )}

                  <div className="horizontal-line"></div>

                  {/* Updates list */}
                  <div className="updates-list">
                    {updates.length === 0 ? (
                      <p className="no-updates">Noch keine Updates verfügbar.</p>
                    ) : (
                      updates.map((update, index) => (
                        <div key={update.id}>
                          <div className="update-item">
                            <div className="update-header">
                              <span className="update-author">
                                {update.updated_by === 'admin' ? `Admin (${update.updater_name})` : update.updater_name}
                              </span>
                              <span className="update-date">
                                {new Date(update.created_at).toLocaleDateString('de-DE', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <div className="update-content">
                              {update.update_text.split('\n').map((line, index) => (
                                <p key={index}>{line}</p>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="issue-sidebar">
                {/* Admin status control */}
                {isAdmin && issue.status !== 'pending_approval' && (
                  <div className="sidebar-card admin-status-controls">
                    <h4>Status ändern</h4>
                    <div className="status-buttons">
                      {issue.status !== 'in_progress' && (
                        <button
                          onClick={() => handleStatusChange('in_progress')}
                          className="admin-btn status-btn"
                        >
                          🔄 In Bearbeitung
                        </button>
                      )}
                      {issue.status !== 'resolved' && (
                        <button
                          onClick={() => handleStatusChange('resolved')}
                          className="admin-btn status-btn"
                        >
                          ✅ Als gelöst markieren
                        </button>
                      )}
                      {issue.status !== 'submitted' && issue.status !== 'rejected' && (
                        <button
                          onClick={() => handleStatusChange('submitted')}
                          className="admin-btn status-btn"
                        >
                          📄 Zurück zu "Eingereicht"
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Admin info */}
                {isAdmin && !issue.is_anonymous && issue.submitter_name && (
                  <div className="sidebar-card admin-info">
                    <h4>Einreicher-Informationen</h4>
                    <div className="detail-item">
                      <strong>Name:</strong>
                      <span>{issue.submitter_name}</span>
                    </div>
                    {issue.submitter_email && (
                      <div className="detail-item">
                        <strong>E-Mail:</strong>
                        <span>
                          <a href={`mailto:${issue.submitter_email}`}>
                            {issue.submitter_email}
                          </a>
                        </span>
                      </div>
                    )}
                    {issue.submitter_contact && (
                      <div className="detail-item">
                        <strong>Kontakt:</strong>
                        <span>{issue.submitter_contact}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="sidebar-actions">
                  <Link href="/issues" className="btn btn-secondary">
                    Zurück zur Übersicht
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <Toaster position="top-right" />

      <style jsx>{`
        .breadcrumb-section {
          background: #f9fafb;
          padding: 20px 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #6b7280;
        }

        .breadcrumb a {
          color: var(--fdp-magenta);
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .breadcrumb a:hover {
          color: var(--fdp-yellow);
          text-decoration: underline;
        }

        .breadcrumb-separator {
          color: #9ca3af;
        }

        .breadcrumb-current {
          color: var(--fdp-black);
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 300px;
        }

        .issue-detail-layout {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 40px;
          margin-top: 20px;
        }

        .issue-main {
          min-width: 0;
        }

        .prominent-status {
          margin-bottom: 20px;
          display: flex;
          justify-content: flex-start;
        }

        .issue-badges {
          gap: 12px;
        }



        .issue-title {
          font-family: "field-gothic-no-75-bold-wide", "Inter", sans-serif;
          font-size: 2.5rem;
          font-weight: 700;
          line-height: 1.2;
          color: var(--fdp-black);
          margin: 0 0 20px 0;
        }

        .issue-stats {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 0;
        }

        .issue-date {
          color: #6b7280;
          font-size: 14px;
        }

        .vote-button {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f9fafb;
          border: 2px solid #e5e7eb;
          border-radius: 30px;
          padding: 10px 20px;
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
          border-radius: 30px;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 600;
          color: #6b7280;
          cursor: not-allowed;
        }

        .issue-description {
          margin-bottom: 40px;
        }

        .issue-description h3 {
          font-family: "field-gothic-no-75-bold-wide", "Inter", sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 15px;
          color: var(--fdp-black);
        }

        .description-content {
          line-height: 1.7;
          color: #374151;
          font-size: 16px;
        }

        .description-content p {
          margin-bottom: 15px;
        }

        .description-content p:last-child {
          margin-bottom: 0;
        }

        .sidebar-card.admin-status-controls {
          border-left: 4px solid var(--fdp-magenta);
        }

        .sidebar-card .status-buttons {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .admin-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .admin-btn.status-btn {
          background: var(--fdp-magenta);
          color: white;
        }

        .admin-btn.status-btn:hover {
          background: var(--fdp-yellow);
          color: var(--fdp-black);
        }

        .updates-section {
          margin-top: 40px;
        }

        .updates-section h3 {
          font-family: "field-gothic-no-75-bold-wide", "Inter", sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 20px;
          color: var(--fdp-black);
        }

        .update-form {
          margin-bottom: 30px;
          padding: 20px;
          background: white;
          border: 2px solid var(--fdp-yellow);
          border-radius: 8px;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          font-weight: 600;
          margin-bottom: 8px;
          color: var(--fdp-black);
        }

        .form-group textarea {
          width: 100%;
          padding: 12px;
          border: 2px solid #e5e7eb;
          border-radius: 6px;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          line-height: 1.5;
          resize: vertical;
          min-height: 100px;
        }

        .form-group textarea:focus {
          outline: none;
          border-color: var(--fdp-magenta);
        }

        .updates-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .no-updates {
          color: #6b7280;
          font-style: italic;
          text-align: center;
          padding: 40px;
          background: #f9fafb;
          border-radius: 8px;
        }

        .update-item {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .update-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .update-author {
          font-weight: 600;
          color: var(--fdp-magenta);
        }

        .update-date {
          font-size: 12px;
          color: #6b7280;
        }

        .update-content {
          line-height: 1.6;
          color: #374151;
        }

        .update-content p {
          margin-bottom: 10px;
        }

        .update-content p:last-child {
          margin-bottom: 0;
        }

        .issue-sidebar {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .sidebar-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .sidebar-card h4 {
          font-family: "field-gothic-no-75-bold-wide", "Inter", sans-serif;
          font-size: 1.1rem;
          font-weight: 700;
          margin-bottom: 15px;
          color: var(--fdp-black);
          border-bottom: 2px solid var(--fdp-yellow);
          padding-bottom: 8px;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
          gap: 10px;
        }

        .detail-item:last-child {
          margin-bottom: 0;
        }

        .detail-item strong {
          color: #374151;
          font-size: 14px;
          flex-shrink: 0;
        }

        .detail-item span {
          color: #6b7280;
          font-size: 14px;
          text-align: right;
          word-break: break-word;
        }

        .detail-item a {
          color: var(--fdp-magenta);
          text-decoration: none;
        }

        .detail-item a:hover {
          text-decoration: underline;
        }

        .admin-info {
          border-left: 4px solid var(--fdp-magenta);
        }

        .sidebar-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .error-container {
          text-align: center;
          padding: 60px 20px;
        }

        .error-container h1 {
          color: #dc2626;
          margin-bottom: 15px;
        }

        .error-container p {
          color: #6b7280;
          margin-bottom: 30px;
        }

        .loading-container {
          text-align: center;
          padding: 60px 20px;
        }

        .loading-spinner {
          border: 3px solid #f3f4f6;
          border-top: 3px solid var(--fdp-magenta);
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px auto;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 1024px) {
          .issue-detail-layout {
            grid-template-columns: 1fr;
            gap: 30px;
          }

          .issue-title {
            font-size: 2rem;
          }

          .issue-stats {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }

          .breadcrumb-current {
            max-width: 200px;
          }
        }

        @media (max-width: 768px) {
          .issue-title {
            font-size: 1.75rem;
          }

          .issue-badges {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .prominent-status {
            justify-content: center;
          }

          .status-badge {
            font-size: 12px;
            padding: 10px 20px;
          }



          .admin-btn {
            justify-content: center;
          }

          .update-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 5px;
          }

          .detail-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 5px;
          }

          .detail-item span {
            text-align: left;
          }
        }
      `}</style>
    </>
  );
}
