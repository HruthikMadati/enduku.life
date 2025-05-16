// src/components/Signup.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Ensure this path is correct
import { UserIcon, MailIcon, LockIcon, AlertTriangleIcon, CheckCircleIcon, ArrowRightIcon } from './ui/icons'; // Ensure this path is correct

const Signup: React.FC = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
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
        try {
            const result = await auth.signUp(username, password, email);
            if (!result.isSignUpComplete && result.nextStep?.signUpStep === 'CONFIRM_SIGN_UP') {
                setMessage('Almost there! Check your email for a verification code.');
                setStep('verify');
            } else if (result.isSignUpComplete) {
                setMessage('Account created successfully! Redirecting to login...');
                setTimeout(() => navigate('/login'), 2500);
            } else {
                // This case might occur if sign-up is complete but requires other steps not handled here
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
            await auth.confirmSignUp(username, confirmationCode);
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
            await auth.resendSignUpCode(username);
            setMessage('A new verification code has been sent.');
        } catch (err: any) {
            setError(err.message || 'Failed to resend code.');
        } finally {
            setLoading(false);
        }
    };

    // --- STYLES (Same as before, ensure Poppins font is linked in public/index.html) ---
    const pageStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'radial-gradient(circle at bottom right, #FF7E5F, #FEB47B, #FFD700)', fontFamily: "'Poppins', sans-serif", padding: '20px', boxSizing: 'border-box', overflow: 'hidden' };
    const cardStyle: React.CSSProperties = { backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: '40px 50px', borderRadius: '20px', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.2)', width: '100%', maxWidth: '480px', textAlign: 'center', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.3)' };
    const titleStyle: React.CSSProperties = { marginBottom: '15px', color: '#2c3e50', fontSize: '32px', fontWeight: 700 };
    const subtitleStyle: React.CSSProperties = { marginBottom: '35px', color: '#7f8c8d', fontSize: '16px' };
    const messageStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px', color: '#16a085', backgroundColor: 'rgba(22, 160, 133, 0.1)', marginBottom: '25px', padding: '12px 15px', borderRadius: '8px', border: '1px solid rgba(22, 160, 133, 0.3)', fontSize: '14px', textAlign: 'left' };
    const errorStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px', color: '#c0392b', backgroundColor: 'rgba(231, 76, 60, 0.1)', marginBottom: '25px', padding: '12px 15px', borderRadius: '8px', border: '1px solid rgba(192, 57, 43, 0.3)', fontSize: '14px', textAlign: 'left' };
    const inputGroupStyle: React.CSSProperties = { position: 'relative', marginBottom: '25px' };
    const inputIconStyle: React.CSSProperties = { position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#95a5a6', pointerEvents: 'none' };
    const inputStyle: React.CSSProperties = { width: '100%', padding: '15px 15px 15px 50px', borderRadius: '10px', border: '1px solid #dfe6e9', backgroundColor: '#f8f9fa', boxSizing: 'border-box', fontSize: '16px', color: '#2c3e50', transition: 'all 0.3s ease' };
    const buttonStyle: React.CSSProperties = { width: '100%', padding: '15px', background: 'linear-gradient(90deg, #FF7E5F 0%, #FEB47B 100%)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '18px', fontWeight: 600, transition: 'all 0.3s ease', boxShadow: '0 5px 15px rgba(255, 126, 95, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' };
    const secondaryButtonStyle: React.CSSProperties = { ...buttonStyle, background: 'transparent', color: '#FF7E5F', border: '2px solid #FF7E5F', boxShadow: 'none', marginTop: '15px' };
    const linkStyle: React.CSSProperties = { marginTop: '30px', fontSize: '14px', color: '#7f8c8d' };
    const linkTagStyle: React.CSSProperties = { color: '#FF7E5F', textDecoration: 'none', fontWeight: 600 };
    // const smallTextStyle: React.CSSProperties = { fontSize: '14px', color: '#555', marginBottom: '20px' }; // Not used, can be removed
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = '#FF7E5F'; e.target.style.boxShadow = '0 0 0 3px rgba(255, 126, 95, 0.2)'; };
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = '#dfe6e9'; e.target.style.boxShadow = 'none'; };

    if (step === 'verify') {
        return (
            <div style={pageStyle}> {/* Fixed: Removed extra > */}
                <div style={cardStyle}> {/* Fixed: cardStyl to cardStyle */}
                    <h2 style={titleStyle}>Verify Your Email</h2>
                    <p style={subtitleStyle}>Enter the code sent to {email}.</p>
                    {message && <div style={messageStyle}><CheckCircleIcon size={20}/> <span>{message}</span></div>}
                    {error && <div style={errorStyle}><AlertTriangleIcon size={20}/> <span>{error}</span></div>}
                    <form onSubmit={handleVerificationSubmit}>
                        <div style={inputGroupStyle}>
                            <span style={inputIconStyle}><LockIcon /></span>
                            <input id="verify-code" type="text" placeholder="Verification Code" value={confirmationCode} onChange={e => setConfirmationCode(e.target.value)} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} required disabled={loading} />
                        </div>
                        <button type="submit" disabled={loading} style={{...buttonStyle, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer'}}
                            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(255, 126, 95, 0.6)'; }}
                            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 5px 15px rgba(255, 126, 95, 0.4)'; }}>
                            {loading ? 'Verifying...' : 'Verify Account'}
                            {!loading && <ArrowRightIcon size={18} />}
                        </button>
                    </form>
                    <button onClick={handleResendCode} disabled={loading} style={{...secondaryButtonStyle, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer'}}
                         onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = 'rgba(255, 126, 95, 0.1)';}}
                        onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = 'transparent';}}>
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
                        <span style={inputIconStyle}><UserIcon /></span>
                        <input id="signup-username" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} required disabled={loading} />
                    </div>
                    <div style={inputGroupStyle}>
                        <span style={inputIconStyle}><MailIcon /></span>
                        <input id="signup-email" placeholder="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} required disabled={loading} />
                    </div>
                    <div style={inputGroupStyle}>
                        <span style={inputIconStyle}><LockIcon /></span>
                        <input id="signup-password" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} required disabled={loading} />
                    </div>
                    <button type="submit" disabled={loading} style={{...buttonStyle, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer'}}
                        onMouseEnter={(e) => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(255, 126, 95, 0.6)'; }}
                        onMouseLeave={(e) => { if (!loading) e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 5px 15px rgba(255, 126, 95, 0.4)'; }}>
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
