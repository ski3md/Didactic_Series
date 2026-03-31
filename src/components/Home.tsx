import React, { useState, useMemo, useEffect } from 'react';
import Card from './ui/Card.tsx';
import { Section, User, UserActivity } from '../types.ts';
import { 
  MicroscopeIcon, EyeIcon, 
  BookOpenIcon, SparklesIcon
} from './icons.tsx';
import { useUserProgress } from '../hooks/useUserProgress.ts';
import { getAllUserData } from '../utils/tracking.ts';
import { modules } from '../data/modules.ts';

interface HomeProps {
  onSectionChange: (section: Section) => void;
  user: User | null;
}

const diseaseCategories: Record<string, string[]> = {
    "Infectious: Mycobacterial": ["Tuberculosis"],
    "Infectious: Fungal": ["Histoplasmosis", "Blastomycosis", "Coccidioidomycosis", "Cryptococcus"],
    "Autoimmune / Vasculitic": ["Granulomatosis with Polyangiitis (GPA)", "Sarcoidosis"],
    "Inhalational / Hypersensitivity": ["Chronic Beryllium Disease", "Hypersensitivity Pneumonitis"],
};

const getCategoryForTopic = (topic: string): string | null => {
    for (const category in diseaseCategories) {
        if (diseaseCategories[category].includes(topic)) {
            return category;
        }
    }
    // Handle Histo being in two categories
    if (topic === "Histoplasmosis") return "Infectious: Fungal";
    return null;
};


