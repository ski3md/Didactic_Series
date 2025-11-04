import React, { useState, useEffect, useCallback } from 'react';
import Card from './ui/Card.tsx';
import SectionHeader from './ui/SectionHeader.tsx';
import Alert from './ui/Alert.tsx';
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from './icons.tsx';
import { User, MCQ } from '../types.ts';
import { modules } from '../data/modules.ts';

const MAX_QUIZ_QUESTIONS = 5;

// Helper to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
    return [...array].sort(() => Math.random() - 0.5);
};

// Combine and shuffle all MCQs from all modules
const allMcqs: MCQ[] = modules.flatMap(m => m.mcqs);
const questionBankSize = allMcqs.length;

interface AssessmentPhaseProps {
  user: User | null;
}

const AssessmentPhase: React.FC<AssessmentPhaseProps> = ({ user }) => {
    const [quizQuestions, setQuizQuestions] = useState<MCQ[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<(string | null)[]>([]);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);

    const questionCount = quizQuestions.length;
    const answeredCount = selectedAnswers.filter((answer) => answer !== null).length;
    const isLastQuestion = questionCount > 0 && currentQuestionIndex === questionCount - 1;
    const hasQuestions = questionBankSize > 0;
    const showQuestionShortfallNotice = questionCount > 0 && questionCount < MAX_QUIZ_QUESTIONS;

    const startNewQuiz = useCallback(() => {
        setIsInitializing(true);

        if (!hasQuestions) {
            setQuizQuestions([]);
            setSelectedAnswers([]);
            setCurrentQuestionIndex(0);
            setIsSubmitted(false);
            setIsInitializing(false);
            return;
        }

        const questionLimit = Math.min(MAX_QUIZ_QUESTIONS, questionBankSize);
        const newQuestions = shuffleArray(allMcqs).slice(0, questionLimit);

        setQuizQuestions(newQuestions);
        setCurrentQuestionIndex(0);
        setSelectedAnswers(new Array(questionLimit).fill(null));
        setIsSubmitted(false);
        setIsInitializing(false);
    }, [hasQuestions, questionBankSize]);
    
    useEffect(() => {
        startNewQuiz();
    }, [startNewQuiz]);

    useEffect(() => {
        if (questionCount > 0 && currentQuestionIndex >= questionCount) {
            setCurrentQuestionIndex(questionCount - 1);
        }
    }, [currentQuestionIndex, questionCount]);

    const currentQuestion = questionCount > 0 ? quizQuestions[currentQuestionIndex] : undefined;

    const handleSelectAnswer = (choice: string) => {
        if (isSubmitted || !currentQuestion) return;
        const newAnswers = [...selectedAnswers];
        newAnswers[currentQuestionIndex] = choice;
        setSelectedAnswers(newAnswers);
    };
    
    const handleSubmitQuiz = () => {
        setIsSubmitted(true);
    };

    const getOptionClass = (choice: string) => {
        if (!currentQuestion) {
            return 'bg-white border-slate-200 text-slate-500 cursor-not-allowed';
        }
        if (!isSubmitted) {
            return selectedAnswers[currentQuestionIndex] === choice
                ? 'bg-sky-100 border-sky-400 ring-2 ring-sky-300' 
                : 'bg-white border-slate-300 hover:bg-slate-50 hover:border-slate-400';
        }
        if (choice === currentQuestion.answer) {
            return 'bg-teal-50 border-teal-500 text-teal-900';
        }
        if (choice === selectedAnswers[currentQuestionIndex]) {
            return 'bg-rose-50 border-rose-500 text-rose-900';
        }
        return 'bg-slate-100 border-slate-300 text-slate-600 cursor-default';
    };

  const score = quizQuestions.reduce((total, question, index) => {
      return total + (selectedAnswers[index] === question.answer ? 1 : 0);
  }, 0);

  if (isInitializing) {
      return (
        <div className="animate-fade-in">
          <SectionHeader 
            title="Board-Style Quiz"
            subtitle="Measuring your ability to integrate findings and form a diagnosis."
          />
          <Card>
            <p className="text-slate-700">Loading the current quiz...</p>
          </Card>
        </div>
      );
  }

  if (!hasQuestions) {
      return (
        <div className="animate-fade-in">
          <SectionHeader 
            title="Board-Style Quiz"
            subtitle="Measuring your ability to integrate findings and form a diagnosis."
          />
          <Card>
            <Alert type="warning" title="Question bank unavailable">
              We don&apos;t have any MCQs in the module library yet. Please add cases with question content to <strong>src/data/modules.ts</strong> to unlock assessments.
            </Alert>
          </Card>
        </div>
      );
  }

  if (!currentQuestion) {
      return (
        <div className="animate-fade-in">
          <SectionHeader 
            title="Board-Style Quiz"
            subtitle="Measuring your ability to integrate findings and form a diagnosis."
          />
          <Card>
            <Alert type="error" title="Unable to load quiz">
              Something went wrong while preparing this attempt. Please try launching a new quiz.
            </Alert>
            <button
              onClick={startNewQuiz}
              className="mt-6 bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-sky-700 transition-colors"
            >
              Reload Quiz
            </button>
          </Card>
        </div>
      );
  }

  return (
    <div className="animate-fade-in">
      <SectionHeader 
        title="Board-Style Quiz"
        subtitle="Measuring your ability to integrate findings and form a diagnosis."
      />
      
      <Card>
        {showQuestionShortfallNotice && (
          <Alert type="info" className="mb-6">
            Only {questionCount} question{questionCount === 1 ? '' : 's'} are available right now. Add more MCQs to <strong>src/data/modules.ts</strong> to increase the pool (max {MAX_QUIZ_QUESTIONS} per attempt).
          </Alert>
        )}
        {!isSubmitted ? (
            <>
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-xl font-semibold font-serif text-slate-900">Question {currentQuestionIndex + 1} of {questionCount}</h2>
                        <p className="text-xs text-slate-500 mt-1">Answered: {answeredCount} / {questionCount}</p>
                    </div>
                    <p className="text-sm font-medium text-slate-600">{currentQuestion.topic}</p>
                </div>
                
                <p className="text-slate-800 mb-6">{currentQuestion.question}</p>
                
                <div className="space-y-3">
                {currentQuestion.choices.map((choice) => (
                    <button
                    key={choice}
                    onClick={() => handleSelectAnswer(choice)}
                    className={`w-full text-left p-4 border rounded-lg transition-all duration-200 flex items-center ${getOptionClass(choice)} cursor-pointer`}
                    >
                        <span className="flex-1">{choice}</span>
                    </button>
                ))}
                </div>

                <div className="mt-8 border-t border-slate-200 pt-6 flex justify-between items-center">
                    <button 
                        onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentQuestionIndex === 0}
                        className="font-semibold text-sky-700 hover:text-sky-800 p-2 disabled:opacity-50"
                    >&larr; Previous</button>
                    {isLastQuestion ? (
                        <button 
                            onClick={handleSubmitQuiz}
                            disabled={answeredCount !== questionCount}
                            className="bg-sky-600 text-white font-semibold py-2.5 px-8 rounded-lg hover:bg-sky-700 transition-colors disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed shadow-sm"
                        >Submit Quiz</button>
                    ) : (
                        <button 
                            onClick={() => setCurrentQuestionIndex(prev => Math.min(questionCount - 1, prev + 1))}
                            disabled={currentQuestionIndex >= questionCount - 1}
                            className="font-semibold text-sky-700 hover:text-sky-800 p-2 disabled:opacity-50"
                        >Next &rarr;</button>
                    )}
                </div>
            </>
        ) : (
            <div className="text-center">
                <h2 className="text-2xl font-semibold font-serif text-slate-900">Quiz Complete!</h2>
                <p className="text-slate-700 mt-2">You scored</p>
                <p className="text-6xl font-bold text-sky-600 my-4">{score} / {questionCount}</p>
                
                <div className="mt-8 mb-6 space-y-4 text-left">
                    {quizQuestions.map((q, i) => (
                        <Card key={i} className="!mb-0">
                            <p className="font-semibold text-slate-800">{i+1}. {q.question}</p>
                            <div className={`mt-2 flex items-start text-sm ${selectedAnswers[i] === q.answer ? 'text-teal-800' : 'text-rose-800'}`}>
                                {selectedAnswers[i] === q.answer 
                                    ? <CheckCircleIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                                    : <XCircleIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                                }
                                <div>Your answer: <span className="font-bold">{selectedAnswers[i] || 'Not Answered'}</span>.
                                {selectedAnswers[i] !== q.answer && <span className="block">Correct answer: <span className="font-bold">{q.answer}</span></span>}
                                </div>
                            </div>
                             <div className="mt-2">
                                <Alert type="info">
                                    <strong>Rationale:</strong> {q.rationale}
                                </Alert>
                            </div>
                        </Card>
                    ))}
                </div>

                <button
                    onClick={startNewQuiz}
                    className="bg-sky-600 text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-sky-700 transition-colors flex items-center shadow-sm mx-auto"
                >
                    <ArrowPathIcon className="h-5 w-5 mr-2" />
                    Take Another Quiz
                </button>
            </div>
        )}
      </Card>
    </div>
  );
};

export default AssessmentPhase;
