import { GameMode, DifficultyLevel, MathQuestion, ComparisonQuestion, CountingQuestion, NumberRecognitionQuestion, MatchingPairsQuestion, Question, ShapeType, NumberRecognitionOption, MatchableItem, NumberSequenceQuestion, VisualPatternQuestion, VisualPatternRuleType, VisualPatternOption, OddOneOutQuestion, OddOneOutOption, MathQuestionUnknownSlot, PatternDisplayStep, VisualContent } from '../../types';
import { INITIAL_COUNTING_ICONS, UNLOCKABLE_IMAGE_SETS, NUM_QUESTIONS_PER_ROUND, MIN_EQUALS_IN_COMPARISON_ROUND, VISUAL_PATTERN_QUESTIONS_MAM, VISUAL_PATTERN_QUESTIONS_CHOI, ODD_ONE_OUT_QUESTIONS_MAM, ODD_ONE_OUT_QUESTIONS_CHOI } from '../../constants';

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
const getPrioritizedIconPool = (
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
const getCandidateIcons = (
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


const getMathSignature = (op1: number, op2: number, oper: '+' | '-', res: number, slot: MathQuestionUnknownSlot): string => {
  return `math-${oper}-${op1}-${op2}-${res}-${slot}`;
};

// QUESTION GENERATION FUNCTIONS
export const generateAdditionQuestion = (difficulty: DifficultyLevel, existingSignatures: Set<string>): MathQuestion => {
  let qData: { operand1True: number, operand2True: number, resultTrue: number, unknownSlot: MathQuestionUnknownSlot, answer: number };
  let signature: string;

  do {
    const unknownSlotOptions: MathQuestionUnknownSlot[] = ['result', 'operand1', 'operand2'];
    // Weight towards 'result' (direct sum) more for Mầm, more balanced for Chồi
    const slotProb = Math.random();
    let chosenSlot: MathQuestionUnknownSlot;

    if (difficulty === DifficultyLevel.PRE_SCHOOL_MAM) {
        if (slotProb < 0.6) chosenSlot = 'result'; // A + B = ? (60%)
        else if (slotProb < 0.8) chosenSlot = 'operand2'; // A + ? = C (20%)
        else chosenSlot = 'operand1'; // ? + B = C (20%)
    } else { // PRE_SCHOOL_CHOI
        if (slotProb < 0.4) chosenSlot = 'result'; // A + B = ? (40%)
        else if (slotProb < 0.7) chosenSlot = 'operand2'; // A + ? = C (30%)
        else chosenSlot = 'operand1'; // ? + B = C (30%)
    }
    
    let o1t: number, o2t: number, resT: number, ans: number;

    if (chosenSlot === 'result') { // A + B = ?
      if (difficulty === DifficultyLevel.PRE_SCHOOL_MAM) {
        resT = Math.floor(Math.random() * 9) + 2; // Result 2-10
        o1t = Math.floor(Math.random() * (resT - 1)) + 1; // Operand1 1 to Result-1
        o2t = resT - o1t;
      } else { // PRE_SCHOOL_CHOI
        const coinFlip = Math.random();
        if (coinFlip < 0.4) { // Result 2-10
            resT = Math.floor(Math.random() * 9) + 2; 
        } else { // Result 11-20
            resT = Math.floor(Math.random() * 10) + 11;
        }
        o1t = Math.floor(Math.random() * (resT - 1)) + 1;
        o2t = resT - o1t;
      }
      ans = resT;
    } else if (chosenSlot === 'operand2') { // A + ? = C
      if (difficulty === DifficultyLevel.PRE_SCHOOL_MAM) {
        resT = Math.floor(Math.random() * 9) + 2; // C is 2-10
        o1t = Math.floor(Math.random() * (resT - 1)) + 1; // A is 1 to C-1
        o2t = resT - o1t; // ? is C-A
      } else { // PRE_SCHOOL_CHOI
        const coinFlip = Math.random();
        if (coinFlip < 0.3) { // C is 2-10
             resT = Math.floor(Math.random() * 9) + 2;
        } else { // C is 11-20
             resT = Math.floor(Math.random() * 10) + 11;
        }
        o1t = Math.floor(Math.random() * (resT - 1)) + 1;
        o2t = resT - o1t;
      }
      ans = o2t;
    } else { // operand1: ? + B = C
      if (difficulty === DifficultyLevel.PRE_SCHOOL_MAM) {
        resT = Math.floor(Math.random() * 9) + 2; // C is 2-10
        o2t = Math.floor(Math.random() * (resT - 1)) + 1; // B is 1 to C-1
        o1t = resT - o2t; // ? is C-B
      } else { // PRE_SCHOOL_CHOI
         const coinFlip = Math.random();
        if (coinFlip < 0.3) { // C is 2-10
             resT = Math.floor(Math.random() * 9) + 2;
        } else { // C is 11-20
             resT = Math.floor(Math.random() * 10) + 11;
        }
        o2t = Math.floor(Math.random() * (resT - 1)) + 1;
        o1t = resT - o2t;
      }
      ans = o1t;
    }
    qData = { operand1True: o1t, operand2True: o2t, resultTrue: resT, unknownSlot: chosenSlot, answer: ans };
    signature = getMathSignature(qData.operand1True, qData.operand2True, '+', qData.resultTrue, qData.unknownSlot);
  } while (existingSignatures.has(signature));
  
  existingSignatures.add(signature);
  return { 
    id: generateId(), 
    type: 'math', 
    mode: GameMode.ADDITION, 
    difficulty: difficulty, 
    operator: '+',
    ...qData 
  };
};

export const generateSubtractionQuestion = (difficulty: DifficultyLevel, existingSignatures: Set<string>): MathQuestion => {
  let qData: { operand1True: number, operand2True: number, resultTrue: number, unknownSlot: MathQuestionUnknownSlot, answer: number };
  let signature: string;

  do {
    const unknownSlotOptions: MathQuestionUnknownSlot[] = ['result', 'operand1', 'operand2'];
    const slotProb = Math.random();
    let chosenSlot: MathQuestionUnknownSlot;

    if (difficulty === DifficultyLevel.PRE_SCHOOL_MAM) {
        if (slotProb < 0.6) chosenSlot = 'result';        // A - B = ? (60%)
        else if (slotProb < 0.8) chosenSlot = 'operand2'; // A - ? = C (20%)
        else chosenSlot = 'operand1';                   // ? - B = C (20%)
    } else { // PRE_SCHOOL_CHOI
        if (slotProb < 0.4) chosenSlot = 'result';        // A - B = ? (40%)
        else if (slotProb < 0.7) chosenSlot = 'operand2'; // A - ? = C (30%)
        else chosenSlot = 'operand1';                   // ? - B = C (30%)
    }

    let o1t: number, o2t: number, resT: number, ans: number;

    if (chosenSlot === 'result') { // A - B = ?
      if (difficulty === DifficultyLevel.PRE_SCHOOL_MAM) {
        o1t = Math.floor(Math.random() * 10) + 1; // A is 1-10
        o2t = Math.floor(Math.random() * (o1t + 1)); // B is 0 to A
      } else { // PRE_SCHOOL_CHOI
        const coinFlip = Math.random();
        if (coinFlip < 0.4) { // A is 1-10
            o1t = Math.floor(Math.random() * 10) + 1;
        } else { // A is 11-20
            o1t = Math.floor(Math.random() * 10) + 11;
        }
        o2t = Math.floor(Math.random() * (o1t + 1));
      }
      resT = o1t - o2t;
      ans = resT;
    } else if (chosenSlot === 'operand2') { // A - ? = C
      if (difficulty === DifficultyLevel.PRE_SCHOOL_MAM) {
        o1t = Math.floor(Math.random() * 9) + 2; // A is 2-10 (to ensure A-1 is possible for C)
        resT = Math.floor(Math.random() * o1t); // C is 0 to A-1
        o2t = o1t - resT; // ? is A-C (will be >=1 if C < A)
      } else { // PRE_SCHOOL_CHOI
        const coinFlip = Math.random();
         if (coinFlip < 0.3) { // A is 2-10
            o1t = Math.floor(Math.random() * 9) + 2;
        } else { // A is 11-20
            o1t = Math.floor(Math.random() * 10) + 11;
        }
        resT = Math.floor(Math.random() * o1t);
        o2t = o1t - resT;
      }
      ans = o2t;
    } else { // operand1: ? - B = C
      if (difficulty === DifficultyLevel.PRE_SCHOOL_MAM) {
        o2t = Math.floor(Math.random() * 5) + 1;  // B is 1-5
        resT = Math.floor(Math.random() * (10 - o2t + 1)); // C is 0 to (10-B) to ensure ? <= 10
        o1t = o2t + resT; // ? is B+C
      } else { // PRE_SCHOOL_CHOI
        o2t = Math.floor(Math.random() * 10) + 1; // B is 1-10
        resT = Math.floor(Math.random() * (20 - o2t + 1)); // C is 0 to (20-B) to ensure ? <= 20
        o1t = o2t + resT;
      }
      ans = o1t;
    }
    qData = { operand1True: o1t, operand2True: o2t, resultTrue: resT, unknownSlot: chosenSlot, answer: ans };
    signature = getMathSignature(qData.operand1True, qData.operand2True, '-', qData.resultTrue, qData.unknownSlot);
  } while (existingSignatures.has(signature));
  
  existingSignatures.add(signature);
  return { 
    id: generateId(), 
    type: 'math', 
    mode: GameMode.SUBTRACTION, 
    difficulty: difficulty, 
    operator: '-',
    ...qData 
  };
};


const _generateSpecificComparisonQuestion = (
    difficultyLevel: DifficultyLevel, 
    existingSignatures: Set<string>, 
    min1: number, max1: number, 
    min2: number, max2: number, 
    forceEquals: boolean
): ComparisonQuestion | null => {
    let num1_comp: number;
    let num2_comp: number;
    let answer_comp: '<' | '>' | '=';
    let q: ComparisonQuestion;
    let attempts = 0;
    const MAX_ATTEMPTS = 50;

    do {
        attempts++;
        if (attempts > MAX_ATTEMPTS) return null;

        num1_comp = Math.floor(Math.random() * (max1 - min1 + 1)) + min1;
        if (forceEquals) {
            num2_comp = num1_comp;
        } else {
            num2_comp = Math.floor(Math.random() * (max2 - min2 + 1)) + min2;
            if (num1_comp === num2_comp && (max1 > min1 || max2 > min2 || max1 !==max2 || min1 !== min2)) {
                let makeNonEqualAttempts = 0;
                while (num1_comp === num2_comp && makeNonEqualAttempts < 10) {
                    num2_comp = Math.floor(Math.random() * (max2 - min2 + 1)) + min2;
                    makeNonEqualAttempts++;
                }
            }
        }

        if (num1_comp < num2_comp) answer_comp = '<';
        else if (num1_comp > num2_comp) answer_comp = '>';
        else answer_comp = '=';

        if (forceEquals && answer_comp !== '=') {
             num2_comp = num1_comp;
             answer_comp = '=';
        }

        q = { id: generateId(), type: 'comparison', mode: GameMode.COMPARISON, difficulty: difficultyLevel, number1: num1_comp, number2: num2_comp, answer: answer_comp };
    } while (existingSignatures.has(`comp-${q.number1}vs${q.number2}`));

    existingSignatures.add(`comp-${q.number1}vs${q.number2}`);
    if (q.number1 !== q.number2) {
        existingSignatures.add(`comp-${q.number2}vs${q.number1}`);
    }
    return q;
};


export const generateComparisonQuestion = (
    difficulty: DifficultyLevel, 
    existingSignatures: Set<string>, 
    equalsGenerated: number, 
    currentQIndex: number, 
    numQuestionsForThisRound: number, 
    lastComparisonWasEquals: boolean
): ComparisonQuestion => {
  let q: ComparisonQuestion;
  const range = difficulty === DifficultyLevel.PRE_SCHOOL_MAM ? 10 : 20;

  const shouldTryForceEquals =
    (equalsGenerated < MIN_EQUALS_IN_COMPARISON_ROUND) &&
    (currentQIndex >= numQuestionsForThisRound - (MIN_EQUALS_IN_COMPARISON_ROUND - equalsGenerated));

  const actualForceEqualsThisAttempt = shouldTryForceEquals && !lastComparisonWasEquals;

  do {
    let num1_comp = Math.floor(Math.random() * range) + 1;
    let num2_comp = Math.floor(Math.random() * range) + 1;

    if (actualForceEqualsThisAttempt) {
        let attempts = 0;
        while(existingSignatures.has(`comp-${num1_comp}vs${num1_comp}`) && attempts < range * 2) {
            num1_comp = Math.floor(Math.random() * range) + 1;
            attempts++;
        }
        num2_comp = num1_comp;
    } else if (num1_comp === num2_comp && lastComparisonWasEquals) {
        let attempts = 0;
        do {
            num2_comp = Math.floor(Math.random() * range) + 1;
            attempts++;
        } while (num2_comp === num1_comp && attempts < 10);

        if (num2_comp === num1_comp) continue; 
    }

    let answer_comp: '<' | '>' | '=';
    if (num1_comp < num2_comp) answer_comp = '<';
    else if (num1_comp > num2_comp) answer_comp = '>';
    else answer_comp = '=';

    if (answer_comp === '=' && lastComparisonWasEquals && !actualForceEqualsThisAttempt) {
        continue;
    }

    q = { id: generateId(), type: 'comparison', mode: GameMode.COMPARISON, difficulty: difficulty, number1: num1_comp, number2: num2_comp, answer: answer_comp };
  } while (existingSignatures.has(`comp-${q.number1}vs${q.number2}`));

  existingSignatures.add(`comp-${q.number1}vs${q.number2}`);
  if (q.number1 !== q.number2) existingSignatures.add(`comp-${q.number2}vs${q.number1}`);
  return q;
};

export const generateCountingQuestion = (
    difficulty: DifficultyLevel,
    existingSignatures: Set<string>,
    baseUnlockedIcons: ShapeType[],
    globallyRecentIcons: ShapeType[],
    iconsUsedInCurrentGenerationCycle: Set<ShapeType>
): CountingQuestion | null => {
    const prioritizedPool = getPrioritizedIconPool(baseUnlockedIcons, globallyRecentIcons);
    const candidateIconList = getCandidateIcons(prioritizedPool, iconsUsedInCurrentGenerationCycle, undefined, 1);

    if (candidateIconList.length === 0) {
      const fallbackCandidates = prioritizedPool.filter(icon => !existingSignatures.has(`count-${icon}`));
      if (fallbackCandidates.length === 0) return null; 
      candidateIconList.push(shuffleArray(fallbackCandidates)[0]);
    }
    
    const iconType = candidateIconList[0];
    if (!iconType) return null;


    const maxCount = difficulty === DifficultyLevel.PRE_SCHOOL_MAM ? 10 : 20;
    const minCount = difficulty === DifficultyLevel.PRE_SCHOOL_MAM ? 1 : (difficulty === DifficultyLevel.PRE_SCHOOL_CHOI ? 5 : 1) ;
    
    let count: number;
    let questionSignature: string;
    let attempts = 0;
    const MAX_ATTEMPTS = 20; 

    do {
      count = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;
      questionSignature = `count-${iconType}-${count}`;
      attempts++;
      if (attempts > MAX_ATTEMPTS && existingSignatures.has(questionSignature)) {
          break; 
      }
    } while (existingSignatures.has(questionSignature) && attempts <= MAX_ATTEMPTS);


    const shapes = Array(count).fill(iconType);
    const q: CountingQuestion = {
        id: generateId(), type: 'counting', mode: GameMode.COUNTING, difficulty: difficulty,
        shapes, iconType, answer: count,
        promptText: `Đếm số lượng ${iconType} trong hình:`
    };
    
    existingSignatures.add(`count-${iconType}`); 
    existingSignatures.add(questionSignature);   
    iconsUsedInCurrentGenerationCycle.add(iconType); 
    return q;
};

export const generateNumberRecognitionQuestion = (
    difficulty: DifficultyLevel,
    existingSignatures: Set<string>,
    baseUnlockedIcons: ShapeType[],
    globallyRecentIcons: ShapeType[],
    iconsUsedInCurrentGenerationCycle: Set<ShapeType>, 
    usedIconsThisModeCycle: Set<ShapeType> 
): NumberRecognitionQuestion | null => {
    const signatureBase = difficulty === DifficultyLevel.PRE_SCHOOL_MAM ? 'nr-m-' : 'nr-c-';
    const maxNum = difficulty === DifficultyLevel.PRE_SCHOOL_MAM ? 10 : 20;
    const numOptions = 3;

    const prioritizedPool = getPrioritizedIconPool(baseUnlockedIcons, globallyRecentIcons);
    if (prioritizedPool.length === 0) return null;

    let variant: 'number-to-items' | 'items-to-number';
    let optionsArray: NumberRecognitionOption[];
    let correctAnswerValue: number;
    let promptText: string;
    let targetItemIconForPrompt: ShapeType | undefined;
    let questionSignaturePart: string;
    let chosenIconForQuestion: ShapeType | null = null;

    let attempts = 0;
    const MAX_MAIN_ATTEMPTS = 30;

    do {
        attempts++;
        if (attempts > MAX_MAIN_ATTEMPTS) return null;

        const candidateIconsForThisQTarget = getCandidateIcons(prioritizedPool, iconsUsedInCurrentGenerationCycle, usedIconsThisModeCycle, 1);
        if (candidateIconsForThisQTarget.length === 0) {
          chosenIconForQuestion = null; // Ensure it's reset if no icon found this iteration
          continue; 
        }
        chosenIconForQuestion = candidateIconsForThisQTarget[0];
        
        variant = Math.random() < 0.5 ? 'number-to-items' : 'items-to-number';
        optionsArray = [];
        promptText = '';
        targetItemIconForPrompt = undefined;

        if (variant === 'number-to-items') {
            correctAnswerValue = Math.floor(Math.random() * maxNum) + 1;
            promptText = `Tìm nhóm có ${correctAnswerValue} ${chosenIconForQuestion}:`;
            optionsArray.push({ id: generateId(), display: Array(correctAnswerValue).fill(chosenIconForQuestion), isCorrect: true });
            questionSignaturePart = `n2i-${correctAnswerValue}-${chosenIconForQuestion}`;

            const distractorIconPool = getCandidateIcons(prioritizedPool, iconsUsedInCurrentGenerationCycle, new Set([chosenIconForQuestion]), prioritizedPool.length);

            while (optionsArray.length < numOptions) {
                let wrongCount = Math.floor(Math.random() * maxNum) + 1;
                // Check if this exact (count + icon) combo already exists as correct or another distractor
                if (optionsArray.some(opt => Array.isArray(opt.display) && opt.display.length === wrongCount && opt.display[0] === chosenIconForQuestion)) continue;
                
                let wrongOptionIcon = chosenIconForQuestion;
                 if (Math.random() < 0.3 && distractorIconPool.length > 0) {
                    const otherIconCandidates = distractorIconPool.filter(i => i !== chosenIconForQuestion);
                    if (otherIconCandidates.length > 0) wrongOptionIcon = otherIconCandidates[Math.floor(Math.random() * otherIconCandidates.length)];
                }
                optionsArray.push({ id: generateId(), display: Array(wrongCount).fill(wrongOptionIcon), isCorrect: false });
            }
        } else { // items-to-number
            targetItemIconForPrompt = chosenIconForQuestion;
            correctAnswerValue = Math.floor(Math.random() * maxNum) + 1;
            promptText = `Có bao nhiêu ${targetItemIconForPrompt} ở đây?`;
            optionsArray.push({ id: generateId(), display: correctAnswerValue.toString(), isCorrect: true });
            questionSignaturePart = `i2n-${correctAnswerValue}-${targetItemIconForPrompt}`;

            while (optionsArray.length < numOptions) {
                let wrongNum = Math.floor(Math.random() * maxNum) + 1;
                if (wrongNum === correctAnswerValue || optionsArray.some(opt => opt.display === wrongNum.toString())) continue;
                optionsArray.push({ id: generateId(), display: wrongNum.toString(), isCorrect: false });
            }
        }
    } while (!chosenIconForQuestion || existingSignatures.has(signatureBase + questionSignaturePart)); // Ensure chosenIconForQuestion is valid
    
    if (!chosenIconForQuestion) return null; 

    existingSignatures.add(signatureBase + questionSignaturePart);
    iconsUsedInCurrentGenerationCycle.add(chosenIconForQuestion);
    usedIconsThisModeCycle.add(chosenIconForQuestion);
    
    optionsArray.forEach(opt => {
        if(Array.isArray(opt.display)) {
            opt.display.forEach(icon => iconsUsedInCurrentGenerationCycle.add(icon));
        }
    });

    const q: NumberRecognitionQuestion = {
        id: generateId(), type: 'number_recognition', mode: GameMode.NUMBER_RECOGNITION, difficulty: difficulty,
        variant, promptText, options: shuffleArray(optionsArray),
        targetNumber: variant === 'number-to-items' ? correctAnswerValue : undefined,
        targetItems: variant === 'items-to-number' ? Array(correctAnswerValue).fill(targetItemIconForPrompt!) : undefined,
        targetItemIcon: variant === 'items-to-number' ? targetItemIconForPrompt : undefined,
    };
    return q;
};

export const generateMatchingPairsQuestion = (
    difficulty: DifficultyLevel,
    existingSignatures: Set<string>,
    baseUnlockedIcons: ShapeType[],
    globallyRecentIcons: ShapeType[],
    iconsUsedInCurrentGenerationCycle: Set<ShapeType>,
    usedIconsThisModeCycle: Set<ShapeType> 
): MatchingPairsQuestion | null => {
    const numPairs = difficulty === DifficultyLevel.PRE_SCHOOL_MAM ? 3 : 5;
    const maxNumValue = difficulty === DifficultyLevel.PRE_SCHOOL_MAM ? 5 : 10;
    const signatureBase = difficulty === DifficultyLevel.PRE_SCHOOL_MAM ? 'mp-m-' : 'mp-c-';
    const MAX_GENERATION_ATTEMPTS = 50;
    let generationAttempts = 0;

    let allItemsForQuestion: MatchableItem[] = [];
    let currentPairValuesAndIcons: { value: number, icon: string }[] = [];
    
    let questionNumbersSignaturePart = '';
    let questionIconsSignaturePart = '';


    const prioritizedPool = getPrioritizedIconPool(baseUnlockedIcons, globallyRecentIcons);
    if (prioritizedPool.length < numPairs) return null;


    do {
        generationAttempts++;
        if (generationAttempts > MAX_GENERATION_ATTEMPTS) return null;

        allItemsForQuestion = [];
        currentPairValuesAndIcons = [];
        const usedValuesThisQuestion = new Set<number>();
        
        const iconsForThisQuestionInstance = getCandidateIcons(prioritizedPool, iconsUsedInCurrentGenerationCycle, usedIconsThisModeCycle, numPairs);
        if (iconsForThisQuestionInstance.length < numPairs) {
            questionNumbersSignaturePart = ''; 
            questionIconsSignaturePart = '';
            continue; 
        }

        for (let i = 0; i < numPairs; i++) {
            let value: number;
            let valueAttempts = 0;
            do {
                value = Math.floor(Math.random() * maxNumValue) + 1;
                valueAttempts++;
            } while (usedValuesThisQuestion.has(value) && valueAttempts < (maxNumValue * 2));

            if (usedValuesThisQuestion.has(value)) { 
                currentPairValuesAndIcons = []; 
                break;
            }
            usedValuesThisQuestion.add(value);

            const iconForThisPair = iconsForThisQuestionInstance[i]; 
            currentPairValuesAndIcons.push({ value, icon: iconForThisPair });
        }

        if (currentPairValuesAndIcons.length !== numPairs) {
            questionNumbersSignaturePart = ''; 
            questionIconsSignaturePart = '';
            continue;
        }

        questionNumbersSignaturePart = currentPairValuesAndIcons.map(p => p.value).sort((a, b) => a - b).join('-');
        questionIconsSignaturePart = currentPairValuesAndIcons.map(p => p.icon).sort().join(',');
        
    } while (existingSignatures.has(signatureBase + questionNumbersSignaturePart + '-' + questionIconsSignaturePart));

    if (currentPairValuesAndIcons.length === numPairs) {
        existingSignatures.add(signatureBase + questionNumbersSignaturePart + '-' + questionIconsSignaturePart);
        const iconsActuallyUsedInThisQuestion: string[] = [];

        currentPairValuesAndIcons.forEach(pair => {
            iconsActuallyUsedInThisQuestion.push(pair.icon);
            const matchId = generateId();
            allItemsForQuestion.push({
                id: generateId(), matchId, display: pair.value.toString(),
                type: 'matching_pairs_element', visualType: 'digit',
                isMatched: false, isSelected: false
            });
            allItemsForQuestion.push({
                id: generateId(), matchId, display: Array(pair.value).fill(pair.icon).join(''),
                type: 'matching_pairs_element', visualType: 'emoji_icon',
                isMatched: false, isSelected: false
            });
        });
        
        iconsActuallyUsedInThisQuestion.forEach(icon => {
            iconsUsedInCurrentGenerationCycle.add(icon);
            usedIconsThisModeCycle.add(icon);
        });

        return {
            id: generateId(), type: 'matching_pairs', mode: GameMode.MATCHING_PAIRS, difficulty: difficulty,
            items: shuffleArray(allItemsForQuestion),
            promptText: "Nối các cặp tương ứng:"
        };
    }
    return null;
};

export const generateNumberSequenceQuestion = (
    difficulty: DifficultyLevel,
    existingSignatures: Set<string>
): NumberSequenceQuestion | null => {
    let sequence: (number | null)[] = [];
    let answers: number[] = [];
    let promptText = "Hoàn thành dãy số:";
    let direction: 'ascending' | 'descending' = 'ascending';
    let signature = '';

    if (difficulty === DifficultyLevel.PRE_SCHOOL_MAM) {
        const rangeMin = 1;
        const rangeMax = 15;
        const lengthOptions = [3, 4, 5];
        const length = lengthOptions[Math.floor(Math.random() * lengthOptions.length)];
        const numBlanksOptions = [1, 2];
        const numBlanks = numBlanksOptions[Math.floor(Math.random() * numBlanksOptions.length)];

        direction = 'ascending';
        promptText = "Hoàn thành dãy số tăng dần:";

        do {
            sequence = [];
            answers = [];
            const startNum = Math.floor(Math.random() * (rangeMax - length + 1)) + rangeMin;
            const fullSequence = Array.from({ length }, (_, i) => startNum + i);

            const blankIndices = new Set<number>();
            while (blankIndices.size < numBlanks && blankIndices.size < length) {
                blankIndices.add(Math.floor(Math.random() * length));
            }

            const tempAnswers: number[] = [];
            for (let i = 0; i < length; i++) {
                if (blankIndices.has(i)) {
                    sequence.push(null);
                    tempAnswers.push(fullSequence[i]);
                } else {
                    sequence.push(fullSequence[i]);
                }
            }
            // Sort answers based on their original position in the full sequence for blanks
            const sortedBlanksOriginalIndices = Array.from(blankIndices).sort((a,b) => a-b);
            answers = sortedBlanksOriginalIndices.map(originalIndex => fullSequence[originalIndex]);


            signature = `seq-m-${direction}-${sequence.map(s => s === null ? '_' : s).join(',')}`;
        } while (existingSignatures.has(signature));
        existingSignatures.add(signature);

    } else { // PRE_SCHOOL_CHOI
        const rangeMin = 10;
        const rangeMax = 30;
        const lengthOptions = [5, 6, 7];
        const length = lengthOptions[Math.floor(Math.random() * lengthOptions.length)];
        const numBlanksOptions = [2, 3];
        const numBlanks = numBlanksOptions[Math.floor(Math.random() * numBlanksOptions.length)];

        direction = Math.random() < 0.5 ? 'ascending' : 'descending';
        promptText = direction === 'ascending' ? "Hoàn thành dãy số tăng dần:" : "Hoàn thành dãy số giảm dần:";

        do {
            sequence = [];
            answers = [];
            const step = 1;
            let startNum: number;

            if (direction === 'ascending') {
                startNum = Math.floor(Math.random() * (rangeMax - length * step + step)) + rangeMin;
            } else {
                startNum = Math.floor(Math.random() * (rangeMax - rangeMin - length * step + step)) + (rangeMin + length * step - step);
            }

            const fullSequence = Array.from({ length }, (_, i) => direction === 'ascending' ? startNum + i * step : startNum - i * step);

            const blankIndices = new Set<number>();
            while (blankIndices.size < numBlanks && blankIndices.size < length) {
                blankIndices.add(Math.floor(Math.random() * length));
            }

            const tempAnswers: number[] = [];
            for (let i = 0; i < length; i++) {
                if (blankIndices.has(i)) {
                    sequence.push(null);
                    tempAnswers.push(fullSequence[i]);
                } else {
                    sequence.push(fullSequence[i]);
                }
            }
            const sortedBlanksOriginalIndices = Array.from(blankIndices).sort((a,b) => a-b);
            answers = sortedBlanksOriginalIndices.map(originalIndex => fullSequence[originalIndex]);

            signature = `seq-c-${direction}-${sequence.map(s => s === null ? '_' : s).join(',')}`;
        } while (existingSignatures.has(signature));
        existingSignatures.add(signature);
    }

    if (sequence.length === 0) return null;

    return {
        id: generateId(),
        type: 'number_sequence',
        mode: GameMode.NUMBER_SEQUENCE,
        difficulty: difficulty,
        sequence,
        answers,
        promptText,
        direction,
    };
};

const generateComparisonQuestionsForChoi = (difficulty: DifficultyLevel, existingSignatures: Set<string>, count: number): ComparisonQuestion[] => {
    const questions: ComparisonQuestion[] = [];
    
    const tryGenerate = (generator: () => ComparisonQuestion | null) => {
        const q = generator();
        if (q) questions.push(q);
    }

    let localEqualsGenerated = 0;
    let localLastWasEquals = false;

    for (let i = 0; i < 3 && questions.length < count; i++) {
        tryGenerate(() => _generateSpecificComparisonQuestion(difficulty, existingSignatures, 1, 10, 1, 10, false));
    }

    for (let i = 0; i < 3 && questions.length < count; i++) {
        tryGenerate(() => _generateSpecificComparisonQuestion(difficulty, existingSignatures, 1, 20, 1, 20, true));
    }

    for (let i = 0; i < 2 && questions.length < count; i++) {
        tryGenerate(() => _generateSpecificComparisonQuestion(difficulty, existingSignatures, 10, 20, 1, 9, false));
    }
    for (let i = 0; i < 2 && questions.length < count; i++) {
        tryGenerate(() => _generateSpecificComparisonQuestion(difficulty, existingSignatures, 1, 9, 10, 20, false));
    }

    const remainingToGenerate = count - questions.length;
    for (let i = 0; i < remainingToGenerate; i++) {
        tryGenerate(() => _generateSpecificComparisonQuestion(difficulty, existingSignatures, 10, 20, 10, 20, false));
    }

    while (questions.length < count) {
        localEqualsGenerated = questions.filter(q => q.answer === '=').length;
        localLastWasEquals = questions.length > 0 && questions[questions.length - 1].answer === '=';
        const fallbackQ = generateComparisonQuestion(difficulty, existingSignatures, localEqualsGenerated, questions.length, count, localLastWasEquals);
        if(fallbackQ) {
            questions.push(fallbackQ);
        } else break; 
    }

    let shuffledQuestions = shuffleArray(questions.slice(0, count));

    // Attempt to space out equals, very simple approach
    for (let i = 0; i < shuffledQuestions.length - 1; i++) {
        if (shuffledQuestions[i].answer === '=' && shuffledQuestions[i+1].answer === '=') {
            let swapIndex = -1;
            for (let k = i + 2; k < shuffledQuestions.length; k++) {
                if (shuffledQuestions[k].answer !== '=') {
                    swapIndex = k;
                    break;
                }
            }
            if (swapIndex !== -1) {
                [shuffledQuestions[i+1], shuffledQuestions[swapIndex]] = [shuffledQuestions[swapIndex], shuffledQuestions[i+1]];
            } else {
                for (let k = 0; k < i; k++) {
                     if (shuffledQuestions[k].answer !== '=') {
                        swapIndex = k;
                        break;
                    }
                }
                if (swapIndex !== -1) {
                     [shuffledQuestions[i], shuffledQuestions[swapIndex]] = [shuffledQuestions[swapIndex], shuffledQuestions[i]];
                }
            }
        }
    }
    return shuffledQuestions;
}

// --- START VISUAL PATTERN REFACTOR ---

const mamPatternRules: VisualPatternRuleType[] = ['M_ABAB', 'M_AABB', 'M_ABC', 'M_AAB', 'M_ABB'];
const choiPatternRuleBank: VisualPatternRuleType[] = [
    // Sequence
    'C_ABAC', 'C_AABCC', 'C_ABCD', 'C_ABCBA', 'C_CENTER_MIRROR_X', 'C_INTERLEAVING_PROGRESSION',
    // Quantity
    'C_PROGRESSIVE_QTY', 'C_FIBONACCI_QTY', 'C_DOUBLING_QTY', 'C_INTERLEAVING_QTY',
    // Transform
    'T_GRID_MOVE', 'T_ROTATE', 'T_FLIP', 'T_SCALE',
    // Combined
    'CT_SEQUENCE_AND_MOVE', 'CT_MOVE_AND_ROTATE'
];

const usedVisualPatternSignaturesThisSession = new Set<string>();

const VIETNAMESE_PATTERN_NAMES: Record<VisualPatternRuleType, string> = {
    M_ABAB: 'lặp lại xen kẽ hai hình (A-B-A-B)',
    M_AABB: 'lặp lại theo cặp hai hình (A-A-B-B)',
    M_ABC: 'lặp lại chuỗi ba hình (A-B-C)',
    M_AAB: 'lặp lại chuỗi A-A-B',
    M_ABB: 'lặp lại chuỗi A-B-B',
    C_ABAC: 'lặp lại có hình neo (A-B-A-C)',
    C_AABCC: 'lặp lại theo cặp phức tạp (A-A-B-C-C)',
    C_ABCD: 'lặp lại chuỗi bốn hình (A-B-C-D)',
    C_ABCBA: 'chuỗi đối xứng (A-B-C-B-A)',
    C_CENTER_MIRROR_X: 'chuỗi đối xứng có tâm',
    C_INTERLEAVING_PROGRESSION: 'chuỗi xen kẽ tăng tiến',
    C_PROGRESSIVE_QTY: 'số lượng tăng dần 1 đơn vị',
    C_FIBONACCI_QTY: 'số lượng là tổng của hai nhóm trước đó',
    C_DOUBLING_QTY: 'số lượng nhân đôi ở mỗi bước',
    C_INTERLEAVING_QTY: 'số lượng xen kẽ giữa các chuỗi',
    T_GRID_MOVE: 'di chuyển theo chiều kim đồng hồ trong các ô',
    T_ROTATE: 'xoay 90 độ sang phải ở mỗi bước',
    T_FLIP: 'lật ngược hình',
    T_SCALE: 'thay đổi kích thước (to-nhỏ)',
    CT_SEQUENCE_AND_MOVE: 'vừa thay đổi hình, vừa di chuyển vị trí',
    CT_MOVE_AND_ROTATE: 'vừa di chuyển vị trí, vừa xoay',
};

const generateVisualPatternExplanation = (ruleType: VisualPatternRuleType): string => {
    const explanationText = VIETNAMESE_PATTERN_NAMES[ruleType] || "một quy luật đặc biệt";
    return `Vì quy luật ở đây là ${explanationText}.`;
};

const generateVisualPatternOptions = (
    correctDisplay: PatternDisplayStep,
    distractorDisplays: PatternDisplayStep[]
): VisualPatternOption[] => {
    const options: VisualPatternOption[] = [];
    options.push({ id: generateId(), display: correctDisplay, isCorrect: true });
    distractorDisplays.forEach(display => {
        options.push({ id: generateId(), display, isCorrect: false });
    });
    return shuffleArray(options);
};

// Sub-generator for simple sequence rules (AB, ABC, etc.)
const generateSimpleSequencePattern = (
    ruleType: VisualPatternRuleType,
    iconPool: ShapeType[],
    usedIconsInRound: Set<ShapeType>
): VisualPatternQuestion | null => {
    let numUniqueEmojis = 0;
    let displayLength = 0;
    let patternTemplate: string[] = [];

    switch (ruleType) {
        case 'M_ABAB': numUniqueEmojis = 2; displayLength = 3; patternTemplate = ['A','B']; break;
        case 'M_AABB': numUniqueEmojis = 2; displayLength = 3; patternTemplate = ['A','A','B','B']; break;
        case 'M_ABC':  numUniqueEmojis = 3; displayLength = 4; patternTemplate = ['A','B','C']; break;
        case 'C_ABAC': numUniqueEmojis = 3; displayLength = 5; patternTemplate = ['A','B','A','C']; break;
        case 'C_ABCBA': numUniqueEmojis = 3; displayLength = 4; patternTemplate = ['A','B','C','B','A']; break;
        // Add other simple sequence rules here...
        default: return null;
    }

    if (iconPool.length < numUniqueEmojis) return null;
    const baseEmojis = getCandidateIcons(iconPool, usedIconsInRound, undefined, numUniqueEmojis);
    if (baseEmojis.length < numUniqueEmojis) return null;

    const emojiMap: Record<string, string> = { 'A': baseEmojis[0], 'B': baseEmojis[1], 'C': baseEmojis[2] };
    
    const fullPattern: string[] = [];
    for(let i=0; i< (displayLength + 5); i++) { // Generate a long sequence
        fullPattern.push(emojiMap[patternTemplate[i % patternTemplate.length]]);
    }

    const displayedSequence = fullPattern.slice(0, displayLength);
    const correctAnswer = fullPattern[displayLength];

    const distractorIcons = getCandidateIcons(iconPool, usedIconsInRound, new Set(baseEmojis), 3)
        .filter(i => i !== correctAnswer);
    if (distractorIcons.length < 3) return null; // Not enough distractors

    const options = generateVisualPatternOptions(correctAnswer, distractorIcons);
    baseEmojis.forEach(e => usedIconsInRound.add(e));
    const explanation = generateVisualPatternExplanation(ruleType);

    return {
        id: generateId(), type: 'visual_pattern', mode: GameMode.VISUAL_PATTERN, difficulty: DifficultyLevel.PRE_SCHOOL_CHOI,
        ruleType, displayedSequence, options, promptText: "Hình nào tiếp theo trong dãy?", explanation,
        correctAnswerEmoji: correctAnswer
    };
};

// Sub-generator for quantity-based rules
const generateQuantityPattern = (
    ruleType: VisualPatternRuleType,
    iconPool: ShapeType[],
    usedIconsInRound: Set<ShapeType>
): VisualPatternQuestion | null => {
    const baseIcon = getCandidateIcons(iconPool, usedIconsInRound, undefined, 1)[0];
    if (!baseIcon) return null;

    let sequenceNumbers: number[] = [];
    switch(ruleType) {
        case 'C_PROGRESSIVE_QTY':
            const start = Math.floor(Math.random() * 2) + 1; // 1 or 2
            sequenceNumbers = [start, start + 1, start + 2, start + 3, start + 4];
            break;
        case 'C_FIBONACCI_QTY':
            sequenceNumbers = [1, 1, 2, 3, 5, 8];
            break;
        case 'C_DOUBLING_QTY':
            sequenceNumbers = [1, 2, 4, 8];
            break;
        default: return null;
    }
    
    if (sequenceNumbers.length < 4) return null;

    const displayLength = 3;
    const displayedSequence = sequenceNumbers.slice(0, displayLength).map(n => Array(n).fill(baseIcon).join(''));
    const correctAnswer = Array(sequenceNumbers[displayLength]).fill(baseIcon).join('');

    const distractorNumbers = [
        sequenceNumbers[displayLength] + 1,
        sequenceNumbers[displayLength] - 1,
        sequenceNumbers[displayLength - 1],
    ].filter(n => n > 0 && n !== sequenceNumbers[displayLength]);
    
    const distractorDisplays = Array.from(new Set(distractorNumbers)).slice(0, 3).map(n => Array(n).fill(baseIcon).join(''));
    if (distractorDisplays.length < 3) return null;

    const options = generateVisualPatternOptions(correctAnswer, distractorDisplays);
    usedIconsInRound.add(baseIcon);
    const explanation = generateVisualPatternExplanation(ruleType);

    return {
        id: generateId(), type: 'visual_pattern', mode: GameMode.VISUAL_PATTERN, difficulty: DifficultyLevel.PRE_SCHOOL_CHOI,
        ruleType, displayedSequence, options, promptText: "Hình nào tiếp theo?", explanation,
        correctAnswerEmoji: correctAnswer
    };
}

// Sub-generator for transformation-based rules
const generateTransformPattern = (
    ruleType: VisualPatternRuleType,
    iconPool: ShapeType[],
    usedIconsInRound: Set<ShapeType>
): VisualPatternQuestion | null => {
    let question: VisualPatternQuestion | null = null;
    
    if (ruleType === 'T_GRID_MOVE') {
        const icon = getCandidateIcons(iconPool, usedIconsInRound, undefined, 1)[0];
        if (!icon) return null;
        
        const gridSize = { rows: 2, cols: 2 };
        const path = shuffleArray([
            { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 1 }, { row: 1, col: 0 }
        ]);

        const displayLength = 3;
        const displayedSequence: PatternDisplayStep[] = path.slice(0, displayLength).map(pos => ({
            gridSize, element: icon, position: pos
        }));

        const correctPosition = path[displayLength];
        const correctAnswerDisplay: PatternDisplayStep = { gridSize, element: icon, position: correctPosition };

        const distractorPositions = path.filter(p => p !== correctPosition);
        const distractorDisplays: PatternDisplayStep[] = distractorPositions.map(pos => ({
            gridSize, element: icon, position: pos
        }));

        const options = generateVisualPatternOptions(correctAnswerDisplay, distractorDisplays);
        usedIconsInRound.add(icon);
        const explanation = generateVisualPatternExplanation(ruleType);

        question = {
            id: generateId(), type: 'visual_pattern', mode: GameMode.VISUAL_PATTERN, difficulty: DifficultyLevel.PRE_SCHOOL_CHOI,
            ruleType, displayedSequence, options, promptText: "Tiếp theo, hình sẽ ở đâu?", explanation,
        };
    } else if (ruleType === 'T_ROTATE') {
        const icon = '➡️'; // Use non-symmetrical icon
        const rotations = [0, 90, 180, 270, 0];
        const displayLength = 3;

        const displayedSequence: PatternDisplayStep[] = rotations.slice(0, displayLength).map(r => ({ emoji: icon, rotation: r }));
        const correctAnswerDisplay: VisualContent = { emoji: icon, rotation: rotations[displayLength] };
        
        const distractorDisplays: VisualContent[] = shuffleArray([0, 90, 180, 270])
            .filter(r => r !== rotations[displayLength])
            .slice(0, 3)
            .map(r => ({ emoji: icon, rotation: r }));
        if (distractorDisplays.length < 3) return null;

        const options = generateVisualPatternOptions(correctAnswerDisplay, distractorDisplays);
        const explanation = generateVisualPatternExplanation(ruleType);
        
        question = {
            id: generateId(), type: 'visual_pattern', mode: GameMode.VISUAL_PATTERN, difficulty: DifficultyLevel.PRE_SCHOOL_CHOI,
            ruleType, displayedSequence, options, promptText: "Hình nào tiếp theo trong dãy?", explanation,
        };
    }

    return question;
}


// MAIN Visual Pattern Generator
export const generateVisualPatternQuestion = (
    difficulty: DifficultyLevel,
    existingSignatures: Set<string>,
    baseUnlockedIcons: ShapeType[],
    globallyRecentIcons: ShapeType[],
    iconsUsedInCurrentGenerationCycle: Set<ShapeType>,
    usedIconsThisModeCycle: Set<ShapeType>
): VisualPatternQuestion | null => {
    
    // For Mầm level, use the old, simple logic
    if (difficulty === DifficultyLevel.PRE_SCHOOL_MAM) {
        const ruleType = mamPatternRules[Math.floor(Math.random() * mamPatternRules.length)];
        const question = generateSimpleSequencePattern(ruleType, baseUnlockedIcons, iconsUsedInCurrentGenerationCycle);
        if (question) {
            // Simple validation to prevent duplicates in the same round
             const signature = `vp-legacy-${question.displayedSequence.join('-')}-${question.correctAnswerEmoji}`;
             if(usedVisualPatternSignaturesThisSession.has(signature)) return null;
             usedVisualPatternSignaturesThisSession.add(signature);
        }
        return question;
    }

    // For Chồi level, use the new Rule Bank
    const prioritizedIconPool = getPrioritizedIconPool(baseUnlockedIcons, globallyRecentIcons);
    if (prioritizedIconPool.length < 4) return null;

    let generatedQuestion: VisualPatternQuestion | null = null;
    let attempts = 0;
    const MAX_ATTEMPTS = 50;

    const shuffledRuleBank = shuffleArray(choiPatternRuleBank);

    while (!generatedQuestion && attempts < MAX_ATTEMPTS) {
        const ruleType = shuffledRuleBank[attempts % shuffledRuleBank.length];
        attempts++;

        if (['C_ABAC', 'C_ABCBA', 'M_ABAB', 'M_AABB', 'M_ABC'].includes(ruleType)) {
             generatedQuestion = generateSimpleSequencePattern(ruleType, prioritizedIconPool, iconsUsedInCurrentGenerationCycle);
        } else if (['C_PROGRESSIVE_QTY', 'C_FIBONACCI_QTY', 'C_DOUBLING_QTY'].includes(ruleType)) {
            generatedQuestion = generateQuantityPattern(ruleType, prioritizedIconPool, iconsUsedInCurrentGenerationCycle);
        } else if (['T_GRID_MOVE', 'T_ROTATE'].includes(ruleType)) {
            generatedQuestion = generateTransformPattern(ruleType, prioritizedIconPool, iconsUsedInCurrentGenerationCycle);
        }
        // Add more else-if for other rule generators here

        if (generatedQuestion) {
            const signature = `vp-${generatedQuestion.ruleType}-${JSON.stringify(generatedQuestion.displayedSequence)}-${JSON.stringify(generatedQuestion.options.map(o=>o.display).sort())}`;
            if (usedVisualPatternSignaturesThisSession.has(signature)) {
                generatedQuestion = null; // Found a duplicate, try again
            } else {
                usedVisualPatternSignaturesThisSession.add(signature);
            }
        }
    }
    
    return generatedQuestion;
};

// --- END VISUAL PATTERN REFACTOR ---


// --- ODD ONE OUT (REWRITTEN LOGIC) ---

interface IconData {
  emoji: ShapeType;
  name: string; // Vietnamese name for explanations
  primaryCategory: 'animal' | 'plant' | 'food' | 'drink' | 'vehicle' | 'clothing' | 'tool' | 'household' | 'nature' | 'celestial' | 'sports' | 'technology' | 'toy' | 'instrument' | 'building' | 'fantasy' | 'misc';
  subCategory?: 'mammal' | 'bird' | 'reptile' | 'amphibian' | 'fish' | 'insect' | 'invertebrate' | 'fruit' | 'vegetable' | 'flower' | 'tree' | 'dish' | 'dessert' | 'furniture' | 'appliance' | 'land_vehicle' | 'water_vehicle' | 'air_vehicle' | 'sports_equipment' | 'sports_activity' | 'school_supply' | 'construction_tool' | 'kitchen_tool';
  tertiaryCategory?: 'pet' | 'livestock' | 'wild_animal' | 'poultry';
  attributes: {
    is_living_organism?: boolean;
    is_edible?: boolean;
    environment?: 'land' | 'water' | 'sky' | 'underwater' | 'indoor' | 'space';
    can_fly?: boolean;
    propulsion?: 'road' | 'rail';
    diet?: 'carnivore' | 'herbivore' | 'omnivore';
    is_real?: boolean;
    temperature?: 'hot' | 'cold';
    power_source?: 'electric' | 'manual' | 'wind';
    function?: 'write' | 'cut' | 'cook' | 'eat' | 'sit' | 'clean' | 'wear' | 'play' | 'measure' | 'build';
  }
}

const ODD_ONE_OUT_ICON_DATA: IconData[] = [
    // --- ANIMALS ---
    { emoji: '🦁', name: 'Sư tử', primaryCategory: 'animal', subCategory: 'mammal', tertiaryCategory: 'wild_animal', attributes: { is_living_organism: true, environment: 'land', diet: 'carnivore', is_real: true } },
    { emoji: '🐯', name: 'Hổ', primaryCategory: 'animal', subCategory: 'mammal', tertiaryCategory: 'wild_animal', attributes: { is_living_organism: true, environment: 'land', diet: 'carnivore', is_real: true } },
    { emoji: '🐘', name: 'Voi', primaryCategory: 'animal', subCategory: 'mammal', tertiaryCategory: 'wild_animal', attributes: { is_living_organism: true, environment: 'land', diet: 'herbivore', is_real: true } },
    { emoji: '🐶', name: 'Chó', primaryCategory: 'animal', subCategory: 'mammal', tertiaryCategory: 'pet', attributes: { is_living_organism: true, environment: 'land', diet: 'omnivore', is_real: true } },
    { emoji: '🐱', name: 'Mèo', primaryCategory: 'animal', subCategory: 'mammal', tertiaryCategory: 'pet', attributes: { is_living_organism: true, environment: 'land', diet: 'carnivore', is_real: true } },
    { emoji: '🐄', name: 'Bò sữa', primaryCategory: 'animal', subCategory: 'mammal', tertiaryCategory: 'livestock', attributes: { is_living_organism: true, environment: 'land', is_edible: true, diet: 'herbivore', is_real: true } },
    { emoji: '🐖', name: 'Lợn (Heo)', primaryCategory: 'animal', subCategory: 'mammal', tertiaryCategory: 'livestock', attributes: { is_living_organism: true, environment: 'land', is_edible: true, diet: 'omnivore', is_real: true } },
    { emoji: '🐳', name: 'Cá voi', primaryCategory: 'animal', subCategory: 'mammal', attributes: { is_living_organism: true, environment: 'underwater', is_real: true } },
    { emoji: '🦇', name: 'Con dơi', primaryCategory: 'animal', subCategory: 'mammal', tertiaryCategory: 'wild_animal', attributes: { is_living_organism: true, environment: 'sky', can_fly: true, is_real: true } },
    { emoji: '🦅', name: 'Đại bàng', primaryCategory: 'animal', subCategory: 'bird', attributes: { is_living_organism: true, environment: 'sky', can_fly: true, diet: 'carnivore', is_real: true } },
    { emoji: '🐧', name: 'Chim cánh cụt', primaryCategory: 'animal', subCategory: 'bird', attributes: { is_living_organism: true, environment: 'land', can_fly: false, is_real: true } },
    { emoji: '🐓', name: 'Gà', primaryCategory: 'animal', subCategory: 'bird', tertiaryCategory: 'poultry', attributes: { is_living_organism: true, environment: 'land', can_fly: false, is_edible: true, diet: 'omnivore', is_real: true } },
    { emoji: '🦆', name: 'Vịt', primaryCategory: 'animal', subCategory: 'bird', tertiaryCategory: 'poultry', attributes: { is_living_organism: true, environment: 'water', can_fly: true, is_edible: true, is_real: true } },
    { emoji: '🐊', name: 'Cá sấu', primaryCategory: 'animal', subCategory: 'reptile', attributes: { is_living_organism: true, environment: 'water', diet: 'carnivore', is_real: true } },
    { emoji: '🐢', name: 'Rùa', primaryCategory: 'animal', subCategory: 'reptile', attributes: { is_living_organism: true, environment: 'water', diet: 'herbivore', is_real: true } },
    { emoji: '🐍', name: 'Rắn', primaryCategory: 'animal', subCategory: 'reptile', attributes: { is_living_organism: true, environment: 'land', diet: 'carnivore', is_real: true } },
    { emoji: '🐸', name: 'Ếch', primaryCategory: 'animal', subCategory: 'amphibian', attributes: { is_living_organism: true, environment: 'water', is_real: true } },
    { emoji: '🦈', name: 'Cá mập', primaryCategory: 'animal', subCategory: 'fish', attributes: { is_living_organism: true, environment: 'underwater', diet: 'carnivore', is_real: true } },
    { emoji: '🐠', name: 'Cá hề', primaryCategory: 'animal', subCategory: 'fish', attributes: { is_living_organism: true, environment: 'underwater', is_edible: true, is_real: true } },
    { emoji: '🐙', name: 'Bạch tuộc', primaryCategory: 'animal', subCategory: 'invertebrate', attributes: { is_living_organism: true, environment: 'underwater', is_edible: true, is_real: true } },
    { emoji: '🦋', name: 'Bướm', primaryCategory: 'animal', subCategory: 'insect', attributes: { is_living_organism: true, environment: 'sky', can_fly: true, is_real: true } },
    { emoji: '🐜', name: 'Kiến', primaryCategory: 'animal', subCategory: 'insect', attributes: { is_living_organism: true, environment: 'land', can_fly: false, is_real: true } },

    // --- PLANTS ---
    { emoji: '🍎', name: 'Táo', primaryCategory: 'plant', subCategory: 'fruit', attributes: { is_edible: true, is_living_organism: true } },
    { emoji: '🥕', name: 'Cà rốt', primaryCategory: 'plant', subCategory: 'vegetable', attributes: { is_edible: true, is_living_organism: true } },
    { emoji: '🌹', name: 'Hoa hồng', primaryCategory: 'plant', subCategory: 'flower', attributes: { is_living_organism: true, is_edible: false } },
    { emoji: '🌳', name: 'Cây xanh', primaryCategory: 'plant', subCategory: 'tree', attributes: { is_living_organism: true, is_edible: false } },
    { emoji: '🍄', name: 'Nấm', primaryCategory: 'plant', attributes: { is_edible: true, is_living_organism: true } },

    // --- FOOD & DRINK ---
    { emoji: '🍔', name: 'Hamburger', primaryCategory: 'food', subCategory: 'dish', attributes: { is_edible: true, is_living_organism: false } },
    { emoji: '🍕', name: 'Pizza', primaryCategory: 'food', subCategory: 'dish', attributes: { is_edible: true, is_living_organism: false } },
    { emoji: '🎂', name: 'Bánh kem', primaryCategory: 'food', subCategory: 'dessert', attributes: { is_edible: true, is_living_organism: false } },
    { emoji: '🍦', name: 'Kem', primaryCategory: 'food', subCategory: 'dessert', attributes: { is_edible: true, temperature: 'cold', is_living_organism: false } },
    { emoji: '☕', name: 'Cà phê', primaryCategory: 'drink', attributes: { is_edible: true, temperature: 'hot', is_living_organism: false } },
    { emoji: '🥛', name: 'Sữa', primaryCategory: 'drink', attributes: { is_edible: true, temperature: 'cold', is_living_organism: false } },
    { emoji: '🥃', name: 'Cốc nước', primaryCategory: 'drink', attributes: { is_edible: true, temperature: 'cold', is_living_organism: false } },

    // --- VEHICLES ---
    { emoji: '🚗', name: 'Ô tô con', primaryCategory: 'vehicle', subCategory: 'land_vehicle', attributes: { is_living_organism: false, environment: 'land', propulsion: 'road', power_source: 'manual' } },
    { emoji: '🚌', name: 'Xe buýt', primaryCategory: 'vehicle', subCategory: 'land_vehicle', attributes: { is_living_organism: false, environment: 'land', propulsion: 'road', power_source: 'manual' } },
    { emoji: '🚲', name: 'Xe đạp', primaryCategory: 'vehicle', subCategory: 'land_vehicle', attributes: { is_living_organism: false, environment: 'land', propulsion: 'road', power_source: 'manual' } },
    { emoji: '🚂', name: 'Tàu hỏa', primaryCategory: 'vehicle', subCategory: 'land_vehicle', attributes: { is_living_organism: false, environment: 'land', propulsion: 'rail' } },
    { emoji: '✈️', name: 'Máy bay', primaryCategory: 'vehicle', subCategory: 'air_vehicle', attributes: { is_living_organism: false, environment: 'sky', can_fly: true } },
    { emoji: '🚁', name: 'Trực thăng', primaryCategory: 'vehicle', subCategory: 'air_vehicle', attributes: { is_living_organism: false, environment: 'sky', can_fly: true } },
    { emoji: '🚀', name: 'Tên lửa', primaryCategory: 'vehicle', subCategory: 'air_vehicle', attributes: { is_living_organism: false, environment: 'space', can_fly: true } },
    { emoji: '🚢', name: 'Tàu thủy', primaryCategory: 'vehicle', subCategory: 'water_vehicle', attributes: { is_living_organism: false, environment: 'water' } },
    { emoji: '⛵', name: 'Thuyền buồm', primaryCategory: 'vehicle', subCategory: 'water_vehicle', attributes: { is_living_organism: false, environment: 'water', power_source: 'wind' } },
    
    // --- CLOTHING ---
    { emoji: '👕', name: 'Áo', primaryCategory: 'clothing', attributes: { is_living_organism: false, function: 'wear' } },
    { emoji: '👖', name: 'Quần', primaryCategory: 'clothing', attributes: { is_living_organism: false, function: 'wear' } },
    { emoji: '👗', name: 'Váy', primaryCategory: 'clothing', attributes: { is_living_organism: false, function: 'wear' } },
    { emoji: '👟', name: 'Giày', primaryCategory: 'clothing', attributes: { is_living_organism: false, function: 'wear' } },

    // --- TOOLS ---
    { emoji: '✏️', name: 'Bút chì', primaryCategory: 'tool', subCategory: 'school_supply', attributes: { is_living_organism: false, power_source: 'manual', function: 'write' } },
    { emoji: '📏', name: 'Thước kẻ', primaryCategory: 'tool', subCategory: 'school_supply', attributes: { is_living_organism: false, power_source: 'manual', function: 'measure' } },
    { emoji: '✂️', name: 'Kéo', primaryCategory: 'tool', subCategory: 'kitchen_tool', attributes: { is_living_organism: false, power_source: 'manual', function: 'cut' } },
    { emoji: '🔪', name: 'Dao', primaryCategory: 'tool', subCategory: 'kitchen_tool', attributes: { is_living_organism: false, power_source: 'manual', function: 'cut' } },
    { emoji: '🔨', name: 'Búa', primaryCategory: 'tool', subCategory: 'construction_tool', attributes: { is_living_organism: false, power_source: 'manual', function: 'build' } },

    // --- HOUSEHOLD ---
    { emoji: '🛋️', name: 'Ghế sofa', primaryCategory: 'household', subCategory: 'furniture', attributes: { is_living_organism: false, environment: 'indoor', function: 'sit' } },
    { emoji: '🛏️', name: 'Giường', primaryCategory: 'household', subCategory: 'furniture', attributes: { is_living_organism: false, environment: 'indoor', function: 'sit' } },
    { emoji: '🛁', name: 'Bồn tắm', primaryCategory: 'household', subCategory: 'furniture', attributes: { is_living_organism: false, environment: 'indoor', function: 'clean' } },
    { emoji: '🧹', name: 'Chổi', primaryCategory: 'household', attributes: { is_living_organism: false, function: 'clean', power_source: 'manual' } },
    
    // --- TECHNOLOGY ---
    { emoji: '📱', name: 'Điện thoại', primaryCategory: 'technology', attributes: { is_living_organism: false, power_source: 'electric' } },
    { emoji: '💻', name: 'Máy tính', primaryCategory: 'technology', attributes: { is_living_organism: false, power_source: 'electric' } },
    { emoji: '📷', name: 'Máy ảnh', primaryCategory: 'technology', attributes: { is_living_organism: false, power_source: 'electric' } },
    { emoji: '🔌', name: 'Phích cắm', primaryCategory: 'technology', attributes: { is_living_organism: false, power_source: 'electric' } },

    // --- SPORTS (UNIFIED CATEGORY) ---
    { emoji: '⚽', name: 'Bóng đá', primaryCategory: 'sports', subCategory: 'sports_equipment', attributes: { is_living_organism: false, power_source: 'manual', function: 'play' } },
    { emoji: '🏀', name: 'Bóng rổ', primaryCategory: 'sports', subCategory: 'sports_equipment', attributes: { is_living_organism: false, power_source: 'manual', function: 'play' } },
    { emoji: '🎾', name: 'Bóng tennis', primaryCategory: 'sports', subCategory: 'sports_equipment', attributes: { is_living_organism: false, power_source: 'manual', function: 'play' } },
    { emoji: '🎯', name: 'Phi tiêu', primaryCategory: 'sports', subCategory: 'sports_equipment', attributes: { is_living_organism: false, power_source: 'manual', function: 'play' } },
    { emoji: '🏃', name: 'Chạy bộ', primaryCategory: 'sports', subCategory: 'sports_activity', attributes: { power_source: 'manual' } },
    { emoji: '🏊', name: 'Bơi lội', primaryCategory: 'sports', subCategory: 'sports_activity', attributes: { power_source: 'manual' } },
    { emoji: '🚴', name: 'Đạp xe', primaryCategory: 'sports', subCategory: 'sports_activity', attributes: { power_source: 'manual' } },
    
    // --- MUSICAL INSTRUMENTS ---
    { emoji: '🎸', name: 'Đàn guitar', primaryCategory: 'instrument', attributes: { is_living_organism: false, power_source: 'manual', function: 'play' } },
    { emoji: '🎹', name: 'Đàn piano', primaryCategory: 'instrument', attributes: { is_living_organism: false, power_source: 'manual', function: 'play' } },
    { emoji: '🥁', name: 'Trống', primaryCategory: 'instrument', attributes: { is_living_organism: false, power_source: 'manual', function: 'play' } },
    { emoji: '🎤', name: 'Microphone', primaryCategory: 'instrument', attributes: { is_living_organism: false, power_source: 'electric', function: 'play' } },

    // --- CELESTIAL & NATURE ---
    { emoji: '☀️', name: 'Mặt trời', primaryCategory: 'celestial', attributes: { temperature: 'hot', is_real: true, is_living_organism: false } },
    { emoji: '🌙', name: 'Mặt trăng', primaryCategory: 'celestial', attributes: { temperature: 'cold', is_real: true, is_living_organism: false } },
    { emoji: '⭐', name: 'Ngôi sao', primaryCategory: 'celestial', attributes: { temperature: 'hot', is_real: true, is_living_organism: false } },
    { emoji: '🌍', name: 'Trái đất', primaryCategory: 'celestial', attributes: { is_real: true, is_living_organism: false } },
    { emoji: '🔥', name: 'Lửa', primaryCategory: 'nature', attributes: { temperature: 'hot', is_real: true, is_living_organism: false } },
    { emoji: '❄️', name: 'Bông tuyết', primaryCategory: 'nature', attributes: { temperature: 'cold', is_real: true, is_living_organism: false } },
    { emoji: '🌊', name: 'Sóng biển', primaryCategory: 'nature', attributes: { is_real: true, is_living_organism: false, environment: 'water' } },

    // --- BUILDINGS ---
    { emoji: '🏠', name: 'Nhà ở', primaryCategory: 'building', attributes: { environment: 'land', is_living_organism: false } },
    { emoji: '🏥', name: 'Bệnh viện', primaryCategory: 'building', attributes: { environment: 'land', is_living_organism: false } },
    { emoji: '🏫', name: 'Trường học', primaryCategory: 'building', attributes: { environment: 'land', is_living_organism: false } },
    { emoji: '🌉', name: 'Cầu', primaryCategory: 'building', attributes: { environment: 'land', is_living_organism: false } },

    // --- FANTASY ---
    { emoji: '🦄', name: 'Kỳ lân', primaryCategory: 'fantasy', subCategory: 'mammal', attributes: { is_living_organism: true, environment: 'land', is_real: false } },
    { emoji: '🐲', name: 'Rồng', primaryCategory: 'fantasy', subCategory: 'reptile', attributes: { is_living_organism: true, environment: 'sky', can_fly: true, is_real: false } },
    { emoji: '👻', name: 'Con ma', primaryCategory: 'fantasy', attributes: { is_living_organism: false, is_real: false, can_fly: true } },
    { emoji: '🤖', name: 'Robot', primaryCategory: 'fantasy', attributes: { is_living_organism: false, is_real: false, power_source: 'electric' } },
    { emoji: '👽', name: 'Người ngoài hành tinh', primaryCategory: 'fantasy', attributes: { is_living_organism: true, is_real: false } },
];


type OddOneOutRule = keyof IconData['attributes'] | 'primaryCategory' | 'subCategory' | 'tertiaryCategory';

const M_RULES: OddOneOutRule[] = [ 'primaryCategory', 'environment' ];
const C_RULES: OddOneOutRule[] = [ 'primaryCategory', 'environment', 'is_edible', 'propulsion', 'can_fly', 'is_real', 'is_living_organism', 'temperature', 'power_source', 'subCategory', 'function' ];
const RULE_HIERARCHY_FOR_TESTING: OddOneOutRule[] = [ 'primaryCategory', 'is_living_organism', 'is_real', 'environment', 'subCategory', 'power_source', 'is_edible', 'can_fly', 'propulsion', 'function', 'temperature', 'tertiaryCategory' ];

const VIETNAMESE_ENV_NAMES: Record<string, string> = {
    land: 'trên cạn',
    water: 'ở môi trường nước',
    sky: 'trên trời',
    underwater: 'sống dưới biển',
    indoor: 'trong nhà',
    space: 'ngoài không gian',
};

const VIETNAMESE_NAMES: Record<string, string> = {
    // Primary Categories
    animal: 'động vật', plant: 'thực vật', food: 'đồ ăn',
    drink: 'đồ uống', vehicle: 'phương tiện', clothing: 'quần áo', tool: 'dụng cụ', household: 'đồ dùng gia đình',
    sports: 'thể thao', technology: 'đồ công nghệ', toy: 'đồ chơi', instrument: 'nhạc cụ',
    nature: 'tự nhiên', celestial: 'thiên thể', building: 'công trình', fantasy: 'vật hư cấu', misc: 'vật khác',
    // Sub Categories
    mammal: 'động vật có vú', bird: 'loài chim', reptile: 'loài bò sát', fish: 'loài cá', insect: 'côn trùng',
    fruit: 'trái cây', vegetable: 'rau củ', flower: 'loài hoa', tree: 'loại cây',
    dish: 'món ăn', dessert: 'món tráng miệng',
    land_vehicle: 'phương tiện đường bộ', water_vehicle: 'phương tiện đường thủy', air_vehicle: 'phương tiện đường không',
    school_supply: 'dụng cụ học tập', furniture: 'đồ nội thất', sports_equipment: 'dụng cụ thể thao', sports_activity: 'hoạt động thể thao',
    // Tertiary Categories
    pet: 'thú cưng', livestock: 'gia súc', wild_animal: 'động vật hoang dã', poultry: 'gia cầm',
    // Propulsion
    road: 'chạy trên đường bộ', rail: 'chạy trên đường ray',
    // Diet
    carnivore: 'động vật ăn thịt', herbivore: 'động vật ăn cỏ', omnivore: 'động vật ăn tạp',
    // Temperature
    hot: 'nóng', cold: 'lạnh',
    // Power Source
    electric: 'vật dụng dùng điện', manual: 'vật dụng hoạt động bằng sức người', wind: 'hoạt động bằng sức gió',
    // Function
    write: 'dùng để viết', cut: 'dùng để cắt', cook: 'dùng để nấu', eat: 'dùng để ăn', sit: 'dùng để ngồi/nằm', clean: 'dùng để dọn dẹp',
    wear: 'dùng để mặc', play: 'dùng để chơi', measure: 'dùng để đo', build: 'dùng để xây dựng',
};

function generateExplanation(rule: OddOneOutRule, majorityValue: any, oddItemData: IconData, majorityItems: IconData[]): string {
    const { emoji: oddEmoji, name: oddName } = oddItemData;
    const ruleKey = majorityValue as keyof typeof VIETNAMESE_NAMES;

    if (rule === 'primaryCategory' || rule === 'subCategory' || rule === 'tertiaryCategory') {
        const categoryName = VIETNAMESE_NAMES[ruleKey] || 'nhóm chung';
        const oddCategoryValue = getRuleValue(oddItemData, rule);
        const oddCategoryName = VIETNAMESE_NAMES[oddCategoryValue as keyof typeof VIETNAMESE_NAMES] || 'nhóm khác';
        return `Vì các vật còn lại đều là ${categoryName}, còn ${oddEmoji} là ${oddCategoryName}.`;
    }
    if (rule === 'environment') {
        const areMajorityLiving = majorityItems.every(item => item.attributes.is_living_organism === true);
        const verb = areMajorityLiving ? 'sống' : 'ở';
        const location = VIETNAMESE_ENV_NAMES[majorityValue as keyof typeof VIETNAMESE_ENV_NAMES] || 'cùng một nơi';
        return `Vì các vật còn lại ${verb} ${location}, còn ${oddEmoji} (${oddName}) thì khác.`;
    }
    if (rule === 'power_source') {
        if (majorityValue === 'manual') {
            return `Vì các vật còn lại hoạt động bằng sức người, còn ${oddEmoji} (${oddName}) là vật dụng dùng điện.`;
        }
        if (majorityValue === 'electric') {
            return `Vì các vật còn lại là vật dụng dùng điện, còn ${oddEmoji} (${oddName}) hoạt động bằng sức người.`;
        }
    }
    if (rule === 'is_living_organism') {
        return majorityValue ? `Vì ${oddEmoji} (${oddName}) không phải là sinh vật sống, các vật còn lại thì có.` : `Vì chỉ có ${oddEmoji} (${oddName}) là sinh vật sống.`;
    }
    if (rule === 'is_edible') {
        return majorityValue ? `Vì chỉ có ${oddEmoji} (${oddName}) không ăn được, các vật còn lại thì ăn được.` : `Vì chỉ có ${oddEmoji} (${oddName}) ăn được.`;
    }
    if (rule === 'can_fly') {
        return majorityValue ? `Vì chỉ có ${oddEmoji} (${oddName}) không biết bay.` : `Vì chỉ có ${oddEmoji} (${oddName}) biết bay.`;
    }
    if (rule === 'propulsion' || rule === 'diet' || rule === 'temperature' || rule === 'function') {
        const majorityDescription = VIETNAMESE_NAMES[ruleKey] || 'cùng một loại';
        return `Vì các vật còn lại đều là ${majorityDescription}, còn ${oddEmoji} (${oddName}) thì khác.`;
    }
    if (rule === 'is_real') {
        return majorityValue ? `Vì chỉ có ${oddEmoji} (${oddName}) là nhân vật/vật hư cấu.` : `Vì chỉ có ${oddEmoji} (${oddName}) là có thật.`;
    }
    return `Vì ${oddEmoji} là vật khác biệt.`;
}

const getRuleValue = (item: IconData, rule: OddOneOutRule): any => {
    if (rule === 'primaryCategory') return item.primaryCategory;
    if (rule === 'subCategory') return item.subCategory;
    if (rule === 'tertiaryCategory') return item.tertiaryCategory;
    return item.attributes[rule as keyof typeof item.attributes];
}

export const generateOddOneOutQuestion = (
    difficulty: DifficultyLevel,
    existingSignaturesOverall: Set<string>,
    baseUnlockedIcons: ShapeType[],
    iconsUsedInCurrentGenerationCycle: Set<ShapeType>
): OddOneOutQuestion | null => {
    const numOptions = difficulty === DifficultyLevel.PRE_SCHOOL_MAM ? 3 : 4;
    const availableIcons = ODD_ONE_OUT_ICON_DATA.filter(iconData => 
        baseUnlockedIcons.includes(iconData.emoji) && !iconsUsedInCurrentGenerationCycle.has(iconData.emoji)
    );

    if (availableIcons.length < numOptions) {
        console.warn("Not enough available icons for OddOneOut.");
        return null;
    }

    const rulesToTry = shuffleArray(difficulty === DifficultyLevel.PRE_SCHOOL_MAM ? M_RULES : C_RULES);
    let attempts = 0;
    const MAX_ATTEMPTS = 500; // Total attempts to find any valid question

    while (attempts < MAX_ATTEMPTS) {
        attempts++;
        const mainRule = rulesToTry[attempts % rulesToTry.length];

        const valueGroups = new Map<any, IconData[]>();
        for (const icon of availableIcons) {
            const value = getRuleValue(icon, mainRule);
            if (value !== undefined) {
                if (!valueGroups.has(value)) valueGroups.set(value, []);
                valueGroups.get(value)!.push(icon);
            }
        }
        
        const validMajorityGroups = Array.from(valueGroups.entries()).filter(([_, icons]) => icons.length >= numOptions - 1);
        const validMinorityGroups = Array.from(valueGroups.entries()).filter(([_, icons]) => icons.length >= 1);
        
        if (validMajorityGroups.length === 0 || validMinorityGroups.length < 2) {
            continue;
        }

        let candidateSet: IconData[] = [];
        let oddItem: IconData | null = null;
        let majorityValue: any = null;
        let majorityItems: IconData[] = [];

        const [majValue, majIcons] = shuffleArray(validMajorityGroups)[0];
        majorityValue = majValue;
        
        const minorityCandidates = validMinorityGroups.filter(([minValue, _]) => minValue !== majValue);
        if (minorityCandidates.length === 0) continue;

        const [_, minIcons] = shuffleArray(minorityCandidates)[0];
        majorityItems = shuffleArray(majIcons).slice(0, numOptions - 1);
        oddItem = shuffleArray(minIcons)[0];
        
        if (!oddItem || majorityItems.length < numOptions - 1) continue;
        candidateSet = [...majorityItems, oddItem];
        if (candidateSet.length !== numOptions) continue;

        if (mainRule !== 'primaryCategory') {
            const firstPrimaryCategory = majorityItems[0].primaryCategory;
            if (!majorityItems.every(item => item.primaryCategory === firstPrimaryCategory)) {
                continue; 
            }
        }

        const questionSignature = `ooo-${candidateSet.map(item => item.emoji).sort().join('_')}`;
        if (existingSignaturesOverall.has(questionSignature)) {
            continue;
        }

        let isAmbiguous = false;
        const booleanRules = ['is_living_organism', 'is_edible', 'can_fly', 'is_real'];

        for (const testRule of RULE_HIERARCHY_FOR_TESTING) {
            if (testRule === mainRule) continue;

            const isBooleanRule = booleanRules.includes(testRule);
            const testValueGroups = new Map<any, IconData[]>();
            
            for (const icon of candidateSet) {
                let value = getRuleValue(icon, testRule);
                if (isBooleanRule && value === undefined) {
                    value = false;
                }

                 if (value !== undefined) {
                    if (!testValueGroups.has(value)) testValueGroups.set(value, []);
                    testValueGroups.get(value)!.push(icon);
                }
            }

            if (testValueGroups.size === 2) {
                let sizes = Array.from(testValueGroups.values()).map(g => g.length).sort((a,b)=>a-b);
                if (sizes[0] === 1 && sizes[1] === numOptions - 1) {
                    const testOddItem = Array.from(testValueGroups.values()).find(g => g.length === 1)![0];
                    if (testOddItem.emoji !== oddItem.emoji) {
                        isAmbiguous = true;
                        break;
                    }
                }
            }
        }

        if (isAmbiguous) {
            continue;
        }

        const options: OddOneOutOption[] = candidateSet.map(item => ({ id: generateId(), emoji: item.emoji }));
        const correctAnswerId = options.find(opt => opt.emoji === oddItem!.emoji)!.id;
        const explanation = generateExplanation(mainRule, majorityValue, oddItem, majorityItems);
        
        existingSignaturesOverall.add(questionSignature);
        candidateSet.forEach(item => iconsUsedInCurrentGenerationCycle.add(item.emoji));


        return {
            id: generateId(), type: 'odd_one_out', mode: GameMode.ODD_ONE_OUT, difficulty,
            options: shuffleArray(options), correctAnswerId,
            promptText: "Tìm vật khác biệt:", explanation
        };
    }

    console.warn("Failed to generate a non-ambiguous Odd One Out question after all attempts.");
    return null;
};



const usedNumberSequenceSignaturesThisSession = new Set<string>();

// MAIN QUESTION GENERATION FUNCTION
export const generateQuestionsForRound = (
  mode: GameMode,
  difficulty: DifficultyLevel,
  unlockedSetIds: string[],
  numQuestions: number,
  globallyRecentIcons: ShapeType[] // Icons used in *previous* sessions/rounds
): { questions: Question[], iconsUsedInRound: Set<ShapeType> } => {
  const questions: Question[] = [];
  const existingSignaturesThisRound = new Set<string>(); // Tracks signatures for ALL modes within this current round
  const iconsUsedInCurrentGenerationCycle = new Set<ShapeType>(); // Tracks icons used by ANY question in this current round's generation
  
  // Specific tracking for icons used by a mode within this round, to ensure its own internal diversity.
  const iconsUsedByCountingThisRound = new Set<ShapeType>();
  const iconsUsedByNumberRecThisRound = new Set<ShapeType>();
  const iconsUsedByMatchingPairsThisRound = new Set<ShapeType>();
  const iconsUsedByVisualPatternThisRound = new Set<ShapeType>();
  const iconsUsedByOddOneOutThisRound = new Set<ShapeType>();

  // Clear session-specific signature sets at the start of a new round generation
  usedVisualPatternSignaturesThisSession.clear();
  usedNumberSequenceSignaturesThisSession.clear();


  const baseUnlockedIcons = getAllBaseUnlockedIcons(unlockedSetIds);

  let equalsGenerated = 0;
  let lastComparisonWasEquals = false;

  for (let i = 0; i < numQuestions; i++) {
    let q: Question | null = null;
    let attemptsForThisQuestion = 0;
    const MAX_ATTEMPTS_PER_SINGLE_QUESTION = 20; // Max attempts to generate one question before giving up on that slot

    while (!q && attemptsForThisQuestion < MAX_ATTEMPTS_PER_SINGLE_QUESTION) {
        attemptsForThisQuestion++;
        switch (mode) {
            case GameMode.ADDITION:
                q = generateAdditionQuestion(difficulty, existingSignaturesThisRound);
                break;
            case GameMode.SUBTRACTION:
                q = generateSubtractionQuestion(difficulty, existingSignaturesThisRound);
                break;
            case GameMode.COMPARISON:
                if (difficulty === DifficultyLevel.PRE_SCHOOL_CHOI && i === 0 && questions.length === 0) {
                    // Pre-generate a full set for Choi comparison to ensure variety.
                    // This is a bit of a hack; ideally, generation logic should handle this smoothly per question.
                    const choiComparisonQs = generateComparisonQuestionsForChoi(difficulty, existingSignaturesThisRound, numQuestions);
                    if (choiComparisonQs.length > 0) {
                        questions.push(...choiComparisonQs.slice(0, numQuestions - questions.length));
                        choiComparisonQs.forEach(cq => { // Manually add icons if any were part of its generation (none for comparison)
                            existingSignaturesThisRound.add(`comp-${cq.number1}vs${cq.number2}`);
                            if (cq.number1 !== cq.number2) existingSignaturesThisRound.add(`comp-${cq.number2}vs${cq.number1}`);
                        });
                        // Fast forward i to the number of questions generated
                        i = questions.length -1; 
                        q = questions[i]; // so the outer loop condition breaks correctly
                    } else {
                         q = generateComparisonQuestion(difficulty, existingSignaturesThisRound, equalsGenerated, i, numQuestions, lastComparisonWasEquals);
                    }
                } else {
                     q = generateComparisonQuestion(difficulty, existingSignaturesThisRound, equalsGenerated, i, numQuestions, lastComparisonWasEquals);
                }
               
                if (q && q.type === 'comparison') {
                    if ((q as ComparisonQuestion).answer === '=') {
                        equalsGenerated++;
                        lastComparisonWasEquals = true;
                    } else {
                        lastComparisonWasEquals = false;
                    }
                }
                break;
            case GameMode.COUNTING:
                q = generateCountingQuestion(difficulty, existingSignaturesThisRound, baseUnlockedIcons, globallyRecentIcons, iconsUsedInCurrentGenerationCycle);
                if (q) iconsUsedByCountingThisRound.add((q as CountingQuestion).iconType);
                break;
            case GameMode.NUMBER_RECOGNITION:
                q = generateNumberRecognitionQuestion(difficulty, existingSignaturesThisRound, baseUnlockedIcons, globallyRecentIcons, iconsUsedInCurrentGenerationCycle, iconsUsedByNumberRecThisRound);
                break;
            case GameMode.MATCHING_PAIRS:
                q = generateMatchingPairsQuestion(difficulty, existingSignaturesThisRound, baseUnlockedIcons, globallyRecentIcons, iconsUsedInCurrentGenerationCycle, iconsUsedByMatchingPairsThisRound);
                break;
            case GameMode.NUMBER_SEQUENCE:
                q = generateNumberSequenceQuestion(difficulty, usedNumberSequenceSignaturesThisSession);
                 if (q && q.type === 'number_sequence') {
                    const signature = `seq-${difficulty}-${(q as NumberSequenceQuestion).direction || 'asc'}-${(q as NumberSequenceQuestion).sequence.map(s => s === null ? '_' : s).join(',')}`;
                    if(existingSignaturesThisRound.has(signature)) q = null; // Already used in this exact round by another mechanism
                    else existingSignaturesThisRound.add(signature);
                }
                break;
             case GameMode.VISUAL_PATTERN:
                q = generateVisualPatternQuestion(difficulty, usedVisualPatternSignaturesThisSession, baseUnlockedIcons, globallyRecentIcons, iconsUsedInCurrentGenerationCycle, iconsUsedByVisualPatternThisRound);
                 if (q && q.type === 'visual_pattern') {
                    const vpQ = q as VisualPatternQuestion;
                    // Signature check is now handled inside the generator
                    if (!vpQ) q = null;
                }
                break;
            case GameMode.ODD_ONE_OUT:
                q = generateOddOneOutQuestion(difficulty, existingSignaturesThisRound, baseUnlockedIcons, iconsUsedInCurrentGenerationCycle);
                break;
        }
    }
    
    if (q) {
      questions.push(q);
    } else {
      console.warn(`Failed to generate question for mode ${mode} at index ${i} after ${MAX_ATTEMPTS_PER_SINGLE_QUESTION} attempts. Round might be shorter.`);
    }
  }
  return { questions, iconsUsedInRound: iconsUsedInCurrentGenerationCycle };
};