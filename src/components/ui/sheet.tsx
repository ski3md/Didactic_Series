import * as React from "react";

// Minimal Sheet component to replace ShadCN’s <Sheet>
// Supports open/close state and passes children through.
export interface SheetProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sheet: React.FC<SheetProps> = ({ isOpen = false, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-start bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white w-64 h-full p-4 shadow-lg overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export default Sheet;