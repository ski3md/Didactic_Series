import React, { useEffect, useState } from 'react';
import { Section, type ActiveStudyDestination, User } from '../types.ts';
import { useUIState } from '../hooks/useUIState.ts';
import { LearningPreferences } from '../hooks/useLearningPreferences.ts';
import { BRAND } from '../utils/brand.ts';
import {
  MicroscopeIcon,
  BookOpenIcon,
  AcademicCapIcon,
  UserCircleIcon,
  LogoutIcon,
  ChevronLeftIcon,
} from './icons.tsx';
import DidacticWorkspaceNav from './DidacticWorkspaceNav.tsx';
import { loadDidacticTutorials } from '../utils/tutorialLibraryCatalog.ts';
import { didacticAlgorithms } from '../utils/algorithmCatalog.ts';
import { promotedLectures } from '../utils/lectureLibraryCatalog.ts';
import { activeCurriculumModules } from '../content/curriculum/activeCurriculum.ts';
import { readCurriculumViewState, updateCurriculumSidebarSelection } from '../utils/curriculumViewState.ts';
import {
  buildAlgorithmStudyTree,
  buildLectureStudyTree,
  buildTutorialStudyTree,
  type StudySubtopicScope,
} from '../utils/studyCatalogScopes.ts';
import { normalizePublicStudyLabel } from '../utils/studyLabeling.ts';
import {
  pushStudyDestination,
  readStudyDestination,
  STUDY_DESTINATION_EVENT,
} from '../utils/studyDestinationState.ts';
import { clearAlgorithmNavigatorLaunchContext } from '../utils/algorithmNavigatorNavigation.ts';
import { WorkspaceKey, WORKSPACE_LABELS } from '../utils/didacticWorkspaces.ts';

interface SidebarProps {
  currentSection: Section;
  onSectionChange: (section: Section) => void;
  user: User | null;
  onLogout: () => void;
  preferences: LearningPreferences;
}

const NavLink: React.FC<{
  label: string;
  ariaLabel?: string;
  isActive: boolean;
  onClick: () => void;
  onMouseEnter?: () => void;
  onFocus?: () => void;
  icon: React.ReactNode;
}> = ({ label, ariaLabel, isActive, onClick, onMouseEnter, onFocus, icon }) => {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onFocus={onFocus}
      aria-label={ariaLabel ?? label}
      className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-left ${
        isActive
          ? 'bg-sky-100 text-sky-800 font-bold shadow-lg shadow-sky-500/20'
          : 'text-slate-700 hover:bg-slate-200 hover:text-slate-900'
      }`}
    >
      <div className="mr-3 flex-shrink-0">{icon}</div>
      <span>{label}</span>
    </button>
  );
};

const DestinationTreePanel: React.FC<{
  title: string;
  subtitle: string;
  children: React.ReactNode;
}> = ({ title, subtitle, children }) => (
  <div className="ml-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
    <div className="mb-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-1 text-xs text-slate-600">{subtitle}</p>
    </div>
    {children}
  </div>
);

const DestinationTreeSectionLabel: React.FC<{ label: string; detail?: string }> = ({ label, detail }) => (
  <div className="mb-2 flex items-center justify-between gap-2">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    {detail ? <p className="text-[11px] text-slate-500">{detail}</p> : null}
  </div>
);

const DestinationNodeButton: React.FC<{
  label: string;
  eyebrow?: string;
  detail?: string;
  tone?: 'topic' | 'subtopic' | 'overview';
  compact?: boolean;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, eyebrow, detail, tone = 'topic', compact = false, isActive, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full rounded-lg border px-3 py-2 text-left transition ${
      isActive
        ? 'border-sky-400 bg-sky-50 text-sky-800'
        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900'
    } ${tone === 'subtopic' ? 'ml-2 w-[calc(100%-0.5rem)]' : ''} ${compact ? 'px-2.5 py-1.5' : ''}`}
  >
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        {eyebrow ? <div className={`text-[10px] font-semibold uppercase tracking-wide ${isActive ? 'text-sky-700' : 'text-slate-500'}`}>{eyebrow}</div> : null}
        <div className={`${compact ? 'text-[12px]' : 'text-[13px]'} truncate font-medium`}>{normalizePublicStudyLabel(label)}</div>
        {detail ? <div className={`mt-0.5 ${compact ? 'text-[10px]' : 'text-[11px]'} ${isActive ? 'text-sky-700' : 'text-slate-500'}`}>{detail}</div> : null}
      </div>
      <span className={`mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full ${isActive ? 'bg-sky-500' : tone === 'overview' ? 'bg-slate-300' : 'bg-slate-200'}`} />
    </div>
  </button>
);

