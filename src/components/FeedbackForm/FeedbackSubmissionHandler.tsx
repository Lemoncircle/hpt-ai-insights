'use client';

import React, { useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface FeedbackSubmissionHandlerProps {
  children: ReactNode;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  redirectUrl?: string;
}

interface FeedbackFormProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  [key: string]: any;
}

export const FeedbackSubmissionHandler: React.FC<FeedbackSubmissionHandlerProps> = ({
  children,
  onSuccess,
  onError,
  redirectUrl
}) => {
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSuccess = () => {
    setShowSuccess(true);
    onSuccess?.();
    
    // Auto-hide success message and redirect after 3 seconds
    setTimeout(() => {
      setShowSuccess(false);
      if (redirectUrl) {
        router.push(redirectUrl);
      }
    }, 3000);
  };

  const handleError = (error: Error) => {
    setErrorMessage(error.message);
    setShowError(true);
    onError?.(error);
    
    // Auto-hide error message after 5 seconds
    setTimeout(() => {
      setShowError(false);
    }, 5000);
  };

  return (
    <>
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span>Feedback submitted successfully!</span>
        </div>
      )}

      {/* Error Toast */}
      {showError && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          <span>Error: {errorMessage}</span>
        </div>
      )}

      {/* Render children with handlers */}
      {React.Children.map(children, child => {
        if (React.isValidElement<FeedbackFormProps>(child)) {
          return React.cloneElement(child, {
            onSuccess: handleSuccess,
            onError: handleError
          });
        }
        return child;
      })}
    </>
  );
}; 