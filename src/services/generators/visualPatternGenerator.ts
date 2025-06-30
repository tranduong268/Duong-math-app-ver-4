import { DifficultyLevel, VisualPatternQuestion, ShapeType, GameMode, VisualPatternRuleType, PatternDisplayStep, VisualContent, VisualPatternOption, IconData } from '../../../types';
import { generateId, getPrioritizedIconPool, getCandidateIcons, shuffleArray, getVietnameseName } from '../questionUtils';
import { ICON_DATA } from '../../data/iconData';
import { INITIAL_COUNTING_ICONS } from '../../../constants';

const ROTATION_CANDIDATE_ICONS = ['➡️', 'L', 'P', 'F', 'J', 'G', 'K', '⤴️', '⤵️', '↩️', '↪️', '🏹', '🔑', '👢', '👡', '🛴', '🪓', '⛏️', '🎷', '🎺', '🪝', '🌙'];
const FLIP_CANDIDATE_ICONS = ['P', 'F', 'J', 'R', 'S', 'Z', 'N', 'G', 'K', '👍', '👎', 'd', 'b', 'q', 'p', '>', '<', '(', ')', '[', ']', '}', '{', '🎵', '🪧', '💪', '🦵', '🦶', '👂'];
const SCALE_CANDIDATE_ICONS = INITIAL_COUNTING_ICONS; 

export const mamPatternRules: VisualPatternRuleType[] = ['M_ABAB', 'M_AABB', 'M_ABC', 'M_AAB', 'M_ABB', 'M_ABBA', 'M_COLOR_PATTERN', 'M_CATEGORY_ALTERNATE', 'M_MISSING_MIDDLE', 'M_SIZE_PATTERN'];
export const choiPatternRuleBank: VisualPatternRuleType[] = [
    'C_ABAC', 'C_AABCC', 'C_ABCD', 'C_ABCBA', 'C_INTERLEAVING_PROGRESSION',
    'C_PROGRESSIVE_QTY', 'C_DOUBLING_QTY', 'C_INTERLEAVING_QTY', 'C_FIBONACCI_QTY', 'C_NON_LINEAR_QTY',
    'T_GRID_MOVE', 'T_ROTATE', 'T_FLIP', 'T_SCALE', 'C_CENTER_MIRROR_X',
    'CT_MOVE_AND_ROTATE', 'CT_SEQUENCE_AND_MOVE', 'CT_ROTATE_AND_SCALE',
    'C_MATRIX_LOGIC_2X2', 'C_MISSING_MIDDLE',
];

const usedVisualPatternSignaturesThisSession = new Set<string>();

const VIETNAMESE_PATTERN_TEMPLATES: Record<string, string | ((options: any) => string)> = {
    M_ABAB: 'lặp lại xen kẽ hai hình (A-B-A-B)',
    M_AABB: 'lặp lại theo cặp hai hình (A-A-B-B)',
    M_ABC: 'lặp lại chuỗi ba hình (A-B-C)',
    M_AAB: 'lặp lại chuỗi A-A-B',
    M_ABB: 'lặp lại chuỗi A-B-B',
    M_ABBA: 'chuỗi đối xứng đơn giản (A-B-B-A)',
    M_COLOR_PATTERN: 'lặp lại xen kẽ theo màu sắc',
    M_CATEGORY_ALTERNATE: 'lặp lại xen kẽ theo chủng loại (ví dụ: động vật, xe cộ)',
    C_ABAC: 'lặp lại có hình neo (A-B-A-C)',
    C_AABCC: 'lặp lại theo cặp phức tạp (A-A-B-C-C)',
    C_ABCD: 'lặp lại chuỗi bốn hình (A-B-C-D)',
    C_ABCBA: 'chuỗi đối xứng (A-B-C-B-A)',
    C_INTERLEAVING_PROGRESSION: 'một hình giữ nguyên và một hình thay đổi theo chuỗi',
    M_MISSING_MIDDLE: 'tìm hình còn thiếu trong một quy luật đơn giản',
    C_MISSING_MIDDLE: 'tìm hình còn thiếu trong một quy luật phức tạp',
    M_SIZE_PATTERN: 'thay đổi kích thước (to - nhỏ - to)',
    C_PROGRESSIVE_QTY: (opts) => `số lượng ${opts.step > 0 ? 'tăng' : 'giảm'} ${Math.abs(opts.step)} ở mỗi bước`,
    C_DOUBLING_QTY: 'số lượng nhân đôi ở mỗi bước',
    C_INTERLEAVING_QTY: 'hai quy luật số lượng xen kẽ nhau',
    C_FIBONACCI_QTY: 'số lượng hình sau bằng tổng hai hình trước đó',
    C_NON_LINEAR_QTY: 'số lượng thay đổi theo quy luật phức tạp (+2, -1, ...)',
    T_GRID_MOVE: 'di chuyển trong các ô theo một hướng nhất định',
    C_CENTER_MIRROR_X: 'di chuyển lên và xuống trong một cột',
    T_ROTATE: (opts) => `xoay ${Math.abs(opts.angle)} độ ${opts.angle > 0 ? 'sang phải (theo chiều kim đồng hồ)' : 'sang trái (ngược chiều kim đồng hồ)'} ở mỗi bước`,
    T_FLIP: (opts) => `lật ngược hình ${opts.direction === 'horizontal' ? 'theo chiều ngang' : 'theo chiều dọc'}`,
    T_SCALE: 'thay đổi kích thước (to - nhỏ - to)',
    CT_MOVE_AND_ROTATE: 'vừa di chuyển trong các ô, vừa xoay theo một hướng',
    CT_ROTATE_AND_SCALE: 'vừa xoay, vừa thay đổi kích thước',
    CT_SEQUENCE_AND_MOVE: 'một chuỗi các hình khác nhau lần lượt di chuyển trong các ô',
    C_MATRIX_LOGIC_2X2: (opts) => `Hàng trên là ${opts.row1}, hàng dưới là ${opts.row2}. Cột trái là ${opts.col1}, cột phải là ${opts.col2}.`
};

