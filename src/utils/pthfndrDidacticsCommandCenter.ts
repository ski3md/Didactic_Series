import type {
  BoardPassingPrediction,
  BoardPassingPredictorInputs,
  DidacticsCockpitCard,
  DidacticsReviewGridBehavior,
  DidacticsVisualMode,
  ImportedQuestion,
  MCQ,
  PathfndrPerformanceSnapshot,
  PerformanceForecast,
  ReviewGridTile,
  TimeSeriesPoint,
  TutorialAbpathScope,
} from '../types.ts';

export interface QuestionSessionRecord {
  questionNumber: number;
  questionId: string;
  selectedAnswer?: string;
  isCorrect?: boolean;
  isFlagged?: boolean;
  confidence?: 1 | 2 | 3 | 4 | 5;
  timeToAnswerSeconds?: number;
}

export interface AnswerKeyDiscrepancyAlert {
  severity: 'moderate' | 'high';
  title: string;
  detail: string;
  requiresFacultyReview: boolean;
}

export interface DidacticsCommandCenterSchema {
  cockpitCards: DidacticsCockpitCard[];
  visualModes: DidacticsVisualMode[];
  reviewGrid: DidacticsReviewGridBehavior;
  answerKeyValidation: {
    enabled: boolean;
    compareAgainstInternalKnowledgeBase: boolean;
    flagBiologicallyImplausibleAnswers: boolean;
    requireFacultyReviewForDiscordantItems: boolean;
  };
}

