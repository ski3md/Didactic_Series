import { useState, useEffect, useCallback } from 'react';
import { Section, UserActivity } from '../types.ts';
import { apiGetAllUserData } from '../api/mockApi.ts';
import { trackSectionVisit } from '../utils/tracking.ts';

export const useUserProgress = (username: string | undefined) => {
  const [currentSection, setCurrentSection] = useState<Section>(Section.HOME);
  const [visitedSections, setVisitedSections] = useState<Section[]>([]);
  const [isProgressLoading, setIsProgressLoading] = useState(true);

  useEffect(() => {
    const loadProgress = async () => {
      if (!username) {
        // For guests, ensure everything is reset
        setVisitedSections([]);
        setIsProgressLoading(false);
        return;
      }
      setIsProgressLoading(true);
      try {
        const allUserData = await apiGetAllUserData();
        const currentUserData: UserActivity = allUserData[username] || {};
        // Keep the landing experience on Home so users can choose between the
        // didactic lecture library, the legacy lecture deck, and the rest of the module.
        setVisitedSections(currentUserData.visitedSections || [Section.HOME]);
      } catch (error) {
        console.error("Failed to load user progress:", error);
        setVisitedSections([Section.HOME]);
      } finally {
        setIsProgressLoading(false);
      }
    };
    
    loadProgress();
  }, [username]);

  const handleSectionChange = useCallback(async (section: Section) => {
    // Optimistically update UI
    setCurrentSection(section);
    window.scrollTo(0, 0); // Scroll to top on page change
    
    if (!username) return;

    if (!visitedSections.includes(section)) {
        setVisitedSections(prev => [...prev, section]);
    }
    
    // Persist the change in the background
    try {
      await trackSectionVisit(username, section);
    } catch (error) {
      console.error("Failed to save section visit:", error);
      // Optional: Add UI to inform user that progress might not be saved
    }

  }, [username, visitedSections]);

  return {
    currentSection,
    handleSectionChange,
    visitedSections,
    isLoading: isProgressLoading,
  };
};
