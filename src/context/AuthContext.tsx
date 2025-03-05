
import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { ref, get, set } from 'firebase/database';
import { auth, googleProvider, db } from '../services/firebase';
import { useToast } from '@/components/ui/use-toast';

interface UserData {
  email: string;
  role: 'admin' | 'employee';
  name?: string;
}

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, role: 'admin' | 'employee', name?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          const userRef = ref(db, `users/${user.uid}`);
          const snapshot = await get(userRef);
          
          if (snapshot.exists()) {
            setUserData(snapshot.val());
          } else {
            // For demo purposes, set as admin if user data doesn't exist
            const defaultUserData = {
              email: user.email || '',
              role: 'admin' as const,
              name: user.displayName || '',
            };
            
            await set(userRef, defaultUserData);
            setUserData(defaultUserData);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          toast({
            title: "Error",
            description: "Failed to load user data. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        setUserData(null);
      }
      
      setIsLoading(false);
    });

    return unsubscribe;
  }, [toast]);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to login";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast({
        title: "Success",
        description: "Logged in with Google successfully",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to login with Google";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  const register = async (email: string, password: string, role: 'admin' | 'employee', name?: string) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Save user data to Realtime Database
      await set(ref(db, `users/${user.uid}`), {
        email,
        role,
        name: name || '',
      });
      
      toast({
        title: "Success",
        description: "Registered successfully",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to register";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to logout";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  const value = {
    currentUser,
    userData,
    isAdmin: userData?.role === 'admin',
    isLoading,
    login,
    loginWithGoogle,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