export const PTHFNDR_DIDACTICS_COMMAND_CENTER_SCHEMA: DidacticsCommandCenterSchema = {
  cockpitCards: [
    "Today's board-risk topics",
    'Weakest CP domains',
    'Questions remaining',
    'Accuracy vs percentile',
    'Incorrect cluster review',
    'Time per question',
    'Predicted readiness',
    'Next 20-question drill',
    'Answer-key discrepancy alerts',
  ],
  visualModes: [
    'cockpit_dashboard',
    'pthfndr_review_grid',
    'weakness_heatmap',
    'abpath_anchor_map',
    'forecast_timeline',
    'question_review_stack',
    'board_passing_calculator',
  ],
  reviewGrid: {
    showTileGrid: true,
    groupBy: 'abpathAnchor',
    tileClickBehavior: 'open_question_review',
    showCorrectIncorrectOverlay: true,
    showWeakClusterSummary: true,
  },
  answerKeyValidation: {
    enabled: true,
    compareAgainstInternalKnowledgeBase: true,
    flagBiologicallyImplausibleAnswers: true,
    requireFacultyReviewForDiscordantItems: true,
  },
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const percent = (value: number) => Math.round(value * 10) / 10;

export const mcqToImportedQuestion = (
  mcq: MCQ,
  scope?: TutorialAbpathScope,
  selectedAnswer?: string
): ImportedQuestion => ({
  source: 'custom',
  stem: mcq.question,
  options: mcq.choices.map((choice, index) => ({
    label: String.fromCharCode(65 + index),
    text: choice,
  })),
  selectedAnswer,
  markedCorrectAnswer: mcq.answer,
  domain: scope?.root,
  abpathAnchorPath: scope?.primaryPath,
  importWarnings: [],
});

export const buildReviewGridTiles = (
  mcqs: MCQ[],
  records: QuestionSessionRecord[],
  scope?: TutorialAbpathScope
): ReviewGridTile[] => {
  const recordByQuestion = new Map(records.map((record) => [record.questionNumber, record]));
  return mcqs.map((mcq, index) => {
    const questionNumber = index + 1;
    const record = recordByQuestion.get(questionNumber);
    let result: ReviewGridTile['result'] = 'unanswered';
    if (record?.isFlagged) {
      result = 'flagged';
    } else if (typeof record?.isCorrect === 'boolean') {
      result = record.isCorrect ? 'correct' : 'incorrect';
    }
    return {
      questionNumber,
      domain: scope?.root || mcq.topic || 'Question Review',
      result,
      questionId: record?.questionId || `${scope?.root || 'tutorial'}-${questionNumber}`,
      abpathAnchorPath: scope?.primaryPath,
      timeToAnswerSeconds: record?.timeToAnswerSeconds,
      confidence: record?.confidence,
    };
  });
};

export const buildPerformanceSnapshot = (
  subject: string,
  mcqs: MCQ[],
  records: QuestionSessionRecord[]
): PathfndrPerformanceSnapshot => {
  const totalQuestions = mcqs.length;
  const answered = records.filter((record) => typeof record.isCorrect === 'boolean');
  const correct = answered.filter((record) => record.isCorrect).length;
  const incorrect = answered.filter((record) => record.isCorrect === false).length;
  const numberAnswered = answered.length;
  const remainingQuestions = Math.max(0, totalQuestions - numberAnswered);
  const percentAnswered = totalQuestions > 0 ? percent((numberAnswered / totalQuestions) * 100) : 0;
  const remainingPercent = totalQuestions > 0 ? percent((remainingQuestions / totalQuestions) * 100) : 0;
  const percentCorrect = numberAnswered > 0 ? percent((correct / numberAnswered) * 100) : 0;
  const userPercentile = clamp(Math.round(percentCorrect * 0.92 + percentAnswered * 0.15), 1, 99);

  return {
    subject,
    percentAnswered,
    numberAnswered,
    totalQuestions,
    remainingQuestions,
    remainingPercent,
    percentCorrect,
    correct,
    incorrect,
    userPercentile,
    allUsersAverage: 68,
    allUsersMedian: 70,
    allUsersMode: 72,
    allUsersRange: '42-91',
  };
};

export const validateImportedQuestionAnswerKey = (
  imported: ImportedQuestion
): AnswerKeyDiscrepancyAlert[] => {
  const stem = imported.stem.toLowerCase();
  const marked = (imported.markedCorrectAnswer || '').toLowerCase();
  const options = imported.options.map((option) => option.text.toLowerCase());
  const alerts: AnswerKeyDiscrepancyAlert[] = [];

  if (
    stem.includes('enterococcus') &&
    marked.includes('optochin') &&
    options.some((option) => option.includes('arabinose'))
  ) {
    alerts.push({
      severity: 'high',
      title: 'Biologic answer-key mismatch',
      detail:
        'This item appears discordant with standard board-level microbiology logic. Enterococcus species are not identified by optochin sensitivity; arabinose fermentation is the more plausible discriminator in this context.',
      requiresFacultyReview: true,
    });
  }

  if (
    stem.includes('gram positive cocci') &&
    marked.includes('optochin') &&
    !stem.includes('streptococcus pneumoniae')
  ) {
    alerts.push({
      severity: 'moderate',
      title: 'Potential keyed-organism mismatch',
      detail:
        'Optochin is a narrow discriminator and may be biologically implausible unless the stem is clearly targeting pneumococcus-level differentiation.',
      requiresFacultyReview: true,
    });
  }

  return alerts;
};

export const buildBoardPassingPrediction = (
  inputs: BoardPassingPredictorInputs,
  snapshot: PathfndrPerformanceSnapshot
): BoardPassingPrediction => {
  const inServiceScore = inputs.inServiceScore ?? 55;
  const ankiAccuracy = inputs.ankiAccuracy ?? snapshot.percentCorrect;
  const studyHours = inputs.studyHoursPerWeek ?? 6;
  const grossingExperience = inputs.grossingExperience ?? 5;
  const feedbackQuality = inputs.feedbackQuality ?? 5;
  const wellBeingScore = inputs.wellBeingScore ?? 5;

  const predictedScore = percent(
    clamp(
      inServiceScore * 0.28 +
        snapshot.percentCorrect * 0.24 +
        snapshot.percentAnswered * 0.12 +
        inputs.mcqPracticeSessions * 1.4 +
        inputs.pthfndrSessions * 1.2 +
        ankiAccuracy * 0.12 +
        studyHours * 1.1 +
        grossingExperience * 0.35 +
        feedbackQuality * 0.6 +
        wellBeingScore * 0.5,
      20,
      92
    )
  );

  const limitingFactors: string[] = [];
  if (snapshot.percentAnswered < 45) limitingFactors.push('Low question-volume coverage');
  if (snapshot.percentCorrect < 68) limitingFactors.push('Accuracy remains below board-safe range');
  if ((inputs.studyHoursPerWeek ?? 0) < 5) limitingFactors.push('Study time is still thin');
  if ((inputs.feedbackQuality ?? 0) < 5) limitingFactors.push('Feedback loop needs stronger attending-level correction');
  if ((inputs.wellBeingScore ?? 0) < 5) limitingFactors.push('Well-being drag may limit retention and consistency');

  let readinessBand: BoardPassingPrediction['readinessBand'] = 'unsafe';
  if (predictedScore >= 82) readinessBand = 'maintenance';
  else if (predictedScore >= 74) readinessBand = 'likely_pass';
  else if (predictedScore >= 66) readinessBand = 'improving';
  else if (predictedScore >= 58) readinessBand = 'borderline';

  const nextActions = [
    snapshot.percentCorrect < 72 ? 'Run a 20-question targeted drill on the weakest anchor cluster.' : 'Maintain current accuracy with a mixed-anchor drill.',
    snapshot.remainingQuestions > 0 ? 'Reduce unanswered questions in the current review set before opening new material.' : 'Shift time toward flagged and incorrect questions instead of new recall items.',
    limitingFactors.includes('Accuracy remains below board-safe range')
      ? 'Review every incorrect question against its ABPath anchor before the next session.'
      : 'Use spaced retrieval to protect strong domains while backfilling weaker ones.',
  ];

  return {
    predictedScore,
    readinessBand,
    confidence: recordsConfidence(snapshot, inputs),
    limitingFactors,
    nextActions,
  };
};

const recordsConfidence = (
  snapshot: PathfndrPerformanceSnapshot,
  inputs: BoardPassingPredictorInputs
): BoardPassingPrediction['confidence'] => {
  if (snapshot.numberAnswered >= 40 && inputs.mcqPracticeSessions >= 4 && inputs.pthfndrSessions >= 3) {
    return 'high';
  }
  if (snapshot.numberAnswered >= 15 && inputs.mcqPracticeSessions >= 2) {
    return 'moderate';
  }
  return 'low';
};

export const buildPerformanceForecast = (
  subject: string,
  metric: PerformanceForecast['metric'],
  observedPoints: TimeSeriesPoint[]
): PerformanceForecast => {
  const last = observedPoints.at(-1)?.value ?? 0;
  const trend =
    observedPoints.length >= 2
      ? observedPoints[observedPoints.length - 1].value - observedPoints[observedPoints.length - 2].value
      : 0;

  const forecastPoints: TimeSeriesPoint[] = Array.from({ length: 3 }, (_, index) => ({
    label: `Forecast ${index + 1}`,
    value: percent(clamp(last + trend * (index + 1), 0, metric === 'remainingQuestions' ? 999 : 100)),
  }));

  return {
    subject,
    metric,
    observedPoints,
    forecastPoints,
    forecastModel: 'moving_average',
    warning:
      metric === 'percentCorrect' && forecastPoints[forecastPoints.length - 1].value < 68
        ? 'Accuracy trend remains below a comfortable board-passing margin.'
        : undefined,
  };
};

export const buildWeakClusterSummary = (tiles: ReviewGridTile[]) => {
  const grouped = new Map<string, { incorrect: number; flagged: number; total: number }>();
  for (const tile of tiles) {
    const key = tile.abpathAnchorPath || tile.domain;
    const current = grouped.get(key) || { incorrect: 0, flagged: 0, total: 0 };
    current.total += 1;
    if (tile.result === 'incorrect') current.incorrect += 1;
    if (tile.result === 'flagged') current.flagged += 1;
    grouped.set(key, current);
  }
  return Array.from(grouped.entries())
    .map(([label, counts]) => ({ label, ...counts }))
    .sort((left, right) => right.incorrect + right.flagged - (left.incorrect + left.flagged))
    .slice(0, 5);
};