const generateVisualPatternExplanation = (ruleType: VisualPatternRuleType, options?: any): string => {
    const template = VIETNAMESE_PATTERN_TEMPLATES[ruleType];
    let explanationText: string;
    if (typeof template === 'function') {
        explanationText = template(options || {});
    } else {
        explanationText = template || "một quy luật đặc biệt";
    }

    if (ruleType === 'C_MATRIX_LOGIC_2X2') {
         return `Vì quy luật là: ${explanationText}`;
    }

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
    usedIconsInRound: Set<ShapeType>,
    difficulty: DifficultyLevel
): VisualPatternQuestion | null => {
    let numUniqueEmojis = 0;
    let displayLength = 0;
    let patternTemplate: string[] = [];

    switch (ruleType) {
        case 'M_ABAB': numUniqueEmojis = 2; displayLength = 3; patternTemplate = ['A','B','A','B']; break;
        case 'M_AABB': numUniqueEmojis = 2; displayLength = 3; patternTemplate = ['A','A','B','B']; break;
        case 'M_ABC':  numUniqueEmojis = 3; displayLength = 2; patternTemplate = ['A','B','C']; break;
        case 'M_AAB':  numUniqueEmojis = 2; displayLength = 4; patternTemplate = ['A','A','B']; break;
        case 'M_ABB':  numUniqueEmojis = 2; displayLength = 4; patternTemplate = ['A','B','B']; break;
        case 'M_ABBA': numUniqueEmojis = 2; displayLength = 3; patternTemplate = ['A','B','B','A']; break;
        case 'C_ABAC': numUniqueEmojis = 3; displayLength = 3; patternTemplate = ['A','B','A','C']; break;
        case 'C_ABCBA': numUniqueEmojis = 3; displayLength = 4; patternTemplate = ['A','B','C','B','A']; break;
        case 'C_AABCC': numUniqueEmojis = 3; displayLength = 4; patternTemplate = ['A','A','B','C','C']; break;
        case 'C_ABCD': numUniqueEmojis = 4; displayLength = 3; patternTemplate = ['A','B','C','D']; break;
        case 'C_INTERLEAVING_PROGRESSION': {
             const anchorIcon = getCandidateIcons(iconPool, usedIconsInRound, undefined, 1)[0];
             if (!anchorIcon) return null;
             const progressionIcons = getCandidateIcons(iconPool, usedIconsInRound, new Set([anchorIcon]), 4);
             if (progressionIcons.length < 4) return null;

             const fullPattern: string[] = progressionIcons.map(pIcon => anchorIcon + pIcon);
             const displayedSequence = fullPattern.slice(0, 2).map(item => ({ emoji: item }));
             const correctAnswer = { emoji: fullPattern[2] };

             const distractorIcons = getCandidateIcons(iconPool, usedIconsInRound, new Set([anchorIcon, ...progressionIcons]), 3);
             if (distractorIcons.length < 3) return null;
             
             const distractorDisplays = distractorIcons.map(dIcon => ({ emoji: anchorIcon + dIcon }));
             const options = generateVisualPatternOptions(correctAnswer, distractorDisplays);

             usedIconsInRound.add(anchorIcon);
             progressionIcons.forEach(i => usedIconsInRound.add(i));

             return {
                 id: generateId(), type: 'visual_pattern', mode: GameMode.VISUAL_PATTERN, difficulty,
                 ruleType, displayedSequence, options, promptText: "Hình nào tiếp theo trong dãy?", 
                 explanation: generateVisualPatternExplanation(ruleType),
                 correctAnswerEmoji: typeof correctAnswer.emoji === 'string' ? correctAnswer.emoji : undefined
             };
        }
        default: return null;
    }

    if (iconPool.length < numUniqueEmojis) return null;

    let baseEmojis = getCandidateIcons(iconPool, usedIconsInRound, undefined, numUniqueEmojis);
    baseEmojis = [...new Set(baseEmojis)];
    if (baseEmojis.length < numUniqueEmojis) return null;

    const emojiMap: Record<string, string> = {};
    const chars = ['A', 'B', 'C', 'D'];
    for(let i=0; i<numUniqueEmojis; i++) {
        emojiMap[chars[i]] = baseEmojis[i];
    }
    
    const fullPattern: string[] = [];
    for(let i=0; i< (displayLength + 5); i++) {
        fullPattern.push(emojiMap[patternTemplate[i % patternTemplate.length]]);
    }

    const displayedSequence = fullPattern.slice(0, displayLength);
    const correctAnswer = fullPattern[displayLength];

    let distractorIcons = getCandidateIcons(iconPool, usedIconsInRound, new Set(baseEmojis), 5)
        .filter(i => i !== correctAnswer);
    
    distractorIcons = [...new Set(distractorIcons)];
    if (distractorIcons.length < 3) return null;

    const finalDistractors = distractorIcons.slice(0, 3);
    const options = generateVisualPatternOptions(correctAnswer, finalDistractors);
    
    baseEmojis.forEach(e => usedIconsInRound.add(e));
    const explanation = generateVisualPatternExplanation(ruleType);

    return {
        id: generateId(), type: 'visual_pattern', mode: GameMode.VISUAL_PATTERN, difficulty,
        ruleType, displayedSequence, options, promptText: "Hình nào tiếp theo trong dãy?", explanation,
        correctAnswerEmoji: correctAnswer
    };
};

