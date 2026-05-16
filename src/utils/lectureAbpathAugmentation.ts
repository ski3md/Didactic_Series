import {
  DxEntityCard,
  Flashcard,
  InteractiveLectureSlide,
  LectureAlgorithmRecord,
  LecturePitfallCard,
  LectureQuickCheck,
  LectureTissueLayerSet,
  MCQ,
} from '../types.ts';
import { lectureAbpathSpecSeeds, type LectureAbpathSpecTopicSeed } from '../content/lectures/lectureAbpathSpecSeeds.ts';
import { PromotedLectureRecord } from './lectureLibraryCatalog.ts';

export interface LectureAbpathAugmentation {
  objectives: string[];
  slides: InteractiveLectureSlide[];
  algorithms: LectureAlgorithmRecord[];
  tissueLayerSets: LectureTissueLayerSet[];
  entityCards: DxEntityCard[];
  pitfalls: LecturePitfallCard[];
  quickChecks: LectureQuickCheck[];
  mcqs: MCQ[];
  flashcards: Flashcard[];
  referenceFocusTerms: string[];
  relatedTutorialQueries: string[];
}

type SyllabusTopicRecord = LectureAbpathSpecTopicSeed;

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const titleCaseId = (value: string) =>
  normalize(value)
    .split(' ')
    .filter(Boolean)
    .slice(0, 8)
    .join('-');

const fallbackTopics: SyllabusTopicRecord[] = [
  {
    title: 'Specimen work-up and disease characterization',
    category: 'ap_foundations',
    designation: 'C',
    path: 'Anatomic Pathology > Diagnostic methods > Specimen work-up and disease characterization',
  },
  {
    title: 'Normal anatomy and histology',
    category: 'ap_foundations',
    designation: 'C',
    path: 'Anatomic Pathology > Normal anatomy and histology comparator',
  },
  {
    title: 'Differential diagnosis and ancillary selection',
    category: 'ap_foundations',
    designation: 'C',
    path: 'Anatomic Pathology > Differential diagnosis > Ancillary studies',
  },
  {
    title: 'Report consequence and clinical communication',
    category: 'ap_foundations',
    designation: 'C',
    path: 'Anatomic Pathology > Reporting > Management-changing elements',
  },
  {
    title: 'Quality and safety pitfalls',
    category: 'ap_foundations',
    designation: 'AR',
    path: 'Anatomic Pathology > Quality assurance > Safety-critical misses',
  },
];

const selectTopicsForLecture = (lecture: PromotedLectureRecord) => lectureAbpathSpecSeeds[lecture.id] ?? fallbackTopics;

const topicPath = (topic: SyllabusTopicRecord) => topic.path || topic.title;

const makeObjectives = (lecture: PromotedLectureRecord, topics: SyllabusTopicRecord[]) => {
  const domain = lecture.category ?? lecture.title;
  const sampled = topics.slice(0, 5).map((topic) => topic.title);
  return [
    `Map ${domain} cases to ABPath Core/Foundational and Advanced Resident content-specification topics before committing to a diagnosis.`,
    `Use specimen type, normal histology, and low-power architecture to triage ${sampled.slice(0, 3).join(', ') || domain}.`,
    `Build a differential diagnosis that contrasts ${sampled[0] || 'the index entity'} with its most important mimic before ordering ancillary studies.`,
    `Select stains, molecular tests, or frozen-section deferral only when the result changes classification, margin status, stage, or immediate management.`,
    `State the report element or safety-critical pitfall that must be communicated for the ABPath-specified entities in this lecture.`,
  ];
};

const makeSlides = (lecture: PromotedLectureRecord, topics: SyllabusTopicRecord[]): InteractiveLectureSlide[] => [
  {
    type: 'intro',
    title: 'ABPath content-specification frame',
    content: `This lecture is explicitly crosswalked to ${topics.length} ABPath AP content-specification topics. Start with the exam-relevant task: identify the entity, process the specimen appropriately, characterize disease, and communicate the management-changing report element.`,
  },
  {
    type: 'framework',
    title: 'Normal-to-abnormal orientation',
    content: `Begin with normal anatomy/histology and specimen context for ${lecture.category ?? lecture.title}; then move to physiologic/reactive processes, neoplasia, and reporting consequences.`,
  },
  {
    type: 'algorithm',
    title: 'Diagnostic decision sequence',
    content: 'Specimen type -> low-power pattern -> high-power discriminator -> targeted ancillary test -> report consequence.',
  },
  {
    type: 'knowledge_pack',
    title: 'ABPath topic targets',
    content: topics.slice(0, 6).map((topic) => `${topic.title}: ${topicPath(topic)}`).join('\n'),
  },
  {
    type: 'quick_check',
    title: 'Retrieval before reveal',
    content: 'Before looking at the answer key, name the category, one required microscopic feature, the closest mimic, and the report phrase that changes care.',
  },
];

