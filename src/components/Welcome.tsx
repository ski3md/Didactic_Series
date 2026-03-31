import React, { useState } from 'react';
import { User } from '../types.ts';
import Alert from './ui/Alert.tsx';
import AuthForm from './AuthForm.tsx';
import { AcademicCapIcon } from './icons.tsx';

interface WelcomeProps {
  onLogin: (username: string, password: string, rememberMe: boolean) => Promise<User>;
  onBack?: () => void;
}

const Welcome: React.FC<WelcomeProps> = ({ onLogin, onBack }) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /** Handles Login */
  const handleAuthSubmit = async (username: string, password: string, email?: string, rememberMe?: boolean) => {
    setError(null);
    setIsLoading(true);

    if (!username || !password) {
      setError('Username and password are required.');
      setIsLoading(false);
      return;
    }

    try {
      await onLogin(username, password, rememberMe || false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-100">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
            <AcademicCapIcon className="h-12 w-12 mx-auto text-sky-700" />
            <h2 className="mt-2 text-xl font-bold text-slate-800">Pathology Learning Module</h2>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-8">
            <header className="text-left mb-10">
              <h1 className="text-3xl font-bold font-serif text-slate-900">
                Admin Login
              </h1>
              <p className="mt-2 text-slate-700">
                Sign in to access administrative features.
              </p>
            </header>
            {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}
            <AuthForm
              key={'login'}
              onSubmit={handleAuthSubmit}
              buttonText={'Login'}
              isLoginView={true}
              isLoading={isLoading}
            />
        </div>
        {onBack && (
          <div className="mt-4 text-center">
            <button onClick={onBack} className="text-sm font-medium text-slate-600 hover:text-slate-800">
              &larr; Back to Module
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Welcome;