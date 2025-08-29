import React from 'react';
import Link from 'next/link';

export default function Header() {
  return (
    <header>
      <div className="container">
        <div className="header-content">
          <Link href="/" className="logo">
            EntBüro-Mat
          </Link>
          <nav className="nav-links">
            <Link href="/">Startseite</Link>
            <Link href="/issues">Meldungen</Link>
            <Link href="/about">Über uns</Link>
          </nav>
        </div>
      </div>
    </header>
  );
}