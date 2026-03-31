import * as React from "react";

export interface ProgressProps {
  value: number;
  max?: number;
}

const Progress: React.FC<ProgressProps> = ({ value, max = 100 }) => {
  const percentage = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full h-2 bg-slate-200 rounded">
      <div
        className="h-full bg-sky-600 rounded"
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
};

export default Progress;
