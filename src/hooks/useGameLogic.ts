import { useState, useEffect, useCallback } from 'react';
import { GameMode, DifficultyLevel, Question, IncorrectAttempt, MatchingPairsQuestion, EndGameMessageInfo, GameLogicState, GameLogicActions, NumberSequenceQuestion, VisualPatternQuestion, VisualPatternOption, NumberRecognitionOption, OddOneOutQuestion, ShapeType } from '../../types';
import { useAudio } from '../contexts/AudioContext';
import { generateQuestionsForRound } from '../services/questionService';
import { NUM_QUESTIONS_PER_ROUND, POSITIVE_FEEDBACKS, ENCOURAGING_FEEDBACKS, NEXT_QUESTION_DELAY_MS, SLOW_NEXT_QUESTION_DELAY_MS, CONGRATS_MESSAGES, CONGRATS_ICONS, ENCOURAGE_TRY_AGAIN_MESSAGE, ENCOURAGE_TRY_AGAIN_ICONS, POSITIVE_FEEDBACK_EMOJIS, ENCOURAGING_FEEDBACK_EMOJIS, VISUAL_PATTERN_QUESTIONS_MAM, VISUAL_PATTERN_QUESTIONS_CHOI, ODD_ONE_OUT_QUESTIONS_MAM, ODD_ONE_OUT_QUESTIONS_CHOI } from '../../constants';

declare var confetti: any;

interface UseGameLogicProps {
  mode: GameMode;
  difficulty: DifficultyLevel;
  unlockedSetIds: string[];
  recentlyUsedIcons: string[]; // New prop for cross-session diversity
  onEndGame: (
    incorrectAttempts: IncorrectAttempt[],
    score: number,
    starsEarnedThisRound: number,
    numQuestionsInRound: number,
    iconsUsedInRound: string[] // New: icons used in this specific round
  ) => void;
}

