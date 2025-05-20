// src/components/Login.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserIcon, LockIcon, AlertTriangleIcon, ArrowRightIcon, GoogleIcon } from './ui/icons';
import { Hub } from 'aws-amplify/utils';
import { signInWithRedirect, getCurrentUser, AuthError } from 'aws-amplify/auth';
import { Amplify } from 'aws-amplify';

// Define a more specific type for the 'data' field within the HubPayload for auth events.
type AuthHubEventData = {
    error?: AuthError;
    message?: string;
    [key: string]: any;
} | AuthError;

interface CustomAuthHubPayload {
    event: string;
    data?: AuthHubEventData;
    message?: string;
}

// Define an interface for the expected structure of the oauth block
interface ExpectedOAuthConfig {
    domain: string;
    scope: string[];
    redirectSignIn: string | string[]; // Can be a string or array of strings
    redirectSignOut: string | string[]; // Can be a string or array of strings
    responseType: string;
    providers?: string[];
}

// Define an interface for the expected structure of the loginWith block
interface ExpectedLoginWithConfig {
    username?: boolean;
    email?: boolean;
    phone?: boolean;
    oauth?: ExpectedOAuthConfig;
}

// Define an interface for the expected structure of Cognito User Pool config
interface ExpectedCognitoUserPoolConfig {
    userPoolId?: string;
    userPoolClientId?: string;
    loginWith?: ExpectedLoginWithConfig; // OAuth is nested here
    // ... other properties
    oauth?: ExpectedOAuthConfig; // Fallback check if oauth is directly under Cognito
}

// Define an interface for the expected structure of the top-level Auth config
interface ExpectedAuthConfig {
    Cognito?: ExpectedCognitoUserPoolConfig;
    oauth?: ExpectedOAuthConfig; // Fallback check if oauth is directly under Auth
}


