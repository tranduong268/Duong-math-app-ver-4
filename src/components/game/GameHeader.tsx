
import React from 'react';
// import { NUM_QUESTIONS_PER_ROUND } from '../../../constants'; // No longer needed directly
import { DifficultyLevel } from '../../../types'; 

interface GameHeaderProps {
  onBackToMenu: () => void;
  currentQuestionIndex: number;
  score: number;
  incorrectAttemptsCount: number;
  gameModeTitle: string;
  difficulty: DifficultyLevel;
  numQuestionsTotal: number; // New prop for total questions in this round
}

const GameHeader: React.FC<GameHeaderProps> = ({
  onBackToMenu,
  currentQuestionIndex,
  score,
  incorrectAttemptsCount,
  gameModeTitle,
  difficulty,
  numQuestionsTotal 
}) => {
  return (
    <div className="mb-3 px-1">
      {/* Row 1: Game Mode, Difficulty (left) and Menu button (right) */}
      <div className="flex justify-between items-center mb-2">
        <div className="text-left flex-1 min-w-0 mr-2"> 
          <h2 className="text-lg sm:text-xl font-bold text-purple-700 leading-tight tracking-wide whitespace-nowrap">{gameModeTitle}</h2>
          <p className="text-sm sm:text-base text-gray-600 leading-tight">{difficulty}</p>
        </div>
        <button
          onClick={onBackToMenu}
          className="bg-white hover:bg-red-100 text-red-500 font-semibold py-1.5 px-2.5 rounded-md shadow-md transition-colors flex items-center shrink-0"
          aria-label="Về Menu Chính"
        >
          <span aria-hidden="true" className="mr-1 text-lg">&larr;</span>
          <span className="text-sm">Menu</span>
        </button>
      </div>

      {/* Row 2: Question Count (left), Score & Errors (right) */}
      <div className="flex justify-between items-center text-base sm:text-lg font-semibold text-gray-800"> 
        {/* Left Aligned Item - Question Count */}
        <div className="text-black whitespace-nowrap">
          <span>🎯Câu: <strong className="text-blue-600 font-bold">{currentQuestionIndex + 1}</strong>/{numQuestionsTotal}</span>
        </div>

        {/* Right Aligned Group: Score, Errors */}
        <div className="flex items-center gap-x-3 sm:gap-x-4"> 
          <span className="text-black whitespace-nowrap">✅Đúng: <strong className="text-green-600 font-bold">{score}</strong></span>
          <span className="text-black whitespace-nowrap">❌Sai: <strong className="text-red-600 font-bold">{incorrectAttemptsCount}</strong></span>
        </div>
      </div>
    </div>
  );
};

export default GameHeader;