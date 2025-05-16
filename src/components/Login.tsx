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
                        if (data instanceof Error) { errMsg = data.message;
                        } else if (typeof data === 'object' && data !== null && 'error' in data && data.error instanceof Error) { errMsg = (data.error as AuthError).message;
                        } else if (typeof data === 'object' && data !== null && 'message' in data && typeof data.message === 'string') { errMsg = data.message; }
                    }
                    setError(errMsg);
                    setSocialLoading(false);
                    hasAttemptedAuthProcessing.current = false;
                    break;
                case 'signedIn':
                    console.log("Hub: signedIn event detected.");
                    if (auth.checkAuthState) {
                        await auth.checkAuthState();
                        // Redirect to enduku.life after successful sign-in
                        window.location.href = 'https://enduku.life';
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

            if (hasAuthCode && !auth.isAuthenticated) {
                console.log("Login Page Load: Auth code detected. Attempting to process session...");
                setSocialLoading(true);
                hasAttemptedAuthProcessing.current = true;
                try {
                    if (auth.checkAuthState) {
                        await auth.checkAuthState();
                        // Redirect to enduku.life after successful auth code processing
                        window.location.href = 'https://enduku.life';
                    }
                } catch (e) {
                    console.error("Login Page Load: Error during checkAuthState after detecting code:", e);
                    setError("Failed to process authentication. Please try again.");
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
        handlePageLoadAndOAuthReturn();
        return unsubscribe;
    }, [auth.isLoading, auth.checkAuthState]);

    const handleCognitoLogin = async (e: React.FormEvent) => {
        e.preventDefault(); setLoading(true); setError('');
        try {
            const result = await auth.signIn(username, password);
            if (result.isSignedIn) return;
            else if (result.nextStep?.signInStep === 'CONFIRM_SIGN_UP') navigate('/verify-signup', { state: { username } });
            else if (result.nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') navigate('/force-new-password', { state: { user: result.user } });
        } catch (err: any) { setError(err.message || 'Login failed.');
        } finally { if (!auth.isAuthenticated) setLoading(false); }
    };

    const handleGoogleSignIn = async () => {
        setError(''); setSocialLoading(true); hasAttemptedAuthProcessing.current = false;

        const currentAmplifyConfig = Amplify.getConfig();
        console.log("--- Amplify Configuration Snapshot (handleGoogleSignIn) ---");
        console.log("Full Amplify Config:", JSON.stringify(currentAmplifyConfig, null, 2));

        // Accessing the domain based on the logged structure: Auth.Cognito.loginWith.oauth.domain
        const cognitoAuthConfig = currentAmplifyConfig.Auth?.Cognito as ExpectedCognitoUserPoolConfig | undefined;
        const oauthDomain = cognitoAuthConfig?.loginWith?.oauth?.domain;
        const oauthRedirectSignIn = cognitoAuthConfig?.loginWith?.oauth?.redirectSignIn;


        if (!oauthDomain) {
            console.error("CRITICAL: OAuth domain not found in Amplify configuration at Auth.Cognito.loginWith.oauth.domain. Check aws-exports.js and Amplify.configure() processing.");
            console.log("Relevant parts of current config for check:");
            console.log("currentAmplifyConfig.Auth?.Cognito:", currentAmplifyConfig.Auth?.Cognito);
            console.log("currentAmplifyConfig.Auth?.Cognito?.loginWith:", currentAmplifyConfig.Auth?.Cognito?.loginWith);
            console.log("currentAmplifyConfig.Auth?.Cognito?.loginWith?.oauth:", currentAmplifyConfig.Auth?.Cognito?.loginWith?.oauth);
            setError("OAuth is not configured correctly. Cannot proceed.");
            setSocialLoading(false);
            return;
        }

        console.log("Effective OAuth Domain for redirect:", oauthDomain);
        console.log("Effective OAuth RedirectSignIn(s) for redirect:", oauthRedirectSignIn);
        console.log("Calling signInWithRedirect({ provider: 'Google' })");

        try {
            await signInWithRedirect({ provider: 'Google' });
            console.log("signInWithRedirect for Google initiated.");
        } catch (err: any) {
            console.error('Error initiating Google sign-in:', err);
            // Check if the error is InvalidOriginException
            if (err.name === 'InvalidOriginException' || (err.message && err.message.includes('Invalid origin'))) {
                 setError(`OAuth Error: ${err.message}. Ensure your app's current URL (e.g., http://localhost:3000) is listed in 'redirectSignIn' in aws-exports.js AND as an 'Allowed callback URL' in your Cognito App Client settings.`);
            } else {
                setError(`Could not start Google sign-in: ${err.message || 'Unknown error'}.`);
            }
            setSocialLoading(false);
        }
    };

    // --- STYLES (Same as before) ---
    const pageStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'radial-gradient(circle at top left, #7F7FD5, #86A8E7, #91EAE4)', fontFamily: "'Poppins', sans-serif", padding: '20px', boxSizing: 'border-box', overflow: 'hidden' };
    const cardStyle: React.CSSProperties = { backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: '40px 50px', borderRadius: '20px', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.2)', width: '100%', maxWidth: '450px', textAlign: 'center', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.3)' };
    const titleStyle: React.CSSProperties = { marginBottom: '15px', color: '#2c3e50', fontSize: '32px', fontWeight: 700 };
    const subtitleStyle: React.CSSProperties = { marginBottom: '35px', color: '#7f8c8d', fontSize: '16px' };
    const errorStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px', color: '#c0392b', backgroundColor: 'rgba(231, 76, 60, 0.1)', marginBottom: '25px', padding: '12px 15px', borderRadius: '8px', border: '1px solid rgba(192, 57, 43, 0.3)', fontSize: '14px', textAlign: 'left', whiteSpace: 'pre-wrap', wordBreak: 'break-word' };
    const inputGroupStyle: React.CSSProperties = { position: 'relative', marginBottom: '25px' };
    const inputIconStyle: React.CSSProperties = { position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#95a5a6', pointerEvents: 'none' };
    const inputStyle: React.CSSProperties = { width: '100%', padding: '15px 15px 15px 50px', borderRadius: '10px', border: '1px solid #dfe6e9', backgroundColor: '#f8f9fa', boxSizing: 'border-box', fontSize: '16px', color: '#2c3e50', transition: 'all 0.3s ease' };
    const buttonStyle: React.CSSProperties = { width: '100%', padding: '15px', background: 'linear-gradient(90deg, #86A8E7 0%, #91EAE4 100%)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '18px', fontWeight: 600, transition: 'all 0.3s ease', boxShadow: '0 5px 15px rgba(145, 234, 228, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '10px' };
    const googleButtonStyle: React.CSSProperties = { ...buttonStyle, background: 'white', color: '#444', border: '1px solid #dfe6e9', boxShadow: '0 5px 15px rgba(0, 0, 0, 0.08)', marginTop: '20px' };
    const orDividerStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', textAlign: 'center', color: '#95a5a6', margin: '25px 0', fontSize: '14px' };
    const dividerLineStyle: React.CSSProperties = { flexGrow: 1, height: '1px', background: '#dfe6e9' };
    const linkStyle: React.CSSProperties = { marginTop: '30px', fontSize: '14px', color: '#7f8c8d' };
    const linkTagStyle: React.CSSProperties = { color: '#86A8E7', textDecoration: 'none', fontWeight: 600 };
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = '#86A8E7'; e.target.style.boxShadow = '0 0 0 3px rgba(134, 168, 231, 0.2)'; };
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = '#dfe6e9'; e.target.style.boxShadow = 'none'; };

    return (
        <div style={pageStyle}>
            <div style={cardStyle}>
                <h2 style={titleStyle}>Welcome Back</h2>
                <p style={subtitleStyle}>Sign in to continue your journey.</p>
                {error && ( <div style={errorStyle}><AlertTriangleIcon size={20} /><span>{error}</span></div> )}
                <form onSubmit={handleCognitoLogin}>
                    <div style={inputGroupStyle}><span style={inputIconStyle}><UserIcon /></span><input id="login-username" type="text" placeholder="Username or Email" value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} required disabled={loading || auth.isLoading || socialLoading} /></div>
                    <div style={inputGroupStyle}><span style={inputIconStyle}><LockIcon /></span><input id="login-password" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} required disabled={loading || auth.isLoading || socialLoading} /></div>
                    <button type="submit" disabled={loading || auth.isLoading || socialLoading} style={{ ...buttonStyle, opacity: (loading || auth.isLoading || socialLoading) ? 0.7 : 1, cursor: (loading || auth.isLoading || socialLoading) ? 'not-allowed' : 'pointer',}}
                        onMouseEnter={(e) => { if (!(loading || auth.isLoading || socialLoading)) e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(145, 234, 228, 0.6)'; }}
                        onMouseLeave={(e) => { if (!(loading || auth.isLoading || socialLoading)) e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 5px 15px rgba(145, 234, 228, 0.4)'; }}>
                        {loading ? 'Signing In...' : 'Sign In'}
                        {!loading && !auth.isLoading && <ArrowRightIcon size={18} />}
                    </button>
                </form>
                <div style={orDividerStyle}><span style={dividerLineStyle}></span><span style={{ padding: '0 15px' }}>OR</span><span style={dividerLineStyle}></span></div>
                <button onClick={handleGoogleSignIn} disabled={socialLoading || auth.isLoading || loading} style={{ ...googleButtonStyle, opacity: (socialLoading || auth.isLoading || loading) ? 0.7 : 1, cursor: (socialLoading || auth.isLoading || loading) ? 'not-allowed' : 'pointer',}}
                    onMouseEnter={(e) => { if (!(socialLoading || auth.isLoading || loading)) e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.12)'; e.currentTarget.style.transform = 'translateY(-2px)';}}
                    onMouseLeave={(e) => { if (!(socialLoading || auth.isLoading || loading)) e.currentTarget.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.08)'; e.currentTarget.style.transform = 'translateY(0)';}}>
                    <GoogleIcon size={22} style={{ marginRight: '10px' }} />
                    {socialLoading ? 'Redirecting...' : 'Sign In with Google'}
                </button>
                <div style={linkStyle}>Don't have an account?{' '}<a href="/signup" style={linkTagStyle}>Create One</a></div>
            </div>
        </div>
    );
};
