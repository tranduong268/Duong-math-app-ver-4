import React, { useState, useEffect, useCallback } from 'react';
import { GameMode, DifficultyLevel } from '../types';
import { useAudio } from '../src/contexts/AudioContext';
import { MENU_EMOJIS_RANDOM, COMPARISON_ICON, COUNTING_ICON, REVIEW_ICON, NUMBER_RECOGNITION_ICON, MATCHING_PAIRS_ICON, NUMBER_SEQUENCE_ICONS, VISUAL_PATTERN_ICON } from '../constants';

interface MainMenuProps {
  onStartGame: (mode: GameMode) => void;
  onShowReview: () => void;
  totalStars: number;
  onRequestResetProgress: () => void;
  currentDifficulty: DifficultyLevel;
  onSetDifficulty: (level: DifficultyLevel) => void;
}

const getRandomEmoji = () => MENU_EMOJIS_RANDOM[Math.floor(Math.random() * MENU_EMOJIS_RANDOM.length)];
const getRandomNumberSequenceIcon = () => NUMBER_SEQUENCE_ICONS[Math.floor(Math.random() * NUMBER_SEQUENCE_ICONS.length)];

interface MenuItem {
  mode: GameMode | 'REVIEW' | 'RESET' | 'DIFFICULTY_MAM' | 'DIFFICULTY_CHOI';
  text: string;
  emoji?: string; 
  bgColorClass: string;
  colSpanClass?: string;
  onClick?: () => void; 
  isActive?: boolean; 
}

const MenuButton: React.FC<{ item: MenuItem; onClick?: () => void }> = ({ item, onClick }) => {
  const { playSound } = useAudio();
  const handleClick = () => {
    playSound('BUTTON_CLICK');
    if (onClick) {
      onClick();
    }
  };
  return (
    <button
      onClick={handleClick}
      className={`w-full text-gray-800 font-semibold py-3 px-4 md:py-4 md:px-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-150 ease-in-out flex items-center justify-center text-base md:text-lg ${item.bgColorClass} ${item.isActive ? 'ring-4 ring-pink-500 brightness-110' : 'hover:brightness-110'} ${item.colSpanClass ?? ''}`}
      aria-pressed={item.isActive}
    >
      {item.emoji && <span className="mr-2 text-xl md:text-2xl flex-shrink-0">{item.emoji}</span>}
      <span className="text-center">{item.text}</span>
    </button>
  );
};

