'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface ResponsChartProps {
  responses: string[];
  question: string;
}

export default function ResponsChart({ responses, question }: ResponsChartProps) {
  const stats = useMemo(() => {
    const counts: { [key: string]: number } = {};
    let total = 0;
    
    responses.forEach(response => {
      if (response === 'No response') return;
      counts[response] = (counts[response] || 0) + 1;
      total++;
    });
    
    return Object.entries(counts).map(([option, count]) => ({
      option,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    })).sort((a, b) => b.count - a.count);
  }, [responses]);

  const getBarColor = (percentage: number) => {
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 50) return 'bg-blue-500';
    if (percentage >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-4">
      {stats.map(({ option, count, percentage }, index) => (
        <div key={option} className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span className="font-medium">{option}</span>
            <span>
              {count} {count === 1 ? 'response' : 'responses'} ({percentage}%)
            </span>
          </div>
          <motion.div
            className="h-2.5 bg-gray-200 rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <motion.div
              className={`h-full ${getBarColor(percentage)} rounded-full`}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            />
          </motion.div>
        </div>
      ))}

      {stats.length === 0 && (
        <div className="text-center text-gray-500 py-4">
          No responses yet
        </div>
      )}
    </div>
  );
} 