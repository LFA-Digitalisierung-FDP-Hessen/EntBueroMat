import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { checkAdminStatus } from '../utils/api';

export default function Header() {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check admin status on component mount
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { isAdmin, user } = await checkAdminStatus();
        setIsAdmin(isAdmin);
        setAdminUser(user);
      } catch (error) {
        // Fehler ignorieren - Benutzer ist einfach nicht eingeloggt
        setIsAdmin(false);
        setAdminUser(null);
      }
    };

    checkAdmin();

    // Optional: Regelmäßig prüfen (alle 30 Minuten)
    const interval = setInterval(checkAdmin, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setIsAdmin(false);
    setAdminUser(null);
    // Optional: Seite neu laden oder zur Login-Seite weiterleiten
    window.location.href = '/';
  };

  return (
    <header>
      <div className="container">
        <div className="header-content">
          <div className="logo-section">
            <Link href="/" className="logo">
              EntBüro-Mat
            </Link>
            {isAdmin && (
              <div className="admin-info">
                <span className="admin-badge">
                  {adminUser?.username}
                </span>
                <div className="admin-dropdown">
                  <Link href="/admin" className="admin-link">
                    Dashboard
                  </Link>
                  <button onClick={handleLogout} className="logout-btn">
                    Abmelden
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <nav className="nav-links">
            <Link href="/">Startseite</Link>
            <Link href="/issues">Meldungen</Link>
            <Link href="/about">Über uns</Link>
          </nav>
        </div>
      </div>

      <style jsx>{`
        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 0;
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

        .admin-info {
          position: relative;
          display: flex;
          align-items: center;
        }

        .admin-badge {
          background: var(--fdp-yellow);
          color: var(--fdp-black);
          padding: 0.4rem 0.8rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: "field-gothic-no-75-bold-wide", "Inter", sans-serif;
        }

        .admin-badge:hover {
          background: var(--fdp-magenta);
          color: var(--fdp-white);
        }

        .admin-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          padding: 0.5rem;
          min-width: 150px;
          z-index: 1000;
          opacity: 0;
          visibility: hidden;
          transform: translateY(-10px);
          transition: all 0.3s ease;
        }

        .admin-info:hover .admin-dropdown {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .admin-link, .logout-btn {
          display: block;
          width: 100%;
          padding: 0.5rem 0.75rem;
          text-decoration: none;
          color: #374151;
          background: none;
          border: none;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          cursor: pointer;
          transition: background-color 0.2s;
          text-align: left;
        }

        .admin-link:hover, .logout-btn:hover {
          background: #f9fafb;
          text-decoration: none;
          color: #111827;
        }

        .logout-btn {
          color: #dc2626;
          font-weight: 600;
        }

        .logout-btn:hover {
          background: #fef2f2;
          color: #b91c1c;
        }

        .nav-links {
          display: flex;
          gap: 2rem;
          align-items: center;
        }

        .nav-links a {
          text-decoration: none;
          color: var(--fdp-black);
          font-weight: 500;
          transition: color 0.3s ease;
        }

        .nav-links a:hover {
          color: var(--fdp-magenta);
        }

        .admin-login-link {
          background: var(--fdp-magenta);
          color: white !important;
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .admin-login-link:hover {
          background: var(--fdp-yellow);
          color: var(--fdp-black) !important;
        }

        @media (max-width: 768px) {
          .header-content {
            flex-direction: column;
            gap: 1rem;
          }

          .logo-section {
            flex-direction: column;
            gap: 0.5rem;
          }

          .nav-links {
            gap: 1rem;
            flex-wrap: wrap;
            justify-content: center;
          }

          .admin-dropdown {
            position: static;
            opacity: 1;
            visibility: visible;
            transform: none;
            box-shadow: none;
            border: none;
            background: transparent;
            padding: 0;
            margin-top: 0.5rem;
          }

          .admin-info:hover .admin-dropdown {
            transform: none;
          }

          .admin-link, .logout-btn {
            display: inline-block;
            width: auto;
            margin: 0 0.5rem;
            padding: 0.25rem 0.5rem;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
          }
        }
      `}</style>
    </header>
  );
}