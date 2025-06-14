import { 
  FeedbackEntry, 
  FeedbackReport, 
  Value, 
  StakeholderType,
  VALUE_DEFINITIONS,
  STAKEHOLDER_EXPECTATIONS
} from '../types/feedback';

// Map survey questions to values
const SURVEY_TO_VALUE_MAP: Record<string, Value> = {
  'How well does the person collaborate with others?': 'Collaboration',
  'How respectful is the person in their interactions?': 'Respect',
  'How transparent is the person in their communication?': 'Transparency',
  'How effective is the person\'s communication?': 'Communication'
};

// Convert survey data to feedback entries
export const convertSurveyToFeedback = (
  surveyData: Record<string, any>[],
  userId: string,
  surveyId: string
): FeedbackEntry[] => {
  return surveyData.flatMap(response => {
    const entries: FeedbackEntry[] = [];
    
    // Process each question in the survey
    Object.entries(response).forEach(([question, answer]) => {
      const value = SURVEY_TO_VALUE_MAP[question];
      if (value) {
        // Convert answer to rating (assuming 1-5 scale)
        let rating: number;
        if (typeof answer === 'number') {
          rating = answer;
        } else if (typeof answer === 'string') {
          // Convert text answers to ratings
          const lowerAnswer = answer.toLowerCase();
          if (lowerAnswer.includes('excellent') || lowerAnswer.includes('always')) {
            rating = 5;
          } else if (lowerAnswer.includes('very good') || lowerAnswer.includes('usually')) {
            rating = 4;
          } else if (lowerAnswer.includes('good') || lowerAnswer.includes('sometimes')) {
            rating = 3;
          } else if (lowerAnswer.includes('fair') || lowerAnswer.includes('rarely')) {
            rating = 2;
          } else {
            rating = 1;
          }
        } else {
          rating = 3; // Default to neutral if can't determine
        }

        entries.push({
          id: `${response.id}-${value}`,
          fromUserId: response.fromUserId || 'anonymous',
          toUserId: userId,
          value,
          rating: rating as 1 | 2 | 3 | 4 | 5,
          qualitativeFeedback: response[`${question}_comments`] || '',
          timestamp: new Date(response.timestamp || Date.now()),
          surveyId
        });
      }
    });

    return entries;
  });
};

// Calculate average score for a specific value
export const calculateValueScore = (
  entries: FeedbackEntry[],
  value: Value
): number => {
  const valueEntries = entries.filter(entry => entry.value === value);
  if (valueEntries.length === 0) return 0;
  
  const sum = valueEntries.reduce((acc, entry) => acc + entry.rating, 0);
  return sum / valueEntries.length;
};

// Identify trends in qualitative feedback
export const analyzeQualitativeFeedback = (
  entries: FeedbackEntry[],
  value: Value
): { strengths: string[]; opportunities: string[]; quotes: string[] } => {
  const valueEntries = entries.filter(entry => entry.value === value);
  
  // Group similar feedback using simple keyword matching
  const feedbackGroups = new Map<string, string[]>();
  
  valueEntries.forEach(entry => {
    const feedback = entry.qualitativeFeedback.toLowerCase();
    const isPositive = entry.rating >= 4;
    
    // Extract key phrases (this is a simple implementation - could be enhanced with NLP)
    const keyPhrases = feedback.split(/[.,!?]/).filter(phrase => phrase.length > 10);
    
    keyPhrases.forEach(phrase => {
      const category = isPositive ? 'strength' : 'opportunity';
      const existing = feedbackGroups.get(category) || [];
      feedbackGroups.set(category, [...existing, phrase.trim()]);
    });
  });
  
  // Filter out one-off comments (mentioned only once)
  const filterOneOffs = (comments: string[]): string[] => {
    const commentCount = new Map<string, number>();
    comments.forEach(comment => {
      commentCount.set(comment, (commentCount.get(comment) || 0) + 1);
    });
    return comments.filter(comment => (commentCount.get(comment) || 0) > 1);
  };
  
  return {
    strengths: filterOneOffs(feedbackGroups.get('strength') || []),
    opportunities: filterOneOffs(feedbackGroups.get('opportunity') || []),
    quotes: valueEntries
      .filter(entry => entry.rating >= 4)
      .map(entry => entry.qualitativeFeedback)
      .slice(0, 3) // Limit to top 3 quotes
  };
};