const generateMissingMiddlePattern = (
    difficulty: DifficultyLevel,
    iconPool: ShapeType[],
    usedIconsInRound: Set<ShapeType>
): VisualPatternQuestion | null => {
    const isMam = difficulty === DifficultyLevel.PRE_SCHOOL_MAM;
    const baseRuleOptions = isMam
        ? ['M_ABAB', 'M_AABB', 'M_ABC']
        : ['C_ABAC', 'C_ABCD', 'C_ABCBA'];

    const baseRule = shuffleArray(baseRuleOptions)[0] as VisualPatternRuleType;

    let numUniqueEmojis = 0;
    let patternTemplate: string[] = [];
    let sequenceLength = isMam ? 4 : 5;

    switch (baseRule) {
        case 'M_ABAB': numUniqueEmojis = 2; patternTemplate = ['A', 'B']; break;
        case 'M_AABB': numUniqueEmojis = 2; patternTemplate = ['A', 'A', 'B', 'B']; break;
        case 'M_ABC': numUniqueEmojis = 3; patternTemplate = ['A', 'B', 'C']; break;
        case 'C_ABAC': numUniqueEmojis = 3; patternTemplate = ['A', 'B', 'A', 'C']; break;
        case 'C_ABCD': numUniqueEmojis = 4; patternTemplate = ['A', 'B', 'C', 'D']; break;
        case 'C_ABCBA': numUniqueEmojis = 3; patternTemplate = ['A', 'B', 'C', 'B', 'A']; break;
        default: return null;
    }
    
    if (iconPool.length < numUniqueEmojis) return null;
    const baseEmojis = getCandidateIcons(iconPool, usedIconsInRound, undefined, numUniqueEmojis);
    if (baseEmojis.length < numUniqueEmojis) return null;

    const emojiMap: Record<string, string> = {};
    const chars = ['A', 'B', 'C', 'D'];
    for(let i=0; i<numUniqueEmojis; i++) {
        emojiMap[chars[i]] = baseEmojis[i];
    }

    const fullPattern: VisualContent[] = [];
    for(let i=0; i < sequenceLength; i++) {
        fullPattern.push(emojiMap[patternTemplate[i % patternTemplate.length]]);
    }

    const blankIndex = Math.floor(Math.random() * (sequenceLength - 2)) + 1; // Index 1 to sequenceLength-2
    const correctAnswer = fullPattern[blankIndex];

    const displayedSequence: (PatternDisplayStep | null)[] = [...fullPattern];
    displayedSequence[blankIndex] = null;
    
    let distractorIcons = getCandidateIcons(iconPool, usedIconsInRound, new Set(baseEmojis), 5)
        .filter(i => i !== correctAnswer);
    distractorIcons = [...new Set(distractorIcons)];
    if (distractorIcons.length < 3) return null;

    const finalDistractors = distractorIcons.slice(0, 3);
    const options = generateVisualPatternOptions(correctAnswer, finalDistractors);
    baseEmojis.forEach(e => usedIconsInRound.add(e));
    
    const ruleType = isMam ? 'M_MISSING_MIDDLE' : 'C_MISSING_MIDDLE';

    return {
        id: generateId(), type: 'visual_pattern', mode: GameMode.VISUAL_PATTERN, difficulty,
        ruleType, displayedSequence, options,
        promptText: "Tìm hình còn thiếu trong dãy:",
        explanation: generateVisualPatternExplanation(ruleType),
    };
};


