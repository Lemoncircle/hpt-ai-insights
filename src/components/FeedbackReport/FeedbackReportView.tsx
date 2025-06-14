import React from 'react';
import { FeedbackReport, Value, StakeholderType } from '@/lib/types/feedback';

interface FeedbackReportViewProps {
  report: FeedbackReport;
  userName: string;
}

// Helper component for value score display
const ValueScoreCard: React.FC<{
  value: Value;
  score: FeedbackReport['valueScores'][Value];
}> = ({ value, score }) => (
  <div className="bg-white rounded-lg shadow-md p-6 mb-4">
    <h3 className="text-xl font-semibold text-gray-800 mb-4">{value}</h3>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-sm text-gray-600">Average Score</p>
        <p className="text-2xl font-bold text-blue-600">{score.averageScore.toFixed(1)}</p>
      </div>
      <div>
        <p className="text-sm text-gray-600">Trend</p>
        <p className={`text-lg font-medium ${
          score.trend === 'improving' ? 'text-green-600' :
          score.trend === 'declining' ? 'text-red-600' :
          'text-yellow-600'
        }`}>
          {score.trend.charAt(0).toUpperCase() + score.trend.slice(1)}
        </p>
      </div>
    </div>
    
    {score.strengths.length > 0 && (
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Strengths</h4>
        <ul className="list-disc list-inside text-sm text-gray-600">
          {score.strengths.map((strength, index) => (
            <li key={index}>{strength}</li>
          ))}
        </ul>
      </div>
    )}
    
    {score.opportunities.length > 0 && (
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Opportunities for Growth</h4>
        <ul className="list-disc list-inside text-sm text-gray-600">
          {score.opportunities.map((opportunity, index) => (
            <li key={index}>{opportunity}</li>
          ))}
        </ul>
      </div>
    )}
    
    {score.supportingQuotes.length > 0 && (
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Supporting Feedback</h4>
        <div className="space-y-2">
          {score.supportingQuotes.map((quote, index) => (
            <blockquote key={index} className="text-sm text-gray-600 italic border-l-4 border-blue-200 pl-4">
              "{quote}"
            </blockquote>
          ))}
        </div>
      </div>
    )}
  </div>
);

// Helper component for stakeholder alignment display
const StakeholderAlignmentCard: React.FC<{
  type: StakeholderType;
  alignment: FeedbackReport['stakeholderAlignment'][StakeholderType];
}> = ({ type, alignment }) => (
  <div className="bg-white rounded-lg shadow-md p-6 mb-4">
    <h3 className="text-xl font-semibold text-gray-800 mb-4">
      {type.replace(/([A-Z])/g, ' $1').trim()}
    </h3>
    <div className="mb-4">
      <p className="text-sm text-gray-600 mb-2">Alignment Score</p>
      <div className="w-full bg-gray-200 rounded-full h-4">
        <div
          className="bg-blue-600 h-4 rounded-full"
          style={{ width: `${alignment.alignment}%` }}
        />
      </div>
      <p className="text-right text-sm text-gray-600 mt-1">
        {alignment.alignment}%
      </p>
    </div>
    
    {alignment.supportingEvidence.length > 0 && (
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Supporting Evidence</h4>
        <ul className="list-disc list-inside text-sm text-gray-600">
          {alignment.supportingEvidence.map((evidence, index) => (
            <li key={index}>{evidence}</li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

export const FeedbackReportView: React.FC<FeedbackReportViewProps> = ({
  report,
  userName
}) => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Feedback Report for {userName}
        </h1>
        <p className="text-gray-600">
          Generated on {report.generatedAt.toLocaleDateString()}
        </p>
      </div>
      
      {/* Overall Trends Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Overall Trends</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-3">Key Strengths</h3>
            <ul className="list-disc list-inside text-sm text-gray-600">
              {report.overallTrends.strengths.map((strength, index) => (
                <li key={index}>{strength}</li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-3">Growth Opportunities</h3>
            <ul className="list-disc list-inside text-sm text-gray-600">
              {report.overallTrends.opportunities.map((opportunity, index) => (
                <li key={index}>{opportunity}</li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-3">Recommended Actions</h3>
            <ul className="list-disc list-inside text-sm text-gray-600">
              {report.overallTrends.actionItems.map((action, index) => (
                <li key={index}>{action}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      
      {/* Value Scores Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Value-Based Assessment</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(report.valueScores).map(([value, score]) => (
            <ValueScoreCard
              key={value}
              value={value as Value}
              score={score}
            />
          ))}
        </div>
      </div>
      
      {/* Stakeholder Alignment Section */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Stakeholder Alignment</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(report.stakeholderAlignment).map(([type, alignment]) => (
            <StakeholderAlignmentCard
              key={type}
              type={type as StakeholderType}
              alignment={alignment}
            />
          ))}
        </div>
      </div>
    </div>
  );
}; 