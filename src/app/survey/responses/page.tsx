'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { format } from 'date-fns';
import FileUpload from '@/components/survey/FileUpload';
import AIAnalysis from '@/components/survey/AIAnalysis';
import ResponsChart from '@/components/survey/ResponsChart';
import { motion } from 'framer-motion';

interface Question {
  id: number;
  type: 'text' | 'multiChoice';
  question: string;
  options?: string[];
  section: string;
}

interface SurveyResponse {
  id: string;
  userId: string;
  userEmail?: string;
  answers?: Record<string | number, string>;
  responses?: Record<string | number, string>;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
  importedFrom?: string;
  submittedAt?: string;
}

interface GroupedResponses {
  [section: string]: {
    question: string;
    responses: string[];
    type: 'text' | 'multiChoice';
  }[];
}

const questions: Question[] = [
  // Section 1: General Engagement & Work Satisfaction
  {
    id: 1,
    type: 'multiChoice',
    question: 'How satisfied are you with your current role?',
    options: [
      'Very satisfied',
      'Somewhat satisfied',
      'Neutral',
      'Somewhat dissatisfied',
      'Very dissatisfied'
    ],
    section: 'General Engagement & Work Satisfaction'
  },
  {
    id: 2,
    type: 'multiChoice',
    question: 'Do you feel that your contributions are valued by your team and leadership?',
    options: [
      'Always',
      'Most of the time',
      'Sometimes',
      'Rarely',
      'Never'
    ],
    section: 'General Engagement & Work Satisfaction'
  },
  {
    id: 3,
    type: 'multiChoice',
    question: 'How would you describe the communication within your team?',
    options: [
      'Excellent – Clear, open, and effective',
      'Good – Mostly clear but can be improved',
      'Average – Sometimes unclear',
      'Poor – Often unclear or ineffective',
      'Very poor – Lack of communication'
    ],
    section: 'General Engagement & Work Satisfaction'
  },
  {
    id: 4,
    type: 'multiChoice',
    question: 'Do you feel supported in your professional growth and development?',
    options: [
      'Yes, I receive strong support',
      'Somewhat, but I would like more guidance',
      'Neutral',
      'Not really, I feel limited in opportunities',
      'No, there is little to no support'
    ],
    section: 'General Engagement & Work Satisfaction'
  },
  {
    id: 5,
    type: 'multiChoice',
    question: 'How would you rate your work-life balance?',
    options: [
      'Excellent – I can manage both well',
      'Good – I balance it most of the time',
      'Average – It could be better',
      'Poor – I struggle with balance',
      'Very poor – Work dominates my life'
    ],
    section: 'General Engagement & Work Satisfaction'
  },
  // Section 2: MBTI-Inspired Work Style & Team Dynamics
  {
    id: 6,
    type: 'multiChoice',
    question: 'How do you prefer to make decisions at work?',
    options: [
      'Based on logic, facts, and objective analysis',
      'Based on personal values, emotions, and team dynamics'
    ],
    section: 'MBTI-Inspired Work Style & Team Dynamics'
  },
  {
    id: 7,
    type: 'multiChoice',
    question: 'Which working style suits you best?',
    options: [
      'Working alone with minimal interruptions',
      'Collaborating with others regularly',
      'A mix of both'
    ],
    section: 'MBTI-Inspired Work Style & Team Dynamics'
  },
  {
    id: 8,
    type: 'multiChoice',
    question: 'How do you approach new challenges?',
    options: [
      'I analyze the situation carefully before acting',
      'I take an intuitive approach and adapt as I go'
    ],
    section: 'MBTI-Inspired Work Style & Team Dynamics'
  },
  {
    id: 9,
    type: 'multiChoice',
    question: 'How do you prefer to receive feedback?',
    options: [
      'Direct and to the point',
      'With a balance of positive reinforcement and constructive criticism',
      'Indirectly, through observations and gradual improvement suggestions'
    ],
    section: 'MBTI-Inspired Work Style & Team Dynamics'
  },
  {
    id: 10,
    type: 'multiChoice',
    question: 'What best describes your approach to planning and structure at work?',
    options: [
      'I prefer a well-structured plan with clear steps',
      'I like flexibility and adjusting plans as needed'
    ],
    section: 'MBTI-Inspired Work Style & Team Dynamics'
  },
  // Section 3: Open Feedback
  {
    id: 11,
    type: 'text',
    question: 'What is one thing the company could do to improve your experience at work?',
    section: 'Open Feedback'
  }
];