// Sub-generator for quantity-based rules
const generateQuantityPattern = (
    ruleType: VisualPatternRuleType,
    iconPool: ShapeType[],
    usedIconsInRound: Set<ShapeType>,
    difficulty: DifficultyLevel
): VisualPatternQuestion | null => {
    let explanationOptions: any = {};
    let displayedSequence: PatternDisplayStep[] = [];
    let correctAnswer: PatternDisplayStep;
    let distractorDisplays: PatternDisplayStep[] = [];

    if (ruleType === 'C_INTERLEAVING_QTY') {
        const icons = getCandidateIcons(iconPool, usedIconsInRound, undefined, 2);
        if (icons.length < 2) return null;
        const [iconA, iconB] = icons;

        const qtyA = 1;
        const startQtyB = Math.floor(Math.random() * 2) + 1; // Start B at 1 or 2
        const stepB = 1;
        
        const fullSequence: PatternDisplayStep[] = [];
        for (let i = 0; i < 5; i++) {
            fullSequence.push(Array(qtyA).fill(iconA).join(''));
            fullSequence.push(Array(startQtyB + i * stepB).fill(iconB).join(''));
        }
        
        const displayLength = 3; // e.g., 1A, 1B, 1A
        displayedSequence = fullSequence.slice(0, displayLength);
        correctAnswer = fullSequence[displayLength]; // e.g., 2B

        const correctQtyB = startQtyB + Math.floor(displayLength / 2) * stepB;
        distractorDisplays = [
            Array(correctQtyB + 1).fill(iconB).join(''), // Wrong quantity B
            Array(qtyA).fill(iconB).join(''), // Wrong icon
            Array(correctQtyB).fill(iconA).join(''), // Correct quantity, wrong icon
        ];
        explanationOptions = {};
        usedIconsInRound.add(iconA);
        usedIconsInRound.add(iconB);
    } else {
        const baseIcon = getCandidateIcons(iconPool, usedIconsInRound, undefined, 1)[0];
        if (!baseIcon) return null;
        
        let sequenceNumbers: number[] = [];
        switch(ruleType) {
            case 'C_PROGRESSIVE_QTY':
                const step = shuffleArray([1, 2, -1])[0];
                const start = step > 0 ? (Math.floor(Math.random() * 3) + 1) : (Math.floor(Math.random() * 3) + 4);
                sequenceNumbers = [start, start + step, start + (2 * step), start + (3 * step), start + (4*step)];
                explanationOptions = { step };
                break;
            case 'C_DOUBLING_QTY':
                const startNum = Math.floor(Math.random() * 2) + 1; // 1 or 2
                sequenceNumbers = [startNum, startNum * 2, startNum * 4, startNum * 8];
                explanationOptions = {};
                break;
            case 'C_FIBONACCI_QTY':
                sequenceNumbers = [1, 1, 2, 3, 5];
                explanationOptions = {};
                break;
            case 'C_NON_LINEAR_QTY':
                const startQty = Math.floor(Math.random() * 2) + 1; // 1 or 2
                const pattern = [2, -1];
                sequenceNumbers = [startQty];
                for(let i=0; i<4; i++) {
                    const nextNum = sequenceNumbers[i] + pattern[i%2];
                    if (nextNum <= 0) { // Avoid non-positive numbers
                        sequenceNumbers = []; // Force regeneration
                        break;
                    }
                    sequenceNumbers.push(nextNum);
                }
                if(sequenceNumbers.length < 5) return null; // Failed to generate valid sequence
                explanationOptions = {};
                break;
            default: return null;
        }
        
        sequenceNumbers = sequenceNumbers.filter(n => n > 0);
        if (sequenceNumbers.length < 4) return null;

        const displayLength = 3;
        displayedSequence = sequenceNumbers.slice(0, displayLength).map(n => Array(n).fill(baseIcon).join(''));
        const correctNumber = sequenceNumbers[displayLength];
        correctAnswer = Array(correctNumber).fill(baseIcon).join('');

        const distractorNumbers = [
            correctNumber + 1,
            correctNumber - 1,
            sequenceNumbers[displayLength - 1],
        ].filter(n => n > 0 && n !== correctNumber);
        
        distractorDisplays = Array.from(new Set(distractorNumbers)).slice(0, 3).map(n => Array(n).fill(baseIcon).join(''));
        usedIconsInRound.add(baseIcon);
    }
    
    if (distractorDisplays.length < 3) return null;

    const options = generateVisualPatternOptions(correctAnswer, distractorDisplays);
    const explanation = generateVisualPatternExplanation(ruleType, explanationOptions);

    return {
        id: generateId(), type: 'visual_pattern', mode: GameMode.VISUAL_PATTERN, difficulty,
        ruleType, displayedSequence, options, promptText: "Hình nào tiếp theo?", explanation,
        correctAnswerEmoji: typeof correctAnswer === 'string' ? correctAnswer : undefined,
    };
}