export const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [socialLoading, setSocialLoading] = useState(false);
    const navigate = useNavigate();
    const auth = useAuth();
    const hasAttemptedAuthProcessing = useRef(false);

    // Handle authentication state and redirects
    useEffect(() => {
        if (auth.isAuthenticated && !hasAttemptedAuthProcessing.current) {
            window.location.href = 'https://enduku.life';
        }
    }, [auth.isAuthenticated]);

    useEffect(() => {
        const listener = async (payloadWithType: { payload: CustomAuthHubPayload }) => {
            const { event, data } = payloadWithType.payload;
            switch (event) {
                case 'signInWithRedirect':
                    console.log("Hub: signInWithRedirect initiated.");
                    setSocialLoading(true);
                    break;
                case 'signInWithRedirect_failure':
                    console.error('Hub: Social sign-in failed:', data);
                    let errMsg = 'Google sign-in failed. Please try again.';
                    if (data) {
                        if (data instanceof Error) { 
                            errMsg = data.message;
                        } else if (typeof data === 'object' && data !== null && 'error' in data && data.error instanceof Error) { 
                            errMsg = (data.error as AuthError).message;
                        } else if (typeof data === 'object' && data !== null && 'message' in data && typeof data.message === 'string') { 
                            errMsg = data.message; 
                        }
                    }
                    setError(errMsg);
                    setSocialLoading(false);
                    hasAttemptedAuthProcessing.current = false;
                    break;
                case 'signedIn':
                    console.log("Hub: signedIn event detected.");
                    try {
                        if (auth.checkAuthState) {
                            await auth.checkAuthState();
                            if (auth.isAuthenticated) {
                                window.location.replace('https://enduku.life');
                                return;
                            }
                        }
                    } catch (err) {
                        console.error('Error during checkAuthState:', err);
                        try {
                            await auth.signOut();
                        } catch (signOutErr) {
                            console.error('Error signing out:', signOutErr);
                        }
                    }
                    hasAttemptedAuthProcessing.current = false;
                    setSocialLoading(false);
                    break;
                case 'signOut':
                    console.log("Hub: signOut event detected.");
                    hasAttemptedAuthProcessing.current = false;
                    break;
            }
        };
        const unsubscribe = Hub.listen('auth', listener);

        const handlePageLoadAndOAuthReturn = async () => {
            if (auth.isLoading || hasAttemptedAuthProcessing.current) return;

            const urlParams = new URLSearchParams(window.location.search);
            const hasAuthCode = urlParams.has('code');
            const hasErrorInUrl = urlParams.has('error') || urlParams.has('error_description');

            if (hasErrorInUrl) {
                const errorDesc = urlParams.get('error_description') || urlParams.get('error') || 'OAuth error occurred.';
                console.error("Login Page Load: OAuth error in URL:", errorDesc);
                setError(errorDesc);
                setSocialLoading(false);
                hasAttemptedAuthProcessing.current = true;
                window.history.replaceState({}, document.title, window.location.pathname);
                return;
            }

            if (hasAuthCode) {
                console.log("Login Page Load: Auth code detected. Attempting to process session...");
                setSocialLoading(true);
                hasAttemptedAuthProcessing.current = true;
                try {
                    // Clear any existing auth state
                    try {
                        await auth.signOut();
                    } catch (signOutErr) {
                        console.error('Error signing out:', signOutErr);
                    }

                    // Process the auth code
                    if (auth.checkAuthState) {
                        await auth.checkAuthState();
                        if (auth.isAuthenticated) {
                            window.location.replace('https://enduku.life');
                            return;
                        }
                    }
                } catch (e) {
                    console.error("Login Page Load: Error during checkAuthState after detecting code:", e);
                    setError("Failed to process authentication. Please try again.");
                    try {
                        await auth.signOut();
                    } catch (signOutErr) {
                        console.error('Error signing out:', signOutErr);
                    }
                } finally {
                    if (!auth.isAuthenticated) setSocialLoading(false);
                }
                window.history.replaceState({}, document.title, window.location.pathname);
            } else if (!auth.isAuthenticated) {
                console.log("Login Page Load: No auth code/error in URL and user not authenticated by context.");
                setSocialLoading(false);
                hasAttemptedAuthProcessing.current = false;
            }
        };

        // Add a small delay to ensure the component is fully mounted
        const timer = setTimeout(() => {
            handlePageLoadAndOAuthReturn();
        }, 100);

        return () => {
            clearTimeout(timer);
            unsubscribe();
        };
    }, [auth.isLoading, auth.checkAuthState, auth.isAuthenticated]);

    const handleGoogleSignIn = async () => {
        setError(''); 
        setSocialLoading(true); 
        hasAttemptedAuthProcessing.current = false;

        try {
            // Clear any existing auth state
            try {
                await auth.signOut();
            } catch (err) {
                console.error('Error signing out:', err);
            }

            const currentAmplifyConfig = Amplify.getConfig();
            const cognitoAuthConfig = currentAmplifyConfig.Auth?.Cognito as ExpectedCognitoUserPoolConfig | undefined;
            const oauthDomain = cognitoAuthConfig?.loginWith?.oauth?.domain;

            if (!oauthDomain) {
                console.error("CRITICAL: OAuth domain not found in Amplify configuration.");
                setError("OAuth is not configured correctly. Cannot proceed.");
                setSocialLoading(false);
                return;
            }

            // Store the current URL to check after redirect
            sessionStorage.setItem('oauth_redirect_started', 'true');
            await signInWithRedirect({ provider: 'Google' });
        } catch (err: any) {
            console.error('Error initiating Google sign-in:', err);
            if (err.name === 'InvalidOriginException' || (err.message && err.message.includes('Invalid origin'))) {
                setError(`OAuth Error: ${err.message}. Ensure your app's current URL is listed in 'redirectSignIn' in aws-exports.js.`);
            } else if (err.name === 'UserAlreadyAuthenticatedException') {
                try {
                    await auth.signOut();
                    await signInWithRedirect({ provider: 'Google' });
                } catch (signOutErr) {
                    console.error('Error during sign out and retry:', signOutErr);
                    setError('Authentication error. Please try again.');
                }
            } else {
                setError(`Could not start Google sign-in: ${err.message || 'Unknown error'}.`);
            }
            setSocialLoading(false);
        }
    };

    const handleCognitoLogin = async (e: React.FormEvent) => {
        e.preventDefault(); 
        setLoading(true); 
        setError('');
        try {
            // Force sign out to clear any existing state
            try {
                await auth.signOut();
            } catch (signOutErr) {
                console.error('Error signing out:', signOutErr);
            }

            const result = await auth.signIn(username, password);
            if (result.isSignedIn) {
                window.location.replace('https://enduku.life');
                return;
            }
            else if (result.nextStep?.signInStep === 'CONFIRM_SIGN_UP') navigate('/verify-signup', { state: { username } });
            else if (result.nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') navigate('/force-new-password', { state: { user: result.user } });
        } catch (err: any) { 
            console.error('Login error:', err);
            setError(err.message || 'Login failed. Please try again.');
            try {
                await auth.signOut();
            } catch (signOutErr) {
                console.error('Error signing out after failed login:', signOutErr);
            }
        } finally { 
            setLoading(false); 
        }
    };

    // --- STYLES ---
    const pageStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        height: '100vh',
        width: '100vw',
        margin: 0,
        padding: 0,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        boxSizing: 'border-box',
        overflow: 'hidden'
    };

    const cardStyle: React.CSSProperties = {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        padding: '3rem',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        width: '100%',
        maxWidth: '420px',
        textAlign: 'center',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
    };

    const titleStyle: React.CSSProperties = {
        marginBottom: '0.5rem',
        color: '#1a1a2e',
        fontSize: '2.5rem',
        fontWeight: 800,
        letterSpacing: '-0.02em'
    };

    const subtitleStyle: React.CSSProperties = {
        marginBottom: '2.5rem',
        color: '#64748b',
        fontSize: '1rem',
        fontWeight: 500
    };

    const errorStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        color: '#ef4444',
        backgroundColor: '#fef2f2',
        marginBottom: '1.5rem',
        padding: '1rem',
        borderRadius: '12px',
        border: '1px solid #fee2e2',
        fontSize: '0.875rem',
        textAlign: 'left',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word'
    };

    const inputGroupStyle: React.CSSProperties = {
        position: 'relative',
        marginBottom: '1.5rem'
    };

    const inputIconStyle: React.CSSProperties = {
        position: 'absolute',
        left: '1rem',
        top: '50%',
        transform: 'translateY(-50%)',
        color: '#94a3b8',
        pointerEvents: 'none'
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '1rem 1rem 1rem 3rem',
        borderRadius: '12px',
        border: '2px solid #e2e8f0',
        backgroundColor: '#f8fafc',
        boxSizing: 'border-box',
        fontSize: '1rem',
        color: '#1e293b',
        transition: 'all 0.2s ease',
        outline: 'none'
    };

    const buttonStyle: React.CSSProperties = {
        width: '100%',
        padding: '1rem',
        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: 600,
        transition: 'all 0.2s ease',
        boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.1), 0 2px 4px -1px rgba(37, 99, 235, 0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        marginTop: '0.5rem'
    };

    const googleButtonStyle: React.CSSProperties = {
        ...buttonStyle,
        background: 'white',
        color: '#1e293b',
        border: '2px solid #e2e8f0',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        marginTop: '1.5rem'
    };

    const orDividerStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        textAlign: 'center',
        color: '#94a3b8',
        margin: '1.5rem 0',
        fontSize: '0.875rem',
        fontWeight: 500
    };

    const dividerLineStyle: React.CSSProperties = {
        flexGrow: 1,
        height: '1px',
        background: '#e2e8f0'
    };

    const linkStyle: React.CSSProperties = {
        marginTop: '2rem',
        fontSize: '0.875rem',
        color: '#64748b',
        fontWeight: 500
    };

    const linkTagStyle: React.CSSProperties = {
        color: '#3b82f6',
        textDecoration: 'none',
        fontWeight: 600,
        transition: 'color 0.2s ease'
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        e.target.style.borderColor = '#3b82f6';
        e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
        e.target.style.backgroundColor = '#ffffff';
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        e.target.style.borderColor = '#e2e8f0';
        e.target.style.boxShadow = 'none';
        e.target.style.backgroundColor = '#f8fafc';
    };

    return (
        <div style={pageStyle}>
            <div style={cardStyle}>
                <h2 style={titleStyle}>Welcome Back</h2>
                <p style={subtitleStyle}>Sign in to continue your journey</p>
                {error && (
                    <div style={errorStyle}>
                        <AlertTriangleIcon size={20} />
                        <span>{error}</span>
                    </div>
                )}
                <form onSubmit={handleCognitoLogin}>
                    <div style={inputGroupStyle}>
                        <span style={inputIconStyle}><UserIcon /></span>
                        <input
                            id="login-username"
                            type="text"
                            placeholder="Username or Email"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={inputStyle}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            required
                            disabled={loading || auth.isLoading || socialLoading}
                        />
                    </div>
                    <div style={inputGroupStyle}>
                        <span style={inputIconStyle}><LockIcon /></span>
                        <input
                            id="login-password"
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={inputStyle}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            required
                            disabled={loading || auth.isLoading || socialLoading}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || auth.isLoading || socialLoading}
                        style={{
                            ...buttonStyle,
                            opacity: (loading || auth.isLoading || socialLoading) ? 0.7 : 1,
                            cursor: (loading || auth.isLoading || socialLoading) ? 'not-allowed' : 'pointer'
                        }}
                        onMouseEnter={(e) => {
                            if (!(loading || auth.isLoading || socialLoading)) {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 8px -1px rgba(37, 99, 235, 0.2), 0 4px 6px -1px rgba(37, 99, 235, 0.1)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!(loading || auth.isLoading || socialLoading)) {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(37, 99, 235, 0.1), 0 2px 4px -1px rgba(37, 99, 235, 0.06)';
                            }
                        }}
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                        {!loading && !auth.isLoading && <ArrowRightIcon size={18} />}
                    </button>
                </form>
                <div style={orDividerStyle}>
                    <span style={dividerLineStyle}></span>
                    <span style={{ padding: '0 1rem' }}>OR</span>
                    <span style={dividerLineStyle}></span>
                </div>
                <button
                    onClick={handleGoogleSignIn}
                    disabled={socialLoading || auth.isLoading || loading}
                    style={{
                        ...googleButtonStyle,
                        opacity: (socialLoading || auth.isLoading || loading) ? 0.7 : 1,
                        cursor: (socialLoading || auth.isLoading || loading) ? 'not-allowed' : 'pointer'
                    }}
                    onMouseEnter={(e) => {
                        if (!(socialLoading || auth.isLoading || loading)) {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 6px 8px -1px rgba(0, 0, 0, 0.1), 0 4px 6px -1px rgba(0, 0, 0, 0.05)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!(socialLoading || auth.isLoading || loading)) {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)';
                        }
                    }}
                >
                    <GoogleIcon size={22} style={{ marginRight: '0.75rem' }} />
                    {socialLoading ? 'Redirecting...' : 'Sign In with Google'}
                </button>
                <div style={linkStyle}>
                    Don't have an account?{' '}
                    <a href="/signup" style={linkTagStyle}>
                        Create One
                    </a>
                </div>
            </div>
        </div>
    );
};
