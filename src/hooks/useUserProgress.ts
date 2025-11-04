import { useState, useEffect, useCallback } from 'react';
import { Section, UserActivity } from '../types.ts';
import { apiGetAllUserData } from '../api/mockApi.ts';
import { trackSectionVisit } from '../utils/tracking.ts';

export const useUserProgress = (username: string | undefined) => {
  const [currentSection, setCurrentSection] = useState<Section>(Section.LECTURE);
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
        // Do not load currentSection to ensure Lecture is always the landing page.
        // setCurrentSection(currentUserData.currentSection || Section.LECTURE);
        setVisitedSections(currentUserData.visitedSections || [Section.LECTURE]);
      } catch (error) {
        console.error("Failed to load user progress:", error);
        setVisitedSections([Section.LECTURE]);
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