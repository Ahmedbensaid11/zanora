import React, { useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

const CustomModal = ({
  isVisible = false,
  title,
  subtitle = '',
  primaryText = 'Submit',
  cancelText = 'Cancel',
  loadingText = 'Loading...',
  loading = false,
  primaryDisabled = false,
  showFooter = true,
  size = 'medium',
  closeOnOverlay = true,
  danger = false,
  onClose,
  onPrimaryAction,
  onSubmit,
  children
}) => {
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isVisible]);

  const handleOverlayClick = () => {
    if (closeOnOverlay) onClose?.();
  };

  const handlePrimaryAction = () => {
    onPrimaryAction?.();
    onSubmit?.();
  };

  if (!isVisible) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className={`modal-container modal-${size}`} onClick={(e) => e.stopPropagation()}>

        <div className="modal-header">
          <div className="modal-title-section">
            <h3 className="modal-title">{title}</h3>
            {subtitle && <p className="modal-subtitle">{subtitle}</p>}
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          {children}
        </div>

        {showFooter && (
          <div className="modal-footer">
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-cancel"
                onClick={onClose}
                disabled={loading}
              >
                {cancelText}
              </button>
              <button
                type="button"
                className={`btn btn-primary ${danger ? 'btn-danger' : ''}`}
                onClick={handlePrimaryAction}
                disabled={loading || primaryDisabled}
              >
                {loading && <span className="btn-loading-spinner"></span>}
                {loading ? loadingText : primaryText}
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: var(--z-modal);               /* ← was 10000 */
          padding: 20px;
          backdrop-filter: blur(2px);
        }

        .modal-container {
          background: var(--color-bg-surface);   /* ← was #2A2D2C */
          border-radius: var(--radius-xl);        /* ← was 12px */
          box-shadow: var(--shadow-xl);           /* ← was 0 20px 60px rgba(0,0,0,0.3) */
          max-height: calc(100vh - 40px);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          animation: modalSlideIn 0.3s ease-out;
        }

        @keyframes modalSlideIn {
          from { opacity: 0; transform: translateY(-20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)     scale(1);    }
        }

        .modal-small  { width: 100%; max-width: 400px; }
        .modal-medium { width: 100%; max-width: 600px; }
        .modal-large  { width: 100%; max-width: 800px; }

        .modal-header {
          padding: 24px 24px 16px 24px;
          border-bottom: 1px solid var(--color-border-subtle);  /* ← was #e5e7eb */
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          background: var(--color-bg-surface);   /* ← was #2A2D2C */
        }

        .modal-title-section {
          flex: 1;
        }

        .modal-title {
          margin: 0;
          font-size: var(--font-size-xl);         /* ← was 20px */
          font-weight: var(--font-weight-semibold); /* ← was 600 */
          color: var(--color-text-primary);       /* ← was #FFFFFF */
          line-height: 1.3;
        }

        .modal-subtitle {
          margin: 4px 0 0 0;
          font-size: var(--font-size-base);       /* ← was 14px */
          color: var(--color-text-primary);       /* ← was #FFFFFF */
          line-height: 1.4;
        }

        .modal-close-btn {
          background: none;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: var(--radius-lg);        /* ← was 8px */
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-secondary);     /* ← was #6b7280 */
          cursor: pointer;
          transition: var(--transition-fast);     /* ← was all 0.2s ease */
          margin-left: 16px;
        }

        .modal-close-btn:hover {
          background-color: var(--color-gray-100); /* ← was #f3f4f6 */
          color: var(--color-gray-700);             /* ← was #374151 */
        }

        .modal-body {
          padding: 24px;
          flex: 1;
          overflow-y: auto;
          max-height: calc(100vh - 200px);
        }

        .modal-body::-webkit-scrollbar       { width: 6px; }
        .modal-body::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 3px; }
        .modal-body::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        .modal-body::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

        .modal-footer {
          padding: 16px 24px 24px 24px;
          border-top: 1px solid var(--color-border-subtle);  /* ← was #e5e7eb */
          background: var(--color-bg-surface);               /* ← was #2A2D2C */
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: var(--radius-lg);        /* ← was 8px */
          font-size: var(--font-size-base);       /* ← was 14px */
          font-weight: var(--font-weight-medium); /* ← was 500 */
          cursor: pointer;
          transition: var(--transition-fast);     /* ← was all 0.2s ease */
          display: inline-flex;
          align-items: center;
          gap: 8px;
          position: relative;
          min-width: 80px;
          justify-content: center;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-cancel {
          background-color: #f8fafc;
          color: #64748b;
          border: 1px solid #e2e8f0;
        }

        .btn-cancel:hover:not(:disabled) {
          background-color: #f1f5f9;
          border-color: #cbd5e1;
        }

        .btn-primary {
          background-color: var(--color-primary);      /* ← was #0e9695 */
          color: var(--color-text-primary);            /* ← was #FFFFFF */
          border: 1px solid var(--color-teal-dark);    /* ← was #059669 */
        }

        .btn-primary:hover:not(:disabled) {
          background-color: var(--color-primary-hover); /* ← was #047857 */
          border-color: var(--color-primary-hover);
        }

        .btn-primary.btn-danger {
          background-color: var(--color-danger);       /* ← was #dc2626 */
          border-color: var(--color-danger-hover);     /* ← was #b91c1c */
        }

        .btn-primary.btn-danger:hover:not(:disabled) {
          background-color: var(--color-danger-hover); /* ← was #b91c1c */
          border-color: var(--color-danger-dark);      /* ← was #991b1b */
        }

        .btn-loading-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: var(--radius-circle);         /* ← was 50% */
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .modal-overlay   { padding: 10px; }
          .modal-container { border-radius: var(--radius-lg); max-height: calc(100vh - 20px); }
          .modal-header    { padding: 20px 16px 12px 16px; }
          .modal-body      { padding: 20px 16px; }
          .modal-footer    { padding: 12px 16px 20px 16px; }

          .modal-actions   { flex-direction: column-reverse; gap: 8px; }
          .btn             { width: 100%; }
          .modal-title     { font-size: var(--font-size-lg); }  /* ← was 18px */
        }

        @media (max-width: 480px) {
          .modal-small,
          .modal-medium,
          .modal-large { max-width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default CustomModal;