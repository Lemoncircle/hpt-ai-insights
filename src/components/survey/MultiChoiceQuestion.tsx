'use client';

import { motion } from 'framer-motion';

interface MultiChoiceQuestionProps {
  question: string;
  options: string[];
  onAnswer: (answer: string) => void;
  isLastQuestion?: boolean;
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
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function MultiChoiceQuestion({
  question,
  options,
  onAnswer,
  isLastQuestion = false
}: MultiChoiceQuestionProps) {
  return (
    <div className="space-y-6">
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
        className="space-y-3"
      >
        {options.map((option, index) => (
          <motion.div key={option} variants={item}>
            <button
              onClick={() => onAnswer(option)}
              className="w-full p-4 text-left bg-white border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span className="inline-flex items-center">
                <span className="w-6 h-6 flex items-center justify-center rounded-full border border-gray-300 mr-3">
                  {String.fromCharCode(65 + index)}
                </span>
                {option}
                {isLastQuestion && index === options.length - 1 ? ' and Submit' : ''}
              </span>
            </button>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
} 