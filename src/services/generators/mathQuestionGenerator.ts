import { DifficultyLevel, MathQuestion, MathQuestionUnknownSlot, GameMode } from '../../../types';
import { generateId } from '../questionUtils';

const getMathSignature = (op1: number, op2: number, oper: '+' | '-', res: number, slot: MathQuestionUnknownSlot): string => {
  return `math-${oper}-${op1}-${op2}-${res}-${slot}`;
};

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
