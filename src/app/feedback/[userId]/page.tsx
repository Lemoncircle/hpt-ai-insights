import { notFound } from 'next/navigation';
import { FeedbackReportView } from '@/components/FeedbackReport/FeedbackReportView';
import { FeedbackReport, FeedbackEntry } from '@/lib/types/feedback';
import { generateFeedbackReport } from '@/lib/utils/feedbackAnalysis';

// This would typically come from your database
async function fetchUserFeedback(userId: string): Promise<{
  entries: FeedbackEntry[];
  userName: string;
}> {
  // TODO: Replace with actual database fetch
  // This is mock data for demonstration
  const mockEntries: FeedbackEntry[] = [
    {
      id: '1',
      fromUserId: 'peer1',
      toUserId: userId,
      value: 'Collaboration',
      rating: 4,
      qualitativeFeedback: 'Always engages the right people and shares information effectively.',
      timestamp: new Date(),
      surveyId: 'survey1'
    },
    {
      id: '2',
      fromUserId: 'peer2',
      toUserId: userId,
      value: 'Respect',
      rating: 5,
      qualitativeFeedback: 'Consistently considers others\' time and balances work demands well.',
      timestamp: new Date(),
      surveyId: 'survey1'
    },
    {
      id: '3',
      fromUserId: 'peer3',
      toUserId: userId,
      value: 'Transparency',
      rating: 4,
      qualitativeFeedback: 'Provides timely feedback and shares relevant context.',
      timestamp: new Date(),
      surveyId: 'survey1'
    },
    {
      id: '4',
      fromUserId: 'peer4',
      toUserId: userId,
      value: 'Communication',
      rating: 3,
      qualitativeFeedback: 'Could improve on providing more regular updates.',
      timestamp: new Date(),
      surveyId: 'survey1'
    }
  ];

  return {
    entries: mockEntries,
    userName: 'John Doe' // This would come from your user database
  };
}

export default async function FeedbackReportPage({
  params
}: {
  params: { userId: string }
}) {
  try {
    const { entries, userName } = await fetchUserFeedback(params.userId);
    
    // Generate the feedback report
    const report: FeedbackReport = generateFeedbackReport(
      params.userId,
      'survey1', // This would come from your survey context
      entries
    );
    
    return (
      <div className="min-h-screen bg-gray-50">
        <FeedbackReportView
          report={report}
          userName={userName}
        />
      </div>
    );
  } catch (error) {
    console.error('Error fetching feedback report:', error);
    notFound();
  }
} 