
import React from 'react';
import { GameMode, IncorrectAttempt, DifficultyLevel } from '../../types';
import useGameLogic from '../hooks/useGameLogic';
import QuestionDisplay from '../../components/QuestionDisplay'; // Corrected/Verified path
import FeedbackDisplay from '../../components/FeedbackDisplay'; // Corrected/Verified path
import ProgressBar from './ProgressBar';
import GameHeader from './game/GameHeader';
import EndGameOverlay from './game/EndGameOverlay';

interface GameScreenProps {
  mode: GameMode;
  difficulty: DifficultyLevel;
  onEndGame: (
    incorrectAttempts: IncorrectAttempt[],
    score: number,
    starsEarnedThisRound: number,
    numQuestionsInRound: number,
    iconsUsedInRound: string[] // Added for icon tracking
  ) => void;
  onBackToMenu: () => void;
  unlockedSetIds: string[];
  recentlyUsedIcons: string[]; // New prop for icon diversity
}

const GameScreen: React.FC<GameScreenProps> = ({ mode, difficulty, onEndGame, onBackToMenu, unlockedSetIds, recentlyUsedIcons }) => {
  const {
    isLoading,
    currentQuestion,
    currentQuestionIndex,
    score,
    starsEarnedThisRound,
    incorrectAttemptsCount,
    feedbackMessage,
    feedbackType,
    isInputDisabled,
    lastSubmittedAnswer,
    currentMatchingQuestionState,
    showEndGameOverlay,
    endGameMessageInfo,
    progressPercent,
    gameModeTitle,
    numQuestionsForRound,
    submitAnswer,
    selectMatchingPairItem,
    confirmEndGameAndNavigate,
  } = useGameLogic({ mode, difficulty, unlockedSetIds, recentlyUsedIcons, onEndGame });

  if (isLoading || !currentQuestion) {
    return (
      <div className="text-center p-8 flex flex-col items-center justify-center min-h-[300px]">
        <p className="text-xl text-gray-700 mb-4">Đang chuẩn bị câu hỏi cho bé...</p>
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-pink-500"></div>
        <button
          onClick={onBackToMenu}
          className="mt-8 bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
          aria-label="Về Menu Chính"
        >
          Về Menu Chính
        </button>
      </div>
    );
  }

  const questionForDisplay =
    currentQuestion.type === 'matching_pairs' && currentMatchingQuestionState
    ? currentMatchingQuestionState
    : currentQuestion;

  if (showEndGameOverlay && endGameMessageInfo) {
    return (
      <EndGameOverlay
        endGameMessageInfo={endGameMessageInfo}
        score={score}
        starsEarnedThisRound={starsEarnedThisRound}
        totalQuestionsInRound={numQuestionsForRound}
        onConfirmEndGame={confirmEndGameAndNavigate}
      />
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-3 sm:p-4 md:p-6 rounded-2xl shadow-xl">
      <GameHeader
        onBackToMenu={onBackToMenu}
        currentQuestionIndex={currentQuestionIndex}
        score={score}
        incorrectAttemptsCount={incorrectAttemptsCount}
        gameModeTitle={gameModeTitle}
        difficulty={difficulty}
        numQuestionsTotal={numQuestionsForRound}
      />

      <ProgressBar current={progressPercent} total={100} />

      <QuestionDisplay
        question={questionForDisplay}
        onAnswer={currentQuestion.type === 'matching_pairs' ? selectMatchingPairItem : submitAnswer}
        disabled={isInputDisabled}
        lastAnswer={lastSubmittedAnswer}
      />

      {feedbackMessage && feedbackType && (
        <FeedbackDisplay message={feedbackMessage} type={feedbackType} />
      )}
    </div>
  );
};
export default GameScreen;
