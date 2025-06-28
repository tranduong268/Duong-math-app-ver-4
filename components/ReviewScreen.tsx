import React from 'react';
import { StoredSession, Question, MathQuestion, ComparisonQuestion, CountingQuestion, NumberRecognitionQuestion, MatchingPairsQuestion, GameMode, NumberRecognitionOption, ShapeType, NumberSequenceQuestion, VisualPatternQuestion, VisualPatternOption, OddOneOutQuestion, OddOneOutOption, PatternDisplayStep, VisualContent } from '../types'; 
import { COMPARISON_ICON, COUNTING_ICON, NUMBER_RECOGNITION_ICON, MATCHING_PAIRS_ICON, NUMBER_SEQUENCE_ICONS, VISUAL_PATTERN_ICON } from '../constants';

// Helper component to render a single visual element with transformations (for Review)
const VisualContentDisplayReview: React.FC<{ content: VisualContent }> = ({ content }) => {
    const fontSize = 'text-3xl';
    if (typeof content === 'string') {
        return <span className={fontSize}>{content}</span>;
    }
    const style: React.CSSProperties = {
        transform: [ `rotate(${content.rotation || 0}deg)`, `scale(${content.scale || 1})`, content.flipHorizontal ? 'scaleX(-1)' : '' ].join(' ').trim(),
        display: 'inline-block',
    };
    return <span className={fontSize} style={style}>{content.emoji}</span>;
};

// Helper component to render one step of a visual pattern (for Review)
const PatternStepDisplayReview: React.FC<{ step: PatternDisplayStep }> = ({ step }) => {
    if (typeof step === 'object' && 'gridSize' in step) {
        const gridStyle: React.CSSProperties = {
            display: 'inline-grid', gridTemplateRows: `repeat(${step.gridSize.rows}, 1fr)`, gridTemplateColumns: `repeat(${step.gridSize.cols}, 1fr)`,
            width: '60px', height: '60px', border: '1px dashed #d1d5db', borderRadius: '4px', padding: '2px',
        };
        const elementStyle: React.CSSProperties = { gridRowStart: step.position.row + 1, gridColumnStart: step.position.col + 1, placeSelf: 'center' };
        return (<div style={gridStyle}><div style={elementStyle}><VisualContentDisplayReview content={step.element} /></div></div>);
    }
    return <VisualContentDisplayReview content={step as VisualContent} />;
};


interface ReviewScreenProps {
  sessions: StoredSession[];
  onBackToMenu: () => void;
}

const getModeIcon = (mode: GameMode): string => {
  switch (mode) {
    case GameMode.ADDITION: return '➕';
    case GameMode.SUBTRACTION: return '➖';
    case GameMode.COMPARISON: return COMPARISON_ICON;
    case GameMode.COUNTING: return COUNTING_ICON;
    case GameMode.NUMBER_RECOGNITION: return NUMBER_RECOGNITION_ICON;
    case GameMode.MATCHING_PAIRS: return MATCHING_PAIRS_ICON;
    case GameMode.NUMBER_SEQUENCE: return NUMBER_SEQUENCE_ICONS[0]; 
    case GameMode.VISUAL_PATTERN: return VISUAL_PATTERN_ICON;
    case GameMode.ODD_ONE_OUT: return '🔍';
    default: return '❓';
  }
};

const renderOptionDisplay = (display: ShapeType[] | string, isLarge: boolean = false): JSX.Element | string => {
  const sizeClass = isLarge ? "text-xl md:text-2xl lg:text-3xl" : "text-lg md:text-xl lg:text-2xl"; 
  if (Array.isArray(display)) {
    return <span className={`${sizeClass} p-0.5`}>{display.join(' ')}</span>;
  }
  return <span className={sizeClass}>{display}</span>;
};

