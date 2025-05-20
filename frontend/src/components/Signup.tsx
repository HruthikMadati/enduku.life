// src/components/Signup.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Ensure this path is correct
import { UserIcon, MailIcon, LockIcon, AlertTriangleIcon, CheckCircleIcon, ArrowRightIcon } from './ui/icons'; // Ensure this path is correct

const Signup: React.FC = () => {
    const [email, setEmail] = useState('');
    const [confirmEmail, setConfirmEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmationCode, setConfirmationCode] = useState('');
    const [step, setStep] = useState<'signup' | 'verify'>('signup');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const auth = useAuth();
    const navigate = useNavigate();

    const handleSignupSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        if (email !== confirmEmail) {
            setError('Email addresses do not match');
            setLoading(false);
            return;
        }

        try {
            const result = await auth.signUp(email, password, email);
            if (!result.isSignUpComplete && result.nextStep?.signUpStep === 'CONFIRM_SIGN_UP') {
                setMessage('Almost there! Check your email for a verification code.');
                setStep('verify');
            } else if (result.isSignUpComplete) {
                setMessage('Account created successfully! Redirecting to login...');
                setTimeout(() => navigate('/login'), 2500);
            } else {
                setMessage('Sign up process initiated. Please follow the next steps if any.');
            }
        } catch (err: any) {
            setError(err.message || 'Sign up failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerificationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');
        try {
            await auth.confirmSignUp(email, confirmationCode);
            setMessage('Account verified! You can now sign in.');
            setTimeout(() => navigate('/login'), 2500);
        } catch (err: any) {
            setError(err.message || 'Verification failed. Please check the code and try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        setLoading(true);
        setError('');
        setMessage('');
        try {
            await auth.resendSignUpCode(email);
            setMessage('A new verification code has been sent.');
        } catch (err: any) {
            setError(err.message || 'Failed to resend code.');
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

    const messageStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        color: '#059669',
        backgroundColor: '#f0fdf4',
        marginBottom: '1.5rem',
        padding: '1rem',
        borderRadius: '12px',
        border: '1px solid #dcfce7',
        fontSize: '0.875rem',
        textAlign: 'left'
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
        textAlign: 'left'
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
        gap: '0.5rem'
    };

    const secondaryButtonStyle: React.CSSProperties = {
        ...buttonStyle,
        background: 'white',
        color: '#3b82f6',
        border: '2px solid #3b82f6',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        marginTop: '1rem'
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

    if (step === 'verify') {
        return (
            <div style={pageStyle}>
                <div style={cardStyle}>
                    <h2 style={titleStyle}>Verify Your Email</h2>
                    <p style={subtitleStyle}>Enter the code sent to {email}.</p>
                    {message && <div style={messageStyle}><CheckCircleIcon size={20}/> <span>{message}</span></div>}
                    {error && <div style={errorStyle}><AlertTriangleIcon size={20}/> <span>{error}</span></div>}
                    <form onSubmit={handleVerificationSubmit}>
                        <div style={inputGroupStyle}>
                            <span style={inputIconStyle}><LockIcon /></span>
                            <input 
                                id="verify-code" 
                                type="text" 
                                placeholder="Verification Code" 
                                value={confirmationCode} 
                                onChange={e => setConfirmationCode(e.target.value)} 
                                style={inputStyle} 
                                onFocus={handleFocus} 
                                onBlur={handleBlur} 
                                required 
                                disabled={loading} 
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading} 
                            style={{
                                ...buttonStyle, 
                                opacity: loading ? 0.7 : 1, 
                                cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                            onMouseEnter={(e) => {
                                if (!loading) {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 6px 8px -1px rgba(37, 99, 235, 0.2), 0 4px 6px -1px rgba(37, 99, 235, 0.1)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!loading) {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(37, 99, 235, 0.1), 0 2px 4px -1px rgba(37, 99, 235, 0.06)';
                                }
                            }}
                        >
                            {loading ? 'Verifying...' : 'Verify Account'}
                            {!loading && <ArrowRightIcon size={18} />}
                        </button>
                    </form>
                    <button 
                        onClick={handleResendCode} 
                        disabled={loading} 
                        style={{
                            ...secondaryButtonStyle, 
                            opacity: loading ? 0.7 : 1, 
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) {
                                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!loading) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }
                        }}
                    >
                        {loading ? 'Sending...' : 'Resend Code'}
                    </button>
                    <div style={linkStyle}>
                        <a href="/login" style={linkTagStyle}>Back to Sign In</a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={pageStyle}>
            <div style={cardStyle}>
                <h2 style={titleStyle}>Join Us</h2>
                <p style={subtitleStyle}>Create an account to get started.</p>
                {message && <div style={messageStyle}><CheckCircleIcon size={20}/> <span>{message}</span></div>}
                {error && <div style={errorStyle}><AlertTriangleIcon size={20}/> <span>{error}</span></div>}
                <form onSubmit={handleSignupSubmit}>
                    <div style={inputGroupStyle}>
                        <span style={inputIconStyle}><MailIcon /></span>
                        <input 
                            id="signup-email" 
                            placeholder="Email Address" 
                            type="email" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            style={inputStyle} 
                            onFocus={handleFocus} 
                            onBlur={handleBlur} 
                            required 
                            disabled={loading} 
                        />
                    </div>
                    <div style={inputGroupStyle}>
                        <span style={inputIconStyle}><MailIcon /></span>
                        <input 
                            id="signup-confirm-email" 
                            placeholder="Confirm Email Address" 
                            type="email" 
                            value={confirmEmail} 
                            onChange={e => setConfirmEmail(e.target.value)} 
                            style={inputStyle} 
                            onFocus={handleFocus} 
                            onBlur={handleBlur} 
                            required 
                            disabled={loading} 
                        />
                    </div>
                    <div style={inputGroupStyle}>
                        <span style={inputIconStyle}><LockIcon /></span>
                        <input 
                            id="signup-password" 
                            placeholder="Password" 
                            type="password" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            style={inputStyle} 
                            onFocus={handleFocus} 
                            onBlur={handleBlur} 
                            required 
                            disabled={loading} 
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={loading} 
                        style={{
                            ...buttonStyle, 
                            opacity: loading ? 0.7 : 1, 
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 8px -1px rgba(37, 99, 235, 0.2), 0 4px 6px -1px rgba(37, 99, 235, 0.1)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!loading) {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(37, 99, 235, 0.1), 0 2px 4px -1px rgba(37, 99, 235, 0.06)';
                            }
                        }}
                    >
                        {loading ? 'Creating Account...' : 'Sign Up'}
                        {!loading && <ArrowRightIcon size={18} />}
                    </button>
                </form>
                <div style={linkStyle}>
                    Already have an account?{' '}
                    <a href="/login" style={linkTagStyle}>Sign In</a>
                </div>
            </div>
        </div>
    );
};

export default Signup; // Ensured default export
