import { useState, useEffect, useCallback } from 'react';
import { Section } from '../types';

export const useUserProgress = (username: string | undefined) => {
  const [currentSection, setCurrentSection] = useState<Section>(Section.HOME);
  const [isProgressLoading, setIsProgressLoading] = useState(true);

  const getStorageKey = useCallback(() => {
    return username ? `pathology_module_progress_${username}` : null;
  }, [username]);

  useEffect(() => {
    const storageKey = getStorageKey();
    if (storageKey) {
      try {
        const savedSection = localStorage.getItem(storageKey);
        if (savedSection && Object.values(Section).includes(savedSection as Section)) {
          setCurrentSection(savedSection as Section);
        } else {
          setCurrentSection(Section.HOME);
        }
      } catch (error) {
        console.error("Failed to load user progress:", error);
        setCurrentSection(Section.HOME);
      }
    }
    setIsProgressLoading(false);
  }, [username, getStorageKey]);

  const handleSectionChange = useCallback((section: Section) => {
    setCurrentSection(section);
    const storageKey = getStorageKey();
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, section);
      } catch (error) {
        console.error("Failed to save user progress:", error);
      }
    }
    window.scrollTo(0, 0); // Scroll to top on page change
  }, [getStorageKey]);

  return {
    currentSection,
    handleSectionChange,
    isLoading: isProgressLoading,
  };
};