const makeAlgorithm = (lecture: PromotedLectureRecord, topics: SyllabusTopicRecord[]): LectureAlgorithmRecord => {
  const idRoot = titleCaseId(lecture.id || lecture.title);
  return {
    id: `${idRoot}-abpath-diagnostic-sequence`,
    title: `${lecture.title} ABPath diagnostic sequence`,
    category: lecture.category ?? 'Anatomic Pathology',
    summary: 'A specimen-first pathway aligned to ABPath expectations for entity recognition, work-up, disease characterization, and reporting judgment.',
    startNodeId: 'specimen-context',
    nodes: {
      'specimen-context': {
        id: 'specimen-context',
        type: 'start',
        title: 'Specimen and clinical context',
        description: `Confirm specimen type, procedure, site, adequacy, and the clinical question before interpreting ${lecture.title}.`,
        options: [
          {
            label: 'Proceed to low-power triage',
            nextNodeId: 'low-power-triage',
            rationale: 'ABPath content specifications emphasize specimen work-up and disease characterization, not diagnosis as an isolated label.',
          },
        ],
      },
      'low-power-triage': {
        id: 'low-power-triage',
        type: 'morphology_gate',
        title: 'Low-power pattern triage',
        description: 'Commit to the dominant architecture before high-power details or stains.',
        morphologyFeatures: [
          'Normal/reactive comparator identified',
          'Dominant architecture or compartment named',
          'Adequacy or sampling limitation stated',
        ],
        options: [
          {
            label: 'Move to differential and ancillary selection',
            nextNodeId: 'ancillary-selection',
            rationale: 'Ancillary testing should refine a morphologic differential rather than replace it.',
          },
        ],
      },
      'ancillary-selection': {
        id: 'ancillary-selection',
        type: 'decision',
        title: 'Ancillary selection',
        description: 'Choose stains or molecular tests only when they separate a specific ABPath entity from a mimic or affect reportable classification.',
        recommendedInitialIHC: [
          'Lineage or site-confirming panel selected by differential',
          'Proliferation or surrogate marker only when classification requires it',
        ],
        pitfalls: ['Do not use a stain panel to compensate for an uncommitted H&E differential.'],
        options: [
          {
            label: 'Synthesize report consequence',
            nextNodeId: 'report-consequence',
            rationale: 'The end point is the management-changing diagnosis, stage, margin, adequacy, or deferral statement.',
          },
        ],
      },
      'report-consequence': {
        id: 'report-consequence',
        type: 'result',
        title: 'Report consequence',
        description: `For ${topics[0]?.title ?? lecture.title}, state the diagnosis, required qualifiers, staging/synoptic or margin element, and one safety-critical limitation.`,
        diagnosis: topics[0]?.title ?? lecture.title,
        pearls: topics.slice(0, 3).map((topic) => `ABPath target: ${topicPath(topic)}`),
        relatedLectureId: lecture.id,
        relatedTutorialQuery: topics[0]?.title ?? lecture.title,
        relatedImageTerms: topics.slice(0, 3).map((topic) => topic.title),
      },
    },
  };
};

const makeTissueLayerSet = (lecture: PromotedLectureRecord, topics: SyllabusTopicRecord[]): LectureTissueLayerSet => ({
  id: `${titleCaseId(lecture.id)}-abpath-microscopy-plan`,
  lectureId: lecture.id,
  title: `${lecture.title} microscopy checklist`,
  summary: 'Image checklist scaffold aligned to ABPath content specifications; attach licensed H&E, gross, IHC, or WSI assets during faculty review.',
  comparisonMode: 'branch',
  images: [],
  optionalWsi: {
    slideId: `${titleCaseId(lecture.id)}-abpath-wsi-plan`,
    title: `${lecture.title} ABPath slide review plan`,
    description: 'Checklist-first slide review plan for future WSI or static-image attachment.',
    teachingSteps: [
      `Find normal ${lecture.category ?? 'tissue'} comparator and orient the specimen.`,
      `At low power, classify the process using these ABPath targets: ${topics.slice(0, 4).map((topic) => topic.title).join(', ')}.`,
      'At high power, name one required feature and one mimic discriminator before showing the answer.',
      'Decide whether IHC, molecular testing, deeper levels, or deferral changes the report.',
      'Close with the staging, margin, adequacy, or management statement the report must include.',
    ],
  },
});

