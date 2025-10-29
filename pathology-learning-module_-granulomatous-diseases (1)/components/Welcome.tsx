import React, { useState } from 'react';
import { User } from '../types';
import Alert from './ui/Alert';
import AuthForm from './AuthForm';
import { AcademicCapIcon, UserCircleIcon, KeyIcon, LockClosedIcon } from './icons';
import { initiatePasswordReset, completePasswordReset } from '../utils/auth';

interface WelcomeProps {
    onLogin: (username: string, password: string) => User;
    onSignup: (username: string, password: string, email: string) => User;
}

type AuthView = 'login_signup' | 'forgot' | 'reset';

const Welcome: React.FC<WelcomeProps> = ({ onLogin, onSignup }) => {
    const [view, setView] = useState<AuthView>('login_signup');
    const [isLoginView, setIsLoginView] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    // State for password reset flow
    const [resetUsername, setResetUsername] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [resetPassword, setResetPassword] = useState('');
    const [confirmResetPassword, setConfirmResetPassword] = useState('');

    const handleAuthSubmit = (username: string, password: string, email?: string) => {
        setError(null);
        setMessage(null);
        if (!username || !password) {
            setError("Username and password are required.");
            return;
        }

        try {
            if (isLoginView) {
                onLogin(username, password);
            } else {
                if (!email) {
                    setError("Email is required for signup.");
                    return;
                }
                onSignup(username, password, email);
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleForgotSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);
        try {
            const token = initiatePasswordReset(resetUsername);
            setMessage(`A password reset code has been generated. In a real application, this would be sent to your email. For this simulation, your code is: ${token}`);
            setView('reset');
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleResetSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);
        if (resetPassword !== confirmResetPassword) {
            setError("Passwords do not match.");
            return;
        }
        try {
            completePasswordReset(resetToken, resetPassword);
            setMessage("Password has been reset successfully. Please log in with your new password.");
            // Reset state and return to login
            setView('login_signup');
            setIsLoginView(true);
            setResetUsername('');
            setResetToken('');
            setResetPassword('');
            setConfirmResetPassword('');
        } catch (err: any) {
            setError(err.message);
        }
    };

    const renderContent = () => {
        switch(view) {
            case 'forgot':
                return (
                    <>
                        <header className="text-left mb-10">
                            <h1 className="text-3xl font-bold font-serif text-slate-900">Forgot Password</h1>
                            <p className="mt-2 text-slate-600">Enter your username to begin the reset process.</p>
                        </header>
                        <form onSubmit={handleForgotSubmit} className="space-y-6">
                            <div className="relative">
                                <label htmlFor="reset-username" className="sr-only">Username</label>
                                <UserCircleIcon className="pointer-events-none w-5 h-5 absolute top-1/2 transform -translate-y-1/2 left-4 text-slate-400" />
                                <input id="reset-username" type="text" value={resetUsername} onChange={e => setResetUsername(e.target.value)} className="w-full py-3 pl-12 pr-4 border border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition shadow-sm bg-white" placeholder="Username" required />
                            </div>
                            <button type="submit" className="w-full bg-primary-600 text-white font-semibold py-3 px-5 rounded-lg hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500 transition-all duration-200 shadow-sm hover:shadow-md">
                                Get Reset Code
                            </button>
                        </form>
                        <p className="text-center mt-6">
                            <button onClick={() => { setView('login_signup'); setError(null); }} className="text-sm text-primary-600 hover:underline">
                                Back to Login
                            </button>
                        </p>
                    </>
                );
            case 'reset':
                return (
                     <>
                        <header className="text-left mb-10">
                            <h1 className="text-3xl font-bold font-serif text-slate-900">Reset Your Password</h1>
                            <p className="mt-2 text-slate-600">Enter the reset code and your new password.</p>
                        </header>
                        <form onSubmit={handleResetSubmit} className="space-y-6">
                            <div className="relative">
                                <label htmlFor="reset-token" className="sr-only">Reset Code</label>
                                <KeyIcon className="pointer-events-none w-5 h-5 absolute top-1/2 transform -translate-y-1/2 left-4 text-slate-400" />
                                <input id="reset-token" type="text" value={resetToken} onChange={e => setResetToken(e.target.value)} className="w-full py-3 pl-12 pr-4 border border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500" placeholder="Reset Code" required />
                            </div>
                             <div className="relative">
                                <label htmlFor="new-password" className="sr-only">New Password</label>
                                <LockClosedIcon className="pointer-events-none w-5 h-5 absolute top-1/2 transform -translate-y-1/2 left-4 text-slate-400" />
                                <input id="new-password" type="password" value={resetPassword} onChange={e => setResetPassword(e.target.value)} className="w-full py-3 pl-12 pr-4 border border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500" placeholder="New Password" required />
                            </div>
                            <div className="relative">
                                <label htmlFor="confirm-password" className="sr-only">Confirm New Password</label>
                                <LockClosedIcon className="pointer-events-none w-5 h-5 absolute top-1/2 transform -translate-y-1/2 left-4 text-slate-400" />
                                <input id="confirm-password" type="password" value={confirmResetPassword} onChange={e => setConfirmResetPassword(e.target.value)} className="w-full py-3 pl-12 pr-4 border border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500" placeholder="Confirm New Password" required />
                            </div>
                            <button type="submit" className="w-full bg-primary-600 text-white font-semibold py-3 px-5 rounded-lg hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500 transition-all duration-200 shadow-sm hover:shadow-md">
                                Reset Password
                            </button>
                        </form>
                    </>
                );
            case 'login_signup':
            default:
                return (
                     <>
                        <header className="text-left mb-10">
                            <h1 className="text-3xl font-bold font-serif text-slate-900">
                                {isLoginView ? 'Welcome Back, Resident' : 'Create Your Account'}
                            </h1>
                            <p className="mt-2 text-slate-600">
                                {isLoginView ? 'Login to continue your progress.' : 'Sign up to begin your learning journey.'}
                            </p>
                        </header>
                        
                        <div className="mb-8">
                            <div className="flex border-b border-slate-200">
                                <button onClick={() => { setIsLoginView(true); setError(null); }} className={`flex-1 py-3 text-sm text-center transition-colors focus:outline-none ${isLoginView ? 'font-semibold text-primary-600 border-b-2 border-primary-600' : 'text-slate-500 hover:text-slate-700'}`}>
                                    LOGIN
                                </button>
                                <button onClick={() => { setIsLoginView(false); setError(null); }} className={`flex-1 py-3 text-sm text-center transition-colors focus:outline-none ${!isLoginView ? 'font-semibold text-primary-600 border-b-2 border-primary-600' : 'text-slate-500 hover:text-slate-700'}`}>
                                    SIGN UP
                                </button>
                            </div>
                        </div>
                        
                        <AuthForm key={isLoginView ? 'login' : 'signup'} onSubmit={handleAuthSubmit} isLoginView={isLoginView} buttonText={isLoginView ? 'Login to Your Session' : 'Create Account & Start Learning'} />
                        
                        {isLoginView && (
                            <p className="text-center mt-6">
                                <button onClick={() => { setView('forgot'); setError(null); setMessage(null); }} className="text-sm text-primary-600 hover:underline">
                                    Forgot Password?
                                </button>
                            </p>
                        )}
                        
                        <p className="text-center text-xs text-slate-500 mt-8">
                            Your progress is saved locally in your browser, linked to your username.
                        </p>
                    </>
                );
        }
    };


    return (
        <div className="min-h-screen bg-white">
            <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
                <div className="hidden lg:block relative">
                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1579154204601-01588f351e67?q=80&w=3439&auto=format&fit=crop')" }}>
                         <div className="absolute inset-0 bg-slate-900 opacity-60"></div>
                    </div>
                    <div className="relative z-10 flex flex-col justify-center h-full px-12 text-white">
                        <AcademicCapIcon className="h-12 w-12 text-primary-400 mb-4" />
                        <h1 className="text-4xl font-bold font-serif leading-tight">Unlock Your Diagnostic Potential.</h1>
                        <p className="mt-4 text-lg text-slate-300">An interactive learning module designed to elevate your diagnostic skills in granulomatous diseases of the lung.</p>
                    </div>
                </div>

                <div className="flex flex-col justify-center items-center p-8 sm:p-12 bg-slate-50">
                    <div className="w-full max-w-md">
                        {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}
                        {message && <div className="mb-4"><Alert type="info">{message}</Alert></div>}
                        {renderContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Welcome;
