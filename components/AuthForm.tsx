import React, { useState } from 'react';
import { UserCircleIcon, LockClosedIcon, MailIcon } from './icons';

interface AuthFormProps {
  onSubmit: (username: string, password: string, email?: string) => void;
  buttonText: string;
  isLoginView: boolean;
}

const AuthForm: React.FC<AuthFormProps> = ({ onSubmit, buttonText, isLoginView }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoginView) {
      onSubmit(username, password);
    } else {
      onSubmit(username, password, email);
    }
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
          className="w-full py-3 pl-12 pr-4 border border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition shadow-sm bg-white"
          placeholder="Username"
          autoComplete="username"
          required
        />
      </div>

      {!isLoginView && (
        <div className="relative">
            <label htmlFor="email" className="sr-only">Email</label>
            <MailIcon className="pointer-events-none w-5 h-5 absolute top-1/2 transform -translate-y-1/2 left-4 text-slate-400" />
            <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full py-3 pl-12 pr-4 border border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition shadow-sm bg-white"
            placeholder="Email Address"
            autoComplete="email"
            required
            />
        </div>
      )}

      <div className="relative">
        <label htmlFor="password" className="sr-only">Password</label>
        <LockClosedIcon className="pointer-events-none w-5 h-5 absolute top-1/2 transform -translate-y-1/2 left-4 text-slate-400" />
        <input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full py-3 pl-12 pr-4 border border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition shadow-sm bg-white"
          placeholder="Password"
          autoComplete={isLoginView ? "current-password" : "new-password"}
          required
        />
      </div>
      
      <button
        type="submit"
        className="w-full bg-primary-600 text-white font-semibold py-3 px-5 rounded-lg hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500 transition-all duration-200 shadow-sm hover:shadow-md"
      >
        {buttonText}
      </button>
    </form>
  );
};

export default AuthForm;