// Sub-generator for transformation-based rules
const generateTransformPattern = (
    ruleType: VisualPatternRuleType,
    iconPool: ShapeType[],
    usedIconsInRound: Set<ShapeType>,
    difficulty: DifficultyLevel
): VisualPatternQuestion | null => {
    let question: VisualPatternQuestion | null = null;
    let explanationOptions: any = {};
    
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

        const distractorPositions = path.filter(p => p.row !== correctPosition.row || p.col !== correctPosition.col);
        const distractorDisplays: PatternDisplayStep[] = distractorPositions.map(pos => ({
            gridSize, element: icon, position: pos
        }));

        const options = generateVisualPatternOptions(correctAnswerDisplay, distractorDisplays);
        usedIconsInRound.add(icon);
        const explanation = generateVisualPatternExplanation(ruleType, {});

        question = {
            id: generateId(), type: 'visual_pattern', mode: GameMode.VISUAL_PATTERN, difficulty,
            ruleType, displayedSequence, options, promptText: "Tiếp theo, hình sẽ ở đâu?", explanation,
        };
    } else if (ruleType === 'C_CENTER_MIRROR_X') {
        const icon = getCandidateIcons(iconPool, usedIconsInRound, undefined, 1)[0];
        if (!icon) return null;
        
        const gridSize = { rows: 2, cols: 1 };
        const path = [{ row: 0, col: 0 }, { row: 1, col: 0 }];

        const displayLength = 3;
        const fullSequence: PatternDisplayStep[] = Array.from({length: 5}, (_, i) => ({
            gridSize, element: icon, position: path[i % 2]
        }));
        
        const displayedSequence = fullSequence.slice(0, displayLength);
        const correctAnswerDisplay = fullSequence[displayLength];
        
        const distractorDisplay = fullSequence[displayLength + 1]; 
        
        const otherIcons = getCandidateIcons(iconPool, usedIconsInRound, new Set([icon]), 2);
        if(otherIcons.length < 2) return null;

        if (typeof correctAnswerDisplay !== 'object' || !('gridSize' in correctAnswerDisplay) || typeof distractorDisplay !== 'object' || !('gridSize' in distractorDisplay)) {
            return null;
        }
        
        const distractorDisplays: PatternDisplayStep[] = [
            distractorDisplay,
            { gridSize: correctAnswerDisplay.gridSize, position: correctAnswerDisplay.position, element: otherIcons[0]},
            { gridSize: distractorDisplay.gridSize, position: distractorDisplay.position, element: otherIcons[1]}
        ];

        const options = generateVisualPatternOptions(correctAnswerDisplay, distractorDisplays);
        usedIconsInRound.add(icon);
        const explanation = generateVisualPatternExplanation(ruleType, {});

        question = {
            id: generateId(), type: 'visual_pattern', mode: GameMode.VISUAL_PATTERN, difficulty,
            ruleType, displayedSequence, options, promptText: "Tiếp theo, hình sẽ ở đâu?", explanation,
        };
    } else if (ruleType === 'T_ROTATE') {
        const icon = shuffleArray(ROTATION_CANDIDATE_ICONS)[0];
        const angle = shuffleArray([90, -90])[0];
        const rotations = [0, angle, angle * 2, angle * 3, angle * 4];
        const displayLength = 3;

        const displayedSequence: PatternDisplayStep[] = rotations.slice(0, displayLength).map(r => ({ emoji: icon, rotation: r }));
        const correctAnswerDisplay: VisualContent = { emoji: icon, rotation: rotations[displayLength] };
        
        const distractorDisplays: VisualContent[] = shuffleArray([0, 90, 180, 270, -90, -180, -270])
            .filter(r => r !== rotations[displayLength])
            .slice(0, 3)
            .map(r => ({ emoji: icon, rotation: r }));
        if (distractorDisplays.length < 3) return null;

        const options = generateVisualPatternOptions(correctAnswerDisplay, distractorDisplays);
        const explanation = generateVisualPatternExplanation(ruleType, { angle });
        
        question = {
            id: generateId(), type: 'visual_pattern', mode: GameMode.VISUAL_PATTERN, difficulty,
            ruleType, displayedSequence, options, promptText: "Hình nào tiếp theo trong dãy?", explanation,
        };
    } else if (ruleType === 'T_FLIP') {
        const icon = shuffleArray(FLIP_CANDIDATE_ICONS)[0];
        const direction = shuffleArray<'horizontal' | 'vertical'>(['horizontal', 'vertical'])[0];
        
        const normal: VisualContent = { emoji: icon };
        const flipped: VisualContent = { emoji: icon, [direction === 'horizontal' ? 'flipHorizontal' : 'flipVertical']: true };

        const sequence = [normal, flipped, normal, flipped];
        const displayLength = 3;
        const displayedSequence = sequence.slice(0, displayLength);
        const correctAnswerDisplay = sequence[displayLength];

        const distractorDisplays: VisualContent[] = [
            normal,
            { emoji: icon, rotation: 180 },
            { emoji: shuffleArray(FLIP_CANDIDATE_ICONS.filter(i => i !== icon))[0] }
        ];
        
        const options = generateVisualPatternOptions(correctAnswerDisplay, distractorDisplays);
        const explanation = generateVisualPatternExplanation(ruleType, { direction });
        
        question = {
            id: generateId(), type: 'visual_pattern', mode: GameMode.VISUAL_PATTERN, difficulty,
            ruleType, displayedSequence, options, promptText: "Hình nào tiếp theo trong dãy?", explanation,
        };
    } else if (ruleType === 'T_SCALE' || ruleType === 'M_SIZE_PATTERN') {
        const icon = shuffleArray(SCALE_CANDIDATE_ICONS)[0];
        const big: VisualContent = { emoji: icon, scale: 1.0 };
        const small: VisualContent = { emoji: icon, scale: 0.6 };
        
        const sequence = [big, small, big, small];
        const displayLength = 3;
        const displayedSequence = sequence.slice(0, displayLength);
        const correctAnswerDisplay = sequence[displayLength];

        const distractorDisplays: VisualContent[] = [
            big,
            { emoji: icon, scale: 0.8 },
            { emoji: shuffleArray(SCALE_CANDIDATE_ICONS.filter(i => i !== icon))[0] }
        ];

        const options = generateVisualPatternOptions(correctAnswerDisplay, distractorDisplays);
        const explanation = generateVisualPatternExplanation(ruleType, {});

        question = {
            id: generateId(), type: 'visual_pattern', mode: GameMode.VISUAL_PATTERN, difficulty,
            ruleType, displayedSequence, options, promptText: "Hình nào tiếp theo trong dãy?", explanation,
        };
    }

    return question;
}

