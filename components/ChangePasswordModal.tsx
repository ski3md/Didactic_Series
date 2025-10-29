import React, { useState } from 'react';
import { User } from '../types';
import { changePassword } from '../utils/auth';
import { LockClosedIcon, KeyIcon } from './icons';
import Alert from './ui/Alert';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose, user }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
        setError("New password must be at least 6 characters long.");
        return;
    }

    try {
      changePassword(user.username, currentPassword, newPassword);
      setSuccess("Password changed successfully!");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in"
        aria-labelledby="change-password-title"
        role="dialog"
        aria-modal="true"
    >
      <div className="relative bg-white w-full max-w-md m-4 p-8 rounded-2xl shadow-2xl" role="document">
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-slate-500 hover:text-slate-800"
            aria-label="Close modal"
        >
          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        
        <div className="flex items-center mb-6">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center mr-4">
                <KeyIcon className="h-6 w-6 text-primary-600"/>
            </div>
            <h2 id="change-password-title" className="text-2xl font-bold font-serif text-slate-800">Change Password</h2>
        </div>
        
        {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}
        {success && <div className="mb-4"><Alert type="success">{success}</Alert></div>}

        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
                <label htmlFor="current-password" className="sr-only">Current Password</label>
                <LockClosedIcon className="pointer-events-none w-5 h-5 absolute top-1/2 transform -translate-y-1/2 left-4 text-slate-400" />
                <input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full py-3 pl-12 pr-4 border border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500" placeholder="Current Password" required />
            </div>
             <div className="relative">
                <label htmlFor="new-password" className="sr-only">New Password</label>
                <LockClosedIcon className="pointer-events-none w-5 h-5 absolute top-1/2 transform -translate-y-1/2 left-4 text-slate-400" />
                <input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full py-3 pl-12 pr-4 border border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500" placeholder="New Password" required />
            </div>
             <div className="relative">
                <label htmlFor="confirm-password" className="sr-only">Confirm New Password</label>
                <LockClosedIcon className="pointer-events-none w-5 h-5 absolute top-1/2 transform -translate-y-1/2 left-4 text-slate-400" />
                <input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full py-3 pl-12 pr-4 border border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500" placeholder="Confirm New Password" required />
            </div>
            <button type="submit" className="w-full bg-primary-600 text-white font-semibold py-2.5 px-5 rounded-lg hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500 transition-all duration-200 shadow-sm hover:shadow-md">
                Update Password
            </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
