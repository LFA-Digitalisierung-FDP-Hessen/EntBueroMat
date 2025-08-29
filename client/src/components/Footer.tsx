import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer>
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>EntBüro-Mat</h3>
            <p>Eine Initiative der FDP Hessen für weniger Bürokratie und effizientere Verwaltung.</p>
          </div>
          <div className="footer-section">
            <h3>Navigation</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link href="/">Startseite</Link>
              <Link href="/issues">Alle Meldungen</Link>
              <Link href="/about">Über uns</Link>
              <Link href="/admin">Admin</Link>
            </div>
          </div>
          <div className="footer-section">
            <h3>Rechtliches</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link href="/privacy">Datenschutz</Link>
              <Link href="/imprint">Impressum</Link>
              <Link href="/contact">Kontakt</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 EntBüro-Mat. Alle Rechte vorbehalten.</p>
        </div>
      </div>
    </footer>
  );
}