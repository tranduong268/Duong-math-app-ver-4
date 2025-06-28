
import { StoredSession } from '../types';
import { MAX_SESSIONS_TO_STORE, TOTAL_STARS_STORAGE_KEY, UNLOCKED_SETS_STORAGE_KEY } from '../constants';

const INCORRECT_SESSIONS_STORAGE_KEY = 'toanHocThongMinh_incorrectSessions';
const RECENTLY_USED_ICONS_KEY = 'toanHocThongMinh_recentlyUsedIcons';
const MAX_RECENT_ICONS_TO_STORE = 300; // Store up to 300 most recently used unique icons

export const saveIncorrectSessionToStorage = (newSession: StoredSession): void => {
  let sessions = getIncorrectSessionsFromStorage();
  sessions.unshift(newSession);
  sessions = sessions.slice(0, MAX_SESSIONS_TO_STORE);
  try {
    localStorage.setItem(INCORRECT_SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error("Error saving incorrect sessions to localStorage:", error);
  }
};

export const getIncorrectSessionsFromStorage = (): StoredSession[] => {
  try {
    const storedData = localStorage.getItem(INCORRECT_SESSIONS_STORAGE_KEY);
    if (storedData) {
      const parsedData = JSON.parse(storedData) as StoredSession[];
      return parsedData.sort((a, b) => b.timestamp - a.timestamp);
    }
  } catch (error) {
    console.error("Error reading incorrect sessions from localStorage:", error);
  }
  return [];
};

// Functions for total stars
export const getTotalStars = (): number => {
  try {
    const storedStars = localStorage.getItem(TOTAL_STARS_STORAGE_KEY);
    return storedStars ? parseInt(storedStars, 10) : 0;
  } catch (error) {
    console.error("Error reading total stars from localStorage:", error);
    return 0;
  }
};

export const saveTotalStars = (stars: number): void => {
  try {
    localStorage.setItem(TOTAL_STARS_STORAGE_KEY, stars.toString());
  } catch (error) {
    console.error("Error saving total stars to localStorage:", error);
  }
};

// Functions for unlocked image sets
export const getUnlockedSetIds = (): string[] => {
  try {
    const storedSetIds = localStorage.getItem(UNLOCKED_SETS_STORAGE_KEY);
    return storedSetIds ? JSON.parse(storedSetIds) : [];
  } catch (error) {
    console.error("Error reading unlocked set IDs from localStorage:", error);
    return [];
  }
};

export const saveUnlockedSetIds = (setIds: string[]): void => {
  try {
    localStorage.setItem(UNLOCKED_SETS_STORAGE_KEY, JSON.stringify(setIds));
  } catch (error) {
    console.error("Error saving unlocked set IDs to localStorage:", error);
  }
};

// Functions for recently used icons
export const getRecentlyUsedIcons = (): string[] => {
  try {
    const storedIcons = localStorage.getItem(RECENTLY_USED_ICONS_KEY);
    return storedIcons ? JSON.parse(storedIcons) : [];
  } catch (error) {
    console.error("Error reading recently used icons from localStorage:", error);
    return [];
  }
};

export const saveRecentlyUsedIcons = (
  newlyUsedInRound: string[],
  currentRecentIcons: string[]
): string[] => {
  try {
    // Add new icons to the front, then current ones, ensuring uniqueness and order
    const combined = [...new Set([...newlyUsedInRound, ...currentRecentIcons])];
    const updatedRecentIcons = combined.slice(0, MAX_RECENT_ICONS_TO_STORE);
    localStorage.setItem(RECENTLY_USED_ICONS_KEY, JSON.stringify(updatedRecentIcons));
    return updatedRecentIcons;
  } catch (error) {
    console.error("Error saving recently used icons to localStorage:", error);
    return currentRecentIcons; // Return old list on error
  }
};
