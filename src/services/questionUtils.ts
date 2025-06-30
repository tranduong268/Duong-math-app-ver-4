import { ShapeType } from '../../types';
import { UNLOCKABLE_IMAGE_SETS, INITIAL_COUNTING_ICONS } from '../../constants';

// UTILITY FUNCTIONS
export const generateId = (): string => Math.random().toString(36).substr(2, 9);

export const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// Helper to get a pool of icons, prioritizing fresh ones.
export const getPrioritizedIconPool = (
  baseUnlockedIcons: ShapeType[],
  globallyRecentIcons: ShapeType[]
): ShapeType[] => {
  const uniqueBase = Array.from(new Set(baseUnlockedIcons)).filter(icon => icon && icon.trim() !== '');
  const globallyRecentSet = new Set(globallyRecentIcons);

  const freshIcons = uniqueBase.filter(icon => !globallyRecentSet.has(icon));
  const staleIcons = uniqueBase.filter(icon => globallyRecentSet.has(icon));
  
  return [...freshIcons, ...staleIcons];
};


// Helper to select candidate icons based on multiple criteria
export const getCandidateIcons = (
  prioritizedPool: ShapeType[], // Already prioritized (fresh first)
  usedInCurrentGenerationCycle: Set<ShapeType>, // Icons already picked for any question in this round's generation
  usedInThisSpecificModeCycle?: Set<ShapeType>, // Icons used by this specific game mode in this round's generation (e.g. main icon for Number Rec)
  maxToReturn: number = prioritizedPool.length,
  excludeSpecificIcons: ShapeType[] = [] // Icons to explicitly exclude from this specific call
): ShapeType[] => {
    
  const exclusionSet = new Set(excludeSpecificIcons);
  let candidates = prioritizedPool.filter(icon => 
      !exclusionSet.has(icon) &&
      !usedInCurrentGenerationCycle.has(icon) && 
      (!usedInThisSpecificModeCycle || !usedInThisSpecificModeCycle.has(icon))
  );

  if (candidates.length < maxToReturn && prioritizedPool.length > 0) {
    // Fallback: try to find icons not used in this specific mode cycle, even if used in current generation by another mode
     const moreCandidates = prioritizedPool.filter(icon => 
        !exclusionSet.has(icon) &&
        !candidates.includes(icon) &&
        (!usedInThisSpecificModeCycle || !usedInThisSpecificModeCycle.has(icon))
    );
    candidates.push(...moreCandidates);
  }
  
  if (candidates.length < maxToReturn && prioritizedPool.length > 0) {
    // Fallback: any icon from the pool if absolutely necessary, still respecting exclusions
    const finalCandidates = prioritizedPool.filter(icon => !exclusionSet.has(icon) && !candidates.includes(icon));
    candidates.push(...finalCandidates);
  }

  return shuffleArray(Array.from(new Set(candidates))).slice(0, maxToReturn);
};


export const getAllBaseUnlockedIcons = (unlockedIds: string[]): ShapeType[] => {
  let allIcons = [...INITIAL_COUNTING_ICONS];
  UNLOCKABLE_IMAGE_SETS.forEach(set => {
    if (unlockedIds.includes(set.id)) {
      allIcons.push(...set.icons);
    }
  });
  return Array.from(new Set(allIcons)).filter(icon => icon && icon.trim() !== '');
};

const VIETNAMESE_NAMES: Record<string, string> = {
    // Categories
    animal: 'động vật', plant: 'thực vật', food: 'đồ ăn', drink: 'đồ uống', vehicle: 'phương tiện', clothing: 'quần áo', tool: 'dụng cụ', household: 'đồ gia dụng', nature: 'thiên nhiên', celestial: 'vũ trụ', activity: 'hoạt động', technology: 'công nghệ', toy: 'đồ chơi', instrument: 'nhạc cụ', building: 'tòa nhà', misc: 'khác', shape_color: 'hình dạng',
    // Sub-categories
    mammal: 'động vật có vú', bird: 'loài chim', reptile: 'loài bò sát', fish: 'loài cá', insect: 'côn trùng',
    fruit: 'trái cây', vegetable: 'rau củ',
    land_vehicle: 'phương tiện trên cạn', water_vehicle: 'phương tiện dưới nước', air_vehicle: 'phương tiện trên không',
    // Environments
    land: 'trên cạn', water: 'dưới nước', sky: 'trên không', underwater: 'dưới biển', space: 'vũ trụ',
    // Propulsion
    road: 'đường bộ', rail: 'đường sắt',
    // Diet
    carnivore: 'thịt', herbivore: 'cỏ', omnivore: 'tạp',
    // Tertiary
    pet: 'thú cưng', livestock: 'gia súc', wild_animal: 'động vật hoang dã', poultry: 'gia cầm',
    // Colors
    red: 'màu đỏ', orange: 'màu cam', yellow: 'màu vàng', green: 'màu xanh lá', blue: 'màu xanh biển', purple: 'màu tím', pink: 'màu hồng', brown: 'màu nâu', black: 'màu đen', white: 'màu trắng', gray: 'màu xám', multi_color: 'nhiều màu'
};

export const getVietnameseName = (key: string | undefined): string => {
    if (!key) return 'khác';
    return VIETNAMESE_NAMES[key] || key;
};
