import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from 'react-query';
import { getTopIssues, voteForIssue, removeVote } from '../utils/api';
import toast from 'react-hot-toast';

interface PopularIssuesProps {
  limit?: number;
}

interface VoteStatus {
  [issueId: number]: {
    hasVoted: boolean;
    voteCount: number;
  };
}

export default function PopularIssues({ limit = 3 }: PopularIssuesProps) {
  const [voteStatuses, setVoteStatuses] = useState<VoteStatus>({});
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery(
    ['topIssues', limit],
    () => getTopIssues(limit)
  );

  // Initialize vote statuses from issue data (no more separate API calls needed!)
  useEffect(() => {
    if (data?.issues) {
      const newStatuses: VoteStatus = {};
      
      data.issues.forEach((issue) => {
        newStatuses[issue.id] = {
          hasVoted: issue.has_voted || false,
          voteCount: issue.vote_count || 0
        };
      });
      
      setVoteStatuses(newStatuses);
    }
  }, [data?.issues]);

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
      
      // Query invalidieren um aktuelle Vote-Status zu laden (mit Debounce)
      setTimeout(() => {
        queryClient.invalidateQueries(['topIssues', limit]);
      }, 100);
    } catch (error) {
      toast.error('Fehler beim Abstimmen');
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Beliebte Meldungen werden geladen...</p>
      </div>
    );
  }

  if (error || !data?.issues?.length) {
    return (
      <div className="no-issues">
        <p>Keine Meldungen vorhanden.</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return '#10B981'; // green
      case 'in_progress':
        return '#F59E0B'; // orange
      case 'submitted':
        return '#6B7280'; // gray
      case 'pending_approval':
        return '#8B5CF6'; // purple
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
      case 'pending_approval':
        return 'Warten auf Genehmigung';
      default:
        return status;
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

  return (
    <>
      <div className="popular-issues">
        {data.issues.map((issue) => (
          <div key={issue.id} className="issue-card">
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
                {issue.description.length > 150 
                  ? `${issue.description.substring(0, 150)}...` 
                  : issue.description
                }
              </p>
            </Link>
            
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
                    {issue.vote_count || 0} Stimmen
                  </span>
                </div>
              )}
              <div className="issue-date">
                {new Date(issue.created_at).toLocaleDateString('de-DE')}
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`


        .issue-title-link {
          color: inherit;
        }

        .issue-status-header {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 15px;
        }

        .vote-icon {
          font-size: 16px;
        }

        .vote-count {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .vote-button.voted .vote-count {
          color: var(--fdp-black);
        }
      `}</style>
    </>
  );
} 