import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Footer from '../components/Footer';
import Header from '../components/Header';

export default function About() {
  return (
    <>
      <Head>
        <title>Über uns - EntBüro-Mat</title>
        <meta name="description" content="Erfahren Sie mehr über EntBüro-Mat, den Mängelmelder für Bürokratie-Ärgernisse der FDP Hessen." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Header />

      {/* Main Content */}
      <main>
        {/* Page Header */}
        <section className="section" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
          <div className="container">
            <h1 className="section-title">Über uns</h1>
            <p style={{ textAlign: 'center' }}>
              <b>EntBüro-Mat – Eine Initiative der FDP Hessen</b>
            </p>
            <p className="section-description">
              Wir helfen dabei, 
              alltägliche Bürokratie-Ärgernisse zu identifizieren und zu lösen.
            </p>
          </div>
        </section>

      {/* About Content */}
      <section className="section">
        <div className="container">
          <h2 className="section-title" style={{ textAlign: 'left', marginBottom: '30px' }}>
            Was ist der EntBüro-Mat?
          </h2>
          <div className="about-layout">
            {/* Left Column - Text Content */}
            <div>
              <div className="space-y-6 text-lg leading-relaxed">
                <p>
                  Der EntBüro-Mat ist ein digitales Meldesystem, das es Bürgern ermöglicht, 
                  Bürokratieprobleme und Verwaltungsärgernisse einfach und anonym zu melden. 
                  Unser Ziel ist es, die Verwaltung bürgerfreundlicher und effizienter zu machen.
                </p>
                <p>
                  Durch die Sammlung und Kategorisierung von Problemen können wir 
                  systematisch an Lösungen arbeiten und die Verwaltung dabei unterstützen, 
                  ihre Prozesse zu optimieren.
                </p>
                <p>
                  Jede Meldung wird an die zuständigen 
                  Behörden sowie an den lokalen FDP-Kreisverband weitergeleitet. Gemeinsam mit den Bürgern arbeiten wir 
                  daran, Hessen zu einem lebenswerten und effizienten Bundesland zu machen.
                </p>
              </div>
            </div>

                         {/* Right Column - FDP Logo */}
             <div className="text-center">
               <div className="logo-container">
                <a href="https://www.fdp-hessen.de" target="_blank" rel="noopener noreferrer">
                 <img 
                   src="/logo.png" 
                   alt="FDP Hessen Logo" 
                   className="fdp-logo"
                 />
                 </a>
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="section" style={{ background: 'var(--fdp-yellow)' }}>
        <div className="container">
          <h2 className="section-title" style={{ color: 'var(--fdp-black)' }}>
            Unsere Mission
          </h2>
          <div className="about-grid">
            <div className="mission-card">
              <div className="text-4xl mb-4 benefit-icon">⚡</div>
              <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--fdp-magenta)' }}>
                Effizienz
              </h3>
              <p className="text-gray-700">
                Durch systematische Problemanalyse helfen wir dabei, Verwaltungsprozesse zu optimieren.
              </p>
            </div>
            <div className="mission-card">
              <div className="text-4xl mb-4 benefit-icon">🎯</div>
              <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--fdp-magenta)' }}>
                Transparenz
              </h3>
              <p className="text-gray-700">
                Wir machen Bürokratieprozesse sichtbar und nachvollziehbar für alle Bürger.
              </p>
            </div>
            <div className="mission-card">
              <div className="text-4xl mb-4 benefit-icon">🤝</div>
              <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--fdp-magenta)' }}>
                Bürgerbeteiligung
              </h3>
              <p className="text-gray-700">
                Wir geben Bürgern eine Stimme und ermöglichen aktive Teilhabe an der Verwaltungsgestaltung.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Wie funktioniert es?</h2>
          <div className="about-grid">
            <div className="process-step">
              <span className="step-number">1</span>
              <h3 className="text-lg font-bold mb-3">Problem melden</h3>
              <p className="text-gray-600">
                Beschreiben Sie Ihr Bürokratieproblem einfach und anonym über unser Formular.
              </p>
            </div>
            <div className="process-step">
              <span className="step-number">2</span>
              <h3 className="text-lg font-bold mb-3">Prüfung & Kategorisierung</h3>
              <p className="text-gray-600">
                Unser Team prüft jede Meldung und ordnet sie in passende Kategorien ein.
              </p>
            </div>
            <div className="process-step">
              <span className="step-number">3</span>
              <h3 className="text-lg font-bold mb-3">Weiterleitung</h3>
              <p className="text-gray-600">
                Geprüfte Meldungen werden an die zuständigen Behörden sowie an den lokalen FDP-Kreisverband weitergeleitet.
              </p>
            </div>
            <div className="process-step">
              <span className="step-number">4</span>
              <h3 className="text-lg font-bold mb-3">Lösung & Feedback</h3>
              <p className="text-gray-600">
                Wir verfolgen den Fortschritt und geben Ihnen Feedback zu Ihrer Meldung.
              </p>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
    </>
  );
} 