const DiagnosticWorkbench: React.FC<{ user: User | null, onStartCase: (section: Section) => void }> = ({ user, onStartCase }) => {
    const [activity, setActivity] = useState<UserActivity | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!user) {
                setIsLoading(false);
                setActivity(null);
                return;
            }
            setIsLoading(true);
            try {
                const allData = await getAllUserData();
                setActivity(allData[user.username] || { SignOutSimulator: [], Evaluation: [] });
            } catch(e) {
                console.error("Failed to load user activity for dashboard", e);
                setActivity({ SignOutSimulator: [], Evaluation: [] });
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [user]);
    
    const accuracyMatrix = useMemo(() => {
        const matrix: Record<string, { total: number; correct: number }> = {};

        Object.keys(diseaseCategories).forEach(cat => {
            matrix[cat] = { total: 0, correct: 0 };
        });
        
        if (!user || !activity) return matrix;

        const quizData = activity?.Evaluation || [];
        
        quizData.forEach(answer => {
            // Find the module that contains this question
            const module = modules.find(m => m.mcqs.some(q => q.question === answer.question));
            if (module) {
                const category = getCategoryForTopic(module.topic);
                if (category && matrix[category]) {
                    matrix[category].total++;
                    if (answer.isCorrect) {
                        matrix[category].correct++;
                    }
                }
            }
        });

        return matrix;

    }, [activity, user]);
    
    // NEW: Memoize unseen cases to make the "Unknowns Board" dynamic.
    const unseenCases = useMemo(() => {
        if (!user || isLoading || !activity?.SignOutSimulator) {
            return modules; // Default to all modules if loading or no activity
        }
        const completedTopics = new Set(activity.SignOutSimulator.map(log => log.caseTopic));
        const remainingCases = modules.filter(module => !completedTopics.has(module.topic));
        
        // If all cases are completed, show the first few again as a fallback
        return remainingCases.length > 0 ? remainingCases : modules;
    }, [activity, isLoading, user]);


    const getAccuracyColor = (correct: number, total: number) => {
        if (total === 0) return 'text-slate-500';
        const accuracy = (correct / total) * 100;
        if (accuracy >= 90) return 'text-teal-600 font-bold';
        if (accuracy >= 70) return 'text-amber-600 font-semibold';
        return 'text-rose-600 font-semibold';
    };

    return (
        <Card className="bg-white">
            <h2 className="text-2xl font-semibold font-serif text-slate-900 mb-6">Diagnostic Workbench</h2>
            
            <div className="mb-8">
                <h3 className="font-semibold text-slate-800 mb-3">The Unknowns Board</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {unseenCases.slice(0, 3).map(module => (
                        <Card 
                            key={module.topic}
                            interactive
                            className="!p-4 !mb-0 h-full !bg-sky-50/80 border-sky-200/80 flex flex-col"
                            onClick={() => onStartCase(Section.SIGN_OUT_SIMULATOR)}
                        >
                            <p className="text-sm font-semibold text-sky-900">New Case Ready</p>
                            <p className="text-xs text-slate-700 mt-1 flex-grow">{module.case_tutorial.clinicalVignette}</p>
                            <p className="text-xs font-bold text-sky-800 mt-2 text-right">Start Case &rarr;</p>
                        </Card>
                    ))}
                </div>
                 {unseenCases.length > 3 && (
                    <p className="text-center text-xs text-slate-600 mt-3">...and {unseenCases.length - 3} more cases waiting.</p>
                )}
                 {user && unseenCases.length < modules.length && unseenCases.length > 0 && modules.length > unseenCases.length && (
                    <p className="text-center text-xs text-slate-600 mt-3">You have completed {modules.length - unseenCases.length} case(s). Great work!</p>
                )}
            </div>

            <div>
                <h3 className="font-semibold text-slate-800 mb-3">Diagnostic Accuracy Matrix</h3>
                {!user ? (
                     <div className="opacity-60 pointer-events-none">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                <tr>
                                    <th className="px-4 py-3 rounded-l-lg">Disease Category</th>
                                    <th className="px-4 py-3 text-center rounded-r-lg">Quiz Accuracy</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.keys(diseaseCategories).map((category) => (
                                    <tr key={category} className="border-b border-slate-200 last:border-b-0">
                                        <td className="px-4 py-3 font-medium text-slate-800">{category}</td>
                                        <td className={`px-4 py-3 text-center text-slate-500`}>
                                            N/A
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : isLoading ? <p>Loading accuracy data...</p> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                <tr>
                                    <th className="px-4 py-3 rounded-l-lg">Disease Category</th>
                                    <th className="px-4 py-3 text-center rounded-r-lg">Quiz Accuracy</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(accuracyMatrix).map(([category, data]) => {
                                    const typedData = data as { correct: number; total: number };
                                    return (
                                    <tr key={category} className="border-b border-slate-200 last:border-b-0">
                                        <td className="px-4 py-3 font-medium text-slate-800">{category}</td>
                                        <td className={`px-4 py-3 text-center ${getAccuracyColor(typedData.correct, typedData.total)}`}>
                                            {typedData.total > 0 ? `${Math.round((typedData.correct / typedData.total) * 100)}%` : 'N/A'}
                                            <span className="text-xs text-slate-500 ml-2 font-normal">({typedData.correct}/{typedData.total})</span>
                                        </td>
                                    </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Card>
    );
};


const SectionLinkCard: React.FC<{
  section: Section;
  description: string;
  icon: React.ReactNode;
  onClick: (section: Section) => void;
}> = ({ section, description, icon, onClick }) => (
  <li className="list-none">
    <Card 
      interactive={true} 
      className="!mb-0 h-full"
      onClick={() => onClick(section)}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-sky-100 flex items-center justify-center mr-4">
          <div className="text-sky-600">{icon}</div>
        </div>
        <div>
          <h3 className="text-lg font-semibold font-serif text-slate-900">{section}</h3>
          <p className="mt-1 text-sm text-slate-700">{description}</p>
        </div>
      </div>
    </Card>
  </li>
);

const Home: React.FC<HomeProps> = ({ onSectionChange, user }) => {
  // `useUserProgress` can be used here for other purposes if needed, e.g., showing visited status
  useUserProgress(user?.username);
    
  const learningSections = [
    { section: Section.LECTURE, description: "Core concepts, frameworks, and a high-level overview of the diagnostic approach.", icon: <SparklesIcon className="h-5 w-5" /> },
    { section: Section.REFERENCE_LIBRARY, description: "Explore case studies, browse image galleries, and use the diagnostic atlas & flashcards.", icon: <BookOpenIcon className="h-5 w-5" /> },
    { section: Section.SIGN_OUT_SIMULATOR, description: "The capstone experience: work through an unknown case, order tests, and write a report for AI-powered feedback.", icon: <MicroscopeIcon className="h-5 w-5" /> },
    { section: Section.VISUAL_CHALLENGE, description: "Sharpen your morphologic eye by comparing Sarcoidosis and HP side-by-side on digital slides.", icon: <EyeIcon className="h-5 w-5" /> },
  ];

  return (
    <div className="space-y-12 animate-fade-in">
      <header className="text-center">
        <h1 className="text-4xl sm:text-5xl font-bold font-serif text-slate-900 tracking-tight">Granulomatous Diseases of the Lung</h1>
        <p className="mt-4 text-lg text-slate-700 max-w-3xl mx-auto">An Interactive Learning Module for Pathology Residents</p>
      </header>
      
      <DiagnosticWorkbench user={user} onStartCase={onSectionChange} />
      
      <div>
        <h2 className="text-2xl font-semibold font-serif text-slate-900 mb-6 text-center">Reference Library & Deep Dives</h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {learningSections.map(item => (
            <SectionLinkCard 
                key={item.section} 
                {...item} 
                onClick={onSectionChange}
            />
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Home;