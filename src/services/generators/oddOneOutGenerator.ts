import { DifficultyLevel, OddOneOutQuestion, ShapeType, GameMode, OddOneOutOption, IconData } from '../../../types';
import { generateId, getVietnameseName, shuffleArray } from '../questionUtils';
import { ICON_DATA } from '../../data/iconData';


export type OddOneOutRuleType = 
    | 'primaryCategory'
    | 'subCategory'
    | 'tertiaryCategory'
    | 'environment'
    | 'can_fly'
    | 'is_edible'
    | 'propulsion'
    | 'is_real'
    | 'diet'
    | 'color';

interface OddOneOutRuleDef {
    level: 'MAM' | 'CHOI' | 'BOTH';
    explanation: (commonValue: string, oddValue: string, oddName: string) => string;
    numOptions?: number;
}

export const ODD_ONE_OUT_RULE_DEFINITIONS: Record<OddOneOutRuleType, OddOneOutRuleDef> = {
    color: {
        level: 'BOTH',
        explanation: (commonValue, oddValue, oddName) => `${oddName} có màu ${getVietnameseName(oddValue)}, còn lại đều có màu ${getVietnameseName(commonValue)}.`,
    },
    primaryCategory: {
        level: 'BOTH',
        explanation: (commonValue, oddValue, oddName) => `${oddName} thuộc nhóm ${getVietnameseName(oddValue)}, còn lại thuộc nhóm ${getVietnameseName(commonValue)}.`,
    },
    subCategory: {
        level: 'CHOI',
        explanation: (commonValue, oddValue, oddName) => `${oddName} là ${getVietnameseName(oddValue)}, còn lại đều là ${getVietnameseName(commonValue)}.`,
    },
    tertiaryCategory: {
        level: 'CHOI',
        explanation: (commonValue, oddValue, oddName) => `${oddName} là ${getVietnameseName(oddValue)}, còn lại là ${getVietnameseName(commonValue)}.`,
    },
    environment: {
        level: 'BOTH',
        explanation: (commonValue, oddValue, oddName) => `${oddName} sống/hoạt động ở ${getVietnameseName(oddValue)}, còn lại ở ${getVietnameseName(commonValue)}.`,
    },
    can_fly: {
        level: 'BOTH',
        explanation: (commonValue, oddValue, oddName) => `${oddName} ${oddValue === 'true' ? 'biết bay' : 'không biết bay'}, còn lại thì ngược lại.`,
    },
    is_edible: {
        level: 'BOTH',
        explanation: (commonValue, oddValue, oddName) => `${oddName} ${oddValue === 'true' ? 'ăn được' : 'không ăn được'}, còn lại thì ngược lại.`,
    },
    propulsion: {
        level: 'CHOI',
        explanation: (commonValue, oddValue, oddName) => `${oddName} di chuyển trên ${getVietnameseName(oddValue)}, còn lại di chuyển trên ${getVietnameseName(commonValue)}.`,
    },
    is_real: {
        level: 'CHOI',
        explanation: (commonValue, oddValue, oddName) => `${oddName} ${oddValue === 'true' ? 'có thật' : 'không có thật'}, còn lại thì có thật.`,
    },
    diet: {
        level: 'CHOI',
        explanation: (commonValue, oddValue, oddName) => `${oddName} ăn ${getVietnameseName(oddValue)}, còn lại ăn ${getVietnameseName(commonValue)}.`
    }
};

