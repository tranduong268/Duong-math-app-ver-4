
import React from 'react';
import { EndGameMessageInfo } from '../../../types';
// import { NUM_QUESTIONS_PER_ROUND } from '../../../constants'; // No longer needed directly

interface EndGameOverlayProps {
  endGameMessageInfo: EndGameMessageInfo;
  score: number;
  starsEarnedThisRound: number;
  totalQuestionsInRound: number; // New prop
  onConfirmEndGame: () => void;
}

const EndGameOverlay: React.FC<EndGameOverlayProps> = ({
  endGameMessageInfo,
  score,
  starsEarnedThisRound,
  totalQuestionsInRound,
  onConfirmEndGame,
}) => {
  return (
    <div className="fixed inset-0 bg-sky-100/90 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-4 animate-pop-scale">
      <div className="bg-white p-6 md:p-10 rounded-xl shadow-2xl text-center max-w-lg w-full">
        <div className="text-6xl md:text-8xl mb-4" role="img" aria-label="Feedback Emojis">
          {endGameMessageInfo.icons.join(' ')}
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-pink-600 mb-6">
          {endGameMessageInfo.text}
        </h2>
        <p className="text-xl md:text-2xl text-gray-700 mb-2">
          Bé đạt được: <strong className="text-yellow-500">{score}</strong> / {totalQuestionsInRound} câu đúng
        </p>
        <p className="text-xl md:text-2xl text-yellow-600 mb-6">
          ✨ +{starsEarnedThisRound} sao ✨
        </p>
        <button
          onClick={onConfirmEndGame}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-transform transform hover:scale-105 text-lg w-full"
        >
          Chơi Tiếp Nào!
        </button>
      </div>
    </div>
  );
};

export default EndGameOverlay;