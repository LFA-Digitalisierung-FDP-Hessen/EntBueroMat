import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQuery } from 'react-query';
import { getPublicStats } from '../utils/api';
import PopularIssues from '../components/PopularIssues';
import toast, { Toaster } from 'react-hot-toast';
import Footer from '../components/Footer';

export default function Home() {
  const router = useRouter();
  const [quickDescription, setQuickDescription] = useState('');

  // Fetch stats
  const { data: stats } = useQuery('publicStats', getPublicStats);

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!quickDescription.trim()) {
      toast.error('Bitte beschreiben Sie Ihr Problem');
      return;
    }

    if (quickDescription.trim().length < 50) {
      toast.error('Bitte beschreiben Sie das Problem etwas ausführlicher (mindestens 50 Zeichen)');
      return;
    }

    // Navigate to full form with pre-filled description
    router.push({
      pathname: '/melden',
      query: { description: quickDescription.trim() }
    });
  };

  return (
    <>
      <Head>
        <title>EntBüro-Mat - Der Mängelmelder für Bürokratie-Ärgernisse</title>
        <meta name="description" content="Melden Sie Bürokratieprobleme einfach und anonym. Eine Initiative der FDP Hessen." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1>EntBüro-Mat</h1>
            <h2>Der Mängelmelder für Bürokratie-Ärgernisse</h2>
            <p>
              Melden Sie Bürokratieprobleme einfach und anonym. 
              Ihr Hinweis bringt Bewegung in festgefahrene Prozesse.
            </p>
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="#form" className="btn btn-primary">Problem melden</a>
              <Link href="/issues" className="btn btn-secondary">Meldungen ansehen</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Issues Section */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Populäre Meldungen</h2>
          <p className="section-description">
            Diese Probleme beschäftigen derzeit die meisten Bürger. 
            Klicken Sie auf "👍", wenn Sie ähnliche Erfahrungen gemacht haben.
          </p>
          <PopularIssues limit={3} />
          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <Link href="/issues" className="btn btn-secondary">
              Alle Meldungen ansehen
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Unsere Erfolge</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-number">{stats?.totalIssues || 0}</span>
              <span className="stat-label">Gemeldete Probleme</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats?.resolvedIssues || 0}</span>
              <span className="stat-label">Gelöste Probleme</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats?.totalVotes || 0}</span>
              <span className="stat-label">Bürgerstimmen</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats?.successRate || 0}%</span>
              <span className="stat-label">Erfolgsquote</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Submit Section */}
      <section id="form" className="form-section">
        <div className="container">
          <h2 className="section-title" style={{ color: 'var(--fdp-black)' }}>
            Problem melden
          </h2>
          <div className="quick-form-container">
            <p className="quick-form-intro">
              Beschreiben Sie kurz Ihr Bürokratie-Problem. 
              Sie können anschließend weitere Details hinzufügen.
            </p>
            <form onSubmit={handleQuickSubmit}>
              <div className="quick-input-group">
                <textarea
                  value={quickDescription}
                  onChange={(e) => setQuickDescription(e.target.value)}
                  placeholder="Beschreiben Sie Ihr Problem..."
                  maxLength={5000}
                  className="quick-textarea"
                  rows={4}
                />
                <small className="char-counter">
                  {quickDescription.length}/5000 Zeichen
                </small>
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary quick-submit-btn"
              >
                Problem melden →
              </button>
            </form>
            
            <div className="quick-form-benefits">
              <div className="benefit">
                <span className="benefit-icon">🔒</span>
                <span>Anonym</span>
              </div>
              <div className="benefit">
                <span className="benefit-icon">⚡</span>
                <span>Schnell</span>
              </div>
              <div className="benefit">
                <span className="benefit-icon">📈</span>
                <span>Wirkungsvoll</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .quick-form-container {
          max-width: 700px;
          margin: 0 auto;
          background: var(--fdp-white);
          padding: 40px;
          border: 3px solid var(--fdp-magenta);
          border-radius: 12px;
        }

        .quick-form-intro {
          text-align: center;
          font-size: 18px;
          color: #374151;
          margin-bottom: 30px;
          line-height: 1.6;
        }

        .quick-input-group {
          margin-bottom: 25px;
        }

        .quick-textarea {
          width: 100%;
          padding: 20px;
          border: 2px solid var(--fdp-magenta);
          border-radius: 8px;
          font-family: 'Inter', sans-serif;
          font-size: 16px;
          line-height: 1.5;
          resize: vertical;
          min-height: 120px;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }

        .quick-textarea:focus {
          outline: none;
          border-color: var(--fdp-yellow);
          box-shadow: 0 0 0 3px rgba(255, 237, 0, 0.3);
          background: #fffef0;
        }

        .char-counter {
          display: block;
          text-align: right;
          margin-top: 8px;
          font-size: 12px;
          color: #6b7280;
        }

        .quick-submit-btn {
          width: 100%;
          padding: 18px 30px;
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 30px;
          transition: all 0.3s ease;
        }

        .quick-submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(229, 0, 125, 0.3);
        }

        .quick-form-benefits {
          display: flex;
          justify-content: center;
          gap: 40px;
          padding-top: 25px;
          border-top: 2px solid #f3f4f6;
        }

        .benefit {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: var(--fdp-black);
        }

        @media (max-width: 768px) {
          .quick-form-container {
            margin: 0 20px;
            padding: 30px 20px;
          }

          .quick-form-benefits {
            gap: 25px;
          }

          .benefit {
            font-size: 14px;
          }

          .benefit-icon {
            font-size: 20px;
          }
        }
      `}</style>

      {/* Footer */}
      <Footer />
      {/* Toast notifications */}
      <Toaster position="top-right" />
    </>
  );
} 