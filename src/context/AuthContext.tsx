// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
    signIn as amplifySignIn,
    signUp as amplifySignUp,
    signOut as amplifySignOut,
    getCurrentUser,
    fetchUserAttributes,
    confirmSignUp as amplifyConfirmSignUp,
    resendSignUpCode as amplifyResendSignUpCode
} from 'aws-amplify/auth';

interface AmplifyUser {
    username: string;
    userId: string;
    attributes?: Record<string, any>;
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: AmplifyUser | null;
    isLoading: boolean;
    signIn: (username: string, password: string) => Promise<{ isSignedIn: boolean; nextStep?: any; user?: AmplifyUser }>;
    signUp: (username: string, password: string, email: string) => Promise<{ isSignUpComplete: boolean; userId?: string; nextStep?: any }>;
    confirmSignUp: (username: string, confirmationCode: string) => Promise<any>;
    resendSignUpCode: (username: string) => Promise<any>;
    signOut: () => Promise<void>;
    fetchCurrentUserAttributes: () => Promise<Record<string, any> | null>;
    checkAuthState: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<AmplifyUser | null>(null);
    const [isLoading, setIsLoading] = useState(true); // Start true for initial app load check

    const checkAuthState = async () => {
        try {
            const cognitoUser = await getCurrentUser();
            if (!cognitoUser) {
                setUser(null);
                setIsAuthenticated(false);
                return;
            }

            try {
                const attributes = await fetchUserAttributes();
                const fullUser = { ...cognitoUser, attributes };
                setUser(fullUser);
                setIsAuthenticated(true);
            } catch (attrError) {
                console.error('Error fetching user attributes:', attrError);
                // If we can't fetch attributes but have a user, still consider them authenticated
                setUser(cognitoUser);
                setIsAuthenticated(true);
            }
        } catch (error) {
            console.error('Error checking auth state:', error);
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkAuthState(); // Initial check when AuthProvider mounts
    }, []);

    const fetchCurrentUserAttributes = async (): Promise<Record<string, any> | null> => {
        try {
            const attributes = await fetchUserAttributes();
            setUser(prevUser => prevUser ? { ...prevUser, attributes } : null);
            return attributes;
        } catch (error) {
            console.error("Error fetching user attributes:", error);
            return null;
        }
    };

    const signIn = async (usernameInput: string, passwordInput: string) => {
        try {
            const { isSignedIn, nextStep } = await amplifySignIn({ username: usernameInput, password: passwordInput });
            if (isSignedIn) {
                await checkAuthState(); // Refresh context user state
                // The user state in context will be updated by checkAuthState
                // To return the most up-to-date user from context, access it after await
                // This might still be slightly delayed if state updates are batched.
                // For immediate use, the direct result from Amplify might be needed,
                // but for global state, checkAuthState is key.
                return { isSignedIn, nextStep, user: user || undefined }; // user here is from the context's state
            }
            return { isSignedIn, nextStep };
        } catch (error) {
            await checkAuthState(); // Ensure state is correct even on error
            throw error;
        }
    };

    const signUp = async (usernameInput: string, passwordInput: string, emailInput: string) => {
        try {
            const result = await amplifySignUp({
                username: usernameInput,
                password: passwordInput,
                options: {
                    userAttributes: { email: emailInput },
                }
            });
            return result;
        } catch (error) {
            throw error;
        }
    };

    const confirmSignUp = async (username: string, confirmationCode: string) => {
        try {
            return await amplifyConfirmSignUp({ username, confirmationCode });
        } catch (error) {
            throw error;
        }
    };

    const resendSignUpCode = async (username: string) => {
        try {
            return await amplifyResendSignUpCode({ username });
        } catch (error) {
            throw error;
        }
    };

    const signOut = async () => {
        console.log('Signing out...');
        try {
            await amplifySignOut({ global: true });
            console.log('Sign out successful');
            setUser(null);
            setIsAuthenticated(false);
        } catch (error) {
            console.error('Error signing out: ', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            user,
            isLoading,
            signIn,
            signUp,
            confirmSignUp,
            resendSignUpCode,
            signOut,
            fetchCurrentUserAttributes,
            checkAuthState
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
