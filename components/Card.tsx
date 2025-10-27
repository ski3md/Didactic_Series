import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

// Fix: Wrap Card component with React.forwardRef to allow it to receive a ref.
// This is necessary to fix the error in DiagnosticPathway.tsx where a ref is passed to Card.
const Card = React.forwardRef<HTMLDivElement, CardProps>(({ children, className = '' }, ref) => {
  return (
    <div ref={ref} className={`bg-white rounded-xl shadow-sm border border-slate-200/80 p-6 mb-6 ${className}`}>
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export default Card;
