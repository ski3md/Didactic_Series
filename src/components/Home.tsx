import React, { useState, useMemo, useEffect } from 'react';
import Card from './ui/Card.tsx';
import { Section, User, UserActivity } from '../types.ts';
import { useUserProgress } from '../hooks/useUserProgress.ts';
import { getAllUserData } from '../utils/tracking.ts';
import { modules } from '../data/modules.ts';
import {
  corePrinciplesPromotedLectures,
  curatedPromotedLectures,
  type PromotedLectureRecord,
} from '../utils/lectureLibraryCatalog.ts';
import { setLectureLibraryIntent } from '../utils/lectureLibraryNavigation.ts';
import { activeCurriculumModules } from '../content/curriculum/activeCurriculum.ts';
import { LearningPreferences } from '../hooks/useLearningPreferences.ts';
import { getGuPilotEnhancement } from '../content/lectures/guPilotEnhancements.ts';
import { setAlgorithmNavigatorIntent } from '../utils/algorithmNavigatorNavigation.ts';
import { setCurriculumIntent } from '../utils/curriculumNavigation.ts';
import { getInteractivePromotedLecture } from '../utils/interactiveLectureCatalog.ts';
import { setTutorialLibraryIntent } from '../utils/tutorialLibraryNavigation.ts';
import { prefetchCompetencyMatrixPayload } from '../utils/competencyMatrixLoader.ts';
import { BRAND } from '../utils/brand.ts';