// Sub-generator for combined transformation rules
const generateCombinedTransformPattern = (
    ruleType: VisualPatternRuleType,
    iconPool: ShapeType[],
    usedIconsInRound: Set<ShapeType>,
    difficulty: DifficultyLevel
): VisualPatternQuestion | null => {
    let explanationOptions: any = {};
    
    if (ruleType === 'CT_ROTATE_AND_SCALE') {
        const icon = shuffleArray(ROTATION_CANDIDATE_ICONS.filter(i => SCALE_CANDIDATE_ICONS.includes(i)))[0];
        if (!icon) return null;
        
        const angle = shuffleArray([90, -90])[0];
        const bigScale = 1.0;
        const smallScale = 0.6;
        
        const sequence: VisualContent[] = [
            { emoji: icon, rotation: 0, scale: bigScale },
            { emoji: icon, rotation: angle, scale: smallScale },
            { emoji: icon, rotation: angle * 2, scale: bigScale },
            { emoji: icon, rotation: angle * 3, scale: smallScale },
        ];
        const displayLength = 3;
        const displayedSequence = sequence.slice(0, displayLength);
        const correctAnswerDisplay = sequence[displayLength];

        if (typeof correctAnswerDisplay !== 'object' || !('emoji' in correctAnswerDisplay) || !('rotation' in correctAnswerDisplay) || !('scale' in correctAnswerDisplay)) {
            return null; // Guard against non-object types
        }
        
        const distractorDisplays: VisualContent[] = [
            { emoji: correctAnswerDisplay.emoji, rotation: correctAnswerDisplay.rotation, scale: bigScale}, // Correct rot, wrong scale
            { emoji: correctAnswerDisplay.emoji, rotation: angle * 2, scale: correctAnswerDisplay.scale}, // Wrong rot, correct scale
            {emoji: shuffleArray(ROTATION_CANDIDATE_ICONS)[0], rotation: angle*3, scale: smallScale} // Wrong icon
        ];

        const options = generateVisualPatternOptions(correctAnswerDisplay, distractorDisplays);
        return {
             id: generateId(), type: 'visual_pattern', mode: GameMode.VISUAL_PATTERN, difficulty,
            ruleType, displayedSequence, options, promptText: "Hình nào tiếp theo trong dãy?", explanation: generateVisualPatternExplanation(ruleType, {})
        }
    }

    const gridSize = { rows: 2, cols: 2 };
    const path = shuffleArray([
        { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 1 }, { row: 1, col: 0 }
    ]);
    const displayLength = 3;

    let displayedSequence: PatternDisplayStep[] = [];
    let correctAnswerDisplay: PatternDisplayStep;
    let distractorDisplays: PatternDisplayStep[] = [];
    
    if (ruleType === 'CT_MOVE_AND_ROTATE') {
        const icon = shuffleArray(ROTATION_CANDIDATE_ICONS)[0];
        const angle = shuffleArray([90, -90])[0];
        const rotations = [0, angle, angle * 2, angle * 3, angle * 4];

        const fullSequence: PatternDisplayStep[] = path.map((pos, i) => ({
            gridSize,
            element: { emoji: icon, rotation: rotations[i] },
            position: pos
        }));

        displayedSequence = fullSequence.slice(0, displayLength);
        correctAnswerDisplay = fullSequence[displayLength];
        
        if (typeof correctAnswerDisplay === 'object' && 'gridSize' in correctAnswerDisplay && typeof correctAnswerDisplay.element === 'object' && 'rotation' in correctAnswerDisplay.element) {
            const correctRot = correctAnswerDisplay.element.rotation;
        
            distractorDisplays = [
                { gridSize: correctAnswerDisplay.gridSize, position: correctAnswerDisplay.position, element: { emoji: icon, rotation: correctRot ? correctRot + angle : angle } }, // Correct pos, wrong rot
                { gridSize: correctAnswerDisplay.gridSize, position: path[0], element: correctAnswerDisplay.element }, // Wrong pos, correct rot
                { gridSize: correctAnswerDisplay.gridSize, position: path[1], element: { emoji: icon, rotation: rotations[0] } } // Wrong pos, wrong rot
            ];
        } else {
             return null; // Should be unreachable
        }
        
        explanationOptions = {};
        usedIconsInRound.add(icon);

    } else if (ruleType === 'CT_SEQUENCE_AND_MOVE') {
        const numUniqueEmojis = 4;
        const baseEmojis = getCandidateIcons(iconPool, usedIconsInRound, undefined, numUniqueEmojis);
        if (baseEmojis.length < numUniqueEmojis) return null;

        const fullSequence: PatternDisplayStep[] = path.map((pos, i) => ({
            gridSize,
            element: baseEmojis[i],
            position: pos
        }));

        displayedSequence = fullSequence.slice(0, displayLength -1); // Show only 2 for ABCD sequence
        correctAnswerDisplay = fullSequence[displayLength-1];

        if (typeof correctAnswerDisplay === 'object' && 'gridSize' in correctAnswerDisplay && typeof correctAnswerDisplay.element === 'string') {
            distractorDisplays = [
                { gridSize: correctAnswerDisplay.gridSize, position: correctAnswerDisplay.position, element: baseEmojis[0] }, // Correct pos, wrong icon
                { gridSize: correctAnswerDisplay.gridSize, position: path[0], element: correctAnswerDisplay.element }, // Wrong pos, correct icon
                { gridSize: correctAnswerDisplay.gridSize, position: path[1], element: baseEmojis[1] } // Wrong pos, wrong icon
            ];
        } else {
             return null; // Should be unreachable
        }
       
        explanationOptions = {};
        baseEmojis.forEach(e => usedIconsInRound.add(e));
    } else {
        return null;
    }

    if (distractorDisplays.length < 3) return null;

    const options = generateVisualPatternOptions(correctAnswerDisplay, distractorDisplays);
    const explanation = generateVisualPatternExplanation(ruleType, explanationOptions);
    const prompt = ruleType === 'CT_SEQUENCE_AND_MOVE' ? "Hình nào và ở đâu tiếp theo?" : "Tiếp theo, hình sẽ ở đâu?";

    return {
        id: generateId(), type: 'visual_pattern', mode: GameMode.VISUAL_PATTERN, difficulty,
        ruleType, displayedSequence, options, promptText: prompt, explanation
    };
};

