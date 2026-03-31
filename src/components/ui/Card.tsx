import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ children, className = '', interactive = false, ...rest }, ref) => {
  const baseClasses = 'bg-white rounded-xl shadow-sm border border-slate-200/80 p-6 md:p-8 mb-8 transition-all duration-300';
  const interactiveClasses = interactive ? 'hover:shadow-md hover:border-slate-300/80 hover:-translate-y-0.5 cursor-pointer' : '';

  return (
    <div ref={ref} className={`${baseClasses} ${interactiveClasses} ${className}`} {...rest}>
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export default Card;