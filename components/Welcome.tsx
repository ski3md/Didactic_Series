import React, { useState } from 'react';
import Card from './Card';
import { MicroscopeIcon } from './icons';

interface WelcomeProps {
  onStart: (username: string) => void;
}

const Welcome: React.FC<WelcomeProps> = ({ onStart }) => {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() === '') return;

    setIsLoading(true);
    // Simulate loading for better UX
    setTimeout(() => {
      setIsLoading(false);
      onStart(username.trim());
    }, 500);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
            <MicroscopeIcon className="h-12 w-12 text-blue-600 mx-auto" />
            <h1 className="mt-4 text-3xl font-bold text-slate-900 tracking-tight">Pathology Learning Module</h1>
            <p className="mt-2 text-md text-slate-600">An educational experience for pathology residents.</p>
        </div>
        <Card className="!p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="username" className="block text-sm font-medium text-slate-700">
                        Please enter your name to begin
                    </label>
                    <div className="mt-1">
                        <input
                            id="username"
                            name="username"
                            type="text"
                            autoComplete="name"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={isLoading}
                            placeholder="e.g., Dr. Smith"
                            className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm bg-white text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                        />
                    </div>
                </div>

                <div>
                    <button
                        type="submit"
                        disabled={isLoading || username.trim() === ''}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Starting...
                            </>
                        ) : 'Start Learning'}
                    </button>
                </div>
            </form>
        </Card>
      </div>
    </div>
  );
};

export default Welcome;