const useGameLogic = ({ mode, difficulty, unlockedSetIds, recentlyUsedIcons, onEndGame }: UseGameLogicProps): GameLogicState & GameLogicActions => {
  const { playSound } = useAudio();
  const [isLoading, setIsLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [starsEarnedThisRound, setStarsEarnedThisRound] = useState(0);
  const [incorrectAttempts, setIncorrectAttempts] = useState<IncorrectAttempt[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'positive' | 'encouraging' | null>(null);
  const [isInputDisabled, setIsInputDisabled] = useState(false);
  const [lastSubmittedAnswer, setLastSubmittedAnswer] = useState<string | number | string[] | null>(null);
  const [currentMatchingQuestionState, setCurrentMatchingQuestionState] = useState<MatchingPairsQuestion | null>(null);
  const [showEndGameOverlay, setShowEndGameOverlay] = useState(false);
  const [endGameMessageInfo, setEndGameMessageInfo] = useState<EndGameMessageInfo | null>(null);
  const [numQuestionsForRound, setNumQuestionsForRound] = useState(NUM_QUESTIONS_PER_ROUND);
  const [iconsUsedThisRound, setIconsUsedThisRound] = useState<string[]>([]);


  const resetGameState = useCallback(() => {
    setIsLoading(true);
    let questionsToGenerate = NUM_QUESTIONS_PER_ROUND;
    if (mode === GameMode.VISUAL_PATTERN) {
        questionsToGenerate = difficulty === DifficultyLevel.PRE_SCHOOL_MAM ? VISUAL_PATTERN_QUESTIONS_MAM : VISUAL_PATTERN_QUESTIONS_CHOI;
    } else if (mode === GameMode.ODD_ONE_OUT) {
        questionsToGenerate = difficulty === DifficultyLevel.PRE_SCHOOL_MAM ? ODD_ONE_OUT_QUESTIONS_MAM : ODD_ONE_OUT_QUESTIONS_CHOI;
    } else if (mode === GameMode.NUMBER_SEQUENCE) {
        questionsToGenerate = difficulty === DifficultyLevel.PRE_SCHOOL_MAM ? 10 : 15;
    } else if (mode === GameMode.COMPARISON && difficulty === DifficultyLevel.PRE_SCHOOL_CHOI) {
      questionsToGenerate = 25;
    }

    setNumQuestionsForRound(questionsToGenerate);

    const { questions: newQuestions, iconsUsedInRound } = generateQuestionsForRound(
        mode, 
        difficulty, 
        unlockedSetIds, 
        questionsToGenerate,
        recentlyUsedIcons // Pass recently used icons
    );
    setQuestions(newQuestions);
    setIconsUsedThisRound(Array.from(iconsUsedInRound)); // Store icons used in this generated round

    setCurrentQuestionIndex(0);
    setScore(0);
    setStarsEarnedThisRound(0);
    setIncorrectAttempts([]);
    setFeedbackMessage(null);
    setFeedbackType(null);
    setIsInputDisabled(false);
    setShowEndGameOverlay(false);
    setEndGameMessageInfo(null);
    setLastSubmittedAnswer(null);
    if (newQuestions.length > 0 && newQuestions[0]?.type === 'matching_pairs') {
      setCurrentMatchingQuestionState(newQuestions[0] as MatchingPairsQuestion);
    } else {
      setCurrentMatchingQuestionState(null);
    }
    setIsLoading(false);
  }, [mode, difficulty, unlockedSetIds, recentlyUsedIcons]);

  useEffect(() => {
    resetGameState();
  }, [resetGameState]);

  const currentQuestion = questions[currentQuestionIndex] || null;
  const progressPercent = numQuestionsForRound > 0 ? ((currentQuestionIndex + 1) / numQuestionsForRound) * 100 : 0;
  const gameModeTitle = mode as string;

  const handleCorrectAnswer = useCallback(() => {
    playSound('CORRECT_ANSWER');
    setScore((prev) => prev + 1);
    setFeedbackMessage(POSITIVE_FEEDBACKS[Math.floor(Math.random() * POSITIVE_FEEDBACKS.length)]);
    setFeedbackType('positive');
  }, [playSound]);

  const handleIncorrectAnswer = useCallback((userAnswerData: string | string[], questionToProcess: Question) => {
    playSound('WRONG_ANSWER');
    setFeedbackMessage(ENCOURAGING_FEEDBACKS[Math.floor(Math.random() * ENCOURAGING_FEEDBACKS.length)]);
    setFeedbackType('encouraging');
    setIncorrectAttempts((prev) => [...prev, { question: questionToProcess, userAnswer: userAnswerData }]);
  }, [playSound]);

  const proceedToNextQuestionOrEnd = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      const nextQ = questions[nextIndex];
      if (nextQ?.type === 'matching_pairs') {
        setCurrentMatchingQuestionState(nextQ as MatchingPairsQuestion);
      } else {
        setCurrentMatchingQuestionState(null);
      }
      setFeedbackMessage(null);
      setFeedbackType(null);
      setIsInputDisabled(false);
      setLastSubmittedAnswer(null);
    } else {
      const finalScore = score;
      let calculatedStars = 0;
      const percentageScore = numQuestionsForRound > 0 ? (finalScore / numQuestionsForRound) * 100 : 0;

      if (percentageScore >= 90) {
          calculatedStars = 5;
      } else if (percentageScore >= 75) {
          calculatedStars = 4;
      } else if (percentageScore >= 60) {
          calculatedStars = 3;
      } else if (percentageScore >= 40) {
          calculatedStars = 2;
      } else if (percentageScore >= 20) {
          calculatedStars = 1;
      } else {
          calculatedStars = 0;
      }
      setStarsEarnedThisRound(calculatedStars);

      if (calculatedStars >= 4) playSound('ROUND_WIN');
      else if (calculatedStars > 0) playSound('ENCOURAGEMENT');

      if (finalScore >= numQuestionsForRound * 0.8 && typeof confetti === 'function') {
        try { confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } }); } catch (e) { console.error("Confetti error:", e)}
      }

      let messageInfo: EndGameMessageInfo;
      if (finalScore >= numQuestionsForRound * 0.7) {
        messageInfo = {
          text: CONGRATS_MESSAGES[Math.floor(Math.random() * CONGRATS_MESSAGES.length)],
          type: 'congrats',
          icons: shuffleArray([...POSITIVE_FEEDBACK_EMOJIS, ...CONGRATS_ICONS]).slice(0, 3)
        };
      } else {
        messageInfo = {
          text: ENCOURAGE_TRY_AGAIN_MESSAGE,
          type: 'encourage',
          icons: shuffleArray([...ENCOURAGING_FEEDBACK_EMOJIS]).slice(0, 3)
        };
      }
      setEndGameMessageInfo(messageInfo);
      setShowEndGameOverlay(true);
    }
  }, [currentQuestionIndex, questions, score, numQuestionsForRound, playSound]);

  const submitAnswer = useCallback((userAnswer: string | number | string[]) => {
    if (isInputDisabled || !currentQuestion || currentQuestion.type === 'matching_pairs') return;

    setLastSubmittedAnswer(userAnswer);
    setIsInputDisabled(true);

    let isCorrect = false;
    const userAnswerStr = userAnswer.toString(); // For most cases, option ID or direct answer

    if (currentQuestion.type === 'math' || currentQuestion.type === 'counting') {
      isCorrect = parseInt(userAnswerStr) === (currentQuestion as any).answer;
    } else if (currentQuestion.type === 'comparison') {
      isCorrect = userAnswerStr === (currentQuestion as any).answer;
    } else if (currentQuestion.type === 'number_recognition') {
      const nrQ = currentQuestion as any; // NumberRecognitionQuestion
      const selectedOption = nrQ.options.find((opt: NumberRecognitionOption) => opt.id === userAnswerStr);
      isCorrect = selectedOption?.isCorrect || false;
    } else if (currentQuestion.type === 'visual_pattern') {
      const vpQ = currentQuestion as VisualPatternQuestion;
      const selectedOption = vpQ.options.find((opt: VisualPatternOption) => opt.id === userAnswerStr);
      isCorrect = selectedOption?.isCorrect || false;
    } else if (currentQuestion.type === 'number_sequence') {
        const nsQ = currentQuestion as NumberSequenceQuestion;
        const userAnswersArray = Array.isArray(userAnswer) ? userAnswer : [userAnswerStr];

        if (userAnswersArray.length === nsQ.answers.length) {
            isCorrect = userAnswersArray.every((ans, index) => parseInt(ans, 10) === nsQ.answers[index]);
        }
    } else if (currentQuestion.type === 'odd_one_out') {
        const oooQ = currentQuestion as OddOneOutQuestion;
        isCorrect = userAnswerStr === oooQ.correctAnswerId;
    }


    if (isCorrect) {
      handleCorrectAnswer();
    } else {
      handleIncorrectAnswer(currentQuestion.type === 'number_sequence' && Array.isArray(userAnswer) ? userAnswer : userAnswerStr, currentQuestion);
    }

    const isSlowMode = [
        GameMode.VISUAL_PATTERN,
        GameMode.ODD_ONE_OUT
    ].includes(currentQuestion.mode);

    const delay = isSlowMode ? SLOW_NEXT_QUESTION_DELAY_MS : NEXT_QUESTION_DELAY_MS;
    setTimeout(proceedToNextQuestionOrEnd, delay);
  }, [isInputDisabled, currentQuestion, proceedToNextQuestionOrEnd, handleCorrectAnswer, handleIncorrectAnswer]);

  const selectMatchingPairItem = useCallback((itemIdOrOutcome: string) => {
    if (!currentMatchingQuestionState || isInputDisabled) return;

    setIsInputDisabled(true);
    let currentQuestionState = currentMatchingQuestionState;
    let newItems = currentQuestionState.items.map(item =>
        item.id === itemIdOrOutcome ? { ...item, isSelected: !item.isSelected } : item
    );
    const selectedItems = newItems.filter(item => item.isSelected && !item.isMatched);

    if (selectedItems.length === 2) {
        const [first, second] = selectedItems;
        if (first.matchId === second.matchId && first.visualType !== second.visualType) {
            newItems = newItems.map(item =>
                item.matchId === first.matchId ? { ...item, isMatched: true, isSelected: false } :
                {...item, isSelected: false}
            );

            playSound('MATCHING_CONNECT');
            const updatedQuestionState = { ...currentQuestionState, items: newItems };
            setCurrentMatchingQuestionState(updatedQuestionState);

            const allMatched = newItems.every(item => item.isMatched);
            if (allMatched) {
                handleCorrectAnswer();
                setTimeout(() => proceedToNextQuestionOrEnd(), 300);
            } else {
                 setFeedbackMessage(POSITIVE_FEEDBACKS[Math.floor(Math.random() * POSITIVE_FEEDBACKS.length)]);
                 setFeedbackType('positive');
                 setTimeout(() => {
                    setFeedbackMessage(null);
                    setFeedbackType(null);
                    setIsInputDisabled(false);
                 }, NEXT_QUESTION_DELAY_MS / 2);
            }
        } else {
            playSound('WRONG_ANSWER');
            setFeedbackMessage(ENCOURAGING_FEEDBACKS[Math.floor(Math.random() * ENCOURAGING_FEEDBACKS.length)]);
            setFeedbackType('encouraging');
            setTimeout(() => {
                setCurrentMatchingQuestionState(prevState => {
                    if (!prevState) return null;
                    return {
                        ...prevState,
                        items: prevState.items.map(i =>
                            (i.id === first.id || i.id === second.id) ? { ...i, isSelected: false } : i
                        )
                    };
                });
                setFeedbackMessage(null);
                setFeedbackType(null);
                setIsInputDisabled(false);
            }, NEXT_QUESTION_DELAY_MS / 2 );
        }
    } else if (selectedItems.length === 1 || selectedItems.length === 0) {
        setCurrentMatchingQuestionState(prevState => ({ ...prevState!, items: newItems }));
        setIsInputDisabled(false);
    }
  }, [currentMatchingQuestionState, isInputDisabled, proceedToNextQuestionOrEnd, playSound, handleCorrectAnswer, handleIncorrectAnswer]);

  const confirmEndGameAndNavigate = useCallback(() => {
    setShowEndGameOverlay(false);
    onEndGame(incorrectAttempts, score, starsEarnedThisRound, numQuestionsForRound, iconsUsedThisRound);
  }, [onEndGame, incorrectAttempts, score, starsEarnedThisRound, numQuestionsForRound, iconsUsedThisRound]);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  return {
    isLoading,
    questions,
    currentQuestion,
    currentQuestionIndex,
    score,
    starsEarnedThisRound,
    incorrectAttempts,
    incorrectAttemptsCount: incorrectAttempts.length,
    feedbackMessage,
    feedbackType,
    isInputDisabled,
    lastSubmittedAnswer,
    currentMatchingQuestionState: currentQuestion?.type === 'matching_pairs' ? currentMatchingQuestionState : null,
    showEndGameOverlay,
    endGameMessageInfo,
    progressPercent,
    gameModeTitle,
    numQuestionsForRound,
    submitAnswer,
    selectMatchingPairItem,
    confirmEndGameAndNavigate,
    goToNextQuestionAfterFeedback: proceedToNextQuestionOrEnd,
  };
};

export default useGameLogic;