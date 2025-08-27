import React, { ReactNode } from 'react';
import Link from 'next/link';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <nav className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-4">
              {/* Modern FDP Logo */}
              <div className="relative">
                <div 
                  className="w-12 h-12 flex items-center justify-center text-2xl font-bold border-2"
                  style={{
                    background: 'var(--fdp-yellow)',
                    color: 'var(--fdp-magenta)',
                    borderColor: 'var(--fdp-black)'
                  }}
                >
                  E
                </div>
              </div>
              <div>
                <h1 className="field-gothic text-2xl font-bold" style={{ color: 'var(--fdp-magenta)' }}>
                  EntBüro-Mat
                </h1>
                <p className="text-sm text-gray-600 font-medium hidden sm:block">
                  Der Mängelmelder für Bürokratie-Ärgernisse
                </p>
              </div>
            </Link>
            
            <div className="flex items-center space-x-8">
              {/* Navigation */}
              <div className="hidden md:flex items-center space-x-8">
                <Link 
                  href="/" 
                  className="field-gothic text-sm font-bold transition-colors duration-200 text-gray-700 hover:text-magenta-600"
                  style={{ color: 'var(--fdp-magenta)' }}
                >
                  Startseite
                </Link>
                <Link 
                  href="/issues" 
                  className="field-gothic text-sm font-bold transition-colors duration-200 text-gray-700 hover:text-magenta-600"
                >
                  Meldungen
                </Link>
                <Link 
                  href="/about" 
                  className="field-gothic text-sm font-bold transition-colors duration-200 text-gray-700 hover:text-magenta-600"
                >
                  Über uns
                </Link>
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer 
        className="text-white relative"
        style={{ background: 'var(--fdp-black)' }}
      >
        {/* Yellow accent line */}
        <div 
          className="w-full h-1"
          style={{ background: 'var(--fdp-yellow)' }}
        ></div>
        
        <div className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-4 gap-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center space-x-3 mb-6">
                <div 
                  className="w-10 h-10 flex items-center justify-center text-xl font-bold border-2"
                  style={{
                    background: 'var(--fdp-yellow)',
                    color: 'var(--fdp-magenta)',
                    borderColor: 'var(--fdp-yellow)'
                  }}
                >
                  E
                </div>
                <h3 className="field-gothic text-xl font-bold" style={{ color: 'var(--fdp-yellow)' }}>
                  EntBüro-Mat
                </h3>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                Eine Initiative der FDP Hessen für weniger Bürokratie und effizientere Verwaltung.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="field-gothic text-lg font-bold mb-6" style={{ color: 'var(--fdp-yellow)' }}>
                Navigation
              </h4>
              <div className="space-y-3">
                <Link href="/" className="block text-gray-300 hover:text-yellow-300 transition-colors text-sm">
                  Startseite
                </Link>
                <Link href="/issues" className="block text-gray-300 hover:text-yellow-300 transition-colors text-sm">
                  Alle Meldungen
                </Link>
                <Link href="/about" className="block text-gray-300 hover:text-yellow-300 transition-colors text-sm">
                  Über uns
                </Link>
              </div>
            </div>

            {/* Legal */}
            <div>
              <h4 className="field-gothic text-lg font-bold mb-6" style={{ color: 'var(--fdp-yellow)' }}>
                Rechtliches
              </h4>
              <div className="space-y-3">
                <Link href="/privacy" className="block text-gray-300 hover:text-yellow-300 transition-colors text-sm">
                  Datenschutz
                </Link>
                <Link href="/imprint" className="block text-gray-300 hover:text-yellow-300 transition-colors text-sm">
                  Impressum
                </Link>
                <Link href="/contact" className="block text-gray-300 hover:text-yellow-300 transition-colors text-sm">
                  Kontakt
                </Link>
                <Link href="/admin" className="block text-gray-300 hover:text-yellow-300 transition-colors text-sm">
                  Admin
                </Link>
              </div>
            </div>

            {/* FDP Info */}
            <div>
              <h4 className="field-gothic text-lg font-bold mb-6" style={{ color: 'var(--fdp-yellow)' }}>
                Unterstützt von
              </h4>
              <div className="text-gray-300 text-sm space-y-3">
                <p className="font-bold text-lg" style={{ color: 'var(--fdp-yellow)' }}>
                  FDP Hessen
                </p>
                <p className="leading-relaxed">
                  Für mehr Transparenz und Effizienz in der Verwaltung
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center text-sm">
              <p className="text-gray-400">
                © 2025 EntBüro-Mat. Alle Rechte vorbehalten.
              </p>
              <div className="flex items-center space-x-6 mt-4 md:mt-0">
                <span className="text-gray-400">
                  Gemeinsam für weniger Bürokratie
                </span>
                <div className="flex space-x-2">
                  <span style={{ color: 'var(--fdp-yellow)' }} className="text-lg">⚡</span>
                  <span style={{ color: 'var(--fdp-yellow)' }} className="text-lg">🎯</span>
                  <span style={{ color: 'var(--fdp-yellow)' }} className="text-lg">🚀</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 