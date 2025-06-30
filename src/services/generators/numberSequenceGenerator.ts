import { DifficultyLevel, NumberSequenceQuestion, GameMode } from '../../../types';
import { generateId } from '../questionUtils';

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