const resolveStudyWorkspaceSection = (section: Section): Section => {
  switch (section) {
    case Section.LECTURE:
      return Section.DIDACTIC_LECTURES;
    default:
      return section;
  }
};

const Sidebar: React.FC<SidebarProps> = ({ currentSection, onSectionChange, user, onLogout, preferences }) => {
    const { isSidebarOpen, toggleSidebar } = useUIState();
    const [tutorialRootOptions, setTutorialRootOptions] = useState<StudySubtopicScope[]>([]);
    const [tutorialSubtopicsByRoot, setTutorialSubtopicsByRoot] = useState<Record<string, StudySubtopicScope[]>>({});
    const [activeTutorialRoot, setActiveTutorialRoot] = useState<string | undefined>(() => readStudyDestination(WorkspaceKey.TUTORIALS).majorTopicId);
    const [activeTutorialSubtopic, setActiveTutorialSubtopic] = useState<string | undefined>(() => readStudyDestination(WorkspaceKey.TUTORIALS).subtopicId);
    const lectureStudyTree = buildLectureStudyTree(promotedLectures);
    const algorithmStudyTree = buildAlgorithmStudyTree(didacticAlgorithms);
    const [activeLectureRoot, setActiveLectureRoot] = useState<string | undefined>(() => readStudyDestination(WorkspaceKey.LECTURES).majorTopicId);
    const [activeLectureSubtopic, setActiveLectureSubtopic] = useState<string | undefined>(() => readStudyDestination(WorkspaceKey.LECTURES).subtopicId);
    const [activeAlgorithmCategory, setActiveAlgorithmCategory] = useState<string | undefined>(() => readStudyDestination(WorkspaceKey.ALGORITHMS).majorTopicId);
    const [activeAlgorithmSubtopic, setActiveAlgorithmSubtopic] = useState<string | undefined>(() => readStudyDestination(WorkspaceKey.ALGORITHMS).subtopicId);
    const [activeCurriculumModuleId, setActiveCurriculumModuleId] = useState<string>(() => readCurriculumViewState()?.selectedId ?? '');
    const activeWorkspaceSection = resolveStudyWorkspaceSection(currentSection);
    const isStudyActive = [
      Section.HOME,
      Section.PATHOLOGY_CURRICULUM,
      Section.COMPETENCY_MATRIX,
      Section.SYLLABUS_EXPLORER,
      Section.DIDACTIC_LECTURES,
      Section.DIDACTIC_TUTORIALS,
      Section.DIDACTIC_ALGORITHMS,
      Section.LECTURE,
    ].includes(currentSection);
    const isSignOutActive = [
      Section.SIGN_OUT_SIMULATOR,
      Section.BREAST_SIGNOUT_MASTERCLASS,
    ].includes(currentSection);
    const foundationWorkspaceItems = [
      { section: Section.PATHOLOGY_CURRICULUM, label: WORKSPACE_LABELS[WorkspaceKey.CURRICULUM] },
    ];
    const reviewWorkspaceItems = [
      {
        section: Section.DIDACTIC_LECTURES,
        label: WORKSPACE_LABELS[WorkspaceKey.LECTURES],
        onActivate: () => {
          const nextDestination = pushStudyDestination(WorkspaceKey.LECTURES, { kind: 'landing', previous: null });
          setActiveLectureRoot(nextDestination.majorTopicId);
          setActiveLectureSubtopic(nextDestination.subtopicId);
        },
      },
      {
        section: Section.DIDACTIC_TUTORIALS,
        label: WORKSPACE_LABELS[WorkspaceKey.TUTORIALS],
        onActivate: () => {
          const nextDestination = pushStudyDestination(WorkspaceKey.TUTORIALS, { kind: 'landing', previous: null });
          setActiveTutorialRoot(nextDestination.majorTopicId);
          setActiveTutorialSubtopic(nextDestination.subtopicId);
        },
      },
      {
        section: Section.DIDACTIC_ALGORITHMS,
        label: WORKSPACE_LABELS[WorkspaceKey.ALGORITHMS],
        onActivate: () => {
          clearAlgorithmNavigatorLaunchContext();
          const nextDestination = pushStudyDestination(WorkspaceKey.ALGORITHMS, { kind: 'landing', previous: null });
          setActiveAlgorithmCategory(nextDestination.majorTopicId);
          setActiveAlgorithmSubtopic(nextDestination.subtopicId);
        },
      },
    ];
    const signOutWorkspaceItems = [
      { section: Section.SIGN_OUT_SIMULATOR, label: 'Sign-Out cases' },
    ];
    const activeStudyWorkspace = (() => {
      switch (activeWorkspaceSection) {
        case Section.PATHOLOGY_CURRICULUM:
          return {
            title: WORKSPACE_LABELS[WorkspaceKey.CURRICULUM],
            subtitle: 'Pick a topic.',
          };
        case Section.DIDACTIC_LECTURES:
          return {
            title: WORKSPACE_LABELS[WorkspaceKey.LECTURES],
            subtitle: 'Pick a lecture topic.',
          };
        case Section.DIDACTIC_TUTORIALS:
          return {
            title: WORKSPACE_LABELS[WorkspaceKey.TUTORIALS],
            subtitle: 'Pick a tutorial topic.',
          };
        case Section.DIDACTIC_ALGORITHMS:
          return {
            title: WORKSPACE_LABELS[WorkspaceKey.ALGORITHMS],
            subtitle: 'Pick a workup.',
          };
        default:
          return null;
      }
    })();

    useEffect(() => {
      if (currentSection !== Section.DIDACTIC_TUTORIALS) {
        return;
      }
      let isMounted = true;
      const tutorialDestination = readStudyDestination(WorkspaceKey.TUTORIALS);
      setActiveTutorialRoot(tutorialDestination.majorTopicId);
      setActiveTutorialSubtopic(tutorialDestination.subtopicId);
      void loadDidacticTutorials().then((tutorials) => {
        if (!isMounted) {
          return;
        }
        const tree = buildTutorialStudyTree(tutorials);
        setTutorialRootOptions(tree.roots);
        setTutorialSubtopicsByRoot(tree.subtopicsByRoot);
      });
      return () => {
        isMounted = false;
      };
    }, [currentSection]);

    useEffect(() => {
      const readValidSubtopic = <T extends { id: string }>(
        destinationSubtopicId: string | undefined,
        subtopicsByRootMap: Record<string, T[]>,
        rootId: string | undefined
      ): string | undefined => {
        if (!destinationSubtopicId || !rootId) {
          return undefined;
        }
        return subtopicsByRootMap[rootId]?.some((entry) => entry.id === destinationSubtopicId) ? destinationSubtopicId : undefined;
      };

      const syncSidebarDestination = () => {
        const tutorialDestination = readStudyDestination(WorkspaceKey.TUTORIALS);
        setActiveTutorialRoot(tutorialDestination.majorTopicId);
        setActiveTutorialSubtopic(
          readValidSubtopic(tutorialDestination.subtopicId, tutorialSubtopicsByRoot, tutorialDestination.majorTopicId)
        );

        const lectureDestination = readStudyDestination(WorkspaceKey.LECTURES);
        setActiveLectureRoot(lectureDestination.majorTopicId);
        setActiveLectureSubtopic(
          readValidSubtopic(lectureDestination.subtopicId, lectureStudyTree.subtopicsByRoot, lectureDestination.majorTopicId)
        );

        const algorithmDestination = readStudyDestination(WorkspaceKey.ALGORITHMS);
        setActiveAlgorithmCategory(algorithmDestination.majorTopicId);
        setActiveAlgorithmSubtopic(
          readValidSubtopic(
            algorithmDestination.subtopicId,
            algorithmStudyTree.subtopicsByRoot,
            algorithmDestination.majorTopicId
          )
        );
      };

      syncSidebarDestination();

      const handleDestinationChange = (event: Event) => {
        const nextDestination = (event as CustomEvent<ActiveStudyDestination>).detail;
        if (nextDestination?.workspace) {
          syncSidebarDestination();
          return;
        }
        syncSidebarDestination();
      };

      const handlePopState = () => {
        syncSidebarDestination();
      };

      window.addEventListener(STUDY_DESTINATION_EVENT, handleDestinationChange);
      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener(STUDY_DESTINATION_EVENT, handleDestinationChange);
        window.removeEventListener('popstate', handlePopState);
      };
    }, [algorithmStudyTree.subtopicsByRoot, lectureStudyTree.subtopicsByRoot, tutorialSubtopicsByRoot]);

    useEffect(() => {
      if (currentSection !== Section.PATHOLOGY_CURRICULUM) {
        return;
      }
      setActiveCurriculumModuleId(readCurriculumViewState()?.selectedId ?? '');
    }, [currentSection]);

    useEffect(() => {
      if (currentSection === Section.DIDACTIC_LECTURES) {
        const lectureDestination = readStudyDestination('lectures');
        setActiveLectureRoot(lectureDestination.majorTopicId);
        setActiveLectureSubtopic(lectureDestination.subtopicId);
      }
      if (currentSection === Section.DIDACTIC_ALGORITHMS) {
        const algorithmDestination = readStudyDestination('algorithms');
        setActiveAlgorithmCategory(algorithmDestination.majorTopicId);
        setActiveAlgorithmSubtopic(algorithmDestination.subtopicId);
      }
    }, [currentSection]);

  return (
    <aside
      aria-label={`${BRAND.name} navigation`}
      className={`fixed inset-y-0 left-0 z-30 bg-white border-r border-slate-200/80 p-4 flex flex-col w-72 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <div className="mb-6 flex-shrink-0 px-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <AcademicCapIcon className="h-8 w-8 text-primary-600" />
            <div className="ml-3 min-w-0">
              <h1 className="text-lg font-bold font-serif text-slate-900">{BRAND.name}</h1>
              <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-slate-500">{BRAND.shortTagline}</p>
            </div>
          </div>
          <button
            onClick={toggleSidebar}
            className="p-1 text-slate-500 hover:text-slate-800"
            aria-label="Collapse menu"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto">
        <NavLink
          label="Study"
          ariaLabel="Pathology Curriculum"
          isActive={isStudyActive}
          onClick={() => onSectionChange(Section.PATHOLOGY_CURRICULUM)}
          icon={<AcademicCapIcon className="h-5 w-5" />}
        />
        {isStudyActive && (
          <div className="ml-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/50">
            <div className="mb-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Study here</p>
              <p className="mt-1 text-xs text-slate-600">Pick the next kind of review.</p>
            </div>
            <DidacticWorkspaceNav
              activeSection={activeWorkspaceSection}
              onSectionChange={onSectionChange}
              orientation="vertical"
              items={foundationWorkspaceItems.concat(reviewWorkspaceItems)}
              compact
              variant="workspace"
            />
          </div>
        )}
        {activeWorkspaceSection === Section.PATHOLOGY_CURRICULUM && activeStudyWorkspace && (
          <DestinationTreePanel title={activeStudyWorkspace.title} subtitle={activeStudyWorkspace.subtitle}>
            <DestinationTreeSectionLabel label="Topics" />
            <div className="max-h-[24rem] space-y-1 overflow-y-auto pr-1">
              {activeCurriculumModules.map((module) => {
                const isActive = activeCurriculumModuleId === module.moduleId;
                return (
                  <button
                    key={module.moduleId}
                    type="button"
                    onClick={() => {
                      setActiveCurriculumModuleId(module.moduleId);
                      updateCurriculumSidebarSelection(module.moduleId, module.subspecialty);
                      onSectionChange(Section.PATHOLOGY_CURRICULUM);
                    }}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-[13px] transition ${
                      isActive
                        ? 'border-sky-400 bg-sky-50 text-sky-800'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900'
                    }`}
                  >
                    <div className="font-medium">{module.title}</div>
                    <div className="mt-0.5 text-[11px] text-slate-500">{module.subspecialty}</div>
                  </button>
                );
              })}
            </div>
          </DestinationTreePanel>
        )}
        {activeWorkspaceSection === Section.DIDACTIC_TUTORIALS && tutorialRootOptions.length > 0 && activeStudyWorkspace && (
          <DestinationTreePanel title={activeStudyWorkspace.title} subtitle={activeStudyWorkspace.subtitle}>
            <DestinationTreeSectionLabel label="Topics" />
            <div className="space-y-2">
              {tutorialRootOptions.map((root) => {
                const isActive = activeTutorialRoot === root.id;
                return (
                  <DestinationNodeButton
                    key={root.id}
                    onClick={() => {
                      setActiveTutorialRoot(root.id);
                      setActiveTutorialSubtopic(undefined);
                      pushStudyDestination(WorkspaceKey.TUTORIALS, {
                        kind: 'topic_overview',
                        majorTopicId: root.id,
                      });
                      onSectionChange(Section.DIDACTIC_TUTORIALS);
                    }}
                    isActive={isActive}
                    label={root.label}
                  />
                );
              })}
            </div>
            {activeTutorialRoot && (tutorialSubtopicsByRoot[activeTutorialRoot] || []).length > 0 && (
              <div className="mt-4 border-l border-slate-200 pl-3">
                <DestinationTreeSectionLabel label="Subtopics" detail={normalizePublicStudyLabel(activeTutorialRoot)} />
                <div className="mb-2">
                  <DestinationNodeButton
                    label="Start with overview"
                    tone="overview"
                    isActive={!activeTutorialSubtopic}
                    onClick={() => {
                      setActiveTutorialSubtopic(undefined);
                      pushStudyDestination(WorkspaceKey.TUTORIALS, {
                        kind: 'topic_overview',
                        majorTopicId: activeTutorialRoot,
                      });
                      onSectionChange(Section.DIDACTIC_TUTORIALS);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  {(tutorialSubtopicsByRoot[activeTutorialRoot] || []).map((scope) => {
                    const isActive = activeTutorialSubtopic === scope.id;
                    return (
                      <DestinationNodeButton
                        key={`${activeTutorialRoot}-${scope.id}`}
                        onClick={() => {
                          setActiveTutorialSubtopic(scope.id);
                          pushStudyDestination(WorkspaceKey.TUTORIALS, {
                            kind: 'subtopic_overview',
                            majorTopicId: activeTutorialRoot,
                            subtopicId: scope.id,
                          });
                          onSectionChange(Section.DIDACTIC_TUTORIALS);
                        }}
                        isActive={isActive}
                        label={scope.label}
                        tone="subtopic"
                        detail={undefined}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </DestinationTreePanel>
        )}
        {activeWorkspaceSection === Section.DIDACTIC_LECTURES && lectureStudyTree.roots.length > 0 && activeStudyWorkspace && (
          <DestinationTreePanel title={activeStudyWorkspace.title} subtitle={activeStudyWorkspace.subtitle}>
            <DestinationTreeSectionLabel label="Topics" />
            <div className="space-y-2">
              {lectureStudyTree.roots.map((root) => {
                const isActive = activeLectureRoot === root.id;
                return (
                  <DestinationNodeButton
                    key={root.id}
                    onClick={() => {
                      setActiveLectureRoot(root.id);
                      setActiveLectureSubtopic(undefined);
                      pushStudyDestination(WorkspaceKey.LECTURES, {
                        kind: 'topic_overview',
                        majorTopicId: root.id,
                      });
                      onSectionChange(Section.DIDACTIC_LECTURES);
                    }}
                    isActive={isActive}
                    label={root.label}
                  />
                );
              })}
            </div>
            {activeLectureRoot && (lectureStudyTree.subtopicsByRoot[activeLectureRoot] || []).length > 0 && (
              <div className="mt-4 border-l border-slate-200 pl-3">
                <DestinationTreeSectionLabel label="Subtopics" detail={normalizePublicStudyLabel(activeLectureRoot)} />
                <div className="mb-2">
                  <DestinationNodeButton
                    label="Start with overview"
                    tone="overview"
                    isActive={!activeLectureSubtopic}
                    onClick={() => {
                      setActiveLectureSubtopic(undefined);
                      pushStudyDestination(WorkspaceKey.LECTURES, {
                        kind: 'topic_overview',
                        majorTopicId: activeLectureRoot,
                      });
                      onSectionChange(Section.DIDACTIC_LECTURES);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  {(lectureStudyTree.subtopicsByRoot[activeLectureRoot] || []).map((scope) => (
                    <DestinationNodeButton
                      key={`${activeLectureRoot}-${scope.id}`}
                      onClick={() => {
                        setActiveLectureSubtopic(scope.id);
                        pushStudyDestination(WorkspaceKey.LECTURES, {
                          kind: 'subtopic_overview',
                          majorTopicId: activeLectureRoot,
                          subtopicId: scope.id,
                        });
                        onSectionChange(Section.DIDACTIC_LECTURES);
                      }}
                      isActive={activeLectureSubtopic === scope.id}
                      label={scope.label}
                      tone="subtopic"
                      detail={undefined}
                    />
                  ))}
                </div>
              </div>
            )}
          </DestinationTreePanel>
        )}
        {activeWorkspaceSection === Section.DIDACTIC_ALGORITHMS && activeStudyWorkspace && (
          <DestinationTreePanel title={activeStudyWorkspace.title} subtitle={activeStudyWorkspace.subtitle}>
            <DestinationTreeSectionLabel label="Areas" />
            <div className="space-y-1.5">
              {algorithmStudyTree.roots.map((category) => {
                const isActive = activeAlgorithmCategory === category.id;
                return (
                  <DestinationNodeButton
                    key={category.id}
                    onClick={() => {
                      setActiveAlgorithmCategory(category.id);
                      setActiveAlgorithmSubtopic(undefined);
                      pushStudyDestination(WorkspaceKey.ALGORITHMS, {
                        kind: 'topic_overview',
                        majorTopicId: category.id,
                      });
                      onSectionChange(Section.DIDACTIC_ALGORITHMS);
                    }}
                    isActive={isActive}
                    label={category.label}
                    compact
                  />
                );
              })}
            </div>
            {activeAlgorithmCategory && (algorithmStudyTree.subtopicsByRoot[activeAlgorithmCategory] || []).length > 0 && (
              <div className="mt-3 border-l border-slate-200 pl-2.5">
                <DestinationTreeSectionLabel label="Choose one" detail={normalizePublicStudyLabel(activeAlgorithmCategory)} />
                <div className="mb-1.5">
                  <DestinationNodeButton
                    label="Start here"
                    tone="overview"
                    compact
                    isActive={!activeAlgorithmSubtopic}
                    onClick={() => {
                      setActiveAlgorithmSubtopic(undefined);
                      pushStudyDestination(WorkspaceKey.ALGORITHMS, {
                        kind: 'topic_overview',
                        majorTopicId: activeAlgorithmCategory,
                      });
                      onSectionChange(Section.DIDACTIC_ALGORITHMS);
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  {(algorithmStudyTree.subtopicsByRoot[activeAlgorithmCategory] || []).map((entry) => {
                    const isActive = activeAlgorithmSubtopic === entry.id;
                    return (
                      <DestinationNodeButton
                        key={entry.id}
                        onClick={() => {
                          setActiveAlgorithmSubtopic(entry.id);
                          pushStudyDestination(WorkspaceKey.ALGORITHMS, {
                            kind: 'subtopic_overview',
                            majorTopicId: activeAlgorithmCategory,
                            subtopicId: entry.id,
                          });
                          onSectionChange(Section.DIDACTIC_ALGORITHMS);
                        }}
                        isActive={isActive}
                        label={entry.label}
                        tone="subtopic"
                        compact
                        detail={undefined}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </DestinationTreePanel>
        )}
        <NavLink
          label="Sign-Out"
          ariaLabel="Pathology Sign-Out Workflows"
          isActive={isSignOutActive}
          onClick={() => onSectionChange(Section.SIGN_OUT_SIMULATOR)}
          icon={<MicroscopeIcon className="h-5 w-5" />}
        />
        {isSignOutActive && (
          <div className="ml-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <DidacticWorkspaceNav
              activeSection={currentSection === Section.BREAST_SIGNOUT_MASTERCLASS ? Section.SIGN_OUT_SIMULATOR : currentSection}
              onSectionChange={onSectionChange}
              orientation="vertical"
              items={signOutWorkspaceItems}
              compact
            />
          </div>
        )}

      </nav>

      <div className="mt-auto pt-4 border-t border-slate-200">
        {user ? (
            <>
                <div className="px-4 py-2">
                    <div className="flex items-center">
                        <UserCircleIcon className="h-8 w-8 text-slate-400 flex-shrink-0" />
                        <div className="ml-3 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{user.username}</p>
                        <p className="text-xs text-slate-600 truncate">{user.email}</p>
                        </div>
                    </div>
                </div>
                <div className="px-4 py-2 mt-1">
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg text-slate-700 hover:bg-rose-100 hover:text-rose-800 transition-all duration-200"
                    >
                        <LogoutIcon className="h-5 w-5 mr-3" />
                        <span>Logout</span>
                    </button>
                </div>
            </>
        ) : null}
      </div>
    </aside>
  );
};

export default Sidebar;
