
export enum GameMode {
  ADDITION = 'PHÉP CỘNG (+)',
  SUBTRACTION = 'PHÉP TRỪ (-)',
  COMPARISON = 'SO SÁNH (<, >, =)',
  COUNTING = 'ĐẾM HÌNH',
  NUMBER_RECOGNITION = 'NHẬN BIẾT SỐ',
  MATCHING_PAIRS = 'TÌM CẶP TƯƠNG ỨNG',
  NUMBER_SEQUENCE = 'HOÀN THIỆN DÃY SỐ',
  VISUAL_PATTERN = 'TÌM QUY LUẬT HÌNH ẢNH',
  ODD_ONE_OUT = 'TÌM VẬT KHÁC BIỆT', // Added new game mode
}

export enum DifficultyLevel {
  PRE_SCHOOL_MAM = 'Mầm (3-4 tuổi)', // Seedling
  PRE_SCHOOL_CHOI = 'Chồi (4-5 tuổi)', // Sprout
  // TODO: Add more levels for older kids later
}

export interface BaseQuestion {
  id: string;
  mode: GameMode;
  difficulty: DifficultyLevel; // Add difficulty to all questions
}

export type MathQuestionUnknownSlot = 'operand1' | 'operand2' | 'result';

export interface MathQuestion extends BaseQuestion {
  type: 'math';
  // The full, solved equation parts
  operand1True: number;
  operand2True: number;
  operator: '+' | '-';
  resultTrue: number;

  // Which part is unknown to the user
  unknownSlot: MathQuestionUnknownSlot;
  
  answer: number; // This will be operand1True if unknownSlot is 'operand1', operand2True if 'operand2', or resultTrue if 'result'.
}

export interface ComparisonQuestion extends BaseQuestion {
  type: 'comparison';
  number1: number;
  number2: number;
  answer: '<' | '>' | '=';
}

export type ShapeType = string; // Emoji string

export interface CountingQuestion extends BaseQuestion {
  type: 'counting';
  shapes: ShapeType[]; 
  iconType: ShapeType; 
  answer: number; 
  promptText: string;
}

// For Number Recognition
export interface NumberRecognitionOption {
  id: string;
  display: ShapeType[] | string; // Array of emojis for item groups, or a number string
  isCorrect: boolean;
}
export interface NumberRecognitionQuestion extends BaseQuestion {
  type: 'number_recognition';
  variant: 'number-to-items' | 'items-to-number'; // Type of recognition task
  targetNumber?: number; // For number-to-items
  targetItems?: ShapeType[]; // For items-to-number
  targetItemIcon?: ShapeType; // For items-to-number, to display the prompt "How many X?"
  options: NumberRecognitionOption[];
  promptText: string;
}

// For Matching Pairs
export interface MatchableItem {
  id: string; // Unique ID for this item on the board
  matchId: string; // ID used to find its pair
  display: string; // Emoji, number as string, or dots as string
  type: 'matching_pairs_element'; // General type for elements within a matching pairs question
  visualType: 'digit' | 'dots' | 'emoji_icon'; // Specific visual representation
  isMatched: boolean; // Has this item been successfully matched?
  isSelected: boolean; // Is this item currently selected by the user?
}
export interface MatchingPairsQuestion extends BaseQuestion {
  type: 'matching_pairs';
  items: MatchableItem[]; // All items to be displayed on the board, shuffled
  promptText: string;
}

// For Number Sequence
export interface NumberSequenceQuestion extends BaseQuestion {
  type: 'number_sequence';
  sequence: (number | null)[]; // e.g., [1, 2, null, 4, null, 6]. 'null' represents a blank.
  answers: number[];           // Array of correct answers for the blanks, in order.
  promptText: string;
  direction?: 'ascending' | 'descending'; // Optional: for Chồi level
}

// For Visual Pattern
// A single visual item, which can be an emoji string or a more complex object for transformations.
export type VisualContent = ShapeType | {
    emoji: ShapeType;
    rotation?: number; // degrees
    scale?: number; // multiplier
    flipHorizontal?: boolean;
};

// Represents one step in the displayed sequence.
// For simple rules, it's just one VisualContent.
// For grid rules, it's an object defining the grid and the element within it.
export type PatternDisplayStep = VisualContent | {
    gridSize: { rows: number; cols: number };
    element: VisualContent;
    position: { row: number; col: number }; // 0-indexed
};

