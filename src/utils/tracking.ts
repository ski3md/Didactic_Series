import { Section, UserActivity, QuizAnswer, SignOutLog } from '../types.ts';
import { apiGetAllUserData, apiSaveAllUserData } from '../api/mockApi.ts';


export const trackEvent = async (username: string, section: Section, eventKey: string, eventData: any) => {
    if (username === 'admin') return; // Do not track admin activity

    const allData = await apiGetAllUserData();
    const userData: UserActivity = allData[username] || {};
    
    const sectionKey = section.replace(/\s+/g, '');

    if (section === Section.SIGN_OUT_SIMULATOR) {
        if (!userData.SignOutSimulator) userData.SignOutSimulator = [];
        userData.SignOutSimulator.push(eventData as SignOutLog);
    } else if (section === Section.EVALUATION) {
        // In evaluation, we replace the whole quiz result set
        if (!userData.Evaluation) userData.Evaluation = [];
        userData.Evaluation.push(...(eventData as QuizAnswer[]));
    } else {
        if (!userData[sectionKey]) userData[sectionKey] = {};
        userData[sectionKey][eventKey] = eventData;
    }
    
    allData[username] = userData;
    await apiSaveAllUserData(allData);
};

export const trackSectionVisit = async (username: string, section: Section) => {
    if (username === 'admin') return;

    const allData = await apiGetAllUserData();
    const userData: UserActivity = allData[username] || {};

    // Update current section
    userData.currentSection = section;

    if (!userData.visitedSections) {
        userData.visitedSections = [];
    }

    if (!userData.visitedSections.includes(section)) {
        userData.visitedSections.push(section);
    }
    
    allData[username] = userData;
    await apiSaveAllUserData(allData);
};


export const getAllUserData = async (): Promise<Record<string, UserActivity>> => {
    return await apiGetAllUserData();
};