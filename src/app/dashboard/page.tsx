import { Metadata } from 'next';
import { getActiveSurvey } from '@/lib/firebase/db';
import ReportGenerator from '@/components/dashboard/ReportGenerator';
import { generateFeedbackReportFromSurvey } from '@/lib/utils/feedbackAnalysis';
import { FeedbackReport, SurveyResponse } from '@/lib/types/feedback';

export const metadata: Metadata = {
  title: 'Dashboard - HPT AI Insights',
  description: 'View and analyze feedback reports'
};

// Helper function to get survey responses
async function getSurveyResponses(surveyId: string): Promise<SurveyResponse[]> {
  // This would typically come from your database
  // For now, we'll return an empty array
  return [];
}

export default async function DashboardPage() {
  // Get active survey and responses
  const survey = await getActiveSurvey();
  const responses = survey ? await getSurveyResponses(survey.id) : [];
  
  // Generate feedback reports for each user
  const reports: FeedbackReport[] = [];
  if (survey && responses.length > 0) {
    // Group responses by user
    const userResponses = responses.reduce((acc: Record<string, SurveyResponse[]>, response: SurveyResponse) => {
      const userId = response.toUserId;
      if (!acc[userId]) {
        acc[userId] = [];
      }
      acc[userId].push(response);
      return acc;
    }, {});
    
    // Generate report for each user
    Object.entries(userResponses).forEach(([userId, userData]) => {
      const report = generateFeedbackReportFromSurvey(userId, survey.id, userData);
      reports.push(report);
    });
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Feedback Dashboard</h1>
      
      {/* Report Generator Component */}
      <div className="mb-8">
        <ReportGenerator 
          onReportGenerated={(report: FeedbackReport) => {
            // The ReportGenerator component will handle the file upload
            // and initial report generation. Our feedback analysis will
            // be used to process the uploaded data.
            console.log('Report generated:', report);
            // Here you would typically:
            // 1. Save the report to your database
            // 2. Update the UI to show the new report
            // 3. Trigger any necessary notifications
          }}
        />
      </div>
      
      {/* Display Generated Reports */}
      {reports.length > 0 && (
        <div className="space-y-8">
          <h2 className="text-2xl font-semibold mb-4">Generated Reports</h2>
          {reports.map(report => (
            <div 
              key={report.id}
              className="bg-white rounded-lg shadow p-6"
            >
              <h3 className="text-xl font-semibold mb-4">
                Feedback Report for User {report.userId}
              </h3>
              
              {/* Value Scores */}
              <div className="mb-6">
                <h4 className="text-lg font-medium mb-3">Value Scores</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(report.valueScores).map(([value, scores]) => (
                    <div 
                      key={value}
                      className="border rounded p-4"
                    >
                      <h5 className="font-medium mb-2">{value}</h5>
                      <p className="text-sm text-gray-600">
                        Average Score: {scores.averageScore.toFixed(1)}/5
                      </p>
                      {scores.strengths.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium">Strengths:</p>
                          <ul className="list-disc list-inside text-sm text-gray-600">
                            {scores.strengths.map((strength, i) => (
                              <li key={i}>{strength}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {scores.opportunities.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium">Opportunities:</p>
                          <ul className="list-disc list-inside text-sm text-gray-600">
                            {scores.opportunities.map((opp, i) => (
                              <li key={i}>{opp}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Stakeholder Alignment */}
              <div className="mb-6">
                <h4 className="text-lg font-medium mb-3">Stakeholder Alignment</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(report.stakeholderAlignment).map(([stakeholder, data]) => (
                    <div 
                      key={stakeholder}
                      className="border rounded p-4"
                    >
                      <h5 className="font-medium mb-2">{stakeholder}</h5>
                      <p className="text-sm text-gray-600">
                        Alignment: {data.alignment}%
                      </p>
                      {data.supportingEvidence.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium">Supporting Evidence:</p>
                          <ul className="list-disc list-inside text-sm text-gray-600">
                            {data.supportingEvidence.map((evidence, i) => (
                              <li key={i}>{evidence}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Overall Trends */}
              <div>
                <h4 className="text-lg font-medium mb-3">Overall Trends</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded p-4">
                    <h5 className="font-medium mb-2">Key Strengths</h5>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {report.overallTrends.strengths.map((strength, i) => (
                        <li key={i}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="border rounded p-4">
                    <h5 className="font-medium mb-2">Key Opportunities</h5>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {report.overallTrends.opportunities.map((opp, i) => (
                        <li key={i}>{opp}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="border rounded p-4">
                    <h5 className="font-medium mb-2">Recommended Actions</h5>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {report.overallTrends.actionItems.map((action, i) => (
                        <li key={i}>{action}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 