export default function ResponsesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  }>({ key: 'createdAt', direction: 'desc' });
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [deletingResponse, setDeletingResponse] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchResponses = async () => {
    try {
      const q = query(collection(db, 'survey_responses'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedResponses = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SurveyResponse[];
      console.log('Fetched responses:', fetchedResponses);
      setResponses(fetchedResponses);
    } catch (error) {
      console.error('Error fetching responses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }

    fetchResponses();
  }, [user, router]);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredAndSortedResponses = responses
    .filter(response => {
      const responseData = response.answers || response.responses || {};
      const searchString = [
        response.userEmail,
        ...Object.values(responseData)
      ].join(' ').toLowerCase();
      return searchString.includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      if (sortConfig.key === 'createdAt' && a.createdAt && b.createdAt) {
        return sortConfig.direction === 'asc'
          ? a.createdAt.seconds - b.createdAt.seconds
          : b.createdAt.seconds - a.createdAt.seconds;
      }
      return 0;
    });

  const renderResponseDetail = (response: SurveyResponse) => {
    // Get the response data and ensure it's properly formatted
    const responseData = response.answers || response.responses || {};
    
    // Format the data for AI Analysis
    const formattedResponses: Record<string | number, string> = {};
    Object.entries(responseData).forEach(([key, value]) => {
      // Convert string keys to numbers if they're numeric
      const numericKey = !isNaN(Number(key)) ? Number(key) : key;
      if (typeof value === 'string') {
        formattedResponses[numericKey] = value;
      }
    });
    
    return (
      <div className="space-y-6">
        {/* AI Analysis Section */}
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">AI Analysis</h3>
          <AIAnalysis responses={formattedResponses} questions={questions} />
        </div>

        {/* Individual Responses Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Individual Responses</h3>
          {questions.map((q) => (
            <div key={q.id} className="border-b border-gray-200 pb-4 last:border-b-0">
              <h4 className="text-base font-medium mb-2 text-gray-700">{q.question}</h4>
              <p className="text-gray-600">{formattedResponses[q.id] || 'No response'}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleDeleteResponse = async (responseId: string) => {
    try {
      setIsDeleting(true);
      console.log('Attempting to delete response:', responseId);
      
      // Check if user is authenticated
      if (!user) {
        throw new Error('User not authenticated');
      }
      console.log('User authenticated:', user.uid);

      // Get the ID token
      const idToken = await user.getIdToken();

      // Call the API endpoint with authorization header
      const response = await fetch('/api/survey/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ responseId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to delete response');
      }

      console.log('Document successfully deleted');
      await fetchResponses();
      setDeletingResponse(null);
    } catch (error: any) {
      console.error('Detailed error deleting response:', {
        error,
        errorMessage: error.message,
        responseId,
        userId: user?.uid
      });
      
      alert('Failed to delete response. Please try again or contact support if the issue persists.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAllResponses = async () => {
    try {
      setIsDeleting(true);
      console.log('Attempting to delete all responses');
      
      // Check if user is authenticated
      if (!user) {
        throw new Error('User not authenticated');
      }
      console.log('User authenticated:', user.uid);

      // Get the ID token
      const idToken = await user.getIdToken();

      // Delete responses one by one using the API endpoint
      const deletePromises = responses.map(response => 
        fetch('/api/survey/delete', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({ responseId: response.id }),
        })
      );
      
      await Promise.all(deletePromises);
      console.log('All responses successfully deleted');
      
      await fetchResponses();
      setShowDeleteAllDialog(false);
    } catch (error: any) {
      console.error('Detailed error deleting all responses:', {
        error,
        errorMessage: error.message,
        userId: user?.uid,
        numberOfResponses: responses.length
      });
      
      alert('Failed to delete responses. Please try again or contact support if the issue persists.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto pt-20 px-4">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <Navbar />
      <main className="max-w-7xl mx-auto pt-20 px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Survey Responses</h1>
              <p className="mt-1 text-sm text-gray-500">
                {responses.length} total {responses.length === 1 ? 'response' : 'responses'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search responses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg
                  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowUpload(!showUpload)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <span>Import CSV</span>
                </button>
                {responses.length > 0 && (
                  <button
                    onClick={() => setShowDeleteAllDialog(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                    disabled={isDeleting}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    <span>Delete All</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* File Upload Section */}
          {showUpload && (
            <div className="mb-8 p-6 bg-gray-50 rounded-lg">
              <FileUpload onUploadComplete={() => {
                setShowUpload(false);
                fetchResponses();
              }} />
            </div>
          )}

          {/* Responses List */}
          <div className="space-y-4">
            {filteredAndSortedResponses.length > 0 ? (
              filteredAndSortedResponses.map((response, index) => (
                <div key={response.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Respondent #{index + 1}
                        {response.userEmail && (
                          <span className="ml-2 text-sm text-gray-500">
                            ({response.userEmail})
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Submitted {format(new Date(response.submittedAt || response.createdAt.seconds * 1000), 'PPpp')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedResponse(selectedResponse === response.id ? null : response.id)}
                        className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        {selectedResponse === response.id ? 'Hide Details' : 'View Details'}
                      </button>
                      <button
                        onClick={() => setDeletingResponse(response.id)}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        disabled={isDeleting}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Response Details */}
                  {selectedResponse === response.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-4 pt-4 border-t"
                    >
                      {renderResponseDetail(response)}
                    </motion.div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                No responses found. {searchTerm ? 'Try adjusting your search.' : 'Share your survey to get started!'}
              </div>
            )}
          </div>

          {/* Delete Single Response Confirmation Dialog */}
          {deletingResponse && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Confirm Delete</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this response? This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setDeletingResponse(null)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteResponse(deletingResponse)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                        Deleting...
                      </>
                    ) : (
                      'Delete'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete All Responses Confirmation Dialog */}
          {showDeleteAllDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Confirm Delete All</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete all {responses.length} responses? This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowDeleteAllDialog(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAllResponses}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                        Deleting...
                      </>
                    ) : (
                      'Delete All'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 