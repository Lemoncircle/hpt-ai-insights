import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  Timestamp,
  DocumentData
} from 'firebase/firestore';
import { 
  FeedbackEntry, 
  FeedbackSurvey, 
  FeedbackReport, 
  UserProfile 
} from '../types/feedback';

// Initialize Firebase if not already initialized
const firebaseConfig = {
  // Your Firebase config will be loaded from environment variables
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

if (!getApps().length) {
  initializeApp(firebaseConfig);
}

const db = getFirestore();

// Collection references
const usersRef = collection(db, 'users');
const surveysRef = collection(db, 'surveys');
const feedbackRef = collection(db, 'feedback');
const reportsRef = collection(db, 'reports');

// Helper function to convert Firestore timestamp to Date
const convertTimestamp = (data: DocumentData) => {
  const result = { ...data };
  Object.keys(result).forEach(key => {
    if (result[key] instanceof Timestamp) {
      result[key] = result[key].toDate();
    }
  });
  return result;
};

// User Profile Operations
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const userDoc = await getDoc(doc(usersRef, userId));
  if (!userDoc.exists()) return null;
  return convertTimestamp(userDoc.data()) as UserProfile;
};

export const createUserProfile = async (profile: Omit<UserProfile, 'id'>): Promise<string> => {
  const docRef = await addDoc(usersRef, {
    ...profile,
    joinDate: Timestamp.fromDate(profile.joinDate)
  });
  return docRef.id;
};

// Survey Operations
export const getActiveSurvey = async (): Promise<FeedbackSurvey | null> => {
  const q = query(surveysRef, where('status', '==', 'active'));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  
  const surveyDoc = querySnapshot.docs[0];
  return {
    id: surveyDoc.id,
    ...convertTimestamp(surveyDoc.data())
  } as FeedbackSurvey;
};

export const createSurvey = async (survey: Omit<FeedbackSurvey, 'id'>): Promise<string> => {
  const docRef = await addDoc(surveysRef, {
    ...survey,
    startDate: Timestamp.fromDate(survey.startDate),
    endDate: Timestamp.fromDate(survey.endDate)
  });
  return docRef.id;
};

// Feedback Operations
export const submitFeedback = async (entry: Omit<FeedbackEntry, 'id'>): Promise<string> => {
  const docRef = await addDoc(feedbackRef, {
    ...entry,
    timestamp: Timestamp.fromDate(entry.timestamp)
  });
  return docRef.id;
};

export const getUserFeedback = async (
  userId: string, 
  surveyId: string
): Promise<FeedbackEntry[]> => {
  const q = query(
    feedbackRef,
    where('toUserId', '==', userId),
    where('surveyId', '==', surveyId)
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...convertTimestamp(doc.data())
  })) as FeedbackEntry[];
};

// Report Operations
export const saveFeedbackReport = async (report: Omit<FeedbackReport, 'id'>): Promise<string> => {
  const docRef = await addDoc(reportsRef, {
    ...report,
    generatedAt: Timestamp.fromDate(report.generatedAt)
  });
  return docRef.id;
};

export const getFeedbackReport = async (reportId: string): Promise<FeedbackReport | null> => {
  const reportDoc = await getDoc(doc(reportsRef, reportId));
  if (!reportDoc.exists()) return null;
  
  return {
    id: reportDoc.id,
    ...convertTimestamp(reportDoc.data())
  } as FeedbackReport;
};

export const getUserLatestReport = async (userId: string): Promise<FeedbackReport | null> => {
  const q = query(
    reportsRef,
    where('userId', '==', userId)
  );
  
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  
  // Sort by generatedAt and get the latest
  const sortedDocs = querySnapshot.docs.sort((a, b) => {
    const aDate = a.data().generatedAt.toDate();
    const bDate = b.data().generatedAt.toDate();
    return bDate.getTime() - aDate.getTime();
  });
  
  const latestDoc = sortedDocs[0];
  return {
    id: latestDoc.id,
    ...convertTimestamp(latestDoc.data())
  } as FeedbackReport;
}; 