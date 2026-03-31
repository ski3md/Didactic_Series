import React from 'react';
import { CheckCircleIcon, XCircleIcon, LightbulbIcon, ShieldExclamationIcon } from '../icons.tsx';

type AlertType = 'success' | 'error' | 'info' | 'warning';

interface AlertProps {
  type: AlertType;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const alertConfig = {
  success: {
    icon: <CheckCircleIcon className="h-5 w-5" />,
    classes: 'bg-teal-50 border-teal-400 text-teal-800',
  },
  error: {
    icon: <XCircleIcon className="h-5 w-5" />,
    classes: 'bg-rose-50 border-rose-400 text-rose-800',
  },
  info: {
    icon: <LightbulbIcon className="h-5 w-5" />,
    classes: 'bg-cyan-50 border-cyan-400 text-cyan-800',
  },
  warning: {
    icon: <ShieldExclamationIcon className="h-5 w-5" />,
    classes: 'bg-amber-50 border-amber-400 text-amber-800',
  },
};

const Alert: React.FC<AlertProps> = ({ type, title, children, className = '' }) => {
  const config = alertConfig[type];
  
  return (
    <div className={`p-4 border-l-4 rounded-r-lg flex items-start space-x-3 ${config.classes} ${className}`}>
      <div className="flex-shrink-0 mt-0.5">{config.icon}</div>
      <div>
        {title && <h3 className="font-bold text-sm mb-1">{title}</h3>}
        <div className="text-sm">{children}</div>
      </div>
    </div>
  );
};

export default Alert;
