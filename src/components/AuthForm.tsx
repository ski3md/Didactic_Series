
import React, { useState } from 'react';
import { UserCircleIcon, LockClosedIcon } from './icons';

interface AuthFormProps {
  onSubmit: (username: string, password: string, email?: string, rememberMe?: boolean) => void;
  buttonText: string;
  isLoginView: boolean;
  isLoading: boolean;
}

const AuthForm: React.FC<AuthFormProps> = ({ onSubmit, buttonText, isLoginView, isLoading }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(username, password, undefined, rememberMe);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="relative">
        <label htmlFor="username" className="sr-only">Username</label>
        <UserCircleIcon className="pointer-events-none w-5 h-5 absolute top-1/2 transform -translate-y-1/2 left-4 text-slate-400" />
        <input
          id="username"
          name="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full py-3 pl-12 pr-4 border border-slate-400 rounded-lg focus:ring-sky-500 focus:border-sky-500 transition shadow-sm bg-white"
          placeholder="Username"
          autoComplete="username"
          autoFocus
          required
        />
      </div>

      <div className="relative">
        <label htmlFor="password" className="sr-only">Password</label>
        <LockClosedIcon className="pointer-events-none w-5 h-5 absolute top-1/2 transform -translate-y-1/2 left-4 text-slate-400" />
        <input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full py-3 pl-12 pr-4 border border-slate-400 rounded-lg focus:ring-sky-500 focus:border-sky-500 transition shadow-sm bg-white"
          placeholder="Password"
          autoComplete={isLoginView ? "current-password" : "new-password"}
          required
        />
      </div>

      <div className="flex items-center">
        <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded border-slate-400 text-sky-600 focus:ring-sky-500"
        />
        <label htmlFor="remember-me" className="ml-3 block text-sm font-medium leading-6 text-slate-900">
            Remember me
        </label>
      </div>
      
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-sky-600 text-white font-semibold py-3 px-5 rounded-lg hover:bg-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500 transition-all duration-200 shadow-md hover:shadow-lg disabled:bg-slate-400"
      >
        {isLoading ? (isLoginView ? 'Logging in...' : 'Creating Account...') : buttonText}
      </button>
    </form>
  );
};

export default AuthForm;