// Calculate stakeholder alignment based on feedback
export const calculateStakeholderAlignment = (
  entries: FeedbackEntry[],
  stakeholderType: StakeholderType
): { alignment: number; evidence: string[] } => {
  const expectations = STAKEHOLDER_EXPECTATIONS.find(
    exp => exp.type === stakeholderType
  )?.expectations || [];
  
  // Map values to stakeholder expectations
  const valueToExpectationMap: Record<Value, string[]> = {
    Collaboration: ['Pets go home safely and in good condition', 'Smooth logistics'],
    Respect: ['Ability to rely on us despite limited proof', 'Ability to rely on us'],
    Transparency: ['Appreciate transparency and proof of impact', 'Clear communication'],
    Communication: ['Clear, timely comms', 'Regular updates', 'Timely updates']
  };
  
  // Calculate alignment score
  let totalScore = 0;
  let maxPossibleScore = 0;
  const evidence: string[] = [];
  
  Object.entries(valueToExpectationMap).forEach(([value, mappedExpectations]) => {
    const valueEntries = entries.filter(entry => entry.value === value);
    if (valueEntries.length === 0) return;
    
    const valueScore = calculateValueScore(valueEntries, value as Value);
    const relevantExpectations = mappedExpectations.filter(exp => 
      expectations.includes(exp)
    );
    
    if (relevantExpectations.length > 0) {
      totalScore += valueScore * relevantExpectations.length;
      maxPossibleScore += 5 * relevantExpectations.length; // 5 is max rating
      
      // Add supporting evidence
      const positiveFeedback = valueEntries
        .filter(entry => entry.rating >= 4)
        .map(entry => entry.qualitativeFeedback);
      evidence.push(...positiveFeedback);
    }
  });
  
  const alignment = maxPossibleScore > 0 
    ? Math.round((totalScore / maxPossibleScore) * 100)
    : 0;
    
  return {
    alignment,
    evidence: evidence.slice(0, 3) // Limit to top 3 pieces of evidence
  };
};

// Generate a complete feedback report from survey data
export const generateFeedbackReportFromSurvey = (
  userId: string,
  surveyId: string,
  surveyData: Record<string, any>[]
): FeedbackReport => {
  // Convert survey data to feedback entries
  const entries = convertSurveyToFeedback(surveyData, userId, surveyId);
  
  // Create properly typed value scores object
  const valueScores: FeedbackReport['valueScores'] = {
    Collaboration: {
      averageScore: calculateValueScore(entries, 'Collaboration'),
      trend: 'stable',
      strengths: analyzeQualitativeFeedback(entries, 'Collaboration').strengths,
      opportunities: analyzeQualitativeFeedback(entries, 'Collaboration').opportunities,
      supportingQuotes: analyzeQualitativeFeedback(entries, 'Collaboration').quotes
    },
    Respect: {
      averageScore: calculateValueScore(entries, 'Respect'),
      trend: 'stable',
      strengths: analyzeQualitativeFeedback(entries, 'Respect').strengths,
      opportunities: analyzeQualitativeFeedback(entries, 'Respect').opportunities,
      supportingQuotes: analyzeQualitativeFeedback(entries, 'Respect').quotes
    },
    Transparency: {
      averageScore: calculateValueScore(entries, 'Transparency'),
      trend: 'stable',
      strengths: analyzeQualitativeFeedback(entries, 'Transparency').strengths,
      opportunities: analyzeQualitativeFeedback(entries, 'Transparency').opportunities,
      supportingQuotes: analyzeQualitativeFeedback(entries, 'Transparency').quotes
    },
    Communication: {
      averageScore: calculateValueScore(entries, 'Communication'),
      trend: 'stable',
      strengths: analyzeQualitativeFeedback(entries, 'Communication').strengths,
      opportunities: analyzeQualitativeFeedback(entries, 'Communication').opportunities,
      supportingQuotes: analyzeQualitativeFeedback(entries, 'Communication').quotes
    }
  };
  
  // Create properly typed stakeholder alignment object
  const stakeholderAlignment: FeedbackReport['stakeholderAlignment'] = {
    PeopleWeHelp: {
      alignment: calculateStakeholderAlignment(entries, 'PeopleWeHelp').alignment,
      supportingEvidence: calculateStakeholderAlignment(entries, 'PeopleWeHelp').evidence
    },
    Supporters: {
      alignment: calculateStakeholderAlignment(entries, 'Supporters').alignment,
      supportingEvidence: calculateStakeholderAlignment(entries, 'Supporters').evidence
    },
    Referrers: {
      alignment: calculateStakeholderAlignment(entries, 'Referrers').alignment,
      supportingEvidence: calculateStakeholderAlignment(entries, 'Referrers').evidence
    }
  };
  
  // Identify overall trends
  const allStrengths = Object.values(valueScores)
    .flatMap(score => score.strengths);
  const allOpportunities = Object.values(valueScores)
    .flatMap(score => score.opportunities);
  
  // Generate action items based on opportunities
  const actionItems = allOpportunities.map(opportunity => 
    `Focus on ${opportunity.toLowerCase()}`
  );
  
  return {
    id: `report-${Date.now()}`,
    userId,
    surveyId,
    generatedAt: new Date(),
    valueScores,
    stakeholderAlignment,
    overallTrends: {
      strengths: allStrengths.slice(0, 3), // Top 3 strengths
      opportunities: allOpportunities.slice(0, 3), // Top 3 opportunities
      actionItems: actionItems.slice(0, 3) // Top 3 action items
    }
  };
};

