import * as React from "react";
import { cn } from "../../lib/utils.ts"; // optional: replace with your own className merge

// A simple button component with variant and size support
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline";
  size?: "sm" | "md" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", size = "md", className = "", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition";
    const variantClass =
      variant === "outline"
        ? "border border-slate-300 text-slate-700 bg-white hover:bg-slate-50"
        : "bg-sky-600 text-white hover:bg-sky-700";
    const sizeClass =
      size === "sm"
        ? "px-2 py-1 text-sm"
        : size === "lg"
        ? "px-5 py-3 text-base"
        : "px-3 py-2 text-sm";

    return (
      <button
        ref={ref}
        className={cn(base, variantClass, sizeClass, className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export default Button;