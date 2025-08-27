import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQuery } from 'react-query';
import { submitIssue, getCategories } from '../utils/api';
import toast, { Toaster } from 'react-hot-toast';

export default function MeldenPage() {
  const router = useRouter();
  const { description: initialDescription } = router.query;

  const [formData, setFormData] = useState({
    title: '',
    description: (initialDescription as string) || '',
    category: '',
    location: '',
    issue_type: 'communal' as 'communal' | 'state' | 'federal',
    is_anonymous: true,
    submitter_name: '',
    submitter_email: '',
    submitter_contact: ''
  });

  const [attachment, setAttachment] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch categories
  const { data: categoriesData } = useQuery('categories', getCategories);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate required fields before submission
      if (!formData.title.trim() || formData.title.trim().length < 10) {
        toast.error('Titel muss mindestens 10 Zeichen lang sein');
        return;
      }
      
      if (!formData.description.trim() || formData.description.trim().length < 20) {
        toast.error('Beschreibung muss mindestens 20 Zeichen lang sein');
        return;
      }
      
      if (!formData.category) {
        toast.error('Bitte wählen Sie eine Kategorie');
        return;
      }
      
      if (!formData.issue_type) {
        toast.error('Bitte wählen Sie eine Zuständigkeitsebene');
        return;
      }

      // Prepare clean submission data
      const submissionData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        location: formData.location.trim() || undefined,
        issue_type: formData.issue_type,
        is_anonymous: formData.is_anonymous,
        submitter_name: formData.is_anonymous ? undefined : formData.submitter_name.trim(),
        submitter_email: formData.is_anonymous ? undefined : formData.submitter_email.trim(),
        submitter_contact: formData.submitter_contact.trim() || undefined,
        attachment: attachment || undefined
      };
      
      console.log('Submitting data:', submissionData);
      
      await submitIssue(submissionData);
      toast.success('Ihre Meldung wurde erfolgreich eingereicht und wird nach Prüfung veröffentlicht!');
      
      // Redirect to issues page after successful submission
      setTimeout(() => {
        router.push('/issues');
      }, 3000);
      
    } catch (error: any) {
      console.error('Error:', error);
      if (error.message && error.message.includes('Validation failed')) {
        toast.error(error.message);
      } else {
        toast.error('Fehler beim Senden der Meldung');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Datei ist zu groß. Maximum: 10MB');
        return;
      }
      setAttachment(file);
    }
  };

  return (
    <>
      <Head>
        <title>Problem melden - EntBüro-Mat</title>
        <meta name="description" content="Melden Sie Ihr Bürokratie-Problem ausführlich und anonym." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Header */}
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

      {/* Main Content */}
      <main>
        {/* Page Header */}
        <section className="hero" style={{ minHeight: '40vh' }}>
          <div className="container">
            <div className="hero-content">
              <h1>Problem melden</h1>
              <p>
                Beschreiben Sie Ihr Bürokratie-Problem ausführlich. 
                Ihre Meldung hilft dabei, Verbesserungen zu schaffen.
              </p>
              <div className="moderation-notice">
                <span>📋</span>
                <span>Ihre Meldung wird nach einer kurzen Prüfung veröffentlicht</span>
              </div>
            </div>
          </div>
        </section>

        {/* Form Section */}
        <section className="form-section">
          <div className="container">
            <div className="form-container">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Titel des Problems *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="form-input"
                    required
                    placeholder="z.B. Lange Wartezeiten im Bürgeramt"
                    minLength={10}
                    maxLength={255}
                  />
                  <small className="form-help">Mindestens 10 Zeichen</small>
                </div>

                <div className="form-group">
                  <label className="form-label">Ausführliche Beschreibung *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="form-textarea"
                    required
                    placeholder="Beschreiben Sie das Problem ausführlich... Was ist passiert? Wann und wo? Welche Auswirkungen hatte es?"
                    minLength={20}
                    maxLength={5000}
                    rows={8}
                  ></textarea>
                  <small className="form-help">Mindestens 20 Zeichen, maximal 5000 Zeichen</small>
                </div>

                <div className="form-group">
                  <label className="form-label">Kategorie *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="form-select"
                    required
                  >
                    <option value="">Bitte wählen Sie eine Kategorie</option>
                    {categoriesData?.categories?.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Ort (optional)</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="z.B. Frankfurt, Wiesbaden, Kassel..."
                    maxLength={255}
                  />
                  <small className="form-help">Hilft bei der Zuordnung zur zuständigen Stelle</small>
                </div>

                <div className="form-group">
                  <label className="form-label">Zuständigkeitsebene *</label>
                  <select
                    name="issue_type"
                    value={formData.issue_type}
                    onChange={handleChange}
                    className="form-select"
                    required
                  >
                    <option value="">Bitte wählen</option>
                    <option value="communal">Kommunal (Stadt/Gemeinde)</option>
                    <option value="state">Landesebene (Hessen)</option>
                    <option value="federal">Bundesebene</option>
                  </select>
                  <small className="form-help">Wer ist Ihrer Einschätzung nach zuständig?</small>
                </div>

                <div className="form-group">
                  <label className="form-label">Anhang (optional)</label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="form-input"
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                  />
                  <small className="form-help">
                    Erlaubte Dateien: Bilder (JPG, PNG), PDFs, Word-Dokumente. Maximal 10MB.
                  </small>
                  {attachment && (
                    <div className="file-info">
                      <span>📎 {attachment.name}</span>
                      <button 
                        type="button" 
                        onClick={() => setAttachment(null)}
                        className="remove-file"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="is_anonymous"
                        checked={formData.is_anonymous}
                        onChange={handleChange}
                      />
                      <span className="checkmark"></span>
                      <span className="checkbox-text">Anonym melden</span>
                    </label>
                    <small className="form-help">
                      Empfohlen: Ihre Daten werden nicht öffentlich angezeigt
                    </small>
                  </div>
                </div>

                {!formData.is_anonymous && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Ihr Name *</label>
                      <input
                        type="text"
                        name="submitter_name"
                        value={formData.submitter_name}
                        onChange={handleChange}
                        className="form-input"
                        required={!formData.is_anonymous}
                        placeholder="Vor- und Nachname"
                        maxLength={255}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">E-Mail-Adresse *</label>
                      <input
                        type="email"
                        name="submitter_email"
                        value={formData.submitter_email}
                        onChange={handleChange}
                        className="form-input"
                        required={!formData.is_anonymous}
                        placeholder="ihre.email@beispiel.de"
                        maxLength={255}
                      />
                      <small className="form-help">
                        Für Rückfragen und Updates zu Ihrer Meldung
                      </small>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Telefon (optional)</label>
                      <input
                        type="tel"
                        name="submitter_contact"
                        value={formData.submitter_contact}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="Telefonnummer für Rückfragen"
                        maxLength={255}
                      />
                    </div>
                  </>
                )}

                <div className="form-actions">
                  <button 
                    type="button"
                    onClick={() => router.back()}
                    className="btn btn-secondary"
                    style={{ marginRight: '20px' }}
                  >
                    Zurück
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Wird gesendet...' : 'Problem melden'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
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
            <div className="footer-section">
              <h3>FDP Hessen</h3>
              <p>Für mehr Transparenz und Effizienz in der Verwaltung.</p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 EntBüro-Mat. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </footer>

      <Toaster position="top-right" />

      <style jsx>{`
        .form-help {
          display: block;
          margin-top: 5px;
          font-size: 12px;
          color: #6b7280;
          font-style: italic;
        }

        .checkbox-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          font-weight: 500;
        }

        .checkbox-label input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: var(--fdp-magenta);
        }

        .checkbox-text {
          font-family: "field-gothic-no-75-bold-wide", "Inter", sans-serif;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--fdp-black);
        }

        .file-info {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 8px;
          padding: 8px 12px;
          background: #f3f4f6;
          border-radius: 6px;
          font-size: 14px;
        }

        .remove-file {
          background: none;
          border: none;
          color: #dc2626;
          cursor: pointer;
          font-weight: bold;
          padding: 0;
          margin-left: auto;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          margin-top: 40px;
          padding-top: 30px;
          border-top: 2px solid #f3f4f6;
        }

        .moderation-notice {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 20px;
          padding: 16px 20px;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 8px;
          border-left: 4px solid var(--fdp-yellow);
          color: var(--fdp-black);
          font-size: 16px;
          font-weight: 500;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .moderation-notice span:first-child {
          font-size: 20px;
        }

        @media (max-width: 768px) {
          .form-actions {
            flex-direction: column;
            gap: 15px;
          }

          .form-actions .btn {
            width: 100%;
            margin-right: 0 !important;
          }

          .moderation-notice {
            font-size: 14px;
            padding: 12px 16px;
          }
        }
      `}</style>
    </>
  );
} 