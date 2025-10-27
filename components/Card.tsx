
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200/80 p-6 mb-6 ${className}`}>
      {children}
    </div>
  );
};

export default Card;
