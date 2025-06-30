
import React, { useState, useEffect, useRef } from 'react';
import { Question, MathQuestion, ComparisonQuestion, CountingQuestion, NumberRecognitionQuestion, MatchingPairsQuestion, MatchableItem, NumberRecognitionOption, ShapeType, NumberSequenceQuestion, VisualPatternQuestion, VisualPatternOption, OddOneOutQuestion, OddOneOutOption, PatternDisplayStep, VisualContent } from '../types';
import { useAudio } from '../src/contexts/AudioContext';

// Helper component to render a single visual element with transformations
const VisualContentDisplay: React.FC<{ content: VisualContent, isMatrix?: boolean }> = ({ content, isMatrix }) => {
    const sizeClass = isMatrix ? 'text-4xl md:text-5xl' : 'text-4xl md:text-5xl lg:text-6xl';
    if (typeof content === 'string') {
        return <span className={sizeClass}>{content}</span>;
    }

    const style: React.CSSProperties = {
        transform: [
            `rotate(${content.rotation || 0}deg)`,
            `scale(${content.scale || 1})`,
            content.flipHorizontal ? 'scaleX(-1)' : '',
        ].join(' ').trim(),
        display: 'inline-block', // Necessary for transform to work properly
        transition: 'transform 0.3s ease-in-out',
    };

    return <span className={sizeClass} style={style}>{content.emoji}</span>;
};


// Helper component to render one step of a visual pattern
const PatternStepDisplay: React.FC<{ step: PatternDisplayStep, isOption?: boolean, isMatrix?: boolean }> = ({ step, isOption, isMatrix }) => {
    // If it's a grid-based step
    if (typeof step === 'object' && 'gridSize' in step) {
        const gridStyle: React.CSSProperties = {
            display: 'grid',
            gridTemplateRows: `repeat(${step.gridSize.rows}, 1fr)`,
            gridTemplateColumns: `repeat(${step.gridSize.cols}, 1fr)`,
            width: isOption ? '100px' : '120px',
            height: isOption ? '100px' : '120px',
            border: '2px dashed #cbd5e1', // a light gray dash
            borderRadius: '8px',
            padding: '4px',
            position: 'relative', // For background grid lines
        };
        const elementStyle: React.CSSProperties = {
            gridRowStart: step.position.row + 1,
            gridColumnStart: step.position.col + 1,
            placeSelf: 'center',
        };

        return (
            <div style={gridStyle}>
                <div style={elementStyle}>
                    <VisualContentDisplay content={step.element} />
                </div>
            </div>
        );
    }
    
    // If it's a simple or transformed content (not in a grid)
    return <VisualContentDisplay content={step as VisualContent} isMatrix={isMatrix} />;
};


