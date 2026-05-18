import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ children, className = '', interactive = false, ...rest }, ref) => {
  const baseClasses = 'bg-white rounded-lg border border-slate-200 p-5 md:p-6 mb-6';
  const interactiveClasses = interactive ? 'hover:border-slate-300 cursor-pointer' : '';

  return (
    <div ref={ref} className={`${baseClasses} ${interactiveClasses} ${className}`} {...rest}>
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export default Card;
