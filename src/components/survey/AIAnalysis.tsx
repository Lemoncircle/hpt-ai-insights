'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface AIAnalysisProps {
  responses: Record<string | number, string>;
  questions: Array<{
    id: number;
    question: string;
    type: string;
    section: string;
  }>;
}

export default function AIAnalysis({ responses, questions }: AIAnalysisProps) {
  const [analysis, setAnalysis] = useState<{
    traits: string;
    growth: string;
    managerSupport: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const analyzeResponses = async () => {
      try {
        setLoading(true);
        setError(null);

        // Format the responses and questions for AI analysis
        const formattedData = questions.map(q => ({
          question: q.question,
          answer: responses[q.id] || 'No response',
          section: q.section
        }));

        console.log('Sending analysis request with data:', formattedData);

        // Use absolute URL path
        const response = await fetch('/api/analyze-responses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ responses: formattedData }),
          cache: 'no-store'
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error Response:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText
          });
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Received analysis response:', data);

        if (data.error) {
          throw new Error(data.error);
        }

        setAnalysis(data);
      } catch (err) {
        console.error('Error analyzing responses:', err);
        setError('Unable to generate analysis at this time. Please try again later.');
        
        // Retry logic for temporary failures
        if (retryCount < 2) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 2000); // Wait 2 seconds before retrying
        }
      } finally {
        setLoading(false);
      }
    };

    if (Object.keys(responses).length > 0) {
      analyzeResponses();
    } else {
      setLoading(false);
    }
  }, [responses, questions, retryCount]);

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <p className="text-sm text-gray-600">
            Analyzing responses{retryCount > 0 ? ` (Attempt ${retryCount + 1}/3)` : ''}...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <svg
            className="h-5 w-5 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-gray-50 rounded-lg p-6 space-y-6"
    >
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
          <svg
            className="h-4 w-4 mr-2 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          Individual Traits
        </h4>
        <p className="text-sm text-gray-600 leading-relaxed">{analysis.traits}</p>
      </div>
      
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
          <svg
            className="h-4 w-4 mr-2 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          Growth Opportunities
        </h4>
        <p className="text-sm text-gray-600 leading-relaxed">{analysis.growth}</p>
      </div>
      
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
          <svg
            className="h-4 w-4 mr-2 text-purple-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          Manager Support Recommendations
        </h4>
        <p className="text-sm text-gray-600 leading-relaxed">{analysis.managerSupport}</p>
      </div>
    </motion.div>
  );
} 