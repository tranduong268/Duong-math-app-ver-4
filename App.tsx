
import React, { useState, useEffect, useCallback } from 'react';
import { GameMode, StoredSession, IncorrectAttempt, ImageSet, DifficultyLevel, Question } from './types'; // Added Question
import { useAudio } from './src/contexts/AudioContext';
import { UNLOCKABLE_IMAGE_SETS, CURRENT_DIFFICULTY_KEY } from './constants';
import Header from './components/Header';
import MainMenu from './components/MainMenu';
import GameScreen from './src/components/GameScreen'; // Updated path
import { ReviewScreen } from './components/ReviewScreen';
import UnlockNotificationModal from './components/UnlockNotificationModal';
import ResetConfirmationModal from './components/ResetConfirmationModal';
import {
  saveIncorrectSessionToStorage,
  getIncorrectSessionsFromStorage,
  getTotalStars,
  saveTotalStars,
  getUnlockedSetIds,
  saveUnlockedSetIds,
  getRecentlyUsedIcons,
  saveRecentlyUsedIcons
} from './services/localStorageService';
import { audioService } from './src/services/audioService'; // Import the service singleton

type Screen = 'MENU' | 'GAME' | 'REVIEW';

const App: React.FC = () => {
  const { playMusic, stopMusic, isMuted, toggleMute } = useAudio();
  const [currentScreen, setCurrentScreen] = useState<Screen>('MENU');
  const [currentGameMode, setCurrentGameMode] = useState<GameMode | null>(null);
  const [reviewSessions, setReviewSessions] = useState<StoredSession[]>([]);

  const [totalStars, setTotalStarsState] = useState<number>(0);
  const [unlockedSetIds, setUnlockedSetIdsState] = useState<string[]>([]);
  const [showUnlockNotification, setShowUnlockNotification] = useState<ImageSet | null>(null);
  const [showResetConfirmation, setShowResetConfirmation] = useState<boolean>(false);
  const [recentlyUsedIconsList, setRecentlyUsedIconsList] = useState<string[]>([]);

  const [currentDifficultyLevel, setCurrentDifficultyLevel] = useState<DifficultyLevel>(() => {
    const savedDifficulty = localStorage.getItem(CURRENT_DIFFICULTY_KEY) as DifficultyLevel;
    return savedDifficulty || DifficultyLevel.PRE_SCHOOL_MAM; // Default to Mầm
  });

  useEffect(() => {
    document.body.className = 'font-[\'Quicksand\'] bg-sky-100 min-h-screen flex flex-col items-center text-gray-800';
    setTotalStarsState(getTotalStars());
    setUnlockedSetIdsState(getUnlockedSetIds());
    setRecentlyUsedIconsList(getRecentlyUsedIcons());

    // Add a one-time event listener to unlock the browser's audio context.
    // This is necessary because most modern browsers block audio until a user
    // interacts with the page.
    const handleFirstInteraction = () => {
      audioService.userHasInteracted();
      // Once the interaction has happened, we don't need these listeners anymore.
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);

    return () => {
      // Cleanup listeners if the component unmounts before interaction.
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []); // Empty dependency array ensures this runs only once on mount.

  useEffect(() => {
    if (currentScreen === 'MENU') {
      playMusic('BACKGROUND_MUSIC');
    } else {
      stopMusic();
    }
  }, [currentScreen, playMusic, stopMusic]);

  const handleSetDifficulty = useCallback((level: DifficultyLevel) => {
    setCurrentDifficultyLevel(level);
    localStorage.setItem(CURRENT_DIFFICULTY_KEY, level);
  }, []);

  const handleStartGame = useCallback((mode: GameMode) => {
    setCurrentGameMode(mode);
    setCurrentScreen('GAME');
  }, []);

  const handleEndGame = useCallback((
    incorrectAttempts: IncorrectAttempt[],
    score: number,
    starsEarnedThisRound: number,
    numQuestionsInThatRound: number,
    iconsUsedInThatRound: string[] // New parameter
  ) => {
    const actualTotalQuestions = numQuestionsInThatRound;

    if (incorrectAttempts.length > 0 || score < actualTotalQuestions) {
      const newSession: StoredSession = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        incorrectAttempts,
        score,
        totalQuestions: actualTotalQuestions,
        difficulty: currentDifficultyLevel,
      };
      saveIncorrectSessionToStorage(newSession);
    }

    const newTotalStars = totalStars + starsEarnedThisRound;
    setTotalStarsState(newTotalStars);
    saveTotalStars(newTotalStars);

    // Update recently used icons
    const updatedRecentIcons = saveRecentlyUsedIcons(iconsUsedInThatRound, recentlyUsedIconsList);
    setRecentlyUsedIconsList(updatedRecentIcons);


    let newlyUnlockedSet: ImageSet | null = null;
    const currentUnlockedIds = [...unlockedSetIds];

    UNLOCKABLE_IMAGE_SETS.forEach(set => {
      if (newTotalStars >= set.starsRequired && !currentUnlockedIds.includes(set.id)) {
        currentUnlockedIds.push(set.id);
        newlyUnlockedSet = set;
      }
    });

    if (newlyUnlockedSet) {
        setUnlockedSetIdsState(currentUnlockedIds);
        saveUnlockedSetIds(currentUnlockedIds);
        setTimeout(() => setShowUnlockNotification(newlyUnlockedSet), 300);
    }

    setCurrentScreen('MENU');
  }, [totalStars, unlockedSetIds, currentDifficultyLevel, recentlyUsedIconsList]);

  const handleShowReview = useCallback(() => {
    setReviewSessions(getIncorrectSessionsFromStorage());
    setCurrentScreen('REVIEW');
  }, []);

  const handleBackToMenu = useCallback(() => {
    setCurrentScreen('MENU');
  }, []);

  const handleCloseUnlockNotification = useCallback(() => {
    setShowUnlockNotification(null);
  }, []);

  const handleRequestResetProgress = useCallback(() => {
    setShowResetConfirmation(true);
  }, []);

  const handleConfirmResetProgress = useCallback(() => {
    setTotalStarsState(0);
    saveTotalStars(0);
    setUnlockedSetIdsState([]);
    saveUnlockedSetIds([]);
    try {
      localStorage.removeItem('toanHocThongMinh_incorrectSessions');
      localStorage.removeItem('toanHocThongMinh_recentlyUsedIcons'); // Clear recent icons too
      localStorage.removeItem('toanHocThongMinh_isMuted'); // Clear mute state
      setRecentlyUsedIconsList([]); // Reset state
    } catch (error) {
      console.error("Error clearing data from localStorage:", error);
    }
    setShowResetConfirmation(false);
  }, []);

  const handleCancelResetProgress = useCallback(() => {
    setShowResetConfirmation(false);
  }, []);


  return (
    <div className="w-full max-w-4xl p-4 relative">
      <button
        onClick={toggleMute}
        className="absolute top-2 right-2 z-50 bg-white/50 backdrop-blur-sm text-2xl md:text-3xl p-2 rounded-full shadow-md hover:bg-white transition-colors"
        aria-label={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
      >
        {isMuted ? '🔇' : '🔊'}
      </button>

      {currentScreen === 'MENU' && <Header />}
      <main className={`${currentScreen === 'MENU' ? 'mt-6' : 'mt-2 md:mt-4'} w-full`}>
        {currentScreen === 'MENU' && (
          <MainMenu
            onStartGame={handleStartGame}
            onShowReview={handleShowReview}
            totalStars={totalStars}
            onRequestResetProgress={handleRequestResetProgress}
            currentDifficulty={currentDifficultyLevel}
            onSetDifficulty={handleSetDifficulty}
          />
        )}
        {currentScreen === 'GAME' && currentGameMode && (
          <GameScreen
            mode={currentGameMode}
            difficulty={currentDifficultyLevel}
            onEndGame={handleEndGame} 
            onBackToMenu={handleBackToMenu}
            unlockedSetIds={unlockedSetIds}
            recentlyUsedIcons={recentlyUsedIconsList} // Pass down
          />
        )}
        {currentScreen === 'REVIEW' && (
          <ReviewScreen sessions={reviewSessions} onBackToMenu={handleBackToMenu} />
        )}
      </main>
      {showUnlockNotification && (
        <UnlockNotificationModal
          unlockedSet={showUnlockNotification}
          onClose={handleCloseUnlockNotification}
        />
      )}
      {showResetConfirmation && (
        <ResetConfirmationModal
          onConfirm={handleConfirmResetProgress}
          onCancel={handleCancelResetProgress}
        />
      )}
      <footer className="text-center text-sm text-gray-500 mt-8 py-4 border-t border-gray-300">
        Toán Học Thông Minh - Phát triển bởi AI cho bé yêu học giỏi!
      </footer>
    </div>
  );
};

export default App;
