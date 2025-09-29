import React from 'react';
import Link from 'next/link';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitAnother: () => void;
}

export default function SuccessModal({ isOpen, onClose, onSubmitAnother }: SuccessModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="modal-backdrop" onClick={onClose} />
      
      {/* Modal */}
      <div className="success-modal">
        <div className="modal-content">
          {/* Header */}
          <div className="modal-header">
            <div className="success-icon">
              ✅
            </div>
            <h2 className="modal-title">
              Vielen Dank für Ihre Meldung!
            </h2>
            <button 
              onClick={onClose}
              className="close-button"
              aria-label="Schließen"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="modal-body">
            <div className="success-message">
              <p className="main-text">
                Ihre Meldung wurde erfolgreich eingereicht und ist bei uns angekommen.
              </p>
              
              <div className="info-box">
                <div className="info-icon">🔍</div>
                <div>
                  <strong>Was passiert jetzt?</strong>
                  <p>Wir prüfen Ihre Meldung, bevor wir sie im EntBüro-Mat veröffentlichen.</p>
                </div>
              </div>

              <div className="info-box">
                <div className="info-icon">⏱️</div>
                <div>
                  <strong>Zeitrahmen</strong>
                  <p>Die Überprüfung dauert in der Regel wenige Stunden bis maximal 
                  2 Werktage. Danach ist Ihre Meldung für alle sichtbar.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="modal-actions">
            <div className="main-actions">
              <button 
                onClick={onSubmitAnother}
                className="btn btn-primary btn-lg"
              >
                <span className="button-icon">➕</span>
                Weitere Meldung einreichen
              </button>
              
              <Link href="/issues" className="btn btn-secondary btn-lg">
                Alle Meldungen ansehen
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          z-index: 1000;
          animation: fadeIn 0.3s ease;
        }

        .success-modal {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 1001;
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          animation: slideIn 0.3s ease;
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          overflow: hidden;
        }

        .modal-header {
          position: relative;
          padding: 32px 32px 24px;
          background: linear-gradient(135deg, var(--fdp-yellow), #fbbf24);
          text-align: center;
        }

        .success-icon {
          font-size: 64px;
          margin-bottom: 16px;
          animation: bounce 0.6s ease;
        }

        .modal-title {
          font-family: "field-gothic-no-75-bold-wide", "Inter", sans-serif;
          font-weight: 700;
          font-size: 24px;
          color: var(--fdp-black);
          margin: 0;
          line-height: 1.2;
        }

        .close-button {
          position: absolute;
          top: 16px;
          right: 16px;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 18px;
          color: var(--fdp-black);
          transition: all 0.2s ease;
        }

        .close-button:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.1);
        }

        .modal-body {
          padding: 32px;
        }

        .success-message .main-text {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 24px;
          text-align: center;
          line-height: 1.5;
        }

        .info-box {
          display: flex;
          gap: 16px;
          margin-bottom: 20px;
          padding: 20px;
          background: #f8fafc;
          border-radius: 12px;
          border-left: 4px solid var(--fdp-magenta);
        }

        .info-box:last-child {
          margin-bottom: 0;
        }

        .info-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .info-box strong {
          display: block;
          font-family: "field-gothic-no-75-bold-wide", "Inter", sans-serif;
          font-weight: 700;
          color: var(--fdp-black);
          margin-bottom: 8px;
          font-size: 16px;
        }

        .info-box p {
          margin: 0;
          color: #4b5563;
          font-size: 14px;
          line-height: 1.5;
        }

        .modal-actions {
          padding: 24px 32px 32px;
          background: #f9fafb;
          border-top: 1px solid #e5e7eb;
        }

        .main-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
        }

        .main-actions .btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          font-size: 16px;
          padding: 16px 24px;
          text-align: center;
        }

        .button-icon {
          font-size: 18px;
        }



        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translate(-50%, -60%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }

        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% {
            transform: translate3d(0, 0, 0);
          }
          40%, 43% {
            transform: translate3d(0, -8px, 0);
          }
          70% {
            transform: translate3d(0, -4px, 0);
          }
          90% {
            transform: translate3d(0, -2px, 0);
          }
        }

        @media (max-width: 768px) {
          .success-modal {
            width: 95%;
            max-height: 95vh;
          }

          .modal-header {
            padding: 24px 24px 20px;
          }

          .success-icon {
            font-size: 48px;
            margin-bottom: 12px;
          }

          .modal-title {
            font-size: 20px;
          }

          .modal-body {
            padding: 24px;
          }

          .success-message .main-text {
            font-size: 16px;
            margin-bottom: 20px;
          }

          .info-box {
            padding: 16px;
            gap: 12px;
          }

          .info-box strong {
            font-size: 14px;
          }

          .info-box p {
            font-size: 13px;
          }

          .modal-actions {
            padding: 20px 24px 24px;
          }

          .main-actions {
            flex-direction: column;
            gap: 12px;
          }

          .main-actions .btn {
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .modal-header {
            padding: 20px 20px 16px;
          }

          .modal-body {
            padding: 20px;
          }

          .modal-actions {
            padding: 16px 20px 20px;
          }
        }
      `}</style>
    </>
  );
}
