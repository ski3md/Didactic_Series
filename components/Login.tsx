import React, { useState } from 'react';
import Card from './Card';
import { MicroscopeIcon, MailIcon } from './icons';

interface LoginProps {
  onLogin: (username: string) => void;
}

type LoginView = 'signIn' | 'signUp' | 'forgotPassword' | 'resetSent';

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [view, setView] = useState<LoginView>('signIn');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() === '' || password.trim() === '') {
      setError('Please enter a username and password.');
      return;
    }
    setError('');
    setIsLoading(true);
    
    // Simulate an API call
    setTimeout(() => {
      setIsLoading(false);
      onLogin(username);
    }, 1500);
  };

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() === '') {
        setError('Please enter a username.');
        return;
    }
    if (password && password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
    }
    setError('');
    setIsLoading(true);

    // Simulate registration API call
    setTimeout(() => {
        setIsLoading(false);
        onLogin(username);
    }, 1500);
  };

  const handlePasswordResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() === '') {
        setError('Please enter your email address.');
        return;
    }
    setError('');
    setIsLoading(true);

    // Simulate sending reset email
    setTimeout(() => {
        setIsLoading(false);
        setView('resetSent');
    }, 1500);
  };
  
  const clearState = () => {
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setEmail('');
      setError('');
  }

  const renderSignInForm = () => (
    <>
        <div className="text-center mb-8">
            <MicroscopeIcon className="h-12 w-12 text-blue-600 mx-auto" />
            <h1 className="mt-4 text-3xl font-bold text-slate-900 tracking-tight">Pathology Learning Module</h1>
            <p className="mt-2 text-md text-slate-600">Please sign in to continue.</p>
        </div>
        <Card className="!p-8">
            <form onSubmit={handleLoginSubmit} className="space-y-6">
                <div>
                    <label htmlFor="username" className="block text-sm font-medium text-slate-700">
                        Username
                    </label>
                    <div className="mt-1">
                        <input
                            id="username"
                            name="username"
                            type="text"
                            autoComplete="username"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={isLoading}
                            className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-slate-50"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="password"className="block text-sm font-medium text-slate-700">
                        Password
                    </label>
                    <div className="mt-1">
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                            className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-slate-50"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <input
                            id="remember-me"
                            name="remember-me"
                            type="checkbox"
                            disabled={isLoading}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                        />
                        <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900">
                            Remember me
                        </label>
                    </div>

                    <div className="text-sm">
                        <button type="button" onClick={() => { setView('forgotPassword'); clearState(); }} className="font-medium text-blue-600 hover:text-blue-500">
                            Forgot your password?
                        </button>
                    </div>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Signing in...
                            </>
                        ) : 'Sign in'}
                    </button>
                </div>
                 <div className="text-sm text-center">
                    Don't have an account?{' '}
                    <button type="button" onClick={() => { setView('signUp'); clearState(); }} className="font-medium text-blue-600 hover:text-blue-500">
                        Sign up
                    </button>
                </div>
            </form>
        </Card>
    </>
  );

  const renderSignUpForm = () => (
    <>
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Create an Account</h2>
            <p className="mt-2 text-md text-slate-600">Get started with the learning module.</p>
        </div>
        <Card className="!p-8">
            <form onSubmit={handleSignUpSubmit} className="space-y-6">
                <div>
                    <label htmlFor="username-signup" className="block text-sm font-medium text-slate-700">
                        Username
                    </label>
                    <div className="mt-1">
                        <input
                            id="username-signup"
                            name="username"
                            type="text"
                            autoComplete="username"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={isLoading}
                            className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-slate-50"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="password-signup" className="block text-sm font-medium text-slate-700">
                        Password (Optional)
                    </label>
                    <div className="mt-1">
                        <input
                            id="password-signup"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                            className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-slate-50"
                        />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Add a password to secure your account. You can skip this for now.</p>
                </div>

                {password && (
                    <div>
                        <label htmlFor="confirm-password-signup" className="block text-sm font-medium text-slate-700">
                            Confirm Password
                        </label>
                        <div className="mt-1">
                            <input
                                id="confirm-password-signup"
                                name="confirm-password"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={isLoading}
                                className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-slate-50"
                            />
                        </div>
                    </div>
                )}
                
                {error && <p className="text-sm text-red-600">{error}</p>}

                <div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </div>

                <div className="text-sm text-center">
                    Already have an account?{' '}
                    <button type="button" onClick={() => { setView('signIn'); clearState(); }} className="font-medium text-blue-600 hover:text-blue-500">
                        Sign in
                    </button>
                </div>
            </form>
        </Card>
    </>
  );

  const renderForgotPasswordForm = () => (
    <>
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Forgot Password?</h2>
            <p className="mt-2 text-md text-slate-600">Enter your email and we'll send you a reset link.</p>
        </div>
        <Card className="!p-8">
            <form onSubmit={handlePasswordResetSubmit} className="space-y-6">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                        Email address
                    </label>
                    <div className="mt-1">
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                            className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-slate-50"
                        />
                    </div>
                </div>

                 {error && <p className="text-sm text-red-600">{error}</p>}

                <div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Sending...
                            </>
                        ) : 'Send Reset Link'}
                    </button>
                </div>
                <div className="text-sm text-center">
                    <button type="button" onClick={() => { setView('signIn'); clearState(); }} className="font-medium text-blue-600 hover:text-blue-500">
                        Back to Sign In
                    </button>
                </div>
            </form>
        </Card>
    </>
  );

  const renderResetSentConfirmation = () => (
      <Card className="!p-8 text-center">
          <MailIcon className="h-12 w-12 text-green-500 mx-auto" />
          <h2 className="mt-4 text-2xl font-bold text-slate-900">Check your email</h2>
          <p className="mt-2 text-slate-600">
              We've sent a password reset link to <br />
              <strong className="text-slate-800">{email}</strong>.
          </p>
          <div className="mt-6">
              <button type="button" onClick={() => { setView('signIn'); clearState(); }} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Back to Sign In
              </button>
          </div>
      </Card>
  );

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <div className="w-full max-w-md px-4">
        {view === 'signIn' && renderSignInForm()}
        {view === 'signUp' && renderSignUpForm()}
        {view === 'forgotPassword' && renderForgotPasswordForm()}
        {view === 'resetSent' && renderResetSentConfirmation()}
      </div>
    </div>
  );
};

export default Login;