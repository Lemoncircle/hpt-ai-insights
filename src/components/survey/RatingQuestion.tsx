'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface RatingQuestionProps {
  question: string;
  onAnswer: (answer: string) => void;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, scale: 0.8 },
  show: { opacity: 1, scale: 1 }
};

export default function RatingQuestion({ question, onAnswer }: RatingQuestionProps) {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const ratings = [1, 2, 3, 4, 5];

  return (
    <div className="space-y-8">
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-gray-900"
      >
        {question}
      </motion.h2>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="flex justify-center space-x-4"
      >
        {ratings.map((rating) => (
          <motion.button
            key={rating}
            variants={item}
            onClick={() => onAnswer(rating.toString())}
            onMouseEnter={() => setHoveredRating(rating)}
            onMouseLeave={() => setHoveredRating(null)}
            className={`
              w-16 h-16 rounded-full flex items-center justify-center text-xl font-semibold
              transition-all duration-200
              ${
                hoveredRating && rating <= hoveredRating
                  ? 'bg-blue-500 text-white transform scale-110'
                  : 'bg-gray-100 text-gray-600 hover:bg-blue-100'
              }
            `}
          >
            {rating}
          </motion.button>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center text-sm text-gray-500"
      >
        {hoveredRating ? (
          <span>
            {hoveredRating === 1
              ? 'Not at all familiar'
              : hoveredRating === 2
              ? 'Slightly familiar'
              : hoveredRating === 3
              ? 'Moderately familiar'
              : hoveredRating === 4
              ? 'Very familiar'
              : 'Extremely familiar'}
          </span>
        ) : (
          'Hover over a rating to see description'
        )}
      </motion.div>
    </div>
  );
} 