export const generateOddOneOutQuestion = (
    difficulty: DifficultyLevel,
    existingSignatures: Set<string>,
    ruleType: OddOneOutRuleType,
    usedIconsInRound: Set<ShapeType>
): OddOneOutQuestion | null => {
    const ruleDef = ODD_ONE_OUT_RULE_DEFINITIONS[ruleType];
    const numOptions = ruleDef.numOptions || 4;
    const isMamLevel = difficulty === DifficultyLevel.PRE_SCHOOL_MAM;

    if (isMamLevel && ruleDef.level === 'CHOI') return null;
    if (!isMamLevel && ruleDef.level === 'MAM') return null;

    // Special handler for color rule
    if (ruleType === 'color') {
        type AttributeColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'brown' | 'black' | 'white' | 'gray' | 'multi_color';
        const availableColors = shuffleArray<AttributeColor>(['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'black', 'white', 'brown']);
        let colorAttempts = 0;
        const MAX_COLOR_ATTEMPTS = 20;

        while (colorAttempts < MAX_COLOR_ATTEMPTS) {
            colorAttempts++;
            const commonColor = availableColors[colorAttempts % availableColors.length];
            
            const commonItemsPool = shuffleArray(ICON_DATA.filter(i => i.attributes.color?.includes(commonColor) && !usedIconsInRound.has(i.emoji)));
            const oddItemsPool = shuffleArray(ICON_DATA.filter(i => !i.attributes.color?.includes(commonColor) && !usedIconsInRound.has(i.emoji)));

            if (commonItemsPool.length >= numOptions - 1 && oddItemsPool.length >= 1) {
                const commonItems = commonItemsPool.slice(0, numOptions - 1);
                const oddItem = oddItemsPool[0];
                const questionIconsData = [oddItem, ...commonItems];

                const signature = `ooo-color-${questionIconsData.map(d => d.emoji).sort().join('')}`;
                if (existingSignatures.has(signature)) continue;

                const options: OddOneOutOption[] = shuffleArray(questionIconsData).map(data => ({ id: generateId(), emoji: data.emoji }));
                const correctAnswer = options.find(opt => opt.emoji === oddItem.emoji);
                if (!correctAnswer) continue;
                
                const oddValueKey = oddItem.attributes.color?.[0];
                if (!oddValueKey) continue;

                const explanation = ruleDef.explanation(commonColor, oddValueKey, oddItem.name);

                questionIconsData.forEach(icon => usedIconsInRound.add(icon.emoji));
                existingSignatures.add(signature);
                
                return {
                    id: generateId(), type: 'odd_one_out', mode: GameMode.ODD_ONE_OUT, difficulty, options,
                    correctAnswerId: correctAnswer.id,
                    promptText: "Tìm vật khác biệt với những vật còn lại:",
                    explanation
                };
            }
        }
        return null; // Could not generate a color question in given attempts
    }


    // Logic for all other rules
    let attempts = 0;
    const MAX_ATTEMPTS = 50;
    while (attempts < MAX_ATTEMPTS) {
        attempts++;
        const shuffledData = shuffleArray(ICON_DATA);
        
        const oddIconData = shuffledData.find(iconData => {
            const value = ruleType === 'primaryCategory' ? iconData.primaryCategory : iconData.attributes[ruleType as keyof typeof iconData.attributes];
            return value !== undefined && !usedIconsInRound.has(iconData.emoji);
        });
        if (!oddIconData) continue;

        const oddValueUntyped = ruleType === 'primaryCategory' ? oddIconData.primaryCategory : oddIconData.attributes[ruleType as keyof typeof oddIconData.attributes];
        if (oddValueUntyped === undefined) continue;
        const oddValue = String(oddValueUntyped);


        const commonItemsPool = shuffledData.filter(iconData => {
            if (iconData.emoji === oddIconData.emoji) return false;
            
            const commonValueCandidateUntyped = ruleType === 'primaryCategory' ? iconData.primaryCategory : iconData.attributes[ruleType as keyof typeof iconData.attributes];
            if (commonValueCandidateUntyped === undefined || String(commonValueCandidateUntyped) === oddValue) return false;
            
            if (['subCategory', 'tertiaryCategory'].includes(ruleType) && iconData.primaryCategory !== oddIconData.primaryCategory) {
                 return false;
            }
            if (Object.keys(oddIconData.attributes).includes(ruleType) && iconData.primaryCategory !== oddIconData.primaryCategory) {
                if(Math.random() > 0.3) return false;
            }

            return true;
        });
        
        if (commonItemsPool.length < numOptions - 1) continue;

        const firstCommonValueUntyped = ruleType === 'primaryCategory' ? commonItemsPool[0].primaryCategory : commonItemsPool[0].attributes[ruleType as keyof typeof commonItemsPool[0].attributes];
        if (firstCommonValueUntyped === undefined) continue;
        const firstCommonValue = String(firstCommonValueUntyped);


        const finalCommonItems = commonItemsPool
            .filter(item => String((ruleType === 'primaryCategory' ? item.primaryCategory : item.attributes[ruleType as keyof typeof item.attributes])) === firstCommonValue)
            .filter(item => !usedIconsInRound.has(item.emoji));

        if (finalCommonItems.length < numOptions - 1) continue;

        const selectedCommonItems = finalCommonItems.slice(0, numOptions - 1);
        const questionIconsData = [oddIconData, ...selectedCommonItems];

        const signature = `ooo-${ruleType}-${[...questionIconsData].map(d => d.emoji).sort().join('')}`;
        if (existingSignatures.has(signature)) continue;

        const options: OddOneOutOption[] = shuffleArray(questionIconsData).map(data => ({
            id: generateId(),
            emoji: data.emoji,
        }));

        const correctAnswer = options.find(opt => opt.emoji === oddIconData.emoji);
        if (!correctAnswer) continue; 
        
        const explanation = ruleDef.explanation(firstCommonValue, oddValue, oddIconData.name);

        questionIconsData.forEach(icon => usedIconsInRound.add(icon.emoji));
        existingSignatures.add(signature);
        
        return {
            id: generateId(),
            type: 'odd_one_out',
            mode: GameMode.ODD_ONE_OUT,
            difficulty,
            options,
            correctAnswerId: correctAnswer.id,
            promptText: "Tìm vật khác biệt với những vật còn lại:",
            explanation
        };
    }
    return null;
}