const MainMenu: React.FC<MainMenuProps> = ({ onStartGame, onShowReview, totalStars, onRequestResetProgress, currentDifficulty, onSetDifficulty }) => {
  const { playSound } = useAudio();
  const [gameModeItems, setGameModeItems] = useState<MenuItem[]>([]);

  const handleStartGameWithSound = useCallback((mode: GameMode) => {
    playSound('DECISION');
    onStartGame(mode);
  }, [onStartGame, playSound]);

  const handleShowReviewWithSound = useCallback(() => {
    playSound('DECISION');
    onShowReview();
  }, [onShowReview, playSound]);


  useEffect(() => {
    const items: MenuItem[] = [
      { mode: GameMode.ADDITION, text: GameMode.ADDITION, emoji: getRandomEmoji(), bgColorClass: 'bg-yellow-400', onClick: () => handleStartGameWithSound(GameMode.ADDITION) },
      { mode: GameMode.SUBTRACTION, text: GameMode.SUBTRACTION, emoji: getRandomEmoji(), bgColorClass: 'bg-green-400', onClick: () => handleStartGameWithSound(GameMode.SUBTRACTION) },
      { mode: GameMode.COMPARISON, text: GameMode.COMPARISON, emoji: COMPARISON_ICON, bgColorClass: 'bg-blue-400', onClick: () => handleStartGameWithSound(GameMode.COMPARISON) },
      { mode: GameMode.COUNTING, text: GameMode.COUNTING, emoji: COUNTING_ICON, bgColorClass: 'bg-purple-400', onClick: () => handleStartGameWithSound(GameMode.COUNTING) },
      { mode: GameMode.NUMBER_RECOGNITION, text: "Nhận Biết Số", emoji: NUMBER_RECOGNITION_ICON, bgColorClass: 'bg-teal-400', onClick: () => handleStartGameWithSound(GameMode.NUMBER_RECOGNITION) },
      { mode: GameMode.MATCHING_PAIRS, text: "Tìm Cặp Ghép", emoji: MATCHING_PAIRS_ICON, bgColorClass: 'bg-orange-400', onClick: () => handleStartGameWithSound(GameMode.MATCHING_PAIRS) },
      { mode: GameMode.NUMBER_SEQUENCE, text: GameMode.NUMBER_SEQUENCE, emoji: getRandomNumberSequenceIcon(), bgColorClass: 'bg-pink-400', onClick: () => handleStartGameWithSound(GameMode.NUMBER_SEQUENCE) },
      { mode: GameMode.VISUAL_PATTERN, text: GameMode.VISUAL_PATTERN, emoji: VISUAL_PATTERN_ICON, bgColorClass: 'bg-cyan-400', onClick: () => handleStartGameWithSound(GameMode.VISUAL_PATTERN) },
      { mode: GameMode.ODD_ONE_OUT, text: GameMode.ODD_ONE_OUT, emoji: '🔍', bgColorClass: 'bg-indigo-400', onClick: () => handleStartGameWithSound(GameMode.ODD_ONE_OUT) },
      { mode: 'REVIEW', text: "Xem Lại Lỗi Sai", emoji: REVIEW_ICON, bgColorClass: 'bg-red-400', colSpanClass: 'sm:col-span-2', onClick: handleShowReviewWithSound },
    ];
    setGameModeItems(items);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleStartGameWithSound, handleShowReviewWithSound]); 
  
  return (
    <div className="bg-white/80 backdrop-blur-md p-4 md:p-6 rounded-xl shadow-xl max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl md:text-2xl font-semibold text-pink-600">Chọn Chế Độ Chơi</h2>
        <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full shadow-md">
          <span className="text-xl md:text-2xl mr-1">🌟</span>
          <span className="font-bold text-base md:text-lg">{totalStars}</span>
        </div>
      </div>

      <div className="mb-6 p-3 bg-sky-100 rounded-lg shadow">
        <h3 className="text-sm md:text-base font-semibold text-sky-700 mb-2 text-center">Chọn Cấp Độ (Tiền Tiểu Học):</h3>
        <div className="grid grid-cols-2 gap-3">
          <MenuButton
            item={{
              mode: 'DIFFICULTY_MAM',
              text: DifficultyLevel.PRE_SCHOOL_MAM,
              bgColorClass: 'bg-lime-300 hover:bg-lime-400',
              isActive: currentDifficulty === DifficultyLevel.PRE_SCHOOL_MAM
            }}
            onClick={() => onSetDifficulty(DifficultyLevel.PRE_SCHOOL_MAM)}
          />
          <MenuButton
            item={{
              mode: 'DIFFICULTY_CHOI',
              text: DifficultyLevel.PRE_SCHOOL_CHOI,
              bgColorClass: 'bg-emerald-300 hover:bg-emerald-400',
              isActive: currentDifficulty === DifficultyLevel.PRE_SCHOOL_CHOI
            }}
            onClick={() => onSetDifficulty(DifficultyLevel.PRE_SCHOOL_CHOI)}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        {gameModeItems.map((item) => (
          <MenuButton
            key={item.mode}
            item={item}
            onClick={item.onClick}
          />
        ))}
      </div>
      <div className="mt-6 pt-4 border-t border-gray-200">
        <MenuButton
          item={{
            mode: 'RESET',
            text: "Chơi Mới Từ Đầu",
            emoji: "🔄",
            bgColorClass: 'bg-slate-300 hover:bg-slate-400 text-slate-700',
            colSpanClass: 'sm:col-span-2'
          }}
          onClick={onRequestResetProgress}
        />
      </div>
    </div>
  );
};

export default MainMenu;