// Generate a complete feedback report from feedback entries
export function generateFeedbackReportFromEntries(
  userId: string,
  surveyId: string,
  entries: FeedbackEntry[]
): FeedbackReport {
  // Create properly typed value scores object
  const valueScores: FeedbackReport['valueScores'] = {
    Collaboration: {
      averageScore: calculateValueScore(entries, 'Collaboration'),
      trend: 'stable',
      strengths: analyzeQualitativeFeedback(entries, 'Collaboration').strengths,
      opportunities: analyzeQualitativeFeedback(entries, 'Collaboration').opportunities,
      supportingQuotes: analyzeQualitativeFeedback(entries, 'Collaboration').quotes
    },
    Respect: {
      averageScore: calculateValueScore(entries, 'Respect'),
      trend: 'stable',
      strengths: analyzeQualitativeFeedback(entries, 'Respect').strengths,
      opportunities: analyzeQualitativeFeedback(entries, 'Respect').opportunities,
      supportingQuotes: analyzeQualitativeFeedback(entries, 'Respect').quotes
    },
    Transparency: {
      averageScore: calculateValueScore(entries, 'Transparency'),
      trend: 'stable',
      strengths: analyzeQualitativeFeedback(entries, 'Transparency').strengths,
      opportunities: analyzeQualitativeFeedback(entries, 'Transparency').opportunities,
      supportingQuotes: analyzeQualitativeFeedback(entries, 'Transparency').quotes
    },
    Communication: {
      averageScore: calculateValueScore(entries, 'Communication'),
      trend: 'stable',
      strengths: analyzeQualitativeFeedback(entries, 'Communication').strengths,
      opportunities: analyzeQualitativeFeedback(entries, 'Communication').opportunities,
      supportingQuotes: analyzeQualitativeFeedback(entries, 'Communication').quotes
    }
  };

  // Create properly typed stakeholder alignment object
  const stakeholderAlignment: FeedbackReport['stakeholderAlignment'] = {
    PeopleWeHelp: {
      alignment: calculateStakeholderAlignment(entries, 'PeopleWeHelp').alignment,
      supportingEvidence: calculateStakeholderAlignment(entries, 'PeopleWeHelp').evidence
    },
    Supporters: {
      alignment: calculateStakeholderAlignment(entries, 'Supporters').alignment,
      supportingEvidence: calculateStakeholderAlignment(entries, 'Supporters').evidence
    },
    Referrers: {
      alignment: calculateStakeholderAlignment(entries, 'Referrers').alignment,
      supportingEvidence: calculateStakeholderAlignment(entries, 'Referrers').evidence
    }
  };

  // Identify overall trends
  const allStrengths = Object.values(valueScores)
    .flatMap(score => score.strengths);
  const allOpportunities = Object.values(valueScores)
    .flatMap(score => score.opportunities);

  // Generate action items based on opportunities
  const actionItems = allOpportunities.map(opportunity => 
    `Focus on ${opportunity.toLowerCase()}`
  );

  return {
    id: `report-${Date.now()}`,
    userId,
    surveyId,
    generatedAt: new Date(),
    valueScores,
    stakeholderAlignment,
    overallTrends: {
      strengths: allStrengths.slice(0, 3), // Top 3 strengths
      opportunities: allOpportunities.slice(0, 3), // Top 3 opportunities
      actionItems: actionItems.slice(0, 3) // Top 3 action items
    }
  };
} 