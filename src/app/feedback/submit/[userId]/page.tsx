import { notFound } from 'next/navigation';
import { FeedbackForm } from '@/components/FeedbackForm/FeedbackForm';
import { FeedbackSubmissionHandler } from '@/components/FeedbackForm/FeedbackSubmissionHandler';
import { getActiveSurvey, getUserProfile } from '@/lib/firebase/db';

export default async function SubmitFeedbackPage({
  params
}: {
  params: { userId: string }
}) {
  try {
    // Get the active survey
    const activeSurvey = await getActiveSurvey();
    if (!activeSurvey) {
      throw new Error('No active survey found');
    }

    // Get the user profile
    const userProfile = await getUserProfile(params.userId);
    if (!userProfile) {
      notFound();
    }

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Provide Feedback for {userProfile.name}
            </h1>
            <p className="text-gray-600">
              Please provide feedback based on observed behaviors and our team values.
              Your feedback will be anonymous in the final report.
            </p>
          </div>

          <FeedbackSubmissionHandler
            redirectUrl={`/feedback/${params.userId}`}
          >
            <FeedbackForm
              toUserId={params.userId}
              surveyId={activeSurvey.id}
            />
          </FeedbackSubmissionHandler>

          <div className="mt-8 p-4 bg-blue-50 rounded-md">
            <h2 className="text-lg font-medium text-blue-800 mb-2">
              About the Feedback Process
            </h2>
            <ul className="list-disc list-inside text-sm text-blue-700 space-y-2">
              <li>Feedback is collected anonymously every two months</li>
              <li>Focus on specific behaviors and examples</li>
              <li>Ratings should reflect observed behaviors, not personality</li>
              <li>Your feedback helps build a culture of trust and growth</li>
            </ul>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading feedback page:', error);
    notFound();
  }
} 