const ReviewedQuestionItem: React.FC<{ question: Question }> = ({ question }) => {
  if (question.type === 'math') {
    const q = question as MathQuestion;
    const numClasses = "text-3xl md:text-4xl lg:text-5xl font-bold text-indigo-600";
    const operatorClasses = "text-2xl md:text-3xl lg:text-4xl font-semibold text-pink-500";
    const unknownText = "?";

    const operand1Display = q.unknownSlot === 'operand1' ? unknownText : q.operand1True;
    const operand2Display = q.unknownSlot === 'operand2' ? unknownText : q.operand2True;
    const resultDisplay = q.unknownSlot === 'result' ? unknownText : q.resultTrue;
    
    return (
      <div className="flex items-center justify-center space-x-2 md:space-x-3 lg:space-x-4 my-2">
        <span className={numClasses}>{operand1Display}</span>
        <span className={operatorClasses}>{q.operator}</span>
        <span className={numClasses}>{operand2Display}</span>
        <span className={operatorClasses}>=</span>
        <span className={numClasses}>{resultDisplay}</span>
      </div>
    );
  }
  if (question.type === 'comparison') {
    const q = question as ComparisonQuestion;
    return (
      <div className="flex items-center justify-center space-x-1 md:space-x-2 lg:space-x-3 my-2">
        <span className="text-3xl md:text-4xl lg:text-5xl font-bold text-indigo-600">{q.number1}</span>
        <div 
          className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 border-2 border-dashed border-gray-400 rounded-md flex items-center justify-center text-2xl md:text-3xl lg:text-4xl font-bold text-purple-500"
        >
          _
        </div>
        <span className="text-3xl md:text-4xl lg:text-5xl font-bold text-indigo-600">{q.number2}</span>
      </div>
    );
  }
  if (question.type === 'counting') {
    const q = question as CountingQuestion;
    return (
      <div className="text-center my-2">
        <p className="text-md md:text-lg lg:text-xl font-medium text-gray-700 mb-2">{q.promptText}</p>
        <div className="mb-2 flex flex-wrap justify-center items-center max-w-sm md:max-w-md mx-auto p-1 bg-gray-100 rounded-md">
          {q.shapes.map((emoji, index) => (
            <span key={index} className="text-3xl md:text-4xl lg:text-5xl p-0.5 select-none">
              {emoji}
            </span>
          ))}
        </div>
      </div>
    );
  }
  if (question.type === 'number_recognition') {
    const q = question as NumberRecognitionQuestion;
    return (
      <div className="text-center my-2">
        <p className="text-md md:text-lg lg:text-xl font-medium text-gray-700 mb-2">{q.promptText}</p>
        {q.variant === 'items-to-number' && q.targetItems && (
           <div className="mb-2 flex flex-wrap justify-center items-center max-w-sm md:max-w-md mx-auto p-1 bg-gray-100 rounded-md">
             {q.targetItems.map((item, index) => (
               <span key={index} className="text-3xl md:text-4xl lg:text-5xl p-0.5 select-none">{item}</span>
             ))}
           </div>
        )}
      </div>
    );
  }
  if (question.type === 'matching_pairs') {
    const q = question as MatchingPairsQuestion;
    const digitItems = q.items.filter(item => item.visualType === 'digit').map(i => i.display).join(', ');
    const visualItems = q.items.filter(item => item.visualType !== 'digit').map(i => i.display.length > 5 ? i.display.substring(0,5)+'...' : i.display).join('; ');
    return (
      <div className="text-center my-2">
        <p className="text-md md:text-lg lg:text-xl font-medium text-gray-700 mb-2">{q.promptText}</p>
        <p className="text-sm text-gray-500">Số: [{digitItems}]</p>
        <p className="text-sm text-gray-500">Hình: [{visualItems}]</p>
        <p className="text-xs text-gray-400">(Xem chi tiết các cặp đúng ở phần đáp án)</p>
      </div>
    );
  }
  if (question.type === 'number_sequence') {
    const q = question as NumberSequenceQuestion;
    return (
      <div className="text-center my-2">
        <p className="text-md md:text-lg lg:text-xl font-medium text-gray-700 mb-2">{q.promptText}</p>
        <div className="flex flex-wrap items-center justify-center gap-x-1 sm:gap-x-2">
            {q.sequence.map((part, index) => (
                part === null 
                    ? <span key={`blank-${index}`} className="text-3xl sm:text-4xl font-bold text-gray-400 p-1">_</span>
                    : <span key={`num-${index}`} className="text-3xl sm:text-4xl font-bold text-indigo-600 p-1">{part}</span>
            ))}
        </div>
      </div>
    );
  }
  if (question.type === 'visual_pattern') {
    const q = question as VisualPatternQuestion;
    return (
      <div className="text-center my-2">
        <p className="text-md md:text-lg lg:text-xl font-medium text-gray-700 mb-2">{q.promptText}</p>
        <div className="mb-2 flex flex-wrap justify-center items-center gap-2 max-w-sm md:max-w-md mx-auto p-1 bg-gray-100 rounded-md">
          {q.displayedSequence.map((step, index) => (
            <PatternStepDisplayReview key={index} step={step} />
          ))}
           <span className="text-3xl md:text-4xl p-0.5 text-pink-500 font-bold select-none self-center">?</span>
        </div>
      </div>
    );
  }
  if (question.type === 'odd_one_out') {
    const q = question as OddOneOutQuestion;
    return (
      <div className="text-center my-2">
        <p className="text-md md:text-lg lg:text-xl font-medium text-gray-700 mb-2">{q.promptText}</p>
        <div className="mb-2 flex flex-wrap justify-center items-center max-w-sm md:max-w-md mx-auto p-1 bg-gray-100 rounded-md gap-2">
          {q.options.map((option) => (
            <span key={option.id} className="text-3xl md:text-4xl p-0.5 select-none">
              {option.emoji}
            </span>
          ))}
        </div>
      </div>
    );
  }
  return <p className="text-gray-600">Câu hỏi không xác định.</p>;
};

