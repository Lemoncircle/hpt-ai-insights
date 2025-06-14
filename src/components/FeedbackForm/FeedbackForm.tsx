"use client";

import React, { useState } from 'react';
import { Value, VALUE_DEFINITIONS, Rating } from '@/lib/types/feedback';
import { submitFeedback } from '@/lib/firebase/db';

interface FeedbackFormProps {
  toUserId: string;
  surveyId: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const FeedbackForm: React.FC<FeedbackFormProps> = ({
  toUserId,
  surveyId,
  onSuccess,
  onError
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentValue, setCurrentValue] = useState<Value>('Collaboration');
  const [ratings, setRatings] = useState<Record<Value, Rating>>({
    Collaboration: 3,
    Respect: 3,
    Transparency: 3,
    Communication: 3
  });
  const [feedback, setFeedback] = useState<Record<Value, string>>({
    Collaboration: '',
    Respect: '',
    Transparency: '',
    Communication: ''
  });

  const handleRatingChange = (value: Value, rating: Rating) => {
    setRatings(prev => ({ ...prev, [value]: rating }));
  };

  const handleFeedbackChange = (value: Value, text: string) => {
    setFeedback(prev => ({ ...prev, [value]: text }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Submit feedback for each value
      const submissions = Object.entries(ratings).map(([value, rating]) => 
        submitFeedback({
          fromUserId: 'current-user-id', // This should come from auth context
          toUserId,
          surveyId,
          value: value as Value,
          rating,
          qualitativeFeedback: feedback[value as Value],
          timestamp: new Date()
        })
      );

      await Promise.all(submissions);
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      onError?.(error as Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const valueDefinition = VALUE_DEFINITIONS.find(v => v.value === currentValue);

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Peer Feedback Form</h2>
      
      {/* Value Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Value to Provide Feedback On
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {VALUE_DEFINITIONS.map(({ value }) => (
            <button
              key={value}
              type="button"
              onClick={() => setCurrentValue(value)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                currentValue === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {/* Value Description */}
      {valueDefinition && (
        <div className="mb-6 p-4 bg-gray-50 rounded-md">
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            {valueDefinition.value}
          </h3>
          <p className="text-gray-600 mb-3">{valueDefinition.description}</p>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Behavioral Definitions:
          </h4>
          <ul className="list-disc list-inside text-sm text-gray-600">
            {valueDefinition.behavioralDefinitions.map((def, index) => (
              <li key={index}>{def}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Rating Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rating for {currentValue}
        </label>
        <div className="flex gap-4">
          {([1, 2, 3, 4, 5] as Rating[]).map(rating => (
            <button
              key={rating}
              type="button"
              onClick={() => handleRatingChange(currentValue, rating)}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium ${
                ratings[currentValue] === rating
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {rating}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>Needs Improvement</span>
          <span>Exceeds Expectations</span>
        </div>
      </div>

      {/* Qualitative Feedback */}
      <div className="mb-6">
        <label 
          htmlFor="feedback"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Qualitative Feedback
        </label>
        <textarea
          id="feedback"
          rows={4}
          value={feedback[currentValue]}
          onChange={(e) => handleFeedbackChange(currentValue, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="Provide specific examples of observed behaviors..."
          required
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-6 py-2 rounded-md text-white font-medium ${
            isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </div>
    </form>
  );
}; 