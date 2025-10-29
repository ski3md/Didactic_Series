import { Section, UserActivity } from '../types';

const USER_DATA_KEY = 'pathology_module_user_data';

// Helper to get all user data from localStorage
const getAllData = (): Record<string, UserActivity> => {
    const data = localStorage.getItem(USER_DATA_KEY);
    return data ? JSON.parse(data) : {};
};

// Helper to save all user data to localStorage
const saveAllData = (data: Record<string, UserActivity>): void => {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(data));
};

export const trackEvent = (username: string, section: Section, eventKey: string, eventData: any) => {
    if (username === 'admin') return; // Do not track admin activity

    const allData = getAllData();
    const userData: UserActivity = allData[username] || {};
    
    // Using a key for the section to avoid issues with enum string values containing spaces
    const sectionKey = section.replace(/\s+/g, '');

    if (section === Section.AI_CASE_GENERATOR) {
        // AI cases are an array of logs
        if (!userData.AICaseGenerator) {
            userData.AICaseGenerator = [];
        }
        userData.AICaseGenerator.push(eventData);
    } else if (section === Section.ASSESSMENT) {
        // Assessment is a single object
        userData.AssessmentPhase = eventData;
    }
    else {
        // Other quiz-like sections are objects with keys for each interaction
        if (!userData[sectionKey]) {
            userData[sectionKey] = {};
        }
        userData[sectionKey][eventKey] = eventData;
    }
    
    allData[username] = userData;
    saveAllData(allData);
};

export const getAllUserData = (): Record<string, UserActivity> => {
    return getAllData();
};