interface HomeProps {
  onSectionChange: (section: Section) => void;
  user: User | null;
  preferences: LearningPreferences;
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
const Home: React.FC<HomeProps> = ({ onSectionChange, user, preferences }) => {
  // `useUserProgress` can be used here for other purposes if needed, e.g., showing visited status
  useUserProgress(user?.username);

  const openLectureLibrary = (
    lecture?: PromotedLectureRecord,
    options?: { initialMode?: 'overview' | 'algorithm' | 'tissue' | 'knowledge' | 'check' | 'transcript'; imageLayerSetId?: string }
  ) => {
    const enhancement = lecture ? getGuPilotEnhancement(lecture.id) : undefined;
    setLectureLibraryIntent({
      selectedId: lecture?.id,
      query: undefined,
      track: lecture?.lectureTrack ?? 'all',
      initialMode: options?.initialMode ?? enhancement?.defaultMode,
      imageLayerSetId: options?.imageLayerSetId ?? enhancement?.tissueLayerSets[0]?.id,
    });
    onSectionChange(Section.DIDACTIC_LECTURES);
  };

  const openAlgorithmNavigator = (
    algorithmId?: string,
    lectureId?: string,
    queryText?: string,
    category?: string,
    patternFamily?: string
  ) => {
    setAlgorithmNavigatorIntent({
      selectedId: algorithmId,
      lectureId,
      query: queryText,
      category,
      patternFamily,
    });
    onSectionChange(Section.DIDACTIC_ALGORITHMS);
  };

  const openCurriculumModule = (moduleId: string) => {
    const module = activeCurriculumModules.find((item) => item.moduleId === moduleId);
    if (!module) {
      onSectionChange(Section.PATHOLOGY_CURRICULUM);
      return;
    }

    setCurriculumIntent({
      moduleId: module.moduleId,
      subspecialty: module.subspecialty,
      promotion: module.promotionState,
      query: module.title,
    });
    onSectionChange(Section.PATHOLOGY_CURRICULUM);
  };

  const openTutorialLibrary = (queryText?: string, track: 'all' | 'surgical-path' | 'clinical-path' | 'cross-cutting' = 'all') => {
    setTutorialLibraryIntent({
      query: queryText,
      lane: 'all',
      track,
    });
    onSectionChange(Section.DIDACTIC_TUTORIALS);
  };

  const openAssessmentPathway = (kind: 'ap-visual' | 'ap-signout' | 'cp-quiz' | 'cp-curriculum') => {
    if (kind === 'ap-visual') {
      onSectionChange(Section.VISUAL_CHALLENGE);
      return;
    }
    if (kind === 'ap-signout') {
      onSectionChange(Section.SIGN_OUT_SIMULATOR);
      return;
    }
    if (kind === 'cp-quiz') {
      openTutorialLibrary('hematology coagulation transfusion blood bank microbiology chemistry management informatics', 'clinical-path');
      return;
    }
    openCurriculumModule('clinical-path-foundations');
  };

  const openCompetencyMatrix = () => {
    prefetchCompetencyMatrixPayload();
    onSectionChange(Section.COMPETENCY_MATRIX);
  };
    
  const breastGynHighlights = activeCurriculumModules.filter((module) =>
    ['breast-core', 'gynecologic-core'].includes(module.moduleId)
  );
  const systemPathways = activeCurriculumModules.filter((module) =>
    ['hpb-pancreas-core', 'thoracic-core', 'head-neck-endocrine-core'].includes(module.moduleId)
  );
  const skinMesenchymalHighlights = activeCurriculumModules.filter((module) =>
    ['skin-melanocytic-staged', 'soft-tissue-bone-core'].includes(module.moduleId)
  );
  const neuroPediatricHighlights = activeCurriculumModules.filter((module) =>
    ['neuropathology-core', 'pediatric-placental-staged'].includes(module.moduleId)
  );
  const guGiHighlights = activeCurriculumModules.filter((module) =>
    ['renal-testicular-core', 'lower-gu-bladder-core', 'upper-gi-staged', 'colorectal-staged'].includes(module.moduleId)
  );
  const clinicalPathHighlights = activeCurriculumModules.filter((module) =>
    [
      'clinical-path-foundations',
      'hematology-red-cell-core',
      'coagulation-hemostasis-core',
      'transfusion-cellular-therapy-core',
      'clinical-microbiology-core',
      'chemical-pathology-core',
      'management-informatics-core',
    ].includes(module.moduleId)
  );
  const dashboardLectureIds = ['bladder_path_core_principles', 'renal_mass_eval', 'testicular_mass_eval'];
  const dashboardLectures = dashboardLectureIds
    .map((lectureId) => getInteractivePromotedLecture(lectureId))
    .filter(Boolean);
  const masterclassLectureIds = [
    'penile_who_complete_pathology',
    'testicular_who_complete_pathology',
    'bladder_path_core_principles',
    'renal_mass_eval',
  ];
  const masterclassLectures = masterclassLectureIds
    .map((lectureId) => getInteractivePromotedLecture(lectureId))
    .filter(Boolean);
  const primaryRoute = {
    title: 'Breast and gynecologic core',
    description: 'Start with the highest-yield AP lane, then branch outward once the epithelial framework is stable.',
    primaryLabel: 'Start Breast Core',
    primaryAction: () => openCurriculumModule('breast-core'),
    secondaryLabel: 'Open Gynecologic Core',
    secondaryAction: () => openCurriculumModule('gynecologic-core'),
    modules: breastGynHighlights,
  };
  const alternateRoutes = [
    {
      key: 'systems',
      title: 'Genitourinary, GI, and visceral systems',
      description: 'Move into organ systems after the core breast and gyn pass.',
      actionLabel: 'Open Genitourinary Core',
      action: () => openCurriculumModule('renal-testicular-core'),
    },
    {
      key: 'cp',
      title: 'Clinical pathology',
      description: 'Use the CP track when you need heme, coagulation, transfusion, microbiology, chemistry, or management and informatics. Each route keeps the reviewed CP source links visible.',
      actionLabel: 'Open CP curriculum',
      action: () => openCurriculumModule('clinical-path-foundations'),
    },
    {
      key: 'curriculum',
      title: 'Browse the full curriculum',
      description: 'Open the full module map if you already know where you want to go.',
      actionLabel: 'Open Curriculum',
      action: () => onSectionChange(Section.PATHOLOGY_CURRICULUM),
    },
  ];
  const laneCards = [
    {
      key: 'breast-gyn',
      title: 'Breast / Gyn',
      modules: breastGynHighlights,
      actionLabel: 'Open lane',
      action: () => openCurriculumModule('breast-core'),
    },
    {
      key: 'gu-gi',
      title: 'Genitourinary / GI',
      modules: guGiHighlights,
      actionLabel: 'Open lane',
      action: () => openCurriculumModule('renal-testicular-core'),
    },
    {
      key: 'thoracic-visceral',
      title: 'Thoracic / HPB / H&N',
      modules: systemPathways,
      actionLabel: 'Open lane',
      action: () => openCurriculumModule('thoracic-core'),
    },
    {
      key: 'skin-soft',
      title: 'Skin / Soft Tissue',
      modules: skinMesenchymalHighlights,
      actionLabel: 'Open lane',
      action: () => openCurriculumModule('soft-tissue-bone-core'),
    },
    {
      key: 'neuro-peds',
      title: 'Neuro / Pediatric',
      modules: neuroPediatricHighlights,
      actionLabel: 'Open lane',
      action: () => openCurriculumModule('neuropathology-core'),
    },
    {
      key: 'cp-lane',
      title: 'Clinical Pathology',
      modules: clinicalPathHighlights,
      actionLabel: 'Open lane',
      action: () => openCurriculumModule('clinical-path-foundations'),
    },
  ];
  const assessmentRoutes = [
    {
      title: 'AP cases',
      description: 'Sign-out and morphology practice.',
      primaryLabel: 'Open',
      primaryAction: () => openAssessmentPathway('ap-signout'),
    },
    {
      title: 'Visual drill',
      description: 'Short morphology resets.',
      primaryLabel: 'Open',
      primaryAction: () => openAssessmentPathway('ap-visual'),
    },
    {
      title: 'CP checks',
      description: 'Quick board-style review.',
      primaryLabel: 'Open',
      primaryAction: () => openAssessmentPathway('cp-quiz'),
    },
    {
      title: 'CP curriculum',
      description: 'Return to the CP sequence.',
      primaryLabel: 'Open',
      primaryAction: () => openAssessmentPathway('cp-curriculum'),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8 animate-fade-in">
      <header className="border-b border-slate-200 pb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">{BRAND.name}</p>
        <h1 className="mt-3 max-w-4xl text-4xl font-semibold font-serif tracking-tight text-slate-950 sm:text-5xl">
          A simple path for lecture, image review, and practice.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-650">
          Start with a lecture or CP pathway. Use reviewed source links to stay oriented, then move to questions or cases after the teaching pass.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        {[
          {
            step: '1',
            title: 'Choose a lecture',
            text: 'Open the lecture library and choose the session you want to teach.',
            label: 'Open lectures',
            action: () => openLectureLibrary(),
            primary: true,
          },
          {
            step: '2',
            title: 'Teach from the overview',
            text: 'Use the teaching sequence and microscopy review as the session structure.',
            label: 'Start Genitourinary WHO testis',
            action: () => openLectureLibrary(masterclassLectures.find((lecture) => lecture.id === 'testicular_who_complete_pathology') as PromotedLectureRecord | undefined),
          },
          {
            step: '3',
            title: 'Apply after teaching',
            text: 'Move to cases, CP checks, or visual drill only after the source-linked teaching pass is clear.',
            label: 'Open practice',
            action: () => openAssessmentPathway('ap-signout'),
          },
        ].map((item) => (
          <button
            key={item.step}
            type="button"
            onClick={item.action}
            className={`rounded-lg border p-5 text-left transition ${
              item.primary
                ? 'border-sky-500 bg-sky-50 text-sky-950 shadow-sm'
                : 'border-slate-200 bg-white text-slate-900 hover:border-sky-300 hover:bg-sky-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-semibold text-sky-700 ring-1 ring-sky-200">
                {item.step}
              </span>
              <h2 className="text-lg font-semibold text-slate-950">{item.title}</h2>
            </div>
            <p className="mt-4 min-h-12 text-sm leading-6 text-slate-600">{item.text}</p>
            <div className="mt-5 text-sm font-semibold text-sky-700">{item.label}</div>
          </button>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
        <Card className="!mb-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">Masterclass lectures</p>
              <h2 className="mt-2 text-2xl font-semibold font-serif text-slate-950">Start here</h2>
            </div>
            <button
              type="button"
              onClick={() => openLectureLibrary()}
              className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-800"
            >
              View all lectures
            </button>
          </div>
          <div className="mt-6 divide-y divide-slate-200">
            {masterclassLectures.map((lecture) => (
              <button
                key={lecture.id}
                type="button"
                onClick={() => openLectureLibrary(lecture as PromotedLectureRecord, { initialMode: 'overview' })}
                className="block w-full py-5 text-left transition hover:bg-slate-50"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">{lecture.title}</h3>
                    {lecture.summary && (
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{lecture.summary}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-sky-700">Open</span>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="!mb-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">Secondary routes</p>
          <div className="mt-5 space-y-3">
            <button
              type="button"
              onClick={() => openCurriculumModule('renal-testicular-core')}
              className="block w-full rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-800 transition hover:border-sky-300 hover:bg-sky-50"
            >
              Genitourinary curriculum
            </button>
            <button
              type="button"
              onClick={() => openAssessmentPathway('cp-quiz')}
              className="block w-full rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-800 transition hover:border-sky-300 hover:bg-sky-50"
            >
              Reviewed CP tutorial checks
            </button>
            <button
              type="button"
              onClick={() => openTutorialLibrary(undefined, 'surgical-path')}
              className="block w-full rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-800 transition hover:border-sky-300 hover:bg-sky-50"
            >
              Case tutorials
            </button>
            <button
              type="button"
              onClick={openCompetencyMatrix}
              onMouseEnter={prefetchCompetencyMatrixPayload}
              onFocus={prefetchCompetencyMatrixPayload}
              className="block w-full rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-800 transition hover:border-sky-300 hover:bg-sky-50"
            >
              Competency matrix
            </button>
          </div>
        </Card>
      </section>
    </div>
  );
};

export default Home;
