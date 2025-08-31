import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
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
              {issue.description.length > 150 
                ? `${issue.description.substring(0, 150)}...` 
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

      <style jsx>{`
        .vote-button {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #f9fafb;
          padding: 6px 12px;
          border-radius: 20px;
          border: 1px solid #e5e7eb;
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