import React from 'react';

export const useProgressStore = () => {
  const [progress, setProgress] = React.useState(0);
  return { progress, setProgress };
};