const generateColorOrCategoryPattern = (
    ruleType: 'M_COLOR_PATTERN' | 'M_CATEGORY_ALTERNATE',
    usedIconsInRound: Set<ShapeType>,
    difficulty: DifficultyLevel
): VisualPatternQuestion | null => {
    const availableIcons = shuffleArray(ICON_DATA.filter(icon => !usedIconsInRound.has(icon.emoji)));
    let icon1: IconData | undefined;
    let icon2: IconData | undefined;

    if (ruleType === 'M_COLOR_PATTERN') {
        type AttributeColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'brown' | 'black' | 'white' | 'gray' | 'multi_color';
        const colors = shuffleArray<AttributeColor>(['red', 'blue', 'green', 'yellow', 'purple', 'orange']);
        if(colors.length < 2) return null;
        const color1 = colors[0];
        const color2 = colors[1];
        
        icon1 = availableIcons.find(icon => icon.attributes.color?.includes(color1));
        icon2 = availableIcons.find(icon => icon.attributes.color?.includes(color2) && icon.primaryCategory !== icon1?.primaryCategory);

    } else { // M_CATEGORY_ALTERNATE
        const categories = shuffleArray(['animal', 'vehicle', 'plant', 'food', 'clothing']);
        if(categories.length < 2) return null;
        const cat1 = categories[0];
        const cat2 = categories[1];

        icon1 = availableIcons.find(icon => icon.primaryCategory === cat1);
        icon2 = availableIcons.find(icon => icon.primaryCategory === cat2);
    }
    
    if (!icon1 || !icon2) return null;

    const displayedSequence = [icon1.emoji, icon2.emoji, icon1.emoji];
    const correctAnswer = icon2.emoji;

    // Generate distractors
    const distractorPool = availableIcons.filter(icon => icon.emoji !== icon1!.emoji && icon.emoji !== icon2!.emoji);
    if (distractorPool.length < 3) return null;

    let distractors = distractorPool.slice(0, 3).map(i => i.emoji);
    if (!distractors.includes(icon1.emoji)) {
        distractors[distractors.length - 1] = icon1.emoji; // Always include the first icon as a common distractor
    }
    distractors = [...new Set(distractors)]; // Ensure unique distractors
    if(distractors.length < 3) return null;


    const options = generateVisualPatternOptions(correctAnswer, shuffleArray(distractors));
    usedIconsInRound.add(icon1.emoji);
    usedIconsInRound.add(icon2.emoji);

    return {
        id: generateId(),
        type: 'visual_pattern', mode: GameMode.VISUAL_PATTERN, difficulty, ruleType,
        displayedSequence, options,
        promptText: "Hình nào tiếp theo trong dãy?",
        explanation: generateVisualPatternExplanation(ruleType),
        correctAnswerEmoji: correctAnswer,
    };
};

const generateMatrixLogicPattern = (
    usedIconsInRound: Set<ShapeType>,
    difficulty: DifficultyLevel
): VisualPatternQuestion | null => {
    type AttributeColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'brown' | 'black' | 'white' | 'gray' | 'multi_color';
    const availableIcons = shuffleArray(ICON_DATA.filter(icon => !usedIconsInRound.has(icon.emoji)));
    const categories = shuffleArray(['animal', 'vehicle', 'plant', 'food', 'shape_color']);
    const colors = shuffleArray<AttributeColor>(['red', 'yellow', 'blue', 'green']);

    if(categories.length < 2 || colors.length < 2) return null;

    const rowCat1 = categories[0];
    const rowCat2 = categories[1];
    const colColor1 = colors[0];
    const colColor2 = colors[1];

    const findIcon = (cat: string, col: AttributeColor, exclusions: string[] = []) => 
        availableIcons.find(i => 
            i.primaryCategory === cat && 
            i.attributes.color?.includes(col) &&
            !exclusions.includes(i.emoji)
        );

    const topLeft = findIcon(rowCat1, colColor1);
    if (!topLeft) return null;
    const topRight = findIcon(rowCat1, colColor2, [topLeft.emoji]);
    if (!topRight) return null;
    const bottomLeft = findIcon(rowCat2, colColor1, [topLeft.emoji, topRight.emoji]);
    if (!bottomLeft) return null;
    const correctAnswerIcon = findIcon(rowCat2, colColor2, [topLeft.emoji, topRight.emoji, bottomLeft.emoji]);
    if (!correctAnswerIcon) return null;

    const displayedSequence = [topLeft.emoji, topRight.emoji, bottomLeft.emoji];
    const correctAnswer = correctAnswerIcon.emoji;

    // Distractors
    const distractor1 = findIcon(rowCat2, colColor1, [topLeft.emoji, topRight.emoji, bottomLeft.emoji, correctAnswerIcon.emoji]); // correct category, wrong color
    const distractor2 = findIcon(rowCat1, colColor2, [topLeft.emoji, topRight.emoji, bottomLeft.emoji, correctAnswerIcon.emoji, distractor1?.emoji || '']); // wrong category, correct color
    const distractor3Pool = availableIcons.filter(i => 
        ![topLeft.emoji, topRight.emoji, bottomLeft.emoji, correctAnswerIcon.emoji, distractor1?.emoji, distractor2?.emoji].includes(i.emoji)
    );
    const distractor3 = distractor3Pool[0];

    if(!distractor1 || !distractor2 || !distractor3) return null; // Need 3 distractors

    const distractorDisplays = [distractor1.emoji, distractor2.emoji, distractor3.emoji];
    const options = generateVisualPatternOptions(correctAnswer, distractorDisplays);

    usedIconsInRound.add(topLeft.emoji);
    usedIconsInRound.add(topRight.emoji);
    usedIconsInRound.add(bottomLeft.emoji);
    usedIconsInRound.add(correctAnswerIcon.emoji);

    const explanationOptions = {
        row1: getVietnameseName(rowCat1),
        row2: getVietnameseName(rowCat2),
        col1: getVietnameseName(colColor1),
        col2: getVietnameseName(colColor2),
    };

    return {
        id: generateId(),
        type: 'visual_pattern', mode: GameMode.VISUAL_PATTERN, difficulty,
        ruleType: 'C_MATRIX_LOGIC_2X2',
        displayedSequence, options,
        promptText: "Tìm hình còn thiếu trong ô trống:",
        explanation: generateVisualPatternExplanation('C_MATRIX_LOGIC_2X2', explanationOptions),
        correctAnswerEmoji: correctAnswer,
    };
};

