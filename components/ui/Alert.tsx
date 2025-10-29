import React from 'react';
import { CheckCircleIcon, XCircleIcon, LightbulbIcon } from '../icons';

type AlertType = 'success' | 'error' | 'info';

interface AlertProps {
  type: AlertType;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const alertConfig = {
  success: {
    icon: <CheckCircleIcon className="h-5 w-5" />,
    classes: 'bg-green-50 border-green-400 text-green-800',
  },
  error: {
    icon: <XCircleIcon className="h-5 w-5" />,
    classes: 'bg-red-50 border-red-400 text-red-800',
  },
  info: {
    icon: <LightbulbIcon className="h-5 w-5" />,
    classes: 'bg-sky-50 border-sky-400 text-sky-800',
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