interface QuestionDisplayProps {
  question: Question; 
  onAnswer: (answer: string | number | string[]) => void; 
  disabled: boolean;
  lastAnswer?: string | number | string[]; 
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({ question, onAnswer, disabled, lastAnswer }) => {
  const { playSound } = useAudio();
  const [inputValue, setInputValue] = useState('');
  const [sequenceInputValues, setSequenceInputValues] = useState<string[]>([]);
  const [displayOperator, setDisplayOperator] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sequenceInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const matchingPairCardRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const mainMatchingPairContainerRef = useRef<HTMLDivElement>(null);
  const [lineRenderTrigger, setLineRenderTrigger] = useState(0); 

  useEffect(() => {
    if (question.id !== inputRef.current?.dataset.questionId && !disabled) {
      setInputValue('');
      setDisplayOperator(null);
    }
    inputRef.current?.setAttribute('data-question-id', question.id);
    sequenceInputRefs.current.forEach(ref => ref?.setAttribute('data-question-id', question.id));


    if (disabled) { 
        if (question.type === 'comparison' && typeof lastAnswer === 'string' && ['<', '>', '='].includes(lastAnswer)) {
            setDisplayOperator(lastAnswer);
        }
        if ((question.type === 'math' || question.type === 'counting') && typeof lastAnswer === 'string' && inputValue !== lastAnswer) {
            setInputValue(String(lastAnswer));
        }
        if (question.type === 'number_sequence' && Array.isArray(lastAnswer)) {
            setSequenceInputValues(lastAnswer);
        }
    }

    if (((question.type === 'math' || question.type === 'counting')) && !disabled) {
        inputRef.current?.focus();
    } else if (question.type === 'number_sequence' && !disabled) {
        const firstEmptyIndex = sequenceInputValues.findIndex(val => val.trim() === '');
        const focusIndex = firstEmptyIndex !== -1 ? firstEmptyIndex : 0;
        if (sequenceInputRefs.current[focusIndex]) {
            sequenceInputRefs.current[focusIndex]?.focus();
        } else if (sequenceInputRefs.current.length > 0) {
            sequenceInputRefs.current[0]?.focus();
        }
    }
    
    if (question.type === 'matching_pairs') {
        const timer = setTimeout(() => {
          setLineRenderTrigger(prev => prev + 1);
        }, 50); 
        return () => clearTimeout(timer);
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question, disabled, lastAnswer]); 

  useEffect(() => {
    if (question.type === 'number_sequence') {
      const numBlanks = (question as NumberSequenceQuestion).sequence.filter(s => s === null).length;
      setSequenceInputValues(Array(numBlanks).fill(''));
      sequenceInputRefs.current = Array(numBlanks).fill(null);
    }
  }, [question.id, question.type]); 

  useEffect(() => {
    const handleResize = () => {
      setLineRenderTrigger(prev => prev + 1);
    };

    if (question.type === 'matching_pairs') {
      window.addEventListener('resize', handleResize);
      handleResize(); 
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
    return undefined; 
  }, [question.type]); 


  const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (disabled) return;
    playSound('BUTTON_CLICK');

    if (question.type === 'math' || question.type === 'counting') {
        if (inputValue.trim() === '') return;
        onAnswer(inputValue);
    } else if (question.type === 'number_sequence') {
        if (sequenceInputValues.some(val => val.trim() === '')) return; 
        onAnswer(sequenceInputValues);
    }
  };

  const handleSequenceInputChange = (index: number, value: string, targetElement: HTMLInputElement) => {
    playSound('TYPE');
    const newValues = [...sequenceInputValues];
    let processedValue = value.replace(/\D/g, ''); 
    
    const maxLength = parseInt(targetElement.getAttribute('maxLength') || '2', 10);
    if (processedValue.length > maxLength) {
      processedValue = processedValue.slice(0, maxLength);
    }
    newValues[index] = processedValue;
    setSequenceInputValues(newValues);

    if (processedValue.length === maxLength && index < sequenceInputRefs.current.length - 1) {
      sequenceInputRefs.current[index + 1]?.focus();
    }
  };

  const handleSequenceInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault(); 
      const allFilled = sequenceInputValues.every(val => val.trim() !== '' && !isNaN(parseInt(val)));
      if (allFilled) {
        handleSubmit();
      }
    } else if (e.key === 'ArrowLeft') {
      if (index > 0) { 
        e.preventDefault();
        sequenceInputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowRight') {
      if (index < sequenceInputRefs.current.length - 1) { 
        e.preventDefault(); 
        sequenceInputRefs.current[index + 1]?.focus();
      }
    }
  };


  const handleOperatorClick = (operator: '<' | '>' | '=') => {
    playSound('BUTTON_CLICK');
    if (disabled) return;
    setDisplayOperator(operator); 
    onAnswer(operator); 
  };

  const handleOptionClick = (optionId: string) => { // Used by Number Recognition, Visual Pattern, Odd One Out
    playSound('BUTTON_CLICK');
    if (disabled) return;
    onAnswer(optionId);
  };
  
  const handleMatchingPairItemClick = (itemId: string) => {
    if (disabled && !(question as MatchingPairsQuestion).items.find(i=>i.id === itemId && i.isSelected && !i.isMatched)) return;
    // Sounds for matching pairs are handled in useGameLogic after evaluation
    onAnswer(itemId);
  };

  const renderMathQuestion = (q: MathQuestion) => {
    const numClasses = "text-5xl md:text-7xl lg:text-8xl font-bold text-indigo-700";
    const operatorClasses = "text-4xl md:text-6xl lg:text-7xl font-semibold text-pink-600";
    const unknownClasses = "text-4xl md:text-6xl lg:text-7xl font-semibold text-pink-600";
    
    const operand1Display = q.unknownSlot === 'operand1' ? '?' : q.operand1True;
    const operand2Display = q.unknownSlot === 'operand2' ? '?' : q.operand2True;
    const resultDisplay = q.unknownSlot === 'result' ? '?' : q.resultTrue;

    return (
      <div className="bg-sky-50 p-3 md:p-4 lg:p-5 rounded-lg shadow-sm">
        <div className="flex items-center justify-center space-x-2 md:space-x-4 lg:space-x-6">
          <span className={q.unknownSlot === 'operand1' ? unknownClasses : numClasses}>{operand1Display}</span>
          <span className={operatorClasses}>{q.operator}</span>
          <span className={q.unknownSlot === 'operand2' ? unknownClasses : numClasses}>{operand2Display}</span>
          <span className={operatorClasses}>=</span>
          <span className={q.unknownSlot === 'result' ? unknownClasses : numClasses}>{resultDisplay}</span>
        </div>
      </div>
    );
  };

  const renderComparisonQuestion = (q: ComparisonQuestion) => (
    <div className="bg-sky-50 p-3 md:p-4 lg:p-5 rounded-lg shadow-sm">
      <div className="flex items-center justify-center space-x-1 md:space-x-2 lg:space-x-4">
        <span className="text-5xl md:text-7xl lg:text-8xl font-bold text-indigo-700">{q.number1}</span>
        <div 
          className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 border border-dashed border-gray-400 rounded-lg flex items-center justify-center text-3xl md:text-4xl lg:text-5xl font-bold text-purple-600"
        >
          {displayOperator || ''}
        </div>
        <span className="text-5xl md:text-7xl lg:text-8xl font-bold text-indigo-700">{q.number2}</span>
      </div>
    </div>
  );

  const renderTargetItemsForCountingLayout = (items: ShapeType[]) => {
    const itemCount = items.length;
    const rows: ShapeType[][] = [];
    let itemFontSizeClass = '';
    
    if (itemCount <= 5) { 
        rows.push(items);
        itemFontSizeClass = 'text-6xl md:text-7xl';
    } else if (itemCount <= 8) { 
        rows.push(items);
        itemFontSizeClass = 'text-4xl md:text-5xl';
    } else if (itemCount <= 12) { 
        const half = Math.ceil(itemCount / 2);
        rows.push(items.slice(0, half));
        rows.push(items.slice(half));
        itemFontSizeClass = 'text-4xl md:text-5xl';
    } else if (itemCount <= 15) { 
        const third = Math.ceil(itemCount / 3);
        rows.push(items.slice(0, third));
        rows.push(items.slice(third, 2 * third));
        rows.push(items.slice(2 * third));
        itemFontSizeClass = 'text-3xl md:text-4xl';
    } else  { 
        const fourth = Math.ceil(itemCount / (itemCount > 18 ? 4 : 3) ); 
        for(let i=0; i < itemCount; i+=fourth) {
            rows.push(items.slice(i, i + fourth));
        }
        itemFontSizeClass = 'text-2xl md:text-3xl';
    }

    return (
        <div className={`mb-4 flex flex-col items-center p-2 md:p-3 bg-sky-100 rounded-lg min-h-[70px] md:min-h-[80px] w-full max-w-lg`}> 
            {rows.map((rowEmojis, rowIndex) => (
                <div key={rowIndex} className={`flex flex-wrap items-center justify-center`}>
                    {rowEmojis.map((item, itemIndex) => (
                        <span key={itemIndex} className={`${itemFontSizeClass} p-1 select-none`}>{item}</span>
                    ))}
                </div>
            ))}
        </div>
    );
  };


  const renderNumberRecognitionQuestion = (q: NumberRecognitionQuestion) => {
    let promptContent: React.ReactNode = q.promptText;
    let promptSizeClass = "text-3xl md:text-4xl lg:text-5xl"; 

    if (q.variant === 'number-to-items' && q.targetNumber !== undefined) {
        const promptParts = q.promptText.split(new RegExp(`(${q.targetNumber}|${q.targetItemIcon})`));
        promptContent = promptParts.map((part, index) => {
            if (part === q.targetNumber?.toString() || part === q.targetItemIcon) {
                return <strong key={index} className="text-blue-600 font-bold">{part}</strong>;
            }
            return part;
        });
    } else if (q.variant === 'items-to-number') {
        promptSizeClass = "text-2xl md:text-3xl lg:text-4xl"; 
    }

    return (
        <div className="flex flex-col items-center w-full">
            <p className={`${promptSizeClass} font-semibold text-gray-700 mb-3 text-center`}>{promptContent}</p>
            {q.variant === 'items-to-number' && q.targetItems && renderTargetItemsForCountingLayout(q.targetItems)}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 lg:gap-5 mt-2 w-full max-w-lg"> 
                {q.options.map((option) => (
                    <button
                        key={option.id}
                        onClick={() => handleOptionClick(option.id)}
                        disabled={disabled}
                        className={`p-5 md:p-6 rounded-lg shadow-md font-semibold transition-all transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed
                            ${disabled && option.isCorrect ? 'bg-green-300 text-green-700 ring-4 ring-green-500' : 
                             disabled && !option.isCorrect && lastAnswer === option.id ? 'bg-red-300 text-red-700 ring-4 ring-red-500' :
                             'bg-sky-200 hover:bg-sky-300 text-sky-700'}
                             min-h-[80px] md:min-h-[100px] flex items-center justify-center break-words whitespace-normal leading-tight`}
                    >
                        {Array.isArray(option.display) ? 
                            (() => {
                                const emojiCount = option.display.length;
                                let contentFontSizeClass = '';
                                if (emojiCount <= 2) contentFontSizeClass = 'text-4xl md:text-5xl';
                                else if (emojiCount <= 4) contentFontSizeClass = 'text-3xl md:text-4xl';
                                else if (emojiCount <= 6) contentFontSizeClass = 'text-2xl md:text-3xl';
                                else if (emojiCount <= 8) contentFontSizeClass = 'text-xl md:text-2xl';
                                else contentFontSizeClass = 'text-lg md:text-xl'; 
                                return (
                                    <span className={`w-full h-full flex flex-wrap justify-center items-center leading-tight ${contentFontSizeClass}`}>
                                        {option.display.map((emoji, idx) => <span key={idx} className="p-0.5">{emoji}</span>)}
                                    </span>
                                );
                            })() : 
                            <span className="text-5xl md:text-6xl lg:text-7xl text-blue-600">{option.display}</span> 
                        }
                    </button>
                ))}
            </div>
        </div>
    );
  };
  
const renderMatchingPairsQuestion = (q: MatchingPairsQuestion) => {
    const linesToDraw: { x1: number, y1: number, x2: number, y2: number, id: string }[] = [];
    
    if (!q || !q.items) {
        return <p>Đang tải cặp ghép...</p>;
    }

    const digitItems = q.items.filter(item => item.visualType === 'digit');
    const visualItems = q.items.filter(item => item.visualType === 'emoji_icon');

    const itemsByMatchId = new Map<string, MatchableItem[]>();
    q.items.forEach(item => {
        if (!itemsByMatchId.has(item.matchId)) {
            itemsByMatchId.set(item.matchId, []);
        }
        itemsByMatchId.get(item.matchId)!.push(item);
    });

    if (mainMatchingPairContainerRef.current) { 
        const containerRect = mainMatchingPairContainerRef.current.getBoundingClientRect();

        itemsByMatchId.forEach((pairItems) => {
            if (pairItems.length === 2 && pairItems.every(item => item.isMatched)) {
                const digitItem = pairItems.find(p => p.visualType === 'digit');
                const iconItem = pairItems.find(p => p.visualType === 'emoji_icon');

                if (digitItem && iconItem) {
                    const digitElement = matchingPairCardRefs.current[digitItem.id];
                    const iconElement = matchingPairCardRefs.current[iconItem.id];

                    if (digitElement && iconElement) {
                        const rectDigit = digitElement.getBoundingClientRect();
                        const rectIcon = iconElement.getBoundingClientRect();
                        
                        const x1 = rectDigit.left + rectDigit.width - containerRect.left; 
                        const y1 = rectDigit.top + rectDigit.height / 2 - containerRect.top; 
                        
                        const x2 = rectIcon.left - containerRect.left; 
                        const y2 = rectIcon.top + rectIcon.height / 2 - containerRect.top; 
                        
                        linesToDraw.push({ id: `${digitItem.id}-${iconItem.id}`, x1, y1, x2, y2 });
                    }
                }
            }
        });
    }
    
    const renderItemButton = (item: MatchableItem) => {
        let contentFontSizeClass: string;
        let buttonSizeClass: string;
        let textColorClass = item.visualType === 'digit' ? 'text-blue-600' : 'text-cyan-800'; 

        const graphemes = Array.from(item.display); 
        const emojiCount = graphemes.length;

        if (item.visualType === 'emoji_icon') {
            buttonSizeClass = 'w-32 h-32 md:w-36 lg:w-40 md:h-36 lg:h-40'; 
            if (emojiCount <= 1) contentFontSizeClass = 'text-5xl md:text-6xl'; 
            else if (emojiCount <= 3) contentFontSizeClass = 'text-3xl md:text-4xl'; 
            else if (emojiCount <= 6) contentFontSizeClass = 'text-2xl md:text-3xl'; 
            else if (emojiCount <= 8) contentFontSizeClass = 'text-xl md:text-2xl'; 
            else contentFontSizeClass = 'text-lg md:text-xl'; 
        } else { 
             buttonSizeClass = 'w-28 h-28 md:w-32 lg:w-36 md:h-32 lg:h-36'; 
             contentFontSizeClass = 'text-5xl md:text-6xl lg:text-7xl'; 
        }

        const renderEmojiIconContent = () => {
            const rows: ShapeType[][] = [];
            if (emojiCount <= 3) { 
                rows.push(graphemes);
            } else if (emojiCount === 4) { 
                rows.push(graphemes.slice(0, 2));
                rows.push(graphemes.slice(2, 4));
            } else if (emojiCount <= 6) { 
                const half = Math.ceil(emojiCount / 2);
                rows.push(graphemes.slice(0, half));
                rows.push(graphemes.slice(half));
            } else { 
                 const third = Math.ceil(emojiCount / 3);
                 rows.push(graphemes.slice(0, third));
                 rows.push(graphemes.slice(third, 2*third));
                 rows.push(graphemes.slice(2*third));
            }

            return (
                <div className={`flex flex-col items-center justify-center w-full h-full ${contentFontSizeClass}`}>
                    {rows.map((rowEmojis, rowIndex) => (
                        <div key={rowIndex} className="flex justify-center items-center mb-0.5 md:mb-1"> 
                            {rowEmojis.map((emojiChar, charIndex) => (
                                <span 
                                  key={charIndex} 
                                  className="p-px text-center"
                                  style={{ lineHeight: 1, overflow: 'hidden' }} 
                                >
                                    {emojiChar}
                                </span>
                            ))}
                        </div>
                    ))}
                </div>
            );
        };
        
        return (
            <button
              key={item.id}
              ref={el => { matchingPairCardRefs.current[item.id] = el; }}
              onClick={() => handleMatchingPairItemClick(item.id)}
              disabled={item.isMatched || (disabled && !item.isSelected)}
              className={`p-px rounded-lg shadow-md font-semibold transition-all duration-150 ease-in-out aspect-square flex flex-col items-center justify-center ${buttonSizeClass} overflow-hidden
                ${item.isMatched ? 'bg-slate-300 text-slate-500 opacity-60 cursor-not-allowed' :
                 item.isSelected ? 'bg-yellow-300 text-yellow-800 ring-4 ring-yellow-500 scale-105' :
                 `bg-cyan-50 hover:bg-cyan-100 ${item.visualType === 'digit' ? '' : textColorClass} transform hover:scale-105` 
                }`}
              aria-pressed={item.isSelected}
              aria-label={`Ghép cặp với ${item.display}`}
            >
              {item.visualType === 'emoji_icon' ? renderEmojiIconContent() : 
                <span className={`${contentFontSizeClass} ${textColorClass} w-full h-full flex flex-wrap justify-center items-center leading-tight text-center p-0.5`}>
                  {item.display}
                </span>
              }
            </button>
        );
    };

    return (
      <div ref={mainMatchingPairContainerRef} className="flex flex-col items-center w-full relative">
        <p className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-700 mb-4 md:mb-6 text-center">{q.promptText}</p>
        <div className="grid grid-cols-2 gap-x-10 sm:gap-x-12 md:gap-x-16 lg:gap-x-20 w-full max-w-lg sm:max-w-xl md:max-w-2xl relative"> 
          <div className="space-y-2 md:space-y-3 lg:space-y-4 flex flex-col items-center relative z-[1] bg-transparent">
            {digitItems.map(item => renderItemButton(item))}
          </div>
          <div className="space-y-2 md:space-y-3 lg:space-y-4 flex flex-col items-center relative z-[1] bg-transparent">
            {visualItems.map(item => renderItemButton(item))}
          </div>
          
          <svg 
            key={`svg-lines-container-${question.id}-${lineRenderTrigger}`}
            className="absolute top-0 left-0 w-full h-full pointer-events-none" 
            style={{ zIndex: 0, minWidth: '100%', minHeight: '100%' }} 
            overflow="visible" 
            aria-hidden="true"
          >
              {linesToDraw.map(line => (
                  <line 
                      key={line.id} 
                      x1={line.x1} y1={line.y1} 
                      x2={line.x2} y2={line.y2} 
                      stroke="rgb(156 163 175)" 
                      strokeWidth="5" 
                      strokeOpacity="0.6"
                      strokeLinecap="round"
                  />
              ))}
          </svg>
        </div>
      </div>
    );
};

const renderNumberSequenceQuestion = (q: NumberSequenceQuestion) => {
    let blankInputIndex = 0;
    const directionIcon = q.direction === 'ascending' ? '📈' : q.direction === 'descending' ? '📉' : '';
    return (
        <div className="flex flex-col items-center w-full">
            <p className="text-xl md:text-2xl lg:text-3xl font-semibold text-gray-700 mb-4 md:mb-6 text-center flex items-center">
                {directionIcon && <span className="mr-2 text-2xl md:text-3xl">{directionIcon}</span>}
                {q.promptText}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-1 sm:gap-x-2 md:gap-x-3">
                {q.sequence.map((part, index) => {
                    if (part === null) {
                        const currentBlankIndex = blankInputIndex++;
                        return (
                            <input
                                key={`blank-${index}-${question.id}`} 
                                ref={el => { sequenceInputRefs.current[currentBlankIndex] = el; }}
                                type="number"
                                value={sequenceInputValues[currentBlankIndex] || ''}
                                onChange={(e) => handleSequenceInputChange(currentBlankIndex, e.target.value, e.target as HTMLInputElement)}
                                onKeyDown={(e) => handleSequenceInputKeyDown(e, currentBlankIndex)}
                                disabled={disabled}
                                className="border-2 border-blue-400 rounded-md p-1 text-2xl sm:text-3xl md:text-4xl w-14 sm:w-16 md:w-20 text-center shadow-inner focus:border-pink-500 focus:ring-pink-500 transition-colors"
                                placeholder="_"
                                pattern="\d*"
                                inputMode="numeric"
                                maxLength={2} 
                            />
                        );
                    }
                    return (
                        <span key={`num-${index}`} className="text-3xl sm:text-4xl md:text-5xl font-bold text-indigo-700 p-2">
                            {part}
                        </span>
                    );
                })}
            </div>
        </div>
    );
};

const renderVisualPatternQuestion = (q: VisualPatternQuestion) => {
    const correctOption = q.options.find(opt => opt.isCorrect);
    const answeredCorrectly = disabled && lastAnswer === correctOption?.id;

    if (q.ruleType === 'C_MATRIX_LOGIC_2X2') {
        return (
            <div className="flex flex-col items-center w-full">
                <p className="text-xl md:text-2xl font-semibold text-gray-700 mb-3 text-center">{q.promptText}</p>
                {/* 2x2 Grid */}
                <div className="grid grid-cols-2 gap-2 p-2 bg-sky-100 rounded-lg w-fit mb-4 shadow-inner">
                    {/* Top Left */}
                    <div className="w-24 h-24 md:w-28 md:h-28 flex items-center justify-center bg-white rounded-md shadow">
                        <PatternStepDisplay step={q.displayedSequence[0]!} isMatrix={true} />
                    </div>
                    {/* Top Right */}
                    <div className="w-24 h-24 md:w-28 md:h-28 flex items-center justify-center bg-white rounded-md shadow">
                        <PatternStepDisplay step={q.displayedSequence[1]!} isMatrix={true} />
                    </div>
                    {/* Bottom Left */}
                    <div className="w-24 h-24 md:w-28 md:h-28 flex items-center justify-center bg-white rounded-md shadow">
                        <PatternStepDisplay step={q.displayedSequence[2]!} isMatrix={true} />
                    </div>
                    {/* Bottom Right (The blank) */}
                    <div className="w-24 h-24 md:w-28 md:h-28 flex items-center justify-center bg-white/70 rounded-md shadow border-2 border-dashed border-pink-400">
                        <span className="text-4xl text-pink-500 font-bold">?</span>
                    </div>
                </div>

                {/* Options Display */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mt-2 w-full max-w-xl">
                    {q.options.map((option) => (
                        <button
                            key={option.id}
                            onClick={() => handleOptionClick(option.id)}
                            disabled={disabled}
                            className={`p-4 rounded-lg shadow-md font-semibold transition-all transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed
                                ${disabled && option.isCorrect ? 'bg-green-300 text-green-700 ring-4 ring-green-500' : 
                                 disabled && !option.isCorrect && lastAnswer === option.id ? 'bg-red-300 text-red-700 ring-4 ring-red-500' :
                                 'bg-sky-200 hover:bg-sky-300 text-sky-700'}
                                 min-h-[90px] md:min-h-[110px] flex items-center justify-center`}
                            aria-label={`Lựa chọn`}
                        >
                            <PatternStepDisplay step={option.display} isOption={true} />
                        </button>
                    ))}
                </div>

                {answeredCorrectly && q.explanation && (
                    <div className="mt-4 w-full text-center max-w-xl">
                        <p className="text-base md:text-lg font-medium text-green-800 bg-green-100 p-3 rounded-lg shadow-inner">
                            {q.explanation}
                        </p>
                    </div>
                )}
            </div>
        );
    }


    return (
        <div className="flex flex-col items-center w-full">
            <p className="text-xl md:text-2xl lg:text-3xl font-semibold text-gray-700 mb-3 text-center">{q.promptText}</p>
            {/* Sequence Display */}
            <div className="mb-4 flex flex-wrap items-center justify-center gap-2 md:gap-3 p-2 bg-sky-100 rounded-lg min-h-[80px] w-full max-w-full overflow-x-auto">
                {q.displayedSequence.map((step, index) => {
                    if (step === null) {
                        return <span key={`blank-${index}`} className="text-4xl md:text-5xl p-1 text-pink-500 font-bold select-none self-center">?</span>;
                    }
                    return <PatternStepDisplay key={index} step={step} />;
                })}
            </div>

            {/* Options Display */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mt-2 w-full max-w-xl">
                {q.options.map((option) => (
                    <button
                        key={option.id}
                        onClick={() => handleOptionClick(option.id)}
                        disabled={disabled}
                        className={`p-4 rounded-lg shadow-md font-semibold transition-all transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed
                            ${disabled && option.isCorrect ? 'bg-green-300 text-green-700 ring-4 ring-green-500' : 
                             disabled && !option.isCorrect && lastAnswer === option.id ? 'bg-red-300 text-red-700 ring-4 ring-red-500' :
                             'bg-sky-200 hover:bg-sky-300 text-sky-700'}
                             min-h-[90px] md:min-h-[110px] flex items-center justify-center`}
                         aria-label={`Lựa chọn`}
                    >
                        <PatternStepDisplay step={option.display} isOption={true} />
                    </button>
                ))}
            </div>

            {answeredCorrectly && q.explanation && (
                 <div className="mt-4 w-full text-center max-w-xl">
                    <p className="text-base md:text-lg font-medium text-green-800 bg-green-100 p-3 rounded-lg shadow-inner">
                        {q.explanation}
                    </p>
                </div>
            )}
        </div>
    );
};

const renderOddOneOutQuestion = (q: OddOneOutQuestion) => {
    const numOptions = q.options.length;
    let gridColsClass = 'grid-cols-2 sm:grid-cols-4'; // Default for 4 options
    if (numOptions === 3) gridColsClass = 'grid-cols-3';
    else if (numOptions === 5) gridColsClass = 'grid-cols-3 sm:grid-cols-5';

    const answeredCorrectly = disabled && lastAnswer === q.correctAnswerId;

    return (
        <div className="flex flex-col items-center w-full">
            <p className="text-xl md:text-2xl lg:text-3xl font-semibold text-gray-700 mb-4 md:mb-6 text-center">{q.promptText}</p>
            <div className={`grid ${gridColsClass} gap-3 md:gap-4 w-full max-w-lg lg:max-w-xl`}>
                {q.options.map((option) => {
                    const isCorrect = option.id === q.correctAnswerId;
                    const wasSelectedIncorrectly = lastAnswer === option.id && !isCorrect;

                    return (
                        <button
                            key={option.id}
                            onClick={() => handleOptionClick(option.id)}
                            disabled={disabled}
                            className={`rounded-lg shadow-md font-semibold transition-all transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed flex flex-col items-center justify-center p-2
                                ${isCorrect && disabled ? 'bg-green-300 text-green-700 ring-4 ring-green-500' : 
                                 wasSelectedIncorrectly && disabled ? 'bg-red-300 text-red-700 ring-4 ring-red-500' :
                                 'bg-indigo-200 hover:bg-indigo-300 text-indigo-700'}
                                 min-h-[90px] md:min-h-[110px]`}
                             aria-label={`Lựa chọn ${option.emoji}`}
                        >
                            <span className="text-4xl md:text-5xl lg:text-6xl flex-grow flex items-center justify-center">{option.emoji}</span>
                        </button>
                    );
                })}
            </div>
            
            {answeredCorrectly && q.explanation && (
                 <div className="mt-4 w-full text-center max-w-lg lg:max-w-xl">
                    <p className="text-base md:text-lg font-medium text-green-800 bg-green-100 p-3 rounded-lg shadow-inner">
                        {q.explanation}
                    </p>
                </div>
            )}
        </div>
    );
};
  
  return (
    <div className={`bg-white p-4 md:p-6 lg:p-8 my-4 rounded-lg shadow-lg text-center min-h-[350px] md:min-h-[420px] lg:min-h-[480px] flex flex-col justify-around items-center ${question.id ? 'animate-pop-scale' : ''}`}>
      <div className="mb-4 w-full">
        {question.type === 'math' && renderMathQuestion(question as MathQuestion)}
        {question.type === 'comparison' && renderComparisonQuestion(question as ComparisonQuestion)}
        {question.type === 'counting' && <p className="text-xl md:text-2xl lg:text-3xl font-semibold text-gray-700 mb-3">{(question as CountingQuestion).promptText}</p>}
        {question.type === 'number_recognition' && renderNumberRecognitionQuestion(question as NumberRecognitionQuestion)}
        {question.type === 'matching_pairs' && renderMatchingPairsQuestion(question as MatchingPairsQuestion)}
        {question.type === 'number_sequence' && renderNumberSequenceQuestion(question as NumberSequenceQuestion)}
        {question.type === 'visual_pattern' && renderVisualPatternQuestion(question as VisualPatternQuestion)}
        {question.type === 'odd_one_out' && renderOddOneOutQuestion(question as OddOneOutQuestion)}
      </div>

      {question.type === 'counting' && (
         renderTargetItemsForCountingLayout((question as CountingQuestion).shapes)
      )}
      
      {(question.type === 'math' || question.type === 'counting' || question.type === 'number_sequence') && (
        <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
          { (question.type === 'math' || question.type === 'counting') &&
            <input
                ref={inputRef}
                type="number"
                value={inputValue}
                onChange={(e) => {
                    playSound('TYPE');
                    setInputValue(e.target.value.replace(/\D/g, ''))
                }}
                disabled={disabled}
                className="border-2 border-blue-400 rounded-md p-2 text-5xl md:text-6xl lg:text-7xl w-1/3 max-w-[200px] text-center shadow-inner focus:border-pink-500 focus:ring-pink-500 transition-colors"
                placeholder="?"
                pattern="\d*"
                inputMode="numeric"
            />
          }
          <button 
            type="submit" 
            disabled={
                disabled || 
                ( (question.type === 'math' || question.type === 'counting') && inputValue.trim() === '') ||
                ( question.type === 'number_sequence' && sequenceInputValues.some(val => val.trim() === ''))
            }
            className="mt-4 md:mt-6 bg-blue-400 hover:bg-blue-500 text-white font-bold py-3 px-10 rounded-lg shadow-md transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-xl"
          >
            OK
          </button>
        </form>
      )}

      {question.type === 'comparison' && (
        <div className="flex justify-center space-x-3 md:space-x-4 lg:space-x-5 mt-4 md:mt-6">
          {(['<', '>', '='] as Array<'<' | '>' | '='>).map((op) => (
            <button
              key={op}
              onClick={() => handleOperatorClick(op)}
              disabled={disabled}
              className={`bg-sky-200 hover:bg-sky-300 text-sky-700 font-bold py-4 px-6 md:py-4 md:px-8 rounded-lg shadow-md text-2xl md:text-3xl lg:text-4xl transition-transform transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed ${displayOperator === op && disabled ? 'ring-4 ring-yellow-300' : ''}`}
            >
              {op}
            </button>
          ))}
        </div>
      )}
      {/* Visual Pattern & Odd One Out options are rendered within their respective render functions */}
    </div>
  );
};

export default QuestionDisplay;
