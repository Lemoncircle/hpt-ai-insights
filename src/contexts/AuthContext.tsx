'use client';

// Authentication context provider
import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

// Define the shape of our auth context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

// Create the auth context
const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Auth context provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setError(null);
      console.log('Starting Google sign-in process...');
      
      // Configure Google Provider with additional scopes if needed
      googleProvider.setCustomParameters({
        prompt: 'select_account',
        access_type: 'offline'
      });

      const result = await signInWithPopup(auth, googleProvider);
      console.log('Successfully signed in:', result.user.email);
      
      // Get the Google Access Token
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential) {
        const token = credential.accessToken;
        console.log('Got access token:', token ? 'Yes' : 'No');
      }
      
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Detailed sign-in error:', {
        code: error.code,
        message: error.message,
        email: error.email,
        credential: error.credential
      });
      
      // Provide more specific error messages based on the error code
      let errorMessage = 'Failed to sign in with Google. ';
      switch (error.code) {
        case 'auth/popup-blocked':
          errorMessage += 'Please allow popups for this website and try again.';
          break;
        case 'auth/popup-closed-by-user':
          errorMessage += 'The sign-in popup was closed. Please try again.';
          break;
        case 'auth/unauthorized-domain':
          errorMessage += 'This domain is not authorized for Google sign-in. Please contact support.';
          break;
        case 'auth/cancelled-popup-request':
          errorMessage += 'Multiple popup requests were made. Please try again.';
          break;
        default:
          errorMessage += 'Please try again or contact support if the issue persists.';
      }
      
      setError(errorMessage);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setError(null);
      await firebaseSignOut(auth);
      console.log('Successfully signed out');
      // Force navigation to home page
      window.location.href = '/';
    } catch (error: any) {
      console.error('Error signing out:', error);
      setError('Failed to sign out. Please try again.');
    }
  };

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    loading,
    error,
    signInWithGoogle,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 