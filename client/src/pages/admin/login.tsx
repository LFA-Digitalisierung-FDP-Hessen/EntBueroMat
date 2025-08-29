import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import Head from 'next/head';
import { adminLogin } from '../../utils/api';

interface LoginForm {
  email: string;
  password: string;
}

export default function AdminLogin() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await adminLogin({
        username: data.email, // Backend expects username field but we send email
        password: data.password
      });
      localStorage.setItem('auth_token', response.token);
      toast.success('Erfolgreich angemeldet!', { duration: 4000 });
      router.push('/admin');
    } catch (error: any) {
      console.error('Login error:', error);
      const message = error.response?.data?.error || 'Anmeldung fehlgeschlagen';
      toast.error(message, { duration: 4000 });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Admin Login - EntBüro-Mat</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="login-page">
        {/* Hero Background */}
        <div className="login-hero">
          <div className="container">
            <div className="login-container">
              <div className="login-header">
                <div className="logo-section">
                  <div className="logo">EntBüro-Mat</div>
                  <span className="admin-badge">Admin</span>
                </div>
                <h1 className="login-title">Administration</h1>
                <p className="login-subtitle">
                  Melden Sie sich an, um das Admin-Panel zu verwenden
                </p>
              </div>

              <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
                <div className="form-group">
                  <label className="form-label">E-Mail-Adresse</label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    className={`form-input ${errors.email ? 'error' : ''}`}
                    placeholder="admin@fdp-hessen.de"
                    {...register('email', { 
                      required: 'E-Mail-Adresse ist erforderlich',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Ungültige E-Mail-Adresse'
                      }
                    })}
                  />
                  {errors.email && (
                    <p className="error-message">{errors.email.message}</p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Passwort</label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className={`form-input ${errors.password ? 'error' : ''}`}
                    placeholder="••••••••"
                    {...register('password', { 
                      required: 'Passwort ist erforderlich' 
                    })}
                  />
                  {errors.password && (
                    <p className="error-message">{errors.password.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary login-btn"
                >
                  {isLoading ? (
                    <>
                      <span className="loading-spinner"></span>
                      Anmelden...
                    </>
                  ) : (
                    'Anmelden'
                  )}
                </button>

                <div className="back-link">
                  <button
                    type="button"
                    onClick={() => router.push('/')}
                    className="text-link"
                  >
                    ← Zurück zur Startseite
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-page {
          min-height: 100vh;
          background: linear-gradient(135deg, var(--fdp-yellow) 0%, var(--fdp-magenta) 100%);
          display: flex;
          align-items: center;
          font-family: 'Inter', sans-serif;
        }

        .login-hero {
          width: 100%;
          padding: 2rem 0;
        }

        .container {
          max-width: 500px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        .login-container {
          background: var(--fdp-white);
          border-radius: 12px;
          padding: 3rem 2.5rem;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
          border: 3px solid rgba(255, 255, 255, 0.2);
        }

        .login-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .logo-section {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .logo {
          font-family: "field-gothic-no-75-bold-wide", "Inter", sans-serif;
          font-size: 2rem;
          font-weight: 700;
          color: var(--fdp-magenta);
        }

        .admin-badge {
          background: var(--fdp-yellow);
          color: var(--fdp-black);
          padding: 0.5rem 1rem;
          border-radius: 1.5rem;
          font-size: 0.875rem;
          font-weight: 700;
          font-family: "field-gothic-no-75-bold-wide", "Inter", sans-serif;
        }

        .login-title {
          font-family: "field-gothic-no-75-bold-wide", "Inter", sans-serif;
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--fdp-black);
          margin-bottom: 0.75rem;
        }

        .login-subtitle {
          color: #6b7280;
          font-size: 1rem;
          line-height: 1.5;
        }

        .login-form {
          space-y: 1.5rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-label {
          display: block;
          font-family: "field-gothic-no-75-bold-wide", "Inter", sans-serif;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: var(--fdp-black);
          font-size: 0.875rem;
        }

        .form-input {
          width: 100%;
          padding: 1rem;
          border: 2px solid var(--fdp-magenta);
          border-radius: 8px;
          font-size: 1rem;
          font-family: 'Inter', sans-serif;
          background: var(--fdp-white);
          transition: all 0.3s ease;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--fdp-yellow);
          box-shadow: 0 0 0 3px rgba(255, 237, 0, 0.3);
          background: #fffef0;
        }

        .form-input.error {
          border-color: #ef4444;
        }

        .form-input::placeholder {
          color: #9ca3af;
        }

        .error-message {
          margin-top: 0.5rem;
          font-size: 0.875rem;
          color: #ef4444;
          font-weight: 500;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 1rem 2rem;
          border: none;
          cursor: pointer;
          font-family: "field-gothic-no-75-bold-wide", "Inter", sans-serif;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.3s ease;
          border-radius: 8px;
          font-size: 1rem;
        }

        .btn-primary {
          background-color: var(--fdp-magenta);
          color: var(--fdp-white);
        }

        .btn-primary:hover:not(:disabled) {
          background-color: var(--fdp-yellow);
          color: var(--fdp-black);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(229, 0, 125, 0.3);
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .login-btn {
          width: 100%;
          margin-top: 1rem;
          margin-bottom: 1.5rem;
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .back-link {
          text-align: center;
          padding-top: 1rem;
          border-top: 1px solid #e5e7eb;
        }

        .text-link {
          background: none;
          border: none;
          color: var(--fdp-magenta);
          font-weight: 600;
          cursor: pointer;
          transition: color 0.3s ease;
          font-size: 0.875rem;
        }

        .text-link:hover {
          color: var(--fdp-yellow);
          text-decoration: underline;
        }

        @media (max-width: 640px) {
          .container {
            padding: 0 1rem;
          }

          .login-container {
            padding: 2rem 1.5rem;
          }

          .login-title {
            font-size: 2rem;
          }

          .logo {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </>
  );
} 