const CorrectAnswerDisplay: React.FC<{ question: Question }> = ({ question }) => {
  const answerStyle = "font-bold text-green-700 text-lg md:text-xl lg:text-2xl"; 
  if (question.type === 'math' || question.type === 'counting' || question.type === 'comparison') {
    return <strong className={answerStyle}>{(question as MathQuestion | CountingQuestion | ComparisonQuestion).answer}</strong>;
  }
  if (question.type === 'number_recognition') {
    const q = question as NumberRecognitionQuestion;
    const correctOption = q.options.find(opt => opt.isCorrect);
    if (correctOption) {
      return <strong className="font-bold text-green-700">{renderOptionDisplay(correctOption.display, true)}</strong>;
    }
    return <span className="text-gray-500">Không tìm thấy đáp án</span>;
  }
  if (question.type === 'matching_pairs') {
    const q = question as MatchingPairsQuestion;
    const pairs: { item1: string, item2: string }[] = [];
    const processedMatchIds = new Set<string>();

    q.items.forEach(item1 => {
        if (!processedMatchIds.has(item1.matchId)) {
            const item2 = q.items.find(i => i.matchId === item1.matchId && i.id !== item1.id);
            if (item2) {
                const digit = item1.visualType === 'digit' ? item1 : item2;
                const visual = item1.visualType !== 'digit' ? item1 : item2;
                pairs.push({item1: digit.display, item2: visual.display.length > 10 ? visual.display.substring(0,10)+'...' : visual.display});
                processedMatchIds.add(item1.matchId);
            }
        }
    });

    return (
        <div className="text-sm text-green-700">
            {pairs.map((p, i) => (
                <div key={i} className={`${answerStyle} flex items-center justify-center gap-x-2`}>
                    <span>{p.item1}</span> <span className="text-gray-500">&harr;</span> <span>{p.item2}</span>
                </div>
            ))}
            {pairs.length === 0 && <span className={answerStyle}>(Không có cặp nào)</span>}
        </div>
    );
  }
  if (question.type === 'number_sequence') {
    const q = question as NumberSequenceQuestion;
    return <strong className={answerStyle}>{q.answers.join(', ')}</strong>;
  }
  if (question.type === 'visual_pattern') {
    const q = question as VisualPatternQuestion;
    const correctOption = q.options.find(opt => opt.isCorrect);
    if (correctOption) {
      return (
        <div className="flex flex-col items-center text-center">
          <div className="p-2 bg-green-100 rounded-md inline-block">
            <PatternStepDisplayReview step={correctOption.display} />
          </div>
          {q.explanation && (
            <p className="text-xs md:text-sm font-normal text-gray-600 mt-1">
              ({q.explanation})
            </p>
          )}
        </div>
      );
    }
    // Fallback for older data structure
    if(q.correctAnswerEmoji) {
        return <strong className={`${answerStyle} text-4xl`}>{q.correctAnswerEmoji}</strong>;
    }
    return <span className="text-gray-500">Không tìm thấy đáp án</span>;
  }
  if (question.type === 'odd_one_out') {
    const q = question as OddOneOutQuestion;
    const correctOption = q.options.find(opt => opt.id === q.correctAnswerId);
    if (correctOption) {
      return (
        <div className="flex flex-col items-center text-center">
            <strong className={`${answerStyle} text-4xl`}>{correctOption.emoji}</strong>
            {q.explanation && (
                <p className="text-xs md:text-sm font-normal text-gray-600 mt-1">
                    ({q.explanation})
                </p>
            )}
        </div>
      );
    }
    return <span className="text-gray-500">Không tìm thấy đáp án</span>;
  }
  return <span className="text-gray-500">N/A</span>;
};


