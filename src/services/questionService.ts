import { GameMode, DifficultyLevel, Question, ShapeType } from '../../types';
import { getAllBaseUnlockedIcons, shuffleArray } from './questionUtils';

// Import individual question generators
import { generateAdditionQuestion, generateSubtractionQuestion } from './generators/mathQuestionGenerator';
import { generateComparisonQuestion, generateComparisonQuestionsForChoi } from './generators/comparisonQuestionGenerator';
import { generateCountingQuestion } from './generators/countingQuestionGenerator';
import { generateMatchingPairsQuestion } from './generators/matchingPairsGenerator';
import { generateNumberRecognitionQuestion } from './generators/numberRecognitionGenerator';
import { generateNumberSequenceQuestion } from './generators/numberSequenceGenerator';
import { generateVisualPatternQuestion, mamPatternRules, choiPatternRuleBank } from './generators/visualPatternGenerator';
import { generateOddOneOutQuestion, ODD_ONE_OUT_RULE_DEFINITIONS, OddOneOutRuleType } from './generators/oddOneOutGenerator';

export const generateQuestionsForRound = (
  mode: GameMode,
  difficulty: DifficultyLevel,
  unlockedSetIds: string[],
  numQuestions: number,
  globallyRecentIcons: ShapeType[]
): { questions: Question[], iconsUsedInRound: Set<ShapeType> } => {
  const questions: Question[] = [];
  const existingSignatures = new Set<string>();
  
  const iconsUsedInCurrentGenerationCycle = new Set<ShapeType>();
  const iconsUsedThisModeCycle = new Set<ShapeType>();

  const allBaseIcons = getAllBaseUnlockedIcons(unlockedSetIds);
  
  let equalsGenerated = 0;
  let lastComparisonWasEquals = false;

  let rulePlaylist: any[] = [];
  if (mode === GameMode.VISUAL_PATTERN) {
      const rules = difficulty === DifficultyLevel.PRE_SCHOOL_MAM ? mamPatternRules : choiPatternRuleBank;
      const fullPlaylist = [...rules];
      while (fullPlaylist.length < numQuestions) {
          fullPlaylist.push(rules[Math.floor(Math.random() * rules.length)]);
      }
      rulePlaylist = shuffleArray(fullPlaylist).slice(0, numQuestions);
  }
  
  if (mode === GameMode.ODD_ONE_OUT) {
      const ruleTypes = Object.keys(ODD_ONE_OUT_RULE_DEFINITIONS).filter(key => {
          const def = ODD_ONE_OUT_RULE_DEFINITIONS[key as OddOneOutRuleType];
          if(difficulty === DifficultyLevel.PRE_SCHOOL_MAM) return def.level !== 'CHOI';
          return def.level !== 'MAM';
      });
      const fullPlaylist = [];
      // Ensure each rule appears at least once if possible
      ruleTypes.forEach(rule => fullPlaylist.push(rule));
      while (fullPlaylist.length < numQuestions) {
          fullPlaylist.push(ruleTypes[Math.floor(Math.random() * ruleTypes.length)]);
      }
      rulePlaylist = shuffleArray(fullPlaylist).slice(0, numQuestions);
  }


  for (let i = 0; i < numQuestions; i++) {
    let question: Question | null = null;
    let attempts = 0;
    const MAX_ATTEMPTS_PER_QUESTION = 10;

    while (!question && attempts < MAX_ATTEMPTS_PER_QUESTION) {
        attempts++;
        switch (mode) {
          case GameMode.ADDITION:
            question = generateAdditionQuestion(difficulty, existingSignatures);
            break;
          case GameMode.SUBTRACTION:
            question = generateSubtractionQuestion(difficulty, existingSignatures);
            break;
          case GameMode.COMPARISON:
            if (difficulty === DifficultyLevel.PRE_SCHOOL_CHOI && i === 0) {
                 const comparisonQuestions = generateComparisonQuestionsForChoi(difficulty, existingSignatures, numQuestions);
                 questions.push(...comparisonQuestions);
                 i = numQuestions; // End the loop after this
                 continue;
            } else {
                 question = generateComparisonQuestion(difficulty, existingSignatures, equalsGenerated, i, numQuestions, lastComparisonWasEquals);
                 if (question && question.answer === '=') {
                    equalsGenerated++;
                    lastComparisonWasEquals = true;
                 } else if (question) {
                    lastComparisonWasEquals = false;
                 }
            }
            break;
          case GameMode.COUNTING:
            question = generateCountingQuestion(difficulty, existingSignatures, allBaseIcons, globallyRecentIcons, iconsUsedInCurrentGenerationCycle);
            break;
          case GameMode.NUMBER_RECOGNITION:
            question = generateNumberRecognitionQuestion(difficulty, existingSignatures, allBaseIcons, globallyRecentIcons, iconsUsedInCurrentGenerationCycle, iconsUsedThisModeCycle);
            break;
          case GameMode.MATCHING_PAIRS:
            question = generateMatchingPairsQuestion(difficulty, existingSignatures, allBaseIcons, globallyRecentIcons, iconsUsedInCurrentGenerationCycle, iconsUsedThisModeCycle);
            break;
          case GameMode.NUMBER_SEQUENCE:
            question = generateNumberSequenceQuestion(difficulty, existingSignatures);
            break;
          case GameMode.VISUAL_PATTERN:
            const ruleForThisQuestion = rulePlaylist[i];
            question = generateVisualPatternQuestion(difficulty, existingSignatures, allBaseIcons, globallyRecentIcons, iconsUsedInCurrentGenerationCycle, iconsUsedThisModeCycle, ruleForThisQuestion);
            break;
          case GameMode.ODD_ONE_OUT:
            const oddOneOutRule = rulePlaylist[i] as OddOneOutRuleType;
            question = generateOddOneOutQuestion(difficulty, existingSignatures, oddOneOutRule, iconsUsedInCurrentGenerationCycle);
            break;
        }
    }

    if (question) {
      questions.push(question);
    } else {
      console.warn(`Failed to generate a unique question for mode ${mode} at index ${i} after ${MAX_ATTEMPTS_PER_QUESTION} attempts. Round may be shorter than intended.`);
    }
  }

  // Final shuffle for comparison mode which might have a special generation logic
  if (mode === GameMode.COMPARISON && difficulty === DifficultyLevel.PRE_SCHOOL_CHOI) {
    if (questions.length > numQuestions) {
        const finalQuestions = shuffleArray(questions).slice(0, numQuestions);
        return { questions: finalQuestions, iconsUsedInRound: iconsUsedInCurrentGenerationCycle };
    }
  }


  return { questions, iconsUsedInRound: iconsUsedInCurrentGenerationCycle };
};