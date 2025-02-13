'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import TextQuestion from '@/components/survey/TextQuestion';
import MultiChoiceQuestion from '@/components/survey/MultiChoiceQuestion';
import RatingQuestion from '@/components/survey/RatingQuestion';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

// Define the question types and structure
interface Question {
  id: number;
  type: 'text' | 'multiChoice' | 'rating';
  question: string;
  options?: string[];
  section: string;
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

export default function SurveyPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNext = async (answer: string) => {
    const newAnswers = { ...answers, [questions[currentQuestion].id]: answer };
    setAnswers(newAnswers);
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setIsSubmitting(true);
      try {
        const surveyResponse = {
          userId: user?.uid || 'anonymous',
          userEmail: user?.email || 'anonymous',
          answers: newAnswers,
          submittedAt: new Date().toISOString(),
        };

        console.log('Submitting survey response:', surveyResponse);

        // First try to save to Firestore
        try {
          const surveyCollection = collection(db, 'survey_responses');
          const docRef = await addDoc(surveyCollection, {
            ...surveyResponse,
            createdAt: serverTimestamp(),
          });
          console.log('Survey response saved to Firestore successfully with ID:', docRef.id);
        } catch (firestoreError: unknown) {
          console.error('Firestore save failed:', firestoreError);
          // Fallback to localStorage
          const localResponses = JSON.parse(localStorage.getItem('survey_responses') || '[]');
          localResponses.push(surveyResponse);
          localStorage.setItem('survey_responses', JSON.stringify(localResponses));
          console.log('Survey response saved to localStorage as fallback');
        }

        setIsCompleted(true);
      } catch (error: unknown) {
        console.error('Error submitting survey:', error);
        setIsSubmitting(false);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
      }
    }
  };

  const handleViewResponses = () => {
    router.push('/survey/responses');
  };

  const renderQuestion = () => {
    const question = questions[currentQuestion];

    switch (question.type) {
      case 'text':
        return (
          <TextQuestion
            question={question.question}
            onAnswer={handleNext}
          />
        );
      case 'multiChoice':
        return (
          <MultiChoiceQuestion
            question={question.question}
            options={question.options || []}
            onAnswer={handleNext}
          />
        );
      case 'rating':
        return (
          <RatingQuestion
            question={question.question}
            onAnswer={handleNext}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto pt-20 px-4">
        {!isCompleted ? (
          <div className="space-y-8">
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              />
            </div>

            {/* Question container */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-lg shadow-lg p-8"
              >
                {renderQuestion()}
              </motion.div>
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-lg p-8 text-center"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Thank you!</h2>
            <p className="text-gray-600 mb-8">Your responses have been recorded.</p>
            {user && (
              <button
                onClick={handleViewResponses}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View All Responses
              </button>
            )}
          </motion.div>
        )}

        {isSubmitting && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
              <p className="mt-4 text-gray-600">Saving your responses...</p>
              <p className="mt-2 text-sm text-gray-500">This may take a few seconds</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 