export interface VisualPatternOption {
  id: string;
  display: PatternDisplayStep; // An option can also be a grid state
  isCorrect: boolean;
}

export type VisualPatternRuleType =
  // Mầm (existing)
  | 'M_ABAB' | 'M_AABB' | 'M_ABC' | 'M_AAB' | 'M_ABB'
  // Chồi - Sequence-based (existing + new)
  | 'C_ABAC' | 'C_AABCC' | 'C_ABCD' | 'C_ABCBA' | 'C_CENTER_MIRROR_X'
  | 'C_INTERLEAVING_PROGRESSION' // A-X, A-Y... (anchor with changing element)
  // Chồi - Quantity-based (existing + new)
  | 'C_PROGRESSIVE_QTY' // X, XX, XXX
  | 'C_FIBONACCI_QTY'
  | 'C_DOUBLING_QTY'
  | 'C_INTERLEAVING_QTY'
  // Chồi - Transformation-based (New)
  | 'T_GRID_MOVE'
  | 'T_ROTATE'
  | 'T_FLIP'
  | 'T_SCALE'
  // Chồi - Combined Transformations
  | 'CT_SEQUENCE_AND_MOVE'
  | 'CT_MOVE_AND_ROTATE';


export interface VisualPatternQuestion extends BaseQuestion {
  type: 'visual_pattern';
  ruleType: VisualPatternRuleType;
  // This will be an array of states to display.
  displayedSequence: PatternDisplayStep[];
  options: VisualPatternOption[];
  promptText: string;
  explanation: string; // The logic behind the correct answer
  // This is a carry-over from the old system and will be deprecated, but kept for compatibility during transition.
  // The new system relies on `options[any].isCorrect`.
  correctAnswerEmoji?: ShapeType;
}

// For Odd One Out
export interface OddOneOutOption {
  id: string;
  emoji: ShapeType;
  // isCorrect is implicit by comparing with correctAnswerId in the question
}

export interface OddOneOutQuestion extends BaseQuestion {
  type: 'odd_one_out';
  options: OddOneOutOption[]; // All items displayed to the user
  correctAnswerId: string;    // The ID of the OddOneOutOption that is the correct answer
  promptText: string;
  explanation: string; // The logic behind the correct answer
}

export type Question = 
  | MathQuestion 
  | ComparisonQuestion 
  | CountingQuestion 
  | NumberRecognitionQuestion 
  | MatchingPairsQuestion 
  | NumberSequenceQuestion 
  | VisualPatternQuestion
  | OddOneOutQuestion; // Added OddOneOutQuestion

export interface IncorrectAttempt {
  question: Question; 
  userAnswer: string | string[]; // Can be a single string or an array for multiple blanks or selected option ID
}

export interface StoredSession {
  id: string;
  timestamp: number;
  incorrectAttempts: IncorrectAttempt[];
  score: number;
  totalQuestions: number;
  difficulty?: DifficultyLevel; // Optionally store difficulty of the session
}

export interface EndGameMessageInfo {
  text: string;
  type: 'congrats' | 'encourage';
  icons: string[];
}

export interface ImageSet {
  id: string;
  name: string;
  starsRequired: number;
  icons: ShapeType[];
}

// For useGameLogic hook
export interface GameLogicState {
  questions: Question[];
  currentQuestion: Question | null;
  currentQuestionIndex: number;
  score: number;
  starsEarnedThisRound: number;
  incorrectAttempts: IncorrectAttempt[];
  incorrectAttemptsCount: number;
  feedbackMessage: string | null;
  feedbackType: 'positive' | 'encouraging' | null;
  isInputDisabled: boolean;
  lastSubmittedAnswer: string | number | string[] | null; 
  currentMatchingQuestionState: MatchingPairsQuestion | null;
  showEndGameOverlay: boolean;
  endGameMessageInfo: EndGameMessageInfo | null;
  progressPercent: number;
  gameModeTitle: string;
  isLoading: boolean;
  numQuestionsForRound: number; 
}

export interface GameLogicActions {
  submitAnswer: (userAnswer: string | number | string[]) => void; 
  selectMatchingPairItem: (itemId: string) => void;
  confirmEndGameAndNavigate: () => void;
  goToNextQuestionAfterFeedback: () => void; 
}