const makeEntityCards = (lecture: PromotedLectureRecord, topics: SyllabusTopicRecord[]): DxEntityCard[] =>
  topics.slice(0, 6).map((topic) => ({
    entityId: topic.title,
    summary: `ABPath ${topic.designation ?? 'AP'} topic: ${topicPath(topic)}.`,
    keyMorphology: [
      'Start with normal/reactive comparator for the involved site.',
      'Name the low-power architecture or compartment before high-power interpretation.',
      'State the required discriminator that separates this entity from its closest mimic.',
    ],
    keyIHC: {
      positive: ['Select a targeted panel only after the H&E differential is explicit.'],
      negative: ['Avoid broad undirected panels that do not change classification or reporting.'],
      patterns: ['Document pattern, distribution, and internal controls when stains are used.'],
    },
    criticalDifferential: topics
      .filter((candidate) => candidate.title !== topic.title)
      .slice(0, 3)
      .map((candidate) => candidate.title),
    pearls: [
      {
        type: 'workflow',
        text: 'ABPath framing requires entity recognition plus specimen work-up and disease characterization.',
      },
      {
        type: 'reporting',
        text: 'Convert the diagnosis into the report element that changes management, staging, adequacy, or triage.',
      },
    ],
    prognosis: {
      tier: 'Contextual',
      drivers: [
        {
          name: 'Specimen adequacy, grade/stage, margin, invasion, and ancillary confirmation as applicable',
          effect: 'contextual',
        },
      ],
      counseling: ['Tie prognosis to the final classified entity and required report qualifiers.'],
    },
    managementImplications: [
      'Explicitly report adequacy, staging/synoptic, margin, or deferral elements when applicable.',
      'Escalate uncertainty when permanent sections, additional sampling, or ancillary studies are required.',
    ],
  }));

const makePitfalls = (lecture: PromotedLectureRecord): LecturePitfallCard[] => [
  {
    id: `${titleCaseId(lecture.id)}-stain-first-pitfall`,
    title: 'Stain-first interpretation',
    overcallRisk: 'A broad stain panel can make a reactive or sampled process look over-classified.',
    undercallRisk: 'A negative or nonspecific panel can falsely reassure when the low-power pattern is high risk.',
    stainHelp: 'Use stains to answer a named differential question and document internal controls.',
    morphologyGuardrail: 'Write the H&E differential before ordering or interpreting ancillary tests.',
  },
  {
    id: `${titleCaseId(lecture.id)}-specimen-context-pitfall`,
    title: 'Missing the specimen consequence',
    overcallRisk: 'Calling the entity without adequacy, margin, invasion, or stage language can overstate certainty.',
    undercallRisk: 'Failing to state the management-changing report element can make a correct diagnosis clinically incomplete.',
    stainHelp: 'Ancillary tests should support the reportable classification, not distract from specimen limitations.',
    morphologyGuardrail: 'End every case with the report phrase that changes care.',
  },
];

const makeQuickChecks = (lecture: PromotedLectureRecord, topics: SyllabusTopicRecord[]): LectureQuickCheck[] => [
  {
    id: `${titleCaseId(lecture.id)}-abpath-recall`,
    prompt: `Name two ABPath content-specification entities or processes covered by ${lecture.title}.`,
    teachingCue: topics.slice(0, 4).map((topic) => topic.title).join(', '),
    checkpointType: 'oral-recall',
  },
  {
    id: `${titleCaseId(lecture.id)}-morphology-before-stain`,
    prompt: 'Before ordering stains, what low-power and high-power facts must be stated?',
    teachingCue: 'State the compartment/architecture, required microscopic discriminator, closest mimic, and whether the specimen is adequate for the report question.',
    checkpointType: 'morphology-check',
    checkpoints: [
      'Specimen type and adequacy are explicit.',
      'Normal/reactive comparator has been named.',
      'Dominant architecture and high-power discriminator are stated.',
      'Ancillary test would change classification or report language.',
    ],
  },
];