export const ReviewScreen: React.FC<ReviewScreenProps> = ({ sessions, onBackToMenu }) => {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString('vi-VN')} lúc ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getUserAnswerDisplay = (question: Question, userAnswer: string | string[]): JSX.Element | string => {
    const answerStyle = "text-lg md:text-xl lg:text-2xl"; 
    if (question.type === 'number_recognition') {
        const nrQ = question as NumberRecognitionQuestion;
        const selectedOpt = nrQ.options.find(opt => opt.id === userAnswer);
        if (selectedOpt) return renderOptionDisplay(selectedOpt.display, true);
    }
    if (question.type === 'visual_pattern') {
        const vpQ = question as VisualPatternQuestion;
        const selectedOpt = vpQ.options.find(opt => opt.id === userAnswer);
        if (selectedOpt) return <div className="p-2 bg-red-100 rounded-md inline-block"><PatternStepDisplayReview step={selectedOpt.display} /></div>;
    }
    if (question.type === 'odd_one_out') {
        const oooQ = question as OddOneOutQuestion;
        const selectedOpt = oooQ.options.find(opt => opt.id === userAnswer);
        if (selectedOpt) return <span className={`${answerStyle} text-4xl`}>{selectedOpt.emoji}</span>;
    }
    if (question.type === 'comparison' || question.type === 'math' || question.type === 'counting') {
        return <span className={answerStyle}>{userAnswer}</span>;
    }
    if (question.type === 'matching_pairs') {
        return <span className={`${answerStyle} text-gray-500`}>(Không hoàn thành đúng)</span>;
    }
    if (question.type === 'number_sequence') {
        if (Array.isArray(userAnswer)) {
            return <span className={answerStyle}>{userAnswer.join(', ')}</span>;
        }
    }
    return <span className={answerStyle}>{userAnswer.toString()}</span>;
  }

  if (sessions.length === 0) {
    return (
      <div className="w-full max-w-lg mx-auto"> 
        <div className="flex justify-between items-center mb-3 md:mb-4 px-1 sm:px-0">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-green-700">Xem Lại Lỗi Sai</h2>
          <button 
            onClick={onBackToMenu}
            className="bg-white text-pink-500 px-4 py-2 rounded-lg shadow hover:bg-pink-100 transition-colors font-medium text-sm md:text-base"
            aria-label="Về Menu Chính"
          >
            Về Menu
          </button>
        </div>
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-xl text-center">
          <p className="text-gray-600 text-lg md:text-xl">Chưa có lỗi sai nào được ghi lại. Bé giỏi quá! 🎉</p>
          <button 
            onClick={onBackToMenu}
            className="mt-6 bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-6 md:py-3 md:px-8 rounded-lg shadow transition-transform transform hover:scale-105 text-base md:text-lg"
          >
            Tuyệt! Về Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto"> 
      <div className="flex justify-between items-center mb-3 md:mb-4 lg:mb-6 px-1 sm:px-0">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-green-700">Xem Lại Lỗi Sai</h2>
        <button 
          onClick={onBackToMenu}
          className="bg-white text-pink-500 px-4 py-2 rounded-lg shadow hover:bg-pink-100 transition-colors font-medium text-sm md:text-base"
          aria-label="Về Menu Chính"
        >
          Về Menu
        </button>
      </div>

      <div className="bg-gradient-to-br from-green-100 via-teal-100 to-cyan-100 p-3 md:p-4 lg:p-6 rounded-xl shadow-2xl space-y-4 md:space-y-6">
        {sessions.map((session) => {
          let previousMode: GameMode | null = null; 
          return (
            <div key={session.id} className="p-3 md:p-4 bg-white/80 backdrop-blur-sm rounded-lg shadow-lg">
              <h3 className="text-lg md:text-xl font-semibold text-gray-800 border-b border-gray-300 pb-2 mb-3">
                Lượt chơi: {formatDate(session.timestamp)} - Điểm: <strong className="font-bold text-blue-600">{session.score}</strong>/{session.totalQuestions}
                {session.difficulty && <span className="text-sm md:text-base text-gray-600 ml-2">({session.difficulty})</span>}
              </h3>
              {session.incorrectAttempts.length > 0 ? (
                <div className="space-y-3 md:space-y-4">
                  {session.incorrectAttempts.map((attempt, index) => {
                    const showModeTitle = attempt.question.mode !== previousMode;
                    previousMode = attempt.question.mode;

                    return (
                      <div key={index} className={`p-2 md:p-3 bg-sky-50 rounded-md shadow-sm border border-sky-200 ${showModeTitle ? 'mt-3' : 'mt-1'}`}>
                        {showModeTitle && (
                          <p className="text-md md:text-lg font-semibold text-sky-800 mb-2 pb-1 border-b border-sky-200">
                            <span className="text-xl md:text-2xl mr-2">{getModeIcon(attempt.question.mode)}</span>
                            {attempt.question.mode}
                          </p>
                        )}
                        
                        <ReviewedQuestionItem question={attempt.question} />

                        <div className="mt-2 text-base md:text-lg lg:text-xl space-y-1">
                            <p className="flex items-start sm:items-center">
                                <span className="mr-2 text-gray-700 shrink-0">Bé trả lời:</span>
                                <span className={`font-semibold text-red-600 ${
                                    (attempt.question.type !== 'comparison' && attempt.question.type !== 'math' && attempt.question.type !== 'counting' && attempt.question.type !== 'number_sequence' && attempt.question.type !== 'visual_pattern' && attempt.question.type !== 'odd_one_out') 
                                    ? '' : 'line-through' 
                                  }`}>
                                  {getUserAnswerDisplay(attempt.question, attempt.userAnswer)}
                                </span>
                                <span className="ml-2 text-red-500 text-lg md:text-xl shrink-0">❌</span> 
                            </p>
                            <p className="flex items-start sm:items-center">
                                <span className="mr-2 text-gray-700 shrink-0">Đáp án đúng:</span>
                                <CorrectAnswerDisplay question={attempt.question} />
                                <span className="ml-2 text-green-600 text-lg md:text-xl shrink-0">✅</span> 
                            </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-green-600 p-2 text-center text-base md:text-lg">Chúc mừng! Bé không có lỗi sai nào trong lượt chơi này! ✨</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Removed the default export