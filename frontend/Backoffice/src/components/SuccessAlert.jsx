import React, { useState, useEffect } from 'react';

const SuccessAlert = ({
  title = 'Success',
  message,
  autoClose = true,
  duration = 5000,
  onClose
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, duration]);

  const handleClose = () => {
    setVisible(false);
    onClose?.();
  };

  if (!visible) return null;

  return (
    <div className="success-alert">
      <div className="alert-content">
        <div className="icon-container">
          <svg className="success-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="text-content">
          <h3 className="alert-title">{title}</h3>
          <p className="alert-message">{message}</p>
        </div>
        <button onClick={handleClose} className="close-button">
          <svg className="close-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <style jsx>{`
        .success-alert {
          max-width: 400px;
          margin: 0 auto 16px;
          background: #ffffff;
          border-left: 4px solid #10b981;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          padding: 16px;
          position: relative;
        }

        .alert-content {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .icon-container {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .success-icon {
          width: 20px;
          height: 20px;
          color: #10b981;
        }

        .text-content {
          flex: 1;
          min-width: 0;
        }

        .alert-title {
          margin: 0 0 4px 0;
          font-size: 14px;
          font-weight: 500;
          color: #065f46;
          line-height: 1.4;
        }

        .alert-message {
          margin: 0;
          font-size: 14px;
          color: #047857;
          line-height: 1.4;
        }

        .close-button {
          flex-shrink: 0;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          color: #6b7280;
          transition: color 0.2s ease;
        }

        .close-button:hover {
          color: #374151;
        }

        .close-button:focus {
          outline: none;
          box-shadow: 0 0 0 2px #10b981;
        }

        .close-icon {
          width: 16px;
          height: 16px;
        }
      `}</style>
    </div>
  );
};

export default SuccessAlert;