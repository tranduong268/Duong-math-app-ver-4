import { DifficultyLevel, ComparisonQuestion, GameMode } from '../../../types';
import { generateId, shuffleArray } from '../questionUtils';
import { MIN_EQUALS_IN_COMPARISON_ROUND } from '../../../constants';

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

export const generateComparisonQuestionsForChoi = (difficulty: DifficultyLevel, existingSignatures: Set<string>, count: number): ComparisonQuestion[] => {
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