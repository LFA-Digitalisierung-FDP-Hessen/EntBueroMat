import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from 'react-query';
import { submitIssue, getCategories } from '../utils/api';
import toast from 'react-hot-toast';
import SuccessModal from './SuccessModal';

interface FormData {
  title: string;
  description: string;
  category: string;
  location: string;
  issueType: 'communal' | 'state' | 'federal';
  isAnonymous: boolean;
  contactEmail?: string;
  contactName?: string;
  attachment?: FileList;
}

interface IssueSubmissionFormProps {
  onSuccess?: () => void;
}

export default function IssueSubmissionForm({ onSuccess }: IssueSubmissionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<FormData>({
    defaultValues: {
      isAnonymous: true,
      issueType: 'communal'
    }
  });
  
  const isAnonymous = watch('isAnonymous');
  const issueType = watch('issueType');

  // Fetch categories from API
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery(
    'categories',
    getCategories
  );

  const submitMutation = useMutation(submitIssue, {
    onSuccess: () => {
      setShowSuccessModal(true);
      reset();
      onSuccess?.();
    },
    onError: () => {
      toast('Uups! Da ist was schiefgelaufen. Bitte nochmal versuchen.', {
        icon: '❌',
        style: {
          background: '#EF4444',
          color: 'white',
        },
      });
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Set automatic location defaults for state and federal levels
      let finalLocation = data.location.trim();
      if (!finalLocation) {
        if (data.issueType === 'state') {
          finalLocation = 'Hessen';
        } else if (data.issueType === 'federal') {
          finalLocation = 'Deutschland';
        }
      }
      
      const submissionData = {
        title: data.title,
        description: data.description,
        category: data.category,
        location: finalLocation,
        issue_type: data.issueType,
        is_anonymous: data.isAnonymous,
        submitter_name: data.isAnonymous ? undefined : data.contactName,
        submitter_email: data.isAnonymous ? undefined : data.contactEmail,
        attachment: data.attachment?.[0],
      };
      
      await submitMutation.mutateAsync(submissionData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
  };

  const handleSubmitAnother = () => {
    setShowSuccessModal(false);
    // Form is already reset by the mutation onSuccess callback
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8 text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          Kurz & ehrlich: Was hat genervt?
        </h3>
        <p className="text-gray-600">
          Sie müssen keine Namen nennen – einfach erzählen, was passiert ist.
        </p>
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-center">
            <span className="text-yellow-600 mr-2">🔒</span>
            <span className="text-sm text-yellow-800 font-medium">
              Ihre Meldung kann anonym bleiben.
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Main Problem Description */}
        <div className="form-group">
          <label className="form-label" htmlFor="description">
            <span className="flex items-center">
              <span className="text-lg mr-2">💭</span>
              Was ist passiert?
            </span>
          </label>
          <textarea
            id="description"
            placeholder="Erzählen Sie einfach, was Sie genervt hat. Je konkreter, desto besser können wir helfen..."
            className={`form-textarea ${errors.description ? 'form-error' : ''}`}
            rows={6}
            {...register('description', { 
              required: 'Bitte beschreiben Sie das Problem',
              minLength: { value: 50, message: 'Bitte beschreiben Sie das Problem etwas ausführlicher (mindestens 50 Zeichen)' }
            })}
          />
          {errors.description && (
            <span className="form-error-message">{errors.description.message}</span>
          )}
        </div>

        {/* Title */}
        <div className="form-group">
          <label className="form-label" htmlFor="title">
            <span className="flex items-center">
              <span className="text-lg mr-2">📝</span>
              Kurze Zusammenfassung
            </span>
          </label>
          <input
            id="title"
            type="text"
            placeholder="z.B. 'Endlos lange Wartezeiten im Bürgeramt'"
            className={`form-input ${errors.title ? 'form-error' : ''}`}
            {...register('title', { 
              required: 'Bitte geben Sie eine kurze Zusammenfassung an',
              maxLength: { value: 100, message: 'Die Zusammenfassung sollte maximal 100 Zeichen lang sein' }
            })}
          />
          {errors.title && (
            <span className="form-error-message">{errors.title.message}</span>
          )}
        </div>

        {/* Category */}
        <div className="form-group">
          <label className="form-label" htmlFor="category">
            <span className="flex items-center">
              <span className="text-lg mr-2">🏷️</span>
              Bereich
            </span>
          </label>
          <select
            id="category"
            className={`form-select ${errors.category ? 'form-error' : ''}`}
            {...register('category', { required: 'Bitte wählen Sie einen Bereich aus' })}
            disabled={categoriesLoading}
          >
            <option value="">
              {categoriesLoading ? 'Laden...' : 'Bereich auswählen...'}
            </option>
            {categoriesData?.categories?.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
          {errors.category && (
            <span className="form-error-message">{errors.category.message}</span>
          )}
        </div>

        {/* Issue Type */}
        <div className="form-group">
          <label className="form-label" htmlFor="issueType">
            <span className="flex items-center">
              <span className="text-lg mr-2">🏛️</span>
              Zuständigkeitsebene
            </span>
          </label>
          <select
            id="issueType"
            className={`form-select ${errors.issueType ? 'form-error' : ''}`}
            {...register('issueType', { required: 'Bitte wählen Sie eine Zuständigkeitsebene aus' })}
          >
            <option value="">Zuständigkeitsebene auswählen...</option>
            <option value="communal">Kommunal (Stadt/Gemeinde)</option>
            <option value="state">Landesebene (Hessen)</option>
            <option value="federal">Bundesebene</option>
          </select>
          {errors.issueType && (
            <span className="form-error-message">{errors.issueType.message}</span>
          )}
        </div>

        {/* Location */}
        <div className="form-group">
          <label className="form-label" htmlFor="location">
            <span className="flex items-center">
              <span className="text-lg mr-2">📍</span>
              Ort / Behörde {issueType === 'communal' ? '*' : '(optional)'}
            </span>
          </label>
          <input
            id="location"
            type="text"
            placeholder={
              issueType === 'communal' 
                ? "z.B. 'Frankfurt', 'Wiesbaden Bürgeramt' oder 'Landkreis Darmstadt'"
                : issueType === 'state'
                ? "z.B. Frankfurt, Wiesbaden (optional - wenn leer wird 'Hessen' verwendet)"
                : issueType === 'federal'
                ? "z.B. Frankfurt, Wiesbaden (optional - wenn leer wird 'Deutschland' verwendet)"
                : "z.B. 'Frankfurt', 'Wiesbaden Bürgeramt' oder 'Landkreis Darmstadt'"
            }
            className={`form-input ${errors.location ? 'form-error' : ''}`}
            {...register('location', {
              required: issueType === 'communal' ? 'Bei kommunalen Problemen ist die Ortsangabe verpflichtend' : false,
              minLength: issueType === 'communal' ? { value: 2, message: 'Bitte geben Sie einen gültigen Ort an' } : undefined
            })}
          />
          <p className="text-sm text-gray-600 mt-1">
            {issueType === 'communal' 
              ? 'Ortsangabe ist bei kommunalen Problemen verpflichtend'
              : issueType === 'state'
              ? 'Bei Landesproblemen ohne Ortsangabe wird automatisch "Hessen" verwendet'
              : issueType === 'federal'
              ? 'Bei Bundesproblemen ohne Ortsangabe wird automatisch "Deutschland" verwendet'
              : 'Hilft bei der Zuordnung zur zuständigen Stelle'
            }
          </p>
          {errors.location && (
            <span className="form-error-message">{errors.location.message}</span>
          )}
        </div>

        {/* File Upload */}
        <div className="form-group">
          <label className="form-label" htmlFor="attachment">
            <span className="flex items-center">
              <span className="text-lg mr-2">📎</span>
              Dokument anhängen (optional)
            </span>
          </label>
          <div className="mt-2">
            <input
              id="attachment"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-blue-700 hover:file:bg-yellow-100"
              {...register('attachment')}
            />
            <p className="mt-2 text-xs text-gray-500">
              PDF, Word, oder Bilder (max. 10MB)
            </p>
          </div>
        </div>

        {/* Anonymity Toggle */}
        <div className="form-group">
          <div className="bg-gray-50 rounded-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-start">
              <input
                id="isAnonymous"
                type="checkbox"
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                {...register('isAnonymous')}
              />
              <div className="ml-3">
                <label htmlFor="isAnonymous" className="font-medium text-gray-900 cursor-pointer">
                  <span className="flex items-center">
                    <span className="text-lg mr-2">🔒</span>
                    Anonym melden
                  </span>
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  Ihr Name wird nicht angezeigt oder gespeichert. Empfohlen für maximale Anonymität.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information (only if not anonymous) */}
        {!isAnonymous && (
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-lg mr-2">📧</span>
              Kontaktdaten (optional)
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Falls wir Rückfragen haben oder Sie über den Fortschritt informieren möchten.
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="form-label" htmlFor="contactName">
                  Name
                </label>
                <input
                  id="contactName"
                  type="text"
                  placeholder="Ihr Name"
                  className="form-input"
                  {...register('contactName')}
                />
              </div>
              <div>
                <label className="form-label" htmlFor="contactEmail">
                  E-Mail
                </label>
                <input
                  id="contactEmail"
                  type="email"
                  placeholder="ihre.email@beispiel.de"
                  className="form-input"
                  {...register('contactEmail')}
                />
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary btn-lg w-full"
          >
            {isSubmitting ? (
              <>
                <div className="spinner mr-2"></div>
                Wird gesendet...
              </>
            ) : (
              <>
                <span className="text-xl mr-2">🚀</span>
                Abschicken
              </>
            )}
          </button>
          <p className="text-center text-sm text-gray-500 mt-3">
            Jetzt abschicken – dauert nur Sekunden.
          </p>
          <p className="text-center text-xs text-gray-400 mt-2">
            Wir prüfen das kurz. Dann erscheint Ihre Meldung hier.
          </p>
        </div>
      </form>

      <SuccessModal 
        isOpen={showSuccessModal}
        onClose={handleCloseSuccessModal}
        onSubmitAnother={handleSubmitAnother}
      />
    </div>
  );
} 