const makeMcqs = (lecture: PromotedLectureRecord, topics: SyllabusTopicRecord[]): MCQ[] => [
  {
    topic: lecture.category ?? lecture.title,
    question: `Which step best aligns ${lecture.title} with ABPath AP content-specification expectations?`,
    choices: [
      'Diagnose from the most memorable buzzword',
      'Start with specimen context, morphology, differential, targeted ancillary selection, and report consequence',
      'Order a broad immunostain panel before reviewing low power',
      'Delay all classification until molecular testing is complete',
    ],
    answer: 'Start with specimen context, morphology, differential, targeted ancillary selection, and report consequence',
    rationale: 'The AP content specifications assess entity recognition, specimen work-up, disease characterization, and judgment around diagnostic methods.',
    choiceRationales: {
      'Diagnose from the most memorable buzzword':
        'This is unsafe because ABPath competence requires specimen context and disease characterization, not isolated recognition of a memorable phrase.',
      'Start with specimen context, morphology, differential, targeted ancillary selection, and report consequence':
        'This is the best answer because it follows the complete AP workflow from specimen orientation through the management-changing report element.',
      'Order a broad immunostain panel before reviewing low power':
        'This reverses the diagnostic sequence. Stains should answer a named morphologic differential rather than replace low-power and high-power assessment.',
      'Delay all classification until molecular testing is complete':
        'This overuses molecular testing. Many AP decisions require timely morphology-based classification with targeted ancillary testing only when it changes the final report.',
    },
  },
  {
    topic: lecture.category ?? lecture.title,
    question: `A learner can name ${topics[0]?.title ?? 'an entity'} but cannot state the report consequence. What is the most important remediation?`,
    choices: [
      'More memorized synonyms',
      'A reporting drill tied to staging, margin, adequacy, management, or deferral language',
      'Removing the case from the curriculum',
      'Skipping the normal histology comparator',
    ],
    answer: 'A reporting drill tied to staging, margin, adequacy, management, or deferral language',
    rationale: 'ABPath-level competence requires converting recognition into safe diagnostic characterization and clinically meaningful reporting.',
    choiceRationales: {
      'More memorized synonyms':
        'Synonyms may help recognition, but they do not fix the gap: the learner cannot translate the diagnosis into reportable clinical consequence.',
      'A reporting drill tied to staging, margin, adequacy, management, or deferral language':
        'This is the best remediation because it forces the learner to connect entity recognition with the report language that changes care.',
      'Removing the case from the curriculum':
        'Removing the case avoids the competency gap instead of remediating it. The case should stay and be rebuilt around consequence-based reporting.',
      'Skipping the normal histology comparator':
        'Skipping the comparator weakens morphology. Normal-to-abnormal orientation is often the anchor for safe diagnosis and reporting.',
    },
  },
];

const makeFlashcards = (lecture: PromotedLectureRecord, topics: SyllabusTopicRecord[]): Flashcard[] => [
  {
    front: `What is the ABPath-aligned sequence for ${lecture.title}?`,
    back: 'Specimen context -> normal comparator -> low-power pattern -> high-power discriminator -> targeted ancillary test -> report consequence.',
    tag: 'ABPath workflow',
  },
  {
    front: `Name a Core/Advanced topic linked to ${lecture.title}.`,
    back: topics.slice(0, 3).map((topic) => `${topic.title} (${topic.designation ?? 'AP'})`).join('; '),
    tag: 'content specification',
  },
  {
    front: 'What must every promoted lecture card teach before answer reveal?',
    back: 'Required feature, closest mimic, discriminator, and management-changing report phrase.',
    tag: 'retrieval practice',
  },
];

export const buildLectureAbpathAugmentation = (lecture: PromotedLectureRecord): LectureAbpathAugmentation => {
  const topics = selectTopicsForLecture(lecture);
  return {
    objectives: makeObjectives(lecture, topics),
    slides: makeSlides(lecture, topics),
    algorithms: [makeAlgorithm(lecture, topics)],
    tissueLayerSets: [makeTissueLayerSet(lecture, topics)],
    entityCards: makeEntityCards(lecture, topics),
    pitfalls: makePitfalls(lecture),
    quickChecks: makeQuickChecks(lecture, topics),
    mcqs: makeMcqs(lecture, topics),
    flashcards: makeFlashcards(lecture, topics),
    referenceFocusTerms: topics.slice(0, 8).map((topic) => topic.title),
    relatedTutorialQueries: topics.slice(0, 4).map((topic) => topic.title),
  };
};
