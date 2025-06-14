// Define the core values and their behavioral definitions
export type Value = 'Collaboration' | 'Respect' | 'Transparency' | 'Communication';

export interface ValueDefinition {
  value: Value;
  description: string;
  behavioralDefinitions: string[];
}

// Define the stakeholder types and their expectations
export type StakeholderType = 'PeopleWeHelp' | 'Supporters' | 'Referrers';

export interface StakeholderExpectation {
  type: StakeholderType;
  expectations: string[];
}

// Define the feedback rating scale
export type Rating = 1 | 2 | 3 | 4 | 5;

// Define the feedback entry structure
export interface FeedbackEntry {
  id: string;
  fromUserId: string; // Anonymous in reports but tracked in DB
  toUserId: string;
  value: Value;
  rating: Rating;
  qualitativeFeedback: string;
  timestamp: Date;
  surveyId: string;
}

// Define the survey structure
export interface FeedbackSurvey {
  id: string;
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'active' | 'closed';
  participants: string[]; // User IDs
  completedResponses: string[]; // Feedback Entry IDs
}

// Define the survey response structure
export interface SurveyResponse {
  id: string;
  toUserId: string;
  fromUserId?: string;
  timestamp: Date;
  answers: Record<string, string | number>;
  comments?: Record<string, string>;
}

// Define the feedback report structure
export interface FeedbackReport {
  id: string;
  userId: string;
  surveyId: string;
  generatedAt: Date;
  valueScores: {
    [key in Value]: {
      averageScore: number;
      trend: 'improving' | 'stable' | 'declining';
      strengths: string[];
      opportunities: string[];
      supportingQuotes: string[];
    };
  };
  stakeholderAlignment: {
    [key in StakeholderType]: {
      alignment: number; // 0-100 percentage
      supportingEvidence: string[];
    };
  };
  overallTrends: {
    strengths: string[];
    opportunities: string[];
    actionItems: string[];
  };
}

// Define the user profile structure
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  joinDate: Date;
  feedbackHistory: string[]; // Array of FeedbackReport IDs
}

// Constants for value definitions
export const VALUE_DEFINITIONS: ValueDefinition[] = [
  {
    value: 'Collaboration',
    description: 'Working together effectively as a team',
    behavioralDefinitions: [
      'Engage the right people',
      'Share calendars and information',
      'Create space for team thinking',
      'Contribute to visibility'
    ]
  },
  {
    value: 'Respect',
    description: 'Showing consideration for others',
    behavioralDefinitions: [
      'Consider others\' time and needs',
      'Balance work demands respectfully'
    ]
  },
  {
    value: 'Transparency',
    description: 'Being open and honest in communication',
    behavioralDefinitions: [
      'Provide timely, direct feedback',
      'Share information that affects work',
      'Avoid withholding relevant context'
    ]
  },
  {
    value: 'Communication',
    description: 'Clear and effective information sharing',
    behavioralDefinitions: [
      'Be open about challenges and day-to-day experience',
      'Ensure consistent external updates'
    ]
  }
];

// Constants for stakeholder expectations
export const STAKEHOLDER_EXPECTATIONS: StakeholderExpectation[] = [
  {
    type: 'PeopleWeHelp',
    expectations: [
      'Pets go home safely and in good condition',
      'Clear communication',
      'Timely updates',
      'Ability to rely on us despite limited proof'
    ]
  },
  {
    type: 'Supporters',
    expectations: [
      'Appreciate transparency and proof of impact',
      'Want donations used responsibly'
    ]
  },
  {
    type: 'Referrers',
    expectations: [
      'Clear, timely comms (within 12 hrs)',
      'Regular updates',
      'Smooth logistics',
      'Ability to rely on us'
    ]
  }
]; 