// MAIN Visual Pattern Generator
export const generateVisualPatternQuestion = (
    difficulty: DifficultyLevel,
    existingSignatures: Set<string>,
    baseUnlockedIcons: ShapeType[],
    globallyRecentIcons: ShapeType[],
    iconsUsedInCurrentGenerationCycle: Set<ShapeType>,
    usedIconsThisModeCycle: Set<ShapeType>,
    forcedRuleType: VisualPatternRuleType // This function now requires a specific rule to be passed
): VisualPatternQuestion | null => {

    const prioritizedIconPool = getPrioritizedIconPool(baseUnlockedIcons, globallyRecentIcons);
    if (prioritizedIconPool.length < 4) return null;

    let generatedQuestion: VisualPatternQuestion | null = null;
    let attempts = 0;
    const MAX_ATTEMPTS = 20;

    while (!generatedQuestion && attempts < MAX_ATTEMPTS) {
        attempts++;

        if (forcedRuleType === 'M_COLOR_PATTERN' || forcedRuleType === 'M_CATEGORY_ALTERNATE') {
            generatedQuestion = generateColorOrCategoryPattern(forcedRuleType, iconsUsedInCurrentGenerationCycle, difficulty);
        } else if (forcedRuleType === 'C_MATRIX_LOGIC_2X2') {
             generatedQuestion = generateMatrixLogicPattern(iconsUsedInCurrentGenerationCycle, difficulty);
        } else if (['M_MISSING_MIDDLE', 'C_MISSING_MIDDLE'].includes(forcedRuleType)) {
            generatedQuestion = generateMissingMiddlePattern(difficulty, prioritizedIconPool, iconsUsedInCurrentGenerationCycle);
        } else if (['M_ABAB', 'M_AABB', 'M_ABC', 'M_AAB', 'M_ABB', 'M_ABBA', 'C_ABAC', 'C_AABCC', 'C_ABCD', 'C_ABCBA', 'C_INTERLEAVING_PROGRESSION'].includes(forcedRuleType)) {
             generatedQuestion = generateSimpleSequencePattern(forcedRuleType, prioritizedIconPool, iconsUsedInCurrentGenerationCycle, difficulty);
        } else if (['C_PROGRESSIVE_QTY', 'C_DOUBLING_QTY', 'C_INTERLEAVING_QTY', 'C_FIBONACCI_QTY', 'C_NON_LINEAR_QTY'].includes(forcedRuleType)) {
            generatedQuestion = generateQuantityPattern(forcedRuleType, prioritizedIconPool, iconsUsedInCurrentGenerationCycle, difficulty);
        } else if (['T_GRID_MOVE', 'T_ROTATE', 'T_FLIP', 'T_SCALE', 'C_CENTER_MIRROR_X', 'M_SIZE_PATTERN'].includes(forcedRuleType)) {
            generatedQuestion = generateTransformPattern(forcedRuleType, prioritizedIconPool, iconsUsedInCurrentGenerationCycle, difficulty);
        } else if (['CT_MOVE_AND_ROTATE', 'CT_SEQUENCE_AND_MOVE', 'CT_ROTATE_AND_SCALE'].includes(forcedRuleType)) {
            generatedQuestion = generateCombinedTransformPattern(forcedRuleType, prioritizedIconPool, iconsUsedInCurrentGenerationCycle, difficulty);
        }

        if (generatedQuestion) {
            const signature = `vp-${difficulty}-${generatedQuestion.ruleType}-${JSON.stringify(generatedQuestion.displayedSequence)}-${JSON.stringify(generatedQuestion.options.map(o=>o.display).sort())}`;
            if (usedVisualPatternSignaturesThisSession.has(signature)) {
                generatedQuestion = null; // Found a duplicate, try again
            } else {
                usedVisualPatternSignaturesThisSession.add(signature);
            }
        }
    }
    
    return generatedQuestion;
};
